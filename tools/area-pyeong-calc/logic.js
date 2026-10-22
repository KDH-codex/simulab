/**
 * ==========================================================================
 * SimuLab - 부동산 평수 ↔ ㎡ 면적 환산기 로직 엔진
 * 파일 경로: tools/area-pyeong-calc/logic.js
 * --------------------------------------------------------------------------
 * [법정 표준 계량 단위]
 * 1. 1평 = 3.305785 ㎡ (정확한 법정 환산 계수: 400/121)
 * 2. 1 ㎡ = 0.3025 평
 * 3. 평당 단가 = ㎡당 단가 × 3.305785
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const AreaLogic = {};

  const PYEONG_FACTOR = 400 / 121;
  const SQM_FACTOR = 121 / 400;
  const finitePositive = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;

  // 평 -> ㎡ 변환
  AreaLogic.pyeongToSqm = function (pyeong) {
    const p = finitePositive(pyeong);
    const sqm = p * PYEONG_FACTOR;
    return Math.round((sqm + Number.EPSILON) * 100) / 100;
  };

  // ㎡ -> 평 변환
  AreaLogic.sqmToPyeong = function (sqm) {
    const s = finitePositive(sqm);
    const pyeong = s * SQM_FACTOR;
    return Math.round((pyeong + Number.EPSILON) * 100) / 100;
  };

  // 단가 환산 (평당가 <-> ㎡당가)
  AreaLogic.convertUnitPrice = function (price, fromUnit = 'pyeong') {
    const pr = finitePositive(price);
    if (fromUnit === 'pyeong') {
      // 평당가 -> ㎡당가
      return Math.round(pr / PYEONG_FACTOR);
    } else {
      // ㎡당가 -> 평당가
      return Math.round(pr * PYEONG_FACTOR);
    }
  };

  global.AreaLogic = AreaLogic;
})(typeof window !== 'undefined' ? window : globalThis);
