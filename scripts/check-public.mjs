import {readdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url)),files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else files.push(p);}}await walk(root);
const errors=[];let pages=0;
for(const file of files.filter(p=>p.endsWith('.html'))){
 const relative=path.relative(root,file).replaceAll('\\','/'),html=await readFile(file,'utf8');pages++;
 if(relative.startsWith('tools/')&&!relative.startsWith('tools/admin-dashboard/')){
  if((html.match(/<h1\b/gi)||[]).length!==1)errors.push(relative+': H1 count');
  if((html.match(/rel=["']canonical["']/gi)||[]).length!==1)errors.push(relative+': canonical count');
  if(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?[",\s]/i.test(html))errors.push(relative+': zoom disabled');
 }
 if(/<script\b[^>]*src=["']https:\/\/pagead2/i.test(html))errors.push(relative+': unexpected automatic ad script');
 for(const [,raw] of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)){
  if(raw.startsWith('#')||/^(mailto:|tel:|data:|javascript:)/.test(raw))continue;
  const url=new URL(raw.replaceAll('&amp;','&'),'https://simulab.kr/'+relative);
  if(url.host!=='simulab.kr')continue;
  let target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(url.pathname.endsWith('/'))target=path.join(target,'index.html');
  try{const s=await stat(target);if(!s.isFile())throw new Error();}catch{errors.push(relative+': missing '+raw);}
 }
}
if(files.some(p=>/\.(?:md|sql|mjs)$/.test(p)))errors.push('Internal development file in public output');
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exit(1);}
console.log('Public output checked: '+pages+' HTML files, local asset links, canonical, zoom and internal-file exclusion.');
