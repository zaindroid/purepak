'use strict';
const PAGE_KEYS = ['dashboard','orders','deliveries','route','vehicle-logs','production',
  'customers','agents','commissions','offers','bookkeeping','receipts','payments','payroll',
  'audit','products','team','email','backups','profile','home'];
const ROLES = ['manager','shop_manager','finance','agent','delivery','employee','labour','customer'];

module.exports = function createPermissions(db, { httpError, audit }) {
  let cache = new Set(); // "role:page"
  function reload() {
    cache = new Set(db.prepare('SELECT role, page FROM role_permissions WHERE enabled=1').all()
      .map(r => r.role + ':' + r.page));
  }
  reload();
  function canAccessPage(role, page) {
    return role === 'admin' || cache.has(role + ':' + page);
  }
  function requirePage(user, page) {
    if (!user || !canAccessPage(user.role, page)) throw httpError(403, 'Forbidden: no access to ' + page);
  }
  function getPermissionsGrid() {
    const grid = {};
    for (const role of ROLES) grid[role] = Object.fromEntries(PAGE_KEYS.map(p => [p, canAccessPage(role, p)]));
    return grid;
  }
  function setPermissionsGrid(grid, actorUser) {
    const before = getPermissionsGrid();
    for (const role of ROLES) {
      const pages = grid[role] || {};
      if (!PAGE_KEYS.some(p => pages[p])) {
        throw httpError(400, `${role} must keep at least one page enabled`);
      }
    }
    const del = db.prepare('DELETE FROM role_permissions WHERE role=?');
    const ins = db.prepare('INSERT INTO role_permissions(role,page,enabled) VALUES (?,?,1)');
    for (const role of ROLES) {
      del.run(role);
      for (const p of PAGE_KEYS) if (grid[role] && grid[role][p]) ins.run(role, p);
    }
    reload();
    audit(actorUser, 'permissions.update', 'role_permissions', null,
      `${actorUser.name} updated role permissions`, before, getPermissionsGrid());
    return { ok: true };
  }
  return { canAccessPage, requirePage, getPermissionsGrid, setPermissionsGrid, PAGE_KEYS, reload };
};
