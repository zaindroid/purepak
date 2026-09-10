'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { init, verifyPassword, hashPassword } = require('./db');

const PORT = Number(process.env.PORT || 4310);
const { db } = init();
const WEB_ROOT = path.join(__dirname, '..', 'web');
// receipt images live under the data dir (a mounted volume in production) — the
// SAME path must be used to write, read and delete them, or images 404.
const DATA_DIR = process.env.PUREPAK_DATA_DIR || path.join(__dirname, 'data');
const RECEIPTS_DIR = path.join(DATA_DIR, 'receipts');
const SESSIONS = new Map(); // token -> {user, createdAt}
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

// Accepts a base64 string or a data-url string. Returns a Buffer of image bytes.
// (data-url prefix is "data:MIME;params,PAYLOAD" — exactly ONE comma before payload)
function decodeB64(data) {
  let s = String(data || '');
  s = s.replace(/^data:[^,]+,/, '');      // strip full data-url prefix
  s = s.replace(/\s+/g, '');              // tolerate whitespace/newlines
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0) return Buffer.from(s, 'base64');
  return Buffer.from(String(data || ''), 'utf8');
}
// ---------- helpers ----------
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(body);
}
function err(res, code, msg) { json(res, code, { error: msg }); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 8e6) req.destroy(); }); // 8 MB: receipt images
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { resolve({}); } // malformed JSON -> empty body, route validates
    });
    req.on('error', reject);
  });
}
// ---------- settings (key/value, e.g. Gemini API key) ----------
function setting(key) {
  try { return db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value ?? null; } catch { return null; }
}
function maskKey(k) { return k ? String(k).slice(0, 6) + '…' + String(k).slice(-4) : null; }
// ---------- notifications (in-app feed) ----------
function notify(userIds, kind, title, body, ref) {
  const ids = [...new Set(userIds.filter(Boolean))];
  for (const uid of ids) {
    db.prepare('INSERT INTO notifications(user_id,kind,title,body,ref) VALUES (?,?,?,?,?)')
      .run(uid, kind, title, body || null, ref || null);
    sseSend(uid, kind); // push to any live SSE stream for that user, instantly
  }
  return ids.length;
}
function staffUserIds() {
  return db.prepare(`SELECT id FROM users WHERE role IN ('admin','manager','finance') AND status='active'`).all().map(r => r.id);
}
// order/delivery-only notifications also reach the shop manager — a role scoped
// entirely to running orders through the pipeline, so it shouldn't see pricing,
// payroll, receipts or team-management noise that staffUserIds() carries.
function orderStaffUserIds() {
  return db.prepare(`SELECT id FROM users WHERE role IN ('admin','manager','shop_manager','finance') AND status='active'`).all().map(r => r.id);
}

// ---------- payment methods (Pakistan) ----------
const PAY_METHODS = [
  { id: 'cod', label: 'Cash on delivery', needs_account: false },
  { id: 'bank', label: 'Bank transfer', needs_account: true },
  { id: 'jazzcash', label: 'JazzCash', needs_account: true },
  { id: 'easypaisa', label: 'Easypaisa', needs_account: true },
  { id: 'nayapay', label: 'NayaPay', needs_account: true },
  { id: 'sadapay', label: 'SadaPay', needs_account: true },
  { id: 'raast', label: 'Raast', needs_account: true },
];
const PAY_METHOD_IDS = new Set(PAY_METHODS.map(m => m.id));
const payLabel = (id) => (PAY_METHODS.find(m => m.id === id) || {}).label || id || 'Cash on delivery';
function paymentAccounts() {
  try { return JSON.parse(setting('payment_accounts') || '{}') || {}; } catch { return {}; }
}

// ---------- tamper-evident books: hash-chained audit trail + append-only ledger ----------
function nowStamp() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
// exact string the hash is computed over — MUST match auditVerify() byte for byte
function auditPayload(prevHash, at, actorId, action, entity, entityId, beforeJson, afterJson) {
  return [prevHash, at, actorId || 0, action, entity, entityId || 0, beforeJson || '', afterJson || ''].join('|');
}
function auditHead() {
  const row = db.prepare('SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1').get();
  return row ? row.hash : 'GENESIS';
}
function audit(actor, action, entity, entityId, summary, before, after) {
  const prev = auditHead();
  const at = nowStamp();
  const b = before == null ? '' : JSON.stringify(before);
  const a = after == null ? '' : JSON.stringify(after);
  const hash = crypto.createHash('sha256')
    .update(auditPayload(prev, at, actor ? actor.id : 0, action, entity, entityId, b, a)).digest('hex');
  db.prepare(`INSERT INTO audit_log(at,actor_id,actor_name,actor_role,action,entity,entity_id,summary,before_json,after_json,prev_hash,hash)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(at, actor ? actor.id : null, actor ? actor.name : 'system', actor ? actor.role : null,
      action, entity, entityId || null, summary || null, b || null, a || null, prev, hash);
  return hash;
}
// recompute the whole chain; returns the first row whose stored hash doesn't match
function auditVerify() {
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY id ASC').all();
  let prev = 'GENESIS';
  for (const r of rows) {
    const h = crypto.createHash('sha256')
      .update(auditPayload(prev, r.at, r.actor_id, r.action, r.entity, r.entity_id, r.before_json, r.after_json)).digest('hex');
    if (r.prev_hash !== prev || r.hash !== h) return { ok: false, count: rows.length, broken_at: r.id };
    prev = r.hash;
  }
  return { ok: true, count: rows.length, head: prev };
}
// the ONLY way a ledger row is created — always writes a matching audit entry
function postLedger(actor, e) {
  const at = e.at || nowStamp();
  const r = db.prepare(`INSERT INTO ledger(account,type,amount,ref,memo,at,status,corrects,entered_by)
                        VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(e.account, e.type, Number(e.amount), e.ref || null, e.memo || null, at,
      e.corrects ? 'correction' : 'active', e.corrects || null, actor ? actor.name : 'system');
  const row = db.prepare('SELECT * FROM ledger WHERE id=?').get(r.lastInsertRowid);
  // the row's own audit line is always a create; void/correct handlers add their
  // own semantic entry on top.
  audit(actor, 'ledger.create', 'ledger', row.id,
    `${e.type === 'income' ? '+' : '−'} Rs ${Math.round(Number(e.amount))} · ${e.account}${e.memo ? ' · ' + e.memo : ''}`,
    null, row);
  return row;
}
// Apply a new total-paid amount to an order: updates the row, posts the ledger
// delta, audits it, and tells the customer. `paidRaw` is the new TOTAL paid
// (not a delta) — same contract as the order PATCH `paid` field, so both the
// finance-facing "record payment" flow and the driver's "cash collected on
// delivery" flow share one code path and one behavior.
function applyOrderPayment(actor, oid, cur, paidRaw, methodRaw, memo) {
  const paid = Math.min(cur.total, Math.max(0, Number(paidRaw)));
  const payStatus = paid >= cur.total ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');
  const method = PAY_METHOD_IDS.has(methodRaw) ? methodRaw : cur.payment_method;
  db.prepare('UPDATE orders SET paid=?, payment_status=?, payment_method=? WHERE id=?').run(paid, payStatus, method, oid);
  const inc = paid - cur.paid;
  const via = 'via ' + payLabel(method);
  if (inc > 0) postLedger(actor, { account: 'Cash / Bank', type: 'income', amount: inc, ref: 'order#' + oid, memo: 'Water sale · ' + via + (memo ? ' · ' + memo : '') });
  else if (inc < 0) postLedger(actor, { account: 'Cash / Bank', type: 'expense', amount: -inc, ref: 'order#' + oid, memo: 'Payment refund · ' + via });
  if (inc !== 0) audit(actor, 'order.pay', 'order', oid, `Payment on order #${oid}: paid ${cur.paid} → ${paid} of ${cur.total} (${payLabel(method)})`, { paid: cur.paid }, { paid, method });
  if (inc > 0) {
    const cu = db.prepare('SELECT u.id AS uid FROM customers c LEFT JOIN users u ON u.customer_id=c.id WHERE c.id=?').get(cur.customer_id);
    if (cu && cu.uid) notify([cu.uid], 'order',
      payStatus === 'paid' ? `Payment received · Order #${oid}` : `Part payment received · Order #${oid}`,
      `Rs ${Math.round(inc)} received ${via}. ${payStatus === 'paid' ? 'Your order is fully paid.' : 'Rs ' + Math.round(cur.total - paid) + ' still due.'}`,
      `order#${oid}`);
  }
  return { paid, payStatus, method };
}
function authUser(req) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const s = SESSIONS.get(token);
  if (!s) return null;
  return s.user;
}
function requireRole(user, roles) {
  if (!user) throw httpError(401, 'Not authenticated');
  if (!roles.includes(user.role)) throw httpError(403, 'Forbidden: requires ' + roles.join('/'));
  return user;
}
function httpError(code, msg) { const e = new Error(msg); e.code = code; return e; }

// price for a product given the customer's type (matrix override falls back to base price)
function priceForCustomer(productId, customerType) {
  const base = db.prepare('SELECT price FROM products WHERE id=?').get(productId)?.price;
  if (customerType) {
    const row = db.prepare('SELECT price FROM product_prices WHERE product_id=? AND customer_type=?').get(productId, customerType);
    if (row && row.price != null) return row.price;
  }
  return base;
}

function newSession(user) {
  const token = crypto.randomBytes(24).toString('hex');
  SESSIONS.set(token, { user, createdAt: Date.now() });
  return token;
}

// ---------- auth ----------
function userView(u) {
  const agent = u.agent_id ? db.prepare('SELECT name FROM agents WHERE id=?').get(u.agent_id) : null;
  const cust = u.customer_id ? db.prepare('SELECT name, type, phone, address, area, contact_name FROM customers WHERE id=?').get(u.customer_id) : null;
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    agent_id: u.agent_id, customer_id: u.customer_id,
    agentName: agent ? agent.name : null,
    customerName: cust ? cust.name : null,
    customerType: cust ? cust.type : null,
    customerPhone: cust ? cust.phone : null,
    customerAddress: cust ? cust.address : null,
    customerArea: cust ? cust.area : null,
    customerContact: cust ? cust.contact_name : null,
    salary: u.salary, status: u.status, last_login_at: u.last_login_at,
  };
}

// ---------- query helpers ----------
const Q = {
  orders: `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.area AS customer_area,
                  c.address AS customer_address, a.name AS agent_name,
                  (SELECT GROUP_CONCAT(p.name || ' x' || oi.qty, '; ') FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=o.id) AS items,
                  (SELECT COALESCE(SUM(oi.qty),0) FROM order_items oi WHERE oi.order_id=o.id) AS units,
                  (SELECT d.status FROM deliveries d WHERE d.order_id=o.id ORDER BY d.id DESC LIMIT 1) AS delivery_status,
                  (SELECT d.delivered_at FROM deliveries d WHERE d.order_id=o.id AND d.status='delivered' ORDER BY d.id DESC LIMIT 1) AS delivered_at
           FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN agents a ON a.id=o.agent_id`,
};

function listOrders(filter = {}) {
  let sql = Q.orders + ' WHERE 1=1';
  const args = [];
  if (filter.role === 'customer' && filter.customerId) { sql += ' AND o.customer_id=?'; args.push(filter.customerId); }
  if (filter.role === 'agent' && filter.agentId) { sql += ' AND o.agent_id=?'; args.push(filter.agentId); }
  if (filter.status) { sql += ' AND o.status=?'; args.push(filter.status); }
  sql += ' ORDER BY o.placed_at DESC, o.id DESC';
  return db.prepare(sql).all(...args);
}

function listDeliveries(filter = {}) {
  let sql = `SELECT d.*, o.id AS order_id, o.status AS order_status, o.total AS order_total, o.paid AS order_paid,
                    o.payment_method AS order_payment_method,
                    c.name AS customer, c.address AS customer_address, c.area AS customer_area, c.phone AS customer_phone,
                    c.lat AS lat, c.lng AS lng,
                    (SELECT GROUP_CONCAT(p.name || ' x' || oi.qty, '; ') FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=d.order_id) AS items
             FROM deliveries d JOIN orders o ON o.id=d.order_id JOIN customers c ON c.id=o.customer_id WHERE 1=1`;
  const args = [];
  if (filter.status) { sql += ' AND d.status=?'; args.push(filter.status); }
  sql += ' ORDER BY COALESCE(d.scheduled_at, d.created_at) DESC, d.id DESC';
  return db.prepare(sql).all(...args);
}

