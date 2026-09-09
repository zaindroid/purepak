'use strict';
// Payment method on orders + the business's receiving accounts + method carried
// into the ledger memo on payment.
const BASE = process.env.BASE || 'http://localhost:4310';
const PW = 'purepak123';
let fails = 0;
const check = (n, ok, extra = '') => { if (!ok) { fails++; console.log('FAIL', n, extra); } else console.log('ok  ', n); };

async function login(email) {
  const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PW }) });
  const j = await r.json(); if (!j.token) throw new Error('login ' + email); return j.token;
}
async function api(t, m, p, b) {
  const r = await fetch(BASE + '/api' + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b != null ? JSON.stringify(b) : undefined });
  let j = null; try { j = await r.json(); } catch {} return { status: r.status, body: j };
}

(async () => {
  const admin = await login('admin@purepak.pk');
  const finance = await login('finance@purepak.pk');
  const cust = await login('ali@rascon.pk'); // seeded with an address

  // list — COD always present
  let pm = await api(admin, 'GET', '/payment-methods');
  check('payment methods list returns', pm.status === 200 && pm.body.methods.some(m => m.id === 'cod'), JSON.stringify(pm.body.methods && pm.body.methods.map(m => m.id)));
  check('COD does not need an account', pm.body.methods.find(m => m.id === 'cod').needs_account === false);
  check('JazzCash needs an account', pm.body.methods.find(m => m.id === 'jazzcash').needs_account === true);

  // admin configures the business accounts
  const save = await api(admin, 'POST', '/payment-methods', { accounts: {
    jazzcash: { name: 'PurePak', detail: '0300-1112223' },
    bank: { name: 'PurePak Pvt Ltd', detail: 'PK36SCBL0000001123456702' },
    easypaisa: { name: '', detail: '' }, // empty -> dropped
  } });
  check('admin saves payment accounts', save.status === 200 && save.body.accounts.jazzcash.detail === '0300-1112223', JSON.stringify(save.body.accounts));
  check('empty account is not stored', !save.body.accounts.easypaisa);

  // finance cannot edit accounts
  const denied = await api(finance, 'POST', '/payment-methods', { accounts: { jazzcash: { name: 'x', detail: 'y' } } });
  check('finance CANNOT edit payment accounts', denied.status === 403);

  // customer sees the accounts (to pay)
  const cpm = await api(cust, 'GET', '/payment-methods');
  check('customer can read methods + accounts', cpm.status === 200 && cpm.body.accounts.jazzcash.detail === '0300-1112223');

  // order carries the chosen method
  const o1 = await api(cust, 'POST', '/orders', { items: [{ product_id: 3, qty: 2 }], payment_method: 'jazzcash' });
  check('order stores the chosen payment method', o1.status === 201 && o1.body.payment_method === 'jazzcash', JSON.stringify(o1.body));
  const o2 = await api(cust, 'POST', '/orders', { items: [{ product_id: 3, qty: 1 }] });
  check('order defaults to cod when none given', o2.status === 201 && o2.body.payment_method === 'cod');
  const oBad = await api(cust, 'POST', '/orders', { items: [{ product_id: 3, qty: 1 }], payment_method: 'bitcoin' });
  check('an unknown method falls back to cod', oBad.status === 201 && oBad.body.payment_method === 'cod');

  // finance records payment "via" a method -> ledger memo reflects it
  const led0 = (await api(admin, 'GET', '/ledger')).body.length;
  const pay = await api(finance, 'PATCH', '/orders/' + o1.body.id, { paid: o1.body.total, method: 'jazzcash', memo: 'TXN 998877' });
  check('payment recorded with method', pay.status === 200 && pay.body.payment_status === 'paid' && pay.body.payment_method === 'jazzcash');
  const led = (await api(admin, 'GET', '/ledger')).body;
  const entry = led.find(r => r.ref === 'order#' + o1.body.id);
  check('a ledger entry was posted for the payment', led.length === led0 + 1 && !!entry);
  check('ledger entry names the method', entry && /via JazzCash/.test(entry.memo || '') && /TXN 998877/.test(entry.memo || ''), entry && entry.memo);

  // and the audit trail records it too
  const av = await api(admin, 'GET', '/audit/verify');
  check('audit chain still verifies', av.body.ok === true);
  const al = await api(admin, 'GET', '/audit');
  check('the account change is audited', al.body.entries.some(e => e.action === 'settings.payment_accounts'));
  check('the payment is audited with the method', al.body.entries.some(e => e.action === 'order.pay' && /JazzCash/.test(e.summary || '')));

  console.log('----');
  console.log(fails === 0 ? 'PAYMENTS: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
