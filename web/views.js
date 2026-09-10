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
// payment methods used in Pakistan — labels for chips/menus. The server is the
// source of truth for which are enabled + the business's account numbers
// (GET /api/payment-methods); this is just for display before that loads.
const PAY_LABEL = {
  cod: 'Cash on delivery', bank: 'Bank transfer', jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa', nayapay: 'NayaPay', sadapay: 'SadaPay', raast: 'Raast',
  cash: 'Cash', // legacy fallback only
};

const V = {
  kpiCard(label, val, sub, cls = '') {
    return `<div class="card kpi ${cls}"><div class="k-label">${label}</div><div class="k-val">${val}</div>${sub ? `<div class="k-sub">${sub}</div>` : ''}</div>`;
  },
  chip(status) { return `<span class="chip ${status}">${API.statusLabel(status)}</span>`; },
  payChip(method) { return `<span class="chip pay-${method || 'cod'}">${PAY_LABEL[method] || PAY_LABEL.cod}</span>`; },
  // "1 order" / "2 orders" — pass a custom plural for irregulars
  plural(n, word, pl) { return `${n} ${Number(n) === 1 ? word : (pl || word + 's')}`; },
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
    // customer role orders only for themselves — the "Delivering to" block below already
    // names them; a disabled Customer field is just noise.
    custHtml = role === 'customer' ? '' : `<div class="field"><span>Customer</span><input value="${API.esc(opts.customer.name)}" disabled></div>`;
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
  const pay = await API.paymentMethods().catch(() => ({ methods: [], accounts: {} }));
  const payAccounts = pay.accounts || {};
  // COD + cash always; an online method only if the business has an account for it
  const payChoices = (pay.methods || []).filter(m => !m.needs_account || payAccounts[m.id]);
  const deliverHtml = opts.deliverTo
    ? `<div class="section-label">Delivering to</div><div class="item-line"><span>${opts.deliverTo}</span></div>`
    : '';
  openModal('New order', `
    ${custHtml}${agentHtml}
    ${deliverHtml}
    <div class="section-label">Items</div>
    ${itemsHtml}
    <div class="field"><span>Payment method</span>
      <select id="ocMethod">${payChoices.map(m => `<option value="${m.id}">${m.label}</option>`).join('')}</select></div>
    <div id="ocPayHint" class="pay-hint"></div>
    <div class="field"><span>Note (optional)</span><input id="ocNotes" placeholder="Delivery note"></div>
    <div id="ocTotal" class="money-lg" style="text-align:right"></div>`,
    `<button class="btn" data-close-modal>Cancel</button><button class="btn primary" id="ocSubmit">Place order</button>`);
  const totalEl = document.getElementById('ocTotal');
  const methodEl = document.getElementById('ocMethod');
  const hintEl = document.getElementById('ocPayHint');
  function payHint() {
    const m = methodEl.value;
    const a = payAccounts[m];
    if (m === 'cod') { hintEl.textContent = 'Pay the rider in cash when your order arrives.'; hintEl.className = 'pay-hint'; return; }
    if (a) {
      hintEl.innerHTML = `Send <b>${totalEl.textContent}</b> to <b>${API.esc(a.name || PAY_LABEL[m])}</b> — <span class="pay-num">${API.esc(a.detail || '')}</span>. Your order is confirmed once we receive it.`;
      hintEl.className = 'pay-hint active';
    } else { hintEl.textContent = ''; hintEl.className = 'pay-hint'; }
  }
  methodEl.addEventListener('change', payHint);
  function recalc() {
    let t = 0;
    document.querySelectorAll('[data-itemqty]').forEach(inp => {
      const p = products.find(x => x.id === +inp.dataset.itemqty);
      const unit = p ? ((typeof p.effective_price === 'number') ? p.effective_price : p.price) : 0;
      t += unit * (parseInt(inp.value) || 0);
    });
    totalEl.textContent = API.fmtMoney(t);
  }
  document.querySelectorAll('[data-itemqty]').forEach(i => i.addEventListener('input', () => { recalc(); payHint(); }));
  recalc();
  payHint();
  document.getElementById('ocSubmit').addEventListener('click', async () => {
    const body = { notes: document.getElementById('ocNotes').value.trim() || undefined, payment_method: methodEl.value };
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
  if (['admin', 'manager', 'shop_manager', 'agent'].includes(role)) {
    if (o.status === 'new') actions += `<button class="btn primary" data-act="dispatch" data-id="${o.id}" data-status="confirmed">Confirm order</button>`;
    if (o.status === 'confirmed') actions += `<button class="btn primary" data-act="dispatch" data-id="${o.id}" data-status="in_delivery">Dispatch for delivery</button>`;
    if (['new', 'confirmed', 'in_delivery'].includes(o.status)) actions += `<button class="btn danger" data-act="cancel-order" data-id="${o.id}">Cancel</button>`;
  }
  if (['admin', 'manager', 'shop_manager', 'finance'].includes(role) && o.payment_status !== 'paid') {
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
    <div style="display:flex;gap:6px;align-items:center;margin-top:8px">${V.chip(o.payment_status)} ${V.payChip(o.payment_method)}</div>
    <div class="section-label">Items</div>
    ${o.items.map(i => `<div class="item-line"><span>${API.esc(i.product_name)} × ${i.qty}</span><b>${API.fmtMoney(i.line_total)}</b></div>`).join('')}
    ${o.agent_name ? `<div class="section-label">Agent</div><div class="item-line"><span>${API.esc(o.agent_name)}</span></div>` : ''}
    ${o.notes ? `<div class="section-label">Note</div><div style="font-size:13.5px">${API.esc(o.notes)}</div>` : ''}
    <div class="section-label">Progress</div>
    ${V.orderStatusFlow(o)}
    ${o.deliveries.length ? `<div class="section-label">Deliveries</div>` + o.deliveries.map(d => `<div class="item-line"><span>${API.esc(d.driver || 'Unassigned')} · ${V.chip(d.status)}</span><span class="muted">${d.delivered_at ? API.fmtDate(d.delivered_at) : ''}</span></div>`).join('') : ''}
  `, actions ? `<div style="display:flex;gap:8px;width:100%;flex-wrap:wrap">${actions}</div>` : '');
}

async function modalPayOrder(id, due) {
  const [o, pay] = await Promise.all([API.order(id), API.paymentMethods().catch(() => ({ methods: [] }))]);
  const methods = (pay.methods || []).length ? pay.methods
    : ['cod', 'bank', 'jazzcash', 'easypaisa', 'nayapay', 'sadapay', 'raast'].map(k => ({ id: k, label: PAY_LABEL[k] }));
  openModal('Record payment · #' + o.id, `
    <div class="field"><span>Customer</span><input value="${API.esc(o.customer_name)}" disabled></div>
    <div class="row2">
      <div class="field"><span>Amount due</span><input value="${API.fmtMoney(due)}" disabled></div>
      <div class="field"><span>Amount received (Rs)</span><input id="payAmt" type="number" min="0" max="${due}" value="${due}"></div>
    </div>
    <div class="field"><span>Received via</span>
      <select id="payMethod">${methods.map(m => `<option value="${m.id}" ${m.id === o.payment_method ? 'selected' : ''}>${m.label}</option>`).join('')}</select></div>
    <div class="field"><span>Reference (optional)</span><input id="payMemo" placeholder="Txn ID / cheque no. / note"></div>`,
    `<button class="btn" data-close-modal>Cancel</button><button class="btn primary" id="paySubmit">Save</button>`);
  document.getElementById('paySubmit').addEventListener('click', async () => {
    const amt = parseInt(document.getElementById('payAmt').value) || 0;
    if (amt <= 0) return toast('Enter a valid amount', 'bad');
    try {
      const cur = await API.order(id);
      await API.updateOrder(id, {
        paid: cur.paid + Math.min(amt, cur.total - cur.paid),
        method: document.getElementById('payMethod').value,
        memo: document.getElementById('payMemo').value.trim(),
      });
      closeModal(); toast('Payment recorded', 'ok'); App.refresh();
    } catch (e) { toast(e.message, 'bad'); }
  });
}

// Marking a delivery "delivered" — if the order still has money outstanding,
// let the driver record what was actually collected at the door in the same
// step, so a COD order doesn't sit "unpaid" until someone fixes it later.
async function modalMarkDelivered(deliveryId, due, method) {
  if (!(due > 0)) {
    if (await confirmDialog({ title: 'Mark delivered', message: 'This delivery will be marked as completed.', okLabel: 'Mark delivered' })) {
      try { await API.updateDelivery(deliveryId, { status: 'delivered' }); toast('Delivered — nice work', 'ok'); App.refresh(); }
      catch (e) { toast(e.message, 'bad'); }
    }
    return;
  }
  const pay = await API.paymentMethods().catch(() => ({ methods: [] }));
  const methods = (pay.methods || []).length ? pay.methods
    : ['cod', 'bank', 'jazzcash', 'easypaisa', 'nayapay', 'sadapay', 'raast'].map(k => ({ id: k, label: PAY_LABEL[k] }));
  openModal('Mark delivered', `
    <p class="muted" style="font-size:13px;margin:0 0 10px">Rs ${Math.round(due)} is still due on this order. Record what was collected at the door — leave it at 0 if the customer will pay later.</p>
    <div class="row2">
      <div class="field"><span>Amount due</span><input value="${API.fmtMoney(due)}" disabled></div>
      <div class="field"><span>Collected now (Rs)</span><input id="dlvCollected" type="number" min="0" max="${due}" value="${due}"></div>
    </div>
    <div class="field"><span>Received via</span>
      <select id="dlvMethod">${methods.map(m => `<option value="${m.id}" ${m.id === (method || 'cod') ? 'selected' : ''}>${m.label}</option>`).join('')}</select></div>`,
    `<button class="btn ghost" data-close-modal>Cancel</button><button class="btn primary" id="dlvSubmit">Mark delivered</button>`);
  document.getElementById('dlvSubmit').addEventListener('click', async () => {
    const collected = Math.max(0, Math.min(due, Number(document.getElementById('dlvCollected').value) || 0));
    try {
      await API.updateDelivery(deliveryId, { status: 'delivered', collected, method: document.getElementById('dlvMethod').value });
      closeModal();
      toast(collected > 0 ? `Delivered — Rs ${Math.round(collected)} collected` : 'Delivered — nice work', 'ok');
      App.refresh();
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
  const [k, monthlyRaw, top, orders] = await Promise.all([API.kpis(), API.monthly(), API.topCustomers(), API.orders()]);
  // only show the trend chart once there's more than one month of real history;
  // a row of empty bars reads as "broken", not "new business"
  const monthly = (monthlyRaw || []).filter(m => (m.income || 0) > 0 || (m.expense || 0) > 0);
  const showTrend = monthly.length >= 2;
  const max = Math.max(...monthly.map(m => Math.max(m.income, m.expense)), 1);
  const trendCard = showTrend ? `
    <div class="card">
      <div class="card-head"><h2>Income vs expenses</h2><span class="muted" style="font-size:12px">last ${monthly.length} months</span></div>
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
    </div>` : `
    <div class="card">
      <div class="card-head"><h2>This month</h2></div>
      <div class="card-pad month-snap">
        <div><span>Collected</span><b class="good">${API.fmtMoney(k.month_revenue)}</b></div>
        <div><span>Spent</span><b class="bad">${API.fmtMoney(k.month_expenses)}</b></div>
        <div><span>Net</span><b class="${k.month_profit >= 0 ? 'good' : 'bad'}">${API.fmtMoney(k.month_profit)}</b></div>
      </div>
    </div>`;
  return `
  <div class="page-head"><h1>Dashboard</h1><button class="btn primary sm" data-act="new-order">+ New order</button></div>
  <div class="grid kpis">
    ${V.kpiCard('Open orders', k.open_orders, 'awaiting delivery')}
    ${V.kpiCard('Deliveries in progress', k.open_deliveries, 'pending + on the road')}
    ${V.kpiCard('Bottles this month', k.units_month.toLocaleString(), 'units sold')}
  </div>
  <div class="grid kpis" style="margin-top:14px">
    ${V.kpiCard('Collected · month', API.fmtMoney(k.month_revenue), 'payments received', 'good')}
    ${V.kpiCard('Net · month', API.fmtMoney(k.month_profit), k.month_profit >= 0 ? 'in profit' : 'in the red', k.month_profit >= 0 ? 'good' : 'bad')}
    ${V.kpiCard('Receivable', API.fmtMoney(k.outstanding_customers), 'customers owe')}
  </div>
  <div class="grid grid-2col" style="margin-top:14px">
    ${trendCard}
    <div class="card">
      <div class="card-head"><h2>Top customers</h2></div>
      ${top.map((t, i) => `<div class="list-row"><div class="grow"><div class="t">${i + 1}. ${API.esc(t.name)}</div><div class="s">${V.plural(t.orders, 'order')}</div></div><div style="font-weight:700">${API.fmtMoney(t.sales)}</div></div>`).join('') || '<div class="empty">No data</div>'}
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
  const roles = ['admin', 'manager', 'shop_manager', 'agent', 'customer', 'finance', 'employee'];
  if (!roles.includes(API.user.role)) return '';
  const orders = await API.orders(status);

  // ---- customer: a clean card list, not a data table ----
  if (API.user.role === 'customer') {
    const k = await API.kpis().catch(() => ({}));
    const due = k.due || 0;
    const openOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    return `
  <div class="page-head"><h1>My orders</h1>
    <button class="btn primary sm" data-act="nav" data-to="home">Order water</button></div>
  <div class="ord-summary">
    <div><b>${orders.length}</b><span>total orders</span></div>
    <div><b>${openOrders}</b><span>in progress</span></div>
    <div class="${due > 0 ? 'due' : ''}"><b>${API.fmtMoney(due)}</b><span>${due > 0 ? 'balance due' : 'all paid'}</span></div>
  </div>
  <div class="ord-list">
    ${orders.map(o => {
      const bal = Math.round((o.total - o.paid) * 100) / 100;
      return `
      <button class="ord-card" data-act="view-order" data-id="${o.id}">
        <div class="ord-top">
          <span class="ord-id">Order #${o.id}</span>
          ${V.chip(o.status)}
        </div>
        <div class="ord-items">${API.esc(o.items || '—')}</div>
        <div class="ord-bot">
          <span class="ord-date">${API.fmtDay(o.placed_at)} &middot; ${PAY_LABEL[o.payment_method] || PAY_LABEL.cod}</span>
          <span class="ord-total">${API.fmtMoney(o.total)}</span>
        </div>
        ${bal > 0 && o.status !== 'cancelled'
          ? `<div class="ord-due">Balance ${API.fmtMoney(bal)} &middot; ${API.statusLabel(o.payment_status)}</div>` : ''}
      </button>`;
    }).join('') || `<div class="card card-pad empty"><div class="em-ico">${IC.box}</div>No orders yet — tap “Order water” to place your first.</div>`}
  </div>`;
  }

  const filters = ['all', 'new', 'confirmed', 'in_delivery', 'delivered', 'cancelled'];
  const canOrder = ['admin', 'shop_manager', 'agent'].includes(API.user.role);
  return `
  <div class="page-head"><h1>Orders</h1>
    ${canOrder ? `<button class="btn primary sm" data-act="new-order">+ New order</button>` : ''}</div>
  ${filters.length ? `<div class="filters">${filters.map(f => `<button class="chip-filter ${f === status ? 'active' : ''}" data-act="filter-orders" data-status="${f}">${f === 'all' ? 'All' : API.statusLabel(f)}</button>`).join('')}</div>` : ''}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>#</th><th>Customer</th><th>Items</th>${API.user.role !== 'customer' ? '<th>Agent</th>' : ''}<th class="num">Total</th><th>Payment</th><th>Status</th></tr></thead>
    <tbody>${orders.map(o => `
      <tr style="cursor:pointer" data-act="view-order" data-id="${o.id}">
        <td class="cell-main" data-l="Order">#${o.id} <span class="muted" style="font-weight:600;font-size:12px">${API.fmtDay(o.placed_at)}</span></td>
        ${V.m('Customer', `${API.esc(o.customer_name)}<div class="muted">${API.esc(o.customer_area || '')}</div>`)}
        ${V.m('Items', API.esc(o.items || '—'), 'muted')}
        ${API.user.role !== 'customer' ? V.m('Agent', o.agent_name ? API.esc(o.agent_name) : '<span class="muted">—</span>', 'muted') : ''}
        ${V.m('Total', API.fmtMoney(o.total), 'tv num')}
        ${V.m('Payment', `${V.chip(o.payment_status)} ${V.payChip(o.payment_method)}`, 'tv')}
        ${V.m('Status', V.chip(o.status), 'tv')}
      </tr>`).join('') || `<tr><td colspan="7"><div class="empty"><div class="em-ico">${IC.box}</div>No orders found</div></td></tr>`}
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
    <thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Driver</th><th>Scheduled</th><th class="num">Amount due</th><th>Status</th><th></th></tr></thead>
    <tbody>${d.map(x => {
      const due = Math.round((x.order_total - x.order_paid) * 100) / 100;
      let act = '';
      if (x.status === 'pending') act = `<button class="btn sm primary" data-act="del-ofd" data-id="${x.id}">Start trip</button>`;
      if (x.status === 'out_for_delivery') act = `<button class="btn sm primary" data-act="del-done" data-id="${x.id}" data-due="${due}" data-method="${x.order_payment_method || 'cod'}">Delivered</button>`;
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
    }).join('') || `<tr><td colspan="8"><div class="empty"><div class="em-ico">${IC.truck}</div>Nothing here right now</div></td></tr>`}
    </tbody></table></div></div>`;
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
    : `<button class="btn primary block sm" data-act="del-done" data-id="${s.delivery_id}" data-due="${due}" data-method="${s.order_payment_method || 'cod'}">Mark delivered</button>`;
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
        <div style="font-size:16px;font-weight:800">${API.esc(me.name)} <span class="chip ${me.role}">${API.roleLabel(me.role)}</span></div>
        <div class="muted" style="font-size:12.5px;margin-top:3px">${API.esc(me.email || '—')}${me.phone ? ' · ' + API.esc(me.phone) : ''}</div>
      </div>
    </div>
    <div class="grid kpis" style="margin-top:16px">
      ${V.kpiCard('Salary', me.salary ? API.fmtMoney(me.salary) : '—', me.salary ? 'per month' : 'not set')}
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

// Agents (roster + rate) and Commissions (per-order ledger + settlement) used
// to be two separate nav pages for admin/manager/finance, even though they're
// both just views onto the same agents/commissions data — split for no real
// reason and easy to land on the wrong one. One page now: roster on top,
// ledger below. The agent role's own "My commission" stays separate (below,
// viewCommissions) — a single agent has no roster to manage, just their own
// running ledger, so merging would only add noise there.
async function viewAgents() {
  const u = API.user;
  const canAdd = ['admin', 'manager'].includes(u.role);
  const canEditRate = ['admin', 'manager', 'finance'].includes(u.role);
  const canSettle = ['admin', 'manager', 'finance'].includes(u.role);
  const [agents, rows] = await Promise.all([API.agents(), API.commissions({})]);
  const accrued = rows.filter(r => r.status === 'accrued');
  const paid = rows.filter(r => r.status === 'paid');
  const sum = (a) => a.reduce((s, r) => s + r.amount, 0);
  return `
  <div class="page-head"><h1>Agents &amp; commissions</h1>${canAdd ? '<button class="btn primary sm" data-act="new-agent">+ Add agent</button>' : ''}</div>
  ${canEditRate ? '<p class="muted" style="font-size:12px;margin:2px 0 12px">Change a commission rate inline below — it applies to new orders from that agent (existing commissions keep the rate they were booked at).</p>' : ''}
  ${agents.map(a => `
  <div class="team-row">
    <div class="team-av">${API.esc((a.name[0] || '?').toUpperCase())}</div>
    <div class="team-main">
      <div class="nm">${API.esc(a.name)}${a.active ? '' : ' <span class="chip cancelled">Inactive</span>'}</div>
      <div class="sub">${API.esc(a.phone || '—')}${a.area ? ' · ' + API.esc(a.area) : ''} · ${a.orders_count} orders · sales ${API.fmtMoney(a.sales)}</div>
    </div>
    <div style="flex:none;text-align:right">
      ${canEditRate ? `<div style="display:flex;gap:4px;align-items:center;justify-content:flex-end">
        <input data-act-none id="agPct${a.id}" type="number" min="0" max="50" step="0.5" value="${a.commission_pct}" class="input" style="width:58px;text-align:center">
        <span style="font-size:12px;color:var(--ink-3)">%</span>
        <button class="btn sm ${a.active ? 'ghost' : 'primary'}" data-act="agent-save" data-id="${a.id}" data-pct-input="agPct${a.id}" data-target-active="${a.active ? 0 : 1}">${a.active ? 'Deactivate' : 'Activate'}</button>
      </div>` : `<div style="font-weight:800">${a.commission_pct}%</div>`}
      <div class="muted" style="font-size:11px;margin-top:3px">due ${API.fmtMoney(a.outstanding_commission)}</div>
    </div>
  </div>`).join('')}
  <div class="sec-t">Commission ledger</div>
  <div class="grid kpis">
    ${V.kpiCard('Accrued (due)', API.fmtMoney(sum(accrued)), accrued.length + ' items', 'warn')}
    ${V.kpiCard('Paid out', API.fmtMoney(sum(paid)), paid.length + ' items', 'good')}
  </div>
  <div class="card" style="margin-top:14px"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Order</th><th>Customer</th><th>Agent</th><th>Period</th><th class="num">Sales</th><th class="num">Pct</th><th class="num">Commission</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows.map(r => `
      <tr>
      <td class="cell-main" data-l="Commission">Order #${r.order_id} <span class="muted" style="font-weight:600;font-size:12px">· ${r.period || '—'}</span></td>
      ${V.m('Customer', API.esc(r.customer || '—'))}
      ${V.m('Agent', API.esc(r.agent_name || '—'))}
      ${V.m('Sales', API.fmtMoney(r.order_total), 'tv num')}
      ${V.m('Rate', r.pct + '%', 'tv num')}
      ${V.m('Commission', `<b>${API.fmtMoney(r.amount)}</b>`, 'tv num')}
      ${V.m('Status', V.chip(r.status), 'tv')}
      <td class="cell-act">${r.status === 'accrued' && canSettle ? `<button class="btn sm primary" data-act="settle-commission" data-id="${r.id}">Mark paid</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="9"><div class="empty"><div class="em-ico">${IC.cash}</div>No commissions yet</div></td></tr>`}
    </tbody></table></div></div>`;
}

// ================= FINANCE =================
async function viewFinanceDashboard() {
  const month = new Date().toISOString().slice(0, 7);
  const [sum, monthlyRaw, orders] = await Promise.all([API.ledgerSummary(month), API.monthly(), API.orders()]);
  const monthly = (monthlyRaw || []).filter(m => (m.income || 0) > 0 || (m.expense || 0) > 0);
  const showTrend = monthly.length >= 2;
  const dueOrders = orders.filter(o => o.payment_status !== 'paid' && o.status !== 'cancelled');
  return `
  <div class="page-head"><h1>Finance</h1><button class="btn sm" data-act="add-expense">+ Expense</button><button class="btn sm" data-act="add-income">+ Income</button></div>
  <div class="grid kpis">
    ${V.kpiCard('Income · ' + new Date().toLocaleString('en', { month: 'long' }), API.fmtMoney(sum.month_income), 'this month', 'good')}
    ${V.kpiCard('Expenses · month', API.fmtMoney(sum.month_expense), 'this month', 'bad')}
    ${V.kpiCard('Net · month', API.fmtMoney(sum.month_net), sum.month_net >= 0 ? 'in profit' : 'in the red', sum.month_net >= 0 ? 'good' : 'bad')}
    ${V.kpiCard('Receivable', API.fmtMoney(dueOrders.reduce((s, o) => s + (o.total - o.paid), 0)), V.plural(dueOrders.length, 'open order'), 'warn')}
  </div>
  <div class="grid grid-2col" style="margin-top:14px">
    ${showTrend ? `<div class="card">
      <div class="card-head"><h2>Cash flow</h2><span class="muted" style="font-size:12px">last ${monthly.length} months</span></div>
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
    </div>` : `<div class="card">
      <div class="card-head"><h2>This month</h2></div>
      <div class="card-pad month-snap">
        <div><span>Income</span><b class="good">${API.fmtMoney(sum.month_income)}</b></div>
        <div><span>Expenses</span><b class="bad">${API.fmtMoney(sum.month_expense)}</b></div>
        <div><span>Net</span><b class="${sum.month_net >= 0 ? 'good' : 'bad'}">${API.fmtMoney(sum.month_net)}</b></div>
      </div>
    </div>`}
    <div class="card">
      <div class="card-head"><h2>By account · this month</h2></div>
      ${sum.by_account.map(a => `<div class="list-row"><div class="grow"><div class="t">${API.esc(a.account)}</div><div class="s">${a.type}</div></div>${V.chip(a.type)}</div><div class="list-row" style="padding-top:0;padding-bottom:14px"><div class="grow"></div><b>${API.fmtMoney(a.total)}</b></div>`).join('') || '<div class="empty">No entries</div>'}
    </div>
  </div>`;
}

async function viewBookkeeping() {
  const isAdmin = API.user.role === 'admin';
  const [rows, verify] = await Promise.all([
    API.ledger(),
    API.auditVerify().catch(() => null),
  ]);
  // running balance is computed oldest → newest; a reversed entry + its reversal
  // net to zero automatically, so totals stay correct with no special-casing.
  const asc = rows.slice().reverse();
  let bal = 0, income = 0, expense = 0;
  const balById = {};
  for (const r of asc) {
    bal += r.type === 'income' ? r.amount : -r.amount;
    if (r.type === 'income') income += r.amount; else expense += r.amount;
    balById[r.id] = bal;
  }
  const integ = verify
    ? (verify.ok
      ? `<div class="integ ok">${IC.shield} Ledger integrity verified — ${verify.count} audit record(s), chain intact <button class="btn ghost sm" data-act="nav" data-to="audit">Audit trail →</button></div>`
      : `<div class="integ bad">${IC.shield} Chain broken at audit record #${verify.broken_at} — the books may have been tampered with. <button class="btn ghost sm" data-act="nav" data-to="audit">Investigate →</button></div>`)
    : '';
  const entryRow = (r) => {
    const reversed = r.status === 'reversed';
    const isFix = r.status === 'correction';
    const tag = reversed ? '<span class="chip cancelled">Voided</span>'
      : isFix ? '<span class="chip approved">Correction</span>' : '';
    const acts = isAdmin && r.status === 'active'
      ? `<div class="ledger-acts"><button class="btn ghost sm" data-act="ledger-correct" data-id="${r.id}">Correct</button><button class="btn ghost sm" data-act="ledger-void" data-id="${r.id}">Void</button></div>`
      : '';
    return `<tr class="${reversed ? 'row-reversed' : ''}">
      <td class="cell-main" data-l="Entry">
        <span style="color:${r.type === 'income' ? 'var(--green-ink)' : 'var(--red-ink)'};font-weight:700">${r.type === 'income' ? '+' : '−'} ${API.fmtMoney(r.amount)}</span>
        <span class="muted" style="font-weight:600;font-size:11px"> #${r.id}</span> ${tag}
      </td>
      ${V.m('Account', `<b>${API.esc(r.account)}</b><div class="muted">${API.esc(r.memo || '')}</div>${r.void_reason ? `<div class="muted" style="color:var(--red-ink)">${API.esc(r.void_reason)}</div>` : ''}`)}
      ${V.m('Date', `${API.fmtDay(r.at)} · ref ${API.esc(r.ref || '—')}${r.entered_by ? ' · by ' + API.esc(r.entered_by) : ''}`, 'muted')}
      ${V.m('Balance', API.fmtMoney(balById[r.id] ?? 0), 'tv num')}
      ${acts ? `<td class="cell-act">${acts}</td>` : ''}
    </tr>`;
  };
  return `
  <div class="page-head"><h1>Bookkeeping</h1><button class="btn sm" data-act="add-expense">+ Expense</button><button class="btn primary sm" data-act="add-income">+ Income</button></div>
  <p class="muted" style="font-size:12.5px;margin:6px 0 10px">Every money movement in one place — sales, purchases, payroll, commissions and scanned receipts. Entries are <b>append-only</b>: a mistake is fixed with a reversing entry, never edited or deleted${isAdmin ? ' (admin-only)' : ''}.</p>
  ${integ}
  <div class="grid kpis">
    ${V.kpiCard('Balance', API.fmtMoney(bal), bal >= 0 ? 'account position' : 'in the red', bal >= 0 ? 'good' : 'bad')}
    ${V.kpiCard('Income', API.fmtMoney(income), 'total credit')}
    ${V.kpiCard('Expenses', API.fmtMoney(expense), 'total debit')}
  </div>
  <div class="card" style="margin-top:14px"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Entry</th><th>Account</th><th>Date</th><th class="num">Balance</th>${isAdmin ? '<th></th>' : ''}</tr></thead>
    <tbody>${rows.slice(0, 150).map(entryRow).join('') || `<tr><td colspan="${isAdmin ? 5 : 4}"><div class="empty">No entries yet</div></td></tr>`}
    </tbody></table></div></div>`;
}

// ---------- payment methods: the business's receiving accounts (admin/manager) ----------
async function viewPayments() {
  const canEdit = ['admin', 'manager'].includes(API.user.role);
  const { methods, accounts } = await API.paymentMethods();
  const online = methods.filter(m => m.needs_account);
  const row = (m) => {
    const a = accounts[m.id] || {};
    return `<div class="pay-acct">
      <div class="pay-acct-h"><b>${m.label}</b>${a.detail ? '<span class="chip approved">Enabled</span>' : '<span class="chip cancelled">Not set</span>'}</div>
      <div class="row2">
        <div class="field"><span>Account title</span><input data-pay-name="${m.id}" value="${API.esc(a.name || '')}" placeholder="e.g. PurePak" ${canEdit ? '' : 'disabled'}></div>
        <div class="field"><span>${m.id === 'bank' ? 'IBAN / account no.' : 'Number'}</span><input data-pay-detail="${m.id}" value="${API.esc(a.detail || '')}" placeholder="${m.id === 'bank' ? 'PK.. or account #' : '03xx-xxxxxxx'}" ${canEdit ? '' : 'disabled'}></div>
      </div>
    </div>`;
  };
  return `
  <div class="page-head"><h1>Payment methods</h1></div>
  <p class="muted" style="font-size:12.5px;margin:6px 0 12px">Cash on delivery is always offered. Fill an account below to also offer that method at checkout — the customer sees these details to pay, and staff confirm the payment on the order.</p>
  <div class="card card-pad">
    ${online.map(row).join('')}
    ${canEdit ? `<button class="btn primary block" data-act="save-pay-accounts" style="margin-top:6px">Save payment accounts</button>` : ''}
  </div>
  <p class="muted" style="font-size:11.5px;margin-top:10px">Online gateway integration (Safepay / PayFast — auto-confirm) can be added later; the checkout is already built to slot it in.</p>`;
}

// ---------- audit trail (hash-chained; admin + manager can view) ----------
async function viewAudit() {
  const data = await API.auditLog();
  const entries = data.entries || [];
  const v = data.verify || {};
  const banner = v.ok
    ? `<div class="integ ok">${IC.shield} Chain intact — ${v.count} record(s) verified. Head hash <code>${API.esc((v.head || '').slice(0, 16))}…</code></div>`
    : `<div class="integ bad">${IC.shield} Chain BROKEN at record #${v.broken_at}. Everything after that point is unverifiable.</div>`;
  const actionLabel = {
    'ledger.create': 'Ledger entry', 'ledger.void': 'Entry voided', 'ledger.correct': 'Entry corrected',
    'order.pay': 'Order payment', 'commission.settle': 'Commission settled', 'payroll.pay': 'Payroll paid', 'receipt.post': 'Receipt posted',
  };
  // Human field-level diff. Creates/deletes are described by e.summary already,
  // so only render this for genuine before→after changes.
  const MONEY_KEYS = new Set(['amount', 'paid', 'total', 'price', 'rate', 'salary', 'commission', 'subtotal', 'tax']);
  const SKIP_KEYS = new Set(['id', 'at', 'hash', 'prev_hash', 'created_at', 'updated_at', 'entered_by', 'entered_b', 'reversal_entry']);
  const norm = (x) => (x == null || x === '' ? null : x);
  const fmtVal = (k, x) => {
    if (x == null || x === '') return '—';
    if (typeof x === 'object') return API.esc(JSON.stringify(x));
    if (MONEY_KEYS.has(k) && !isNaN(+x)) return API.fmtMoney(+x);
    return API.esc(String(x));
  };
  const diff = (e) => {
    const b = e.before && typeof e.before === 'object' && Object.keys(e.before).length ? e.before : null;
    const a = e.after && typeof e.after === 'object' && Object.keys(e.after).length ? e.after : null;
    if (!b || !a) return '';
    const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])]
      .filter(k => !SKIP_KEYS.has(k) && JSON.stringify(norm(b[k])) !== JSON.stringify(norm(a[k])));
    if (!keys.length) return '';
    return `<div class="aud-diff">${keys.map(k =>
      `<span class="aud-k">${API.esc(k.replace(/_/g, ' '))}</span> ${fmtVal(k, b[k])} <span class="muted">&rarr;</span> <b>${fmtVal(k, a[k])}</b>`
    ).join('<br>')}</div>`;
  };
  return `
  <div class="page-head"><h1>Audit trail</h1></div>
  <p class="muted" style="font-size:12.5px;margin:6px 0 10px">Every change to money — who, when, what changed. Each record's fingerprint includes the previous one, so history can't be quietly rewritten.</p>
  ${banner}
  <div class="card" style="margin-top:12px"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
    <tbody>${entries.map(e => `<tr>
      <td class="cell-main" data-l="Record">#${e.id} · ${API.fmtDate(e.at)}</td>
      ${V.m('Who', `${API.esc(e.actor_name || 'system')}${e.actor_role ? ` <span class="chip ${e.actor_role}">${API.roleLabel(e.actor_role)}</span>` : ''}`)}
      ${V.m('Action', `<b>${actionLabel[e.action] || e.action}</b> <span class="muted">${API.esc(e.entity)}${e.entity_id ? ' #' + e.entity_id : ''}</span>`)}
      ${V.m('Details', `${API.esc(e.summary || '')}${diff(e)}`, 'muted')}
    </tr>`).join('') || '<tr><td colspan="4"><div class="empty">No audited changes yet</div></td></tr>'}
    </tbody></table></div></div>`;
}

function modalVoidLedger(id) {
  API.ledger().then(rows => {
    const r = rows.find(x => x.id === id);
    if (!r) return toast('Entry not found', 'err');
    openModal('Void entry #' + r.id, `
      <p class="muted" style="font-size:13px;margin:0 0 12px;line-height:1.5">This posts a <b>reversing entry</b> that cancels this one out. Nothing is deleted — both stay in the books with an audit record.</p>
      <div class="item-line"><span>${API.esc(r.account)} · ${API.esc(r.memo || '')}</span><b style="color:${r.type === 'income' ? 'var(--green-ink)' : 'var(--red-ink)'}">${r.type === 'income' ? '+' : '−'} ${API.fmtMoney(r.amount)}</b></div>
      <label class="muted" style="display:block;margin-top:12px">Reason (required — shown in the audit trail)</label>
      <textarea id="voidReason" class="input" style="width:100%;min-height:70px" placeholder="e.g. duplicate of receipt #14, wrong amount entered"></textarea>`,
      `<button class="btn ghost" data-close-modal>Cancel</button><button class="btn danger" id="voidGo">Void entry</button>`);
    document.getElementById('voidGo').addEventListener('click', async () => {
      const reason = document.getElementById('voidReason').value.trim();
      if (reason.length < 3) return toast('Please give a reason', 'warn');
      try { await API.voidLedger(id, reason); closeModal(); toast('Entry #' + id + ' voided', 'ok'); App.refresh(); }
      catch (e) { toast(e.message, 'err'); }
    });
  });
}

function modalCorrectLedger(id) {
  API.ledger().then(rows => {
    const r = rows.find(x => x.id === id);
    if (!r) return toast('Entry not found', 'err');
    openModal('Correct entry #' + r.id, `
      <p class="muted" style="font-size:13px;margin:0 0 12px;line-height:1.5">The original is reversed and a corrected entry is posted in its place. Both the reversal and the new entry are audited.</p>
      <label class="muted">Account</label>
      <input id="corAccount" class="input" style="width:100%;margin-bottom:8px" value="${API.esc(r.account)}">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div><label class="muted">Type</label>
          <select id="corType" class="input" style="width:100%">
            <option value="expense" ${r.type === 'expense' ? 'selected' : ''}>Expense</option>
            <option value="income" ${r.type === 'income' ? 'selected' : ''}>Income</option>
          </select></div>
        <div><label class="muted">Amount (Rs)</label><input id="corAmount" class="input" type="number" min="1" style="width:100%" value="${r.amount}"></div>
      </div>
      <label class="muted">Memo</label>
      <input id="corMemo" class="input" style="width:100%;margin-bottom:8px" value="${API.esc(r.memo || '')}">
      <label class="muted">Reason for the correction (required)</label>
      <textarea id="corReason" class="input" style="width:100%;min-height:60px" placeholder="e.g. amount should have been 4,200 not 42,000"></textarea>`,
      `<button class="btn ghost" data-close-modal>Cancel</button><button class="btn primary" id="corGo">Post correction</button>`);
    document.getElementById('corGo').addEventListener('click', async () => {
      const body = {
        account: document.getElementById('corAccount').value.trim(),
        type: document.getElementById('corType').value,
        amount: +document.getElementById('corAmount').value,
        memo: document.getElementById('corMemo').value.trim(),
        reason: document.getElementById('corReason').value.trim(),
      };
      if (body.reason.length < 3) return toast('Please give a reason', 'warn');
      if (!body.account || !(body.amount > 0)) return toast('Account and a positive amount are required', 'warn');
      try { await API.correctLedger(id, body); closeModal(); toast('Correction posted', 'ok'); App.refresh(); }
      catch (e) { toast(e.message, 'err'); }
    });
  });
}

// ================= CUSTOMER (storefront) =================
const WA_NUMBER = '923156666796';
// whatsapp:// opens the installed phone app directly (wa.me / https falls
// through to WhatsApp Web on desktop and inside some Android WebViews).
const WA_LINK = `whatsapp://send?phone=${WA_NUMBER}&text=${encodeURIComponent('Hi PurePak, I need help with my water order.')}`;
const WA_ICON = '<svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.65.86 5.1 2.316 7.09L4.6 28l6.13-1.607A11.94 11.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 21.82a9.78 9.78 0 0 1-5.04-1.49l-.36-.23-3.64.955.97-3.55-.24-.37A9.78 9.78 0 0 1 6.18 15c0-5.42 4.41-9.83 9.82-9.83 2.62 0 5.09 1.02 6.94 2.88a9.75 9.75 0 0 1 2.88 6.95c0 5.42-4.41 9.82-9.82 9.82zm5.39-7.36c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.15-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.19-.24-.57-.48-.5-.66-.5l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.4.25-.7.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z"/></svg>';

const sizeLabel = (ml) => ml >= 1000
  ? (Number.isInteger(ml / 1000) ? ml / 1000 : (ml / 1000).toFixed(1)) + ' L'
  : ml + ' ml';

const prodEff = (p) => (typeof p.effective_price === 'number' ? p.effective_price : p.price);
function prodPriceHtml(p) {
  const eff = prodEff(p);
  const save = Math.max(0, Math.round((p.price || 0) - eff));
  // .prod-sub keeps a reserved height whether or not there's a discount, so every
  // card is exactly the same height and the grid stays even.
  return `
    <div class="prod-price-row">
      <span class="prod-now">${API.fmtMoney(eff)}</span>
      <span class="prod-per">/ bottle</span>
    </div>
    <div class="prod-sub">${save > 0
      ? `<s>${API.fmtMoney(p.price)}</s><span class="sv">save ${API.fmtMoney(save)}</span>`
      : ''}</div>`;
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
      ${p.id === popId ? `<span class="prod-pop">Popular</span>` : ''}
      <div class="prod-ic">${p.size_ml >= 6000 ? IC.bottleBig : IC.bottle}</div>
      <div class="prod-main">
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
  <div class="shop">
  <section class="shop-hero">
    <div class="shop-hero-row">
      <div class="shop-hero-logo"><img src="/img/pure-pak-logo.jpeg" alt="PurePak"></div>
      <div class="shop-hero-copy">
        <div class="shop-hero-kicker">Welcome back, ${first}</div>
        <h1>Pure water,<br>delivered to your door</h1>
        <button class="btn shop-hero-cta" data-shop="scroll-cat">Order now</button>
      </div>
    </div>
    <div class="shop-trust">
      <div>${IC.truck}<span>Same-day delivery</span></div>
      <div>${IC.wallet}<span>Pay on delivery</span></div>
      <div>${IC.shield}<span>Lab-tested water</span></div>
    </div>
  </section>

  ${k.due > 0 ? `
  <button class="due-nudge" data-act="nav" data-to="orders">
    <span>Balance due <b>${API.fmtMoney(k.due)}</b></span>
    <span class="dn-go">View &amp; pay &rarr;</span>
  </button>` : ''}

  ${last ? `
  <section class="reorder">
    <div class="reorder-txt">
      <div class="reorder-lbl">Order again</div>
      <div class="reorder-items">${API.esc(last.items || 'your last order')}</div>
    </div>
    <button class="btn primary sm" data-shop="reorder" data-order="${last.id}">Reorder</button>
  </section>` : ''}

  <section class="shop-cat" id="shopCat">
    <div class="shop-cat-head">
      <h2>Choose your water</h2>
      <button class="btn ghost sm" data-act="new-order">Order form</button>
    </div>
    <div class="prod-grid">
      ${products.map(card).join('') || `<div class="card card-pad empty"><div class="em-ico">${IC.bottleBig}</div>No products available right now</div>`}
    </div>
  </section>

  <button class="shop-help" data-shop="contact">${IC.chat}<span>Questions about your order or delivery? <b>Contact us</b></span></button>
  <div class="shop-foot-brand">PurePak &middot; purepak.com.pk</div>
  </div>

  <a class="wa-fab" href="${WA_LINK}" aria-label="Chat with PurePak on WhatsApp">${WA_ICON}</a>

  <div class="cartbar" id="shopCartBar" hidden>
    <div class="cartbar-sum"><b id="shopCartQty">0</b> <span id="shopCartUnit">bottles</span> &middot; <b id="shopCartTotal">${API.fmtMoney(0)}</b></div>
    <button class="btn primary" data-shop="checkout">Review order</button>
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
    const uEl = document.getElementById('shopCartUnit');
    if (qEl) qEl.textContent = qty;
    if (uEl) uEl.textContent = qty === 1 ? 'bottle' : 'bottles';
    if (tEl) tEl.textContent = API.fmtMoney(total);
  }
  document.body.classList.toggle('has-cartbar', qty > 0);
}