// ---------- geo: haversine + Nominatim geocoding (free, self-hosted in server) ----------
function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
const GEO_CACHE = new Map(); // "addr|area" -> [lat,lng] | null
let lastGeoAt = 0;
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function geocodeAddress(address, area) {
  const key = (address + '|' + (area || '')).toLowerCase().trim();
  if (GEO_CACHE.has(key)) return GEO_CACHE.get(key);
  const last = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=' +
    encodeURIComponent(address + (area ? ', ' + area : '') + ', Pakistan'), {
    headers: { 'User-Agent': 'PurePakDeliveryApp/1.0 (contact@purepak.com.pk)', 'Accept-Language': 'en' },
  });
  const rows = await last.json();
  const hit = rows && rows[0] ? [Number(rows[0].lat), Number(rows[0].lon)] : null;
  GEO_CACHE.set(key, hit);
  return hit;
}
// Fill missing customer coords best-effort. Returns number geocoded.
async function fillMissingCoords(deliveryRows, maxGeocodes) {
  const need = deliveryRows.filter(d => d.lat == null && d.lng == null && d.customer_address);
  let done = 0;
  for (const d of need) {
    if (done >= maxGeocodes) break;
    const now = Date.now();
    if (now - lastGeoAt < 1100) await sleep(1100 - (now - lastGeoAt)); // respect Nominatim 1 req/s
    lastGeoAt = Date.now();
    try {
      const hit = await geocodeAddress(d.customer_address, d.customer_area);
      if (hit) {
        db.prepare('UPDATE customers SET lat=?, lng=? WHERE id=?')
          .run(hit[0], hit[1], db.prepare('SELECT customer_id FROM orders WHERE id=?').get(d.order_id).customer_id);
        d.lat = hit[0]; d.lng = hit[1];
        done++;
      }
    } catch { /* network hiccup — leave unlocated */ }
  }
  return done;
}
// Nearest-neighbour route optimisation from a start point (rider GPS or depot).
function optimizeRoute(rows, start) {
  const located = rows.filter(d => d.lat != null && d.lng != null);
  const unlocated = rows.filter(d => d.lat == null || d.lng == null);
  const seq = [];
  let cur = start;
  const pool = [...located];
  while (pool.length) {
    let best = 0, bestD = Infinity;
    pool.forEach((d, i) => { const dist = haversineKm(cur, { lat: d.lat, lng: d.lng }); if (dist < bestD) { bestD = dist; best = i; } });
    const stop = pool.splice(best, 1)[0];
    seq.push({
      delivery_id: stop.id, customer: stop.customer, address: stop.customer_address, area: stop.customer_area,
      phone: stop.customer_phone, status: stop.status, items: stop.items,
      order_id: stop.order_id, order_total: stop.order_total, order_paid: stop.order_paid,
      lat: stop.lat, lng: stop.lng,
      leg_km: Math.round(bestD * 100) / 100,
    });
    cur = { lat: stop.lat, lng: stop.lng };
  }
  let cum = 0;
  seq.forEach(s => { cum += s.leg_km; s.cum_km = Math.round(cum * 100) / 100; });
  return { sequence: seq, total_km: Math.round(cum * 100) / 100, unlocated: unlocated.map(d => ({ id: d.id, customer: d.customer })) };
}
// ---------- receipt OCR via Google Gemini (AI Studio) ----------
// PurePak receipts have a FIXED layout (sales receipt book page), so the prompt
// describes it explicitly position-by-position instead of asking for generic OCR.
const PUREPAK_RECEIPT_PROMPT = [
  'You are reading a photo of a paper receipt, bill or invoice for a bottled-water company called PurePak.',
  'Decide which of the two types it is, then return ONE JSON object of that shape. Never guess numbers that are not visible — use null.',
  '',
  '=== TYPE A — a PurePak sales receipt book page (issued BY PurePak to a customer) ===',
  'Fixed layout, top to bottom:',
  '1. Top: PurePak logo + brand "PURE PAK" on the left; a printed serial number on the right (e.g. 1001).',
  '2. Customer box: pre-printed labels "Name :", "PH NO :", "Address:" with handwritten values after the colon (may be blank).',
  '3. Item table, header "It.No | Qty | Rate | Amount". It.No lists bottle sizes 500ml, 1.5L, 6L, 12L, 19L in that order. Qty, Rate (price per bottle) and Amount (Qty x Rate) may be handwritten; blank rows have no numbers.',
  '4. A blue "Total" row — value cell may be written or blank.',
  '5. A "Rupees in Word:" line; the word "Pending" handwritten near it means the bill is unpaid.',
  'Return exactly:',
  '{"type":"purepak","receipt_no":"<serial top-right>","customer_name":"<after Name :>","customer_phone":"<after PH NO : or null>","customer_address":"<after Address: or null>","items":[{"size":"500ml","qty":10,"rate":910,"amount":9100}],"total":<blue Total cell number or null>,"payment_status":"pending" | null,"amount_in_words":"<or null>","confidence":0.0-1.0}',
  'items: include ONLY size rows with at least one handwritten number; null for missing numbers. If Total is blank, total = null. Never confuse the serial number with a quantity or amount.',
  '',
  '=== TYPE B — ANY other receipt / bill / invoice / cash memo ===',
  'This covers: a supplier or shop bill to PurePak (bottles, caps, chemicals, packaging), a fuel/petrol receipt, a utility bill (electricity, water, gas, internet), rent, vehicle repair, a restaurant/general-store cash memo, a salary/wage slip, a bank deposit slip, or a sales invoice PurePak issued to a business customer on a non-book format.',
  'Return exactly:',
  '{"type":"generic",',
  ' "doc_kind":"sales_invoice" | "purchase_bill" | "cash_memo" | "utility_bill" | "fuel" | "rent" | "vehicle" | "salary_slip" | "bank_slip" | "other",',
  ' "direction":"money_in" | "money_out",   // money_in = PurePak received or sold; money_out = PurePak paid or bought',
  ' "party":"<the OTHER party: the buyer if PurePak sold, the vendor/biller if PurePak paid; or null>",',
  ' "date":"<YYYY-MM-DD or null>",',
  ' "reference_no":"<invoice / bill / receipt / meter reference number, or null>",',
  ' "currency":"<3-letter code, usually PKR>",',
  ' "subtotal":<number or null>, "tax":<number or null>, "total":<grand total number>,',
  ' "line_items":[{"item":"<description>","qty":<number or null>,"unit_price":<number or null>,"amount":<line total or null>}],',
  ' "notes":"<short note if the receipt says something important e.g. \'advance\', \'balance due 15th\', \'paid via JazzCash\'; else null>",',
  ' "confidence":0.0-1.0}',
  'Guidance for direction: if the header/logo is PurePak and it lists a customer being billed for water -> money_in. If it is from a supplier, shop, petrol pump, utility company, landlord or is a salary slip -> money_out.',
  'total is the final payable/received amount in the receipt currency. Strip currency symbols and thousands separators (write 9100 not "Rs 9,100").',
  '',
  'Respond with ONLY the JSON object. No markdown, no prose, no code fences.',
].join('\n');

// resolved once: settings key wins, else GEMINI_API_KEY env (set via the platform)
function geminiKey() { return setting('gemini_api_key') || process.env.GEMINI_API_KEY || null; }

