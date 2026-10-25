/**
 * ==========================================================================
 * [별별 통계] 전국 도시별 소득 & 집값 UI 컨트롤러 (app.js)
 * --------------------------------------------------------------------------
 * 1:1 지역 대조, 17개 시도 지표 랭킹 정렬, 10개년 시계열 Canvas 차트 시각화
 * ==========================================================================
 */

import { CityIncomeHousingLogic } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 서브 탭 제어
  const tabBtns = document.querySelectorAll('.sub-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');

      // 탭 전환 시 차트 리사이즈
      if (targetId === 'panel-trend') {
        renderTrendChart();
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. 탭 1: 지역 1:1 비교 분석기
  // --------------------------------------------------------------------------
  const selectRegionA = document.getElementById('selectRegionA');
  const selectRegionB = document.getElementById('selectRegionB');
  const compareResultBox = document.getElementById('compareResultBox');

  // 셀렉트박스 초기 옵션 채우기
  const allRegions = CityIncomeHousingLogic.getAllRegions();
  function populateSelects() {
    if (!selectRegionA || !selectRegionB) return;
    selectRegionA.innerHTML = '';
    selectRegionB.innerHTML = '';

    allRegions.forEach(reg => {
      const optA = document.createElement('option');
      optA.value = reg.id;
      optA.textContent = `${reg.shortName} (${reg.name})`;
      if (reg.id === 'seoul') optA.selected = true;
      selectRegionA.appendChild(optA);

      const optB = document.createElement('option');
      optB.value = reg.id;
      optB.textContent = `${reg.shortName} (${reg.name})`;
      if (reg.id === 'busan') optB.selected = true;
      selectRegionB.appendChild(optB);
    });
  }

  function runCompare() {
    if (!compareResultBox) return;
    const idA = selectRegionA.value;
    const idB = selectRegionB.value;

    const res = CityIncomeHousingLogic.compareRegions(idA, idB);
    const { regA, regB, diff } = res;

    const pirDiffText = diff.pirGap > 0 
      ? `<strong>${regA.shortName}</strong>이 <strong>${diff.pirGap}년</strong> 더 걸림`
      : `<strong>${regB.shortName}</strong>이 <strong>${Math.abs(diff.pirGap)}년</strong> 더 걸림`;

    compareResultBox.innerHTML = `
      <!-- 비교 핵심 요약 배너 -->
      <div class="compare-highlight-banner">
        <h4 style="font-size:1.05rem; font-weight:850; margin:0 0 0.35rem; color:#1e293b;">
          🏢 집값은 <strong>${regA.shortName}</strong>이 <strong>${regB.shortName}</strong>의 약 <span style="color:#4f46e5;">${diff.priceRatio}배</span>!
        </h4>
        <p style="font-size:0.86rem; color:var(--text-secondary); margin:0;">
          내 집 마련 소요 기간(PIR): ${pirDiffText} (가구 연소득 전액 저축 기준)
        </p>
      </div>

      <!-- 1:1 대조 카드 2열 그리드 -->
      <div class="compare-card-grid">
        <!-- 지역 A 카드 -->
        <div class="region-spec-card">
          <div class="region-spec-header">
            <span class="region-tag tag-a">${regA.shortName}</span>
            <strong style="font-size:1.15rem;">${regA.name}</strong>
          </div>
          <div class="spec-row">
            <span>평균 아파트값</span>
            <strong style="color:#4f46e5; font-size:1.05rem;">${CityIncomeHousingLogic.formatMoney(regA.housingPrice)}</strong>
          </div>
          <div class="spec-row">
            <span>평당 가격</span>
            <strong>${regA.pyeongPrice.toLocaleString()}만원</strong>
          </div>
          <div class="spec-row">
            <span>내 집 마련(PIR)</span>
            <strong style="color:#ef4444;">${regA.pir}년</strong>
          </div>
          <div class="spec-row">
            <span>1인당 가계총처분가능소득 (2024)</span>
            <strong>${regA.income.toLocaleString()}만원</strong>
          </div>
          <div class="spec-row">
            <span>1인가구 비중</span>
            <strong>${regA.singleRatio}%</strong>
          </div>
          <div class="spec-row">
            <span>행정구역 면적</span>
            <strong>${regA.area.toLocaleString()} ㎢</strong>
          </div>
        </div>

        <!-- 지역 B 카드 -->
        <div class="region-spec-card">
          <div class="region-spec-header">
            <span class="region-tag tag-b">${regB.shortName}</span>
            <strong style="font-size:1.15rem;">${regB.name}</strong>
          </div>
          <div class="spec-row">
            <span>평균 아파트값</span>
            <strong style="color:#4f46e5; font-size:1.05rem;">${CityIncomeHousingLogic.formatMoney(regB.housingPrice)}</strong>
          </div>
          <div class="spec-row">
            <span>평당 가격</span>
            <strong>${regB.pyeongPrice.toLocaleString()}만원</strong>
          </div>
          <div class="spec-row">
            <span>내 집 마련(PIR)</span>
            <strong style="color:#ef4444;">${regB.pir}년</strong>
          </div>
          <div class="spec-row">
            <span>1인당 가계총처분가능소득 (2024)</span>
            <strong>${regB.income.toLocaleString()}만원</strong>
          </div>
          <div class="spec-row">
            <span>1인가구 비중</span>
            <strong>${regB.singleRatio}%</strong>
          </div>
          <div class="spec-row">
            <span>행정구역 면적</span>
            <strong>${regB.area.toLocaleString()} ㎢</strong>
          </div>
        </div>
      </div>
    `;

    if (window.SimuLabTracker && window.SimuLabTracker.trackEvent) {
      window.SimuLabTracker.trackEvent('compare_city_housing', `${idA}_vs_${idB}`);
    }
  }

  populateSelects();
  if (selectRegionA) selectRegionA.addEventListener('change', runCompare);
  if (selectRegionB) selectRegionB.addEventListener('change', runCompare);
  runCompare();

  // --------------------------------------------------------------------------
  // 3. 탭 2: 17개 시도 전체 랭킹 테이블
  // --------------------------------------------------------------------------
  const sortBtns = document.querySelectorAll('.sort-chip-btn');
  const rankingTableBody = document.getElementById('rankingTableBody');
  let currentSortBy = 'housingPrice';

  function renderRankingTable(sortBy) {
    if (!rankingTableBody) return;
    const ranked = CityIncomeHousingLogic.getRankedRegions(sortBy, 'desc');
    rankingTableBody.innerHTML = '';

    ranked.forEach((item, index) => {
      const tr = document.createElement('tr');
      let rankMedal = `${index + 1}`;
      if (index === 0) rankMedal = '🥇 1';
      else if (index === 1) rankMedal = '🥈 2';
      else if (index === 2) rankMedal = '🥉 3';

      tr.innerHTML = `
        <td style="font-weight:800; text-align:center;">${rankMedal}</td>
        <td style="font-weight:750;">
          <span style="font-weight:800; color:#1e293b;">${item.shortName}</span>
          <span style="font-size:0.75rem; color:var(--text-muted); display:block;">${item.name}</span>
        </td>
        <td style="text-align:right; font-weight:750; color:${sortBy === 'housingPrice' ? '#4f46e5' : 'inherit'};">
          ${CityIncomeHousingLogic.formatMoney(item.housingPrice)}
        </td>
        <td style="text-align:right; font-weight:750; color:${sortBy === 'pir' ? '#ef4444' : 'inherit'};">
          ${item.pir}년
        </td>
        <td style="text-align:right; font-weight:700; color:${sortBy === 'income' ? '#10b981' : 'inherit'};">
          ${item.income.toLocaleString()}만원
        </td>
        <td style="text-align:right; color:${sortBy === 'singleRatio' ? '#f59e0b' : 'inherit'};">
          ${item.singleRatio}%
        </td>
        <td style="text-align:right; font-size:0.82rem; color:${sortBy === 'area' ? '#6366f1' : 'var(--text-muted)'};">
          ${item.area.toLocaleString()} ㎢
        </td>
      `;
      rankingTableBody.appendChild(tr);
    });
  }

  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sortBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSortBy = btn.getAttribute('data-sort');
      renderRankingTable(currentSortBy);
    });
  });

  renderRankingTable('housingPrice');

  // --------------------------------------------------------------------------
  // 4. 탭 3: 10개년 실거래가 추이 Canvas 차트
  // --------------------------------------------------------------------------
  const trendCanvas = document.getElementById('trendCanvas');

  function renderTrendChart() {
    if (!trendCanvas) return;
    const ctx = trendCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = trendCanvas.getBoundingClientRect();
    trendCanvas.width = rect.width * dpr;
    trendCanvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 35, bottom: 40, left: 55 };

    const { years, seoul, gyeonggi, busan, national } = CityIncomeHousingLogic.YEARLY_TREND;
    const maxVal = 140000; // 최대 14억원
    const minVal = 0;

    function getY(val) {
      return height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
    }

    function getX(idx) {
      return padding.left + (idx / (years.length - 1)) * (width - padding.left - padding.right);
    }

    ctx.clearRect(0, 0, width, height);

    // 가로 그리드선 (0, 3억, 6억, 9억, 12억)
    const gridVals = [30000, 60000, 90000, 120000];
    ctx.font = '600 10px Pretendard, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    gridVals.forEach(v => {
      const y = getY(v);
      ctx.beginPath();
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(`${v / 10000}억`, padding.left - 8, y);
    });

    // X축 라벨
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    years.forEach((yr, idx) => {
      ctx.fillText(yr + '년', getX(idx), height - padding.bottom + 8);
    });

    // 라인 그리기 헬퍼
    function drawLine(data, color, lineWidth = 2.5) {
      ctx.beginPath();
      data.forEach((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // 포인트
      data.forEach((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // 서울: 보라색, 경기: 파란색, 부산: 주황색, 전국: 회색점선
    drawLine(national, '#94a3b8', 1.5);
    drawLine(busan, '#f97316', 2);
    drawLine(gyeonggi, '#0284c7', 2);
    drawLine(seoul, '#6366f1', 3);

    // 마지막 수치 라벨 (서울)
    const lastSeoulY = getY(seoul[seoul.length - 1]);
    const lastSeoulX = getX(seoul.length - 1);
    ctx.font = '750 11px Pretendard, sans-serif';
    ctx.fillStyle = '#4f46e5';
    ctx.textAlign = 'right';
    ctx.fillText('서울 12.4억', lastSeoulX - 8, lastSeoulY - 8);
  }

  // 초기 로드 시 차트 렌더링
  window.addEventListener('resize', renderTrendChart);
});
