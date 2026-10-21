/**
 * ==========================================================================
 * [별별 통계] 대한민국 순자산 백분위 계산 로직 엔진 (logic.js)
 * --------------------------------------------------------------------------
 * 통계청·한국은행·금융감독원 공식 발표 『2024년 가계금융복지조사』
 * 실측 마이크로데이터 분위별 기준점을 기반으로, 사용자의 순자산이
 * 대한민국 전체 및 연령대별 집단에서 상위 몇 %인지 고정밀 추정합니다.
 * ==========================================================================
 */

export const WealthLogic = {};

/**
 * 2024년 가계금융복지조사 기준 순자산 분위 경계값 데이터 (단위: 만원)
 * 출처: 통계청(KOSIS), 한국은행, 금융감독원 공동 조사 공공데이터 (2024년 말 기준)
 */
WealthLogic.DATA_2024 = {
    // 대한민국 전체 가구 기준
    all: {
        label: '대한민국 전체 가구',
        mean: 43540,      // 평균 순자산 4억 3,540만원
        median: 24700,    // 중위 순자산 2억 4,700만원
        cutoffs: [
            { pct: 99.0, val: 328000 }, // 상위 1% 컷: 약 32.8억원
            { pct: 95.0, val: 165000 }, // 상위 5% 컷: 약 16.5억원
            { pct: 90.0, val: 108500 }, // 상위 10% 컷: 약 10.85억원
            { pct: 80.0, val: 62000 },  // 상위 20% (5분위 하한): 6.2억원
            { pct: 70.0, val: 44500 },  // 상위 30%: 4.45억원
            { pct: 60.0, val: 33000 },  // 상위 40%: 3.3억원
            { pct: 50.0, val: 24700 },  // 중위값 50%: 2.47억원
            { pct: 40.0, val: 16500 },  // 상위 60%: 1.65억원
            { pct: 30.0, val: 9800 },   // 상위 70%: 9,800만원
            { pct: 20.0, val: 3500 },   // 상위 80%: 3,500만원
            { pct: 10.0, val: 500 },    // 상위 90%: 500만원
            { pct: 0.0,  val: -5000 }   // 최하위 (부채 초과 구간)
        ]
    },
    // 29세 이하 청년 가구
    under30: {
        label: '29세 이하 청년 가구',
        mean: 9200,       // 평균 9,200만원
        median: 4800,     // 중위값 4,800만원
        cutoffs: [
            { pct: 99.0, val: 85000 },
            { pct: 95.0, val: 42000 },
            { pct: 90.0, val: 24000 },
            { pct: 80.0, val: 13500 },
            { pct: 70.0, val: 8600 },
            { pct: 60.0, val: 6200 },
            { pct: 50.0, val: 4800 },
            { pct: 40.0, val: 3200 },
            { pct: 30.0, val: 1800 },
            { pct: 20.0, val: 750 },
            { pct: 10.0, val: 100 },
            { pct: 0.0,  val: -3000 }
        ]
    },
    // 30대 가구
    age30s: {
        label: '30대 가구 (30~39세)',
        mean: 31000,      // 평균 3억 1,000만원
        median: 20500,    // 중위값 2억 500만원
        cutoffs: [
            { pct: 99.0, val: 175000 },
            { pct: 95.0, val: 102000 },
            { pct: 90.0, val: 68000 },
            { pct: 80.0, val: 43000 },
            { pct: 70.0, val: 30500 },
            { pct: 60.0, val: 24500 },
            { pct: 50.0, val: 20500 },
            { pct: 40.0, val: 14000 },
            { pct: 30.0, val: 8200 },
            { pct: 20.0, val: 3800 },
            { pct: 10.0, val: 950 },
            { pct: 0.0,  val: -5000 }
        ]
    },
    // 40대 가구
    age40s: {
        label: '40대 가구 (40~49세)',
        mean: 51200,      // 평균 5억 1,200만원
        median: 33500,    // 중위값 3억 3,500만원
        cutoffs: [
            { pct: 99.0, val: 345000 },
            { pct: 95.0, val: 189000 },
            { pct: 90.0, val: 125000 },
            { pct: 80.0, val: 76000 },
            { pct: 70.0, val: 56000 },
            { pct: 60.0, val: 43000 },
            { pct: 50.0, val: 33500 },
            { pct: 40.0, val: 23500 },
            { pct: 30.0, val: 14500 },
            { pct: 20.0, val: 6000 },
            { pct: 10.0, val: 1200 },
            { pct: 0.0,  val: -6000 }
        ]
    },
    // 50대 가구
    age50s: {
        label: '50대 가구 (50~59세)',
        mean: 55800,      // 평균 5억 5,800만원 (생애 최고치)
        median: 35000,    // 중위값 3억 5,000만원
        cutoffs: [
            { pct: 99.0, val: 410000 },
            { pct: 95.0, val: 225000 },
            { pct: 90.0, val: 148000 },
            { pct: 80.0, val: 89000 },
            { pct: 70.0, val: 63000 },
            { pct: 60.0, val: 46000 },
            { pct: 50.0, val: 35000 },
            { pct: 40.0, val: 23000 },
            { pct: 30.0, val: 13500 },
            { pct: 20.0, val: 5200 },
            { pct: 10.0, val: 1000 },
            { pct: 0.0,  val: -5000 }
        ]
    },
    // 60세 이상 가구
    age60plus: {
        label: '60세 이상 은퇴/고령 가구',
        mean: 45200,      // 평균 4억 5,200만원
        median: 23800,    // 중위값 2억 3,800만원
        cutoffs: [
            { pct: 99.0, val: 375000 },
            { pct: 95.0, val: 185000 },
            { pct: 90.0, val: 115000 },
            { pct: 80.0, val: 66000 },
            { pct: 70.0, val: 45000 },
            { pct: 60.0, val: 32000 },
            { pct: 50.0, val: 23800 },
            { pct: 40.0, val: 15500 },
            { pct: 30.0, val: 9000 },
            { pct: 20.0, val: 3900 },
            { pct: 10.0, val: 800 },
            { pct: 0.0,  val: -3000 }
        ]
    }
};

