'use strict';
// Live test: approve receipt #7 with edits (finance), then read the sender's bell
const B = 'http://localhost:4310';
async function req(method, path, tok, body) {
  const r = await fetch(B + path, {
    method,
    headers: { ...(tok ? { Authorization: 'Bearer ' + tok } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
}
(async () => {
  const fin = (await req('POST', '/api/auth/login', null, { email: 'finance@purepak.pk', password: 'purepak123' })).data.token;
  console.log('finance login ok');

  const ap = await req('POST', '/api/receipts/7/approve', fin, { amount: 8200, vendor: 'Babu J Pharmacy', kind: 'sales' });
  console.log('approve status:', ap.status, '| amount:', ap.data && ap.data.amount, '| vendor:', ap.data && ap.data.vendor, '| status:', ap.data && ap.data.status);

  const ag = (await req('POST', '/api/auth/login', null, { email: 'bilal@purepak.pk', password: 'purepak123' })).data.token;
  const notes = (await req('GET', '/api/notifications', ag)).data;
  const list = Array.isArray(notes) ? notes : (notes.notifications || []);
  console.log('--- sender bell (newest first) ---');
  list.slice(0, 4).forEach(n => console.log((n.read ? 'read' : 'NEW ') + ' | ' + n.title + ' | ' + n.body));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
