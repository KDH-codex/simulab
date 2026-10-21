/**
 * 세계 20개국 소득 순위변화 시뮬레이터 인터랙션 (app.js)
 * 
 * 주요 기능:
 * 1. 30년 랭킹 레이스 바 차트 및 타임 슬라이더/자동 재생 애니메이션
 * 2. 한국 vs 타 국가 1:1 맞대결 시계열 꺾은선 캔버스 차트 렌더링
 * 3. 내 연봉 달러 환산 및 20개국 1인당 소득 벤치마킹
 */

import { YEARS, COUNTRIES } from './data.js';
import { getRankingsByYear, compareTwoCountries, benchmarkMySalary } from './logic.js';

// 연도별 역사적 마일스톤 문구
const YEAR_MILESTONES = {
  1990: '냉전 종식 직후 (한국 개도국 도약기)',
  1995: '1인당 소득 1만 달러 돌파 (OECD 가입)',
  2000: 'IMF 외환위기 조기 극복 및 IT 벤처 붐',
  2005: '제조업 르네상스 및 1인당 2만 달러 목전',
  2010: '2만 달러 안착 및 글로벌 금융위기 선방',
  2015: '세계 10대 경제규모 진입 가시권',
  2020: '코로나19 팬데믹 및 K-수출 호조',
  2022: '글로벌 인플레이션 및 고환율 격변기',
  2024: '사상 최초 한일 1인당 소득 역전 (선진국 안착)'
};

// 애플리케이션 상태 (State)
const state = {
  activeTab: 'race',
  currentYearIndex: 8, // 기본값: 2024년 (마지막 인덱스)
  raceMetric: 'gniTotal', // 'gniTotal' 또는 'gniPerCapita'
  isPlaying: false,
  playTimer: null,
  compareTarget: 'JPN',
  compareMetric: 'gniPerCapita',
  mySalaryManwon: 5000
};

// DOM 요소 캐시
const elements = {
  // 탭
  tabButtons: document.querySelectorAll('.tool-tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),

  // 레이스
  metricButtons: document.querySelectorAll('.metric-btn'),
  yearSlider: document.getElementById('year-slider'),
  sliderTicks: document.getElementById('slider-ticks'),
  displayYear: document.getElementById('display-year'),
  displayMilestone: document.getElementById('display-milestone'),
  btnPlayPause: document.getElementById('btn-play-pause'),
  playIcon: document.getElementById('play-icon'),
  playText: document.getElementById('play-text'),
  chartMainTitle: document.getElementById('chart-main-title'),
  chartSubTitle: document.getElementById('chart-sub-title'),
  koreaRankText: document.getElementById('korea-rank-text'),
  raceBarsContainer: document.getElementById('race-bars-container'),

  // 1:1 비교
  compareSelect: document.getElementById('compare-country-select'),
  compareMetricBtns: document.querySelectorAll('.compare-metric-btn'),
  summaryKorVal: document.getElementById('summary-kor-val'),
  summaryKorGrowth: document.getElementById('summary-kor-growth'),
  summaryTargetFlag: document.getElementById('summary-target-flag'),
  summaryTargetName: document.getElementById('summary-target-name'),
  summaryTargetVal: document.getElementById('summary-target-val'),
  summaryTargetGrowth: document.getElementById('summary-target-growth'),
  compareInsightBox: document.getElementById('compare-insight-box'),
  lineChartTitle: document.getElementById('line-chart-title'),
  legendTargetName: document.getElementById('legend-target-name'),
  compareCanvas: document.getElementById('compare-line-canvas'),

  // 내 연봉
  inputSalary: document.getElementById('input-my-salary'),
  salaryTags: document.querySelectorAll('.quick-salary-tags .tag-btn'),
  salaryResultCard: document.getElementById('salary-result-card')
};

/**
 * 초기화 진입점
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. 공통 헤더/푸터 렌더링
  if (window.SimuLabUI) {
    window.SimuLabUI.renderHeader('stats', 'world-gni-ranking-race');
    window.SimuLabUI.renderDisclaimer();
    window.SimuLabUI.renderFooter();
  }

  // 2. 슬라이더 틱(연도 라벨) 생성
  buildSliderTicks();

  // 3. 이벤트 바인딩
  initEventListeners();

  // 4. 초기 뷰 렌더링
  renderRaceBars();
  renderCompareView();
  renderSalaryResult();
});

/**
 * 슬라이더 눈금 생성
 */
function buildSliderTicks() {
  if (!elements.sliderTicks) return;
  elements.sliderTicks.innerHTML = YEARS.map((yr, idx) => {
    return `<span class="tick-mark" data-idx="${idx}">'${String(yr).slice(2)}</span>`;
  }).join('');
}

/**
 * 이벤트 리스너 등록
 */
function initEventListeners() {
  // 1. 탭 전환
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // 2. 레이스 지표 변경 (총 GNI vs 1인당 GNI)
  elements.metricButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.metricButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.raceMetric = btn.getAttribute('data-metric');
      renderRaceBars();
    });
  });

  // 3. 연도 슬라이더 조작
  if (elements.yearSlider) {
    elements.yearSlider.addEventListener('input', (e) => {
      stopAutoPlay();
      state.currentYearIndex = parseInt(e.target.value, 10);
      renderRaceBars();
    });
  }

  // 4. 자동 재생 버튼 클릭
  if (elements.btnPlayPause) {
    elements.btnPlayPause.addEventListener('click', toggleAutoPlay);
  }

  // 5. 1:1 비교 국가 선택
  if (elements.compareSelect) {
    elements.compareSelect.addEventListener('change', (e) => {
      state.compareTarget = e.target.value;
      renderCompareView();
    });
  }

  // 6. 1:1 비교 지표 변경
  elements.compareMetricBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.compareMetricBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.compareMetric = btn.getAttribute('data-metric');
      renderCompareView();
    });
  });

  // 7. 내 연봉 입력
  if (elements.inputSalary) {
    elements.inputSalary.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 5000;
      state.mySalaryManwon = val;
      updateSalaryTagsActive(val);
      renderSalaryResult();
    });
  }

  // 8. 내 연봉 퀵 태그 버튼
  elements.salaryTags.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.salaryTags.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const val = parseInt(btn.getAttribute('data-val'), 10);
      state.mySalaryManwon = val;
      if (elements.inputSalary) elements.inputSalary.value = val;
      renderSalaryResult();
    });
  });

  // 윈도우 리사이즈 시 캔버스 다시 그리기
  window.addEventListener('resize', () => {
    if (state.activeTab === 'compare') {
      drawCompareCanvas();
    }
  });
}

