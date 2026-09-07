# PurePak Multi-Role Management Expansion — Implementation Plan

> **For Hermes:** Execute this plan phase by phase. Each task is self-contained; run the
> verification command after each phase and only continue when it passes.

**Goal:** Turn PurePak into a complete multi-role operations app: self-service signup for
every user type (customer, agent, finance, delivery), a staff-management center (add employees,
create credentials, set salaries, change roles, activate/deactivate), a new **manager** role with
the same management power as admin, per-agent commission rates, product management, and a
**price matrix by customer type** (wholesale, general/retail, hotel, restaurant, institutional) —
plus payroll, activation workflow, and notifications so nobody is left guessing.

**Architecture:** Existing stack unchanged — Node 22 + `node:sqlite` server on port 4310,
REST + bearer-token auth, role-scoped data, vanilla-JS web SPA. All new capability is
schema migrations + API routes + web views. The Android shell needs no change (same web bundle).

**Tech stack:** node:sqlite, no new npm deps; Leaflet already vendored; Puppeteer smoke tests.

---

## Roles & Permissions Matrix (the contract everything enforces)

| Capability | admin | manager | finance | delivery | agent | customer |
|---|---|---|---|---|---|---|
| Team: add/edit employees, credentials, salaries, roles | ✓ | ✓ (not admin/manager) | | | | |
| Agents: commission rates | ✓ | ✓ | ✓ (view) | | own only | |
| Products & price matrix | ✓ | ✓ | view | view | view | own prices |
| Payroll view/payout | ✓ | ✓ | ✓ | | | |
| Receipts verify/approve | ✓ | ✓ | ✓ | | (scan) | |
| Orders/deliveries/routes | ✓ | ✓ | view | ✓ | own | own |
| Create admin/manager accounts | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

Guard rules:
- G1: manager cannot create, role-change, or disable accounts with role admin/manager.
- G2: The last active admin cannot be disabled or demoted.
- G3: A user cannot disable themselves.
- G4: Self-signup roles allowed: customer, agent, finance, delivery only.
- G5: Staff signups start `pending`; login shows an activation-pending screen. Customers get
      instant access.

## Value-Adds (things the user missed that a company needs)

1. **Activation queue** — manager/admin sees pending staff in Team with one-tap "Activate".
2. **Payroll** — monthly salary entries per employee; mark paid → posts expense to ledger.
3. **Customer type per customer** — type drives the price they see on orders.
4. **Price fallback** — missing matrix cell falls back to product base price (retail).
5. **Password reset** — manager issues a temporary password; user keeps their email.
6. **Notifications** — on signup, activation, role change, salary change, commission change.

---

## Phase 1 — Schema & Migrations

**Files:** Modify `server/db.js`

1. New columns on `users` (via `migrate()` PRAGMA checks):
   - `salary REAL` (monthly; null for customers)
   - `status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending','active','disabled'))`
     (existing `active` int stays; `status` becomes source of truth)
   - `last_login_at TEXT`
2. New columns on `customers`: `type TEXT NOT NULL DEFAULT 'retail'`.
3. New tables:
   ```sql
   CREATE TABLE IF NOT EXISTS customer_types (
     name TEXT PRIMARY KEY            -- 'retail','wholesale','hotel','restaurant','institutional'
   );
   CREATE TABLE IF NOT EXISTS product_prices (
     product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     customer_type TEXT NOT NULL REFERENCES customer_types(name),
     price REAL NOT NULL,
     PRIMARY KEY (product_id, customer_type)
   );
   CREATE TABLE IF NOT EXISTS payroll (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     period TEXT NOT NULL,            -- 'YYYY-MM'
     amount REAL NOT NULL,
     status TEXT NOT NULL DEFAULT 'accrued' CHECK(status IN ('accrued','paid')),
     paid_at TEXT,
     ledger_ref TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     UNIQUE(user_id, period)
   );
   ```
