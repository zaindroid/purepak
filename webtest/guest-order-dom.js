'use strict';
// DOM-level check of the actual order.html page (not just the API): load it
// in jsdom, click through add-to-cart -> continue -> fill form -> submit, and
// verify the real page logic (cart math, step transitions, confirmation) all
// work exactly the way a phone scanning the QR code would see them.
const { JSDOM } = require('jsdom');
const { readFileSync } = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4310';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, extra = '') => { if (!ok) { fails++; console.log('FAIL', n, extra); } else console.log('ok  ', n); };

(async () => {
  let html = readFileSync(path.join(__dirname, '..', 'web', 'order.html'), 'utf8');
  // pull the inline <script> out so it doesn't run during parsing — jsdom
  // executes inline scripts synchronously as it parses them, before we'd
  // have a chance to install the fetch polyfill it needs
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
  html = html.replace(/<script>[\s\S]*<\/script>/, '');
  const dom = new JSDOM(html, { url: BASE + '/order?src=lobby-kiosk-3', runScripts: 'dangerously', pretendToBeVisual: true });
  const { window } = dom; const { document } = window;
  const nf = globalThis.fetch;
  window.fetch = (u, o) => nf(String(u).startsWith('http') ? u : BASE + String(u), o);
  window.scrollTo = () => {};
  window.eval(scriptMatch[1]);

  await sleep(1200); // let the products fetch + initial render land

  const cards = document.querySelectorAll('#prodList .prod');
  check('product cards rendered from the API', cards.length === 5, cards.length);
  check('cart bar starts hidden (empty basket)', document.getElementById('cartBar').hidden === true);

  // add two of the 12L bottle
  const card12 = [...cards].find(c => /12 L/.test(c.textContent));
  check('found the 12L card', !!card12);
  card12.querySelector('[data-act="add"]').click();
  await sleep(30);
  document.querySelector('#prodList [data-act="inc"][data-pid="' + card12.dataset.pid + '"]').click();
  await sleep(30);

  check('cart bar appears once something is added', document.getElementById('cartBar').hidden === false);
  check('cart count shows 2 bottles', /2\s*bottles/.test(document.getElementById('cartCount').textContent));
  check("continue button isn't disabled with items in the cart", !document.getElementById('continueBtn').disabled);

  document.getElementById('continueBtn').click();
  await sleep(30);
  check('moved to the contact/address step', document.getElementById('step2').hidden === false && document.getElementById('step1').hidden === true);

  document.getElementById('fName').value = 'DOM Test Guest';
  document.getElementById('fPhone').value = '0345-' + Math.floor(1000000 + Math.random() * 8999999);
  document.getElementById('fAddress').value = 'Flat 4, Margalla Towers';
  document.getElementById('fArea').value = 'F-10';

  document.getElementById('placeBtn').click();
  const t0 = Date.now();
  while (Date.now() - t0 < 8000 && document.getElementById('step3').hidden) await sleep(80);

  check('order submitted and the confirmation step shows', document.getElementById('step3').hidden === false);
  check('confirmation shows a real order number', /#\d+/.test(document.getElementById('doneOrderId').textContent), document.getElementById('doneOrderId').textContent);
  check('confirmation shows the right total (2 x 12L price)', document.getElementById('doneOrderTotal').textContent.includes('160'), document.getElementById('doneOrderTotal').textContent);
  check('WhatsApp button links to wa.me with the order number', document.getElementById('waBtn').href.includes('wa.me') && document.getElementById('waBtn').href.includes(document.getElementById('doneOrderId').textContent.replace('#', '')));
  check('the "create an account" note is hidden once ordered (keeps confirmation clean)', document.getElementById('signinNote').hidden === true);

  window.close();
  console.log('----');
  console.log(fails === 0 ? 'GUEST ORDER DOM: ALL PASS' : fails + ' FAILURES');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
