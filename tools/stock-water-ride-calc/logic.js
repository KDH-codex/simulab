/**
 * ==========================================================================
 * SimuLab - 평단가 & 물타기(추가매수) 정밀 계산 엔진 (logic.js)
 * 파일 경로: tools/stock-water-ride-calc/logic.js
 * --------------------------------------------------------------------------
 * [핵심 계산 원칙]
 * 1. 모드 1 (평단가 계산): 기존 보유분 + 추가 매수분들의 가중평균 단가 및 평단 인하폭 산출
 * 2. 모드 2 (목표 평단가 역산): 희망하는 목표 평단가에 도달하기 위해 필요한 추가 매수 주식 수와 필요 자금 역산
 * 3. 100% 순수 함수(Pure Function)로 구현하여 브라우저(file://) 및 Node.js 테스트 환경 완벽 호환
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const SimuLab = (global.SimuLab = global.SimuLab || {});

  /**
   * 모드 1: 다회차 분할 매수 후 최종 평단가 계산
   * @param {Array<Object>} orders 매수 차수 배열 [{ price, quantity }]
   * @param {number} currentPrice 현재 시장 주가 (선택 사항, 손익률 계산용)
   * @returns {Object} 최종 평단가 계산 결과
   */
  const finiteNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  function calculateAveragePrice(orders, currentPrice = 0) {
    if (!Array.isArray(orders) || orders.length === 0) {
      return {
        totalQuantity: 0,
        totalAmount: 0,
        averagePrice: 0,
        initialPrice: 0,
        priceDropPct: 0,
        currentProfitRate: 0,
      };
    }

    let totalQuantity = 0;
    let totalAmount = 0;
    const initialPrice = orders[0] && Number(orders[0].price) ? Number(orders[0].price) : 0;

    orders.forEach((ord) => {
      const p = Math.max(0, finiteNumber(ord.price));
      const q = Math.max(0, finiteNumber(ord.quantity));
      totalQuantity += q;
      totalAmount += p * q;
    });

    const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
    const priceDropPct = initialPrice > 0 ? ((averagePrice - initialPrice) / initialPrice) * 100 : 0;

    // 현재가 기준 손익률
    const curP = finiteNumber(currentPrice);
    const currentProfitRate = averagePrice > 0 && curP > 0 ? ((curP - averagePrice) / averagePrice) * 100 : 0;

    return {
      totalQuantity,
      totalAmount,
      averagePrice: Math.round(averagePrice * 100) / 100,
      initialPrice,
      priceDropPct: Math.round(priceDropPct * 100) / 100,
      currentProfitRate: Math.round(currentProfitRate * 100) / 100,
    };
  }

  /**
   * 모드 2: 목표 평단가 달성을 위한 추가 매수 수량 및 필요 금액 역산
   * @param {Object} inputs 입력 파라미터
   * @param {number} inputs.currentAvgPrice 현재 보유 평단가 (P1)
   * @param {number} inputs.currentQty 현재 보유 수량 (Q1)
   * @param {number} inputs.targetAvgPrice 목표 희망 평단가 (P_target)
   * @param {number} inputs.addBuyPrice 추가 매수할 현재 주가 (P_add)
   * @returns {Object} 목표 평단 달성 필요량 결과
   */
  function calculateRequiredWaterRide(inputs) {
    const P1 = Math.max(0, finiteNumber(inputs.currentAvgPrice));
    const Q1 = Math.max(0, finiteNumber(inputs.currentQty));
    const P_target = Math.max(0, finiteNumber(inputs.targetAvgPrice));
    const P_add = Math.max(0, finiteNumber(inputs.addBuyPrice));

    // 유효성 판별:
    // 물타기로 평단가를 낮추려면 반드시 (현재 매수가 P_add < 목표 평단 P_target < 기존 평단 P1) 이어야 함.
    if (P_target >= P1) {
      return {
        isValid: false,
        error: '목표 평단가는 기존 평단가보다 낮아야 합니다.',
        requiredQuantity: 0,
        requiredAmount: 0,
        finalTotalQuantity: Q1,
        finalTotalAmount: P1 * Q1,
      };
    }

    if (P_add >= P_target) {
      return {
        isValid: false,
        error: '추가 매수 주가는 목표 평단가보다 낮아야 평단가를 목표치까지 내릴 수 있습니다.',
        requiredQuantity: 0,
        requiredAmount: 0,
        finalTotalQuantity: Q1,
        finalTotalAmount: P1 * Q1,
      };
    }

    // 공식: Q_add = Q1 * (P1 - P_target) / (P_target - P_add)
    const requiredQuantityRaw = (Q1 * (P1 - P_target)) / (P_target - P_add);
    const requiredQuantity = Math.ceil(requiredQuantityRaw);
    const requiredAmount = requiredQuantity * P_add;

    const finalTotalQuantity = Q1 + requiredQuantity;
    const finalTotalAmount = P1 * Q1 + requiredAmount;
    const actualFinalAvgPrice = finalTotalQuantity > 0 ? finalTotalAmount / finalTotalQuantity : 0;

    return {
      isValid: true,
      error: null,
      requiredQuantity,
      requiredAmount,
      finalTotalQuantity,
      finalTotalAmount,
      actualFinalAvgPrice: Math.round(actualFinalAvgPrice * 100) / 100,
      initialAmount: P1 * Q1,
    };
  }

  // 전역 SimuLab 네임스페이스 및 Node.js CommonJS 내보내기
  SimuLab.calculateAveragePrice = calculateAveragePrice;
  SimuLab.calculateRequiredWaterRide = calculateRequiredWaterRide;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateAveragePrice, calculateRequiredWaterRide };
  }
})(typeof window !== 'undefined' ? window : globalThis);
