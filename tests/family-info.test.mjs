import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../scripts/family-info/catalog.mjs';
import {validateSchedule,validateRecord,filterRecords,recordState,isStaleRecord,datesForDay,renderRecord} from '../tools/family-info-calendar/model.js';
import {groupPosts,publicationKey,weekKey} from '../scripts/family-info/blog.mjs';
const root=new URL('../',import.meta.url),json=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const schedule=await json('data/family-info/schedule.json'),registry=await json('data/family-info/sources.json'),reviewed=await json('data/family-info/reviewed.json');
const now=new Date('2026-10-25T09:00:00Z'),catalogNow=new Date(),options={categories:schedule.categories,providers:registry.providers,now:catalogNow};
test('nine categories occupy distinct KST Sunday to Tuesday slots and Wednesday/Thursday queues',()=>{
 assert.deepEqual(validateSchedule(schedule),[]);const bad=structuredClone(schedule);bad.categories[1].day=bad.categories[0].day;bad.categories[1].hour=bad.categories[0].hour;assert.ok(validateSchedule(bad).length);bad.categories[1].id='missing';assert.ok(validateSchedule(bad).length);
});
test('real records require detailed official provenance for dates, audience and non-unknown fees',()=>{
 for(const r of reviewed.records)assert.deepEqual(validateRecord(r,options),[],r.id);
 const r=structuredClone(reviewed.records[0]);r.canonicalUrl='https://yeyak.seoul.go.kr.evil.test/';assert.ok(validateRecord(r,options).length);
 r.canonicalUrl=reviewed.records[0].canonicalUrl;r.evidence[0].fields=[];assert.ok(validateRecord(r,options).length);
 r.evidence=reviewed.records[0].evidence;r.applicationEnd='2026-02-30';assert.ok(validateRecord(r,options).length);
});
test('application close never becomes event end and KST precise deadlines are respected',()=>{
 const r={...reviewed.records[0],applicationEnd:'2026-10-25T18:00:00+09:00',eventEnd:'2026-10-31'};
 assert.equal(recordState(r,new Date('2026-10-25T09:00:01Z')).code,'closed');assert.equal(recordState(r,new Date('2026-10-25T09:00:01Z')).current,true);
 assert.equal(recordState({...r,eventEnd:'2026-10-25'},new Date('2026-10-25T14:59:59Z')).current,true);
 assert.equal(recordState({...r,eventEnd:'2026-10-25'},new Date('2026-10-25T15:00:00Z')).code,'ended');
});

