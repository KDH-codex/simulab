/**
 * ==========================================================================
 * SimuLab - 실업급여 모의 계산기 UI 컨트롤러
 * 파일 경로: tools/unemployment-benefit-calc/app.js
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const formatCurrency = window.SimuLab?.formatCurrency || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const formatKoreanAmount = window.SimuLab?.formatKoreanAmount || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const showToast = window.SimuLab?.showToast || ((msg) => alert(msg));

  // DOM 엘리먼트
  const inputSalary = document.getElementById('input-salary');
  const badgeSalary = document.getElementById('badge-salary');
  const inputAge = document.getElementById('input-age');
  const inputYears = document.getElementById('input-years');
  const inputHours = document.getElementById('input-hours');

  // 결과 디스플레이
  const statTotalBenefit = document.getElementById('stat-total-benefit');
  const statTotalBenefitKorean = document.getElementById('stat-total-benefit-korean');
  const statDailyBenefit = document.getElementById('stat-daily-benefit');
  const statBenefitDays = document.getElementById('stat-benefit-days');
  const statMonthlyBenefit = document.getElementById('stat-monthly-benefit');
  const statBenefitDesc = document.getElementById('stat-benefit-desc');

  function updateKoreanBadges() {
    if (badgeSalary) {
      badgeSalary.textContent = formatKoreanAmount(Number(inputSalary.value) || 0);
    }
  }

  function runCalculation() {
    updateKoreanBadges();

    const params = {
      monthlySalary: Number(inputSalary.value) || 0,
      age: Number(inputAge.value) || 35,
      insuranceYears: Number(inputYears.value) || 3,
      dailyWorkHours: Number(inputHours.value) || 8
    };

    const res = window.UnemploymentLogic.calculate(params);

    // 하이라이트: 총 실업급여 수급액
    if (statTotalBenefit) statTotalBenefit.textContent = formatCurrency(res.totalBenefit);
    if (statTotalBenefitKorean) statTotalBenefitKorean.textContent = formatKoreanAmount(res.totalBenefit);

    // 서브 지표
    if (statDailyBenefit) statDailyBenefit.textContent = `${formatCurrency(res.finalDailyBenefit)} / 일`;
    if (statBenefitDays) statBenefitDays.textContent = `${res.benefitDays}일 (약 ${res.benefitMonths}개월간)`;
    if (statMonthlyBenefit) statMonthlyBenefit.textContent = `월 약 ${formatCurrency(res.monthlyBenefit)}`;

    if (statBenefitDesc) {
      let limitText = '';
      if (res.finalDailyBenefit === res.maxAmount) {
        limitText = ' (2026년 법정 상한액 66,000원 적용)';
      } else if (res.finalDailyBenefit === res.minAmount) {
        limitText = ' (최저임금 연동 법정 하한액 적용)';
      }
      statBenefitDesc.textContent = `1일 지급액: ${formatCurrency(res.finalDailyBenefit)}${limitText}`;
    }
  }

  // 급여 퀵 칩
  document.querySelectorAll('.quick-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const addVal = Number(btn.getAttribute('data-add')) || 0;
      const setVal = btn.getAttribute('data-set');
      if (setVal !== null && setVal !== undefined) {
        inputSalary.value = Number(setVal);
      } else if (addVal > 0) {
        inputSalary.value = (Number(inputSalary.value) || 0) + addVal;
      }
      runCalculation();
    });
  });

  // 근속 가입기간 칩
  document.querySelectorAll('.period-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-chip-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      inputYears.value = btn.getAttribute('data-years');
      runCalculation();
    });
  });

  [inputSalary, inputAge, inputYears, inputHours].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  runCalculation();
});
