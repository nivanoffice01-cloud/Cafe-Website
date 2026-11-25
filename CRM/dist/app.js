const Icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M7.5 8C5.6 8 5 6.9 5 5.7 5 4.4 6 3.5 7.2 3.5c2 0 4.8 4.5 4.8 4.5M16.5 8C18.4 8 19 6.9 19 5.7c0-1.3-1-2.2-2.2-2.2C14.8 3.5 12 8 12 8"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.37.35.71.6 1 .3.3.7.4 1.1.4h.1a2 2 0 1 1 0 4h-.1A1.7 1.7 0 0 0 19.4 15Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  arrowUp: '<path d="m18 15-6-6-6 6"/>',
  arrowDown: '<path d="m6 9 6 6 6-6"/>',
  wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6"/><path d="M16 13h2"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M16 11h6"/>',
  coffee: '<path d="M4 8h13v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM17 10h1a3 3 0 0 1 0 6h-1M6 2v3M10 2v3M14 2v3"/>',
  star: '<path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z"/>',
  sparkles: '<path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2ZM5 14l-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8ZM19 13l-.8 2.2-2.2.8 2.2.8L19 19l.8-2.2L22 16l-2.2-.8Z"/>',
  cake: '<path d="M4 11h16v9H4ZM2 20h20M8 11V7M12 11V7M16 11V7M7 4c0 1 .5 2 1 2s1-1 1-2-1-2-1-2-1 1-1 2ZM11 4c0 1 .5 2 1 2s1-1 1-2-1-2-1-2-1 1-1 2ZM15 4c0 1 .5 2 1 2s1-1 1-2-1-2-1-2-1 1-1 2Z"/>',
  alert: '<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  whatsapp: '<path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4.2Z"/><path d="M8.2 7.7c.2-.5.4-.5.7-.5h.4c.1 0 .3 0 .4.3l.9 2c.1.3.1.4 0 .6l-.7 1c-.1.2-.2.3 0 .6.2.3.8 1.3 1.8 2 .9.8 1.8 1 2.1 1.1.3.1.5 0 .7-.2l.9-1.1c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.2.5.4 0 .2 0 1.1-.7 1.8-.6.7-1.5 1-2.1 1-1 0-2.3-.4-4.4-1.5-2.6-1.4-4.3-4.5-4.4-4.7-.1-.3-1-1.4-1-2.7s.7-2.1 1-2.4Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  table: '<path d="M4 9h16M6 9v11M18 9v11M3 5h18v4H3Z"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M8.5 13 7 22l5-3 5 3-1.5-9"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  click: '<path d="M9 9V5a2 2 0 0 1 4 0v4M13 8V4a2 2 0 0 1 4 0v5M17 9V7a2 2 0 0 1 4 0v6c0 5-3 9-8 9h-1c-3 0-5-1-7-4l-3-5a2 2 0 0 1 3-2l4 3Z"/>',
  rupee: '<path d="M6 3h12M6 8h12M7 3c5 0 7 2 7 5s-2 5-7 5H5l10 8"/>',
  reply: '<path d="m9 17-5-5 5-5M4 12h9a6 6 0 0 1 6 6v1"/>',
  building: '<path d="M3 21h18M5 21V5l7-3v19M19 21V9l-7-2M8 9h1M8 13h1M8 17h1M15 13h1M15 17h1"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v7c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12v7c0 1.7 4 3 9 3s9-1.3 9-3v-7"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7L20 14M20 8v6h-6"/>',
};

function icon(name, className = 'icon') {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${Icons[name] || Icons.grid}</svg>`;
}

let data = {
  customers: [], reservations: [], feedback: [], tasks: [],
  rewards: [], activities: [], monthlyMetrics: [], settings: {}, users: [],
  communications: [], pointLedger: [], backups: [], integrations: {}, user: null,
  menuItems: [], publicMenuItems: [], tables: [], orders: [], inventory: [], expenses: [], vendors: [], staff: [], payments: [], serviceRequests: [],
};
let loading = true;
let dataError = '';
let authState = 'checking';
const isCloudHosted = !['localhost', '127.0.0.1', ''].includes(window.location.hostname);
let csrfToken = '';

async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && method !== 'GET' && path !== '/api/auth/login' ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (payload.csrfToken) csrfToken = payload.csrfToken;
  if (response.status === 401) {
    authState = 'anonymous';
    csrfToken = '';
    if (path !== '/api/auth/login') window.setTimeout(() => renderApp(), 0);
  }
  if (!response.ok) throw new Error(payload.error || 'The local CRM server could not complete this request.');
  return payload;
}

async function loadData({ quiet = false } = {}) {
  if (!quiet) loading = true;
  dataError = '';
  try {
    data = await api('/api/bootstrap');
    authState = 'authenticated';
    const allowedPages = rolePages[data.user?.role] || rolePages.Host;
    if (!allowedPages.includes(state.page)) state.page = allowedPages[0] || 'dashboard';
  } catch (error) {
    dataError = error.message;
  } finally {
    loading = false;
  }
}

async function boot() {
  loading = true;
  try {
    const session = await api('/api/auth/session');
    authState = session.authenticated ? 'authenticated' : 'anonymous';
    if (session.authenticated) await loadData({ quiet: true });
  } catch (error) {
    dataError = error.message;
    authState = 'anonymous';
  } finally {
    loading = false;
    renderApp();
  }
}

function localDateKey(value = new Date()) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function displayDate(value) {
  if (!value) return 'Not visited';
  const parsed = new Date(`${value}T12:00:00`);
  const today = localDateKey();
  const yesterday = localDateKey(new Date(Date.now() - 86400000));
  if (value === today) return 'Today';
  if (value === yesterday) return 'Yesterday';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(parsed);
}

function displayTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2000-01-01T${value}`));
}

function relativeTime(value) {
  if (!value) return 'now';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function calculateAnalytics() {
  const today = localDateKey();
  const customers = data.customers || [];
  const reservations = data.reservations || [];
  const feedback = data.feedback || [];
  const tasks = data.tasks || [];
  const rewards = data.rewards || [];
  const todayReservations = reservations.filter((item) => item.date === today);
  const completedReservations = reservations.filter((item) => item.status === 'Completed');
  const noShows = reservations.filter((item) => item.status === 'No-show');
  const totalCustomers = customers.length;
  const returningCustomers = customers.filter((item) => item.visits >= 2).length;
  const activeMembers = customers.filter((item) => item.visits > 0 || item.points > 0).length;
  const consented = customers.filter((item) => item.consent).length;
  const feedbackAverage = feedback.length ? feedback.reduce((sum, item) => sum + Number(item.rating), 0) / feedback.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: feedback.filter((item) => item.rating === rating).length }));
  const monthRevenue = customers.reduce((sum, item) => sum + Number(item.monthSpend || 0), 0);
  const lifetimeRevenue = customers.reduce((sum, item) => sum + Number(item.spend || 0), 0);
  const totalPoints = customers.reduce((sum, item) => sum + Number(item.points || 0), 0);
  const totalRewardRedemptions = rewards.reduce((sum, item) => sum + Number(item.redemptions || 0), 0);
  const completedOrNoShow = completedReservations.length + noShows.length;
  const openTasks = tasks.filter((item) => item.status !== 'Completed');
  return {
    totalCustomers, returningCustomers, activeMembers, consented,
    returningRate: totalCustomers ? returningCustomers / totalCustomers * 100 : 0,
    optInRate: totalCustomers ? consented / totalCustomers * 100 : 0,
    todayReservations,
    todayGuests: todayReservations.reduce((sum, item) => sum + Number(item.guests || 0), 0),
    bookedCapacity: Math.min(100, todayReservations.reduce((sum, item) => sum + Number(item.guests || 0), 0) / 80 * 100),
    noShowRate: completedOrNoShow ? noShows.length / completedOrNoShow * 100 : 0,
    feedbackAverage, ratingCounts, openFeedback: feedback.filter((item) => item.status === 'Unresolved').length,
    monthRevenue, lifetimeRevenue, totalPoints, totalRewardRedemptions,
    averageSpend: totalCustomers ? lifetimeRevenue / totalCustomers : 0,
    openTasks,
  };
}

function calculateOperations() {
  const today = localDateKey();
  const month = today.slice(0, 7);
  const orders = data.orders || [];
  const payments = data.payments || [];
  const expenses = data.expenses || [];
  const todayPayments = payments.filter((item) => (item.createdAt || '').slice(0, 10) === today);
  const monthPayments = payments.filter((item) => (item.createdAt || '').slice(0, 7) === month);
  const todayExpenses = expenses.filter((item) => item.date === today);
  const monthExpenses = expenses.filter((item) => (item.date || '').slice(0, 7) === month);
  const paymentTotals = { Cash: 0, UPI: 0, Card: 0 };
  todayPayments.forEach((item) => { paymentTotals[item.method] = (paymentTotals[item.method] || 0) + Number(item.amount || 0); });
  const itemSales = {};
  orders.filter((order) => order.status === 'Paid').forEach((order) => order.items.forEach((item) => {
    itemSales[item.name] = (itemSales[item.name] || 0) + Number(item.quantity || 0);
  }));
  const topItem = Object.entries(itemSales).sort((a, b) => b[1] - a[1])[0] || ['No paid orders yet', 0];
  const categoryExpenses = {};
  monthExpenses.forEach((item) => { categoryExpenses[item.category] = (categoryExpenses[item.category] || 0) + Number(item.amount || 0); });
  const todaySales = todayPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthSales = monthPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const todayExpenseTotal = todayExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthExpenseTotal = monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return {
    activeOrders: orders.filter((item) => !['Paid', 'Cancelled'].includes(item.status)),
    kitchenOrders: orders.filter((item) => ['Kitchen', 'Preparing', 'Ready'].includes(item.status)),
    unpaidOrders: orders.filter((item) => item.status !== 'Paid'),
    paidOrders: orders.filter((item) => item.status === 'Paid'),
    todaySales, monthSales, todayExpenseTotal, monthExpenseTotal, todayPaymentCount: todayPayments.length,
    todayProfit: todaySales - todayExpenseTotal,
    monthProfit: monthSales - monthExpenseTotal,
    paymentTotals,
    lowStock: (data.inventory || []).filter((item) => item.low),
    vendorDue: (data.vendors || []).reduce((sum, item) => sum + Number(item.balance || 0), 0),
    payroll: (data.staff || []).reduce((sum, item) => sum + Number(item.salary || 0), 0),
    presentStaff: (data.staff || []).filter((item) => ['Present', 'Late'].includes(item.attendance?.status)).length,
    topItem: { name: topItem[0], quantity: topItem[1] },
    categoryExpenses,
  };
}
let state = {
  page: 'dashboard',
  customerQuery: '',
  customerTier: 'All tiers',
  reservationView: 'Calendar',
  sidebarOpen: false,
  settingsTab: 'profile',
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'orders', label: 'Orders & POS', icon: 'coffee' },
  { id: 'kitchen', label: 'Kitchen display', icon: 'clock' },
  { id: 'floor', label: 'Floor service', icon: 'users' },
  { id: 'billing', label: 'Billing & closing', icon: 'wallet' },
  { id: 'stock', label: 'Inventory', icon: 'database' },
  { id: 'expenses', label: 'Expenses', icon: 'rupee' },
  { id: 'vendors', label: 'Vendors', icon: 'building' },
  { id: 'staff', label: 'Staff & attendance', icon: 'users' },
  { id: 'customers', label: 'Customers', icon: 'users' },
  { id: 'reservations', label: 'Reservations', icon: 'calendar', badge: '5' },
  { id: 'loyalty', label: 'Loyalty & rewards', icon: 'gift' },
  { id: 'feedback', label: 'Feedback', icon: 'message', badge: '2' },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const rolePages = {
  Owner: navItems.map((item) => item.id),
  Manager: navItems.map((item) => item.id),
  Cashier: ['dashboard', 'orders', 'billing', 'customers', 'reservations'],
  Kitchen: ['kitchen'],
  'Floor Staff': ['floor'],
  Host: ['dashboard', 'customers', 'reservations', 'feedback', 'reports'],
};

const pageSearchAliases = {
  dashboard: 'home overview summary',
  orders: 'order orders pos table takeaway menu',
  kitchen: 'kitchen display tickets cooking',
  floor: 'floor service waiter table handoff served requests bill',
  billing: 'billing bill payment payments closing cash',
  stock: 'inventory stock ingredients supplies',
  expenses: 'expense expenses costs spending',
  vendors: 'vendor vendors supplier suppliers',
  staff: 'staff team employee employees attendance roster',
  customers: 'customer customers guest guests crm',
  reservations: 'reservation reservations booking bookings tables',
  loyalty: 'loyalty rewards points membership',
  feedback: 'feedback review reviews rating ratings',
  reports: 'report reports analytics sales profit',
  settings: 'setting settings configuration preferences account security',
};

function allowedPagesForCurrentUser() {
  return rolePages[data.user?.role] || rolePages.Host;
}

