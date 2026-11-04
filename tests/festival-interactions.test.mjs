import test from 'node:test';
import assert from 'node:assert/strict';
import {eventTags,matchesKeyword,weekRangeFor,weekDays,weeklyEvents,eventsForDay,dayMilestone} from '../assets/js/festival-ui-model.js';
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
