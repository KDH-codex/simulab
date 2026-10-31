import {readFile} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';

// 프로젝트 루트 경로를 기준으로 데이터 파일들을 읽어옵니다.
const root = new URL('../', import.meta.url);
const source = JSON.parse(await readFile(new URL('data/events/reviewed.json', root), 'utf8'));
const images = JSON.parse(await readFile(new URL('data/events/images.json', root), 'utf8'));

// 가족 정보 통합 달력(체험·교육, 공연·전시, 키즈 팝업, 캠핑, 세일 등) 데이터도 함께 읽어와 달력에서 탐색할 수 있게 합니다.
let familyFeed = {categories: [], records: []};
try {
  familyFeed = JSON.parse(await readFile(new URL('feeds/family-info/latest.json', root), 'utf8'));
} catch {
  familyFeed = {categories: [], records: []};
}

// HTML 특수문자 이스케이프 함수 (보안 및 안전한 렌더링용)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

// 한국 시간(Asia/Seoul) 기준 오늘 날짜(YYYY-MM-DD)를 구합니다.
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

// 공식 출처(https://)와 검증 상태(verified)가 확인된 축제·행사만 선별합니다.
const events = source.filter(
  e => e.verificationStatus === 'verified' && /^https:\/\//.test(e.sources?.[0]?.url || '')
);

// 오늘 이후 가장 빠른 운영일을 계산하는 함수입니다.
const next = e => e.dates?.length
  ? e.dates.find(d => d >= today)
  : (e.endDate >= today ? (e.startDate > today ? e.startDate : today) : undefined);

// 현재 진행 중이거나 곧 열리는 축제 목록을 날짜순·이름순으로 정렬합니다.
const upcoming = events
  .filter(next)
  .sort((a, b) => next(a).localeCompare(next(b)) || a.title.localeCompare(b.title));

// 히어로 캐러셀에 노출할 대표 행사 3선과 우측 프리뷰 2선을 선정합니다.
const heroCandidates = [
  upcoming.find(e => e.theme === 'light' && images[e.id]),
  ...upcoming.filter(e => images[e.id]),
  ...upcoming
].filter((e, idx, arr) => e && arr.indexOf(e) === idx);

const heroSlides = heroCandidates.slice(0, 3);
const hero = heroSlides[0] || upcoming[0];
const spotlight = upcoming.filter(e => e !== hero).slice(0, 2);

// 데이터 최종 확인일
const reviewed = source.map(e => e.checkedAt).filter(Boolean).sort().at(-1) || today;

// 날짜 표기 포맷 함수 (예: 10.30 — 11.01)
const date = e => e.startDate === e.endDate
  ? e.startDate.slice(5).replace('-', '.')
  : e.startDate.slice(5).replace('-', '.') + ' — ' + e.endDate.slice(5).replace('-', '.');

// 상세 페이지 주소 생성 함수
const url = e => '/events/' + encodeURIComponent(e.id) + '/';

// 테마별 아이콘, 한글 이름, 해시태그 정의
const art = {
  light: ['✦', '불꽃·야경', '#야간경관'],
  food: ['◒', '미식·먹거리', '#미식체험'],
  nature: ['❋', '자연·정원', '#가을산책'],
  kids: ['✳', '가족·체험', '#가족나들이']
};

// 요금 상태 한글 라벨 변환 함수
const feeLabel = feeStatus =>
  feeStatus === 'free' ? '무료 관람' :
  feeStatus === 'unknown' ? '요금 확인' :
  feeStatus === 'mixed' ? '일부 유료' : '유료 입장';

// 오늘 날짜 기준 D-Day 또는 진행중 상태 라벨을 계산하는 함수
function getStatusBadge(e) {
  const nextDate = next(e);
  if (!nextDate) return {text: '종료', tone: 'ended'};
  if (e.startDate <= today && e.endDate >= today) {
    if (!e.dates?.length || e.dates.includes(today)) {
      return {text: '진행중', tone: 'live'};
    }
    return {text: `다음 운영 ${nextDate.slice(5).replace('-', '.')}`, tone: 'upcoming'};
  }
  const t0 = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
  const t1 = new Date(Number(e.startDate.slice(0, 4)), Number(e.startDate.slice(5, 7)) - 1, Number(e.startDate.slice(8, 10)));
  const diff = Math.round((t1 - t0) / 86400000);
  if (diff === 0) return {text: '오늘 개막', tone: 'live'};
  if (diff > 0) return {text: `D-${diff}`, tone: 'dday'};
  return {text: '진행중', tone: 'live'};
}

