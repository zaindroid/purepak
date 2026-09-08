'use strict';
// Covers the round of admin-side fixes:
//  1. modal action buttons work (order Confirm / Dispatch) — delegation on #modalRoot
//  2. receipt image is served from the same dir it was written to (no broken link)
//  3. you don't get a notification for your OWN change
//  4. customers don't appear on the Team page (jsdom render)
const { JSDOM } = require('jsdom');
const { readFileSync } = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4310';
const PW = 'purepak123';
const W = path.join(__dirname, '..', 'web');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, extra = '') => { if (!ok) { fails++; console.log('FAIL', n, extra); } else console.log('ok  ', n); };

async function login(email) {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW }),
  });
  const j = await r.json();
  if (!j.token) throw new Error('login failed: ' + email);
  return j.token;
}
async function api(token, method, p, body) {
  const r = await fetch(BASE + '/api' + p, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
// a 1x1 png as a data URL, padded so it clears the server's >1000-char guard
const PNG_1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' + 'A'.repeat(1200);

(async () => {
  const adminTok = await login('admin@purepak.pk');

  // ---------- 3. no self-notification ----------
  const before = (await api(adminTok, 'GET', '/notifications')).body.notifications.length;
  const mk = await api(adminTok, 'POST', '/users', {
    name: 'Self Notif Test', email: 'selfnotif.' + Date.now() + '@purepak.pk', password: 'temp1234', role: 'delivery',
  });
  check('admin created an employee', mk.status === 201, JSON.stringify(mk.body));
  await sleep(150);
  const after = (await api(adminTok, 'GET', '/notifications')).body.notifications;
  check('admin does NOT get a notification for their own action',
    after.length === before && !after.some(n => /Self Notif Test/.test(n.body || '')),
    'before=' + before + ' after=' + after.length);

  // a price change by admin also should not notify admin
  const b2 = (await api(adminTok, 'GET', '/notifications')).body.notifications.length;
  await api(adminTok, 'POST', '/pricing', [{ product_id: 1, customer_type: 'wholesale', price: 6 }]);
  await sleep(150);
  const a2 = (await api(adminTok, 'GET', '/notifications')).body.notifications.length;
  check('admin not notified of their own price change', a2 === b2, 'before=' + b2 + ' after=' + a2);

  // ---------- 2. receipt image round-trips (dir consistency) ----------
  const up = await api(adminTok, 'POST', '/receipts', {
    image: PNG_1x1, mimetype: 'image/png', filename: 'test.png', kind: 'expense', amount: 500, vendor: 'DirTest',
  });
  check('receipt uploaded', up.status === 201 && up.body.id > 0, JSON.stringify(up.body));
  const rid = up.body.id;
  const img = await fetch(BASE + '/api/receipts/' + rid + '?token=' + encodeURIComponent(adminTok));
  check('receipt image is served (not a broken link)', img.status === 200 && /image\//.test(img.headers.get('content-type') || ''),
    'status=' + img.status + ' ct=' + img.headers.get('content-type'));

  // ---------- 1 + 4. jsdom: modal buttons + team page ----------
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
  document.getElementById('loginEmail').value = 'admin@purepak.pk';
  document.getElementById('loginPass').value = PW;
  document.getElementById('loginForm').requestSubmit();
  const t0 = Date.now();
  while (Date.now() - t0 < 9000 && document.getElementById('app').classList.contains('hidden')) await sleep(80);

  // 4. Team page has no customer rows
  window.location.hash = '#/team';
  await sleep(1200);
  const teamHtml = document.getElementById('view').innerHTML;
  check('Team page renders', /Team/.test(teamHtml) && /team-row/.test(teamHtml));
  const custUsers = (await api(adminTok, 'GET', '/users')).body.filter(u => u.role === 'customer');
  const leaked = custUsers.filter(c => teamHtml.includes('>' + c.name + '<') || teamHtml.includes(c.name + ' <span'));
  check('no customer accounts shown on the Team page', leaked.length === 0,
    'leaked: ' + leaked.map(c => c.name).join(', '));

  // 1. order detail modal — the Confirm button actually moves the order
  const newOrder = await api(adminTok, 'POST', '/orders', { customer_id: 1, items: [{ product_id: 4, qty: 1 }] });
  check('made a fresh "new" order', newOrder.status === 201 && newOrder.body.status === 'new');
  const oid = newOrder.body.id;
  window.location.hash = '#/orders';
  await sleep(1200);
  // open the detail modal the real way — click the order row
  const row = document.querySelector(`#view [data-act="view-order"][data-id="${oid}"]`);
  check('the new order shows in the admin orders list', !!row);
  if (row) row.click();
  await sleep(600);
  const confirmBtn = document.querySelector('#modalRoot [data-act="dispatch"][data-status="confirmed"]');
  check('order modal shows a Confirm button', !!confirmBtn, document.getElementById('modalRoot').innerHTML.slice(0, 200));
  if (confirmBtn) {
    confirmBtn.click();
    await sleep(900);
    const o2 = await api(adminTok, 'GET', '/orders/' + oid);
    check('clicking Confirm in the modal moved the order new -> confirmed',
      o2.body.status === 'confirmed', 'status=' + o2.body.status);
  }

  console.log('----');
  console.log(fails === 0 ? 'ADMIN FIXES: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
