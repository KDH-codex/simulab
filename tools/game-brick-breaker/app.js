/**
 * ==========================================================================
 * SimuLab - 네온 벽돌 깨기 클라이언트 앱 (app.js)
 * 파일 경로: tools/game-brick-breaker/app.js
 * --------------------------------------------------------------------------
 * - Canvas 2D 사이버펑크 네온 그래픽 렌더러 (발광 벽돌, 공 꼬리 잔상, 레이저 빔)
 * - PC 마우스/키보드 및 모바일 터치 드래그 추종 완벽 지원
 * - Web Audio API 레트로 아케이드 효과음 (바운스, 블록 파괴, 레이저, 아이템)
 * - 멀티 볼 분열, 와이드 패들, 레이저 캐논 실시간 시뮬레이션
 * - TOP 10 랭킹 연동 (별명 기록 및 명예의 전당 보드 갱신)
 * ==========================================================================
 */

(function () {
  'use strict';

  // DOM 엘리먼트 참조
  const canvas = document.getElementById('brickCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // 전광판
  const dispScore = document.getElementById('dispScore');
  const dispLives = document.getElementById('dispLives');
  const dispStage = document.getElementById('dispStage');
  const dispCombo = document.getElementById('dispCombo');

  // 오버레이 및 버튼
  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const finalScoreText = document.getElementById('finalScoreText');
  const finalStageText = document.getElementById('finalStageText');

  const btnStartGame = document.getElementById('btnStartGame');
  const btnRetryGame = document.getElementById('btnRetryGame');
  const btnResumeGame = document.getElementById('btnResumeGame');
  const btnPauseToggle = document.getElementById('btnPauseToggle');
  const pauseIcon = document.getElementById('pauseIcon');
  const pauseText = document.getElementById('pauseText');

  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');

  const btnActionLaunch = document.getElementById('btnActionLaunch');

  // 랭킹 모달 엘리먼트
  const rankingBoardContainer = document.getElementById('rankingBoardContainer');
  const rankModal = document.getElementById('rankModal');
  const rankModalTitle = document.getElementById('rankModalTitle');
  const rankModalScore = document.getElementById('rankModalScore');
  const rankForm = document.getElementById('rankForm');
  const rankNickname = document.getElementById('rankNickname');
  const btnRankCancel = document.getElementById('btnRankCancel');

  // 게임 엔진 인스턴스
  const engine = new BrickLogic.GameEngine(canvas.width, canvas.height);

  // 사운드 상태
  let isMuted = localStorage.getItem('brick_sound_muted') === 'true';
  updateSoundUI();

  // 입력 상태
  const inputState = {
    left: false,
    right: false,
    targetPaddleX: null,
    launch: false
  };

  // 게임 루프 변수
  let lastTimestamp = 0;
  let animationId = null;
  let isGameRunning = false;
  let pendingFinalScore = 0;

  // 공 궤적 잔상 히스토리
  const ballTrails = [];

  // ==========================================================================
  // 1. Web Audio API 효과음 생성기
  // ==========================================================================
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', volume = 0.15) {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playBounceSound() {
    playTone(320, 0.06, 'triangle', 0.18);
  }

  function playBrickBreakSound() {
    playTone(580, 0.08, 'square', 0.16);
    setTimeout(() => playTone(880, 0.08, 'sine', 0.18), 35);
  }

  function playItemSound() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.12, 'triangle', 0.2), i * 60));
  }

  function playLaserSound() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  function playRankFanfare() {
    if (isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 0.18, 'triangle', 0.22), idx * 90);
    });
  }

  function updateSoundUI() {
    if (isMuted) {
      soundIcon.textContent = '🔇';
      soundText.textContent = '음소거 OFF';
    } else {
      soundIcon.textContent = '🔊';
      soundText.textContent = '사운드 ON';
    }
  }

  btnSoundToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    localStorage.setItem('brick_sound_muted', isMuted);
    updateSoundUI();
  });

  // ==========================================================================
  // 2. 캔버스 그래픽 렌더링 함수들
  // ==========================================================================

  // 사이버펑크 네온 배경
  function drawBackground() {
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 미세 네온 그리드
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  // 벽돌 렌더링
  function drawBricks() {
    const bricks = engine.bricks;
    for (let i = 0; i < bricks.length; i++) {
      const br = bricks[i];

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(br.x, br.y, br.width, br.height, 4);

      // 발광 효과
      ctx.fillStyle = br.color;
      ctx.shadowColor = br.color;
      ctx.shadowBlur = br.isHard && br.hp === 2 ? 10 : 6;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 강화 벽돌 피격 균열 표시
      if (br.isHard && br.hp === 1) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(br.x + 8, br.y + 4);
        ctx.lineTo(br.x + br.width / 2, br.y + br.height - 4);
        ctx.lineTo(br.x + br.width - 8, br.y + 6);
        ctx.stroke();
      }

      // 아이템 보유 벽돌 작은 표시
      if (br.item) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(br.x + br.width / 2, br.y + br.height / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // 패들 렌더링
  function drawPaddle() {
    const p = engine.paddle;

    ctx.save();
    ctx.translate(p.x, p.y);

    // 패들 본체 둥근 캡슐
    ctx.beginPath();
    ctx.roundRect(0, 0, p.width, p.height, 6);

    const grad = ctx.createLinearGradient(0, 0, 0, p.height);
    if (p.laserTimer > 0) {
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, '#9f1239');
      ctx.shadowColor = '#f43f5e';
    } else if (p.wideTimer > 0) {
      grad.addColorStop(0, '#34d399');
      grad.addColorStop(1, '#065f46');
      ctx.shadowColor = '#10b981';
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#38bdf8');
      grad.addColorStop(1, '#0369a1');
      ctx.shadowColor = '#38bdf8';
    }

    ctx.fillStyle = grad;
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 레이저 배럴 표시 (레이저 모드일 때)
    if (p.laserTimer > 0) {
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(4, -5, 5, 6);
      ctx.fillRect(p.width - 9, -5, 5, 6);
    }

    ctx.restore();
  }

  // 공 렌더링 및 발광 꼬리 잔상
  function drawBalls() {
    const balls = engine.balls;

    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];

      // 공 본체
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fill();

      // 내부 시안 코어
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      ctx.restore();
    }
  }

  // 아이템 캡슐 렌더링
  function drawItems() {
    const items = engine.items;
    const itemIcons = {
      multiball: '🔮',
      wide: '📏',
      laser: '🔫',
      heart: '❤️'
    };

    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < items.length; i++) {
      const it = items[i];

      ctx.save();
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = it.type === 'heart' ? '#ec4899' : (it.type === 'laser' ? '#f43f5e' : '#38bdf8');
      ctx.lineWidth = 2;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillText(itemIcons[it.type] || '★', it.x, it.y);

      ctx.restore();
    }
  }

  // 레이저 빔 렌더링
  function drawLasers() {
    const lasers = engine.lasers;
    for (let i = 0; i < lasers.length; i++) {
      const l = lasers[i];

      ctx.save();
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.fillRect(l.x, l.y, l.width, l.height);
      ctx.restore();
    }
  }

  // 파티클 렌더링
  function drawParticles() {
    const particles = engine.particles;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 플로팅 텍스트 (+150 등)
  function drawFloatingTexts() {
    const floatTexts = engine.floatTexts;
    ctx.font = '900 13px "SF Mono", monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i < floatTexts.length; i++) {
      const ft = floatTexts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  function render() {
    drawBackground();
    drawBricks();
    drawItems();
    drawLasers();
    drawBalls();
    drawPaddle();
    drawParticles();
    drawFloatingTexts();
  }

  // ==========================================================================
  // 3. 메인 게임 루프 & 전광판 갱신
  // ==========================================================================
  function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (isGameRunning && !engine.isPaused) {
      engine.update(dt, inputState);

      // 전광판 갱신
      dispScore.textContent = engine.score.toLocaleString();
      dispLives.textContent = '❤️'.repeat(Math.max(0, engine.lives)) || '💀';
      dispStage.textContent = engine.stage;
      dispCombo.textContent = engine.combo;

      // 발사 버튼 텍스트 토글
      if (!engine.isBallLaunched) {
        btnActionLaunch.textContent = '🚀 공 발사 (Space / 탭)';
        btnActionLaunch.style.background = '#2563eb';
      } else if (engine.paddle.laserTimer > 0) {
        btnActionLaunch.textContent = '🔫 레이저 연사 중!';
        btnActionLaunch.style.background = '#f43f5e';
      } else {
        btnActionLaunch.textContent = '🎮 패들 조작 중';
        btnActionLaunch.style.background = '#334155';
      }

      if (engine.isGameOver) {
        handleGameOver();
      }
    }

    render();
    animationId = requestAnimationFrame(gameLoop);
  }

  // ==========================================================================
  // 4. 게임 라이프사이클 (시작, 게임오버, 일시정지)
  // ==========================================================================
  function startGame() {
    engine.reset();
    isGameRunning = true;
    lastTimestamp = performance.now();

    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');

    pauseIcon.textContent = '⏸️';
    pauseText.textContent = '일시정지';

    playBounceSound();
  }

  function handleGameOver() {
    isGameRunning = false;
    const finalScore = engine.score;
    pendingFinalScore = finalScore;

    finalScoreText.textContent = `${finalScore.toLocaleString()}점`;
    finalStageText.textContent = `도달 스테이지: ${engine.stage} | 최대 콤보: ${engine.maxCombo}콤보`;
    gameOverOverlay.classList.remove('hidden');

    // 🏆 명예의 전당 TOP 10 랭킹 진입 검사
    if (window.GameRanking) {
      const check = GameRanking.checkRank('game-brick-breaker', finalScore);
      if (check.isRanked) {
        setTimeout(() => {
          showRankModal(check.rank, finalScore, `${finalScore.toLocaleString()}점 (STAGE ${engine.stage})`);
        }, 750);
      }
    }
  }

  function togglePause() {
    if (!isGameRunning || engine.isGameOver) return;

    engine.isPaused = !engine.isPaused;
    if (engine.isPaused) {
      pauseOverlay.classList.remove('hidden');
      pauseIcon.textContent = '▶';
      pauseText.textContent = '계속하기';
    } else {
      pauseOverlay.classList.add('hidden');
      pauseIcon.textContent = '⏸️';
      pauseText.textContent = '일시정지';
      lastTimestamp = performance.now();
    }
  }

  btnStartGame.addEventListener('click', startGame);
  btnRetryGame.addEventListener('click', startGame);
  btnResumeGame.addEventListener('click', togglePause);
  btnPauseToggle.addEventListener('click', togglePause);

  btnActionLaunch.addEventListener('click', () => {
    if (!isGameRunning) return;
    if (!engine.isBallLaunched) {
      engine.launchBall();
      playBounceSound();
    }
  });

  // ==========================================================================
  // 5. 사용자 조작 (마우스 / 터치 / 키보드)
  // ==========================================================================

  // (1) 캔버스 마우스 이동
  function updatePaddleFromX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const canvasX = (clientX - rect.left) * scaleX;
    inputState.targetPaddleX = canvasX;
  }

  canvas.addEventListener('mousemove', (e) => {
    if (!isGameRunning || engine.isPaused) return;
    updatePaddleFromX(e.clientX);
  });

  // (2) 캔버스 모바일 터치 드래그 추종
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!isGameRunning || engine.isPaused) return;
    const touch = e.touches[0];
    updatePaddleFromX(touch.clientX);
    if (!engine.isBallLaunched) {
      engine.launchBall();
      playBounceSound();
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isGameRunning || engine.isPaused) return;
    const touch = e.touches[0];
    updatePaddleFromX(touch.clientX);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
  }, { passive: false });

  // (3) PC 키보드 단축키
  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      inputState.left = true;
      inputState.targetPaddleX = null;
    }
    if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      inputState.right = true;
      inputState.targetPaddleX = null;
    }
    if (e.code === 'Space') {
      if (!engine.isBallLaunched) {
        engine.launchBall();
        playBounceSound();
      }
    }
    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputState.left = false;
    if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputState.right = false;
  });

  // ==========================================================================
  // 6. 명예의 전당 TOP 10 랭킹 모달 제어
  // ==========================================================================
  function showRankModal(rank, score, display) {
    playRankFanfare();
    rankModalTitle.textContent = `🎉 축하합니다! TOP ${rank}위 등극!`;
    rankModalScore.textContent = display;
    rankModal.style.display = 'flex';
    rankNickname.value = '';
    rankNickname.focus();
  }

  function hideRankModal() {
    rankModal.style.display = 'none';
  }

  btnRankCancel.addEventListener('click', hideRankModal);

  rankForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = (rankNickname.value || '').trim();
    if (!nickname) {
      alert('별명을 입력해주세요!');
      return;
    }

    if (window.GameRanking) {
      GameRanking.saveRecord('game-brick-breaker', nickname, pendingFinalScore, `${pendingFinalScore.toLocaleString()}점`);
      GameRanking.renderBoard(rankingBoardContainer, 'game-brick-breaker');
    }

    hideRankModal();
  });

  // 초기 랭킹 보드 렌더링
  if (window.GameRanking && rankingBoardContainer) {
    GameRanking.renderBoard(rankingBoardContainer, 'game-brick-breaker');
  }

  // 초기 렌더링 및 루프 가동
  render();
  animationId = requestAnimationFrame(gameLoop);

})();
