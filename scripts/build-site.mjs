import {readdir,readFile,cp,mkdir,rm,lstat,stat} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {publicationCatalog} from './publication.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const maintenanceSchedule=JSON.parse(await readFile(path.join(root,'data/family-info/schedule.json'),'utf8'));
const festivalOnly=maintenanceSchedule.maintenanceMode?.activeSiteCategories?.length===1&&maintenanceSchedule.maintenanceMode.activeSiteCategories[0]==='festivals';
const siteScripts=festivalOnly?['build-event-data.mjs','build-family-info.mjs','build-home.mjs','build-calendar-page.mjs','build-map-page.mjs','build-curation-page.mjs','build-festa-details.mjs','build-legal.mjs','build-kids-calendar.mjs','build-publishing-ui.mjs']:['build-focused-tools.mjs','build-event-data.mjs','build-parenting-deals.mjs','build-family-info.mjs','build-weekday-guides.mjs','build-family-guides.mjs','build-editorial-guides.mjs','build-library.mjs','build-debate-pages.mjs','build-debate-002.mjs','build-home.mjs','build-calendar-page.mjs','build-map-page.mjs','build-curation-page.mjs','build-festa-details.mjs','build-legal.mjs','build-core-guides.mjs','normalize-pages.mjs','build-kids-calendar.mjs','build-publishing-ui.mjs'];
for(const script of siteScripts) {
 const result=spawnSync(process.execPath,[path.join(root,'scripts',script)],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
if(!festivalOnly){const result=spawnSync(process.execPath,[path.join(root,'scripts','build-debate-sharing.mjs')],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
if(!festivalOnly){const result=spawnSync(process.execPath,[path.join(root,'scripts','debate-characters.mjs')],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
const destination=path.resolve(root,'dist');
// The only removable tree is exactly this workspace's dist directory.
if(path.relative(root,destination)!=='dist')throw new Error('Unsafe output path');
try{if((await lstat(destination)).isSymbolicLink())throw new Error('Refusing symlink output');await rm(destination,{recursive:true});}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(destination,{recursive:true});
const publicRoots=['assets','tools','guides','legal','admin','debates','library','events','calendar','map','curation'];
for(const folder of publicRoots)await cp(path.join(root,folder),path.join(destination,folder),{recursive:true,filter:source=>!/(?:^|[\\/])(?:node_modules|\.git|scratch)(?:[\\/]|$)|\.backup\.|\.map$/i.test(source)&&!/[\\/]tools[\\/]game-tetris[\\/](?:app|logic)\.js$/i.test(source)});
// Only explicitly generated public feeds are admitted. Internal data remains private.
const familySchedule=JSON.parse(await readFile(path.join(root,'data/family-info/schedule.json'),'utf8'));
await mkdir(path.join(destination,'feeds/family-info'),{recursive:true});
for(const id of ['latest',...familySchedule.categories.map(c=>c.id)])await cp(path.join(root,'feeds/family-info',id+'.json'),path.join(destination,'feeds/family-info',id+'.json'));
for(const file of await readdir(root))if(/^(index\.html|favicon\.(?:svg|ico)|manifest\.json|sw\.js|ads\.txt|robots\.txt|naver[a-f0-9]+\.html|_headers|_redirects)$/.test(file))await cp(path.join(root,file),path.join(destination,file));
const pages=['index.html','calendar/index.html','map/index.html','curation/index.html','library/index.html','debates/001/index.html','debates/002/index.html','debates/arena/index.html'];
for(const entry of await readdir(path.join(root,'events'),{withFileTypes:true}))if(entry.isDirectory()){await stat(path.join(root,'events',entry.name,'index.html'));pages.push('events/'+entry.name+'/index.html')}
try{for(const entry of await readdir(path.join(root,'debates','generated'),{withFileTypes:true}))if(entry.isDirectory()&&/^\d{3}-m\d{3}$/.test(entry.name)){await stat(path.join(root,'debates','generated',entry.name,'index.html'));pages.push(`debates/generated/${entry.name}/index.html`)}}catch(error){if(error.code!=='ENOENT')throw error}
const {ids:publishedIds}=await publicationCatalog();
for(const entry of await readdir(path.join(root,'tools'),{withFileTypes:true}))if(entry.isDirectory()&&publishedIds.has(entry.name)){
 try{await stat(path.join(root,'tools',entry.name,'index.html'));pages.push('tools/'+entry.name+'/index.html');}catch{}
}
const {editorialGuides}=await import('../data/guides/catalog.mjs'),{familyGuides}=await import('../data/family-guides.mjs');
pages.push('guides/index.html',...[...editorialGuides,...familyGuides].map(g=>'guides/'+g.slug+'/index.html'));
for(const file of await readdir(path.join(root,'legal')))if(file.endsWith('.html'))pages.push('legal/'+file);
const urls=(await Promise.all(pages.map(async file=>{
 const html=await readFile(path.join(destination,file),'utf8');
 if(/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(html))return null;
 // Match Cloudflare's default HTML routing. Build time is not the content modification date.
 const location=path.posix.basename(file)==='index.html'?file.slice(0,-10):file.replace(/\.html$/,'');
 const canonical='https://simulab.kr/'+location;
 if(!html.includes('rel="canonical" href="'+canonical+'"'))throw new Error('Sitemap canonical mismatch: '+file);
 return '<url><loc>'+canonical+'</loc></url>';
}))).filter(Boolean);
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.join('\n')+'\n</urlset>\n';
await writeFile(path.join(root,'sitemap.xml'),sitemap);await writeFile(path.join(destination,'sitemap.xml'),sitemap);
const files=[];async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())await walk(file);else files.push(file);}}await walk(destination);
if(files.some(file=>/\.(?:md|sql|mjs|txt)$/i.test(file)&&!/(?:robots|ads)\.txt$/.test(file)))throw new Error('Internal file in output');
const digest=createHash('sha256');
digest.update(await readFile(fileURLToPath(import.meta.url)));
for(const file of [...files].sort()) { digest.update(path.relative(destination,file).replaceAll('\\','/'));digest.update(await readFile(file)); }
const revision=digest.digest('hex').slice(0,12);
for(const file of files.filter(file=>/\.(?:html|js|css)$/.test(file))) {
 const original=await readFile(file,'utf8');
 let versioned=original.replace(/\?v=20261023(?:_overhaul1|_verified1)?/g,'?v='+revision);
 versioned=versioned.replace(/((?:src|href)=["'])(?!https?:|\/\/)([^"'?#]+\.(?:js|css))(["'])/g,(_,prefix,asset,quote)=>prefix+asset+'?v='+revision+quote);
 versioned=versioned.replace(/(\b(?:from|import)\s*["'])(\.{1,2}\/[^"'?#]+\.js)(["'])/g,(_,prefix,asset,quote)=>prefix+asset+'?v='+revision+quote);
 if(versioned!==original)await writeFile(file,versioned);
}
const manifest=files.map(file=>path.relative(destination,file).replaceAll('\\','/'));
await mkdir(path.join(root,'scratch'),{recursive:true});await writeFile(path.join(root,'scratch','build-manifest.json'),JSON.stringify(manifest,null,2));
console.log('Built dist: '+files.length+' public files; '+urls.length+' sitemap URLs; revision '+revision+'. Internal reports and SQL excluded.');
