const correctionLabels = { cancel:'Cancel item', discount:'Apply discount', refund:'Refund payment' };

function correctionButton(order) {
  const paid = order.paidAt || order.status === 'Paid' || order.paymentStatus === 'Paid';
  if (order.status === 'Cancelled' || (paid && Number(order.total) <= 0) || !['Owner','Manager','Cashier'].includes(data.user?.role)) return '';
  return `<button class="btn btn-small" data-correction-action="request" data-id="${order.id}" ${order.correctionPending ? 'disabled' : ''}>${order.correctionPending ? 'Awaiting approval' : 'Request correction'}</button>`;
}

function renderCorrections() {
  const filter = state.correctionFilter || 'Open';
  const requests = data.corrections || [];
  const isOpen = r => r.status === 'Pending' || (r.type === 'refund' && r.status === 'Approved');
  const visible = requests.filter(r => filter === 'Open' ? isOpen(r) : !isOpen(r));
  const canReview = ['Owner','Manager'].includes(data.user?.role);
  return `${pageHeader('Order corrections', 'Approvals', 'Review order changes and record completed refunds.', '<button class="btn" data-correction-action="refresh">Refresh</button><button class="btn btn-primary" data-page="orders">Open orders</button>')}
    <div class="toolbar floor-toolbar"><div class="segment-control">${['Open','History'].map(view => `<button class="${filter === view ? 'active' : ''}" data-correction-action="filter" data-id="${view}">${view}${view === 'Open' ? ` (${requests.filter(isOpen).length})` : ''}</button>`).join('')}</div></div>
    <section class="waiting-list">${visible.map(r => {
      const pending = r.status === 'Pending';
      const description = r.type === 'cancel' ? `${r.quantity} × ${escapeHtml(r.itemName)}` : `${inr(r.amount)}${r.type === 'refund' ? ` · ${escapeHtml(r.method)}${r.demo ? ' · Demo' : ''}` : ''}`;
      const status = r.type === 'refund' && r.status === 'Approved' ? 'Approved · awaiting payout record' : r.status;
      return `<article class="panel waiting-card" data-correction-id="${r.id}"><div class="waiting-heading"><div><h2>${correctionLabels[r.type]} <span>· Order #${r.orderId}</span></h2><p>${escapeHtml(r.table)} · ${description}</p></div>${bookingBadge(status)}</div>
        <p class="waiting-notes">${escapeHtml(r.reason)}</p>
        <p class="floor-note">Requested by ${escapeHtml(r.requestedBy.name)} · ${correctionDate(r.requestedAt)}</p>
        ${r.reviewedBy ? `<p class="floor-note">Reviewed by ${escapeHtml(r.reviewedBy.name)} · ${correctionDate(r.reviewedAt)}${r.reviewNote ? ` · ${escapeHtml(r.reviewNote)}` : ''}</p>` : ''}
        ${r.recordedBy ? `<p class="floor-note">Recorded by ${escapeHtml(r.recordedBy.name)} · ${correctionDate(r.recordedAt)}${r.reference ? ` · Ref ${escapeHtml(r.reference)}` : ''}</p>` : ''}
        ${r.updatedTotal != null && r.type !== 'refund' ? `<p class="floor-note">Bill ${inr(r.originalTotal)} → ${inr(r.updatedTotal)}</p>` : ''}
        <div class="floor-actions">${pending && canReview ? (r.requestedBy.id !== data.user.id ? `<button class="btn btn-primary" data-correction-action="approve" data-id="${r.id}">Approve</button>` : '<span class="floor-note">Needs approval from another manager or owner.</span>') + `<button class="btn" data-correction-action="reject" data-id="${r.id}">Reject</button>` : ''}
        ${r.type === 'refund' && r.status === 'Approved' ? `<button class="btn btn-primary" data-correction-action="record" data-id="${r.id}">${r.demo ? 'Record demo refund' : 'Record refund payout'}</button>` : ''}</div></article>`;
    }).join('') || `<article class="panel empty-state"><div><h3>${filter === 'Open' ? 'No open corrections' : 'No reviewed corrections yet'}</h3><p>Use Request correction on an order to start.</p></div></article>`}</section>`;
}

function correctionDate(value) {
  return new Date(value).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' });
}

function openCorrectionRequest(order) {
  const paid = order.paidAt || order.status === 'Paid' || order.paymentStatus === 'Paid';
  const canCancel = !paid && !['Served','Cancelled'].includes(order.status) && order.items.length;
  const types = paid ? ['refund'] : canCancel ? ['cancel','discount'] : ['discount'];
  openModal('Request correction', `Order #${order.id} · ${inr(order.total)}`, `<form id="correction-form" data-order="${order.id}" data-request-key="${crypto.randomUUID()}">
    <div class="form-grid"><label class="field full">Correction<select name="type">${types.map(type => `<option value="${type}">${correctionLabels[type]}</option>`).join('')}</select></label>
    <label class="field" data-correction-field="item">Item<select name="itemId">${order.items.map(i => `<option value="${escapeHtml(String(i.id))}" data-quantity="${i.quantity}">${escapeHtml(i.name)} · ${i.quantity} on order</option>`).join('')}</select></label>
    <label class="field" data-correction-field="item">Quantity<input name="quantity" type="number" min="1" step="1" value="1"></label>
    <label class="field full" data-correction-field="amount">Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" max="${Number(order.total)}"></label>
    <label class="field full">Reason<textarea name="reason" minlength="3" maxlength="300" required placeholder="What needs correcting?"></textarea></label></div>
    <p class="form-notice" id="correction-hint"></p><p class="form-error" data-correction-error role="alert" hidden></p></form>`,
    '<button class="btn" data-action="close-modal">Close</button><button class="btn btn-primary" type="submit" form="correction-form">Send for approval</button>');
  updateCorrectionForm(document.getElementById('correction-form'));
}

