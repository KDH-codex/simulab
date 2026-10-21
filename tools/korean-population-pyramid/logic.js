/**
 * 대한민국 연령별 인구 피라미드 및 초등학생 수 비즈니스 로직 (logic.js)
 * 
 * 주요 역할:
 * 1. 연도별 대칭형 인구 피라미드 데이터 추출 및 바 너비(%) 계산
 * 2. 54년간의 전국 및 17개 시도별 초등학생 수 급감 추이 분석
 * 3. 사용자 출생연도 입력 시 당시 초등학교(국민학교) 교실 풍경 매칭
 */

import { POP_YEARS, POP_AGE_GROUPS, POPULATION_PYRAMID_DATA, ELEMENTARY_HISTORY, REGIONAL_ELEMENTARY_2024 } from './data.js';

/**
 * 1. 특정 연도의 인구 피라미드 데이터 반환
 * @param {number} year - 조회 연도 (예: 2024)
 * @returns {Object} 총인구, 중위연령, 고령화율, 연령대별 남녀 인구 및 최대값 대비 %
 */
export function getPyramidByYear(year = 2024) {
  const safeYear = POP_YEARS.includes(year) ? year : 2024;
  const data = POPULATION_PYRAMID_DATA[safeYear];

  // 차트 너비 기준을 위한 단일 연령대/성별 최대 인구수 찾기 (통상 450만명 수준)
  const maxVal = 500;

  const rows = POP_AGE_GROUPS.map(ageGroup => {
    const maleVal = data.male[ageGroup] || 0;
    const femaleVal = data.female[ageGroup] || 0;

    return {
      ageGroup,
      maleVal,
      femaleVal,
      malePercent: Math.min(100, (maleVal / maxVal) * 100),
      femalePercent: Math.min(100, (femaleVal / maxVal) * 100)
    };
  });

  // 유소년(0~19세) vs 생산가능(20~64세) vs 고령자(65세+) 인구 비중 계산
  const youthMale = (data.male['0~9세'] || 0) + (data.male['10~19세'] || 0);
  const youthFemale = (data.female['0~9세'] || 0) + (data.female['10~19세'] || 0);
  const youthTotal = youthMale + youthFemale;
  const youthRate = ((youthTotal / data.totalPop) * 100).toFixed(1);

  return {
    year: safeYear,
    totalPop: data.totalPop,
    medianAge: data.medianAge,
    elderlyRate: data.elderlyRate,
    youthRate,
    highlight: data.highlight,
    rows
  };
}

/**
 * 2. 1970~2024 초등학생 수 전체 역사 및 17개 시도별 2024년 현황 반환
 */
export function getElementaryStats() {
  const peakYear = ELEMENTARY_HISTORY[0]; // 1970년 574.9만 명
  const latest = ELEMENTARY_HISTORY[ELEMENTARY_HISTORY.length - 1]; // 2024년 249.1만 명
  const declineRate = (((peakYear.students - latest.students) / peakYear.students) * 100).toFixed(1);

  return {
    history: ELEMENTARY_HISTORY,
    regional: REGIONAL_ELEMENTARY_2024,
    peakStudents: peakYear.students,
    latestStudents: latest.students,
    declineRate
  };
}

/**
 * 3. 사용자의 출생연도를 기반으로 당시 초등학교 시절 교실 풍경 매칭
 * @param {number} birthYear - 출생연도 (예: 1985)
 * @returns {Object} 초등학교 입학연도, 당시 학생수, 학급당 인원수, 세대별 스토리
 */
export function matchMyGenerationSchool(birthYear = 1988) {
  const safeYear = Math.max(1950, Math.min(2018, Number(birthYear) || 1988));
  const enterYear = safeYear + 7; // 만 7세 입학 기준

  // 가장 가까운 통계 연도 찾기
  let closestHist = ELEMENTARY_HISTORY[0];
  let minDiff = Infinity;
  ELEMENTARY_HISTORY.forEach(h => {
    const diff = Math.abs(h.year - enterYear);
    if (diff < minDiff) {
      minDiff = diff;
      closestHist = h;
    }
  });

  const latest = ELEMENTARY_HISTORY[ELEMENTARY_HISTORY.length - 1]; // 2024년

  // 세대별 명칭 및 교실 분위기
  let schoolName = '초등학교';
  let eraTag = '';
  let badgeColor = '#2563eb';

  if (enterYear < 1996) {
    schoolName = '국민학교';
    if (enterYear <= 1980) {
      eraTag = '👶 1차 베이비붐 세대 (콩나물 교실 & 오전·오후반)';
      badgeColor = '#d97706';
    } else {
      eraTag = '🏫 국민학교 막바지 세대 (한 반 40~50명)';
      badgeColor = '#059669';
    }
  } else if (enterYear <= 2010) {
    schoolName = '초등학교';
    eraTag = '💻 밀레니엄 초등 세대 (컴퓨터실 보급 & 한 반 30명대)';
    badgeColor = '#2563eb';
  } else {
    schoolName = '초등학교';
    eraTag = '🎒 스마트 교실 세대 (한 반 20명 & 맞춤형 수업)';
    badgeColor = '#7c3aed';
  }

  // 학생 수 감소 배수
  const studentRatio = (closestHist.students / latest.students).toFixed(1);
  const classDiff = Math.round(closestHist.classSize - latest.classSize);

  return {
    birthYear: safeYear,
    enterYear,
    schoolName,
    eraTag,
    badgeColor,
    matchedYear: closestHist.year,
    students: closestHist.students,
    classSize: closestHist.classSize,
    comment: closestHist.comment,
    latestStudents: latest.students,
    latestClassSize: latest.classSize,
    studentRatio,
    classDiff
  };
}