async function shopCheckout() {
  if (!shopCart.size) return ppToast('Add some water to your order first', 'warn');
  const u = API.user;
  // deliveries need somewhere to go — force a saved address + phone first
  if (!u.customerAddress || !String(u.customerAddress).trim() || !u.customerPhone || !String(u.customerPhone).trim()) {
    return modalCustomerAddress(() => shopCheckout());
  }
  await modalCreateOrder({
    customer: { id: u.customer_id, name: u.customerName || u.name },
    deliverTo: `${API.esc(u.customerAddress)}${u.customerArea ? ' · ' + API.esc(u.customerArea) : ''} · ${API.esc(u.customerPhone)}`,
    onPlaced: () => { shopCart.clear(); document.body.classList.remove('has-cartbar'); },
  });
  document.querySelectorAll('[data-itemqty]').forEach(inp => {
    inp.value = shopCart.get(+inp.dataset.itemqty) || 0;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// customer's own delivery details — saved to their profile, not per order
function modalCustomerAddress(after) {
  const u = API.user;
  openModal('Delivery details', `
    <p class="muted" style="font-size:13px;margin:0 0 12px;line-height:1.5">Saved to your profile — we'll use it for every order. You can change it any time from <b>My profile</b>.</p>
    <label class="muted">Phone number</label>
    <input id="caPhone" class="input" style="width:100%;margin-bottom:10px" placeholder="03xx-xxxxxxx" value="${API.esc(u.customerPhone || u.phone || '')}">
    <label class="muted">Delivery address</label>
    <textarea id="caAddress" class="input" style="width:100%;min-height:80px" placeholder="House / office, street, sector, city">${API.esc(u.customerAddress || '')}</textarea>`,
    `<button class="btn ghost" data-close-modal>Cancel</button><button class="btn primary" id="caSave">Save & continue</button>`);
  document.getElementById('caSave').addEventListener('click', async () => {
    const phone = document.getElementById('caPhone').value.trim();
    const address = document.getElementById('caAddress').value.trim();
    if (phone.length < 7) return toast('Enter a valid phone number', 'warn');
    if (address.length < 6) return toast('Enter your delivery address', 'warn');
    try {
      await API.updateCustomer(u.customer_id, { phone, address });
      // refresh the cached user so the checkout guard passes
      try { const me = await API.me(); API.setAuth(API.token, me); } catch {}
      closeModal(); toast('Delivery details saved', 'ok');
      if (typeof after === 'function') after();
    } catch (e) { toast(e.message, 'err'); }
  });
}

async function viewCustomerProfile() {
  const u = API.user;
  let me = u;
  try { me = await API.me(); } catch {}
  return `
  <div class="page-head"><h1>My profile</h1></div>
  <div class="card" style="padding:16px">
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
      <div class="avatar" style="width:46px;height:46px;font-size:18px">${API.esc((me.name[0] || '?').toUpperCase())}</div>
      <div><div style="font-weight:800">${API.esc(me.name)}</div>
        <div class="muted" style="font-size:12.5px">${API.esc(me.email || '')}${me.customerName ? ' · ' + API.esc(me.customerName) : ''}</div></div>
    </div>
    <label class="muted">Phone number</label>
    <input id="cpPhone" class="input" style="width:100%;margin-bottom:10px" value="${API.esc(me.customerPhone || me.phone || '')}" placeholder="03xx-xxxxxxx">
    <label class="muted">Delivery address</label>
    <textarea id="cpAddress" class="input" style="width:100%;min-height:84px;margin-bottom:14px" placeholder="House / office, street, sector, city">${API.esc(me.customerAddress || '')}</textarea>
    <button class="btn primary block" data-act="save-my-profile">Save profile</button>
    <p class="muted" style="font-size:11.5px;margin:10px 0 0">Your pricing tier is set by PurePak. Contact us if it looks wrong.</p>
  </div>`;
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
    ${!isPP && ext.doc_kind && DOC_KIND_LABEL[ext.doc_kind] ? `<p class="muted" style="font-size:11px;margin:6px 0 0">AI read this as ${DOC_KIND_LABEL[ext.doc_kind]}${ext.direction === 'money_in' ? ' (money in)' : ext.direction === 'money_out' ? ' (money out)' : ''}${ext.reference_no ? ` · ref ${API.esc(String(ext.reference_no))}` : ''}${ext.date ? ` · ${API.esc(String(ext.date))}` : ''}${ext.notes ? ` · “${API.esc(String(ext.notes))}”` : ''}.</p>` : ''}
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

// Scan flow: upload -> wait for AI -> show what it read for the scanner to
// confirm/correct -> save to staging (a reviewer still approves it later).
async function saveScannedReceipt() {
  const fileEl = document.getElementById('rxFile');
  const f = fileEl.files[0];
  if (!f) { ppToast('Choose a receipt photo first', 'warn'); return; }
  const btn = document.getElementById('rxSave');
  if (btn) btn.disabled = true;
  const busy = document.getElementById('rxBusy');
  if (busy) { busy.textContent = 'Uploading…'; busy.classList.remove('hidden'); }
  const kind = document.getElementById('rxKind').value;
  const manual = {
    kind,
    amount: document.getElementById('rxAmount').value || null,
    vendor: document.getElementById('rxVendor').value || null,
    memo: document.getElementById('rxMemo').value || null,
  };
  let rec;
  try {
    const { dataUrl, mimetype } = await fileToDataUrl(f);
    rec = await API.uploadReceipt({ image: dataUrl, mimetype, filename: f.name, ...manual });
  } catch (e) {
    if (busy) busy.classList.add('hidden');
    ppToast('Could not upload receipt: ' + e.message, 'err');
    if (btn) btn.disabled = false;
    return;
  }
  if (busy) busy.textContent = 'Reading the receipt with AI…';
  // poll for OCR (max ~50s)
  for (let tries = 0; tries < 17; tries++) {
    await new Promise(r => setTimeout(r, 3000));
    let rows;
    try { rows = await API.receipts(null, 'pending'); } catch { continue; }
    const r = rows.find(x => x.id === rec.id);
    if (r && r.ocr_status !== 'pending') { rec = r; break; }
    if (tries === 16) { rec.ocr_status = rec.ocr_status || 'failed'; }
  }
  receiptModalOpen = false;
  App.refresh();               // it's in staging now regardless
  modalConfirmScan(rec, kind); // let the scanner check the AI read
}

// editable "here's what the AI read" step, shown right after a scan
const DOC_KIND_LABEL = {
  sales_invoice: 'a sales invoice', purchase_bill: 'a supplier / purchase bill', cash_memo: 'a cash memo',
  utility_bill: 'a utility bill', fuel: 'a fuel receipt', rent: 'a rent receipt', vehicle: 'a vehicle expense',
  salary_slip: 'a salary slip', bank_slip: 'a bank slip', other: 'a receipt',
};
function modalConfirmScan(rec, kind) {
  const ex = rec.extracted || {};
  const items = ex.type === 'purepak' ? (ex.items || []) : (ex.line_items || []);
  const conf = ex.confidence != null ? Math.round(ex.confidence * 100) + '% confident' : '';
  const read = rec.ocr_status === 'done';
  const kinds = SCAN_KINDS[API.user.role] || SCAN_KINDS.agent;
  // the AI's guess at the app kind, only if this role is allowed to file it
  const aiKind = kinds.some(([v]) => v === ex.suggested_kind) ? ex.suggested_kind : null;
  const selKind = rec.kind || aiKind || kind;
  const docGuess = ex.doc_kind && DOC_KIND_LABEL[ex.doc_kind]
    ? `We read this as ${DOC_KIND_LABEL[ex.doc_kind]}${ex.direction === 'money_in' ? ' (money in)' : ex.direction === 'money_out' ? ' (money out)' : ''}${ex.reference_no ? ` · ref ${API.esc(String(ex.reference_no))}` : ''}. Change the type if that's not right.`
    : '';
  openModal(read ? 'Check what we read' : 'AI could not read this', `
    <div class="scan-note ${read ? 'ok' : 'warn'}">
      ${read
        ? `The AI read the receipt${conf ? ' (' + conf + ')' : ''}. Fix anything that's wrong, then save it to staging.`
        : `The photo couldn't be read automatically. Fill in the details below.`}
    </div>
    <label class="muted">Type</label>
    <select id="csKind" class="input" style="width:100%;margin-bottom:${docGuess ? '4px' : '10px'}">
      ${kinds.map(([v, l]) => `<option value="${v}" ${v === selKind ? 'selected' : ''}>${l}</option>`).join('')}
    </select>
    ${docGuess ? `<p class="muted" style="font-size:11px;margin:0 0 10px">${docGuess}</p>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <div><label class="muted">Total amount (PKR)</label><input id="csAmount" type="number" class="input" style="width:100%" value="${rec.amount != null ? rec.amount : ''}"></div>
      <div><label class="muted">Date on receipt</label><input id="csDate" class="input" style="width:100%" value="${API.esc(ex.date || '')}" placeholder="YYYY-MM-DD"></div>
    </div>
    <label class="muted">Vendor / paid to</label>
    <input id="csVendor" class="input" style="width:100%;margin-bottom:10px" value="${API.esc(rec.vendor || '')}">
    <label class="muted">Note</label>
    <input id="csMemo" class="input" style="width:100%;margin-bottom:${items.length ? '10px' : '4px'}" value="${API.esc(rec.memo || '')}">
    ${items.length ? `<div class="section-label">Line items the AI saw</div>
      <div class="scan-items">${items.map(it => `<div class="item-line"><span>${API.esc(String(it.item || it.size || 'item'))}${it.qty != null ? ' × ' + it.qty : ''}</span><b>${it.amount != null ? API.fmtMoney(it.amount) : (it.price != null ? API.fmtMoney(it.price) : (it.rate != null ? API.fmtMoney(it.rate) : '—'))}</b></div>`).join('')}</div>
      <p class="muted" style="font-size:11px;margin-top:6px">Line-item corrections can be made by the reviewer.</p>` : ''}
  `, `<button class="btn ghost" data-close-modal>Later</button><button class="btn primary" id="csSave">Save to staging</button>`);
  document.getElementById('csSave').addEventListener('click', async () => {
    const body = {
      kind: document.getElementById('csKind').value,
      amount: document.getElementById('csAmount').value || null,
      date: document.getElementById('csDate').value.trim() || null,
      vendor: document.getElementById('csVendor').value.trim() || null,
      memo: document.getElementById('csMemo').value.trim() || null,
    };
    try {
      await API.updateReceipt(rec.id, body);
      closeModal();
      ppToast('Saved to staging — a reviewer will approve it', 'ok');
      App.refresh();
    } catch (e) { ppToast(e.message, 'err'); }
  });
}

// ---- team / staff management ----
async function viewTeam() {
  const u = API.user;
  const isRoot = u.role === 'admin';
  const all = await API.users();
  const agents = all.filter(r => r.role === 'agent');
  // Team = employees only. Customers have their own page; agents are shown as a
  // summary chip strip below (managed in Agents & commissions).
  const rows = all.filter(r => r.role !== 'agent' && r.role !== 'customer')
    .sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || a.role.localeCompare(b.role) || a.name.localeCompare(b.name));
  const pending = rows.filter(r => r.status === 'pending');
  const active = rows.filter(r => r.status === 'active');
  const monthly = active.reduce((a, r) => a + (Number(r.salary) || 0), 0);
  const roleChip = (r) => `<span class="chip ${r.role}">${API.roleLabel(r.role)}</span>`;
  const statusChip = (r) => r.status === 'pending'
    ? '<span class="chip pending">Pending</span>'
    : (r.status === 'disabled' ? '<span class="chip cancelled">Disabled</span>' : '<span class="chip approved">Active</span>');
  const canViewAgents = ['admin', 'manager', 'finance'].includes(u.role);
  return `<div class="page-head"><h1>Team</h1>
    <button class="btn primary sm" data-act="add-employee">+ Add employee</button></div>
    <div class="grid kpis" style="margin-top:14px">
      <div class="card kpi"><div class="k-label">Employees</div><div class="k-val">${active.length}</div></div>
      <div class="card kpi warn"><div class="k-label">Awaiting activation</div><div class="k-val">${pending.length}</div></div>
      <div class="card kpi"><div class="k-label">Monthly payroll</div><div class="k-val">Rs ${Math.round(monthly).toLocaleString('en-PK')}</div></div>
    </div>
    ${pending.length ? '<div class="sec-t">Needs attention — ' + pending.length + ' awaiting activation</div>' : ''}
    ${rows.map(teamRowHtml).join('') || '<div class="empty">No employees yet.</div>'}
    ${canViewAgents ? `
    <div class="sec-t">Agents — ${agents.length}</div>
    <div class="card" style="padding:14px 16px">
      <p class="muted" style="font-size:12.5px;margin:0 0 10px">Agents are commission-based — their rates, activation and daily settings live in <b>Agents &amp; commissions</b>.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        ${agents.map(a => `<span class="chip ${a.status === 'pending' ? 'pending' : a.status === 'disabled' ? 'cancelled' : 'agent'}" style="text-transform:none;letter-spacing:0;font-weight:600">${API.esc(a.name)}</span>`).join('') || '<span class="muted" style="font-size:12.5px">No agents yet</span>'}
      </div>
      <button class="btn sm" data-act="nav" data-to="agents">Open agents &amp; commissions →</button>
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
    ['employee', 'Employee (office / general staff)'], ['shop_manager', 'Shop manager (orders & deliveries only)'],
    ['delivery', 'Delivery'], ['finance', 'Finance'], ['agent', 'Agent (commissioned)'],
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
      <div id="empSalaryNote" style="display:none;margin:2px 0 4px"><p class="muted" style="font-size:11.5px;margin:0">Agents are commission-based — earnings come from order commissions, set their rate in <b>Agents &amp; commissions</b>.</p></div>
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
      ['employee', 'Employee'], ['shop_manager', 'Shop manager (orders & deliveries only)'],
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
        <div ${r.role === 'agent' ? '' : 'style="display:none"'} id="emSalaryNote"><p class="muted" style="font-size:11.5px;margin:0">Agents are commission-based — no fixed salary. Set the rate in <b>Agents &amp; commissions</b>.</p></div>
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
        <div class="nm">${API.esc(r.name)} <span class="chip ${r.role}" style="margin-left:4px">${API.roleLabel(r.role)}</span></div>
        <div class="sub">${sub}${paid ? ' · paid ' + API.fmtDay(r.entry.paid_at) : ''}</div>
      </div>
      <div class="pay-amt">${API.fmtMoney(r.due)}</div>
      ${paid ? '<span class="chip paid">Paid</span>'
        : (r.entry
          ? `<button class="btn primary sm" data-act="payroll-pay" data-id="${r.entry.id}">Mark paid</button>`
          : `<button class="btn ghost sm" data-act="payroll-pay-one" data-uid="${r.user_id}" data-amt="${r.entry ? r.entry.amount : (r.salary || r.commission || 0)}">Add & pay</button>`)}
    </div>`;
  }).join('') || '<div class="empty">No staff with a salary yet. Set salaries from Team.</div>'}
  <p class="muted" style="font-size:12px;margin-top:10px">Salaries post to the ledger under <b>Salaries &amp; Wages</b>. Agents are commission-based — paying their accrued commission posts to <b>Commissions</b> and settles it in <b>Agents &amp; commissions</b>.</p>`;
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
        <div class="sub">${API.esc(c.contact_name || c.phone || '—')}${c.address ? ' · ' + API.esc(c.address) : ''}${c.orders_count ? ' · ' + V.plural(c.orders_count, 'order') : ''}</div>
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
        <td class="cell-main" data-l="Product">${API.esc(p.name)}${p.active ? '' : ' <span class="chip cancelled">Paused</span>'}</td>
        ${V.m('Size', sizeLabel(p.size_ml), 'tv num')}
        ${V.m('Price', API.fmtMoney(p.price), 'tv num')}
        ${V.m('Status', p.active ? '<span class="chip approved">Active</span>' : '<span class="chip cancelled">Off</span>', '')}
        ${canEdit ? `<td class="cell-act"><button class="btn ghost sm" data-act="edit-product" data-id="${p.id}">Edit</button> <button class="btn sm ${p.active ? 'ghost' : 'primary'}" data-act="toggle-product" data-id="${p.id}" data-active="${p.active ? 1 : 0}">${p.active ? 'Pause' : 'Enable'}</button></td>` : ''}
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
  { to: 'orders', icon: IC.box, label: 'Orders', section: 'Operations' },
  { to: 'deliveries', icon: IC.truck, label: 'Deliveries' },
  { to: 'route', icon: IC.route, label: 'Route map' },
  { to: 'customers', icon: IC.users, label: 'Customers', section: 'Sales' },
  { to: 'agents', icon: IC.badge, label: 'Agents & commissions' },
  { to: 'bookkeeping', icon: IC.book, label: 'Bookkeeping', section: 'Finance' },
  { to: 'receipts', icon: IC.receipt, label: 'Receipts' },
  { to: 'payments', icon: IC.wallet, label: 'Payment methods' },
  { to: 'payroll', icon: IC.wallet, label: 'Payroll' },
  { to: 'audit', icon: IC.clip, label: 'Audit trail' },
  { to: 'products', icon: IC.bottle, label: 'Products', section: 'Catalog & team' },
  { to: 'team', icon: IC.shield, label: 'Team' },
];
// Shop manager: a single-purpose profile that only runs the order pipeline —
// order received -> confirmed -> dispatched -> delivered. No money, catalog,
// team, or reporting views; those stay with admin/manager/finance.
const SHOP_MANAGER_NAV = [
  { to: 'orders', icon: IC.box, label: 'Orders' },
  { to: 'deliveries', icon: IC.truck, label: 'Deliveries' },
];
function navFor(role) {
  const N = {
    admin: ADMIN_NAV,
    manager: ADMIN_NAV,
    shop_manager: SHOP_MANAGER_NAV,
    finance: [
      { to: 'dashboard', icon: IC.chart, label: 'Finance' },
      { to: 'bookkeeping', icon: IC.book, label: 'Bookkeeping' },
      { to: 'orders', icon: IC.box, label: 'Order payments' },
      { to: 'receipts', icon: IC.receipt, label: 'Receipts' },
      { to: 'payroll', icon: IC.wallet, label: 'Payroll' },
      { to: 'agents', icon: IC.badge, label: 'Agents & commissions' },
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
      { to: 'profile', icon: IC.users, label: 'My profile' },
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
    agents: viewAgents, bookkeeping: viewBookkeeping, audit: viewAudit, payments: viewPayments, receipts: viewReceipts,
    team: viewTeam, payroll: viewPayroll,
    products: viewProducts,
  },
  manager: {
    dashboard: viewAdminDashboard, orders: viewOrders, deliveries: viewDeliveries,
    route: viewSmartRoute,
    customers: viewCustomers,
    agents: viewAgents, bookkeeping: viewBookkeeping, audit: viewAudit, payments: viewPayments, receipts: viewReceipts,
    team: viewTeam, payroll: viewPayroll,
    products: viewProducts,
  },
  finance: { dashboard: viewFinanceDashboard, bookkeeping: viewBookkeeping, orders: viewOrders, receipts: viewReceipts, payroll: viewPayroll, agents: viewAgents },
  agent: { dashboard: viewAgentDashboard, orders: viewOrders, commissions: viewCommissions, receipts: viewReceipts },
  delivery: { route: viewSmartRoute, deliveries: viewDeliveries, receipts: viewReceipts },
  shop_manager: { orders: viewOrders, deliveries: viewDeliveries },
  employee: { profile: viewProfile, orders: viewOrders },
  customer: { home: viewCustomerHome, orders: viewOrders, profile: viewCustomerProfile },
};
