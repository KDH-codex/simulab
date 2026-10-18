/**
 * ==========================================================================
 * [도구 7] 부동산 양도소득세(12억 비과세·장특공제) & 세후 매도 순수익 계산기 - 순수 계산 모듈
 * 파일 경로: tools/capital-gains-tax-sim/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 아파트를 매도하거나 상급지로 갈아탈 때 가장 큰 비용인 '양도소득세 + 지방소득세(10%)'를
 *   대한민국 소득세법(제89조 1세대1주택 12억 비과세, 제95조 장기보유특별공제, 제104조 누진세율)에
 *   맞춰 정밀하게 계산하고, 실제 통장에 남는 '세후 매도 순수익'을 산출합니다.
 * - 특히 단독명의 vs 부부 5:5 공동명의 시 과세표준 분산으로 인한 절세 금액과,
 *   보유·거주 기간(1~15년)에 따른 세금 변화 궤적을 시계열로 제공합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const EXEMPT_THRESHOLD_KRW = 1200000000; // 소득세법 제89조 1세대 1주택 고가주택 비과세 기준 (실거래가 12억원)
  const BASIC_DEDUCTION_PER_PERSON = 2500000; // 양도소득 기본공제 (연 1인당 250만원)

  const DEFAULT_CGT_INPUTS = {
    purchasePrice: 800000000,       // 취득가액 (매수가: 8억원)
    salePrice: 1500000000,          // 양도가액 (매도가: 15억원)
    necessaryExpenses: 35000000,    // 필요경비 (취득세·중개보수·샷시/보일러 등 자본적지출: 3,500만원)
    holdingYears: 6,                // 보유 기간 (6년)
    residenceYears: 4,              // 실거주 기간 (4년)
    taxCategory: 'one_house_exempt',// 'one_house_exempt' (1세대1주택 비과세 요건 충족) | 'general_tax' (일반과세/다주택 기본세율)
    jointOwners: 1,                 // 명의자 수 (1: 단독명의, 2: 부부 5:5 공동명의)
  };

  /**
   * 2023년~현재 소득세법 제55조·제104조 양도소득세 8단계 기본 누진세율표
   * (과세표준 구간 및 누진공제액)
   */
  const PROGRESSIVE_TAX_BRACKETS = [
    { upTo: 14000000, rate: 0.06, deduction: 0 },
    { upTo: 50000000, rate: 0.15, deduction: 1260000 },
    { upTo: 88000000, rate: 0.24, deduction: 5760000 },
    { upTo: 150000000, rate: 0.35, deduction: 15440000 },
    { upTo: 300000000, rate: 0.38, deduction: 19940000 },
    { upTo: 500000000, rate: 0.40, deduction: 25940000 },
    { upTo: 1000000000, rate: 0.42, deduction: 35940000 },
    { upTo: Infinity, rate: 0.45, deduction: 65940000 },
  ];

  function sanitizeCgtInputs(rawInputs = {}) {
    const safeNum = (val, min, max, fallback) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(Math.max(n, min), max);
    };

    const holdingYears = Math.round(safeNum(rawInputs.holdingYears, 1, 20, DEFAULT_CGT_INPUTS.holdingYears));
    const rawRes = Math.round(safeNum(rawInputs.residenceYears, 0, 20, DEFAULT_CGT_INPUTS.residenceYears));
    const residenceYears = Math.min(holdingYears, rawRes);

    const taxCategory =
      rawInputs.taxCategory === 'general_tax' ? 'general_tax' : 'one_house_exempt';
    const jointOwners = Number(rawInputs.jointOwners) === 2 ? 2 : 1;

    return {
      purchasePrice: safeNum(rawInputs.purchasePrice, 50000000, 20000000000, DEFAULT_CGT_INPUTS.purchasePrice),
      salePrice: safeNum(rawInputs.salePrice, 50000000, 30000000000, DEFAULT_CGT_INPUTS.salePrice),
      necessaryExpenses: safeNum(rawInputs.necessaryExpenses, 0, 5000000000, DEFAULT_CGT_INPUTS.necessaryExpenses),
      holdingYears,
      residenceYears,
      taxCategory,
      jointOwners,
    };
  }

  /**
   * 보유기간·거주기간 및 과세유형에 따른 장기보유특별공제율(%)을 계산합니다.
   * - 1세대 1주택 (표2): 3년 이상 보유 시 연 4%(최대 40%) + 2년 이상 거주 시 연 4%(최대 40%) = 합산 최대 80%
   * - 일반 과세 (표1): 3년 이상 보유 시 연 2%씩 증가하여 15년 이상 최대 30%
   */
  function getLongTermDeductionRatePct(holdingYears, residenceYears, taxCategory) {
    if (holdingYears < 3) return 0;

    if (taxCategory === 'one_house_exempt') {
      const holdingRate = Math.min(40, Math.floor(holdingYears) * 4);
      const residenceRate = residenceYears >= 2 ? Math.min(40, Math.floor(residenceYears) * 4) : 0;
      return Math.min(80, holdingRate + residenceRate);
    }

    // 일반 장기보유특별공제 (연 2%, 최대 30%)
    return Math.min(30, Math.floor(holdingYears) * 2);
  }

  /**
   * 1인당 과세표준에 대해 누진세율(또는 단기보유 단일세율)을 적용해 산출세액을 계산합니다.
   */
  function computeIncomeTaxForPerPersonBase(taxBasePerPerson, holdingYears, taxCategory) {
    if (taxBasePerPerson <= 0) {
      return { taxAmount: 0, appliedBracketRatePct: 0 };
    }

    // 일반과세이면서 2년 미만 단기 보유인 경우 단기 양도세율(1년 미만 70%, 1~2년 미만 60%) 비교 적용
    if (taxCategory === 'general_tax' && holdingYears < 2) {
      const shortRate = holdingYears < 1 ? 0.70 : 0.60;
      return {
        taxAmount: taxBasePerPerson * shortRate,
        appliedBracketRatePct: shortRate * 100,
      };
    }

    for (const bracket of PROGRESSIVE_TAX_BRACKETS) {
      if (taxBasePerPerson <= bracket.upTo) {
        return {
          taxAmount: Math.max(0, taxBasePerPerson * bracket.rate - bracket.deduction),
          appliedBracketRatePct: bracket.rate * 100,
        };
      }
    }

    return { taxAmount: 0, appliedBracketRatePct: 0 };
  }

  /**
   * 특정 보유·거주 연차 및 명의자 수 조건에서 양도소득세·지방소득세 및 세후 순수익을 계산합니다.
   */
  function computeTaxDetail({
    purchasePrice,
    salePrice,
    necessaryExpenses,
    holdingYears,
    residenceYears,
    taxCategory,
    jointOwners,
  }) {
    const grossCapitalGain = salePrice - purchasePrice - necessaryExpenses;

    // 양도차익이 없거나 손실인 경우 세금 0원
    if (grossCapitalGain <= 0) {
      return {
        grossCapitalGain,
        taxableCapitalGain: 0,
        exemptRatioPct: 100,
        longTermRatePct: 0,
        longTermDeductionAmount: 0,
        capitalGainIncome: 0,
        totalBasicDeduction: 0,
        totalTaxBase: 0,
        appliedBracketRatePct: 0,
        nationalIncomeTax: 0,
        localIncomeTax: 0,
        totalTaxPayable: 0,
        netAfterTaxProfit: grossCapitalGain,
        netCashProceeds: salePrice - necessaryExpenses,
      };
    }

    // 1세대 1주택 비과세 요건 충족 시: 매도가 12억원 이하 전액 비과세, 12억원 초과 시 초과 비율만 과세
    let taxableRatio = 1.0;
    if (taxCategory === 'one_house_exempt') {
      if (salePrice <= EXEMPT_THRESHOLD_KRW) {
        taxableRatio = 0;
      } else {
        taxableRatio = (salePrice - EXEMPT_THRESHOLD_KRW) / salePrice;
      }
    }

    const taxableCapitalGain = grossCapitalGain * taxableRatio;
    const exemptRatioPct = (1 - taxableRatio) * 100;

    if (taxableCapitalGain <= 0) {
      return {
        grossCapitalGain,
        taxableCapitalGain: 0,
        exemptRatioPct: 100,
        longTermRatePct: getLongTermDeductionRatePct(holdingYears, residenceYears, taxCategory),
        longTermDeductionAmount: 0,
        capitalGainIncome: 0,
        totalBasicDeduction: 0,
        totalTaxBase: 0,
        appliedBracketRatePct: 0,
        nationalIncomeTax: 0,
        localIncomeTax: 0,
        totalTaxPayable: 0,
        netAfterTaxProfit: grossCapitalGain,
        netCashProceeds: salePrice - necessaryExpenses,
      };
    }

    // 장기보유특별공제 계산
    const longTermRatePct = getLongTermDeductionRatePct(holdingYears, residenceYears, taxCategory);
    const longTermDeductionAmount = taxableCapitalGain * (longTermRatePct / 100);
    const capitalGainIncome = Math.max(0, taxableCapitalGain - longTermDeductionAmount);

    // 공동명의(jointOwners = 1 또는 2) 지분 분할 계산
    const incomePerPerson = capitalGainIncome / jointOwners;
    const taxBasePerPerson = Math.max(0, incomePerPerson - BASIC_DEDUCTION_PER_PERSON);
    const totalTaxBase = taxBasePerPerson * jointOwners;
    const totalBasicDeduction = Math.min(capitalGainIncome, BASIC_DEDUCTION_PER_PERSON * jointOwners);

    const { taxAmount: taxPerPerson, appliedBracketRatePct } = computeIncomeTaxForPerPersonBase(
      taxBasePerPerson,
      holdingYears,
      taxCategory
    );

    const nationalIncomeTax = Math.round(taxPerPerson * jointOwners);
    const localIncomeTax = Math.round(nationalIncomeTax * 0.1); // 지방소득세 10%
    const totalTaxPayable = nationalIncomeTax + localIncomeTax;

    const netAfterTaxProfit = Math.round(grossCapitalGain - totalTaxPayable);
    const netCashProceeds = Math.round(salePrice - necessaryExpenses - totalTaxPayable);

    return {
      grossCapitalGain: Math.round(grossCapitalGain),
      taxableCapitalGain: Math.round(taxableCapitalGain),
      exemptRatioPct,
      longTermRatePct,
      longTermDeductionAmount: Math.round(longTermDeductionAmount),
      capitalGainIncome: Math.round(capitalGainIncome),
      totalBasicDeduction: Math.round(totalBasicDeduction),
      totalTaxBase: Math.round(totalTaxBase),
      appliedBracketRatePct,
      nationalIncomeTax,
      localIncomeTax,
      totalTaxPayable,
      netAfterTaxProfit,
      netCashProceeds,
    };
  }

  /**
   * 현재 조건의 양도세 상세 내역 + 단독명의 vs 부부 공동명의 비교 + 보유기간별(1~15년) 시계열 데이터를 반환합니다.
   */
  function calculateCapitalGainsSimulation(rawInputs) {
    const inputs = sanitizeCgtInputs(rawInputs);

    // 1) 현재 설정 기준 결과
    const currentDetail = computeTaxDetail(inputs);

    // 2) 단독명의(1인) vs 부부 5:5 공동명의(2인) 세금 비교
    const singleOwnerDetail = computeTaxDetail({ ...inputs, jointOwners: 1 });
    const jointOwnerDetail = computeTaxDetail({ ...inputs, jointOwners: 2 });
    const jointOwnershipTaxSaved = Math.max(
      0,
      singleOwnerDetail.totalTaxPayable - jointOwnerDetail.totalTaxPayable
    );

    // 3) 보유·거주 연차(1년~15년) 변화에 따른 세금 및 세후 순수익 시계열 생성
    const labels = [];
    const taxSeries = [];
    const netProfitSeries = [];
    const holdingTable = [];

    // 거주 비율 유지 또는 현재 거주기간 비례 증가 가정
    const resGap = Math.max(0, inputs.holdingYears - inputs.residenceYears);

    for (let h = 1; h <= 15; h++) {
      const simulatedRes = Math.max(0, h - resGap);
      const detailAtYear = computeTaxDetail({
        ...inputs,
        holdingYears: h,
        residenceYears: simulatedRes,
      });

      labels.push(`${h}년 보유`);
      taxSeries.push(detailAtYear.totalTaxPayable);
      netProfitSeries.push(detailAtYear.netAfterTaxProfit);

      const effectiveTaxRatePct =
        detailAtYear.grossCapitalGain > 0
          ? (detailAtYear.totalTaxPayable / detailAtYear.grossCapitalGain) * 100
          : 0;

      holdingTable.push({
        holdingYears: h,
        residenceYears: simulatedRes,
        longTermRatePct: detailAtYear.longTermRatePct,
        totalTaxBase: detailAtYear.totalTaxBase,
        totalTaxPayable: detailAtYear.totalTaxPayable,
        netAfterTaxProfit: detailAtYear.netAfterTaxProfit,
        effectiveTaxRatePct,
      });
    }

    const totalInvestedCost = inputs.purchasePrice + inputs.necessaryExpenses;
    const afterTaxRoiPct =
      totalInvestedCost > 0 ? (currentDetail.netAfterTaxProfit / totalInvestedCost) * 100 : 0;
    const effectiveTaxRateOnGainPct =
      currentDetail.grossCapitalGain > 0
        ? (currentDetail.totalTaxPayable / currentDetail.grossCapitalGain) * 100
        : 0;

    return {
      inputs,
      summary: {
        ...currentDetail,
        afterTaxRoiPct,
        effectiveTaxRateOnGainPct,
        singleOwnerTax: singleOwnerDetail.totalTaxPayable,
        jointOwnerTax: jointOwnerDetail.totalTaxPayable,
        jointOwnershipTaxSaved,
      },
      chartData: {
        labels,
        taxSeries,
        netProfitSeries,
      },
      holdingTable,
    };
  }

  const exportsObj = {
    EXEMPT_THRESHOLD_KRW,
    DEFAULT_CGT_INPUTS,
    sanitizeCgtInputs,
    calculateCapitalGainsSimulation,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.CapitalGainsLogic = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
