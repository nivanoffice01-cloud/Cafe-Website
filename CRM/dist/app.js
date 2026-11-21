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
  customers: [], reservations: [], campaigns: [], feedback: [], tasks: [],
  rewards: [], activities: [], monthlyMetrics: [], settings: {}, users: [],
  communications: [], pointLedger: [], backups: [], integrations: {}, user: null,
};
let loading = true;
let dataError = '';
let authState = 'checking';

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    authState = 'anonymous';
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
  const campaigns = data.campaigns || [];
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
  const deliveredCampaigns = campaigns.filter((item) => ['Delivered', 'Active'].includes(item.status));
  const totalAudience = campaigns.reduce((sum, item) => sum + Number(item.audience || 0), 0);
  const openedCampaigns = deliveredCampaigns.filter((item) => Number.isFinite(Number(item.openedRate)));
  const averageOpenRate = openedCampaigns.length ? openedCampaigns.reduce((sum, item) => sum + Number(item.openedRate), 0) / openedCampaigns.length : 0;
  const totalRedemptions = campaigns.reduce((sum, item) => sum + Number(item.redeemed || 0), 0);
  const campaignRevenue = campaigns.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
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
    totalAudience, averageOpenRate, totalRedemptions, campaignRevenue,
    monthRevenue, lifetimeRevenue, totalPoints, totalRewardRedemptions,
    averageSpend: totalCustomers ? lifetimeRevenue / totalCustomers : 0,
    campaignConversion: totalAudience ? totalRedemptions / totalAudience * 100 : 0,
    openTasks,
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
  { id: 'customers', label: 'Customers', icon: 'users' },
  { id: 'reservations', label: 'Reservations', icon: 'calendar', badge: '5' },
  { id: 'loyalty', label: 'Loyalty & rewards', icon: 'gift' },
  { id: 'campaigns', label: 'Campaigns', icon: 'send' },
  { id: 'feedback', label: 'Feedback', icon: 'message', badge: '2' },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

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
  const businessName = data.settings.business_name || 'Mangosteen Cafe';
  const user = data.user || { name: 'Staff member', role: 'Host' };
  const userInitials = initials(user.name || 'Staff');
  const hostPages = new Set(['dashboard', 'customers', 'reservations', 'feedback', 'reports']);
  const visibleNav = navItems.filter((item) => user.role !== 'Host' ? true : hostPages.has(item.id));
  const dynamicBadge = (id) => id === 'reservations' ? analytics.todayReservations.length : id === 'feedback' ? analytics.openFeedback : null;
  return `
    <div class="app-shell">
      <aside class="sidebar ${state.sidebarOpen ? 'open' : ''}" id="sidebar">
        <div class="brand">
          <div class="brand-mark">${icon('coffee')}</div>
          <div class="brand-copy"><strong>${escapeHtml(businessName.replace(/\s+Cafe$/i, ''))}</strong><span>Guest CRM</span></div>
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
          <div class="demo-pill">Local database active</div>
        </div>
      </aside>
      <div class="mobile-overlay ${state.sidebarOpen ? 'open' : ''}" data-action="close-sidebar"></div>
      <main class="main-shell">
        <div class="topbar">
          <button class="icon-btn menu-toggle" data-action="toggle-sidebar" aria-label="Open navigation">${icon('menu')}</button>
          <div class="global-search">
            ${icon('search')}
            <input id="global-search" type="search" placeholder="Search customers, reservations, campaigns…" aria-label="Global search" />
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
            <span><strong>Local functional workspace.</strong> Changes are saved to SQLite on this Mac. Initial records are sample data.</span>
            <button data-action="reset-demo">Reset demo data</button>
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
    customers: renderCustomers,
    reservations: renderReservations,
    loyalty: renderLoyalty,
    campaigns: renderCampaigns,
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
      <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7a2f62" stop-opacity=".22"/><stop offset="100%" stop-color="#7a2f62" stop-opacity="0"/></linearGradient></defs>
      ${[25, 55, 85, 115].map((y) => `<line class="chart-grid-line" x1="12" x2="668" y1="${y}" y2="${y}"/>`).join('')}
      <path class="chart-area" d="${area}"/><path class="chart-line" d="${path}"/>
      ${points.map((point) => `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="3"/>`).join('')}
      ${labels.map((label, index) => `<text class="chart-label" x="${points[index].x}" y="145" text-anchor="middle">${label}</text>`).join('')}
    </svg>`;
}

