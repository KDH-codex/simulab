/**
 * ==========================================================================
 * SimuLab Analytics Hub - 과거 물가 현재 환산 계산기 UI 컨트롤러
 * 파일 경로: tools/inflation-purchasing-power-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 설명]
 * - 과거 특정 연도와 금액을 입력하면 한국은행 공식 CPI 시계열 지표를 바탕으로
 *   현재 가치와 구매력 하락률을 계산하고 시대별 물가표를 렌더링합니다.
 * - 프리미엄 인풋 카드, 실시간 한글 금액 읽기, 퀵 칩 원터치 조절을 지원합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const InfCalc = SimuLab.InflationPurchasingPower || {};

  let currentInputs = { ...InfCalc.DEFAULT_INFLATION_INPUTS };
  let inflationChartInstance = null;

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
      baseYear: Number(getEl('base-year-select')?.value) || 2000,
      baseAmount: Number(getEl('base-amount-input')?.value) || 10000000,
    };
  }

  function syncInputsToUI(inputs) {
    if (getEl('base-year-select')) getEl('base-year-select').value = inputs.baseYear;
    if (getEl('base-amount-input')) getEl('base-amount-input').value = inputs.baseAmount;
    if (getEl('base-amount-slider')) getEl('base-amount-slider').value = inputs.baseAmount;

    updateBadges(inputs);
    if (SimuLab.initAllSlidersProgress) SimuLab.initAllSlidersProgress();
  }

  function updateBadges(inputs) {
    if (SimuLab.formatKoreanAmount) {
      setText('badge-base-amount', SimuLab.formatKoreanAmount(inputs.baseAmount));
    }
  }

  /**
   * 2. 연도 드롭다운 옵션 채우기
   */
  function populateYearSelect() {
    const select = getEl('base-year-select');
    if (!select || !InfCalc.KOREA_CPI_HISTORY) return;

    const years = Object.keys(InfCalc.KOREA_CPI_HISTORY)
      .map(Number)
      .filter((y) => y <= 2025)
      .sort((a, b) => b - a);

    select.innerHTML = years
      .map((y) => `<option value="${y}" ${y === 2000 ? 'selected' : ''}>${y}년 (${y === 2000 ? '밀레니엄 2000' : `${2026 - y}년 전`})</option>`)
      .join('');
  }

  /**
   * 3. 차트 렌더링
   */
  function renderInflationChart(timelineData) {
    const canvas = getEl('inflation-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = timelineData.map((d) => `${d.year}년`);
    const values = timelineData.map((d) => Math.round(d.value / 10000)); // 만원 단위

    if (inflationChartInstance) {
      inflationChartInstance.destroy();
    }

    inflationChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '물가상승 반영 환산 가치 (만원)',
            data: values,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.2,
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
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString('ko-KR')}만원`,
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
   * 4. 시대별 대표 물가 테이블 렌더링
   */
  function renderRealPriceTable(items) {
    const tbody = getEl('real-price-table-body');
    if (!tbody) return;

    tbody.innerHTML = items
      .map(
        (it) => `
        <tr>
          <td style="padding: 0.6rem; font-weight: 600;">${it.name}</td>
          <td style="padding: 0.6rem; text-align: right;">${formatMoney(it.y1980)}</td>
          <td style="padding: 0.6rem; text-align: right;">${formatMoney(it.y1990)}</td>
          <td style="padding: 0.6rem; text-align: right;">${formatMoney(it.y2000)}</td>
          <td style="padding: 0.6rem; text-align: right;">${formatMoney(it.y2010)}</td>
          <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: var(--primary-color);">${formatMoney(it.y2026)}</td>
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

    const result = InfCalc.calculateInflationPurchasingPower(currentInputs);
    const s = result.summary;

    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      verdictText.innerHTML = `
        <strong>${s.baseYear}년의 ${formatMoneyCompact(s.baseAmount)}</strong>은 2026년 현재 물가 기준 <strong>${formatMoneyCompact(s.currentValue)}</strong>의 구매력 가치를 갖습니다 (약 <strong>${s.inflationMultiplier}배</strong> 상승).<br/>
        동일한 기간 동안 원화의 실질 구매력은 <strong>-${s.purchasingLossPct}% 하락</strong>했으며, 현금만 보유하고 있었다면 구매력의 절반 이상이 사라진 셈입니다.
      `;
      if (verdictBanner) verdictBanner.style.borderColor = '#2563eb';
    }

    // 요약 카드 4종
    setText('card-current-value', formatMoneyCompact(s.currentValue));
    setText('card-inflation-mult', `${s.inflationMultiplier}배`);
    setText('card-purchasing-loss', `-${s.purchasingLossPct}%`);
    setText('card-inflation-cagr', `연 ${s.inflationCagr}%`);

    // 세부 배지
    setText('stat-years-elapsed', `${s.yearsElapsed}년 경과`);
    setText('stat-base-cpi', `CPI ${s.baseCpi}`);
    setText('stat-current-cpi', `CPI ${s.currentCpi}`);
    setText('stat-asset-evaluation', s.yearsElapsed >= 20 ? '실물자산 투자 필수' : '물가 연동 방어');

    renderInflationChart(result.timelineData);
    renderRealPriceTable(result.realPriceHistory);

    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('inflation-purchasing-power-calc', currentInputs);
    }
  }

  /**
   * 6. 이벤트 바인딩
   */
  function bindEvents() {
    const amtInput = getEl('base-amount-input');
    const amtSlider = getEl('base-amount-slider');
    if (amtInput && amtSlider) {
      amtInput.addEventListener('input', () => {
        amtSlider.value = amtInput.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(amtSlider);
        runSimulation();
      });
      amtSlider.addEventListener('input', () => {
        amtInput.value = amtSlider.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(amtSlider);
        runSimulation();
      });
    }

    const yrSelect = getEl('base-year-select');
    if (yrSelect) yrSelect.addEventListener('change', runSimulation);

    // 프리셋 버튼 (연도 + 금액)
    document.querySelectorAll('[data-inf-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const yr = Number(btn.getAttribute('data-preset-year'));
        const amt = Number(btn.getAttribute('data-preset-amt'));
        if (yrSelect) yrSelect.value = yr;
        if (amtInput) amtInput.value = amt;
        if (amtSlider) {
          amtSlider.value = amt;
          if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(amtSlider);
        }
        runSimulation();
      });
    });

    // 금액 단독 프리셋
    document.querySelectorAll('[data-amount-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const amt = Number(btn.getAttribute('data-amount-preset'));
        if (Number.isFinite(amt)) {
          if (amtInput) amtInput.value = amt;
          if (amtSlider) {
            amtSlider.value = amt;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(amtSlider);
          }
          runSimulation();
        }
      });
    });

    // 금액 퀵 증감
    document.querySelectorAll('[data-amount-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-amount-add')) || 0;
        if (amtInput) {
          const curVal = Number(amtInput.value) || 0;
          const nextVal = Math.max(10000, curVal + addVal);
          amtInput.value = nextVal;
          if (amtSlider) {
            amtSlider.value = nextVal;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(amtSlider);
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
  }

  /**
   * 7. 초기화
   */
  function init() {
    if (SimuLab.initCommonUI) {
      SimuLab.initCommonUI('inflation-purchasing-power-calc');
    }

    populateYearSelect();

    let initialValues = { ...InfCalc.DEFAULT_INFLATION_INPUTS };
    if (SimuLab.parseUrlParams) {
      initialValues = SimuLab.parseUrlParams(initialValues);
    } else if (SimuLab.loadToolState) {
      const saved = SimuLab.loadToolState('inflation-purchasing-power-calc');
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
