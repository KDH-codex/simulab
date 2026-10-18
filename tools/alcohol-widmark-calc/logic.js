/**
 * ==========================================================================
 * SimuLab Analytics Hub - 음주 후 알코올 분해 시간(위드마크) 계산기 순수 연산 엔진
 * 파일 경로: tools/alcohol-widmark-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 위드마크(Widmark) 공식 설명]
 * 1) 섭취한 순수 알코올 총량 (g):
 *    - 마신 술의 양(ml) × (알코올 도수 % ÷ 100) × 0.7894 (알코올 비중)
 * 2) 최고 혈중알코올농도 (BAC, %):
 *    - (알코올 총량 × 0.7(체내 흡수율)) ÷ (체중(kg) × 성별 계수 R × 10)
 *    - 성별 계수 R: 남성 0.7, 여성 0.6
 * 3) 시간당 알코올 분해 속도:
 *    - 대한민국 경찰청 및 법원 표준: 시간당 약 0.015% 감소 (개인차 0.008~0.025%)
 * 4) 대한민국 도로교통법 처벌 기준:
 *    - 0.03% 이상 ~ 0.08% 미만: 100일 면허 정지
 *    - 0.08% 이상: 1년 면허 취소
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const ALCOHOL_SPECIFIC_GRAVITY = 0.7894;

  const DEFAULT_WIDMARK_INPUTS = {
    gender: 'male',         // 성별: 'male'(0.7), 'female'(0.6)
    weightKg: 70,           // 체중 (kg)
    finishHour: 23,         // 음주 종료 시각 (시, 0~23)
    finishMinute: 0,        // 음주 종료 시각 (분, 0~59)
    sojuBottles: 1.0,       // 소주 (병, 360ml 16.5도)
    beerGlasses: 0.0,       // 맥주 (500ml 4.5도)
    wineGlasses: 0.0,       // 와인 (잔, 150ml 13도)
    whiskeyShots: 0.0,      // 위스키 (잔, 30ml 40도)
    metabolicRate: 0.015,   // 시간당 분해율 (기본 0.015%)
  };

  /**
   * 순수 알코올 섭취량 계산 (g)
   */
  function calculateTotalAlcoholGrams(inputs) {
    const sojuGrams = (Number(inputs.sojuBottles) || 0) * 360 * 0.165 * ALCOHOL_SPECIFIC_GRAVITY;
    const beerGrams = (Number(inputs.beerGlasses) || 0) * 500 * 0.045 * ALCOHOL_SPECIFIC_GRAVITY;
    const wineGrams = (Number(inputs.wineGlasses) || 0) * 150 * 0.13 * ALCOHOL_SPECIFIC_GRAVITY;
    const whiskeyGrams = (Number(inputs.whiskeyShots) || 0) * 30 * 0.40 * ALCOHOL_SPECIFIC_GRAVITY;
    return sojuGrams + beerGrams + wineGrams + whiskeyGrams;
  }

  /**
   * 위드마크 메인 계산 함수
   */
  function calculateWidmark(userInputs = {}) {
    const inputs = { ...DEFAULT_WIDMARK_INPUTS, ...userInputs };

    const genderFactor = inputs.gender === 'female' ? 0.6 : 0.7;
    const weight = Math.max(30, Math.min(200, Number(inputs.weightKg) || 70));
    const metabolicRate = Math.max(0.005, Math.min(0.03, Number(inputs.metabolicRate) || 0.015));

    const totalAlcoholGrams = calculateTotalAlcoholGrams(inputs);

    // 최고 혈중알코올농도 BAC (%) - 음주 후 약 30~90분 시점
    // 공식: (총 알코올량 × 0.7) ÷ (체중 × R × 10)
    const peakBac = totalAlcoholGrams > 0
      ? (totalAlcoholGrams * 0.7) / (weight * genderFactor * 10)
      : 0;

    // 0.03% (면허정지) 미만까지 소요 시간 (시간)
    const hoursToStopLimit = peakBac > 0.03
      ? (peakBac - 0.03) / metabolicRate
      : 0;

    // 0.00% 완전 분해까지 소요 시간 (시간)
    const hoursToFullZero = peakBac > 0
      ? peakBac / metabolicRate
      : 0;

    // 음주 종료 시각 기준 실제 시각 환산
    const finishH = Math.max(0, Math.min(23, Number(inputs.finishHour) || 0));
    const finishM = Math.max(0, Math.min(59, Number(inputs.finishMinute) || 0));

    function formatTargetTime(offsetHours) {
      const totalMinutes = Math.round(offsetHours * 60);
      let targetM = finishM + (totalMinutes % 60);
      let targetH = finishH + Math.floor(totalMinutes / 60) + Math.floor(targetM / 60);
      targetM %= 60;
      const dayOffset = Math.floor(targetH / 24);
      targetH %= 24;

      const dayPrefix = dayOffset === 0 ? '당일' : dayOffset === 1 ? '익일(다음날)' : `${dayOffset}일 후`;
      const timeStr = `${String(targetH).padStart(2, '0')}:${String(targetM).padStart(2, '0')}`;
      return `${dayPrefix} ${timeStr}`;
    }

    const safeDriveTimeText = hoursToStopLimit > 0
      ? formatTargetTime(hoursToStopLimit + 1) // 안전 마진 1시간 추가
      : '현재 즉시 운전 가능 (단속 기준 미만)';

    const fullZeroTimeText = hoursToFullZero > 0
      ? formatTargetTime(hoursToFullZero)
      : '완전 분해 상태';

    // 법적 처벌 판정
    let penaltyLevel = '훈방 (단속 기준 미만)';
    if (peakBac >= 0.20) {
      penaltyLevel = '면허 취소 + 2년~5년 징역 또는 1천만~2천만원 벌금';
    } else if (peakBac >= 0.08) {
      penaltyLevel = '면허 취소 (1년) + 1년~2년 징역 또는 500만~1천만원 벌금';
    } else if (peakBac >= 0.03) {
      penaltyLevel = '면허 정지 (100일) + 1년 이하 징역 또는 500만원 이하 벌금';
    }

    // 시간대별 BAC 감소 시계열 (최대 24시간, 1시간 간격)
    const timeline = [];
    const maxTimelineHours = Math.min(24, Math.ceil(hoursToFullZero) + 2);
    for (let h = 0; h <= maxTimelineHours; h++) {
      const currentBac = Math.max(0, peakBac - h * metabolicRate);
      timeline.push({
        hourOffset: h,
        bac: Math.round(currentBac * 1000) / 1000,
        timeLabel: formatTargetTime(h),
      });
      if (currentBac === 0 && h > hoursToFullZero) break;
    }

    return {
      inputs,
      summary: {
        totalAlcoholGrams: Math.round(totalAlcoholGrams * 10) / 10,
        peakBac: Math.round(peakBac * 1000) / 1000,
        peakBacPct: (Math.round(peakBac * 1000) / 10).toFixed(2),
        hoursToStopLimit: Math.round(hoursToStopLimit * 10) / 10,
        hoursToFullZero: Math.round(hoursToFullZero * 10) / 10,
        safeDriveTimeText,
        fullZeroTimeText,
        penaltyLevel,
      },
      timeline,
    };
  }

  const exportsObj = {
    DEFAULT_WIDMARK_INPUTS,
    calculateTotalAlcoholGrams,
    calculateWidmark,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.AlcoholWidmark = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
