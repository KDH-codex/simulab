/**
 * ==========================================================================
 * SimuLab Analytics Hub - 월 배당 목표 달성 계산기 UI 컨트롤러
 * 파일 경로: tools/dividend-goal-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 설명]
 * - 사용자가 입력한 목표 배당금, 배당수익률, 시드머니, 월 적립금을 감지하여
 *   실시간으로 필요 원금과 목표 도달 예상 기간을 계산하고 차트와 표로 보여줍니다.
 * - 프리미엄 인풋 카드, 실시간 한글 금액 읽기(억/만 원),
 *   원터치 퀵 조절 칩 버튼([1천만], [+50만] 등)을 완벽 지원합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const DividendGoal = SimuLab.DividendGoal || {};

  let currentInputs = { ...DividendGoal.DEFAULT_DIVIDEND_GOAL_INPUTS };
  let growthChartInstance = null;

  // DOM 헬퍼 함수
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
   * 1. 화면 입력값 읽기 및 상태 동기화
   */
  function readInputsFromUI() {
    return {
      targetMonthlyDividend: Number(getEl('target-monthly-input')?.value) || 1000000,
      expectedDividendYield: Number(getEl('dividend-yield-input')?.value) || 4.5,
      dividendGrowthRate: Number(getEl('dividend-growth-input')?.value) || 0,
      stockPriceGrowth: Number(getEl('price-growth-input')?.value) || 0,
      initialCapital: Number(getEl('initial-capital-input')?.value) || 0,
      monthlyContribution: Number(getEl('monthly-contrib-input')?.value) || 0,
      taxRateType: getEl('tax-type-select')?.value || 'general',
      customTaxRate: Number(getEl('custom-tax-input')?.value) || 15.4,
      reinvestDividend: getEl('reinvest-check') ? getEl('reinvest-check').checked : true,
    };
  }

  function syncInputsToUI(inputs) {
    if (getEl('target-monthly-input')) getEl('target-monthly-input').value = inputs.targetMonthlyDividend;
    if (getEl('target-monthly-slider')) getEl('target-monthly-slider').value = inputs.targetMonthlyDividend;

    if (getEl('dividend-yield-input')) getEl('dividend-yield-input').value = inputs.expectedDividendYield;
    if (getEl('dividend-yield-slider')) getEl('dividend-yield-slider').value = inputs.expectedDividendYield;

    if (getEl('dividend-growth-input')) getEl('dividend-growth-input').value = inputs.dividendGrowthRate;
    if (getEl('price-growth-input')) getEl('price-growth-input').value = inputs.stockPriceGrowth;

    if (getEl('initial-capital-input')) getEl('initial-capital-input').value = inputs.initialCapital;
    if (getEl('initial-capital-slider')) getEl('initial-capital-slider').value = inputs.initialCapital;

    if (getEl('monthly-contrib-input')) getEl('monthly-contrib-input').value = inputs.monthlyContribution;
    if (getEl('monthly-contrib-slider')) getEl('monthly-contrib-slider').value = inputs.monthlyContribution;

    if (getEl('tax-type-select')) getEl('tax-type-select').value = inputs.taxRateType;
    if (getEl('custom-tax-input')) getEl('custom-tax-input').value = inputs.customTaxRate;
    if (getEl('reinvest-check')) getEl('reinvest-check').checked = Boolean(inputs.reinvestDividend);

    toggleCustomTaxUI();
    updateBadges(inputs);

    if (SimuLab.initAllSlidersProgress) SimuLab.initAllSlidersProgress();
  }

  function updateBadges(inputs) {
    if (SimuLab.formatKoreanAmount) {
      setText('badge-target-monthly', SimuLab.formatKoreanAmount(inputs.targetMonthlyDividend));
      setText('badge-initial-capital', SimuLab.formatKoreanAmount(inputs.initialCapital));
      setText('badge-monthly-contrib', SimuLab.formatKoreanAmount(inputs.monthlyContribution));
    }
  }

  function toggleCustomTaxUI() {
    const taxType = getEl('tax-type-select')?.value;
    const customWrapper = getEl('custom-tax-wrapper');
    if (customWrapper) {
      customWrapper.style.display = taxType === 'custom' ? 'block' : 'none';
    }
  }

  /**
   * 2. 차트 렌더링 (Chart.js)
   */
  function renderGrowthChart(yearlyData, targetMonthly) {
    const canvas = getEl('growth-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = yearlyData.map((d) => `${d.year}년차`);
    const capitalData = yearlyData.map((d) => Math.round(d.totalCapital / 10000)); // 만원 단위
    const investedData = yearlyData.map((d) => Math.round(d.cumulativeInvested / 10000)); // 만원 단위
    const dividendData = yearlyData.map((d) => Math.round(d.monthlyNetDividend / 10000)); // 만원 단위

    if (growthChartInstance) {
      growthChartInstance.destroy();
    }

    growthChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '총 평가 자산 (만원)',
            data: capitalData,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            borderWidth: 2,
            fill: true,
            yAxisID: 'yCapital',
            tension: 0.2,
          },
          {
            label: '원금 누적 투자액 (만원)',
            data: investedData,
            borderColor: '#64748b',
            borderDash: [5, 5],
            borderWidth: 1.5,
            fill: false,
            yAxisID: 'yCapital',
            tension: 0,
          },
          {
            label: '월 세후 배당금 (만원)',
            data: dividendData,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            yAxisID: 'yDividend',
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
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
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
          },
          yCapital: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: '자산 규모 (만원)', font: { size: 11 } },
            ticks: {
              callback: (val) => `${val.toLocaleString()}만`,
            },
          },
          yDividend: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: '월 배당금 (만원)', font: { size: 11 } },
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (val) => `${val.toLocaleString()}만`,
            },
          },
        },
      },
    });
  }

  /**
   * 3. 대표 배당주 카드/테이블 렌더링
   */
  function renderPortfolioCards(portfolioSamples) {
    const tbody = getEl('portfolio-compare-tbody');
    if (!tbody) return;

    tbody.innerHTML = portfolioSamples
      .map(
        (p) => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 0.75rem;"><strong>${p.symbol}</strong></td>
          <td style="padding: 0.75rem; color: var(--text-secondary);">${p.name}</td>
          <td style="padding: 0.75rem; font-weight: 700; color: #10b981;">연 ${p.avgYield}%</td>
          <td style="padding: 0.75rem; font-weight: 700; color: var(--primary-color);">${formatMoneyCompact(p.requiredCap)}</td>
          <td style="padding: 0.75rem; font-size: 0.82rem; color: var(--text-muted);">${p.note}</td>
        </tr>
      `
      )
      .join('');
  }

  /**
   * 4. 연도별 상세 테이블 렌더링
   */
  function renderYearlyTable(yearlyData, targetMonthly) {
    const tbody = getEl('yearly-table-body');
    if (!tbody) return;

    tbody.innerHTML = yearlyData
      .map((d) => {
        const isReached = d.monthlyNetDividend >= targetMonthly;
        const highlightStyle = isReached ? 'background: rgba(16, 185, 129, 0.08); font-weight: 600;' : '';
        return `
          <tr style="${highlightStyle}">
            <td style="text-align: center;">${d.year}년차</td>
            <td style="text-align: right;">${formatMoney(d.cumulativeInvested)}</td>
            <td style="text-align: right; color: var(--primary-color);">${formatMoney(d.totalCapital)}</td>
            <td style="text-align: right; color: #10b981; font-weight: 600;">${formatMoney(d.monthlyNetDividend)}</td>
            <td style="text-align: right;">${formatMoney(d.annualNetDividend)}</td>
            <td style="text-align: center;">${isReached ? '<span style="color: #10b981;">달성 완료</span>' : '진행 중'}</td>
          </tr>
        `;
      })
      .join('');
  }

  /**
   * 5. 메인 시뮬레이션 실행 및 결과 UI 업데이트
   */
  function runSimulation() {
    currentInputs = readInputsFromUI();
    updateBadges(currentInputs);

    const result = DividendGoal.calculateDividendGoal(currentInputs);
    const s = result.summary;

    // 1) Verdict 배너 텍스트 갱신
    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      if (s.initialCapital >= s.requiredTotalCapital) {
        verdictText.innerHTML = `<strong>축하합니다!</strong> 현재 보유 자산(${formatMoneyCompact(s.initialCapital)})으로 이미 목표 월 배당금 <strong>${formatMoney(s.targetMonthlyDividend)}</strong>(세후)을 수령할 수 있는 충분한 원금을 확보하셨습니다.`;
        if (verdictBanner) verdictBanner.style.borderColor = '#10b981';
      } else {
        verdictText.innerHTML = `목표 월 배당 <strong>${formatMoney(s.targetMonthlyDividend)}</strong>(세후)을 받으려면 총 <strong>${formatMoneyCompact(s.requiredTotalCapital)}</strong>의 원금이 필요합니다. 현재 매월 ${formatMoneyCompact(currentInputs.monthlyContribution)}씩 추가 투자 시 <strong>${s.timeToTargetText}</strong> 후 목표에 도달할 것으로 분석됩니다.`;
        if (verdictBanner) verdictBanner.style.borderColor = '#2563eb';
      }
    }

    // 2) 요약 카드 4종 갱신
    setText('card-required-capital', formatMoneyCompact(s.requiredTotalCapital));
    setText('card-time-to-target', s.timeToTargetText);
    setText('card-current-dividend', formatMoney(s.initialMonthlyNetDividend));
    setText('card-capital-shortfall', formatMoneyCompact(s.capitalShortfall));

    // 세부 배당 지표
    setText('stat-annual-gross', formatMoney(s.targetAnnualGrossDividend));
    setText('stat-annual-net', formatMoney(s.targetAnnualNetDividend));
    setText('stat-tax-rate', `${s.effectiveTaxRatePct}%`);
    setText('stat-progress-pct', `${s.initialProgressPct}%`);

    // 3) 차트 및 테이블 갱신
    renderGrowthChart(result.yearlyData, s.targetMonthlyDividend);
    renderPortfolioCards(result.portfolioSamples);
    renderYearlyTable(result.yearlyData, s.targetMonthlyDividend);

    // 4) 로컬 스토리지 상태 저장
    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('dividend-goal-calc', currentInputs);
    }
  }

  /**
   * 6. 이벤트 리스너 바인딩
   */
  function bindEvents() {
    // 슬라이더 <-> 숫자 인풋 양방향 바인딩
    const pairs = [
      ['target-monthly-input', 'target-monthly-slider'],
      ['dividend-yield-input', 'dividend-yield-slider'],
      ['initial-capital-input', 'initial-capital-slider'],
      ['monthly-contrib-input', 'monthly-contrib-slider'],
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

    // 기타 인풋 이벤트
    ['dividend-growth-input', 'price-growth-input', 'custom-tax-input'].forEach((id) => {
      const el = getEl(id);
      if (el) el.addEventListener('input', runSimulation);
    });

    const taxSelect = getEl('tax-type-select');
    if (taxSelect) {
      taxSelect.addEventListener('change', () => {
        toggleCustomTaxUI();
        runSimulation();
      });
    }

    const reinvestCheck = getEl('reinvest-check');
    if (reinvestCheck) reinvestCheck.addEventListener('change', runSimulation);

    // 목표 월 배당금 퀵 프리셋
    document.querySelectorAll('[data-target-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-target-preset'));
        if (Number.isFinite(val)) {
          if (getEl('target-monthly-input')) getEl('target-monthly-input').value = val;
          if (getEl('target-monthly-slider')) {
            getEl('target-monthly-slider').value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(getEl('target-monthly-slider'));
          }
          runSimulation();
        }
      });
    });

    // 목표 월 배당금 퀵 증감
    document.querySelectorAll('[data-target-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-target-add')) || 0;
        const inputEl = getEl('target-monthly-input');
        const sliderEl = getEl('target-monthly-slider');
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

    // 배당수익률 퀵 프리셋
    document.querySelectorAll('[data-yield-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-yield-preset'));
        if (Number.isFinite(val)) {
          if (getEl('dividend-yield-input')) getEl('dividend-yield-input').value = val;
          if (getEl('dividend-yield-slider')) {
            getEl('dividend-yield-slider').value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(getEl('dividend-yield-slider'));
          }
          runSimulation();
        }
      });
    });

    // 시드머니 퀵 프리셋
    document.querySelectorAll('[data-capital-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-capital-preset'));
        if (Number.isFinite(val)) {
          if (getEl('initial-capital-input')) getEl('initial-capital-input').value = val;
          if (getEl('initial-capital-slider')) {
            getEl('initial-capital-slider').value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(getEl('initial-capital-slider'));
          }
          runSimulation();
        }
      });
    });

    // 시드머니 퀵 증감
    document.querySelectorAll('[data-capital-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-capital-add')) || 0;
        const inputEl = getEl('initial-capital-input');
        const sliderEl = getEl('initial-capital-slider');
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

    // 월 적립금 퀵 프리셋
    document.querySelectorAll('[data-contrib-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-contrib-preset'));
        if (Number.isFinite(val)) {
          if (getEl('monthly-contrib-input')) getEl('monthly-contrib-input').value = val;
          if (getEl('monthly-contrib-slider')) {
            getEl('monthly-contrib-slider').value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(getEl('monthly-contrib-slider'));
          }
          runSimulation();
        }
      });
    });

    // 월 적립금 퀵 증감
    document.querySelectorAll('[data-contrib-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-contrib-add')) || 0;
        const inputEl = getEl('monthly-contrib-input');
        const sliderEl = getEl('monthly-contrib-slider');
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

    // 공유하기 버튼
    const shareBtn = getEl('share-btn');
    if (shareBtn && SimuLab.shareSimulationUrl) {
      shareBtn.addEventListener('click', () => {
        SimuLab.shareSimulationUrl(readInputsFromUI());
      });
    }

    // CSV 다운로드 버튼
    const csvBtn = getEl('export-csv-btn');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const result = DividendGoal.calculateDividendGoal(readInputsFromUI());
        const headers = ['연차', '누적투자원금', '총평가자산', '월세후배당금', '연세후배당금', '목표달성여부'];
        const rows = result.yearlyData.map((d) => [
          `${d.year}년차`,
          d.cumulativeInvested,
          d.totalCapital,
          d.monthlyNetDividend,
          d.annualNetDividend,
          d.isTargetReached ? '달성' : '진행중',
        ]);
        if (SimuLab.exportTableToCsv) {
          SimuLab.exportTableToCsv('월배당_목표달성_시뮬레이션.csv', headers, rows);
        }
      });
    }
  }

  /**
   * 7. 초기 구동
   */
  function init() {
    if (SimuLab.initCommonUI) {
      SimuLab.initCommonUI('dividend-goal-calc');
    }

    let initialValues = { ...DividendGoal.DEFAULT_DIVIDEND_GOAL_INPUTS };
    if (SimuLab.parseUrlParams) {
      initialValues = SimuLab.parseUrlParams(initialValues);
    } else if (SimuLab.loadToolState) {
      const saved = SimuLab.loadToolState('dividend-goal-calc');
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
