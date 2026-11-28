"""Order correction workflow for the local SQLite CRM."""
import json
import re
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

import floor

ROLES = ('Owner', 'Manager', 'Cashier')
RECORDED = ('Refund recorded', 'Demo refund recorded')


def paise(value):
    return int((Decimal(str(value)) * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))


def qr_charge(subtotal):
    return (subtotal + 1000) // 2000 * 100


def actor(user):
    return {key: user[key] for key in ('id', 'name')}


def records(connection):
    return [json.loads(row['payload']) for row in connection.execute(
        'SELECT payload FROM order_corrections ORDER BY created_at DESC, id DESC')]


def active(entries, order_id):
    return any(r['orderId'] == order_id and (r['status'] == 'Pending' or
               r['type'] == 'refund' and r['status'] == 'Approved') for r in entries)


def enrich(order_list, entries):
    for order in order_list:
        applied = [r for r in entries if r['orderId'] == order['id'] and r['status'] == 'Approved']
        order['cancelledItems'] = [dict(name=r['itemName'], quantity=r['quantity']) for r in applied if r['type'] == 'cancel']
        order['correctionPending'] = any(r['orderId'] == order['id'] and r['status'] == 'Pending' and r['type'] != 'refund' for r in entries)
        subtotal = paise(order['subtotal'])
        charge = qr_charge(subtotal) if order['table'].startswith('QR ') else 0
        order['discountAmount'] = min(sum(paise(r['amount']) for r in applied if r['type'] == 'discount'), subtotal + charge) / 100


def kitchen_changes(entries, role):
    if role not in ('Owner','Manager','Kitchen'):
        return []
    return [{key:r[key] for key in ('id','orderId','table','itemName','quantity','reviewedAt')}
            for r in entries if r['status']=='Approved' and r['type']=='cancel' and r.get('sentToKitchen')
            and (floor.datetime.now(floor.IST) - floor.datetime.fromisoformat(r['reviewedAt'])).total_seconds() <= 900][:8]


def refund_details(connection, order, entries, excluding=None):
    payments = list(connection.execute('SELECT method, amount FROM payments WHERE order_id=? AND amount>0 ORDER BY id', (order['id'],)))
    method = payments[0]['method'] if payments else order['payment_method']
    demo = (order['payment_method'] or '').lower().startswith('demo ')
    original = sum(paise(p['amount']) for p in payments) or paise(order['total'])
    used = sum(paise(r['amount']) for r in entries if r['id'] != excluding and r['orderId'] == order['id']
               and r['type'] == 'refund' and r['status'] in ('Approved', *RECORDED))
    return method, demo, max(0, original - used)


def validate(connection, order, entries, record):
    if not order or order['status'] == 'Cancelled':
        raise ValueError('This order is no longer eligible for a correction.')
    paid = order['paid_at'] or order['status'] == 'Paid' or floor.demo_prepaid(order['payment_method'])
    if record['type'] == 'refund':
        if not paid:
            raise ValueError('Only paid orders can be refunded.')
        method, demo, remaining = refund_details(connection, order, entries, record['id'])
        if not method or paise(record['amount']) > remaining:
            raise ValueError('Refund exceeds the remaining recorded payment or payment method is missing.')
        return method, demo
    if paid:
        raise ValueError('This order is paid. Request a refund instead.')
    if record['type'] == 'cancel':
        if order['status'] not in ('Draft', 'Kitchen', 'Preparing', 'Ready'):
            raise ValueError('Items can only be cancelled before the order is served.')
        item = connection.execute('SELECT * FROM order_items WHERE order_id=? AND id=?', (order['id'], record['itemId'])).fetchone()
        if not item or item['quantity'] < record['quantity']:
            raise ValueError('The item quantity changed. Submit a fresh request.')
        return item
    if paise(record['amount']) > paise(order['total']):
        raise ValueError('Discount exceeds the current bill.')


def new_request(connection, entries, body, user):
    key = str(body.get('requestKey', ''))
    if key and not re.fullmatch(r'[A-Za-z0-9_-]{8,100}', key):
        raise ValueError('Invalid request key.')
    previous = next((r for r in entries if key and r['requestKey'] == key and r['requestedBy']['id'] == user['id']), None)
    if previous:
        return previous
    order_id = int(body.get('orderId', 0))
    order = connection.execute('SELECT * FROM orders WHERE id=?', (order_id,)).fetchone()
    if not order:
        raise ValueError('Order not found.')
    if active(entries, order_id):
        raise ValueError('Finish the current correction before starting another one on this order.')
    kind, reason = body.get('type'), str(body.get('reason', '')).strip()
    if kind not in ('cancel', 'discount', 'refund') or not 3 <= len(reason) <= 300:
        raise ValueError('Choose a correction type and enter a reason of 3–300 characters.')
    record = dict(id=str(uuid4()), requestKey=key, orderId=order_id, table=order['table_name'], type=kind,
                  reason=reason, status='Pending', requestedAt=floor.stamp(), requestedBy=actor(user), originalTotal=order['total'])
    if kind == 'cancel':
        quantity = str(body.get('quantity', ''))
        if not re.fullmatch(r'[1-9][0-9]{0,8}', quantity):
            raise ValueError('Enter a whole item quantity of at least one.')
        record.update(itemId=str(body.get('itemId', '')), quantity=int(quantity))
    else:
        amount = str(body.get('amount', ''))
        if not re.fullmatch(r'[0-9]{1,8}(\.[0-9]{1,2})?', amount) or paise(amount) <= 0:
            raise ValueError('Enter a positive amount with at most two decimal places.')
        record['amount'] = paise(amount) / 100
    details = validate(connection, order, entries, record)
    if kind == 'cancel':
        record['itemName'] = details['item_name']
    if kind == 'refund':
        record['method'], record['demo'] = details
    return record


