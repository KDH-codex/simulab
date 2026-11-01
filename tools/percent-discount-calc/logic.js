/**
 * ==========================================================================
 * SimuLab - 퍼센트 & 할인율 계산기 로직 엔진
 * 파일 경로: tools/percent-discount-calc/logic.js
 * --------------------------------------------------------------------------
 * 1. 전체값의 N% 계산: total × (percent / 100)
 * 2. 쇼핑 세일 할인: 정가 - (정가 × 할인율%)
 * 3. 변동률(인상/인하): ((새 가격 - 이전 가격) / 이전 가격) × 100
 * 4. 비율(비중): (값 / 전체) × 100
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const PercentLogic = {};
  const finiteNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0;

  // 1. 전체값의 N% 구하기
  PercentLogic.calcPercentOf = function (total, percent) {
    const t = finiteNumber(total);
    const p = finiteNumber(percent);
    const result = (t * p) / 100;
    return {
      total: t,
      percent: p,
      amount: Math.round((result + Number.EPSILON) * 100) / 100
    };
  };

  // 2. 쇼핑 세일 할인율
  PercentLogic.calcDiscount = function (originalPrice, discountRate, additionalDiscountRate = 0) {
    const orig = Math.max(0, finiteNumber(originalPrice));
    const rate1 = Math.max(0, Math.min(100, finiteNumber(discountRate)));
    const rate2 = Math.max(0, Math.min(100, finiteNumber(additionalDiscountRate)));

    // 1차 할인
    const step1Discount = orig * (rate1 / 100);
    const step1Price = orig - step1Discount;

    // 2차 추가 할인 (쿠폰 등)
    const step2Discount = step1Price * (rate2 / 100);
    const finalPrice = Math.max(0, Math.round(step1Price - step2Discount));
    const totalDiscountAmount = orig - finalPrice;
    const effectiveDiscountRate = orig > 0 ? (totalDiscountAmount / orig) * 100 : 0;

    return {
      originalPrice: orig,
      finalPrice,
      totalDiscountAmount,
      effectiveDiscountRate: Math.round(effectiveDiscountRate * 10) / 10
    };
  };

  // 3. 가격 변동률 (인상/인하)
  PercentLogic.calcChangeRate = function (fromVal, toVal) {
    const from = finiteNumber(fromVal);
    const to = finiteNumber(toVal);
    if (from === 0) return { changeRate: 0, diff: to, isIncrease: to > 0 };

    const diff = to - from;
    const changeRate = (diff / Math.abs(from)) * 100;

    return {
      from,
      to,
      diff,
      changeRate: Math.round(changeRate * 100) / 100,
      isIncrease: diff >= 0
    };
  };

  // 4. 비율 계산 (A는 B의 몇 %인가)
  PercentLogic.calcRatio = function (part, total) {
    const p = finiteNumber(part);
    const t = finiteNumber(total);
    if (t === 0) return 0;
    const ratio = (p / t) * 100;
    return Math.round(ratio * 100) / 100;
  };

  global.PercentLogic = PercentLogic;
})(typeof window !== 'undefined' ? window : globalThis);
