#!/usr/bin/env python3
"""Local Mangosteen CRM server.

Runs the static CRM UI and a small SQLite-backed JSON API without external
dependencies. This is intended for local development and client demos. Add
production authentication, HTTPS, backups, and managed infrastructure before
using real customer data over a network.
"""

from __future__ import annotations

import csv
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
from email.message import EmailMessage
from http.cookies import SimpleCookie
from datetime import date, datetime, timedelta
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "mangosteen_crm.sqlite3"
BACKUP_DIR = ROOT / "backups"
HOST = "127.0.0.1"
DEFAULT_PORT = 4173
SESSION_COOKIE = "mangosteen_session"
SESSION_TTL = timedelta(hours=12)
SESSIONS: dict[str, dict] = {}
PUBLIC_REQUESTS: dict[str, list[datetime]] = {}
ROLE_LEVEL = {"Host": 1, "Manager": 2, "Owner": 3}


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
  role TEXT NOT NULL DEFAULT 'Host' CHECK (role IN ('Owner', 'Manager', 'Host')),
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


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


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
        seed_database(connection)
        seed_owner(connection)
        additions = {
            "backup_enabled": True,
            "backup_retention_days": 30,
            "tier_silver": 8000,
            "tier_gold": 18000,
            "tier_platinum": 35000,
            "feedback_url": "http://127.0.0.1:4173/feedback",
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
    with connect() as source, sqlite3.connect(destination) as target:
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
    return {"customers": customers, "reservations": reservations, "campaigns": campaigns,
            "feedback": feedback, "tasks": tasks, "rewards": rewards,
            "activities": activities, "monthlyMetrics": metrics, "settings": settings,
            "users": users if role_level >= ROLE_LEVEL["Manager"] else [],
            "communications": communications if role_level >= ROLE_LEVEL["Manager"] else [],
            "pointLedger": point_ledger if role_level >= ROLE_LEVEL["Manager"] else [],
            "backups": list_backups() if role_level >= ROLE_LEVEL["Owner"] else [],
            "integrations": integration_status() if role_level >= ROLE_LEVEL["Manager"] else {},
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
        existing = connection.execute("SELECT id FROM customers WHERE phone=?", (phone,)).fetchone()
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
        session = SESSIONS.get(morsel.value)
        if not session:
            return None
        if datetime.now().astimezone() - session["created_at"] > SESSION_TTL:
            SESSIONS.pop(morsel.value, None)
            return None
        with connect() as connection:
            row = connection.execute(
                "SELECT id, name, email, role, active FROM users WHERE id=?", (session["user_id"],)
            ).fetchone()
        if not row or not row["active"]:
            SESSIONS.pop(morsel.value, None)
            return None
        return dict(row)

    def require_user(self, minimum_role: str = "Host") -> dict:
        user = self.current_user()
        if not user:
            raise PermissionError("Authentication required")
        if ROLE_LEVEL.get(user["role"], 0) < ROLE_LEVEL[minimum_role]:
            raise PermissionError(f"{minimum_role} access is required")
        return user

    def set_session_cookie(self, token: str) -> None:
        self.send_header("Set-Cookie", f"{SESSION_COOKIE}={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200")

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
        address = self.client_address[0]
        now = datetime.now().astimezone()
        recent = [timestamp for timestamp in PUBLIC_REQUESTS.get(address, []) if now - timestamp < timedelta(hours=1)]
        if len(recent) >= 8:
            PUBLIC_REQUESTS[address] = recent
            return False
        recent.append(now)
        PUBLIC_REQUESTS[address] = recent
        return True

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
        path = urlparse(self.path).path
        if path == "/api/health":
            self.send_json({"status": "ok", "database": DB_PATH.name})
            return
        if path == "/api/auth/session":
            user = self.current_user()
            self.send_json({"authenticated": bool(user), "user": user})
            return
        if path.startswith("/api/"):
            try:
                user = self.require_user()
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
                    phone = str(body.get("phone", "")).strip()
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
                    if len(phone) < 7 or len(phone) > 24:
                        raise ValueError("Please enter a valid mobile number")
                    if email and (len(email) > 120 or "@" not in email):
                        raise ValueError("Please enter a valid email address")
                    requested_day = date.fromisoformat(reservation_date)
                    if requested_day < date.today() or requested_day > date.today() + timedelta(days=90):
                        raise ValueError("Reservation date must be within the next 90 days")
                    if not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", reservation_time):
                        raise ValueError("Please choose a valid arrival time")
                    if guests < 1 or guests > 12:
                        raise ValueError("Online reservations support 1 to 12 guests")
                    if not isinstance(seats, list) or len(seats) != guests or any(len(str(seat)) > 20 for seat in seats):
                        raise ValueError("Please select one seat for every guest")

                    customer = connection.execute("SELECT id FROM customers WHERE phone=?", (phone,)).fetchone()
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

            if path == "/api/auth/login":
                email = str(body.get("email", "")).strip().lower()
                password = str(body.get("password", ""))
                with connect() as connection:
                    row = connection.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
                    if not row or not row["active"] or not password_matches(password, row["password_hash"]):
                        self.send_json({"error": "Email or password is incorrect"}, HTTPStatus.UNAUTHORIZED)
                        return
                    token = secrets.token_urlsafe(32)
                    SESSIONS[token] = {"user_id": row["id"], "created_at": datetime.now().astimezone()}
                    connection.execute("UPDATE users SET last_login_at=? WHERE id=?", (now_iso(), row["id"]))
                    connection.commit()
                    user = {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"]}
                self.send_json({"authenticated": True, "user": user}, session_token=token)
                return

            user = self.require_user()
            if path == "/api/auth/logout":
                cookie = SimpleCookie(self.headers.get("Cookie", ""))
                morsel = cookie.get(SESSION_COOKIE)
                if morsel:
                    SESSIONS.pop(morsel.value, None)
                self.send_json({"authenticated": False}, clear_cookie=True)
                return

            with connect() as connection:
                if path == "/api/auth/change-password":
                    current_password = str(body.get("currentPassword", ""))
                    new_password = str(body.get("newPassword", ""))
                    record = connection.execute("SELECT password_hash FROM users WHERE id=?", (user["id"],)).fetchone()
                    if not password_matches(current_password, record["password_hash"]):
                        raise ValueError("Current password is incorrect")
                    if len(new_password) < 10 or not any(char.isdigit() for char in new_password) or not any(char.isalpha() for char in new_password):
                        raise ValueError("New password must be at least 10 characters and include letters and numbers")
                    connection.execute("UPDATE users SET password_hash=? WHERE id=?", (password_hash(new_password), user["id"]))
                    connection.commit()
                    self.send_json({"changed": True})
                    return

                if path == "/api/users":
                    self.require_user("Owner")
                    name = str(body.get("name", "")).strip()
                    email = str(body.get("email", "")).strip().lower()
                    role = str(body.get("role", "Host")).title()
                    password = str(body.get("password", ""))
                    if not name or "@" not in email:
                        raise ValueError("Name and a valid email are required")
                    if role not in ROLE_LEVEL:
                        raise ValueError("Role must be Owner, Manager or Host")
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
                    name = str(body.get("name", "")).strip()
                    phone = str(body.get("phone", "")).strip()
                    if not name or not phone:
                        raise ValueError("Name and mobile number are required")
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
                    name = str(body.get("name", "")).strip()
                    phone = str(body.get("phone", "")).strip()
                    if not name or not phone or not body.get("date") or not body.get("time"):
                        raise ValueError("Guest, phone, date and time are required")
                    customer = connection.execute("SELECT id FROM customers WHERE phone = ?", (phone,)).fetchone()
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
                               "tier_silver", "tier_gold", "tier_platinum", "feedback_url"}
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
                    for table in ("public_submissions", "communications", "point_ledger", "reservations", "feedback", "tasks", "campaigns", "rewards", "activities", "monthly_metrics", "customers", "settings"):
                        connection.execute(f"DELETE FROM {table}")
                    connection.commit()
                    seed_database(connection)
                    self.send_json({"reset": True})
                    return
                if path.startswith("/api/tasks/") and path.endswith("/complete"):
                    task_id = int(path.split("/")[3])
                    connection.execute("UPDATE tasks SET status='Completed', completed_at=? WHERE id=?", (now_iso(), task_id))
                    connection.commit()
                    self.send_json({"completed": True})
                    return
                if path.startswith("/api/feedback/") and path.endswith("/recovery"):
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