def update(connection, entries, record, action, body, user):
    order = connection.execute('SELECT * FROM orders WHERE id=?', (record['orderId'],)).fetchone()
    if action == 'record':
        if record['status'] in RECORDED:
            return record
        if record['type'] != 'refund' or record['status'] != 'Approved':
            raise ValueError('A manager must approve the refund before it can be recorded.')
        method, demo = validate(connection, order, entries, record)
        if (method, demo) != (record['method'], record['demo']):
            raise ValueError('The payment details changed. Review the refund with a manager.')
        reference = str(body.get('reference', '')).strip()
        if not demo and method != 'Cash':
            if not 3 <= len(reference) <= 100:
                raise ValueError('Enter the completed refund reference.')
            if any(r['status'] == 'Refund recorded' and r['method'] == method and r.get('reference', '').lower() == reference.lower() for r in entries):
                raise ValueError('This refund reference has already been recorded.')
        if body.get('confirmed') is not True:
            raise ValueError('Confirm the refund has been handled.')
        record.update(status='Demo refund recorded' if demo else 'Refund recorded', reference=reference[:100],
                      recordedAt=floor.stamp(), recordedBy=actor(user))
        return record
    if record['status'] != 'Pending':
        raise ValueError('This request has already been reviewed.')
    note = str(body.get('note', '')).strip()[:300]
    if action == 'reject':
        if len(note) < 3:
            raise ValueError('Enter a reason for rejecting the request.')
    else:
        if record['requestedBy']['id'] == user['id']:
            raise ValueError('Ask another manager or owner to approve your request.')
        item = validate(connection, order, entries, record)
        total = paise(order['total'])
        if total != paise(record['originalTotal']):
            raise ValueError('The bill changed. Reject this request and submit a fresh one.')
        if record['type'] == 'refund':
            record['method'], record['demo'] = item
        elif record['type'] == 'discount':
            total -= paise(record['amount'])
            connection.execute('UPDATE orders SET total=? WHERE id=?', (total / 100, order['id']))
        else:
            record['sentToKitchen'] = bool(order['sent_at'])
            remaining = item['quantity'] - record['quantity']
            if remaining:
                connection.execute('UPDATE order_items SET quantity=? WHERE id=?', (remaining, item['id']))
            else:
                connection.execute('DELETE FROM order_items WHERE id=?', (item['id'],))
            subtotal = sum(paise(i['unit_price']) * i['quantity'] for i in connection.execute(
                'SELECT unit_price, quantity FROM order_items WHERE order_id=?', (order['id'],)))
            qr = connection.execute('SELECT 1 FROM public_order_submissions WHERE order_id=?', (order['id'],)).fetchone()
            charge = qr_charge(subtotal) if qr else 0
            discount = sum(paise(r['amount']) for r in entries if r['orderId'] == order['id'] and r['type'] == 'discount' and r['status'] == 'Approved')
            total = max(0, subtotal + charge - discount)
            row_count = connection.execute('SELECT COUNT(*) FROM order_items WHERE order_id=?', (order['id'],)).fetchone()[0]
            connection.execute('UPDATE orders SET subtotal=?,total=?,status=? WHERE id=?',
                               (subtotal / 100, total / 100, order['status'] if row_count else 'Cancelled', order['id']))
        record['updatedTotal'] = total / 100
    record.update(status='Rejected' if action=='reject' else 'Approved', reviewNote=note, reviewedAt=floor.stamp(), reviewedBy=actor(user))
    return record


def mutate(connection, body, user, correction_id=None, action=None):
    entries = records(connection)
    if correction_id:
        record = next((r for r in entries if r['id'] == correction_id), None)
        if not record:
            raise ValueError('Correction request not found.')
        record = update(connection, entries, record, action, body, user)
    else:
        record = new_request(connection, entries, body, user)
    connection.execute('INSERT INTO order_corrections(id,created_at,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
                       (record['id'], record['requestedAt'], json.dumps(record)))
    return record
