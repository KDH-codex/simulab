import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CHRISTMAS_GROUPS} from '../assets/js/festival-christmas-model.js';
import {REGION_SEO_PAGES} from '../assets/js/festival-ui-model.js';
import {sharedPicksBoardMarkup} from '../assets/js/festival-presentation.js';
import {events,active,all,images,json,card,badge} from '../scripts/festival-platform.mjs';
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

test('the Christmas collection gives each event a distinct image file',async()=>{
  const digests=new Map();
  for(const {ids} of CHRISTMAS_GROUPS){
    for(const id of ids){
      const image=images[id];
      assert.ok(image?.src.startsWith('/assets/img/festivals/'),id+' needs an event image');
      const bytes=await readFile(new URL('..'+image.src,import.meta.url));
      const hash=createHash('sha256').update(bytes).digest('hex');
      assert.equal(digests.get(hash),undefined,id+' shares an image with '+digests.get(hash));
      digests.set(hash,id);
    }
  }
});

test('step 1 growth features render search input, quick presets, ending-soon feed and event og:image',async()=>{
  for(const p of ['index.html','calendar/index.html','map/index.html','curation/index.html']){
    const html=await read(p);
    assert.match(html,/id="festival-search"/);
    assert.match(html,/data-preset="indoor"/);
    assert.match(html,/data-preset="ending"/);
    assert.match(html,/data-preset="booking"/);
  }
  const home=await read('index.html');
  assert.match(home,/id="ending-soon-section"/);
  assert.match(home,/href="\/curation\/christmas\/"/);
  assert.match(home,/href="\/sales\/"/);
  const detailSample=active.find(e=>images[e.id]?.src);
  assert.ok(detailSample);
  const detailHtml=await read('events/'+detailSample.id+'/index.html');
  assert.match(detailHtml,new RegExp('property="og:image" content="https://simulab\\.kr'+images[detailSample.id].src.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"'));
  assert.match(home,/id="weekend-concierge"/);
  assert.match(home,/id="home-weather-city"/);
  assert.match(home,/id="floating-picks-bar"/);
  assert.match(home,/id="shared-picks-board"/);
  assert.match(detailHtml,/data-calendar-ics="/);
  assert.match(detailHtml,/https:\/\/calendar\.google\.com\/calendar\/render/);
  assert.match(detailHtml,/related-festivals-section/);
  assert.match(home,/id="home-deals-spotlight"/);
  assert.match(home,/class="card-quick-facts"/);
  assert.match(detailHtml,/class="aside-checklist"/);
  assert.match(detailHtml,/href="\/tools\/travel-budget-calc\/"/);
  assert.match(detailHtml,/id="nearby-deals-section"/);
  assert.match(detailHtml,/href="\/region\//);
});

test('SEO region and curation landing pages, nearby deals and course text copy render cleanly',async()=>{
  const home=await read('index.html');
  const mapHtml=await read('map/index.html');
  const sitemap=await read('sitemap.xml');
  assert.match(home,/class="seo-collections-bar"/);
  assert.match(mapHtml,/class="seo-nav-pills"/);

  const expectedUrls=[
    ...REGION_SEO_PAGES.map(p=>'region/'+p.slug+'/index.html'),
    'curation/indoor/index.html',
    'curation/free/index.html',
    'curation/winter-2026/index.html'
  ];
  for(const rel of expectedUrls){
    const html=await read(rel);
    assert.match(html,/class="seo-hero"/);
    assert.match(html,/class="seo-faq"/);
    assert.match(html,/"@type":"CollectionPage"/);
    assert.match(html,/"@type":"ItemList"/);
    assert.match(html,/"@type":"FAQPage"/);
    const loc='https://simulab.kr/'+rel.replace(/index\.html$/,'');
    assert.ok(sitemap.includes('<loc>'+loc+'</loc>'),loc+' missing from sitemap.xml');
  }

  const board=sharedPicksBoardMarkup(active.slice(0,2),{statusFn:()=>'진행 중',feeFn:()=>'무료',isIndoorFn:()=>true});
  assert.match(board,/data-copy-course-text/);
});
