'use strict';
// End-to-end receipt test via the real HTTP API (no shell quoting of base64)
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:4310';
const login = async (email) => {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'purepak123' }),
  });
  return (await r.json()).token;
};

(async () => {
  const token = await login('finance@purepak.pk');
  const img = fs.readFileSync(path.join(__dirname, '..', 'webtest', 'test_receipt.png'));
  const b64 = 'data:image/png;base64,' + img.toString('base64');

  // 1. upload
  const up = await fetch(BASE + '/api/receipts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ image: b64, mimetype: 'image/png', filename: 'e2e_receipt.png', kind: 'expense' }),
  });
  const upj = await up.json();
  console.log('upload:', up.status, 'id:', upj.id, 'ocr_status:', upj.ocr_status);
  const rid = upj.id;

  // 2. poll OCR up to 30s
  let receipt = null;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const rj = await (await fetch(BASE + '/api/receipts?q=e2e', { headers: { Authorization: 'Bearer ' + token } })).json();
    receipt = rj.find(x => x.id === rid);
    if (receipt && receipt.ocr_status !== 'pending') break;
  }
  console.log('ocr_status:', receipt?.ocr_status);
  console.log('extracted:', JSON.stringify(receipt?.extracted));

  // 3. post to ledger
  if (receipt?.extracted?.amount || receipt?.amount) {
    const pj = await (await fetch(BASE + '/api/receipts/' + rid + '/post', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })).json();
    console.log('posted:', pj.posted, 'ref:', pj.posted_ref);
    const led = await (await fetch(BASE + '/api/ledger?since=2026-08-24', { headers: { Authorization: 'Bearer ' + token } })).json();
    const l = led.find(x => x.ref === 'receipt#' + rid);
    console.log('ledger row:', JSON.stringify(l));
  } else {
    console.log('NO AMOUNT EXTRACTED - cannot post');
  }
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
