/**
 * ==========================================================================
 * SimuLab - 소비 vs 투자 기회비용 계산기 로직 엔진
 * 파일 경로: tools/opportunity-cost-calc/logic.js
 * --------------------------------------------------------------------------
 * [원리 및 공식]
 * 1. 1회성 지출(Lump sum):
 *    - 미래가치(FV) = 원금 × (1 + r)^n
 *    - 물품 감가상각 잔존가치(예: 자동차 10년 후 20~25% 잔존, 명품 30~40%)
 * 2. 정기적 반복 지출(Recurring Monthly):
 *    - 미래가치(FV) = 월 지출액 × [ ( (1 + r/12)^(12×n) - 1 ) / (r/12) ]
 * 3. 기회비용 총격차 = 투자 미래가치 - 물품 잔존가치
 * 4. 체감형 실물 비교 환산:
 *    - 서울/수도권 아파트 전세 보증금
 *    - 평생 월 배당금 (연 5% 배당률 가정)
 *    - 치킨 마리수, 해외여행 횟수
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const OpportunityLogic = {};

  /**
   * 사전 정의된 인기 소비 프리셋 데이터
   */
  OpportunityLogic.PRESETS = {
    car: {
      name: '중형 신차 구매',
      type: 'lump',
      amount: 35000000,
      depreciationRateYearly: 0.12, // 연 12% 감가상각
      desc: '신차 3,500만원 구매 (등록세 및 취득세 포함)'
    },
    luxury_bag: {
      name: '명품 가방 구매',
      type: 'lump',
      amount: 4000000,
      depreciationRateYearly: 0.15,
      desc: '백화점 명품 백 400만원 일시불'
    },
    phone: {
      name: '최신 플래그십 폰',
      type: 'lump',
      amount: 1800000,
      depreciationRateYearly: 0.30,
      desc: '최신 스마트폰 180만원 기기값'
    },
    delivery: {
      name: '주 3회 배달음식',
      type: 'recurring',
      amount: 250000, // 월 약 25만원
      depreciationRateYearly: 1.0, // 소비 후 0원
      desc: '한 번에 2만원씩 주 3회 주문 (월 25만원)'
    },
    coffee: {
      name: '매일 프랜차이즈 커피',
      type: 'recurring',
      amount: 150000, // 월 약 15만원 (하루 5,000원)
      depreciationRateYearly: 1.0,
      desc: '하루 5,000원 테이크아웃 커피 (월 15만원)'
    },
    smoking: {
      name: '매일 담배 한 갑',
      type: 'recurring',
      amount: 135000, // 월 약 13.5만원 (하루 4,500원)
      depreciationRateYearly: 1.0,
      desc: '하루 1갑 4,500원 (월 13.5만원)'
    }
  };

  /**
   * 투자 자산별 기대 수익률 프리셋
   */
  OpportunityLogic.ASSETS = {
    sp500: { name: '미국 S&P 500 (연 8%)', annualReturn: 0.08 },
    dividend: { name: '배당성장 ETF (연 6% + 배당재투자)', annualReturn: 0.06 },
    nasdaq: { name: '나스닥 100 QQQ (연 12%)', annualReturn: 0.12 },
    custom: { name: '직접 입력', annualReturn: 0.07 }
  };

  /**
   * 감가상각 잔존가치 계산
   */
  OpportunityLogic.calculateDepreciatedValue = function (initialAmount, annualDeprecRate, years) {
    if (annualDeprecRate >= 1.0) return 0;
    // 복리 감가: 잔존가치 = 원금 × (1 - 감가율)^년수 (최저 5% 고철/중고 잔존)
    const factor = Math.pow(Math.max(0, 1 - annualDeprecRate), years);
    return Math.max(initialAmount * 0.05, Math.round(initialAmount * factor));
  };

  /**
   * 실물 비교 환산 메시지 생성
   */
  OpportunityLogic.generateRealLifeComparisons = function (futureValue) {
    const monthlyDividend = Math.round((futureValue * 0.05) / 12); // 연 5% 배당 시 월 수령액
    const chickenCount = Math.floor(futureValue / 20000); // 2만원 치킨
    const travelCount = Math.floor(futureValue / 2000000); // 200만원 해외여행

    let realEstateText = '';
    if (futureValue >= 500000000) {
      realEstateText = '수도권 아파트 1채 매매 자금';
    } else if (futureValue >= 200000000) {
      realEstateText = '수도권 아파트 전세 보증금';
    } else if (futureValue >= 50000000) {
      realEstateText = '오피스텔/빌라 전세 보증금';
    } else {
      realEstateText = '사회초년생 종잣돈 및 보증금';
    }

    return {
      monthlyDividend,
      chickenCount,
      travelCount,
      realEstateText
    };
  };

  /**
   * 기회비용 핵심 계산 함수
   */
  OpportunityLogic.calculate = function (params) {
    const {
      type = 'lump',           // 'lump' (일시불) 또는 'recurring' (월 반복)
      amount = 35000000,       // 소비 금액 (일시불 금액 또는 월 소비액)
      annualReturn = 0.08,     // 연평균 수익률 (예: 0.08)
      years = 10,              // 투자 기간 (년)
      deprecRate = 0.12        // 연간 감가상각률
    } = params;

    const n = Math.max(1, Number(years) || 10);
    const r = Number(annualReturn) || 0.08;
    const baseAmt = Math.max(0, Number(amount) || 0);

    let futureInvestValue = 0;
    let totalInvestedPrincipal = 0;
    let itemResidualValue = 0;

    // 연도별 누적 추이 데이터 (차트/테이블용)
    const yearlyBreakdown = [];

    if (type === 'lump') {
      // 1회성 목돈 투자
      totalInvestedPrincipal = baseAmt;
      futureInvestValue = Math.round(baseAmt * Math.pow(1 + r, n));
      itemResidualValue = OpportunityLogic.calculateDepreciatedValue(baseAmt, deprecRate, n);

      for (let y = 1; y <= n; y++) {
        const fv = Math.round(baseAmt * Math.pow(1 + r, y));
        const res = OpportunityLogic.calculateDepreciatedValue(baseAmt, deprecRate, y);
        yearlyBreakdown.push({
          year: y,
          investValue: fv,
          itemValue: res,
          gap: fv - res
        });
      }
    } else {
      // 매월 반복 지출 적립식 투자
      const monthlyRate = r / 12;
      const totalMonths = n * 12;
      totalInvestedPrincipal = baseAmt * totalMonths;

      if (monthlyRate > 0) {
        futureInvestValue = Math.round(
          baseAmt * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
        );
      } else {
        futureInvestValue = totalInvestedPrincipal;
      }
      itemResidualValue = 0; // 소비성 반복 지출은 잔존가치 0원

      for (let y = 1; y <= n; y++) {
        const m = y * 12;
        const fv = monthlyRate > 0
          ? Math.round(baseAmt * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate))
          : baseAmt * m;
        yearlyBreakdown.push({
          year: y,
          investValue: fv,
          itemValue: 0,
          gap: fv
        });
      }
    }

    // 총 기회비용 격차 (투자 시 누적 자산 - 소비 물품의 남은 가치)
    const opportunityCostGap = Math.max(0, futureInvestValue - itemResidualValue);
    // 수익 배수 (원금 대비 몇 배가 되었는가)
    const multiplier = totalInvestedPrincipal > 0 ? (futureInvestValue / totalInvestedPrincipal) : 1;

    // 실물 체감 비교 데이터
    const comparisons = OpportunityLogic.generateRealLifeComparisons(futureInvestValue);

    return {
      type,
      totalInvestedPrincipal,
      futureInvestValue,
      itemResidualValue,
      opportunityCostGap,
      multiplier: Math.round(multiplier * 10) / 10,
      comparisons,
      yearlyBreakdown
    };
  };

  global.OpportunityLogic = OpportunityLogic;
})(typeof window !== 'undefined' ? window : globalThis);
