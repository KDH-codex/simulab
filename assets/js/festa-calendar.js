/**
 * FESTA CALENDAR - Google AI Studio 스타일 대화형 캘린더 스크립트
 * 시뮬랩(Simulab) 전국 축제 & 가족 정보 통합 캘린더 인터랙션 엔진
 */

// 1. 상태 관리 객체 (State Management)
const state = {
  // 축제 및 가족 일정 원본 데이터
  items: [],
  // 현재 캘린더에 표시 중인 연도와 월
  currentYear: 2026,
  currentMonth: 11, // 1~12월
  // 현재 선택된 날짜 (YYYY-MM-DD)
  selectedDate: '',
  // 오늘 날짜 (YYYY-MM-DD)
  todayDate: '',
  // 활성화된 필터 (전체, 불꽃, 음악, 푸드, 자연, 가족체험)
  activeScope: 'all',
  // 활성화된 지역 (전체 또는 서울, 경기 등)
  activeRegion: 'all',
  // 실시간 검색어
  searchKeyword: '',
  // 캘린더 뷰 모드 ('month' 또는 'week')
  viewMode: 'month',
  // 저장된 북마크 ID 집합 (Set)
  savedIds: new Set()
};

// 2. 초기화 함수 (Initialization)
document.addEventListener('DOMContentLoaded', () => {
  // JSON 데이터 로드
  const dataScript = document.getElementById('festa-data');
  if (dataScript) {
    try {
      state.items = JSON.parse(dataScript.textContent);
    } catch (e) {
      console.error('Failed to parse festa-data JSON', e);
      state.items = [];
    }
  }

  // 오늘 날짜 설정 (한국 시간 기준)
  const now = new Date();
  const yearStr = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
  state.todayDate = `${yearStr}-${monthStr}-${dayStr}`;

  // 현재 표시 연월을 오늘 날짜 기준으로 설정
  state.currentYear = now.getFullYear();
  state.currentMonth = now.getMonth() + 1;
  state.selectedDate = state.todayDate;

  // 로컬 스토리지에서 북마크 불러오기
  loadSavedBookmarks();

  // 이벤트 리스너 등록
  setupEventListeners();

  // 화면 첫 렌더링
  renderAll();
});

// 3. 로컬 스토리지 북마크 관리
function loadSavedBookmarks() {
  try {
    const raw = localStorage.getItem('festa_saved_events');
    if (raw) {
      const arr = JSON.parse(raw);
      state.savedIds = new Set(arr);
    }
  } catch (e) {
    state.savedIds = new Set();
  }
  updateBookmarkBadge();
}

function saveBookmarksToStorage() {
  try {
    localStorage.setItem('festa_saved_events', JSON.stringify(Array.from(state.savedIds)));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  updateBookmarkBadge();
}

function updateBookmarkBadge() {
  const badge = document.getElementById('saved-badge-count');
  if (badge) {
    badge.textContent = state.savedIds.size;
  }
  document.querySelectorAll('[data-saved-count-badge]').forEach(el => {
    el.textContent = state.savedIds.size;
    el.hidden = state.savedIds.size === 0;
  });
}

// 4. 플로팅 바운스 토스트 알림 (AI Studio 스타일)
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('festa-toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast) return;

  if (msgEl) msgEl.textContent = message;
  toast.hidden = false;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2500);
}

