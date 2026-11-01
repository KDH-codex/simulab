import {readFile,writeFile,rename} from 'node:fs/promises';
const root=new URL('../',import.meta.url),args=Object.fromEntries(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');return [arg.slice(2,i),arg.slice(i+1)];}));
if(!args.key||!/^\d{4}-\d{2}-\d{2}:[a-z-]+:(region|sector|national):[^:]+:weekly$/.test(args.key))throw new Error('안정적인 주간 발행 키 필요');
if(!['prepared','publishing','published','failed','unknown','held'].includes(args.status))throw new Error('유효한 발행 상태 필요');
if(!args.snapshot||!/^[a-f0-9]{24}$/.test(args.snapshot))throw new Error('실제 공개 snapshotId 필요');
if(args.status==='published'){let url;try{url=new URL(args.url);}catch{}if(!url||url.protocol!=='https:'||url.hostname!=='blog.naver.com'||!url.pathname.startsWith('/6a_blog/'))throw new Error('6a_blog의 실제 게시 URL 필요');}
const file=new URL('data/family-info/blog-history.json',root),ledger=JSON.parse(await readFile(file,'utf8')),index=ledger.entries.findIndex(e=>e.key===args.key),previous=ledger.entries[index];
if(previous?.status==='published')throw new Error('이미 게시된 글은 재발행 이력으로 덮어쓸 수 없습니다.');
if(['publishing','unknown'].includes(previous?.status)&&!['published','unknown','held'].includes(args.status))throw new Error('게시 결과 불명 항목은 실제 게시 여부를 먼저 확인하세요.');
const entry={...previous,key:args.key,status:args.status,snapshotId:args.snapshot,categoryRevision:args.revision||previous?.categoryRevision||null,recordIds:args.records?.split(',')||previous?.recordIds||[],url:args.url||previous?.url||null,updatedAt:new Date().toISOString()};
if(args.status==='published')entry.publishedAt=entry.updatedAt;
if(index<0)ledger.entries.push(entry);else ledger.entries[index]=entry;
const temp=new URL('data/family-info/blog-history.json.tmp',root);await writeFile(temp,JSON.stringify(ledger,null,2)+'\n');await rename(temp,file);console.log(JSON.stringify({key:entry.key,status:entry.status,url:entry.url}));
