var C='planner-v2',F=['./','manifest.webmanifest','icon.svg'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(C).then(function(x){x.put(e.request,c)});return r}).catch(function(){return caches.match(e.request)}))});
self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(function(l){if(l.length)return l[0].focus();return clients.openWindow('./')}))});

self.addEventListener('push',function(e){var p={};try{p=e.data.json()}catch(x){}var n=p.notification||{};e.waitUntil(self.registration.showNotification(n.title||'התכנון שלי',{body:n.body||'זמן לצעד קטן? פותחים את התכנון של היום.',icon:'icon.svg',tag:'study-reminder',lang:'he',dir:'rtl'}))});