// 5. 이벤트 리스너 바인딩 (Event Listeners)
function setupEventListeners() {
  // 이전달 / 다음달 버튼
  const prevBtn = document.getElementById('prev-month-btn');
  const nextBtn = document.getElementById('next-month-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.currentMonth === 1) {
        state.currentMonth = 12;
        state.currentYear -= 1;
      } else {
        state.currentMonth -= 1;
      }
      renderCalendarGrid();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.currentMonth === 12) {
        state.currentMonth = 1;
        state.currentYear += 1;
      } else {
        state.currentMonth += 1;
      }
      renderCalendarGrid();
    });
  }

  // 오늘 점프 버튼
  const todayBtn = document.getElementById('jump-today-btn');
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const now = new Date();
      state.currentYear = now.getFullYear();
      state.currentMonth = now.getMonth() + 1;
      state.selectedDate = state.todayDate;
      renderAll();
      scrollToSelectedSection();
      showToast('오늘 날짜로 이동했습니다.');
    });
  }

  // 이번 주말 점프 버튼
  const weekendBtn = document.getElementById('jump-weekend-btn');
  if (weekendBtn) {
    weekendBtn.addEventListener('click', () => {
      const now = new Date();
      const day = now.getDay(); // 0(일) ~ 6(토)
      const diffToSaturday = (6 - day + 7) % 7;
      const targetSat = new Date(now.getTime() + diffToSaturday * 24 * 60 * 60 * 1000);
      const y = targetSat.getFullYear();
      const m = String(targetSat.getMonth() + 1).padStart(2, '0');
      const d = String(targetSat.getDate()).padStart(2, '0');
      state.currentYear = y;
      state.currentMonth = targetSat.getMonth() + 1;
      state.selectedDate = `${y}-${m}-${d}`;
      renderAll();
      scrollToSelectedSection();
      showToast('이번 주말 일정으로 이동했습니다.');
    });
  }

  // 실시간 라이브 검색창
  const searchInput = document.getElementById('festa-live-search');
  const clearBtn = document.getElementById('clear-search-btn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchKeyword = e.target.value.trim().toLowerCase();
      if (clearBtn) clearBtn.hidden = !state.searchKeyword;
      renderAll();
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      state.searchKeyword = '';
      clearBtn.hidden = true;
      renderAll();
    });
  }

  // 카테고리 필터 칩 클릭
  const scopeChips = document.querySelectorAll('.cal-chip[data-cal-scope]');
  scopeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      scopeChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      state.activeScope = chip.getAttribute('data-cal-scope') || 'all';
      renderAll();
    });
  });

  // 지역별 알약 버튼 클릭
  const regionPills = document.querySelectorAll('.cal-reg-pill[data-cal-region]');
  regionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      regionPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');
      state.activeRegion = pill.getAttribute('data-cal-region') || 'all';
      renderAll();
    });
  });

  // 보기 방식 전환 (월간 / 주간)
  const viewToggleBtns = document.querySelectorAll('.cal-view-toggle button[data-view-mode]');
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      state.viewMode = btn.getAttribute('data-view-mode') || 'month';
      renderCalendarGrid();
    });
  });

  // 보관함 다이얼로그 열기 및 닫기
  const openSavedBtn = document.getElementById('open-saved-btn');
  const mobileSavedBtn = document.getElementById('mobile-saved-trigger');
  const savedDialog = document.getElementById('saved-dialog');
  const closeSavedBtn = document.getElementById('close-saved-btn');
  if (savedDialog) {
    const handleOpenSaved = () => {
      renderSavedDialogList();
      savedDialog.showModal();
    };
    if (openSavedBtn) openSavedBtn.addEventListener('click', handleOpenSaved);
    if (mobileSavedBtn) mobileSavedBtn.addEventListener('click', handleOpenSaved);
  }
  if (closeSavedBtn && savedDialog) {
    closeSavedBtn.addEventListener('click', () => {
      savedDialog.close();
    });
  }
}

// 6. 전체 렌더링 총괄 함수
function renderAll() {
  renderCalendarHeader();
  renderCalendarGrid();
  renderSelectedDaySection();
}

// 7. 캘린더 상단 월 헤더 표기
function renderCalendarHeader() {
  const monthHeading = document.getElementById('calendar-month-heading');
  const seasonBadge = document.getElementById('calendar-season-badge');
  if (monthHeading) {
    monthHeading.textContent = `${state.currentYear}년 ${state.currentMonth}월`;
  }
  if (seasonBadge) {
    const m = state.currentMonth;
    if (m >= 3 && m <= 5) seasonBadge.textContent = 'SPRING FESTIVAL SEASON';
    else if (m >= 6 && m <= 8) seasonBadge.textContent = 'SUMMER FESTIVAL SEASON';
    else if (m >= 9 && m <= 11) seasonBadge.textContent = 'AUTUMN FESTIVAL SEASON';
    else seasonBadge.textContent = 'WINTER FESTIVAL SEASON';
  }
}

