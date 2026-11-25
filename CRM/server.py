#!/usr/bin/env python3
"""Local Mangosteen CRM server.

Runs the static CRM UI and a small SQLite-backed JSON API without external
dependencies. This is intended for local development and client demos. Add
production authentication, HTTPS, backups, and managed infrastructure before
using real customer data over a network.
"""

from __future__ import annotations

import csv
from contextlib import closing, contextmanager
import hashlib
import hmac
import io
import json
import mimetypes
import os
import re
import secrets
import smtplib
import ssl
import sqlite3
import sys
import threading
from email.message import EmailMessage
from http.cookies import SimpleCookie
from datetime import date, datetime, timedelta
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, unquote, urlparse
from urllib.request import Request, urlopen
from typing import Iterator


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "mangosteen_crm.sqlite3"
BACKUP_DIR = ROOT / "backups"
HOST = "127.0.0.1"
DEFAULT_PORT = 4173
SESSION_COOKIE = "mangosteen_session"
SESSION_TTL = timedelta(hours=12)
PUBLIC_REQUESTS: dict[str, list[datetime]] = {}
PUBLIC_REQUESTS_LOCK = threading.Lock()
ROLE_LEVEL = {"Kitchen": 0, "Floor Staff": 1, "Cashier": 1, "Host": 1, "Manager": 2, "Owner": 3}
LOGIN_FAILURE_LIMIT = 5
LOGIN_LOCKOUT = timedelta(minutes=15)

# Keep this allow-list aligned with src/data/seating.ts. These values are
# preferences, not live inventory, but rejecting invented seats keeps the CRM
# queue trustworthy.
PUBLIC_SEATING = {
    "The rooftop": {
        "Railside 01": ("R1", 2), "Railside 02": ("R2", 2), "Railside 03": ("R3", 2),
        "Garden 01": ("G1", 4), "Garden 02": ("G2", 4), "Canopy 01": ("C1", 6),
        "Lounge 01": ("L1", 4), "Lounge 02": ("L2", 4),
    },
    "Inside Mangosteen": {
        "Window 01": ("W1", 4), "Window 02": ("W2", 4), "Dining 01": ("D1", 6),
        "Dining 02": ("D2", 4), "Sofa 01": ("S1", 4), "Sofa 02": ("S2", 2),
        "Bar side": ("B1", 2),
    },
}
ORDER_TABLES = {
    "1": {"label": "Table 01", "capacity": 2, "zoneName": "Cafe floor", "accessKey": "mg-t01-7f4c91a8e2b6350d"},
    "2": {"label": "Table 02", "capacity": 2, "zoneName": "Cafe floor", "accessKey": "mg-t02-82d1b6f5039ac74e"},
    "3": {"label": "Table 03", "capacity": 4, "zoneName": "Cafe floor", "accessKey": "mg-t03-65a9e1c7482fd30b"},
    "4": {"label": "Table 04", "capacity": 4, "zoneName": "Cafe floor", "accessKey": "mg-t04-c3b8701d6f9254ae"},
    "5": {"label": "Table 05", "capacity": 4, "zoneName": "Cafe floor", "accessKey": "mg-t05-197e4a63b8d025cf"},
}
GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJB_gCKYDjYjkRZrVPCUTqeLw"


SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'Member',
  visits INTEGER NOT NULL DEFAULT 0 CHECK (visits >= 0),
  lifetime_spend REAL NOT NULL DEFAULT 0 CHECK (lifetime_spend >= 0),
  month_spend REAL NOT NULL DEFAULT 0 CHECK (month_spend >= 0),
  last_visit TEXT,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  tags TEXT NOT NULL DEFAULT '[]',
  avatar TEXT NOT NULL DEFAULT '#456d60',
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  birthday TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_date TEXT NOT NULL,
  reservation_time TEXT NOT NULL,
  customer_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  guests INTEGER NOT NULL DEFAULT 1 CHECK (guests > 0),
  table_name TEXT NOT NULL DEFAULT 'Best available',
  occasion TEXT NOT NULL DEFAULT 'Regular visit',
  status TEXT NOT NULL DEFAULT 'Pending',
  special_requests TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  schedule_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  audience INTEGER NOT NULL DEFAULT 0,
  opened_rate REAL,
  redeemed INTEGER NOT NULL DEFAULT 0,
  revenue REAL NOT NULL DEFAULT 0,
  offer_code TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  background TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Unresolved',
  source TEXT NOT NULL DEFAULT 'QR feedback',
  avatar TEXT NOT NULL DEFAULT '#456d60',
  created_at TEXT NOT NULL,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Open',
  task_type TEXT NOT NULL DEFAULT 'General',
  due_at TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  points_cost INTEGER NOT NULL DEFAULT 0,
  eligibility TEXT NOT NULL DEFAULT 'All tiers',
  redemptions INTEGER NOT NULL DEFAULT 0,
  expiry_label TEXT NOT NULL DEFAULT '90 days',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS monthly_metrics (
  month TEXT PRIMARY KEY,
  returning_visits INTEGER NOT NULL DEFAULT 0,
  revenue REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'Host' CHECK (role IN ('Owner', 'Manager', 'Host', 'Cashier', 'Kitchen', 'Floor Staff')),
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS communications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'Transactional',
  status TEXT NOT NULL DEFAULT 'Queued',
  provider TEXT NOT NULL DEFAULT 'Demo outbox',
  created_by INTEGER,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  error TEXT NOT NULL DEFAULT '',
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS point_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public_submissions (
  request_key TEXT PRIMARY KEY,
  reservation_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public_order_submissions (
  request_key TEXT PRIMARY KEY,
  order_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'General',
  price REAL NOT NULL CHECK (price >= 0),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public_menu_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL CHECK (price >= 0),
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  UNIQUE(category, name)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level REAL NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  menu_item_id INTEGER NOT NULL,
  inventory_item_id INTEGER NOT NULL,
  quantity REAL NOT NULL CHECK (quantity > 0),
  PRIMARY KEY(menu_item_id, inventory_item_id),
  FOREIGN KEY(menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY(inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  subtotal REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  ready_at TEXT,
  paid_at TEXT,
  public_token TEXT,
  table_code TEXT,
  table_label TEXT,
  guest_name TEXT,
  phone TEXT,
  notes TEXT,
  service_charge REAL NOT NULL DEFAULT 0,
  payment_preference TEXT,
  bill_requested_at TEXT,
  served_at TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 20,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_token TEXT NOT NULL UNIQUE,
  request_type TEXT NOT NULL CHECK (request_type IN ('waiter', 'bill')),
  table_code TEXT NOT NULL,
  table_label TEXT NOT NULL,
  order_id INTEGER,
  payment_preference TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TEXT NOT NULL,
  acknowledged_at TEXT,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  menu_item_id INTEGER,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('Cash', 'UPI', 'Card')),
  amount REAL NOT NULL CHECK (amount >= 0),
  created_by INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_item_id INTEGER NOT NULL,
  order_id INTEGER,
  quantity REAL NOT NULL,
  reason TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY(inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  supplies TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  balance REAL NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  expense_date TEXT NOT NULL,
  vendor_id INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  job_role TEXT NOT NULL,
  shift_start TEXT NOT NULL,
  shift_end TEXT NOT NULL,
  monthly_salary REAL NOT NULL DEFAULT 0 CHECK (monthly_salary >= 0),
  user_id INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL,
  attendance_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Late', 'Leave', 'Absent')),
  check_in TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE(staff_id, attendance_date),
  FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  csrf_token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_attempts (
  attempt_key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);
"""


CUSTOMER_SEED = [
    ("Aarav Mehta", "+91 98765 42018", "aarav.m@example.com", "Platinum", 18, 42680, 8420, 2840, ["VIP", "Coffee lover"], "#6d3d62", 1, "12 Dec", "Window seating; cold brew."),
    ("Riya Sharma", "+91 98270 11342", "riya.s@example.com", "Gold", 12, 28150, 5240, 1720, ["Birthday soon"], "#2b6b59", 1, "27 Nov", "Prefers quiet tables."),
    ("Kabir Jain", "+91 98930 77452", "kabir.j@example.com", "Gold", 9, 21490, 4680, 1390, ["Vegetarian", "Regular"], "#96713e", 1, "18 Mar", "Strict vegetarian."),
    ("Ananya Verma", "+91 97555 20841", "ananya.v@example.com", "Silver", 7, 14320, 3140, 860, ["Desserts"], "#506faa", 1, "03 Aug", "Likes seasonal desserts."),
    ("Vihaan Patel", "+91 99812 66548", "vihaan.p@example.com", "Member", 3, 6240, 1980, 320, ["New"], "#4f7a78", 0, "21 Jan", ""),
    ("Sara Khan", "+91 93021 58277", "sara.k@example.com", "Platinum", 21, 48910, 9360, 3150, ["VIP", "Celebrations"], "#8c4d50", 1, "05 Feb", "Often books celebrations."),
    ("Arjun Malhotra", "+91 98265 84190", "arjun.m@example.com", "Silver", 6, 11880, 0, 690, ["At risk"], "#596a82", 1, "14 Sep", "No visit this month."),
    ("Meera Joshi", "+91 94066 29831", "meera.j@example.com", "Gold", 11, 24760, 2860, 1510, ["Vegan", "Regular"], "#7f5b85", 1, "29 Jun", "Vegan menu only."),
    ("Devika Shah", "+91 97131 11427", "devika.s@example.com", "Member", 2, 3860, 2180, 236, ["New", "QR signup"], "#846056", 1, "09 Apr", "Joined through table QR."),
    ("Aditya Rao", "+91 98933 26844", "aditya.r@example.com", "Silver", 5, 9780, 1940, 542, ["Coffee date"], "#3d7180", 1, "17 Jul", "Usually visits after 5 PM."),
    ("Neha Kapoor", "+91 94250 77411", "neha.k@example.com", "Member", 2, 4920, 2460, 280, ["Family dining"], "#8c596f", 0, "25 May", ""),
    ("Nikhil Das", "+91 97530 62018", "nikhil.d@example.com", "Member", 4, 6840, 1480, 410, ["Recovery open"], "#537878", 1, "30 Oct", "Service recovery case open."),
]


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 240_000)
    return f"{salt.hex()}${digest.hex()}"


def password_matches(password: str, encoded: str) -> bool:
    try:
        salt_hex, digest_hex = encoded.split("$", 1)
        calculated = password_hash(password, bytes.fromhex(salt_hex)).split("$", 1)[1]
        return hmac.compare_digest(calculated, digest_hex)
    except (ValueError, TypeError):
        return False


def safe_json(value: str, default=None):
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return default


def setting_value(connection: sqlite3.Connection, key: str, default=None):
    row = connection.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
    return safe_json(row["value"], default) if row else default


def configured_tables(connection: sqlite3.Connection) -> dict[str, dict]:
    stored = setting_value(connection, "managed_tables", {}) or {}
    result = {}
    for table_id, default in ORDER_TABLES.items():
        custom = stored.get(table_id, {}) if isinstance(stored, dict) else {}
        result[table_id] = {**default, **custom, "id": table_id,
                            "active": bool(custom.get("active", True))}
    return result


def validate_order_table(connection: sqlite3.Connection, table_code: str, access_key: str) -> dict:
    table = configured_tables(connection).get(table_code)
    if not table or not table["active"] or not hmac.compare_digest(table["accessKey"], access_key):
        raise PermissionError("Scan the QR fixed to your table to use ordering and table services.")
    return table


def public_menu_payload(connection: sqlite3.Connection) -> dict:
    categories: dict[str, list[dict]] = {}
    for row in connection.execute("SELECT * FROM public_menu_items ORDER BY rowid"):
        categories.setdefault(row["category"], []).append({
            "id": row["id"], "name": row["name"], "description": row["description"],
            "price": row["price"], "available": bool(row["active"]),
        })
    return {"categories": [{"name": name, "items": items} for name, items in categories.items()],
            "updatedAt": now_iso()}


def queue_daily_operations_notifications(connection: sqlite3.Connection, force: bool = False) -> dict:
    run_date = date.today().isoformat()
    runs = setting_value(connection, "scheduled_runs", {}) or {}
    if not force and run_date in runs:
        return {"queued": 0, "skipped": True, "date": run_date}
    recipient = str(setting_value(connection, "operations_alert_recipient", "")).strip()
    if not recipient:
        raise ValueError("Add an operations alert recipient in Settings first")
    sales_row = connection.execute(
        "SELECT COUNT(*) AS bills, COALESCE(SUM(amount), 0) AS sales FROM payments WHERE substr(created_at,1,10)=?",
        (run_date,),
    ).fetchone()
    order_count = connection.execute("SELECT COUNT(*) FROM orders WHERE substr(created_at,1,10)=?", (run_date,)).fetchone()[0]
    low_stock = rows(connection, "SELECT * FROM inventory_items WHERE quantity<=reorder_level ORDER BY name")
    messages = []
    if setting_value(connection, "daily_sales_report_enabled", True):
        messages.append(("Daily sales summary", f'Mangosteen daily summary · {run_date}: {order_count} orders, {sales_row["bills"]} settled bills, sales ₹{sales_row["sales"]:,.0f}.'))
    if setting_value(connection, "low_stock_alert_enabled", True) and low_stock:
        stock_text = ", ".join(f'{item["name"]} ({item["quantity"]:g} {item["unit"]})' for item in low_stock)
        messages.append(("Low-stock alert", f"Mangosteen low-stock alert: {stock_text}."))
    timestamp = now_iso()
    connection.executemany(
        """INSERT INTO communications
           (channel, recipient, subject, message, purpose, status, provider, created_at)
           VALUES ('WhatsApp', ?, ?, ?, 'Transactional', 'Queued', 'Scheduled local outbox', ?)""",
        [(recipient, subject, message, timestamp) for subject, message in messages],
    )
    runs[run_date] = {"ranAt": timestamp, "queued": len(messages)}
    connection.execute("INSERT INTO settings (key,value) VALUES ('scheduled_runs',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(runs),))
    connection.execute("INSERT INTO activities (kind,title,details,created_at) VALUES ('notification','Daily operations alerts prepared',?,?)", (f'{len(messages)} messages queued', timestamp))
    return {"queued": len(messages), "skipped": False, "date": run_date}


def seed_public_menu(connection: sqlite3.Connection) -> None:
    catalog_path = ROOT.parent / "shared" / "menu-catalog.json"
    if not catalog_path.exists():
        return
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    timestamp = now_iso()
    for category in catalog:
        for index, item in enumerate(category.get("items", []), 1):
            item_id = f'{category["name"]}:{index}'
            connection.execute(
                """INSERT OR IGNORE INTO public_menu_items
                   (id, category, name, description, price, active, updated_at)
                   VALUES (?, ?, ?, ?, ?, 1, ?)""",
                (item_id, category["name"], item["name"], item.get("description", ""), item["price"], timestamp),
            )


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def normalize_phone(value: str) -> str:
    value = value.strip()
    digits = re.sub(r"\D", "", value)
    if len(digits) == 10:
        digits = f"91{digits}"
    if not 10 <= len(digits) <= 15:
        raise ValueError("Please enter a valid mobile number")
    return f"+{digits}"


def find_customer_by_phone(connection: sqlite3.Connection, phone: str):
    direct = connection.execute("SELECT id, phone FROM customers WHERE phone=?", (phone,)).fetchone()
    if direct:
        return direct
    for customer in connection.execute("SELECT id, phone FROM customers"):
        try:
            if normalize_phone(customer["phone"]) == phone:
                return customer
        except ValueError:
            continue
    return None


def validate_public_seating(area: str, table_name: str, seats: object, guests: int) -> list[str]:
    clusters = PUBLIC_SEATING.get(area)
    cluster = clusters.get(table_name) if clusters else None
    if not cluster or not isinstance(seats, list) or len(seats) != guests:
        raise ValueError("Please select a valid seating group for every guest")
    prefix, capacity = cluster
    normalized = [str(seat) for seat in seats]
    allowed = {f"{prefix}-{index}" for index in range(1, capacity + 1)}
    if len(set(normalized)) != guests or any(seat not in allowed for seat in normalized):
        raise ValueError("Please select valid, unique seats in one seating group")
    return normalized


def month_keys(count: int = 12) -> list[str]:
    today = date.today().replace(day=1)
    result = []
    cursor = today
    for _ in range(count):
        result.append(cursor.strftime("%Y-%m"))
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    return list(reversed(result))


def seed_database(connection: sqlite3.Connection) -> None:
    if connection.execute("SELECT COUNT(*) FROM customers").fetchone()[0]:
        return

    created = now_iso()
    today = date.today()
    last_visit_offsets = [0, 1, 3, 5, 9, 11, 19, 22, 0, 2, 6, 8]
    for item, offset in zip(CUSTOMER_SEED, last_visit_offsets):
        name, phone, email, tier, visits, spend, month_spend, points, tags, avatar, consent, birthday, notes = item
        connection.execute(
            """INSERT INTO customers
               (name, phone, email, tier, visits, lifetime_spend, month_spend,
                last_visit, points, tags, avatar, marketing_consent, birthday,
                notes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (name, phone, email, tier, visits, spend, month_spend,
             (today - timedelta(days=offset)).isoformat(), points,
             json.dumps(tags), avatar, consent, birthday, notes, created),
        )

    reservations = [
        (0, "16:00", "Riya Sharma", "+91 98270 11342", 4, "T-04", "Birthday", "Confirmed", "Birthday cake at 5 PM"),
        (0, "17:30", "Aditya Rao", "+91 98933 26844", 2, "T-11", "Coffee date", "Confirmed", "Quiet corner"),
        (0, "19:00", "Sara Khan", "+91 93021 58277", 8, "Garden", "Anniversary", "Confirmed", "Flowers arranged"),
        (0, "19:30", "Neha Kapoor", "+91 94250 77411", 5, "T-08", "Dinner", "Pending", "High chair requested"),
        (0, "20:15", "Kabir Jain", "+91 98930 77452", 3, "T-02", "Dinner", "Confirmed", "Strict vegetarian"),
        (1, "13:00", "Devika Shah", "+91 97131 11427", 2, "Window", "Lunch", "Confirmed", ""),
        (1, "18:30", "Aarav Mehta", "+91 98765 42018", 2, "Window", "Regular visit", "Confirmed", "Usual table"),
        (-2, "20:00", "Nikhil Das", "+91 97530 62018", 4, "T-06", "Dinner", "Completed", ""),
        (-3, "19:00", "Meera Joshi", "+91 94066 29831", 3, "Garden", "Dinner", "Completed", "Vegan menu"),
        (-7, "18:00", "Walk-in Guest", "", 2, "T-09", "Regular visit", "No-show", ""),
    ]
    customer_lookup = {row["name"]: row["id"] for row in connection.execute("SELECT id, name FROM customers")}
    for offset, time_value, name, phone, guests, table_name, occasion, status, requests in reservations:
        connection.execute(
            """INSERT INTO reservations
               (reservation_date, reservation_time, customer_id, name, phone,
                guests, table_name, occasion, status, special_requests, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            ((today + timedelta(days=offset)).isoformat(), time_value,
             customer_lookup.get(name), name, phone, guests, table_name,
             occasion, status, requests, created),
        )

    campaigns = [
        ("Weekend coffee ritual", "WhatsApp", "Sent 19 Nov", "Delivered", 248, 82, 32, 38400, "WEEKEND20", "Your weekend coffee ritual awaits.", "linear-gradient(135deg, #0b1730, #3156c8)"),
        ("November birthday treat", "WhatsApp", "Active until 30 Nov", "Active", 34, 88, 11, 16950, "BDAY", "A birthday dessert is waiting for you.", "linear-gradient(135deg, #261548, #6b4bc3)"),
        ("We miss you, come back", "Email + WhatsApp", "Scheduled 24 Nov", "Scheduled", 68, None, 0, 0, "COMEBACK", "It has been a while. Enjoy a warm welcome back.", "linear-gradient(135deg, #503719, #b98b43)"),
        ("Chef's winter menu", "Email", "Draft updated today", "Draft", 0, None, 0, 0, "", "A first look at the new winter menu.", "linear-gradient(135deg, #17243c, #315b83)"),
    ]
    connection.executemany(
        """INSERT INTO campaigns
           (name, channel, schedule_label, status, audience, opened_rate,
            redeemed, revenue, offer_code, message, background, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [(*campaign, created) for campaign in campaigns],
    )

    feedback_rows = [
        ("Aarav Mehta", "Aarav Mehta", 5, "Beautiful ambience and the cold brew was excellent. The team remembered my usual table.", "Resolved", "QR feedback", "#6d3d62", -0.1),
        (None, "Priya Nair", 3, "Food was very good, but our order took longer than expected during lunch.", "Unresolved", "QR feedback", "#a0634b", -0.2),
        ("Kabir Jain", "Kabir Jain", 5, "The staff handled our dietary requests perfectly.", "Resolved", "Google review", "#96713e", -1),
        ("Nikhil Das", "Nikhil Das", 2, "We had to ask twice for the bill and the outdoor table was not clean.", "Unresolved", "QR feedback", "#537878", -1.2),
        ("Meera Joshi", "Meera Joshi", 5, "Excellent vegan recommendations and friendly service.", "Resolved", "QR feedback", "#7f5b85", -2),
    ]
    for customer_key, name, rating, message, status, source, avatar, day_offset in feedback_rows:
        timestamp = datetime.now().astimezone() + timedelta(days=day_offset)
        connection.execute(
            """INSERT INTO feedback
               (customer_id, name, rating, message, status, source, avatar, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (customer_lookup.get(customer_key) if customer_key else None, name, rating, message, status, source, avatar,
             timestamp.isoformat(timespec="seconds")),
        )

    task_rows = [
        ("Call Nikhil about table cleanliness", "Assigned to Priya", "High", "Open", "Recovery", "17:30"),
        ("Review lunch service delay", "Assigned to Aman", "High", "Open", "Recovery", "18:00"),
        ("Prepare Riya's birthday table", "Cake note and preferred seating saved", "Medium", "Open", "Reservation", "15:30"),
    ]
    connection.executemany(
        """INSERT INTO tasks
           (title, details, priority, status, task_type, due_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [(*task, created) for task in task_rows],
    )

    reward_rows = [
        ("Birthday dessert", "One signature dessert", 0, "All tiers", 84, "Birthday month", "Active"),
        ("Any handcrafted coffee", "Dine-in or takeaway", 500, "All tiers", 126, "90 days", "Active"),
        ("Chef's table experience", "Curated dinner for two", 3000, "Gold & Platinum", 18, "180 days", "Active"),
    ]
    connection.executemany(
        """INSERT INTO rewards
           (name, description, points_cost, eligibility, redemptions,
            expiry_label, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [(*reward, created) for reward in reward_rows],
    )

    activity_rows = [
        ("customer", "New guest profile created", "Devika Shah joined through table QR"),
        ("reward", "Reward redeemed", "Aarav used a complimentary dessert"),
        ("reservation", "Reservation confirmed", "8 guests · Anniversary · 7:00 PM"),
        ("feedback", "5-star feedback received", "The cold brew was excellent"),
        ("alert", "Recovery task assigned", "Manager follow-up due by 6:00 PM"),
    ]
    for index, row in enumerate(activity_rows):
        timestamp = datetime.now().astimezone() - timedelta(minutes=index * 14 + 4)
        connection.execute(
            "INSERT INTO activities (kind, title, details, created_at) VALUES (?, ?, ?, ?)",
            (*row, timestamp.isoformat(timespec="seconds")),
        )

    returning_values = [34, 46, 39, 61, 54, 72, 67, 83, 78, 96, 91, 112]
    revenue_values = [148000, 163500, 154200, 192600, 184300, 216800, 207400, 238900, 229600, 262400, 251900, 284600]
    connection.executemany(
        "INSERT INTO monthly_metrics (month, returning_visits, revenue) VALUES (?, ?, ?)",
        list(zip(month_keys(), returning_values, revenue_values)),
    )

    defaults = {
        "business_name": "Mangosteen Cafe",
        "primary_phone": "+91 98765 43210",
        "address": "Olympus, near Mayank Blue Water Park Road, Bicholi Mardana, Indore",
        "timezone": "Asia/Kolkata (IST)",
        "currency": "Indian Rupee (₹)",
        "points_per_rupee": 0.1,
        "automatic_points": True,
        "reservation_reminders": True,
        "marketing_requires_consent": True,
        "backup_enabled": True,
        "backup_retention_days": 30,
        "tier_silver": 8000,
        "tier_gold": 18000,
        "tier_platinum": 35000,
        "feedback_url": "http://127.0.0.1:4173/feedback",
    }
    connection.executemany(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        [(key, json.dumps(value)) for key, value in defaults.items()],
    )
    connection.commit()


def migrate_user_roles(connection: sqlite3.Connection) -> None:
    record = connection.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
    ).fetchone()
    if not record or "'Floor Staff'" in (record["sql"] or ""):
        return
    connection.commit()
    connection.execute("PRAGMA foreign_keys = OFF")
    connection.executescript(
        """
        CREATE TABLE users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL DEFAULT 'Host' CHECK (role IN ('Owner', 'Manager', 'Host', 'Cashier', 'Kitchen', 'Floor Staff')),
          password_hash TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          last_login_at TEXT
        );
        INSERT INTO users_new (id, name, email, role, password_hash, active, created_at, last_login_at)
        SELECT id, name, email, role, password_hash, active, created_at, last_login_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        """
    )
    connection.execute("PRAGMA foreign_keys = ON")
    connection.commit()


def seed_operation_users(connection: sqlite3.Connection) -> None:
    created = now_iso()
    demo_users = [
        ("Rohan Sharma", "manager@mangosteen.local", "Manager"),
        ("Pooja Verma", "cashier@mangosteen.local", "Cashier"),
        ("Kitchen Team", "kitchen@mangosteen.local", "Kitchen"),
        ("Floor Team", "floor@mangosteen.local", "Floor Staff"),
        ("Guest Relations", "host@mangosteen.local", "Host"),
    ]
    for name, email, role in demo_users:
        connection.execute(
            """INSERT OR IGNORE INTO users (name, email, role, password_hash, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            (name, email, role, password_hash("Mangosteen@123"), created),
        )
    connection.commit()


def migrate_qr_table_service(connection: sqlite3.Connection) -> None:
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(orders)")}
    additions = {
        "public_token": "TEXT",
        "table_code": "TEXT",
        "table_label": "TEXT",
        "guest_name": "TEXT",
        "phone": "TEXT",
        "notes": "TEXT",
        "service_charge": "REAL NOT NULL DEFAULT 0",
        "payment_preference": "TEXT",
        "bill_requested_at": "TEXT",
        "served_at": "TEXT",
        "estimated_minutes": "INTEGER NOT NULL DEFAULT 20",
    }
    for name, definition in additions.items():
        if name not in columns:
            connection.execute(f"ALTER TABLE orders ADD COLUMN {name} {definition}")
    connection.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_token ON orders(public_token)")
    connection.commit()


def seed_operations(connection: sqlite3.Connection) -> None:
    if connection.execute("SELECT COUNT(*) FROM menu_items").fetchone()[0]:
        return
    created = now_iso()
    today = date.today().isoformat()
    menu_rows = [
        ("Cold Coffee", "Beverages", 180), ("Cappuccino", "Beverages", 160),
        ("Masala Chai", "Beverages", 80), ("Maggi", "Quick bites", 140),
        ("Paneer Sandwich", "Sandwiches", 180), ("Cheese Toast", "Sandwiches", 150),
        ("Peri Peri Fries", "Sides", 100), ("Chocolate Brownie", "Desserts", 140),
    ]
    connection.executemany(
        "INSERT INTO menu_items (name, category, price, created_at) VALUES (?, ?, ?, ?)",
        [(*row, created) for row in menu_rows],
    )
    inventory_rows = [
        ("Doodh", "L", 12, 4), ("Coffee beans", "kg", 2.4, 0.75),
        ("Bread", "pcs", 40, 12), ("Paneer", "kg", 3, 0.8),
        ("Cheese slices", "pcs", 60, 15), ("Potato", "kg", 8, 2),
        ("Maggi packs", "pcs", 24, 8), ("Tea leaves", "kg", 1.5, 0.4),
        ("Sugar", "kg", 6, 1.5), ("Chocolate syrup", "L", 2, 0.5),
    ]
    connection.executemany(
        """INSERT INTO inventory_items (name, unit, quantity, reorder_level, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        [(*row, created) for row in inventory_rows],
    )
    menu_ids = {row["name"]: row["id"] for row in connection.execute("SELECT id, name FROM menu_items")}
    stock_ids = {row["name"]: row["id"] for row in connection.execute("SELECT id, name FROM inventory_items")}
    recipes = {
        "Cold Coffee": [("Doodh", 0.25), ("Coffee beans", 0.025), ("Sugar", 0.02)],
        "Cappuccino": [("Doodh", 0.2), ("Coffee beans", 0.02), ("Sugar", 0.01)],
        "Masala Chai": [("Doodh", 0.15), ("Tea leaves", 0.012), ("Sugar", 0.015)],
        "Maggi": [("Maggi packs", 1)],
        "Paneer Sandwich": [("Bread", 2), ("Paneer", 0.12), ("Cheese slices", 1)],
        "Cheese Toast": [("Bread", 2), ("Cheese slices", 2)],
        "Peri Peri Fries": [("Potato", 0.25)],
        "Chocolate Brownie": [("Chocolate syrup", 0.03)],
    }
    for menu_name, ingredients in recipes.items():
        connection.executemany(
            "INSERT INTO recipes (menu_item_id, inventory_item_id, quantity) VALUES (?, ?, ?)",
            [(menu_ids[menu_name], stock_ids[stock_name], quantity) for stock_name, quantity in ingredients],
        )

    vendors = [
        ("Sharma Dairy", "Doodh · paneer", "+91 98260 11001", 6800),
        ("Fresh Bakery", "Bread · buns", "+91 98260 11002", 2400),
        ("Bean Roasters", "Coffee beans", "+91 98260 11003", 0),
    ]
    connection.executemany(
        "INSERT INTO vendors (name, supplies, phone, balance, created_at) VALUES (?, ?, ?, ?, ?)",
        [(*row, created) for row in vendors],
    )
    vendor_ids = {row["name"]: row["id"] for row in connection.execute("SELECT id, name FROM vendors")}
    expense_rows = [
        ("Rent", "Rent", 45000, date.today().replace(day=1).isoformat(), None, "Monthly cafe rent"),
        ("Gas cylinder", "Utilities", 1100, (date.today() - timedelta(days=3)).isoformat(), None, "Kitchen gas refill"),
        ("Sharma Dairy bill", "Vendor", 6800, (date.today() - timedelta(days=2)).isoformat(), vendor_ids["Sharma Dairy"], "Milk and paneer supply"),
        ("Sabzi mandi", "Kitchen", 950, today, None, "Fresh produce"),
    ]
    connection.executemany(
        """INSERT INTO expenses (name, category, amount, expense_date, vendor_id, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [(*row, created) for row in expense_rows],
    )

    staff_rows = [
        ("Ravi Kumar", "Chef", "09:00", "18:00", 18000),
        ("Pooja Verma", "Cashier", "10:00", "19:00", 14000),
        ("Aman Singh", "Waiter", "12:00", "21:00", 12000),
        ("Sunil Yadav", "Helper", "09:00", "18:00", 10000),
    ]
    connection.executemany(
        """INSERT INTO staff (name, job_role, shift_start, shift_end, monthly_salary, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        [(*row, created) for row in staff_rows],
    )
    staff_ids = {row["name"]: row["id"] for row in connection.execute("SELECT id, name FROM staff")}
    attendance_rows = [
        (staff_ids["Ravi Kumar"], today, "Present", "08:54", ""),
        (staff_ids["Pooja Verma"], today, "Present", "09:58", ""),
        (staff_ids["Aman Singh"], today, "Late", "12:20", "20 minutes late"),
        (staff_ids["Sunil Yadav"], today, "Leave", None, "Approved leave"),
    ]
    connection.executemany(
        """INSERT INTO attendance (staff_id, attendance_date, status, check_in, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        [(*row, created) for row in attendance_rows],
    )

    owner_id = connection.execute("SELECT id FROM users WHERE role='Owner' ORDER BY id LIMIT 1").fetchone()
    creator_id = owner_id["id"] if owner_id else None
    order_specs = [
        ("T-02", "Kitchen", [("Cappuccino", 2), ("Cheese Toast", 1)], None, "10:12"),
        ("T-09", "Preparing", [("Maggi", 2), ("Masala Chai", 2)], None, "10:18"),
        ("T-06", "Ready", [("Cold Coffee", 2), ("Paneer Sandwich", 1), ("Peri Peri Fries", 1)], None, "10:22"),
        ("T-04", "Paid", [("Cold Coffee", 2), ("Chocolate Brownie", 2)], "UPI", "09:42"),
        ("T-11", "Paid", [("Cappuccino", 2), ("Paneer Sandwich", 2)], "Cash", "11:04"),
        ("Takeaway", "Paid", [("Masala Chai", 4), ("Maggi", 2)], "Card", "12:14"),
    ]
    for table_name, status, items, payment_method, time_value in order_specs:
        timestamp = f"{today}T{time_value}:00+05:30"
        total = sum(connection.execute("SELECT price FROM menu_items WHERE name=?", (name,)).fetchone()[0] * quantity for name, quantity in items)
        cursor = connection.execute(
            """INSERT INTO orders (table_name, status, subtotal, total, payment_method, created_by,
                                    created_at, sent_at, ready_at, paid_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (table_name, status, total, total, payment_method, creator_id, timestamp,
             timestamp if status != "Draft" else None, timestamp if status in {"Ready", "Paid"} else None,
             timestamp if status == "Paid" else None),
        )
        order_id = cursor.lastrowid
        for item_name, quantity in items:
            price = connection.execute("SELECT price FROM menu_items WHERE name=?", (item_name,)).fetchone()[0]
            connection.execute(
                """INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price)
                   VALUES (?, ?, ?, ?, ?)""",
                (order_id, menu_ids[item_name], item_name, quantity, price),
            )
        if payment_method:
            connection.execute(
                "INSERT INTO payments (order_id, method, amount, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
                (order_id, payment_method, total, creator_id, timestamp),
            )
    # Imported day-closing totals make the monthly operating report realistic
    # without filling the live order board with dozens of historical tickets.
    month_start = date.today().replace(day=1)
    archive_days = min(max(date.today().day - 1, 0), 18)
    methods = ("UPI", "Cash", "Card")
    for offset in range(archive_days):
        closing_date = month_start + timedelta(days=offset)
        amount = 3850 + (offset % 5) * 460 + (offset % 3) * 275
        timestamp = f"{closing_date.isoformat()}T22:45:00+05:30"
        method = methods[offset % len(methods)]
        cursor = connection.execute(
            """INSERT INTO orders (table_name, status, subtotal, total, payment_method, created_by,
                                    created_at, sent_at, ready_at, paid_at)
               VALUES (?, 'Paid', ?, ?, ?, ?, ?, ?, ?, ?)""",
            (f"POS import · {closing_date.strftime('%d %b')}", amount, amount, method, creator_id,
             timestamp, timestamp, timestamp, timestamp),
        )
        connection.execute(
            "INSERT INTO payments (order_id, method, amount, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
            (cursor.lastrowid, method, amount, creator_id, timestamp),
        )
    connection.commit()


def seed_owner(connection: sqlite3.Connection) -> None:
    if connection.execute("SELECT COUNT(*) FROM users").fetchone()[0]:
        return
    email = os.environ.get("MANGOSTEEN_OWNER_EMAIL", "owner@mangosteen.local").strip().lower()
    password = os.environ.get("MANGOSTEEN_OWNER_PASSWORD", "Mangosteen@123")
    connection.execute(
        "INSERT INTO users (name, email, role, password_hash, created_at) VALUES (?, ?, 'Owner', ?, ?)",
        ("Rahul Mehta", email, password_hash(password), now_iso()),
    )
    connection.commit()


def init_database() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as connection:
        connection.executescript(SCHEMA)
        migrate_user_roles(connection)
        migrate_qr_table_service(connection)
        seed_database(connection)
        seed_owner(connection)
        seed_operation_users(connection)
        seed_operations(connection)
        seed_public_menu(connection)
        additions = {
            "backup_enabled": True,
            "backup_retention_days": 30,
            "tier_silver": 8000,
            "tier_gold": 18000,
            "tier_platinum": 35000,
            "feedback_url": "http://127.0.0.1:4173/feedback",
            "guest_wifi_name": "Mangosteen Guest",
            "guest_wifi_password": "Mangosteen@2026",
            "guest_wifi_demo": True,
            "managed_tables": {},
            "operations_alert_recipient": "+91 98765 43210",
            "daily_sales_report_enabled": True,
            "low_stock_alert_enabled": True,
            "daily_report_time": "22:30",
        }
        connection.executemany(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
            [(key, json.dumps(value)) for key, value in additions.items()],
        )
        campaign_palette = {
            "linear-gradient(135deg, #173d32, #286b57)": "linear-gradient(135deg, #0b1730, #3156c8)",
            "linear-gradient(135deg, #6a2855, #9b4d7e)": "linear-gradient(135deg, #261548, #6b4bc3)",
            "linear-gradient(135deg, #805a27, #c18a3c)": "linear-gradient(135deg, #503719, #b98b43)",
            "linear-gradient(135deg, #3e5577, #6384b5)": "linear-gradient(135deg, #17243c, #315b83)",
        }
        connection.executemany(
            "UPDATE campaigns SET background=? WHERE background=?",
            [(new, old) for old, new in campaign_palette.items()],
        )
        connection.commit()
    ensure_daily_backup()


def create_backup(label: str = "manual") -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    safe_label = "".join(character for character in label.lower() if character.isalnum() or character == "-")[:24] or "backup"
    destination = BACKUP_DIR / f"mangosteen-{stamp}-{safe_label}.sqlite3"
    with connect() as source, closing(sqlite3.connect(destination)) as target:
        source.backup(target)
    return destination


def ensure_daily_backup() -> None:
    with connect() as connection:
        enabled = bool(setting_value(connection, "backup_enabled", True))
        retention = max(1, int(setting_value(connection, "backup_retention_days", 30)))
    if not enabled:
        return
    today_token = datetime.now().strftime("%Y%m%d")
    if not any(path.name.startswith(f"mangosteen-{today_token}") for path in BACKUP_DIR.glob("*.sqlite3")):
        create_backup("automatic")
    cutoff = datetime.now().timestamp() - retention * 86400
    for path in BACKUP_DIR.glob("*.sqlite3"):
        if path.stat().st_mtime < cutoff:
            path.unlink(missing_ok=True)


def list_backups() -> list[dict]:
    result = []
    for path in sorted(BACKUP_DIR.glob("*.sqlite3"), key=lambda item: item.stat().st_mtime, reverse=True):
        result.append({
            "name": path.name,
            "size": path.stat().st_size,
            "createdAt": datetime.fromtimestamp(path.stat().st_mtime).astimezone().isoformat(timespec="seconds"),
        })
    return result


def integration_status() -> dict:
    email_ready = all(os.environ.get(key) for key in ("MANGOSTEEN_SMTP_HOST", "MANGOSTEEN_SMTP_FROM"))
    whatsapp_ready = all(os.environ.get(key) for key in ("MANGOSTEEN_WHATSAPP_PHONE_ID", "MANGOSTEEN_WHATSAPP_TOKEN"))
    return {
        "email": {"mode": "Live" if email_ready else "Demo", "provider": "SMTP" if email_ready else "Local outbox"},
        "whatsapp": {"mode": "Live" if whatsapp_ready else "Demo", "provider": "Meta Cloud API" if whatsapp_ready else "Local outbox"},
        "pos": {"mode": "Ready", "provider": "CSV import"},
    }


def rows(connection: sqlite3.Connection, query: str, parameters=()) -> list[dict]:
    return [dict(row) for row in connection.execute(query, parameters).fetchall()]


def public_order_payload(connection: sqlite3.Connection, order: sqlite3.Row | dict) -> dict:
    record = dict(order)
    items = [{"name": row["item_name"], "quantity": row["quantity"],
              "lineTotal": row["quantity"] * row["unit_price"]}
             for row in connection.execute("SELECT * FROM order_items WHERE order_id=? ORDER BY id", (record["id"],))]
    return {
        "id": record["id"], "reference": f'QR-{record["id"]:06d}', "status": record["status"],
        "total": record["total"], "subtotal": record["subtotal"], "serviceCharge": record.get("service_charge", 0),
        "tableLabel": record.get("table_label") or record["table_name"], "guestName": record.get("guest_name") or "Guest",
        "paymentMethod": record.get("payment_method") or "", "prepaid": bool(record.get("payment_method") and record.get("paid_at")),
        "paymentPreference": record.get("payment_preference") or "", "billRequestedAt": record.get("bill_requested_at"),
        "createdAt": record["created_at"], "readyAt": record.get("ready_at"), "servedAt": record.get("served_at"),
        "paidAt": record.get("paid_at"), "estimatedMinutes": record.get("estimated_minutes") or 20, "items": items,
    }


def normalize_customer(row: dict) -> dict:
    return {
        "id": row["id"], "name": row["name"], "phone": row["phone"],
        "email": row["email"], "tier": row["tier"], "visits": row["visits"],
        "spend": row["lifetime_spend"], "monthSpend": row["month_spend"],
        "lastVisit": row["last_visit"], "points": row["points"],
        "tags": json.loads(row["tags"] or "[]"), "avatar": row["avatar"],
        "consent": bool(row["marketing_consent"]), "birthday": row["birthday"],
        "notes": row["notes"], "createdAt": row["created_at"],
    }


def operations_payload(connection: sqlite3.Connection, current_user: dict | None = None) -> dict:
    role = (current_user or {}).get("role", "Host")
    menu_items = [{"id": row["id"], "name": row["name"], "category": row["category"],
                   "price": row["price"], "active": bool(row["active"])}
                  for row in rows(connection, "SELECT * FROM menu_items ORDER BY category, name")]
    order_items: dict[int, list[dict]] = {}
    for row in rows(connection, "SELECT * FROM order_items ORDER BY id"):
        order_items.setdefault(row["order_id"], []).append({
            "id": row["id"], "menuItemId": row["menu_item_id"], "name": row["item_name"],
            "quantity": row["quantity"], "unitPrice": row["unit_price"],
            "lineTotal": row["quantity"] * row["unit_price"],
        })
    orders = [{"id": row["id"], "table": row["table_name"], "status": row["status"],
               "subtotal": row["subtotal"], "total": row["total"],
               "paymentMethod": row["payment_method"], "createdAt": row["created_at"],
               "sentAt": row["sent_at"], "readyAt": row["ready_at"], "paidAt": row["paid_at"],
               "items": order_items.get(row["id"], [])}
              for row in rows(connection, "SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 100")]
    inventory = [{"id": row["id"], "name": row["name"], "unit": row["unit"],
                  "quantity": row["quantity"], "reorderLevel": row["reorder_level"],
                  "low": row["quantity"] <= row["reorder_level"]}
                 for row in rows(connection, "SELECT * FROM inventory_items ORDER BY name")]
    vendors = [{"id": row["id"], "name": row["name"], "supplies": row["supplies"],
                "phone": row["phone"], "balance": row["balance"],
                "status": "Paid" if row["balance"] <= 0 else "Due"}
               for row in rows(connection, "SELECT * FROM vendors ORDER BY name")]
    expenses = [{"id": row["id"], "name": row["name"], "category": row["category"],
                 "amount": row["amount"], "date": row["expense_date"],
                 "vendorId": row["vendor_id"], "note": row["note"]}
                for row in rows(connection, "SELECT * FROM expenses ORDER BY expense_date DESC, id DESC LIMIT 100")]
    attendance_lookup = {row["staff_id"]: dict(row) for row in connection.execute(
        "SELECT * FROM attendance WHERE attendance_date=?", (date.today().isoformat(),)
    )}
    staff = []
    for row in rows(connection, "SELECT * FROM staff WHERE active=1 ORDER BY id"):
        attendance = attendance_lookup.get(row["id"])
        staff.append({"id": row["id"], "name": row["name"], "jobRole": row["job_role"],
                      "shiftStart": row["shift_start"], "shiftEnd": row["shift_end"],
                      "salary": row["monthly_salary"], "userId": row["user_id"],
                      "attendance": {"status": attendance["status"], "checkIn": attendance["check_in"],
                                     "note": attendance["note"]} if attendance else None})
    payments = [{"id": row["id"], "orderId": row["order_id"], "method": row["method"],
                 "amount": row["amount"], "createdAt": row["created_at"]}
                for row in rows(connection, "SELECT * FROM payments ORDER BY id DESC LIMIT 200")]
    service_requests = [{"id": row["id"], "type": row["request_type"], "tableCode": row["table_code"],
                         "tableLabel": row["table_label"], "orderId": row["order_id"],
                         "paymentPreference": row["payment_preference"], "status": row["status"],
                         "createdAt": row["created_at"], "acknowledgedAt": row["acknowledged_at"]}
                        for row in rows(connection, "SELECT * FROM service_requests ORDER BY id DESC LIMIT 50")]
    if role == "Floor Staff":
        return {"menuItems": [], "orders": orders, "inventory": [], "expenses": [],
                "vendors": [], "staff": [], "payments": [], "serviceRequests": service_requests}
    if role == "Kitchen":
        return {"menuItems": menu_items, "orders": orders, "inventory": [], "expenses": [],
                "vendors": [], "staff": [], "payments": [], "serviceRequests": service_requests}
    if role in {"Cashier", "Host"}:
        return {"menuItems": menu_items, "orders": orders, "inventory": [], "expenses": [],
                "vendors": [], "staff": [], "payments": payments, "serviceRequests": service_requests}
    return {"menuItems": menu_items, "orders": orders, "inventory": inventory,
            "expenses": expenses, "vendors": vendors, "staff": staff, "payments": payments,
            "serviceRequests": service_requests}


def send_order_to_kitchen(connection: sqlite3.Connection, order_id: int, user_id: int) -> None:
    order = connection.execute("SELECT status FROM orders WHERE id=?", (order_id,)).fetchone()
    if not order:
        raise ValueError("Order not found")
    if order["status"] != "Draft":
        raise ValueError("Only draft orders can be sent to the kitchen")
    requirements = rows(
        connection,
        """SELECT inventory_items.id, inventory_items.name, inventory_items.quantity AS available,
                  inventory_items.unit, SUM(recipes.quantity * order_items.quantity) AS required
           FROM order_items
           JOIN recipes ON recipes.menu_item_id=order_items.menu_item_id
           JOIN inventory_items ON inventory_items.id=recipes.inventory_item_id
           WHERE order_items.order_id=?
           GROUP BY inventory_items.id""",
        (order_id,),
    )
    shortages = [item for item in requirements if item["available"] + 1e-9 < item["required"]]
    if shortages:
        item = shortages[0]
        raise ValueError(f'Not enough {item["name"]}: {item["available"]:g} {item["unit"]} available')
    timestamp = now_iso()
    for item in requirements:
        connection.execute(
            "UPDATE inventory_items SET quantity=MAX(0, quantity-?) WHERE id=?",
            (item["required"], item["id"]),
        )
        connection.execute(
            """INSERT INTO inventory_movements
               (inventory_item_id, order_id, quantity, reason, created_by, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (item["id"], order_id, -item["required"], "Order consumption", user_id, timestamp),
        )
    connection.execute("UPDATE orders SET status='Kitchen', sent_at=? WHERE id=?", (timestamp, order_id))
    connection.execute(
        "INSERT INTO activities (kind, title, details, created_at) VALUES ('reservation', ?, ?, ?)",
        ("Order sent to kitchen", f"Order #{order_id}", timestamp),
    )


def bootstrap_payload(connection: sqlite3.Connection, current_user: dict | None = None) -> dict:
    customers = [normalize_customer(row) for row in rows(connection, "SELECT * FROM customers ORDER BY id DESC")]
    reservations = []
    for row in rows(connection, "SELECT * FROM reservations ORDER BY reservation_date, reservation_time"):
        reservations.append({
            "id": row["id"], "date": row["reservation_date"], "time": row["reservation_time"],
            "customerId": row["customer_id"], "name": row["name"], "phone": row["phone"],
            "guests": row["guests"], "table": row["table_name"], "occasion": row["occasion"],
            "status": row["status"], "specialRequests": row["special_requests"],
            "createdAt": row["created_at"],
        })
    campaigns = []
    for row in rows(connection, "SELECT * FROM campaigns ORDER BY id DESC"):
        campaigns.append({
            "id": row["id"], "name": row["name"], "channel": row["channel"],
            "date": row["schedule_label"], "status": row["status"], "audience": row["audience"],
            "opened": None if row["opened_rate"] is None else f'{row["opened_rate"]:g}%',
            "openedRate": row["opened_rate"], "redeemed": row["redeemed"],
            "revenue": row["revenue"], "offerCode": row["offer_code"],
            "message": row["message"], "bg": row["background"], "createdAt": row["created_at"],
        })
    feedback = []
    for row in rows(connection, "SELECT * FROM feedback ORDER BY created_at DESC"):
        feedback.append({
            "id": row["id"], "customerId": row["customer_id"], "name": row["name"],
            "rating": row["rating"], "text": row["message"], "status": row["status"],
            "source": row["source"], "avatar": row["avatar"], "createdAt": row["created_at"],
        })
    tasks = [{"id": row["id"], "title": row["title"], "details": row["details"],
              "priority": row["priority"], "status": row["status"], "type": row["task_type"],
              "dueAt": row["due_at"], "createdAt": row["created_at"]}
             for row in rows(connection, "SELECT * FROM tasks ORDER BY status DESC, id DESC")]
    rewards = [{"id": row["id"], "name": row["name"], "description": row["description"],
                "points": row["points_cost"], "eligibility": row["eligibility"],
                "redemptions": row["redemptions"], "expiry": row["expiry_label"],
                "status": row["status"]}
               for row in rows(connection, "SELECT * FROM rewards ORDER BY id")]
    activities = [{"id": row["id"], "kind": row["kind"], "title": row["title"],
                   "details": row["details"], "createdAt": row["created_at"]}
                  for row in rows(connection, "SELECT * FROM activities ORDER BY created_at DESC LIMIT 10")]
    metrics = [{"month": row["month"], "returningVisits": row["returning_visits"], "revenue": row["revenue"]}
               for row in rows(connection, "SELECT * FROM monthly_metrics ORDER BY month")]
    settings = {row["key"]: safe_json(row["value"], row["value"]) for row in rows(connection, "SELECT * FROM settings")}
    users = [{"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"],
              "active": bool(row["active"]), "createdAt": row["created_at"], "lastLoginAt": row["last_login_at"]}
             for row in rows(connection, "SELECT id, name, email, role, active, created_at, last_login_at FROM users ORDER BY id")]
    communications = [{"id": row["id"], "customerId": row["customer_id"], "channel": row["channel"],
                       "recipient": row["recipient"], "subject": row["subject"], "message": row["message"],
                       "purpose": row["purpose"], "status": row["status"], "provider": row["provider"],
                       "createdAt": row["created_at"], "sentAt": row["sent_at"], "error": row["error"]}
                      for row in rows(connection, "SELECT * FROM communications ORDER BY id DESC LIMIT 25")]
    point_ledger = [{"id": row["id"], "customerId": row["customer_id"], "points": row["points"],
                     "reason": row["reason"], "createdAt": row["created_at"]}
                    for row in rows(connection, "SELECT * FROM point_ledger ORDER BY id DESC LIMIT 25")]
    role_level = ROLE_LEVEL.get((current_user or {}).get("role", "Host"), 1)
    operations = operations_payload(connection, current_user)
    public_menu_items = [{"id": row["id"], "category": row["category"], "name": row["name"],
                          "description": row["description"], "price": row["price"],
                          "active": bool(row["active"]), "updatedAt": row["updated_at"]}
                         for row in rows(connection, "SELECT * FROM public_menu_items ORDER BY rowid")]
    tables = [{key: value for key, value in table.items() if key != "accessKey"}
              for table in configured_tables(connection).values()]
    if (current_user or {}).get("role") in {"Kitchen", "Floor Staff"}:
        customers, reservations, campaigns, feedback, tasks, rewards, activities, metrics = [], [], [], [], [], [], [], []
        settings = {}
    return {"customers": customers, "reservations": reservations, "campaigns": campaigns,
            "feedback": feedback, "tasks": tasks, "rewards": rewards,
            "activities": activities, "monthlyMetrics": metrics, "settings": settings,
            "users": users if role_level >= ROLE_LEVEL["Manager"] else [],
            "communications": communications if role_level >= ROLE_LEVEL["Manager"] else [],
            "pointLedger": point_ledger if role_level >= ROLE_LEVEL["Manager"] else [],
            "backups": list_backups() if role_level >= ROLE_LEVEL["Owner"] else [],
            "integrations": integration_status() if role_level >= ROLE_LEVEL["Manager"] else {},
            "publicMenuItems": public_menu_items if role_level >= ROLE_LEVEL["Manager"] else [],
            "tables": tables if role_level >= ROLE_LEVEL["Manager"] else [],
            **operations,
            "user": current_user}


def parse_bool(value) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "y", "opted in", "consented"}


def import_customers_csv(connection: sqlite3.Connection, text: str, mode: str = "update") -> dict:
    if len(text.encode("utf-8")) > 5_000_000:
        raise ValueError("CSV file must be smaller than 5 MB")
    reader = csv.DictReader(io.StringIO(text.lstrip("\ufeff")))
    if not reader.fieldnames:
        raise ValueError("The CSV does not contain a header row")
    aliases = {
        "name": {"name", "customer name", "full name", "guest name"},
        "phone": {"phone", "mobile", "mobile number", "phone number", "contact"},
        "email": {"email", "email address"},
        "visits": {"visits", "visit count", "orders"},
        "spend": {"spend", "lifetime spend", "total spend", "revenue"},
        "points": {"points", "loyalty points"},
        "consent": {"consent", "marketing consent", "opt in", "opt-in"},
        "birthday": {"birthday", "date of birth", "dob"},
        "notes": {"notes", "customer notes", "preferences"},
    }
    normalized_headers = {header.strip().lower(): header for header in reader.fieldnames if header}
    columns = {key: next((normalized_headers[name] for name in names if name in normalized_headers), None) for key, names in aliases.items()}
    if not columns["name"] or not columns["phone"]:
        raise ValueError("CSV must include name and phone/mobile columns")

    inserted = updated = skipped = 0
    errors = []
    for row_number, record in enumerate(reader, start=2):
        name = str(record.get(columns["name"], "")).strip()
        phone = str(record.get(columns["phone"], "")).strip()
        if not name or not phone:
            skipped += 1
            errors.append(f"Row {row_number}: missing name or phone")
            continue
        try:
            phone = normalize_phone(phone)
        except ValueError:
            skipped += 1
            errors.append(f"Row {row_number}: invalid phone number")
            continue
        existing = find_customer_by_phone(connection, phone)
        get = lambda key, default="": str(record.get(columns[key], default)).strip() if columns.get(key) else default
        try:
            visits = max(0, int(float(get("visits", "0") or 0)))
            spend = max(0, float((get("spend", "0") or "0").replace(",", "").replace("₹", "")))
            points = max(0, int(float(get("points", "0") or 0)))
        except ValueError:
            skipped += 1
            errors.append(f"Row {row_number}: visits, spend or points is invalid")
            continue
        if existing and mode == "skip":
            skipped += 1
            continue
        values = (name, get("email"), visits, spend, points, int(parse_bool(get("consent"))),
                  get("birthday") or None, get("notes"), now_iso())
        if existing:
            connection.execute(
                """UPDATE customers SET name=?, email=?, visits=?, lifetime_spend=?, points=?,
                   marketing_consent=?, birthday=?, notes=? WHERE id=?""",
                values[:-1] + (existing["id"],),
            )
            updated += 1
        else:
            connection.execute(
                """INSERT INTO customers
                   (name, phone, email, visits, lifetime_spend, points, marketing_consent,
                    birthday, notes, tier, tags, avatar, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Member', '[\"Imported\"]', '#456d60', ?)""",
                (name, phone, get("email"), visits, spend, points, int(parse_bool(get("consent"))),
                 get("birthday") or None, get("notes"), now_iso()),
            )
            inserted += 1
    connection.execute(
        "INSERT INTO activities (kind, title, details, created_at) VALUES ('customer', ?, ?, ?)",
        ("Customer import completed", f"{inserted} added · {updated} updated · {skipped} skipped", now_iso()),
    )
    connection.commit()
    return {"inserted": inserted, "updated": updated, "skipped": skipped, "errors": errors[:10]}


def deliver_message(channel: str, recipient: str, subject: str, message: str) -> tuple[str, str]:
    channel_lower = channel.lower()
    if channel_lower == "email" and integration_status()["email"]["mode"] == "Live":
        email = EmailMessage()
        email["From"] = os.environ["MANGOSTEEN_SMTP_FROM"]
        email["To"] = recipient
        email["Subject"] = subject or "Message from Mangosteen Cafe"
        email.set_content(message)
        host = os.environ["MANGOSTEEN_SMTP_HOST"]
        port = int(os.environ.get("MANGOSTEEN_SMTP_PORT", "465"))
        with smtplib.SMTP_SSL(host, port, context=ssl.create_default_context(), timeout=15) as smtp:
            username = os.environ.get("MANGOSTEEN_SMTP_USERNAME")
            password = os.environ.get("MANGOSTEEN_SMTP_PASSWORD")
            if username and password:
                smtp.login(username, password)
            smtp.send_message(email)
        return "Sent", "SMTP"
    if channel_lower == "whatsapp" and integration_status()["whatsapp"]["mode"] == "Live":
        phone_id = os.environ["MANGOSTEEN_WHATSAPP_PHONE_ID"]
        url = f"https://graph.facebook.com/v22.0/{quote(phone_id)}/messages"
        payload = json.dumps({"messaging_product": "whatsapp", "to": recipient.replace("+", "").replace(" ", ""),
                              "type": "text", "text": {"body": message}}).encode("utf-8")
        request = Request(url, data=payload, method="POST", headers={
            "Authorization": f"Bearer {os.environ['MANGOSTEEN_WHATSAPP_TOKEN']}",
            "Content-Type": "application/json",
        })
        with urlopen(request, timeout=15):
            pass
        return "Sent", "Meta Cloud API"
    return "Queued", "Demo outbox"


class CRMHandler(SimpleHTTPRequestHandler):
    server_version = "MangosteenCRM/2.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stdout.write(f"[{datetime.now().strftime('%H:%M:%S')}] {fmt % args}\n")

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        super().end_headers()

    def send_json(self, payload, status=HTTPStatus.OK, session_token: str | None = None, clear_cookie: bool = False) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if urlparse(self.path).path.startswith("/api/public/"):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        if session_token:
            self.set_session_cookie(session_token)
        if clear_cookie:
            self.clear_session_cookie()
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1_000_000:
            raise ValueError("Request is too large")
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def current_user(self) -> dict | None:
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        morsel = cookie.get(SESSION_COOKIE)
        if not morsel:
            return None
        with connect() as connection:
            session = connection.execute(
                "SELECT * FROM sessions WHERE token_hash=?", (token_hash(morsel.value),)
            ).fetchone()
            if not session:
                return None
            if datetime.fromisoformat(session["expires_at"]) <= datetime.now().astimezone():
                connection.execute("DELETE FROM sessions WHERE token_hash=?", (session["token_hash"],))
                connection.commit()
                return None
            row = connection.execute(
                "SELECT id, name, email, role, active FROM users WHERE id=?", (session["user_id"],)
            ).fetchone()
        if not row or not row["active"]:
            with connect() as connection:
                connection.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash(morsel.value),))
                connection.commit()
            return None
        self.session_csrf_token = session["csrf_token"]
        return dict(row)

    def require_user(self, minimum_role: str = "Host") -> dict:
        user = self.current_user()
        if not user:
            raise PermissionError("Authentication required")
        if ROLE_LEVEL.get(user["role"], 0) < ROLE_LEVEL[minimum_role]:
            raise PermissionError(f"{minimum_role} access is required")
        return user

    def require_roles(self, *allowed_roles: str) -> dict:
        user = self.current_user()
        if not user:
            raise PermissionError("Authentication required")
        if user["role"] not in allowed_roles:
            raise PermissionError(f"Access is limited to {', '.join(allowed_roles)}")
        return user

    def require_csrf(self) -> None:
        supplied = self.headers.get("X-CSRF-Token", "")
        expected = getattr(self, "session_csrf_token", "")
        if not expected or not hmac.compare_digest(supplied, expected):
            raise PermissionError("A valid CSRF token is required")

    def set_session_cookie(self, token: str) -> None:
        secure = "; Secure" if os.environ.get("MANGOSTEEN_SECURE_COOKIES", "").lower() in {"1", "true", "yes"} else ""
        self.send_header("Set-Cookie", f"{SESSION_COOKIE}={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200{secure}")

    def clear_session_cookie(self) -> None:
        self.send_header("Set-Cookie", f"{SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0")

    def send_bytes(self, body: bytes, content_type: str, filename: str | None = None) -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(body)

    def allow_public_request(self) -> bool:
        address = self.client_ip()
        now = datetime.now().astimezone()
        with PUBLIC_REQUESTS_LOCK:
            recent = [timestamp for timestamp in PUBLIC_REQUESTS.get(address, []) if now - timestamp < timedelta(hours=1)]
            if len(recent) >= 8:
                PUBLIC_REQUESTS[address] = recent
                return False
            recent.append(now)
            PUBLIC_REQUESTS[address] = recent
        return True

    def client_ip(self) -> str:
        address = self.client_address[0]
        trusted = {item.strip() for item in os.environ.get("MANGOSTEEN_TRUSTED_PROXIES", "").split(",") if item.strip()}
        if address in trusted:
            forwarded = self.headers.get("X-Forwarded-For", "")
            if forwarded:
                return forwarded.split(",", 1)[0].strip()[:64]
        return address

    def do_OPTIONS(self):
        path = urlparse(self.path).path
        if path.startswith("/api/public/"):
            self.send_response(HTTPStatus.NO_CONTENT)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Max-Age", "600")
            self.end_headers()
            return
        self.send_json({"error": "API route not found"}, HTTPStatus.NOT_FOUND)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        if path == "/api/health":
            self.send_json({"status": "ok", "database": DB_PATH.name})
            return
        if path == "/api/public/menu":
            with connect() as connection:
                self.send_json(public_menu_payload(connection))
            return
        if path == "/api/public/table":
            table_code = str(query.get("table", [""])[0]).strip().upper()
            access_key = str(query.get("key", [""])[0]).strip()
            with connect() as connection:
                try:
                    table = validate_order_table(connection, table_code, access_key)
                except PermissionError as error:
                    self.send_json({"error": str(error)}, HTTPStatus.FORBIDDEN)
                    return
                wifi_name = setting_value(connection, "guest_wifi_name", "Mangosteen Guest")
                wifi_password = setting_value(connection, "guest_wifi_password", "Mangosteen@2026")
                wifi_demo = bool(setting_value(connection, "guest_wifi_demo", True))
            self.send_json({"table": {"id": table_code, "label": table["label"], "capacity": table["capacity"], "zoneName": table["zoneName"]},
                            "wifi": {"name": wifi_name, "password": wifi_password, "demo": wifi_demo}})
            return
        order_match = re.fullmatch(r"/api/public/orders/([A-Za-z0-9_-]+)", path)
        if order_match:
            with connect() as connection:
                order = connection.execute("SELECT * FROM orders WHERE public_token=?", (order_match.group(1),)).fetchone()
                if not order:
                    self.send_json({"error": "Order not found"}, HTTPStatus.NOT_FOUND)
                    return
                self.send_json(public_order_payload(connection, order))
            return
        service_match = re.fullmatch(r"/api/public/service-requests/([A-Za-z0-9_-]+)", path)
        if service_match:
            with connect() as connection:
                item = connection.execute("SELECT status, acknowledged_at FROM service_requests WHERE public_token=?", (service_match.group(1),)).fetchone()
                if not item:
                    self.send_json({"error": "Service request not found"}, HTTPStatus.NOT_FOUND)
                    return
                self.send_json({"status": item["status"], "acknowledgedAt": item["acknowledged_at"]})
            return
        if path == "/api/auth/session":
            user = self.current_user()
            self.send_json({"authenticated": bool(user), "user": user,
                            "csrfToken": getattr(self, "session_csrf_token", "") if user else ""})
            return
        if path.startswith("/api/"):
            try:
                user = self.require_user("Kitchen" if path == "/api/bootstrap" else "Host")
                if path == "/api/bootstrap":
                    with connect() as connection:
                        self.send_json(bootstrap_payload(connection, user))
                    return
                if path == "/api/export/customers.csv":
                    with connect() as connection:
                        output = io.StringIO()
                        writer = csv.writer(output)
                        writer.writerow(["Name", "Phone", "Email", "Tier", "Visits", "Lifetime Spend", "Points", "Marketing Consent", "Birthday", "Notes"])
                        for row in connection.execute("SELECT * FROM customers ORDER BY name"):
                            writer.writerow([row["name"], row["phone"], row["email"], row["tier"], row["visits"], row["lifetime_spend"], row["points"], "Yes" if row["marketing_consent"] else "No", row["birthday"] or "", row["notes"]])
                    self.send_bytes(output.getvalue().encode("utf-8-sig"), "text/csv; charset=utf-8", "mangosteen-customers.csv")
                    return
                if path == "/api/export/report.csv":
                    with connect() as connection:
                        output = io.StringIO()
                        writer = csv.writer(output)
                        writer.writerow(["Month", "Returning Visits", "Customer-linked Revenue"])
                        for row in connection.execute("SELECT * FROM monthly_metrics ORDER BY month"):
                            writer.writerow([row["month"], row["returning_visits"], row["revenue"]])
                    self.send_bytes(output.getvalue().encode("utf-8-sig"), "text/csv; charset=utf-8", "mangosteen-report.csv")
                    return
                if path.startswith("/api/backups/"):
                    self.require_user("Owner")
                    filename = path.removeprefix("/api/backups/")
                    candidate = BACKUP_DIR / Path(filename).name
                    if not candidate.exists() or candidate.suffix != ".sqlite3":
                        self.send_json({"error": "Backup not found"}, HTTPStatus.NOT_FOUND)
                        return
                    self.send_bytes(candidate.read_bytes(), "application/vnd.sqlite3", candidate.name)
                    return
                self.send_json({"error": "API route not found"}, HTTPStatus.NOT_FOUND)
            except PermissionError as error:
                status = HTTPStatus.UNAUTHORIZED if str(error) == "Authentication required" else HTTPStatus.FORBIDDEN
                self.send_json({"error": str(error)}, status)
            return
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            body = self.read_json()
            if path == "/api/public/reservations":
                if str(body.get("website", "")).strip():
                    self.send_json({"accepted": True, "status": "Pending"}, HTTPStatus.CREATED)
                    return
                request_key = str(self.headers.get("Idempotency-Key", "")).strip()
                if not 8 <= len(request_key) <= 128 or not re.fullmatch(r"[A-Za-z0-9._:-]+", request_key):
                    raise ValueError("A valid reservation request key is required")
                with connect() as connection:
                    previous = connection.execute(
                        "SELECT reservation_id FROM public_submissions WHERE request_key=?", (request_key,)
                    ).fetchone()
                    if previous:
                        reservation_id = previous["reservation_id"]
                        self.send_json({"id": reservation_id, "reference": f"MG-{reservation_id:06d}", "status": "Pending"})
                        return
                    if not self.allow_public_request():
                        self.send_json({"error": "Too many reservation attempts. Please try again later."}, HTTPStatus.TOO_MANY_REQUESTS)
                        return

                    name = str(body.get("name", "")).strip()
                    phone = normalize_phone(str(body.get("phone", "")))
                    email = str(body.get("email", "")).strip().lower()
                    reservation_date = str(body.get("date", "")).strip()
                    reservation_time = str(body.get("time", "")).strip()
                    guests = int(body.get("guests", 0))
                    area = str(body.get("area", "Best available")).strip()[:80]
                    table_name = str(body.get("table", area or "Best available")).strip()[:80]
                    seats = body.get("seats", [])
                    occasion = str(body.get("occasion", "Regular visit")).strip()[:60]
                    special_requests = str(body.get("specialRequests", "")).strip()[:500]
                    consent = parse_bool(body.get("consent"))
                    if len(name) < 2 or len(name) > 80:
                        raise ValueError("Please enter a valid guest name")
                    if email and (len(email) > 120 or "@" not in email):
                        raise ValueError("Please enter a valid email address")
                    requested_day = date.fromisoformat(reservation_date)
                    if requested_day < date.today() or requested_day > date.today() + timedelta(days=90):
                        raise ValueError("Reservation date must be within the next 90 days")
                    if not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", reservation_time):
                        raise ValueError("Please choose a valid arrival time")
                    if guests < 1 or guests > 6:
                        raise ValueError("Online reservations support 1 to 6 guests")
                    seats = validate_public_seating(area, table_name, seats, guests)

                    customer = find_customer_by_phone(connection, phone)
                    if customer:
                        customer_id = customer["id"]
                        connection.execute(
                            """UPDATE customers SET name=?, email=CASE WHEN ? <> '' THEN ? ELSE email END,
                               marketing_consent=CASE WHEN ?=1 THEN 1 ELSE marketing_consent END
                               WHERE id=?""",
                            (name, email, email, int(consent), customer_id),
                        )
                    else:
                        cursor = connection.execute(
                            """INSERT INTO customers
                               (name, phone, email, tier, tags, marketing_consent, notes, created_at)
                               VALUES (?, ?, ?, 'Member', ?, ?, 'Created from website reservation', ?)""",
                            (name, phone, email, json.dumps(["Website booking"]), int(consent), now_iso()),
                        )
                        customer_id = cursor.lastrowid

                    seat_text = ", ".join(str(seat) for seat in seats)
                    request_notes = f"Website request · Area: {area} · Seats: {seat_text}"
                    if special_requests:
                        request_notes += f" · Guest note: {special_requests}"
                    cursor = connection.execute(
                        """INSERT INTO reservations
                           (reservation_date, reservation_time, customer_id, name, phone, guests,
                            table_name, occasion, status, special_requests, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)""",
                        (reservation_date, reservation_time, customer_id, name, phone, guests,
                         table_name, occasion or "Regular visit", request_notes, now_iso()),
                    )
                    reservation_id = cursor.lastrowid
                    reference = f"MG-{reservation_id:06d}"
                    connection.execute(
                        "INSERT INTO public_submissions (request_key, reservation_id, created_at) VALUES (?, ?, ?)",
                        (request_key, reservation_id, now_iso()),
                    )
                    connection.execute(
                        "INSERT INTO activities (kind, title, details, created_at) VALUES ('reservation', ?, ?, ?)",
                        ("Website reservation requested", f"{name} · {guests} guests · {reference}", now_iso()),
                    )
                    connection.commit()
                self.send_json({"id": reservation_id, "reference": reference, "status": "Pending"}, HTTPStatus.CREATED)
                return

            if path == "/api/public/orders":
                if str(body.get("website", "")).strip():
                    self.send_json({"accepted": True, "status": "Kitchen"}, HTTPStatus.CREATED)
                    return
                request_key = str(self.headers.get("Idempotency-Key", "")).strip()
                if not 8 <= len(request_key) <= 128 or not re.fullmatch(r"[A-Za-z0-9._:-]+", request_key):
                    raise ValueError("A valid order request key is required")
                with connect() as connection:
                    previous = connection.execute(
                        "SELECT order_id FROM public_order_submissions WHERE request_key=?", (request_key,)
                    ).fetchone()
                    if previous:
                        order = connection.execute("SELECT * FROM orders WHERE id=?", (previous["order_id"],)).fetchone()
                        payload = public_order_payload(connection, order)
                        payload["publicToken"] = order["public_token"]
                        self.send_json(payload)
                        return
                    if not self.allow_public_request():
                        self.send_json({"error": "Too many order attempts. Please try again later."}, HTTPStatus.TOO_MANY_REQUESTS)
                        return

                    table_code = str(body.get("table", "")).strip().upper()
                    access_key = str(body.get("tableAccessKey", "")).strip()
                    guest_name = str(body.get("guestName", "")).strip()[:60]
                    phone = str(body.get("phone", "")).strip()[:20]
                    notes = str(body.get("notes", "")).strip()[:300]
                    payment = body.get("payment") if isinstance(body.get("payment"), dict) else {}
                    payment_method = str(payment.get("method", "")).strip().upper()
                    payment_reference = str(payment.get("reference", "")).strip()
                    requested_items = body.get("items", [])
                    table = validate_order_table(connection, table_code, access_key)
                    if len(guest_name) < 2:
                        raise ValueError("Please enter the guest name for this order")
                    if phone and not re.fullmatch(r"[+0-9 ()-]{7,20}", phone):
                        raise ValueError("Please enter a valid mobile number or leave it blank")
                    if (payment.get("status") != "Paid" or payment.get("mode") != "Demo" or
                            payment_method not in {"UPI", "CARD"} or
                            not re.fullmatch(r"DEMO-[A-Za-z0-9._:-]{6,80}", payment_reference)):
                        raise ValueError("Complete the online payment before sending this order to the kitchen")
                    payment_method = "Card" if payment_method == "CARD" else "UPI"
                    if not isinstance(requested_items, list) or not 1 <= len(requested_items) <= 24:
                        raise ValueError("Add between 1 and 24 menu items")
                    normalized_items = []
                    item_count = 0
                    subtotal = 0.0
                    for requested in requested_items:
                        name = str(requested.get("name", "")).strip()[:100]
                        category = str(requested.get("category", "")).strip()[:100]
                        quantity = int(requested.get("quantity", 0))
                        menu_item = connection.execute(
                            "SELECT * FROM public_menu_items WHERE category=? AND name=? AND active=1",
                            (category, name),
                        ).fetchone()
                        if not menu_item or quantity < 1 or quantity > 10:
                            raise ValueError("One selected menu item is invalid or unavailable")
                        unit_price = float(menu_item["price"])
                        item_count += quantity
                        subtotal += unit_price * quantity
                        normalized_items.append((name, quantity, unit_price))
                    if item_count > 30:
                        raise ValueError("A QR order can contain up to 30 dishes")
                    service_charge = round(subtotal * 0.05)
                    total = subtotal + service_charge
                    timestamp = now_iso()
                    public_token = secrets.token_urlsafe(24)
                    estimated_minutes = min(35, 12 + ((item_count + 1) // 2) * 3)
                    display_table = f"QR {table_code} · {table['label']} · {guest_name}"[:40]
                    cursor = connection.execute(
                        """INSERT INTO orders
                           (table_name, status, subtotal, total, payment_method, paid_at, payment_preference, created_at, sent_at,
                            public_token, table_code, table_label, guest_name, phone, notes,
                            service_charge, estimated_minutes)
                           VALUES (?, 'Kitchen', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (display_table, subtotal, total, payment_method, timestamp, f"Prepaid online ({payment_method})", timestamp, timestamp, public_token, table_code,
                         table["label"], guest_name, phone, notes, service_charge, estimated_minutes),
                    )
                    order_id = cursor.lastrowid
                    connection.executemany(
                        """INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price)
                           VALUES (?, NULL, ?, ?, ?)""",
                        [(order_id, name, quantity, unit_price) for name, quantity, unit_price in normalized_items],
                    )
                    connection.execute(
                        "INSERT INTO public_order_submissions (request_key, order_id, created_at) VALUES (?, ?, ?)",
                        (request_key, order_id, timestamp),
                    )
                    connection.execute(
                        "INSERT INTO payments (order_id, method, amount, created_at) VALUES (?, ?, ?, ?)",
                        (order_id, payment_method, total, timestamp),
                    )
                    connection.execute(
                        "INSERT INTO activities (kind, title, details, created_at) VALUES ('order', ?, ?, ?)",
                        ("Prepaid QR order received", f"{display_table} · QR-{order_id:06d} · {payment_method}", timestamp),
                    )
                    connection.commit()
                    order = connection.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
                    payload = public_order_payload(connection, order)
                    payload["publicToken"] = public_token
                self.send_json(payload, HTTPStatus.CREATED)
                return

            if path == "/api/public/service-requests":
                request_type = str(body.get("type", "")).strip().lower()
                if request_type not in {"waiter", "bill"}:
                    raise ValueError("Choose a valid table service")
                with connect() as connection:
                    order = None
                    if request_type == "bill":
                        order_token = str(body.get("orderToken", "")).strip()
                        order = connection.execute("SELECT * FROM orders WHERE public_token=?", (order_token,)).fetchone()
                        if not order:
                            self.send_json({"error": "This order link is no longer valid."}, HTTPStatus.NOT_FOUND)
                            return
                        if order["payment_method"] and order["paid_at"]:
                            raise ValueError("This order is already prepaid")
                        table_code = order["table_code"]
                        table = configured_tables(connection).get(table_code)
                        if not table or not table["active"]:
                            raise PermissionError("This table is currently unavailable.")
                        payment_preference = str(body.get("paymentPreference", "")).strip()
                        if payment_preference not in {"Online payment (demo)", "Cash at table", "Pay at counter"}:
                            raise ValueError("Choose how you would like to settle the bill")
                    else:
                        table_code = str(body.get("table", "")).strip().upper()
                        access_key = str(body.get("tableAccessKey", "")).strip()
                        table = validate_order_table(connection, table_code, access_key)
                        payment_preference = ""
                    existing = connection.execute(
                        "SELECT * FROM service_requests WHERE request_type=? AND table_code=? AND status='Open' ORDER BY id DESC LIMIT 1",
                        (request_type, table_code),
                    ).fetchone()
                    if existing:
                        self.send_json({"token": existing["public_token"], "status": existing["status"], "acknowledgedAt": existing["acknowledged_at"]})
                        return
                    token = secrets.token_urlsafe(24)
                    timestamp = now_iso()
                    cursor = connection.execute(
                        """INSERT INTO service_requests
                           (public_token, request_type, table_code, table_label, order_id, payment_preference, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?)""",
                        (token, request_type, table_code, table["label"], order["id"] if order else None, payment_preference, timestamp),
                    )
                    if order:
                        connection.execute("UPDATE orders SET bill_requested_at=?, payment_preference=? WHERE id=?", (timestamp, payment_preference, order["id"]))
                    connection.execute(
                        "INSERT INTO activities (kind, title, details, created_at) VALUES ('service', ?, ?, ?)",
                        ("Waiter requested" if request_type == "waiter" else "Bill requested", f'{table["label"]} · {payment_preference}'.strip(" ·"), timestamp),
                    )
                    connection.commit()
                self.send_json({"token": token, "status": "Open", "acknowledgedAt": None, "id": cursor.lastrowid}, HTTPStatus.CREATED)
                return

            if path == "/api/public/feedback":
                order_token = str(body.get("orderToken", "")).strip()
                rating = int(body.get("rating", 0))
                if rating < 1 or rating > 5:
                    raise ValueError("Choose a rating from 1 to 5")
                tags = [str(tag).strip() for tag in body.get("tags", []) if str(tag).strip()][:5] if isinstance(body.get("tags", []), list) else []
                message = str(body.get("message", "")).strip()[:500]
                with connect() as connection:
                    order = connection.execute("SELECT * FROM orders WHERE public_token=?", (order_token,)).fetchone()
                    if not order:
                        self.send_json({"error": "This order link is no longer valid."}, HTTPStatus.NOT_FOUND)
                        return
                    feedback_message = " — ".join(part for part in (" · ".join(tags), message) if part) or f"{rating}-star table feedback"
                    connection.execute(
                        """INSERT INTO feedback (name, rating, message, status, source, avatar, created_at)
                           VALUES (?, ?, ?, ?, 'Table QR', '#537878', ?)""",
                        (order["guest_name"] or "Table guest", rating, feedback_message, "Resolved" if rating >= 4 else "Unresolved", now_iso()),
                    )
                    connection.execute(
                        "INSERT INTO activities (kind, title, details, created_at) VALUES ('feedback', ?, ?, ?)",
                        (f"{rating}-star QR feedback received", f'{order["table_label"]} · {feedback_message}'[:140], now_iso()),
                    )
                    connection.commit()
                self.send_json({"submitted": True, "googleReviewUrl": GOOGLE_REVIEW_URL}, HTTPStatus.CREATED)
                return

            if path == "/api/auth/login":
                email = str(body.get("email", "")).strip().lower()
                password = str(body.get("password", ""))
                attempt_key = hashlib.sha256(f"{self.client_ip()}|{email}".encode("utf-8")).hexdigest()
                with connect() as connection:
                    attempt = connection.execute(
                        "SELECT failures, locked_until FROM login_attempts WHERE attempt_key=?", (attempt_key,)
                    ).fetchone()
                    now = datetime.now().astimezone()
                    if attempt and attempt["locked_until"] and datetime.fromisoformat(attempt["locked_until"]) > now:
                        self.send_json({"error": "Too many failed sign-in attempts. Try again in 15 minutes."}, HTTPStatus.TOO_MANY_REQUESTS)
                        return
                    if attempt and attempt["locked_until"]:
                        connection.execute("DELETE FROM login_attempts WHERE attempt_key=?", (attempt_key,))
                        attempt = None
                    row = connection.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
                    if not row or not row["active"] or not password_matches(password, row["password_hash"]):
                        failures = (attempt["failures"] if attempt else 0) + 1
                        locked_until = (now + LOGIN_LOCKOUT).isoformat(timespec="seconds") if failures >= LOGIN_FAILURE_LIMIT else None
                        connection.execute(
                            """INSERT INTO login_attempts (attempt_key, failures, locked_until, updated_at)
                               VALUES (?, ?, ?, ?) ON CONFLICT(attempt_key) DO UPDATE SET
                               failures=excluded.failures, locked_until=excluded.locked_until, updated_at=excluded.updated_at""",
                            (attempt_key, failures, locked_until, now_iso()),
                        )
                        connection.commit()
                        self.send_json({"error": "Email or password is incorrect"}, HTTPStatus.UNAUTHORIZED)
                        return
                    token = secrets.token_urlsafe(32)
                    csrf_token = secrets.token_urlsafe(32)
                    connection.execute("DELETE FROM login_attempts WHERE attempt_key=?", (attempt_key,))
                    connection.execute(
                        "INSERT INTO sessions (token_hash, user_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
                        (token_hash(token), row["id"], csrf_token, now_iso(), (now + SESSION_TTL).isoformat(timespec="seconds")),
                    )
                    connection.execute("UPDATE users SET last_login_at=? WHERE id=?", (now_iso(), row["id"]))
                    connection.commit()
                    user = {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"]}
                self.send_json({"authenticated": True, "user": user, "csrfToken": csrf_token}, session_token=token)
                return

            user = self.require_user("Kitchen")
            self.require_csrf()
            if path == "/api/auth/logout":
                cookie = SimpleCookie(self.headers.get("Cookie", ""))
                morsel = cookie.get(SESSION_COOKIE)
                if morsel:
                    with connect() as connection:
                        connection.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash(morsel.value),))
                        connection.commit()
                self.send_json({"authenticated": False}, clear_cookie=True)
                return

            with connect() as connection:
                menu_match = re.fullmatch(r"/api/public-menu-items/(.+)", path)
                if menu_match:
                    self.require_user("Owner")
                    item_id = unquote(menu_match.group(1))
                    item = connection.execute("SELECT * FROM public_menu_items WHERE id=?", (item_id,)).fetchone()
                    if not item:
                        self.send_json({"error": "Menu item not found"}, HTTPStatus.NOT_FOUND)
                        return
                    price = float(body.get("price", item["price"]))
                    if price < 0 or price > 10000:
                        raise ValueError("Enter a valid menu price")
                    active = int(bool(body.get("active", bool(item["active"]))))
                    connection.execute("UPDATE public_menu_items SET price=?,active=?,updated_at=? WHERE id=?", (price, active, now_iso(), item_id))
                    connection.commit()
                    self.send_json({"updated": True})
                    return
                table_match = re.fullmatch(r"/api/tables/([^/]+)", path)
                if table_match:
                    self.require_user("Owner")
                    table_id = table_match.group(1)
                    table = configured_tables(connection).get(table_id)
                    if not table:
                        self.send_json({"error": "Table not found"}, HTTPStatus.NOT_FOUND)
                        return
                    capacity = int(body.get("capacity", table["capacity"]))
                    if capacity < 1 or capacity > 30:
                        raise ValueError("Capacity must be between 1 and 30")
                    managed = setting_value(connection, "managed_tables", {}) or {}
                    managed[table_id] = {"label": str(body.get("label", table["label"])).strip()[:40],
                                         "zoneName": str(body.get("zoneName", table["zoneName"])).strip()[:60],
                                         "capacity": capacity, "active": bool(body.get("active", table["active"]))}
                    connection.execute("INSERT INTO settings (key,value) VALUES ('managed_tables',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(managed),))
                    connection.commit()
                    self.send_json({"updated": True})
                    return
                if path == "/api/notifications/run-daily":
                    self.require_user("Owner")
                    result = queue_daily_operations_notifications(connection, force=True)
                    connection.commit()
                    self.send_json(result)
                    return
                if path == "/api/auth/change-password":
                    current_password = str(body.get("currentPassword", ""))
                    new_password = str(body.get("newPassword", ""))
                    record = connection.execute("SELECT password_hash FROM users WHERE id=?", (user["id"],)).fetchone()
                    if not password_matches(current_password, record["password_hash"]):
                        raise ValueError("Current password is incorrect")
                    if len(new_password) < 10 or not any(char.isdigit() for char in new_password) or not any(char.isalpha() for char in new_password):
                        raise ValueError("New password must be at least 10 characters and include letters and numbers")
                    connection.execute("UPDATE users SET password_hash=? WHERE id=?", (password_hash(new_password), user["id"]))
                    cookie = SimpleCookie(self.headers.get("Cookie", ""))
                    morsel = cookie.get(SESSION_COOKIE)
                    current_hash = token_hash(morsel.value) if morsel else ""
                    connection.execute("DELETE FROM sessions WHERE user_id=? AND token_hash<>?", (user["id"], current_hash))
                    connection.commit()
                    self.send_json({"changed": True})
                    return

                service_match = re.fullmatch(r"/api/service-requests/(\d+)/acknowledge", path)
                if service_match:
                    self.require_user("Cashier")
                    timestamp = now_iso()
                    cursor = connection.execute(
                        "UPDATE service_requests SET status='Acknowledged', acknowledged_at=? WHERE id=?",
                        (timestamp, int(service_match.group(1))),
                    )
                    if not cursor.rowcount:
                        self.send_json({"error": "Service request not found"}, HTTPStatus.NOT_FOUND)
                        return
                    connection.commit()
                    self.send_json({"acknowledged": True})
                    return

                if path == "/api/orders":
                    self.require_roles("Owner", "Manager", "Cashier")
                    table_name = str(body.get("table", "")).strip()[:40]
                    requested_items = body.get("items", [])
                    if not table_name or not isinstance(requested_items, list):
                        raise ValueError("Table and order items are required")
                    normalized_items = []
                    total = 0.0
                    for requested in requested_items:
                        menu_item_id = int(requested.get("menuItemId", 0))
                        quantity = max(0, int(requested.get("quantity", 0)))
                        if not menu_item_id or not quantity:
                            continue
                        menu_item = connection.execute(
                            "SELECT id, name, price FROM menu_items WHERE id=? AND active=1", (menu_item_id,)
                        ).fetchone()
                        if not menu_item:
                            raise ValueError("One selected menu item is unavailable")
                        total += menu_item["price"] * quantity
                        normalized_items.append((menu_item, quantity))
                    if not normalized_items:
                        raise ValueError("Add at least one item to the order")
                    cursor = connection.execute(
                        """INSERT INTO orders (table_name, status, subtotal, total, created_by, created_at)
                           VALUES (?, 'Draft', ?, ?, ?, ?)""",
                        (table_name, total, total, user["id"], now_iso()),
                    )
                    order_id = cursor.lastrowid
                    connection.executemany(
                        """INSERT INTO order_items
                           (order_id, menu_item_id, item_name, quantity, unit_price)
                           VALUES (?, ?, ?, ?, ?)""",
                        [(order_id, item["id"], item["name"], quantity, item["price"])
                         for item, quantity in normalized_items],
                    )
                    connection.commit()
                    self.send_json({"id": order_id, "total": total}, HTTPStatus.CREATED)
                    return

                if path.startswith("/api/orders/") and path.endswith("/send"):
                    self.require_roles("Owner", "Manager", "Cashier")
                    order_id = int(path.split("/")[3])
                    send_order_to_kitchen(connection, order_id, user["id"])
                    connection.commit()
                    self.send_json({"updated": True, "status": "Kitchen"})
                    return

                if path.startswith("/api/orders/") and path.endswith("/status"):
                    actor = self.require_roles("Owner", "Manager", "Kitchen", "Floor Staff")
                    order_id = int(path.split("/")[3])
                    requested = str(body.get("status", "")).title()
                    if requested not in {"Kitchen", "Preparing", "Ready", "Served"}:
                        raise ValueError("Order status must be Kitchen, Preparing, Ready or Served")
                    record = connection.execute("SELECT id, status FROM orders WHERE id=?", (order_id,)).fetchone()
                    if not record or record["status"] == "Paid":
                        raise ValueError("Order is unavailable or already paid")
                    if actor["role"] == "Kitchen" and requested == "Served":
                        self.send_json({"error": "Floor staff must confirm table delivery"}, HTTPStatus.FORBIDDEN)
                        return
                    if actor["role"] == "Floor Staff" and (requested != "Served" or record["status"] != "Ready"):
                        self.send_json({"error": "Floor staff can only mark ready orders as served"}, HTTPStatus.FORBIDDEN)
                        return
                    ready_at = now_iso() if requested == "Ready" else None
                    served_at = now_iso() if requested == "Served" else None
                    connection.execute(
                        "UPDATE orders SET status=?, ready_at=COALESCE(?, ready_at), served_at=COALESCE(?, served_at) WHERE id=?",
                        (requested, ready_at, served_at, order_id),
                    )
                    connection.commit()
                    self.send_json({"updated": True, "status": requested})
                    return

                if path.startswith("/api/orders/") and path.endswith("/pay"):
                    self.require_roles("Owner", "Manager", "Cashier")
                    order_id = int(path.split("/")[3])
                    method = str(body.get("method", "")).upper()
                    method = "UPI" if method == "UPI" else method.title()
                    if method not in {"Cash", "UPI", "Card"}:
                        raise ValueError("Payment method must be Cash, UPI or Card")
                    order = connection.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
                    if not order:
                        raise ValueError("Order not found")
                    if order["status"] == "Paid" or order["paid_at"]:
                        raise ValueError("Order is already paid")
                    timestamp = now_iso()
                    connection.execute(
                        "INSERT INTO payments (order_id, method, amount, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
                        (order_id, method, order["total"], user["id"], timestamp),
                    )
                    connection.execute(
                        "UPDATE orders SET status='Paid', payment_method=?, paid_at=? WHERE id=?",
                        (method, timestamp, order_id),
                    )
                    connection.commit()
                    self.send_json({"paid": True, "method": method, "amount": order["total"]})
                    return

                if path.startswith("/api/inventory/") and path.endswith("/adjust"):
                    self.require_roles("Owner", "Manager")
                    inventory_id = int(path.split("/")[3])
                    quantity = float(body.get("quantity", 0))
                    reason = str(body.get("reason", "Manual stock adjustment")).strip()[:120]
                    if not quantity:
                        raise ValueError("Enter a non-zero stock adjustment")
                    item = connection.execute("SELECT quantity FROM inventory_items WHERE id=?", (inventory_id,)).fetchone()
                    if not item or item["quantity"] + quantity < 0:
                        raise ValueError("Stock adjustment would create a negative quantity")
                    connection.execute("UPDATE inventory_items SET quantity=quantity+? WHERE id=?", (quantity, inventory_id))
                    connection.execute(
                        """INSERT INTO inventory_movements
                           (inventory_item_id, quantity, reason, created_by, created_at)
                           VALUES (?, ?, ?, ?, ?)""",
                        (inventory_id, quantity, reason, user["id"], now_iso()),
                    )
                    connection.commit()
                    self.send_json({"adjusted": True})
                    return

                if path == "/api/expenses":
                    self.require_roles("Owner", "Manager")
                    name = str(body.get("name", "")).strip()
                    category = str(body.get("category", "Kitchen")).strip().title()
                    amount = float(body.get("amount", 0))
                    expense_date = str(body.get("date", date.today().isoformat())).strip()
                    vendor_id = int(body["vendorId"]) if body.get("vendorId") else None
                    if not name or amount <= 0 or category not in {"Rent", "Utilities", "Vendor", "Kitchen", "Salary", "Other"}:
                        raise ValueError("Expense name, valid category and positive amount are required")
                    cursor = connection.execute(
                        """INSERT INTO expenses
                           (name, category, amount, expense_date, vendor_id, note, created_by, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                        (name, category, amount, expense_date, vendor_id,
                         str(body.get("note", "")).strip(), user["id"], now_iso()),
                    )
                    if vendor_id and bool(body.get("addToBalance")):
                        connection.execute("UPDATE vendors SET balance=balance+? WHERE id=?", (amount, vendor_id))
                    connection.commit()
                    self.send_json({"id": cursor.lastrowid}, HTTPStatus.CREATED)
                    return

                if path == "/api/vendors":
                    self.require_roles("Owner", "Manager")
                    name = str(body.get("name", "")).strip()
                    if not name:
                        raise ValueError("Vendor name is required")
                    cursor = connection.execute(
                        "INSERT INTO vendors (name, supplies, phone, balance, created_at) VALUES (?, ?, ?, ?, ?)",
                        (name, str(body.get("supplies", "")).strip(), str(body.get("phone", "")).strip(),
                         max(0, float(body.get("balance", 0))), now_iso()),
                    )
                    connection.commit()
                    self.send_json({"id": cursor.lastrowid}, HTTPStatus.CREATED)
                    return

                if path.startswith("/api/vendors/") and path.endswith("/pay"):
                    self.require_roles("Owner", "Manager")
                    vendor_id = int(path.split("/")[3])
                    amount = float(body.get("amount", 0))
                    vendor = connection.execute("SELECT balance FROM vendors WHERE id=?", (vendor_id,)).fetchone()
                    if not vendor or amount <= 0 or amount > vendor["balance"]:
                        raise ValueError("Enter a payment no greater than the outstanding balance")
                    connection.execute("UPDATE vendors SET balance=balance-? WHERE id=?", (amount, vendor_id))
                    connection.commit()
                    self.send_json({"paid": True})
                    return

                if path == "/api/staff":
                    self.require_roles("Owner", "Manager")
                    name = str(body.get("name", "")).strip()
                    job_role = str(body.get("jobRole", "")).strip()
                    if not name or not job_role:
                        raise ValueError("Staff name and role are required")
                    cursor = connection.execute(
                        """INSERT INTO staff
                           (name, job_role, shift_start, shift_end, monthly_salary, created_at)
                           VALUES (?, ?, ?, ?, ?, ?)""",
                        (name, job_role, body.get("shiftStart", "09:00"), body.get("shiftEnd", "18:00"),
                         max(0, float(body.get("salary", 0))), now_iso()),
                    )
                    connection.commit()
                    self.send_json({"id": cursor.lastrowid}, HTTPStatus.CREATED)
                    return

                if path == "/api/attendance":
                    self.require_roles("Owner", "Manager")
                    staff_id = int(body.get("staffId", 0))
                    status = str(body.get("status", "Present")).title()
                    attendance_date = str(body.get("date", date.today().isoformat()))
                    if not staff_id or status not in {"Present", "Late", "Leave", "Absent"}:
                        raise ValueError("Staff member and valid attendance status are required")
                    connection.execute(
                        """INSERT INTO attendance
                           (staff_id, attendance_date, status, check_in, note, created_at)
                           VALUES (?, ?, ?, ?, ?, ?)
                           ON CONFLICT(staff_id, attendance_date) DO UPDATE SET
                             status=excluded.status, check_in=excluded.check_in, note=excluded.note""",
                        (staff_id, attendance_date, status, body.get("checkIn") or None,
                         str(body.get("note", "")).strip(), now_iso()),
                    )
                    connection.commit()
                    self.send_json({"saved": True})
                    return

                self.require_user("Host")

                if path == "/api/users":
                    self.require_user("Owner")
                    name = str(body.get("name", "")).strip()
                    email = str(body.get("email", "")).strip().lower()
                    role = str(body.get("role", "Host")).title()
                    password = str(body.get("password", ""))
                    if not name or "@" not in email:
                        raise ValueError("Name and a valid email are required")
                    if role not in ROLE_LEVEL:
                        raise ValueError("Role must be Owner, Manager, Host, Cashier, Kitchen or Floor Staff")
                    if len(password) < 10:
                        raise ValueError("Temporary password must be at least 10 characters")
                    cursor = connection.execute(
                        "INSERT INTO users (name, email, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
                        (name, email, role, password_hash(password), now_iso()),
                    )
                    connection.commit()
                    self.send_json({"id": cursor.lastrowid}, HTTPStatus.CREATED)
                    return

                if path.startswith("/api/users/") and path.endswith("/toggle"):
                    self.require_user("Owner")
                    target_id = int(path.split("/")[3])
                    if target_id == user["id"]:
                        raise ValueError("You cannot disable your own account")
                    connection.execute("UPDATE users SET active=CASE active WHEN 1 THEN 0 ELSE 1 END WHERE id=?", (target_id,))
                    connection.commit()
                    self.send_json({"updated": True})
                    return

                if path == "/api/import/customers":
                    self.require_user("Manager")
                    result = import_customers_csv(connection, str(body.get("csv", "")), str(body.get("mode", "update")))
                    self.send_json(result)
                    return

                if path == "/api/backups":
                    self.require_user("Owner")
                    destination = create_backup("manual")
                    self.send_json({"created": True, "backup": {"name": destination.name, "size": destination.stat().st_size}})
                    return

                if path == "/api/backups/restore":
                    self.require_user("Owner")
                    filename = Path(str(body.get("name", ""))).name
                    source_path = BACKUP_DIR / filename
                    if not source_path.exists() or source_path.suffix != ".sqlite3":
                        raise ValueError("Selected backup does not exist")
                    check = sqlite3.connect(source_path)
                    integrity = check.execute("PRAGMA integrity_check").fetchone()[0]
                    if integrity != "ok":
                        check.close()
                        raise ValueError("Backup integrity check failed")
                    create_backup("before-restore")
                    check.backup(connection)
                    check.close()
                    connection.commit()
                    self.send_json({"restored": True})
                    return

                if path == "/api/communications/send":
                    self.require_roles("Owner", "Manager")
                    channel = str(body.get("channel", "WhatsApp")).title()
                    if channel not in {"Email", "Whatsapp", "WhatsApp"}:
                        raise ValueError("Channel must be Email or WhatsApp")
                    channel = "WhatsApp" if channel.lower() == "whatsapp" else "Email"
                    customer_id = int(body["customerId"]) if body.get("customerId") else None
                    recipient = str(body.get("recipient", "")).strip()
                    subject = str(body.get("subject", "")).strip()
                    message = str(body.get("message", "")).strip()
                    purpose = str(body.get("purpose", "Transactional")).title()
                    if not recipient or not message:
                        raise ValueError("Recipient and message are required")
                    if customer_id and purpose == "Marketing":
                        customer = connection.execute("SELECT marketing_consent FROM customers WHERE id=?", (customer_id,)).fetchone()
                        if not customer or not customer["marketing_consent"]:
                            raise ValueError("Marketing consent is not recorded for this customer")
                    status = "Failed"
                    provider = "Demo outbox"
                    error_message = ""
                    try:
                        status, provider = deliver_message(channel, recipient, subject, message)
                    except (OSError, smtplib.SMTPException, HTTPError, URLError) as delivery_error:
                        error_message = str(delivery_error)[:300]
                    cursor = connection.execute(
                        """INSERT INTO communications
                           (customer_id, channel, recipient, subject, message, purpose, status, provider,
                            created_by, created_at, sent_at, error)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (customer_id, channel, recipient, subject, message, purpose, status, provider,
                         user["id"], now_iso(), now_iso() if status == "Sent" else None, error_message),
                    )
                    connection.commit()
                    if status == "Failed":
                        self.send_json({"error": f"Delivery failed: {error_message or 'provider error'}"}, HTTPStatus.BAD_GATEWAY)
                    else:
                        self.send_json({"id": cursor.lastrowid, "status": status, "provider": provider})
                    return

                if path == "/api/points/adjust":
                    self.require_user("Manager")
                    customer_id = int(body.get("customerId", 0))
                    points = int(body.get("points", 0))
                    reason = str(body.get("reason", "")).strip()
                    if not customer_id or not points or not reason:
                        raise ValueError("Customer, non-zero points and reason are required")
                    customer = connection.execute("SELECT points FROM customers WHERE id=?", (customer_id,)).fetchone()
                    if not customer or customer["points"] + points < 0:
                        raise ValueError("Adjustment would create an invalid negative balance")
                    connection.execute("UPDATE customers SET points=points+? WHERE id=?", (points, customer_id))
                    connection.execute(
                        "INSERT INTO point_ledger (customer_id, points, reason, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
                        (customer_id, points, reason, user["id"], now_iso()),
                    )
                    connection.commit()
                    self.send_json({"adjusted": True})
                    return

                if path.startswith("/api/reservations/") and path.endswith("/status"):
                    self.require_roles("Owner", "Manager", "Cashier", "Host")
                    reservation_id = int(path.split("/")[3])
                    requested_status = str(body.get("status", "")).strip().lower()
                    allowed_statuses = {"pending": "Pending", "confirmed": "Confirmed", "completed": "Completed", "no-show": "No-show", "cancelled": "Cancelled"}
                    if requested_status not in allowed_statuses:
                        raise ValueError("Reservation status is invalid")
                    status = allowed_statuses[requested_status]
                    reservation = connection.execute("SELECT name FROM reservations WHERE id=?", (reservation_id,)).fetchone()
                    if not reservation:
                        self.send_json({"error": "Reservation not found"}, HTTPStatus.NOT_FOUND)
                        return
                    connection.execute("UPDATE reservations SET status=? WHERE id=?", (status, reservation_id))
                    connection.execute(
                        "INSERT INTO activities (kind, title, details, created_at) VALUES ('reservation', ?, ?, ?)",
                        (f"Reservation {status.lower()}", f"{reservation['name']} · MG-{reservation_id:06d}", now_iso()),
                    )
                    connection.commit()
                    self.send_json({"updated": True, "status": status})
                    return

                if path.startswith("/api/campaigns/") and path.endswith("/sent"):
                    self.require_user("Manager")
                    campaign_id = int(path.split("/")[3])
                    audience = max(0, int(body.get("audience", 0)))
                    connection.execute(
                        "UPDATE campaigns SET status='Delivered', audience=?, schedule_label=? WHERE id=?",
                        (audience, f"Processed {datetime.now().strftime('%d %b')}", campaign_id),
                    )
                    connection.commit()
                    self.send_json({"updated": True})
                    return

                if path == "/api/customers":
                    self.require_roles("Owner", "Manager", "Cashier", "Host")
                    name = str(body.get("name", "")).strip()
                    phone = normalize_phone(str(body.get("phone", "")))
                    if not name or not phone:
                        raise ValueError("Name and mobile number are required")
                    if find_customer_by_phone(connection, phone):
                        raise ValueError("A customer with this mobile number already exists")
                    cursor = connection.execute(
                        """INSERT INTO customers
                           (name, phone, email, tier, birthday, tags, notes,
                            marketing_consent, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (name, phone, str(body.get("email", "")).strip(), body.get("tier", "Member"),
                         body.get("birthday") or None, json.dumps([body.get("tag", "New")]),
                         str(body.get("notes", "")).strip(), int(bool(body.get("consent"))), now_iso()),
                    )
                    connection.execute(
                        "INSERT INTO activities (kind, title, details, created_at) VALUES (?, ?, ?, ?)",
                        ("customer", "New guest profile created", f"{name} was added to the CRM", now_iso()),
                    )
                    connection.commit()
                    self.send_json({"id": cursor.lastrowid}, HTTPStatus.CREATED)
                    return
                if path == "/api/reservations":
                    self.require_roles("Owner", "Manager", "Cashier", "Host")
                    name = str(body.get("name", "")).strip()
                    phone = normalize_phone(str(body.get("phone", "")))
                    if not name or not phone or not body.get("date") or not body.get("time"):
                        raise ValueError("Guest, phone, date and time are required")
                    customer = find_customer_by_phone(connection, phone)
                    cursor = connection.execute(
                        """INSERT INTO reservations
                           (reservation_date, reservation_time, customer_id, name, phone, guests,
                            table_name, occasion, status, special_requests, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (body["date"], body["time"], customer["id"] if customer else None, name, phone,
                         max(1, int(body.get("guests", 1))), body.get("table", "Best available"),
                         body.get("occasion", "Regular visit"), body.get("status", "Pending"),
                         str(body.get("notes", "")).strip(), now_iso()),
                    )
                    connection.execute(
                        "INSERT INTO activities (kind, title, details, created_at) VALUES (?, ?, ?, ?)",
                        ("reservation", "Reservation created", f'{name} · {body.get("guests", 1)} guests · {body["time"]}', now_iso()),
                    )
                    connection.commit()
                    self.send_json({"id": cursor.lastrowid}, HTTPStatus.CREATED)
                    return
                if path == "/api/campaigns":
                    self.require_user("Manager")
                    name = str(body.get("name", "")).strip()
                    if not name:
                        raise ValueError("Campaign name is required")
                    send_choice = str(body.get("send", "Save as draft"))
                    status = "Scheduled" if send_choice == "Schedule" else "Draft"
                    audience = connection.execute("SELECT COUNT(*) FROM customers WHERE marketing_consent=1").fetchone()[0]
                    cursor = connection.execute(
                        """INSERT INTO campaigns
                           (name, channel, schedule_label, status, audience, opened_rate,
                            redeemed, revenue, offer_code, message, background, created_at)
                           VALUES (?, ?, ?, ?, ?, NULL, 0, 0, ?, ?, ?, ?)""",
                        (name, body.get("channel", "WhatsApp"), "Scheduled from CRM" if status == "Scheduled" else "Draft created just now", status, audience,
                         str(body.get("offer", "")).strip(), str(body.get("message", "")).strip(),
                         "linear-gradient(135deg, #0b1730, #3f5ee8)", now_iso()),
                    )
                    connection.commit()
                    self.send_json({"id": cursor.lastrowid}, HTTPStatus.CREATED)
                    return
                if path == "/api/rewards":
                    self.require_user("Manager")
                    name = str(body.get("name", "")).strip()
                    if not name:
                        raise ValueError("Reward name is required")
                    cursor = connection.execute(
                        """INSERT INTO rewards
                           (name, description, points_cost, eligibility, expiry_label, created_at)
                           VALUES (?, ?, ?, ?, ?, ?)""",
                        (name, str(body.get("description", "")).strip(), max(0, int(body.get("points", 0))),
                         body.get("eligibility", "All tiers"), body.get("expiry", "90 days"), now_iso()),
                    )
                    connection.commit()
                    self.send_json({"id": cursor.lastrowid}, HTTPStatus.CREATED)
                    return
                if path == "/api/settings":
                    self.require_user("Manager")
                    allowed = {"business_name", "primary_phone", "address", "timezone", "currency",
                               "points_per_rupee", "automatic_points", "reservation_reminders",
                               "marketing_requires_consent", "backup_enabled", "backup_retention_days",
                               "tier_silver", "tier_gold", "tier_platinum", "feedback_url",
                               "guest_wifi_name", "guest_wifi_password", "guest_wifi_demo"}
                    allowed.update({"operations_alert_recipient", "daily_sales_report_enabled",
                                    "low_stock_alert_enabled", "daily_report_time"})
                    for key, value in body.items():
                        if key in allowed:
                            connection.execute(
                                "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                                (key, json.dumps(value)),
                            )
                    connection.commit()
                    self.send_json({"saved": True})
                    return
                if path == "/api/reset":
                    self.require_user("Owner")
                    for table in ("service_requests", "public_order_submissions", "public_submissions", "communications", "point_ledger", "payments",
                                  "inventory_movements", "order_items", "attendance", "expenses",
                                  "recipes", "orders", "staff", "vendors", "inventory_items", "menu_items", "public_menu_items",
                                  "reservations", "feedback", "tasks", "campaigns", "rewards",
                                  "activities", "monthly_metrics", "customers", "settings"):
                        connection.execute(f"DELETE FROM {table}")
                    connection.commit()
                    seed_database(connection)
                    seed_operations(connection)
                    self.send_json({"reset": True})
                    return
                if path.startswith("/api/tasks/") and path.endswith("/complete"):
                    self.require_roles("Owner", "Manager", "Host")
                    task_id = int(path.split("/")[3])
                    connection.execute("UPDATE tasks SET status='Completed', completed_at=? WHERE id=?", (now_iso(), task_id))
                    connection.commit()
                    self.send_json({"completed": True})
                    return
                if path.startswith("/api/feedback/") and path.endswith("/recovery"):
                    self.require_roles("Owner", "Manager", "Host")
                    feedback_id = int(path.split("/")[3])
                    item = connection.execute("SELECT * FROM feedback WHERE id=?", (feedback_id,)).fetchone()
                    if not item:
                        self.send_json({"error": "Feedback not found"}, HTTPStatus.NOT_FOUND)
                        return
                    connection.execute("UPDATE feedback SET status='Resolved' WHERE id=?", (feedback_id,))
                    connection.execute(
                        """INSERT INTO tasks (title, details, priority, status, task_type, created_at)
                           VALUES (?, ?, 'High', 'Open', 'Recovery', ?)""",
                        (f'Follow up with {item["name"]}', f'{item["rating"]}-star feedback: {item["message"]}', now_iso()),
                    )
                    connection.commit()
                    self.send_json({"created": True})
                    return
            self.send_json({"error": "API route not found"}, HTTPStatus.NOT_FOUND)
        except PermissionError as error:
            status = HTTPStatus.UNAUTHORIZED if str(error) == "Authentication required" else HTTPStatus.FORBIDDEN
            self.send_json({"error": str(error)}, status)
        except sqlite3.IntegrityError as error:
            if "customers.phone" in str(error):
                message = "A customer with this phone number already exists"
            elif "users.email" in str(error):
                message = "A staff account with this email already exists"
            else:
                message = "The record could not be saved"
            self.send_json({"error": message}, HTTPStatus.CONFLICT)
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
        except Exception as error:  # Keep local API errors useful without exposing internals.
            print(f"API error: {error}", file=sys.stderr)
            self.send_json({"error": "Unexpected local server error"}, HTTPStatus.INTERNAL_SERVER_ERROR)


def run() -> None:
    init_database()
    port = int(os.environ.get("MANGOSTEEN_CRM_PORT", DEFAULT_PORT))
    server = ThreadingHTTPServer((HOST, port), CRMHandler)
    print(f"Mangosteen CRM is running at http://{HOST}:{port}")
    print(f"Local database: {DB_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Mangosteen CRM.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
