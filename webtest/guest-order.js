'use strict';
// The QR-code landing page (/order) needs no login at all: GET /order serves
// the page, GET /api/public/products lists the catalog, POST /api/public/order
// creates a real order that flows through the normal pipeline. Covers the
// guest checkout end to end, returning-customer phone matching, validation,
// and rate limiting.
const BASE = process.env.BASE || 'http://localhost:4310';
const PW = 'purepak123';
let fails = 0;
const check = (n, ok, extra = '') => { if (!ok) { fails++; console.log('FAIL', n, extra); } else console.log('ok  ', n); };

async function api(t, m, p, b) {
  const r = await fetch(BASE + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b != null ? JSON.stringify(b) : undefined });
  let j = null; try { j = await r.json(); } catch {} return { status: r.status, body: j };
}
const login = async (email) => (await api(null, 'POST', '/api/auth/login', { email, password: PW })).body.token;

(async () => {
  // ---------- the landing page itself needs no auth ----------
  const page = await fetch(BASE + '/order');
  check('GET /order serves the page (no auth)', page.status === 200 && (await page.clone().text()).includes('PurePak'));
  check('the page is real order.html, not the SPA shell', (await page.text()).includes('Choose your water'));

  const prods = await api(null, 'GET', '/api/public/products');
  check('GET /api/public/products needs no auth', prods.status === 200 && Array.isArray(prods.body) && prods.body.length > 0);
  const p12 = prods.body.find(p => p.size_ml === 12000);
  const p19 = prods.body.find(p => p.size_ml === 19000);
  const p6 = prods.body.find(p => p.size_ml === 6000);

  // ---------- validation ----------
  check('rejects a missing name', (await api(null, 'POST', '/api/public/order', { name: '', phone: '03001112233', address: 'a real address', items: [{ product_id: p6.id, qty: 1 }] })).status === 400);
  check('rejects a bad phone', (await api(null, 'POST', '/api/public/order', { name: 'Bob', phone: '12', address: 'a real address', items: [{ product_id: p6.id, qty: 1 }] })).status === 400);
  check('rejects a missing address', (await api(null, 'POST', '/api/public/order', { name: 'Bob', phone: '03001112233', address: 'no', items: [{ product_id: p6.id, qty: 1 }] })).status === 400);
  check('rejects an empty basket', (await api(null, 'POST', '/api/public/order', { name: 'Bob', phone: '03001112233', address: 'a real address', items: [] })).status === 400);

  // ---------- a first-time guest order ----------
  const phone = '0333-777' + Math.floor(1000 + Math.random() * 8999);
  const admin = await login('admin@purepak.pk');
  const before = (await api(admin, 'GET', '/api/notifications')).body.notifications.length;
  const o1 = await api(null, 'POST', '/api/public/order', {
    name: 'Guest QR Tester', phone, address: 'House 9, Street 2, F-8', area: 'F-8',
    items: [{ product_id: p12.id, qty: 2 }, { product_id: p19.id, qty: 1 }],
    source: 'test-kiosk', notes: 'ring the bell',
  });
  check('guest order created', o1.status === 201 && o1.body.id > 0, JSON.stringify(o1.body));
  const expectedTotal = 2 * p12.price + 1 * p19.price;
  check('guest order total is priced correctly', o1.body.total === expectedTotal, `${o1.body.total} vs ${expectedTotal}`);

  const ord = (await api(admin, 'GET', '/api/orders/' + o1.body.id)).body;
  check('order is new/unpaid/cod, no login required to create it', ord.status === 'new' && ord.payment_status === 'unpaid' && ord.payment_method === 'cod');
  check('customer name/phone/address captured from the form', ord.customer_name === 'Guest QR Tester' && ord.customer_address === 'House 9, Street 2, F-8');
  check('QR source + note both landed in the order notes', /QR: test-kiosk/.test(ord.notes) && /ring the bell/.test(ord.notes), ord.notes);

  const notifs = (await api(admin, 'GET', '/api/notifications')).body.notifications;
  check('staff got a live notification for the guest order', notifs.length > before && /Guest QR Tester/.test(notifs[0].body), notifs[0] && notifs[0].body);

  // ---------- a returning guest: same phone, different formatting, different address ----------
  const customersBefore = (await api(admin, 'GET', '/api/customers')).body.filter(c => c.name === 'Guest QR Tester').length;
  const o2 = await api(null, 'POST', '/api/public/order', {
    name: 'Guest QR Tester', phone: phone.replace(/\D/g, ''), // no dashes this time
    address: 'A totally different office address', items: [{ product_id: p6.id, qty: 1 }],
  });
  check('second order from the same (differently formatted) phone succeeds', o2.status === 201);
  const customersAfter = (await api(admin, 'GET', '/api/customers')).body.filter(c => c.name === 'Guest QR Tester').length;
  check('no duplicate customer created for the returning guest', customersAfter === customersBefore, `${customersBefore} -> ${customersAfter}`);
  const ord2 = (await api(admin, 'GET', '/api/orders/' + o2.body.id)).body;
  check("returning guest's saved address is untouched; the new one is a delivery note instead",
    ord2.customer_address === 'House 9, Street 2, F-8' && /Deliver to: A totally different office address/.test(ord2.notes || ''), JSON.stringify({ addr: ord2.customer_address, notes: ord2.notes }));

  // ---------- rate limiting (per phone) ----------
  const rlPhone = '0300-999' + Math.floor(1000 + Math.random() * 8999);
  const codes = [];
  for (let i = 0; i < 7; i++) {
    const r = await api(null, 'POST', '/api/public/order', { name: 'Rate Test', phone: rlPhone, address: 'a real address here', items: [{ product_id: p6.id, qty: 1 }] });
    codes.push(r.status);
  }
  check('per-phone rate limit eventually kicks in (429)', codes.includes(429), codes.join(','));
  check('a handful of orders from one phone still go through before the limit', codes.slice(0, 5).includes(201), codes.join(','));

  console.log('----');
  console.log(fails === 0 ? 'GUEST ORDER: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
