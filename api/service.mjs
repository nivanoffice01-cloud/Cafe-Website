import { ensureFloor, tableOrders, orderIsPaid } from './floor.mjs'
const fail = message => { throw Object.assign(new Error(message), { status: 409 }) }
const stamp = () => new Date().toISOString()
export function serviceSettings(state) {
  const limit = (value, fallback, max) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= max ? Number(value) : fallback
  return { prepMinutes: limit(state.settings?.kitchen_delay_minutes, 15, 120), readyMinutes: limit(state.settings?.service_delay_minutes, 5, 60) }
}
export function servicePayload(state, user, clock = Date.now()) {
  ensureFloor(state)
  const limits = serviceSettings(state)
  const kitchen = ['Owner', 'Manager', 'Kitchen'].includes(user.role)
  const orders = (state.orders || []).filter(o => !o.floorClosedAt && (kitchen ? ['Kitchen','Preparing','Ready'] : ['Ready']).includes(o.status)).map(o => {
    const table = state.tables.find(t => tableOrders(state, t).some(order => order.id === o.id))
    const staff = (state.staff || []).find(s => String(s.id) === String(table?.waiterId))
    const elapsed = value => Number.isFinite(Date.parse(value)) ? Math.max(0, Math.floor((clock - Date.parse(value)) / 60000)) : 0
    const ageMinutes = elapsed(o.sentAt || o.createdAt)
    const readyMinutes = o.status === 'Ready' ? elapsed(o.readyAt || o.sentAt || o.createdAt) : 0
    return { id:o.id, table:o.tableLabel || o.table, status:o.status, createdAt:o.createdAt, sentAt:o.sentAt || o.createdAt,
      readyAt:o.readyAt || null, ageMinutes, readyMinutes,
      delayed:o.status === 'Ready' ? readyMinutes >= limits.readyMinutes : ageMinutes >= limits.prepMinutes,
      assignedTo:staff?.name || '', acceptedAt:o.serviceAcceptedAt || null, acceptedBy:o.serviceAcceptedBy || null,
      items:(o.items || []).map(i => ({ name:i.name, quantity:i.quantity })), notes:String(o.notes || ''), paid:orderIsPaid(o) }
  }).sort((a,b) => Date.parse(a.sentAt) - Date.parse(b.sentAt))
  return { serverTime:new Date(clock).toISOString(), limits, orders }
}
export function serviceAction(state, id, action, user, body = {}) {
  const order = state.orders.find(o => o.id === id)
  if (!order) fail('Order not found.')
  if (order.status === 'Served' && action === 'served') return order
  if (order.status !== 'Ready') fail('This order is no longer ready to serve. Refresh the queue.')
  if (body.readyAt && body.readyAt !== order.readyAt) fail('This ticket changed. Refresh the queue.')
  const accepted = order.serviceAcceptedBy
  if (accepted && accepted.id !== user.id && !['Owner','Manager'].includes(user.role)) fail(`${accepted.name} is already handling this order.`)
  if (action === 'accept') {
    if (!accepted) { order.serviceAcceptedAt = stamp(); order.serviceAcceptedBy = { id:user.id, name:user.name } }
  } else if (action === 'served') {
    order.status = 'Served'; order.servedAt = stamp(); order.servedBy = { id:user.id, name:user.name }
  } else fail('Invalid service action.')
  return order
}
export function kitchenTransition(order, status) {
  if (!order) fail('Order not found.')
  if (order.status === status && ['Preparing','Ready'].includes(status)) return order
  if (!({ Kitchen:['Preparing'], Preparing:['Ready'] }[order.status] || []).includes(status)) fail(`Cannot move ${order.status} to ${status}. Refresh the queue.`)
  order.status = status
  if (status === 'Ready') order.readyAt = stamp()
  return order
}
export function updateServiceSettings(state, body) {
  const prep = Number(body.prepMinutes), ready = Number(body.readyMinutes)
  if (!Number.isInteger(prep) || prep < 1 || prep > 120 || !Number.isInteger(ready) || ready < 1 || ready > 60) fail('Preparation must be 1–120 minutes and service must be 1–60 minutes.')
  state.settings ||= {}
  state.settings.kitchen_delay_minutes = prep; state.settings.service_delay_minutes = ready
  return serviceSettings(state)
}
