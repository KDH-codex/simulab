// Editorial import: prints only status and counts; never outputs any debate text or image content.
import {readFile,mkdir,copyFile,realpath,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const topic='002_생일-일주일-전-애인의-바람',match='M001__gpt-6.1-terra__high-vs-gemini-3.8-flash__high';
const folder=owner=>new URL(`Discussion/${owner}/topics/${topic}/matches/${match}/`,root);
const fileFor=n=>new URL(n===1?'T1.md':n===2?'T2.md':`T${n}-text-only.md`,folder(n%2?'codex':'gemini'));
const turns=[];
for(let n=1;n<=8;n++){
 let bytes;try{bytes=await readFile(fileFor(n));}catch(error){if(n===8&&error.code==='ENOENT'){turns.push({id:'T8',model:'Gemini',kind:'closing',status:'pending'});continue;}throw error;}
 const text=bytes.toString('utf8').replace(/\r\n/g,'\n');
 if(!/^상태:\s*FINAL\s*$/m.test(text)||!/^기록 리비전:\s*1\s*$/m.test(text))throw Error(`T${n} is not FINAL revision 1`);
 const original=text.match(/^본문:\n([\s\S]*?)\n\n본문 글자 수:/m)?.[1];if(!original)throw Error(`T${n} body not found`);
 const bold=[...original.matchAll(/\*\*([\s\S]*?)\*\*/g)].map(m=>m[1]);const body=original.replaceAll('**','');
 if(body.length>(n>6?100:1000))throw Error(`T${n} exceeds limit`);
 turns.push({id:`T${n}`,model:n%2?'GPT':'Gemini',version:n%2?'6.1 Terra':'3.8 Flash',effort:'High',stance:n%2?'바로 헤어진다':'선물 받고 헤어진다',kind:n>6?'closing':'debate',status:'FINAL',body,characters:body.length,bold,revision:1,sourceHash:createHash('sha256').update(bytes).digest('hex'),image:n%2&&n>=3?`/assets/debates/002/T${n}.png`:null});
}
await mkdir(new URL('assets/debates/002/',root),{recursive:true});
for(const n of [3,5,7])await copyFile(new URL(`T${n}-summary.png`,folder('codex')),new URL(`assets/debates/002/T${n}.png`,root));
// An operator-supplied publication manifest can copy images opaquely. Never log
// source paths, image text, captions or image bytes to the model or terminal.
let visualManifest=null;
try{visualManifest=JSON.parse(await readFile(new URL('PUBLICATION_IMAGES.json',folder('codex')),'utf8'));}catch(error){if(error.code!=='ENOENT')throw Error('Invalid publication manifest');}
let publishedImages=0;
if(visualManifest){
 const authorDir=await realpath(fileURLToPath(folder('gemini')));
 for(const id of ['T4','T6','T8']){
  const file=visualManifest[id];if(file==null)continue;
  if(typeof file!=='string'||path.basename(file)!==file||!/^[-\w.]+\.(png|jpg|jpeg|webp)$/i.test(file))throw Error('Invalid publication image entry');
  const source=await realpath(path.join(authorDir,file));if(path.dirname(source)!==authorDir)throw Error('Publication image must remain in author directory');
  const extension=path.extname(source).toLowerCase(),destination=new URL(`assets/debates/002/${id}${extension}`,root);
  await copyFile(source,destination);turns[Number(id.slice(1))-1].image=`/assets/debates/002/${id}${extension}`;publishedImages++;
 }
}
await copyFile(new URL('.codex-remote-attachments/01a1802d-77fb-76f1-a8a2-f2a3fd0f4d47/96b73e72-edb8-447d-9f90-74a74ecca61e/1-1000023956.jpg',root),new URL('assets/debates/002/reference.jpg',root));
const episode={id:'002-m001',slug:'002',title:'생일 일주일 전, 애인의 바람을 알았다면?',question:'내 생일 일주일 전! 애인이 바람 피운 걸 알았다면?',date:'2026-10-28',turns};
await mkdir(new URL('data/debates/',root),{recursive:true});await writeFile(new URL('data/debates/002-m001.json',root),JSON.stringify(episode,null,2)+'\n');
console.log(`Imported 002-m001: ${turns.filter(t=>t.status==='FINAL').length} FINAL turns; T8 ${turns[7].status}; ${publishedImages}/3 Gemini images prepared. No debate or image contents displayed.`);
