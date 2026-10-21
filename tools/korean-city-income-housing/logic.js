/**
 * ==========================================================================
 * [별별 통계] 전국 도시별 소득 & 집값 데이터 및 연산 로직 (logic.js)
 * --------------------------------------------------------------------------
 * 출처:
 * 1. 통계청 『지역소득통계 (1인당 개인소득)』 및 『인구주택총조사 (1인가구 비중)』
 * 2. 한국부동산원 『공동주택 실거래가격지수 및 시도별 평균 아파트 매매가격』
 * 3. 국토교통부 『지적통계연보 (시도별 행정구역 면적)』
 * ==========================================================================
 */

export const CityIncomeHousingLogic = {
  // 1. 전국 17개 시도 최신 공식 지표 데이터 (2024~2025 기준)
  REGIONS_DATA: {
    seoul: {
      id: 'seoul',
      name: '서울특별시',
      shortName: '서울',
      income: 2611,        // 1인당 연간 개인소득 (만원)
      householdIncome: 6850,// 가구당 평균 연소득 (만원)
      housingPrice: 124000,// 평균 아파트 매매가 (만원 = 12억 4천)
      pyeongPrice: 4250,   // 평당 평균 매매가 (만원)
      singleRatio: 38.2,   // 1인가구 비율 (%)
      area: 605.2,         // 행정구역 면적 (㎢)
      population: 938      // 인구 (만 명)
    },
    gyeonggi: {
      id: 'gyeonggi',
      name: '경기도',
      shortName: '경기',
      income: 2420,
      householdIncome: 6520,
      housingPrice: 53500,
      pyeongPrice: 1850,
      singleRatio: 30.8,
      area: 10199.0,
      population: 1365
    },
    incheon: {
      id: 'incheon',
      name: '인천광역시',
      shortName: '인천',
      income: 2280,
      householdIncome: 5890,
      housingPrice: 38500,
      pyeongPrice: 1350,
      singleRatio: 31.0,
      area: 1066.0,
      population: 300
    },
    busan: {
      id: 'busan',
      name: '부산광역시',
      shortName: '부산',
      income: 2340,
      householdIncome: 5780,
      housingPrice: 39000,
      pyeongPrice: 1380,
      singleRatio: 34.0,
      area: 770.1,
      population: 328
    },
    daegu: {
      id: 'daegu',
      name: '대구광역시',
      shortName: '대구',
      income: 2260,
      householdIncome: 5650,
      housingPrice: 35000,
      pyeongPrice: 1240,
      singleRatio: 33.7,
      area: 1499.0,
      population: 237
    },
    gwangju: {
      id: 'gwangju',
      name: '광주광역시',
      shortName: '광주',
      income: 2370,
      householdIncome: 5820,
      housingPrice: 34500,
      pyeongPrice: 1210,
      singleRatio: 34.5,
      area: 501.2,
      population: 142
    },
    daejeon: {
      id: 'daejeon',
      name: '대전광역시',
      shortName: '대전',
      income: 2410,
      householdIncome: 6050,
      housingPrice: 38000,
      pyeongPrice: 1320,
      singleRatio: 38.5, // 1인가구 비중 특광역시 1위
      area: 539.7,
      population: 144
    },
    ulsan: {
      id: 'ulsan',
      name: '울산광역시',
      shortName: '울산',
      income: 2710,       // 1인당 소득 전국 1위
      householdIncome: 6980,
      housingPrice: 32000,
      pyeongPrice: 1120,
      singleRatio: 29.5,
      area: 1062.0,
      population: 110
    },
    sejong: {
      id: 'sejong',
      name: '세종특별자치시',
      shortName: '세종',
      income: 2520,
      householdIncome: 6950,
      housingPrice: 51000,
      pyeongPrice: 1780,
      singleRatio: 31.5,
      area: 464.9,
      population: 39
    },
    gangwon: {
      id: 'gangwon',
      name: '강원특별자치도',
      shortName: '강원',
      income: 2210,
      householdIncome: 5320,
      housingPrice: 21000,
      pyeongPrice: 750,
      singleRatio: 37.2,
      area: 16875.0,
      population: 153
    },
    chungbuk: {
      id: 'chungbuk',
      name: '충청북도',
      shortName: '충북',
      income: 2250,
      householdIncome: 5480,
      housingPrice: 21500,
      pyeongPrice: 770,
      singleRatio: 36.1,
      area: 7407.0,
      population: 159
    },
    chungnam: {
      id: 'chungnam',
      name: '충청남도',
      shortName: '충남',
      income: 2310,
      householdIncome: 5720,
      housingPrice: 23000,
      pyeongPrice: 810,
      singleRatio: 36.6,
      area: 8247.0,
      population: 213
    },
    jeonbuk: {
      id: 'jeonbuk',
      name: '전북특별자치도',
      shortName: '전북',
      income: 2200,
      householdIncome: 5250,
      housingPrice: 21000,
      pyeongPrice: 740,
      singleRatio: 35.7,
      area: 8073.0,
      population: 175
    },
    jeonnam: {
      id: 'jeonnam',
      name: '전라남도',
      shortName: '전남',
      income: 2230,
      householdIncome: 5310,
      housingPrice: 19500,
      pyeongPrice: 690,
      singleRatio: 34.8,
      area: 12357.0,
      population: 180
    },
    gyeongbuk: {
      id: 'gyeongbuk',
      name: '경상북도',
      shortName: '경북',
      income: 2240,
      householdIncome: 5410,
      housingPrice: 20500,
      pyeongPrice: 720,
      singleRatio: 37.0,
      area: 19034.0, // 면적 전국 1위
      population: 255
    },
    gyeongnam: {
      id: 'gyeongnam',
      name: '경상남도',
      shortName: '경남',
      income: 2270,
      householdIncome: 5610,
      housingPrice: 26500,
      pyeongPrice: 930,
      singleRatio: 33.7,
      area: 10541.0,
      population: 325
    },
    jeju: {
      id: 'jeju',
      name: '제주특별자치도',
      shortName: '제주',
      income: 2290,
      householdIncome: 5750,
      housingPrice: 37000,
      pyeongPrice: 1310,
      singleRatio: 33.4,
      area: 1850.0,
      population: 67
    }
  },

  // 2. 지난 10년간(2015~2024년) 주요 지역 평균 아파트값 추이 (만원 단위)
  YEARLY_TREND: {
    years: ['2015', '2017', '2019', '2021', '2024'],
    seoul: [54000, 67000, 89000, 128000, 124000],
    gyeonggi: [29000, 34000, 41000, 62000, 53500],
    busan: [24000, 29000, 31000, 44000, 39000],
    daejeon: [21000, 23000, 28000, 41000, 38000],
    national: [28000, 33000, 38000, 52000, 49000] // 전국 평균
  },

  /**
   * 소득 대비 집값 배수 (PIR: Price to Income Ratio) 계산
   * @param {number} housingPrice 아파트 매매가 (만원)
   * @param {number} householdIncome 가구당 연소득 (만원)
   * @returns {number} PIR 연수 (소수점 1자리)
   */
  calculatePIR(housingPrice, householdIncome) {
    if (!householdIncome || householdIncome <= 0) return 0;
    return Math.round((housingPrice / householdIncome) * 10) / 10;
  },

  /**
   * 전체 17개 시도 목록 배열 반환 (PIR 자동 계산 포함)
   */
  getAllRegions() {
    return Object.values(this.REGIONS_DATA).map(item => {
      const pir = this.calculatePIR(item.housingPrice, item.householdIncome);
      return {
        ...item,
        pir
      };
    });
  },

  /**
   * 특정 기준에 따른 랭킹 정렬
   * @param {'pir'|'income'|'housingPrice'|'singleRatio'|'area'} sortBy 정렬 기준
   * @param {'desc'|'asc'} order 정렬 순서
   */
  getRankedRegions(sortBy = 'pir', order = 'desc') {
    const list = this.getAllRegions();
    return list.sort((a, b) => {
      return order === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy];
    });
  },

  /**
   * 두 지역 간 1:1 대조 분석 결과 생성
   * @param {string} idA 지역 A id
   * @param {string} idB 지역 B id
   */
  compareRegions(idA, idB) {
    const regA = this.REGIONS_DATA[idA] || this.REGIONS_DATA.seoul;
    const regB = this.REGIONS_DATA[idB] || this.REGIONS_DATA.busan;

    const pirA = this.calculatePIR(regA.housingPrice, regA.householdIncome);
    const pirB = this.calculatePIR(regB.housingPrice, regB.householdIncome);

    return {
      regA: { ...regA, pir: pirA },
      regB: { ...regB, pir: pirB },
      diff: {
        priceGap: regA.housingPrice - regB.housingPrice,
        priceRatio: Math.round((regA.housingPrice / regB.housingPrice) * 10) / 10,
        incomeGap: regA.income - regB.income,
        pirGap: Math.round((pirA - pirB) * 10) / 10,
        singleGap: Math.round((regA.singleRatio - regB.singleRatio) * 10) / 10
      }
    };
  },

  /**
   * 금액 한글 포맷팅 유틸리티 (만원 -> 억/만원)
   */
  formatMoney(manwon) {
    if (!manwon || manwon <= 0) return '0원';
    if (manwon >= 10000) {
      const eok = Math.floor(manwon / 10000);
      const rem = manwon % 10000;
      return rem > 0 ? `${eok}억 ${rem.toLocaleString()}만원` : `${eok}억원`;
    }
    return `${manwon.toLocaleString()}만원`;
  }
};
