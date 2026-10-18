/**
 * ==========================================================================
 * SimuLab Analytics Hub - 인터랙티브 사다리타기 게임 Canvas UI 컨트롤러
 * 파일 경로: tools/ladder-draw-game/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 Canvas 2D 애니메이션 원리 설명]
 * 1) 고해상도(Retina Display) 보정:
 *    - 스마트폰과 고해상도 모니터에서 선이 흐려지지 않도록 window.devicePixelRatio
 *      배수만큼 캔버스 해상도를 확대하고 CSS 크기로 압축 렌더링합니다.
 * 2) requestAnimationFrame 기반 경로 애니메이션:
 *    - 출발점에서 출발하여 가로선 분기점(Node) 사이를 일정 속도로 보간(Interpolation)하며
 *      움직이는 공(Marker)과 지나온 자취를 그립니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 1. 필요한 DOM 요소 캐싱
  const canvas = document.getElementById('ladder-canvas');
  const countDisplay = document.getElementById('participant-count');
  const btnCountMinus = document.getElementById('btn-count-minus');
  const btnCountPlus = document.getElementById('btn-count-plus');
  const inputsContainer = document.getElementById('inputs-container');

  const btnStartGame = document.getElementById('btn-start-game');
  const btnShowAll = document.getElementById('btn-show-all');
  const btnResetLadder = document.getElementById('btn-reset-ladder');
  const btnCopyResult = document.getElementById('btn-copy-result');

  // 프리셋 버튼들
  const presetButtons = document.querySelectorAll('.btn-preset');

  // 배너 및 KPI 카드 DOM
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictText = document.getElementById('verdict-text');
  const kpiTotalPlayers = document.getElementById('kpi-total-players');
  const kpiTotalPrizes = document.getElementById('kpi-total-prizes');
  const kpiLadderLayers = document.getElementById('kpi-ladder-layers');
  const kpiGameStatus = document.getElementById('kpi-game-status');

  // 결과 테이블 DOM
  const resultsContainer = document.getElementById('results-container');
  const resultsTableBody = document.getElementById('results-table-body');

  // 엔진 참조
  const engine = global.SimuLab && global.SimuLab.LadderGame;
  if (!engine) {
    console.error('[LadderGame] 엔진 모듈(logic.js)이 먼저 로드되지 않았습니다.');
    return;
  }

  // 참가자별 고유 테마 색상 팔레트 (12색)
  const COLORS = [
    '#3b82f6', // 파랑
    '#ec4899', // 핑크
    '#10b981', // 에메랄드
    '#f59e0b', // 앰버
    '#8b5cf6', // 퍼플
    '#06b6d4', // 시안
    '#ef4444', // 레드
    '#14b8a6', // 틸
    '#f97316', // 오렌지
    '#6366f1', // 인디고
    '#84cc16', // 라임
    '#a855f7', // 바이올렛
  ];

  // 게임 상태 변수
  let currentCount = 4;
  let currentParticipants = [...engine.DEFAULT_SETTINGS.participants];
  let currentPrizes = [...engine.DEFAULT_SETTINGS.prizes];
  let ladderData = null;
  let activeAnimationId = null;
  let isGameOver = false;

  /**
   * 2. 참가자 및 벌칙 인풋 필드 동적 생성
   */
  function renderInputFields() {
    if (!inputsContainer) return;
    inputsContainer.innerHTML = '';

    for (let i = 0; i < currentCount; i++) {
      const row = document.createElement('div');
      row.className = 'player-input-row';
      row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;';

      const color = COLORS[i % COLORS.length];

      row.innerHTML = `
        <span class="player-color-dot" style="width: 14px; height: 14px; border-radius: 50%; background: ${color}; flex-shrink: 0;"></span>
        <input type="text" class="form-input player-name-input" data-index="${i}" value="${currentParticipants[i] || `참가자 ${i + 1}`}" placeholder="이름" style="flex: 1; padding: 0.45rem 0.65rem; font-size: 0.88rem;">
        <span style="color: var(--text-muted); font-size: 0.8rem;">➔</span>
        <input type="text" class="form-input player-prize-input" data-index="${i}" value="${currentPrizes[i] || (i === 0 ? '당첨(벌칙)' : '통과')}" placeholder="결과/벌칙" style="flex: 1; padding: 0.45rem 0.65rem; font-size: 0.88rem;">
      `;

      inputsContainer.appendChild(row);
    }

    // 인풋 변경 시 실시간 반영
    const nameInputs = inputsContainer.querySelectorAll('.player-name-input');
    nameInputs.forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.index);
        currentParticipants[idx] = e.target.value;
        drawLadderStatic();
      });
    });

    const prizeInputs = inputsContainer.querySelectorAll('.player-prize-input');
    prizeInputs.forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.index);
        currentPrizes[idx] = e.target.value;
        drawLadderStatic();
      });
    });

    updateKpi();
  }

  /**
   * 3. KPI 및 배너 텍스트 갱신
   */
  function updateKpi() {
    if (countDisplay) countDisplay.textContent = `${currentCount}명`;
    if (kpiTotalPlayers) kpiTotalPlayers.textContent = `${currentCount}명`;
    if (kpiTotalPrizes) kpiTotalPrizes.textContent = `${currentCount}개`;
    if (kpiLadderLayers) kpiLadderLayers.textContent = `${ladderData ? ladderData.layers : currentCount + 2}단`;
    if (kpiGameStatus) {
      kpiGameStatus.textContent = isGameOver ? '추첨 완료 🎉' : '준비 완료';
      kpiGameStatus.style.color = isGameOver ? '#10b981' : '#3b82f6';
    }
  }

  /**
   * 4. 사다리 데이터 생성
   */
  function initLadder() {
    if (activeAnimationId) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
    }
    isGameOver = false;

    // 인풋의 최신 값 동기화
    syncInputsFromDom();

    ladderData = engine.calculateLadderGame(currentParticipants, currentPrizes);
    updateKpi();

    if (verdictBanner) verdictBanner.className = 'verdict-banner verdict-neutral';
    if (verdictText) verdictText.textContent = '사다리가 새롭게 생성되었습니다! [사다리 타기 시작] 버튼을 누르면 추첨이 진행됩니다.';
    if (resultsContainer) resultsContainer.style.display = 'none';

    drawLadderStatic();
  }

  function syncInputsFromDom() {
    if (!inputsContainer) return;
    const nameInputs = inputsContainer.querySelectorAll('.player-name-input');
    const prizeInputs = inputsContainer.querySelectorAll('.player-prize-input');

    currentParticipants = [];
    currentPrizes = [];

    nameInputs.forEach((inp) => currentParticipants.push(inp.value.trim() || '무명'));
    prizeInputs.forEach((inp) => currentPrizes.push(inp.value.trim() || '통과'));
  }

  /**
   * 5. Canvas 정적 사다리 그리기 (고해상도 레티나 지원)
   */
  function drawLadderStatic(highlightPaths = []) {
    if (!canvas || !ladderData) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const width = rect.width || 600;
    const height = Math.max(380, width * 0.7);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const cols = ladderData.count;
    const layers = ladderData.layers;
    const paddingX = Math.max(40, width / (cols * 2));
    const startY = 60;
    const endY = height - 60;
    const usableWidth = width - paddingX * 2;
    const colSpacing = usableWidth / (cols - 1);
    const rowSpacing = (endY - startY) / layers;

    // 1) 세로선(레일) 그리기
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (let c = 0; c < cols; c++) {
      const x = paddingX + c * colSpacing;
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();

      // 상단 참가자 이름 배지
      const color = COLORS[c % COLORS.length];
      drawBadge(ctx, x, startY - 24, currentParticipants[c], color, true);

      // 하단 벌칙/결과 배지 (게임 종료 전에는 '?'로 신비감 부여, 종료 후 공개)
      const prizeText = isGameOver ? currentPrizes[c] : '?';
      drawBadge(ctx, x, endY + 24, prizeText, isGameOver ? '#64748b' : '#94a3b8', false);
    }

    // 2) 가로선(Rung) 그리기
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    for (let r = 0; r < layers; r++) {
      const y = startY + (r + 0.5) * rowSpacing;
      for (let c = 0; c < cols - 1; c++) {
        if (ladderData.rungs[r][c]) {
          const x1 = paddingX + c * colSpacing;
          const x2 = paddingX + (c + 1) * colSpacing;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
        }
      }
    }

    // 3) 완주된 경로 하이라이트 그리기
    if (highlightPaths && highlightPaths.length > 0) {
      highlightPaths.forEach((item) => {
        const color = COLORS[item.startIndex % COLORS.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();

        const pNodes = item.pathNodes;
        for (let i = 0; i < pNodes.length; i++) {
          const px = paddingX + pNodes[i].col * colSpacing;
          let py = startY;
          if (pNodes[i].layer < layers) {
            py = startY + (pNodes[i].layer + 0.5) * rowSpacing;
          } else {
            py = endY;
          }

          if (i === 0) {
            ctx.moveTo(px, startY);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      });
    }
  }

  /**
   * 상/하단 텍스트 배지 그리기
   */
  function drawBadge(ctx, x, y, text, bgColor, isTop) {
    ctx.save();
    ctx.font = 'bold 12px "Pretendard", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const safeText = String(text || '').slice(0, 7);
    const textWidth = ctx.measureText(safeText).width;
    const badgeW = Math.max(48, textWidth + 16);
    const badgeH = 24;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x - badgeW / 2, y - badgeH / 2, badgeW, badgeH, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(safeText, x, y);
    ctx.restore();
  }

  /**
   * 6. 전체 결과 즉시 보기 (애니메이션 없이 한눈에 표시)
   */
  function showAllResults() {
    if (!ladderData) initLadder();
    if (activeAnimationId) cancelAnimationFrame(activeAnimationId);

    isGameOver = true;
    drawLadderStatic(ladderData.results);
    renderResultsTable();

    if (verdictBanner) verdictBanner.className = 'verdict-banner verdict-accent';
    if (verdictText) {
      verdictText.innerHTML = `
        🎉 사다리타기 추첨이 완료되었습니다! 아래 결과표에서 각 참가자의 결과를 확인하세요.
      `;
    }
    updateKpi();
  }

  /**
   * 7. 순차적 사다리 타기 애니메이션
   */
  function startAnimatedLadder() {
    if (!ladderData) initLadder();
    if (activeAnimationId) cancelAnimationFrame(activeAnimationId);

    isGameOver = false;
    let currentParticipantIndex = 0;
    const total = ladderData.results.length;
    const completedPaths = [];

    function animateSingle(pIdx, onComplete) {
      const traceItem = ladderData.results[pIdx];
      const pNodes = traceItem.pathNodes;
      let nodeStep = 0;
      let progress = 0;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 600;
      const height = Math.max(380, width * 0.7);
      const cols = ladderData.count;
      const layers = ladderData.layers;
      const paddingX = Math.max(40, width / (cols * 2));
      const startY = 60;
      const endY = height - 60;
      const usableWidth = width - paddingX * 2;
      const colSpacing = usableWidth / (cols - 1);
      const rowSpacing = (endY - startY) / layers;

      function step() {
        if (nodeStep >= pNodes.length - 1) {
          completedPaths.push(traceItem);
          onComplete();
          return;
        }

        progress += 0.08; // 이동 속도
        if (progress >= 1) {
          progress = 0;
          nodeStep++;
        }

        // 현재 캔버스 정적 사다리 + 기완료 경로 다시 그리기
        drawLadderStatic(completedPaths);

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // 현재 진행 중인 경로 선 그리기
        const color = COLORS[pIdx % COLORS.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(paddingX + pNodes[0].col * colSpacing, startY);

        for (let i = 0; i <= nodeStep; i++) {
          const nx = paddingX + pNodes[i].col * colSpacing;
          const ny = pNodes[i].layer < layers ? startY + (pNodes[i].layer + 0.5) * rowSpacing : endY;
          ctx.lineTo(nx, ny);
        }

        // 현재 보간 중인 위치
        const currNode = pNodes[nodeStep];
        const nextNode = pNodes[nodeStep + 1];
        if (nextNode) {
          const cx1 = paddingX + currNode.col * colSpacing;
          const cy1 = currNode.layer < layers ? startY + (currNode.layer + 0.5) * rowSpacing : endY;
          const cx2 = paddingX + nextNode.col * colSpacing;
          const cy2 = nextNode.layer < layers ? startY + (nextNode.layer + 0.5) * rowSpacing : endY;

          const curX = cx1 + (cx2 - cx1) * progress;
          const curY = cy1 + (cy2 - cy1) * progress;
          ctx.lineTo(curX, curY);
          ctx.stroke();

          // 이동하는 공(마커) 그리기
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(curX, curY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }

        activeAnimationId = requestAnimationFrame(step);
      }

      activeAnimationId = requestAnimationFrame(step);
    }

    function runNext() {
      if (currentParticipantIndex < total) {
        animateSingle(currentParticipantIndex, () => {
          currentParticipantIndex++;
          runNext();
        });
      } else {
        isGameOver = true;
        drawLadderStatic(ladderData.results);
        renderResultsTable();
        updateKpi();
        if (verdictBanner) verdictBanner.className = 'verdict-banner verdict-accent';
        if (verdictText) {
          verdictText.innerHTML = `
            🎉 모든 참가자가 사다리를 완주했습니다! 아래 결과표를 확인하세요.
          `;
        }
      }
    }

    runNext();
  }

  /**
   * 8. 결과 테이블 렌더링
   */
  function renderResultsTable() {
    if (!resultsTableBody || !resultsContainer || !ladderData) return;
    resultsTableBody.innerHTML = '';

    ladderData.results.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const color = COLORS[item.startIndex % COLORS.length];

      tr.innerHTML = `
        <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); text-align: center;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color}; margin-right: 0.35rem;"></span>
          <strong>${item.participant}</strong>
        </td>
        <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); text-align: center; color: var(--text-muted);">
          ➔
        </td>
        <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); text-align: center; font-weight: 800; color: #e11d48;">
          ${item.prize}
        </td>
      `;

      resultsTableBody.appendChild(tr);
    });

    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * 9. 결과 텍스트 클립보드 복사
   */
  function copyResultsToClipboard() {
    if (!ladderData || !isGameOver) {
      alert('먼저 사다리타기를 진행하여 결과를 확인해주세요!');
      return;
    }

    let text = `🎯 [SimuLab 사다리타기 결과]\n-------------------------\n`;
    ladderData.results.forEach((r, i) => {
      text += `${i + 1}. ${r.participant} ➔ ${r.prize}\n`;
    });
    text += `-------------------------\n링크: ${window.location.href}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('🎉 사다리타기 결과가 클립보드에 복사되었습니다!\n단톡방이나 메신저에 바로 붙여넣기(Ctrl+V) 하세요.');
      }).catch(() => {
        prompt('아래 텍스트를 복사하세요:', text);
      });
    } else {
      prompt('아래 텍스트를 복사하세요:', text);
    }
  }

  /**
   * 10. 프리셋 적용
   */
  function applyPreset(key) {
    const preset = engine.PRESETS[key];
    if (!preset) return;

    currentCount = preset.participants.length;
    currentParticipants = [...preset.participants];
    currentPrizes = [...preset.prizes];

    renderInputFields();
    initLadder();
  }

  // 인원 증감 버튼
  if (btnCountMinus) {
    btnCountMinus.addEventListener('click', () => {
      if (currentCount > 2) {
        currentCount--;
        currentParticipants = currentParticipants.slice(0, currentCount);
        currentPrizes = currentPrizes.slice(0, currentCount);
        renderInputFields();
        initLadder();
      }
    });
  }

  if (btnCountPlus) {
    btnCountPlus.addEventListener('click', () => {
      if (currentCount < 12) {
        currentCount++;
        currentParticipants.push(`참가자 ${currentCount}`);
        currentPrizes.push('통과');
        renderInputFields();
        initLadder();
      }
    });
  }

  // 프리셋 버튼 리스너
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const presetKey = e.currentTarget.dataset.preset;
      presetButtons.forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      applyPreset(presetKey);
    });
  });

  // 게임 조작 버튼 리스너
  if (btnStartGame) {
    btnStartGame.addEventListener('click', startAnimatedLadder);
  }

  if (btnShowAll) {
    btnShowAll.addEventListener('click', showAllResults);
  }

  if (btnResetLadder) {
    btnResetLadder.addEventListener('click', initLadder);
  }

  if (btnCopyResult) {
    btnCopyResult.addEventListener('click', copyResultsToClipboard);
  }

  // 창 크기 조절 시 리사이즈 대응
  window.addEventListener('resize', () => {
    drawLadderStatic(isGameOver && ladderData ? ladderData.results : []);
  });

  // 초기 로드
  document.addEventListener('DOMContentLoaded', () => {
    renderInputFields();
    initLadder();
  });

})(typeof window !== 'undefined' ? window : globalThis);
