import {mkdir} from 'node:fs/promises';
import {splitHeading,typewriterText} from '../assets/js/festival-heading-motion.js';
import {writeFile} from './write-public-file.mjs';
import {highlightFor} from '../assets/js/festival-highlights.js';
import {imageCaption} from '../assets/js/festival-presentation.js';
import {weekendRange, monthRange, overlaps, nextDate} from '../tools/kids-outing-calendar/model.js';
import {root, esc, shell, active, events, images, today, reviewed, groups, themes, card, filters, grid, imageMarkup, shortRange, feeLabel, badge, eventUrl, detailBody, keywordTags} from './festival-platform.mjs';

export const intro = (kicker,titleLines,copy) => '<div class="page-intro"><p class="eyebrow">'+typewriterText(kicker)+'</p><h1>'+typewriterText(titleLines)+'</h1><p>'+esc(copy)+'</p></div>';
const weekend = weekendRange(today);
const weekendEvents = active.filter(e=>overlaps(e,weekend.start,weekend.end));
const dateFormat = new Intl.DateTimeFormat('ko-KR',{dateStyle:'long',timeZone:'UTC'});

function mini(e) {
  return '<a href="'+eventUrl(e)+'" data-preview="'+esc(e.id)+'" class="mini-event"><div class="mini-image theme-'+esc(e.theme)+'">'+imageMarkup(e,{compact:true})+'<span class="mini-badge">'+esc(badge(e))+'</span></div><div class="mini-copy"><small>'+esc(e.region)+' · '+esc(themes[e.theme][1])+'</small><h3>'+esc(e.title)+'</h3><p>'+esc(e.program)+'</p><strong>'+esc(shortRange(e))+' <span aria-hidden="true">↗</span></strong></div></a>';
}
export async function buildHome() {
  const picks=[...active.filter(e=>e.theme==='light' && images[e.id]),...active].filter((e,i,a)=>a.indexOf(e)===i).slice(0,3);
  const hero=picks[0];
  const heroImage=hero&&images[hero.id];
  const heroCredit=imageCaption(heroImage);
  const spot=active.filter(e=>e!==hero).slice(0,2);
  const heroHTML=hero?'<section class="hero-layout" aria-label="다가오는 축제"><div class="hero-main theme-'+esc(hero.theme)+'" id="hero-main">'+
    '<div class="hero-image" data-hero-image>'+imageMarkup(hero,{hero:true})+'</div><div class="hero-shade"></div><p class="hero-picture-note" data-hero-credit>'+esc(heroCredit)+'</p><div class="hero-top"><span class="orange-badge">● 이번 주의 발견</span><div class="hero-controls"><button id="hero-prev" aria-label="이전 추천">‹</button><button id="hero-pause" aria-label="자동 전환 일시정지" aria-pressed="false">Ⅱ</button><span id="hero-position">01 / '+String(picks.length).padStart(2,'0')+'</span><button id="hero-next" aria-label="다음 추천">›</button></div></div><div class="hero-copy"><p class="hero-kicker">일상에 설렘을 더하는 축제 한 조각</p>'+splitHeading(['이번 주','어디 갈까?'])+'<div class="hero-event-details"><p class="hero-event" data-hero-title>'+esc(hero.title)+'</p><p class="hero-meta" data-hero-meta>▦ '+esc(shortRange(hero))+'　⌖ '+esc(hero.region)+'</p><p class="hero-description" data-hero-description>'+esc(hero.program)+'</p><div data-hero-tags>'+keywordTags(hero,'hero-tags')+'</div><div class="hero-actions"><a href="'+eventUrl(hero)+'" data-preview="'+esc(hero.id)+'" data-hero-detail class="button primary">축제 자세히 보기 ↗</a><a class="hero-calendar-link" href="/calendar/">달력으로 찾아보기 →</a></div></div></div><div class="hero-dots">'+picks.map((e,i)=>'<button data-hero-slide="'+i+'" aria-label="추천 '+(i+1)+' · '+esc(e.title)+'" aria-pressed="'+(i===0)+'"></button>').join('')+'</div></div><aside class="hero-side"><div class="section-title small"><h2>✦ 다가오는 축제</h2><span>FESTIVAL PICKS</span></div>'+spot.map(mini).join('')+'<a class="weekend-banner" href="/curation/"><span class="banner-symbol" aria-hidden="true">✳</span><span><b>이번 주말, 같이 떠나요</b><small>'+weekend.start.slice(5).replace('-','.')+' — '+weekend.end.slice(5).replace('-','.')+' · 수록 일정 '+weekendEvents.length+'건</small></span><span aria-hidden="true">↗</span></a></aside></section>':'';
  const featured=active.filter(e=>highlightFor(e,today));
  const hotHTML=featured.length?'<section class="hot-section" aria-labelledby="hot-heading"><div class="section-title"><div><p class="eyebrow">EDITOR’S PICKS</p><h2 id="hot-heading">HOT · 주목할 행사</h2><p>공식 규모·대표성에 근거한 편집 선정이며 실시간 인기 순위가 아닙니다.</p></div><div class="feed-controls"><button data-scroll-feed="prev" data-feed-target="hot-event-feed" aria-label="이전 카드">‹</button><button data-scroll-feed="next" data-feed-target="hot-event-feed" aria-label="다음 카드">›</button></div></div><div class="horizontal-feed" id="hot-event-feed">'+featured.map(card).join('')+'</div></section>':'';
  const body='<main id="main" class="page-width">'+heroHTML+hotHTML+'<section id="discover" class="discover-section"><div class="section-title"><div><p class="eyebrow">EXPLORE ALL FESTIVALS</p><h2>전국 축제 모아보기</h2><p>날짜와 지역, 좋아하는 테마로 다음 나들이를 골라보세요.</p></div><a class="text-link" href="/map/">지역별로 둘러보기 ↗</a></div>'+filters()+grid()+'</section><section class="weekend-section"><div class="section-title"><div><p class="eyebrow">YOUR WEEKEND STARTS HERE</p><h2>이번 주말엔 이런 축제 어때요?</h2></div><div class="weekend-feed-actions"><a class="text-link" href="/curation/">주말 일정 모두 보기 ↗</a>'+(weekendEvents.length>1?'<div class="feed-controls"><button data-scroll-feed="prev" data-feed-target="home-weekend-feed" aria-label="이전 주말 카드">‹</button><button data-scroll-feed="next" data-feed-target="home-weekend-feed" aria-label="다음 주말 카드">›</button></div>':'')+'</div></div><div class="horizontal-feed" id="home-weekend-feed">'+(weekendEvents.length?weekendEvents.slice(0,4).map(card).join(''):'<div class="feed-empty">이 주말의 수록 일정이 없어요. 달력에서 다른 날짜를 살펴보세요.</div>')+'</div></section><section class="explore-links"><a href="/map/"><span class="link-illustration">⌖</span><div><small>NEAR YOUR NEXT DESTINATION</small><h2>가고 싶은 지역부터</h2><p>서울부터 제주까지, 7개 권역으로 가볍게 탐색해요.</p></div><b aria-hidden="true">↗</b></a><a href="/calendar/"><span class="link-illustration purple">▦</span><div><small>MAKE TIME FOR SOMETHING GOOD</small><h2>비어 있는 날짜부터</h2><p>달력에서 날짜를 누르면 그날의 수록 일정을 볼 수 있어요.</p></div><b aria-hidden="true">↗</b></a></section><section class="trust-strip"><span class="trust-icon" aria-hidden="true">✓</span><div><b>즐거운 나들이의 시작은, 정확한 정보에서</b><p>공식 안내를 읽고 개최일·요금·예약 조건을 정리합니다. 각 상세안내에서 출처와 확인일을 확인하세요.</p></div><span class="review-stamp">자료 확인<br><strong>'+esc(reviewed || '확인일 미등록')+'</strong></span></section></main>';
  await writeFile(new URL('index.html',root),shell({
    title:'이번주 축제 | 주말에 가볼 만한 전국 축제·행사',
    description:'이번 주말 어디 갈까? 전국 축제를 지역·날짜·테마별로 찾고 운영일·입장료·예약 조건을 확인하세요. English·日本語·简体中文·繁體中文 안내도 제공합니다.',
    ogTitle:'이번주 축제 | 이번 주말 어디 갈까?',
    ogDescription:'가까운 무료 축제부터 야경·먹거리 행사까지. 가고 싶은 축제를 골라 일정과 참여 조건을 확인하세요.',
    adEligible:true,
    body,
    structuredData:{'@context':'https://schema.org','@type':'WebSite',name:'이번주 축제',alternateName:'Festa Calendar',url:'https://simulab.kr/',inLanguage:'ko-KR'}
  }),'utf8');
}
export async function buildCalendar() {
  const month=monthRange(Number(today.slice(0,4)),Number(today.slice(5,7)));
  const monthEvents=events.filter(e=>overlaps(e,month.start,month.end))
    .sort((a,b)=>nextDate(a,month.start).localeCompare(nextDate(b,month.start)));
  const monthLabel=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(month.start));
  const body='<main id="main" class="page-width calendar-page">'+intro('A LITTLE PLAN, A GREAT WEEKEND',[[{text:'어느날'}],[{text:'떠나볼까요?',accent:true}]],'비어 있는 하루에 즐거운 계획을 더해보세요. 날짜를 누르면 수록된 축제와 행사를 보여드려요.')+filters({calendar:true})+'<section class="calendar-panel" aria-label="축제 달력"><div class="calendar-toolbar"><div><p class="eyebrow">FESTIVAL CALENDAR</p><h2 id="month-title">'+esc(monthLabel)+'</h2></div><div class="calendar-toolbar-actions"><div class="calendar-view-switch" role="tablist" aria-label="달력 보기 방식"><button role="tab" id="calendar-month-tab" data-calendar-view="month" aria-selected="true" aria-controls="month-view">월간</button><button role="tab" id="calendar-week-tab" data-calendar-view="week" aria-selected="false" aria-controls="week-view" tabindex="-1">주간 일정</button></div><div class="calendar-nav"><button id="month-prev" aria-label="이전 달">‹</button><button id="calendar-today">오늘</button><button id="month-next" aria-label="다음 달">›</button></div></div></div><div class="weather-toolbar"><div><span aria-hidden="true">⛅</span><label for="weather-location">예보 기준</label><select id="weather-location" aria-label="날씨 기준 도시"><option value="seoul">서울</option><option value="suwon">수원 · 경기지역</option><option value="gangneung">강릉 · 강원지역</option><option value="daejeon">대전 · 충청지역</option><option value="gwangju">광주 · 전라지역</option><option value="busan">부산 · 경상지역</option><option value="jeju">제주</option></select></div><p id="weather-status" role="status">대표 지점 예보를 불러오는 중입니다.</p></div><div class="calendar-layout"><aside class="week-sidebar"><b>주차별 둘러보기</b><div id="week-choices"></div><p class="microcopy">기간형 일정은 매일 운영을 뜻하지 않습니다. 세부 운영일을 확인하세요.</p></aside><div class="calendar-view-area"><div id="month-view" role="tabpanel" aria-labelledby="calendar-month-tab"><div class="weekdays" aria-hidden="true"><span>SUN 일</span><span>MON 월</span><span>TUE 화</span><span>WED 수</span><span>THU 목</span><span>FRI 금</span><span>SAT 토</span></div><div id="calendar-grid" class="calendar-grid" role="group" aria-label="날짜 선택"></div></div><div id="week-view" role="tabpanel" aria-labelledby="calendar-week-tab" hidden><div class="week-view-heading"><div><h3 id="week-title"></h3><p>날짜를 누르면 아래 카드도 함께 바뀌어요.</p><a class="week-results-link" href="#selected-day-section">선택한 일정 카드 보기 ↓</a></div><div class="week-legend"><span>● 시작</span><span>● 종료</span></div></div><div id="weekly-timetable" class="weekly-timetable" aria-label="주간 날짜별 축제"></div></div></div></div><p class="microcopy calendar-footnote">건수는 선택한 월·지역·테마에 해당하는 수록 행사 수입니다. 지정 운영일은 해당 날짜에만, 기간형 공지는 ‘운영일 확인’으로 표시합니다.</p><p class="weather-attribution">예보 출처: <a href="https://api.met.no/weatherapi/locationforecast/2.0/documentation" target="_blank" rel="noopener noreferrer">MET Norway</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · 한국시간 일자별 대표시각 예보로 재구성. 행사장 실황이나 일 최저·최고 기온이 아닙니다.</p></section><section class="selected-day-section" id="selected-day-section"><div class="section-title"><div><p class="eyebrow">YOUR SELECTED DAY</p><h2 id="selected-day-title">'+esc(monthLabel)+' 축제 일정</h2><p id="calendar-result-summary" aria-live="polite"></p></div><div class="calendar-result-actions"><div id="week-feed-controls" class="feed-controls" hidden><button data-scroll-feed="prev" aria-label="이전 일정 카드">‹</button><button data-scroll-feed="next" aria-label="다음 일정 카드">›</button></div><button id="clear-calendar-selection" class="quiet-button">선택한 달 전체 보기</button></div></div><div id="calendar-results" class="event-grid">'+(monthEvents.length?monthEvents.map(card).join(''):'<p>이 달의 수록 일정이 없습니다.</p>')+'</div></section><section class="theme-feed-section"><div class="section-title"><div><p class="eyebrow">FIND YOUR FESTIVAL MOOD</p><h2>테마별로 만나는 축제</h2></div></div><div id="theme-feeds"></div></section><noscript><p>이 달의 수록 일정은 위 목록에서 볼 수 있습니다. 다른 날짜를 고르려면 자바스크립트를 켜세요.</p></noscript></main>';
  await writeFile(new URL('calendar/index.html',root),shell({
    title:'전국 축제 달력 | 날짜별·월별 행사 일정',
    description:'쉬는 날에 열리는 축제가 궁금하다면? 월간 달력에서 날짜를 고르거나 주간 일정에서 축제 시작일과 마지막 날을 살펴보세요.',
    path:'/calendar/',page:'calendar',body
  }),'utf8');
}
export async function buildMap() {
  const body='<main id="main" class="page-width">'+intro('FIND YOUR NEXT DESTINATION',[[{text:'어디로'}],[{text:'떠나볼까요?',accent:true}]],'서울부터 제주까지. 가고 싶은 권역을 누르면 수록된 축제와 행사를 모아볼 수 있어요.')+filters()+'<div class="map-layout"><aside class="region-map-panel"><div class="section-title small"><h2>대한민국 축제 지도</h2><span>7개 권역</span></div><div class="illustrated-map"><img src="/assets/img/brand/korea-festival-map-clean.webp" alt="권역 탐색용 대한민국 지도 일러스트" loading="lazy" decoding="async">'+groups.map((g,i)=>'<button class="region-point point-'+i+'" data-region="'+g.label+'" aria-pressed="false"><span aria-hidden="true">●</span> '+g.label+' <b data-map-count="'+g.label+'">'+active.filter(e=>g.regions.includes(e.region)).length+'</b></button>').join('')+'</div><p class="microcopy">권역 선택용 개략도입니다. 표시 위치는 실제 행사장의 좌표가 아니며 지형·행정경계는 정확한 지도와 다를 수 있습니다.</p><div class="map-info"><b>지도를 눌러, 다음 여행을 골라보세요</b><p>수록된 정보가 없는 지역도 있습니다. 0건은 그 지역에 행사가 없다는 뜻이 아닙니다.</p></div></aside><section class="map-results" id="discover">'+grid()+'</section></div><section class="explore-links"><a href="/calendar/"><span class="link-illustration purple">▦</span><div><small>ANOTHER WAY TO EXPLORE</small><h2>날짜로 찾는 나들이</h2><p>지역을 골랐다면, 떠날 날짜도 확인해 보세요.</p></div><b>↗</b></a><a href="/curation/"><span class="link-illustration">✳</span><div><small>THE WEEKEND IS CALLING</small><h2>가까워진 이번 주말</h2><p>이번 토요일과 일요일의 수록 일정을 한눈에.</p></div><b>↗</b></a></section></main>';
  await writeFile(new URL('map/index.html',root),shell({
    title:'지역별 축제 지도 | 서울·경기부터 제주까지',
    description:'가까운 곳에서 열리는 축제를 찾고 있나요? 지도에서 서울·경기, 강원, 충청, 전라, 경상, 제주 권역을 골라 행사 장소와 일정을 확인하세요.',
    path:'/map/',page:'map',body
  }),'utf8');
}
export async function buildWeekend() {
  const body='<main id="main" class="page-width">'+intro('YOUR WEEKEND, YOUR FESTIVAL',[[{text:'이번 주말,'}],[{text:'즐거운 일이 '},{text:'기다려요.',accent:true}]],weekend.start.replaceAll('-','.')+' — '+weekend.end.slice(5).replace('-','.')+' · 토요일과 일요일에 겹치는 수록 일정을 모았어요.')+'<section id="discover"><p class="microcopy">이번 주말 아이와 갈 곳을 찾는다면 <a class="text-link" href="/curation/?theme=kids#discover">주말 가족 나들이</a>에서 체험·문화 행사를 살펴보세요. 저녁에 함께 갈 곳은 <a class="text-link" href="/curation/?theme=light#discover">주말 데이트</a>에서 불꽃·야경 행사를 골라보세요.</p>'+filters({weekend:true})+grid(weekendEvents)+'</section><section class="trust-strip"><span class="trust-icon">✓</span><div><b>떠나기 전 확인할 세 가지</b><p>실제 운영일, 참여 비용, 사전예약 여부. 상세안내의 확인일과 공식 공지를 함께 확인하세요.</p></div><a class="button secondary" href="/calendar/">다른 날짜 보기 ↗</a></section></main>';
  await writeFile(new URL('curation/index.html',root),shell({
    title:'이번 주말 가볼 만한 곳 | 가족 나들이·데이트 축제',
    description:'이번 주말 아이와 어디 갈까요? 가족 체험부터 주말 데이트에 어울리는 야경 축제까지, 토·일 일정을 지역별로 골라보세요.',
    path:'/curation/',page:'weekend',body
  }),'utf8');
}
export async function buildDetails() {
  for(const e of events) {
    const schema={'@context':'https://schema.org','@type':e.dates?.length>1?'EventSeries':'Event',name:e.title,description:e.program,startDate:e.startDate,endDate:e.endDate,location:{'@type':'Place',name:e.location},url:'https://simulab.kr'+eventUrl(e),inLanguage:'ko-KR'};
    if(e.dates?.length>1) schema.subEvent=e.dates.map(d=>({'@type':'Event',name:e.title,startDate:d,endDate:d,location:{'@type':'Place',name:e.location}}));
    // Prices, inventory, organizer and event photographs must never be inferred.
    const body='<main id="main" class="page-width detail-page"><div class="breadcrumbs"><a href="/">홈</a><span>/</span><a href="/map/?region='+encodeURIComponent(groups.find(g=>g.regions.includes(e.region))?.label || '')+'">'+esc(e.region)+'</a><span>/</span> 축제 상세안내</div><article class="detail-surface">'+detailBody(e)+'</article></main>';
    await mkdir(new URL('events/'+e.id+'/',root),{recursive:true});
    const dates=dateFormat.formatRange(new Date(e.startDate),new Date(e.endDate));
    const schedule=e.dates?'지정일 운영':e.scheduleType==='period'?'기간 내 운영일 확인':'';
    const fee=e.feeStatus==='unknown'?'':feeLabel(e);
    const booking=e.endDate>=today?e.booking:'';
    const description=[dates,e.location,e.program,schedule,fee,booking].filter(Boolean).join(' · ');
    await writeFile(new URL('events/'+e.id+'/index.html',root),shell({
      title:e.title+' | 일정·장소'+(fee?'·참여 비용':''),
      description,path:eventUrl(e),page:'detail',adEligible:e.endDate>=today,body,structuredData:schema
    }),'utf8');
  }
}
