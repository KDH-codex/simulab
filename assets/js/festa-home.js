// HTML 내부의 JSON 스크립트(#festa-data)에서 전체 축제 및 가족 일정 데이터를 읽어옵니다.
const allItems = JSON.parse(document.getElementById('festa-data')?.textContent || '[]');
const festivalEvents = allItems.filter(item => item.scope === 'festival');
const cardsContainer = document.getElementById('event-cards');
const cards = [...document.querySelectorAll('.event-card')];

// 한국 시간(Asia/Seoul) 기준 오늘 날짜(YYYY-MM-DD)를 계산합니다.
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

// XSS 방지를 위한 HTML 이스케이프 유틸리티 함수
const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

// 특정 일정(e)이 지정된 날짜(d, YYYY-MM-DD)에 운영하는지 판별하는 함수
const isOn = (e, d) => e.dates?.length
  ? e.dates.includes(d)
  : (e.startDate <= d && e.endDate >= d);

// 상태 관리 변수들
let shown = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1);
let selected = today;
let theme = 'all';
let sortMode = 'start';
let expanded = false;
let calendarMode = 'month';
let calendarScope = 'all';
let calendarRegion = 'all';
let heroIndex = 0;

const byId = id => document.getElementById(id);

// 사용자 모션 축소 설정 여부 확인
const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

// ============================================================================
// 0. 플로팅 토스트 알림 유틸리티 (저장, 공유, 필터 피드백용)
// ============================================================================
let toastTimer = null;
function showToast(message) {
  const toastEl = byId('festa-toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.hidden = false;
  requestAnimationFrame(() => {
    toastEl.classList.add('is-visible');
  });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-visible');
    setTimeout(() => {
      if (!toastEl.classList.contains('is-visible')) {
        toastEl.hidden = true;
      }
    }, 220);
  }, 2400);
}

// 버튼 클릭 시 탄력 있는 바운스 애니메이션을 트리거하는 헬퍼 함수
function triggerPopAnimation(el) {
  if (!el || prefersReducedMotion) return;
  el.classList.remove('is-popping');
  void el.offsetWidth;
  el.classList.add('is-popping');
}

// 월 이름 포맷 (예: 2026년 10월)
const monthName = d => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long'
}).format(d);

// 날짜 상세 포맷 (예: 10월 31일 토요일)
const dayName = d => new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))));

// 요일 한 글자 반환 (일~토)
const weekdayShort = ['일', '월', '화', '수', '목', '금', '토'];

// 테마별 한글 라벨과 해시태그 정보
const themeMeta = {
  light: {icon: '✦', name: '불꽃·야경', tag: '#야간경관'},
  food: {icon: '◒', name: '미식·먹거리', tag: '#미식체험'},
  nature: {icon: '❋', name: '자연·정원', tag: '#가을산책'},
  kids: {icon: '✳', name: '가족·체험', tag: '#가족나들이'}
};

// 요금 상태 한글 표시 변환
const feeText = status =>
  status === 'free' ? '무료 관람' :
  status === 'mixed' ? '일부 유료' :
  status === 'paid' ? '유료 입장' : '요금 확인';

// 오늘 이후 가장 빠른 운영일을 구하는 함수
const nextDateOf = e => e.dates?.length
  ? e.dates.find(d => d >= today)
  : (e.endDate >= today ? (e.startDate > today ? e.startDate : today) : undefined);

// 날짜 범위 표시 문자열 생성 (예: 10.30 — 11.01)
const formatRange = e => e.startDate === e.endDate
  ? e.startDate.slice(5).replace('-', '.')
  : `${e.startDate.slice(5).replace('-', '.')} — ${e.endDate.slice(5).replace('-', '.')}`;

// D-Day 또는 진행중 배지 텍스트 계산
function computeBadge(e, refDate = today) {
  const nextD = nextDateOf(e);
  if (!nextD) return {text: '종료', tone: 'ended'};
  if (e.startDate === refDate) return {text: '오늘 개막', tone: 'live'};
  if (e.endDate === refDate) return {text: '오늘 마감', tone: 'urgent'};
  if (e.startDate <= refDate && e.endDate >= refDate) {
    if (!e.dates?.length || e.dates.includes(refDate)) {
      return {text: '진행중', tone: 'live'};
    }
    return {text: `${nextD.slice(5).replace('-', '.')} 운영`, tone: 'upcoming'};
  }
  const t0 = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
  const t1 = new Date(Number(e.startDate.slice(0, 4)), Number(e.startDate.slice(5, 7)) - 1, Number(e.startDate.slice(8, 10)));
  const diff = Math.round((t1 - t0) / 86400000);
  if (diff > 0) return {text: `D-${diff}`, tone: 'dday'};
  return {text: '진행중', tone: 'live'};
}

// 현재 선택된 달력 범위(전체/축제/체험·공연/캠핑·세일)에 맞는 일정 목록 반환 (지역 필터 적용 전)
function getScopeOnlyItems() {
  if (calendarScope === 'all') return allItems;
  return allItems.filter(item => item.scope === calendarScope);
}

// 현재 선택된 달력 범위 + 달력 지역 탭까지 모두 적용된 일정 목록 반환
function getScopedItems() {
  const scoped = getScopeOnlyItems();
  if (calendarRegion === 'all') return scoped;
  return scoped.filter(item => item.region === calendarRegion);
}

