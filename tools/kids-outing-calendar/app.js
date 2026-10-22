/**
 * ==========================================================================
 * [라이프·일상생활] 🎪 아이와 가볼만한 곳 축제/행사 달력 UI 컨트롤러 (app.js)
 * --------------------------------------------------------------------------
 * 1. 전국 40여 개 가을 공식 축제 빅데이터 기반 월~일 7열 캘린더 생성
 * 2. 실시간 키워드 검색 엔진 (축제명, 장소, 체험 키워드, 테마)
 * 3. 지역별(서울·경기 메인, 전국 도 단위) & 테마별(단풍, 체험, 먹거리, 빛, 무료) 필터링
 * 4. 마우스 호버 시 장소 & 주요 체험 프로그램 커스텀 툴팁
 * 5. 축제 바/카드 클릭 시 지자체 공식 안내 홈페이지 새 창 이동
 * 6. 선택 일자 상세 가족 축제 카드 렌더링
 * 7. 외부 축제 데이터(JSON/공공데이터) 안전한 확장 및 복원 모달 연동
 * ==========================================================================
 */

import { KidsOutingLogic } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. 상태 변수 정의
  // --------------------------------------------------------------------------
  let currentYear = 2026;
  let currentMonth = 10; // 기본 10월
  let currentRegion = '전체'; // 기본 전국
  let currentTheme = 'all'; // 기본 전체 테마
  let onlyFree = false; // 무료 전용 토글
  let currentKeyword = ''; // 검색어
  let selectedDate = '2026-10-24'; // 기본 선택일 (주말 대표 축제 집중일)

  // --------------------------------------------------------------------------
  // 2. DOM 요소 참조
  // --------------------------------------------------------------------------
  // 검색 및 필터 요소
  const searchInput = document.getElementById('searchFestivalInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const btnOpenImportModal = document.getElementById('btnOpenImportModal');
  const themeChips = document.querySelectorAll('.theme-chip-btn');
  const btnToggleFree = document.getElementById('btnToggleFree');
  const regionChips = document.querySelectorAll('.region-chip-btn');
  const filteredCountBadge = document.getElementById('filteredCountBadge');

  // 월 이동 및 달력 요소
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  const btnNextMonth = document.getElementById('btnNextMonth');
  const currentMonthHeading = document.getElementById('currentMonthHeading');
  const monthSubCaption = document.getElementById('monthSubCaption');
  const calendarUnifiedGrid = document.getElementById('calendarUnifiedGrid');

  // 상세 카드 및 툴팁 요소
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const selectedDateCount = document.getElementById('selectedDateCount');
  const festivalCardsGrid = document.getElementById('festivalCardsGrid');
  const kidsFloatingTooltip = document.getElementById('kidsFloatingTooltip');

  // 가져오기 모달 요소
  const importModalOverlay = document.getElementById('importModalOverlay');
  const btnCloseImportModal = document.getElementById('btnCloseImportModal');
  const btnResetDefaultFestivals = document.getElementById('btnResetDefaultFestivals');
  const btnSubmitImportJson = document.getElementById('btnSubmitImportJson');
  const importJsonTextarea = document.getElementById('importJsonTextarea');

  // 특정 일자 전체 축제 모달 요소 (+N개 더보기 클릭 시)
  const dayEventsModalOverlay = document.getElementById('dayEventsModalOverlay');
  const dayModalTitle = document.getElementById('dayModalTitle');
  const btnCloseDayModal = document.getElementById('btnCloseDayModal');
  const dayModalCardsList = document.getElementById('dayModalCardsList');

  // --------------------------------------------------------------------------
  // 3. 통계 뱃지 업데이트
  // --------------------------------------------------------------------------
  function updateCountBadge() {
    if (!filteredCountBadge) return;
    const currentMonthEvents = KidsOutingLogic.searchFestivals({
      year: currentYear,
      month: currentMonth,
      region: currentRegion,
      theme: currentTheme,
      onlyFree: onlyFree,
      keyword: currentKeyword
    });
    filteredCountBadge.textContent = `조회된 축제: ${currentMonthEvents.length}개`;
  }

  // --------------------------------------------------------------------------
  // 4. 월간 달력 렌더링 엔진 (월~일 기준 단일 7열 통합 그리드)
  // --------------------------------------------------------------------------
  function renderCalendar() {
    if (!calendarUnifiedGrid) return;

    // 헤더 텍스트 업데이트
    if (currentMonthHeading) {
      currentMonthHeading.textContent = `${currentYear}년 ${currentMonth}월`;
    }
    if (monthSubCaption) {
      if (currentMonth === 10) {
        monthSubCaption.textContent = '🍁 단풍 & 가을 수확 축제 시즌';
      } else {
        monthSubCaption.textContent = '🏮 빛초롱 & 겨울맞이 온가족 축제 시즌';
      }
    }

    calendarUnifiedGrid.innerHTML = '';

    // 0) 1행: 요일 헤더 셀 7개 생성 (월~일 순서)
    const weekdayHeaders = [
      { name: '월', cls: '' },
      { name: '화', cls: '' },
      { name: '수', cls: '' },
      { name: '목', cls: '' },
      { name: '금', cls: '' },
      { name: '토', cls: 'sat' },
      { name: '일', cls: 'sun' }
    ];
    weekdayHeaders.forEach(w => {
      const th = document.createElement('div');
      th.className = `kids-th-cell ${w.cls}`;
      th.textContent = w.name;
      calendarUnifiedGrid.appendChild(th);
    });

    // 날짜 계산 (월~일 기준 정렬)
    // JS getDay(): 0(일), 1(월), 2(화), 3(수), 4(목), 5(금), 6(토)
    // 월=0, 화=1, ..., 일=6 변환 공식: (day + 6) % 7
    const firstDayObj = new Date(currentYear, currentMonth - 1, 1);
    const startWeekdayOffset = (firstDayObj.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();

    // 1) 이전 달 잔여 일자 셀 채우기
    for (let i = startWeekdayOffset - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const cell = document.createElement('div');
      cell.className = 'kids-day-cell other-month';
      cell.innerHTML = `
        <div class="cell-header">
          <span class="cell-date-num">${dNum}</span>
        </div>
      `;
      calendarUnifiedGrid.appendChild(cell);
    }

    // 2) 현재 달 일자 셀 채우기 (1 ~ daysInMonth)
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'kids-day-cell';

      // 요일 판별 (5: 토요일, 6: 일요일)
      const weekdayIdx = (startWeekdayOffset + d - 1) % 7;
      if (weekdayIdx === 5) cell.classList.add('sat');
      if (weekdayIdx === 6) cell.classList.add('sun');

      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (dateStr === selectedDate) {
        cell.classList.add('is-selected');
      }

      // 오늘 날짜 표시 (10월 22일 가상 또는 현재 일치 시)
      if (d === 22 && currentMonth === 10) {
        cell.classList.add('is-today');
      }

      // 해당 일자에 열리는 축제 목록 조회 (검색 및 다중 필터 적용)
      const events = KidsOutingLogic.getEventsOnDate(dateStr, {
        region: currentRegion,
        theme: currentTheme,
        onlyFree: onlyFree,
        keyword: currentKeyword
      });

      // 셀 헤더 구성
      const headerEl = document.createElement('div');
      headerEl.className = 'cell-header';
      headerEl.innerHTML = `
        <span class="cell-date-num">${d}</span>
        ${events.length > 0 ? `<span class="cell-count-pill">${events.length}개</span>` : ''}
      `;
      cell.appendChild(headerEl);

      // 축제 바 목록 생성
      const eventsListEl = document.createElement('div');
      eventsListEl.className = 'cell-events-list';

      // 셀 공간을 고려하여 최대 3개까지 표시하고 초과는 +N개로 축약
      const displayEvents = events.slice(0, 3);
      displayEvents.forEach(ev => {
        const bar = document.createElement('a');
        bar.className = `cal-event-bar bar-${ev.tagColor || 'blue'}`;
        bar.href = ev.link;
        bar.target = '_blank';
        bar.rel = 'noopener noreferrer';
        bar.textContent = `${ev.icon || '🎪'} ${ev.title}`;

        // 마우스 호버 시 툴팁 이벤트 바인딩
        bar.addEventListener('mouseenter', (e) => showTooltip(e, ev));
        bar.addEventListener('mousemove', moveTooltip);
        bar.addEventListener('mouseleave', hideTooltip);

        // 클릭 시 이벤트 전파 방지 (셀 클릭 이벤트와 분리)
        bar.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        eventsListEl.appendChild(bar);
      });

      if (events.length > 3) {
        const moreBtn = document.createElement('button');
        moreBtn.className = 'cal-more-btn';
        moreBtn.type = 'button';
        moreBtn.textContent = `+${events.length - 3}개 더보기 🔍`;
        moreBtn.title = '이 날 열리는 모든 축제 전체보기';

        moreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedDate = dateStr;
          document.querySelectorAll('.kids-day-cell.is-selected').forEach(c => c.classList.remove('is-selected'));
          cell.classList.add('is-selected');
          renderDetails();
          openDayEventsModal(dateStr, events);
        });

        eventsListEl.appendChild(moreBtn);
      }

      cell.appendChild(eventsListEl);

      // 날짜 셀 클릭 시 해당 일자 선택 및 상세 카드 렌더링
      cell.addEventListener('click', () => {
        document.querySelectorAll('.kids-day-cell.is-selected').forEach(c => c.classList.remove('is-selected'));
        cell.classList.add('is-selected');
        selectedDate = dateStr;
        renderDetails();
      });

      calendarUnifiedGrid.appendChild(cell);
    }

    // 3) 다음 달 잔여 일자 셀 채우기 (전체 셀이 7의 배수가 되도록)
    const totalFilled = startWeekdayOffset + daysInMonth;
    const remainingCells = (7 - (totalFilled % 7)) % 7;
    for (let j = 1; j <= remainingCells; j++) {
      const cell = document.createElement('div');
      cell.className = 'kids-day-cell other-month';
      cell.innerHTML = `
        <div class="cell-header">
          <span class="cell-date-num">${j}</span>
        </div>
      `;
      calendarUnifiedGrid.appendChild(cell);
    }

    updateCountBadge();
  }

  // --------------------------------------------------------------------------
  // 5. 선택 일자 상세 축제 카드 렌더링
  // --------------------------------------------------------------------------
  function renderDetails() {
    if (!festivalCardsGrid || !selectedDateTitle || !selectedDateCount) return;

    // 날짜 텍스트 파싱
    const [y, m, d] = selectedDate.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[dateObj.getDay()];

    selectedDateTitle.textContent = `📌 ${parseInt(m)}월 ${parseInt(d)}일(${dayName}) 열리는 가족 축제 & 행사`;

    const events = KidsOutingLogic.getEventsOnDate(selectedDate, {
      region: currentRegion,
      theme: currentTheme,
      onlyFree: onlyFree,
      keyword: currentKeyword
    });

    selectedDateCount.textContent = `총 ${events.length}개`;
    festivalCardsGrid.innerHTML = '';

    if (events.length === 0) {
      festivalCardsGrid.innerHTML = `
        <div class="fc-empty-state">
          <div style="font-size: 2.2rem; margin-bottom: 0.6rem;">🎈</div>
          <h4 style="font-size: 1.05rem; font-weight: 850; color: #334155; margin-bottom: 0.35rem;">
            해당 일자에는 조건에 맞는 축제 일정이 없습니다.
          </h4>
          <p style="font-size: 0.85rem; color: #64748b;">
            상단의 <strong>지역 필터</strong>를 '전체'로 변경하거나, 달력에서 축제 바가 표시된 날짜(주말 집중)를 클릭해 보세요!
          </p>
        </div>
      `;
      return;
    }

    events.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'festival-card';
      card.innerHTML = `
        <div>
          <div class="fc-top-row">
            <span class="fc-region">📍 ${ev.region}</span>
            <span class="fc-fee">${ev.fee}</span>
          </div>
          <h4 class="fc-title">
            <span>${ev.icon || '🎪'}</span>
            <span>${ev.title}</span>
          </h4>
          <div class="fc-period">🗓️ ${ev.periodText}</div>
          <div class="fc-row"><strong>장소:</strong> ${ev.location}</div>
          <div class="fc-row"><strong>주요 프로그램:</strong> ${ev.program}</div>
          <div class="fc-desc">${ev.desc}</div>
        </div>
        <a href="${ev.link}" target="_blank" rel="noopener noreferrer" class="fc-link-btn">
          공식 안내 홈페이지 바로가기 ↗
        </a>
      `;
      festivalCardsGrid.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // 6. 커스텀 플로팅 툴팁 제어
  // --------------------------------------------------------------------------
  function showTooltip(e, ev) {
    if (!kidsFloatingTooltip) return;

    kidsFloatingTooltip.innerHTML = `
      <div class="tt-header">
        <span>${ev.icon || '🎪'}</span>
        <span>${ev.title}</span>
      </div>
      <div class="tt-line"><strong>📍 장소:</strong> ${ev.location}</div>
      <div class="tt-line"><strong>🎈 프로그램:</strong> ${ev.program}</div>
      <div class="tt-line" style="font-size: 0.76rem; color: #a7f3d0;"><strong>💰 요금:</strong> ${ev.fee}</div>
      <div class="tt-cta">클릭 시 공식 홈페이지로 이동합니다 ↗</div>
    `;

    kidsFloatingTooltip.style.left = `${e.clientX}px`;
    kidsFloatingTooltip.style.top = `${e.clientY}px`;
    kidsFloatingTooltip.classList.add('show');
  }

  function moveTooltip(e) {
    if (!kidsFloatingTooltip || !kidsFloatingTooltip.classList.contains('show')) return;
    kidsFloatingTooltip.style.left = `${e.clientX}px`;
    kidsFloatingTooltip.style.top = `${e.clientY}px`;
  }

  function hideTooltip() {
    if (!kidsFloatingTooltip) return;
    kidsFloatingTooltip.classList.remove('show');
  }

  // --------------------------------------------------------------------------
  // 7. 실시간 키워드 검색 이벤트
  // --------------------------------------------------------------------------
  let searchDebounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      currentKeyword = val;

      if (btnClearSearch) {
        if (val.length > 0) {
          btnClearSearch.classList.add('visible');
        } else {
          btnClearSearch.classList.remove('visible');
        }
      }

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        renderCalendar();
        renderDetails();
      }, 150);
    });
  }

  if (btnClearSearch && searchInput) {
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      currentKeyword = '';
      btnClearSearch.classList.remove('visible');
      renderCalendar();
      renderDetails();
      searchInput.focus();
    });
  }

  // --------------------------------------------------------------------------
  // 8. 테마 필터 칩 이벤트
  // --------------------------------------------------------------------------
  themeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      themeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentTheme = chip.dataset.theme;
      renderCalendar();
      renderDetails();
    });
  });

  // 무료 관람 토글 버튼
  if (btnToggleFree) {
    btnToggleFree.addEventListener('click', () => {
      onlyFree = !onlyFree;
      if (onlyFree) {
        btnToggleFree.classList.add('active');
      } else {
        btnToggleFree.classList.remove('active');
      }
      renderCalendar();
      renderDetails();
    });
  }

  // --------------------------------------------------------------------------
  // 9. 지역 필터 칩 이벤트
  // --------------------------------------------------------------------------
  regionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      regionChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentRegion = chip.dataset.region;
      renderCalendar();
      renderDetails();
    });
  });

  // --------------------------------------------------------------------------
  // 10. 월 이동 네비게이션
  // --------------------------------------------------------------------------
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
      currentMonth = 10;
      selectedDate = '2026-10-24';
      renderCalendar();
      renderDetails();
    });
  }

  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      currentMonth = 11;
      selectedDate = '2026-11-07'; // 11월 첫째 주말 (부산 불꽃축제, 빛초롱 등)
      renderCalendar();
      renderDetails();
    });
  }

  // --------------------------------------------------------------------------
  // 11. 축제 가져오기 / 공공데이터 연동 모달 제어
  // --------------------------------------------------------------------------
  if (btnOpenImportModal && importModalOverlay) {
    btnOpenImportModal.addEventListener('click', () => {
      importModalOverlay.classList.add('open');
    });
  }

  if (btnCloseImportModal && importModalOverlay) {
    btnCloseImportModal.addEventListener('click', () => {
      importModalOverlay.classList.remove('open');
    });
  }

  if (importModalOverlay) {
    importModalOverlay.addEventListener('click', (e) => {
      if (e.target === importModalOverlay) {
        importModalOverlay.classList.remove('open');
      }
    });
  }

  // 기본팩 40선 복원
  if (btnResetDefaultFestivals) {
    btnResetDefaultFestivals.addEventListener('click', () => {
      try {
        localStorage.removeItem('simulab_kids_custom_festivals');
        KidsOutingLogic.userImportedFestivals = [];
        alert('전국 대표 축제 40선 기본팩으로 정돈되었습니다!');
        if (importModalOverlay) importModalOverlay.classList.remove('open');
        renderCalendar();
        renderDetails();
      } catch (err) {
        console.error(err);
      }
    });
  }

  // 커스텀 JSON 병합 등록
  if (btnSubmitImportJson && importJsonTextarea) {
    btnSubmitImportJson.addEventListener('click', () => {
      const text = importJsonTextarea.value.trim();
      if (!text) {
        alert('추가할 축제 JSON 데이터를 입력해주세요.');
        return;
      }

      try {
        const parsed = JSON.parse(text);
        const result = KidsOutingLogic.importExternalEvents(Array.isArray(parsed) ? parsed : [parsed]);
        if (result.success && result.count > 0) {
          alert(`총 ${result.count}개의 축제 데이터가 성공적으로 병합되었습니다!`);
          importJsonTextarea.value = '';
          if (importModalOverlay) importModalOverlay.classList.remove('open');
          renderCalendar();
          renderDetails();
        } else {
          alert('유효한 축제 데이터를 찾지 못했습니다. 필수 항목(title, startDate, endDate)을 확인해주세요.');
        }
      } catch (e) {
        alert('JSON 형식이 올바르지 않습니다. 문법 오류를 확인해주세요.');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 12. 특정 날짜 전체 축제 상세 모달 제어 (+N개 더보기)
  // --------------------------------------------------------------------------
  function openDayEventsModal(dateStr, events) {
    if (!dayEventsModalOverlay || !dayModalTitle || !dayModalCardsList) return;

    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[dateObj.getDay()];

    dayModalTitle.innerHTML = `<span>🗓️</span> ${parseInt(m)}월 ${parseInt(d)}일(${dayName}) 전체 축제 (${events.length}개)`;
    dayModalCardsList.innerHTML = '';

    events.forEach(ev => {
      const item = document.createElement('div');
      item.className = 'day-modal-item';
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <span style="font-size: 0.75rem; font-weight: 850; padding: 0.18rem 0.55rem; border-radius: 7px; background: #e2e8f0; color: #334155;">
            📍 ${ev.region}
          </span>
          <span style="font-size: 0.78rem; font-weight: 850; color: #16a34a;">
            ${ev.fee}
          </span>
        </div>
        <h4 style="font-size: 1.05rem; font-weight: 850; color: #1e293b; margin: 0.2rem 0 0.35rem; display: flex; align-items: center; gap: 0.3rem;">
          <span>${ev.icon || '🎪'}</span>
          <span>${ev.title}</span>
        </h4>
        <div style="font-size: 0.78rem; font-weight: 750; color: #2563eb; margin-bottom: 0.4rem;">
          🗓️ ${ev.periodText}
        </div>
        <div style="font-size: 0.8rem; color: #475569; margin-bottom: 0.25rem;">
          <strong>장소:</strong> ${ev.location}
        </div>
        <div style="font-size: 0.8rem; color: #475569; margin-bottom: 0.4rem;">
          <strong>주요 프로그램:</strong> ${ev.program}
        </div>
        <div style="font-size: 0.78rem; color: #64748b; background: #ffffff; padding: 0.5rem 0.7rem; border-radius: 9px; margin-bottom: 0.65rem; line-height: 1.45; border: 1px solid #e2e8f0;">
          ${ev.desc}
        </div>
        <a href="${ev.link}" target="_blank" rel="noopener noreferrer" class="fc-link-btn" style="padding: 0.55rem; font-size: 0.82rem;">
          공식 안내 홈페이지 바로가기 ↗
        </a>
      `;
      dayModalCardsList.appendChild(item);
    });

    dayEventsModalOverlay.classList.add('open');
  }

  if (btnCloseDayModal && dayEventsModalOverlay) {
    btnCloseDayModal.addEventListener('click', () => {
      dayEventsModalOverlay.classList.remove('open');
    });
  }

  if (dayEventsModalOverlay) {
    dayEventsModalOverlay.addEventListener('click', (e) => {
      if (e.target === dayEventsModalOverlay) {
        dayEventsModalOverlay.classList.remove('open');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 13. 초기 화면 렌더링 실행
  // --------------------------------------------------------------------------
  renderCalendar();
  renderDetails();
});
