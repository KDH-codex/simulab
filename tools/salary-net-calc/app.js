/**
 * ==========================================================================
 * SimuLab - 월급 실수령액 & 세후 연봉 계산기 UI 컨트롤러
 * 파일 경로: tools/salary-net-calc/app.js
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const formatCurrency = window.SimuLab?.formatCurrency || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const formatKoreanAmount = window.SimuLab?.formatKoreanAmount || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const showToast = window.SimuLab?.showToast || ((msg) => alert(msg));

  // DOM 엘리먼트
  const modeRadios = document.querySelectorAll('input[name="salary-mode"]');
  const inputAmount = document.getElementById('input-amount');
  const badgeAmount = document.getElementById('badge-amount');
  const inputMeal = document.getElementById('input-meal');
  const badgeMeal = document.getElementById('badge-meal');
  const inputDependents = document.getElementById('input-dependents');
  const inputChildren = document.getElementById('input-children');

  // 결과 디스플레이
  const statNetMonthly = document.getElementById('stat-net-monthly');
  const statNetMonthlyKorean = document.getElementById('stat-net-monthly-korean');
  const statGrossMonthly = document.getElementById('stat-gross-monthly');
  const statNetAnnual = document.getElementById('stat-net-annual');
  const statTotalDeductions = document.getElementById('stat-total-deductions');
  const statDeductionRate = document.getElementById('stat-deduction-rate');

  // 4대보험 & 세금 세부 항목
  const detailPension = document.getElementById('detail-pension');
  const detailHealth = document.getElementById('detail-health');
  const detailCare = document.getElementById('detail-care');
  const detailEmp = document.getElementById('detail-emp');
  const detailTotalInsurance = document.getElementById('detail-total-insurance');
  const detailIncomeTax = document.getElementById('detail-income-tax');
  const detailLocalTax = document.getElementById('detail-local-tax');
  const detailTotalTax = document.getElementById('detail-total-tax');

  let currentMode = 'salary'; // 'salary' or 'annual'

  function updateKoreanBadges() {
    if (badgeAmount) {
      badgeAmount.textContent = formatKoreanAmount(Number(inputAmount.value) || 0);
    }
    if (badgeMeal) {
      badgeMeal.textContent = formatKoreanAmount(Number(inputMeal.value) || 0);
    }
  }

  function runCalculation() {
    updateKoreanBadges();

    const params = {
      inputMode: currentMode,
      inputValue: Number(inputAmount.value) || 0,
      taxFreeMeal: Number(inputMeal.value) || 0,
      dependents: Number(inputDependents.value) || 1,
      childrenUnder20: Number(inputChildren.value) || 0
    };

    const result = window.SalaryLogic.calculate(params);

    // 하이라이트: 월 세후 실수령액
    if (statNetMonthly) statNetMonthly.textContent = formatCurrency(result.monthlyNetSalary);
    if (statNetMonthlyKorean) statNetMonthlyKorean.textContent = formatKoreanAmount(result.monthlyNetSalary);

    // 서브 정보
    if (statGrossMonthly) statGrossMonthly.textContent = formatCurrency(result.monthlyGross);
    if (statNetAnnual) statNetAnnual.textContent = `${formatCurrency(result.annualNetSalary)} (${formatKoreanAmount(result.annualNetSalary)})`;
    if (statTotalDeductions) statTotalDeductions.textContent = `${formatCurrency(result.totalDeductions)} (공제율 ${result.deductionRate}%)`;
    if (statDeductionRate) statDeductionRate.textContent = `${result.deductionRate}%`;

    // 4대보험 세부 내역
    if (detailPension) detailPension.textContent = formatCurrency(result.nationalPension);
    if (detailHealth) detailHealth.textContent = formatCurrency(result.healthInsurance);
    if (detailCare) detailCare.textContent = formatCurrency(result.longTermCare);
    if (detailEmp) detailEmp.textContent = formatCurrency(result.employmentInsurance);
    if (detailTotalInsurance) detailTotalInsurance.textContent = formatCurrency(result.totalInsurance);

    // 소득세 세부 내역
    if (detailIncomeTax) detailIncomeTax.textContent = formatCurrency(result.incomeTax);
    if (detailLocalTax) detailLocalTax.textContent = formatCurrency(result.localIncomeTax);
    if (detailTotalTax) detailTotalTax.textContent = formatCurrency(result.totalTax);
  }

  // 모드 변경 (월급 vs 연봉)
  modeRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      currentMode = e.target.value;
      const unitLabel = document.getElementById('unit-salary-label');
      const inputLabel = document.getElementById('label-amount');
      const chipsContainer = document.getElementById('salary-chips-container');

      if (currentMode === 'annual') {
        if (inputLabel) inputLabel.textContent = '세전 계약 연봉';
        if (unitLabel) unitLabel.textContent = '원 / 연';
        if (Number(inputAmount.value) < 10000000) {
          inputAmount.value = 45000000; // 연봉 기본 4,500만
        }
        if (chipsContainer) {
          chipsContainer.innerHTML = `
            <button type="button" class="quick-chip-btn chip-btn" data-set="35000000">3,500만</button>
            <button type="button" class="quick-chip-btn chip-btn" data-set="45000000">4,500만</button>
            <button type="button" class="quick-chip-btn chip-btn" data-set="60000000">6,000만</button>
            <button type="button" class="quick-chip-btn chip-btn" data-set="80000000">8,000만</button>
            <button type="button" class="quick-chip-btn chip-btn" data-add="5000000">+500만</button>
          `;
          bindChips();
        }
      } else {
        if (inputLabel) inputLabel.textContent = '세전 월급여 (기본급+수당)';
        if (unitLabel) unitLabel.textContent = '원 / 월';
        if (Number(inputAmount.value) > 10000000) {
          inputAmount.value = 3500000; // 월급 기본 350만
        }
        if (chipsContainer) {
          chipsContainer.innerHTML = `
            <button type="button" class="quick-chip-btn chip-btn" data-set="2500000">250만</button>
            <button type="button" class="quick-chip-btn chip-btn" data-set="3500000">350만</button>
            <button type="button" class="quick-chip-btn chip-btn" data-set="5000000">500만</button>
            <button type="button" class="quick-chip-btn chip-btn" data-add="100000">+10만</button>
            <button type="button" class="quick-chip-btn chip-btn" data-add="500000">+50만</button>
          `;
          bindChips();
        }
      }
      runCalculation();
    });
  });

  function bindChips() {
    document.querySelectorAll('.quick-chip-btn').forEach((btn) => {
      btn.onclick = () => {
        const addVal = Number(btn.getAttribute('data-add')) || 0;
        const setVal = btn.getAttribute('data-set');
        if (setVal !== null && setVal !== undefined) {
          inputAmount.value = Number(setVal);
        } else if (addVal > 0) {
          inputAmount.value = (Number(inputAmount.value) || 0) + addVal;
        }
        runCalculation();
      };
    });
  }

  // 입력 변경 감지
  [inputAmount, inputMeal, inputDependents, inputChildren].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  // 초기화 버튼
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentMode = 'salary';
      const rad = document.querySelector('input[name="salary-mode"][value="salary"]');
      if (rad) rad.checked = true;
      inputAmount.value = 3500000;
      inputMeal.value = 200000;
      inputDependents.value = 1;
      inputChildren.value = 0;
      document.getElementById('label-amount').textContent = '세전 월급여 (기본급+수당)';
      document.getElementById('unit-salary-label').textContent = '원 / 월';
      bindChips();
      runCalculation();
      showToast('기본값(월급 350만원)으로 초기화되었습니다.');
    });
  }

  bindChips();
  runCalculation();
});
