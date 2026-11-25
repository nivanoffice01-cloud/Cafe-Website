import { get, put } from '@vercel/blob'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { fullMenu } from './full-menu.mjs'
import { orderTables, publicTable } from './table-config.mjs'

const STORE_KEY = 'production-state-v1.json'
const STORE_PREFIX = 'mangosteen-crm'
const SESSION_COOKIE = 'mangosteen_session'
const SESSION_TTL = 12 * 60 * 60 * 1000
const ROLE_LEVEL = { Kitchen: 0, 'Floor Staff': 1, Cashier: 1, Host: 1, Manager: 2, Owner: 3 }
const DEMO_ACCOUNTS = [
  ['Rahul Mehta', 'owner@mangosteen.local', 'Owner'],
  ['Cafe Manager', 'manager@mangosteen.local', 'Manager'],
  ['Front Desk', 'cashier@mangosteen.local', 'Cashier'],
  ['Kitchen Team', 'kitchen@mangosteen.local', 'Kitchen'],
  ['Floor Team', 'floor@mangosteen.local', 'Floor Staff'],
  ['Guest Relations', 'host@mangosteen.local', 'Host'],
]
const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJB_gCKYDjYjkRZrVPCUTqeLw'
const catalogItems = () => fullMenu.flatMap((category) => category.items.map((item, index) => ({
  id: `${category.name}:${index + 1}`, category: category.name, name: item.name, description: item.description || '', price: item.price, active: true,
})))
const managedTables = () => orderTables.map((table) => ({ ...table, active: true }))

