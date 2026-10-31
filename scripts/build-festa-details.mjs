import {mkdir,readFile} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';

const root=new URL('../',import.meta.url);
const all=JSON.parse(await readFile(new URL('data/events/reviewed.json',root),'utf8'));
const images=JSON.parse(await readFile(new URL('data/events/images.json',root),'utf8'));
const events=all.filter(e=>e.verificationStatus==='verified'&&/^[a-z0-9-]+$/.test(e.id)&&e.sources?.some(s=>/^https:\/\//.test(s.url)));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const theme={light:['✦','밤과 빛'],food:['◒','먹거리'],nature:['❋','자연'],kids:['✳','가족·체험']};
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const day=s=>s?.replaceAll('-','.');
const sourceLink=e=>e.sources.find(s=>/^https:\/\//.test(s.url)).url;

for(const e of events){
  const image=images[e.id];
  const page=new URL(`events/${e.id}/index.html`,root);
  await mkdir(new URL(`events/${e.id}/`,root),{recursive:true});
  const ended=e.endDate<today;
  const fullRange=e.startDate===e.endDate?day(e.startDate):`${day(e.startDate)} — ${day(e.endDate)}`;
  const operation=e.dates?.length
    ? `<p class="detail-subtext">기간 중 아래 날짜에 운영합니다. 회차별 프로그램은 공식 공지를 확인하세요.</p><div class="date-pills">${e.dates.map(d=>`<time datetime="${esc(d)}">${esc(day(d))}</time>`).join('')}</div>`
    : `<p class="detail-subtext">공식 안내에 기록된 행사 기간</p><strong class="schedule-range">${esc(fullRange)}</strong>`;
  const sources=e.sources.filter(s=>/^https:\/\//.test(s.url)).map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(s.publisher||'공식 출처')}</span><strong>${esc(s.title||'행사 안내')} ↗</strong></a><small>확인 ${esc(s.checkedAt||e.checkedAt||'')}</small></li>`).join('');
  const status=ended?'종료된 행사 · 기록 보관':'일정 확인된 행사';
  const title=`${e.title} | 시뮬랩 축제 달력`;
  const description=`${e.title} · ${fullRange} · ${e.location}. ${e.program||'공식 일정과 방문 조건을 확인하세요.'}`.slice(0,155);
  const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="https://simulab.kr/events/${esc(e.id)}/"><link rel="icon" href="/favicon.svg">
<link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#fb5427">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(e.title)}">
<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://simulab.kr/events/${esc(e.id)}/">${image?`<meta property="og:image" content="https://simulab.kr${esc(image.src)}">`:''}
<link rel="stylesheet" href="/assets/css/festa-home.css"><link rel="stylesheet" href="/assets/css/festa-detail.css">
<script type="module" src="/assets/js/festa-detail.js"></script></head>
<body data-event-id="${esc(e.id)}" data-event-title="${esc(e.title)}"><a class="skip" href="#main">본문으로 이동</a>
<header class="site-head"><div class="head-inner"><a class="brand" href="/"><span class="brand-mark">✳</span><span>simu<span>lab</span><small>오늘의 발견</small></span></a><nav aria-label="주요 메뉴"><a href="/#discover">행사 찾기</a><a href="/#calendar">날짜별 보기</a><a href="/tools/kids-outing-calendar/">나들이 달력</a><a href="/library/">생활 도구</a></nav><a class="head-cta" href="/">다른 행사 보기 ↗</a></div></header>
<main id="main" class="detail-main wrap">
<nav class="breadcrumb" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/#discover">축제·행사</a><span>›</span><span>${esc(e.title)}</span></nav>
<section class="detail-hero theme-${esc(e.theme)} ${image?`with-photo ${image.display==='poster'?'with-poster':''}`:''}">${image?`<img class="detail-hero-photo" src="${esc(image.src)}" alt="${esc(e.title+' 주제 참고 사진 · 행사 현장 아님')}" fetchpriority="high" decoding="async">`:`<div class="detail-hero-art" aria-hidden="true"><span>${theme[e.theme]?.[0]||'✦'}</span></div>`}<div class="detail-hero-copy"><span class="detail-status">${esc(status)}</span><span class="detail-region">${esc(e.region)} · ${theme[e.theme]?.[1]||'행사'}</span><h1>${esc(e.title)}</h1><p>${esc(e.program||'공식 안내에 기록된 행사입니다.')}</p><div class="detail-hero-actions"><a href="${esc(sourceLink(e))}" target="_blank" rel="noopener noreferrer">공식 행사 안내 ↗</a><button type="button" data-save-event aria-pressed="false">♡ 일정 저장</button><button type="button" data-share-event>↗ 공유</button></div><span class="detail-feedback" data-feedback role="status"></span></div>${image?`<a class="detail-image-credit" href="${esc(image.creditUrl)}" target="_blank" rel="noopener noreferrer">${esc(image.kind==='context'?'주제 참고 사진 · 행사 현장 아님 · '+image.credit:'이미지: '+image.credit)} ↗</a>`:''}</section>
<nav class="detail-tabs" aria-label="행사 상세 메뉴"><a href="#overview">핵심 정보</a><a href="#schedule">운영 일정</a><a href="#visit">방문 안내</a><a href="#sources">공식 출처</a></nav>
<div class="detail-layout"><div class="detail-content">
<section id="overview" class="detail-block"><span class="eyebrow">AT A GLANCE</span><h2>이 행사의 핵심만.</h2><div class="detail-facts">
<div><span>언제</span><strong>${esc(fullRange)}</strong></div><div><span>어디서</span><strong>${esc(e.location)}</strong></div>
<div><span>입장·요금</span><strong>${esc(e.fee||'공식 안내 확인')}</strong></div><div><span>프로그램</span><strong>${esc(e.program||'공식 안내 확인')}</strong></div></div></section>
<section id="schedule" class="detail-block"><span class="eyebrow">WHEN TO GO</span><h2>가는 날부터 고르세요.</h2>${operation}
<div class="info-note"><span>운영 시간</span><p>${esc(e.time||'날짜별 운영 시간은 공식 안내에서 확인해 주세요.')}</p></div>
${e.scheduleNote?`<p class="detail-caution">${esc(e.scheduleNote)}</p>`:''}</section>
<section id="visit" class="detail-block"><span class="eyebrow">BEFORE YOU GO</span><h2>출발 전 확인할 것.</h2>
<div class="visit-grid"><div><span>장소</span><strong>${esc(e.location)}</strong></div><div><span>예약·접수</span><strong>${esc(e.booking||'공식 안내 확인')}</strong></div></div>
${e.familyNote?`<div class="editor-note"><strong>시뮬랩 체크 포인트</strong><p>${esc(e.familyNote)}</p></div>`:''}
<p class="detail-caution">행사 일정·요금·현장 운영은 변경될 수 있습니다. 방문 전 주최 측의 최신 공지를 확인하세요.</p>
<a class="official-link" href="${esc(sourceLink(e))}" target="_blank" rel="noopener noreferrer">주최 측 공식 안내에서 다시 확인 ↗</a></section>
<section id="sources" class="detail-block"><span class="eyebrow">SOURCE CHECK</span><h2>정보는 여기서 확인했습니다.</h2><p class="detail-subtext">자료 최종 확인: <time datetime="${esc(e.checkedAt||'')}">${esc(e.checkedAt||'확인일 미기록')}</time></p><ul class="source-list">${sources}</ul></section>
</div><aside class="detail-aside"><div class="sticky-info"><span class="eyebrow">YOUR FESTA NOTE</span><h2>${esc(e.title)}</h2><p>${esc(fullRange)}<br>${esc(e.region)}</p><a href="${esc(sourceLink(e))}" target="_blank" rel="noopener noreferrer">공식 행사 안내 ↗</a><small>예매·신청은 공식 페이지의 실제 안내를 따릅니다.</small></div></aside></div>
<div class="back-home"><a href="/#discover">← 다른 행사 둘러보기</a></div></main>
<div class="mobile-detail-bar"><button type="button" data-save-event aria-pressed="false">♡ 저장</button><a href="${esc(sourceLink(e))}" target="_blank" rel="noopener noreferrer">공식 행사 안내 ↗</a></div>
<footer class="site-foot"><div class="wrap"><div><a class="brand" href="/"><span class="brand-mark">✳</span><span>simu<span>lab</span></span></a><p>오늘을 좀 더 재밌게 고르는 곳.</p></div><nav aria-label="하단 메뉴"><a href="/">홈</a><a href="/library/">도구 모음</a><a href="/legal/about.html">소개·문의</a><a href="/legal/privacy.html">개인정보처리방침</a></nav></div></footer>
</body></html>`;
  await writeFile(page,html);
}
console.log(`Built ${events.length} verified festival detail pages.`);
