const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => {
    console.log('PAGEERROR:', e.message);
    console.log((e.stack || '').split('\n').slice(0, 6).join('\n'));
    console.log('---');
  });
  await p.goto('http://localhost:4311/', { waitUntil: 'networkidle2', timeout: 30000 });
  await p.waitForFunction(() => { const s = document.getElementById('splash'); return !s || s.classList.contains('hidden'); }, { timeout: 15000 }).catch(() => {});
  await sleep(300);
  await p.type('#loginEmail', 'delivery@purepak.pk');
  await p.type('#loginPass', 'purepak123');
  await p.evaluate(() => document.querySelector('#loginForm button[type=submit]').click());
  await p.waitForSelector('#app:not(.hidden)', { timeout: 15000 }).catch(() => {});
  await sleep(3000);
  console.log('waited');
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
