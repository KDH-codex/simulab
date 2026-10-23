import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {validateSource,validateEvent,eventState,filterEvents,monthWeeks,monthRange,shiftMonth,koreaToday,renderEvent,renderCalendar,safeOfficialUrl,validDate} from '../tools/parenting-deals/model.js';
const {sources}=JSON.parse(await readFile(new URL('../data/deals/sources.json',import.meta.url),'utf8'));
const raw=JSON.parse(await readFile(new URL('../data/deals/reviewed.json',import.meta.url),'utf8')).events;
const events=raw.map(e=>({...e,brandName:sources.find(s=>s.id===e.brandId).name})),at='2026-10-24T02:01:14+09:00';
const hm=events.find(e=>e.brandId==='hm'),live=events.find(e=>e.scheduleKind==='broadcast');

test('reviewed records contain ten actual monthly events from eight brands, plus a separate long-term benefit',()=>{
 assert.equal(sources.length,11);assert.equal(events.length,11);
 const calendar=filterEvents(events,{month:'2026-10'},at);
 assert.equal(calendar.length,10);assert.equal(new Set(calendar.map(e=>e.brandId)).size,8);
 assert.equal(filterEvents(events,{placement:'longterm'},at).length,1);
 for(const source of sources)assert.deepEqual(validateSource(source,at),[],source.id);
 for(const event of events)assert.deepEqual(validateEvent(event,sources,at),[],event.id);
 assert.ok(events.every(e=>e.priceWon===undefined&&e.discountedPrice===undefined));
});
test('H&M ends at its published Korean minute, including the UTC date boundary',()=>{
 assert.equal(eventState(hm,'2026-10-25T14:59:30Z').active,true);
 assert.equal(eventState(hm,'2026-10-25T15:00:00Z').code,'ended');
 assert.equal(eventState({...hm,checkedAt:'2026-10-23T00:00:00+09:00'},'2026-10-23T14:59:59Z').active,true);
 assert.equal(koreaToday('2026-10-23T15:00:00Z'),'2026-10-24');
});
test('a shopping live appears only on its broadcast date, not every day of its announcement period',()=>{
 assert.equal(live.startDate,'2026-10-29');assert.equal(live.endDate,'2026-10-29');
 const early=filterEvents(events,{month:'2026-10',rangeStart:'2026-10-22',rangeEnd:'2026-10-28'},at);
 assert.ok(!early.some(e=>e.id===live.id));
 assert.equal(eventState(live,at).code,'upcoming');
 assert.equal(eventState(live,'2026-10-29T10:59:59+09:00').code,'upcoming');
 assert.equal(eventState(live,'2026-10-29T11:00:00+09:00').code,'broadcast');
 assert.equal(eventState(live,'2026-10-30T00:00:00+09:00').code,'ended');
});
test('stale or future-dated reviews never count as currently active, and ended records remain ended',()=>{
 const long=events.find(e=>e.placement==='longterm');
 assert.equal(eventState(long,'2026-10-31T02:01:15+09:00').code,'stale');
 assert.equal(filterEvents(events,{placement:'longterm',status:'active'},'2026-10-31T02:01:15+09:00').length,0);
 assert.equal(eventState({...hm,checkedAt:'2027-01-01T00:00:00+09:00'},at).code,'pending');
 assert.equal(eventState(hm,'2026-11-15T00:00:00+09:00').code,'ended');
});
test('month clipping preserves crossing-year ranges and a February with four full weeks',()=>{
 assert.equal(monthWeeks('2026-02',[]).length,4);
 assert.equal(monthRange('2024-02').end,'2024-02-29');
 assert.equal(shiftMonth('2026-12',1),'2027-01');
 assert.equal(shiftMonth('2026-01',-1),'2025-12');
 assert.throws(()=>monthRange('2026-13'));assert.equal(validDate('2026-02-30'),false);
 const weeks=monthWeeks('2026-10',events);
 for(const w of weeks)for(const s of w.segments){assert.ok(s.start>='2026-10-01');assert.ok(s.stop<='2026-10-31');}
});
test('overlapping calendar bars have valid spans and disjoint cells within each lane; overflow is disclosed',()=>{
 const weeks=monthWeeks('2026-10',events,{maxLanes:3});
 assert.ok(weeks.some(w=>w.hiddenIds.length>0));
 for(const week of weeks){
  for(const s of week.segments){assert.ok(s.col>=1&&s.col+s.span<=8);assert.ok(s.lane>=1&&s.lane<=3);}
  for(const a of week.segments)for(const b of week.segments)if(a!==b&&a.lane===b.lane)assert.ok(a.col+a.span<=b.col||b.col+b.span<=a.col);
  const represented=new Set([...week.segments.map(s=>s.event.id),...week.hiddenIds]);
  for(const e of filterEvents(events,{month:'2026-10'},at))if(e.endDate>=week.start&&e.startDate<=week.end)assert.ok(represented.has(e.id));
 }
 assert.throws(()=>monthWeeks('2026-10',events,{maxLanes:0}));
});
test('category, brand, channel, status and all search words combine without inventing channel eligibility',()=>{
 const kitchen=filterEvents(events,{month:'2026-10',category:'kitchen'},at);
 assert.ok(kitchen.some(e=>e.brandId==='cuckoo'));assert.ok(kitchen.some(e=>e.brandId==='ikea'));
 const queried=filterEvents(events,{month:'2026-10',brand:'samsung',channel:'online',query:'체험존 쿠폰'},at);
 assert.equal(queried.length,1);
 assert.equal(filterEvents(events,{month:'2026-10',brand:'iloom',channel:'online'},at).length,0);
 assert.equal(filterEvents(events,{month:'2026-10',brand:'iloom',channel:'unknown'},at).length,2);
 assert.equal(filterEvents(events,{month:'2026-10',status:'upcoming'},at)[0].id,live.id);
 assert.ok(filterEvents(events,{month:'2026-10',status:'soon'},at).every(e=>e.endDate<='2026-10-30'));
});
test('unverified and cancelled records never appear as published sales or calendar bars',()=>{
 const held={...hm,publicationStatus:'held'},cancelled={...hm,publicationStatus:'cancelled'};
 assert.equal(filterEvents([held,cancelled],{month:'2026-10'},at).length,0);
 assert.ok(monthWeeks('2026-10',[held,cancelled]).every(w=>w.segments.length===0));
 assert.equal(eventState(cancelled,at).code,'cancelled');
 const pendingIds=sources.filter(s=>s.note).map(s=>s.id);assert.equal(pendingIds.length,3);
 assert.ok(pendingIds.every(id=>!events.some(e=>e.brandId===id)));
});
test('invalid dates, missing provenance, unknown hosts and product prices fail publication validation',()=>{
 for(const changes of [{endDate:'2026-02-30'},{startDate:'2027-01-01'},{checkedAt:'2026-10-25T00:00:00+09:00'},{periodSourceUrl:''},{sourceUrl:'https://www2.hm.com.evil.example/'},{priceWon:1000},{reviewWithinDays:100},{publicationStatus:'automatic'},{startTime:'25:00'}])assert.ok(validateEvent({...hm,...changes},sources,at).length);
 assert.equal(safeOfficialUrl('javascript:alert(1)',['www2.hm.com']),false);
 assert.equal(safeOfficialUrl('https://user:secret@www2.hm.com/',['www2.hm.com']),false);
});
test('rendered source facts are escaped and period notes do not promise daily live broadcasting',()=>{
 const malicious={...hm,title:'<img src=x onerror=alert(1)>',summary:'<script>bad</script>'};
 const html=renderEvent(malicious,{now:at});assert.doesNotMatch(html,/<img src=x|<script>bad/);assert.match(html,/&lt;script&gt;/);
 const calendar=renderCalendar('2026-10',[malicious],{now:at,today:'2026-10-24'});assert.doesNotMatch(calendar,/<img src=x/);
 assert.match(renderEvent(live,{now:at}),/방송 예정일만 표시/);
});
test('the home leads with the new calendar and the public schema describes an editorial collection',async()=>{
 const home=await readFile(new URL('../scripts/build-home.mjs',import.meta.url),'utf8');assert.ok(home.indexOf('class="family-first"')<home.indexOf('class="home-hero"'));assert.match(home,/브랜드 세일 달력/);
 const scope={};vm.runInNewContext(await readFile(new URL('../assets/js/core-ui.js',import.meta.url),'utf8'),scope);
 assert.equal(scope.SimuLab.getToolNotice('parenting-deals').kind,'shopping');assert.match(scope.SimuLab.getToolNotice('parenting-deals').message,/적립금과 사은품/);
 const generator=await readFile(new URL('../scripts/build-parenting-deals.mjs',import.meta.url),'utf8');assert.match(generator,/'CollectionPage'/);assert.doesNotMatch(generator,/'Product'|'Offer'/);
});
