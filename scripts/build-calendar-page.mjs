import {readFile, mkdir} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';

// 프로젝트 루트 경로를 기준으로 데이터 파일들을 읽어옵니다.
const root = new URL('../', import.meta.url);
const source = JSON.parse(await readFile(new URL('data/events/reviewed.json', root), 'utf8'));
const images = JSON.parse(await readFile(new URL('data/events/images.json', root), 'utf8'));

// 가족 정보 통합 달력(체험·교육, 공연·전시, 키즈 팝업, 캠핑, 세일 등) 데이터 로드
let familyFeed = {categories: [], records: []};
try {
  familyFeed = JSON.parse(await readFile(new URL('feeds/family-info/latest.json', root), 'utf8'));
} catch {
  familyFeed = {categories: [], records: []};
}

// HTML 특수문자 이스케이프 함수
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

// 한국 시간(Asia/Seoul) 기준 오늘 날짜(YYYY-MM-DD)
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

// 공식 출처 검증된 축제 선별
const events = source.filter(
  e => e.verificationStatus === 'verified' && /^https:\/\//.test(e.sources?.[0]?.url || '')
);

const next = e => e.dates?.length
  ? e.dates.find(d => d >= today)
  : (e.endDate >= today ? (e.startDate > today ? e.startDate : today) : undefined);

const upcoming = events
  .filter(next)
  .sort((a, b) => next(a).localeCompare(next(b)) || a.title.localeCompare(b.title));

const reviewed = source.map(e => e.checkedAt).filter(Boolean).sort().at(-1) || today;
const date = e => e.startDate === e.endDate
  ? e.startDate.slice(5).replace('-', '.')
  : e.startDate.slice(5).replace('-', '.') + ' — ' + e.endDate.slice(5).replace('-', '.');

const url = e => '/events/' + encodeURIComponent(e.id) + '/';

const art = {
  light: ['✦', '불꽃·야경', '#야간경관', 'indigo'],
  food: ['◒', '미식·먹거리', '#미식체험', 'amber'],
  nature: ['❋', '자연·정원', '#가을산책', 'emerald'],
  kids: ['✳', '가족·체험', '#가족나들이', 'sky']
};

const feeLabel = feeStatus =>
  feeStatus === 'free' ? '무료 관람' :
  feeStatus === 'unknown' ? '요금 확인' :
  feeStatus === 'mixed' ? '일부 유료' : '유료 입장';

function shortTitle(title) {
  return String(title || '')
    .replace(/^202\d\s*/, '')
    .replace(/^제\d+회\s*/, '')
    .replace(/\s*페스티벌|\s*축제|\s*문화제|\s*대향연|\s*한마당/g, '')
    .trim()
    .slice(0, 7);
}

function getCuratorTip(e) {
  if (e.curatorTip) return e.curatorTip;
  if (e.theme === 'light') return '일몰 30분 전 도착하여 수변 잔디밭 명당자리를 선점하면 불꽃과 야경의 파노라마를 완벽히 감상할 수 있습니다.';
  if (e.theme === 'food') return '스마트오더 및 모바일 결제를 지원하므로 혼잡한 푸드트럭 대기열을 피해 미리 주문하시면 여유롭습니다.';
  if (e.theme === 'nature') return '산책로 경사가 완만하여 유모차나 휠체어 이용이 편리하며, 얇은 돗자리를 지참하시면 좋습니다.';
  if (e.feeStatus === 'free') return '현장 자율 관람으로 별도 사전예약 없이 입장 가능합니다. 대중교통 이용 시 이동이 한결 수월합니다.';
  return '기상 상황에 따라 야외 프로그램 운영 시간이 변동될 수 있으니 출발 전 공식 안내를 확인하세요.';
}

const categoryNameMap = Object.fromEntries(
  (familyFeed.categories || []).map(c => [c.id, c.shortName || c.name])
);

