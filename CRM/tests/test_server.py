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

    def test_floor_reservation_lifecycle_persistence_and_conflicts(self):
        cookie, csrf = self.login()
        headers = {'X-CSRF-Token': csrf}
        day = (date.today() + timedelta(days=3)).isoformat()
        body = dict(name='Floor Test Guest', phone='9876543210', date=day, time='19:00', guests=2, tableId='R3', status='Confirmed', duration=90)
        status, created, _ = self.request('/api/reservations', body=body, cookie=cookie, headers=headers)
        self.assertEqual(status, 200, created)
        id = created['id']
        status, result, _ = self.request('/api/reservations', body={**body, 'time': '19:30'}, cookie=cookie, headers=headers)
        self.assertEqual(status, 400, result)
        self.assertIn('overlaps', result['error'])
        status, result, _ = self.request(f'/api/reservations/{id}/edit', body={**body, 'tableId': 'R2', 'time': '18:00'}, cookie=cookie, headers=headers)
        self.assertEqual(status, 200, result)
        _, snapshot, _ = self.request('/api/bootstrap', cookie=cookie)
        saved = next(r for r in snapshot['reservations'] if r['id'] == id)
        self.assertEqual(saved['tableId'], 'R2')
        self.assertEqual(saved['time'], '18:00')
        self.assertEqual(len(saved['history']), 2)
        status, result, _ = self.request(f'/api/reservations/{id}/status', body={'status':'Checked in'}, cookie=cookie, headers=headers)
        self.assertEqual(status, 400, result)
        status, result, _ = self.request(f'/api/reservations/{id}/status', body={'status':'Cancelled'}, cookie=cookie, headers=headers)
        self.assertEqual(status, 200, result)
        status, result, _ = self.request(f'/api/reservations/{id}/status', body={'status':'Confirmed'}, cookie=cookie, headers=headers)
        self.assertEqual(status, 400, result)

    def test_floor_walkin_cleaning_and_capacity(self):
        cookie, csrf = self.login()
        headers = {'X-CSRF-Token': csrf}
        path = '/api/tables/B1'
        status, result, _ = self.request(path, body={'action':'seat', 'name':'Walk In', 'guests':3}, cookie=cookie, headers=headers)
        self.assertEqual(status, 400, result)
        status, result, _ = self.request(path, body={'action':'seat', 'name':'Walk In', 'guests':2}, cookie=cookie, headers=headers)
        self.assertEqual(status, 200, result)
        _, snapshot, _ = self.request('/api/bootstrap', cookie=cookie)
        table = next(t for t in snapshot['tables'] if t['id'] == 'B1')
        self.assertEqual(table['displayStatus'], 'Occupied')
        self.assertEqual(table['session']['name'], 'Walk In')
        for action, expected in [('checkout','Cleaning'), ('available','Available')]:
            status, result, _ = self.request(path, body={'action':action}, cookie=cookie, headers=headers)
            self.assertEqual(status, 200, result)
            _, snapshot, _ = self.request('/api/bootstrap', cookie=cookie)
            self.assertEqual(next(t for t in snapshot['tables'] if t['id'] == 'B1')['displayStatus'], expected)

    def test_kitchen_cannot_manage_floor(self):
        cookie, csrf = self.login('kitchen@mangosteen.local')
        status, _, _ = self.request('/api/tables/B1', body={'action':'seat', 'name':'Forbidden', 'guests':2}, cookie=cookie, headers={'X-CSRF-Token':csrf})
        self.assertEqual(status, 403)

    def test_walkin_queue_seating_and_persistence(self):
        cookie, csrf = self.login()
        headers = {'X-CSRF-Token':csrf}
        body = dict(name='Waiting Test Guest',guests=3,estimatedWait=20,phone='',requestKey='local-walkin-123')
        status, entry, _ = self.request('/api/waitlist',body=body,cookie=cookie,headers=headers)
        self.assertEqual(status,200,entry)
        id = entry['id']
        status, duplicate, _ = self.request('/api/waitlist',body=body,cookie=cookie,headers=headers)
        self.assertEqual(duplicate['id'],id)
        status, error, _ = self.request(f'/api/waitlist/{id}',body=dict(action='seat',tableId='R1'),cookie=cookie,headers=headers)
        self.assertEqual(status,400,error)
        _, snapshot, _ = self.request('/api/bootstrap',cookie=cookie)
        saved = next(e for e in snapshot['waitlist'] if e['id']==id)
        self.assertEqual(saved['status'],'Waiting')
        status, error, _ = self.request(f'/api/waitlist/{id}',body=dict(action='edit',revision=999,**{k:v for k,v in body.items() if k!='requestKey'}),cookie=cookie,headers=headers)
        self.assertEqual(status,400,error)
        for action, fields in [('call',{}),('seat',{'tableId':'W2'})]:
            status, result, _ = self.request(f'/api/waitlist/{id}',body=dict(action=action,**fields),cookie=cookie,headers=headers)
            self.assertEqual(status,200,result)
        _, snapshot, _ = self.request('/api/bootstrap',cookie=cookie)
        self.assertEqual(next(e for e in snapshot['waitlist'] if e['id']==id)['status'],'Seated')
        self.assertEqual(next(t for t in snapshot['tables'] if t['id']=='W2')['session']['waitlistId'],id)
        status, result, _ = self.request(f'/api/waitlist/{id}',body=dict(action='seat',tableId='D2'),cookie=cookie,headers=headers)
        self.assertEqual(status,400,result)
        # An unrelated table update must preserve the queue/history metadata.
        self.request('/api/tables/W2',body=dict(action='assign',waiterId='1'),cookie=cookie,headers=headers)
        _, snapshot, _ = self.request('/api/bootstrap',cookie=cookie)
        self.assertEqual(next(e for e in snapshot['waitlist'] if e['id']==id)['status'],'Seated')

    def test_kitchen_cannot_manage_walkin_queue(self):
        cookie, csrf = self.login('kitchen@mangosteen.local')
        status, _, _ = self.request('/api/waitlist',body=dict(name='Denied',guests=2,estimatedWait=10),cookie=cookie,headers={'X-CSRF-Token':csrf})
        self.assertEqual(status,403)
        _, snapshot, _ = self.request('/api/bootstrap',cookie=cookie)
        self.assertEqual(snapshot['waitlist'],[])

    def test_kitchen_alerts_and_floor_service_lifecycle(self):
        cookie,csrf=self.login()
        headers={'X-CSRF-Token':csrf}
        status,created,_=self.request('/api/users',body=dict(name='Floor QA',email='floor-qa@example.com',role='Floor Staff',password='FloorDemo@123'),cookie=cookie,headers=headers)
        self.assertEqual(status,201,created)
        status,created,_=self.request('/api/orders',body=dict(table='Table 4',items=[dict(menuItemId=1,quantity=1)]),cookie=cookie,headers=headers)
        self.assertEqual(status,201,created)
        id=created['id']
        status,result,_=self.request(f'/api/orders/{id}/send',body={},cookie=cookie,headers=headers)
        self.assertEqual(status,200,result)
        with crm.connect() as connection:
            connection.execute('UPDATE orders SET sent_at=? WHERE id=?',((crm.datetime.now().astimezone()-timedelta(minutes=16)).isoformat(),id))
            connection.commit()
        kitchen,kcsrf=self.login('kitchen@mangosteen.local')
        status,snapshot,_=self.request('/api/service/alerts',cookie=kitchen)
        self.assertEqual(status,200,snapshot)
        self.assertTrue(next(o for o in snapshot['orders'] if o['id']==id)['delayed'])
        for state in ('Preparing','Ready'):
            status,result,_=self.request(f'/api/orders/{id}/status',body=dict(status=state),cookie=kitchen,headers={'X-CSRF-Token':kcsrf})
            self.assertEqual(status,200,result)
        status,_,_=self.request(f'/api/service/orders/{id}/accept',body={},cookie=kitchen,headers={'X-CSRF-Token':kcsrf})
        self.assertEqual(status,403)
        floor,fcsrf=self.login('floor-qa@example.com','FloorDemo@123')
        status,snapshot,_=self.request('/api/bootstrap',cookie=floor)
        self.assertEqual(status,200,snapshot)
        self.assertEqual(snapshot['customers'],[])
        self.assertEqual(snapshot['inventory'],[])
        self.assertTrue(any(o['id']==id for o in snapshot['service']['orders']))
        status,_,_=self.request('/api/export/customers.csv',cookie=floor)
        self.assertEqual(status,403)
        status,_,_=self.request('/api/service/settings',body=dict(prepMinutes=10,readyMinutes=4),cookie=floor,headers={'X-CSRF-Token':fcsrf})
        self.assertEqual(status,403)
        for action in ('accept','served'):
            status,result,_=self.request(f'/api/service/orders/{id}/{action}',body={},cookie=floor,headers={'X-CSRF-Token':fcsrf})
            self.assertEqual(status,200,result)
        _,snapshot,_=self.request('/api/service/alerts',cookie=floor)
        self.assertFalse(any(o['id']==id for o in snapshot['orders']))
        status,_,_=self.request(f'/api/orders/{id}/status',body=dict(status='Ready'),cookie=kitchen,headers={'X-CSRF-Token':kcsrf})
        self.assertEqual(status,400)

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
            "paymentMethod": "demo-upi", "notes": "Less spicy", "website": "",
            "items": [
                {"category": "Pizza & Pide", "name": "Margarita", "quantity": 2, "unitPrice": 499},
                {"category": "Mocktail & Coolers", "name": "Virgin mojito", "quantity": 1, "unitPrice": 250},
            ],
        }
        first_status, first, _ = self.request("/api/public/orders", headers={"Idempotency-Key": key}, body=body)
        second_status, second, _ = self.request("/api/public/orders", headers={"Idempotency-Key": key}, body=body)
        self.assertEqual(first_status, 201)
        self.assertEqual(second_status, 200)
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(first["total"], 1310)
        with crm.connect() as connection:
            order = connection.execute("SELECT table_name, status, payment_method FROM orders WHERE id=?", (first["id"],)).fetchone()
            self.assertEqual(order["status"], "Kitchen")
            self.assertEqual(order["payment_method"], "Demo UPI")
            self.assertIn("QR 4 · Table 4", order["table_name"])

    def test_public_demo_order_rejects_unknown_table_qr(self):
        status, payload, _ = self.request("/api/public/orders", headers={"Idempotency-Key": "unknown-table-order"}, body={
            "table": "T-999", "guestName": "Demo Guest", "paymentMethod": "demo-card", "website": "",
            "items": [{"category": "Pizza & Pide", "name": "Margarita", "quantity": 1, "unitPrice": 499}],
        })
        self.assertEqual(status, 400)
        self.assertIn("recognized table QR", payload["error"])

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
