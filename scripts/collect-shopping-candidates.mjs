import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {discoverLinks,publicText,fetchApproved} from './shopping/discovery.mjs';
const root=new URL('../',import.meta.url);
const config=JSON.parse(await readFile(new URL('data/deals/shopping-discovery.json',root),'utf8'));
const target=new URL('scratch/shopping-candidates.json',root);let previous={sources:[]};
try{previous=JSON.parse(await readFile(target,'utf8'));}catch{}
const results=[];
// One approved page per source. New detailed notices remain candidates until separately reviewed.
for(const source of config.entries.filter(s=>s.enabled)){
 const row={id:source.id,name:source.name,entryUrl:source.url,fetchedAt:new Date().toISOString()};
 try{const {html,url}=await fetchApproved(source);const text=publicText(html),fingerprint=createHash('sha256').update(text).digest('hex');
  Object.assign(row,{status:'fetched',url,contentFingerprint:fingerprint,changed:previous.sources.find(s=>s.id===source.id)?.contentFingerprint!==fingerprint,candidates:discoverLinks(html,source),requiresDetailReview:true,note:'본문 응답·변경 감지는 사실 검증이 아닙니다. 링크 미추출은 세일 없음이 아닙니다.'});
 }catch(error){Object.assign(row,{status:'failed',error:error.message,candidates:[],note:'기존 검토 데이터·확인일을 보존합니다. 접근 제한을 우회하지 않습니다.'});}
 results.push(row);console.log(source.id+': '+row.status+'; '+row.candidates.length+' pending links');
}
await mkdir(new URL('scratch/',root),{recursive:true});
await writeFile(target,JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),publicationPolicy:'candidate-only; no changes to canonical reviewed data or checkedAt',sources:results},null,2)+'\n');
console.log('Saved scratch/shopping-candidates.json. No reviewed data or public pages changed.');
if(results.some(r=>r.status==='failed'))process.exitCode=2;
