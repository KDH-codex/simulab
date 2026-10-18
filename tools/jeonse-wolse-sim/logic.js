/**
 * ==========================================================================
 * [도구 6] 전세 vs 월세(반전세) 전환율 & 주거 기회비용 비교 시뮬레이터 - 순수 계산 모듈
 * 파일 경로: tools/jeonse-wolse-sim/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 같은 아파트·오피스텔 매물을 두고 "전세자금대출을 받아 전세로 들어갈까,
 *   아니면 보증금을 낮추고 남은 목돈을 굴리면서 반전세/월세로 들어갈까?"를
 *   기회비용과 세액공제까지 반영해 1원 단위로 비교하는 부동산 금융 엔진입니다.
 * - 「주택임대차보호법」 제7조의2에 따른 법정 전월세 전환율 상한(한국은행 기준금리 + 2.0%)을
 *   자동 계산하여 집주인이 요구하는 월세가 법정 기준 대비 적정한지 판독합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const LEGAL_SPREAD_PCT = 2.0;          // 주택임대차보호법 시행령상 법정 전환율 가산금리 (+2.0%)
  const INTEREST_TAX_RATE = 0.154;       // 금융투자·예금 이자소득세율 (15.4%)
  const TAX_CREDIT_LIMIT_ANNUAL = 10000000; // 조세특례제한법상 월세 세액공제 대상 연간 월세 한도 (1,000만원)

  const DEFAULT_JEONSE_INPUTS = {
    ownCapital: 100000000,         // 현재 보유 자기자본 (1억원)
    jeonseDeposit: 350000000,      // 전세 보증금 (3억 5,000만원)
    jeonseLoanRate: 3.8,           // 전세자금대출 연 금리 (3.8%)
    wolseDeposit: 50000000,        // 월세(반전세) 보증금 (5,000만원)
    monthlyRent: 1100000,          // 월 임대료 (110만원)
    investmentReturnRate: 4.5,     // 여유자금(보증금 차액) 연 투자수익률 (세전 4.5%)
    bokBaseRate: 3.0,              // 한국은행 기준금리 (법정 전환율 산출용: 기본 3.0% -> 법정상한 5.0%)
    rentTaxCreditRate: 15,         // 월세 세액공제율 (0%: 미대상, 15%: 총급여 8천만원 이하, 17%: 5.5천만원 이하)
    residenceYears: 4,             // 거주 비교 기간 (4년 = 2+2년 계약갱신청구권 기준)
  };

  /**
   * 입력값을 안전한 범위로 보정합니다.
   */
  function sanitizeJeonseInputs(rawInputs = {}) {
    const safeNum = (val, min, max, fallback) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(Math.max(n, min), max);
    };

    const validTaxCredits = [0, 15, 17];
    const rawCredit = Number(rawInputs.rentTaxCreditRate);
    const rentTaxCreditRate = validTaxCredits.includes(rawCredit)
      ? rawCredit
      : DEFAULT_JEONSE_INPUTS.rentTaxCreditRate;

    return {
      ownCapital: safeNum(rawInputs.ownCapital, 0, 10000000000, DEFAULT_JEONSE_INPUTS.ownCapital),
      jeonseDeposit: safeNum(rawInputs.jeonseDeposit, 10000000, 10000000000, DEFAULT_JEONSE_INPUTS.jeonseDeposit),
      jeonseLoanRate: safeNum(rawInputs.jeonseLoanRate, 1.0, 15.0, DEFAULT_JEONSE_INPUTS.jeonseLoanRate),
      wolseDeposit: safeNum(rawInputs.wolseDeposit, 0, 10000000000, DEFAULT_JEONSE_INPUTS.wolseDeposit),
      monthlyRent: safeNum(rawInputs.monthlyRent, 0, 50000000, DEFAULT_JEONSE_INPUTS.monthlyRent),
      investmentReturnRate: safeNum(rawInputs.investmentReturnRate, 0.0, 25.0, DEFAULT_JEONSE_INPUTS.investmentReturnRate),
      bokBaseRate: safeNum(rawInputs.bokBaseRate, 0.5, 10.0, DEFAULT_JEONSE_INPUTS.bokBaseRate),
      rentTaxCreditRate,
      residenceYears: Math.round(safeNum(rawInputs.residenceYears, 1, 10, DEFAULT_JEONSE_INPUTS.residenceYears)),
    };
  }

  /**
   * 전세 vs 월세(반전세) 전환율, 월 실질 주거비, 거주 기간 종료 후 순자산 격차를 계산합니다.
   */
  function calculateJeonseWolseSimulation(rawInputs) {
    const inputs = sanitizeJeonseInputs(rawInputs);
    const {
      ownCapital,
      jeonseDeposit,
      jeonseLoanRate,
      wolseDeposit,
      monthlyRent,
      investmentReturnRate,
      bokBaseRate,
      rentTaxCreditRate,
      residenceYears,
    } = inputs;

    // 1) 전월세 전환율 및 법정 상한(한국은행 기준금리 + 2.0%) 계산
    const depositDiff = Math.max(0, jeonseDeposit - wolseDeposit);
    const annualRent = monthlyRent * 12;
    const marketConversionRatePct = depositDiff > 0 ? (annualRent / depositDiff) * 100 : 0;
    const legalCapRatePct = bokBaseRate + LEGAL_SPREAD_PCT;
    const legalAppropriateMonthlyRent = Math.round((depositDiff * (legalCapRatePct / 100)) / 12);
    const isOverLegalCap = depositDiff > 0 && marketConversionRatePct > legalCapRatePct + 0.001;

    // 세후 연간 투자수익률 (이자·배당소득세 15.4% 반영)
    const netAnnualInvestRate = (investmentReturnRate / 100) * (1 - INTEREST_TAX_RATE);
    const monthlyInvestRate = netAnnualInvestRate / 12;
    const loanAnnualRate = jeonseLoanRate / 100;

    // 2) [옵션 A: 전세 선택 시] 대출금, 잔여 투자원금, 월 이자비용
    const jeonseLoanNeeded = Math.max(0, jeonseDeposit - ownCapital);
    const jeonseLeftoverInvestable = Math.max(0, ownCapital - jeonseDeposit);
    const jeonseMonthlyLoanInterest = (jeonseLoanNeeded * loanAnnualRate) / 12;
    const jeonseMonthlyInvestIncome = jeonseLeftoverInvestable * monthlyInvestRate;
    // 전세의 월 순지출(Net Monthly Outflow) = 전세대출이자 - 남은 목돈 투자수익
    const jeonseNetMonthlyCost = jeonseMonthlyLoanInterest - jeonseMonthlyInvestIncome;

    // 3) [옵션 B: 월세(반전세) 선택 시] 대출금, 잔여 투자원금, 세액공제 반영 월 순지출
    const wolseLoanNeeded = Math.max(0, wolseDeposit - ownCapital);
    const wolseLeftoverInvestable = Math.max(0, ownCapital - wolseDeposit);
    const wolseMonthlyLoanInterest = (wolseLoanNeeded * loanAnnualRate) / 12;
    const wolseMonthlyInvestIncome = wolseLeftoverInvestable * monthlyInvestRate;

    // 조세특례제한법상 월세 세액공제 (연 1,000만원 한도 내 15% 또는 17%)
    const eligibleAnnualRent = Math.min(annualRent, TAX_CREDIT_LIMIT_ANNUAL);
    const annualRentTaxCredit = eligibleAnnualRent * (rentTaxCreditRate / 100);
    const monthlyRentTaxCredit = annualRentTaxCredit / 12;

    // 월세의 월 순지출(Net Monthly Outflow) = 월세 + 보증금대출이자 - 월세세액공제 - 남은 목돈 투자수익
    const wolseNetMonthlyCost =
      monthlyRent + wolseMonthlyLoanInterest - monthlyRentTaxCredit - wolseMonthlyInvestIncome;

    // 4) 거주 기간(1~N년) 동안의 누적 순자산(Net Worth) 시계열 비교
    // 동일 조건 비교를 위해, 두 선택지 중 월 지출(대출이자+월세-세액공제)이 더 적은 쪽이
    // 매월 아낀 현금흐름 차액을 세후 투자수익률(monthlyInvestRate)로 복리 적립한다고 가정하여 순자산 계산
    const jeonseCashOutflowMonthly = jeonseMonthlyLoanInterest;
    const wolseCashOutflowMonthly = monthlyRent + wolseMonthlyLoanInterest - monthlyRentTaxCredit;

    const totalMonths = residenceYears * 12;
    let jeonseInvestPool = jeonseLeftoverInvestable;
    let wolseInvestPool = wolseLeftoverInvestable;

    const labels = ['입주 시점'];
    const jeonseNetWorthSeries = [Math.round(ownCapital)];
    const wolseNetWorthSeries = [Math.round(ownCapital)];
    const yearlyTable = [];

    for (let m = 1; m <= totalMonths; m++) {
      // 기존 여유자금 복리 증식
      jeonseInvestPool *= 1 + monthlyInvestRate;
      wolseInvestPool *= 1 + monthlyInvestRate;

      // 상대방 대비 매월 덜 쓴 주거비(절약액)를 자신의 투자풀에 적립
      if (jeonseCashOutflowMonthly < wolseCashOutflowMonthly) {
        jeonseInvestPool += wolseCashOutflowMonthly - jeonseCashOutflowMonthly;
      } else {
        wolseInvestPool += jeonseCashOutflowMonthly - wolseCashOutflowMonthly;
      }

      if (m % 12 === 0) {
        const y = m / 12;
        // 순자산 = (보증금 - 대출금) + 투자풀 잔액
        const jeonseNetWorth = Math.round((jeonseDeposit - jeonseLoanNeeded) + jeonseInvestPool);
        const wolseNetWorth = Math.round((wolseDeposit - wolseLoanNeeded) + wolseInvestPool);

        labels.push(`${y}년 후`);
        jeonseNetWorthSeries.push(jeonseNetWorth);
        wolseNetWorthSeries.push(wolseNetWorth);

        yearlyTable.push({
          year: y,
          jeonseCumulativeOutflow: Math.round(jeonseCashOutflowMonthly * m),
          wolseCumulativeOutflow: Math.round(wolseCashOutflowMonthly * m),
          jeonseNetWorth,
          wolseNetWorth,
          netWorthDiff: jeonseNetWorth - wolseNetWorth, // 양수면 전세 유리, 음수면 월세 유리
        });
      }
    }

    const finalRow = yearlyTable[yearlyTable.length - 1];
    const winner = finalRow.netWorthDiff >= 0 ? 'JEONSE' : 'WOLSE';
    const winnerAdvantageAmount = Math.abs(finalRow.netWorthDiff);

    // 손익분기 전월세 전환율 (세입자 입장에서 전세와 월세의 유불리가 같아지는 전환율)
    // 전세대출 비중과 여유자금 세후수익률의 가중평균
    const loanRatioInDiff = depositDiff > 0 ? Math.min(1, jeonseLoanNeeded / depositDiff) : 0;
    const breakEvenConversionRatePct =
      (loanRatioInDiff * (jeonseLoanRate / 100) + (1 - loanRatioInDiff) * netAnnualInvestRate) /
      Math.max(0.5, 1 - (rentTaxCreditRate / 100) * (eligibleAnnualRent / Math.max(1, annualRent))) *
      100;

    return {
      inputs,
      summary: {
        depositDiff,
        marketConversionRatePct,
        legalCapRatePct,
        legalAppropriateMonthlyRent,
        isOverLegalCap,
        breakEvenConversionRatePct,
        jeonseLoanNeeded,
        jeonseMonthlyLoanInterest: Math.round(jeonseMonthlyLoanInterest),
        jeonseNetMonthlyCost: Math.round(jeonseNetMonthlyCost),
        wolseLeftoverInvestable,
        monthlyRentTaxCredit: Math.round(monthlyRentTaxCredit),
        wolseNetMonthlyCost: Math.round(wolseNetMonthlyCost),
        monthlyCostDiff: Math.round(wolseNetMonthlyCost - jeonseNetMonthlyCost),
        finalJeonseNetWorth: finalRow.jeonseNetWorth,
        finalWolseNetWorth: finalRow.wolseNetWorth,
        winner,
        winnerAdvantageAmount,
      },
      chartData: {
        labels,
        jeonseNetWorthSeries,
        wolseNetWorthSeries,
      },
      yearlyTable,
    };
  }

  const exportsObj = {
    DEFAULT_JEONSE_INPUTS,
    sanitizeJeonseInputs,
    calculateJeonseWolseSimulation,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.JeonseLogic = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
