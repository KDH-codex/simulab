/**
 * 대한민국 연령별 인구와 초등생수 시뮬레이터 인터랙션 (app.js)
 * 
 * 주요 기능:
 * 1. 50개년 대칭형 인구 피라미드 애니메이션 및 지표(중위연령, 고령화율) 업데이트
 * 2. 54개년 초등학생 수 Canvas 시계열 꺾은선 차트 및 17개 시도별 테이블
 * 3. 출생연도 입력 기반 세대별 초등학교(국민학교) 교실 풍경 대조기
 */

import { POP_YEARS, REGIONAL_ELEMENTARY_2024, ELEMENTARY_HISTORY } from './data.js';
import { getPyramidByYear, matchMyGenerationSchool } from './logic.js';

// 연도별 마일스톤 문구
const MILESTONES = {
  1970: '전형적인 삼각형 피라미드 (유소년 인구 42% 폭발)',
  1980: '산아제한 정책 시작 및 청년층 팽창',
  1990: '종형(Bell-shaped) 전환 및 생산가능인구 정점',
  2000: '방추형(항아리) 전환 및 고령화사회(7%) 공식 진입',
  2010: '베이비붐 세대 은퇴 시작 및 유소년 감소',
  2020: '고령사회(14%) 돌파 및 대한민국 총인구 데드크로스',
  2024: '역삼각형 심화 · 초고령사회(20%) 목전 & 유소년 최저'
};

// 애플리케이션 상태
const state = {
  activeTab: 'pyramid',
  currentYearIndex: 6, // 기본값: 2024년 (마지막 인덱스)
  isPlaying: false,
  playTimer: null,
  myBirthYear: 1988
};

// DOM 요소 캐시
const elements = {
  // 탭
  tabButtons: document.querySelectorAll('.tool-tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),

  // 탭 1 (피라미드)
  yearSlider: document.getElementById('pop-year-slider'),
  sliderTicks: document.getElementById('pop-slider-ticks'),
  displayYear: document.getElementById('pop-display-year'),
  displayMilestone: document.getElementById('pop-display-milestone'),
  btnPlay: document.getElementById('btn-pop-play'),
  playIcon: document.getElementById('pop-play-icon'),
  playText: document.getElementById('pop-play-text'),
  popTotalVal: document.getElementById('pop-total-val'),
  popMedianVal: document.getElementById('pop-median-val'),
  popElderlyVal: document.getElementById('pop-elderly-val'),
  popYouthVal: document.getElementById('pop-youth-val'),
  pyramidRowsContainer: document.getElementById('pyramid-rows-container'),
  pyramidInsightFooter: document.getElementById('pyramid-insight-footer'),

  // 탭 2 (학교)
  schoolCanvas: document.getElementById('school-canvas'),
  regionalTbody: document.getElementById('regional-tbody'),

  // 탭 3 (내 세대)
  inputBirthYear: document.getElementById('input-birth-year'),
  birthTags: document.querySelectorAll('.quick-birth-tags .tag-btn'),
  myageResultCard: document.getElementById('myage-result-card')
};

/**
 * 초기화 진입점
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. 공통 헤더/푸터/면책조항 렌더링
  if (window.SimuLabUI) {
    window.SimuLabUI.renderHeader('stats', 'korean-population-pyramid');
    window.SimuLabUI.renderDisclaimer();
    window.SimuLabUI.renderFooter();
  }

  // 2. 슬라이더 틱 라벨 생성
  buildSliderTicks();

  // 3. 이벤트 바인딩
  initEventListeners();

  // 4. 초기 뷰 렌더링
  renderPyramid();
  renderSchoolTab();
  renderMyAgeResult();
});

/**
 * 슬라이더 눈금 생성
 */
function buildSliderTicks() {
  if (!elements.sliderTicks) return;
  elements.sliderTicks.innerHTML = POP_YEARS.map((yr, idx) => {
    return `<span class="tick-mark" data-idx="${idx}">'${String(yr).slice(2)}</span>`;
  }).join('');
}

/**
 * 이벤트 바인딩
 */
function initEventListeners() {
  // 1. 탭 전환
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // 2. 슬라이더 조작
  if (elements.yearSlider) {
    elements.yearSlider.addEventListener('input', (e) => {
      stopAutoPlay();
      state.currentYearIndex = parseInt(e.target.value, 10);
      renderPyramid();
    });
  }

  // 3. 자동 재생 토글
  if (elements.btnPlay) {
    elements.btnPlay.addEventListener('click', toggleAutoPlay);
  }

  // 4. 출생연도 입력
  if (elements.inputBirthYear) {
    elements.inputBirthYear.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 1988;
      state.myBirthYear = val;
      updateBirthTagsActive(val);
      renderMyAgeResult();
    });
  }

  // 5. 출생연도 퀵 태그
  elements.birthTags.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.birthTags.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const val = parseInt(btn.getAttribute('data-yr'), 10);
      state.myBirthYear = val;
      if (elements.inputBirthYear) elements.inputBirthYear.value = val;
      renderMyAgeResult();
    });
  });

  // 창 리사이즈 시 캔버스 다시 그리기
  window.addEventListener('resize', () => {
    if (state.activeTab === 'school') {
      drawSchoolCanvas();
    }
  });
}

