/**
 * 대한민국 연도별 출입국 관광객 통계 인터랙션 (app.js)
 * 
 * 주요 기능:
 * 1. 24개년 출입국 관광객(출국자 vs 입국자) Canvas 시계열 꺾은선 차트 렌더링
 * 2. 2000~2024 대한민국 관광수지(적자) 히스토리 테이블 렌더링
 * 3. 2024년 한국인 인기 여행지 TOP 5 vs 방한 외국인 국적 TOP 5 렌더링
 */

import { TOURISM_YEARS, TOURISM_STATS, OUTBOUND_TOP5_2024, INBOUND_TOP5_2024 } from './data.js';
import { getTourismTimeSeries, getTourismQuickInsights } from './logic.js';

// 애플리케이션 상태
const state = {
  activeTab: 'trend'
};

// DOM 요소 캐시
const elements = {
  tabButtons: document.querySelectorAll('.tool-tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),

  // 탭 1 (추이)
  heroOutboundVal: document.getElementById('hero-outbound-val'),
  heroInboundVal: document.getElementById('hero-inbound-val'),
  heroRatioVal: document.getElementById('hero-ratio-val'),
  tourismCanvas: document.getElementById('tourism-line-canvas'),

  // 탭 2 (수지)
  balanceTbody: document.getElementById('tourism-balance-tbody'),

  // 탭 3 (여행지 & 국적)
  outboundDestList: document.getElementById('outbound-dest-list'),
  inboundDestList: document.getElementById('inbound-dest-list')
};

/**
 * 초기화 진입점
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. 공통 헤더/푸터/면책조항 렌더링
  if (window.SimuLabUI) {
    window.SimuLabUI.renderHeader('stats', 'korean-tourism-travel-stats');
    window.SimuLabUI.renderDisclaimer();
    window.SimuLabUI.renderFooter();
  }

  // 2. 이벤트 바인딩
  initEventListeners();

  // 3. 초기 뷰 렌더링
  renderTrendTab();
  renderBalanceTable();
  renderDestinations();
});

/**
 * 이벤트 바인딩
 */
function initEventListeners() {
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // 창 리사이즈 시 캔버스 다시 그리기
  window.addEventListener('resize', () => {
    if (state.activeTab === 'trend') {
      drawTourismCanvas();
    }
  });
}

/**
 * 탭 전환
 */
function switchTab(tabId) {
  state.activeTab = tabId;

  elements.tabButtons.forEach(btn => {
    btn.classList.toggle('is-active', btn.getAttribute('data-tab') === tabId);
  });

  elements.tabPanels.forEach(panel => {
    panel.classList.toggle('is-active', panel.id === `tab-panel-${tabId}`);
  });

  if (tabId === 'trend') {
    setTimeout(drawTourismCanvas, 50);
  }
}

/**
 * 탭 1: 24년 출입국 시계열 차트 렌더링
 */
function renderTrendTab() {
  const d2024 = TOURISM_STATS[2024];
  const ratio = (d2024.outbound / d2024.inbound).toFixed(2);

  if (elements.heroOutboundVal) elements.heroOutboundVal.textContent = `${d2024.outbound.toLocaleString()}만 명`;
  if (elements.heroInboundVal) elements.heroInboundVal.textContent = `${d2024.inbound.toLocaleString()}만 명`;
  if (elements.heroRatioVal) elements.heroRatioVal.textContent = `${ratio}배`;

  drawTourismCanvas();
}

/**
 * Canvas 출입국 꺾은선 차트 렌더링
 */
function drawTourismCanvas() {
  const canvas = elements.tourismCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const series = getTourismTimeSeries();

  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 760;
  const height = 360;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 35, right: 35, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 최대값 계산 (y축: 3,200만 명 수준)
  const maxVal = 3200;

  // y축 그리드선
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

    ctx.fillText(`${val.toLocaleString()}만`, padding.left - 8, y + 4);
  }

  // x축 좌표 매핑
  const xCoords = series.map((_, idx) => {
    return padding.left + (chartW / (series.length - 1)) * idx;
  });

  // x축 연도 표기
  ctx.textAlign = 'center';
  series.forEach((s, idx) => {
    ctx.fillText(`'${String(s.year).slice(2)}`, xCoords[idx], height - padding.bottom + 18);
  });

  // 꺾은선 그리기 헬퍼 함수
  function drawLine(values, strokeColor, fillColor, labelPrefix) {
    const points = values.map((val, idx) => ({
      x: xCoords[idx],
      y: padding.top + chartH - (val / maxVal) * chartH
    }));

    // 선
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // 점 및 핵심 연도 값 라벨 표기 (2000, 2019, 2021, 2024)
    points.forEach((pt, idx) => {
      const yr = series[idx].year;
      const isKeyYear = [2000, 2019, 2021, 2024].includes(yr);

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isKeyYear ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      if (isKeyYear) {
        ctx.fillStyle = strokeColor;
        ctx.font = 'bold 11px sans-serif';
        const offset = labelPrefix === 'out' ? -10 : 18;
        ctx.fillText(`${values[idx]}만`, pt.x, pt.y + offset);
      }
    });
  }

  // 1. 방한 외래객 (초록색 라인)
  const inboundValues = series.map(s => s.inbound);
  drawLine(inboundValues, '#059669', '#ffffff', 'in');

  // 2. 국민 해외출국자 (파란색 라인)
  const outboundValues = series.map(s => s.outbound);
  drawLine(outboundValues, '#2563eb', '#ffffff', 'out');
}

