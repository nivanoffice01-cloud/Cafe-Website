export const historyRoles = ['Owner', 'Manager', 'Cashier', 'Host']
export const linkRoles = ['Owner', 'Manager', 'Cashier']
const paymentMethods = ['Cash', 'UPI', 'Card']
const monthFormat = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Kolkata', year:'numeric', month:'2-digit', day:'2-digit' })
const paise = value => Math.round(Number(value || 0) * 100)
const fail = (message, status = 409) => { throw Object.assign(new Error(message), { status }) }

function phoneKey(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) digits = `91${digits}`
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : ''
}

export function phoneMatcher(customers) {
  const index = new Map()
  for (const customer of customers) {
    const key = phoneKey(customer.phone)
    if (key) index.set(key, index.has(key) ? null : customer.id)
  }
  return phone => index.get(phoneKey(phone)) ?? null
}

export function visitContext(state, order, { assignGuest = false, selectedId } = {}) {
  const key = value => String(value || '').trim().toLowerCase()
  const table = state.tables.find(t => key(order.tableCode) === key(t.id) || key(order.table) === key(t.label)
    || key(order.table) === key(t.id) || (t.id === '4' && key(order.table) === 't-04'))
  const session = table?.session
  if (!session?.startedAt || Date.parse(session.startedAt) > Date.parse(order.createdAt)) {
    if (assignGuest) order.customerId = explicitCustomer(state, selectedId)
    return
  }
  const booking = session.reservationId && state.reservations.find(r => r.id === session.reservationId)
  const waiting = session.waitlistId && (state.waitlist || []).find(r => r.id === session.waitlistId)
  order.visitKey ||= booking ? `reservation:${booking.id}` : `table:${table.id}:${session.startedAt}`
  order.visitAt ||= session.startedAt
  order.visitTable ||= table.label
  if (assignGuest) {
    order.customerId = selectedId === undefined ? phoneMatcher(state.customers)(booking?.phone || waiting?.phone) : explicitCustomer(state, selectedId)
  }
}

function explicitCustomer(state, id) {
  if (id == null) return null
  if (!Number.isSafeInteger(id) || !state.customers.some(customer => customer.id === id)) fail('Choose an existing customer.')
  return id
}

export function updateOrderGuest(state, orderId, body) {
  const order = state.orders.find(row => row.id === orderId)
  if (!order) fail('Order not found.', 404)
  if (order.status === 'Cancelled') fail('Cancelled orders cannot be linked.')
  if (!Object.hasOwn(body, 'customerId') || (order.customerId ?? null) !== body.expectedCustomerId) fail('The order’s customer changed. Refresh and try again.')
  order.customerId = explicitCustomer(state, body.customerId)
  order.guestLinkReviewed = true
  return { customerId:order.customerId }
}

export function guestFields(order, matchPhone) {
  return { customerId:order.customerId ?? null,
    suggestedCustomerId:order.customerId == null && !order.guestLinkReviewed ? matchPhone(order.phone) : null }
}

export function updatePreferences(customer, body) {
  if (!customer) fail('Customer not found.', 404)
  if (typeof body.notes !== 'string' || body.notes.trim().length > 1500) fail('Enter up to 1,500 characters of guest preferences.')
  if (typeof body.expectedNotes !== 'string' || body.expectedNotes !== (customer.notes || '')) fail('Guest preferences changed. Refresh before saving.')
  customer.notes = body.notes.trim()
  return { notes:customer.notes }
}