4. Seed `customer_types`: retail, wholesale, hotel, restaurant, institutional.
5. Seed: set `type='hotel'` on Appinators & Mindbyte, `type='wholesale'` on Rascon (demo);
   set salaries: finance 40000, delivery 25000, agents 15000; admin 0.
   Seed a few `product_prices` (wholesale 500ml=8, 19L=95; hotel 19L=100).

**Verify:** `rm -f server/data/purepak.db* && node server/db.js` → exits 0, prints seeded.

## Phase 2 — Auth: Signup + Pending Gate

**Files:** Modify `server/server.js`

1. `userView(u)` — add `salary`, `status`, `agentName` (join agents), `customerName`.
2. Login:
   - `WHERE email=? AND active=1 AND status='active'`.
   - Pending staff → 200 with `{ token, user: {..., status:'pending'} }` and
     `pending: true` flag so the SPA shows the activation screen instead of 401.
   - Disabled → 401 "Account disabled — contact your manager".
   - Update `last_login_at` on successful login.
3. `POST /api/auth/signup` (public):
   - Body `{name, email, phone, password, role}`; role ∈ {customer, agent, finance, delivery} (G4).
   - Validate: name ≥2 chars, email unique (case-insensitive), password ≥6.
   - customer → create `customers` row (name=company or personal name, phone, type='retail'),
     user status **active**.
   - agent → create `agents` row (commission_pct=5), user status **pending**, agent_id linked.
   - finance/delivery → user status **pending**, no linked record.
   - Notify all active admin+manager users: "New {role} signup: {name} — awaiting activation".
   - Return `{ pending: role!=='customer', user }`.

**Verify:** curl signup for each role; pending staff login returns `pending:true`;
customer login goes straight to home.

## Phase 3 — Team API (employees, credentials, roles, salaries)

**Files:** Modify `server/server.js`

Helper `canManage(user) = role in {admin, manager}`.

1. `GET /api/users` — canManage only. Return all users: id, name, email, phone, role, status,
   salary, agent/customer link names, last_login_at.
2. `POST /api/users` — canManage. `{name, email, phone, password, role, salary}`;
   role ∈ {admin, manager, finance, delivery, agent, customer} **but** if user.role!=='admin'
   and role ∈ {admin, manager} → 403 (G1). agent role auto-creates agents row (pct 5).
   New staff start `active` (manager-created) — only self-signup is pending.
3. `PATCH /api/users/:id` — canManage. Fields: role, salary, name, phone, status,
   agent_id, customer_id. Guards: G1 (target role admin/manager protected), G2 (last active
   admin), G3 (self disable). Role/status change → notify target user + admin.
4. `POST /api/users/:id/reset-password` — canManage. Sets new temp password
   (`purepak` + 4 random chars), returns it once. Notify target.

**Verify:** curl as admin: list, create delivery user, change agent commission via Phase 4,
try manager creating admin → 403, disable last admin → 400, self-disable → 400.

## Phase 4 — Agents (commission rates) + Customers (type)

**Files:** Modify `server/server.js`

1. `PATCH /api/agents/:id` — admin/manager/finance. Body `{commission_pct, area, active, name}`.
   pct 0–50. Notify admin on pct change.
2. `POST /api/customers` — add `type` (validated against customer_types; default retail).
3. `PATCH /api/customers/:id` — new endpoint, admin/manager/finance. name/phone/address/area/type/lat/lng.

**Verify:** curl agent patch changes commission; new order for wholesale customer prices at
wholesale matrix price (Phase 5).

## Phase 5 — Products + Price Matrix

**Files:** Modify `server/server.js`

1. `PATCH /api/products/:id` — admin/manager. `{name, price, description, active}`.
2. `GET /api/pricing` — any auth. Returns products joined with
   `product_prices` per type + base price. Shape:
   `[{id, name, size_ml, price, prices: {wholesale: 8|null, hotel: 100|null, ...}}]`
