import json
import os
import sys
import tempfile
import threading
import unittest
from datetime import date, timedelta
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


CRM_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CRM_ROOT))
import server as crm  # noqa: E402


class CRMServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        root = Path(cls.temp.name)
        cls.original_paths = (crm.DATA_DIR, crm.DB_PATH, crm.BACKUP_DIR)
        crm.DATA_DIR = root / "data"
        crm.DB_PATH = crm.DATA_DIR / "test.sqlite3"
        crm.BACKUP_DIR = root / "backups"
        crm.PUBLIC_REQUESTS.clear()
        crm.init_database()
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), crm.CRMHandler)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=2)
        crm.DATA_DIR, crm.DB_PATH, crm.BACKUP_DIR = cls.original_paths
        cls.temp.cleanup()

    def request(self, path, *, body=None, headers=None, cookie=None):
        encoded = json.dumps(body).encode() if body is not None else None
        request_headers = {"Content-Type": "application/json", **(headers or {})}
        if cookie:
            request_headers["Cookie"] = cookie
        request = Request(self.base + path, data=encoded, headers=request_headers,
                          method="POST" if body is not None else "GET")
        try:
            response = urlopen(request, timeout=5)
        except HTTPError as error:
            try:
                return error.code, json.loads(error.read()), error.headers
            finally:
                error.close()
        try:
            return response.status, json.loads(response.read()), response.headers
        finally:
            response.close()

    def login(self, email="owner@mangosteen.local", password="Mangosteen@123"):
        status, payload, headers = self.request("/api/auth/login", body={"email": email, "password": password})
        self.assertEqual(status, 200)
        cookie = headers.get("Set-Cookie").split(";", 1)[0]
        return cookie, payload["csrfToken"]

    def reservation(self, request_key="reservation-test-1"):
        return self.request("/api/public/reservations", headers={"Idempotency-Key": request_key}, body={
            "name": "Test Guest", "phone": "98765 43210", "email": "guest@example.com",
            "date": (date.today() + timedelta(days=1)).isoformat(), "time": "19:00", "guests": 2,
            "area": "The rooftop", "table": "Railside 01", "seats": ["R1-1", "R1-2"],
            "occasion": "Regular visit", "specialRequests": "", "consent": False, "website": "",
        })

    def test_public_reservation_is_validated_normalized_and_idempotent(self):
        key = "reservation-idempotency-test"
        first_status, first, _ = self.reservation(key)
        second_status, second, _ = self.reservation(key)
        self.assertEqual(first_status, 201)
        self.assertEqual(second_status, 200)
        self.assertEqual(first["id"], second["id"])
        with crm.connect() as connection:
            phone = connection.execute("SELECT phone FROM reservations WHERE id=?", (first["id"],)).fetchone()[0]
        self.assertEqual(phone, "+919876543210")

    def test_public_reservation_rejects_invented_or_duplicate_seats(self):
        status, payload, _ = self.request("/api/public/reservations", headers={"Idempotency-Key": "bad-seat-test"}, body={
            "name": "Test Guest", "phone": "+91 98765 43211", "date": (date.today() + timedelta(days=1)).isoformat(),
            "time": "19:00", "guests": 2, "area": "The rooftop", "table": "Railside 01",
            "seats": ["R1-1", "R1-1"], "website": "",
        })
        self.assertEqual(status, 400)
        self.assertIn("unique seats", payload["error"])

    def test_public_demo_order_reaches_kitchen_and_is_idempotent(self):
        key = "qr-order-idempotency-test"
        body = {
            "table": "4", "guestName": "Demo Guest", "phone": "9876543210",
            "tableAccessKey": "mg-t04-c3b8701d6f9254ae", "notes": "Less spicy", "website": "",
            "items": [
                {"category": "Pizza & Pide", "name": "Margarita", "quantity": 2, "unitPrice": 499},
                {"category": "Mocktail & Coolers", "name": "Virgin mojito", "quantity": 1, "unitPrice": 250},
            ],
            "payment": {"status": "Paid", "method": "UPI", "reference": "DEMO-ORDER-001", "mode": "Demo"},
        }
        first_status, first, _ = self.request("/api/public/orders", headers={"Idempotency-Key": key}, body=body)
        second_status, second, _ = self.request("/api/public/orders", headers={"Idempotency-Key": key}, body=body)
        self.assertEqual(first_status, 201)
        self.assertEqual(second_status, 200)
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(first["total"], 1310)
        with crm.connect() as connection:
            order = connection.execute("SELECT table_name, status, payment_method, paid_at, public_token FROM orders WHERE id=?", (first["id"],)).fetchone()
            self.assertEqual(order["status"], "Kitchen")
            self.assertEqual(order["payment_method"], "UPI")
            self.assertIsNotNone(order["paid_at"])
            self.assertEqual(order["public_token"], first["publicToken"])
            self.assertIn("QR 4 · Table 04", order["table_name"])
            payment_count = connection.execute("SELECT COUNT(*) FROM payments WHERE order_id=?", (first["id"],)).fetchone()[0]
            self.assertEqual(payment_count, 1)
        self.assertTrue(first["prepaid"])
        self.assertEqual(first["paymentMethod"], "UPI")

    def test_qr_order_requires_payment_before_kitchen(self):
        status, payload, _ = self.request("/api/public/orders", headers={"Idempotency-Key": "unpaid-order-test"}, body={
            "table": "4", "tableAccessKey": "mg-t04-c3b8701d6f9254ae", "guestName": "Unpaid Guest", "website": "",
            "items": [{"category": "Pizza & Pide", "name": "Margarita", "quantity": 1, "unitPrice": 499}],
        })
        self.assertEqual(status, 400)
        self.assertIn("payment", payload["error"])

    def test_public_demo_order_rejects_unknown_table_qr(self):
        status, payload, _ = self.request("/api/public/orders", headers={"Idempotency-Key": "unknown-table-order"}, body={
            "table": "T-999", "tableAccessKey": "invalid", "guestName": "Demo Guest", "website": "",
            "items": [{"category": "Pizza & Pide", "name": "Margarita", "quantity": 1, "unitPrice": 499}],
            "payment": {"status": "Paid", "method": "UPI", "reference": "DEMO-UNKNOWN-001", "mode": "Demo"},
        })
        self.assertEqual(status, 403)
        self.assertIn("Scan the QR", payload["error"])

    def test_owner_menu_change_reaches_public_menu_and_blocks_unavailable_order(self):
        cookie, csrf = self.login()
        item_path = "Pizza%20%26%20Pide%3A10"
        status, _, _ = self.request(
            f"/api/public-menu-items/{item_path}", cookie=cookie, headers={"X-CSRF-Token": csrf},
            body={"price": 525, "active": False},
        )
        self.assertEqual(status, 200)
        menu_status, menu, _ = self.request("/api/public/menu")
        self.assertEqual(menu_status, 200)
        margarita = next(item for category in menu["categories"] if category["name"] == "Pizza & Pide"
                         for item in category["items"] if item["name"] == "Margarita")
        self.assertEqual(margarita["price"], 525)
        self.assertFalse(margarita["available"])
        order_status, payload, _ = self.request("/api/public/orders", headers={"Idempotency-Key": "unavailable-menu-order"}, body={
            "table": "4", "tableAccessKey": "mg-t04-c3b8701d6f9254ae", "guestName": "Menu Guest", "website": "",
            "items": [{"category": "Pizza & Pide", "name": "Margarita", "quantity": 1, "unitPrice": 1}],
            "payment": {"status": "Paid", "method": "Card", "reference": "DEMO-MENU-001", "mode": "Demo"},
        })
        self.assertEqual(order_status, 400)
        self.assertIn("unavailable", payload["error"])
        self.request(f"/api/public-menu-items/{item_path}", cookie=cookie, headers={"X-CSRF-Token": csrf}, body={"price": 499, "active": True})

    def test_owner_can_manage_tables_and_queue_daily_alerts(self):
        cookie, csrf = self.login()
        table_status, _, _ = self.request("/api/tables/5", cookie=cookie, headers={"X-CSRF-Token": csrf}, body={
            "label": "Garden Table 05", "zoneName": "Garden", "capacity": 6, "active": True,
        })
        self.assertEqual(table_status, 200)
        table_session_status, session, _ = self.request("/api/public/table?table=5&key=mg-t05-197e4a63b8d025cf")
        self.assertEqual(table_session_status, 200)
        self.assertEqual(session["table"]["label"], "Garden Table 05")
        alert_status, alert, _ = self.request("/api/notifications/run-daily", cookie=cookie, headers={"X-CSRF-Token": csrf}, body={})
        self.assertEqual(alert_status, 200)
        self.assertGreaterEqual(alert["queued"], 1)
        with crm.connect() as connection:
            self.assertGreater(connection.execute("SELECT COUNT(*) FROM communications WHERE provider='Scheduled local outbox'").fetchone()[0], 0)

    def test_qr_table_services_tracking_bill_and_feedback_flow(self):
        status, table, _ = self.request("/api/public/table?table=4&key=mg-t04-c3b8701d6f9254ae")
        self.assertEqual(status, 200)
        self.assertEqual(table["table"]["label"], "Table 04")
        self.assertTrue(table["wifi"]["password"])

        order_status, order, _ = self.request(
            "/api/public/orders",
            headers={"Idempotency-Key": "priority-one-flow-order"},
            body={
                "table": "4", "tableAccessKey": "mg-t04-c3b8701d6f9254ae",
                "guestName": "Priority Guest", "phone": "", "notes": "", "website": "",
                "items": [{"category": "Pizza & Pide", "name": "Margarita", "quantity": 1, "unitPrice": 499}],
                "payment": {"status": "Paid", "method": "UPI", "reference": "DEMO-FLOW-001", "mode": "Demo"},
            },
        )
        self.assertEqual(order_status, 201)
        token = order["publicToken"]
        tracking_status, tracking, _ = self.request(f"/api/public/orders/{token}")
        self.assertEqual(tracking_status, 200)
        self.assertEqual(tracking["status"], "Kitchen")

        waiter_status, waiter, _ = self.request("/api/public/service-requests", body={
            "type": "waiter", "table": "4", "tableAccessKey": "mg-t04-c3b8701d6f9254ae",
        })
        self.assertEqual(waiter_status, 201)
        cookie, csrf = self.login()
        ack_status, _, _ = self.request(
            f"/api/service-requests/{waiter['id']}/acknowledge", body={},
            headers={"X-CSRF-Token": csrf}, cookie=cookie,
        )
        self.assertEqual(ack_status, 200)
        waiter_tracking_status, waiter_tracking, _ = self.request(f"/api/public/service-requests/{waiter['token']}")
        self.assertEqual(waiter_tracking_status, 200)
        self.assertEqual(waiter_tracking["status"], "Acknowledged")

        bill_status, bill_payload, _ = self.request("/api/public/service-requests", body={
            "type": "bill", "orderToken": token, "paymentPreference": "Cash at table",
        })
        self.assertEqual(bill_status, 400)
        self.assertIn("prepaid", bill_payload["error"])
        feedback_status, feedback, _ = self.request("/api/public/feedback", body={
            "orderToken": token, "rating": 5, "tags": ["Tasty food"], "message": "Lovely evening",
        })
        self.assertEqual(feedback_status, 201)
        self.assertIn("google", feedback["googleReviewUrl"])

    def test_trusted_proxy_uses_forwarded_client_for_rate_limits(self):
        previous = os.environ.get("MANGOSTEEN_TRUSTED_PROXIES")
        os.environ["MANGOSTEEN_TRUSTED_PROXIES"] = "127.0.0.1"
        crm.PUBLIC_REQUESTS.clear()
        try:
            for index in range(9):
                status, _, _ = self.request(
                    "/api/public/reservations",
                    headers={"Idempotency-Key": f"proxy-client-{index}", "X-Forwarded-For": f"203.0.113.{index + 1}"},
                    body={
                        "name": "Proxy Guest", "phone": "98765 43210",
                        "date": (date.today() + timedelta(days=1)).isoformat(), "time": "19:00", "guests": 2,
                        "area": "The rooftop", "table": "Railside 01", "seats": ["R1-1", "R1-2"], "website": "",
                    },
                )
                self.assertEqual(status, 201)
        finally:
            if previous is None:
                os.environ.pop("MANGOSTEEN_TRUSTED_PROXIES", None)
            else:
                os.environ["MANGOSTEEN_TRUSTED_PROXIES"] = previous
            crm.PUBLIC_REQUESTS.clear()

    def test_authenticated_mutations_require_csrf(self):
        cookie, _ = self.login()
        status, payload, _ = self.request("/api/customers", cookie=cookie, body={"name": "No CSRF", "phone": "9876543212"})
        self.assertEqual(status, 403)
        self.assertIn("CSRF", payload["error"])

    def test_kitchen_role_cannot_write_guest_records(self):
        cookie, csrf = self.login("kitchen@mangosteen.local")
        status, _, _ = self.request("/api/customers", cookie=cookie, headers={"X-CSRF-Token": csrf},
                                    body={"name": "Forbidden Guest", "phone": "9876543213"})
        self.assertEqual(status, 403)

    def test_floor_staff_has_restricted_handoff_access(self):
        cookie, csrf = self.login("floor@mangosteen.local")
        status, payload, _ = self.request("/api/bootstrap", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(payload["user"]["role"], "Floor Staff")
        self.assertEqual(payload["customers"], [])
        self.assertEqual(payload["inventory"], [])
        self.assertEqual(payload["settings"], {})
        self.assertEqual(payload["menuItems"], [])
        ready_order = next(order for order in payload["orders"] if order["status"] == "Ready")

        forbidden_status, _, _ = self.request(
            f"/api/orders/{ready_order['id']}/status", cookie=cookie,
            headers={"X-CSRF-Token": csrf}, body={"status": "Preparing"},
        )
        self.assertEqual(forbidden_status, 403)

        served_status, served, _ = self.request(
            f"/api/orders/{ready_order['id']}/status", cookie=cookie,
            headers={"X-CSRF-Token": csrf}, body={"status": "Served"},
        )
        self.assertEqual(served_status, 200)
        self.assertEqual(served["status"], "Served")

    def test_session_survives_a_separate_request(self):
        cookie, _ = self.login()
        status, payload, _ = self.request("/api/auth/session", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertTrue(payload["authenticated"])
        self.assertTrue(payload["csrfToken"])

    def test_repeated_failed_logins_are_temporarily_locked(self):
        credentials = {"email": "unknown-lockout@example.com", "password": "incorrect"}
        for _ in range(crm.LOGIN_FAILURE_LIMIT):
            status, _, _ = self.request("/api/auth/login", body=credentials)
            self.assertEqual(status, 401)
        status, payload, _ = self.request("/api/auth/login", body=credentials)
        self.assertEqual(status, 429)
        self.assertIn("15 minutes", payload["error"])


if __name__ == "__main__":
    unittest.main()
