# Admin-Configurable Role Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin turn any of PurePak's ~19 portal sections on or off for any role, from a settings screen, with changes taking effect immediately — including granting a role a section it doesn't have today.

**Architecture:** A new `role_permissions` DB table (role, page, enabled) is the single source of truth for "can this role see this page." An in-memory cache backs a `canAccessPage`/`requirePage` check that replaces the *viewing* half of today's hardcoded role checks (the GET-method ones) across the backend; every *creating/editing/deleting* check stays exactly as hardcoded today — this version only makes visibility configurable, not per-action rights. The frontend's nav and page router read the same permission set, fetched at login.

**Tech Stack:** Node's built-in `node:sqlite`, no ORM/framework (matches the rest of the repo); plain Node e2e test scripts in the existing `server/test-*.js` style (no test framework is installed).

**Spec:** `docs/superpowers/specs/2026-11-23-role-permissions-design.md`

## Global Constraints

- 21 page keys, fixed: `dashboard, orders, deliveries, route, vehicle-logs, production, customers, agents, commissions, offers, bookkeeping, receipts, payments, payroll, audit, products, team, email, backups, profile, home`.
- 9 roles, fixed: `admin, manager, shop_manager, finance, agent, delivery, employee, labour, customer`. No role is ever added, removed, or renamed by this feature.
- **Only GET-method role checks are converted** to `requirePage`. Every POST/PATCH/DELETE role check in `server/server.js` is left exactly as it is today, untouched — this is what keeps "grant a role a page" from silently also granting actions on that page.
- `admin` always passes `canAccessPage` — it is never read from or written to `role_permissions`. There is no way to edit admin's own access, by admin or anyone else.
- Saving a permissions grid is rejected (400, nothing persisted) if it would leave any non-admin role with zero `enabled` pages.
- Three endpoints are dual-purpose and must branch their permission check on the caller's own role rather than use one fixed page key:
  - `GET /api/agent-prices`: `requirePage(user, user.role === 'agent' ? 'orders' : 'agents')`
  - `GET /api/commissions`: `requirePage(user, user.role === 'agent' ? 'commissions' : 'agents')`
  - `GET /api/payment-methods`: `requirePage(user, ['admin','manager'].includes(user.role) ? 'payments' : 'orders')`
