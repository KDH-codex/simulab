/**
 * ==========================================================================
 * SimuLab - 그때 그 아파트 샀다면 (부동산 타임머신) 로직 엔진
 * 파일 경로: tools/past-apt-timemachine/logic.js
 * --------------------------------------------------------------------------
 * [원리 및 역사적 데이터]
 * 1. 국토교통부 실거래가 기준 서울/수도권 주요 대장 아파트 연도별 시세
 * 2. 레버리지(주택담보대출 LTV) 적용 시 내 실투자 종잣돈 계산
 * 3. 현재 시세 대비 시세차익, 자기자본 수익률(ROE), 대출이자 차감 후 순이익
 * 4. 전세로 머물렀을 때의 기회비용 손실액 계산
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const AptTimemachineLogic = {};

  // 대표 아파트 단지별 역사적 실거래 시세 (전용 84㎡ 국평 기준, 단위: 원)
  AptTimemachineLogic.APARTMENT_PRESETS = {
    eunma: {
      name: '대치 은마아파트 (84㎡)',
      region: '강남구 대치동',
      currentPrice: 2750000000, // 현재가 약 27.5억
      prices: {
        2006: 1150000000,
        2013: 880000000,   // 바닥 시점
        2017: 1350000000,
        2019: 1950000000
      }
    },
    banpo_xi: {
      name: '반포자이 (84㎡)',
      region: '서초구 반포동',
      currentPrice: 3800000000, // 현재가 약 38억
      prices: {
        2009: 1200000000,
        2013: 1250000000,
        2017: 1800000000,
        2019: 2600000000
      }
    },
    mapo_raemian: {
      name: '마포래미안푸르지오 (84㎡)',
      region: '마포구 아현동',
      currentPrice: 1850000000, // 현재가 약 18.5억
      prices: {
        2014: 620000000,   // 입주 당시
        2017: 850000000,
        2019: 1400000000
      }
    },
    jamsil_els: {
      name: '잠실 엘스 (84㎡)',
      region: '송파구 잠실동',
      currentPrice: 2650000000, // 현재가 약 26.5억
      prices: {
        2008: 900000000,
        2013: 850000000,
        2017: 1250000000,
        2019: 1900000000
      }
    },
    bundang_parkview: {
      name: '분당 파크뷰 (84㎡)',
      region: '성남시 분당구',
      currentPrice: 1750000000, // 현재가 약 17.5억
      prices: {
        2006: 850000000,
        2013: 650000000,
        2017: 850000000,
        2019: 1250000000
      }
    }
  };

  /**
   * 타임머신 시뮬레이션 계산 함수
   */
  AptTimemachineLogic.calculate = function (params) {
    const {
      pastPrice = 620000000,     // 당시 매수가격 (원)
      currentPrice = 1850000000, // 현재 시세 (원)
      purchaseYear = 2014,       // 매수 연도
      ltvPercent = 50,           // 당시 주담대 비율 (%)
      annualMortgageRate = 3.5   // 대출 평균 금리 (%/년)
    } = params;

    const currentYear = 2026;
    const holdYears = Math.max(1, currentYear - purchaseYear);

    const pastP = Math.max(0, Number(pastPrice) || 0);
    const currP = Math.max(0, Number(currentPrice) || 0);
    const ltv = Math.max(0, Math.min(80, Number(ltvPercent) || 0)) / 100;
    const rate = Math.max(0, Number(annualMortgageRate) || 0) / 100;

    // 1. 대출금 및 내 실투자금(종잣돈)
    const loanAmount = Math.round(pastP * ltv);
    const mySeedMoney = Math.max(1, pastP - loanAmount);

    // 2. 순수 시세차익 (매매가 상승분)
    const capitalGain = currP - pastP;

    // 3. 보유 기간 대출 이자 총액 (원금 만기일시 또는 거치 기준 단순 추정)
    const totalInterestPaid = Math.round(loanAmount * rate * holdYears);

    // 4. 이자 차감 후 순자산 증가액
    const netProfit = capitalGain - totalInterestPaid;

    // 5. 내 종잣돈 대비 수익률 (ROE)
    const roePercent = mySeedMoney > 0 ? (netProfit / mySeedMoney) * 100 : 0;

    // 6. 전세 유지 시 기회비용 손실 격차
    // 전세로 살면서 대출이자는 안 냈지만(+이자 세이브), 집값 상승분(-시세차익)을 통째로 놓침
    const opportunityCostLoss = capitalGain - totalInterestPaid;

    // 7. 유쾌한 평가 등급 메시지
    let gradeTitle = '';
    let gradeComment = '';
    if (netProfit >= 1500000000) {
      gradeTitle = '👑 강남 건물주 레벨';
      gradeComment = '그때 샀으면 지금 사직서 던지고 평생 배당과 월세 받으며 여행 다녔습니다.';
    } else if (netProfit >= 800000000) {
      gradeTitle = '🏆 벼락부자 패스';
      gradeComment = '평생 직장 월급을 20년 치 한 번에 번 셈입니다. 인생 최고의 선택이었을 텐데요...';
    } else if (netProfit >= 400000000) {
      gradeTitle = '🚗 억대 자산가 도약';
      gradeComment = '중산층 상위 10%에 안착하여 자녀 교육과 노후 걱정이 절반으로 줄었을 것입니다.';
    } else {
      gradeTitle = '☕ 쏠쏠한 자산 방어';
      gradeComment = '인플레이션을 이기고 소중한 내 집을 지켜낸 훌륭한 안전자산이 되었을 것입니다.';
    }

    return {
      pastPrice: pastP,
      currentPrice: currP,
      holdYears,
      loanAmount,
      mySeedMoney,
      capitalGain,
      totalInterestPaid,
      netProfit,
      roePercent: Math.round(roePercent * 10) / 10,
      opportunityCostLoss,
      gradeTitle,
      gradeComment
    };
  };

  global.AptTimemachineLogic = AptTimemachineLogic;
})(typeof window !== 'undefined' ? window : globalThis);