// 행사 제목을 달력 셀 안에 넣기 좋게 짧은 별칭으로 줄이는 함수
function shortTitle(title) {
  return String(title || '')
    .replace(/^202\d\s*/, '')
    .replace(/^제\d+회\s*/, '')
    .replace(/\s*페스티벌|\s*축제|\s*문화제|\s*대향연|\s*한마당/g, '')
    .trim()
    .slice(0, 7);
}

// 행사별 키워드 태그 배열 생성 함수
function buildTags(e) {
  const tags = [`#${e.region}축제`, art[e.theme]?.[2] || '#문화행사'];
  if (e.feeStatus === 'free') tags.push('#무료입장');
  else if (e.feeStatus === 'mixed') tags.push('#일부유료');
  if (e.dates?.length) tags.push('#운영일지정');
  return tags.slice(0, 3);
}

// 메인 탐색 그리드(#discover)에 들어갈 개별 축제 카드 HTML 생성 함수 (AI Studio 카드 디자인 + 마우스 스포트라이트 & 빠른 미리보기 지원)
const card = (e, index) => {
  const image = images[e.id];
  const badge = getStatusBadge(e);
  const tags = buildTags(e);
  const feeShort = feeLabel(e.feeStatus);
  return `<article class="event-card" style="--stagger-idx:${index % 9}" data-id="${esc(e.id)}" data-search="${esc((e.title + ' ' + e.region + ' ' + e.location + ' ' + (e.program || '')).toLowerCase())}" data-theme="${esc(e.theme)}" data-region="${esc(e.region)}" data-start="${esc(e.startDate)}" data-end="${esc(e.endDate)}" data-fee="${esc(e.feeStatus)}" data-title="${esc(e.title)}" data-dates="${esc((e.dates || []).join(','))}"><a class="card-link" href="${esc(url(e))}"><div class="card-art art-${esc(e.theme)} ${image ? 'has-photo ' + (image.display === 'poster' ? 'is-poster' : '') : ''}"><span class="art-orbit"></span><span class="art-symbol" aria-hidden="true">${art[e.theme]?.[0] || '✦'}</span>${image ? `<img src="${esc(image.src)}" alt="${esc(e.title + ' 주제 참고 사진 · 행사 현장 아님')}" loading="lazy" decoding="async">` : ''}<div class="card-top-badges"><span class="status-pill tone-${esc(badge.tone)}">${esc(badge.text)}</span><span class="theme-pill">${art[e.theme]?.[0] || '✦'} ${esc(art[e.theme]?.[1] || '행사')}</span></div><div class="card-bottom-overlay"><span class="overlay-date">📅 ${esc(date(e))}</span><span class="overlay-fee">${esc(feeShort)}</span></div>${image ? `<span class="art-credit">${esc(image.kind === 'context' ? '주제 참고 · 현장 사진 아님' : '이미지: ' + image.credit)}</span>` : ''}</div><div class="card-body"><p class="card-place"><span class="pin-icon" aria-hidden="true">📍</span> <strong>${esc(e.region)}</strong> · ${esc(e.location)}</p><h3>${esc(e.title)}</h3><p class="card-desc">${esc(e.program || '공식 안내에서 상세 프로그램과 일정을 확인하세요.')}</p><div class="card-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div><div class="card-foot"><div class="fee-box"><small>입장·요금</small><strong>${esc(e.fee || feeShort)}</strong></div><div class="card-foot-actions"><span class="detail-btn">상세보기 ›</span></div></div></div></a></article>`;
};

// 히어로 우측 '다음 주목할 축제 2선' 가로형 프리뷰 카드 HTML 생성 함수
const mini = e => {
  const image = images[e.id];
  const badge = getStatusBadge(e);
  return `<a class="mini-event" href="${esc(url(e))}" data-mini-id="${esc(e.id)}"><span class="mini-date ${image ? 'with-image' : ''} tone-${esc(e.theme)}">${image ? `<img src="${esc(image.src)}" alt="" loading="lazy" decoding="async">` : `<i class="mini-symbol" aria-hidden="true">${art[e.theme]?.[0] || '✦'}</i>`}<em>${esc(badge.text)}</em><span>${esc(next(e).slice(5).replace('-', '.'))}</span></span><span class="mini-info"><small class="mini-cat">${esc(e.region)} · ${esc(art[e.theme]?.[1] || '축제')}</small><b>${esc(e.title)}</b><span class="mini-desc">${esc(e.program || e.location)}</span><span class="mini-meta"><span>${esc(date(e))}</span><strong>${esc(feeLabel(e.feeStatus))}</strong></span></span><i class="mini-arrow" aria-hidden="true">↗</i></a>`;
};

// 가족 정보 통합 달력(feeds/family-info/latest.json)의 일정 데이터를 달력 타임라인용 포맷으로 변환합니다.
const categoryNameMap = Object.fromEntries(
  (familyFeed.categories || []).map(c => [c.id, c.shortName || c.name])
);

