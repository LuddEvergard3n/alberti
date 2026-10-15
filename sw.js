const CACHE_NAME = 'alberti-v24-shell';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './js/main.js', './js/state.js', './js/router.js', './js/ui.js', './js/accessibility.js', './js/progress.js',
  './css/base.css', './css/theme.css', './css/components.css', './css/layout.css', './css/gallery.css', './css/mobile.css',
  './components/gallery-grid.js', './components/artwork-viewer.js', './components/artist-card.js', './components/museum-room.js', './components/timeline-viewer.js', './components/comparison-view.js', './components/exercise-engine.js', './components/technique-card.js',
  './data/artworks.json', './data/artists.json', './data/periods.json', './data/styles.json', './data/techniques.json', './data/lessons.json', './data/comparisons.json', './data/exercises.json', './data/modules.json', './data/media.json', './assets/icons/alberti-icon.svg'
];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('alberti-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  const refreshable = request.mode === 'navigate' || request.destination === 'script' || request.destination === 'style' || url.pathname.includes('/data/');
  const networkFirst = () => fetch(request).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  }).catch(() => caches.match(request).then(cached => cached || (request.mode === 'navigate' ? caches.match('./index.html') : new Response('', { status: 503 }))));
  event.respondWith(refreshable ? networkFirst() : caches.match(request).then(cached => cached || networkFirst()));
});
