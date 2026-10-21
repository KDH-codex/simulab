/**
 * 대한민국 출입국 관광객 및 관광수지 비즈니스 로직 (logic.js)
 * 
 * 주요 역할:
 * 1. 24개년 출입국 시계열 데이터 및 피크(2019년) 대비 회복률 계산
 * 2. 내국인 출국 vs 외국인 입국 비율 및 관광수지 적자 구조 분석
 * 3. 2024년 최신 한국인 선호 여행지 및 방한 외래객 순위 정리
 */

import { TOURISM_YEARS, TOURISM_STATS, OUTBOUND_TOP5_2024, INBOUND_TOP5_2024 } from './data.js';

/**
 * 1. 2000~2024년 전체 출입국 시계열 데이터 반환
 * @returns {Array} 연도별 출국자, 입국자, 관광수지, 격차 목록
 */
export function getTourismTimeSeries() {
  return TOURISM_YEARS.map(yr => {
    const d = TOURISM_STATS[yr];
    const diff = d.outbound - d.inbound; // 양수면 출국이 더 많음 (통상 한국은 출국 우위)
    const ratio = d.inbound > 0 ? (d.outbound / d.inbound).toFixed(1) : '0';

    return {
      year: yr,
      outbound: d.outbound,
      inbound: d.inbound,
      diff,
      ratio,
      balance: d.balance,
      highlight: d.highlight
    };
  });
}

/**
 * 2. 특정 연도의 출입국 상세 지표 및 2019년(역대 피크) 대비 회복률 계산
 * @param {number} year - 조회 연도 (예: 2024)
 * @returns {Object} 상세 분석 객체
 */
export function getYearlyTourismDetail(year = 2024) {
  const safeYear = TOURISM_YEARS.includes(year) ? year : 2024;
  const d = TOURISM_STATS[safeYear];

  const peak2019 = TOURISM_STATS[2019];
  const outboundRecoveryRate = Math.round((d.outbound / peak2019.outbound) * 100);
  const inboundRecoveryRate = Math.round((d.inbound / peak2019.inbound) * 100);

  const ratio = d.inbound > 0 ? (d.outbound / d.inbound).toFixed(1) : '1.0';

  return {
    year: safeYear,
    outbound: d.outbound,
    inbound: d.inbound,
    balance: d.balance,
    highlight: d.highlight,
    outboundRecoveryRate,
    inboundRecoveryRate,
    ratio
  };
}

/**
 * 3. 2024년 관광 팩트 인사이트 요약
 * @returns {Object} 인사이트 텍스트 및 국적별 통계
 */
export function getTourismQuickInsights() {
  const d2024 = TOURISM_STATS[2024];
  const topOutbound = OUTBOUND_TOP5_2024[0]; // 일본
  const topInbound = INBOUND_TOP5_2024[0];   // 중국

  return {
    outboundTotal: d2024.outbound,
    inboundTotal: d2024.inbound,
    balanceDeficit: Math.abs(d2024.balance),
    topOutboundCountry: topOutbound.country,
    topOutboundShare: topOutbound.share,
    topInboundCountry: topInbound.country,
    topInboundShare: topInbound.share,
    outboundTop5: OUTBOUND_TOP5_2024,
    inboundTop5: INBOUND_TOP5_2024
  };
}