// 달력 상단 지역별 선택 탭([data-cal-region])의 건수 배지와 활성 상태를 동기화하는 함수
function syncCalendarRegionPills() {
  const activeScopeItems = getScopeOnlyItems().filter(item => item.endDate >= today);
  const countMap = new Map();
  for (const item of activeScopeItems) {
    countMap.set(item.region, (countMap.get(item.region) || 0) + 1);
  }

  document.querySelectorAll('[data-cal-region]').forEach(btn => {
    const r = btn.dataset.calRegion;
    const isPressed = r === calendarRegion;
    btn.setAttribute('aria-pressed', String(isPressed));
    const countEl = btn.querySelector('small');
    if (r === 'all') {
      if (countEl) countEl.textContent = String(activeScopeItems.length);
      btn.removeAttribute('data-zero');
    } else {
      const c = countMap.get(r) || 0;
      if (countEl) countEl.textContent = String(c);
      if (c === 0) btn.setAttribute('data-zero', 'true');
      else btn.removeAttribute('data-zero');
    }
  });
}

// 특정 날짜(d)에 열리는 일정을 축제 우선 순위로 정렬하여 반환
function onDate(d) {
  const list = getScopedItems().filter(e => isOn(e, d));
  return list.sort((a, b) => {
    if (a.scope !== b.scope) return a.scope === 'festival' ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

// ============================================================================
// 1. 히어로 스포트라이트 캐러셀 (오토플레이 + 프로그레스 바 + 도트 + 터치 스와이프)
// ============================================================================
const availableFestivals = festivalEvents
  .filter(nextDateOf)
  .sort((a, b) => nextDateOf(a).localeCompare(nextDateOf(b)) || a.title.localeCompare(b.title));

const heroCandidates = [
  availableFestivals.find(e => e.theme === 'light' && e.image),
  ...availableFestivals.filter(e => e.image),
  ...availableFestivals
].filter((e, idx, arr) => e && arr.indexOf(e) === idx);

const heroSlides = heroCandidates.slice(0, 3);
const HERO_DURATION_MS = 6000;
let heroProgressMs = 0;
let heroPaused = false;

function syncSpotlight(animateCopy = false) {
  const pick = heroSlides[heroIndex] || availableFestivals[0];
  const statusEl = document.querySelector('[data-hero-status]');
  const badgeEl = document.querySelector('[data-hero-badge]');
  const dateEl = document.querySelector('[data-hero-date]');
  const locEl = document.querySelector('[data-hero-location]');
  const titleEl = document.querySelector('[data-hero-title]');
  const progEl = document.querySelector('[data-hero-program]');
  const tagsEl = document.querySelector('[data-hero-tags]');
  const linkEl = document.querySelector('[data-hero-link]');
  const saveBtn = document.querySelector('[data-hero-save]');
  const previewBtn = document.querySelector('[data-hero-preview]');
  const indexEl = byId('hero-index');
  const photo = document.querySelector('.hero-photo');
  const credit = document.querySelector('[data-hero-credit]');
  const heroBox = document.querySelector('.hero-main');
  const copyBox = byId('hero-copy-box');

  if (animateCopy && copyBox && !prefersReducedMotion) {
    copyBox.classList.remove('is-switching');
    void copyBox.offsetWidth;
    copyBox.classList.add('is-switching');
  }

  if (indexEl) {
    indexEl.textContent = `0${heroIndex + 1} / 0${Math.max(1, heroSlides.length)}`;
  }

  // 슬라이드 인디케이터 도트 활성 상태 업데이트
  document.querySelectorAll('[data-hero-dot]').forEach((dot, idx) => {
    const isActive = idx === heroIndex;
    dot.classList.toggle('is-active', isActive);
    dot.setAttribute('aria-selected', String(isActive));
  });

  if (pick) {
    const badge = computeBadge(pick);
    if (statusEl) statusEl.innerHTML = `<i class="pulse-dot"></i> ${safe(badge.text)} · 스포트라이트`;
    if (badgeEl) badgeEl.textContent = `${pick.region} · ${themeMeta[pick.theme]?.name || '추천 축제'}`;
    if (dateEl) dateEl.textContent = `📅 ${formatRange(pick)}`;
    if (locEl) locEl.textContent = `📍 ${pick.region} · ${pick.location}`;
    if (titleEl) titleEl.textContent = pick.title;
    if (progEl) progEl.textContent = pick.program || '공식 안내에서 프로그램과 운영 시간을 확인하세요.';

    if (tagsEl) {
      const tags = [
        `#${pick.region}축제`,
        themeMeta[pick.theme]?.tag || '#문화행사',
        `#${feeText(pick.feeStatus).replace(/\s+/g, '')}`
      ];
      tagsEl.innerHTML = tags.map(t => `<span>${safe(t)}</span>`).join('');
    }

    if (linkEl) {
      linkEl.href = pick.url;
      linkEl.textContent = '행사 자세히 보기 ↗';
    }
    if (saveBtn) {
      saveBtn.dataset.heroSave = pick.id;
    }
    if (previewBtn) {
      previewBtn.dataset.heroPreview = pick.id;
    }

    if (pick.image) {
      photo.src = pick.image.src;
      photo.hidden = false;
      heroBox.classList.add('has-photo');
      credit.href = pick.image.creditUrl;
      credit.textContent = (pick.image.kind === 'context'
        ? `주제 참고: ${pick.image.credit} · 행사 현장 아님`
        : `이미지: ${pick.image.credit}`) + ' ↗';
      credit.hidden = false;
    } else {
      photo.hidden = true;
      photo.removeAttribute('src');
      heroBox.classList.remove('has-photo');
      credit.hidden = true;
    }
  }

  // 우측 '다음 주목할 축제 2선' 카드 업데이트
  const miniList = byId('hero-mini-list');
  if (miniList) {
    const others = availableFestivals.filter(e => e !== pick).slice(0, 2);
    miniList.innerHTML = others.map(e => {
      const b = computeBadge(e);
      const tMeta = themeMeta[e.theme] || {icon: '✦', name: '축제'};
      return `<a class="mini-event" href="${safe(e.url)}" data-mini-id="${safe(e.id)}">
        <span class="mini-date ${e.image ? 'with-image' : ''} tone-${safe(e.theme)}">
          ${e.image
            ? `<img src="${safe(e.image.src)}" alt="" loading="lazy" decoding="async">`
            : `<i class="mini-symbol" aria-hidden="true">${tMeta.icon}</i>`}
          <em>${safe(b.text)}</em>
          <span>${safe(nextDateOf(e).slice(5).replace('-', '.'))}</span>
        </span>
        <span class="mini-info">
          <small class="mini-cat">${safe(e.region)} · ${safe(tMeta.name)}</small>
          <b>${safe(e.title)}</b>
          <span class="mini-desc">${safe(e.program || e.location)}</span>
          <span class="mini-meta">
            <span>${safe(formatRange(e))}</span>
            <strong>${safe(feeText(e.feeStatus))}</strong>
          </span>
        </span>
        <i class="mini-arrow" aria-hidden="true">↗</i>
      </a>`;
    }).join('');
  }
}

function goHeroSlide(nextIdx) {
  if (heroSlides.length <= 1) return;
  heroIndex = (nextIdx + heroSlides.length) % heroSlides.length;
  heroProgressMs = 0;
  const bar = byId('hero-progress-bar');
  if (bar) bar.style.width = '0%';
  syncSpotlight(true);
  syncSaved();
}

byId('hero-prev')?.addEventListener('click', () => goHeroSlide(heroIndex - 1));
byId('hero-next')?.addEventListener('click', () => goHeroSlide(heroIndex + 1));

document.querySelectorAll('[data-hero-dot]').forEach(dot => {
  dot.addEventListener('click', () => {
    const idx = Number(dot.dataset.heroDot);
    if (!Number.isNaN(idx)) goHeroSlide(idx);
  });
});

// 히어로 카드 마우스 호버/포커스 시 자동 슬라이드 일시정지 및 모바일 터치 스와이프 지원
const heroCardEl = byId('hero-spotlight-card');
if (heroCardEl) {
  heroCardEl.addEventListener('mouseenter', () => { heroPaused = true; });
  heroCardEl.addEventListener('mouseleave', () => { heroPaused = false; });
  heroCardEl.addEventListener('focusin', () => { heroPaused = true; });
  heroCardEl.addEventListener('focusout', () => { heroPaused = false; });

  let touchStartX = 0;
  let touchStartY = 0;
  heroCardEl.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0]?.clientX || 0;
    touchStartY = e.changedTouches[0]?.clientY || 0;
  }, {passive: true});

  heroCardEl.addEventListener('touchend', e => {
    const dx = (e.changedTouches[0]?.clientX || 0) - touchStartX;
    const dy = (e.changedTouches[0]?.clientY || 0) - touchStartY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goHeroSlide(heroIndex + 1);
      else goHeroSlide(heroIndex - 1);
    }
  }, {passive: true});
}

