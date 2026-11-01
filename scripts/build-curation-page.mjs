import { readFile, mkdir } from 'node:fs/promises';
import { writeFile } from './write-public-file.mjs';

const root = new URL('../', import.meta.url);
const source = JSON.parse(await readFile(new URL('data/events/reviewed.json', root), 'utf8'));
const images = JSON.parse(await readFile(new URL('data/events/images.json', root), 'utf8'));

// 한국 시간 기준 오늘 날짜 (YYYY-MM-DD)
const todayStr = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const formatDotDate = s => s?.replaceAll('-', '.');

// 검증 완료된 축제 필터링
const events = source.filter(
  e => e.verificationStatus === 'verified' && /^https:\/\//.test(e.sources?.[0]?.url || '')
);

// 7대 테마 정의
const themeDefinitions = [
  {
    key: 'food',
    icon: 'restaurant',
    title: '미식·푸드로드',
    tag: '#미식페스타',
    desc: '유명 셰프 팝업과 지역 특산물 먹거리 장터, 활기 넘치는 푸드트럭 빌리지',
    color: '#ae3200',
    bgGradient: 'linear-gradient(135deg, rgba(174,50,0,0.12) 0%, rgba(255,90,31,0.06) 100%)'
  },
  {
    key: 'light',
    icon: 'brightness_6',
    title: '불꽃·야경 판타지',
    tag: '#불꽃야간축제',
    desc: '강변을 수놓는 화려한 불꽃과 레이저 미디어아트, 1,000대 드론 라이트쇼',
    color: '#5300e6',
    bgGradient: 'linear-gradient(135deg, rgba(83,0,230,0.12) 0%, rgba(108,56,255,0.06) 100%)'
  },
  {
    key: 'nature',
    icon: 'nature_people',
    title: '자연·힐링 정원',
    tag: '#가을꽃산책',
    desc: '은빛 억새와 국화, 핑크뮬리 물결 속에서 즐기는 가족 숲속 피크닉',
    color: '#0d7a6f',
    bgGradient: 'linear-gradient(135deg, rgba(13,122,111,0.12) 0%, rgba(52,211,153,0.06) 100%)'
  },
  {
    key: 'art',
    icon: 'palette',
    title: '문화·예술 거리',
    tag: '#스트리트아트',
    desc: '도심 속 인디 밴드 버스킹, 현대 미술 야외 전시와 거리 극단 퍼포먼스',
    color: '#7c3aed',
    bgGradient: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(192,132,252,0.06) 100%)'
  },
  {
    key: 'kids',
    icon: 'family_restroom',
    title: '가족·어린이 나들이',
    tag: '#아이와함께',
    desc: '인기 캐릭터 팝업과 안전한 오감 자극 체험 학습, 키즈 놀이존',
    color: '#0284c7',
    bgGradient: 'linear-gradient(135deg, rgba(2,132,199,0.12) 0%, rgba(56,189,248,0.06) 100%)'
  },
  {
    key: 'heritage',
    icon: 'account_balance',
    title: '전통·역사 기행',
    tag: '#성곽달빛야행',
    desc: '유네스코 문화유산과 궁궐 야행, 전통 한복 체험과 달빛 기행',
    color: '#bd0042',
    bgGradient: 'linear-gradient(135deg, rgba(189,0,66,0.12) 0%, rgba(255,83,117,0.06) 100%)'
  },
  {
    key: 'market',
    icon: 'storefront',
    title: '플리마켓·팝업',
    tag: '#로컬마켓',
    desc: '전국 핸드메이드 작가들의 유니크한 굿즈와 감성 가득한 주말 플리마켓',
    color: '#0f766e',
    bgGradient: 'linear-gradient(135deg, rgba(15,118,110,0.12) 0%, rgba(45,212,191,0.06) 100%)'
  }
];

