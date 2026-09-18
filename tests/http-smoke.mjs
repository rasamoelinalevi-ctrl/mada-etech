import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
const results=[];
let cookie='';
async function request(path,data,auth=true,origin=base){const r=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json',Origin:origin}),...(auth&&cookie?{Cookie:cookie}:{})},body:data===undefined?undefined:JSON.stringify(data),redirect:'manual'});return r;}
async function check(name,fn){await fn();results.push({name,passed:true});console.log('OK '+name);}
await check('Catalogue en base accessible',async()=>{const r=await request('/api/store');assert.equal(r.status,200);const j=await r.json();assert.equal(j.authenticated,false);assert.ok(j.products.length>=1);assert.equal(j.orders.length,0);});
await check('Administration refuse anonyme',async()=>{assert.equal((await request('/api/admin/audit')).status,401);assert.ok([307,308].includes((await request('/admin')).status));});
await check('CSRF origine étrangère refusée',async()=>assert.equal((await request('/api/contact',{name:'Audit',email:'audit@example.com',message:'Message fictif suffisamment long'},false,'https://evil.example')).status,403));
const credentials={name:'Audit fictif',email:'audit-'+randomUUID()+'@example.com',password:'Test-'+randomUUID()};
await check('Inscription et cookie HttpOnly',async()=>{const r=await request('/api/auth/register',credentials);assert.equal(r.status,200);const set=r.headers.get('set-cookie');assert.ok(set.includes('HttpOnly'));assert.ok(set.includes('SameSite=lax'));cookie=set.split(';')[0];});
await check('Compte privé enregistré en base',async()=>{const j=await (await request('/api/store')).json();assert.equal(j.profile.email,credentials.email);assert.equal(j.admin,false);});
await check('Client ne peut modifier les produits',async()=>assert.equal((await request('/api/admin/product',{})).status,403));
await check('Checkout refuse adresse non confirmée',async()=>{const r=await request('/api/checkout',{idempotencyKey:randomUUID(),items:[{id:'airpods-max',quantity:1}],customer:'Audit fictif',email:credentials.email,phone:'+261340000000',address:'Adresse fictive',city:'Antananarivo',method:'MVola',coupon:'',acceptedTerms:true});assert.equal(r.status,403);});
await check('Commande d’un autre compte inaccessible',async()=>assert.equal((await request('/api/orders/MT-unknown/refresh',{})).status,404));
await check('Webhook non signé refusé',async()=>assert.ok([401,503].includes((await request('/api/papi/notification',{})).status)));
await check('Déconnexion invalide la session',async()=>{assert.equal((await request('/api/auth/logout',{})).status,200);assert.equal((await (await request('/api/store')).json()).authenticated,false);});
await check('Connexion retrouve le compte',async()=>{const r=await request('/api/auth/login',{email:credentials.email,password:credentials.password});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];});
await check('Données privées non mises en cache',async()=>{const r=await request('/api/store');assert.match(r.headers.get('cache-control'),/no-store/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');});
await check('Produit inconnu et sitemap',async()=>{assert.equal((await request('/produit/audit-absent')).status,404);assert.equal((await request('/sitemap.xml')).status,200);});
console.log(JSON.stringify({count:results.length,results},null,2));
