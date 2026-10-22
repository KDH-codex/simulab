// Preview the built public output. All Supabase traffic is routed to a local rejection endpoint.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.argv.find(arg=>arg.startsWith('--port='))?.split('=')[1]||4180);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid preview port');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
 if(pathname.startsWith('/__offline')){res.writeHead(503,{'Content-Type':'application/json'});res.end('{"message":"External data is disabled in local preview"}');return;}
 if(pathname==='/__mobile'){
  const target=url.searchParams.get('path')||'/';const width=Number(url.searchParams.get('width')||360);
  if(!target.startsWith('/')||target.startsWith('//')||/[<>"']/.test(target)||!Number.isInteger(width)||width<320||width>600){res.writeHead(400);res.end();return;}
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<title>SimuLab mobile preview</title><body style="margin:16px;background:#e8eee8"><iframe title="Mobile preview" style="width:'+width+'px;height:1000px;border:1px solid #cbd8ce" src="'+target+'"></iframe>');return;
 }
 const filename=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(path.relative(root,filename).startsWith('..')||path.isAbsolute(path.relative(root,filename))){res.writeHead(403);res.end();return;}
 try{let body=await readFile(filename);if(path.extname(filename)==='.html')body=body.toString().replace('<head>','<head><script>window.SIMULAB_PREVIEW=true;window.SIMULAB_SUPABASE_CONFIG={url:location.origin+"/__offline",anonKey:"preview"};</script>');
 res.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(body);
 }catch{res.writeHead(404);res.end('Not found in the public build.');}
}).listen(port,'127.0.0.1',()=>console.log('SimuLab preview http://127.0.0.1:'+port+' (external storage disabled)'));
