/**
 * ==========================================================================
 * SimuLab Analytics Hub - 과거 물가 현재 환산 계산기 순수 연산 엔진
 * 파일 경로: tools/inflation-purchasing-power-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 로직 설명]
 * "1990년의 1,000만원은 지금 얼마일까?"
 * 1) 한국은행·통계청 공식 소비자물가지수(CPI) 시계열:
 *    - 2020년 = 100 기준, 1980년부터 2026년 최신까지의 물가지표를 내장했습니다.
 * 2) 현재 가치 환산:
 *    - 현재 가치 = 과거 금액 × (최신 CPI ÷ 기준 연도 CPI)
 * 3) 화폐 가치(구매력) 하락률:
 *    - 1 - (기준 연도 CPI ÷ 최신 CPI)
 * ==========================================================================
 */

(function (global) {
  'use strict';

  /**
   * 한국은행/통계청 대한민국 소비자물가지수 (2020년 = 100 기준 연평균 시계열)
   */
  const KOREA_CPI_HISTORY = {
    1980: 20.1,
    1981: 24.4,
    1982: 26.2,
    1983: 27.1,
    1984: 27.7,
    1985: 28.4,
    1986: 29.2,
    1987: 30.1,
    1988: 32.2,
    1989: 34.0,
    1990: 36.9,
    1991: 40.3,
    1992: 42.8,
    1993: 44.9,
    1994: 47.7,
    1995: 49.8,
    1996: 52.3,
    1997: 54.6,
    1998: 58.7,
    1999: 59.2,
    2000: 60.6,
    2001: 63.1,
    2002: 64.8,
    2003: 67.1,
    2004: 69.5,
    2005: 71.4,
    2006: 73.0,
    2007: 74.8,
    2008: 78.3,
    2009: 80.5,
    2010: 82.9,
    2011: 86.2,
    2012: 88.1,
    2013: 89.2,
    2014: 90.4,
    2015: 91.0,
    2016: 91.9,
    2017: 93.7,
    2018: 95.1,
    2019: 95.5,
    2020: 100.0,
    2021: 102.5,
    2022: 107.7,
    2023: 111.6,
    2024: 114.5,
    2025: 117.2,
    2026: 119.8, // 2026년 최신 추정치
  };

  const CURRENT_YEAR = 2026;
  const CURRENT_CPI = KOREA_CPI_HISTORY[CURRENT_YEAR];

  /**
   * 시대별 대표 생활물가 실측 변천사
   */
  const REAL_PRICE_HISTORY = [
    { name: '자장면 1그릇', y1980: 350, y1990: 1000, y2000: 2500, y2010: 4000, y2026: 7000 },
    { name: '서울 시내버스 요금', y1980: 80, y1990: 140, y2000: 600, y2010: 900, y2026: 1500 },
    { name: '법정 최저시급', y1980: 300, y1990: 690, y2000: 1865, y2010: 4110, y2026: 10030 },
    { name: '순금 한 돈 (3.75g)', y1980: 25000, y1990: 38000, y2000: 48000, y2010: 180000, y2026: 510000 },
    { name: '서울 아파트 평균 매매가', y1980: 20000000, y1990: 120000000, y2000: 240000000, y2010: 540000000, y2026: 1250000000 },
  ];

  const DEFAULT_INFLATION_INPUTS = {
    baseYear: 2000,          // 기준 연도 (1980 ~ 2025)
    baseAmount: 10000000,     // 당시 금액 (1,000만원)
  };

  /**
   * 메인 계산 함수
   */
  function calculateInflationPurchasingPower(userInputs = {}) {
    const inputs = { ...DEFAULT_INFLATION_INPUTS, ...userInputs };

    const baseYear = Math.max(1980, Math.min(2025, Number(inputs.baseYear) || 2000));
    const baseAmount = Math.max(100, Number(inputs.baseAmount) || 10000000);

    const baseCpi = KOREA_CPI_HISTORY[baseYear] || 60.6;
    const inflationMultiplier = CURRENT_CPI / baseCpi;
    const currentValue = Math.round(baseAmount * inflationMultiplier);

    // 구매력 하락률 (1만원으로 살 수 있는 물품의 양이 얼마나 줄었는가)
    const purchasingPowerRatio = baseCpi / CURRENT_CPI;
    const purchasingLossPct = (1 - purchasingPowerRatio) * 100;

    // 연평균 복리 물가상승률 (CAGR)
    const yearsElapsed = CURRENT_YEAR - baseYear;
    const inflationCagr = yearsElapsed > 0
      ? (Math.pow(inflationMultiplier, 1 / yearsElapsed) - 1) * 100
      : 0;

    // 10년 단위 시계열 데이터 생성
    const timelineData = [];
    for (let yr = baseYear; yr <= CURRENT_YEAR; yr++) {
      if (yr === baseYear || yr % 5 === 0 || yr === CURRENT_YEAR) {
        const cpi = KOREA_CPI_HISTORY[yr];
        const val = Math.round(baseAmount * (cpi / baseCpi));
        timelineData.push({
          year: yr,
          cpi,
          value: val,
        });
      }
    }

    return {
      inputs,
      summary: {
        baseYear,
        currentYear: CURRENT_YEAR,
        yearsElapsed,
        baseAmount,
        currentValue,
        baseCpi,
        currentCpi: CURRENT_CPI,
        inflationMultiplier: Math.round(inflationMultiplier * 100) / 100,
        purchasingLossPct: Math.round(purchasingLossPct * 10) / 10,
        inflationCagr: Math.round(inflationCagr * 10) / 10,
      },
      timelineData,
      realPriceHistory: REAL_PRICE_HISTORY,
    };
  }

  const exportsObj = {
    DEFAULT_INFLATION_INPUTS,
    KOREA_CPI_HISTORY,
    REAL_PRICE_HISTORY,
    calculateInflationPurchasingPower,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.InflationPurchasingPower = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
