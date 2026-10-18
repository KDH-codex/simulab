/**
 * ==========================================================================
 * SimuLab - 실업급여(구직급여) 모의 계산기 로직 엔진
 * 파일 경로: tools/unemployment-benefit-calc/logic.js
 * --------------------------------------------------------------------------
 * [법적 근거 및 2026년 고용보험법 공식 기준]
 * 1. 고용보험법 제46조(구직급여일액):
 *    - 1일 구직급여액 = 퇴직 전 3개월간의 1일 평균임금 × 60%
 *    - 1일 상한액: 66,000원
 *    - 1일 하한액: 최저시급의 80% × 1일 소정근로시간(8시간) (약 63,104원)
 * 2. 고용보험법 제50조(소정급여일수):
 *    - 연령(50세 미만 vs 50세 이상/장애인) 및 고용보험 가입기간별 120일 ~ 270일
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const UnemploymentLogic = {};

  // 2026년 법정 기준 상수
  UnemploymentLogic.CONSTANTS = {
    dailyMaxAmount: 66000,          // 1일 상한액 66,000원
    dailyMinAmount: 63104,          // 1일 하한액 (8시간 기준)
    wageRatio: 0.60                 // 평균임금의 60%
  };

  /**
   * 소정급여일수 산출표 (고용보험법 별표 1)
   * @param {number} age 퇴직 당시 만 나이
   * @param {number} insuranceYears 고용보험 가입기간(근속연수)
   * @param {boolean} isDisabled 장애인 여부
   */
  UnemploymentLogic.calculateDays = function (age, insuranceYears, isDisabled = false) {
    const isOver50 = age >= 50 || isDisabled;
    const y = Math.max(0, Number(insuranceYears) || 0);

    if (y < 1) {
      return 120; // 1년 미만: 120일
    } else if (y < 3) {
      return isOver50 ? 180 : 150; // 1년 이상 ~ 3년 미만
    } else if (y < 5) {
      return isOver50 ? 210 : 180; // 3년 이상 ~ 5년 미만
    } else if (y < 10) {
      return isOver50 ? 240 : 210; // 5년 이상 ~ 10년 미만
    } else {
      return isOver50 ? 270 : 240; // 10년 이상: 240일 / 270일
    }
  };

  /**
   * 실업급여 종합 계산
   */
  UnemploymentLogic.calculate = function (params) {
    const {
      monthlySalary = 3000000,    // 퇴직 전 3개월 월 평균 급여
      age = 35,                   // 퇴직 당시 만 나이
      insuranceYears = 3,         // 고용보험 총 가입기간 (년)
      dailyWorkHours = 8,         // 1일 소정근로시간 (기본 8시간)
      isDisabled = false
    } = params;

    const salary = Math.max(0, Number(monthlySalary) || 0);
    const hours = Math.max(4, Math.min(8, Number(dailyWorkHours) || 8));

    // 1. 1일 평균임금 추정 (월급여 / 30일)
    const dailyWage = salary > 0 ? Math.round(salary / 30) : 0;

    // 2. 평균임금의 60% 산출
    const rawDailyBenefit = Math.round(dailyWage * UnemploymentLogic.CONSTANTS.wageRatio);

    // 3. 상한액 및 하한액 보정
    const maxAmount = UnemploymentLogic.CONSTANTS.dailyMaxAmount;
    // 근로시간 비례 하한액 (8시간 기준 63,104원)
    const minAmount = Math.round((UnemploymentLogic.CONSTANTS.dailyMinAmount / 8) * hours);

    let finalDailyBenefit = Math.max(minAmount, Math.min(maxAmount, rawDailyBenefit));
    if (salary === 0) finalDailyBenefit = minAmount;

    // 4. 소정급여일수
    const benefitDays = UnemploymentLogic.calculateDays(age, insuranceYears, isDisabled);

    // 5. 총 예상 수급액
    const totalBenefit = finalDailyBenefit * benefitDays;

    // 6. 월 평균 수령액 (30일 기준)
    const monthlyBenefit = finalDailyBenefit * 30;

    return {
      dailyWage,
      rawDailyBenefit,
      finalDailyBenefit,
      minAmount,
      maxAmount,
      benefitDays,
      totalBenefit,
      monthlyBenefit,
      benefitMonths: Math.round((benefitDays / 30) * 10) / 10
    };
  };

  global.UnemploymentLogic = UnemploymentLogic;
})(typeof window !== 'undefined' ? window : globalThis);
