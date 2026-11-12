import {LANGUAGES} from '../assets/js/festival-i18n.js';
import {highlightFor} from '../assets/js/festival-highlights.js';
import {eventTags} from '../assets/js/festival-ui-model.js';
import {eventImage,imageAttribution} from '../assets/js/festival-presentation.js';
import {readFile} from 'node:fs/promises';
import '../assets/js/site-settings.js';
import {escapeHtml, validateEvent, koreaToday, shiftDate, nextDate, overlaps, REGION_GROUPS, eventStatus} from '../tools/kids-outing-calendar/model.js';

export const root = new URL('../', import.meta.url);
export const esc = escapeHtml;
export const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
export const today = koreaToday();
export const all = JSON.parse(await readFile(new URL('data/events/reviewed.json', root), 'utf8'));
export const images = JSON.parse(await readFile(new URL('data/events/images.json', root), 'utf8'));
export const events = all.filter(e => !validateEvent(e, {today}).length && /^[a-z0-9-]+$/.test(e.id) && e.publicationStatus !== 'cancelled');
export const active = events.filter(e => overlaps(e, today, shiftDate(today, 60))).sort((a,b) => nextDate(a,today).localeCompare(nextDate(b,today)) || a.title.localeCompare(b.title,'ko'));
export const reviewed = events.map(e => e.checkedAt).sort().at(-1) || '';
export const groups = REGION_GROUPS;
export const themes = {light:['✦','불꽃·야경'], food:['◒','먹거리·수확'], nature:['❋','꽃·자연'], kids:['✳','체험·문화']};
export const eventUrl = e => '/events/' + encodeURIComponent(e.id) + '/';
export const range = e => e.startDate === e.endDate ? e.startDate.replaceAll('-','.') : e.startDate.replaceAll('-','.') + ' — ' + e.endDate.slice(5).replace('-','.');
export const shortRange = e => e.startDate === e.endDate ? e.startDate.slice(5).replace('-','.') : e.startDate.slice(5).replace('-','.') + ' — ' + e.endDate.slice(5).replace('-','.');
export const feeLabel = e => ({free:'입장·기본참여 무료',mixed:'일부 유료',paid:'유료',unknown:'요금 확인 필요'}[e.feeStatus] || '요금 확인 필요');
export function badge(e, ref=today) {
  if(e.publicationStatus === 'cancelled') return '취소';
  if(e.endDate < ref) return '종료된 일정';
  if(e.startDate <= ref) return eventStatus(e,ref) === '예정' ? '다음 운영 ' + nextDate(e,ref).slice(5).replace('-','.') : eventStatus(e,ref);
  return 'D-' + Math.round((new Date(e.startDate+'T00:00:00Z')-new Date(ref+'T00:00:00Z'))/86400000);
}
export const groupFor = e => groups.find(g => g.regions.includes(e.region))?.label || e.region;
export function imageMarkup(e, options={}) {
  return eventImage(e,images[e.id],options);
}
export function keywordTags(e,extraClass='') {
  return '<div class="tag-row keyword-tags '+extraClass+'">'+eventTags(e).map(word=>'<button type="button" data-keyword="'+esc(word)+'" aria-pressed="false">#'+esc(word)+'</button>').join('')+'</div>';
}
export function card(e) {
  return '<article class="festival-card" data-card-id="'+esc(e.id)+'"><div class="card-visual theme-'+esc(e.theme)+'"><a href="'+eventUrl(e)+'" data-preview="'+esc(e.id)+'" aria-label="'+esc(e.title)+' 상세안내">'+imageMarkup(e)+'<span class="status-badge">'+esc(badge(e))+'</span><span class="picture-date">▦ '+esc(shortRange(e))+'</span></a><button class="save-button" data-save="'+esc(e.id)+'" aria-label="'+esc(e.title)+' 보관" aria-pressed="false">♡</button></div><div class="card-content"><p class="place-label">⌖ '+esc(e.region)+' · <span data-original lang="ko">'+esc(e.location)+'</span>'+'</p><h3><a href="'+eventUrl(e)+'" data-preview="'+esc(e.id)+'">'+esc(e.title)+'</a></h3><p class="card-description">'+esc(e.program)+'</p>'+keywordTags(e)+(e.scheduleType==='period'?'<p class="card-schedule-note">기간 내 운영일 확인</p>':'')+'<div class="card-bottom"><div><small>입장·참여 비용</small><strong>'+esc(feeLabel(e))+'</strong></div><a href="'+eventUrl(e)+'" class="detail-button" data-preview="'+esc(e.id)+'">상세보기 <span aria-hidden="true">↗</span></a></div></div></article>';
}
export function payload() {
  return events.map(e => ({...e,group:groupFor(e),url:eventUrl(e),image:images[e.id] || null}));
}
export function header(page='home') {
  const activePage=page.startsWith('sales')?'sales':page;
  const nav=[['home','/','홈'],['map','/map/','지역별 탐색'],['calendar','/calendar/','축제 달력'],['weekend','/curation/','이번 주말'],['sales','/sales/','할인·쇼핑']];
  return '<a class="skip-link" href="#main">본문으로</a><header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="이번주 축제 홈"><img src="/assets/img/brand/festival-fireworks.png" width="46" height="46" alt=""><span><b>이번주 축제</b><small>FESTA CALENDAR</small></span></a><nav class="main-nav" aria-label="축제 탐색">'+nav.map(([id,href,label])=>'<a href="'+href+'"'+(activePage===id?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav><div class="festival-header-actions"><label class="language-control" translate="no"><span class="language-icon" aria-hidden="true">◎</span><span class="motion-sr-only">Language / 언어</span><select id="festival-language" aria-label="Language / 언어">'+LANGUAGES.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label><button type="button" class="header-install" aria-haspopup="dialog" aria-controls="install-guide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/></svg>앱설치</button><a class="header-saved" href="'+(activePage==='sales'?'/sales/?saved=1#shopping-results':'/?saved=1#discover')+'" aria-label="'+(activePage==='sales'?'할인 보관함':'보관한 축제')+'"><span aria-hidden="true">♡</span><span class="saved-label">보관함</span><b data-saved-count>0</b></a></div></div><div id="sticky-filterbar" class="sticky-filterbar" hidden></div></header>';
}
export function footer() {
  return '<footer class="site-footer"><div class="footer-grid"><div><a class="brand" href="/"><img src="/assets/img/brand/festival-fireworks.png" width="40" height="40" alt=""><span><b>이번주 축제</b><small>FESTA CALENDAR</small></span></a><p>이번 주, 새로운 즐거움을 발견하세요.<br>공식 안내를 바탕으로 모은 전국 축제·행사.</p></div><div><b>가고 싶은 축제 찾기</b><a href="/map/">7개 권역으로 탐색</a><a href="/calendar/">날짜별 축제 달력</a><a href="/curation/">이번 주말 일정</a><a href="/sales/">할인·쇼핑</a></div><div><b>정보 이용 안내</b><a href="/legal/about">서비스 소개·문의</a><a href="/legal/terms">이용약관·면책 안내</a><a href="/legal/privacy">개인정보처리방침</a><a href="/legal/editorial">출처·검토·정정 기준</a><a href="/legal/fonts">사용 서체·출처</a><a href="/library/">기존 시뮬랩 자료</a></div></div><div class="footer-note"><span>© '+today.slice(0,4)+' 이번주 축제 · simulab.kr</span><p>축제 주최·예약 대행 서비스가 아닙니다. 일정·요금·예약 및 취소 여부는 출발 전 공식 안내에서 다시 확인하세요. 카드 건수는 이 사이트에 수록된 일정 수이며 전국 전체 개최 수가 아닙니다.</p></div></footer>';
}
export function filters({weekend=false,calendar=false}={}) {
  return '<section class="filter-panel" aria-label="축제 조건"><div id="keyword-selection" class="keyword-selection" hidden></div><div class="filter-row"><b>⌖ 지역 선택</b><div class="pills" role="group" aria-label="지역"><button data-region="all" aria-pressed="true">전국 <span data-region-count="all">'+active.length+'</span></button>'+groups.map(g=>'<button data-region="'+g.label+'" aria-pressed="false">'+g.label+' <span data-region-count="'+g.label+'">'+active.filter(e=>g.regions.includes(e.region)).length+'</span></button>').join('')+'</div></div><div class="filter-row"><b>✳ 테마 선택</b><div class="pills theme-pills" role="group" aria-label="테마"><button data-theme="all" aria-pressed="true">전체</button>'+Object.entries(themes).map(([id,[icon,label]])=>'<button data-theme="'+id+'" aria-pressed="false">'+icon+' '+label+'</button>').join('')+'</div></div><div class="filter-bottom"><div class="pills compact-pills" role="group" aria-label="일정 범위"><button data-period="'+(calendar?'month':'upcoming')+'" aria-pressed="'+!weekend+'">'+(calendar?'선택한 달':'앞으로 60일')+'</button><button data-period="weekend" aria-pressed="'+weekend+'">이번 주말</button><button data-period="today" aria-pressed="false">오늘</button></div><label class="check-label"><input type="checkbox" id="only-free"> 입장·기본참여 무료</label><button id="saved-only" class="quiet-button" aria-pressed="false">♡ 보관한 일정</button><button id="reset-filters" class="reset-button">조건 초기화</button></div><p class="microcopy">무료 조건은 입장·기본참여 기준입니다. 식음료·선택 체험 비용은 별도일 수 있습니다. 기간형 행사는 휴무·실제 운영일을 공식 안내에서 확인하세요.</p></section>';
}
export function grid(items=active) {
  return '<div class="result-heading"><div><h2 id="result-title">전국 축제 모아보기</h2><p id="result-summary" aria-live="polite">수록 일정 '+items.length+'건 · 확인일과 공식 안내를 함께 보세요</p></div><div class="sort-options" role="group" aria-label="정렬"><button data-sort="start" aria-pressed="true">일정순</button><button data-sort="end" aria-pressed="false">마감순</button></div></div><div id="event-cards" class="event-grid">'+items.map(card).join('')+'</div><div id="empty-state" class="empty-state" hidden><span aria-hidden="true">⌖</span><h3>아직 수록된 일정이 없어요</h3><p>이 조건에서 확인된 자료가 없습니다. 다른 지역이나 날짜를 선택해 보세요.</p><button data-reset-empty class="button secondary">전체 일정 보기</button></div><button id="load-more" class="load-more" hidden>일정 더보기 <span aria-hidden="true">⌄</span></button>';
}
export function dialog() {
  return '<dialog id="festival-dialog" class="festival-dialog" aria-labelledby="dialog-title"><div class="dialog-close-layer"><button class="dialog-close" type="button" aria-label="상세안내 닫기" data-close-dialog>×</button></div><div id="dialog-content"></div></dialog><div id="festival-toast" class="toast" role="status" aria-live="polite" hidden></div>';
}
export function shell({title,description,ogTitle=title,ogDescription=description,path='/',page='home',body,structuredData,adEligible=false,clientScript='/assets/js/festival-platform.js',extraHead='',includeFestivalData=true}) {
  const {adsEnabled,adsenseClient} = globalThis.SIMULAB_SITE_SETTINGS;
  if(!/^ca-pub-\d{16}$/.test(adsenseClient))throw new Error('Invalid AdSense publisher ID');
  const adScript = adsEnabled === true && adEligible
    ? '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+adsenseClient+'" crossorigin="anonymous"></script>'
    : '';
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'"><meta name="naver-site-verification" content="1b81691131895febb71347b5ec654887d1660bec"><link rel="canonical" href="https://simulab.kr'+path+'"><meta property="og:site_name" content="이번주 축제"><meta property="og:type" content="website"><meta property="og:title" content="'+esc(ogTitle)+'"><meta property="og:description" content="'+esc(ogDescription)+'"><meta property="og:url" content="https://simulab.kr'+path+'"><meta property="og:image" content="https://simulab.kr/assets/img/brand/festival-social.jpg"><meta name="theme-color" content="#f97316"><meta name="google-adsense-account" content="'+adsenseClient+'">'+adScript+'<link rel="shortcut icon" href="https://simulab.kr/favicon.ico"><link rel="icon" href="https://simulab.kr/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="https://simulab.kr/assets/icons/icon-192.png"><link rel="manifest" href="/manifest.json"><link rel="preload" href="/assets/fonts/festival/aggro-bold.woff" as="font" type="font/woff" crossorigin><link rel="preload" href="/assets/fonts/festival/paperlogy-bold.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/css/festival-fonts.css"><link rel="stylesheet" href="/assets/css/festival-platform.css"><link rel="stylesheet" href="/assets/css/festival-enhancements.css"><link rel="stylesheet" href="/assets/css/festival-refinements.css"><link rel="stylesheet" href="/assets/css/festival-language.css">'+extraHead+(structuredData?'<script type="application/ld+json">'+json(structuredData)+'</script>':'')+'</head><body data-festival-page="'+page+'">'+header(page)+visitorGuide()+body+footer()+dialog()+'<dialog id="install-guide" class="install-guide" aria-labelledby="install-guide-title"><h2 id="install-guide-title">북마크 저장</h2><p data-bookmark-instructions>브라우저 메뉴에서 이 페이지를 북마크에 추가하세요.</p><p data-ios-install hidden>앱 아이콘을 만들려면 Safari의 공유 메뉴에서 <strong>홈 화면에 추가</strong>를 선택하세요.</p><form method="dialog"><button class="button secondary" autofocus>닫기</button></form></dialog><script type="application/json" id="festival-data">'+json(includeFestivalData?payload():[])+'</script><script type="module" src="/assets/js/festival-install.js"></script><script type="module" src="'+esc(clientScript)+'"></script></body></html>';
}
export function officialSources(e) {
  return '<div class="sources-list">'+e.sources.map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer"><span>'+esc(s.publisher)+' · 확인 '+esc(s.checkedAt)+'</span><b>'+esc(s.title)+' ↗</b><small>'+esc(s.facts)+'</small></a>').join('')+'</div>';
}
export function facts(e) {
  const rows=[['▦','행사 기간',range(e)],['◷','운영 시간',e.time || '공식 안내 확인'],['◈','관람·참여 비용',e.fee || feeLabel(e)],['⌖','개최 장소',e.location]];
  return '<dl class="fact-grid">'+rows.map(([icon,label,value])=>'<div><dt><span aria-hidden="true">'+icon+'</span>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>';
}
export function detailBody(e) {
  const im=images[e.id];
  const mobileMedia='<figure class="detail-mobile-media"><div class="theme-'+esc(e.theme)+'">'+imageMarkup(e)+'</div>'+(im?'<figcaption>'+imageAttribution(im)+'</figcaption>':'')+'</figure>';
  return '<div class="detail-topline"><span class="eyebrow">'+esc(themes[e.theme]?.[1])+' · '+esc(e.region)+'</span><span class="verified-label">공식 출처 확인 '+esc(e.checkedAt)+'</span></div><h1>'+esc(e.title)+'</h1><p class="microcopy" data-event-status="'+esc(e.id)+'">'+esc(badge(e))+'</p><p class="detail-intro">'+esc(e.program)+'</p>'+keywordTags(e)+translatedDetails(e)+mobileMedia+facts(e)+'<div class="detail-actions"><a class="button primary" href="'+esc(e.sources[0].url)+'" target="_blank" rel="noopener noreferrer">공식 안내 확인 ↗</a><button class="button secondary" data-save="'+esc(e.id)+'" aria-pressed="false">♡ 일정 보관</button><button class="button secondary" data-share="'+esc(e.id)+'">공유하기 ↗</button></div><nav class="detail-tabs" aria-label="상세안내 항목"><a href="#schedule">일정·프로그램 <span aria-hidden="true">↓</span></a><a href="#booking">예약·비용 <span aria-hidden="true">↓</span></a><a href="#location">장소 <span aria-hidden="true">↓</span></a><a href="#sources">공식 출처 <span aria-hidden="true">↓</span></a></nav><div class="detail-columns"><div class="detail-main"><section id="schedule" class="detail-section"><h2>일정과 프로그램</h2><p>'+esc(e.program)+'</p>'+(e.dates?'<div class="date-pills">'+e.dates.map(d=>'<span>'+esc(d.replaceAll('-','.'))+'</span>').join('')+'</div>':'<p class="notice-box">'+esc(e.scheduleType==='period'?'개최기간 중 · 운영일 확인':'공식 공지의 개최 기간입니다.')+'</p>')+'<p>'+esc(e.scheduleNote || '날짜별 프로그램과 실제 운영 시간은 공식 안내에서 확인하세요.')+'</p><p><b>운영 시간</b><br>'+esc(e.time || '확인 필요')+'</p></section><section id="booking" class="detail-section"><h2>예약과 비용</h2><div class="notice-box"><b>'+esc(e.fee || feeLabel(e))+'</b><p>'+esc(e.booking || '예약 방법 확인 필요')+'</p></div><p>'+esc(e.familyNote || '참여 대상·연령·동반 조건은 공식 안내에서 확인하세요.')+'</p><p class="microcopy">예약 가능 좌석·마감·취소 여부를 실시간으로 제공하지 않습니다. 예약과 결제는 공식 운영처에서 진행하세요.</p></section><section id="location" class="detail-section"><h2>찾아가는 곳</h2><p>'+esc(e.location)+'</p><a class="button secondary" target="_blank" rel="noopener noreferrer" href="https://map.naver.com/v5/search/'+encodeURIComponent(e.region+' '+e.location)+'">네이버 지도에서 장소 검색 ↗</a><p class="microcopy">주소 검색 링크입니다. 확정된 행사장 위치·주차·교통 통제는 주최 측 공지를 확인하세요.</p></section><section id="sources" class="detail-section"><h2>직접 확인한 공식 출처</h2>'+officialSources(e)+'</section></div><aside class="detail-aside"><div class="detail-image theme-'+esc(e.theme)+'">'+imageMarkup(e)+'</div>'+(im?'<p class="microcopy image-attribution">'+imageAttribution(im)+'</p>':'')+'<div class="aside-note"><b>출발 전에 한 번 더 확인해요</b><p>날씨와 현장 사정으로 일정이 바뀔 수 있습니다. 최종 운영일·예약·참여 조건은 공식 공지를 우선합니다.</p><small>정보 확인 '+esc(e.checkedAt)+'</small></div></aside></div>';
}

export function visitorGuide() {
 return '<details class="visitor-guide page-width"><summary>여행자를 위한 축제 안내 <span translate="no">KST · KRW · 5 languages</span></summary><p>일정은 한국시간(KST), 금액은 원(KRW) 기준입니다. 장소명은 지도 검색을 위해 한국어 원문도 제공합니다.</p><p class="translation-only" hidden>번역은 탐색을 돕기 위한 행사명·주제 요약입니다. 상세 예약·참여 조건과 공식 출처는 한국어 원문을 확인하세요.</p></details>';
}
export function translatedDetails(e) {
 const pick=highlightFor(e);
 return '<div class="translation-only translation-notice" hidden><p>번역은 탐색을 돕기 위한 행사명·주제 요약입니다. 상세 예약·참여 조건과 공식 출처는 한국어 원문을 확인하세요.</p><details><summary>원문 상세 안내 · 한국어</summary><p data-original lang="ko">'+esc(e.title)+'</p><p data-original lang="ko">'+esc(e.program)+'</p></details></div>'+(pick?'<p class="highlight-explanation"><b>HOT · 주목할 행사</b><span>공식 규모·대표성에 근거한 편집 선정이며 실시간 인기 순위가 아닙니다.</span><a href="'+esc(pick.source)+'" target="_blank" rel="noopener noreferrer">선정 근거 보기 ↗</a></p>':'');
}
