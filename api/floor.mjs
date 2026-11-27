// Shared reservation rules for the hosted API. Existing bookings are migrated in memory.
export const statuses = ['Pending', 'Confirmed', 'Checked in', 'Completed', 'No-show', 'Cancelled']
const active = ['Confirmed', 'Checked in']
const stamp = () => new Date().toISOString()
const fail = (message) => { throw Object.assign(new Error(message), { status: 409 }) }
export const dayInIndia = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const minute = (r) => Date.parse(`${r.date}T${r.time}:00+05:30`) / 60000
const key = (s) => String(s || '').trim().toLowerCase()
export function ensureFloor(state) {
  state.tables ||= [
    ['R1', 'Railside 01', 2, 'Rooftop'], ['R2', 'Railside 02', 2, 'Rooftop'], ['R3', 'Railside 03', 2, 'Rooftop'],
    ['G1', 'Garden 01', 4, 'Rooftop'], ['G2', 'Garden 02', 4, 'Rooftop'], ['C1', 'Canopy 01', 6, 'Rooftop'],
    ['L1', 'Lounge 01', 4, 'Rooftop'], ['L2', 'Lounge 02', 4, 'Rooftop'],
    ['W1', 'Window 01', 4, 'Inside'], ['W2', 'Window 02', 4, 'Inside'], ['D1', 'Dining 01', 6, 'Inside'],
    ['D2', 'Dining 02', 4, 'Inside'], ['S1', 'Sofa 01', 4, 'Inside'], ['S2', 'Sofa 02', 2, 'Inside'], ['B1', 'Bar side', 2, 'Inside'],
    ['4', 'Table 4', 4, 'Cafe floor'],
  ].map(([id, label, capacity, zone]) => ({ id, label, capacity, zone, status: 'Available', waiterId: '', session: null }))
  for (const table of state.tables) {
    table.id = String(table.id)
    table.label ||= table.name || `Table ${table.id}`
    table.zone ||= table.zoneName || 'Cafe floor'
    table.status ||= 'Available'
    table.waiterId ||= ''
    table.session ||= null
  }
  for (const r of state.reservations) {
    let table = state.tables.find(t => t.id === r.tableId || key(t.label) === key(r.table) || key(t.id) === key(r.table))
    // Keep old free-text preferences intact; staff assign a real table before confirming.
    r.tableId = table?.id || ''
    r.duration ||= 90
    r.history ||= []
    r.revision ||= 1
  }
  return state
}
export function conflicts(state, reservation) {
  if (!reservation.tableId) return []
  return state.reservations.filter(r => r.id !== reservation.id && r.tableId === reservation.tableId && active.includes(r.status) &&
    minute(r) < minute(reservation) + reservation.duration && minute(reservation) < minute(r) + r.duration)
}
function validate(state, r, blocking = active.includes(r.status)) {
  if (String(r.name || '').trim().length < 2 || String(r.phone || '').replace(/\D/g, '').length < 7) fail('Enter a guest name and valid phone number.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time) || !Number.isFinite(minute(r)) || new Date(`${r.date}T12:00:00Z`).toISOString().slice(0, 10) !== r.date) fail('Enter a valid date and time.')
  if (!Number.isInteger(r.guests) || r.guests < 1 || r.guests > 30) fail('Guests must be between 1 and 30.')
  if (!Number.isInteger(r.duration) || r.duration < 15 || r.duration > 480) fail('Visit duration must be between 15 and 480 minutes.')
  if (!statuses.includes(r.status)) fail('Reservation status is invalid.')
  const table = state.tables.find(t => t.id === r.tableId)
  if (r.tableId && !table) fail('Choose a valid table.')
  if (table?.active === false) fail('This table has been disabled. Choose an active table.')
  if (table && r.guests > table.capacity) fail(`${table.label} seats ${table.capacity}. Choose a larger table.`)
  if (blocking) {
    if (!table) fail('Assign a table before confirming or checking in.')
    if (r.date < dayInIndia()) fail('Cannot confirm a booking in the past.')
    const overlap = conflicts(state, r)
    if (overlap.length) fail(`${table.label} overlaps with ${overlap[0].name} at ${overlap[0].time}. Choose another table or time.`)
  }
}
function record(r, user, action, note = '') {
  r.revision = (r.revision || 0) + 1
  r.updatedAt = stamp()
  r.history ||= []
  r.history.push({ at: r.updatedAt, by: user.name, action, note })
}
function assertRevision(r, body) {
  if (body.revision !== undefined && Number(body.revision) !== r.revision) fail('This booking changed. Refresh and try again.')
}
export function saveReservation(state, body, user, id = null) {
  ensureFloor(state)
  const original = id === null ? null : state.reservations.find(r => r.id === id)
  if (id !== null && !original) fail('Reservation not found.')
  if (original) {
    assertRevision(original, body)
    if (!['Pending', 'Confirmed'].includes(original.status)) fail('Only pending or confirmed bookings can be edited.')
  }
  const r = { ...(original || {}), id: id ?? Math.max(0, ...state.reservations.map(r => Number(r.id))) + 1,
    name: String(body.name || '').trim().slice(0, 100), phone: String(body.phone || '').trim().slice(0, 30),
    date: String(body.date || ''), time: String(body.time || ''), guests: Number(body.guests), duration: Number(body.duration || 90),
    tableId: String(body.tableId || ''), occasion: String(body.occasion || 'Regular visit').slice(0, 100),
    specialRequests: String(body.specialRequests ?? body.notes ?? '').slice(0, 2000),
    status: original?.status || String(body.status || 'Pending'), createdAt: original?.createdAt || stamp() }
  if (!['Pending', 'Confirmed'].includes(r.status)) fail('New reservations must be Pending or Confirmed.')
  r.table = state.tables.find(t => t.id === r.tableId)?.label || 'Best available'
  if (r.date < dayInIndia()) fail('Choose today or a future date.')
  validate(state, r)
  record(r, user, original ? 'Booking updated / rescheduled' : 'Booking created', original ? `${original.date} ${original.time} → ${r.date} ${r.time}` : '')
  if (original) Object.assign(original, r); else state.reservations.push(r)
  return r
}
export function changeReservation(state, id, body, user) {
  ensureFloor(state)
  const r = state.reservations.find(r => r.id === id)
  if (!r) fail('Reservation not found.')
  assertRevision(r, body)
  const transitions = { Pending: ['Confirmed', 'Cancelled'], Confirmed: ['Checked in', 'Cancelled', 'No-show'], 'Checked in': ['Completed'] }
  if (!transitions[r.status]?.includes(body.status)) fail(`Cannot change ${r.status} to ${body.status}.`)
  const next = { ...r, status: body.status }
  validate(state, next)
  const t = state.tables.find(t => t.id === r.tableId)
  if (body.status === 'Checked in') {
    if (r.date !== dayInIndia()) fail('Check-in is available on the reservation date.')
    if (t.status !== 'Available' || tableOrders(state, t).length) fail(`${t.label} is not free. Finish its current visit and cleaning first.`)
    t.status = 'Occupied'; t.session = { reservationId: id, name: r.name, guests: r.guests, startedAt: stamp() }
    r.checkedInAt = stamp()
  }
  if (body.status === 'No-show' && minute(r) > Date.now() / 60000) fail('Mark no-show only after the arrival time.')
  if (body.status === 'Completed') {
    if (t?.session?.reservationId !== id) fail('The table visit no longer matches this booking. Refresh the board.')
    if (tableOrders(state, t).length) fail('Settle all open table bills before checkout.')
    t.status = 'Cleaning'; t.session = null; r.completedAt = stamp()
  }
  r.status = body.status
  record(r, user, body.status, String(body.reason || '').slice(0, 500))
  return r
}
export function tableOrders(state, t) {
  return (state.orders || []).filter(o => !['Paid', 'Cancelled'].includes(o.status) &&
    (o.tableId === t.id || String(o.tableCode) === t.id || key(o.table) === key(t.label) || key(o.table) === key(t.id) ||
    (t.id === '4' && key(o.table) === 't-04')))
}
export function floorPayload(state) {
  ensureFloor(state)
  return state.tables.filter(t => t.active !== false).map(t => {
    const orders = tableOrders(state, t)
    const reservations = state.reservations.filter(r => r.tableId === t.id && r.date === dayInIndia() && ['Pending', ...active].includes(r.status)).sort((a, b) => a.time.localeCompare(b.time))
    return { id: t.id, label: t.label, capacity: t.capacity, zone: t.zone, status: t.status, waiterId: t.waiterId, session: t.session, displayStatus: t.status === 'Available' ? orders.length ? 'Occupied' : reservations.some(r => r.status === 'Confirmed') ? 'Reserved' : 'Available' : t.status,
      reservations, openOrders: orders.map(o => ({ id: o.id, total: o.total, status: o.status })), runningBill: orders.reduce((n, o) => n + Number(o.total || 0), 0) }
  })
}
export function changeTable(state, id, body, user) {
  ensureFloor(state)
  const t = state.tables.find(t => t.id === id)
  if (!t) fail('Table not found.')
  if (t.active === false) fail('This table has been disabled.')
  if (body.action === 'assign') {
    const waiterId = String(body.waiterId || '')
    if (waiterId && !(state.staff || []).some(s => String(s.id) === waiterId)) fail('Choose a staff member from the roster.')
    t.waiterId = waiterId
  } else if (body.action === 'seat') {
    if (t.status !== 'Available' || tableOrders(state, t).length) fail('This table is not available.')
    const guests = Number(body.guests)
    const name = String(body.name || '').trim()
    if (name.length < 2 || !Number.isInteger(guests) || guests < 1 || guests > t.capacity) fail(`Enter a guest name and 1–${t.capacity} guests.`)
    const upcoming = state.reservations.filter(r => r.tableId === id && active.includes(r.status) && minute(r) < Date.now() / 60000 + 90 && minute(r) + r.duration > Date.now() / 60000)
    if (upcoming.length) fail('A confirmed booking needs this table within 90 minutes. Choose another table.')
    t.status = 'Occupied'; t.session = { name, guests, startedAt: stamp() }
  } else if (body.action === 'checkout') {
    if (t.status !== 'Occupied' || !t.session) fail('No checked-in visit is assigned to this table.')
    if (tableOrders(state, t).length) fail('Settle all open table bills before checkout.')
    if (t.session.reservationId) return changeReservation(state, t.session.reservationId, { status: 'Completed' }, user)
    t.status = 'Cleaning'; t.session = null
  } else if (body.action === 'available') {
    if (t.status !== 'Cleaning') fail('Only a table being cleaned can be marked available.')
    t.status = 'Available'
  } else fail('Unknown table action.')
  t.updatedAt = stamp()
  return t
}
