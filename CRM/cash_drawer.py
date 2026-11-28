"""Day-by-day reconciliation for the local SQLite cash drawer."""
import json
import re
from datetime import datetime

from corrections import paise
from floor import IST

ROLES = ('Owner', 'Manager', 'Cashier')
REOPEN_ROLES = ('Owner', 'Manager')


def today(clock=None):
    return (clock or datetime.now(IST)).astimezone(IST).date().isoformat()


def drawer_for(connection, day):
    row = connection.execute('SELECT payload FROM cash_drawers WHERE day=?', (day,)).fetchone()
    return json.loads(row['payload']) if row else None


def ensure_not_closed(connection, timestamp):
    day = today(datetime.fromisoformat(timestamp))
    drawer = drawer_for(connection, day)
    if drawer and drawer['status'] == 'Closed':
        raise ValueError('The cash drawer is closed. Ask a manager to reopen it before recording a cash payment or refund.')


def totals(connection, day, drawer, corrections):
    cash_sales = sum(paise(p['amount']) for p in connection.execute(
        "SELECT amount FROM payments WHERE method='Cash' AND date(created_at,'+05:30')=?", (day,)))
    cash_refunds = sum(paise(r['amount']) for r in corrections if r['status'] == 'Refund recorded' and r['method'] == 'Cash'
                       and today(datetime.fromisoformat(r['recordedAt'])) == day)
    movements = drawer['movements'] if drawer else []
    cash_in = sum(m['amount'] for m in movements if m['direction'] == 'in')
    cash_out = sum(m['amount'] for m in movements if m['direction'] == 'out')
    expected = drawer['opening'] + cash_sales - cash_refunds + cash_in - cash_out if drawer else None
    return dict(cashSales=cash_sales, cashRefunds=cash_refunds, cashIn=cash_in, cashOut=cash_out, expected=expected)


def snapshot(connection, day, drawer, corrections):
    details = {k: v for k, v in (drawer or {}).items() if k != 'actions'}
    closing = details.get('closing')
    return {'day': day, 'status': 'Not opened', **details,
            'totals': closing['totals'] if closing else totals(connection, day, drawer, corrections)}


def payload(connection, corrections):
    day = today()
    recent = [(row['day'], json.loads(row['payload'])) for row in connection.execute(
        'SELECT day,payload FROM cash_drawers WHERE day<? ORDER BY day DESC', (day,))]
    days = [(day, drawer_for(connection, day)), *recent[:30],
            *(entry for entry in recent[30:] if entry[1]['status'] == 'Open')]
    return dict(today=day, days=[snapshot(connection, key, drawer, corrections) for key, drawer in days])


def read_amount(value, minimum=0):
    if not re.fullmatch(r'[0-9]{1,8}(\.[0-9]{1,2})?', str(value)) or paise(value) < minimum:
        qualifier = 'positive' if minimum else 'non-negative'
        raise ValueError(f'Enter a {qualifier} amount with up to two decimal places.')
    return paise(value)


def read_reason(value):
    if not isinstance(value, str) or not 3 <= len(value.strip()) <= 160:
        raise ValueError('Enter a reason of 3–160 characters.')
    return value.strip()


def update(connection, action, body, user, corrections):
    clock = datetime.now(IST)
    day = body.get('day')
    if not isinstance(day, str) or not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}', day) or day > today(clock):
        raise ValueError('Choose a valid business date.')
    key = body.get('requestKey')
    if not isinstance(key, str) or not re.fullmatch(r'[A-Za-z0-9_-]{8,100}', key):
        raise ValueError('Invalid drawer request. Reopen the form and try again.')
    drawer = drawer_for(connection, day)
    if drawer and any(e['key'] == key and e['by']['id'] == user['id'] for e in drawer['actions']):
        return snapshot(connection, day, drawer, corrections)
    by = {field: user[field] for field in ('id', 'name')}
    event = dict(key=key, action=action, by=by, at=clock.isoformat())
    if action == 'open':
        if day != today(clock) or drawer:
            raise ValueError('Only today’s unopened drawer can be opened.')
        drawer = dict(status='Open', opening=read_amount(body.get('amount')), openedAt=event['at'], openedBy=by,
                      revision=0, movements=[], actions=[], closing=None, previousClosings=[])
    else:
        if not drawer or body.get('revision') != drawer['revision']:
            raise ValueError('The drawer changed. Refresh and review the latest totals.')
        if action == 'reopen':
            if user['role'] not in REOPEN_ROLES or drawer['status'] != 'Closed':
                raise ValueError('A manager can reopen a closed drawer.')
            event['reason'] = read_reason(body.get('reason'))
            drawer['previousClosings'].append(dict(drawer['closing'], reopenedBy=by, reopenedAt=event['at'], reason=event['reason']))
            drawer.update(status='Open', closing=None)
        elif drawer['status'] != 'Open':
            raise ValueError('Open the drawer before recording cash.')
        elif action == 'movement':
            direction = body.get('direction')
            if direction not in ('in', 'out'):
                raise ValueError('Choose Cash in or Cash out.')
            drawer['movements'].append(dict(id=key, direction=direction, amount=read_amount(body.get('amount'), 1),
                                            reason=read_reason(body.get('reason')), by=by, at=event['at']))
        elif action == 'close':
            current = totals(connection, day, drawer, corrections)
            if body.get('expected') != current['expected']:
                raise ValueError('The expected cash changed. Refresh and review the latest totals before closing.')
            actual = read_amount(body.get('amount'))
            drawer.update(status='Closed', closing=dict(totals=current, actual=actual,
                          variance=actual-current['expected'], by=by, at=event['at']))
        else:
            raise ValueError('Unknown cash drawer action.')
    drawer['revision'] += 1
    drawer['actions'].append(event)
    connection.execute('INSERT INTO cash_drawers(day,payload) VALUES(?,?) ON CONFLICT(day) DO UPDATE SET payload=excluded.payload',
                       (day, json.dumps(drawer)))
    return snapshot(connection, day, drawer, corrections)
