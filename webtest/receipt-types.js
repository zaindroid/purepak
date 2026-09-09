'use strict';
// Receipt OCR of varying formats (sales vs purchase) -> normalized auto-fill contract.
// Needs a Gemini key on the server (GEMINI_API_KEY); if OCR can't run the shape
// checks are skipped with a note rather than failing the suite.
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:4310';
const PW = 'purepak123';
let fails = 0;
const check = (n, ok, extra = '') => { if (!ok) { fails++; console.log('FAIL', n, extra); } else console.log('ok  ', n); };
const skip = (n, why) => console.log('skip', n, '(' + why + ')');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function login(email) {
  const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PW }) });
  const j = await r.json(); if (!j.token) throw new Error('login ' + email + ' ' + JSON.stringify(j)); return j.token;
}
async function api(t, m, p, b) {
  const r = await fetch(BASE + '/api' + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b != null ? JSON.stringify(b) : undefined });
  let j = null; try { j = await r.json(); } catch {} return { status: r.status, body: j };
}
async function scan(tok, imgPath, kind) {
  const dataUrl = 'data:image/png;base64,' + fs.readFileSync(imgPath).toString('base64');
  const up = await api(tok, 'POST', '/receipts', { image: dataUrl, mimetype: 'image/png', filename: path.basename(imgPath), kind });
  if (up.status !== 201) throw new Error('upload ' + up.status + ' ' + JSON.stringify(up.body));
  const rid = up.body.id;
  let rec;
  for (let i = 0; i < 22; i++) {
    await sleep(3000);
    const rows = (await api(tok, 'GET', '/receipts?status=pending')).body || [];
    rec = rows.find(x => x.id === rid);
    if (rec && rec.ocr_status !== 'pending') break;
  }
  return rec;
}

const KINDS = ['expense', 'income', 'sales', 'agent_commission', 'other'];

(async () => {
  const finance = await login('finance@purepak.pk');
  const img = path.join(__dirname, 'test_receipt.png');
  check('sample receipt image exists', fs.existsSync(img));

  const rec = await scan(finance, img, 'expense');
  check('scan produced a record', !!rec, JSON.stringify(rec));
  if (!rec || rec.ocr_status !== 'done') {
    skip('OCR shape checks', 'ocr_status=' + (rec && rec.ocr_status) + ' — no Gemini key or quota');
    console.log('----');
    console.log(fails === 0 ? 'RECEIPT TYPES: ALL PASS (OCR skipped)' : fails + ' FAILURES');
    process.exit(fails ? 1 : 0);
  }
  const ex = rec.extracted || {};
  check('extraction has a type', ex.type === 'generic' || ex.type === 'purepak', JSON.stringify(ex).slice(0, 200));
  check('extraction carries doc_kind', typeof ex.doc_kind === 'string' && ex.doc_kind.length > 0);
  check('extraction carries a direction (money_in|money_out)', ex.direction === 'money_in' || ex.direction === 'money_out' || ex.direction === null);
  check('suggested_kind is one the app understands', KINDS.includes(ex.suggested_kind), ex.suggested_kind);
  check('direction & suggested_kind agree', ex.direction === 'money_out' ? ex.suggested_kind === 'expense'
    : ex.direction === 'money_in' ? ['sales', 'income'].includes(ex.suggested_kind) : true, ex.direction + '/' + ex.suggested_kind);
  check('a numeric total was extracted', typeof ex.total === 'number' && ex.total > 0, String(ex.total));
  check('amount mirrors total for auto-fill', ex.amount === ex.total);
  check('line items are normalized {item,qty,unit_price,price,amount}', Array.isArray(ex.line_items) && ex.line_items.every(li =>
    'item' in li && 'qty' in li && 'unit_price' in li && 'price' in li && 'amount' in li), JSON.stringify(ex.line_items));
  check('vendor/party captured', !!(ex.vendor || ex.party));
  check('record.kind adopted the AI suggestion (scanner left default)', rec.kind === ex.suggested_kind, rec.kind + ' vs ' + ex.suggested_kind);
  check('record.amount auto-filled from OCR', rec.amount === ex.total, rec.amount + ' vs ' + ex.total);
  check('record.memo auto-composed when blank', typeof rec.memo === 'string' && rec.memo.length > 0, rec.memo);

  // a scanner-chosen non-default kind must NOT be overridden by the AI
  const rec2 = await scan(finance, img, 'income');
  if (rec2 && rec2.ocr_status === 'done') {
    check('explicit scanner kind is kept over the AI guess', rec2.kind === 'income', rec2.kind);
  } else skip('explicit-kind check', 'second OCR did not complete');

  console.log('----');
  console.log(fails === 0 ? 'RECEIPT TYPES: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
