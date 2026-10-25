/**
 * 수록 29개국 인구 면적 순위 시뮬레이터 인터랙션 (app.js)
 *
 * 주요 기능:
 * 1. 인구, 면적, 인구밀도 3대 지표 실시간 순위 바 차트 렌더링
 * 2. 1㎢당 인구밀도 점(Dot) 밀집도 체감 시각화
 * 3. 대한민국 vs 타 국가 1:1 영토 및 인구 배수 대조 리포트
 */

import { getRankingsByMetric, compareWithKorea, getDensityVisualData } from './logic.js';

// 지표별 메타 정보
const METRIC_META = {
  population: {
    title: '수록 29개국 인구수 순위 (2026년 전망)',
    subtitle: '단위: 만 명 (10,000 Persons) · 세계은행 인구 전망(source 40)',
    unit: '만 명',
    format: val => `${val.toLocaleString(undefined, {maximumFractionDigits: 2})}만 명`
  },
  area: {
    title: '수록 29개국 표면적 순위',
    subtitle: '단위: 만 ㎢ (10,000 sq. km) · 세계은행 2024년 표면적(내수면 포함)',
    unit: '만 ㎢',
    format: val => `${val.toLocaleString(undefined, {maximumFractionDigits: 2})}만 ㎢`
  },
  density: {
    title: '수록 29개국 인구밀도 순위',
    subtitle: '단위: 명/㎢ (Persons per sq. km) · 2026년 전망 인구 ÷ 2024년 표면적',
    unit: '명/㎢',
    format: val => `${val.toLocaleString(undefined, {maximumFractionDigits: 2})}명/㎢`
  }
};

// 애플리케이션 상태
const state = {
  activeTab: 'rank',
  activeMetric: 'population', // 'population' | 'area' | 'density'
  compareTarget: 'USA'
};

