# Admin-configurable role permissions — design

## Intent and why

Today, what each role (admin, manager, shop_manager, finance, agent,
delivery, employee, labour, customer) can see and do in the PurePak portal
is fixed in code: a hardcoded nav list per role in `web/views.js`, and
~60 individual `requireRole(user, [...])` checks scattered through
`server/server.js`. Changing any of it means editing code and redeploying.

The owner wants to manage this themselves: turn a whole portal section
on or off for a role, at any time, without a code change — including
*granting* a role a section it doesn't have today, not just hiding
sections it already has.

## Goals

- An admin settings screen: a grid of roles × portal sections, with a
  checkbox per cell, that takes effect immediately (no redeploy, no
  logout required).
- Turning a section on for a role must actually unlock it — both the nav
  entry and the underlying API calls — not just hide/show a button while
  the backend still rejects the role.
- Today's behavior is the starting point: when this ships, every role
  sees exactly what it sees today, until the admin changes something.

## Non-goals (out of scope for this version)

- Per-action/per-button permissions inside a section (e.g. "can view
  Payroll but not edit it"). The owner confirmed section-level is what
  they want: a role either has a section or it doesn't.
- Adding, removing, or renaming roles. The 9 roles stay fixed; this is
  only about what each existing role can reach.
- Changing ownership-based data scoping. A customer only ever sees their
  own orders, an agent only their own customers/commissions, etc. — that
  filtering is independent of section access and is untouched by this
  feature. Granting "Orders" to a role doesn't mean they suddenly see
  everyone's orders; it means they can open the Orders section at all,
  filtered the way it already is for their role.

## Constraints found in the codebase

- Sections (nav entries) are already a clean, existing taxonomy: ~19
  page keys (dashboard, orders, deliveries, route, vehicle-logs,
  production, customers, agents, offers, bookkeeping, receipts,
  payments, payroll, audit, products, team, email, backups, commissions,
  profile, home — 21 counting the few role-specific dashboard/profile
  variants). This feature is built around that existing taxonomy, not a
  new one.
- The backend's ~60 `requireRole` call sites don't map 1:1 to those page
  keys — some routes mix role checks with ownership checks (e.g. "the
  customer who owns this order, OR an admin/manager/finance"). Only the
  role-check half of those gets swapped for the new permission check;
  the ownership half stays exactly as it is.
- Within a page, today's role arrays already vary by *action*, not just
  by page — e.g. on Orders, creating one allows
  admin/manager/shop_manager/agent/customer, while marking one paid
  allows admin/manager/shop_manager/finance only. Collapsing all of that
  to one page-level flag would let admin, by granting a role "Orders" at
  all, accidentally also hand it abilities (create an order, mark one
  paid) it never had — which is exactly the per-action control the owner
  said they don't want this version to touch. See Backend design for how
  this is resolved (only the *viewing* checks become configurable; every
  *action* check stays exactly as hardcoded today).
- A couple of endpoints double for two different pages depending on who's
  asking — e.g. `GET /agent-prices` backs both the staff "Agents &
  commissions" page and an agent's own order-placement screen, where they
  see their own markup rates. These need the permission check branched
  on the caller's role rather than a single fixed page key; `GET
  /commissions` is the other known case (staff "Agents & commissions"
  ledger vs. an agent's own "My earnings" page). There are likely one or
  two more like this that only turn up while doing the mapping — the
  builder should branch those the same way, not force them into one key.
- A few renderers are role-specific variants of the same page key (e.g.
  `dashboard` renders differently for admin/manager vs. finance vs.
  agent; `vehicle-logs` has a "mine only" variant for delivery). Granting
  a role a page it doesn't currently render falls back to a sensible
  default renderer (the admin/manager one where one exists) rather than
  inventing a new role-specific view — a UX detail, not a decision that
  changes the design.

## Approaches considered

**A — Nav-only visibility toggle.** Admin toggles which nav items show;
backend role checks stay hardcoded as-is. Rejected: doesn't meet the
actual requirement — admin could hide things a role already has, but
could never *grant* a role something new, because the API would still
403 it.

**B — Section-level permission table driving both nav and backend
(chosen).** A `role_permissions` table of (role, page, enabled). Nav
rendering and the backend's role checks both read from it. Admin edits
it from a settings screen; an in-memory cache is reloaded on every save,
so changes are live immediately. Seeded at migration time to reproduce
today's behavior exactly.

**C — Per-action granular permissions.** One toggle per existing
`requireRole` call site (~60 of them) instead of per page. Rejected as
overkill: most of those 60 are fine-grained distinctions (e.g. "can
settle a commission" vs. "can view the commission ledger") that don't
correspond to anything a business owner would recognize as a feature,
and would make the settings screen unusable. This is also what the owner
ruled out by confirming whole-section granularity.

## Data model

```sql
CREATE TABLE role_permissions (
  role TEXT NOT NULL,
  page TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (role, page)
);
```

A migration seeds one row per (role, page) combination, `enabled = 1`,
only where **both** of today's independent sources agree the role can
actually reach that page right now: the frontend's nav/`VIEW` wiring
*and* the backend's viewing checks (the GET-method role arrays — see
Backend design). Either one alone isn't enough, because they already
disagree in both directions:

- Frontend says yes, backend says no: the frontend wires an
  `employee → orders` nav entry that the backend has never allowed
  (every order route's `requireRole` list omits `'employee'`) — that
  link 403s today. Seeding from the frontend alone would silently hand
  employees real order access as a side effect of the migration.
- Backend says yes, frontend says no: `GET /customers`'s role array
  includes `shop_manager`, but `shop_manager` has no "Customers" nav
  item and never calls it — the access exists in the API but no real
  user ever reaches it. Seeding from the backend alone would make a
  nav item appear for shop_manager out of nowhere on day one.

Taking the intersection reproduces exactly what a real user experiences
today in both cases — the dead nav entry disappears, no new nav entry
appears — and is simply what "every role sees exactly what it sees
today" means once stated precisely. Where a page has more than one
viewing endpoint and their role arrays don't quite match each other
(e.g. Deliveries' list view includes `finance`, its single-delivery view
doesn't), seed the union of those viewing endpoints only — the gap is
already visible through the sibling endpoint, so closing it isn't a
real new disclosure. Combinations that don't exist today are left
unseeded (absence = disabled).

`admin` is hardcoded as always-enabled for every page, bypassing the
table entirely (see Safeguard below) — it never has rows that matter.

## Backend design

- On server start (and after any admin save), load the whole table into
  an in-memory `Set` of `"role:page"` strings.
- `canAccessPage(role, page)` → `true` if `role === 'admin'`, else
  `set.has(role + ':' + page)`.
- `requirePage(user, page)` → throws the existing 403 `httpError` if
  `!canAccessPage(user.role, page)`.
- **Only the GET-method role checks get swapped for `requirePage`** —
  these are the ones gating "can this role see this page's data at
  all," which is the thing the owner asked to make configurable.
  Every POST/PATCH/DELETE role check (create, edit, approve, settle,
  mark-paid, void, restore, etc.) stays exactly as hardcoded today,
  untouched. This is what keeps "grant a role a page" from silently also
  granting that role actions it never had — the owner explicitly scoped
  this to visibility, not per-action control (see Non-goals). Where a
  GET call site mixes ownership logic with a role check (e.g. line
  ~1746 in `server.js`), only the role-check branch is swapped; the
  ownership short-circuit is untouched.
- The handful of dual-purpose GET endpoints noted in Constraints (e.g.
  `GET /agent-prices`, `GET /commissions`) branch the page key on the
  caller's role instead of using one fixed key, e.g. `requirePage(user,
  user.role === 'agent' ? 'commissions' : 'agents')`.
- New admin-only routes: `GET /api/permissions` (returns the full
  role×page grid) and `PUT /api/permissions` (replaces it, reloads the
  cache). Both require `role === 'admin'` directly, not through the
  table itself (chicken-and-egg: the permissions screen can't be gated
  by the permissions system).
- `PUT /api/permissions` rejects (400, no change saved) a payload that
  would leave any non-admin role with zero enabled pages — every role
  must keep at least one, so its users always have somewhere to land
  after login. `admin` is exempt from this check since it's already
  exempt from the table entirely (see Safeguard).
- Every admin edit is written to the audit log, same as other
  admin actions in this app (actor, before/after).

## Frontend design

- New admin-only nav entry: **Permissions** (or folded into the existing
  Team settings area — builder's call on exact placement).
- A grid: pages as rows, the 9 roles as columns, a checkbox per cell.
  The `admin` column is checked and disabled everywhere (see Safeguard).
  Saves immediately via the `PUT /api/permissions` route (either a
  single Save button for the whole grid, or autosave per toggle —
  builder's call).
- `navFor(role)` and the `VIEW` router both consult the permission set
  (fetched once at login, alongside the rest of the user's session data)
  instead of the hardcoded arrays/objects. A role attempting to
  deep-link or route to a page it no longer has access to gets bounced
  to its first available page, same as an unknown route today.

## Safeguard

`admin`'s access can never be edited away — enforced server-side (not
just in the UI) by the `canAccessPage` bypass above, so there's no path
to someone locking themselves out of the admin account, intentionally or
by mistake.

## What's left to the builder

- The exact mapping of each GET-method `requireRole`/`canManage` check to
  a page key. Most are unambiguous; a few are dual-purpose (branch on
  caller role, see Backend design) or don't map cleanly to any page at
  all (e.g. the APK-upload route lives in the sidebar, not a nav page —
  the builder's call is to fold it into `backups` as the closest System
  action). Flag back rather than guessing silently on anything that
  looks like a real security judgment call, not just a grouping one.
- The fallback renderer rule for a role newly granted a page it has no
  wired renderer for (default to the admin/manager renderer for that
  page key where one exists).
- Exact placement of the Permissions screen in the nav, and whether
  saves are per-toggle (autosave) or a single Save action for the grid.
- Whether the frontend permission set is refetched on every page
  navigation or cached for the session with a manual refresh after an
  admin save (cache invalidation detail, not a behavior change the owner
  needs to weigh in on).
