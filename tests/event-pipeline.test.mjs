import test from 'node:test';
import assert from 'node:assert/strict';
import {FESTIVALS} from '../tools/kids-outing-calendar/data.js';
import {coverageForRange,eventStatus,filterEvents,selectAcrossRegions,validateEvent} from '../tools/kids-outing-calendar/model.js';
import {fromTourAPI,fromStandard,parseCSV,prepareCandidates,normalizeRegion} from '../scripts/events/candidates.mjs';
import {collectTourAPI} from '../scripts/events/tourapi.mjs';
const window={start:'2026-10-23',end:'2026-12-22'},stamp='2026-10-23T00:00:00Z';
test('all 17 search regions have actual reviewed records, and missing regions are never fabricated',()=>{
 const coverage=coverageForRange(FESTIVALS,window.start,window.end,window.start);
 assert.equal(coverage.length,17);assert.ok(coverage.every(row=>row.count>0));
 const empty=coverageForRange([],window.start,window.end,window.start);assert.ok(empty.every(row=>row.count===0&&row.upcomingCount===0&&row.nextDate===null));
 const historical=coverageForRange(FESTIVALS,'2026-10-24','2026-10-25','2027-01-01',{includeEnded:true});
 assert.ok(historical.some(row=>row.count>0));assert.ok(historical.every(row=>row.upcomingCount===0));
});
test('cancelled events are hidden and period notices do not promise daily operation',()=>{
 const event=FESTIVALS.find(e=>e.id==='mcst-12851-2026');
 assert.match(eventStatus(event,'2026-10-24'),/운영일 확인/);
 assert.deepEqual(filterEvents({...window,today:window.start},[{...event,publicationStatus:'cancelled'}]),[]);
 assert.ok(validateEvent({...event,checkedAt:'2099-01-01'},{today:window.start}).length);
 assert.ok(validateEvent({...event,sources:{}},{today:window.start}).length);
 const family=FESTIVALS.find(e=>e.id==='sejong-hangeul-family-2026');
 assert.equal(filterEvents({start:'2026-11-05',end:'2026-11-05',today:window.start},[family]).length,0);
 assert.equal(filterEvents({start:'2026-11-07',end:'2026-11-07',today:window.start},[family]).length,1);
});
test('home recommendations can include three different regions without inventing entries',()=>{
 const result=selectAcrossRegions(FESTIVALS,3);assert.equal(result.length,3);assert.equal(new Set(result.map(e=>e.region)).size,3);
 assert.ok(result.every(e=>FESTIVALS.includes(e)));
});
test('CSV preserves quoted commas, escaped quotes and line breaks; malformed data fails',()=>{
 const rows=parseCSV('\uFEFF축제명,개최장소,축제시작일자,축제종료일자,소재지도로명주소\r\n"예술, 놀이","공원 ""A""\n광장",2026-10-24,2026-10-25,강원특별자치도 강릉시\r\n');
 assert.equal(rows[0]['축제명'],'예술, 놀이');assert.equal(rows[0]['개최장소'],'공원 "A"\n광장');
 const candidate=fromStandard(rows[0],stamp);assert.equal(candidate.region,'강원');assert.equal(candidate.verificationStatus,'pending');assert.equal(candidate.checkedAt,undefined);
 assert.throws(()=>parseCSV('a,b\n"unterminated'));
 assert.throws(()=>parseCSV('a,b\n1,2,3'));
 assert.equal(normalizeRegion('전남광주통합특별시 남구'),'');
});
const row=(overrides={})=>({contentid:'1',title:'2026 바다축제',addr1:'부산광역시 해운대구 공원',areacode:'6',eventstartdate:'20261024',eventenddate:'20261025',mapx:'129.12',mapy:'35.16',...overrides});
test('API collection timestamps never become verification dates or free/child eligibility claims',()=>{
 const candidate=fromTourAPI(row({title:'<b>2026 바다축제</b>'}),stamp);
 assert.equal(candidate.title,'2026 바다축제');assert.equal(candidate.checkedAt,undefined);assert.equal(candidate.feeStatus,'unknown');
 assert.ok(validateEvent(candidate,{today:window.start}).length);
 const result=prepareCandidates([candidate,fromTourAPI(row({eventstartdate:'20250230'}),stamp)],window);
 assert.equal(result.candidates.length,1);assert.equal(result.quarantine.length,1);
});
test('duplicate events merge provenance only with matching dates and venue/coordinates; conflicts stay quarantined',()=>{
 const a=fromTourAPI(row(),stamp),b={...a,provider:'standard',sourceRecordId:'different',title:'제3회 바다 축제'};
 assert.equal(prepareCandidates([a,b],window).candidates.length,1);
 assert.equal(prepareCandidates([a,b],window).candidates[0].provenance.length,2);
 assert.equal(prepareCandidates([a,{...b,location:'다른 공원',latitude:36,longitude:130}],window).candidates.length,2);
 const conflict={...b,startDate:'2026-10-23'};
 const result=prepareCandidates([a,conflict,b],window);assert.equal(result.candidates.length,0);assert.equal(result.quarantine.length,3);
});
const response=(items,total=items.length)=>({ok:true,status:200,json:async()=>({response:{header:{resultCode:'0000'},body:{items:{item:items},totalCount:total}}})});
test('TourAPI pagination includes already-running events and encodes an approved key once',async()=>{
 const requests=[];let page=0;
 const result=await collectTourAPI({serviceKey:'safe%2Btest%2Fkey%3D',today:'2026-10-23',pageSize:1,fetchFn:async value=>{
  const url=new URL(value);requests.push(url);
  if(url.pathname.endsWith('areaCode2'))return response([{code:6,name:'부산광역시'}]);
  page++;return response([row({contentid:String(page)})],2);
 }});
 assert.equal(result.items.length,2);assert.equal(requests[1].searchParams.get('eventStartDate'),'20250101');
 assert.equal(requests[1].searchParams.get('serviceKey'),'safe+test/key=');assert.equal(result.areaNames['6'],'부산광역시');
});
test('missing keys skip cleanly and API failures or truncated pagination never return a partial snapshot',async()=>{
 let called=false;assert.equal((await collectTourAPI({today:window.start,fetchFn:async()=>{called=true;}})).status,'skipped');assert.equal(called,false);
 await assert.rejects(collectTourAPI({serviceKey:'DO-NOT-LOG',today:window.start,fetchFn:async()=>({ok:false,status:503})}),error=>!error.message.includes('DO-NOT-LOG'));
 await assert.rejects(collectTourAPI({serviceKey:'safe',today:window.start,maxPages:1,pageSize:1,fetchFn:async url=>url.includes('areaCode2')?response([]):response([row()],2)}),/상한/);
 await assert.rejects(collectTourAPI({serviceKey:'safe',today:window.start,fetchFn:async()=>({ok:true,status:200,json:async()=>{throw new Error('XML error');}})}),/JSON/);
});
