/**
 * ==========================================================================
 * SimuLab Analytics Hub - 매도 후 상승분 & 손실 방어 계산기 UI 컨트롤러
 * 파일 경로: tools/missed-investment-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 설명]
 * - 내가 매도했던 종목(60종 시세 연동)의 매도가와 수량을 입력하면,
 *   현재 시세와 비교하여 놓친 상승분이나 하락 방어 성공액을 계산합니다.
 * - 프리미엄 인풋 카드, 퀵 칩 원터치 조절, 통화 심볼 자동 동기화를 지원합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const MissedCalc = SimuLab.MissedInvestment || {};
  const MarketData = SimuLab.MarketData || {};

  let currentInputs = { ...MissedCalc.DEFAULT_MISSED_INPUTS };
  let comparisonChartInstance = null;

  function getEl(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    const el = getEl(id);
    if (el) el.textContent = text;
  }

  function formatMoney(amount, currency = '원') {
    if (currency === '$') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return SimuLab.formatCurrency ? SimuLab.formatCurrency(amount) : `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  function formatMoneyCompact(amount, currency = '원') {
    if (currency === '$') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return SimuLab.formatCurrency ? SimuLab.formatCurrency(amount, true) : `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  /**
   * 1. 60종 종목 셀렉트박스 옵션 채우기
   */
  function populateSymbolSelect() {
    const select = getEl('symbol-select');
    if (!select || !MarketData.LEVERAGE_ETFS) return;

    const stocks = Object.values(MarketData.LEVERAGE_ETFS);
    const groups = {
      lev_10: { label: '레버리지 ETF 10종', items: [] },
      us_top20: { label: '미국 테크·대표 TOP 20', items: [] },
      kr_top20: { label: '국내 코스피·코스닥 TOP 20', items: [] },
      dividend10: { label: '대표 배당주 10종', items: [] },
    };

    stocks.forEach((s) => {
      if (groups[s.category]) {
        groups[s.category].items.push(s);
      }
    });

    select.innerHTML = Object.values(groups)
      .map(
        (g) => `
        <optgroup label="${g.label}">
          ${g.items.map((it) => `<option value="${it.symbol}" ${it.symbol === 'NVDA' ? 'selected' : ''}>${it.symbol} - ${it.name}</option>`).join('')}
        </optgroup>
      `
      )
      .join('');
  }

  /**
   * 2. 선택된 종목 시세 자동 반영
   */
  function onStockSelectionChange() {
    const symbol = getEl('symbol-select')?.value;
    if (!symbol || !MarketData.LEVERAGE_ETFS) return;

    const item = MarketData.LEVERAGE_ETFS[symbol];
    if (item && item.techSnapshot) {
      const snap = item.techSnapshot;

      if (getEl('currency-select')) getEl('currency-select').value = snap.currency;
      if (getEl('current-price-input')) getEl('current-price-input').value = snap.currentPrice;

      if (snap.monthlyPrices && snap.monthlyPrices.length > 0) {
        const pastPrice = snap.monthlyPrices[0];
        if (getEl('sold-price-input')) getEl('sold-price-input').value = pastPrice;
      }
    }
    runSimulation();
  }

  /**
   * 3. UI 입력값 읽기
   */
  function readInputsFromUI() {
    const symbol = getEl('symbol-select')?.value || 'NVDA';
    const currency = getEl('currency-select')?.value || '$';
    return {
      symbol,
      currency,
      soldPrice: Number(getEl('sold-price-input')?.value) || 50,
      currentPrice: Number(getEl('current-price-input')?.value) || 138,
      quantity: Number(getEl('quantity-input')?.value) || 100,
      holdingYears: Number(getEl('holding-years-input')?.value) || 1,
      dividendYield: Number(getEl('dividend-yield-input')?.value) || 0,
      usdKrwRate: 1385,
    };
  }

  function syncInputsToUI(inputs) {
    if (getEl('symbol-select')) getEl('symbol-select').value = inputs.symbol;
    if (getEl('currency-select')) getEl('currency-select').value = inputs.currency;
    if (getEl('sold-price-input')) getEl('sold-price-input').value = inputs.soldPrice;
    if (getEl('current-price-input')) getEl('current-price-input').value = inputs.currentPrice;
    if (getEl('quantity-input')) getEl('quantity-input').value = inputs.quantity;
    if (getEl('quantity-slider')) getEl('quantity-slider').value = inputs.quantity;
    if (getEl('holding-years-input')) getEl('holding-years-input').value = inputs.holdingYears;
    if (getEl('dividend-yield-input')) getEl('dividend-yield-input').value = inputs.dividendYield;

    updateBadges(inputs);
    if (SimuLab.initAllSlidersProgress) SimuLab.initAllSlidersProgress();
  }

  function updateBadges(inputs) {
    setText('badge-quantity', `${inputs.quantity.toLocaleString('ko-KR')}주`);
    const curr = inputs.currency || '$';
    setText('unit-sold-price', curr);
    setText('unit-current-price', curr);
  }

  /**
   * 4. 차트 렌더링
   */
  function renderComparisonChart(soldTotal, currentTotal, currency) {
    const canvas = getEl('comparison-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (comparisonChartInstance) {
      comparisonChartInstance.destroy();
    }

    const isGainMissed = currentTotal >= soldTotal;

    comparisonChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['매도 당시 회수금', '현재까지 보유 시 평가액'],
        datasets: [
          {
            label: '금액',
            data: [soldTotal, currentTotal],
            backgroundColor: ['#94a3b8', isGainMissed ? '#2563eb' : '#ef4444'],
            borderRadius: 6,
            barThickness: 45,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${formatMoney(ctx.raw, currency)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            ticks: {
              callback: (val) => `${val.toLocaleString()}${currency}`,
            },
          },
        },
      },
    });
  }

  /**
   * 5. 메인 시뮬레이션 실행 및 결과 반영
   */
  function runSimulation() {
    currentInputs = readInputsFromUI();
    updateBadges(currentInputs);

    const result = MissedCalc.calculateMissedInvestment(currentInputs);
    const s = result.summary;

    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      if (s.isGainMissed) {
        verdictText.innerHTML = `
          <strong>놓친 상승분: ${formatMoney(s.totalDiff, s.currency)}</strong> (+${s.changePct}%)<br/>
          당시 매도하여 ${formatMoney(s.soldTotal, s.currency)}을 회수하셨으나, 지금까지 보유했다면 현재 <strong>${formatMoney(s.currentTotal, s.currency)}</strong>(원화 약 ${SimuLab.formatCurrency ? SimuLab.formatCurrency(s.currentTotalKrw, true) : ''})이 되었습니다.<br/>
          <span style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem; display: inline-block;">${s.psychologicalNote}</span>
        `;
        if (verdictBanner) verdictBanner.style.borderColor = '#2563eb';
      } else {
        verdictText.innerHTML = `
          <strong>방어한 손실금: ${formatMoney(Math.abs(s.totalDiff), s.currency)}</strong> (${s.changePct}%)<br/>
          탁월한 판단이었습니다! 당시 ${formatMoney(s.soldTotal, s.currency)}에 매도하여 후속 하락(${formatMoney(s.currentTotal, s.currency)})을 피하고 소중한 투자금을 성공적으로 지켜내셨습니다.<br/>
          <span style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem; display: inline-block;">${s.psychologicalNote}</span>
        `;
        if (verdictBanner) verdictBanner.style.borderColor = '#10b981';
      }
    }

    // 요약 카드 4종
    setText('card-sold-total', formatMoney(s.soldTotal, s.currency));
    setText('card-current-total', formatMoney(s.currentTotal, s.currency));
    setText('card-diff-total', `${s.totalDiff >= 0 ? '+' : ''}${formatMoney(s.totalDiff, s.currency)}`);
    setText('card-change-pct', `${s.changePct >= 0 ? '+' : ''}${s.changePct}%`);

    // 세부 배지
    setText('stat-price-diff', `${s.priceDiff >= 0 ? '+' : ''}${formatMoney(s.priceDiff, s.currency)}`);
    setText('stat-missed-div', formatMoney(s.missedDividends, s.currency));
    setText('stat-krw-diff', `${s.totalDiffKrw >= 0 ? '+' : ''}${SimuLab.formatCurrency ? SimuLab.formatCurrency(s.totalDiffKrw, true) : `${s.totalDiffKrw}원`}`);
    setText('stat-psy-note', s.isGainMissed ? '추가 상승분 발생' : '성공적 손실 방어');

    // 차트 렌더링
    renderComparisonChart(s.soldTotal, s.currentTotal, s.currency);

    // 상태 저장
    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('missed-investment-calc', currentInputs);
    }
  }

  /**
   * 6. 이벤트 리스너 바인딩
   */
  function bindEvents() {
    const symbolSelect = getEl('symbol-select');
    if (symbolSelect) {
      symbolSelect.addEventListener('change', onStockSelectionChange);
    }

    const qtyInput = getEl('quantity-input');
    const qtySlider = getEl('quantity-slider');
    if (qtyInput && qtySlider) {
      qtyInput.addEventListener('input', () => {
        qtySlider.value = qtyInput.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(qtySlider);
        runSimulation();
      });
      qtySlider.addEventListener('input', () => {
        qtyInput.value = qtySlider.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(qtySlider);
        runSimulation();
      });
    }

    // 수량 퀵 프리셋
    document.querySelectorAll('[data-qty-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-qty-preset'));
        if (Number.isFinite(val)) {
          if (qtyInput) qtyInput.value = val;
          if (qtySlider) {
            qtySlider.value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(qtySlider);
          }
          runSimulation();
        }
      });
    });

    // 수량 퀵 증감
    document.querySelectorAll('[data-qty-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-qty-add')) || 0;
        if (qtyInput) {
          const curVal = Number(qtyInput.value) || 0;
          const nextVal = Math.max(1, curVal + addVal);
          qtyInput.value = nextVal;
          if (qtySlider) {
            qtySlider.value = nextVal;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(qtySlider);
          }
          runSimulation();
        }
      });
    });

    ['sold-price-input', 'current-price-input', 'holding-years-input', 'dividend-yield-input'].forEach((id) => {
      const el = getEl(id);
      if (el) el.addEventListener('input', runSimulation);
    });

    const currencySelect = getEl('currency-select');
    if (currencySelect) {
      currencySelect.addEventListener('change', () => {
        updateBadges(readInputsFromUI());
        runSimulation();
      });
    }

    // 공유 버튼
    const shareBtn = getEl('share-btn');
    if (shareBtn && SimuLab.shareSimulationUrl) {
      shareBtn.addEventListener('click', () => {
        SimuLab.shareSimulationUrl(readInputsFromUI());
      });
    }
  }

  /**
   * 7. 초기화
   */
  function init() {
    if (SimuLab.initCommonUI) {
      SimuLab.initCommonUI('missed-investment-calc');
    }

    populateSymbolSelect();

    let initialValues = { ...MissedCalc.DEFAULT_MISSED_INPUTS };
    if (SimuLab.parseUrlParams) {
      initialValues = SimuLab.parseUrlParams(initialValues);
    } else if (SimuLab.loadToolState) {
      const saved = SimuLab.loadToolState('missed-investment-calc');
      if (saved && saved.currentInputs) initialValues = { ...initialValues, ...saved.currentInputs };
    }

    syncInputsToUI(initialValues);
    bindEvents();
    runSimulation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
