/**
 * ==========================================================================
 * SimuLab Analytics Hub - 센스있는 더치페이 & 뿜빠이 복불복 계산기 순수 연산 엔진
 * 파일 경로: tools/dutch-pay-roulette/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 더치페이 정산 원리 설명]
 * 1) 기본 1/N 분할 및 절사 단위(Round Unit):
 *    - 원 단위로 딱 떨어지지 않는 경우 100원 또는 1,000원 단위로 올림/버림합니다.
 *    - 올림(Ceil) 시 발생하는 자투리 잉여금은 결제를 담당한 총무의 수고비(팁)로 처리합니다.
 * 2) 복불복 및 차등 정산 모드:
 *    - 지각자 가산: 늦게 온 멤버에게 사전 합의된 추가 벌금(예: 1만원)을 배정
 *    - 비음주자 할인: 술을 안 마신 사람에게 30~50% 할인 혜택 제공
 *    - 몰아주기 복불복: 무작위 1명이 더 내고 나머지는 큰 폭으로 할인
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const DEFAULT_INPUTS = {
    totalAmount: 120000, // 총 결제 금액 (원)
    memberCount: 4,      // 총 인원수
    roundUnit: 1000,     // 절사 단위 (1, 100, 1000)
    roundMode: 'ceil',   // 'ceil'(올림) | 'floor'(내림) | 'round'(반올림)
    mode: 'equal',       // 'equal' | 'late' | 'non_drinker' | 'roulette'
    lateCount: 1,        // 지각자 수
    latePenalty: 10000,  // 지각자 추가 부담금 (원)
    nonDrinkerCount: 1,  // 비음주자 수
    nonDrinkerDiscountPct: 30, // 비음주자 할인율 (%)
  };

  /**
   * 금액을 특정 단위로 올림/내림/반올림 처리
   */
  function applyRounding(amount, unit, mode) {
    if (unit <= 1) return Math.round(amount);

    if (mode === 'ceil') {
      return Math.ceil(amount / unit) * unit;
    } else if (mode === 'floor') {
      return Math.floor(amount / unit) * unit;
    } else {
      return Math.round(amount / unit) * unit;
    }
  }

  /**
   * 메인 더치페이 정산 시뮬레이션
   */
  function calculateDutchPay(userInputs = {}) {
    const inputs = { ...DEFAULT_INPUTS, ...userInputs };

    const total = Math.max(0, Number(inputs.totalAmount) || 0);
    const count = Math.max(1, Math.min(50, Number(inputs.memberCount) || 1));
    const unit = Number(inputs.roundUnit) || 1000;
    const mode = inputs.roundMode || 'ceil';

    // 1) 기본 1/N 균등 정산
    const exactPerPerson = total / count;
    const roundedPerPerson = applyRounding(exactPerPerson, unit, mode);
    const collectedTotal = roundedPerPerson * count;
    const difference = collectedTotal - total; // 양수면 잉여금, 음수면 부족금

    // 2) 모드별 멤버별 상세 정산표 생성
    const memberDetails = [];

    if (inputs.mode === 'late') {
      // [지각자 가산 모드]
      const lateCount = Math.min(count - 1, Math.max(1, Number(inputs.lateCount) || 1));
      const penalty = Math.min(total, Number(inputs.latePenalty) || 10000);
      const totalPenalty = penalty * lateCount;

      const remainingTotal = Math.max(0, total - totalPenalty);
      const normalCount = count - lateCount;
      const normalExact = remainingTotal / count;
      const normalRounded = applyRounding(normalExact, unit, mode);
      const lateRounded = normalRounded + penalty;

      for (let i = 1; i <= count; i++) {
        const isLate = i <= lateCount;
        memberDetails.push({
          id: i,
          name: isLate ? `지각자 ${i}` : `정시 멤버 ${i - lateCount}`,
          role: isLate ? '지각 가산' : '일반',
          amount: isLate ? lateRounded : normalRounded,
        });
      }
    } else if (inputs.mode === 'non_drinker') {
      // [비음주자 할인 모드]
      const nonCount = Math.min(count - 1, Math.max(1, Number(inputs.nonDrinkerCount) || 1));
      const discountPct = Math.min(80, Math.max(10, Number(inputs.nonDrinkerDiscountPct) || 30));
      const discountRate = (100 - discountPct) / 100;

      // 비음주자 weight = discountRate, 일반인 weight = 1.0
      const totalWeight = (count - nonCount) * 1.0 + nonCount * discountRate;
      const baseShare = total / totalWeight;

      const drinkerRounded = applyRounding(baseShare, unit, mode);
      const nonDrinkerRounded = applyRounding(baseShare * discountRate, unit, mode);

      for (let i = 1; i <= count; i++) {
        const isNon = i <= nonCount;
        memberDetails.push({
          id: i,
          name: isNon ? `비음주자 ${i}` : `음주 멤버 ${i - nonCount}`,
          role: isNon ? `${discountPct}% 할인` : '일반 음주',
          amount: isNon ? nonDrinkerRounded : drinkerRounded,
        });
      }
    } else if (inputs.mode === 'roulette') {
      // [몰아주기 복불복 모드]: 1명이 40% 결제, 나머지 멤버는 60% 균등 분할
      const unluckyShareExact = total * 0.4;
      const unluckyRounded = applyRounding(unluckyShareExact, unit, mode);

      const remainingMembers = Math.max(1, count - 1);
      const luckyShareExact = Math.max(0, (total - unluckyRounded) / remainingMembers);
      const luckyRounded = applyRounding(luckyShareExact, unit, mode);

      for (let i = 1; i <= count; i++) {
        const isUnlucky = i === 1;
        memberDetails.push({
          id: i,
          name: isUnlucky ? '당첨자 (몰아주기)' : `행운의 멤버 ${i - 1}`,
          role: isUnlucky ? '40% 몰아주기' : '대폭 할인',
          amount: isUnlucky ? unluckyRounded : luckyRounded,
        });
      }
    } else {
      // [기본 균등 1/N]
      for (let i = 1; i <= count; i++) {
        memberDetails.push({
          id: i,
          name: `멤버 ${i}`,
          role: '균등 분할',
          amount: roundedPerPerson,
        });
      }
    }

    // 모드 적용 후 실제 걷히는 총액 계산
    const actualCollectedTotal = memberDetails.reduce((sum, m) => sum + m.amount, 0);
    const actualDiff = actualCollectedTotal - total;

    // 카톡 단톡방 공유용 텍스트 서식 생성
    let kakaoMessage = `📢 [모임/회식비 뿜빠이 정산 안내]\n`;
    kakaoMessage += `총 결제금액: ${new Intl.NumberFormat('ko-KR').format(total)}원 (${count}명)\n`;
    kakaoMessage += `---------------------------------\n`;
    memberDetails.forEach((m) => {
      kakaoMessage += `• ${m.name}: ${new Intl.NumberFormat('ko-KR').format(m.amount)}원 (${m.role})\n`;
    });
    kakaoMessage += `---------------------------------\n`;
    kakaoMessage += `정산 금액 확인 후 송금 부탁드립니다! ☕`;

    return {
      inputs,
      summary: {
        totalAmount: total,
        memberCount: count,
        exactPerPerson: Math.round(exactPerPerson),
        roundedPerPerson,
        actualCollectedTotal,
        difference: actualDiff,
        isExcess: actualDiff >= 0,
      },
      memberDetails,
      kakaoMessage,
    };
  }

  const exportsObj = {
    DEFAULT_INPUTS,
    applyRounding,
    calculateDutchPay,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.DutchPay = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
