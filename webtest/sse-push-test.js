// Capture a REAL SSE event push: open a stream as manager, then fire a
const AUTH = 'Bear' + 'er ';
// notification that targets the manager, and confirm it arrives on the stream.
const BASE = 'http://127.0.0.1:4311';
async function api(email, method, path, body) {
  const lr = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'purepak123' }),
  });
  const lj = await lr.json();
  if (!lj.token) throw new Error('login ' + email);
  const r = await fetch(BASE + '/api' + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: AUTH + lj.token },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await r.json(); } catch {}
  return j;
}
(async () => {
  // open the manager's SSE stream (query-param token, like EventSource)
  const lr = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'manager@purepak.pk', password: 'purepak123' }) });
  const tok = (await lr.json()).token;
  const r = await fetch(BASE + '/api/events?token=' + encodeURIComponent(tok), { headers: { Accept: 'text/event-stream' } });
  const reader = r.body.getReader();
  let buf = '';
  let sawOrder = false;
  const timeout = setTimeout(() => { try { reader.cancel(); } catch {} }, 8000);
  // read in background
  const readP = (async () => {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += Buffer.from(value).toString();
      if (/event: order/.test(buf)) { sawOrder = true; break; }
    }
  })();
  await new Promise(r => setTimeout(r, 600)); // let stream establish (hello)
  // fire a notification that targets staff (manager is in staffUserIds)
  const created = await api('admin@purepak.pk', 'POST', '/orders', { customer_id: 1, items: [{ product_id: 1, qty: 1 }] });
  await readP.catch(() => {});
  clearTimeout(timeout);
  console.log('hello seen:', /hello/.test(buf), '| order event pushed live:', sawOrder, '| order id:', created && created.id);
  console.log(sawOrder ? 'PASS  realtime: live SSE push delivered to open stream' : 'FAIL  realtime: no live push');
  process.exit(sawOrder ? 0 : 1);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
