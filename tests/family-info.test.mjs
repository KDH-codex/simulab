import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../scripts/family-info/catalog.mjs';
import {validateSchedule,validateRecord,filterRecords,recordState,isStaleRecord,datesForDay,renderRecord} from '../tools/family-info-calendar/model.js';
import {groupPosts,publicationKey,weekKey} from '../scripts/family-info/blog.mjs';
const root=new URL('../',import.meta.url),json=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const schedule=await json('data/family-info/schedule.json'),registry=await json('data/family-info/sources.json'),reviewed=await json('data/family-info/reviewed.json');
const now=new Date('2026-10-25T09:00:00Z'),options={categories:schedule.categories,providers:registry.providers,now};
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
test('public snapshot has stable identity, preserves legacy timestamps and excludes held/internal fields',async()=>{
 const feed=await loadCatalog({now}),again=await loadCatalog({now:new Date('2026-10-26T09:00:00Z')});assert.equal(feed.snapshotId,again.snapshotId);assert.equal(feed.categories.length,9);assert.ok(feed.records.length>=reviewed.records.length);
 const raw=JSON.stringify(feed);assert.ok(!raw.includes('seoul-farm-single-parent'));assert.ok(!raw.includes('authentication'));assert.ok(!raw.includes('rightsNote'));
 assert.equal(feed.records.find(r=>r.id==='festival-seoul-drone-2026').verifiedAt,'2026-10-23');
});
test('legacy sales keep inclusive minute and exclusive hourly deadlines after normalization',async()=>{
 const feed=await loadCatalog({now}),hm=feed.records.find(r=>r.legacyId==='hm-midseason-202610'),kurly=feed.records.find(r=>r.providerId==='legacy-brand-kurly');
 assert.equal(recordState(hm,new Date('2026-10-25T14:59:59Z')).current,true);assert.equal(recordState(hm,new Date('2026-10-25T15:00:00Z')).current,false);
 assert.equal(recordState(kurly,new Date('2026-10-26T02:00:00Z')).current,false);
});
test('blog splits retain beauty and all eligible regions without a nine-post cap',async()=>{
 const feed=await loadCatalog({now}),wed=groupPosts(feed,{day:3,now}),thu=groupPosts(feed,{day:4,now});assert.ok(wed.posts.some(p=>p.categoryId==='brand-sales'&&p.splitValue==='beauty'));assert.ok(thu.posts.filter(p=>p.categoryId==='festivals').length>1);
 const synthetic={...feed,records:feed.records.map(r=>({...r,region:'전국',verifiedAt:'2026-10-25'}))};assert.ok(groupPosts(synthetic,{day:3,now}).posts.length>0);
});
test('published and ambiguous posts cannot be duplicated by a different snapshot',async()=>{
 const feed=await loadCatalog({now}),first=groupPosts(feed,{day:3,now}),post=first.posts[0];
 for(const status of ['published','publishing','unknown'])assert.ok(!groupPosts({...feed,snapshotId:'another'},{day:3,now,history:[{key:post.key,status}]}).posts.some(p=>p.key===post.key));
 assert.equal(weekKey(new Date('2026-10-24T15:00:00Z')),'2026-10-25');assert.equal(weekKey(new Date('2026-10-28T03:00:00Z')),'2026-10-25');
 assert.equal(publicationKey('2026-10-25','brand-sales','sector','beauty'),'2026-10-25:brand-sales:sector:beauty:weekly');
});
test('editorial strings are escaped in cards and no unsupported price total is invented',()=>{
 const r={...reviewed.records[0],title:'<script>alert(1)</script>',summary:'A & B'};const html=renderRecord(r,schedule.categories,now);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('A &amp; B'));assert.ok(html.includes('noopener noreferrer'));
});
