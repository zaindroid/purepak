/* PurePak phone-viewport audit: capture every screen at 390x844, flag horizontal overflow */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4311';
const OUT = path.join(__dirname, 'phone-audit');
fs.mkdirSync(OUT, { recursive: true });

const ROLES = [
  { user: 'admin@purepak.pk',  label: 'admin',    routes: ['dashboard','orders','deliveries','route','customers','agents','commissions','bookkeeping','receipts','team','payroll','products'] },
  { user: 'finance@purepak.pk', label: 'finance',  routes: ['dashboard','bookkeeping','commissions','orders','receipts','payroll','agents'] },
  { user: 'hina@purepak.pk',    label: 'agent',    routes: ['dashboard','orders','commissions','receipts'] },
  { user: 'delivery@purepak.pk', label: 'delivery', routes: ['route','deliveries','receipts'] },
  { user: 'ali@rascon.pk',      label: 'customer', routes: ['home','orders'] },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-device-scale-factor=1'],
  });
  const results = [];
  for (const role of ROLES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200)); // splash out
    // login
    await page.type('#loginEmail', role.user);
    await page.type('#loginPass', 'purepak123');
    await page.click('#loginForm button[type=submit]');
    await page.waitForSelector('#app:not(.hidden)', { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    const loggedIn = await page.evaluate(() => !document.getElementById('app').classList.contains('hidden'));
    if (!loggedIn) {
      results.push({ role: role.label, login: false });
      await page.screenshot({ path: path.join(OUT, `${role.label}-LOGIN-FAIL.png`), fullPage: false });
      await page.close();
      continue;
    }
    results.push({ role: role.label, login: true });
    for (const route of role.routes) {
      await page.evaluate((h) => { location.hash = '#/' + h; }, route);
      await new Promise(r => setTimeout(r, 900));
      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const overflow = de.scrollWidth - de.clientWidth;
        // find elements wider than viewport (common offenders)
        const bad = [];
        const vw = de.clientWidth;
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > vw + 1 && r.width > 0) {
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' && el.id === 'splash') return;
            bad.push({ tag: el.tagName, id: el.id, cls: (el.className||'').toString().slice(0,60), w: Math.round(r.width) });
          }
        });
        // dedupe: keep deepest offenders only (skip ancestors of deeper ones)
        return { overflow, scrollW: de.scrollWidth, clientW: de.clientWidth, bad: bad.slice(0, 8) };
      });
      const name = `${role.label}-${route}.png`;
      await page.screenshot({ path: path.join(OUT, name), fullPage: false });
      results.push({ role: role.label, route, ...m, shot: name });
      await page.close === route ? null : null;
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2));
  const bad = results.filter(r => r.route && r.overflow > 0);
  console.log(`\n${results.length} screens checked, ${bad.length} with horizontal overflow:\n`);
  for (const b of bad) console.log(`  ${b.role}/${b.route}: overflow=${b.overflow}px offenders=${JSON.stringify(b.bad.slice(0,4))}`);
  const failed = results.filter(r => r.login === false);
  if (failed.length) console.log('LOGIN FAILS:', failed.map(f=>f.role).join(', '));
})().catch(e => { console.error('AUDIT ERROR', e.message); process.exit(1); });