const familyCalendarItems = (familyFeed.records || [])
  .filter(r => r.publicationStatus === 'verified' && !(r.categoryIds || []).includes('festivals'))
  .map(r => {
    const catId = r.categoryIds?.[0] || 'family-info';
    const catLabel = categoryNameMap[catId] || '가족정보';
    const scope = ['kids-programs', 'family-culture', 'kids-popups', 'local-parenting'].includes(catId)
      ? 'culture'
      : 'benefit';
    const themeCode = scope === 'culture' ? 'kids' : (catId === 'camping-booking' ? 'nature' : 'food');

    const rawStart = (r.eventStart || r.applicationStart || '').slice(0, 10);
    const rawEnd = (r.eventEnd || r.applicationEnd || rawStart).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawStart)) return null;
    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(rawEnd) && rawEnd >= rawStart ? rawEnd : rawStart;

    // 21일을 초과하는 장기 상시 정보는 달력 셀이 과밀해지지 않도록 시작일과 종료일(마감일)에만 핀 표시합니다.
    const t0 = new Date(Number(rawStart.slice(0, 4)), Number(rawStart.slice(5, 7)) - 1, Number(rawStart.slice(8, 10)));
    const t1 = new Date(Number(endDate.slice(0, 4)), Number(endDate.slice(5, 7)) - 1, Number(endDate.slice(8, 10)));
    const spanDays = Math.round((t1 - t0) / 86400000);
    const dates = spanDays > 21 ? [...new Set([rawStart, endDate])] : [];

    return {
      id: 'fam-' + r.id,
      title: r.title,
      shortLabel: shortTitle(r.title),
      region: r.region || '전국',
      location: r.location || catLabel,
      theme: themeCode,
      scope,
      categoryLabel: catLabel,
      startDate: rawStart,
      endDate,
      dates,
      program: r.summary || r.scheduleNote || '',
      time: r.scheduleNote || '',
      feeStatus: r.feeStatus || 'unknown',
      fee: r.feeText || feeLabel(r.feeStatus),
      url: r.siteUrl || '/tools/family-info-calendar/',
      officialUrl: r.officialUrl || r.siteUrl || '/tools/family-info-calendar/',
      sourceName: r.organizer || catLabel,
      checkedAt: (r.verifiedAt || reviewed).slice(0, 10)
    };
  })
  .filter(Boolean);

// 브라우저(assets/js/festa-home.js)로 전달할 전체 일정 JSON 데이터
const festaItems = events.map(e => ({
  id: e.id,
  title: e.title,
  shortLabel: shortTitle(e.title),
  region: e.region,
  location: e.location,
  theme: e.theme,
  scope: 'festival',
  categoryLabel: art[e.theme]?.[1] || '축제·행사',
  startDate: e.startDate,
  endDate: e.endDate,
  dates: e.dates || [],
  program: e.program || '',
  time: e.time || '',
  feeStatus: e.feeStatus || 'unknown',
  fee: e.fee || feeLabel(e.feeStatus),
  url: url(e),
  officialUrl: e.sources?.[0]?.url || url(e),
  sourceName: e.sources?.[0]?.label || e.organizer || '공식 안내',
  checkedAt: e.checkedAt || reviewed,
  image: images[e.id] && {
    src: images[e.id].src,
    credit: images[e.id].credit,
    creditUrl: images[e.id].creditUrl,
    kind: images[e.id].kind
  }
}));

const allCalendarData = [...festaItems, ...familyCalendarItems];
const data = JSON.stringify(allCalendarData).replace(/</g, '\\u003c');

// 지역별 진행 예정 축제 건수 집계 (#discover 섹션용)
const regionCounts = {};
for (const e of upcoming) {
  regionCounts[e.region] = (regionCounts[e.region] || 0) + 1;
}
const regions = Object.keys(regionCounts).sort((a, b) => (regionCounts[b] - regionCounts[a]) || a.localeCompare(b));

// 달력(#calendar) 상단 지역별 선택 탭용 전체 일정 지역 집계 (오늘 이후 유효 일정 기준)
const activeCalendarItems = allCalendarItems =>
  allCalendarItems.filter(item => item.endDate >= today);

const validCalItems = activeCalendarItems(allCalendarData);
const calRegionCounts = {};
for (const item of validCalItems) {
  const r = item.region || '전국';
  calRegionCounts[r] = (calRegionCounts[r] || 0) + 1;
}
// 시·도 지역을 건수 순으로 정렬하되 '전국' 공통은 앞쪽(전체 바로 다음 또는 주요 지역 옆)에 보기 좋게 배치
const calRegions = Object.keys(calRegionCounts).sort((a, b) => {
  if (a === '전국') return 1;
  if (b === '전국') return -1;
  return (calRegionCounts[b] - calRegionCounts[a]) || a.localeCompare(b);
});

