/**
 * ==========================================================================
 * SimuLab - 미니게임 공통 명예의 전당 TOP 10 랭킹 모듈 (game-ranking.js)
 * 파일 경로: assets/js/game-ranking.js
 * --------------------------------------------------------------------------
 * - 게임별 로컬스토리지 영구 보관 (game-tetris, game-dodge 등)
 * - 10위 이내 순위 진입 감지 및 닉네임(2~8자) 등록
 * - 점수순(테트리스/벽돌깨기) 및 생존시간순(닷지 미사일피하기) 정렬 지원
 * - 금·은·동 메달 엠블럼 및 반응형 명예의 전당 리더보드 UI 렌더링
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const GameRanking = {};

  // 초기 도전 욕구를 자극하는 기본 레전드 랭커 데이터 (게임 오픈 시 썰렁함 방지)
  const DEFAULT_LEADERBOARDS = {
    'game-tetris': [
      { nickname: '신도림테트신', score: 38400, date: '2026.10.15', display: '38,400점' },
      { nickname: 'T스핀마스터', score: 26500, date: '2026.10.16', display: '26,500점' },
      { nickname: '손가락빛의속도', score: 19200, date: '2026.10.18', display: '19,200점' },
      { nickname: '새벽두시블록', score: 14800, date: '2026.10.19', display: '14,800점' },
      { nickname: '초보탈출넘버원', score: 8500, date: '2026.10.20', display: '8,500점' }
    ],
    'game-dodge': [
      { nickname: '네오매트릭스', score: 104.82, date: '2026.10.16', display: '01:44.82' },
      { nickname: '총알피하기장인', score: 82.45, date: '2026.10.17', display: '01:22.45' },
      { nickname: '빛의회피술', score: 65.30, date: '2026.10.18', display: '01:05.30' },
      { nickname: '광화문생존왕', score: 48.77, date: '2026.10.19', display: '00:48.77' },
      { nickname: '미사일사이로', score: 32.15, date: '2026.10.20', display: '00:32.15' }
    ],
    'game-typing': [
      { nickname: '한메타자전설', score: 18500, date: '2026.10.16', display: '18,500점' },
      { nickname: '번개손가락', score: 14200, date: '2026.10.17', display: '14,200점' },
      { nickname: '산성비소방관', score: 11000, date: '2026.10.18', display: '11,000점' },
      { nickname: '타자속독왕', score: 8200, date: '2026.10.19', display: '8,200점' },
      { nickname: '키보드워리어', score: 5500, date: '2026.10.20', display: '5,500점' }
    ],
    'game-brick-breaker': [
      { nickname: '알카노이드신', score: 28500, date: '2026.10.16', display: '28,500점' },
      { nickname: '벽돌파괴자', score: 21400, date: '2026.10.17', display: '21,400점' },
      { nickname: '레이저장인', score: 16800, date: '2026.10.18', display: '16,800점' },
      { nickname: '멀티볼마스터', score: 12200, date: '2026.10.19', display: '12,200점' },
      { nickname: '빛의반사각', score: 7600, date: '2026.10.20', display: '7,600점' }
    ]
  };

  function getStorageKey(gameId) {
    return `simulab_ranking_${gameId}_v1`;
  }

  /**
   * 해당 게임의 현재 1~10위 랭킹 목록 가져오기
   */
  GameRanking.getRankings = function (gameId) {
    const key = getStorageKey(gameId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const defaults = DEFAULT_LEADERBOARDS[gameId] || [];
      localStorage.setItem(key, JSON.stringify(defaults));
      return [...defaults];
    }
    try {
      return JSON.parse(raw) || [];
    } catch (e) {
      return [];
    }
  };

  /**
   * 점수가 TOP 10 이내에 드는지 판별
   * @param {string} gameId - 'game-tetris' or 'game-dodge'
   * @param {number} score - 테트리스: 점수 / 닷지: 생존 초 (예: 45.67)
   * @returns {{ isTop10: boolean, expectedRank: number }}
   */
  GameRanking.checkRank = function (gameId, score) {
    if (score <= 0) return { isTop10: false, expectedRank: -1 };
    const list = GameRanking.getRankings(gameId);

    // 높은 점수(또는 긴 시간)가 높은 순위
    let rank = 1;
    for (let i = 0; i < list.length; i++) {
      if (score <= list[i].score) {
        rank++;
      } else {
        break;
      }
    }

    if (rank <= 10) {
      return { isTop10: true, expectedRank: rank };
    }
    // 리스트가 아직 10개 미만이면 10위 안에 듦
    if (list.length < 10) {
      return { isTop10: true, expectedRank: list.length + 1 };
    }

    return { isTop10: false, expectedRank: -1 };
  };

  /**
   * 랭킹 등록
   * @param {string} gameId 
   * @param {string} nickname 
   * @param {number} score 
   * @param {string} displayValue 
   * @returns {number} 확정된 순위 (1~10)
   */
  GameRanking.saveRecord = function (gameId, nickname, score, displayValue) {
    const list = GameRanking.getRankings(gameId);
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const cleanNick = (nickname || '무명용사').trim().substring(0, 8);

    list.push({
      nickname: cleanNick,
      score: Number(score),
      date: dateStr,
      display: displayValue,
      isNew: true // 새 기록 하이라이트 플래그
    });

    // 내림차순 정렬 (높은 점수 / 긴 시간 순)
    list.sort((a, b) => b.score - a.score);

    // 상위 10개만 유지
    const top10 = list.slice(0, 10);
    const rankIndex = top10.findIndex((item) => item.isNew);

    // 저장 시 플래그 정리
    const toSave = top10.map((item) => ({
      nickname: item.nickname,
      score: item.score,
      date: item.date,
      display: item.display
    }));

    localStorage.setItem(getStorageKey(gameId), JSON.stringify(toSave));
    return rankIndex !== -1 ? rankIndex + 1 : 10;
  };

  /**
   * 화면의 랭킹 리더보드 테이블 렌더링
   */
  GameRanking.renderBoard = function (containerEl, gameId) {
    if (!containerEl) return;
    const list = GameRanking.getRankings(gameId);

    const medalIcons = ['🥇', '🥈', '🥉'];
    let html = `
      <div class="ranking-board-card">
        <div class="ranking-board-header">
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <span style="font-size:1.2rem;">🏆</span>
            <span style="font-size:0.95rem; font-weight:850; color:var(--text-primary);">명예의 전당 TOP 10</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">실시간 랭킹</span>
        </div>
        <div class="ranking-list-body">
    `;

    if (list.length === 0) {
      html += `<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">아직 등록된 랭킹 기록이 없습니다.<br/>첫 번째 랭커가 되어보세요!</div>`;
    } else {
      list.forEach((item, idx) => {
        const rank = idx + 1;
        const medal = rank <= 3 ? medalIcons[rank - 1] : `<span class="rank-num">${rank}</span>`;
        const topClass = rank === 1 ? 'rank-row-top1' : (rank <= 3 ? 'rank-row-top3' : '');

        html += `
          <div class="ranking-row ${topClass}">
            <div class="ranking-col-rank">${medal}</div>
            <div class="ranking-col-nick" title="${item.nickname}">${item.nickname}</div>
            <div class="ranking-col-score">${item.display || item.score}</div>
            <div class="ranking-col-date">${item.date}</div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    containerEl.innerHTML = html;
  };

  global.GameRanking = GameRanking;
})(typeof window !== 'undefined' ? window : globalThis);