/**
 * 탭 전환 함수
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

  if (tabId === 'compare') {
    // 캔버스 렌더링 지연 호출
    setTimeout(drawCompareCanvas, 50);
  }
}

/**
 * 연봉 태그 활성화 표시 업데이트
 */
function updateSalaryTagsActive(val) {
  elements.salaryTags.forEach(btn => {
    const tagVal = parseInt(btn.getAttribute('data-val'), 10);
    btn.classList.toggle('is-active', tagVal === val);
  });
}

/**
 * 랭킹 레이스 자동 재생 토글
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
  elements.btnPlayPause.classList.add('is-playing');
  elements.playIcon.textContent = '⏸';
  elements.playText.textContent = '일시 정지';

  // 만약 마지막 연도에 도달해 있다면 1990년(인덱스 0)부터 다시 시작
  if (state.currentYearIndex >= YEARS.length - 1) {
    state.currentYearIndex = 0;
    if (elements.yearSlider) elements.yearSlider.value = 0;
    renderRaceBars();
  }

  state.playTimer = setInterval(() => {
    if (state.currentYearIndex < YEARS.length - 1) {
      state.currentYearIndex += 1;
      if (elements.yearSlider) elements.yearSlider.value = state.currentYearIndex;
      renderRaceBars();
    } else {
      stopAutoPlay();
    }
  }, 1200);
}

function stopAutoPlay() {
  if (!state.isPlaying) return;
  state.isPlaying = false;
  if (state.playTimer) {
    clearInterval(state.playTimer);
    state.playTimer = null;
  }
  elements.btnPlayPause.classList.remove('is-playing');
  elements.playIcon.textContent = '▶';
  elements.playText.textContent = '자동 재생';
}

/**
 * 탭 1: 랭킹 막대 바 목록 렌더링
 */
