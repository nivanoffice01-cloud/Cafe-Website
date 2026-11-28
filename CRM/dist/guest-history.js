const guestVisitDate = new Intl.DateTimeFormat('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' });
const trackedMoney = paise => inr(paise / 100);
const formatVisitDate = value => Number.isFinite(Date.parse(value)) ? guestVisitDate.format(new Date(value)) : 'Date unavailable';

function guestSelect(mode = 'create', selected = '') {
  const options = mode === 'create' ? [['','Match seated guest if available'],['none','Leave unlinked']] : [['none','Leave unlinked']];
  return `<div class="guest-picker" data-guest-mode="${mode}"><div class="form-grid">
    <label class="field">Find customer<input type="search" data-guest-search placeholder="Name or mobile"></label>
    <label class="field">Customer<select name="customerId">${options.map(([value,label]) =>
      `<option value="${value}" ${String(selected) === value ? 'selected' : ''}>${label}</option>`).join('')}
    ${data.customers.map(c => `<option value="${c.id}" data-guest-option ${c.id === Number(selected) ? 'selected' : ''}>${escapeHtml(c.name)} · ${escapeHtml(c.phone || '')}</option>`).join('')}</select></label>
    </div></div>`;
}

function orderGuestActions(order) {
  if (!['Owner','Manager','Cashier'].includes(data.user?.role) || order.status === 'Cancelled') return '';
  const customer = data.customers.find(c => c.id === order.customerId);
  const suggestion = data.customers.find(c => c.id === order.suggestedCustomerId);
  return `<div class="order-guest"><div>${customer
    ? `<button type="button" class="btn btn-quiet btn-small" data-action="view-customer" data-id="${customer.id}">${escapeHtml(customer.name)}</button>`
    : suggestion ? `<span>Possible phone match · ${escapeHtml(suggestion.name)}</span>` : '<span>Guest order</span>'}</div>
    <button type="button" class="btn btn-small" data-guest-action="link" data-id="${order.id}">${customer ? 'Change customer' : suggestion ? 'Review QR match' : 'Link customer'}</button></div>`;
}

function openOrderGuest(orderId) {
  const order = data.orders.find(o => o.id === orderId);
  if (!order) return;
  const proposed = order.customerId ?? order.suggestedCustomerId ?? 'none';
  openModal('Link order to customer', `Order #${orderId} · ${escapeHtml(order.table)}`,
    `<form id="order-guest-form" data-id="${orderId}" data-expected="${order.customerId ?? ''}">${guestSelect('link', proposed)}
      ${order.suggestedCustomerId ? '<p class="form-notice">Confirm the guest’s identity before accepting the phone match.</p>' : ''}
      <p class="form-error" data-guest-error role="alert" hidden></p></form>`,
    '<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="order-guest-form">Save link</button>');
}

function renderVisitCards(visits) {
  return visits.map(visit => `<article class="guest-visit"><div class="guest-visit-heading">
    <div><strong>${escapeHtml(visit.table || 'Visit')}</strong><span>${formatVisitDate(visit.at)} · ${escapeHtml(visit.source)}</span></div>
    ${visit.orders.some(order => order.settled) ? `<strong>${trackedMoney(visit.netPaise)}</strong>` : ''}
    </div>${visit.orders.length ? visit.orders.map(order => `<details class="guest-visit-order"><summary>
      <span>Order #${order.id} · ${escapeHtml(order.channel)}${order.demo ? ' · Demo' : ''}</span>
      <strong>${order.demo ? 'Demo payment' : order.settled ? trackedMoney(order.netPaise) : 'Payment unrecorded'}</strong></summary>
      ${order.items.length ? `<ul>${order.items.map(item => `<li>${item.quantity} × ${escapeHtml(item.name)}</li>`).join('')}</ul>` : '<p>No item details recorded.</p>'}
      ${order.refundPaise ? `<p>Recorded refunds · ${trackedMoney(order.refundPaise)}</p>` : ''}</details>`).join('')
    : '<p class="floor-note">Attended reservation with no linked order.</p>'}</article>`).join('');
}