/**
 * 금액(만원) 포맷팅 헬퍼 (예: 12500 -> "1억 2,500만원")
 * @param {number} manwon 
 * @returns {string}
 */
WealthLogic.formatCurrency = function (manwon) {
    if (isNaN(manwon)) return '0원';
    if (manwon === 0) return '0원';

    const isMinus = manwon < 0;
    const absVal = Math.abs(manwon);

    const uk = Math.floor(absVal / 10000);
    const rest = Math.round(absVal % 10000);

    let res = '';
    if (uk > 0) {
        res += `${uk}억 `;
    }
    if (rest > 0 || uk === 0) {
        res += `${rest.toLocaleString()}만`;
    }
    res = res.trim() + '원';
    return isMinus ? `-${res}` : res;
};

/**
 * 순자산 금액을 기반으로 상위 백분위(Percentile)를 정밀 보간 계산
 * @param {string} ageGroup - 'all', 'under30', 'age30s', 'age40s', 'age50s', 'age60plus'
 * @param {number} netWorthManwon - 순자산 금액 (만원 단위)
 * @returns {{ percentile: number, topRate: number, mean: number, median: number }}
 */
WealthLogic.calculatePercentile = function (ageGroup, netWorthManwon) {
    const groupData = WealthLogic.DATA_2024[ageGroup] || WealthLogic.DATA_2024.all;
    const cuts = groupData.cutoffs;

    // 1. 최상위(1% 초과)
    if (netWorthManwon >= cuts[0].val) {
        // 1% 이상인 경우 초과분에 따른 지수 감쇠 보간 (최소 0.01% 상한)
        const diff = netWorthManwon - cuts[0].val;
        const topRatio = Math.max(0.01, (1.0 - (diff / (cuts[0].val * 2))) * 0.99);
        return {
            percentile: Number((100 - topRatio).toFixed(2)),
            topRate: Number(topRatio.toFixed(2)),
            mean: groupData.mean,
            median: groupData.median,
            groupLabel: groupData.label
        };
    }

    // 2. 최하위(0% 미만)
    const lowest = cuts[cuts.length - 1];
    if (netWorthManwon <= lowest.val) {
        return {
            percentile: 0.1,
            topRate: 99.9,
            mean: groupData.mean,
            median: groupData.median,
            groupLabel: groupData.label
        };
    }

    // 3. 구간 선형 보간 (Piecewise Linear Interpolation)
    for (let i = 0; i < cuts.length - 1; i++) {
        const higher = cuts[i];     // 높은 순위
        const lower = cuts[i + 1];  // 낮은 순위

        if (netWorthManwon <= higher.val && netWorthManwon >= lower.val) {
            const rangeVal = higher.val - lower.val;
            const pos = rangeVal > 0 ? (netWorthManwon - lower.val) / rangeVal : 0;
            const percentile = lower.pct + (higher.pct - lower.pct) * pos;
            const topRate = 100 - percentile;

            return {
                percentile: Number(percentile.toFixed(1)),
                topRate: Number(topRate.toFixed(1)),
                mean: groupData.mean,
                median: groupData.median,
                groupLabel: groupData.label
            };
        }
    }

    // 기본 폴백
    return {
        percentile: 50.0,
        topRate: 50.0,
        mean: groupData.mean,
        median: groupData.median,
        groupLabel: groupData.label
    };
};

