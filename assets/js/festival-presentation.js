import {escapeHtml as esc} from '../../tools/kids-outing-calendar/model.js';
import {highlightBadge} from './festival-highlights.js';
import {PRESET_LABELS,CATEGORY_LABELS,eventCategoryOf,isIndoorVenue,hasAdvanceBooking} from './festival-ui-model.js';

const themes={light:'빛이 머무는 밤',nature:'계절을 만나는 시간',food:'맛있는 주말의 발견',kids:'새로운 경험 한 조각'};
const drawings={
  light:'<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M120 30v22m0 76v22M60 90H38m164 0h-22M77 47l16 16m54 54 16 16M77 133l16-16m54-54 16-16"/><circle cx="120" cy="90" r="23"/><path d="M120 72v36m-18-18h36M56 136v14m-7-7h14M183 37v14m-7-7h14"/></g>',
  nature:'<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M120 144V94m0 28c-37 0-54-18-54-38 34 0 54 16 54 38Zm0-14c33 0 52-20 52-43-35 0-52 20-52 43Z"/><path d="M120 85c-30-18-32-38-14-48l14 13 14-13c18 10 16 30-14 48Z"/><circle cx="51" cy="50" r="5"/><path d="m184 116 6 6m0-6-6 6"/></g>',
  food:'<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M65 89h110c-2 34-25 51-55 51S67 123 65 89Zm-6 0h122M91 148h58M96 69c-14-13 10-18 0-32m25 32c-14-13 10-18 0-32m25 32c-14-13 10-18 0-32"/><path d="M48 56v12m-6-6h12m130 75v12m-6-6h12"/></g>',
  kids:'<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m120 36 17 34 38 6-27 27 6 38-34-18-34 18 6-38-27-27 38-6Z"/><path d="M53 32v16m-8-8h16m131 82v16m-8-8h16"/><circle cx="182" cy="43" r="5"/><circle cx="52" cy="136" r="4"/></g>'
};
export function themeArtwork(event) {
  const theme=Object.hasOwn(themes,event.theme)?event.theme:'kids';
  return '<div class="festival-artwork artwork-'+theme+'" aria-hidden="true"><span class="artwork-orbit"></span><span class="artwork-orbit second"></span><svg viewBox="0 0 240 180" focusable="false">'+drawings[theme]+'</svg><span class="artwork-copy">'+themes[theme]+'</span><span class="artwork-place">'+esc(event.region)+' · '+esc(event.startDate.slice(5).replace('-','.'))+'</span></div><span class="illustration-label">테마 일러스트</span>';
}
export function imageCaption(image,{compact=false}={}) {
  if(!image)return '테마 일러스트';
  if(image.kind==='generated')return compact?'AI 생성 이미지':'AI 생성 이미지 · 현장 사진 아님';
  if(image.caption)return image.caption;
  if(image.kind==='context')return compact?'현장 사진 아님':'주제 참고 · 현장 사진 아님';
  if(image.kind==='poster')return '공식 포스터 · '+image.credit;
  return '이미지: '+image.credit;
}

