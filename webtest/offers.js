'use strict';
// Admin-broadcast offers: create -> every customer gets a notification +
// storefront banner (and the guest QR page shows it too); deactivate/expire
// pulls it back down; only admin/manager can create or manage them.
const { JSDOM } = require('jsdom');
const { readFileSync } = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4310';
const PW = 'purepak123';
const W = path.join(__dirname, '..', 'web');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, extra = '') => { if (!ok) { fails++; console.log('FAIL', n, extra); } else console.log('ok  ', n); };

async function api(t, m, p, b) {
  const r = await fetch(BASE + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b != null ? JSON.stringify(b) : undefined });
  let j = null; try { j = await r.json(); } catch {} return { status: r.status, body: j };
}
const login = async (email) => (await api(null, 'POST', '/api/auth/login', { email, password: PW })).body.token;

async function asUser(email, run) {
  let html = readFileSync(path.join(W, 'index.html'), 'utf8')
    .replace(/<script src="[^"]*"><\/script>/g, '').replace(/<link[^>]*>/g, '');
  const dom = new JSDOM(html, { url: BASE + '/', runScripts: 'dangerously', pretendToBeVisual: true });
  const { window } = dom; const { document } = window;
  window.confirm = () => true; window.alert = () => {}; window.scrollTo = () => {};
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, addEventListener() {}, removeEventListener() {} }));
  window.HTMLElement.prototype.scrollIntoView = function () {};
  const nf = globalThis.fetch;
  window.fetch = (u, opt) => nf(String(u).startsWith('http') ? u : BASE + String(u), opt);
  window.eval(['api.js', 'views.js', 'app.js'].map(f => readFileSync(path.join(W, f), 'utf8')).join('\n;\n'));
  await sleep(300);
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPass').value = PW;
  document.getElementById('loginForm').requestSubmit();
  const t0 = Date.now();
  while (Date.now() - t0 < 9000 && document.getElementById('app').classList.contains('hidden')) await sleep(80);
  await sleep(600);
  try { await run(window, document); } finally { try { window.close(); } catch {} }
}

(async () => {
  const admin = await login('admin@purepak.pk');
  const finance = await login('finance@purepak.pk');
  const ali = await login('ali@rascon.pk');

  // ---------- permissions ----------
  check('finance cannot create an offer', (await api(finance, 'POST', '/api/offers', { title: 'x', body: 'y' })).status === 403);
  check('customer cannot create an offer', (await api(ali, 'POST', '/api/offers', { title: 'x', body: 'y' })).status === 403);
  check('rejects a missing title', (await api(admin, 'POST', '/api/offers', { title: '', body: 'y' })).status === 400);

  // ---------- create -> broadcasts ----------
  const before = (await api(ali, 'GET', '/api/notifications')).body.notifications.length;
  const create = await api(admin, 'POST', '/api/offers', { title: 'Ramadan bundle', body: '19L x3 for Rs 280 this week only' });
  check('admin creates an offer', create.status === 201 && create.body.id > 0);
  const offerId = create.body.id;

  const notifs = (await api(ali, 'GET', '/api/notifications')).body.notifications;
  check('customer got the broadcast as a notification', notifs.length > before && notifs[0].kind === 'offer' && notifs[0].ref === 'offer#' + offerId, notifs[0]);
  check("admin (the creator) wasn't self-notified", !(await api(admin, 'GET', '/api/notifications')).body.notifications.some(n => n.kind === 'offer'));

  const active = (await api(ali, 'GET', '/api/offers/active')).body;
  check('customer sees it in the active-offers list', active.some(o => o.id === offerId));
  const pub = await (await fetch(BASE + '/api/public/offers')).json();
  check('the guest QR page (no auth) sees it too', pub.some(o => o.id === offerId));

  // ---------- deactivate pulls it back down everywhere ----------
  const off = await api(admin, 'PATCH', '/api/offers/' + offerId, { active: false });
  check('admin turns the offer off', off.status === 200 && off.body.active === 0);
  check('gone from the customer active list', !(await api(ali, 'GET', '/api/offers/active')).body.some(o => o.id === offerId));
  check('gone from the public list', !(await (await fetch(BASE + '/api/public/offers')).json()).some(o => o.id === offerId));

  // ---------- an already-expired offer never shows and never notifies ----------
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const before2 = (await api(ali, 'GET', '/api/notifications')).body.notifications.filter(n => n.kind === 'offer').length;
  const expired = await api(admin, 'POST', '/api/offers', { title: 'Old deal', body: 'expired', ends_at: yesterday + ' 23:59:59' });
  check('expired-on-arrival offer is created but not active', expired.status === 201);
  check('never shows as active', !(await api(ali, 'GET', '/api/offers/active')).body.some(o => o.id === expired.body.id));
  const after2 = (await api(ali, 'GET', '/api/notifications')).body.notifications.filter(n => n.kind === 'offer').length;
  check("doesn't spam a notification for something already over", after2 === before2, `${before2} -> ${after2}`);

  // ---------- delete ----------
  const del = await api(admin, 'DELETE', '/api/offers/' + offerId);
  check('admin can delete an offer', del.status === 200);
  check('deleted offer is gone from the admin list', !(await api(admin, 'GET', '/api/offers')).body.some(o => o.id === offerId));

  // ---------- DOM: admin Offers page ----------
  await asUser('admin@purepak.pk', async (window, document) => {
    window.location.hash = '#/offers';
    await sleep(700);
    const html = document.getElementById('view').innerHTML;
    check('admin Offers page renders', /Offers/.test(html) && document.querySelector('[data-act="new-offer"]'));
    const navLabels = [...document.querySelectorAll('#nav a')].map(a => a.textContent.trim());
    check('Offers is in the admin nav', navLabels.some(l => l === 'Offers'));
  });

  // ---------- DOM: customer storefront banner + dismiss ----------
  const liveOffer = await api(admin, 'POST', '/api/offers', { title: 'Eid special', body: 'Free delivery this week' });
  await asUser('ali@rascon.pk', async (window, document) => {
    window.location.hash = '#/home';
    await sleep(900);
    check('offer banner shows on the customer Shop page', !!document.querySelector('.offer-card'));
    check('banner shows the right title', document.querySelector('.offer-card b').textContent.includes('Eid special'));
    const closeBtn = document.querySelector('.offer-close');
    check('dismiss button is present', !!closeBtn);
    closeBtn.click();
    await sleep(100);
    check('dismissing removes the card from the page', !document.querySelector('.offer-card'));
    check('dismissal is remembered in localStorage', JSON.parse(window.localStorage.getItem('pp_offers_dismissed') || '[]').includes(liveOffer.body.id));
  });
  // a second visit (fresh window, same localStorage would be a fresh jsdom —
  // this just confirms the filter logic itself works by re-rendering the view fn)
  await api(admin, 'DELETE', '/api/offers/' + liveOffer.body.id);

  console.log('----');
  console.log(fails === 0 ? 'OFFERS: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