const blobPath = (key) => `${STORE_PREFIX}/${String(key).replaceAll(':', '/')}`
const store = () => ({
  async get(key, options = {}) {
    const result = await get(blobPath(key), { access: 'private', useCache: false })
    if (!result?.stream) return null
    const value = await new Response(result.stream).text()
    if (options.type === 'json') return JSON.parse(value)
    return value
  },
  async set(key, value) {
    await put(blobPath(key), value, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: 'application/json; charset=utf-8',
    })
  },
  async setJSON(key, value) {
    await this.set(key, JSON.stringify(value))
  },
})
const now = () => new Date().toISOString()
const indiaDate = (value = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(value)
const addDays = (date, days) => {
  const result = new Date(`${date}T12:00:00+05:30`)
  result.setDate(result.getDate() + days)
  return indiaDate(result)
}
const nextId = (items) => Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1
const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`
}

function passwordMatches(password, encoded) {
  const [salt, expected] = String(encoded || '').split(':')
  if (!salt || !expected) return false
  const actual = scryptSync(password, salt, 32)
  const expectedBuffer = Buffer.from(expected, 'hex')
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer)
}

function createSeedState() {
  const today = indiaDate()
  const month = today.slice(0, 7)
  const createdAt = now()
  const password = passwordHash('Mangosteen@123')
  const users = DEMO_ACCOUNTS.map(([name, email, role], index) => ({ id: index + 1, name, email, role, passwordHash: password, active: true, createdAt, lastLoginAt: null }))
  const menuItems = [
    ['Cold Coffee', 'Beverages', 180], ['Cappuccino', 'Beverages', 160],
    ['Masala Chai', 'Beverages', 80], ['Maggi', 'Quick Bites', 140],
    ['Paneer Sandwich', 'Quick Bites', 180], ['Cheese Toast', 'Quick Bites', 150],
    ['Peri Peri Fries', 'Sides', 100], ['Chocolate Brownie', 'Desserts', 140],
  ].map(([name, category, price], index) => ({ id: index + 1, name, category, price, active: true }))
  const inventory = [
    ['Doodh', 'L', 12, 4], ['Coffee beans', 'kg', 2.4, 0.75], ['Bread', 'pcs', 40, 12],
    ['Paneer', 'kg', 3, 0.8], ['Cheese slices', 'pcs', 60, 15], ['Potato', 'kg', 8, 2],
    ['Maggi packs', 'pcs', 24, 8], ['Tea leaves', 'kg', 1.5, 0.4],
    ['Sugar', 'kg', 6, 1.5], ['Chocolate syrup', 'L', 2, 0.5],
  ].map(([name, unit, quantity, reorderLevel], index) => ({ id: index + 1, name, unit, quantity, reorderLevel, low: quantity <= reorderLevel }))
  const byMenu = Object.fromEntries(menuItems.map((item) => [item.name, item.id]))
  const byStock = Object.fromEntries(inventory.map((item) => [item.name, item.id]))
  const recipeMap = {
    'Cold Coffee': [['Doodh', 0.25], ['Coffee beans', 0.025], ['Sugar', 0.02]],
    Cappuccino: [['Doodh', 0.2], ['Coffee beans', 0.02], ['Sugar', 0.01]],
    'Masala Chai': [['Doodh', 0.15], ['Tea leaves', 0.012], ['Sugar', 0.015]],
    Maggi: [['Maggi packs', 1]],
    'Paneer Sandwich': [['Bread', 2], ['Paneer', 0.12], ['Cheese slices', 1]],
    'Cheese Toast': [['Bread', 2], ['Cheese slices', 2]],
    'Peri Peri Fries': [['Potato', 0.25]],
    'Chocolate Brownie': [['Chocolate syrup', 0.03]],
  }
  const recipes = Object.entries(recipeMap).flatMap(([menu, ingredients]) => ingredients.map(([stock, quantity]) => ({ menuItemId: byMenu[menu], inventoryItemId: byStock[stock], quantity })))
  const orderSpecs = [
    ['T-02', 'Kitchen', [['Cappuccino', 2], ['Cheese Toast', 1]], null, '10:12'],
    ['T-09', 'Preparing', [['Maggi', 2], ['Masala Chai', 2]], null, '10:18'],
    ['T-06', 'Ready', [['Cold Coffee', 2], ['Paneer Sandwich', 1], ['Peri Peri Fries', 1]], null, '10:22'],
    ['T-04', 'Paid', [['Cold Coffee', 2], ['Chocolate Brownie', 2]], 'UPI', '09:42'],
    ['T-11', 'Paid', [['Cappuccino', 2], ['Paneer Sandwich', 2]], 'Cash', '11:04'],
    ['Takeaway', 'Paid', [['Masala Chai', 4], ['Maggi', 2]], 'Card', '12:14'],
  ]
  const orders = []
  const payments = []
  orderSpecs.forEach(([table, status, requestedItems, paymentMethod, time], index) => {
    const timestamp = `${today}T${time}:00+05:30`
    const items = requestedItems.map(([name, quantity], itemIndex) => {
      const menu = menuItems.find((entry) => entry.name === name)
      return { id: index * 10 + itemIndex + 1, menuItemId: menu.id, name, quantity, unitPrice: menu.price, lineTotal: menu.price * quantity }
    })
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const order = { id: index + 1, table, status, subtotal: total, total, paymentMethod, createdAt: timestamp, sentAt: timestamp, readyAt: ['Ready', 'Paid'].includes(status) ? timestamp : null, paidAt: status === 'Paid' ? timestamp : null, items }
    orders.push(order)
    if (paymentMethod) payments.push({ id: payments.length + 1, orderId: order.id, method: paymentMethod, amount: total, createdAt: timestamp })
  })
  for (let day = 1; day <= 18; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`
    if (date >= today) break
    const total = 3850 + ((day - 1) % 5) * 460 + ((day - 1) % 3) * 275
    const method = ['UPI', 'Cash', 'Card'][(day - 1) % 3]
    const timestamp = `${date}T22:45:00+05:30`
    const id = orders.length + 1
    orders.push({ id, table: `POS import · ${String(day).padStart(2, '0')} ${new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(`${date}T12:00:00`))}`, status: 'Paid', subtotal: total, total, paymentMethod: method, createdAt: timestamp, sentAt: timestamp, readyAt: timestamp, paidAt: timestamp, items: [] })
    payments.push({ id: payments.length + 1, orderId: id, method, amount: total, createdAt: timestamp })
  }
  const customers = [
    ['Aarav Mehta', '+91 98765 42018', 'aarav.m@example.com', 'Platinum', 18, 42680, 8420, 2840, ['VIP', 'Coffee lover'], true],
    ['Riya Sharma', '+91 98270 11342', 'riya.s@example.com', 'Gold', 12, 28150, 5240, 1720, ['Birthday soon'], true],
    ['Kabir Jain', '+91 98930 77452', 'kabir.j@example.com', 'Gold', 9, 21490, 4680, 1390, ['Vegetarian', 'Regular'], true],
    ['Ananya Verma', '+91 97555 20841', 'ananya.v@example.com', 'Silver', 7, 14320, 3140, 860, ['Desserts'], true],
    ['Vihaan Patel', '+91 99812 66548', 'vihaan.p@example.com', 'Member', 3, 6240, 1980, 320, ['New'], false],
    ['Sara Khan', '+91 93021 58277', 'sara.k@example.com', 'Platinum', 21, 48910, 9360, 3150, ['VIP', 'Celebrations'], true],
  ].map(([name, phone, email, tier, visits, spend, monthSpend, points, tags, consent], index) => ({ id: index + 1, name, phone, email, tier, visits, spend, monthSpend, lastVisit: addDays(today, -(index + 1)), points, tags, avatar: ['#6d3d62', '#2b6b59', '#96713e', '#506faa', '#4f7a78', '#8c4d50'][index], consent, birthday: null, notes: '', createdAt }))
  const reservations = [
    ['Riya Sharma', '+91 98270 11342', 4, 'T-04', 'Birthday', '16:00', 'Confirmed'],
    ['Aditya Rao', '+91 98933 26844', 2, 'T-11', 'Coffee date', '17:30', 'Confirmed'],
    ['Sara Khan', '+91 93021 58277', 8, 'Garden', 'Anniversary', '19:00', 'Confirmed'],
    ['Neha Kapoor', '+91 94250 77411', 5, 'T-08', 'Dinner', '19:30', 'Pending'],
    ['Kabir Jain', '+91 98930 77452', 3, 'T-03', 'Regular visit', '20:15', 'Pending'],
  ].map(([name, phone, guests, table, occasion, time, status], index) => ({ id: index + 1, date: today, time, customerId: customers.find((item) => item.phone === phone)?.id || null, name, phone, guests, table, occasion, status, specialRequests: '', createdAt }))
  const feedback = [
    { id: 1, customerId: 1, name: 'Aarav Mehta', rating: 5, text: 'The cold brew was excellent.', status: 'Resolved', source: 'QR feedback', avatar: '#6d3d62', createdAt },
    { id: 2, customerId: 2, name: 'Riya Sharma', rating: 5, text: 'Beautiful ambience and warm service.', status: 'Resolved', source: 'Website', avatar: '#2b6b59', createdAt },
    { id: 3, customerId: null, name: 'Walk-in guest', rating: 3, text: 'Lunch service took longer than expected.', status: 'Unresolved', source: 'Table QR', avatar: '#96713e', createdAt },
    { id: 4, customerId: 4, name: 'Ananya Verma', rating: 4, text: 'Dessert and coffee pairing was lovely.', status: 'Resolved', source: 'WhatsApp', avatar: '#506faa', createdAt },
    { id: 5, customerId: null, name: 'Nikhil Das', rating: 3, text: 'Table cleanliness needs attention.', status: 'Unresolved', source: 'QR feedback', avatar: '#537878', createdAt },
  ]
  const staff = [
    ['Ravi Kumar', 'Chef', '09:00', '18:00', 18000, 'Present', '08:54'],
    ['Pooja Verma', 'Cashier', '10:00', '19:00', 14000, 'Present', '09:58'],
    ['Aman Singh', 'Waiter', '12:00', '21:00', 12000, 'Late', '12:20'],
    ['Sunil Yadav', 'Helper', '09:00', '18:00', 10000, 'Leave', null],
  ].map(([name, jobRole, shiftStart, shiftEnd, salary, status, checkIn], index) => ({ id: index + 1, name, jobRole, shiftStart, shiftEnd, salary, userId: null, attendance: { status, checkIn, note: status === 'Leave' ? 'Approved leave' : '' } }))
  return {
    version: 2, users, sessions: {}, menuItems, inventory, recipes, orders, payments,
    vendors: [
      { id: 1, name: 'Sharma Dairy', supplies: 'Doodh · paneer', phone: '+91 98260 11001', balance: 6800, status: 'Due' },
      { id: 2, name: 'Fresh Bakery', supplies: 'Bread · buns', phone: '+91 98260 11002', balance: 2400, status: 'Due' },
      { id: 3, name: 'Bean Roasters', supplies: 'Coffee beans', phone: '+91 98260 11003', balance: 0, status: 'Paid' },
    ],
    expenses: [
      { id: 1, name: 'Rent', category: 'Rent', amount: 45000, date: `${month}-01`, vendorId: null, note: 'Monthly cafe rent' },
      { id: 2, name: 'Gas cylinder', category: 'Utilities', amount: 1100, date: addDays(today, -3), vendorId: null, note: 'Kitchen gas refill' },
      { id: 3, name: 'Sharma Dairy bill', category: 'Vendor', amount: 6800, date: addDays(today, -2), vendorId: 1, note: 'Milk and paneer supply' },
      { id: 4, name: 'Sabzi mandi', category: 'Kitchen', amount: 950, date: today, vendorId: null, note: 'Fresh produce' },
    ],
    staff, customers, reservations, feedback,
    tasks: [
      { id: 1, title: "Prepare Riya's birthday table", details: 'Cake note and preferred seating saved', priority: 'High', status: 'Open', type: 'Reservation', dueAt: '15:30', createdAt },
      { id: 2, title: 'Review lunch service delay', details: 'Assigned to Aman', priority: 'Medium', status: 'Open', type: 'Recovery', dueAt: '18:00', createdAt },
      { id: 3, title: 'Call Nikhil about table cleanliness', details: 'Assigned to Priya', priority: 'High', status: 'Open', type: 'Recovery', dueAt: '17:30', createdAt },
    ],
    rewards: [
      { id: 1, name: 'Complimentary dessert', description: 'Any dessert from the regular menu.', points: 500, eligibility: 'All tiers', redemptions: 86, expiry: '90 days', status: 'Active' },
      { id: 2, name: 'Coffee for two', description: 'Two classic coffees.', points: 750, eligibility: 'Silver and above', redemptions: 52, expiry: '60 days', status: 'Active' },
      { id: 3, name: 'Celebration upgrade', description: 'Dessert plating and table styling.', points: 1200, eligibility: 'Gold and above', redemptions: 18, expiry: '90 days', status: 'Active' },
    ],
    activities: [
      { id: 1, kind: 'customer', title: 'New guest profile created', details: 'Devika Shah joined through table QR', createdAt },
      { id: 2, kind: 'reward', title: 'Reward redeemed', details: 'Aarav used a complimentary dessert', createdAt },
      { id: 3, kind: 'reservation', title: 'Reservation confirmed', details: '8 guests · Anniversary · 7:00 PM', createdAt },
      { id: 4, kind: 'feedback', title: '5-star feedback received', details: 'The cold brew was excellent', createdAt },
    ],
    monthlyMetrics: Array.from({ length: 12 }, (_, index) => {
      const date = new Date(); date.setMonth(date.getMonth() - (11 - index))
      return { month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, returningVisits: 45 + index * 6, revenue: 165000 + index * 10800 }
    }),
    settings: { business_name: 'Mangosteen Cafe', primary_phone: '+91 98765 43210', address: 'Indore, Madhya Pradesh', timezone: 'Asia/Kolkata (IST)', currency: 'Indian Rupee (₹)', points_per_rupee: 0.1, automatic_points: true, reservation_reminders: true, marketing_requires_consent: true, backup_enabled: true, backup_retention_days: 30, tier_silver: 8000, tier_gold: 18000, tier_platinum: 35000, feedback_url: '/feedback', guest_wifi_name: 'Mangosteen Guest', guest_wifi_password: 'Mangosteen@2026', guest_wifi_demo: true, operations_alert_recipient: '+91 98765 43210', daily_sales_report_enabled: true, low_stock_alert_enabled: true, daily_report_time: '22:30' },
    communications: [], pointLedger: [], backups: [], publicSubmissions: {}, serviceRequests: [],
    publicMenuItems: catalogItems(), tables: managedTables(), scheduledRuns: {},
  }
}