3. `POST /api/pricing` — admin/manager. Body `[{product_id, customer_type, price|null}]`
   (null deletes the override → falls back to base).
4. **Order pricing engine** — in `POST /api/orders` and any line-item price computation,
   replace `SELECT price FROM products` with:
   ```sql
   SELECT COALESCE(pp.price, p.price) FROM products p
   LEFT JOIN product_prices pp ON pp.product_id=p.id
        AND pp.customer_type=(SELECT type FROM customers WHERE id=?)
   WHERE p.id=?
   ```
   Customer/agent-created orders get prices from their customer's type. Admin orders default
   customer type pricing as well.

**Verify:** create order for wholesale customer → line_total uses 8 for 500ml not 10.
Matrix POST with null removes override.

## Phase 6 — Payroll

**Files:** Modify `server/server.js`

1. `GET /api/payroll?period=YYYY-MM` — admin/manager/finance. Rows: user info, salary,
   existing payroll entry (if any), accrued commission totals for that month per agent-user.
2. `POST /api/payroll/generate` — `{period}` — inserts accrued rows for every active staff
   user with salary>0 (skips existing, skips agents who have no salary but do have
   commission — agents get salary+commission combined amount).
3. `POST /api/payroll/:id/mark-paid` — admin/manager/finance. status→paid, paid_at=now,
   ledger expense entry account "Salaries & Wages", ref `payroll#<period>#<user>`.
   Prevents double-pay (409 if already paid).

**Verify:** generate for current month as admin; mark one paid → ledger shows expense;
second mark → 409.

## Phase 7 — Notification Wiring

**Files:** Modify `server/server.js` (existing `notify()`)

- Signup (Phase 2), activation + role/salary change + reset-password (Phase 3),
  commission change (Phase 4), product price change (Phase 5), payroll paid (Phase 6).
- All receipt/reject flows already notify.

**Verify:** each action above produces a row in `notifications` for the right users.

## Phase 8 — Web: Signup + Pending Screen

**Files:** Modify `web/index.html`, `web/app.js`, `web/styles.css`

1. Login screen: "Create account" link → modal with:
   - Account type picker (4 cards: Customer / Agent / Finance / Delivery) — icon + 1-liner.
   - Fields: name, email, phone, password (+ company name shown for customer/agent types).
   - Submit → `API.signup(...)`; on success: customer → logged in; staff → toast "Account
     created — a manager will activate it" and re-show login.
2. `API.signup` in `web/api.js`.
3. Pending gate: after login, if `user.status==='pending'` → render full-screen
   activation-pending view (icon, "Your account is awaiting activation", who to contact,
   Sign out button). No app shell.
4. Login demo-grid stays; add a "New here? Create an account" line.

**Verify:** Puppeteer: signup as delivery → login → pending screen visible; manager activates
(Phase 9) → re-login → dashboard.

## Phase 9 — Web: Team View (staff management)

**Files:** Modify `web/views.js`, `web/app.js`, `web/index.html`, `web/api.js`

1. `viewTeam()`:
   - KPI row: staff count, pending count, monthly payroll total.
   - Table (phone-friendly cards): name, role chip, status chip, salary, linked
     agent/customer, last login. Buttons: **Activate** (pending only), **Edit**,
     **Reset password**, **Disable/Enable**.
   - **Add employee** button → modal: name, email, phone, temporary password, role select
     (admin/manager hidden when viewer is manager — G1), salary, (agent → area + commission).
   - Edit modal: role (same restriction), salary, status, phone/name, agent link.
   - All actions → `API.users*`; role changes confirm first (toast shows new role).
2. `VIEW.manager` = same map as `VIEW.admin`; register `manager` role in router + nav
   (add "Team" to admin & manager nav, "Team" only there).
3. `API.users()`, `API.createUser()`, `API.updateUser(id,b)`, `API.resetPassword(id)`.

**Verify:** as manager: create a delivery user, activate a pending signup, change salary;
as finance: /api/users → 403.

