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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawStart)) return null;
    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(rawEnd) && rawEnd >= rawStart ? rawEnd : rawStart;

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
      audience: r.audience || '전체 가족',
      conditions: r.conditions || [],
      applicationStart: (r.applicationStart || '').slice(0, 10),
      applicationEnd: (r.applicationEnd || '').slice(0, 10),
      url: r.siteUrl || '/calendar/',
      officialUrl: r.officialUrl || r.siteUrl || '/calendar/',
      sourceName: r.organizer || catLabel,
      checkedAt: (r.verifiedAt || reviewed).slice(0, 10)
    };
  })
  .filter(Boolean);

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
  curatorTip: getCuratorTip(e),
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

// 지역별 집계
const calRegionCounts = {};
for (const item of allCalendarData.filter(i => i.endDate >= today)) {
  const r = item.region || '전국';
  calRegionCounts[r] = (calRegionCounts[r] || 0) + 1;
}
const calRegions = Object.keys(calRegionCounts).sort((a, b) => {
  if (a === '전국') return 1;
  if (b === '전국') return -1;
  return (calRegionCounts[b] - calRegionCounts[a]) || a.localeCompare(b);
});

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>전국 축제 &amp; 가족 정보 통합 캘린더 | 시뮬랩 (FESTA CALENDAR)</title>
  <meta name="description" content="전국 17개 시도 축제, 공연, 플리마켓, 가족 체험, 키즈 팝업 및 공공 캠핑장 예약 일정을 대형 와이드 캘린더에서 한눈에 탐색하세요.">
  <link rel="canonical" href="https://simulab.kr/calendar/">
  <link rel="icon" href="/favicon.svg">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
  <meta name="theme-color" content="#ff5a1f">
  <meta property="og:type" content="website">
  <meta property="og:title" content="전국 축제 &amp; 가족 정보 통합 캘린더 | 시뮬랩">
  <meta property="og:description" content="월간/주간 캘린더, 날짜별 타임라인, 추천 연계 코스 및 실시간 날씨 안내">
  <meta property="og:url" content="https://simulab.kr/calendar/">
  <link rel="stylesheet" href="/assets/css/festa-calendar.css">
  <script type="module" src="/assets/js/festa-calendar.js"></script>
