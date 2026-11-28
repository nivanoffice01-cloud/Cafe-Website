"""Customer links and visit history for the local SQLite CRM."""
import json
import re
from collections import defaultdict
from datetime import datetime

from corrections import paise
from floor import IST

HISTORY_ROLES = ('Owner', 'Manager', 'Cashier', 'Host')
LINK_ROLES = ('Owner', 'Manager', 'Cashier')


def phone_key(value):
    digits = re.sub(r'[^0-9]', '', value or '')
    if digits.startswith('00'):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith('0'):
        digits = digits[1:]
    if len(digits) == 10:
        digits = f'91{digits}'
    return digits if re.fullmatch(r'[1-9][0-9]{9,14}', digits) else ''


def phone_matcher(customers):
    index = {}
    for customer in customers:
        key = phone_key(customer['phone'])
        if key:
            index[key] = None if key in index else customer['id']
    return lambda phone: index.get(phone_key(phone))


def explicit_customer(connection, customer_id):
    if customer_id is None:
        return None
    if type(customer_id) is not int or not connection.execute('SELECT 1 FROM customers WHERE id=?', (customer_id,)).fetchone():
        raise ValueError('Choose an existing customer.')
    return customer_id


def floor_metadata(connection):
    row = connection.execute("SELECT value FROM settings WHERE key='floor_state'").fetchone()
    return json.loads(row['value']) if row else {}


def timestamp(value):
    try:
        return datetime.fromisoformat(value).astimezone(IST)
    except (ValueError, TypeError):
        return datetime.min.replace(tzinfo=IST)


def visit_context(connection, table_name, at, table_code=None, metadata=None):
    state = metadata if metadata is not None else floor_metadata(connection)
    name = table_name.strip().lower()
    table = next((t for t in state.get('tables', []) if (table_code and str(t['id']) == table_code)
                  or name in (str(t['id']).lower(), t['label'].lower())
                  or (str(t['id']) == '4' and name == 't-04')), None)
    session = (table or {}).get('session')
    if not session or not session.get('startedAt') or timestamp(session['startedAt']) > timestamp(at):
        return {}, None
    reservation_id = session.get('reservationId')
    waitlist_id = session.get('waitlistId')
    booking = connection.execute('SELECT phone FROM reservations WHERE id=?', (reservation_id,)).fetchone() if reservation_id else None
    waiting = next((r for r in state.get('waitlist', []) if r['id'] == waitlist_id), None) if waitlist_id else None
    phone = booking['phone'] if booking else (waiting or {}).get('phone')
    return dict(visitKey=f'reservation:{reservation_id}' if booking else f"table:{table['id']}:{session['startedAt']}",
                visitAt=session['startedAt'], visitTable=table['label']), phone


def context_for(connection, order_id):
    row = connection.execute('SELECT customer_id,payload FROM order_guest_context WHERE order_id=?', (order_id,)).fetchone()
    return (row['customer_id'], json.loads(row['payload'])) if row else (None, {})


def save_context(connection, order_id, customer_id, context):
    connection.execute('''INSERT INTO order_guest_context(order_id,customer_id,payload) VALUES(?,?,?)
        ON CONFLICT(order_id) DO UPDATE SET customer_id=excluded.customer_id,payload=excluded.payload''',
                       (order_id, customer_id, json.dumps(context)))


def add_pos_context(connection, order_id, table_name, at, body):
    context, phone = visit_context(connection, table_name, at)
    customer_id = (explicit_customer(connection, body['customerId']) if 'customerId' in body
                   else phone_matcher(connection.execute('SELECT id,phone FROM customers'))(phone))
    if customer_id is not None or context:
        save_context(connection, order_id, customer_id, context)


def keep_visit_context(connection, order_id, table_name, at, state):
    customer_id, context = context_for(connection, order_id)
    if not context.get('visitKey'):
        visit, _ = visit_context(connection, table_name, at, metadata=state)
        if visit:
            save_context(connection, order_id, customer_id, dict(context, **visit))


def update_order_guest(connection, order_id, body):
    order = connection.execute('SELECT status FROM orders WHERE id=?', (order_id,)).fetchone()
    if not order:
        raise ValueError('Order not found.')
    if order['status'] == 'Cancelled':
        raise ValueError('Cancelled orders cannot be linked.')
    customer_id, context = context_for(connection, order_id)
    if 'customerId' not in body or 'expectedCustomerId' not in body or customer_id != body['expectedCustomerId']:
        raise ValueError('The order’s customer changed. Refresh and try again.')
    selected = explicit_customer(connection, body['customerId'])
    save_context(connection, order_id, selected, dict(context, reviewed=True))
    return dict(customerId=selected)


def add_guest_fields(connection, orders, customers):
    if not orders:
        return
    placeholders = ','.join('?' for _ in orders)
    links = {row['order_id']: (row['customer_id'], json.loads(row['payload'])) for row in connection.execute(
        f'SELECT order_id,customer_id,payload FROM order_guest_context WHERE order_id IN ({placeholders})',
        tuple(o['id'] for o in orders))}
    match = phone_matcher(customers)
    for order in orders:
        customer_id, context = links.get(order['id'], (None, {}))
        order['customerId'] = customer_id
        order['suggestedCustomerId'] = match(context.get('phone')) if customer_id is None and not context.get('reviewed') else None