## Phase 10 — Web: Agents View Commission Editor

**Files:** Modify `web/views.js` (`viewAgents()`), `web/api.js`

- Each agent card gets an editable commission % input + save (admin/manager/finance);
  shows area + active toggle. `API.updateAgent(id, b)`.

**Verify:** change Bilal 6→7, save, commission preview updates for his open orders
(only NEW orders use new rate — existing commissions keep their pct, by design).

## Phase 11 — Web: Products + Price Matrix

**Files:** Modify `web/views.js` (`viewProducts()`), `web/api.js`

- Product table: name, size, base price, active toggle; **Edit** and **Add product** modals.
- "Price list by customer type" section: matrix table — rows = products, columns =
  customer types; each cell is an input pre-filled with override or shows base price
  greyed (placeholder "base ₹X"). Save-all button → `API.savePricing(rows)`; null/blank cell
  clears override back to base.
- Customer cards: type chip + edit type (admin/manager/finance) via `API.updateCustomer`.

**Verify:** set wholesale 500ml=8; order for wholesale customer prices at 8; clear cell →
back to base 10.

## Phase 12 — Web: Payroll View

**Files:** Modify `web/views.js` (`viewPayroll()`), `web/app.js`, `web/api.js`

- Period picker (month input). Rows: employee, salary, accrued commission (agents),
  total due, status chip (Accrued/Paid).
- **Generate month** button (when no rows), **Mark paid** per row → ledger update.
- Nav "Payroll" for admin/manager/finance.

**Verify:** generate current month, mark a row paid, Book keeping shows the expense entry.

## Phase 13 — Tests, Reseed, Full Verification

1. `server/test-e2e.js`: add cases —
   signup (4 roles), pending login gate, manager create/activate, G1/G2/G3 guard rejections,
   agent commission patch, pricing matrix order, payroll generate/mark-paid + ledger.
2. `webtest/smoke.js`: assert new routes render for manager role; signup modal present.
3. Reseed clean DB (`rm purepak.db* && node db.js`), re-insert Gemini key, re-insert the
   demo receipts (ids shift — regenerate sample receipts).
4. Restart server; run e2e + smoke; Puppeteer screenshots: login+signup modal, pending
   screen, Team view, Products+matrix, Payroll, Agents editor.
5. Android: no rebuild needed (web bundle only). Confirm APK v1.3 loads new pages.

## Files Likely to Change

- `server/db.js` (Phase 1)
- `server/server.js` (Phases 2–7) — expect ~350 new lines
- `web/api.js` (Phases 8–12) — ~15 new methods
- `web/views.js` (Phases 8–12) — new `viewTeam()`, `viewPayroll()`, signup/pending, edits
- `web/app.js` (Phases 8–12) — route registry + manager role + pending gate
- `web/index.html` (Phases 8–9) — signup modal markup, nav
- `web/styles.css` — team/payroll/matrix styles
- `server/test-e2e.js`, `webtest/smoke.js` (Phase 13)

## Risks & Open Questions

- **R1** `users.active` (int) and new `status` coexist — treat `status` as truth, keep
  `active` for back-compat. Migration keeps both in sync on writes.
- **R2** Existing commissions keep their original pct even after rate changes (correct
  accounting behavior) — document in UI copy ("applies to new orders").
- **R3** Agent salary+commission both flow to payroll; ensure no double-counting when an
  agent has both salary>0 and commissions (generate sums them into one payroll row).
- **Open Q1**: Should delivery drivers be paid per delivery (bonus) in addition to salary?
  Not implemented — flag to user.
- **Open Q2**: Customer-facing notifications (push/SMS) out of scope — in-app bell only.

## Execution Order

Phases are strictly sequential (1→13); within a phase, tasks are listed in execution order.
Estimated total: ~6–8 focused working sessions. After Phase 13, the app is a complete
multi-role system; remaining nice-to-haves (per-delivery bonuses, SMS notifications,
invoice PDFs) are follow-up scope.