</head>
<body>
  <a class="skip" href="#calendar-main">본문으로 이동</a>

  <!-- 상단 글로벌 네비게이션 (Google Stitch 규격) -->
  <header class="cal-site-head">
    <div class="cal-head-inner">
      <div class="cal-head-left">
        <a class="cal-brand" href="/" aria-label="시뮬랩 홈으로 이동">
          <div class="cal-brand-icon">
            <span aria-hidden="true">✳</span>
          </div>
          <span class="cal-brand-text">FESTA <strong>CALENDAR</strong></span>
        </a>
        <nav class="cal-nav" aria-label="글로벌 메뉴">
          <a href="/calendar/" class="cal-nav-item active" aria-current="page">📅 축제달력</a>
          <a href="/map/" class="cal-nav-item">🗺️ 내주변 지도</a>
          <a href="/curation/" class="cal-nav-item">✨ 테마별 큐레이션</a>
          <a href="/#discover" class="cal-nav-item">⌕ 지역별 탐색</a>
          <a href="/library/" class="cal-nav-item">🛠 생활 도구</a>
        </nav>
      </div>
      <div class="cal-head-right">
        <button type="button" class="cal-saved-btn" id="open-saved-btn" aria-label="저장한 일정 목록 열기">
          ♡ 일정 보관함 <span id="saved-badge-count">0</span>
        </button>
      </div>
    </div>
  </header>

  <main id="calendar-main" class="cal-main-wrap">
    <!-- 1. SMART MAP RADAR BANNER (스티치 시안 1 & 2 상단 안내 배너) -->
    <div class="cal-map-cta-banner">
      <div class="cal-map-cta-left">
        <div class="cal-map-cta-icon" aria-hidden="true">🗺️</div>
        <div>
          <h2 class="cal-map-cta-title">
            내 위치 주변 축제는 <strong>[내주변 지도]</strong> 탭에서 실시간 레이더로 확인하실 수 있습니다
          </h2>
          <p class="cal-map-cta-desc">
            GPS 기반 1km~10km 반경 실시간 핀 검색, 주차장 현황, 버스킹 무대 위치를 풀스크린 지도로 바로 탐색해보세요.
          </p>
        </div>
      </div>
      <a class="cal-map-cta-btn" href="/map/">
        <span>explore</span> 내주변 지도 바로가기 ↗
      </a>
    </div>

    <!-- 2. HEADER TITLE & TOP CONTROLS -->
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

        <!-- 보기 모드 전환 & 지역 필터 -->
        <div class="cal-controls-group">
          <!-- 뷰 스위처 -->
          <div class="cal-view-toggle" role="group" aria-label="달력 보기 방식">
            <button type="button" data-view-mode="month" class="active" aria-pressed="true">월간 캘린더</button>
            <button type="button" data-view-mode="week" aria-pressed="false">주간 타임테이블</button>
          </div>
        </div>
      </div>

      <!-- 3. DETAILED MULTI-CATEGORY SCOPE FILTER CHIPS -->
      <div class="cal-filter-tray">
        <div class="cal-scope-chips" role="group" aria-label="정보 범위 선택">
          <span class="cal-filter-label">정보 분류:</span>
          <button type="button" class="cal-chip active" data-cal-scope="all" aria-pressed="true">
            🔥 전체보기 <span class="chip-count">${allCalendarData.length}</span>
          </button>
          <button type="button" class="cal-chip tone-indigo" data-cal-scope="festival" aria-pressed="false">
            🎆 축제·행사 <span class="chip-count">${festaItems.length}</span>
          </button>
          <button type="button" class="cal-chip tone-sky" data-cal-scope="culture" aria-pressed="false">
            🎨 체험·공연·팝업 <span class="chip-count">${familyCalendarItems.filter(i => i.scope === 'culture').length}</span>
          </button>
          <button type="button" class="cal-chip tone-emerald" data-cal-scope="benefit" aria-pressed="false">
            🏕 캠핑·세일·혜택 <span class="chip-count">${familyCalendarItems.filter(i => i.scope === 'benefit').length}</span>
          </button>
        </div>

        <!-- 빠른 이동 버튼 -->
        <div class="cal-quick-jumps">
          <span class="cal-filter-label">빠른 이동:</span>
          <button type="button" class="quick-jump-btn today-btn" id="jump-today-btn">⚡ 오늘 (TODAY)</button>
          <button type="button" class="quick-jump-btn" id="jump-weekend-btn">이번 주말</button>
        </div>
      </div>

      <!-- 지역별 필터 알약 바 -->
      <div class="cal-region-bar" aria-label="지역별 필터">
        <span class="cal-region-label">📍 지역별 선택:</span>
        <div class="cal-region-scroll" id="calendar-region-pills">
          <button type="button" class="cal-reg-pill active" data-cal-region="all" aria-pressed="true">
            전체 지역 (${allCalendarData.filter(i => i.endDate >= today).length})
          </button>
          ${calRegions.map(r => `<button type="button" class="cal-reg-pill" data-cal-region="${esc(r)}" aria-pressed="false">${esc(r === '전국' ? '전국·온라인' : r)} (${calRegionCounts[r]})</button>`).join('')}
        </div>
      </div>
    </section>

    <!-- 4. FULL-WIDTH WIDE LARGE CALENDAR GRID (스티치 시안 2 대형 와이드 캘린더) -->
    <section class="cal-grid-section">
      <!-- 캘린더 상단 툴바 -->
      <div class="cal-toolbar-bar">
        <div class="cal-month-nav">
          <h2 class="cal-current-month" id="calendar-month-heading">불러오는 중...</h2>
          <span class="cal-season-tag" id="calendar-season-badge">FESTIVAL SEASON</span>
          <div class="cal-month-arrows">
            <button type="button" id="prev-month-btn" aria-label="이전 달">‹</button>
            <button type="button" id="next-month-btn" aria-label="다음 달">›</button>
          </div>
        </div>

        <!-- 컬러 범례 가이드 (스티치 테마 토큰) -->
        <div class="cal-color-legend">
          <span><i class="legend-color legend-indigo"></i> 불꽃·야경</span>
          <span><i class="legend-color legend-sky"></i> 음악·버스킹</span>
          <span><i class="legend-color legend-emerald"></i> 플리마켓·아트</span>
          <span><i class="legend-color legend-amber"></i> 푸드·야시장</span>
          <span><i class="legend-color legend-green"></i> 자연·가족체험</span>
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

      <!-- 대형 5~6주 그리드 테이블 (min-h: 120px) -->
      <div class="cal-month-grid" id="calendar-grid-cells" role="group" aria-label="월간 일정 달력 (방향키로 이동 가능)">
        <!-- JS 동적 렌더링 -->
      </div>
    </section>

    <!-- 5. SELECTED DAY DETAILED FESTIVAL TIMELINE & CURATED CARDS (스티치 시안 2 하단 큐레이션) -->
    <section class="cal-selected-section" id="selected-day-container">
      <div class="cal-selected-header">
        <div class="cal-selected-title-group">
          <div class="cal-day-num-box" id="selected-day-num">17</div>
          <div>
            <div class="cal-day-title-row">
              <h3 class="cal-day-title" id="selected-day-title">5월 17일 (토요일) 축제 타임라인 &amp; 큐레이션</h3>
              <span class="cal-day-dday-badge" id="selected-day-badge">D-DAY 4개 축제 진행</span>
            </div>
            <p class="cal-day-subtitle" id="selected-day-subtitle">
              캘린더에서 선택된 날짜의 카테고리별 주요 축제 정보와 위치를 상세히 확인할 수 있습니다.
            </p>
          </div>
        </div>

        <a class="cal-view-map-link" id="view-in-map-link" href="/map/">
          <span>near_me</span> 이 날짜 축제들 내주변 지도에서 한 번에 보기 ↗
        </a>
      </div>

      <!-- 선택된 날짜의 축제 & 행사 카드 4열 그리드 (불꽃, 음악, 마켓, 푸드) -->
      <div class="cal-day-cards-grid" id="selected-day-cards">
        <!-- JS 동적 렌더링 -->
      </div>

      <!-- 원데이 추천 연계 코스 & 기상청 날씨/관람 팁 -->
      <div class="cal-route-weather-grid">
        <!-- 좌측: 추천 연계 코스 (One-Day Festa Route) -->
        <div class="cal-route-card-box">
          <div class="cal-route-head">
            <div class="cal-route-title-left">
              <div class="cal-route-icon" aria-hidden="true">🗺️</div>
              <div>
                <h4 class="cal-route-h4" id="route-card-title">추천 연계 코스 (One-Day Festa Route)</h4>
                <p class="cal-route-desc">플리마켓 쇼핑부터 버스킹 감상, 야시장 저녁과 화려한 드론 불꽃쇼까지</p>
              </div>
            </div>
            <span class="cal-route-time-badge">예상 소요 5~6시간 코스</span>
          </div>

          <div class="cal-route-steps" id="selected-route-steps">
            <!-- JS 동적 생성 -->
          </div>
        </div>

        <!-- 우측: 당일 날씨 & 관람 팁 -->
        <div class="cal-weather-card-box">
          <div class="cal-weather-head">
            <h4 class="cal-weather-h4">
              <span aria-hidden="true">☀️</span> 행사 당일 날씨 &amp; 관람 꿀팁
            </h4>
            <span class="cal-weather-status-chip">야외활동 최적</span>
          </div>

          <div class="cal-weather-banner">
            <div class="cal-weather-temp-row">
              <span class="cal-weather-icon-sun" aria-hidden="true">☀️</span>
              <div>
                <strong class="cal-temp-text">24°C</strong>
                <p class="cal-temp-sub">최저 14°C / 맑음 (강수확률 0%)</p>
              </div>
            </div>
            <div class="cal-weather-air-col">
              <p>미세먼지: <strong class="text-green">좋음</strong></p>
              <p>일몰: <strong>19:38</strong></p>
            </div>
          </div>

          <ul class="cal-weather-checklist">
            <li><strong>강바람 대비:</strong> 야간 야외 관람 시 얇은 겉옷이나 돗자리를 챙기세요.</li>
            <li><strong>교통 팁:</strong> 행사장 인근 주차장이 매우 혼잡하므로 대중교통 이용을 적극 권장합니다.</li>
          </ul>

          <div class="cal-weather-foot">
            <span>기상청 공공데이터 연계</span>
            <a href="/map/" class="cal-weather-map-link">지도에서 주변 주차장 보기 ↗</a>
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
          <span class="cal-footer-mark">✳</span>
          <span class="cal-footer-name">FESTA <strong>CALENDAR</strong></span>
          <p>전국 방방곡곡의 열정 가득한 축제와 라이브 문화 이벤트를 한눈에 탐색하고 일정을 계획하세요.</p>
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

  <!-- 빠른 상세 미리보기 모달 다이얼로그 -->
  <dialog class="quick-dialog" id="quick-preview-modal" aria-labelledby="quick-modal-title">
    <div class="quick-modal-inner" id="quick-modal-content"></div>
  </dialog>

  <!-- 보관함 다이얼로그 -->
  <dialog class="saved-dialog" id="saved-dialog" aria-labelledby="saved-title">
    <div class="saved-head">
      <div>
        <span class="eyebrow">MY FESTA &amp; SCHEDULE</span>
        <h2 id="saved-title">저장한 일정 보관함</h2>
      </div>
      <button type="button" id="close-saved-btn" aria-label="닫기">×</button>
    </div>
    <div class="saved-list" id="saved-list"></div>
  </dialog>

  <!-- 마우스 호버 툴팁 -->
  <div class="cal-hover-tooltip" id="calendar-hover-tooltip" role="tooltip" hidden></div>

  <!-- 토스트 알림 -->
  <div class="festa-toast" id="festa-toast" role="status" aria-live="polite" hidden></div>

  <!-- JSON 데이터 탑재 -->
  <script id="festa-data" type="application/json">${data}</script>
</body>
</html>`;

await mkdir(new URL('calendar', root), {recursive: true});
await writeFile(new URL('calendar/index.html', root), html);
console.log(`Built integrated calendar page from ${festaItems.length} festivals and ${familyCalendarItems.length} family items.`);
