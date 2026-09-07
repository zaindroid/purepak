const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--force-device-scale-factor=1'],
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:4311/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForFunction(() => { const s = document.getElementById('splash'); return !s || s.classList.contains('hidden'); }, { timeout: 15000 }).catch(() => {});
  await sleep(300);
  await page.type('#loginEmail', 'finance@purepak.pk');
  await page.type('#loginPass', 'purepak123');
  await page.evaluate(() => document.querySelector('#loginForm button[type=submit]').click());
  await page.waitForSelector('#app:not(.hidden)', { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => { location.hash = '#/dashboard'; });
  await sleep(1500);
  const report = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 1 && r.width > 0 && !el.classList.contains('hidden')) {
        offenders.push({
          tag: el.tagName,
          id: el.id,
          cls: (el.className || '').toString().slice(0, 50),
          w: Math.round(r.width),
          right: Math.round(r.right),
          text: (el.innerText || '').slice(0, 40).replace(/\s+/g, ' '),
        });
      }
    });
    return { vw, docScrollW: document.documentElement.scrollWidth, offenders };
  });
  console.log('viewport', report.vw, 'docScrollW', report.docScrollW);
  console.log('OFFENDERS (' + report.offenders.length + '):');
  report.offenders.forEach(o => console.log(`  ${o.tag}#${o.id}.${o.cls} w=${o.w} right=${o.right} "${o.text}"`));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
