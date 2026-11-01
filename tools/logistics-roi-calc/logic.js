/**
 * ==========================================================================
 * [도구 3] B2B 설비 도입 ROI 및 손익분기점(BEP) 시뮬레이터 - 순수 계산 모듈
 * 파일 경로: tools/logistics-roi-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 물류 자동화 장비, 매장 로봇/키오스크, 제조 설비 등을 도입할 때
 *   "몇 개월 만에 투자 원금(CAPEX)을 회수하고 흑자로 전환(BEP 골든크로스)하는가?"를
 *   계산하는 순수 재무·회계 수식 파일입니다.
 * - 로컬(file://) 환경과 Node.js 테스트 환경 모두에서 동작하도록 UMD 패턴을 적용했습니다.
 * ==========================================================================
 */

const DEFAULT_ROI_INPUTS = {
  capex: 50000000,               // 초기 설비 도입 투자비 (CAPEX: 5,000만원)
  monthlyLaborSavings: 3500000,  // 월 인건비 절감액 (350만원/월)
  monthlyThroughputGain: 1200000,// 처리량(Throughput) 향상에 따른 월 추가 매출이익 (120만원/월)
  monthlyOpex: 700000,           // 설비 월 유지보수·전력·소모품비 (OPEX: 70만원/월)
  discountRate: 6.0,             // 연간 자본할인율 / 대출금리 (NPV 산출용: 6.0%)
  analysisMonths: 36,            // 분석 기간 (36개월 = 3년)
};

/**
 * 사용자 입력값을 안전한 범위로 정규화하여 Zero Division(0으로 나누기) 및 NaN을 방지합니다.
 * @param {Object} rawInputs - 사용자 입력 객체
 * @returns {Object} 보정된 입력 객체
 */
function sanitizeRoiInputs(rawInputs = {}) {
  const safeNum = (val, min, max, fallback) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
  };

  return {
    capex: safeNum(rawInputs.capex, 100000, 10000000000, DEFAULT_ROI_INPUTS.capex),
    monthlyLaborSavings: safeNum(rawInputs.monthlyLaborSavings, 0, 500000000, DEFAULT_ROI_INPUTS.monthlyLaborSavings),
    monthlyThroughputGain: safeNum(rawInputs.monthlyThroughputGain, 0, 500000000, DEFAULT_ROI_INPUTS.monthlyThroughputGain),
    monthlyOpex: safeNum(rawInputs.monthlyOpex, 0, 500000000, DEFAULT_ROI_INPUTS.monthlyOpex),
    discountRate: safeNum(rawInputs.discountRate, 0, 30, DEFAULT_ROI_INPUTS.discountRate),
    analysisMonths: Math.round(safeNum(rawInputs.analysisMonths, 6, 60, DEFAULT_ROI_INPUTS.analysisMonths)),
  };
}

/**
 * 설비 도입 ROI, 손익분기점(BEP) 도달 개월 수, 순현재가치(NPV) 및
 * 월별 누적 현금흐름 시계열 데이터를 계산합니다.
 *
 * @param {Object} rawInputs - 사용자 입력 객체
 * @returns {Object} 시뮬레이션 결과 객체
 */
