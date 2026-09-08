'use strict';
const { JSDOM } = require('jsdom');
const { readFileSync } = require('fs');
const path = require('path');

const BASE = 'http://localhost:4310';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let fails = 0;
function check(name, cond, extra = '') {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name);
}
const nodeFetch = globalThis.fetch;

(async () => {
  let html = readFileSync(path.join(__dirname, '..', 'web', 'index.html'), 'utf8');
  // strip external resources; we eval the scripts ourselves
  html = html.replace(/<script src="[^"]*"><\/script>/g, '');
  html = html.replace(/<link[^>]*>/g, '');

  const dom = new JSDOM(html, { url: BASE + '/', runScripts: 'dangerously', pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;

  window.confirm = () => true;
  window.alert = () => {};
  window.scrollTo = () => {};
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, addEventListener() {}, removeEventListener() {} }));
  window.fetch = (u, o) => {
    const abs = String(u).startsWith('http') ? u : BASE + String(u);
    return nodeFetch(abs, o);
  };

  const combined = ['api.js', 'views.js', 'app.js'].map(f =>
    readFileSync(path.join(__dirname, '..', 'web', f), 'utf8')).join('\n;\n');
  window.eval(combined);
  await sleep(700);

  // wait for a DOM predicate, polling every 80ms
  function waitFor(pred, label, ms = 9000) {
    return new Promise((resolve, reject) => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        let ok = false;
        try { ok = pred(); } catch { ok = false; }
        if (ok) { clearInterval(iv); resolve(); }
        else if (Date.now() - t0 > ms) { clearInterval(iv); reject(new Error(label)); }
      }, 80);
    });
  }
  const loggedIn = () => document.getElementById('login').classList.contains('hidden')
    && !document.getElementById('app').classList.contains('hidden');

  async function logout() {
    document.getElementById('topLogout').click();
    await waitFor(() => !document.getElementById('login').classList.contains('hidden'), 'logout timeout');
  }

  async function login(email) {
    // don't submit until the login form is actually on screen
    await waitFor(() => !document.getElementById('login').classList.contains('hidden'), 'login form never shown for ' + email);
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPass').value = 'purepak123';
    try { document.getElementById('loginForm').requestSubmit(); }
    catch { document.getElementById('loginForm').dispatchEvent(new window.Event('submit', { cancelable: true, bubbles: true })); }
    // resolve only once the app view is actually up (login POST + enter() done)
    await waitFor(loggedIn, 'login timeout ' + email);
  }

  const roleRoutes = {
    admin: ['dashboard', 'orders', 'deliveries', 'route', 'customers', 'agents', 'commissions', 'bookkeeping', 'receipts', 'team', 'payroll', 'products'],
    finance: ['dashboard', 'bookkeeping', 'commissions', 'orders', 'receipts', 'payroll', 'agents'],
    agent: ['dashboard', 'orders', 'commissions', 'receipts'],
    delivery: ['route', 'deliveries'],
    customer: ['home', 'orders'],
  };
  const emails = { admin: 'admin@purepak.pk', finance: 'finance@purepak.pk', agent: 'bilal@purepak.pk', delivery: 'delivery@purepak.pk', customer: 'ali@rascon.pk' };
  const markers = {
    dashboard: ['Dashboard', 'Finance', 'Hello'],
    orders: ['<table'],
    deliveries: ['<table'],
    customers: ['team-row'],
    agents: ['team-row'],
    commissions: ['<table'],
    bookkeeping: ['<table'],
    products: ['Price list by customer type'],
    route: ['Smart route'],
    receipts: ['Receipts'],
    team: ['Team', 'team-row'],
    payroll: ['Payroll', 'pay-row'],
    home: ['Quick order'],
  };

  let firstLogin = true;
  for (const role of ['admin', 'finance', 'agent', 'delivery', 'customer']) {
    try {
      if (!firstLogin) await logout();
      firstLogin = false;
      await login(emails[role]);
      check('login ' + role, true);
    } catch (e) { check('login ' + role, false, e.message); continue; }
    await sleep(600);
    for (const route of roleRoutes[role]) {
      window.location.hash = '#/' + route;
      await sleep(800);
      const view = document.getElementById('view');
      const txt = view ? view.innerHTML : '';
      const m = markers[route] || ['<table'];
      const ok = txt.length > 150 && m.some(x => txt.includes(x)) && !txt.includes('No view for');
      check('render ' + role + '/' + route, ok, 'len=' + txt.length + (ok ? '' : ' :: ' + txt.slice(0, 250)));
    }
  }

  // admin interactive: new order modal
  window.location.hash = '#/dashboard';
  await sleep(800);
  let btn = document.querySelector('[data-act="new-order"]');
  check('new-order button present', !!btn);
  if (btn) {
    btn.click();
    await sleep(900);
    check('order modal open', !!document.getElementById('ocSubmit'));
    const q = document.querySelector('[data-itemqty]');
    if (q) { q.value = 2; q.dispatchEvent(new window.Event('input', { bubbles: true })); }
    await sleep(150);
    document.getElementById('ocSubmit').click();
    await sleep(1500);
    const toast = document.querySelector('.toast');
    check('order created toast', !!toast && /placed/i.test(toast.textContent), toast ? toast.textContent : 'no toast');
  }

  // driver interactive: start trip + deliver
  document.getElementById('topLogout').click(); await sleep(400);
  await login('delivery@purepak.pk'); await sleep(700);
  window.location.hash = '#/route'; await sleep(800);
  let ofdBtn = document.querySelector('[data-act="del-ofd"]');
  check('driver start-trip button', !!ofdBtn);
  if (ofdBtn) {
    ofdBtn.click(); await sleep(1000);
    const doneBtn = document.querySelector('[data-act="del-done"]');
    check('driver delivered button appears', !!doneBtn);
    if (doneBtn) { doneBtn.click(); await sleep(1000); }
    check('driver toast', !!document.querySelector('.toast'), document.querySelector('.toast')?.textContent || '');
  }

  console.log('----');
  console.log(fails === 0 ? 'WEB SMOKE: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('SMOKE CRASH', e); process.exit(2); });