test('official reservation closure overrides a future scheduled deadline while retaining the visit dates',()=>{
 const clock=new Date('2026-10-28T00:00:00Z'),r={...reviewed.records[0],lifecycleStatus:'closed',verifiedAt:clock.toISOString(),applicationStart:'2026-10-01',applicationEnd:'2026-10-30',eventStart:'2026-10-29',eventEnd:'2026-10-31'};
 assert.equal(recordState(r,clock).code,'closed');assert.equal(filterRecords([r],{},clock).length,1);
 assert.equal(filterRecords([r],{status:'open'},clock).length,0);assert.equal(filterRecords([r],{status:'closing'},clock).length,0);
 assert.equal(recordState(r,new Date('2026-11-01T00:00:00Z')).current,false);
 const missing={...r,evidence:r.evidence.map(e=>({...e,fields:e.fields.filter(f=>f!=='lifecycleStatus')}))};
 assert.ok(validateRecord(missing,{...options,now:clock}).includes('공개 필드의 검증 근거 누락'));
});
test('unknown fees and audience never pass free or age filters and stale entries cannot claim open applications',()=>{
 const rows=[{...reviewed.records[0],feeStatus:'unknown',ageGroups:[]}];assert.equal(filterRecords(rows,{onlyFree:true},now).length,0);assert.equal(filterRecords(rows,{age:'preschool'},now).length,0);
 const stale={...reviewed.records[0],verifiedAt:'2026-10-01'};assert.equal(isStaleRecord(stale,now),true);assert.equal(filterRecords([stale],{status:'open'},now).length,0);
});
test('operating dates, national coverage, cancelled records and combined date filters remain distinct',()=>{
 const r={...reviewed.records[0],eventStart:'2026-10-25',eventEnd:'2026-10-31',operatingDates:['2026-10-25','2026-10-31']};
 assert.deepEqual(datesForDay(r,'2026-10-26','event'),[]);assert.deepEqual(datesForDay(r,'2026-10-25','event'),['이용']);
 assert.equal(filterRecords([r],{calendar:'event',from:'2026-10-26',to:'2026-10-26'},now).length,0);
 assert.equal(filterRecords([{...r,lifecycleStatus:'cancelled'}],{},now).length,0);assert.equal(filterRecords([{...r,region:'전국'}],{region:'경기지역'},now).length,1);
});
test('official closed weekdays are excluded from event calendars and date-range results',()=>{
 const r={...reviewed.records[0],applicationStart:null,applicationEnd:null,eventStart:'2026-10-25',eventEnd:'2026-10-31',operatingWeekdays:[0,2,3,4,5,6]};
 assert.deepEqual(datesForDay(r,'2026-10-26','event'),[]);assert.deepEqual(datesForDay(r,'2026-10-27','event'),['이용']);
 assert.equal(filterRecords([r],{calendar:'event',from:'2026-10-26',to:'2026-10-26'},now).length,0);
 assert.equal(filterRecords([r],{calendar:'event',from:'2026-10-26',to:'2026-10-27'},now).length,1);
});
test('personal deadlines require explicit provenance and never invent a fixed calendar date',()=>{
 const r=structuredClone(reviewed.records[0]);r.lifecycleStatus=null;r.applicationStart=null;r.applicationEnd=null;r.eventStart=null;r.eventEnd=null;
 assert.ok(validateRecord(r,options).length);r.applicationMode='relative';r.applicationNote='출산 후 6개월 이내';
 assert.ok(validateRecord(r,options).length);r.evidence[0].fields.push('applicationMode','applicationNote');assert.deepEqual(validateRecord(r,options),[]);
 assert.equal(recordState(r,now).code,'unknown');assert.deepEqual(datesForDay(r,'2026-10-26'),[]);
 assert.ok(renderRecord(r,schedule.categories,now).includes('출산 후 6개월 이내'));
 assert.equal(filterRecords([r],{status:'open'},now).length,0);
});
test('public snapshot has stable identity, preserves legacy timestamps and excludes held/internal fields',async()=>{
 const feed=await loadCatalog({now:catalogNow}),again=await loadCatalog({now:new Date(catalogNow.getTime()+86400000)});assert.equal(feed.snapshotId,again.snapshotId);assert.equal(feed.categories.length,9);assert.ok(feed.records.length>=reviewed.records.length);
 const raw=JSON.stringify(feed);assert.ok(!raw.includes('seoul-farm-single-parent'));assert.ok(!raw.includes('authentication'));assert.ok(!raw.includes('rightsNote'));
 assert.equal(feed.records.find(r=>r.id==='festival-seoul-drone-2026').verifiedAt,'2026-10-23');
});
test('legacy sales keep inclusive minute and exclusive hourly deadlines after normalization',async()=>{
 const feed=await loadCatalog({now:catalogNow}),hm=feed.records.find(r=>r.legacyId==='hm-midseason-202610'),kurly=feed.records.find(r=>r.providerId==='legacy-brand-kurly');
 assert.equal(recordState(hm,new Date('2026-10-25T14:59:59Z')).current,true);assert.equal(recordState(hm,new Date('2026-10-25T15:00:00Z')).current,false);
 assert.equal(recordState(kurly,new Date('2026-10-26T02:00:00Z')).current,false);
});
test('blog splits retain beauty and all eligible regions without a nine-post cap',async()=>{
 const feed=await loadCatalog({now:catalogNow}),wed=groupPosts(feed,{day:3,now}),thu=groupPosts(feed,{day:4,now});assert.ok(wed.posts.some(p=>p.categoryId==='brand-sales'&&p.splitValue==='beauty'));assert.ok(thu.posts.filter(p=>p.categoryId==='festivals').length>1);
 const synthetic={...feed,records:feed.records.map(r=>({...r,region:'전국',verifiedAt:'2026-10-25'}))};assert.ok(groupPosts(synthetic,{day:3,now}).posts.length>0);
});
test('published and ambiguous posts cannot be duplicated by a different snapshot',async()=>{
 const feed=await loadCatalog({now:catalogNow}),first=groupPosts(feed,{day:3,now}),post=first.posts[0];
 for(const status of ['published','publishing','unknown'])assert.ok(!groupPosts({...feed,snapshotId:'another'},{day:3,now,history:[{key:post.key,status}]}).posts.some(p=>p.key===post.key));
 assert.equal(weekKey(new Date('2026-10-24T15:00:00Z')),'2026-10-25');assert.equal(weekKey(new Date('2026-10-28T03:00:00Z')),'2026-10-25');
 assert.equal(publicationKey('2026-10-25','brand-sales','sector','beauty'),'2026-10-25:brand-sales:sector:beauty:weekly');
});

test('ad hoc weekly posts cannot reappear under a different region or nationwide grouping key',async()=>{
 const feed=await loadCatalog({now:catalogNow}),clock=new Date('2026-10-29T00:00:00Z'),id='teenieping-hyundai-tour-202610';
 const prior={key:'2026-10-25:kids-popups:national:teenieping-hyundai-tour:weekly',recordIds:[id],url:'https://blog.naver.com/6a_blog/224455031126'};
 for(const status of ['published','publishing','unknown']){
  const queue=groupPosts(feed,{day:4,now:clock,history:[{...prior,status}]});
  assert.ok(!queue.posts.some(p=>p.categoryId==='kids-popups'&&p.records.some(r=>r.id===id)));
  assert.ok(queue.posts.some(p=>p.categoryId==='kids-popups'&&p.records.length));
 }
 for(const entry of [{...prior,status:'failed'},{...prior,key:prior.key.replace('2026-10-25','2026-10-18'),status:'published'}])assert.ok(groupPosts(feed,{day:4,now:clock,history:[entry]}).posts.some(p=>p.records.some(r=>r.id===id)));
});

test('reviewed facility benefits form the attractions post instead of being omitted by missing sectors',async()=>{
 const feed=await loadCatalog({now:catalogNow}),queue=groupPosts(feed,{day:4,now:new Date('2026-10-29T00:00:00Z')});
 const post=queue.posts.find(p=>p.categoryId==='family-discounts'&&p.splitValue==='attractions');assert.ok(post);
 assert.equal(post.records.length,19);assert.ok(!queue.held.some(p=>p.categoryId==='family-discounts'&&p.reason==='지역/분야 분리 근거 부족'));
});
test('editorial strings are escaped in cards and no unsupported price total is invented',()=>{
 const r={...reviewed.records[0],title:'<script>alert(1)</script>',summary:'A & B'};const html=renderRecord(r,schedule.categories,now);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('A &amp; B'));assert.ok(html.includes('noopener noreferrer'));
});
