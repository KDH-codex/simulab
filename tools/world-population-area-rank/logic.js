/**
 * 세계 30개국 인구, 면적, 인구밀도 비즈니스 로직 (logic.js)
 * 
 * 주요 역할:
 * 1. 3대 지표(인구, 면적, 인구밀도)별 30개국 순위 정렬 및 바 너비(%) 계산
 * 2. 대한민국 vs 타 국가 1:1 영토 면적/인구/밀도 배수 분석
 * 3. 1㎢당 인구밀도 체감 비교 데이터 추출
 */

import { WORLD_COUNTRIES_DATA } from './data.js';

/**
 * 1. 선택한 지표에 따라 30개국을 내림차순 정렬하고 순위와 바 너비(%) 부여
 * @param {string} metric - 'population' | 'area' | 'density'
 * @returns {Array} 정렬된 국가 목록
 */
export function getRankingsByMetric(metric = 'population') {
  const list = WORLD_COUNTRIES_DATA.map(c => ({
    code: c.code,
    name: c.name,
    flag: c.flag,
    continent: c.continent,
    highlight: !!c.highlight,
    value: c[metric] || 0,
    desc: c.desc
  }));

  // 내림차순 정렬
  list.sort((a, b) => b.value - a.value);

  const maxValue = list.length > 0 ? list[0].value : 1;

  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    percentage: Math.max(4, Math.round((item.value / maxValue) * 100))
  }));
}

/**
 * 2. 대한민국(KOR) vs 선택 국가 1:1 영토 및 인구 대조
 * @param {string} targetCode - 비교 대상 국가 코드 (예: 'USA')
 * @returns {Object} 배수 및 인사이트 리포트
 */
export function compareWithKorea(targetCode = 'USA') {
  const kor = WORLD_COUNTRIES_DATA.find(c => c.code === 'KOR');
  const target = WORLD_COUNTRIES_DATA.find(c => c.code === targetCode) || WORLD_COUNTRIES_DATA[3]; // 기본값 미국

  // 면적 배수 (상대국 / 한국)
  const areaRatio = (target.area / kor.area).toFixed(1);
  // 인구 배수 (상대국 / 한국)
  const popRatio = (target.population / kor.population).toFixed(1);
  // 인구밀도 배수 (한국 / 상대국)
  const densityRatio = (kor.density / target.density).toFixed(1);

  const story = `${target.name}의 표면적은 한국의 <strong>${areaRatio}배</strong>, 2026년 전망 인구는 한국의 <strong>${popRatio}배</strong>입니다. 계산한 한국의 인구밀도는 ${target.name}의 <strong>${densityRatio}배</strong>입니다.`;

  return {
    kor,
    target,
    areaRatio,
    popRatio,
    densityRatio,
    story
  };
}

/**
 * 3. 1㎢당 체감 밀도 시각화용 대표 국가 6종
 */
export function getDensityVisualData() {
  const codes = ['BGD', 'IND', 'KOR', 'JPN', 'USA', 'AUS'];
  return codes.map(code => {
    return WORLD_COUNTRIES_DATA.find(c => c.code === code);
  });
}
