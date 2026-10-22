/**
 * ==========================================================================
 * [라이프·일상생활] 🎪 아이와 가볼만한 곳 축제/행사 달력 UI 컨트롤러 (app.js)
 * --------------------------------------------------------------------------
 * 1. 월~일 기준 7열 월간 캘린더 생성
 * 2. 지역별(서울·경기 메인, 전국 도 단위) 축제 실시간 필터링
 * 3. 마우스 호버 시 장소 & 주요 프로그램 커스텀 툴팁
 * 4. 축제 바/카드 클릭 시 공식 안내 홈페이지 새 창 연결
 * 5. 선택 일자 상세 가족 축제 카드 렌더링
 * ==========================================================================
 */

import { KidsOutingLogic } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. 상태 변수 정의
  // --------------------------------------------------------------------------
  let currentYear = 2026;
  let currentMonth = 10; // 기본 10월
  let currentRegion = '전체'; // 기본 전체 지역
  let selectedDate = '2026-10-24'; // 기본 선택일 (주말 대표 축제)

  // --------------------------------------------------------------------------
  // 2. DOM 요소 참조
  // --------------------------------------------------------------------------
  const regionChips = document.querySelectorAll('.region-chip-btn');
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  const btnNextMonth = document.getElementById('btnNextMonth');
  const currentMonthHeading = document.getElementById('currentMonthHeading');
  const monthSubCaption = document.getElementById('monthSubCaption');
  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const selectedDateCount = document.getElementById('selectedDateCount');
  const festivalCardsGrid = document.getElementById('festivalCardsGrid');
  const kidsFloatingTooltip = document.getElementById('kidsFloatingTooltip');

  // --------------------------------------------------------------------------
  // 3. 월간 달력 렌더링 엔진 (월~일 기준 정렬)
  // --------------------------------------------------------------------------
  function renderCalendar() {
    if (!calendarDaysGrid) return;

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

    // 날짜 계산 (월~일 기준)
    // JS getDay(): 0(일), 1(월), 2(화), 3(수), 4(목), 5(금), 6(토)
    // 월=0, 화=1, ..., 일=6 변환 공식: (day + 6) % 7
    const firstDayObj = new Date(currentYear, currentMonth - 1, 1);
    const startWeekdayOffset = (firstDayObj.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();

    calendarDaysGrid.innerHTML = '';

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
      calendarDaysGrid.appendChild(cell);
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

      // 해당 일자에 열리는 축제 목록 조회
      const events = KidsOutingLogic.getEventsOnDate(dateStr, currentRegion);

      let eventsHtml = '';
      if (events.length > 0) {
        eventsHtml = `<div class="cell-events-list">`;
        events.slice(0, 3).forEach(ev => {
          eventsHtml += `
            <span class="cal-event-bar bar-${ev.tagColor}"
                  data-title="${ev.title}"
                  data-period="${ev.periodText}"
                  data-location="${ev.location}"
                  data-program="${ev.program}"
                  data-link="${ev.link}"
                  data-icon="${ev.icon}">
              ${ev.icon} ${ev.title}
            </span>
          `;
        });
        if (events.length > 3) {
          eventsHtml += `
            <span style="font-size:0.65rem; color:#64748b; font-weight:800; text-align:right;">
              +${events.length - 3}개 더보기
            </span>
          `;
        }
        eventsHtml += `</div>`;
      }

      cell.innerHTML = `
        <div class="cell-header">
          <span class="cell-date-num">${d}</span>
          ${events.length > 0 ? `<span style="font-size:0.68rem; color:#3b82f6; font-weight:850;">${events.length}개</span>` : ''}
        </div>
        ${eventsHtml}
      `;

      // 날짜 셀 클릭 시
      cell.addEventListener('click', () => {
        document.querySelectorAll('.kids-day-cell').forEach(c => c.classList.remove('is-selected'));
        cell.classList.add('is-selected');
        selectedDate = dateStr;
        renderDetailCards(dateStr);
      });

      // 축제 바 호버 & 클릭 리스너 연결
      const bars = cell.querySelectorAll('.cal-event-bar');
      bars.forEach(bar => {
        bar.addEventListener('mouseenter', (e) => {
          showTooltip(e, {
            title: bar.getAttribute('data-title'),
            period: bar.getAttribute('data-period'),
            location: bar.getAttribute('data-location'),
            program: bar.getAttribute('data-program'),
            icon: bar.getAttribute('data-icon')
          });
        });

        bar.addEventListener('mousemove', (e) => {
          moveTooltip(e);
        });

        bar.addEventListener('mouseleave', () => {
          hideTooltip();
        });

        bar.addEventListener('click', (e) => {
          e.stopPropagation();
          const link = bar.getAttribute('data-link');
          const title = bar.getAttribute('data-title');
          if (link) {
            window.open(link, '_blank');
            if (window.SimuLabTracker && window.SimuLabTracker.trackEvent) {
              window.SimuLabTracker.trackEvent('click_festival_bar', title);
            }
          }
        });
      });

      calendarDaysGrid.appendChild(cell);
    }

    // 3) 다음 달 앞선 일자 셀 채우기 (7열 그리드 마감)
    const totalCells = startWeekdayOffset + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let nextD = 1; nextD <= remaining; nextD++) {
      const cell = document.createElement('div');
      cell.className = 'kids-day-cell other-month';
      cell.innerHTML = `
        <div class="cell-header">
          <span class="cell-date-num">${nextD}</span>
        </div>
      `;
      calendarDaysGrid.appendChild(cell);
    }

    // 하단 상세 목록 초기 렌더링
    renderDetailCards(selectedDate);
  }

  // --------------------------------------------------------------------------
  // 4. 하단 선택 일자 상세 카드 렌더링
  // --------------------------------------------------------------------------
  function renderDetailCards(dateStr) {
    if (!festivalCardsGrid) return;

    const [y, m, d] = dateStr.split('-');
    const weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dayOfWeek = weekdayNames[dObj.getDay()];

    if (selectedDateTitle) {
      selectedDateTitle.textContent = `📌 ${parseInt(m)}월 ${parseInt(d)}일(${dayOfWeek}) 열리는 가족 축제 & 행사`;
    }

    const events = KidsOutingLogic.getEventsOnDate(dateStr, currentRegion);
    if (selectedDateCount) {
      selectedDateCount.textContent = `총 ${events.length}개`;
    }

    festivalCardsGrid.innerHTML = '';

    if (events.length === 0) {
      festivalCardsGrid.innerHTML = `
        <div class="fc-empty-state">
          <div style="font-size:2.2rem; margin-bottom:0.4rem;">🎪</div>
          <strong style="font-size:0.95rem; color:#1e293b; display:block; margin-bottom:0.25rem;">
            선택하신 날짜에는 [${currentRegion}] 지역에 예정된 축제가 없습니다.
          </strong>
          <p style="font-size:0.82rem; margin:0;">
            달력에서 알록달록한 축제 바가 있는 주말 날짜(예: 10월 24일, 25일 등)를 클릭해보세요!
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
          <h4 class="fc-title">${ev.icon} ${ev.title}</h4>
          <div class="fc-period">🗓️ 기간: ${ev.periodText}</div>
          <div class="fc-row">
            <strong>📍 장소:</strong> ${ev.location}
          </div>
          <div class="fc-row">
            <strong>🎈 주요 프로그램:</strong> ${ev.program}
          </div>
          <p class="fc-desc">${ev.desc}</p>
        </div>
        <a href="${ev.link}" target="_blank" rel="noopener noreferrer" class="fc-link-btn">
          공식 안내 홈페이지 바로가기 ↗
        </a>
      `;

      card.querySelector('.fc-link-btn').addEventListener('click', () => {
        if (window.SimuLabTracker && window.SimuLabTracker.trackEvent) {
          window.SimuLabTracker.trackEvent('click_festival_card_link', ev.title);
        }
      });

      festivalCardsGrid.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // 5. 커스텀 툴팁 제어
  // --------------------------------------------------------------------------
  function showTooltip(e, data) {
    if (!kidsFloatingTooltip) return;
    kidsFloatingTooltip.innerHTML = `
      <div class="tt-header">${data.icon || '🎪'} ${data.title}</div>
      <div class="tt-line"><strong>🗓️ 기간:</strong> ${data.period}</div>
      <div class="tt-line"><strong>📍 장소:</strong> ${data.location}</div>
      <div class="tt-line"><strong>🎈 프로그램:</strong> ${data.program}</div>
      <div class="tt-cta">👉 클릭 시 공식 사이트로 이동합니다!</div>
    `;
    kidsFloatingTooltip.classList.add('show');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    if (!kidsFloatingTooltip) return;
    kidsFloatingTooltip.style.left = `${e.clientX}px`;
    kidsFloatingTooltip.style.top = `${e.clientY}px`;
  }

  function hideTooltip() {
    if (!kidsFloatingTooltip) return;
    kidsFloatingTooltip.classList.remove('show');
  }

  // --------------------------------------------------------------------------
  // 6. 이벤트 리스너 바인딩 (지역 필터 & 월 이동)
  // --------------------------------------------------------------------------
  regionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      regionChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentRegion = chip.getAttribute('data-region');
      renderCalendar();

      if (window.SimuLabTracker && window.SimuLabTracker.trackEvent) {
        window.SimuLabTracker.trackEvent('filter_kids_region', currentRegion);
      }
    });
  });

  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
      currentMonth = 10;
      selectedDate = `${currentYear}-10-24`;
      renderCalendar();
    });
  }

  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      currentMonth = 11;
      selectedDate = `${currentYear}-11-07`;
      renderCalendar();
    });
  }

  // --------------------------------------------------------------------------
  // 7. 최초 실행
  // --------------------------------------------------------------------------
  renderCalendar();
});
