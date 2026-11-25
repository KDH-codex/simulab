import test from 'node:test';
import assert from 'node:assert/strict';
import {eventTags,matchesKeyword,weekRangeFor,weekDays,weeklyEvents,eventsForDay,dayMilestone,isIndoorVenue,eventCategoryOf,matchesCategory,isEndingThisWeek,hasAdvanceBooking,matchesPreset,endingThisWeekEvents,conciergePicksFor,parseSharedPicks,buildSharedPicksURL,googleCalendarUrl,icsContent,relatedEventsFor,isWinterSeasonEvent,nearbyDealsForEvent,formatCourseSummaryText} from '../assets/js/festival-ui-model.js';
import {summarizeForecast} from '../assets/js/festival-weather-model.js';
import {weatherResponse} from '../worker/weather.mjs';
import worker from '../worker/index.mjs';

const event={id:'night',title:'남산 나이트 페스티벌',program:'캠프닉과 문화 체험',region:'서울',theme:'light',startDate:'2026-10-31',endDate:'2026-11-07',dates:['2026-10-31','2026-11-07']};
test('week boundaries include adjacent-month dates and retain discrete operating dates',()=>{
  assert.deepEqual(weekRangeFor('2026-12-01'),{start:'2026-11-29',end:'2026-12-05'});
  assert.equal(weekDays('2026-11-29').length,7);
  assert.equal(weekDays('2026-11-29').at(-1),'2026-12-05');
  assert.equal(weeklyEvents([event],'2026-10-25').length,1);
  assert.equal(eventsForDay([event],'2026-11-01').length,0);
  assert.equal(eventsForDay([event],'2026-11-07').length,1);
  assert.equal(weeklyEvents([{...event,publicationStatus:'cancelled'}],'2026-11-01').length,0);
  assert.equal(dayMilestone({...event,scheduleType:'period'},'2026-11-04'),'운영일 확인');
});
test('keyword chips are grounded in event text, preserve filters and escape no eligibility claims',()=>{
  const tags=eventTags(event);
  assert.ok(tags.includes('캠프닉'));assert.ok(tags.includes('나이트'));
  assert.equal(eventTags({...event,title:'부산불꽃축제',program:'불꽃 관람'}).includes('꽃'),false);
  assert.equal(tags.includes('무료'),false);assert.equal(tags.includes('주차 가능'),false);
  assert.equal(new Set(tags).size,tags.length);
  assert.equal(matchesKeyword(event,'캠프닉'),true);
  assert.equal(matchesKeyword(event,'빛·야간'),true);
  assert.equal(matchesKeyword(event,'불꽃'),false);
});
test('quick presets classify indoor halls, weekly closing deadlines and advance booking reliably',()=>{
  const museum={id:'museum',title:'겨울 기획전',program:'실내 체험',location:'국립중앙박물관 전시관',region:'서울',theme:'kids',startDate:'2026-11-20',endDate:'2026-11-29',booking:'공식 홈페이지 온라인 사전 신청 선착순 접수'};
  const park={id:'park',title:'야외 등불 산책',program:'야간 조명',location:'호수공원 광장',region:'경기',theme:'light',startDate:'2026-11-20',endDate:'2026-11-30',booking:'별도 예약 없이 현장 관람'};
  assert.equal(isIndoorVenue(museum),true);
  assert.equal(isIndoorVenue(park),false);
  assert.equal(isEndingThisWeek(museum,'2026-11-24'),true);
  assert.equal(isEndingThisWeek(park,'2026-11-24'),false);
  assert.equal(isEndingThisWeek({...museum,publicationStatus:'cancelled'},'2026-11-24'),false);
  assert.equal(hasAdvanceBooking(museum),true);
  assert.equal(hasAdvanceBooking(park),false);
  assert.equal(matchesPreset(museum,'indoor','2026-11-24'),true);
  assert.equal(matchesPreset(park,'ending','2026-11-24'),false);
  assert.equal(endingThisWeekEvents([park,museum],'2026-11-24').map(e=>e.id).join(','),'museum');
});
test('concierge picks, shared picks URL parsing, calendar exports and related events enforce safety and bounds',()=>{
  const museum={id:'museum-a',title:'과학관 겨울전',program:'실내 체험',location:'국립과학관',region:'서울',theme:'kids',feeStatus:'free',startDate:'2026-11-20',endDate:'2026-12-20',time:'10:00~17:00',image:{src:'/a.webp'}};
  const light={id:'light-b',title:'겨울 빛축제',program:'야경 점등',location:'호수공원',region:'서울',theme:'light',feeStatus:'paid',startDate:'2026-11-22',endDate:'2026-11-28',dates:['2026-11-28'],image:{src:'/b.webp'}};
  const kids2={id:'kids-c',title:'전시 체험',program:'가족 프로그램',location:'대전 전시관',region:'대전',theme:'kids',feeStatus:'free',startDate:'2026-11-23',endDate:'2026-11-29'};
  assert.deepEqual(conciergePicksFor([light,museum],'indoor','2026-11-24').picks.map(e=>e.id),['museum-a']);
  assert.deepEqual(conciergePicksFor([light,museum],'night','2026-11-24').picks.map(e=>e.id),['light-b']);
  const valid=new Set(['museum-a','light-b','kids-c','d','e','f','g']);
  assert.deepEqual(parseSharedPicks('museum-a, <script>, unknown-id, light-b, museum-a, c, d, e, f, g',valid),['museum-a','light-b','d','e','f','g']);
  assert.equal(buildSharedPicksURL(['museum-a','light-b'],'https://simulab.kr','en'),'https://simulab.kr/?picks=museum-a%2Clight-b&lang=en#shared-picks-board');
  const gcal=new URL(googleCalendarUrl(light,'2026-11-24'));
  assert.equal(gcal.searchParams.get('dates'),'20261128/20261129');
  const ics=icsContent(museum,'2026-11-24');
  assert.match(ics,/BEGIN:VCALENDAR/);
  assert.match(ics,/DTSTART;VALUE=DATE:20261124/);
  assert.match(ics,/DTEND;VALUE=DATE:20261125/);
  assert.match(ics,/URL:https:\/\/simulab\.kr\/events\/museum-a\//);
  const rel=relatedEventsFor(museum,[museum,light,kids2],e=>e.region==='서울'?'서울':'충청지역');
  assert.deepEqual(rel.sameRegion.map(e=>e.id),['light-b']);
  assert.deepEqual(rel.sameTheme.map(e=>e.id),['kids-c']);
});
const now=new Date('2026-11-04T00:00:00Z');
const point=(time,temp,symbol='fair_day')=>({time,data:{instant:{details:{air_temperature:temp}},next_6_hours:{summary:{symbol_code:symbol}}}});
const fixture=()=>({properties:{meta:{updated_at:now.toISOString(),units:{air_temperature:'celsius'}},timeseries:[
  point('2026-11-04T00:00:00Z',4),point('2026-11-04T03:00:00Z',12),point('2026-11-04T09:00:00Z',8),
  point('2026-11-04T21:00:00Z',6),point('2026-11-05T03:00:00Z',13,'rain')
]}});
test('weather uses Korea dates and a representative forecast, not invented daily extrema',()=>{
  const result=summarizeForecast(fixture(),{now});
  assert.equal(result.days.length,2);
  assert.equal(result.days[0].date,'2026-11-04');
  assert.equal(result.days[0].localTime,'12:00');
  assert.equal(result.days[0].temperature,12);
  assert.equal(result.days[1].date,'2026-11-05');
  assert.equal(result.days[1].label,'비');
  assert.equal(result.days[0].min,undefined);
  assert.equal(result.days[0].max,undefined);
});
test('stale, malformed and empty weather responses fail rather than becoming sunny zeroes',()=>{
  const stale=fixture();stale.properties.meta.updated_at='2026-10-01T00:00:00Z';
  assert.throws(()=>summarizeForecast(stale,{now}),/Stale/);
  assert.throws(()=>summarizeForecast({},{now}),/Invalid/);
  const empty=fixture();empty.properties.timeseries=[];
  assert.throws(()=>summarizeForecast(empty,{now}),/No usable/);
});
test('weather endpoint only allows fixed cities and GET, never arbitrary upstream URLs',async()=>{
  let calls=0;const fetchFn=async()=>{calls++;throw Error('must not fetch');};
  for(const query of ['region=unknown','region=__proto__','url=https://example.org','region=seoul&lat=0']){
    const r=await weatherResponse(new Request('https://simulab.kr/api/weather?'+query),{fetchFn,now});
    assert.equal(r.status,400);
  }
  assert.equal((await weatherResponse(new Request('https://simulab.kr/api/weather',{method:'POST'}),{fetchFn,now})).status,405);
  assert.equal(calls,0);
});
test('weather proxy respects provider expiry and reuses the cached response',async()=>{
  let calls=0;const store=new Map();
  const cache={async match(r){return store.get(r.url)?.clone();},async put(r,value){store.set(r.url,value);}};
  const fetchFn=async(url,options)=>{
    calls++;assert.match(url,/lat=37\.5665&lon=126\.978$/);
    assert.match(options.headers['User-Agent'],/github\.com\/KDH-codex\/simulab/);
    return new Response(JSON.stringify(fixture()),{headers:{Expires:'Wed, 04 Nov 2026 01:00:00 GMT'}});
  };
  const request=new Request('https://simulab.kr/api/weather?region=seoul');
  const first=await weatherResponse(request,{fetchFn,cache,now}),body=await first.json();
  assert.equal(first.status,200);assert.equal(first.headers.get('Cache-Control'),'public, max-age=3600');
  assert.equal(body.station.city,'서울');assert.equal(body.provider,'MET Norway');
  assert.match(body.note,/최저·최고/);
  const second=await weatherResponse(request,{fetchFn,cache,now});
  assert.equal(second.status,200);assert.equal(calls,1);
});
test('upstream failure returns a visible unavailable state and no fake forecasts',async()=>{
  const r=await weatherResponse(new Request('https://simulab.kr/api/weather?region=busan'),{now,fetchFn:async()=>new Response('',{status:429})});
  assert.equal(r.status,503);const body=await r.json();
  assert.equal(body.error,'weather-unavailable');assert.equal(body.days,undefined);
});
test('worker preserves static routing and rejects unrelated API paths',async()=>{
  const seen=[];
  const env={ASSETS:{fetch:async request=>{seen.push(request.url);return new Response('existing static page');}}};
  const request=new Request('https://simulab.kr/map/?region=서울');
  const response=await worker.fetch(request,env);
  assert.equal(await response.text(),'existing static page');
  assert.deepEqual(seen,[request.url]);
  const unknown=await worker.fetch(new Request('https://simulab.kr/api/not-weather'),env);
  assert.equal(unknown.status,404);
  assert.equal(seen.length,1);
});
test('winter season classifier, nearby deals matcher and course summary formatter work accurately',()=>{
  assert.equal(isWinterSeasonEvent({id:'w1',title:'부산 해운대 빛축제',program:'겨울 야간 조명',theme:'light',endDate:'2026-12-31'}),true);
  assert.equal(isWinterSeasonEvent({id:'w2',title:'겨울 눈꽃 축제',program:'눈썰매 체험',theme:'craft',endDate:'2026-11-29'}),false);
  assert.equal(isWinterSeasonEvent({id:'w3',title:'겨울 빛축제',program:'점등식',theme:'light',endDate:'2026-12-20',publicationStatus:'cancelled'}),false);

  const sampleDeals=[
    {id:'d1',brandId:'b1',brand:'이랜드몰',shopping:{area:'nationwide'}},
    {id:'d2',brandId:'b2',brand:'더현대 서울',shopping:{area:'seoul'}},
    {id:'d3',brandId:'b2',brand:'더현대 서울 2차',shopping:{area:'seoul'}},
    {id:'d4',brandId:'b3',brand:'스타필드 하남',shopping:{area:'gyeonggi'}},
    {id:'d5',brandId:'b4',brand:'올리브영',shopping:{area:'nationwide'}}
  ];
  const seoulEvent={id:'seoul-test',region:'서울'};
  const picked=nearbyDealsForEvent(seoulEvent,sampleDeals,e=>e.region==='서울'?'서울':'경기지역',3);
  assert.deepEqual(picked.map(d=>d.id),['d2','d4','d1']);

  const summary=formatCourseSummaryText([{id:'e1',region:'서울',title:'겨울 실내 특별전',startDate:'2026-12-01',endDate:'2026-12-10',location:'국립중앙박물관 전시관',fee:'',feeStatus:'free'}],'https://simulab.kr/?picks=e1','2026-11-25');
  assert.match(summary,/1\. \[서울\] 겨울 실내 특별전/);
  assert.match(summary,/🏛 실내 시설/);
  assert.match(summary,/입장·기본참여 무료/);
  assert.match(summary,/https:\/\/simulab\.kr\/\?picks=e1/);
});
test('eventCategoryOf, matchesCategory and explicit indoor flag separate festivals, exhibitions and indoor events',()=>{
  const outdoor={id:'o1',title:'평창송어축제',location:'진부면 오대천 송어축제장',program:'실내 낚시터 및 얼음낚시',indoor:false,eventCategory:'festival'};
  const exh={id:'ex1',title:'국립박물관 특별전',location:'국립박물관',program:'상설 및 기획전시',indoor:true,eventCategory:'exhibition'};
  const ind={id:'in1',title:'국립과천과학관 겨울 체험',location:'과천과학관',program:'주말 사이언스 체험',indoor:true,eventCategory:'indoor'};
  assert.equal(isIndoorVenue(outdoor),false);
  assert.equal(isIndoorVenue(exh),true);
  assert.equal(eventCategoryOf(outdoor),'festival');
  assert.equal(eventCategoryOf(exh),'exhibition');
  assert.equal(eventCategoryOf(ind),'indoor');
  assert.equal(eventCategoryOf({title:'서울 공예 특별전',program:'전시'}),'exhibition');
  assert.equal(eventCategoryOf({title:'과학관 주말 체험교실',location:'국립과학관'}),'indoor');
  assert.equal(eventCategoryOf({title:'강원 눈꽃 축제',location:'야외 광장'}),'festival');
  assert.equal(matchesCategory(exh,'all'),true);
  assert.equal(matchesCategory(exh,'exhibition'),true);
  assert.equal(matchesCategory(exh,'festival'),false);
});
