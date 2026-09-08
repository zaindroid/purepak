'use strict';
// Two things this covers:
//  1. Realtime relay — a portal change made by staff (price list, product,
//     customer) is pushed live to EVERY open stream, including customers/agents
//     who never get a bell notification for it.
//  2. Customer storefront — the redesigned shop renders, the basket + sticky
//     cart bar work, and checkout hands the right items to the order modal.
const { JSDOM } = require('jsdom');
const { readFileSync } = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4310';
const PW = 'purepak123';
const W = path.join(__dirname, '..', 'web');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name); };

async function login(email) {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW }),
  });
  const j = await r.json();
  if (!j.token) throw new Error('login failed: ' + email);
  return j.token;
}
async function apiAs(token, method, p, body) {
  const r = await fetch(BASE + '/api' + p, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
// open an SSE stream and expose a buffer we can assert against
async function openStream(token) {
  const r = await fetch(BASE + '/api/events?token=' + encodeURIComponent(token), { headers: { Accept: 'text/event-stream' } });
  const reader = r.body.getReader();
  const s = { buf: '', done: false };
  (async () => {
    try {
      while (!s.done) {
        const { value, done } = await reader.read();
        if (done) break;
        s.buf += Buffer.from(value).toString();
      }
    } catch { /* cancelled */ }
  })();
  s.close = () => { s.done = true; try { reader.cancel(); } catch {} };
  s.waitFor = async (ev, ms = 4000) => {
    const t0 = Date.now();
    const re = new RegExp('event: ' + ev + '\\b');
    while (Date.now() - t0 < ms) { if (re.test(s.buf)) return true; await sleep(60); }
    return false;
  };
  return s;
}

(async () => {
  // ---------- 1. realtime relay ----------
  const adminTok = await login('admin@purepak.pk');
  const custTok = await login('ali@rascon.pk');   // customer — never on staffUserIds()
  const agentTok = await login('bilal@purepak.pk'); // agent   — never on staffUserIds()

  const custStream = await openStream(custTok);
  const agentStream = await openStream(agentTok);
  await sleep(500); // let both streams say hello
  check('customer stream established', /event: hello/.test(custStream.buf));

  // price-list (matrix) change by admin -> customer sees it live
  custStream.buf = '';
  let res = await apiAs(adminTok, 'POST', '/pricing', [{ product_id: 1, customer_type: 'wholesale', price: 7 }]);
  check('admin pricing update accepted', res.status === 200, JSON.stringify(res.body));
  check('customer got live "pricing" push on matrix change', await custStream.waitFor('pricing'));

  // product base-price change by admin -> customer sees it live
  custStream.buf = '';
  res = await apiAs(adminTok, 'PATCH', '/products/1', { price: 11 });
  check('admin product update accepted', res.status === 200);
  check('customer got live "pricing" push on product change', await custStream.waitFor('pricing'));

  // new customer created by admin -> agent sees it live
  agentStream.buf = '';
  res = await apiAs(adminTok, 'POST', '/customers', { name: 'Relay Test Co', phone: '0300-0000000', type: 'retail' });
  check('admin customer create accepted', res.status === 201);
  check('agent got live "customer" push on customer create', await agentStream.waitFor('customer'));

  // customer places an order -> office refreshes + office feed gets it, but
  // OTHER customers' screens must stay completely still.
  const adminStream = await openStream(adminTok);
  const otherCustTok = await login('sana@funloft.pk');
  const otherCustStream = await openStream(otherCustTok);
  await sleep(300);
  adminStream.buf = ''; otherCustStream.buf = ''; custStream.buf = '';
  const beforeUnread = (await apiAs(adminTok, 'GET', '/notifications')).body.unread || 0;
  res = await apiAs(custTok, 'POST', '/orders', { items: [{ product_id: 2, qty: 3 }] });
  check('customer order placed', res.status === 201, JSON.stringify(res.body));
  check('office board got live "order" push', await adminStream.waitFor('order'));
  check('another customer gets NO push when someone else orders', !(await otherCustStream.waitFor('order', 1500)));
  check('the ordering customer is not spammed with a push either', !(await custStream.waitFor('order', 500)));
  await sleep(200);
  const now = (await apiAs(adminTok, 'GET', '/notifications')).body;
  check('new order lands in admin notification feed',
    (now.unread || 0) > beforeUnread && now.notifications.some(n => n.kind === 'order' && /Rascon/.test(n.body || '')),
    JSON.stringify(now.notifications && now.notifications[0]));
  for (const who of ['manager@purepak.pk', 'finance@purepak.pk']) {
    const t = await login(who);
    const nf = (await apiAs(t, 'GET', '/notifications')).body;
    check(who.split('@')[0] + ' also notified of the new order',
      nf.notifications.some(n => n.kind === 'order' && /Rascon/.test(n.body || '')));
  }
  // a customer never gets an order notification for someone else's order
  const oc = (await apiAs(otherCustTok, 'GET', '/notifications')).body;
  check('other customer feed untouched by the order',
    !oc.notifications.some(n => n.kind === 'order' && /Rascon/.test(n.body || '')));

  custStream.close(); agentStream.close(); adminStream.close(); otherCustStream.close();

  // ---------- 2. customer storefront (jsdom) ----------
  let html = readFileSync(path.join(W, 'index.html'), 'utf8')
    .replace(/<script src="[^"]*"><\/script>/g, '').replace(/<link[^>]*>/g, '');
  const dom = new JSDOM(html, { url: BASE + '/', runScripts: 'dangerously', pretendToBeVisual: true });
  const { window } = dom; const { document } = window;
  window.confirm = () => true; window.alert = () => {}; window.scrollTo = () => {};
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, addEventListener() {}, removeEventListener() {} }));
  window.HTMLElement.prototype.scrollIntoView = function () {};
  const nodeFetch = globalThis.fetch;
  window.fetch = (u, o) => nodeFetch(String(u).startsWith('http') ? u : BASE + String(u), o);
  window.eval(['api.js', 'views.js', 'app.js'].map(f => readFileSync(path.join(W, f), 'utf8')).join('\n;\n'));
  await sleep(300);

  // log in through the real form
  document.getElementById('loginEmail').value = 'ali@rascon.pk';
  document.getElementById('loginPass').value = PW;
  document.getElementById('loginForm').requestSubmit();
  const t0 = Date.now();
  while (Date.now() - t0 < 9000 && document.getElementById('app').classList.contains('hidden')) await sleep(80);
  window.location.hash = '#/home';
  await sleep(900);

  const view = document.getElementById('view');
  check('storefront hero renders (not a dashboard)', /shop-hero/.test(view.innerHTML) && !/grid kpis/.test(view.innerHTML));
  check('hero is trimmed — no plant address', !/Golra/i.test(view.querySelector('.shop-hero').innerHTML));
  check('floating WhatsApp button deep-links to the app', /href="whatsapp:\/\/send/.test((view.querySelector('.wa-fab') || {}).outerHTML || ''));
  const firstPid = view.querySelector('.prod').dataset.pid;
  const catalog = await (await fetch(BASE + '/api/products', { headers: { Authorization: 'Bearer ' + custTok } })).json();
  check('a product card per catalog item', view.querySelectorAll('.prod').length === catalog.length,
    `cards=${view.querySelectorAll('.prod').length} catalog=${catalog.length}`);
  check('every card has an "Add to order" button', [...view.querySelectorAll('.prod')].every(c => c.querySelector('[data-shop="add"]')));

  // add two of the first product via the card button + the stepper
  const c0 = () => view.querySelector(`.prod[data-pid="${firstPid}"]`);
  c0().querySelector('[data-shop="add"]').click();
  await sleep(50);
  c0().querySelector('[data-shop="inc"]').click();
  await sleep(50);
  check('card flips to in-cart state', c0().classList.contains('in-cart'));
  check('stepper shows qty 2', c0().querySelector('[data-qty]').textContent === '2');
  const bar = document.getElementById('shopCartBar');
  check('sticky cart bar becomes visible', bar && !bar.hidden);
  check('cart bar totals the basket', document.getElementById('shopCartQty').textContent === '2');
  check('body gets has-cartbar (page padding)', document.body.classList.contains('has-cartbar'));

  // live price change while items are in the basket -> reprices in place, keeps basket + scroll
  const before = c0().querySelector('.prod-now').textContent;
  await apiAs(adminTok, 'POST', '/pricing', [{ product_id: +firstPid, customer_type: 'wholesale', price: 999 }]);
  await window.refreshStorefrontPrices();   // what the 'pricing' SSE event triggers
  await sleep(100);
  check('storefront reprices in place on a live update', /999/.test(c0().querySelector('.prod-now').textContent),
    `${before} -> ${c0().querySelector('.prod-now').textContent}`);
  check('reprice patches cards only — no page rebuild', view.querySelector('.shop-hero') && view.querySelectorAll('.prod').length > 0);
  check('basket survives the live reprice', c0().classList.contains('in-cart') && !document.getElementById('shopCartBar').hidden);
  check('cart bar total reflects the new price', /1[,.]?998/.test(document.getElementById('shopCartTotal').textContent),
    document.getElementById('shopCartTotal').textContent); // 2 x Rs 999

  // checkout -> order modal prefilled with the basket
  view.querySelector('[data-shop="checkout"]').click();
  await sleep(500);
  check('checkout opens the order modal', !!document.getElementById('ocSubmit'));
  const qtyInput = document.querySelector(`[data-itemqty="${firstPid}"]`);
  check('order modal prefilled from basket', qtyInput && qtyInput.value === '2', 'val=' + (qtyInput && qtyInput.value));

  document.getElementById('ocSubmit').click();
  await sleep(1200);
  const toast = document.querySelector('.toast');
  check('order places from storefront', !!toast && /placed/i.test(toast.textContent), toast ? toast.textContent : 'no toast');
  check('basket clears after order placed', document.getElementById('shopCartBar') == null || document.getElementById('shopCartBar').hidden);

  // "Contact us" opens a modal with all the contact details (kept out of the page body)
  view.querySelector('[data-shop="contact"]').click();
  await sleep(200);
  const cm = document.getElementById('modalRoot');
  check('Contact us opens a details modal', /whatsapp:\/\/send/.test(cm.innerHTML) && /purepak\.com\.pk/.test(cm.innerHTML) && /6666 796/.test(cm.innerHTML));

  console.log('----');
  console.log(fails === 0 ? 'STOREFRONT + RELAY: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
