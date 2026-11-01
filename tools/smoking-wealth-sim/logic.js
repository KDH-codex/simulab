/**
 * [담배값 주식 투자 시뮬] 핵심 계산 로직 (logic.js)
 * 
 * 담배를 피우지 않고 그 돈으로 주식/지수 ETF에 매월 적립식으로 투자했을 때의
 * 복리 자산 형성 결과와 건강 회복 지표(타르, 니코틴, 되찾은 수명)를 계산합니다.
 */

// 자산군별 연평균 기대 수익률 (복리 기준)
export const ASSET_YIELDS = {
    cash: 0.0,       // 단순 현금 보관 (수익률 0%)
    savings: 0.035,  // 시중은행 적금 (연 3.5%)
    kospi: 0.06,     // 국내 대표 우량주 (연 6.0%)
    sp500: 0.08,     // 미국 S&P 500 ETF (연 8.0%)
    nasdaq: 0.12     // 미국 나스닥 100 / 빅테크 (연 12.0%)
};

/**
 * 매월 말 적립식 복리 최종 금액을 계산하는 함수
 * @param {number} monthlyDeposit - 매월 적립액 (원)
 * @param {number} annualRate - 연이율 (예: 0.08은 8%)
 * @param {number} years - 투자 기간 (년)
 * @returns {number} 최종 만기 금액 (원, 반올림)
 */
export function calculateFutureValue(monthlyDeposit, annualRate, years) {
    const months = Math.round(years * 12);
    if (months <= 0 || monthlyDeposit <= 0) return 0;
    
    // 수익률이 0인 경우(단순 저축)
    if (annualRate <= 0) {
        return Math.round(monthlyDeposit * months);
    }
    
    // 월 복리 이자율
    const monthlyRate = annualRate / 12;
    
    // 적립식 복리 미래가치 공식: FV = PMT * [((1 + r)^n - 1) / r]
    const futureValue = monthlyDeposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return Math.round(futureValue);
}

/**
 * 담배값 절약액 및 투자 복리 결과 시뮬레이션
 * @param {Object} params
 * @param {number} params.packsPerDay - 하루 흡연량 (갑 단위, 예: 1)
 * @param {number} params.pricePerPack - 담배 한 갑 가격 (원, 기본 4,500원)
 * @param {number} params.years - 기간 (년 단위, 예: 10)
 * @param {number} params.customRate - 사용자 지정 연수익률 (백분율, 예: 8)
 * @returns {Object} 종합 시뮬레이션 분석 결과
 */
export function simulateSmokingWealth({ packsPerDay = 1, pricePerPack = 4500, years = 10, customRate = 8 }) {
    // 1. 유효성 검사 및 정규화
    const validPacks = Math.max(0.1, Number(packsPerDay) || 1);
    const validPrice = Math.max(1000, Number(pricePerPack) || 4500);
    const validYears = Math.max(1, Math.min(50, Number(years) || 10));
    const validCustomRate = (Number(customRate) || 8) / 100;

    // 2. 비용 계산
    // 하루 지출액 = 갑수 * 갑당가격
    const dailyCost = validPacks * validPrice;
    // 연간 지출액 = 하루 지출액 * 365일
    const annualCost = dailyCost * 365;
    // 월평균 저축 가능 금액 = 연간 지출액 / 12개월
    const monthlyDeposit = Math.round(annualCost / 12);
    // 총 원금(단순 지출 누적액)
    const totalPrincipal = Math.round(annualCost * validYears);

    // 3. 자산군별 미래가치 계산
    const sp500Value = calculateFutureValue(monthlyDeposit, ASSET_YIELDS.sp500, validYears);
    const nasdaqValue = calculateFutureValue(monthlyDeposit, ASSET_YIELDS.nasdaq, validYears);
    const savingsValue = calculateFutureValue(monthlyDeposit, ASSET_YIELDS.savings, validYears);
    const customValue = calculateFutureValue(monthlyDeposit, validCustomRate, validYears);

    // S&P 500 기준 순수익 및 수익률
    const sp500Profit = sp500Value - totalPrincipal;
    const sp500Roi = totalPrincipal > 0 ? (sp500Profit / totalPrincipal) * 100 : 0;

    // 4. 건강 회복 시뮬레이션 지표 (의학 통계 기준)
    // 1갑 = 20개비 기준
    const totalCigarettes = Math.round(validPacks * 20 * 365 * validYears);
    
    // (1) 흡연 및 이동 시간 절약: 1개비당 평균 7분 소요 가정
    const savedMinutes = totalCigarettes * 7;
    const savedDays = (savedMinutes / (60 * 24)).toFixed(1);
    const savedHours = Math.round(savedMinutes / 60);

    // (2) 타르 방어량: 일반 담배 1개비당 평균 타르 약 6mg 기준 (그램 단위 환산)
    const savedTarGrams = (totalCigarettes * 6) / 1000;
    // 일반 종이컵(약 65g) 분량으로 환산
    const savedTarCups = (savedTarGrams / 65).toFixed(1);

    // (3) 니코틴 방어량: 1개비당 평균 니코틴 약 0.6mg 기준
    const savedNicotineGrams = (totalCigarettes * 0.6) / 1000;

    // (4) 되찾은 기대 수명 (영국 BMJ 연구: 담배 1개비당 기대수명 약 11분 단축)
    const regainedLifeMinutes = totalCigarettes * 11;
    const regainedLifeDays = Math.round(regainedLifeMinutes / (60 * 24));
    const regainedLifeYears = (regainedLifeDays / 365).toFixed(1);

    // 5. 모인 돈으로 살 수 있는 현실적인 아이템 비유
    let equivalentItem = "최신 스마트폰 풀세트";
    if (sp500Value >= 500000000) {
        equivalentItem = "수도권 아파트 한 채 구매 가능 🏢";
    } else if (sp500Value >= 200000000) {
        equivalentItem = "서울 인기 지역 아파트 전세 보증금 🏠";
    } else if (sp500Value >= 100000000) {
        equivalentItem = "포르쉐 911 또는 최고급 수입 세단 🏎️";
    } else if (sp500Value >= 60000000) {
        equivalentItem = "제네시스 G80 풀옵션 신차 🚗";
    } else if (sp500Value >= 30000000) {
        equivalentItem = "현대 아반떼 신차 전액 일시불 🚘";
    } else if (sp500Value >= 15000000) {
        equivalentItem = "유럽 전역 최고급 럭셔리 여행 ✈️";
    } else if (sp500Value >= 5000000) {
        equivalentItem = "최고급 명품 가방 또는 하이엔드 PC 풀세트 💻";
    }

    return {
        inputs: {
            packsPerDay: validPacks,
            pricePerPack: validPrice,
            years: validYears,
            customRate: (validCustomRate * 100).toFixed(1)
        },
        costs: {
            dailyCost: Math.round(dailyCost),
            monthlyDeposit,
            totalPrincipal
        },
        investments: {
            cash: totalPrincipal,
            savings: savingsValue,
            sp500: sp500Value,
            nasdaq: nasdaqValue,
            custom: customValue,
            sp500Profit,
            sp500Roi: sp500Roi.toFixed(1)
        },
        health: {
            totalCigarettes,
            savedHours,
            savedDays,
            savedTarGrams: savedTarGrams.toFixed(1),
            savedTarCups,
            savedNicotineGrams: savedNicotineGrams.toFixed(1),
            regainedLifeDays,
            regainedLifeYears
        },
        equivalentItem
    };
}
