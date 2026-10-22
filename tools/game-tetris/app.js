/**
 * ==========================================================================
 * SimuLab - 클래식 레트로 테트리스 UI 컨트롤러 & 렌더링 루프 (app.js)
 * 파일 경로: tools/game-tetris/app.js
 * --------------------------------------------------------------------------
 * - Canvas 2D 고해상도 렌더링 (블록 입체감 및 고스트 블록 가이드)
 * - Web Audio API 기반 레트로 신디사이저 효과음 (외부 파일 없이 즉시 재생)
 * - 키보드 이벤트 및 모바일 가상 터치패드 지원 (반복 이동 딜레이 최적화)
 * - 로컬스토리지 최고 점수 기록 및 게임 오버/일시정지 제어
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. 캔버스 및 컨텍스트 초기화
  const canvas = document.getElementById('tetrisCanvas');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('nextCanvas');
  const nextCtx = nextCanvas.getContext('2d');
  const holdCanvas = document.getElementById('holdCanvas');
  const holdCtx = holdCanvas.getContext('2d');

  // DOM 통계 및 모달 요소
  const statScore = document.getElementById('statScore');
  const statHighScore = document.getElementById('statHighScore');
  const statLevel = document.getElementById('statLevel');
  const statLines = document.getElementById('statLines');
  const gameOverlay = document.getElementById('gameOverlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayScore = document.getElementById('overlayScore');
  const btnOverlayAction = document.getElementById('btnOverlayAction');

  // 명예의 전당 TOP 10 랭킹 요소
  const rankingBoardContainer = document.getElementById('rankingBoardContainer');
  const rankModal = document.getElementById('rankModal');
  const rankModalScore = document.getElementById('rankModalScore');
  const rankModalSub = document.getElementById('rankModalSub');
  const rankForm = document.getElementById('rankForm');
  const rankNickname = document.getElementById('rankNickname');
  const btnRankCancel = document.getElementById('btnRankCancel');

  // 랭킹 리더보드 렌더링
  function updateLeaderboard() {
    if (window.GameRanking && rankingBoardContainer) {
      window.GameRanking.renderBoard(rankingBoardContainer, 'game-tetris');
    }
  }
  updateLeaderboard();

  // 컨트롤 버튼 요소
  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnRestart = document.getElementById('btnRestart');
  const btnSoundToggle = document.getElementById('btnSoundToggle');

  // 모바일 터치 버튼
  const touchLeft = document.getElementById('touchLeft');
  const touchRight = document.getElementById('touchRight');
  const touchRotate = document.getElementById('touchRotate');
  const touchHardDrop = document.getElementById('touchHardDrop');
  const touchHold = document.getElementById('touchHold');

  // 상수 및 블록 크기
  const BLOCK_SIZE = canvas.width / window.TetrisLogic.COLS; // 280 / 10 = 28px
  const STORAGE_HIGH_SCORE_KEY = 'simulab_tetris_highscore_v1';

  // 2. 게임 상태 변수
  let board = window.TetrisLogic.createEmptyBoard();
  let bagGenerator = window.TetrisLogic.createBagGenerator();
  let currentPiece = null;
  let nextPiece = null;
  let holdPiece = null;
  let canHold = true; // 턴당 1회만 홀드 가능

  let score = 0;
  let highScore = Number(localStorage.getItem(STORAGE_HIGH_SCORE_KEY)) || 0;
  let level = 1;
  let lines = 0;

  let isPlaying = false;
  let isPaused = false;
  let isGameOver = false;

  let dropCounter = 0;
  let lastTime = 0;
  let soundEnabled = true;

  // 3. Web Audio API 레트로 사운드 효과 엔진
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type = 'sine', duration = 0.08, vol = 0.15) {
    if (!soundEnabled) return;
    try {
      const actx = getAudioContext();
      if (!actx) return;
      const osc = actx.createOscillator();
      const gain = actx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, actx.currentTime);

      gain.gain.setValueAtTime(vol, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);

      osc.connect(gain);
      gain.connect(actx.destination);

      osc.start();
      osc.stop(actx.currentTime + duration);
    } catch (e) {}
  }

  const Sound = {
    move: () => playTone(220, 'triangle', 0.04, 0.08),
    rotate: () => playTone(440, 'triangle', 0.06, 0.12),
    drop: () => playTone(140, 'sawtooth', 0.08, 0.2),
    lineClear: () => {
      if (!soundEnabled) return;
      playTone(523.25, 'sine', 0.1, 0.2);
      setTimeout(() => playTone(659.25, 'sine', 0.12, 0.2), 80);
      setTimeout(() => playTone(783.99, 'sine', 0.18, 0.25), 160);
    },
    gameOver: () => {
      if (!soundEnabled) return;
      playTone(300, 'sawtooth', 0.15, 0.25);
      setTimeout(() => playTone(220, 'sawtooth', 0.2, 0.25), 150);
      setTimeout(() => playTone(150, 'sawtooth', 0.35, 0.3), 300);
    }
  };

  // 최고 점수 초기 표시
  if (statHighScore) statHighScore.textContent = highScore.toLocaleString('ko-KR');

  // 4. 단일 블록 그리기 (입체감 있는 네온 큐브)
  function drawBlock(context, x, y, color, size, isGhost = false) {
    const px = x * size;
    const py = y * size;

    if (isGhost) {
      // 고스트 블록 (착지 예상 위치 반투명 가이드)
      context.save();
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.setLineDash([4, 3]);
      context.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
      context.fillStyle = color;
      context.globalAlpha = 0.15;
      context.fillRect(px + 1.5, py + 1.5, size - 3, size - 3);
      context.restore();
      return;
    }

    // 블록 본체 배경
    context.fillStyle = color;
    context.fillRect(px, py, size, size);

    // 상단 및 좌측 하이라이트 (3D 엠보싱 효과)
    context.fillStyle = 'rgba(255, 255, 255, 0.35)';
    context.beginPath();
    context.moveTo(px, py);
    context.lineTo(px + size, py);
    context.lineTo(px + size - 3, py + 3);
    context.lineTo(px + 3, py + 3);
    context.lineTo(px + 3, py + size - 3);
    context.lineTo(px, py + size);
    context.closePath();
    context.fill();

    // 하단 및 우측 섀도우
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.beginPath();
    context.moveTo(px + size, py);
    context.lineTo(px + size, py + size);
    context.lineTo(px, py + size);
    context.lineTo(px + 3, py + size - 3);
    context.lineTo(px + size - 3, py + size - 3);
    context.lineTo(px + size - 3, py + 3);
    context.closePath();
    context.fill();

    // 외곽선
    context.strokeStyle = 'rgba(15, 23, 42, 0.5)';
    context.lineWidth = 1;
    context.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
  }

  // 미리보기 캔버스 그리기 (Next & Hold)
  function drawMiniPreview(context, piece, targetCanvas) {
    context.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    if (!piece) return;

    const matrix = piece.matrix;
    const miniSize = 16;
    const offsetX = (targetCanvas.width - matrix[0].length * miniSize) / 2;
    const offsetY = (targetCanvas.height - matrix.length * miniSize) / 2;

    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (matrix[y][x] !== 0) {
          drawBlock(
            context,
            x + offsetX / miniSize,
            y + offsetY / miniSize,
            piece.color,
            miniSize
          );
        }
      }
    }
  }

  // 메인 게임 보드 전체 렌더링
  function draw() {
    // 배경 지우기
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 모눈종이 은은한 그리드 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let c = 1; c < window.TetrisLogic.COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK_SIZE, 0);
      ctx.lineTo(c * BLOCK_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let r = 1; r < window.TetrisLogic.ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK_SIZE);
      ctx.lineTo(canvas.width, r * BLOCK_SIZE);
      ctx.stroke();
    }

    // 1. 이미 고정된 바닥 블록 그리기
    for (let y = 0; y < window.TetrisLogic.ROWS; y++) {
      for (let x = 0; x < window.TetrisLogic.COLS; x++) {
        const color = board[y][x];
        if (color !== 0) {
          drawBlock(ctx, x, y, color, BLOCK_SIZE);
        }
      }
    }

    if (currentPiece) {
      // 2. 고스트 블록 그리기 (착지 가이드)
      const ghost = window.TetrisLogic.getGhostPosition(board, currentPiece);
      for (let y = 0; y < currentPiece.matrix.length; y++) {
        for (let x = 0; x < currentPiece.matrix[y].length; x++) {
          if (currentPiece.matrix[y][x] !== 0) {
            drawBlock(
              ctx,
              ghost.x + x,
              ghost.y + y,
              currentPiece.color,
              BLOCK_SIZE,
              true
            );
          }
        }
      }

      // 3. 현재 낙하 중인 블록 그리기
      for (let y = 0; y < currentPiece.matrix.length; y++) {
        for (let x = 0; x < currentPiece.matrix[y].length; x++) {
          if (currentPiece.matrix[y][x] !== 0) {
            drawBlock(
              ctx,
              currentPiece.x + x,
              currentPiece.y + y,
              currentPiece.color,
              BLOCK_SIZE
            );
          }
        }
      }
    }
  }

  // 다음 블록 가져오기 및 게임오버 검사
  function spawnNextPiece() {
    currentPiece = nextPiece || bagGenerator();
    nextPiece = bagGenerator();
    canHold = true;

    drawMiniPreview(nextCtx, nextPiece, nextCanvas);

    // 생성되자마자 충돌하면 게임 오버
    if (window.TetrisLogic.checkCollision(board, currentPiece)) {
      handleGameOver();
    }
  }

  // 게임 오버 처리
  function handleGameOver() {
    isPlaying = false;
    isGameOver = true;
    Sound.gameOver();

    if (score > highScore) {
      highScore = score;
      localStorage.setItem(STORAGE_HIGH_SCORE_KEY, highScore.toString());
      if (statHighScore) statHighScore.textContent = highScore.toLocaleString('ko-KR');
    }

    if (overlayTitle) overlayTitle.textContent = 'GAME OVER';
    if (overlayScore) {
      overlayScore.innerHTML = `최종 점수: <strong>${score.toLocaleString('ko-KR')}점</strong><br>(클리어 라인: ${lines}줄)`;
    }
    if (btnOverlayAction) btnOverlayAction.textContent = '🔄 다시 도전하기 (Enter)';
    if (gameOverlay) gameOverlay.classList.remove('hidden');

    // 🏆 TOP 10 랭킹 진입 검사 및 모달 표시
    if (window.GameRanking && score > 0) {
      const rankCheck = window.GameRanking.checkRank('game-tetris', score);
      if (rankCheck.isTop10) {
        setTimeout(() => {
          if (rankModal && rankModalScore) {
            rankModalScore.textContent = `${score.toLocaleString('ko-KR')}점`;
            if (rankModalSub) rankModalSub.innerHTML = `축하합니다! 현재 점수로 <strong>TOP ${rankCheck.expectedRank}위</strong>에 등극하셨습니다.`;
            rankModal.style.display = 'flex';
            if (rankNickname) {
              rankNickname.value = localStorage.getItem('simulab_user_nickname') || '';
              rankNickname.focus();
            }
          }
        }, 600);
      }
    }
  }

  // 블록 고정 및 라인 제거
  function lockPiece() {
    board = window.TetrisLogic.mergePiece(board, currentPiece);
    Sound.drop();

    const { newBoard, linesCleared } = window.TetrisLogic.clearLines(board);
    board = newBoard;

    if (linesCleared > 0) {
      lines += linesCleared;
      const pts = window.TetrisLogic.calculateScore(linesCleared, level);
      score += pts;

      // 10줄마다 레벨업
      level = Math.floor(lines / 10) + 1;

      Sound.lineClear();

      if (statScore) statScore.textContent = score.toLocaleString('ko-KR');
      if (statLines) statLines.textContent = lines.toString();
      if (statLevel) statLevel.textContent = level.toString();

      if (score > highScore) {
        highScore = score;
        if (statHighScore) statHighScore.textContent = highScore.toLocaleString('ko-KR');
      }
    }

    spawnNextPiece();
  }

  // 블록 낙하 동작
  function drop() {
    if (!isPlaying || isPaused || isGameOver) return;
    if (!window.TetrisLogic.checkCollision(board, currentPiece, 0, 1)) {
      currentPiece.y++;
    } else {
      lockPiece();
    }
    dropCounter = 0;
  }

  // 좌/우 이동
  function move(dir) {
    if (!isPlaying || isPaused || isGameOver) return;
    if (!window.TetrisLogic.checkCollision(board, currentPiece, dir, 0)) {
      currentPiece.x += dir;
      Sound.move();
    }
  }

  // 회전 (벽 튕김 킥 보정 포함)
  function rotate() {
    if (!isPlaying || isPaused || isGameOver) return;
    const rotated = window.TetrisLogic.rotateMatrix(currentPiece.matrix);

    // 기본 회전 시도
    if (!window.TetrisLogic.checkCollision(board, currentPiece, 0, 0, rotated)) {
      currentPiece.matrix = rotated;
      Sound.rotate();
      return;
    }
    // 벽 튕김 보정 (좌/우 1~2칸 밀어서 회전 가능한지 확인)
    const kicks = [1, -1, 2, -2];
    for (const offset of kicks) {
      if (!window.TetrisLogic.checkCollision(board, currentPiece, offset, 0, rotated)) {
        currentPiece.x += offset;
        currentPiece.matrix = rotated;
        Sound.rotate();
        return;
      }
    }
  }

  // 즉시 낙하 (Hard Drop)
  function hardDrop() {
    if (!isPlaying || isPaused || isGameOver) return;
    let droppedLines = 0;
    while (!window.TetrisLogic.checkCollision(board, currentPiece, 0, 1)) {
      currentPiece.y++;
      droppedLines++;
    }
    score += droppedLines * 2; // 하드드롭 보너스 점수
    if (statScore) statScore.textContent = score.toLocaleString('ko-KR');
    lockPiece();
  }

  // 블록 보관 (Hold)
  function hold() {
    if (!isPlaying || isPaused || isGameOver || !canHold) return;

    if (!holdPiece) {
      holdPiece = {
        type: currentPiece.type,
        matrix: window.TetrisLogic.SHAPES[currentPiece.type].map((r) => [...r]),
        color: window.TetrisLogic.COLORS[currentPiece.type]
      };
      spawnNextPiece();
    } else {
      const tempType = holdPiece.type;
      holdPiece = {
        type: currentPiece.type,
        matrix: window.TetrisLogic.SHAPES[currentPiece.type].map((r) => [...r]),
        color: window.TetrisLogic.COLORS[currentPiece.type]
      };
      currentPiece = {
        type: tempType,
        matrix: window.TetrisLogic.SHAPES[tempType].map((r) => [...r]),
        color: window.TetrisLogic.COLORS[tempType],
        x: Math.floor((window.TetrisLogic.COLS - window.TetrisLogic.SHAPES[tempType][0].length) / 2),
        y: tempType === 'I' ? -1 : 0
      };
    }

    canHold = false;
    Sound.rotate();
    drawMiniPreview(holdCtx, holdPiece, holdCanvas);
  }

  // 게임 시작 / 재시작
  function startGame() {
    board = window.TetrisLogic.createEmptyBoard();
    bagGenerator = window.TetrisLogic.createBagGenerator();
    currentPiece = null;
    nextPiece = null;
    holdPiece = null;
    canHold = true;

    score = 0;
    level = 1;
    lines = 0;
    dropCounter = 0;
    lastTime = performance.now();

    isPlaying = true;
    isPaused = false;
    isGameOver = false;

    if (statScore) statScore.textContent = '0';
    if (statLevel) statLevel.textContent = '1';
    if (statLines) statLines.textContent = '0';

    drawMiniPreview(holdCtx, null, holdCanvas);
    spawnNextPiece();

    if (gameOverlay) gameOverlay.classList.add('hidden');
    if (btnPause) btnPause.textContent = '⏸ 일시정지 (P)';
  }

  // 일시정지 토글
  function togglePause() {
    if (!isPlaying || isGameOver) return;
    isPaused = !isPaused;

    if (isPaused) {
      if (btnPause) btnPause.textContent = '▶ 재개하기 (P)';
      if (overlayTitle) overlayTitle.textContent = 'PAUSED';
      if (overlayScore) overlayScore.textContent = '게임이 일시정지되었습니다.';
      if (btnOverlayAction) btnOverlayAction.textContent = '▶ 계속하기 (P / Enter)';
      if (gameOverlay) gameOverlay.classList.remove('hidden');
    } else {
      if (btnPause) btnPause.textContent = '⏸ 일시정지 (P)';
      if (gameOverlay) gameOverlay.classList.add('hidden');
      lastTime = performance.now();
    }
  }

  // 메인 애니메이션 루프
  function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (isPlaying && !isPaused && !isGameOver) {
      dropCounter += deltaTime;
      const interval = window.TetrisLogic.getDropInterval(level);
      if (dropCounter > interval) {
        drop();
      }
    }

    draw();
    requestAnimationFrame(update);
  }

  // 5. 키보드 단축키 이벤트 리스너
  window.addEventListener('keydown', (e) => {
    // 게임 관련 키 입력 시 기본 브라우저 스크롤 방지
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'Spacebar'].includes(e.key)) {
      e.preventDefault();
    }

    if (!isPlaying) {
      if (e.key === 'Enter') startGame();
      return;
    }

    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      togglePause();
      return;
    }

    if (isPaused || isGameOver) {
      if (e.key === 'Enter') {
        if (isGameOver) startGame();
        else togglePause();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        move(-1);
        break;
      case 'ArrowRight':
        move(1);
        break;
      case 'ArrowDown':
        drop();
        break;
      case 'ArrowUp':
      case 'x':
      case 'X':
        rotate();
        break;
      case ' ':
        hardDrop();
        break;
      case 'c':
      case 'C':
      case 'Shift':
        hold();
        break;
    }
  });

  // 6. 모바일 가상 터치패드 바인딩 (터치 딜레이 방지 e.preventDefault)
  function bindTouch(buttonEl, actionFn) {
    if (!buttonEl) return;
    let touchInterval = null;

    const startHandler = (e) => {
      e.preventDefault();
      actionFn();
    };

    buttonEl.addEventListener('touchstart', startHandler, { passive: false });
    buttonEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      actionFn();
    });
  }

  bindTouch(touchLeft, () => move(-1));
  bindTouch(touchRight, () => move(1));
  bindTouch(touchHardDrop, () => hardDrop());
  bindTouch(touchHold, () => hold());
  bindTouch(touchRotate, () => rotate());

  // 상단 버튼 액션 리스너
  if (btnStart) btnStart.addEventListener('click', startGame);
  if (btnPause) btnPause.addEventListener('click', togglePause);
  if (btnRestart) btnRestart.addEventListener('click', startGame);
  if (btnOverlayAction) {
    btnOverlayAction.addEventListener('click', () => {
      if (isGameOver || !isPlaying) startGame();
      else if (isPaused) togglePause();
    });
  }

  // 효과음 ON/OFF 버튼
  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      btnSoundToggle.textContent = soundEnabled ? '🔊 ON' : '🔇 OFF';
      btnSoundToggle.classList.toggle('btn-primary', soundEnabled);
      btnSoundToggle.classList.toggle('btn-secondary', !soundEnabled);
    });
  }

  // 🏆 랭킹 폼 제출 및 취소 리스너
  if (rankForm) {
    rankForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nick = (rankNickname ? rankNickname.value : '').trim() || '테트리스장인';
      localStorage.setItem('simulab_user_nickname', nick);
      await window.GameRanking.saveRecordAsync('game-tetris', nick, score, `${score.toLocaleString('ko-KR')}점`);
      if (rankModal) rankModal.style.display = 'none';
      updateLeaderboard();
    });
  }
  if (btnRankCancel) {
    btnRankCancel.addEventListener('click', () => {
      if (rankModal) rankModal.style.display = 'none';
    });
  }


  // 초기 프레임 그리기 및 애니메이션 루프 가동
  draw();
  requestAnimationFrame(update);
});
