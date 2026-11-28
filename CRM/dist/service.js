let serviceSound = false;
let serviceAudio = null;
let serviceOffline = false;
let servicePolling = false;
let serviceTracker = null;
let serviceTrackerKey = '';
let serviceTrackerInitialized = false;
let serviceDesktop = false;
try { serviceDesktop = localStorage.getItem('mangosteen-desktop-alerts') === 'on'; } catch {}

function playServiceChime(kind = 'ready') {
  if (!serviceSound || serviceAudio?.state !== 'running') return;
  const notes = kind === 'new' ? [660,880] : ['delay','cancel'].includes(kind) ? [440,440] : [784,988,1175];
  notes.forEach((frequency,index) => {
    const oscillator = serviceAudio.createOscillator();
    const gain = serviceAudio.createGain();
    const start = serviceAudio.currentTime + index * .18;
    oscillator.frequency.value = frequency;
    oscillator.connect(gain); gain.connect(serviceAudio.destination);
    gain.gain.setValueAtTime(0,start);
    gain.gain.linearRampToValueAtTime(.07,start+.02);
    gain.gain.exponentialRampToValueAtTime(.001,start+.15);
    oscillator.start(start); oscillator.stop(start+.17);
  });
}
function receiveServiceSnapshot(snapshot) {
  if (!snapshot || !data.user) return;
  const key = `mangosteen-service-seen:${data.user.id}:${data.user.role}`;
  if (key !== serviceTrackerKey) {
    serviceTrackerKey = key;
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch {}
    serviceTracker = new Set(Array.isArray(saved) ? saved : []);
    serviceTrackerInitialized = Array.isArray(saved);
  }
  const events = ServiceAlertCore.detect(snapshot,data.user.role,serviceTracker,serviceTrackerInitialized);
  serviceTrackerInitialized = true;
  try { sessionStorage.setItem(key,JSON.stringify([...serviceTracker])); } catch {}
  data.service = snapshot;
  serviceOffline = false;
  if (events.length) {
    const ready = events.find(e=>e.kind === 'ready');
    const fresh = events.find(e=>e.kind === 'new');
    const selected = events.find(e=>e.kind === 'cancel') || ready || fresh || events[0];
    playServiceChime(selected.kind);
    const title = { ready:'Food ready to serve', new:'New kitchen order', cancel:'Item cancelled', delay:'Order needs attention' }[selected.kind];
    const message = `${title}: #${selected.order.id} · ${selected.order.table}${events.length > 1 ? ` (+${events.length-1} alerts)` : ''}`;
    showToast(message,selected.kind === 'delay' ? 'error' : 'success');
    if (serviceDesktop && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title,{body:`#${selected.order.id} · ${selected.order.table}`,tag:`mangosteen-${selected.kind}-${selected.order.id}`});
        notification.onclick = () => { notification.close(); if (authState !== 'authenticated' || !data.user) return; window.focus(); state.page = data.user.role === 'Kitchen' || selected.kind === 'cancel' ? 'kitchen' : 'service'; refreshPage(); };
      } catch {}
    }
  }
  updateServiceStrip();
}
function serviceControlButtons() {
  return `<button type="button" class="btn btn-small" data-service-action="sound">${serviceSound && serviceAudio?.state === 'running' ? 'Sound on · mute' : 'Enable sound'}</button><button type="button" class="btn btn-small" data-service-action="desktop">${serviceDesktop && 'Notification' in window && Notification.permission === 'granted' ? 'Desktop alerts on' : 'Desktop alerts'}</button>${['Owner','Manager'].includes(data.user?.role) ? '<button type="button" class="btn btn-small" data-service-action="settings">Alert timing</button>' : ''}`;
}
function renderServiceStrip() {
  if (!data.service) return '';
  const ready = data.service.orders.filter(o=>o.status === 'Ready').length;
  const late = data.service.orders.filter(o=>o.delayed).length;
  return `<div class="service-live-strip ${serviceOffline ? 'offline' : ''}" role="status"><div><strong>${serviceOffline ? 'Live alerts disconnected — retrying' : `${ready} ready to serve${late ? ` · ${late} delayed` : ''}`}</strong><span>${serviceSound && serviceAudio?.state === 'running' ? 'Sound enabled on this device' : 'Enable sound on this device to hear new alerts'} · Keep CRM open</span></div><div class="floor-actions">${data.user?.role !== 'Kitchen' && state.page !== 'service' ? '<button class="btn btn-small btn-primary" data-page="service">Floor service</button>' : ''}${serviceControlButtons()}</div></div>`;
}
function updateServiceStrip() {
  const strip = document.getElementById('service-alert-strip');
  if (strip) strip.innerHTML = renderServiceStrip();
}
function serviceTicket(order, kitchen = false) {
  const age = order.status === 'Ready' ? order.readyMinutes : order.ageMinutes;
  const claimed = order.acceptedBy;
  const mine = !claimed || claimed.id === data.user?.id || ['Owner','Manager'].includes(data.user?.role);
  return `<article class="kds-card service-ticket ${order.delayed ? 'ticket-delayed' : ''}" data-service-order="${order.id}"><div class="kds-ticket-head"><div><span>Order #${String(order.id).padStart(3,'0')}${order.paid ? ' · PREPAID' : ''}</span><strong>${escapeHtml(order.table)}</strong></div><div class="kds-timer">${age} min</div></div>
    ${order.delayed ? `<div class="service-delay-label">${order.status === 'Ready' ? 'Waiting at the pass' : 'Preparation delayed'} · ${age} min</div>` : ''}
    <ul>${order.items.map(i=>`<li><strong>${i.quantity}×</strong> ${escapeHtml(i.name)}</li>`).join('')}</ul>${order.cancelledItems?.length ? `<p class="service-delay-label">Cancelled: ${order.cancelledItems.map(i=>`${i.quantity} × ${escapeHtml(i.name)}`).join(', ')}</p>` : ''}${order.notes ? `<p class="service-kitchen-note">${escapeHtml(order.notes)}</p>` : ''}
    ${order.assignedTo ? `<p class="floor-note">Table staff: ${escapeHtml(order.assignedTo)}</p>` : ''}
    ${kitchen ? order.status === 'Kitchen' ? `<button class="btn btn-primary btn-block" data-action="kitchen-start" data-id="${order.id}">Start preparing</button>` : order.status === 'Preparing' ? `<button class="btn btn-primary btn-block" data-action="kitchen-ready" data-id="${order.id}">Mark ready</button>` : `<div class="ready-callout">${claimed ? `Service claimed by ${escapeHtml(claimed.name)}` : 'Waiting for floor staff'}</div>` : `<p class="floor-note">${claimed ? `Being served by ${escapeHtml(claimed.name)}` : 'Ready for collection'}</p><div class="floor-actions">${!claimed ? `<button class="btn" data-service-action="accept" data-id="${order.id}">I’ll serve this</button>` : ''}<button class="btn btn-primary" data-service-action="served" data-id="${order.id}" ${mine ? '' : 'disabled'}>Mark served</button></div>`}
  </article>`;
}
function renderServiceKitchen() {
  const snapshot = data.service || {orders:[],limits:{prepMinutes:15,readyMinutes:5}};
  const changes = snapshot.cancellations || [];
  const notices = changes.length ? `<section class="service-delay-label kitchen-cancellations" aria-label="Recent cancellations"><strong>Recent cancellations</strong>${changes.map(c=>`<p>Order #${c.orderId} · ${escapeHtml(c.table)} · ${c.quantity} × ${escapeHtml(c.itemName)}</p>`).join('')}</section>` : '';
  const columns = [['Kitchen','New tickets','Waiting to begin'],['Preparing','In preparation','Being made now'],['Ready','Ready to serve','Collect at the pass']];
  return `${pageHeader('Kitchen display', 'Live kitchen queue', `Preparation alert after ${snapshot.limits.prepMinutes} minutes. Live updates every 5 seconds.`, '<button class="btn" data-service-action="refresh">Refresh queue</button>')}${notices}<div class="kds-board">${columns.map(([status,title,subtitle])=>`<section class="kds-column ${status.toLowerCase()}"><div class="kds-column-head"><div><h2>${title}</h2><p>${subtitle}</p></div><span>${snapshot.orders.filter(o=>o.status===status).length}</span></div><div class="kds-stack">${snapshot.orders.filter(o=>o.status===status).map(o=>serviceTicket(o,true)).join('') || '<div class="kds-empty">No tickets</div>'}</div></section>`).join('')}</div>`;
}
function renderFloorService() {
  const snapshot = data.service || {orders:[],limits:{readyMinutes:5}};
  const ready = snapshot.orders.filter(o=>o.status==='Ready').sort((a,b)=>Number(b.delayed)-Number(a.delayed) || Date.parse(a.readyAt || a.sentAt)-Date.parse(b.readyAt || b.sentAt));
  return `${pageHeader('Floor service','Food ready to serve',`Collect food from the kitchen, deliver it, then mark it served. Alerts after ${snapshot.limits.readyMinutes} minutes at the pass.`, '<button class="btn" data-service-action="refresh">Refresh queue</button>')}
    <div class="mini-stats service-stats"><div class="mini-stat"><span>Ready orders</span><strong>${ready.length}</strong></div><div class="mini-stat"><span>Waiting too long</span><strong>${ready.filter(o=>o.delayed).length}</strong></div><div class="mini-stat"><span>Being collected</span><strong>${ready.filter(o=>o.acceptedBy).length}</strong></div></div><section class="service-ready-grid">${ready.map(o=>serviceTicket(o)).join('') || '<article class="panel empty-state"><div><h3>No orders ready yet</h3><p>Food appears here when the kitchen marks it ready.</p></div></article>'}</section>`;
}
async function pollServiceAlerts() {
  if (servicePolling || authState !== 'authenticated') return;
  servicePolling = true;
  try {
    const userId = data.user?.id;
    const snapshot = await api('/api/service/alerts');
    if (authState !== 'authenticated' || data.user?.id !== userId) return;
    receiveServiceSnapshot(snapshot);
    if (['kitchen','service'].includes(state.page) && !document.getElementById('modal-root')?.children.length) refreshPage();
  } catch { serviceOffline = true; updateServiceStrip(); }
  finally { servicePolling = false; }
}
document.addEventListener('click',async event=>{
  const button = event.target.closest('[data-service-action]');
  if (!button) return;
  const action = button.dataset.serviceAction;
  try {
    if (action === 'sound') {
      if (serviceSound && serviceAudio?.state === 'running') serviceSound = false;
      else {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('This browser does not support sound alerts.');
        serviceAudio ||= new AudioContext();
        await serviceAudio.resume(); serviceSound = serviceAudio.state === 'running';
        if (!serviceSound) throw new Error('Sound is blocked. Check browser permissions and try again.');
        playServiceChime('ready');
      }
      updateServiceStrip(); return;
    }
    if (action === 'desktop') {
      if (!('Notification' in window)) throw new Error('Desktop notifications are unavailable in this browser. Use sound alerts.');
      if (serviceDesktop && Notification.permission === 'granted') serviceDesktop = false;
      else { const permission = await Notification.requestPermission(); if (permission !== 'granted') throw new Error('Desktop alerts are blocked. Enable notifications in your browser settings.'); serviceDesktop = true; }
      try { localStorage.setItem('mangosteen-desktop-alerts',serviceDesktop ? 'on' : 'off'); } catch {}
      updateServiceStrip(); return;
    }
    if (action === 'refresh') { button.disabled=true; await pollServiceAlerts(); button.disabled=false; return; }
    if (action === 'settings') {
      const limits = data.service?.limits || {prepMinutes:15,readyMinutes:5};
      openModal('Alert timing','Choose when preparation and ready tickets need attention.',`<form id="service-settings-form"><div class="form-grid"><div class="field"><label>Preparation delay (minutes)</label><input name="prepMinutes" type="number" min="1" max="120" required value="${limits.prepMinutes}"></div><div class="field"><label>Ready at pass (minutes)</label><input name="readyMinutes" type="number" min="1" max="60" required value="${limits.readyMinutes}"></div></div><p class="form-error" id="service-settings-error" role="alert" hidden></p></form>`,'<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="service-settings-form">Save timing</button>'); return;
    }
    const order = data.service?.orders.find(o=>o.id===Number(button.dataset.id));
    if (!order) throw new Error('This ticket changed. Refresh the queue.');
    button.disabled=true;
    await api(`/api/service/orders/${order.id}/${action}`,{method:'POST',body:JSON.stringify({readyAt:order.readyAt})});
    await pollServiceAlerts();
    showToast(action==='served' ? 'Order marked served.' : 'Order claimed. Collect it from the kitchen.');
  } catch(error) { button.disabled=false; showToast(error.message,'error'); }
});
document.addEventListener('submit',async event=>{
  const form=event.target;
  if (form.id!=='service-settings-form') return;
  event.preventDefault(); const button=document.querySelector('[form="service-settings-form"]'); button.disabled=true;
  try { await api('/api/service/settings',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))}); closeModal(); await syncAndRender(); }
  catch(error) { const alert=document.getElementById('service-settings-error'); alert.hidden=false; alert.textContent=error.message; button.disabled=false; }
});
setInterval(()=>pollServiceAlerts(),5000);
document.addEventListener('visibilitychange',()=>{ if (!document.hidden) pollServiceAlerts(); });
