/**
 * ==========================================================================
 * SimuLab Analytics Hub - 로또 세후 실수령액 & 당첨금 월이자 계산기 순수 연산 엔진
 * 파일 경로: tools/lotto-tax-interest-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 복권 세법 및 이자 계산 설명]
 * 1) 대한민국 복권 당첨금 소득세율:
 *    - 200만원 이하: 비과세 (세금 0원)
 *    - 200만원 초과 ~ 3억원 이하: 22% (소득세 20% + 지방소득세 2%)
 *    - 3억원 초과분: 33% (소득세 30% + 지방소득세 3%)
 * 2) 예금 이자 및 배당 현금흐름 (실수령액 기준):
 *    - 정기예금 (연 3.5% 가정): 이자소득세 15.4% 공제 후 월 수령액
 *    - 배당성장주 (연 4.5% 가정): 배당소득세 15.4% 공제 후 월 수령액
 *    - 4% 룰 안전 은퇴 생활비: 원금 훼손 없이 월 인출 가능한 생활비
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const DEFAULT_LOTTO_TAX_INPUTS = {
    prizeAmount: 2500000000, // 당첨금 25억원
    depositRate: 3.5,        // 은행 정기예금 금리 (%)
    dividendRate: 4.5,       // 배당 투자 수익률 (%)
  };

  /**
   * 로또 세금 및 실수령액 정밀 계산 함수
   */
  function calculateLottoTaxAndInterest(userInputs = {}) {
    const inputs = { ...DEFAULT_LOTTO_TAX_INPUTS, ...userInputs };

    const prize = Math.max(1000, Number(inputs.prizeAmount) || 2500000000);
    const depRate = Math.max(0.1, Math.min(20, Number(inputs.depositRate) || 3.5)) / 100;
    const divRate = Math.max(0.1, Math.min(20, Number(inputs.dividendRate) || 4.5)) / 100;

    // 1) 세금 계산
    let taxUnder300m = 0;
    let taxOver300m = 0;
    let totalTax = 0;

    if (prize <= 2000000) {
      // 200만원 이하 비과세
      totalTax = 0;
    } else if (prize <= 300000000) {
      // 3억원 이하: (당첨금 - 구입비 1,000원) × 22%
      taxUnder300m = Math.round((prize - 1000) * 0.22);
      totalTax = taxUnder300m;
    } else {
      // 3억원 초과
      taxUnder300m = Math.round((300000000 - 1000) * 0.22); // 약 6,599만 9,780원
      taxOver300m = Math.round((prize - 300000000) * 0.33);
      totalTax = taxUnder300m + taxOver300m;
    }

    const netPayout = Math.max(0, prize - totalTax);
    const effectiveTaxRate = prize > 0 ? (totalTax / prize) * 100 : 0;

    // 2) 정기예금 월 이자 (이자소득세 15.4% 공제)
    const annualGrossInterest = netPayout * depRate;
    const annualNetInterest = annualGrossInterest * (1 - 0.154);
    const monthlyNetInterest = Math.round(annualNetInterest / 12);

    // 3) 배당 투자 월 배당금 (배당소득세 15.4% 공제)
    const annualGrossDividend = netPayout * divRate;
    const annualNetDividend = annualGrossDividend * (1 - 0.154);
    const monthlyNetDividend = Math.round(annualNetDividend / 12);

    // 4) 4% 룰 안전 은퇴 생활비 (연 4% 인출)
    const monthlyFireExpense = Math.round((netPayout * 0.04) / 12);

    return {
      inputs,
      summary: {
        prizeAmount: prize,
        totalTax,
        netPayout,
        effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
        taxUnder300m,
        taxOver300m,
        monthlyNetInterest,
        annualNetInterest: Math.round(annualNetInterest),
        monthlyNetDividend,
        annualNetDividend: Math.round(annualNetDividend),
        monthlyFireExpense,
      },
    };
  }

  const exportsObj = {
    DEFAULT_LOTTO_TAX_INPUTS,
    calculateLottoTaxAndInterest,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.LottoTaxInterest = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