function calculateRoiSimulation(rawInputs) {
  const inputs = sanitizeRoiInputs(rawInputs);
  const {
    capex,
    monthlyLaborSavings,
    monthlyThroughputGain,
    monthlyOpex,
    discountRate,
    analysisMonths,
  } = inputs;

  // 1) 월간 총 효익(Gross Benefit) 및 월간 순현금흐름(Net Monthly Cash Flow)
  const monthlyGrossBenefit = monthlyLaborSavings + monthlyThroughputGain;
  const monthlyNetCashFlow = monthlyGrossBenefit - monthlyOpex;

  // 2) 단순 손익분기점(BEP / Simple Payback Period) 개월 수 계산 (0으로 나누기 방어)
  let paybackMonths = null;
  if (monthlyNetCashFlow > 0) {
    paybackMonths = capex / monthlyNetCashFlow;
  }

  // 3) 월간 할인율 변환: (1 + 연할인율)^(1/12) - 1
  const annualDecimal = discountRate / 100;
  const monthlyDiscountRate = annualDecimal > 0 ? Math.pow(1 + annualDecimal, 1 / 12) - 1 : 0;

  // 4) 0개월(도입 시점)부터 N개월까지 누적 현금흐름 및 할인 현금흐름(NPV) 계산
  const labels = ['도입초기'];
  const cumulativeNetSeries = [-capex];       // 명목 누적 순현금흐름 (-CAPEX에서 시작해 매월 +순현금흐름)
  const cumulativeDiscountedSeries = [-capex]; // 할인된 누적 순현금흐름 (NPV 궤적)
  const zeroBaselineSeries = [0];              // Y=0 손익분기 기준선
  const periodTable = [];

  let currentCumulative = -capex;
  let currentNpv = -capex;
  let discountedPaybackMonths = null;

  for (let m = 1; m <= analysisMonths; m++) {
    const prevDiscounted = currentNpv;
    currentCumulative += monthlyNetCashFlow;

    // t개월차 현금흐름의 현재가치(PV) = CF / (1 + r_m)^t
    const pvOfMonth = monthlyNetCashFlow / Math.pow(1 + monthlyDiscountRate, m);
    currentNpv += pvOfMonth;

    // 할인 기준 손익분기점(Discounted Payback) 돌파 시점 포착
    if (discountedPaybackMonths === null && prevDiscounted < 0 && currentNpv >= 0 && pvOfMonth > 0) {
      discountedPaybackMonths = (m - 1) + Math.abs(prevDiscounted) / pvOfMonth;
    }

    const roundedCum = Math.round(currentCumulative);
    const roundedNpv = Math.round(currentNpv);

    labels.push(`${m}개월`);
    cumulativeNetSeries.push(roundedCum);
    cumulativeDiscountedSeries.push(roundedNpv);
    zeroBaselineSeries.push(0);

    const cumulativeRoiPct = capex > 0 ? (roundedCum / capex) * 100 : 0;
    periodTable.push({
      month: m,
      monthlyGrossBenefit: Math.round(monthlyGrossBenefit),
      monthlyOpex: Math.round(monthlyOpex),
      monthlyNetCashFlow: Math.round(monthlyNetCashFlow),
      cumulativeNetCashFlow: roundedCum,
      cumulativeNpv: roundedNpv,
      cumulativeRoiPct,
      isBreakEvenReached: roundedCum >= 0,
    });
  }

  const finalNetProfit = cumulativeNetSeries[cumulativeNetSeries.length - 1];
  const finalNpv = cumulativeDiscountedSeries[cumulativeDiscountedSeries.length - 1];
  const totalRoiPct = capex > 0 ? (finalNetProfit / capex) * 100 : 0;
  const annualizedRoiPct = analysisMonths > 0 ? totalRoiPct * (12 / analysisMonths) : 0;

  return {
    inputs,
    summary: {
      monthlyGrossBenefit,
      monthlyNetCashFlow,
      paybackMonths,             // null이면 회수 불가(적자 구조)
      discountedPaybackMonths,   // 할인율 반영 회수 개월 수
      finalNetProfit,            // 분석 기간 종료 시점 누적 순이익 (CAPEX 차감 후)
      finalNpv,                  // 순현재가치 (NPV)
      totalRoiPct,               // 총 투자수익률 (ROI %)
      annualizedRoiPct,          // 연환산 단순 ROI (%)
    },
    chartData: {
      labels,
      cumulativeNetSeries,
      cumulativeDiscountedSeries,
      zeroBaselineSeries,
    },
    periodTable,
  };
}

// 브라우저(window.SimuLab) 및 Node.js 환경 동시 지원
if (typeof window !== 'undefined') {
  window.SimuLab = window.SimuLab || {};
  window.SimuLab.RoiLogic = {
    DEFAULT_ROI_INPUTS,
    sanitizeRoiInputs,
    calculateRoiSimulation,
  };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_ROI_INPUTS,
    sanitizeRoiInputs,
    calculateRoiSimulation,
  };
}
