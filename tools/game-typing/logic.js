/**
 * ==========================================================================
 * SimuLab - 스피드 타자 산성비 게임 엔진 (logic.js)
 * 파일 경로: tools/game-typing/logic.js
 * --------------------------------------------------------------------------
 * - 고전 명작 한메타자교사 스타일의 단어 낙하 및 산성 바다 시뮬레이션
 * - 금융·투자·일상·사자성어 200여 종 테마 단어 사전 탑재
 * - 특수 단어 (💣 전체 폭탄, ❄️ 빙결 슬로우, ❤️ 하트 회복) 시스템
 * - 분당 타수(CPM) 및 연속 격추 콤보 점수 알고리즘
 * - 바닥 침식 충돌 판정 및 라이프(하트 5개) 관리
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const TypingLogic = {};

  // 캔버스 논리 해상도
  TypingLogic.CANVAS_WIDTH = 400;
  TypingLogic.CANVAS_HEIGHT = 520;
  TypingLogic.SEA_LEVEL = 460; // 바닥 산성 바다 수면 Y 좌표

  // SimuLab 특화 테마 단어 데이터베이스 (총 220개 단어)
  TypingLogic.WORD_BANK = [
    // [1] 금융·투자·재테크 (110개)
    '복리', '배당', '금리', '환율', '주식', '채권', '부동산', '대출', '원금', '이자',
    '코스피', '코스닥', '나스닥', '양도세', '취득세', '종부세', '퇴직금', '연금', '원리금', '평단가',
    '물타기', '불타기', '우량주', '가치주', '성장주', '배당락', '분산투자', '자산배분', '현금흐름', '기회비용',
    '적립식', '거치식', '포트폴리오', '인플레이션', '디플레이션', '레버리지', '금융소득', '종합소득', '비과세', '소득공제',
    '세액공제', '배당성장', '상장지수', '공모주', '실수령액', '체감시급', '최저임금', '국민연금', '퇴직연금', '개인연금',
    '주택담보', '전세자금', '월세수익', '청약통장', '시세차익', '재무제표', '손익계산', '영업이익', '당기순익', '부채비율',
    '자기자본', '유동자산', '순자산', '시가총액', '주당순익', '주가수익', '주가순자산', '배당성향', '배당수익률', '달러환전',
    '외환보유', '기준금리', '콜금리', '국채금리', '회사채', '전단채', '단기자금', '머니마켓', '신용등급', '신용점수',
    '대환대출', '변동금리', '고정금리', '혼합금리', '스트레스', '총부채원리금', '담보인정', '총부채상환', '중도상환', '우대금리',
    '조기은퇴', '파이어족', '노후자금', '자본주의', '화폐가치', '구매력', '소비습관', '종잣돈', '통장쪼개기', '비상금',
    '적금만기', '예금자보호', '단기투자', '장기보유', '스윙투자', '데이트레이딩', '손절매', '익절매', '차트분석', '추세추종',

    // [2] 일상·라이프·과학 (60개)
    '모래시계', '커피값', '카페인', '반감기', '기초대사', '유지칼로리', '수면주기', '골든타임', '심박수', '숙취해소',
    '위드마크', '혈중알코올', '더치페이', '사다리타기', '만나이', '생체나이', '재물운', '사주팔자', '오행분석', '로또번호',
    '확률통계', '동물성향', '애착유형', '워라밸', '소확행', '갓생살기', '미라클모닝', '헬스케어', '인터벌러닝', '존투트레이닝',
    '단백질', '수분보충', '체지방률', '근육량', '스트레칭', '마인드셋', '루틴형성', '자기계발', '동기부여', '생산성',
    '시간관리', '스마트워크', '디지털노마드', '미니멀라이프', '제로웨이스트', '친환경', '탄소중립', '신재생에너지', '인공지능', '머신러닝',
    '빅데이터', '클라우드', '알고리즘', '자동화', '스마트폰', '소셜미디어', '네트워크', '보안인증', '개인정보', '암호화',

    // [3] 사자성어 & 지혜 (50개)
    '일석이조', '고진감래', '전화위복', '유비무환', '대기만성', '다다익선', '십시일반', '작심삼일', '동병상련', '역지사지',
    '새옹지마', '온고지신', '마부작침', '우공이산', '형설지공', '자수성가', '권선징악', '결초보은', '백발백중', '명경지수',
    '풍수지리', '초지일관', '칠전팔기', '금상첨화', '설상가상', '구사일생', '살신성인', '군계일학', '청출어람', '일취월장',
    '교학상장', '진인사대천명', '과유불급', '수수방관', '동문서답', '오리무중', '배은망덕', '유구무언', '일목요연', '방방곡곡',
    '승승장구', '파죽지세', '호시우보', '우후죽순', '풍전등화', '절체절명', '사면초가', '배수지진', '괄목상대', '화룡점정'
  ];

  /**
   * 분당 타수(CPM) 계산 공식
   * @param {number} totalChars - 격추한 총 글자 수
   * @param {number} elapsedSeconds - 경과 시간(초)
   * @returns {number} CPM (타/분)
   */
  TypingLogic.calculateCPM = function (totalChars, elapsedSeconds) {
    if (typeof totalChars !== 'number' || totalChars <= 0) return 0;
    if (typeof elapsedSeconds !== 'number' || elapsedSeconds <= 1) return 0;
    const minutes = elapsedSeconds / 60;
    return Math.round(totalChars / minutes);
  };

  /**
   * 스피드 타자 산성비 게임 물리 엔진
   */
  class TypingEngine {
    constructor(width = TypingLogic.CANVAS_WIDTH, height = TypingLogic.CANVAS_HEIGHT) {
      this.width = width;
      this.height = height;
      this.seaLevel = TypingLogic.SEA_LEVEL;
      this.reset();
    }

    /**
     * 게임 초기화
     */
    reset() {
      this.words = [];             // 화면에 떨어지는 단어 객체 배열
      this.particles = [];         // 격추 및 물보라 파티클
      this.floatTexts = [];        // 점수 획득 플로팅 텍스트 (+250)

      this.score = 0;              // 현재 점수
      this.lives = 5;              // 하트 개수 (최대 5개)
      this.combo = 0;              // 연속 성공 콤보 카운트
      this.maxCombo = 0;           // 최대 콤보
      this.level = 1;              // 현재 레벨 (시간 경과에 따라 상승)

      this.totalWordsSpawned = 0;  // 생성된 총 단어 수
      this.totalWordsHit = 0;      // 타이핑 성공한 단어 수
      this.totalCharsHit = 0;      // 타이핑 성공한 총 글자 수
      this.totalDrops = 0;         // 바닥에 떨어진 단어 수

      this.elapsedTime = 0;        // 총 게임 시간(초)
      this.spawnTimer = 0;         // 단어 생성 타이머
      this.freezeTimer = 0;        // 빙결 아이템 잔여 시간(초)

      this.isGameOver = false;
      this.isPaused = false;
    }

    /**
     * 현재 레벨 및 시간에 따른 단어 스폰 간격(초)
     */
    getSpawnInterval() {
      // 레벨이 올라갈수록 스폰 주기가 1.7초 -> 0.7초로 빨라짐
      const base = 1.75 - Math.min(this.level * 0.15, 1.0);
      return Math.max(0.65, base);
    }

    /**
     * 현재 단어 낙하 속도 (픽셀/초)
     */
    getDropSpeed() {
      // 기본 속도 38px/s + 레벨당 6px/s 추가
      let speed = 38 + (this.level - 1) * 7.5;
      // 빙결 상태면 50% 감속
      if (this.freezeTimer > 0) {
        speed *= 0.5;
      }
      return speed;
    }

    /**
     * 새로운 단어 1개 생성 (화면 상단 무작위 X 좌표)
     */
    spawnWord() {
      const bank = TypingLogic.WORD_BANK;
      const text = bank[Math.floor(Math.random() * bank.length)];

      // 화면에 이미 있는 단어와 중복 방지 (선택적)
      const isDuplicate = this.words.some(w => w.text === text);
      if (isDuplicate && Math.random() > 0.3) return; // 70% 확률로 다른 단어 재추첨

      // 단어 너비 대략적 추정 (글자당 약 18px + 여백)
      const estimatedWidth = text.length * 20 + 20;
      const minX = 15;
      const maxX = this.width - estimatedWidth - 15;
      const spawnX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

      // 특수 아이템 단어 확률 (폭탄 4%, 빙결 5%, 하트회복 4%)
      const randType = Math.random();
      let type = 'normal';
      let badge = '';

      if (randType < 0.04) {
        type = 'bomb';
        badge = '💣';
      } else if (randType < 0.09) {
        type = 'freeze';
        badge = '❄️';
      } else if (randType < 0.13 && this.lives < 5) {
        type = 'heal';
        badge = '❤️';
      }

      this.words.push({
        id: ++this.totalWordsSpawned,
        text: text,
        x: spawnX,
        y: 10,                 // 화면 최상단에서 시작
        speed: this.getDropSpeed() * (0.9 + Math.random() * 0.2), // 약간의 개별 속도 편차
        type: type,
        badge: badge,
        width: estimatedWidth,
        height: 28
      });
    }

    /**
     * 사용자 입력 단어 검증 및 격추 처리
     * @param {string} rawInput - 사용자가 타이핑한 문자열
     * @returns {object} { hit: boolean, word: object|null, points: number, type: string }
     */
    submitWord(rawInput) {
      if (this.isGameOver || this.isPaused) return { hit: false };
      const typed = (rawInput || '').trim();
      if (!typed) return { hit: false };

      // 일치하는 단어들 찾기
      const matched = this.words.filter(w => w.text === typed);
      if (matched.length === 0) {
        // 일치하는 단어 없음 (오타) -> 콤보 리셋
        this.combo = 0;
        return { hit: false };
      }

      // 화면에서 가장 바닥에 가까운(Y좌표가 가장 큰) 단어를 우선 타겟
      matched.sort((a, b) => b.y - a.y);
      const target = matched[0];

      // 일치 단어 격추 제거
      this.words = this.words.filter(w => w.id !== target.id);

      // 점수 계산: (글자 수 * 100) * (1 + 콤보 * 0.1)
      this.combo += 1;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const comboBonus = 1 + (this.combo - 1) * 0.1;
      const basePoints = target.text.length * 100;
      let finalPoints = Math.round(basePoints * comboBonus);

      // 특수 아이템 효과 처리
      let effectDescription = '';
      if (target.type === 'bomb') {
        // 💣 화면 전체 단어 일괄 격추
        const count = this.words.length;
        this.words.forEach(w => {
          this.createWordExplosion(w.x + w.width / 2, w.y + 14, '#ff9900');
        });
        const bombBonus = count * 150;
        finalPoints += bombBonus;
        this.words = [];
        effectDescription = `전체 폭파! (+${bombBonus})`;
      } else if (target.type === 'freeze') {
        // ❄️ 5초간 빙결 슬로우
        this.freezeTimer = 5.0;
        effectDescription = '5초 빙결!';
      } else if (target.type === 'heal') {
        // ❤️ 하트 회복 (최대 5개)
        if (this.lives < 5) {
          this.lives += 1;
          effectDescription = '생명 +1!';
        }
      }

      this.score += finalPoints;
      this.totalWordsHit += 1;
      this.totalCharsHit += target.text.length;

      // 시각 효과 생성 (격추 파티클 & 플로팅 점수)
      this.createWordExplosion(target.x + target.width / 2, target.y + 14, '#38bdf8');
      this.addFloatingText(`+${finalPoints} ${effectDescription}`, target.x + target.width / 2, target.y);

      return {
        hit: true,
        word: target,
        points: finalPoints,
        type: target.type
      };
    }

    /**
     * 격추 파티클 생성
     */
    createWordExplosion(x, y, color = '#38bdf8') {
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 120 + 40;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          size: Math.random() * 3.5 + 1.5,
          life: 1.0,
          decay: Math.random() * 1.8 + 1.2
        });
      }
    }

    /**
     * 산성 바다 물보라 파티클 생성
     */
    createSplash(x, y) {
      for (let i = 0; i < 18; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6; // 위쪽으로 튀김
        const speed = Math.random() * 140 + 60;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: '#10b981', // 에메랄드 산성액
          size: Math.random() * 4 + 2,
          life: 1.0,
          decay: 2.2
        });
      }
    }

    /**
     * 플로팅 점수 텍스트 추가
     */
    addFloatingText(text, x, y) {
      this.floatTexts.push({
        text: text,
        x: x,
        y: y,
        life: 1.0,
        decay: 1.1
      });
    }

    /**
     * 매 프레임 시뮬레이션 갱신
     * @param {number} dt - 델타 타임(초)
     */
    update(dt) {
      if (this.isGameOver || this.isPaused) {
        this.updateEffects(dt);
        return;
      }

      const safeDt = Math.min(dt, 0.1);
      this.elapsedTime += safeDt;

      // 빙결 타이머 감소
      if (this.freezeTimer > 0) {
        this.freezeTimer = Math.max(0, this.freezeTimer - safeDt);
      }

      // 레벨 상승 공식: 25초마다 레벨 1씩 증가 (최대 레벨 8)
      this.level = Math.min(8, Math.floor(this.elapsedTime / 25) + 1);

      // 단어 스폰 타이머
      this.spawnTimer += safeDt;
      const interval = this.getSpawnInterval();
      if (this.spawnTimer >= interval) {
        this.spawnWord();
        this.spawnTimer = 0;
      }

      // 단어 낙하 및 바다 침식 충돌 판정
      const activeWords = [];
      const currentSpeed = this.getDropSpeed();

      for (let i = 0; i < this.words.length; i++) {
        const w = this.words[i];
        // 개별 단어 낙하
        const speedRatio = this.freezeTimer > 0 ? 0.5 : 1.0;
        w.y += w.speed * speedRatio * safeDt;

        // 바닥 산성 바다 도달 판정
        if (w.y + w.height >= this.seaLevel) {
          // 산성 바다에 단어 침식!
          this.lives -= 1;
          this.combo = 0; // 콤보 끊김
          this.totalDrops += 1;
          this.createSplash(w.x + w.width / 2, this.seaLevel);
          this.addFloatingText('MISS!', w.x + w.width / 2, this.seaLevel - 10);

          if (this.lives <= 0) {
            this.isGameOver = true;
          }
        } else {
          activeWords.push(w);
        }
      }

      this.words = activeWords;

      // 파티클 & 플로팅 텍스트 감쇠
      this.updateEffects(safeDt);
    }

    /**
     * 이펙트 감쇠
     */
    updateEffects(dt) {
      // 파티클
      const nextParticles = [];
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life > 0) nextParticles.push(p);
      }
      this.particles = nextParticles;

      // 플로팅 텍스트
      const nextTexts = [];
      for (let i = 0; i < this.floatTexts.length; i++) {
        const ft = this.floatTexts[i];
        ft.y -= 25 * dt; // 위로 서서히 부유
        ft.life -= ft.decay * dt;
        if (ft.life > 0) nextTexts.push(ft);
      }
      this.floatTexts = nextTexts;
    }

    /**
     * 현재 분당 타수(CPM) 반환
     */
    getCurrentCPM() {
      return TypingLogic.calculateCPM(this.totalCharsHit, this.elapsedTime);
    }
  }

  TypingLogic.TypingEngine = TypingEngine;

  // 모듈 내보내기
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TypingLogic;
  }
  global.TypingLogic = TypingLogic;

})(typeof window !== 'undefined' ? window : this);
