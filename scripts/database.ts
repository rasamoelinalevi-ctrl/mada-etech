import { readFile } from 'node:fs/promises';
import { db } from '../src/server/db';
import { initialProducts, initialSettings } from '../src/lib/data';
import { passwordHash,randomUUID } from '../src/server/auth';
const sql=await readFile('src/server/schema.sql','utf8');
await db().transaction(async tx=>{for(const statement of sql.split(';').filter(s=>s.trim()))await tx.query(statement);});
if(process.argv.includes('--seed')){
 await db().transaction(async tx=>{for(const p of initialProducts)await tx.query('INSERT INTO products(id,sku,data,stock) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',[p.id,p.id,JSON.stringify({...p,sku:p.id,group:''}),p.stock]);await tx.query('INSERT INTO settings(id,data) VALUES(1,$1) ON CONFLICT DO NOTHING',[JSON.stringify({...initialSettings,taxBps:0,taxLabel:'Fiscalité à configurer',commerceReady:false,zones:[{city:'Antananarivo',fee:15000}],legalText:'',returnsText:''})]);});
}
if(process.argv.includes('--admin')){const email=process.env.ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.ADMIN_PASSWORD;if(!email||!password||password.length<16)throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD (16 caractères minimum) requis dans l’environnement');await db().query("INSERT INTO users(id,email,name,password_hash,role) VALUES($1,$2,'Administrateur',$3,'admin') ON CONFLICT(email) DO NOTHING",[randomUUID(),email,passwordHash(password)]);}
console.log('Base initialisée. Les données existantes sont conservées.');
if(process.argv.includes('--admin'))await db().query("UPDATE users SET email_verified=true WHERE email=$1 AND role='admin'",[process.env.ADMIN_EMAIL?.trim().toLowerCase()]);
await db().close();
process.exit(0);
