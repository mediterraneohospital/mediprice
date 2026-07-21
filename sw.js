var CACHE = 'mediprice-v2';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(clients.claim()); });
self.addEventListener('fetch', function(e){ e.respondWith(fetch(e.request)); });
self.addEventListener('message', function(e){
  if(e.data && e.data.action==='skipWaiting') self.skipWaiting();
});