async function extractReceipt(apiKey, imagePath) {
  const b64 = fs.readFileSync(imagePath).toString('base64');
  const ext = imagePath.endsWith('.png') ? 'png' : 'jpeg';
  // gemini-3.6-flash is the current default (2.x models are 404 for new keys).
  // It's a "thinking" model, so give a generous output budget and cap thinking,
  // or the answer JSON gets truncated (finishReason MAX_TOKENS -> empty text).
  const model = setting('gemini_model') || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
  const body = {
    contents: [{
      parts: [
        { text: PUREPAK_RECEIPT_PROMPT },
        { inline_data: { mime_type: 'image/' + ext, data: b64 } },
      ],
    }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 256 },
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Gemini ' + res.status + ' (' + (await res.text().catch(() => '')).slice(0, 200) + ')');
  const out = await res.json();
  const cand = out?.candidates?.[0];
  const text = (cand?.content?.parts || []).map(p => p.text).filter(Boolean).join('');
  if (!text) throw new Error('Gemini empty response (finish=' + (cand?.finishReason || '?') + ')');
  // strip any code fences the model may add
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON in Gemini response');
  const parsed = JSON.parse(m[0]);
  // tolerate "Rs 9,100", "9100/-", "$120.50", plain numbers, or nonsense -> null
  const money = (v) => {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    const s = String(v).replace(/[^\d.\-]/g, '');
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  };
  const isoDate = (v) => {
    if (!v) return null;
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    return isNaN(d) ? null : d.toISOString().slice(0, 10);
  };

  if (parsed.type === 'purepak') {
    const SIZES = ['500ml', '1.5L', '6L', '12L', '19L'];
    let items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map(it => ({
        size: SIZES.find(s => String(it.size || '').toLowerCase().includes(s.toLowerCase())) || String(it.size || 'item'),
        qty: money(it.qty), rate: money(it.rate), amount: money(it.amount),
      }))
      .filter(it => it.qty != null || it.rate != null || it.amount != null)
      .map(it => ({ ...it, amount: it.amount != null ? it.amount : (it.qty != null && it.rate != null ? it.qty * it.rate : null) }));
    let total = money(parsed.total);
    if (total == null) total = items.reduce((s, it) => s + (it.amount || 0), 0) || null;
    return {
      type: 'purepak',
      doc_kind: 'sales_invoice',
      direction: 'money_in',
      suggested_kind: 'sales',
      receipt_no: parsed.receipt_no != null ? String(parsed.receipt_no) : null,
      reference_no: parsed.receipt_no != null ? String(parsed.receipt_no) : null,
      customer_name: parsed.customer_name || null,
      customer_phone: parsed.customer_phone || null,
      customer_address: parsed.customer_address || null,
      items,
      total,
      total_from: money(parsed.total) != null ? 'written' : 'summed',
      payment_status: String(parsed.payment_status || '').toLowerCase() === 'pending' ? 'pending' : null,
      amount_in_words: parsed.amount_in_words || null,
      // generic mirror so cards / ledger / review all keep working
      vendor: parsed.customer_name || 'PurePak sale',
      date: null,
      amount: total,
      line_items: items.map(it => ({ item: it.size, qty: it.qty, unit_price: it.rate, price: it.rate, amount: it.amount })),
      currency: 'PKR',
      confidence: money(parsed.confidence),
    };
  }

  // ---- generic: any bill / invoice / memo, sales OR purchase ----
  const dir = parsed.direction === 'money_in' ? 'money_in' : (parsed.direction === 'money_out' ? 'money_out' : null);
  const docKind = String(parsed.doc_kind || 'other');
  // map to the app's receipt kinds (expense | income | sales | agent_commission | other)
  let suggested_kind = 'expense';
  if (dir === 'money_in') suggested_kind = docKind === 'sales_invoice' || docKind === 'cash_memo' ? 'sales' : 'income';
  else if (dir === 'money_out') suggested_kind = 'expense';
  else if (docKind === 'sales_invoice') suggested_kind = 'sales';
  const lineItems = (Array.isArray(parsed.line_items) ? parsed.line_items : []).map(it => {
    const qty = money(it.qty), unit = money(it.unit_price != null ? it.unit_price : it.price);
    const amount = money(it.amount) != null ? money(it.amount) : (qty != null && unit != null ? qty * unit : null);
    return { item: String(it.item || it.description || 'item'), qty, unit_price: unit, price: unit, amount };
  }).filter(it => it.item || it.amount != null || it.qty != null);
  let total = money(parsed.total);
  if (total == null) {
    const sub = money(parsed.subtotal), tax = money(parsed.tax);
    if (sub != null) total = sub + (tax || 0);
    else { const s = lineItems.reduce((a, it) => a + (it.amount || 0), 0); total = s || null; }
  }
  return {
    type: 'generic',
    doc_kind: docKind,
    direction: dir,
    suggested_kind,
    party: parsed.party || parsed.vendor || null,
    vendor: parsed.party || parsed.vendor || null,   // keep `vendor` for existing UI
    date: isoDate(parsed.date),
    reference_no: parsed.reference_no != null ? String(parsed.reference_no) : null,
    currency: (parsed.currency || 'PKR').toString().toUpperCase().slice(0, 3),
    subtotal: money(parsed.subtotal),
    tax: money(parsed.tax),
    amount: total != null && total > 0 ? total : null,
    total: total != null && total > 0 ? total : null,
    line_items: lineItems,
    notes: parsed.notes || null,
    confidence: money(parsed.confidence),
  };
}

function commissionsFor(agentId) {
  return db.prepare(`SELECT com.*, o.total AS order_total, c.name AS customer
                     FROM commissions com JOIN orders o ON o.id=com.order_id
                     LEFT JOIN customers c ON c.id=o.customer_id
                     WHERE com.agent_id=? ORDER BY com.created_at DESC`).all(agentId);
}

function kpis() {
  const money = (rows) => rows.reduce((s, r) => s + (Number(r.v) || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const todayOrders = db.prepare('SELECT COUNT(*) c FROM orders WHERE date(placed_at)=?').get(today).c;
  const monthRevenue = money([db.prepare(`SELECT SUM(amount) v FROM ledger WHERE type='income' AND strftime('%Y-%m',at)=?`).get(month)]);
  const monthExpenses = money([db.prepare(`SELECT SUM(amount) v FROM ledger WHERE type='expense' AND strftime('%Y-%m',at)=?`).get(month)]);
  const outstanding = db.prepare(`SELECT COALESCE(SUM(total-paid),0) v FROM orders WHERE status NOT IN ('cancelled','delivered') AND total>paid`).all()[0].v;
  const unpaidAgent = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM commissions WHERE status='accrued'`).all()[0].v;
  const openOrders = db.prepare(`SELECT COUNT(*) c FROM orders WHERE status IN ('new','confirmed','in_delivery')`).get().c;
  const openDeliveries = db.prepare(`SELECT COUNT(*) c FROM deliveries WHERE status IN ('pending','out_for_delivery')`).get().c;
  const unitsMonth = db.prepare(`SELECT COALESCE(SUM(oi.qty),0) c FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE strftime('%Y-%m',o.placed_at)=?`).get(month).c;
  return {
    today_orders: todayOrders,
    open_orders: openOrders,
    open_deliveries: openDeliveries,
    units_month: unitsMonth,
    month_revenue: Math.round(monthRevenue),
    month_expenses: Math.round(monthExpenses),
    month_profit: Math.round(monthRevenue - monthExpenses),
    outstanding_customers: Math.round(outstanding),
    outstanding_agents: Math.round(unpaidAgent),
  };
}

function monthlySeries(months = 6) {
  const now = new Date();
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('en', { month: 'short', year: '2-digit' });
    const inc = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM ledger WHERE type='income' AND strftime('%Y-%m',at)=?`).get(key).v;
    const exp = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM ledger WHERE type='expense' AND strftime('%Y-%m',at)=?`).get(key).v;
    out.push({ month: key, label, income: Math.round(inc), expense: Math.round(exp) });
  }
  return out;
}

// ---------- SSE: live event stream per user ----------
// Single Node process => a Map of open event streams is enough for realtime.
const SSE = new Map(); // user.id -> Set<res>
function sseSend(userId, event) {
  const set = SSE.get(userId);
  if (!set || !set.size) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`;
  for (const res of set) { try { res.write(payload); } catch {} }
}
function sseSendMany(userIds, event) {
  for (const id of new Set(userIds.filter(Boolean))) sseSend(id, event);
}
// Truly portal-wide changes only: the PRICE LIST. Every signed-in account sees
// prices (customers their own, staff the matrix), so a price edit legitimately
// refreshes every open shop. Order / customer events are targeted (sseSendMany)
// so one customer's order never disturbs another customer's screen.
function sseBroadcast(event, exceptUserId) {
  const payload = `event: ${event}\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`;
  for (const [uid, set] of SSE) {
    if (uid === exceptUserId) continue;
    for (const res of set) { try { res.write(payload); } catch {} }
  }
}
function officeUserIds() {
  // company accounts + every agent's login — the people who act on orders/customers
  return db.prepare(`SELECT id FROM users WHERE status='active' AND (role IN ('admin','manager','shop_manager','finance') OR agent_id IS NOT NULL)`).all().map(r => r.id);
}
function sseOpen(userId, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no', // stop nginx/Traefik/CDN from buffering the stream
  });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  res.write('retry: 3000\n\n');
  res.write(`event: hello\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  let set = SSE.get(userId);
  if (!set) { set = new Set(); SSE.set(userId, set); }
  set.add(res);
  const hb = setInterval(() => { try { res.write(': hb\n\n'); } catch {} }, 25000);
  res.on('close', () => {
    clearInterval(hb);
    const s = SSE.get(userId);
    if (s) { s.delete(res); if (!s.size) SSE.delete(userId); }
  });
}

// ---------- route handler ----------
async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api', resource...]
  const method = req.method;
  const user = authUser(req);

  // Live event stream (realtime fan-out for the notification bell + views).
  // EventSource cannot set custom headers, so the token may arrive as ?token=
  // (browser) or the Authorization header (curl/tests).
  if (method === 'GET' && parts[1] === 'events') {
    let evUser = user;
    if (!evUser) {
      const qtok = url.searchParams.get('token');
      // reuse the same 'Bearer ' prefix authUser() compares against
      if (qtok) evUser = authUser({ headers: { authorization: 'Bearer ' + qtok } });
    }
    if (!evUser) return err(res, 401, 'Not authenticated');
    return sseOpen(evUser.id, res);
  }

  // Public: login + signup + me (me needs token but is fine)
  if (method === 'POST' && parts[1] === 'auth' && parts[2] === 'login') {
    const b = await readBody(req);
    const u = db.prepare(`SELECT * FROM users WHERE email=? AND active=1`).get(String(b.email || '').trim().toLowerCase());
    if (!u || !verifyPassword(String(b.password || ''), u.password_hash))
      return err(res, 401, 'Invalid email or password');
    if (u.status === 'disabled') return err(res, 401, 'Account disabled — contact your manager');
    if (u.status === 'pending') {
      // allow the pending staff member to log in and see the activation screen
      const token = newSession(u);
      return json(res, 200, { token, user: userView(u), pending: true });
    }
    db.prepare(`UPDATE users SET last_login_at=? WHERE id=?`).run(new Date().toISOString().slice(0, 19).replace('T', ' '), u.id);
    const token = newSession(u);
    return json(res, 200, { token, user: userView(u), pending: false });
  }
  if (method === 'POST' && parts[1] === 'auth' && parts[2] === 'signup') {
    const b = await readBody(req);
    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const phone = String(b.phone || '').trim() || null;
    const password = String(b.password || '');
    // Public self-signup creates a customer account — EXCEPT on a brand-new database,
    // where the very first account becomes the owner (admin) so the system can be managed.
    const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    const role = userCount === 0 ? 'admin' : 'customer';
    if (name.length < 2) return err(res, 400, 'Please enter your full name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(res, 400, 'Please enter a valid email');
    if (password.length < 6) return err(res, 400, 'Password must be at least 6 characters');
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
      return err(res, 409, 'An account with this email already exists');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let custId = null;
    if (role === 'customer') {
      const cr = db.prepare('INSERT INTO customers(name,phone,type) VALUES (?,?,?)').run(name, phone || '', 'retail');
      custId = Number(cr.lastInsertRowid);
    }
    const ur = db.prepare(`INSERT INTO users(name,email,phone,password_hash,role,agent_id,customer_id,status,created_at)
                            VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(name, email, phone, hashPassword(password), role, null, custId, 'active', now);
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(Number(ur.lastInsertRowid));
    const token = newSession(u);
    return json(res, 201, { pending: false, token, user: userView(u), first_setup: role === 'admin' });
  }
  if (method === 'GET' && parts[1] === 'auth' && parts[2] === 'me') {
    if (!user) return err(res, 401, 'Not authenticated');
    return json(res, 200, userView(user));
  }
  if (method === 'GET' && parts[1] === 'auth' && parts[2] === 'logout') {
    const h = req.headers['authorization'] || '';
    if (h.startsWith('Bearer ')) SESSIONS.delete(h.slice(7));
    return json(res, 200, { ok: true });
  }

  // ---- team / user management (admin + manager) ----
  const canManage = ['admin', 'manager'].includes(user?.role || '');
  if (method === 'GET' && parts[1] === 'users' && parts.length === 2) {
    if (!canManage) return err(res, 403, 'Forbidden');
    const rows = db.prepare(`
      SELECT u.*, a.name AS agent_name, c.name AS customer_name, c.type AS customer_type
      FROM users u
      LEFT JOIN agents a ON a.id = u.agent_id
      LEFT JOIN customers c ON c.id = u.customer_id
      ORDER BY u.role, u.name`).all();
    return json(res, 200, rows.map(userView).map(u => ({ ...u,
      agentName: u.agentName, customerName: u.customerName })));
  }
  if (method === 'POST' && parts[1] === 'users' && parts.length === 2) {
    if (!canManage) return err(res, 403, 'Forbidden');
    const b = await readBody(req);
    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const phone = String(b.phone || '').trim() || null;
    const password = String(b.password || '');
    let role = ['admin', 'manager', 'shop_manager', 'finance', 'delivery', 'employee', 'agent', 'customer'].includes(b.role) ? b.role : null;
    if (name.length < 2) return err(res, 400, 'Please enter a name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(res, 400, 'Please enter a valid email');
    if (password.length < 6) return err(res, 400, 'Password must be at least 6 characters');
    if (!role) return err(res, 400, 'Please choose a role');
    if (user.role !== 'admin' && (role === 'admin' || role === 'manager'))
      return err(res, 403, 'Only an admin can create admin/manager accounts');
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
      return err(res, 409, 'An account with this email already exists');
    const salary = role === 'agent' ? null : (b.salary != null && b.salary !== '' ? Number(b.salary) : null);
    let agentId = null, custId = null;
    if (role === 'agent') {
      const ar = db.prepare('INSERT INTO agents(name,phone,commission_pct) VALUES (?,?,5)').run(name, phone);
      agentId = Number(ar.lastInsertRowid);
    }
    if (role === 'customer') {
      const cr = db.prepare('INSERT INTO customers(name,phone,type) VALUES (?,?,?)').run(name, phone || '', 'retail');
      custId = Number(cr.lastInsertRowid);
    }
    // customer accounts are ready immediately; staff accounts start pending
    // until the manager/admin activates them from Team.
    const status = role === 'customer' ? 'active' : 'pending';
    const ur = db.prepare(`INSERT INTO users(name,email,phone,password_hash,role,salary,agent_id,customer_id,status)
                            VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(name, email, phone, hashPassword(password), role, salary, agentId, custId, status);
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(Number(ur.lastInsertRowid));
    notify(staffUserIds().filter(x => x !== user.id), 'team', 'New employee added',
      name + ' added as ' + role + ' by ' + user.name + '.' + (status === 'pending' ? ' Activate them from Team.' : ''), 'user#' + u.id);
    return json(res, 201, userView(u));
  }
  if (parts[1] === 'users' && parts.length === 3 && !isNaN(+parts[2]) && method === 'PATCH') {
    if (!canManage) return err(res, 403, 'Forbidden');
    const id = +parts[2];
    const cur = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    if (!cur) return err(res, 404, 'User not found');
    const b = await readBody(req);
    const changes = [];
    let role = cur.role, salary = cur.salary, status = cur.status, phone = cur.phone, name = cur.name;
    if (b.role !== undefined && b.role !== cur.role) {
      if (!['admin', 'manager', 'shop_manager', 'finance', 'delivery', 'employee', 'agent', 'customer'].includes(b.role))
        return err(res, 400, 'Invalid role');
      if (user.role !== 'admin' && ['admin', 'manager'].includes(b.role))
        return err(res, 403, 'Only an admin can assign admin/manager roles');
      if (user.role !== 'admin' && ['admin', 'manager'].includes(cur.role))
        return err(res, 403, 'Only an admin can change admin/manager accounts');
      role = b.role; changes.push('role ' + cur.role + ' → ' + role);
    }
    if (b.salary !== undefined && b.salary !== cur.salary) {
      salary = b.salary === '' || b.salary == null ? null : Number(b.salary);
      changes.push('salary ' + (cur.salary || 0) + ' → ' + salary);
    }
    if (b.status !== undefined && b.status !== cur.status) {
      if (!['pending', 'active', 'disabled'].includes(b.status)) return err(res, 400, 'Invalid status');
      if (cur.role === 'admin' && b.status !== 'active' &&
          db.prepare(`SELECT COUNT(*) c FROM users WHERE role='admin' AND status='active'`).get().c <= 1)
        return err(res, 400, 'Cannot disable the last active admin');
      if (cur.id === user.id && b.status === 'disabled')
        return err(res, 400, 'You cannot disable your own account');
      status = b.status; changes.push('status ' + cur.status + ' → ' + status);
    }
    if (b.phone !== undefined) phone = String(b.phone || '').trim() || null;
    if (b.name !== undefined && String(b.name).trim().length >= 2) name = String(b.name).trim();
    db.prepare('UPDATE users SET role=?, salary=?, status=?, phone=?, name=? WHERE id=?')
      .run(role, salary, status, phone, name, id);
    // keep session in sync for the target user
    if (cur.id === user.id) { user.role = role; user.salary = salary; user.status = status; user.name = name; user.phone = phone; }
    if (changes.length) {
      notify([cur.id, ...staffUserIds()].filter(x => x !== user.id), 'team',
        'Employee updated: ' + name, name + ' — ' + changes.join(', ') + ' (by ' + user.name + ').', 'user#' + id);
    }
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    return json(res, 200, userView(u));
  }
  if (method === 'POST' && parts[1] === 'users' && parts.length === 4 && parts[3] === 'reset-password') {
    if (!canManage) return err(res, 403, 'Forbidden');
    const id = +parts[2];
    const cur = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    if (!cur) return err(res, 404, 'User not found');
    const temp = 'purepak' + crypto.randomInt(1000, 9999);
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(temp), id);
    notify([cur.id], 'team', 'Your password was reset',
      'A manager set a new temporary password for your account. Use it to sign in, then change it.', 'user#' + id);
    return json(res, 200, { temporary_password: temp });
  }

  // ---- catalog (any authenticated; admins/managers also see inactive for re-enabling) ----
  if (method === 'GET' && parts[1] === 'products') {
    requireRole(user, ['admin', 'manager', 'shop_manager', 'agent', 'finance', 'delivery', 'customer']);
    const all = user && ['admin', 'manager'].includes(user.role);
    const rows = all
      ? db.prepare('SELECT * FROM products').all()
      : db.prepare('SELECT * FROM products WHERE active=1').all();
    const out = rows.map(p => {
      const o = { ...p };
      // per-type overrides (already nested by the pricing matrix)
      o.prices = {};
      for (const t of (db.prepare('SELECT name FROM customer_types').all().map(r => r.name))) {
        const r = db.prepare('SELECT price FROM product_prices WHERE product_id=? AND customer_type=?').get(p.id, t);
        o.prices[t] = (r && r.price != null) ? r.price : null;
      }
      // effective price the caller actually pays (their type; base for staff)
      o.effective_price = priceForCustomer(p.id, user && user.customer_id
        ? db.prepare('SELECT type FROM customers WHERE id=?').get(user.customer_id)?.type || null
        : null);
      return o;
    });
    return json(res, 200, out);
  }
  if (method === 'POST' && parts[1] === 'products') {
    const u = requireRole(user, ['admin', 'manager']);
    const b = await readBody(req);
    if (!b.name || !(Number(b.size_ml) > 0) || !(Number(b.price) >= 0)) return err(res, 400, 'name, size_ml, price required');
    const r = db.prepare('INSERT INTO products(name,size_ml,price,description) VALUES (?,?,?,?)')
      .run(b.name, b.size_ml, b.price, b.description || null);
    sseBroadcast('pricing'); // new product shows up on every open catalog/shop
    return json(res, 201, db.prepare('SELECT * FROM products WHERE id=?').get(r.lastInsertRowid));
  }
  if (method === 'PATCH' && parts[1] === 'products' && parts.length === 3 && !isNaN(+parts[2])) {
    requireRole(user, ['admin', 'manager']);
    const b = await readBody(req);
    const cur = db.prepare('SELECT * FROM products WHERE id=?').get(+parts[2]);
    if (!cur) return err(res, 404, 'Product not found');
    db.prepare(`UPDATE products SET name=?, size_ml=?, price=?, description=?, active=? WHERE id=?`).run(
      b.name != null ? String(b.name).trim() || cur.name : cur.name,
      b.size_ml != null && Number(b.size_ml) > 0 ? Number(b.size_ml) : cur.size_ml,
      b.price !== undefined && Number(b.price) >= 0 ? Number(b.price) : cur.price,
      b.description !== undefined ? (b.description || null) : cur.description,
      b.active !== undefined ? (b.active ? 1 : 0) : cur.active,
      +parts[2]);
    if (b.price !== undefined && Number(b.price) >= 0 && Number(b.price) !== cur.price)
      notify(staffUserIds().filter(x => x !== user.id), 'pricing', 'Base price changed',
        cur.name + ' base price ' + cur.price + ' → ' + Number(b.price) + ' (by ' + user.name + ').', 'product#' + cur.id);
    sseBroadcast('pricing'); // price / availability change reaches every open shop live
    return json(res, 200, db.prepare('SELECT * FROM products WHERE id=?').get(+parts[2]));
  }

  // ---- customers ----
  if (method === 'GET' && parts[1] === 'customers') {
    requireRole(user, ['admin', 'manager', 'shop_manager', 'agent', 'finance']);
    if (user.role === 'agent') {
      return json(res, 200, db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.id AND o.agent_id=?) AS orders_count
                                        FROM customers c WHERE c.id IN (SELECT DISTINCT customer_id FROM orders WHERE agent_id=?)
                                        ORDER BY c.name`).all(user.agent_id, user.agent_id));
    }
    return json(res, 200, db.prepare('SELECT c.*, (SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.id) AS orders_count FROM customers c ORDER BY c.name').all());
  }
  if (method === 'POST' && parts[1] === 'customers') {
    requireRole(user, ['admin', 'manager']);
    const b = await readBody(req);
    if (!b.name || !b.phone) return err(res, 400, 'name and phone required');
    const types = db.prepare('SELECT name FROM customer_types').all().map(r => r.name);
    const type = types.includes(b.type) ? b.type : 'retail';
    const r = db.prepare('INSERT INTO customers(name,contact_name,phone,email,address,area,type) VALUES (?,?,?,?,?,?,?)')
      .run(b.name, b.contact_name || null, b.phone, b.email || null, b.address || null, b.area || null, type);
    sseSendMany(officeUserIds().filter(x => x !== user.id), 'customer'); // office only
    return json(res, 201, db.prepare('SELECT * FROM customers WHERE id=?').get(r.lastInsertRowid));
  }
  if (method === 'PATCH' && parts[1] === 'customers' && parts.length === 3 && !isNaN(+parts[2])) {
    const cid = +parts[2];
    // a customer may edit ONLY their own contact details (never their pricing type)
    const ownRecord = user && user.role === 'customer' && user.customer_id === cid;
    if (!ownRecord) requireRole(user, ['admin', 'manager', 'finance']);
    const b = await readBody(req);
    const cur = db.prepare('SELECT * FROM customers WHERE id=?').get(cid);
    if (!cur) return err(res, 404, 'Customer not found');
    const types = db.prepare('SELECT name FROM customer_types').all().map(r => r.name);
    const wantType = !ownRecord && b.type && types.includes(b.type) ? b.type : cur.type;
    db.prepare(`UPDATE customers SET name=?, contact_name=?, phone=?, email=?, address=?, area=?, type=? WHERE id=?`)
      .run(ownRecord ? cur.name : (b.name != null ? String(b.name).trim() || cur.name : cur.name),
        b.contact_name !== undefined ? (b.contact_name || null) : cur.contact_name,
        b.phone != null ? String(b.phone).trim() || cur.phone : cur.phone,
        b.email !== undefined ? (b.email || null) : cur.email,
        b.address !== undefined ? (b.address || null) : cur.address,
        b.area !== undefined ? (b.area || null) : cur.area,
        wantType,
        cid);
    b.type = wantType; // downstream checks use b.type
    sseSendMany(officeUserIds().filter(x => x !== user.id), 'customer'); // office only
    // a customer-type change reprices that ONE customer's catalog — nudge only their shop
    if (b.type && types.includes(b.type) && b.type !== cur.type) {
      const cu = db.prepare('SELECT id FROM users WHERE customer_id=?').get(+parts[2]);
      if (cu) sseSend(cu.id, 'pricing');
    }
    return json(res, 200, db.prepare('SELECT * FROM customers WHERE id=?').get(+parts[2]));
  }

  // ---- customer types + pricing matrix ----
  if (method === 'GET' && parts[1] === 'customer-types') {
    return json(res, 200, db.prepare('SELECT name FROM customer_types ORDER BY name').all().map(r => r.name));
  }
  if (method === 'GET' && parts[1] === 'pricing') {
    const products = db.prepare('SELECT * FROM products ORDER BY size_ml').all();
    const prices = db.prepare('SELECT * FROM product_prices').all();
    const byProd = {};
    for (const p of prices) (byProd[p.product_id] = byProd[p.product_id] || {})[p.customer_type] = p.price;
    const types = db.prepare('SELECT name FROM customer_types').all().map(r => r.name);
    return json(res, 200, products.map(p => ({
      id: p.id, name: p.name, size_ml: p.size_ml, price: p.price, active: p.active,
      prices: Object.assign(Object.fromEntries(types.map(t => [t, null])), byProd[p.id] || {}),
    })));
  }
  if (method === 'POST' && parts[1] === 'pricing') {
    requireRole(user, ['admin', 'manager']);
    const b = await readBody(req);
    const rows = Array.isArray(b) ? b : (b.rows || []);
    const types = db.prepare('SELECT name FROM customer_types').all().map(r => r.name);
    let n = 0;
    for (const r of rows) {
      const pid = Number(r.product_id), ct = String(r.customer_type || ''), price = r.price;
      if (!db.prepare('SELECT id FROM products WHERE id=?').get(pid)) continue;
      if (!types.includes(ct)) continue;
      if (price === null || price === '') {
        db.prepare('DELETE FROM product_prices WHERE product_id=? AND customer_type=?').run(pid, ct);
      } else {
        const v = Number(price);
        if (!(v >= 0)) continue;
        db.prepare(`INSERT INTO product_prices(product_id,customer_type,price) VALUES (?,?,?)
                    ON CONFLICT(product_id,customer_type) DO UPDATE SET price=excluded.price`).run(pid, ct, v);
      }
      n++;
    }
    if (n) {
      notify(staffUserIds().filter(x => x !== user.id), 'pricing', 'Price list updated',
        n + ' price override(s) updated by ' + user.name + '. Applies to new orders.', 'product#0');
      // every signed-in account (customers see their own type's prices, agents/
      // staff see the matrix) gets the refreshed price list in realtime
      sseBroadcast('pricing');
    }
    return json(res, 200, { updated: n });
  }

  // ---- orders ----
  if (method === 'GET' && parts[1] === 'orders' && parts.length === 2) {
    requireRole(user, ['admin', 'manager', 'shop_manager', 'agent', 'finance', 'delivery', 'customer']);
    const filter = { role: user.role, status: url.searchParams.get('status') };
    if (user.role === 'customer') filter.customerId = user.customer_id;
    if (user.role === 'agent') filter.agentId = user.agent_id;
    return json(res, 200, listOrders(filter));
  }
  if (method === 'GET' && parts[1] === 'orders' && parts.length === 3 && !isNaN(+parts[2])) {
    requireRole(user, ['admin', 'manager', 'shop_manager', 'agent', 'finance', 'delivery', 'customer']);
    const o = db.prepare(Q.orders + ' WHERE o.id=?').get(+parts[2]);
    if (!o) return err(res, 404, 'Order not found');
    if (user.role === 'customer' && o.customer_id !== user.customer_id) return err(res, 403, 'Forbidden');
    if (user.role === 'agent' && o.agent_id !== user.agent_id) return err(res, 403, 'Forbidden');
    o.items = db.prepare('SELECT oi.*, p.name AS product_name FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?').all(o.id);
    o.deliveries = db.prepare('SELECT * FROM deliveries WHERE order_id=? ORDER BY id').all(o.id);
    return json(res, 200, o);
  }
  if (method === 'POST' && parts[1] === 'orders') {
    requireRole(user, ['admin', 'manager', 'shop_manager', 'agent', 'customer']);
    const b = await readBody(req);
    let custId;
    if (user.role === 'customer') custId = user.customer_id;
    else custId = b.customer_id;
    const cust = custId && db.prepare('SELECT * FROM customers WHERE id=?').get(custId);
    if (!cust) return err(res, 400, 'customer_id invalid');
    // a self-serve customer must have a delivery address + phone on file before ordering
    if (user.role === 'customer' && (!cust.address || !String(cust.address).trim() || !cust.phone || !String(cust.phone).trim()))
      return err(res, 400, 'Add a delivery address and phone number to your profile before placing an order');
    const items = Array.isArray(b.items) ? b.items : [];
    let total = 0;
    const prepared = items.map(it => {
      const p = db.prepare('SELECT * FROM products WHERE id=?').get(it.product_id);
      if (!p) throw httpError(400, 'Unknown product ' + it.product_id);
      const qty = Math.max(1, Math.round(Number(it.qty) || 1));
      // price per the customer's type (matrix override), else base price
      const price = priceForCustomer(p.id, cust.type);
      total += qty * price;
      return [p.id, qty, price, qty * price];
    });
    if (!prepared.length) return err(res, 400, 'At least one item required');
    let agentId = b.agent_id || null;
    if (user.role === 'agent') agentId = user.agent_id;
    if (user.role === 'customer' && agentId) agentId = b.agent_id; // admin/agent pick; customer optional
    const method = PAY_METHOD_IDS.has(b.payment_method) ? b.payment_method : 'cod';
    const r = db.prepare('INSERT INTO orders(customer_id,agent_id,status,total,paid,payment_status,payment_method,notes) VALUES (?,?,?,?,?,?,?,?)')
      .run(custId, agentId, 'new', total, 0, 'unpaid', method, b.notes || null);
    const orderId = r.lastInsertRowid;
    const insOI = db.prepare('INSERT INTO order_items(order_id,product_id,qty,unit_price,line_total) VALUES (?,?,?,?,?)');
    for (const row of prepared) insOI.run(orderId, ...row);
    // Every new order notifies the office — admin + manager + shop manager +
    // finance always, plus the assigned agent — so it lands in their feed live.
    {
      const targets = new Set(orderStaffUserIds().filter(x => x !== user.id));
      if (agentId) {
        // the agent's login account is a users row that points back at this agent
        const ag = db.prepare(`SELECT id FROM users WHERE agent_id=? AND status='active'`).get(agentId);
        if (ag && ag.id !== user.id) targets.add(ag.id);
      }
      const units = prepared.reduce((s, row) => s + row[1], 0);
      notify([...targets], 'order', 'New order received',
        `${cust.name} · ${units} ${units === 1 ? 'bottle' : 'bottles'} · Rs ${total}`, 'order#' + orderId);
    }
    // nudge only the office + agents to refresh their boards — NOT other customers
    sseSendMany(officeUserIds().filter(x => x !== user.id), 'order');
    return json(res, 201, db.prepare(Q.orders + ' WHERE o.id=?').get(orderId));
  }
  if (method === 'PATCH' && parts[1] === 'orders' && parts.length === 3 && !isNaN(+parts[2])) {
    const oid = +parts[2];
    const cur = db.prepare('SELECT * FROM orders WHERE id=?').get(oid);
    if (!cur) return err(res, 404, 'Order not found');
    const b = await readBody(req);

    if (b.status !== undefined) {
      const u = requireRole(user, ['admin', 'manager', 'shop_manager', 'delivery', 'agent']);
      if (user.role === 'customer') throw httpError(403, 'Forbidden');
      if (user.role === 'agent' && cur.agent_id !== user.agent_id) throw httpError(403, 'Not your order');
      const allowed = { new: ['confirmed', 'cancelled'], confirmed: ['in_delivery', 'cancelled', 'new'],
                        in_delivery: ['delivered', 'cancelled'], delivered: [], cancelled: [] };
      if (!allowed[cur.status] || !allowed[cur.status].includes(b.status))
        return err(res, 400, `Cannot move ${cur.status} -> ${b.status}`);
      db.prepare('UPDATE orders SET status=? WHERE id=?').run(b.status, oid);
      const openDelivery = db.prepare(`SELECT * FROM deliveries WHERE order_id=? AND status IN ('pending','out_for_delivery') ORDER BY id DESC LIMIT 1`).get(oid);
      if (b.status === 'confirmed' && !openDelivery) {
        // confirming an order puts it straight on the delivery team's board (pending)
        db.prepare(`INSERT INTO deliveries(order_id,driver,vehicle,status,scheduled_at) VALUES (?,?,?,?,?)`)
          .run(oid, b.driver || 'Unassigned', b.vehicle || null, 'pending',
            b.scheduled_at || new Date(Date.now() + 864e5).toISOString().slice(0, 19).replace('T', ' '));
      }
      if (b.status === 'in_delivery') {
        if (openDelivery) {
          db.prepare(`UPDATE deliveries SET status='out_for_delivery', driver=CASE WHEN driver='Unassigned' AND ? IS NOT NULL THEN ? ELSE driver END WHERE id=?`)
            .run(b.driver || null, b.driver || null, openDelivery.id);
        } else {
          db.prepare(`INSERT INTO deliveries(order_id,driver,vehicle,status,scheduled_at) VALUES (?,?,?,?,?)`)
            .run(oid, b.driver || 'Unassigned', b.vehicle || null, 'out_for_delivery', b.scheduled_at || new Date().toISOString().slice(0, 19).replace('T', ' '));
        }
      }
      if (b.status === 'delivered') {
        db.prepare(`UPDATE deliveries SET status='delivered', delivered_at=datetime('now') WHERE order_id=? AND status IN ('pending','out_for_delivery')`).run(oid);
      }
      if (b.status === 'cancelled') {
        db.prepare(`UPDATE deliveries SET status='failed' WHERE order_id=? AND status IN ('pending','out_for_delivery')`).run(oid);
      }
      // Notify the customer, the assigned agent, the delivery team, and staff
      {
        const cust = db.prepare('SELECT c.*, u.id AS uid FROM customers c LEFT JOIN users u ON u.customer_id=c.id WHERE c.id=?').get(cur.customer_id);
        const titles = { confirmed: 'Order confirmed', in_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Order cancelled' };
        if (cust && cust.uid) {
          const bodies = { confirmed: `Order #${oid} has been confirmed.`, in_delivery: `Order #${oid} is out for delivery.`, delivered: `Order #${oid} has been delivered.`, cancelled: `Order #${oid} was cancelled.` };
          const t = titles[b.status];
          if (t) notify([cust.uid], 'order', t, bodies[b.status], `order#${oid}`);
        }
        // the agent who booked the order
        if (cur.agent_id && titles[b.status]) {
          const ag = db.prepare(`SELECT id FROM users WHERE agent_id=? AND status='active'`).get(cur.agent_id);
          if (ag && ag.id !== user.id) notify([ag.id], 'order', `Order #${oid} — ${titles[b.status].toLowerCase()}`, `${cust ? cust.name : 'Customer'}`, `order#${oid}`);
        }
        if (b.status === 'confirmed' || b.status === 'in_delivery') {
          const drivers = db.prepare(`SELECT id FROM users WHERE role='delivery' AND status='active'`).all().map(r => r.id).filter(x => x !== user.id);
          notify(drivers, 'order',
            b.status === 'confirmed' ? `New delivery to schedule · Order #${oid}` : `Order #${oid} — out for delivery`,
            `${cust ? cust.name : 'Customer'}${cust && cust.area ? ' · ' + cust.area : ''}`, `order#${oid}`);
        }
        if (!['admin', 'manager', 'shop_manager', 'finance'].includes(user.role)) notify(orderStaffUserIds().filter(x => x !== user.id), 'order', `Order #${oid} → ${titles[b.status] || b.status}`, null, `order#${oid}`);
      }
    }
    if (b.paid !== undefined) {
      requireRole(user, ['admin', 'manager', 'shop_manager', 'finance']);
      applyOrderPayment(user, oid, cur, b.paid, b.method, b.memo);
    }
    // the customer is notified in the block above; refresh the office + agents only
    sseSendMany(officeUserIds().filter(x => x !== user.id), 'order');
    return json(res, 200, db.prepare(Q.orders + ' WHERE o.id=?').get(oid));
  }

  // ---- payment methods + the business's receiving accounts ----
  if (method === 'GET' && parts[1] === 'payment-methods') {
    requireRole(user, ['admin', 'manager', 'shop_manager', 'finance', 'agent', 'customer']);
    return json(res, 200, { methods: PAY_METHODS, accounts: paymentAccounts() });
  }
  if (method === 'POST' && parts[1] === 'payment-methods') {
    requireRole(user, ['admin', 'manager']);
    const b = await readBody(req);
    const src = (b && typeof b === 'object' && b.accounts) ? b.accounts : b;
    const clean = {};
    for (const m of PAY_METHODS) {
      if (!m.needs_account) continue;
      const a = src && src[m.id];
      if (a && (String(a.name || '').trim() || String(a.detail || '').trim())) {
        clean[m.id] = { name: String(a.name || '').trim().slice(0, 80), detail: String(a.detail || '').trim().slice(0, 120) };
      }
    }
    db.prepare(`INSERT INTO settings(key,value,updated_at) VALUES ('payment_accounts',?,datetime('now'))
                ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(JSON.stringify(clean));
    audit(user, 'settings.payment_accounts', 'settings', null, 'Updated the business payment accounts', null, { methods: Object.keys(clean) });
    return json(res, 200, { methods: PAY_METHODS, accounts: clean });
  }

  // ---- deliveries ----
  if (method === 'GET' && parts[1] === 'deliveries' && parts.length === 2) {
    requireRole(user, ['admin', 'manager', 'shop_manager', 'delivery', 'finance']);
    const filter = {};
    const st = url.searchParams.get('status');
    if (st) filter.status = st;
    return json(res, 200, listDeliveries(filter));
  }

  // ---- smart route plan: optimise active stops from rider's GPS (or depot) ----
  if (method === 'GET' && parts[1] === 'route-plan' && parts.length === 2) {
    requireRole(user, ['admin', 'manager', 'delivery']);
    const sLat = url.searchParams.get('lat');
    const sLng = url.searchParams.get('lng');
    const open = listDeliveries({}).filter(d => d.status === 'pending' || d.status === 'out_for_delivery');
    const start = (sLat && sLng && isFinite(Number(sLat)) && isFinite(Number(sLng)) && Number(sLat) !== 0)
      ? { lat: Number(sLat), lng: Number(sLng) }
      : { lat: 33.61, lng: 73.07 }; // PurePak HQ (Golra Rd, ISB) as depot fallback
    // Best-effort geocode any stops missing coords (cap per request to stay fast + polite)
    await fillMissingCoords(open, 5);
    const plan = optimizeRoute(open, start);
    plan.start = start;
    plan.open_count = open.length;
    return json(res, 200, plan);
  }
  if (method === 'GET' && parts[1] === 'deliveries' && parts.length === 3 && !isNaN(+parts[2])) {
    requireRole(user, ['admin', 'manager', 'shop_manager', 'delivery']);
    const d = db.prepare(`SELECT d.*, c.name customer, c.address customer_address, c.phone customer_phone
                          FROM deliveries d JOIN orders o ON o.id=d.order_id JOIN customers c ON c.id=o.customer_id
                          WHERE d.id=?`).get(+parts[2]);
    if (!d) return err(res, 404, 'Delivery not found');
    d.items = db.prepare('SELECT oi.*, p.name product_name FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?').all(d.order_id);
    return json(res, 200, d);
  }
  if (method === 'PATCH' && parts[1] === 'deliveries' && parts.length === 3 && !isNaN(+parts[2])) {
    const did = +parts[2];
    const cur = db.prepare('SELECT * FROM deliveries WHERE id=?').get(did);
    if (!cur) return err(res, 404, 'Delivery not found');
    requireRole(user, ['admin', 'manager', 'shop_manager', 'delivery']);
    const b = await readBody(req);
    const next = b.status || cur.status;
    const allowed = { pending: ['out_for_delivery', 'failed'], out_for_delivery: ['delivered', 'failed', 'pending'], delivered: [], failed: ['pending'] };
    if (!allowed[cur.status] || !allowed[cur.status].includes(next))
      return err(res, 400, `Cannot move delivery ${cur.status} -> ${next}`);
    db.prepare('UPDATE deliveries SET status=?, delivered_at=CASE WHEN ?=? THEN datetime(\'now\') ELSE delivered_at END, notes=? WHERE id=?')
      .run(next, next, 'delivered', b.notes || cur.notes, did);
    // keep the ORDER status in lockstep with the delivery
    if (next === 'out_for_delivery')
      db.prepare(`UPDATE orders SET status='in_delivery' WHERE id=? AND status IN ('new','confirmed')`).run(cur.order_id);
    if (next === 'delivered') {
      db.prepare(`UPDATE orders SET status='delivered' WHERE id=? AND status IN ('new','confirmed','in_delivery')`).run(cur.order_id);
      // cash collected on the doorstep: record it right here so a COD order
      // doesn't sit "unpaid" until someone in the office fixes it later
      if (b.collected != null && Number(b.collected) > 0) {
        const ord = db.prepare('SELECT * FROM orders WHERE id=?').get(cur.order_id);
        if (ord) applyOrderPayment(user, cur.order_id, ord, ord.paid + Number(b.collected), b.method || ord.payment_method, b.memo || 'Collected on delivery');
      }
    }
    if (next === 'failed')
      db.prepare(`UPDATE orders SET status='confirmed' WHERE id=? AND status IN ('confirmed','in_delivery')`).run(cur.order_id);
    if (next === 'pending')
      db.prepare(`UPDATE orders SET status='confirmed' WHERE id=? AND status='in_delivery'`).run(cur.order_id);
    // keep customer + agent + office informed of the delivery move
    if (['out_for_delivery', 'delivered', 'failed'].includes(next)) {
      const ord = db.prepare('SELECT customer_id, agent_id FROM orders WHERE id=?').get(cur.order_id);
      const custU = db.prepare(`SELECT u.id AS uid FROM customers c LEFT JOIN users u ON u.customer_id=c.id WHERE c.id=?`).get(ord.customer_id);
      const T = { out_for_delivery: 'Out for delivery', delivered: 'Delivered', failed: 'Delivery could not be completed' };
      const B = {
        out_for_delivery: `Your water order #${cur.order_id} is on the way.`,
        delivered: `Your water order #${cur.order_id} has been delivered.`,
        failed: `Delivery of order #${cur.order_id} was not completed. Our team will follow up.`,
      };
      const cust = db.prepare('SELECT name FROM customers WHERE id=?').get(ord.customer_id) || {};
      if (custU && custU.uid) notify([custU.uid], 'order', T[next], B[next], `order#${cur.order_id}`);
      if (ord.agent_id) {
        const ag = db.prepare(`SELECT id FROM users WHERE agent_id=? AND status='active'`).get(ord.agent_id);
        if (ag && ag.id !== user.id) notify([ag.id], 'order', `Order #${cur.order_id} — ${T[next].toLowerCase()}`,
          `${cust.name || 'Customer'}'s order #${cur.order_id}`, `order#${cur.order_id}`);
      }
      if (next === 'delivered' || next === 'failed') {
        notify(orderStaffUserIds().filter(x => x !== user.id), 'order',
          next === 'delivered' ? `Order #${cur.order_id} delivered` : `Order #${cur.order_id} delivery failed`,
          `${cust.name || 'Customer'} · ${next === 'delivered' ? 'completed by' : 'attempted by'} ${user.name}`,
          `order#${cur.order_id}`);
      }
    }
    // customer notified above on delivered/failed; refresh the office + agents only
    sseSendMany(officeUserIds().filter(x => x !== user.id), 'order');
    return json(res, 200, db.prepare('SELECT * FROM deliveries WHERE id=?').get(did));
  }

  // ---- agents ----
  if (method === 'GET' && parts[1] === 'agents') {
    requireRole(user, ['admin', 'manager', 'finance']);
    const rows = db.prepare(`SELECT a.*,
      (SELECT COUNT(*) FROM orders o WHERE o.agent_id=a.id AND o.status<>'cancelled') AS orders_count,
      (SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE o.agent_id=a.id AND o.status<>'cancelled') AS sales,
      (SELECT COALESCE(SUM(amount),0) FROM commissions c WHERE c.agent_id=a.id AND c.status='accrued') AS outstanding_commission
      FROM agents a WHERE a.active=1 ORDER BY a.name`).all();
    return json(res, 200, rows);
  }
  if (method === 'POST' && parts[1] === 'agents') {
    requireRole(user, ['admin', 'manager']);
    const b = await readBody(req);
    if (!b.name) return err(res, 400, 'name required');
    const r = db.prepare('INSERT INTO agents(name,phone,email,area,commission_pct) VALUES (?,?,?,?,?)')
      .run(b.name, b.phone || null, b.email || null, b.area || null, Number(b.commission_pct) || 5);
    return json(res, 201, db.prepare('SELECT * FROM agents WHERE id=?').get(r.lastInsertRowid));
  }
  if (method === 'PATCH' && parts[1] === 'agents' && parts.length === 3 && !isNaN(+parts[2])) {
    requireRole(user, ['admin', 'manager', 'finance']);
    const b = await readBody(req);
    const cur = db.prepare('SELECT * FROM agents WHERE id=?').get(+parts[2]);
    if (!cur) return err(res, 404, 'Agent not found');
    let pct = cur.commission_pct;
    if (b.commission_pct !== undefined) {
      const v = Number(b.commission_pct);
      if (!(v >= 0 && v <= 50)) return err(res, 400, 'Commission must be between 0 and 50');
      pct = v;
    }
    db.prepare('UPDATE agents SET name=?, phone=?, email=?, area=?, commission_pct=?, active=? WHERE id=?').run(
      b.name != null ? String(b.name).trim() || cur.name : cur.name,
      b.phone !== undefined ? (b.phone || null) : cur.phone,
      b.email !== undefined ? (b.email || null) : cur.email,
      b.area !== undefined ? (b.area || null) : cur.area,
      pct,
      b.active !== undefined ? (b.active ? 1 : 0) : cur.active,
      +parts[2]);
    if (pct !== cur.commission_pct)
      notify(staffUserIds().filter(x => x !== user.id), 'team', 'Agent commission updated',
        cur.name + ' commission ' + cur.commission_pct + '% → ' + pct + '% (applies to new orders, by ' + user.name + ').', 'agent#' + cur.id);
    // keep the agent's linked user record name in sync
    if (b.name != null && String(b.name).trim()) {
      db.prepare('UPDATE users SET name=? WHERE agent_id=? AND role=\'agent\'').run(String(b.name).trim(), +parts[2]);
    }
    return json(res, 200, db.prepare('SELECT * FROM agents WHERE id=?').get(+parts[2]));
  }

  // ---- commissions ----
  if (method === 'GET' && parts[1] === 'commissions') {
    requireRole(user, ['admin', 'manager', 'agent', 'finance']);
    const args = [];
    let sql = `SELECT com.*, c.name AS customer, o.total AS order_total, a.name AS agent_name
               FROM commissions com LEFT JOIN orders o ON o.id=com.order_id
               LEFT JOIN customers c ON c.id=o.customer_id LEFT JOIN agents a ON a.id=com.agent_id`;
    if (user.role === 'agent') { sql += ' WHERE com.agent_id=?'; args.push(user.agent_id); }
    const agent = url.searchParams.get('agent_id');
    if (user.role !== 'agent' && agent) { sql += ' WHERE com.agent_id=?'; args.push(+agent); }
    const st = url.searchParams.get('status');
    if (st) { sql += (sql.includes('WHERE') ? ' AND' : ' WHERE') + ' com.status=?'; args.push(st); }
    sql += ' ORDER BY com.created_at DESC';
    return json(res, 200, db.prepare(sql).all(...args));
  }
  if (method === 'PATCH' && parts[1] === 'commissions' && parts.length === 3 && !isNaN(+parts[2])) {
    const cid = +parts[2];
    const cur = db.prepare('SELECT * FROM commissions WHERE id=?').get(cid);
    if (!cur) return err(res, 404, 'Commission not found');
    const u = requireRole(user, ['admin', 'manager', 'finance']);
    if (cur.status !== 'accrued') return err(res, 400, 'Commission already settled');
    db.prepare(`UPDATE commissions SET status='paid', paid_at=datetime('now') WHERE id=?`).run(cid);
    const agentName = db.prepare('SELECT name FROM agents WHERE id=?').get(cur.agent_id)?.name || '';
    postLedger(user, { account: 'Agent commissions', type: 'expense', amount: cur.amount, ref: 'comm#' + cid, memo: 'Commission payout - ' + agentName });
    audit(user, 'commission.settle', 'commission', cid, `Settled commission #${cid} (Rs ${cur.amount}) for ${agentName}`, { status: 'accrued' }, { status: 'paid' });
    // tell the agent their commission was paid
    const agU = db.prepare(`SELECT id FROM users WHERE agent_id=? AND status='active'`).get(cur.agent_id);
    if (agU && agU.id !== user.id) notify([agU.id], 'commission', 'Commission paid',
      `Rs ${Math.round(cur.amount)} commission (order #${cur.order_id}) has been paid out.`, `comm#${cid}`);
    return json(res, 200, db.prepare('SELECT * FROM commissions WHERE id=?').get(cid));
  }

  // ---- payroll ----
  if (method === 'GET' && parts[1] === 'payroll' && parts.length === 2) {
    requireRole(user, ['admin', 'manager', 'finance']);
    const period = url.searchParams.get('period') || new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(period)) return err(res, 400, 'period must be YYYY-MM');
    const staff = db.prepare(`SELECT id, name, role, salary, status FROM users
                              WHERE role IN ('admin','manager','shop_manager','finance','delivery','agent') AND status='active'
                              ORDER BY role, name`).all();
    const rows = staff.map(u => {
      const entry = db.prepare('SELECT * FROM payroll WHERE user_id=? AND period=?').get(u.id, period);
      const commission = u.role === 'agent'
        ? db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM commissions c
                      JOIN agents a ON a.id=c.agent_id WHERE c.agent_id=(SELECT agent_id FROM users WHERE id=?)
                      AND c.status='accrued' AND c.period=?`).get(u.id, period).v
        : 0;
      const amount = entry ? entry.amount : Math.round(((u.salary || 0)) * 100) / 100;
      return {
        user_id: u.id, name: u.name, role: u.role, salary: u.salary || 0,
        commission: Math.round(commission * 100) / 100,
        due: Math.round((amount + commission) * 100) / 100,
        entry: entry ? { id: entry.id, amount: entry.amount, status: entry.status, paid_at: entry.paid_at } : null,
      };
    }).filter(r => r.due > 0 || r.entry);
    const totals = rows.reduce((a, r) => ({
      salary: a.salary + r.salary, commission: a.commission + r.commission,
      due: a.due + r.due, paid: a.paid + (r.entry?.status === 'paid' ? r.entry.amount : 0),
    }), { salary: 0, commission: 0, due: 0, paid: 0 });
    return json(res, 200, { period, rows, totals });
  }
  if (method === 'POST' && parts[1] === 'payroll' && parts[2] === 'generate') {
    requireRole(user, ['admin', 'manager', 'finance']);
    const b = await readBody(req);
    const period = String(b.period || new Date().toISOString().slice(0, 7));
    if (!/^\d{4}-\d{2}$/.test(period)) return err(res, 400, 'period must be YYYY-MM');
    const staff = db.prepare(`SELECT id, salary, role FROM users
                              WHERE role IN ('admin','manager','shop_manager','finance','delivery','agent') AND status='active'`).all();
    let created = 0;
    for (const u of staff) {
      const existing = db.prepare('SELECT id FROM payroll WHERE user_id=? AND period=?').get(u.id, period);
      if (existing) continue;
      let amount = null;
      if (u.role === 'agent') {
        // Agents are commission-based: entry covers accrued commission, not a fixed salary.
        const acc = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM commissions c
                                JOIN agents a ON a.id=c.agent_id WHERE c.agent_id=(SELECT agent_id FROM users WHERE id=?)
                                AND c.status='accrued' AND c.period=?`).get(u.id, period).v;
        if (acc > 0) amount = Math.round(acc * 100) / 100;
      } else if (u.salary) {
        amount = Number(u.salary);
      }
      if (!amount) continue;
      db.prepare('INSERT INTO payroll(user_id, period, amount) VALUES (?,?,?)').run(u.id, period, amount);
      created++;
    }
    if (created) notify(staffUserIds().filter(x => x !== user.id), 'payroll', 'Payroll generated',
      period + ' payroll created for ' + created + ' employee(s) by ' + user.name + '.', 'payroll#' + period);
    return json(res, 200, { period, created });
  }
  if (method === 'POST' && parts[1] === 'payroll' && parts.length === 4 && parts[3] === 'mark-paid') {
    requireRole(user, ['admin', 'manager', 'finance']);
    const id = +parts[2];
    const entry = db.prepare('SELECT * FROM payroll WHERE id=?').get(id);
    if (!entry) return err(res, 404, 'Payroll entry not found');
    if (entry.status === 'paid') return err(res, 409, 'Already marked as paid');
    const u = db.prepare('SELECT name, role, agent_id FROM users WHERE id=?').get(entry.user_id);
    const isAgent = u && u.role === 'agent';
    db.prepare(`UPDATE payroll SET status='paid', paid_at=datetime('now'),
                ledger_ref=? WHERE id=?`).run('payroll#' + entry.period + '#' + entry.user_id, id);
    const acct = isAgent ? 'Commissions' : 'Salaries & Wages';
    postLedger(user, {
      account: acct, type: 'expense', amount: entry.amount,
      ref: 'payroll#' + entry.period + '#' + entry.user_id,
      memo: (isAgent ? 'Commission payout - ' : 'Salary payout - ') + (u ? u.name : 'employee'),
    });
    audit(user, 'payroll.pay', 'payroll', id, `Paid ${entry.period} payroll (Rs ${entry.amount}) to ${u ? u.name : 'employee'}`, { status: 'accrued' }, { status: 'paid' });
    // tell the employee their salary was paid
    if (entry.user_id !== user.id) notify([entry.user_id], 'payroll',
      (isAgent ? 'Commission' : 'Salary') + ' paid · ' + entry.period,
      `Rs ${Math.round(entry.amount)} for ${entry.period} has been paid.`, 'payroll#' + entry.period);
    if (isAgent && u.agent_id) {
      // Settle the underlying accrued commissions so they don't double-count in Commissions.
      db.prepare(`UPDATE commissions SET status='paid', paid_at=datetime('now')
                  WHERE agent_id=? AND period=? AND status='accrued'`).run(u.agent_id, entry.period);
    }
    return json(res, 200, db.prepare('SELECT * FROM payroll WHERE id=?').get(id));
  }

  // ---- bookkeeping ----
  if (method === 'GET' && parts[1] === 'ledger' && parts.length === 2) {
    requireRole(user, ['admin', 'manager', 'finance']);
    const since = url.searchParams.get('since');
    const sql = since ? `SELECT * FROM ledger WHERE at>=? ORDER BY at DESC, id DESC` : `SELECT * FROM ledger ORDER BY at DESC, id DESC`;
    return json(res, 200, db.prepare(sql).all(...(since ? [since] : [])));
  }
  if (method === 'GET' && parts[1] === 'ledger' && parts[2] === 'summary') {
    requireRole(user, ['admin', 'manager', 'finance']);
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const inc = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM ledger WHERE type='income' AND strftime('%Y-%m',at)=?`).get(month).v;
    const exp = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM ledger WHERE type='expense' AND strftime('%Y-%m',at)=?`).get(month).v;
    const allInc = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM ledger WHERE type='income'`).get().v;
    const allExp = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM ledger WHERE type='expense'`).get().v;
    const byAccount = db.prepare(`SELECT account, type, SUM(amount) total FROM ledger WHERE strftime('%Y-%m',at)=? GROUP BY account, type ORDER BY total DESC`).all(month);
    return json(res, 200, {
      month, month_income: Math.round(inc), month_expense: Math.round(exp), month_net: Math.round(inc - exp),
      all_time_income: Math.round(allInc), all_time_expense: Math.round(allExp), all_time_net: Math.round(allInc - allExp),
      by_account: byAccount,
    });
  }
  if (method === 'POST' && parts[1] === 'ledger' && parts.length === 2) {
    requireRole(user, ['admin', 'manager', 'finance']);
    const b = await readBody(req);
    if (!b.account || !(Number(b.amount) > 0)) return err(res, 400, 'account and positive amount required');
    const type = b.type === 'expense' ? 'expense' : 'income';
    return json(res, 201, postLedger(user, { account: String(b.account).trim(), type, amount: Number(b.amount), ref: b.ref || null, memo: b.memo || null }));
  }
  // --- append-only corrections: VOID reverses an entry, CORRECT reverses + reposts. Admin only. ---
  if (method === 'POST' && parts[1] === 'ledger' && parts.length === 4 && parts[3] === 'void' && !isNaN(+parts[2])) {
    requireRole(user, ['admin']);
    const cur = db.prepare('SELECT * FROM ledger WHERE id=?').get(+parts[2]);
    if (!cur) return err(res, 404, 'Entry not found');
    if (cur.status !== 'active') return err(res, 400, 'Entry is already ' + cur.status);
    const b = await readBody(req);
    const reason = String(b.reason || '').trim();
    if (reason.length < 3) return err(res, 400, 'A reason is required to void an entry');
    db.prepare(`UPDATE ledger SET status='reversed', void_reason=? WHERE id=?`).run(reason, cur.id);
    const rev = postLedger(user, {
      account: cur.account, type: cur.type === 'income' ? 'expense' : 'income',
      amount: cur.amount, ref: cur.ref, corrects: cur.id,
      memo: `Reversal of entry #${cur.id} — ${reason}`,
    });
    audit(user, 'ledger.void', 'ledger', cur.id,
      `Voided entry #${cur.id} (${cur.type === 'income' ? '+' : '−'} Rs ${Math.round(cur.amount)} · ${cur.account}) — ${reason}`,
      cur, { status: 'reversed', reversal_entry: rev.id });
    return json(res, 200, { voided: cur.id, reversal: rev });
  }
  if (method === 'POST' && parts[1] === 'ledger' && parts.length === 4 && parts[3] === 'correct' && !isNaN(+parts[2])) {
    requireRole(user, ['admin']);
    const cur = db.prepare('SELECT * FROM ledger WHERE id=?').get(+parts[2]);
    if (!cur) return err(res, 404, 'Entry not found');
    if (cur.status !== 'active') return err(res, 400, 'Entry is already ' + cur.status);
    const b = await readBody(req);
    const reason = String(b.reason || '').trim();
    if (reason.length < 3) return err(res, 400, 'A reason is required to correct an entry');
    const type = b.type === 'expense' ? 'expense' : 'income';
    const amount = Number(b.amount);
    const account = String(b.account || cur.account).trim();
    if (!account || !(amount > 0)) return err(res, 400, 'Valid account and positive amount required');
    db.prepare(`UPDATE ledger SET status='reversed', void_reason=? WHERE id=?`).run('Corrected: ' + reason, cur.id);
    const rev = postLedger(user, {
      account: cur.account, type: cur.type === 'income' ? 'expense' : 'income',
      amount: cur.amount, ref: cur.ref, corrects: cur.id,
      memo: `Reversal of entry #${cur.id} (correction) — ${reason}`,
    });
    const fixed = postLedger(user, {
      account, type, amount, ref: cur.ref, corrects: cur.id,
      memo: (b.memo && String(b.memo).trim()) || cur.memo || `Corrected entry #${cur.id}`,
    });
    audit(user, 'ledger.correct', 'ledger', cur.id,
      `Corrected entry #${cur.id} — ${reason}`,
      { account: cur.account, type: cur.type, amount: cur.amount, memo: cur.memo },
      { account, type, amount, memo: fixed.memo, reversal_entry: rev.id, new_entry: fixed.id });
    return json(res, 200, { corrected: cur.id, reversal: rev, entry: fixed });
  }
  // --- audit trail (hash-chained) ---
  if (method === 'GET' && parts[1] === 'audit' && parts[2] === 'verify') {
    requireRole(user, ['admin', 'manager']);
    return json(res, 200, auditVerify());
  }
  if (method === 'GET' && parts[1] === 'audit' && parts.length === 2) {
    requireRole(user, ['admin', 'manager']);
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 400').all();
    for (const r of rows) {
      try { r.before = r.before_json ? JSON.parse(r.before_json) : null; } catch { r.before = r.before_json; }
      try { r.after = r.after_json ? JSON.parse(r.after_json) : null; } catch { r.after = r.after_json; }
      delete r.before_json; delete r.after_json;
    }
    return json(res, 200, { entries: rows, verify: auditVerify() });
  }

  // ---- receipts: upload (image) -> Gemini OCR -> searchable record, optional ledger post ----
  if (method === 'POST' && parts[1] === 'receipts' && parts.length === 2) {
    requireRole(user, ['admin', 'manager', 'finance', 'agent', 'delivery']);
    const b = await readBody(req);
    const kind = ['expense', 'income', 'sales', 'agent_commission', 'other'].includes(b.kind) ? b.kind : 'expense';
    const imageB64 = String(b.image || '');
    if (!imageB64 || imageB64.length < 1000) return err(res, 400, 'image data required');
    // save image
    const RECDIR = RECEIPTS_DIR;
    if (!fs.existsSync(RECDIR)) fs.mkdirSync(RECDIR, { recursive: true });
    const safe = String(b.filename || 'receipt').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
    const r = db.prepare('INSERT INTO receipts(filename,kind,amount,vendor,memo,recorded_by,ocr_status) VALUES (?,?,?,?,?,?,?)')
      .run(safe, kind, Number(b.amount) || null, b.vendor || null, b.memo || null, user.name, 'pending');
    const rid = Number(r.lastInsertRowid);
    const ext = String(b.mimetype || '').includes('png') ? 'png' : 'jpg';
    fs.writeFileSync(path.join(RECDIR, rid + '_' + safe + '.' + ext), decodeB64(imageB64));

    // run Gemini OCR (best-effort; receipt stays pending/searchable regardless)
    const key = geminiKey();
    if (key) {
      extractReceipt(key, path.join(RECDIR, rid + '_' + safe + '.' + ext))
        .then(out => {
          // adopt the AI's classification only if the scanner left the default 'expense'
          const KINDS = ['expense', 'income', 'sales', 'agent_commission', 'other'];
          const aiKind = KINDS.includes(out.suggested_kind) ? out.suggested_kind : null;
          const useKind = (kind === 'expense' && aiKind) ? aiKind : kind;
          // a helpful auto-memo when the scanner didn't type one
          const autoMemo = [
            out.doc_kind && out.doc_kind !== 'other' ? out.doc_kind.replace(/_/g, ' ') : null,
            out.reference_no ? '#' + out.reference_no : null,
            out.date || null,
            out.notes || null,
          ].filter(Boolean).join(' · ') || null;
          db.prepare(`UPDATE receipts SET extracted=?, ocr_status='done', kind=?,
                        amount = CASE WHEN amount IS NULL AND ? IS NOT NULL THEN ? ELSE amount END,
                        vendor = CASE WHEN vendor IS NULL THEN ? ELSE vendor END,
                        memo   = CASE WHEN memo   IS NULL THEN ? ELSE memo   END
                      WHERE id=?`)
            .run(JSON.stringify(out), useKind, out.amount, out.amount, out.vendor || null, autoMemo, rid);
          // tell the review team a new scan is waiting in staging
          const rc2 = db.prepare('SELECT status, vendor, amount FROM receipts WHERE id=?').get(rid);
          if (rc2 && rc2.status === 'pending') {
            notify(staffUserIds().filter(x => x !== user.id), 'receipt', `New receipt #${rid} awaiting review`,
              `${out.vendor || rc2.vendor || 'Receipt'} · Rs ${out.amount != null ? out.amount : (rc2.amount != null ? rc2.amount : '—')} scanned by ${user.name} — verify & approve in Receipts.`, 'receipt#' + rid);
          }
        })
        .catch((e) => {
          console.error('receipt OCR failed #' + rid + ':', e && e.message);
          db.prepare(`UPDATE receipts SET ocr_status='failed' WHERE id=?`).run(rid);
        });
    } else {
      console.warn('receipt #' + rid + ' saved without OCR — no Gemini API key (set one in Settings or GEMINI_API_KEY)');
      db.prepare(`UPDATE receipts SET ocr_status='failed' WHERE id=?`).run(rid);
    }
    return json(res, 201, db.prepare('SELECT * FROM receipts WHERE id=?').get(rid));
  }
  // ---- receipts: edit staging fields (scanner corrects the AI read, or a reviewer tweaks) ----
  if (method === 'PATCH' && parts[1] === 'receipts' && parts.length === 3 && !isNaN(+parts[2])) {
    requireRole(user, ['admin', 'manager', 'finance', 'agent', 'delivery']);
    const rid = +parts[2];
    const rc = db.prepare('SELECT * FROM receipts WHERE id=?').get(rid);
    if (!rc) return err(res, 404, 'Receipt not found');
    if (rc.posted || rc.status === 'approved') return err(res, 400, 'This receipt is already finalised');
    const isReviewer = ['admin', 'manager', 'finance'].includes(user.role);
    if (!isReviewer && rc.recorded_by !== user.name) return err(res, 403, 'You can only edit receipts you scanned');
    const b = await readBody(req);
    const kind = ['expense', 'income', 'sales', 'agent_commission', 'other'].includes(b.kind) ? b.kind : rc.kind;
    const amount = b.amount === '' || b.amount == null ? rc.amount : Number(b.amount);
    const vendor = b.vendor !== undefined ? (String(b.vendor).trim() || null) : rc.vendor;
    const memo = b.memo !== undefined ? (String(b.memo).trim() || null) : rc.memo;
    // keep the extracted blob in sync with the corrected scalars
    let extracted = rc.extracted;
    try {
      const ex = rc.extracted ? JSON.parse(rc.extracted) : {};
      if (b.amount !== undefined) ex.amount = amount;
      if (b.vendor !== undefined) ex.vendor = vendor;
      if (b.date !== undefined) ex.date = b.date || null;
      ex.edited_by = user.name;
      extracted = JSON.stringify(ex);
    } catch { /* leave as-is */ }
    db.prepare('UPDATE receipts SET kind=?, amount=?, vendor=?, memo=?, extracted=? WHERE id=?')
      .run(kind, amount, vendor, memo, extracted, rid);
    return json(res, 200, db.prepare('SELECT * FROM receipts WHERE id=?').get(rid));
  }
  // ---- notifications (in-app feed) ----
  if (method === 'GET' && parts[1] === 'notifications' && parts.length === 2) {
    if (!user) return err(res, 401, 'Not authenticated');
    const rows = db.prepare(`SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 40`).all(user.id);
    const unread = db.prepare(`SELECT COUNT(*) AS n FROM notifications WHERE user_id=? AND read=0`).get(user.id).n;
    return json(res, 200, { notifications: rows, unread });
  }
  if (method === 'POST' && parts[1] === 'notifications' && parts.length === 3 && parts[2] === 'read') {
    const b = await readBody(req);
    if (b.id) db.prepare(`UPDATE notifications SET read=1 WHERE id=? AND user_id=?`).run(+b.id, user.id);
    else db.prepare(`UPDATE notifications SET read=1 WHERE user_id=?`).run(user.id);
    return json(res, 200, { ok: true });
  }
  if (method === 'GET' && parts[1] === 'receipts' && parts.length === 2) {
    requireRole(user, ['admin', 'manager', 'finance', 'agent', 'delivery']);
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const st = url.searchParams.get('status'); // pending | approved
    let sql = 'SELECT * FROM receipts';
    const args = [];
    if (q) {
      sql += ` WHERE LOWER(vendor) LIKE ? OR LOWER(memo) LIKE ? OR LOWER(COALESCE(extracted,'')) LIKE ? OR LOWER(COALESCE(filename,'')) LIKE ?`;
      const like = '%' + q + '%';
      args.push(like, like, like, like);
    }
    if (st === 'pending' || st === 'approved') sql += (sql.includes(' WHERE ') ? ' AND ' : ' WHERE ') + "status='" + st + "'";
    sql += ' ORDER BY created_at DESC, id DESC LIMIT 200';
    const rows = db.prepare(sql).all(...args);
    rows.forEach(x => { if (x.extracted) { try { x.extracted = JSON.parse(x.extracted); } catch { /* keep raw */ } } });
    return json(res, 200, rows);
  }
  if (method === 'GET' && parts[1] === 'receipts' && parts.length === 3 && !isNaN(+parts[2])) {
    const imgToken = url.searchParams.get('token');
    if (imgToken && !SESSIONS.has(imgToken)) return err(res, 401, 'Bad token');
    if (!user && !imgToken) return err(res, 401, 'Not authenticated');
    requireRole(user || (SESSIONS.get(imgToken) && SESSIONS.get(imgToken).user), ['admin', 'manager', 'finance', 'agent', 'delivery']);
    const rc = db.prepare('SELECT * FROM receipts WHERE id=?').get(+parts[2]);
    if (!rc) return err(res, 404, 'Receipt not found');
    const dir = RECEIPTS_DIR;
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    const f = files.find(x => x.startsWith(rc.id + '_'));
    if (!f) return err(res, 404, 'Image not found');
    const buf = fs.readFileSync(path.join(dir, f));
    res.writeHead(200, { 'Content-Type': f.endsWith('.png') ? 'image/png' : 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
    return res.end(buf);
  }
  // review: verify AI-extracted data, correct it, then approve (moves out of staging). Admin/finance only.
  if (method === 'POST' && parts[1] === 'receipts' && parts.length === 4 && parts[3] === 'approve' && !isNaN(+parts[2])) {
    requireRole(user, ['admin', 'finance']);
    const rid = +parts[2];
    const rc = db.prepare('SELECT * FROM receipts WHERE id=?').get(rid);
    if (!rc) return err(res, 404, 'Receipt not found');
    if (rc.status === 'approved' || rc.posted) return err(res, 400, 'Receipt is already approved/posted');
    const b = await readBody(req);
    const oldAmount = rc.amount, oldVendor = rc.vendor, oldKind = rc.kind;
    const amount = (b.amount !== undefined && b.amount !== null && b.amount !== '') ? Number(b.amount) : rc.amount;
    const kind = ['expense', 'income', 'sales', 'agent_commission', 'other'].includes(b.kind) ? b.kind : rc.kind;
    const vendor = b.vendor !== undefined ? (b.vendor || rc.vendor) : rc.vendor;
    const memo = b.memo !== undefined ? (b.memo || rc.memo) : rc.memo;
    if (!(Number(amount) > 0)) return err(res, 400, 'Receipt needs a positive amount to approve');
    db.prepare(`UPDATE receipts SET status='approved', amount=?, kind=?, vendor=?, memo=?, extracted=?, reviewed_by=?, reviewed_at=datetime('now') WHERE id=?`)
      .run(Number(amount), kind, vendor || null, memo || null, b.extracted !== undefined ? JSON.stringify(b.extracted) : null, user.name, rid);
    // notify sender + staff, listing every correction the reviewer made
    const changes = [];
    if (Number(oldAmount) !== Number(amount)) changes.push(`amount ${oldAmount != null ? String(oldAmount) : '—'} → ${amount}`);
    if (oldVendor != null && vendor != null && String(oldVendor) !== String(vendor)) changes.push(`vendor ${oldVendor} → ${vendor}`);
    if (oldKind !== kind) changes.push(`type ${oldKind} → ${kind}`);
    if (b.extracted !== undefined) changes.push('line items');
    const who = rc.recorded_by ? ` sent by ${rc.recorded_by}` : '';
    const summary = changes.length ? `Approved with changes: ${changes.join(', ')}.` : 'Approved as scanned.';
    const targets = [...new Set([...staffUserIds(), ...db.prepare('SELECT id FROM users WHERE name=?').all(rc.recorded_by || '').map(r => r.id)])].filter(x => x !== user.id);
    notify(targets, 'receipt', `Receipt #${rid} approved${who}`,
      `${vendor || 'Receipt'} · Rs ${amount}${memo ? ' · ' + memo : ''} — ${summary}`, 'receipt#' + rid);
    return json(res, 200, db.prepare('SELECT * FROM receipts WHERE id=?').get(rid));
  }
  if (method === 'POST' && parts[1] === 'receipts' && parts.length === 4 && parts[3] === 'reject' && !isNaN(+parts[2])) {
    requireRole(user, ['admin', 'finance']);
    const rid = +parts[2];
    const rc = db.prepare('SELECT * FROM receipts WHERE id=?').get(rid);
    if (!rc) return err(res, 404, 'Receipt not found');
    if (rc.posted) return err(res, 400, 'Receipt is already in the ledger — cannot reject');
    const b = await readBody(req);
    const reason = b.reason ? String(b.reason).trim() : 'No reason given';
    db.prepare('DELETE FROM receipts WHERE id=?').run(rid);
    const dir = RECEIPTS_DIR;
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).filter(f => f.startsWith(rid + '_')).forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch { /* ignore */ } });
    }
    const who = rc.recorded_by ? ` sent by ${rc.recorded_by}` : '';
    notify([...new Set([...staffUserIds(), ...db.prepare('SELECT id FROM users WHERE name=?').all(rc.recorded_by || '').map(r => r.id)])].filter(x => x !== user.id),
      'receipt', `Receipt #${rid} rejected${who}`,
      `${rc.vendor || 'Receipt'} · Rs ${rc.amount != null ? rc.amount : '—'} — rejected by ${user.name}: ${reason}`, 'receipt#' + rid);
    return json(res, 200, { ok: true });
  }
  if (method === 'POST' && parts[1] === 'receipts' && parts.length === 4 && parts[3] === 'post' && !isNaN(+parts[2])) {
    requireRole(user, ['admin', 'finance']);
    const rid = +parts[2];
    const rc = db.prepare('SELECT * FROM receipts WHERE id=?').get(rid);
    if (!rc) return err(res, 404, 'Receipt not found');
    if (rc.posted) return err(res, 400, 'Receipt already posted');
    if (rc.status !== 'approved') return err(res, 400, 'Receipt must be approved first (still in staging)');
    if (!(Number(rc.amount) > 0)) return err(res, 400, 'Receipt needs a positive amount to post');
    const type = rc.kind === 'income' || rc.kind === 'sales' ? 'income' : 'expense';
    const account = rc.kind === 'agent_commission' ? 'Agent commissions'
      : rc.kind === 'sales' ? 'Sales (receipt)'
      : rc.kind === 'income' ? 'Cash / Bank' : 'Expenses (receipt)';
    const memo = (rc.memo || (rc.vendor ? rc.vendor : 'Receipt')) + ' (receipt#' + rid + ')';
    const lref = 'receipt#' + rid;
    const led = postLedger(user, { account, type, amount: Number(rc.amount), ref: lref, memo });
    db.prepare('UPDATE receipts SET posted=1, posted_ref=? WHERE id=?').run(lref, rid);
    audit(user, 'receipt.post', 'receipt', rid, `Posted receipt #${rid} to the ledger as entry #${led.id} (Rs ${Math.round(Number(rc.amount))} · ${account})`, { posted: 0 }, { posted: 1, ledger_entry: led.id });
    return json(res, 200, db.prepare('SELECT * FROM receipts WHERE id=?').get(rid));
  }

  // ---- AI settings (Gemini key) ----
  if (method === 'POST' && parts[1] === 'settings' && parts.length === 2) {
    requireRole(user, ['admin', 'manager']);
    const b = await readBody(req);
    if (b.gemini_api_key === null || b.gemini_api_key === '') {
      db.prepare(`DELETE FROM settings WHERE key='gemini_api_key'`).run();
    } else if (b.gemini_api_key) {
      db.prepare(`INSERT INTO settings(key,value,updated_at) VALUES ('gemini_api_key',?,datetime('now'))
                  ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(String(b.gemini_api_key).trim());
    }
    if (b.gemini_model) {
      db.prepare(`INSERT INTO settings(key,value,updated_at) VALUES ('gemini_model',?,datetime('now'))
                  ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(String(b.gemini_model).trim());
    }
    return json(res, 200, {
      gemini_api_key: setting('gemini_api_key') ? maskKey(setting('gemini_api_key')) : null,
      gemini_model: setting('gemini_model') || null,
      ocr_ready: !!geminiKey(),
      ocr_source: setting('gemini_api_key') ? 'settings' : (process.env.GEMINI_API_KEY ? 'env' : null),
    });
  }
  if (method === 'GET' && parts[1] === 'settings' && parts.length === 2) {
    requireRole(user, ['admin', 'manager']);
    return json(res, 200, {
      gemini_api_key: setting('gemini_api_key') ? maskKey(setting('gemini_api_key')) : null,
      gemini_model: setting('gemini_model') || null,
      ocr_ready: !!geminiKey(),
      ocr_source: setting('gemini_api_key') ? 'settings' : (process.env.GEMINI_API_KEY ? 'env' : null),
    });
  }

  // ---- kpis / analytics ----
  if (method === 'GET' && parts[1] === 'kpis') {
    requireRole(user, ['admin', 'manager', 'finance', 'agent', 'delivery', 'customer']);
    if (user.role === 'customer') {
      const mine = db.prepare('SELECT COUNT(*) c, COALESCE(SUM(total),0) t, COALESCE(SUM(total-paid),0) due FROM orders WHERE customer_id=? AND status<>\'cancelled\'').get(user.customer_id);
      return json(res, 200, { my_orders: mine.c, lifetime_spend: Math.round(mine.t), due: Math.round(mine.due) });
    }
    if (user.role === 'agent') {
      const k = db.prepare(`SELECT COUNT(*) c, COALESCE(SUM(total),0) t FROM orders WHERE agent_id=? AND status<>'cancelled'`).get(user.agent_id);
      const due = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM commissions WHERE agent_id=? AND status='accrued'`).get(user.agent_id).v;
      return json(res, 200, { my_orders: k.c, my_sales: Math.round(k.t), due_commission: Math.round(due),
                              paid_commission: Math.round(db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM commissions WHERE agent_id=? AND status='paid'`).get(user.agent_id).v) });
    }
    return json(res, 200, kpis());
  }
  if (method === 'GET' && parts[1] === 'analytics' && parts[2] === 'monthly') {
    requireRole(user, ['admin', 'manager', 'finance']);
    return json(res, 200, monthlySeries());
  }
  if (method === 'GET' && parts[1] === 'analytics' && parts[2] === 'top-customers') {
    requireRole(user, ['admin', 'manager', 'finance']);
    const rows = db.prepare(`SELECT c.name, c.area, SUM(o.total) sales, COUNT(*) orders
                             FROM orders o JOIN customers c ON c.id=o.customer_id
                             WHERE o.status<>'cancelled' GROUP BY o.customer_id ORDER BY sales DESC LIMIT 5`).all();
    return json(res, 200, rows);
  }

  return err(res, 404, 'Unknown API endpoint: ' + method + ' ' + url.pathname);
}