// 테마별 축제 매핑
const themedEvents = themeDefinitions.map(t => {
  let matched = [];
  if (t.key === 'food') matched = events.filter(e => e.theme === 'food');
  else if (t.key === 'light') matched = events.filter(e => e.theme === 'light');
  else if (t.key === 'nature') matched = events.filter(e => e.theme === 'nature');
  else if (t.key === 'kids') matched = events.filter(e => e.theme === 'kids');
  else {
    matched = events.filter(e => (e.theme === 'light' || e.theme === 'nature') && e.id.includes(t.key.slice(0, 2)));
    if (matched.length === 0) matched = events.slice(0, 6);
  }

  return {
    ...t,
    count: matched.length,
    events: matched.map(e => ({
      id: e.id,
      title: e.title,
      region: e.region,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      theme: e.theme,
      fee: e.fee || (e.feeStatus === 'free' ? '무료 관람' : '유료 입장'),
      url: `/events/${encodeURIComponent(e.id)}/`,
      officialUrl: e.sources?.[0]?.url || `/events/${encodeURIComponent(e.id)}/`,
      image: images[e.id] ? {
        src: images[e.id].src,
        credit: images[e.id].credit
      } : null
    }))
  };
});

// 에디터스 픽(Editor's Pick) 대표 축제 5개 선별 (사진이 있는 축제 우선)
const photoEvents = events.filter(e => images[e.id]);
const editorsPicks = (photoEvents.length >= 5 ? photoEvents.slice(0, 5) : events.slice(0, 5)).map((e, idx) => ({
  id: e.id,
  title: e.title,
  region: e.region,
  location: e.location,
  theme: e.theme,
  startDate: e.startDate,
  endDate: e.endDate,
  curatorTip: e.familyNote || '현장 인파가 몰리기 전 오전에 방문하시면 여유로운 포토존 촬영과 체험 참여가 가능합니다.',
  program: e.program || '전국 대표 문화 예술 공연과 다채로운 부대행사가 열립니다.',
  url: `/events/${encodeURIComponent(e.id)}/`,
  officialUrl: e.sources?.[0]?.url || `/events/${encodeURIComponent(e.id)}/`,
  image: images[e.id] ? {
    src: images[e.id].src,
    credit: images[e.id].credit
  } : null
}));

const dataJson = JSON.stringify({ themedEvents, editorsPicks }).replace(/</g, '\\u003c');

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>테마별 큐레이션 - 취향 맞춤 축제 컬렉션 | FESTA CALENDAR</title>
  <meta name="description" content="미식로드, 불꽃야경, 정원산책, 인디버스킹, 키즈체험까지! 취향과 동행인에 맞춘 전국 55개 대표 축제 테마 아카이브와 1일 추천 코스를 만나보세요.">
  <link rel="canonical" href="https://simulab.kr/curation/">
  <link rel="icon" href="/favicon.svg">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#ff5a1f">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="테마별 큐레이션 - 취향 맞춤 축제 컬렉션 | FESTA CALENDAR">
  <meta property="og:description" content="7대 대표 테마 리본, 트렌딩 해시태그, 에디터스 픽 7:5 벤토 컬렉션">
  <meta property="og:url" content="https://simulab.kr/curation/">
  ${editorsPicks[0]?.image?.src ? `<meta property="og:image" content="https://simulab.kr${editorsPicks[0].image.src}">` : ''}

  <!-- Fonts & Icons (Google Stitch FESTA 표준) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">

  <!-- Style Sheets -->
  <link rel="stylesheet" href="/assets/css/festa-home.css">
  <link rel="stylesheet" href="/assets/css/festa-curation.css">

  <!-- Curation Scripts -->
  <script type="module" src="/assets/js/festa-curation.js"></script>
</head>

