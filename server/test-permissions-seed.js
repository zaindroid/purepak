'use strict';
process.env.PUREPAK_DATA_DIR = require('os').tmpdir() + '/purepak-test-' + Date.now();
const { init } = require('./db');
const { db } = init();
const createPermissions = require('./permissions');
const perms = createPermissions(db, { httpError: (c, m) => Object.assign(new Error(m), { statusCode: c }), audit: () => {} });
let fails = 0;
function check(name, cond, extra = '') { if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name); }

check('admin sees everything by bypass', perms.canAccessPage('admin', 'team') && perms.canAccessPage('admin', 'backups'));
check('manager has team', perms.canAccessPage('manager', 'team'));
check('manager lacks customers', !perms.canAccessPage('manager', 'customers'));
check('employee lacks orders (the known dead nav link)', !perms.canAccessPage('employee', 'orders'));
check('employee has email', perms.canAccessPage('employee', 'email'));
check('customer has home/orders/profile', perms.canAccessPage('customer', 'home') && perms.canAccessPage('customer', 'orders') && perms.canAccessPage('customer', 'profile'));
check('unseeded combo defaults to false', !perms.canAccessPage('shop_manager', 'payroll'));
check('unknown role defaults to false, not throws', !perms.canAccessPage('nonexistent_role', 'orders'));

// setPermissionsGrid: reject a save that would zero out a role
const grid = perms.getPermissionsGrid();
const zeroed = JSON.parse(JSON.stringify(grid));
for (const p of perms.PAGE_KEYS) zeroed.finance[p] = false;
let threw = false;
try { perms.setPermissionsGrid(zeroed, { id: 1, name: 'Test Admin' }); } catch (e) { threw = e.statusCode === 400; }
check('save rejected when it would zero out a role', threw);
check('rejected save did not persist', perms.canAccessPage('finance', 'orders'));

// a grant actually grants
const granted = JSON.parse(JSON.stringify(grid));
granted.shop_manager.payroll = true;
perms.setPermissionsGrid(granted, { id: 1, name: 'Test Admin' });
check('granting shop_manager payroll takes effect immediately', perms.canAccessPage('shop_manager', 'payroll'));

// a submitted grid can never touch admin, even if the caller tries
const withAdminKey = JSON.parse(JSON.stringify(granted));
withAdminKey.admin = Object.fromEntries(perms.PAGE_KEYS.map(p => [p, false]));
perms.setPermissionsGrid(withAdminKey, { id: 1, name: 'Test Admin' });
check('an admin key in the payload has zero effect on admin access', perms.canAccessPage('admin', 'team') && perms.canAccessPage('admin', 'backups'));

console.log(fails ? `${fails} FAILURES` : 'all passed');
process.exit(fails ? 1 : 0);
