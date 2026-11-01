/**
 * ==========================================================================
 * [도구 3] B2B 설비 도입 ROI 및 손익분기점(BEP) 시뮬레이터 - UI/이벤트 컨트롤러
 * 파일 경로: tools/logistics-roi-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 사용자가 초기 투자비(CAPEX), 월 인건비 절감액, 유지보수비(OPEX) 슬라이더나
 *   인풋 카드, 퀵 칩 버튼을 조작할 때마다 logic.js를 호출해 몇 개월 만에
 *   손익분기점(BEP)을 넘는지 계산하고 60fps Canvas 차트와 KPI 카드를 즉시 업데이트합니다.
 * - 로컬 파일(file://) 직접 실행 환경에서도 CORS 차단 없이 작동합니다.
 * ==========================================================================
 */

(function () {
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

  const {
    DEFAULT_ROI_INPUTS,
    sanitizeRoiInputs,
    calculateRoiSimulation,
  } = window.SimuLab.RoiLogic;

  const TOOL_ID = 'logistics-roi-calc';

  // 업종별 실무 빠른 프리셋 정의
  const PRESETS = {
    packaging: {
      capex: 50000000,
      monthlyLaborSavings: 3500000,
      monthlyThroughputGain: 1200000,
      monthlyOpex: 700000,
      discountRate: 6.0,
      analysisMonths: 36,
    },
    kiosk: {
      capex: 15000000,
      monthlyLaborSavings: 2200000,
      monthlyThroughputGain: 300000,
      monthlyOpex: 250000,
      discountRate: 5.5,
      analysisMonths: 24,
    },
    agv: {
      capex: 180000000,
      monthlyLaborSavings: 9500000,
      monthlyThroughputGain: 4500000,
      monthlyOpex: 2000000,
      discountRate: 6.5,
      analysisMonths: 48,
    },
  };

  let state = {
    currentInputs: { ...DEFAULT_ROI_INPUTS },
    pinnedScenario: null,
    lastResult: null,
  };

  let rafPending = false;

  function bootstrap() {
    // 1) 공통 헤더, 푸터, 법적 면책 조항, 쿠키 배너 초기화 (기본 테마: 라이트 단일)
    initCommonUI(TOOL_ID);

    // 2) 구글 리치 스니펫용 JSON-LD 구조화 데이터 주입
    injectSeoSchema({
      name: 'B2B 설비 도입 ROI 및 손익분기점(BEP) 시뮬레이터',
      description:
        '초기 설비 투자비(CAPEX), 인건비 절감액, 운영 유지비(OPEX), 할인율(NPV) 변수를 조절해 투자 회수 기간(Payback Period)과 손익분기점을 시각화하는 비즈니스 재무 계산기',
      category: 'BusinessApplication',
    });

    // 3) 저장된 상태 또는 URL 파라미터 복원
    const savedState = loadToolState(TOOL_ID);
    if (savedState && savedState.currentInputs) {
      state.currentInputs = sanitizeRoiInputs(savedState.currentInputs);
      if (savedState.pinnedScenario) {
        state.pinnedScenario = savedState.pinnedScenario;
      }
    }
    if (window.location.search) {
      state.currentInputs = sanitizeRoiInputs(parseUrlParams(state.currentInputs));
    }

    // 4) DOM 동기화 및 이벤트 연결 후 초기 렌더링
    syncInputsToDOM(state.currentInputs);
    bindEvents();
    runSimulationAndRender();
  }

  function syncInputsToDOM(inputs) {
    const fields = [
      { key: 'capex', scale: 0.0001 },                 // 화면 표시: 만원 단위
      { key: 'monthlyLaborSavings', scale: 0.0001 },   // 만원 단위
      { key: 'monthlyThroughputGain', scale: 0.0001 }, // 만원 단위
      { key: 'monthlyOpex', scale: 0.0001 },           // 만원 단위
      { key: 'discountRate', scale: 1 },
      { key: 'analysisMonths', scale: 1 },
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

    initAllSlidersProgress();
  }

  function bindEvents() {
    const fields = [
      { key: 'capex', toRaw: (v) => Number(v) * 10000 },
      { key: 'monthlyLaborSavings', toRaw: (v) => Number(v) * 10000 },
      { key: 'monthlyThroughputGain', toRaw: (v) => Number(v) * 10000 },
      { key: 'monthlyOpex', toRaw: (v) => Number(v) * 10000 },
      { key: 'discountRate', toRaw: (v) => Number(v) },
      { key: 'analysisMonths', toRaw: (v) => Number(v) },
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

    // 퀵 칩 버튼 원터치 조절 이벤트 (+1,000만, +50만 등)
    const chipBtns = document.querySelectorAll('.chip-btn');
    chipBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const addVal = btn.getAttribute('data-add');
        const setVal = btn.getAttribute('data-set');
        const inputEl = document.getElementById(targetId);
        if (!inputEl) return;

        let cur = Number(inputEl.value) || 0;
        if (setVal !== null && setVal !== undefined) {
          cur = Number(setVal);
        } else if (addVal) {
          cur += Number(addVal);
        }
        inputEl.value = cur;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    // 업종별 실무 프리셋 버튼 이벤트
    const presetBtns = document.querySelectorAll('[data-preset]');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        if (PRESETS[presetKey]) {
          presetBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.currentInputs = { ...PRESETS[presetKey] };
          syncInputsToDOM(state.currentInputs);
          scheduleRender();
          showToast('선택하신 실무 설비 프리셋이 적용되었습니다.');
        }
      });
    });

    // [현재 조건 고정 (Case A 비교)] 버튼
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
          const bepText =
            summary.paybackMonths !== null ? `${summary.paybackMonths.toFixed(1)}개월` : '회수불가';
          state.pinnedScenario = {
            label: `고정(Case A): 투자금 ${formatCurrency(inputs.capex, true)} (BEP ${bepText})`,
            finalNetProfit: summary.finalNetProfit,
            paybackMonths: summary.paybackMonths,
            totalRoiPct: Number(summary.totalRoiPct.toFixed(1)),
            series: [...chartData.cumulativeNetSeries],
            analysisMonths: inputs.analysisMonths,
          };
          pinBtn.textContent = '고정 시나리오(Case A) 해제';
          showToast('현재 설비 투자 조건이 Case A로 고정되었습니다.');
        }

        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        scheduleRender();
      });
    }

    // [초기화] 버튼
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.currentInputs = { ...DEFAULT_ROI_INPUTS };
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

    // [URL 공유] 버튼
    const shareBtn = document.getElementById('btn-share-url');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        shareSimulationUrl(state.currentInputs);
      });
    }

    // [PNG 차트 저장] 버튼
    const pngBtn = document.getElementById('btn-export-png');
    if (pngBtn) {
      pngBtn.addEventListener('click', () => {
        const canvas = document.getElementById('sim-canvas');
        exportCanvasToPng(canvas, 'b2b-equipment-roi-bep-chart.png');
      });
    }

    // [CSV 다운로드] 버튼 (기안서·품의서 첨부용 월별 현금흐름표)
    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        if (!state.lastResult) return;
        const headers = [
          '경과 개월',
          '월 총효익(인건비절감+매출기여, 원)',
          '월 운영유지비(OPEX, 원)',
          '월 순현금흐름(원)',
          '누적 순현금흐름(명목, 원)',
          '할인 반영 누적 현금흐름(NPV, 원)',
          '누적 ROI(%)',
          '손익분기(BEP) 돌파 여부',
        ];
        const rows = state.lastResult.periodTable.map((r) => [
          `${r.month}개월차`,
          r.monthlyGrossBenefit,
          r.monthlyOpex,
          r.monthlyNetCashFlow,
          r.cumulativeNetCashFlow,
          r.cumulativeNpv,
          r.cumulativeRoiPct.toFixed(1),
          r.isBreakEvenReached ? '흑자전환(달성)' : '회수중',
        ]);
        exportDataToCsv(headers, rows, 'b2b-equipment-roi-cashflow-table.csv');
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

  function runSimulationAndRender() {
    const result = calculateRoiSimulation(state.currentInputs);
    state.lastResult = result;
    const { inputs, summary, chartData, periodTable } = result;

    // 1) 좌측 입력 배지 업데이트 (친절한 한글 금액 읽기)
    const formatKoreanOrM = (won) => {
      if (typeof formatKoreanAmount === 'function') {
        return formatKoreanAmount(won);
      }
      return formatCurrency(won, true);
    };

    setText('badge-capex', formatKoreanOrM(inputs.capex));
    setText('badge-monthlyLaborSavings', formatKoreanOrM(inputs.monthlyLaborSavings));
    setText('badge-monthlyThroughputGain', formatKoreanOrM(inputs.monthlyThroughputGain));
    setText('badge-monthlyOpex', formatKoreanOrM(inputs.monthlyOpex));
    setText('badge-discountRate', `${inputs.discountRate.toFixed(1)}%`);
    setText('badge-analysisMonths', `${inputs.analysisMonths}개월`);

    // 2) 우측 KPI 카드 4종 업데이트
    const bepEl = document.getElementById('kpi-bep');
    const bepSubEl = document.getElementById('kpi-bep-sub');
    if (summary.paybackMonths === null) {
      if (bepEl) {
        bepEl.textContent = '회수 불가 (월 적자)';
        bepEl.className = 'kpi-value text-danger';
      }
      if (bepSubEl) {
        bepSubEl.textContent = '월 유지비(OPEX)가 절감액보다 큽니다';
      }
    } else {
      if (bepEl) {
        bepEl.textContent = `${summary.paybackMonths.toFixed(1)}개월`;
        bepEl.className =
          summary.paybackMonths <= inputs.analysisMonths
            ? 'kpi-value text-success'
            : 'kpi-value text-warning';
      }
      if (bepSubEl) {
        const discText =
          summary.discountedPaybackMonths !== null
            ? `할인율 반영 시 약 ${summary.discountedPaybackMonths.toFixed(1)}개월`
            : `분석 기간(${inputs.analysisMonths}개월) 내 할인회수 미달`;
        bepSubEl.textContent = discText;
      }
    }

    setText('kpi-monthly-cf', formatCurrency(summary.monthlyNetCashFlow, true));
    setText(
      'kpi-monthly-cf-sub',
      `총효익 ${formatCurrency(summary.monthlyGrossBenefit, true)} − 유지비 ${formatCurrency(inputs.monthlyOpex, true)}`
    );

    const npvEl = document.getElementById('kpi-npv');
    if (npvEl) {
      npvEl.textContent = formatCurrency(summary.finalNpv, true);
      npvEl.className = `kpi-value ${summary.finalNpv >= 0 ? 'text-accent' : 'text-danger'}`;
    }
    setText('kpi-npv-sub', `명목 누적 순이익: ${formatCurrency(summary.finalNetProfit, true)}`);

    const roiEl = document.getElementById('kpi-roi');
    if (roiEl) {
      roiEl.textContent = formatPercent(summary.totalRoiPct, 1, true);
      roiEl.className = `kpi-value ${summary.totalRoiPct >= 0 ? 'text-success' : 'text-danger'}`;
    }
    setText('kpi-roi-sub', `연환산 단순 ROI: ${formatPercent(summary.annualizedRoiPct, 1, true)}`);

    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      if (summary.paybackMonths === null) {
        verdictEl.innerHTML = `
          현재 월 운영 유지비(<strong>${formatCurrency(
            inputs.monthlyOpex,
            true
          )}</strong>)가 월 총 절감·매출효익(<strong>${formatCurrency(
          summary.monthlyGrossBenefit,
          true
        )}</strong>)보다 커서 <span class="verdict-danger">투자금 회수가 불가능(월 적자)</span>합니다.
        `;
      } else {
        verdictEl.innerHTML = `
          초기 설비 투자비 <strong>${formatCurrency(
            inputs.capex,
            true
          )}</strong>은 매월 순현금흐름 <span class="verdict-highlight">+${formatCurrency(
          summary.monthlyNetCashFlow,
          true
        )}</span>을 창출하여 <strong>약 <span class="verdict-success">${summary.paybackMonths.toFixed(
          1
        )}개월 만에 본전(BEP)을 회수</span></strong>하고, ${inputs.analysisMonths}개월간 총 <span class="verdict-highlight">${formatCurrency(
          summary.finalNetProfit,
          true
        )}</span>의 순이익을 남깁니다!
        `;
      }
    }

    // 3) 고정 시나리오(Case A) 비교 배너
    const pinBanner = document.getElementById('pinned-comparison-banner');
    if (pinBanner) {
      if (state.pinnedScenario) {
        const diffProfit = summary.finalNetProfit - state.pinnedScenario.finalNetProfit;
        const sign = diffProfit >= 0 ? '+' : '';
        pinBanner.style.display = 'block';
        pinBanner.innerHTML = `
          <strong>시나리오 A/B 비교 중:</strong>
          [${state.pinnedScenario.label}] 누적 순이익 <strong>${formatCurrency(state.pinnedScenario.finalNetProfit, true)}</strong>
          vs 현재 설정(Case B) 순이익 차액:
          <span class="${diffProfit >= 0 ? 'text-success' : 'text-danger'}" style="font-weight:700;">
            ${sign}${formatCurrency(diffProfit, true)}
          </span>
        `;
      } else {
        pinBanner.style.display = 'none';
      }
    }

    // 4) Canvas 차트 렌더링 (명목 누적 현금흐름 vs 할인된 NPV 궤적)
    const canvas = document.getElementById('sim-canvas');
    const colors = getThemeChartColors();

    const datasets = [
      {
        label: '명목 누적 순현금흐름 (Case B)',
        data: chartData.cumulativeNetSeries,
        color: colors.colorCaseB,
        fillArea: true,
      },
      {
        label: `할인율(${inputs.discountRate}%) 반영 누적 NPV`,
        data: chartData.cumulativeDiscountedSeries,
        color: colors.colorSuccess,
        dashed: false,
      },
    ];

    if (
      state.pinnedScenario &&
      Array.isArray(state.pinnedScenario.series) &&
      state.pinnedScenario.series.length === chartData.labels.length
    ) {
      datasets.push({
        label: state.pinnedScenario.label,
        data: state.pinnedScenario.series,
        color: colors.colorWarning,
        dashed: true,
      });
    }

    renderLineChart(canvas, {
      labels: chartData.labels,
      datasets,
      includeZero: true,
      yFormatter: (val) => formatCurrency(val, true),
      watermarkText: 'SimuLab Hub · B2B CAPEX ROI & BEP Simulator',
    });

    // 5) 분기별(3개월 단위) 및 주요 시점 테이블 렌더링
    const tbody = document.getElementById('period-table-body');
    if (tbody) {
      const filteredRows = periodTable.filter(
        (r) => r.month === 1 || r.month % 3 === 0 || r.month === inputs.analysisMonths
      );

      tbody.innerHTML = filteredRows
        .map((row) => {
          const statusBadge = row.isBreakEvenReached
            ? `<span class="text-success" style="font-weight:700;">BEP 돌파 (흑자)</span>`
            : `<span class="text-warning">투자금 회수중</span>`;

          return `
            <tr>
              <td><strong>${row.month}개월차</strong></td>
              <td>${formatCurrency(row.monthlyNetCashFlow, true)}</td>
              <td class="${row.cumulativeNetCashFlow >= 0 ? 'text-success' : 'text-danger'}">
                <strong>${formatCurrency(row.cumulativeNetCashFlow, true)}</strong>
              </td>
              <td>${formatCurrency(row.cumulativeNpv, true)}</td>
              <td class="${row.cumulativeRoiPct >= 0 ? 'text-success' : 'text-danger'}">
                ${formatPercent(row.cumulativeRoiPct, 1, true)}
              </td>
              <td>${statusBadge}</td>
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