- `GET /api/products` is **not** converted — its existing role array is already broader than any plausible grant (every role but `employee` needs product/price data for their own flows), so it stays hardcoded as-is. Only the `products` *nav page* (the catalog-management screen) is gated by `requirePage(user, 'products')`, seeded to `admin, manager` — granting it to another role works automatically since the underlying GET is already open to them.
- `profile` and `home` are nav-only gates with no backend endpoint changes — they're intrinsically self-scoped (a user's own record, the storefront landing page) and have no corresponding role-array check today.
- `email` is a genuinely new restriction: today's mailbox routes (`GET /api/mailbox`, `GET /api/mailbox/messages`, `GET /api/mailbox/messages/:id`) have no role check at all (they're ownership-scoped by `assigned_user_id = user.id`), so every role effectively has it. Seed `email = true` for every role on migration (preserves today's behavior exactly) and add `requirePage(user, 'email')` to those three routes so admin can actually turn it off later if they want to.
- `GET /api/settings` (the Gemini/OCR key endpoint) is untouched — it isn't wired to any page in the frontend at all, so there's nothing for this feature to gate.
- Seed data (Task 1) is the exact source of truth for "what a role can see today" — do not re-derive it from `navFor()`/`VIEW` or from `requireRole` arrays directly; the table in Task 1 is already the reconciled result of both.

## Review Focus

- A role with no rows in `role_permissions` (a bug in a future migration, or a malformed save) must **default-deny**, not default-allow — a missing combination is not the same as an explicitly granted one.
- Saving a grid that's identical to the current state must succeed (idempotent save), not get spuriously rejected by the zero-pages check.
- A `PUT /api/permissions` payload that includes an `admin` row (editing it, or omitting it to "disable" it) must have zero effect on admin's access — the server, not just the disabled checkbox in the UI, is the actual boundary.
- Revoking a role's page must take effect for that role's already-logged-in sessions on the very next request, without requiring them to log out and back in — this is the whole point of "edit at any time."
- The three dual-purpose endpoints must give each caller exactly the behavior of the branch matching their own role, not the union of both branches' allowances.

---

## Task 1: Permission table, seed data, and the runtime permission module

**Files:**
- Modify: `server/db.js` — add the `role_permissions` table and its one-time seed inside `migrate(db)`, following the exact pattern already used for `customer_types` at `server/db.js:565-570` (`CREATE TABLE IF NOT EXISTS` + a `SELECT COUNT(*)` guard that only inserts when the table is empty, so an admin's later edits are never overwritten on restart).
- Create: `server/permissions.js` — the runtime module `server.js` calls per-request.
- Test: `server/test-permissions-seed.js` (new, plain Node script, run directly with `node`, no running HTTP server needed — same style as the rest of `server/test-*.js`).

**Interfaces:**
- Produces (used by Tasks 2–4): `require('./permissions')(db)` returns
  `{ canAccessPage(role, page) -> boolean, requirePage(user, page) -> void (throws httpError(403, ...) via the same `httpError` helper `requireRole` already uses, from `server/server.js`), getPermissionsGrid() -> { role: { page: boolean } } for all 8 non-admin roles, setPermissionsGrid(grid, actorUser) -> { ok: true } (validates, persists, reloads the in-memory cache, writes one audit_log entry) }`.
- `PAGE_KEYS` (exported array of the 21 page keys, in the order listed in Global Constraints) is used by Task 2 for validating incoming grid payloads and by Task 4 for rendering the settings grid in a stable order.

- [ ] **Step 1: Add the table + seed to `server/db.js`**

  Add right after the `customer_types` block (`server/db.js:570`):

  ```js
  // role_permissions: which portal pages each role can see — admin-editable
  // at runtime (see server/permissions.js), not touched again by this
  // migration once a row exists for it.
  db.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role TEXT NOT NULL,
      page TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (role, page)
    );
  `);
  const rp = db.prepare('SELECT COUNT(*) AS c FROM role_permissions').get().c;
  if (rp === 0) {
    const insRp = db.prepare('INSERT INTO role_permissions(role,page,enabled) VALUES (?,?,1)');
    const SEED = {
      manager: ['dashboard','orders','deliveries','route','vehicle-logs','production','offers','bookkeeping','receipts','payments','payroll','audit','products','team','email','backups'],
      shop_manager: ['orders','deliveries','email'],
      finance: ['dashboard','bookkeeping','orders','receipts','payroll','agents','email'],
      agent: ['dashboard','orders','customers','commissions','receipts','email'],
      delivery: ['route','deliveries','vehicle-logs','receipts','email'],
      employee: ['profile','email'],
      labour: ['production','email'],
      customer: ['home','orders','profile'],
    };
    for (const [role, pages] of Object.entries(SEED)) for (const page of pages) insRp.run(role, page);
  }
  ```

  Note what's *not* seeded: `employee` does not get `orders` — the frontend nav has always offered it, but every order route's role array has always excluded `employee`, so it 403s today regardless (see the spec's Constraints section). Seeding it would be a real, new privilege grant hidden inside a migration; leaving it out just makes the dead nav link disappear.

- [ ] **Step 2: Write `server/permissions.js`**

  ```js
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
  ```

  `grid[role]` is trusted to only contain keys in `PAGE_KEYS` by the time it reaches `setPermissionsGrid` — Task 2's route does that validation before calling in, so this module doesn't need to re-check it (an unknown key here would just never be read back, since `getPermissionsGrid` only iterates `PAGE_KEYS`).

- [ ] **Step 3: Write the failing seed test**

  `server/test-permissions-seed.js`:
  ```js
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
  ```

- [ ] **Step 4: Run it, confirm it fails**

  Run: `node server/test-permissions-seed.js`
  Expected: FAIL — `Cannot find module './permissions'` (Step 2 not written yet if done out of order) or, once Step 2 exists but Step 1 isn't, a SQLite "no such table: role_permissions" error. Write Step 1 and Step 2 above first, then this step is really "run it once more before touching anything else" to confirm you're starting from a clean failing state — if it already passes, something upstream is wrong.

- [ ] **Step 5: Run it again and confirm it passes**

  Run: `node server/test-permissions-seed.js`
  Expected: every `check` line prints `ok`, final line `all passed`, exit code 0.

- [ ] **Step 6: Commit**

  ```bash
  git add server/db.js server/permissions.js server/test-permissions-seed.js
  git commit -m "Add role_permissions table, seed data, and the runtime permission module"
  ```

---

## Task 2: Admin-only permissions API

**Files:**
- Modify: `server/server.js` — wire up `permissions.js`, add two routes.
- Test: `server/test-permissions-api.js` (new, e2e script against a running dev server — same `fetch`-based style as `server/test-e2e.js`, using `TEST_ACCOUNTS` from `server/db.js` to log in as different roles).

**Interfaces:**
- Consumes: `createPermissions(db, { httpError, audit })` from Task 1 — `httpError` and `audit` already exist in `server/server.js` today (used by every other route); pass them through unchanged.
- Produces: `GET /api/permissions` → `200 { grid: <getPermissionsGrid() output>, pages: PAGE_KEYS }`. `PUT /api/permissions` with body `{ grid }` → `200 { ok: true }` on success, `400` with the validation message on a zero-pages save, `403` for any non-admin caller. Task 4's frontend consumes both exactly as shaped here.

- [ ] **Step 1: Wire the module into `server.js`**

  Near the top where `cpanel = require('./cpanel')` already sits (`server/server.js:9`), add:
  ```js
  const createPermissions = require('./permissions');
  const permissions = createPermissions(db, { httpError, audit });
  ```
  (`httpError` and `audit` are existing functions already defined above this point in the file — check their exact names/signatures in `server/server.js` before wiring, in case either differs slightly from what Task 1 assumed.)

- [ ] **Step 2: Write the failing API test**

  `server/test-permissions-api.js` (abbreviated — follow the login/`api()`/`check()` pattern from `server/test-e2e.js:1-24` exactly, logging in as the admin and finance test accounts from `TEST_ACCOUNTS`):
  ```js
  // GET /api/permissions as admin -> 200, grid has all 8 non-admin roles and 21 pages
  // GET /api/permissions as finance -> 403
  // PUT /api/permissions as finance -> 403
  // PUT /api/permissions as admin with finance's "bookkeeping" flipped true->true (no-op) -> 200 (idempotent save succeeds)
  // PUT /api/permissions as admin zeroing every page for shop_manager -> 400, and a follow-up GET shows shop_manager's pages unchanged (rejected save didn't persist)
  // PUT /api/permissions as admin granting shop_manager "payroll" -> 200, then GET /api/payroll as a shop_manager test login -> no longer 403 for lack-of-role reasons (Task 3 is what actually makes this assertion meaningful end to end — for this task, just confirm the grid round-trips: a follow-up GET /api/permissions shows shop_manager.payroll === true)
  ```

- [ ] **Step 3: Add the routes to `server/server.js`**

  Near the other admin-only settings routes (e.g. alongside the `/settings` routes around `server/server.js:2973`):
  ```js
  if (method === 'GET' && parts[1] === 'permissions' && parts.length === 2) {
    requireRole(user, ['admin']);
    return json(res, 200, { grid: permissions.getPermissionsGrid(), pages: permissions.PAGE_KEYS });
  }
  if (method === 'PUT' && parts[1] === 'permissions' && parts.length === 2) {
    requireRole(user, ['admin']);
    const b = await readBody(req);
    const grid = b.grid || {};
    for (const role of Object.keys(grid)) {
      for (const page of Object.keys(grid[role])) {
        if (!permissions.PAGE_KEYS.includes(page)) return err(res, 400, `Unknown page: ${page}`);
      }
    }
    try {
      permissions.setPermissionsGrid(grid, user);
    } catch (e) {
      return err(res, e.statusCode || 400, e.message);
    }
    return json(res, 200, { ok: true });
  }
  ```
  These use the existing `requireRole(user, ['admin'])` directly (not `requirePage`) — per the spec, the permissions screen can't be gated by the permission system it configures.

- [ ] **Step 4: Start the dev server, run the test, confirm it passes**

  Run: `node server/server.js` (background/separate terminal), then `node server/test-permissions-api.js`
  Expected: every `check` line prints `ok`.

- [ ] **Step 5: Commit**

  ```bash
  git add server/server.js server/test-permissions-api.js
  git commit -m "Add GET/PUT /api/permissions admin routes"
  ```

---

## Task 3a: Convert GET checks — orders, delivery, and commerce pages

**Files:**
- Modify: `server/server.js` — convert the GET-method role checks for `orders`, `deliveries`, `route`, `vehicle-logs`, `production`, `customers`, `agents`, `commissions`, and the two dual-purpose endpoints `agent-prices` and `payment-methods`, to `requirePage`.
- Test: `server/test-permissions-regression-a.js` (new e2e script; extend the `test-e2e.js` pattern to log in as every role in `TEST_ACCOUNTS` and assert each default-seeded page's GET endpoint for that group).

**Interfaces:**
- Consumes: `permissions.requirePage(user, page)` from Task 2's wiring (`permissions` is already a module-level const in `server.js` by this point).

- [ ] **Step 1: Write the regression test against today's behavior, before touching any route**

  For every (role, page) pair in Task 1's seed table that this task covers, assert the matching GET endpoint returns 200 for a seeded role and 403 for one that's deliberately not seeded. Concretely (using `TEST_ACCOUNTS` logins — check `server/db.js`'s `TEST_ACCOUNTS` array for the exact emails/roles available):
  ```js
  // GET /api/orders: 200 for admin/manager/shop_manager/agent/finance/customer, 403 for employee and labour
  // GET /api/deliveries: 200 for admin/manager/shop_manager/delivery, 403 for finance and customer
  // GET /api/route-plan: 200 for admin/manager/delivery, 403 for shop_manager
  // GET /api/vehicle-logs: 200 for admin/manager/delivery, 403 for shop_manager
  // GET /api/production: 200 for admin/manager/labour, 403 for shop_manager
  // GET /api/customers: 200 for admin/agent, 403 for manager, shop_manager, finance
  // GET /api/agents: 200 for admin/finance, 403 for manager
  // GET /api/commissions as agent: 200 (branches to 'commissions' page); as finance: 200 (branches to 'agents' page); as manager: 403 (branches to 'agents', which manager lacks)
  // GET /api/agent-prices as agent: 200 (branches to 'orders'); as finance: 200 (branches to 'agents'); as manager: 403
  // GET /api/payment-methods as customer: 200 (branches to 'orders'); as manager: 200 (branches to 'payments'); as employee: 403 (has neither)
  ```

- [ ] **Step 2: Run it against the current (unmodified) code, confirm every line passes**

  Run: `node server/test-permissions-regression-a.js`
  Expected: all `ok` — this is proving the test correctly describes *today's* behavior before any refactor, so it's trustworthy as a safety net.

- [ ] **Step 3: Convert the role checks**

  In `server/server.js`, replace each of these GET-method `requireRole(user, [...])` calls with `permissions.requirePage(user, '<page>')`:
  - `GET /products` → *leave untouched* (see Global Constraints — not converted).
  - `GET /production` (`server/server.js:1640`) → `requirePage(user, 'production')`
  - `GET /customers` (`:1696`) → `requirePage(user, 'customers')` — leave the ownership-mixed check a few lines below (`:1746`, `if (!ownRecord && !isAgentOwner) requireRole(...)`) alone; that one isn't in scope for this task (it's not the page-level GET, it's a PATCH-adjacent ownership check).
  - `GET /agent-prices` (`:1842`) → `requirePage(user, user.role === 'agent' ? 'orders' : 'agents')`
  - `GET /orders` (list, `:1883`) and `GET /orders/:id` (`:1890`) → `requirePage(user, 'orders')` each
  - `GET /payment-methods` (`:2053`) → `requirePage(user, ['admin','manager'].includes(user.role) ? 'payments' : 'orders')`
  - `GET /deliveries` (list, `:2076`) and `GET /deliveries/:id` (`:2105`) → `requirePage(user, 'deliveries')` each
  - `GET /route-plan` (`:2085`) → `requirePage(user, 'route')`
  - `GET /vehicle-logs` (`:2206`) → `requirePage(user, 'vehicle-logs')`
  - `GET /agents` (`:2259`) → `requirePage(user, 'agents')`
  - `GET /commissions` (`:2306`) → `requirePage(user, user.role === 'agent' ? 'commissions' : 'agents')`

  Line numbers are from the file as it stood during planning — confirm each against the current file before editing, since earlier tasks don't move these but anything you've already changed above in this same task might.

- [ ] **Step 4: Run the regression test again, confirm it still passes**

  Run: `node server/test-permissions-regression-a.js`
  Expected: all `ok`, unchanged from Step 2 — a page-permission refactor that changes no default-seeded behavior.

- [ ] **Step 5: Add and run the one grant-actually-grants test**

  Add to the same test file: use `PUT /api/permissions` (as admin) to grant `shop_manager` the `customers` page, then `GET /api/customers` as the shop_manager test login and confirm `200` (where it was `403` before this grant). Revert the grant at the end of the script (`PUT` back to the original grid) so the test is repeatable.

  Run: `node server/test-permissions-regression-a.js`
  Expected: the new check passes alongside all the others.

- [ ] **Step 6: Commit**

  ```bash
  git add server/server.js server/test-permissions-regression-a.js
  git commit -m "Gate Orders/Deliveries/Route/Production/Customers/Agents viewing by role_permissions"
  ```

---

## Task 3b: Convert GET checks — office, finance, and system pages

**Files:**
- Modify: `server/server.js` — convert the GET-method role checks for `dashboard` (kpis), `bookkeeping`, `payroll`, `receipts`, `audit`, `backups`, `offers`, `team` (including the `canManage`-boolean mailbox/cpanel routes), and add the new `email` check to the mailbox-read routes.
- Test: `server/test-permissions-regression-b.js` (new, same style as Task 3a's).

**Interfaces:**
- Consumes: same `permissions.requirePage` as Task 3a.

- [ ] **Step 1: Write the regression test against today's behavior**

  ```js
  // GET /api/kpis: 200 for admin/manager/finance/agent, 403 for shop_manager/employee/labour
  //   (delivery and customer are allowed by today's role array but have no 'dashboard' nav
  //   entry — per the seed table in Task 1 they are NOT seeded for 'dashboard', so this
  //   conversion is a deliberate, intentional tightening: assert 403 for them too, and note
  //   this explicitly as expected in a one-line comment, since it's the one place this task
  //   changes a live 200 into a 403 for an already-shipped role)
  // GET /api/ledger, /api/ledger/summary, /api/analytics/monthly, /api/analytics/top-customers:
  //   200 for admin/manager/finance, 403 for agent
  // GET /api/payroll: 200 for admin/manager/finance, 403 for shop_manager
  // GET /api/receipts: 200 for admin/manager/finance/agent/delivery, 403 for shop_manager
  // GET /api/audit, /api/audit/verify: 200 for admin/manager, 403 for finance
  // GET /api/backup/list: 200 for admin/manager, 403 for finance
  // GET /api/offers: 200 for admin/manager, 403 for finance
  // GET /api/users, /api/cpanel/emails, /api/mailboxes: 200 for admin/manager, 403 for finance
  // GET /api/mailbox, /api/mailbox/messages: 200 for every role today (no gate exists yet) —
  //   record this as the pre-change baseline; it stays 200 after Step 3 too, since email is
  //   seeded true for every role (see Task 1) — this isn't a behavior change, just adding the
  //   capability to later turn it off
  ```

- [ ] **Step 2: Run it against the current (unmodified) code**

  Run: `node server/test-permissions-regression-b.js`
  Expected: all `ok` **except** the flagged `delivery`/`customer` kpis cases, which are allowed to already be a known, deliberate exception — write those two assertions as checking *today's* actual 200, confirm they pass now, and flip them to expect 403 in Step 4 below once the conversion lands. (If you'd rather keep the test unambiguous, write it as two separate checks from the start — one block run before Step 3, one after — rather than one shared assertion that changes meaning mid-file.)

- [ ] **Step 3: Convert the role checks**

  - `GET /kpis` (`server/server.js:3005`) → `requirePage(user, 'dashboard')`
  - `GET /analytics/monthly` (`:3019`), `GET /analytics/top-customers` (`:3023`) → `requirePage(user, 'bookkeeping')` each
  - `GET /ledger` (`:2425`), `GET /ledger/summary` (`:2431`) → `requirePage(user, 'bookkeeping')` each
  - `GET /payroll` (`:2338`) → `requirePage(user, 'payroll')`
  - `GET /receipts` (`:2820`) and the receipt-image route (`:2840`) → `requirePage(user, 'receipts')` each (the image route's current check is `requireRole(user || ..., [...])` on a possibly-token-derived user — keep that `user || ...` resolution, just swap the role-array check for `requirePage`)
  - `GET /audit/verify` (`:2501`), `GET /audit` (`:2505`) → `requirePage(user, 'audit')` each
  - `GET /backup/list` (`:2921`) → `requirePage(user, 'backups')`
  - `GET /offers` (`:1352`) → `requirePage(user, 'offers')`
  - `GET /users` (the `canManage` check around `:1410`), `GET /cpanel/emails` (`:2637`), `GET /mailboxes` (`:2687`) → replace `if (!canManage) return err(res, 403, 'Forbidden');` with `if (!permissions.canAccessPage(user?.role, 'team')) return err(res, 403, 'Forbidden');` for these three GET routes specifically. **Leave every other `canManage` check in the same block (`POST`/`PATCH` on users, mailboxes, cpanel provisioning) exactly as `canManage` — unconverted, per the GET-only rule.**
  - Add `requirePage(user, 'email')` as the first line inside `GET /mailbox` (`:2769`), `GET /mailbox/messages` (`:2774`), and `GET /mailbox/messages/:id` (`:2787`) — these have no role check today, so this is new code, not a swap.

- [ ] **Step 4: Run the regression test again**

  Run: `node server/test-permissions-regression-b.js`
  Expected: all `ok`, including the two `kpis` cases now flipped to expect 403 for delivery/customer (the one intentional, documented tightening in this whole migration — call it out in the commit message too).

- [ ] **Step 5: Commit**

  ```bash
  git add server/server.js server/test-permissions-regression-b.js
  git commit -m "Gate Dashboard/Bookkeeping/Payroll/Receipts/Audit/Backups/Offers/Team viewing by role_permissions; add Email gate"
  ```

---

## Task 4: Frontend — nav/router gating and the admin Permissions screen

**Files:**
- Modify: `web/api.js` — add `getPermissions`/`savePermissions` calls.
- Modify: `web/app.js` — fetch the permission grid at login (alongside the user session), store it, use it to drive `navFor()`/the view router, wire the new Permissions screen's save action.
- Modify: `web/views.js` — `navFor(role)` and the `VIEW` router read the fetched grid instead of the hardcoded arrays/objects; new `viewPermissions()` admin screen (grid of checkboxes).
- Verification: manual, via the `run` skill (no browser test framework in this repo) — launch the dev server, log in as a couple of different roles, confirm nav matches, then log in as admin, flip something, confirm it takes effect for the other role's next action without their needing to log out.

**Interfaces:**
- Consumes: `GET /api/permissions` → `{ grid, pages }` and `PUT /api/permissions` → `{ ok: true }` or an error, from Task 2.

- [ ] **Step 1: Add the API calls**

  In `web/api.js`, alongside the other admin routes (near `cpanelEmails`/`provisionMailbox`):
  ```js
  getPermissions: () => g('/permissions'),
  savePermissions: (grid) => put('/permissions', { grid }),
  ```
  (check `web/api.js` for whether a `put` helper already exists alongside its existing `g`/`post` helpers; add one following the same pattern as `post` if not.)

- [ ] **Step 2: Fetch the grid at login, and refetch on every navigation**

  In `web/app.js`, wherever the user's session/profile is loaded after a successful login (same place `API.user` gets populated), call `API.getPermissions()` and store the result (e.g. `this.permissions = grid`). The spec's goal is that an admin's edit takes effect immediately with **no logout required** — fetching only at login wouldn't satisfy that for a role's own already-open session, so also call `API.getPermissions()` (fire-and-forget is fine; don't block the page switch on it) every time the app's nav/route-switch function runs, refreshing `this.permissions` before that navigation's render reads it. This makes "admin changes something while Finance is mid-session" visible on Finance's very next click, not just their next login — which is also already true on the backend side regardless of the frontend (Task 3's `requirePage` reads the live cache on every request), so this step is about keeping the *nav/UI* honest with that same immediacy, not about security (the backend is already the real boundary either way).

- [ ] **Step 3: Drive `navFor()` and the `VIEW` router from the fetched grid**

  In `web/views.js`, change `navFor(role)` (`:3324`) to filter each role's existing hardcoded array by the fetched grid — e.g. `navFor(role, grid) { return (N[role] || []).filter(item => role === 'admin' || (grid && grid[role] && grid[role][item.to])); }` — rather than replacing the hardcoded arrays outright; they're still useful as "the full catalog of what a role's nav *could* contain," now filtered down to what's actually enabled. Thread the fetched grid through wherever `navFor` is currently called (check `web/app.js` for the call site(s)). Apply the same filter to whatever resolves the `VIEW` router lookup, so a role can't reach a page via a stale/direct URL fragment even if it's been removed from their nav. Deep-linking to a now-disabled page: fall back to that role's first still-enabled nav entry (reuse whatever this app already does for an unrecognized route, if that exists — check for one before writing new fallback logic).

- [ ] **Step 4: Build the admin Permissions screen**

  Add a nav entry `{ to: 'permissions', icon: IC.shield, label: 'Permissions' }` to `ADMIN_NAV` only (`web/views.js:3276`) — not `MANAGER_NAV`, matching the spec's intent that only admin can touch this. Write `viewPermissions()`: a table with the 21 page keys as rows (in `PAGE_KEYS` order — fetch this from `pages` in the `GET /api/permissions` response rather than hardcoding it again in the frontend) and the 8 non-admin roles as columns, one checkbox per cell, plus a 9th `admin` column rendered as an always-checked, always-disabled column with a short note (e.g. "admin always has full access"). A single **Save** button at the bottom posts the whole grid via `API.savePermissions`; on success, toast it and re-fetch the grid (Step 2's fetch) so the current session's own nav updates immediately if admin just changed something that affects a role they're currently impersonating-testing, and on a 400 (the zero-pages rejection), show the server's error message rather than a generic failure toast.

- [ ] **Step 5: Manual verification**

  Use the `run` skill to launch the dev server and the web app in a browser.
  - Log in as the `finance` test account; confirm the nav matches Task 1's seed list for finance (no Team, no Customers, no Deliveries).
  - Log in as `admin`; open **Permissions**; grant `finance` the `team` page; save; confirm the toast and that the grid still shows it checked after a reload of the Permissions screen.
  - In a second browser tab, with `finance` already logged in from before the grant, navigate to any page (triggering Step 2's refetch) and confirm **Team** now appears in finance's nav and opens without a 403 — without having logged finance out and back in. If it doesn't show up until a hard refresh, that means Step 2's refetch isn't actually wired into the nav/route-switch path; fix that rather than settling for "works after refresh," since the spec's goal is explicitly no-logout-required.
  - Revert the grant from the admin Permissions screen afterward, so the demo/dev database isn't left in a modified state.

- [ ] **Step 6: Commit**

  ```bash
  git add web/api.js web/app.js web/views.js
  git commit -m "Add the admin Permissions screen and drive nav/routing from role_permissions"
  ```
