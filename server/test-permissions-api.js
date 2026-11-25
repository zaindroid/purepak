'use strict';
// e2e for GET/PUT /api/permissions. Needs a running dev server; logs in as the
// seeded TEST_ACCOUNTS (requires PUREPAK_TEST_PASSWORD on that server).
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
for (const role of ['admin', 'finance', 'shop_manager']) {
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

// GET as admin
let r = await api('GET', '/api/permissions', { token: T.admin });
check('GET as admin -> 200', r.status === 200, JSON.stringify(r.data));
const grid = r.data?.grid || {};
check('grid has 8 non-admin roles', Object.keys(grid).length === 8, 'roles=' + Object.keys(grid).length);
check('pages has 21 keys', Array.isArray(r.data?.pages) && r.data.pages.length === 21, 'pages=' + r.data?.pages?.length);

// GET / PUT as finance -> 403
r = await api('GET', '/api/permissions', { token: T.finance });
check('GET as finance -> 403', r.status === 403, 'status=' + r.status);
r = await api('PUT', '/api/permissions', { token: T.finance, body: { grid } });
check('PUT as finance -> 403', r.status === 403, 'status=' + r.status);

// idempotent save as admin
r = await api('PUT', '/api/permissions', { token: T.admin, body: { grid } });
check('PUT as admin, unchanged grid -> 200', r.status === 200 && r.data?.ok === true, JSON.stringify(r.data));

// unknown page key -> 400
const bogus = JSON.parse(JSON.stringify(grid));
bogus.finance.not_a_page = true;
r = await api('PUT', '/api/permissions', { token: T.admin, body: { grid: bogus } });
check('PUT with unknown page -> 400', r.status === 400, 'status=' + r.status);

// zero out shop_manager -> 400 and nothing persisted
const before = await api('GET', '/api/permissions', { token: T.admin });
const zeroed = JSON.parse(JSON.stringify(grid));
for (const p of Object.keys(zeroed.shop_manager)) zeroed.shop_manager[p] = false;
r = await api('PUT', '/api/permissions', { token: T.admin, body: { grid: zeroed } });
check('PUT zeroing shop_manager -> 400', r.status === 400, 'status=' + r.status + ' ' + JSON.stringify(r.data));
const after = await api('GET', '/api/permissions', { token: T.admin });
check('rejected save did not persist', JSON.stringify(after.data?.grid?.shop_manager) === JSON.stringify(before.data?.grid?.shop_manager));

// grant shop_manager payroll -> 200, round-trips
const granted = JSON.parse(JSON.stringify(grid));
granted.shop_manager.payroll = true;
r = await api('PUT', '/api/permissions', { token: T.admin, body: { grid: granted } });
check('PUT granting shop_manager payroll -> 200', r.status === 200, 'status=' + r.status);
r = await api('GET', '/api/permissions', { token: T.admin });
check('grid round-trips shop_manager.payroll === true', r.data?.grid?.shop_manager?.payroll === true);

console.log(fails ? `\n${fails} FAILED` : '\nALL CHECKS PASSED');
process.exit(fails ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
