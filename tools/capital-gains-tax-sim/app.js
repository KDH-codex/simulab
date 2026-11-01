/**
 * ==========================================================================
 * [도구 7] 부동산 양도소득세(12억 비과세·장특공제) & 세후 매도 순수익 계산기 - UI 컨트롤러
 * 파일 경로: tools/capital-gains-tax-sim/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 매수가, 매도가, 필요경비, 보유·거주 기간, 1세대1주택 비과세 여부, 공동명의 여부를
 *   조절할 때마다 양도소득세+지방소득세와 세후 매도 순수익을 실시간 60fps 차트로 보여줍니다.
 * - 로컬 파일(file://) 직접 실행 환경에서도 CORS 차단 없이 작동합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const {
    initCommonUI,
    formatCurrency,
    formatPercent,
    parseUrlParams,
    shareSimulationUrl,
    saveToolState,
    loadToolState,
    exportCanvasToPng,
    exportDataToCsv,
    showToast,
    updateSliderProgress,
    initAllSlidersProgress,
    renderLineChart,
    getThemeChartColors,
    injectSeoSchema,
  } = window.SimuLab;

  const {
    DEFAULT_CGT_INPUTS,
    sanitizeCgtInputs,
    calculateCapitalGainsSimulation,
  } = window.SimuLab.CapitalGainsLogic;

  const TOOL_ID = 'capital-gains-tax-sim';

  const PRESETS = {
    highValueOneHouse: {
      purchasePrice: 800000000,
      salePrice: 1500000000,
      necessaryExpenses: 35000000,
      holdingYears: 6,
      residenceYears: 4,
      taxCategory: 'one_house_exempt',
      jointOwners: 1,
    },
    taxFreeUnder12Eok: {
      purchasePrice: 650000000,
      salePrice: 1150000000,
      necessaryExpenses: 25000000,
      holdingYears: 4,
      residenceYears: 2,
      taxCategory: 'one_house_exempt',
      jointOwners: 1,
    },
    generalTwoHouse: {
      purchasePrice: 600000000,
      salePrice: 1100000000,
      necessaryExpenses: 30000000,
      holdingYears: 5,
      residenceYears: 0,
      taxCategory: 'general_tax',
      jointOwners: 2,
    },
  };

  let state = {
    currentInputs: { ...DEFAULT_CGT_INPUTS },
    pinnedScenario: null,
    lastResult: null,
  };

  let rafPending = false;

  function bootstrap() {
    initCommonUI(TOOL_ID);

    injectSeoSchema({
      name: '부동산 양도소득세(12억 비과세·장기보유특별공제) 및 세후 매도 순수익 계산기',
      description:
        '1세대 1주택 12억원 고가주택 비과세 안분 계산, 보유·거주 기간별 장기보유특별공제(최대 80%), 부부 공동명의 절세 효과, 세후 매도 순수익을 실시간 계산하는 양도세 시뮬레이터',
      category: 'FinanceApplication',
    });

    const savedState = loadToolState(TOOL_ID);
    if (savedState && savedState.currentInputs) {
      state.currentInputs = sanitizeCgtInputs(savedState.currentInputs);
      if (savedState.pinnedScenario) {
        state.pinnedScenario = savedState.pinnedScenario;
      }
    }
    if (window.location.search) {
      state.currentInputs = sanitizeCgtInputs(parseUrlParams(state.currentInputs));
    }

    syncInputsToDOM(state.currentInputs);
    bindEvents();
    runSimulationAndRender();
  }

  function syncInputsToDOM(inputs) {
    const fields = [
      { key: 'purchasePrice', scale: 0.0001 },     // 만원 단위
      { key: 'salePrice', scale: 0.0001 },         // 만원 단위
      { key: 'necessaryExpenses', scale: 0.0001 }, // 만원 단위
      { key: 'holdingYears', scale: 1 },
      { key: 'residenceYears', scale: 1 },
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

    const catBtns = document.querySelectorAll('[data-tax-cat]');
    catBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tax-cat') === inputs.taxCategory);
    });

    const ownerBtns = document.querySelectorAll('[data-owners]');
    ownerBtns.forEach((btn) => {
      btn.classList.toggle('active', Number(btn.getAttribute('data-owners')) === inputs.jointOwners);
    });

    initAllSlidersProgress();
  }

  function bindEvents() {
    const fields = [
      { key: 'purchasePrice', toRaw: (v) => Number(v) * 10000 },
      { key: 'salePrice', toRaw: (v) => Number(v) * 10000 },
      { key: 'necessaryExpenses', toRaw: (v) => Number(v) * 10000 },
      { key: 'holdingYears', toRaw: (v) => Number(v) },
      { key: 'residenceYears', toRaw: (v) => Number(v) },
    ];

    fields.forEach(({ key, toRaw }) => {
      const slider = document.getElementById(`slider-${key}`);
      const numInput = document.getElementById(`input-${key}`);

      const handleUpdate = (sourceEl, targetEl) => {
        if (targetEl) targetEl.value = sourceEl.value;
        if (slider) updateSliderProgress(slider);
        state.currentInputs[key] = toRaw(sourceEl.value);

        // 실거주 기간이 보유 기간을 초과하지 않도록 자동 연동
        if (key === 'holdingYears' && state.currentInputs.residenceYears > state.currentInputs.holdingYears) {
          state.currentInputs.residenceYears = state.currentInputs.holdingYears;
          syncInputsToDOM(state.currentInputs);
        }
        if (key === 'residenceYears' && state.currentInputs.residenceYears > state.currentInputs.holdingYears) {
          state.currentInputs.holdingYears = state.currentInputs.residenceYears;
          syncInputsToDOM(state.currentInputs);
        }

        scheduleRender();
      };

      if (slider) {
        slider.addEventListener('input', () => handleUpdate(slider, numInput));
      }
      if (numInput) {
        numInput.addEventListener('input', () => handleUpdate(numInput, slider));
      }
    });

    // 매도 시나리오 빠른 프리셋
    const presetBtns = document.querySelectorAll('[data-preset]');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset');
        if (PRESETS[key]) {
          presetBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.currentInputs = { ...PRESETS[key] };
          syncInputsToDOM(state.currentInputs);
          scheduleRender();
          showToast('양도소득세 시나리오 프리셋이 적용되었습니다.');
        }
      });
    });

    // 과세 유형 선택
    const catBtns = document.querySelectorAll('[data-tax-cat]');
    catBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentInputs.taxCategory = btn.getAttribute('data-tax-cat');
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
      });
    });

    // 단독명의 vs 공동명의 선택
    const ownerBtns = document.querySelectorAll('[data-owners]');
    ownerBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentInputs.jointOwners = Number(btn.getAttribute('data-owners'));
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
      });
    });

    // 시나리오 고정
    const pinBtn = document.getElementById('btn-pin-scenario');
    if (pinBtn) {
      pinBtn.addEventListener('click', () => {
        if (!state.lastResult) return;

        if (state.pinnedScenario) {
          state.pinnedScenario = null;
          pinBtn.textContent = '현재 조건 고정 (Case A 비교)';
          showToast('고정된 비교 시나리오(Case A)가 해제되었습니다.');
        } else {
          const { inputs, summary, chartData } = state.lastResult;
          state.pinnedScenario = {
            label: `고정(Case A): 매도가 ${formatCurrency(inputs.salePrice, true)} (${inputs.jointOwners === 2 ? '공동명의' : '단독명의'})`,
            totalTaxPayable: summary.totalTaxPayable,
            netAfterTaxProfit: summary.netAfterTaxProfit,
            taxSeries: [...chartData.taxSeries],
          };
          pinBtn.textContent = '고정 시나리오(Case A) 해제';
          showToast('현재 매도·양도세 조건이 Case A로 고정되었습니다.');
        }

        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        scheduleRender();
      });
    }

    // 초기화
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.currentInputs = { ...DEFAULT_CGT_INPUTS };
        state.pinnedScenario = null;
        const pinBtnEl = document.getElementById('btn-pin-scenario');
        if (pinBtnEl) pinBtnEl.textContent = '현재 조건 고정 (Case A 비교)';
        syncInputsToDOM(state.currentInputs);
        saveToolState(TOOL_ID, state.currentInputs, null);
        window.history.replaceState(null, '', window.location.pathname);
        scheduleRender();
        showToast('초기 기본값으로 재설정되었습니다.');
      });
    }

    // URL 공유
    const shareBtn = document.getElementById('btn-share-url');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        shareSimulationUrl(state.currentInputs);
      });
    }

    // PNG 다운로드
    const pngBtn = document.getElementById('btn-export-png');
    if (pngBtn) {
      pngBtn.addEventListener('click', () => {
        const canvas = document.getElementById('sim-canvas');
        exportCanvasToPng(canvas, 'capital-gains-tax-simulation.png');
      });
    }

    // CSV 다운로드
    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        if (!state.lastResult) return;
        const headers = [
          '보유 기간',
          '예상 거주 기간',
          '장기보유특별공제율(%)',
          '양도소득 과세표준(원)',
          '총 납부할 양도세+지방세(원)',
          '세후 매도 순수익(원)',
          '양도차익 대비 실효세율(%)',
        ];
        const rows = state.lastResult.holdingTable.map((r) => [
          `${r.holdingYears}년`,
          `${r.residenceYears}년`,
          r.longTermRatePct,
          r.totalTaxBase,
          r.totalTaxPayable,
          r.netAfterTaxProfit,
          r.effectiveTaxRatePct.toFixed(2),
        ]);
        exportDataToCsv(headers, rows, 'capital-gains-tax-by-holding-years.csv');
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
    const result = calculateCapitalGainsSimulation(state.currentInputs);
    state.lastResult = result;
    const { inputs, summary, chartData, holdingTable } = result;

    // 1) 좌측 입력 배지 업데이트
    setText('badge-purchasePrice', formatCurrency(inputs.purchasePrice, true));
    setText('badge-salePrice', formatCurrency(inputs.salePrice, true));
    setText('badge-necessaryExpenses', formatCurrency(inputs.necessaryExpenses, true));
    setText('badge-holdingYears', `${inputs.holdingYears}년`);
    setText('badge-residenceYears', `${inputs.residenceYears}년`);

    // 2) 우측 KPI 카드 4종 업데이트
    const taxEl = document.getElementById('kpi-total-tax');
    if (taxEl) {
      taxEl.textContent = formatCurrency(summary.totalTaxPayable, true);
      taxEl.className = summary.totalTaxPayable === 0 ? 'kpi-value text-success' : 'kpi-value text-warning';
    }
    setText(
      'kpi-total-tax-sub',
      summary.totalTaxPayable === 0
        ? '1세대 1주택 12억 이하 전액 비과세 적용'
        : `양도차익 대비 실효세율 ${formatPercent(summary.effectiveTaxRateOnGainPct, 1, false)}`
    );

    const netProfitEl = document.getElementById('kpi-net-profit');
    if (netProfitEl) {
      netProfitEl.textContent = formatCurrency(summary.netAfterTaxProfit, true);
      netProfitEl.className = `kpi-value ${summary.netAfterTaxProfit >= 0 ? 'text-accent' : 'text-danger'}`;
    }
    setText(
      'kpi-net-profit-sub',
      `세전 양도차익 ${formatCurrency(summary.grossCapitalGain, true)} (세후 ROI ${formatPercent(summary.afterTaxRoiPct, 1, true)})`
    );

    setText('kpi-lt-deduction', `${summary.longTermRatePct}% 공제`);
    setText(
      'kpi-lt-deduction-sub',
      `공제액 ${formatCurrency(summary.longTermDeductionAmount, true)} · 비과세비율 ${summary.exemptRatioPct.toFixed(1)}%`
    );

    setText('kpi-joint-save', formatCurrency(summary.jointOwnershipTaxSaved, true));
    setText(
      'kpi-joint-save-sub',
      `단독 ${formatCurrency(summary.singleOwnerTax, true)} vs 공동 ${formatCurrency(summary.jointOwnerTax, true)}`
    );

    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      if (summary.totalTaxPayable === 0) {
        verdictEl.innerHTML = `
          축하합니다! 1세대 1주택 <strong>12억원 이하 비과세 요건</strong>을 충족하여 납부할 양도소득세가 <span class="verdict-success">0원(전액 면제)</span>이며, 통장에 찍히는 세후 매도 순수익은 <span class="verdict-highlight">${formatCurrency(
          summary.netAfterTaxProfit,
          true
        )}</span>입니다!
        `;
      } else {
        verdictEl.innerHTML = `
          매도가 <strong>${formatCurrency(
            inputs.salePrice,
            true
          )}</strong> 기준 장기보유특별공제(<span class="verdict-success">${summary.longTermRatePct}%</span>) 적용 후 총 납부할 양도세는 <span class="verdict-warning">${formatCurrency(
          summary.totalTaxPayable,
          true
        )}</span>이며, 최종 세후 순수익은 <span class="verdict-highlight">${formatCurrency(
          summary.netAfterTaxProfit,
          true
        )}</span>입니다. (부부 공동명의 시 <span class="verdict-success">${formatCurrency(
          summary.jointOwnershipTaxSaved,
          true
        )}</span> 추가 절세 가능)
        `;
      }
    }

    // 3) 고정 시나리오 비교 배너
    const pinBanner = document.getElementById('pinned-comparison-banner');
    if (pinBanner) {
      if (state.pinnedScenario) {
        const diffTax = summary.totalTaxPayable - state.pinnedScenario.totalTaxPayable;
        const sign = diffTax >= 0 ? '+' : '';
        pinBanner.style.display = 'block';
        pinBanner.innerHTML = `
          <strong>시나리오 A/B 비교 중:</strong>
          [${state.pinnedScenario.label}] 납부세액 <strong>${formatCurrency(state.pinnedScenario.totalTaxPayable, true)}</strong>
          vs 현재(Case B) 세액 변화:
          <span class="${diffTax <= 0 ? 'text-success' : 'text-danger'}" style="font-weight:700;">
            ${sign}${formatCurrency(diffTax, true)}
          </span>
        `;
      } else {
        pinBanner.style.display = 'none';
      }
    }

    // 4) Canvas 차트 렌더링 (보유 기간 1~15년에 따른 세후 매도 순수익 vs 총 납부세액 궤적)
    const canvas = document.getElementById('sim-canvas');
    const colors = getThemeChartColors();

    const datasets = [
      {
        label: '보유기간별 세후 매도 순수익 (Net Profit)',
        data: chartData.netProfitSeries,
        color: colors.colorSuccess,
        fillArea: true,
      },
      {
        label: '보유기간별 총 납부 양도소득세+지방세',
        data: chartData.taxSeries,
        color: colors.colorDanger,
        fillArea: false,
      },
    ];

    if (
      state.pinnedScenario &&
      Array.isArray(state.pinnedScenario.taxSeries) &&
      state.pinnedScenario.taxSeries.length === chartData.labels.length
    ) {
      datasets.push({
        label: `${state.pinnedScenario.label} 양도세`,
        data: state.pinnedScenario.taxSeries,
        color: colors.colorWarning,
        dashed: true,
      });
    }

    renderLineChart(canvas, {
      labels: chartData.labels,
      datasets,
      includeZero: true,
      yFormatter: (val) => formatCurrency(val, true),
      watermarkText: 'SIMULAB · CAPITAL GAINS TAX ENGINE',
    });

    // 5) 보유 기간별 양도세 및 세후 순수익 테이블 렌더링
    const tbody = document.getElementById('yearly-table-body');
    if (tbody) {
      tbody.innerHTML = holdingTable
        .map((row) => {
          const isCurrent = row.holdingYears === inputs.holdingYears;
          return `
            <tr style="${isCurrent ? 'background-color: var(--accent-soft); font-weight: 700;' : ''}">
              <td><strong>${row.holdingYears}년 보유</strong> (${row.residenceYears}년 거주)</td>
              <td>${row.longTermRatePct}%</td>
              <td>${formatCurrency(row.totalTaxBase, true)}</td>
              <td class="text-warning"><strong>${formatCurrency(row.totalTaxPayable, true)}</strong></td>
              <td class="text-success"><strong>${formatCurrency(row.netAfterTaxProfit, true)}</strong></td>
              <td>${formatPercent(row.effectiveTaxRatePct, 1, false)}</td>
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