// 100ms 주기로 히어로 프로그레스 바를 채우고 6초마다 다음 슬라이드로 자동 전환
if (!prefersReducedMotion && heroSlides.length > 1) {
  setInterval(() => {
    if (heroPaused || document.hidden) return;
    heroProgressMs += 100;
    const bar = byId('hero-progress-bar');
    if (bar) {
      bar.style.width = `${Math.min(100, (heroProgressMs / HERO_DURATION_MS) * 100)}%`;
    }
    if (heroProgressMs >= HERO_DURATION_MS) {
      goHeroSlide(heroIndex + 1);
    }
  }, 100);
}

// ============================================================================
// 2. 인터랙티브 달력(#calendar), 호버 프리뷰 툴팁 & 일자별 타임라인(#day-events)
// ============================================================================
function renderDay() {
  const current = onDate(selected);
  const regionPrefix = calendarRegion === 'all' ? '' : `[${calendarRegion}] `;
  byId('day-title').textContent = `${regionPrefix}${dayName(selected)} 타임라인`;
  const countPill = byId('day-count-pill');
  if (countPill) countPill.textContent = `총 ${current.length}건`;

  byId('day-subtitle').textContent = current.length
    ? `${calendarRegion === 'all' ? '선택한 날짜' : `${calendarRegion} 지역`}에 확인된 일정 ${current.length}건 · 미리보기 버튼을 눌러 요금과 출처를 바로 확인하세요.`
    : `${calendarRegion === 'all' ? '선택한 날짜' : `${calendarRegion} 지역`}에 등록된 일정이 없습니다. 다른 날짜나 지역을 눌러보세요.`;

  if (!current.length) {
    byId('day-events').innerHTML = `
      <div class="day-empty">
        <strong>이 날짜에는 확인된 일정이 없어요.</strong>
        <p>달력에서 주황색·보라색 배지가 표시된 날짜를 클릭하거나 상단 지역 탭을 변경해보세요.</p>
      </div>`;
    return;
  }

  byId('day-events').innerHTML = current.map((e, idx) => {
    const badge = computeBadge(e, selected);
    const catName = e.categoryLabel || themeMeta[e.theme]?.name || '축제·행사';
    const feeShort = e.feeStatus === 'free' ? '무료' : e.feeStatus === 'mixed' ? '일부유료' : e.feeStatus === 'paid' ? '유료' : '조건확인';
    const summaryText = e.program || e.time || `${formatRange(e)} 운영`;
    return `<div class="day-event" style="--stagger-idx:${Math.min(idx, 10)}">
      <div class="timeline-time-box tone-${safe(e.theme || 'kids')}">
        <strong>${safe(catName)}</strong>
        <small>${safe(feeShort)}</small>
      </div>
      <a class="timeline-body" href="${safe(e.url)}">
        <div class="timeline-top">
          <span class="timeline-status tone-${safe(badge.tone)}">${safe(badge.text)}</span>
          <span class="timeline-loc">📍 ${safe(e.region)} · ${safe(e.location)}</span>
        </div>
        <h5>${safe(e.title)}</h5>
        <p>${safe(summaryText)}</p>
      </a>
      <div class="timeline-actions">
        <button type="button" class="timeline-quick-btn" data-quick-view="${safe(e.id)}" aria-label="${safe(e.title)} 빠른 미리보기">미리보기</button>
      </div>
    </div>`;
  }).join('');
}

