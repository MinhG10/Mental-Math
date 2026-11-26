const scope = self.registration.scope;
const prefix = `mental-math:${scope}:`;
const cacheName = prefix + 'v1.0.0';
const shell = [
  './index.html', './manifest.json',
  './assets/icons/icon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/apple-touch-icon.png',
  './css/style.css', './css/components.css', './css/responsive.css',
  './js/app.js', './js/config.js',
  './js/core/practice-engine.js', './js/core/question-engine.js', './js/core/expression-evaluator.js',
  './js/core/answer-validator.js', './js/core/session-manager.js', './js/core/timer.js', './js/core/level-registry.js',
  './js/levels/index.js', './js/levels/level-helpers.js', './js/levels/level-1.js', './js/levels/level-1-1.js',
  './js/levels/level-2.js', './js/levels/level-3.js', './js/levels/level-3-1.js',
  './js/services/storage-service.js', './js/services/statistics-service.js',
  './js/ui/dom.js', './js/ui/metrics-ui.js', './js/ui/practice-ui.js', './js/ui/settings-ui.js',
  './js/ui/history-ui.js', './js/ui/statistics-ui.js', './js/ui/chart-ui.js',
  './js/utils/math-utils.js', './js/utils/random-utils.js', './js/utils/format-utils.js', './js/utils/validation-utils.js',
];
const urls = new Set(shell.map(path => new URL(path, scope).href));
const index = new URL('./index.html', scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll([...urls].map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(prefix) && name !== cacheName).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  url.search = '';
  const navigation = request.mode === 'navigate' && (url.href === scope || url.href === index);
  if (!navigation && !urls.has(url.href)) return;
  // Keep the app shell and its ES modules on the same release, including offline.
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return (await cache.match(navigation ? index : url.href)) ?? fetch(request);
  })());
});
