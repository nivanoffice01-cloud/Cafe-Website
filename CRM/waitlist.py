"""Walk-in queue rules and persistence for the local CRM."""
import floor


def ensure(state):
    floor.ensure(state)
    state.setdefault('waitlist', [])


def problem(state, table, guests):
    if table.get('active') is False:
        return 'Table disabled'
    if guests > table['capacity']:
        return f"Only {table['capacity']} seats"
    if table['status'] != 'Available' or floor.orders(state, table):
        return 'This table is not available.'
    now = floor.datetime.now(floor.IST)
    if any(r['tableId'] == table['id'] and r['status'] in floor.ACTIVE and floor.start(r) < now + floor.timedelta(minutes=90) and floor.start(r) + floor.timedelta(minutes=r['duration']) > now for r in state['reservations']):
        return 'A confirmed booking needs this table within 90 minutes. Choose another table.'
    return ''


def payload(state):
    ensure(state)
    return [{**e, 'tableChoices': [dict(id=t['id'], label=t['label'], capacity=t['capacity'], zone=t['zone'], unavailable=problem(state, t, e['guests'])) for t in state['tables'] if t.get('active') is not False] if e['status'] in ('Waiting', 'Called') else []} for e in sorted(state['waitlist'], key=lambda e: e['arrivedAt'])]


def update(state, body, user, id=None):
    ensure(state)
    entry = next((e for e in state['waitlist'] if e['id'] == id), None)
    if id is not None and not entry:
        raise ValueError('Waiting party not found.')
    if entry and 'revision' in body and int(body['revision']) != entry['revision']:
        raise ValueError('This waiting party changed. Refresh and try again.')
    action = body.get('action') if entry else 'add'
    if action in ('add', 'edit'):
        if entry and entry['status'] not in ('Waiting', 'Called'):
            raise ValueError('Only waiting or called parties can be edited.')
        request_key = str(body.get('requestKey', ''))
        if request_key:
            import re
            if not re.fullmatch(r'[A-Za-z0-9._:-]{8,128}', request_key):
                raise ValueError('Invalid request key.')
            if not entry:
                previous = next((e for e in state['waitlist'] if e.get('requestKey') == request_key), None)
                if previous:
                    return previous
        name, phone = str(body.get('name', '')).strip()[:100], str(body.get('phone', '')).strip()[:30]
        if len(name) < 2:
            raise ValueError('Enter the guest name.')
        if phone and not 7 <= len(''.join(c for c in phone if c.isdigit())) <= 15:
            raise ValueError('Enter a valid phone number or leave it blank.')
        guests, quoted = float(body.get('guests', 0)), float(body.get('estimatedWait', 15))
        if not guests.is_integer() or not 1 <= guests <= 30:
            raise ValueError('Party size must be between 1 and 30.')
        if not quoted.is_integer() or not 0 <= quoted <= 240:
            raise ValueError('Estimated wait must be between 0 and 240 minutes.')
        fields = dict(name=name, phone=phone, guests=int(guests), estimatedWait=int(quoted), notes=str(body.get('notes', '')).strip()[:1000])
        if not entry:
            entry = dict(id=max([0] + [e['id'] for e in state['waitlist']]) + 1, requestKey=request_key, arrivedAt=floor.stamp(), date=floor.today(), status='Waiting', **fields)
            floor.record(entry, user, 'Added to waiting list')
            state['waitlist'].append(entry)
        else:
            entry.update(fields)
            floor.record(entry, user, 'Details updated')
        return entry
    if action not in {'Waiting': ('call', 'seat', 'left', 'cancel'), 'Called': ('seat', 'left', 'cancel')}.get(entry['status'], ()):
        raise ValueError(f"This party is already {entry['status'].lower()}. Refresh the list.")
    if action == 'seat':
        if entry['date'] != floor.today():
            raise ValueError('This party arrived on a previous date. Close the old entry and add them again for today.')
        table = floor.table_action(state, str(body.get('tableId', '')), dict(action='seat', name=entry['name'], guests=entry['guests']), user)
        table['session']['waitlistId'] = entry['id']
        entry.update(status='Seated', tableId=table['id'], table=table['label'], seatedAt=floor.stamp())
    elif action == 'call':
        entry.update(status='Called', calledAt=floor.stamp())
    else:
        entry.update(status='Left' if action == 'left' else 'Cancelled', closedAt=floor.stamp())
    floor.record(entry, user, {'seat': 'Seated at table', 'call': 'Called in person', 'left': 'Guest left', 'cancel': 'Entry cancelled'}[action])
    return entry
