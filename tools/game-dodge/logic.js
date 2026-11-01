/**
 * ==========================================================================
 * SimuLab - 미사일 피하기 닷지 1.9 게임 엔진 (logic.js)
 * 파일 경로: tools/game-dodge/logic.js
 * --------------------------------------------------------------------------
 * - 전설의 고전 명작 '닷지 1.9 (Dodge 1.9)' 기반 탄막 회피 물리 엔진
 * - 사방 외곽 탄막 스폰 시스템 및 시간 경과 비례 난이도 가속 공식
 * - 픽셀 퍼펙트 원형 히트박스 충돌 판정 (비행기 코어 3.5px 판정)
 * - 밀리초 단위 정밀 생존 타이머 포맷팅
 * - 파티클 폭발 시뮬레이션 계산
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const DodgeLogic = {};

  // 기본 캔버스 논리 해상도 (모바일/PC 공용 반응형 3:4 비율)
  DodgeLogic.CANVAS_WIDTH = 400;
  DodgeLogic.CANVAS_HEIGHT = 560;

  // 플레이어 기본 스펙
  DodgeLogic.PLAYER_CONFIG = {
    speed: 260,          // 초당 이동 픽셀 (PC 키보드 기준)
    hitRadius: 3.5,      // 실제 충돌 판정 코어 반경 (극도로 정밀한 회피감 제공)
    visualRadius: 14,    // 시각적 비행기 반경
    initialX: 200,       // 시작 X 좌표 (중앙)
    initialY: 280        // 시작 Y 좌표 (중앙)
  };

  /**
   * 시간 포맷팅 유틸리티 (ms -> 00:00.00 분:초.밀리초)
   * @param {number} ms - 경과 밀리초
   * @returns {string} 예: "01:23.45"
   */
  DodgeLogic.formatTime = function (ms) {
    if (typeof ms !== 'number' || isNaN(ms) || ms < 0) ms = 0;
    const totalCentis = Math.floor(ms / 10);
    const centis = totalCentis % 100;
    const totalSeconds = Math.floor(totalCentis / 100);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);

    const pad = (num, len = 2) => String(num).padStart(len, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
  };

  /**
   * 초 단위 숫자를 "00:00.00" 문자열로 변환
   * @param {number} sec - 생존 초(소수점 포함)
   */
  DodgeLogic.formatSeconds = function (sec) {
    return DodgeLogic.formatTime(Math.floor(sec * 1000));
  };

  /**
   * 두 원 간의 충돌 검사
   * @param {number} x1, y1, r1 - 첫 번째 원의 중심 및 반경
   * @param {number} x2, y2, r2 - 두 번째 원의 중심 및 반경
   * @returns {boolean} 충돌 여부
   */
  DodgeLogic.checkCircleCollision = function (x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distSq = dx * dx + dy * dy;
    const radSum = r1 + r2;
    return distSq <= radSum * radSum;
  };

  /**
   * 닷지 게임 물리 엔진 클래스
   */
  class GameEngine {
    constructor(width = DodgeLogic.CANVAS_WIDTH, height = DodgeLogic.CANVAS_HEIGHT) {
      this.width = width;
      this.height = height;
      this.reset();
    }

    /**
     * 게임 상태 초기화
     */
    reset() {
      // 플레이어 상태
      this.player = {
        x: this.width / 2,
        y: this.height / 2,
        vx: 0,
        vy: 0,
        hitRadius: DodgeLogic.PLAYER_CONFIG.hitRadius,
        visualRadius: DodgeLogic.PLAYER_CONFIG.visualRadius,
        speed: DodgeLogic.PLAYER_CONFIG.speed,
        isDead: false
      };

      // 총알 목록
      this.bullets = [];

      // 생존 시간 및 타이머
      this.elapsedTime = 0;      // 경과 시간 (초)
      this.bulletSpawnTimer = 0; // 탄환 스폰 타이머
      this.totalBulletsSpawned = 0;

      // 파티클 목록 (폭발 시각효과)
      this.particles = [];

      this.isGameOver = false;
      this.isPaused = false;
    }

    /**
     * 현재 생존 시간에 따른 탄환 스폰 주기(초) 계산
     * 시간이 지날수록 스폰 주기가 급격히 단축되어 탄막이 쏟아짐
     */
    getSpawnInterval() {
      const t = this.elapsedTime;
      if (t < 5) return 0.22;       // 초반 5초: 0.22초당 1발
      if (t < 15) return 0.16;      // 5~15초: 0.16초당 1발
      if (t < 30) return 0.11;      // 15~30초: 0.11초당 1발
      if (t < 60) return 0.07;      // 30~60초: 0.07초당 1발
      if (t < 100) return 0.045;    // 60~100초: 0.045초당 1발 (지옥 탄막)
      return 0.03;                  // 100초 이상: 0.03초당 1발 (Dodge 1.9 전설 모드)
    }

    /**
     * 현재 시간에 따른 탄환 속도 범위 계산
     */
    getBulletSpeed() {
      const t = this.elapsedTime;
      // 기본 속도 110 ~ 170에서 시작, 1초마다 약 1.2씩 점진적 가속 (최대 360)
      const base = 120 + Math.min(t * 1.3, 200);
      const variance = (Math.random() - 0.5) * 40;
      return Math.max(90, base + variance);
    }

    /**
     * 사방 외곽에서 새로운 총알 1발 생성
     */
    spawnBullet() {
      // 0: 상단, 1: 우측, 2: 하단, 3: 좌측
      const side = Math.floor(Math.random() * 4);
      let sx, sy;
      const margin = 10;

      switch (side) {
        case 0: // Top
          sx = Math.random() * this.width;
          sy = -margin;
          break;
        case 1: // Right
          sx = this.width + margin;
          sy = Math.random() * this.height;
          break;
        case 2: // Bottom
          sx = Math.random() * this.width;
          sy = this.height + margin;
          break;
        case 3: // Left
          sx = -margin;
          sy = Math.random() * this.height;
          break;
      }

      // 목표 지점: 플레이어 위치 + 약간의 무작위 편차 (-35px ~ +35px)
      const targetX = this.player.x + (Math.random() - 0.5) * 70;
      const targetY = this.player.y + (Math.random() - 0.5) * 70;

      // 발사 각도 계산
      const angle = Math.atan2(targetY - sy, targetX - sx);
      const speed = this.getBulletSpeed();

      // 탄환 종류 결정 (기본: 노랑/주황 일반탄 80%, 고속탄 15%, 특수 대형탄 5%)
      const randType = Math.random();
      let type = 'normal';
      let radius = 3.5;
      let color = '#ffb703';

      if (randType > 0.94) {
        type = 'heavy';
        radius = 6.0;
        color = '#ff006e';
      } else if (randType > 0.82) {
        type = 'fast';
        radius = 3.0;
        color = '#00f5d4';
      }

      const bullet = {
        id: ++this.totalBulletsSpawned,
        x: sx,
        y: sy,
        vx: Math.cos(angle) * speed * (type === 'fast' ? 1.35 : (type === 'heavy' ? 0.75 : 1)),
        vy: Math.sin(angle) * speed * (type === 'fast' ? 1.35 : (type === 'heavy' ? 0.75 : 1)),
        radius: radius,
        type: type,
        color: color
      };

      this.bullets.push(bullet);
    }

    /**
     * 폭발 파티클 생성
     */
    createExplosion(x, y, count = 35) {
      const colors = ['#ff0055', '#ff9900', '#ffee00', '#00ffff', '#ffffff'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 220 + 30;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2,
          life: 1.0,        // 1.0 -> 0.0
          decay: Math.random() * 1.5 + 0.8
        });
      }
    }

    /**
     * 1 프레임 단위 물리 시뮬레이션 업데이트
     * @param {number} dt - 프레임 간 경과 시간 (초, 보통 약 0.016s)
     * @param {object} input - { left, right, up, down, targetX, targetY, touchActive }
     */
    update(dt, input = {}) {
      if (this.isGameOver || this.isPaused) {
        // 파티클만 감쇠
        this.updateParticles(dt);
        return;
      }

      // 델타 타임 제한 (너무 큰 렉 방지)
      const safeDt = Math.min(dt, 0.1);

      // 1. 생존 시간 갱신
      this.elapsedTime += safeDt;

      // 2. 플레이어 위치 갱신
      if (input.touchActive && typeof input.targetX === 'number' && typeof input.targetY === 'number') {
        // 모바일 터치 드래그 추종 모드 (부드러운 보간)
        const lerpFactor = 0.35;
        this.player.x += (input.targetX - this.player.x) * lerpFactor;
        this.player.y += (input.targetY - this.player.y) * lerpFactor;
      } else {
        // 키보드 또는 가상 패드 입력
        let moveX = 0;
        let moveY = 0;

        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;
        if (input.up) moveY -= 1;
        if (input.down) moveY += 1;

        // 대각선 이동 시 속도 정규화
        if (moveX !== 0 && moveY !== 0) {
          const norm = Math.SQRT1_2; // 1 / sqrt(2)
          moveX *= norm;
          moveY *= norm;
        }

        this.player.x += moveX * this.player.speed * safeDt;
        this.player.y += moveY * this.player.speed * safeDt;
      }

      // 화면 경계 제한 (플레이어 캔버스 밖 이탈 방지)
      const boundMargin = this.player.visualRadius;
      this.player.x = Math.max(boundMargin, Math.min(this.width - boundMargin, this.player.x));
      this.player.y = Math.max(boundMargin, Math.min(this.height - boundMargin, this.player.y));

      // 3. 탄환 스폰 처리
      this.bulletSpawnTimer += safeDt;
      const interval = this.getSpawnInterval();
      while (this.bulletSpawnTimer >= interval) {
        this.spawnBullet();
        this.bulletSpawnTimer -= interval;
      }

      // 4. 탄환 이동 및 화면 이탈 삭제
      const despawnMargin = 60;
      const activeBullets = [];

      for (let i = 0; i < this.bullets.length; i++) {
        const b = this.bullets[i];
        b.x += b.vx * safeDt;
        b.y += b.vy * safeDt;

        // 화면 영역 밖으로 멀리 나가면 제거
        const isOutOfBounds = (
          b.x < -despawnMargin ||
          b.x > this.width + despawnMargin ||
          b.y < -despawnMargin ||
          b.y > this.height + despawnMargin
        );

        if (!isOutOfBounds) {
          // 5. 플레이어 충돌 검사 (코어 히트박스)
          if (DodgeLogic.checkCircleCollision(
            this.player.x, this.player.y, this.player.hitRadius,
            b.x, b.y, b.radius
          )) {
            // 피격 발생! 게임 오버!
            this.triggerGameOver();
            return;
          }
          activeBullets.push(b);
        }
      }

      this.bullets = activeBullets;

      // 6. 파티클 업데이트
      this.updateParticles(safeDt);
    }

    /**
     * 파티클 감쇠 및 이동
     */
    updateParticles(dt) {
      const activeParticles = [];
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life > 0) {
          activeParticles.push(p);
        }
      }
      this.particles = activeParticles;
    }

    /**
     * 게임 오버 처리
     */
    triggerGameOver() {
      this.isGameOver = true;
      this.player.isDead = true;
      this.createExplosion(this.player.x, this.player.y, 45);
    }
  }

  DodgeLogic.GameEngine = GameEngine;

  // 전역 및 모듈 내보내기 지원
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DodgeLogic;
  }
  global.DodgeLogic = DodgeLogic;

})(typeof window !== 'undefined' ? window : this);
