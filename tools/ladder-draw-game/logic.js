/**
 * ==========================================================================
 * SimuLab Analytics Hub - 인터랙티브 사다리타기 게임 순수 연산 엔진
 * 파일 경로: tools/ladder-draw-game/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 사다리타기 수학적 원리 설명]
 * 1) 일대일 대응 (Bijection, 전단사 함수):
 *    - 사다리타기는 수학적으로 '순열(Permutation)'과 동일합니다.
 *    - 출발점이 N개이고 도착점이 N개일 때, 가로선을 아무리 복잡하게 얽어도
 *      중복 당첨이나 탈락 없이 반드시 1:1로 정확하게 매칭됩니다.
 * 2) 가로선 생성 규칙:
 *    - 같은 높이(Y)에서 인접한 두 레일(예: 1-2번과 2-3번)에 동시에 가로선이
 *      생기면 경로가 모호해지므로, 연속된 가로선이 생기지 않도록 방어합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 기본 프리셋 설정
  const PRESETS = {
    coffee: {
      title: '☕ 커피 쏘기 (1명 몰아주기)',
      participants: ['철수', '영희', '민수', '지민'],
      prizes: ['커피 쏘기', '통과(무료)', '통과(무료)', '통과(무료)'],
    },
    lunch: {
      title: '🍱 점심 쏘기 (1등·2등 차등)',
      participants: ['팀장님', '김과장', '이대리', '박주임', '최신입'],
      prizes: ['전액 결제', '50% 결제', '통과', '통과', '통과'],
    },
    cleaning: {
      title: '🧹 청소 & 심부름 당번',
      participants: ['참가자 1', '참가자 2', '참가자 3', '참가자 4'],
      prizes: ['분리수거', '바닥 청소', '간식 사오기', '면제'],
    },
    random: {
      title: '🎲 숫자 순번 뽑기 (1~4번)',
      participants: ['1번 주자', '2번 주자', '3번 주자', '4번 주자'],
      prizes: ['1등', '2등', '3등', '4등'],
    },
  };

  const DEFAULT_SETTINGS = {
    participants: ['철수', '영희', '민수', '지민'],
    prizes: ['커피 쏘기', '통과', '통과', '통과'],
    rungLayers: 8, // 사다리 가로선 층수
  };

  /**
   * 사다리 가로선(Rung) 그리드 무작위 생성
   * @param {number} cols 참가자 수 (세로선 개수)
   * @param {number} layers 가로선 단수 (높이 층수)
   * @returns {Array<Array<boolean>>} rungs[layer][col] (true면 col과 col+1 사이에 가로선 존재)
   */
  function generateLadderGrid(cols, layers = 8) {
    const safeCols = Math.max(2, Math.min(12, cols));
    const safeLayers = Math.max(5, Math.min(20, layers));

    const rungs = [];
    for (let r = 0; r < safeLayers; r++) {
      const row = new Array(safeCols - 1).fill(false);
      for (let c = 0; c < safeCols - 1; c++) {
        // 인접한 좌측 칸(c - 1)에 이미 가로선이 있다면 교차 방지를 위해 생성하지 않음
        if (c > 0 && row[c - 1]) {
          continue;
        }
        // 약 45% 확률로 가로선 연결
        if (Math.random() < 0.45) {
          row[c] = true;
        }
      }
      rungs.push(row);
    }

    // 각 세로선마다 최소 1개 이상의 가로선이 연결되도록 보정
    for (let c = 0; c < safeCols - 1; c++) {
      let hasRung = false;
      for (let r = 0; r < safeLayers; r++) {
        if (rungs[r][c]) {
          hasRung = true;
          break;
        }
      }
      if (!hasRung) {
        // 비어있는 랜덤 층에 가로선 하나 강제 삽입
        const randRow = Math.floor(Math.random() * safeLayers);
        if (c === 0 || !rungs[randRow][c - 1]) {
          rungs[randRow][c] = true;
        }
      }
    }

    return rungs;
  }

  /**
   * 특정 출발점(startCol)에서 사다리를 타고 내려가 최종 도착점 및 이동 경로 추적
   * @param {number} startCol 출발 참가자 인덱스 (0-indexed)
   * @param {Array<Array<boolean>>} rungs 가로선 그리드
   * @returns {Object} { finalCol, path: [{row, col, nextCol}] }
   */
  function tracePath(startCol, rungs) {
    const layers = rungs.length;
    let currentCol = startCol;
    const pathNodes = [{ layer: 0, col: currentCol }];

    for (let r = 0; r < layers; r++) {
      // 1) 오른쪽으로 가는 가로선이 있는가?
      if (currentCol < rungs[r].length && rungs[r][currentCol]) {
        pathNodes.push({ layer: r, col: currentCol });
        currentCol += 1;
        pathNodes.push({ layer: r, col: currentCol });
      }
      // 2) 왼쪽으로 가는 가로선이 있는가?
      else if (currentCol > 0 && rungs[r][currentCol - 1]) {
        pathNodes.push({ layer: r, col: currentCol });
        currentCol -= 1;
        pathNodes.push({ layer: r, col: currentCol });
      }
    }

    pathNodes.push({ layer: layers, col: currentCol });

    return {
      startCol,
      finalCol: currentCol,
      pathNodes,
    };
  }

  /**
   * 전체 참가자에 대한 사다리 결과 일괄 계산
   */
  function calculateLadderGame(
    participants = DEFAULT_SETTINGS.participants,
    prizes = DEFAULT_SETTINGS.prizes,
    customRungs = null
  ) {
    const validParts = Array.isArray(participants) ? participants : DEFAULT_SETTINGS.participants;
    const validPrz = Array.isArray(prizes) ? prizes : DEFAULT_SETTINGS.prizes;
    const count = Math.min(validParts.length, validPrz.length);
    const validParticipants = validParts.slice(0, count);
    const validPrizes = validPrz.slice(0, count);

    const layers = Math.max(6, count + 2);
    const rungs = customRungs || generateLadderGrid(count, layers);

    const results = [];
    for (let i = 0; i < count; i++) {
      const trace = tracePath(i, rungs);
      results.push({
        startIndex: i,
        participant: validParticipants[i],
        finalIndex: trace.finalCol,
        prize: validPrizes[trace.finalCol],
        pathNodes: trace.pathNodes,
      });
    }

    return {
      count,
      participants: validParticipants,
      prizes: validPrizes,
      rungs,
      layers,
      results,
    };
  }

  const exportsObj = {
    PRESETS,
    DEFAULT_SETTINGS,
    generateLadderGrid,
    tracePath,
    calculateLadderGame,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.LadderGame = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
