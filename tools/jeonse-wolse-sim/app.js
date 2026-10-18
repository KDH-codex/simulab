/**
 * ==========================================================================
 * [도구 6] 전세 vs 월세(반전세) 전환율 & 주거 기회비용 비교 시뮬레이터 - UI 컨트롤러
 * 파일 경로: tools/jeonse-wolse-sim/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 전세보증금, 월세보증금, 월세, 전세대출금리, 보유 현금 슬라이더를 움직일 때마다
 *   법정 전월세 전환율 상한과 거주 기간 후 순자산 우위를 60fps 차트로 시각화합니다.
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
    DEFAULT_JEONSE_INPUTS,
    sanitizeJeonseInputs,
    calculateJeonseWolseSimulation,
  } = window.SimuLab.JeonseLogic;

  const TOOL_ID = 'jeonse-wolse-sim';

  const PRESETS = {
    apt: {
      ownCapital: 120000000,
      jeonseDeposit: 450000000,
      jeonseLoanRate: 3.9,
      wolseDeposit: 100000000,
      monthlyRent: 1350000,
      investmentReturnRate: 4.5,
      bokBaseRate: 3.0,
      rentTaxCreditRate: 15,
      residenceYears: 4,
    },
    officetel: {
      ownCapital: 50000000,
      jeonseDeposit: 200000000,
      jeonseLoanRate: 3.6,
      wolseDeposit: 20000000,
      monthlyRent: 750000,
      investmentReturnRate: 4.5,
      bokBaseRate: 3.0,
      rentTaxCreditRate: 17,
      residenceYears: 2,
    },
    youth: {
      ownCapital: 30000000,
      jeonseDeposit: 150000000,
      jeonseLoanRate: 2.1, // 청년 버팀목 저금리
      wolseDeposit: 10000000,
      monthlyRent: 600000,
      investmentReturnRate: 4.0,
      bokBaseRate: 3.0,
      rentTaxCreditRate: 17,
      residenceYears: 4,
    },
  };

  let state = {
    currentInputs: { ...DEFAULT_JEONSE_INPUTS },
    pinnedScenario: null,
    lastResult: null,
  };

  let rafPending = false;

  function bootstrap() {
    initCommonUI(TOOL_ID);

    injectSeoSchema({
      name: '전세 vs 월세(반전세) 전환율 및 주거 기회비용 비교 시뮬레이터',
      description:
        '전세자금대출 이자, 보증금 차액 투자 기회비용, 월세 세액공제(15~17%), 주택임대차보호법상 법정 전월세 전환율 상한을 반영해 전세와 월세 중 유리한 선택을 계산하는 부동산 시뮬레이터',
      category: 'FinanceApplication',
    });

    const savedState = loadToolState(TOOL_ID);
    if (savedState && savedState.currentInputs) {
      state.currentInputs = sanitizeJeonseInputs(savedState.currentInputs);
      if (savedState.pinnedScenario) {
        state.pinnedScenario = savedState.pinnedScenario;
      }
    }
    if (window.location.search) {
      state.currentInputs = sanitizeJeonseInputs(parseUrlParams(state.currentInputs));
    }

    syncInputsToDOM(state.currentInputs);
    bindEvents();
    runSimulationAndRender();
  }

  function syncInputsToDOM(inputs) {
    const fields = [
      { key: 'ownCapital', scale: 0.0001 },      // 만원 단위
      { key: 'jeonseDeposit', scale: 0.0001 },   // 만원 단위
      { key: 'jeonseLoanRate', scale: 1 },
      { key: 'wolseDeposit', scale: 0.0001 },    // 만원 단위
      { key: 'monthlyRent', scale: 0.0001 },     // 만원 단위
      { key: 'investmentReturnRate', scale: 1 },
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

    const creditBtns = document.querySelectorAll('[data-credit]');
    creditBtns.forEach((btn) => {
      const val = Number(btn.getAttribute('data-credit'));
      btn.classList.toggle('active', val === inputs.rentTaxCreditRate);
    });

    initAllSlidersProgress();
  }

  function bindEvents() {
    const fields = [
      { key: 'ownCapital', toRaw: (v) => Number(v) * 10000 },
      { key: 'jeonseDeposit', toRaw: (v) => Number(v) * 10000 },
      { key: 'jeonseLoanRate', toRaw: (v) => Number(v) },
      { key: 'wolseDeposit', toRaw: (v) => Number(v) * 10000 },
      { key: 'monthlyRent', toRaw: (v) => Number(v) * 10000 },
      { key: 'investmentReturnRate', toRaw: (v) => Number(v) },
      { key: 'residenceYears', toRaw: (v) => Number(v) },
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

    // 주거 유형 빠른 프리셋
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
          showToast('주거 비교 프리셋이 적용되었습니다.');
        }
      });
    });

    // 월세 세액공제율 선택
    const creditBtns = document.querySelectorAll('[data-credit]');
    creditBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentInputs.rentTaxCreditRate = Number(btn.getAttribute('data-credit'));
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
            label: `고정(Case A): 전세 ${formatCurrency(inputs.jeonseDeposit, true)} vs 월세 ${formatCurrency(inputs.monthlyRent, true)}`,
            winner: summary.winner,
            winnerAdvantageAmount: summary.winnerAdvantageAmount,
            series: [...chartData.jeonseNetWorthSeries],
          };
          pinBtn.textContent = '고정 시나리오(Case A) 해제';
          showToast('현재 매물 비교 조건이 Case A로 고정되었습니다.');
        }

        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        scheduleRender();
      });
    }

    // 초기화
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.currentInputs = { ...DEFAULT_JEONSE_INPUTS };
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
        exportCanvasToPng(canvas, 'jeonse-vs-wolse-simulation.png');
      });
    }

    // CSV 다운로드
    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        if (!state.lastResult) return;
        const headers = [
          '거주 연차',
          '전세 누적 이자지출(원)',
          '월세 누적 순지출(세액공제 반영, 원)',
          '전세 선택 시 예상 순자산(원)',
          '월세 선택 시 예상 순자산(원)',
          '전세 우위 차액(원)',
        ];
        const rows = state.lastResult.yearlyTable.map((r) => [
          `${r.year}년 후`,
          r.jeonseCumulativeOutflow,
          r.wolseCumulativeOutflow,
          r.jeonseNetWorth,
          r.wolseNetWorth,
          r.netWorthDiff,
        ]);
        exportDataToCsv(headers, rows, 'jeonse-vs-wolse-comparison.csv');
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
    const result = calculateJeonseWolseSimulation(state.currentInputs);
    state.lastResult = result;
    const { inputs, summary, chartData, yearlyTable } = result;

    // 1) 좌측 입력 배지 업데이트
    setText('badge-ownCapital', formatCurrency(inputs.ownCapital, true));
    setText('badge-jeonseDeposit', formatCurrency(inputs.jeonseDeposit, true));
    setText('badge-jeonseLoanRate', `연 ${inputs.jeonseLoanRate.toFixed(1)}%`);
    setText('badge-wolseDeposit', formatCurrency(inputs.wolseDeposit, true));
    setText('badge-monthlyRent', formatCurrency(inputs.monthlyRent, true));
    setText('badge-investmentReturnRate', `연 ${inputs.investmentReturnRate.toFixed(1)}%`);
    setText('badge-residenceYears', `${inputs.residenceYears}년`);

    // 2) 우측 KPI 카드 4종 업데이트
    const winnerEl = document.getElementById('kpi-winner');
    if (winnerEl) {
      if (summary.winner === 'JEONSE') {
        winnerEl.textContent = `전세 유리 (+${formatCurrency(summary.winnerAdvantageAmount, true)})`;
        winnerEl.className = 'kpi-value text-accent';
      } else {
        winnerEl.textContent = `월세 유리 (+${formatCurrency(summary.winnerAdvantageAmount, true)})`;
        winnerEl.className = 'kpi-value text-success';
      }
    }
    setText(
      'kpi-winner-sub',
      `${inputs.residenceYears}년 거주 후 기회비용·세액공제 반영 순자산 차이`
    );

    const convEl = document.getElementById('kpi-conversion-rate');
    if (convEl) {
      convEl.textContent = formatPercent(summary.marketConversionRatePct, 2, false);
      convEl.className = `kpi-value ${summary.isOverLegalCap ? 'text-warning' : 'text-success'}`;
    }
    setText(
      'kpi-conversion-sub',
      `법정 상한(${summary.legalCapRatePct.toFixed(1)}%) 기준 적정월세 ${formatCurrency(summary.legalAppropriateMonthlyRent, true)}`
    );

    setText('kpi-jeonse-cost', `월 ${formatCurrency(summary.jeonseMonthlyLoanInterest, true)}`);
    setText(
      'kpi-jeonse-cost-sub',
      `전세대출 ${formatCurrency(summary.jeonseLoanNeeded, true)} (연 ${inputs.jeonseLoanRate}%)`
    );

    const effectiveWolse = Math.max(0, inputs.monthlyRent - summary.monthlyRentTaxCredit);
    setText('kpi-wolse-cost', `월 ${formatCurrency(effectiveWolse, true)}`);
    setText(
      'kpi-wolse-cost-sub',
      `월세 세액공제 월평균 ${formatCurrency(summary.monthlyRentTaxCredit, true)} 절감 반영`
    );

    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      const winnerLabel = summary.winner === 'JEONSE' ? '전세 거주' : '월세(반전세) 거주';
      const winnerClass = summary.winner === 'JEONSE' ? 'verdict-highlight' : 'verdict-success';
      const capNotice = summary.isOverLegalCap
        ? `현재 집주인이 요구하는 전환율(<span class="verdict-warning">${summary.marketConversionRatePct.toFixed(
            2
          )}%</span>)이 법정 상한(${summary.legalCapRatePct.toFixed(1)}%)보다 높습니다.`
        : `이 매물의 전환율(<span class="verdict-success">${summary.marketConversionRatePct.toFixed(
            2
          )}%</span>)은 법정 상한(${summary.legalCapRatePct.toFixed(1)}%) 이내로 양호합니다.`;

      verdictEl.innerHTML = `
        <strong>${inputs.residenceYears}년 거주</strong> 후 보증금 투자수익과 월세 세액공제를 모두 합산하면,
        <span class="${winnerClass}">${winnerLabel}가 순자산 기준 +${formatCurrency(
        summary.winnerAdvantageAmount,
        true
      )} 더 이득</span>입니다! ${capNotice}
      `;
    }

    // 3) 고정 시나리오 비교 배너
    const pinBanner = document.getElementById('pinned-comparison-banner');
    if (pinBanner) {
      if (state.pinnedScenario) {
        pinBanner.style.display = 'block';
        pinBanner.innerHTML = `
          <strong>시나리오 A/B 비교 중:</strong>
          [${state.pinnedScenario.label}] 우위 금액 <strong>${formatCurrency(state.pinnedScenario.winnerAdvantageAmount, true)}</strong>
          vs 현재(Case B) 우위 금액 <strong>${formatCurrency(summary.winnerAdvantageAmount, true)}</strong>
        `;
      } else {
        pinBanner.style.display = 'none';
      }
    }

    // 4) Canvas 차트 렌더링
    const canvas = document.getElementById('sim-canvas');
    const colors = getThemeChartColors();

    const datasets = [
      {
        label: '전세 거주 시 예상 순자산 (아낀 주거비 재투자)',
        data: chartData.jeonseNetWorthSeries,
        color: colors.colorCaseB,
        fillArea: summary.winner === 'JEONSE',
      },
      {
        label: '월세(반전세) 거주 시 예상 순자산 (보증금 차액 운용)',
        data: chartData.wolseNetWorthSeries,
        color: colors.colorSuccess,
        fillArea: summary.winner === 'WOLSE',
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
      includeZero: false,
      yFormatter: (val) => formatCurrency(val, true),
      watermarkText: 'SIMULAB · JEONSE VS WOLSE ENGINE',
    });

    // 5) 연차별 비교 테이블 렌더링
    const tbody = document.getElementById('yearly-table-body');
    if (tbody) {
      tbody.innerHTML = yearlyTable
        .map((row) => {
          const isJeonseWin = row.netWorthDiff >= 0;
          const badge = isJeonseWin
            ? `<span class="text-accent" style="font-weight:700;">전세 +${formatCurrency(row.netWorthDiff, true)}</span>`
            : `<span class="text-success" style="font-weight:700;">월세 +${formatCurrency(Math.abs(row.netWorthDiff), true)}</span>`;

          return `
            <tr>
              <td><strong>${row.year}년 후</strong></td>
              <td>${formatCurrency(row.jeonseCumulativeOutflow, true)}</td>
              <td>${formatCurrency(row.wolseCumulativeOutflow, true)}</td>
              <td><strong>${formatCurrency(row.jeonseNetWorth, true)}</strong></td>
              <td><strong>${formatCurrency(row.wolseNetWorth, true)}</strong></td>
              <td>${badge}</td>
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
