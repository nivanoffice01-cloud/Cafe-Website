const waitingActive = entry => ['Waiting', 'Called'].includes(entry.status);
const waitMinutes = entry => Math.max(0, Math.floor((Date.now() - new Date(entry.arrivedAt).getTime()) / 60000));
const waitingButton = (label, action, entry, primary = false) => `<button type="button" class="btn ${primary ? 'btn-primary' : ''}" data-waiting-action="${action}" data-id="${entry?.id || ''}" data-revision="${entry?.revision || ''}">${label}</button>`;
const arrivalClock = date => new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

function renderWaitlist() {
  const all = data.waitlist || [];
  const queue = all.filter(waitingActive).sort((a,b) => a.arrivedAt.localeCompare(b.arrivedAt));
  const history = all.filter(e => !waitingActive(e) && e.date === (state.waitlistDate || localDateKey())).sort((a,b) => b.arrivedAt.localeCompare(a.arrivedAt));
  const isHistory = state.waitlistView === 'History';
  const visible = isHistory ? history : queue;
  return `${pageHeader('Guest arrivals', 'Waiting list', 'Keep track of walk-ins and seat each party when a suitable table is ready.', `<button class="btn" data-page="tables">Live tables</button>${waitingButton('Add walk-in', 'add', null, true)}`)}
    <div class="mini-stats waiting-stats"><div class="mini-stat"><span>Parties waiting</span><strong>${queue.length}</strong></div><div class="mini-stat"><span>Guests waiting</span><strong>${queue.reduce((sum,e) => sum + e.guests, 0)}</strong></div><div class="mini-stat"><span>Longest wait</span><strong>${queue.length ? Math.max(...queue.map(waitMinutes)) : 0} min</strong></div><div class="mini-stat"><span>Seated today</span><strong>${all.filter(e => e.status === 'Seated' && e.date === localDateKey()).length}</strong></div></div>
    <div class="toolbar floor-toolbar"><div class="segment-control">${['Queue','History'].map(view => `<button class="${(state.waitlistView || 'Queue') === view ? 'active' : ''}" data-waiting-action="view" data-view="${view}">${view}</button>`).join('')}</div>${isHistory ? `<label>Date <input type="date" id="waitlist-date" value="${state.waitlistDate || localDateKey()}"></label>` : '<span class="floor-refresh-note">Arrival order · Updates every 15 seconds</span>'}${waitingButton('Refresh', 'refresh')}</div>
    <section class="waiting-list" aria-label="${isHistory ? 'Walk-in history' : 'Walk-in queue'}">${visible.map((e,index) => {
      const late = waitingActive(e) && waitMinutes(e) > e.estimatedWait;
      const ready = e.tableChoices?.filter(t => !t.unavailable).length || 0;
      return `<article class="panel waiting-card" data-waiting-id="${e.id}">
        <div class="waiting-heading"><div class="waiting-number">${isHistory ? icon('users') : index + 1}</div><div><h2>${escapeHtml(e.name)} <span>· ${e.guests} guest${e.guests === 1 ? '' : 's'}</span></h2><p>Arrived ${arrivalClock(e.arrivedAt)}${e.date !== localDateKey() ? ` · ${displayDate(e.date)}` : ''}${e.phone ? ` · ${escapeHtml(e.phone)}` : ''}</p></div>${bookingBadge(e.status)}</div>
        <div class="waiting-info"><div><span>${e.status === 'Seated' ? 'Waited' : 'Waiting'}</span><strong>${e.status === 'Seated' ? Math.max(0, Math.floor((new Date(e.seatedAt) - new Date(e.arrivedAt))/60000)) : waitingActive(e) ? waitMinutes(e) : Math.max(0,Math.floor((new Date(e.closedAt) - new Date(e.arrivedAt))/60000))} min</strong></div><div><span>Quoted wait</span><strong>${e.estimatedWait} min</strong></div><div><span>${e.status === 'Seated' ? 'Assigned table' : 'Table availability'}</span><strong>${e.status === 'Seated' ? escapeHtml(e.table) : waitingActive(e) ? `${ready} suitable now` : '—'}</strong></div></div>
        ${e.date !== localDateKey() && waitingActive(e) ? '<p class="waiting-warning">This entry is from a previous day. Close it, or add a new entry if the guests have returned.</p>' : late ? '<p class="waiting-warning">Past the quoted wait — update the guests.</p>' : ''}
        ${e.notes ? `<p class="waiting-notes">${escapeHtml(e.notes)}</p>` : ''}
        <div class="floor-actions">${waitingActive(e) ? `${waitingButton('Edit', 'edit', e)}${e.status === 'Waiting' ? waitingButton('Mark called', 'call', e) : ''}${waitingButton('Guest left', 'left', e)}${waitingButton('Cancel entry', 'cancel', e)}${waitingButton('Seat party', 'seat', e, true)}` : ''}</div>
        <details class="booking-history"><summary>Activity</summary>${(e.history || []).slice().reverse().map(h => `<p><strong>${escapeHtml(h.action)}</strong> · ${escapeHtml(h.by)}<br><small>${new Date(h.at).toLocaleString('en-IN')}</small></p>`).join('')}</details>
      </article>`;
    }).join('') || `<article class="panel empty-state"><div><h3>${isHistory ? 'No walk-ins recorded for this date' : 'No guests waiting'}</h3><p>${isHistory ? 'Seated, departed and cancelled entries appear here.' : 'Add a party when guests arrive and need a table.'}</p>${isHistory ? '' : waitingButton('Add walk-in', 'add', null, true)}</div></article>`}</section>`;
}