// 테마별 진행 예정 행사 건수 집계
const themeCounts = {
  all: upcoming.length,
  light: upcoming.filter(e => e.theme === 'light').length,
  food: upcoming.filter(e => e.theme === 'food').length,
  nature: upcoming.filter(e => e.theme === 'nature').length,
  kids: upcoming.filter(e => e.theme === 'kids').length
};

const heroImage = hero && images[hero.id];
const heroBadge = hero ? getStatusBadge(hero) : {text: '일정 준비중', tone: 'upcoming'};
const heroTags = hero ? buildTags(hero) : ['#시뮬랩', '#공식일정'];

// 가족 정보 카테고리 요약 카드 목록 (하단 큐레이션 섹션용)
const familySummaryCards = (familyFeed.categories || []).slice(0, 6).map((c, idx) => `
  <a class="curation-rank-item" href="${esc(c.href)}">
    <span class="rank-num tone-${idx < 2 ? 'orange' : idx < 4 ? 'violet' : 'slate'}">${idx + 1}</span>
    <span class="rank-body">
      <strong>${esc(c.name)}</strong>
      <small>${esc(c.description)}</small>
    </span>
    <span class="rank-meta">
      <b>확인된 정보 ${esc(c.currentCount || c.verifiedCount || 0)}건</b>
      <i>바로가기 ↗</i>
    </span>
  </a>
`).join('');

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>시뮬랩 | 오늘 나갈 이유를 찾다 · 축제·행사·가족 정보 달력</title>
  <meta name="description" content="날짜·지역·취향으로 이번 주말 축제와 행사, 가족 체험·공연·혜택 일정을 찾아보세요. 공식 출처에서 확인한 일정과 장소를 모았습니다.">
  <meta name="naver-site-verification" content="1b81691131895febb71347b5ec654887d1660bec">
  <meta name="google-adsense-account" content="ca-pub-9815778998394475">
  <link rel="canonical" href="https://simulab.kr/">
  <link rel="icon" href="/favicon.svg">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
  <meta name="theme-color" content="#ff5a1f">
  <meta property="og:type" content="website">
  <meta property="og:title" content="시뮬랩 | 오늘 나갈 이유를 찾다">
  <meta property="og:description" content="날짜, 지역, 취향으로 찾는 축제·행사·가족 정보 달력">
  <meta property="og:url" content="https://simulab.kr/">
  <link rel="stylesheet" href="/assets/css/festa-home.css">
  <script type="module" src="/assets/js/festa-home.js"></script>