// 날짜 셀 하나를 AI Studio 스타일의 카드형 버튼 HTML로 생성하는 헬퍼 함수
function buildDayCellHtml(d, dayNum) {
  const list = onDate(d);
  const count = list.length;
  const isSelected = d === selected;
  const isToday = d === today;
  const isPast = d < today;
  const dow = new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))).getDay();
  const dowClass = dow === 0 ? 'is-sun ' : dow === 6 ? 'is-sat ' : '';

  // 그날 개막하는 축제가 있는지 확인
  const openingEvent = list.find(e => e.scope === 'festival' && e.startDate === d);
  const topEvent = openingEvent || list[0];
  const topShort = topEvent ? (topEvent.shortLabel || topEvent.title.slice(0, 6)) : '';

  // 선택된 날짜는 AI Studio 시안처럼 강렬한 오렌지 하이라이트 카드로 표시
  if (isSelected) {
    return `<button type="button" data-day="${d}" class="cal-cell selected has-event ${dowClass}" aria-label="${dayName(d)}, 행사 ${count}개" aria-pressed="true">
      <span class="cell-top">
        <strong class="cell-num">${dayNum} <small>${weekdayShort[dow]}</small></strong>
        <i class="selected-dot"></i>
      </span>
      <span class="cell-selected-pill">선택됨 · ${count}건</span>
    </button>`;
  }

  // 일반 날짜 셀
  const topTag = isToday
    ? '<em class="cell-tag today-tag">오늘</em>'
    : openingEvent
      ? '<em class="cell-tag open-tag">개막</em>'
      : '';

  // 테마별 도트 최대 3개 표시
  const themes = [...new Set(list.map(e => e.theme || 'kids'))].slice(0, 3);
  const dotsHtml = themes.map(t => `<i class="dot-${safe(t)}"></i>`).join('');

  return `<button type="button" data-day="${d}" class="cal-cell ${count ? 'has-event ' : ''}${isToday ? 'is-today ' : ''}${isPast ? 'past ' : ''}${dowClass}" aria-label="${dayName(d)}, 행사 ${count}개" aria-pressed="false">
    <span class="cell-top">
      <strong class="cell-num">${dayNum}</strong>
      ${topTag}
    </span>
    ${count ? `<span class="cell-bottom">
      ${topShort ? `<span class="cell-event-chip tone-${safe(topEvent.theme || 'kids')}">${safe(topShort)}</span>` : ''}
      <span class="cell-count-row">${dotsHtml}<small>${count}건</small></span>
    </span>` : '<span class="cell-bottom empty-cell"></span>'}
  </button>`;
}

// 달력 호버 툴팁 표시/숨김 함수
const hoverTooltip = byId('calendar-hover-tooltip');
function showDayTooltip(btn) {
  if (!hoverTooltip || window.innerWidth <= 1080) return;
  const d = btn.dataset.day;
  if (!d) return;
  const list = onDate(d);
  if (!list.length) {
    hoverTooltip.hidden = true;
    return;
  }
  const top3 = list.slice(0, 3);
  const remain = list.length - top3.length;
  hoverTooltip.innerHTML = `
    <div class="tooltip-head">
      <span>📅 ${safe(dayName(d))}</span>
      <span>총 ${list.length}건</span>
    </div>
    <div class="tooltip-list">
      ${top3.map(e => `<div class="tooltip-item">
        <i class="dot-${safe(e.theme || 'kids')}"></i>
        <small>[${safe(e.region)}]</small>
        <strong>${safe(e.title)}</strong>
      </div>`).join('')}
    </div>
    ${remain > 0 ? `<div class="tooltip-more">+ 외 ${remain}건 더보기 (클릭)</div>` : ''}
  `;
  const rect = btn.getBoundingClientRect();
  const left = Math.min(window.innerWidth - 140, Math.max(140, rect.left + rect.width / 2));
  hoverTooltip.style.left = `${left}px`;
  hoverTooltip.style.top = `${rect.top}px`;
  hoverTooltip.hidden = false;
}

function hideDayTooltip() {
  if (hoverTooltip) hoverTooltip.hidden = true;
}

