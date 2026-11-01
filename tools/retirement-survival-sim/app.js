/**
 * ==========================================================================
 * SimuLab Analytics Hub - 은퇴 생존 기간 계산기 UI 컨트롤러
 * 파일 경로: tools/retirement-survival-sim/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 및 핀테크 인터랙션 설명]
 * 1) 토스/카카오뱅크 스타일 실시간 한글 금액 읽기 (예: 4억 원, 150만 원) 뱃지 갱신.
 * 2) 원터치 퀵 조절 칩 버튼 (+1천만, +1억 등) 터치 시 슬라이더와 연동하여 1초 만에 조정.
 * 3) 은퇴 전 저축 축적과 은퇴 후 물가상승 생활비, 국민연금 수령을 종합하여
 *    노후 자산이 몇 세까지 유지되는지 차트와 표로 실시간 시각화합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const RetireCalc = SimuLab.RetirementSurvival || {};

  let currentInputs = { ...RetireCalc.DEFAULT_RETIRE_INPUTS };
  let assetChartInstance = null;

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
   * 토스/핀테크 스타일 한글 금액 포맷팅 유틸리티
   */
  function formatKorean(amount) {
    if (SimuLab.formatKoreanAmount) {
      return SimuLab.formatKoreanAmount(amount);
    }
    return formatMoneyCompact(amount);
  }

  /**
   * 1. 토스 스타일 실시간 한글 금액 읽기 뱃지 갱신
   */
  function updateKoreanBadges(inputs) {
    // 은퇴까지 남은 연수
    const yearsLeft = inputs.retirementAge - inputs.currentAge;
    const badgeYears = getEl('badge-years-to-retire');
    if (badgeYears) {
      badgeYears.textContent = yearsLeft > 0 ? `은퇴까지 ${yearsLeft}년 남음` : '은퇴 시점 도달';
    }

    // 현재 보유 순자산
    const badgeAsset = getEl('badge-current-asset');
    if (badgeAsset) {
      badgeAsset.textContent = `✨ ${formatKorean(inputs.currentAsset)}`;
    }

    // 은퇴 전 월 저축액
    const badgeSave = getEl('badge-monthly-save');
    if (badgeSave) {
      badgeSave.textContent = `✨ 월 ${formatKorean(inputs.monthlySaveUntilRetire)}`;
    }

    // 은퇴 후 월 생활비
    const badgeExpense = getEl('badge-monthly-expense');
    if (badgeExpense) {
      badgeExpense.textContent = `✨ 월 ${formatKorean(inputs.monthlyExpense)}`;
    }

    // 국민연금 월 수령액
    const badgePension = getEl('badge-pension-monthly');
    if (badgePension) {
      badgePension.textContent = `✨ 월 ${formatKorean(inputs.pensionMonthly)}`;
    }
  }

  /**
   * 2. UI 입력값 동기화
   */
  function readInputsFromUI() {
    return {
      currentAge: Number(getEl('current-age-input')?.value) || 45,
      retirementAge: Number(getEl('retire-age-input')?.value) || 55,
      currentAsset: Number(getEl('current-asset-input')?.value) || 400000000,
      monthlySaveUntilRetire: Number(getEl('monthly-save-input')?.value) || 1500000,
      monthlyExpense: Number(getEl('monthly-expense-input')?.value) || 2500000,
      investmentReturn: Number(getEl('inv-return-input')?.value) || 5.0,
      inflationRate: Number(getEl('inflation-input')?.value) || 2.5,
      pensionAge: Number(getEl('pension-age-input')?.value) || 65,
      pensionMonthly: Number(getEl('pension-monthly-input')?.value) || 800000,
    };
  }

  function syncInputsToUI(inputs) {
    if (getEl('current-age-input')) getEl('current-age-input').value = inputs.currentAge;
    if (getEl('retire-age-input')) getEl('retire-age-input').value = inputs.retirementAge;
    if (getEl('retire-age-slider')) getEl('retire-age-slider').value = inputs.retirementAge;

    if (getEl('current-asset-input')) getEl('current-asset-input').value = inputs.currentAsset;
    if (getEl('current-asset-slider')) getEl('current-asset-slider').value = inputs.currentAsset;

    if (getEl('monthly-save-input')) getEl('monthly-save-input').value = inputs.monthlySaveUntilRetire;
    if (getEl('monthly-save-slider')) getEl('monthly-save-slider').value = inputs.monthlySaveUntilRetire;

    if (getEl('monthly-expense-input')) getEl('monthly-expense-input').value = inputs.monthlyExpense;
    if (getEl('monthly-expense-slider')) getEl('monthly-expense-slider').value = inputs.monthlyExpense;

    if (getEl('inv-return-input')) getEl('inv-return-input').value = inputs.investmentReturn;
    if (getEl('inflation-input')) getEl('inflation-input').value = inputs.inflationRate;
    if (getEl('pension-age-input')) getEl('pension-age-input').value = inputs.pensionAge;
    if (getEl('pension-monthly-input')) getEl('pension-monthly-input').value = inputs.pensionMonthly;

    updateKoreanBadges(inputs);
    if (SimuLab.initAllSlidersProgress) SimuLab.initAllSlidersProgress();
  }

  /**
   * 3. 차트 렌더링
   */
  function renderAssetChart(yearlyHistory, retireAge) {
    const canvas = getEl('asset-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = yearlyHistory.map((d) => `${d.age}세`);
    const assetData = yearlyHistory.map((d) => Math.round(d.asset / 10000)); // 만원 단위

    if (assetChartInstance) {
      assetChartInstance.destroy();
    }

    assetChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '은퇴 잔여 자산 (만원)',
            data: assetData,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.15,
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
   * 4. 연도별 테이블 렌더링
   */
  function renderYearlyTable(history) {
    const tbody = getEl('yearly-table-body');
    if (!tbody) return;

    tbody.innerHTML = history
      .map(
        (d) => `
        <tr style="${d.isDepleted ? 'background: rgba(239, 68, 68, 0.06);' : ''}">
          <td style="text-align: center;">${d.age}세</td>
          <td style="text-align: right; font-weight: 600; color: ${d.isDepleted ? '#ef4444' : 'var(--primary-color)'};">
            ${formatMoney(d.asset)}
          </td>
          <td style="text-align: right;">${formatMoney(d.annualExpense)}</td>
          <td style="text-align: right; color: #10b981;">${formatMoney(d.annualPension)}</td>
          <td style="text-align: right; color: var(--text-secondary);">${formatMoney(d.annualWithdrawal)}</td>
          <td style="text-align: center;">${d.isDepleted ? '<span style="color: #ef4444; font-weight: 600;">고갈</span>' : '안정'}</td>
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
    updateKoreanBadges(currentInputs);

    const result = RetireCalc.calculateRetirementSurvival(currentInputs);
    const s = result.summary;

    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      verdictText.innerHTML = `
        <strong>은퇴 자산 생존 판정: ${s.depletionAge}</strong><br/>
        현재 계획대로라면 은퇴 시점(${s.retirementAge}세)에 약 <strong>${formatMoneyCompact(s.assetAtRetirement)}</strong>의 자산을 확보하게 되며, 첫해 인출률은 <strong>${s.initialWithdrawalRate}%</strong>입니다.<br/>
        <span style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem; display: inline-block;">${s.survivalVerdict}</span>
      `;
      if (verdictBanner) {
        verdictBanner.style.borderColor = s.isPerpetual || (s.depletionAgeNum && s.depletionAgeNum >= 90) ? '#10b981' : '#f59e0b';
      }
    }

    // 요약 카드 4종
    setText('card-depletion-age', typeof s.depletionAge === 'number' ? `${s.depletionAge}세` : s.depletionAge);
    setText('card-retire-asset', formatMoneyCompact(s.assetAtRetirement));
    setText('card-withdrawal-rate', `${s.initialWithdrawalRate}%`);
    setText('card-total-pension', formatMoneyCompact(s.totalPensionReceived));

    // 세부 배지
    setText('stat-years-left', `${s.retirementAge - s.currentAge}년 남음`);
    setText('stat-first-expense', formatMoney(currentInputs.monthlyExpense));
    setText('stat-inv-return', `연 ${currentInputs.investmentReturn}%`);
    setText('stat-safety-badge', s.initialWithdrawalRate <= 4.0 ? '안전 (4% 룰 충족)' : '주의 (인출률 4% 초과)');

    renderAssetChart(result.yearlyHistory, s.retirementAge);
    renderYearlyTable(result.yearlyHistory);

    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('retirement-survival-sim', currentInputs);
    }
  }

  /**
   * 6. 이벤트 바인딩
   */
  function bindEvents() {
    const pairs = [
      ['retire-age-input', 'retire-age-slider'],
      ['current-asset-input', 'current-asset-slider'],
      ['monthly-save-input', 'monthly-save-slider'],
      ['monthly-expense-input', 'monthly-expense-slider'],
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

    ['current-age-input', 'inv-return-input', 'inflation-input', 'pension-age-input', 'pension-monthly-input'].forEach((id) => {
      const el = getEl(id);
      if (el) el.addEventListener('input', runSimulation);
    });

    // 퀵 조절 칩 버튼 이벤트 위임 처리
    document.querySelectorAll('.quick-chip-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const inputEl = getEl(targetId);
        if (!inputEl) return;

        let curVal = Number(inputEl.value) || 0;
        if (btn.hasAttribute('data-add')) {
          curVal += Number(btn.getAttribute('data-add'));
        } else if (btn.hasAttribute('data-set')) {
          curVal = Number(btn.getAttribute('data-set'));
        }

        // 최대/최소값 보호
        if (inputEl.min && curVal < Number(inputEl.min)) curVal = Number(inputEl.min);
        if (inputEl.max && curVal > Number(inputEl.max)) curVal = Number(inputEl.max);

        inputEl.value = curVal;
        // input 이벤트 수동 발생 -> 슬라이더 & 한글 뱃지 & 결과 자동 동기화
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
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
        const result = RetireCalc.calculateRetirementSurvival(readInputsFromUI());
        const headers = ['나이', '잔여은퇴자산', '연간생활비지출', '국민연금수령액', '자산순인출액', '고갈여부'];
        const rows = result.yearlyHistory.map((d) => [
          `${d.age}세`,
          d.asset,
          d.annualExpense,
          d.annualPension,
          d.annualWithdrawal,
          d.isDepleted ? '고갈' : '정상',
        ]);
        if (SimuLab.exportTableToCsv) {
          SimuLab.exportTableToCsv('은퇴생존기간_자산고갈_시뮬레이션.csv', headers, rows);
        }
      });
    }
  }

  /**
   * 7. 초기화
   */
  function init() {
    if (SimuLab.initCommonUI) {
      SimuLab.initCommonUI('retirement-survival-sim');
    }

    let initialValues = { ...RetireCalc.DEFAULT_RETIRE_INPUTS };
    if (SimuLab.parseUrlParams) {
      initialValues = SimuLab.parseUrlParams(initialValues);
    } else if (SimuLab.loadToolState) {
      const saved = SimuLab.loadToolState('retirement-survival-sim');
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
