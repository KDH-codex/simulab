import {editorialGuides,guidePillars} from '../data/guides/catalog.mjs';
import {familyGuides} from '../data/family-guides.mjs';
import {readFile} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';
import vm from 'node:vm';
import { FESTIVALS, DATA_REVIEWED_AT } from '../tools/kids-outing-calendar/data.js';
import { filterEvents, selectAcrossRegions, koreaToday, weekendRange, nextDate, escapeHtml as esc } from '../tools/kids-outing-calendar/logic.js';
const root=new URL('../',import.meta.url), scope={};
vm.runInNewContext(await readFile(new URL('assets/js/core-ui.js',root),'utf8'),scope);
const groups=scope.SimuLab.SITE_MENU;
const tools=groups.flatMap(group=>group.items.filter(t=>!t.soon).map(t=>({...t,category:group.id,categoryLabel:group.label})));
if(new Set(tools.map(t=>t.tool)).size!==tools.length) throw new Error('Duplicate catalog entries');
const selected=['salary-net-calc','severance-pay-calc','annual-leave-calc','travel-budget-calc','unit-price-calc','kids-outing-calendar'];
const icons={'area-pyeong-calc':'㎡','percent-discount-calc':'%','korean-age-calc':'D','dutch-pay-roulette':'÷','stock-water-ride-calc':'↗','kids-outing-calendar':'토'};
const href=t=>'/tools/'+t.tool+'/';
const card=(t,featured=false)=>`<a class="tool-card${featured?' featured':''}" href="${href(t)}" data-tool="${esc(t.tool)}" data-category="${esc(t.category)}" data-search="${esc([t.title,t.sub,t.categoryLabel].join(' '))}"><span class="tool-card-top"><span class="tool-symbol" aria-hidden="true">${icons[t.tool]||'↗'}</span><span class="tool-category">${esc(t.categoryLabel)}</span></span><h3>${esc(t.title)}</h3><p>${esc(t.sub)}</p><span class="tool-open">${t.category==='weekday'?'안내 보기':'도구 열기'} <span aria-hidden="true">↗</span></span></a>`;
const today=koreaToday(),weekend=weekendRange(today);
const events=selectAcrossRegions(filterEvents({...weekend,today,includeEnded:false},FESTIVALS),3);
const title='시뮬랩 — 가족 여행·생활정보와 월급·퇴직·연차 계산기';
const description='육아휴직·복직, 월급·퇴직, 생활비 절약에 필요한 공식 안내를 모았습니다. 아이와 가볼 만한 곳, 브랜드 세일 달력과 생활 계산기도 함께 살펴보세요.';
let html=`<!doctype html>
<html lang="ko" data-default-theme="light" data-theme="light">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<title>${title}</title><meta name="description" content="${description}">
<meta name="naver-site-verification" content="1b81691131895febb71347b5ec654887d1660bec">
<meta name="google-adsense-account" content="ca-pub-9815778998394475">
<link rel="canonical" href="https://simulab.kr/"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.json">
<meta property="og:type" content="website"><meta property="og:site_name" content="SimuLab"><meta property="og:url" content="https://simulab.kr/">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:image" content="https://simulab.kr/assets/icons/icon-512.png">
<meta name="twitter:card" content="summary"><meta name="theme-color" content="#176d53">
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'시뮬랩',alternateName:'SimuLab',url:'https://simulab.kr/',description})}</script>
<link rel="stylesheet" href="/assets/css/common.css"><link rel="stylesheet" href="/assets/css/home.css?v=20261023">
</head>
<body class="home-page">
<a class="home-skip" href="#main">본문으로 건너뛰기</a><header id="site-header"></header>
<main id="main" class="home-main">
<section class="family-first" aria-labelledby="family-title"><div class="family-first-heading"><div><p class="home-eyebrow">우리 가족의 주말과 일상</p><h1 id="family-title">신청할 날짜와<br class="family-mobile-break"> 계산할 금액, 함께 확인해요.</h1></div><p>아이와 보내는 하루에<br>필요한 정보부터 모았습니다.</p></div><div class="family-feature-grid"><a class="family-feature outing-feature" href="/tools/kids-outing-calendar/"><span class="family-feature-label">아이와 가볼 만한 곳</span><h2>이번 주말,<br>어디로 가볼까요?</h2><p>지역·날짜별 축제와 행사<br>공식 일정 · 비용 · 예약 안내</p><span class="family-feature-cta">나들이 달력 보기 <b aria-hidden="true">↗</b></span><span class="family-art calendar-art" aria-hidden="true"><i></i><small>WEEKEND</small><strong>토 <em>일</em></strong><span>＋ · ·</span></span></a><a class="family-feature shopping-feature" href="/tools/parenting-deals/"><span class="family-feature-label">생활 속 알뜰한 타이밍</span><h2>언제 세일할까?<br>달력으로 한눈에.</h2><p>라이프 · 패션 · 뷰티 · 키즈 · 가구<br>기간 한정 대표 세일 · 공식 조건</p><span class="family-feature-cta">브랜드 세일 달력 보기 <b aria-hidden="true">↗</b></span><span class="family-art coupon-art" aria-hidden="true"><small>CHECK FIRST</small><strong>%</strong><span>조건까지 확인</span></span></a></div><p class="family-first-note">나들이는 방문 전 운영 공지를, 쇼핑은 구매 전 공식몰의 최종 조건을 확인해 주세요.</p></section>
<section id="weekday-life" class="weekday-home" aria-labelledby="weekday-home-title"><div class="weekday-home-heading"><div><p class="home-eyebrow">주말 사이, 우리의 평일</p><h2 id="weekday-home-title">일하는 날에도 필요한 정보.</h2></div><p>상황별 확인 목록에서<br>공식 안내와 계산기까지.</p></div><div class="weekday-home-grid"><a class="weekday-home-card weekday-parents" href="/tools/working-parents-guide/"><span class="weekday-home-number">01 <i>일과 돌봄</i></span><h3>육아휴직·복직</h3><p>휴가와 휴직, 단축근무<br>복직 뒤 보육·돌봄 알아보기</p><span class="weekday-home-open">안내 6개 살펴보기 <b aria-hidden="true">↗</b></span></a><a class="weekday-home-card weekday-work" href="/tools/pay-work-guide/"><span class="weekday-home-number">02 <i>월급과 다음 일</i></span><h3>월급·퇴직</h3><p>급여명세서부터 퇴직금까지<br>실업급여·직업훈련 확인하기</p><span class="weekday-home-open">안내 6개 살펴보기 <b aria-hidden="true">↗</b></span></a><a class="weekday-home-card weekday-cost" href="/tools/living-cost-guide/"><span class="weekday-home-number">03 <i>반복되는 지출</i></span><h3>생활비 절약</h3><p>장보기 단가와 멤버십<br>통신비·주거비 조건 비교하기</p><span class="weekday-home-open">안내 6개 살펴보기 <b aria-hidden="true">↗</b></span></a></div><p class="weekday-home-note">공식 출처와 확인일을 함께 제공합니다. 신청·구매 전 최신 조건을 확인해 주세요.</p></section>
<section class="home-hero" aria-labelledby="home-title"><div>
<p class="home-eyebrow"><span></span> 일상에 필요한 작은 실험실</p>
<h2 id="home-title">계산하고, 비교하고.<br><em>선택을 조금 더 쉽게.</em></h2>
<p class="hero-copy">월급·퇴직·연차부터 가족 여행 예산과 생활비까지.<br class="desktop-break"> 필요한 도구를 찾아 가볍게 확인해 보세요.</p>
<form class="home-search" role="search"><label for="tool-search" class="sr-only">도구 검색</label><span aria-hidden="true">⌕</span><input id="tool-search" type="search" maxlength="100" placeholder="월급, 연차, 여행 예산, 단가 비교…" autocomplete="off"><button type="submit">찾기</button></form>
<p class="search-suggestions">이런 도구를 찾으세요? <a href="/tools/area-pyeong-calc/">평수 변환</a><a href="/tools/percent-discount-calc/">할인율</a><a href="/tools/kids-outing-calendar/">주말 나들이</a></p>
</div><aside class="hero-board" aria-label="시뮬랩 활용 예시">
<div class="board-caption"><span>하루의 궁금증을 한 칸씩</span><span aria-hidden="true">＋</span></div>
<a class="board-area" href="/tools/area-pyeong-calc/"><span>우리 집 면적, 몇 평일까?</span><strong>84<small>㎡</small><i>↔</i>25.41<small>평</small></strong><span class="board-foot">면적 단위 변환 예시 <b>↗</b></span></a>
<div class="board-bottom"><a href="/tools/percent-discount-calc/"><span class="board-symbol">%</span><strong>할인 뒤 가격은?</strong><span>할인율 계산 ↗</span></a><a href="/tools/kids-outing-calendar/"><span class="board-symbol calendar-symbol">SAT</span><strong>이번 주말 어디로?</strong><span>가족 나들이 달력 ↗</span></a></div>
<p class="board-note">복잡한 선택 앞에, 작은 기준 하나.</p></aside></section>
<section id="recommendations" class="home-section"><div class="section-intro"><div><p class="home-eyebrow">QUICK START</p><h2>이 도구부터 시작해 보세요</h2></div><a class="section-link" href="#all-tools">전체 ${tools.length}개 도구·안내 보기 <span>↗</span></a></div><div class="tool-grid recommended-grid">${selected.map(id=>card(tools.find(t=>t.tool===id),true)).join('\n')}</div></section>
<section class="weekend-section" aria-labelledby="weekend-title"><div class="weekend-intro"><p class="home-eyebrow">WEEKEND, TOGETHER</p><h2 id="weekend-title">주말은 조금 더<br>함께 보내세요.</h2><p>공식 공지에서 확인한 일정과<br>비용·예약 조건을 모았습니다.</p><p class="weekend-reviewed">행사 자료 검토 <time datetime="${DATA_REVIEWED_AT}">${DATA_REVIEWED_AT}</time></p><a href="/tools/kids-outing-calendar/">나들이 달력 열기 ↗</a></div><div class="weekend-list" id="home-events" data-reviewed="${DATA_REVIEWED_AT}">${events.length?events.map(e=>`<a class="weekend-event" href="/tools/kids-outing-calendar/?range=day&amp;date=${nextDate(e,weekend.start)}&amp;q=${encodeURIComponent(e.title)}&amp;view=list"><span class="event-date">${esc(nextDate(e,weekend.start).slice(5).replace('-','.'))}<small>${esc(e.region)}</small></span><div><h3>${esc(e.title)}</h3><p>${esc(e.location)}</p><span>${esc(e.fee)}</span></div><b aria-hidden="true">↗</b></a>`).join(''):'<p>확인된 새 행사 안내는 나들이 달력에서 살펴보세요.</p>'}</div></section>
<section id="saved-section" class="home-section saved-section" hidden><div class="section-intro"><div><p class="home-eyebrow">YOUR SHORTCUTS</p><h2>최근에 사용한 도구</h2></div><button class="quiet-button" type="button" id="clear-recents">기록 지우기</button></div><div id="recent-tools" class="recent-tools"></div></section>
<section id="all-tools" class="home-section" aria-labelledby="directory-title"><div class="section-intro"><div><p class="home-eyebrow">TOOL DIRECTORY</p><h2 id="directory-title">필요한 순간, 필요한 도구</h2></div><span id="catalog-status" role="status">${tools.length}개 도구·안내</span></div>
<div class="category-filters" aria-label="도구 카테고리"><button type="button" data-category-filter="all" aria-pressed="true">전체 ${tools.length}</button>${groups.map(g=>`<button type="button" data-category-filter="${g.id}" aria-pressed="false">${esc(g.label)} <span>${g.items.filter(t=>!t.soon).length}</span></button>`).join('')}</div>
<p class="directory-hint">카테고리를 펼쳐 둘러보거나, 위 검색창에 도구 이름을 입력해 보세요.</p>
<div id="tool-directory">${groups.map((g,i)=>`<details class="tool-group" id="cat-${g.id}" data-group="${g.id}"${i===1?' open':''}><summary><span>${esc(g.label)}</span><small>${g.items.length}개 도구·안내</small><b aria-hidden="true">＋</b></summary><div class="tool-grid">${tools.filter(t=>t.category===g.id).map(t=>card(t)).join('\n')}</div></details>`).join('\n')}</div><p id="catalog-empty" class="catalog-empty" hidden>찾는 도구가 아직 없습니다. 다른 단어로 검색하거나 전체 도구를 살펴보세요.</p><noscript><p>모든 도구는 위 카테고리를 펼쳐 이용할 수 있습니다. 실시간 검색은 JavaScript가 필요합니다.</p></noscript></section>
<section class="home-principles"><div><span>01</span><h2>가정을 확인하고</h2><p>숫자는 조건에 따라 달라집니다.<br>입력 단위와 계산 기준을 함께 살펴보세요.</p></div><div><span>02</span><h2>출처를 살펴보고</h2><p>통계와 행사 안내는 집계 시점과<br>공식 공지의 확인 범위를 표시합니다.</p></div><div><span>03</span><h2>오류는 바로잡고</h2><p>확인되지 않은 값을 확정하지 않습니다.<br><a href="/legal/editorial.html">정보·정정 기준 알아보기 ↗</a></p></div></section>
</main><footer id="site-footer"></footer><script src="/assets/js/core-ui.js?v=20261023"></script><script type="module" src="/assets/js/home.js?v=20261023"></script>
</body></html>\n`;
const familyHub=`<section class="family-hub-home" aria-labelledby="family-hub-title"><div class="section-intro"><div><p class="home-eyebrow">신청일도, 함께 나갈 날도</p><h2 id="family-hub-title">우리 가족에게 필요한 정보.</h2></div><a href="/tools/family-info-calendar/">9개 분야 모아보기 ↗</a></div><p>체험과 도서관, 가족 지원부터 캠핑·공연·팝업·할인까지.<br>공식 공지의 신청일과 이용 조건을 함께 살펴보세요.</p><div class="family-hub-home-grid">${groups.find(g=>g.id==='family').items.filter(t=>t.tool!=='family-info-calendar').map(t=>`<a href="/tools/${t.tool}/"><strong>${esc(t.title)}</strong><span>${esc(t.sub)}</span><b aria-hidden="true">↗</b></a>`).join('')}</div></section>`;
html=html.replace('<section id="weekday-life"',familyHub+'\n<section id="weekday-life"');
html=html.replace('<section id="saved-section"', `<section class="home-section"><div class="section-intro"><div><p class="home-eyebrow">방문·예약 전에 읽어보세요</p><h2>가족 나들이 준비 가이드</h2></div></div><div class="tool-grid">${(await import('../data/family-guides.mjs')).familyGuides.map(g=>`<a class="tool-card" href="/guides/${g.slug}/"><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p><span class="tool-open">상세 안내 읽기 ↗</span></a>`).join('')}</div></section>\n<section id="saved-section"`);
html=html.replace(/<a class="family-feature shopping-feature"[\s\S]*?<\/a>/, '<a class="family-feature shopping-feature" href="/tools/pay-work-guide/"><span class="family-feature-label">일하는 날의 생활 기준</span><h2>월급·퇴직·연차,<br>숫자와 기준을 함께.</h2><p>급여명세서부터 퇴직 준비까지<br>입력 설명 · 계산 예시 · 공식 근거</p><span class="family-feature-cta">직장인 안내와 계산기 보기 <b aria-hidden="true">↗</b></span><span class="family-art coupon-art" aria-hidden="true"><small>WORKDAY</small><strong>₩</strong><span>기준부터 확인</span></span></a>');
html=html.replace('아이와 보내는 하루에<br>필요한 정보부터 모았습니다.','가족 나들이와 생활비,<br>일하는 날의 계산을 함께.');
html=html.replace('나들이는 방문 전 운영 공지를, 쇼핑은 구매 전 공식몰의 최종 조건을 확인해 주세요.','나들이는 공식 운영 공지를, 계산은 입력 조건과 적용 기준을 함께 확인해 주세요.');
html=html.replace('</div><p class="family-first-note">','</div><nav class="focus-shortcuts" aria-label="자주 찾는 정보"><a href="/tools/salary-net-calc/">월급 실수령액 ↗</a><a href="/tools/severance-pay-calc/">퇴직금 ↗</a><a href="/tools/annual-leave-calc/">연차 ↗</a><a href="/tools/travel-budget-calc/">여행 예산 ↗</a><a href="/tools/parenting-deals/">브랜드 세일 달력 ↗</a></nav><p class="family-first-note">');
const hero=html.match(/<section class="home-hero"[\s\S]*?<\/aside><\/section>/)?.[0];
const recommendations=html.match(/<section id="recommendations"[\s\S]*?<\/section>/)?.[0];
if(!hero||!recommendations)throw new Error('Missing focused home anchors');
const search=hero.match(/<form class="home-search"[\s\S]*?<\/form>/)[0];
html=html.replace(hero,'').replace(recommendations,'').replace('<section class="family-hub-home"','<section class="focus-search" aria-label="계산기와 안내 검색">'+search+'</section>'+recommendations+'<section class="family-hub-home"');
const pillarPicks={family:['parental-leave-return-checklist','parent-benefit-apply-2026','child-allowance-apply-2026'],work:['take-home-pay-cases-2026','severance-pay-cases','year-end-tax-checklist-2026'],life:['public-camping-openings-2026-winter','winter-break-program-preparation','shopping-membership-comparison']};
const contentHub=`<section class="content-pillars home-section" aria-labelledby="content-pillars-title"><div class="section-intro"><div><p class="home-eyebrow">지금 필요한 신청과 계산</p><h2 id="content-pillars-title">날짜와 금액에서 시작하는 가이드.</h2></div><a class="section-link" href="/guides/">전체 ${editorialGuides.length+familyGuides.length}편 읽기 ↗</a></div><div class="content-pillar-grid">${guidePillars.map((p,i)=>`<section class="content-pillar pillar-${p.id}"><span>0${i+1}</span><h3><a href="/guides/#pillar-${p.id}">${esc(p.title)} ↗</a></h3><p>${esc(p.description)}</p><ul>${pillarPicks[p.id].map(slug=>{const g=editorialGuides.find(g=>g.slug===slug);return `<li><a href="/guides/${g.slug}/">${esc(g.title)}</a></li>`;}).join('')}</ul></section>`).join('')}</div><p class="directory-hint">공식 출처·확인일과 가상 숫자 사례를 함께 제공합니다. 계산기에서는 내 조건으로 다시 확인하세요.</p></section>`;
html=html.replace('<section id="recommendations"',contentHub+'<section id="recommendations"');
if(process.argv.includes('--check')) {
  // The page is date-sensitive; validate catalog identity separately from weekend contents.
  const current=await readFile(new URL('index.html',root),'utf8');
  for(const t of tools) if(!current.includes('data-tool="'+t.tool+'"')) throw new Error('Missing home tool: '+t.tool);
  console.log('Home catalog: '+tools.length+' tools agree.');
} else { await writeFile(new URL('index.html',root),html); console.log('Built home: '+tools.length+' tools.'); }
