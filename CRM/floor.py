"""SQLite adapter for table visits and reservation management in local demos."""
import json
from datetime import datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))
ACTIVE = ('Confirmed', 'Checked in')
STATUSES = ('Pending', 'Confirmed', 'Checked in', 'Completed', 'No-show', 'Cancelled')


def today():
    return datetime.now(IST).date().isoformat()


def stamp():
    return datetime.now(IST).isoformat()


def start(r):
    return datetime.fromisoformat(f"{r['date']}T{r['time']}:00+05:30")


def ensure(state):
    if 'tables' not in state:
        specs = [('R1', 'Railside 01', 2), ('R2', 'Railside 02', 2), ('R3', 'Railside 03', 2),
                 ('G1', 'Garden 01', 4), ('G2', 'Garden 02', 4), ('C1', 'Canopy 01', 6),
                 ('L1', 'Lounge 01', 4), ('L2', 'Lounge 02', 4), ('W1', 'Window 01', 4),
                 ('W2', 'Window 02', 4), ('D1', 'Dining 01', 6), ('D2', 'Dining 02', 4),
                 ('S1', 'Sofa 01', 4), ('S2', 'Sofa 02', 2), ('B1', 'Bar side', 2), ('4', 'Table 4', 4)]
        state['tables'] = [dict(id=id, label=label, capacity=capacity, zone='Rooftop' if i < 8 else 'Inside' if i < 15 else 'Cafe floor', status='Available', waiterId='', session=None) for i, (id, label, capacity) in enumerate(specs)]
    for r in state['reservations']:
        t = next((t for t in state['tables'] if t['id'] == r.get('tableId') or r.get('table', '').lower() in (t['id'].lower(), t['label'].lower())), None)
        r['tableId'] = t['id'] if t else ''
        r.setdefault('duration', 90)
        r.setdefault('revision', 1)
        r.setdefault('history', [])
    return state


def orders(state, t):
    names = {t['id'].lower(), t['label'].lower()}
    if t['id'] == '4':
        names.add('t-04')
    return [o for o in state.get('orders', []) if not o.get('floorClosedAt') and o['status'] not in ('Paid', 'Cancelled') and (o.get('table', '').lower() in names or str(o.get('tableCode')) == t['id'] or o.get('tableId') == t['id'])]


def paid(order):
    return bool(order.get('paidAt') or order['status'] == 'Paid' or order.get('paymentStatus') == 'Paid')


def keep_paid_visit(state, order_id):
    for t in state['tables']:
        order = next((o for o in orders(state, t) if o['id'] == order_id), None)
        if order and not t.get('session'):
            t.update(status='Occupied', session=dict(name=order.get('guestName') or 'Table guests', guests=None, startedAt=order['createdAt']))


def validate(state, r):
    if len(r.get('name', '').strip()) < 2 or len(''.join(c for c in r.get('phone', '') if c.isdigit())) < 7:
        raise ValueError('Enter a guest name and valid phone number.')
    start(r)  # strict ISO validation
    if not 1 <= r['guests'] <= 30 or not 15 <= r['duration'] <= 480:
        raise ValueError('Guests must be 1–30 and visit duration 15–480 minutes.')
    t = next((t for t in state['tables'] if t['id'] == r['tableId']), None)
    if r['tableId'] and not t:
        raise ValueError('Choose a valid table.')
    if t and r['guests'] > t['capacity']:
        raise ValueError(f"{t['label']} seats {t['capacity']}. Choose a larger table.")
    if r['status'] in ACTIVE:
        if not t:
            raise ValueError('Assign a table before confirming or checking in.')
        if r['date'] < today():
            raise ValueError('Cannot confirm a booking in the past.')
        for other in state['reservations']:
            if other['id'] != r['id'] and other['tableId'] == r['tableId'] and other['status'] in ACTIVE and start(other) < start(r) + timedelta(minutes=r['duration']) and start(r) < start(other) + timedelta(minutes=other['duration']):
                raise ValueError(f"{t['label']} overlaps with {other['name']} at {other['time']}. Choose another table or time.")


def record(r, user, action, note=''):
    r['revision'] = r.get('revision', 0) + 1
    r['updatedAt'] = stamp()
    r.setdefault('history', []).append(dict(at=r['updatedAt'], by=user['name'], action=action, note=note))


