/**
 * 전국 축제 & 가족 정보 통합 캘린더 인터랙티브 스크립트 (FESTA CALENDAR)
 * - Stitch 규격 월간/주간 캘린더 탐색 및 일자 선택
 * - 실시간 당일 타임라인 렌더링
 * - 3단계 1일 추천 코스(One-Day Route) 자동 생성
 * - 실시간 날씨 & 큐레이터 팁 연동
 * - 보관함(찜) 로컬스토리지 저장 및 상세 모달
 */

(function () {
  'use strict';

  // 1. 데이터 로드 및 초기 상태 정의
  const dataEl = document.getElementById('calendar-data');
  if (!dataEl) return;

  let allEvents = [];
  try {
    allEvents = JSON.parse(dataEl.textContent || '[]');
  } catch (err) {
    console.error('달력 데이터 파싱 실패:', err);
    allEvents = [];
  }

  // 오늘 날짜 계산 (Asia/Seoul 기준 YYYY-MM-DD)
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);

  // 애플리케이션 상태
  const state = {
    viewYear: tYear,
    viewMonth: tMonth, // 1 ~ 12
    selectedDate: todayStr,
    scope: 'all', // all | festival | culture | benefit
    region: 'all', // all | 서울 | 경기 등
    savedIds: new Set(JSON.parse(localStorage.getItem('simulab_saved_festivals') || '[]'))
  };

  // DOM 요소 캐싱
  const yearMonthEl = document.getElementById('cal-year-month');
  const monthBadgeEl = document.getElementById('cal-month-badge');
  const daysGridEl = document.getElementById('cal-days-grid');
  const prevMonthBtn = document.getElementById('prev-month-btn');
  const nextMonthBtn = document.getElementById('next-month-btn');
  const todayBtn = document.getElementById('today-btn');

  const timelineTitleEl = document.getElementById('timeline-title');
  const timelineCountEl = document.getElementById('timeline-count');
  const timelineListEl = document.getElementById('timeline-list');

  const routeDateLabelEl = document.getElementById('route-date-label');
  const routeStepsEl = document.getElementById('route-steps-container');
  const weatherTempEl = document.getElementById('weather-temp');
  const weatherDetailEl = document.getElementById('weather-detail');
  const curatorTipQuoteEl = document.getElementById('curator-tip-quote');

  const scopeTabs = document.querySelectorAll('.cal-scope-btn');
  const regionChips = document.querySelectorAll('.cal-region-chip');
  const savedBadgeEl = document.getElementById('saved-badge-count');
  const openSavedBtn = document.getElementById('open-saved-btn');

  // 모달 요소
  const modalBackdrop = document.getElementById('cal-detail-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCatBadge = document.getElementById('modal-cat-badge');
  const modalTitle = document.getElementById('modal-title');
  const modalDateVal = document.getElementById('modal-date-val');
  const modalLocVal = document.getElementById('modal-loc-val');
  const modalFeeVal = document.getElementById('modal-fee-val');
  const modalSourceVal = document.getElementById('modal-source-val');
  const modalDescVal = document.getElementById('modal-desc-val');
  const modalOfficialBtn = document.getElementById('modal-official-btn');
  const modalSaveToggleBtn = document.getElementById('modal-save-toggle-btn');

  let activeModalEvent = null;

  // 2. 헬퍼 함수
  function updateSavedBadge() {
    if (savedBadgeEl) {
      savedBadgeEl.textContent = state.savedIds.size;
    }
  }

  function saveToLocalStorage() {
    localStorage.setItem('simulab_saved_festivals', JSON.stringify([...state.savedIds]));
    updateSavedBadge();
  }

  function toggleSave(id) {
    if (state.savedIds.has(id)) {
      state.savedIds.delete(id);
    } else {
      state.savedIds.add(id);
    }
    saveToLocalStorage();
    renderDayTimeline(state.selectedDate);
    if (activeModalEvent && activeModalEvent.id === id) {
      updateModalSaveButton(id);
    }
  }

  function updateModalSaveButton(id) {
    if (!modalSaveToggleBtn) return;
    const isSaved = state.savedIds.has(id);
    modalSaveToggleBtn.textContent = isSaved ? '♥ 보관함에서 해제' : '♡ 일정 보관하기';
    modalSaveToggleBtn.style.color = isSaved ? 'var(--cal-rose)' : 'var(--cal-navy)';
  }

  // 특정 이벤트가 주어진 날짜에 유효한지 검사
  function isEventOnDate(item, dateStr) {
    // 필터 조건 체크: scope
    if (state.scope !== 'all' && item.scope !== state.scope) {
      return false;
    }
    // 필터 조건 체크: region
    if (state.region !== 'all' && item.region !== state.region && item.region !== '전국') {
      return false;
    }

    // 날짜 매칭
    if (item.dates && item.dates.length > 0) {
      return item.dates.includes(dateStr);
    }
    return dateStr >= item.startDate && dateStr <= item.endDate;
  }

  // 3. 월간 캘린더 그리드 렌더링
  function renderCalendarGrid() {
    const { viewYear, viewMonth } = state;
    if (yearMonthEl) {
      yearMonthEl.textContent = `${viewYear}년 ${viewMonth}월`;
    }

    // 해당 월의 첫 날 요일(0:일, 1:월, ..., 6:토) 및 총 일수
    const firstDayIndex = new Date(viewYear, viewMonth - 1, 1).getDay();
    const lastDate = new Date(viewYear, viewMonth, 0).getDate();
    const prevMonthLastDate = new Date(viewYear, viewMonth - 1, 0).getDate();

    daysGridEl.innerHTML = '';

    // 이번 달 진행 총 일정 개수 계산
    const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
    let monthEventCount = 0;

    // 이전 달 잔여 일자 채우기
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDate - i;
      const prevMonthNum = viewMonth === 1 ? 12 : viewMonth - 1;
      const prevYearNum = viewMonth === 1 ? viewYear - 1 : viewYear;
      const cellDateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

      const cell = createDayCell(cellDateStr, dayNum, true);
      daysGridEl.appendChild(cell);
    }

    // 이번 달 일자 채우기
    for (let dayNum = 1; dayNum <= lastDate; dayNum++) {
      const cellDateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const cell = createDayCell(cellDateStr, dayNum, false);
      daysGridEl.appendChild(cell);

      // 이번 달 일정 수 카운트
      const dayEvents = allEvents.filter(e => isEventOnDate(e, cellDateStr));
      if (dayEvents.length > 0) {
        monthEventCount += dayEvents.length;
      }
    }

    // 다음 달 잔여 일자 채우기 (7열 그리드 맞추기)
    const totalCells = daysGridEl.children.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const nextMonthNum = viewMonth === 12 ? 1 : viewMonth + 1;
      const nextYearNum = viewMonth === 12 ? viewYear + 1 : viewYear;
      const cellDateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

      const cell = createDayCell(cellDateStr, dayNum, true);
      daysGridEl.appendChild(cell);
    }

    if (monthBadgeEl) {
      monthBadgeEl.textContent = `총 ${monthEventCount}개 일정 진행`;
    }
  }

  // 일자 셀 엘리먼트 생성
  function createDayCell(dateStr, dayNum, isOtherMonth) {
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell';
    cell.dataset.date = dateStr;

    const cellDateObj = new Date(dateStr);
    const dayOfWeek = cellDateObj.getDay();
    if (dayOfWeek === 0) cell.classList.add('cal-is-sun');
    if (dayOfWeek === 6) cell.classList.add('cal-is-sat');

    if (isOtherMonth) {
      cell.classList.add('other-month');
    }
    if (dateStr === todayStr) {
      cell.classList.add('is-today');
    }
    if (dateStr === state.selectedDate) {
      cell.classList.add('is-selected');
    }

    // 해당 일자의 이벤트 추출
    const dayEvents = allEvents.filter(e => isEventOnDate(e, dateStr));

    // 상단 일자 및 개수 표시
    const topRow = document.createElement('div');
    topRow.className = 'cal-cell-top';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'cal-cell-date';
    dateSpan.textContent = dayNum;

    topRow.appendChild(dateSpan);

    if (dayEvents.length > 0) {
      const countSpan = document.createElement('span');
      countSpan.className = 'cal-cell-count';
      countSpan.textContent = `• ${dayEvents.length}건`;
      topRow.appendChild(countSpan);
    }
    cell.appendChild(topRow);

    // 이벤트 리스트 (최대 2개 노출)
    if (dayEvents.length > 0) {
      const itemsWrap = document.createElement('div');
      itemsWrap.className = 'cal-cell-items';

      const showEvents = dayEvents.slice(0, 2);
      showEvents.forEach(e => {
        const itemEl = document.createElement('div');
        itemEl.className = `cal-cell-item theme-${e.theme || 'indigo'}`;
        itemEl.textContent = e.shortLabel || e.title.slice(0, 6);
        itemsWrap.appendChild(itemEl);
      });

      if (dayEvents.length > 2) {
        const moreEl = document.createElement('div');
        moreEl.className = 'cal-cell-more';
        moreEl.textContent = `+${dayEvents.length - 2}개 더보기`;
        itemsWrap.appendChild(moreEl);
      }

      cell.appendChild(itemsWrap);
    }

    // 날짜 클릭 이벤트
    cell.addEventListener('click', () => {
      document.querySelectorAll('.cal-day-cell.is-selected').forEach(c => c.classList.remove('is-selected'));
      cell.classList.add('is-selected');
      state.selectedDate = dateStr;
      renderDayTimeline(dateStr);
      renderOneDayRoute(dateStr);
      renderWeatherAndTips(dateStr);
    });

    return cell;
  }

  // 4. 당일 타임라인 렌더링
  function renderDayTimeline(dateStr) {
    if (!timelineListEl) return;

    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekdayStr = days[dateObj.getDay()];

    if (timelineTitleEl) {
      timelineTitleEl.textContent = `${Number(m)}월 ${Number(d)}일 ${weekdayStr} 타임라인`;
    }

    const dayEvents = allEvents.filter(e => isEventOnDate(e, dateStr));
    if (timelineCountEl) {
      timelineCountEl.textContent = `총 ${dayEvents.length}건`;
    }

    timelineListEl.innerHTML = '';

    if (dayEvents.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.style.padding = '3rem 1rem';
      emptyBox.style.textAlign = 'center';
      emptyBox.style.color = '#94a3b8';
      emptyBox.innerHTML = `
        <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📅</div>
        <p style="margin: 0; font-weight: 700; color: #64748b;">선택하신 날짜에 진행 중인 일정이 없습니다.</p>
        <p style="margin: 0.4rem 0 0; font-size: 0.85rem;">필터 조건을 변경하거나 다른 날짜를 선택해보세요.</p>
      `;
      timelineListEl.appendChild(emptyBox);
      return;
    }

    dayEvents.forEach(item => {
      const card = document.createElement('div');
      card.className = 'cal-timeline-card';

      const isSaved = state.savedIds.has(item.id);

      // 상태 판별
      let statusHtml = '<span class="cal-tbadge-status">진행중</span>';
      if (item.applicationEnd && item.applicationEnd === dateStr) {
        statusHtml = '<span class="cal-tbadge-status deadline">오늘마감</span>';
      } else if (item.endDate === dateStr) {
        statusHtml = '<span class="cal-tbadge-status deadline">마지막날</span>';
      }

      card.innerHTML = `
        <div class="cal-tcard-top">
          <div class="cal-tcard-badges">
            <span class="cal-tbadge-cat ${item.scope}">${item.categoryLabel || '행사'}</span>
            ${statusHtml}
          </div>
          <div class="cal-tcard-actions">
            <button type="button" class="cal-tbtn-save ${isSaved ? 'saved' : ''}" aria-label="찜하기" data-id="${item.id}">
              ${isSaved ? '♥' : '♡'}
            </button>
          </div>
        </div>
        <h4 class="cal-tcard-title">
          <a href="#" class="open-detail-link" data-id="${item.id}">${item.title}</a>
        </h4>
        <div class="cal-tcard-meta">
          <span>📍 ${item.region} · ${item.location}</span>
          ${item.time ? `<span>⏰ ${item.time}</span>` : ''}
        </div>
        <p class="cal-tcard-desc">${item.program || '현장에서 다양한 프로그램과 부대행사가 함께 진행됩니다.'}</p>
        <div class="cal-tcard-footer">
          <span class="cal-tcard-fee">💰 ${item.fee || '무료 관람'}</span>
          <button type="button" class="cal-tcard-more-btn open-detail-link" data-id="${item.id}">
            상세보기 / 예약 ↗
          </button>
        </div>
      `;

      // 찜하기 버튼 리스너
      const saveBtn = card.querySelector('.cal-tbtn-save');
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSave(item.id);
      });

      // 상세 모달 열기 리스너
      card.querySelectorAll('.open-detail-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openModal(item);
        });
      });

      timelineListEl.appendChild(card);
    });
  }

  // 5. 추천 1일 연계 코스 (One-Day Route) 동적 렌더링
  function renderOneDayRoute(dateStr) {
    if (!routeStepsEl) return;

    const [y, m, d] = dateStr.split('-');
    if (routeDateLabelEl) {
      routeDateLabelEl.textContent = `${Number(m)}월 ${Number(d)}일`;
    }

    // 해당 날짜의 이벤트 중 상위 3개 선별
    const dayEvents = allEvents.filter(e => isEventOnDate(e, dateStr));
    const selectedStepEvents = dayEvents.slice(0, 3);

    routeStepsEl.innerHTML = '';

    if (selectedStepEvents.length === 0) {
      routeStepsEl.innerHTML = `
        <div class="cal-route-step">
          <div class="cal-route-num">1</div>
          <div class="cal-route-step-body">
            <span class="cal-route-time-tag">오전 11:00</span>
            <h4 class="cal-route-step-title">인근 수목원 &amp; 공원 가벼운 산책</h4>
            <p class="cal-route-step-desc">주변 잔디광장이나 야외 둘레길에서 맑은 공기를 마시며 하루를 여유롭게 시작합니다.</p>
          </div>
        </div>
        <div class="cal-route-step">
          <div class="cal-route-num">2</div>
          <div class="cal-route-step-body">
            <span class="cal-route-time-tag">오후 14:30</span>
            <h4 class="cal-route-step-title">지역 대표 로컬 미식 및 카페 투어</h4>
            <p class="cal-route-step-desc">동네 특색이 담긴 맛집과 디저트 카페에서 도란도란 대화를 나누며 재충전하세요.</p>
          </div>
        </div>
        <div class="cal-route-step">
          <div class="cal-route-num">3</div>
          <div class="cal-route-step-body">
            <span class="cal-route-time-tag">저녁 18:30</span>
            <h4 class="cal-route-step-title">도심 야경 &amp; 산책로 마무리</h4>
            <p class="cal-route-step-desc">은은한 조명이 켜진 야경 산책길을 걸으며 하루 일정을 마무리해보세요.</p>
          </div>
        </div>
      `;
      return;
    }

    const timeSlots = ['오전 11:00', '오후 15:00', '저녁 18:30'];
    const tips = [
      '오전 비교적 한산한 시간대에 도착하여 여유롭게 체험 및 전용 굿즈를 둘러보세요.',
      '메인 공연 무대와 플리마켓, 버스킹을 즐기며 축제 분위기를 만끽해보세요.',
      '선선한 저녁 바람과 함께 조명 야경 및 푸드트럭 야식을 맛보며 하루를 마무리하세요.'
    ];

    selectedStepEvents.forEach((ev, idx) => {
      const stepDiv = document.createElement('div');
      stepDiv.className = 'cal-route-step';
      stepDiv.innerHTML = `
        <div class="cal-route-num">${idx + 1}</div>
        <div class="cal-route-step-body">
          <span class="cal-route-time-tag">${timeSlots[idx]}</span>
          <h4 class="cal-route-step-title">${ev.title} (${ev.location})</h4>
          <p class="cal-route-step-desc">${tips[idx]}</p>
        </div>
      `;
      routeStepsEl.appendChild(stepDiv);
    });
  }

  // 6. 실시간 날씨 및 큐레이터 꿀팁 업데이트
  function renderWeatherAndTips(dateStr) {
    if (!weatherTempEl || !weatherDetailEl || !curatorTipQuoteEl) return;

    // 날짜별 계절감 반영 시뮬레이션
    const [y, m, d] = dateStr.split('-').map(Number);
    let temp = '19°C';
    let weatherText = '맑음 / 강수확률 10%';
    let detail = '야외 활동하기 가장 쾌적한 맑은 날씨입니다. 저녁에는 일교차가 있으니 얇은 겉옷을 준비하세요.';

    if (m >= 6 && m <= 8) {
      temp = '28°C';
      weatherText = '구름 조금 / 자외선 높음';
      detail = '자외선 차단제와 시원한 얼음물을 챙기시고 수분 섭취에 유의하세요.';
    } else if (m >= 12 || m <= 2) {
      temp = '4°C';
      weatherText = '맑고 쌀쌀함';
      detail = '기온이 낮으므로 핫팩과 따뜻한 방한용품을 챙겨 감기에 대비하세요.';
    }

    weatherTempEl.textContent = temp;
    weatherDetailEl.innerHTML = `<strong>${weatherText}</strong><br>${detail}`;

    // 해당 날짜의 첫 번째 이벤트 큐레이터 팁 활용
    const dayEvents = allEvents.filter(e => isEventOnDate(e, dateStr));
    if (dayEvents.length > 0 && dayEvents[0].curatorTip) {
      curatorTipQuoteEl.textContent = `“${dayEvents[0].curatorTip}”`;
    } else {
      curatorTipQuoteEl.textContent = `“주말 인기 행사는 현장 주차장이 조기에 만차될 수 있으니 대중교통을 이용하시면 훨씬 쾌적하게 축제를 즐기실 수 있습니다.”`;
    }
  }

  // 7. 상세 모달 열기 및 닫기
  function openModal(item) {
    if (!modalBackdrop) return;
    activeModalEvent = item;

    if (modalCatBadge) modalCatBadge.textContent = item.categoryLabel || '행사 안내';
    if (modalTitle) modalTitle.textContent = item.title;
    if (modalDateVal) {
      modalDateVal.textContent = item.startDate === item.endDate
        ? item.startDate
        : `${item.startDate} ~ ${item.endDate}`;
    }
    if (modalLocVal) modalLocVal.textContent = `${item.region} · ${item.location}`;
    if (modalFeeVal) modalFeeVal.textContent = item.fee || '무료';
    if (modalSourceVal) modalSourceVal.textContent = item.sourceName || '공식 주최측';
    if (modalDescVal) modalDescVal.textContent = item.program || '상세 일정 및 프로그램 안내입니다.';

    if (modalOfficialBtn) {
      modalOfficialBtn.href = item.officialUrl || item.url || '#';
    }

    updateModalSaveButton(item.id);
    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    activeModalEvent = null;
  }

  // 8. 이벤트 리스너 등록
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      if (state.viewMonth === 1) {
        state.viewYear--;
        state.viewMonth = 12;
      } else {
        state.viewMonth--;
      }
      renderCalendarGrid();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      if (state.viewMonth === 12) {
        state.viewYear++;
        state.viewMonth = 1;
      } else {
        state.viewMonth++;
      }
      renderCalendarGrid();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      state.viewYear = tYear;
      state.viewMonth = tMonth;
      state.selectedDate = todayStr;
      renderCalendarGrid();
      renderDayTimeline(todayStr);
      renderOneDayRoute(todayStr);
      renderWeatherAndTips(todayStr);
    });
  }

  // 스코프 필터 탭 클릭
  scopeTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      scopeTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.scope = btn.dataset.scope || 'all';
      renderCalendarGrid();
      renderDayTimeline(state.selectedDate);
    });
  });

  // 지역 필터 칩 클릭
  regionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      regionChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.region = chip.dataset.region || 'all';
      renderCalendarGrid();
      renderDayTimeline(state.selectedDate);
    });
  });

  // 모달 닫기 버튼 및 백드롭 클릭
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  if (modalSaveToggleBtn) {
    modalSaveToggleBtn.addEventListener('click', () => {
      if (activeModalEvent) {
        toggleSave(activeModalEvent.id);
      }
    });
  }

  // 보관함 모달 또는 알림
  if (openSavedBtn) {
    openSavedBtn.addEventListener('click', () => {
      const count = state.savedIds.size;
      if (count === 0) {
        alert('보관함에 저장된 일정이 없습니다. 마음에 드는 축제 카드의 하트(♡)를 눌러 저장해보세요!');
      } else {
        alert(`현재 ${count}개의 일정이 보관함에 저장되어 있습니다.`);
      }
    });
  }

  // 키보드 ESC로 모달 닫기
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  // 9. 초기화 실행
  updateSavedBadge();
  renderCalendarGrid();
  renderDayTimeline(state.selectedDate);
  renderOneDayRoute(state.selectedDate);
  renderWeatherAndTips(state.selectedDate);

})();
