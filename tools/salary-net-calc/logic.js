/**
 * ==========================================================================
 * SimuLab - 월급 실수령액 & 세후 연봉 계산기 로직 엔진
 * 파일 경로: tools/salary-net-calc/logic.js
 * --------------------------------------------------------------------------
 * [2026년 최신 4대보험 요율 및 근로소득세 기준]
 * 1. 국민연금: 4.5% (기준소득월액 상한액 약 617만원)
 * 2. 건강보험: 3.545%
 * 3. 장기요양보험: 건강보험료의 12.95% (실질 약 0.459%)
 * 4. 고용보험: 0.9%
 * 5. 비과세 식대: 월 최대 20만원 한도 적용
 * 6. 소득세: 국세청 근로소득 간이세액표 근사 다단계 누진공제 + 지방소득세 10%
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const SalaryLogic = {};

  // 2026년 법정 4대보험 요율 상수
  SalaryLogic.RATES = {
    nationalPension: 0.045,            // 국민연금 4.5%
    pensionMaxSalary: 6170000,          // 국민연금 상한 기준소득월액
    pensionMinSalary: 390000,           // 국민연금 하한 기준소득월액
    healthInsurance: 0.03545,          // 건강보험 3.545%
    longTermCareRate: 0.1295,          // 장기요양보험 (건보료의 12.95%)
    employmentInsurance: 0.009,        // 고용보험 0.9%
    taxFreeMealsLimit: 200000          // 비과세 식대 기본 한도 월 20만원
  };

  /**
   * 근로소득 간이세액 추정 함수
   * 과세표준(과세소득 - 기본공제)에 따른 간이 소득세 산출
   */
  SalaryLogic.estimateIncomeTax = function (taxableSalary, dependents = 1, childrenUnder20 = 0) {
    if (taxableSalary <= 1060000) return 0; // 최저 면세점 구간

    // 간이세액표 추정 구간 산출
    const yearlyTaxable = taxableSalary * 12;

    // 근로소득공제
    let earnedIncomeDeduction = 0;
    if (yearlyTaxable <= 5000000) {
      earnedIncomeDeduction = yearlyTaxable * 0.7;
    } else if (yearlyTaxable <= 15000000) {
      earnedIncomeDeduction = 3500000 + (yearlyTaxable - 5000000) * 0.4;
    } else if (yearlyTaxable <= 45000000) {
      earnedIncomeDeduction = 7500000 + (yearlyTaxable - 15000000) * 0.15;
    } else if (yearlyTaxable <= 100000000) {
      earnedIncomeDeduction = 12000000 + (yearlyTaxable - 45000000) * 0.05;
    } else {
      earnedIncomeDeduction = 14750000 + (yearlyTaxable - 100000000) * 0.02;
    }

    // 인적공제 (1인당 150만원 + 7세 이상 20세 이하 자녀 15만/인)
    const personDeduction = dependents * 1500000 + childrenUnder20 * 150000;

    // 과세표준 추정
    const taxBase = Math.max(0, yearlyTaxable - earnedIncomeDeduction - personDeduction);

    // 기본 소득세율 산출
    let annualTax = 0;
    if (taxBase <= 14000000) {
      annualTax = taxBase * 0.06;
    } else if (taxBase <= 50000000) {
      annualTax = 840000 + (taxBase - 14000000) * 0.15;
    } else if (taxBase <= 88000000) {
      annualTax = 6240000 + (taxBase - 50000000) * 0.24;
    } else if (taxBase <= 150000000) {
      annualTax = 15360000 + (taxBase - 88000000) * 0.35;
    } else if (taxBase <= 300000000) {
      annualTax = 37060000 + (taxBase - 150000000) * 0.38;
    } else {
      annualTax = 94060000 + (taxBase - 300000000) * 0.40;
    }

    // 근로소득 세액공제 (최대 55% / 한도 적용)
    let taxCredit = 0;
    if (annualTax <= 1300000) {
      taxCredit = annualTax * 0.55;
    } else {
      taxCredit = 715000 + (annualTax - 1300000) * 0.30;
    }
    taxCredit = Math.min(taxCredit, 740000);

    const calculatedAnnualTax = Math.max(0, annualTax - taxCredit);
    const monthlyIncomeTax = Math.floor(calculatedAnnualTax / 12 / 10) * 10; // 10원 단위 절사

    return monthlyIncomeTax;
  };

  /**
   * 월급 및 연봉 실수령액 계산
   */
  SalaryLogic.calculate = function (params) {
    const {
      inputMode = 'salary',       // 'salary'(월급) 또는 'annual'(연봉)
      inputValue = 3500000,       // 입력 금액
      taxFreeMeal = 200000,       // 비과세 식대
      dependents = 1,             // 본인 포함 부양가족 수
      childrenUnder20 = 0         // 20세 이하 자녀 수
    } = params;

    let monthlyGross = 0;
    let annualGross = 0;

    if (inputMode === 'annual') {
      annualGross = Number(inputValue) || 0;
      monthlyGross = Math.round(annualGross / 12);
    } else {
      monthlyGross = Number(inputValue) || 0;
      annualGross = monthlyGross * 12;
    }

    const nonTaxable = Math.min(monthlyGross, Math.max(0, Number(taxFreeMeal) || 0));
    const taxableSalary = Math.max(0, monthlyGross - nonTaxable);

    // 1. 국민연금 (상·하한선 적용)
    const pensionBase = Math.min(
      SalaryLogic.RATES.pensionMaxSalary,
      Math.max(SalaryLogic.RATES.pensionMinSalary, taxableSalary)
    );
    const nationalPension = Math.floor((pensionBase * SalaryLogic.RATES.nationalPension) / 10) * 10;

    // 2. 건강보험
    const healthInsurance = Math.floor((taxableSalary * SalaryLogic.RATES.healthInsurance) / 10) * 10;

    // 3. 장기요양보험 (건보료의 12.95%)
    const longTermCare = Math.floor((healthInsurance * SalaryLogic.RATES.longTermCareRate) / 10) * 10;

    // 4. 고용보험 (0.9%)
    const employmentInsurance = Math.floor((taxableSalary * SalaryLogic.RATES.employmentInsurance) / 10) * 10;

    // 4대보험 합계
    const totalInsurance = nationalPension + healthInsurance + longTermCare + employmentInsurance;

    // 5. 소득세 및 지방소득세
    const incomeTax = SalaryLogic.estimateIncomeTax(taxableSalary, dependents, childrenUnder20);
    const localIncomeTax = Math.floor((incomeTax * 0.1) / 10) * 10;
    const totalTax = incomeTax + localIncomeTax;

    // 총 공제액
    const totalDeductions = totalInsurance + totalTax;

    // 월 실수령액
    const monthlyNetSalary = Math.max(0, monthlyGross - totalDeductions);
    // 연간 실수령액
    const annualNetSalary = monthlyNetSalary * 12;

    // 공제율 (%)
    const deductionRate = monthlyGross > 0 ? (totalDeductions / monthlyGross) * 100 : 0;

    return {
      monthlyGross,
      annualGross,
      nonTaxable,
      taxableSalary,
      nationalPension,
      healthInsurance,
      longTermCare,
      employmentInsurance,
      totalInsurance,
      incomeTax,
      localIncomeTax,
      totalTax,
      totalDeductions,
      monthlyNetSalary,
      annualNetSalary,
      deductionRate: Math.round(deductionRate * 10) / 10
    };
  };

  global.SalaryLogic = SalaryLogic;
})(typeof window !== 'undefined' ? window : globalThis);
