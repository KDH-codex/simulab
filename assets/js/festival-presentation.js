import {escapeHtml as esc} from '../../tools/kids-outing-calendar/model.js';

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
export function eventImage(event,image,{hero=false,compact=false}={}) {
  if(!image)return themeArtwork(event);
  const context=image.kind==='context';
  const caption=context?(compact?'현장 사진 아님':'주제 참고 · 현장 사진 아님'):'이미지: '+image.credit;
  return '<img src="'+esc(image.src)+'" alt="'+esc(context?'주제 참고 사진 · 행사 현장 사진 아님':event.title)+'" '+(hero?'fetchpriority="high"':'loading="lazy"')+' decoding="async"><span class="image-credit'+(compact?' compact-credit':'')+'"'+(context?' title="주제 참고 사진 · 행사 현장 사진 아님"':'')+'>'+esc(caption)+'</span>';
}
export function activeConditions(state,defaultPeriod='upcoming') {
  const rows=[];
  if(state.keyword)rows.push({key:'keyword',label:'#'+state.keyword,removable:true});
  if(state.free)rows.push({key:'free',label:'입장·기본참여 무료',removable:true});
  if(state.saved)rows.push({key:'saved',label:'보관한 일정',removable:true});
  if(['weekend','today'].includes(state.period))rows.push({key:'period',label:state.period==='today'?'오늘':'이번 주말',removable:state.period!==defaultPeriod});
  return rows;
}
export function detailTagDestination(page,keyword) {
  return page==='detail'?'/?tag='+encodeURIComponent(keyword)+'#discover':null;
}
