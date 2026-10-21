/**
 * ==========================================================================
 * [별별 통계] 대한민국 평균 vs 나 (직장인 스펙 대조기) 로직 엔진 (logic.js)
 * --------------------------------------------------------------------------
 * 고용노동부, 통계청, 신한은행 『2024 보통사람 금융생활 보고서』 등
 * 공공·금융 빅데이터를 기반으로 연령대별 평균 직장인 스펙과 사용자의
 * 현실 수치를 다각도 레이더 및 상대 백분율로 비교 분석합니다.
 * ==========================================================================
 */

export const AvgCompareLogic = {};

/**
 * 2024~2025 대한민국 연령대별 직장인 평균 통계 기준치
 * 출처: 고용노동부 고용형태별 근로실태조사, 통계청 경제활동인구조사
 */
AvgCompareLogic.BENCHMARKS = {
    age20s: {
        label: '20대 직장인',
        salary: 3450,       // 연봉 (만원)
        monthlySavings: 78, // 월 저축/투자액 (만원)
        weeklyWorkHours: 39.2, // 주간 근로시간 (시간)
        lunchCost: 9500,    // 일일 점심값 (원)
        entryAge: 27.2      // 첫 취업 나이 (세)
    },
    age30s: {
        label: '30대 직장인',
        salary: 4950,       // 연봉 (만원)
        monthlySavings: 125,// 월 저축/투자액 (만원)
        weeklyWorkHours: 41.5, // 주간 근로시간 (시간)
        lunchCost: 10500,   // 일일 점심값 (원)
        entryAge: 28.5      // 첫 취업 나이 (세)
    },
    age40s: {
        label: '40대 직장인',
        salary: 6300,       // 연봉 (만원)
        monthlySavings: 155,// 월 저축/투자액 (만원)
        weeklyWorkHours: 42.8, // 주간 근로시간 (시간)
        lunchCost: 11000,   // 일일 점심값 (원)
        entryAge: 27.8
    },
    age50s: {
        label: '50대 직장인',
        salary: 6800,       // 연봉 (만원)
        monthlySavings: 170,// 월 저축/투자액 (만원)
        weeklyWorkHours: 42.0, // 주간 근로시간 (시간)
        lunchCost: 10800,   // 일일 점심값 (원)
        entryAge: 26.9
    }
};

/**
 * 지표별 사용자 입력값과 평균값을 0~100점 점수로 스케일링 (레이더 차트용)
 */
AvgCompareLogic.calculateScores = function (ageGroup, userInput) {
    const bench = AvgCompareLogic.BENCHMARKS[ageGroup] || AvgCompareLogic.BENCHMARKS.age30s;

    // 1) 연봉 점수: 평균을 50점으로 설정, ±50% 편차에 따라 0~100점
    const salaryScore = Math.max(10, Math.min(100, Math.round(50 + ((userInput.salary - bench.salary) / bench.salary) * 60)));

    // 2) 저축력 점수: 평균 대비 비율
    const savingsScore = Math.max(10, Math.min(100, Math.round(50 + ((userInput.monthlySavings - bench.monthlySavings) / bench.monthlySavings) * 60)));

    // 3) 워라밸(근로시간) 점수: 근로시간이 적을수록 점수 높음 (40시간 기준)
    const workDiff = bench.weeklyWorkHours - userInput.weeklyWorkHours;
    const workScore = Math.max(10, Math.min(100, Math.round(50 + workDiff * 5)));

    // 4) 가성비(점심값) 점수: 점심값이 낮을수록 알뜰 점수 높음
    const lunchDiff = bench.lunchCost - userInput.lunchCost;
    const lunchScore = Math.max(10, Math.min(100, Math.round(50 + (lunchDiff / 200))));

    // 5) 사회진출 속도(취업 나이): 빠를수록 높은 점수
    const ageDiff = bench.entryAge - userInput.entryAge;
    const entryScore = Math.max(10, Math.min(100, Math.round(50 + ageDiff * 10)));

    // 레이더 5개 축 데이터
    const radarData = [
        { label: '연봉 소득', user: salaryScore, avg: 50, userRaw: `${userInput.salary.toLocaleString()}만원`, avgRaw: `${bench.salary.toLocaleString()}만원` },
        { label: '월 저축력', user: savingsScore, avg: 50, userRaw: `${userInput.monthlySavings.toLocaleString()}만원`, avgRaw: `${bench.monthlySavings.toLocaleString()}만원` },
        { label: '주간 워라밸', user: workScore, avg: 50, userRaw: `${userInput.weeklyWorkHours}시간`, avgRaw: `${bench.weeklyWorkHours}시간` },
        { label: '점심 알뜰도', user: lunchScore, avg: 50, userRaw: `${userInput.lunchCost.toLocaleString()}원`, avgRaw: `${bench.lunchCost.toLocaleString()}원` },
        { label: '사회진출 속도', user: entryScore, avg: 50, userRaw: `${userInput.entryAge}세`, avgRaw: `${bench.entryAge}세` }
    ];

    // 페르소나 총평 산출
    const persona = AvgCompareLogic.determinePersona(salaryScore, savingsScore, workScore, lunchScore);

    return {
        benchmark: bench,
        radarData,
        persona
    };
};

/**
 * 사용자 유형 페르소나 도출 알고리즘
 */
AvgCompareLogic.determinePersona = function (salaryScore, savingsScore, workScore, lunchScore) {
    if (salaryScore >= 65 && workScore >= 60) {
        return {
            title: '황금 밸런스형 워라밸 신선 🏄‍♂️',
            desc: '높은 연봉과 적정 근로시간을 모두 누리고 계시는 부러움의 대상입니다! 여유 시간을 가치 있는 자기계발과 투자로 연결하고 계십니다.'
        };
    } else if (salaryScore >= 65 && workScore < 45) {
        return {
            title: '불타는 고소득 워커홀릭 🏃‍♂️🔥',
            desc: '동년배 평균보다 월등히 높은 소득을 올리고 있으나, 그만큼 격무에 시달리고 계십니다. 건강 관리와 휴식 밸런스를 챙기실 타이밍입니다.'
        };
    } else if (savingsScore >= 65 && lunchScore >= 60) {
        return {
            title: '야무진 종잣돈 축적 장인 💰',
            desc: '점심값과 일상 지출을 철저히 방어하고 탄탄한 저축률을 기록하고 있습니다. 10년 뒤 자산 스노우볼이 가장 크게 굴러갈 모범생 타입입니다.'
        };
    } else if (workScore >= 70) {
        return {
            title: '저녁이 있는 삶! 워라밸 승리자 ☕',
            desc: '퇴근 후 삶의 질을 최우선으로 지켜내는 건강한 라이프스타일을 가지고 계십니다. 남는 저녁 시간을 사이드 프로젝트로 발전시켜 보세요.'
        };
    } else {
        return {
            title: '대한민국 표준 올라운더 직장인 👔',
            desc: '대한민국 평균의 길을 성실하게 걸어가고 계십니다. 여기서 지출 통제와 저축을 월 20만원만 더 늘려도 상위 20%로 도약할 수 있습니다.'
        };
    }
};
