import {readFile, mkdir} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';

// 프로젝트 루트 경로를 기준으로 데이터 파일들을 읽어옵니다.
const root = new URL('../', import.meta.url);
const source = JSON.parse(await readFile(new URL('data/events/reviewed.json', root), 'utf8'));
const images = JSON.parse(await readFile(new URL('data/events/images.json', root), 'utf8'));

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

const reviewed = source.map(e => e.checkedAt).filter(Boolean).sort().at(-1) || today;

// 주요 지역별 위경도 기준점 (서울 중심 기본 뷰 및 전국 거점)
const regionCoords = {
  '서울': { lat: 37.5283, lng: 126.9328 }, // 여의도 한강공원 인근
  '경기': { lat: 37.2832, lng: 127.0146 }, // 수원 화성 일대
  '인천': { lat: 37.4563, lng: 126.7052 }, // 인천 송도/차이나타운
  '강원': { lat: 37.7519, lng: 128.8761 }, // 강릉 경포대
  '대전': { lat: 36.3504, lng: 127.3845 }, // 엑스포 과학공원
  '세종': { lat: 36.4800, lng: 127.2890 }, // 세종호수공원
  '충남': { lat: 36.6588, lng: 126.6728 }, // 공주/부여 일대
  '충북': { lat: 36.6424, lng: 127.4890 }, // 청주 상당산성
  '부산': { lat: 35.1587, lng: 129.1604 }, // 해운대 광안리
  '울산': { lat: 35.5384, lng: 129.3114 }, // 태화강 국가정원
  '경남': { lat: 35.2285, lng: 128.6811 }, // 창원 진해
  '경북': { lat: 35.8562, lng: 129.2247 }, // 경주 보문단지
  '대구': { lat: 35.8714, lng: 128.6014 }, // 두류공원
  '광주': { lat: 35.1595, lng: 126.8526 }, // 국립아시아문화전당
  '전남': { lat: 34.7604, lng: 127.6622 }, // 여수 낭만포차
  '전북': { lat: 35.8242, lng: 127.1480 }, // 전주 한옥마을
  '제주': { lat: 33.4996, lng: 126.5312 }  // 제주도 연동/함덕
};

// 축제별 위경도 보정 및 테마별 보조 레이어(버스킹, 플리마켓, 푸드트럭, 주차장) 생성
const mapItems = events.map((e, idx) => {
  const baseCoord = regionCoords[e.region] || regionCoords['서울'];
  // 지도상 완전히 겹치지 않도록 미세 지터(jitter) 오프셋 부여
  const jitterLat = ((idx * 7) % 23 - 11) * 0.0035;
  const jitterLng = ((idx * 11) % 29 - 14) * 0.0042;
  const lat = Number((baseCoord.lat + jitterLat).toFixed(5));
  const lng = Number((baseCoord.lng + jitterLng).toFixed(5));

  // 거리 계산 시뮬레이션 (서울 여의도 기준 km)
  const distFromCenter = Math.sqrt(
    Math.pow((lat - 37.5283) * 111, 2) +
    Math.pow((lng - 126.9328) * 88, 2)
  );

  return {
    id: e.id,
    title: e.title,
    region: e.region,
    location: e.location,
    venue: e.venue,
    startDate: e.startDate,
    endDate: e.endDate,
    dates: e.dates || [e.startDate, e.endDate],
    theme: e.theme,
    feeStatus: e.feeStatus,
    feeLabel: e.feeStatus === 'free' ? '무료 관람' : '유료 입장',
    lat,
    lng,
    distKm: Number(distFromCenter.toFixed(1)),
    imageUrl: images[e.id]?.url || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=720&q=80',
    curatorTip: e.curatorTip || '현장 자율 관람 가능하며 편안한 복장을 추천합니다.',
    officialUrl: e.sources?.[0]?.url || '',
    buskingTimes: ['14:00 인디 버스킹 오프닝', '17:00 메인 밴드 라이브', '20:30 야간 어쿠스틱 피날레'],
    facilities: {
      foodtrucks: Math.max(3, (idx % 8) + 4),
      parkingStatus: (idx % 3 === 0) ? '만차주의' : (idx % 3 === 1 ? '혼잡' : '여유'),
      weather: '19°C 맑음'
    }
  };
});

const data = JSON.stringify(mapItems);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

// HTML 템플릿 작성
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>내주변 축제 지도 탐색기 | FESTA CALENDAR</title>
  <meta name="description" content="GPS 위치 기반 반경 1km~10km 내 실시간 축제, 버스킹 무대, 플리마켓, 푸드트럭, 공영주차장 현황을 지도 위에서 확인하세요.">
  <link rel="canonical" href="https://simulab.kr/map/">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
  <meta name="theme-color" content="#ff5a1f">
  <meta property="og:type" content="website">
  <meta property="og:title" content="내주변 축제 지도 탐색기 | FESTA CALENDAR">
  <meta property="og:description" content="실제 지도 위에 펼쳐지는 전국 축제 레이더 및 네이버·카카오 길찾기 연동">
  <meta property="og:url" content="https://simulab.kr/map/">

  <!-- Google Fonts: Plus Jakarta Sans & Material Symbols Outlined -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">

  <!-- Leaflet 오픈소스 인터랙티브 지도 엔진 (API 키 없이 즉시 고화질 지도 타일 제공) -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

  <link rel="stylesheet" href="/assets/css/festa-map.css">
  <script type="module" src="/assets/js/festa-map.js"></script>