// DOM 요소 캐시
const elements = {
  tabButtons: document.querySelectorAll('.tool-tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),

  // 탭 1 (랭킹)
  metricBtns: document.querySelectorAll('.rank-metric-btn'),
  chartTitle: document.getElementById('rank-chart-title'),
  chartSubtitle: document.getElementById('rank-chart-subtitle'),
  koreaRankText: document.getElementById('korea-rank-text'),
  rankBarsContainer: document.getElementById('rank-bars-container'),

  // 탭 2 (밀도)
  densityGrid: document.getElementById('density-grid'),

  // 탭 3 (1:1 비교)
  countrySelect: document.getElementById('country-select'),
  compareHeroCard: document.getElementById('compare-hero-card')
};

/**
 * 초기화 진입점
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. 공통 헤더/푸터/면책조항 렌더링
  if (window.SimuLabUI) {
    window.SimuLabUI.renderHeader('stats', 'world-population-area-rank');
    window.SimuLabUI.renderDisclaimer();
    window.SimuLabUI.renderFooter();
  }

  // 2. 이벤트 바인딩
  initEventListeners();

  // 3. 초기 뷰 렌더링
  renderRankBars();
  renderDensityGrid();
  renderCompare();
});

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

  // 2. 지표 토글 (인구 / 면적 / 밀도)
  elements.metricBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.metricBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.activeMetric = btn.getAttribute('data-metric');
      renderRankBars();
    });
  });

  // 3. 1:1 비교 대상 국가 변경
  if (elements.countrySelect) {
    elements.countrySelect.addEventListener('change', (e) => {
      state.compareTarget = e.target.value;
      renderCompare();
    });
  }
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
}

/**
 * 탭 1: 3대 지표 랭킹 바 차트 렌더링
 */
function renderRankBars() {
  const metric = state.activeMetric;
  const meta = METRIC_META[metric];
  const list = getRankingsByMetric(metric);

  // 헤더 갱신
  if (elements.chartTitle) elements.chartTitle.textContent = meta.title;
  if (elements.chartSubtitle) elements.chartSubtitle.textContent = meta.subtitle;

  // 한국 순위 갱신
  const kor = list.find(item => item.code === 'KOR');
  if (kor && elements.koreaRankText) {
    elements.koreaRankText.textContent = `세계 ${kor.rank}위 (${meta.format(kor.value)})`;
  }

  // 30개국 막대 바 HTML 조립
  if (!elements.rankBarsContainer) return;

  const html = list.map(item => {
    let rankClass = '';
    if (item.rank === 1) rankClass = 'rank-top1';
    else if (item.rank === 2) rankClass = 'rank-top2';
    else if (item.rank === 3) rankClass = 'rank-top3';

    let fillClass = '';
    if (item.code === 'KOR') fillClass = 'fill-korea';
    else if (item.rank === 1) fillClass = 'fill-top1';
    else if (item.rank === 2) fillClass = 'fill-top2';
    else if (item.rank === 3) fillClass = 'fill-top3';

    return `
      <div class="rank-bar-row ${item.code === 'KOR' ? 'is-korea' : ''}">
        <div class="rank-num ${rankClass}">${item.rank}</div>
        <div class="country-info">
          <span class="c-flag">${item.flag}</span>
          <span class="c-name">${item.name}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${fillClass}" style="width: ${item.percentage}%;"></div>
        </div>
        <div class="val-label">${meta.format(item.value)}</div>
      </div>
    `;
  }).join('');

  elements.rankBarsContainer.innerHTML = html;
}

/**
 * 탭 2: 1㎢당 인구밀도 체감 비교 렌더링
 */
function renderDensityGrid() {
  if (!elements.densityGrid) return;

  const data = getDensityVisualData();

  const html = data.map(item => {
    // 인구밀도에 따라 미니 박스 안에 그릴 점(Dot) 개수 계산 (최대 100개로 축척)
    const dotCount = Math.max(1, Math.min(100, Math.round(item.density / 10)));
    let dotsHtml = '';
    for (let i = 0; i < dotCount; i++) {
      dotsHtml += '<span class="d-dot"></span>';
    }

    return `
      <div class="density-item-card ${item.code === 'KOR' ? 'is-korea' : ''}">
        <div class="d-top-row">
          <div class="d-country-name">
            <span>${item.flag}</span>
            <span>${item.name}</span>
          </div>
          <span class="d-val-badge">${item.density.toLocaleString()}명/㎢</span>
        </div>
        <div class="d-visual-box">
          <div class="density-dots-cloud">${dotsHtml}</div>
        </div>
        <div class="d-item-desc">${item.desc}</div>
      </div>
    `;
  }).join('');

  elements.densityGrid.innerHTML = html;
}

/**
 * 탭 3: 한국 vs 1:1 영토 대조 리포트 렌더링
 */
function renderCompare() {
  if (!elements.compareHeroCard) return;

  const res = compareWithKorea(state.compareTarget);

  elements.compareHeroCard.innerHTML = `
    <div class="compare-two-grid">
      <div class="c-box is-kor">
        <div class="c-flag-lg">${res.kor.flag}</div>
        <div class="c-title">${res.kor.name}</div>
        <div class="c-stat-line">영토: <strong>${res.kor.area}만 ㎢</strong></div>
        <div class="c-stat-line">인구: <strong>${res.kor.population.toLocaleString()}만 명</strong></div>
        <div class="c-stat-line">밀도: <strong style="color: #1e40af;">${res.kor.density}명/㎢</strong></div>
      </div>

      <div class="c-vs-badge">VS</div>

      <div class="c-box">
        <div class="c-flag-lg">${res.target.flag}</div>
        <div class="c-title">${res.target.name}</div>
        <div class="c-stat-line">영토: <strong>${res.target.area}만 ㎢</strong> (한국의 ${res.areaRatio}배)</div>
        <div class="c-stat-line">인구: <strong>${res.target.population.toLocaleString()}만 명</strong> (한국의 ${res.popRatio}배)</div>
        <div class="c-stat-line">밀도: <strong>${res.target.density}명/㎢</strong></div>
      </div>
    </div>

    <div class="compare-story-box">
      <strong>🌏 영토 &amp; 인구 분석 팩트:</strong><br>
      ${res.story}<br>
      <small style="color: #475569; display: block; margin-top: 0.4rem;">* ${res.target.desc}</small>
    </div>
  `;
}
