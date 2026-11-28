const drawerDateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle:'medium', timeZone:'Asia/Kolkata' });
const drawerTimeFormat = new Intl.DateTimeFormat('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' });
const drawerDate = day => drawerDateFormat.format(new Date(`${day}T12:00:00+05:30`));
const drawerTime = at => drawerTimeFormat.format(new Date(at));
const drawerMoney = paise => paise == null ? '—' : inr(paise / 100);
const drawerVariance = value => value === 0 ? 'Balanced' : `${drawerMoney(Math.abs(value))} ${value < 0 ? 'shortage' : 'excess'}`;
const currentCashDrawerClosed = () => data.cashDrawer?.days.find(day => day.day === data.cashDrawer.today)?.status === 'Closed';

function selectedDrawer() {
  const days = data.cashDrawer?.days || [];
  return days.find(drawer => drawer.day === state.cashDrawerDay) || days[0];
}

function cashDrawerButton(action, label, options = {}) {
  return `<button type="button" class="btn ${options.primary ? 'btn-primary' : ''}" data-cash-action="${action}"${options.direction ? ` data-direction="${options.direction}"` : ''}>${label}</button>`;
}

function renderCashDrawer() {
  const drawer = selectedDrawer();
  if (!drawer) return '';
  const { day, status, opening, openedAt, openedBy, closing, totals } = drawer;
  const open = status === 'Open';
  const manager = ['Owner','Manager'].includes(data.user?.role);
  const actions = open
    ? cashDrawerButton('movement','Cash in',{direction:'in'}) + cashDrawerButton('movement','Cash out',{direction:'out'}) + cashDrawerButton('close','Count & close',{primary:true})
    : closing ? (manager ? cashDrawerButton('reopen','Reopen drawer') : '') : cashDrawerButton('open','Enter opening cash',{primary:true});
  const figures = [
    ['Opening cash', opening], ['Cash payments', totals.cashSales], ['Cash refunds', -totals.cashRefunds],
    ['Cash in', totals.cashIn], ['Cash out', -totals.cashOut], ['Expected cash', totals.expected],
  ];
  const movements = (drawer.movements || []).slice().reverse();
  const previous = (drawer.previousClosings || []).slice().reverse();
  return `<section class="panel cash-drawer" aria-labelledby="cash-drawer-title">
    <div class="panel-header"><div class="panel-title"><h2 id="cash-drawer-title">Cash drawer</h2>
      <p>Reconcile the physical cash in the drawer for each business day.</p></div>${statusPill(status)}</div>
    <div class="panel-body">
      <div class="cash-drawer-toolbar"><label class="field"><span>Business day (IST)</span>
        <select id="cash-drawer-day">${data.cashDrawer.days.map(item => `<option value="${item.day}" ${item.day === day ? 'selected' : ''}>${item.day === data.cashDrawer.today ? 'Today · ' : ''}${drawerDate(item.day)}${item.day !== data.cashDrawer.today ? ` · ${item.status}` : ''}</option>`).join('')}</select></label>
        <div class="floor-actions">${cashDrawerButton('refresh','Refresh')}${actions}</div>
      </div>
      <dl class="cash-drawer-totals">${figures.map(([label,value]) => `<div><dt>${label}</dt><dd>${drawerMoney(value)}</dd></div>`).join('')}</dl>
      ${openedBy ? `<p class="floor-note">Opened by ${escapeHtml(openedBy.name)} · ${drawerTime(openedAt)}</p>` : '<p class="floor-note">Enter the cash you started the day with to calculate the expected balance.</p>'}
      ${closing ? `<div class="cash-drawer-result"><div><span>Actual closing cash</span><strong>${drawerMoney(closing.actual)}</strong></div><div><span>Difference</span><strong>${drawerVariance(closing.variance)}</strong></div><p class="floor-note">Closed by ${escapeHtml(closing.by.name)} · ${drawerTime(closing.at)}</p></div>` : ''}
      ${movements.length ? `<details class="booking-history"><summary>Cash movement log (${movements.length})</summary>
        ${movements.map(m => `<p><strong>${m.direction === 'in' ? 'Cash in' : 'Cash out'} · ${drawerMoney(m.amount)}</strong> · ${escapeHtml(m.reason)}<br><small>${escapeHtml(m.by.name)} · ${drawerTime(m.at)}</small></p>`).join('')}</details>` : ''}
      ${previous.length ? `<details class="booking-history"><summary>Previous closes (${previous.length})</summary>
        ${previous.map(entry => `<p><strong>${drawerMoney(entry.actual)} counted · ${drawerVariance(entry.variance)}</strong> · ${escapeHtml(entry.by.name)} · ${drawerTime(entry.at)}<br><small>Reopened by ${escapeHtml(entry.reopenedBy.name)} · ${drawerTime(entry.reopenedAt)} · ${escapeHtml(entry.reason)}</small></p>`).join('')}</details>` : ''}
    </div></section>`;
}

