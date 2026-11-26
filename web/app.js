'use strict';
// ---- app shell: routing, auth, actions ----

// Public client ID — safe to embed; Google's own security model relies on
// the registered origin (purepak.zaindroid.me), not on this being secret.
const GOOGLE_CLIENT_ID = '674062502521-hc2pc7oan27ru1hkleslofoc6lr5uqbq.apps.googleusercontent.com';

// Post-render hooks: kick off live views (map) after their HTML is in the DOM
window.onViewRender = function (route, view) {
  if (route === 'route' && typeof initSmartRoute === 'function') initSmartRoute();
  if (route === 'home' && typeof initCustomerHome === 'function') initCustomerHome();
  else document.body.classList.remove('has-cartbar'); // storefront-only page padding
  if (route === 'backups' && typeof initBackupsView === 'function') initBackupsView();
  if (route === 'profile' && typeof initCustomerProfile === 'function') initCustomerProfile();
};
// toast alias used by views
window.ppToast = function (msg, cls) { if (window.App) App.toast(msg, cls); };

// ---- push notification token bridge (called from the native Android/iOS
// shell — see MainActivity's evaluateJavascript calls). If the page hasn't
// logged in yet when the native side hands us a token, stash it and send it
// once App.enter() runs; a plain browser tab never calls this at all.
// platform defaults to 'android' so the already-shipped Android app's
// single-argument evaluateJavascript("window.onPushToken('...')") calls
// keep working unchanged — the iOS wrapper is the one that passes 'ios'.
let pendingPushToken = null, pendingPushPlatform = 'android', registeredPushToken = null;
window.onPushToken = function (token, platform) {
  if (!token) return;
  platform = platform || 'android';
  if (API.token) {
    API.registerDeviceToken(token, platform).then(() => { registeredPushToken = token; }).catch(() => {});
  } else {
    pendingPushToken = token;
    pendingPushPlatform = platform;
  }
};
// a tapped push notification carries the same "ref" format as the in-app
// bell (e.g. "order#123") — App.routeByRef navigates either way
let pendingPushRef = null;
window.onPushOpen = function (ref) {
  if (!ref) return;
  if (API.user && window.App) window.App.routeByRef(ref);
  else pendingPushRef = ref;
};
// native Credential Manager hands the ID token back this way (see
// MainActivity.startGoogleSignIn) — a null token means it was cancelled or
// failed; surface whatever detail Android gave us rather than silently
// dumping the user back on the login screen with no explanation
window.onNativeGoogleSignIn = function (idToken, errorMsg) {
  if (idToken && window.App) { window.App.doGoogleSignIn(idToken); return; }
  const el = document.getElementById('loginErr');
  if (el) el.textContent = errorMsg ? 'Google sign-in: ' + errorMsg : 'Google sign-in was cancelled';
};

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
  // this user's own enabled pages (a flat array of page keys, from GET
  // /api/my-pages), used by navFor()/the VIEW router (see views.js) to
  // filter nav + block stale deep links. null means "not fetched yet" --
  // navFor() then falls back to the role's full hardcoded nav catalog
  // (today's pre-this-feature behavior), so a failed fetch is never worse
  // than before this feature existed.
  permissions: null,

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

    // an emailed reset link always wins, regardless of any existing session —
    // someone locked out on a shared/old device shouldn't land back in it
    if (!this.checkResetPasswordRoute()) {
      const restored = API.restore();
      if (restored.token && restored.user) {
        if (restored.user.status === 'pending') this.showPending(restored.user);
        else this.enter(restored.user);
      }
      else this.showLogin();
    }

    // signup
    const signupBtn = document.getElementById('openSignup');
    if (signupBtn) signupBtn.addEventListener('click', () => this.openSignup());

    // forgot password
    const forgotBtn = document.getElementById('openForgot');
    if (forgotBtn) forgotBtn.addEventListener('click', () => modalForgotPassword());

    const resetForm = document.getElementById('resetPasswordForm');
    if (resetForm) resetForm.addEventListener('submit', (e) => this.doResetPassword(e));

    const apkUploadBtn = document.getElementById('sideApkUpload');
    if (apkUploadBtn) apkUploadBtn.addEventListener('click', async () => {
      const info = await API.androidAppInfo().catch(() => null);
      modalUploadApk(info && info.available ? info.version : null);
    });

    window.addEventListener('hashchange', () => this.render());

    this.initAppDownloadLinks();
    this.initInstallPrompt();
    this.initGoogleSignIn();
    this.initTestAccounts();
  },

  // lets a browser visitor install this web app to their home screen/app
  // drawer like a native app (Chrome/Edge on Android fire beforeinstallprompt;
  // desktop Chrome too). iOS Safari never fires that event — there's no
  // programmatic install there, so the button just explains the manual
  // Share -> "Add to Home Screen" step instead. Stays hidden inside the
  // Android/iOS wrapper apps themselves (window.PurePak) and once already
  // running installed (display-mode: standalone) — nothing to install there.
  initInstallPrompt() {
    if (window.PurePak) return;
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) return;
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    const buttons = document.querySelectorAll('#sideInstallApp, #loginInstallApp');
    if (!buttons.length) return;
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let deferred = null;
    if (iOS) buttons.forEach(el => el.classList.remove('hidden'));
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e;
      buttons.forEach(el => el.classList.remove('hidden'));
    });
    window.addEventListener('appinstalled', () => buttons.forEach(el => el.classList.add('hidden')));
    buttons.forEach(el => el.addEventListener('click', async () => {
      if (deferred) {
        deferred.prompt();
        await deferred.userChoice;
        deferred = null;
        buttons.forEach(b => b.classList.add('hidden'));
      } else if (iOS) {
        this.toast('Tap the Share icon, then "Add to Home Screen"');
      }
    }));
  },

  // shows the "Get the Android app" link (login screen + sidebar) once a
  // build has actually been uploaded — stays hidden otherwise so nobody
  // gets a dead link. Also stays hidden inside the Android app or the iOS
  // app itself — window.PurePak is the JS bridge both native wrappers
  // inject (addJavascriptInterface on Android, WKUserScript on iOS), so
  // its presence means "already running in one of the native apps",
  // where an "install the Android app" link makes no sense either way.
  async initAppDownloadLinks() {
    if (window.PurePak) return;
    let info;
    try { info = await API.androidAppInfo(); } catch { return; }
    if (!info || !info.available) return;
    document.querySelectorAll('#loginApkVer, #sideApkVer').forEach(el => { el.textContent = 'v' + info.version; });
    document.querySelectorAll('#loginApkLink, #sideApkLink').forEach(el => el.classList.remove('hidden'));
  },

  // one-tap login per role for pre-launch review — only ever populated
  // while the server has PUREPAK_TEST_PASSWORD set (see db.js), so this
  // panel simply never appears once that's removed for a real launch
  async initTestAccounts() {
    let accounts;
    try { accounts = await API.testAccounts(); } catch { return; }
    if (!accounts || !accounts.length) return;
    const grid = document.getElementById('testAccountsGrid');
    grid.innerHTML = accounts.map(a => `
      <button type="button" class="demo-item" data-test-email="${API.esc(a.email)}">
        <b>${API.esc(API.roleLabel(a.role))}</b>
        <span>${API.esc(a.email)}</span>
      </button>`).join('');
    grid.querySelectorAll('[data-test-email]').forEach(btn =>
      btn.addEventListener('click', () => this.doTestLogin(btn.dataset.testEmail, btn)));
    document.getElementById('testAccountsPanel').classList.remove('hidden');
  },

  async doTestLogin(email, btn) {
    const errEl = document.getElementById('loginErr');
    if (errEl) errEl.textContent = '';
    if (btn) btn.disabled = true;
    try {
      const r = await API.testLogin(email);
      API.setAuth(r.token, r.user);
      if (r.pending) this.showPending(r.user);
      else this.enter(r.user);
    } catch (err) {
      if (errEl) errEl.textContent = err.message || 'Test login failed';
    } finally {
      // re-enable even on success — the login screen isn't destroyed on
      // logout (just hidden), so this same button has to work again next
      // time it's shown, not stay disabled from the previous login
      if (btn) btn.disabled = false;
    }
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
    document.getElementById('resetPassword').classList.add('hidden');
  },

  // handles #/reset-password/<token> whether it's the URL the page first
  // loaded with, or one the user navigates/pastes to on an already-open tab
  // (a plain hashchange never re-runs init(), so render() needs this too)
  checkResetPasswordRoute() {
    const m = /^#\/reset-password\/(.+)$/.exec(location.hash);
    if (m) this.showResetPassword(m[1]);
    return !!m;
  },

  showResetPassword(token) {
    this.hideSplash();
    this._resetToken = token;
    document.getElementById('login').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('resetPassword').classList.remove('hidden');
  },

  async doResetPassword(e) {
    e.preventDefault();
    const p1 = document.getElementById('resetPass1').value;
    const p2 = document.getElementById('resetPass2').value;
    const errEl = document.getElementById('resetPasswordErr');
    errEl.textContent = '';
    if (p1.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; return; }
    if (p1 !== p2) { errEl.textContent = "Passwords don't match"; return; }
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Setting password…';
    try {
      await API.resetPassword(this._resetToken, p1);
      location.hash = '';
      this.showLogin();
      this.toast('Password updated — sign in with your new password', 'ok');
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Set new password';
      errEl.textContent = err.message || 'That reset link is invalid or has expired';
    }
  },

  async doLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errEl = document.getElementById('loginErr');
    errEl.textContent = '';
    try {
      const r = await API.login(identifier, pass);
      API.setAuth(r.token, r.user);
      if (r.pending) this.showPending(r.user);
      else this.enter(r.user);
    } catch (err) {
      errEl.textContent = err.message || 'Login failed';
    }
  },

  async doGoogleSignIn(idToken) {
    const errEl = document.getElementById('loginErr');
    if (errEl) errEl.textContent = '';
    try {
      const r = await API.googleSignIn(idToken);
      API.setAuth(r.token, r.user);
      if (r.first_setup) this.toast('Owner account created — PurePak is ready. Invite your team from the Team screen.', 'ok');
      if (r.pending) this.showPending(r.user);
      else this.enter(r.user);
    } catch (err) {
      if (errEl) errEl.textContent = err.message || 'Google sign-in failed';
    }
  },

  // Inside the Android app (a WebView), Google refuses its own web sign-in
  // flow outright — window.PurePak.signInWithGoogle only exists there, and
  // when it does we skip Google's JS entirely and show a plain button that
  // hands off to the native Credential Manager flow instead. Everywhere
  // else (a real browser) renders Google's own button as usual. Either way,
  // if sign-in genuinely isn't available (an older app build without the
  // native method, or Google's script never loads), the whole section is
  // removed cleanly rather than left as a dead empty box.
  initGoogleSignIn(attempt = 0) {
    const target = document.getElementById('googleSignInBtn');
    if (!target) return;
    const removeSection = () => { document.querySelector('.login-divider')?.remove(); target.remove(); };
    if (window.PurePak && typeof window.PurePak.signInWithGoogle === 'function') {
      target.innerHTML = `<button type="button" class="btn ghost block" id="nativeGoogleBtn">Continue with Google</button>`;
      document.getElementById('nativeGoogleBtn').addEventListener('click', () => window.PurePak.signInWithGoogle());
      return;
    }
    // running inside the app, but an older build that predates native
    // Google sign-in — Google's web flow is a guaranteed dead end in any
    // version of this WebView, so don't waste 5s retrying it
    if (window.PurePak) return removeSection();
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      if (attempt < 20) setTimeout(() => this.initGoogleSignIn(attempt + 1), 250);
      else removeSection();
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => this.doGoogleSignIn(resp.credential),
    });
    google.accounts.id.renderButton(target, { theme: 'outline', size: 'large', width: 300, text: 'continue_with' });
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

  // Fetches this user's own enabled pages (see views.js's navFor/VIEW) so
  // nav and routing reflect admin's current settings. GET /api/my-pages is
  // open to any authenticated user (server/server.js) and can only ever
  // return the caller's own role's data, so this should succeed for every
  // role; the try/catch is just for a genuine network failure, in which
  // case navFor() falls back to the role's full hardcoded nav catalog,
  // matching this feature's pre-existing behavior exactly, so a failed
  // fetch is never worse than before this feature shipped.
  async refreshPermissions() {
    try {
      const r = await API.getMyPages();
      this.permissions = r.pages;
    } catch {
      this.permissions = null;
    }
  },

  // (re)builds the sidebar nav list for `user` from navFor(), using whatever
  // pages array is currently cached in this.permissions. Called once on login/
  // restore, and again every time refreshPermissions() resolves from
  // render()'s background refetch, so an admin's edit reaches an
  // already-open session's nav without needing a logout.
  renderNav(user) {
    // defensive: an empty `pages` array (role saved with zero enabled pages)
    // should be unreachable under the seeded system -- setPermissionsGrid
    // rejects a zero-page save -- but if it ever happens, fall back to the
    // role's full hardcoded nav catalog rather than leaving nav empty and
    // crashing enter()'s `nav[0].to` lookup below.
    let nav = navFor(user.role, this.permissions);
    if (nav.length === 0) nav = navFor(user.role, null);
    document.getElementById('nav').innerHTML = nav.map((n, i) => {
      const divider = n.section && n.section !== (nav[i - 1] && nav[i - 1].section)
        ? `<div class="nav-section">${n.section}</div>` : '';
      return `${divider}<a href="#/${n.to}" data-nav="${n.to}"><span class="ni">${n.icon}</span>${n.label}</a>`;
    }).join('');
    document.querySelectorAll('#nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.nav === this.route);
      a.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('scrim').classList.add('hidden');
      });
    });
    return nav;
  },

  async enter(user) {
    this.hideSplash();
    document.getElementById('login').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('sideName').textContent = user.name;
    document.getElementById('sideRole').textContent = API.roleLabel(user.role);
    document.getElementById('sideAvatar').textContent = (user.name[0] || '?').toUpperCase();
    // fetch this user's enabled pages before the first nav build so it
    // isn't drawn once unfiltered and then immediately rebuilt
    await this.refreshPermissions();
    const nav = this.renderNav(user);
    const def = nav[0].to;
    this.route = def;
    if (!location.hash || location.hash === '#/') location.hash = '#/' + def;
    this.render();
    this.bellStart();

    // only admin/manager get the "upload a new build" control
    const uploadBtn = document.getElementById('sideApkUpload');
    if (uploadBtn) uploadBtn.classList.toggle('hidden', !['admin', 'manager'].includes(user.role));

    // the native shell may have handed us a push token/open-ref before login finished
    if (pendingPushToken) { window.onPushToken(pendingPushToken, pendingPushPlatform); pendingPushToken = null; }

    // lets the native app offer "enable fingerprint unlock?" — a no-op
    // outside the app, and only ever actually prompts once, on whichever
    // app-entry (fresh login or a restored session) happens to come first
    if (window.PurePak && typeof window.PurePak.notifyLoggedIn === 'function') window.PurePak.notifyLoggedIn();
    if (pendingPushRef) { const r = pendingPushRef; pendingPushRef = null; setTimeout(() => this.routeByRef(r), 300); }
  },

  logout() {
    if (registeredPushToken) API.unregisterDeviceToken(registeredPushToken).catch(() => {});
    registeredPushToken = null;
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
      if (name === 'offer' && typeof window.refreshOfferBanner === 'function') {
        window.refreshOfferBanner().catch(() => {});
      }
    };
    ['order', 'pricing', 'team', 'receipt', 'payroll', 'customer', 'commission', 'offer', 'production'].forEach(ev =>
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
  // shared by the in-app bell (bellOpen) and a tapped push notification
  // (onPushOpen, below) — same "ref" format either way (e.g. "order#123")
  routeByRef(ref) {
    const valid = navFor(API.user.role, this.permissions).map(n => n.to);
    const goto = (...prefs) => { location.hash = '#/' + (prefs.find(p => valid.includes(p)) || valid[0] || 'dashboard'); };
    let m;
    if ((m = /^receipt#(\d+)$/.exec(ref))) {
      goto('receipts');
      const rid = +m[1];
      setTimeout(() => { try { Promise.resolve(modalReviewReceiptSafe(rid)).catch(() => {}); } catch {} }, 500);
    } else if ((m = /^order#(\d+)$/.exec(ref))) {
      goto('orders', 'deliveries', 'route', 'home');
      const oid = +m[1];
      if (valid.includes('orders')) setTimeout(() => { try { Promise.resolve(modalOrderDetail(oid)).catch(() => {}); } catch {} }, 500);
    } else if (/^(comm|commission)#/.test(ref)) {
      goto('agents', 'commissions', 'dashboard');   // admin/manager/finance → merged page; agent → "My commission"
    } else if (/^agent#/.test(ref)) {
      goto('agents', 'commissions');
    } else if (/^payroll/.test(ref)) {
      goto('payroll', 'profile', 'dashboard');
    } else if (/^user#\d+$/.test(ref)) {
      goto('team', 'profile');
    } else if (/^(product|pricing)#/.test(ref)) {
      goto('products', 'bookkeeping', 'home');
    } else if (/^offer#/.test(ref)) {
      goto('home', 'dashboard'); // the offer banner lives on the customer's Shop page
    } else if (/^production#/.test(ref)) {
      goto('production', 'dashboard');
    }
  },

  async bellOpen(id) {
    try { await API.markNotificationsRead(id); } catch {}
    const it = (this._bellItems || []).find(x => x.id === id);
    document.getElementById('bellPop')?.remove();
    this.routeByRef((it && it.ref) || '');
    this.bellUpdate(true).catch(() => {});
  },

  hashRoute() {
    return (location.hash || '').replace(/^#\//, '') || '';
  },

  async render() {
    if (this.checkResetPasswordRoute()) return;
    const u = API.user;
    if (!u) return this.showLogin();
    // Refetch this user's enabled pages in the background on every
    // navigation (fire-and-forget — must not block this route's render) so
    // an admin's edit reaches this role's nav on its very next click,
    // without logout. Once it resolves, rebuild the sidebar from it.
    this.refreshPermissions().then(() => this.renderNav(u));
    const parts = this.hashRoute().split('/');
    let route = parts[0] || 'dashboard';
    const valid = navFor(u.role, this.permissions).map(n => n.to);
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
      // A role newly granted a page outside its own default catalog (see
      // navFor's PAGE_NAV_CATALOG merge) has no renderer under VIEW[role] --
      // fall back to the admin/manager renderer for that page key, since
      // those two cover the vast majority of page keys. If truly nothing
      // renders it anywhere, show a minimal placeholder instead of a hard
      // error -- this shouldn't happen for the 21 real page keys, but a
      // role granted something genuinely self-scoped-only (e.g. 'profile',
      // 'home', 'commissions') that neither admin nor manager have a view
      // for either is exactly the defensive case this guards.
      const renderer = (VIEW[u.role] && VIEW[u.role][route]) || VIEW.admin[route] || VIEW.manager[route];
      const html = renderer
        ? await renderer(this.ctx)
        : `<div class="page-head"><h1>${API.esc((PAGE_NAV_CATALOG[route] && PAGE_NAV_CATALOG[route].label) || route)}</h1></div><p class="muted">This page doesn't have a dedicated view for your role yet.</p>`;
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
    const { act, id, status, to, product, name, due, method, active, uid, mode, folder } = ds;
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
      case 'del-start-all': stop(); {
        const pending = (smartRoute.plan?.sequence || []).filter(s => s.status === 'pending');
        if (!pending.length) break;
        if (!await confirmDialog({ title: 'Start trip', message: `Mark all ${pending.length} pending stop(s) as out for delivery?`, okLabel: 'Start trip' })) break;
        let failed = 0;
        for (const s of pending) {
          try { await API.updateDelivery(s.delivery_id, { status: 'out_for_delivery' }); }
          catch { failed++; }
        }
        this.toast(failed ? `Started, but ${failed} stop(s) failed` : 'Trip started — whole route is out for delivery', failed ? 'bad' : 'ok');
        this.refresh();
      } break;
      case 'del-done': stop();
        modalMarkDelivered(+id, +due || 0, method);
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
      case 'agent-rates': stop(); modalAgentRates(+id, name); break;
      case 'new-offer': stop(); modalNewOffer(); break;
      case 'backup-run': stop(); {
        const el = e.target.closest('[data-act="backup-run"]');
        el.disabled = true; el.textContent = 'Backing up…';
        try {
          const r = await API.runBackup();
          toast(r.emailed ? `Backup complete — emailed to ${r.recipients} admin(s)` : 'Backup complete (not emailed — no admin email on file)', 'ok');
          App.refresh();
        } catch (err) {
          el.disabled = false; el.textContent = 'Backup now';
          toast(err.message, 'err');
        }
        break;
      }
      case 'offer-toggle': stop(); {
        const el = e.target.closest('[data-act="offer-toggle"]');
        const active = el.dataset.active === '1';
        try {
          await API.updateOffer(+el.dataset.id, { active });
          toast(active ? 'Offer turned on — broadcasting now' : 'Offer turned off', 'ok');
          App.refresh();
        } catch (err) { toast(err.message, 'bad'); }
      } break;
      case 'offer-delete': stop();
        if (await confirmDialog({ title: 'Delete offer', message: 'This removes it for good — customers who already saw the notification keep it in their feed, but the banner disappears.', okLabel: 'Delete', danger: true })) {
          try { await API.deleteOffer(+id); toast('Offer deleted'); App.refresh(); }
          catch (e) { this.toast(e.message, 'bad'); }
        }
        break;
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
      case 'delete-product': stop();
        if (await confirmDialog({ title: 'Remove product', message: `This permanently removes "${name}" from the catalog. If it's ever been ordered, use Pause instead — removal is blocked once there's order history.`, okLabel: 'Remove', danger: true })) {
          try { await API.deleteProduct(+id); toast('Product removed'); App.refresh(); }
          catch (e) { toast(e.message, 'err'); }
        }
        break;
      case 'log-production': stop(); modalLogProduction(); break;
      case 'log-vehicle-trip': stop(); modalLogVehicleTrip(); break;
      case 'add-vehicle': stop(); modalAddVehicle(); break;
      case 'toggle-vehicle': stop(); {
        try {
          await API.updateVehicle(+id, { active: active === '1' });
          this.toast(active === '1' ? 'Vehicle activated' : 'Vehicle deactivated');
          this.refresh();
        } catch (e) { this.toast(e.message, 'err'); }
        break;
      }
      case 'cmb-mode': stop(); {
        const isNew = mode === 'new';
        document.getElementById('cmbLinkPanel').classList.toggle('hidden', isNew);
        document.getElementById('cmbNewPanel').classList.toggle('hidden', !isNew);
        document.getElementById('cmbModeLink').classList.toggle('primary', !isNew);
        document.getElementById('cmbModeLink').classList.toggle('ghost', isNew);
        document.getElementById('cmbModeNew').classList.toggle('primary', isNew);
        document.getElementById('cmbModeNew').classList.toggle('ghost', !isNew);
        break;
      }
      case 'add-mailbox': stop(); {
        const email = document.getElementById('cmbExisting').value;
        const password = document.getElementById('cmbPassword').value;
        const assignSel = document.getElementById('cmbAssign');
        const assigned_user_id = assignSel && assignSel.value ? +assignSel.value : null;
        if (!email) { this.toast('Choose a mailbox to link', 'warn'); return; }
        if (!password) { this.toast('Enter the mailbox password', 'warn'); return; }
        const btn = ev.target.closest('[data-act]');
        btn.disabled = true; btn.textContent = 'Linking…';
        try {
          await API.createMailbox({ email, password, assigned_user_id });
          this.toast('Mailbox linked');
          this.refresh();
        } catch (e) {
          this.toast(e.message, 'err');
          btn.disabled = false; btn.textContent = 'Link mailbox';
        }
        break;
      }
      case 'create-mailbox': stop(); {
        const localPart = document.getElementById('cmbLocalPart').value.trim();
        const password = document.getElementById('cmbNewPassword').value;
        const assignSel = document.getElementById('cmbNewAssign');
        const assigned_user_id = assignSel && assignSel.value ? +assignSel.value : null;
        if (!localPart) { this.toast('Enter a name for the new mailbox', 'warn'); return; }
        if (password.length < 8) { this.toast('Password must be at least 8 characters', 'warn'); return; }
        const btn = ev.target.closest('[data-act]');
        btn.disabled = true; btn.textContent = 'Creating…';
        try {
          await API.provisionMailbox({ local_part: localPart, password, assigned_user_id });
          this.toast('Mailbox created and linked');
          this.refresh();
        } catch (e) {
          this.toast(e.message, 'err');
          btn.disabled = false; btn.textContent = 'Create mailbox';
        }
        break;
      }
      case 'assign-mailbox': stop(); {
        const sel = document.getElementById('mbAssign-' + id);
        const assigned_user_id = sel && sel.value ? +sel.value : null;
        try {
          await API.updateMailbox(+id, { assigned_user_id });
          this.toast('Mailbox assignment updated');
          this.refresh();
        } catch (e) { this.toast(e.message, 'err'); }
        break;
      }
      case 'delete-mailbox': stop(); {
        if (!await confirmDialog({ title: 'Remove mailbox', message: 'This removes the saved mailbox and its password. It can be added again later.', okLabel: 'Remove', danger: true })) break;
        try {
          await API.deleteMailbox(+id);
          this.toast('Mailbox removed');
          this.refresh();
        } catch (e) { this.toast(e.message, 'err'); }
        break;
      }
      case 'refresh-mail': stop(); this.refresh(); break;
      case 'mail-folder': stop(); setMailFolder(mode); this.refresh(); break;
      case 'read-mail': stop(); modalReadMessage(+uid, folder); break;
      case 'compose-mail': stop(); modalComposeMail(to); break;
      case 'review-production': stop(); {
        try {
          await API.reviewProduction(+id, { status });
          this.toast(status === 'approved' ? 'Production approved — stock updated' : 'Entry rejected');
          this.refresh();
        } catch (e) { this.toast(e.message, 'err'); }
        break;
      }
      case 'adjust-stock': stop(); modalAdjustStock(+id); break;
      case 'add-customer': stop(); modalAddCustomer(); break;
      case 'edit-customer': stop(); modalEditCustomer(+id); break;
      case 'view-customer': stop(); modalCustomerDetail(+id); break;
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
      case 'team-delete': stop();
        if (await confirmDialog({ title: 'Remove employee', message: `This permanently removes "${name}"'s account. If they have production, payroll, or vehicle-trip history, removal is blocked — use Disable instead.`, okLabel: 'Remove', danger: true })) {
          try { await API.deleteUser(+id); this.toast('Employee removed'); this.refresh(); }
          catch (e) { this.toast(e.message, 'err'); }
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
        // ds is the button's native DOM dataset, which camelCases attribute
        // names (data-pct-input -> ds.pctInput) — bracket access with the
        // literal hyphenated string was always undefined, so this silently
        // sent { active: false } on every click, Activate included
        const pctInput = document.getElementById(ds.pctInput);
        const b = { active: ds.targetActive === '1' };
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
      case 'delete-agent': stop();
        if (await confirmDialog({ title: 'Remove agent', message: `This permanently removes "${name}". If they have any order/commission history, assigned customers, or a linked team login, removal is blocked — use Deactivate instead.`, okLabel: 'Remove', danger: true })) {
          try { await API.deleteAgent(+id); this.toast('Agent removed'); this.refresh(); }
          catch (e) { this.toast(e.message, 'err'); }
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
      case 'save-permissions': stop(); {
        const grid = {};
        document.querySelectorAll('[data-perm-role]').forEach(inp => {
          const r = inp.dataset.permRole, p = inp.dataset.permPage;
          (grid[r] = grid[r] || {})[p] = inp.checked;
        });
        try {
          await API.savePermissions(grid);
          this.toast('Permissions saved', 'ok');
          this.refresh(); // re-renders this view AND (via render()'s background
                           // refreshPermissions) updates this session's own nav
        } catch (e) { this.toast(e.message, 'err'); } // e.message is the server's own 400 text on a zero-pages rejection
      } break;
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
          await API.updateCustomer(API.user.customer_id, { phone, address, lat: _profileLat, lng: _profileLng });
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