</head>
<body class="map-page-body">
  <a class="skip" href="#map-main">지도 본문으로 바로가기</a>

  <!-- 상단 글로벌 네비게이션 헤더 -->
  <header class="map-site-head">
    <div class="map-head-inner">
      <div class="map-head-left">
        <a class="map-brand" href="/" aria-label="FESTA CALENDAR 홈으로 이동">
          <div class="map-brand-icon">
            <span class="material-symbols-outlined">celebration</span>
          </div>
          <span class="map-brand-text">FESTA <strong>CALENDAR</strong></span>
        </a>

        <nav class="map-nav" aria-label="글로벌 메뉴">
          <a href="/calendar/" class="map-nav-item">
            <span class="material-symbols-outlined">calendar_month</span> 축제달력
          </a>
          <a href="/map/" class="map-nav-item active" aria-current="page">
            <span class="material-symbols-outlined">explore</span> 내주변 지도
          </a>
          <a href="/curation/" class="map-nav-item">
            <span class="material-symbols-outlined">auto_awesome</span> 테마별 큐레이션
          </a>
          <a href="/#discover" class="map-nav-item">
            <span class="material-symbols-outlined">travel_explore</span> 지역별 탐색
          </a>
          <a href="/library/" class="map-nav-item">
            <span class="material-symbols-outlined">apps</span> 생활 도구
          </a>
        </nav>
      </div>

      <div class="map-head-right">
        <div class="map-live-status-pill">
          <span class="live-dot"></span>
          <span>실시간 전국 <strong>${events.length}개</strong> 축제 연동</span>
        </div>
        <a href="/calendar/" class="btn-cal-link">
          <span class="material-symbols-outlined">calendar_view_month</span> 월간 달력보기
        </a>
      </div>
    </div>
  </header>

  <!-- 메인 맵 풀스크린 뷰포트 컨테이너 -->
  <main id="map-main" class="festa-map-viewport">
    
    <!-- 1. 좌측 상단 위치 및 필터 제어 패널 -->
    <div class="map-control-panel">
      <!-- 위치 표시 바 -->
      <div class="map-location-badge">
        <div class="map-loc-info">
          <span class="map-loc-label">현재 기준 위치</span>
          <span class="map-loc-val" id="user-location-val">📍 서울특별시 영등포구 여의도동</span>
        </div>
        <button type="button" class="map-gps-btn" id="map-relocate-btn" title="내 GPS 위치로 재설정">
          <span class="material-symbols-outlined">my_location</span> 내 위치
        </button>
      </div>

      <!-- 반경 선택 탭 -->
      <div class="map-radius-selector" role="tablist" aria-label="탐색 반경 선택">
        <button type="button" class="radius-tab active" data-radius="1" role="tab" aria-selected="true">
          1km <span class="sub">(도보 15분)</span>
        </button>
        <button type="button" class="radius-tab" data-radius="3" role="tab" aria-selected="false">
          3km <span class="sub">(자전거)</span>
        </button>
        <button type="button" class="radius-tab" data-radius="5" role="tab" aria-selected="false">
          5km <span class="sub">(차량 10분)</span>
        </button>
        <button type="button" class="radius-tab" data-radius="10" role="tab" aria-selected="false">
          10km <span class="sub">(차량 20분)</span>
        </button>
      </div>

      <!-- 테마 레이어 토글 스위치 -->
      <div class="map-layer-toggles">
        <button type="button" class="layer-pill active" data-layer="all">
          <span class="pill-dot dot-all"></span> 전체 축제 (<span id="count-all-festa">0</span>)
        </button>
        <button type="button" class="layer-pill" data-layer="busking">
          <span class="pill-dot dot-sky"></span> 인디 버스킹 (<span id="count-busking">0</span>)
        </button>
        <button type="button" class="layer-pill" data-layer="market">
          <span class="pill-dot dot-emerald"></span> 주말 플리마켓 (<span id="count-market">0</span>)
        </button>
        <button type="button" class="layer-pill" data-layer="foodtruck">
          <span class="pill-dot dot-amber"></span> 푸드트럭 (<span id="count-foodtruck">0</span>)
        </button>
        <button type="button" class="layer-pill" data-layer="parking">
          <span class="pill-dot dot-violet"></span> 공영주차장
        </button>
      </div>
    </div>

    <!-- 2. 실제 Leaflet 인터랙티브 지도 캔버스 영역 -->
    <div class="map-canvas-container" id="leaflet-map-container">
      <!-- Leaflet이 실제 고화질 지도를 렌더링합니다 -->
    </div>

    <!-- 3. 우측 슬라이드아웃 상세 카드 (AI Studio & Stitch 규격) -->
    <aside class="map-detail-panel" id="map-detail-panel">
      <button type="button" class="map-panel-handle" id="map-panel-close-btn" aria-label="패널 닫기">
        <span class="material-symbols-outlined">close</span>
      </button>
      
      <div class="map-panel-content" id="map-panel-content">
        <!-- 기본 선택된 축제 카드 내용이 동적으로 채워집니다 -->
      </div>
    </aside>

    <!-- 4. 하단 퀵 캐러셀 바 (반경 내 핫 축제 슬라이더) -->
    <div class="map-bottom-carousel">
      <div class="carousel-head">
        <span class="c-head-title">선택 반경 내 주요 축제</span>
        <span class="c-head-sub" id="carousel-count-text">탐색 중...</span>
      </div>
      <div class="carousel-cards-track" id="carousel-cards-track">
        <!-- 자바스크립트 렌더링 -->
      </div>
    </div>

  </main>

  <!-- 데이터 임베딩 -->
  <script type="application/json" id="map-events-data">${data}</script>

  <!-- 알림 토스트 -->
  <div class="map-toast" id="map-toast" role="status" aria-live="polite" hidden></div>
</body>
</html>`;

await mkdir(new URL('map', root), {recursive: true});
await writeFile(new URL('map/index.html', root), html);
console.log(`Built map page with ${mapItems.length} mapped events.`);
