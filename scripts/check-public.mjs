import {readdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import '../assets/js/site-settings.js';
const {adsEnabled,adsenseClient}=globalThis.SIMULAB_SITE_SETTINGS;
const root=fileURLToPath(new URL('../dist/',import.meta.url)),files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else files.push(p);}}await walk(root);
const errors=[];let pages=0;
const {ids:publishedIds}=await (await import('./publication.mjs')).publicationCatalog();
const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8');
const ads=await readFile(path.join(root,'ads.txt'),'utf8');
if(!ads.split(/\r?\n/).includes('google.com, '+adsenseClient.slice(3)+', DIRECT, f08c47fec0942fa0'))errors.push('AdSense publisher ID does not match ads.txt');
for(const file of files.filter(p=>p.endsWith('.html'))){
 const relative=path.relative(root,file).replaceAll('\\','/'),html=await readFile(file,'utf8');pages++;
 if(relative.startsWith('tools/')&&!relative.startsWith('tools/admin-dashboard/')){
  const id=relative.split('/')[1],active=publishedIds.has(id);
  if(active===/name="robots" content="noindex,follow"/.test(html))errors.push(relative+': publication index mismatch');
  if(active!==sitemap.includes('https://simulab.kr/tools/'+id+'/</loc>'))errors.push(relative+': sitemap publication mismatch');
  if((html.match(/<h1\b/gi)||[]).length!==1)errors.push(relative+': H1 count');
  if((html.match(/rel=["']canonical["']/gi)||[]).length!==1)errors.push(relative+': canonical count');
  if(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?[",\s]/i.test(html))errors.push(relative+': zoom disabled');
  if((html.match(/id="tool-use-notice"/g)||[]).length!==1)errors.push(relative+': missing or repeated use notice');
  if((html.match(/id="legal-disclaimer"/g)||[]).length!==1||!html.includes('data-notice-version="1"'))errors.push(relative+': missing static disclaimer');
  if(/data-ad-state="pending"|광고 게재 준비 중/.test(html))errors.push(relative+': empty ad placeholder');
 }
 if(relative.startsWith('guides/')){
  if((html.match(/<h1\b/gi)||[]).length!==1)errors.push(relative+': guide H1 count');
  if((html.match(/rel=["']canonical["']/gi)||[]).length!==1)errors.push(relative+': guide canonical count');
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  if(!canonical||!sitemap.includes(canonical+'</loc>'))errors.push(relative+': guide missing from sitemap');
  if(/noindex|광고 게재 준비 중/.test(html))errors.push(relative+': guide unexpectedly hidden or empty ad');
 }
 if(/data-ad-slot=["']auto["']/.test(html))errors.push(relative+': dummy ad unit ID');
 const adScripts=html.match(/<script\b[^>]*src=["']https:\/\/pagead2[^"']*/gi)||[];
 const adPage=/^(?:index\.html|events\/[^/]+\/index\.html)$/.test(relative);
 if(adScripts.length&&(adsEnabled!==true||!adPage||adScripts.length!==1||!adScripts[0].endsWith('?client='+adsenseClient)))errors.push(relative+': unexpected automatic ad script');
 if(relative==='index.html'&&adsEnabled===true&&adScripts.length!==1)errors.push('AdSense script missing from home');
 for(const [,raw] of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)){
  if(raw.startsWith('#')||/^(mailto:|tel:|data:|javascript:)/.test(raw))continue;
  const url=new URL(raw.replaceAll('&amp;','&'),'https://simulab.kr/'+relative);
  if(url.host!=='simulab.kr')continue;
  let target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(url.pathname.endsWith('/'))target=path.join(target,'index.html');
  else if(!path.extname(target))target+='.html';
  try{const s=await stat(target);if(!s.isFile())throw new Error();}catch{errors.push(relative+': missing '+raw);}
 }
}
const withdrawn=await readFile(path.join(root,'tools/game-tetris/index.html'),'utf8');
if(!/name="robots" content="noindex,follow"/.test(withdrawn)||/<canvas\b|src=["']\.\/app\.js/i.test(withdrawn))errors.push('Withdrawn block game still executable or indexable');
if(files.some(p=>/tools[\\/]game-tetris[\\/](?:app|logic)\.js$/.test(p)))errors.push('Withdrawn game scripts in public output');
if(files.some(p=>/\.(?:md|sql|mjs)$/.test(p)))errors.push('Internal development file in public output');
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exit(1);}
console.log('Public output checked: '+pages+' HTML files, local asset links, canonical, zoom and internal-file exclusion.');
