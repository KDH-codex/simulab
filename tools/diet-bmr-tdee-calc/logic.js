/**
 * ==========================================================================
 * SimuLab Analytics Hub - 다이어트 BMR·TDEE 계산기 순수 연산 엔진
 * 파일 경로: tools/diet-bmr-tdee-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 BMR & TDEE 과학적 원리 설명]
 * 1) 기초대사량 (BMR, Basal Metabolic Rate):
 *    - 숨만 쉬어도 생명 유지를 위해 소비되는 최소 칼로리입니다.
 *    - 현대 스포츠 영양학에서 가장 정확도가 높은 미플린-세인트 지어(Mifflin-St Jeor)
 *      공식을 적용합니다.
 *      - 남성 BMR = (10 × 체중kg) + (6.25 × 키cm) - (5 × 나이) + 5
 *      - 여성 BMR = (10 × 체중kg) + (6.25 × 키cm) - (5 × 나이) - 161
 * 2) 일일 총 에너지 소비량 (TDEE, Total Daily Energy Expenditure):
 *    - BMR에 일상생활 활동 계수(1.2 ~ 1.9)를 곱해 하루에 실제로 태우는 총 칼로리입니다.
 * 3) 탄수화물·단백질·지방(탄단지) 매크로 처방:
 *    - 감량기 근손실 방지를 위해 체중 1kg당 단백질 1.8g을 우선 확보(1g당 4kcal)하고,
 *      필수 호르몬 유지를 위해 총 칼로리의 25%를 건강한 지방(1g당 9kcal)에 배정하며,
 *      남은 칼로리를 뇌와 근육의 주 연료인 복합 탄수화물(1g당 4kcal)로 구성합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 1. 활동 계수 정의
  const ACTIVITY_MULTIPLIERS = {
    sedentary: { label: '좌식 생활 (운동 거의 안 함, 사무직)', factor: 1.2 },
    light: { label: '가벼운 활동 (주 1~2회 가벼운 운동)', factor: 1.375 },
    moderate: { label: '보통 활동 (주 3~5회 규칙적 헬스·유산소)', factor: 1.55 },
    active: { label: '활발한 활동 (주 6~7회 강도 높은 트레이닝)', factor: 1.725 },
    very_active: { label: '선수급 활동 (하루 2회 운동 또는 육체 노동)', factor: 1.9 },
  };

  // 2. 다이어트 목표별 칼로리 조정
  const GOAL_ADJUSTMENTS = {
    cut_aggressive: { label: '빠른 체지방 감량 (-500 kcal)', deltaKcal: -500 },
    cut_moderate: { label: '완만한 건강 감량 (-300 kcal)', deltaKcal: -300 },
    maintain: { label: '현재 체중 유지 (0 kcal)', deltaKcal: 0 },
    bulk_clean: { label: '클린 린매스업 (+300 kcal)', deltaKcal: 300 },
    bulk_heavy: { label: '체중 및 근력 증량 (+500 kcal)', deltaKcal: 500 },
  };

  // 3. 기본 입력값
  const DEFAULT_INPUTS = {
    gender: 'male',       // 'male' | 'female'
    age: 30,              // 나이 (세)
    heightCm: 175,        // 키 (cm)
    weightKg: 72,         // 체중 (kg)
    activityLevel: 'moderate', // 활동 수준
    goal: 'cut_moderate', // 목표
  };

  /**
   * 기초대사량(BMR) 계산 (Mifflin-St Jeor 공식)
   */
  function calculateBMR(gender, weightKg, heightCm, age) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === 'female' ? Math.round(base - 161) : Math.round(base + 5);
  }

  /**
   * 메인 BMR & TDEE 및 영양소 매크로 시뮬레이션
   */
  function calculateDietMacro(userInputs = {}) {
    const inputs = { ...DEFAULT_INPUTS, ...userInputs };

    const gender = inputs.gender === 'female' ? 'female' : 'male';
    const age = Math.max(10, Math.min(100, Number(inputs.age) || 30));
    const height = Math.max(100, Math.min(230, Number(inputs.heightCm) || 175));
    const weight = Math.max(30, Math.min(250, Number(inputs.weightKg) || 72));

    const activityInfo = ACTIVITY_MULTIPLIERS[inputs.activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
    const goalInfo = GOAL_ADJUSTMENTS[inputs.goal] || GOAL_ADJUSTMENTS.cut_moderate;

    // 1) BMR 및 TDEE 산출
    const bmr = calculateBMR(gender, weight, height, age);
    const tdee = Math.round(bmr * activityInfo.factor);

    // 2) 목표 섭취 칼로리 (기초대사량 이하 극단적 절식 방지)
    const rawTargetKcal = tdee + goalInfo.deltaKcal;
    // 최저 권장 칼로리는 기초대사량(BMR)의 95% 이하로 떨어지지 않도록 가이드
    const targetCalories = Math.max(Math.round(bmr * 0.95), rawTargetKcal);

    // 3) 주당 예상 체중 변화 (체지방 1kg 약 7,700 kcal)
    const dailyKcalDeficit = targetCalories - tdee;
    const weeklyWeightChangeKg = Number(((dailyKcalDeficit * 7) / 7700).toFixed(2));

    // 4) 탄수화물·단백질·지방(탄단지) 그램(g) 및 비율 배분
    // 단백질: 체중(kg)당 1.8g (단백질 1g = 4 kcal)
    const proteinGrams = Math.round(weight * 1.8);
    const proteinKcal = proteinGrams * 4;

    // 지방: 총 목표 칼로리의 25% (지방 1g = 9 kcal)
    const fatKcal = Math.round(targetCalories * 0.25);
    const fatGrams = Math.round(fatKcal / 9);

    // 탄수화물: 남은 칼로리 전부 (탄수화물 1g = 4 kcal)
    const remainingKcal = Math.max(0, targetCalories - proteinKcal - fatKcal);
    const carbsGrams = Math.round(remainingKcal / 4);
    const carbsKcal = carbsGrams * 4;

    // 실제 합계 칼로리 및 비율
    const totalMacroKcal = proteinKcal + fatKcal + carbsKcal;
    const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
    const fatPct = Math.round((fatKcal / totalMacroKcal) * 100);
    const carbsPct = Math.max(0, 100 - proteinPct - fatPct);

    // BMI (체질량 지수)
    const heightM = height / 100;
    const bmi = Number((weight / (heightM * heightM)).toFixed(1));

    return {
      inputs,
      summary: {
        bmr,
        tdee,
        targetCalories,
        calorieDifference: dailyKcalDeficit,
        weeklyWeightChangeKg,
        bmi,
      },
      macros: {
        carbs: { grams: carbsGrams, kcal: carbsKcal, pct: carbsPct },
        protein: { grams: proteinGrams, kcal: proteinKcal, pct: proteinPct },
        fat: { grams: fatGrams, kcal: fatKcal, pct: fatPct },
        totalKcal: totalMacroKcal,
      },
      activityLabel: activityInfo.label,
      goalLabel: goalInfo.label,
    };
  }

  const exportsObj = {
    ACTIVITY_MULTIPLIERS,
    GOAL_ADJUSTMENTS,
    DEFAULT_INPUTS,
    calculateBMR,
    calculateDietMacro,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.DietBmrTdee = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
