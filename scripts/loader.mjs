import ts from 'typescript';
import {readFile} from 'node:fs/promises';
export async function resolve(specifier,context,next){try{return await next(specifier,context);}catch(e){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);if(specifier==='next/headers')return next('next/headers.js',context);throw e;}}
export async function load(url,context,next){if(url.endsWith('.ts')&&!url.includes('/node_modules/')){const source=await readFile(new URL(url),'utf8');return {format:'module',shortCircuit:true,source:ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText};}return next(url,context);}
