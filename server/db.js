'use strict';
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

// Data dir is env-overridable so the app can persist to a mounted volume
// (e.g. PUREPAK_DATA_DIR=/var/lib/purepak on Zorc). Defaults to ./data.
const DATA_DIR = process.env.PUREPAK_DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'purepak.db');

function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(pw, salt, 64).toString('hex');
  return salt + ':' + h;
}
function verifyPassword(pw, stored) {
  const [salt, h] = String(stored).split(':');
  const calc = crypto.scryptSync(pw, salt, 64).toString('hex');
  try { return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(calc, 'hex')); }
  catch { return false; }
}

function open() {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

function migrate(db) {
  // one-off upgrades for pre-existing databases
  const rcols = db.prepare(`PRAGMA table_info(receipts)`).all().map(c => c.name);
  if (rcols.length && !rcols.includes('status')) {
    db.exec(`ALTER TABLE receipts ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved'))`);
  }
  if (rcols.length && !rcols.includes('reviewed_by')) {
    db.exec(`ALTER TABLE receipts ADD COLUMN reviewed_by TEXT`);
  }
  if (rcols.length && !rcols.includes('reviewed_at')) {
    db.exec(`ALTER TABLE receipts ADD COLUMN reviewed_at TEXT`);
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      ref TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
  `);
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('admin','manager','finance','delivery','employee','agent','customer')),
    agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    salary REAL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending','active','disabled')),
    active INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    size_ml INTEGER NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS customer_types (
    name TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    area TEXT,
    type TEXT NOT NULL DEFAULT 'retail',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    area TEXT,
    commission_pct REAL NOT NULL DEFAULT 5,
    active INTEGER NOT NULL DEFAULT 1
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
    period TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'accrued' CHECK(status IN ('accrued','paid')),
    paid_at TEXT,
    ledger_ref TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, period)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'new'
      CHECK(status IN ('new','confirmed','in_delivery','delivered','cancelled')),
    total REAL NOT NULL DEFAULT 0,
    paid REAL NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'unpaid'
      CHECK(payment_status IN ('unpaid','partial','paid')),
    notes TEXT,
    placed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    qty INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    line_total REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    driver TEXT NOT NULL,
    vehicle TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending','out_for_delivery','delivered','failed')),
    scheduled_at TEXT,
    delivered_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL REFERENCES agents(id),
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    pct REAL NOT NULL,
    period TEXT,
    status TEXT NOT NULL DEFAULT 'accrued' CHECK(status IN ('accrued','paid')),
    paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    amount REAL NOT NULL,
    ref TEXT,
    memo TEXT,
    at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'expense' CHECK(kind IN ('expense','income','sales','agent_commission','other')),
    amount REAL,
    vendor TEXT,
    memo TEXT,
    extracted TEXT,            -- JSON blob of AI extraction (line items, ocr confidence, etc.)
    ocr_status TEXT NOT NULL DEFAULT 'pending' CHECK(ocr_status IN ('pending','done','failed')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved')),  -- staging gate
    posted INTEGER NOT NULL DEFAULT 0,
    posted_ref TEXT,           -- ledger ref after posting
    recorded_by TEXT,
    reviewed_by TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `);
  // light migrations for existing databases
  const cols = db.prepare(`PRAGMA table_info(customers)`).all().map(c => c.name);
  if (!cols.includes('lat')) db.exec('ALTER TABLE customers ADD COLUMN lat REAL');
  if (!cols.includes('lng')) db.exec('ALTER TABLE customers ADD COLUMN lng REAL');
  if (!cols.includes('type')) db.exec(`ALTER TABLE customers ADD COLUMN type TEXT NOT NULL DEFAULT 'retail'`);

  const ucols = db.prepare(`PRAGMA table_info(users)`).all().map(c => c.name);
  if (!ucols.includes('salary')) db.exec('ALTER TABLE users ADD COLUMN salary REAL');
  if (!ucols.includes('status')) db.exec(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending','active','disabled'))`);
  if (!ucols.includes('last_login_at')) db.exec('ALTER TABLE users ADD COLUMN last_login_at TEXT');
  // existing rows keep role values; ensure no row has an invalid role after adding 'manager'
  // (CHECK is only enforced on new data in ALTER, so existing invalid values are harmless)

  // seed customer types if empty
  const ct = db.prepare('SELECT COUNT(*) AS c FROM customer_types').get().c;
  if (ct === 0) {
    const insCt = db.prepare('INSERT INTO customer_types(name) VALUES (?)');
    for (const t of ['retail', 'wholesale', 'hotel', 'restaurant', 'institutional']) insCt.run(t);
  }
}

function seedCatalog(db) {
  const n = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (n > 0) return;
  // Products — PurePak's real lineup from purepak.com.pk
  const insP = db.prepare('INSERT INTO products(name,size_ml,price,description) VALUES (?,?,?,?)');
  const products = [
    ['Pure Pak 500 ML', 500, 10, 'Portable bottled drinking water'],
    ['Pure Pak 1.5 L', 1500, 20, 'Everyday bottled drinking water'],
    ['Pure Pak 6 L', 6000, 45, 'Family-size drinking water'],
    ['Pure Pak 12 L', 12000, 80, 'Office & home dispenser water'],
    ['Pure Pak 19 L', 19000, 110, 'Dispenser-grade drinking water'],
  ];
  for (const p of products) insP.run(...p);
}

// Dummy/demo dataset — only created when PUREPAK_DEMO=1 (tests & demos), never in production
function seedDemo(db) {
  const n = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (n > 0) return false;

  const insC = db.prepare('INSERT INTO customers(name,contact_name,phone,email,address,area,lat,lng,type) VALUES (?,?,?,?,?,?,?,?,?)');
  const customers = [
    ['Rascon', 'Ali Raza', '0300-1112223', 'ali@rascon.pk', 'Plot 12, I-8/3', 'I-8', 33.6022, 73.0428, 'wholesale'],
    ['Fun Loft', 'Sana Malik', '0301-2223334', 'sana@funloft.pk', 'Blue Area', 'I-9', 33.6072, 73.0635, 'retail'],
    ['Appinators', 'Hassan Iqbal', '0321-3334445', 'hassan@appinators.pk', 'Johar Town', 'Johar Town', 33.6490, 73.0547, 'hotel'],
    ['Mindbyte', 'Zaid Khan', '0333-4445556', 'zaid@mindbyte.pk', 'Markaz', 'Markaz', 33.6290, 73.0660, 'hotel'],
    ['Realty Corp', 'Imran Butt', '0345-5556667', 'imran@realestate.pk', 'DHA Phase 5', 'DHA', 33.5805, 73.0725, 'institutional'],
  ];
  const custIds = customers.map(c => insC.run(...c).lastInsertRowid);

  const insA = db.prepare('INSERT INTO agents(name,phone,email,area,commission_pct) VALUES (?,?,?,?,?)');
  const agents = [
    ['Bilal Ahmed', '0300-9000001', 'bilal@purepak.pk', 'I-8 & I-9', 6],
    ['Nadia Shah', '0300-9000002', 'nadia@purepak.pk', 'Johar Town & Markaz', 5],
    ['Omar Farooq', '0300-9000003', 'omar@purepak.pk', 'DHA & Bahria', 5],
  ];
  const agentIds = agents.map(a => insA.run(...a).lastInsertRowid);

  // Orders with items, deliveries, commissions, and ledger entries
  const insO = db.prepare(`INSERT INTO orders(customer_id,agent_id,status,total,paid,payment_status,notes,placed_at)
                           VALUES (?,?,?,?,?,?,?,?)`);
  const insOI = db.prepare('INSERT INTO order_items(order_id,product_id,qty,unit_price,line_total) VALUES (?,?,?,?,?)');
  const insD = db.prepare(`INSERT INTO deliveries(order_id,driver,vehicle,status,scheduled_at,delivered_at,notes)
                           VALUES (?,?,?,?,?,?,?)`);
  const insComm = db.prepare('INSERT INTO commissions(agent_id,order_id,amount,pct,period,status,paid_at) VALUES (?,?,?,?,?,?,?)');
  const insLedger = db.prepare('INSERT INTO ledger(account,type,amount,ref,memo,at) VALUES (?,?,?,?,?,?)');

  const now = new Date();
  function daysAgo(n, hour = 10) {
    const d = new Date(now); d.setDate(d.getDate() - n); d.setHours(hour, 0, 0, 0);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  const p = { 500: 10, 1500: 20, 6000: 45, 12000: 80, 19000: 110 };

  // [customerIdx, agentIdx, [[size_ml, qty]...], placedDaysAgo, status, paidFrac]
  const orderSpecs = [
    [0, 0, [[12000, 4], [19000, 2]], 28, 'delivered', 1.0],
    [1, 0, [[6000, 8]], 26, 'delivered', 1.0],
    [2, 1, [[19000, 3], [1500, 12]], 24, 'delivered', 1.0],
    [3, 1, [[12000, 6]], 21, 'delivered', 0.6],
    [4, 2, [[19000, 5]], 18, 'delivered', 1.0],
    [0, 0, [[6000, 10]], 15, 'delivered', 1.0],
    [1, 0, [[12000, 4], [19000, 1]], 12, 'delivered', 1.0],
    [2, 1, [[1500, 24]], 9, 'in_delivery', 0.5],
    [3, 1, [[19000, 4]], 6, 'confirmed', 0.0],
    [4, 2, [[6000, 6], [12000, 2]], 3, 'new', 0.0],
    [0, 0, [[12000, 2]], 1, 'new', 0.0],
    [2, 1, [[19000, 2], [6000, 4]], 0, 'confirmed', 0.0],
  ];

  let incomeTotal = 0;
  let incomePaid = 0;
  let commissionTotal = 0;
  let commissionPaid = 0;
  const drivers = ['Waqas', 'Shakeel', 'Imtiaz'];
  let orderSeq = 0;

  for (const [ci, ai, items, age, status, paidFrac] of orderSpecs) {
    const custId = custIds[ci];
    const agentId = ai === null ? null : agentIds[ai];
    let total = 0;
    const itemRows = items.map(([size, qty]) => {
      const price = p[size];
      total += price * qty;
      return [size, qty, price, price * qty];
    });
    const placed = daysAgo(age);
    const paid = Math.round(total * paidFrac * 100) / 100;
    const payStatus = paidFrac >= 1 ? 'paid' : (paidFrac > 0 ? 'partial' : 'unpaid');
    const res = insO.run(custId, agentId, status, total, paid, payStatus,
      status === 'cancelled' ? 'Cancelled by customer' : null, placed);
    const orderId = res.lastInsertRowid;
    orderSeq++;
    for (const [size, qty, price, lineTotal] of itemRows) {
      const prod = db.prepare('SELECT id FROM products WHERE size_ml=?').get(size);
      insOI.run(orderId, prod.id, qty, price, lineTotal);
    }

    // Delivery
    let dStatus = 'pending'; let scheduled = null; let delivered = null;
    if (status === 'delivered') { dStatus = 'delivered'; scheduled = daysAgo(age - 1, 9); delivered = daysAgo(age - 1, 13); }
    else if (status === 'in_delivery') { dStatus = 'out_for_delivery'; scheduled = daysAgo(0, 9); }
    else if (status === 'confirmed') { dStatus = 'pending'; scheduled = daysAgo(-1, 10); }
    insD.run(orderId, drivers[orderSeq % drivers.length], 'Ravi truck', dStatus, scheduled, delivered, null);

    // Commission (only if agent + not cancelled)
    if (agentId != null && status !== 'cancelled') {
      const commRow = db.prepare('SELECT commission_pct FROM agents WHERE id=?').get(agentId);
      const pct = commRow.commission_pct;
      const amt = Math.round(total * pct / 100 * 100) / 100;
      const paid = paidFrac >= 1 && age <= 15;
      insComm.run(agentId, orderId, amt, pct,
        new Date(placed).toISOString().slice(0, 7),
        paid ? 'paid' : 'accrued', paid ? daysAgo(age - 15, 11) : null);
      commissionTotal += amt;
      if (paid) commissionPaid += amt;
    }

    // Ledger: income when paid
    if (paid > 0) {
      insLedger.run('Cash / Bank', 'income', paid, 'order#' + orderId,
        'Water sale - customer', placed);
      incomePaid += paid;
      incomeTotal += total;
    }
  }

  // Seed a couple of operating expenses
  const expenses = [
    ['Vehicle fuel', 4200, 20, 'Ravi truck fuel'],
    ['Filter & plant service', 12000, 10, 'RO plant maintenance'],
    ['Bottles & packing', 6500, 5, '12L + 19L bottles restock'],
    ['Agent salary advance', 15000, 2, 'Monthly advance'],
  ];
  let expenseTotal = 0;
  for (const [acct, amt, age, memo] of expenses) {
    insLedger.run(acct, 'expense', amt, null, memo, daysAgo(age));
    expenseTotal += amt;
  }

  // Price matrix overrides (per customer type; null = use base price)
  const insPP = db.prepare('INSERT INTO product_prices(product_id,customer_type,price) VALUES (?,?,?)');
  const pIds = db.prepare('SELECT id, size_ml FROM products').all();
  const priceFor = (size) => pIds.find(x => x.size_ml === size).id;
  const matrix = [
    [priceFor(500), 'wholesale', 8], [priceFor(1500), 'wholesale', 16], [priceFor(6000), 'wholesale', 38],
    [priceFor(12000), 'wholesale', 65], [priceFor(19000), 'wholesale', 95],
    [priceFor(500), 'hotel', 12], [priceFor(1500), 'hotel', 24], [priceFor(19000), 'hotel', 100],
    [priceFor(19000), 'institutional', 105], [priceFor(12000), 'institutional', 85],
  ];
  for (const m of matrix) insPP.run(...m);

  // Users with demo passwords
  const insU = db.prepare(`INSERT INTO users(name,email,phone,password_hash,role,salary,agent_id,customer_id,status)
                           VALUES (?,?,?,?,?,?,?,?,?)`);
  function addU(name, email, phone, role, agentIdx, custIdx, salary) {
    insU.run(name, email, phone, hashPassword('purepak123'), role, salary,
      agentIdx == null ? null : agentIds[agentIdx],
      custIdx == null ? null : custIds[custIdx],
      'active');
  }
  addU('Adeel (Owner)', 'admin@purepak.pk', '0315-6666796', 'admin', null, null, 0);
  addU('Maryam Khan (Manager)', 'manager@purepak.pk', '0315-6666799', 'manager', null, null, 50000);
  addU('Accounts Team', 'finance@purepak.pk', '0315-6666797', 'finance', null, null, 40000);
  addU('Waqas (Driver)', 'delivery@purepak.pk', '0315-6666798', 'delivery', null, null, 25000);
  addU('Hina Aslam', 'hina@purepak.pk', '0315-6666790', 'employee', null, null, 20000);
  addU('Bilal Ahmed', 'bilal@purepak.pk', '0300-9000001', 'agent', 0, null, null);
  addU('Nadia Shah', 'nadia@purepak.pk', '0300-9000002', 'agent', 1, null, null);
  addU('Omar Farooq', 'omar@purepak.pk', '0300-9000003', 'agent', 2, null, null);
  addU('Ali Raza', 'ali@rascon.pk', '0300-1112223', 'customer', null, 0, null);
  addU('Sana Malik', 'sana@funloft.pk', '0301-2223334', 'customer', null, 1, null);

  return true;
}

function init() {
  const db = open();
  migrate(db);
  seedCatalog(db);
  const demo = process.env.PUREPAK_DEMO === '1';
  const seeded = demo ? seedDemo(db) : false;
  return { db, seeded, demo, DB_PATH };
}

if (require.main === module) {
  const r = init();
  console.log('PurePak DB ready: ' + r.DB_PATH + (r.demo ? (r.seeded ? ' (seeded demo data)' : ' (demo mode)') : ' (clean, no demo data)'));
}

module.exports = { init, open, hashPassword, verifyPassword, DB_PATH };
