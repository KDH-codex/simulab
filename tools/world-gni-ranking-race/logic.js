/**
 * 세계 20개국 국민총소득(GNI) 순위 레이스 비즈니스 로직
 * 
 * 주요 역할:
 * 1. 연도별 랭킹 순위 및 상대 비율(%) 산출 (막대 차트 애니메이션용)
 * 2. 한국 vs 타 국가 1:1 시계열 대조 (역전 시점/격차 분석)
 * 3. 사용자 연봉(원화) 입력 시 세계 20개국 1인당 소득과 매칭
 */

import { COUNTRIES, YEARS } from './data.js';

/**
 * 1. 특정 연도와 기준(총 GNI vs 1인당 GNI)에 따른 20개국 순위 목록 반환
 * @param {number} year - 조회할 연도 (예: 2024)
 * @param {string} metric - 'gniTotal' (총액) 또는 'gniPerCapita' (1인당)
 * @returns {Array} 1위부터 20위까지 정렬된 국가 객체 목록 (순위, 값, 최대값 대비 비율)
 */
export function getRankingsByYear(year, metric = 'gniTotal') {
  // 선택 연도의 데이터가 있는지 확인하고 목록 추출
  const list = COUNTRIES.map(country => {
    const val = country.data[year] ? country.data[year][metric] : 0;
    return {
      code: country.code,
      name: country.name,
      flag: country.flag,
      continent: country.continent,
      highlight: !!country.highlight,
      value: val
    };
  });

  // 값 기준 내림차순 정렬 (높은 순위가 1등)
  list.sort((a, b) => b.value - a.value);

  const maxValue = list.length > 0 ? list[0].value : 1;

  // 순위 및 1위 대비 퍼센트(바 너비 계산용) 부여
  return list.map((item, index) => {
    return {
      ...item,
      rank: index + 1,
      percentage: Math.max(3, Math.round((item.value / maxValue) * 100))
    };
  });
}

/**
 * 2. 특정 국가의 1990~2024 전체 시계열 추이 및 각 연도별 순위 산출
 * @param {string} countryCode - 국가 코드 (예: 'KOR', 'JPN')
 * @returns {Object} 국가 정보 및 연도별 시계열 데이터
 */
export function getCountryTimeSeries(countryCode) {
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  const series = YEARS.map(yr => {
    // 해당 연도의 총 GNI 순위 구하기
    const rankTotal = getRankingsByYear(yr, 'gniTotal').findIndex(c => c.code === countryCode) + 1;
    // 해당 연도의 1인당 GNI 순위 구하기
    const rankPerCapita = getRankingsByYear(yr, 'gniPerCapita').findIndex(c => c.code === countryCode) + 1;

    return {
      year: yr,
      gniTotal: country.data[yr] ? country.data[yr].gniTotal : 0,
      gniPerCapita: country.data[yr] ? country.data[yr].gniPerCapita : 0,
      rankTotal,
      rankPerCapita
    };
  });

  return {
    ...country,
    series
  };
}

/**
 * 3. 대한민국(KOR) vs 선택 국가 1:1 맞대결 분석
 * @param {string} targetCode - 비교 대상 국가 코드 (예: 'JPN')
 * @param {string} metric - 'gniPerCapita' 또는 'gniTotal'
 * @returns {Object} 비교 요약, 격차 추이, 역전(골든크로스) 여부 및 텍스트 리포트
 */
