/**
 * ==========================================================================
 * SimuLab Analytics Hub - 카페인 반감기 & 꿀잠 계산기 순수 연산 엔진
 * 파일 경로: tools/caffeine-sleep-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 카페인 대사 & 수면 과학 설명]
 * 1) 카페인의 작용 기전:
 *    - 카페인은 뇌에서 피로감을 유발하는 '아데노신(Adenosine)' 물질과 분자 구조가 매우
 *      유사하여 아데노신 수용체에 대신 결합함으로써 뇌가 피로를 느끼지 못하게 속입니다.
 * 2) 체내 반감기 (Half-Life):
 *    - 건강한 성인 기준 카페인의 평균 반감기는 약 5시간입니다.
 *    - 즉, 섭취 후 5시간이 지나도 절반(50%)이 몸에 남아 있고, 10시간이 지나도 25%가 남습니다.
 * 3) 깊은 수면(서파 수면, SWS) 방해 임계치:
 *    - 신경학 연구에 따르면 취침 시점에 체내 잔여 카페인이 50mg을 초과하면, 잠에 들더라도
 *      뇌파가 깊은 렘(REM) 및 서파 수면 단계로 진입하지 못해 아침에 피곤함을 느낍니다.
 *    - 본 엔진은 잔여량이 50mg 이하로 떨어지는 '진짜 꿀잠 골든타임'을 정밀 역산합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 1. 주요 음료별 카페인 함량 프리셋 (mg)
  const BEVERAGE_PRESETS = {
    americano: { name: '아메리카노 (기본 2샷)', mg: 150, icon: '☕' },
    shot_extra: { name: '에스프레소 샷 추가 (1샷)', mg: 75, icon: '⚡' },
    cold_brew: { name: '콜드브루 (고카페인)', mg: 200, icon: '🧊' },
    energy_drink: { name: '에너지 드링크 (몬스터/핫식스)', mg: 100, icon: '🔋' },
    mix_coffee: { name: '믹스커피 (1포)', mg: 50, icon: '🟡' },
    green_tea: { name: '녹차 / 홍차 (1잔)', mg: 30, icon: '🍵' },
  };

  const DEFAULT_INPUTS = {
    drinks: [
      { type: 'americano', count: 1, intakeHour: 14, intakeMinute: 0 }, // 오후 2시 아메리카노 1잔
    ],
    targetBedHour: 23,      // 목표 취침 시각: 밤 11시 (23시)
    targetBedMinute: 0,
    halfLifeHours: 5.0,     // 평균 반감기 (기본 5.0시간)
    sleepThresholdMg: 50.0, // 깊은 수면 보장 안전 임계치 (50mg)
  };

  /**
   * 경과 시간(hours)에 따른 잔여 카페인 계산 (지수 감쇠 수식)
   */
  function getRemainingCaffeine(initialMg, elapsedHours, halfLife = 5.0) {
    if (elapsedHours <= 0) return initialMg;
    return initialMg * Math.pow(0.5, elapsedHours / halfLife);
  }

  /**
   * 특정 시각(기준일 0~48시간 범위)에서의 누적 체내 잔여 카페인 계산
   */
  function computeTotalRemainingAt(drinks, queryTimeHours, halfLife = 5.0) {
    let total = 0;
    drinks.forEach((d) => {
      const intakeTime = d.intakeHour + d.intakeMinute / 60;
      const elapsed = queryTimeHours - intakeTime;
      if (elapsed >= 0) {
        total += getRemainingCaffeine(d.mg * d.count, elapsed, halfLife);
      }
    });
    return total;
  }

  /**
   * 메인 카페인 반감기 & 수면 시뮬레이션
   */
  function calculateCaffeineSleep(userInputs = {}) {
    const inputs = { ...DEFAULT_INPUTS, ...userInputs };
    const drinks = Array.isArray(inputs.drinks) && inputs.drinks.length > 0 ? inputs.drinks : DEFAULT_INPUTS.drinks;
    const halfLife = Number(inputs.halfLifeHours) || 5.0;
    const threshold = Number(inputs.sleepThresholdMg) || 50.0;

    const bedHour = Number(inputs.targetBedHour) || 23;
    const bedMinute = Number(inputs.targetBedMinute) || 0;
    const bedTimeHours = bedHour + bedMinute / 60;

    // 1) 총 섭취 카페인 합산
    let totalIntakeMg = 0;
    let latestIntakeTimeHours = 0;
    drinks.forEach((d) => {
      const count = Math.max(1, Number(d.count) || 1);
      const preset = BEVERAGE_PRESETS[d.type] || { mg: 150 };
      d.mg = preset.mg;
      d.count = count;
      totalIntakeMg += d.mg * count;

      const intakeTime = (Number(d.intakeHour) || 12) + (Number(d.intakeMinute) || 0) / 60;
      if (intakeTime > latestIntakeTimeHours) latestIntakeTimeHours = intakeTime;
    });

    // 2) 목표 취침 시점의 잔여 카페인량
    // 만약 취침 시간이 섭취 시간보다 작으면 익일 취침으로 간주 (+24h)
    let effectiveBedTime = bedTimeHours;
    if (effectiveBedTime < latestIntakeTimeHours) {
      effectiveBedTime += 24;
    }

    const bedRemainingMg = Math.round(computeTotalRemainingAt(drinks, effectiveBedTime, halfLife));

    // 3) 안전 수면 골든타임(50mg 이하 도달 시각) 역산
    let safeBedTimeHours = effectiveBedTime;
    if (bedRemainingMg > threshold) {
      // 15분 단위로 앞으로 전진 탐색
      for (let t = effectiveBedTime; t <= effectiveBedTime + 24; t += 0.25) {
        if (computeTotalRemainingAt(drinks, t, halfLife) <= threshold) {
          safeBedTimeHours = t;
          break;
        }
      }
    }

    const safeBedHourInt = Math.floor(safeBedTimeHours) % 24;
    const safeBedMinInt = Math.round((safeBedTimeHours - Math.floor(safeBedTimeHours)) * 60);

    // 4) 수면 안전 상태 판정
    let sleepGrade = 'SAFE'; // 'SAFE' | 'CAUTION' | 'DANGER'
    let sleepVerdict = '';
    if (bedRemainingMg <= 30) {
      sleepGrade = 'SAFE';
      sleepVerdict = '깊은 숙면 가능 (완전 안전 구간)';
    } else if (bedRemainingMg <= threshold) {
      sleepGrade = 'CAUTION';
      sleepVerdict = '양호 (경미한 각성 가능성 있으나 수면 양호)';
    } else if (bedRemainingMg <= 100) {
      sleepGrade = 'WARNING';
      sleepVerdict = '주의 필요 (깊은 수면(REM) 방해 및 야간 뒤척임 위험)';
    } else {
      sleepGrade = 'DANGER';
      sleepVerdict = '불면 위험 (심장 박동 증가 및 수면 진입 장애 위험)';
    }

    // 5) 타임라인 시각화 데이터 포인트 생성 (섭취 시작부터 +24시간)
    const timeline = [];
    const startHour = Math.floor(drinks[0].intakeHour || 8);
    for (let h = startHour; h <= startHour + 24; h += 1) {
      const rem = Math.round(computeTotalRemainingAt(drinks, h, halfLife));
      const displayHour = h % 24;
      timeline.push({
        hour: displayHour,
        label: `${displayHour}시`,
        remainingMg: rem,
        isBedTime: Math.abs(h - effectiveBedTime) < 0.6,
      });
    }

    return {
      inputs,
      summary: {
        totalIntakeMg,
        bedRemainingMg,
        sleepGrade,
        sleepVerdict,
        safeBedHour: safeBedHourInt,
        safeBedMinute: safeBedMinInt,
        safeBedTimeStr: `${String(safeBedHourInt).padStart(2, '0')}:${String(safeBedMinInt).padStart(2, '0')}`,
      },
      timeline,
      drinks,
    };
  }

  const exportsObj = {
    BEVERAGE_PRESETS,
    DEFAULT_INPUTS,
    getRemainingCaffeine,
    computeTotalRemainingAt,
    calculateCaffeineSleep,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.CaffeineSleep = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