def reservation_action(state, id, body, user, edit=False):
    original = next((r for r in state['reservations'] if r['id'] == id), None)
    if id and not original:
        raise ValueError('Reservation not found.')
    if original and 'revision' in body and int(body['revision']) != original['revision']:
        raise ValueError('This booking changed. Refresh and try again.')
    if edit or not id:
        if original and original['status'] not in ('Pending', 'Confirmed'):
            raise ValueError('Only pending or confirmed bookings can be edited.')
        r = dict(original or {})
        r.update(id=id or max([0] + [r['id'] for r in state['reservations']]) + 1,
                 name=str(body.get('name', '')).strip()[:100], phone=str(body.get('phone', '')).strip()[:30],
                 date=str(body.get('date', '')), time=str(body.get('time', '')), guests=int(body.get('guests', 0)),
                 duration=int(body.get('duration', 90)), tableId=str(body.get('tableId', '')),
                 occasion=str(body.get('occasion', 'Regular visit'))[:100], specialRequests=str(body.get('specialRequests', body.get('notes', '')))[:2000],
                 status=original['status'] if original else body.get('status', 'Pending'), createdAt=(original or {}).get('createdAt', stamp()))
        if r['status'] not in ('Pending', 'Confirmed') or r['date'] < today():
            raise ValueError('Choose today or a future date and Pending or Confirmed status.')
        r['table'] = next((t['label'] for t in state['tables'] if t['id'] == r['tableId']), 'Best available')
        validate(state, r)
        record(r, user, 'Booking updated / rescheduled' if original else 'Booking created', f"{original['date']} {original['time']} → {r['date']} {r['time']}" if original else '')
        if original:
            original.update(r)
        else:
            state['reservations'].append(r)
        return r
    r = original
    status = body.get('status')
    transitions = {'Pending': ('Confirmed', 'Cancelled'), 'Confirmed': ('Checked in', 'Cancelled', 'No-show'), 'Checked in': ('Completed',)}
    if status not in transitions.get(r['status'], ()):
        raise ValueError(f"Cannot change {r['status']} to {status}.")
    validate(state, {**r, 'status': status})
    t = next((t for t in state['tables'] if t['id'] == r['tableId']), None)
    if status == 'Checked in':
        if r['date'] != today() or t['status'] != 'Available' or orders(state, t):
            raise ValueError('Check in on the reservation date after the table is free and cleaned.')
        t.update(status='Occupied', session=dict(reservationId=id, name=r['name'], guests=r['guests'], startedAt=stamp()))
        r['checkedInAt'] = stamp()
    if status == 'No-show' and start(r) > datetime.now(IST):
        raise ValueError('Mark no-show only after the arrival time.')
    if status == 'Completed':
        if not t or (t.get('session') or {}).get('reservationId') != id or any(not paid(o) for o in orders(state, t)):
            raise ValueError('Settle all table bills before checking out the matching visit.')
        t.update(status='Cleaning', session=None)
        for o in orders(state, t):
            o['floorClosedAt'] = stamp()
        r['completedAt'] = stamp()
    r['status'] = status
    record(r, user, status, str(body.get('reason', ''))[:500])
    return r


