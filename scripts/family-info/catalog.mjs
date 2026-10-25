import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateSchedule,validateRecord,validDateTime,sameOfficialHost,filterRecords,datePart} from '../../tools/family-info-calendar/model.js';
import {validateEvent as validateFestival} from '../../tools/kids-outing-calendar/model.js';
import {isCalendarEligible,validateEvent as validateDeal} from '../../tools/parenting-deals/model.js';
const root=new URL('../../',import.meta.url);
export const readJson=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function loadCatalog({now=new Date()}={}){
 const [schedule,registry,reviewed,state,events,deals,brands]=await Promise.all(['data/family-info/schedule.json','data/family-info/sources.json','data/family-info/reviewed.json','data/family-info/state.json','data/events/reviewed.json','data/deals/reviewed.json','data/deals/sources.json'].map(readJson));
 const errors=validateSchedule(schedule),categories=schedule.categories,providers=registry.providers;
 if(new Set(providers.map(p=>p.id)).size!==providers.length)errors.push('공급자 ID 중복');
 for(const p of providers)if(!p.id||!p.name||!p.hosts?.length||!sameOfficialHost(p.url,p.hosts)||!p.categoryIds?.length||p.categoryIds.some(id=>!categories.some(c=>c.id===id)))errors.push('공급자 등록 오류: '+p.id);
 if(new Set(reviewed.records.map(r=>r.id)).size!==reviewed.records.length)errors.push('공개 레코드 ID 중복');
 for(const r of reviewed.records){const issues=validateRecord(r,{categories,providers,now});if(r.publicationStatus!=='verified')issues.push('공개 원본에는 검증 완료 항목만 보관');if(issues.length)errors.push(r.id+': '+issues.join(', '));}
 if(errors.length)throw new Error(errors.join('\n'));
 const records=reviewed.records.map(r=>({...r}));
 for(const event of events){
  const issues=validateFestival(event,{today:datePart(now.toISOString())});if(issues.length)throw new Error(event.id+': '+issues.join(', '));
  records.push({id:'festival-'+event.id,categoryIds:['festivals'],title:event.title,providerId:'legacy-festivals',canonicalUrl:event.sources[0].url,region:event.region,location:event.location,audience:event.familyNote||'연령·보호자 동반 조건은 공식 안내 확인',ageGroups:[],applicationStart:null,applicationEnd:null,eventStart:event.startDate,eventEnd:event.endDate,operatingDates:event.dates||null,scheduleNote:event.scheduleNote||'개별 운영 회차·시간은 공식 안내 확인',feeStatus:event.feeStatus,feeText:event.fee,summary:event.program||event.title,conditions:[event.booking||'예약 조건은 공식 안내 확인',event.time||'운영 시간은 공식 안내 확인',event.familyNote].filter(Boolean),publicationStatus:'verified',lifecycleStatus:event.publicationStatus==='cancelled'?'cancelled':null,verifiedAt:event.checkedAt,evidence:event.sources.map(s=>({url:s.url,publisher:s.publisher,summary:s.facts,verifiedAt:s.checkedAt,fields:['title','eventStart','eventEnd']})),siteUrl:'/tools/kids-outing-calendar/#event-'+event.id,legacyId:event.id});
 }
 for(const event of deals.events.filter(isCalendarEligible)){
  const issues=validateDeal(event,brands.sources,now);if(issues.length)throw new Error(event.id+': '+issues.join(', '));const brand=brands.sources.find(b=>b.id===event.brandId);
  const start=event.startTime?event.startDate+'T'+event.startTime+':00+09:00':event.startDate;
  // Legacy minute-inclusive deadlines remain inclusive for their entire minute.
  const end=event.endTime?event.endDate+'T'+event.endTime+':00+09:00':event.endDate;
  records.push({id:'sale-'+event.id,categoryIds:['brand-sales'],title:brand.name+' · '+event.title,providerId:'legacy-brand-'+brand.id,canonicalUrl:event.sourceUrl,region:'전국',location:event.channels.includes('store')?'온라인·매장별 조건 확인':'온라인',audience:'대상 품목·회원 조건 확인',ageGroups:[],applicationStart:null,applicationEnd:null,eventStart:start,eventEnd:end,endExclusive:Boolean(event.endTimeExclusive),endInclusiveMinute:Boolean(event.endTime&&!event.endTimeExclusive),scheduleNote:event.periodNote,feeStatus:'unknown',feeText:'품목별 가격과 할인 조건 확인',summary:event.summary,conditions:event.conditions,publicationStatus:'verified',lifecycleStatus:event.publicationStatus==='cancelled'?'cancelled':null,verifiedAt:event.checkedAt,evidence:[{url:event.periodSourceUrl||event.sourceUrl,publisher:brand.name,summary:event.periodNote,verifiedAt:event.checkedAt,fields:['title','eventStart','eventEnd','conditions']}],sectorIds:event.categories,siteUrl:'/tools/parenting-deals/#sale-'+event.id,legacyId:event.id});
 }
 const publicKeys=['id','categoryIds','title','providerId','canonicalUrl','region','district','location','address','audience','ageGroups','applicationStart','applicationEnd','eventStart','eventEnd','bookingStart','operatingDates','scheduleNote','endExclusive','endInclusiveMinute','feeStatus','feeText','summary','conditions','publicationStatus','lifecycleStatus','verifiedAt','fetchedAt','changedAt','publishedAt','evidence','sectorIds','legacyId'];
 const publicRecords=records.map(r=>{const item=Object.fromEntries(publicKeys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));item.evidence=(r.evidence||[]).map(f=>({url:f.url,publisher:f.publisher,summary:f.summary,verifiedAt:f.verifiedAt,fields:f.fields}));const content=Object.fromEntries(Object.entries(item).filter(([key])=>!['verifiedAt','fetchedAt','changedAt','publishedAt','evidence'].includes(key)));content.evidence=item.evidence.map(({verifiedAt,...fact})=>fact);item.contentHash=hash(content);item.siteUrl=r.siteUrl||'/tools/'+r.categoryIds[0]+'/#'+r.id;return item;});
 const categoryMetadata=categories.map(c=>{
  const rows=publicRecords.filter(r=>r.categoryIds.includes(c.id)),saved=state.categories[c.id]||{},times=rows.map(r=>r.verifiedAt).filter(validDateTime).sort((a,b)=>new Date(b)-new Date(a));
  return {...c,categoryRevision:hash(rows.map(r=>({id:r.id,contentHash:r.contentHash}))).slice(0,16),lastVerifiedAt:times[0]||null,lastCollectedAt:saved.lastCollectedAt||null,lastDeployedAt:saved.lastDeployedAt||null,outcome:saved.outcome||(rows.length?'existing-reviewed':'not-run'),verifiedCount:rows.length,currentCount:filterRecords(rows,{},now).length,failures:(saved.providers||[]).filter(p=>p.status==='failed').map(p=>({providerId:p.providerId,status:'failed'}))};
 });
 const publicProviders=providers.map(p=>({id:p.id,name:p.name,url:p.url,categoryIds:p.categoryIds,regions:p.regions,lastSuccessAt:p.lastSuccessAt||null}));
 // Runtime date/count changes do not constitute a new content snapshot.
 const snapshotId=hash({schemaVersion:1,categories:categoryMetadata.map(({currentCount,...metadata})=>metadata),records:publicRecords,providers:publicProviders}).slice(0,24);
 return {schemaVersion:1,snapshotId,timezone:schedule.timezone,categories:categoryMetadata,providers:publicProviders,records:publicRecords};
}
