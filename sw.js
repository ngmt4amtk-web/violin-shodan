const CACHE='violin-shodan-v1-20261018-sound-7';
const FILES=['./','./index.html','./style.css','./app.mjs','./content.mjs','./repertoire.mjs','./intonation.mjs','./settings.mjs','./engine.mjs','./score.mjs','./glyphs.mjs','./Bravura-OFL.txt','./assets/pattern-12.svg','./assets/pattern-23.svg','./assets/pattern-34.svg','./assets/icon.svg','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('violin-shodan-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.open(CACHE).then(c=>c.match(e.request))));});
