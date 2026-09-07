'use strict';
const RUN = Date.now().toString(36); // per-run unique suffix for test emails
// End-to-end API test for the multi-role management expansion
const B = 'http://localhost:4310';
let pass = 0, fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (extra ? ' -> ' + JSON.stringify(extra) : '')); }
}
async function req(method, path, tok, body) {
  const r = await fetch(B + path, {
    method,
    headers: { ...(tok ? { Authorization: 'Bearer ' + tok } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, data };
}
const login = async (email) => (await req('POST', '/api/auth/login', null, { email, password: 'purepak123' })).data.token;

(async () => {
  const admin = await login('admin@purepak.pk');
  const manager = await login('manager@purepak.pk');
  const fin = await login('finance@purepak.pk');
  const agent = await login('bilal@purepak.pk');

  console.log('== signup (public = customer only) ==');
  const cust = await req('POST', '/api/auth/signup', null, { name: 'Test Hotel Sdn', email: 'testhotel.' + RUN + '@pk.net', phone: '0300-1110001', password: 'secret123', role: 'customer' });
  ok(cust.status === 201 && !cust.data.pending && !!cust.data.token && cust.data.user.role === 'customer', 'customer signup is immediate w/ token', cust.data && { role: cust.data.user.role });
  // even if a staff role is requested publicly, it becomes a customer account
  const asDel = await req('POST', '/api/auth/signup', null, { name: 'Public Driver', email: 'pubdriver.' + RUN + '@pk.net', phone: '0300-1110002', password: 'secret123', role: 'delivery' });
  ok(asDel.status === 201 && asDel.data.user.role === 'customer' && !asDel.data.pending, 'public delivery request forced to customer', asDel.data && asDel.data.user.role);
  const dup = await req('POST', '/api/auth/signup', null, { name: 'Public Driver', email: 'pubdriver.' + RUN + '@pk.net', password: 'secret123' });
  ok(dup.status === 409, 'duplicate email rejected');

  console.log('== pending login gate (staff via Team API) ==');
  const pendingLoginPrep = await req('POST', '/api/users', manager, { name: 'Gate Driver', email: 'gate.driver.' + RUN + '@purepak.pk', phone: '0300-3330001', password: 'temp1234', role: 'delivery' });
  ok(pendingLoginPrep.status === 201 && pendingLoginPrep.data.status === 'pending', 'staff created via Team is pending', pendingLoginPrep.data && pendingLoginPrep.data.status);
  const pendingLogin = await req('POST', '/api/auth/login', null, { email: 'gate.driver.' + RUN + '@purepak.pk', password: 'temp1234' });
  ok(pendingLogin.status === 200 && pendingLogin.data.pending === true, 'pending staff can log in, flagged pending', pendingLogin.data && pendingLogin.data.pending);

  console.log('== team API ==');
  const listF = await req('GET', '/api/users', fin);
  ok(listF.status === 403, 'finance cannot list users');
  const listM = await req('GET', '/api/users', manager);
  ok(listM.status === 200 && listM.data.length >= 8, 'manager can list users (' + listM.data.length + ')');
  const newDel = await req('POST', '/api/users', manager, { name: 'Hassan New', email: 'hassan.new.' + RUN + '@purepak.pk', phone: '0300-2220003', password: 'temp1234', role: 'delivery', salary: 22000 });
  ok(newDel.status === 201 && newDel.data.role === 'delivery', 'manager creates delivery employee', newDel.data);
  const mkAdmin = await req('POST', '/api/users', manager, { name: 'Fake Admin', email: 'fake.adm.' + RUN + '@purepak.pk', password: 'temp1234', role: 'admin' });
  ok(mkAdmin.status === 403, 'manager cannot create admin (G1)');
  const newCust = await req('POST', '/api/users', manager, { name: 'Kamran Cafe', email: 'kamran.' + RUN + '@pk.net', password: 'temp1234', role: 'customer' });
  ok(newCust.status === 201 && newCust.data.status === 'active', 'manager creates customer (immediate)', newCust.data);
  const newAg = await req('POST', '/api/users', manager, { name: 'Sara Agent', email: 'sara.' + RUN + '@purepak.pk', password: 'temp1234', role: 'agent', salary: 12000 });
  ok(newAg.status === 201 && newAg.data.agent_id > 0, 'manager creates agent (auto agent record)', newAg.data);

  // activate the pending driver
  const deliId = pendingLoginPrep.data.id;
  const act = await req('PATCH', '/api/users/' + deliId, admin, { status: 'active' });
  ok(act.status === 200 && act.data.status === 'active', 'admin activates pending driver');
  const deliLogin = await req('POST', '/api/auth/login', null, { email: 'gate.driver.' + RUN + '@purepak.pk', password: 'temp1234' });
  ok(deliLogin.status === 200 && deliLogin.data.pending === false, 'activated driver logs in normally');

  // guards
  const adminId = (await req('GET', '/api/auth/me', admin)).data.id;
  const selfDis = await req('PATCH', '/api/users/' + adminId, admin, { status: 'disabled' });
  ok(selfDis.status === 400, 'cannot disable self (G3)');
  const demoteAdmin = await req('PATCH', '/api/users/' + adminId, manager, { role: 'finance' });
  ok(demoteAdmin.status === 403, 'manager cannot demote admin (G1)');

  // role change + salary
  const finId = (await req('GET', '/api/auth/me', fin)).data.id;
  const bump = await req('PATCH', '/api/users/' + finId, admin, { salary: 45000 });
  ok(bump.status === 200 && bump.data.salary === 45000, 'admin changes salary');

  // password reset
  const rp = await req('POST', '/api/users/' + deliId + '/reset-password', admin);
  ok(rp.status === 200 && /^purepak\d{4}$/.test(rp.data.temporary_password), 'admin resets password', rp.data);
  const rpLogin = await req('POST', '/api/auth/login', null, { email: 'gate.driver.' + RUN + '@purepak.pk', password: rp.data.temporary_password });
  ok(rpLogin.status === 200, 'new temp password works');

  console.log('== agents commission ==');
  const agents = (await req('GET', '/api/agents', admin)).data;
  const bilal = agents.find(a => a.name.includes('Bilal'));
  const cp = await req('PATCH', '/api/agents/' + bilal.id, admin, { commission_pct: 7 });
  ok(cp.status === 200 && cp.data.commission_pct === 7, 'commission updated to 7%');
  const cpBad = await req('PATCH', '/api/agents/' + bilal.id, admin, { commission_pct: 80 });
  ok(cpBad.status === 400, 'commission > 50 rejected');
  const cpF = await req('PATCH', '/api/agents/' + bilal.id, fin, { commission_pct: 6 });
  ok(cpF.status === 200 && cpF.data.commission_pct === 6, 'finance can update commission');

  console.log('== pricing matrix ==');
  const pricing = (await req('GET', '/api/pricing', admin)).data;
  ok(Array.isArray(pricing) && pricing.length === 5 && pricing[0].prices, 'pricing matrix returned', pricing.length);
  const p500 = pricing.find(p => p.size_ml === 500);
  ok(p500.prices.wholesale === 8 && p500.price === 10, 'wholesale override present, base fallback present');
  const save = await req('POST', '/api/pricing', admin, [{ product_id: p500.id, customer_type: 'wholesale', price: 7 }]);
  ok(save.status === 200 && save.data.updated === 1, 'matrix override updated');

  console.log('== order pricing engine ==');
  const customers = (await req('GET', '/api/customers', admin)).data;
  const rascon = customers.find(c => c.name === 'Rascon'); // wholesale, 500ml @ 7 now
  const p1 = (await req('GET', '/api/products', admin)).data.find(p => p.size_ml === 500);
  const oWholesale = await req('POST', '/api/orders', admin, { customer_id: rascon.id, items: [{ product_id: p1.id, qty: 10 }] });
  ok(oWholesale.status === 201 && oWholesale.data.total === 70, 'wholesale order priced at 70 (7x10)', oWholesale.data && oWholesale.data.total);
  const retailCust = customers.find(c => c.name === 'Fun Loft');
  const oRetail = await req('POST', '/api/orders', admin, { customer_id: retailCust.id, items: [{ product_id: p1.id, qty: 10 }] });
  ok(oRetail.status === 201 && oRetail.data.total === 100, 'retail order priced at 100 (10x10)', oRetail.data && oRetail.data.total);
  const hotelCust = customers.find(c => c.name === 'Appinators');
  const p19 = (await req('GET', '/api/products', admin)).data.find(p => p.size_ml === 19000);
  const oHotel = await req('POST', '/api/orders', admin, { customer_id: hotelCust.id, items: [{ product_id: p19.id, qty: 3 }] });
  ok(oHotel.status === 201 && oHotel.data.total === 300, 'hotel 19L priced at 100x3', oHotel.data && oHotel.data.total);

  console.log('== customers type ==');
  const ct = await req('PATCH', '/api/customers/' + retailCust.id, admin, { type: 'restaurant' });
  ok(ct.status === 200 && ct.data.type === 'restaurant', 'customer type changed');

  console.log('== payroll ==');
  const period = new Date().toISOString().slice(0, 7);
  const gen = await req('POST', '/api/payroll/generate', fin, { period });
  // salaried staff: manager, finance, delivery + Hassan = 4 minimum; agents only when they have accrued commission
  ok(gen.status === 200 && gen.data.created >= 4, 'payroll generated for ' + gen.data.created, gen.data);
  const py = await req('GET', '/api/payroll?period=' + period, admin);
  ok(py.status === 200 && py.data.rows.length >= 4, 'payroll list returned (' + py.data.rows.length + ')');
  const agentsInPy = py.data.rows.filter(r => r.role === 'agent');
  for (const a of agentsInPy) ok(a.salary === 0, 'agent in payroll has no fixed salary', a);
  const one = py.data.rows.find(r => r.entry && r.entry.status === 'accrued' && r.role !== 'agent')
    || py.data.rows.find(r => r.entry && r.entry.status === 'accrued');
  const paid = await req('POST', '/api/payroll/' + one.entry.id + '/mark-paid', fin);
  ok(paid.status === 200 && paid.data.status === 'paid', 'payroll marked paid');
  const paid2 = await req('POST', '/api/payroll/' + one.entry.id + '/mark-paid', fin);
  ok(paid2.status === 409, 'double pay blocked');
  const ledger = (await req('GET', '/api/ledger', fin)).data;
  const payrollEntry = ledger.find(l => l.ref && l.ref.startsWith('payroll#'));
  ok(!!payrollEntry, 'payroll payout posted to ledger (' + (payrollEntry && payrollEntry.account) + ')', payrollEntry);
  if (one.role === 'agent') ok(payrollEntry.account === 'Commissions', 'agent payout posted to Commissions');
  else ok(payrollEntry.account === 'Salaries & Wages', 'salary payout posted to Salaries & Wages');

  console.log('== notifications ==');
  const notes = (await req('GET', '/api/notifications', manager)).data.notifications;
  ok(notes.some(n => n.kind === 'team'), 'manager got team notification');

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