function runGlobalSearch(rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return;
  const allowedPages = allowedPagesForCurrentUser();
  const pageMatch = navItems.find((item) => {
    if (!allowedPages.includes(item.id)) return false;
    const terms = `${item.id} ${item.label} ${pageSearchAliases[item.id] || ''}`.toLowerCase();
    return terms.split(/\s+/).some((term) => term.startsWith(query)) || terms.includes(query);
  });

  if (pageMatch) {
    state.page = pageMatch.id;
    state.customerQuery = '';
    refreshPage();
    showToast(`Opened ${pageMatch.label}.`);
    return;
  }

  const sources = [
    { page: 'customers', label: 'Customers', records: data.customers },
    { page: 'orders', label: 'Orders & POS', records: [...(data.orders || []), ...(data.menuItems || [])] },
    { page: 'reservations', label: 'Reservations', records: data.reservations },
    { page: 'stock', label: 'Inventory', records: data.inventory },
    { page: 'expenses', label: 'Expenses', records: data.expenses },
    { page: 'vendors', label: 'Vendors', records: data.vendors },
    { page: 'staff', label: 'Staff & attendance', records: data.staff },
    { page: 'feedback', label: 'Feedback', records: data.feedback },
  ];
  const recordMatch = sources.find((source) => allowedPages.includes(source.page)
    && (source.records || []).some((record) => JSON.stringify(record).toLowerCase().includes(query)));

  if (!recordMatch) {
    showToast(`No CRM result found for “${rawQuery.trim()}”.`, 'error');
    return;
  }

  state.page = recordMatch.page;
  state.customerQuery = recordMatch.page === 'customers' ? rawQuery.trim() : '';
  refreshPage();
  if (recordMatch.page === 'customers') window.setTimeout(() => filterCustomers(), 0);
  showToast(`Found a match in ${recordMatch.label}.`);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function initials(name) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function inr(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function todayLabel() {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date());
}

function statusPill(value) {
  return `<span class="status ${value.toLowerCase().replaceAll(' ', '-')}">${escapeHtml(value)}</span>`;
}

function stars(count, total = 5) {
  return `<span class="stars" aria-label="${count} out of ${total} stars">${Array.from({ length: total }, (_, index) => `<span style="opacity:${index < count ? 1 : 0.18}">${icon('star')}</span>`).join('')}</span>`;
}

function pageHeader(eyebrow, title, description, actions = '') {
  return `
    <header class="page-header">
      <div>
        <div class="eyebrow">${eyebrow}</div>
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
      ${actions ? `<div class="header-actions">${actions}</div>` : ''}
    </header>`;
}

function shell() {
  const analytics = calculateAnalytics();
  const operations = calculateOperations();
  const businessName = data.settings.business_name || 'Mangosteen Cafe';
  const user = data.user || { name: 'Staff member', role: 'Host' };
  const userInitials = initials(user.name || 'Staff');
  const allowedPages = allowedPagesForCurrentUser();
  if (!allowedPages.includes(state.page)) state.page = allowedPages[0];
  const visibleNav = navItems.filter((item) => allowedPages.includes(item.id));
  const dynamicBadge = (id) => id === 'reservations' ? analytics.todayReservations.length : id === 'feedback' ? analytics.openFeedback : id === 'kitchen' ? operations.kitchenOrders.length : id === 'stock' ? operations.lowStock.length : null;
  return `
    <div class="app-shell">
      <aside class="sidebar ${state.sidebarOpen ? 'open' : ''}" id="sidebar">
        <div class="brand">
          <img class="brand-lockup" src="./assets/mangosteen-brand-lockup.png" alt="${escapeHtml(businessName)}" />
        </div>
        <div class="nav-label">Workspace</div>
        <nav class="nav-list" aria-label="Main navigation">
          ${visibleNav.map((item) => `
            <button class="nav-item ${state.page === item.id ? 'active' : ''}" data-page="${item.id}">
              ${icon(item.icon)}<span>${item.label}</span>${dynamicBadge(item.id) ? `<span class="nav-badge">${dynamicBadge(item.id)}</span>` : ''}
            </button>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-footer-top">
            <div class="tiny-avatar">${userInitials}</div>
            <div><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.role)} workspace</span></div>
          </div>
          <div class="demo-pill">Private data layer active</div>
        </div>
      </aside>
      <div class="mobile-overlay ${state.sidebarOpen ? 'open' : ''}" data-action="close-sidebar"></div>
      <main class="main-shell">
        <div class="topbar">
          <div class="global-search">
            ${icon('search')}
            <input id="global-search" type="search" placeholder="Search pages, guests, orders, stock…" aria-label="Global search" />
            <span class="shortcut">⌘ K</span>
          </div>
          <div class="topbar-right">
            <div class="date-chip">${icon('calendar')} ${todayLabel()}</div>
            <button class="icon-btn" data-action="notifications" aria-label="Notifications">${icon('bell')}<span class="notification-dot"></span></button>
            <button class="profile-button" data-action="profile-menu">
              <span class="tiny-avatar">${userInitials}</span>
              <span class="profile-copy"><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.role)}</span></span>
              ${icon('chevronDown', 'chevron')}
            </button>
          </div>
        </div>
        <div class="page-wrap">
          <div class="demo-banner">
            ${icon('sparkles')}
            <span><strong>Private operating workspace.</strong> ${isCloudHosted ? 'Orders, stock and guest data use the secured cloud data layer' : 'Orders, stock and guest data stay on this Mac'}; website requests arrive here as pending.</span>
            ${user.role === 'Owner' ? '<button data-action="reset-demo">Rebuild sample data</button>' : ''}
          </div>
          <div id="page-content">${renderPage()}</div>
        </div>
      </main>
    </div>`;
}

function renderPage() {
  if (loading) return `<div class="empty-state"><div><div class="empty-icon">${icon('database')}</div><h3>Loading your CRM</h3><p>Connecting to the local Mangosteen database…</p></div></div>`;
  if (dataError) return `<div class="empty-state"><div><div class="empty-icon">${icon('alert')}</div><h3>Local server unavailable</h3><p>${escapeHtml(dataError)} Start the CRM with <strong>./run-local.sh</strong>, then try again.</p><button class="btn btn-primary" style="margin-top:14px" data-action="retry-data">${icon('refresh')} Retry</button></div></div>`;
  const pages = {
    dashboard: renderDashboard,
    orders: renderOrders,
    kitchen: renderKitchen,
    floor: renderFloor,
    billing: renderBilling,
    stock: renderStock,
    expenses: renderExpenses,
    vendors: renderVendors,
    staff: renderStaff,
    customers: renderCustomers,
    reservations: renderReservations,
    loyalty: renderLoyalty,
    feedback: renderFeedback,
    reports: renderReports,
    settings: renderSettings,
  };
  return (pages[state.page] || pages.dashboard)();
}

function statCard({ iconName, value, label, trend, accent, soft, glow, down = false }) {
  return `
    <article class="stat-card" style="--accent:${accent};--soft:${soft};--glow:${glow}">
      <div class="stat-top">
        <span class="stat-icon">${icon(iconName)}</span>
        <span class="trend ${down ? 'down' : ''}">${icon(down ? 'arrowDown' : 'arrowUp')} ${trend}</span>
      </div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </article>`;
}

function lineChart(values = [], labels = [], accessibleLabel = 'CRM trend over twelve months') {
  if (!values.length) return `<div class="empty-state"><div><h3>No trend data yet</h3><p>Trend charts will appear as monthly activity is recorded.</p></div></div>`;
  const width = 680;
  const height = 150;
  const top = 10;
  const bottom = 26;
  const max = Math.max(...values, 1) * 1.15;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : 12 + index * ((width - 24) / (values.length - 1));
    const y = top + (height - top - bottom) * (1 - value / max);
    return { x, y, value };
  });
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${points.at(-1).x} ${height - bottom} L ${points[0].x} ${height - bottom} Z`;
  return `
    <svg class="line-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${escapeHtml(accessibleLabel)}">
      <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b5623d" stop-opacity=".24"/><stop offset="100%" stop-color="#b5623d" stop-opacity="0"/></linearGradient></defs>
      ${[25, 55, 85, 115].map((y) => `<line class="chart-grid-line" x1="12" x2="668" y1="${y}" y2="${y}"/>`).join('')}
      <path class="chart-area" d="${area}"/><path class="chart-line" d="${path}"/>
      ${points.map((point) => `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="3"/>`).join('')}
      ${labels.map((label, index) => `<text class="chart-label" x="${points[index].x}" y="145" text-anchor="middle">${label}</text>`).join('')}
    </svg>`;
}

function renderDashboard() {
  const analytics = calculateAnalytics();
  const operations = calculateOperations();
  const metrics = data.monthlyMetrics || [];
  const chartValues = metrics.map((item) => item.returningVisits);
  const chartLabels = metrics.map((item) => new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(`${item.month}-01T12:00:00`)));
  const returningTotal = chartValues.reduce((sum, value) => sum + Number(value || 0), 0);
  const previous = chartValues.at(-2) || 0;
  const latest = chartValues.at(-1) || 0;
  const chartChange = previous ? (latest - previous) / previous * 100 : 0;
  const todayReservations = analytics.todayReservations.slice().sort((a, b) => a.time.localeCompare(b.time));
  const activityStyles = {
    customer: ['userPlus', '#f7ece6', '#9a4f32'], reward: ['gift', '#eef0e8', '#596b55'],
    reservation: ['calendar', '#f7efe1', '#8c642e'], feedback: ['star', '#f7ece6', '#b5623d'],
    alert: ['alert', '#f9e9e7', '#b94e4b'],
  };
  const slots = [
    { label: '4:00–6:00 PM', min: '16:00', max: '18:00', color: '#b5623d' },
    { label: '6:00–8:00 PM', min: '18:00', max: '20:00', color: '#b99258' },
    { label: '8:00–10:00 PM', min: '20:00', max: '22:00', color: '#596b55' },
  ].map((slot) => ({ ...slot, value: Math.min(100, todayReservations.filter((item) => item.time >= slot.min && item.time < slot.max).reduce((sum, item) => sum + item.guests, 0) / 25 * 100) }));
  const reservationActions = data.user?.role === 'Host'
    ? `<button class="btn" data-action="export-report">${icon('download')} Export</button><button class="btn btn-primary" data-action="add-reservation">${icon('plus')} New reservation</button>`
    : `<button class="btn" data-page="billing">${icon('wallet')} Day closing</button><button class="btn btn-primary" data-action="new-order">${icon('plus')} New order</button>`;
  return `
    ${pageHeader('Live operations', `Good afternoon, ${escapeHtml((data.user?.name || 'there').split(' ')[0])}`, 'Sales, orders, stock and guest service—together in one premium workspace.', reservationActions)}
    <section class="stat-grid">
      ${statCard({ iconName: 'wallet', value: inr(operations.todaySales), label: 'Sales today', trend: `${operations.todayPaymentCount} paid orders`, accent: '#173f35', soft: '#e8f1ed', glow: 'rgba(23,63,53,.11)' })}
      ${statCard({ iconName: 'coffee', value: operations.activeOrders.length.toString(), label: 'Active orders', trend: `${operations.kitchenOrders.length} in kitchen`, accent: '#a96d2d', soft: '#fbf1e5', glow: 'rgba(169,109,45,.12)' })}
      ${statCard({ iconName: 'rupee', value: inr(operations.todayProfit), label: 'Profit today', trend: `${inr(operations.todayExpenseTotal)} expenses`, accent: '#65533f', soft: '#f4efe8', glow: 'rgba(101,83,63,.11)', down: operations.todayProfit < 0 })}
      ${statCard({ iconName: 'alert', value: operations.lowStock.length.toString(), label: 'Low-stock ingredients', trend: operations.lowStock.length ? 'Review inventory' : 'Stock healthy', accent: '#8f4f43', soft: '#f8ebe7', glow: 'rgba(143,79,67,.11)', down: operations.lowStock.length > 0 })}
    </section>
    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-header">
          <div class="panel-title"><h2>Customer return trend</h2><p>Monthly returning guests</p></div>
          <div class="segment-control" data-segment><button>7 days</button><button>30 days</button><button class="active">12 months</button></div>
        </div>
        <div class="panel-body chart-wrap">
          <div class="chart-summary"><strong>${returningTotal.toLocaleString('en-IN')} returning visits</strong><span>${chartChange >= 0 ? '↑' : '↓'} ${Math.abs(chartChange).toFixed(1)}% from last month</span></div>
          ${lineChart(chartValues, chartLabels, 'Returning customer trend over twelve months')}
        </div>
      </article>
      <article class="panel">
        <div class="panel-header"><div class="panel-title"><h2>Live activity</h2><p>Across your guest experience</p></div><button class="btn btn-small btn-ghost" data-page="customers">View all</button></div>
        <div class="panel-body activity-list">${data.activities.slice(0, 5).map((item) => { const style = activityStyles[item.kind] || activityStyles.customer; return `<div class="activity-item"><span class="activity-icon" style="--soft:${style[1]};--accent:${style[2]}">${icon(style[0])}</span><div class="activity-copy"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.details)}</p></div><span class="activity-time">${relativeTime(item.createdAt)}</span></div>`; }).join('') || '<div class="empty-state"><p>No activity recorded yet.</p></div>'}</div>
      </article>
    </section>
    <section class="bottom-grid">
      <article class="panel">
        <div class="panel-header"><div class="panel-title"><h2>Today’s reservations</h2><p>Next guest arrivals</p></div><button class="btn btn-small btn-ghost" data-page="reservations">Open calendar</button></div>
        <div class="panel-body schedule-list">
          ${todayReservations.slice(0, 4).map((item) => `<div class="schedule-item"><div class="schedule-time">${displayTime(item.time)}</div><div class="schedule-copy"><strong>${escapeHtml(item.name)} · ${item.guests} guests</strong><p>${escapeHtml(item.occasion)} · ${escapeHtml(item.table)}</p></div>${statusPill(item.status)}</div>`).join('') || '<div class="empty-state"><p>No reservations today.</p></div>'}
        </div>
      </article>
      <article class="panel">
        <div class="panel-header"><div class="panel-title"><h2>Guest recovery</h2><p>Tasks needing attention</p></div><span class="status high">2 urgent</span></div>
        <div class="panel-body task-list">
          ${analytics.openTasks.slice(0, 3).map((task) => `<div class="task-item"><span class="activity-icon" style="--soft:${task.priority === 'High' ? '#f9e9e7' : '#f7efe1'};--accent:${task.priority === 'High' ? '#b94e4b' : '#8c642e'}">${icon(task.type === 'Reservation' ? 'cake' : 'alert')}</span><div class="task-copy"><strong>${escapeHtml(task.title)}</strong><p>${escapeHtml(task.details)}${task.dueAt ? ` · Due ${displayTime(task.dueAt)}` : ''}</p></div><button class="btn btn-small" data-action="complete-task" data-id="${task.id}">Resolve</button></div>`).join('') || '<div class="empty-state"><p>No open tasks. Nice work.</p></div>'}
        </div>
      </article>
      <article class="panel">
        <div class="panel-header"><div class="panel-title"><h2>Dining capacity</h2><p>Tonight’s booking load</p></div><span class="status active">Healthy</span></div>
        <div class="panel-body">
          ${slots.map((slot) => `<div class="capacity-row"><div class="capacity-top"><span>${slot.label}</span><strong>${slot.value.toFixed(0)}%</strong></div><div class="capacity-track"><div class="capacity-fill" style="width:${slot.value}%;--fill:${slot.color}"></div></div></div>`).join('')}
          <div style="margin-top:18px" class="rating-large"><strong>${analytics.feedbackAverage.toFixed(1)}</strong><div>${stars(Math.round(analytics.feedbackAverage))}<span>Based on ${data.feedback.length} connected responses</span></div></div>
        </div>
      </article>
    </section>`;
}

function orderItemsMarkup(order) {
  return `<div class="order-items">${order.items.map((item) => `<div><span>${item.quantity} × ${escapeHtml(item.name)}</span><strong>${inr(item.lineTotal)}</strong></div>`).join('')}</div>`;
}

function renderOrders() {
  const operations = calculateOperations();
  const orders = (data.orders || []).filter((order) => order.items.length);
  const serviceRequests = (data.serviceRequests || []).filter((request) => request.status === 'Open');
  const actions = `<button class="btn" data-page="kitchen">${icon('clock')} Kitchen display</button><button class="btn btn-primary" data-action="new-order">${icon('plus')} New table order</button>`;
  return `
    ${pageHeader('Point of sale', 'Orders & tables', 'Build a table order, send it to the kitchen, and follow every preparation stage.', actions)}
    ${serviceRequests.length ? `<section class="panel service-request-panel"><div class="panel-header"><div class="panel-title"><h2>Table service requests</h2><p>Requests submitted from table QR menus</p></div><span class="status pending">${serviceRequests.length} waiting</span></div><div class="panel-body bill-list">${serviceRequests.map((request) => `<div class="bill-row"><div><strong>${escapeHtml(request.tableLabel)} · ${request.type === 'bill' ? 'Bill requested' : 'Waiter requested'}</strong><span>${request.paymentPreference ? escapeHtml(request.paymentPreference) : relativeTime(request.createdAt) + ' ago'}</span></div><div><button class="btn btn-small btn-primary" data-action="acknowledge-service" data-id="${request.id}">${icon('check')} Acknowledge</button></div></div>`).join('')}</div></section>` : ''}
    <section class="ops-stat-grid">
      <article class="ops-stat"><span>Open tables</span><strong>${operations.activeOrders.length}</strong><small>Live service</small></article>
      <article class="ops-stat"><span>Kitchen queue</span><strong>${operations.kitchenOrders.length}</strong><small>Preparing or ready</small></article>
      <article class="ops-stat"><span>Paid today</span><strong>${inr(operations.todaySales)}</strong><small>${(data.payments || []).filter((item) => (item.createdAt || '').slice(0, 10) === localDateKey()).length} bills</small></article>
    </section>
    <div class="orders-grid">
      ${orders.map((order) => `<article class="order-card ${order.status.toLowerCase()}">
        <div class="order-card-head"><div><span class="eyebrow">Order #${String(order.id).padStart(3, '0')}</span><h3>${escapeHtml(order.table)}</h3></div>${statusPill(order.status)}</div>
        ${orderItemsMarkup(order)}
        <div class="order-total"><span>Total</span><strong>${inr(order.total)}</strong></div>
        <div class="order-meta"><span>${relativeTime(order.createdAt)} ago</span>${order.paymentMethod ? `<span>${escapeHtml(order.paymentMethod)}</span>` : ''}</div>
        ${order.status === 'Draft' ? `<button class="btn btn-primary btn-block" data-action="send-order" data-id="${order.id}">${icon('send')} Send to kitchen</button>` : ''}
        ${order.status === 'Ready' ? `${data.user?.role === 'Cashier' ? '' : `<button class="btn btn-block" data-action="mark-served" data-id="${order.id}">${icon('check')} Mark served</button>`}<button class="btn btn-primary btn-block" data-action="take-payment" data-id="${order.id}">${icon('wallet')} Take payment</button>` : ''}
        ${order.status === 'Served' ? `<button class="btn btn-primary btn-block" data-action="take-payment" data-id="${order.id}">${icon('wallet')} Take payment</button>` : ''}
      </article>`).join('') || '<div class="empty-state"><div><h3>No orders yet</h3><p>Create the first table order to begin service.</p></div></div>'}
    </div>`;
}