export function customerHistory(state, customerId, offset, clock = new Date()) {
  if (!state.customers.some(c => c.id === customerId)) fail('Customer not found.', 404)
  if (!Number.isSafeInteger(offset) || offset < 0) fail('Invalid visit history page.')
  const orderList = state.orders.filter(o => o.customerId === customerId && !['Draft','Cancelled'].includes(o.status))
  const orderIds = new Set(orderList.map(o => o.id))
  const payments = rowsByOrder((state.payments || []).filter(p => orderIds.has(Number(p.orderId)) && paymentMethods.includes(p.method)))
  const refunds = rowsByOrder((state.corrections || []).filter(r => orderIds.has(r.orderId) && r.status === 'Refund recorded'))
  const match = phoneMatcher(state.customers)
  const visits = new Map()
  for (const booking of state.reservations) {
    if (!['Checked in','Completed'].includes(booking.status) || match(booking.phone) !== customerId) continue
    const id = `reservation:${booking.id}`
    visits.set(id, { id, at:booking.checkedInAt || `${booking.date}T${booking.time}:00+05:30`, table:booking.table,
      counted:true, source:'Reservation', orders:[], netPaise:0 })
  }
  const favourites = new Map()
  let spent = 0, monthSpent = 0
  const month = monthFormat.format(clock).slice(0, 7)
  const thisMonth = stamp => stamp && Number.isFinite(Date.parse(stamp)) && monthFormat.format(new Date(stamp)).startsWith(month)
  for (const order of orderList) {
    const paidRows = payments.get(order.id) || []
    if (!paidRows.length && !['Served','Paid'].includes(order.status) && !order.servedAt && !order.paidAt) continue
    const qr = Boolean(order.tableCode || order.paymentDemo || /^QR /i.test(order.table))
    const demo = qr && !paidRows.length && (order.paymentDemo === true || /^Demo\b/i.test(order.paymentMethod || ''))
    const refundedRows = refunds.get(order.id) || []
    const paid = paidRows.reduce((sum, p) => sum + paise(p.amount), 0)
    const refund = refundedRows.reduce((sum, r) => sum + paise(r.amount), 0)
    const net = paidRows.length ? paid - refund : 0
    spent += net
    if (paidRows.length) monthSpent += paidRows.filter(p => thisMonth(p.createdAt)).reduce((sum, p) => sum + paise(p.amount), 0)
      - refundedRows.filter(r => thisMonth(r.recordedAt)).reduce((sum, r) => sum + paise(r.amount), 0)
    const id = order.visitKey || `order:${order.id}`
    const visit = visits.get(id) || { id, at:order.visitAt || order.createdAt, table:order.visitTable || order.tableLabel || order.table,
      counted:false, source:id.startsWith('reservation:') ? 'Reservation' : 'Order', orders:[], netPaise:0 }
    visit.counted ||= !demo
    visit.netPaise += net
    const items = (order.items || []).map(({ name, quantity }) => ({ name, quantity }))
    visit.orders.push({ id:order.id, at:order.createdAt, channel:qr ? 'QR' : 'POS',
      items, demo, settled:paidRows.length > 0, paidPaise:paid, refundPaise:refund, netPaise:net })
    visits.set(id, visit)
    if (!demo) for (const item of items) {
      const key = item.name.trim().toLowerCase()
      const entry = favourites.get(key) || { name:item.name, quantity:0 }
      entry.quantity += item.quantity
      favourites.set(key, entry)
    }
  }
  const timeline = [...visits.values()].sort((a,b) => Date.parse(b.at) - Date.parse(a.at))
  for (const visit of timeline) visit.orders.sort((a,b) => Date.parse(b.at) - Date.parse(a.at) || b.id - a.id)
  const counted = timeline.filter(visit => visit.counted)
  return { visits:timeline.slice(offset, offset+20), nextOffset:offset+20 < timeline.length ? offset+20 : null,
    visitCount:counted.length, lastVisit:counted[0]?.at ?? null, spentPaise:spent, monthSpentPaise:monthSpent,
    favourites:[...favourites.values()].sort((a,b) => b.quantity-a.quantity || a.name.localeCompare(b.name)).slice(0, 5) }
}

function rowsByOrder(rows) {
  const groups = new Map()
  for (const row of rows) {
    const id = Number(row.orderId)
    if (!groups.has(id)) groups.set(id, [])
    groups.get(id).push(row)
  }
  return groups
}
