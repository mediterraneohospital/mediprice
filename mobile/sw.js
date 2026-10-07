self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(event){event.waitUntil(self.clients.claim());});
// Always use the network; never cache private catalog or authentication data.
self.addEventListener('fetch',function(event){event.respondWith(fetch(event.request));});
