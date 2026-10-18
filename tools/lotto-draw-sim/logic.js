/**
 * ==========================================================================
 * SimuLab Analytics Hub - 로또 1등 당첨 무한 시뮬레이터 순수 연산 엔진
 * 파일 경로: tools/lotto-draw-sim/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 확률 및 게임 규칙 설명]
 * 1) 로또 6/45 확률:
 *    - 1등 (6개 일치): 1 / 8,145,060 (약 0.0000123%) - 평균 약 20억원
 *    - 2등 (5개 + 보너스 일치): 1 / 1,357,510 - 평균 약 5,000만원
 *    - 3등 (5개 일치): 1 / 35,724 - 평균 약 150만원
 *    - 4등 (4개 일치): 1 / 733 - 고정 50,000원
 *    - 5등 (3개 일치): 1 / 45 - 고정 5,000원
 * 2) 현실 체감 환산:
 *    - 매주 1만원(10게임)씩 꾸준히 산다면, 1등에 당첨되는 데 통계적으로 약 15,663년이 걸립니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const AVERAGE_PRIZES = {
    rank1: 2000000000, // 1등 평균 약 20억원
    rank2: 50000000,   // 2등 평균 약 5,000만원
    rank3: 1500000,    // 3등 평균 약 150만원
    rank4: 50000,      // 4등 고정 5만원
    rank5: 5000,       // 5등 고정 5천원
  };

  /**
   * 1~45 중 중복 없이 6개의 난수 추출
   */
  function generateLottoNumbers() {
    const numbers = [];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  /**
   * 보너스 번호를 포함한 당첨 번호 세트 생성
   */
  function generateWinningSet() {
    const mainNumbers = generateLottoNumbers();
    let bonus = Math.floor(Math.random() * 45) + 1;
    while (mainNumbers.includes(bonus)) {
      bonus = Math.floor(Math.random() * 45) + 1;
    }
    return { mainNumbers, bonus };
  }

  /**
   * 사용자의 6개 번호와 당첨 번호 세트 매칭하여 등수 판정
   */
  function matchRank(userNumbers, winningSet) {
    let matchCount = 0;
    for (let i = 0; i < 6; i++) {
      if (winningSet.mainNumbers.includes(userNumbers[i])) {
        matchCount++;
      }
    }

    if (matchCount === 6) return 1;
    if (matchCount === 5 && userNumbers.includes(winningSet.bonus)) return 2;
    if (matchCount === 5) return 3;
    if (matchCount === 4) return 4;
    if (matchCount === 3) return 5;
    return 0; // 낙첨
  }

  /**
   * N회차 고속 시뮬레이션 배치 실행
   */
  function runLottoBatch(batchSize = 100, currentState = null, fixedWinningSet = null) {
    const state = currentState || {
      totalGames: 0,
      totalCost: 0,
      totalPrize: 0,
      rankCounts: { rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0, lose: 0 },
      isFirstRankWon: false,
    };

    const winning = fixedWinningSet || generateWinningSet();

    for (let i = 0; i < batchSize; i++) {
      const userTicket = generateLottoNumbers();
      const rank = matchRank(userTicket, winning);

      state.totalGames++;
      state.totalCost += 1000; // 1게임당 1,000원

      if (rank === 1) {
        state.rankCounts.rank1++;
        state.totalPrize += AVERAGE_PRIZES.rank1;
        state.isFirstRankWon = true;
      } else if (rank === 2) {
        state.rankCounts.rank2++;
        state.totalPrize += AVERAGE_PRIZES.rank2;
      } else if (rank === 3) {
        state.rankCounts.rank3++;
        state.totalPrize += AVERAGE_PRIZES.rank3;
      } else if (rank === 4) {
        state.rankCounts.rank4++;
        state.totalPrize += AVERAGE_PRIZES.rank4;
      } else if (rank === 5) {
        state.rankCounts.rank5++;
        state.totalPrize += AVERAGE_PRIZES.rank5;
      } else {
        state.rankCounts.lose++;
      }

      // 1등이 나오면 즉시 정지할 수 있도록 플래그
      if (state.isFirstRankWon) break;
    }

    const netProfit = state.totalPrize - state.totalCost;
    const roi = state.totalCost > 0 ? (netProfit / state.totalCost) * 100 : 0;
    // 매주 1만원(10게임) 구매 시 환산 소요 년수
    const equivalentYears = Math.round((state.totalGames / 10 / 52) * 10) / 10;

    return {
      state,
      winning,
      summary: {
        totalGames: state.totalGames,
        totalCost: state.totalCost,
        totalPrize: state.totalPrize,
        netProfit,
        roi: Math.round(roi * 10) / 10,
        equivalentYears,
        isFirstRankWon: state.isFirstRankWon,
      },
    };
  }

  const exportsObj = {
    AVERAGE_PRIZES,
    generateLottoNumbers,
    generateWinningSet,
    matchRank,
    runLottoBatch,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.LottoDraw = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
