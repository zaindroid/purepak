'use strict';
// Agents & Commissions used to be two separate nav pages for admin/manager/
// finance even though they're both views onto the same data. Verifies the
// merge: one page shows the roster AND the ledger, "+ Add agent"/"Mark paid"
// are gated correctly per role, and the agent role's own "My commission"
// (ledger-only, no roster) is untouched.
const { JSDOM } = require('jsdom');
const { readFileSync } = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4310';
const PW = 'purepak123';
const W = path.join(__dirname, '..', 'web');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, extra = '') => { if (!ok) { fails++; console.log('FAIL', n, extra); } else console.log('ok  ', n); };

async function asUser(email, run) {
  let html = readFileSync(path.join(__dirname, '..', 'web', 'index.html'), 'utf8')
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
  await sleep(500);
  try { await run(window, document); } finally { try { window.close(); } catch {} }
}

(async () => {
  // ---------- admin: merged page ----------
  await asUser('admin@purepak.pk', async (window, document) => {
    window.location.hash = '#/agents';
    await sleep(700);
    const html = document.getElementById('view').innerHTML;
    check('admin: page title is the merged one', /Agents\s*&amp;\s*commissions/.test(html), html.slice(0, 120));
    check('admin: agent roster present (team-row)', document.querySelectorAll('.team-row').length > 0);
    check('admin: commission ledger table present', /Commission ledger/.test(html) && document.querySelector('table.tbl'));
    check('admin: "+ Add agent" present', !!document.querySelector('[data-act="new-agent"]'));
    check('admin: rate input present on roster rows', !!document.querySelector('[data-act="agent-save"]'));
    const markPaidBtns = document.querySelectorAll('[data-act="settle-commission"]');
    check('admin: "Mark paid" present on accrued rows', markPaidBtns.length > 0);
    // the old separate nav item should be gone
    const navLabels = [...document.querySelectorAll('#nav a')].map(a => a.textContent.trim());
    check('admin: nav has no separate "Commissions" item', !navLabels.includes('Commissions'));
    check('admin: nav has one "Agents & commissions" item', navLabels.some(l => /Agents.*commissions/i.test(l)));
  });

  // ---------- finance: merged page too, same gating ----------
  await asUser('finance@purepak.pk', async (window, document) => {
    window.location.hash = '#/agents';
    await sleep(700);
    check('finance: agent roster present', document.querySelectorAll('.team-row').length > 0);
    check('finance: commission ledger present', !!document.querySelector('table.tbl'));
    check('finance: "Mark paid" available to finance', document.querySelectorAll('[data-act="settle-commission"]').length > 0);
    const navLabels = [...document.querySelectorAll('#nav a')].map(a => a.textContent.trim());
    check('finance: nav has no separate "Agent dues" item', !navLabels.some(l => /Agent dues/i.test(l)));
  });

  // ---------- agent role: unaffected, ledger-only, own data ----------
  await asUser('bilal@purepak.pk', async (window, document) => {
    window.location.hash = '#/commissions';
    await sleep(700);
    const html = document.getElementById('view').innerHTML;
    check('agent: still lands on their own ledger', /Commissions/.test(html));
    check('agent: no agent roster on their page', document.querySelectorAll('.team-row').length === 0);
    check('agent: no "+ Add agent" button', !document.querySelector('[data-act="new-agent"]'));
    check('agent: cannot mark their own commission paid', !document.querySelector('[data-act="settle-commission"]'));
    const navLabels = [...document.querySelectorAll('#nav a')].map(a => a.textContent.trim());
    check('agent: nav still has "My commission"', navLabels.some(l => /My commission/i.test(l)));
  });

  console.log('----');
  console.log(fails === 0 ? 'AGENTS+COMMISSIONS MERGE: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