export function compareTwoCountries(targetCode = 'JPN', metric = 'gniPerCapita') {
  const kor = getCountryTimeSeries('KOR');
  const target = getCountryTimeSeries(targetCode);

  const metricLabel = metric === 'gniPerCapita' ? '1인당 국민소득(GNI)' : '명목 총 GNI(경제규모)';
  const unit = metric === 'gniPerCapita' ? '$' : '10억 달러';

  // 연도별 격차 및 승자 추적
  const comparisons = YEARS.map(yr => {
    const korVal = kor.data[yr][metric];
    const targetVal = target.data[yr][metric];
    const diff = korVal - targetVal;
    const ratio = targetVal > 0 ? ((korVal / targetVal) * 100).toFixed(1) : '100';

    return {
      year: yr,
      korVal,
      targetVal,
      diff,
      ratio,
      isKorHigher: korVal >= targetVal
    };
  });

  // 1990년 대비 2024년 성장 배수 계산
  const korGrowth = (kor.data[2024][metric] / kor.data[1990][metric]).toFixed(1);
  const targetGrowth = (target.data[2024][metric] / target.data[1990][metric]).toFixed(1);

  // 역전(골든크로스) 시점 찾기 (한국이 낮았다가 높아진 첫 해)
  let crossoverYear = null;
  for (let i = 1; i < comparisons.length; i++) {
    if (!comparisons[i - 1].isKorHigher && comparisons[i].isKorHigher) {
      crossoverYear = comparisons[i].year;
      break;
    }
  }

  // 인사이트 메시지 생성
  let insightText = '';
  const latest = comparisons[comparisons.length - 1];

  if (targetCode === 'JPN' && metric === 'gniPerCapita') {
    insightText = `1990년 일본(27,010$)의 1/4 수준(6,610$)이던 한국은, 34년간 약 ${korGrowth}배 성장하여 2023~2024년 사상 최초로 일본(33,500$)을 공식 역전(한국 36,200$)하는 역사적 골든크로스를 달성했습니다.`;
  } else if (targetCode === 'TWN' && metric === 'gniPerCapita') {
    insightText = `대만과 한국은 반도체와 IT 제조업을 바탕으로 지난 30년간 엎치락뒤치락 치열한 선두 경쟁을 벌이고 있으며, 2024년 현재 한국(36,200$)과 대만(35,100$)은 매우 팽팽한 호각세를 보이고 있습니다.`;
  } else if (latest.isKorHigher) {
    insightText = `2024년 현재 한국(${latest.korVal.toLocaleString()}${unit})은 ${target.name}(${latest.targetVal.toLocaleString()}${unit})보다 약 ${Math.abs(latest.diff).toLocaleString()}${unit} 앞서고 있습니다. (한국 1990년 대비 ${korGrowth}배 성장 vs ${target.name} ${targetGrowth}배 성장)`;
  } else {
    insightText = `2024년 현재 ${target.name}(${latest.targetVal.toLocaleString()}${unit})이 한국(${latest.korVal.toLocaleString()}${unit})보다 높으나, 1990년 이후 한국의 성장률(${korGrowth}배)이 ${target.name}(${targetGrowth}배)을 크게 앞서며 지속적으로 격차를 좁혀왔습니다.`;
  }

  return {
    kor,
    target,
    metricLabel,
    unit,
    comparisons,
    korGrowth,
    targetGrowth,
    crossoverYear,
    insightText
  };
}

/**
 * 4. 사용자의 세전 연봉을 세계 20개국 1인당 소득과 매칭
 * @param {number} salaryManwon - 세전 연봉 (만원 단위, 예: 5000)
 * @param {number} exchangeRate - 원/달러 환율 (기본값: 1,350원)
 * @returns {Object} 내 소득의 달러 가치, 유사 국가, 상위/하위 국가 비교 결과
 */
export function benchmarkMySalary(salaryManwon = 5000, exchangeRate = 1350) {
  const safeSalary = Math.max(100, Number(salaryManwon) || 5000);
  const salaryWon = safeSalary * 10000;
  const salaryUsd = Math.round(salaryWon / exchangeRate);

  // 2024년 20개국 1인당 소득 정렬 목록
  const ranks2024 = getRankingsByYear(2024, 'gniPerCapita');

  // 내 연봉보다 낮은 국가들 (내가 이긴 국가들)
  const lowerCountries = ranks2024.filter(c => salaryUsd >= c.value);
  // 내 연봉보다 높은 국가들
  const higherCountries = ranks2024.filter(c => salaryUsd < c.value);

  // 가장 가까운 국가 찾기 (절대값 오차 최소)
  let closestCountry = ranks2024[0];
  let minDiff = Infinity;
  ranks2024.forEach(c => {
    const diff = Math.abs(c.value - salaryUsd);
    if (diff < minDiff) {
      minDiff = diff;
      closestCountry = c;
    }
  });

  // 내 글로벌 소득 티어 및 위트 있는 멘트
  let tierTitle = '';
  let badgeColor = '';

  if (salaryUsd >= 80000) {
    tierTitle = '👑 글로벌 최상위권 (미국·스위스급)';
    badgeColor = '#3b82f6';
  } else if (salaryUsd >= 50000) {
    tierTitle = '🥇 서유럽 선진국권 (독일·영국·호주급)';
    badgeColor = '#10b981';
  } else if (salaryUsd >= 35000) {
    tierTitle = '🥈 동아시아 탑티어 (한국·일본·대만급)';
    badgeColor = '#6366f1';
  } else if (salaryUsd >= 20000) {
    tierTitle = '🥉 남유럽·신흥부국 (스페인·사우디급)';
    badgeColor = '#f59e0b';
  } else {
    tierTitle = '🌱 글로벌 성장 엔진 (중국·브라질·멕시코 상위)';
    badgeColor = '#8b5cf6';
  }

  return {
    salaryManwon: safeSalary,
    salaryUsd,
    exchangeRate,
    closestCountry,
    lowerCount: lowerCountries.length,
    totalCount: ranks2024.length,
    tierTitle,
    badgeColor,
    ranks2024
  };
}