/**
 * 사용자의 순자산 위치에 대한 재치있고 품격 있는 분석 평서문 생성
 */
WealthLogic.getFeedbackText = function (topRateAll, topRateAge, ageGroup) {
    let tier = '';
    let emoji = '';
    let desc = '';

    if (topRateAll <= 1.0) {
        tier = '초고액 자산가 (Top 1%)';
        emoji = '👑';
        desc = '대한민국 상위 1%의 최상위 자산가 계층에 속합니다. 안정적인 자산 방어와 절세 및 가업 승계가 핵심 화두인 구간입니다.';
    } else if (topRateAll <= 5.0) {
        tier = '대한민국 상위 5% 자산가';
        emoji = '💎';
        desc = '대한민국 전체 가구 중 상위 5%에 해당하는 탄탄한 부를 축적하셨습니다. 경제적 자유를 이미 달성했거나 목전에 두고 계십니다.';
    } else if (topRateAll <= 10.0) {
        tier = '상위 10% 알짜배기 자산가';
        emoji = '🏆';
        desc = '순자산 10억 원 안팎의 안정적인 중산층 상위 그룹입니다. 부동산과 금융자산의 황금 밸런스를 구축하기에 최적의 시기입니다.';
    } else if (topRateAll <= 20.0) {
        tier = '상위 20% (5분위 진입)';
        emoji = '🚀';
        desc = '대한민국 전체 통계에서 상위 20% 이내에 안착하셨습니다. 꾸준한 시드머니 불리기와 투자 복리 효과를 체감하는 구간입니다.';
    } else if (topRateAll <= 50.0) {
        tier = '평균 이상 든든한 저축형';
        emoji = '💪';
        desc = '대한민국 가구의 딱 중간(중위값 2.47억) 이상의 튼튼한 안전판을 마련하셨습니다. 지속적인 적립식 자산 배분이 부를 키우는 열쇠입니다.';
    } else {
        tier = '자산 형성기 도전형';
        emoji = '🌱';
        desc = '이제 막 종잣돈을 모으고 자산 스노우볼을 굴리기 시작한 단계입니다. 작은 저축의 습관이 10년 뒤 거대한 복리 열매로 돌아옵니다.';
    }

    return { tier, emoji, desc };
};
