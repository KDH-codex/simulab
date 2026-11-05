import {eventTags,matchesKeyword,weekRangeFor,weekDays,weeklyEvents,eventsForDay,dayMilestone,toggleDaySelection} from './festival-ui-model.js';
import {WEATHER_STATIONS} from './festival-weather-model.js';
import {modalMarkup,modalTabIds} from './festival-modal.js';
import {eventImage,activeConditions,detailTagDestination} from './festival-presentation.js';
import {setupHeadingMotion} from './festival-heading-motion.js';
import {koreaToday, shiftDate, weekendRange, overlaps, occursOn, nextDate, eventStatus, escapeHtml as esc, isStale} from '/tools/kids-outing-calendar/model.js';

const data=JSON.parse(document.getElementById('festival-data')?.textContent || '[]');
const byId=new Map(data.map(e=>[e.id,e]));
const today=koreaToday();
const page=document.body.dataset.festivalPage;
const $=id=>document.getElementById(id);
const params=new URL(location.href).searchParams;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const labels={light:'✦ 불꽃·야경',food:'◒ 먹거리·수확',nature:'❋ 꽃·자연',kids:'✳ 체험·문화'};
const regionNames=['서울','경기지역','강원지역','충청지역','전라지역','경상지역','제주지역'];
const defaultPeriod=page==='calendar'?'month':page==='weekend'?'weekend':'upcoming';
const allowedPeriods=page==='calendar'?['month','weekend','today']:['upcoming','weekend','today'];
const state={region:regionNames.includes(params.get('region'))?params.get('region'):'all',theme:Object.hasOwn(labels,params.get('theme'))?params.get('theme'):'all',period:allowedPeriods.includes(params.get('period'))?params.get('period'):defaultPeriod,keyword:(params.get('tag')||'').slice(0,40),free:params.get('free')==='1',saved:params.get('saved')==='1',sort:'start',limit:9};
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
  return eventImage(e,e.image,{hero});
}
function card(e) {
  return '<article class="festival-card" data-card-id="'+esc(e.id)+'"><div class="card-visual theme-'+esc(e.theme)+'"><a href="'+esc(e.url)+'" data-preview="'+esc(e.id)+'" aria-label="'+esc(e.title)+' 상세안내">'+imageMarkup(e)+'<span class="status-badge">'+esc(status(e))+'</span><span class="picture-date">▦ '+esc(range(e))+'</span></a><button class="save-button" data-save="'+esc(e.id)+'" aria-label="'+esc(e.title)+' 보관" aria-pressed="false">♡</button></div><div class="card-content"><p class="place-label">⌖ '+esc(e.region)+' · '+esc(e.location)+'</p><h3><a href="'+esc(e.url)+'" data-preview="'+esc(e.id)+'">'+esc(e.title)+'</a></h3><p class="card-description">'+esc(e.program)+'</p>'+keywordTags(e)+(e.scheduleType==='period'?'<p class="card-schedule-note">기간 내 운영일 확인</p>':'')+'<div class="card-bottom"><div><small>입장·참여 비용</small><strong>'+esc(fee(e))+'</strong></div><a href="'+esc(e.url)+'" class="detail-button" data-preview="'+esc(e.id)+'">상세보기 ↗</a></div></div></article>';
}
function keywordTags(e,extraClass='') {
  return '<div class="tag-row keyword-tags '+extraClass+'">'+eventTags(e).map(word=>'<button type="button" data-keyword="'+esc(word)+'" aria-pressed="'+(state.keyword===word)+'">#'+esc(word)+'</button>').join('')+'</div>';
}
function syncKeywordButtons() {
  document.querySelectorAll('[data-keyword]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.keyword===state.keyword)));
  const el=$('keyword-selection');
  if(el){el.hidden=!state.keyword;el.innerHTML=state.keyword?'<span>선택한 키워드</span><button data-clear-keyword>'+esc(state.keyword)+' <span aria-hidden="true">×</span></button>':'';}
}
function syncConditions() {
  const container=$('dock-active-conditions');if(!container)return;
  const rows=activeConditions(state,defaultPeriod);
  container.hidden=!rows.length;
  container.innerHTML=rows.map(row=>row.removable?'<button data-remove-condition="'+row.key+'" aria-label="'+esc(row.label)+' 조건 해제">'+esc(row.label)+' <span aria-hidden="true">×</span></button>':'<span>'+esc(row.label)+'</span>').join('');
}
const regionAnimations=new WeakMap();
function animateRegion(element) {
  if(!element||reducedMotion.matches||!element.animate)return;
  regionAnimations.get(element)?.cancel();
  const animation=element.animate([{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
  regionAnimations.set(element,animation);
}
let revealObserver;
function revealCards() {
  revealObserver?.disconnect();
  const cards=[...document.querySelectorAll('.festival-card,.mini-event')];
  if(!('IntersectionObserver' in window)||reducedMotion.matches){
    cards.forEach(el=>{el.classList.remove('reveal-pending');el.classList.add('reveal-complete');});return;
  }
  revealObserver||=new IntersectionObserver(entries=>{
    const groups=new Map();
    entries.filter(entry=>entry.isIntersecting&&entry.target.isConnected).forEach(({target})=>{
      const group=groups.get(target.parentElement)||[];group.push(target);groups.set(target.parentElement,group);
    });
    for(const [parent,group] of groups){
      const order=[...parent.children];
      group.sort((a,b)=>order.indexOf(a)-order.indexOf(b)).forEach((el,index)=>{
        el.style.setProperty('--reveal-delay',index*100+'ms');
        el.classList.add('is-revealed');
        const complete=event=>{if(event.target===el&&event.animationName==='festival-card-reveal'){el.classList.add('reveal-complete');el.removeEventListener('animationend',complete);}};
        el.addEventListener('animationend',complete);revealObserver.unobserve(el);
      });
    }
  },{threshold:.08});
  cards.filter(el=>!el.classList.contains('is-revealed')&&!el.classList.contains('reveal-complete')).forEach(el=>{
    el.classList.add('reveal-pending');revealObserver.observe(el);
  });
}
reducedMotion.addEventListener('change',revealCards);
function setupFilterDock() {
  const filter=document.querySelector('.filter-panel'),dock=$('sticky-filterbar'),header=document.querySelector('.site-header'),inner=document.querySelector('.header-inner');
  if(!filter||!dock)return;
  dock.innerHTML='<div class="sticky-filter-inner"><a class="dock-brand" href="/" aria-label="이번주 축제 홈"><img src="/assets/img/brand/festival-fireworks.png" width="31" height="31" alt=""></a><div class="dock-rows"><div class="dock-pills" role="group" aria-label="고정 지역 필터"><button data-region="all" aria-pressed="true">전국</button>'+regionNames.map(name=>'<button data-region="'+name+'" aria-pressed="false">'+name+'</button>').join('')+'</div><div class="dock-pills dock-themes" role="group" aria-label="고정 테마 필터"><button data-theme="all" aria-pressed="true">전체 테마</button>'+Object.entries(labels).map(([id,label])=>'<button data-theme="'+id+'" aria-pressed="false">'+esc(label)+'</button>').join('')+'</div><div id="dock-active-conditions" class="dock-conditions" role="group" aria-label="활성 추가 조건" hidden></div></div><button class="dock-all-filters" data-scroll-to-filters>전체 조건 ↑</button></div>';
  let queued=false,active=false;
  function update() {
    queued=false;
    const height=inner.getBoundingClientRect().height;
    const bottom=filter.getBoundingClientRect().bottom;
    const next=bottom<=height+(active?24:0);
    if(next!==active){
      active=next;header.classList.toggle('filters-docked',active);dock.hidden=!active;
      inner.inert=active;inner.setAttribute('aria-hidden',String(active));
    }
    document.documentElement.style.setProperty('--site-header-height',(active?dock.getBoundingClientRect().height:height)+'px');
  }
  const queue=()=>{if(!queued){queued=true;requestAnimationFrame(update);}};
  window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);
  if('ResizeObserver' in window){const observer=new ResizeObserver(queue);observer.observe(filter);observer.observe(dock);}
  syncConditions();
  update();
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
  return (ignoreRegion||state.region==='all'||e.group===state.region)&&(ignoreTheme||state.theme==='all'||e.theme===state.theme)&&(!state.free||e.feeStatus==='free')&&(!state.saved||saved.includes(e.id))&&matchesKeyword(e,state.keyword);
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
  syncKeywordButtons();
  syncConditions();
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
  syncPills(pool);syncSaved();revealCards();
}
function updateURL() {
  const url=new URL(location.href);
  for(const [key,val,empty] of [['region',state.region,'all'],['theme',state.theme,'all'],['saved',state.saved?'1':'',''],['free',state.free?'1':'',''],['period',state.period,defaultPeriod],['tag',state.keyword,'']]){if(val!==empty)url.searchParams.set(key,val);else url.searchParams.delete(key);}
  history.replaceState(null,'',url);
}
let shown=today.slice(0,7)+'-01';
let selected={start:today,end:today};
let selectedWeek=null;
let calendarView='month';
let activeWeek=weekRangeFor(today).start;
let weatherStation='seoul';
let weatherState={status:'loading',days:[],station:WEATHER_STATIONS.seoul};
let weatherRequest=0;
const weatherMemory=new Map();
const monthBounds=()=>{
  const start=shown;
  const next=new Date(start+'T00:00:00Z');next.setUTCMonth(next.getUTCMonth()+1);
  return {start,end:shiftDate(next.toISOString().slice(0,10),-1)};
};
function dayWeather(date) {
  const day=weatherState.days.find(d=>d.date===date);
  const city=weatherState.station?.city||WEATHER_STATIONS[weatherStation].city;
  if(day)return '<span class="day-weather" title="'+esc(city+' '+day.localTime+' 기온 예보 '+day.temperature+'℃ · '+day.label)+'" aria-label="'+esc(city+' '+day.localTime+' 예보 '+day.label+' '+day.temperature+'도')+'"><i aria-hidden="true">'+esc(day.icon)+'</i><span>'+day.temperature+'°</span></span>';
  const label=date<today?'지난 날짜':weatherState.status==='loading'?'예보 확인 중':weatherState.status==='failed'?'예보 연결 실패':'예보 미제공';
  return '<span class="day-weather no-weather" title="'+esc(label)+'" aria-label="'+esc(label)+'"><span>—</span></span>';
}
function syncWeather() {
  if(!$('weather-status'))return;
  $('weather-location').value=weatherStation;
  const city=WEATHER_STATIONS[weatherStation].city;
  let text=city+' 대표 지점 · ';
  if(weatherState.status==='ready'){
    const updated=new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'}).format(new Date(weatherState.updatedAt));
    text+='예보 갱신 '+updated+' · 제공 범위 '+fmt(weatherState.days[0].date)+'–'+fmt(weatherState.days.at(-1).date);
  }else text+=weatherState.status==='failed'?'예보 연결 실패 · 잠시 후 다시 확인해 주세요.':'예보를 불러오는 중입니다.';
  $('weather-status').textContent=text;
  $('weather-status').dataset.status=weatherState.status;
}
async function loadWeather(id=weatherStation) {
  weatherStation=Object.hasOwn(WEATHER_STATIONS,id)?id:'seoul';
  const request=++weatherRequest;
  const cached=weatherMemory.get(weatherStation);
  if(cached&&new Date(cached.expiresAt)>new Date()){
    weatherState={status:'ready',...cached};renderCalendar();return;
  }
  weatherState={status:'loading',days:[],station:WEATHER_STATIONS[weatherStation]};
  renderCalendar();
  try {
    const response=await fetch('/api/weather?region='+weatherStation,{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('weather unavailable');
    const result=await response.json();
    if(!Array.isArray(result.days)||!result.days.length||result.station?.id!==weatherStation||!Number.isFinite(Date.parse(result.updatedAt)))throw Error('weather response invalid');
    if(request!==weatherRequest)return;
    weatherMemory.set(weatherStation,result);weatherState={status:'ready',...result};
  } catch {if(request!==weatherRequest)return;weatherState={status:'failed',days:[],station:WEATHER_STATIONS[weatherStation]};}
  // Patch only the weather rows; do not restart card animations or move focus.
  document.querySelectorAll('[data-weather-date]').forEach(el=>el.innerHTML=dayWeather(el.dataset.weatherDate));
  syncWeather();
}
function weatherForRegion() {
  if(page!=='calendar')return;
  const next=Object.entries(WEATHER_STATIONS).find(([,s])=>s.group===state.region)?.[0]||'seoul';
  if(next!==weatherStation)loadWeather(next);
}
function setCalendarView(view,{start}={}) {
  calendarView=view==='week'?'week':'month';
  if(calendarView==='week'){
    activeWeek=start||weekRangeFor(selected?.start||shown).start;
    selectedWeek=activeWeek;selected={start:activeWeek,end:shiftDate(activeWeek,6)};
  }else{
    selectedWeek=null;selected=null;
  }
  state.period='month';updateURL();renderCalendar();animateRegion($(calendarView==='week'?'week-view':'month-view'));
}
function renderCalendar() {
  const weekScroll=$('weekly-timetable').scrollLeft;
  const r=monthBounds();
  const monthPool=data.filter(e=>overlaps(e,r.start,r.end));
  const pool=calendarView==='week'?weeklyEvents(data,activeWeek):monthPool;
  const list=pool.filter(e=>selection(e));
  const monthList=monthPool.filter(e=>selection(e));
  $('month-title').textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(shown+'T00:00:00Z'));
  document.querySelectorAll('[data-calendar-view]').forEach(b=>{
    const on=b.dataset.calendarView===calendarView;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;
  });
  $('month-view').hidden=calendarView!=='month';$('week-view').hidden=calendarView!=='week';
  $('month-prev').setAttribute('aria-label',calendarView==='week'?'이전 주':'이전 달');
  $('month-next').setAttribute('aria-label',calendarView==='week'?'다음 주':'다음 달');
  const offset=new Date(shown+'T00:00:00Z').getUTCDay();
  const cells=[];
  for(let i=0;i<offset;i++)cells.push('<div class="calendar-spacer" aria-hidden="true"></div>');
  for(let d=shown;d<=r.end;d=shiftDate(d,1)){
    const items=eventsForDay(monthList,d);
    const on=selected&&d>=selected.start&&d<=selected.end;
    cells.push('<button class="calendar-day'+(d===today?' is-today':'')+(on?' is-selected':'')+'" data-day="'+d+'" aria-pressed="'+!!on+'" aria-label="'+esc(dayLabel(d))+' · 수록 '+items.length+'건"><span class="day-number">'+Number(d.slice(8))+(d===today?'<small>오늘</small>':'')+'</span><span data-weather-date="'+d+'">'+dayWeather(d)+'</span><span class="day-events">'+items.slice(0,2).map(e=>'<span class="day-event theme-'+e.theme+'">'+(e.scheduleType==='period'?'◇ ':'')+esc(e.title.replace(/^\d{4}\s*/, '').slice(0,14))+'</span>').join('')+(items.length>2?'<small>+'+(items.length-2)+'개 더</small>':'')+'</span><span class="mobile-day-count">'+(items.length?items.length+'건':'')+'</span></button>');
  }
  $('calendar-grid').innerHTML=cells.join('');
  const weeks=[];
  for(let start=shiftDate(shown,-offset),i=1;start<=r.end;start=shiftDate(start,7),i++){
    const end=shiftDate(start,6),count=weeklyEvents(data,start).filter(e=>selection(e)).length;
    weeks.push('<button data-week-start="'+start+'" data-week-end="'+end+'" aria-pressed="'+(calendarView==='week'&&activeWeek===start)+'"><span><b>'+i+'주차</b><small>'+fmt(start)+' — '+fmt(end)+'</small></span><em>'+count+'건</em></button>');
  }
  $('week-choices').innerHTML=weeks.join('');
  if(calendarView==='week'){
    $('week-title').textContent=fmt(activeWeek)+' — '+fmt(shiftDate(activeWeek,6))+' 주간 일정';
    $('weekly-timetable').innerHTML=weekDays(activeWeek).map(d=>{
      const rows=eventsForDay(list,d);
      const on=selected?.start===d&&selected?.end===d;
      return '<section class="week-day-column'+(d===today?' is-today':'')+(on?' is-selected':'')+'"><button class="week-day-head" data-day="'+d+'" aria-pressed="'+on+'"><time datetime="'+d+'">'+esc(dayLabel(d).replace('요일',''))+'</time><span data-weather-date="'+d+'">'+dayWeather(d)+'</span></button><div class="week-day-counts"><span>시작 '+rows.filter(e=>e.startDate===d).length+'</span><span>종료 '+rows.filter(e=>e.endDate===d).length+'</span></div><div class="week-day-events">'+(rows.length?rows.map(e=>{
        const milestone=dayMilestone(e,d),tone=milestone==='시작'||milestone==='하루 일정'?'opening':milestone==='종료'?'closing':'continuing';
        return '<button class="week-event '+tone+'" data-preview="'+esc(e.id)+'"><span class="week-event-label">'+esc(milestone)+'</span><b>'+esc(e.title.replace(/^\d{4}\s*/,''))+'</b><span>⌖ '+esc(e.region)+'</span><small>'+esc(e.time||'시간 확인 필요')+'</small></button>';
      }).join(''):'<p class="week-no-events">수록 일정 없음</p>')+'</div></section>';
    }).join('');
    $('weekly-timetable').scrollLeft=weekScroll;
  }
  const chosen=selected||(calendarView==='week'?{start:activeWeek,end:shiftDate(activeWeek,6)}:r);
  const results=list.filter(e=>overlaps(e,chosen.start,chosen.end)).sort((a,b)=>nextDate(a,chosen.start).localeCompare(nextDate(b,chosen.start)));
  $('selected-day-title').textContent=selected?(chosen.start===chosen.end?dayLabel(chosen.start)+'의 축제':fmt(chosen.start)+' — '+fmt(chosen.end)+' 주간 축제'):'이 달의 수록 축제';
  $('calendar-result-summary').textContent='수록 일정 '+results.length+'건 · ◇ 기간형 공지는 실제 운영일 확인이 필요합니다.';
  $('calendar-results').classList.toggle('is-week-feed',calendarView==='week');
  $('calendar-results').tabIndex=calendarView==='week'?0:-1;
  $('calendar-results').setAttribute('aria-label','선택 일정 카드 목록');
  $('week-feed-controls').hidden=calendarView!=='week'||results.length<2;
  $('calendar-results').innerHTML=results.length?results.map(card).join(''):'<div class="empty-state"><h3>이 조건에서 수록된 일정이 없어요</h3><p>다른 날짜나 지역을 선택해 보세요. 공식 공지를 검토한 자료부터 수록합니다.</p></div>';
  const singleDay=selected?.start===selected?.end;
  $('clear-calendar-selection').hidden=calendarView==='month'&&!selected;
  $('clear-calendar-selection').textContent=calendarView==='week'?(singleDay?'이 주 전체 보기':'선택한 달 보기'):'이 달 전체 보기';
  $('theme-feeds').innerHTML=Object.entries(labels).map(([id,label])=>{
    const rows=list.filter(e=>e.theme===id);
    return rows.length?'<section class="theme-feed"><div class="theme-feed-heading"><h3>'+esc(label)+' <small>'+rows.length+'건</small></h3>'+(rows.length>1?'<div class="feed-controls"><button data-scroll-feed="prev" data-feed-target="theme-feed-'+id+'" aria-label="'+esc(label)+' 이전 카드">‹</button><button data-scroll-feed="next" data-feed-target="theme-feed-'+id+'" aria-label="'+esc(label)+' 다음 카드">›</button></div>':'')+'</div><div class="horizontal-feed" id="theme-feed-'+id+'">'+rows.map(card).join('')+'</div></section>':'';
  }).join('');
  syncPills(pool);syncSaved();syncWeather();revealCards();
}
function navigateCalendar(step) {
  if(calendarView==='week'){
    activeWeek=shiftDate(activeWeek,7*step);
    shown=shiftDate(activeWeek,3).slice(0,7)+'-01';
    selectedWeek=activeWeek;selected={start:activeWeek,end:shiftDate(activeWeek,6)};
  }else{
    const d=new Date(shown+'T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+step);
    shown=d.toISOString().slice(0,10);selected=null;selectedWeek=null;
  }
  state.period='month';updateURL();renderCalendar();
}
function reset() {
  Object.assign(state,{region:'all',theme:'all',keyword:'',free:false,saved:false,period:page==='calendar'?'month':page==='weekend'?'weekend':'upcoming',sort:'start',limit:9});
  selected=null;selectedWeek=null;calendarView='month';updateURL();render();weatherForRegion();
}
function render(){if(page==='calendar')renderCalendar();else renderGrid();}


const upcoming=data.filter(e=>overlaps(e,today,shiftDate(today,60))).sort((a,b)=>nextDate(a,today).localeCompare(nextDate(b,today))||a.title.localeCompare(b.title,'ko'));
const heroes=[...upcoming.filter(e=>e.theme==='light'&&e.image),...upcoming].filter((e,i,a)=>a.indexOf(e)===i).slice(0,3);
let heroIndex=0;
let heroPaused=false;
let heroTimer;
let heroVisible=true;
let heroHover=false;
let heroFocus=false;
let heroAnimations=[];
let heroTransition=0;
function syncHeroTimer() {
  clearTimeout(heroTimer);
  const button=$('hero-pause');
  if(button){button.setAttribute('aria-pressed',String(heroPaused));button.setAttribute('aria-label',heroPaused?'자동 전환 재생':'자동 전환 일시정지');button.textContent=heroPaused?'▶':'Ⅱ';}
  if(!$('hero-main')||heroes.length<2||heroPaused||!heroVisible||heroHover||heroFocus||document.hidden||$('festival-dialog')?.open)return;
  heroTimer=setTimeout(()=>{setHero(heroIndex+1);},3000);
}
function setHero(index) {
  if(!heroes.length)return;
  const nextIndex=(index+heroes.length)%heroes.length;
  if(nextIndex===heroIndex){syncHeroTimer();return;}
  const previous=heroes[heroIndex];heroIndex=nextIndex;
  const transition=++heroTransition;
  const e=heroes[heroIndex],container=document.querySelector('[data-hero-image]');if(!container)return;
  heroAnimations.forEach(a=>a.cancel());heroAnimations=[];
  container.innerHTML='<div class="hero-frame hero-frame-old">'+imageMarkup(previous,true)+'</div><div class="hero-frame hero-frame-new">'+imageMarkup(e,true)+'</div>';
  document.querySelector('[data-hero-title]').textContent=e.title;
  document.querySelector('[data-hero-meta]').textContent='▦ '+range(e)+'　⌖ '+e.region;
  document.querySelector('[data-hero-description]').textContent=e.program;
  document.querySelector('[data-hero-tags]').innerHTML=keywordTags(e,'hero-tags');
  document.querySelector('[data-hero-credit]').textContent=e.image?(e.image.kind==='context'?'주제 참고 · 현장 사진 아님':'이미지: '+e.image.credit):'테마 일러스트';
  const link=document.querySelector('[data-hero-detail]');link.href=e.url;link.dataset.preview=e.id;
  $('hero-position').textContent=String(heroIndex+1).padStart(2,'0')+' / '+String(heroes.length).padStart(2,'0');
  document.querySelectorAll('[data-hero-slide]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.heroSlide)===heroIndex)));
  const fresh=container.querySelector('.hero-frame-new');
  if(!reducedMotion.matches&&fresh.animate){
    // Keep the previous image opaque underneath, avoiding a dark flash mid-fade.
    const entering=fresh.animate([{opacity:0},{opacity:1}],{duration:800,easing:'ease-in-out',fill:'forwards'});
    heroAnimations.push(entering);
    heroAnimations.push(document.querySelector('.hero-event-details').animate([{opacity:0},{opacity:1}],{duration:450,easing:'ease-in-out'}));
    entering.onfinish=()=>{if(transition===heroTransition){heroAnimations.forEach(animation=>animation.cancel());heroAnimations=[];container.innerHTML=imageMarkup(e,true);}};
  }else container.innerHTML=imageMarkup(e,true);
  syncKeywordButtons();syncHeroTimer();
}
const heroElement=$('hero-main');
if(heroElement){
  for(const e of heroes){if(e.image){const img=new Image();img.src=e.image.src;}}
  heroElement.addEventListener('pointerenter',()=>{heroHover=true;syncHeroTimer();});
  heroElement.addEventListener('pointerleave',()=>{heroHover=false;syncHeroTimer();});
  heroElement.addEventListener('focusin',()=>{heroFocus=true;syncHeroTimer();});
  heroElement.addEventListener('focusout',event=>{if(!heroElement.contains(event.relatedTarget)){heroFocus=false;syncHeroTimer();}});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncHeroTimer();},{threshold:.15}).observe(heroElement);
  document.addEventListener('visibilitychange',syncHeroTimer);
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){heroTransition++;heroAnimations.forEach(a=>a.cancel());heroAnimations=[];document.querySelector('[data-hero-image]').innerHTML=imageMarkup(heroes[heroIndex],true);}syncHeroTimer();});
  syncHeroTimer();
}


const dialog=$('festival-dialog');
let dialogOpener=null;
function openPreview(e,opener) {
  if(!dialog?.showModal){location.href=e.url;return;}
  dialogOpener=opener;
  $('dialog-content').innerHTML=modalMarkup(e,{keyword:state.keyword,feeLabel:fee(e),statusLabel:status(e),stale:isStale(e.checkedAt,today)});
  syncSaved();dialog.showModal();document.body.classList.add('modal-open');syncHeroTimer();
  if(!reducedMotion.matches&&dialog.animate)dialog.animate([{opacity:0,transform:innerWidth<=640?'translateY(24px)':'translateY(8px) scale(.985)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});
}
function closePreview(){dialog.close();}
dialog?.addEventListener('close',()=>{document.body.classList.remove('modal-open');dialogOpener?.focus();syncHeroTimer();});
dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePreview();}});
function selectModalTab(id,focus=false) {
  document.querySelectorAll('[data-modal-tab]').forEach(b=>{const on=b.dataset.modalTab===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus();});
  modalTabIds.forEach(key=>{$('modal-panel-'+key).hidden=key!==id;});
  animateRegion($('modal-panel-'+id));
}
document.addEventListener('keydown',event=>{
  const b=event.target.closest?.('[data-modal-tab]');if(!b)return;
  const keys=modalTabIds;let i=keys.indexOf(b.dataset.modalTab);
  if(event.key==='ArrowRight')i=(i+1)%keys.length;else if(event.key==='ArrowLeft')i=(i+keys.length-1)%keys.length;else if(event.key==='Home')i=0;else if(event.key==='End')i=keys.length-1;else return;
  event.preventDefault();selectModalTab(keys[i],true);
});
document.addEventListener('click',async event=>{
  const b=event.target.closest('button,a');if(!b)return;
  if(b.hasAttribute('data-save')){
    const id=b.dataset.save;if(!byId.has(id))return;
    saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];
    let persisted=true;try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{persisted=false;}
    syncSaved();if(state.saved&&!dialog?.open)render();
    if(!reducedMotion.matches&&b.isConnected&&b.animate)b.animate([{transform:'scale(.9)'},{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:260,easing:'ease-out'});
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
  if(b.hasAttribute('data-keyword')){
    const destination=detailTagDestination(page,b.dataset.keyword);
    if(destination){location.assign(destination);return;}
    if(dialog?.open)closePreview();
    state.keyword=state.keyword===b.dataset.keyword?'':b.dataset.keyword;state.limit=9;updateURL();render();
    const target=page==='calendar'?$('selected-day-section'):$('discover');
    target?.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});return;
  }
  if(b.hasAttribute('data-remove-condition')){
    const key=b.dataset.removeCondition;
    if(key==='keyword')state.keyword='';else if(key==='free')state.free=false;else if(key==='saved')state.saved=false;else if(key==='period'){
      state.period=defaultPeriod;if(page==='calendar'){selected=calendarView==='week'?{start:activeWeek,end:shiftDate(activeWeek,6)}:null;}
    }else return;
    state.limit=9;updateURL();render();document.querySelector('[data-scroll-to-filters]')?.focus({preventScroll:true});return;
  }
  if(b.hasAttribute('data-clear-keyword')){state.keyword='';updateURL();render();return;}
  if(b.hasAttribute('data-scroll-to-filters')){document.querySelector('.filter-panel').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});return;}
  if(b.hasAttribute('data-calendar-view')){setCalendarView(b.dataset.calendarView);return;}
  if(b.hasAttribute('data-scroll-feed')){const feed=$(b.dataset.feedTarget||'calendar-results');feed?.scrollBy({left:Math.max(280,feed.clientWidth*.8)*(b.dataset.scrollFeed==='next'?1:-1),behavior:reducedMotion.matches?'instant':'smooth'});return;}
  if(b.id==='hero-pause'){heroPaused=!heroPaused;syncHeroTimer();return;}
  if(b.hasAttribute('data-region')){state.region=b.dataset.region;state.limit=9;updateURL();render();weatherForRegion();return;}
  if(b.hasAttribute('data-theme')){state.theme=b.dataset.theme;state.limit=9;updateURL();render();return;}
  if(b.hasAttribute('data-sort')){state.sort=b.dataset.sort;render();return;}
  if(b.hasAttribute('data-period')){
    state.period=b.dataset.period;state.limit=9;
    if(page==='calendar'){const r=periodRange();shown=today.slice(0,7)+'-01';selected=['upcoming','month'].includes(state.period)?null:r;selectedWeek=null;calendarView='month';}
    updateURL();render();return;
  }
  if(b.hasAttribute('data-day')){
    const date=b.dataset.day;
    selected=toggleDaySelection(selected,date,{view:calendarView,weekStart:activeWeek});selectedWeek=calendarView==='week'?activeWeek:null;state.period='month';updateURL();renderCalendar();
    document.querySelector((calendarView==='week'?'#weekly-timetable':'#calendar-grid')+' [data-day="'+date+'"]')?.focus({preventScroll:true});return;
  }
  if(b.hasAttribute('data-week-start')){setCalendarView('week',{start:b.dataset.weekStart});return;}
  if(b.hasAttribute('data-hero-slide')){setHero(Number(b.dataset.heroSlide));return;}
  if(b.id==='hero-prev'){setHero(heroIndex-1);return;}
  if(b.id==='hero-next'){setHero(heroIndex+1);return;}
  if(b.id==='load-more'){state.limit+=9;render();return;}
  if(b.id==='saved-only'){state.saved=!state.saved;state.limit=9;updateURL();render();return;}
  if(b.id==='reset-filters'||b.hasAttribute('data-reset-empty')){reset();return;}
  if(b.id==='month-prev'||b.id==='month-next'){navigateCalendar(b.id==='month-next'?1:-1);return;}
  if(b.id==='calendar-today'){shown=today.slice(0,7)+'-01';activeWeek=weekRangeFor(today).start;selected={start:today,end:today};selectedWeek=calendarView==='week'?activeWeek:null;state.period='today';updateURL();renderCalendar();return;}
  if(b.id==='clear-calendar-selection'){
    if(calendarView==='week'&&selected?.start!==selected?.end){setCalendarView('month');document.querySelector('[data-calendar-view="month"]')?.focus();return;}
    selected=calendarView==='week'?{start:activeWeek,end:shiftDate(activeWeek,6)}:null;selectedWeek=calendarView==='week'?activeWeek:null;state.period='month';updateURL();renderCalendar();
    document.querySelector('[data-calendar-view="'+calendarView+'"]')?.focus({preventScroll:true});
  }

});
$('only-free')?.addEventListener('change',e=>{state.free=e.target.checked;state.limit=9;updateURL();render();});
window.addEventListener('storage',e=>{if(e.key!==storageKey)return;try{const v=JSON.parse(e.newValue||'[]');saved=Array.isArray(v)?[...new Set(v.filter(id=>byId.has(id)))]:[];}catch{saved=[];}syncSaved();if(state.saved)render();});
setupFilterDock();
if(page==='calendar'){if(state.period!=='month')selected=periodRange();loadWeather();}else if($('event-cards'))renderGrid();
syncSaved();revealCards();setupHeadingMotion({reducedMotion});
$('weather-location')?.addEventListener('change',event=>loadWeather(event.target.value));
document.addEventListener('keydown',event=>{const button=event.target.closest?.('[data-calendar-view]');if(!button||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const view=event.key==='Home'?'month':event.key==='End'?'week':button.dataset.calendarView==='month'?'week':'month';setCalendarView(view);document.querySelector('[data-calendar-view="'+view+'"]').focus();});
function syncDetailLocation(){if(page!=='detail')return;document.querySelectorAll('.detail-tabs a').forEach(link=>{if(location.hash&&link.hash===location.hash)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}
window.addEventListener('hashchange',syncDetailLocation);syncDetailLocation();
