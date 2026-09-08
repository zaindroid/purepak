/* UI audit: menu/scrim, cancel-button wiring, effective price in UI, realtime 2-tab */
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = 'http://localhost:4311';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PW = 'purepak123';
let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('PASS  ' + name + (detail ? '  — ' + detail : '')); }
  else { fail++; console.log('FAIL  ' + name + (detail ? '  — ' + detail : '')); }
};
async function newLogin(email) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForFunction(() => { const s = document.getElementById('splash'); return !s || s.classList.contains('hidden'); }, { timeout: 15000 });
  await page.type('#loginEmail', email);
  await page.type('#loginPass', PW);
  await page.evaluate(() => document.querySelector('#loginForm button[type=submit]').click());
  await page.waitForSelector('#app:not(.hidden)', { timeout: 15000 });
  await sleep(600);
  return { browser, ctx, page };
}
(async () => {
  // ============ 1) menu + scrim ============
  {
    const { browser, ctx, page } = await newLogin('admin@purepak.pk');
    await page.evaluate(() => document.getElementById('menuBtn').click());
    await sleep(350);
    const opened = await page.evaluate(() => document.getElementById('sidebar').classList.contains('open'));
    const scrimOn = await page.evaluate(() => !document.getElementById('scrim').classList.contains('hidden'));
    check('menu: opens AND scrim becomes visible', opened && scrimOn, `sidebar=${opened} scrim=${scrimOn}`);
    // tap the content area (right of the 232px drawer)
    await page.mouse.click(340, 500);
    await sleep(350);
    const closedAfterTap = await page.evaluate(() => !document.getElementById('sidebar').classList.contains('open'));
    const scrimOff = await page.evaluate(() => document.getElementById('scrim').classList.contains('hidden'));
    check('menu: tap on main page closes drawer + hides scrim', closedAfterTap && scrimOff, `closed=${closedAfterTap} scrimHidden=${scrimOff}`);
    // nav link closes it
    await page.evaluate(() => document.getElementById('menuBtn').click()); await sleep(300);
    await page.evaluate(() => document.querySelector('#nav a[data-nav="orders"]').click());
    await sleep(500);
    check('menu: nav link closes drawer', await page.evaluate(() => !document.getElementById('sidebar').classList.contains('open')));
    await browser.close();
  }

  // ============ 2) cancel button in New Order modal ============
  {
    const { browser, ctx, page } = await newLogin('admin@purepak.pk');
    await page.evaluate(() => { location.hash = '#/home'; });
    await sleep(400);
    await page.evaluate(() => { const b = [...document.querySelectorAll('[data-act="new-order"]')][0]; if (b) b.click(); });
    await sleep(700);
    const modalOpen = await page.evaluate(() => !!document.getElementById('modalRoot').querySelector('.modal'));
    const cancelBtns = await page.evaluate(() => [...document.querySelectorAll('#modalRoot [data-close-modal]')].map(el => (el.textContent || el.getAttribute('aria-label') || '').trim()).filter(Boolean));
    check('modal: New Order opens', modalOpen);
    check('modal: cancel + close buttons present', cancelBtns.length >= 2, cancelBtns.join(' | '));
    // click the footer Cancel (the one that used to be dead)
    await page.evaluate(() => { const c = [...document.querySelectorAll('#modalRoot [data-close-modal]')].pop(); if (c) c.click(); });
    await sleep(400);
    const closed = await page.evaluate(() => !document.getElementById('modalRoot').querySelector('.modal'));
    check('modal: footer Cancel actually closes it', closed, 'footer cancel was unbound before fix');
    await browser.close();
  }

  // ============ 3) effective price shown to customer ============
  {
    const { browser, ctx, page } = await newLogin('ali@rascon.pk');
    await page.evaluate(() => { location.hash = '#/home'; });
    await sleep(700);
    const prices = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.grid-products .card .money-lg')];
      return cards.map(c => c.textContent.trim()).slice(0, 5);
    });
    // ali is 'wholesale'; product 1 base=10, wholesale=8. The UI must show the
    // per-type price (8), not the base (10) — proving priceForCustomer took effect.
    const showsWholesale = prices.some(p => p.includes('8'));
    const showsBase10 = prices.some(p => p === 'Rs 10');
    check('pricing: customer sees type price (wholesale 8), not base 10', showsWholesale && !showsBase10, prices.join(' | '));
    // open order modal, verify unit price line
    await page.evaluate(() => { const b = [...document.querySelectorAll('[data-act="new-order"]')][0]; if (b) b.click(); });
    await sleep(700);
    const unitLines = await page.evaluate(() => [...document.querySelectorAll('#modalRoot [data-itemqty]')].map(i => i.closest('.row2').textContent.replace(/\s+/g, ' ').trim()).slice(0, 3));
    check('pricing: order form shows per-unit price', unitLines.length > 0, unitLines.join(' | '));
    await browser.close();
  }

  // ============ 4) realtime across two accounts (SSE) ============
  {
    const b1 = await newLogin('admin@purepak.pk');
    await b1.page.evaluate(() => { location.hash = '#/orders'; }); await sleep(600);
    const badgeBefore = await b1.page.evaluate(() => { const b = document.getElementById('bellBadge'); return b ? b.textContent : ''; });
    const b2 = await newLogin('sana@funloft.pk');
    await b2.page.evaluate(() => { location.hash = '#/home'; }); await sleep(400);
    await b2.page.evaluate(() => { const b = [...document.querySelectorAll('[data-act="new-order"]')][0]; if (b) b.click(); });
    await sleep(700);
    await b2.page.evaluate(() => { const i = document.querySelector('[data-itemqty]'); if (i) { i.value = 1; i.dispatchEvent(new Event('input')); } });
    await b2.page.evaluate(() => document.getElementById('ocSubmit').click());
    await sleep(1000);
    // admin's orders view should refresh itself via SSE within ~2s
    const badgeAfter = await b1.page.evaluate(() => { const b = document.getElementById('bellBadge'); return b ? b.textContent : ''; });
    const adminSeesNew = await b1.page.evaluate(() => document.body.innerText.includes('Sana'));
    check('realtime: admin badge fires without refresh', badgeAfter !== badgeBefore || adminSeesNew, `badge ${badgeBefore} -> ${badgeAfter}, admin list sees new customer=${adminSeesNew}`);
    await b1.browser.close(); await b2.browser.close();
  }

  console.log(`\n==== UI AUDIT: ${pass} passed, ${fail} failed ====`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
