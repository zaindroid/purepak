# PurePak — Water Operations Suite

A full operations system for a mineral-water supply company: **orders**, **deliveries**,
**commission agents + their shares**, and **book keeping** — all in one, with a separate
view for every role.

Built for **PurePak** (purepak.com.pk). Products, branding, contact details and the
real customer list (Rascon, Fun Loft, Appinators, Mindbyte, Realty Corp) are seeded
to match the live site.

## What's in the box

| Piece | Path | What it is |
|-------|------|-----------|
| **Backend API** | `server/` | Node.js (no dependencies) + SQLite. REST API, role-based auth, seed data. |
| **Web dashboard** | `web/` | Role-based SPA served by the server. Works in any browser. |
| **Android app** | `android/` | Native APK that wraps the dashboard in a secure WebView, with a first-run "set your server" screen. |
| **e2e test** | `server/test-e2e.js` | 37 checks across all roles. |
| **web smoke test** | `webtest/` | jsdom-based render + interaction checks for every role's views. |

## Roles & what each sees

| Role | Login | Sees / can do |
|------|-------|---------------|
| **Admin** (owner) | `admin@purepak.pk` | Dashboard KPIs + 6-month chart, orders, deliveries, customers, agents, commissions, book keeping, products. |
| **Finance** | `finance@purepak.pk` | Finance dashboard, ledger, agent dues (settle commissions), order payments. |
| **Delivery** (driver) | `delivery@purepak.pk` | "Today's route" board, start trip / mark delivered / retry. |
| **Agent** | `bilal@purepak.pk`, `nadia@purepak.pk`, `omar@purepak.pk` | Own orders, own sales, own commission (accrued vs paid). |
| **Customer** | `ali@rascon.pk`, `sana@funloft.pk` | Shop + quick order, order history, balance due. |

All demo passwords are **`purepak123`**.

## Run it

```bash
cd purepak/server
node server.js
```

Open **http://localhost:4310** and sign in with any demo account.
Data lives in `server/data/purepak.db` (SQLite). Delete that file to reseed from scratch.

### For the Android app
The app asks for a server address on first launch. On the same Wi‑Fi network, enter the
computer's local IP and port, e.g. `192.168.1.20:4310`. (The server binds to all
interfaces by default, so a phone on the LAN can reach it.)

## Build the Android APK

Requires the Android SDK + a JDK 17+. From the `android/` folder:

```bash
gradle assembleDebug
# -> app/build/outputs/apk/debug/app-debug.apk
```

`local.properties` already points at the SDK on this machine. Install on a device with:
`adb install app/build/outputs/apk/debug/app-debug.apk`.

## API (quick tour)

All requests are JSON. Auth: `Authorization: Bearer <token>` (from `POST /api/auth/login`).

- `POST /api/auth/login` → `{token, user}`
- `GET  /api/kpis` → role-specific KPIs
- `GET|POST /api/orders` · `PATCH /api/orders/:id` (status + payment)
- `GET|POST /api/products` · `GET|POST /api/customers` · `GET|POST /api/agents`
- `GET /api/deliveries?status=` · `PATCH /api/deliveries/:id`
- `GET /api/commissions?status=` · `PATCH /api/commissions/:id` (settle)
- `GET /api/ledger` · `GET /api/ledger/summary?month=` · `POST /api/ledger`
- `GET /api/analytics/monthly` · `GET /api/analytics/top-customers`

Order status flow: `new → confirmed → in_delivery → delivered` (or `cancelled`).
Delivery flow: `pending → out_for_delivery → delivered` (or `failed`).
Recording a payment writes a ledger **income** entry; settling a commission writes a
ledger **expense** entry — so book keeping stays consistent automatically.

## Testing

```bash
cd purepak/server && node test-e2e.js   # API, all roles (needs server running)
cd purepak/webtest && npm i && node smoke.js   # dashboard render + interaction
```