<body>
  <a class="skip" href="#main">본문으로 바로가기</a>

  <!-- 상단 글로벌 헤더 -->
  <header class="site-head">
    <div class="head-inner wrap">
      <div class="head-brand-group">
        <a class="brand" href="/">
          <span class="brand-mark">✳</span>
          <span>simu<span>lab</span><small>테마 큐레이션</small></span>
        </a>
      </div>

      <nav aria-label="주요 메뉴">
        <a href="/calendar/" class="nav-pill">축제달력</a>
        <a href="/map/" class="nav-pill nav-radar">내주변 지도 <span class="radar-tag">RADAR</span></a>
        <a href="/curation/" class="nav-pill active">테마별 큐레이션</a>
        <a href="/#discover" class="nav-pill">지역·취향 탐색</a>
        <a href="/library/" class="nav-pill">생활 도구</a>
      </nav>

      <a href="/calendar/#saved" class="head-cta saved-trigger" aria-label="저장한 행사">
        ♡ 저장한 일정 <span data-saved-count>0</span>
      </a>
    </div>
  </header>

  <main id="main" class="cur-main-wrap wrap">
    <!-- 1. 보케 히어로 배너 (Stitch 25da5cbbb9e84ffb909bb500866342a4 규격) -->
    <section class="cur-hero-banner">
      <div class="cur-hero-badge">
        <span class="material-symbols-outlined" style="font-size:14px;">auto_awesome</span>
        <span>THEME ARCHIVE &amp; EDITORIAL</span>
      </div>
      <h1 class="cur-hero-title">
        당신의 취향을 저격할<br>
        <strong>이달의 테마별 축제 컬렉션</strong>
      </h1>
      <p class="cur-hero-desc">
        누구와 함께 떠나시나요? 맛있는 미식부터 화려한 불꽃 야경, 한적한 숲속 힐링까지<br>
        전국 55개 공식 인증 축제 중 지금 가장 뜨거운 테마를 선별했습니다.
      </p>

      <!-- 트렌딩 해시태그 바 -->
      <div class="cur-trending-tags" role="toolbar" aria-label="인기 트렌드 태그">
        <span class="trend-tag-label">🔥 실시간 트렌드</span>
        <button type="button" class="trend-tag-chip active" data-filter="all">#전체보기</button>
        <button type="button" class="trend-tag-chip" data-filter="food">#미식페스타</button>
        <button type="button" class="trend-tag-chip" data-filter="light">#불꽃야간축제</button>
        <button type="button" class="trend-tag-chip" data-filter="nature">#가을꽃산책</button>
        <button type="button" class="trend-tag-chip" data-filter="kids">#아이와함께</button>
        <button type="button" class="trend-tag-chip" data-filter="art">#스트리트버스킹</button>
        <button type="button" class="trend-tag-chip" data-filter="market">#주말플리마켓</button>
      </div>
    </section>

    <!-- 2. 7대 대표 카테고리 리본 카드 그리드 -->
    <section class="cur-section">
      <div class="cur-sec-head">
        <span class="cur-sec-badge">7 CATEGORIES</span>
        <h2 class="cur-sec-title">취향 맞춤 7대 테마 리본</h2>
        <p class="cur-sec-desc">카테고리를 클릭하면 해당 테마의 엄선된 축제 목록이 부드럽게 펼쳐집니다.</p>
      </div>

      <div class="cur-category-ribbon-grid" id="cur-category-ribbon-grid">
        ${themeDefinitions.map(t => `
          <div class="cur-ribbon-card" data-theme="${t.key}" role="button" tabindex="0" style="border-left: 4px solid ${t.color};">
            <div class="cur-ribbon-icon-box" style="background:${t.color}; color:#fff;">
              <span class="material-symbols-outlined">${esc(t.icon)}</span>
            </div>
            <div class="cur-ribbon-body">
              <span class="cur-ribbon-tag" style="color:${t.color};">${esc(t.tag)}</span>
              <h3 class="cur-ribbon-title">${esc(t.title)}</h3>
              <p class="cur-ribbon-desc">${esc(t.desc)}</p>
            </div>
            <div class="cur-ribbon-arrow">
              <span class="material-symbols-outlined">arrow_forward</span>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- 3. 에디터스 픽 7:5 벤토 쇼케이스 & 수석 큐레이터 코멘트 -->
    <section class="cur-section cur-bento-section">
      <div class="cur-sec-head">
        <span class="cur-sec-badge">CURATOR'S CHOICE</span>
        <h2 class="cur-sec-title">에디터스 픽 벤토 쇼케이스</h2>
        <p class="cur-sec-desc">이번 주말 가장 높은 평점과 만족도를 기록한 추천 컬렉션</p>
      </div>

      <!-- 수석 큐레이터 코멘트 스트립 -->
      <div class="cur-curator-strip">
        <div class="cur-curator-avatar">
          <span class="material-symbols-outlined" style="font-size:24px;">psychology</span>
        </div>
        <div class="cur-curator-text">
          <div class="cur-curator-role"><strong>민서영 수석 큐레이터</strong>의 이번 주 나들이 꿀팁</div>
          <p class="cur-curator-comment">
            “주말 축제는 낮 12시부터 오후 3시 사이가 가장 붐빕니다. 오전 10시 30분경 도착해 플리마켓과 푸드존을 미리 즐기시거나, 오후 5시 이후 일몰 노을과 야간 조명을 함께 즐기는 야경 코스를 적극 추천드립니다.”
          </p>
        </div>
      </div>

      <!-- 벤토 그리드 -->
      <div class="cur-bento-grid" id="cur-bento-grid">
        <!-- 메인 대형 하이라이트 카드 (Bento Hero) -->
        <div class="cur-bento-card bento-hero">
          ${editorsPicks[0]?.image?.src ? `<img class="bento-hero-img" src="${esc(editorsPicks[0].image.src)}" alt="${esc(editorsPicks[0].title)}" loading="lazy">` : ''}
          <div class="bento-hero-overlay"></div>
          <div class="bento-hero-content">
            <span class="bento-badge-gold">
              <span class="material-symbols-outlined" style="font-size:14px;">crown</span>
              <span>이번 주말 최고 추천</span>
            </span>
            <h3 class="bento-hero-title">${esc(editorsPicks[0]?.title)}</h3>
            <p class="bento-hero-desc">${esc(editorsPicks[0]?.program)}</p>
            <div class="bento-hero-meta">
              <span>📍 ${esc(editorsPicks[0]?.region)} · ${esc(editorsPicks[0]?.location)}</span>
              <span>📅 ${esc(formatDotDate(editorsPicks[0]?.startDate))} ~ ${esc(formatDotDate(editorsPicks[0]?.endDate))}</span>
            </div>
            <div class="bento-hero-btns">
              <a class="bento-hero-btn primary" href="${esc(editorsPicks[0]?.url)}">
                <span>상세 안내 보기</span>
                <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span>
              </a>
              <a class="bento-hero-btn glass" href="${esc(editorsPicks[0]?.officialUrl)}" target="_blank" rel="noopener noreferrer">
                <span>공식 페이지 ↗</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 보조 서브 벤토 카드 4종 -->
        ${editorsPicks.slice(1, 5).map((ep, idx) => `
          <div class="cur-bento-card bento-sub">
            <div class="bento-sub-top">
              <span class="bento-sub-num">0${idx + 2}</span>
              <span class="bento-sub-tag">#추천PICK</span>
            </div>
            <h4 class="bento-sub-title">${esc(ep.title)}</h4>
            <div class="bento-sub-meta">📍 ${esc(ep.region)} · ${esc(ep.location)}</div>
            <p class="bento-sub-tip">💡 큐레이터 팁: ${esc(ep.curatorTip.slice(0, 52))}...</p>
            <div class="bento-sub-links">
              <a class="bento-sub-link" href="${esc(ep.url)}">
                <span>상세 보기</span>
                <span class="material-symbols-outlined" style="font-size:14px;">arrow_forward</span>
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- 4. 맞춤 1일 추천 코스 타임라인 (Stitch 25da5cbbb9e84ffb909bb500866342a4 규격) -->
    <section class="cur-section">
      <div class="cur-sec-head">
        <span class="cur-sec-badge">PERFECT 1-DAY ITINERARY</span>
        <h2 class="cur-sec-title">시뮬랩 추천 1일 완벽 동선</h2>
        <p class="cur-sec-desc">오전 10시 30분부터 밤 8시 30분까지, 실패 없는 4단계 나들이 코스</p>
      </div>

      <div class="cur-itinerary-grid">
        <div class="itinerary-card">
          <div class="itinerary-time-badge">
            <span class="material-symbols-outlined" style="font-size:14px;">wb_sunny</span>
            <span>10:30 AM</span>
          </div>
          <h4>모닝 플리마켓 & 핸드메이드</h4>
          <p>붐비기 전 여유로운 산책과 지역 작가 핸드메이드 소품 쇼핑</p>
          <span class="itinerary-tag">#여유산책 #굿즈</span>
        </div>

        <div class="itinerary-card">
          <div class="itinerary-time-badge">
            <span class="material-symbols-outlined" style="font-size:14px;">restaurant</span>
            <span>12:30 PM</span>
          </div>
          <h4>로컬 푸드트럭 빌리지 런치</h4>
          <p>지역 특산물 먹거리 장터와 시그니처 길거리 미식 즐기기</p>
          <span class="itinerary-tag">#미식탐방 #인생점심</span>
        </div>

        <div class="itinerary-card">
          <div class="itinerary-time-badge">
            <span class="material-symbols-outlined" style="font-size:14px;">music_note</span>
            <span>15:30 PM</span>
          </div>
          <h4>인디 버스킹 & 잔디밭 피크닉</h4>
          <p>감성 버스킹 라이브를 들으며 시원한 음료와 힐링 타임</p>
          <span class="itinerary-tag">#라이브공연 #포토존</span>
        </div>

        <div class="itinerary-card highlight">
          <div class="itinerary-time-badge live">
            <span class="material-symbols-outlined" style="font-size:14px;">auto_awesome</span>
            <span>19:30 PM</span>
          </div>
          <h4>야간 미디어아트 & 불꽃쇼</h4>
          <p>화려한 조명과 드론쇼, 밤하늘을 수놓는 불꽃 피날레</p>
          <span class="itinerary-tag">#야경판타지 #인생샷</span>
        </div>
      </div>
    </section>

    <!-- 5. 테마별 전체 축제 아카이브 그리드 (동적 필터 연동) -->
    <section class="cur-section" id="archive-section">
      <div class="cur-sec-head">
        <span class="cur-sec-badge">FULL ARCHIVE</span>
        <h2 class="cur-sec-title" id="cur-archive-title">선택된 테마 축제 전체 보기</h2>
      </div>

      <div class="cur-cards-grid" id="cur-archive-cards">
        <!-- JS에서 부드러운 전환과 함께 렌더링 -->
      </div>
    </section>
  </main>

  <script type="application/json" id="curation-data">${dataJson}</script>

  <!-- 모바일 하단 5탭 내비게이션 바 -->
  <nav class="mobile-bottom-nav" aria-label="모바일 하단 내비게이션">
    <a href="/" class="mobile-nav-item">
      <span class="material-symbols-outlined">home</span>
      <span>홈</span>
    </a>
    <a href="/calendar/" class="mobile-nav-item">
      <span class="material-symbols-outlined">calendar_month</span>
      <span>달력</span>
    </a>
    <a href="/map/" class="mobile-nav-item">
      <span class="material-symbols-outlined">near_me</span>
      <span>내주변 지도</span>
    </a>
    <a href="/curation/" class="mobile-nav-item active" aria-current="page">
      <span class="material-symbols-outlined">auto_awesome</span>
      <span>큐레이션</span>
    </a>
    <a href="/calendar/#saved" class="mobile-nav-item">
      <span class="material-symbols-outlined">favorite</span>
      <span>찜</span>
      <span class="saved-badge" data-saved-count-badge hidden>0</span>
    </a>
  </nav>

  <!-- 푸터 -->
  <footer class="festa-footer">
    <div class="wrap">
      <div class="footer-bottom">
        <p>© 2025 FESTA CALENDAR · 전국 축제 탐색 포털 (Simulab)</p>
        <div class="footer-links">
          <a href="/legal/privacy.html">개인정보처리방침</a>
          <a href="/legal/about.html">서비스 소개</a>
          <a href="/">홈으로</a>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>`;

await mkdir(new URL('../curation', import.meta.url), { recursive: true });
await writeFile(new URL('../curation/index.html', import.meta.url), html);

console.log(`Successfully built theme curation page with ${themeDefinitions.length} themes and ${editorsPicks.length} editor's picks.`);