function renderRaceBars() {
  const currentYear = YEARS[state.currentYearIndex];
  const metric = state.raceMetric;
  const rankings = getRankingsByYear(currentYear, metric);

  // 헤더 텍스트 갱신
  if (elements.displayYear) elements.displayYear.textContent = `${currentYear}년`;
  if (elements.displayMilestone) elements.displayMilestone.textContent = YEAR_MILESTONES[currentYear] || '';

  const metricTitle = metric === 'gniTotal' ? '명목 총 GNI 순위' : '1인당 GNI(국민소득) 순위';
  const metricUnit = metric === 'gniTotal' ? '10억 달러 (Billion USD)' : '달러 (USD)';
  if (elements.chartMainTitle) elements.chartMainTitle.textContent = `${currentYear}년 세계 20개국 ${metricTitle}`;
  if (elements.chartSubTitle) elements.chartSubTitle.textContent = `단위: ${metricUnit} · 세계은행 Atlas Method`;

  // 한국 순위 배지 갱신
  const korItem = rankings.find(r => r.code === 'KOR');
  if (korItem && elements.koreaRankText) {
    const valFormatted = metric === 'gniTotal' ? `${korItem.value.toLocaleString()}B$` : `${korItem.value.toLocaleString()}$`;
    elements.koreaRankText.textContent = `세계 ${korItem.rank}위 (${valFormatted})`;
  }

  // 20개국 막대 바 HTML 조립
  if (!elements.raceBarsContainer) return;

  const rowsHtml = rankings.map(item => {
    let rankClass = '';
    if (item.rank === 1) rankClass = 'race-rank-top1';
    else if (item.rank === 2) rankClass = 'race-rank-top2';
    else if (item.rank === 3) rankClass = 'race-rank-top3';

    let barClass = '';
    if (item.code === 'KOR') barClass = 'bar-korea';
    else if (item.rank === 1) barClass = 'bar-top1';
    else if (item.rank === 2) barClass = 'bar-top2';
    else if (item.rank === 3) barClass = 'bar-top3';

    const valFormatted = metric === 'gniTotal'
      ? `${item.value.toLocaleString()} B$`
      : `${item.value.toLocaleString()} $`;

    return `
      <div class="race-bar-row ${item.code === 'KOR' ? 'is-korea' : ''}">
        <div class="race-rank-num ${rankClass}">${item.rank}</div>
        <div class="race-country-info">
          <span class="race-flag">${item.flag}</span>
          <span class="race-name">${item.name}</span>
        </div>
        <div class="race-bar-track">
          <div class="race-bar-fill ${barClass}" style="width: ${item.percentage}%;"></div>
        </div>
        <div class="race-val-label">${valFormatted}</div>
      </div>
    `;
  }).join('');

  elements.raceBarsContainer.innerHTML = rowsHtml;
}

/**
 * 탭 2: 1:1 맞대결 뷰 렌더링
 */
function renderCompareView() {
  const result = compareTwoCountries(state.compareTarget, state.compareMetric);

  const unit = result.unit;
  const latest = result.comparisons[result.comparisons.length - 1];

  // 요약 카드 채우기
  if (elements.summaryKorVal) elements.summaryKorVal.textContent = `${latest.korVal.toLocaleString()} ${unit}`;
  if (elements.summaryKorGrowth) elements.summaryKorGrowth.textContent = `1990년 대비 +${result.korGrowth}배 성장`;

  if (elements.summaryTargetFlag) elements.summaryTargetFlag.textContent = result.target.flag;
  if (elements.summaryTargetName) elements.summaryTargetName.textContent = result.target.name;
  if (elements.summaryTargetVal) elements.summaryTargetVal.textContent = `${latest.targetVal.toLocaleString()} ${unit}`;
  if (elements.summaryTargetGrowth) elements.summaryTargetGrowth.textContent = `1990년 대비 +${result.targetGrowth}배 성장`;

  if (elements.legendTargetName) elements.legendTargetName.textContent = result.target.name;
  if (elements.lineChartTitle) elements.lineChartTitle.textContent = `1990~2024 한국 vs ${result.target.name} ${result.metricLabel} 추이`;

  // 인사이트 박스
  if (elements.compareInsightBox) {
    let crossoverBadge = '';
    if (result.crossoverYear) {
      crossoverBadge = `<div style="font-weight: 850; color: #1e40af; margin-bottom: 0.35rem;">🏆 역전 달성 연도: ${result.crossoverYear}년 골든크로스!</div>`;
    }
    elements.compareInsightBox.innerHTML = `
      ${crossoverBadge}
      <div>${result.insightText}</div>
    `;
  }

  // 꺾은선 차트 그리기
  drawCompareCanvas(result);
}

/**
 * 1:1 맞대결 Canvas 꺾은선 차트 렌더링
 */