</head>
<body>
  <a class="skip" href="#main">본문으로 이동</a>

  <!-- 상단 고정 헤더 (AI Studio FESTA CALENDAR 스타일 + ScrollSpy 지원) -->
  <header class="site-head">
    <div class="head-inner">
      <div class="head-left">
        <a class="brand" href="/" aria-label="시뮬랩 홈">
          <span class="brand-mark">✳</span>
          <span>simu<span>lab</span><small>FESTA &amp; INFO CALENDAR</small></span>
        </a>
        <label class="head-search" aria-label="빠른 행사 검색">
          <span aria-hidden="true">⌕</span>
          <input type="search" id="head-search-input" placeholder="축제명, 지역, 장소 빠른 검색">
        </label>
      </div>
      <nav aria-label="주요 메뉴">
        <a href="#calendar" class="nav-pill active" data-nav-section="calendar">축제·정보 달력</a>
        <a href="#discover" class="nav-pill" data-nav-section="discover">지역·테마 탐색</a>
        <a href="/tools/kids-outing-calendar/" class="nav-pill">나들이 달력</a>
        <a href="/tools/family-info-calendar/" class="nav-pill">가족 정보 달력</a>
        <a href="/library/" class="nav-pill">생활 도구</a>
      </nav>
      <button type="button" class="head-cta saved-trigger" data-open-saved aria-label="저장한 행사">
        ♡ 저장한 일정 <span data-saved-count>0</span>
      </button>
    </div>
  </header>

  <main id="main">
    <!-- SECTION 1: 히어로 스포트라이트 캐러셀 & 우측 추천 프리뷰 2선 -->
    <section class="hero-section wrap" id="hero-top">
      <div class="hero-topline">
        <span><i></i> LIVE FESTIVAL &amp; OUTING RADAR</span>
        <span>갈 곳 없다는 말, 오늘까지만 · 공식 출처 확인 일정</span>
      </div>

      <div class="hero-grid">
        <!-- 좌측 메인 스포트라이트 카드 (8 Cols) -->
        <div class="hero-main ${heroImage ? 'has-photo' : ''}" id="hero-spotlight-card">
          <div class="hero-art" aria-hidden="true">
            <span class="flare f1">✷</span>
            <span class="flare f2">✳</span>
            <span class="flare f3">✺</span>
            <span class="flare f4">✦</span>
            <span class="night-hill"></span>
            <img class="hero-photo" ${heroImage ? `src="${esc(heroImage.src)}"` : 'hidden'} alt="" fetchpriority="high" decoding="async">
          </div>

          <!-- 상단 플로팅 배지 및 오토플레이 캐러셀 컨트롤 -->
          <div class="hero-topbar">
            <div class="hero-badges">
              <span class="pill live-pill" data-hero-status>
                <i class="pulse-dot"></i> ${esc(heroBadge.text)}
              </span>
              <span class="pill glass-pill" data-hero-badge>
                ${hero ? esc(hero.region) + ' · 추천 스포트라이트' : '공식 일정 확인'}
              </span>
            </div>
            <div class="hero-carousel-wrap">
              <div class="hero-dots" id="hero-dots" role="tablist" aria-label="추천 슬라이드 선택">
                ${heroSlides.map((s, idx) => `<button type="button" class="hero-dot ${idx === 0 ? 'is-active' : ''}" data-hero-dot="${idx}" aria-label="${idx + 1}번 추천 행사: ${esc(s.title)}" aria-selected="${idx === 0 ? 'true' : 'false'}"></button>`).join('')}
              </div>
              <div class="hero-carousel-controls" aria-label="추천 행사 슬라이드 전환">
                <button type="button" id="hero-prev" aria-label="이전 추천 행사">‹</button>
                <span id="hero-index">01 / 0${Math.max(1, heroSlides.length)}</span>
                <button type="button" id="hero-next" aria-label="다음 추천 행사">›</button>
              </div>
            </div>
          </div>

          <!-- 하단 텍스트 오버레이 -->
          <div class="hero-copy" id="hero-copy-box">
            <p class="hero-meta-line">
              <span data-hero-date>📅 ${hero ? esc(date(hero)) : '일정 준비 중'}</span>
              <span aria-hidden="true">·</span>
              <span data-hero-location>📍 ${hero ? esc(hero.region + ' · ' + hero.location) : '전국 주요 행사장'}</span>
            </p>
            <p class="hero-kicker">축제 레이더가 포착한 오늘의 한 장면</p>
            <h1>오늘 나갈 이유,<br><em>여기 있었네.</em></h1>
            <p class="hero-event" data-hero-title>${hero ? esc(hero.title) : '새 행사를 확인하고 있어요'}</p>
            <p class="hero-program" data-hero-program>${hero ? esc(hero.program || '공식 안내에서 프로그램과 운영 시간을 확인하세요.') : ''}</p>
            <div class="hero-tags" data-hero-tags>
              ${heroTags.map(t => `<span>${esc(t)}</span>`).join('')}
            </div>
            <div class="hero-actions">
              <a class="button orange" data-hero-link href="${hero ? esc(url(hero)) : '/tools/kids-outing-calendar/'}">
                행사 자세히 보기 ↗
              </a>
              <button type="button" class="button glass" data-hero-save="${hero ? esc(hero.id) : ''}" aria-pressed="false">
                ♡ 일정 보관함 찜
              </button>
              <button type="button" class="button glass-subtle" data-hero-preview="${hero ? esc(hero.id) : ''}">
                ✦ 빠른 미리보기
              </button>
              <a class="button glass-subtle" href="#calendar">달력에서 골라보기 ↓</a>
            </div>
          </div>

          <!-- 슬라이드 자동 전환 진행 바 -->
          <div class="hero-progress-track" aria-hidden="true">
            <span class="hero-progress-bar" id="hero-progress-bar"></span>
          </div>

          <div class="hero-corner">
            SIMULAB / FESTA EDITION <span>2026</span>
            <a class="hero-credit" data-hero-credit href="${esc(heroImage?.creditUrl || '#')}" target="_blank" rel="noopener noreferrer" ${heroImage ? '' : 'hidden'}>
              ${heroImage ? esc(heroImage.kind === 'context' ? '주제 참고: ' + heroImage.credit + ' · 행사 현장 아님' : '이미지: ' + heroImage.credit) : ''} ↗
            </a>
          </div>
        </div>

        <!-- 우측 다음 주목할 축제 2선 & 통합 달력 배너 (4 Cols) -->
        <aside class="hero-side">
          <div class="side-label">
            <span>✦ 다음 주목할 축제 2선</span>
            <small>EDITOR'S PICK · 공식 일정 기준</small>
          </div>
          <div class="side-mini-list" id="hero-mini-list">
            ${spotlight.map(mini).join('')}
          </div>
          <a class="side-more" href="#discover">전국 확인된 축제·행사 펼쳐보기 ↗</a>
          <div class="side-note">
            <div class="side-note-text">
              <span>FAMILY &amp; FESTA HUB</span>
              <strong>축제부터 체험·캠핑·세일까지,<br>한 달력에서 챙기세요.</strong>
              <p>신청 마감일과 실제 나들이 날짜를 놓치지 않도록 공식 공지를 모았습니다.</p>
            </div>
            <a class="side-note-btn" href="/tools/family-info-calendar/">통합 달력 ↗</a>
          </div>
        </aside>
      </div>
    </section>

    <!-- SECTION 2: 인터랙티브 날짜별 축제·정보 탐색기 & 타임라인 (#calendar) -->
    <section class="finder-section" id="calendar">
      <div class="wrap">
        <div class="section-heading calendar-heading">
          <div>
            <span class="eyebrow">📅 REALTIME FESTIVAL &amp; INFO CALENDAR</span>
            <h2>날짜별 축제·정보 <em>탐색기</em></h2>
            <p>원하는 분야와 지역을 선택하고 날짜를 클릭하면, 해당 일자의 상세 일정을 타임라인으로 확인하실 수 있습니다.</p>
          </div>
          <div class="calendar-top-controls">
            <!-- 달력 데이터 범위 필터 (축제 전용 vs 가족정보 통합) -->
            <div class="calendar-scope-switch" role="group" aria-label="달력 표시 정보 범위">
              <button type="button" data-calendar-scope="all" aria-pressed="true">전체 통합</button>
              <button type="button" data-calendar-scope="festival" aria-pressed="false">🎉 축제·행사</button>
              <button type="button" data-calendar-scope="culture" aria-pressed="false">🎨 체험·공연·팝업</button>
              <button type="button" data-calendar-scope="benefit" aria-pressed="false">🏕 캠핑·세일·혜택</button>
            </div>
          </div>
        </div>

        <!-- 달력 전용 지역별 선택 탭 바 -->
        <div class="calendar-region-bar" aria-label="달력 지역별 선택">
          <span class="calendar-region-title">📍 지역별 선택:</span>
          <div class="calendar-region-pills" id="calendar-region-pills" role="group" aria-label="달력 지역 필터">
            <button type="button" data-cal-region="all" aria-pressed="true">전체 지역 (${validCalItems.length})</button>
            ${calRegions.map(r => `<button type="button" data-cal-region="${esc(r)}" aria-pressed="false">${esc(r === '전국' ? '전국·온라인' : r)} (${calRegionCounts[r]})</button>`).join('')}
          </div>
        </div>

        <div class="calendar-grid">
          <!-- 좌측: 인터랙티브 달력 그리드 (7 Cols) -->
          <div class="calendar-panel">
            <div class="calendar-toolbar">
              <div class="month-title-group">
                <span class="tiny">THE MONTHLY PLAN</span>
                <div class="month-title-row">
                  <h3 id="month-label">달력 불러오는 중</h3>
                  <span class="month-count-badge" id="month-count-badge">일정 집계 중</span>
                </div>
              </div>
              <div class="month-controls">
                <button type="button" id="month-prev" aria-label="이전 달">‹</button>
                <button type="button" id="month-today">오늘 (TODAY)</button>
                <button type="button" id="month-next" aria-label="다음 달">›</button>
              </div>
            </div>

            <div class="weekday-row" aria-hidden="true">
              <span class="sun">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span class="sat">토</span>
            </div>

            <div class="calendar-days" id="calendar-days" role="group" aria-label="행사 달력 (방향키로 날짜 이동 가능)"></div>

            <div class="calendar-legend">
              <div class="legend-items">
                <span><i class="dot-light"></i> 불꽃·야경·주요축제</span>
                <span><i class="dot-kids"></i> 가족·체험·공연</span>
                <span><i class="dot-nature"></i> 자연·정원·캠핑</span>
                <span><i class="dot-food"></i> 먹거리·세일·혜택</span>
              </div>
              <small>* 날짜 클릭 또는 키보드 화살표(←→↑↓)로 일자별 타임라인을 탐색할 수 있습니다.</small>
            </div>
          </div>

          <!-- 우측: 선택한 날짜의 타임라인 리스트 (5 Cols) -->
          <div class="day-panel">
            <div class="day-panel-head">
              <div>
                <span class="tiny"><i class="live-dot"></i> ON THIS DAY TIMELINE</span>
                <div class="day-title-row">
                  <h3 id="day-title">날짜를 골라주세요</h3>
                  <span class="day-count-pill" id="day-count-pill">0건</span>
                </div>
              </div>
              <p id="day-subtitle">공식 출처를 확인한 행사와 가족 일정을 보여드립니다.</p>
            </div>

            <div id="day-events" class="day-events"></div>

            <div class="day-panel-foot">
              <a href="#discover" class="day-more-primary" id="day-jump-discover">
                아래 카드 목록에서 전체 축제 비교하기 ↓
              </a>
              <a href="/tools/kids-outing-calendar/" class="day-more">
                상세 조건·예약 정보 전체 보기 ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3 & 4: 스마트 테마 필터, 지역 바로선택 바 & 축제 카드 그리드 (#discover) -->
    <section class="discover-section wrap" id="discover">
      <div class="section-heading">
        <div>
          <span class="eyebrow">FIND YOUR SCENE</span>
          <h2>오늘 취향은 <em>어느 쪽?</em></h2>
        </div>
        <p>공식 출처가 확인된 전국 축제와 행사를 테마·지역·정렬 기준으로 빠르게 좁혀보세요.</p>
      </div>

      <div class="filter-box">
        <!-- 검색창 -->
        <label class="search">
          <span aria-hidden="true">⌕</span>
          <input id="event-search" type="search" placeholder="축제명, 지역, 장소, 프로그램 키워드 검색 (예: 불꽃, 국화, 드론, 서울)" aria-label="행사 검색">
        </label>

        <!-- 테마 알약 버튼 & 정렬 스위치 -->
        <div class="filter-row">
          <div class="chip-list" aria-label="분위기 필터">
            <button type="button" data-theme="all" aria-pressed="true">전체 테마 (${themeCounts.all})</button>
            <button type="button" data-theme="light" aria-pressed="false">✦ 불꽃·야경 (${themeCounts.light})</button>
            <button type="button" data-theme="food" aria-pressed="false">◒ 미식·먹거리 (${themeCounts.food})</button>
            <button type="button" data-theme="nature" aria-pressed="false">❋ 자연·정원 (${themeCounts.nature})</button>
            <button type="button" data-theme="kids" aria-pressed="false">✳ 가족·체험 (${themeCounts.kids})</button>
          </div>

          <div class="sort-row" aria-label="정렬 기준">
            <span class="sort-label">정렬 기준:</span>
            <div class="sort-switch">
              <button type="button" data-sort="start" aria-pressed="true">개막·운영일순</button>
              <button type="button" data-sort="end" aria-pressed="false">마감임박순</button>
              <button type="button" data-sort="free" aria-pressed="false">무료관람 우선</button>
            </div>
          </div>
        </div>

        <!-- 가로형 지역 바로선택 알약 바 (AI Studio 스타일) + 기존 호환용 select -->
        <div class="region-quick-bar" aria-label="지역 바로선택">
          <span class="region-bar-title">📍 지역 바로선택:</span>
          <div class="region-pills" id="region-pills">
            <button type="button" data-region-pill="all" aria-pressed="true">전국 전체 (${upcoming.length})</button>
            ${regions.map(r => `<button type="button" data-region-pill="${esc(r)}" aria-pressed="false">${esc(r)} (${regionCounts[r]})</button>`).join('')}
          </div>
          <label class="region-select sr-only">지역
            <select id="region-filter">
              <option value="all">전국</option>
              ${regions.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>

      <div class="results-line">
        <span id="result-count">${upcoming.length}개의 행사</span>
        <small>자료 최종 확인 ${esc(reviewed)} · 방문 전 주최 측 공식 안내 재확인 권장</small>
      </div>

      <div class="cards" id="event-cards">
        ${upcoming.map((e, idx) => card(e, idx)).join('')}
      </div>

      <p class="empty" id="event-empty" hidden>조건에 맞는 행사가 없어요. 다른 테마나 지역을 선택해 보세요.</p>

      <div class="discover-actions">
        <button type="button" class="all-events" id="show-more">전국 축제·행사 더 불러오기 ↓</button>
        <a class="all-events official-more" href="/tools/kids-outing-calendar/">전체 일정·예약 조건 표로 보기 ↗</a>
      </div>
    </section>

    <!-- SECTION 5: 가족 정보 분야별 큐레이션 & 나들이 필수 체크 가이드 -->
    <section class="more-section" id="curation">
      <div class="wrap more-bento">
        <!-- 좌측: 시뮬랩 가족 정보 분야별 현황 리스트 (7 Cols) -->
        <div class="curation-panel">
          <div class="curation-head">
            <div>
              <span class="eyebrow">✦ SIMULAB FAMILY &amp; LIFE RADAR</span>
              <h2>축제 말고도 챙겨야 할<br><em>이번 주 가족·생활 정보</em></h2>
            </div>
            <span class="curation-badge">공식 공지 검증</span>
          </div>
          <p class="curation-sub">아이 체험·교육부터 공연, 팝업스토어, 공공 캠핑장 예약까지 신청일과 이용일을 나누어 정리했습니다.</p>
          <div class="curation-list">
            ${familySummaryCards}
          </div>
          <a class="curation-all-link" href="/tools/family-info-calendar/">
            9개 분야 144개 확인된 가족 정보 전체 보기 →
          </a>
        </div>

        <!-- 우측: 출발 전 실용 가이드 & 생활 도구 카드 스택 (5 Cols) -->
        <div class="guide-stack">
          <div class="guide-tip-card">
            <span class="tip-icon tone-orange" aria-hidden="true">🚌</span>
            <div>
              <span class="tip-eyebrow">출발 전 체크포인트 01</span>
              <h3>축제 운영일·우천 변경 확인 팁</h3>
              <p>행사 기간 중 특정 요일(금·토 등)에만 열리는 프로그램이나 사전예약 마감 여부를 출발 전 공식 안내에서 꼭 다시 확인하세요.</p>
              <a href="/tools/kids-outing-calendar/">나들이 달력 상세 조건 보기 ↗</a>
            </div>
          </div>

          <div class="guide-tip-card">
            <span class="tip-icon tone-violet" aria-hidden="true">🎟️</span>
            <div>
              <span class="tip-eyebrow">출발 전 체크포인트 02</span>
              <h3>브랜드 세일 &amp; 외식·테마파크 할인 가이드</h3>
              <p>이번 주말 가족 외식·놀이공원 카드 제휴 혜택과 시즌 브랜드 세일 일정을 한곳에서 비교해 보세요.</p>
              <a href="/tools/parenting-deals/">세일·혜택 달력 바로가기 ↗</a>
            </div>
          </div>

          <div class="guide-cta-box">
            <span class="eyebrow">SIMULAB TOOLS LIBRARY</span>
            <h3>밖에 나가기 전, 생활 계산도 가볍게</h3>
            <p>더치페이·모임 정산, 여행 예산, 육아·급여 계산기 등 일상에 바로 쓰는 시뮬랩 생활 도구를 모았습니다.</p>
            <a class="guide-cta-btn" href="/library/">생활 도구 전체 열기 ↗</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-foot">
    <div class="wrap">
      <div>
        <a class="brand" href="/">
          <span class="brand-mark">✳</span>
          <span>simu<span>lab</span></span>
        </a>
        <p>공식 출처로 확인한 축제·행사와 가족 생활 정보를 한눈에 고르는 곳.</p>
      </div>
      <nav aria-label="하단 메뉴">
        <a href="/tools/family-info-calendar/">가족 정보 달력</a>
        <a href="/tools/kids-outing-calendar/">나들이 달력</a>
        <a href="/library/">도구 모음</a>
        <a href="/legal/about.html">소개·문의</a>
        <a href="/legal/privacy.html">개인정보처리방침</a>
        <a href="/legal/terms.html">이용약관</a>
      </nav>
    </div>
  </footer>

  <!-- 저장한 일정 모달 다이얼로그 -->
  <dialog class="saved-dialog" id="saved-dialog" aria-labelledby="saved-title">
    <div class="saved-head">
      <div>
        <span class="eyebrow">MY FESTA &amp; SCHEDULE</span>
        <h2 id="saved-title">저장한 일정 보관함</h2>
      </div>
      <button type="button" data-close-saved aria-label="닫기">×</button>
    </div>
    <div class="saved-list" id="saved-list"></div>
  </dialog>

  <!-- 빠른 상세 미리보기 모달 (Quick Preview Modal) -->
  <dialog class="quick-dialog" id="quick-preview-modal" aria-labelledby="quick-modal-title">
    <div class="quick-modal-inner" id="quick-modal-content"></div>
  </dialog>

  <!-- 달력 날짜 칸 마우스 호버 프리뷰 툴팁 -->
  <div class="cal-hover-tooltip" id="calendar-hover-tooltip" role="tooltip" hidden></div>

  <!-- 하단 플로팅 토스트 알림 -->
  <div class="festa-toast" id="festa-toast" role="status" aria-live="polite" hidden></div>

  <!-- 모바일 하단 퀵 네비게이션 -->
  <nav class="mobile-bottom-nav" aria-label="빠른 메뉴">
    <a href="#hero-top" data-mobile-nav="hero-top" aria-current="page">⌂<span>홈</span></a>
    <a href="#calendar" data-mobile-nav="calendar">▦<span>달력</span></a>
    <a href="#discover" data-mobile-nav="discover">⌕<span>탐색</span></a>
    <a href="/tools/family-info-calendar/">✦<span>가족정보</span></a>
    <button type="button" data-open-saved>♡<span>보관함</span></button>
  </nav>

  <script id="festa-data" type="application/json">${data}</script>
</body>
</html>`;

await writeFile(new URL('index.html', root), html);
console.log(`Built festival homepage from ${upcoming.length} current reviewed events and ${familyCalendarItems.length} family schedule items.`);
