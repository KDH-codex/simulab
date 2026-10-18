/**
 * ==========================================================================
 * [도구 2] 부동산·주택담보대출 상환 & LTV·DSR 법적 한도 시뮬레이터 - UI 컨트롤러
 * 파일 경로: tools/loan-mortgage-calc/app.js
 * ==========================================================================
 */

(function () {
  'use strict';

  const {
    initCommonUI,
    formatCurrency,
    updateSliderProgress,
    parseUrlParams,
    shareSimulationUrl,
    saveToolState,
    loadToolState,
    exportCanvasToPng,
    exportDataToCsv,
    showToast,
    renderLineChart,
    getThemeChartColors,
    injectSeoSchema,
  } = window.SimuLab;

  const {
    DEFAULT_LOAN_INPUTS,
    sanitizeLoanInputs,
    calculateLoanSimulation,
  } = window.SimuLab.LoanLogic;

  const TOOL_ID = 'loan-mortgage-calc';

  let state = {
    currentInputs: { ...DEFAULT_LOAN_INPUTS },
    pinnedScenario: null,
    lastResult: null,
    chartViewMode: 'monthly',
  };

  let rafPending = false;

  function bootstrap() {
    initCommonUI(TOOL_ID);

    injectSeoSchema({
      name: '부동산·주택담보대출 상환(원리금균등·원금균등·만기일시) & LTV·DSR 한도 계산기',
      description:
        '네이버 대출계산기 표준 공식(원리금균등, 원금균등, 만기일시, 거치기간)과 대한민국 LTV·스트레스 DSR 40% 법적 최대 대출 한도를 동시에 시뮬레이션하는 무료 금융 계산기',
      category: 'FinanceApplication',
    });

    const savedState = loadToolState(TOOL_ID);
    if (savedState && savedState.currentInputs) {
      state.currentInputs = sanitizeLoanInputs(savedState.currentInputs);
      if (savedState.pinnedScenario) {
        state.pinnedScenario = savedState.pinnedScenario;
      }
    }
    if (window.location.search) {
      state.currentInputs = sanitizeLoanInputs(parseUrlParams(state.currentInputs));
    }

    syncInputsToDOM(state.currentInputs);
    bindEvents();
    runSimulationAndRender();
  }

  function syncInputsToDOM(inputs) {
    const fields = [
      { key: 'propertyPrice', scale: 0.0001 },
      { key: 'loanAmount', scale: 0.0001 },
      { key: 'annualInterestRate', scale: 1 },
      { key: 'loanYears', scale: 1 },
      { key: 'graceMonths', scale: 1 },
      { key: 'annualIncome', scale: 0.0001 },
      { key: 'existingAnnualDebtService', scale: 0.0001 },
      { key: 'stressRatePct', scale: 1 },
    ];

    fields.forEach(({ key, scale }) => {
      const displayVal = Math.round(inputs[key] * scale * 100) / 100;
      const slider = document.getElementById(`slider-${key}`);
      const numInput = document.getElementById(`input-${key}`);
      if (slider) {
        slider.value = String(displayVal);
        updateSliderProgress(slider);
      }
      if (numInput) numInput.value = String(displayVal);
    });

    const typeBtns = document.querySelectorAll('[data-repayment]');
    typeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-repayment') === inputs.repaymentType);
    });

    const ltvBtns = document.querySelectorAll('[data-ltv]');
    ltvBtns.forEach((btn) => {
      btn.classList.toggle('active', Number(btn.getAttribute('data-ltv')) === inputs.ltvLimitPct);
    });

    const dsrBtns = document.querySelectorAll('[data-dsr]');
    dsrBtns.forEach((btn) => {
      btn.classList.toggle('active', Number(btn.getAttribute('data-dsr')) === inputs.dsrLimitPct);
    });
  }

  function bindEvents() {
    const fields = [
      { key: 'propertyPrice', toRaw: (v) => Number(v) * 10000 },
      { key: 'loanAmount', toRaw: (v) => Number(v) * 10000 },
      { key: 'annualInterestRate', toRaw: (v) => Number(v) },
      { key: 'loanYears', toRaw: (v) => Number(v) },
      { key: 'graceMonths', toRaw: (v) => Number(v) },
      { key: 'annualIncome', toRaw: (v) => Number(v) * 10000 },
      { key: 'existingAnnualDebtService', toRaw: (v) => Number(v) * 10000 },
      { key: 'stressRatePct', toRaw: (v) => Number(v) },
    ];

    fields.forEach(({ key, toRaw }) => {
      const slider = document.getElementById(`slider-${key}`);
      const numInput = document.getElementById(`input-${key}`);

      const handleUpdate = (sourceEl, targetEl) => {
        if (targetEl) targetEl.value = sourceEl.value;
        if (slider) updateSliderProgress(slider);
        state.currentInputs[key] = toRaw(sourceEl.value);
        scheduleRender();
      };

      if (slider) {
        slider.addEventListener('input', () => handleUpdate(slider, numInput));
      }
      if (numInput) {
        numInput.addEventListener('input', () => handleUpdate(numInput, slider));
      }
    });

    const typeBtns = document.querySelectorAll('[data-repayment]');
    typeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentInputs.repaymentType = btn.getAttribute('data-repayment');
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
      });
    });

    const ltvBtns = document.querySelectorAll('[data-ltv]');
    ltvBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentInputs.ltvLimitPct = Number(btn.getAttribute('data-ltv'));
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
      });
    });

    const dsrBtns = document.querySelectorAll('[data-dsr]');
    dsrBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentInputs.dsrLimitPct = Number(btn.getAttribute('data-dsr'));
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
      });
    });

    const chartViewBtns = document.querySelectorAll('[data-chart-view]');
    chartViewBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.chartViewMode = btn.getAttribute('data-chart-view') || 'monthly';
        chartViewBtns.forEach((b) =>
          b.classList.toggle('active', b.getAttribute('data-chart-view') === state.chartViewMode)
        );
        scheduleRender();
      });
    });

    const pinBtn = document.getElementById('btn-pin-scenario');
    if (pinBtn) {
      pinBtn.addEventListener('click', () => {
        if (!state.lastResult) return;

        if (state.pinnedScenario) {
          state.pinnedScenario = null;
          pinBtn.textContent = '현재 조건 고정 (Case A 비교)';
          showToast('고정된 대출 비교 조건(Case A)이 해제되었습니다.');
        } else {
          const { inputs, summary } = state.lastResult;
          const typeLabel =
            inputs.repaymentType === 'equal_principal'
              ? '원금균등'
              : inputs.repaymentType === 'bullet'
              ? '만기일시'
              : '원리금균등';
          state.pinnedScenario = {
            label: `고정(Case A): ${formatCurrency(inputs.loanAmount, true)} · ${inputs.annualInterestRate}% (${typeLabel})`,
            totalInterest: summary.totalInterest,
            firstMonthPayment: summary.firstMonthPayment,
            stressedDsrPct: Number(summary.stressedDsrPct.toFixed(1)),
          };
          pinBtn.textContent = '고정 조건(Case A) 해제';
          showToast('현재 대출 조건이 Case A로 고정되었습니다. 금리나 기간을 바꿔 비교해 보세요.');
        }

        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        scheduleRender();
      });
    }

    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.currentInputs = { ...DEFAULT_LOAN_INPUTS };
        state.pinnedScenario = null;
        const pinBtnEl = document.getElementById('btn-pin-scenario');
        if (pinBtnEl) pinBtnEl.textContent = '현재 조건 고정 (Case A 비교)';
        syncInputsToDOM(state.currentInputs);
        saveToolState(TOOL_ID, state.currentInputs, null);
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch (e) {}
        scheduleRender();
        showToast('모든 대출 입력값이 초기값으로 재설정되었습니다.');
      });
    }

    const shareBtn = document.getElementById('btn-share-url');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        shareSimulationUrl(state.currentInputs);
      });
    }

    const pngBtn = document.getElementById('btn-export-png');
    if (pngBtn) {
      pngBtn.addEventListener('click', () => {
        const canvas = document.getElementById('sim-canvas');
        exportCanvasToPng(canvas, 'mortgage-loan-repayment-chart.png');
      });
    }

    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        if (!state.lastResult) return;
        const headers = [
          '연차',
          '월평균 납입금(원)',
          '연간 상환원금(원)',
          '연간 납부이자(원)',
          '연간 총상환액(원)',
          '누적 납부이자(원)',
          '기말 대출잔액(원)',
        ];
        const rows = state.lastResult.yearlyTable.map((r) => [
          `${r.year}년차`,
          r.avgMonthlyPayment,
          r.annualPrincipal,
          r.annualInterest,
          r.annualTotalPayment,
          r.cumulativeInterest,
          r.remainingBalance,
        ]);
        exportDataToCsv(headers, rows, 'loan-repayment-schedule.csv');
      });
    }

    // 퀵 조절 칩 버튼 이벤트 처리
    document.querySelectorAll('.quick-chip-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const inputEl = document.getElementById(targetId);
        if (!inputEl) return;

        let curVal = Number(inputEl.value) || 0;
        if (btn.hasAttribute('data-add')) {
          curVal += Number(btn.getAttribute('data-add'));
        } else if (btn.hasAttribute('data-set')) {
          curVal = Number(btn.getAttribute('data-set'));
        }

        if (inputEl.min && curVal < Number(inputEl.min)) curVal = Number(inputEl.min);
        if (inputEl.max && curVal > Number(inputEl.max)) curVal = Number(inputEl.max);

        inputEl.value = Math.round(curVal * 100) / 100;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  }

  function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      runSimulationAndRender();
    });
  }

  function runSimulationAndRender() {
    const result = calculateLoanSimulation(state.currentInputs);
    state.lastResult = result;
    const { inputs, summary, comparison, chartData, yearlyTable } = result;

    setText('badge-propertyPrice', formatCurrency(inputs.propertyPrice, true));
    setText('badge-loanAmount', formatCurrency(inputs.loanAmount, true));
    setText('badge-annualInterestRate', `${inputs.annualInterestRate.toFixed(2)}%`);
    setText('badge-loanYears', `${inputs.loanYears}년 (${inputs.loanYears * 12}개월)`);
    setText('badge-graceMonths', `${inputs.graceMonths}개월`);
    setText('badge-annualIncome', formatCurrency(inputs.annualIncome, true));
    setText('badge-existingAnnualDebtService', formatCurrency(inputs.existingAnnualDebtService, true));
    setText('badge-stressRatePct', `+${inputs.stressRatePct.toFixed(2)}%p`);

    setText('kpi-first-payment', formatCurrency(summary.firstMonthPayment, false));
    setText(
      'kpi-first-payment-sub',
      inputs.repaymentType === 'equal_principal'
        ? `마지막 달 납입금: ${formatCurrency(summary.lastMonthPayment, false)}`
        : inputs.repaymentType === 'bullet'
        ? `만기월 일시상환: ${formatCurrency(summary.lastMonthPayment, true)}`
        : `만기까지 매월 동일 금액 납부`
    );

    setText('kpi-total-interest', formatCurrency(summary.totalInterest, true));
    setText(
      'kpi-total-interest-sub',
      `원금균등 선택 시 원리금균등 대비 ${formatCurrency(summary.interestSavedByEqualPrincipal, true)} 절감`
    );

    const dsrEl = document.getElementById('kpi-dsr');
    if (dsrEl) {
      dsrEl.textContent = `${summary.stressedDsrPct.toFixed(1)}%`;
      dsrEl.className = `kpi-value ${summary.isDsrPassed ? 'text-success' : 'text-danger'}`;
    }
    setText(
      'kpi-dsr-sub',
      `기본 DSR ${summary.currentDsrPct.toFixed(1)}% (규제 한도 ${inputs.dsrLimitPct}% ${
        summary.isDsrPassed ? '통과' : '초과'
      })`
    );

    const limitEl = document.getElementById('kpi-legal-limit');
    if (limitEl) {
      limitEl.textContent = formatCurrency(summary.finalLegalLimit, true);
      limitEl.className = `kpi-value ${summary.isAllLegalLimitsPassed ? 'text-accent' : 'text-danger'}`;
    }
    setText(
      'kpi-legal-limit-sub',
      `LTV한도 ${formatCurrency(summary.maxLoanByLtv, true)} (${summary.currentLtvPct.toFixed(1)}%) · DSR한도 ${formatCurrency(
        summary.maxLoanByDsr,
        true
      )}`
    );

    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      if (summary.isAllLegalLimitsPassed) {
        verdictEl.innerHTML = `
          고객님의 연봉과 주택 시세 기준 <strong>법적 최대 대출 한도는 <span class="verdict-highlight">${formatCurrency(
            summary.finalLegalLimit,
            true
          )}</span></strong>이며, 희망 대출금(<strong>${formatCurrency(
          inputs.loanAmount,
          true
        )}</strong>)은 <span class="verdict-success">LTV·스트레스 DSR 심사를 모두 통과</span>합니다! 또한 원금균등 선택 시 만기까지 총이자를 <span class="verdict-success">${formatCurrency(
          summary.interestSavedByEqualPrincipal,
          true
        )}</span> 아낄 수 있습니다.
        `;
      } else {
        const excess = inputs.loanAmount - summary.finalLegalLimit;
        verdictEl.innerHTML = `
          현재 희망 대출금(<strong>${formatCurrency(
            inputs.loanAmount,
            true
          )}</strong>)이 고객님의 법적 최대 한도(<span class="verdict-highlight">${formatCurrency(
          summary.finalLegalLimit,
          true
        )}</span>)보다 <span class="verdict-danger">${formatCurrency(
          excess,
          true
        )} 초과</span>되었습니다! 한도를 늘리려면 <strong>대출 기간을 30~40년으로 늘리거나 원금균등 방식</strong>으로 변경해 보세요.
        `;
      }
    }

    const legalBanner = document.getElementById('legal-limit-status-banner');
    if (legalBanner) {
      if (summary.isAllLegalLimitsPassed) {
        const margin = summary.finalLegalLimit - inputs.loanAmount;
        legalBanner.style.borderLeftColor = 'var(--color-success)';
        legalBanner.innerHTML = `
          <span class="text-success" style="font-weight:700;">[법적 한도 충족] LTV 및 스트레스 DSR 통과:</span>
          희망 대출금(<strong>${formatCurrency(inputs.loanAmount, true)}</strong>)이 법적 최대 한도(<strong>${formatCurrency(
          summary.finalLegalLimit,
          true
        )}</strong>) 이내입니다. (여유 한도: +${formatCurrency(margin, true)})
        `;
      } else {
        const excess = inputs.loanAmount - summary.finalLegalLimit;
        const reason =
          !summary.isLtvPassed && !summary.isDsrPassed
            ? 'LTV 및 스트레스 DSR 한도 동시 초과'
            : !summary.isLtvPassed
            ? `LTV ${inputs.ltvLimitPct}% 한도 초과 (현재 ${summary.currentLtvPct.toFixed(1)}%)`
            : `스트레스 DSR ${inputs.dsrLimitPct}% 한도 초과 (현재 ${summary.stressedDsrPct.toFixed(1)}%)`;

        legalBanner.style.borderLeftColor = 'var(--color-danger)';
        legalBanner.innerHTML = `
          <span class="text-danger" style="font-weight:700;">[법적 한도 초과] ${reason}:</span>
          희망 대출금이 법적 최대 가능액(<strong>${formatCurrency(
            summary.finalLegalLimit,
            true
          )}</strong>)보다 <strong class="text-danger">${formatCurrency(excess, true)}</strong> 초과되었습니다. 대출 기간을 늘리거나 원금을 조정해 보세요.
        `;
      }
    }

    const cashPlanEl = document.getElementById('cash-plan-banner');
    if (cashPlanEl) {
      cashPlanEl.innerHTML = `
        <strong>실전 주택 매수 초기 필요 현금 추정:</strong>
        순수 자기자본(매매가−대출금) <strong>${formatCurrency(summary.requiredOwnCash, true)}</strong>
        + 1주택 취득세(${summary.acqTaxRatePct.toFixed(2)}%) <strong>${formatCurrency(
        summary.estimatedAcquisitionTax,
        true
      )}</strong>
        + 중개보수 상한(${summary.brokerRatePct}%) <strong>${formatCurrency(
        summary.estimatedBrokerFee,
        true
      )}</strong>
        = 총 초기 필요 현금 약 <strong class="text-accent">${formatCurrency(
          summary.totalInitialCashNeeded,
          true
        )}</strong>
      `;
    }

    setText('comp-epi-monthly', formatCurrency(comparison.equalPi.firstMonthPayment, false));
    setText('comp-epi-interest', formatCurrency(comparison.equalPi.totalInterest, true));
    setText('comp-epi-total', formatCurrency(comparison.equalPi.totalPayment, true));

    setText(
      'comp-ep-monthly',
      `첫달 ${formatCurrency(comparison.equalPrincipal.firstMonthPayment, true)} → 끝달 ${formatCurrency(
        comparison.equalPrincipal.lastMonthPayment,
        true
      )}`
    );
    setText('comp-ep-interest', formatCurrency(comparison.equalPrincipal.totalInterest, true));
    setText('comp-ep-total', formatCurrency(comparison.equalPrincipal.totalPayment, true));

    setText('comp-bullet-monthly', `매월 이자 ${formatCurrency(comparison.bullet.graceMonthlyPayment, false)}`);
    setText('comp-bullet-interest', formatCurrency(comparison.bullet.totalInterest, true));
    setText('comp-bullet-total', formatCurrency(comparison.bullet.totalPayment, true));

    const pinBanner = document.getElementById('pinned-comparison-banner');
    if (pinBanner) {
      if (state.pinnedScenario) {
        const diffInterest = summary.totalInterest - state.pinnedScenario.totalInterest;
        const sign = diffInterest >= 0 ? '+' : '';
        pinBanner.style.display = 'block';
        pinBanner.innerHTML = `
          <strong>시나리오 A/B 비교 중:</strong>
          [${state.pinnedScenario.label}] 총이자 <strong>${formatCurrency(
          state.pinnedScenario.totalInterest,
          true
        )}</strong> (초기 월납입 ${formatCurrency(state.pinnedScenario.firstMonthPayment, true)})
          → 현재(Case B) 총이자 차이:
          <span class="${diffInterest <= 0 ? 'text-success' : 'text-danger'}" style="font-weight:800;">
            ${sign}${formatCurrency(diffInterest, true)}
          </span>
        `;
      } else {
        pinBanner.style.display = 'none';
      }
    }

    const canvas = document.getElementById('sim-canvas');
    const colors = getThemeChartColors();

    if (state.chartViewMode === 'balance') {
      renderLineChart(canvas, {
        labels: chartData.labels,
        datasets: [
          {
            label: '남은 대출 원금 잔액',
            data: chartData.remainingBalanceSeries,
            color: colors.colorCaseB,
            fillArea: true,
          },
          {
            label: '누적 납부 이자 총액',
            data: chartData.cumulativeInterestSeries,
            color: colors.colorWarning,
            dashed: false,
          },
        ],
        includeZero: true,
        yFormatter: (val) => formatCurrency(val, true),
        watermarkText: 'SIMULAB · LOAN AMORTIZATION ENGINE',
      });
    } else {
      renderLineChart(canvas, {
        labels: chartData.labels,
        datasets: [
          {
            label: '원리금균등 월납입금 (매월 일정)',
            data: chartData.equalPiMonthlySeries,
            color: colors.colorCaseB,
            fillArea: inputs.repaymentType === 'equal_pi',
          },
          {
            label: '원금균등 월납입금 (체감형)',
            data: chartData.equalPrincipalMonthlySeries,
            color: colors.colorSuccess,
            fillArea: inputs.repaymentType === 'equal_principal',
          },
        ],
        includeZero: true,
        yFormatter: (val) => formatCurrency(val, true),
        watermarkText: 'SIMULAB · MORTGAGE & LTV/DSR ENGINE',
      });
    }

    const tbody = document.getElementById('yearly-table-body');
    if (tbody) {
      tbody.innerHTML = yearlyTable
        .map((row) => {
          return `
            <tr>
              <td><strong>${row.year}년차</strong></td>
              <td class="text-accent"><strong>${formatCurrency(row.avgMonthlyPayment, false)}</strong></td>
              <td>${formatCurrency(row.annualPrincipal, true)}</td>
              <td class="text-warning">${formatCurrency(row.annualInterest, true)}</td>
              <td>${formatCurrency(row.cumulativeInterest, true)}</td>
              <td><strong>${formatCurrency(row.remainingBalance, true)}</strong></td>
            </tr>
          `;
        })
        .join('');
    }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
