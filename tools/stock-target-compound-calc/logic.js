/**
 * ==========================================================================
 * SimuLab - 목표가 & 복리 계산기 엔진 (logic.js)
 * 파일 경로: tools/stock-target-compound-calc/logic.js
 * --------------------------------------------------------------------------
 * [핵심 계산 원칙]
 * 1. 목표가 계산: 목표 수익률(또는 목표 수익금) 달성을 위한 필요 매도가격 역산 (세금/수수료 반영)
 * 2. 복리 시뮬레이터: 초기원금 + 월적립금 기반 연복리/월복리 스노우볼 성장 및 72법칙 배가 기간 산출
 * 3. 100% 순수 함수(Pure Function)로 구현하여 브라우저(file://) 및 Node.js 테스트 환경 완벽 호환
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const SimuLab = (global.SimuLab = global.SimuLab || {});

  /**
   * 목표 매도가격 역산 함수
   * @param {Object} inputs
   * @param {number} inputs.buyPrice 매수가격
   * @param {number} inputs.quantity 보유수량
   * @param {number} inputs.targetProfitRate 목표 수익률 (%)
   * @param {number} inputs.feeRate 편도 수수료율 (%, 기본 0.015)
   * @param {number} inputs.taxRate 거래세율 (%, 기본 0.20)
   * @param {boolean} inputs.includeTax 세금/수수료 반영 여부
   * @returns {Object} 목표가 계산 결과
   */
  function calculateTargetSellPrice(inputs) {
    const buyPrice = Math.max(0, Number(inputs.buyPrice) || 0);
    const quantity = Math.max(0, Number(inputs.quantity) || 0);
    const targetProfitRate = Number(inputs.targetProfitRate) || 0;
    const feeRate = Math.max(0, Number(inputs.feeRate) || 0);
    const taxRate = Math.max(0, Number(inputs.taxRate) || 0);
    const includeTax = inputs.includeTax !== false;

    const totalBuyAmount = buyPrice * quantity;
    const buyFee = includeTax ? Math.floor(totalBuyAmount * (feeRate / 100)) : 0;
    const actualInvested = totalBuyAmount + buyFee;

    // 목표하는 세후 순수익금 = actualInvested * (targetProfitRate / 100)
    const targetNetProfit = actualInvested * (targetProfitRate / 100);
    const requiredNetTotal = actualInvested + targetNetProfit;

    let targetPrice = 0;
    if (quantity > 0) {
      if (includeTax) {
        // requiredNetTotal = targetPrice * quantity * (1 - (feeRate + taxRate)/100)
        const deductionRate = 1 - (feeRate + taxRate) / 100;
        targetPrice = deductionRate > 0 ? requiredNetTotal / (quantity * deductionRate) : 0;
      } else {
        targetPrice = buyPrice * (1 + targetProfitRate / 100);
      }
    }

    const roundedTargetPrice = Math.ceil(targetPrice);
    const totalSellAmount = roundedTargetPrice * quantity;
    const sellFee = includeTax ? Math.floor(totalSellAmount * (feeRate / 100)) : 0;
    const tax = includeTax ? Math.floor(totalSellAmount * (taxRate / 100)) : 0;
    const actualNetProfit = totalSellAmount - sellFee - tax - actualInvested;

    return {
      buyPrice,
      quantity,
      targetProfitRate,
      targetPrice: roundedTargetPrice,
      totalBuyAmount,
      totalSellAmount,
      totalFeesAndTaxes: buyFee + sellFee + tax,
      actualNetProfit,
      requiredPriceRisePct: buyPrice > 0 ? ((roundedTargetPrice - buyPrice) / buyPrice) * 100 : 0,
    };
  }

  /**
   * 적립식 복리 스노우볼 시뮬레이션 함수
   * @param {Object} inputs
   * @param {number} inputs.initialCapital 초기 원금 (원)
   * @param {number} inputs.monthlyDeposit 매월 추가 적립금 (원)
   * @param {number} inputs.annualRate 연평균 복리 수익률 (%)
   * @param {number} inputs.years 투자 기간 (년)
   * @returns {Object} 복리 결과 및 연차별 테이블
   */
  function calculateCompoundInterest(inputs) {
    const initialCapital = Math.max(0, Number(inputs.initialCapital) || 0);
    const monthlyDeposit = Math.max(0, Number(inputs.monthlyDeposit) || 0);
    const annualRate = Math.max(0, Number(inputs.annualRate) || 0);
    const years = Math.max(1, Math.min(50, Number(inputs.years) || 10));

    const monthlyRate = annualRate / 100 / 12;
    let balance = initialCapital;
    let totalPrincipal = initialCapital;

    const yearlyTable = [];

    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        balance = balance * (1 + monthlyRate) + monthlyDeposit;
        totalPrincipal += monthlyDeposit;
      }

      const totalInterest = balance - totalPrincipal;
      const profitRatePct = totalPrincipal > 0 ? (totalInterest / totalPrincipal) * 100 : 0;

      yearlyTable.push({
        year: y,
        principal: Math.round(totalPrincipal),
        balance: Math.round(balance),
        interest: Math.round(totalInterest),
        profitRatePct: Math.round(profitRatePct * 10) / 10,
      });
    }

    // 72 법칙을 통한 자산 2배 소요 기간
    const ruleOf72Years = annualRate > 0 ? Math.round((72 / annualRate) * 10) / 10 : 0;

    return {
      initialCapital,
      monthlyDeposit,
      annualRate,
      years,
      finalBalance: Math.round(balance),
      finalPrincipal: Math.round(totalPrincipal),
      finalInterest: Math.round(balance - totalPrincipal),
      totalProfitRatePct: totalPrincipal > 0 ? Math.round(((balance - totalPrincipal) / totalPrincipal) * 1000) / 10 : 0,
      ruleOf72Years,
      yearlyTable,
    };
  }

  // 전역 SimuLab 네임스페이스 및 Node.js CommonJS 내보내기
  SimuLab.calculateTargetSellPrice = calculateTargetSellPrice;
  SimuLab.calculateCompoundInterest = calculateCompoundInterest;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateTargetSellPrice, calculateCompoundInterest };
  }
})(typeof window !== 'undefined' ? window : globalThis);