function renderMonth() {
  hideDayTooltip();
  const tinyEl = document.querySelector('.calendar-panel .tiny');
  if (tinyEl) {
    tinyEl.textContent = calendarMode === 'week' ? 'THE WEEKLY PLAN' : 'THE MONTHLY PLAN';
  }
  byId('month-prev').setAttribute('aria-label', calendarMode === 'week' ? '이전 주' : '이전 달');
  byId('month-next').setAttribute('aria-label', calendarMode === 'week' ? '다음 주' : '다음 달');
  byId('month-today').textContent = calendarMode === 'week' ? '이번 주' : '오늘 (TODAY)';

  const monthBadge = byId('month-count-badge');
  const regionSuffix = calendarRegion === 'all' ? '' : `${calendarRegion} `;

  // 주간 뷰 렌더링
  if (calendarMode === 'week') {
    const date = new Date(Number(selected.slice(0, 4)), Number(selected.slice(5, 7)) - 1, Number(selected.slice(8, 10)));
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const days = Array.from({length: 7}, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const weekUniqueIds = new Set();
    days.forEach(d => onDate(d).forEach(e => weekUniqueIds.add(e.id)));
    if (monthBadge) monthBadge.textContent = `이번 주 ${regionSuffix}${weekUniqueIds.size}개 일정 진행`;

    byId('month-label').textContent = `${days[0].replaceAll('-', '.')} — ${days[6].slice(5).replace('-', '.')}`;
    byId('calendar-days').innerHTML = days.map(d => buildDayCellHtml(d, Number(d.slice(-2)))).join('');
    bindDays();
    return;
  }

  // 월간 뷰 렌더링
  byId('month-label').textContent = monthName(shown);
  const y = shown.getFullYear();
  const m = shown.getMonth();
  const offset = new Date(y, m, 1).getDay();
  const last = new Date(y, m + 1, 0).getDate();
  const prevLast = new Date(y, m, 0).getDate();

  const monthUniqueIds = new Set();
  let html = '';

  // 이전 달 빈 날짜 칸 (AI Studio 시안처럼 흐린 숫자로 표시)
  for (let i = 0; i < offset; i++) {
    const prevDayNum = prevLast - offset + 1 + i;
    html += `<button type="button" class="cal-cell muted-cell" disabled aria-hidden="true"><span class="cell-top"><strong class="cell-num">${prevDayNum}</strong></span></button>`;
  }

  // 해당 월의 날짜 칸
  for (let n = 1; n <= last; n++) {
    const d = `${y}-${String(m + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    onDate(d).forEach(e => monthUniqueIds.add(e.id));
    html += buildDayCellHtml(d, n);
  }

  // 다음 달 빈 날짜 칸 (7열 그리드 줄 맞춤)
  const totalCells = offset + last;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    html += `<button type="button" class="cal-cell muted-cell" disabled aria-hidden="true"><span class="cell-top"><strong class="cell-num">${i}</strong></span></button>`;
  }

  if (monthBadge) monthBadge.textContent = `${regionSuffix}총 ${monthUniqueIds.size}개 일정 진행`;
  byId('calendar-days').innerHTML = html;
  bindDays();
}

// 날짜 문자열(YYYY-MM-DD)에 일수를 더하고 빼는 유틸리티 함수
function addDaysToIso(isoDate, deltaDays) {
  const d = new Date(Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7)) - 1, Number(isoDate.slice(8, 10)));
  d.setDate(d.getDate() + deltaDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function bindDays() {
  byId('calendar-days').querySelectorAll('[data-day]').forEach(b => {
    b.addEventListener('click', () => {
      selected = b.dataset.day;
      renderMonth();
      renderDay();
    });
    b.addEventListener('mouseenter', () => showDayTooltip(b));
    b.addEventListener('mouseleave', hideDayTooltip);
    b.addEventListener('focus', () => showDayTooltip(b));
    b.addEventListener('blur', hideDayTooltip);
    b.addEventListener('keydown', e => {
      const keyMap = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7
      };
      if (!(e.key in keyMap)) return;
      e.preventDefault();
      const nextIso = addDaysToIso(b.dataset.day, keyMap[e.key]);
      selected = nextIso;
      shown = new Date(Number(nextIso.slice(0, 4)), Number(nextIso.slice(5, 7)) - 1, 1);
      renderMonth();
      renderDay();
      byId('calendar-days').querySelector(`[data-day="${nextIso}"]`)?.focus();
    });
  });
}

window.addEventListener('scroll', hideDayTooltip, {passive: true});

function shiftCalendar(direction) {
  if (calendarMode === 'week') {
    const d = new Date(Number(selected.slice(0, 4)), Number(selected.slice(5, 7)) - 1, Number(selected.slice(8, 10)));
    d.setDate(d.getDate() + 7 * direction);
    selected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    shown = new Date(d.getFullYear(), d.getMonth(), 1);
    renderDay();
  } else {
    shown = new Date(shown.getFullYear(), shown.getMonth() + direction, 1);
  }
  renderMonth();
}

byId('month-prev').addEventListener('click', () => shiftCalendar(-1));
byId('month-next').addEventListener('click', () => shiftCalendar(1));
byId('month-today').addEventListener('click', () => {
  shown = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1);
  selected = today;
  renderMonth();
  renderDay();
  showToast('오늘 날짜 일정으로 이동했습니다 📅');
});

// 월간 / 주간 뷰 스위치 생성 및 연결
const viewSwitch = document.createElement('div');
viewSwitch.className = 'calendar-view-switch';
viewSwitch.setAttribute('aria-label', '달력 보기 방식');
viewSwitch.innerHTML = '<button type="button" data-calendar-mode="month" aria-pressed="true">월간 뷰</button><button type="button" data-calendar-mode="week" aria-pressed="false">주간 뷰</button>';
byId('month-prev').parentElement.before(viewSwitch);

viewSwitch.querySelectorAll('button').forEach(button =>
  button.addEventListener('click', () => {
    calendarMode = button.dataset.calendarMode;
    const shownMonth = `${shown.getFullYear()}-${String(shown.getMonth() + 1).padStart(2, '0')}`;
    if (calendarMode === 'week' && selected.slice(0, 7) !== shownMonth) {
      selected = `${shownMonth}-01`;
      renderDay();
    }
    viewSwitch.querySelectorAll('button').forEach(item =>
      item.setAttribute('aria-pressed', String(item === button))
    );
    renderMonth();
  })
);

// 달력 표시 범위(전체 통합 / 축제·행사 / 체험·공연·팝업 / 캠핑·세일·혜택) 전환 버튼 연결
document.querySelectorAll('[data-calendar-scope]').forEach(btn =>
  btn.addEventListener('click', () => {
    calendarScope = btn.dataset.calendarScope;
    document.querySelectorAll('[data-calendar-scope]').forEach(item =>
      item.setAttribute('aria-pressed', String(item === btn))
    );
    syncCalendarRegionPills();
    renderMonth();
    renderDay();
  })
);

// 달력 상단 지역별 선택 탭([data-cal-region]) 클릭 이벤트 연결
document.querySelectorAll('[data-cal-region]').forEach(btn =>
  btn.addEventListener('click', () => {
    const nextRegion = btn.dataset.calRegion || 'all';
    calendarRegion = nextRegion;
    syncCalendarRegionPills();

    // 현재 선택된 날짜에 해당 지역 일정이 0건이면 가장 가까운 예정 운영일로 자동 이동
    if (calendarRegion !== 'all' && onDate(selected).length === 0) {
      const candidates = getScopedItems()
        .filter(nextDateOf)
        .sort((a, b) => nextDateOf(a).localeCompare(nextDateOf(b)));
      const targetDate = candidates[0] ? nextDateOf(candidates[0]) : null;
      if (targetDate) {
        selected = targetDate;
        shown = new Date(Number(targetDate.slice(0, 4)), Number(targetDate.slice(5, 7)) - 1, 1);
      }
    }

    // 하단 #discover 지역 필터에도 해당 지역 옵션이 존재하면 함께 동기화
    const discoverSelect = byId('region-filter');
    if (discoverSelect) {
      const hasOption = [...discoverSelect.options].some(opt => opt.value === nextRegion);
      const syncVal = hasOption ? nextRegion : 'all';
      discoverSelect.value = syncVal;
      document.querySelectorAll('[data-region-pill]').forEach(pill => {
        pill.setAttribute('aria-pressed', String(pill.dataset.regionPill === syncVal));
      });
      renderCards();
    }

    renderMonth();
    renderDay();
    showToast(calendarRegion === 'all' ? '전국 모든 지역의 달력 일정을 표시합니다 📅' : `📍 ${calendarRegion} 지역 달력 일정을 표시합니다`);
  })
);

// ============================================================================
// 3. 테마·지역·정렬·검색 필터링 (#discover)
// ============================================================================
function sortCardElements() {
  if (!cardsContainer) return;
  const sorted = [...cards].sort((a, b) => {
    if (sortMode === 'end') {
      return (a.dataset.end || '').localeCompare(b.dataset.end || '') ||
        (a.dataset.start || '').localeCompare(b.dataset.start || '');
    }
    if (sortMode === 'free') {
      const aFree = a.dataset.fee === 'free' ? 0 : a.dataset.fee === 'mixed' ? 1 : 2;
      const bFree = b.dataset.fee === 'free' ? 0 : b.dataset.fee === 'mixed' ? 1 : 2;
      if (aFree !== bFree) return aFree - bFree;
    }
    return (a.dataset.start || '').localeCompare(b.dataset.start || '') ||
      (a.dataset.title || '').localeCompare(b.dataset.title || '');
  });
  sorted.forEach(c => cardsContainer.appendChild(c));
}

function renderCards() {
  const q = byId('event-search').value.trim().toLowerCase();
  const region = byId('region-filter').value;
  sortCardElements();

  const orderedCards = [...cardsContainer.querySelectorAll('.event-card')];
  let count = 0;
  for (const card of orderedCards) {
    const active =
      card.dataset.end >= today &&
      (theme === 'all' || card.dataset.theme === theme) &&
      (region === 'all' || card.dataset.region === region) &&
      (!q || card.dataset.search.includes(q));
    if (active) {
      count++;
      card.style.setProperty('--stagger-idx', String((count - 1) % 9));
    }
    card.hidden = !active || (!expanded && count > 9);
  }
  byId('result-count').textContent = `${count}개의 행사`;
  byId('event-empty').hidden = count > 0;
  byId('show-more').hidden = expanded || count <= 9;
}

// 검색창 입력 연결 (상단 헤더 검색창과 본문 검색창 동기화)
byId('event-search').addEventListener('input', () => {
  const headInput = byId('head-search-input');
  if (headInput && headInput.value !== byId('event-search').value) {
    headInput.value = byId('event-search').value;
  }
  renderCards();
});

byId('head-search-input')?.addEventListener('input', e => {
  const val = e.target.value;
  byId('event-search').value = val;
  renderCards();
});

byId('head-search-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    document.getElementById('discover')?.scrollIntoView({behavior: 'smooth'});
  }
});

// 지역 드롭다운과 가로형 지역 바로선택 알약 버튼 양방향 동기화 + 달력 지역 탭/날짜 자동 연동
function setRegionFilter(regionValue) {
  byId('region-filter').value = regionValue;
  document.querySelectorAll('[data-region-pill]').forEach(pill => {
    pill.setAttribute('aria-pressed', String(pill.dataset.regionPill === regionValue));
  });
  renderCards();

  // 달력 지역 탭도 함께 동기화
  calendarRegion = regionValue;
  syncCalendarRegionPills();

  if (regionValue !== 'all') {
    const regionalNext = availableFestivals.find(e => e.region === regionValue);
    const targetDate = regionalNext ? nextDateOf(regionalNext) : null;
    if (targetDate) {
      selected = targetDate;
      shown = new Date(Number(targetDate.slice(0, 4)), Number(targetDate.slice(5, 7)) - 1, 1);
    }
  }
  renderMonth();
  renderDay();
}

byId('region-filter').addEventListener('change', () => {
  setRegionFilter(byId('region-filter').value);
});

document.querySelectorAll('[data-region-pill]').forEach(pill =>
  pill.addEventListener('click', () => {
    setRegionFilter(pill.dataset.regionPill);
  })
);

// 정렬 버튼 연결
document.querySelectorAll('[data-sort]').forEach(btn =>
  btn.addEventListener('click', () => {
    sortMode = btn.dataset.sort;
    document.querySelectorAll('[data-sort]').forEach(item =>
      item.setAttribute('aria-pressed', String(item === btn))
    );
    renderCards();
  })
);

byId('show-more').addEventListener('click', () => {
  expanded = true;
  renderCards();
});

document.querySelectorAll('.chip-list button[data-theme]').forEach(b =>
  b.addEventListener('click', () => {
    theme = b.dataset.theme;
    document.querySelectorAll('.chip-list button[data-theme]').forEach(x =>
      x.setAttribute('aria-pressed', String(x === b))
    );
    renderCards();
  })
);

// ============================================================================
// 4. 일정 보관함(찜하기) 기능 (localStorage 연동 + 바운스 & 토스트 피드백)
// ============================================================================
const savedKey = 'simulab:saved-events:v1';
const savedDialog = byId('saved-dialog');

const readSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(savedKey) || '[]').filter(id => typeof id === 'string');
  } catch {
    return [];
  }
};

const writeSaved = ids => {
  try {
    localStorage.setItem(savedKey, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
};

function toggleSavedId(eventId, triggerBtn = null) {
  if (!eventId) return;
  const ids = readSaved();
  const isRemoving = ids.includes(eventId);
  const next = isRemoving ? ids.filter(id => id !== eventId) : [...ids, eventId];
  if (writeSaved(next)) {
    syncSaved();
    if (triggerBtn) triggerPopAnimation(triggerBtn);
    triggerPopAnimation(document.querySelector('.saved-trigger'));
    const targetItem = allItems.find(item => item.id === eventId);
    const label = targetItem ? targetItem.title : '선택한 일정';
    showToast(isRemoving ? `${label} 일정을 보관함에서 해제했습니다.` : `${label} 일정을 보관함에 저장했습니다 ✨`);
  }
}

function syncSaved() {
  const ids = readSaved();
  document.querySelectorAll('[data-saved-count]').forEach(el => {
    el.textContent = String(ids.length);
  });

  // 카드 우측 상단 찜 버튼 상태 업데이트
  document.querySelectorAll('[data-save-card]').forEach(button => {
    const active = ids.includes(button.dataset.saveCard);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? '♥' : '♡';
    button.title = active ? '보관함에 저장됨 (클릭 시 해제)' : '보관함에 일정 저장';
  });

  // 히어로 영역 찜 버튼 상태 업데이트
  const heroSaveBtn = document.querySelector('[data-hero-save]');
  if (heroSaveBtn) {
    const active = ids.includes(heroSaveBtn.dataset.heroSave);
    heroSaveBtn.setAttribute('aria-pressed', String(active));
    heroSaveBtn.textContent = active ? '♥ 보관함에 저장됨' : '♡ 일정 보관함 찜';
  }

  // 빠른 미리보기 모달 내부 찜 버튼 상태 업데이트
  const modalSaveBtn = document.querySelector('[data-modal-save]');
  if (modalSaveBtn) {
    const active = ids.includes(modalSaveBtn.dataset.modalSave);
    modalSaveBtn.setAttribute('aria-pressed', String(active));
    modalSaveBtn.textContent = active ? '♥ 보관함에 저장됨' : '♡ 보관함 저장';
  }

  // 모달 내부 리스트 업데이트
  const list = byId('saved-list');
  const chosen = ids.map(id => allItems.find(event => event.id === id)).filter(Boolean);
  list.innerHTML = chosen.length
    ? chosen.map(event => `<a href="${safe(event.url)}">
        <span>${safe(event.region)} · ${safe(event.startDate.replaceAll('-', '.'))}</span>
        <strong>${safe(event.title)}</strong>
        <i aria-hidden="true">↗</i>
      </a>`).join('')
    : '<p>아직 저장한 일정이 없어요. 마음에 드는 축제나 행사 카드에서 ♡ 버튼을 눌러 담아보세요.</p>';
}

// 각 축제 카드에 찜하기(♡) 버튼, 빠른 미리보기 버튼 및 마우스 스포트라이트 효과 연결
for (const card of cards) {
  const link = card.querySelector('a[href^="/events/"]');
  if (!link) continue;
  const event = festivalEvents.find(item => item.url === link.getAttribute('href'));
  if (!event) continue;

  // 1) 우측 상단 찜하기 버튼
  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.className = 'card-save';
  saveButton.dataset.saveCard = event.id;
  saveButton.setAttribute('aria-label', `${event.title} 저장`);
  saveButton.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    toggleSavedId(event.id, saveButton);
  });
  card.append(saveButton);

  // 2) 우측 상단 빠른 미리보기 플로팅 버튼
  const quickButton = document.createElement('button');
  quickButton.type = 'button';
  quickButton.className = 'card-quick-btn';
  quickButton.dataset.quickView = event.id;
  quickButton.setAttribute('aria-label', `${event.title} 빠른 미리보기`);
  quickButton.textContent = '✦ 미리보기';
  card.append(quickButton);

  // 3) 마우스 좌표 기반 스포트라이트 글로우 추적
  if (!prefersReducedMotion) {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  }
}

// 히어로 찜 버튼 클릭 이벤트
document.querySelector('[data-hero-save]')?.addEventListener('click', e => {
  toggleSavedId(e.currentTarget.dataset.heroSave, e.currentTarget);
});

document.querySelectorAll('[data-open-saved]').forEach(button =>
  button.addEventListener('click', () => {
    syncSaved();
    savedDialog.showModal();
  })
);

savedDialog.querySelector('[data-close-saved]').addEventListener('click', () => savedDialog.close());
savedDialog.addEventListener('click', event => {
  if (event.target === savedDialog) savedDialog.close();
});
window.addEventListener('storage', syncSaved);

// ============================================================================
// 5. 빠른 상세 미리보기 모달 (Quick Preview Modal) & 공유 인터랙션
// ============================================================================
const quickModal = byId('quick-preview-modal');
const quickModalContent = byId('quick-modal-content');

function openQuickPreview(itemId) {
  if (!quickModal || !quickModalContent) return;
  const item = allItems.find(e => e.id === itemId);
  if (!item) return;

  const badge = computeBadge(item);
  const tMeta = themeMeta[item.theme] || {icon: '✦', name: '축제·일정'};
  const savedIds = readSaved();
  const isSaved = savedIds.includes(item.id);
  const hasExternalOfficial = item.officialUrl && item.officialUrl !== item.url;

  quickModalContent.innerHTML = `
    <div class="quick-hero art-${safe(item.theme || 'kids')}">
      ${item.image ? `<img src="${safe(item.image.src)}" alt="">` : ''}
      <div class="quick-hero-top">
        <div class="hero-badges">
          <span class="pill live-pill">${safe(badge.text)}</span>
          <span class="pill glass-pill">${safe(item.categoryLabel || tMeta.name)}</span>
        </div>
        <button type="button" class="quick-close-btn" data-close-quick aria-label="미리보기 닫기">×</button>
      </div>
      <div class="quick-hero-bottom">
        <span class="eyebrow" style="color:#ffdbd0">${safe(item.region)} · 공식 일정 미리보기</span>
        <h2 id="quick-modal-title">${safe(item.title)}</h2>
      </div>
    </div>
    <div class="quick-body">
      <div class="quick-meta-grid">
        <div class="quick-meta-box">
          <small>📅 운영 기간·일정</small>
          <strong>${safe(item.startDate.replaceAll('-', '.'))} — ${safe(item.endDate.replaceAll('-', '.'))}</strong>
        </div>
        <div class="quick-meta-box">
          <small>📍 개최 장소·지역</small>
          <strong>${safe(item.region)} · ${safe(item.location)}</strong>
        </div>
        <div class="quick-meta-box">
          <small>🎟️ 입장·이용 요금</small>
          <strong>${safe(item.fee || feeText(item.feeStatus))}</strong>
        </div>
        <div class="quick-meta-box">
          <small>🏛️ 공식 출처·검증일</small>
          <strong>${safe(item.sourceName || '공식 공지')} (${safe(item.checkedAt || today)})</strong>
        </div>
      </div>
      <div class="quick-desc-box">
        <h4>핵심 프로그램 및 일정 안내</h4>
        <p>${safe(item.program || item.time || '상세 페이지 및 공식 안내 원문에서 세부 프로그램과 방문 전 유의사항을 확인하실 수 있습니다.')}</p>
      </div>
      <div class="quick-provenance">
        <span>* 기상 상황 및 주최 측 사정에 따라 현장 운영이 변경될 수 있습니다.</span>
      </div>
      <div class="quick-actions">
        <button type="button" class="quick-btn" data-modal-save="${safe(item.id)}" aria-pressed="${isSaved ? 'true' : 'false'}">
          ${isSaved ? '♥ 보관함에 저장됨' : '♡ 보관함 저장'}
        </button>
        <button type="button" class="quick-btn" data-modal-share="${safe(item.id)}">
          🔗 일정 공유
        </button>
        ${hasExternalOfficial ? `<a class="quick-btn secondary" href="${safe(item.officialUrl)}" target="_blank" rel="noopener noreferrer">공식 원문 ↗</a>` : ''}
        <a class="quick-btn primary" href="${safe(item.url)}">상세 페이지 이동 ↗</a>
      </div>
    </div>
  `;

  quickModal.showModal();
}

// 문서 전체에서 [data-quick-view] 또는 [data-hero-preview] 클릭 시 미리보기 모달 오픈
document.addEventListener('click', e => {
  const quickTrigger = e.target.closest('[data-quick-view], [data-hero-preview]');
  if (quickTrigger) {
    e.preventDefault();
    e.stopPropagation();
    const targetId = quickTrigger.dataset.quickView || quickTrigger.dataset.heroPreview;
    if (targetId) openQuickPreview(targetId);
    return;
  }

  if (e.target.closest('[data-close-quick]')) {
    quickModal?.close();
    return;
  }

  const modalSaveBtn = e.target.closest('[data-modal-save]');
  if (modalSaveBtn) {
    toggleSavedId(modalSaveBtn.dataset.modalSave, modalSaveBtn);
    return;
  }

  const modalShareBtn = e.target.closest('[data-modal-share]');
  if (modalShareBtn) {
    const item = allItems.find(x => x.id === modalShareBtn.dataset.modalShare);
    if (!item) return;
    const shareUrl = new URL(item.url, window.location.origin).href;
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `${item.region} · ${item.title} (${formatRange(item)})`,
        url: shareUrl
      }).catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('일정 링크가 클립보드에 복사되었습니다 🔗');
      }).catch(() => {});
    }
  }
});

quickModal?.addEventListener('click', e => {
  if (e.target === quickModal) quickModal.close();
});

// ============================================================================
// 6. 스크롤 스파이(ScrollSpy) 상단 헤더 & 모바일 하단 네비게이션 활성화
// ============================================================================
const spySections = ['hero-top', 'calendar', 'discover']
  .map(id => byId(id))
  .filter(Boolean);

if ('IntersectionObserver' in window && spySections.length) {
  const spyObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const activeId = visible.target.id;

    // 상단 헤더 알약 탭 활성화 동기화
    document.querySelectorAll('[data-nav-section]').forEach(link => {
      const targetSec = link.dataset.navSection;
      const isMatch = (activeId === 'hero-top' && targetSec === 'calendar') || targetSec === activeId;
      link.classList.toggle('active', isMatch);
    });

    // 모바일 하단 네비게이션 활성화 동기화
    document.querySelectorAll('[data-mobile-nav]').forEach(link => {
      if (link.dataset.mobileNav === activeId) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }, {
    rootMargin: '-25% 0px -55% 0px',
    threshold: [0.1, 0.35, 0.6]
  });

  spySections.forEach(sec => spyObserver.observe(sec));
}

// 초기 화면 렌더링 실행
syncSpotlight();
syncCalendarRegionPills();
renderMonth();
renderDay();
renderCards();
syncSaved();
