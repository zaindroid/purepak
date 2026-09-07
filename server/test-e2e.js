'use strict';
const BASE = 'http://localhost:4310';
async function api(method, p, { body, token } = {}) {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data; try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}
const PW = 'purepak123';
const logins = ['admin@purepak.pk','finance@purepak.pk','delivery@purepak.pk','bilal@purepak.pk','ali@rascon.pk'];
const T = {};
for (const e of logins) {
  const r = await api('POST','/api/auth/login',{ body: { email: e, password: PW } });
  if (r.status !== 200) { console.log('LOGIN FAIL', e, r.status, r.data); process.exit(1); }
  T[e] = r.data.token;
  console.log('login ok:', e, '->', r.data.user.role);
}
let fails = 0;
function check(name, cond, extra='') {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name);
}

// ADMIN
let r = await api('GET','/api/kpis',{ token: T['admin@purepak.pk'] });
check('admin kpis', r.status===200 && r.data.month_revenue>0, JSON.stringify(r.data));
r = await api('GET','/api/orders',{ token: T['admin@purepak.pk'] });
check('admin orders', r.status===200 && r.data.length>5, 'count='+(r.data?.length));
r = await api('GET','/api/orders/1',{ token: T['admin@purepak.pk'] });
check('admin order detail w/ items+deliveries', r.status===200 && r.data.items?.length>0 && r.data.deliveries?.length>0);
r = await api('GET','/api/products',{ token: T['admin@purepak.pk'] });
check('admin products', r.status===200 && r.data.length===5, JSON.stringify(r.data.map(p=>p.size_ml)));
r = await api('GET','/api/customers',{ token: T['admin@purepak.pk'] });
check('admin customers', r.status===200 && r.data.length>=5, 'count='+(r.data?.length));
r = await api('GET','/api/agents',{ token: T['admin@purepak.pk'] });
check('admin agents w/ stats', r.status===200 && r.data.length>=3 && r.data[0].orders_count>0, JSON.stringify(r.data?.map(a=>({n:a.name,sales:a.sales,oc:a.outstanding_commission}))));
r = await api('GET','/api/ledger',{ token: T['admin@purepak.pk'] });
check('admin ledger', r.status===200 && r.data.length>5, 'rows='+(r.data?.length));
r = await api('GET','/api/ledger/summary',{ token: T['admin@purepak.pk'] });
check('admin ledger summary', r.status===200 && r.data.month_income>0, JSON.stringify({mi:r.data.month_income,me:r.data.month_expense,an:r.data.all_time_net}));
r = await api('GET','/api/analytics/monthly',{ token: T['admin@purepak.pk'] });
check('admin analytics monthly', r.status===200 && r.data.length===6, JSON.stringify(r.data));
r = await api('GET','/api/analytics/top-customers',{ token: T['admin@purepak.pk'] });
check('admin top customers', r.status===200 && r.data.length<=5, JSON.stringify(r.data?.map(x=>x.name)));
r = await api('GET','/api/deliveries',{ token: T['admin@purepak.pk'] });
check('admin deliveries', r.status===200 && r.data.length>0, 'count='+(r.data?.length));

// create + progress an order as admin (Rascon is wholesale: 12L@65, 19L@95)
r = await api('POST','/api/orders',{ token: T['admin@purepak.pk'], body: { customer_id: 1, agent_id: 1, items: [{product_id:4,qty:2},{product_id:5,qty:1}], notes:'test e2e' } });
check('admin create order', r.status===201 && r.data.total===225, JSON.stringify(r.data));
const newOrderId = r.data?.id;
r = await api('PATCH',`/api/orders/${newOrderId}`,{ token: T['admin@purepak.pk'], body: { status:'confirmed' } });
check('admin confirm order', r.status===200 && r.data.status==='confirmed');
r = await api('PATCH',`/api/orders/${newOrderId}`,{ token: T['admin@purepak.pk'], body: { status:'in_delivery', driver:'Waqas' } });
check('admin dispatch order', r.status===200 && r.data.status==='in_delivery');

// DELIVERY
r = await api('GET','/api/deliveries?status=out_for_delivery',{ token: T['delivery@purepak.pk'] });
check('delivery OFD list', r.status===200 && r.data.every(d=>d.status==='out_for_delivery'), 'count='+(r.data?.length));
const del = r.data.find(d=>d.order_id===newOrderId);
check('dispatched delivery visible to driver', !!del);
r = await api('PATCH',`/api/deliveries/${del?.id}`,{ token: T['delivery@purepak.pk'], body: { status:'delivered' } });
check('driver marks delivered', r.status===200 && r.data.status==='delivered');
r = await api('GET',`/api/orders/${newOrderId}`,{ token: T['admin@purepak.pk'] });
check('order auto->delivered', r.status===200 && r.data.status==='delivered');

