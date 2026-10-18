/**
 * ==========================================================================
 * SimuLab Analytics Hub - 시간당 실질 노동 가치 계산기 UI 컨트롤러
 * 파일 경로: tools/hourly-labor-value-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 설명]
 * - 월급, 출퇴근 시간, 직장 유지 비용을 입력받아 진짜 실질 시급을 계산하고,
 *   원하는 소비 품목을 사기 위해 내 인생의 몇 시간을 바쳐야 하는지 보여줍니다.
 * - 프리미엄 인풋 카드, 실시간 한글 금액 읽기, 퀵 칩 원터치 조절을 지원합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const LaborCalc = SimuLab.HourlyLaborValue || {};

  let currentInputs = { ...LaborCalc.DEFAULT_LABOR_INPUTS };
  let wageChartInstance = null;

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
      monthlySalary: Number(getEl('monthly-salary-input')?.value) || 3500000,
      weeklyWorkHours: Number(getEl('work-hours-input')?.value) || 40,
      commuteMinutesDaily: Number(getEl('commute-mins-input')?.value) || 90,
      weeklyOvertimeHours: Number(getEl('overtime-hours-input')?.value) || 4,
      monthlyJobExpenses: Number(getEl('job-expenses-input')?.value) || 450000,
      targetItemName: getEl('item-name-input')?.value || '최신 스마트폰',
      targetItemPrice: Number(getEl('item-price-input')?.value) || 1500000,
    };
  }

  function syncInputsToUI(inputs) {
    if (getEl('monthly-salary-input')) getEl('monthly-salary-input').value = inputs.monthlySalary;
    if (getEl('monthly-salary-slider')) getEl('monthly-salary-slider').value = inputs.monthlySalary;

    if (getEl('work-hours-input')) getEl('work-hours-input').value = inputs.weeklyWorkHours;
    if (getEl('commute-mins-input')) getEl('commute-mins-input').value = inputs.commuteMinutesDaily;
    if (getEl('commute-mins-slider')) getEl('commute-mins-slider').value = inputs.commuteMinutesDaily;

    if (getEl('overtime-hours-input')) getEl('overtime-hours-input').value = inputs.weeklyOvertimeHours;
    if (getEl('job-expenses-input')) getEl('job-expenses-input').value = inputs.monthlyJobExpenses;
    if (getEl('job-expenses-slider')) getEl('job-expenses-slider').value = inputs.monthlyJobExpenses;

    if (getEl('item-name-input')) getEl('item-name-input').value = inputs.targetItemName;
    if (getEl('item-price-input')) getEl('item-price-input').value = inputs.targetItemPrice;
    if (getEl('item-price-slider')) getEl('item-price-slider').value = inputs.targetItemPrice;

    updateBadges(inputs);
    if (SimuLab.initAllSlidersProgress) SimuLab.initAllSlidersProgress();
  }

  function updateBadges(inputs) {
    if (SimuLab.formatKoreanAmount) {
      setText('badge-monthly-salary', SimuLab.formatKoreanAmount(inputs.monthlySalary));
      setText('badge-job-expenses', SimuLab.formatKoreanAmount(inputs.monthlyJobExpenses));
      setText('badge-item-price', SimuLab.formatKoreanAmount(inputs.targetItemPrice));
    }
  }

  /**
   * 2. 차트 렌더링
   */
  function renderWageChart(nominal, netContract, real) {
    const canvas = getEl('wage-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (wageChartInstance) {
      wageChartInstance.destroy();
    }

    wageChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['명목 시급 (세전 209h)', '세후 시급 (계약시간)', '진짜 실질 시급 (출퇴근·비용 반영)'],
        datasets: [
          {
            label: '시간당 임금 (원)',
            data: [nominal, netContract, real],
            backgroundColor: ['#94a3b8', '#60a5fa', '#2563eb'],
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
              label: (ctx) => `${formatMoney(ctx.raw)}/시간`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            ticks: {
              callback: (val) => `${val.toLocaleString()}원`,
            },
          },
        },
      },
    });
  }

  /**
   * 3. 일상 품목 환산 목록 렌더링
   */
  function renderBenchmarkItems(items) {
    const container = getEl('benchmark-item-list');
    if (!container || !Array.isArray(items)) return;

    container.innerHTML = items
      .map(
        (it) => `
        <div style="padding: 0.75rem 1rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 0.9rem; color: var(--text-primary);">${it.name}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.4rem;">(${formatMoney(it.price)})</span>
          </div>
          <strong style="font-size: 0.95rem; color: var(--primary-color);">${it.text}</strong>
        </div>
      `
      )
      .join('');
  }

  /**
   * 4. 메인 시뮬레이션 실행 및 결과 반영
   */
  function runSimulation() {
    currentInputs = readInputsFromUI();
    updateBadges(currentInputs);

    const result = LaborCalc.calculateHourlyLaborValue(currentInputs);
    const s = result.summary;

    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      verdictText.innerHTML = `
        당신의 <strong>진짜 실질 시급은 ${formatMoney(s.realHourlyWage)}</strong>입니다 (명목 시급 ${formatMoney(s.nominalHourlyWage)} 대비 -${s.wageDiscountPct}%).<br/>
        따라서 <strong>${s.targetItemName}</strong>(${formatMoney(s.targetItemPrice)})을 구매하는 것은, 당신의 소중한 생명 시간 <strong>${s.targetHoursNeeded}시간 (약 ${s.targetDaysNeeded}일 근무)</strong>을 교환하는 것과 같습니다.
      `;
      if (verdictBanner) verdictBanner.style.borderColor = '#2563eb';
    }

    // 요약 카드 4종
    setText('card-real-wage', formatMoney(s.realHourlyWage));
    setText('card-nominal-wage', formatMoney(s.nominalHourlyWage));
    setText('card-item-hours', `${s.targetHoursNeeded}시간`);
    setText('card-item-days', `약 ${s.targetDaysNeeded}일치 근무`);

    // 세부 배지 (안전한 필드 매핑)
    const totalWeeklyHours = s.weeklyTotalDedicatedHours ?? s.totalWeeklyHours ?? 0;
    const disposableIncome = s.realDisposableIncome ?? s.monthlyDisposableRealIncome ?? 0;
    const netSalary = s.netSalary ?? s.monthlyNetSalary ?? 0;
    const netContractWage = s.netContractHourlyWage ?? s.contractNetHourlyWage ?? 0;

    setText('stat-total-weekly-hours', `${totalWeeklyHours}시간/주`);
    setText('stat-disposable-income', formatMoney(disposableIncome));
    setText('stat-wage-discount', `-${s.wageDiscountPct}%`);
    setText('stat-net-salary', formatMoney(netSalary));

    // 차트 및 벤치마크 품목 (benchmarkResults 또는 benchmarkItems 지원)
    renderWageChart(s.nominalHourlyWage, netContractWage, s.realHourlyWage);
    renderBenchmarkItems(result.benchmarkResults || result.benchmarkItems || []);

    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('hourly-labor-value-calc', currentInputs);
    }
  }

  /**
   * 5. 이벤트 리스너 바인딩
   */
  function bindEvents() {
    const pairs = [
      ['monthly-salary-input', 'monthly-salary-slider'],
      ['commute-mins-input', 'commute-mins-slider'],
      ['job-expenses-input', 'job-expenses-slider'],
      ['item-price-input', 'item-price-slider'],
    ];

    pairs.forEach(([inputId, sliderId]) => {
      const inputEl = getEl(inputId);
      const sliderEl = getEl(sliderId);
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
    });

    ['work-hours-input', 'overtime-hours-input', 'item-name-input'].forEach((id) => {
      const el = getEl(id);
      if (el) el.addEventListener('input', runSimulation);
    });

    // 월급 퀵 프리셋
    document.querySelectorAll('[data-salary-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-salary-preset'));
        if (Number.isFinite(val)) {
          if (getEl('monthly-salary-input')) getEl('monthly-salary-input').value = val;
          if (getEl('monthly-salary-slider')) {
            getEl('monthly-salary-slider').value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(getEl('monthly-salary-slider'));
          }
          runSimulation();
        }
      });
    });

    // 월급 퀵 증감
    document.querySelectorAll('[data-salary-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-salary-add')) || 0;
        const inputEl = getEl('monthly-salary-input');
        const sliderEl = getEl('monthly-salary-slider');
        const curVal = Number(inputEl?.value) || 0;
        const nextVal = Math.max(0, curVal + addVal);
        if (inputEl) inputEl.value = nextVal;
        if (sliderEl) {
          sliderEl.value = nextVal;
          if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(sliderEl);
        }
        runSimulation();
      });
    });

    // 출퇴근 시간 퀵 설정
    document.querySelectorAll('[data-commute-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-commute-set'));
        if (Number.isFinite(val)) {
          if (getEl('commute-mins-input')) getEl('commute-mins-input').value = val;
          if (getEl('commute-mins-slider')) {
            getEl('commute-mins-slider').value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(getEl('commute-mins-slider'));
          }
          runSimulation();
        }
      });
    });

    // 출퇴근 시간 퀵 증감
    document.querySelectorAll('[data-commute-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-commute-add')) || 0;
        const inputEl = getEl('commute-mins-input');
        const sliderEl = getEl('commute-mins-slider');
        const curVal = Number(inputEl?.value) || 0;
        const nextVal = Math.max(0, curVal + addVal);
        if (inputEl) inputEl.value = nextVal;
        if (sliderEl) {
          sliderEl.value = nextVal;
          if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(sliderEl);
        }
        runSimulation();
      });
    });

    // 직장 유지 비용 퀵 설정
    document.querySelectorAll('[data-expense-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-expense-set'));
        if (Number.isFinite(val)) {
          if (getEl('job-expenses-input')) getEl('job-expenses-input').value = val;
          if (getEl('job-expenses-slider')) {
            getEl('job-expenses-slider').value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(getEl('job-expenses-slider'));
          }
          runSimulation();
        }
      });
    });

    // 직장 유지 비용 퀵 증감
    document.querySelectorAll('[data-expense-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-expense-add')) || 0;
        const inputEl = getEl('job-expenses-input');
        const sliderEl = getEl('job-expenses-slider');
        const curVal = Number(inputEl?.value) || 0;
        const nextVal = Math.max(0, curVal + addVal);
        if (inputEl) inputEl.value = nextVal;
        if (sliderEl) {
          sliderEl.value = nextVal;
          if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(sliderEl);
        }
        runSimulation();
      });
    });

    // 품목 가격 퀵 설정
    document.querySelectorAll('[data-item-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-item-set'));
        if (Number.isFinite(val)) {
          if (getEl('item-price-input')) getEl('item-price-input').value = val;
          if (getEl('item-price-slider')) {
            getEl('item-price-slider').value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(getEl('item-price-slider'));
          }
          runSimulation();
        }
      });
    });

    // 품목 가격 퀵 증감
    document.querySelectorAll('[data-item-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-item-add')) || 0;
        const inputEl = getEl('item-price-input');
        const sliderEl = getEl('item-price-slider');
        const curVal = Number(inputEl?.value) || 0;
        const nextVal = Math.max(0, curVal + addVal);
        if (inputEl) inputEl.value = nextVal;
        if (sliderEl) {
          sliderEl.value = nextVal;
          if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(sliderEl);
        }
        runSimulation();
      });
    });

    const shareBtn = getEl('share-btn');
    if (shareBtn && SimuLab.shareSimulationUrl) {
      shareBtn.addEventListener('click', () => {
        SimuLab.shareSimulationUrl(readInputsFromUI());
      });
    }
  }

  function init() {
    if (SimuLab.initCommonUI) {
      SimuLab.initCommonUI('hourly-labor-value-calc');
    }

    let initialValues = { ...LaborCalc.DEFAULT_LABOR_INPUTS };
    if (SimuLab.parseUrlParams) {
      initialValues = SimuLab.parseUrlParams(initialValues);
    } else if (SimuLab.loadToolState) {
      const saved = SimuLab.loadToolState('hourly-labor-value-calc');
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
