'use strict';
// Tiny API client with token management
const API = (() => {
  let token = localStorage.getItem('pp_token') || null;
  let user = null;

  function setAuth(t, u) { token = t; user = u; localStorage.setItem('pp_token', t); localStorage.setItem('pp_user', JSON.stringify(u)); }
  function logout() { token = null; user = null; localStorage.removeItem('pp_token'); localStorage.removeItem('pp_user'); }
  function restore() {
    try { user = JSON.parse(localStorage.getItem('pp_user') || 'null'); } catch { user = null; }
    return { token, user };
  }

  async function req(method, path, body) {
    const res = await fetch('/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data; try { data = await res.json(); } catch { data = null; }
    if (res.status === 401) { logout(); if (!location.hash.startsWith('#/login')) location.hash = '#/login'; }
    if (!res.ok) { const e = new Error((data && data.error) || ('HTTP ' + res.status)); e.status = res.status; throw e; }
    return data;
  }
  const g = p => req('GET', p);
  const post = (p, b) => req('POST', p, b);
  const patch = (p, b) => req('PATCH', p, b);

  const fmtMoney = (n, cur = 'Rs') => {
    const v = Number(n) || 0;
    return cur + ' ' + Math.round(v).toLocaleString('en-PK');
  };
  const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(String(s).replace(' ', 'T'));
    if (isNaN(d)) return s;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };
  const fmtDay = (s) => { if (!s) return '—'; const d = new Date(String(s).replace(' ', 'T')); return isNaN(d) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }); };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const statusLabel = (s) => ({ new: 'New', confirmed: 'Confirmed', in_delivery: 'In delivery', delivered: 'Delivered', cancelled: 'Cancelled', pending: 'Pending', out_for_delivery: 'Out for delivery', failed: 'Failed', accrued: 'Accrued', paid: 'Paid', unpaid: 'Unpaid', partial: 'Partial' }[s] || s);

  return {
    get token() { return token; }, get user() { return user; },
    setAuth, logout, restore,
    // auth
    login: (email, password) => post('/auth/login', { email, password }),
    signup: (b) => post('/auth/signup', b),
    me: () => g('/auth/me'),
    // team / users
    users: () => g('/users'),
    createUser: (b) => post('/users', b),
    updateUser: (id, b) => patch('/users/' + id, b),
    resetUserPassword: (id) => post('/users/' + id + '/reset-password', {}),
    // agents / customers / products / pricing
    updateAgent: (id, b) => patch('/agents/' + id, b),
    updateCustomer: (id, b) => patch('/customers/' + id, b),
    createCustomer: (b) => post('/customers', b),
    updateProduct: (id, b) => patch('/products/' + id, b),
    createProduct: (b) => post('/products', b),
    customerTypes: () => g('/customer-types'),
    pricing: () => g('/pricing'),
    savePricing: (rows) => post('/pricing', rows),
    // payroll
    payroll: (period) => g('/payroll' + (period ? '?period=' + period : '')),
    generatePayroll: (period) => post('/payroll/generate', { period }),
    markPayrollPaid: (id) => post('/payroll/' + id + '/mark-paid', {}),
    products: () => g('/products'),
    customers: () => g('/customers'),
    orders: (status) => g('/orders' + (status ? '?status=' + status : '')),
    order: (id) => g('/orders/' + id),
    createOrder: (b) => post('/orders', b),
    updateOrder: (id, b) => patch('/orders/' + id, b),
    deliveries: (status) => g('/deliveries' + (status ? '?status=' + status : '')),
    delivery: (id) => g('/deliveries/' + id),
    updateDelivery: (id, b) => patch('/deliveries/' + id, b),
    routePlan: (lat, lng) => {
      const q = new URLSearchParams();
      if (lat != null && lng != null) { q.set('lat', lat); q.set('lng', lng); }
      const s = q.toString();
      return g('/route-plan' + (s ? '?' + s : ''));
    },
    // receipts
    receipts: (q, status) => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (status) p.set('status', status);
      const qs = p.toString();
      return g('/receipts' + (qs ? '?' + qs : ''));
    },
    receiptImage: (id) => '/api/receipts/' + id,
    updateReceipt: (id, b) => patch('/receipts/' + id, b),
    approveReceipt: (id, b) => req('POST', '/receipts/' + id + '/approve', b),
    rejectReceipt: (id, reason) => req('POST', '/receipts/' + id + '/reject', { reason: reason || null }),
    notifications: () => g('/notifications'),
    markNotificationsRead: (id) => req('POST', '/notifications/read', id ? { id } : {}),
    postReceipt: (id) => req('POST', '/receipts/' + id + '/post', {}),
    uploadReceipt: (b) => req('POST', '/receipts', b),
    // settings
    settings: () => g('/settings'),
    saveSettings: (b) => post('/settings', b),
    agents: () => g('/agents'),
    createAgent: (b) => post('/agents', b),
    commissions: (params) => { const q = new URLSearchParams(params || {}).toString(); return g('/commissions' + (q ? '?' + q : '')); },
    settleCommission: (id) => patch('/commissions/' + id, {}),
    ledger: () => g('/ledger'),
    ledgerSummary: (month) => g('/ledger/summary' + (month ? '?month=' + month : '')),
    addLedger: (b) => post('/ledger', b),
    voidLedger: (id, reason) => post('/ledger/' + id + '/void', { reason }),
    correctLedger: (id, b) => post('/ledger/' + id + '/correct', b),
    auditLog: () => g('/audit'),
    auditVerify: () => g('/audit/verify'),
    kpis: () => g('/kpis'),
    monthly: () => g('/analytics/monthly'),
    topCustomers: () => g('/analytics/top-customers'),
    fmtMoney, fmtDate, fmtDay, esc, statusLabel,
  };
})();
