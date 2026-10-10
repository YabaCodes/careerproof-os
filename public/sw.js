const CACHE='careerproof-v0.1.1';
const APP_SHELL=['./','./index.html','./styles.css','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./icon-maskable.svg','./apple-touch-icon.png','./favicon-32.png','./favicon-16.png','./manifest.webmanifest','./app/app/main.js','./app/data/backup.js','./app/data/db.js','./app/domain/models.js','./app/domain/dates.js','./app/domain/taxonomy.js','./app/domain/validation.js','./app/ui/icons.js','./app/ui/dialog.js','./app/ui/actionRouting.js','./app/ui/careerHistory.js','./app/ui/experiencePortfolio.js','./app/ui/achievementIntelligence.js','./app/ui/competencyLibrary.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('careerproof-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,clone));}
    return response;
  })));
});
