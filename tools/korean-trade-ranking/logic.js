/**
 * 대한민국 수출입 품목 순위 비즈니스 로직 (logic.js)
 * 
 * 주요 역할:
 * 1. 연도별 수출 10대 품목 순위 및 점유율(%) 바 너비 계산
 * 2. 6대 주력 품목(반도체, 자동차 등)의 24년간 성장 배수 및 시계열 데이터 추출
 * 3. 연도별 무역수지(흑자/적자) 및 통계 인사이트 리포트 생성
 */

import { TRADE_YEARS, TRADE_TOTALS, EXPORT_RANKINGS, TIMELINE_KEY_PRODUCTS, IMPORT_TOP5_2024 } from './data.js';

/**
 * 1. 선택 연도의 수출 10대 품목 및 바 차트용 퍼센트 반환
 * @param {number} year - 조회 연도 (예: 2024)
 * @returns {Object} 총 수출액, 무역수지, 10대 품목 목록
 */
export function getExportRankingsByYear(year = 2024) {
  const safeYear = TRADE_YEARS.includes(year) ? year : 2024;
  const list = EXPORT_RANKINGS[safeYear] || EXPORT_RANKINGS[2024];
  const summary = TRADE_TOTALS[safeYear] || TRADE_TOTALS[2024];

  // 1위 품목의 금액(최대값)을 기준으로 상대 막대 너비(%) 계산
  const maxAmount = list.length > 0 ? list[0].amount : 1;

  const items = list.map(item => {
    return {
      ...item,
      barPercent: Math.max(5, Math.round((item.amount / maxAmount) * 100))
    };
  });

  return {
    year: safeYear,
    summary,
    items
  };
}

/**
 * 2. 특정 품목의 2000~2024 시계열 데이터 및 성장률 분석
 * @param {string} productName - 품목명 (예: '반도체', '자동차')
 * @returns {Object} 품목 정보, 24년간 성장 배수, 연도별 금액 목록
 */
export function getProductGrowthStats(productName = '반도체') {
  const product = TIMELINE_KEY_PRODUCTS.find(p => p.name === productName) || TIMELINE_KEY_PRODUCTS[0];

  const firstVal = product.series[0].amount;
  const lastVal = product.series[product.series.length - 1].amount;
  const growthMultiplier = (lastVal / firstVal).toFixed(1);

  // 최고 수출 달성 연도 찾기
  let maxSeries = product.series[0];
  product.series.forEach(pt => {
    if (pt.amount > maxSeries.amount) {
      maxSeries = pt;
    }
  });

  return {
    ...product,
    firstYear: product.series[0].year,
    firstVal,
    lastYear: product.series[product.series.length - 1].year,
    lastVal,
    growthMultiplier,
    peakYear: maxSeries.year,
    peakAmount: maxSeries.amount
  };
}

/**
 * 3. 24년간의 대한민국 무역수지 흑자·적자 전체 히스토리 목록
 * @returns {Array} 연도별 수출, 수입, 무역수지, 흑자여부
 */
export function getTradeBalanceHistory() {
  return TRADE_YEARS.map(yr => {
    const data = TRADE_TOTALS[yr];
    return {
      year: yr,
      export: data.export,
      import: data.import,
      balance: data.balance,
      isSurplus: data.balance >= 0,
      highlight: data.highlight
    };
  });
}

/**
 * 4. 2024년 기준 핵심 무역 팩트 인사이트 생성
 * @returns {Object} 무역 요약 문구
 */
export function getTradeQuickFacts() {
  const latest = TRADE_TOTALS[2024];
  const semi = EXPORT_RANKINGS[2024][0]; // 반도체
  const auto = EXPORT_RANKINGS[2024][1]; // 자동차

  return {
    totalExport: latest.export,
    totalBalance: latest.balance,
    semiShare: semi.share,
    autoShare: auto.share,
    combinedTop2Share: (semi.share + auto.share).toFixed(1),
    importTop1: IMPORT_TOP5_2024[0],
    importTop2: IMPORT_TOP5_2024[1]
  };
}
