/**
 * ==========================================================================
 * [도구 1] 레버리지 ETF 변동성 끌림 & 적립식 복리 시뮬레이터 - 순수 계산 모듈
 * 파일 경로: tools/leverage-etf-sim/logic.js
 * --------------------------------------------------------------------------
 * - 브라우저(file:// 직접 실행 포함)에서는 window.SimuLab.LeverageLogic에 등록되고,
 *   Node.js 테스트 환경에서는 module.exports로 내보내지는 UMD 순수 함수 모듈입니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const TRADING_DAYS_PER_YEAR = 252;
  const MONTHS_PER_YEAR = 12;
  const BASE_INDEX_EXPENSE_RATIO = 0.09;

  const DEFAULT_INPUTS = {
    initialCapital: 10000000,
    monthlyContribution: 1000000,
    annualReturnRate: 12.0,
    annualVolatility: 25.0,
    leverageMultiplier: 2,
    expenseRatio: 0.95,
    years: 10,
  };

  function sanitizeLeverageInputs(rawInputs = {}) {
    const safeNum = (val, min, max, fallback) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(Math.max(n, min), max);
    };

    return {
      initialCapital: safeNum(rawInputs.initialCapital, 0, 10000000000, DEFAULT_INPUTS.initialCapital),
      monthlyContribution: safeNum(rawInputs.monthlyContribution, 0, 1000000000, DEFAULT_INPUTS.monthlyContribution),
      annualReturnRate: safeNum(rawInputs.annualReturnRate, -40, 60, DEFAULT_INPUTS.annualReturnRate),
      annualVolatility: safeNum(rawInputs.annualVolatility, 0, 90, DEFAULT_INPUTS.annualVolatility),
      leverageMultiplier: safeNum(rawInputs.leverageMultiplier, 1, 3, DEFAULT_INPUTS.leverageMultiplier),
      expenseRatio: safeNum(rawInputs.expenseRatio, 0, 10, DEFAULT_INPUTS.expenseRatio),
      years: Math.round(safeNum(rawInputs.years, 1, 40, DEFAULT_INPUTS.years)),
    };
  }

  function calculateVolatilityDragMetrics(
    annualReturnRate,
    annualVolatility,
    leverageMultiplier,
    expenseRatio
  ) {
    const mu = annualReturnRate / 100;
    const sigma = annualVolatility / 100;
    const L = leverageMultiplier;
    const cost = expenseRatio / 100;

    const naiveReturn = L * mu;
    const totalVolatilityDrag = 0.5 * Math.pow(L, 2) * Math.pow(sigma, 2);
    const excessLeverageDrag = 0.5 * L * (L - 1) * Math.pow(sigma, 2);

    const continuousGrowthRate = naiveReturn - totalVolatilityDrag - cost;
    const effectiveAnnualReturn = Math.max(-0.98, Math.exp(continuousGrowthRate) - 1);

    return {
      naiveReturnPct: naiveReturn * 100,
      totalVolatilityDragPct: totalVolatilityDrag * 100,
      excessLeverageDragPct: excessLeverageDrag * 100,
      effectiveAnnualReturnPct: effectiveAnnualReturn * 100,
      effectiveAnnualReturnDecimal: effectiveAnnualReturn,
    };
  }

  function calculateLeverageSimulation(rawInputs) {
    const inputs = sanitizeLeverageInputs(rawInputs);
    const {
      initialCapital,
      monthlyContribution,
      annualReturnRate,
      annualVolatility,
      leverageMultiplier,
      expenseRatio,
      years,
    } = inputs;

    const levMetrics = calculateVolatilityDragMetrics(
      annualReturnRate,
      annualVolatility,
      leverageMultiplier,
      expenseRatio
    );

    const baseMetrics = calculateVolatilityDragMetrics(
      annualReturnRate,
      annualVolatility,
      1,
      leverageMultiplier === 1 ? expenseRatio : BASE_INDEX_EXPENSE_RATIO
    );

    const monthlyRateLev = Math.pow(1 + levMetrics.effectiveAnnualReturnDecimal, 1 / MONTHS_PER_YEAR) - 1;
    const monthlyRateBase = Math.pow(1 + baseMetrics.effectiveAnnualReturnDecimal, 1 / MONTHS_PER_YEAR) - 1;

    const labels = ['초기'];
    const principalSeries = [initialCapital];
    const baseIndexSeries = [initialCapital];
    const leveragedSeries = [initialCapital];
    const yearlyTable = [];

    let currentPrincipal = initialCapital;
    let currentBaseVal = initialCapital;
    let currentLevVal = initialCapital;

    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= MONTHS_PER_YEAR; m++) {
        currentBaseVal = currentBaseVal * (1 + monthlyRateBase) + monthlyContribution;
        currentLevVal = currentLevVal * (1 + monthlyRateLev) + monthlyContribution;
        currentPrincipal += monthlyContribution;
      }

      const roundedPrincipal = Math.round(currentPrincipal);
      const roundedBase = Math.max(0, Math.round(currentBaseVal));
      const roundedLev = Math.max(0, Math.round(currentLevVal));

      labels.push(`${y}년`);
      principalSeries.push(roundedPrincipal);
      baseIndexSeries.push(roundedBase);
      leveragedSeries.push(roundedLev);

      const netProfitLev = roundedLev - roundedPrincipal;
      const profitRateLev = roundedPrincipal > 0 ? (netProfitLev / roundedPrincipal) * 100 : 0;

      yearlyTable.push({
        year: y,
        principal: roundedPrincipal,
        baseValue: roundedBase,
        leveragedValue: roundedLev,
        netProfit: netProfitLev,
        profitRatePct: profitRateLev,
        diffVsBase: roundedLev - roundedBase,
      });
    }

    const finalPrincipal = principalSeries[principalSeries.length - 1];
    const finalBaseValue = baseIndexSeries[baseIndexSeries.length - 1];
    const finalLeveragedValue = leveragedSeries[leveragedSeries.length - 1];

    const rawStressDrop = (annualVolatility / 100) * leverageMultiplier * 1.65;
    const estimatedMddPct = -Math.min(99.5, Math.round((1 - Math.exp(-rawStressDrop)) * 1000) / 10);

    const baseStressDrop = (annualVolatility / 100) * 1 * 1.65;
    const baseEstimatedMddPct = -Math.min(99.5, Math.round((1 - Math.exp(-baseStressDrop)) * 1000) / 10);

    return {
      inputs,
      summary: {
        finalPrincipal,
        finalBaseValue,
        finalValue: finalLeveragedValue,
        netProfit: finalLeveragedValue - finalPrincipal,
        totalReturnPct:
          finalPrincipal > 0 ? ((finalLeveragedValue - finalPrincipal) / finalPrincipal) * 100 : 0,
        cagr: levMetrics.effectiveAnnualReturnPct,
        baseCagr: baseMetrics.effectiveAnnualReturnPct,
        naiveReturnPct: levMetrics.naiveReturnPct,
        volatilityDragPct: levMetrics.totalVolatilityDragPct,
        excessLeverageDragPct: levMetrics.excessLeverageDragPct,
        maxDrawdown: estimatedMddPct,
        baseMaxDrawdown: baseEstimatedMddPct,
      },
      chartData: {
        labels,
        principalSeries,
        baseIndexSeries,
        leveragedSeries,
      },
      yearlyTable,
    };
  }

  const exportsObj = {
    TRADING_DAYS_PER_YEAR,
    MONTHS_PER_YEAR,
    BASE_INDEX_EXPENSE_RATIO,
    DEFAULT_INPUTS,
    sanitizeLeverageInputs,
    calculateVolatilityDragMetrics,
    calculateLeverageSimulation,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.LeverageLogic = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
