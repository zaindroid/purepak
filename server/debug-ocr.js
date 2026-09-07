'use strict';
// Reproduce server-side extractReceipt exactly, with full error output
const fs = require('fs');
const { open } = require('./db');
const db = open();
const key = db.prepare("SELECT value FROM settings WHERE key='gemini_api_key'").get().value;
console.log('key repr:', JSON.stringify(key));

(async () => {
  const files = fs.readdirSync(__dirname + '/data/receipts').filter(f => f.startsWith('3_'));
  console.log('testing file:', files[0]);
  const b64 = fs.readFileSync(__dirname + '/data/receipts/' + files[0]).toString('base64');
  const imgBuf = Buffer.from(b64, 'base64');
  console.log('saved image bytes:', imgBuf.length, 'magic:', imgBuf.slice(0, 8).toString('hex'));
  // also compare with original
  const orig = fs.readFileSync(__dirname + '/../webtest/test_receipt.png');
  console.log('orig bytes:', orig.length, 'magic:', orig.slice(0, 8).toString('hex'));
  console.log('files equal:', orig.equals(imgBuf));

  const body = {
    contents: [{ parts: [
      { text: 'Extract from this receipt as ONLY JSON: {"vendor":string,"date":string,"amount":number}.' },
      { inline_data: { mime_type: 'image/png', data: b64 } },
    ] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  };
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=' + key, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  console.log('status:', res.status);
  console.log((await res.text()).slice(0, 600));
})().catch(e => console.error('ERR', e.message));
