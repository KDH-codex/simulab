/**
 * ==========================================================================
 * SimuLab Analytics Hub - 커피값 기회비용 계산기 UI 컨트롤러
 * 파일 경로: tools/coffee-opportunity-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 설명]
 * - 일상에서 무심코 쓴 소액(커피, 배달료 등)을 주식 투자와 연결하여
 *   얼마나 큰 자산으로 불어날 수 있었는지 시각적으로 체감하게 해줍니다.
 * - 프리미엄 인풋 카드, 실시간 한글 금액 읽기, 퀵 칩 원터치 조절을 지원합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const CoffeeCalc = SimuLab.CoffeeOpportunity || {};

  let currentInputs = { ...CoffeeCalc.DEFAULT_COFFEE_INPUTS };
  let coffeeChartInstance = null;

  function getEl(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    const el = getEl(id);
    if (el) el.textContent = text;
  }

  function formatMoney(amount) {
    return SimuLab.formatCurrency ? SimuLab.formatCurrency(amount) : `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  function formatMoneyCompact(amount) {
    return SimuLab.formatCurrency ? SimuLab.formatCurrency(amount, true) : `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  /**
   * 1. UI 입력값 동기화
   */
  function readInputsFromUI() {
    return {
      dailyExpense: Number(getEl('daily-expense-input')?.value) || 4500,
      frequency: getEl('frequency-select')?.value || 'everyday',
      targetSymbol: getEl('target-symbol-select')?.value || 'TQQQ',
      durationYears: Number(getEl('duration-years-select')?.value) || 5,
    };
  }

  function syncInputsToUI(inputs) {
    if (getEl('daily-expense-input')) getEl('daily-expense-input').value = inputs.dailyExpense;
    if (getEl('daily-expense-slider')) getEl('daily-expense-slider').value = inputs.dailyExpense;
    if (getEl('frequency-select')) getEl('frequency-select').value = inputs.frequency;
    if (getEl('target-symbol-select')) getEl('target-symbol-select').value = inputs.targetSymbol;
    if (getEl('duration-years-select')) getEl('duration-years-select').value = inputs.durationYears;

    updateBadges(inputs);
    if (SimuLab.initAllSlidersProgress) SimuLab.initAllSlidersProgress();
  }

  function updateBadges(inputs) {
    if (SimuLab.formatKoreanAmount) {
      setText('badge-daily-expense', SimuLab.formatKoreanAmount(inputs.dailyExpense));
    }
  }

  /**
   * 2. 차트 렌더링 (Chart.js)
   */
  function renderCoffeeChart(yearlyHistory) {
    const canvas = getEl('coffee-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = yearlyHistory.map((d) => `${d.year}년차`);
    const spentData = yearlyHistory.map((d) => Math.round(d.investedPrincipal / 10000));
    const accumulatedData = yearlyHistory.map((d) => Math.round(d.accumulatedCapital / 10000));

    if (coffeeChartInstance) {
      coffeeChartInstance.destroy();
    }

    coffeeChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: '주식 투자 평가액 (만원)',
            data: accumulatedData,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderWidth: 2.5,
            tension: 0.2,
            fill: true,
            yAxisID: 'y',
          },
          {
            type: 'bar',
            label: '단순 커피 지출액 (만원)',
            data: spentData,
            backgroundColor: '#cbd5e1',
            borderRadius: 4,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Pretendard, sans-serif', size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return `${ctx.dataset.label}: ${ctx.raw.toLocaleString('ko-KR')}만원`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            ticks: {
              callback: (val) => `${val.toLocaleString()}만`,
            },
          },
        },
      },
    });
  }

  /**
   * 3. 실물 환산 배지 렌더링
   */
  function renderRealItems(items) {
    const container = getEl('real-item-list');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">환산 가능한 주요 실물이 아직 없습니다.</div>';
      return;
    }

    container.innerHTML = items
      .map(
        (it) => `
        <div style="padding: 0.6rem 0.9rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500;">${it.name}</span>
          <strong style="font-size: 0.95rem; color: var(--primary-color);">${it.count}${it.unitName} 구매 가능</strong>
        </div>
      `
      )
      .join('');
  }

  /**
   * 4. 연도별 테이블 렌더링
   */
  function renderYearlyTable(history) {
    const tbody = getEl('yearly-table-body');
    if (!tbody) return;

    tbody.innerHTML = history
      .map(
        (d) => `
        <tr>
          <td style="text-align: center;">${d.year}년차</td>
          <td style="text-align: right;">${formatMoney(d.investedPrincipal)}</td>
          <td style="text-align: right; font-weight: 600; color: var(--primary-color);">${formatMoney(d.accumulatedCapital)}</td>
          <td style="text-align: right; color: #10b981;">+${formatMoney(d.profit)}</td>
          <td style="text-align: right; font-weight: 600; color: #10b981;">+${d.roi}%</td>
        </tr>
      `
      )
      .join('');
  }

  /**
   * 5. 메인 시뮬레이션 실행 및 결과 반영
   */
  function runSimulation() {
    currentInputs = readInputsFromUI();
    updateBadges(currentInputs);

    const result = CoffeeCalc.calculateCoffeeOpportunity(currentInputs);
    const s = result.summary;

    // 1) Verdict 배너 갱신
    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      verdictText.innerHTML = `
        당신이 지난 ${s.durationYears}년간 마신 ${formatMoney(s.dailyExpense)} 커피 <strong>${s.totalCups.toLocaleString()}잔</strong>(총 ${formatMoneyCompact(s.totalSpent)})은 사실 미래 가치로 환산하면 한 잔에 <strong>${formatMoney(s.futureCostPerCup)}</strong>짜리였습니다!<br/>
        만약 이 돈을 <strong>${s.targetSymbolName}</strong>에 적립 투자했다면 현재 <strong>${formatMoneyCompact(s.finalAccumulated)}</strong>(+${s.totalRoi}%)이 되었습니다.
      `;
      if (verdictBanner) verdictBanner.style.borderColor = '#2563eb';
    }

    // 2) 요약 카드 4종 갱신
    setText('card-total-spent', formatMoneyCompact(s.totalSpent));
    setText('card-final-accumulated', formatMoneyCompact(s.finalAccumulated));
    setText('card-total-profit', `+${formatMoneyCompact(s.totalProfit)}`);
    setText('card-future-cup-cost', formatMoney(s.futureCostPerCup));

    // 세부 배지
    setText('stat-monthly-save', formatMoney(s.monthlyContribution));
    setText('stat-total-cups', `${s.totalCups.toLocaleString()}잔`);
    setText('stat-cagr', `연 ${s.annualReturnPct}%`);
    setText('stat-total-roi', `+${s.totalRoi}%`);

    // 3) 차트 및 실물 환산, 테이블
    renderCoffeeChart(result.yearlyHistory);
    renderRealItems(result.realItemConversions);
    renderYearlyTable(result.yearlyHistory);

    // 4) 상태 저장
    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('coffee-opportunity-calc', currentInputs);
    }
  }

  /**
   * 6. 이벤트 리스너 바인딩
   */
  function bindEvents() {
    const inputEl = getEl('daily-expense-input');
    const sliderEl = getEl('daily-expense-slider');
    if (inputEl && sliderEl) {
      inputEl.addEventListener('input', () => {
        sliderEl.value = inputEl.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(sliderEl);
        runSimulation();
      });
      sliderEl.addEventListener('input', () => {
        inputEl.value = sliderEl.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(sliderEl);
        runSimulation();
      });
    }

    ['frequency-select', 'target-symbol-select', 'duration-years-select'].forEach((id) => {
      const el = getEl(id);
      if (el) el.addEventListener('change', runSimulation);
    });

    // 소비 항목 퀵 프리셋 버튼
    document.querySelectorAll('[data-expense-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-expense-preset'));
        if (Number.isFinite(val)) {
          if (inputEl) inputEl.value = val;
          if (sliderEl) {
            sliderEl.value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(sliderEl);
          }
          runSimulation();
        }
      });
    });

    // 소비 금액 퀵 증감 버튼
    document.querySelectorAll('[data-expense-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-expense-add')) || 0;
        if (inputEl) {
          const curVal = Number(inputEl.value) || 0;
          const nextVal = Math.max(500, curVal + addVal);
          inputEl.value = nextVal;
          if (sliderEl) {
            sliderEl.value = nextVal;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(sliderEl);
          }
          runSimulation();
        }
      });
    });

    // 공유 버튼
    const shareBtn = getEl('share-btn');
    if (shareBtn && SimuLab.shareSimulationUrl) {
      shareBtn.addEventListener('click', () => {
        SimuLab.shareSimulationUrl(readInputsFromUI());
      });
    }

    // CSV 내보내기 버튼
    const csvBtn = getEl('export-csv-btn');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const result = CoffeeCalc.calculateCoffeeOpportunity(readInputsFromUI());
        const headers = ['연차', '누적커피소비액', '주식투자평가액', '투자수익금', '수익률(%)'];
        const rows = result.yearlyHistory.map((d) => [
          `${d.year}년차`,
          d.investedPrincipal,
          d.accumulatedCapital,
          d.profit,
          `${d.roi}%`,
        ]);
        if (SimuLab.exportTableToCsv) {
          SimuLab.exportTableToCsv('커피값_기회비용_시뮬레이션.csv', headers, rows);
        }
      });
    }
  }

  /**
   * 7. 초기화
   */
  function init() {
    if (SimuLab.initCommonUI) {
      SimuLab.initCommonUI('coffee-opportunity-calc');
    }

    let initialValues = { ...CoffeeCalc.DEFAULT_COFFEE_INPUTS };
    if (SimuLab.parseUrlParams) {
      initialValues = SimuLab.parseUrlParams(initialValues);
    } else if (SimuLab.loadToolState) {
      const saved = SimuLab.loadToolState('coffee-opportunity-calc');
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
