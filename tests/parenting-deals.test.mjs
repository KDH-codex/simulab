import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {MAX_SALE_DAYS,calendarExclusionReason,isCalendarEligible,validateSource,validateEvent,eventState,filterEvents,filterSources,monthWeeks,monthRange,shiftMonth,koreaToday,renderEvent,renderCalendar,renderSourceDirectory,safeOfficialUrl,validDate} from '../tools/parenting-deals/model.js';
const {sources}=JSON.parse(await readFile(new URL('../data/deals/sources.json',import.meta.url),'utf8'));
const raw=JSON.parse(await readFile(new URL('../data/deals/reviewed.json',import.meta.url),'utf8')).events;
const events=raw.map(event=>{const source=sources.find(s=>s.id===event.brandId);return {...event,brandName:source.name,brandAliases:source.aliases};});
const at='2026-10-24T12:00:00+09:00',hm=events.find(e=>e.brandId==='hm'),kurly=events.find(e=>e.brandId==='kurly');

test('31 tracked brands include every requested brand; only seven reviewed limited sales are published',()=>{
 assert.equal(sources.length,31);assert.equal(new Set(sources.map(s=>s.id)).size,31);
 const required=['kurly','emart','lottemart','modernhouse','uniqlo','hm','zara','newbalance','topten','jellymallow','monbebe','littleground','minkmui','bebedepino','absorba','hanssem','iloom'];
 for(const id of required)assert.equal(sources.find(s=>s.id===id)?.trackingTier,'priority',id);
 assert.equal(events.filter(isCalendarEligible).length,7);assert.equal(events.filter(e=>e.publicationStatus==='held').length,8);
 assert.equal(filterEvents(events,{month:'2026-10'},at).length,7);
 for(const source of sources)assert.deepEqual(validateSource(source,at),[],source.id);
 for(const event of events)assert.deepEqual(validateEvent(event,sources,at),[],event.id);
});

test('long-term, recurring member benefits and individual product offers fail closed even with reviewed status',()=>{
 assert.equal(MAX_SALE_DAYS,31);
 for(const event of events.filter(e=>e.publicationStatus==='held')){
  const reviewed={...event,publicationStatus:'reviewed'};
  assert.ok(calendarExclusionReason(reviewed),event.id);assert.equal(isCalendarEligible(reviewed),false);
  assert.equal(filterEvents([reviewed],{month:'2026-10'},at).length,0);
  assert.ok(monthWeeks('2026-10',[reviewed]).every(w=>!w.segments.length));
  assert.ok(validateEvent(reviewed,sources,at).some(error=>error.startsWith('Not eligible')));
 }
 const thirtyOne={...hm,startDate:'2026-10-01',endDate:'2026-10-31'};
 assert.equal(isCalendarEligible(thirtyOne),true);
 assert.equal(isCalendarEligible({...thirtyOne,endDate:'2026-11-01'}),false);
 assert.equal(isCalendarEligible({...hm,campaignKind:undefined}),false);
 assert.equal(isCalendarEligible({...hm,campaignScope:'product'}),false);
 assert.equal(isCalendarEligible({...hm,benefitType:'installment'}),false);
 assert.equal(isCalendarEligible({...hm,campaignKind:'ongoing'}),false);
});

test('H&M ends at its published Korean minute, including the UTC date boundary',()=>{
 assert.equal(eventState(hm,'2026-10-25T14:59:30Z').active,true);
 assert.equal(eventState(hm,'2026-10-25T15:00:00Z').code,'ended');
 assert.equal(eventState({...hm,checkedAt:'2026-10-23T00:00:00+09:00'},'2026-10-23T14:59:59Z').active,true);
 assert.equal(koreaToday('2026-10-23T15:00:00Z'),'2026-10-24');
});

