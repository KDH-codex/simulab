/**
 * ==========================================================================
 * SimuLab - 주식 실질 수익률 및 제세공과금 계산 엔진 (logic.js)
 * 파일 경로: tools/stock-profit-calc/logic.js
 * --------------------------------------------------------------------------
 * [핵심 계산 원칙]
 * 1. 2026년 기준 증권거래세(국내 0.20%, 해외 0.00%) 및 증권사 매수·매도 수수료 정밀 반영
 * 2. 단순 매매차익(표면 수익률)뿐만 아니라 수수료·세금을 뺀 '실질 세후 순손익'과 '실질 수익률' 계산
 * 3. 매도 시 수수료와 세금을 감안하여 원금을 온전히 건질 수 있는 '손익분기(본전) 매도가격' 역산
 * 4. 100% 순수 함수(Pure Function)로 구현하여 브라우저(file://) 및 Node.js 테스트 환경 완벽 호환
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const SimuLab = (global.SimuLab = global.SimuLab || {});

  /**
   * 주식 수익률 및 수수료·세금 정밀 계산 함수
   * @param {Object} inputs 입력 파라미터
   * @param {number} inputs.buyPrice 매수단가 (원 또는 달러)
   * @param {number} inputs.sellPrice 매도단가 (원 또는 달러)
   * @param {number} inputs.quantity 매수/매도 수량 (주)
   * @param {number} inputs.buyFeeRate 매수 수수료율 (%, 예: 0.015)
   * @param {number} inputs.sellFeeRate 매도 수수료율 (%, 예: 0.015)
   * @param {number} inputs.taxRate 증권거래세율 (%, 예: 0.20)
   * @param {string} inputs.marketType 시장 구분 ('KR' 또는 'US')
   * @returns {Object} 계산 결과 객체
   */
  function calculateStockProfit(inputs) {
    const buyPrice = Math.max(0, Number(inputs.buyPrice) || 0);
    const sellPrice = Math.max(0, Number(inputs.sellPrice) || 0);
    const quantity = Math.max(0, Number(inputs.quantity) || 0);
    const buyFeeRate = Math.max(0, Number(inputs.buyFeeRate) || 0);
    const sellFeeRate = Math.max(0, Number(inputs.sellFeeRate) || 0);
    const taxRate = Math.max(0, Number(inputs.taxRate) || 0);
    const marketType = inputs.marketType === 'US' ? 'US' : 'KR';

    // 1. 총 매수/매도 대금
    const totalBuyAmount = buyPrice * quantity;
    const totalSellAmount = sellPrice * quantity;

    // 2. 표면 매매차익 및 표면 수익률 (세전)
    const grossProfit = totalSellAmount - totalBuyAmount;
    const grossProfitRate = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

    // 3. 제세공과금 산출 (원화의 경우 원 단위 절사, 달러의 경우 소수점 2자리)
    let buyFee = 0;
    let sellFee = 0;
    let transactionTax = 0;

    if (marketType === 'KR') {
      buyFee = Math.floor(totalBuyAmount * (buyFeeRate / 100));
      sellFee = Math.floor(totalSellAmount * (sellFeeRate / 100));
      transactionTax = Math.floor(totalSellAmount * (taxRate / 100));
    } else {
      buyFee = Math.round(totalBuyAmount * (buyFeeRate / 100) * 100) / 100;
      sellFee = Math.round(totalSellAmount * (sellFeeRate / 100) * 100) / 100;
      transactionTax = Math.round(totalSellAmount * (taxRate / 100) * 100) / 100;
    }

    const totalFeesAndTaxes = buyFee + sellFee + transactionTax;

    // 4. 실질 세후 순손익 및 실질 수익률
    const netProfit = grossProfit - totalFeesAndTaxes;
    const actualInvestedAmount = totalBuyAmount + buyFee;
    const netProfitRate = actualInvestedAmount > 0 ? (netProfit / actualInvestedAmount) * 100 : 0;

    // 5. 손익분기 매도가격(본전 매도가) 역산
    // 조건: 매도금액 - 매도수수료 - 거래세 = 매수금액 + 매수수수료
    // P_sell * Q * (1 - (sellFeeRate + taxRate) / 100) = totalBuyAmount + buyFee
    const sellDeductionRatio = 1 - (sellFeeRate + taxRate) / 100;
    let breakEvenPrice = 0;
    if (quantity > 0 && sellDeductionRatio > 0) {
      const rawB入了 = actualInvestedAmount / (quantity * sellDeductionRatio);
      breakEvenPrice = marketType === 'KR' ? Math.ceil(rawB入了) : Math.round(rawB入了 * 100) / 100;
    }

    // 6. 1주당 세후 순수익
    const netProfitPerShare = quantity > 0 ? netProfit / quantity : 0;

    return {
      marketType,
      buyPrice,
      sellPrice,
      quantity,
      buyFeeRate,
      sellFeeRate,
      taxRate,
      totalBuyAmount,
      totalSellAmount,
      grossProfit,
      grossProfitRate,
      buyFee,
      sellFee,
      transactionTax,
      totalFeesAndTaxes,
      netProfit,
      netProfitRate,
      actualInvestedAmount,
      breakEvenPrice,
      netProfitPerShare,
    };
  }

  // 전역 SimuLab 네임스페이스 및 Node.js CommonJS 내보내기
  SimuLab.calculateStockProfit = calculateStockProfit;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateStockProfit };
  }
})(typeof window !== 'undefined' ? window : globalThis);
