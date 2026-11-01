/**
 * ==========================================================================
 * [도구 5] 배당성장주(SCHD) 복리 재투자 & 금융소득종합과세·건보료 시뮬레이터 - UI 컨트롤러
 * 파일 경로: tools/dividend-tax-sim/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 설명]
 * - 미국 배당성장주(SCHD, JEPI, JEPQ) 및 한국형 배당 ETF 투자 시
 *   원금, 월적립금, 배당수익률, 배당성장률에 따른 미래 현금흐름을 시뮬레이션합니다.
 * - 프리미엄 인풋 카드, 실시간 한글 금액 읽기(억/만 원),
 *   원터치 퀵 조절 칩 버튼([1천만], [+10만] 등)을 완벽 지원합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  // SimuLab 전역 헬퍼 모듈 참조
  const {
    initCommonUI,
    formatCurrency,
    formatKoreanAmount,
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

  // 비즈니스 로직 함수 참조
  const {
    DEFAULT_DIVIDEND_INPUTS,
    sanitizeDividendInputs,
    calculateDividendSimulation,
  } = window.SimuLab.DividendLogic;

  // 실시간 시장 데이터/환율 모듈 참조
  const MarketData = window.SimuLab.MarketData || {
    DEFAULT_USD_KRW: 1385.0,
    fetchLiveUsdKrwRate: async () => ({ rate: 1385.0, dateStr: '기본환율', isLive: false }),
  };

  const TOOL_ID = 'dividend-tax-sim';

  // 대표 배당 ETF 프리셋 수치
  const PRESETS = {
    schd: {
      initialPrincipal: 50000000,
      monthlyContribution: 1500000,
      initialDividendYield: 3.6,
      dividendGrowthRate: 9.8,
      priceAppreciationRate: 6.8,
      investmentYears: 15,
      marginalTaxRatePct: 26.4,
      reinvestDividends: 1,
    },
    jepi: {
      initialPrincipal: 100000000,
      monthlyContribution: 1500000,
      initialDividendYield: 7.8,
      dividendGrowthRate: 1.5,
      priceAppreciationRate: 3.0,
      investmentYears: 15,
      marginalTaxRatePct: 26.4,
      reinvestDividends: 1,
    },
    jepq: {
      initialPrincipal: 100000000,
      monthlyContribution: 1500000,
      initialDividendYield: 9.6,
      dividendGrowthRate: 2.5,
      priceAppreciationRate: 4.5,
      investmentYears: 15,
      marginalTaxRatePct: 26.4,
      reinvestDividends: 1,
    },
    fire: {
      initialPrincipal: 50000000,
      monthlyContribution: 1500000,
      initialDividendYield: 3.6,
      dividendGrowthRate: 9.2,
      priceAppreciationRate: 6.5,
      investmentYears: 20,
      marginalTaxRatePct: 26.4,
      reinvestDividends: 1,
    },
  };

  // 계산기 현재 상태 객체
  let state = {
    currentInputs: { ...DEFAULT_DIVIDEND_INPUTS },
    usdKrwRate: MarketData.DEFAULT_USD_KRW || 1385.0,
    pinnedScenario: null,
    lastResult: null,
    chartMode: 'dividend',
  };

  let rafPending = false;

  /**
   * 계산기 초기 구동 함수
   */
  function bootstrap() {
    initCommonUI(TOOL_ID);

    injectSeoSchema({
      name: '배당성장주(SCHD·JEPI·JEPQ) 복리 재투자 및 금융소득종합과세·건보료 시뮬레이터',
      description:
        '초기 투자금, 월 적립금, 시가배당률, 배당성장률(DRIP)을 바탕으로 연 2,000만원 초과 시 금융소득종합과세 및 건강보험료 부담과 절세계좌(ISA·연금저축) 과세이연 효과를 비교하는 배당 계산기',
      category: 'FinanceApplication',
    });

    const savedState = loadToolState(TOOL_ID);
    if (savedState && savedState.currentInputs) {
      state.currentInputs = sanitizeDividendInputs(savedState.currentInputs);
      if (savedState.pinnedScenario) {
        state.pinnedScenario = savedState.pinnedScenario;
      }
    }
    if (window.location.search) {
      state.currentInputs = sanitizeDividendInputs(parseUrlParams(state.currentInputs));
    }

    syncInputsToDOM(state.currentInputs);
    bindEvents();
    runSimulationAndRender();

    // 실시간 공개 환율 API 연동
    if (typeof MarketData.fetchLiveUsdKrwRate === 'function') {
      MarketData.fetchLiveUsdKrwRate().then((fxInfo) => {
        if (fxInfo && fxInfo.rate) {
          state.usdKrwRate = fxInfo.rate;
          const fxBadge = document.getElementById('live-fx-badge');
          if (fxBadge) {
            fxBadge.innerHTML = `<span class="live-dot"></span><span>실시간 환율 1$ = ${fxInfo.rate.toLocaleString('ko-KR')}원 (${fxInfo.dateStr})</span>`;
          }
          updateUsdHelperText();
        }
      });
    }
  }

  /**
   * 달러 환산 안내 문구 갱신
   */
  function updateUsdHelperText() {
    const usdEl = document.getElementById('usd-equiv-div');
    if (usdEl) {
      const usdInit = Math.round(state.currentInputs.initialPrincipal / state.usdKrwRate);
      const usdMonth = Math.round(state.currentInputs.monthlyContribution / state.usdKrwRate);
      usdEl.textContent = `현재 환율 기준 초기 약 $${usdInit.toLocaleString('en-US')} + 월 약 $${usdMonth.toLocaleString('en-US')} 적립 투자에 해당합니다.`;
    }
  }

  /**
   * 상태값을 DOM 폼 필드에 동기화
   */
  function syncInputsToDOM(inputs) {
    const fields = [
      { key: 'initialPrincipal', scale: 0.0001 },
      { key: 'monthlyContribution', scale: 0.0001 },
      { key: 'initialDividendYield', scale: 1 },
      { key: 'dividendGrowthRate', scale: 1 },
      { key: 'priceAppreciationRate', scale: 1 },
      { key: 'investmentYears', scale: 1 },
      { key: 'marginalTaxRatePct', scale: 1 },
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

    const dripBtns = document.querySelectorAll('[data-drip]');
    dripBtns.forEach((btn) => {
      const val = Number(btn.getAttribute('data-drip'));
      btn.classList.toggle('active', val === inputs.reinvestDividends);
    });

    initAllSlidersProgress();
    updateUsdHelperText();
  }

  /**
   * 이벤트 리스너 바인딩
   */
  function bindEvents() {
    const fields = [
      { key: 'initialPrincipal', toRaw: (v) => Number(v) * 10000 },
      { key: 'monthlyContribution', toRaw: (v) => Number(v) * 10000 },
      { key: 'initialDividendYield', toRaw: (v) => Number(v) },
      { key: 'dividendGrowthRate', toRaw: (v) => Number(v) },
      { key: 'priceAppreciationRate', toRaw: (v) => Number(v) },
      { key: 'investmentYears', toRaw: (v) => Number(v) },
      { key: 'marginalTaxRatePct', toRaw: (v) => Number(v) },
    ];

    fields.forEach(({ key, toRaw }) => {
      const slider = document.getElementById(`slider-${key}`);
      const numInput = document.getElementById(`input-${key}`);

      const handleUpdate = (sourceEl, targetEl) => {
        if (targetEl) targetEl.value = sourceEl.value;
        if (slider) updateSliderProgress(slider);
        state.currentInputs[key] = toRaw(sourceEl.value);
        updateUsdHelperText();
        scheduleRender();
      };

      if (slider) {
        slider.addEventListener('input', () => handleUpdate(slider, numInput));
      }
      if (numInput) {
        numInput.addEventListener('input', () => handleUpdate(numInput, slider));
      }
    });

    // 퀵 칩 원터치 설정 버튼 ([data-chip-set])
    document.querySelectorAll('[data-chip-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const inputId = btn.getAttribute('data-chip-set');
        const val = Number(btn.getAttribute('data-val'));
        const inputEl = document.getElementById(inputId);
        const sliderId = inputId.replace('input-', 'slider-');
        const sliderEl = document.getElementById(sliderId);

        if (inputEl && Number.isFinite(val)) {
          inputEl.value = val;
          if (sliderEl) {
            sliderEl.value = val;
            updateSliderProgress(sliderEl);
          }
          const fieldDef = fields.find((f) => `input-${f.key}` === inputId);
          if (fieldDef) {
            state.currentInputs[fieldDef.key] = fieldDef.toRaw(val);
            updateUsdHelperText();
            scheduleRender();
          }
        }
      });
    });

    // 퀵 칩 원터치 증감 버튼 ([data-chip-add])
    document.querySelectorAll('[data-chip-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const inputId = btn.getAttribute('data-chip-add');
        const addVal = Number(btn.getAttribute('data-val')) || 0;
        const inputEl = document.getElementById(inputId);
        const sliderId = inputId.replace('input-', 'slider-');
        const sliderEl = document.getElementById(sliderId);

        if (inputEl) {
          const currentVal = Number(inputEl.value) || 0;
          const nextVal = Math.max(0, currentVal + addVal);
          inputEl.value = nextVal;
          if (sliderEl) {
            sliderEl.value = nextVal;
            updateSliderProgress(sliderEl);
          }
          const fieldDef = fields.find((f) => `input-${f.key}` === inputId);
          if (fieldDef) {
            state.currentInputs[fieldDef.key] = fieldDef.toRaw(nextVal);
            updateUsdHelperText();
            scheduleRender();
          }
        }
      });
    });

    // 대표 배당 ETF 프리셋 선택
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
          showToast('선택하신 실제 배당 ETF의 배당률·성장률 파라미터가 적용되었습니다.');
        }
      });
    });

    // 배당 재투자(DRIP) 방식 토글
    const dripBtns = document.querySelectorAll('[data-drip]');
    dripBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentInputs.reinvestDividends = Number(btn.getAttribute('data-drip'));
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
      });
    });

    // 차트 보기 모드 토글
    const chartModeBtns = document.querySelectorAll('[data-chart-mode]');
    chartModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        chartModeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.chartMode = btn.getAttribute('data-chart-mode');
        scheduleRender();
      });
    });

    // 시나리오 고정 비교
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
            label: `고정(Case A): 배당률 ${inputs.initialDividendYield}%·성장 ${inputs.dividendGrowthRate}%`,
            finalGeneralMonthlyNetDiv: summary.finalGeneralMonthlyNetDiv,
            finalGeneralAsset: summary.finalGeneralAsset,
            divSeries: [...chartData.generalMonthlyNetDivSeries],
            assetSeries: [...chartData.generalAccountAssetSeries],
          };
          pinBtn.textContent = '고정 시나리오(Case A) 해제';
          showToast('현재 배당 투자 조건이 Case A로 고정되었습니다.');
        }

        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        scheduleRender();
      });
    }

    // 조건 초기화
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.currentInputs = { ...DEFAULT_DIVIDEND_INPUTS };
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

    // 차트 PNG 저장
    const pngBtn = document.getElementById('btn-export-png');
    if (pngBtn) {
      pngBtn.addEventListener('click', () => {
        const canvas = document.getElementById('sim-canvas');
        exportCanvasToPng(canvas, 'dividend-growth-tax-simulation.png');
      });
    }

    // CSV 다운로드
    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        if (!state.lastResult) return;
        const headers = [
          '경과 연차',
          '누적 투자원금(원)',
          '일반계좌 평가자산(원)',
          '절세계좌(과세이연) 평가자산(원)',
          '연간 세전 배당금(원)',
          '일반계좌 연간 세금+건보료(원)',
          '일반계좌 월 세후 배당금(원)',
          '절세계좌 월 세후 배당금(원)',
          '투자원금 대비 배당률(YoC, %)',
          '금소세(2천만원) 초과 여부',
        ];
        const rows = state.lastResult.yearlyTable.map((r) => [
          `${r.year}년차`,
          r.principal,
          r.generalAsset,
          r.taxDeferredAsset,
          r.annualGrossDividend,
          r.generalTaxAndIns,
          r.generalMonthlyNetDiv,
          r.taxDeferredMonthlyNetDiv,
          r.yieldOnCostPct.toFixed(2),
          r.isComprehensiveTaxTriggered ? '금소세+건보료 대상' : '분리과세(15.4%)',
        ]);
        exportDataToCsv(headers, rows, 'dividend-growth-tax-schedule.csv');
      });
    }
  }

  function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      runSimulationAndRender();
    });
  }

  /**
   * 시뮬레이션 계산 및 결과 렌더링
   */
  function runSimulationAndRender() {
    const result = calculateDividendSimulation(state.currentInputs);
    state.lastResult = result;
    const { inputs, summary, chartData, yearlyTable } = result;

    // 배지 갱신 (한글 금액 지원)
    const initialText = formatKoreanAmount ? formatKoreanAmount(inputs.initialPrincipal) : formatCurrency(inputs.initialPrincipal, true);
    const monthlyText = formatKoreanAmount ? formatKoreanAmount(inputs.monthlyContribution) : formatCurrency(inputs.monthlyContribution, true);

    setText('badge-initialPrincipal', initialText);
    setText('badge-monthlyContribution', monthlyText);
    setText('badge-initialDividendYield', `${inputs.initialDividendYield.toFixed(1)}%`);
    setText('badge-dividendGrowthRate', `연 ${inputs.dividendGrowthRate.toFixed(1)}%`);
    setText('badge-priceAppreciationRate', `연 ${inputs.priceAppreciationRate.toFixed(1)}%`);
    setText('badge-investmentYears', `${inputs.investmentYears}년`);
    setText('badge-marginalTaxRatePct', `${inputs.marginalTaxRatePct.toFixed(1)}%`);

    // 상단 눈높이 한 줄 결론 브리핑
    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      if (summary.firstComprehensiveTaxYear !== null) {
        verdictEl.innerHTML = `
          ${inputs.investmentYears}년 뒤 내 투자원금 대비 배당률(YoC)은 <strong>${formatPercent(summary.finalYieldOnCostPct, 1, false)}</strong>까지 치솟아,
          일반 계좌에서 매달 세후 <strong class="text-accent">${formatCurrency(summary.finalGeneralMonthlyNetDiv, true)}</strong>을 받게 됩니다!<br/>
          단, <strong class="text-warning">${summary.firstComprehensiveTaxYear}년차부터 연 배당금이 2,000만원을 넘어 금융소득종합과세·건보료</strong>가 부과되므로,
          <strong>ISA·연금저축 절세계좌</strong>로 분산하면 총 자산을 <strong class="text-success">+${formatCurrency(summary.assetAdvantageByTaxDeferred, true)}</strong> 더 늘리고 월 수령액도 <strong>${formatCurrency(summary.finalTaxDeferredMonthlyNetDiv, true)}</strong>으로 높일 수 있습니다.
        `;
      } else {
        verdictEl.innerHTML = `
          ${inputs.investmentYears}년 동안 연 배당금이 2,000만원 이내(<strong class="text-success">최종 연 세전 ${formatCurrency(summary.finalAnnualGrossDiv, true)}</strong>)여서
          <strong>금융소득종합과세나 추가 건보료 걱정 없이 15.4% 분리과세로 안전하게 종결</strong>됩니다!<br/>
          ${inputs.investmentYears}년 뒤 일반 계좌 기준 매달 세후 <strong class="text-accent">${formatCurrency(summary.finalGeneralMonthlyNetDiv, true)}</strong>(절세계좌 활용 시 월 <strong class="text-success">${formatCurrency(summary.finalTaxDeferredMonthlyNetDiv, true)}</strong>)의 배당 현금흐름이 완성됩니다.
        `;
      }
    }

    // KPI 카드 4종
    setText('kpi-monthly-div', formatCurrency(summary.finalGeneralMonthlyNetDiv, true));
    setText(
      'kpi-monthly-div-sub',
      `절세계좌 활용 시 월 ${formatCurrency(summary.finalTaxDeferredMonthlyNetDiv, true)}`
    );

    const taxStatusEl = document.getElementById('kpi-tax-status');
    const taxSubEl = document.getElementById('kpi-tax-status-sub');
    if (summary.firstComprehensiveTaxYear !== null) {
      if (taxStatusEl) {
        taxStatusEl.textContent = `${summary.firstComprehensiveTaxYear}년차 돌파 (주의)`;
        taxStatusEl.className = 'kpi-value text-warning';
      }
      if (taxSubEl) {
        taxSubEl.textContent = `연 세금+건보료 ${formatCurrency(summary.finalGeneralAnnualTax, true)} 차감`;
      }
    } else {
      if (taxStatusEl) {
        taxStatusEl.textContent = '2,000만원 이내 (안전)';
        taxStatusEl.className = 'kpi-value text-success';
      }
      if (taxSubEl) {
        taxSubEl.textContent = `연 세전배당 ${formatCurrency(summary.finalAnnualGrossDiv, true)} (15.4% 종결)`;
      }
    }

    setText('kpi-final-asset', formatCurrency(summary.finalGeneralAsset, true));
    setText('kpi-final-asset-sub', `원금 대비 배당률(YoC): ${formatPercent(summary.finalYieldOnCostPct, 1, false)}`);

    setText('kpi-tax-saved', `+${formatCurrency(summary.assetAdvantageByTaxDeferred, true)}`);
    setText('kpi-tax-saved-sub', `누적 절세액 약 ${formatCurrency(summary.cumulativeTaxSaved, true)}`);

    // 시나리오 비교 배너
    const pinBanner = document.getElementById('pinned-comparison-banner');
    if (pinBanner) {
      if (state.pinnedScenario) {
        const diffDiv = summary.finalGeneralMonthlyNetDiv - state.pinnedScenario.finalGeneralMonthlyNetDiv;
        const sign = diffDiv >= 0 ? '+' : '';
        pinBanner.style.display = 'block';
        pinBanner.innerHTML = `
          <strong>시나리오 A/B 비교 중:</strong>
          [${state.pinnedScenario.label}] 최종 월 세후 배당금 <strong>${formatCurrency(state.pinnedScenario.finalGeneralMonthlyNetDiv, true)}</strong>
          vs 현재(Case B) 차액:
          <span class="${diffDiv >= 0 ? 'text-success' : 'text-danger'}" style="font-weight:700;">
            ${sign}${formatCurrency(diffDiv, true)} /월
          </span>
        `;
      } else {
        pinBanner.style.display = 'none';
      }
    }

    // 캔버스 차트 렌더링
    const canvas = document.getElementById('sim-canvas');
    const colors = getThemeChartColors();

    if (state.chartMode === 'dividend') {
      const datasets = [
        {
          label: '절세계좌(과세이연·연금) 월 세후 배당금',
          data: chartData.taxDeferredMonthlyNetDivSeries,
          color: colors.colorSuccess,
          fillArea: true,
        },
        {
          label: '일반계좌(금소세·건보료 반영) 월 세후 배당금',
          data: chartData.generalMonthlyNetDivSeries,
          color: colors.colorCaseB,
          fillArea: false,
        },
      ];

      if (
        state.pinnedScenario &&
        Array.isArray(state.pinnedScenario.divSeries) &&
        state.pinnedScenario.divSeries.length === chartData.labels.length
      ) {
        datasets.push({
          label: state.pinnedScenario.label,
          data: state.pinnedScenario.divSeries,
          color: colors.colorWarning,
          dashed: true,
        });
      }

      renderLineChart(canvas, {
        labels: chartData.labels,
        datasets,
        includeZero: true,
        yFormatter: (val) => formatCurrency(val, true),
        watermarkText: 'SIMULAB · DIVIDEND GROWTH & TAX ENGINE',
      });
    } else {
      const datasets = [
        {
          label: '절세계좌(과세이연 복리) 총 평가자산',
          data: chartData.taxDeferredAssetSeries,
          color: colors.colorSuccess,
          fillArea: true,
        },
        {
          label: '일반계좌(세후 재투자) 총 평가자산',
          data: chartData.generalAccountAssetSeries,
          color: colors.colorCaseB,
          fillArea: false,
        },
        {
          label: '누적 투자 원금',
          data: chartData.principalSeries,
          color: colors.colorCaseA,
          dashed: true,
        },
      ];

      renderLineChart(canvas, {
        labels: chartData.labels,
        datasets,
        includeZero: true,
        yFormatter: (val) => formatCurrency(val, true),
        watermarkText: 'SIMULAB · DRIP SNOWBALL PORTFOLIO ENGINE',
      });
    }

    // 연차별 스케줄 테이블 렌더링
    const tbody = document.getElementById('yearly-table-body');
    if (tbody) {
      tbody.innerHTML = yearlyTable
        .map((row) => {
          const taxBadge = row.isComprehensiveTaxTriggered
            ? `<span class="text-warning" style="font-weight:700;">금소세·건보료 과세</span>`
            : `<span class="text-success">15.4% 분리과세</span>`;

          return `
            <tr>
              <td><strong>${row.year}년차</strong></td>
              <td>${formatCurrency(row.principal, true)}</td>
              <td>${formatCurrency(row.annualGrossDividend, true)}</td>
              <td class="text-accent"><strong>${formatCurrency(row.generalMonthlyNetDiv, true)}</strong></td>
              <td class="text-success"><strong>${formatCurrency(row.taxDeferredMonthlyNetDiv, true)}</strong></td>
              <td>${formatPercent(row.yieldOnCostPct, 1, false)}</td>
              <td>${taxBadge}</td>
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

  // 초기화 진입
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