// 8. 필터링된 이벤트 목록 구하기
function getFilteredItems() {
  return state.items.filter(item => {
    // 1) 검색어 필터
    if (state.searchKeyword) {
      const targetText = `${item.title} ${item.venue} ${item.summary} ${item.region}`.toLowerCase();
      if (!targetText.includes(state.searchKeyword)) return false;
    }
    // 2) 지역 필터
    if (state.activeRegion !== 'all') {
      if (item.region !== state.activeRegion) return false;
    }
    // 3) 카테고리/테마 필터
    if (state.activeScope === 'light') return item.theme === 'light';
    if (state.activeScope === 'music') {
      return item.theme === 'kids' || item.title.includes('음악') || item.title.includes('버스킹') || item.title.includes('밴드');
    }
    if (state.activeScope === 'food') return item.theme === 'food';
    if (state.activeScope === 'nature') return item.theme === 'nature';
    if (state.activeScope === 'culture') return item.scope === 'culture' || item.theme === 'kids';
    return true;
  });
}

// 9. 월간 와이드 캘린더 그리드 렌더링
function renderCalendarGrid() {
  const gridEl = document.getElementById('calendar-grid-cells');
  if (!gridEl) return;
  gridEl.innerHTML = '';

  const year = state.currentYear;
  const month = state.currentMonth; // 1~12

  // 이번 달의 첫 날 요일 (0: 일요일 ~ 6: 토요일)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  // 이번 달의 총 일수
  const daysInMonth = new Date(year, month, 0).getDate();
  // 지난 달의 총 일수
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const filteredEvents = getFilteredItems();

  // 1) 지난 달 말일 패딩 날짜 셀 추가
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const cell = createCalendarCell(prevY, prevM, dayNum, dateStr, true, filteredEvents);
    gridEl.appendChild(cell);
  }

  // 2) 이번 달 날짜 셀 추가
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cell = createCalendarCell(year, month, d, dateStr, false, filteredEvents);
    gridEl.appendChild(cell);
  }

  // 3) 다음 달 초일 패딩 날짜 셀 추가 (총 셀 개수를 7의 배수로 맞춤)
  const totalRendered = firstDayOfWeek + daysInMonth;
  const remainder = totalRendered % 7;
  const nextPaddingCount = remainder === 0 ? 0 : 7 - remainder;
  for (let n = 1; n <= nextPaddingCount; n++) {
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    const cell = createCalendarCell(nextY, nextM, n, dateStr, true, filteredEvents);
    gridEl.appendChild(cell);
  }
}