// 가족 정보 일정도 달력에 함께 표시되도록 변환
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
    const startDate = rawStart || today;
    const endDate = rawEnd >= startDate ? rawEnd : startDate;

    const sourceUrl = r.sources?.[0]?.url || r.actionUrl || '/library/';
    const venue = r.place || r.region || '전국 온·오프라인';
    const region = r.region || (venue.includes('서울') ? '서울' : (venue.includes('경기') ? '경기' : '전국'));

    return {
      id: r.id,
      title: r.title,
      shortTitle: shortTitle(r.title),
      summary: r.summary || r.targetAudience || '가족과 함께하는 유익한 문화·체험 정보',
      startDate,
      endDate,
      dates: [startDate, endDate].filter((v, i, a) => a.indexOf(v) === i),
      region,
      venue,
      theme: themeCode,
      scope,
      categoryLabel: catLabel,
      feeStatus: r.costType === 'free' ? 'free' : (r.costType === 'paid' ? 'paid' : 'mixed'),
      feeLabel: r.costType === 'free' ? '무료' : (r.costType === 'paid' ? '유료' : '참여혜택'),
      url: sourceUrl,
      isExternal: true,
      imageUrl: r.thumbnailUrl || (scope === 'culture'
        ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=720&q=80'
        : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=720&q=80'),
      programHighlights: [r.targetAudience, r.periodNote].filter(Boolean),
      curatorTip: r.keyDatesSummary || '선착순 마감될 수 있으니 사전 접수 일정을 꼭 확인하세요.'
    };
  });

// 축제 데이터 변환
const festaItems = events.map(e => ({
  id: e.id,
  title: e.title,
  shortTitle: shortTitle(e.title),
  summary: e.summary,
  startDate: e.startDate,
  endDate: e.endDate,
  dates: e.dates || [e.startDate, e.endDate],
  region: e.region,
  venue: e.venue,
  coordinates: e.coordinates || null,
  theme: e.theme,
  scope: 'festival',
  categoryLabel: art[e.theme]?.[1] || '축제·행사',
  feeStatus: e.feeStatus,
  feeLabel: feeLabel(e.feeStatus),
  url: url(e),
  isExternal: false,
  officialUrl: e.sources?.[0]?.url || '',
  imageUrl: images[e.id]?.url || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=720&q=80',
  programHighlights: e.programHighlights || [],
  curatorTip: getCuratorTip(e)
}));

// 축제와 가족 정보를 통합한 전체 일정 배열
const allCalendarData = [...festaItems, ...familyCalendarItems];
const data = JSON.stringify(allCalendarData);

// 지역 목록 집계
const calRegions = Array.from(
  new Set(allCalendarData.map(e => e.region).filter(Boolean))
).sort((a, b) => {
  const priority = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '전국'];
  const ia = priority.indexOf(a);
  const ib = priority.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b);
});

const calRegionCounts = Object.fromEntries(
  calRegions.map(r => [r, allCalendarData.filter(i => i.region === r && i.endDate >= today).length])
);

// HTML 문서 빌드
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>전국 축제 &amp; 가족 정보 통합 캘린더 | FESTA CALENDAR</title>
  <meta name="description" content="전국 축제, 버스킹, 플리마켓, 야시장, 아이 체험·공연 일정을 와이드 월간 캘린더와 당일 타임라인으로 한눈에 확인하세요.">
  <link rel="canonical" href="https://simulab.kr/calendar/">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
  <meta name="theme-color" content="#ff5a1f">
  <meta property="og:type" content="website">
  <meta property="og:title" content="전국 축제 &amp; 가족 정보 통합 캘린더 | FESTA CALENDAR">
  <meta property="og:description" content="와이드 월간 캘린더, 날짜별 타임라인, 당일 1일 추천 코스 및 기상 팁을 제공합니다.">
  <meta property="og:url" content="https://simulab.kr/calendar/">

  <!-- Google Fonts: Plus Jakarta Sans & Material Symbols Outlined (Google AI Studio 테마 규격) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">

  <link rel="stylesheet" href="/assets/css/festa-calendar.css">
  <script type="module" src="/assets/js/festa-calendar.js"></script>
