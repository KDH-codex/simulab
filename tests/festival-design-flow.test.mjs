import test from 'node:test';
import assert from 'node:assert/strict';
import {activeConditions,detailTagDestination,eventImage} from '../assets/js/festival-presentation.js';
import {modalMarkup,modalTabIds} from '../assets/js/festival-modal.js';
import {toggleDaySelection,eventsForDay} from '../assets/js/festival-ui-model.js';

const event={id:'night',title:'지역 축제 <script>alert(1)</script>',program:'야경과 문화 체험',region:'서울',theme:'light',startDate:'2026-10-31',endDate:'2026-11-07',dates:['2026-10-31','2026-11-07'],checkedAt:'2026-10-29',location:'공원',url:'/events/night/',sources:[{url:'https://example.go.kr/festival',publisher:'운영기관',title:'공식 공지',checkedAt:'2026-10-29',facts:'지정 운영일 확인'}]};
test('detail tags navigate to results while calendar tags remain in their own view',()=>{
  assert.equal(detailTagDestination('calendar','야경'),null);
  assert.equal(detailTagDestination('home','야경'),null);
  assert.equal(detailTagDestination('detail','꽃 & 체험'),'/?tag=%EA%BD%83%20%26%20%EC%B2%B4%ED%97%98#discover');
});
test('compact filter summary includes hidden constraints and preserves the page default',()=>{
  const state={keyword:'야경',free:true,saved:true,period:'weekend'};
  const rows=activeConditions(state,'weekend');
  assert.deepEqual(rows.map(row=>row.key),['keyword','free','saved','period']);
  assert.equal(rows.find(row=>row.key==='period').removable,false);
  assert.equal(activeConditions(state,'upcoming').find(row=>row.key==='period').removable,true);
  assert.equal(state.free,true);
  assert.deepEqual(activeConditions({period:'month'}),[]);
});
test('week date toggle returns all seven days across a month boundary without inventing daily operation',()=>{
  const selected=toggleDaySelection(null,'2026-12-01',{view:'week',weekStart:'2026-11-29'});
  assert.deepEqual(selected,{start:'2026-12-01',end:'2026-12-01'});
  assert.deepEqual(toggleDaySelection(selected,'2026-12-01',{view:'week',weekStart:'2026-11-29'}),{start:'2026-11-29',end:'2026-12-05'});
  assert.deepEqual(toggleDaySelection(selected,'2026-12-01',{view:'month'}),selected);
  assert.equal(eventsForDay([{...event,startDate:'2026-11-29',endDate:'2026-12-05',dates:['2026-11-29','2026-12-05']}],selected.start).length,0);
});
test('modal exposes matching four tab panels, real source conditions, safe text and illustrative imagery',()=>{
  const html=modalMarkup(event,{feeLabel:'요금 확인 필요'});
  assert.equal(modalTabIds.length,4);
  for(const id of modalTabIds){assert.match(html,new RegExp('aria-controls="modal-panel-'+id+'"'));assert.match(html,new RegExp('id="modal-panel-'+id+'"'));}
  assert.match(html,/https:\/\/map\.naver\.com\/v5\/search\//);
  assert.match(html,/요금 확인 필요/);
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<script>|무료 입장|남은 좌석/);
  const context=eventImage(event,{kind:'context',src:'/image.jpg',credit:'작가'});
  assert.match(context,/주제 참고 · 현장 사진 아님/);
  assert.match(eventImage(event,null),/테마 일러스트/);
});
