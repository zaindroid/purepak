const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ROLES = [
  { user: 'admin@purepak.pk', label: 'admin', home: 'dashboard' },
  { user: 'finance@purepak.pk', label: 'finance', home: 'dashboard' },
  { user: 'hina@purepak.pk', label: 'agent', home: 'dashboard' },
  { user: 'delivery@purepak.pk', label: 'delivery', home: 'route' },
  { user: 'ali@rascon.pk', label: 'customer', home: 'home' },
];
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  for (const role of ROLES) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    const errs = [];
    await page.evaluateOnNewDocument(() => {
      const orig = console.error;
      console.error = (...a) => {
        if (a[0] && a[0].stack) window.__lastErrStack = a[0].stack;
        orig(...a);
      };
    });
    page.on('pageerror', e => errs.push('STACK>> ' + (e.stack || e.message).split('\n').slice(0, 5).join(' | ')));
    page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE:' + m.text().slice(0, 80)); });
    try {
      await page.goto('http://localhost:4311/', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForFunction(() => { const s = document.getElementById('splash'); return !s || s.classList.contains('hidden'); }, { timeout: 15000 }).catch(() => {});
      await sleep(300);
      await page.type('#loginEmail', role.user);
      await page.type('#loginPass', 'purepak123');
      await page.evaluate(() => document.querySelector('#loginForm button[type=submit]').click());
      await page.waitForSelector('#app:not(.hidden)', { timeout: 15000 }).catch(() => {});
      await page.evaluate((h) => { location.hash = '#/' + h; }, role.home);
      await sleep(1500);
      const m = await page.evaluate(() => {
        const view = document.getElementById('view');
        const text = (view ? view.innerText : '').replace(/\s+/g, ' ').trim();
        const hasMap = !!document.querySelector('.leaflet-container');
        const hasTable = !!document.querySelector('#view table, #view .tbl');
        const hasEmpty = /no (orders|entries|deliveries|data|receipts)/i.test(text);
        const de = document.documentElement;
        return { len: text.length, head: text.slice(0, 70), hasMap, hasTable, hasEmpty, overflow: de.scrollWidth - de.clientWidth };
      });
      console.log(`[${role.label}/${role.home}] loggedIn, content=${m.len}ch, map=${m.hasMap}, table=${m.hasTable}, empty=${m.hasEmpty}, overflow=${m.overflow}`);
      console.log(`   head: "${m.head}"`);
      if (errs.length) console.log('   ERRORS:', errs.slice(0, 4).join(' | '));
      const lastStack = await page.evaluate(() => window.__lastErrStack || null);
      if (lastStack) console.log('   LAST-STACK:\n' + lastStack.split('\n').slice(0, 8).join('\n'));
    } catch (e) {
      console.log(`[${role.label}] FAILED: ${e.message}`);
    }
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
