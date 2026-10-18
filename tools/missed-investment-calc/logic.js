/**
 * ==========================================================================
 * SimuLab Analytics Hub - 매도 후 상승분 & 손실 방어 계산기 순수 연산 엔진
 * 파일 경로: tools/missed-investment-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 로직 설명]
 * "그때 팔지 말고 가만히 둘 걸 그랬나?"
 * 1) 기본 연산:
 *    - 매도 회수 원금 = 매도가격 × 수량
 *    - 현재 보유 시 평가액 = 현재가격 × 수량
 *    - 기회 손익 = 현재 평가액 - 매도 회수 원금
 * 2) 투자 심리 판정:
 *    - 기회 손익 > 0 : 놓친 상승분 (Missed Gain) & 배당금 계산
 *    - 기회 손익 < 0 : 성공적인 하락 방어 (Protected Loss)
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const DEFAULT_MISSED_INPUTS = {
    symbol: 'NVDA',        // 종목 티커
    currency: '$',         // 통화 ('$' 또는 '원')
    soldPrice: 50.0,       // 매도 당시 1주당 가격
    currentPrice: 138.25,  // 현재 1주당 가격
    quantity: 100,         // 매도 수량 (주)
    holdingYears: 1.5,     // 매도 후 경과 기간 (년)
    dividendYield: 0.5,    // 연간 배당수익률 (%)
    usdKrwRate: 1385,      // 환율 (원/$)
  };

  /**
   * 메인 계산 함수
   */
  function calculateMissedInvestment(userInputs = {}) {
    const inputs = { ...DEFAULT_MISSED_INPUTS, ...userInputs };

    const soldPrice = Math.max(0.001, Number(inputs.soldPrice) || 1);
    const currentPrice = Math.max(0.001, Number(inputs.currentPrice) || 1);
    const qty = Math.max(1, Number(inputs.quantity) || 1);
    const years = Math.max(0.1, Number(inputs.holdingYears) || 1);
    const divYield = Math.max(0, Number(inputs.dividendYield) || 0) / 100;
    const fxRate = Math.max(100, Number(inputs.usdKrwRate) || 1385);
    const isUsd = inputs.currency === '$';

    const soldTotal = soldPrice * qty;
    const currentTotal = currentPrice * qty;
    const priceDiff = currentPrice - soldPrice;
    const totalDiff = currentTotal - soldTotal;
    const changePct = ((currentPrice - soldPrice) / soldPrice) * 100;

    // 놓친 배당금 추정
    const missedDividends = soldTotal * divYield * years;
    const totalOpportunityCost = totalDiff + missedDividends;

    // 원화 환산값
    const multiplier = isUsd ? fxRate : 1;
    const soldTotalKrw = Math.round(soldTotal * multiplier);
    const currentTotalKrw = Math.round(currentTotal * multiplier);
    const totalDiffKrw = Math.round(totalDiff * multiplier);
    const missedDividendsKrw = Math.round(missedDividends * multiplier);
    const totalOpportunityCostKrw = Math.round(totalOpportunityCost * multiplier);

    // 판정 유형
    const isGainMissed = totalDiff > 0;
    let psychologicalNote = '';

    if (isGainMissed) {
      if (changePct >= 100) {
        psychologicalNote = '매도 후 주가가 2배 이상 폭등하여 아쉬움이 크겠지만, 수익 실현은 언제나 옳습니다. 남겨둔 현금으로 더 좋은 다음 기회를 노리세요!';
      } else {
        psychologicalNote = '일정 부분 추가 상승분을 놓쳤지만, 확정 수익을 챙긴 현명한 매매였습니다. 지나간 버스에 미련을 두지 않는 것이 투자의 기본입니다.';
      }
    } else if (totalDiff < 0) {
      psychologicalNote = '탁월한 리스크 관리입니다! 매도 후 주가가 하락하여 소중한 원금 손실을 성공적으로 방어하셨습니다.';
    } else {
      psychologicalNote = '매도 시점과 현재 주가가 거의 동일하여 기회비용 없이 현금 유동성을 확보한 상태입니다.';
    }

    return {
      inputs,
      summary: {
        symbol: inputs.symbol,
        currency: inputs.currency,
        quantity: qty,
        soldPrice,
        currentPrice,
        soldTotal,
        currentTotal,
        priceDiff,
        totalDiff,
        changePct: Math.round(changePct * 10) / 10,
        missedDividends,
        totalOpportunityCost,
        soldTotalKrw,
        currentTotalKrw,
        totalDiffKrw,
        missedDividendsKrw,
        totalOpportunityCostKrw,
        isGainMissed,
        psychologicalNote,
      },
    };
  }

  const exportsObj = {
    DEFAULT_MISSED_INPUTS,
    calculateMissedInvestment,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.MissedInvestment = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