function updateCorrectionForm(form) {
  const { type, itemId, quantity, amount } = form.elements;
  const cancel = type.value === 'cancel';
  for (const field of form.querySelectorAll('[data-correction-field]')) {
    const show = (field.dataset.correctionField === 'item') === cancel;
    field.hidden = !show;
    field.querySelector('input, select').disabled = !show;
  }
  amount.required = !cancel;
  quantity.required = cancel;
  quantity.max = itemId.selectedOptions[0]?.dataset.quantity || 1;
  if (Number(quantity.value) > Number(quantity.max)) quantity.value = quantity.max;
  form.querySelector('#correction-hint').textContent = cancel ? 'Approved cancellations update the kitchen. Record any unused ingredients through Inventory.' : type.value === 'refund' ? 'After approval, issue the refund through the original payment method and record it here.' : 'Approval applies the discount to the unpaid bill.';
}

function openCorrectionReview(record, action) {
  const recordPayout = action === 'record';
  if (recordPayout && record.method === 'Cash' && !record.demo && currentCashDrawerClosed()) {
    showToast('Ask a manager to reopen the drawer before paying a cash refund.', 'error');
    return;
  }
  const title = recordPayout ? (record.demo ? 'Record demo refund' : 'Record refund payout') : action === 'approve' ? 'Approve correction' : 'Reject correction';
  const acknowledgement = record.demo ? 'I confirm this is a simulated refund.' : 'I confirm the customer has received the refund.';
  const fields = recordPayout ? `${record.method !== 'Cash' && !record.demo ? '<label class="field">Refund reference<input name="reference" required minlength="3" maxlength="100"></label>' : ''}<label class="check-row"><input type="checkbox" name="confirmed" required> ${acknowledgement}</label>`
    : `<label class="field">${action === 'reject' ? 'Reason for rejection' : 'Review note (optional)'}<textarea name="note" maxlength="300" ${action === 'reject' ? 'required minlength="3"' : ''}></textarea></label>`;
  const detail = record.type === 'cancel' ? `${record.quantity} × ${escapeHtml(record.itemName)}` : inr(record.amount);
  openModal(title, `Order #${record.orderId} · ${detail}`, `<form id="correction-review" data-id="${record.id}" data-operation="${action}">
    ${recordPayout && !record.demo ? `<p class="form-notice">Issue ${inr(record.amount)} through ${escapeHtml(record.method)} before recording the payout.</p>` : `<p class="waiting-notes">${escapeHtml(record.reason)}</p>`}
    ${fields}<p class="form-error" data-correction-error role="alert" hidden></p></form>`,
    `<button class="btn" data-action="close-modal">Close</button><button class="btn btn-primary" type="submit" form="correction-review">${title}</button>`);
}

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-correction-action]');
  if (!button) return;
  const { correctionAction:action, id } = button.dataset;
  if (action === 'filter') { state.correctionFilter = id; refreshPage(); return; }
  if (action === 'refresh') { await syncAndRender(); return; }
  if (action === 'request') {
    const order = data.orders.find(item => item.id === Number(id));
    if (order) openCorrectionRequest(order);
    return;
  }
  const record = data.corrections.find(item => item.id === id);
  if (record) openCorrectionReview(record, action);
});

document.addEventListener('change', event => {
  const form = event.target.closest('#correction-form');
  if (form && ['type','itemId'].includes(event.target.name)) updateCorrectionForm(form);
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (!['correction-form','correction-review'].includes(form.id)) return;
  event.preventDefault();
  const button = document.querySelector(`[form="${form.id}"][type=submit]`);
  button.disabled = true;
  const values = Object.fromEntries(new FormData(form));
  const request = form.id === 'correction-form';
  const path = request ? '/api/corrections' : `/api/corrections/${form.dataset.id}/${form.dataset.operation}`;
  if (request) Object.assign(values, { orderId: Number(form.dataset.order), requestKey: form.dataset.requestKey });
  else if (form.dataset.operation === 'record') values.confirmed = values.confirmed === 'on';
  try {
    await api(path, { method:'POST', body:JSON.stringify(values) });
    closeModal();
    state.page = 'corrections';
    state.correctionFilter = request || form.dataset.operation === 'approve' && data.corrections.find(r => r.id === form.dataset.id)?.type === 'refund' ? 'Open' : 'History';
    await syncAndRender();
    showToast(request ? 'Request sent for manager approval.' : 'Correction updated.');
  } catch (error) {
    const message = form.querySelector('[data-correction-error]');
    message.textContent = error.message;
    message.hidden = false;
    button.disabled = false;
  }
});
