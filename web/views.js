'use strict';
// ---- icon set (24x24 stroke icons, inherit currentColor) ----
const IC = (() => {
  const s = (inner, w = 18) =>
    `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  return {
    chart: s('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', 19),
    box: s('<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><polyline points="3.3 8.1 12 13 20.7 8.1"/><line x1="12" y1="13" x2="12" y2="21"/>', 19),
    truck: s('<rect x="1" y="6" width="14" height="11" rx="1.5"/><path d="M15 9h4l3 3.5V17h-7"/><circle cx="6" cy="18.5" r="2"/><circle cx="17.5" cy="18.5" r="2"/>', 19),
    users: s('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.4 15.2c2.7.3 4.6 1.9 5.2 4.3"/>', 19),
    badge: s('<circle cx="12" cy="9" r="5"/><path d="M12 14v2M8.5 19.5L10 14.8l2 1.7 2-1.7 1.5 4.7"/><path d="M9.5 8.7l1.8 1.8 3.2-3.2"/>', 19),
    cash: s('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M5.5 9.5h.01M18.5 14.5h.01"/>', 19),
    book: s('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>', 19),
    drop: s('<path d="M12 2.7S5.5 9.6 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 9.6 12 2.7 12 2.7z"/>', 19),
    bottle: s('<path d="M10 2.5h4M10.5 2.5v3L8.5 8v11a2.5 2.5 0 0 0 2.5 2.5h2A2.5 2.5 0 0 0 15.5 19V8l-2-2.5v-3"/><path d="M8.5 12h7M8.5 15.5h7"/>', 19),
    bottleBig: s('<path d="M9.5 2.5h5M10 2.5v2.6L7.5 8v12a2.5 2.5 0 0 0 2.5 2.5h4A2.5 2.5 0 0 0 16.5 20V8L14 5.1V2.5"/><path d="M7.5 12h9M7.5 16h9"/>', 19),
    phone: s('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.9.6 2.8a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.6a2 2 0 0 1 1.8 2.1z"/>', 14),
    route: s('<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19h7a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7h7"/>', 19),
    clip: s('<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>', 19),
    receipt: s('<path d="M5 3h14v18l-2.3-1.6L14.4 21l-2.4-1.6L9.6 21l-2.3-1.6L5 21V3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>', 19),
    locate: s('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="8"/>', 19),
    target: s('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>', 19),
    shield: s('<path d="M12 2.5l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10v-6l8-3z"/><path d="M9 11.5l2 2 4-4"/>', 19),
    wallet: s('<rect x="2.5" y="6" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><circle cx="16.5" cy="15" r="1.2" fill="currentColor" stroke="none"/>', 19),
    chat: s('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>', 19),
    mail: s('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7.5L12 13.5l8.5-6"/>', 19),
  };
})();

// ---- view-level map/cleanup registry (one live map at a time) ----
const viewFx = { map: null, watcher: null, notifiers: [] };
function clearViewFx() {
  if (viewFx.map) { viewFx.map.remove(); viewFx.map = null; }
  if (viewFx.watcher) { clearInterval(viewFx.watcher); viewFx.watcher = null; }
  viewFx.notifiers = [];
}
function notify(msg, tag) {
  try {
    if (window.Notification && Notification.permission === 'granted') {
      const n = new Notification('PurePak', { body: msg, icon: '/img/pure-pak-logo.jpeg' });
      n.onclick = () => window.focus();
    }
  } catch { /* ignore */ }
  if (window.ppToast) window.ppToast(msg, tag || 'info');
}
// downscale a receipt photo to max 1400px before upload (keeps payload < 1MB)
function fileToDataUrl(file, maxW = 1400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        resolve({ dataUrl: cv.toDataURL('image/jpeg', 0.82), mimetype: 'image/jpeg', w: cv.width, h: cv.height });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---- shared bits ----
const V = {
  kpiCard(label, val, sub, cls = '') {
    return `<div class="card kpi ${cls}"><div class="k-label">${label}</div><div class="k-val">${val}</div>${sub ? `<div class="k-sub">${sub}</div>` : ''}</div>`;
  },
  chip(status) { return `<span class="chip ${status}">${API.statusLabel(status)}</span>`; },
  // mobile card row: <td data-l="Label">value</td> — label appears above value on phones, ignored on desktop
  m(label, val, cls = '') { return `<td class="${cls}" data-l="${label}">${val}</td>`; },
  orderStatusFlow(o) {
    const steps = [
      ['new', 'Order placed', o.placed_at],
      ['confirmed', 'Confirmed', null],
      ['in_delivery', 'Out for delivery', null],
      ['delivered', 'Delivered', o.delivered_at],
    ];
    const idx = steps.findIndex(s => s[0] === o.status);
    if (o.status === 'cancelled') return `<span class="chip cancelled">Cancelled</span>`;
    return `<div class="timeline">${steps.map((s, i) => {
      const done = i <= idx;
      return `<div class="tl ${done ? 'done' : ''}"><div class="dot"></div><div><div class="tl-t">${s[1]}</div>${s[2] ? `<div class="tl-s">${API.fmtDate(s[2])}</div>` : ''}</div></div>`;
    }).join('')}</div>`;
  },
};

// ---- modals ----
function toast(msg, cls) { if (typeof App !== 'undefined') App.toast(msg, cls); }
function openModal(title, bodyHtml, footHtml = '') {
  const root = document.getElementById('modalRoot');
  const closeBtn = `<button class="x" data-close-modal aria-label="Close"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>`;
  const hd = title
    ? `<div class="modal-hd"><h3>${title}</h3>${closeBtn}</div>`
    : `<div class="modal-hd su-hd">${closeBtn}</div>`;
  root.innerHTML = `
    <div class="modal-back" id="modalBack">
      <div class="modal" role="dialog">
        ${hd}
        <div class="modal-bd">${bodyHtml}</div>
        ${footHtml ? `<div class="modal-ft">${footHtml}</div>` : ''}
      </div>
    </div>`;
  document.getElementById('modalBack').addEventListener('click', (e) => { if (e.target.id === 'modalBack') closeModal(); });
  // bind EVERY [data-close-modal] element — the header X and any footer Cancel/Close buttons
  document.querySelectorAll('#modalRoot [data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
}
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

// ---- themed confirmation / prompt dialogs (Promise-based, replaces native confirm/prompt) ----
// confirmDialog({title, message, okLabel, danger, input}) -> Promise<true | string | false>
//   danger=true  -> red ok button
//   input={placeholder} -> show a text field; resolves with typed value on OK, or '' if empty-allowed
function confirmDialog({ title = '', message = '', okLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, input = null } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (val) => { if (!done) { done = true; closeModal(); resolve(val); } };
    const body = `
      <div class="confirm-ic ${danger ? 'danger' : ''}">${danger
        ? '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        : '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>'}</div>
      ${title ? `<div class="confirm-title">${API.esc(title)}</div>` : ''}
      ${message ? `<div class="confirm-msg">${message}</div>` : ''}
      ${input ? `<input id="cfInput" class="input confirm-input" style="width:100%" placeholder="${API.esc(input.placeholder || '')}" ${input.required ? '' : 'autocomplete="off"'}>` : ''}
      ${input && input.hint ? `<div class="confirm-hint">${API.esc(input.hint)}</div>` : ''}
    `;
    const foot = `<button class="btn ${cancelLabel ? 'ghost' : ''}" id="cfCancel" ${cancelLabel ? '' : 'style="display:none"'}>${cancelLabel}</button>
      <button class="btn ${danger ? 'danger-solid' : 'primary'}" id="cfOk">${okLabel}</button>`;
    openModal('', body, foot);
    document.getElementById('cfCancel').addEventListener('click', () => finish(false));
    document.getElementById('cfOk').addEventListener('click', () => {
      if (input) {
        const v = document.getElementById('cfInput').value.trim();
        if (input.required && !v) { toast('Please provide a reason', 'warn'); return; }
        finish(v);
      } else finish(true);
    });
    if (input) setTimeout(() => { const i = document.getElementById('cfInput'); if (i) i.focus(); }, 60);
  });
}

// themed temporary-password reveal (replaces native alert)
function showTempPassword(pw, title = 'Temporary password') {
  openModal('', `
    <div class="confirm-ic">${'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'}</div>
    <div class="confirm-title">${title}</div>
    <div class="confirm-msg">Share it securely — the account holder should change it at first login.</div>
    <div class="temp-pw"><span id="tempPwVal">${API.esc(pw)}</span><button class="btn sm" id="tempPwCopy">Copy</button></div>
  `, `<button class="btn primary block" data-close-modal>Done</button>`);
  document.getElementById('tempPwCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(pw); toast('Copied to clipboard', 'ok'); }
    catch { toast('Select and copy manually', 'warn'); }
  });
}

async function loadOrderForm(prefill = {}) {
  const products = await API.products();
  const items = prefill.items || [{ product_id: products[0].id, qty: 1 }];
  return products.map((p, i) => {
    const it = items[i] || { product_id: p.id, qty: 1 };
    const unit = (typeof p.effective_price === 'number') ? p.effective_price : p.price;
    return `<div class="field"><span>${API.esc(p.name)}</span>
      <div class="row2"><input type="number" min="0" step="1" data-itemqty="${p.id}" value="${it.qty || 0}">
      <div class="field" style="margin:0"><span style="visibility:hidden">-</span><div style="padding:0 4px">${API.fmtMoney(unit)} / each</div></div></div>
    </div>`;
  }).join('');
}

async function modalCreateOrder(opts = {}) {
  // opts.customer: fixed {id,name} (customer role) — otherwise show a customer picker
  const role = API.user.role;
  const products = await API.products();
  let custHtml = '';
  if (opts.customer) {
    custHtml = `<div class="field"><span>Customer</span><input value="${API.esc(opts.customer.name)}" disabled></div>`;
  } else {
    const customers = await API.customers();
    custHtml = `<div class="field"><span>Customer</span><select id="ocCustomer">${customers.map(c => `<option value="${c.id}">${API.esc(c.name)} · ${API.esc(c.area || '')}</option>`).join('')}</select></div>`;
  }
  let agentHtml = '';
  if (role === 'admin') {
    const agents = await API.agents();
    agentHtml = `<div class="field"><span>Commission agent (optional)</span><select id="ocAgent"><option value="">— none —</option>${agents.map(a => `<option value="${a.id}">${API.esc(a.name)} (${a.commission_pct}%)</option>`).join('')}</select></div>`;
  }
  const itemsHtml = await loadOrderForm();
  openModal('New order', `
    ${custHtml}${agentHtml}
    <div class="section-label">Items</div>
    ${itemsHtml}
    <div class="field"><span>Note (optional)</span><input id="ocNotes" placeholder="Delivery note"></div>
    <div id="ocTotal" class="money-lg" style="text-align:right"></div>`,
    `<button class="btn" data-close-modal>Cancel</button><button class="btn primary" id="ocSubmit">Place order</button>`);
  const totalEl = document.getElementById('ocTotal');
  function recalc() {
    let t = 0;
    document.querySelectorAll('[data-itemqty]').forEach(inp => {
      const p = products.find(x => x.id === +inp.dataset.itemqty);
      const unit = p ? ((typeof p.effective_price === 'number') ? p.effective_price : p.price) : 0;
      t += unit * (parseInt(inp.value) || 0);
    });
    totalEl.textContent = API.fmtMoney(t);
  }
  document.querySelectorAll('[data-itemqty]').forEach(i => i.addEventListener('input', recalc));
  recalc();
  document.getElementById('ocSubmit').addEventListener('click', async () => {
    const body = { notes: document.getElementById('ocNotes').value.trim() || undefined };
    body.items = [];
    document.querySelectorAll('[data-itemqty]').forEach(inp => {
      const q = parseInt(inp.value) || 0;
      if (q > 0) body.items.push({ product_id: +inp.dataset.itemqty, qty: q });
    });
    if (!body.items.length) return toast('Add at least one item', 'bad');
    body.customer_id = opts.customer ? opts.customer.id : parseInt(document.getElementById('ocCustomer').value);
    if (role === 'admin') {
      const ag = document.getElementById('ocAgent');
      if (ag && ag.value) body.agent_id = +ag.value;
    }
    try {
      const o = await API.createOrder(body);
      closeModal(); toast('Order #' + o.id + ' placed', 'ok');
      if (typeof opts.onPlaced === 'function') { try { opts.onPlaced(o); } catch {} }
      App.refresh();
    } catch (e) { toast(e.message, 'bad'); }
  });
}

async function modalOrderDetail(id) {
  const o = await API.order(id);
  const role = API.user.role;
  const payPct = o.total ? Math.round((o.paid / o.total) * 100) : 0;
  let actions = '';
  if (role === 'admin' || role === 'agent') {
    if (o.status === 'new') actions += `<button class="btn primary" data-act="dispatch" data-id="${o.id}">Confirm & dispatch</button>`;
    if (o.status === 'confirmed') actions += `<button class="btn primary" data-act="dispatch" data-id="${o.id}">Dispatch (out for delivery)</button>`;
    if (['new', 'confirmed', 'in_delivery'].includes(o.status)) actions += `<button class="btn danger" data-act="cancel-order" data-id="${o.id}">Cancel</button>`;
  }
  if ((role === 'admin' || role === 'finance') && o.payment_status !== 'paid') {
    actions += `<button class="btn" data-act="pay-order" data-id="${o.id}" data-due="${o.total - o.paid}">Record payment</button>`;
  }
  openModal('Order #' + o.id, `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><div class="t" style="font-weight:800;font-size:17px">${API.esc(o.customer_name)}</div>
      <div class="s" style="color:var(--ink-3);font-size:13px">${API.esc(o.customer_address || '')} ${o.customer_area ? '· ' + API.esc(o.customer_area) : ''}</div></div>
      ${V.chip(o.status)}
    </div>
    <div class="progress"><i style="width:${payPct}%"></i></div>
    <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-3)"><span>Paid ${API.fmtMoney(o.paid)} of ${API.fmtMoney(o.total)}</span><span>${API.fmtDay(o.placed_at)}</span></div>
    <div class="section-label">Items</div>
    ${o.items.map(i => `<div class="item-line"><span>${API.esc(i.product_name)} × ${i.qty}</span><b>${API.fmtMoney(i.line_total)}</b></div>`).join('')}
    ${o.agent_name ? `<div class="section-label">Agent</div><div class="item-line"><span>${API.esc(o.agent_name)}</span></div>` : ''}
    ${o.notes ? `<div class="section-label">Note</div><div style="font-size:13.5px">${API.esc(o.notes)}</div>` : ''}
    <div class="section-label">Progress</div>
    ${V.orderStatusFlow(o)}
    ${o.deliveries.length ? `<div class="section-label">Deliveries</div>` + o.deliveries.map(d => `<div class="item-line"><span>${API.esc(d.driver)} · ${API.chip(d.status)}</span><span class="muted">${API.fmtDate(d.delivered_at) }</span></div>`).join('') : ''}
  `, actions ? `<div style="display:flex;gap:8px;width:100%;flex-wrap:wrap">${actions}</div>` : '');
}

async function modalPayOrder(id, due) {
  const o = await API.order(id);
  openModal('Record payment · #' + o.id, `
    <div class="field"><span>Customer</span><input value="${API.esc(o.customer_name)}" disabled></div>
    <div class="row2">
      <div class="field"><span>Amount due</span><input value="${API.fmtMoney(due)}" disabled></div>
      <div class="field"><span>Amount received (Rs)</span><input id="payAmt" type="number" min="0" max="${due}" value="${due}"></div>
    </div>
    <div class="field"><span>Memo</span><input id="payMemo" placeholder="Cash / bank / reference"></div>`,
    `<button class="btn" data-close-modal>Cancel</button><button class="btn primary" id="paySubmit">Save</button>`);
  document.getElementById('paySubmit').addEventListener('click', async () => {
    const amt = parseInt(document.getElementById('payAmt').value) || 0;
    if (amt <= 0) return toast('Enter a valid amount', 'bad');
    try {
      const cur = await API.order(id);
      await API.updateOrder(id, { paid: cur.paid + Math.min(amt, cur.total - cur.paid), memo: document.getElementById('payMemo').value.trim() });
      closeModal(); toast('Payment recorded', 'ok'); App.refresh();
    } catch (e) { toast(e.message, 'bad'); }
  });
}

function modalAddLedger(kind) {
  const isExp = kind === 'expense';
  openModal(isExp ? 'Add expense' : 'Add income', `
    <div class="row2">
      <div class="field"><span>${isExp ? 'Expense account' : 'Income account'}</span>
        <input id="lgAccount" placeholder="${isExp ? 'Fuel, supplies, rent…' : 'Other income…'}" value="${isExp ? 'General expense' : 'Cash sales'}"></div>
      <div class="field"><span>Amount (Rs)</span><input id="lgAmount" type="number" min="1" placeholder="0"></div>
    </div>
    <div class="field"><span>Memo</span><input id="lgMemo" placeholder="Details"></div>`,
    `<button class="btn" data-close-modal>Cancel</button><button class="btn primary" id="lgSubmit">Save</button>`);
  document.getElementById('lgSubmit').addEventListener('click', async () => {
    try {
      await API.addLedger({ account: document.getElementById('lgAccount').value.trim(), type: kind, amount: +document.getElementById('lgAmount').value, memo: document.getElementById('lgMemo').value.trim() });
      closeModal(); toast('Saved to ledger', 'ok'); App.refresh();
    } catch (e) { toast(e.message, 'bad'); }
  });
}

function modalAddAgent() {
  openModal('Add commission agent', `
    <div class="field"><span>Name</span><input id="agName"></div>
    <div class="row2">
      <div class="field"><span>Phone</span><input id="agPhone"></div>
      <div class="field"><span>Area</span><input id="agArea" placeholder="e.g. I-8 & I-9"></div>
    </div>
    <div class="field"><span>Commission % on sales</span><input id="agPct" type="number" min="0" max="50" value="5" step="0.5"></div>`,
    `<button class="btn" data-close-modal>Cancel</button><button class="btn primary" id="agSubmit">Add agent</button>`);
  document.getElementById('agSubmit').addEventListener('click', async () => {
    try {
      await API.createAgent({ name: document.getElementById('agName').value.trim(), phone: document.getElementById('agPhone').value.trim(), area: document.getElementById('agArea').value.trim(), commission_pct: +document.getElementById('agPct').value });
      closeModal(); toast('Agent added', 'ok'); App.refresh();
    } catch (e) { toast(e.message, 'bad'); }
  });
}

// ================= ADMIN =================
async function viewAdminDashboard() {
  const [k, monthly, top, orders] = await Promise.all([API.kpis(), API.monthly(), API.topCustomers(), API.orders()]);
  const max = Math.max(...monthly.map(m => Math.max(m.income, m.expense)), 1);
  return `
  <div class="page-head"><h1>Dashboard</h1><button class="btn primary sm" data-act="new-order">+ New order</button></div>
  <div class="grid kpis">
    ${V.kpiCard('Orders today', k.today_orders, 'all customers')}
    ${V.kpiCard('Open orders', k.open_orders, 'new + confirmed + dispatch')}
    ${V.kpiCard('Deliveries open', k.open_deliveries, 'pending + on road')}
    ${V.kpiCard('Bottles this month', k.units_month.toLocaleString(), 'units sold')}
  </div>
  <div class="grid kpis" style="margin-top:14px">
    ${V.kpiCard('Income · month', API.fmtMoney(k.month_revenue), 'gross collections', 'good')}
    ${V.kpiCard('Expenses · month', API.fmtMoney(k.month_expenses), null, 'bad')}
    ${V.kpiCard('Net · month', API.fmtMoney(k.month_profit), k.month_profit >= 0 ? 'healthy' : 'negative', k.month_profit >= 0 ? 'good' : 'bad')}
    ${V.kpiCard('Receivable', API.fmtMoney(k.outstanding_customers), 'customers owe')}
    ${V.kpiCard('Agent dues', API.fmtMoney(k.outstanding_agents), 'commissions accrued')}
  </div>
  <div class="grid grid-2col" style="margin-top:14px">
    <div class="card">
      <div class="card-head"><h2>Income vs expenses · 6 months</h2></div>
      <div class="card-pad">
        <div class="barchart">${monthly.map(m => `
          <div class="bar-col">
            <div class="bar-pair">
              <div class="bar" style="height:${Math.round(m.income / max * 100)}%"><span class="tip">${Math.round(m.income / 1000)}k</span></div>
              <div class="bar exp" style="height:${Math.round(m.expense / max * 100)}%"><span class="tip">${Math.round(m.expense / 1000)}k</span></div>
            </div>
            <div class="bar-label">${m.label}</div>
          </div>`).join('')}
        </div>
        <div class="legend"><span><i style="background:var(--blue-500)"></i>Income</span><span><i style="background:var(--red)"></i>Expenses</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h2>Top customers</h2></div>
      ${top.map((t, i) => `<div class="list-row"><div class="grow"><div class="t">${i + 1}. ${API.esc(t.name)}</div><div class="s">${t.orders} orders</div></div><div style="font-weight:700">${API.fmtMoney(t.sales)}</div></div>`).join('') || '<div class="empty">No data</div>'}
    </div>
  </div>
  <div class="card" style="margin-top:14px">
    <div class="card-head"><h2>Recent orders</h2><div class="spacer"></div><button class="btn sm ghost" data-act="nav" data-to="orders">View all</button></div>
    ${orders.slice(0, 6).map(o => `
      <div class="list-row" style="cursor:pointer" data-act="view-order" data-id="${o.id}">
        <div class="grow"><div class="t">#${o.id} · ${API.esc(o.customer_name)}</div>
        <div class="s">${API.esc(o.items || '')} ${o.agent_name ? '· via ' + API.esc(o.agent_name) : ''}</div></div>
        <div style="text-align:right"><div style="font-weight:700">${API.fmtMoney(o.total)}</div>${V.chip(o.status)}</div>
      </div>`).join('')}
  </div>`;
}

async function viewOrders({ status = '' } = {}) {
  const roles = ['admin', 'agent', 'customer', 'finance', 'employee'];
  if (!roles.includes(API.user.role)) return '';
  const orders = await API.orders(status);
  const filters = API.user.role === 'customer' ? [] : ['all', 'new', 'confirmed', 'in_delivery', 'delivered', 'cancelled'];
  const canOrder = ['admin', 'agent', 'customer'].includes(API.user.role);
  return `
  <div class="page-head"><h1>${API.user.role === 'customer' ? 'My orders' : 'Orders'}</h1>
    ${canOrder ? `<button class="btn primary sm" data-act="new-order">+ New order</button>` : ''}</div>
  ${filters.length ? `<div class="filters">${filters.map(f => `<button class="chip-filter ${f === status ? 'active' : ''}" data-act="filter-orders" data-status="${f}">${f === 'all' ? 'All' : API.statusLabel(f)}</button>`).join('')}</div>` : ''}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>#</th><th>${API.user.role === 'agent' ? 'Customer' : 'Customer'}</th><th>Items</th>${API.user.role !== 'customer' ? '<th>Agent</th>' : ''}<th>Placed</th><th class="num">Total</th><th>Payment</th><th>Status</th></tr></thead>
    <tbody>${orders.map(o => `
      <tr style="cursor:pointer" data-act="view-order" data-id="${o.id}">
        <td class="cell-main" data-l="Order">#${o.id} <span class="muted" style="font-weight:600;font-size:12px">${API.fmtDay(o.placed_at)}</span></td>
        ${V.m('Customer', `${API.esc(o.customer_name)}<div class="muted">${API.esc(o.customer_area || '')}</div>`)}
        ${V.m('Items', API.esc(o.items || '—'), 'muted')}
        ${API.user.role !== 'customer' ? V.m('Agent', o.agent_name ? API.esc(o.agent_name) : '<span class="muted">—</span>', 'muted') : ''}
        ${V.m('Total', API.fmtMoney(o.total), 'tv num')}
        ${V.m('Payment', V.chip(o.payment_status), 'tv')}
        ${V.m('Status', V.chip(o.status), 'tv')}
      </tr>`).join('') || `<tr><td colspan="8"><div class="empty"><div class="em-ico">${IC.box}</div>No orders found</div></td></tr>`}
    </tbody></table></div></div>`;
}

// ================= DELIVERY =================
async function viewDeliveries({ status = '' } = {}) {
  const d = await API.deliveries(status);
  const filters = ['all', 'pending', 'out_for_delivery', 'delivered', 'failed'];
  return `
  <div class="page-head"><h1>Deliveries</h1></div>
  <div class="filters">${filters.map(f => `<button class="chip-filter ${f === status ? 'active' : ''}" data-act="filter-deliveries" data-status="${f}">${f === 'all' ? 'All' : API.statusLabel(f)}</button>`).join('')}</div>
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>#</th><th>Order</th><th>Items</th><th>Address</th><th>Driver</th><th>Scheduled</th><th class="num">Amount due</th><th>Status</th><th></th></tr></thead>
    <tbody>${d.map(x => {
      const due = Math.round((x.order_total - x.order_paid) * 100) / 100;
      let act = '';
      if (x.status === 'pending') act = `<button class="btn sm primary" data-act="del-ofd" data-id="${x.id}">Start trip</button>`;
      if (x.status === 'out_for_delivery') act = `<button class="btn sm primary" data-act="del-done" data-id="${x.id}">Delivered</button>`;
      if (x.status === 'failed') act = `<button class="btn sm" data-act="del-retry" data-id="${x.id}">Retry</button>`;
      return `<tr>
      <td class="cell-main" data-l="Delivery">#${x.id} <span class="muted" style="font-weight:600;font-size:12px">· order #${x.order_id}</span></td>
      ${V.m('Customer', `<b style="font-size:14px">${API.esc(x.customer)}</b><div class="muted">${API.esc(x.customer_address || '')} ${x.customer_area ? '&middot; ' + API.esc(x.customer_area) : ''}</div><a href="tel:${API.esc(x.customer_phone || '')}" style="color:var(--blue-700);font-size:12.5px;text-decoration:none;display:inline-flex;align-items:center;gap:4px;margin-top:2px">${IC.phone} ${API.esc(x.customer_phone || '')}</a>`)}
      ${V.m('Items', API.esc(x.items), 'muted')}
      ${V.m('Driver', `${API.esc(x.driver)}<div class="muted">${API.esc(x.vehicle || '')}</div>`)}
      ${V.m('Scheduled', API.fmtDay(x.scheduled_at), 'muted')}
      ${V.m('Amount due', due > 0 ? API.fmtMoney(due) : '<span class="muted">settled</span>', 'tv num')}
      ${V.m('Status', V.chip(x.status), 'tv')}
      <td class="cell-act">${act}</td></tr>`;
    }).join('') || `<tr><td colspan="9"><div class="empty"><div class="em-ico">${IC.truck}</div>Nothing here right now</div></td></tr>`}
    </tbody></table></div></div>`;
}

async function viewDriverBoard() {
  const [ofd, pending] = await Promise.all([API.deliveries('out_for_delivery'), API.deliveries('pending')]);
  return `
  <div class="page-head"><h1>Today's route</h1></div>
  <div class="section-label" style="margin-top:0">On the road (${ofd.length})</div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
    ${ofd.map(x => driverCard(x, 'out_for_delivery')).join('') || `<div class="card card-pad empty" style="grid-column:1/-1"><div class="em-ico">${IC.route}</div>No active trips</div>`}
  </div>
  <div class="section-label">Scheduled / queued (${pending.length})</div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
    ${pending.map(x => driverCard(x, 'pending')).join('') || `<div class="card card-pad empty" style="grid-column:1/-1"><div class="em-ico">${IC.clip}</div>Queue is clear</div>`}
  </div>`;
}
function driverCard(x, kind) {
  const due = Math.round((x.order_total - x.order_paid) * 100) / 100;
  let act = kind === 'pending' ? `<button class="btn primary block sm" data-act="del-ofd" data-id="${x.id}">Start trip</button>`
    : `<button class="btn primary block sm" data-act="del-done" data-id="${x.id}">Mark delivered</button>`;
  return `<div class="card card-pad">
    <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px">${API.esc(x.customer)}</b>${V.chip(x.status)}</div>
    <div style="color:var(--ink-3);font-size:13px;margin-top:2px">${API.esc(x.customer_address || '')} ${x.customer_area ? '· ' + API.esc(x.customer_area) : ''}</div>
    <div style="margin-top:8px;font-size:13.5px;display:flex;align-items:center;gap:6px;color:var(--ink-2)">${IC.box} ${API.esc(x.items)}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:13px">
      <a href="tel:${API.esc(x.customer_phone || '')}" style="color:var(--blue-700);text-decoration:none;display:inline-flex;align-items:center;gap:4px">${IC.phone} ${API.esc(x.customer_phone || '')}</a>
      <span>${due > 0 ? '<b style="color:var(--amber-ink)">collect ' + API.fmtMoney(due) + '</b>' : '<span style="color:var(--green-ink)">paid</span>'}</span>
    </div>
    <div style="margin-top:10px">${act}</div>
  </div>`;
}

// ================= SMART ROUTE (map + 3-up queue + proximity alerts) =================
let smartRoute = { plan: null, myPos: null, notified: new Set() };

async function viewSmartRoute() {
  const role = API.user.role;
  // Load current plan (depot-based) first; upgrade to GPS when the rider taps "My location".
  // A 200 whose body fails JSON.parse (or is transiently empty/aborted) resolves to null
  // inside req(), so guard + retry instead of dereferencing a possibly-null plan.
  const EMPTY_PLAN = { sequence: [], start: { lat: 33.61, lng: 73.07 }, open_count: 0 };
  smartRoute = { plan: null, myPos: null, notified: new Set() };
  let plan = null;
  for (let i = 0; i < 3 && !plan; i++) {
    if (i) await new Promise(r => setTimeout(r, 250));
    try { plan = await API.routePlan(null, null); } catch { plan = null; }
    if (plan && !Array.isArray(plan.sequence)) plan = null;
  }
  smartRoute.plan = plan || EMPTY_PLAN;
  plan = smartRoute.plan;
  const top3 = plan.sequence.slice(0, 3);
  return `
  <div class="page-head"><h1>Smart route</h1><button class="btn sm" data-act="reroute">${IC.locate} Optimize</button></div>
  <div class="card" style="padding:0;overflow:hidden">
    <div id="routeMap" class="route-map"></div>
    <div class="map-foot">
      <div>
        <div style="font-size:15px;font-weight:800" id="routeKm">${plan.total_km} km</div>
        <div class="muted" style="font-size:12px">${plan.open_count} stops · optimized order</div>
      </div>
      <div style="text-align:right">
        <button class="btn primary sm" data-act="use-location">${IC.target} My location</button>
        <div class="muted" id="locStatus" style="font-size:11px;margin-top:5px">Starting from depot</div>
      </div>
    </div>
  </div>
  <div class="section-label">Next 3 stops</div>
  <div id="smartQueue" class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">
    ${top3.map((s, i) => smartStopCard(s, i)).join('') || '<div class="card card-pad empty" style="grid-column:1/-1"><div class="em-ico">' + IC.route + '</div>No open stops</div>'}
  </div>
  ${plan.sequence.length > 3 ? `<div class="section-label">Then (${plan.sequence.length - 3} more)</div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">
    ${plan.sequence.slice(3).map((s, i) => smartStopCard(s, i + 3, true)).join('')}
  </div>` : ''}
  ${plan.unlocated && plan.unlocated.length ? `<div class="card card-pad" style="margin-top:10px;font-size:13px;color:var(--amber-ink)">
    ${IC.locate} ${plan.unlocated.length} stop(s) have no map coordinates yet: ${API.esc(plan.unlocated.map(u => u.customer).join(', '))}. They appear in the queue but not on the map.</div>` : ''}`;
}

function smartStopCard(s, idx, compact) {
  const due = Math.round((s.order_total - s.order_paid) * 100) / 100;
  const kind = s.status === 'out_for_delivery' ? 'out_for_delivery' : 'pending';
  let act = kind === 'pending'
    ? `<button class="btn primary block sm" data-act="del-ofd" data-id="${s.delivery_id}">Start trip</button>`
    : `<button class="btn primary block sm" data-act="del-done" data-id="${s.delivery_id}">Mark delivered</button>`;
  const head = idx === 0
    ? `<div class="stop-ribbon">NEXT STOP</div>`
    : '';
  if (compact) {
    return `<div class="card card-pad stop-compact">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="stop-num">${idx + 1}</span><b style="font-size:14px">${API.esc(s.customer)}</b>
      </div>
      <div class="muted" style="font-size:12.5px;margin-top:2px">${API.esc(s.address || '')} ${s.area ? '· ' + API.esc(s.area) : ''}</div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-top:6px">
        <span class="muted">leg ${s.leg_km} km · cum ${s.cum_km} km</span>
        <span>${due > 0 ? '<b style="color:var(--amber-ink)">' + API.fmtMoney(due) + '</b>' : '<span style="color:var(--green-ink)">paid</span>'}</span>
      </div>
    </div>`;
  }
  return `<div class="card card-pad stop-card">${head}
    <div style="display:flex;justify-content:space-between;align-items:center">
      <b style="font-size:15px">${API.esc(s.customer)}</b>
      <span class="stop-num lg">${idx + 1}</span>
    </div>
    <div style="color:var(--ink-3);font-size:13px;margin-top:2px">${API.esc(s.address || '')} ${s.area ? '· ' + API.esc(s.area) : ''}</div>
    <div style="margin-top:8px;font-size:13.5px;display:flex;align-items:center;gap:6px;color:var(--ink-2)">${IC.box} ${API.esc(s.items)}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:13px">
      <a href="tel:${API.esc(s.phone || '')}" style="color:var(--blue-700);text-decoration:none;display:inline-flex;align-items:center;gap:4px">${IC.phone} ${API.esc(s.phone || '')}</a>
      <span>${due > 0 ? '<b style="color:var(--amber-ink)">collect ' + API.fmtMoney(due) + '</b>' : '<span style="color:var(--green-ink)">paid</span>'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-3);margin-top:8px">
      <span>From previous: <b style="color:var(--ink-1)">${s.leg_km} km</b></span>
      <span>Total so far: <b style="color:var(--ink-1)">${s.cum_km} km</b></span>
    </div>
    <div style="margin-top:10px">${act}</div>
  </div>`;
}

// After viewSmartRoute renders: init map + locate + proximity watcher
async function initSmartRoute() {
  const el = document.getElementById('routeMap');
  if (!el || !window.L) return;
  const plan = smartRoute && smartRoute.plan;
  // Guard the render race: if a re-render ran while the plan fetch was still
  // in flight (or failed), don't crash on a null sequence.
  if (!plan || !Array.isArray(plan.sequence) || !plan.start) return;
  const start = plan.start;
  const pts = [start, ...plan.sequence.map(s => [s.lat, s.lng])];
  const map = L.map(el, { zoomControl: true, attributionControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
  viewFx.map = map;
  // route polyline
  if (plan.sequence.length) {
    L.polyline(pts, { color: '#1976d2', weight: 4, opacity: 0.75, dashArray: '8 10' }).addTo(map);
  }
  // depot / start marker
  L.circleMarker([start.lat, start.lng], { radius: 9, color: '#0a4d8c', fillColor: '#1976d2', fillOpacity: 0.9, weight: 3 })
    .addTo(map).bindTooltip('Start');
  // numbered stop markers
  plan.sequence.forEach((s, i) => {
    const icon = L.divIcon({ className: 'stop-marker-wrap', html: `<div class="stop-badge ${s.status === 'out_for_delivery' ? 'active' : ''}">${i + 1}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
    L.marker([s.lat, s.lng], { icon })
      .addTo(map)
      .bindPopup(`<b>${API.esc(s.customer)}</b><br>${API.esc(s.address || '')} ${s.area ? '· ' + API.esc(s.area) : ''}<br><span class="muted">${API.esc(s.items)}</span><br>Leg ${s.leg_km} km`);
  });
  map.fitBounds(L.latLngBounds(pts).pad(0.2));
  startProximityWatcher();
}