function renderKitchen() {
  const orders = (data.orders || []).filter((order) => ['Kitchen', 'Preparing', 'Ready'].includes(order.status));
  const columns = [
    ['Kitchen', 'New tickets', 'Waiting to begin'],
    ['Preparing', 'In preparation', 'Being made now'],
    ['Ready', 'Ready to serve', 'Collect at the pass'],
  ];
  return `
    ${pageHeader('Kitchen display system', 'Live kitchen queue', 'A focused preparation board with ticket timers and clear hand-off stages.', `<button class="btn" data-action="refresh-operations">${icon('refresh')} Refresh queue</button>`)}
    <div class="kds-board">
      ${columns.map(([status, title, subtitle]) => `<section class="kds-column ${status.toLowerCase()}">
        <div class="kds-column-head"><div><h2>${title}</h2><p>${subtitle}</p></div><span>${orders.filter((item) => item.status === status).length}</span></div>
        <div class="kds-stack">${orders.filter((item) => item.status === status).map((order) => `<article class="kds-card">
          <div class="kds-ticket-head"><div><span>Order #${String(order.id).padStart(3, '0')}</span><strong>${escapeHtml(order.table)}</strong></div><div class="kds-timer">${icon('clock')} ${relativeTime(order.sentAt || order.createdAt)}</div></div>
          <ul>${order.items.map((item) => `<li><strong>${item.quantity}×</strong> ${escapeHtml(item.name)}</li>`).join('')}</ul>
          ${status === 'Kitchen' ? `<button class="btn btn-primary btn-block" data-action="kitchen-start" data-id="${order.id}">Start preparing</button>` : ''}
          ${status === 'Preparing' ? `<button class="btn btn-primary btn-block" data-action="kitchen-ready" data-id="${order.id}">${icon('check')} Mark ready</button>` : ''}
          ${status === 'Ready' ? `<div class="ready-callout">${icon('checkCircle')} Waiting for floor staff</div>` : ''}
        </article>`).join('') || '<div class="kds-empty">No tickets</div>'}</div>
      </section>`).join('')}
    </div>`;
}

