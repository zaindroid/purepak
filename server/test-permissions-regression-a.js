'use strict';
// Regression test for Task 3a: converting hardcoded requireRole(...) GET
// checks on orders/deliveries/route/vehicle-logs/production/customers/
// agents/commissions/agent-prices/payment-methods to permissions.requirePage.
//
// Written and first run BEFORE the conversion (against the then-current
// requireRole-based code) to describe expected per-role access for each
// endpoint, matching Task 1's seed table (server/db.js SEED in the
// role_permissions migration). Re-run unchanged after the conversion to
// confirm requirePage produces the same results.
//
// Needs a running dev server; logs in as the seeded TEST_ACCOUNTS (requires
// PUREPAK_TEST_PASSWORD on that server, and PUREPAK_DEMO=1 for demo data
// such as an agents row to test agent-prices against).
const BASE = 'http://localhost:' + (process.env.PORT || 4310);
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

  // need a real agent id to test agent-prices as a non-agent role (finance)
  let r = await api('GET', '/api/agents', { token: T.admin });
  const agentId = Array.isArray(r.data) && r.data[0] && r.data[0].id;
  if (!agentId) { console.log('FATAL: no agent row found to test agent-prices against'); process.exit(1); }

  // ---- GET /api/orders: 200 for admin/manager/shop_manager/agent/finance/customer, 403 for employee and labour ----
  for (const role of ['admin', 'manager', 'shop_manager', 'agent', 'finance', 'customer']) {
    r = await api('GET', '/api/orders', { token: T[role] });
    check(`GET /api/orders as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  for (const role of ['employee', 'labour']) {
    r = await api('GET', '/api/orders', { token: T[role] });
    check(`GET /api/orders as ${role} -> 403`, r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/deliveries: 200 for admin/manager/shop_manager/delivery, 403 for finance and customer ----
  for (const role of ['admin', 'manager', 'shop_manager', 'delivery']) {
    r = await api('GET', '/api/deliveries', { token: T[role] });
    check(`GET /api/deliveries as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  for (const role of ['finance', 'customer']) {
    r = await api('GET', '/api/deliveries', { token: T[role] });
    check(`GET /api/deliveries as ${role} -> 403`, r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/route-plan: 200 for admin/manager/delivery, 403 for shop_manager ----
  for (const role of ['admin', 'manager', 'delivery']) {
    r = await api('GET', '/api/route-plan', { token: T[role] });
    check(`GET /api/route-plan as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  r = await api('GET', '/api/route-plan', { token: T.shop_manager });
  check('GET /api/route-plan as shop_manager -> 403', r.status === 403, 'status=' + r.status);

  // ---- GET /api/vehicle-logs: 200 for admin/manager/delivery, 403 for shop_manager ----
  for (const role of ['admin', 'manager', 'delivery']) {
    r = await api('GET', '/api/vehicle-logs', { token: T[role] });
    check(`GET /api/vehicle-logs as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  r = await api('GET', '/api/vehicle-logs', { token: T.shop_manager });
  check('GET /api/vehicle-logs as shop_manager -> 403', r.status === 403, 'status=' + r.status);

  // ---- GET /api/production: 200 for admin/manager/labour, 403 for shop_manager ----
  for (const role of ['admin', 'manager', 'labour']) {
    r = await api('GET', '/api/production', { token: T[role] });
    check(`GET /api/production as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  r = await api('GET', '/api/production', { token: T.shop_manager });
  check('GET /api/production as shop_manager -> 403', r.status === 403, 'status=' + r.status);

  // ---- GET /api/customers: 200 for admin/agent/manager/shop_manager (the
  // latter two via the order-creator-pick branch -- they have 'orders', not
  // 'customers' -- see Fix 1 of the final-review fix wave), 403 for finance
  // (has 'orders' too, but isn't one of the roles eligible for that branch)
  // and for employee/labour (have neither 'orders' nor 'customers') ----
  for (const role of ['admin', 'agent', 'manager', 'shop_manager']) {
    r = await api('GET', '/api/customers', { token: T[role] });
    check(`GET /api/customers as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  for (const role of ['finance', 'employee', 'labour']) {
    r = await api('GET', '/api/customers', { token: T[role] });
    check(`GET /api/customers as ${role} -> 403`, r.status === 403, 'status=' + r.status);
  }

  // ---- GET /api/agents: 200 for admin/finance, 403 for manager ----
  for (const role of ['admin', 'finance']) {
    r = await api('GET', '/api/agents', { token: T[role] });
    check(`GET /api/agents as ${role} -> 200`, r.status === 200, 'status=' + r.status);
  }
  r = await api('GET', '/api/agents', { token: T.manager });
  check('GET /api/agents as manager -> 403', r.status === 403, 'status=' + r.status);

  // ---- GET /api/commissions: agent -> 200 (branches to 'commissions'); finance -> 200 (branches to 'agents'); manager -> 403 ----
  r = await api('GET', '/api/commissions', { token: T.agent });
  check('GET /api/commissions as agent -> 200', r.status === 200, 'status=' + r.status);
  r = await api('GET', '/api/commissions', { token: T.finance });
  check('GET /api/commissions as finance -> 200', r.status === 200, 'status=' + r.status);
  r = await api('GET', '/api/commissions', { token: T.manager });
  check('GET /api/commissions as manager -> 403', r.status === 403, 'status=' + r.status);

  // ---- GET /api/agent-prices: agent -> 200 (branches to 'orders'); finance -> 200 (branches to 'agents'); manager -> 403 ----
  r = await api('GET', '/api/agent-prices', { token: T.agent });
  check('GET /api/agent-prices as agent -> 200', r.status === 200, 'status=' + r.status);
  r = await api('GET', '/api/agent-prices?agent_id=' + agentId, { token: T.finance });
  check('GET /api/agent-prices as finance -> 200', r.status === 200, 'status=' + r.status);
  r = await api('GET', '/api/agent-prices?agent_id=' + agentId, { token: T.manager });
  check('GET /api/agent-prices as manager -> 403', r.status === 403, 'status=' + r.status);

  // ---- GET /api/payment-methods: customer -> 200 (branches to 'orders'); manager -> 200 (branches to 'payments'); employee -> 403 (has neither) ----
  r = await api('GET', '/api/payment-methods', { token: T.customer });
  check('GET /api/payment-methods as customer -> 200', r.status === 200, 'status=' + r.status);
  r = await api('GET', '/api/payment-methods', { token: T.manager });
  check('GET /api/payment-methods as manager -> 200', r.status === 200, 'status=' + r.status);
  r = await api('GET', '/api/payment-methods', { token: T.employee });
  check('GET /api/payment-methods as employee -> 403', r.status === 403, 'status=' + r.status);

  // ---- Step 5: a grant actually grants (PUT /api/permissions as admin, then re-check, then revert) ----
  // Uses finance, not shop_manager: shop_manager already reaches GET
  // /api/customers via the order-creator-pick branch (it has 'orders'),
  // so granting it 'customers' wouldn't change its observed status and
  // wouldn't actually exercise the grant path. finance has 'orders' too
  // but is excluded from that branch's eligible-roles list, so it still
  // starts at 403 and a 'customers' grant is what flips it to 200.
  const before = await api('GET', '/api/permissions', { token: T.admin });
  const originalGrid = before.data.grid;
  r = await api('GET', '/api/customers', { token: T.finance });
  check('pre-grant: GET /api/customers as finance -> 403', r.status === 403, 'status=' + r.status);

  const granted = JSON.parse(JSON.stringify(originalGrid));
  granted.finance.customers = true;
  r = await api('PUT', '/api/permissions', { token: T.admin, body: { grid: granted } });
  check('PUT granting finance.customers -> 200', r.status === 200, 'status=' + r.status);

  r = await api('GET', '/api/customers', { token: T.finance });
  check('post-grant: GET /api/customers as finance -> 200', r.status === 200, 'status=' + r.status);

  // revert so the script is repeatable
  r = await api('PUT', '/api/permissions', { token: T.admin, body: { grid: originalGrid } });
  check('PUT reverting grid -> 200', r.status === 200, 'status=' + r.status);

  r = await api('GET', '/api/customers', { token: T.finance });
  check('post-revert: GET /api/customers as finance -> 403', r.status === 403, 'status=' + r.status);

  console.log(fails ? `\n${fails} FAILED` : '\nALL CHECKS PASSED');
  process.exit(fails ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