// AGENT (bilal)
r = await api('GET','/api/orders',{ token: T['bilal@purepak.pk'] });
check('agent sees own orders only', r.status===200 && r.data.length>0 && r.data.every(o=>o.agent_name==='Bilal Ahmed'), 'count='+(r.data?.length));
r = await api('GET','/api/kpis',{ token: T['bilal@purepak.pk'] });
check('agent kpis', r.status===200 && r.data.my_sales>0, JSON.stringify(r.data));
r = await api('GET','/api/commissions',{ token: T['bilal@purepak.pk'] });
check('agent commissions', r.status===200 && r.data.length>0, 'rows='+(r.data?.length));
r = await api('POST','/api/agents',{ token: T['bilal@purepak.pk'], body:{name:'x'} });
check('agent blocked from creating agents', r.status===403);
r = await api('POST','/api/orders',{ token: T['bilal@purepak.pk'], body: { customer_id: 2, items:[{product_id:2,qty:3}] } });
check('agent places order (own agent)', r.status===201 && r.data.agent_name==='Bilal Ahmed' && r.data.total===60, JSON.stringify(r.data));

// CUSTOMER (ali = customer 1)
r = await api('GET','/api/orders',{ token: T['ali@rascon.pk'] });
check('customer sees own orders only', r.status===200 && r.data.length>0 && r.data.every(o=>o.customer_name==='Rascon'), 'count='+(r.data?.length));
r = await api('GET','/api/kpis',{ token: T['ali@rascon.pk'] });
check('customer kpis', r.status===200 && r.data.lifetime_spend>0, JSON.stringify(r.data));
r = await api('GET','/api/orders?status=delivered',{ token: T['ali@rascon.pk'] });
check('customer status filter', r.status===200 && r.data.every(o=>o.status==='delivered'));
r = await api('POST','/api/orders',{ token: T['ali@rascon.pk'], body: { items:[{product_id:3,qty:5}] } });
check('customer places order', r.status===201 && r.data.total===190, JSON.stringify({id:r.data?.id,total:r.data?.total,status:r.data?.status}));
r = await api('PATCH','/api/orders/1',{ token: T['ali@rascon.pk'], body:{status:'cancelled'} });
check('customer cannot cancel', r.status===403);

// FINANCE
r = await api('GET','/api/ledger/summary?month=' + new Date().toISOString().slice(0,7),{ token: T['finance@purepak.pk'] });
check('finance summary', r.status===200 && r.data.month_income>0);
r = await api('GET','/api/orders?status=new',{ token: T['finance@purepak.pk'] });
const unpaid = r.data.find(o=>o.payment_status!=='paid');
if (unpaid) {
  r = await api('PATCH',`/api/orders/${unpaid.id}`,{ token: T['finance@purepak.pk'], body:{ paid: unpaid.total, memo:'cash on delivery' } });
  check('finance records payment', r.status===200 && r.data.payment_status==='paid' && r.data.paid===unpaid.total, JSON.stringify({id:unpaid.id,paid:r.data?.paid}));
} else check('finance records payment', false, 'no unpaid order found');
r = await api('GET','/api/commissions?status=accrued',{ token: T['finance@purepak.pk'] });
const acc = r.data[0];
if (acc) {
  r = await api('PATCH',`/api/commissions/${acc.id}`,{ token: T['finance@purepak.pk'], body:{} });
  check('finance settles commission', r.status===200 && r.data.status==='paid', JSON.stringify({id:acc.id,amt:acc.amount}));
} else check('finance settles commission', false, 'no accrued');
r = await api('POST','/api/ledger',{ token: T['finance@purepak.pk'], body:{ account:'Vehicle fuel', type:'expense', amount:300, memo:'diesel' } });
check('finance add expense', r.status===201 && r.data.type==='expense');
r = await api('POST','/api/ledger',{ token: T['delivery@purepak.pk'], body:{account:'x',amount:1} });
check('delivery blocked from ledger', r.status===403);
r = await api('GET','/api/ledger',{ token: T['ali@rascon.pk'] });
check('customer blocked from ledger', r.status===403);
r = await api('GET','/api/orders',{ token: null });
check('unauthenticated blocked', r.status===401);
r = await api('PATCH',`/api/orders/${newOrderId}`,{ token: T['admin@purepak.pk'], body:{ status:'confirmed' } });
check('delivered->confirmed rejected', r.status===400, JSON.stringify(r.data));

console.log('----');
console.log(fails===0 ? 'ALL PASS' : fails + ' FAILURES');
process.exit(fails?1:0);
