export const drawerRoles = ['Owner', 'Manager', 'Cashier']
export const reopenRoles = ['Owner', 'Manager']

const businessZone = 'Asia/Kolkata'
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: businessZone, year: 'numeric', month: '2-digit', day: '2-digit',
})
const todayAt = (date) => formatter.format(date)
const entryDay = (value) => {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? todayAt(new Date(timestamp)) : ''
}
const fail = (message) => { throw Object.assign(new Error(message), { status: 409 }) }
const paise = (value) => Math.round(Number(value) * 100)

function readAmount(value, minimum = 0) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(value)) || paise(value) < minimum) {
    fail(minimum ? 'Enter a positive amount with up to two decimal places.' : 'Enter a non-negative amount with up to two decimal places.')
  }
  return paise(value)
}

function totals(state, day, drawer) {
  const cashSales = (state.payments || []).filter(p => p.method === 'Cash' && entryDay(p.createdAt) === day)
    .reduce((sum, p) => sum + paise(p.amount), 0)
  const cashRefunds = (state.corrections || []).filter(r => r.status === 'Refund recorded' && r.method === 'Cash' && entryDay(r.recordedAt) === day)
    .reduce((sum, r) => sum + paise(r.amount), 0)
  const movements = drawer?.movements || []
  const cashIn = movements.filter(m => m.direction === 'in').reduce((sum, m) => sum + m.amount, 0)
  const cashOut = movements.filter(m => m.direction === 'out').reduce((sum, m) => sum + m.amount, 0)
  const expected = drawer ? drawer.opening + cashSales - cashRefunds + cashIn - cashOut : null
  return { cashSales, cashRefunds, cashIn, cashOut, expected }
}

function snapshot(state, day) {
  const drawer = state.cashDrawers?.[day]
  const { actions, ...details } = drawer || {}
  return { day, status: drawer?.status || 'Not opened', ...details,
    totals: drawer?.closing?.totals || totals(state, day, drawer) }
}

export function drawerPayload(state, clock = new Date()) {
  const today = todayAt(clock)
  const history = Object.entries(state.cashDrawers || {}).filter(([day]) => day < today)
    .sort(([a], [b]) => b.localeCompare(a))
  const days = new Set([today, ...history.slice(0, 30).map(([day]) => day),
    ...history.filter(([, record]) => record.status === 'Open').map(([day]) => day)])
  return { today, days: [...days].sort().reverse().map(day => snapshot(state, day)) }
}

export function ensureDrawerNotClosed(state, at) {
  if (state.cashDrawers?.[entryDay(at)]?.status === 'Closed') {
    fail('The cash drawer is closed. Ask a manager to reopen it before recording a cash payment or refund.')
  }
}

export function updateDrawer(state, action, body, user, clock = new Date()) {
  const today = todayAt(clock)
  const day = body.day
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day > today) fail('Choose a valid business date.')
  const requestKey = body.requestKey
  if (typeof requestKey !== 'string' || !/^[\w-]{8,100}$/.test(requestKey)) fail('Invalid drawer request. Reopen the form and try again.')
  state.cashDrawers ||= {}
  const drawer = state.cashDrawers[day]
  if (drawer?.actions.some(entry => entry.key === requestKey && entry.by.id === user.id)) return snapshot(state, day)

  const by = { id: user.id, name: user.name }
  const event = { key: requestKey, action, by, at: clock.toISOString() }
  if (action === 'open') {
    if (day !== today || drawer) fail('Only today’s unopened drawer can be opened.')
    state.cashDrawers[day] = { status:'Open', opening:readAmount(body.amount), openedAt:event.at, openedBy:by,
      revision:1, movements:[], actions:[event], closing:null, previousClosings:[] }
    return snapshot(state, day)
  }

  if (!drawer || body.revision !== drawer.revision) fail('The drawer changed. Refresh and review the latest totals.')
  if (action === 'reopen') {
    if (!reopenRoles.includes(user.role) || drawer.status !== 'Closed') fail('A manager can reopen a closed drawer.')
    event.reason = readReason(body.reason)
    drawer.previousClosings.push({ ...drawer.closing, reopenedBy:by, reopenedAt:event.at, reason:event.reason })
    drawer.closing = null
    drawer.status = 'Open'
  } else {
    if (drawer.status !== 'Open') fail('Open the drawer before recording cash.')
    if (action === 'movement') {
      if (!['in', 'out'].includes(body.direction)) fail('Choose Cash in or Cash out.')
      drawer.movements.push({ id:requestKey, direction:body.direction, amount:readAmount(body.amount, 1),
        reason:readReason(body.reason), by, at:event.at })
    } else if (action === 'close') {
      const current = totals(state, day, drawer)
      if (body.expected !== current.expected) fail('The expected cash changed. Refresh and review the latest totals before closing.')
      const actual = readAmount(body.amount)
      drawer.closing = { totals:current, actual, variance:actual-current.expected, by, at:event.at }
      drawer.status = 'Closed'
    } else fail('Unknown cash drawer action.')
  }
  drawer.revision += 1
  drawer.actions.push(event)
  return snapshot(state, day)
}

function readReason(value) {
  if (typeof value !== 'string' || !/^.{3,160}$/s.test(value.trim())) fail('Enter a reason of 3–160 characters.')
  return value.trim()
}
