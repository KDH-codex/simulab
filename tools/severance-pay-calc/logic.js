/**
 * ==========================================================================
 * SimuLab - 직장인 퇴직금 계산기 로직 엔진
 * 파일 경로: tools/severance-pay-calc/logic.js
 * --------------------------------------------------------------------------
 * [법적 근거 및 산정 공식]
 * 1. 근로기준법 제34조 및 근로자퇴직급여 보장법 제8조:
 *    - 퇴직금 = 1일 평균임금 × 30일 × (재직일수 / 365일)
 * 2. 1일 평균임금 (퇴직일 이전 3개월):
 *    - (3개월 급여 총액 + 연간 상여금×3/12 + 연차수당×3/12) / 3개월 총 일수
 * 3. 근로기준법 제19조 제2항 (통상임금 비교 보장):
 *    - 평균임금이 통상임금보다 낮을 경우, '1일 통상임금'을 1일 평균임금으로 간주
 * 4. 2026년 퇴직소득세 간이 공제 및 IRP 30% 감면 계산
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const SeveranceLogic = {};

  /**
   * 두 날짜 사이의 총 재직일수를 계산합니다.
   * 입사일(joinDate) ~ 퇴사일(leaveDate)
   * 퇴사일은 마지막 근무일 다음 날(퇴직 효력 발생일)로 계산하는 것이 통상 원칙입니다.
   */
  SeveranceLogic.calculateWorkingDays = function (joinDateStr, leaveDateStr) {
    if (!joinDateStr || !leaveDateStr) {
      return { totalDays: 0, years: 0, months: 0, days: 0, isValid: false };
    }
    const start = new Date(joinDateStr);
    const end = new Date(leaveDateStr);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime <= 0) {
      return { totalDays: 0, years: 0, months: 0, days: 0, isValid: false };
    }
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = totalDays - (years * 365 + months * 30);

    return {
      totalDays,
      years,
      months,
      days,
      isValid: totalDays >= 1,
      isQualified: totalDays >= 365 // 1년 이상 근무 시 법정 퇴직금 발생
    };
  };

  /**
   * 퇴직 전 3개월간의 실제 일수를 계산합니다.
   * 기본적으로 퇴사일 기준 직전 3개월 일수 (통상 90일~92일, 기본 91일)
   */
  SeveranceLogic.calculateThreeMonthsDays = function (leaveDateStr) {
    if (!leaveDateStr) return 91;
    const leave = new Date(leaveDateStr);
    // 3개월 전 날짜 계산
    const threeMonthsAgo = new Date(leave);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const diffDays = Math.round((leave - threeMonthsAgo) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 91;
  };

  /**
   * 2026년 근속연수공제액 계산
   */
  SeveranceLogic.calculateServiceDeduction = function (serviceYears) {
    const y = Math.max(1, Math.ceil(serviceYears));
    if (y <= 5) {
      return y * 1000000;
    } else if (y <= 10) {
      return 5000000 + (y - 5) * 2000000;
    } else if (y <= 20) {
      return 15000000 + (y - 10) * 2500000;
    } else {
      return 40000000 + (y - 20) * 3000000;
    }
  };

  /**
   * 퇴직소득세 간이 계산 (2026년 소득세법 기준 추정치)
   * 실제 연말정산/원천징수 시 지방소득세 10% 포함
   */
  SeveranceLogic.estimateSeveranceTax = function (severanceAmount, serviceYears) {
    if (severanceAmount <= 0) return { taxTotal: 0, irpTaxSavings: 0, netSeverance: 0 };

    const y = Math.max(1, Math.ceil(serviceYears));
    // 1. 근속연수 공제
    const serviceDeduction = SeveranceLogic.calculateServiceDeduction(y);
    const taxBase1 = Math.max(0, severanceAmount - serviceDeduction);

    if (taxBase1 <= 0) {
      return {
        taxTotal: 0,
        irpTaxSavings: 0,
        netSeverance: severanceAmount,
        effectiveTaxRate: 0
      };
    }

    // 2. 환산급여 산출 (taxBase1 / 근속연수 × 12)
    const convertedSalary = (taxBase1 / y) * 12;

    // 3. 환산급여 공제
    let convertedDeduction = 0;
    if (convertedSalary <= 8000000) {
      convertedDeduction = convertedSalary;
    } else if (convertedSalary <= 70000000) {
      convertedDeduction = 8000000 + (convertedSalary - 8000000) * 0.6;
    } else if (convertedSalary <= 120000000) {
      convertedDeduction = 45200000 + (convertedSalary - 70000000) * 0.55;
    } else if (convertedSalary <= 300000000) {
      convertedDeduction = 72700000 + (convertedSalary - 120000000) * 0.45;
    } else {
      convertedDeduction = 153700000 + (convertedSalary - 300000000) * 0.35;
    }

    const convertedTaxBase = Math.max(0, convertedSalary - convertedDeduction);

    // 4. 기본 세율 적용 (소득세율 누진표)
    let convertedTax = 0;
    if (convertedTaxBase <= 14000000) {
      convertedTax = convertedTaxBase * 0.06;
    } else if (convertedTaxBase <= 50000000) {
      convertedTax = 840000 + (convertedTaxBase - 14000000) * 0.15;
    } else if (convertedTaxBase <= 88000000) {
      convertedTax = 6240000 + (convertedTaxBase - 50000000) * 0.24;
    } else if (convertedTaxBase <= 150000000) {
      convertedTax = 15360000 + (convertedTaxBase - 88000000) * 0.35;
    } else if (convertedTaxBase <= 300000000) {
      convertedTax = 37060000 + (convertedTaxBase - 150000000) * 0.38;
    } else if (convertedTaxBase <= 500000000) {
      convertedTax = 94060000 + (convertedTaxBase - 300000000) * 0.40;
    } else {
      convertedTax = 174060000 + (convertedTaxBase - 500000000) * 0.42;
    }

    // 5. 최종 퇴직소득 산출세액 (환산세액 / 12 × 근속연수) + 지방소득세 10%
    const incomeTax = Math.round((convertedTax / 12) * y);
    const localTax = Math.round(incomeTax * 0.1);
    const taxTotal = incomeTax + localTax;

    // 6. IRP 계좌 연금 수령 시 30% 감면액
    const irpTaxSavings = Math.round(taxTotal * 0.30);
    const netSeverance = Math.max(0, severanceAmount - taxTotal);
    const effectiveTaxRate = severanceAmount > 0 ? (taxTotal / severanceAmount) * 100 : 0;

    return {
      taxTotal,
      irpTaxSavings,
      netSeverance,
      effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100
    };
  };

  /**
   * 종합 퇴직금 시뮬레이션 계산 함수
   * @param {Object} params 입력 데이터
   */
  SeveranceLogic.calculate = function (params) {
    const {
      joinDate,
      leaveDate,
      monthlyBasePay = 3500000,     // 기본급(월)
      monthlyAllowance = 300000,    // 고정수당(월)
      annualBonus = 3500000,        // 연간 상여금 총액
      annualLeaveAllowance = 500000,// 연간 미사용 연차수당
      dailyOrdinaryWage = 0         // 1일 통상임금 (0이면 자동 계산: 월급여/209시간*8시간)
    } = params;

    const workDaysInfo = SeveranceLogic.calculateWorkingDays(joinDate, leaveDate);
    const totalDays = workDaysInfo.totalDays;
    const serviceYears = totalDays / 365;

    // 1. 퇴직 전 3개월 임금 총액 산출
    const monthlyTotal = (Number(monthlyBasePay) || 0) + (Number(monthlyAllowance) || 0);
    const threeMonthsPay = monthlyTotal * 3;

    // 2. 상여금 및 연차수당 3/12 반영
    const bonusPortion = ((Number(annualBonus) || 0) * 3) / 12;
    const leavePortion = ((Number(annualLeaveAllowance) || 0) * 3) / 12;

    const grandThreeMonthsTotal = threeMonthsPay + bonusPortion + leavePortion;
    const threeMonthsDays = SeveranceLogic.calculateThreeMonthsDays(leaveDate);

    // 3. 1일 평균임금 산정
    const dailyAverageWage = threeMonthsDays > 0 ? Math.round(grandThreeMonthsTotal / threeMonthsDays) : 0;

    // 4. 1일 통상임금 산정 (비교용)
    // 주 40시간 근로자 통상 월 209시간 기준, 1일 8시간 근무 가정
    let calculatedDailyOrdinary = Number(dailyOrdinaryWage) || 0;
    if (calculatedDailyOrdinary <= 0 && monthlyTotal > 0) {
      const hourlyWage = monthlyTotal / 209;
      calculatedDailyOrdinary = Math.round(hourlyWage * 8);
    }

    // 근로기준법 제19조 제2항: 통상임금이 평균임금보다 높으면 통상임금 적용!
    const isOrdinaryApplied = calculatedDailyOrdinary > dailyAverageWage;
    const appliedDailyWage = Math.max(dailyAverageWage, calculatedDailyOrdinary);

    // 5. 법정 퇴직금 산출 공식: 1일 적용임금 × 30 × (재직일수 / 365)
    let estimatedSeverance = 0;
    if (workDaysInfo.isQualified) {
      estimatedSeverance = Math.round(appliedDailyWage * 30 * (totalDays / 365));
    }

    // 6. 퇴직소득세 및 실수령액
    const taxInfo = SeveranceLogic.estimateSeveranceTax(estimatedSeverance, serviceYears);

    return {
      workDaysInfo,
      threeMonthsDays,
      threeMonthsPay,
      bonusPortion,
      leavePortion,
      grandThreeMonthsTotal,
      dailyAverageWage,
      dailyOrdinaryWage: calculatedDailyOrdinary,
      appliedDailyWage,
      isOrdinaryApplied,
      estimatedSeverance,
      taxInfo
    };
  };

  global.SeveranceLogic = SeveranceLogic;
})(typeof window !== 'undefined' ? window : globalThis);
