/**
 * ==========================================================================
 * SimuLab - 직장인 퇴직금 계산기 UI 컨트롤러
 * 파일 경로: tools/severance-pay-calc/app.js
 * --------------------------------------------------------------------------
 * - DOM 이벤트 바인딩, 실시간 계산, 퀵 칩 버튼, 토스 스타일 한글 금액 표기
 * - URL 파라미터 저장/복원, 클립보드 공유, 인쇄 및 결과 다운로드
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const formatCurrency = window.SimuLab?.formatCurrency || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const formatKoreanAmount = window.SimuLab?.formatKoreanAmount || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const showToast = window.SimuLab?.showToast || ((msg) => alert(msg));

  // DOM 엘리먼트 수집
  const joinDateInput = document.getElementById('input-join-date');
  const leaveDateInput = document.getElementById('input-leave-date');
  const basePayInput = document.getElementById('input-base-pay');
  const allowanceInput = document.getElementById('input-allowance');
  const bonusInput = document.getElementById('input-bonus');
  const leavePayInput = document.getElementById('input-leave-pay');
  const ordinaryWageInput = document.getElementById('input-ordinary-wage');

  // 한글 금액 뱃지
  const basePayBadge = document.getElementById('badge-base-pay');
  const allowanceBadge = document.getElementById('badge-allowance');
  const bonusBadge = document.getElementById('badge-bonus');
  const leavePayBadge = document.getElementById('badge-leave-pay');

  // 결과 디스플레이 엘리먼트
  const statWorkDays = document.getElementById('stat-work-days');
  const statDailyWage = document.getElementById('stat-daily-wage');
  const statSeveranceGross = document.getElementById('stat-severance-gross');
  const statSeveranceNet = document.getElementById('stat-severance-net');
  const statSeveranceKorean = document.getElementById('stat-severance-korean');
  const statTaxTotal = document.getElementById('stat-tax-total');
  const statIrpSavings = document.getElementById('stat-irp-savings');
  const statOrdinaryNotice = document.getElementById('stat-ordinary-notice');
  const warningNotQualified = document.getElementById('warning-not-qualified');

  // 기본 날짜 설정 (오늘 기준 3년 전 입사, 오늘 퇴사)
  function initDefaultDates() {
    const today = new Date();
    const threeYearsAgo = new Date(today);
    threeYearsAgo.setFullYear(today.getFullYear() - 3);

    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (!joinDateInput.value) joinDateInput.value = formatDate(threeYearsAgo);
    if (!leaveDateInput.value) leaveDateInput.value = formatDate(today);
  }

  // 한글 뱃지 업데이트
  function updateKoreanBadges() {
    if (basePayBadge) basePayBadge.textContent = formatKoreanAmount(Number(basePayInput.value) || 0);
    if (allowanceBadge) allowanceBadge.textContent = formatKoreanAmount(Number(allowanceInput.value) || 0);
    if (bonusBadge) bonusBadge.textContent = formatKoreanAmount(Number(bonusInput.value) || 0);
    if (leavePayBadge) leavePayBadge.textContent = formatKoreanAmount(Number(leavePayInput.value) || 0);
  }

  // 메인 계산 및 UI 렌더링
  function runCalculation() {
    updateKoreanBadges();

    const params = {
      joinDate: joinDateInput.value,
      leaveDate: leaveDateInput.value,
      monthlyBasePay: Number(basePayInput.value) || 0,
      monthlyAllowance: Number(allowanceInput.value) || 0,
      annualBonus: Number(bonusInput.value) || 0,
      annualLeaveAllowance: Number(leavePayInput.value) || 0,
      dailyOrdinaryWage: Number(ordinaryWageInput?.value) || 0
    };

    const result = window.SeveranceLogic.calculate(params);

    // 1. 재직 기간 표시
    const { workDaysInfo, taxInfo } = result;
    if (statWorkDays) {
      if (workDaysInfo.isValid) {
        statWorkDays.textContent = `${workDaysInfo.totalDays.toLocaleString('ko-KR')}일 (${workDaysInfo.years}년 ${workDaysInfo.months}개월 ${workDaysInfo.days}일)`;
      } else {
        statWorkDays.textContent = '날짜 확인 필요';
      }
    }

    // 1년 미만 재직 시 경고 배너
    if (warningNotQualified) {
      if (workDaysInfo.isValid && !workDaysInfo.isQualified) {
        warningNotQualified.style.display = 'block';
      } else {
        warningNotQualified.style.display = 'none';
      }
    }

    // 2. 1일 평균임금
    if (statDailyWage) {
      statDailyWage.textContent = formatCurrency(result.appliedDailyWage);
    }

    // 통상임금 적용 여부 알림
    if (statOrdinaryNotice) {
      if (result.isOrdinaryApplied) {
        statOrdinaryNotice.style.display = 'block';
        statOrdinaryNotice.textContent = `💡 1일 평균임금(${formatCurrency(result.dailyAverageWage)})보다 1일 통상임금(${formatCurrency(result.dailyOrdinaryWage)})이 높아 근로기준법 제19조에 따라 더 높은 통상임금을 적용했습니다.`;
      } else {
        statOrdinaryNotice.style.display = 'none';
      }
    }

    // 3. 퇴직금 총액 및 실수령액
    if (statSeveranceGross) {
      statSeveranceGross.textContent = formatCurrency(result.estimatedSeverance);
    }
    if (statSeveranceKorean) {
      statSeveranceKorean.textContent = formatKoreanAmount(result.estimatedSeverance);
    }
    if (statSeveranceNet) {
      statSeveranceNet.textContent = formatCurrency(taxInfo.netSeverance);
    }
    if (statTaxTotal) {
      statTaxTotal.textContent = `${formatCurrency(taxInfo.taxTotal)} (실효세율 ${taxInfo.effectiveTaxRate}%)`;
    }
    if (statIrpSavings) {
      statIrpSavings.textContent = formatCurrency(taxInfo.irpTaxSavings);
    }

    // 상세 분석 테이블 업데이트
    const el3mPay = document.getElementById('detail-3m-pay');
    const elBonusPart = document.getElementById('detail-bonus-part');
    const elLeavePart = document.getElementById('detail-leave-part');
    const elTotalPart = document.getElementById('detail-total-part');
    const elDaysPart = document.getElementById('detail-days-part');

    if (el3mPay) el3mPay.textContent = formatCurrency(result.threeMonthsPay);
    if (elBonusPart) elBonusPart.textContent = formatCurrency(result.bonusPortion);
    if (elLeavePart) elLeavePart.textContent = formatCurrency(result.leavePortion);
    if (elTotalPart) elTotalPart.textContent = formatCurrency(result.grandThreeMonthsTotal);
    if (elDaysPart) elDaysPart.textContent = `${result.threeMonthsDays}일`;
  }

  // 퀵 칩 버튼 리스너 (+10만, +50만, +100만, 정정)
  document.querySelectorAll('.quick-chip-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetId = btn.getAttribute('data-target');
      const addVal = Number(btn.getAttribute('data-add')) || 0;
      const setVal = btn.getAttribute('data-set');
      const targetInput = document.getElementById(targetId);

      if (!targetInput) return;

      if (setVal !== null && setVal !== undefined) {
        targetInput.value = Number(setVal);
      } else if (addVal > 0) {
        const cur = Number(targetInput.value) || 0;
        targetInput.value = cur + addVal;
      }
      runCalculation();
    });
  });

  // 근속기간 프리셋 버튼 (1년, 3년, 5년, 10년)
  document.querySelectorAll('.period-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const years = Number(btn.getAttribute('data-years')) || 3;
      const today = new Date();
      const past = new Date(today);
      past.setFullYear(today.getFullYear() - years);

      const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      joinDateInput.value = formatDate(past);
      leaveDateInput.value = formatDate(today);
      runCalculation();
    });
  });

  // 입력 변경 시 실시간 재계산
  const allInputs = [joinDateInput, leaveDateInput, basePayInput, allowanceInput, bonusInput, leavePayInput, ordinaryWageInput];
  allInputs.forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  // 초기화 버튼
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      initDefaultDates();
      basePayInput.value = 3500000;
      allowanceInput.value = 300000;
      bonusInput.value = 3500000;
      leavePayInput.value = 500000;
      if (ordinaryWageInput) ordinaryWageInput.value = '';
      runCalculation();
      showToast('초기 기본값으로 복원되었습니다.');
    });
  }

  // 초기 실행
  initDefaultDates();
  runCalculation();
});
