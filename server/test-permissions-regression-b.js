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
  // delivery is allowed by today's hardcoded role array but has no
  // 'dashboard' nav entry (web/views.js navFor()) and no frontend consumer
  // at all — per Task 1's seed table it is NOT seeded for 'dashboard'. This
  // block checks TODAY'S actual 200 for delivery pre-conversion; a separate
  // post-conversion block (run after Step 3) flips the expectation to 403 —
  // this is the one place this task deliberately tightens an
  // already-shipped 200 into a 403, verified inert (no page calls
  // API.kpis() as delivery).
  //
  // customer is DIFFERENT and is handled separately below, not in this
  // branch: GET /kpis branches by role for data reasons (same dual-purpose
  // shape as agent-prices/commissions/payment-methods) — the customer
  // branch returns a self-scoped order/spend/due summary, the same kind of
  // own-data view as /profile or /home, which the plan exempts from any
  // backend page gate. web/views.js calls API.kpis() for a customer from
  // viewCustomerHome (no .catch — a 403 there would break the whole page)
  // and from viewOrders's customer branch (silently defaults `due` to 0 on
  // error, which would wrongly show a customer who owes money as "all
  // paid"). So customer must stay 200 for GET /kpis both before AND after
  // the conversion — the server handler returns the customer's self-scoped
  // summary before the permissions.requirePage('dashboard') gate even runs.
  for (const role of ['admin', 'manager', 'finance', 'agent']) {
    const r = await api('GET', '/api/kpis', { token: T[role] });
    check(`GET /api/kpis as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  for (const role of ['shop_manager', 'employee', 'labour']) {
    const r = await api('GET', '/api/kpis', { token: T[role] });
    check(`GET /api/kpis as ${role} -> 403`, r.status === 403, 'status=' + r.status);
  }
  {
    // customer: always 200, pre- and post-conversion (self-scoped branch,
    // never gated by 'dashboard' — see comment block above)
    const r = await api('GET', '/api/kpis', { token: T.customer });
    check(`GET /api/kpis as customer -> 200 (self-scoped branch, never gated)`, r.status === 200, 'status=' + r.status);
  }
  if (!process.env.PP3B_POST) {
    // pre-conversion baseline only
    const r = await api('GET', '/api/kpis', { token: T.delivery });
    check(`[pre] GET /api/kpis as delivery -> 200 (today's known-wider-than-seed case)`, r.status === 200, 'status=' + r.status);
  } else {
    // post-conversion: deliberate, documented tightening (see Step 3/4) —
    // verified inert: delivery has zero kpis consumers in web/views.js
    const r = await api('GET', '/api/kpis', { token: T.delivery });
    check(`[post] GET /api/kpis as delivery -> 403 (intentional tightening: no 'dashboard' nav entry, not seeded, no frontend consumer)`, r.status === 403, 'status=' + r.status);
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

  // ---- GET /api/receipts/:id (the receipt-image route): gated the same way as the list route ----
  // Create a receipt with an image via the API first (demo seed data has no
  // receipt rows), then confirm the image route is gated by 'receipts' too
  // (it uses the same `user || tokenDerivedUser` resolution as before —
  // only the role-array check was swapped for requirePage).
  {
    const fakeImage = 'A'.repeat(1336); // >=1000 chars, base64-charset, length%4===0
    const created = await api('POST', '/api/receipts', {
      token: T.admin,
      body: { kind: 'expense', image: fakeImage, filename: 'test-receipt.jpg', mimetype: 'image/jpeg', amount: 10 },
    });
    check('POST /api/receipts as admin -> 201 (setup for image-route test)', created.status === 201, 'status=' + created.status);
    const receiptId = created.data && created.data.id;
    if (receiptId) {
      const r1 = await api('GET', `/api/receipts/${receiptId}`, { token: T.finance });
      check(`GET /api/receipts/${receiptId} (image) as finance -> 200`, r1.status === 200, 'status=' + r1.status);
      const r2 = await api('GET', `/api/receipts/${receiptId}`, { token: T.shop_manager });
      check(`GET /api/receipts/${receiptId} (image) as shop_manager -> 403`, r2.status === 403, 'status=' + r2.status);
    } else {
      check('GET /api/receipts/:id (image) gating — skipped, no receipt id from setup', false, JSON.stringify(created.data));
    }
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
  // Pre-conversion baseline for all 9 roles.
  //
  // An earlier version of this task found that the brief's claim "'email'
  // is seeded true for every role" was false for 'customer' (Task 1's seed
  // table had customer: ['home','orders','profile'], no 'email'), which
  // would have newly 403'd customer on these three routes after adding the
  // gate — a real regression against the plan's unconditional "seed email
  // = true for every role (preserves today's behavior exactly)" constraint,
  // not an intentional tightening like the kpis/dashboard case. That was a
  // seed-data bug, fixed directly in server/db.js (customer now includes
  // 'email'), not worked around here. So post-conversion (PP3B_POST=1),
  // this now stays exactly the same for all 9 roles, customer included —
  // no role-specific branching needed any more.
  const ALL_ROLES = ['admin', 'manager', 'shop_manager', 'finance', 'agent', 'delivery', 'employee', 'labour', 'customer'];
  for (const role of ALL_ROLES) {
    const r = await api('GET', '/api/mailbox', { token: T[role] });
    check(`GET /api/mailbox as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  for (const role of ALL_ROLES) {
    const r = await api('GET', '/api/mailbox/messages', { token: T[role] });
    check(`GET /api/mailbox/messages as ${role} -> 200 or 404 (no mailbox assigned)`, r.status === 200 || r.status === 404, 'status=' + r.status);
  }
  for (const role of ALL_ROLES) {
    const r = await api('GET', '/api/mailbox/messages/1', { token: T[role] });
    check(`GET /api/mailbox/messages/1 as ${role} -> 200 or 404 (no mailbox assigned)`, r.status === 200 || r.status === 404, 'status=' + r.status);
  }

  console.log(fails ? `\n${fails} FAILED` : '\nALL CHECKS PASSED');
  process.exit(fails ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
