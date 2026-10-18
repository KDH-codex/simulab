/**
 * ==========================================================================
 * SimuLab Analytics Hub - 월 배당 목표 달성 계산기 순수 연산 엔진
 * 파일 경로: tools/dividend-goal-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 로직 설명]
 * "매월 배당금 100만원을 받으려면 도대체 얼마의 주식이 필요할까?"
 * 1) 기본 역산 공식:
 *    - 목표 연간 세후 배당금 = 목표 월 배당금 × 12개월
 *    - 세전 필요 배당금 = 목표 연간 세후 배당금 ÷ (1 - 배당소득세율)
 *    - 필요 총 투자원금 = 세전 필요 배당금 ÷ 연 배당수익률
 * 2) 시계열 적립식 시뮬레이션 (목표 도달 기간 산출):
 *    - 초기 투자금에서 시작하여 매월 추가 적립금 + (배당 재투자 DRIP) + 자본차익(주가상승) + 배당성장률을
 *      복리로 누적 계산하여 정확히 몇 년 몇 개월 만에 목표 월 배당금을 달성하는지 추적합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  /**
   * 1. 기본 입력 파라미터 기본값
   */
  const DEFAULT_DIVIDEND_GOAL_INPUTS = {
    targetMonthlyDividend: 1000000, // 목표 월 세후 배당금 (100만원)
    expectedDividendYield: 4.5,     // 예상 연간 배당수익률 (%)
    dividendGrowthRate: 4.0,        // 연간 배당성장률 (%, SCHD 등 배당성장주 평균)
    stockPriceGrowth: 4.0,          // 연간 주가상승률 (%)
    initialCapital: 20000000,       // 현재 보유 시드머니 (2,000만원)
    monthlyContribution: 500000,    // 매월 추가 적립금 (50만원)
    taxRateType: 'general',         // 세금 유형: 'general'(15.4%), 'isa'(0% 비과세/분리), 'pension'(5.5%)
    customTaxRate: 15.4,            // 직접 입력 세율 (%)
    reinvestDividend: true,         // 배당 재투자(DRIP) 여부
  };

  /**
   * 세율 계산 유틸리티
   */
  function getEffectiveTaxRate(inputs) {
    if (inputs.taxRateType === 'isa') return 0.0; // ISA 비과세 가정 (초과분 9.9% 별도 고려 가능)
    if (inputs.taxRateType === 'pension') return 0.055; // 연금저축/IRP 연금소득세 5.5%
    if (inputs.taxRateType === 'custom') {
      const parsed = Number(inputs.customTaxRate);
      return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed / 100)) : 0.154;
    }
    return 0.154; // 일반 배당소득세 15.4% (소득세 14% + 지방소득세 1.4%)
  }

  /**
   * 2. 메인 시뮬레이션 계산 함수
   */
  function calculateDividendGoal(userInputs = {}) {
    const inputs = { ...DEFAULT_DIVIDEND_GOAL_INPUTS, ...userInputs };

    const targetMonthly = Math.max(10000, Number(inputs.targetMonthlyDividend) || 1000000);
    const targetAnnualNet = targetMonthly * 12;
    const yieldPct = Math.max(0.1, Math.min(30, Number(inputs.expectedDividendYield) || 4.5));
    const divYield = yieldPct / 100;
    const divGrowthRate = Math.max(0, Math.min(30, Number(inputs.dividendGrowthRate) || 0)) / 100;
    const priceGrowthRate = Math.max(-20, Math.min(50, Number(inputs.stockPriceGrowth) || 0)) / 100;
    const initialCap = Math.max(0, Number(inputs.initialCapital) || 0);
    const monthlySave = Math.max(0, Number(inputs.monthlyContribution) || 0);
    const reinvest = Boolean(inputs.reinvestDividend);
    const taxRate = getEffectiveTaxRate(inputs);

    // 1) 고정 원금 역산 (현재 배당률 기준 목표 달성에 필요한 일시불 원금)
    const targetAnnualGross = targetAnnualNet / (1 - taxRate);
    const requiredTotalCapital = Math.round(targetAnnualGross / divYield);
    const initialAnnualNet = initialCap * divYield * (1 - taxRate);
    const initialMonthlyNet = Math.round(initialAnnualNet / 12);
    const capitalShortfall = Math.max(0, requiredTotalCapital - initialCap);
    const initialProgressPct = Math.min(100, (initialCap / requiredTotalCapital) * 100);

    // 2) 시계열 시뮬레이션 (최대 40년 = 480개월)
    let currentCapital = initialCap;
    let targetReachedMonth = null;
    let currentAnnualDividendYield = divYield;

    const monthlyData = [];
    const yearlyData = [];

    const monthlyPriceGrowthRate = Math.pow(1 + priceGrowthRate, 1 / 12) - 1;
    const monthlyDivGrowthRate = Math.pow(1 + divGrowthRate, 1 / 12) - 1;

    let cumulativeInvested = initialCap;
    let cumulativeNetDividends = 0;

    for (let m = 1; m <= 480; m++) {
      // 월초 적립금 투입
      currentCapital += monthlySave;
      cumulativeInvested += monthlySave;

      // 이번 달 연간 배당률 갱신 (배당성장)
      currentAnnualDividendYield *= (1 + monthlyDivGrowthRate);

      // 이번 달 세후 배당금 수령액
      const monthGrossDividend = (currentCapital * currentAnnualDividendYield) / 12;
      const monthNetDividend = monthGrossDividend * (1 - taxRate);
      cumulativeNetDividends += monthNetDividend;

      // 배당 재투자
      if (reinvest) {
        currentCapital += monthNetDividend;
      }

      // 주가 상승분 반영
      currentCapital *= (1 + monthlyPriceGrowthRate);

      // 목표 달성 체크
      if (targetReachedMonth === null && monthNetDividend >= targetMonthly) {
        targetReachedMonth = m;
      }

      // 12개월마다 연간 데이터 기록
      if (m % 12 === 0 || m === 480) {
        const yearNum = Math.ceil(m / 12);
        yearlyData.push({
          year: yearNum,
          month: m,
          totalCapital: Math.round(currentCapital),
          cumulativeInvested: Math.round(cumulativeInvested),
          monthlyNetDividend: Math.round(monthNetDividend),
          annualNetDividend: Math.round(monthNetDividend * 12),
          cumulativeNetDividends: Math.round(cumulativeNetDividends),
          isTargetReached: monthNetDividend >= targetMonthly,
        });
      }

      // 최대 40년 중 처음 5년은 월별 데이터도 보관 (정밀 차트용)
      if (m <= 60 || m === targetReachedMonth) {
        monthlyData.push({
          month: m,
          year: (m / 12).toFixed(1),
          totalCapital: Math.round(currentCapital),
          monthlyNetDividend: Math.round(monthNetDividend),
        });
      }
    }

    // 목표 도달 기간 문자열
    let timeToTargetText = '40년 이상 소요';
    if (targetReachedMonth !== null) {
      const reachYears = Math.floor(targetReachedMonth / 12);
      const reachMonths = targetReachedMonth % 12;
      if (reachYears === 0) {
        timeToTargetText = `약 ${reachMonths}개월`;
      } else if (reachMonths === 0) {
        timeToTargetText = `약 ${reachYears}년`;
      } else {
        timeToTargetText = `약 ${reachYears}년 ${reachMonths}개월`;
      }
    } else if (initialMonthlyNet >= targetMonthly) {
      timeToTargetText = '이미 달성 완료';
    }

    // 대표 배당주 포트폴리오 가상 배분 비교
    const portfolioSamples = [
      {
        symbol: 'SCHD',
        name: '미국 배당성장 다우 (Schwab US Dividend)',
        avgYield: 3.6,
        avgGrowth: 7.5,
        requiredCap: Math.round(targetAnnualGross / 0.036),
        note: '배당성장률이 높아 장기 투자 시 원금 회수 및 배당 증액에 최적화',
      },
      {
        symbol: 'JEPI',
        name: 'JP모건 커버드콜 인컴 (JEPI)',
        avgYield: 7.5,
        avgGrowth: 1.0,
        requiredCap: Math.round(targetAnnualGross / 0.075),
        note: '즉각적인 고배당 현금흐름으로 적은 원금으로 빠른 목표 달성 가능',
      },
      {
        symbol: 'O',
        name: '리얼티인컴 (Realty Income)',
        avgYield: 5.2,
        avgGrowth: 3.2,
        requiredCap: Math.round(targetAnnualGross / 0.052),
        note: '대표적인 월배당 부동산 리츠(REITs)로 안정적 월세형 현금흐름',
      },
      {
        symbol: '맥쿼리인프라',
        name: '맥쿼리한국인프라투융자회사',
        avgYield: 6.5,
        avgGrowth: 2.0,
        requiredCap: Math.round(targetAnnualGross / 0.065),
        note: '도로·교량 등 국가 인프라 기반의 국내 대표 안정 고배당주',
      },
    ];

    return {
      inputs,
      summary: {
        targetMonthlyDividend: targetMonthly,
        targetAnnualNetDividend: targetAnnualNet,
        targetAnnualGrossDividend: Math.round(targetAnnualGross),
        requiredTotalCapital,
        initialCapital: initialCap,
        initialMonthlyNetDividend: initialMonthlyNet,
        initialProgressPct: Math.round(initialProgressPct * 10) / 10,
        capitalShortfall,
        effectiveTaxRatePct: Math.round(taxRate * 1000) / 10,
        targetReachedMonth,
        timeToTargetText,
        finalCapital40Y: yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].totalCapital : 0,
        finalMonthlyNet40Y: yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].monthlyNetDividend : 0,
      },
      yearlyData,
      monthlyData,
      portfolioSamples,
    };
  }

  const exportsObj = {
    DEFAULT_DIVIDEND_GOAL_INPUTS,
    calculateDividendGoal,
    getEffectiveTaxRate,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.DividendGoal = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
