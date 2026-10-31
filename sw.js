/* Raptor Reader - service worker : page hors ligne + cache des tuiles de carte */
var APP="rr-app-v6",TILES="rr-tiles",MAXT=3000;
var SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png",
 "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
 "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"];
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(APP).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(new Request(u,{mode:u.indexOf("http")===0?"cors":"same-origin"})).catch(function(){})}))}).then(function(){return self.skipWaiting()}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==APP&&n!==TILES}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}));
});
function trim(){caches.open(TILES).then(function(c){c.keys().then(function(k){if(k.length>MAXT)for(var i=0;i<k.length-MAXT;i++)c.delete(k[i])})})}
self.addEventListener("fetch",function(e){
  var r=e.request,u=new URL(r.url);if(r.method!=="GET")return;
  if(u.hostname==="api.github.com")return;
  var tile=/tile\.openstreetmap\.org|arcgisonline\.com/.test(u.hostname);
  if(tile){ // tuiles : cache d'abord, réseau sinon
    e.respondWith(caches.open(TILES).then(function(c){return c.match(r).then(function(h){return h||fetch(r).then(function(res){if(res.ok||res.type==="opaque"){c.put(r,res.clone());trim()}return res})})}));
    return;
  }
  if(r.mode==="navigate"||u.origin===location.origin){ // page : réseau d'abord (mises à jour), cache hors ligne
    e.respondWith(fetch(r).then(function(res){var cp=res.clone();caches.open(APP).then(function(c){c.put(r,cp)});return res})
      .catch(function(){return caches.match(r).then(function(h){return h||caches.match("index.html")})}));
    return;
  }
  e.respondWith(caches.match(r).then(function(h){return h||fetch(r).then(function(res){if(res.ok){var cp=res.clone();caches.open(APP).then(function(c){c.put(r,cp)})}return res})}));
});
