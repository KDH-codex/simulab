/**
 * ==========================================================================
 * [도구 4] 심박수 Zone 2 및 러닝 페이스·칼로리 시뮬레이터 - 순수 계산 모듈
 * 파일 경로: tools/running-zone-calc/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 러너의 나이, 안정시 심박수(RHR), 체중, 목표 페이스 및 거리를 입력받아
 *   스포츠 과학 표준인 '카르보넨(Karvonen) 여유 심박수 공식'으로 개인 맞춤형
 *   Zone 1 ~ Zone 5 심박수 구간을 계산하는 순수 함수(Pure Function) 파일입니다.
 * - 로컬(file://) 환경과 Node.js 테스트 환경 모두에서 동작하도록 UMD 패턴을 적용했습니다.
 * ==========================================================================
 */

const DEFAULT_RUNNING_INPUTS = {
  age: 35,                // 만 나이 (세)
  restingHr: 60,          // 안정시 심박수 (RHR, bpm)
  weightKg: 70,           // 체중 (kg)
  paceTotalSeconds: 360,  // km당 목표 페이스 (초 단위: 360초 = 6분 00초/km)
  distanceKm: 10,         // 목표 러닝 거리 (km)
  maxHrFormula: 1,        // 최대심박수 공식 선택 (1: 220-나이 표준, 2: 208-0.7*나이 다나카 공식)
};

/**
 * 입력값을 안전한 생리학적·물리적 범위로 보정(Clamping)합니다.
 * @param {Object} rawInputs - 사용자 입력 객체
 * @returns {Object} 안전한 범위로 보정된 입력 객체
 */
function sanitizeRunningInputs(rawInputs = {}) {
  const safeNum = (val, min, max, fallback) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
  };

  return {
    age: Math.round(safeNum(rawInputs.age, 10, 95, DEFAULT_RUNNING_INPUTS.age)),
    restingHr: Math.round(safeNum(rawInputs.restingHr, 35, 110, DEFAULT_RUNNING_INPUTS.restingHr)),
    weightKg: safeNum(rawInputs.weightKg, 30, 180, DEFAULT_RUNNING_INPUTS.weightKg),
    paceTotalSeconds: Math.round(safeNum(rawInputs.paceTotalSeconds, 150, 720, DEFAULT_RUNNING_INPUTS.paceTotalSeconds)),
    distanceKm: safeNum(rawInputs.distanceKm, 1, 100, DEFAULT_RUNNING_INPUTS.distanceKm),
    maxHrFormula: rawInputs.maxHrFormula === 2 ? 2 : 1,
  };
}

/**
 * 초(Seconds) 단위의 페이스를 'M분 SS초' 문자열로 변환합니다.
 * @param {number} totalSeconds - 총 초 수
 * @returns {string} 예: '6분 00초'
 */
