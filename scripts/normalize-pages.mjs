import {readdir,readFile,writeFile} from 'node:fs/promises';
import {publicationCatalog} from './publication.mjs';
const {ids:publishedIds}=await publicationCatalog();
const root=new URL('../',import.meta.url);
const directories=(await readdir(new URL('tools/',root),{withFileTypes:true})).filter(e=>e.isDirectory()&&e.name!=='admin-dashboard');
let count=0;
for(const {name} of directories){
 const file=new URL('tools/'+name+'/index.html',root);let html;
 try{html=await readFile(file,'utf8');}catch(error){if(error.code==='ENOENT')continue;throw error;}
 const original=html;
 html=html.replace(/<!-- GENERATED:ARCHIVE:START -->[\s\S]*?<!-- GENERATED:ARCHIVE:END -->\s*/g,'');
 html=html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>\s*/gi,'');
 html=html.replace(/ data-publication-state="(?:archived|published)"/g,'');
 const active=publishedIds.has(name);
 html=html.replace(/<body\b/, '<body data-publication-state="'+(active?'published':'archived')+'"');
 if(!active){
  html=html.replace('</head>','<meta name="robots" content="noindex,follow">\n</head>');
  html=html.replace(/(<main\b[^>]*>)/,'$1<!-- GENERATED:ARCHIVE:START --><aside class="tool-use-notice"><strong>보관 중인 도구</strong><p>현재 주요 서비스는 가족·여행·생활정보와 직장인 계산기에 집중하고 있습니다.</p><a href="/">현재 운영 중인 정보와 계산기 보기</a></aside><!-- GENERATED:ARCHIVE:END -->');
 }
 html=html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi,'');
 html=html.replace(/<meta\b[^>]*name=["']viewport["'][^>]*>/gi,'<meta name="viewport" content="width=device-width, initial-scale=1">');
 html=html.replace(/<meta\b[^>]*name=["']keywords["'][^>]*>\s*/gi,'');
 html=html.replace(/<link\b[^>]*href=["'][^"']*assets\/css\/style\.css["'][^>]*>\s*/gi,'');
 html=html.replace(/((?:src|href)=["'])(?!https?:|\/\/)([^"'?]+\.(?:js|css))(?:\?[^"']*)?(["'])/gi,'$1$2?v=20261023_overhaul1$3');
 html=html.replace(/<script\b[^>]*src=["']https:\/\/pagead2\.googlesyndication\.com\/[\s\S]*?<\/script>\s*/gi,'');
 html=html.replace(/<script\b[^>]*src=["'][^"']*\/tracker\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
 html=html.replace(/<script\b[^>]*>\s*\(?adsbygoogle\s*=[\s\S]*?<\/script>/gi,'');
 if(!html.includes('name="google-adsense-account"'))html=html.replace('</head>','<meta name="google-adsense-account" content="ca-pub-9815778998394475">\n</head>');
 html=html.replace('</head>','<link rel="canonical" href="https://simulab.kr/tools/'+name+'/">\n</head>');
 html=html.replace(/[ \t]+$/gm,'');
 if(html!==original)await writeFile(file,html.trimEnd()+'\n');count++;
}
console.log('Normalized canonical, viewport and optional scripts: '+count+' public tools.');
