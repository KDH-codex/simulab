/**
 * 전국 축제 & 가족 정보 통합 캘린더 인터랙티브 스크립트 (FESTA CALENDAR)
 * - scripts/build-calendar-page.mjs의 DOM ID/클래스와 100% 일치
 * - 대형 7열 와이드 캘린더 렌더링 및 주간/월간 전환
 * - 선택된 날짜의 4열 축제 카드 그리드 및 3단계 추천 연계 코스(One-Day Route) 동적 생성
 */

(function () {
  'use strict';

  const dataEl = document.getElementById('festa-data');
  if (!dataEl) return;

  let allItems = [];
  try {
    allItems = JSON.parse(dataEl.textContent || '[]');
  } catch (err) {
    console.error('캘린더 데이터 파싱 오류:', err);
    allItems = [];
  }

  // 한국 시간 오늘 날짜 (YYYY-MM-DD)
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  // 초기 선택 날짜: 오늘 이후 가장 일정이 풍성한 날짜 또는 오늘
  const [initY, initM] = todayStr.split('-').map(Number);

  const state = {
    year: initY,
    month: initM,
    selectedDate: todayStr,
    viewMode: 'month', // 'month' | 'week'
    scope: 'all',      // 'all' | 'festival' | 'culture' | 'benefit'
    region: 'all',
    savedIds: new Set(JSON.parse(localStorage.getItem('simulab_saved_festivals') || '[]'))
  };

  // DOM 요소 참조
  const monthHeadingEl = document.getElementById('calendar-month-heading');
  const seasonBadgeEl = document.getElementById('calendar-season-badge');
  const gridCellsEl = document.getElementById('calendar-grid-cells');
  const prevMonthBtn = document.getElementById('prev-month-btn');
  const nextMonthBtn = document.getElementById('next-month-btn');
  const jumpTodayBtn = document.getElementById('jump-today-btn');
  const jumpWeekendBtn = document.getElementById('jump-weekend-btn');

  const viewModeBtns = document.querySelectorAll('.cal-view-toggle button[data-view-mode]');
  const scopeBtns = document.querySelectorAll('.cal-chip[data-cal-scope]');
  const regionBtns = document.querySelectorAll('.cal-reg-pill[data-cal-region]');

  const selDayNumEl = document.getElementById('selected-day-num');
  const selDayTitleEl = document.getElementById('selected-day-title');
  const selDayBadgeEl = document.getElementById('selected-day-badge');
  const selDaySubtitleEl = document.getElementById('selected-day-subtitle');
  const selDayCardsEl = document.getElementById('selected-day-cards');
  const routeTitleEl = document.getElementById('route-card-title');
  const routeStepsEl = document.getElementById('selected-route-steps');

  const savedBadgeCountEl = document.getElementById('saved-badge-count');
  const openSavedBtn = document.getElementById('open-saved-btn');
  const savedDialog = document.getElementById('saved-dialog');
  const closeSavedBtn = document.getElementById('close-saved-btn');
  const savedListEl = document.getElementById('saved-list');

  const quickModal = document.getElementById('quick-preview-modal');
  const quickModalContent = document.getElementById('quick-modal-content');

  // 테마별 바 색상 매핑
  function getBarColorClass(item) {
    if (item.theme === 'light') return 'bar-indigo';
    if (item.theme === 'food') return 'bar-amber';
    if (item.theme === 'nature') return 'bar-emerald';
    if (item.scope === 'culture') return 'bar-sky';
    return 'bar-green';
  }

  // 특정 날짜에 해당 일정이 열리는지 판별
  function matchesFilterAndDate(item, dateStr) {
    if (state.scope !== 'all' && item.scope !== state.scope) return false;
    if (state.region !== 'all' && item.region !== state.region && item.region !== '전국') return false;

    if (item.dates && item.dates.length > 0) {
      return item.dates.includes(dateStr);
    }
    return dateStr >= item.startDate && dateStr <= item.endDate;
  }

  // 보관함 배지 업데이트
  function updateSavedCount() {
    if (savedBadgeCountEl) {
      savedBadgeCountEl.textContent = String(state.savedIds.size);
    }
  }

  function toggleSave(id) {
    if (state.savedIds.has(id)) {
      state.savedIds.delete(id);
    } else {
      state.savedIds.add(id);
    }
    localStorage.setItem('simulab_saved_festivals', JSON.stringify([...state.savedIds]));
    updateSavedCount();
    renderSelectedDaySection(state.selectedDate);
  }

  // 1. 대형 와이드 캘린더 그리드 렌더링
  function renderCalendarGrid() {
    if (!gridCellsEl) return;
    const { year, month, viewMode, selectedDate } = state;

    if (monthHeadingEl) {
      monthHeadingEl.textContent = `${year}년 ${month}월`;
    }

    const seasonNames = {
      1: 'WINTER FESTIVAL', 2: 'WINTER FESTIVAL', 3: 'SPRING BLOSSOM',
      4: 'SPRING FESTIVAL', 5: 'MAY FESTIVAL SEASON', 6: 'EARLY SUMMER FESTA',
      7: 'SUMMER VACATION', 8: 'MIDSUMMER NIGHT', 9: 'AUTUMN HARVEST',
      10: 'AUTUMN FESTA SEASON', 11: 'LATE AUTUMN CULTURE', 12: 'YEAR-END LIGHTS'
    };
    if (seasonBadgeEl) {
      seasonBadgeEl.textContent = seasonNames[month] || 'FESTIVAL SEASON';
    }

    gridCellsEl.innerHTML = '';
    gridCellsEl.classList.toggle('week-mode', viewMode === 'week');

    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();

    const cellsData = [];

    // 이전 달 날짜 채우기
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const pm = month === 1 ? 12 : month - 1;
      const py = month === 1 ? year - 1 : year;
      const dateStr = `${py}-${String(pm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cellsData.push({ dateStr, dayNum: d, isOtherMonth: true });
    }

    // 이번 달 날짜 채우기
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cellsData.push({ dateStr, dayNum: d, isOtherMonth: false });
    }

    // 다음 달 날짜 채우기 (7배수 맞춤)
    const remainder = (7 - (cellsData.length % 7)) % 7;
    for (let d = 1; d <= remainder; d++) {
      const nm = month === 12 ? 1 : month + 1;
      const ny = month === 12 ? year + 1 : year;
      const dateStr = `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cellsData.push({ dateStr, dayNum: d, isOtherMonth: true });
    }

    // 주간 모드일 경우 선택된 날짜가 포함된 주(7일)만 필터링
    let visibleCells = cellsData;
    if (viewMode === 'week') {
      const idx = cellsData.findIndex(c => c.dateStr === selectedDate);
      if (idx !== -1) {
        const weekStart = Math.floor(idx / 7) * 7;
        visibleCells = cellsData.slice(weekStart, weekStart + 7);
      } else {
        visibleCells = cellsData.slice(0, 7);
      }
    }

    visibleCells.forEach(cellInfo => {
      const { dateStr, dayNum, isOtherMonth } = cellInfo;
      const dayOfWeek = new Date(dateStr).getDay();
      const dayEvents = allItems.filter(item => matchesFilterAndDate(item, dateStr));

      const cellEl = document.createElement('div');
      cellEl.className = 'cal-cell';
      if (isOtherMonth) cellEl.classList.add('is-other-month');
      if (dateStr === todayStr) cellEl.classList.add('is-today');
      if (dateStr === state.selectedDate) cellEl.classList.add('is-selected');
      if (dayOfWeek === 0) cellEl.classList.add('is-sun');
      if (dayOfWeek === 6) cellEl.classList.add('is-sat');

      // 상단 일자 번호 & 건수 배지
      const headEl = document.createElement('div');
      headEl.className = 'cal-cell-head';

      const numSpan = document.createElement('span');
      numSpan.className = 'cal-cell-daynum';
      numSpan.textContent = String(dayNum);
      headEl.appendChild(numSpan);

      if (dayEvents.length > 0) {
        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'cal-cell-badge';
        badgeSpan.textContent = `${dayEvents.length}건`;
        headEl.appendChild(badgeSpan);
      }
      cellEl.appendChild(headEl);

      // 이벤트 바 목록 (최대 3개 표시 후 +N 더보기)
      if (dayEvents.length > 0) {
        const eventsWrap = document.createElement('div');
        eventsWrap.className = 'cal-cell-events';

        dayEvents.slice(0, 3).forEach(ev => {
          const bar = document.createElement('div');
          bar.className = `cal-event-bar ${getBarColorClass(ev)}`;
          const prefix = ev.region ? `[${ev.region}] ` : '';
          bar.textContent = `${prefix}${ev.shortLabel || ev.title}`;
          eventsWrap.appendChild(bar);
        });

        if (dayEvents.length > 3) {
          const more = document.createElement('div');
          more.className = 'cal-cell-more';
          more.textContent = `+${dayEvents.length - 3}개 일정 더보기`;
          eventsWrap.appendChild(more);
        }

        cellEl.appendChild(eventsWrap);
      }

      cellEl.addEventListener('click', () => {
        state.selectedDate = dateStr;
        const [cy, cm] = dateStr.split('-').map(Number);
        state.year = cy;
        state.month = cm;
        renderCalendarGrid();
        renderSelectedDaySection(dateStr);
      });

      gridCellsEl.appendChild(cellEl);
    });
  }

  // 2. 선택된 날짜의 하단 축제 타임라인 4열 카드 & 추천 1일 코스 렌더링
  function renderSelectedDaySection(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const wk = weekdayNames[new Date(y, m - 1, d).getDay()];

    const dayEvents = allItems.filter(item => matchesFilterAndDate(item, dateStr));

    if (selDayNumEl) selDayNumEl.textContent = String(d);
    if (selDayTitleEl) selDayTitleEl.textContent = `${m}월 ${d}일 (${wk}) 축제 타임라인 & 큐레이션`;
    if (selDayBadgeEl) selDayBadgeEl.textContent = `총 ${dayEvents.length}개 일정 진행`;
    if (selDaySubtitleEl) {
      selDaySubtitleEl.textContent = dayEvents.length > 0
        ? `선택하신 ${m}월 ${d}일에 진행되는 전국 공식 축제 및 가족 체험·공연 일정입니다.`
        : `선택하신 날짜에 조건에 맞는 일정이 없습니다. 다른 날짜나 전체 지역을 선택해 보세요.`;
    }

    // 4열 카드 그리드 렌더링
    if (selDayCardsEl) {
      selDayCardsEl.innerHTML = '';

      if (dayEvents.length === 0) {
        selDayCardsEl.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748b;">
            <p style="font-size: 1.05rem; font-weight: 800; margin: 0 0 0.4rem;">선택하신 날짜(${m}월 ${d}일)에 해당하는 일정이 없습니다.</p>
            <p style="font-size: 0.88rem; margin: 0;">상단 필터를 [전체보기] 또는 [전체 지역]으로 변경하거나 다른 날짜를 클릭해 보세요.</p>
          </div>
        `;
      } else {
        dayEvents.slice(0, 12).forEach(ev => {
          const isSaved = state.savedIds.has(ev.id);
          const card = document.createElement('article');
          card.className = 'cal-festa-card';

          const thumbHtml = ev.image && ev.image.src
            ? `<img src="${ev.image.src}" alt="${ev.title}" loading="lazy">`
            : `<span class="cal-card-thumb-fallback">${ev.scope === 'festival' ? '🎆' : '🎨'}</span>`;

          card.innerHTML = `
            <div class="cal-card-thumb">
              ${thumbHtml}
              <div class="cal-card-top-badges">
                <span class="cal-card-cat-tag">${ev.categoryLabel || '축제·행사'}</span>
                <button type="button" class="cal-card-save-btn ${isSaved ? 'is-saved' : ''}" data-save-id="${ev.id}" aria-label="일정 보관함 저장">
                  ${isSaved ? '♥' : '♡'}
                </button>
              </div>
            </div>
            <div class="cal-card-body">
              <span class="cal-card-highlight">★ ${ev.region} · ${ev.fee || '무료 관람'}</span>
              <h4 class="cal-card-title">${ev.title}</h4>
              <p class="cal-card-loc">📍 ${ev.location}</p>
              <div class="cal-card-meta-box">
                <span>🗓 기간: ${ev.startDate.slice(5)} ~ ${ev.endDate.slice(5)}</span>
                <span>⏰ 안내: ${(ev.program || ev.time || '공식 홈페이지 참조').slice(0, 32)}</span>
              </div>
            </div>
            <div class="cal-card-actions">
              <a class="cal-card-btn-map" href="/map/">📍 내주변 지도에서 위치보기</a>
              <button type="button" class="cal-card-btn-detail" data-detail-id="${ev.id}">상세 조건·공식 안내 보기 ↗</button>
            </div>
          `;

          const saveBtn = card.querySelector('[data-save-id]');
          if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              toggleSave(ev.id);
            });
          }

          const detailBtn = card.querySelector('[data-detail-id]');
          if (detailBtn) {
            detailBtn.addEventListener('click', () => openQuickModal(ev));
          }

          selDayCardsEl.appendChild(card);
        });
      }
    }

    // 3단계 추천 연계 코스 (One-Day Festa Route) 렌더링
    if (routeTitleEl) {
      routeTitleEl.textContent = `${m}/${d}(${wk.slice(0, 1)}) 추천 연계 코스 (One-Day Festa Route)`;
    }
    if (routeStepsEl) {
      routeStepsEl.innerHTML = '';
      const picks = dayEvents.slice(0, 3);
      const stepLabels = ['STEP 01 · 13:00', 'STEP 02 · 16:30', 'STEP 03 · 19:30'];
      const defaultSteps = [
        { title: '로컬 플리마켓 & 공원 산책', desc: '오후 햇살 아래 여유롭게 수공예 마켓과 산책로를 둘러보며 기념품을 구경하세요.', foot: '🚶 도보 또는 대중교통 이동 권장' },
        { title: '야외 버스킹 & 문화 체험', desc: '노을 지는 광장에서 라이브 음악 공연이나 가족 참여형 체험 부스를 즐겨보세요.', foot: '🎵 메인 무대 앞 피크닉존' },
        { title: '야간 경관 조명 & 미식 투어', desc: '선선한 저녁 바람과 함께 푸드트럭 먹거리와 화려한 야경을 감상하며 마무리하세요.', foot: '✨ 21:30경 행사 종료' }
      ];

      for (let i = 0; i < 3; i++) {
        const ev = picks[i];
        const stepDiv = document.createElement('div');
        stepDiv.className = 'cal-step-card';
        stepDiv.innerHTML = `
          <span class="cal-step-badge">${stepLabels[i]}</span>
          <h5 class="cal-step-title">${ev ? ev.title : defaultSteps[i].title}</h5>
          <p class="cal-step-desc">${ev ? (ev.program || ev.curatorTip || defaultSteps[i].desc) : defaultSteps[i].desc}</p>
          <span class="cal-step-foot">${ev ? `📍 ${ev.region} · ${ev.location}` : defaultSteps[i].foot}</span>
        `;
        routeStepsEl.appendChild(stepDiv);
      }
    }
  }

  // 3. 상세 모달 열기
  function openQuickModal(ev) {
    if (!quickModal || !quickModalContent) return;
    quickModalContent.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
        <div>
          <span style="font-size:0.76rem; font-weight:800; color:#ff5a1f; background:#fff4ed; padding:0.2rem 0.55rem; border-radius:6px;">${ev.categoryLabel || '공식 일정'}</span>
          <h3 id="quick-modal-title" style="margin:0.4rem 0 0; font-size:1.3rem; font-weight:900; color:#0f172a;">${ev.title}</h3>
        </div>
        <button type="button" id="close-quick-modal-btn" style="border:none; background:#f1f5f9; width:32px; height:32px; border-radius:999px; font-size:1.1rem;">✕</button>
      </div>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1rem; margin-bottom:1rem; font-size:0.88rem; display:flex; flex-direction:column; gap:0.45rem;">
        <div><strong>📍 장소:</strong> ${ev.region} · ${ev.location}</div>
        <div><strong>🗓 기간:</strong> ${ev.startDate} ~ ${ev.endDate}</div>
        <div><strong>💰 요금:</strong> ${ev.fee || '무료 관람'}</div>
        <div><strong>🏛 출처:</strong> ${ev.sourceName || '공식 주최기관'} (확인일: ${ev.checkedAt || todayStr})</div>
      </div>
      <p style="font-size:0.9rem; color:#334155; line-height:1.55; margin:0 0 1.25rem;">
        ${ev.program || ev.curatorTip || '상세 운영 시간과 예약 조건은 아래 공식 안내 페이지에서 확인하실 수 있습니다.'}
      </p>
      <div style="display:flex; gap:0.65rem;">
        <a href="${ev.officialUrl || ev.url}" target="_blank" rel="noopener noreferrer" style="flex:1; text-align:center; background:#ff5a1f; color:#fff; font-weight:800; padding:0.75rem; border-radius:10px;">
          공식 안내 원문 바로가기 ↗
        </a>
        <a href="${ev.url}" style="flex:1; text-align:center; background:#eef2ff; color:#4f46e5; font-weight:800; padding:0.75rem; border-radius:10px;">
          시뮬랩 상세 페이지 →
        </a>
      </div>
    `;
    const closeBtn = document.getElementById('close-quick-modal-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => quickModal.close());
    quickModal.showModal();
  }

  // 4. 이벤트 리스너 연결
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      if (state.month === 1) { state.year--; state.month = 12; }
      else { state.month--; }
      renderCalendarGrid();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      if (state.month === 12) { state.year++; state.month = 1; }
      else { state.month++; }
      renderCalendarGrid();
    });
  }

  if (jumpTodayBtn) {
    jumpTodayBtn.addEventListener('click', () => {
      const [ty, tm] = todayStr.split('-').map(Number);
      state.year = ty;
      state.month = tm;
      state.selectedDate = todayStr;
      renderCalendarGrid();
      renderSelectedDaySection(todayStr);
    });
  }

  if (jumpWeekendBtn) {
    jumpWeekendBtn.addEventListener('click', () => {
      const dObj = new Date(todayStr);
      const day = dObj.getDay();
      const diffToSat = (6 - day + 7) % 7;
      dObj.setDate(dObj.getDate() + diffToSat);
      const satStr = dObj.toISOString().slice(0, 10);
      const [sy, sm] = satStr.split('-').map(Number);
      state.year = sy;
      state.month = sm;
      state.selectedDate = satStr;
      renderCalendarGrid();
      renderSelectedDaySection(satStr);
    });
  }

  viewModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewModeBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      state.viewMode = btn.dataset.viewMode || 'month';
      renderCalendarGrid();
    });
  });

  scopeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scopeBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      state.scope = btn.dataset.calScope || 'all';
      renderCalendarGrid();
      renderSelectedDaySection(state.selectedDate);
    });
  });

  regionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      regionBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      state.region = btn.dataset.calRegion || 'all';
      renderCalendarGrid();
      renderSelectedDaySection(state.selectedDate);
    });
  });

  if (openSavedBtn && savedDialog) {
    openSavedBtn.addEventListener('click', () => {
      if (savedListEl) {
        const savedEvents = allItems.filter(i => state.savedIds.has(i.id));
        savedListEl.innerHTML = savedEvents.length === 0
          ? `<p style="color:#64748b; text-align:center; padding:2rem 0;">아직 보관함에 저장한 일정이 없습니다. 카드 우측 상단의 ♡ 버튼을 눌러 저장해 보세요.</p>`
          : savedEvents.map(ev => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0; border-bottom:1px solid #f1f5f9;">
                <div>
                  <strong style="font-size:0.95rem; color:#0f172a;">${ev.title}</strong>
                  <div style="font-size:0.8rem; color:#64748b;">📍 ${ev.region} · ${ev.startDate} ~ ${ev.endDate}</div>
                </div>
                <a href="${ev.officialUrl || ev.url}" target="_blank" rel="noopener" style="font-size:0.82rem; font-weight:800; color:#ff5a1f;">바로가기 ↗</a>
              </div>
            `).join('');
      }
      savedDialog.showModal();
    });
  }

  if (closeSavedBtn && savedDialog) {
    closeSavedBtn.addEventListener('click', () => savedDialog.close());
  }

  // 초기 실행
  updateSavedCount();
  renderCalendarGrid();
  renderSelectedDaySection(state.selectedDate);
})();
