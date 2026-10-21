/**
 * 우리나라 수출입 품목 순위 시뮬레이터 인터랙션 (app.js)
 * 
 * 주요 기능:
 * 1. 24개년 10대 수출 품목 랭킹 바 차트 및 타임 슬라이더/자동 재생 애니메이션
 * 2. 6대 주력 품목(반도체, 자동차 등) 시계열 꺾은선 캔버스 차트 및 성장률 분석
 * 3. 수입 TOP5 품목 및 2000~2024 무역수지 흑자/적자 테이블 렌더링
 */

import { TRADE_YEARS, IMPORT_TOP5_2024 } from './data.js';
import { getExportRankingsByYear, getProductGrowthStats, getTradeBalanceHistory } from './logic.js';

// 연도별 마일스톤 문구
const MILESTONES = {
  2000: 'IT 벤처 붐 및 IMF 극복 무역 흑자',
  2005: '중국 경제 급성장에 따른 대중 수출 호조',
  2010: '금융위기 선방 및 조선·반도체 쌍끌이 흑자',
  2015: '사상 최대 무역 흑자 (903억 달러 달성)',
  2020: '코로나19 팬데믹 충격 속 반도체 선방',
  2022: '글로벌 원자재·에너지 가격 폭등 (적자 전환)',
  2024: '반도체 HBM 슈퍼사이클 & 역대급 자동차 수출'
};

// 애플리케이션 상태
const state = {
  activeTab: 'rank',
  currentYearIndex: 6, // 기본값: 2024년 (마지막 인덱스)
  isPlaying: false,
  playTimer: null,
  selectedProduct: '반도체'
};