function formatPaceString(totalSeconds) {
  const sec = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${String(s).padStart(2, '0')}초`;
}

/**
 * 초(Seconds) 단위의 총 소요 시간을 'H시간 MM분 SS초' 문자열로 변환합니다.
 * @param {number} totalSeconds - 총 초 수
 * @returns {string} 포맷팅된 시간 문자열
 */
function formatDurationString(totalSeconds) {
  const sec = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (h > 0) {
    return `${h}시간 ${String(m).padStart(2, '0')}분 ${String(s).padStart(2, '0')}초`;
  }
  return `${m}분 ${String(s).padStart(2, '0')}초`;
}

/**
 * 카르보넨(Karvonen) 공식 기반 심박수 Zone 1~5, 러닝 페이스 테이블, 칼로리 소모량을 계산합니다.
 *
 * @param {Object} rawInputs - 사용자 입력 객체
 * @returns {Object} 시뮬레이션 전체 결과 객체
 */
function calculateRunningSimulation(rawInputs) {
  const inputs = sanitizeRunningInputs(rawInputs);
  const { age, restingHr, weightKg, paceTotalSeconds, distanceKm, maxHrFormula } = inputs;

  // 1) 최대 심박수(HRmax) 및 여유 심박수(HRR) 계산
  const rawMaxHr = maxHrFormula === 2 ? 208 - 0.7 * age : 220 - age;
  const maxHr = Math.max(restingHr + 30, Math.round(rawMaxHr));
  const hrr = maxHr - restingHr; // 여유 심박수 (Heart Rate Reserve)

  // 카르보넨 공식 헬퍼: 강도(0.5 ~ 1.0) -> BPM
  const calcKarvonenBpm = (intensity) => Math.round(hrr * intensity + restingHr);

  // 2) Zone 1 ~ Zone 5 심박수 구간 정의
  const zoneDefinitions = [
    {
      zone: 'Zone 1',
      name: '회복·워밍업',
      minPct: 50,
      maxPct: 60,
      color: '#64748b',
      fatRatio: 0.80,
      desc: '가벼운 조깅 및 쿨다운, 근육 피로 회복 구간',
      highlight: false,
    },
    {
      zone: 'Zone 2',
      name: '유산소·지방연소',
      minPct: 60,
      maxPct: 70,
      color: '#10b981',
      fatRatio: 0.68,
      desc: '미토콘드리아 밀도 향상 및 체지방 연소 극대화 구간 (대화 가능한 편한 호흡)',
      highlight: true,
    },
    {
      zone: 'Zone 3',
      name: '마라톤 유산소 지구력',
      minPct: 70,
      maxPct: 80,
      color: '#3b82f6',
      fatRatio: 0.45,
      desc: '심폐 지구력 강화 및 마라톤 레이스 페이스 유지 구간',
      highlight: false,
    },
    {
      zone: 'Zone 4',
      name: '젖산 역치 (Threshold)',
      minPct: 80,
      maxPct: 90,
      color: '#f59e0b',
      fatRatio: 0.20,
      desc: '젖산 축적 한계 돌파 및 스피드 지구력 향상 (템포런)',
      highlight: false,
    },
    {
      zone: 'Zone 5',
      name: '최대 산소섭취량 (VO2Max)',
      minPct: 90,
      maxPct: 100,
      color: '#ef4444',
      fatRatio: 0.05,
      desc: '무산소 인터벌 및 단거리 최고 속도 한계 훈련 (장시간 유지 불가)',
      highlight: false,
    },
  ];

  const zones = zoneDefinitions.map((z) => ({
    ...z,
    minBpm: calcKarvonenBpm(z.minPct / 100),
    maxBpm: calcKarvonenBpm(z.maxPct / 100),
  }));

  const zone2 = zones[1];

  // 3) 페이스, 시속(km/h), 총 소요 시간 및 소모 칼로리 계산
  const speedKmh = 3600 / paceTotalSeconds;
  const totalDurationSeconds = paceTotalSeconds * distanceKm;
  const totalCaloriesKcal = Math.round(weightKg * distanceKm * 1.036);

  // Zone 2 기준 순수 지방 연소 칼로리(약 68%) 및 체지방 연소 그램(1g 지방 ≈ 7.7kcal)
  const estimatedFatBurnGrams = Math.round((totalCaloriesKcal * zone2.fatRatio) / 7.7);

  // 4) 주요 대회 거리별 완주 예상 시간 및 소모 칼로리 비교표 생성
  const standardDistances = [
    { label: '3km (트랙·입문)', km: 3 },
    { label: '5km (건강달리기)', km: 5 },
    { label: '10km (마니아 코스)', km: 10 },
    { label: '15km (장거리 연습)', km: 15 },
    { label: 'Half (21.0975km)', km: 21.0975 },
    { label: 'Full (42.195km 풀코스)', km: 42.195 },
  ];

  const raceTable = standardDistances.map((d) => {
    const durationSec = d.km * paceTotalSeconds;
    const kcal = Math.round(weightKg * d.km * 1.036);
    const fatG = Math.round((kcal * zone2.fatRatio) / 7.7);
    return {
      label: d.label,
      distanceKm: d.km,
      durationSeconds: durationSec,
      durationText: formatDurationString(durationSec),
      caloriesKcal: kcal,
      fatBurnGrams: fatG,
    };
  });

  return {
    inputs,
    summary: {
      maxHr,
      restingHr,
      hrr,
      zone2MinBpm: zone2.minBpm,
      zone2MaxBpm: zone2.maxBpm,
      paceText: `${formatPaceString(paceTotalSeconds)}/km`,
      speedKmh: Number(speedKmh.toFixed(2)),
      totalDurationSeconds,
      totalDurationText: formatDurationString(totalDurationSeconds),
      totalCaloriesKcal,
      estimatedFatBurnGrams,
    },
    zones,
    raceTable,
  };
}

// 브라우저(window.SimuLab) 및 Node.js 환경 동시 지원
if (typeof window !== 'undefined') {
  window.SimuLab = window.SimuLab || {};
  window.SimuLab.RunningLogic = {
    DEFAULT_RUNNING_INPUTS,
    sanitizeRunningInputs,
    formatPaceString,
    formatDurationString,
    calculateRunningSimulation,
  };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_RUNNING_INPUTS,
    sanitizeRunningInputs,
    formatPaceString,
    formatDurationString,
    calculateRunningSimulation,
  };
}
