import {readdir,readFile,writeFile,cp,mkdir,rm,lstat,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const script of ['build-event-data.mjs','build-home.mjs','build-legal.mjs','normalize-pages.mjs','build-kids-calendar.mjs']) {
 const result=spawnSync(process.execPath,[path.join(root,'scripts',script)],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
const destination=path.resolve(root,'dist');
// The only removable tree is exactly this workspace's dist directory.
if(path.relative(root,destination)!=='dist')throw new Error('Unsafe output path');
try{if((await lstat(destination)).isSymbolicLink())throw new Error('Refusing symlink output');await rm(destination,{recursive:true});}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(destination,{recursive:true});
const publicRoots=['assets','tools','legal','admin'];
for(const folder of publicRoots)await cp(path.join(root,folder),path.join(destination,folder),{recursive:true,filter:source=>!/(?:^|[\\/])(?:node_modules|\.git|scratch)(?:[\\/]|$)|\.backup\.|\.map$/i.test(source)});
for(const file of await readdir(root))if(/^(index\.html|favicon\.svg|manifest\.json|ads\.txt|robots\.txt|naver[a-f0-9]+\.html|_headers|_redirects)$/.test(file))await cp(path.join(root,file),path.join(destination,file));
const pages=['index.html'];
for(const entry of await readdir(path.join(root,'tools'),{withFileTypes:true}))if(entry.isDirectory()&&entry.name!=='admin-dashboard'){
 try{await stat(path.join(root,'tools',entry.name,'index.html'));pages.push('tools/'+entry.name+'/index.html');}catch{}
}
for(const file of await readdir(path.join(root,'legal')))if(file.endsWith('.html'))pages.push('legal/'+file);
const urls=await Promise.all(pages.map(async file=>{
 const location=file==='index.html'?'':file.startsWith('tools/')?file.replace(/index\.html$/,''):file;
 const modified=(await stat(path.join(root,file))).mtime.toISOString().slice(0,10);
 return '<url><loc>https://simulab.kr/'+location+'</loc><lastmod>'+modified+'</lastmod></url>';
}));
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
console.log('Built dist: '+files.length+' public files; '+pages.length+' sitemap URLs; revision '+revision+'. Internal reports and SQL excluded.');
