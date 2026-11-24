'use strict';
// Regression test for Task 3b: converting hardcoded requireRole(...)/canManage
// GET checks on dashboard(kpis)/bookkeeping/payroll/receipts/audit/backups/
// offers/team to permissions.requirePage / permissions.canAccessPage, and
// adding a brand-new 'email' gate to the mailbox-read routes that have no
// role check at all today.
//
// Written and first run BEFORE the conversion (against the then-current
// requireRole/canManage-based code) to describe expected per-role access for
// each endpoint, matching Task 1's seed table (server/db.js SEED in the
// role_permissions migration). Re-run unchanged after the conversion to
// confirm requirePage/canAccessPage produce the same results.
//
// Needs a running dev server; logs in as the seeded TEST_ACCOUNTS (requires
// PUREPAK_TEST_PASSWORD on that server, and PUREPAK_DEMO=1 for demo data).
const BASE = 'http://localhost:' + (process.env.PORT || 43995);
const { TEST_ACCOUNTS } = require('./db');
const PW = process.env.PUREPAK_TEST_PASSWORD;

async function api(method, p, { body, token } = {}) {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data; try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

async function main() {
  const T = {};
  for (const role of ['admin', 'manager', 'shop_manager', 'finance', 'agent', 'delivery', 'employee', 'labour', 'customer']) {
    const email = TEST_ACCOUNTS.find(a => a[2] === role)[1];
    const r = await api('POST', '/api/auth/login', { body: { email, password: PW } });
    if (r.status !== 200) { console.log('LOGIN FAIL', email, r.status, r.data); process.exit(1); }
    T[role] = r.data.token;
    console.log('login ok:', email, '->', r.data.user.role);
  }

  let fails = 0;
  function check(name, cond, extra = '') {
    if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name);
  }

  // ---- GET /api/kpis: 200 for admin/manager/finance/agent (today), 403 for shop_manager/employee/labour ----
  // delivery and customer are allowed by today's role array but have no
  // 'dashboard' nav entry (web/views.js navFor()) — per Task 1's seed table
  // they are NOT seeded for 'dashboard'. This block checks TODAY'S actual
  // 200 for them; a separate post-conversion block (run after Step 3) flips
  // the expectation to 403 for these two — this is the one place this task
  // deliberately tightens an already-shipped 200 into a 403.
  for (const role of ['admin', 'manager', 'finance', 'agent']) {
    const r = await api('GET', '/api/kpis', { token: T[role] });
    check(`GET /api/kpis as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  for (const role of ['shop_manager', 'employee', 'labour']) {
    const r = await api('GET', '/api/kpis', { token: T[role] });
    check(`GET /api/kpis as ${role} -> 403`, r.status === 403, 'status=' + r.status);
  }
  if (!process.env.PP3B_POST) {
    // pre-conversion baseline only
    for (const role of ['delivery', 'customer']) {
      const r = await api('GET', '/api/kpis', { token: T[role] });
      check(`[pre] GET /api/kpis as ${role} -> 200 (today's known-wider-than-seed case)`, r.status === 200, 'status=' + r.status);
    }
  } else {
    // post-conversion: deliberate, documented tightening (see Step 3/4)
    for (const role of ['delivery', 'customer']) {
      const r = await api('GET', '/api/kpis', { token: T[role] });
      check(`[post] GET /api/kpis as ${role} -> 403 (intentional tightening: no 'dashboard' nav entry, not seeded)`, r.status === 403, 'status=' + r.status);
    }
  }

  // ---- GET /api/ledger, /api/ledger/summary, /api/analytics/monthly, /api/analytics/top-customers: 200 for admin/manager/finance, 403 for agent ----
  for (const path of ['/api/ledger', '/api/ledger/summary', '/api/analytics/monthly', '/api/analytics/top-customers']) {
    for (const role of ['admin', 'manager', 'finance']) {
      const r = await api('GET', path, { token: T[role] });
      check(`GET ${path} as ${role} -> 200`, r.status === 200, 'status=' + r.status);
    }
    const r = await api('GET', path, { token: T.agent });
    check(`GET ${path} as agent -> 403`, r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/payroll: 200 for admin/manager/finance, 403 for shop_manager ----
  for (const role of ['admin', 'manager', 'finance']) {
    const r = await api('GET', '/api/payroll', { token: T[role] });
    check(`GET /api/payroll as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  {
    const r = await api('GET', '/api/payroll', { token: T.shop_manager });
    check('GET /api/payroll as shop_manager -> 403', r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/receipts: 200 for admin/manager/finance/agent/delivery, 403 for shop_manager ----
  for (const role of ['admin', 'manager', 'finance', 'agent', 'delivery']) {
    const r = await api('GET', '/api/receipts', { token: T[role] });
    check(`GET /api/receipts as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  {
    const r = await api('GET', '/api/receipts', { token: T.shop_manager });
    check('GET /api/receipts as shop_manager -> 403', r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/audit, /api/audit/verify: 200 for admin/manager, 403 for finance ----
  for (const path of ['/api/audit', '/api/audit/verify']) {
    for (const role of ['admin', 'manager']) {
      const r = await api('GET', path, { token: T[role] });
      check(`GET ${path} as ${role} -> 200`, r.status === 200, 'status=' + r.status);
    }
    const r = await api('GET', path, { token: T.finance });
    check(`GET ${path} as finance -> 403`, r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/backup/list: 200 for admin/manager, 403 for finance ----
  for (const role of ['admin', 'manager']) {
    const r = await api('GET', '/api/backup/list', { token: T[role] });
    check(`GET /api/backup/list as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  {
    const r = await api('GET', '/api/backup/list', { token: T.finance });
    check('GET /api/backup/list as finance -> 403', r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/offers: 200 for admin/manager, 403 for finance ----
  for (const role of ['admin', 'manager']) {
    const r = await api('GET', '/api/offers', { token: T[role] });
    check(`GET /api/offers as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  {
    const r = await api('GET', '/api/offers', { token: T.finance });
    check('GET /api/offers as finance -> 403', r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/users, /api/cpanel/emails, /api/mailboxes: 200 for admin/manager, 403 for finance ----
  for (const path of ['/api/users', '/api/cpanel/emails', '/api/mailboxes']) {
    for (const role of ['admin', 'manager']) {
      const r = await api('GET', path, { token: T[role] });
      check(`GET ${path} as ${role} -> 200`, r.status === 200 || (path === '/api/cpanel/emails' && r.status === 502), 'status=' + r.status);
    }
    const r = await api('GET', path, { token: T.finance });
    check(`GET ${path} as finance -> 403`, r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/mailbox, /api/mailbox/messages, /api/mailbox/messages/:id: 200 for every role today (no gate exists yet) ----
  // Pre-conversion baseline for all 9 roles. Post-conversion (PP3B_POST=1),
  // this stays 200 for 8 of the 9 roles since 'email' is seeded true for
  // manager/shop_manager/finance/agent/delivery/employee/labour (and admin
  // always bypasses) — EXCEPT customer, which is NOT seeded 'email' in
  // Task 1's seed table and has no 'email' nav entry either (web/views.js
  // navFor().customer has only home/orders/profile). This is the SAME
  // "backend wider than seed" pattern the brief documents for kpis, found
  // independently here on the brand-new email gate: customer goes from a
  // real pre-change 200 to 403 after Step 3. See the task report for detail.
  const ALL_ROLES = ['admin', 'manager', 'shop_manager', 'finance', 'agent', 'delivery', 'employee', 'labour', 'customer'];
  for (const role of ALL_ROLES) {
    const r = await api('GET', '/api/mailbox', { token: T[role] });
    if (!process.env.PP3B_POST || role !== 'customer') {
      check(`GET /api/mailbox as ${role} -> 200`, r.status === 200, 'status=' + r.status);
    } else {
      check(`[post] GET /api/mailbox as customer -> 403 (not seeded 'email', no nav entry)`, r.status === 403, 'status=' + r.status);
    }
  }
  for (const role of ALL_ROLES) {
    const r = await api('GET', '/api/mailbox/messages', { token: T[role] });
    if (!process.env.PP3B_POST || role !== 'customer') {
      check(`GET /api/mailbox/messages as ${role} -> 200 or 404 (no mailbox assigned)`, r.status === 200 || r.status === 404, 'status=' + r.status);
    } else {
      check(`[post] GET /api/mailbox/messages as customer -> 403 (not seeded 'email', no nav entry)`, r.status === 403, 'status=' + r.status);
    }
  }
  for (const role of ALL_ROLES) {
    const r = await api('GET', '/api/mailbox/messages/1', { token: T[role] });
    if (!process.env.PP3B_POST || role !== 'customer') {
      check(`GET /api/mailbox/messages/1 as ${role} -> 200 or 404 (no mailbox assigned)`, r.status === 200 || r.status === 404, 'status=' + r.status);
    } else {
      check(`[post] GET /api/mailbox/messages/1 as customer -> 403 (not seeded 'email', no nav entry)`, r.status === 403, 'status=' + r.status);
    }
  }

  console.log(fails ? `\n${fails} FAILED` : '\nALL CHECKS PASSED');
  process.exit(fails ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