function renderGuestHistory(history, id) {
  const stats = [['Tracked visits', history.visitCount], ['Recorded spend', trackedMoney(history.spentPaise)],
    ['Net spend this month', trackedMoney(history.monthSpentPaise)], ['Last visit', history.lastVisit ? formatVisitDate(history.lastVisit) : '—']];
  return `<div class="profile-facts guest-stats">${stats.map(([label,value]) => `<div class="profile-fact"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>
    <section class="insight-card"><strong>Most-ordered dishes</strong>
      ${history.favourites.length ? `<div class="tags guest-favourites">${history.favourites.map(dish => `<span class="tag">${escapeHtml(dish.name)} · ${dish.quantity} ordered</span>`).join('')}</div>`
      : '<p>Favourite dishes appear after a linked order is served or paid.</p>'}</section>
    <section class="guest-visit-history"><h3>Visit history</h3>
      <div data-guest-visits>${renderVisitCards(history.visits) || '<p class="floor-note">No attended bookings or completed orders are linked to this profile yet.</p>'}</div>
      ${history.nextOffset === null ? '' : `<button class="btn btn-small" data-guest-action="more" data-id="${id}" data-offset="${history.nextOffset}">Load older visits</button>`}
    </section>`;
}

async function showGuestProfile(id) {
  const customer = data.customers.find(c => c.id === Number(id));
  if (!customer) return;
  const canMessage = ['Owner','Manager'].includes(data.user?.role);
  openModal('Customer profile', '', `<div class="guest-profile">
    <div class="customer-profile-head"><div><h3>${escapeHtml(customer.name)}</h3>
      <p>${[customer.phone, customer.email].filter(Boolean).map(escapeHtml).join(' · ')}</p>
      <div class="tags"><span class="tag">${escapeHtml(customer.tier)} · ${Number(customer.points || 0).toLocaleString('en-IN')} points</span>
      ${(customer.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
      <p class="floor-note">${customer.birthday ? `Birthday ${escapeHtml(customer.birthday)} · ` : ''}Marketing ${customer.consent ? 'opted in' : 'opt-in unrecorded'}</p></div></div>
    <section class="insight-card"><div class="insight-top"><strong>Guest preferences</strong>
      <button type="button" class="btn btn-small" data-guest-action="preferences" data-id="${customer.id}">Edit preferences</button></div>
      <p class="guest-preference-text">${escapeHtml(customer.notes || 'No preferences recorded.')}</p></section>
    <div data-guest-history="${customer.id}"><p class="floor-note" role="status">Loading visit history…</p></div>
    ${customer.visits || customer.spend ? `<details class="booking-history"><summary>Saved profile totals</summary><p>${Number(customer.visits || 0)} visits · ${inr(customer.spend || 0)} lifetime value</p></details>` : ''}</div>`,
    `<button class="btn" data-action="close-modal">Close</button>${canMessage ? `<button class="btn btn-primary" data-action="message-customer" data-id="${customer.id}">Message guest</button>` : ''}`);
  const content = document.querySelector(`[data-guest-history="${customer.id}"]`);
  try {
    const history = await api(`/api/customers/${customer.id}/history`);
    content.innerHTML = renderGuestHistory(history, customer.id);
  } catch (error) {
    content.innerHTML = `<p class="form-error" role="alert">${escapeHtml(error.message)}</p>`;
  }
}

function openGuestPreferences(id) {
  const customer = data.customers.find(c => c.id === id);
  if (!customer) return;
  openModal('Edit guest preferences', escapeHtml(customer.name), `<form id="guest-preferences-form" data-id="${id}">
    <label class="field">Preferences and service notes<textarea name="notes" maxlength="1500" rows="5" placeholder="Seating, favourite drinks or dietary needs">${escapeHtml(customer.notes || '')}</textarea></label>
    <p class="form-error" data-guest-error role="alert" hidden></p></form>`,
    `<button class="btn" data-guest-action="profile" data-id="${id}">Back to profile</button><button class="btn btn-primary" type="submit" form="guest-preferences-form">Save preferences</button>`);
  document.getElementById('guest-preferences-form').dataset.expectedNotes = customer.notes || '';
}

document.addEventListener('input', event => {
  if (!event.target.matches('[data-guest-search]')) return;
  const search = event.target.value.trim().toLowerCase();
  const digits = search.replace(/\D/g,'');
  const select = event.target.closest('.guest-picker').querySelector('select');
  for (const option of select.querySelectorAll('[data-guest-option]')) {
    const name = option.textContent.toLowerCase();
    option.hidden = !option.selected && Boolean(search) && !name.includes(search)
      && (!digits || /[a-z]/i.test(search) || !name.replace(/\D/g,'').includes(digits));
  }
});

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-guest-action]');
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.guestAction;
  if (action === 'link') openOrderGuest(id);
  if (action === 'profile') await showGuestProfile(id);
  if (action === 'preferences') openGuestPreferences(id);
  if (action !== 'more') return;
  const content = button.closest('[data-guest-history]');
  button.disabled = true;
  try {
    const history = await api(`/api/customers/${id}/history?offset=${Number(button.dataset.offset)}`);
    content.querySelector('[data-guest-visits]').insertAdjacentHTML('beforeend', renderVisitCards(history.visits));
    if (history.nextOffset === null) button.remove();
    else { button.dataset.offset = history.nextOffset; button.disabled = false; }
  } catch (error) { button.disabled = false; showToast(error.message, 'error'); }
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (!['order-guest-form','guest-preferences-form'].includes(form.id)) return;
  event.preventDefault();
  const id = Number(form.dataset.id);
  const link = form.id === 'order-guest-form';
  const button = document.querySelector(`[form="${form.id}"][type=submit]`);
  button.disabled = true;
  const values = Object.fromEntries(new FormData(form));
  const path = link ? `/api/orders/${id}/customer` : `/api/customers/${id}/preferences`;
  const body = link ? { customerId:values.customerId === 'none' ? null : Number(values.customerId),
    expectedCustomerId:form.dataset.expected ? Number(form.dataset.expected) : null }
    : { notes:values.notes, expectedNotes:form.dataset.expectedNotes };
  try {
    await api(path, { method:'POST', body:JSON.stringify(body) });
    closeModal();
    await syncAndRender();
    if (!link) await showGuestProfile(id);
    showToast(link ? 'Order customer updated.' : 'Guest preferences saved.');
  } catch (error) {
    const notice = form.querySelector('[data-guest-error]');
    notice.textContent = error.message;
    notice.hidden = false;
    button.disabled = false;
  }
});