function renderDashboard() {
  const analytics = calculateAnalytics();
  const metrics = data.monthlyMetrics || [];
  const chartValues = metrics.map((item) => item.returningVisits);
  const chartLabels = metrics.map((item) => new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(`${item.month}-01T12:00:00`)));
  const returningTotal = chartValues.reduce((sum, value) => sum + Number(value || 0), 0);
  const previous = chartValues.at(-2) || 0;
  const latest = chartValues.at(-1) || 0;
  const chartChange = previous ? (latest - previous) / previous * 100 : 0;
  const todayReservations = analytics.todayReservations.slice().sort((a, b) => a.time.localeCompare(b.time));
  const activityStyles = {
    customer: ['userPlus', '#edf5f2', '#205243'], reward: ['gift', '#f4e8f0', '#7a2f62'],
    reservation: ['calendar', '#fbf1df', '#a36a1f'], feedback: ['star', '#eaf0f9', '#4d76b8'],
    alert: ['alert', '#faeaea', '#c45252'],
  };
  const slots = [
    { label: '4:00–6:00 PM', min: '16:00', max: '18:00', color: '#4d76b8' },
    { label: '6:00–8:00 PM', min: '18:00', max: '20:00', color: '#d99a3e' },
    { label: '8:00–10:00 PM', min: '20:00', max: '22:00', color: '#7a2f62' },
  ].map((slot) => ({ ...slot, value: Math.min(100, todayReservations.filter((item) => item.time >= slot.min && item.time < slot.max).reduce((sum, item) => sum + item.guests, 0) / 25 * 100) }));
  const reservationActions = `<button class="btn" data-action="export-report">${icon('download')} Export</button><button class="btn btn-primary" data-action="add-reservation">${icon('plus')} New reservation</button>`;
  return `
    ${pageHeader('Overview', `Good afternoon, ${escapeHtml((data.user?.name || 'there').split(' ')[0])}`, 'Here is what is happening with your guests and cafe today.', reservationActions)}
    <section class="stat-grid">
      ${statCard({ iconName: 'wallet', value: inr(analytics.monthRevenue), label: 'Customer-linked revenue this month', trend: `${analytics.totalCustomers} profiles`, accent: '#205243', soft: '#edf5f2', glow: 'rgba(32,82,67,.09)' })}
      ${statCard({ iconName: 'users', value: analytics.totalCustomers.toLocaleString('en-IN'), label: 'Known customers', trend: `${analytics.consented} opted in`, accent: '#7a2f62', soft: '#f4e8f0', glow: 'rgba(122,47,98,.08)' })}
      ${statCard({ iconName: 'calendar', value: analytics.todayReservations.length.toString(), label: 'Reservations today', trend: `${analytics.todayGuests} guests`, accent: '#a36a1f', soft: '#fbf1df', glow: 'rgba(217,154,62,.11)' })}
      ${statCard({ iconName: 'gift', value: `${analytics.returningRate.toFixed(0)}%`, label: 'Returning customer rate', trend: `${analytics.returningCustomers} returning`, accent: '#4d76b8', soft: '#eaf0f9', glow: 'rgba(77,118,184,.09)' })}
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
          ${analytics.openTasks.slice(0, 3).map((task) => `<div class="task-item"><span class="activity-icon" style="--soft:${task.priority === 'High' ? '#faeaea' : '#fbf1df'};--accent:${task.priority === 'High' ? '#c45252' : '#a36a1f'}">${icon(task.type === 'Reservation' ? 'cake' : 'alert')}</span><div class="task-copy"><strong>${escapeHtml(task.title)}</strong><p>${escapeHtml(task.details)}${task.dueAt ? ` · Due ${displayTime(task.dueAt)}` : ''}</p></div><button class="btn btn-small" data-action="complete-task" data-id="${task.id}">Resolve</button></div>`).join('') || '<div class="empty-state"><p>No open tasks. Nice work.</p></div>'}
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
  const eventColors = { Confirmed: ['#205243', '#edf5f2'], Pending: ['#a36a1f', '#fbf1df'], Completed: ['#4d76b8', '#eaf0f9'], 'No-show': ['#c45252', '#faeaea'] };
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
    ['Platinum', `${inr(settings.tier_platinum || 35000)} lifetime spend · 2× points`, '#f4e8f0', '#7a2f62', 'award'],
    ['Gold', `${inr(settings.tier_gold || 18000)} lifetime spend · 1.5× points`, '#fbf1df', '#a36a1f', 'award'],
    ['Silver', `${inr(settings.tier_silver || 8000)} lifetime spend · 1.2× points`, '#eef1f2', '#637077', 'award'],
    ['Member', 'Joined the Circle · 1× points', '#edf5f2', '#205243', 'users'],
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
        ${data.rewards.map((reward, index) => `<tr><td><div class="customer-cell"><span class="activity-icon" style="--soft:${index % 2 ? '#edf5f2' : '#f4e8f0'};--accent:${index % 2 ? '#205243' : '#7a2f62'}">${icon(index % 2 ? 'coffee' : 'gift')}</span><div><strong>${escapeHtml(reward.name)}</strong><span>${escapeHtml(reward.description)}</span></div></div></td><td><strong>${reward.points ? `${reward.points.toLocaleString('en-IN')} points` : 'Complimentary'}</strong></td><td>${escapeHtml(reward.eligibility)}</td><td>${reward.redemptions}</td><td>${escapeHtml(reward.expiry)}</td><td>${statusPill(reward.status)}</td><td><button class="icon-btn" style="width:30px;height:30px">${icon('more')}</button></td></tr>`).join('') || '<tr><td colspan="7">No rewards created yet.</td></tr>'}
      </tbody></table></div>
    </article>`;
}