function startProximityWatcher() {
  if (!navigator.geolocation) return;
  if (viewFx.watcher) clearInterval(viewFx.watcher);
  const check = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      smartRoute.myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (viewFx.map && !smartRoute._riderAdded) {
        smartRoute._riderAdded = true;
        L.circleMarker([smartRoute.myPos.lat, smartRoute.myPos.lng], {
          radius: 10, color: '#fff', fillColor: '#1565c0', fillOpacity: 1, weight: 3, className: 'rider-dot',
        }).addTo(viewFx.map).bindTooltip('You are here');
      } else if (viewFx.map) {
        viewFx._riderMarker && viewFx._riderMarker.setLatLng([smartRoute.myPos.lat, smartRoute.myPos.lng]);
      }
      const next = smartRoute.plan && smartRoute.plan.sequence[0];
      if (next && !smartRoute.notified.has(next.delivery_id)) {
        const d = haversineKmJS(smartRoute.myPos, { lat: next.lat, lng: next.lng });
        if (d <= 0.45) {
          smartRoute.notified.add(next.delivery_id);
          notify('You are ' + Math.round(d * 1000) + ' m from ' + next.customer + ' (' + next.address + ')', 'warn');
        }
      }
    }, () => { /* denied / unavailable — silent */ }, { enableHighAccuracy: true, maximumAge: 15000 });
  };
  check();
  viewFx.watcher = setInterval(check, 20000);
}
function haversineKmJS(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Use my location as the optimization start point
async function rerouteFromMyLocation() {
  const st = document.getElementById('locStatus');
  const setMsg = (t) => st && (st.textContent = t);
  if (!navigator.geolocation) { setMsg('Location not available on this browser'); return; }
  setMsg('Getting your location…');
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 15000 }));
    const p = await API.routePlan(pos.coords.latitude, pos.coords.longitude);
    if (!p || !Array.isArray(p.sequence)) {
      setMsg('Could not load the route, tap Optimize to retry');
      return;
    }
    smartRoute.plan = p;
    smartRoute.notified = new Set();
    const el = document.getElementById('routeMap');
    if (el && viewFx.map) {
      viewFx.map.eachLayer(l => { if (l instanceof L.Marker || l instanceof L.Polyline) viewFx.map.removeLayer(l); });
      const pts = [p.start, ...p.sequence.map(s => [s.lat, s.lng])];
      if (p.sequence.length) L.polyline(pts, { color: '#1976d2', weight: 4, opacity: 0.75, dashArray: '8 10' }).addTo(viewFx.map);
      p.sequence.forEach((s, i) => {
        const icon = L.divIcon({ className: 'stop-marker-wrap', html: `<div class="stop-badge ${s.status === 'out_for_delivery' ? 'active' : ''}">${i + 1}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
        viewFx._riderMarker = viewFx._riderMarker || L.marker([pos.coords.latitude, pos.coords.longitude], {
          icon: L.divIcon({ className: 'stop-marker-wrap', html: '<div class="rider-dot-lg"></div>', iconSize: [26, 26], iconAnchor: [13, 13] })
        }).addTo(viewFx.map).bindTooltip('You are here');
        L.marker([s.lat, s.lng], { icon }).addTo(viewFx.map)
          .bindPopup(`<b>${API.esc(s.customer)}</b><br>${API.esc(s.address || '')}<br>Leg ${s.leg_km} km`);
      });
      viewFx.map.fitBounds(L.latLngBounds(pts).pad(0.2));
    }
    const q = document.getElementById('smartQueue');
    if (q) q.innerHTML = p.sequence.slice(0, 3).map((s, i) => smartStopCard(s, i)).join('') || '<div class="card card-pad empty" style="grid-column:1/-1"><div class="em-ico">' + IC.route + '</div>No open stops</div>';
    const km = document.getElementById('routeKm'); if (km) km.textContent = p.total_km + ' km';
    setMsg('Optimized from your location · ' + Math.round(pos.coords.accuracy) + ' m accuracy');
    if (window.ppToast) ppToast('Route optimized from your location', 'ok');
  } catch (e) {
    setMsg('Could not get location — using depot route');
  }
}

// ================= EMPLOYEE / PROFILE =================
async function viewProfile() {
  const me = API.user;
  return `
  <div class="page-head"><h1>My profile</h1></div>
  <div class="card" style="margin-top:14px;padding:18px">
    <div style="display:flex;gap:14px;align-items:center">
      <div class="avatar" style="width:52px;height:52px;font-size:20px">${API.esc((me.name[0] || '?').toUpperCase())}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:16px;font-weight:800">${API.esc(me.name)} <span class="chip ${me.role}">${me.role}</span></div>
        <div class="muted" style="font-size:12.5px;margin-top:3px">${API.esc(me.email || '—')}${me.phone ? ' · ' + API.esc(me.phone) : ''}</div>
      </div>
    </div>
    <div class="grid kpis" style="margin-top:16px">
      ${V.kpiCard('Salary', me.salary ? API.fmtMoney(me.salary) + '/mth' : '—', me.salary ? 'fixed' : 'not set')}
      ${V.kpiCard('Account', me.status === 'active' ? 'Active' : me.status, me.status === 'active' ? 'in good standing' : '')}
    </div>
  </div>
  <div class="card" style="margin-top:14px;padding:16px">
    <div class="card-head"><h2>Need help?</h2><div class="spacer"></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn sm" style="justify-content:flex-start" href="tel:+923156666796">${IC.phone} Call support</a>
      <a class="btn sm" style="justify-content:flex-start" href="mailto:contact@purepak.com.pk">${IC.clip} Email</a>
    </div>
  </div>`;
}

// ================= AGENT =================
async function viewAgentDashboard() {
  const [k, orders] = await Promise.all([API.kpis(), API.orders()]);
  return `
  <div class="page-head"><h1>Hello, ${API.esc(API.user.name.split(' ')[0])}</h1><button class="btn primary sm" data-act="new-order">+ New order</button></div>
  <div class="grid kpis">
    ${V.kpiCard('My sales', API.fmtMoney(k.my_sales), 'all time, non-cancelled')}
    ${V.kpiCard('My orders', k.my_orders, 'all time')}
    ${V.kpiCard('Commission due', API.fmtMoney(k.due_commission), 'accrued, not paid', 'warn')}
    ${V.kpiCard('Commission paid', API.fmtMoney(k.paid_commission), 'lifetime payouts', 'good')}
  </div>
  <div class="card" style="margin-top:14px">
    <div class="card-head"><h2>Recent orders</h2><div class="spacer"></div><button class="btn sm ghost" data-act="nav" data-to="orders">All orders</button></div>
    ${orders.slice(0, 8).map(o => `
      <div class="list-row" style="cursor:pointer" data-act="view-order" data-id="${o.id}">
        <div class="grow"><div class="t">#${o.id} · ${API.esc(o.customer_name)}</div><div class="s">${API.esc(o.items || '')}</div></div>
        <div style="text-align:right"><div style="font-weight:700">${API.fmtMoney(o.total)}</div>${V.chip(o.status)}</div>
      </div>`).join('')}
  </div>`;
}

async function viewCommissions() {
  const role = API.user.role;
  const params = role === 'agent' ? {} : {};
  const rows = await API.commissions(params);
  const accrued = rows.filter(r => r.status === 'accrued');
  const paid = rows.filter(r => r.status === 'paid');
  const sum = (a) => a.reduce((s, r) => s + r.amount, 0);
  return `
  <div class="page-head"><h1>Commissions</h1>
    ${role === 'admin' ? '<button class="btn sm" data-act="new-agent">+ Add agent</button>' : ''}</div>
  <div class="grid kpis">
    ${V.kpiCard('Accrued (due)', API.fmtMoney(sum(accrued)), accrued.length + ' items', 'warn')}
    ${V.kpiCard('Paid out', API.fmtMoney(sum(paid)), paid.length + ' items', 'good')}
  </div>
  <div class="card" style="margin-top:14px"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Order</th><th>Customer</th><th>${role === 'agent' ? 'Agent' : 'Agent'}</th><th>Period</th><th class="num">Sales</th><th class="num">Pct</th><th class="num">Commission</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows.map(r => `
      <tr>
      <td class="cell-main" data-l="Commission">Order #${r.order_id} <span class="muted" style="font-weight:600;font-size:12px">· ${r.period || '—'}</span></td>
      ${V.m('Customer', API.esc(r.customer || '—'))}
      ${V.m('Agent', API.esc(r.agent_name || '—'))}
      ${V.m('Sales', API.fmtMoney(r.order_total), 'tv num')}
      ${V.m('Rate', r.pct + '%', 'tv num')}
      ${V.m('Commission', `<b>${API.fmtMoney(r.amount)}</b>`, 'tv num')}
      ${V.m('Status', V.chip(r.status), 'tv')}
      <td class="cell-act">${r.status === 'accrued' && (role === 'admin' || role === 'finance') ? `<button class="btn sm primary" data-act="settle-commission" data-id="${r.id}">Mark paid</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="9"><div class="empty"><div class="em-ico">${IC.cash}</div>No commissions yet</div></td></tr>`}
    </tbody></table></div></div>`;
}

async function viewAgents() {
  const u = API.user;
  const canEdit = ['admin', 'manager', 'finance'].includes(u.role);
  const agents = await API.agents();
  return `
  <div class="page-head"><h1>Commission agents</h1><button class="btn primary sm" data-act="new-agent">+ Add agent</button></div>
  ${canEdit ? '<p class="muted" style="font-size:12px;margin:2px 0 12px">Change a commission rate inline below — it applies to new orders from that agent (existing commissions keep the rate they were booked at).</p>' : ''}
  ${agents.map(a => `
  <div class="team-row">
    <div class="team-av">${API.esc((a.name[0] || '?').toUpperCase())}</div>
    <div class="team-main">
      <div class="nm">${API.esc(a.name)}${a.active ? '' : ' <span class="chip cancelled">Inactive</span>'}</div>
      <div class="sub">${API.esc(a.phone || '—')}${a.area ? ' · ' + API.esc(a.area) : ''} · ${a.orders_count} orders · sales ${API.fmtMoney(a.sales)}</div>
    </div>
    <div style="flex:none;text-align:right">
      ${canEdit ? `<div style="display:flex;gap:4px;align-items:center;justify-content:flex-end">
        <input data-act-none id="agPct${a.id}" type="number" min="0" max="50" step="0.5" value="${a.commission_pct}" class="input" style="width:58px;text-align:center">
        <span style="font-size:12px;color:var(--ink-3)">%</span>
        <button class="btn sm ${a.active ? 'ghost' : 'primary'}" data-act="agent-save" data-id="${a.id}" data-pct-input="agPct${a.id}" data-target-active="${a.active ? 0 : 1}">${a.active ? 'Deactivate' : 'Activate'}</button>
      </div>` : `<div style="font-weight:800">${a.commission_pct}%</div>`}
      <div class="muted" style="font-size:11px;margin-top:3px">due ${API.fmtMoney(a.outstanding_commission)}</div>
    </div>
  </div>`).join('')}`;
}

// ================= FINANCE =================
async function viewFinanceDashboard() {
  const month = new Date().toISOString().slice(0, 7);
  const [sum, monthly, orders, agents] = await Promise.all([API.ledgerSummary(month), API.monthly(), API.orders(), API.agents()]);
  const dueOrders = orders.filter(o => o.payment_status !== 'paid' && o.status !== 'cancelled');
  const dueAgents = agents.reduce((s, a) => s + a.outstanding_commission, 0);
  return `
  <div class="page-head"><h1>Finance</h1><button class="btn sm" data-act="add-expense">+ Expense</button><button class="btn sm" data-act="add-income">+ Income</button></div>
  <div class="grid kpis">
    ${V.kpiCard('Income · ' + new Date().toLocaleString('en', { month: 'long' }), API.fmtMoney(sum.month_income), null, 'good')}
    ${V.kpiCard('Expenses · month', API.fmtMoney(sum.month_expense), null, 'bad')}
    ${V.kpiCard('Net · month', API.fmtMoney(sum.month_net), sum.month_net >= 0 ? 'positive' : 'negative', sum.month_net >= 0 ? 'good' : 'bad')}
    ${V.kpiCard('All-time net', API.fmtMoney(sum.all_time_net), API.fmtMoney(sum.all_time_income) + ' in · ' + API.fmtMoney(sum.all_time_expense) + ' out')}
    ${V.kpiCard('Receivable', API.fmtMoney(dueOrders.reduce((s, o) => s + (o.total - o.paid), 0)), dueOrders.length + ' open orders', 'warn')}
    ${V.kpiCard('Agent dues', API.fmtMoney(dueAgents), 'unsettled commissions', 'warn')}
  </div>
  <div class="grid grid-2col" style="margin-top:14px">
    <div class="card">
      <div class="card-head"><h2>Cash flow · 6 months</h2></div>
      <div class="card-pad">
        <div class="barchart">${monthly.map(m => {
          const max = Math.max(...monthly.map(x => Math.max(x.income, x.expense)), 1);
          return `<div class="bar-col"><div class="bar-pair">
            <div class="bar" style="height:${Math.round(m.income / max * 100)}%"><span class="tip">${Math.round(m.income / 1000)}k</span></div>
            <div class="bar exp" style="height:${Math.round(m.expense / max * 100)}%"><span class="tip">${Math.round(m.expense / 1000)}k</span></div></div>
          <div class="bar-label">${m.label}</div></div>`;
        }).join('')}</div>
        <div class="legend"><span><i style="background:var(--blue-500)"></i>Income</span><span><i style="background:var(--red)"></i>Expenses</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h2>By account · this month</h2></div>
      ${sum.by_account.map(a => `<div class="list-row"><div class="grow"><div class="t">${API.esc(a.account)}</div><div class="s">${a.type}</div></div>${V.chip(a.type)}</div><div class="list-row" style="padding-top:0;padding-bottom:14px"><div class="grow"></div><b>${API.fmtMoney(a.total)}</b></div>`).join('') || '<div class="empty">No entries</div>'}
    </div>
  </div>`;
}

async function viewBookkeeping() {
  const rows = await API.ledger();
  let bal = 0, income = 0, expense = 0;
  const withBal = rows.map(r => {
    bal += r.type === 'income' ? r.amount : -r.amount;
    if (r.type === 'income') income += r.amount; else expense += r.amount;
    return { ...r, bal };
  });
  return `
  <div class="page-head"><h1>Book keeping</h1><button class="btn sm" data-act="add-expense">+ Expense</button><button class="btn primary sm" data-act="add-income">+ Income</button></div>
  <p class="muted" style="font-size:12.5px;margin:6px 0 12px">Every money movement in one place — sales, purchases, payroll, commissions and scanned receipts all land here.</p>
  <div class="grid kpis">
    ${V.kpiCard('Balance', API.fmtMoney(bal), bal >= 0 ? 'account position' : 'in the red', bal >= 0 ? 'good' : 'bad')}
    ${V.kpiCard('Income', API.fmtMoney(income), 'total credit')}
    ${V.kpiCard('Expenses', API.fmtMoney(expense), 'total debit')}
  </div>
  <div class="card" style="margin-top:14px"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Date</th><th>Account</th><th>Memo</th><th>Ref</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th></tr></thead>
    <tbody>${withBal.slice(0, 100).map(r => `<tr>
      <td class="cell-main" data-l="Entry"><span style="color:${r.type === 'income' ? 'var(--green-ink)' : 'var(--red-ink)'};font-weight:700">${r.type === 'income' ? '+' : '−'} ${API.fmtMoney(r.amount)}</span></td>
      ${V.m('Account', `<b>${API.esc(r.account)}</b><div class="muted">${API.esc(r.memo || '')}</div>`)}
      ${V.m('Date', `${API.fmtDay(r.at)} · ref ${API.esc(r.ref || '—')}`, 'muted')}
      ${V.m('Balance', API.fmtMoney(r.bal), 'tv num')}
    </tr>`).join('') || '<tr><td colspan="7"><div class="empty">No entries yet</div></td></tr>'}
    </tbody></table></div></div>`;
}

// ================= CUSTOMER (storefront) =================
const WA_NUMBER = '923156666796';
// whatsapp:// opens the installed phone app directly (wa.me / https falls
// through to WhatsApp Web on desktop and inside some Android WebViews).
const WA_LINK = `whatsapp://send?phone=${WA_NUMBER}&text=${encodeURIComponent('Hi PurePak, I need help with my water order.')}`;
const WA_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.08-.15-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38 0 1.4 1.02 2.76 1.17 2.95.14.19 2.01 3.08 4.88 4.32.68.29 1.21.47 1.63.6.68.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12 2.05a9.94 9.94 0 0 0-8.5 15.14L2 22.05l4.98-1.46A9.94 9.94 0 1 0 12 2.05z"/></svg>';

const sizeLabel = (ml) => ml >= 1000
  ? (Number.isInteger(ml / 1000) ? ml / 1000 : (ml / 1000).toFixed(1)) + ' L'
  : ml + ' ml';

const prodEff = (p) => (typeof p.effective_price === 'number' ? p.effective_price : p.price);
function prodPriceHtml(p) {
  const eff = prodEff(p);
  const save = Math.max(0, Math.round((p.price || 0) - eff));
  return `
    <div class="prod-price">
      <span class="prod-now">${API.fmtMoney(eff)}</span>
      ${save > 0 ? `<span class="prod-was">${API.fmtMoney(p.price)}</span>` : ''}
      <span class="prod-per">/ bottle</span>
    </div>
    ${save > 0 ? `<span class="save-badge">You save ${API.fmtMoney(save)}</span>`
              : `<span class="save-badge ghost">Fresh from the plant</span>`}`;
}
// Live price update WITHOUT rebuilding the page: patch each card's price block
// in place (called on a 'pricing' SSE event). No view swap, no scroll change.
async function refreshStorefrontPrices() {
  if (!window.App || App.route !== 'home') return;
  let products;
  try { products = await API.products(); } catch { return; }
  for (const p of products) {
    const cardEl = document.querySelector(`.prod[data-pid="${p.id}"]`);
    if (!cardEl) continue;
    cardEl.dataset.price = prodEff(p);
    const box = cardEl.querySelector('.prod-pricing');
    if (box) box.innerHTML = prodPriceHtml(p);
  }
  if (typeof applyCartToDom === 'function') applyCartToDom(); // re-total the cart bar
}
window.refreshStorefrontPrices = refreshStorefrontPrices; // called from app.js on a 'pricing' SSE event

// in-memory basket for the shop; survives SSE-driven re-renders of the page
const shopCart = new Map(); // productId -> qty
let _shopWired = false;

async function viewCustomerHome() {
  const [k, orders, products] = await Promise.all([API.kpis(), API.orders(), API.products()]);
  const first = API.esc((API.user.name || '').split(' ')[0] || 'there');
  // "most popular" = the office dispenser bottle (19 L), else the biggest size
  const popId = (products.find(p => p.size_ml === 19000) || products.slice().sort((a, b) => b.size_ml - a.size_ml)[0] || {}).id;
  const last = orders[0];

  const card = (p) => `
    <article class="prod${p.id === popId ? ' is-pop' : ''}" data-pid="${p.id}" data-price="${prodEff(p)}">
      ${p.id === popId ? `<span class="prod-pop">${IC.badge} Most ordered</span>` : ''}
      <div class="prod-ic">${p.size_ml >= 6000 ? IC.bottleBig : IC.bottle}</div>
      <div class="prod-body">
        <div class="prod-nm">${API.esc(p.name)}</div>
        <div class="prod-sz">${sizeLabel(p.size_ml)} bottle</div>
        <div class="prod-pricing">${prodPriceHtml(p)}</div>
      </div>
      <div class="prod-cta">
        <button class="btn primary block prod-add" data-shop="add" data-pid="${p.id}">Add to order</button>
        <div class="qty-step" data-pid="${p.id}">
          <button data-shop="dec" data-pid="${p.id}" aria-label="Remove one">−</button>
          <span data-qty="${p.id}">0</span>
          <button data-shop="inc" data-pid="${p.id}" aria-label="Add one">+</button>
        </div>
      </div>
    </article>`;

  return `
  <section class="shop-hero">
    <div class="shop-hero-row">
      <div class="shop-hero-logo"><img src="/img/pure-pak-logo.jpeg" alt="PurePak"></div>
      <div class="shop-hero-copy">
        <div class="shop-hero-kicker">Welcome back, ${first}</div>
        <h1>Pure water,<br>delivered to your door</h1>
        <button class="btn shop-hero-cta" data-shop="scroll-cat">Order water</button>
      </div>
    </div>
    <div class="shop-hero-badges">
      <span>${IC.truck} Same-day</span>
      <span>${IC.wallet} Pay on delivery</span>
      <span>${IC.shield} Lab-tested</span>
    </div>
  </section>

  <div class="shop-strip">
    <div class="ss-item"><b>${k.my_orders || 0}</b><span>orders placed</span></div>
    <div class="ss-item"><b>${API.fmtMoney(k.lifetime_spend || 0)}</b><span>lifetime with us</span></div>
    <div class="ss-item ${k.due > 0 ? 'due' : 'ok'}"><b>${API.fmtMoney(k.due || 0)}</b><span>${k.due > 0 ? 'balance due' : 'all settled'}</span></div>
    <div class="shop-strip-acts">
      <button class="btn sm" data-act="new-order">+ Order form</button>
      <button class="btn sm ghost" data-act="nav" data-to="orders">Track my orders →</button>
    </div>
  </div>

  ${last ? `
  <section class="reorder">
    <div class="reorder-txt">
      <div class="reorder-lbl">Order again</div>
      <div class="reorder-items">${API.esc(last.items || 'your last order')}</div>
    </div>
    <button class="btn primary" data-shop="reorder" data-order="${last.id}">Repeat order #${last.id}</button>
  </section>` : ''}

  <section class="shop-cat" id="shopCat">
    <div class="shop-cat-head">
      <h2>Choose your water</h2>
      <span class="muted">Prices shown are for your account</span>
    </div>
    <div class="prod-grid">
      ${products.map(card).join('') || `<div class="card card-pad empty" style="grid-column:1/-1"><div class="em-ico">${IC.bottleBig}</div>No products available right now</div>`}
    </div>
  </section>

  <div class="shop-foot">
    <button class="btn ghost" data-shop="contact">${IC.chat} Need help? Contact us</button>
    <span class="shop-foot-brand">PurePak &middot; purepak.com.pk</span>
  </div>

  <a class="wa-fab" href="${WA_LINK}" aria-label="Chat with PurePak on WhatsApp">${WA_ICON}</a>

  <div class="cartbar" id="shopCartBar" hidden>
    <div class="cartbar-sum"><b id="shopCartQty">0</b> bottles · <b id="shopCartTotal">${API.fmtMoney(0)}</b></div>
    <button class="btn primary" data-shop="checkout">Review &amp; place order</button>
  </div>`;
}

// ---- storefront basket wiring (called from onViewRender for route 'home') ----
function applyCartToDom() {
  let qty = 0, total = 0;
  document.querySelectorAll('.prod').forEach(el => {
    const n = shopCart.get(+el.dataset.pid) || 0;
    el.classList.toggle('in-cart', n > 0);
    const q = el.querySelector('[data-qty]');
    if (q) q.textContent = n;
    qty += n;
    total += n * (Number(el.dataset.price) || 0);
  });
  const bar = document.getElementById('shopCartBar');
  if (bar) {
    bar.hidden = qty === 0;
    const qEl = document.getElementById('shopCartQty');
    const tEl = document.getElementById('shopCartTotal');
    if (qEl) qEl.textContent = qty;
    if (tEl) tEl.textContent = API.fmtMoney(total);
  }
  document.body.classList.toggle('has-cartbar', qty > 0);
}

async function shopCheckout() {
  if (!shopCart.size) return ppToast('Add some water to your order first', 'warn');
  const u = API.user;
  await modalCreateOrder({
    customer: { id: u.customer_id, name: u.customerName || u.name },
    onPlaced: () => { shopCart.clear(); document.body.classList.remove('has-cartbar'); },
  });
  document.querySelectorAll('[data-itemqty]').forEach(inp => {
    inp.value = shopCart.get(+inp.dataset.itemqty) || 0;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function onShopClick(e) {
  const b = e.target.closest('[data-shop]');
  if (!b) return;
  const act = b.dataset.shop;
  const pid = +b.dataset.pid;
  if (act === 'add' || act === 'inc') shopCart.set(pid, (shopCart.get(pid) || 0) + 1);
  else if (act === 'dec') {
    const n = (shopCart.get(pid) || 0) - 1;
    if (n > 0) shopCart.set(pid, n); else shopCart.delete(pid);
  } else if (act === 'scroll-cat') {
    document.getElementById('shopCat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  } else if (act === 'contact') {
    return modalContact();
  } else if (act === 'checkout') {
    return shopCheckout();
  } else if (act === 'reorder') {
    try {
      const o = await API.order(+b.dataset.order);
      shopCart.clear();
      (o.items || []).forEach(it => shopCart.set(it.product_id, (shopCart.get(it.product_id) || 0) + it.qty));
      applyCartToDom();
      return shopCheckout();
    } catch (err) { return ppToast(err.message || 'Could not load that order', 'bad'); }
  }
  applyCartToDom();
}

function initCustomerHome() {
  applyCartToDom(); // re-apply basket after a fresh render (e.g. live price update)
  if (_shopWired) return;
  _shopWired = true;
  document.getElementById('view').addEventListener('click', onShopClick);
}

// full contact details, opened from the storefront "Contact us" button
function modalContact() {
  openModal('Contact PurePak', `
    <p class="muted" style="margin:0 0 12px;font-size:13px;line-height:1.5">Orders, deliveries, standing orders or bulk pricing — we're happy to help.</p>
    <div class="contact-list">
      <a class="btn block contact-wa" href="${WA_LINK}">${WA_ICON} Chat on WhatsApp</a>
      <a class="btn block" href="tel:+${WA_NUMBER}">${IC.phone} +92 315 6666 796</a>
      <a class="btn block" href="mailto:contact@purepak.com.pk">${IC.mail} contact@purepak.com.pk</a>
    </div>
    <p class="muted" style="margin:14px 0 0;font-size:12px;line-height:1.5">PurePak &middot; Main Golra Rd, near Golra Railway Station, Islamabad</p>
  `, `<button class="btn primary block" data-close-modal>Close</button>`);
}

// ================= RECEIPTS (scan -> staging -> verify -> ledger) =================
let receiptModalOpen = false;

async function viewReceipts() {
  const role = API.user.role;
  const canReview = role === 'admin' || role === 'finance';
  const [pending, done] = await Promise.all([API.receipts(null, 'pending'), API.receipts(null, 'approved')]);
  const total = done.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const posted = done.filter(r => r.posted).length;
  return `
  <div class="page-head"><h1>Receipts</h1><button class="btn primary sm" data-act="receipt-scan">${IC.receipt} Scan receipt</button></div>
  <div class="grid kpis">
    ${V.kpiCard('Scans', pending.length + done.length, 'receipts captured')}
    ${V.kpiCard('Awaiting review', pending.length, 'staging — not yet in books', pending.length ? 'warn' : '')}
    ${V.kpiCard('Approved value', API.fmtMoney(total), posted + ' of ' + done.length + ' posted to ledger', 'good')}
  </div>
  <div class="card" style="margin-top:14px;padding:10px 12px;display:flex;gap:8px">
    <input id="receiptSearch" class="input" style="flex:1" placeholder="Search vendor, amount, line items… (live)" oninput="debounceReceiptSearch()">
  </div>
  <div id="receiptList" style="margin-top:10px">${receiptListHtml(pending, done, canReview)}</div>`;
}

function receiptListHtml(pending, done, canReview) {
  let html = '';
  if (pending.length) {
    html += `<div class="section-label">Staging — awaiting verification (${pending.length})</div>` + pending.map(r => receiptCard(r, canReview, true)).join('');
  }
  if (done.length) {
    html += `<div class="section-label">Verified — in books (${done.length})</div>` + done.map(r => receiptCard(r, canReview, false)).join('');
  }
  if (!pending.length && !done.length) {
    html = `<div class="card card-pad empty"><div class="em-ico">${IC.receipt}</div>No receipts yet — tap “Scan receipt” to capture your first one.</div>`;
  }
  return html;
}

let _receiptSearchTimer = null;
function debounceReceiptSearch() {
  clearTimeout(_receiptSearchTimer);
  _receiptSearchTimer = setTimeout(async () => {
    const q = (document.getElementById('receiptSearch') || {}).value.trim();
    if (!q) { App.refresh(); return; }
    const rows = await API.receipts(q, null);
    const canReview = ['admin', 'finance'].includes(API.user.role);
    const p = rows.filter(r => r.status !== 'approved');
    const a = rows.filter(r => r.status === 'approved');
    const wrap = document.getElementById('receiptList');
    if (wrap) wrap.innerHTML = (p.length || a.length) ? receiptListHtml(p, a, canReview)
      : `<div class="card card-pad empty"><div class="em-ico">${IC.receipt}</div>No receipts match “${API.esc(q)}”</div>`;
  }, 250);
}

function receiptCard(r, canReview, isStaging) {
  const ext = r.extracted || {};
  const isPP = ext.type === 'purepak';
  let stateChip;
  if (r.posted) stateChip = '<span class="chip paid">In ledger · ' + API.esc(r.posted_ref || '') + '</span>';
  else if (!isStaging) stateChip = '<span class="chip confirmed">Approved by ' + API.esc(r.reviewed_by || '—') + '</span>';
  else if (r.ocr_status === 'done') stateChip = '<span class="chip pending">Ready to verify</span>';
  else if (r.ocr_status === 'failed') stateChip = '<span class="chip failed">Check manually</span>';
  else stateChip = '<span class="chip pending">Reading…</span>';
  const pendingChip = (isPP && ext.payment_status === 'pending') ? '<span class="chip warn">Payment pending</span>' : '';
  // items: PurePak size rows (Size · Qty · Rate · Amount) or generic line items
  let items;
  if (isPP && Array.isArray(ext.items) && ext.items.length) {
    items = `<table class="mini-items"><tr><th>Size</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr>` +
      ext.items.map(it => `<tr><td>${API.esc(it.size)}</td><td class="num">${it.qty != null ? it.qty : '—'}</td><td class="num">${it.rate != null ? API.fmtMoney(it.rate) : '—'}</td><td class="num">${it.amount != null ? API.fmtMoney(it.amount) : '—'}</td></tr>`).join('') +
      `<tr class="tot"><td colspan="3">Total${ext.total_from === 'summed' ? ' (summed)' : ''}</td><td class="num">${API.fmtMoney(ext.total || r.amount || 0)}</td></tr></table>`;
  } else {
    const lis = ext.line_items || [];
    items = lis.map(li =>
      `<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:2.5px 0;border-bottom:1px dashed var(--line)"><span>${API.esc(li.item || li.description || '—')}</span><span class="muted">${li.qty != null ? 'x' + li.qty + ' ' : ''}${API.fmtMoney(li.price != null ? li.price : li.amount)}</span></div>`
    ).join('');
  }
  let actions = '';
  if (canReview && isStaging) {
    actions = `<div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn primary block sm" data-act="receipt-review" data-id="${r.id}" style="flex:1">${IC.clip} Verify & approve</button>
      <button class="btn danger sm" data-act="receipt-reject" data-id="${r.id}">Reject</button>
    </div>`;
  } else if (canReview && !isStaging && !r.posted) {
    actions = `<div style="margin-top:10px"><button class="btn primary block sm" data-act="receipt-post" data-id="${r.id}">Post to ledger</button></div>`;
  }
  const title = isPP ? (ext.customer_name ? API.esc(ext.customer_name) : 'PurePak sale') : API.esc(r.vendor || ext.vendor || 'Receipt #' + r.id);
  const subMeta = isPP
    ? 'Receipt #' + API.esc(ext.receipt_no || r.id) + (ext.customer_address ? ' · ' + API.esc(ext.customer_address) : '')
    : (ext.date ? 'Date ' + API.esc(ext.date) : '');
  return `
  <div class="card card-pad" style="${isStaging ? 'border-left:3px solid var(--amber)' : 'border-left:3px solid var(--green)'}">
    <div style="display:flex;gap:12px;align-items:flex-start">
      <a href="${API.receiptImage(r.id)}?token=${API.token}" target="_blank" style="flex:0 0 74px">
        <img src="${API.receiptImage(r.id)}?token=${API.token}" style="width:74px;height:92px;object-fit:cover;border-radius:8px;border:1px solid var(--line)" alt="receipt ${r.id}">
      </a>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <b style="font-size:15px">${title}</b>
          <span style="font-size:13px;font-weight:800">${API.fmtMoney(r.amount || ext.amount || ext.total || 0)}</span>
        </div>
        <div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap">${stateChip}${pendingChip}</div>
        <div class="muted" style="font-size:12px;margin-top:5px">${subMeta ? subMeta + ' · ' : ''}by ${API.esc(r.recorded_by || '—')} · ${API.fmtDay(r.created_at)}</div>
      </div>
    </div>
    ${items ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line)">${items}</div>` : ''}
    ${actions}
  </div>`;
}

// receipt capture modal — type options depend on the logged-in role
const SCAN_KINDS = {
  admin: [['sales', 'Sales (PurePak receipt book)'], ['expense', 'Expense'], ['income', 'Income'], ['agent_commission', 'Agent commission'], ['other', 'Other']],
  manager: [['sales', 'Sales (PurePak receipt book)'], ['expense', 'Expense'], ['income', 'Income'], ['agent_commission', 'Agent commission'], ['other', 'Other']],
  finance: [['expense', 'Expense'], ['income', 'Income'], ['agent_commission', 'Agent commission'], ['other', 'Other']],
  agent: [['sales', 'Sales (PurePak receipt book)'], ['income', 'Payment received'], ['other', 'Other']],
  delivery: [['sales', 'Sales (PurePak receipt book)'], ['income', 'Payment received'], ['other', 'Other']],
};
async function modalScanReceipt() {
  if (receiptModalOpen) { closeModal(); }
  receiptModalOpen = true;
  const kinds = SCAN_KINDS[API.user.role] || SCAN_KINDS.agent;
  openModal('Scan receipt', `
    <div style="font-size:13px;color:var(--ink-3);margin-bottom:10px">Take a photo of the paper receipt.</div>
    <div id="rxPreview" style="margin-bottom:10px"><img id="rxImg" style="max-width:100%;max-height:260px;border-radius:10px;border:1px solid var(--line);display:none"></div>
    <label class="muted" style="font-size:12px">Receipt photo / image</label>
    <input type="file" id="rxFile" accept="image/*" capture="environment" style="width:100%;padding:9px;margin-bottom:12px;border:1px solid var(--line);border-radius:10px;background:#fff">
    <label class="muted" style="font-size:12px">Type</label>
    <select id="rxKind" class="input" style="width:100%;margin-bottom:12px">
      ${kinds.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
    </select>
    <label class="muted" style="font-size:12px">Total amount (PKR)</label>
    <input type="number" id="rxAmount" class="input" style="width:100%;margin-bottom:12px" placeholder="e.g. 1250">
    <label class="muted" style="font-size:12px">Vendor (optional)</label>
    <input id="rxVendor" class="input" style="width:100%;margin-bottom:12px" placeholder="e.g. Saddar Store">
    <label class="muted" style="font-size:12px">Note (optional)</label>
    <input id="rxMemo" class="input" style="width:100%;margin-bottom:6px" placeholder="e.g. bottles restock">
    <div id="rxBusy" class="hidden" style="font-size:13px;color:var(--blue-700);margin-top:8px">Saving…</div>
  `, `<button class="btn ghost" data-close-modal>Cancel</button><button class="btn primary" id="rxSave">Save receipt</button>`);
  document.getElementById('rxSave').addEventListener('click', saveScannedReceipt);
  const fileEl = document.getElementById('rxFile');
  fileEl.addEventListener('change', async () => {
    const f = fileEl.files[0];
    if (!f) return;
    const img = document.getElementById('rxImg');
    img.src = URL.createObjectURL(f);
    img.style.display = 'block';
  });
}

// verify & approve modal — finance/admin reviews the AI extraction, edits ANY field, approves
async function modalReviewReceipt(id) {
  const rows = await API.receipts(null, 'pending');
  const r = rows.find(x => x.id === id) || (await API.receipts(null, null)).find(x => x.id === id);
  if (!r) { ppToast('Receipt not found', 'bad'); return; }
  const ext = JSON.parse(JSON.stringify(r.extracted || {}));
  const isPP = ext.type === 'purepak';
  // editable item rows — PurePak book format: fixed 5 sizes with qty/rate/amount
  let itemRows;
  if (isPP) {
    const SIZES = ['500ml', '1.5L', '6L', '12L', '19L'];
    itemRows = SIZES.map(sz => {
      const it = (Array.isArray(ext.items) ? ext.items.find(x => String(x.size).toLowerCase() === sz.toLowerCase()) : null) || {};
      return `<tr class="rv-item-row" data-size="${sz}">
        <td style="font-weight:700">${sz}</td>
        <td><input class="input rv-qty" style="width:64px" type="number" inputmode="decimal" min="0" placeholder="—" value="${it.qty != null ? it.qty : ''}"></td>
        <td><input class="input rv-rate" style="width:84px" type="number" inputmode="decimal" min="0" placeholder="—" value="${it.rate != null ? it.rate : ''}"></td>
        <td><input class="input rv-amt" style="width:92px" type="number" inputmode="decimal" min="0" placeholder="—" value="${it.amount != null ? it.amount : ''}"></td>
      </tr>`;
    }).join('');
  } else {
    const lis = Array.isArray(ext.line_items) ? ext.line_items : [];
    itemRows = lis.map(li => `<div class="rv-gitem" style="display:grid;grid-template-columns:1fr 70px 90px 24px;gap:6px;align-items:center;margin-bottom:6px">
      <input class="input rv-gitem-desc" type="text" placeholder="Item" value="${API.esc(li.item || li.description || '')}">
      <input class="input rv-gitem-qty" type="number" inputmode="decimal" placeholder="Qty" value="${li.qty != null ? li.qty : ''}">
      <input class="input rv-gitem-price" type="number" inputmode="decimal" placeholder="Price" value="${li.price != null ? li.price : ''}">
      <button class="btn ghost sm rv-gitem-del" type="button" style="padding:4px 6px" title="Remove">✕</button>
    </div>`).join('');
  }
  openModal('Verify & approve · receipt #' + id, `
    <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px">
      <img src="${API.receiptImage(id)}?token=${API.token}" style="width:84px;height:104px;object-fit:cover;border-radius:10px;border:1px solid var(--line)" alt="receipt">
      <div style="flex:1;min-width:0;font-size:13px">
        <div class="muted" style="text-transform:uppercase;letter-spacing:.04em;font-size:11.5px">Scanned by ${API.esc(r.recorded_by || '—')} · ${API.fmtDay(r.created_at)}</div>
        <label class="muted" style="font-size:12px;margin-top:8px;display:block">Customer / vendor</label>
        <input id="rvVendor" class="input" style="width:100%" value="${API.esc(r.vendor || ext.vendor || (isPP ? ext.customer_name : '') || '')}">
        ${isPP ? `<div class="row2" style="margin-top:8px">
          <div><label class="muted" style="font-size:12px">Receipt no.</label><input id="rvNo" class="input" style="width:100%" value="${API.esc(ext.receipt_no || '')}"></div>
          <div><label class="muted" style="font-size:12px">Address</label><input id="rvAddr" class="input" style="width:100%" value="${API.esc(ext.customer_address || '')}"></div>
        </div>` : ''}
      </div>
    </div>
    <div class="muted" style="font-size:12px;margin-bottom:6px">${isPP ? 'Item lines — leave a line empty if not written on the receipt' : 'Line items'}</div>
    <div style="max-height:318px;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--slate-bg)">
      ${isPP ? `<table class="mini-items rv-table"><tr><th>Size</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr>${itemRows}
        <tr class="tot"><td colspan="3">Total <span class="muted" style="font-weight:400">(auto)</span></td><td class="num" id="rvTotalLive">—</td></tr></table>`
        : `<div id="rvGitems">${itemRows}<button class="btn ghost sm" id="rvAddGitem" type="button" style="margin-top:4px">+ Add line</button></div>`}
    </div>
    <div class="row2" style="margin-top:10px">
      <div><label class="muted" style="font-size:12px">Total amount (PKR)</label><input id="rvAmount" type="number" inputmode="decimal" class="input" style="width:100%" value="${r.amount != null ? r.amount : ''}"></div>
      <div><label class="muted" style="font-size:12px">Type</label>
        <select id="rvKind" class="input" style="width:100%">
          ${['sales', 'expense', 'income', 'agent_commission', 'other'].map(k => `<option value="${k}" ${k === r.kind ? 'selected' : ''}>${k === 'sales' ? 'Sales' : k.replace('_', ' ')}</option>`).join('')}
        </select>
      </div>
    </div>
    ${isPP ? `<label class="muted" style="font-size:12px;margin-top:10px;display:flex;align-items:center;gap:6px"><input type="checkbox" id="rvPending" ${ext.payment_status === 'pending' ? 'checked' : ''} style="width:auto;padding:0"> Payment pending on this receipt</label>` : ''}
    <label class="muted" style="font-size:12px;margin-top:10px;display:block">Note</label>
    <input id="rvMemo" class="input" style="width:100%" value="${API.esc(r.memo || '')}">
  `, `<button class="btn danger" id="rvReject">Reject</button><button class="btn primary" id="rvApprove">Approve receipt</button>`);

  // live total for PurePak book format
  let amountTouched = false;
  const amtElInit = document.getElementById('rvAmount');
  if (amtElInit) amtElInit.addEventListener('input', () => { amountTouched = true; });
  const refreshTotal = () => {
    if (!isPP) return;
    let s = 0, any = false;
    document.querySelectorAll('#modalRoot .rv-item-row').forEach(row => {
      const amt = parseFloat(row.querySelector('.rv-amt').value);
      if (!isNaN(amt) && amt > 0) { s += amt; any = true; }
    });
    const el = document.getElementById('rvTotalLive');
    const amtEl = document.getElementById('rvAmount');
    if (el) el.textContent = any ? API.fmtMoney(s) : '—';
    if (any && amtEl && !amountTouched) amtEl.value = s;
  };
  document.querySelectorAll('#modalRoot .rv-amt').forEach(i => i.addEventListener('input', refreshTotal));
  refreshTotal(); // show the live total on open
  // auto-fill amount = qty x rate when both present (PurePak)
  if (isPP) document.querySelectorAll('#modalRoot .rv-item-row').forEach(row => {
    const q = row.querySelector('.rv-qty'), rt = row.querySelector('.rv-rate'), am = row.querySelector('.rv-amt');
    const autofill = () => {
      const a = parseFloat(q.value), b = parseFloat(rt.value);
      if (!isNaN(a) && !isNaN(b)) { am.value = a * b; refreshTotal(); }
    };
    q.addEventListener('input', autofill); rt.addEventListener('input', autofill);
  });
  // generic: add/remove lines
  const addGitem = () => {
    const wrap = document.getElementById('rvGitems');
    if (!wrap) return;
    const d = document.createElement('div');
    d.className = 'rv-gitem';
    d.style.cssText = 'display:grid;grid-template-columns:1fr 70px 90px 24px;gap:6px;align-items:center;margin-bottom:6px';
    d.innerHTML = `<input class="input rv-gitem-desc" type="text" placeholder="Item"><input class="input rv-gitem-qty" type="number" inputmode="decimal" placeholder="Qty"><input class="input rv-gitem-price" type="number" inputmode="decimal" placeholder="Price"><button class="btn ghost sm rv-gitem-del" type="button" style="padding:4px 6px" title="Remove">✕</button>`;
    wrap.insertBefore(d, document.getElementById('rvAddGitem'));
    d.querySelector('.rv-gitem-del').addEventListener('click', () => d.remove());
  };
  const gitemDel = (btn) => btn.closest('.rv-gitem').remove();
  const bindGDel = () => document.querySelectorAll('#modalRoot .rv-gitem-del').forEach(b => b.addEventListener('click', () => gitemDel(b)));
  bindGDel();
  const addBtn = document.getElementById('rvAddGitem');
  if (addBtn) addBtn.addEventListener('click', addGitem);

  document.getElementById('rvReject').addEventListener('click', async () => {
    const reason = await confirmDialog({
      title: 'Reject this receipt',
      message: 'It will be deleted and the reason sent to the person who scanned it.',
      okLabel: 'Reject',
      danger: true,
      input: { placeholder: 'Reason (required)', required: true, hint: 'The scanner sees this so they can re-capture or fix it.' },
    });
    if (typeof reason !== 'string') return; // cancelled
    try { await API.rejectReceipt(id, reason); closeModal(); ppToast('Receipt rejected — sender notified', 'ok'); App.refresh(); }
    catch (err) { ppToast(err.message, 'bad'); }
  });
  document.getElementById('rvApprove').addEventListener('click', async () => {
    const payload = {
      amount: document.getElementById('rvAmount').value,
      kind: document.getElementById('rvKind').value,
      vendor: document.getElementById('rvVendor').value,
      memo: document.getElementById('rvMemo').value,
    };
    if (isPP) {
      const items = [...document.querySelectorAll('#modalRoot .rv-item-row')].map(row => {
        const q = parseFloat(row.querySelector('.rv-qty').value);
        const rt = parseFloat(row.querySelector('.rv-rate').value);
        const am = parseFloat(row.querySelector('.rv-amt').value);
        if (isNaN(q) && isNaN(rt) && isNaN(am)) return null;
        return { size: row.dataset.size, qty: isNaN(q) ? null : q, rate: isNaN(rt) ? null : rt, amount: isNaN(am) ? null : am };
      }).filter(Boolean);
      const total = parseFloat(document.getElementById('rvAmount').value);
      payload.extracted = { ...ext, items, total: isNaN(total) ? null : total, total_from: isNaN(total) ? 'summed' : 'edited',
        customer_name: document.getElementById('rvVendor').value || null,
        receipt_no: document.getElementById('rvNo').value || null,
        customer_address: document.getElementById('rvAddr').value || null,
        payment_status: document.getElementById('rvPending').checked ? 'pending' : null };
    } else {
      payload.extracted = { ...ext, line_items: [...document.querySelectorAll('#modalRoot .rv-gitem')].map(d => ({
        item: d.querySelector('.rv-gitem-desc').value || null,
        qty: parseFloat(d.querySelector('.rv-gitem-qty').value) || null,
        price: parseFloat(d.querySelector('.rv-gitem-price').value) || null,
      })) };
    }
    const amt = Number(payload.amount);
    if (!(amt > 0)) { ppToast('Enter the total amount to approve', 'warn'); return; }
    try {
      await API.approveReceipt(id, payload);
      closeModal();
      ppToast('Approved — sender & team notified', 'ok');
      App.refresh();
    } catch (e2) { ppToast(e2.message, 'bad'); }
  });
}

// safe entry from notifications: opens the verify modal only if the receipt is still in staging
async function modalReviewReceiptSafe(id) {
  if (typeof modalReviewReceipt !== 'function') return;
  try {
    const rows = await API.receipts(null, null);
    const r = rows.find(x => x.id === id);
    if (!r) { ppToast('Receipt no longer exists', 'warn'); return; }
    if (r.status === 'approved' || r.posted) {
      ppToast('Receipt #' + id + ' is ' + (r.posted ? 'in the ledger' : 'already approved'), 'info');
      App.refresh();
      return;
    }
    modalReviewReceipt(id);
  } catch (e) { ppToast(e.message, 'bad'); }
}

// save the scanned receipt (upload) — from the capture modal
async function saveScannedReceipt() {
  const fileEl = document.getElementById('rxFile');
  const f = fileEl.files[0];
  if (!f) { ppToast('Choose a receipt photo first', 'warn'); return; }
  const btn = document.getElementById('rxSave');
  if (btn) btn.disabled = true;
  document.getElementById('rxBusy').classList.remove('hidden');
  try {
    const { dataUrl, mimetype } = await fileToDataUrl(f);
    const r = await API.uploadReceipt({
      image: dataUrl,
      mimetype,
      filename: f.name,
      kind: document.getElementById('rxKind').value,
      amount: document.getElementById('rxAmount').value || null,
      vendor: document.getElementById('rxVendor').value || null,
      memo: document.getElementById('rxMemo').value || null,
    });
    closeModal();
    receiptModalOpen = false;
    ppToast('Receipt saved', 'ok');
    App.refresh();
    // poll until OCR finishes (max ~60s), then refresh again
    let tries = 0;
    const t = setInterval(async () => {
      tries++;
      try {
        const rows = await API.receipts(null, 'pending');
        const rec = rows.find(x => x.id === r.id);
        if (!rec || (rec && rec.ocr_status !== 'pending') || tries > 20) {
          clearInterval(t);
          App.refresh();
          if (rec && rec.ocr_status === 'done') {
            ppToast('Receipt details read — ' + (rec.extracted.vendor || 'saved to staging'), 'ok');
          } else if (rec && rec.ocr_status === 'failed') {
            ppToast('Saved — check the details and verify it', 'warn');
          }
        }
      } catch { clearInterval(t); }
    }, 3000);
  } catch (e) {
    document.getElementById('rxBusy').classList.add('hidden');
    ppToast('Could not save receipt: ' + e.message, 'err');
    if (btn) btn.disabled = false;
  }
}

// ---- team / staff management ----
async function viewTeam() {
  const u = API.user;
  const isRoot = u.role === 'admin';
  const all = await API.users();
  const agents = all.filter(r => r.role === 'agent');
  const rows = all.filter(r => r.role !== 'agent')
    .sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || a.role.localeCompare(b.role) || a.name.localeCompare(b.name));
  const pending = rows.filter(r => r.status === 'pending');
  const active = rows.filter(r => r.status === 'active');
  const monthly = active.reduce((a, r) => a + (Number(r.salary) || 0), 0);
  const roleChip = (r) => `<span class="chip ${r.role}">${r.role === 'employee' ? 'employee' : r.role}</span>`;
  const statusChip = (r) => r.status === 'pending'
    ? '<span class="chip pending">Pending</span>'
    : (r.status === 'disabled' ? '<span class="chip cancelled">Disabled</span>' : '<span class="chip approved">Active</span>');
  const canViewAgents = ['admin', 'manager', 'finance'].includes(u.role);
  return `<div class="page-head"><h1>Team</h1>
    <button class="btn primary sm" data-act="add-employee">+ Add employee</button></div>
    <div class="grid kpis" style="margin-top:14px">
      <div class="card kpi"><div class="k-label">Employees</div><div class="k-val">${active.filter(r => r.role !== 'customer').length}</div></div>
      <div class="card kpi warn"><div class="k-label">Awaiting activation</div><div class="k-val">${pending.length}</div></div>
      <div class="card kpi"><div class="k-label">Monthly payroll</div><div class="k-val">Rs ${Math.round(monthly).toLocaleString('en-PK')}</div></div>
    </div>
    ${pending.length ? '<div class="sec-t">Needs attention — ' + pending.length + ' awaiting activation</div>' : ''}
    ${rows.map(teamRowHtml).join('') || '<div class="empty">No employees yet.</div>'}
    ${canViewAgents ? `
    <div class="sec-t">Commission agents — ${agents.length}</div>
    <div class="card" style="padding:14px 16px">
      <p class="muted" style="font-size:12.5px;margin:0 0 10px">Agents are commission-based — their rates, activation and daily settings live in <b>Commission agents</b>.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        ${agents.map(a => `<span class="chip ${a.status === 'pending' ? 'pending' : a.status === 'disabled' ? 'cancelled' : 'agent'}" style="text-transform:none;letter-spacing:0;font-weight:600">${API.esc(a.name)}</span>`).join('') || '<span class="muted" style="font-size:12.5px">No agents yet</span>'}
      </div>
      <button class="btn sm" data-act="nav" data-to="agents">Open commission agents →</button>
    </div>` : ''}`;

  function teamRowHtml(r) {
    const sub = [r.agentName && 'Agent: ' + r.agentName, r.customerName && 'Customer: ' + r.customerName,
      r.email, r.last_login_at ? 'last in ' + API.fmtDay(r.last_login_at) : 'never signed in'].filter(Boolean).join(' · ');
    const canTouch = !(r.role === 'admin' && !isRoot) && !(r.role === 'manager' && !isRoot) && !(r.id === u.id && r.status === 'active' && r.role === 'admin');
    const acts = [];
    if (r.status === 'pending') acts.push(`<button class="btn primary sm" data-act="team-activate" data-id="${r.id}">Activate</button>`);
    else if (r.status === 'active' && canTouch) acts.push(`<button class="btn ghost sm" data-act="team-disable" data-id="${r.id}">Disable</button>`);
    else if (r.status === 'disabled') acts.push(`<button class="btn ghost sm" data-act="team-activate" data-id="${r.id}">Re-activate</button>`);
    if (r.role !== 'customer' && canTouch) acts.push(`<button class="btn ghost sm" data-act="team-edit" data-id="${r.id}">Edit</button>`);
    if (canTouch) acts.push(`<button class="btn ghost sm" data-act="team-resetpw" data-id="${r.id}">Reset pw</button>`);
    const hasFoot = r.salary || acts.length;
    return `<div class="team-row">
      <div class="team-av">${API.esc((r.name[0] || '?').toUpperCase())}</div>
      <div class="team-col">
        <div class="nm">${API.esc(r.name)} ${roleChip(r)} ${statusChip(r)}</div>
        <div class="sub">${API.esc(sub)}</div>
        ${hasFoot ? `<div class="team-foot">
          ${r.salary ? `<div class="team-sal">${API.fmtMoney(r.salary)}<span>mth</span></div>` : '<span></span>'}
          <div class="team-acts">${acts.join('')}</div>
        </div>` : ''}
      </div>
    </div>`;
  }
}

function modalAddEmployee() {
  const u = API.user;
  const isRoot = u.role === 'admin';
  const roles = [
    ['employee', 'Employee (office / general staff)'], ['delivery', 'Delivery'], ['finance', 'Finance'], ['agent', 'Agent (commissioned)'], ['customer', 'Customer'],
    ...(isRoot ? [['manager', 'Manager'], ['admin', 'Admin']] : []),
  ];
  openModal('Add employee', `
    <div class="modal-bd">
      <label class="muted">Full name</label>
      <input id="empName" class="input" style="width:100%;margin-bottom:10px" placeholder="e.g. Kamran Ali">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div><label class="muted">Email</label><input id="empEmail" class="input" style="width:100%" type="email" placeholder="name@purepak.pk"></div>
        <div><label class="muted">Phone</label><input id="empPhone" class="input" style="width:100%" placeholder="03xx-xxxxxxx"></div>
      </div>
      <label class="muted">Role</label>
      <select id="empRole" class="input" style="width:100%;margin-bottom:10px">
        ${roles.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}
      </select>
      <label class="muted">Initial password (they should change it)</label>
      <input id="empPass" class="input" style="width:100%;margin-bottom:10px" value="purepak${Math.floor(1000 + Math.random() * 9000)}">
      <div id="empSalaryBox">
        <label class="muted">Monthly salary (Rs, leave empty if none)</label>
        <input id="empSalary" class="input" style="width:100%;margin-bottom:4px" type="number" min="0" placeholder="e.g. 25000">
      </div>
      <div id="empSalaryNote" style="display:none;margin:2px 0 4px"><p class="muted" style="font-size:11.5px;margin:0">Agents are commission-based — earnings come from order commissions, set their rate in <b>Commission agents</b>.</p></div>
    </div>`,
    `<button class="btn ghost" data-close-modal>Cancel</button>
     <button class="btn primary" id="empSubmit">Add employee</button>`);
  const roleSel = document.getElementById('empRole');
  roleSel.addEventListener('change', () => {
    const agent = roleSel.value === 'agent';
    document.getElementById('empSalaryBox').style.display = agent ? 'none' : '';
    document.getElementById('empSalaryNote').style.display = agent ? '' : 'none';
  });
  document.getElementById('empSubmit').addEventListener('click', async () => {
    const b = {
      name: document.getElementById('empName').value.trim(),
      email: document.getElementById('empEmail').value.trim(),
      phone: document.getElementById('empPhone').value.trim() || null,
      role: roleSel.value,
      password: document.getElementById('empPass').value,
      salary: roleSel.value === 'agent' ? null : (document.getElementById('empSalary').value || null),
    };
    if (b.name.length < 2 || !b.password) { toast('Fill in name and password', 'warn'); return; }
    try {
      await API.createUser(b);
      closeModal();
      toast('Employee added — active and ready', 'ok');
      App.refresh();
    } catch (e) { toast(e.message, 'err'); }
  });
}

function modalEditEmployee(id) {
  const u = API.user;
  const isRoot = u.role === 'admin';
  API.users().then(rows => {
    const r = rows.find(x => x.id === id);
    if (!r) return;
    const roles = [
      ['delivery', 'Delivery'], ['finance', 'Finance'], ['agent', 'Agent (commissioned)'], ['customer', 'Customer'],
      ...(isRoot ? [['manager', 'Manager'], ['admin', 'Admin']] : []),
    ].filter(([k]) => !(k === 'admin' || k === 'manager') || isRoot);
    const protectedTarget = !isRoot && ['admin', 'manager'].includes(r.role);
    openModal('Edit employee — ' + API.esc(r.name), `
      <div class="modal-bd">
        <label class="muted">Name</label>
        <input id="emName" class="input" style="width:100%;margin-bottom:10px" value="${API.esc(r.name)}">
        <label class="muted">Role</label>
        <select id="emRole" class="input" style="width:100%;margin-bottom:10px" ${protectedTarget ? 'disabled' : ''}>
          ${roles.map(([k, l]) => `<option value="${k}" ${k === r.role ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <div ${r.role === 'agent' ? 'style="display:none"' : ''} id="emSalaryBox">
          <label class="muted">Monthly salary (Rs)</label>
          <input id="emSalary" class="input" style="width:100%;margin-bottom:4px" type="number" min="0" value="${r.salary ?? ''}">
        </div>
        <div ${r.role === 'agent' ? '' : 'style="display:none"'} id="emSalaryNote"><p class="muted" style="font-size:11.5px;margin:0">Agents are commission-based — no fixed salary. Set the rate in <b>Commission agents</b>.</p></div>
        <p class="muted" style="font-size:11.5px;margin-top:8px">Changing the role or salary notifies the employee and staff. Payroll uses the salary for the current and future months.</p>
      </div>`,
      `<button class="btn ghost" data-close-modal>Cancel</button>
       <button class="btn primary" id="emSave">Save changes</button>`);
    const emRole = document.getElementById('emRole');
    emRole.addEventListener('change', () => {
      const agent = emRole.value === 'agent';
      document.getElementById('emSalaryBox').style.display = agent ? 'none' : '';
      document.getElementById('emSalaryNote').style.display = agent ? '' : 'none';
    });
    document.getElementById('emSave').addEventListener('click', async () => {
      const b = {
        name: document.getElementById('emName').value.trim(),
        role: emRole.value,
        salary: emRole.value === 'agent' ? null : (document.getElementById('emSalary').value === '' ? null : Number(document.getElementById('emSalary').value)),
      };
      if (protectedTarget) delete b.role;
      try {
        await API.updateUser(id, b);
        closeModal();
        toast('Employee updated', 'ok');
        App.refresh();
      } catch (e) { toast(e.message, 'err'); }
    });
  });
}

// ---- payroll ----
let _payPeriod = null;
function setPayPeriod(p) { _payPeriod = p || null; }
async function viewPayroll() {
  const u = API.user;
  const period = _payPeriod || new Date().toISOString().slice(0, 7);
  const data = await API.payroll(period);
  const anyEntry = data.rows.some(r => r.entry);
  return `<div class="page-head"><h1>Payroll</h1>
    <input type="month" id="payPeriod" class="input" style="max-width:150px" value="${data.period}" data-act-none>
    ${!anyEntry ? `<button class="btn primary sm" data-act="payroll-generate">Generate month</button>` : ''}
  </div>
  <div class="grid kpis" style="margin-top:4px">
    <div class="card kpi"><div class="k-label">Total due</div><div class="k-val">Rs ${Math.round(data.totals.due).toLocaleString('en-PK')}</div></div>
    <div class="card kpi"><div class="k-label">Salaries</div><div class="k-val">Rs ${Math.round(data.totals.salary).toLocaleString('en-PK')}</div></div>
    <div class="card kpi"><div class="k-label">Commissions</div><div class="k-val">Rs ${Math.round(data.totals.commission).toLocaleString('en-PK')}</div></div>
  </div>
  ${data.rows.map(r => {
    const paid = r.entry && r.entry.status === 'paid';
    const isAgent = r.role === 'agent';
    const sub = isAgent
      ? `Commission-based${r.commission ? ' · accrued commission ' + API.fmtMoney(r.commission) : ''}`
      : `Salary ${r.salary ? API.fmtMoney(r.salary) : '—'}${r.commission ? ' · commission ' + API.fmtMoney(r.commission) : ''}`;
    return `<div class="pay-row">
      <div class="team-av">${API.esc((r.name[0] || '?').toUpperCase())}</div>
      <div class="pm">
        <div class="nm">${API.esc(r.name)} <span class="chip ${r.role}" style="margin-left:4px">${r.role}</span></div>
        <div class="sub">${sub}${paid ? ' · paid ' + API.fmtDay(r.entry.paid_at) : ''}</div>
      </div>
      <div class="pay-amt">${API.fmtMoney(r.due)}</div>
      ${paid ? '<span class="chip paid">Paid</span>'
        : (r.entry
          ? `<button class="btn primary sm" data-act="payroll-pay" data-id="${r.entry.id}">Mark paid</button>`
          : `<button class="btn ghost sm" data-act="payroll-pay-one" data-uid="${r.user_id}" data-amt="${r.entry ? r.entry.amount : (r.salary || r.commission || 0)}">Add & pay</button>`)}
    </div>`;
  }).join('') || '<div class="empty">No staff with a salary yet. Set salaries from Team.</div>'}
  <p class="muted" style="font-size:12px;margin-top:10px">Salaries post to the ledger under <b>Salaries &amp; Wages</b>. Agents are commission-based — paying their accrued commission posts to <b>Commissions</b> and settles it in the Commissions screen.</p>`;
}

// ---- customers (with type) ----
async function viewCustomers() {
  const u = API.user;
  const canEdit = ['admin', 'manager', 'finance'].includes(u.role);
  const [rows, types] = await Promise.all([API.customers(), API.customerTypes()]);
  return `<div class="page-head"><h1>Customers</h1>
    ${canEdit ? '<button class="btn primary sm" data-act="add-customer">+ Add customer</button>' : ''}</div>
    ${rows.map(c => `
    <div class="team-row">
      <div class="team-av">${API.esc((c.name[0] || '?').toUpperCase())}</div>
      <div class="team-main">
        <div class="nm">${API.esc(c.name)} <span class="chip ${c.type === 'retail' ? 'pending' : 'approved'}">${c.type}</span></div>
        <div class="sub">${API.esc(c.contact_name || c.phone)}${c.address ? ' · ' + API.esc(c.address) : ''}${c.orders_count ? ' · ' + c.orders_count + ' orders' : ''}</div>
      </div>
      ${canEdit ? `<div class="team-acts"><button class="btn ghost sm" data-act="edit-customer" data-id="${c.id}">Edit</button></div>` : ''}
    </div>`).join('')}`;
}

function modalEditCustomer(id) {
  API.customers().then(rows => {
    const c = rows.find(x => x.id === id);
    if (!c) return;
    API.customerTypes().then(types => {
      openModal('Customer — ' + API.esc(c.name), `
        <div class="modal-bd">
          <label class="muted">Name</label>
          <input id="cuName" class="input" style="width:100%;margin-bottom:10px" value="${API.esc(c.name)}">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
            <div><label class="muted">Phone</label><input id="cuPhone" class="input" style="width:100%" value="${API.esc(c.phone || '')}"></div>
            <div><label class="muted">Area</label><input id="cuArea" class="input" style="width:100%" value="${API.esc(c.area || '')}"></div>
          </div>
          <label class="muted">Customer type (sets their pricing)</label>
          <select id="cuType" class="input" style="width:100%;margin-bottom:4px">
            ${types.map(t => `<option value="${t}" ${t === c.type ? 'selected' : ''}>${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}
          </select>
          <p class="muted" style="font-size:11.5px;margin-top:8px">New orders use the price list for this type. Blank cells in the price list fall back to the base price.</p>
        </div>`,
        `<button class="btn ghost" data-close-modal>Cancel</button>
         <button class="btn primary" id="cuSave">Save</button>`);
      document.getElementById('cuSave').addEventListener('click', async () => {
        const b = {
          name: document.getElementById('cuName').value.trim(),
          phone: document.getElementById('cuPhone').value.trim(),
          area: document.getElementById('cuArea').value.trim() || null,
          type: document.getElementById('cuType').value,
        };
        try {
          await API.updateCustomer(id, b);
          closeModal();
          toast('Customer updated', 'ok');
          App.refresh();
        } catch (e) { toast(e.message, 'err'); }
      });
    });
  });
}

function modalAddCustomer() {
  API.customerTypes().then(types => {
    openModal('Add customer', `
      <div class="modal-bd">
        <label class="muted">Business / person name</label>
        <input id="ncName" class="input" style="width:100%;margin-bottom:10px" placeholder="e.g. Gulshan Diner">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div><label class="muted">Phone</label><input id="ncPhone" class="input" style="width:100%" placeholder="03xx-xxxxxxx"></div>
          <div><label class="muted">Area</label><input id="ncArea" class="input" style="width:100%" placeholder="e.g. I-8"></div>
        </div>
        <label class="muted">Customer type (sets their pricing)</label>
        <select id="ncType" class="input" style="width:100%;margin-bottom:4px">
          ${types.map(t => `<option value="${t}">${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}
        </select>
      </div>`,
      `<button class="btn ghost" data-close-modal>Cancel</button>
       <button class="btn primary" id="ncSubmit">Add customer</button>`);
    document.getElementById('ncSubmit').addEventListener('click', async () => {
      const b = {
        name: document.getElementById('ncName').value.trim(),
        phone: document.getElementById('ncPhone').value.trim(),
        area: document.getElementById('ncArea').value.trim() || null,
        type: document.getElementById('ncType').value,
      };
      if (!b.name || !b.phone) { toast('Name and phone are required', 'warn'); return; }
      try {
        await API.createCustomer(b);
        closeModal();
        toast('Customer added', 'ok');
        App.refresh();
      } catch (e) { toast(e.message, 'err'); }
    });
  });
}

// ---- products + price matrix ----
async function viewProducts() {
  const u = API.user;
  const canEdit = ['admin', 'manager'].includes(u.role);
  const [ps, pricing] = await Promise.all([API.products(), API.pricing()]);
  const types = Object.keys(pricing[0].prices);
  return `<div class="page-head"><h1>Products &amp; pricing</h1>
    ${canEdit ? '<button class="btn primary sm" data-act="add-product">+ Add product</button>' : ''}</div>
    <div class="card" style="margin-bottom:16px"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Product</th><th class="num">Size</th><th class="num">Base price</th><th>Status</th>${canEdit ? '<th></th>' : ''}</tr></thead>
      <tbody>${ps.map(p => `<tr style="${p.active ? '' : 'opacity:.55'}">
        <td class="cell-main" data-l="Product">${API.esc(p.name)}${p.active ? '' : ' <span class="chip cancelled">Paused</span>'}
          ${canEdit ? ` <button class="btn ghost sm" style="margin-left:6px" data-act="edit-product" data-id="${p.id}">Edit</button>` : ''}
        </td>
        ${V.m('Size', p.size_ml + ' ml', 'tv num')}
        ${V.m('Price', API.fmtMoney(p.price), 'tv num')}
        ${V.m('Status', p.active ? '<span class="chip approved">Active</span>' : '<span class="chip cancelled">Off</span>', '')}
        ${canEdit ? `<td class="tv"><button class="btn sm ${p.active ? 'ghost' : 'primary'}" data-act="toggle-product" data-id="${p.id}" data-active="${p.active ? 1 : 0}">${p.active ? 'Pause' : 'Enable'}</button></td>` : ''}
      </tr>`).join('')}</tbody></table></div></div>
    <div class="sec-t">Price list by customer type</div>
    <div class="matrix-wrap"><table class="matrix">
      <thead><tr><th>Product</th>${types.map(t => `<th>${t[0].toUpperCase() + t.slice(1)}</th>`).join('')}</tr></thead>
      <tbody>${pricing.map(p => `<tr>
        <td><b>${API.esc(p.name)}</b><div class="base">base ${API.fmtMoney(p.price)}</div></td>
        ${types.map(t => {
          const v = p.prices ? p.prices[t] : null;
          return `<td class="inp">${canEdit
            ? `<input data-pp="${p.id}" data-pt="${t}" type="number" min="0" step="0.5" value="${v == null ? '' : v}" placeholder="${p.price}">`
            : `<b>${v == null ? '—' : API.fmtMoney(v)}</b><div class="base">${v == null ? 'base' : 'override'}</div>`}
          </td>`;
        }).join('')}
      </tr>`).join('')}</tbody>
    </table></div>
    ${canEdit ? `<div style="display:flex;gap:10px;margin-top:12px">
      <button class="btn primary" data-act="save-matrix">Save price list</button>
      <span class="muted" style="font-size:12px;align-self:center">Blank = use base price. Applies to new orders.</span>
    </div>` : ''}`;
}

function modalAddProduct() {
  openModal('Add product', `
    <div class="modal-bd">
      <label class="muted">Name</label>
      <input id="prName" class="input" style="width:100%;margin-bottom:10px" placeholder="e.g. Pure Pak 2 L">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div><label class="muted">Size (ml)</label><input id="prSize" class="input" style="width:100%" type="number" min="0" placeholder="2000"></div>
        <div><label class="muted">Base price (Rs)</label><input id="prPrice" class="input" style="width:100%" type="number" min="0" step="0.5" placeholder="25"></div>
      </div>
    </div>`,
    `<button class="btn ghost" data-close-modal>Cancel</button>
     <button class="btn primary" id="prSubmit">Add product</button>`);
  document.getElementById('prSubmit').addEventListener('click', async () => {
    const b = {
      name: document.getElementById('prName').value.trim(),
      size_ml: Number(document.getElementById('prSize').value),
      price: Number(document.getElementById('prPrice').value),
    };
    if (!b.name || !(b.size_ml > 0) || !(b.price >= 0)) { toast('Fill in name, size and price', 'warn'); return; }
    try {
      await API.createProduct(b);
      closeModal();
      toast('Product added', 'ok');
      App.refresh();
    } catch (e) { toast(e.message, 'err'); }
  });
}

function modalEditProduct(id) {
  API.products().then(ps => {
    const p = ps.find(x => x.id === id);
    if (!p) return;
    openModal('Edit product — ' + API.esc(p.name), `
      <div class="modal-bd">
        <label class="muted">Name</label>
        <input id="epName" class="input" style="width:100%;margin-bottom:10px" value="${API.esc(p.name)}">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div><label class="muted">Size (ml)</label><input id="epSize" class="input" style="width:100%" type="number" min="0" value="${p.size_ml}"></div>
          <div><label class="muted">Base price (Rs)</label><input id="epPrice" class="input" style="width:100%" type="number" min="0" step="0.5" value="${p.price}"></div>
        </div>
        <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="epActive" ${p.active ? 'checked' : ''} style="width:auto"> Available for ordering</label>
      </div>`,
      `<button class="btn ghost" data-close-modal>Cancel</button>
       <button class="btn primary" id="epSave">Save</button>`);
    document.getElementById('epSave').addEventListener('click', async () => {
      const b = {
        name: document.getElementById('epName').value.trim(),
        size_ml: Number(document.getElementById('epSize').value),
        price: Number(document.getElementById('epPrice').value),
        active: document.getElementById('epActive').checked,
      };
      try {
        await API.updateProduct(id, b);
        closeModal();
        toast('Product updated', 'ok');
        App.refresh();
      } catch (e) { toast(e.message, 'err'); }
    });
  });
}

// ---- nav definitions ----
const ADMIN_NAV = [
  { to: 'dashboard', icon: IC.chart, label: 'Dashboard' },
  { to: 'orders', icon: IC.box, label: 'Orders' },
  { to: 'deliveries', icon: IC.truck, label: 'Deliveries' },
  { to: 'route', icon: IC.route, label: 'Route map' },
  { to: 'customers', icon: IC.users, label: 'Customers' },
  { to: 'agents', icon: IC.badge, label: 'Agents' },
  { to: 'commissions', icon: IC.cash, label: 'Commissions' },
  { to: 'bookkeeping', icon: IC.book, label: 'Book keeping' },
  { to: 'receipts', icon: IC.receipt, label: 'Receipts' },
  { to: 'team', icon: IC.shield, label: 'Team' },
  { to: 'payroll', icon: IC.wallet, label: 'Payroll' },
  { to: 'products', icon: IC.bottle, label: 'Products' },
];
function navFor(role) {
  const N = {
    admin: ADMIN_NAV,
    manager: ADMIN_NAV,
    finance: [
      { to: 'dashboard', icon: IC.chart, label: 'Finance' },
      { to: 'bookkeeping', icon: IC.book, label: 'Book keeping' },
      { to: 'commissions', icon: IC.cash, label: 'Agent dues' },
      { to: 'orders', icon: IC.box, label: 'Order payments' },
      { to: 'receipts', icon: IC.receipt, label: 'Receipts' },
      { to: 'payroll', icon: IC.wallet, label: 'Payroll' },
      { to: 'agents', icon: IC.badge, label: 'Agents' },
    ],
    agent: [
      { to: 'dashboard', icon: IC.chart, label: 'My dashboard' },
      { to: 'orders', icon: IC.box, label: 'My orders' },
      { to: 'commissions', icon: IC.cash, label: 'My commission' },
      { to: 'receipts', icon: IC.receipt, label: 'Receipts' },
    ],
    delivery: [
      { to: 'route', icon: IC.route, label: 'Smart route' },
      { to: 'deliveries', icon: IC.truck, label: 'All deliveries' },
      { to: 'receipts', icon: IC.receipt, label: 'Scan receipt' },
    ],
    employee: [
      { to: 'profile', icon: IC.users, label: 'My profile' },
    ],
    customer: [
      { to: 'home', icon: IC.drop, label: 'Shop' },
      { to: 'orders', icon: IC.box, label: 'My orders' },
    ],
  };
  return N[role] || [];
}

// view router: route key -> renderer (ctx = {params})
const VIEW = {
  admin: {
    dashboard: viewAdminDashboard, orders: viewOrders, deliveries: viewDeliveries,
    route: viewSmartRoute,
    customers: viewCustomers,
    agents: viewAgents, commissions: viewCommissions, bookkeeping: viewBookkeeping, receipts: viewReceipts,
    team: viewTeam, payroll: viewPayroll,
    products: viewProducts,
  },
  manager: {
    dashboard: viewAdminDashboard, orders: viewOrders, deliveries: viewDeliveries,
    route: viewSmartRoute,
    customers: viewCustomers,
    agents: viewAgents, commissions: viewCommissions, bookkeeping: viewBookkeeping, receipts: viewReceipts,
    team: viewTeam, payroll: viewPayroll,
    products: viewProducts,
  },
  finance: { dashboard: viewFinanceDashboard, bookkeeping: viewBookkeeping, commissions: viewCommissions, orders: viewOrders, receipts: viewReceipts, payroll: viewPayroll, agents: viewAgents },
  agent: { dashboard: viewAgentDashboard, orders: viewOrders, commissions: viewCommissions, receipts: viewReceipts },
  delivery: { route: viewSmartRoute, deliveries: viewDeliveries, receipts: viewReceipts },
  employee: { profile: viewProfile, orders: viewOrders },
  customer: { home: viewCustomerHome, orders: viewOrders },
};