// 개별 날짜 셀 DOM 생성 함수
function createCalendarCell(y, m, d, dateStr, isOtherMonth, filteredEvents) {
  const cell = document.createElement('div');
  cell.className = 'cal-cell';
  if (isOtherMonth) cell.classList.add('is-other-month');

  // 요일 확인
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  if (dayOfWeek === 0) cell.classList.add('is-sun');
  if (dayOfWeek === 6) cell.classList.add('is-sat');

  // 오늘 날짜 여부
  if (dateStr === state.todayDate) cell.classList.add('is-today');

  // 현재 선택된 날짜 여부
  if (dateStr === state.selectedDate) cell.classList.add('is-selected');

  // 셀 헤더 (날짜 숫자 + 개수)
  const cellHead = document.createElement('div');
  cellHead.className = 'cal-cell-head';

  const daySpan = document.createElement('span');
  daySpan.className = 'cal-cell-day';
  daySpan.textContent = d;
  cellHead.appendChild(daySpan);

  // 해당 날짜에 진행 중인 축제 탐색 (운영일 지정 dates 배열 완벽 지원)
  const dayEvents = filteredEvents.filter(ev => {
    return ev.dates?.length ? ev.dates.includes(dateStr) : (ev.startDate <= dateStr && ev.endDate >= dateStr);
  });

  if (dayEvents.length > 0) {
    const countSpan = document.createElement('span');
    countSpan.className = 'cal-cell-count';
    countSpan.textContent = `${dayEvents.length}건`;
    cellHead.appendChild(countSpan);
  }
  cell.appendChild(cellHead);

  // 일정 바 컨테이너
  const eventsWrap = document.createElement('div');
  eventsWrap.className = 'cal-cell-events';

  const maxVisible = 3;
  dayEvents.slice(0, maxVisible).forEach(ev => {
    const bar = document.createElement('div');
    bar.className = `cal-event-bar bar-${getThemeToneClass(ev.theme)}`;
    bar.textContent = ev.shortTitle || ev.shortLabel || ev.title;
    bar.title = `${ev.title} (${ev.location || ev.venue || ev.region})`;
    bar.addEventListener('click', (e) => {
      e.stopPropagation();
      openQuickPreviewModal(ev);
    });
    eventsWrap.appendChild(bar);
  });

  if (dayEvents.length > maxVisible) {
    const moreChip = document.createElement('div');
    moreChip.className = 'cal-more-chip';
    moreChip.textContent = `+${dayEvents.length - maxVisible}개 더보기`;
    eventsWrap.appendChild(moreChip);
  }

  cell.appendChild(eventsWrap);

  // 셀 클릭 시 해당 날짜 선택
  cell.addEventListener('click', () => {
    state.selectedDate = dateStr;
    document.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('is-selected'));
    cell.classList.add('is-selected');
    renderSelectedDaySection();
    scrollToSelectedSection();
  });

  return cell;
}

function getThemeToneClass(theme) {
  if (theme === 'light') return 'indigo';
  if (theme === 'food') return 'amber';
  if (theme === 'nature') return 'emerald';
  if (theme === 'kids') return 'violet';
  return 'sky';
}

function scrollToSelectedSection() {
  const target = document.getElementById('selected-day-container');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// 10. 선택 일자 상세 큐레이션 섹션 렌더링
function renderSelectedDaySection() {
  if (!state.selectedDate) return;

  const parts = state.selectedDate.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  const dayOfWeekNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayName = dayOfWeekNames[new Date(y, m - 1, d).getDay()];

  // 대형 날짜 큐브
  const dayNumBox = document.getElementById('selected-day-num');
  if (dayNumBox) dayNumBox.textContent = d;

  // 타이틀
  const titleEl = document.getElementById('selected-day-title');
  if (titleEl) {
    titleEl.textContent = `${m}월 ${d}일 (${dayName}) 축제 타임라인 & 큐레이션`;
  }

  // 해당 일자 축제 목록 구하기 (dates 배열 지원)
  const dayEvents = state.items.filter(ev => {
    return ev.dates?.length ? ev.dates.includes(state.selectedDate) : (ev.startDate <= state.selectedDate && ev.endDate >= state.selectedDate);
  });

  // 만약 해당 날짜에 축제가 없다면 인근 추천 축제 4건을 보여줌
  let displayList = dayEvents;
  let isNearFallback = false;
  if (displayList.length === 0) {
    isNearFallback = true;
    displayList = state.items.slice(0, 4);
  }

  // D-DAY 뱃지
  const badgeEl = document.getElementById('selected-day-badge');
  if (badgeEl) {
    badgeEl.textContent = isNearFallback
      ? `추천 축제 4개 안내`
      : `D-DAY ${displayList.length}개 축제 진행`;
  }

  // 4열 카드 그리드 렌더링
  const cardsGrid = document.getElementById('selected-day-cards');
  if (cardsGrid) {
    cardsGrid.innerHTML = '';
    displayList.slice(0, 4).forEach(ev => {
      const card = createCuratedCard(ev);
      cardsGrid.appendChild(card);
    });
  }

  // 추천 1일 연계 코스 갱신
  renderOneDayRoute(displayList);
}

// 11. 개별 축제 카드 DOM 생성 (AI Studio 규격)
function createCuratedCard(ev) {
  const card = document.createElement('article');
  card.className = 'festa-curated-card';

  const isSaved = state.savedIds.has(ev.id);
  const imgSrc = ev.imageUrl || ev.image?.src || '/assets/icons/icon-512.png';
  const placeText = ev.location || ev.venue || ev.region || '전국 주요 행사장';

  card.innerHTML = `
    <div class="festa-card-thumb-wrap">
      <img class="festa-card-thumb" src="${imgSrc}" alt="${ev.title}" loading="lazy" onerror="this.src='/assets/icons/icon-512.png'">
      <span class="festa-card-tag">${ev.categoryLabel || '문화축제'}</span>
      <button type="button" class="festa-card-bookmark-btn ${isSaved ? 'is-saved' : ''}" aria-label="일정 저장하기" data-festa-id="${ev.id}">
        <span class="material-symbols-outlined">favorite</span>
      </button>
    </div>
    <div class="festa-card-body">
      <div class="festa-card-meta-row">
        <span class="festa-card-fee-badge fee-${ev.feeStatus || 'free'}">${ev.feeLabel || '무료'}</span>
        <span class="festa-card-date-badge">${ev.startDate.slice(5)} ~ ${ev.endDate.slice(5)}</span>
      </div>
      <h4 class="festa-card-title">${ev.title}</h4>
      <p class="festa-card-venue">
        <span class="material-symbols-outlined">location_on</span>
        <span>${placeText}</span>
      </p>
      <div class="festa-card-tip">
        💡 ${ev.curatorTip || '현장 자율 관람 가능하며 편안한 복장을 추천합니다.'}
      </div>
      <div class="festa-card-actions">
        <a class="btn-card-map" href="/map/?focus=${encodeURIComponent(ev.id)}">
          <span class="material-symbols-outlined">explore</span> 지도보기
        </a>
        <a class="btn-card-detail" href="${ev.url || '#'}">
          <span class="material-symbols-outlined">info</span> 상세보기
        </a>
      </div>
    </div>
  `;

  // 북마크 하트 버튼 클릭
  const bookmarkBtn = card.querySelector('.festa-card-bookmark-btn');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBookmark(ev.id, ev.title, bookmarkBtn);
    });
  }

  // 상세보기 버튼 클릭
  const detailBtn = card.querySelector('[data-open-detail]');
  if (detailBtn) {
    detailBtn.addEventListener('click', () => {
      openQuickPreviewModal(ev);
    });
  }

  return card;
}