/**
 * 탭 2: 관광수지 적자 테이블 렌더링
 */
function renderBalanceTable() {
  if (!elements.balanceTbody) return;

  const series = getTourismTimeSeries();
  elements.balanceTbody.innerHTML = series.map(row => {
    const isDeficit = row.balance < 0;
    const sign = isDeficit ? '-' : '+';
    const absVal = Math.abs(row.balance);
    const statusText = isDeficit ? '적자' : '흑자';

    return `
      <tr>
        <td><strong>${row.year}년</strong></td>
        <td><strong style="color: #2563eb;">${row.outbound.toLocaleString()}만 명</strong></td>
        <td><strong style="color: #059669;">${row.inbound.toLocaleString()}만 명</strong></td>
        <td style="color: #475569;">${row.diff > 0 ? `출국 +${row.diff.toLocaleString()}만` : `입국 +${Math.abs(row.diff).toLocaleString()}만`}</td>
        <td><span class="tag-deficit">${sign}${absVal.toLocaleString()}억 $ (${statusText})</span></td>
        <td style="color: #64748b; font-size: 0.84rem;">${row.highlight}</td>
      </tr>
    `;
  }).join('');
}

/**
 * 탭 3: 인기 여행지 vs 방한 외국인 렌더링
 */
function renderDestinations() {
  // 1. 한국인 인기 여행지 TOP 5
  if (elements.outboundDestList) {
    elements.outboundDestList.innerHTML = OUTBOUND_TOP5_2024.map(it => {
      let rankClass = `dest-rank-${it.rank}`;
      return `
        <div class="dest-item-card">
          <div class="dest-top-row">
            <div class="dest-rank-country">
              <span class="dest-rank-tag ${rankClass}">${it.rank}위</span>
              <span>${it.flag}</span>
              <span>${it.country}</span>
            </div>
            <div class="dest-visitors">${it.visitors.toLocaleString()}만 명 <small style="color: #64748b; font-size: 0.8rem;">(${it.share}%)</small></div>
          </div>
          <div class="dest-comment">${it.comment}</div>
        </div>
      `;
    }).join('');
  }

  // 2. 한국을 찾은 외국인 국적 TOP 5
  if (elements.inboundDestList) {
    elements.inboundDestList.innerHTML = INBOUND_TOP5_2024.map(it => {
      let rankClass = `dest-rank-${it.rank}`;
      return `
        <div class="dest-item-card">
          <div class="dest-top-row">
            <div class="dest-rank-country">
              <span class="dest-rank-tag ${rankClass}">${it.rank}위</span>
              <span>${it.flag}</span>
              <span>${it.country}</span>
            </div>
            <div class="dest-visitors">${it.visitors.toLocaleString()}만 명 <small style="color: #64748b; font-size: 0.8rem;">(${it.share}%)</small></div>
          </div>
          <div class="dest-comment">${it.comment}</div>
        </div>
      `;
    }).join('');
  }
}
