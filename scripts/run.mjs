import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const name=process.argv[2];
if(!['database','worker','preflight','test'].includes(name))throw new Error('Script inconnu');
const args=['--env-file-if-exists=.env.local','--import','./scripts/register.mjs'];
if(name==='test')args.push('--test',...(await readdir('tests')).filter(f=>f.endsWith('.test.ts')).map(f=>'tests/'+f));
else args.push('scripts/'+name+'.ts',...process.argv.slice(3));
const r=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});process.exit(r.status??1);
