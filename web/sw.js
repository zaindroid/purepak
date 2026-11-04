'use strict';
// PurePak install-only service worker. Deliberately does NOT cache anything —
// the app shell (html/js/css) is served with Cache-Control: no-store on purpose
// (see staticHeaders() in server.js — a Cloudflare caching bug once masked a
// live deploy for hours), so a caching service worker here would reintroduce
// the exact same class of bug at a layer the server can't control. Its only
// job is to exist and answer fetch, which is what browsers require before
// they'll offer "Add to Home Screen" / install.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request)); });
