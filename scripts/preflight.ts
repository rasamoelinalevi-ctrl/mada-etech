import {db} from '../src/server/db';
import {settings,catalog} from '../src/server/commerce';
const failures:string[]=[];
const required=['DATABASE_URL','APP_URL','PAPI_API_KEY','PAPI_WEBHOOK_SECRET','SMTP_HOST','MAIL_FROM'];for(const key of required)if(!process.env[key])failures.push(key+' manquant');
if(!process.env.APP_URL?.startsWith('https://'))failures.push('APP_URL doit être HTTPS');
if(process.env.PAPI_TEST_MODE!=='false')failures.push('Papi en mode test');
try{const cfg=await settings();if(!cfg.commerceReady)failures.push('Boutique non ouverte dans les paramètres');if((cfg.legalText||'').length<100)failures.push('Conditions commerciales incomplètes');if(!(await catalog()).length)failures.push('Catalogue vide');const admins=await db().query("SELECT id FROM users WHERE role='admin'");if(!admins.rows.length)failures.push('Aucun administrateur provisionné');}catch{failures.push('Base inaccessible ou migrations manquantes');}
for(const issue of failures)console.error('À CONFIGURER : '+issue);
console.log(failures.length?'Préparation incomplète. Ne pas ouvrir les ventes.':'Configuration détectée. Effectuer aussi les tests marchands et de restauration décrits dans DEPLOIEMENT.md.');
process.exit(failures.length?1:0);
