import {koreaToday, shiftDate, weekendRange, overlaps, occursOn, nextDate, eventStatus, escapeHtml as esc, isStale} from '/tools/kids-outing-calendar/model.js';

const data=JSON.parse(document.getElementById('festival-data')?.textContent || '[]');
const byId=new Map(data.map(e=>[e.id,e]));
const today=koreaToday();
const page=document.body.dataset.festivalPage;
const $=id=>document.getElementById(id);
const params=new URL(location.href).searchParams;
const labels={light:'✦ 불꽃·야경',food:'◒ 먹거리·수확',nature:'❋ 꽃·자연',kids:'✳ 체험·문화'};
const regionNames=['서울','경기지역','강원지역','충청지역','전라지역','경상지역','제주지역'];
const state={region:regionNames.includes(params.get('region'))?params.get('region'):'all',theme:Object.hasOwn(labels,params.get('theme'))?params.get('theme'):'all',period:page==='calendar'?'month':page==='weekend'?'weekend':'upcoming',free:false,saved:params.get('saved')==='1',sort:'start',limit:9};
const storageKey='thisweekfestival.saved.v1';
let saved=[];
try {const parsed=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(parsed))saved=[...new Set(parsed.filter(id=>typeof id==='string'&&byId.has(id)))];} catch {}
const fmt=d=>d.slice(5).replace('-','.');
const range=e=>e.startDate===e.endDate?fmt(e.startDate):fmt(e.startDate)+' — '+fmt(e.endDate);
const dayLabel=d=>new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'long',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'));
const fee=e=>({free:'입장·기본참여 무료',mixed:'일부 유료',paid:'유료',unknown:'요금 확인 필요'}[e.feeStatus] || '요금 확인 필요');
function status(e) {
  if(e.endDate<today)return '종료된 일정';
  if(e.startDate<=today) return eventStatus(e,today)==='예정'?'다음 운영 '+fmt(nextDate(e,today)):eventStatus(e,today);
  return 'D-'+Math.round((new Date(e.startDate+'T00:00:00Z')-new Date(today+'T00:00:00Z'))/86400000);
}
function imageMarkup(e,hero=false) {
  const im=e.image;
  return im?'<img src="'+esc(im.src)+'" alt="'+esc(im.kind==='context'?'주제 참고 사진 · 행사 현장 사진 아님':e.title)+'" '+(hero?'':'loading="lazy"')+' decoding="async"><span class="image-credit">'+esc(im.kind==='context'?'주제 참고 · 현장 사진 아님':'이미지: '+im.credit)+'</span>':'<span class="art-firework" aria-hidden="true">✳</span><span class="illustration-label">축제 테마 일러스트</span>';
}
function card(e) {
  return '<article class="festival-card" data-card-id="'+esc(e.id)+'"><div class="card-visual theme-'+esc(e.theme)+'"><a href="'+esc(e.url)+'" data-preview="'+esc(e.id)+'" aria-label="'+esc(e.title)+' 상세안내">'+imageMarkup(e)+'<span class="status-badge">'+esc(status(e))+'</span><span class="picture-date">▦ '+esc(range(e))+'</span></a><button class="save-button" data-save="'+esc(e.id)+'" aria-label="'+esc(e.title)+' 보관" aria-pressed="false">♡</button></div><div class="card-content"><p class="place-label">⌖ '+esc(e.region)+' · '+esc(e.location)+'</p><h3><a href="'+esc(e.url)+'" data-preview="'+esc(e.id)+'">'+esc(e.title)+'</a></h3><p class="card-description">'+esc(e.program)+'</p><div class="tag-row"><span>'+esc(labels[e.theme])+'</span><span>'+esc(e.dates?'운영일 지정':e.scheduleType==='period'?'기간 내 운영일 확인':'개최 일정')+'</span></div><div class="card-bottom"><div><small>입장·참여 비용</small><strong>'+esc(fee(e))+'</strong></div><a href="'+esc(e.url)+'" class="detail-button" data-preview="'+esc(e.id)+'">상세보기 ↗</a></div></div></article>';
}
let toastTimer;
function toast(message) {
  const el=$('festival-toast');if(!el)return;
  el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3200);
}
function syncSaved() {
  document.querySelectorAll('[data-saved-count]').forEach(el=>el.textContent=saved.length);
  document.querySelectorAll('[data-save]').forEach(b=>{
    const has=saved.includes(b.dataset.save);
    b.setAttribute('aria-pressed',String(has));
    b.classList.toggle('is-saved',has);
    b.textContent=b.classList.contains('save-button')?(has?'♥':'♡'):(has?'♥ 보관됨':'♡ 일정 보관');
  });
}
function selection(e,{ignoreRegion=false,ignoreTheme=false}={}) {
  return (ignoreRegion||state.region==='all'||e.group===state.region)&&(ignoreTheme||state.theme==='all'||e.theme===state.theme)&&(!state.free||e.feeStatus==='free')&&(!state.saved||saved.includes(e.id));
}
function periodRange() {
  if(state.period==='weekend')return weekendRange(today);
  if(state.period==='today')return {start:today,end:today};
  return {start:today,end:shiftDate(today,60)};
}
function syncPills(pool) {
  document.querySelectorAll('[data-region]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.region===state.region)));
  document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===state.theme)));
  document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.period===state.period)));
  document.querySelectorAll('[data-sort]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sort===state.sort)));
  const counts=pool.filter(e=>selection(e,{ignoreRegion:true}));
  document.querySelectorAll('[data-region-count]').forEach(el=>el.textContent=el.dataset.regionCount==='all'?counts.length:counts.filter(e=>e.group===el.dataset.regionCount).length);
  document.querySelectorAll('[data-map-count]').forEach(el=>el.textContent=counts.filter(e=>e.group===el.dataset.mapCount).length);
  if($('only-free'))$('only-free').checked=state.free;
  $('saved-only')?.setAttribute('aria-pressed',String(state.saved));
}
function renderGrid() {
  const r=periodRange();
  const pool=data.filter(e=>overlaps(e,r.start,r.end));
  const filtered=pool.filter(e=>selection(e)).sort((a,b)=>(state.sort==='end'?a.endDate.localeCompare(b.endDate):nextDate(a,r.start).localeCompare(nextDate(b,r.start))) || a.title.localeCompare(b.title,'ko'));
  const el=$('event-cards');if(!el)return;
  el.innerHTML=filtered.slice(0,state.limit).map(card).join('');
  $('empty-state').hidden=filtered.length>0;
  $('load-more').hidden=filtered.length<=state.limit;
  $('result-title').textContent=(state.saved?'보관한 축제':state.region==='all'?'전국 축제 모아보기':state.region+' 축제 모아보기');
  $('result-summary').textContent=(state.period==='weekend'?'이번 주말':state.period==='today'?'오늘':'앞으로 60일')+' · '+r.start.replaceAll('-','.')+' — '+fmt(r.end)+' · 수록 일정 '+filtered.length+'건';
  syncPills(pool);syncSaved();
}
function updateURL() {
  const url=new URL(location.href);
  for(const [key,val,empty] of [['region',state.region,'all'],['theme',state.theme,'all'],['saved',state.saved?'1':'','']]){if(val!==empty)url.searchParams.set(key,val);else url.searchParams.delete(key);}
  history.replaceState(null,'',url);
}
const weekend=weekendRange(today);
let shown=today.slice(0,7)+'-01';
let selected={start:today,end:today};
let selectedWeek=null;
const monthBounds=()=>{
  const start=shown;
  const next=new Date(start+'T00:00:00Z');next.setUTCMonth(next.getUTCMonth()+1);
  return {start,end:shiftDate(next.toISOString().slice(0,10),-1)};
};
function calendarPool() {
  const r=monthBounds();return data.filter(e=>overlaps(e,r.start,r.end));
}
function renderCalendar() {
  const r=monthBounds();
  const pool=calendarPool();
  const list=pool.filter(e=>selection(e));
  $('month-title').textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(shown+'T00:00:00Z'));
  const offset=new Date(shown+'T00:00:00Z').getUTCDay();
  const cells=[];
  for(let i=0;i<offset;i++)cells.push('<div class="calendar-spacer" aria-hidden="true"></div>');
  for(let d=shown;d<=r.end;d=shiftDate(d,1)){
    const items=list.filter(e=>occursOn(e,d));
    const isSelected=selected&&d>=selected.start&&d<=selected.end;
    cells.push('<button class="calendar-day'+(d===today?' is-today':'')+(isSelected?' is-selected':'')+'" data-day="'+d+'" aria-pressed="'+!!isSelected+'" aria-label="'+esc(dayLabel(d))+' · 수록 '+items.length+'건"><span class="day-number">'+Number(d.slice(8))+(d===today?'<small>오늘</small>':'')+'</span><span class="day-events">'+items.slice(0,2).map(e=>'<span class="day-event theme-'+e.theme+'">'+(e.scheduleType==='period'?'◇ ':'')+esc(e.title.replace(/^2026\s*/,'').slice(0,14))+'</span>').join('')+(items.length>2?'<small>+'+(items.length-2)+'개 더</small>':'')+'</span><span class="mobile-day-count">'+(items.length?items.length+'건':'')+'</span></button>');
  }
  $('calendar-grid').innerHTML=cells.join('');
  const weeks=[];
  for(let start=shiftDate(shown,-offset),i=1;start<=r.end;start=shiftDate(start,7),i++){
    const end=shiftDate(start,6);const count=list.filter(e=>overlaps(e,start,end)).length;
    weeks.push('<button data-week-start="'+start+'" data-week-end="'+end+'" aria-pressed="'+(selectedWeek===start)+'"><span><b>'+i+'주차</b><small>'+fmt(start)+' — '+fmt(end)+'</small></span><em>'+count+'건</em></button>');
  }
  $('week-choices').innerHTML=weeks.join('');
  const chosen=selected||r;
  const results=list.filter(e=>overlaps(e,chosen.start,chosen.end)).sort((a,b)=>nextDate(a,chosen.start).localeCompare(nextDate(b,chosen.start)));
  $('selected-day-title').textContent=selected?(chosen.start===chosen.end?dayLabel(chosen.start)+'의 축제':fmt(chosen.start)+' — '+fmt(chosen.end)+' 축제'):'이 달의 수록 축제';
  $('calendar-result-summary').textContent='수록 일정 '+results.length+'건 · ◇ 기간형 공지는 실제 운영일 확인이 필요합니다.';
  $('calendar-results').innerHTML=results.length?results.map(card).join(''):'<div class="empty-state"><h3>이 조건에서 수록된 일정이 없어요</h3><p>다른 날짜나 지역을 선택해 보세요. 공식 공지를 검토한 자료부터 수록합니다.</p></div>';
  $('theme-feeds').innerHTML=Object.entries(labels).map(([id,label])=>{
    const rows=list.filter(e=>e.theme===id);
    return rows.length?'<section class="theme-feed"><h3>'+esc(label)+' <small>'+rows.length+'건</small></h3><div class="horizontal-feed">'+rows.map(card).join('')+'</div></section>':'';
  }).join('');
  syncPills(pool);syncSaved();
}
function reset() {
  Object.assign(state,{region:'all',theme:'all',free:false,saved:false,period:page==='weekend'?'weekend':'upcoming',sort:'start',limit:9});
  selected=null;selectedWeek=null;updateURL();render();
}
function render(){if(page==='calendar')renderCalendar();else renderGrid();}

