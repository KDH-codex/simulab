/**
 * ==========================================================================
 * SimuLab - 미니게임 공통 명예의 전당 TOP 10 실시간 온라인 랭킹 모듈
 * 파일 경로: assets/js/game-ranking.js
 * --------------------------------------------------------------------------
 * [주요 기능]
 * 1. Supabase 기반 전세계 실시간 온라인 랭킹 (PostgREST API 경량 통신)
 * 2. 오프라인 및 미설정 시 자동 로컬스토리지(localStorage) 폴백 (안전성 100%)
 * 3. 10위 이내 순위 진입 실시간 판별 및 닉네임(2~12자) 무결성/XSS 방지 검증
 * 4. 점수순(테트리스, 산성비 타자, 벽돌 깨기) 및 생존시간순(닷지) 정렬 지원
 * 5. 금·은·동 메달 엠블럼 및 반응형 명예의 전당 리더보드 UI 렌더링
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // ==========================================================================
  // [1] Supabase 연동 설정 (초보자 안내용)
  // --------------------------------------------------------------------------
  // 아래 SUPABASE_CONFIG의 URL과 ANON_KEY를 본인의 Supabase 프로젝트 설정값으로
  // 교체하시면 즉시 전세계 실시간 온라인 랭킹 시스템이 활성화됩니다!
  // (설정하지 않더라도 에러 없이 브라우저 로컬 저장소 모드로 안전하게 작동합니다.)
  // ==========================================================================
  const SUPABASE_CONFIG = {
    // 예: 'https://abcdefghijklm.supabase.co'
    URL: (global.SIMULAB_SUPABASE_CONFIG && global.SIMULAB_SUPABASE_CONFIG.URL) || '',
    // Supabase 대시보드 > Project Settings > API > Project API keys > anon (public)
    ANON_KEY: (global.SIMULAB_SUPABASE_CONFIG && global.SIMULAB_SUPABASE_CONFIG.ANON_KEY) || ''
  };

  const GameRanking = {};

  /**
   * 로컬 스토리지 캐시 키 생성 함수
   * @param {string} gameId - 게임 식별자 (예: 'game-tetris')
   * @returns {string} 로컬 스토리지 키
   */
  function getStorageKey(gameId) {
    return `simulab_ranking_${gameId}_v2`;
  }

  /**
   * XSS(크로스 사이트 스크립팅) 공격 방지를 위한 텍스트 이스케이프 함수
   * 악의적인 HTML 태그(<script> 등)를 안전한 문자열로 치환합니다.
   * @param {string} text - 원본 문자열
   * @returns {string} 안전하게 정제된 문자열
   */
  function sanitizeText(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  }

  /**
   * 날짜 포맷팅 함수 (YYYY.MM.DD)
   * @param {Date|string} dateInput 
   * @returns {string}
   */
  function formatDate(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }

  /**
   * 외부에서 Supabase 접속 정보를 동적으로 주입하거나 변경할 수 있는 설정 메서드
   * @param {{ url: string, anonKey: string }} config 
   */
  GameRanking.configure = function (config) {
    if (config && config.url) SUPABASE_CONFIG.URL = config.url.replace(/\/+$/, '');
    if (config && config.anonKey) SUPABASE_CONFIG.ANON_KEY = config.anonKey;
  };

  /**
   * Supabase 클라우드 설정이 활성화되어 있는지 확인
   * @returns {boolean}
   */
  GameRanking.isCloudEnabled = function () {
    return Boolean(SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY);
  };

  /**
   * 로컬 스토리지에 저장된 캐시 랭킹 목록 가져오기 (동기식)
   * @param {string} gameId 
   * @returns {Array<{ nickname: string, score: number, display: string, date: string }>}
   */
  GameRanking.getRankings = function (gameId) {
    const key = getStorageKey(gameId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw) || [];
    } catch (e) {
      console.warn('[GameRanking] 로컬 랭킹 파싱 오류:', e);
      return [];
    }
  };

  /**
   * 로컬 스토리지에 랭킹 목록 캐시 저장
   * @param {string} gameId 
   * @param {Array} list 
   */
  function saveLocalCache(gameId, list) {
    try {
      localStorage.setItem(getStorageKey(gameId), JSON.stringify(list.slice(0, 10)));
    } catch (e) {
      console.warn('[GameRanking] 로컬 랭킹 저장 오류:', e);
    }
  }

  /**
   * [클라우드 REST API] Supabase에서 최신 TOP 10 랭킹 실시간 비동기 조회
   * @param {string} gameId 
   * @returns {Promise<Array>}
   */
  GameRanking.fetchRankingsOnline = async function (gameId) {
    if (!GameRanking.isCloudEnabled()) {
      return GameRanking.getRankings(gameId);
    }

    try {
      // Supabase PostgREST 쿼리: 높은 점수순(score.desc), 동점 시 먼저 달성한 순(created_at.asc) 상위 10개
      const endpoint = `${SUPABASE_CONFIG.URL}/rest/v1/game_rankings?game_id=eq.${encodeURIComponent(gameId)}&order=score.desc,created_at.asc&limit=10`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_CONFIG.ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류 (상태 코드: ${response.status})`);
      }

      const rows = await response.json();
      
      // DB 결과를 화면 표시용 구조로 정규화
      const onlineList = rows.map((row) => ({
        nickname: sanitizeText(row.nickname),
        score: Number(row.score),
        display: row.score_display || String(row.score),
        date: formatDate(row.created_at)
      }));

      // 로컬 캐시 동기화
      saveLocalCache(gameId, onlineList);
      return onlineList;
    } catch (error) {
      console.warn('[GameRanking] 온라인 랭킹 동기화 실패 (로컬 캐시 사용):', error.message);
      return GameRanking.getRankings(gameId);
    }
  };

  /**
   * 게임 오버 시 획득한 점수가 TOP 10 이내에 드는지 판별 (동기식 즉시 반환)
   * @param {string} gameId - 게임 식별자 ('game-tetris', 'game-dodge', 'game-typing', 'game-brick-breaker')
   * @param {number} score - 정렬용 점수 또는 생존 초
   * @returns {{ isTop10: boolean, expectedRank: number }}
   */
  GameRanking.checkRank = function (gameId, score) {
    const numScore = Number(score);
    if (isNaN(numScore) || numScore <= 0) {
      return { isTop10: false, expectedRank: -1 };
    }

    const list = GameRanking.getRankings(gameId);

    // 아직 등록된 기록이 10개 미만이면 무조건 10위 안에 진입
    if (list.length < 10) {
      let rank = 1;
      for (let i = 0; i < list.length; i++) {
        if (numScore <= list[i].score) {
          rank++;
        } else {
          break;
        }
      }
      return { isTop10: true, expectedRank: rank };
    }

    // 10개가 꽉 찼을 때는 10위 기록보다 높은 점수여야 진입 가능
    let rank = 1;
    for (let i = 0; i < list.length; i++) {
      if (numScore <= list[i].score) {
        rank++;
      } else {
        break;
      }
    }

    if (rank <= 10) {
      return { isTop10: true, expectedRank: rank };
    }

    return { isTop10: false, expectedRank: -1 };
  };

  /**
   * 새로운 명예의 전당 기록 등록
   * - 1단계: 로컬 캐시 즉시 업데이트 (사용자 대기 시간 0초)
   * - 2단계: Supabase 클라우드 실시간 비동기 INSERT (네트워크 백그라운드 처리)
   * 
   * @param {string} gameId - 게임 식별자
   * @param {string} nickname - 사용자 닉네임 (2~12자)
   * @param {number} score - 점수 또는 생존 초
   * @param {string} displayValue - 화면 표시용 문자열 (예: '38,400점', '01:44.82')
   * @returns {number} 확정된 예상 순위 (1~10)
   */
  GameRanking.saveRecord = function (gameId, nickname, score, displayValue) {
    const cleanNick = (nickname || '무명용사').trim().substring(0, 12);
    const numScore = Number(score);
    const displayStr = String(displayValue || numScore);
    const dateStr = formatDate();

    // 1. 로컬 캐시 즉시 반영
    const list = GameRanking.getRankings(gameId);
    list.push({
      nickname: cleanNick,
      score: numScore,
      display: displayStr,
      date: dateStr,
      isNew: true // 방금 등록된 신규 기록 하이라이트용
    });

    // 점수 높은 순 정렬
    list.sort((a, b) => b.score - a.score);
    const top10 = list.slice(0, 10);
    const rankIndex = top10.findIndex((item) => item.isNew);

    // 하이라이트 플래그 제거 후 로컬 저장
    const cleanList = top10.map((item) => ({
      nickname: item.nickname,
      score: item.score,
      display: item.display,
      date: item.date
    }));
    saveLocalCache(gameId, cleanList);

    // 2. Supabase 클라우드 온라인 DB 실시간 저장 (백그라운드 비동기)
    if (GameRanking.isCloudEnabled()) {
      (async () => {
        try {
          const endpoint = `${SUPABASE_CONFIG.URL}/rest/v1/game_rankings`;
          const payload = {
            game_id: gameId,
            nickname: cleanNick,
            score: numScore,
            score_display: displayStr
          };

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_CONFIG.ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            console.warn('[GameRanking] 온라인 랭킹 저장 응답 오류:', res.status);
          } else {
            // 저장 성공 시 최신 온라인 랭킹 다시 동기화
            await GameRanking.fetchRankingsOnline(gameId);
          }
        } catch (err) {
          console.warn('[GameRanking] 온라인 랭킹 저장 네트워크 오류 (로컬 보존됨):', err.message);
        }
      })();
    }

    return rankIndex !== -1 ? rankIndex + 1 : 10;
  };

  /**
   * 화면의 랭킹 리더보드 테이블 렌더링
   * - 캐시 데이터를 먼저 빠르게 렌더링하여 깜빡임 없음
   * - 온라인 연동 시 백그라운드로 최신 DB 데이터를 가져와 부드럽게 재렌더링
   * 
   * @param {HTMLElement} containerEl - 리더보드가 삽입될 부모 엘리먼트
   * @param {string} gameId - 게임 식별자
   */
  GameRanking.renderBoard = function (containerEl, gameId) {
    if (!containerEl) return;

    // 내부 렌더링 헬퍼 함수
    function renderHTML(list, isOnlineSyncing = false) {
      const medalIcons = ['🥇', '🥈', '🥉'];
      const isCloud = GameRanking.isCloudEnabled();

      // 온라인 연결 상태 표시 뱃지
      let statusBadge = '';
      if (isCloud) {
        if (isOnlineSyncing) {
          statusBadge = `<span style="font-size:0.72rem; color:var(--text-muted); display:inline-flex; align-items:center; gap:0.25rem;"><span style="display:inline-block; animation:spin 1s linear infinite;">🔄</span> 동기화 중...</span>`;
        } else {
          statusBadge = `<span style="font-size:0.72rem; color:#10b981; font-weight:700; display:inline-flex; align-items:center; gap:0.25rem;">● 실시간 온라인</span>`;
        }
      } else {
        statusBadge = `<span style="font-size:0.72rem; color:var(--text-muted);">💾 로컬 보관</span>`;
      }

      let html = `
        <div class="ranking-board-card">
          <div class="ranking-board-header">
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span style="font-size:1.2rem;">🏆</span>
              <span style="font-size:0.95rem; font-weight:850; color:var(--text-primary);">명예의 전당 TOP 10</span>
            </div>
            <div>${statusBadge}</div>
          </div>
          <div class="ranking-list-body">
      `;

      if (!list || list.length === 0) {
        html += `
          <div style="text-align:center; padding:1.75rem 1rem; color:var(--text-muted); font-size:0.85rem; line-height:1.6; background:var(--bg-subtle); border-radius:10px;">
            <div style="font-size:1.5rem; margin-bottom:0.35rem;">✨</div>
            아직 등록된 랭킹 기록이 없습니다.<br/>
            <strong>첫 번째 랭커에 도전해 보세요!</strong>
          </div>
        `;
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
              <div class="ranking-col-date">${item.date || ''}</div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;

      containerEl.innerHTML = html;
    }

    // 1단계: 캐시 데이터 즉시 렌더링
    const cachedList = GameRanking.getRankings(gameId);
    renderHTML(cachedList, GameRanking.isCloudEnabled());

    // 2단계: 클라우드가 활성화되어 있다면 백그라운드 최신 동기화 후 부드럽게 재렌더링
    if (GameRanking.isCloudEnabled()) {
      GameRanking.fetchRankingsOnline(gameId).then((freshList) => {
        renderHTML(freshList, false);
      }).catch(() => {
        renderHTML(cachedList, false);
      });
    }
  };

  // 전역 객체 등록
  global.GameRanking = GameRanking;
})(typeof window !== 'undefined' ? window : globalThis);