def update_preferences(connection, customer_id, body):
    customer = connection.execute('SELECT notes FROM customers WHERE id=?', (customer_id,)).fetchone()
    if not customer:
        raise ValueError('Customer not found.')
    notes = body.get('notes')
    if not isinstance(notes, str) or len(notes.strip()) > 1500:
        raise ValueError('Enter up to 1,500 characters of guest preferences.')
    if body.get('expectedNotes') != (customer['notes'] or ''):
        raise ValueError('Guest preferences changed. Refresh before saving.')
    notes = notes.strip()
    connection.execute('UPDATE customers SET notes=? WHERE id=?', (notes, customer_id))
    return dict(notes=notes)


def history(connection, customer_id, offset, corrections):
    people = list(connection.execute('SELECT id,phone FROM customers'))
    if not any(c['id'] == customer_id for c in people):
        return None
    match = phone_matcher(people)
    bookings = floor_metadata(connection).get('bookings', {})
    visits = {}
    for booking in connection.execute("SELECT * FROM reservations WHERE status IN ('Checked in','Completed')"):
        if match(booking['phone']) == customer_id:
            key = f"reservation:{booking['id']}"
            at = bookings.get(str(booking['id']), {}).get('checkedInAt') or f"{booking['reservation_date']}T{booking['reservation_time']}:00+05:30"
            visits[key] = dict(id=key, at=at, table=booking['table_name'], counted=True, source='Reservation', orders=[], netPaise=0)
    items, payments, refunds = defaultdict(list), defaultdict(list), defaultdict(list)
    for item in connection.execute('''SELECT i.order_id,i.item_name AS name,i.quantity FROM order_items i
        JOIN order_guest_context g ON g.order_id=i.order_id WHERE g.customer_id=? ORDER BY i.id''', (customer_id,)):
        items[item['order_id']].append(dict(name=item['name'], quantity=item['quantity']))
    for payment in connection.execute('''SELECT p.order_id,p.amount,p.created_at FROM payments p
        JOIN order_guest_context g ON g.order_id=p.order_id WHERE g.customer_id=?''', (customer_id,)):
        payments[payment['order_id']].append(payment)
    for refund in corrections:
        if refund['status'] == 'Refund recorded':
            refunds[refund['orderId']].append(refund)
    favourites = {}
    spent = month_spent = 0
    month = datetime.now(IST).strftime('%Y-%m')
    for order in connection.execute('''SELECT o.*,g.payload,EXISTS(SELECT 1 FROM public_order_submissions q WHERE q.order_id=o.id) AS qr
        FROM orders o JOIN order_guest_context g ON g.order_id=o.id
        WHERE g.customer_id=? AND o.status NOT IN ('Draft','Cancelled')''', (customer_id,)):
        oid = order['id']
        paid_rows = payments[oid]
        if not paid_rows and order['status'] not in ('Served', 'Paid') and not order['paid_at']:
            continue
        demo = bool(order['qr'] and not paid_rows)
        paid = sum(paise(p['amount']) for p in paid_rows)
        refund = sum(paise(r['amount']) for r in refunds[oid])
        net = paid - refund if paid_rows else 0
        spent += net
        if paid_rows:
            month_spent += sum(paise(p['amount']) for p in paid_rows if timestamp(p['created_at']).strftime('%Y-%m') == month)
            month_spent -= sum(paise(r['amount']) for r in refunds[oid] if timestamp(r['recordedAt']).strftime('%Y-%m') == month)
        context = json.loads(order['payload'])
        key = context.get('visitKey') or f'order:{oid}'
        visit = visits.setdefault(key, dict(id=key, at=context.get('visitAt') or order['created_at'],
                                          table=context.get('visitTable') or order['table_name'], counted=False,
                                          source='Reservation' if key.startswith('reservation:') else 'Order', orders=[], netPaise=0))
        visit['counted'] = visit['counted'] or not demo
        visit['netPaise'] += net
        visit['orders'].append(dict(id=oid, at=order['created_at'], channel='QR' if order['qr'] else 'POS',
                                    items=items[oid], demo=demo, settled=bool(paid_rows),
                                    paidPaise=paid, refundPaise=refund, netPaise=net))
        if not demo:
            for item in items[oid]:
                name = item['name'].strip().lower()
                entry = favourites.setdefault(name, dict(name=item['name'], quantity=0))
                entry['quantity'] += item['quantity']
    timeline = sorted(visits.values(), key=lambda row: timestamp(row['at']), reverse=True)
    for visit in timeline:
        visit['orders'].sort(key=lambda row: (timestamp(row['at']), row['id']), reverse=True)
    counted = [row for row in timeline if row['counted']]
    return dict(visits=timeline[offset:offset+20], nextOffset=offset+20 if offset+20 < len(timeline) else None,
                visitCount=len(counted), lastVisit=counted[0]['at'] if counted else None, spentPaise=spent, monthSpentPaise=month_spent,
                favourites=sorted(favourites.values(), key=lambda item: (-item['quantity'], item['name']))[:5])
