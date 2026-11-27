"""Kitchen and floor-service alerts for the SQLite demo."""
import json
from datetime import datetime
import floor


def limits(state):
    def valid(value, fallback, maximum):
        try:
            n = float(value)
            return int(n) if n.is_integer() and 1 <= n <= maximum else fallback
        except (TypeError, ValueError):
            return fallback
    settings = state.get('settings', {})
    return dict(prepMinutes=valid(settings.get('kitchen_delay_minutes'),15,120), readyMinutes=valid(settings.get('service_delay_minutes'),5,60))


def payload(state, user):
    floor.ensure(state)
    settings = limits(state)
    kitchen = user['role'] in ('Owner','Manager','Kitchen')
    clock = datetime.now(floor.IST)
    def elapsed(value):
        try:
            return max(0, int((clock - datetime.fromisoformat(value.replace('Z','+00:00'))).total_seconds() // 60))
        except (AttributeError, ValueError, TypeError):
            return 0
    result=[]
    for o in state.get('orders', []):
        if o.get('floorClosedAt') or o['status'] not in (('Kitchen','Preparing','Ready') if kitchen else ('Ready',)):
            continue
        table = next((t for t in state['tables'] if any(order['id']==o['id'] for order in floor.orders(state,t))), None)
        staff = next((s for s in state.get('floorStaff',state.get('staff',[])) if str(s['id'])==str((table or {}).get('waiterId'))), None)
        age = elapsed(o.get('sentAt') or o['createdAt'])
        ready = elapsed(o.get('readyAt') or o.get('sentAt') or o['createdAt']) if o['status']=='Ready' else 0
        result.append(dict(id=o['id'],table=o.get('tableLabel') or o['table'],status=o['status'],createdAt=o['createdAt'],sentAt=o.get('sentAt') or o['createdAt'],readyAt=o.get('readyAt'),ageMinutes=age,readyMinutes=ready,
          delayed=ready>=settings['readyMinutes'] if o['status']=='Ready' else age>=settings['prepMinutes'],assignedTo=(staff or {}).get('name',''),acceptedAt=o.get('serviceAcceptedAt'),acceptedBy=o.get('serviceAcceptedBy'),
          items=[dict(name=i['name'],quantity=i['quantity']) for i in o.get('items',[])], notes=str(o.get('notes','')),paid=floor.paid(o)))
    return dict(serverTime=clock.isoformat(),limits=settings,orders=sorted(result,key=lambda o:o['sentAt']))


def enrich(connection, base):
    row=connection.execute("SELECT value FROM settings WHERE key='service_state'").fetchone()
    meta=json.loads(row['value']) if row else {}
    for o in base.get('orders',[]):
        o.update(meta.get(str(o['id']),{}))


def persist(connection, order):
    row=connection.execute("SELECT value FROM settings WHERE key='service_state'").fetchone()
    meta=json.loads(row['value']) if row else {}
    meta[str(order['id'])]={k:order[k] for k in ('serviceAcceptedAt','serviceAcceptedBy','servedAt','servedBy') if k in order}
    connection.execute("INSERT INTO settings(key,value) VALUES('service_state',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",(json.dumps(meta),))


def act(order, action, user, body):
    if not order:
        raise ValueError('Order not found.')
    if order['status']=='Served' and action=='served':
        return
    if order['status']!='Ready':
        raise ValueError('This order is no longer ready to serve. Refresh the queue.')
    if body.get('readyAt') and body['readyAt']!=order.get('readyAt'):
        raise ValueError('This ticket changed. Refresh the queue.')
    accepted=order.get('serviceAcceptedBy')
    if accepted and accepted['id']!=user['id'] and user['role'] not in ('Owner','Manager'):
        raise ValueError(f"{accepted['name']} is already handling this order.")
    if action=='accept':
        if not accepted:
            order.update(serviceAcceptedAt=floor.stamp(),serviceAcceptedBy=dict(id=user['id'],name=user['name']))
    elif action=='served':
        order.update(status='Served',servedAt=floor.stamp(),servedBy=dict(id=user['id'],name=user['name']))
    else:
        raise ValueError('Invalid service action.')