function normalizeState(state) {
  if (Number(state.version || 1) < 2) {
    const demoPassword = passwordHash('Mangosteen@123')
    const createdAt = now()
    DEMO_ACCOUNTS.forEach(([name, email, role]) => {
      const existing = (state.users || []).find((user) => user.email === email)
      if (existing) Object.assign(existing, { name, role, passwordHash: demoPassword, active: true })
      else (state.users ||= []).push({ id: nextId(state.users), name, email, role, passwordHash: demoPassword, active: true, createdAt, lastLoginAt: null })
    })
    state.version = 2
  }
  state.publicSubmissions ||= {}
  state.serviceRequests ||= []
  state.feedback ||= []
  state.activities ||= []
  state.settings ||= {}
  state.settings.guest_wifi_name ||= 'Mangosteen Guest'
  state.settings.guest_wifi_password ||= 'Mangosteen@2026'
  if (state.settings.guest_wifi_demo === undefined) state.settings.guest_wifi_demo = true
  state.settings.operations_alert_recipient ||= '+91 98765 43210'
  if (state.settings.daily_sales_report_enabled === undefined) state.settings.daily_sales_report_enabled = true
  if (state.settings.low_stock_alert_enabled === undefined) state.settings.low_stock_alert_enabled = true
  state.settings.daily_report_time ||= '22:30'
  const existingMenu = new Map((state.publicMenuItems || []).map((item) => [`${item.category}|${item.name}`, item]))
  state.publicMenuItems = catalogItems().map((item) => ({ ...item, ...(existingMenu.get(`${item.category}|${item.name}`) || {}) }))
  const existingTables = new Map((state.tables || []).map((table) => [String(table.id), table]))
  state.tables = managedTables().map((table) => ({ ...table, ...(existingTables.get(String(table.id)) || {}) }))
  state.scheduledRuns ||= {}
  return state
}

async function loadState() {
  const target = store()
  let state = await target.get(STORE_KEY, { type: 'json' })
  if (!state) {
    state = createSeedState()
    await target.setJSON(STORE_KEY, state)
  }
  return normalizeState(state)
}

async function saveState(state) {
  await store().setJSON(STORE_KEY, state)
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } })
}

function text(body, contentType = 'text/plain; charset=utf-8', status = 200, headers = {}) {
  return new Response(body, { status, headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store', ...headers } })
}

function normalizePath(pathname) {
  const prefixes = ['/crm-api/api', '/api']
  for (const prefix of prefixes) if (pathname.startsWith(prefix)) return pathname.slice(prefix.length) || '/'
  return pathname
}

function parseCookie(request) {
  const source = request.headers.get('cookie') || ''
  return Object.fromEntries(source.split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter((part) => part.length === 2))
}

function currentUser(request, state) {
  const token = parseCookie(request)[SESSION_COOKIE]
  const session = token && state.sessions[token]
  if (!session || Date.now() > session.expiresAt) {
    if (token) delete state.sessions[token]
    return null
  }
  return state.users.find((user) => user.id === session.userId && user.active) || null
}

function requireUser(request, state, minimum = 'Kitchen') {
  const user = currentUser(request, state)
  if (!user) throw Object.assign(new Error('Authentication required'), { status: 401 })
  if ((ROLE_LEVEL[user.role] ?? -1) < ROLE_LEVEL[minimum]) throw Object.assign(new Error(`${minimum} access is required`), { status: 403 })
  return user
}

function requireRoles(request, state, roles) {
  const user = requireUser(request, state)
  if (!roles.includes(user.role)) throw Object.assign(new Error(`Access is limited to ${roles.join(', ')}`), { status: 403 })
  return user
}

function publicUser(user) {
  const { passwordHash: _, ...safe } = user
  return safe
}

function bootstrap(state, user) {
  const role = user.role
  const serviceOnly = ['Kitchen', 'Floor Staff'].includes(role)
  const base = {
    customers: serviceOnly ? [] : state.customers,
    reservations: serviceOnly ? [] : state.reservations,
    feedback: serviceOnly ? [] : state.feedback,
    tasks: serviceOnly ? [] : state.tasks,
    rewards: serviceOnly ? [] : state.rewards,
    activities: serviceOnly ? [] : state.activities,
    monthlyMetrics: serviceOnly ? [] : state.monthlyMetrics,
    settings: serviceOnly ? {} : state.settings,
    users: ROLE_LEVEL[role] >= ROLE_LEVEL.Manager ? state.users.map(publicUser) : [],
    communications: ROLE_LEVEL[role] >= ROLE_LEVEL.Manager ? state.communications : [],
    pointLedger: ROLE_LEVEL[role] >= ROLE_LEVEL.Manager ? state.pointLedger : [],
    backups: role === 'Owner' ? state.backups : [],
    integrations: ROLE_LEVEL[role] >= ROLE_LEVEL.Manager ? { email: { mode: 'Demo', provider: 'Vercel outbox' }, whatsapp: { mode: 'Demo', provider: 'Vercel outbox' }, pos: { mode: 'Ready', provider: 'CSV import' } } : {},
    menuItems: role === 'Floor Staff' ? [] : state.menuItems,
    orders: state.orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100),
    inventory: ['Owner', 'Manager'].includes(role) ? state.inventory : [],
    expenses: ['Owner', 'Manager'].includes(role) ? state.expenses : [],
    vendors: ['Owner', 'Manager'].includes(role) ? state.vendors : [],
    staff: ['Owner', 'Manager'].includes(role) ? state.staff : [],
    payments: serviceOnly ? [] : state.payments,
    serviceRequests: state.serviceRequests.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50),
    publicMenuItems: ROLE_LEVEL[role] >= ROLE_LEVEL.Manager ? state.publicMenuItems : [],
    tables: ROLE_LEVEL[role] >= ROLE_LEVEL.Manager ? state.tables.map(publicTable) : [],
    user: publicUser(user),
  }
  return base
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

async function readBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return {}
  return request.json().catch(() => ({}))
}