function openCashDrawerForm(action, direction) {
  const drawer = selectedDrawer();
  const label = { open:'Enter opening cash', movement:direction === 'in' ? 'Record cash in' : 'Record cash out',
    close:'Close cash drawer', reopen:'Reopen cash drawer' }[action];
  if (!drawer || !label) return;
  const amount = action !== 'reopen';
  const amountLabel = { open:'Opening cash (₹)', movement:'Amount (₹)', close:'Actual cash counted (₹)' }[action];
  const reasonLabel = action === 'reopen' ? 'Reason for reopening' : 'Reason';
  openModal(label, drawerDate(drawer.day), `<form id="cash-drawer-form" data-action-name="${action}" data-day="${drawer.day}" data-revision="${drawer.revision || 0}" data-expected="${drawer.totals.expected ?? ''}" data-direction="${direction || ''}" data-key="${crypto.randomUUID()}">
    <div class="form-grid">
      ${amount ? `<label class="field full">${amountLabel}<input name="amount" type="number" inputmode="decimal" min="${action === 'movement' ? '0.01' : '0'}" max="99999999.99" step="0.01" required></label>` : ''}
      ${['movement','reopen'].includes(action) ? `<label class="field full">${reasonLabel}<textarea name="reason" minlength="3" maxlength="160" required></textarea></label>` : ''}
    </div>
    ${action === 'movement' ? '<p class="form-notice">Use this for money added to or taken from the drawer. Order payments and recorded refunds appear automatically.</p>' : ''}
    ${action === 'close' ? `<p class="form-notice">Expected cash <strong>${drawerMoney(drawer.totals.expected)}</strong><br><span id="cash-drawer-difference" aria-live="polite">Count the cash before closing.</span></p>` : ''}
    <p class="form-error" data-cash-error role="alert" hidden></p></form>`,
    `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="cash-drawer-form">${label}</button>`);
}

document.addEventListener('change', event => {
  if (event.target.id !== 'cash-drawer-day') return;
  state.cashDrawerDay = event.target.value;
  refreshPage();
  document.getElementById('cash-drawer-day')?.focus();
});

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-cash-action]');
  if (!button) return;
  if (button.dataset.cashAction === 'refresh') {
    await syncAndRender();
    return;
  }
  openCashDrawerForm(button.dataset.cashAction, button.dataset.direction);
});

document.addEventListener('input', event => {
  const input = event.target;
  const difference = document.getElementById('cash-drawer-difference');
  if (!difference || input.form?.id !== 'cash-drawer-form' || input.name !== 'amount') return;
  difference.textContent = input.value && input.validity.valid
    ? drawerVariance(Math.round(Number(input.value) * 100) - Number(input.form.dataset.expected))
    : 'Count the cash before closing.';
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (form.id !== 'cash-drawer-form') return;
  event.preventDefault();
  const { actionName, day, revision, expected, direction, key } = form.dataset;
  const button = document.querySelector('[form="cash-drawer-form"]');
  button.disabled = true;
  const fields = Object.fromEntries(new FormData(form));
  try {
    const drawer = await api(`/api/cash-drawer/${actionName}`, { method:'POST', body:JSON.stringify({
      ...fields, day, revision:Number(revision), expected:Number(expected), direction, requestKey:key,
    }) });
    closeModal();
    await syncAndRender();
    const message = { open:'Opening cash recorded.', movement:'Cash movement recorded.',
      close:drawer.closing ? `Drawer closed. ${drawerVariance(drawer.closing.variance)}.` : 'Closing saved.', reopen:'Drawer reopened.' };
    showToast(message[actionName]);
  } catch (error) {
    const notice = form.querySelector('[data-cash-error]');
    notice.textContent = error.message;
    notice.hidden = false;
    button.disabled = false;
  }
});