def table_action(state, id, body, user):
    t = next((t for t in state['tables'] if t['id'] == id), None)
    if not t:
        raise ValueError('Table not found.')
    action = body.get('action')
    if action == 'assign':
        staff_id = str(body.get('waiterId', ''))
        if staff_id and not any(str(s['id']) == staff_id for s in state['staff']):
            raise ValueError('Choose a staff member from the roster.')
        t['waiterId'] = staff_id
    elif action == 'seat':
        if t['status'] != 'Available' or orders(state, t):
            raise ValueError('This table is not available.')
        guests, name = int(body.get('guests', 0)), str(body.get('name', '')).strip()
        if len(name) < 2 or not 1 <= guests <= t['capacity']:
            raise ValueError('Enter a guest name and a party within table capacity.')
        now = datetime.now(IST)
        if any(r['tableId'] == id and r['status'] in ACTIVE and start(r) < now + timedelta(minutes=90) and start(r) + timedelta(minutes=r['duration']) > now for r in state['reservations']):
            raise ValueError('A confirmed booking needs this table within 90 minutes.')
        t.update(status='Occupied', session=dict(name=name, guests=guests, startedAt=stamp()))
    elif action == 'checkout':
        open_orders = orders(state, t)
        if (not t.get('session') and not open_orders) or any(not paid(o) for o in open_orders):
            raise ValueError('Settle all open table bills before checking out an active visit.')
        if (t.get('session') or {}).get('reservationId'):
            return reservation_action(state, t['session']['reservationId'], {'status': 'Completed'}, user)
        t.update(status='Cleaning', session=None)
        for o in open_orders:
            o['floorClosedAt'] = stamp()
    elif action == 'available':
        if t['status'] != 'Cleaning':
            raise ValueError('Only a table being cleaned can be marked available.')
        t['status'] = 'Available'
    else:
        raise ValueError('Unknown table action.')
    t['updatedAt'] = stamp()
    return t


def payload(state):
    result = []
    for t in state['tables']:
        bookings = sorted([r for r in state['reservations'] if r['tableId'] == t['id'] and r['date'] == today() and r['status'] in ('Pending', *ACTIVE)], key=lambda r: r['time'])
        open_orders = orders(state, t)
        status = t['status']
        if status == 'Available':
            status = 'Occupied' if open_orders else 'Reserved' if any(r['status'] == 'Confirmed' for r in bookings) else 'Available'
        result.append({**t, 'displayStatus': status, 'reservations': bookings, 'openOrders': [{**o, 'paid': paid(o)} for o in open_orders], 'runningBill': sum(o['total'] for o in open_orders if not paid(o))})
    return result


def enrich(connection, base):
    row = connection.execute("SELECT value FROM settings WHERE key='floor_state'").fetchone()
    extra = json.loads(row['value']) if row else {}
    base['waitlist'] = extra.get('waitlist', [])
    for o in base.get('orders', []):
        if str(o['id']) in extra.get('closedOrders', {}):
            o['floorClosedAt'] = extra['closedOrders'][str(o['id'])]
    for r in base['reservations']:
        r.update(extra.get('bookings', {}).get(str(r['id']), {}))
    state = {**base, **({'tables': extra['tables']} if 'tables' in extra else {})}
    ensure(state)
    base['tables'] = payload(state)
    base['floorStaff'] = [dict(id=s['id'], name=s['name'], jobRole=s['job_role']) for s in connection.execute('SELECT id,name,job_role FROM staff')]
    return state


def persist(connection, state):
    for r in state['reservations']:
        connection.execute('''INSERT INTO reservations (id,reservation_date,reservation_time,customer_id,name,phone,guests,table_name,occasion,status,special_requests,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET reservation_date=excluded.reservation_date,reservation_time=excluded.reservation_time,name=excluded.name,phone=excluded.phone,guests=excluded.guests,table_name=excluded.table_name,occasion=excluded.occasion,status=excluded.status,special_requests=excluded.special_requests''',
          (r['id'],r['date'],r['time'],r.get('customerId'),r['name'],r['phone'],r['guests'],r['table'],r['occasion'],r['status'],r.get('specialRequests',''),r['createdAt']))
    metadata = {str(r['id']): {k: r[k] for k in ('duration','tableId','history','revision','updatedAt','checkedInAt','completedAt') if k in r} for r in state['reservations']}
    # Only canonical table state is persisted, not derived bookings and bills.
    tables = [{k:v for k,v in t.items() if k not in ('displayStatus','reservations','openOrders','runningBill')} for t in state['tables']]
    previous = connection.execute("SELECT value FROM settings WHERE key='floor_state'").fetchone()
    closed = json.loads(previous['value']).get('closedOrders', {}) if previous else {}
    closed.update({str(o['id']):o['floorClosedAt'] for o in state.get('orders', []) if o.get('floorClosedAt')})
    waiting = [{k:v for k,v in e.items() if k != 'tableChoices'} for e in state.get('waitlist', [])]
    connection.execute("INSERT INTO settings(key,value) VALUES('floor_state',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(dict(tables=tables, bookings=metadata, closedOrders=closed, waitlist=waiting)),))