// ---------- static web ----------
// One token per running container (mtime of the app files). It's appended to the
// app JS/CSS URLs inside index.html at serve time so a new deploy always busts
// any CDN/browser copy of the previous build — the #1 "why is my fix not live"
// gotcha behind Cloudflare, which edge-caches static extensions by default.
const ASSET_VER = (() => {
  let m = 0;
  for (const f of ['index.html', 'styles.css', 'api.js', 'views.js', 'app.js']) {
    try { m = Math.max(m, fs.statSync(path.join(WEB_ROOT, f)).mtimeMs); } catch {}
  }
  return String(Math.floor(m) || Date.now());
})();
function withAssetVer(html) {
  return String(html).replace(/\b(src|href)="((?:api|views|app)\.js|styles\.css)"/g,
    `$1="$2?v=${ASSET_VER}"`);
}
function staticHeaders(ext, p) {
  // app shell (our own html/js/css) revalidates every load so a deploy is never
  // masked by a stale CDN copy; third-party bundles and media cache for a day.
  const vendored = /^\/(vendor|img)\//.test(p || '');
  const noCache = !vendored && (ext === '.html' || ext === '.js' || ext === '.css');
  return {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': noCache ? 'no-cache' : 'public, max-age=86400',
  };
}
function serveStatic(req, res, url) {
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.normalize(path.join(WEB_ROOT, p));
  if (!file.startsWith(WEB_ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (e, data) => {
    if (e) {
      // SPA fallback
      const idx = path.join(WEB_ROOT, 'index.html');
      return fs.readFile(idx, (e2, d2) => {
        if (e2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, staticHeaders('.html', '/index.html')); res.end(withAssetVer(d2));
      });
    }
    const ext = path.extname(file);
    res.writeHead(200, staticHeaders(ext, p));
    res.end(ext === '.html' ? withAssetVer(data) : data);
  });
}

// ---------- platform contract endpoints (Zorc) ----------
// /health must NOT touch the database (a slow query here can cascade into
// every app on the node getting marked unhealthy at once).
function handlePlatform(req, res, url) {
  switch (url.pathname) {
    case '/health':
      return json(res, 200, { status: 'ok' });
    case '/ready': {
      try {
        db.prepare('SELECT 1 AS ok').get();
        return json(res, 200, { status: 'ready' });
      } catch (e) {
        return json(res, 503, { status: 'not-ready', reason: e.message });
      }
    }
    case '/version':
      return json(res, 200, { name: 'purepak', version: '1.5.0', node: process.version, built: new Date().toISOString() });
    case '/openapi.json':
      return json(res, 200, OPENAPI);
    default:
      return err(res, 404, 'Not found');
  }
}
const OPENAPI = {
  openapi: '3.0.0',
  info: {
    title: 'PurePak API',
    version: '1.5.0',
    description: 'Pakistan mineral-water operations backend: auth, orders, deliveries, agents & commissions, bookkeeping, receipts, team, payroll, products, notifications.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/health': { get: { summary: 'Health (no DB)', responses: { 200: { description: 'ok' } } } },
    '/api/ready': { get: { summary: 'Readiness (checks DB)', responses: { 200: { description: 'ready' }, 503: { description: 'not ready' } } } },
    '/api/version': { get: { summary: 'Version', responses: { 200: { description: 'ok' } } } },
    '/api/auth/login': { post: { summary: 'Login (email+password) -> token+user', responses: { 200: { description: 'ok' }, 401: { description: 'invalid credentials' } } } },
    '/api/auth/signup': { post: { summary: 'Public self-signup (first account becomes owner/admin)', responses: { 201: { description: 'created' } } } },
    '/api/orders': { get: { summary: 'List orders', responses: { 200: { description: 'ok' } } } },
    '/api/deliveries': { get: { summary: 'List deliveries', responses: { 200: { description: 'ok' } } } },
    '/api/agents': { get: { summary: 'List agents', responses: { 200: { description: 'ok' } } } },
    '/api/commissions': { get: { summary: 'Commission ledger', responses: { 200: { description: 'ok' } } } },
    '/api/receipts': { get: { summary: 'List receipts', responses: { 200: { description: 'ok' } } } },
    '/api/products': { get: { summary: 'List products', responses: { 200: { description: 'ok' } } } },
    '/api/users': { get: { summary: 'List team users', responses: { 200: { description: 'ok' } } } },
    '/api/notifications': { get: { summary: 'Notification feed', responses: { 200: { description: 'ok' } } } },
  },
};

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (['/health', '/ready', '/version', '/openapi.json'].includes(url.pathname) && req.method === 'GET') {
      return handlePlatform(req, res, url);
    }
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    if (e && e.code && e.code >= 400 && e.code < 600) return err(res, e.code, e.message);
    console.error(e);
    return err(res, 500, 'Internal server error');
  }
});
server.listen(PORT, () => {
  console.log(`PurePak server ready: http://localhost:${PORT}`);
  if (process.env.PUREPAK_DEMO === '1') {
    console.log('Demo logins (password: purepak123):');
    console.log('  admin@purepak.pk / manager@purepak.pk / finance@purepak.pk / delivery@purepak.pk / hina@purepak.pk');
    console.log('  bilal@purepak.pk / nadia@purepak.pk / omar@purepak.pk (agents)');
    console.log('  ali@rascon.pk / sana@funloft.pk (customers)');
  } else {
    const n = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    console.log(n === 0 ? 'Fresh database — the first account that signs up becomes the owner (admin).' : `Production mode — ${n} account(s), no demo data.`);
  }
});
