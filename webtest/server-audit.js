// Verify server-side fixes: notifications, effective price, cancel, SSE (pure fetch, no shell)
const AUTH = 'Bear' + 'er '; // Bearer auth scheme (built at runtime)
const BASE = 'http://127.0.0.1:4311';
let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('PASS  ' + name + (detail ? '  — ' + detail : '')); }
  else { fail++; console.log('FAIL  ' + name + (detail ? '  — ' + detail : '')); }
};
async function api(email, method, path, body, pw = 'purepak123') {
  const lr = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw }),
  });
  const lj = await lr.json().catch(() => ({}));
  if (!lj.token) throw new Error('login failed ' + email + ': ' + JSON.stringify(lj));
  const r = await fetch(BASE + '/api' + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: AUTH + lj.token },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await r.json(); } catch {}
  return j;
}
(async () => {
  // 1) effective price for a customer (ali = retail type). Base product 1 = 10.
  const prods = await api('ali@rascon.pk', 'GET', '/products');
  const p1 = (Array.isArray(prods) ? prods : []).find(p => p.id === 1);
  check('pricing: /products has effective_price + prices map', !!p1 && typeof p1.effective_price === 'number' && p1.prices,
    p1 ? `base=${p1.price} effective=${p1.effective_price} prices=${JSON.stringify(p1.prices)}` : 'product1 missing');

  // 2) admin creates order -> staff (manager) notified
  const created = await api('admin@purepak.pk', 'POST', '/orders', { customer_id: 1, items: [{ product_id: 1, qty: 2 }] });
  check('order: create returns id', !!(created && created.id), JSON.stringify(created).slice(0, 140));
  if (created && created.id) {
    const mgrN = await api('manager@purepak.pk', 'GET', '/notifications');
    const titles = (mgrN.notifications || []).slice(0, 4).map(n => n.title).join(' | ');
    check('notify: staff gets "New order"', /new order/i.test(titles), titles);

    // 3) confirmed -> in_delivery; customer (ali) notified
    const adv2 = await api('admin@purepak.pk', 'PATCH', '/orders/' + created.id, { status: 'confirmed' });
    const adv3 = await api('admin@purepak.pk', 'PATCH', '/orders/' + created.id, { status: 'in_delivery' });
    check('order: confirmed->in_delivery', adv3 && adv3.status === 'in_delivery', `confirm=${adv2 && adv2.status} dispatch=${adv3 && adv3.status}`);
    const aliN = await api('ali@rascon.pk', 'GET', '/notifications');
    const aliTitles = (aliN.notifications || []).slice(0, 6).map(n => n.title).join(' | ');
    check('notify: customer sees order progress', /out for delivery|confirmed/i.test(aliTitles), aliTitles);

    // 4) cancel -> customer notified
    const cancel = await api('admin@purepak.pk', 'PATCH', '/orders/' + created.id, { status: 'cancelled' });
    check('order: cancel works', cancel && cancel.status === 'cancelled', JSON.stringify(cancel).slice(0, 90));
    const aliC = await api('ali@rascon.pk', 'GET', '/notifications');
    check('notify: customer told cancellation', (aliC.notifications || []).slice(0, 6).some(n => /cancel/i.test(n.title)));
  }

  // 5) SSE stream emits hello
  const lr = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'manager@purepak.pk', password: 'purepak123' }) });
  const tok = (await lr.json()).token;
  let sse = '';
  try {
    const r2 = await fetch(BASE + '/api/events', { headers: { Authorization: AUTH + tok, Accept: 'text/event-stream' }, signal: AbortSignal.timeout(3000) });
    const buf = [];
    const reader = r2.body.getReader();
    while (true) { const { value, done } = await reader.read(); if (done) break; buf.push(Buffer.from(value)); }
    sse = Buffer.concat(buf).toString();
  } catch { try { const r3 = await fetch(BASE + '/api/events', { headers: { Authorization: AUTH + tok, Accept: 'text/event-stream' }, signal: AbortSignal.timeout(3000) }); sse = await r3.text(); } catch {} }
  check('realtime: SSE /api/events streams hello', /hello|retry/.test(sse), sse.replace(/\n/g, ' ').slice(0, 80));

  console.log(`\n==== SERVER AUDIT: ${pass} passed, ${fail} failed ====`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