function openWaitingEditor(id) {
  const e = (data.waitlist || []).find(e => e.id === Number(id));
  openModal(e ? 'Edit waiting party' : 'Add walk-in', 'Record the party and the estimated wait you have quoted. Arrival time is saved automatically.', `<form id="waiting-editor" data-id="${e?.id || ''}" data-revision="${e?.revision || ''}" data-request-key="${crypto.randomUUID()}"><div class="form-grid"><div class="field"><label>Guest name *</label><input name="name" required minlength="2" maxlength="100" value="${escapeHtml(e?.name || '')}"></div><div class="field"><label>Phone (optional)</label><input name="phone" type="tel" maxlength="30" value="${escapeHtml(e?.phone || '')}"></div><div class="field"><label>Party size *</label><input name="guests" type="number" min="1" max="30" required value="${e?.guests || 2}"></div><div class="field"><label>Estimated wait (minutes) *</label><input name="estimatedWait" type="number" min="0" max="240" required value="${e?.estimatedWait ?? 15}"></div><div class="field full"><label>Notes (optional)</label><textarea name="notes" maxlength="1000" placeholder="Seating preference or any assistance needed">${escapeHtml(e?.notes || '')}</textarea></div></div><p id="waiting-error" class="form-error" role="alert" hidden></p></form>`, '<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="waiting-editor">Save party</button>');
}

function openWaitingSeat(id) {
  const e = (data.waitlist || []).find(e => e.id === Number(id));
  if (!e) return;
  const choices = e.tableChoices || [];
  openModal('Seat waiting party', `${escapeHtml(e.name)} · ${e.guests} guests`, `<form id="waiting-seat" data-id="${e.id}" data-revision="${e.revision}"><div class="field"><label>Choose a table *</label><select name="tableId" required><option value="">Select a table</option>${choices.map(t => `<option value="${escapeHtml(t.id)}" ${t.unavailable ? 'disabled' : ''}>${escapeHtml(t.label)} · ${t.capacity} seats${t.unavailable ? ` — ${escapeHtml(t.unavailable)}` : ' — Available'}</option>`).join('')}</select></div>${choices.some(t => !t.unavailable) ? '<p class="floor-note">Seating starts a 90-minute table visit. Availability is checked again when you confirm.</p>' : '<p class="waiting-warning">No suitable table is ready. Refresh after a table has been cleared and cleaned.</p>'}<p id="waiting-error" class="form-error" role="alert" hidden></p></form>`, '<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="waiting-seat">Confirm seating</button>');
}

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-waiting-action]');
  if (!button) return;
  const { waitingAction: action, id } = button.dataset;
  try {
    if (action === 'add' || action === 'edit') return openWaitingEditor(id);
    if (action === 'seat') return openWaitingSeat(id);
    if (action === 'view') { state.waitlistView = button.dataset.view; refreshPage(); return; }
    if (action === 'refresh') { button.disabled = true; await syncAndRender(); return; }
    if (['left','cancel'].includes(action) && !window.confirm(action === 'left' ? 'Mark this party as left?' : 'Cancel this waiting entry?')) return;
    button.disabled = true;
    await api(`/api/waitlist/${id}`, { method: 'POST', body: JSON.stringify({ action, revision: Number(button.dataset.revision) }) });
    await syncAndRender(); showToast(action === 'call' ? 'Marked as called. Inform the guests in person.' : 'Waiting list updated.');
  } catch (error) { button.disabled = false; showToast(error.message, 'error'); }
});
document.addEventListener('change', event => { if (event.target.id === 'waitlist-date') { state.waitlistDate = event.target.value; refreshPage(); } });
document.addEventListener('submit', async event => {
  const form = event.target;
  if (!['waiting-editor','waiting-seat'].includes(form.id)) return;
  event.preventDefault();
  const button = document.querySelector(`[type="submit"][form="${form.id}"]`);
  button.disabled = true;
  try {
    const values = Object.fromEntries(new FormData(form));
    if (form.dataset.id) values.revision = Number(form.dataset.revision);
    values.action = form.id === 'waiting-seat' ? 'seat' : form.dataset.id ? 'edit' : 'add';
    values.requestKey = form.dataset.requestKey;
    await api(`/api/waitlist${form.dataset.id ? `/${form.dataset.id}` : ''}`, { method: 'POST', body: JSON.stringify(values) });
    closeModal(); await syncAndRender(); showToast(form.id === 'waiting-seat' ? 'Guests seated. The table board is updated.' : 'Waiting party saved.');
  } catch (error) { const alert = document.getElementById('waiting-error'); alert.hidden = false; alert.textContent = error.message; button.disabled = false; }
});
