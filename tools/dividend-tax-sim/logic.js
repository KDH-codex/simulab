/**
 * ==========================================================================
 * [도구 5] 배당성장주(SCHD) 복리 재투자 & 금융소득종합과세·건보료 시뮬레이터 - 순수 계산 모듈
 * 파일 경로: tools/dividend-tax-sim/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 미국 배당성장주(SCHD 등)나 고배당 커버드콜(JEPI/JEPQ)에 적립식으로 투자할 때,
 *   "주가 상승 + 매년 늘어나는 배당성장률 + 배당금 재투자(DRIP)"가 결합된 3중 복리 스노우볼을 계산합니다.
 * - 특히 대한민국 세법상 연간 이자·배당소득이 2,000만원을 초과할 때 발생하는
 *   '금융소득종합과세(최대 49.5%)'와 '건강보험료 추가 부과(약 8%)' 충격을 정확히 시뮬레이션하고,
 *   절세 계좌(연금저축·IRP·ISA 과세이연) 활용 시 얼마나 많은 세금과 자산을 아낄 수 있는지 비교합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const TAX_THRESHOLD_KRW = 20000000;          // 금융소득종합과세 및 직장가입자 건보료 부과 기준선 (연 2,000만원)
  const WITHHOLDING_TAX_RATE = 0.154;          // 기본 배당소득 원천징수세율 (지방소득세 포함 15.4%)
  const HEALTH_INSURANCE_RATE_ON_EXCESS = 0.08;// 2,000만원 초과 금융소득에 대한 건강보험료+장기요양보험료율 근사치(약 8.0%)
  const PENSION_LOW_TAX_RATE = 0.055;          // 연금저축·IRP 연금 수령 시 분리과세율 (5.5%, 금소세·건보료 미합산)

  const DEFAULT_DIVIDEND_INPUTS = {
    initialPrincipal: 50000000,    // 초기 거치 원금 (5,000만원)
    monthlyContribution: 1500000,  // 월 적립 투자금 (150만원)
    initialDividendYield: 3.6,     // 초기 시가배당률 (3.6% - SCHD 수준)
    dividendGrowthRate: 8.5,       // 연간 배당성장률 (8.5% - 최근 10년 배당성장 평균 수준)
    priceAppreciationRate: 6.0,    // 연간 주가 상승률 (6.0%)
    investmentYears: 15,           // 투자 기간 (15년)
    marginalTaxRatePct: 26.4,      // 타 소득 합산 종합소득 한계세율 (지방세 포함 기본 26.4%: 과표 5,000~8,800만원 구간)
    reinvestDividends: 1,          // 배당금 재투자(DRIP) 여부 (1: 전액 재투자, 0: 현금 수령)
  };

  /**
   * 사용자 입력값을 안전한 수치 범위로 정규화합니다.
   */
  function sanitizeDividendInputs(rawInputs = {}) {
    const safeNum = (val, min, max, fallback) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(Math.max(n, min), max);
    };

    return {
      initialPrincipal: safeNum(rawInputs.initialPrincipal, 0, 10000000000, DEFAULT_DIVIDEND_INPUTS.initialPrincipal),
      monthlyContribution: safeNum(rawInputs.monthlyContribution, 0, 500000000, DEFAULT_DIVIDEND_INPUTS.monthlyContribution),
      initialDividendYield: safeNum(rawInputs.initialDividendYield, 0.5, 25, DEFAULT_DIVIDEND_INPUTS.initialDividendYield),
      dividendGrowthRate: safeNum(rawInputs.dividendGrowthRate, 0, 25, DEFAULT_DIVIDEND_INPUTS.dividendGrowthRate),
      priceAppreciationRate: safeNum(rawInputs.priceAppreciationRate, -10, 25, DEFAULT_DIVIDEND_INPUTS.priceAppreciationRate),
      investmentYears: Math.round(safeNum(rawInputs.investmentYears, 1, 40, DEFAULT_DIVIDEND_INPUTS.investmentYears)),
      marginalTaxRatePct: safeNum(rawInputs.marginalTaxRatePct, 15.4, 49.5, DEFAULT_DIVIDEND_INPUTS.marginalTaxRatePct),
      reinvestDividends: Number(rawInputs.reinvestDividends) === 0 ? 0 : 1,
    };
  }

  /**
   * 연간 세전 배당금에 대해 일반 계좌(해외직투) 기준 세금 및 건보료 부담액을 계산합니다.
   *
   * [대한민국 금융소득종합과세 & 건보료 산식]
   * - 연 배당소득 2,000만원 이하: 15.4% 분리과세로 종결 (건보료 추가 부과 없음)
   * - 연 배당소득 2,000만원 초과:
   *   1) 2,000만원까지는 15.4% (308만원)
   *   2) 2,000만원 초과분은 근로·사업소득과 합산되어 개인의 종합소득 한계세율(예: 26.4% ~ 49.5%) 적용
   *   3) 2,000만원 초과분에 대해 보수외소득월액 건강보험료(약 8%) 추가 부과
   */
  function calculateGeneralAccountTax(annualGrossDividend, marginalTaxRatePct) {
    if (annualGrossDividend <= 0) {
      return {
        withholdingTax: 0,
        comprehensiveExtraTax: 0,
        extraHealthInsurance: 0,
        totalTaxAndIns: 0,
        netAnnualDividend: 0,
        isComprehensiveTaxTriggered: false,
      };
    }

    const effectiveMarginalRate = Math.max(WITHHOLDING_TAX_RATE, marginalTaxRatePct / 100);

    if (annualGrossDividend <= TAX_THRESHOLD_KRW) {
      const withholdingTax = annualGrossDividend * WITHHOLDING_TAX_RATE;
      return {
        withholdingTax,
        comprehensiveExtraTax: 0,
        extraHealthInsurance: 0,
        totalTaxAndIns: withholdingTax,
        netAnnualDividend: annualGrossDividend - withholdingTax,
        isComprehensiveTaxTriggered: false,
      };
    }

    const baseTax = TAX_THRESHOLD_KRW * WITHHOLDING_TAX_RATE;
    const excessAmount = annualGrossDividend - TAX_THRESHOLD_KRW;
    const withholdingOnExcess = excessAmount * WITHHOLDING_TAX_RATE;
    const comprehensiveExtraTax = excessAmount * Math.max(0, effectiveMarginalRate - WITHHOLDING_TAX_RATE);
    const extraHealthInsurance = excessAmount * HEALTH_INSURANCE_RATE_ON_EXCESS;

    const totalTaxAndIns = baseTax + withholdingOnExcess + comprehensiveExtraTax + extraHealthInsurance;
    return {
      withholdingTax: baseTax + withholdingOnExcess,
      comprehensiveExtraTax,
      extraHealthInsurance,
      totalTaxAndIns,
      netAnnualDividend: Math.max(0, annualGrossDividend - totalTaxAndIns),
      isComprehensiveTaxTriggered: true,
    };
  }

  /**
   * 배당성장주 장기 적립 및 세후 재투자(일반계좌 vs 절세계좌 과세이연) 시뮬레이션을 수행합니다.
   */
  function calculateDividendSimulation(rawInputs) {
    const inputs = sanitizeDividendInputs(rawInputs);
    const {
      initialPrincipal,
      monthlyContribution,
      initialDividendYield,
      dividendGrowthRate,
      priceAppreciationRate,
      investmentYears,
      marginalTaxRatePct,
      reinvestDividends,
    } = inputs;

    const priceGrowthDec = priceAppreciationRate / 100;
    const divGrowthDec = dividendGrowthRate / 100;
    const initYieldDec = initialDividendYield / 100;

    // 주당 배당률이 매년 배당성장률과 주가상승률의 비율에 따라 어떻게 변하는지 계산
    // Year y의 시가배당률 = 초기배당률 * ((1 + 배당성장률) / (1 + 주가상승률))^(y-1)
    const getYieldAtYear = (yearIndex) => {
      if (1 + priceGrowthDec <= 0.05) return initYieldDec;
      return initYieldDec * Math.pow((1 + divGrowthDec) / (1 + priceGrowthDec), yearIndex - 1);
    };

    const labels = ['초기'];
    const principalSeries = [Math.round(initialPrincipal)];
    const generalAccountAssetSeries = [Math.round(initialPrincipal)];
    const taxDeferredAssetSeries = [Math.round(initialPrincipal)];
    const generalMonthlyNetDivSeries = [0];
    const taxDeferredMonthlyNetDivSeries = [0];

    const yearlyTable = [];

    let cumPrincipal = initialPrincipal;
    let generalAsset = initialPrincipal;
    let taxDeferredAsset = initialPrincipal;

    let cumulativeTaxSaved = 0;
    let firstComprehensiveTaxYear = null;

    for (let y = 1; y <= investmentYears; y++) {
      const annualContrib = monthlyContribution * 12;
      cumPrincipal += annualContrib;

      // 연중 평균 운용 자산(기초 자산 + 연간 적립금의 절반)에 대해 주가 상승 및 배당 발생
      const currentYield = getYieldAtYear(y);

      // 1) 일반 해외직투 계좌 계산
      const generalAvgBase = generalAsset + annualContrib * 0.5;
      const generalGrossDiv = generalAvgBase * currentYield;
      const genTaxInfo = calculateGeneralAccountTax(generalGrossDiv, marginalTaxRatePct);

      if (genTaxInfo.isComprehensiveTaxTriggered && firstComprehensiveTaxYear === null) {
        firstComprehensiveTaxYear = y;
      }

      const generalCapitalGain = generalAvgBase * priceGrowthDec;
      generalAsset =
        generalAsset +
        annualContrib +
        generalCapitalGain +
        (reinvestDividends === 1 ? genTaxInfo.netAnnualDividend : 0);

      // 2) 절세 계좌 (ISA/연금저축/IRP 과세이연 운용: 운용 중 배당세 0% 전액 재투자, 수령 시 5.5% 분리과세)
      const deferredAvgBase = taxDeferredAsset + annualContrib * 0.5;
      const deferredGrossDiv = deferredAvgBase * currentYield;
      const deferredPayoutTax = deferredGrossDiv * PENSION_LOW_TAX_RATE;
      const deferredNetDiv = deferredGrossDiv - deferredPayoutTax;

      const deferredCapitalGain = deferredAvgBase * priceGrowthDec;
      // 절세 계좌는 과세이연 덕분에 재투자 시 세전 배당금(deferredGrossDiv) 전체가 재투자됨!
      taxDeferredAsset =
        taxDeferredAsset +
        annualContrib +
        deferredCapitalGain +
        (reinvestDividends === 1 ? deferredGrossDiv : 0);

      const annualTaxDiff = Math.max(0, genTaxInfo.totalTaxAndIns - deferredPayoutTax);
      cumulativeTaxSaved += annualTaxDiff;

      const genMonthlyNetDiv = Math.round(genTaxInfo.netAnnualDividend / 12);
      const defMonthlyNetDiv = Math.round(deferredNetDiv / 12);

      // 투자 원금 대비 배당률 (Yield on Cost)
      const yieldOnCostPct = cumPrincipal > 0 ? (generalGrossDiv / cumPrincipal) * 100 : 0;

      labels.push(`${y}년차`);
      principalSeries.push(Math.round(cumPrincipal));
      generalAccountAssetSeries.push(Math.round(generalAsset));
      taxDeferredAssetSeries.push(Math.round(taxDeferredAsset));
      generalMonthlyNetDivSeries.push(genMonthlyNetDiv);
      taxDeferredMonthlyNetDivSeries.push(defMonthlyNetDiv);

      yearlyTable.push({
        year: y,
        principal: Math.round(cumPrincipal),
        generalAsset: Math.round(generalAsset),
        taxDeferredAsset: Math.round(taxDeferredAsset),
        annualGrossDividend: Math.round(generalGrossDiv),
        generalTaxAndIns: Math.round(genTaxInfo.totalTaxAndIns),
        generalMonthlyNetDiv: genMonthlyNetDiv,
        taxDeferredMonthlyNetDiv: defMonthlyNetDiv,
        yieldOnCostPct,
        isComprehensiveTaxTriggered: genTaxInfo.isComprehensiveTaxTriggered,
      });
    }

    const finalYearRow = yearlyTable[yearlyTable.length - 1];
    const assetAdvantageByTaxDeferred = finalYearRow.taxDeferredAsset - finalYearRow.generalAsset;

    return {
      inputs,
      summary: {
        finalPrincipal: finalYearRow.principal,
        finalGeneralAsset: finalYearRow.generalAsset,
        finalTaxDeferredAsset: finalYearRow.taxDeferredAsset,
        assetAdvantageByTaxDeferred,
        finalAnnualGrossDiv: finalYearRow.annualGrossDividend,
        finalGeneralMonthlyNetDiv: finalYearRow.generalMonthlyNetDiv,
        finalTaxDeferredMonthlyNetDiv: finalYearRow.taxDeferredMonthlyNetDiv,
        finalGeneralAnnualTax: finalYearRow.generalTaxAndIns,
        finalYieldOnCostPct: finalYearRow.yieldOnCostPct,
        firstComprehensiveTaxYear,
        cumulativeTaxSaved: Math.round(cumulativeTaxSaved),
      },
      chartData: {
        labels,
        principalSeries,
        generalAccountAssetSeries,
        taxDeferredAssetSeries,
        generalMonthlyNetDivSeries,
        taxDeferredMonthlyNetDivSeries,
      },
      yearlyTable,
    };
  }

  const exportsObj = {
    TAX_THRESHOLD_KRW,
    DEFAULT_DIVIDEND_INPUTS,
    sanitizeDividendInputs,
    calculateGeneralAccountTax,
    calculateDividendSimulation,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.DividendLogic = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
