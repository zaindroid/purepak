const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-device-scale-factor=1'],
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const t0 = Date.now();
  try {
    await page.goto('http://localhost:4311/', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('goto ok in', Date.now() - t0, 'ms');
  } catch (e) {
    console.log('goto FAILED:', e.message, 'after', Date.now() - t0, 'ms');
  }
  try {
    await page.waitForFunction(() => {
      const s = document.getElementById('splash');
      return !s || s.classList.contains('hidden') || s.classList.contains('bye');
    }, { timeout: 15000 });
    console.log('splash cleared');
  } catch (e) {
    console.log('splash wait FAILED');
    const s = await page.evaluate(() => document.getElementById('splash')?.className);
    console.log('splash class now:', s);
  }
  await sleep(500);
  try {
    await page.waitForSelector('#loginEmail', { visible: true, timeout: 10000 });
    console.log('login form visible — OK');
    await page.type('#loginEmail', 'admin@purepak.pk');
    await page.type('#loginPass', 'purepak123');
    await page.evaluate(() => document.querySelector('#loginForm button[type=submit]').click());
    await page.waitForSelector('#app:not(.hidden)', { timeout: 15000 }).catch(() => {});
    await sleep(1500);
    console.log('logged in:', await page.evaluate(() => !document.getElementById('app').classList.contains('hidden')));
  } catch (e) {
    console.log('LOGIN FLOW FAILED:', e.message);
    const st = await page.evaluate(() => {
      const el = id => { const e = document.getElementById(id); if (!e) return '(missing)'; const c = getComputedStyle(e); return `display=${c.display} op=${c.opacity} cls=${e.className}`; };
      return { splash: el('splash'), login: el('login'), app: el('app') };
    });
    console.log(JSON.stringify(st, null, 1));
    await page.screenshot({ path: 'phone-audit/diag2.png' });
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
