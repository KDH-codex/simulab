/**
 * ==========================================================================
 * SimuLab - 네온 벽돌 깨기 물리 엔진 (logic.js)
 * 파일 경로: tools/game-brick-breaker/logic.js
 * --------------------------------------------------------------------------
 * - 클래식 알카노이드(Arkanoid) 기반 패들 입사각 반사 물리 시뮬레이션
 * - 공-벽돌 정밀 AABB 경계 반사 벡터 계산
 * - 멀티 볼(공 3개 분열), 와이드 패들, 레이저 캐논, 하트 회복 아이템
 * - 다단계 스테이지 벽돌 생성 및 점수/콤보 계산
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const BrickLogic = {};

  // 캔버스 논리 해상도 (반응형 3:4 비율)
  BrickLogic.CANVAS_WIDTH = 400;
  BrickLogic.CANVAS_HEIGHT = 540;

  // 벽돌 규격
  BrickLogic.BRICK_CONFIG = {
    cols: 7,
    rows: 6,
    width: 48,
    height: 18,
    padding: 6,
    offsetTop: 55,
    offsetLeft: 14
  };

  /**
   * 원과 직사각형(AABB) 충돌 및 반사 방향 판정
   */
  BrickLogic.checkCircleRectCollision = function (cx, cy, radius, rx, ry, rw, rh) {
    // 가장 가까운 점 찾기
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));

    const dx = cx - closestX;
    const dy = cy - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq > radius * radius) {
      return { collide: false };
    }

    // 충돌 방향 결정 (상하 vs 좌우)
    const overlapLeft = cx - rx;
    const overlapRight = (rx + rw) - cx;
    const overlapTop = cy - ry;
    const overlapBottom = (ry + rh) - cy;

    const minOverlapX = Math.min(Math.abs(overlapLeft), Math.abs(overlapRight));
    const minOverlapY = Math.min(Math.abs(overlapTop), Math.abs(overlapBottom));

    return {
      collide: true,
      side: minOverlapX < minOverlapY ? 'horizontal' : 'vertical'
    };
  };

  /**
   * 네온 벽돌 깨기 물리 엔진 클래스
   */
  class GameEngine {
    constructor(width = BrickLogic.CANVAS_WIDTH, height = BrickLogic.CANVAS_HEIGHT) {
      this.width = width;
      this.height = height;
      this.reset();
    }

    /**
     * 전체 게임 초기화
     */
    reset() {
      this.score = 0;
      this.lives = 3;
      this.stage = 1;
      this.combo = 0;
      this.maxCombo = 0;

      // 패들 상태
      this.paddle = {
        x: this.width / 2 - 40,
        y: this.height - 35,
        baseWidth: 80,
        width: 80,
        height: 12,
        speed: 380,
        wideTimer: 0,
        laserTimer: 0,
        laserCooldown: 0
      };

      this.balls = [];             // 활성 공 배열 (멀티볼 지원)
      this.bricks = [];            // 벽돌 배열
      this.items = [];             // 떨어지는 아이템 캡슐
      this.lasers = [];            // 발사된 레이저 탄환
      this.particles = [];         // 폭발 파티클
      this.floatTexts = [];        // 획득 점수 텍스트

      this.isBallLaunched = false; // 공이 패들에서 발사되었는지 여부
      this.isGameOver = false;
      this.isPaused = false;
      this.isStageClearing = false;

      // 스테이지 1 벽돌 구성
      this.buildStage(this.stage);
      this.spawnInitialBall();
    }

    /**
     * 패들 위에 최초 공 스폰
     */
    spawnInitialBall() {
      this.balls = [{
        x: this.paddle.x + this.paddle.width / 2,
        y: this.paddle.y - 7,
        vx: 0,
        vy: 0,
        radius: 6,
        baseSpeed: 290 + (this.stage - 1) * 20,
        speed: 290 + (this.stage - 1) * 20
      }];
      this.isBallLaunched = false;
    }

    /**
     * 공 발사 (게임 시작 또는 미스 후 재발사)
     */
    launchBall() {
      if (this.isBallLaunched || this.balls.length === 0) return;
      const b = this.balls[0];
      // 약간의 랜덤 각도로 상향 발사
      const angle = (Math.random() - 0.5) * 0.5; // -15도 ~ +15도
      b.vx = Math.sin(angle) * b.speed;
      b.vy = -Math.cos(angle) * b.speed;
      this.isBallLaunched = true;
    }

    /**
     * 스테이지별 벽돌 레이아웃 구성
     */
    buildStage(stageNum) {
      this.bricks = [];
      const cfg = BrickLogic.BRICK_CONFIG;
      const palette = [
        { color: '#f43f5e', points: 100 }, // 핑크
        { color: '#fb923c', points: 100 }, // 오렌지
        { color: '#facc15', points: 120 }, // 옐로우
        { color: '#10b981', points: 120 }, // 에메랄드
        { color: '#38bdf8', points: 150 }, // 시안
        { color: '#a855f7', points: 150 }  // 바이올렛
      ];

      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          const x = cfg.offsetLeft + c * (cfg.width + cfg.padding);
          const y = cfg.offsetTop + r * (cfg.height + cfg.padding);

          // 스테이지별 특수 벽돌 배치
          let hp = 1;
          let isHard = false;
          let itemDrop = null;

          // 스테이지 2 이상에서는 2타 벽돌 혼합
          if (stageNum > 1 && (r + c) % 3 === 0) {
            hp = 2;
            isHard = true;
          }

          // 아이템 드롭 확률 (약 18%)
          const randItem = Math.random();
          if (randItem < 0.06) {
            itemDrop = 'multiball'; // 🔮 공 3개 분열
          } else if (randItem < 0.11) {
            itemDrop = 'wide';      // 📏 패들 확장
          } else if (randItem < 0.15) {
            itemDrop = 'laser';     // 🔫 레이저
          } else if (randItem < 0.18) {
            itemDrop = 'heart';     // ❤️ 생명 추가
          }

          const styleInfo = palette[r % palette.length];

          this.bricks.push({
            id: `${r}_${c}`,
            x: x,
            y: y,
            width: cfg.width,
            height: cfg.height,
            hp: hp,
            maxHp: hp,
            isHard: isHard,
            color: isHard ? '#cbd5e1' : styleInfo.color,
            points: isHard ? 250 : styleInfo.points,
            item: itemDrop
          });
        }
      }
    }

    /**
     * 레이저 발사
     */
    shootLaser() {
      if (this.paddle.laserTimer <= 0 || this.paddle.laserCooldown > 0) return;
      this.paddle.laserCooldown = 0.22; // 0.22초당 1쌍 발사

      // 패들 좌우 끝에서 2발 발사
      this.lasers.push({
        x: this.paddle.x + 8,
        y: this.paddle.y - 4,
        vy: -480,
        width: 3,
        height: 12
      });
      this.lasers.push({
        x: this.paddle.x + this.paddle.width - 11,
        y: this.paddle.y - 4,
        vy: -480,
        width: 3,
        height: 12
      });
    }

    /**
     * 멀티 볼 분열 (공 3배 증가)
     */
    triggerMultiBall() {
      const newBalls = [];
      this.balls.forEach(b => {
        // 기존 공 속도 기준 +30도, -30도 회전한 공 2개 추가
        const speed = b.speed;
        const currentAngle = Math.atan2(b.vy, b.vx);

        const a1 = currentAngle + 0.52; // +30도
        const a2 = currentAngle - 0.52; // -30도

        newBalls.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(a1) * speed,
          vy: Math.sin(a1) * speed,
          radius: b.radius,
          baseSpeed: b.baseSpeed,
          speed: speed
        });
        newBalls.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(a2) * speed,
          vy: Math.sin(a2) * speed,
          radius: b.radius,
          baseSpeed: b.baseSpeed,
          speed: speed
        });
      });

      this.balls.push(...newBalls);
      // 최대 18개까지만 제한 (성능 방어)
      if (this.balls.length > 18) {
        this.balls = this.balls.slice(0, 18);
      }
    }

    /**
     * 파티클 생성
     */
    createParticles(x, y, color = '#38bdf8', count = 12) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 140 + 30;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          size: Math.random() * 3 + 1.5,
          life: 1.0,
          decay: Math.random() * 1.8 + 1.2
        });
      }
    }

    /**
     * 플로팅 점수 추가
     */
    addFloatingText(text, x, y, color = '#38bdf8') {
      this.floatTexts.push({
        text: text,
        x: x,
        y: y,
        color: color,
        life: 1.0,
        decay: 1.2
      });
    }

    /**
     * 1 프레임 단위 물리 시뮬레이션
     */
    update(dt, input = {}) {
      if (this.isGameOver || this.isPaused) {
        this.updateEffects(dt);
        return;
      }

      const safeDt = Math.min(dt, 0.05);

      // 1. 패들 타이머 관리 (와이드 & 레이저)
      if (this.paddle.wideTimer > 0) {
        this.paddle.wideTimer -= safeDt;
        this.paddle.width = this.paddle.baseWidth * 1.35;
      } else {
        this.paddle.width = this.paddle.baseWidth;
      }

      if (this.paddle.laserTimer > 0) {
        this.paddle.laserTimer -= safeDt;
        if (this.paddle.laserCooldown > 0) {
          this.paddle.laserCooldown -= safeDt;
        }
        // 자동 연사
        if (this.paddle.laserCooldown <= 0) {
          this.shootLaser();
        }
      }

      // 2. 패들 위치 이동 (터치/마우스 또는 키보드)
      if (typeof input.targetPaddleX === 'number') {
        // 마우스 및 터치 드래그 위치로 직접 추종
        this.paddle.x = input.targetPaddleX - this.paddle.width / 2;
      } else {
        // 키보드 방향키
        if (input.left) this.paddle.x -= this.paddle.speed * safeDt;
        if (input.right) this.paddle.x += this.paddle.speed * safeDt;
      }

      // 화면 경계 제한
      this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));

      // 발사 전이면 공이 패들 위에 고정
      if (!this.isBallLaunched) {
        if (this.balls.length > 0) {
          this.balls[0].x = this.paddle.x + this.paddle.width / 2;
          this.balls[0].y = this.paddle.y - this.balls[0].radius - 1;
        }
        if (input.launch) {
          this.launchBall();
        }
      }

      // 3. 레이저 탄환 이동 및 벽돌 타격
      const nextLasers = [];
      for (let i = 0; i < this.lasers.length; i++) {
        const l = this.lasers[i];
        l.y += l.vy * safeDt;

        let laserHit = false;
        for (let j = 0; j < this.bricks.length; j++) {
          const br = this.bricks[j];
          if (l.x >= br.x && l.x <= br.x + br.width && l.y >= br.y && l.y <= br.y + br.height) {
            // 레이저 적중!
            laserHit = true;
            this.damageBrick(br, j);
            break;
          }
        }

        if (!laserHit && l.y > -20) {
          nextLasers.push(l);
        }
      }
      this.lasers = nextLasers;

      // 4. 아이템 캡슐 낙하 및 패들 획득 판정
      const nextItems = [];
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        it.y += it.vy * safeDt;

        // 패들과 충돌 판정
        if (
          it.y + it.radius >= this.paddle.y &&
          it.y - it.radius <= this.paddle.y + this.paddle.height &&
          it.x >= this.paddle.x &&
          it.x <= this.paddle.x + this.paddle.width
        ) {
          // 아이템 획득!
          this.collectItem(it);
        } else if (it.y < this.height + 20) {
          nextItems.push(it);
        }
      }
      this.items = nextItems;

      // 5. 공 물리 시뮬레이션 (발사된 상태일 때)
      if (this.isBallLaunched) {
        const activeBalls = [];

        for (let i = 0; i < this.balls.length; i++) {
          const b = this.balls[i];
          b.x += b.vx * safeDt;
          b.y += b.vy * safeDt;

          // 좌우 벽면 반사
          if (b.x - b.radius <= 0) {
            b.x = b.radius;
            b.vx = Math.abs(b.vx);
          } else if (b.x + b.radius >= this.width) {
            b.x = this.width - b.radius;
            b.vx = -Math.abs(b.vx);
          }

          // 천장 반사
          if (b.y - b.radius <= 0) {
            b.y = b.radius;
            b.vy = Math.abs(b.vy);
          }

          // 패들과의 충돌 반사 (알카노이드 핵심 물리)
          if (
            b.vy > 0 &&
            b.y + b.radius >= this.paddle.y &&
            b.y - b.radius <= this.paddle.y + this.paddle.height &&
            b.x >= this.paddle.x - b.radius &&
            b.x <= this.paddle.x + this.paddle.width + b.radius
          ) {
            // 패들 중심 기준 오프셋 (-1.0 ~ +1.0)
            const paddleCenter = this.paddle.x + this.paddle.width / 2;
            const hitOffset = (b.x - paddleCenter) / (this.paddle.width / 2);
            const clampedOffset = Math.max(-0.95, Math.min(0.95, hitOffset));

            // 반사 각도: 최대 65도
            const maxAngle = Math.PI * 0.36;
            const bounceAngle = clampedOffset * maxAngle;

            b.vx = Math.sin(bounceAngle) * b.speed;
            b.vy = -Math.cos(bounceAngle) * b.speed;
            b.y = this.paddle.y - b.radius - 1;

            this.combo = 0; // 패들에 닿으면 콤보 리셋
            this.createParticles(b.x, b.y, '#38bdf8', 6);
          }

          // 벽돌과의 충돌 검사
          for (let j = 0; j < this.bricks.length; j++) {
            const br = this.bricks[j];
            const col = BrickLogic.checkCircleRectCollision(
              b.x, b.y, b.radius,
              br.x, br.y, br.width, br.height
            );

            if (col.collide) {
              // 반사 벡터 적용
              if (col.side === 'horizontal') {
                b.vx = -b.vx;
              } else {
                b.vy = -b.vy;
              }

              this.damageBrick(br, j);
              break; // 한 번에 한 벽돌만 타격
            }
          }

          // 바닥 추락 검사
          if (b.y - b.radius <= this.height) {
            activeBalls.push(b);
          }
        }

        this.balls = activeBalls;

        // 모든 공이 바닥으로 추락했을 때
        if (this.balls.length === 0) {
          this.handleMiss();
        }
      }

      // 6. 스테이지 클리어 검사 (모든 벽돌 파괴 시)
      if (this.bricks.length === 0 && !this.isStageClearing) {
        this.handleStageClear();
      }

      // 파티클 & 플로팅 텍스트 갱신
      this.updateEffects(safeDt);
    }

    /**
     * 벽돌 타격 데미지 처리
     */
    damageBrick(br, index) {
      br.hp -= 1;
      this.combo += 1;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const comboBonus = 1 + (this.combo - 1) * 0.1;
      const pts = Math.round(br.points * comboBonus);
      this.score += pts;

      if (br.hp <= 0) {
        // 벽돌 파괴!
        this.bricks.splice(index, 1);
        this.createParticles(br.x + br.width / 2, br.y + br.height / 2, br.color, 16);
        this.addFloatingText(`+${pts}`, br.x + br.width / 2, br.y, br.color);

        // 아이템 드롭
        if (br.item) {
          this.dropItem(br.x + br.width / 2, br.y + br.height / 2, br.item);
        }
      } else {
        // 강화 벽돌 1타 피격 시 색상 변경
        br.color = '#e2e8f0';
        this.createParticles(br.x + br.width / 2, br.y + br.height / 2, '#cbd5e1', 6);
        this.addFloatingText('CRACK!', br.x + br.width / 2, br.y, '#f8fafc');
      }
    }

    /**
     * 아이템 캡슐 드롭
     */
    dropItem(x, y, type) {
      this.items.push({
        x: x,
        y: y,
        vy: 130,
        type: type,
        radius: 11
      });
    }

    /**
     * 아이템 획득 효과 적용
     */
    collectItem(item) {
      this.createParticles(item.x, item.y, '#facc15', 18);

      switch (item.type) {
        case 'multiball':
          this.triggerMultiBall();
          this.addFloatingText('🔮 MULTI BALL!', item.x, item.y - 10, '#38bdf8');
          break;
        case 'wide':
          this.paddle.wideTimer = 15.0; // 15초간 와이드
          this.addFloatingText('📏 WIDE PADDLE!', item.x, item.y - 10, '#10b981');
          break;
        case 'laser':
          this.paddle.laserTimer = 12.0; // 12초간 레이저
          this.addFloatingText('🔫 LASER CANNON!', item.x, item.y - 10, '#f43f5e');
          break;
        case 'heart':
          if (this.lives < 5) {
            this.lives += 1;
            this.addFloatingText('❤️ LIFE +1!', item.x, item.y - 10, '#ec4899');
          }
          break;
      }
    }

    /**
     * 공 놓침 (미스) 처리
     */
    handleMiss() {
      this.lives -= 1;
      this.combo = 0;
      this.paddle.wideTimer = 0;
      this.paddle.laserTimer = 0;
      this.items = [];
      this.lasers = [];

      if (this.lives <= 0) {
        this.isGameOver = true;
      } else {
        this.spawnInitialBall();
      }
    }

    /**
     * 스테이지 클리어 처리
     */
    handleStageClear() {
      this.isStageClearing = true;
      const stageBonus = this.stage * 1000;
      this.score += stageBonus;
      this.addFloatingText(`STAGE ${this.stage} CLEAR! (+${stageBonus})`, this.width / 2, this.height / 2, '#facc15');

      setTimeout(() => {
        this.stage += 1;
        this.buildStage(this.stage);
        this.spawnInitialBall();
        this.isStageClearing = false;
      }, 1200);
    }

    /**
     * 시각 효과 감쇠
     */
    updateEffects(dt) {
      const nextParticles = [];
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life > 0) nextParticles.push(p);
      }
      this.particles = nextParticles;

      const nextTexts = [];
      for (let i = 0; i < this.floatTexts.length; i++) {
        const ft = this.floatTexts[i];
        ft.y -= 25 * dt;
        ft.life -= ft.decay * dt;
        if (ft.life > 0) nextTexts.push(ft);
      }
      this.floatTexts = nextTexts;
    }
  }

  BrickLogic.GameEngine = GameEngine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrickLogic;
  }
  global.BrickLogic = BrickLogic;

})(typeof window !== 'undefined' ? window : this);