function renderCampaigns() {
  const analytics = calculateAnalytics();
  const actions = `<button class="btn" data-action="compose-message">${icon('send')} Quick message</button><button class="btn btn-primary" data-action="new-campaign">${icon('plus')} New campaign</button>`;
  return `
    ${pageHeader('Customer engagement', 'Campaigns', 'Create relevant, consent-aware messages and understand which campaigns bring guests back.', actions)}
    <div class="mini-stats">
      <div class="mini-stat"><span>Messages this month</span><strong>${analytics.totalAudience.toLocaleString('en-IN')}</strong></div>
      <div class="mini-stat"><span>Average open rate</span><strong>${analytics.averageOpenRate.toFixed(1)}%</strong></div>
      <div class="mini-stat"><span>Offer redemptions</span><strong>${analytics.totalRedemptions}</strong></div>
      <div class="mini-stat"><span>Attributed revenue</span><strong>${inr(analytics.campaignRevenue)}</strong></div>
    </div>
    <div class="toolbar"><div class="toolbar-search">${icon('search')}<input id="campaign-search" placeholder="Search campaigns" /></div><select><option>All channels</option><option>WhatsApp</option><option>Email</option></select><select><option>All statuses</option><option>Active</option><option>Scheduled</option><option>Draft</option></select></div>
    <section class="campaign-grid" id="campaign-grid">
      ${data.campaigns.map((campaign) => `
        <article class="campaign-card" data-campaign-card data-search="${campaign.name.toLowerCase()}">
          <div class="campaign-visual" style="--campaign-bg:${campaign.bg}"><span class="campaign-channel">${icon(campaign.channel.includes('WhatsApp') ? 'whatsapp' : 'mail')} ${campaign.channel}</span><h3>${campaign.name}</h3></div>
          <div class="campaign-body">
            <div class="campaign-meta">${statusPill(campaign.status)}<span class="campaign-date">${campaign.date}</span></div>
            <div class="campaign-metrics"><div class="campaign-metric"><span>Audience</span><strong>${campaign.audience || '—'}</strong></div><div class="campaign-metric"><span>Opened</span><strong>${campaign.opened || '—'}</strong></div><div class="campaign-metric"><span>Redeemed</span><strong>${campaign.redeemed || '—'}</strong></div></div>
            <div class="campaign-footer"><span>Attributed revenue</span><strong>${campaign.revenue ? inr(campaign.revenue) : 'Not sent'}</strong>${campaign.status === 'Draft' ? `<button class="btn btn-small" data-action="send-campaign" data-id="${campaign.id}">Prepare send</button>` : ''}</div>
          </div>
        </article>`).join('')}
    </section>`;
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
            ${analytics.ratingCounts.map(({ rating, count }) => { const value = data.feedback.length ? count / data.feedback.length * 100 : 0; return `<div class="rating-bar"><span>${rating} ★</span><div class="progress-track"><div class="progress-fill" style="width:${value}%;--fill:${rating > 3 ? '#286b57' : rating === 3 ? '#d99a3e' : '#c45252'}"></div></div><strong>${value.toFixed(0)}%</strong></div>`; }).join('')}
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
  const metrics = data.monthlyMetrics || [];
  const revenueValues = metrics.map((item) => Number(item.revenue || 0));
  const labels = metrics.map((item) => new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(`${item.month}-01T12:00:00`)));
  const tierColors = { Member: '#7a2f62', Silver: '#286b57', Gold: '#d99a3e', Platinum: '#dfe5e1' };
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
    ${pageHeader('Performance intelligence', 'Reports & insights', 'Understand which guests return, what they value and which actions create measurable revenue.', actions)}
    <section class="stat-grid">
      ${statCard({ iconName: 'rupee', value: inr(analytics.lifetimeRevenue), label: 'Customer lifetime revenue', trend: `${inr(analytics.monthRevenue)} this month`, accent: '#205243', soft: '#edf5f2', glow: 'rgba(32,82,67,.09)' })}
      ${statCard({ iconName: 'users', value: `${analytics.returningRate.toFixed(0)}%`, label: 'Returning customer rate', trend: `${analytics.returningCustomers} customers`, accent: '#7a2f62', soft: '#f4e8f0', glow: 'rgba(122,47,98,.08)' })}
      ${statCard({ iconName: 'wallet', value: inr(analytics.averageSpend), label: 'Average known-guest spend', trend: `${analytics.totalCustomers} profiles`, accent: '#a36a1f', soft: '#fbf1df', glow: 'rgba(217,154,62,.11)' })}
      ${statCard({ iconName: 'target', value: `${analytics.campaignConversion.toFixed(1)}%`, label: 'Campaign conversion', trend: `${analytics.totalRedemptions} redemptions`, accent: '#4d76b8', soft: '#eaf0f9', glow: 'rgba(77,118,184,.09)' })}
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
      <article class="report-card"><div class="report-card-top"><h3>Guest retention</h3><span class="activity-icon">${icon('users')}</span></div><p>Customers with two or more visits</p><div class="report-number">${analytics.returningRate.toFixed(1)}%</div><div class="progress-track"><div class="progress-fill" style="width:${analytics.returningRate}%;--fill:#286b57"></div></div><p class="report-note">${analytics.returningCustomers} returning customers</p></article>
      <article class="report-card"><div class="report-card-top"><h3>Loyalty engagement</h3><span class="activity-icon" style="--soft:#f4e8f0;--accent:#7a2f62">${icon('gift')}</span></div><p>Current member point balances</p><div class="report-number">${analytics.totalPoints.toLocaleString('en-IN')}</div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, analytics.activeMembers / Math.max(1, analytics.totalCustomers) * 100)}%;--fill:#7a2f62"></div></div><p class="report-note">${analytics.totalRewardRedemptions} recorded reward redemptions</p></article>
      <article class="report-card"><div class="report-card-top"><h3>Reservations</h3><span class="activity-icon" style="--soft:#eaf0f9;--accent:#4d76b8">${icon('calendar')}</span></div><p>Completed stored bookings</p><div class="report-number">${completed}</div><div class="progress-track"><div class="progress-fill" style="width:${completedRate}%;--fill:#4d76b8"></div></div><p class="report-note">${completedRate.toFixed(0)}% completed vs no-show</p></article>
      <article class="report-card"><div class="report-card-top"><h3>Service recovery</h3><span class="activity-icon" style="--soft:#fbf1df;--accent:#a36a1f">${icon('checkCircle')}</span></div><p>Feedback cases resolved</p><div class="report-number">${recoveryRate.toFixed(0)}%</div><div class="progress-track"><div class="progress-fill" style="width:${recoveryRate}%;--fill:#d99a3e"></div></div><p class="report-note">${analytics.openFeedback} case${analytics.openFeedback === 1 ? '' : 's'} still open</p></article>
    </section>`;
}

function renderSettings() {
  const settings = data.settings || {};
  const tab = state.settingsTab;
  const isOwner = data.user?.role === 'Owner';
  const saveTabs = ['profile', 'loyalty', 'data'];
  const headerAction = saveTabs.includes(tab) ? `<button class="btn btn-primary" data-action="save-settings">${icon('check')} Save changes</button>` : '';
  const nav = [
    ['profile', 'building', 'Cafe profile'], ['team', 'users', 'Team & permissions'],
    ['loyalty', 'gift', 'Loyalty rules'], ['integrations', 'link', 'Communication'],
    ['security', 'shield', 'Privacy & security'], ['data', 'database', 'Data & backups'],
  ];
  const integration = data.integrations || {};
  const content = {
    profile: `
      <div class="form-section"><h3>Cafe profile</h3><p>These details appear in guest messages, loyalty cards and booking confirmations.</p><div class="form-grid"><div class="field"><label>Business name</label><input id="setting-business-name" value="${escapeHtml(settings.business_name || '')}" /></div><div class="field"><label>Primary phone</label><input id="setting-primary-phone" value="${escapeHtml(settings.primary_phone || '')}" /></div><div class="field full"><label>Address</label><input id="setting-address" value="${escapeHtml(settings.address || '')}" /></div><div class="field"><label>Timezone</label><select id="setting-timezone"><option>${escapeHtml(settings.timezone || 'Asia/Kolkata (IST)')}</option></select></div><div class="field"><label>Currency</label><select id="setting-currency"><option>${escapeHtml(settings.currency || 'Indian Rupee (₹)')}</option></select></div></div></div>
      <div class="form-section"><h3>Guest experience defaults</h3><p>Operational rules applied to new activity.</p><div class="switch-row"><div class="switch-copy"><strong>Automatically award loyalty points</strong><span>Award points using the configured earning rate.</span></div><button id="setting-automatic-points" class="switch ${settings.automatic_points ? 'on' : ''}" data-action="toggle-switch" aria-label="Toggle automatic points"></button></div><div class="switch-row"><div class="switch-copy"><strong>Reservation reminders</strong><span>Prepare reminder messages for confirmed bookings.</span></div><button id="setting-reservation-reminders" class="switch ${settings.reservation_reminders ? 'on' : ''}" data-action="toggle-switch" aria-label="Toggle reservation reminders"></button></div><div class="switch-row"><div class="switch-copy"><strong>Marketing requires explicit opt-in</strong><span>Block marketing messages without recorded permission.</span></div><button id="setting-marketing-consent" class="switch ${settings.marketing_requires_consent ? 'on' : ''}" data-action="toggle-switch" aria-label="Toggle marketing consent"></button></div></div>`,
    team: `
      <div class="form-section"><div class="section-heading-row"><div><h3>Team access</h3><p>Server-enforced roles: Owner, Manager and Host.</p></div>${isOwner ? `<button class="btn btn-primary" data-action="invite-staff">${icon('userPlus')} Add staff member</button>` : ''}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Staff member</th><th>Role</th><th>Last sign-in</th><th>Status</th><th></th></tr></thead><tbody>${data.users.map((member) => `<tr><td><div class="customer-cell"><span class="avatar" style="--avatar:#205243">${initials(member.name)}</span><div><strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(member.email)}</span></div></div></td><td>${escapeHtml(member.role)}</td><td>${member.lastLoginAt ? relativeTime(member.lastLoginAt) + ' ago' : 'Never'}</td><td>${statusPill(member.active ? 'Active' : 'Disabled')}</td><td>${isOwner && member.id !== data.user.id ? `<button class="btn btn-small" data-action="toggle-user" data-id="${member.id}">${member.active ? 'Disable' : 'Enable'}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`,
    loyalty: `
      <div class="form-section"><h3>Loyalty earning and tiers</h3><p>Thresholds are based on recorded lifetime spend.</p><div class="form-grid"><div class="field"><label>Points per ₹1</label><input id="setting-points-rate" type="number" min="0" step="0.01" value="${Number(settings.points_per_rupee ?? 0.1)}" /></div><div class="field"><label>Silver threshold</label><input id="setting-tier-silver" type="number" min="0" value="${Number(settings.tier_silver || 8000)}" /></div><div class="field"><label>Gold threshold</label><input id="setting-tier-gold" type="number" min="0" value="${Number(settings.tier_gold || 18000)}" /></div><div class="field"><label>Platinum threshold</label><input id="setting-tier-platinum" type="number" min="0" value="${Number(settings.tier_platinum || 35000)}" /></div></div></div><div class="form-section"><h3>Points controls</h3><p>Every manual change is recorded in the local audit ledger.</p><button class="btn" data-action="adjust-points">${icon('edit')} Adjust customer points</button></div>`,
    integrations: `
      <div class="form-section"><h3>Communication channels</h3><p>Without credentials, messages are safely recorded in the local demo outbox. Add environment credentials to switch a channel to live mode.</p><div class="switch-row"><div class="switch-copy"><strong>WhatsApp Business</strong><span>${escapeHtml(integration.whatsapp?.provider || 'Local outbox')}</span></div>${statusPill(integration.whatsapp?.mode || 'Demo')}</div><div class="switch-row"><div class="switch-copy"><strong>Email</strong><span>${escapeHtml(integration.email?.provider || 'Local outbox')}</span></div>${statusPill(integration.email?.mode || 'Demo')}</div><div class="switch-row"><div class="switch-copy"><strong>POS customer import</strong><span>${escapeHtml(integration.pos?.provider || 'CSV import')}</span></div>${statusPill(integration.pos?.mode || 'Ready')}</div></div><div class="form-section"><div class="section-heading-row"><div><h3>Recent outbox</h3><p>Consent-aware communication audit trail.</p></div><button class="btn" data-action="compose-message">${icon('send')} New message</button></div>${data.communications.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Channel</th><th>Recipient</th><th>Purpose</th><th>Provider</th><th>Status</th></tr></thead><tbody>${data.communications.slice(0, 10).map((item) => `<tr><td>${escapeHtml(item.channel)}</td><td>${escapeHtml(item.recipient)}</td><td>${escapeHtml(item.purpose)}</td><td>${escapeHtml(item.provider)}</td><td>${statusPill(item.status)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state compact"><p>No messages have been sent or queued yet.</p></div>'}</div>`,
    security: `
      <div class="form-section"><h3>Account security</h3><p>Sessions expire after 12 hours and passwords are stored with PBKDF2 hashing.</p><div class="security-callout">${icon('shield')}<div><strong>Signed in as ${escapeHtml(data.user?.email || '')}</strong><span>${escapeHtml(data.user?.role || '')} permissions are enforced by the local API.</span></div></div><button class="btn" data-action="change-password">${icon('lock')} Change password</button> <button class="btn" data-action="logout">Sign out</button></div>`,
    data: `
      <div class="form-section"><h3>Import and export</h3><p>Use UTF-8 CSV from the cafe POS. Name and phone are required; common column names are detected automatically.</p><div class="button-row"><button class="btn" data-action="import-customers">${icon('download')} Import customer CSV</button><button class="btn" data-action="download-customers">${icon('download')} Export customers</button><button class="btn" data-action="export-report">${icon('chart')} Export report</button></div></div>
      <div class="form-section"><h3>Automatic backups</h3><p>A daily SQLite backup is retained locally. Manual backups and restores require Owner access.</p><div class="switch-row"><div class="switch-copy"><strong>Daily backups</strong><span>Stored inside the project backups folder.</span></div><button id="setting-backup-enabled" class="switch ${settings.backup_enabled ? 'on' : ''}" data-action="toggle-switch" aria-label="Toggle daily backups"></button></div><div class="field" style="max-width:220px"><label>Retention (days)</label><input id="setting-backup-retention" type="number" min="1" max="365" value="${Number(settings.backup_retention_days || 30)}" /></div>${isOwner ? `<div class="button-row"><button class="btn btn-primary" data-action="create-backup">${icon('database')} Create backup now</button></div>` : ''}</div>
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
  return `<main class="login-shell"><section class="login-card"><div class="login-brand"><div class="brand-mark">${icon('coffee')}</div><div><strong>Mangosteen</strong><span>Guest CRM</span></div></div><div class="login-copy"><span class="eyebrow">Secure staff workspace</span><h1>Welcome back</h1><p>Sign in to manage guests, reservations, loyalty and communication.</p></div>${dataError ? `<div class="form-error">${escapeHtml(dataError)}</div>` : ''}<form id="login-form"><div class="field"><label>Email address</label><input name="email" type="email" autocomplete="username" required value="owner@mangosteen.local" /></div><div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required value="Mangosteen@123" /></div><button class="btn btn-primary login-button" type="submit">${icon('lock')} Sign in securely</button></form><div class="login-demo"><strong>Demo owner account</strong><span>Credentials are prefilled for this local client review. Change the password in Settings before entering real data.</span></div></section><aside class="login-visual"><div><span class="eyebrow">Mangosteen Cafe · Indore</span><h2>Premium guest relationships, without losing the personal touch.</h2><p>Local-first customer profiles, reservations, rewards, feedback recovery and consent-aware communication.</p></div></aside></main>`;
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
    <div class="task-list" style="margin-top:12px"><div class="task-item"><span class="activity-icon">${icon('coffee')}</span><div class="task-copy"><strong>Relationship summary</strong><p>${customer.visits} visits · ${inr(customer.monthSpend || 0)} linked this month · ${customer.points} points available</p></div></div><div class="task-item"><span class="activity-icon" style="--soft:#f4e8f0;--accent:#7a2f62">${icon('shield')}</span><div class="task-copy"><strong>Communication status</strong><p>${customer.consent ? 'Marketing opt-in is recorded.' : 'Only transactional communication is allowed.'}</p></div></div></div>`, `<button class="btn" data-action="close-modal">Close</button><button class="btn btn-primary" data-action="message-customer" data-id="${customer.id}">${icon('whatsapp')} Message guest</button>`);
}

function openReservationForm() {
  openModal('New reservation', 'Reserve a table and capture the details that make the visit special.', `
    <form id="reservation-form"><div class="form-grid"><div class="field"><label>Guest name *</label><input name="name" required placeholder="Search or enter guest" /></div><div class="field"><label>Mobile number *</label><input name="phone" required placeholder="+91" /></div><div class="field"><label>Date *</label><input name="date" type="date" required value="${localDateKey()}" /></div><div class="field"><label>Time *</label><input name="time" type="time" required value="19:00" /></div><div class="field"><label>Number of guests</label><input name="guests" type="number" min="1" max="30" value="2" /></div><div class="field"><label>Table preference</label><select name="table"><option>Best available</option><option>Window</option><option>Garden</option><option>Indoor</option><option>Private area</option></select></div><div class="field"><label>Occasion</label><select name="occasion"><option>Regular visit</option><option>Birthday</option><option>Anniversary</option><option>Business meeting</option><option>Celebration</option></select></div><div class="field"><label>Status</label><select name="status"><option>Confirmed</option><option>Pending</option></select></div><div class="field full"><label>Special requests</label><textarea name="notes" placeholder="Cake, allergies, accessibility or seating notes"></textarea></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="reservation-form">${icon('check')} Confirm reservation</button>`);
}

function openCampaignForm() {
  openModal('Create campaign', 'Build a targeted message for guests who have opted in.', `
    <form id="campaign-form"><div class="form-grid"><div class="field full"><label>Campaign name *</label><input name="name" required placeholder="e.g. Sunday brunch invitation" /></div><div class="field"><label>Channel</label><select name="channel"><option>WhatsApp</option><option>Email</option><option>Email + WhatsApp</option></select></div><div class="field"><label>Audience</label><select name="audience"><option>All opted-in guests</option><option>VIP & Platinum</option><option>Inactive 30+ days</option><option>Birthday this month</option><option>Custom segment</option></select></div><div class="field full"><label>Message</label><textarea name="message" required placeholder="Write a concise, valuable message with a clear opt-out path."></textarea></div><div class="field"><label>Send</label><select name="send"><option>Save as draft</option><option>Schedule</option><option>Send after approval</option></select></div><div class="field"><label>Offer code</label><input name="offer" placeholder="Optional" /></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="campaign-form">${icon('check')} Save campaign</button>`);
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
  openModal('Notifications', 'Important activity requiring your attention.', `<div class="task-list"><div class="task-item"><span class="activity-icon" style="--soft:#faeaea;--accent:#c45252">${icon('alert')}</span><div class="task-copy"><strong>${analytics.openFeedback} feedback case${analytics.openFeedback === 1 ? '' : 's'} need attention</strong><p>Create recovery tasks and record the outcome.</p></div>${statusPill(analytics.openFeedback ? 'High' : 'Resolved')}</div><div class="task-item"><span class="activity-icon" style="--soft:#fbf1df;--accent:#a36a1f">${icon('calendar')}</span><div class="task-copy"><strong>${pending.length} reservation${pending.length === 1 ? '' : 's'} awaiting confirmation</strong><p>${pending[0] ? `${escapeHtml(pending[0].name)} · ${pending[0].guests} guests · ${displayTime(pending[0].time)}` : 'All current bookings are confirmed.'}</p></div>${statusPill(pending.length ? 'Pending' : 'Resolved')}</div><div class="task-item"><span class="activity-icon" style="--soft:#edf5f2;--accent:#205243">${icon('database')}</span><div class="task-copy"><strong>Local database connected</strong><p>${data.customers.length} customers and ${data.reservations.length} reservations are stored.</p></div>${statusPill('Active')}</div></div>`, `<button class="btn btn-primary" data-action="close-modal">Got it</button>`);
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

function openStaffForm() {
  openModal('Add staff member', 'Create a secure account with the minimum required access.', `<form id="staff-form"><div class="form-grid"><div class="field"><label>Full name</label><input name="name" required /></div><div class="field"><label>Email</label><input name="email" type="email" required /></div><div class="field"><label>Role</label><select name="role"><option>Host</option><option>Manager</option><option>Owner</option></select></div><div class="field"><label>Temporary password</label><input name="password" type="password" minlength="10" required /></div></div><div class="role-guide"><div><strong>Host</strong><span>Customers, reservations and feedback.</span></div><div><strong>Manager</strong><span>Campaigns, loyalty, imports and settings.</span></div><div><strong>Owner</strong><span>Team, backups and reset controls.</span></div></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="staff-form">${icon('userPlus')} Create account</button>`);
}

function openPasswordForm() {
  openModal('Change password', 'Use a unique password with at least 10 characters, letters and numbers.', `<form id="password-form"><div class="field"><label>Current password</label><input name="currentPassword" type="password" required /></div><div class="field" style="margin-top:12px"><label>New password</label><input name="newPassword" type="password" minlength="10" required /></div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="password-form">${icon('lock')} Update password</button>`);
}

function openProfileMenu() {
  openModal('Your account', `${escapeHtml(data.user?.role || '')} workspace`, `<div class="customer-profile-head"><span class="avatar" style="--avatar:#205243">${initials(data.user?.name || 'Staff')}</span><div><h3>${escapeHtml(data.user?.name || '')}</h3><p>${escapeHtml(data.user?.email || '')}</p>${statusPill('Active')}</div></div><div class="role-guide"><div><strong>Session protection</strong><span>Automatic expiry after 12 hours.</span></div><div><strong>Role</strong><span>${escapeHtml(data.user?.role || '')} permissions enforced by the API.</span></div></div>`, `<button class="btn" data-action="change-password">${icon('lock')} Change password</button><button class="btn btn-primary" data-action="logout">Sign out</button>`);
}

function openFeedbackLink() {
  const url = data.settings.feedback_url || 'http://127.0.0.1:4173/feedback';
  openModal('Feedback collection link', 'Use this link in table QR artwork, receipts or follow-up messages.', `<div class="share-link"><input id="feedback-link" readonly value="${escapeHtml(url)}" /><button class="btn" data-action="copy-feedback-link">Copy link</button></div><div class="form-notice">Set the final public URL in Settings before printing table materials.</div>`, `<button class="btn btn-primary" data-action="close-modal">Done</button>`);
}

function openCampaignSend(campaignId) {
  const campaign = data.campaigns.find((item) => item.id === Number(campaignId));
  if (!campaign) return;
  const audience = data.customers.filter((customer) => customer.consent && (campaign.channel.includes('Email') ? customer.email : customer.phone));
  openModal('Prepare campaign send', 'Only customers with recorded marketing consent are included.', `<form id="campaign-send-form"><input type="hidden" name="campaignId" value="${campaign.id}" /><div class="profile-facts"><div class="profile-fact"><span>Campaign</span><strong>${escapeHtml(campaign.name)}</strong></div><div class="profile-fact"><span>Channel</span><strong>${escapeHtml(campaign.channel)}</strong></div><div class="profile-fact"><span>Eligible audience</span><strong>${audience.length}</strong></div></div><div class="field"><label>Confirmation</label><input name="confirmation" required placeholder="Type SEND to confirm" /></div><div class="form-notice">In Demo mode, messages go to the local outbox. If live provider credentials are configured, this action sends real messages.</div></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="campaign-send-form">${icon('send')} Send campaign</button>`);
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
    } else if (action === 'add-customer') openAddCustomer();
    else if (action === 'view-customer') openCustomerProfile(target.dataset.id || target.closest('[data-id]')?.dataset.id);
    else if (action === 'add-reservation') openReservationForm();
    else if (action === 'new-campaign') openCampaignForm();
    else if (action === 'notifications') openNotifications();
    else if (action === 'retry-data') { await loadData(); renderApp(); }
    else if (action === 'reset-demo') { if (!window.confirm('Reset all CRM demo records? A safety backup will not be created by this action.')) return; target.disabled = true; await api('/api/reset', { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Sample database has been rebuilt.'); }
    else if (action === 'complete-task') { target.disabled = true; await api(`/api/tasks/${target.dataset.id}/complete`, { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Task marked complete.'); }
    else if (action === 'resolve-feedback') { target.disabled = true; await api(`/api/feedback/${target.dataset.id}/recovery`, { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Recovery task created and stored.'); }
    else if (action === 'toggle-switch') target.classList.toggle('on');
    else if (action === 'export-report') { downloadFrom('/api/export/report.csv'); showToast('Report CSV download started.'); }
    else if (action === 'download-customers') { downloadFrom('/api/export/customers.csv'); showToast('Customer export started.'); }
    else if (action === 'settings-tab') { state.settingsTab = target.dataset.tab; refreshPage(); }
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
    else if (action === 'send-campaign') openCampaignSend(target.dataset.id);
    else if (action === 'reservation-detail') openReservationDetail(target.dataset.id);
    else if (action === 'import-customers') openImportCustomers();
    else if (action === 'invite-staff') openStaffForm();
    else if (action === 'toggle-user') { target.disabled = true; await api(`/api/users/${target.dataset.id}/toggle`, { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Staff access updated.'); }
    else if (action === 'change-password') openPasswordForm();
    else if (action === 'logout') { await api('/api/auth/logout', { method: 'POST', body: '{}' }); authState = 'anonymous'; data = { customers: [], reservations: [], campaigns: [], feedback: [], tasks: [], rewards: [], activities: [], monthlyMetrics: [], settings: {} }; closeModal(); renderApp(); }
    else if (action === 'create-backup') { target.disabled = true; await api('/api/backups', { method: 'POST', body: '{}' }); await syncAndRender(); showToast('Local backup created.'); }
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
  if (event.target.id === 'campaign-search') {
    const query = event.target.value.trim().toLowerCase();
    document.querySelectorAll('[data-campaign-card]').forEach((card) => { card.style.display = !query || card.dataset.search.includes(query) ? '' : 'none'; });
  }
});

document.getElementById('app').addEventListener('change', (event) => {
  if (event.target.id === 'customer-tier') filterCustomers();
});

document.getElementById('app').addEventListener('keydown', (event) => {
  if (event.target.id === 'global-search' && event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query) {
      state.page = 'customers';
      state.customerQuery = query;
      refreshPage();
      window.setTimeout(() => filterCustomers(), 0);
    }
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
    if (form.id === 'customer-form') {
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
    } else if (form.id === 'campaign-form') {
      await api('/api/campaigns', { method: 'POST', body: JSON.stringify(values) });
      closeModal();
      state.page = 'campaigns';
      await syncAndRender();
      showToast(`Campaign “${values.name}” saved as a draft.`);
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
    } else if (form.id === 'campaign-send-form') {
      if (values.confirmation !== 'SEND') throw new Error('Type SEND exactly to confirm the campaign.');
      const campaign = data.campaigns.find((item) => item.id === Number(values.campaignId));
      const channel = campaign.channel.includes('WhatsApp') ? 'WhatsApp' : 'Email';
      const audience = data.customers.filter((customer) => customer.consent && (channel === 'Email' ? customer.email : customer.phone));
      let queued = 0;
      for (const customer of audience) {
        await api('/api/communications/send', { method: 'POST', body: JSON.stringify({ customerId: customer.id, channel, recipient: channel === 'Email' ? customer.email : customer.phone, subject: campaign.name, message: campaign.message, purpose: 'Marketing' }) });
        queued += 1;
      }
      await api(`/api/campaigns/${campaign.id}/sent`, { method: 'POST', body: JSON.stringify({ audience: queued }) });
      closeModal();
      await syncAndRender();
      showToast(`${queued} consented guest message${queued === 1 ? '' : 's'} processed.`);
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
