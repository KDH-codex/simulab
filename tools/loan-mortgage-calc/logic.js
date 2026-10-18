/**
 * ==========================================================================
 * [도구 2] 부동산·주택담보대출 상환(원리금균등·원금균등·만기일시) & LTV·DSR 한도 계산기
 * 파일 경로: tools/loan-mortgage-calc/logic.js
 * --------------------------------------------------------------------------
 * - 브라우저(file:// 직접 실행 포함)에서는 window.SimuLab.LoanLogic에 등록되고,
 *   Node.js 환경에서는 module.exports로 내보내지는 UMD 순수 함수 모듈입니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const MONTHS_PER_YEAR = 12;

  const DEFAULT_LOAN_INPUTS = {
    propertyPrice: 600000000,
    loanAmount: 350000000,
    annualInterestRate: 4.2,
    loanYears: 30,
    graceMonths: 0,
    repaymentType: 'equal_pi',
    annualIncome: 70000000,
    existingAnnualDebtService: 3000000,
    ltvLimitPct: 70,
    dsrLimitPct: 40,
    stressRatePct: 0.75,
  };

  function sanitizeLoanInputs(rawInputs = {}) {
    const safeNum = (val, min, max, fallback) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(Math.max(n, min), max);
    };

    const loanYears = Math.round(safeNum(rawInputs.loanYears, 1, 50, DEFAULT_LOAN_INPUTS.loanYears));
    const totalMonths = loanYears * MONTHS_PER_YEAR;
    const maxGrace = Math.max(0, Math.min(120, totalMonths - 12));

    const validTypes = ['equal_pi', 'equal_principal', 'bullet'];
    const repaymentType = validTypes.includes(rawInputs.repaymentType)
      ? rawInputs.repaymentType
      : DEFAULT_LOAN_INPUTS.repaymentType;

    return {
      propertyPrice: safeNum(rawInputs.propertyPrice, 10000000, 20000000000, DEFAULT_LOAN_INPUTS.propertyPrice),
      loanAmount: safeNum(rawInputs.loanAmount, 1000000, 15000000000, DEFAULT_LOAN_INPUTS.loanAmount),
      annualInterestRate: safeNum(rawInputs.annualInterestRate, 0, 25, DEFAULT_LOAN_INPUTS.annualInterestRate),
      loanYears,
      graceMonths: Math.round(safeNum(rawInputs.graceMonths, 0, maxGrace, DEFAULT_LOAN_INPUTS.graceMonths)),
      repaymentType,
      annualIncome: safeNum(rawInputs.annualIncome, 10000000, 5000000000, DEFAULT_LOAN_INPUTS.annualIncome),
      existingAnnualDebtService: safeNum(
        rawInputs.existingAnnualDebtService,
        0,
        2000000000,
        DEFAULT_LOAN_INPUTS.existingAnnualDebtService
      ),
      ltvLimitPct: safeNum(rawInputs.ltvLimitPct, 30, 90, DEFAULT_LOAN_INPUTS.ltvLimitPct),
      dsrLimitPct: safeNum(rawInputs.dsrLimitPct, 30, 70, DEFAULT_LOAN_INPUTS.dsrLimitPct),
      stressRatePct: safeNum(rawInputs.stressRatePct, 0, 3.0, DEFAULT_LOAN_INPUTS.stressRatePct),
    };
  }

  function calculateRepaymentSchedule(principal, annualRatePct, loanYears, graceMonths, type) {
    const totalMonths = loanYears * MONTHS_PER_YEAR;
    const effectiveGrace = type === 'bullet' ? totalMonths - 1 : Math.min(graceMonths, totalMonths - 1);
    const amortMonths = Math.max(1, totalMonths - effectiveGrace);
    const monthlyRate = annualRatePct / 100 / MONTHS_PER_YEAR;

    let equalPiMonthlyPayment = 0;
    if (type === 'equal_pi') {
      if (monthlyRate === 0) {
        equalPiMonthlyPayment = principal / amortMonths;
      } else {
        const factor = Math.pow(1 + monthlyRate, amortMonths);
        equalPiMonthlyPayment = (principal * (monthlyRate * factor)) / (factor - 1);
      }
    }

    let remainingBalance = principal;
    let totalInterest = 0;
    let totalPayment = 0;

    const yearlySummaries = [];
    let yearPrincipalSum = 0;
    let yearInterestSum = 0;
    let yearPaymentSum = 0;

    let firstMonthAfterGracePayment = 0;
    let lastMonthPayment = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = 0;

      if (type === 'bullet') {
        principalPayment = m === totalMonths ? remainingBalance : 0;
      } else if (m <= effectiveGrace) {
        principalPayment = 0;
      } else if (type === 'equal_pi') {
        if (m === totalMonths) {
          principalPayment = remainingBalance;
        } else {
          principalPayment = Math.max(0, equalPiMonthlyPayment - interestPayment);
        }
      } else if (type === 'equal_principal') {
        if (m === totalMonths) {
          principalPayment = remainingBalance;
        } else {
          principalPayment = principal / amortMonths;
        }
      }

      const monthlyTotal = principalPayment + interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      totalInterest += interestPayment;
      totalPayment += monthlyTotal;

      if (m === effectiveGrace + 1) {
        firstMonthAfterGracePayment = monthlyTotal;
      }
      if (m === totalMonths) {
        lastMonthPayment = monthlyTotal;
      }

      yearPrincipalSum += principalPayment;
      yearInterestSum += interestPayment;
      yearPaymentSum += monthlyTotal;

      if (m % MONTHS_PER_YEAR === 0 || m === totalMonths) {
        const yearNum = Math.ceil(m / MONTHS_PER_YEAR);
        const monthsInThisYear = m % MONTHS_PER_YEAR === 0 ? 12 : m % MONTHS_PER_YEAR;
        yearlySummaries.push({
          year: yearNum,
          avgMonthlyPayment: Math.round(yearPaymentSum / monthsInThisYear),
          annualPrincipal: Math.round(yearPrincipalSum),
          annualInterest: Math.round(yearInterestSum),
          annualTotalPayment: Math.round(yearPaymentSum),
          remainingBalance: Math.round(remainingBalance),
          cumulativeInterest: Math.round(totalInterest),
        });
        yearPrincipalSum = 0;
        yearInterestSum = 0;
        yearPaymentSum = 0;
      }
    }

    return {
      type,
      principal: Math.round(principal),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      firstMonthPayment: Math.round(firstMonthAfterGracePayment),
      lastMonthPayment: Math.round(lastMonthPayment),
      graceMonthlyPayment: Math.round(principal * monthlyRate),
      avgAnnualDebtService: totalPayment / loanYears,
      yearlySummaries,
    };
  }

  function getAnnualDebtServicePerWon(annualRatePct, loanYears, graceMonths, type) {
    const unitSchedule = calculateRepaymentSchedule(100000000, annualRatePct, loanYears, graceMonths, type);
    return unitSchedule.avgAnnualDebtService / 100000000;
  }

  function calculateLoanSimulation(rawInputs) {
    const inputs = sanitizeLoanInputs(rawInputs);
    const {
      propertyPrice,
      loanAmount,
      annualInterestRate,
      loanYears,
      graceMonths,
      repaymentType,
      annualIncome,
      existingAnnualDebtService,
      ltvLimitPct,
      dsrLimitPct,
      stressRatePct,
    } = inputs;

    const scheduleEqualPi = calculateRepaymentSchedule(
      loanAmount,
      annualInterestRate,
      loanYears,
      graceMonths,
      'equal_pi'
    );
    const scheduleEqualPrincipal = calculateRepaymentSchedule(
      loanAmount,
      annualInterestRate,
      loanYears,
      graceMonths,
      'equal_principal'
    );
    const scheduleBullet = calculateRepaymentSchedule(
      loanAmount,
      annualInterestRate,
      loanYears,
      graceMonths,
      'bullet'
    );

    const selectedSchedule =
      repaymentType === 'equal_principal'
        ? scheduleEqualPrincipal
        : repaymentType === 'bullet'
        ? scheduleBullet
        : scheduleEqualPi;

    const interestSavedByEqualPrincipal =
      scheduleEqualPi.totalInterest - scheduleEqualPrincipal.totalInterest;

    const currentLtvPct = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;
    const maxLoanByLtv = Math.round(propertyPrice * (ltvLimitPct / 100));
    const isLtvPassed = loanAmount <= maxLoanByLtv;

    const stressedInterestRate = annualInterestRate + stressRatePct;
    const stressedSchedule = calculateRepaymentSchedule(
      loanAmount,
      stressedInterestRate,
      loanYears,
      graceMonths,
      repaymentType
    );

    const actualAnnualDebtService = selectedSchedule.avgAnnualDebtService + existingAnnualDebtService;
    const stressedAnnualDebtService = stressedSchedule.avgAnnualDebtService + existingAnnualDebtService;

    const currentDsrPct = annualIncome > 0 ? (actualAnnualDebtService / annualIncome) * 100 : 0;
    const stressedDsrPct = annualIncome > 0 ? (stressedAnnualDebtService / annualIncome) * 100 : 0;
    const isDsrPassed = stressedDsrPct <= dsrLimitPct + 1e-6;

    const maxAllowedNewDebtService = Math.max(
      0,
      annualIncome * (dsrLimitPct / 100) - existingAnnualDebtService
    );
    const debtServicePerWonStressed = getAnnualDebtServicePerWon(
      stressedInterestRate,
      loanYears,
      graceMonths,
      repaymentType
    );
    const maxLoanByDsr =
      debtServicePerWonStressed > 0
        ? Math.round(maxAllowedNewDebtService / debtServicePerWonStressed)
        : 0;

    const finalLegalLimit = Math.min(maxLoanByLtv, maxLoanByDsr);
    const isAllLegalLimitsPassed = isLtvPassed && isDsrPassed;

    const requiredOwnCash = Math.max(0, propertyPrice - loanAmount);
    const priceInEok = propertyPrice / 100000000;

    let acqTaxRatePct = 1.1;
    if (priceInEok > 9) {
      acqTaxRatePct = 3.3;
    } else if (priceInEok > 6) {
      const baseAcqRate = (priceInEok * 2) / 3 - 3;
      acqTaxRatePct = baseAcqRate * 1.1;
    }
    const estimatedAcquisitionTax = Math.round(propertyPrice * (acqTaxRatePct / 100));

    let brokerRatePct = 0.4;
    if (priceInEok >= 15) brokerRatePct = 0.7;
    else if (priceInEok >= 12) brokerRatePct = 0.6;
    else if (priceInEok >= 9) brokerRatePct = 0.5;
    else if (priceInEok < 2) brokerRatePct = 0.5;
    const estimatedBrokerFee = Math.round(propertyPrice * (brokerRatePct / 100));

    const totalInitialCashNeeded = requiredOwnCash + estimatedAcquisitionTax + estimatedBrokerFee;

    const labels = scheduleEqualPi.yearlySummaries.map((y) => `${y.year}년차`);
    const equalPiMonthlySeries = scheduleEqualPi.yearlySummaries.map((y) => y.avgMonthlyPayment);
    const equalPrincipalMonthlySeries = scheduleEqualPrincipal.yearlySummaries.map(
      (y) => y.avgMonthlyPayment
    );
    const remainingBalanceSeries = selectedSchedule.yearlySummaries.map((y) => y.remainingBalance);
    const cumulativeInterestSeries = selectedSchedule.yearlySummaries.map((y) => y.cumulativeInterest);

    return {
      inputs,
      summary: {
        repaymentType,
        firstMonthPayment: selectedSchedule.firstMonthPayment,
        lastMonthPayment: selectedSchedule.lastMonthPayment,
        totalInterest: selectedSchedule.totalInterest,
        totalPayment: selectedSchedule.totalPayment,
        interestSavedByEqualPrincipal,
        currentLtvPct,
        maxLoanByLtv,
        isLtvPassed,
        currentDsrPct,
        stressedDsrPct,
        maxLoanByDsr,
        isDsrPassed,
        finalLegalLimit,
        isAllLegalLimitsPassed,
        requiredOwnCash,
        acqTaxRatePct,
        estimatedAcquisitionTax,
        brokerRatePct,
        estimatedBrokerFee,
        totalInitialCashNeeded,
      },
      comparison: {
        equalPi: scheduleEqualPi,
        equalPrincipal: scheduleEqualPrincipal,
        bullet: scheduleBullet,
      },
      chartData: {
        labels,
        equalPiMonthlySeries,
        equalPrincipalMonthlySeries,
        remainingBalanceSeries,
        cumulativeInterestSeries,
      },
      yearlyTable: selectedSchedule.yearlySummaries,
    };
  }

  const exportsObj = {
    MONTHS_PER_YEAR,
    DEFAULT_LOAN_INPUTS,
    sanitizeLoanInputs,
    calculateRepaymentSchedule,
    calculateLoanSimulation,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.LoanLogic = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