function addActivity(state, kind, title, details) {
  state.activities.unshift({ id: nextId(state.activities), kind, title, details, createdAt: now() })
  state.activities = state.activities.slice(0, 25)
}

function sendOrder(state, orderId) {
  const order = state.orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'Draft') throw new Error('Only draft orders can be sent to the kitchen')
  const requirements = new Map()
  order.items.forEach((item) => state.recipes.filter((recipe) => recipe.menuItemId === item.menuItemId).forEach((recipe) => requirements.set(recipe.inventoryItemId, (requirements.get(recipe.inventoryItemId) || 0) + recipe.quantity * item.quantity)))
  for (const [inventoryId, required] of requirements) {
    const stock = state.inventory.find((item) => item.id === inventoryId)
    if (!stock || stock.quantity < required) throw new Error(`Not enough ${stock?.name || 'stock'} for this order`)
  }
  for (const [inventoryId, required] of requirements) {
    const stock = state.inventory.find((item) => item.id === inventoryId)
    stock.quantity = Math.max(0, stock.quantity - required)
    stock.low = stock.quantity <= stock.reorderLevel
  }
  order.status = 'Kitchen'
  order.sentAt = now()
  addActivity(state, 'reservation', 'Order sent to kitchen', `Order #${order.id}`)
}

function publicMenuPayload(state) {
  const groups = new Map()
  state.publicMenuItems.forEach((item) => {
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category).push({
      id: item.id, name: item.name, description: item.description || '',
      price: item.price, available: Boolean(item.active),
    })
  })
  return { categories: [...groups].map(([name, items]) => ({ name, items })), updatedAt: now() }
}

function queueDailyOperationsNotifications(state, { force = false } = {}) {
  const runDate = indiaDate()
  if (!force && state.scheduledRuns[runDate]) return { queued: 0, skipped: true, date: runDate }
  const recipient = String(state.settings.operations_alert_recipient || '').trim()
  if (!recipient) throw new Error('Add an operations alert recipient in Settings first')
  const todayPayments = state.payments.filter((item) => String(item.createdAt || '').slice(0, 10) === runDate)
  const todaySales = todayPayments.reduce((sum, item) => sum + safeNumber(item.amount), 0)
  const todayOrders = state.orders.filter((item) => String(item.createdAt || '').slice(0, 10) === runDate).length
  const lowStock = state.inventory.filter((item) => item.low || safeNumber(item.quantity) <= safeNumber(item.reorderLevel))
  const queued = []
  const addMessage = (message, subject) => {
    const communication = {
      id: nextId(state.communications), customerId: null, channel: 'WhatsApp', recipient,
      subject, message, purpose: 'Transactional', status: 'Queued', provider: 'Vercel scheduled outbox',
      createdAt: now(), sentAt: null, error: '',
    }
    state.communications.unshift(communication)
    queued.push(communication)
  }
  if (state.settings.daily_sales_report_enabled) addMessage(
    `Mangosteen daily summary · ${runDate}: ${todayOrders} orders, ${todayPayments.length} settled bills, sales ₹${todaySales.toLocaleString('en-IN')}.`,
    'Daily sales summary',
  )
  if (state.settings.low_stock_alert_enabled && lowStock.length) addMessage(
    `Mangosteen low-stock alert: ${lowStock.map((item) => `${item.name} (${item.quantity} ${item.unit})`).join(', ')}.`,
    'Low-stock alert',
  )
  state.scheduledRuns[runDate] = { ranAt: now(), queued: queued.length }
  addActivity(state, 'notification', 'Daily operations alerts prepared', `${queued.length} message${queued.length === 1 ? '' : 's'} queued`)
  return { queued: queued.length, skipped: false, date: runDate }
}

async function handlePublicReservation(request, state, body) {
  if (String(body.website || '').trim()) return json({ accepted: true, status: 'Pending' }, 201)
  const key = request.headers.get('idempotency-key') || body.requestKey
  if (!key || String(key).length < 8) throw new Error('A valid reservation request key is required')
  if (state.publicSubmissions[key]) return json(state.publicSubmissions[key])
  const guests = Math.floor(safeNumber(body.guests))
  if (String(body.name || '').trim().length < 2 || String(body.phone || '').trim().length < 7) throw new Error('Guest name and a valid mobile number are required')
  if (guests < 1 || guests > 12) throw new Error('Online reservations support 1 to 12 guests')
  if (!Array.isArray(body.seats) || body.seats.length !== guests) throw new Error('Please select one seat for every guest')
  if (String(body.date) < indiaDate()) throw new Error('Reservation date cannot be in the past')
  let customer = state.customers.find((item) => item.phone === String(body.phone).trim())
  if (!customer) {
    customer = { id: nextId(state.customers), name: String(body.name).trim(), phone: String(body.phone).trim(), email: String(body.email || '').trim(), tier: 'Member', visits: 0, spend: 0, monthSpend: 0, lastVisit: null, points: 0, tags: ['Website booking'], avatar: '#173f35', consent: Boolean(body.consent), birthday: null, notes: 'Created from website reservation', createdAt: now() }
    state.customers.unshift(customer)
  }
  const id = nextId(state.reservations)
  const reservation = { id, date: String(body.date), time: String(body.time), customerId: customer.id, name: customer.name, phone: customer.phone, guests, table: String(body.table || body.area || 'Best available'), occasion: String(body.occasion || 'Regular visit'), status: 'Pending', specialRequests: `Website request · Area: ${body.area || 'Best available'} · Seats: ${body.seats.join(', ')}${body.specialRequests ? ` · Guest note: ${body.specialRequests}` : ''}`, createdAt: now() }
  state.reservations.push(reservation)
  const receipt = { id, reference: `MG-${String(id).padStart(6, '0')}`, status: 'Pending' }
  state.publicSubmissions[key] = receipt
  addActivity(state, 'reservation', 'Website reservation requested', `${reservation.name} · ${guests} guests · ${receipt.reference}`)
  await saveState(state)
  return json(receipt, 201)
}

function validatedPublicTable(state, tableCode, accessKey) {
  const table = state.tables.find((item) => String(item.id) === String(tableCode || '').trim().toUpperCase())
  if (!table || !table.active || table.accessKey !== String(accessKey || '').trim()) throw Object.assign(new Error('Scan the QR fixed to your table to use ordering and table services.'), { status: 403 })
  return table
}

function publicOrderPayload(order) {
  return {
    id: order.id,
    reference: order.reference || `QR-${String(order.id).padStart(6, '0')}`,
    status: order.status,
    total: order.total,
    subtotal: order.subtotal,
    serviceCharge: order.serviceCharge || 0,
    tableLabel: order.tableLabel,
    guestName: order.guestName,
    paymentMethod: order.paymentMethod || '',
    prepaid: Boolean(order.paymentMethod && order.paidAt),
    paymentPreference: order.paymentPreference || '',
    billRequestedAt: order.billRequestedAt || null,
    createdAt: order.createdAt,
    readyAt: order.readyAt || null,
    servedAt: order.servedAt || null,
    paidAt: order.paidAt || null,
    estimatedMinutes: order.estimatedMinutes || 20,
    items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, lineTotal: item.lineTotal })),
  }
}

function publicOrderByToken(state, token) {
  return state.orders.find((item) => item.publicToken && item.publicToken === String(token || ''))
}