export function imageAttribution(image) {
  if(!image)return '';
  const posterLink=image.officialPosterUrl?' · <a href="'+esc(image.officialPosterUrl)+'" target="_blank" rel="noopener noreferrer">공식 포스터 원문 ↗</a>':'';
  if(image.kind==='generated')return '행사 주제를 바탕으로 만든 AI 참고 이미지입니다. 실제 행사나 장소를 촬영한 사진이 아닙니다.'+posterLink;
  return '이미지: <a href="'+esc(image.creditUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(image.credit)+'</a> · <a href="'+esc(image.licenseUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(image.licenseLabel||'이용 조건')+'</a>'+(image.changes?' · '+esc(image.changes):'')+posterLink;
}

export function eventImage(event,image,{hero=false,compact=false}={}) {
  if(!image)return themeArtwork(event)+highlightBadge(event);
  const fullCaption=imageCaption(image);
  const descriptiveAlt=image.alt?image.alt+' · '+fullCaption:image.kind==='context'?'주제 참고 사진 · 행사 현장 사진 아님':image.kind==='generated'?fullCaption:event.title;
  const posterClass=image.kind==='poster'?' class="official-poster-image"':'';
  return '<img'+posterClass+' src="'+esc(image.src)+'" alt="'+esc(descriptiveAlt)+'" '+(hero?'fetchpriority="high"':'loading="lazy"')+' decoding="async"><span class="image-credit'+(compact?' compact-credit':'')+'" title="'+esc(fullCaption)+'">'+esc(imageCaption(image,{compact}))+'</span>'+highlightBadge(event);
}

export function miniEvent(event, {url, image, status, dates, theme}) {
  return '<a href="'+esc(url)+'" data-preview="'+esc(event.id)+'" class="mini-event">'+
    '<div class="mini-image theme-'+esc(event.theme)+'">'+eventImage(event,image,{compact:true})+
    '<span class="mini-badge">'+esc(status)+'</span></div>'+
    '<div class="mini-copy"><small>'+esc(event.region)+' · '+esc(theme)+'</small>'+
    '<h3>'+esc(event.title)+'</h3><p>'+esc(event.program)+'</p>'+
    '<strong>'+esc(dates)+' <span aria-hidden="true">↗</span></strong></div></a>';
}
export function activeConditions(state,defaultPeriod='upcoming',defaultCategory='all') {
  const rows=[];
  if(state.category&&state.category!=='all'&&state.category!==defaultCategory&&Object.hasOwn(CATEGORY_LABELS,state.category))rows.push({key:'category',label:CATEGORY_LABELS[state.category],removable:true});
  if(state.keyword)rows.push({key:'keyword',label:'#'+state.keyword,removable:true});
  if(state.free)rows.push({key:'free',label:'입장·기본참여 무료',removable:true});
  if(state.saved)rows.push({key:'saved',label:'보관한 일정',removable:true});
  if(['weekend','today'].includes(state.period))rows.push({key:'period',label:state.period==='today'?'오늘':'이번 주말',removable:state.period!==defaultPeriod});
  // 빠른 조건(실내·이번 주 마감·사전신청)이 켜져 있으면 상단 고정 바에도 해제 가능한 배지로 표시합니다.
  if(state.preset&&Object.hasOwn(PRESET_LABELS,state.preset))rows.push({key:'preset',label:PRESET_LABELS[state.preset],removable:true});
  return rows;
}
export function detailTagDestination(page,keyword) {
  return page==='detail'?'/?tag='+encodeURIComponent(keyword)+'#discover':null;
}

/**
 * 홈 스마트 컨시어지 패널 내부에 01~03 넘버링과 함께 띄워주는 입체 추천 카드 마크업입니다.
 */
export function conciergeCardMarkup(event,index,{image,statusLabel,dateLabel,feeText,saved=false}={}) {
  const url=event.url||'/events/'+encodeURIComponent(event.id)+'/';
  const num=String(index+1).padStart(2,'0');
  const id=esc(event.id);
  return '<article class="concierge-card" data-card-id="'+id+'">'+
    '<a class="concierge-card-visual theme-'+esc(event.theme)+'" href="'+esc(url)+'" data-preview="'+id+'">'+
      eventImage(event,image,{compact:true})+
      '<span class="concierge-rank">'+num+'</span>'+
      '<span class="status-badge">'+esc(statusLabel)+'</span>'+
    '</a>'+
    '<div class="concierge-card-body">'+
      '<p class="place-label">⌖ '+esc(event.region)+' · <span data-original lang="ko">'+esc(event.location)+'</span></p>'+
      '<h3><a href="'+esc(url)+'" data-preview="'+id+'">'+esc(event.title)+'</a></h3>'+
      '<p class="concierge-card-meta"><span>▦ '+esc(dateLabel)+'</span><strong>'+esc(feeText)+'</strong></p>'+
      '<div class="concierge-card-foot">'+
        '<button type="button" class="quiet-button" data-save="'+id+'" aria-pressed="'+saved+'">'+(saved?'♥ 보관됨':'♡ 일정 보관')+'</button>'+
        '<a class="text-link" href="'+esc(url)+'" data-preview="'+id+'">상세보기 ↗</a>'+
      '</div>'+
    '</div>'+
  '</article>';
}

/**
 * 보관하거나 URL(?picks=)로 공유받은 축제 후보들을 한눈에 나란히 비교하는 표 마크업입니다.
 */
export function sharedPicksBoardMarkup(items,{statusFn,feeFn,isIndoorFn}={}) {
  const cols=items.map(e=>{
    const url=e.url||'/events/'+encodeURIComponent(e.id)+'/';
    const id=esc(e.id);
    return '<th scope="col"><div class="picks-col-head">'+
      '<a class="picks-col-thumb theme-'+esc(e.theme)+'" href="'+esc(url)+'" data-preview="'+id+'">'+eventImage(e,e.image,{compact:true})+'</a>'+
      '<a class="picks-col-title" href="'+esc(url)+'" data-preview="'+id+'">'+esc(e.title)+'</a>'+
      '<button type="button" class="picks-col-remove" data-remove-pick="'+id+'">목록에서 빼기</button>'+
    '</div></th>';
  }).join('');
  const row=(label,cellFn)=>'<tr><th scope="row">'+esc(label)+'</th>'+items.map(e=>'<td>'+cellFn(e)+'</td>').join('')+'</tr>';
  return '<div class="picks-board-head">'+
    '<div><p class="eyebrow">SHARED PICKS BOARD</p><h2>💌 함께 고르는 주말 나들이 후보 <b class="picks-count-pill">'+items.length+'</b></h2><p>기간·장소·실내 여부·비용·예약 조건을 한눈에 비교하고 일행에게 공유해 보세요.</p></div>'+
    '<div class="picks-board-actions">'+
      '<button type="button" class="button primary" data-share-picks>💬 비교 링크 공유</button>'+
      '<button type="button" class="button secondary" data-copy-course-text>📋 카톡·블로그 요약 복사</button>'+
      '<button type="button" class="button secondary" data-save-all-picks>♡ 내 보관함에 모두 담기</button>'+
      '<button type="button" class="quiet-button" data-close-picks-board>닫기 ×</button>'+
    '</div>'+
  '</div>'+
  '<div class="picks-compare-wrap"><table class="picks-compare-table"><thead><tr><th scope="col">비교 항목</th>'+cols+'</tr></thead><tbody>'+
    row('운영 기간',e=>'<strong>'+esc(e.startDate.slice(5).replace('-','.'))+(e.startDate===e.endDate?'':' — '+esc(e.endDate.slice(5).replace('-','.')))+'</strong><span class="picks-status-tag">'+esc(statusFn(e))+'</span>')+
    row('지역 · 장소',e=>'<span>'+esc(e.region)+' · <span data-original lang="ko">'+esc(e.location)+'</span></span>'+(isIndoorFn(e)?'<span class="indoor-chip">🏛 실내 시설</span>':''))+
    row('입장·참여 비용',e=>'<span>'+esc(e.fee||feeFn(e))+'</span>')+
    row('예약 · 시간',e=>'<span>'+esc(e.booking||'공식 안내 확인')+'</span><small class="picks-time-note">'+esc(e.time||'시간 확인 필요')+'</small>')+
    row('일정 담기',e=>'<div class="picks-cell-actions"><button type="button" class="quiet-button" data-calendar-ics="'+esc(e.id)+'">📅 폰 달력 저장</button><a class="text-link" href="'+esc(e.url||'/events/'+encodeURIComponent(e.id)+'/')+'" data-preview="'+esc(e.id)+'">상세보기 ↗</a></div>')+
  '</tbody></table></div>';
}

/**
 * 카드 상단 요약 아래에 실내 여부, 사전신청, 운영시간 등 방문 전 핵심 힌트 칩(최대 3개)을 생성합니다.
 */
export function cardQuickFacts(event) {
  const chips=[];
  const cat=eventCategoryOf(event);
  if(cat==='exhibition')chips.push('<span class="fact-chip fact-exhibition">🖼️ 전시·박람회</span>');
  else if(cat==='indoor')chips.push('<span class="fact-chip fact-indoor">🏛 실내 체험·기관</span>');
  else if(isIndoorVenue(event))chips.push('<span class="fact-chip">🏛 실내 시설</span>');
  if(hasAdvanceBooking(event))chips.push('<span class="fact-chip">📝 사전신청 안내</span>');
  const rawTime=String(event.time||'').trim();
  if(rawTime&&!/확인 필요|추후 안내|미기재/.test(rawTime)){
    const shortTime=rawTime.split('·')[0].split('(')[0].trim();
    if(shortTime&&shortTime.length<=24)chips.push('<span class="fact-chip fact-time">◷ <span data-original lang="ko">'+esc(shortTime)+'</span></span>');
  }
  return chips.length?'<div class="card-quick-facts">'+chips.slice(0,3).join('')+'</div>':'';
}
