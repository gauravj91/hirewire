/* HireWire service worker — app-shell cache + local reminders. No push, no server.
   • Caches only same-origin files (the app shell: pages, icons, manifest, CSS). Cross-origin requests — job feeds,
     hirewire-api, Anthropic, Stripe, fonts, analytics — are never intercepted or cached; same-origin /api/ is bypassed too.
   • index.html and other pages: network-first (always fresh when online), cached copy when offline.
   • Static files: stale-while-revalidate. Video/audio files and any Range request are never intercepted or cached.
   • Versioned cache; a new version waits until the page asks it to take over ("New version available — reload").
   • Periodic Background Sync (where the browser supports it, e.g. installed Chrome/Edge): reads the follow-up
     due dates the page left in its IndexedDB mirror and shows at most one notification a day. Nothing is fetched. */
'use strict';
const VERSION = 'hw-shell-v10';   // v10 (2026-10-21, free CV builder /cv-builder.html + /de/lebenslauf-vorlage.html, app #hw-cv hand-off, footer links). v9 (2026-10-16, homepage JSON-LD/hreflang, static "What is HireWire?" intro, llms.txt footer link). v8 (2026-10-16, permanent footer "▶ Demo video" link; modal restarts after the end). v7 (2026-10-16, demo video: hero link + modal, guide section; video/range requests bypass the SW). v6 (2026-10-15, 55 feeds, ChatGPT FAQ, footer overlap fix). v5 (2026-10-15, purchase confirmation email: terms/withdrawal/privacy copy). v4 (2026-10-15, legal pages live: terms, withdrawal, imprint; Stripe live). v3: Workers cutover, fonts, consent
const PREFIX = 'hw-shell-';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
const STATIC_RE = /\.(?:png|jpe?g|gif|svg|webp|ico|css|js|webmanifest|woff2?|txt|xml)$/i;
const MEDIA_RE = /\.(?:mp4|m4v|webm|mov|ogv|mp3|m4a|ogg|wav)$/i;   // video/audio: never cached, never intercepted (Range requests stay native)

/* pure routing decision — unit-tested in work/growth-test/sw.test.js */
function swStrategy(reqUrl, method, origin, mode, dest, hasRange){
  let u;
  try { u = new URL(reqUrl); } catch(e){ return 'bypass'; }
  if (method !== 'GET') return 'bypass';
  if (hasRange || dest === 'video' || dest === 'audio') return 'bypass';   // media element + byte-range requests go straight to the network
  if (u.origin !== origin) return 'bypass';                       // feeds, API, Anthropic, Stripe, fonts, PostHog
  if (/^\/api\//.test(u.pathname) || u.pathname === '/sw.js') return 'bypass';
  if (MEDIA_RE.test(u.pathname)) return 'bypass';                 // demo videos (assets/video/*.mp4) are never cached
  if (mode === 'navigate' || u.pathname === '/' || /\.html?$/i.test(u.pathname)) return 'network-first';
  if (STATIC_RE.test(u.pathname)) return 'swr';
  return 'bypass';                                                // anything else (e.g. .json data) is never cached
}
/* cache key for pages: path only, so ?pass_session=, ?ref= and #hw-add= never end up in the cache */
function swPageKey(reqUrl){ const u = new URL(reqUrl); return u.origin + (u.pathname === '/index.html' ? '/' : u.pathname); }
function swOldCaches(keys){ return keys.filter(k => k.indexOf(PREFIX) === 0 && k !== VERSION); }
function swDueCount(plan, now, today){
  if (!plan || !plan.on || !Array.isArray(plan.fuDue)) return 0;
  if (plan.last === today) return 0;
  return plan.fuDue.filter(t => typeof t === 'number' && t <= now).length;
}
const isoDay = ts => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

if (typeof module !== 'undefined' && module.exports){
  module.exports = { swStrategy, swPageKey, swOldCaches, swDueCount, VERSION, SHELL };
} else {
  self.addEventListener('install', event => {
    event.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).catch(() => {}));
    // no skipWaiting() here: an update waits until the page asks (safe update flow)
  });
  self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(swOldCaches(keys).map(k => caches.delete(k)))).then(() => self.clients.claim()));
  });
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  });
  self.addEventListener('fetch', event => {
    const req = event.request;
    const how = swStrategy(req.url, req.method, self.location.origin, req.mode, req.destination, !!(req.headers && req.headers.has('range')));
    if (how === 'bypass') return;                                  // the browser handles it; nothing is cached
    if (how === 'network-first'){
      const key = swPageKey(req.url);
      event.respondWith(fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic'){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(key, copy)).catch(() => {}); }
        return res;
      }).catch(() => caches.match(key).then(hit => hit || caches.match('/')).then(hit => hit || new Response('<h1>Offline</h1><p>HireWire needs one online visit before it works offline.</p>', { status:503, headers:{ 'Content-Type':'text/html; charset=utf-8' } }))));
      return;
    }
    event.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res && res.ok && res.type === 'basic') c.put(req, res.clone()).catch(() => {}); return res; }).catch(() => hit);
      return hit || net;
    })));
  });
  function readPlan(){
    return new Promise(resolve => {
      let req;
      try { req = indexedDB.open('hirewire-kv', 1); } catch(e){ return resolve(null); }
      req.onupgradeneeded = () => { try { req.result.createObjectStore('kv'); } catch(e){} };
      req.onerror = () => resolve(null);
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction('kv', 'readwrite'), st = tx.objectStore('kv');
          const g = st.get('hirewire.notifyplan.v1'), s = st.get('hirewire.swnotified');
          tx.oncomplete = () => {
            let plan = null; try { plan = g.result ? JSON.parse(g.result) : null; } catch(e){}
            if (plan && typeof s.result === 'string' && s.result > (plan.last || '')) plan.last = s.result;
            resolve({ db:db, plan:plan });
          };
          tx.onerror = () => resolve(null);
        } catch(e){ resolve(null); }
      };
    });
  }
  async function dailyCheck(){
    const r = await readPlan();
    if (!r || !r.plan) return;
    const now = Date.now(), today = isoDay(now);
    const n = swDueCount(r.plan, now, today);
    if (!n) return;
    await self.registration.showNotification('HireWire — ' + n + ' follow-up' + (n > 1 ? 's' : '') + ' due',
      { body:'A two-line nudge keeps you on their radar. Open HireWire to draft them.', tag:'hirewire-followups', icon:'/icons/icon-192.png', badge:'/icons/icon-192.png' });
    try { r.db.transaction('kv', 'readwrite').objectStore('kv').put(today, 'hirewire.swnotified'); } catch(e){}
  }
  self.addEventListener('periodicsync', event => { if (event.tag === 'hw-daily') event.waitUntil(dailyCheck()); });
  self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      for (const c of list){ if (new URL(c.url).origin === self.location.origin && 'focus' in c) return c.focus(); }
      return self.clients.openWindow('/');
    }));
  });
}
