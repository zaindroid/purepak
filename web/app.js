'use strict';
// ---- app shell: routing, auth, actions ----

// Post-render hooks: kick off live views (map) after their HTML is in the DOM
window.onViewRender = function (route, view) {
  if (route === 'route' && typeof initSmartRoute === 'function') initSmartRoute();
  if (route === 'home' && typeof initCustomerHome === 'function') initCustomerHome();
  else document.body.classList.remove('has-cartbar'); // storefront-only page padding
};
// toast alias used by views
window.ppToast = function (msg, cls) { if (window.App) App.toast(msg, cls); };

// Count-up on KPI values after a view renders (skips on reduced-motion)
function animateKPIs(root) {
  if (typeof requestAnimationFrame === 'undefined') return; // no rAF (e.g. jsdom)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const DUR = 750, T0 = performance.now();
  const els = Array.from(root.querySelectorAll('.kpi .k-val'));
  // capture final text + target number for each, then reset to zero
  els.forEach(el => {
    const txt = el.textContent.trim();
    const m = txt.match(/^([^\d\-]*)([\-]?[\d][\d,\.]*)(.*)$/);
    if (!m) { el.dataset.final = ''; return; }
    el.dataset.final = txt;
    const numStr = m[2];
    const target = parseFloat(numStr.replace(/,/g, ''));
    if (!isFinite(target) || target === 0) { el.dataset.final = ''; return; }
    el.textContent = m[1] + '0' + m[3];
  });
  if (!els.some(el => el.dataset.final)) return;
  function tick(now) {
    const t = Math.min(1, (now - T0) / DUR);
    const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
    els.forEach(el => {
      const txt = el.dataset.final;
      if (!txt) return;
      const m = txt.match(/^([^\d\-]*)([\-]?[\d][\d,\.]*)(.*)$/);
      const target = parseFloat(m[2].replace(/,/g, ''));
      const rounded = Math.round(target * e);
      el.textContent = m[1] + rounded.toLocaleString('en-US') + m[3];
    });
    if (t < 1) requestAnimationFrame(tick);
    else els.forEach(el => { if (el.dataset.final) el.textContent = el.dataset.final; });
  }
  requestAnimationFrame(tick);
}