// 북마크 토글 함수
function toggleBookmark(id, title, btnEl) {
  if (state.savedIds.has(id)) {
    state.savedIds.delete(id);
    if (btnEl) btnEl.classList.remove('is-saved');
    showToast(`'${title}' 보관함에서 삭제되었습니다.`);
  } else {
    state.savedIds.add(id);
    if (btnEl) btnEl.classList.add('is-saved');
    showToast(`'${title}' 보관함에 저장되었습니다!`);
  }
  saveBookmarksToStorage();
}

// 12. 추천 1일 연계 코스 생성
function renderOneDayRoute(eventsList) {
  const stepsContainer = document.getElementById('selected-route-steps');
  if (!stepsContainer) return;
  stepsContainer.innerHTML = '';

  const defaultSteps = [
    {
      step: 'STEP 01',
      time: '13:00',
      title: '로컬 플리마켓 & 감성 푸드트럭',
      desc: '행사장 주변 수공예품 부스 및 다양한 길거리 먹거리 체험'
    },
    {
      step: 'STEP 02',
      time: '16:30',
      title: '선셋 야외 버스킹 & 어쿠스틱 라이브',
      desc: '노을 지는 강변 무대에서 즐기는 감성 인디 밴드 라이브 공연'
    },
    {
      step: 'STEP 03',
      time: '19:30',
      title: '메인 축제 불꽃쇼 & 야간 조명 연출',
      desc: '화려한 드론 라이트쇼와 야간 경관 조명 감상으로 피날레'
    }
  ];

  // 만약 선택된 이벤트가 있으면 해당 축제 정보로 스텝 보강
  if (eventsList.length > 0) {
    defaultSteps[2].title = `${eventsList[0].shortTitle || eventsList[0].title} 메인 관람`;
    defaultSteps[2].desc = `${eventsList[0].venue} 특설 무대 및 야간 축제 프로그램 참여`;
  }

  defaultSteps.forEach(s => {
    const stepEl = document.createElement('div');
    stepEl.className = 'cal-route-step-item';
    stepEl.innerHTML = `
      <span class="step-badge">${s.step}</span>
      <div>
        <p class="step-time">${s.time}</p>
        <h5 class="step-title">${s.title}</h5>
        <p class="step-desc">${s.desc}</p>
      </div>
    `;
    stepsContainer.appendChild(stepEl);
  });
}

