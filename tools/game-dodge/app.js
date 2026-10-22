/**
 * ==========================================================================
 * SimuLab - 미사일 피하기 닷지 1.9 클라이언트 앱 (app.js)
 * 파일 경로: tools/game-dodge/app.js
 * --------------------------------------------------------------------------
 * - Canvas 2D 탄막 회피 그래픽 렌더러 (별빛 우주 배경, 비행기 부스터 화염)
 * - PC 키보드(방향키/WASD) 및 모바일 터치 드래그 추종 + D-패드 완벽 지원
 * - Web Audio API 레트로 음향 (엔진, 폭발, 랭킹 팡파르)
 * - 실시간 60fps 물리 루프 및 정밀 밀리초 생존 타이머
 * - TOP 10 랭킹 연동 (별명 기록 및 명예의 전당 보드 갱신)
 * ==========================================================================
 */

(function () {
  'use strict';

  // DOM 엘리먼트 참조
  const canvas = document.getElementById('dodgeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // 전광판
  const dispTime = document.getElementById('dispTime');
  const dispBullets = document.getElementById('dispBullets');
  const dispBest = document.getElementById('dispBest');

  // 오버레이 및 버튼
  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const finalTimeText = document.getElementById('finalTimeText');
  const finalBulletsText = document.getElementById('finalBulletsText');

  const btnStartGame = document.getElementById('btnStartGame');
  const btnRetryGame = document.getElementById('btnRetryGame');
  const btnResumeGame = document.getElementById('btnResumeGame');
  const btnPauseToggle = document.getElementById('btnPauseToggle');
  const pauseIcon = document.getElementById('pauseIcon');
  const pauseText = document.getElementById('pauseText');

  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');

  // 모바일 D-패드 버튼
  const dpadUp = document.getElementById('dpadUp');
  const dpadDown = document.getElementById('dpadDown');
  const dpadLeft = document.getElementById('dpadLeft');
  const dpadRight = document.getElementById('dpadRight');

  // 랭킹 모달 엘리먼트
  const rankingBoardContainer = document.getElementById('rankingBoardContainer');
  const rankModal = document.getElementById('rankModal');
  const rankModalTitle = document.getElementById('rankModalTitle');
  const rankModalScore = document.getElementById('rankModalScore');
  const rankForm = document.getElementById('rankForm');
  const rankNickname = document.getElementById('rankNickname');
  const btnRankCancel = document.getElementById('btnRankCancel');

  // 게임 엔진 인스턴스
  const engine = new DodgeLogic.GameEngine(canvas.width, canvas.height);

  // 로컬 최고 기록 (초 단위)
  let bestTime = parseFloat(localStorage.getItem('dodge_best_time') || '0');
  if (isNaN(bestTime)) bestTime = 0;
  dispBest.textContent = DodgeLogic.formatSeconds(bestTime);

  // 사운드 상태
  let isMuted = localStorage.getItem('dodge_sound_muted') === 'true';
  updateSoundUI();

  // 입력 상태
  const inputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    touchActive: false,
    targetX: 200,
    targetY: 280
  };

  // 게임 루프 변수
  let lastTimestamp = 0;
  let animationId = null;
  let isGameRunning = false;
  let pendingRecordSeconds = 0;

  // 우주 배경 별빛(Starfield) 생성
  const stars = [];
  for (let i = 0; i < 65; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 40 + 20,
      size: Math.random() * 1.6 + 0.6,
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
    } catch (e) {
      // AudioContext 정책 방어
    }
  }

  function playStartSound() {
    playTone(440, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(880, 0.2, 'triangle', 0.25), 100);
  }

  function playExplosionSound() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // 노이즈 버퍼 기반 폭발음
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  }

  function playRankFanfare() {
    if (isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // 도-미-솔-도
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
    localStorage.setItem('dodge_sound_muted', isMuted);
    updateSoundUI();
  });

  // ==========================================================================
  // 2. 캔버스 그래픽 렌더링 함수들
  // ==========================================================================

  // 별빛 배경 렌더링 및 스크롤
  function drawStarfield(dt) {
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += s.speed * dt;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }

  // 플레이어 전투기 렌더링
  function drawPlayer() {
    const p = engine.player;
    if (p.isDead) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    // 1. 엔진 부스터 화염 효과 (뒤쪽)
    const flameLen = Math.random() * 8 + 8;
    ctx.beginPath();
    ctx.moveTo(-5, 12);
    ctx.lineTo(0, 12 + flameLen);
    ctx.lineTo(5, 12);
    ctx.fillStyle = Math.random() > 0.4 ? '#38bdf8' : '#f97316';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fill();

    // 2. 비행기 기체 본체 (날렵한 레트로 제트기)
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -14);       // 기수 (앞쪽 뾰족한 끝)
    ctx.lineTo(13, 11);       // 우측 날개 끝
    ctx.lineTo(0, 7);         // 중앙 홈
    ctx.lineTo(-13, 11);      // 좌측 날개 끝
    ctx.closePath();

    // 본체 그라데이션
    const grad = ctx.createLinearGradient(0, -14, 0, 11);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#60a5fa');
    grad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3. 정밀 회피 코어 히트박스 (중앙 핵심 피격점 표시)
    ctx.beginPath();
    ctx.arc(0, 0, p.hitRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444'; // 붉은색 코어
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  // 탄환(미사일) 목록 렌더링
  function drawBullets() {
    const bullets = engine.bullets;
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];

      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

      // 탄환 종류별 렌더링
      if (b.type === 'fast') {
        // 빠른 청록색 미사일: 후방 잔상 꼬리
        const angle = Math.atan2(b.vy, b.vx);
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - Math.cos(angle) * 12, b.y - Math.sin(angle) * 12);
        ctx.stroke();

        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 8;
      } else if (b.type === 'heavy') {
        // 대형 마젠타 탄환
        ctx.fillStyle = '#ff006e';
        ctx.shadowColor = '#ff006e';
        ctx.shadowBlur = 10;
      } else {
        // 일반 황금색 탄환
        ctx.fillStyle = '#ffb703';
        ctx.shadowColor = '#fb8500';
        ctx.shadowBlur = 6;
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // 탄환 중앙 밝은 코어
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // 폭발 파티클 렌더링
  function drawParticles() {
    const particles = engine.particles;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 전체 화면 렌더링 함수
  function render(dt) {
    drawStarfield(dt);
    drawBullets();
    drawPlayer();
    drawParticles();
  }

  // ==========================================================================
  // 3. 메인 게임 루프
  // ==========================================================================
  function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (isGameRunning && !engine.isPaused) {
      // 물리 시뮬레이션
      engine.update(dt, inputState);

      // 전광판 갱신
      dispTime.textContent = DodgeLogic.formatSeconds(engine.elapsedTime);
      dispBullets.textContent = engine.bullets.length;

      // 게임 오버 검출
      if (engine.isGameOver) {
        handleGameOver();
      }
    }

    // 그래픽 프레임 렌더
    render(dt);

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

    playStartSound();
  }

  function handleGameOver() {
    isGameRunning = false;
    playExplosionSound();

    const finalSec = engine.elapsedTime;
    const finalFormatted = DodgeLogic.formatSeconds(finalSec);
    pendingRecordSeconds = finalSec;

    // 최고 기록 갱신 여부
    if (finalSec > bestTime) {
      bestTime = finalSec;
      localStorage.setItem('dodge_best_time', bestTime.toString());
      dispBest.textContent = finalFormatted;
    }

    finalTimeText.textContent = finalFormatted;
    finalBulletsText.textContent = `회피한 탄환: ${engine.totalBulletsSpawned}개 (생존 시간: ${finalFormatted})`;
    gameOverOverlay.classList.remove('hidden');

    // 🏆 명예의 전당 TOP 10 랭킹 진입 검사
    if (window.GameRanking) {
      const check = GameRanking.checkRank('game-dodge', finalSec);
      if (check.isRanked) {
        setTimeout(() => {
          showRankModal(check.rank, finalSec, finalFormatted);
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

  // 버튼 이벤트 바인딩
  btnStartGame.addEventListener('click', startGame);
  btnRetryGame.addEventListener('click', startGame);
  btnResumeGame.addEventListener('click', togglePause);
  btnPauseToggle.addEventListener('click', togglePause);

  // ==========================================================================
  // 5. 사용자 조작 입력 바인딩 (키보드 + 모바일 터치)
  // ==========================================================================

  // (1) PC 키보드
  window.addEventListener('keydown', (e) => {
    // 게임 전용 단축키 시 브라우저 기본 스크롤 방지
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputState.left = true;
    if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputState.right = true;
    if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputState.up = true;
    if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') inputState.down = true;

    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputState.left = false;
    if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputState.right = false;
    if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputState.up = false;
    if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') inputState.down = false;
  });

  // (2) 모바일 캔버스 직접 터치 드래그 추종 모드
  function getCanvasPos(touchEvent) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!isGameRunning) return;
    const pos = getCanvasPos(e);
    inputState.touchActive = true;
    inputState.targetX = pos.x;
    inputState.targetY = pos.y;
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isGameRunning) return;
    const pos = getCanvasPos(e);
    inputState.targetX = pos.x;
    inputState.targetY = pos.y;
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    inputState.touchActive = false;
  }, { passive: false });

  // (3) 모바일 가상 D-패드 (방향키) 이벤트 바인딩
  function bindDpad(btn, dirKey) {
    if (!btn) return;
    const press = (e) => {
      e.preventDefault();
      inputState[dirKey] = true;
      btn.classList.add('active');
    };
    const release = (e) => {
      e.preventDefault();
      inputState[dirKey] = false;
      btn.classList.remove('active');
    };

    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
  }

  bindDpad(dpadUp, 'up');
  bindDpad(dpadDown, 'down');
  bindDpad(dpadLeft, 'left');
  bindDpad(dpadRight, 'right');

  // ==========================================================================
  // 6. 명예의 전당 TOP 10 랭킹 등록 모달 제어
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

  rankForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = (rankNickname.value || '').trim();
    if (!nickname) {
      alert('별명을 입력해주세요!');
      return;
    }

    if (window.GameRanking) {
      await GameRanking.saveRecordAsync('game-dodge', nickname, pendingRecordSeconds, DodgeLogic.formatSeconds(pendingRecordSeconds));
      GameRanking.renderBoard(rankingBoardContainer, 'game-dodge');
    }

    hideRankModal();
  });

  // 초기 랭킹 보드 렌더링
  if (window.GameRanking && rankingBoardContainer) {
    GameRanking.renderBoard(rankingBoardContainer, 'game-dodge');
  }

  // 초기 캔버스 화면 렌더링 및 애니메이션 루프 시작
  render(0.016);
  animationId = requestAnimationFrame(gameLoop);

})();
