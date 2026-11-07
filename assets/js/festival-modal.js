import {escapeHtml as esc} from '../../tools/kids-outing-calendar/model.js';
import {highlightFor} from './festival-highlights.js';
import {eventTags} from './festival-ui-model.js';
import {eventImage,imageAttribution} from './festival-presentation.js';

const themes={light:'불꽃·야경',food:'먹거리·수확',nature:'꽃·자연',kids:'체험·문화'};
const tabs=[['schedule','일정·프로그램'],['booking','예약·비용'],['location','장소'],['sources','공식 출처']];
export const modalTabIds=tabs.map(([id])=>id);
export function modalMarkup(e,{keyword='',feeLabel='',statusLabel='',stale=false}={}) {
  const fields=[['▦','기간',e.startDate.replaceAll('-','.')+' — '+e.endDate.slice(5).replace('-','.')],['◷','시간',e.time||'공식 안내 확인'],['◈','비용',e.fee||feeLabel],['⌖','장소',e.location]];
  const pick=highlightFor(e);
  const translated='<div class="translation-only translation-notice" hidden><p>번역은 탐색을 돕기 위한 행사명·주제 요약입니다. 상세 예약·참여 조건과 공식 출처는 한국어 원문을 확인하세요.</p><details><summary>원문 상세 안내 · 한국어</summary><p data-original lang="ko">'+esc(e.title)+'</p><p data-original lang="ko">'+esc(e.program)+'</p></details></div>'+(pick?'<p class="highlight-explanation"><b>HOT · 주목할 행사</b><span>공식 규모·대표성에 근거한 편집 선정이며 실시간 인기 순위가 아닙니다.</span><a href="'+esc(pick.source)+'" target="_blank" rel="noopener noreferrer">선정 근거 보기 ↗</a></p>':'');
  const attribution=e.image?'<p class="modal-image-attribution">'+imageAttribution(e.image)+'</p>':'';
  return '<div class="modal-scroll-area"><div class="modal-cover theme-'+esc(e.theme)+'">'+eventImage(e,e.image)+'</div>'+attribution+
    '<div class="modal-heading"><p class="eyebrow">'+esc(e.region)+' · '+esc(themes[e.theme])+'</p><h2 id="dialog-title">'+esc(e.title)+'</h2><p>'+esc(e.program)+'</p><div class="tag-row keyword-tags">'+eventTags(e).map(word=>'<button data-keyword="'+esc(word)+'" aria-pressed="'+(word===keyword)+'">#'+esc(word)+'</button>').join('')+'</div><span class="verified-label">공식 출처 확인 '+esc(e.checkedAt)+'</span></div>'+
    translated+'<dl class="fact-grid">'+fields.map(([icon,label,value])=>'<div><dt><span aria-hidden="true">'+icon+'</span>'+label+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'+
    '<div class="modal-tabs" role="tablist" aria-label="상세안내">'+tabs.map(([id,label],index)=>'<button role="tab" id="modal-tab-'+id+'" aria-controls="modal-panel-'+id+'" aria-selected="'+(index===0)+'" tabindex="'+(index===0?0:-1)+'" data-modal-tab="'+id+'">'+label+'</button>').join('')+'</div>'+
    '<section class="modal-panel" role="tabpanel" id="modal-panel-schedule" aria-labelledby="modal-tab-schedule"><h3>언제, 어떻게 즐길까요?</h3><p>'+esc(e.program)+'</p>'+(e.dates?'<div class="date-pills">'+e.dates.map(date=>'<span>'+esc(date.replaceAll('-','.'))+'</span>').join('')+'</div>':'<p class="notice-box">'+esc(e.scheduleType==='period'?'개최기간 중 · 운영일 확인':'공식 공지의 개최 기간입니다.')+'</p>')+'<p>'+esc(e.scheduleNote||'날짜별 운영과 프로그램은 공식 공지에서 확인하세요.')+'</p><p>'+esc(e.familyNote||'참여 조건은 공식 안내를 확인하세요.')+'</p><p class="microcopy">상태: '+esc(statusLabel)+(stale?' · 확인 후 7일이 지나 변경 여부 재확인이 필요합니다.':'')+'</p></section>'+
    '<section class="modal-panel" role="tabpanel" id="modal-panel-booking" aria-labelledby="modal-tab-booking" hidden><h3>예약과 참여 조건</h3><p class="notice-box">'+esc(e.fee||feeLabel)+'</p><p>'+esc(e.booking||'예약 방법 확인 필요')+'</p><p>'+esc(e.familyNote||'참여 조건은 공식 안내를 확인하세요.')+'</p><p class="microcopy">예약 가능 여부·마감·취소는 실시간 정보가 아닙니다. 공식 운영처에서 최종 확인하세요.</p></section>'+
    '<section class="modal-panel" role="tabpanel" id="modal-panel-location" aria-labelledby="modal-tab-location" hidden><h3>찾아가는 곳</h3><p>'+esc(e.location)+'</p><a class="button secondary" target="_blank" rel="noopener noreferrer" href="https://map.naver.com/v5/search/'+encodeURIComponent(e.region+' '+e.location)+'">네이버 지도에서 장소 검색 ↗</a><p class="microcopy">주소 검색 링크입니다. 실제 행사장 위치·주차·교통 통제는 공식 공지를 확인하세요.</p></section>'+
    '<section class="modal-panel" role="tabpanel" id="modal-panel-sources" aria-labelledby="modal-tab-sources" hidden><h3>확인한 공식 안내</h3><div class="sources-list">'+e.sources.map(source=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(source.url)+'"><span>'+esc(source.publisher)+' · 확인 '+esc(source.checkedAt)+'</span><b>'+esc(source.title)+' ↗</b><small>'+esc(source.facts)+'</small></a>').join('')+'</div></section>'+
    '<p class="microcopy modal-disclaimer">이 사이트는 축제 주최·예약 대행사가 아닙니다. 출발 전 공식 안내에서 변경 여부를 확인하세요.</p></div>'+
    '<div class="modal-bottom"><a class="button primary" target="_blank" rel="noopener noreferrer" href="'+esc(e.sources[0].url)+'">공식 안내 확인 ↗</a><a class="button secondary" href="'+esc(e.url)+'">전체 상세보기</a><button class="button secondary" data-save="'+esc(e.id)+'" aria-pressed="false">♡ 일정 보관</button><button class="share-button" data-share="'+esc(e.id)+'" aria-label="이 축제 공유">↗</button></div>';
}
