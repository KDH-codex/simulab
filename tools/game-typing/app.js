/**
 * ==========================================================================
 * SimuLab - 스피드 타자 산성비 클라이언트 앱 (app.js)
 * 파일 경로: tools/game-typing/app.js
 * --------------------------------------------------------------------------
 * - Canvas 2D 레트로 산성비 그래픽 렌더러 (물결치는 산성 바다, 단어 텍스트 블록)
 * - 한글 IME(자음/모음 조합) 중복 입력 방어 및 스마트 엔터 판정
 * - Web Audio API 레트로 타건음, 격추음, 폭발음, 랭킹 팡파르
 * - 실시간 분당 타수(CPM) 전광판 측정
 * - TOP 10 랭킹 연동 (별명 기록 및 명예의 전당 보드 갱신)
 * ==========================================================================
 */

(function () {
  'use strict';

  // DOM 엘리먼트 참조
  const canvas = document.getElementById('typingCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // 전광판
  const dispScore = document.getElementById('dispScore');
  const dispLives = document.getElementById('dispLives');
  const dispCPM = document.getElementById('dispCPM');
  const dispLevel = document.getElementById('dispLevel');

  // 오버레이 및 버튼
  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const finalScoreText = document.getElementById('finalScoreText');
  const finalStatsText = document.getElementById('finalStatsText');

  const btnStartGame = document.getElementById('btnStartGame');
  const btnRetryGame = document.getElementById('btnRetryGame');
  const btnResumeGame = document.getElementById('btnResumeGame');
  const btnPauseToggle = document.getElementById('btnPauseToggle');
  const pauseIcon = document.getElementById('pauseIcon');
  const pauseText = document.getElementById('pauseText');

  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');

  // 단어 입력 폼 및 필드
  const typingForm = document.getElementById('typingForm');
  const typingInput = document.getElementById('typingInput');

  // 랭킹 모달 엘리먼트
  const rankingBoardContainer = document.getElementById('rankingBoardContainer');
  const rankModal = document.getElementById('rankModal');
  const rankModalTitle = document.getElementById('rankModalTitle');
  const rankModalScore = document.getElementById('rankModalScore');
  const rankForm = document.getElementById('rankForm');
  const rankNickname = document.getElementById('rankNickname');
  const btnRankCancel = document.getElementById('btnRankCancel');

  // 게임 엔진 인스턴스
  const engine = new TypingLogic.TypingEngine(canvas.width, canvas.height);

  // 사운드 상태
  let isMuted = localStorage.getItem('typing_sound_muted') === 'true';
  updateSoundUI();

  // 게임 루프 변수
  let lastTimestamp = 0;
  let animationId = null;
  let isGameRunning = false;
  let waveOffset = 0;
  let pendingFinalScore = 0;

  // 한글 IME 조합 상태 플래그
  let isComposing = false;

  // 배경 별빛 생성
  const stars = [];
  for (let i = 0; i < 45; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height - 100),
      size: Math.random() * 1.5 + 0.6,
      alpha: Math.random() * 0.7 + 0.3
    });
  }

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

  function playHitSound() {
    playTone(660, 0.08, 'triangle', 0.2);
    setTimeout(() => playTone(880, 0.1, 'sine', 0.22), 50);
  }

  function playSpecialSound(type) {
    if (type === 'bomb') {
      playTone(180, 0.35, 'sawtooth', 0.3);
    } else if (type === 'freeze') {
      playTone(1040, 0.2, 'sine', 0.25);
    } else if (type === 'heal') {
      playTone(523.25, 0.1, 'triangle', 0.2);
      setTimeout(() => playTone(783.99, 0.2, 'sine', 0.25), 90);
    }
  }

  function playMissSound() {
    playTone(150, 0.2, 'sawtooth', 0.25);
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
    localStorage.setItem('typing_sound_muted', isMuted);
    updateSoundUI();
  });

  // ==========================================================================
  // 2. 캔버스 그래픽 렌더링 함수들
  // ==========================================================================

  // 밤하늘 배경
  function drawBackground() {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }

  // 바닥 산성 바다 (부드러운 물결 사인파 애니메이션)
  function drawAcidSea() {
    const seaY = engine.seaLevel;
    waveOffset += 0.04;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, seaY);

    for (let x = 0; x <= canvas.width; x += 10) {
      const wave = Math.sin(x * 0.03 + waveOffset) * 5 + Math.cos(x * 0.02 - waveOffset * 0.7) * 3;
      ctx.lineTo(x, seaY + wave);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();

    // 산성 바다 그라데이션 (에메랄드 -> 짙은 청록)
    const seaGrad = ctx.createLinearGradient(0, seaY, 0, canvas.height);
    seaGrad.addColorStop(0, '#059669');
    seaGrad.addColorStop(0.3, '#047857');
    seaGrad.addColorStop(1, '#064e3b');
    ctx.fillStyle = seaGrad;
    ctx.fill();

    // 수면 발광 라인
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  // 떨어지는 단어 텍스트 블록 렌더링
  function drawWords() {
    const words = engine.words;
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const textWidth = ctx.measureText(w.text).width;
      const boxWidth = Math.max(w.width, textWidth + (w.badge ? 38 : 24));
      const boxHeight = 28;
      const radius = 8;

      ctx.save();
      ctx.translate(w.x, w.y);

      // 박스 배경
      ctx.beginPath();
      ctx.roundRect(0, 0, boxWidth, boxHeight, radius);

      if (w.type === 'bomb') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.strokeStyle = '#ef4444';
        ctx.shadowColor = '#f87171';
        ctx.shadowBlur = 8;
      } else if (w.type === 'freeze') {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
        ctx.strokeStyle = '#0ea5e9';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
      } else if (w.type === 'heal') {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
        ctx.strokeStyle = '#ec4899';
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        ctx.strokeStyle = '#475569';
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 단어 텍스트
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      const textToDisplay = w.badge ? `${w.badge} ${w.text}` : w.text;
      ctx.fillText(textToDisplay, boxWidth / 2, boxHeight / 2);

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
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 플로팅 텍스트 (+250, MISS!) 렌더링
  function drawFloatingTexts() {
    const floatTexts = engine.floatTexts;
    ctx.font = '900 14px "SF Mono", "Roboto Mono", monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i < floatTexts.length; i++) {
      const ft = floatTexts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      if (ft.text.includes('MISS')) {
        ctx.fillStyle = '#f43f5e';
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
      }
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // 빙결 이펙트 오버레이
  function drawFreezeEffect() {
    if (engine.freezeTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  function render() {
    drawBackground();
    drawAcidSea();
    drawWords();
    drawParticles();
    drawFloatingTexts();
    drawFreezeEffect();
  }

  // ==========================================================================
  // 3. 메인 게임 루프 & 전광판 갱신
  // ==========================================================================
  function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (isGameRunning && !engine.isPaused) {
      engine.update(dt);

      // 전광판 갱신
      dispScore.textContent = engine.score.toLocaleString();
      dispLives.textContent = '❤️'.repeat(Math.max(0, engine.lives)) || '💀';
      dispCPM.textContent = engine.getCurrentCPM();
      dispLevel.textContent = engine.level;

      // 게임 오버 검출
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

    typingInput.value = '';
    typingInput.focus();

    playTone(523.25, 0.15, 'triangle', 0.2);
  }

  function handleGameOver() {
    isGameRunning = false;
    playMissSound();

    const finalScore = engine.score;
    const finalCPM = engine.getCurrentCPM();
    pendingFinalScore = finalScore;

    finalScoreText.textContent = `${finalScore.toLocaleString()}점`;
    finalStatsText.textContent = `최종 타수: ${finalCPM} 타/분 | 격추 단어: ${engine.totalWordsHit}개`;
    gameOverOverlay.classList.remove('hidden');

    // 🏆 명예의 전당 TOP 10 랭킹 진입 검사
    if (window.GameRanking) {
      const check = GameRanking.checkRank('game-typing', finalScore);
      if (check.isRanked) {
        setTimeout(() => {
          showRankModal(check.rank, finalScore, `${finalScore.toLocaleString()}점 (${finalCPM}타)`);
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
      typingInput.focus();
    }
  }

  btnStartGame.addEventListener('click', startGame);
  btnRetryGame.addEventListener('click', startGame);
  btnResumeGame.addEventListener('click', togglePause);
  btnPauseToggle.addEventListener('click', togglePause);

  // ==========================================================================
  // 5. 한글 IME 조합 중복 방어 및 단어 제출 처리
  // ==========================================================================
  typingInput.addEventListener('compositionstart', () => {
    isComposing = true;
  });

  typingInput.addEventListener('compositionend', () => {
    isComposing = false;
  });

  function processWordSubmission() {
    if (!isGameRunning || engine.isGameOver || engine.isPaused) return;

    const val = (typingInput.value || '').trim();
    if (!val) return;

    const result = engine.submitWord(val);
    typingInput.value = ''; // 입력창 즉시 초기화

    if (result.hit) {
      if (result.type === 'normal') {
        playHitSound();
      } else {
        playSpecialSound(result.type);
      }
    } else {
      // 오타 시 가벼운 피드백 (선택적)
    }
  }

  typingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // 한글 조합 중 엔터 입력 시 중복 이벤트 발생 방지
      if (isComposing) return;
      e.preventDefault();
      processWordSubmission();
    }
  });

  // 버튼 클릭으로도 제출 가능
  typingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    processWordSubmission();
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
    typingInput.focus();
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
      GameRanking.saveRecord('game-typing', nickname, pendingFinalScore, `${pendingFinalScore.toLocaleString()}점`);
      GameRanking.renderBoard(rankingBoardContainer, 'game-typing');
    }

    hideRankModal();
  });

  // 초기 랭킹 보드 렌더링
  if (window.GameRanking && rankingBoardContainer) {
    GameRanking.renderBoard(rankingBoardContainer, 'game-typing');
  }

  // 초기 렌더링 및 애니메이션 루프 시작
  render();
  animationId = requestAnimationFrame(gameLoop);

})();