// DOM 요소 캐시
const elements = {
  // 탭
  tabButtons: document.querySelectorAll('.tool-tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),

  // 탭 1 (수출 순위)
  yearSlider: document.getElementById('trade-year-slider'),
  sliderTicks: document.getElementById('trade-slider-ticks'),
  displayYear: document.getElementById('trade-display-year'),
  displayMilestone: document.getElementById('trade-display-milestone'),
  btnPlay: document.getElementById('btn-trade-play'),
  playIcon: document.getElementById('trade-play-icon'),
  playText: document.getElementById('trade-play-text'),
  sumExportVal: document.getElementById('sum-export-val'),
  sumImportVal: document.getElementById('sum-import-val'),
  sumBalanceVal: document.getElementById('sum-balance-val'),
  sumBalancePill: document.getElementById('sum-balance-pill'),
  chartTitle: document.getElementById('trade-chart-title'),
  top1ShareText: document.getElementById('top1-share-text'),
  tradeBarsContainer: document.getElementById('trade-bars-container'),

  // 탭 2 (품목 성장사)
  productSelect: document.getElementById('product-select'),
  growthHero: document.getElementById('product-growth-hero'),
  canvasTitle: document.getElementById('product-canvas-title'),
  growthCanvas: document.getElementById('product-growth-canvas'),

  // 탭 3 (수입 & 수지)
  importGrid: document.getElementById('import-grid'),
  balanceTbody: document.getElementById('balance-tbody')
};

/**
 * 초기화 진입점
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. 공통 헤더/푸터/면책조항 렌더링
  if (window.SimuLabUI) {
    window.SimuLabUI.renderHeader('stats', 'korean-trade-ranking');
    window.SimuLabUI.renderDisclaimer();
    window.SimuLabUI.renderFooter();
  }

  // 2. 슬라이더 틱 라벨 생성
  buildSliderTicks();

  // 3. 이벤트 바인딩
  initEventListeners();

  // 4. 초기 뷰 렌더링
  renderRankBars();
  renderProductGrowth();
  renderImportAndBalance();
});

/**
 * 슬라이더 눈금 생성
 */
function buildSliderTicks() {
  if (!elements.sliderTicks) return;
  elements.sliderTicks.innerHTML = TRADE_YEARS.map((yr, idx) => {
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
      renderRankBars();
    });
  }

  // 3. 자동 재생 토글
  if (elements.btnPlay) {
    elements.btnPlay.addEventListener('click', toggleAutoPlay);
  }

  // 4. 품목 선택 변경
  if (elements.productSelect) {
    elements.productSelect.addEventListener('change', (e) => {
      state.selectedProduct = e.target.value;
      renderProductGrowth();
    });
  }

  // 창 리사이즈 시 캔버스 다시 그리기
  window.addEventListener('resize', () => {
    if (state.activeTab === 'growth') {
      drawGrowthCanvas();
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

  if (tabId === 'growth') {
    setTimeout(drawGrowthCanvas, 50);
  }
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

  if (state.currentYearIndex >= TRADE_YEARS.length - 1) {
    state.currentYearIndex = 0;
    if (elements.yearSlider) elements.yearSlider.value = 0;
    renderRankBars();
  }

  state.playTimer = setInterval(() => {
    if (state.currentYearIndex < TRADE_YEARS.length - 1) {
      state.currentYearIndex += 1;
      if (elements.yearSlider) elements.yearSlider.value = state.currentYearIndex;
      renderRankBars();
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
 * 탭 1: 수출 10대 품목 막대 바 렌더링
 */
function renderRankBars() {
  const currentYear = TRADE_YEARS[state.currentYearIndex];
  const data = getExportRankingsByYear(currentYear);

  // 헤더 및 마일스톤 갱신
  if (elements.displayYear) elements.displayYear.textContent = `${currentYear}년`;
  if (elements.displayMilestone) elements.displayMilestone.textContent = MILESTONES[currentYear] || '';

  // 총 수출/수입/무역수지 갱신
  if (elements.sumExportVal) elements.sumExportVal.textContent = `${data.summary.export.toLocaleString()}억 $`;
  if (elements.sumImportVal) elements.sumImportVal.textContent = `${data.summary.import.toLocaleString()}억 $`;

  const isSurplus = data.summary.balance >= 0;
  if (elements.sumBalanceVal) {
    const sign = isSurplus ? '+' : '';
    const statusText = isSurplus ? '흑자' : '적자';
    elements.sumBalanceVal.textContent = `${sign}${data.summary.balance.toLocaleString()}억 $ (${statusText})`;
  }
  if (elements.sumBalancePill) {
    elements.sumBalancePill.className = `stat-pill ${isSurplus ? 'is-surplus' : 'is-deficit'}`;
  }

  if (elements.chartTitle) {
    elements.chartTitle.textContent = `${currentYear}년 대한민국 수출 10대 품목 순위`;
  }

  // 1위 품목 비중 뱃지
  const top1 = data.items[0];
  if (top1 && elements.top1ShareText) {
    elements.top1ShareText.textContent = `${top1.share}% (${top1.amount.toLocaleString()}억$)`;
  }

  // 막대 바 목록 HTML 조립
  if (!elements.tradeBarsContainer) return;

  const html = data.items.map(item => {
    let rankClass = '';
    if (item.rank === 1) rankClass = 'trade-rank-top1';
    else if (item.rank === 2) rankClass = 'trade-rank-top2';
    else if (item.rank === 3) rankClass = 'trade-rank-top3';

    let rowSpecial = '';
    let fillClass = '';
    if (item.name.includes('반도체')) {
      rowSpecial = 'is-semi';
      fillClass = 'fill-semi';
    } else if (item.name.includes('자동차')) {
      rowSpecial = 'is-auto';
      fillClass = 'fill-auto';
    } else if (item.name.includes('선박')) {
      fillClass = 'fill-ship';
    } else if (item.name.includes('석유제품')) {
      fillClass = 'fill-oil';
    }

    return `
      <div class="trade-bar-row ${rowSpecial}">
        <div class="trade-rank-num ${rankClass}">${item.rank}</div>
        <div class="trade-product-info">
          <span class="trade-icon">${item.icon}</span>
          <span class="trade-name">${item.name}</span>
        </div>
        <div class="trade-bar-track">
          <div class="trade-bar-fill ${fillClass}" style="width: ${item.barPercent}%;"></div>
        </div>
        <div class="trade-val-col">
          <span class="trade-amount-text">${item.amount.toLocaleString()}억 $</span>
          <span class="trade-share-text">(${item.share}%)</span>
        </div>
      </div>
    `;
  }).join('');

  elements.tradeBarsContainer.innerHTML = html;
}

/**
 * 탭 2: 6대 주력산업 성장사 렌더링
 */
function renderProductGrowth() {
  const stats = getProductGrowthStats(state.selectedProduct);

  if (elements.canvasTitle) {
    elements.canvasTitle.textContent = `${stats.name} 24개년 수출액 추이 (2000~2024)`;
  }

  if (elements.growthHero) {
    elements.growthHero.innerHTML = `
      <div class="growth-stat-row">
        <div class="growth-stat-item">
          <span class="stat-lbl">2000년 수출액</span>
          <strong class="stat-num">${stats.firstVal.toLocaleString()}억 $</strong>
        </div>
        <div class="growth-stat-item">
          <span class="stat-lbl">2024년 수출액</span>
          <strong class="stat-num" style="color: #059669;">${stats.lastVal.toLocaleString()}억 $</strong>
        </div>
        <div class="growth-stat-item">
          <span class="stat-lbl">24년간 성장 배수</span>
          <strong class="stat-num" style="color: #2563eb;">+${stats.growthMultiplier}배 🚀</strong>
        </div>
      </div>
      <div class="product-desc-box">
        <strong>${stats.icon} ${stats.name} 산업 인사이트:</strong> ${stats.desc}
      </div>
    `;
  }

  drawGrowthCanvas(stats);
}

/**
 * 주력 품목 Canvas 꺾은선 차트 렌더링
 */
function drawGrowthCanvas(cachedStats) {
  const canvas = elements.growthCanvas;
  if (!canvas) return;

  const stats = cachedStats || getProductGrowthStats(state.selectedProduct);
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

  const amounts = stats.series.map(s => s.amount);
  const maxVal = Math.max(...amounts) * 1.15;

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

    ctx.fillText(`${Math.round(val)}억`, padding.left - 8, y + 4);
  }

  // x축 좌표 매핑
  const xCoords = stats.series.map((_, idx) => {
    return padding.left + (chartW / (stats.series.length - 1)) * idx;
  });

  // x축 연도 표기
  ctx.textAlign = 'center';
  stats.series.forEach((s, idx) => {
    ctx.fillText(`'${String(s.year).slice(2)}`, xCoords[idx], height - padding.bottom + 18);
  });

  // 꺾은선 및 채우기 영역 그리기
  const points = stats.series.map((s, idx) => ({
    x: xCoords[idx],
    y: padding.top + chartH - (s.amount / maxVal) * chartH
  }));

  // 영역 채우기 그라데이션
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

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

  // 선 그리기
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // 점 및 금액 텍스트 표기
  points.forEach((pt, idx) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 값 표기
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${stats.series[idx].amount}억$`, pt.x, pt.y - 10);
  });
}

/**
 * 탭 3: 수입 품목 TOP5 & 무역수지 히스토리 테이블 렌더링
 */
function renderImportAndBalance() {
  // 1. 수입 그리드
  if (elements.importGrid) {
    elements.importGrid.innerHTML = IMPORT_TOP5_2024.map(it => {
      return `
        <div class="import-item-card">
          <div class="import-top-row">
            <span class="import-rank">수입 ${it.rank}위</span>
            <span class="import-icon">${it.icon}</span>
          </div>
          <div class="import-name">${it.name}</div>
          <div class="import-amt">${it.amount.toLocaleString()}억 $</div>
          <div class="import-share">수입 비중: <strong>${it.share}%</strong></div>
        </div>
      `;
    }).join('');
  }

  // 2. 무역수지 히스토리 테이블
  if (elements.balanceTbody) {
    const history = getTradeBalanceHistory();
    elements.balanceTbody.innerHTML = history.map(row => {
      const isSurplus = row.isSurplus;
      const sign = isSurplus ? '+' : '';
      const tagClass = isSurplus ? 'tag-surplus' : 'tag-deficit';
      const statusText = isSurplus ? '흑자' : '적자';

      return `
        <tr>
          <td><strong>${row.year}년</strong></td>
          <td>${row.export.toLocaleString()}억 $</td>
          <td>${row.import.toLocaleString()}억 $</td>
          <td><span class="${tagClass}">${sign}${row.balance.toLocaleString()}억 $ (${statusText})</span></td>
          <td style="color: #64748b; font-size: 0.84rem;">${row.highlight}</td>
        </tr>
      `;
    }).join('');
  }
}
