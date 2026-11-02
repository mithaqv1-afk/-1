/* محرر الكتب الرسمية - عمل بدون إنترنت */
const V='letters-20261101-1945';
const FONT_CSS='https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap';
const EXTRA=['./','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','favicon-32.png'];
self.addEventListener('install',e=>{
 e.waitUntil((async()=>{
  const c=await caches.open(V);
  await c.add('index.html');                                   // الأساسي: إذا فشل يُعاد التثبيت لاحقاً
  await Promise.all(EXTRA.map(u=>c.add(u).catch(()=>{})));      // غياب أي أيقونة لا يمنع العمل
  try{
   const r=await fetch(FONT_CSS,{mode:'cors'});
   if(r.ok){
    const t=await r.clone().text();
    await c.put(FONT_CSS,r);
    const urls=[...new Set([...t.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]))];
    await Promise.all(urls.map(u=>fetch(u,{mode:'cors'}).then(x=>x.ok&&c.put(u,x)).catch(()=>{})));
   }
  }catch(err){}
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 const r=e.request; if(r.method!=='GET')return;
 const u=new URL(r.url);
 if(r.mode==='navigate'&&u.origin===location.origin){
  e.respondWith(caches.match('index.html').then(m=>{
   const net=fetch(r).then(res=>{if(res.ok)caches.open(V).then(c=>c.put('index.html',res.clone()));return res}).catch(()=>null);
   return m||net.then(x=>x||new Response('offline',{status:503}));
  }));
  return;
 }
 if(u.origin===location.origin||/(^|\.)(googleapis|gstatic)\.com$/.test(u.hostname)){
  e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>{
   const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>m);
   return m||net;
  })));
 }
});
