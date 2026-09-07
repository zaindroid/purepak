const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const log = [];
  page.on('console', m => log.push('CONSOLE ' + m.type() + ': ' + m.text()));
  page.on('pageerror', e => log.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:4311/', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  const state = await page.evaluate(() => {
    const el = id => { const e = document.getElementById(id); if (!e) return id + ':(missing)'; const cs = getComputedStyle(e); return id + ': display=' + cs.display + ' vis=' + cs.visibility + ' z=' + cs.zIndex + ' op=' + cs.opacity + ' cls=' + e.className; };
    return { title: document.title, splash: el('splash'), login: el('login'), app: el('app') };
  });
  console.log(JSON.stringify(state, null, 1));
  console.log(log.join('\n') || '(no console errors)');
  await page.screenshot({ path: require('path').join(__dirname, 'phone-audit', 'diag-login.png') });
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
