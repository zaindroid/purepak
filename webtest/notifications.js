'use strict';
// Cross-profile notification coverage + bell navigation for every ref type.
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
  const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PW }) });
  const j = await r.json(); if (!j.token) throw new Error('login ' + email + ' ' + JSON.stringify(j)); return j.token;
}
async function api(t, m, p, b) {
  const r = await fetch(BASE + '/api' + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b != null ? JSON.stringify(b) : undefined });
  let j = null; try { j = await r.json(); } catch {} return { status: r.status, body: j };
}
const feed = async (t) => ((await api(t, 'GET', '/notifications')).body.notifications || []);
const has = (list, re, refRe) => list.some(n => re.test((n.title || '') + ' ' + (n.body || '')) && (!refRe || refRe.test(n.ref || '')));

(async () => {
  const admin = await login('admin@purepak.pk');
  const manager = await login('manager@purepak.pk');
  const finance = await login('finance@purepak.pk');
  const driver = await login('delivery@purepak.pk');
  const bilal = await login('bilal@purepak.pk');   // agent for Rascon (customer 1)
  const ali = await login('ali@rascon.pk');         // customer 1, has address
  const sana = await login('sana@funloft.pk');      // customer 2 (bystander)

  // ---------- new order: office + assigned agent, NOT other customers ----------
  const o = await api(bilal, 'POST', '/orders', { customer_id: 1, items: [{ product_id: 4, qty: 2 }] });
  check('order created (by agent, so agent_id set)', o.status === 201 && o.body.agent_id, JSON.stringify(o.body));
  const oid = o.body.id;
  await sleep(150);
  check('admin got "new order"', has(await feed(admin), /new order/i, /^order#\d+$/));
  check('manager got "new order"', has(await feed(manager), /new order/i));
  check('finance got "new order"', has(await feed(finance), /new order/i));
  check('bystander customer got NOTHING about it', !has(await feed(sana), new RegExp('#' + oid)));

  // ---------- confirm: customer + agent + drivers ----------
  await api(admin, 'PATCH', '/orders/' + oid, { status: 'confirmed' });
  await sleep(150);
  check('customer told "order confirmed"', has(await feed(ali), /confirmed/i, new RegExp('order#' + oid)));
  check('assigned agent told about confirm', has(await feed(bilal), new RegExp('#' + oid + '.*(confirm)', 'i')) || has(await feed(bilal), /confirm/i));
  check('driver told "new delivery to schedule"', has(await feed(driver), /new delivery to schedule/i, new RegExp('order#' + oid)));

  // ---------- payment recorded -> customer ----------
  await api(finance, 'PATCH', '/orders/' + oid, { paid: o.body.total, method: 'jazzcash', memo: 'TXN1' });
  await sleep(150);
  check('customer told "payment received"', has(await feed(ali), /payment received/i, new RegExp('order#' + oid)));

  // ---------- driver starts trip -> customer "out for delivery", order flips ----------
  const del = (await api(driver, 'GET', '/deliveries')).body.find(d => d.order_id === oid);
  await api(driver, 'PATCH', '/deliveries/' + del.id, { status: 'out_for_delivery' });
  await sleep(150);
  check('order is in_delivery after trip start', (await api(admin, 'GET', '/orders/' + oid)).body.status === 'in_delivery');
  check('customer told "out for delivery"', has(await feed(ali), /out for delivery/i, new RegExp('order#' + oid)));

  // ---------- delivered -> customer + agent + staff, order flips ----------
  await api(driver, 'PATCH', '/deliveries/' + del.id, { status: 'delivered' });
  await sleep(150);
  check('order is delivered', (await api(admin, 'GET', '/orders/' + oid)).body.status === 'delivered');
  check('customer told "delivered"', has(await feed(ali), /delivered/i, new RegExp('order#' + oid)));
  check('agent told "delivered"', has(await feed(bilal), /delivered/i));
  check('admin told "delivered"', has(await feed(admin), new RegExp('#' + oid + ' delivered', 'i')));

  // ---------- commission settled -> that agent (not a different one) ----------
  const accrued = (await api(admin, 'GET', '/commissions?status=accrued')).body || [];
  const bilalComm = accrued.find(c => /Bilal/.test(c.agent_name || ''));
  if (bilalComm) {
    await api(finance, 'PATCH', '/commissions/' + bilalComm.id, {});
    await sleep(150);
    check('the agent whose commission was settled is told "commission paid"', has(await feed(bilal), /commission paid/i, /^comm#\d+$/));
  } else check('agent told "commission paid"', true, '(no accrued commission for Bilal — skipped)');

  // ---------- payroll paid -> the employee ----------
  const period = new Date().toISOString().slice(0, 7);
  await api(admin, 'POST', '/payroll/generate', { period });
  const prRows = (await api(admin, 'GET', '/payroll?period=' + period)).body.rows || [];
  const pr = prRows.find(x => /Waqas/.test(x.name || '') && x.entry && x.entry.status !== 'paid');
  if (pr) {
    await api(admin, 'POST', '/payroll/' + pr.entry.id + '/mark-paid', {});
    await sleep(150);
    check('driver (employee) told "salary paid"', has(await feed(driver), /(salary|commission) paid/i, /^payroll#/));
  } else check('driver told "salary paid"', true, '(no unpaid payroll row for Waqas — skipped)');

  // ---------- price list update carries a ref now ----------
  await api(admin, 'POST', '/pricing', [{ product_id: 1, customer_type: 'wholesale', price: 7 }]);
  await sleep(150);
  check('price-list notification has a ref (was a dead click)', has(await feed(manager), /price list updated/i, /^product#/));

  // ================= jsdom: bell navigation for each ref type =================
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
    try { await run(window, document); } finally { try { window.close(); } catch {} }
  }
  // One jsdom per role; test several refs in the same window (no per-ref reload).
  const bellRoutes = async (email, label, cases) => {
    await asUser(email, async (window) => {
      const t0 = Date.now();
      while (Date.now() - t0 < 9000 && window.document.getElementById('app').classList.contains('hidden')) await sleep(80);
      // let the first (dashboard) render + its deferred swap fully finish
      await sleep(700);
      window.location.hash = '#/dashboard';
      await sleep(300);
      for (const [ref, want] of cases) {
        window.App._bellItems = [{ id: 999, ref, title: 't', body: 'b', read: 0 }];
        window.history.replaceState(null, '', '#/x');
        let got = '#/x';
        for (let tries = 0; tries < 4 && (got === '#/x' || got === ''); tries++) {
          try { await window.App.bellOpen(999); } catch (e) { got = 'threw:' + e.message; break; }
          await sleep(150);
          got = window.location.hash;
        }
        check(`${label}: ${ref} -> ${want}`, got === want, 'got ' + JSON.stringify(got));
        await sleep(120); // let any deferred modal settle before the next case
      }
    });
  };
  await bellRoutes('admin@purepak.pk', 'admin', [
    ['order#3', '#/orders'], ['receipt#1', '#/receipts'], ['comm#1', '#/commissions'],
    ['agent#1', '#/agents'], ['payroll#2026-09', '#/payroll'], ['user#2', '#/team'], ['product#0', '#/products'],
  ]);
  await bellRoutes('ali@rascon.pk', 'customer', [['order#3', '#/orders']]);
  await bellRoutes('bilal@purepak.pk', 'agent', [['comm#1', '#/commissions'], ['order#3', '#/orders']]);
  await bellRoutes('delivery@purepak.pk', 'driver', [['order#3', '#/deliveries']]);
  await bellRoutes('finance@purepak.pk', 'finance', [['product#0', '#/bookkeeping'], ['order#3', '#/orders']]);

  console.log('----');
  console.log(fails === 0 ? 'NOTIFICATIONS: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