/**
 * 탭 전환
 */
function switchTab(tabId) {
  state.activeTab = tabId;
  stopAutoPlay();

  elements.tabButtons.forEach(btn => {
    btn.classList.toggle('is-active', btn.getAttribute('data-tab') === tabId);
  });

  elements.tabPanels.forEach(panel => {
    panel.classList.toggle('is-active', panel.id === `tab-panel-${tabId}`);
  });

  if (tabId === 'school') {
    setTimeout(drawSchoolCanvas, 50);
  }
}

/**
 * 태그 버튼 활성화 업데이트
 */
function updateBirthTagsActive(yr) {
  elements.birthTags.forEach(btn => {
    const tagYr = parseInt(btn.getAttribute('data-yr'), 10);
    btn.classList.toggle('is-active', tagYr === yr);
  });
}

/**
 * 자동 재생 제어
 */
function toggleAutoPlay() {
  if (state.isPlaying) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
}

function startAutoPlay() {
  state.isPlaying = true;
  elements.btnPlay.classList.add('is-playing');
  elements.playIcon.textContent = '⏸';
  elements.playText.textContent = '일시 정지';

  if (state.currentYearIndex >= POP_YEARS.length - 1) {
    state.currentYearIndex = 0;
    if (elements.yearSlider) elements.yearSlider.value = 0;
    renderPyramid();
  }

  state.playTimer = setInterval(() => {
    if (state.currentYearIndex < POP_YEARS.length - 1) {
      state.currentYearIndex += 1;
      if (elements.yearSlider) elements.yearSlider.value = state.currentYearIndex;
      renderPyramid();
    } else {
      stopAutoPlay();
    }
  }, 1300);
}

function stopAutoPlay() {
  if (!state.isPlaying) return;
  state.isPlaying = false;
  if (state.playTimer) {
    clearInterval(state.playTimer);
    state.playTimer = null;
  }
  elements.btnPlay.classList.remove('is-playing');
  elements.playIcon.textContent = '▶';
  elements.playText.textContent = '자동 재생';
}

/**
 * 탭 1: 인구 피라미드 렌더링
 */
function renderPyramid() {
  const currentYear = POP_YEARS[state.currentYearIndex];
  const p = getPyramidByYear(currentYear);

  // 헤더 및 지표 갱신
  if (elements.displayYear) elements.displayYear.textContent = `${currentYear}년`;
  if (elements.displayMilestone) elements.displayMilestone.textContent = MILESTONES[currentYear] || '';

  if (elements.popTotalVal) elements.popTotalVal.textContent = `${p.totalPop.toLocaleString()}만 명`;
  if (elements.popMedianVal) elements.popMedianVal.textContent = `${p.medianAge}세`;
  if (elements.popElderlyVal) elements.popElderlyVal.textContent = `${p.elderlyRate}%`;
  if (elements.popYouthVal) elements.popYouthVal.textContent = `${p.youthRate}%`;

  // 피라미드 행 HTML 조립
  if (!elements.pyramidRowsContainer) return;

  const rowsHtml = p.rows.map(r => {
    return `
      <div class="pyramid-row">
        <!-- 좌측 남성 -->
        <div class="bar-side-male">
          <span class="val-label-male">${r.maleVal}만</span>
          <div class="track-male">
            <div class="fill-male" style="width: ${r.malePercent}%;"></div>
          </div>
        </div>

        <!-- 중앙 연령대 -->
        <div class="age-label-center">${r.ageGroup}</div>

        <!-- 우측 여성 -->
        <div class="bar-side-female">
          <div class="track-female">
            <div class="fill-female" style="width: ${r.femalePercent}%;"></div>
          </div>
          <span class="val-label-female">${r.femaleVal}만</span>
        </div>
      </div>
    `;
  }).join('');

  elements.pyramidRowsContainer.innerHTML = rowsHtml;

  if (elements.pyramidInsightFooter) {
    elements.pyramidInsightFooter.innerHTML = `
      <strong>💡 ${currentYear}년 인구 구조 인사이트:</strong> ${p.highlight}
      (중위연령 <strong>${p.medianAge}세</strong> · 65세 이상 고령자 <strong>${p.elderlyRate}%</strong>)
    `;
  }
}