async function handlePublicOrder(request, state, body) {
  if (String(body.website || '').trim()) return json({ accepted: true, status: 'Kitchen' }, 201)
  const rawKey = request.headers.get('idempotency-key') || body.requestKey
  if (!rawKey || !/^[A-Za-z0-9._:-]{8,128}$/.test(String(rawKey))) throw new Error('A valid order request key is required')
  const key = `order:${rawKey}`
  state.publicSubmissions ||= {}
  if (state.publicSubmissions[key]) return json(state.publicSubmissions[key])

  const tableCode = String(body.table || '').trim().toUpperCase()
  const table = validatedPublicTable(state, tableCode, body.tableAccessKey)
  const guestName = String(body.guestName || '').trim().slice(0, 60)
  const phone = String(body.phone || '').trim().slice(0, 20)
  const notes = String(body.notes || '').trim().slice(0, 300)
  const payment = body.payment || {}
  const paymentMethod = String(payment.method || '').toUpperCase() === 'UPI' ? 'UPI' : String(payment.method || '').replace(/^./, (value) => value.toUpperCase())
  const paymentReference = String(payment.reference || '').trim()
  if (guestName.length < 2) throw new Error('Please enter the guest name for this order')
  if (phone && !/^[+0-9 ()-]{7,20}$/.test(phone)) throw new Error('Please enter a valid mobile number or leave it blank')
  if (payment.status !== 'Paid' || payment.mode !== 'Demo' || !['UPI', 'Card'].includes(paymentMethod) || !/^DEMO-[A-Za-z0-9._:-]{6,80}$/.test(paymentReference)) throw new Error('Complete the online payment before sending this order to the kitchen')
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 24) throw new Error('Add between 1 and 24 menu items')
  let itemCount = 0
  const items = body.items.map((requested) => {
    const menu = state.publicMenuItems.find((item) => item.category === String(requested.category || '') && item.name === String(requested.name || '') && item.active)
    const quantity = Math.floor(safeNumber(requested.quantity))
    if (!menu || quantity < 1 || quantity > 10) throw new Error('One selected menu item is invalid or unavailable')
    itemCount += quantity
    return { id: randomUUID(), menuItemId: null, name: menu.name, category: menu.category, quantity, unitPrice: menu.price, lineTotal: menu.price * quantity }
  })
  if (itemCount > 30) throw new Error('A QR order can contain up to 30 dishes')
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const serviceCharge = Math.round(subtotal * 0.05)
  const total = subtotal + serviceCharge
  const createdAt = now()
  const publicToken = randomUUID()
  const order = {
    id: nextId(state.orders), table: `QR ${table.id} · ${table.label} · ${guestName}`.slice(0, 40), tableCode: table.id, tableLabel: table.label, status: 'Kitchen',
    subtotal, serviceCharge, total, paymentMethod, paymentPreference: `Prepaid online (${paymentMethod})`, paymentDemo: true, paymentReference, notes,
    guestName, phone, publicToken, estimatedMinutes: Math.min(35, 12 + Math.ceil(itemCount / 2) * 3), createdAt, sentAt: createdAt, readyAt: null, servedAt: null, paidAt: createdAt, billRequestedAt: null, items,
  }
  state.orders.unshift(order)
  state.payments.unshift({ id: nextId(state.payments), orderId: order.id, method: paymentMethod, amount: total, createdAt, reference: paymentReference, mode: 'Demo' })
  order.reference = `QR-${String(order.id).padStart(6, '0')}`
  const receipt = { ...publicOrderPayload(order), publicToken }
  state.publicSubmissions[key] = receipt
  addActivity(state, 'order', 'Prepaid QR order received', `${order.table} · ${receipt.reference} · ${paymentMethod}`)
  await saveState(state)
  return json(receipt, 201)
}

async function handlePublicServiceRequest(state, body) {
  state.serviceRequests ||= []
  const type = String(body.type || '').toLowerCase()
  if (!['waiter', 'bill'].includes(type)) throw new Error('Choose a valid table service')
  let table
  let order = null
  if (type === 'bill') {
    order = publicOrderByToken(state, body.orderToken)
    if (!order) throw Object.assign(new Error('This order link is no longer valid.'), { status: 404 })
    if (order.paymentMethod && order.paidAt) throw new Error('This order is already prepaid')
    table = state.tables.find((item) => String(item.id) === String(order.tableCode))
    if (!table || !table.active) throw Object.assign(new Error('This table is currently unavailable.'), { status: 403 })
  } else {
    table = validatedPublicTable(state, body.table, body.tableAccessKey)
  }
  const paymentPreference = type === 'bill' ? String(body.paymentPreference || '') : ''
  if (type === 'bill' && !['Online payment (demo)', 'Cash at table', 'Pay at counter'].includes(paymentPreference)) throw new Error('Choose how you would like to settle the bill')
  const existing = state.serviceRequests.find((item) => item.type === type && item.tableCode === table.id && item.status === 'Open')
  if (existing) return json({ token: existing.publicToken, status: existing.status, acknowledgedAt: existing.acknowledgedAt || null })
  const createdAt = now()
  const serviceRequest = {
    id: nextId(state.serviceRequests), publicToken: randomUUID(), type, tableCode: table.id, tableLabel: table.label,
    orderId: order?.id || null, paymentPreference, status: 'Open', createdAt, acknowledgedAt: null,
  }
  state.serviceRequests.unshift(serviceRequest)
  if (order && type === 'bill') {
    order.billRequestedAt = createdAt
    order.paymentPreference = paymentPreference
  }
  addActivity(state, 'service', type === 'waiter' ? 'Waiter requested' : 'Bill requested', `${table.label}${paymentPreference ? ` · ${paymentPreference}` : ''}`)
  await saveState(state)
  return json({ token: serviceRequest.publicToken, status: serviceRequest.status, acknowledgedAt: null }, 201)
}

