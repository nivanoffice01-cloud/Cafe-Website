const bookingStatuses = ['Pending', 'Confirmed', 'Checked in', 'Completed', 'No-show', 'Cancelled'];
const floorButton = (label, action, id = '', primary = false) => `<button type="button" class="btn ${primary ? 'btn-primary' : ''}" data-floor-action="${action}" data-id="${escapeHtml(String(id))}">${label}</button>`;
const bookingBadge = (status) => `<span class="floor-badge" data-status="${escapeHtml(status)}">${escapeHtml(status)}</span>`;
const bookingTables = () => data.tables || [];
const bookingDate = () => state.reservationDate || localDateKey();
const visitStaff = (table) => (data.floorStaff || []).find(s => String(s.id) === String(table.waiterId))?.name || 'Unassigned';

function renderTableBoard() {
  const tables = bookingTables();
  const visible = tables.filter(t => (!state.floorZone || t.zone === state.floorZone) && (!state.floorStatus || t.displayStatus === state.floorStatus));
  const linkedOrders = new Set(tables.flatMap(t => t.openOrders.map(o => o.id)));
  const unmapped = (data.orders || []).filter(o => !['Paid', 'Cancelled'].includes(o.status) && !linkedOrders.has(o.id));
  return `${pageHeader('Floor service', 'Live tables', 'Seat guests, assign your team and keep every table ready for its next visit.', floorButton('Refresh', 'refresh') + `<button class="btn" data-page="waitlist">Waiting list (${(data.waitlist || []).filter(e => ['Waiting','Called'].includes(e.status)).length})</button><button class="btn" data-page="reservations">Reservations</button>`)}
    <div class="mini-stats">${['Available', 'Reserved', 'Occupied', 'Cleaning'].map(status => `<div class="mini-stat"><span>${status}</span><strong>${tables.filter(t => t.displayStatus === status).length}</strong></div>`).join('')}</div>
    <div class="toolbar floor-toolbar"><label>Area <select id="floor-zone"><option value="">All areas</option>${[...new Set(tables.map(t => t.zone))].map(zone => `<option ${zone === state.floorZone ? 'selected' : ''}>${escapeHtml(zone)}</option>`).join('')}</select></label><label>Status <select id="floor-status"><option value="">All tables</option>${['Available', 'Reserved', 'Occupied', 'Cleaning'].map(s => `<option ${s === state.floorStatus ? 'selected' : ''}>${s}</option>`).join('')}</select></label><span class="floor-refresh-note">Updates every 15 seconds</span></div>
    ${unmapped.length ? `<div class="floor-import-note"><span>${unmapped.length} open order${unmapped.length === 1 ? '' : 's'} use other table names: ${[...new Set(unmapped.map(o => escapeHtml(o.table)))].join(', ')}.</span><button class="btn btn-small" data-page="orders">View orders</button></div>` : ''}
    <section class="floor-grid" aria-label="Live table board">${visible.map(t => `<article class="panel floor-card" data-table-id="${escapeHtml(t.id)}" data-status="${escapeHtml(t.displayStatus)}">
      <div class="floor-card-top"><div><h2>${escapeHtml(t.label)}</h2><p>${escapeHtml(t.zone)} · ${t.capacity} seats</p></div>${bookingBadge(t.displayStatus)}</div>
      <div class="floor-visit"><strong>${escapeHtml(t.session?.name || (t.openOrders.length ? 'Order in progress' : 'No guests seated'))}</strong><span>${t.session ? `${t.session.guests ? `${t.session.guests} guests · ` : ''}Seated ${relativeTime(t.session.startedAt)} ago` : t.status === 'Cleaning' ? 'Prepare the table for the next guests' : t.openOrders.length ? 'Visit in progress' : 'Ready for your floor team'}</span></div>
      <dl class="floor-facts"><div><dt>Assigned staff</dt><dd>${escapeHtml(visitStaff(t))}</dd></div><div><dt>Open bill</dt><dd>${inr(t.runningBill)}</dd></div></dl>
      ${t.openOrders.length ? `<p class="floor-note">${t.openOrders.map(o => `#${o.id} · ${escapeHtml(o.status)}${o.paid ? ' · Paid' : ''}`).join(' / ')}</p>` : ''}
      <div class="floor-bookings">${t.reservations.length ? t.reservations.map(r => `<button class="floor-booking" data-action="reservation-detail" data-id="${r.id}"><span>${displayTime(r.time)} · ${escapeHtml(r.name)}</span>${bookingBadge(r.status)}</button>`).join('') : '<p>No bookings today</p>'}</div>
      <div class="floor-actions">${floorButton('Assign staff', 'assign', t.id)}${t.status === 'Cleaning' ? floorButton('Mark available', 'available', t.id, true) : t.session || t.openOrders.length ? floorButton('Check out', 'checkout', t.id, true) : t.displayStatus === 'Available' || t.displayStatus === 'Reserved' ? floorButton('Seat walk-in', 'seat', t.id, true) : ''}</div>
    </article>`).join('') || '<div class="empty-state"><p>No tables match these filters.</p></div>'}</section>`;
}

function bookingCard(r) {
  return `<button type="button" class="calendar-event" data-action="reservation-detail" data-id="${r.id}" style="--accent:${r.status === 'Pending' ? '#ad7b32' : '#39735a'};--soft:${r.status === 'Pending' ? '#faf1dc' : '#eaf3ed'}"><strong>${displayTime(r.time)} · ${escapeHtml(r.name)}</strong><span>${r.guests} guests · ${escapeHtml(r.table)}</span>${bookingBadge(r.status)}</button>`;
}

function renderFloorReservations() {
  const date = bookingDate();
  const base = new Date(`${date}T12:00:00`);
  const days = Array.from({ length: 5 }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + i - 1); return { key: localDateKey(d), label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) }; });
  const inRange = data.reservations.filter(r => r.date >= days[0].key && r.date <= days[4].key && (!state.bookingStatus || r.status === state.bookingStatus));
  const selected = data.reservations.filter(r => r.date === date && (!state.bookingStatus || r.status === state.bookingStatus)).sort((a,b) => a.time.localeCompare(b.time));
  const live = selected.filter(r => !['Cancelled', 'No-show'].includes(r.status));
  const hours = inRange.map(r => Number(r.time.slice(0,2)));
  const first = Math.min(16, ...hours), last = Math.max(21, ...hours);
  let calendar = '<div class="calendar-head">Time</div>' + days.map(d => `<div class="calendar-head ${d.key === date ? 'selected-date' : ''}">${escapeHtml(d.label)}</div>`).join('');
  for (let h = first; h <= last; h++) {
    calendar += `<div class="calendar-time">${displayTime(`${String(h).padStart(2,'0')}:00`)}</div>`;
    for (const d of days) { const events = inRange.filter(r => r.date === d.key && Number(r.time.slice(0,2)) === h).sort((a,b) => a.time.localeCompare(b.time)); calendar += `<div class="calendar-cell ${events.length > 1 ? 'has-multiple' : ''}">${events.map(bookingCard).join('')}</div>`; }
  }
  const list = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Arrival</th><th>Guest</th><th>Table</th><th>Party / duration</th><th>Status</th><th></th></tr></thead><tbody>${selected.map(r => `<tr><td>${displayTime(r.time)}</td><td><strong>${escapeHtml(r.name)}</strong><br>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.table)}</td><td>${r.guests} guests · ${r.duration || 90} min</td><td>${bookingBadge(r.status)}</td><td>${floorButton('View / manage', 'detail', r.id)}</td></tr>`).join('') || '<tr><td colspan="6">No reservations match this date and status.</td></tr>'}</tbody></table></div>`;
  return `${pageHeader('Bookings & celebrations', 'Reservations', 'Manage bookings, table assignments and guest arrivals.', `<button class="btn" data-page="tables">Live tables</button>${floorButton('New reservation', 'new', '', true)}`)}
    <div class="mini-stats"><div class="mini-stat"><span>Bookings on selected date</span><strong>${selected.length}</strong></div><div class="mini-stat"><span>Expected guests</span><strong>${live.reduce((n,r) => n + r.guests, 0)}</strong></div><div class="mini-stat"><span>Awaiting confirmation</span><strong>${selected.filter(r => r.status === 'Pending').length}</strong></div><div class="mini-stat"><span>Checked in</span><strong>${selected.filter(r => r.status === 'Checked in').length}</strong></div></div>
    <div class="toolbar floor-toolbar"><div class="segment-control">${['Calendar','List'].map(view => `<button class="${state.reservationView === view ? 'active' : ''}" data-floor-action="view" data-id="${view}">${view}</button>`).join('')}</div><label>Date <input id="booking-date" type="date" value="${date}"></label><label>Status <select id="booking-status"><option value="">All statuses</option>${bookingStatuses.map(s => `<option ${s === state.bookingStatus ? 'selected' : ''}>${s}</option>`).join('')}</select></label><div class="row-actions">${floorButton('Previous', 'previous')}${floorButton('Today', 'today')}${floorButton('Next', 'next')}${floorButton('Refresh', 'refresh')}</div></div>
    ${state.reservationView === 'List' ? `<article class="panel">${list}</article>` : `<div class="calendar-shell"><article class="panel"><div class="calendar-grid">${calendar}</div></article><article class="panel"><div class="panel-header"><div class="panel-title"><h2>Arrivals</h2><p>${displayDate(date)}</p></div></div><div class="panel-body floor-arrivals">${selected.map(bookingCard).join('') || '<p>No reservations for this date.</p>'}</div></article></div>`}`;
}

function openBookingEditor(id) {
  const r = data.reservations.find(r => r.id === Number(id));
  const options = bookingTables().map(t => `<option value="${escapeHtml(t.id)}" ${r?.tableId === t.id ? 'selected' : ''}>${escapeHtml(t.label)} · ${t.capacity} seats · ${escapeHtml(t.zone)}</option>`).join('');
  openModal(r ? 'Edit / reschedule reservation' : 'New reservation', 'Bookings use 90 minutes by default. Confirmation checks capacity and overlapping visits.', `<form id="booking-editor" data-id="${r?.id || ''}" data-revision="${r?.revision || ''}"><div class="form-grid">
    <div class="field"><label>Guest name *</label><input name="name" required minlength="2" value="${escapeHtml(r?.name || '')}"></div><div class="field"><label>Phone *</label><input name="phone" type="tel" required value="${escapeHtml(r?.phone || '')}"></div>
    <div class="field"><label>Date *</label><input type="date" name="date" required min="${localDateKey()}" value="${r?.date || bookingDate()}"></div><div class="field"><label>Arrival time *</label><input type="time" name="time" required value="${r?.time || '19:00'}"></div>
    <div class="field"><label>Guests *</label><input name="guests" type="number" min="1" max="30" required value="${r?.guests || 2}"></div><div class="field"><label>Visit duration (minutes)</label><input name="duration" type="number" min="15" max="480" required value="${r?.duration || 90}"></div>
    <div class="field"><label>Table</label><select name="tableId"><option value="">Assign later</option>${options}</select></div><div class="field"><label>${r ? 'Current status' : 'Status'}</label>${r ? `<input readonly value="${escapeHtml(r.status)}">` : '<select name="status"><option>Pending</option><option>Confirmed</option></select>'}</div>
    <div class="field full"><label>Occasion</label><input name="occasion" value="${escapeHtml(r?.occasion || 'Regular visit')}"></div><div class="field full"><label>Special requests / notes</label><textarea name="specialRequests">${escapeHtml(r?.specialRequests || '')}</textarea></div></div><p class="form-error" id="booking-form-error" role="alert" hidden></p></form>`, `<button class="btn" data-action="close-modal">Cancel</button><button type="submit" form="booking-editor" class="btn btn-primary">Save reservation</button>`);
}

function openBookingDetail(id) {
  const r = data.reservations.find(r => r.id === Number(id));
  if (!r) return;
  const actions = { Pending: ['Confirmed','Cancelled'], Confirmed: ['Checked in','No-show','Cancelled'], 'Checked in': ['Completed'] }[r.status] || [];
  const labels = { Confirmed: 'Confirm reservation', 'Checked in': 'Check in guests', 'No-show': 'Mark no-show', Cancelled: 'Cancel booking', Completed: 'Check out guests' };
  openModal('Reservation details', `${displayDate(r.date)} · ${displayTime(r.time)} · MG-${String(r.id).padStart(6,'0')}`, `<div class="profile-facts">${[['Guest',r.name],['Phone',r.phone],['Party',`${r.guests} guests`],['Table',r.table],['Duration',`${r.duration || 90} minutes`],['Status',r.status]].map(([label,value]) => `<div class="profile-fact"><span>${label}</span><strong>${escapeHtml(String(value || '—'))}</strong></div>`).join('')}</div><div class="insight-card"><strong>Special requests</strong><p>${escapeHtml(r.specialRequests || 'None')}</p></div><div class="floor-detail-actions">${['Pending','Confirmed'].includes(r.status) ? floorButton('Edit / reschedule', 'edit', r.id) : ''}${actions.map(status => `<button class="btn ${['Confirmed','Checked in','Completed'].includes(status) ? 'btn-primary' : ''}" data-floor-action="status" data-status="${status}" data-id="${r.id}" data-revision="${r.revision}">${labels[status]}</button>`).join('')}</div>${r.history?.length ? `<details class="booking-history"><summary>Booking history</summary>${r.history.slice().reverse().map(h => `<p><strong>${escapeHtml(h.action)}</strong> · ${escapeHtml(h.by)}<br><small>${escapeHtml(new Date(h.at).toLocaleString('en-IN'))}</small>${h.note ? `<br>${escapeHtml(h.note)}` : ''}</p>`).join('')}</details>` : ''}`, '<button class="btn" data-action="close-modal">Close</button>');
}

function openTableAction(id, action) {
  const t = bookingTables().find(t => t.id === id);
  if (!t) return;
  let fields = '';
  if (action === 'assign') fields = `<div class="field"><label>Staff member</label><select name="waiterId"><option value="">Unassigned</option>${(data.floorStaff || []).map(s => `<option value="${s.id}" ${String(t.waiterId) === String(s.id) ? 'selected' : ''}>${escapeHtml(s.name)} · ${escapeHtml(s.jobRole)}</option>`).join('')}</select></div>`;
  if (action === 'seat') fields = `<div class="field"><label>Guest name</label><input name="name" required minlength="2"></div><div class="field"><label>Guests (up to ${t.capacity})</label><input name="guests" required type="number" min="1" max="${t.capacity}" value="2"></div>`;
  const copy = { assign: 'Assign a team member to this table.', seat: 'Seat a walk-in party for a 90-minute visit. Upcoming reservations are checked before saving.', checkout: 'Complete this visit and move the table to Cleaning. Open bills must be settled first.', available: 'Confirm cleaning is finished and this table is ready for guests.' };
  openModal(`${{ assign:'Assign staff', seat:'Seat guests', checkout:'Check out', available:'Mark available' }[action]} · ${escapeHtml(t.label)}`, copy[action], `<form id="table-editor" data-id="${escapeHtml(id)}" data-action="${action}">${fields}<p class="form-error" id="booking-form-error" role="alert" hidden></p></form>`, '<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="table-editor">Confirm</button>');
}

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-floor-action]');
  if (!button) return;
  const { floorAction: action, id } = button.dataset;
  try {
    if (action === 'new' || action === 'edit') return openBookingEditor(id);
    if (action === 'detail') return openBookingDetail(id);
    if (['assign','seat','checkout','available'].includes(action)) return openTableAction(id, action);
    if (action === 'view') state.reservationView = id;
    if (['previous','next','today'].includes(action)) { const d = new Date(`${bookingDate()}T12:00:00`); d.setDate(d.getDate() + (action === 'previous' ? -5 : 5)); state.reservationDate = action === 'today' ? localDateKey() : localDateKey(d); }
    if (action === 'status') {
      const status = button.dataset.status;
      if (['Cancelled','No-show'].includes(status) && !window.confirm(`Mark this booking ${status.toLowerCase()}?`)) return;
      button.disabled = true;
      await api(`/api/reservations/${id}/status`, { method: 'POST', body: JSON.stringify({ status, revision: Number(button.dataset.revision) }) });
      closeModal(); await syncAndRender(); showToast(`Reservation ${status.toLowerCase()}.`); return;
    }
    if (action === 'refresh') { button.disabled = true; await syncAndRender(); } else refreshPage();
  } catch (error) { button.disabled = false; showToast(error.message, 'error'); }
});

document.addEventListener('change', event => {
  if (event.target.matches('.crm-mobile-page')) { state.page = event.target.value; refreshPage(); return; }
  const mapping = { 'floor-zone': 'floorZone', 'floor-status': 'floorStatus', 'booking-date': 'reservationDate', 'booking-status': 'bookingStatus' };
  if (mapping[event.target.id] && event.target.value !== undefined) { state[mapping[event.target.id]] = event.target.value; refreshPage(); }
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (!['booking-editor','table-editor'].includes(form.id)) return;
  event.preventDefault();
  const button = document.querySelector(`[form="${form.id}"][type="submit"]`);
  button.disabled = true;
  try {
    const values = Object.fromEntries(new FormData(form));
    const booking = form.id === 'booking-editor';
    if (booking && form.dataset.revision) values.revision = Number(form.dataset.revision);
    const path = booking ? `/api/reservations${form.dataset.id ? `/${form.dataset.id}/edit` : ''}` : `/api/tables/${form.dataset.id}`;
    if (!booking) values.action = form.dataset.action;
    await api(path, { method: 'POST', body: JSON.stringify(values) });
    closeModal(); await syncAndRender(); showToast(booking ? 'Reservation saved.' : 'Table updated.');
  } catch (error) { const alert = document.getElementById('booking-form-error'); alert.hidden = false; alert.textContent = error.message; button.disabled = false; }
});

let floorRefreshing = false;
setInterval(async () => {
  if (floorRefreshing || document.hidden || authState !== 'authenticated' || !['tables','reservations','waitlist'].includes(state.page) || document.getElementById('modal-root')?.children.length || ['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
  floorRefreshing = true;
  try { await loadData({ quiet: true }); if (!dataError) refreshPage(); } finally { floorRefreshing = false; }
}, 15000);
