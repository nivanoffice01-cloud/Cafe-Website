import { ensureFloor, changeTable, walkInProblem, dayInIndia } from './floor.mjs'
const now = () => new Date().toISOString()
const fail = message => { throw Object.assign(new Error(message), { status: 409 }) }
export const waitingStatuses = ['Waiting', 'Called', 'Seated', 'Left', 'Cancelled']
export function ensureWaitlist(state) { ensureFloor(state); state.waitlist ||= []; return state }
export function waitlistPayload(state) {
  ensureWaitlist(state)
  return state.waitlist.slice().sort((a,b) => a.arrivedAt.localeCompare(b.arrivedAt)).map(entry => ({ ...entry,
    tableChoices: ['Waiting', 'Called'].includes(entry.status) ? state.tables.filter(t => t.active !== false).map(t => ({ id: t.id, label: t.label, capacity: t.capacity, zone: t.zone, unavailable: walkInProblem(state, t, entry.guests) })) : [],
  }))
}
function record(entry, user, action) {
  entry.revision = (entry.revision || 0) + 1
  entry.updatedAt = now()
  entry.history ||= []
  entry.history.push({ action, at: entry.updatedAt, by: user.name })
}
export function updateWaitlist(state, body, user, id = null) {
  ensureWaitlist(state)
  let entry = id === null ? null : state.waitlist.find(e => e.id === id)
  if (id !== null && !entry) fail('Waiting party not found.')
  if (entry && body.revision !== undefined && Number(body.revision) !== entry.revision) fail('This waiting party changed. Refresh and try again.')
  const action = entry ? body.action : 'add'
  if (action === 'add' || action === 'edit') {
    if (entry && !['Waiting', 'Called'].includes(entry.status)) fail('Only waiting or called parties can be edited.')
    const requestKey = String(body.requestKey || '')
    if (requestKey && !/^[A-Za-z0-9._:-]{8,128}$/.test(requestKey)) fail('Invalid request key.')
    if (!entry && requestKey) { const previous = state.waitlist.find(e => e.requestKey === requestKey); if (previous) return previous }
    const name = String(body.name || '').trim().slice(0, 100), phone = String(body.phone || '').trim().slice(0, 30)
    const guests = Number(body.guests), estimatedWait = Number(body.estimatedWait ?? 15)
    if (name.length < 2) fail('Enter the guest name.')
    if (phone && (phone.replace(/\D/g,'').length < 7 || phone.replace(/\D/g,'').length > 15)) fail('Enter a valid phone number or leave it blank.')
    if (!Number.isInteger(guests) || guests < 1 || guests > 30) fail('Party size must be between 1 and 30.')
    if (!Number.isInteger(estimatedWait) || estimatedWait < 0 || estimatedWait > 240) fail('Estimated wait must be between 0 and 240 minutes.')
    const fields = { name, phone, guests, estimatedWait, notes: String(body.notes || '').trim().slice(0, 1000) }
    if (!entry) {
      entry = { id: Math.max(0, ...state.waitlist.map(e => Number(e.id))) + 1, requestKey, arrivedAt: now(), date: dayInIndia(), status: 'Waiting', ...fields }
      record(entry, user, 'Added to waiting list'); state.waitlist.push(entry)
    } else { Object.assign(entry, fields); record(entry, user, 'Details updated') }
    return entry
  }
  const transitions = { Waiting: ['call','seat','left','cancel'], Called: ['seat','left','cancel'] }
  if (!transitions[entry.status]?.includes(action)) fail(`This party is already ${entry.status.toLowerCase()}. Refresh the list.`)
  if (action === 'seat') {
    if (entry.date !== dayInIndia()) fail('This party arrived on a previous date. Close the old entry and add them again for today.')
    const tableId = String(body.tableId || '')
    const table = changeTable(state, tableId, { action: 'seat', name: entry.name, guests: entry.guests }, user)
    table.session.waitlistId = entry.id
    entry.status = 'Seated'; entry.tableId = table.id; entry.table = table.label; entry.seatedAt = now()
  } else if (action === 'call') { entry.status = 'Called'; entry.calledAt = now() }
  else { entry.status = action === 'left' ? 'Left' : 'Cancelled'; entry.closedAt = now() }
  record(entry, user, { seat: 'Seated at table', call: 'Called in person', left: 'Guest left', cancel: 'Entry cancelled' }[action])
  return entry
}
