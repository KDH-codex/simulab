/**
 * ==========================================================================
 * SimuLab Analytics Hub - 내 인생의 모래시계 (Life Countdown) 순수 연산 엔진
 * 파일 경로: tools/life-hourglass-sim/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 연산 원리 및 감성 모델 설명]
 * "시간은 돈보다 훨씬 소중한 우리 삶의 유일한 일방통행 자원입니다."
 * 
 * 1) 기본 생애 통계 (Life Progress):
 *    - 생년월일과 평균 기대수명(기본 85세)을 바탕으로 살아온 날수와 잔여 날수를 산출합니다.
 *    - 주말(토·일)의 남은 횟수, 식사 끼니 수, 수면 시간 등을 직관적인 숫자로 환산합니다.
 * 
 * 2) 5대 맞춤형 감성 모드 (Emotional Modes):
 *    - [모드 1] 부모님 사랑 모드 (Sunset Glow 🌅):
 *      - 1년에 만나는 며칠과 하루 깨어있는 대화 시간을 곱해, 평생 부모님과
 *        얼굴을 맞대고 대화할 수 있는 실질 시간이 불과 며칠밖에 남지 않았음을 일깨웁니다.
 *    - [모드 2] 반려동물 무지개 시계 (Cozy Amber 🐾):
 *      - 강아지/고양이의 생체 시계는 인간보다 약 6배 빠릅니다.
 *      - 우리 아이와 함께 낙엽을 밟으며 산책할 수 있는 잔여 횟수와 눈 맞출 시간을 계산합니다.
 *    - [모드 3] 아이가 품에 머무는 시간 (Spring Morning 👶):
 *      - 아이가 부모 품에 안겨 온전히 "엄마, 아빠"를 찾는 시기는 초등학교 졸업(만 12세) 전후입니다.
 *      - 아이의 손을 잡고 나들이 갈 수 있는 유년 시절의 남은 주말 횟수를 산출합니다.
 *    - [모드 4] 청춘의 사계절 & 건강 수명 (Starry Midnight ✈️):
 *      - WHO 대한민국 평균 '건강수명(73세)'을 기준으로 튼튼한 두 다리로 비행기를 타고
 *        세계를 여행할 수 있는 청춘의 시간, 벚꽃을 볼 수 있는 봄의 횟수를 계산합니다.
 *    - [모드 5] 연인과 함께 눈뜨는 아침 (Romantic Rose 💍):
 *      - 사랑하는 연인/배우자와 아침 햇살을 받으며 함께 눈뜰 수 있는 아침의 횟수를 계산합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 5대 감성 모드 테마 정의
  const EMOTIONAL_THEMES = {
    parents: {
      key: 'parents',
      name: '부모님 사랑 모드',
      icon: '🌅',
      badge: '부모님과 남은 시간',
      gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
      darkGradient: 'linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)',
      accentColor: '#ea580c',
      quote: '평생 부모님과 얼굴을 맞대고 대화할 수 있는 시간은 단 며칠밖에 남지 않았습니다. 오늘 부모님께 목소리를 들려드리는 건 어떨까요?',
    },
    pet: {
      key: 'pet',
      name: '반려동물 무지개 시계',
      icon: '🐾',
      badge: '우리 아이와 남은 시간',
      gradient: 'linear-gradient(135deg, #fefce8 0%, #fef08a 50%, #fde047 100%)',
      darkGradient: 'linear-gradient(135deg, #422006 0%, #713f12 50%, #854d0e 100%)',
      accentColor: '#d97706',
      quote: '강아지의 시간은 인간보다 6배 빠릅니다. 함께 산책하며 낙엽을 밟을 수 있는 날들이 빠르게 흐르고 있습니다. 오늘 산책은 10분만 더 길게 걸어볼까요?',
    },
    child: {
      key: 'child',
      name: '아이가 품에 머무는 시간',
      icon: '👶',
      badge: '아이의 어린 시절',
      gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      darkGradient: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
      accentColor: '#059669',
      quote: '아이가 자라 친구들과의 세상을 찾아 떠나기 전, 내 품에 꼭 안아줄 수 있는 어린 시절의 주말은 결코 길지 않습니다. 오늘 밤 아이를 한 번 더 꼭 안아주세요.',
    },
    youth: {
      key: 'youth',
      name: '청춘의 사계절 & 건강 수명',
      icon: '✈️',
      badge: '나의 청춘과 여행',
      gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
      darkGradient: 'linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #1e40af 100%)',
      accentColor: '#2563eb',
      quote: '튼튼한 두 다리로 비행기를 타고 새로운 세상으로 떠날 수 있는 청춘의 시간은 유한합니다. 미뤄둔 여행을 떠나보세요.',
    },
    couple: {
      key: 'couple',
      name: '연인과 함께 눈뜨는 아침',
      icon: '💍',
      badge: '사랑하는 사람과 함께',
      gradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
      darkGradient: 'linear-gradient(135deg, #500724 0%, #831843 50%, #9d174d 100%)',
      accentColor: '#db2777',
      quote: '내가 가장 사랑하는 사람과 아침 햇살을 받으며 마주 보고 웃을 수 있는 날들이 소중하게 이어지고 있습니다. 곁에 있는 사랑하는 사람의 손을 꼭 잡아주세요.',
    },
  };

  // 기본 입력값
  const DEFAULT_LIFE_INPUTS = {
    mode: 'parents',            // 'parents' | 'pet' | 'child' | 'youth' | 'couple'
    birthYear: 1994,            // 나의 출생년도
    birthMonth: 5,              // 나의 출생월
    birthDay: 20,               // 나의 출생일
    expectedAge: 85,            // 나의 목표 기대수명 (세)
    // 1) 부모님 모드
    parentsAge: 70,             // 부모님 현재 연세 (세)
    visitDaysPerYear: 4,        // 1년에 부모님 뵙는 날수 (일)
    parentTalkHoursPerDay: 4,   // 하루 실질 대화 시간 (시간)
    // 2) 반려동물 모드
    petAge: 5,                  // 반려동물 나이 (세)
    petWalksPerWeek: 5,         // 주간 산책/놀이 횟수 (회)
    // 3) 자녀 모드
    childAge: 4,                // 자녀 나이 (세)
    // 4) 연인 모드
    coupleAge: 30,              // 연인/배우자 나이 (세)
  };

  /**
   * 메인 인생 카운트다운 계산 함수
   */
  function calculateLifeHourglass(userInputs = {}) {
    const inputs = { ...DEFAULT_LIFE_INPUTS, ...userInputs };

    const mode = inputs.mode && EMOTIONAL_THEMES[inputs.mode] ? inputs.mode : 'parents';
    const theme = EMOTIONAL_THEMES[mode];

    const bYear = Number(inputs.birthYear) || 1994;
    const bMonth = Number(inputs.birthMonth) || 5;
    const bDay = Number(inputs.birthDay) || 20;
    const expAge = Math.max(50, Math.min(120, Number(inputs.expectedAge) || 85));

    const today = new Date();
    const birthDate = new Date(bYear, bMonth - 1, bDay);
    const deathDate = new Date(bYear + expAge, bMonth - 1, bDay);

    // 현재 만 나이 계산
    let myAge = today.getFullYear() - bYear;
    const mDiff = today.getMonth() - (bMonth - 1);
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < bDay)) {
      myAge--;
    }
    myAge = Math.max(0, myAge);

    const msPerDay = 86400000;
    const daysLived = Math.max(0, Math.floor((today - birthDate) / msPerDay));
    const totalLifeDays = Math.max(1, Math.floor((deathDate - birthDate) / msPerDay));
    const daysLeft = Math.max(0, Math.floor((deathDate - today) / msPerDay));

    const lifeProgressPct = Math.min(100, (daysLived / totalLifeDays) * 100);

    // 남은 주말 (토·일) 횟수
    const weekendsLeft = Math.round((daysLeft / 7) * 2);

    // 남은 식사 끼니 수 (하루 3끼 기준)
    const mealsLeft = daysLeft * 3;

    // 남은 수면 시간 (하루 7.5시간 기준)
    const sleepHoursLeft = Math.round(daysLeft * 7.5);

    // 인생의 계절 판정
    let lifeSeason = '인생의 봄 (성장과 탐색)';
    if (lifeProgressPct >= 75) {
      lifeSeason = '인생의 겨울 (지혜와 수용)';
    } else if (lifeProgressPct >= 50) {
      lifeSeason = '인생의 가을 (결실과 정리)';
    } else if (lifeProgressPct >= 25) {
      lifeSeason = '인생의 여름 (열정과 전성기)';
    }

    // ----------------------------------------------------
    // 모드별 세부 감성 지표 계산
    // ----------------------------------------------------
    let modeStats = {};
    let verdictHighlight = '';
    let verdictDetails = '';

    if (mode === 'parents') {
      const pAge = Math.max(40, Math.min(100, Number(inputs.parentsAge) || 70));
      const visits = Math.max(0, Math.min(365, Number(inputs.visitDaysPerYear) || 4));
      const talkHours = Math.max(1, Math.min(24, Number(inputs.parentTalkHoursPerDay) || 4));

      // 부모님 평균 기대수명 85세 기준 잔여 햇수
      const parentsYearsLeft = Math.max(0, 85 - pAge);
      // 실질 대화 시간 = 남은 햇수 × 방문 일수 × 하루 대화 시간
      const parentsHoursTotal = parentsYearsLeft * visits * talkHours;
      const parentsDaysEquivalent = Math.round((parentsHoursTotal / 24) * 10) / 10;
      const parentsMealsLeft = Math.round(parentsYearsLeft * visits * 2.5);

      modeStats = {
        label1: '부모님 잔여 연수',
        val1: `${parentsYearsLeft}년`,
        label2: '실질 대화 시간',
        val2: `${parentsHoursTotal}시간`,
        sub2: `약 ${parentsDaysEquivalent}일`,
        label3: '함께할 식사',
        val3: `${parentsMealsLeft}끼`,
        label4: '1년 방문 일수',
        val4: `${visits}일`,
      };

      verdictHighlight = `연세 ${pAge}세이신 부모님과 평생 얼굴을 맞대고 대화할 수 있는 시간은 단 ${parentsHoursTotal}시간 (약 ${parentsDaysEquivalent}일)밖에 남지 않았습니다.`;
      verdictDetails = `함께 마주 앉아 따뜻한 밥 한 끼를 먹을 수 있는 기회도 앞으로 약 ${parentsMealsLeft}끼에 불과합니다. 오늘 부모님께 안부 전화 한 통 드려보는 건 어떨까요?`;

    } else if (mode === 'pet') {
      const petAge = Math.max(0, Math.min(25, Number(inputs.petAge) || 5));
      const walksPerWeek = Math.max(0, Math.min(28, Number(inputs.petWalksPerWeek) || 5));

      // 반려동물 평균 기대수명 15세 기준 잔여 생애
      const petYearsLeft = Math.max(0, 15 - petAge);
      // 잔여 산책 횟수 = 잔여 연수 × 주간 산책 횟수 × 52주
      const walksLeft = Math.round(petYearsLeft * walksPerWeek * 52);
      // 온전히 눈맞춤 및 스킨십 교감 시간 (하루 1.5시간 기준)
      const contactHoursLeft = Math.round(petYearsLeft * 365 * 1.5);
      const contactDaysEquivalent = Math.round((contactHoursLeft / 24) * 10) / 10;

      modeStats = {
        label1: '아이와 남은 햇수',
        val1: `${petYearsLeft}년`,
        label2: '함께할 산책 횟수',
        val2: `${walksLeft.toLocaleString()}번`,
        sub2: `주 ${walksPerWeek}회 기준`,
        label3: '눈맞춤 교감 시간',
        val3: `${contactHoursLeft.toLocaleString()}시간`,
        sub3: `약 ${contactDaysEquivalent}일`,
        label4: '현재 나이',
        val4: `${petAge}살`,
      };

      verdictHighlight = `강아지의 시간은 인간보다 약 6배 빠릅니다. 함께 산책하며 낙엽을 밟을 수 있는 날은 앞으로 약 ${walksLeft.toLocaleString()}번 남았습니다.`;
      verdictDetails = `우리 아이가 온전히 내 곁에서 숨을 쉬며 눈을 맞출 수 있는 시간은 약 ${contactHoursLeft.toLocaleString()}시간(${contactDaysEquivalent}일치)입니다. 오늘 산책은 10분만 더 길게 걸어볼까요?`;

    } else if (mode === 'child') {
      const cAge = Math.max(0, Math.min(20, Number(inputs.childAge) || 4));

      // 초등학교 졸업(만 12세) 전까지 품안의 황금기 잔여 연수
      const childGoldenYears = Math.max(0, 12 - cAge);
      // 함께 나들이 갈 수 있는 유년기 남은 주말
      const childWeekendsLeft = childGoldenYears * 52 * 2;
      // 밤에 동화책 읽어주며 안아 재울 수 있는 밤
      const storyNightsLeft = childGoldenYears * 365;

      modeStats = {
        label1: '품안의 황금기',
        val1: `${childGoldenYears}년`,
        label2: '함께할 주말 횟수',
        val2: `${childWeekendsLeft.toLocaleString()}번`,
        sub2: '만 12세 이전',
        label3: '안아 재울 수 있는 밤',
        val3: `${storyNightsLeft.toLocaleString()}밤`,
        label4: '현재 아이 나이',
        val4: `${cAge}살`,
      };

      verdictHighlight = `아이가 부모 품에 온전히 안기며 "엄마, 아빠"를 찾는 유년 시절의 주말은 단 ${childWeekendsLeft.toLocaleString()}번 남았습니다.`;
      verdictDetails = `아이가 자라 친구들과의 세상을 찾아 독립하기 전, 두 팔 가득 아이를 안아주고 동화책을 읽어줄 수 있는 밤은 약 ${storyNightsLeft.toLocaleString()}밤입니다. 오늘 밤 아이를 한 번 더 꼭 안아주세요.`;

    } else if (mode === 'youth') {
      // WHO 건강 수명 (73세) 기준 잔여 청춘 년수
      const healthyYearsLeft = Math.max(0, 73 - myAge);
      const springsLeft = healthyYearsLeft;       // 벚꽃 볼 수 있는 봄
      const summersLeft = healthyYearsLeft;       // 여름 바다
      const healthyWeekends = healthyYearsLeft * 104; // 건강하게 여행 갈 수 있는 주말

      modeStats = {
        label1: '건강 수명 잔여년수',
        val1: `${healthyYearsLeft}년`,
        sub1: 'WHO 73세 기준',
        label2: '벚꽃 볼 수 있는 봄',
        val2: `${springsLeft}번`,
        label3: '청춘의 여행 주말',
        val3: `${healthyWeekends.toLocaleString()}번`,
        label4: '현재 나의 만 나이',
        val4: `만 ${myAge}세`,
      };

      verdictHighlight = `튼튼한 두 다리로 비행기를 타고 세계를 여행할 수 있는 청춘의 시간은 앞으로 ${summersLeft}번의 여름, 벚꽃을 볼 수 있는 봄은 ${springsLeft}번 남았습니다.`;
      verdictDetails = `아프지 않고 건강하게 배낭을 멜 수 있는 활력의 주말은 ${healthyWeekends.toLocaleString()}번 남았습니다. 언젠가로 미뤄두었던 버킷리스트와 여행을 지금 시작해 보세요.`;

    } else if (mode === 'couple') {
      const cpAge = Math.max(18, Math.min(100, Number(inputs.coupleAge) || 30));
      // 두 사람 모두 기대수명 85세까지 함께할 잔여 햇수
      const coupleYearsLeft = Math.max(0, Math.min(85 - myAge, 85 - cpAge));
      const morningsLeft = coupleYearsLeft * 365;
      const coupleWeekendsLeft = coupleYearsLeft * 104;
      const dinnersLeft = coupleYearsLeft * 365;

      modeStats = {
        label1: '함께할 잔여 햇수',
        val1: `${coupleYearsLeft}년`,
        label2: '함께 맞이할 아침',
        val2: `${morningsLeft.toLocaleString()}번`,
        label3: '마주할 저녁 식사',
        val3: `${dinnersLeft.toLocaleString()}끼`,
        label4: '손잡을 주말 데이트',
        val4: `${coupleWeekendsLeft.toLocaleString()}번`,
      };

      verdictHighlight = `내가 가장 사랑하는 사람과 아침 햇살을 받으며 함께 눈뜰 수 있는 아침은 앞으로 약 ${morningsLeft.toLocaleString()}번 남았습니다.`;
      verdictDetails = `함께 마주 앉아 따뜻한 저녁을 먹고 주말 손을 잡을 수 있는 시간은 약 ${coupleYearsLeft}년(${coupleWeekendsLeft.toLocaleString()}번의 주말)입니다. 오늘 곁에 있는 소중한 사람의 손을 따뜻하게 잡아주세요.`;
    }

    // 부모님 모드 기본 통계 (하위 호환성 유지)
    const pAgeFallback = Math.max(40, Math.min(100, Number(inputs.parentsAge) || 70));
    const vDaysFallback = Math.max(0, Math.min(365, Number(inputs.visitDaysPerYear) || 4));
    const tHoursFallback = Math.max(1, Math.min(24, Number(inputs.parentTalkHoursPerDay) || 4));
    const pYearsFallback = Math.max(0, 85 - pAgeFallback);
    const pHoursFallback = pYearsFallback * vDaysFallback * tHoursFallback;
    const pDaysEquivFallback = Math.round((pHoursFallback / 24) * 10) / 10;

    return {
      inputs,
      theme,
      summary: {
        myAge,
        daysLived,
        daysLeft,
        totalLifeDays,
        lifeProgressPct: Math.round(lifeProgressPct * 10) / 10,
        weekendsLeft,
        mealsLeft,
        sleepHoursLeft,
        lifeSeason,
        // 부모님 하위 호환 필드
        parentsYearsLeft: pYearsFallback,
        parentsHoursTotal: pHoursFallback,
        parentsDaysEquivalent: pDaysEquivFallback,
        // 모드별 맞춤 결과
        mode,
        modeStats,
        verdictHighlight,
        verdictDetails,
        fullMessage: `${verdictHighlight} ${verdictDetails}`,
      },
    };
  }

  const exportsObj = {
    EMOTIONAL_THEMES,
    DEFAULT_LIFE_INPUTS,
    calculateLifeHourglass,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.LifeHourglass = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