const App = {
  route: 'dashboard',
  ctx: {},

  init() {
    document.getElementById('loginForm').addEventListener('submit', (e) => this.doLogin(e));
    document.getElementById('sideLogout').addEventListener('click', () => this.logout());
    document.getElementById('topLogout').addEventListener('click', () => this.logout());
    const bell = document.getElementById('topBell');
    if (bell) bell.addEventListener('click', (e) => { e.stopPropagation(); this.bellToggle(); });
    const menu = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const scrim = document.getElementById('scrim');
    // keep the drawer + its scrim in lockstep (scrim must be visible whenever
    // the drawer is, or a tap on the page can't close it)
    const setMenu = (open) => {
      sidebar.classList.toggle('open', open);
      scrim.classList.toggle('hidden', !open);
    };
    menu.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
    scrim.addEventListener('click', () => setMenu(false));

    // global action delegation
    document.getElementById('view').addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (el) this.act(el.dataset, e);
      setMenu(false); // any tap on the content area also closes the drawer
    });
    // modals live in #modalRoot (outside #view) — their action buttons need the
    // same delegation or e.g. the order "Confirm / Dispatch" buttons do nothing
    document.getElementById('modalRoot').addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (el) this.act(el.dataset, e);
    });
    document.getElementById('view').addEventListener('change', (e) => {
      if (e.target.id === 'payPeriod' && typeof setPayPeriod === 'function') {
        setPayPeriod(e.target.value);
        this.refresh();
      }
    });

    // close the notification popover on outside click
    document.addEventListener('click', (e) => {
      const pop = document.getElementById('bellPop');
      if (pop && !pop.contains(e.target) && !e.target.closest('#topBell')) pop.remove();
    });

    const restored = API.restore();
    if (restored.token && restored.user) {
      if (restored.user.status === 'pending') this.showPending(restored.user);
      else this.enter(restored.user);
    }
    else this.showLogin();

    // signup
    const signupBtn = document.getElementById('openSignup');
    if (signupBtn) signupBtn.addEventListener('click', () => this.openSignup());

    window.addEventListener('hashchange', () => this.render());
  },

  hideSplash() {
    const s = document.getElementById('splash');
    if (!s || s.classList.contains('hidden')) return;
    s.classList.add('bye');
    setTimeout(() => s.classList.add('hidden'), 420);
  },
  showLogin() {
    this.hideSplash();
    document.getElementById('login').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  },

  async doLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errEl = document.getElementById('loginErr');
    errEl.textContent = '';
    try {
      const r = await API.login(email, pass);
      API.setAuth(r.token, r.user);
      if (r.pending) this.showPending(r.user);
      else this.enter(r.user);
    } catch (err) {
      errEl.textContent = err.message || 'Login failed';
    }
  },

  showPending(user) {
    const el = document.getElementById('pendingScreen');
    this.hideSplash();
    document.getElementById('login').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
    if (el) el.classList.remove('hidden');
    document.getElementById('pendingName').textContent = user.name;
    document.getElementById('pendingRole').textContent = user.role.toUpperCase();
    document.getElementById('pendingSignout').onclick = () => {
      API.logout();
      location.hash = '';
      el.classList.add('hidden');
      this.showLogin();
    };
  },

  openSignup() {
    const body = `
      <div class="su-hero">
        <div class="su-hero-ic">${IC.drop}</div>
        <h2>Create your account</h2>
      </div>
      <div class="modal-bd" style="padding-top:4px">
        <label class="muted">Full name</label>
        <input id="suName" class="input" style="width:100%;margin-bottom:10px" placeholder="e.g. Ahmed Raza" autocomplete="name">
        <label class="muted">Email</label>
        <input id="suEmail" class="input" style="width:100%;margin-bottom:10px" type="email" placeholder="you@example.com" autocomplete="email">
        <label class="muted">Phone</label>
        <input id="suPhone" class="input" style="width:100%;margin-bottom:10px" placeholder="03xx-xxxxxxx" autocomplete="tel">
        <label class="muted">Password</label>
        <input id="suPass" class="input" style="width:100%" type="password" placeholder="6+ characters" autocomplete="new-password">
      </div>`;
    openModal('', body, `
      <button class="btn ghost" data-close-modal>Cancel</button>
      <button class="btn primary" id="suSubmit" style="flex:1">Create my account</button>
    `);
    document.getElementById('suSubmit').addEventListener('click', () => this.doSignup());
  },

  async doSignup() {
    const name = document.getElementById('suName').value.trim();
    const email = document.getElementById('suEmail').value.trim();
    const phone = document.getElementById('suPhone').value.trim();
    const password = document.getElementById('suPass').value;
    const btn = document.getElementById('suSubmit');
    if (name.length < 2) { toast('Enter your full name', 'warn'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Enter a valid email', 'warn'); return; }
    if (password.length < 6) { toast('Password must be 6+ characters', 'warn'); return; }
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const r = await API.signup({ name, email, phone, password });
      closeModal();
      API.setAuth(r.token, r.user);
      if (r.first_setup) toast('Owner account created — PurePak is ready. Invite your team from the Team screen.', 'ok');
      else toast('Welcome to PurePak, ' + r.user.name.split(' ')[0] + '!', 'ok');
      this.enter(r.user);
    } catch (err) {
      toast(err.message || 'Signup failed', 'err');
      btn.disabled = false; btn.textContent = 'Create my account';
    }
  },

  enter(user) {
    this.hideSplash();
    document.getElementById('login').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('sideName').textContent = user.name;
    document.getElementById('sideRole').textContent = user.role;
    document.getElementById('sideAvatar').textContent = (user.name[0] || '?').toUpperCase();
    // build nav
    const nav = navFor(user.role);
    document.getElementById('nav').innerHTML = nav.map(n =>
      `<a href="#/${n.to}" data-nav="${n.to}"><span class="ni">${n.icon}</span>${n.label}</a>`).join('');
    document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    }));
    this.route = user.role === 'customer' ? 'home' : 'dashboard';
    const def = nav[0].to;
    if (!location.hash || location.hash === '#/') location.hash = '#/' + def;
    this.render();
    this.bellStart();
  },

  logout() {
    API.logout();
    location.hash = '';
    this.showLogin();
    this.bellStop();
    document.getElementById('bellBadge')?.classList.add('hidden');
  },

  // ---- notification bell + realtime ----
  bellStart() {
    this.bellStop();
    this._startSSE();
    // Poll the bell as a safety net for when the SSE stream is blocked
    // (Cloudflare / corporate proxies drop EventSource). This only touches the
    // notification badge — it never rebuilds the page.
    this.bellTimer = setInterval(() => this.bellUpdate(true).catch(() => {}), 30000);
    if (!this._bellFocusBound) {
      this._bellFocusBound = () => {
        if (document.visibilityState === 'visible') this.bellUpdate(true).catch(() => {});
      };
      window.addEventListener('focus', this._bellFocusBound);
      document.addEventListener('visibilitychange', this._bellFocusBound);
    }
    this.bellUpdate().catch(() => {});
  },
  bellStop() {
    if (this.bellTimer) { clearInterval(this.bellTimer); this.bellTimer = null; }
    this._stopSSE();
  },
  // One SSE stream per session. A realtime event updates the notification bell;
  // it does NOT re-render the current view — the only visible live change is the
  // storefront repricing itself in place on a 'pricing' event.
  _startSSE() {
    this._stopSSE();
    let es;
    // EventSource cannot set the Authorization header, so the token goes in the
    // query string for this endpoint only (the server reads ?token= there).
    const u = new URL('/api/events', location.origin);
    if (API.token) u.searchParams.set('token', API.token);
    try { es = new EventSource(u.toString()); } catch { return; }
    this._es = es;
    const onEvent = (name) => {
      this.bellUpdate(true).catch(() => {});
      if (name === 'pricing' && typeof window.refreshStorefrontPrices === 'function') {
        window.refreshStorefrontPrices().catch(() => {});
      }
    };
    ['order', 'pricing', 'team', 'receipt', 'payroll', 'customer'].forEach(ev =>
      es.addEventListener(ev, () => onEvent(ev)));
    es.addEventListener('message', () => onEvent('message'));
    es.addEventListener('error', () => { /* EventSource auto-reconnects; no-op */ });
  },
  _stopSSE() {
    if (this._es) { try { this._es.close(); } catch {} this._es = null; }
  },
  async bellUpdate(silent) {
    const u = API.user;
    if (!u) return;
    let data;
    try { data = await API.notifications(); } catch { return; }
    const badge = document.getElementById('bellBadge');
    if (!badge) return;
    const n = data.unread || 0;
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.classList.toggle('hidden', n === 0);
    this._bellItems = data.notifications || [];
    const open = document.getElementById('bellPop') && !document.getElementById('bellPop').classList.contains('hidden');
    if (open || !silent) this.bellRender();
  },
  bellRender() {
    const items = this._bellItems || [];
    const wrap = document.getElementById('bellList');
    if (!wrap) return;
    wrap.innerHTML = items.length ? items.map(nt => `
      <div class="bell-item ${nt.read ? '' : 'unread'}" data-nid="${nt.id}">
        <div class="bell-t">${API.esc(nt.title)}</div>
        ${nt.body ? `<div class="bell-b">${API.esc(nt.body)}</div>` : ''}
        <div class="bell-d">${API.fmtDay ? API.fmtDay(nt.created_at) : API.esc(nt.created_at || '')}</div>
      </div>`).join('')
      : '<div class="bell-empty">No notifications yet</div>';
    wrap.querySelectorAll('.bell-item').forEach(el => el.addEventListener('click', () => this.bellOpen(+el.dataset.nid)));
  },
  bellToggle() {
    let pop = document.getElementById('bellPop');
    if (pop) {
      if (!pop.classList.contains('hidden')) { pop.remove(); return; }
      this.bellRender();
      return;
    }
    pop = document.createElement('div');
    pop.id = 'bellPop';
    pop.className = 'bell-pop';
    pop.innerHTML = `<div class="bell-pop-hd">Notifications<button class="btn ghost sm" id="bellAllRead" type="button">Mark all read</button></div><div class="bell-list" id="bellList"></div>`;
    (document.querySelector('.topbar') || document.getElementById('app')).appendChild(pop);
    this.bellRender();
    pop.addEventListener('click', e => e.stopPropagation());
    document.getElementById('bellAllRead').addEventListener('click', async (e) => {
      e.stopPropagation();
      try { await API.markNotificationsRead(); this.bellUpdate(true); } catch {}
    });
  },
  async bellOpen(id) {
    try { await API.markNotificationsRead(id); } catch {}
    const it = (this._bellItems || []).find(x => x.id === id);
    document.getElementById('bellPop')?.remove();
    const ref = (it && it.ref) || '';
    const valid = navFor(API.user.role).map(n => n.to);
    let m;
    if ((m = /^receipt#(\d+)$/.exec(ref))) {
      location.hash = '#/receipts';
      setTimeout(() => { try { modalReviewReceiptSafe(+m[1]); } catch {} }, 500);
    } else if ((m = /^order#(\d+)$/.exec(ref))) {
      const to = valid.includes('orders') ? 'orders' : (valid.includes('deliveries') ? 'deliveries' : (valid.includes('route') ? 'route' : valid[0]));
      location.hash = '#/' + to;
      if (to === 'orders') setTimeout(() => { try { modalOrderDetail(+m[1]); } catch {} }, 500);
    } else if (/^user#\d+$/.test(ref)) {
      location.hash = valid.includes('team') ? '#/team' : '#/' + valid[0];
    } else if (/^(product|pricing)#/.test(ref)) {
      location.hash = valid.includes('products') ? '#/products' : '#/' + valid[0];
    } else if (/^payroll/.test(ref)) {
      location.hash = valid.includes('payroll') ? '#/payroll' : '#/' + valid[0];
    }
    this.bellUpdate(true).catch(() => {});
  },

  hashRoute() {
    return (location.hash || '').replace(/^#\//, '') || '';
  },

  async render() {
    const u = API.user;
    if (!u) return this.showLogin();
    const parts = this.hashRoute().split('/');
    let route = parts[0] || 'dashboard';
    const valid = navFor(u.role).map(n => n.to);
    if (!valid.includes(route)) route = valid[0];
    this.route = route;
    this.ctx = { status: parts[1] || '' };

    document.querySelectorAll('#nav a').forEach(a =>
      a.classList.toggle('active', a.dataset.nav === route));

    const view = document.getElementById('view');
    if (typeof clearViewFx === 'function') clearViewFx(); // teardown previous map/watchers
    // crossfade: fade the container out, swap content, fade back in (no stacked views in the DOM)
    view.classList.remove('view-enter');
    view.classList.add('view-leave');
    let swapped = false, queued = null;
    const applySwap = () => {
      swapped = true;
      view.innerHTML = queued ? queued.html : `<div class="empty" style="padding:60px 16px"><div class="spinner"></div>Loading&hellip;</div>`;
      void view.offsetWidth; // reflow so the transition re-arms
      view.classList.remove('view-leave');
      view.classList.add('view-enter');
      if (queued) {
        if (!queued.isError) {
          animateKPIs(view);
          if (typeof window.onViewRender === 'function') window.onViewRender(route, view);
        }
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    setTimeout(applySwap, 140);
    let settled = false;
    const paint = (html, isError = false) => {
      if (settled) return;
      settled = true;
      queued = { html, isError };
      if (swapped) applySwap(); // fast render finished before the fade-out window
    };
    try {
      const renderer = (VIEW[u.role] && VIEW[u.role][route]) || VIEW[u.role][route] || VIEW.admin[route];
      if (!renderer) throw new Error('No view for ' + route);
      const html = await renderer(this.ctx);
      paint(html);
    } catch (e) {
      paint(`<div class="empty" style="padding:60px 16px"><div class="em-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>${API.esc(e.message)}</div>`, true);
      console.error(e);
    }
  },

  refresh() { this.render(); },

  toast(msg, cls = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast ' + cls;
    t.textContent = msg;
    document.getElementById('toastRoot').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  },

  async act(ds, ev) {
    const { act, id, status, to, product, name, due } = ds;
    const role = API.user.role;
    const stop = () => ev && ev.stopPropagation();
    switch (act) {
      case 'nav': stop(); location.hash = '#/' + to; break;
      case 'new-order': stop();
        if (role === 'customer') modalCreateOrder({ customer: { id: API.user.customer_id, name: API.user.name } });
        else modalCreateOrder({});
        break;
      case 'quick-order': stop(); {
        // prefill quick order with 1 of this product
        await this.prefillQuickOrder(product, name);
      } break;
      case 'view-order': stop(); modalOrderDetail(+id); break;
      case 'filter-orders': stop(); this.route = 'orders'; this.ctx = { status };
        if (status === 'all') location.hash = '#/orders'; else location.hash = '#/orders/' + status; break;
      case 'filter-deliveries': stop(); if (status === 'all') location.hash = '#/deliveries'; else location.hash = '#/deliveries/' + status; break;
      case 'dispatch': stop(); {
        // status carries the exact next state ("confirmed" then "in_delivery")
        const next = status || 'in_delivery';
        try {
          await API.updateOrder(+id, { status: next });
          this.toast(next === 'confirmed' ? 'Order confirmed' : next === 'in_delivery' ? 'Order dispatched' : 'Order updated');
          closeModal(); this.refresh();
        } catch (e) { this.toast(e.message, 'bad'); }
      } break;
      case 'cancel-order': stop();
        if (await confirmDialog({ title: 'Cancel order', message: 'This order will be marked cancelled. The customer will see the change.', okLabel: 'Cancel order', danger: true })) {
          try { await API.updateOrder(+id, { status: 'cancelled' }); this.toast('Order cancelled'); closeModal(); this.refresh(); }
          catch (e) { this.toast(e.message, 'bad'); }
        }
        break;
      case 'pay-order': stop(); modalPayOrder(+id, +due); break;
      case 'del-ofd': stop();
        try { await API.updateDelivery(+id, { status: 'out_for_delivery' }); this.toast('Trip started'); this.refresh(); }
        catch (e) { this.toast(e.message, 'bad'); }
        break;
      case 'del-done': stop();
        if (await confirmDialog({ title: 'Mark delivered', message: 'This delivery will be marked as completed.', okLabel: 'Mark delivered' })) {
          try { await API.updateDelivery(+id, { status: 'delivered' }); this.toast('Delivered — nice work'); this.refresh(); }
          catch (e) { this.toast(e.message, 'bad'); }
        }
        break;
      case 'del-retry': stop();
        try { await API.updateDelivery(+id, { status: 'pending' }); this.toast('Back in queue'); this.refresh(); }
        catch (e) { this.toast(e.message, 'bad'); }
        break;
      case 'settle-commission': stop();
        if (await confirmDialog({ title: 'Settle commission', message: 'An expense entry is posted to the ledger under Commissions.', okLabel: 'Settle' })) {
          try { await API.settleCommission(+id); this.toast('Commission settled'); this.refresh(); }
          catch (e) { this.toast(e.message, 'bad'); }
        }
        break;
      case 'new-agent': stop(); modalAddAgent(); break;
      case 'add-product': stop(); modalAddProduct(); break;
      case 'edit-product': stop(); modalEditProduct(+id); break;
      case 'toggle-product': stop(); {
        const el = e.target.closest('[data-act="toggle-product"]');
        const pid = +el.dataset.id;
        const nowActive = el.dataset.active !== '1';
        try {
          await API.updateProduct(pid, { active: nowActive });
          toast(nowActive ? 'Product enabled' : 'Product paused — hidden from ordering', 'ok');
          App.refresh();
        } catch (err) { toast(err.message, 'err'); }
        break;
      }
      case 'add-customer': stop(); modalAddCustomer(); break;
      case 'edit-customer': stop(); modalEditCustomer(+id); break;
      case 'add-employee': stop(); modalAddEmployee(); break;
      case 'team-activate': stop();
        try { await API.updateUser(+id, { status: 'active' }); this.toast('Account activated'); this.refresh(); }
        catch (e) { this.toast(e.message, 'err'); }
        break;
      case 'team-disable': stop();
        if (await confirmDialog({ title: 'Disable account', message: 'The person will not be able to sign in. You can re-activate them later.', okLabel: 'Disable', danger: true })) {
          try { await API.updateUser(+id, { status: 'disabled' }); this.toast('Account disabled'); this.refresh(); }
          catch (e) { this.toast(e.message, 'err'); }
        }
        break;
      case 'team-edit': stop(); modalEditEmployee(+id); break;
      case 'team-resetpw': stop();
        if (await confirmDialog({ title: 'Reset password', message: 'Generate a new temporary password? Share it securely — the person should change it at first login.', okLabel: 'Generate', danger: true })) {
          try {
            const r = await API.resetUserPassword(+id);
            showTempPassword(r.temporary_password);
            this.toast('Password reset', 'ok');
          } catch (e) { this.toast(e.message, 'err'); }
        }
        break;
      case 'payroll-generate': stop();
        try {
          const period = (document.getElementById('payPeriod') || {}).value || new Date().toISOString().slice(0, 7);
          const r = await API.generatePayroll(period);
          this.toast(r.created ? 'Generated ' + r.created + ' payroll entries' : 'No new entries needed');
          this.refresh();
        } catch (e) { this.toast(e.message, 'err'); }
        break;
      case 'payroll-pay': stop();
        if (await confirmDialog({ title: 'Mark salary paid', message: 'An expense is posted to the ledger.', okLabel: 'Pay now' })) {
          try { await API.markPayrollPaid(+id); this.toast('Salary marked paid — posted to ledger'); this.refresh(); }
          catch (e) { this.toast(e.message, 'err'); }
        }
        break;
      case 'payroll-pay-one': stop();
        try {
          const period = (document.getElementById('payPeriod') || {}).value || new Date().toISOString().slice(0, 7);
          const pre = await API.payroll(period);
          const preRow = pre.rows.find(x => x.user_id === +ds.uid);
          const isAgent = preRow && preRow.role === 'agent';
          const msg = isAgent
            ? 'Pay this accrued commission now? It is posted to the Commissions ledger account and settled in Commissions.'
            : 'Create and pay this salary now? An expense is posted to the ledger.';
          if (!await confirmDialog({ title: isAgent ? 'Pay accrued commission' : 'Pay salary now', message: msg, okLabel: 'Pay now' })) break;
          await API.generatePayroll(period);
          const data = await API.payroll(period);
          const row = data.rows.find(x => x.user_id === +ds.uid);
          if (row && row.entry) {
            await API.markPayrollPaid(row.entry.id);
            this.toast(isAgent ? 'Commission paid — posted to Commissions' : 'Salary paid — posted to ledger');
          } else {
            this.toast('Nothing due yet for this month', 'warn');
          }
          this.refresh();
        } catch (e) { this.toast(e.message, 'err'); }
        break;
      case 'agent-save': stop(); {
        const pctInput = document.getElementById(ds['pct-input']);
        const b = { active: ds['target-active'] === '1' };
        if (pctInput) {
          const v = Number(pctInput.value);
          if (isNaN(v) || v < 0 || v > 50) { this.toast('Commission must be 0-50', 'err'); return; }
          b.commission_pct = v;
        }
        try {
          await API.updateAgent(+id, b);
          this.toast('Agent updated'); this.refresh();
        } catch (e) { this.toast(e.message, 'err'); }
      }
        break;
      case 'save-matrix': stop(); {
        const rows = [];
        document.querySelectorAll('input[data-pp]').forEach(inp => {
          const v = inp.value.trim();
          rows.push({ product_id: +inp.dataset.pp, customer_type: inp.dataset.pt, price: v === '' ? null : Number(v) });
        });
        try {
          const r = await API.savePricing(rows);
          this.toast(r.updated ? 'Price list updated (' + r.updated + ' cells)' : 'No changes', 'ok');
          this.refresh();
        } catch (e) { this.toast(e.message, 'err'); }
      }
        break;
      case 'add-expense': stop(); modalAddLedger('expense'); break;
      case 'add-income': stop(); modalAddLedger('income'); break;
      case 'ledger-void': stop(); modalVoidLedger(+id); break;
      case 'ledger-correct': stop(); modalCorrectLedger(+id); break;
      case 'save-pay-accounts': stop(); {
        const accounts = {};
        document.querySelectorAll('[data-pay-name]').forEach(el => {
          const m = el.dataset.payName;
          accounts[m] = { name: el.value.trim(), detail: (document.querySelector(`[data-pay-detail="${m}"]`) || {}).value?.trim() || '' };
        });
        try { await API.savePaymentAccounts(accounts); this.toast('Payment accounts saved', 'ok'); this.refresh(); }
        catch (e) { this.toast(e.message, 'bad'); }
      } break;
      case 'save-my-profile': stop(); {
        const phone = document.getElementById('cpPhone').value.trim();
        const address = document.getElementById('cpAddress').value.trim();
        if (phone.length < 7) { this.toast('Enter a valid phone number', 'warn'); break; }
        try {
          await API.updateCustomer(API.user.customer_id, { phone, address });
          const me = await API.me(); API.setAuth(API.token, me);
          this.toast('Profile saved', 'ok'); this.refresh();
        } catch (e) { this.toast(e.message, 'bad'); }
      } break;
      case 'receipt-scan': stop(); modalScanReceipt(); break;
      case 'receipt-review': stop(); modalReviewReceipt(+id); break;
      case 'receipt-reject': stop();
        if (await confirmDialog({ title: 'Reject receipt', message: 'This receipt and its image will be deleted. The person who scanned it will be notified.', okLabel: 'Reject', danger: true })) {
          try { await API.rejectReceipt(+id); this.toast('Receipt rejected'); this.refresh(); }
          catch (e) { this.toast(e.message, 'bad'); }
        }
        break;
      case 'receipt-post': stop();
        if (await confirmDialog({ title: 'Post to ledger', message: 'A book-keeping entry is added. This cannot be undone from the app.', okLabel: 'Post entry' })) {
          try { await API.postReceipt(+id); this.toast('Posted to ledger'); this.refresh(); }
          catch (e) { this.toast(e.message, 'bad'); }
        }
        break;
      case 'use-location': stop(); rerouteFromMyLocation(); break;
      case 'reroute': stop();
        if (window.Notification && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
        rerouteFromMyLocation();
        break;
    }
  },

  async prefillQuickOrder(productId, productName) {
    // open the create-order modal with this product prefilled
    const products = await API.products();
    const p = products.find(x => x.id === +productId);
    // hack: prefill by setting initial qty via the modal — simplest: call modalCreateOrder then bump the field
    await modalCreateOrder({ customer: { id: API.user.customer_id, name: API.user.name } });
    const inp = document.querySelector(`[data-itemqty="${p.id}"]`);
    if (inp) { inp.value = 1; inp.dispatchEvent(new Event('input')); }
  },
};

window.App = App; // used by ppToast() and available for debugging
App.init();