async function handlePublicFeedback(state, body) {
  const order = publicOrderByToken(state, body.orderToken)
  if (!order) throw Object.assign(new Error('This order link is no longer valid.'), { status: 404 })
  const rating = Math.floor(safeNumber(body.rating))
  if (rating < 1 || rating > 5) throw new Error('Choose a rating from 1 to 5')
  const tags = Array.isArray(body.tags) ? body.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5) : []
  const message = String(body.message || '').trim().slice(0, 500)
  const key = `feedback:${order.publicToken}`
  if (state.publicSubmissions[key]) return json(state.publicSubmissions[key])
  const feedback = {
    id: nextId(state.feedback), customerId: null, name: order.guestName || 'Table guest', rating,
    text: [tags.join(' · '), message].filter(Boolean).join(' — ') || `${rating}-star table feedback`,
    status: rating >= 4 ? 'Resolved' : 'Unresolved', source: 'Table QR', avatar: '#537878', createdAt: now(),
  }
  state.feedback.unshift(feedback)
  addActivity(state, 'feedback', `${rating}-star QR feedback received`, `${order.tableLabel} · ${feedback.text}`.slice(0, 140))
  const result = { submitted: true, googleReviewUrl: GOOGLE_REVIEW_URL }
  state.publicSubmissions[key] = result
  await saveState(state)
  return json(result, 201)
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const routedPath = url.searchParams.get('path')
  const path = routedPath ? `/${routedPath.replace(/^\/+/, '')}` : normalizePath(url.pathname)
  try {
    let state = await loadState()
    const body = await readBody(request)

    if (request.method === 'GET' && path === '/health') return json({ status: 'ok', storage: 'Vercel Blob' })
    if (request.method === 'GET' && path === '/public/menu') return json(publicMenuPayload(state))
    if (request.method === 'GET' && path === '/cron/daily-operations') {
      if (process.env.CRON_SECRET && request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return json({ error: 'Cron authorization failed' }, 401)
      const result = queueDailyOperationsNotifications(state)
      await saveState(state)
      return json(result)
    }
    if (request.method === 'GET' && path === '/public/table') {
      const table = validatedPublicTable(state, url.searchParams.get('table'), url.searchParams.get('key'))
      return json({
        table: publicTable(table),
        wifi: { name: state.settings.guest_wifi_name, password: state.settings.guest_wifi_password, demo: Boolean(state.settings.guest_wifi_demo) },
      })
    }
    let publicMatch = path.match(/^\/public\/orders\/([A-Za-z0-9_-]+)$/)
    if (request.method === 'GET' && publicMatch) {
      const order = publicOrderByToken(state, publicMatch[1])
      if (!order) return json({ error: 'Order not found' }, 404)
      return json(publicOrderPayload(order))
    }
    publicMatch = path.match(/^\/public\/service-requests\/([A-Za-z0-9_-]+)$/)
    if (request.method === 'GET' && publicMatch) {
      const item = state.serviceRequests.find((requestItem) => requestItem.publicToken === publicMatch[1])
      if (!item) return json({ error: 'Service request not found' }, 404)
      return json({ status: item.status, acknowledgedAt: item.acknowledgedAt || null })
    }
    if (request.method === 'POST' && path === '/public/reservations') return await handlePublicReservation(request, state, body)
    if (request.method === 'POST' && path === '/public/orders') return await handlePublicOrder(request, state, body)
    if (request.method === 'POST' && path === '/public/service-requests') return await handlePublicServiceRequest(state, body)
    if (request.method === 'POST' && path === '/public/feedback') return await handlePublicFeedback(state, body)

    if (request.method === 'POST' && path === '/auth/login') {
      const user = state.users.find((item) => item.email === String(body.email || '').trim().toLowerCase() && item.active)
      if (!user || !passwordMatches(String(body.password || ''), user.passwordHash)) return json({ error: 'Email or password is incorrect' }, 401)
      const token = randomUUID()
      user.lastLoginAt = now()
      state.sessions[token] = { userId: user.id, expiresAt: Date.now() + SESSION_TTL }
      await saveState(state)
      return json({ authenticated: true, user: publicUser(user) }, 200, { 'Set-Cookie': `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200` })
    }

    if (request.method === 'GET' && path === '/auth/session') {
      const user = currentUser(request, state)
      return json({ authenticated: Boolean(user), user: user ? publicUser(user) : null })
    }

    if (request.method === 'POST' && path === '/auth/logout') {
      const token = parseCookie(request)[SESSION_COOKIE]
      if (token) delete state.sessions[token]
      await saveState(state)
      return json({ authenticated: false }, 200, { 'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` })
    }

    if (request.method === 'POST' && path === '/auth/change-password') {
      const user = requireUser(request, state)
      if (!passwordMatches(String(body.currentPassword || ''), user.passwordHash)) throw new Error('Current password is incorrect')
      if (String(body.newPassword || '').length < 10) throw new Error('New password must be at least 10 characters')
      user.passwordHash = passwordHash(String(body.newPassword))
      await saveState(state)
      return json({ changed: true })
    }

    const serviceMatch = path.match(/^\/service-requests\/(\d+)\/acknowledge$/)
    if (request.method === 'POST' && serviceMatch) {
      requireUser(request, state, 'Cashier')
      const item = state.serviceRequests.find((requestItem) => requestItem.id === Number(serviceMatch[1]))
      if (!item) return json({ error: 'Service request not found' }, 404)
      item.status = 'Acknowledged'
      item.acknowledgedAt = now()
      await saveState(state)
      return json({ acknowledged: true })
    }

    const user = requireUser(request, state)
    if (request.method === 'GET' && path === '/bootstrap') return json(bootstrap(state, user))

    if (request.method === 'GET' && path === '/export/customers.csv') {
      const rows = [['Name', 'Phone', 'Email', 'Tier', 'Visits', 'Lifetime Spend', 'Points', 'Consent'], ...state.customers.map((item) => [item.name, item.phone, item.email, item.tier, item.visits, item.spend, item.points, item.consent ? 'Yes' : 'No'])]
      return text(rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv; charset=utf-8', 200, { 'Content-Disposition': 'attachment; filename="mangosteen-customers.csv"' })
    }
    if (request.method === 'GET' && path === '/export/report.csv') {
      const rows = [['Order', 'Table', 'Status', 'Amount', 'Payment', 'Created'], ...state.orders.filter((item) => item.items.length).map((item) => [item.id, item.table, item.status, item.total, item.paymentMethod || '', item.createdAt])]
      return text(rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv; charset=utf-8', 200, { 'Content-Disposition': 'attachment; filename="mangosteen-report.csv"' })
    }
    if (request.method === 'GET' && path.startsWith('/backups/')) {
      requireRoles(request, state, ['Owner'])
      const name = decodeURIComponent(path.slice('/backups/'.length))
      const backup = await store().get(`backup:${name}`, { type: 'text' })
      if (!backup) return json({ error: 'Backup not found' }, 404)
      return text(backup, 'application/json', 200, { 'Content-Disposition': `attachment; filename="${name}.json"` })
    }

    if (request.method !== 'POST') return json({ error: 'API route not found' }, 404)

    let match = path.match(/^\/public-menu-items\/(.+)$/)
    if (match) {
      requireRoles(request, state, ['Owner'])
      const item = state.publicMenuItems.find((entry) => entry.id === decodeURIComponent(match[1]))
      if (!item) return json({ error: 'Menu item not found' }, 404)
      const price = safeNumber(body.price, item.price)
      if (price < 0 || price > 10000) throw new Error('Enter a valid menu price')
      item.price = price
      if (body.active !== undefined) item.active = Boolean(body.active)
      item.updatedAt = now()
      await saveState(state)
      return json({ updated: true, item })
    }

    match = path.match(/^\/tables\/([^/]+)$/)
    if (match) {
      requireRoles(request, state, ['Owner'])
      const table = state.tables.find((entry) => String(entry.id) === decodeURIComponent(match[1]))
      if (!table) return json({ error: 'Table not found' }, 404)
      const capacity = Math.floor(safeNumber(body.capacity, table.capacity))
      if (capacity < 1 || capacity > 30) throw new Error('Capacity must be between 1 and 30')
      table.label = String(body.label || table.label).trim().slice(0, 40)
      table.zoneName = String(body.zoneName || table.zoneName).trim().slice(0, 60)
      table.capacity = capacity
      if (body.active !== undefined) table.active = Boolean(body.active)
      await saveState(state)
      return json({ updated: true, table: publicTable(table) })
    }

    if (path === '/notifications/run-daily') {
      requireRoles(request, state, ['Owner'])
      const result = queueDailyOperationsNotifications(state, { force: true })
      await saveState(state)
      return json(result)
    }

    if (path === '/orders') {
      requireRoles(request, state, ['Owner', 'Manager', 'Cashier'])
      const items = (Array.isArray(body.items) ? body.items : []).map((requested) => {
        const menu = state.menuItems.find((item) => item.id === Number(requested.menuItemId) && item.active)
        const quantity = Math.floor(safeNumber(requested.quantity))
        return menu && quantity > 0 ? { id: randomUUID(), menuItemId: menu.id, name: menu.name, quantity, unitPrice: menu.price, lineTotal: menu.price * quantity } : null
      }).filter(Boolean)
      if (!String(body.table || '').trim() || !items.length) throw new Error('Table and at least one menu item are required')
      const total = items.reduce((sum, item) => sum + item.lineTotal, 0)
      const order = { id: nextId(state.orders), table: String(body.table).trim().slice(0, 40), status: 'Draft', subtotal: total, total, paymentMethod: null, createdAt: now(), sentAt: null, readyAt: null, paidAt: null, items }
      state.orders.unshift(order)
      await saveState(state)
      return json({ id: order.id, total }, 201)
    }

    match = path.match(/^\/orders\/(\d+)\/send$/)
    if (match) {
      requireRoles(request, state, ['Owner', 'Manager', 'Cashier'])
      sendOrder(state, Number(match[1]))
      await saveState(state)
      return json({ updated: true, status: 'Kitchen' })
    }
    match = path.match(/^\/orders\/(\d+)\/status$/)
    if (match) {
      const actor = requireRoles(request, state, ['Owner', 'Manager', 'Kitchen', 'Floor Staff'])
      const order = state.orders.find((item) => item.id === Number(match[1]))
      const status = String(body.status || '')
      if (!order || !['Kitchen', 'Preparing', 'Ready', 'Served'].includes(status) || order.status === 'Paid') throw new Error('Order or kitchen status is invalid')
      if (actor.role === 'Kitchen' && status === 'Served') throw Object.assign(new Error('Floor staff must confirm table delivery'), { status: 403 })
      if (actor.role === 'Floor Staff' && (status !== 'Served' || order.status !== 'Ready')) throw Object.assign(new Error('Floor staff can only mark ready orders as served'), { status: 403 })
      order.status = status
      if (status === 'Ready') order.readyAt = now()
      if (status === 'Served') order.servedAt = now()
      await saveState(state)
      return json({ updated: true, status })
    }
    match = path.match(/^\/orders\/(\d+)\/pay$/)
    if (match) {
      requireRoles(request, state, ['Owner', 'Manager', 'Cashier'])
      const order = state.orders.find((item) => item.id === Number(match[1]))
      const method = String(body.method || '').toUpperCase() === 'UPI' ? 'UPI' : String(body.method || '').replace(/^./, (value) => value.toUpperCase())
      if (!order || order.status === 'Paid' || order.paidAt || !['Cash', 'UPI', 'Card'].includes(method)) throw new Error('Order or payment method is invalid')
      order.status = 'Paid'; order.paymentMethod = method; order.paidAt = now()
      state.payments.unshift({ id: nextId(state.payments), orderId: order.id, method, amount: order.total, createdAt: order.paidAt })
      await saveState(state)
      return json({ paid: true, method, amount: order.total })
    }
    match = path.match(/^\/inventory\/(\d+)\/adjust$/)
    if (match) {
      requireRoles(request, state, ['Owner', 'Manager'])
      const item = state.inventory.find((entry) => entry.id === Number(match[1]))
      const quantity = safeNumber(body.quantity)
      if (!item || !quantity || item.quantity + quantity < 0) throw new Error('Enter a valid stock adjustment')
      item.quantity += quantity; item.low = item.quantity <= item.reorderLevel
      await saveState(state)
      return json({ adjusted: true })
    }
    if (path === '/expenses') {
      requireRoles(request, state, ['Owner', 'Manager'])
      const amount = safeNumber(body.amount)
      if (!String(body.name || '').trim() || amount <= 0) throw new Error('Expense name and positive amount are required')
      const expense = { id: nextId(state.expenses), name: String(body.name).trim(), category: String(body.category || 'Other'), amount, date: String(body.date || indiaDate()), vendorId: body.vendorId ? Number(body.vendorId) : null, note: String(body.note || '') }
      state.expenses.unshift(expense)
      if (expense.vendorId && body.addToBalance) { const vendor = state.vendors.find((item) => item.id === expense.vendorId); if (vendor) { vendor.balance += amount; vendor.status = 'Due' } }
      await saveState(state)
      return json({ id: expense.id }, 201)
    }
    if (path === '/vendors') {
      requireRoles(request, state, ['Owner', 'Manager'])
      if (!String(body.name || '').trim()) throw new Error('Vendor name is required')
      const vendor = { id: nextId(state.vendors), name: String(body.name).trim(), supplies: String(body.supplies || ''), phone: String(body.phone || ''), balance: Math.max(0, safeNumber(body.balance)), status: safeNumber(body.balance) > 0 ? 'Due' : 'Paid' }
      state.vendors.push(vendor); await saveState(state); return json({ id: vendor.id }, 201)
    }
    match = path.match(/^\/vendors\/(\d+)\/pay$/)
    if (match) {
      requireRoles(request, state, ['Owner', 'Manager'])
      const vendor = state.vendors.find((item) => item.id === Number(match[1])); const amount = safeNumber(body.amount)
      if (!vendor || amount <= 0 || amount > vendor.balance) throw new Error('Enter a valid vendor payment')
      vendor.balance -= amount; vendor.status = vendor.balance <= 0 ? 'Paid' : 'Due'; await saveState(state); return json({ paid: true })
    }
    if (path === '/staff') {
      requireRoles(request, state, ['Owner', 'Manager'])
      if (!String(body.name || '').trim() || !String(body.jobRole || '').trim()) throw new Error('Staff name and role are required')
      const member = { id: nextId(state.staff), name: String(body.name).trim(), jobRole: String(body.jobRole).trim(), shiftStart: String(body.shiftStart || '09:00'), shiftEnd: String(body.shiftEnd || '18:00'), salary: Math.max(0, safeNumber(body.salary)), userId: null, attendance: null }
      state.staff.push(member); await saveState(state); return json({ id: member.id }, 201)
    }
    if (path === '/attendance') {
      requireRoles(request, state, ['Owner', 'Manager'])
      const member = state.staff.find((item) => item.id === Number(body.staffId))
      if (!member || !['Present', 'Late', 'Leave', 'Absent'].includes(String(body.status))) throw new Error('Staff member and valid attendance are required')
      member.attendance = { status: String(body.status), checkIn: body.checkIn || null, note: String(body.note || '') }
      await saveState(state); return json({ saved: true })
    }
    if (path === '/customers') {
      requireUser(request, state, 'Host')
      if (!String(body.name || '').trim() || !String(body.phone || '').trim()) throw new Error('Name and phone are required')
      if (state.customers.some((item) => item.phone === String(body.phone).trim())) throw new Error('A customer with this phone already exists')
      const customer = { id: nextId(state.customers), name: String(body.name).trim(), phone: String(body.phone).trim(), email: String(body.email || ''), tier: String(body.tier || 'Member'), visits: 0, spend: 0, monthSpend: 0, lastVisit: null, points: 0, tags: [String(body.tag || 'New')], avatar: '#173f35', consent: Boolean(body.consent), birthday: body.birthday || null, notes: String(body.notes || ''), createdAt: now() }
      state.customers.unshift(customer); addActivity(state, 'customer', 'New guest profile created', customer.name); await saveState(state); return json({ id: customer.id }, 201)
    }
    if (path === '/reservations') {
      requireUser(request, state, 'Host')
      if (!String(body.name || '').trim() || !String(body.date || '') || !String(body.time || '')) throw new Error('Name, date and time are required')
      const reservation = { id: nextId(state.reservations), date: String(body.date), time: String(body.time), customerId: body.customerId ? Number(body.customerId) : null, name: String(body.name).trim(), phone: String(body.phone || ''), guests: Math.max(1, Math.floor(safeNumber(body.guests, 1))), table: String(body.table || 'Best available'), occasion: String(body.occasion || 'Regular visit'), status: 'Pending', specialRequests: String(body.specialRequests || ''), createdAt: now() }
      state.reservations.push(reservation); await saveState(state); return json({ id: reservation.id }, 201)
    }
    match = path.match(/^\/reservations\/(\d+)\/status$/)
    if (match) {
      requireUser(request, state, 'Host')
      const reservation = state.reservations.find((item) => item.id === Number(match[1])); const status = String(body.status || '')
      if (!reservation || !['Pending', 'Confirmed', 'Completed', 'No-show', 'Cancelled'].includes(status)) throw new Error('Reservation status is invalid')
      reservation.status = status; addActivity(state, 'reservation', `Reservation ${status.toLowerCase()}`, reservation.name); await saveState(state); return json({ updated: true, status })
    }
    if (path === '/rewards') {
      requireUser(request, state, 'Manager')
      const reward = { id: nextId(state.rewards), name: String(body.name || '').trim(), description: String(body.description || ''), points: Math.max(0, Math.floor(safeNumber(body.points))), eligibility: String(body.eligibility || 'All tiers'), redemptions: 0, expiry: String(body.expiry || '90 days'), status: 'Active' }
      if (!reward.name) throw new Error('Reward name is required')
      state.rewards.push(reward); await saveState(state); return json({ id: reward.id }, 201)
    }
    if (path === '/settings') {
      requireUser(request, state, 'Manager')
      state.settings = { ...state.settings, ...body }; await saveState(state); return json({ saved: true })
    }
    if (path === '/communications/send') {
      requireUser(request, state, 'Host')
      if (!String(body.recipient || '').trim() || !String(body.message || '').trim()) throw new Error('Recipient and message are required')
      const communication = { id: nextId(state.communications), customerId: body.customerId ? Number(body.customerId) : null, channel: String(body.channel || 'WhatsApp'), recipient: String(body.recipient), subject: String(body.subject || ''), message: String(body.message), purpose: String(body.purpose || 'Transactional'), status: 'Queued', provider: 'Vercel demo outbox', createdAt: now(), sentAt: null, error: '' }
      state.communications.unshift(communication); await saveState(state); return json({ id: communication.id, status: communication.status, provider: communication.provider })
    }
    if (path === '/points/adjust') {
      requireUser(request, state, 'Manager')
      const customer = state.customers.find((item) => item.id === Number(body.customerId)); const points = Math.trunc(safeNumber(body.points))
      if (!customer || !points || customer.points + points < 0 || !String(body.reason || '').trim()) throw new Error('Customer, points and reason are required')
      customer.points += points; state.pointLedger.unshift({ id: nextId(state.pointLedger), customerId: customer.id, points, reason: String(body.reason), createdAt: now() }); await saveState(state); return json({ adjusted: true })
    }
    if (path === '/users') {
      requireRoles(request, state, ['Owner'])
      const role = String(body.role || 'Host')
      if (!String(body.name || '').trim() || !String(body.email || '').includes('@') || !ROLE_LEVEL.hasOwnProperty(role) || String(body.password || '').length < 10) throw new Error('Valid name, email, role and password are required')
      if (state.users.some((item) => item.email === String(body.email).toLowerCase())) throw new Error('This email already has an account')
      const account = { id: nextId(state.users), name: String(body.name).trim(), email: String(body.email).toLowerCase(), role, passwordHash: passwordHash(String(body.password)), active: true, createdAt: now(), lastLoginAt: null }
      state.users.push(account); await saveState(state); return json({ id: account.id }, 201)
    }
    match = path.match(/^\/users\/(\d+)\/toggle$/)
    if (match) {
      const owner = requireRoles(request, state, ['Owner']); const account = state.users.find((item) => item.id === Number(match[1]))
      if (!account || account.id === owner.id) throw new Error('This account cannot be changed')
      account.active = !account.active; await saveState(state); return json({ updated: true })
    }
    match = path.match(/^\/tasks\/(\d+)\/complete$/)
    if (match) {
      requireUser(request, state, 'Host'); const task = state.tasks.find((item) => item.id === Number(match[1])); if (!task) throw new Error('Task not found')
      task.status = 'Completed'; task.completedAt = now(); await saveState(state); return json({ completed: true })
    }
    match = path.match(/^\/feedback\/(\d+)\/recovery$/)
    if (match) {
      requireUser(request, state, 'Host'); const feedback = state.feedback.find((item) => item.id === Number(match[1])); if (!feedback) throw new Error('Feedback not found')
      feedback.status = 'Resolved'; state.tasks.unshift({ id: nextId(state.tasks), title: `Follow up with ${feedback.name}`, details: `${feedback.rating}-star feedback: ${feedback.text}`, priority: 'High', status: 'Open', type: 'Recovery', dueAt: null, createdAt: now() }); await saveState(state); return json({ resolved: true })
    }
    if (path === '/import/customers') {
      requireUser(request, state, 'Manager')
      const lines = String(body.csv || '').trim().split(/\r?\n/); if (lines.length < 2) throw new Error('CSV must include a header and customer rows')
      const headers = lines[0].split(',').map((item) => item.trim().toLowerCase().replaceAll('"', '')); const nameIndex = headers.findIndex((item) => item.includes('name')); const phoneIndex = headers.findIndex((item) => item.includes('phone') || item.includes('mobile'))
      if (nameIndex < 0 || phoneIndex < 0) throw new Error('CSV must include name and phone columns')
      let inserted = 0; let skipped = 0
      lines.slice(1).forEach((line) => { const cells = line.split(',').map((item) => item.trim().replace(/^"|"$/g, '')); const name = cells[nameIndex]; const phone = cells[phoneIndex]; if (!name || !phone || state.customers.some((item) => item.phone === phone)) { skipped += 1; return } state.customers.unshift({ id: nextId(state.customers), name, phone, email: '', tier: 'Member', visits: 0, spend: 0, monthSpend: 0, lastVisit: null, points: 0, tags: ['Imported'], avatar: '#173f35', consent: false, birthday: null, notes: '', createdAt: now() }); inserted += 1 })
      await saveState(state); return json({ inserted, updated: 0, skipped, errors: [] })
    }
    if (path === '/backups') {
      requireRoles(request, state, ['Owner'])
      const name = `mangosteen-${indiaDate()}-${Date.now()}`; const snapshot = JSON.stringify(state)
      await store().set(`backup:${name}`, snapshot); state.backups.unshift({ name, size: Buffer.byteLength(snapshot), createdAt: now() }); state.backups = state.backups.slice(0, 30); await saveState(state); return json({ created: true, backup: state.backups[0] })
    }
    if (path === '/backups/restore') {
      requireRoles(request, state, ['Owner'])
      const restored = await store().get(`backup:${String(body.name || '')}`, { type: 'json' }); if (!restored) throw new Error('Backup not found')
      restored.sessions = state.sessions; restored.backups = state.backups; await saveState(restored); return json({ restored: true })
    }
    if (path === '/reset') {
      requireRoles(request, state, ['Owner'])
      const reset = createSeedState(); reset.users = state.users; reset.sessions = state.sessions; reset.backups = state.backups; await saveState(reset); return json({ reset: true })
    }
    return json({ error: 'API route not found' }, 404)
  } catch (error) {
    console.error('Mangosteen API error', error)
    return json({ error: error.message || 'The CRM could not complete this request.' }, error.status || 400)
  }
}

export default { fetch: handleRequest }

