import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {groupPosts,draftMarkdown} from './family-info/blog.mjs';
const root=new URL('../',import.meta.url),args=Object.fromEntries(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');return i<0?[arg.slice(2),true]:[arg.slice(2,i),arg.slice(i+1)];})),day=Number(args.day);
const live=args.live===true;
if(!live&&!args['feed-file'])throw new Error('--live 또는 로컬 검토용 --feed-file=dist/feeds/family-info/latest.json을 지정하세요.');
const feed=live?await (async()=>{const response=await fetch('https://simulab.kr/feeds/family-info/latest.json',{signal:AbortSignal.timeout(20000),cache:'no-store'});if(!response.ok)throw new Error('운영 피드 접속 실패');return response.json();})():JSON.parse(await readFile(new URL(args['feed-file'],root),'utf8'));
if(feed.schemaVersion!==1||!feed.snapshotId||!Array.isArray(feed.categories)||!Array.isArray(feed.records))throw new Error('공개 피드 형식 오류');
const ledger=JSON.parse(await readFile(new URL('data/family-info/blog-history.json',root),'utf8')),queue=groupPosts(feed,{day,history:ledger.entries});
const folder=new URL('scratch/family-blog/'+queue.week+'/'+day+'/',root);await mkdir(folder,{recursive:true});
for(const post of queue.posts){const file=createHash('sha256').update(post.key).digest('hex').slice(0,20)+'.md';await writeFile(new URL(file,folder),draftMarkdown(post));post.draftFile=file;post.recordIds=post.records.map(r=>r.id);delete post.records;post.status='prepared';post.requiresOfficialRecheck=true;post.captureStatus='pending';}
await writeFile(new URL('queue.json',folder),JSON.stringify({...queue,snapshotId:feed.snapshotId,source:live?'live':'local-preview',preparedAt:new Date().toISOString()},null,2)+'\n');
console.log(JSON.stringify({source:live?'live':'local-preview',week:queue.week,day,prepared:queue.posts.length,held:queue.held.length,queue:new URL('queue.json',folder).href,published:0}));
