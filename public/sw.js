const CACHE_NAME = 'bdu-portal-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/api.js',
  '/js/dashboard.js',
  '/js/results.js',
  '/js/placement.js',
  '/js/profile.js',
  '/pages/dashboard.html',
  '/pages/results.html',
  '/pages/placement.html',
  '/pages/profile.html',
  '/pages/grade-report.html',
  '/images/logo.jpg',
  '/images/banner.jpeg',
  '/images/stamp.jpg',
  '/images/Signature.png',
  '/images/ethiopian_emblem.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match('/index.html');
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});