// 13. 빠른 상세 미리보기 모달 팝업
function openQuickPreviewModal(ev) {
  const modal = document.getElementById('quick-preview-modal');
  const content = document.getElementById('quick-modal-content');
  if (!modal || !content) return;

  const isSaved = state.savedIds.has(ev.id);

  content.innerHTML = `
    <div class="quick-modal-hero">
      <img class="quick-modal-img" src="${ev.imageUrl}" alt="${ev.title}">
      <button type="button" class="quick-modal-close-btn" id="modal-close-btn" aria-label="닫기">×</button>
    </div>
    <div class="quick-modal-body">
      <div class="quick-modal-tags">
        <span class="festa-card-tag">${ev.categoryLabel || '문화축제'}</span>
        <span class="festa-card-fee-badge fee-${ev.feeStatus || 'free'}">${ev.feeLabel || '무료'}</span>
      </div>
      <h3 class="quick-modal-title">${ev.title}</h3>
      <p class="quick-modal-desc">${ev.summary || '전국 각지의 생생한 문화와 열정을 느낄 수 있는 대표 축제 행사입니다.'}</p>
      
      <div class="quick-modal-meta-grid">
        <div class="quick-meta-item">
          <span class="material-symbols-outlined">calendar_today</span>
          <div>
            <strong>행사 기간</strong>
            <span>${ev.startDate} ~ ${ev.endDate}</span>
          </div>
        </div>
        <div class="quick-meta-item">
          <span class="material-symbols-outlined">pin_drop</span>
          <div>
            <strong>개최 장소</strong>
            <span>${ev.venue || ev.region}</span>
          </div>
        </div>
      </div>

      <div class="quick-modal-footer">
        <a class="btn-modal-map" href="/map/?focus=${encodeURIComponent(ev.id)}">
          <span class="material-symbols-outlined">map</span> 내주변 지도에서 위치보기
        </a>
        <a class="btn-modal-link" href="${ev.officialUrl || ev.url}" target="_blank" rel="noopener noreferrer">
          <span class="material-symbols-outlined">open_in_new</span> 공식 사이트 바로가기
        </a>
      </div>
    </div>
  `;

  modal.showModal();

  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.close());
  }
}

// 14. 보관함 다이얼로그 목록 렌더링
function renderSavedDialogList() {
  const listEl = document.getElementById('saved-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const savedList = state.items.filter(item => state.savedIds.has(item.id));

  if (savedList.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #8a92a6;">
        <span class="material-symbols-outlined" style="font-size: 40px; margin-bottom: 8px;">favorite_border</span>
        <p>아직 저장한 일정이 없습니다.<br>축제 카드의 하트(♡)를 눌러 관심 일정을 모아보세요!</p>
      </div>
    `;
    return;
  }

  savedList.forEach(item => {
    const row = document.createElement('div');
    row.className = 'saved-item-row';
    row.innerHTML = `
      <div>
        <h4 class="saved-item-title">${item.title}</h4>
        <p class="saved-item-sub">📍 ${item.venue || item.region} · 📅 ${item.startDate}</p>
      </div>
      <button type="button" class="saved-del-btn" aria-label="삭제" data-del-id="${item.id}">
        <span class="material-symbols-outlined">delete</span>
      </button>
    `;

    const delBtn = row.querySelector('[data-del-id]');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        state.savedIds.delete(item.id);
        saveBookmarksToStorage();
        renderSavedDialogList();
        renderAll();
        showToast('일정이 보관함에서 삭제되었습니다.');
      });
    }

    listEl.appendChild(row);
  });
}