function drawCompareCanvas(cachedResult) {
  const canvas = elements.compareCanvas;
  if (!canvas) return;

  const result = cachedResult || compareTwoCountries(state.compareTarget, state.compareMetric);
  const ctx = canvas.getContext('2d');

  // 반응형 고해상도 DPI 보정
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 760;
  const height = 340;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // 캔버스 초기화
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 35, right: 35, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 최대값 계산 (y축 스케일링)
  const allValues = result.comparisons.flatMap(c => [c.korVal, c.targetVal]);
  const maxVal = Math.max(...allValues) * 1.15;

  // y축 눈금선 (4단계)
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

    const label = val >= 1000 ? `${Math.round(val / 1000)}k` : `${Math.round(val)}`;
    ctx.fillText(label, padding.left - 8, y + 4);
  }

  // x축 좌표 매핑
  const xCoords = YEARS.map((_, idx) => {
    return padding.left + (chartW / (YEARS.length - 1)) * idx;
  });

  // x축 연도 라벨 그리기
  ctx.textAlign = 'center';
  YEARS.forEach((yr, idx) => {
    const x = xCoords[idx];
    ctx.fillText(`'${String(yr).slice(2)}`, x, height - padding.bottom + 18);
  });

  // 라인 그리기 헬퍼 함수
  function drawLine(values, strokeColor, fillColor, isKor = false) {
    const points = values.map((val, idx) => ({
      x: xCoords[idx],
      y: padding.top + chartH - (val / maxVal) * chartH
    }));

    // 선 그리기
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isKor ? 3.5 : 2.5;
    ctx.stroke();

    // 점 및 값 표기
    points.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isKor ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 주요 시점(첫 해와 마지막 해) 값 텍스트 표기
      if (idx === 0 || idx === points.length - 1) {
        ctx.fillStyle = strokeColor;
        ctx.font = 'bold 11px sans-serif';
        const valText = values[idx] >= 1000 ? `${(values[idx] / 1000).toFixed(1)}k` : `${values[idx]}`;
        ctx.fillText(valText, pt.x, pt.y - 10);
      }
    });
  }

  // 1. 비교국 라인 (오렌지)
  const targetValues = result.comparisons.map(c => c.targetVal);
  drawLine(targetValues, '#f97316', '#ffffff', false);

  // 2. 한국 라인 (블루)
  const korValues = result.comparisons.map(c => c.korVal);
  drawLine(korValues, '#2563eb', '#ffffff', true);
}

/**
 * 탭 3: 내 연봉 글로벌 소득 위치 리포트 렌더링
 */
function renderSalaryResult() {
  if (!elements.salaryResultCard) return;

  const data = benchmarkMySalary(state.mySalaryManwon, 1350);

  // 상위/하위 백분위 계산
  const beatCount = data.lowerCount;
  const beatPercent = Math.round((beatCount / data.totalCount) * 100);

  elements.salaryResultCard.innerHTML = `
    <div class="salary-hero-row">
      <div class="salary-usd-box">
        <span class="usd-label">원화 환산 달러 가치 (적용 환율: 1,350원/$)</span>
        <span class="usd-value">${data.salaryUsd.toLocaleString()} $</span>
      </div>
      <div class="salary-tier-badge" style="background: ${data.badgeColor};">
        ${data.tierTitle}
      </div>
    </div>

    <div class="closest-country-card">
      <div class="closest-title">🌍 내 연봉과 가장 가까운 1인당 소득 국가</div>
      <div class="closest-body">
        <span class="closest-flag">${data.closestCountry.flag}</span>
        <div class="closest-info">
          <span class="closest-name">${data.closestCountry.name} (${data.closestCountry.code})</span>
          <span class="closest-stat">2024년 1인당 GNI: <strong>${data.closestCountry.value.toLocaleString()}$</strong> (내 연봉과의 차이: 약 ${Math.abs(data.salaryUsd - data.closestCountry.value).toLocaleString()}$)</span>
        </div>
      </div>
    </div>

    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.85rem; padding: 1.1rem 1.35rem; color: #1e3a8a; font-size: 0.94rem; line-height: 1.6;">
      <strong style="color: #1d4ed8;">📊 글로벌 비교 진단:</strong><br>
      당신의 연봉(세전 <strong>${data.salaryManwon.toLocaleString()}만원</strong>)은 세계 20대 경제 대국 중 <strong>${beatCount}개국(${beatPercent}%)</strong>의 1인당 국민소득보다 높습니다.<br>
      ${beatCount >= 10 ? '🎉 전 세계 상위 선진국 레벨에 도달해 있으며 글로벌 경쟁력을 입증하고 있습니다!' : '💪 신흥국 평균을 크게 웃돌며 강력한 성장 잠재력을 지니고 있습니다.'}
    </div>
  `;
}