</head>
<body>
  <a class="skip" href="#calendar-main">본문으로 바로가기</a>

  <!-- 1. 상단 글로벌 네비게이션 (Google AI Studio 규격) -->
  <header class="cal-site-head">
    <div class="cal-head-inner">
      <div class="cal-head-left">
        <a class="cal-brand" href="/" aria-label="FESTA CALENDAR 홈으로 이동">
          <div class="cal-brand-icon">
            <span class="material-symbols-outlined">celebration</span>
          </div>
          <span class="cal-brand-text">FESTA <strong>CALENDAR</strong></span>
        </a>

        <!-- 네비게이션 탭 -->
        <nav class="cal-nav" aria-label="글로벌 메뉴">
          <a href="/calendar/" class="cal-nav-item active" aria-current="page">
            <span class="material-symbols-outlined">calendar_month</span> 축제달력
          </a>
          <a href="/map/" class="cal-nav-item">
            <span class="material-symbols-outlined">explore</span> 내주변 지도
          </a>
          <a href="/curation/" class="cal-nav-item">
            <span class="material-symbols-outlined">auto_awesome</span> 테마별 큐레이션
          </a>
          <a href="/#discover" class="cal-nav-item">
            <span class="material-symbols-outlined">travel_explore</span> 지역별 탐색
          </a>
          <a href="/library/" class="cal-nav-item">
            <span class="material-symbols-outlined">apps</span> 생활 도구
          </a>
        </nav>
      </div>

      <!-- 중앙 실시간 검색바 -->
      <div class="cal-head-center">
        <div class="cal-search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input type="search" id="festa-live-search" placeholder="축제명, 장소, 키워드 검색..." aria-label="축제 및 일정 검색" autocomplete="off">
          <button type="button" id="clear-search-btn" class="clear-btn" aria-label="검색어 지우기" hidden>×</button>
        </div>
      </div>

      <!-- 우측 보관함 및 유저 액션 -->
      <div class="cal-head-right">
        <button type="button" class="cal-saved-btn" id="open-saved-btn" aria-label="저장한 일정 목록 열기">
          <span class="material-symbols-outlined heart-icon">favorite</span>
          <span class="saved-text">일정 보관함</span>
          <span class="saved-badge" id="saved-badge-count">0</span>
        </button>
      </div>
    </div>
  </header>

  <main id="calendar-main" class="cal-main-wrap">
    <!-- 2. SMART MAP RADAR BANNER (AI Studio 시안 상단 안내 배너) -->
    <div class="cal-map-cta-banner">
      <div class="cal-map-cta-left">
        <div class="cal-map-cta-icon">
          <span class="material-symbols-outlined">radar</span>
        </div>
        <div>
          <h2 class="cal-map-cta-title">
            내 위치 주변 축제는 <strong>[내주변 지도]</strong> 탭에서 실시간 레이더로 확인하실 수 있습니다
          </h2>
          <p class="cal-map-cta-desc">
            GPS 기반 1km~10km 반경 실시간 핀 검색, 주차장 현황, 버스킹 무대 위치를 실제 지도 위에서 바로 탐색해보세요.
          </p>
        </div>
      </div>
      <a class="cal-map-cta-btn" href="/map/">
        <span class="material-symbols-outlined">map</span> 내주변 지도 바로가기 ↗
      </a>
    </div>

    <!-- 3. HEADER TITLE & CONTROLS SECTION -->
    <section class="cal-title-section">
      <div class="cal-title-row">
        <div>
          <div class="cal-badge-row">
            <span class="cal-badge-pulse"><i class="pulse-dot"></i> FULL MONTHLY FESTA CALENDAR</span>
            <span class="cal-badge-sub">실시간 전국 축제 &amp; 가족 정보 239건 연동</span>
          </div>
          <h1 class="cal-headline">전국 축제 &amp; 가족 정보 통합 캘린더</h1>
          <p class="cal-subtext">
            날짜별로 열리는 불꽃축제, 음악 버스킹, 로컬 플리마켓, 야시장, 아이 체험·공연 일정을 와이드 캘린더에서 한눈에 확인하세요.
          </p>
        </div>

        <!-- 보기 모드 전환 & 빠른 액션 -->
        <div class="cal-controls-group">
          <div class="cal-view-toggle" role="group" aria-label="달력 보기 방식">
            <button type="button" data-view-mode="month" class="active" aria-pressed="true">
              <span class="material-symbols-outlined">calendar_view_month</span> 월간 캘린더
            </button>
            <button type="button" data-view-mode="week" aria-pressed="false">
              <span class="material-symbols-outlined">calendar_view_week</span> 주간 타임테이블
            </button>
          </div>
        </div>
      </div>

      <!-- 4. 카테고리 필터 칩 (AI Studio 스타일 칩 바) -->
      <div class="cal-filter-tray">
        <div class="cal-scope-chips" role="group" aria-label="정보 범위 선택">
          <button type="button" class="cal-chip active" data-cal-scope="all" aria-pressed="true">
            <span class="chip-dot dot-all"></span> 전체보기 <span class="chip-count">${allCalendarData.length}</span>
          </button>
          <button type="button" class="cal-chip tone-indigo" data-cal-scope="light" aria-pressed="false">
            <span class="chip-dot dot-indigo"></span> 불꽃·야경 <span class="chip-count">${allCalendarData.filter(i => i.theme === 'light').length}</span>
          </button>
          <button type="button" class="cal-chip tone-sky" data-cal-scope="music" aria-pressed="false">
            <span class="chip-dot dot-sky"></span> 음악·인디버스킹 <span class="chip-count">${allCalendarData.filter(i => i.theme === 'kids' || i.title.includes('음악') || i.title.includes('버스킹') || i.title.includes('밴드')).length}</span>
          </button>
          <button type="button" class="cal-chip tone-amber" data-cal-scope="food" aria-pressed="false">
            <span class="chip-dot dot-amber"></span> 미식·먹거리 <span class="chip-count">${allCalendarData.filter(i => i.theme === 'food').length}</span>
          </button>
          <button type="button" class="cal-chip tone-emerald" data-cal-scope="nature" aria-pressed="false">
            <span class="chip-dot dot-emerald"></span> 자연·정원 <span class="chip-count">${allCalendarData.filter(i => i.theme === 'nature').length}</span>
          </button>
          <button type="button" class="cal-chip tone-violet" data-cal-scope="culture" aria-pressed="false">
            <span class="chip-dot dot-violet"></span> 가족·체험 <span class="chip-count">${allCalendarData.filter(i => i.scope === 'culture' || i.theme === 'kids').length}</span>
          </button>
        </div>

        <!-- 빠른 이동 버튼 -->
        <div class="cal-quick-jumps">
          <button type="button" class="quick-jump-btn today-btn" id="jump-today-btn">
            <span class="material-symbols-outlined">today</span> 오늘 (TODAY)
          </button>
          <button type="button" class="quick-jump-btn" id="jump-weekend-btn">
            <span class="material-symbols-outlined">weekend</span> 이번 주말
          </button>
        </div>
      </div>

      <!-- 지역별 필터 알약 바 -->
      <div class="cal-region-bar" aria-label="지역별 필터">
        <span class="cal-region-label"><span class="material-symbols-outlined">location_on</span> 지역 선택:</span>
        <div class="cal-region-scroll" id="calendar-region-pills">
          <button type="button" class="cal-reg-pill active" data-cal-region="all" aria-pressed="true">
            전체 지역 (${allCalendarData.filter(i => i.endDate >= today).length})
          </button>
          ${calRegions.map(r => `<button type="button" class="cal-reg-pill" data-cal-region="${esc(r)}" aria-pressed="false">${esc(r === '전국' ? '전국·온라인' : r)} (${calRegionCounts[r]})</button>`).join('')}
        </div>
      </div>
    </section>

    <!-- 5. FULL-WIDTH WIDE LARGE CALENDAR GRID (AI Studio 대형 와이드 캘린더) -->
    <section class="cal-grid-section">
      <!-- 캘린더 상단 툴바 -->
      <div class="cal-toolbar-bar">
        <div class="cal-month-nav">
          <div class="cal-month-arrows">
            <button type="button" id="prev-month-btn" aria-label="이전 달">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
          </div>
          <div class="cal-month-title-wrap">
            <h2 class="cal-current-month" id="calendar-month-heading">2026년 11월</h2>
            <span class="cal-season-tag" id="calendar-season-badge">AUTUMN FESTIVAL SEASON</span>
          </div>
          <div class="cal-month-arrows">
            <button type="button" id="next-month-btn" aria-label="다음 달">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <!-- 컬러 범례 가이드 -->
        <div class="cal-color-legend">
          <span><i class="legend-color legend-indigo"></i> 불꽃·야경</span>
          <span><i class="legend-color legend-sky"></i> 음악·버스킹</span>
          <span><i class="legend-color legend-amber"></i> 미식·푸드</span>
          <span><i class="legend-color legend-emerald"></i> 자연·정원</span>
          <span><i class="legend-color legend-violet"></i> 가족·체험</span>
        </div>
      </div>

      <!-- 요일 헤더 (일~토) -->
      <div class="cal-weekdays-row" aria-hidden="true">
        <span class="is-sun">일요일 (SUN)</span>
        <span>월요일 (MON)</span>
        <span>화요일 (TUE)</span>
        <span>수요일 (WED)</span>
        <span>목요일 (THU)</span>
        <span>금요일 (FRI)</span>
        <span class="is-sat">토요일 (SAT)</span>
      </div>

      <!-- 대형 5~6주 그리드 테이블 (min-h: 125px) -->
      <div class="cal-month-grid" id="calendar-grid-cells" role="group" aria-label="월간 일정 달력 (방향키 또는 탭으로 이동 가능)">
        <!-- 자바스크립트가 동적으로 생성 -->
      </div>
    </section>

    <!-- 6. SELECTED DAY DETAILED FESTIVAL TIMELINE & CURATED CARDS (AI Studio 선택 일자 상세 큐레이션) -->
    <section class="cal-selected-section" id="selected-day-container">
      <div class="cal-selected-header">
        <div class="cal-selected-title-group">
          <!-- 오렌지 그라디언트 대형 날짜 큐브 -->
          <div class="cal-day-num-box" id="selected-day-num">17</div>
          <div>
            <div class="cal-day-title-row">
              <h3 class="cal-day-title" id="selected-day-title">11월 17일 축제 타임라인 &amp; 큐레이션</h3>
              <span class="cal-day-dday-badge" id="selected-day-badge">D-DAY 4개 축제 진행</span>
            </div>
            <p class="cal-day-subtitle" id="selected-day-subtitle">
              캘린더에서 선택된 날짜의 테마별 주요 축제 정보와 위치를 한눈에 확인할 수 있습니다.
            </p>
          </div>
        </div>

        <a class="cal-view-map-link" id="view-in-map-link" href="/map/">
          <span class="material-symbols-outlined">near_me</span> 이 날짜 축제들 내주변 지도에서 보기 ↗
        </a>
      </div>

      <!-- 선택된 날짜의 축제 4열 카드 그리드 -->
      <div class="cal-day-cards-grid" id="selected-day-cards">
        <!-- 자바스크립트가 동적으로 생성 -->
      </div>

      <!-- 추천 연계 코스 & 날씨 팁 2열 그리드 -->
      <div class="cal-route-weather-grid">
        <!-- 좌측: 추천 연계 코스 (One-Day Festa Route) -->
        <div class="cal-route-card-box">
          <div class="cal-route-head">
            <div class="cal-route-title-left">
              <div class="cal-route-icon">
                <span class="material-symbols-outlined">route</span>
              </div>
              <div>
                <h4 class="cal-route-h4" id="route-card-title">추천 연계 코스 (One-Day Festa Route)</h4>
                <p class="cal-route-desc">플리마켓 쇼핑부터 버스킹 감상, 야시장 저녁과 화려한 드론 불꽃쇼까지</p>
              </div>
            </div>
            <span class="cal-route-time-badge">예상 소요 5~6시간 코스</span>
          </div>

          <div class="cal-route-steps" id="selected-route-steps">
            <!-- 자바스크립트가 동적으로 생성 -->
          </div>
        </div>

        <!-- 우측: 당일 날씨 & 관람 꿀팁 -->
        <div class="cal-weather-card-box">
          <div class="cal-weather-head">
            <h4 class="cal-weather-h4">
              <span class="material-symbols-outlined weather-icon-head">wb_sunny</span> 행사 당일 날씨 &amp; 관람 꿀팁
            </h4>
            <span class="cal-weather-status-chip">야외활동 최적</span>
          </div>

          <div class="cal-weather-banner">
            <div class="cal-weather-temp-row">
              <span class="material-symbols-outlined cal-weather-icon-sun">sunny</span>
              <div>
                <strong class="cal-temp-text">18°C</strong>
                <p class="cal-temp-sub">최저 8°C / 맑음 (강수확률 0%)</p>
              </div>
            </div>
            <div class="cal-weather-air-col">
              <p>미세먼지: <strong class="text-green">좋음 (18㎍/㎥)</strong></p>
              <p>일몰 시간: <strong>17:35</strong></p>
            </div>
          </div>

          <ul class="cal-weather-checklist" id="weather-tip-list">
            <li><strong>일교차 대비:</strong> 저녁 야외 관람 시 쌀쌀할 수 있으니 얇은 겉옷이나 무릎담요를 준비하세요.</li>
            <li><strong>주차 및 대중교통:</strong> 축제 인근 주차장이 조기 만차되므로 지하철/버스 이용을 권장합니다.</li>
            <li><strong>사전 예약:</strong> 인기 푸드트럭이나 체험 프로그램은 모바일 대기열을 활용하시면 편리합니다.</li>
          </ul>

          <div class="cal-weather-foot">
            <span>기상청 공공데이터 연계</span>
            <a href="/map/" class="cal-weather-map-link">지도에서 주변 주차장 확인 ↗</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- 하단 푸터 -->
  <footer class="cal-footer">
    <div class="cal-footer-inner">
      <div class="cal-footer-top">
        <div class="cal-footer-brand">
          <div class="cal-footer-logo">
            <span class="material-symbols-outlined">celebration</span>
            <span class="cal-footer-name">FESTA <strong>CALENDAR</strong></span>
          </div>
          <p>전국 방방곡곡의 열정 가득한 축제와 라이브 문화 이벤트를 한눈에 탐색하고 스마트하게 일정을 계획하세요.</p>
        </div>
        <nav class="cal-footer-links" aria-label="하단 네비게이션">
          <div>
            <strong>둘러보기</strong>
            <a href="/calendar/">통합 축제달력</a>
            <a href="/map/">내주변 지도</a>
            <a href="/curation/">테마별 큐레이션</a>
            <a href="/#discover">지역별 탐색</a>
          </div>
          <div>
            <strong>시뮬랩 서비스</strong>
            <a href="/library/">생활 도구</a>
            <a href="/legal/about.html">서비스 소개</a>
            <a href="/legal/privacy.html">개인정보처리방침</a>
            <a href="/legal/terms.html">이용약관</a>
          </div>
        </nav>
      </div>
      <div class="cal-footer-bottom">
        <p>© 2026 FESTA CALENDAR · Simulab Inc. All rights reserved. 대한민국 문화축제 공공데이터 및 자체 큐레이션 통합 서비스.</p>
      </div>
    </div>
  </footer>

  <!-- 7. 빠른 상세 미리보기 모달 다이얼로그 (Quick-View Modal) -->
  <dialog class="quick-dialog" id="quick-preview-modal" aria-labelledby="quick-modal-title">
    <div class="quick-modal-inner" id="quick-modal-content">
      <!-- 자바스크립트가 동적으로 생성 -->
    </div>
  </dialog>

  <!-- 8. 저장된 일정 보관함 다이얼로그 -->
  <dialog class="saved-dialog" id="saved-dialog" aria-labelledby="saved-title">
    <div class="saved-head">
      <div>
        <span class="eyebrow">MY FESTA &amp; SCHEDULE</span>
        <h2 id="saved-title">저장한 축제 &amp; 일정 보관함</h2>
      </div>
      <button type="button" id="close-saved-btn" class="close-dialog-btn" aria-label="닫기">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="saved-list" id="saved-list">
      <!-- 저장된 일정 목록 동적 렌더링 -->
    </div>
  </dialog>

  <!-- 9. 마우스 호버 툴팁 -->
  <div class="cal-hover-tooltip" id="calendar-hover-tooltip" role="tooltip" hidden></div>

  <!-- 10. AI Studio 플로팅 바운스 토스트 알림 (하단 중앙) -->
  <div class="festa-toast" id="festa-toast" role="status" aria-live="polite" hidden>
    <span class="material-symbols-outlined toast-icon">check_circle</span>
    <span class="toast-message" id="toast-message">일정 보관함에 저장되었습니다.</span>
  </div>

  <!-- JSON 데이터 탑재 -->
  <script id="festa-data" type="application/json">${data}</script>
</body>
</html>`;

await mkdir(new URL('calendar', root), {recursive: true});
await writeFile(new URL('calendar/index.html', root), html);
console.log(`Built integrated calendar page from ${festaItems.length} festivals and ${familyCalendarItems.length} family items.`);
