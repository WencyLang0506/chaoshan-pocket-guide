const CACHE = 'chaoshan-pocket-20261104-v1';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./travel-data.js','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('chaoshan-pocket-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const allowed = new Set(ASSETS.map(path => new URL(path,self.location.href).pathname));
  if (!allowed.has(url.pathname)) return;
  event.respondWith(fetch(event.request).then(response => { if (response.ok && !response.redirected) { const copy=response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request,copy))); } return response; }).catch(async () => (await caches.match(event.request,{ignoreSearch:true})) || caches.match('./index.html')));
});
