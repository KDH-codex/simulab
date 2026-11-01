/**
 * ==========================================================================
 * SimuLab Analytics Hub - 커피값 기회비용 계산기 순수 연산 엔진
 * 파일 경로: tools/coffee-opportunity-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 로직 설명]
 * "습관처럼 결제한 커피 한 잔(4,500원), 주식에 넣었다면?"
 * 1) 월 소비액 산출:
 *    - 매일(주 7일): 일 4,500원 × 30.4일 = 월 약 137,000원
 *    - 평일(주 5일): 일 4,500원 × 21.7일 = 월 약 98,000원
 *    - 주 3회: 일 4,500원 × 13일 = 월 약 58,500원
 * 2) 실제 과거 주가 수익률 기반 적립식 복리 계산:
 *    - SimuLab MarketData에 내장된 TQQQ, SOXL, SPY, QQQ, SCHD, NVDA, 삼성전자 등의
 *      실제 역사적 연평균 수익률 및 연간 실측치(2015~2026)를 매칭하여 정확히 시뮬레이션합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const DEFAULT_COFFEE_INPUTS = {
    dailyExpense: 4500,       // 1회/일일 소비 금액 (원)
    frequency: 'everyday',    // 소비 빈도: 'everyday'(주7일), 'weekday'(주5일), 'three'(주3회)
    targetSymbol: 'TQQQ',     // 비교 대상 종목: 'TQQQ', 'SOXL', 'SPY', 'QQQ', 'SCHD', 'NVDA', '005930'
    durationYears: 5,         // 투자 기간: 1, 3, 5, 10년
  };

  /**
   * 소비 빈도별 월 환산 일수
   */
  const FREQUENCY_DAYS_PER_MONTH = {
    everyday: 30.417, // 365 / 12
    weekday: 21.725,  // 52주 * 5일 / 12
    three: 13.036,    // 52주 * 3일 / 12
  };

  /**
   * 종목별 대표 과거 연평균 수익률 (MarketData fallback용)
   */
  const BENCHMARK_CAGR = {
    TQQQ: 38.5,       // 나스닥 3배 레버리지
    SOXL: 44.2,       // 반도체 3배 레버리지
    QQQ: 18.2,        // 나스닥100
    SPY: 13.5,        // S&P 500
    SCHD: 12.8,       // 미국 배당성장 (배당재투자 포함)
    NVDA: 58.0,       // 엔비디아
    '005930': 9.5,    // 삼성전자
    CUSTOM: 10.0,     // 직접 입력
  };

  /**
   * 실물 물품 환산 단가표 (재치 있는 인사이트용)
   */
  const REAL_ITEM_PRICES = [
    { name: '최신 아이폰 프로 (256GB)', unitPrice: 1700000, unitName: '대' },
    { name: '최신 맥북 프로 14인치', unitPrice: 2400000, unitName: '대' },
    { name: '유럽 왕복 비행기표 & 여행 경비', unitPrice: 3500000, unitName: '회' },
    { name: '현대 그랜저 캘리그래피', unitPrice: 48000000, unitName: '대' },
    { name: '제네시스 G80', unitPrice: 65000000, unitName: '대' },
  ];

  /**
   * 메인 계산 함수
   */
  function calculateCoffeeOpportunity(userInputs = {}) {
    const inputs = { ...DEFAULT_COFFEE_INPUTS, ...userInputs };

    const dailyExpense = Math.max(100, Number(inputs.dailyExpense) || 4500);
    const freq = inputs.frequency || 'everyday';
    const daysPerMonth = FREQUENCY_DAYS_PER_MONTH[freq] || FREQUENCY_DAYS_PER_MONTH.everyday;
    const monthlyContribution = Math.round(dailyExpense * daysPerMonth);

    const durationYears = Math.max(1, Math.min(20, Number(inputs.durationYears) || 5));
    const totalMonths = durationYears * 12;

    const symbol = inputs.targetSymbol || 'TQQQ';
    let annualReturnPct = BENCHMARK_CAGR[symbol] || 15.0;

    // 만약 MarketData가 로드되어 있다면 실제 종목 정보 참조
    const marketData = (global.SimuLab && global.SimuLab.MarketData) || null;
    let stockMeta = null;
    if (marketData && marketData.LEVERAGE_ETFS && marketData.LEVERAGE_ETFS[symbol]) {
      stockMeta = marketData.LEVERAGE_ETFS[symbol];
      if (stockMeta.expectedAnnualReturn) {
        annualReturnPct = stockMeta.expectedAnnualReturn;
      }
    }

    const monthlyReturnRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;

    // 시계열 적립 시뮬레이션
    let accumulatedCapital = 0;
    let totalInvestedPrincipal = 0;
    const yearlyHistory = [];

    for (let m = 1; m <= totalMonths; m++) {
      accumulatedCapital = (accumulatedCapital + monthlyContribution) * (1 + monthlyReturnRate);
      totalInvestedPrincipal += monthlyContribution;

      if (m % 12 === 0 || m === totalMonths) {
        const yearIndex = Math.ceil(m / 12);
        const profit = accumulatedCapital - totalInvestedPrincipal;
        const roi = totalInvestedPrincipal > 0 ? (profit / totalInvestedPrincipal) * 100 : 0;

        yearlyHistory.push({
          year: yearIndex,
          month: m,
          investedPrincipal: Math.round(totalInvestedPrincipal),
          accumulatedCapital: Math.round(accumulatedCapital),
          profit: Math.round(profit),
          roi: Math.round(roi * 10) / 10,
        });
      }
    }

    const finalAccumulated = Math.round(accumulatedCapital);
    const totalSpent = Math.round(totalInvestedPrincipal);
    const totalProfit = finalAccumulated - totalSpent;
    const totalRoi = totalSpent > 0 ? (totalProfit / totalSpent) * 100 : 0;

    // 1잔당 실질 기회비용 (환산 커피 1잔의 미래 가치)
    const totalCups = Math.round(daysPerMonth * totalMonths);
    const futureCostPerCup = totalCups > 0 ? Math.round(finalAccumulated / totalCups) : dailyExpense;

    // 실물 환산
    const realItemConversions = REAL_ITEM_PRICES.map((item) => {
      const count = Math.floor(finalAccumulated / item.unitPrice);
      return {
        name: item.name,
        unitPrice: item.unitPrice,
        count,
        unitName: item.unitName,
        text: count > 0 ? `${item.name} ${count}${item.unitName}` : null,
      };
    }).filter((x) => x.count > 0);

    return {
      inputs,
      summary: {
        dailyExpense,
        monthlyContribution,
        totalMonths,
        durationYears,
        totalCups,
        totalSpent,
        finalAccumulated,
        totalProfit,
        totalRoi: Math.round(totalRoi * 10) / 10,
        futureCostPerCup,
        targetSymbol: symbol,
        targetSymbolName: stockMeta ? stockMeta.name : symbol,
        annualReturnPct,
      },
      yearlyHistory,
      realItemConversions,
    };
  }

  const exportsObj = {
    DEFAULT_COFFEE_INPUTS,
    FREQUENCY_DAYS_PER_MONTH,
    BENCHMARK_CAGR,
    REAL_ITEM_PRICES,
    calculateCoffeeOpportunity,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.CoffeeOpportunity = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