function renderFloor() {
  const readyOrders = (data.orders || []).filter((order) => order.status === 'Ready');
  const requests = (data.serviceRequests || []).filter((request) => request.status === 'Open');
  return `
    ${pageHeader('Floor service', 'Table handoff', 'Serve ready orders and respond to guest requests from one focused queue.', `<button class="btn" data-action="refresh-operations">${icon('refresh')} Refresh queue</button>`)}
    <section class="ops-stat-grid">
      <article class="ops-stat"><span>Ready to serve</span><strong>${readyOrders.length}</strong><small>Collect from the kitchen pass</small></article>
      <article class="ops-stat"><span>Waiter requests</span><strong>${requests.filter((item) => item.type === 'waiter').length}</strong><small>Guests need assistance</small></article>
      <article class="ops-stat"><span>Bill requests</span><strong>${requests.filter((item) => item.type === 'bill').length}</strong><small>Notify the cashier</small></article>
    </section>
    <div class="ops-grid two">
      <article class="panel"><div class="panel-header"><div class="panel-title"><h2>Ready orders</h2><p>Deliver these orders, then confirm service</p></div><span class="status active">${readyOrders.length} ready</span></div><div class="panel-body bill-list">
        ${readyOrders.map((order) => `<div class="bill-row"><div><strong>${escapeHtml(order.table)} · Order #${String(order.id).padStart(3, '0')}</strong><span>${order.items.map((item) => `${item.quantity}× ${escapeHtml(item.name)}`).join(', ')}</span></div><button class="btn btn-small btn-primary" data-action="mark-served" data-id="${order.id}">${icon('check')} Mark served</button></div>`).join('') || '<div class="empty-state compact"><p>No orders are waiting at the kitchen pass.</p></div>'}
      </div></article>
      <article class="panel"><div class="panel-header"><div class="panel-title"><h2>Guest requests</h2><p>Requests sent from table QR menus</p></div><span class="status pending">${requests.length} waiting</span></div><div class="panel-body bill-list">
        ${requests.map((request) => `<div class="bill-row"><div><strong>${escapeHtml(request.tableLabel)} · ${request.type === 'bill' ? 'Bill requested' : 'Waiter requested'}</strong><span>${request.type === 'bill' ? escapeHtml(request.paymentPreference || 'Payment preference not selected') : `${relativeTime(request.createdAt)} ago`}</span></div><button class="btn btn-small btn-primary" data-action="acknowledge-service" data-id="${request.id}">${icon('check')} Acknowledge</button></div>`).join('') || '<div class="empty-state compact"><p>No guest requests are waiting.</p></div>'}
      </div></article>
    </div>`;
}

function renderBilling() {
  const operations = calculateOperations();
  const unpaid = operations.unpaidOrders.filter((order) => order.status !== 'Draft');
  const billRequests = (data.serviceRequests || []).filter((request) => request.type === 'bill' && request.status === 'Open');
  const total = Math.max(1, operations.todaySales);
  return `
    ${pageHeader('Cashier workspace', 'Billing & day closing', 'Settle table bills and reconcile cash, UPI, and card totals before closing.', `<button class="btn btn-primary" data-action="new-order">${icon('plus')} New order</button>`)}
    ${billRequests.length ? `<section class="panel service-request-panel"><div class="panel-header"><div class="panel-title"><h2>Bill requests</h2><p>Guests waiting at their tables</p></div><span class="status pending">${billRequests.length} waiting</span></div><div class="panel-body bill-list">${billRequests.map((request) => `<div class="bill-row"><div><strong>${escapeHtml(request.tableLabel)}</strong><span>${escapeHtml(request.paymentPreference || 'Payment preference not selected')}</span></div><button class="btn btn-small btn-primary" data-action="acknowledge-service" data-id="${request.id}">${icon('check')} Acknowledge</button></div>`).join('')}</div></section>` : ''}
    <section class="payment-summary">
      <article><span>Today’s collection</span><strong>${inr(operations.todaySales)}</strong><small>${(data.payments || []).filter((item) => (item.createdAt || '').slice(0, 10) === localDateKey()).length} settled bills</small></article>
      ${['Cash', 'UPI', 'Card'].map((method) => `<article><span>${method}</span><strong>${inr(operations.paymentTotals[method])}</strong><div class="payment-bar"><i style="width:${Math.min(100, operations.paymentTotals[method] / total * 100)}%"></i></div></article>`).join('')}
    </section>
    <div class="ops-grid two">
      <article class="panel"><div class="panel-header"><div class="panel-title"><h2>Open bills</h2><p>Ready and in-service tables</p></div><span class="status active">${unpaid.length} open</span></div><div class="panel-body bill-list">
        ${unpaid.map((order) => `<div class="bill-row"><div><strong>${escapeHtml(order.table)} · #${String(order.id).padStart(3, '0')}</strong><span>${order.items.map((item) => `${item.quantity}× ${escapeHtml(item.name)}`).join(', ')}</span></div><div><strong>${inr(order.total)}</strong><button class="btn btn-small btn-primary" data-action="take-payment" data-id="${order.id}">Collect</button></div></div>`).join('') || '<div class="empty-state compact"><p>All current bills are settled.</p></div>'}
      </div></article>
      <article class="panel"><div class="panel-header"><div class="panel-title"><h2>Day closing</h2><p>${todayLabel()}</p></div>${statusPill('Live')}</div><div class="panel-body closing-list">
        <div><span>Gross sales</span><strong>${inr(operations.todaySales)}</strong></div><div><span>Operating expenses</span><strong>− ${inr(operations.todayExpenseTotal)}</strong></div><div class="closing-total"><span>Net operating result</span><strong>${inr(operations.todayProfit)}</strong></div><p class="form-notice">Payment totals are calculated from settled bills in the local database. Verify the physical cash drawer before final close.</p>
      </div></article>
    </div>`;
}

function renderStock() {
  const operations = calculateOperations();
  return `
    ${pageHeader('Stock control', 'Inventory', 'Recipe-linked stock is deducted automatically when an order reaches the kitchen.', `<button class="btn" data-action="refresh-operations">${icon('refresh')} Refresh stock</button>`)}
    ${operations.lowStock.length ? `<div class="stock-alert">${icon('alert')}<div><strong>${operations.lowStock.length} ingredient${operations.lowStock.length === 1 ? '' : 's'} need attention</strong><span>${operations.lowStock.map((item) => item.name).join(', ')}</span></div></div>` : ''}
    <article class="panel"><div class="panel-header"><div class="panel-title"><h2>Ingredient ledger</h2><p>Current balance and reorder threshold</p></div><span class="status active">${data.inventory.length} ingredients</span></div><div class="panel-body stock-list">
      ${(data.inventory || []).map((item) => { const max = Math.max(item.quantity, item.reorderLevel * 2, 1); const width = Math.min(100, item.quantity / max * 100); return `<div class="stock-row ${item.low ? 'low' : ''}"><div class="stock-copy"><strong>${escapeHtml(item.name)}</strong><span>Reorder at ${item.reorderLevel} ${escapeHtml(item.unit)}</span></div><div class="stock-quantity"><strong>${Number(item.quantity).toLocaleString('en-IN')} ${escapeHtml(item.unit)}</strong><div class="stock-meter"><i style="width:${width}%"></i></div></div><div>${item.low ? statusPill('Low') : statusPill('Healthy')}<button class="btn btn-small" data-action="adjust-stock" data-id="${item.id}">Adjust</button></div></div>`; }).join('')}
    </div></article>`;
}

function renderExpenses() {
  const operations = calculateOperations();
  const categories = Object.entries(operations.categoryExpenses).sort((a, b) => b[1] - a[1]);
  return `
    ${pageHeader('Cost control', 'Expenses', 'Record daily costs by category and see their direct effect on actual profit.', `<button class="btn btn-primary" data-action="add-expense">${icon('plus')} Add expense</button>`)}
    <section class="ops-stat-grid"><article class="ops-stat"><span>Today</span><strong>${inr(operations.todayExpenseTotal)}</strong><small>Recorded costs</small></article><article class="ops-stat"><span>This month</span><strong>${inr(operations.monthExpenseTotal)}</strong><small>${data.expenses.length} entries stored</small></article><article class="ops-stat"><span>Actual monthly profit</span><strong>${inr(operations.monthProfit)}</strong><small>Sales less expenses</small></article></section>
    <div class="ops-grid two"><article class="panel"><div class="panel-header"><div class="panel-title"><h2>Expense ledger</h2><p>Newest entry first</p></div></div><div class="panel-body expense-list">${(data.expenses || []).map((item) => `<div class="expense-row"><span class="activity-icon">${icon(item.category === 'Rent' ? 'building' : 'rupee')}</span><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.category)} · ${displayDate(item.date)}${item.note ? ` · ${escapeHtml(item.note)}` : ''}</span></div><strong>${inr(item.amount)}</strong></div>`).join('')}</div></article><article class="panel"><div class="panel-header"><div class="panel-title"><h2>Monthly cost mix</h2><p>Where the money is going</p></div></div><div class="panel-body category-list">${categories.map(([category, amount]) => `<div><span>${escapeHtml(category)}</span><strong>${inr(amount)}</strong><div class="progress-track"><i class="progress-fill" style="width:${operations.monthExpenseTotal ? amount / operations.monthExpenseTotal * 100 : 0}%;--fill:#a96d2d"></i></div></div>`).join('') || '<div class="empty-state compact"><p>No expenses this month.</p></div>'}</div></article></div>`;
}

function renderVendors() {
  const operations = calculateOperations();
  return `
    ${pageHeader('Supplier management', 'Vendors', 'Track supplier contacts, materials, outstanding balances, and payments.', `<button class="btn btn-primary" data-action="add-vendor">${icon('plus')} Add vendor</button>`)}
    <section class="ops-stat-grid"><article class="ops-stat"><span>Active vendors</span><strong>${data.vendors.length}</strong><small>Supplier directory</small></article><article class="ops-stat"><span>Outstanding</span><strong>${inr(operations.vendorDue)}</strong><small>Combined balances</small></article><article class="ops-stat"><span>Paid accounts</span><strong>${data.vendors.filter((item) => item.status === 'Paid').length}</strong><small>Nothing due</small></article></section>
    <div class="vendor-grid">${(data.vendors || []).map((vendor) => `<article class="vendor-card"><div class="vendor-icon">${icon('building')}</div><div class="vendor-head"><div><h3>${escapeHtml(vendor.name)}</h3><p>${escapeHtml(vendor.supplies || 'General supplier')}</p></div>${statusPill(vendor.status)}</div><div class="vendor-details"><div><span>Phone</span><strong>${escapeHtml(vendor.phone || 'Not added')}</strong></div><div><span>Balance</span><strong>${inr(vendor.balance)}</strong></div></div>${vendor.balance > 0 ? `<button class="btn btn-primary btn-block" data-action="pay-vendor" data-id="${vendor.id}">${icon('wallet')} Record payment</button>` : '<div class="paid-note">Account is fully settled</div>'}</article>`).join('')}</div>`;
}

function renderStaff() {
  const operations = calculateOperations();
  return `
    ${pageHeader('People operations', 'Staff & attendance', 'Manage shifts, attendance, job responsibilities, and monthly salary commitments.', `<button class="btn btn-primary" data-action="add-operation-staff">${icon('userPlus')} Add staff</button>`)}
    <section class="ops-stat-grid"><article class="ops-stat"><span>On duty today</span><strong>${operations.presentStaff}</strong><small>Present or late</small></article><article class="ops-stat"><span>Team members</span><strong>${data.staff.length}</strong><small>Active roster</small></article><article class="ops-stat"><span>Monthly payroll</span><strong>${inr(operations.payroll)}</strong><small>Salary commitment</small></article></section>
    <article class="panel"><div class="panel-header"><div class="panel-title"><h2>Today’s roster</h2><p>${todayLabel()} attendance</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Team member</th><th>Role</th><th>Shift</th><th>Salary</th><th>Attendance</th><th></th></tr></thead><tbody>${(data.staff || []).map((member) => `<tr><td><div class="customer-cell"><span class="avatar" style="--avatar:#173f35">${initials(member.name)}</span><div><strong>${escapeHtml(member.name)}</strong><span>${member.attendance?.checkIn ? `Checked in ${displayTime(member.attendance.checkIn)}` : 'No check-in recorded'}</span></div></div></td><td>${escapeHtml(member.jobRole)}</td><td>${displayTime(member.shiftStart)}–${displayTime(member.shiftEnd)}</td><td>${inr(member.salary)}</td><td>${statusPill(member.attendance?.status || 'Unmarked')}</td><td><button class="btn btn-small" data-action="mark-attendance" data-id="${member.id}">Update</button></td></tr>`).join('')}</tbody></table></div></article>`;
}

function renderCustomerRows(customers) {
  return customers.map((customer) => `
    <tr data-customer-row data-search="${escapeHtml(`${customer.name} ${customer.phone} ${customer.email} ${customer.tags.join(' ')}`.toLowerCase())}" data-tier="${customer.tier}" data-action="view-customer" data-id="${customer.id}">
      <td><div class="customer-cell"><span class="avatar" style="--avatar:${customer.avatar}">${initials(customer.name)}</span><div><strong>${escapeHtml(customer.name)}</strong><span>${escapeHtml(customer.phone)}</span></div></div></td>
      <td>${escapeHtml(customer.email)}</td>
      <td><span class="tier ${customer.tier.toLowerCase()}">${customer.tier}</span></td>
      <td>${customer.visits}</td>
      <td><strong style="color:var(--ink)">${inr(customer.spend)}</strong></td>
      <td>${displayDate(customer.lastVisit)}</td>
      <td><div class="tags">${customer.tags.slice(0, 2).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div></td>
      <td><button class="icon-btn" style="width:30px;height:30px" data-action="view-customer" data-id="${customer.id}" aria-label="View ${escapeHtml(customer.name)}">${icon('more')}</button></td>
    </tr>`).join('');
}

function renderCustomers() {
  const analytics = calculateAnalytics();
  const newThisMonth = data.customers.filter((item) => item.createdAt?.slice(0, 7) === localDateKey().slice(0, 7)).length;
  const actions = `<button class="btn" data-action="import-customers">${icon('download')} Import CSV</button><button class="btn btn-primary" data-action="add-customer">${icon('plus')} Add customer</button>`;
  return `
    ${pageHeader('Guest relationships', 'Customers', 'A single view of every guest, their preferences, visits, loyalty and communication consent.', actions)}
    <div class="mini-stats">
      <div class="mini-stat"><span>Total customers</span><strong>${analytics.totalCustomers.toLocaleString('en-IN')}</strong></div>
      <div class="mini-stat"><span>New this month</span><strong>+${newThisMonth}</strong></div>
      <div class="mini-stat"><span>Active loyalty members</span><strong>${analytics.activeMembers.toLocaleString('en-IN')}</strong></div>
      <div class="mini-stat"><span>Marketing opt-in</span><strong>${analytics.optInRate.toFixed(1)}%</strong></div>
    </div>
    <div class="toolbar">
      <div class="toolbar-search">${icon('search')}<input id="customer-search" value="${escapeHtml(state.customerQuery)}" placeholder="Search name, phone, email or tag" /></div>
      <select id="customer-tier" aria-label="Filter by tier"><option>All tiers</option><option>Platinum</option><option>Gold</option><option>Silver</option><option>Member</option></select>
      <select aria-label="Filter by activity"><option>All activity</option><option>Visited this month</option><option>At risk</option><option>Birthday soon</option></select>
      <button class="btn">${icon('filter')} More filters</button>
    </div>
    <article class="panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Customer</th><th>Email</th><th>Tier</th><th>Visits</th><th>Lifetime value</th><th>Last visit</th><th>Segments</th><th></th></tr></thead>
          <tbody id="customer-table-body">${renderCustomerRows(data.customers)}</tbody>
        </table>
      </div>
      <div class="table-footer"><span id="customer-count">Showing all ${data.customers.length} stored customer${data.customers.length === 1 ? '' : 's'}</span><div><span class="status active">SQLite synced</span></div></div>
    </article>`;
}

function renderReservations() {
  const analytics = calculateAnalytics();
  const actions = `<button class="btn">${icon('table')} Floor plan</button><button class="btn btn-primary" data-action="add-reservation">${icon('plus')} New reservation</button>`;
  const base = new Date();
  const days = Array.from({ length: 5 }, (_, index) => {
    const value = new Date(base);
    value.setDate(base.getDate() + index - 1);
    return { key: localDateKey(value), weekday: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(value), label: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(value) };
  });
  const times = ['16:00', '17:00', '18:00', '19:00', '20:00'];
  const eventColors = { Confirmed: ['#39735a', '#eaf3ed'], Pending: ['#8c642e', '#f7efe1'], Completed: ['#b5623d', '#f7ece6'], 'No-show': ['#b94e4b', '#f9e9e7'] };
  let calendar = `<div class="calendar-head"></div>${days.map((day) => `<div class="calendar-head">${day.weekday}<span>${day.label}</span></div>`).join('')}`;
  times.forEach((time) => {
    calendar += `<div class="calendar-time">${displayTime(time)}</div>`;
    days.forEach((day) => {
      const event = data.reservations.find((item) => item.date === day.key && item.time.slice(0, 2) === time.slice(0, 2));
      const colors = eventColors[event?.status] || eventColors.Confirmed;
      calendar += `<div class="calendar-cell">${event ? `<div class="calendar-event" style="--accent:${colors[0]};--soft:${colors[1]}" data-action="reservation-detail" data-id="${event.id}"><strong>${escapeHtml(event.name)} · ${event.guests}</strong><span>${escapeHtml(event.occasion)} · ${escapeHtml(event.table)}</span></div>` : ''}</div>`;
    });
  });
  const todayArrivals = analytics.todayReservations.slice().sort((a, b) => a.time.localeCompare(b.time));
  const startLabel = days[0].label;
  const endLabel = days.at(-1).label;
  return `
    ${pageHeader('Bookings & celebrations', 'Reservations', 'Plan every arrival, table and special occasion from one calm, coordinated view.', actions)}
    <div class="mini-stats">
      <div class="mini-stat"><span>Today’s reservations</span><strong>${analytics.todayReservations.length}</strong></div>
      <div class="mini-stat"><span>Expected guests</span><strong>${analytics.todayGuests}</strong></div>
      <div class="mini-stat"><span>Booked capacity</span><strong>${analytics.bookedCapacity.toFixed(0)}%</strong></div>
      <div class="mini-stat"><span>No-show rate</span><strong>${analytics.noShowRate.toFixed(1)}%</strong></div>
    </div>
    <div class="toolbar">
      <div class="segment-control" data-segment><button class="active">Calendar</button><button>List</button></div>
      <button class="btn">${icon('calendar')} ${startLabel}–${endLabel}</button>
      <select aria-label="Filter reservation status"><option>All statuses</option><option>Confirmed</option><option>Pending</option><option>No-show</option></select>
      <div style="margin-left:auto" class="row-actions"><button class="icon-btn">${icon('chevronDown')}</button><button class="btn btn-small">Today</button><button class="icon-btn">${icon('chevron')}</button></div>
    </div>
    <div class="calendar-shell">
      <article class="panel"><div class="calendar-grid">${calendar}</div></article>
      <article class="panel">
        <div class="panel-header"><div class="panel-title"><h2>Next arrivals</h2><p>${new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())}</p></div></div>
        <div class="panel-body">
          ${todayArrivals.map((item) => `<div class="upcoming-card"><div class="time-box">${displayTime(item.time).replace(' ', '<br>')}</div><div style="min-width:0;flex:1"><strong>${escapeHtml(item.name)}</strong><p>${item.guests} guests · ${escapeHtml(item.table)} · ${escapeHtml(item.occasion)}</p></div>${statusPill(item.status)}</div>`).join('') || '<div class="empty-state"><p>No arrivals scheduled today.</p></div>'}
        </div>
      </article>
    </div>`;
}

function renderLoyalty() {
  const analytics = calculateAnalytics();
  const featured = data.customers.slice().sort((a, b) => b.points - a.points)[0] || { name: 'No member yet', tier: 'Member', points: 0 };
  const settings = data.settings || {};
  const tierRules = [
    ['Platinum', `${inr(settings.tier_platinum || 35000)} lifetime spend · 2× points`, '#f7ece6', '#b5623d', 'award'],
    ['Gold', `${inr(settings.tier_gold || 18000)} lifetime spend · 1.5× points`, '#f7efe1', '#8c642e', 'award'],
    ['Silver', `${inr(settings.tier_silver || 8000)} lifetime spend · 1.2× points`, '#eef1f2', '#637077', 'award'],
    ['Member', 'Joined the Circle · 1× points', '#eef0e8', '#596b55', 'users'],
  ];
  const actions = `<button class="btn" data-action="adjust-points">${icon('edit')} Adjust points</button><button class="btn btn-primary" data-action="new-reward">${icon('plus')} Create reward</button>`;
  return `
    ${pageHeader('Retention program', 'Loyalty & rewards', 'Turn visits into relationships with transparent points, meaningful tiers and memorable rewards.', actions)}
    <div class="mini-stats">
      <div class="mini-stat"><span>Active members</span><strong>${analytics.activeMembers}</strong></div>
      <div class="mini-stat"><span>Current points balance</span><strong>${analytics.totalPoints.toLocaleString('en-IN')}</strong></div>
      <div class="mini-stat"><span>Rewards redeemed</span><strong>${analytics.totalRewardRedemptions.toLocaleString('en-IN')}</strong></div>
      <div class="mini-stat"><span>Repeat rate for members</span><strong>${analytics.returningRate.toFixed(0)}%</strong></div>
    </div>
    <section class="loyalty-hero">
      <article class="loyalty-card-preview">
        <div class="loyalty-brand"><span>Mangosteen Circle</span><span class="loyalty-chip"></span></div>
        <h3>${escapeHtml(featured.name)}</h3><p>${escapeHtml(featured.tier)} member · ${featured.visits || 0} recorded visits</p>
        <div class="loyalty-card-bottom"><div><span>Available points</span><strong>${Number(featured.points || 0).toLocaleString('en-IN')} points</strong></div><div class="qr-demo" aria-label="Demo QR code"></div></div>
      </article>
      <article class="panel">
        <div class="panel-header"><div class="panel-title"><h2>Membership tiers</h2><p>Configurable spend thresholds</p></div><button class="btn btn-small btn-ghost" data-action="edit-tiers">Edit rules</button></div>
        <div class="panel-body tier-list">
          ${tierRules.map(([tier, rule, soft, accent, iconName]) => `<div class="tier-row"><span class="tier-medal" style="--soft:${soft};--accent:${accent}">${icon(iconName)}</span><div><strong>${tier}</strong><p>${rule}</p></div><div class="tier-count"><strong>${data.customers.filter((item) => item.tier === tier).length}</strong><p>members</p></div></div>`).join('')}
        </div>
      </article>
    </section>
    <article class="panel">
      <div class="panel-header"><div class="panel-title"><h2>Reward catalogue</h2><p>Live and upcoming member benefits</p></div><button class="btn btn-small">View redemptions</button></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Reward</th><th>Cost</th><th>Eligibility</th><th>Redemptions</th><th>Expiry</th><th>Status</th><th></th></tr></thead><tbody>
        ${data.rewards.map((reward, index) => `<tr><td><div class="customer-cell"><span class="activity-icon" style="--soft:${index % 2 ? '#eef0e8' : '#f7ece6'};--accent:${index % 2 ? '#596b55' : '#b5623d'}">${icon(index % 2 ? 'coffee' : 'gift')}</span><div><strong>${escapeHtml(reward.name)}</strong><span>${escapeHtml(reward.description)}</span></div></div></td><td><strong>${reward.points ? `${reward.points.toLocaleString('en-IN')} points` : 'Complimentary'}</strong></td><td>${escapeHtml(reward.eligibility)}</td><td>${reward.redemptions}</td><td>${escapeHtml(reward.expiry)}</td><td>${statusPill(reward.status)}</td><td><button class="icon-btn" style="width:30px;height:30px">${icon('more')}</button></td></tr>`).join('') || '<tr><td colspan="7">No rewards created yet.</td></tr>'}
      </tbody></table></div>
    </article>`;
}

function renderFeedback() {
  const analytics = calculateAnalytics();
  const currentMonth = localDateKey().slice(0, 7);
  const responsesThisMonth = data.feedback.filter((item) => item.createdAt?.slice(0, 7) === currentMonth).length;
  const resolved = data.feedback.filter((item) => item.status === 'Resolved').length;
  const responseRate = data.feedback.length ? resolved / data.feedback.length * 100 : 0;
  const actions = `<button class="btn" data-action="export-feedback">${icon('download')} Export</button><button class="btn btn-primary" data-action="create-qr">${icon('plus')} Create feedback link</button>`;
  return `
    ${pageHeader('Guest voice', 'Feedback & recovery', 'Bring private feedback and public reviews together, then turn service issues into resolved relationships.', actions)}
    <div class="mini-stats">
      <div class="mini-stat"><span>Average rating</span><strong>${analytics.feedbackAverage.toFixed(1)}</strong></div>
      <div class="mini-stat"><span>Responses this month</span><strong>${responsesThisMonth}</strong></div>
      <div class="mini-stat"><span>Cases resolved</span><strong>${responseRate.toFixed(0)}%</strong></div>
      <div class="mini-stat"><span>Open recovery cases</span><strong>${analytics.openFeedback}</strong></div>
    </div>
    <div class="feedback-layout">
      <article class="panel">
        <div class="panel-header"><div class="panel-title"><h2>Recent guest feedback</h2><p>QR forms and connected public reviews</p></div><div class="segment-control" data-segment><button class="active">All</button><button>Needs action</button><button>5 star</button></div></div>
        <div class="panel-body">
          ${data.feedback.map((item) => `
            <div class="feedback-card">
              <div class="feedback-top"><span class="avatar" style="--avatar:${item.avatar}">${initials(item.name)}</span><div class="feedback-top-copy"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.source)} · ${relativeTime(item.createdAt)} ago</span></div>${stars(item.rating)}${statusPill(item.status)}</div>
              <blockquote>“${item.text}”</blockquote>
              <div class="feedback-actions"><button class="btn btn-small" data-action="reply-feedback" data-id="${item.id}">${icon('reply')} Reply</button>${item.status === 'Unresolved' ? `<button class="btn btn-small btn-primary" data-action="resolve-feedback" data-id="${item.id}">${icon('check')} Create recovery task</button>` : ''}</div>
            </div>`).join('')}
        </div>
      </article>
      <div>
        <article class="panel" style="margin-bottom:16px">
          <div class="panel-header"><div class="panel-title"><h2>Rating breakdown</h2><p>Last 90 days</p></div></div>
          <div class="panel-body"><div class="rating-large"><strong>${analytics.feedbackAverage.toFixed(1)}</strong><div>${stars(Math.round(analytics.feedbackAverage))}<span>${data.feedback.length} connected responses</span></div></div><div class="rating-bars">
            ${analytics.ratingCounts.map(({ rating, count }) => { const value = data.feedback.length ? count / data.feedback.length * 100 : 0; return `<div class="rating-bar"><span>${rating} ★</span><div class="progress-track"><div class="progress-fill" style="width:${value}%;--fill:${rating > 3 ? '#39735a' : rating === 3 ? '#b99258' : '#b94e4b'}"></div></div><strong>${value.toFixed(0)}%</strong></div>`; }).join('')}
          </div></div>
        </article>
        <article class="panel">
          <div class="panel-header"><div class="panel-title"><h2>Guest insights</h2><p>Common themes from feedback</p></div>${statusPill('Active')}</div>
          <div class="panel-body">
            <div class="insight-card"><div class="insight-top"><strong>Ambience & atmosphere</strong><span class="trend">↑ 18%</span></div><p>Mentioned positively in 42% of reviews this month.</p></div>
            <div class="insight-card"><div class="insight-top"><strong>Coffee quality</strong><span class="trend">↑ 11%</span></div><p>Cold brew and hazelnut coffee are leading positive themes.</p></div>
            <div class="insight-card"><div class="insight-top"><strong>Lunch service time</strong><span class="trend down">Needs attention</span></div><p>Six comments mention delays between 1:00 and 2:30 PM.</p></div>
          </div>
        </article>
      </div>
    </div>`;
}

function renderReports() {
  const analytics = calculateAnalytics();
  const operations = calculateOperations();
  const metrics = data.monthlyMetrics || [];
  const revenueValues = metrics.map((item) => Number(item.revenue || 0));
  const labels = metrics.map((item) => new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(`${item.month}-01T12:00:00`)));
  const tierColors = { Member: '#b5623d', Silver: '#8a7b70', Gold: '#b99258', Platinum: '#c6b49b' };
  const tierMix = ['Member', 'Silver', 'Gold', 'Platinum'].map((tier) => ({ tier, count: data.customers.filter((item) => item.tier === tier).length }));
  let cursor = 0;
  const stops = tierMix.map((item) => { const start = cursor; cursor += analytics.totalCustomers ? item.count / analytics.totalCustomers * 100 : 0; return `${tierColors[item.tier]} ${start.toFixed(1)}% ${cursor.toFixed(1)}%`; }).join(', ');
  const completed = data.reservations.filter((item) => item.status === 'Completed').length;
  const concluded = data.reservations.filter((item) => ['Completed', 'No-show'].includes(item.status)).length;
  const completedRate = concluded ? completed / concluded * 100 : 0;
  const resolvedFeedback = data.feedback.filter((item) => item.status === 'Resolved').length;
  const recoveryRate = data.feedback.length ? resolvedFeedback / data.feedback.length * 100 : 0;
  const actions = `<button class="btn">${icon('calendar')} Live database</button><button class="btn btn-primary" data-action="export-report">${icon('download')} Export report</button>`;
  return `
    ${pageHeader('Performance intelligence', 'Reports & insights', 'See sales, true profit, product demand, operating costs, and guest relationships together.', actions)}
    <section class="ops-stat-grid report-highlight-grid">
      <article class="ops-stat featured"><span>Monthly sales</span><strong>${inr(operations.monthSales)}</strong><small>Settled order revenue</small></article>
      <article class="ops-stat"><span>Monthly expenses</span><strong>${inr(operations.monthExpenseTotal)}</strong><small>All recorded costs</small></article>
      <article class="ops-stat"><span>Actual profit</span><strong>${inr(operations.monthProfit)}</strong><small>Sales minus expenses</small></article>
      <article class="ops-stat"><span>Top-selling item</span><strong>${escapeHtml(operations.topItem.name)}</strong><small>${operations.topItem.quantity} units sold</small></article>
    </section>
    <section class="stat-grid">
      ${statCard({ iconName: 'rupee', value: inr(analytics.lifetimeRevenue), label: 'Customer lifetime revenue', trend: `${inr(analytics.monthRevenue)} this month`, accent: '#5d4a3f', soft: '#f3ece3', glow: 'rgba(93,74,63,.10)' })}
      ${statCard({ iconName: 'users', value: `${analytics.returningRate.toFixed(0)}%`, label: 'Returning customer rate', trend: `${analytics.returningCustomers} customers`, accent: '#b5623d', soft: '#f7ece6', glow: 'rgba(181,98,61,.11)' })}
      ${statCard({ iconName: 'wallet', value: inr(analytics.averageSpend), label: 'Average known-guest spend', trend: `${analytics.totalCustomers} profiles`, accent: '#8c642e', soft: '#f7efe1', glow: 'rgba(185,146,88,.13)' })}
      ${statCard({ iconName: 'star', value: analytics.feedbackAverage.toFixed(1), label: 'Average guest rating', trend: `${data.feedback.length} responses`, accent: '#596b55', soft: '#eef0e8', glow: 'rgba(89,107,85,.11)' })}
    </section>
    <div class="report-layout">
      <article class="panel">
        <div class="panel-header"><div class="panel-title"><h2>Customer-linked revenue</h2><p>Monthly reporting snapshots</p></div><div class="segment-control" data-segment><button>Visits</button><button class="active">Revenue</button></div></div>
        <div class="panel-body chart-wrap"><div class="chart-summary"><strong>${inr(revenueValues.at(-1) || 0)}</strong><span>Latest stored month</span></div>${lineChart(revenueValues, labels, 'Monthly customer-linked revenue')}</div>
      </article>
      <article class="panel">
        <div class="panel-header"><div class="panel-title"><h2>Customer mix</h2><p>By loyalty tier</p></div></div>
        <div class="panel-body"><div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops || '#dfe5e1 0 100%'})"><div class="donut-center"><strong>${analytics.totalCustomers}</strong><span>members</span></div></div><div class="legend">${tierMix.map((item) => `<div class="legend-item"><span class="legend-dot" style="--dot:${tierColors[item.tier]}"></span><span>${item.tier}</span><strong>${analytics.totalCustomers ? (item.count / analytics.totalCustomers * 100).toFixed(0) : 0}%</strong></div>`).join('')}</div></div></div>
      </article>
    </div>
    <section class="report-cards" style="margin-top:16px">
      <article class="report-card"><div class="report-card-top"><h3>Guest retention</h3><span class="activity-icon">${icon('users')}</span></div><p>Customers with two or more visits</p><div class="report-number">${analytics.returningRate.toFixed(1)}%</div><div class="progress-track"><div class="progress-fill" style="width:${analytics.returningRate}%;--fill:#39735a"></div></div><p class="report-note">${analytics.returningCustomers} returning customers</p></article>
      <article class="report-card"><div class="report-card-top"><h3>Loyalty engagement</h3><span class="activity-icon" style="--soft:#f7ece6;--accent:#b5623d">${icon('gift')}</span></div><p>Current member point balances</p><div class="report-number">${analytics.totalPoints.toLocaleString('en-IN')}</div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, analytics.activeMembers / Math.max(1, analytics.totalCustomers) * 100)}%;--fill:#b5623d"></div></div><p class="report-note">${analytics.totalRewardRedemptions} recorded reward redemptions</p></article>
      <article class="report-card"><div class="report-card-top"><h3>Reservations</h3><span class="activity-icon" style="--soft:#f3ece3;--accent:#5d4a3f">${icon('calendar')}</span></div><p>Completed stored bookings</p><div class="report-number">${completed}</div><div class="progress-track"><div class="progress-fill" style="width:${completedRate}%;--fill:#5d4a3f"></div></div><p class="report-note">${completedRate.toFixed(0)}% completed vs no-show</p></article>
      <article class="report-card"><div class="report-card-top"><h3>Service recovery</h3><span class="activity-icon" style="--soft:#f7efe1;--accent:#8c642e">${icon('checkCircle')}</span></div><p>Feedback cases resolved</p><div class="report-number">${recoveryRate.toFixed(0)}%</div><div class="progress-track"><div class="progress-fill" style="width:${recoveryRate}%;--fill:#b99258"></div></div><p class="report-note">${analytics.openFeedback} case${analytics.openFeedback === 1 ? '' : 's'} still open</p></article>
    </section>`;
}

function renderSettings() {
  const settings = data.settings || {};
  const tab = state.settingsTab;
  const isOwner = data.user?.role === 'Owner';
  const saveTabs = ['profile', 'loyalty', 'integrations', 'data'];
  const headerAction = saveTabs.includes(tab) ? `<button class="btn btn-primary" data-action="save-settings">${icon('check')} Save changes</button>` : '';
  const nav = [
    ['profile', 'building', 'Cafe profile'], ['menu', 'coffee', 'Website & QR menu'], ['tables', 'grid', 'Tables & QR codes'], ['team', 'users', 'Team & permissions'],
    ['loyalty', 'gift', 'Loyalty rules'], ['integrations', 'link', 'Communication'],
    ['security', 'shield', 'Privacy & security'], ['data', 'database', 'Data & backups'],
  ];
  const integration = data.integrations || {};
  const managedMenu = data.publicMenuItems || [];
  const content = {
    profile: `
      <div class="form-section"><h3>Cafe profile</h3><p>These details appear in guest messages, loyalty cards and booking confirmations.</p><div class="form-grid"><div class="field"><label>Business name</label><input id="setting-business-name" value="${escapeHtml(settings.business_name || '')}" /></div><div class="field"><label>Primary phone</label><input id="setting-primary-phone" value="${escapeHtml(settings.primary_phone || '')}" /></div><div class="field full"><label>Address</label><input id="setting-address" value="${escapeHtml(settings.address || '')}" /></div><div class="field"><label>Timezone</label><select id="setting-timezone"><option>${escapeHtml(settings.timezone || 'Asia/Kolkata (IST)')}</option></select></div><div class="field"><label>Currency</label><select id="setting-currency"><option>${escapeHtml(settings.currency || 'Indian Rupee (₹)')}</option></select></div></div></div>
      <div class="form-section"><h3>Guest experience defaults</h3><p>Operational rules applied to new activity.</p><div class="switch-row"><div class="switch-copy"><strong>Automatically award loyalty points</strong><span>Award points using the configured earning rate.</span></div><button id="setting-automatic-points" class="switch ${settings.automatic_points ? 'on' : ''}" data-action="toggle-switch" aria-label="Toggle automatic points"></button></div><div class="switch-row"><div class="switch-copy"><strong>Reservation reminders</strong><span>Prepare reminder messages for confirmed bookings.</span></div><button id="setting-reservation-reminders" class="switch ${settings.reservation_reminders ? 'on' : ''}" data-action="toggle-switch" aria-label="Toggle reservation reminders"></button></div><div class="switch-row"><div class="switch-copy"><strong>Marketing requires explicit opt-in</strong><span>Block marketing messages without recorded permission.</span></div><button id="setting-marketing-consent" class="switch ${settings.marketing_requires_consent ? 'on' : ''}" data-action="toggle-switch" aria-label="Toggle marketing consent"></button></div></div>`,
    menu: `
      <div class="form-section"><div class="section-heading-row"><div><h3>Website & QR menu</h3><p>Prices and availability update on both guest menus within seconds.</p></div>${statusPill(`${managedMenu.filter((item) => item.active).length} available`)}</div><div class="field"><label>Find a menu item</label><input id="menu-management-search" placeholder="Search dish or category" /></div></div>
      <div class="table-wrap menu-management"><table class="data-table"><thead><tr><th>Dish</th><th>Category</th><th>Price</th><th>Availability</th><th></th></tr></thead><tbody>${managedMenu.map((item) => `<tr data-menu-row data-name="${escapeHtml(`${item.name} ${item.category}`.toLowerCase())}"><td><strong>${escapeHtml(item.name)}</strong><span class="table-subcopy">${escapeHtml(item.description || '')}</span></td><td>${escapeHtml(item.category)}</td><td>${inr(item.price)}</td><td>${statusPill(item.active ? 'Available' : 'Unavailable')}</td><td><div class="button-row"><button class="btn btn-small" data-action="edit-public-menu-item" data-id="${escapeHtml(item.id)}">Edit</button>${isOwner ? `<button class="btn btn-small" data-action="toggle-public-menu-item" data-id="${escapeHtml(item.id)}">${item.active ? 'Mark unavailable' : 'Make available'}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>`,
    tables: `
      <div class="form-section"><div class="section-heading-row"><div><h3>Dining tables & QR codes</h3><p>Manage the five table links. Download each protected QR for printing.</p></div>${statusPill(`${(data.tables || []).filter((table) => table.active).length} active`)}</div><div class="table-card-grid">${(data.tables || []).map((table) => `<article class="managed-table-card"><div><span class="eyebrow">Table ${escapeHtml(table.id)}</span><h3>${escapeHtml(table.label)}</h3><p>${escapeHtml(table.zoneName)} · ${table.capacity} seats</p></div>${statusPill(table.active ? 'Active' : 'Disabled')}<div class="button-row"><a class="btn btn-small" href="./assets/table-qrs/table-${String(table.id).padStart(2, '0')}-order-qr.png" download>${icon('download')} Download QR</a>${isOwner ? `<button class="btn btn-small" data-action="edit-managed-table" data-id="${escapeHtml(table.id)}">Edit table</button>` : ''}</div></article>`).join('')}</div></div>`,
    team: `
      <div class="form-section"><div class="section-heading-row"><div><h3>Team access</h3><p>Server-enforced roles: Owner, Manager, Cashier, Kitchen, Floor Staff and Host.</p></div>${isOwner ? `<button class="btn btn-primary" data-action="invite-staff">${icon('userPlus')} Add login account</button>` : ''}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Staff member</th><th>Role</th><th>Last sign-in</th><th>Status</th><th></th></tr></thead><tbody>${data.users.map((member) => `<tr><td><div class="customer-cell"><span class="avatar" style="--avatar:#173f35">${initials(member.name)}</span><div><strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(member.email)}</span></div></div></td><td>${escapeHtml(member.role)}</td><td>${member.lastLoginAt ? relativeTime(member.lastLoginAt) + ' ago' : 'Never'}</td><td>${statusPill(member.active ? 'Active' : 'Disabled')}</td><td>${isOwner && member.id !== data.user.id ? `<button class="btn btn-small" data-action="toggle-user" data-id="${member.id}">${member.active ? 'Disable' : 'Enable'}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`,
    loyalty: `
      <div class="form-section"><h3>Loyalty earning and tiers</h3><p>Thresholds are based on recorded lifetime spend.</p><div class="form-grid"><div class="field"><label>Points per ₹1</label><input id="setting-points-rate" type="number" min="0" step="0.01" value="${Number(settings.points_per_rupee ?? 0.1)}" /></div><div class="field"><label>Silver threshold</label><input id="setting-tier-silver" type="number" min="0" value="${Number(settings.tier_silver || 8000)}" /></div><div class="field"><label>Gold threshold</label><input id="setting-tier-gold" type="number" min="0" value="${Number(settings.tier_gold || 18000)}" /></div><div class="field"><label>Platinum threshold</label><input id="setting-tier-platinum" type="number" min="0" value="${Number(settings.tier_platinum || 35000)}" /></div></div></div><div class="form-section"><h3>Points controls</h3><p>Every manual change is recorded in the local audit ledger.</p><button class="btn" data-action="adjust-points">${icon('edit')} Adjust customer points</button></div>`,
    integrations: `
      <div class="form-section"><h3>Scheduled operations alerts</h3><p>Vercel prepares these messages every day at 10:30 PM IST. They remain in the demo outbox until WhatsApp credentials are connected.</p><div class="form-grid"><div class="field"><label>Alert recipient</label><input id="setting-alert-recipient" value="${escapeHtml(settings.operations_alert_recipient || '')}" placeholder="+91 mobile number" /></div><div class="field"><label>Daily run time</label><input id="setting-report-time" value="${escapeHtml(settings.daily_report_time || '22:30')}" readonly /></div></div><div class="switch-row"><div class="switch-copy"><strong>Daily sales summary</strong><span>Orders, settled bills and total sales.</span></div><button id="setting-daily-sales-alert" class="switch ${settings.daily_sales_report_enabled ? 'on' : ''}" data-action="toggle-switch"></button></div><div class="switch-row"><div class="switch-copy"><strong>Low-stock alert</strong><span>Only queued when one or more ingredients reach reorder level.</span></div><button id="setting-low-stock-alert" class="switch ${settings.low_stock_alert_enabled ? 'on' : ''}" data-action="toggle-switch"></button></div>${isOwner ? `<button class="btn" data-action="run-daily-alerts">${icon('send')} Run now</button>` : ''}</div>
      <div class="form-section"><h3>Communication channels</h3><p>Without credentials, messages are safely recorded in the demo outbox.</p><div class="switch-row"><div class="switch-copy"><strong>WhatsApp Business</strong><span>${escapeHtml(integration.whatsapp?.provider || 'Local outbox')}</span></div>${statusPill(integration.whatsapp?.mode || 'Demo')}</div><div class="switch-row"><div class="switch-copy"><strong>Email</strong><span>${escapeHtml(integration.email?.provider || 'Local outbox')}</span></div>${statusPill(integration.email?.mode || 'Demo')}</div></div><div class="form-section"><div class="section-heading-row"><div><h3>Recent outbox</h3><p>Transactional and guest messages.</p></div><button class="btn" data-action="compose-message">${icon('send')} New message</button></div>${data.communications.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Channel</th><th>Recipient</th><th>Purpose</th><th>Provider</th><th>Status</th></tr></thead><tbody>${data.communications.slice(0, 10).map((item) => `<tr><td>${escapeHtml(item.channel)}</td><td>${escapeHtml(item.recipient)}</td><td>${escapeHtml(item.purpose)}</td><td>${escapeHtml(item.provider)}</td><td>${statusPill(item.status)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state compact"><p>No messages have been queued yet.</p></div>'}</div>`,
    security: `
      <div class="form-section"><h3>Account security</h3><p>Sessions expire after 12 hours and passwords are stored with PBKDF2 hashing.</p><div class="security-callout">${icon('shield')}<div><strong>Signed in as ${escapeHtml(data.user?.email || '')}</strong><span>${escapeHtml(data.user?.role || '')} permissions are enforced by the local API.</span></div></div><button class="btn" data-action="change-password">${icon('lock')} Change password</button> <button class="btn" data-action="logout">Sign out</button></div>`,
    data: `
      <div class="form-section"><h3>Import and export</h3><p>Use UTF-8 CSV from the cafe POS. Name and phone are required; common column names are detected automatically.</p><div class="button-row"><button class="btn" data-action="import-customers">${icon('download')} Import customer CSV</button><button class="btn" data-action="download-customers">${icon('download')} Export customers</button><button class="btn" data-action="export-report">${icon('chart')} Export report</button></div></div>
      <div class="form-section"><h3>Automatic backups</h3><p>${isCloudHosted ? 'Versioned JSON backups are retained in the secured cloud data layer.' : 'A daily SQLite backup is retained locally.'} Manual backups and restores require Owner access.</p><div class="switch-row"><div class="switch-copy"><strong>Daily backups</strong><span>${isCloudHosted ? 'Stored in the secured production data layer.' : 'Stored inside the project backups folder.'}</span></div><button id="setting-backup-enabled" class="switch ${settings.backup_enabled ? 'on' : ''}" data-action="toggle-switch" aria-label="Toggle daily backups"></button></div><div class="field" style="max-width:220px"><label>Retention (days)</label><input id="setting-backup-retention" type="number" min="1" max="365" value="${Number(settings.backup_retention_days || 30)}" /></div>${isOwner ? `<div class="button-row"><button class="btn btn-primary" data-action="create-backup">${icon('database')} Create backup now</button></div>` : ''}</div>
      <div class="form-section"><h3>Available backups</h3>${data.backups.length ? `<div class="backup-list">${data.backups.slice(0, 8).map((backup) => `<div class="backup-row"><div>${icon('database')}<span><strong>${escapeHtml(backup.name)}</strong><small>${new Intl.NumberFormat('en-IN').format(Math.ceil(backup.size / 1024))} KB · ${relativeTime(backup.createdAt)} ago</small></span></div><div class="button-row"><button class="btn btn-small" data-action="download-backup" data-name="${escapeHtml(backup.name)}">Download</button>${isOwner ? `<button class="btn btn-small" data-action="restore-backup" data-name="${escapeHtml(backup.name)}">Restore</button>` : ''}</div></div>`).join('')}</div>` : '<div class="empty-state compact"><p>No backups are available yet.</p></div>'}</div>`,
  }[tab];
  return `
    ${pageHeader('Workspace administration', 'Settings', 'Configure the cafe profile, team access, communication and local data protection.', headerAction)}
    <div class="settings-layout">
      <div class="settings-nav">
        ${nav.map(([id, iconName, label]) => `<button class="${tab === id ? 'active' : ''}" data-action="settings-tab" data-tab="${id}">${icon(iconName)} ${label} ${icon('chevron', 'chevron')}</button>`).join('')}
      </div>
      <article class="panel">${content}</article>
    </div>`;
}

function renderLogin() {
  return `<main class="login-shell"><section class="login-card"><div class="login-brand login-brand-lockup"><img src="./assets/mangosteen-brand-lockup.png" alt="Mangosteen Cafe" /></div><div class="login-copy"><span class="eyebrow">Private operating system</span><h1>Welcome to Mangosteen</h1><p>One secure workspace for orders, kitchen, billing, stock, staff and every guest.</p></div>${dataError ? `<div class="form-error">${escapeHtml(dataError)}</div>` : ''}<form id="login-form"><div class="field"><label>Email address</label><input name="email" type="email" autocomplete="username" required /></div><div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required /></div><button class="btn btn-primary login-button" type="submit">${icon('lock')} Enter private workspace</button></form><div class="login-demo"><strong>Private workspace</strong><span>Use the account provided by the owner. Replace every seeded demo password before storing real customer data.</span></div></section><aside class="login-visual"><div><span class="eyebrow">Mangosteen Cafe · Indore</span><h2>Run the whole cafe. Know every guest.</h2><p>A premium operating layer for tables, kitchen, billing, inventory, people, loyalty and profit intelligence.</p></div></aside></main>`;
}

function renderApp() {
  if (authState === 'checking') {
    document.getElementById('app').innerHTML = `<div class="app-loading"><div class="loading-spinner"></div><strong>Opening Mangosteen CRM…</strong></div>`;
    return;
  }
  document.getElementById('app').innerHTML = authState === 'authenticated' ? shell() : renderLogin();
}

function refreshPage() {
  const content = document.getElementById('page-content');
  if (content) content.innerHTML = renderPage();
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.page === state.page));
}

async function syncAndRender() {
  await loadData({ quiet: true });
  renderApp();
}

function showToast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.innerHTML = `${icon(type === 'error' ? 'alert' : 'checkCircle')}<span>${escapeHtml(message)}</span>`;
  root.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

function openModal(title, subtitle, body, footer = '') {
  document.getElementById('modal-root').innerHTML = `
    <div class="modal-backdrop" data-action="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="modal-header"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="close-modal" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </section>
    </div>`;
  const firstInput = document.querySelector('.modal input');
  if (firstInput) window.setTimeout(() => firstInput.focus(), 50);
}

function openAddCustomer() {
  openModal('Add a customer', 'Create a guest profile with clear communication preferences.', `
    <form id="customer-form"><div class="form-grid"><div class="field"><label>Full name *</label><input name="name" required placeholder="Guest name" /></div><div class="field"><label>Mobile number *</label><input name="phone" required placeholder="+91" /></div><div class="field"><label>Email</label><input name="email" type="email" placeholder="name@example.com" /></div><div class="field"><label>Birthday</label><input name="birthday" type="date" /></div><div class="field"><label>Initial tier</label><select name="tier"><option>Member</option><option>Silver</option><option>Gold</option><option>Platinum</option></select></div><div class="field"><label>Primary preference</label><select name="tag"><option>New</option><option>Vegetarian</option><option>Vegan</option><option>Coffee lover</option><option>Celebrations</option></select></div><div class="field full"><label>Guest notes</label><textarea name="notes" placeholder="Preferences, allergies or service notes"></textarea></div></div><div class="switch-row"><div class="switch-copy"><strong>Marketing opt-in recorded</strong><span>Only enable after the guest gives clear permission.</span></div><button type="button" class="switch" id="new-customer-consent" data-action="toggle-switch"></button></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="customer-form">${icon('plus')} Create customer</button>`);
}

function openCustomerProfile(id) {
  const customer = data.customers.find((item) => item.id === Number(id));
  if (!customer) return;
  openModal('Customer profile', 'A complete guest relationship view.', `
    <div class="customer-profile-head"><span class="avatar" style="--avatar:${customer.avatar}">${initials(customer.name)}</span><div><h3>${escapeHtml(customer.name)}</h3><p>${escapeHtml(customer.phone)} · ${escapeHtml(customer.email)}</p><div class="tags"><span class="tier ${customer.tier.toLowerCase()}">${customer.tier}</span>${customer.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div></div></div>
    <div class="profile-facts"><div class="profile-fact"><span>Lifetime spend</span><strong>${inr(customer.spend)}</strong></div><div class="profile-fact"><span>Total visits</span><strong>${customer.visits}</strong></div><div class="profile-fact"><span>Loyalty points</span><strong>${customer.points.toLocaleString('en-IN')}</strong></div><div class="profile-fact"><span>Last visit</span><strong>${displayDate(customer.lastVisit)}</strong></div><div class="profile-fact"><span>Birthday</span><strong>${customer.birthday || 'Not provided'}</strong></div><div class="profile-fact"><span>Marketing consent</span><strong>${customer.consent ? 'Opted in' : 'Not recorded'}</strong></div></div>
    <div class="insight-card"><div class="insight-top"><strong>Guest notes</strong><span class="status ${customer.notes ? 'active' : 'draft'}">${customer.notes ? 'Recorded' : 'Empty'}</span></div><p>${escapeHtml(customer.notes || 'No preferences, allergies or service notes have been recorded yet.')}</p></div>
    <div class="task-list" style="margin-top:12px"><div class="task-item"><span class="activity-icon">${icon('coffee')}</span><div class="task-copy"><strong>Relationship summary</strong><p>${customer.visits} visits · ${inr(customer.monthSpend || 0)} linked this month · ${customer.points} points available</p></div></div><div class="task-item"><span class="activity-icon" style="--soft:#f7ece6;--accent:#b5623d">${icon('shield')}</span><div class="task-copy"><strong>Communication status</strong><p>${customer.consent ? 'Marketing opt-in is recorded.' : 'Only transactional communication is allowed.'}</p></div></div></div>`, `<button class="btn" data-action="close-modal">Close</button><button class="btn btn-primary" data-action="message-customer" data-id="${customer.id}">${icon('whatsapp')} Message guest</button>`);
}

function openReservationForm() {
  openModal('New reservation', 'Reserve a table and capture the details that make the visit special.', `
    <form id="reservation-form"><div class="form-grid"><div class="field"><label>Guest name *</label><input name="name" required placeholder="Search or enter guest" /></div><div class="field"><label>Mobile number *</label><input name="phone" required placeholder="+91" /></div><div class="field"><label>Date *</label><input name="date" type="date" required value="${localDateKey()}" /></div><div class="field"><label>Time *</label><input name="time" type="time" required value="19:00" /></div><div class="field"><label>Number of guests</label><input name="guests" type="number" min="1" max="30" value="2" /></div><div class="field"><label>Table preference</label><select name="table"><option>Best available</option><option>Window</option><option>Garden</option><option>Indoor</option><option>Private area</option></select></div><div class="field"><label>Occasion</label><select name="occasion"><option>Regular visit</option><option>Birthday</option><option>Anniversary</option><option>Business meeting</option><option>Celebration</option></select></div><div class="field"><label>Status</label><select name="status"><option>Confirmed</option><option>Pending</option></select></div><div class="field full"><label>Special requests</label><textarea name="notes" placeholder="Cake, allergies, accessibility or seating notes"></textarea></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="reservation-form">${icon('check')} Confirm reservation</button>`);
}

function openRewardForm() {
  openModal('Create reward', 'Add a benefit to the stored loyalty catalogue.', `
    <form id="reward-form"><div class="form-grid"><div class="field full"><label>Reward name *</label><input name="name" required placeholder="e.g. Complimentary coffee" /></div><div class="field full"><label>Description</label><input name="description" placeholder="What the member receives" /></div><div class="field"><label>Points cost</label><input name="points" type="number" min="0" value="500" /></div><div class="field"><label>Eligibility</label><select name="eligibility"><option>All tiers</option><option>Silver, Gold & Platinum</option><option>Gold & Platinum</option><option>Platinum only</option></select></div><div class="field"><label>Expiry</label><select name="expiry"><option>90 days</option><option>180 days</option><option>Birthday month</option><option>No expiry</option></select></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="reward-form">${icon('check')} Create reward</button>`);
}

function openReservationDetail(id) {
  const item = data.reservations.find((reservation) => reservation.id === Number(id));
  if (!item) return;
  const action = item.status === 'Pending' ? `<button class="btn btn-primary" data-action="confirm-reservation" data-id="${item.id}">${icon('check')} Confirm reservation</button>` : `<button class="btn btn-primary" data-action="close-modal">Done</button>`;
  openModal('Reservation details', `${displayDate(item.date)} · ${displayTime(item.time)}`, `<div class="profile-facts"><div class="profile-fact"><span>Guest</span><strong>${escapeHtml(item.name)}</strong></div><div class="profile-fact"><span>Party</span><strong>${item.guests} guests</strong></div><div class="profile-fact"><span>Table</span><strong>${escapeHtml(item.table)}</strong></div><div class="profile-fact"><span>Occasion</span><strong>${escapeHtml(item.occasion)}</strong></div><div class="profile-fact"><span>Status</span><strong>${escapeHtml(item.status)}</strong></div><div class="profile-fact"><span>Phone</span><strong>${escapeHtml(item.phone || 'Not provided')}</strong></div></div><div class="insight-card"><strong>Special requests</strong><p>${escapeHtml(item.specialRequests || 'No special requests recorded.')}</p></div>`, `<button class="btn" data-action="close-modal">Close</button>${action}`);
}

function openNotifications() {
  const analytics = calculateAnalytics();
  const pending = data.reservations.filter((item) => item.status === 'Pending');
  openModal('Notifications', 'Important activity requiring your attention.', `<div class="task-list"><div class="task-item"><span class="activity-icon" style="--soft:#f9e9e7;--accent:#b94e4b">${icon('alert')}</span><div class="task-copy"><strong>${analytics.openFeedback} feedback case${analytics.openFeedback === 1 ? '' : 's'} need attention</strong><p>Create recovery tasks and record the outcome.</p></div>${statusPill(analytics.openFeedback ? 'High' : 'Resolved')}</div><div class="task-item"><span class="activity-icon" style="--soft:#f7efe1;--accent:#8c642e">${icon('calendar')}</span><div class="task-copy"><strong>${pending.length} reservation${pending.length === 1 ? '' : 's'} awaiting confirmation</strong><p>${pending[0] ? `${escapeHtml(pending[0].name)} · ${pending[0].guests} guests · ${displayTime(pending[0].time)}` : 'All current bookings are confirmed.'}</p></div>${statusPill(pending.length ? 'Pending' : 'Resolved')}</div><div class="task-item"><span class="activity-icon" style="--soft:#f7ece6;--accent:#b5623d">${icon('database')}</span><div class="task-copy"><strong>Private database connected</strong><p>${data.customers.length} customers and ${data.reservations.length} reservations are stored.</p></div>${statusPill('Active')}</div></div>`, `<button class="btn btn-primary" data-action="close-modal">Got it</button>`);
}

function downloadFrom(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openImportCustomers() {
  openModal('Import customer CSV', 'Works with common POS exports and protects existing records.', `
    <form id="import-form"><div class="upload-box">${icon('download')}<strong>Select a UTF-8 CSV file</strong><span>Required columns: name and phone/mobile. Optional: email, visits, spend, points, consent, birthday and notes.</span><input name="file" type="file" accept=".csv,text/csv" required /></div><div class="field" style="margin-top:16px"><label>When a phone number already exists</label><select name="mode"><option value="update">Update the existing customer</option><option value="skip">Skip the row</option></select></div></form>`,
    `<button class="btn" data-action="download-template">Download template</button><button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="import-form">${icon('database')} Import customers</button>`);
}

function openMessageComposer(customerId = null, feedbackId = null) {
  const customer = data.customers.find((item) => item.id === Number(customerId));
  const feedback = data.feedback.find((item) => item.id === Number(feedbackId));
  const relatedCustomer = customer || data.customers.find((item) => item.id === feedback?.customerId);
  const defaultChannel = relatedCustomer?.email ? 'Email' : 'WhatsApp';
  const recipient = defaultChannel === 'Email' ? (relatedCustomer?.email || '') : (relatedCustomer?.phone || '');
  const message = feedback ? `Hi ${feedback.name.split(' ')[0]}, thank you for sharing your feedback with Mangosteen Cafe. We would like to make your next experience better.` : `Hi ${relatedCustomer?.name?.split(' ')[0] || 'there'}, a warm hello from Mangosteen Cafe.`;
  openModal('Send a guest message', 'Live credentials use the configured provider; otherwise this is saved to the local outbox.', `
    <form id="message-form"><input type="hidden" name="customerId" value="${relatedCustomer?.id || ''}" /><div class="form-grid"><div class="field"><label>Channel</label><select name="channel" id="message-channel"><option ${defaultChannel === 'WhatsApp' ? 'selected' : ''}>WhatsApp</option><option ${defaultChannel === 'Email' ? 'selected' : ''}>Email</option></select></div><div class="field"><label>Purpose</label><select name="purpose"><option>Transactional</option><option ${relatedCustomer?.consent ? '' : 'disabled'}>Marketing</option></select></div><div class="field full"><label>Recipient</label><input name="recipient" required value="${escapeHtml(recipient)}" placeholder="Phone or email" /></div><div class="field full"><label>Email subject</label><input name="subject" value="A message from Mangosteen Cafe" /></div><div class="field full"><label>Message</label><textarea name="message" required>${escapeHtml(message)}</textarea></div></div>${relatedCustomer && !relatedCustomer.consent ? '<div class="form-notice">Marketing is disabled because this guest has no recorded opt-in. Transactional messages remain available.</div>' : ''}</form>`,
    `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="message-form">${icon('send')} Send or queue</button>`);
}

function openPointsAdjustment() {
  const options = data.customers.slice().sort((a, b) => a.name.localeCompare(b.name)).map((customer) => `<option value="${customer.id}">${escapeHtml(customer.name)} · ${customer.points} points</option>`).join('');
  openModal('Adjust loyalty points', 'Every manual change is stored in the audit ledger.', `<form id="points-form"><div class="form-grid"><div class="field full"><label>Customer</label><select name="customerId" required>${options}</select></div><div class="field"><label>Points adjustment</label><input name="points" type="number" required placeholder="e.g. 100 or -50" /></div><div class="field"><label>Reason</label><input name="reason" required placeholder="Purchase correction" /></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="points-form">${icon('check')} Save adjustment</button>`);
}

function openOrderForm() {
  const groups = [...new Set((data.menuItems || []).map((item) => item.category))];
  const menu = groups.map((category) => `<section class="menu-group"><h3>${escapeHtml(category)}</h3><div class="menu-picker">${data.menuItems.filter((item) => item.category === category && item.active).map((item) => `<label class="menu-pick"><span><strong>${escapeHtml(item.name)}</strong><small>${inr(item.price)}</small></span><input name="qty_${item.id}" type="number" min="0" max="20" value="0" aria-label="Quantity for ${escapeHtml(item.name)}" /></label>`).join('')}</div></section>`).join('');
  openModal('Create table order', 'Choose the table and add menu quantities. The order remains editable until sent to the kitchen.', `<form id="order-form"><div class="field"><label>Table / service reference</label><input name="table" required placeholder="Table 5" maxlength="40" /></div><div class="menu-scroll">${menu}</div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="order-form">${icon('check')} Create order</button>`);
}

function openPublicMenuItemForm(id) {
  const item = (data.publicMenuItems || []).find((entry) => entry.id === id);
  if (!item) return;
  openModal('Edit menu item', `${escapeHtml(item.category)} · updates the website and table QR menu.`, `
    <form id="public-menu-item-form"><input type="hidden" name="id" value="${escapeHtml(item.id)}" /><div class="form-grid"><div class="field full"><label>Dish</label><input value="${escapeHtml(item.name)}" readonly /></div><div class="field"><label>Price (₹)</label><input name="price" type="number" min="0" max="10000" step="1" value="${Number(item.price)}" required /></div><div class="field"><label>Availability</label><select name="active"><option value="true" ${item.active ? 'selected' : ''}>Available</option><option value="false" ${!item.active ? 'selected' : ''}>Unavailable</option></select></div></div></form>`,
    `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="public-menu-item-form">Save menu item</button>`);
}

function openManagedTableForm(id) {
  const table = (data.tables || []).find((entry) => String(entry.id) === String(id));
  if (!table) return;
  openModal('Edit dining table', 'The printed QR stays valid; only the table details and availability change.', `
    <form id="managed-table-form"><input type="hidden" name="id" value="${escapeHtml(table.id)}" /><div class="form-grid"><div class="field"><label>Table label</label><input name="label" value="${escapeHtml(table.label)}" required maxlength="40" /></div><div class="field"><label>Seats</label><input name="capacity" type="number" min="1" max="30" value="${Number(table.capacity)}" required /></div><div class="field"><label>Zone</label><input name="zoneName" value="${escapeHtml(table.zoneName)}" maxlength="60" required /></div><div class="field"><label>Status</label><select name="active"><option value="true" ${table.active ? 'selected' : ''}>Active</option><option value="false" ${!table.active ? 'selected' : ''}>Disabled</option></select></div></div></form>`,
    `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="managed-table-form">Save table</button>`);
}

function openPaymentForm(orderId) {
  const order = data.orders.find((item) => String(item.id) === String(orderId));
  if (!order) return;
  openModal(`Settle ${escapeHtml(order.table)}`, `Order #${String(order.id).padStart(3, '0')} · ${inr(order.total)}`, `<form id="payment-form"><input type="hidden" name="orderId" value="${order.id}" /><div class="payment-methods">${['Cash', 'UPI', 'Card'].map((method, index) => `<label><input type="radio" name="method" value="${method}" ${index === 0 ? 'checked' : ''} /><span>${icon(method === 'Cash' ? 'rupee' : method === 'UPI' ? 'phone' : 'wallet')}<strong>${method}</strong></span></label>`).join('')}</div><div class="order-total modal-total"><span>Amount to collect</span><strong>${inr(order.total)}</strong></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="payment-form">${icon('wallet')} Confirm payment</button>`);
}

function openInventoryAdjustment(id) {
  const item = data.inventory.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  openModal(`Adjust ${escapeHtml(item.name)}`, `Current stock: ${item.quantity} ${escapeHtml(item.unit)} · use a negative number for wastage.`, `<form id="inventory-form"><input type="hidden" name="id" value="${item.id}" /><div class="form-grid"><div class="field"><label>Quantity change (${escapeHtml(item.unit)})</label><input name="quantity" type="number" step="0.01" required placeholder="e.g. 5 or -1" /></div><div class="field"><label>Reason</label><select name="reason"><option>Purchase received</option><option>Manual correction</option><option>Wastage</option><option>Stock count</option></select></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="inventory-form">Save adjustment</button>`);
}

function openExpenseForm() {
  const vendors = (data.vendors || []).map((vendor) => `<option value="${vendor.id}">${escapeHtml(vendor.name)}</option>`).join('');
  openModal('Record an expense', 'This cost is included immediately in operating-profit reports.', `<form id="expense-form"><div class="form-grid"><div class="field"><label>Expense name</label><input name="name" required placeholder="Electricity bill" /></div><div class="field"><label>Amount</label><input name="amount" type="number" min="1" step="0.01" required /></div><div class="field"><label>Category</label><select name="category"><option>Kitchen</option><option>Vendor</option><option>Rent</option><option>Utilities</option><option>Salary</option><option>Other</option></select></div><div class="field"><label>Date</label><input name="date" type="date" value="${localDateKey()}" required /></div><div class="field"><label>Vendor (optional)</label><select name="vendorId"><option value="">No vendor</option>${vendors}</select></div><div class="field full"><label>Note</label><textarea name="note" placeholder="Invoice number or context"></textarea></div></div><label class="check-row"><input type="checkbox" name="addToBalance" value="true" /><span>Add this amount to the selected vendor’s outstanding balance</span></label></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="expense-form">${icon('check')} Record expense</button>`);
}

function openVendorForm() {
  openModal('Add vendor', 'Create a supplier record for purchasing and balance tracking.', `<form id="vendor-form"><div class="form-grid"><div class="field"><label>Vendor name</label><input name="name" required /></div><div class="field"><label>Phone</label><input name="phone" /></div><div class="field full"><label>Supplies</label><input name="supplies" placeholder="Milk, cream, paneer" /></div><div class="field"><label>Opening balance</label><input name="balance" type="number" min="0" step="0.01" value="0" /></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="vendor-form">Add vendor</button>`);
}

function openVendorPayment(id) {
  const vendor = data.vendors.find((item) => String(item.id) === String(id));
  if (!vendor) return;
  openModal(`Pay ${escapeHtml(vendor.name)}`, `Outstanding balance: ${inr(vendor.balance)}`, `<form id="vendor-payment-form"><input type="hidden" name="id" value="${vendor.id}" /><div class="field"><label>Payment amount</label><input name="amount" type="number" min="1" max="${vendor.balance}" step="0.01" value="${vendor.balance}" required /></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="vendor-payment-form">Record payment</button>`);
}

function openOperationStaffForm() {
  openModal('Add roster member', 'Add a staff profile for shifts, attendance, and salary tracking.', `<form id="operation-staff-form"><div class="form-grid"><div class="field"><label>Full name</label><input name="name" required /></div><div class="field"><label>Job role</label><input name="jobRole" required placeholder="Barista" /></div><div class="field"><label>Shift starts</label><input name="shiftStart" type="time" value="09:00" required /></div><div class="field"><label>Shift ends</label><input name="shiftEnd" type="time" value="18:00" required /></div><div class="field"><label>Monthly salary</label><input name="salary" type="number" min="0" step="1" required /></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="operation-staff-form">Add to roster</button>`);
}

function openAttendanceForm(id) {
  const member = data.staff.find((item) => String(item.id) === String(id));
  if (!member) return;
  openModal(`Attendance · ${escapeHtml(member.name)}`, 'Update today’s status and check-in time.', `<form id="attendance-form"><input type="hidden" name="staffId" value="${member.id}" /><input type="hidden" name="date" value="${localDateKey()}" /><div class="form-grid"><div class="field"><label>Status</label><select name="status">${['Present', 'Late', 'Leave', 'Absent'].map((status) => `<option ${member.attendance?.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></div><div class="field"><label>Check-in time</label><input name="checkIn" type="time" value="${escapeHtml(member.attendance?.checkIn || '')}" /></div><div class="field full"><label>Note</label><input name="note" value="${escapeHtml(member.attendance?.note || '')}" /></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="attendance-form">Save attendance</button>`);
}

function openStaffForm() {
  openModal('Add login account', 'Create a secure account with only the access this teammate needs.', `<form id="staff-form"><div class="form-grid"><div class="field"><label>Full name</label><input name="name" required /></div><div class="field"><label>Email</label><input name="email" type="email" required /></div><div class="field"><label>Role</label><select name="role"><option>Host</option><option>Cashier</option><option>Kitchen</option><option>Floor Staff</option><option>Manager</option><option>Owner</option></select></div><div class="field"><label>Temporary password</label><input name="password" type="password" minlength="10" required /></div></div><div class="role-guide"><div><strong>Cashier</strong><span>Orders, billing and guest desk.</span></div><div><strong>Kitchen</strong><span>Preparation tickets and ready status.</span></div><div><strong>Floor Staff</strong><span>Ready-order handoff and table requests.</span></div><div><strong>Manager</strong><span>All operations except owner-only security.</span></div><div><strong>Owner</strong><span>Full access, accounts and backups.</span></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="staff-form">${icon('userPlus')} Create account</button>`);
}

function openPasswordForm() {
  openModal('Change password', 'Use a unique password with at least 10 characters, letters and numbers.', `<form id="password-form"><div class="field"><label>Current password</label><input name="currentPassword" type="password" required /></div><div class="field" style="margin-top:12px"><label>New password</label><input name="newPassword" type="password" minlength="10" required /></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="password-form">${icon('lock')} Update password</button>`);
}

function openProfileMenu() {
  openModal('Your account', `${escapeHtml(data.user?.role || '')} workspace`, `<div class="customer-profile-head"><span class="avatar" style="--avatar:#b5623d">${initials(data.user?.name || 'Staff')}</span><div><h3>${escapeHtml(data.user?.name || '')}</h3><p>${escapeHtml(data.user?.email || '')}</p>${statusPill('Active')}</div></div><div class="role-guide"><div><strong>Session protection</strong><span>Automatic expiry after 12 hours.</span></div><div><strong>Role</strong><span>${escapeHtml(data.user?.role || '')} permissions enforced by the API.</span></div></div>`, `<button class="btn" data-action="change-password">${icon('lock')} Change password</button><button class="btn btn-primary" data-action="logout">Sign out</button>`);
}

function openFeedbackLink() {
  const url = data.settings.feedback_url || 'http://127.0.0.1:4173/feedback';
  openModal('Feedback collection link', 'Use this link in table QR artwork, receipts or follow-up messages.', `<div class="share-link"><input id="feedback-link" readonly value="${escapeHtml(url)}" /><button class="btn" data-action="copy-feedback-link">Copy link</button></div><div class="form-notice">Set the final public URL in Settings before printing table materials.</div>`, `<button class="btn btn-primary" data-action="close-modal">Done</button>`);
}

function downloadTemplate() {
  const csv = 'Name,Phone,Email,Visits,Lifetime Spend,Points,Marketing Consent,Birthday,Notes\nSample Guest,+91 90000 00000,guest@example.com,1,850,85,Yes,1995-05-12,Prefers window seating\n';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  downloadFrom(url);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filterCustomers() {
  const query = (document.getElementById('customer-search')?.value || '').trim().toLowerCase();
  const tier = document.getElementById('customer-tier')?.value || 'All tiers';
  let visible = 0;
  document.querySelectorAll('[data-customer-row]').forEach((row) => {
    const matchQuery = !query || row.dataset.search.includes(query);
    const matchTier = tier === 'All tiers' || row.dataset.tier === tier;
    const show = matchQuery && matchTier;
    row.style.display = show ? '' : 'none';
    if (show) visible += 1;
  });
  const count = document.getElementById('customer-count');
  if (count) count.textContent = `Showing ${visible} matching stored customer${visible === 1 ? '' : 's'}`;
}

document.getElementById('app').addEventListener('click', async (event) => {
  const pageButton = event.target.closest('[data-page]');
  if (pageButton) {
    state.page = pageButton.dataset.page;
    state.sidebarOpen = false;
    refreshPage();
    document.getElementById('sidebar').classList.remove('open');
    document.querySelector('.mobile-overlay').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const target = event.target.closest('[data-action]');
  if (!target) {
    const segment = event.target.closest('[data-segment] button');
    if (segment) {
      segment.parentElement.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
      segment.classList.add('active');
    }
    return;
  }

  const action = target.dataset.action;
  try {
    if (action === 'toggle-sidebar') {
      state.sidebarOpen = !state.sidebarOpen;
      document.getElementById('sidebar').classList.toggle('open', state.sidebarOpen);
      document.querySelector('.mobile-overlay').classList.toggle('open', state.sidebarOpen);
    } else if (action === 'close-sidebar') {
      state.sidebarOpen = false;
      document.getElementById('sidebar').classList.remove('open');
      target.classList.remove('open');
    } else if (action === 'new-order') openOrderForm();
    else if (action === 'send-order') { target.disabled = true; await api(`/api/orders/${target.dataset.id}/send`, { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Order sent to the kitchen and recipe stock deducted.'); }
    else if (action === 'kitchen-start') { target.disabled = true; await api(`/api/orders/${target.dataset.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'Preparing' }) }); await syncAndRender(); showToast('Kitchen started preparing this order.'); }
    else if (action === 'kitchen-ready') { target.disabled = true; await api(`/api/orders/${target.dataset.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'Ready' }) }); await syncAndRender(); showToast('Order is ready for service.'); }
    else if (action === 'mark-served') { target.disabled = true; await api(`/api/orders/${target.dataset.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'Served' }) }); await syncAndRender(); showToast('Order marked served.'); }
    else if (action === 'acknowledge-service') { target.disabled = true; await api(`/api/service-requests/${target.dataset.id}/acknowledge`, { method: 'POST', body: '{}' }); await syncAndRender(); showToast('The guest can now see that a team member is coming.'); }
    else if (action === 'take-payment') openPaymentForm(target.dataset.id);
    else if (action === 'adjust-stock') openInventoryAdjustment(target.dataset.id);
    else if (action === 'add-expense') openExpenseForm();
    else if (action === 'add-vendor') openVendorForm();
    else if (action === 'pay-vendor') openVendorPayment(target.dataset.id);
    else if (action === 'add-operation-staff') openOperationStaffForm();
    else if (action === 'mark-attendance') openAttendanceForm(target.dataset.id);
    else if (action === 'refresh-operations') { target.disabled = true; await syncAndRender(); showToast('Live operating data refreshed.'); }
    else if (action === 'add-customer') openAddCustomer();
    else if (action === 'view-customer') openCustomerProfile(target.dataset.id || target.closest('[data-id]')?.dataset.id);
    else if (action === 'add-reservation') openReservationForm();
    else if (action === 'notifications') openNotifications();
    else if (action === 'retry-data') { await loadData(); renderApp(); }
    else if (action === 'reset-demo') { if (!window.confirm('Reset all CRM demo records? A safety backup will not be created by this action.')) return; target.disabled = true; await api('/api/reset', { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Sample database has been rebuilt.'); }
    else if (action === 'complete-task') { target.disabled = true; await api(`/api/tasks/${target.dataset.id}/complete`, { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Task marked complete.'); }
    else if (action === 'resolve-feedback') { target.disabled = true; await api(`/api/feedback/${target.dataset.id}/recovery`, { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Recovery task created and stored.'); }
    else if (action === 'toggle-switch') target.classList.toggle('on');
    else if (action === 'export-report') { downloadFrom('/api/export/report.csv'); showToast('Report CSV download started.'); }
    else if (action === 'download-customers') { downloadFrom('/api/export/customers.csv'); showToast('Customer export started.'); }
    else if (action === 'settings-tab') { state.settingsTab = target.dataset.tab; refreshPage(); }
    else if (action === 'edit-public-menu-item') openPublicMenuItemForm(target.dataset.id);
    else if (action === 'toggle-public-menu-item') {
      const item = (data.publicMenuItems || []).find((entry) => entry.id === target.dataset.id);
      if (!item) return;
      target.disabled = true;
      await api(`/api/public-menu-items/${encodeURIComponent(item.id)}`, { method: 'POST', body: JSON.stringify({ price: item.price, active: !item.active }) });
      await syncAndRender();
      state.settingsTab = 'menu'; refreshPage();
      showToast(`${item.name} is now ${!item.active ? 'available' : 'unavailable'} on guest menus.`);
    }
    else if (action === 'edit-managed-table') openManagedTableForm(target.dataset.id);
    else if (action === 'run-daily-alerts') {
      target.disabled = true;
      const result = await api('/api/notifications/run-daily', { method: 'POST', body: '{}' });
      await syncAndRender(); state.settingsTab = 'integrations'; refreshPage();
      showToast(`${result.queued} operations alert${result.queued === 1 ? '' : 's'} queued.`);
    }
    else if (action === 'save-settings') {
      target.disabled = true;
      const values = {
        business_name: document.getElementById('setting-business-name')?.value.trim(),
        primary_phone: document.getElementById('setting-primary-phone')?.value.trim(),
        address: document.getElementById('setting-address')?.value.trim(),
        timezone: document.getElementById('setting-timezone')?.value,
        currency: document.getElementById('setting-currency')?.value,
        automatic_points: document.getElementById('setting-automatic-points')?.classList.contains('on'),
        reservation_reminders: document.getElementById('setting-reservation-reminders')?.classList.contains('on'),
        marketing_requires_consent: document.getElementById('setting-marketing-consent')?.classList.contains('on'),
        points_per_rupee: Number(document.getElementById('setting-points-rate')?.value),
        tier_silver: Number(document.getElementById('setting-tier-silver')?.value),
        tier_gold: Number(document.getElementById('setting-tier-gold')?.value),
        tier_platinum: Number(document.getElementById('setting-tier-platinum')?.value),
        backup_enabled: document.getElementById('setting-backup-enabled')?.classList.contains('on'),
        backup_retention_days: Number(document.getElementById('setting-backup-retention')?.value),
        operations_alert_recipient: document.getElementById('setting-alert-recipient')?.value.trim(),
        daily_report_time: document.getElementById('setting-report-time')?.value,
        daily_sales_report_enabled: document.getElementById('setting-daily-sales-alert')?.classList.contains('on'),
        low_stock_alert_enabled: document.getElementById('setting-low-stock-alert')?.classList.contains('on'),
      };
      Object.keys(values).forEach((key) => { if (values[key] === undefined || Number.isNaN(values[key])) delete values[key]; });
      await api('/api/settings', { method: 'POST', body: JSON.stringify(values) });
      await syncAndRender();
      showToast('Settings saved to the local database.');
    }
    else if (action === 'message-customer') openMessageComposer(target.dataset.id);
    else if (action === 'compose-message') openMessageComposer();
    else if (action === 'new-reward') openRewardForm();
    else if (action === 'adjust-points') openPointsAdjustment();
    else if (action === 'edit-tiers') { state.page = 'settings'; state.settingsTab = 'loyalty'; refreshPage(); }
    else if (action === 'reply-feedback') openMessageComposer(null, target.dataset.id);
    else if (action === 'create-qr') openFeedbackLink();
    else if (action === 'reservation-detail') openReservationDetail(target.dataset.id);
    else if (action === 'import-customers') openImportCustomers();
    else if (action === 'invite-staff') openStaffForm();
    else if (action === 'toggle-user') { target.disabled = true; await api(`/api/users/${target.dataset.id}/toggle`, { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Staff access updated.'); }
    else if (action === 'change-password') openPasswordForm();
    else if (action === 'logout') { await api('/api/auth/logout', { method: 'POST', body: '{}' }); csrfToken = ''; authState = 'anonymous'; data = { customers: [], reservations: [], feedback: [], tasks: [], rewards: [], activities: [], monthlyMetrics: [], settings: {} }; closeModal(); renderApp(); }
    else if (action === 'create-backup') { target.disabled = true; await api('/api/backups', { method: 'POST', body: '{}' }); await syncAndRender(); showToast(isCloudHosted ? 'Cloud backup created.' : 'Local backup created.'); }
    else if (action === 'download-backup') downloadFrom(`/api/backups/${encodeURIComponent(target.dataset.name)}`);
    else if (action === 'restore-backup') { if (!window.confirm(`Restore ${target.dataset.name}? Current data will be backed up first.`)) return; target.disabled = true; await api('/api/backups/restore', { method: 'POST', body: JSON.stringify({ name: target.dataset.name }) }); await syncAndRender(); showToast('Backup restored successfully.'); }
    else if (action === 'export-feedback') { const rows = [['Name','Rating','Source','Status','Message'], ...data.feedback.map((item) => [item.name,item.rating,item.source,item.status,item.text])]; const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n'); const url = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); downloadFrom(url); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    else if (action === 'profile-menu') openProfileMenu();
  } catch (error) {
    target.disabled = false;
    showToast(error.message, 'error');
  }
});

document.getElementById('app').addEventListener('input', (event) => {
  if (event.target.id === 'customer-search') filterCustomers();
  if (event.target.id === 'menu-management-search') {
    const query = event.target.value.trim().toLowerCase();
    document.querySelectorAll('[data-menu-row]').forEach((row) => { row.hidden = !row.dataset.name.includes(query); });
  }
});

document.getElementById('app').addEventListener('change', (event) => {
  if (event.target.id === 'customer-tier') filterCustomers();
});

document.getElementById('app').addEventListener('keydown', (event) => {
  if (event.target.id === 'global-search' && event.key === 'Enter') {
    event.preventDefault();
    runGlobalSearch(event.target.value);
  }
});

document.getElementById('app').addEventListener('submit', async (event) => {
  if (event.target.id !== 'login-form') return;
  event.preventDefault();
  const form = event.target;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Signing in…';
  dataError = '';
  try {
    const values = Object.fromEntries(new FormData(form).entries());
    await api('/api/auth/login', { method: 'POST', body: JSON.stringify(values) });
    authState = 'authenticated';
    await loadData({ quiet: true });
    renderApp();
    showToast('Signed in securely.');
  } catch (error) {
    dataError = error.message;
    authState = 'anonymous';
    renderApp();
  }
});

document.getElementById('modal-root').addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  if (target.dataset.action === 'close-modal') closeModal();
  if (target.dataset.action === 'modal-backdrop' && event.target === target) closeModal();
  if (target.dataset.action === 'toggle-switch') target.classList.toggle('on');
  if (target.dataset.action === 'message-customer') openMessageComposer(target.dataset.id);
  if (target.dataset.action === 'download-template') downloadTemplate();
  if (target.dataset.action === 'copy-feedback-link') {
    await navigator.clipboard.writeText(document.getElementById('feedback-link')?.value || '');
    showToast('Feedback link copied.');
  }
  if (target.dataset.action === 'change-password') openPasswordForm();
  if (target.dataset.action === 'confirm-reservation') {
    try {
      target.disabled = true;
      await api(`/api/reservations/${target.dataset.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'Confirmed' }) });
      closeModal();
      await syncAndRender();
      showToast('Reservation confirmed and activity logged.');
    } catch (error) {
      target.disabled = false;
      showToast(error.message, 'error');
    }
  }
  if (target.dataset.action === 'logout') {
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
    csrfToken = '';
    authState = 'anonymous';
    closeModal();
    renderApp();
  }
});

document.getElementById('modal-root').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const values = Object.fromEntries(new FormData(form).entries());
  const submit = form.closest('.modal')?.querySelector('[type="submit"]');
  if (submit) { submit.disabled = true; submit.dataset.original = submit.innerHTML; submit.textContent = 'Saving…'; }
  try {
    if (form.id === 'order-form') {
      const items = (data.menuItems || []).map((item) => ({ menuItemId: item.id, quantity: Number(values[`qty_${item.id}`] || 0) })).filter((item) => item.quantity > 0);
      await api('/api/orders', { method: 'POST', body: JSON.stringify({ table: values.table, items }) });
      closeModal();
      state.page = 'orders';
      await syncAndRender();
      showToast('Draft order created. Review it, then send it to the kitchen.');
    } else if (form.id === 'public-menu-item-form') {
      await api(`/api/public-menu-items/${encodeURIComponent(values.id)}`, { method: 'POST', body: JSON.stringify({ price: Number(values.price), active: values.active === 'true' }) });
      closeModal(); await syncAndRender(); state.page = 'settings'; state.settingsTab = 'menu'; refreshPage();
      showToast('Menu price and availability updated on all guest menus.');
    } else if (form.id === 'managed-table-form') {
      await api(`/api/tables/${encodeURIComponent(values.id)}`, { method: 'POST', body: JSON.stringify({ label: values.label, zoneName: values.zoneName, capacity: Number(values.capacity), active: values.active === 'true' }) });
      closeModal(); await syncAndRender(); state.page = 'settings'; state.settingsTab = 'tables'; refreshPage();
      showToast('Table settings updated.');
    } else if (form.id === 'payment-form') {
      await api(`/api/orders/${values.orderId}/pay`, { method: 'POST', body: JSON.stringify({ method: values.method }) });
      closeModal();
      state.page = 'billing';
      await syncAndRender();
      showToast(`Payment recorded by ${values.method}.`);
    } else if (form.id === 'inventory-form') {
      await api(`/api/inventory/${values.id}/adjust`, { method: 'POST', body: JSON.stringify({ quantity: Number(values.quantity), reason: values.reason }) });
      closeModal();
      state.page = 'stock';
      await syncAndRender();
      showToast('Inventory balance and movement ledger updated.');
    } else if (form.id === 'expense-form') {
      await api('/api/expenses', { method: 'POST', body: JSON.stringify({ ...values, amount: Number(values.amount), addToBalance: values.addToBalance === 'true' }) });
      closeModal();
      state.page = 'expenses';
      await syncAndRender();
      showToast('Expense recorded and profit recalculated.');
    } else if (form.id === 'vendor-form') {
      await api('/api/vendors', { method: 'POST', body: JSON.stringify({ ...values, balance: Number(values.balance || 0) }) });
      closeModal();
      state.page = 'vendors';
      await syncAndRender();
      showToast(`${values.name} was added to the supplier directory.`);
    } else if (form.id === 'vendor-payment-form') {
      await api(`/api/vendors/${values.id}/pay`, { method: 'POST', body: JSON.stringify({ amount: Number(values.amount) }) });
      closeModal();
      state.page = 'vendors';
      await syncAndRender();
      showToast('Vendor payment recorded.');
    } else if (form.id === 'operation-staff-form') {
      await api('/api/staff', { method: 'POST', body: JSON.stringify({ ...values, salary: Number(values.salary || 0) }) });
      closeModal();
      state.page = 'staff';
      await syncAndRender();
      showToast(`${values.name} was added to the roster.`);
    } else if (form.id === 'attendance-form') {
      await api('/api/attendance', { method: 'POST', body: JSON.stringify(values) });
      closeModal();
      state.page = 'staff';
      await syncAndRender();
      showToast('Attendance updated.');
    } else if (form.id === 'customer-form') {
      values.consent = document.getElementById('new-customer-consent')?.classList.contains('on') || false;
      await api('/api/customers', { method: 'POST', body: JSON.stringify(values) });
      closeModal();
      state.page = 'customers';
      await syncAndRender();
      showToast(`${values.name} was added and saved.`);
    } else if (form.id === 'reservation-form') {
      await api('/api/reservations', { method: 'POST', body: JSON.stringify(values) });
      closeModal();
      state.page = 'reservations';
      await syncAndRender();
      showToast(`Reservation saved for ${values.name}.`);
    } else if (form.id === 'reward-form') {
      await api('/api/rewards', { method: 'POST', body: JSON.stringify(values) });
      closeModal();
      state.page = 'loyalty';
      await syncAndRender();
      showToast(`Reward “${values.name}” added to the catalogue.`);
    } else if (form.id === 'import-form') {
      const file = form.querySelector('[name="file"]').files[0];
      if (!file) throw new Error('Choose a CSV file first.');
      const result = await api('/api/import/customers', { method: 'POST', body: JSON.stringify({ csv: await file.text(), mode: values.mode }) });
      closeModal();
      state.page = 'customers';
      await syncAndRender();
      showToast(`${result.inserted} added, ${result.updated} updated, ${result.skipped} skipped.`);
    } else if (form.id === 'message-form') {
      const result = await api('/api/communications/send', { method: 'POST', body: JSON.stringify(values) });
      closeModal();
      await syncAndRender();
      showToast(result.status === 'Sent' ? 'Message sent successfully.' : 'Message saved to the demo outbox.');
    } else if (form.id === 'points-form') {
      await api('/api/points/adjust', { method: 'POST', body: JSON.stringify(values) });
      closeModal();
      state.page = 'loyalty';
      await syncAndRender();
      showToast('Loyalty balance and audit ledger updated.');
    } else if (form.id === 'staff-form') {
      await api('/api/users', { method: 'POST', body: JSON.stringify(values) });
      closeModal();
      await syncAndRender();
      showToast(`Staff account created for ${values.name}.`);
    } else if (form.id === 'password-form') {
      await api('/api/auth/change-password', { method: 'POST', body: JSON.stringify(values) });
      closeModal();
      showToast('Password changed successfully.');
    }
  } catch (error) {
    if (submit) { submit.disabled = false; submit.innerHTML = submit.dataset.original || 'Save'; }
    showToast(error.message, 'error');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.getElementById('global-search')?.focus();
  }
});

renderApp();
boot();
setInterval(async () => {
  if (authState !== 'authenticated' || !['orders', 'kitchen', 'floor', 'billing'].includes(state.page)) return;
  if (document.getElementById('modal-root')?.children.length) return;
  try { await loadData({ quiet: true }); refreshPage(); } catch (_) { /* next refresh retries */ }
}, 8000);