/**
 * 탭 2: 초등학생 수 뷰 렌더링
 */
function renderSchoolTab() {
  // 1. 17개 시도별 테이블
  if (elements.regionalTbody) {
    elements.regionalTbody.innerHTML = REGIONAL_ELEMENTARY_2024.map((r, idx) => {
      return `
        <tr>
          <td><strong>${idx + 1}위</strong></td>
          <td><strong>${r.region}</strong></td>
          <td>${r.students.toLocaleString()}명</td>
          <td>${r.share}%</td>
          <td><strong style="color: #2563eb;">${r.classSize}명</strong></td>
        </tr>
      `;
    }).join('');
  }

  drawSchoolCanvas();
}

/**
 * 초등학생 수 Canvas 시계열 꺾은선 차트 렌더링
 */
function drawSchoolCanvas() {
  const canvas = elements.schoolCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 760;
  const height = 300;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 30, right: 35, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = 650; // 최대 650만 명 기준

  // y축 눈금선
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';

  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const val = (maxVal / gridSteps) * i;
    const y = padding.top + chartH - (val / maxVal) * chartH;

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();

    ctx.fillText(`${Math.round(val)}만`, padding.left - 8, y + 4);
  }

  // x축 좌표 매핑
  const xCoords = ELEMENTARY_HISTORY.map((_, idx) => {
    return padding.left + (chartW / (ELEMENTARY_HISTORY.length - 1)) * idx;
  });

  // x축 연도 표기
  ctx.textAlign = 'center';
  ELEMENTARY_HISTORY.forEach((h, idx) => {
    ctx.fillText(`'${String(h.year).slice(2)}`, xCoords[idx], height - padding.bottom + 18);
  });

  // 꺾은선 및 채우기 영역 그리기
  const points = ELEMENTARY_HISTORY.map((h, idx) => ({
    x: xCoords[idx],
    y: padding.top + chartH - (h.students / maxVal) * chartH
  }));

  // 영역 채우기 그라데이션
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, 'rgba(225, 29, 72, 0.25)');
  gradient.addColorStop(1, 'rgba(225, 29, 72, 0.01)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.lineTo(points[0].x, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // 선
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 3.2;
  ctx.stroke();

  // 점 및 라벨
  points.forEach((pt, idx) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#9f1239';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${ELEMENTARY_HISTORY[idx].students}만`, pt.x, pt.y - 10);
  });
}

/**
 * 탭 3: 내 세대 교실 풍경 대조 리포트
 */
function renderMyAgeResult() {
  if (!elements.myageResultCard) return;

  const info = matchMyGenerationSchool(state.myBirthYear);

  elements.myageResultCard.innerHTML = `
    <div class="era-badge" style="background: ${info.badgeColor};">
      ${info.eraTag}
    </div>

    <div class="contrast-grid">
      <div class="contrast-box">
        <div class="contrast-header">당시 나의 초등(국민)학교 시절 (${info.enterYear}년 입학)</div>
        <div class="contrast-main-num">${info.students.toLocaleString()}만 명</div>
        <div class="contrast-sub">학급당 학생 수: <strong>${info.classSize}명</strong> (${info.schoolName})</div>
      </div>

      <div class="contrast-box current-box">
        <div class="contrast-header">2024년 현재 초등학교 교실</div>
        <div class="contrast-main-num" style="color: #dc2626;">${info.latestStudents.toLocaleString()}만 명</div>
        <div class="contrast-sub">학급당 학생 수: <strong>${info.latestClassSize}명</strong> (초등학교)</div>
      </div>
    </div>

    <div class="contrast-story-box">
      <strong>🏫 세대별 교실 풍경 회상:</strong><br>
      당신이 <strong>${info.schoolName}</strong>에 입학하던 ${info.enterYear}년 무렵에는 전국에 무려 <strong>${info.students.toLocaleString()}만 명</strong>의 친구들이 함께 학교를 다녔으며, 한 반에 <strong>${info.classSize}명</strong>이 북적이던 시절이었습니다.<br>
      하지만 2024년 현재 초등학생 수는 <strong>${info.latestStudents.toLocaleString()}만 명</strong>으로 <strong>${info.studentRatio}배 감소</strong>했고, 한 반 학생 수도 <strong>${info.classDiff}명</strong>이나 줄어든 20명 수준입니다.<br>
      <small style="color: #475569; display: block; margin-top: 0.4rem;">* ${info.comment}</small>
    </div>
  `;
}
