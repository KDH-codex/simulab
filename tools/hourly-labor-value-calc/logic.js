/**
 * ==========================================================================
 * SimuLab Analytics Hub - 시간당 실질 노동 가치 계산기 순수 연산 엔진
 * 파일 경로: tools/hourly-labor-value-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 로직 설명]
 * "명목 시급과 출퇴근·비용을 뺀 '진짜 시급'은 얼마나 다를까?"
 * 1) 명목 통상 시급:
 *    - 월 세전 급여 ÷ 209시간 (주 40시간 + 주휴수당 기준)
 * 2) 진짜 실질 시급 (Real Hourly Wage):
 *    - 세후 실수령액에서 출퇴근 교통비, 업무용 의류비, 점심값 등 '회사 다니기 위해 쓴 돈'을 뺍니다.
 *    - 그리고 근무시간뿐 아니라 '출퇴근 길바닥에 버린 시간'과 '야근 시간'까지 모두 합친 총 투입 시간으로 나눕니다.
 *    - 결과적으로 명목 시급 대비 30~50% 낮아진 내 진짜 시급을 마주하게 됩니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const DEFAULT_LABOR_INPUTS = {
    monthlySalary: 3500000,        // 월 세전 급여 (원)
    weeklyWorkHours: 40,           // 주당 계약 근로시간 (기본 40시간)
    commuteMinutesDaily: 90,       // 왕복 출퇴근 소요시간 (분/일)
    weeklyOvertimeHours: 4,        // 주당 평균 야근 및 출근준비 시간 (시간)
    monthlyJobExpenses: 450000,    // 직장 유지를 위한 필수 비용 (교통, 품위, 식비 등)
    targetItemName: '최신 스마트폰', // 환산하고 싶은 소비 품목
    targetItemPrice: 1500000,      // 소비 품목 가격 (원)
  };

  /**
   * 일상 대표 품목 리스트
   */
  const BENCHMARK_ITEMS = [
    { name: '아메리카노 커피 1잔', price: 4500 },
    { name: '점심 든든한 국밥 1그릇', price: 11000 },
    { name: '배달 치킨 + 음료 세트', price: 26000 },
    { name: '금요일 저녁 외식 & 음주', price: 80000 },
    { name: '최신 스마트폰 (자급제)', price: 1500000 },
    { name: '명품 브랜드 가방', price: 3500000 },
  ];

  /**
   * 4대 보험 및 근로소득세 간이 공제율 추정 (약 12~15%)
   */
  function estimateNetSalary(grossSalary) {
    if (grossSalary <= 1500000) return grossSalary * 0.94;
    if (grossSalary <= 3000000) return grossSalary * 0.90;
    if (grossSalary <= 5000000) return grossSalary * 0.86;
    if (grossSalary <= 8000000) return grossSalary * 0.82;
    return grossSalary * 0.77; // 고소득 누진세 반영
  }

  /**
   * 메인 계산 함수
   */
  function calculateHourlyLaborValue(userInputs = {}) {
    const inputs = { ...DEFAULT_LABOR_INPUTS, ...userInputs };

    const grossSalary = Math.max(500000, Number(inputs.monthlySalary) || 3500000);
    const contractHoursWeekly = Math.max(10, Math.min(80, Number(inputs.weeklyWorkHours) || 40));
    const commuteMinsDaily = Math.max(0, Math.min(360, Number(inputs.commuteMinutesDaily) || 0));
    const overtimeHoursWeekly = Math.max(0, Math.min(60, Number(inputs.weeklyOvertimeHours) || 0));
    const jobExpenses = Math.max(0, Number(inputs.monthlyJobExpenses) || 0);

    const targetItemName = String(inputs.targetItemName || '선택 품목').trim();
    const targetItemPrice = Math.max(100, Number(inputs.targetItemPrice) || 1500000);

    // 1) 급여 추정
    const netSalary = Math.round(estimateNetSalary(grossSalary));
    const realDisposableIncome = Math.max(0, netSalary - jobExpenses);

    // 2) 시간 계산 (월 4.345주 기준)
    const weeksPerMonth = 4.345;
    const weeklyCommuteHours = (commuteMinsDaily * 5) / 60; // 주 5일 기준
    const weeklyTotalDedicatedHours = contractHoursWeekly + weeklyCommuteHours + overtimeHoursWeekly;
    const monthlyTotalDedicatedHours = weeklyTotalDedicatedHours * weeksPerMonth;

    // 3) 시급 계산
    // 법정 기준 명목 시급 (주휴 포함 209시간 기준)
    const nominalHourlyWage = Math.round(grossSalary / 209);
    // 세후 계약 시급
    const netContractHourlyWage = Math.round(netSalary / (contractHoursWeekly * weeksPerMonth));
    // 진짜 실질 시급 (가처분 소득 / 총 투입 시간)
    const realHourlyWage = monthlyTotalDedicatedHours > 0
      ? Math.round(realDisposableIncome / monthlyTotalDedicatedHours)
      : nominalHourlyWage;

    // 4) 목표 품목 노동 시간 환산
    const targetHoursNeeded = realHourlyWage > 0 ? targetItemPrice / realHourlyWage : 0;
    const targetDaysNeeded = targetHoursNeeded / 8; // 1일 8시간 근무 기준
    const targetWeeksNeeded = targetDaysNeeded / 5; // 주 5일 근무 기준

    // 5) 일상 품목 환산 목록
    const benchmarkResults = BENCHMARK_ITEMS.map((item) => {
      const hours = realHourlyWage > 0 ? item.price / realHourlyWage : 0;
      let text = '';
      if (hours < 1) {
        text = `약 ${Math.round(hours * 60)}분 노동`;
      } else if (hours < 8) {
        text = `약 ${hours.toFixed(1)}시간 노동`;
      } else {
        const days = (hours / 8).toFixed(1);
        text = `약 ${days}일 (${hours.toFixed(0)}시간) 노동`;
      }
      return {
        name: item.name,
        price: item.price,
        hours: Math.round(hours * 10) / 10,
        text,
      };
    });

    return {
      inputs,
      summary: {
        grossSalary,
        netSalary,
        jobExpenses,
        realDisposableIncome,
        contractHoursWeekly,
        weeklyCommuteHours: Math.round(weeklyCommuteHours * 10) / 10,
        weeklyTotalDedicatedHours: Math.round(weeklyTotalDedicatedHours * 10) / 10,
        monthlyTotalDedicatedHours: Math.round(monthlyTotalDedicatedHours),
        nominalHourlyWage,
        netContractHourlyWage,
        realHourlyWage,
        wageDiscountPct: Math.round(((nominalHourlyWage - realHourlyWage) / nominalHourlyWage) * 100),
        targetItemName,
        targetItemPrice,
        targetHoursNeeded: Math.round(targetHoursNeeded * 10) / 10,
        targetDaysNeeded: Math.round(targetDaysNeeded * 10) / 10,
        targetWeeksNeeded: Math.round(targetWeeksNeeded * 10) / 10,
      },
      benchmarkResults,
    };
  }

  const exportsObj = {
    DEFAULT_LABOR_INPUTS,
    BENCHMARK_ITEMS,
    estimateNetSalary,
    calculateHourlyLaborValue,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.HourlyLaborValue = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
