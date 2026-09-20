// Network-only: never cache customer records, auth pages, provider data or private files.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Renoxis — Offline</title><body style="font:18px Arial;background:#f3f7f3;color:#075e4b;padding:50px"><h1>You’re offline.</h1><p>Reconnect to open your private Renoxis workspace.</p><a href="/">Try again</a></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}})));});
