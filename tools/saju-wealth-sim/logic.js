/**
 * ==========================================================================
 * SimuLab Analytics Hub - 사주 오행 & 재물운·투자 성향 분석기 순수 연산 엔진
 * 파일 경로: tools/saju-wealth-sim/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 명리학 및 알고리즘 설명]
 * 1) 사주팔자(四柱八字)란?
 *    - 사람이 태어난 연(年), 월(月), 일(日), 시(時)의 네 기둥(四柱)을
 *      10간(천간)과 12지(지지)로 조합하여 만든 여덟 글자(八字)입니다.
 * 2) 오행(五行: 목·화·토·금·수)의 기운:
 *    - 목(木): 성장, 확장, 추진력 -> 성장주, 바이오, 신산업 투자
 *    - 화(火): 열정, 발산, 스피드 -> AI, 테크놀로지, 레버리지 ETF
 *    - 토(土): 안정, 신뢰, 축적   -> 부동산, 리츠(REITs), 배당성장주
 *    - 금(金): 결단, 원칙, 결실   -> 금(Gold), 가치주, 금융주
 *    - 수(水): 유연, 지혜, 유동성 -> 고배당 현금흐름, 단기채권
 * 3) 100% 클라이언트 연산:
 *    - 외부 API나 서버 통신 없이 순수 JavaScript 천문 간지 알고리즘으로
 *      생년월일시를 사주 8글자로 정확하게 변환하고 오행 점수를 산출합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 10간(천간) 데이터: 명칭, 오행, 음양, 한자
  const HEAVENLY_STEMS = [
    { name: '갑', hanja: '甲', element: 'wood', yinYang: 'yang', label: '갑목(甲木) - 큰 나무' },
    { name: '을', hanja: '乙', element: 'wood', yinYang: 'yin',  label: '을목(乙木) - 유연한 꽃풀' },
    { name: '병', hanja: '丙', element: 'fire', yinYang: 'yang', label: '병화(丙火) - 태양의 불' },
    { name: '정', hanja: '丁', element: 'fire', yinYang: 'yin',  label: '정화(丁火) - 등불과 촛불' },
    { name: '무', hanja: '戊', element: 'earth', yinYang: 'yang', label: '무토(戊土) - 웅장한 대지' },
    { name: '기', hanja: '己', element: 'earth', yinYang: 'yin',  label: '기토(己土) - 비옥한 전답' },
    { name: '경', hanja: '庚', element: 'metal', yinYang: 'yang', label: '경금(庚金) - 단단한 원석' },
    { name: '신', hanja: '辛', element: 'metal', yinYang: 'yin',  label: '신금(辛金) - 정밀한 보석' },
    { name: '임', hanja: '壬', element: 'water', yinYang: 'yang', label: '임수(壬水) - 넓은 바다' },
    { name: '계', hanja: '癸', element: 'water', yinYang: 'yin',  label: '계수(癸水) - 맑은 이슬' },
  ];

  // 12지(지지) 데이터: 명칭, 오행, 동물, 한자
  const EARTHLY_BRANCHES = [
    { name: '자', hanja: '子', element: 'water', animal: '쥐',   label: '자수(子水) - 쥐' },
    { name: '축', hanja: '丑', element: 'earth', animal: '소',   label: '축토(丑土) - 소' },
    { name: '인', hanja: '寅', element: 'wood',  animal: '호랑이', label: '인목(寅木) - 호랑이' },
    { name: '묘', hanja: '卯', element: 'wood',  animal: '토끼', label: '묘목(卯木) - 토끼' },
    { name: '진', hanja: '辰', element: 'earth', animal: '용',   label: '진토(辰土) - 용' },
    { name: '사', hanja: '巳', element: 'fire',  animal: '뱀',   label: '사화(巳火) - 뱀' },
    { name: '오', hanja: '午', element: 'fire',  animal: '말',   label: '오화(午火) - 말' },
    { name: '미', hanja: '未', element: 'earth', animal: '양',   label: '미토(未土) - 양' },
    { name: '신', hanja: '申', element: 'metal', animal: '원숭이', label: '신금(申金) - 원숭이' },
    { name: '유', hanja: '酉', element: 'metal', animal: '닭',   label: '유금(酉金) - 닭' },
    { name: '술', hanja: '戌', element: 'earth', animal: '개',   label: '술토(戌土) - 개' },
    { name: '해', hanja: '亥', element: 'water', animal: '돼지', label: '해수(亥水) - 돼지' },
  ];

  // 오행 메타데이터 (색상, 키워드, 투자 자산 궁합)
  const ELEMENT_INFO = {
    wood: {
      name: '목(木)',
      colorName: '초록색·청색',
      colorHex: '#10b981',
      traits: '추진력, 성장성, 도전 정신, 창의력',
      wealthTrait: '새로운 기회를 빠르게 포착하여 성장시키는 자본 증식력',
      investStyle: '성장주 & 신산업 투자형',
      recommendedAssets: ['미국 혁신 성장주 (QQQ)', '바이오·헬스케어', '신재생 에너지', '벤처/초기 스타트업'],
      luckyNumbers: [3, 8],
    },
    fire: {
      name: '화(火)',
      colorName: '붉은색·주황색',
      colorHex: '#ef4444',
      traits: '열정, 순발력, 결단력, 파급력',
      wealthTrait: '단기 트렌드와 강한 모멘텀을 타는 폭발적 수익 창출력',
      investStyle: '모멘텀 & 테크 레버리지형',
      recommendedAssets: ['생성형 AI 테크주 (NVDA)', '나스닥 3배 레버리지 (TQQQ)', '반도체 ETF (SOXL)', '암호화폐/블록체인'],
      luckyNumbers: [2, 7],
    },
    earth: {
      name: '토(土)',
      colorName: '노란색·황토색',
      colorHex: '#f59e0b',
      traits: '신뢰, 끈기, 포용력, 안정감',
      wealthTrait: '한 번 들어온 돈을 굳건하게 지키고 불리는 자산 보존력',
      investStyle: '부동산 & 안정 자산형',
      recommendedAssets: ['핵심지 주거용 부동산', '월배당 부동산 리츠 (Realty Income O)', '미국 우량 배당성장주 (SCHD)', '인프라 펀드'],
      luckyNumbers: [5, 10],
    },
    metal: {
      name: '금(金)',
      colorName: '흰색·은색·골드',
      colorHex: '#64748b',
      traits: '원칙, 냉철함, 절제력, 결실',
      wealthTrait: '숫자와 손익계산에 철저하여 손실을 최소화하는 방어력',
      investStyle: '가치주 & 퀀트 데이터형',
      recommendedAssets: ['실물 안전자산 금(Gold)', '미국 S&P 500 (SPY)', '워런 버핏의 버크셔 해서웨이 (BRK.B)', '우량 금융/은행주'],
      luckyNumbers: [4, 9],
    },
    water: {
      name: '수(水)',
      colorName: '검은색·남색',
      colorHex: '#2563eb',
      traits: '유연함, 지혜, 침착성, 융통성',
      wealthTrait: '자금이 마르지 않고 사방으로 흐르게 하는 현금 유동성 관리력',
      investStyle: '현금흐름 & 배당 인컴형',
      recommendedAssets: ['JP모건 커버드콜 인컴 (JEPI/JEPQ)', '단기 국채 ETF', '해운/물류 대표주', '파이프라인 현금흐름 자산'],
      luckyNumbers: [1, 6],
    },
  };

  const DEFAULT_SAJU_INPUTS = {
    birthYear: 1992,
    birthMonth: 7,
    birthDay: 15,
    birthHour: 14, // 14시 (오후 2시)
    gender: 'male',
  };

  /**
   * 그레고리력 기준 간이 사주 8글자 산출 함수
   */
  function deriveFourPillars(year, month, day, hour) {
    // 1) 연주(年柱) 계산: 기준년 1984년 = 갑자년 (Stem 0, Branch 0)
    const yearOffset = (year - 1984) % 60;
    const yearIndex = (yearOffset + 60) % 60;
    const yearStem = HEAVENLY_STEMS[yearIndex % 10];
    const yearBranch = EARTHLY_BRANCHES[yearIndex % 12];

    // 2) 월주(月柱) 계산
    // 입춘을 고려한 절기 월지: 인(寅)월(양력 약 2월)부터 시작
    const monthBranchIndex = (month + 1) % 12;
    const monthBranch = EARTHLY_BRANCHES[monthBranchIndex];
    // 연간에 따른 월간 공식: (yearStemIndex % 5) * 2 + 2 + (month - 2)
    const monthStemOffset = ((yearIndex % 10) % 5) * 2 + 2 + (month - 1);
    const monthStem = HEAVENLY_STEMS[(monthStemOffset + 100) % 10];

    // 3) 일주(日柱) 계산 (Julian Day Number 기반 천문 일진)
    // 2000년 1월 1일 = 무오일 (무=4, 오=6)
    const baseDate = new Date(Date.UTC(2000, 0, 1));
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const diffDays = Math.round((targetDate - baseDate) / 86400000);
    const dayIndex = (54 + diffDays) % 60; // 2000.1.1 무오(54번 간지)
    const safeDayIndex = (dayIndex + 60000) % 60;
    const dayStem = HEAVENLY_STEMS[safeDayIndex % 10];
    const dayBranch = EARTHLY_BRANCHES[safeDayIndex % 12];

    // 4) 시주(時柱) 계산
    // 자시(23:00~01:00), 축시(01:00~03:00), ..., 해시(21:00~23:00)
    let hourBranchIndex = 0;
    if (hour >= 23 || hour < 1) hourBranchIndex = 0; // 자
    else hourBranchIndex = Math.floor((hour + 1) / 2);
    const hourBranch = EARTHLY_BRANCHES[hourBranchIndex % 12];

    // 일간에 따른 시간 공식
    const dayStemIndex = safeDayIndex % 10;
    const hourStemOffset = (dayStemIndex % 5) * 2 + hourBranchIndex;
    const hourStem = HEAVENLY_STEMS[hourStemOffset % 10];

    return {
      yearPillar: { stem: yearStem, branch: yearBranch, label: `${yearStem.name}${yearBranch.name}년` },
      monthPillar: { stem: monthStem, branch: monthBranch, label: `${monthStem.name}${monthBranch.name}월` },
      dayPillar: { stem: dayStem, branch: dayBranch, label: `${dayStem.name}${dayBranch.name}일` },
      hourPillar: { stem: hourStem, branch: hourBranch, label: `${hourStem.name}${hourBranch.name}시` },
      dayMaster: dayStem, // 일간 (사주의 주인공 / 본원)
    };
  }

  /**
   * 메인 사주 오행 및 재물운 시뮬레이션
   */
  function calculateSajuWealth(userInputs = {}) {
    const inputs = { ...DEFAULT_SAJU_INPUTS, ...userInputs };

    const year = Number(inputs.birthYear) || 1992;
    const month = Number(inputs.birthMonth) || 7;
    const day = Number(inputs.birthDay) || 15;
    const hour = Number(inputs.birthHour) || 12;

    const pillars = deriveFourPillars(year, month, day, hour);

    // 8글자의 오행 점수 계산 (각 글자 12.5점, 총 100점)
    const elements = [
      pillars.yearPillar.stem.element,
      pillars.yearPillar.branch.element,
      pillars.monthPillar.stem.element,
      pillars.monthPillar.branch.element,
      pillars.dayPillar.stem.element,
      pillars.dayPillar.branch.element,
      pillars.hourPillar.stem.element,
      pillars.hourPillar.branch.element,
    ];

    const elementScores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    elements.forEach((el) => {
      elementScores[el] = (elementScores[el] || 0) + 12.5;
    });

    // 최다 오행 & 결핍 오행 판정
    let maxElement = 'earth';
    let maxScore = -1;
    let minElement = 'wood';
    let minScore = 999;

    for (const [el, score] of Object.entries(elementScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxElement = el;
      }
      if (score < minScore) {
        minScore = score;
        minElement = el;
      }
    }

    const dominant = ELEMENT_INFO[maxElement];
    const lacking = ELEMENT_INFO[minElement];
    const dayMasterInfo = ELEMENT_INFO[pillars.dayMaster.element];

    return {
      inputs,
      pillars,
      elementScores,
      dominant,
      lacking,
      dayMasterInfo,
      summary: {
        fourPillarsText: `${pillars.yearPillar.stem.hanja}${pillars.yearPillar.branch.hanja} ${pillars.monthPillar.stem.hanja}${pillars.monthPillar.branch.hanja} ${pillars.dayPillar.stem.hanja}${pillars.dayPillar.branch.hanja} ${pillars.hourPillar.stem.hanja}${pillars.hourPillar.branch.hanja}`,
        dayMasterLabel: pillars.dayMaster.label,
        dominantElement: dominant.name,
        dominantScore: maxScore,
        lackingElement: lacking.name,
        investStyle: dominant.investStyle,
        luckyColor: lacking.colorName,
        luckyNumber: lacking.luckyNumbers.join(', '),
      },
    };
  }

  const exportsObj = {
    DEFAULT_SAJU_INPUTS,
    HEAVENLY_STEMS,
    EARTHLY_BRANCHES,
    ELEMENT_INFO,
    deriveFourPillars,
    calculateSajuWealth,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.SajuWealth = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
