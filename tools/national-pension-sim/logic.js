/**
 * ==========================================================================
 * SimuLab - 국민연금 조기수령 vs 정상 vs 연기 손익분기 시뮬레이터
 * 파일 경로: tools/national-pension-sim/logic.js
 * --------------------------------------------------------------------------
 * [법적 근거 및 국민연금공단 공식 기준]
 * 1. 국민연금법 제61조(노령연금): 만 65세 정상 지급 개시 (1969년생 이후 기준)
 * 2. 국민연금법 제61조의2(조기노령연금):
 *    - 1년당 6% (월 0.5%) 평생 감액
 *    - 5년 조기(만 60세): 70% 지급 (30% 평생 감액)
 * 3. 국민연금법 제62조(연기연금):
 *    - 1년당 7.2% (월 0.6%) 평생 가산 (최대 5년 연기 시 136% 지급)
 * 4. 누적 수령액 손익분기점(BEP):
 *    - 조기수령 누적액 vs 정상수령 누적액이 역전되는 골든크로스 연령 산출
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const PensionLogic = {};

  /**
   * 조기/정상/연기 연금 수령 조건 계산
   * @param {number} normalMonthlyPay 정상 개시(65세) 시 월 예상 연금액 (기본 1,500,000원)
   * @param {number} earlyYears 조기 수령 연수 (0~5년, 기본 5년 조기=60세)
   * @param {number} delayYears 연기 수령 연수 (0~5년, 기본 5년 연기=70세)
   */
  PensionLogic.calculate = function (params) {
    const {
      normalMonthlyPay = 1500000,
      earlyYears = 5,
      delayYears = 5,
      expectedLifespan = 85 // 기대수명 (기본 85세)
    } = params;

    const basePay = Math.max(0, Number(normalMonthlyPay) || 0);
    const earlyY = Math.max(0, Math.min(5, Number(earlyYears) || 5));
    const delayY = Math.max(0, Math.min(5, Number(delayYears) || 5));
    const maxAge = Math.max(70, Math.min(100, Number(expectedLifespan) || 85));

    // 1. 월 수령액 계산
    // 정상 수령 (65세)
    const normalAge = 65;
    const normalMonthly = basePay;

    // 조기 수령 (연 6% 감액)
    const earlyAge = 65 - earlyY;
    const earlyReductionRate = earlyY * 0.06; // 예: 5년 = 30% 감액
    const earlyMonthly = Math.round(basePay * (1 - earlyReductionRate));

    // 연기 수령 (연 7.2% 증액)
    const delayAge = 65 + delayY;
    const delayIncreaseRate = delayY * 0.072; // 예: 5년 = 36% 증액
    const delayMonthly = Math.round(basePay * (1 + delayIncreaseRate));

    // 2. 연령별(60세~100세) 누적 수령액 시뮬레이션
    const ageBreakdown = [];
    let cumEarly = 0;
    let cumNormal = 0;
    let cumDelay = 0;

    let earlyVsNormalBEPAge = null; // 조기 vs 정상 역전 나이
    let normalVsDelayBEPAge = null; // 정상 vs 연기 역전 나이

    for (let age = 60; age <= 100; age++) {
      // 조기 수령액 누적 (해당 연령부터 1년 12개월치)
      if (age >= earlyAge) {
        cumEarly += earlyMonthly * 12;
      }
      // 정상 수령액 누적
      if (age >= normalAge) {
        cumNormal += normalMonthly * 12;
      }
      // 연기 수령액 누적
      if (age >= delayAge) {
        cumDelay += delayMonthly * 12;
      }

      // 손익분기점 검출
      if (!earlyVsNormalBEPAge && cumNormal > cumEarly && cumEarly > 0) {
        earlyVsNormalBEPAge = age;
      }
      if (!normalVsDelayBEPAge && cumDelay > cumNormal && cumNormal > 0) {
        normalVsDelayBEPAge = age;
      }

      ageBreakdown.push({
        age,
        cumEarly,
        cumNormal,
        cumDelay
      });
    }

    // 기대수명 도달 시 총 누적 수령액
    const finalRow = ageBreakdown.find((r) => r.age === maxAge) || ageBreakdown[ageBreakdown.length - 1];

    // 정확한 소수점 손익분기 월 계산 (조기 vs 정상)
    // 조기수령자가 정상개시(65세) 전까지 먼저 받는 총액: earlyMonthly * (normalAge - earlyAge) * 12
    // 65세 이후 매월 정상수령자가 더 받는 금액: normalMonthly - earlyMonthly
    let exactBedTestMonths = 0;
    if (normalMonthly > earlyMonthly && earlyAge < normalAge) {
      const earlyAdvantage = earlyMonthly * (normalAge - earlyAge) * 12;
      const monthlyGap = normalMonthly - earlyMonthly;
      exactBedTestMonths = Math.round(earlyAdvantage / monthlyGap);
    }
    const exactBEPAgeYear = normalAge + Math.floor(exactBedTestMonths / 12);
    const exactBEPAgeMonth = exactBedTestMonths % 12;

    return {
      basePay,
      earlyY,
      delayY,
      normalAge,
      normalMonthly,
      earlyAge,
      earlyMonthly,
      earlyReductionRate: Math.round(earlyReductionRate * 100),
      delayAge,
      delayMonthly,
      delayIncreaseRate: Math.round(delayIncreaseRate * 100 * 10) / 10,
      exactBEPAgeYear,
      exactBEPAgeMonth,
      expectedLifespan: maxAge,
      totalCumEarlyAtLifespan: finalRow.cumEarly,
      totalCumNormalAtLifespan: finalRow.cumNormal,
      totalCumDelayAtLifespan: finalRow.cumDelay,
      ageBreakdown
    };
  };

  global.PensionLogic = PensionLogic;
})(typeof window !== 'undefined' ? window : globalThis);