test('Kurly uses its actual coupon window, with 11:00 as an exclusive end, not an invented all-day sale',()=>{
 assert.equal(kurly.startTime,'11:00');assert.equal(kurly.endTime,'11:00');
 assert.equal(eventState(kurly,'2026-10-26T10:59:59+09:00').active,true);
 assert.equal(eventState(kurly,'2026-10-26T11:00:00+09:00').code,'ended');
 const before={...kurly,checkedAt:'2026-10-18T12:00:00+09:00'};
 assert.equal(eventState(before,'2026-10-19T10:59:59+09:00').code,'upcoming');
 assert.match(renderEvent(kurly,{now:at}),/행사 쿠폰 기간/);
});

test('the IKEA long-term delivery record and product broadcasts never enter public generated data',async()=>{
 const data=await readFile(new URL('../tools/parenting-deals/data.js',import.meta.url),'utf8');
 for(const id of ['ikea-parcel-202610','iloom-strato-202608','iloom-card-202610','cuckoo-live-20261029','samsung-odyssey-202610'])assert.ok(!data.includes('"id": "'+id+'"'));
 const html=await readFile(new URL('../tools/parenting-deals/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/id="longterm-section"|장기 혜택<\/h2>/);
});

test('stale or future-dated reviews never count as active, and ended records remain ended',()=>{
 const top=events.find(e=>e.brandId==='topten');
 assert.equal(eventState(top,'2026-10-31T02:01:15+09:00').code,'stale');
 assert.equal(filterEvents([top],{status:'active'},'2026-10-31T02:01:15+09:00').length,0);
 assert.equal(eventState({...hm,checkedAt:'2027-01-01T00:00:00+09:00'},at).code,'pending');
 assert.equal(eventState(hm,'2026-11-15T00:00:00+09:00').code,'ended');
});

test('month clipping handles year boundaries and leap days without shortening campaign eligibility',()=>{
 assert.equal(monthWeeks('2026-02',[]).length,4);assert.equal(monthRange('2024-02').end,'2024-02-29');
 assert.equal(shiftMonth('2026-12',1),'2027-01');assert.equal(shiftMonth('2026-01',-1),'2025-12');
 assert.throws(()=>monthRange('2026-13'));assert.equal(validDate('2026-02-30'),false);
 const cross={...hm,startDate:'2026-12-25',endDate:'2027-01-05'};
 const weeks=monthWeeks('2027-01',[cross]);assert.ok(weeks[0].segments.every(s=>s.start>='2027-01-01'));
 const long=events.find(e=>e.id==='samsung-october-shopping-2026');
 assert.equal(monthWeeks('2026-10',[{...long,publicationStatus:'reviewed'}]).flatMap(w=>w.segments).length,0);
});

test('overlapping bars have valid spans and disjoint lanes; hidden events are disclosed',()=>{
 const rows=filterEvents(events,{month:'2026-10'},at),weeks=monthWeeks('2026-10',events,{maxLanes:3});
 assert.ok(weeks.some(w=>w.hiddenIds.length>0));
 for(const week of weeks){
  for(const s of week.segments){assert.ok(s.col>=1&&s.col+s.span<=8);assert.ok(s.lane>=1&&s.lane<=3);}
  for(const a of week.segments)for(const b of week.segments)if(a!==b&&a.lane===b.lane)assert.ok(a.col+a.span<=b.col||b.col+b.span<=a.col);
  const represented=new Set([...week.segments.map(s=>s.event.id),...week.hiddenIds]);
  for(const e of rows)if(e.endDate>=week.start&&e.startDate<=week.end)assert.ok(represented.has(e.id));
 }
 assert.throws(()=>monthWeeks('2026-10',events,{maxLanes:0}));
});

test('life, kids, brand, channel, status and search combine while empty tracked brands stay available',()=>{
 assert.equal(filterEvents(events,{month:'2026-10',category:'life'},at).length,3);
 assert.equal(filterEvents(events,{month:'2026-10',category:'kids'},at).length,0);
 assert.equal(filterSources(sources,{category:'kids'}).length,7);
 assert.equal(filterSources(sources,{query:'몽베'})[0].id,'monbebe');
 assert.equal(filterSources(sources,{query:'젤리벨로'})[0].id,'jellymallow');
 assert.equal(filterSources(sources,{brand:'newbalance'}).length,1);
 assert.equal(filterEvents(events,{month:'2026-10',brand:'newbalance'},at).length,0);
 assert.equal(filterEvents(events,{month:'2026-10',brand:'modernhouse',channel:'store'},at).length,0);
 assert.equal(filterEvents(events,{month:'2026-10',channel:'store',query:'EMART'},at).length,1);
 assert.ok(filterEvents(events,{month:'2026-10',status:'soon'},at).every(e=>e.endDate<='2026-10-30'));
});

test('cancelled and held records never become sales, while watchlist cards disclose missing confirmation',()=>{
 const cancelled={...hm,publicationStatus:'cancelled'};assert.equal(filterEvents([cancelled],{month:'2026-10'},at).length,0);
 assert.equal(eventState(cancelled,at).code,'cancelled');
 const directory=renderSourceDirectory(sources,events,{now:at});
 assert.equal((directory.match(/data-source-brand=/g)||[]).length,31);assert.equal((directory.match(/data-source-group=/g)||[]).length,6);
 assert.match(directory,/대표 세일 추가 확인/);assert.match(directory,/행사 상세 접근 제한/);
 assert.doesNotMatch(directory,/세일 없음|상시 진행/);
});

test('invalid provenance, dates, hosts, price snapshots and incomplete editorial classifications fail validation',()=>{
 for(const changes of [{endDate:'2026-02-30'},{startDate:'2027-01-01'},{checkedAt:'2026-10-25T00:00:00+09:00'},{periodSourceUrl:''},{sourceUrl:'https://www2.hm.com.evil.example/'},{priceWon:1000},{reviewWithinDays:100},{publicationStatus:'automatic'},{startTime:'25:00'},{campaignKind:undefined},{campaignScope:undefined},{endTimeExclusive:'yes'}])assert.ok(validateEvent({...hm,...changes},sources,at).length);
 assert.equal(safeOfficialUrl('javascript:alert(1)',['www2.hm.com']),false);
 assert.equal(safeOfficialUrl('https://user:secret@www2.hm.com/',['www2.hm.com']),false);
 assert.ok(validateSource({...sources[0],aliases:[1]},at).length);
});

test('rendered facts and watchlist fields are escaped, with editorial collection schema',async()=>{
 const malicious={...hm,title:'<img src=x onerror=alert(1)>',summary:'<script>bad</script>'};
 assert.doesNotMatch(renderEvent(malicious,{now:at}),/<img src=x|<script>bad/);
 assert.doesNotMatch(renderCalendar('2026-10',[malicious],{now:at,today:'2026-10-24'}),/<img src=x/);
 const directory=renderSourceDirectory([{...sources[0],name:'<img src=x>'}],events,{now:at});assert.doesNotMatch(directory,/<img src=x>/);
 const generator=await readFile(new URL('../scripts/build-parenting-deals.mjs',import.meta.url),'utf8');assert.match(generator,/'CollectionPage'/);assert.doesNotMatch(generator,/'Product'|'Offer'/);
});

test('home leads with the expanded calendar and shopping disclosure separates benefits from cash discounts',async()=>{
 const home=await readFile(new URL('../scripts/build-home.mjs',import.meta.url),'utf8');assert.ok(home.indexOf('class="family-first"')<home.indexOf('class="home-hero"'));assert.match(home,/기간 한정 대표 세일/);
 const scope={};vm.runInNewContext(await readFile(new URL('../assets/js/core-ui.js',import.meta.url),'utf8'),scope);
 assert.equal(scope.SimuLab.getToolNotice('parenting-deals').kind,'shopping');assert.match(scope.SimuLab.getToolNotice('parenting-deals').message,/적립금과 사은품/);
});