// Explicit user controls only: the hero does not auto-advance while being read.
const upcoming=data.filter(e=>overlaps(e,today,shiftDate(today,60))).sort((a,b)=>nextDate(a,today).localeCompare(nextDate(b,today))||a.title.localeCompare(b.title,'ko'));
const heroes=[...upcoming.filter(e=>e.theme==='light'&&e.image),...upcoming].filter((e,i,a)=>a.indexOf(e)===i).slice(0,3);
let heroIndex=0;
function setHero(index) {
  if(!heroes.length)return;heroIndex=(index+heroes.length)%heroes.length;
  const e=heroes[heroIndex];const container=document.querySelector('[data-hero-image]');if(!container)return;
  container.innerHTML=imageMarkup(e,true);
  document.querySelector('[data-hero-title]').textContent=e.title;
  document.querySelector('[data-hero-meta]').textContent='▦ '+range(e)+'　⌖ '+e.region;
  document.querySelector('[data-hero-description]').textContent=e.program;
  const link=document.querySelector('[data-hero-detail]');link.href=e.url;link.dataset.preview=e.id;
  $('hero-position').textContent=String(heroIndex+1).padStart(2,'0')+' / '+String(heroes.length).padStart(2,'0');
  document.querySelectorAll('[data-hero-slide]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.heroSlide)===heroIndex)));
}

const dialog=$('festival-dialog');
let dialogOpener=null;
function openPreview(e,opener) {
  if(!dialog?.showModal){location.href=e.url;return;}
  dialogOpener=opener;
  const im=e.image;
  const fields=[['▦','기간',e.startDate.replaceAll('-','.')+' — '+fmt(e.endDate)],['◷','시간',e.time||'공식 안내 확인'],['◈','비용',e.fee||fee(e)],['⌖','장소',e.location]];
  $('dialog-content').innerHTML='<div class="modal-heading"><p class="eyebrow">'+esc(e.region)+' · '+esc(labels[e.theme])+'</p><h2 id="dialog-title">'+esc(e.title)+'</h2><p>'+esc(e.program)+'</p><span class="verified-label">공식 출처 확인 '+esc(e.checkedAt)+'</span></div><dl class="fact-grid">'+fields.map(([ic,label,val])=>'<div><dt><span aria-hidden="true">'+ic+'</span>'+label+'</dt><dd>'+esc(val)+'</dd></div>').join('')+'</dl><div class="modal-tabs" role="tablist" aria-label="상세안내"><button role="tab" id="modal-tab-schedule" aria-controls="modal-panel-schedule" aria-selected="true" data-modal-tab="schedule">일정·프로그램</button><button role="tab" id="modal-tab-booking" aria-controls="modal-panel-booking" aria-selected="false" tabindex="-1" data-modal-tab="booking">예약·비용</button><button role="tab" id="modal-tab-sources" aria-controls="modal-panel-sources" aria-selected="false" tabindex="-1" data-modal-tab="sources">공식 출처</button></div><section class="modal-panel" role="tabpanel" id="modal-panel-schedule" aria-labelledby="modal-tab-schedule"><div class="modal-program"><div><h3>실제 운영일을 확인하세요</h3>'+(e.dates?'<div class="date-pills">'+e.dates.map(d=>'<span>'+d.replaceAll('-','.')+'</span>').join(''):'<p class="notice-box">'+esc(e.scheduleType==='period'?'개최기간 중 · 운영일 확인':'공식 공지의 개최 기간입니다.')+'</p>')+'<p>'+esc(e.scheduleNote||'날짜별 운영과 프로그램은 공식 공지에서 확인하세요.')+'</p><p>'+esc(e.familyNote||'참여 조건은 공식 안내를 확인하세요.')+'</p><p class="microcopy">상태: '+esc(status(e))+(isStale(e.checkedAt,today)?' · 확인 후 7일이 지나 변경 여부 재확인이 필요합니다.':'')+'</p></div><figure><div class="modal-image theme-'+esc(e.theme)+'">'+imageMarkup(e)+'</div>'+(im?'<figcaption>이미지: <a target="_blank" rel="noopener noreferrer" href="'+esc(im.creditUrl)+'">'+esc(im.credit)+'</a> · <a target="_blank" rel="noopener noreferrer" href="'+esc(im.licenseUrl)+'">이용 조건</a></figcaption>':'')+'</figure></div></section><section class="modal-panel" role="tabpanel" id="modal-panel-booking" aria-labelledby="modal-tab-booking" hidden><h3>예약과 참여 조건</h3><p class="notice-box">'+esc(e.fee||fee(e))+'</p><p>'+esc(e.booking||'예약 방법 확인 필요')+'</p><p>'+esc(e.familyNote)+'</p><p class="microcopy">예약 가능 여부·마감·취소는 실시간 정보가 아닙니다. 공식 운영처에서 최종 확인하세요.</p></section><section class="modal-panel" role="tabpanel" id="modal-panel-sources" aria-labelledby="modal-tab-sources" hidden><h3>확인한 공식 안내</h3><div class="sources-list">'+e.sources.map(s=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(s.url)+'"><span>'+esc(s.publisher)+' · 확인 '+esc(s.checkedAt)+'</span><b>'+esc(s.title)+' ↗</b><small>'+esc(s.facts)+'</small></a>').join('')+'</div></section><div class="modal-bottom"><a class="button primary" target="_blank" rel="noopener noreferrer" href="'+esc(e.sources[0].url)+'">공식 안내 확인 ↗</a><a class="button secondary" href="'+esc(e.url)+'">전체 상세보기</a><button class="button secondary" data-save="'+esc(e.id)+'" aria-pressed="false">♡ 일정 보관</button><button class="share-button" data-share="'+esc(e.id)+'" aria-label="이 축제 공유">↗</button></div><p class="microcopy modal-disclaimer">이 사이트는 축제 주최·예약 대행사가 아닙니다. 정보 변경 가능성이 있으므로 출발 전 공식 안내를 확인하세요.</p>';
  syncSaved();dialog.showModal();document.body.classList.add('modal-open');
}
function closePreview(){dialog.close();}
dialog?.addEventListener('close',()=>{document.body.classList.remove('modal-open');dialogOpener?.focus();});
dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePreview();}});
function selectModalTab(id,focus=false) {
  document.querySelectorAll('[data-modal-tab]').forEach(b=>{const on=b.dataset.modalTab===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus();});
  ['schedule','booking','sources'].forEach(key=>{$('modal-panel-'+key).hidden=key!==id;});
}
document.addEventListener('keydown',event=>{
  const b=event.target.closest?.('[data-modal-tab]');if(!b)return;
  const keys=['schedule','booking','sources'];let i=keys.indexOf(b.dataset.modalTab);
  if(event.key==='ArrowRight')i=(i+1)%3;else if(event.key==='ArrowLeft')i=(i+2)%3;else if(event.key==='Home')i=0;else if(event.key==='End')i=2;else return;
  event.preventDefault();selectModalTab(keys[i],true);
});
document.addEventListener('click',async event=>{
  const b=event.target.closest('button,a');if(!b)return;
  if(b.hasAttribute('data-save')){
    const id=b.dataset.save;if(!byId.has(id))return;
    saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];
    let persisted=true;try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{persisted=false;}
    syncSaved();if(state.saved&&!dialog?.open)render();
    toast(persisted?(saved.includes(id)?'이 기기의 보관함에 저장했어요.':'보관함에서 꺼냈어요.'):'이 화면에서만 보관됩니다. 브라우저 저장 공간을 사용할 수 없어요.');return;
  }
  if(b.dataset.preview && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button===0){const e=byId.get(b.dataset.preview);if(e){event.preventDefault();openPreview(e,b);}return;}
  if(b.hasAttribute('data-close-dialog')){closePreview();return;}
  if(b.dataset.modalTab){selectModalTab(b.dataset.modalTab);return;}
  if(b.dataset.share){
    const e=byId.get(b.dataset.share);if(!e)return;
    const url=new URL(e.url,location.origin).href;
    try{if(navigator.share){await navigator.share({title:e.title,url});}else{await navigator.clipboard.writeText(url);toast('축제 링크를 복사했어요.');}}catch(error){if(error.name!=='AbortError')toast('공유하지 못했어요. 상세 페이지 주소를 복사해 주세요.');}return;
  }
  if(b.hasAttribute('data-region')){state.region=b.dataset.region;state.limit=9;updateURL();render();return;}
  if(b.hasAttribute('data-theme')){state.theme=b.dataset.theme;state.limit=9;updateURL();render();return;}
  if(b.hasAttribute('data-sort')){state.sort=b.dataset.sort;render();return;}
  if(b.hasAttribute('data-period')){
    state.period=b.dataset.period;state.limit=9;
    if(page==='calendar'){const r=periodRange();shown=today.slice(0,7)+'-01';selected=['upcoming','month'].includes(state.period)?null:r;selectedWeek=null;}
    render();return;
  }
  if(b.hasAttribute('data-day')){selected={start:b.dataset.day,end:b.dataset.day};selectedWeek=null;renderCalendar();return;}
  if(b.hasAttribute('data-week-start')){selected={start:b.dataset.weekStart,end:b.dataset.weekEnd};selectedWeek=b.dataset.weekStart;renderCalendar();return;}
  if(b.hasAttribute('data-hero-slide')){setHero(Number(b.dataset.heroSlide));return;}
  if(b.id==='hero-prev'){setHero(heroIndex-1);return;}
  if(b.id==='hero-next'){setHero(heroIndex+1);return;}
  if(b.id==='load-more'){state.limit+=9;render();return;}
  if(b.id==='saved-only'){state.saved=!state.saved;state.limit=9;updateURL();render();return;}
  if(b.id==='reset-filters'||b.hasAttribute('data-reset-empty')){reset();return;}
  if(b.id==='month-prev'||b.id==='month-next'){
    const d=new Date(shown+'T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+(b.id==='month-next'?1:-1));shown=d.toISOString().slice(0,10);selected=null;selectedWeek=null;state.period='month';renderCalendar();return;
  }
  if(b.id==='calendar-today'){shown=today.slice(0,7)+'-01';selected={start:today,end:today};selectedWeek=null;state.period='today';renderCalendar();return;}
  if(b.id==='clear-calendar-selection'){selected=null;selectedWeek=null;state.period='month';renderCalendar();}
});
$('only-free')?.addEventListener('change',e=>{state.free=e.target.checked;state.limit=9;render();});
window.addEventListener('storage',e=>{if(e.key!==storageKey)return;try{const v=JSON.parse(e.newValue||'[]');saved=Array.isArray(v)?[...new Set(v.filter(id=>byId.has(id)))]:[];}catch{saved=[];}syncSaved();if(state.saved)render();});
if(page==='calendar')renderCalendar();else if($('event-cards'))renderGrid();
syncSaved();
