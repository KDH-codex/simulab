import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {events,active,all,json,card,badge} from '../scripts/festival-platform.mjs';
import {occursOn} from '../tools/kids-outing-calendar/model.js';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('festival pages retain canonical source dates and exclude unrelated family benefits',async()=>{
  for(const p of ['index.html','calendar/index.html','map/index.html','curation/index.html']){
    const html=await read(p);
    const payload=JSON.parse(html.match(/<script type="application\/json" id="festival-data">([\s\S]*?)<\/script>/)[1]);
    assert.equal(payload.length,events.length);
    assert.deepEqual(payload.map(e=>e.id),events.map(e=>e.id));
    for(const e of payload){const original=all.find(x=>x.id===e.id);assert.equal(e.checkedAt,original.checkedAt);assert.deepEqual(e.dates,original.dates);}
    assert.match(html,/<meta name="naver-site-verification" content="1b81691131895febb71347b5ec654887d1660bec">/);
    assert.match(html,/festival-platform\.js/);
  }
});
test('cards distinguish unknown fees, illustrative photos and period windows',()=>{
  const event=events.find(e=>e.scheduleType==='period');
  assert.match(card(event),/기간 내 운영일 확인/);
  assert.match(badge({...event,startDate:'2026-11-01',endDate:'2026-11-30'},'2026-11-04'),/개최기간 중/);
  assert.match(card({...event,feeStatus:'unknown'}),/요금 확인 필요/);
  assert.doesNotMatch(card({...event,feeStatus:'unknown'}),/입장·기본참여 무료/);
  assert.match(card(events.find(e=>e.id==='namsan-night-2026')),/주제 참고 · 현장 사진 아님/);
  assert.equal(occursOn(events.find(e=>e.id==='namsan-night-2026'),'2026-11-05'),false);
});
test('embedded JSON escapes HTML and unsupported schema prices stay absent',async()=>{
  assert.ok(!json({x:'</script><script>alert(1)</script>'}).includes('<'));
  assert.match(card({...events[0],title:'<img src=x onerror=alert(1)>'}),/&lt;img/);
  const html=await read('events/namsan-night-2026/index.html');
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@type'],'EventSeries');
  assert.equal(schema.subEvent.length,7);
  assert.equal(schema.offers,undefined);
  assert.equal(schema.organizer,undefined);
  assert.equal(schema.image,undefined);
});
test('regional navigation is an explicitly schematic overview',async()=>{
  const html=await read('map/index.html');
  assert.match(html,/권역 선택용 개략도/);
  assert.match(html,/실제 행사장의 좌표가 아니/);
  assert.doesNotMatch(html,/239|19°C|주차 혼잡|서울 여의도에서|스마트오더/);
  assert.equal((html.match(/class="region-point point-/g)||[]).length,7);
  const home=await read('index.html');
  assert.ok((home.match(/data-card-id=/g)||[]).length>=active.length);
});
