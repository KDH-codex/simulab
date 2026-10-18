/**
 * ==========================================================================
 * SimuLab Analytics Hub - 은퇴 생존 기간 계산기 순수 연산 엔진
 * 파일 경로: tools/retirement-survival-sim/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 로직 설명]
 * "내 노후 자금, 몇 살까지 버텨줄까?"
 * 1) 은퇴 전 축적기:
 *    - 현재 나이부터 은퇴 나이까지 매월 저축액과 투자 수익률로 자산을 불립니다.
 * 2) 은퇴 후 인출기:
 *    - 물가상승률(인플레이션)을 반영하여 매년 늘어나는 생활비를 인출합니다.
 *    - 국민연금 수령 나이(예: 65세)가 되면 국민연금 수령액만큼 인출 부담이 줄어듭니다.
 *    - 자산 잔액에 연간 운용수익률을 복리로 적용하여 몇 살에 0원이 되는지 추적합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const DEFAULT_RETIRE_INPUTS = {
    currentAge: 45,                  // 현재 나이 (세)
    retirementAge: 55,               // 은퇴 목표 나이 (세)
    currentAsset: 400000000,         // 현재 순자산 (4억원)
    monthlySaveUntilRetire: 1500000, // 은퇴 전 월 저축액 (150만원)
    monthlyExpense: 2500000,         // 은퇴 후 월 희망 생활비 (현재 가치 기준, 250만원)
    investmentReturn: 5.0,           // 연간 자산운용 수익률 (%)
    inflationRate: 2.5,              // 연간 물가상승률 (%)
    pensionAge: 65,                  // 국민연금 수령 개시 나이 (세)
    pensionMonthly: 800000,          // 국민연금 월 예상액 (현재 가치 기준, 80만원)
  };

  /**
   * 메인 계산 함수
   */
  function calculateRetirementSurvival(userInputs = {}) {
    const inputs = { ...DEFAULT_RETIRE_INPUTS, ...userInputs };

    const curAge = Math.max(20, Math.min(80, Number(inputs.currentAge) || 45));
    const retAge = Math.max(curAge, Math.min(90, Number(inputs.retirementAge) || 55));
    let asset = Math.max(0, Number(inputs.currentAsset) || 0);
    const saveMonthly = Math.max(0, Number(inputs.monthlySaveUntilRetire) || 0);
    const baseExpense = Math.max(100000, Number(inputs.monthlyExpense) || 2500000);
    const retRate = Math.max(-5, Math.min(25, Number(inputs.investmentReturn) || 5)) / 100;
    const infRate = Math.max(0, Math.min(15, Number(inputs.inflationRate) || 2.5)) / 100;
    const penAge = Math.max(50, Math.min(80, Number(inputs.pensionAge) || 65));
    const penMonthly = Math.max(0, Number(inputs.pensionMonthly) || 0);

    const monthlyReturnRate = Math.pow(1 + retRate, 1 / 12) - 1;
    const preRetireMonths = (retAge - curAge) * 12;

    // 1단계: 은퇴 시점까지 자산 축적
    for (let m = 1; m <= preRetireMonths; m++) {
      asset = (asset + saveMonthly) * (1 + monthlyReturnRate);
    }
    const assetAtRetirement = Math.round(asset);

    // 2단계: 은퇴 후 인출 시뮬레이션 (최대 105세까지)
    let depletionAge = null;
    let depletionYearIndex = null;
    let totalPensionReceived = 0;
    const yearlyHistory = [];

    const maxAge = 105;
    let runningAsset = assetAtRetirement;

    for (let age = retAge; age <= maxAge; age++) {
      const yearsFromNow = age - curAge;
      // 물가상승 반영된 월 생활비 & 월 연금
      const inflationFactor = Math.pow(1 + infRate, yearsFromNow);
      const inflatedMonthlyExpense = baseExpense * inflationFactor;
      const inflatedMonthlyPension = age >= penAge ? penMonthly * inflationFactor : 0;

      const netMonthlyWithdrawal = Math.max(0, inflatedMonthlyExpense - inflatedMonthlyPension);
      const annualWithdrawal = netMonthlyWithdrawal * 12;

      if (age >= penAge) {
        totalPensionReceived += inflatedMonthlyPension * 12;
      }

      // 1년간 자산 증감
      const assetBeforeGrowth = runningAsset - annualWithdrawal;
      if (assetBeforeGrowth <= 0 && depletionAge === null) {
        depletionAge = age;
        depletionYearIndex = age - retAge;
        runningAsset = 0;
      } else if (depletionAge === null) {
        runningAsset = Math.max(0, assetBeforeGrowth * (1 + retRate));
      } else {
        runningAsset = 0;
      }

      yearlyHistory.push({
        age,
        asset: Math.round(runningAsset),
        annualExpense: Math.round(inflatedMonthlyExpense * 12),
        annualPension: Math.round(inflatedMonthlyPension * 12),
        annualWithdrawal: Math.round(annualWithdrawal),
        isDepleted: runningAsset <= 0,
      });
    }

    // 첫해 인출률 계산 (Trinity Study 4% rule 비교)
    const firstYearExpense = baseExpense * Math.pow(1 + infRate, retAge - curAge) * 12;
    const initialWithdrawalRate = assetAtRetirement > 0 ? (firstYearExpense / assetAtRetirement) * 100 : 999;

    let survivalVerdict = '';
    if (depletionAge === null) {
      survivalVerdict = '축하합니다! 105세까지 자산이 고갈되지 않으며 영구적인 노후 현금흐름이 보장됩니다.';
    } else if (depletionAge >= 90) {
      survivalVerdict = `약 ${depletionAge}세까지 안정적인 생활이 가능합니다. 평균 수명(85세)을 넘어서는 훌륭한 수준입니다.`;
    } else {
      survivalVerdict = `주의가 필요합니다. ${depletionAge}세 무렵 자산이 고갈될 위험이 있으므로 월 생활비 조정이나 저축액 증액이 권장됩니다.`;
    }

    return {
      inputs,
      summary: {
        currentAge: curAge,
        retirementAge: retAge,
        assetAtRetirement,
        depletionAge: depletionAge || '105세 이상 (영구 유지)',
        depletionAgeNum: depletionAge,
        isPerpetual: depletionAge === null,
        initialWithdrawalRate: Math.round(initialWithdrawalRate * 10) / 10,
        totalPensionReceived: Math.round(totalPensionReceived),
        survivalVerdict,
      },
      yearlyHistory,
    };
  }

  const exportsObj = {
    DEFAULT_RETIRE_INPUTS,
    calculateRetirementSurvival,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.RetirementSurvival = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
