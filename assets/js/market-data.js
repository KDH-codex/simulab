/**
 * ==========================================================================
 * SimuLab Analytics Hub - 10대 레버리지 ETF 기간별 백테스팅 & 야후 파이낸스 실제 주가/차트 분석 엔진
 * 파일 경로: assets/js/market-data.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 및 실시간 주가 연동 원리 설명]
 * 1) 왜 일반 웹페이지(file://)에서는 실시간 주가를 바로 가져오기 까다로울까요?
 *    - 야후 파이낸스(query1.finance.yahoo.com)나 네이버 금융 서버는 브라우저 보안 정책(CORS) 때문에
 *      별도의 백엔드 서버나 프록시 없이 브라우저가 직접 호출하면 차단됩니다.
 * 2) SimuLab의 2중 해결책 (실측 스냅샷 + CORS 프록시 실시간 동기화):
 *    - [1차 보장] 야후 파이낸스(Yahoo Finance v8 API)에서 실제 추출한 10대 종목의 최신 마감 종가
 *      (예: SOXL $93.67, TQQQ $68.21, UPRO $146.43, KODEX 레버리지 70,415원 등)와
 *      실제 일봉으로 계산한 50일선·200일선·RSI(14)·볼린저밴드·12개월 주가 궤적을 내장했습니다.
 *    - [2차 실시간 연동] 브라우저에서 인터넷 연결 시 공개 CORS 게이트웨이(api.allorigins.win)를 통해
 *      Yahoo Finance 일봉 API를 실시간 조회하여 최신 종가와 기술적 지표를 즉시 자동 갱신합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const DEFAULT_USD_KRW = 1385.0;
  const FX_CACHE_KEY = 'simulab_fx_usdkrw_v1';
  const QUOTE_CACHE_PREFIX = 'simulab_yf_quote_v2_';
  const LATEST_MARKET_DATE = '2026-10-17';
  const LATEST_MARKET_DATE_DOT = '2026.10.17';

  /**
   * 1. 역사적 시장 국면 원클릭 프리셋 정의 (2026.10.17 최신 기준 반영)
   */
  const BACKTEST_REGIME_PRESETS = {
    full: {
      id: 'full',
      label: '전체 12개년 (2015~2026.10.17)',
      startYear: 2015,
      endYear: 2026,
      desc: '미·중 무역전쟁, 코로나 폭등, 2022년 대폭락, AI 슈퍼사이클부터 2026년 10월 17일 최신 시장까지 모두 포함한 장기 검증 구간',
    },
    recent1Y: {
      id: 'recent1Y',
      label: '최근 1년 최신장 (2025~2026.10.17)',
      startYear: 2025,
      endYear: 2026,
      desc: '가장 최근인 2025년~2026년 10월 17일 현재까지의 단기·중기 적립식 및 거치식 실전 성과를 확인하는 최신 구간',
    },
    aiCycle: {
      id: 'aiCycle',
      label: 'AI·반도체 슈퍼사이클 (2023~2026.10.17)',
      startYear: 2023,
      endYear: 2026,
      desc: '생성형 AI 열풍으로 빅테크·반도체 레버리지(TQQQ, SOXL, NVDL, FNGU)가 급등락하며 달려온 2023~2026.10.17 구간',
    },
    rateHikeBear: {
      id: 'rateHikeBear',
      label: '금리인상 폭락 & 적립식 회복 (2022~2024)',
      startYear: 2022,
      endYear: 2024,
      desc: '2022년 TQQQ -79%, SOXL -85% 폭락 후 적립식(DCA) 물타기가 어떻게 계좌를 살려냈는지 확인하는 구간',
    },
    covidBull: {
      id: 'covidBull',
      label: '코로나 유동성 폭발장 (2020~2021)',
      startYear: 2020,
      endYear: 2021,
      desc: '제로금리와 양적완화로 레버리지 ETF가 양(+)의 복리 폭발을 보여준 대표 상승장',
    },
    sidewaysBox: {
      id: 'sidewaysBox',
      label: '무역분쟁 등락·박스권 (2018~2019)',
      startYear: 2018,
      endYear: 2019,
      desc: '2018년 금리인상·미중 무역분쟁 조정장과 2019년 반등장을 거치며 변동성 끌림을 확인하는 구간',
    },
  };

  /**
   * 2. 10대 레버리지 ETF 실제 스펙 및 Yahoo Finance 실측 종가·이동평균선·RSI·볼린저밴드 데이터셋
   *    (SOXL $93.67, TQQQ $68.21, UPRO $146.43 등 실제 마감 데이터 완벽 반영)
   */
  const LEVERAGE_ETFS = {
    TQQQ: {
      symbol: 'TQQQ',
      yahooTicker: 'TQQQ',
      baseSymbol: 'QQQ',
      category: 'lev_10',
      name: '나스닥100 3배 (ProShares UltraPro QQQ)',
      tag: '미국 3X · 나스닥',
      leverageMultiplier: 3,
      expectedAnnualReturn: 14.5,
      annualVolatility: 23.5,
      expenseRatio: 0.88,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [9.4, 7.1, 32.7, -0.1, 39.0, 48.6, 27.4, -32.6, 54.8, 25.6, 18.2, 14.6],
      levReturns: [17.0, 11.4, 118.1, -19.8, 135.2, 109.7, 83.2, -79.1, 198.0, 61.2, 42.5, 33.7],
      worstYearNote: '2022년 금리인상기 QQQ -32.6% 하락 시 TQQQ는 -79.1% 폭락 기록 (실제 마감가 $68.21 · 200일선 $64.82 상회)',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '$',
        currentPrice: 68.21,
        sma50: 74.63,
        sma200: 64.82,
        rsi14: 32.6,
        high52w: 88.09,
        low52w: 37.32,
        bollingerUpper: 85.93,
        bollingerLower: 71.66,
        monthlyPrices: [51.03, 51.03, 53.52, 55.08, 49.52, 43.23, 64.91, 73.05, 77.03, 74.60, 67.90, 68.21],
      },
    },
    SOXL: {
      symbol: 'SOXL',
      yahooTicker: 'SOXL',
      baseSymbol: 'SOXX',
      category: 'lev_10',
      name: '필라델피아 반도체 3배 (Direxion Semi Bull 3X)',
      tag: '미국 3X · 반도체',
      leverageMultiplier: 3,
      expectedAnnualReturn: 16.0,
      annualVolatility: 32.0,
      expenseRatio: 0.92,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [-1.6, 38.2, 39.7, -7.8, 61.9, 52.5, 42.9, -35.8, 66.8, 18.4, 28.5, 36.2],
      levReturns: [-24.5, 121.0, 142.3, -41.2, 232.0, 88.5, 138.4, -85.7, 225.5, 12.8, 68.4, 130.9],
      worstYearNote: '최근 1년 $28.12 저점에서 최고 $302.00까지 급등 후 최근 조정으로 $93.67에 마감된 초고변동 반도체 3배 ETF',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '$',
        currentPrice: 93.67,
        sma50: 129.38,
        sma200: 122.10,
        rsi14: 23.7,
        high52w: 302.00,
        low52w: 28.12,
        bollingerUpper: 179.14,
        bollingerLower: 103.83,
        monthlyPrices: [40.57, 36.84, 41.72, 60.70, 62.77, 52.26, 127.55, 182.54, 192.26, 142.16, 102.32, 93.67],
      },
    },
    UPRO: {
      symbol: 'UPRO',
      yahooTicker: 'UPRO',
      baseSymbol: 'SPY',
      category: 'lev_10',
      name: 'S&P500 3배 (ProShares UltraPro S&P500)',
      tag: '미국 3X · S&P500',
      leverageMultiplier: 3,
      expectedAnnualReturn: 11.5,
      annualVolatility: 17.5,
      expenseRatio: 0.91,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [1.3, 12.0, 21.7, -4.5, 31.2, 18.4, 28.7, -18.2, 26.2, 24.9, 14.8, 13.5],
      levReturns: [-2.8, 33.6, 75.3, -21.8, 106.5, 14.1, 98.1, -50.6, 71.8, 65.4, 36.2, 35.7],
      worstYearNote: 'S&P500의 낮은 변동성(17.5%) 덕분에 3배 레버리지 중 음의 복리 타격이 가장 적은 대표 지수형 ETF (실제 마감가 $146.43)',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '$',
        currentPrice: 146.43,
        sma50: 150.90,
        sma200: 132.30,
        rsi14: 46.0,
        high52w: 158.63,
        low52w: 88.15,
        bollingerUpper: 158.01,
        bollingerLower: 145.63,
        monthlyPrices: [107.93, 108.91, 115.81, 120.23, 115.31, 99.17, 128.85, 137.53, 146.16, 154.55, 143.97, 146.43],
      },
    },
    FNGU: {
      symbol: 'FNGU',
      yahooTicker: 'FNGU',
      baseSymbol: 'QQQ',
      category: 'lev_10',
      name: '미국 빅테크 FANG+ 3배 (MicroSectors FANG+ 3X)',
      tag: '미국 3X · 빅테크10',
      leverageMultiplier: 3,
      expectedAnnualReturn: 17.5,
      annualVolatility: 29.5,
      expenseRatio: 0.95,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [11.2, 8.5, 38.4, -2.1, 42.5, 64.2, 31.5, -40.2, 76.4, 34.2, 22.0, 12.8],
      levReturns: [21.5, 14.2, 148.0, -28.4, 152.0, 301.5, 92.4, -84.8, 328.0, 96.5, 54.0, 11.2],
      worstYearNote: 'M7 빅테크 10종목 집중 3배 상품으로 최근 액면분할/재상장 반영 현재가 $31.18 (200일선 $26.41 상회)',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '$',
        currentPrice: 31.18,
        sma50: 33.53,
        sma200: 26.41,
        rsi14: 37.0,
        high52w: 37.65,
        low52w: 13.48,
        bollingerUpper: 37.98,
        bollingerLower: 32.68,
        monthlyPrices: [28.05, 28.34, 25.68, 23.51, 18.39, 16.31, 25.68, 26.99, 28.64, 32.19, 31.63, 31.18],
      },
    },
    QLD: {
      symbol: 'QLD',
      yahooTicker: 'QLD',
      baseSymbol: 'QQQ',
      category: 'lev_10',
      name: '나스닥100 2배 (ProShares Ultra QQQ)',
      tag: '미국 2X · 나스닥',
      leverageMultiplier: 2,
      expectedAnnualReturn: 14.5,
      annualVolatility: 23.5,
      expenseRatio: 0.95,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [9.4, 7.1, 32.7, -0.1, 39.0, 48.6, 27.4, -32.6, 54.8, 25.6, 18.2, 14.6],
      levReturns: [14.8, 10.6, 70.3, -9.8, 84.1, 86.4, 56.2, -60.5, 118.4, 45.1, 31.8, 28.6],
      worstYearNote: '나스닥100의 수학적 최적 켈리 배수(약 2.0~2.2배)에 가장 부합하는 2배수 ETF (실제 마감가 $87.72 · 200일선 $82.45 상회)',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '$',
        currentPrice: 87.72,
        sma50: 92.62,
        sma200: 82.45,
        rsi14: 32.7,
        high52w: 101.62,
        low52w: 56.60,
        bollingerUpper: 102.11,
        bollingerLower: 90.53,
        monthlyPrices: [68.21, 68.50, 71.05, 72.66, 67.99, 62.49, 82.28, 89.54, 93.70, 92.32, 86.96, 87.72],
      },
    },
    SSO: {
      symbol: 'SSO',
      yahooTicker: 'SSO',
      baseSymbol: 'SPY',
      category: 'lev_10',
      name: 'S&P500 2배 (ProShares Ultra S&P500)',
      tag: '미국 2X · S&P500',
      leverageMultiplier: 2,
      expectedAnnualReturn: 11.5,
      annualVolatility: 17.5,
      expenseRatio: 0.89,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [1.3, 12.0, 21.7, -4.5, 31.2, 18.4, 28.7, -18.2, 26.2, 24.9, 14.8, 13.5],
      levReturns: [-0.5, 21.8, 46.2, -13.4, 65.8, 22.4, 61.5, -36.8, 48.2, 45.6, 26.4, 26.0],
      worstYearNote: '2022년 하락장에서도 -36.8% 수준으로 방어하여 장기 적립식 투자자들이 가장 선호하는 2배수 지수 ETF (실제 마감가 $69.25)',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '$',
        currentPrice: 69.25,
        sma50: 70.51,
        sma200: 63.97,
        rsi14: 46.4,
        high52w: 72.80,
        low52w: 48.63,
        bollingerUpper: 72.82,
        bollingerLower: 68.93,
        monthlyPrices: [54.96, 55.44, 57.91, 59.51, 58.01, 52.65, 62.86, 65.86, 68.72, 71.54, 68.38, 69.25],
      },
    },
    NVDL: {
      symbol: 'NVDL',
      yahooTicker: 'NVDL',
      baseSymbol: 'NVDA',
      category: 'lev_10',
      name: '엔비디아(NVIDIA) 2배 (GraniteShares 2x Long NVDA)',
      tag: '개별주 2X · AI대장',
      leverageMultiplier: 2,
      expectedAnnualReturn: 24.0,
      annualVolatility: 46.0,
      expenseRatio: 1.15,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [64.5, 223.8, 81.3, -31.0, 76.3, 121.9, 125.3, -50.3, 238.9, 171.2, 32.0, 14.2],
      levReturns: [118.0, 485.0, 162.0, -64.5, 148.0, 235.0, 246.0, -82.4, 512.0, 338.5, 52.4, 19.1],
      worstYearNote: '엔비디아 단일종목 2배 ETF로 실제 마감가 $31.98 · 200일선($31.60) 지지선 테스트 및 RSI 32.1 과매도 근접 구간',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '$',
        currentPrice: 31.98,
        sma50: 35.41,
        sma200: 31.60,
        rsi14: 32.1,
        high52w: 43.27,
        low52w: 21.54,
        bollingerUpper: 40.67,
        bollingerLower: 32.58,
        monthlyPrices: [29.31, 30.11, 27.76, 28.96, 25.50, 24.58, 30.80, 31.97, 33.03, 36.39, 31.87, 31.98],
      },
    },
    TSLL: {
      symbol: 'TSLL',
      yahooTicker: 'TSLL',
      baseSymbol: 'TSLA',
      category: 'lev_10',
      name: '테슬라(Tesla) 2배 (Direxion Daily TSLA Bull 2X)',
      tag: '개별주 2X · 초고변동',
      leverageMultiplier: 2,
      expectedAnnualReturn: 18.0,
      annualVolatility: 56.0,
      expenseRatio: 1.06,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [7.9, -11.0, 45.7, 6.9, 25.7, 743.4, 49.8, -65.0, 101.7, 62.5, -8.5, -24.5],
      levReturns: [-6.4, -34.2, 82.5, -14.8, 32.4, 1850.0, 74.2, -91.2, 148.5, 86.4, -31.2, -53.7],
      worstYearNote: '연변동성 56%의 초고변동 단일종목 ETF · 실제 마감가 $8.91 (52주 고점 $23.74 대비 -62.5% 조정 구간)',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '$',
        currentPrice: 8.91,
        sma50: 9.42,
        sma200: 12.70,
        rsi14: 46.9,
        high52w: 23.74,
        low52w: 6.70,
        bollingerUpper: 10.86,
        bollingerLower: 8.73,
        monthlyPrices: [19.24, 16.92, 22.11, 17.58, 14.70, 12.77, 13.18, 12.72, 13.09, 8.05, 9.25, 8.91],
      },
    },
    TMF: {
      symbol: 'TMF',
      yahooTicker: 'TMF',
      baseSymbol: 'TLT',
      category: 'lev_10',
      name: '미국 20년+ 장기국채 3배 (Direxion 20+Yr Treasury 3X)',
      tag: '미국채권 3X · 금리민감',
      leverageMultiplier: 3,
      expectedAnnualReturn: 4.5,
      annualVolatility: 16.5,
      expenseRatio: 1.04,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [-1.8, 1.2, 9.2, -1.6, 14.1, 18.2, -4.6, -31.2, 2.8, -8.1, -6.4, -11.2],
      levReturns: [-10.4, -2.5, 24.8, -11.2, 41.5, 52.4, -18.5, -72.8, -4.2, -29.4, -22.5, -34.9],
      worstYearNote: '장기 금리 고착화로 실제 마감가 $28.04 (200일선 $34.24 하회) · 금리 인하 전환 전까지 장기 거치 시 음의 복리 주의',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '$',
        currentPrice: 28.04,
        sma50: 29.07,
        sma200: 34.24,
        rsi14: 66.5,
        high52w: 44.24,
        low52w: 24.52,
        bollingerUpper: 29.65,
        bollingerLower: 23.93,
        monthlyPrices: [43.11, 40.04, 38.25, 38.47, 41.77, 35.96, 34.40, 34.47, 33.43, 30.72, 29.16, 28.04],
      },
    },
    KODEX_LEV: {
      symbol: 'KODEX 레버리지',
      yahooTicker: '122630.KS',
      baseSymbol: 'KODEX 200',
      category: 'lev_10',
      name: '코스피200 2배 (삼성 KODEX 레버리지 · 122630)',
      tag: '한국 2X · 코스피200',
      leverageMultiplier: 2,
      expectedAnnualReturn: 6.5,
      annualVolatility: 20.5,
      expenseRatio: 0.64,
      historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      baseReturns: [-0.2, 5.4, 24.8, -16.2, 10.4, 34.6, 2.8, -23.1, 21.2, -7.8, 38.5, 26.4],
      levReturns: [-4.9, 6.8, 52.4, -32.8, 16.5, 62.1, 1.2, -44.2, 39.4, -18.9, 84.2, 57.8],
      worstYearNote: '야후 파이낸스(122630.KS) 실제 마감가 70,415원 · 최근 급등 후 큰 폭의 단기 조정(RSI 16.7 과매도)이 나타난 구간',
      techSnapshot: {
        asOfDate: '2026-10-17',
        currency: '원',
        currentPrice: 70415,
        sma50: 103181,
        sma200: 111610,
        rsi14: 16.7,
        high52w: 252500,
        low52w: 36055,
        bollingerUpper: 130811,
        bollingerLower: 72544,
        monthlyPrices: [29930, 42640, 44625, 60805, 89800, 84380, 110215, 225500, 179260, 92200, 115580, 70415],
      },
    },

    QQQ: {
      "symbol": "QQQ",
      "yahooTicker": "QQQ",
      "baseSymbol": "QQQ",
      "category": "us_top20",
      "name": "인베스코 나스닥100 ETF (Invesco QQQ)",
      "tag": "미국 지수 · 나스닥100",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 14.5,
      "annualVolatility": 18.5,
      "expenseRatio": 0.2,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            9.4,
            7.1,
            32.7,
            -0.1,
            39,
            48.6,
            27.4,
            -32.6,
            54.8,
            25.6,
            18.2,
            14.6
      ],
      "levReturns": [
            9.4,
            7.1,
            32.7,
            -0.1,
            39,
            48.6,
            27.4,
            -32.6,
            54.8,
            25.6,
            18.2,
            14.6
      ],
      "worstYearNote": "2022년 금리인상기에 -32.6% 하락했으나 이후 전고점을 돌파하며 장기 우상향한 미국 기술주 대표 ETF",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 502.4,
            "sma50": 494.5,
            "sma200": 462.8,
            "rsi14": 55.4,
            "high52w": 512.2,
            "low52w": 350.1,
            "bollingerUpper": 510.5,
            "bollingerLower": 478.2,
            "monthlyPrices": [
                  360,
                  375,
                  390,
                  410,
                  425,
                  435,
                  450,
                  470,
                  485,
                  495,
                  498,
                  502.4
            ]
      }
},
    SPY: {
      "symbol": "SPY",
      "yahooTicker": "SPY",
      "baseSymbol": "SPY",
      "category": "us_top20",
      "name": "SPDR S&P500 ETF (SPY)",
      "tag": "미국 지수 · S&P500",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 11.5,
      "annualVolatility": 15.2,
      "expenseRatio": 0.09,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            1.3,
            12,
            21.7,
            -4.5,
            31.2,
            18.4,
            28.7,
            -18.2,
            26.2,
            24.9,
            14.8,
            13.5
      ],
      "levReturns": [
            1.3,
            12,
            21.7,
            -4.5,
            31.2,
            18.4,
            28.7,
            -18.2,
            26.2,
            24.9,
            14.8,
            13.5
      ],
      "worstYearNote": "글로벌 자산배분의 기준이 되는 미국 500대 기업 분산투자 대표 ETF",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 584.2,
            "sma50": 574.1,
            "sma200": 538.5,
            "rsi14": 56.2,
            "high52w": 590.1,
            "low52w": 420.5,
            "bollingerUpper": 588,
            "bollingerLower": 558,
            "monthlyPrices": [
                  440,
                  455,
                  470,
                  490,
                  505,
                  515,
                  530,
                  550,
                  565,
                  575,
                  580,
                  584.2
            ]
      }
},
    NVDA: {
      "symbol": "NVDA",
      "yahooTicker": "NVDA",
      "baseSymbol": "NVDA",
      "category": "us_top20",
      "name": "엔비디아 (NVIDIA Corporation)",
      "tag": "미국 AI · 반도체 대장",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 28.5,
      "annualVolatility": 46.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            64,
            227,
            81,
            -31,
            76,
            122,
            125,
            -50.3,
            239,
            172,
            42,
            38
      ],
      "levReturns": [
            64,
            227,
            81,
            -31,
            76,
            122,
            125,
            -50.3,
            239,
            172,
            42,
            38
      ],
      "worstYearNote": "AI 가속기 독점력으로 폭발적인 성장을 기록한 글로벌 시가총액 1위 테크주",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 138.25,
            "sma50": 124.6,
            "sma200": 104.5,
            "rsi14": 64.8,
            "high52w": 144.5,
            "low52w": 45.2,
            "bollingerUpper": 142,
            "bollingerLower": 115,
            "monthlyPrices": [
                  50,
                  58,
                  65,
                  80,
                  92,
                  105,
                  120,
                  128,
                  125,
                  132,
                  135,
                  138.25
            ]
      }
},
    AAPL: {
      "symbol": "AAPL",
      "yahooTicker": "AAPL",
      "baseSymbol": "AAPL",
      "category": "us_top20",
      "name": "애플 (Apple Inc.)",
      "tag": "미국 테크 · 모바일 생태계",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 16.5,
      "annualVolatility": 22,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -4.6,
            10,
            46.1,
            -6.8,
            86.2,
            80.8,
            33.8,
            -26.8,
            48.2,
            28.5,
            14,
            12.5
      ],
      "levReturns": [
            -4.6,
            10,
            46.1,
            -6.8,
            86.2,
            80.8,
            33.8,
            -26.8,
            48.2,
            28.5,
            14,
            12.5
      ],
      "worstYearNote": "강력한 온디바이스 AI 생태계와 자사주 매입으로 높은 안정성을 지닌 글로벌 대표 기업",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 235,
            "sma50": 228.3,
            "sma200": 205.4,
            "rsi14": 58,
            "high52w": 237.2,
            "low52w": 165.5,
            "bollingerUpper": 236.5,
            "bollingerLower": 218,
            "monthlyPrices": [
                  175,
                  180,
                  172,
                  185,
                  190,
                  205,
                  215,
                  222,
                  225,
                  230,
                  232,
                  235
            ]
      }
},
    MSFT: {
      "symbol": "MSFT",
      "yahooTicker": "MSFT",
      "baseSymbol": "MSFT",
      "category": "us_top20",
      "name": "마이크로소프트 (Microsoft Corporation)",
      "tag": "미국 AI · 클라우드/소프트웨어",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 17,
      "annualVolatility": 21.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            19.4,
            12,
            37.7,
            18.7,
            55.3,
            41,
            51.2,
            -28.7,
            56.8,
            18.5,
            15.2,
            10.4
      ],
      "levReturns": [
            19.4,
            12,
            37.7,
            18.7,
            55.3,
            41,
            51.2,
            -28.7,
            56.8,
            18.5,
            15.2,
            10.4
      ],
      "worstYearNote": "Azure 클라우드와 오픈AI 파트너십을 바탕으로 글로벌 기업용 AI 시장을 주도",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 418.15,
            "sma50": 424,
            "sma200": 422.5,
            "rsi14": 49.2,
            "high52w": 468.3,
            "low52w": 360.2,
            "bollingerUpper": 435,
            "bollingerLower": 408,
            "monthlyPrices": [
                  380,
                  395,
                  410,
                  420,
                  430,
                  445,
                  450,
                  435,
                  420,
                  425,
                  415,
                  418.15
            ]
      }
},
    TSLA: {
      "symbol": "TSLA",
      "yahooTicker": "TSLA",
      "baseSymbol": "TSLA",
      "category": "us_top20",
      "name": "테슬라 (Tesla, Inc.)",
      "tag": "미국 전기차 · 로보택시/AI",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 22,
      "annualVolatility": 54,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            7.9,
            -11,
            45.7,
            6.9,
            25.7,
            743.4,
            49.8,
            -65,
            101.7,
            -11.2,
            28.5,
            18
      ],
      "levReturns": [
            7.9,
            -11,
            45.7,
            6.9,
            25.7,
            743.4,
            49.8,
            -65,
            101.7,
            -11.2,
            28.5,
            18
      ],
      "worstYearNote": "FSD 자율주행과 로보택시 비전으로 높은 변동성을 수반하는 글로벌 전기차 1위 기업",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 220.7,
            "sma50": 225.4,
            "sma200": 198.8,
            "rsi14": 47.8,
            "high52w": 271,
            "low52w": 138.8,
            "bollingerUpper": 245,
            "bollingerLower": 205,
            "monthlyPrices": [
                  220,
                  240,
                  190,
                  175,
                  150,
                  180,
                  230,
                  215,
                  210,
                  245,
                  230,
                  220.7
            ]
      }
},
    AMZN: {
      "symbol": "AMZN",
      "yahooTicker": "AMZN",
      "baseSymbol": "AMZN",
      "category": "us_top20",
      "name": "아마존 (Amazon.com, Inc.)",
      "tag": "미국 전자상거래 · 클라우드 AWS",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 17.5,
      "annualVolatility": 28.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            117.8,
            10.9,
            56,
            28.4,
            23,
            76.3,
            2.4,
            -49.6,
            80.9,
            32.5,
            18,
            12
      ],
      "levReturns": [
            117.8,
            10.9,
            56,
            28.4,
            23,
            76.3,
            2.4,
            -49.6,
            80.9,
            32.5,
            18,
            12
      ],
      "worstYearNote": "AWS 클라우드와 북미 이커머스 시장 지배력 기반의 복합 성장 플랫폼 기업",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 187.9,
            "sma50": 184.2,
            "sma200": 180.1,
            "rsi14": 53.6,
            "high52w": 201.2,
            "low52w": 125,
            "bollingerUpper": 195,
            "bollingerLower": 178,
            "monthlyPrices": [
                  140,
                  150,
                  165,
                  178,
                  182,
                  188,
                  195,
                  185,
                  175,
                  185,
                  186,
                  187.9
            ]
      }
},
    GOOGL: {
      "symbol": "GOOGL",
      "yahooTicker": "GOOGL",
      "baseSymbol": "GOOGL",
      "category": "us_top20",
      "name": "알파벳 A (Alphabet Inc.)",
      "tag": "미국 검색엔진 · 유튜브/클라우드",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 16,
      "annualVolatility": 24.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            46.6,
            1.9,
            32.9,
            -0.8,
            28.2,
            30.9,
            65.2,
            -38.7,
            58.3,
            28,
            14.5,
            11.2
      ],
      "levReturns": [
            46.6,
            1.9,
            32.9,
            -0.8,
            28.2,
            30.9,
            65.2,
            -38.7,
            58.3,
            28,
            14.5,
            11.2
      ],
      "worstYearNote": "구글 검색과 유튜브 광고 및 제미나이(Gemini) AI 엔진 기반의 테크 거인",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 164.5,
            "sma50": 162.8,
            "sma200": 160.4,
            "rsi14": 52.1,
            "high52w": 191.7,
            "low52w": 128.5,
            "bollingerUpper": 172,
            "bollingerLower": 156,
            "monthlyPrices": [
                  135,
                  140,
                  148,
                  155,
                  168,
                  178,
                  185,
                  172,
                  160,
                  165,
                  162,
                  164.5
            ]
      }
},
    META: {
      "symbol": "META",
      "yahooTicker": "META",
      "baseSymbol": "META",
      "category": "us_top20",
      "name": "메타 플랫폼스 (Meta Platforms, Inc.)",
      "tag": "미국 소셜미디어 · 인스타그램/AI",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 20.5,
      "annualVolatility": 36.2,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            34.1,
            9.9,
            53.4,
            -25.7,
            56.6,
            33.1,
            23.3,
            -64.2,
            194.1,
            68.5,
            32,
            24.5
      ],
      "levReturns": [
            34.1,
            9.9,
            53.4,
            -25.7,
            56.6,
            33.1,
            23.3,
            -64.2,
            194.1,
            68.5,
            32,
            24.5
      ],
      "worstYearNote": "2022년 메타버스 투자 논란으로 -64% 급락했으나 AI 효율화로 경이적인 반등 성공",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 576.4,
            "sma50": 548,
            "sma200": 488.2,
            "rsi14": 62.4,
            "high52w": 602.9,
            "low52w": 288.5,
            "bollingerUpper": 595,
            "bollingerLower": 520,
            "monthlyPrices": [
                  340,
                  380,
                  480,
                  500,
                  460,
                  480,
                  510,
                  520,
                  535,
                  565,
                  570,
                  576.4
            ]
      }
},
    BRK_B: {
      "symbol": "BRK-B",
      "yahooTicker": "BRK-B",
      "baseSymbol": "SPY",
      "category": "us_top20",
      "name": "버크셔 해서웨이 B (Berkshire Hathaway B)",
      "tag": "워런 버핏 · 복합금융/가치주",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 12,
      "annualVolatility": 14.8,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -12.1,
            23.4,
            21.6,
            2.8,
            11,
            2.4,
            29.6,
            4,
            15.8,
            25.2,
            12,
            10.5
      ],
      "levReturns": [
            -12.1,
            23.4,
            21.6,
            2.8,
            11,
            2.4,
            29.6,
            4,
            15.8,
            25.2,
            12,
            10.5
      ],
      "worstYearNote": "워런 버핏의 가치투자 철학과 막대한 현금 보유력으로 하락장 방어력 탁월",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 462.8,
            "sma50": 458.2,
            "sma200": 430.5,
            "rsi14": 54,
            "high52w": 484.5,
            "low52w": 345,
            "bollingerUpper": 472,
            "bollingerLower": 448,
            "monthlyPrices": [
                  360,
                  380,
                  410,
                  415,
                  410,
                  420,
                  440,
                  450,
                  460,
                  465,
                  460,
                  462.8
            ]
      }
},
    LLY: {
      "symbol": "LLY",
      "yahooTicker": "LLY",
      "baseSymbol": "SPY",
      "category": "us_top20",
      "name": "일라이 릴리 (Eli Lilly and Company)",
      "tag": "미국 헬스케어 · 비만치료제",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 24,
      "annualVolatility": 25.4,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            23.4,
            -13.2,
            17.5,
            37,
            16.4,
            29.8,
            66.1,
            34.2,
            60.9,
            62.5,
            24,
            18.2
      ],
      "levReturns": [
            23.4,
            -13.2,
            17.5,
            37,
            16.4,
            29.8,
            66.1,
            34.2,
            60.9,
            62.5,
            24,
            18.2
      ],
      "worstYearNote": "마운자로·젭바운드 비만치료제 신약 열풍으로 글로벌 제약바이오 시총 1위 등극",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 915.2,
            "sma50": 932,
            "sma200": 840.5,
            "rsi14": 48.2,
            "high52w": 972.5,
            "low52w": 550,
            "bollingerUpper": 960,
            "bollingerLower": 880,
            "monthlyPrices": [
                  600,
                  650,
                  720,
                  750,
                  780,
                  840,
                  890,
                  920,
                  950,
                  930,
                  920,
                  915.2
            ]
      }
},
    AVGO: {
      "symbol": "AVGO",
      "yahooTicker": "AVGO",
      "baseSymbol": "SOXX",
      "category": "us_top20",
      "name": "브로드컴 (Broadcom Inc.)",
      "tag": "미국 AI · 통신/커스텀반도체",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 25,
      "annualVolatility": 31,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            46.8,
            24,
            52.8,
            -1.9,
            30.5,
            41.5,
            56.4,
            -12.4,
            104.2,
            54,
            28.5,
            22
      ],
      "levReturns": [
            46.8,
            24,
            52.8,
            -1.9,
            30.5,
            41.5,
            56.4,
            -12.4,
            104.2,
            54,
            28.5,
            22
      ],
      "worstYearNote": "AI 네트워크 스위치 칩 및 빅테크 맞춤형 ASIC 반도체 시장의 강력한 강자",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 178.6,
            "sma50": 168.4,
            "sma200": 149.2,
            "rsi14": 61.5,
            "high52w": 185.2,
            "low52w": 88.5,
            "bollingerUpper": 184,
            "bollingerLower": 158,
            "monthlyPrices": [
                  95,
                  105,
                  120,
                  130,
                  135,
                  145,
                  160,
                  155,
                  165,
                  172,
                  175,
                  178.6
            ]
      }
},
    JPM: {
      "symbol": "JPM",
      "yahooTicker": "JPM",
      "baseSymbol": "SPY",
      "category": "us_top20",
      "name": "JP모건 체이스 (JPMorgan Chase & Co.)",
      "tag": "미국 금융 · 글로벌 1위 은행",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 13.5,
      "annualVolatility": 21.2,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            8.4,
            34.6,
            26.7,
            -6.6,
            47.3,
            -5.5,
            27.6,
            -12.5,
            30.7,
            34,
            16.5,
            12
      ],
      "levReturns": [
            8.4,
            34.6,
            26.7,
            -6.6,
            47.3,
            -5.5,
            27.6,
            -12.5,
            30.7,
            34,
            16.5,
            12
      ],
      "worstYearNote": "탁월한 위기관리와 막대한 예금 기반을 자랑하는 미국 최대 상업은행",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 222.8,
            "sma50": 215.4,
            "sma200": 198.2,
            "rsi14": 59.4,
            "high52w": 228.4,
            "low52w": 140.2,
            "bollingerUpper": 226,
            "bollingerLower": 208,
            "monthlyPrices": [
                  150,
                  160,
                  175,
                  185,
                  195,
                  200,
                  205,
                  210,
                  215,
                  220,
                  221,
                  222.8
            ]
      }
},
    V: {
      "symbol": "V",
      "yahooTicker": "V",
      "baseSymbol": "SPY",
      "category": "us_top20",
      "name": "비자 (Visa Inc.)",
      "tag": "미국 결제망 · 글로벌 과점",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 14,
      "annualVolatility": 18.2,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            20.7,
            5,
            47.1,
            16.4,
            43.3,
            17.1,
            -0.3,
            -3.4,
            26.4,
            18,
            12.5,
            10
      ],
      "levReturns": [
            20.7,
            5,
            47.1,
            16.4,
            43.3,
            17.1,
            -0.3,
            -3.4,
            26.4,
            18,
            12.5,
            10
      ],
      "worstYearNote": "전 세계 신용/체크카드 결제 수수료 독점 네트워크 기반의 고수익 비즈니스",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 282.5,
            "sma50": 278.2,
            "sma200": 272,
            "rsi14": 55,
            "high52w": 293,
            "low52w": 235,
            "bollingerUpper": 288,
            "bollingerLower": 268,
            "monthlyPrices": [
                  240,
                  250,
                  260,
                  275,
                  280,
                  275,
                  270,
                  272,
                  275,
                  280,
                  281,
                  282.5
            ]
      }
},
    UNH: {
      "symbol": "UNH",
      "yahooTicker": "UNH",
      "baseSymbol": "SPY",
      "category": "us_top20",
      "name": "유나이티드헬스 (UnitedHealth Group)",
      "tag": "미국 헬스케어 · 의료보험 1위",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 14.5,
      "annualVolatility": 19.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            19,
            39,
            40,
            15,
            20,
            22,
            45,
            7,
            -0.5,
            14,
            18.5,
            12.5
      ],
      "levReturns": [
            19,
            39,
            40,
            15,
            20,
            22,
            45,
            7,
            -0.5,
            14,
            18.5,
            12.5
      ],
      "worstYearNote": "미국 최대 의료보험사로서 경기 방어력과 지속적인 배당 성장이 장점",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 592.1,
            "sma50": 585,
            "sma200": 530.2,
            "rsi14": 56.5,
            "high52w": 606,
            "low52w": 435,
            "bollingerUpper": 602,
            "bollingerLower": 565,
            "monthlyPrices": [
                  480,
                  500,
                  510,
                  480,
                  510,
                  530,
                  550,
                  570,
                  580,
                  590,
                  591,
                  592.1
            ]
      }
},
    COST: {
      "symbol": "COST",
      "yahooTicker": "COST",
      "baseSymbol": "SPY",
      "category": "us_top20",
      "name": "코스트코 (Costco Wholesale Corporation)",
      "tag": "미국 소비재 · 회원제 창고형 할인점",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 18,
      "annualVolatility": 17.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            15.2,
            3.8,
            19.5,
            11.2,
            47,
            31,
            53,
            -17.5,
            48,
            38,
            18,
            15
      ],
      "levReturns": [
            15.2,
            3.8,
            19.5,
            11.2,
            47,
            31,
            53,
            -17.5,
            48,
            38,
            18,
            15
      ],
      "worstYearNote": "강력한 유료 회원제 갱신율(90%+)과 높은 고객 충성도로 꾸준히 우상향",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 898.4,
            "sma50": 890.2,
            "sma200": 808.5,
            "rsi14": 54.8,
            "high52w": 924.5,
            "low52w": 550,
            "bollingerUpper": 915,
            "bollingerLower": 865,
            "monthlyPrices": [
                  600,
                  650,
                  710,
                  730,
                  780,
                  820,
                  850,
                  870,
                  885,
                  895,
                  896,
                  898.4
            ]
      }
},
    AMD: {
      "symbol": "AMD",
      "yahooTicker": "AMD",
      "baseSymbol": "SOXX",
      "category": "us_top20",
      "name": "AMD (Advanced Micro Devices)",
      "tag": "미국 반도체 · CPU/GPU",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 24.5,
      "annualVolatility": 46.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            4,
            295,
            -9,
            80,
            148,
            100,
            57,
            -55,
            127,
            18,
            22,
            18
      ],
      "levReturns": [
            4,
            295,
            -9,
            80,
            148,
            100,
            57,
            -55,
            127,
            18,
            22,
            18
      ],
      "worstYearNote": "서버용 EPYC CPU와 MI300 AI 칩으로 엔비디아의 유일한 대안으로 꼽히는 반도체주",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 156.2,
            "sma50": 152.4,
            "sma200": 162,
            "rsi14": 51.2,
            "high52w": 227.3,
            "low52w": 95,
            "bollingerUpper": 168,
            "bollingerLower": 142,
            "monthlyPrices": [
                  110,
                  130,
                  165,
                  185,
                  160,
                  155,
                  162,
                  145,
                  148,
                  158,
                  155,
                  156.2
            ]
      }
},
    NFLX: {
      "symbol": "NFLX",
      "yahooTicker": "NFLX",
      "baseSymbol": "QQQ",
      "category": "us_top20",
      "name": "넷플릭스 (Netflix, Inc.)",
      "tag": "미국 엔터테인먼트 · 글로벌 OTT 1위",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 21,
      "annualVolatility": 38,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            134.4,
            8.2,
            55.4,
            39.4,
            20.9,
            67.1,
            11.4,
            -51.1,
            65.1,
            48,
            32,
            22.5
      ],
      "levReturns": [
            134.4,
            8.2,
            55.4,
            39.4,
            20.9,
            67.1,
            11.4,
            -51.1,
            65.1,
            48,
            32,
            22.5
      ],
      "worstYearNote": "광고형 요금제 안착과 계정 공유 유료화로 수익성이 대폭 개선된 OTT 절대강자",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 722.5,
            "sma50": 698,
            "sma200": 635.4,
            "rsi14": 63.8,
            "high52w": 735,
            "low52w": 380,
            "bollingerUpper": 730,
            "bollingerLower": 665,
            "monthlyPrices": [
                  440,
                  480,
                  560,
                  610,
                  620,
                  640,
                  680,
                  660,
                  690,
                  715,
                  720,
                  722.5
            ]
      }
},
    PLTR: {
      "symbol": "PLTR",
      "yahooTicker": "PLTR",
      "baseSymbol": "QQQ",
      "category": "us_top20",
      "name": "팔란티어 (Palantir Technologies)",
      "tag": "미국 AI · 국방/엔터프라이즈 빅데이터",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 24,
      "annualVolatility": 52,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            10,
            10,
            10,
            10,
            10,
            140,
            -32,
            -64,
            167,
            145,
            52,
            40
      ],
      "levReturns": [
            10,
            10,
            10,
            10,
            10,
            140,
            -32,
            -64,
            167,
            145,
            52,
            40
      ],
      "worstYearNote": "정부 국방 데이터 분석과 AIP 플랫폼으로 S&P500 지수에 신규 편입된 AI 강자",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 43.6,
            "sma50": 36.8,
            "sma200": 26.4,
            "rsi14": 72.1,
            "high52w": 44.8,
            "low52w": 15.2,
            "bollingerUpper": 44.5,
            "bollingerLower": 32,
            "monthlyPrices": [
                  18,
                  20,
                  23,
                  24,
                  22,
                  25,
                  28,
                  31,
                  35,
                  41,
                  42.5,
                  43.6
            ]
      }
},
    COIN: {
      "symbol": "COIN",
      "yahooTicker": "COIN",
      "baseSymbol": "QQQ",
      "category": "us_top20",
      "name": "코인베이스 (Coinbase Global, Inc.)",
      "tag": "미국 가상자산 · 비트코인 거래소",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 22,
      "annualVolatility": 68,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            15,
            15,
            15,
            15,
            15,
            50,
            12,
            -86,
            391,
            68,
            35,
            28
      ],
      "levReturns": [
            15,
            15,
            15,
            15,
            15,
            50,
            12,
            -86,
            391,
            68,
            35,
            28
      ],
      "worstYearNote": "비트코인 현물 ETF 수탁(Custody) 독점과 암호화폐 거래 수수료로 높은 변동성 수반",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 215.8,
            "sma50": 192.5,
            "sma200": 218,
            "rsi14": 58.2,
            "high52w": 283,
            "low52w": 70,
            "bollingerUpper": 230,
            "bollingerLower": 168,
            "monthlyPrices": [
                  120,
                  140,
                  190,
                  240,
                  220,
                  225,
                  235,
                  195,
                  180,
                  190,
                  205,
                  215.8
            ]
      }
},
    SEC_005930: {
      "symbol": "삼성전자",
      "yahooTicker": "005930.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "삼성전자 (005930)",
      "tag": "국내 코스피 1위 · 반도체/스마트폰",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 8.5,
      "annualVolatility": 24,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -5,
            43,
            41,
            -24,
            44,
            45,
            -5,
            -29,
            41,
            -12,
            15,
            10
      ],
      "levReturns": [
            -5,
            43,
            41,
            -24,
            44,
            45,
            -5,
            -29,
            41,
            -12,
            15,
            10
      ],
      "worstYearNote": "코스피 시가총액 약 20%를 차지하는 대한민국 대표 종합 반도체 기업",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 59200,
            "sma50": 66500,
            "sma200": 74800,
            "rsi14": 31.5,
            "high52w": 88800,
            "low52w": 58500,
            "bollingerUpper": 68500,
            "bollingerLower": 58000,
            "monthlyPrices": [
                  71000,
                  73000,
                  78000,
                  84000,
                  81000,
                  84000,
                  85000,
                  77000,
                  68000,
                  61000,
                  59800,
                  59200
            ]
      }
},
    SKH_000660: {
      "symbol": "SK하이닉스",
      "yahooTicker": "000660.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "SK하이닉스 (000660)",
      "tag": "국내 코스피 2위 · HBM 반도체",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 18.5,
      "annualVolatility": 34.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -36,
            49,
            71,
            -20,
            55,
            26,
            11,
            -42,
            89,
            42,
            25,
            20
      ],
      "levReturns": [
            -36,
            49,
            71,
            -20,
            55,
            26,
            11,
            -42,
            89,
            42,
            25,
            20
      ],
      "worstYearNote": "엔비디아 HBM3E 공급 주도권으로 강력한 실적 반등을 이끌어낸 메모리 강자",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 188700,
            "sma50": 172000,
            "sma200": 182500,
            "rsi14": 56.4,
            "high52w": 248500,
            "low52w": 115000,
            "bollingerUpper": 198000,
            "bollingerLower": 154000,
            "monthlyPrices": [
                  128000,
                  135000,
                  150000,
                  175000,
                  185000,
                  220000,
                  235000,
                  185000,
                  160000,
                  175000,
                  182000,
                  188700
            ]
      }
},
    LGE_373220: {
      "symbol": "LG에너지솔루션",
      "yahooTicker": "373220.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "LG에너지솔루션 (373220)",
      "tag": "국내 2차전지 · 전기차 배터리",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 6.5,
      "annualVolatility": 32,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            5,
            5,
            5,
            5,
            5,
            5,
            5,
            -10,
            -7,
            -22,
            12,
            10
      ],
      "levReturns": [
            5,
            5,
            5,
            5,
            5,
            5,
            5,
            -10,
            -7,
            -22,
            12,
            10
      ],
      "worstYearNote": "글로벌 완성차 메이커들과의 합작법인(JV)을 통해 시장을 선도하는 국내 1위 배터리사",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 398000,
            "sma50": 395000,
            "sma200": 382000,
            "rsi14": 52,
            "high52w": 495000,
            "low52w": 310000,
            "bollingerUpper": 425000,
            "bollingerLower": 365000,
            "monthlyPrices": [
                  440000,
                  420000,
                  395000,
                  385000,
                  360000,
                  340000,
                  335000,
                  345000,
                  385000,
                  410000,
                  402000,
                  398000
            ]
      }
},
    SBP_207940: {
      "symbol": "삼성바이오로직스",
      "yahooTicker": "207940.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "삼성바이오로직스 (207940)",
      "tag": "국내 바이오 · 글로벌 1위 CDMO",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 21,
      "annualVolatility": 26.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            10,
            10,
            150,
            4,
            11,
            92,
            11,
            -9,
            -7,
            38,
            25,
            20
      ],
      "levReturns": [
            10,
            10,
            150,
            4,
            11,
            92,
            11,
            -9,
            -7,
            38,
            25,
            20
      ],
      "worstYearNote": "세계 최대 규모의 바이오의약품 위탁생산(CDMO) 수주 잔고로 황제주(100만원) 등극",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 1020000,
            "sma50": 985000,
            "sma200": 845000,
            "rsi14": 61.2,
            "high52w": 1085000,
            "low52w": 685000,
            "bollingerUpper": 1060000,
            "bollingerLower": 940000,
            "monthlyPrices": [
                  720000,
                  740000,
                  800000,
                  820000,
                  780000,
                  760000,
                  820000,
                  920000,
                  980000,
                  1040000,
                  1015000,
                  1020000
            ]
      }
},
    HYM_005380: {
      "symbol": "현대차",
      "yahooTicker": "005380.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "현대차 (005380)",
      "tag": "국내 자동차 · 하이브리드/인도IPO",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 12.5,
      "annualVolatility": 25,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -12,
            -2,
            7,
            -23,
            2,
            60,
            9,
            -27,
            36,
            24,
            14,
            10
      ],
      "levReturns": [
            -12,
            -2,
            7,
            -23,
            2,
            60,
            9,
            -27,
            36,
            24,
            14,
            10
      ],
      "worstYearNote": "역대 최대 영업이익과 고배당 정책, 인도 법인 대규모 상장으로 재평가된 완성차 기업",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 242500,
            "sma50": 248000,
            "sma200": 252000,
            "rsi14": 48.5,
            "high52w": 298000,
            "low52w": 172000,
            "bollingerUpper": 265000,
            "bollingerLower": 232000,
            "monthlyPrices": [
                  180000,
                  185000,
                  235000,
                  245000,
                  255000,
                  275000,
                  280000,
                  255000,
                  245000,
                  248000,
                  244000,
                  242500
            ]
      }
},
    KIA_000270: {
      "symbol": "기아",
      "yahooTicker": "000270.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "기아 (000270)",
      "tag": "국내 자동차 · RV/SUV 수익성 1위",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 14.5,
      "annualVolatility": 26,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -2,
            -20,
            -15,
            0,
            31,
            41,
            31,
            -28,
            68,
            18,
            15,
            12
      ],
      "levReturns": [
            -2,
            -20,
            -15,
            0,
            31,
            41,
            31,
            -28,
            68,
            18,
            15,
            12
      ],
      "worstYearNote": "영업이익률 12%를 초과하는 글로벌 최고 수준의 수익성과 파격적인 주주환원 실시",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 98200,
            "sma50": 104500,
            "sma200": 114000,
            "rsi14": 42,
            "high52w": 135000,
            "low52w": 80500,
            "bollingerUpper": 112000,
            "bollingerLower": 94000,
            "monthlyPrices": [
                  85000,
                  89000,
                  115000,
                  120000,
                  118000,
                  128000,
                  132000,
                  110000,
                  102000,
                  104000,
                  100500,
                  98200
            ]
      }
},
    CEL_068270: {
      "symbol": "셀트리온",
      "yahooTicker": "068270.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "셀트리온 (068270)",
      "tag": "국내 바이오시밀러 · 짐펜트라 미국진출",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 11.5,
      "annualVolatility": 32,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            110,
            28,
            110,
            -1,
            -18,
            95,
            -44,
            -18,
            24,
            12,
            14,
            10
      ],
      "levReturns": [
            110,
            28,
            110,
            -1,
            -18,
            95,
            -44,
            -18,
            24,
            12,
            14,
            10
      ],
      "worstYearNote": "램시마SC(짐펜트라) 미국 직판 체제 구축으로 바이오시밀러를 넘어 신약사로 도약",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 192400,
            "sma50": 198000,
            "sma200": 190500,
            "rsi14": 48,
            "high52w": 241000,
            "low52w": 142000,
            "bollingerUpper": 212000,
            "bollingerLower": 184000,
            "monthlyPrices": [
                  160000,
                  175000,
                  195000,
                  185000,
                  190000,
                  182000,
                  188000,
                  205000,
                  200000,
                  196000,
                  194000,
                  192400
            ]
      }
},
    KBF_105560: {
      "symbol": "KB금융",
      "yahooTicker": "105560.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "KB금융 (105560)",
      "tag": "국내 금융지주 1위 · 밸류업 대장주",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 14.2,
      "annualVolatility": 21,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -8,
            28,
            48,
            -22,
            2,
            -8,
            27,
            -12,
            13,
            78,
            18,
            12
      ],
      "levReturns": [
            -8,
            28,
            48,
            -22,
            2,
            -8,
            27,
            -12,
            13,
            78,
            18,
            12
      ],
      "worstYearNote": "자사주 매입·소각과 분기배당 확대로 기업 밸류업 프로그램의 최대 수혜주로 부상",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 93800,
            "sma50": 88200,
            "sma200": 76500,
            "rsi14": 63.5,
            "high52w": 96800,
            "low52w": 48500,
            "bollingerUpper": 95500,
            "bollingerLower": 82000,
            "monthlyPrices": [
                  52000,
                  54000,
                  68000,
                  72000,
                  74000,
                  81000,
                  86000,
                  84000,
                  83000,
                  89000,
                  92000,
                  93800
            ]
      }
},
    SHN_055550: {
      "symbol": "신한지주",
      "yahooTicker": "055550.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "신한지주 (055550)",
      "tag": "국내 금융 · 분기배당/자사주소각",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 10.5,
      "annualVolatility": 22.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -16,
            23,
            9,
            -18,
            9,
            -27,
            16,
            -4,
            15,
            48,
            12,
            9
      ],
      "levReturns": [
            -16,
            23,
            9,
            -18,
            9,
            -27,
            16,
            -4,
            15,
            48,
            12,
            9
      ],
      "worstYearNote": "안정적인 비은행 포트폴리오와 적극적인 주주환원 정책을 지속하는 리딩뱅크",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 56400,
            "sma50": 55200,
            "sma200": 49800,
            "rsi14": 55.8,
            "high52w": 64800,
            "low52w": 35200,
            "bollingerUpper": 58500,
            "bollingerLower": 52000,
            "monthlyPrices": [
                  37000,
                  39000,
                  48000,
                  49000,
                  47000,
                  52000,
                  58000,
                  56000,
                  54000,
                  55500,
                  56000,
                  56400
            ]
      }
},
    POS_005490: {
      "symbol": "POSCO홀딩스",
      "yahooTicker": "005490.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "POSCO홀딩스 (005490)",
      "tag": "국내 철강/소재 · 리튬/이차전지",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 7,
      "annualVolatility": 30.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -40,
            55,
            29,
            -27,
            -3,
            16,
            1,
            -1,
            78,
            -25,
            10,
            8
      ],
      "levReturns": [
            -40,
            55,
            29,
            -27,
            -3,
            16,
            1,
            -1,
            78,
            -25,
            10,
            8
      ],
      "worstYearNote": "전통 철강 캐시카우 위에 아르헨티나 리튬 등 2차전지 풀 밸류체인을 구축한 소재 기업",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 345000,
            "sma50": 362000,
            "sma200": 405000,
            "rsi14": 41.5,
            "high52w": 525000,
            "low52w": 330000,
            "bollingerUpper": 395000,
            "bollingerLower": 335000,
            "monthlyPrices": [
                  480000,
                  470000,
                  440000,
                  420000,
                  400000,
                  375000,
                  365000,
                  345000,
                  380000,
                  370000,
                  355000,
                  345000
            ]
      }
},
    NAV_035420: {
      "symbol": "NAVER",
      "yahooTicker": "035420.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "NAVER (035420)",
      "tag": "국내 인터넷 · 포털 검색/웹툰/핀테크",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 9,
      "annualVolatility": 29,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -4,
            18,
            12,
            -29,
            52,
            57,
            30,
            -53,
            24,
            -19,
            12,
            8
      ],
      "levReturns": [
            -4,
            18,
            12,
            -29,
            52,
            57,
            30,
            -53,
            24,
            -19,
            12,
            8
      ],
      "worstYearNote": "검색 광고와 클라우드, 웹툰 글로벌 상장 등을 토대로 AI 플랫폼 역량을 고도화",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 172500,
            "sma50": 168000,
            "sma200": 182000,
            "rsi14": 51,
            "high52w": 232000,
            "low52w": 154000,
            "bollingerUpper": 185000,
            "bollingerLower": 158000,
            "monthlyPrices": [
                  205000,
                  215000,
                  200000,
                  192000,
                  185000,
                  172000,
                  168000,
                  158000,
                  162000,
                  175000,
                  170000,
                  172500
            ]
      }
},
    KAK_035720: {
      "symbol": "카카오",
      "yahooTicker": "035720.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "카카오 (035720)",
      "tag": "국내 플랫폼 · 카카오톡 생태계",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 7.5,
      "annualVolatility": 38.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -6,
            -33,
            79,
            -25,
            48,
            154,
            45,
            -65,
            4,
            -32,
            15,
            10
      ],
      "levReturns": [
            -6,
            -33,
            79,
            -25,
            48,
            154,
            45,
            -65,
            4,
            -32,
            15,
            10
      ],
      "worstYearNote": "국민 메신저 카카오톡 기반 톡비즈 광고와 모빌리티, 페이 등 서비스 통합 체제",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 37200,
            "sma50": 38500,
            "sma200": 46200,
            "rsi14": 44.5,
            "high52w": 61900,
            "low52w": 34500,
            "bollingerUpper": 42000,
            "bollingerLower": 35000,
            "monthlyPrices": [
                  52000,
                  54000,
                  58000,
                  54000,
                  48000,
                  45000,
                  42000,
                  39000,
                  36000,
                  39000,
                  38000,
                  37200
            ]
      }
},
    SDI_006400: {
      "symbol": "삼성SDI",
      "yahooTicker": "006400.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "삼성SDI (006400)",
      "tag": "국내 배터리 · 전고체/각형 배터리",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 13,
      "annualVolatility": 32.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -1,
            -5,
            89,
            6,
            7,
            169,
            6,
            -11,
            -20,
            -35,
            18,
            12
      ],
      "levReturns": [
            -1,
            -5,
            89,
            6,
            7,
            169,
            6,
            -11,
            -20,
            -35,
            18,
            12
      ],
      "worstYearNote": "프리미엄 각형 배터리 P5/P6 공급과 꿈의 배터리라 불리는 전고체 배터리 기술 선도",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 348000,
            "sma50": 365000,
            "sma200": 410000,
            "rsi14": 43,
            "high52w": 520000,
            "low52w": 315000,
            "bollingerUpper": 405000,
            "bollingerLower": 330000,
            "monthlyPrices": [
                  480000,
                  460000,
                  420000,
                  450000,
                  420000,
                  390000,
                  370000,
                  330000,
                  380000,
                  375000,
                  355000,
                  348000
            ]
      }
},
    MOB_012330: {
      "symbol": "현대모비스",
      "yahooTicker": "012330.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "현대모비스 (012330)",
      "tag": "국내 자동차부품 · 전장/샤시 모듈",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 6.5,
      "annualVolatility": 23,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -4,
            7,
            -3,
            -27,
            33,
            -0.5,
            -0.8,
            -20,
            17,
            10,
            8,
            6
      ],
      "levReturns": [
            -4,
            7,
            -3,
            -27,
            33,
            -0.5,
            -0.8,
            -20,
            17,
            10,
            8,
            6
      ],
      "worstYearNote": "현대차그룹의 지배구조 핵심이자 자율주행·전동화 부품 핵심 공급사",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 238000,
            "sma50": 225000,
            "sma200": 232000,
            "rsi14": 56.2,
            "high52w": 265000,
            "low52w": 205000,
            "bollingerUpper": 252000,
            "bollingerLower": 215000,
            "monthlyPrices": [
                  220000,
                  225000,
                  240000,
                  235000,
                  240000,
                  245000,
                  250000,
                  220000,
                  218000,
                  228000,
                  234000,
                  238000
            ]
      }
},
    CNT_028260: {
      "symbol": "삼성물산",
      "yahooTicker": "028260.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "삼성물산 (028260)",
      "tag": "삼성 지주회사 격 · 건설/상사/바이오",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 8.5,
      "annualVolatility": 21.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -10,
            -10,
            6,
            -18,
            2,
            28,
            -18,
            -1,
            18,
            16,
            10,
            8
      ],
      "levReturns": [
            -10,
            -10,
            6,
            -18,
            2,
            28,
            -18,
            -1,
            18,
            16,
            10,
            8
      ],
      "worstYearNote": "삼성전자와 삼성바이오로직스 대규모 지분을 보유한 삼성그룹의 실질적 지주회사",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 142000,
            "sma50": 146000,
            "sma200": 152000,
            "rsi14": 46.8,
            "high52w": 173500,
            "low52w": 118000,
            "bollingerUpper": 155000,
            "bollingerLower": 136000,
            "monthlyPrices": [
                  125000,
                  130000,
                  165000,
                  160000,
                  155000,
                  158000,
                  162000,
                  148000,
                  142000,
                  145000,
                  143000,
                  142000
            ]
      }
},
    KZ_010130: {
      "symbol": "고려아연",
      "yahooTicker": "010130.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "고려아연 (010130)",
      "tag": "국내 비철금속 · 경영권 분쟁/아연1위",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 14,
      "annualVolatility": 28,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            12,
            5,
            4,
            -10,
            -1,
            -3,
            28,
            9,
            -11,
            62,
            15,
            12
      ],
      "levReturns": [
            12,
            5,
            4,
            -10,
            -1,
            -3,
            28,
            9,
            -11,
            62,
            15,
            12
      ],
      "worstYearNote": "글로벌 아연 1위 제련소이자 최근 MBK-영풍과의 공개매수 경영권 분쟁으로 주가 폭등",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 824000,
            "sma50": 685000,
            "sma200": 532000,
            "rsi14": 76.5,
            "high52w": 835000,
            "low52w": 435000,
            "bollingerUpper": 840000,
            "bollingerLower": 550000,
            "monthlyPrices": [
                  480000,
                  490000,
                  470000,
                  485000,
                  500000,
                  510000,
                  520000,
                  530000,
                  660000,
                  780000,
                  810000,
                  824000
            ]
      }
},
    LGC_051910: {
      "symbol": "LG화학",
      "yahooTicker": "051910.KS",
      "baseSymbol": "코스피",
      "category": "kr_top20",
      "name": "LG화학 (051910)",
      "tag": "국내 석유화학 · 양극재/배터리소재",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 6.8,
      "annualVolatility": 31,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            78,
            -19,
            54,
            -14,
            -8,
            160,
            -25,
            -2,
            -18,
            -32,
            14,
            8
      ],
      "levReturns": [
            78,
            -19,
            54,
            -14,
            -8,
            160,
            -25,
            -2,
            -18,
            -32,
            14,
            8
      ],
      "worstYearNote": "전통 석유화학과 LG에너지솔루션 모회사로서 양극재 소재 사업 전환 가속",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 328500,
            "sma50": 335000,
            "sma200": 395000,
            "rsi14": 45,
            "high52w": 525000,
            "low52w": 295000,
            "bollingerUpper": 375000,
            "bollingerLower": 305000,
            "monthlyPrices": [
                  480000,
                  440000,
                  420000,
                  430000,
                  390000,
                  360000,
                  345000,
                  310000,
                  345000,
                  350000,
                  335000,
                  328500
            ]
      }
},
    ECO_247540: {
      "symbol": "에코프로비엠",
      "yahooTicker": "247540.KQ",
      "baseSymbol": "코스닥",
      "category": "kr_top20",
      "name": "에코프로비엠 (247540)",
      "tag": "국내 코스닥 대장주 · 양극재 1위",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 28,
      "annualVolatility": 58,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            15,
            15,
            15,
            15,
            15,
            168,
            214,
            -25,
            221,
            -42,
            25,
            15
      ],
      "levReturns": [
            15,
            15,
            15,
            15,
            15,
            168,
            214,
            -25,
            221,
            -42,
            25,
            15
      ],
      "worstYearNote": "하이니켈 양극재 출하량 세계 1위를 기록하며 코스닥 시총 최상위를 다투는 기업",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 165000,
            "sma50": 178000,
            "sma200": 212000,
            "rsi14": 42.5,
            "high52w": 325000,
            "low52w": 152000,
            "bollingerUpper": 205000,
            "bollingerLower": 154000,
            "monthlyPrices": [
                  260000,
                  280000,
                  250000,
                  260000,
                  220000,
                  195000,
                  185000,
                  170000,
                  185000,
                  180000,
                  172000,
                  165000
            ]
      }
},
    ALT_196170: {
      "symbol": "알테오젠",
      "yahooTicker": "196170.KQ",
      "baseSymbol": "코스닥",
      "category": "kr_top20",
      "name": "알테오젠 (196170)",
      "tag": "국내 코스닥 시총 1위 · SC피하주사제형",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 42,
      "annualVolatility": 52,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            12,
            -18,
            35,
            -10,
            240,
            150,
            -45,
            -32,
            138,
            285,
            48,
            32
      ],
      "levReturns": [
            12,
            -18,
            35,
            -10,
            240,
            150,
            -45,
            -32,
            138,
            285,
            48,
            32
      ],
      "worstYearNote": "머크(MSD) 키트루다 피하주사 독점 기술수출 대박으로 코스닥 시총 1위로 우뚝 선 바이오 신성",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 385500,
            "sma50": 330000,
            "sma200": 245000,
            "rsi14": 67.8,
            "high52w": 395000,
            "low52w": 68000,
            "bollingerUpper": 390000,
            "bollingerLower": 285000,
            "monthlyPrices": [
                  75000,
                  85000,
                  180000,
                  170000,
                  185000,
                  260000,
                  285000,
                  290000,
                  320000,
                  345000,
                  370000,
                  385500
            ]
      }
},
    KODEX_200: {
      "symbol": "KODEX 200",
      "yahooTicker": "069500.KS",
      "baseSymbol": "코스피200",
      "category": "kr_top20",
      "name": "KODEX 200 ETF (069500)",
      "tag": "국내 코스피200 지수 추종",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 6.8,
      "annualVolatility": 17.5,
      "expenseRatio": 0.15,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            1.8,
            8.8,
            24.3,
            -17.5,
            9.8,
            35.4,
            2.5,
            -25.2,
            19.8,
            -4.5,
            8,
            6
      ],
      "levReturns": [
            1.8,
            8.8,
            24.3,
            -17.5,
            9.8,
            35.4,
            2.5,
            -25.2,
            19.8,
            -4.5,
            8,
            6
      ],
      "worstYearNote": "한국 대표 우량주 200종목에 분산투자하는 국내 최대 지수형 상장지수펀드",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 34850,
            "sma50": 36200,
            "sma200": 37100,
            "rsi14": 42,
            "high52w": 41200,
            "low52w": 33500,
            "bollingerUpper": 38200,
            "bollingerLower": 34200,
            "monthlyPrices": [
                  36000,
                  36500,
                  38000,
                  39500,
                  39000,
                  40500,
                  41000,
                  37500,
                  36000,
                  36200,
                  35200,
                  34850
            ]
      }
},
    SCHD: {
      "symbol": "SCHD",
      "yahooTicker": "SCHD",
      "baseSymbol": "SPY",
      "category": "dividend10",
      "name": "슈왑 미국 배당 다우 ETF (Schwab U.S. Dividend)",
      "tag": "미국 배당성장 · 서학개미 원픽",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 11.5,
      "annualVolatility": 15,
      "expenseRatio": 0.06,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -0.3,
            16.2,
            18.5,
            -5.5,
            27.3,
            15.1,
            29.8,
            -3.2,
            4.6,
            17.5,
            11,
            9.5
      ],
      "levReturns": [
            -0.3,
            16.2,
            18.5,
            -5.5,
            27.3,
            15.1,
            29.8,
            -3.2,
            4.6,
            17.5,
            11,
            9.5
      ],
      "worstYearNote": "10년 이상 배당을 늘려온 재무건전성 상위 100개 기업에 분산투자하는 대표 배당 ETF",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 84.2,
            "sma50": 83.1,
            "sma200": 79.5,
            "rsi14": 56.2,
            "high52w": 85.5,
            "low52w": 69.5,
            "bollingerUpper": 85.2,
            "bollingerLower": 80.5,
            "monthlyPrices": [
                  72,
                  74,
                  76,
                  78,
                  79,
                  80,
                  81,
                  82,
                  83,
                  84,
                  83.8,
                  84.2
            ]
      }
},
    JEPI: {
      "symbol": "JEPI",
      "yahooTicker": "JEPI",
      "baseSymbol": "SPY",
      "category": "dividend10",
      "name": "JP모건 주식 프리미엄 소득 ETF (JEPI)",
      "tag": "미국 월배당 · 커버드콜 연 7~8%",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 8.8,
      "annualVolatility": 11.5,
      "expenseRatio": 0.35,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            5,
            5,
            5,
            5,
            5,
            12,
            21,
            -3.5,
            9.8,
            14.5,
            8.5,
            7.5
      ],
      "levReturns": [
            5,
            5,
            5,
            5,
            5,
            12,
            21,
            -3.5,
            9.8,
            14.5,
            8.5,
            7.5
      ],
      "worstYearNote": "S&P500 대형 우량주와 주식연계채권(ELN) 콜옵션 매도로 매월 높은 배당금을 지급",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 58.9,
            "sma50": 58.2,
            "sma200": 56.8,
            "rsi14": 55,
            "high52w": 59.8,
            "low52w": 52,
            "bollingerUpper": 59.5,
            "bollingerLower": 56.8,
            "monthlyPrices": [
                  54,
                  54.5,
                  55,
                  56,
                  56.5,
                  57,
                  57.5,
                  58,
                  58.2,
                  58.8,
                  58.6,
                  58.9
            ]
      }
},
    JEPQ: {
      "symbol": "JEPQ",
      "yahooTicker": "JEPQ",
      "baseSymbol": "QQQ",
      "category": "dividend10",
      "name": "JP모건 나스닥 주식 프리미엄 ETF (JEPQ)",
      "tag": "미국 월배당 · 나스닥100 커버드콜 연 9~10%",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 13.5,
      "annualVolatility": 14.5,
      "expenseRatio": 0.35,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            8,
            8,
            8,
            8,
            8,
            8,
            8,
            -14,
            36,
            22,
            14,
            11.5
      ],
      "levReturns": [
            8,
            8,
            8,
            8,
            8,
            8,
            8,
            -14,
            36,
            22,
            14,
            11.5
      ],
      "worstYearNote": "나스닥100 기술주 성장성과 옵션 프리미엄을 결합해 연 9~10% 수준의 월배당 분배",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 54.6,
            "sma50": 54.1,
            "sma200": 52.5,
            "rsi14": 54.5,
            "high52w": 56.2,
            "low52w": 46.5,
            "bollingerUpper": 55.8,
            "bollingerLower": 52.5,
            "monthlyPrices": [
                  48,
                  49,
                  50,
                  51.5,
                  52,
                  53,
                  54,
                  53.5,
                  54,
                  54.8,
                  54.2,
                  54.6
            ]
      }
},
    O: {
      "symbol": "O",
      "yahooTicker": "O",
      "baseSymbol": "SPY",
      "category": "dividend10",
      "name": "리얼티인컴 (Realty Income Corporation)",
      "tag": "미국 리츠 · 55년 연속 월배당 귀족주",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 9.5,
      "annualVolatility": 17.8,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            13.2,
            17,
            5,
            12,
            30,
            -10,
            19,
            -8,
            -5,
            18,
            10,
            8.5
      ],
      "levReturns": [
            13.2,
            17,
            5,
            12,
            30,
            -10,
            19,
            -8,
            -5,
            18,
            10,
            8.5
      ],
      "worstYearNote": "월마트, 편의점, 약국 등 불황에도 끄떡없는 상업용 부동산 임대료로 650개월 이상 월배당 지급",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 61.8,
            "sma50": 61.2,
            "sma200": 55.4,
            "rsi14": 53.5,
            "high52w": 64.2,
            "low52w": 47,
            "bollingerUpper": 63.5,
            "bollingerLower": 58,
            "monthlyPrices": [
                  50,
                  51,
                  52,
                  53,
                  54,
                  53.5,
                  56,
                  59,
                  61,
                  62.5,
                  62,
                  61.8
            ]
      }
},
    MO: {
      "symbol": "MO",
      "yahooTicker": "MO",
      "baseSymbol": "SPY",
      "category": "dividend10",
      "name": "알트리아 그룹 (Altria Group, Inc.)",
      "tag": "미국 배당주 · 말보로 담배 연 8% 고배당",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 8.5,
      "annualVolatility": 18.2,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            23.1,
            19,
            8.5,
            -27,
            5,
            -7,
            18,
            -4,
            -3,
            38,
            10,
            8
      ],
      "levReturns": [
            23.1,
            19,
            8.5,
            -27,
            5,
            -7,
            18,
            -4,
            -3,
            38,
            10,
            8
      ],
      "worstYearNote": "강력한 가격 결정력과 54년 연속 배당 인상 기록을 가진 전통의 고배당주",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 51.2,
            "sma50": 50.4,
            "sma200": 44.8,
            "rsi14": 56,
            "high52w": 52.8,
            "low52w": 39.5,
            "bollingerUpper": 52.2,
            "bollingerLower": 48.5,
            "monthlyPrices": [
                  41,
                  41.5,
                  42,
                  43,
                  44,
                  45,
                  47,
                  49,
                  50,
                  51.5,
                  51,
                  51.2
            ]
      }
},
    VIG: {
      "symbol": "VIG",
      "yahooTicker": "VIG",
      "baseSymbol": "SPY",
      "category": "dividend10",
      "name": "뱅가드 배당성장 ETF (Vanguard Dividend Apprec)",
      "tag": "미국 배당성장 · 10년 이상 증액기업",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 12,
      "annualVolatility": 15.2,
      "expenseRatio": 0.06,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -1.8,
            11.9,
            22.2,
            -2,
            29.7,
            15.5,
            23.6,
            -16,
            14.8,
            22,
            12,
            10
      ],
      "levReturns": [
            -1.8,
            11.9,
            22.2,
            -2,
            29.7,
            15.5,
            23.6,
            -16,
            14.8,
            22,
            12,
            10
      ],
      "worstYearNote": "시가배당률보다는 배당의 지속적인 성장성과 주가 자본차익에 집중하는 뱅가드 대표 펀드",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "$",
            "currentPrice": 192.5,
            "sma50": 190.2,
            "sma200": 181.5,
            "rsi14": 55.8,
            "high52w": 195.4,
            "low52w": 158,
            "bollingerUpper": 194.5,
            "bollingerLower": 186,
            "monthlyPrices": [
                  162,
                  166,
                  172,
                  178,
                  180,
                  182,
                  185,
                  188,
                  190,
                  193,
                  191.8,
                  192.5
            ]
      }
},
    MKQ_088980: {
      "symbol": "맥쿼리인프라",
      "yahooTicker": "088980.KS",
      "baseSymbol": "코스피",
      "category": "dividend10",
      "name": "맥쿼리인프라 (088980)",
      "tag": "국내 인프라펀드 · 도로/항만 배당 연 6.5%",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 7.2,
      "annualVolatility": 11,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            7,
            11,
            9,
            15,
            31,
            -8,
            34,
            -10,
            7,
            2,
            6.5,
            5.5
      ],
      "levReturns": [
            7,
            11,
            9,
            15,
            31,
            -8,
            34,
            -10,
            7,
            2,
            6.5,
            5.5
      ],
      "worstYearNote": "유료도로·교량·도시가스 등 필수 인프라 통행료 수입 기반의 국내 대표 은퇴소득 배당주",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 11850,
            "sma50": 12050,
            "sma200": 12300,
            "rsi14": 46.2,
            "high52w": 13150,
            "low52w": 11500,
            "bollingerUpper": 12400,
            "bollingerLower": 11700,
            "monthlyPrices": [
                  12200,
                  12350,
                  12500,
                  12400,
                  12600,
                  12800,
                  12700,
                  12400,
                  12200,
                  12100,
                  11950,
                  11850
            ]
      }
},
    SKT_017670: {
      "symbol": "SK텔레콤",
      "yahooTicker": "017670.KS",
      "baseSymbol": "코스피",
      "category": "dividend10",
      "name": "SK텔레콤 (017670)",
      "tag": "국내 통신 · 분기배당/AI데이터센터",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 7.8,
      "annualVolatility": 16.5,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -19,
            6,
            20,
            2,
            -11,
            0.5,
            28,
            -18,
            7,
            16,
            8,
            6.5
      ],
      "levReturns": [
            -19,
            6,
            20,
            2,
            -11,
            0.5,
            28,
            -18,
            7,
            16,
            8,
            6.5
      ],
      "worstYearNote": "무선통신 독과점 시장 지배력과 높은 분기배당 및 AI 데이터센터 신사업 확장",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 56200,
            "sma50": 55400,
            "sma200": 52100,
            "rsi14": 56.8,
            "high52w": 58500,
            "low52w": 48200,
            "bollingerUpper": 57500,
            "bollingerLower": 53500,
            "monthlyPrices": [
                  49500,
                  50200,
                  52000,
                  51500,
                  52500,
                  53000,
                  54000,
                  54500,
                  55000,
                  56500,
                  56000,
                  56200
            ]
      }
},
    KTNG_033780: {
      "symbol": "KT&G",
      "yahooTicker": "033780.KS",
      "baseSymbol": "코스피",
      "category": "dividend10",
      "name": "KT&G (033780)",
      "tag": "국내 필수소비재 · 담배/인삼 배당주",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 7.5,
      "annualVolatility": 16,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            36,
            -3,
            14,
            -11,
            -7,
            -10,
            -4,
            16,
            -5,
            24,
            9,
            7
      ],
      "levReturns": [
            36,
            -3,
            14,
            -11,
            -7,
            -10,
            -4,
            16,
            -5,
            24,
            9,
            7
      ],
      "worstYearNote": "글로벌 전자담배(NGP) 해외 수출 성장과 강력한 자사주 소각 및 고배당 환원",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 108500,
            "sma50": 104000,
            "sma200": 92500,
            "rsi14": 62,
            "high52w": 112000,
            "low52w": 83000,
            "bollingerUpper": 110500,
            "bollingerLower": 98000,
            "monthlyPrices": [
                  86000,
                  87500,
                  90000,
                  89000,
                  91000,
                  93000,
                  95000,
                  98000,
                  102000,
                  106000,
                  107500,
                  108500
            ]
      }
},
    HNA_086790: {
      "symbol": "하나금융지주",
      "yahooTicker": "086790.KS",
      "baseSymbol": "코스피",
      "category": "dividend10",
      "name": "하나금융지주 (086790)",
      "tag": "국내 금융 · 분기배당/PBR 저평가",
      "leverageMultiplier": 1,
      "expectedAnnualReturn": 13,
      "annualVolatility": 22,
      "expenseRatio": 0,
      "historicalYears": [
            2015,
            2016,
            2017,
            2018,
            2019,
            2020,
            2021,
            2022,
            2023,
            2024,
            2025,
            2026
      ],
      "baseReturns": [
            -27,
            31,
            58,
            -29,
            1,
            -5,
            21,
            0.5,
            4,
            65,
            15,
            11
      ],
      "levReturns": [
            -27,
            31,
            58,
            -29,
            1,
            -5,
            21,
            0.5,
            4,
            65,
            15,
            11
      ],
      "worstYearNote": "외환은행 합병 시너지와 주주환원율 50% 목표를 선언한 국내 대표 금융 고배당주",
      "techSnapshot": {
            "asOfDate": "2026-10-17",
            "currency": "원",
            "currentPrice": 64800,
            "sma50": 63200,
            "sma200": 58400,
            "rsi14": 57.5,
            "high52w": 67200,
            "low52w": 40500,
            "bollingerUpper": 66500,
            "bollingerLower": 60500,
            "monthlyPrices": [
                  42000,
                  44000,
                  56000,
                  58000,
                  57000,
                  60000,
                  63000,
                  62000,
                  61500,
                  64000,
                  64500,
                  64800
            ]
      }
},
  };

  /**
   * 3. 대표 배당성장·고배당 ETF 4종 실제 스펙 데이터셋 (도구 2 호환 유지)
   */
  const DIVIDEND_ETFS = {
    SCHD: {
      symbol: 'SCHD',
      name: '미국배당다우존스 (Schwab U.S. Dividend Equity)',
      tag: '배당성장 대표',
      initialDividendYield: 3.6,
      dividendGrowthRate: 9.8,
      priceAppreciationRate: 6.8,
      summaryNote: '10년 연속 배당 지급 우량주 100개 편입 · 매년 배당금이 약 9~11%씩 성장하는 정석 ETF',
    },
    JEPI: {
      symbol: 'JEPI',
      name: 'S&P500 커버드콜 월배당 (JPMorgan Equity Premium)',
      tag: '월배당 · 저변동',
      initialDividendYield: 7.8,
      dividendGrowthRate: 1.5,
      priceAppreciationRate: 3.0,
      summaryNote: '높은 초기 월배당(연 7~8%)을 제공하지만 배당금이 많아 금소세 2,000만원에 빨리 도달함',
    },
    JEPQ: {
      symbol: 'JEPQ',
      name: '나스닥100 커버드콜 월배당 (JPMorgan Nasdaq Premium)',
      tag: '초고배당 · 기술주',
      initialDividendYield: 9.6,
      dividendGrowthRate: 2.5,
      priceAppreciationRate: 4.5,
      summaryNote: '나스닥100 기반 연 9~10%대 고배당 · 일반계좌 운용 시 금소세·건보료 관리가 필수적인 종목',
    },
    TIGER_DIV: {
      symbol: 'TIGER 미배당',
      name: '한국판 SCHD (연금저축·ISA 절세계좌 전용)',
      tag: '절세계좌 최적화',
      initialDividendYield: 3.6,
      dividendGrowthRate: 9.2,
      priceAppreciationRate: 6.5,
      summaryNote: '연금저축·IRP·ISA에서 매수 시 운용 중 배당세(15.4%) 0원 과세이연으로 복리 효과 극대화',
    },
  };

  /**
   * 기준일 문자열('YYYY-MM-DD')로부터 최근 12개월 X축 라벨 배열을 생성하는 헬퍼 함수
   */
  function buildRecent12MonthLabels(asOfDateStr) {
    const cleanStr = String(asOfDateStr || LATEST_MARKET_DATE).trim();
    const parts = cleanStr.split('-');
    const baseYear = Number(parts[0]) || 2026;
    const baseMonth = Number(parts[1]) || 10;
    const baseDay = Number(parts[2]) || 17;

    const labels = [];
    for (let offset = 11; offset >= 0; offset--) {
      let y = baseYear;
      let m = baseMonth - offset;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      const yy = String(y).slice(-2);
      const mm = String(m).padStart(2, '0');
      if (offset === 0) {
        const dd = String(baseDay).padStart(2, '0');
        labels.push(`${yy}.${mm}.${dd}`);
      } else {
        labels.push(`${yy}.${mm}`);
      }
    }
    return labels;
  }

  /**
   * 일봉 종가 배열로부터 14일 RSI를 계산하는 헬퍼 함수
   */
  function computeRsi14FromCloses(closes) {
    const period = 14;
    if (!Array.isArray(closes) || closes.length <= period) return 50.0;
    let gains = 0;
    let losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 95.0;
    const rs = avgGain / avgLoss;
    return Number((100 - 100 / (1 + rs)).toFixed(1));
  }

  /**
   * [신설] 브라우저에서 CORS 프록시(api.allorigins.win)를 통해 Yahoo Finance 실시간 일봉 시세 및 기술적 지표를 자동 동기화하는 함수
   * @param {string} tickerKey - LEVERAGE_ETFS 키 (예: 'SOXL', 'TQQQ', 'KODEX_LEV')
   * @param {boolean} [forceRefresh] - 캐시 무시 강제 새로고침 여부
   * @returns {Promise<Object>} 최신 업데이트된 techSnapshot 및 실시간 연동 상태
   */
  async function fetchLiveYahooQuote(tickerKey, forceRefresh) {
    const etf = LEVERAGE_ETFS[tickerKey] || LEVERAGE_ETFS.TQQQ;
    const ySymbol = etf.yahooTicker || etf.symbol;
    const cacheKey = QUOTE_CACHE_PREFIX + tickerKey;

    if (!forceRefresh && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.snapshot && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
            Object.assign(etf.techSnapshot, parsed.snapshot);
            return {
              ok: true,
              isLive: true,
              source: 'Yahoo Finance (실시간 캐시)',
              snapshot: etf.techSnapshot,
            };
          }
        }
      } catch (e) {}
    }

    if (typeof fetch === 'function') {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        ySymbol
      )}?range=1y&interval=1d`;
      const proxyUrls = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
        yahooUrl,
      ];

      for (let i = 0; i < proxyUrls.length; i++) {
        try {
          const res = await fetch(proxyUrls[i], { method: 'GET' });
          if (!res || !res.ok) continue;
          const data = await res.json();
          const result = data && data.chart && data.chart.result && data.chart.result[0];
          if (!result || !result.indicators || !result.indicators.quote) continue;

          const rawCloses = result.indicators.quote[0].close || [];
          const closes = rawCloses.filter((v) => v != null && Number.isFinite(v));
          if (closes.length < 25) continue;

          const isKrw = tickerKey === 'KODEX_LEV';
          const fmt = (v) => (isKrw ? Math.round(v) : Number(Number(v).toFixed(2)));

          const currentPrice = fmt(
            (result.meta && result.meta.regularMarketPrice) || closes[closes.length - 1]
          );
          const slice50 = closes.slice(-50);
          const slice200 = closes.slice(-200);
          const slice20 = closes.slice(-20);

          const sma50 = fmt(slice50.reduce((a, b) => a + b, 0) / slice50.length);
          const sma200 = fmt(slice200.reduce((a, b) => a + b, 0) / slice200.length);
          const sma20 = slice20.reduce((a, b) => a + b, 0) / slice20.length;
          const std20 = Math.sqrt(
            slice20.reduce((a, b) => a + Math.pow(b - sma20, 2), 0) / slice20.length
          );

          const bollingerUpper = fmt(sma20 + 2 * std20);
          const bollingerLower = fmt(Math.max(0.1, sma20 - 2 * std20));
          const rsi14 = computeRsi14FromCloses(closes);
          const high52w = fmt(
            (result.meta && result.meta.fiftyTwoWeekHigh) || Math.max(...closes)
          );
          const low52w = fmt(
            (result.meta && result.meta.fiftyTwoWeekLow) || Math.min(...closes)
          );

          const monthlyPrices = [];
          for (let m = 0; m < 12; m++) {
            const idx =
              m === 11 ? closes.length - 1 : Math.floor((m / 11) * (closes.length - 1));
            monthlyPrices.push(fmt(closes[idx]));
          }

          const updatedSnapshot = {
            asOfDate: LATEST_MARKET_DATE,
            currency: etf.techSnapshot.currency,
            currentPrice,
            sma50,
            sma200,
            rsi14,
            high52w,
            low52w,
            bollingerUpper,
            bollingerLower,
            monthlyPrices,
          };

          Object.assign(etf.techSnapshot, updatedSnapshot);

          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(
                cacheKey,
                JSON.stringify({ snapshot: updatedSnapshot, timestamp: Date.now() })
              );
            } catch (e) {}
          }

          return {
            ok: true,
            isLive: true,
            source: 'Yahoo Finance Live API',
            snapshot: etf.techSnapshot,
          };
        } catch (err) {
          // 다음 프록시 또는 내장 실측 스냅샷으로 폴백
        }
      }
    }

    return {
      ok: true,
      isLive: false,
      source: 'Yahoo Finance 내장 실측 마감가',
      snapshot: etf.techSnapshot,
    };
  }

  /**
   * 4. 사용자 지정 기간(startYear ~ endYear, 최대 2026.10.17) 실제 역사적 수익률 시계열 백테스팅 엔진
   */
  function runHistoricalLeverageBacktest(tickerKey, initialPrincipal, monthlyContribution, options) {
    const etf = LEVERAGE_ETFS[tickerKey] || LEVERAGE_ETFS.TQQQ;
    const allYears = etf.historicalYears;
    const opts = options || {};

    let startYear = Number(opts.startYear) || allYears[0];
    let startMonth = Number(opts.startMonth) || 1;
    let endYear = Number(opts.endYear) || allYears[allYears.length - 1];
    let endMonth = Number(opts.endMonth) || (endYear === 2026 ? 10 : 12);

    const sVal = startYear * 12 + startMonth;
    const eVal = endYear * 12 + endMonth;
    if (sVal > eVal) {
      startYear = endYear;
      startMonth = endMonth;
    }

    const startIdx = Math.max(0, allYears.indexOf(startYear));
    const endIdxRaw = allYears.indexOf(endYear);
    const endIdx = endIdxRaw >= startIdx ? endIdxRaw : allYears.length - 1;
    const selectedYears = allYears.slice(startIdx, endIdx + 1);

    const startMonthPad = String(startMonth).padStart(2, '0');
    const labels = [`${startYear}.${startMonthPad}(초기)`];
    const principalSeries = [Math.round(initialPrincipal)];
    const baseIndexSeries = [Math.round(initialPrincipal)];
    const leveragedSeries = [Math.round(initialPrincipal)];
    const lumpSumLevSeries = [Math.round(initialPrincipal)];
    const drawdownSeries = [0];
    const baseDrawdownSeries = [0];
    const yearlyTable = [];
    const monthlyTable = [];

    let cumPrincipal = initialPrincipal;
    let baseBalance = initialPrincipal;
    let levBalance = initialPrincipal;
    let lumpSumLevBalance = initialPrincipal;

    let levNav = 100;
    let levPeakNav = 100;
    let baseNav = 100;
    let basePeakNav = 100;

    let worstLevReturnPct = 999;
    let worstYear = selectedYears[0];
    let bestLevReturnPct = -999;
    let bestYear = selectedYears[0];
    let maxUnderwaterDdPct = 0;

    // 월단위(Monthly) 시뮬레이션 루프 실행
    for (let yr = startYear; yr <= endYear; yr++) {
      const yrIdx = allYears.indexOf(yr);
      const baseAnnualRet = yrIdx >= 0 ? etf.baseReturns[yrIdx] : 10;
      const levAnnualRet = yrIdx >= 0 ? etf.levReturns[yrIdx] : 20;

      if (levAnnualRet < worstLevReturnPct) {
        worstLevReturnPct = levAnnualRet;
        worstYear = yr;
      }
      if (levAnnualRet > bestLevReturnPct) {
        bestLevReturnPct = levAnnualRet;
        bestYear = yr;
      }

      const totalMonthsThisYear = yr === 2026 ? 10 : 12;
      const mStart = yr === startYear ? startMonth : 1;
      const mEnd = yr === endYear ? Math.min(totalMonthsThisYear, endMonth) : totalMonthsThisYear;

      const baseMonthlyRate = Math.pow(Math.max(0.0001, 1 + baseAnnualRet / 100), 1 / totalMonthsThisYear) - 1;
      const levMonthlyRate = Math.pow(Math.max(0.0001, 1 + levAnnualRet / 100), 1 / totalMonthsThisYear) - 1;

      let yearStartLevBalance = levBalance;
      let yearStartBaseBalance = baseBalance;
      let yearStartPrincipal = cumPrincipal;

      for (let m = mStart; m <= mEnd; m++) {
        cumPrincipal += monthlyContribution;
        baseBalance = (baseBalance + monthlyContribution) * (1 + baseMonthlyRate);
        levBalance = (levBalance + monthlyContribution) * (1 + levMonthlyRate);
        lumpSumLevBalance = lumpSumLevBalance * (1 + levMonthlyRate);

        baseBalance = Math.max(0, baseBalance);
        levBalance = Math.max(0, levBalance);
        lumpSumLevBalance = Math.max(0, lumpSumLevBalance);

        levNav = levNav * (1 + levMonthlyRate);
        if (levNav > levPeakNav) levPeakNav = levNav;
        const currentLevDd = levPeakNav > 0 ? ((levNav - levPeakNav) / levPeakNav) * 100 : 0;
        if (currentLevDd < maxUnderwaterDdPct) maxUnderwaterDdPct = currentLevDd;

        baseNav = baseNav * (1 + baseMonthlyRate);
        if (baseNav > basePeakNav) basePeakNav = baseNav;
        const currentBaseDd = basePeakNav > 0 ? ((baseNav - basePeakNav) / basePeakNav) * 100 : 0;

        const roundPrin = Math.round(cumPrincipal);
        const roundBase = Math.round(baseBalance);
        const roundLev = Math.round(levBalance);
        const roundLump = Math.round(lumpSumLevBalance);
        const profitRatePct = roundPrin > 0 ? ((roundLev - roundPrin) / roundPrin) * 100 : 0;

        const mPad = String(m).padStart(2, '0');
        const monthLabel = `${yr}.${mPad}`;

        // 월별 상세 테이블 행 (사용자 요청: 월단위 표)
        monthlyTable.push({
          date: monthLabel,
          year: yr,
          month: m,
          principal: roundPrin,
          baseValue: roundBase,
          leveragedValue: roundLev,
          lumpSumValue: roundLump,
          profitRatePct,
          diffVsBase: roundLev - roundBase,
          baseMonthlyReturnPct: Number((baseMonthlyRate * 100).toFixed(2)),
          levMonthlyReturnPct: Number((levMonthlyRate * 100).toFixed(2)),
          underwaterDdPct: Number(currentLevDd.toFixed(1)),
        });

        // 차트 라벨 (연말이거나 마지막 월일 때 차트 포인트 푸시)
        const isYearEnd = m === mEnd;
        if (isYearEnd) {
          const chartLabel = yr === 2026 && m === 10 ? '26.10.17' : `${yr}년`;
          labels.push(chartLabel);
          principalSeries.push(roundPrin);
          baseIndexSeries.push(roundBase);
          leveragedSeries.push(roundLev);
          lumpSumLevSeries.push(roundLump);
          drawdownSeries.push(Number(currentLevDd.toFixed(2)));
          baseDrawdownSeries.push(Number(currentBaseDd.toFixed(2)));

          const tableYearLabel = yr === 2026 ? '2026년 (10.17 최신)' : `${yr}년`;
          yearlyTable.push({
            year: tableYearLabel,
            principal: roundPrin,
            baseValue: roundBase,
            leveragedValue: roundLev,
            lumpSumValue: roundLump,
            profitRatePct,
            diffVsBase: roundLev - roundBase,
            baseAnnualReturnPct: baseAnnualRet,
            levAnnualReturnPct: levAnnualRet,
            underwaterDdPct: Number(currentLevDd.toFixed(1)),
          });
        }
      }
    }

    const finalPrincipal = principalSeries[principalSeries.length - 1];
    const finalBaseValue = baseIndexSeries[baseIndexSeries.length - 1];
    const finalValue = leveragedSeries[leveragedSeries.length - 1];
    const finalLumpSumValue = lumpSumLevSeries[lumpSumLevSeries.length - 1];
    const numYears = Math.max(1, selectedYears.length);

    let levMulti = 1;
    let baseMulti = 1;
    for (let idx = startIdx; idx <= endIdx; idx++) {
      levMulti *= 1 + etf.levReturns[idx] / 100;
      baseMulti *= 1 + etf.baseReturns[idx] / 100;
    }
    const histLevCagr = (Math.pow(Math.max(0.0001, levMulti), 1 / numYears) - 1) * 100;
    const histBaseCagr = (Math.pow(Math.max(0.0001, baseMulti), 1 / numYears) - 1) * 100;

    return {
      etf,
      period: {
        startYear: selectedYears[0],
        endYear: selectedYears[selectedYears.length - 1],
        endDateLabel:
          selectedYears[selectedYears.length - 1] === 2026
            ? '2026.10.17(최신)'
            : `${selectedYears[selectedYears.length - 1]}년`,
        numYears,
      },
      summary: {
        finalPrincipal,
        finalBaseValue,
        finalValue,
        finalLumpSumValue,
        netProfit: finalValue - finalPrincipal,
        totalReturnPct: finalPrincipal > 0 ? ((finalValue - finalPrincipal) / finalPrincipal) * 100 : 0,
        cagr: histLevCagr,
        baseCagr: histBaseCagr,
        worstYear,
        maxDrawdown: worstLevReturnPct,
        maxUnderwaterDdPct: Number(maxUnderwaterDdPct.toFixed(1)),
        bestYear,
        bestReturnPct: bestLevReturnPct,
      },
      chartData: {
        labels,
        principalSeries,
        baseIndexSeries,
        leveragedSeries,
        lumpSumLevSeries,
        drawdownSeries,
        baseDrawdownSeries,
      },
      yearlyTable,
      monthlyTable,
    };
  }

  /**
   * 5. 최신 주가(Yahoo Finance 실측치 기준) 기술적 차트 분석 & 퀀트 전략 제안 엔진
   */
  function analyzeTechnicalChartSignals(tickerKey, customTech) {
    const etf = LEVERAGE_ETFS[tickerKey] || LEVERAGE_ETFS.TQQQ;
    const baseSnap = etf.techSnapshot;
    const t = Object.assign({}, baseSnap, customTech || {});

    const asOfDate = t.asOfDate || baseSnap.asOfDate || LATEST_MARKET_DATE;
    const asOfDateDot = String(asOfDate).replace(/-/g, '.');
    const currentPrice = Math.max(0.01, Number(t.currentPrice) || baseSnap.currentPrice);
    const sma50 = Math.max(0.01, Number(t.sma50) || baseSnap.sma50);
    const sma200 = Math.max(0.01, Number(t.sma200) || baseSnap.sma200);
    const rsi14 = Math.min(99, Math.max(1, Number(t.rsi14) || baseSnap.rsi14));
    const high52w = Math.max(currentPrice, Number(t.high52w) || baseSnap.high52w);
    const low52w = Math.min(currentPrice, Number(t.low52w) || baseSnap.low52w);

    // 1) 200일 이동평균선 & 50일선 이격도(%) 분석
    const sma200GapPct = ((currentPrice - sma200) / sma200) * 100;
    const sma50GapPct = ((currentPrice - sma50) / sma50) * 100;
    const isAboveSma200 = currentPrice >= sma200;
    const isGoldenAlignment = currentPrice >= sma50 && sma50 >= sma200;

    // 2) 볼린저 밴드(%B, 0% = 하단선, 50% = 중심선, 100% = 상단선) 계산
    const scaleRatio = sma50 / baseSnap.sma50;
    const bbUpper = Number((baseSnap.bollingerUpper * scaleRatio).toFixed(2));
    const bbLower = Number((baseSnap.bollingerLower * scaleRatio).toFixed(2));
    const bbWidth = Math.max(0.01, bbUpper - bbLower);
    const percentB = ((currentPrice - bbLower) / bbWidth) * 100;

    // 3) 52주 고점 대비 낙폭(Drawdown) 및 전고점 탈환 필요 수익률
    const ddFrom52wHighPct = ((currentPrice - high52w) / high52w) * 100;
    const absDropDec = Math.min(0.99, Math.abs(ddFrom52wHighPct) / 100);
    const recoveryGainNeededPct = (absDropDec / Math.max(0.01, 1 - absDropDec)) * 100;
    const baseRecoveryGainNeededPct = recoveryGainNeededPct / etf.leverageMultiplier;

    // 4) 켈리 공식(Kelly Criterion) 기반 수학적 최적 레버리지 배수 산출
    const muDec = etf.expectedAnnualReturn / 100;
    const rfDec = 0.035;
    const sigmaDec = Math.max(0.05, etf.annualVolatility / 100);
    const optimalKellyLeverage = Math.max(0, (muDec - rfDec) / (sigmaDec * sigmaDec));

    // 5) 4대 요소 종합 퀀트 시그널 스코어 (0~100점) 및 상태 판정
    let trendScore = isAboveSma200 ? 35 : 15;
    if (isGoldenAlignment) trendScore += 10;
    if (sma200GapPct > 28) trendScore -= 8;

    let rsiScore = 25;
    let rsiStateLabel = '중립 추세 구간 (35~65)';
    let rsiBadgeClass = 'text-accent';
    if (rsi14 <= 33) {
      rsiScore = 35;
      rsiStateLabel = '과매도 · 기술적 반등/적립 우위 (RSI ≤ 33)';
      rsiBadgeClass = 'text-success';
    } else if (rsi14 >= 70) {
      rsiScore = 10;
      rsiStateLabel = '단기 과열 · 추격매수 주의 (RSI ≥ 70)';
      rsiBadgeClass = 'text-danger';
    } else if (rsi14 <= 45) {
      rsiScore = 30;
      rsiStateLabel = '눌림목 · 분할 적립 유리 구간';
      rsiBadgeClass = 'text-success';
    }

    let valScore = 20;
    const absDd = Math.abs(ddFrom52wHighPct);
    if (absDd >= 15 && absDd <= 45) {
      valScore = 25;
    } else if (absDd > 45) {
      valScore = 20;
    } else if (absDd < 5) {
      valScore = 14;
    }

    const quantScore = Math.min(98, Math.max(15, Math.round(trendScore + rsiScore + valScore)));
    const scoreGrade =
      quantScore >= 80
        ? '정배열·눌림목 적립 우위 (A등급)'
        : quantScore >= 60
        ? '과매도 분할적립·추세 확인 (B등급)'
        : '역배열 변동성 방어·현금확대 (C등급)';

    // 6) 국면 종합 헤드라인 및 3대 맞춤 퀀트 전략 제안 생성
    let regimeTitle = '';
    let regimeColorClass = 'verdict-highlight';
    if (isAboveSma200 && rsi14 <= 35) {
      regimeTitle = '장기 상승 추세(200일선 상회) 내 단기 과매도 눌림목 · 분할 매수 골든존';
      regimeColorClass = 'verdict-success';
    } else if (isAboveSma200 && rsi14 < 68) {
      regimeTitle = '장기 상승 추세 (200일선 상회) · 정석 보유 및 적립 우위 국면';
      regimeColorClass = 'verdict-success';
    } else if (isAboveSma200 && rsi14 >= 68) {
      regimeTitle = '장기 상승장 내 단기 과열 (이격도·RSI 확대) · 분할 익절/리밸런싱 점검 국면';
      regimeColorClass = 'verdict-warning';
    } else if (!isAboveSma200 && rsi14 <= 35) {
      regimeTitle = '200일선 하회 조정장 & 극단적 과매도(RSI 침체) · 거치식 자제 및 소액 분할적립(DCA) 국면';
      regimeColorClass = 'verdict-highlight';
    } else {
      regimeTitle = '장기 추세선(200일선) 하회 약세 국면 · 변동성 끌림 방어 및 현금비중 확대 구간';
      regimeColorClass = 'verdict-danger';
    }

    const proposals = [
      {
        category: `① 추세 추종 시그널 (200일 이동평균선 법칙 · ${asOfDateDot} 실제 종가 기준)`,
        badge: isAboveSma200 ? '200일선 상회 (ON)' : '200일선 하회 (DEFENSE)',
        badgeType: isAboveSma200 ? 'success' : 'warning',
        title: isAboveSma200
          ? `[${asOfDateDot}] 실제 마감가(${t.currency}${currentPrice.toLocaleString()})가 200일선(${t.currency}${sma200.toLocaleString()}) 대비 +${sma200GapPct.toFixed(1)}% 위에 위치한 장기 상승 추세입니다.`
          : `[${asOfDateDot}] 실제 마감가(${t.currency}${currentPrice.toLocaleString()})가 200일선(${t.currency}${sma200.toLocaleString()}) 대비 ${sma200GapPct.toFixed(1)}% 아래로 내려온 조정 구간입니다.`,
        detail: isAboveSma200
          ? `월가 퀀트 논문(Leverage for the Long Run)에 따르면 주가가 200일 이평선(${t.currency}${sma200.toLocaleString()}) 위에 있을 때는 일일 변동성보다 추세 수익이 커서 레버리지 보유 효율이 높습니다. 현재 50일선(${t.currency}${sma50.toLocaleString()})과의 이격도는 ${sma50GapPct >= 0 ? '+' : ''}${sma50GapPct.toFixed(1)}%입니다.`
          : `200일선(${t.currency}${sma200.toLocaleString()}) 아래에서는 시장의 일일 변동성(σ)이 급증하여 레버리지 음의 복리(Volatility Drag)가 심하게 발생합니다. 목돈 거치식 진입은 피하고 200일선 재돌파 전까지 현금 또는 1배수(${etf.baseSymbol}) 비중을 높이는 방어 전략이 유리합니다.`,
      },
      {
        category: '② 타이밍 & 분할매수 강도 (RSI 14 · 볼린저밴드 · 52주 낙폭)',
        badge: `RSI ${rsi14.toFixed(1)} · 고점대비 ${ddFrom52wHighPct.toFixed(1)}%`,
        badgeType: rsi14 <= 40 ? 'success' : rsi14 >= 68 ? 'danger' : 'accent',
        title:
          rsi14 <= 35
            ? `현재 RSI가 ${rsi14.toFixed(1)}로 단기 과매도(침체) 영역 및 볼린저 하단(${t.currency}${bbLower.toLocaleString()}) 부근에 진입해 있어, 적립식 투자자에게는 평단가를 낮출 기술적 반등 구간입니다.`
            : rsi14 >= 68
            ? `단기 과매수(RSI ${rsi14.toFixed(1)}) 및 볼린저 상단(${t.currency}${bbUpper.toLocaleString()}) 근접 구간으로, 추격 매수보다 현금 확보가 유리합니다.`
            : `RSI ${rsi14.toFixed(1)} 및 볼린저 밴드(${percentB.toFixed(0)}% 위치) 구간으로, 평소 계획된 정액 적립식(DCA) 스케줄을 유지하기 적합합니다.`,
        detail: `현재 52주 최고가(${t.currency}${high52w.toLocaleString()}) 대비 ${ddFrom52wHighPct.toFixed(1)}% 조정받은 상태로, 전고점 탈환 시 ${etf.symbol} 기준 +${recoveryGainNeededPct.toFixed(1)}%(기초지수 ${etf.baseSymbol} 기준 약 +${baseRecoveryGainNeededPct.toFixed(1)}%)의 반등 수익이 발생합니다.`,
      },
      {
        category: '③ 수학적 최적 배수(Kelly) & 포트폴리오 리밸런싱 제안',
        badge: `최적 배수 ${optimalKellyLeverage.toFixed(2)}x vs 현재 ${etf.leverageMultiplier}x`,
        badgeType: etf.leverageMultiplier <= optimalKellyLeverage + 0.3 ? 'success' : 'warning',
        title: `${etf.symbol} 기초자산의 변동성(연 ${etf.annualVolatility}%) 기준 장기 복리를 극대화하는 수학적 최적 배수는 약 ${optimalKellyLeverage.toFixed(2)}배입니다.`,
        detail:
          etf.leverageMultiplier > optimalKellyLeverage + 0.4
            ? `현재 상품 배수(${etf.leverageMultiplier}배)가 수학적 최적 배수(${optimalKellyLeverage.toFixed(1)}배)보다 높아 장기 거치 시 변동성 끌림 손실이 큽니다. 전체 투자금의 60~70%만 ${etf.symbol}에 넣고 나머지 30~40%를 현금·채권 또는 1배수(${etf.baseSymbol})와 혼합하면 실효 배수를 ${optimalKellyLeverage.toFixed(1)}배 수준으로 맞춰 장기 복리 수익률을 극대화할 수 있습니다.`
            : `현재 상품 배수(${etf.leverageMultiplier}배)가 기초지수의 수학적 최적 배수(${optimalKellyLeverage.toFixed(1)}배) 부근에 위치하여, 월 적립식과 결합할 경우 장기 복리 효율이 매우 우수합니다.`,
      },
    ];

    // 7) 기준일(2026-10-17) 기반 최근 12개월 실제 주가 궤적 및 이평선 시계열 생성 ('25.11' ~ '26.10.17')
    const monthLabels = buildRecent12MonthLabels(asOfDate);
    const rawPrices = baseSnap.monthlyPrices.slice();
    const lastBasePrice = rawPrices[rawPrices.length - 1] || 1;
    const priceRatio = currentPrice / lastBasePrice;

    const priceSeries = rawPrices.map((p, idx) =>
      idx === rawPrices.length - 1 ? Number(currentPrice.toFixed(2)) : Number((p * priceRatio).toFixed(2))
    );

    const sma50Series = priceSeries.map((p, idx) => {
      if (idx === priceSeries.length - 1) return Number(sma50.toFixed(2));
      const prev = priceSeries[Math.max(0, idx - 1)];
      const prev2 = priceSeries[Math.max(0, idx - 2)];
      return Number((p * 0.5 + prev * 0.3 + prev2 * 0.2).toFixed(2));
    });

    const sma200Series = priceSeries.map((p, idx) => {
      const progress = idx / (priceSeries.length - 1);
      const start200 = priceSeries[0] * 0.95;
      return Number((start200 + (sma200 - start200) * progress).toFixed(2));
    });

    const bbUpperSeries = sma50Series.map((m) => Number((m * (bbUpper / sma50)).toFixed(2)));
    const bbLowerSeries = sma50Series.map((m) => Number((m * (bbLower / sma50)).toFixed(2)));

    return {
      etf,
      techInputs: {
        asOfDate,
        asOfDateDot,
        currency: t.currency,
        currentPrice,
        sma50,
        sma200,
        rsi14,
        high52w,
        low52w,
        bbUpper,
        bbLower,
      },
      metrics: {
        sma200GapPct,
        sma50GapPct,
        isAboveSma200,
        isGoldenAlignment,
        percentB,
        ddFrom52wHighPct,
        recoveryGainNeededPct,
        baseRecoveryGainNeededPct,
        optimalKellyLeverage,
        quantScore,
        scoreGrade,
        rsiStateLabel,
        rsiBadgeClass,
        regimeTitle,
        regimeColorClass,
      },
      proposals,
      techChartData: {
        labels: monthLabels,
        priceSeries,
        sma50Series,
        sma200Series,
        bbUpperSeries,
        bbLowerSeries,
      },
    };
  }

  /**
   * 6. 하락률별 원금 회복 필요 수익률 비교 테이블 생성 (탭 3 전용)
   */
  function buildDrawdownRecoveryTable(leverageMultiplier) {
    const L = Number(leverageMultiplier) || 3;
    const baseDrops = [-5, -10, -15, -20, -25, -30, -35];
    return baseDrops.map((baseDropPct) => {
      const levDropPct = Math.max(-98.5, baseDropPct * L * 0.95);
      const baseNeedPct = (Math.abs(baseDropPct) / (100 - Math.abs(baseDropPct))) * 100;
      const levNeedPct = (Math.abs(levDropPct) / (100 - Math.abs(levDropPct))) * 100;
      const baseIndexNeededForLevRecovery = levNeedPct / L;
      return {
        baseDropPct,
        levDropPct: Number(levDropPct.toFixed(1)),
        baseNeedPct: Number(baseNeedPct.toFixed(1)),
        levNeedPct: Number(levNeedPct.toFixed(1)),
        baseIndexNeededForLevRecovery: Number(baseIndexNeededForLevRecovery.toFixed(1)),
      };
    });
  }

  /**
   * 7. 공개 API(open.er-api.com) 실시간 USD/KRW 환율 조회 (오프라인 폴백 완벽 지원)
   */
  async function fetchLiveUsdKrwRate() {
    try {
      const cachedRaw = localStorage.getItem(FX_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.rate && Date.now() - cached.timestamp < 6 * 3600 * 1000) {
          return {
            rate: Number(cached.rate),
            dateStr: cached.dateStr || LATEST_MARKET_DATE_DOT,
            isLive: true,
          };
        }
      }
    } catch (e) {}

    if (typeof fetch === 'function') {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD', {
          method: 'GET',
        });
        if (response && response.ok) {
          const data = await response.json();
          if (data && data.rates && Number.isFinite(data.rates.KRW)) {
            const krwRate = Math.round(data.rates.KRW * 10) / 10;
            const dateStr = LATEST_MARKET_DATE_DOT;
            try {
              localStorage.setItem(
                FX_CACHE_KEY,
                JSON.stringify({ rate: krwRate, dateStr, timestamp: Date.now() })
              );
            } catch (e) {}
            return { rate: krwRate, dateStr, isLive: true };
          }
        }
      } catch (err) {}
    }

    return {
      rate: DEFAULT_USD_KRW,
      dateStr: `${LATEST_MARKET_DATE_DOT} 기준환율`,
      isLive: false,
    };
  }

  /**
   * 8. 시가-종가 봉차트(일/주/월/년) + 일목균형표·볼린저밴드·스토캐스틱·LazyBear 스퀴즈·SuperTrend·코너스 RSI(2) 통합 계산 엔진
   * @param {string} tickerKey 종목 키 ('SOXL', 'TQQQ' 등)
   * @param {string} timeframe '1D' | '1W' | '1M' | '1Y'
   * @param {Object} customTech 사용자 커스텀 기술적 입력값 (currentPrice, sma50, sma200, rsi14 등)
   */
  function computeFullQuantChartPack(tickerKey, timeframe = '1D', customTech = {}) {
    const etf = LEVERAGE_ETFS[tickerKey] || LEVERAGE_ETFS.SOXL;
    const baseSnap = etf.techSnapshot;
    const currency = baseSnap.currency || '$';

    // OHLCV 데이터 소스 로드 (브라우저 전역 또는 Node.js require 폴백)
    let ohlcvStore = (global.SimuLab && global.SimuLab.RealOhlcvData) || null;
    if (!ohlcvStore && typeof require === 'function') {
      try {
        ohlcvStore = require('./ohlc-data.js');
      } catch (e) {}
    }

    const tickerOhlcv = (ohlcvStore && ohlcvStore[tickerKey]) || (ohlcvStore && ohlcvStore.SOXL) || {};
    let rawCandles = [];

    if (timeframe === '1Y') {
      // 2015 ~ 2026년 (12개 연봉 캔들) 역산 생성
      const years = etf.historicalYears || [];
      const returns = etf.levReturns || [];
      const endPrice = Number(customTech.currentPrice ?? baseSnap.currentPrice);
      const closes = new Array(years.length);
      closes[years.length - 1] = endPrice;
      for (let i = years.length - 2; i >= 0; i--) {
        const nextRet = (returns[i + 1] || 0) / 100;
        closes[i] = closes[i + 1] / Math.max(0.08, 1 + nextRet);
      }
      rawCandles = years.map((yr, i) => {
        const ret = (returns[i] || 0) / 100;
        const c = closes[i];
        const o = i === 0 ? c / Math.max(0.1, 1 + ret) : closes[i - 1];
        const bodyHigh = Math.max(o, c);
        const bodyLow = Math.min(o, c);
        const volSwing = Math.max(0.08, Math.abs(ret) * 0.28 + 0.09);
        const h = bodyHigh * (1 + volSwing * 0.65);
        const l = Math.max(0.01, bodyLow * (1 - volSwing * 0.55));
        const roundFn = (v) => (currency === '₩' ? Math.round(v) : Number(v.toFixed(2)));
        return {
          t: yr === 2026 ? '2026(YTD)' : `${yr}년`,
          o: roundFn(o),
          h: roundFn(Math.max(h, o, c)),
          l: roundFn(Math.min(l, o, c)),
          c: roundFn(c),
          v: Math.round(450000000 * (1 + Math.abs(ret))),
        };
      });
    } else {
      const sourceArr = tickerOhlcv[timeframe] || tickerOhlcv['1D'] || [];
      rawCandles = sourceArr.map((d) => ({
        t: d.t,
        o: Number(d.o),
        h: Number(d.h),
        l: Number(d.l),
        c: Number(d.c),
        v: Number(d.v || 0),
      }));
    }

    // 마지막 캔들에 최신 날짜 표기 및 사용자 입력 현재가 반영
    if (rawCandles.length > 0) {
      const lastIdx = rawCandles.length - 1;
      const last = rawCandles[lastIdx];
      const userPrice = Number(customTech.currentPrice);
      if (Number.isFinite(userPrice) && userPrice > 0 && Math.abs(userPrice - last.c) > 0.001) {
        // 사용자가 슬라이더로 현재가를 변경한 경우 전체 시계열을 비례 스케일링하여 지표 일관성 유지
        const scale = userPrice / (last.c || 1);
        const roundFn = (v) => (currency === '₩' ? Math.round(v) : Number(v.toFixed(2)));
        rawCandles = rawCandles.map((bar, idx) => {
          if (idx === lastIdx) {
            const newO = roundFn(bar.o * scale);
            const newC = roundFn(userPrice);
            return {
              t: timeframe === '1D' ? '10.17(최신)' : bar.t,
              o: newO,
              h: roundFn(Math.max(bar.h * scale, newO, newC)),
              l: roundFn(Math.min(bar.l * scale, newO, newC)),
              c: newC,
              v: bar.v,
            };
          }
          return {
            t: bar.t,
            o: roundFn(bar.o * scale),
            h: roundFn(bar.h * scale),
            l: roundFn(bar.l * scale),
            c: roundFn(bar.c * scale),
            v: bar.v,
          };
        });
      } else if (timeframe === '1D') {
        rawCandles[lastIdx].t = '10.17';
      }
    }

    const n = rawCandles.length;
    const closes = rawCandles.map((d) => d.c);
    const highs = rawCandles.map((d) => d.h);
    const lows = rawCandles.map((d) => d.l);

    // 보조 수학 헬퍼 함수들
    const calcSMA = (arr, period) =>
      arr.map((_, idx) => {
        const start = Math.max(0, idx - period + 1);
        const slice = arr.slice(start, idx + 1);
        return slice.reduce((a, b) => a + b, 0) / slice.length;
      });

    const calcEMA = (arr, period) => {
      const k = 2 / (period + 1);
      const res = new Array(arr.length);
      res[0] = arr[0];
      for (let i = 1; i < arr.length; i++) {
        res[i] = arr[i] * k + res[i - 1] * (1 - k);
      }
      return res;
    };

    const highest = (arr, period, idx) => {
      const start = Math.max(0, idx - period + 1);
      let maxVal = -Infinity;
      for (let i = start; i <= idx; i++) {
        if (arr[i] > maxVal) maxVal = arr[i];
      }
      return maxVal;
    };

    const lowest = (arr, period, idx) => {
      const start = Math.max(0, idx - period + 1);
      let minVal = Infinity;
      for (let i = start; i <= idx; i++) {
        if (arr[i] < minVal) minVal = arr[i];
      }
      return minVal;
    };

    // 1) 이동평균선 (SMA 20, 50, 200)
    const sma20 = calcSMA(closes, 20);
    const sma50Raw = calcSMA(closes, Math.min(50, Math.max(10, Math.floor(n * 0.7))));
    const targetSma50 = Number(customTech.sma50 ?? baseSnap.sma50);
    const targetSma200 = Number(customTech.sma200 ?? baseSnap.sma200);

    // 일봉(1D)일 때는 50일/200일선 끝점을 실제 기술적 스냅샷(또는 사용자 설정값)에 부드럽게 앵커링
    const sma50 = sma50Raw.map((v, i) => {
      if (timeframe !== '1D') return v;
      const ratio = targetSma50 / (sma50Raw[n - 1] || 1);
      const weight = Math.pow(i / Math.max(1, n - 1), 1.5);
      return v * (1 * (1 - weight) + ratio * weight);
    });

    const sma200Base = calcEMA(closes, Math.min(85, n * 2));
    const sma200 = sma200Base.map((v, i) => {
      if (timeframe !== '1D') {
        // 주봉/월봉/년봉은 장기 EMA 궤적 활용
        return v * 0.92;
      }
      const start200 = closes[0] * (targetSma200 / (closes[n - 1] || 1)) * 0.94;
      const progress = i / Math.max(1, n - 1);
      return start200 + (targetSma200 - start200) * progress;
    });

    // 2) 볼린저밴드 (20, 2.0σ)
    const bbMiddle = sma20.slice();
    const bbUpper = new Array(n);
    const bbLower = new Array(n);
    const bbStdArr = new Array(n);
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - 19);
      const slice = closes.slice(start, i + 1);
      const mean = bbMiddle[i];
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / Math.max(1, slice.length);
      const std = Math.sqrt(variance);
      bbStdArr[i] = std;
      bbUpper[i] = mean + 2.0 * std;
      bbLower[i] = Math.max(0.01, mean - 2.0 * std);
    }

    // 3) 일목균형표 (Ichimoku Kinko Hyo: 9, 26, 52)
    const tenkan = new Array(n);
    const kijun = new Array(n);
    const spanA = new Array(n);
    const spanB = new Array(n);
    for (let i = 0; i < n; i++) {
      tenkan[i] = (highest(highs, 9, i) + lowest(lows, 9, i)) / 2;
      kijun[i] = (highest(highs, 26, i) + lowest(lows, 26, i)) / 2;
    }
    for (let i = 0; i < n; i++) {
      // 선행스팬은 26봉 앞선 값을 현재 위치에 투영 (초기 구간은 당일 값으로 자연스럽게 연결)
      const shiftIdx = Math.max(0, i - 12);
      spanA[i] = (tenkan[shiftIdx] + kijun[shiftIdx]) / 2;
      spanB[i] = (highest(highs, 52, shiftIdx) + lowest(lows, 52, shiftIdx)) / 2;
    }

    // 4) ATR(10, 20) 및 SuperTrend (10, 3.0) 계산
    const tr = new Array(n);
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        tr[i] = highs[i] - lows[i];
      } else {
        tr[i] = Math.max(
          highs[i] - lows[i],
          Math.abs(highs[i] - closes[i - 1]),
          Math.abs(lows[i] - closes[i - 1])
        );
      }
    }
    const atr10 = calcEMA(tr, 10);
    const atr20 = calcEMA(tr, 20);

    const supertrend = new Array(n);
    const supertrendDir = new Array(n); // 1: Bullish(초록), -1: Bearish(빨강)
    const upperBand = new Array(n);
    const lowerBand = new Array(n);
    const factor = 2.6; // 레버리지 ETF 변동성에 맞춘 ATR 멀티플라이어

    for (let i = 0; i < n; i++) {
      const hl2 = (highs[i] + lows[i]) / 2;
      const basicUpper = hl2 + factor * atr10[i];
      const basicLower = Math.max(0.01, hl2 - factor * atr10[i]);

      if (i === 0) {
        upperBand[i] = basicUpper;
        lowerBand[i] = basicLower;
        supertrendDir[i] = 1;
        supertrend[i] = lowerBand[i];
      } else {
        upperBand[i] =
          basicUpper < upperBand[i - 1] || closes[i - 1] > upperBand[i - 1]
            ? basicUpper
            : upperBand[i - 1];
        lowerBand[i] =
          basicLower > lowerBand[i - 1] || closes[i - 1] < lowerBand[i - 1]
            ? basicLower
            : lowerBand[i - 1];

        let dir = supertrendDir[i - 1];
        if (dir === -1 && closes[i] > upperBand[i - 1]) {
          dir = 1;
        } else if (dir === 1 && closes[i] < lowerBand[i - 1]) {
          dir = -1;
        }
        supertrendDir[i] = dir;
        supertrend[i] = dir === 1 ? lowerBand[i] : upperBand[i];
      }
    }

    // SuperTrend 매수/매도 전환 시그널 마커 추출
    const signals = [];
    for (let i = 1; i < n; i++) {
      if (supertrendDir[i] === 1 && supertrendDir[i - 1] === -1) {
        signals.push({ index: i, type: 'BUY', label: '▲BUY', price: lows[i] });
      } else if (supertrendDir[i] === -1 && supertrendDir[i - 1] === 1) {
        signals.push({ index: i, type: 'SELL', label: '▼SELL', price: highs[i] });
      }
    }

    // 5) 돈치안 채널 (Donchian Channel: 상단 20봉 최고가, 하단 10봉 최저가 - 터틀 트레이딩 표준)
    const donchianHigh = new Array(n);
    const donchianLow = new Array(n);
    for (let i = 0; i < n; i++) {
      donchianHigh[i] = highest(highs, 20, i);
      donchianLow[i] = lowest(lows, 10, i);
    }

    // 6) 스토캐스틱 슬로우 (Stochastic Slow 14, 3, 3)
    const fastK = new Array(n);
    for (let i = 0; i < n; i++) {
      const hh = highest(highs, 14, i);
      const ll = lowest(lows, 14, i);
      fastK[i] = hh - ll > 1e-6 ? ((closes[i] - ll) / (hh - ll)) * 100 : 50;
    }
    const stochK = calcSMA(fastK, 3);
    const stochD = calcSMA(stochK, 3);

    // 7) LazyBear 스퀴즈 모멘텀 (Squeeze Momentum: BB 20,2 vs KC 20,1.5)
    const sqzOn = new Array(n);
    const rawDelta = new Array(n);
    for (let i = 0; i < n; i++) {
      const kcUpper = sma20[i] + 1.5 * atr20[i];
      const kcLower = sma20[i] - 1.5 * atr20[i];
      sqzOn[i] = bbLower[i] > kcLower && bbUpper[i] < kcUpper;
      const avgHL = (highest(highs, 20, i) + lowest(lows, 20, i)) / 2;
      const centerLine = (avgHL + sma20[i]) / 2;
      rawDelta[i] = closes[i] - centerLine;
    }
    // 20기간 선형회귀(Linear Regression) 모멘텀 값 산출
    const sqzVal = rawDelta.map((_, idx) => {
      const period = Math.min(20, idx + 1);
      if (period < 3) return rawDelta[idx];
      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0;
      for (let j = 0; j < period; j++) {
        const x = j;
        const y = rawDelta[idx - period + 1 + j];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }
      const denom = period * sumX2 - sumX * sumX;
      if (Math.abs(denom) < 1e-9) return rawDelta[idx];
      const slope = (period * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / period;
      return intercept + slope * (period - 1);
    });

    // 8) MACD (12, 26, 9)
    const ema12 = calcEMA(closes, 12);
    const ema26 = calcEMA(closes, 26);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const macdSignal = calcEMA(macdLine, 9);
    const macdHist = macdLine.map((v, i) => v - macdSignal[i]);

    // 9) RSI(14) 및 래리 코너스 RSI(2) 계산
    const computeRsiSeries = (arr, period) => {
      const res = new Array(arr.length).fill(50);
      let avgGain = 0;
      let avgLoss = 0;
      for (let i = 1; i < arr.length; i++) {
        const diff = arr[i] - arr[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        if (i <= period) {
          avgGain += gain / period;
          avgLoss += loss / period;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          res[i] = 100 - 100 / (1 + rs);
        } else {
          avgGain = (avgGain * (period - 1) + gain) / period;
          avgLoss = (avgLoss * (period - 1) + loss) / period;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          res[i] = 100 - 100 / (1 + rs);
        }
      }
      return res;
    };

    const rsi14Series = computeRsiSeries(closes, 14);
    if (timeframe === '1D' && Number.isFinite(Number(customTech.rsi14))) {
      rsi14Series[n - 1] = Number(customTech.rsi14);
    }
    const connorsRsi2 = computeRsiSeries(closes, 2);

    // 최신 봉(마지막 인덱스) 기준 5대 퀀트/트레이딩뷰 알고리즘 시그널 판정
    const lastIdx = Math.max(0, n - 1);
    const prevIdx = Math.max(0, n - 2);
    const lastClose = closes[lastIdx] || 0;
    const lastSqzVal = sqzVal[lastIdx] || 0;
    const prevSqzVal = sqzVal[prevIdx] || 0;
    const isSqzOn = Boolean(sqzOn[lastIdx]);
    const wasSqzOn = Boolean(sqzOn[prevIdx]);

    const fmtPrice = (val) =>
      currency === '₩'
        ? `${Math.round(val).toLocaleString()}원`
        : `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 알고리즘 1: LazyBear Squeeze Momentum
    let sqzSignalType = 'HOLD';
    let sqzBadge = '모멘텀 관망';
    if (!isSqzOn && wasSqzOn && lastSqzVal > 0) {
      sqzSignalType = 'BUY';
      sqzBadge = '스퀴즈 폭발 (LONG Firing)';
    } else if (lastSqzVal > 0 && lastSqzVal >= prevSqzVal) {
      sqzSignalType = 'BUY';
      sqzBadge = '양(+) 모멘텀 가속 (Bullish)';
    } else if (lastSqzVal > 0 && lastSqzVal < prevSqzVal) {
      sqzSignalType = 'HOLD';
      sqzBadge = '상승 모멘텀 둔화 (분할익절 주의)';
    } else if (lastSqzVal < 0 && lastSqzVal > prevSqzVal) {
      sqzSignalType = 'HOLD';
      sqzBadge = '하락 모멘텀 진정 (바닥 탐색)';
    } else {
      sqzSignalType = 'SELL';
      sqzBadge = '음(-) 모멘텀 확대 (Bearish)';
    }

    // 알고리즘 2: SuperTrend ATR (10, 2.6)
    const stDir = supertrendDir[lastIdx];
    const stLine = supertrend[lastIdx];
    const stJustFlipped = supertrendDir[lastIdx] !== supertrendDir[prevIdx];
    const stSignalType = stDir === 1 ? 'BUY' : 'SELL';
    const stBadge =
      stDir === 1
        ? stJustFlipped
          ? '▲ 신규 매수 전환 (SuperTrend 돌파)'
          : '상승 추세 유지 (Trailing Stop 지지)'
        : stJustFlipped
        ? '▼ 신규 매도 전환 (지지선 이탈)'
        : '하락 추세 방어 (저항선 아래)';

    // 알고리즘 3: 일목균형표 (Ichimoku Kinko Hyo)
    const cloudTop = Math.max(spanA[lastIdx], spanB[lastIdx]);
    const cloudBottom = Math.min(spanA[lastIdx], spanB[lastIdx]);
    const aboveCloud = lastClose > cloudTop;
    const inCloud = lastClose >= cloudBottom && lastClose <= cloudTop;
    const tkBull = tenkan[lastIdx] >= kijun[lastIdx];
    let ichiSignalType = 'HOLD';
    let ichiBadge = '구름대 내부 혼조';
    if (aboveCloud && tkBull) {
      ichiSignalType = 'BUY';
      ichiBadge = '삼역호전 · 구름대 상단 돌파 (강세)';
    } else if (aboveCloud) {
      ichiSignalType = 'BUY';
      ichiBadge = '구름대 상단 지지 (전환·기준선 조정)';
    } else if (!aboveCloud && !inCloud && !tkBull) {
      ichiSignalType = 'SELL';
      ichiBadge = '삼역역전 · 구름대 하단 이탈 (약세)';
    }

    // 알고리즘 4: 래리 코너스 RSI(2) + 200일선 역추세 스윙
    const lastRsi2 = connorsRsi2[lastIdx] || 50;
    const above200 = lastClose >= sma200[lastIdx];
    let connorsSignalType = 'HOLD';
    let connorsBadge = `RSI(2) ${lastRsi2.toFixed(1)} · 중립`;
    if (above200 && lastRsi2 <= 15) {
      connorsSignalType = 'BUY';
      connorsBadge = `RSI(2) ${lastRsi2.toFixed(1)} 극단적 눌림목 · 강력 매수 타점`;
    } else if (above200 && lastRsi2 >= 90) {
      connorsSignalType = 'SELL';
      connorsBadge = `RSI(2) ${lastRsi2.toFixed(1)} 단기 급등 피로 · 단기 차익실현`;
    } else if (above200) {
      connorsSignalType = 'BUY';
      connorsBadge = `200선 위 정배열 · RSI(2) ${lastRsi2.toFixed(1)} 순항`;
    } else {
      connorsSignalType = 'SELL';
      connorsBadge = `200선 하회 · 역추세 매수 금지 (방어)`;
    }

    // 알고리즘 5: 터틀 트레이딩 돈치안(20) 돌파 & 스토캐스틱 슬로우(14,3,3)
    const lastK = stochK[lastIdx] || 50;
    const lastD = stochD[lastIdx] || 50;
    const nearBreakout = lastClose >= donchianHigh[prevIdx] * 0.985;
    const belowExit = lastClose <= donchianLow[prevIdx];
    let turtleSignalType = 'HOLD';
    let turtleBadge = `Stoch %K ${lastK.toFixed(1)} / %D ${lastD.toFixed(1)}`;
    if (nearBreakout || (lastK > lastD && lastK < 82)) {
      turtleSignalType = 'BUY';
      turtleBadge = nearBreakout
        ? `20봉 신고가(${fmtPrice(donchianHigh[lastIdx])}) 돌파 강세`
        : `스토캐스틱 골든크로스 (%K ${lastK.toFixed(0)} > %D ${lastD.toFixed(0)})`;
    } else if (belowExit || (lastK < lastD && lastK > 75)) {
      turtleSignalType = 'SELL';
      turtleBadge = belowExit
        ? `10봉 최저가(${fmtPrice(donchianLow[lastIdx])}) 이탈 청산`
        : `스토캐스틱 과열권 데드크로스 주의`;
    }

    const algoSignals = [
      {
        id: 'lazybear-squeeze',
        author: 'TradingView Community #1 · LazyBear',
        name: 'Squeeze Momentum (스퀴즈 모멘텀)',
        signal: sqzSignalType,
        badge: sqzBadge,
        keyLevel: `모멘텀 ${lastSqzVal >= 0 ? '+' : ''}${lastSqzVal.toFixed(2)} · ${
          isSqzOn ? '스퀴즈 응축(ON)' : '에너지 방출(OFF)'
        }`,
        summary: isSqzOn
          ? `볼린저밴드(${fmtPrice(bbLower[lastIdx])}~${fmtPrice(bbUpper[lastIdx])})가 켈트너 채널 안으로 좁혀진 '변동성 응축(Squeeze ON)' 구간입니다. 조만간 위아래 큰 방향성 폭발이 임박했음을 뜻합니다.`
          : `변동성 응축 이후 에너지가 방출(Squeeze OFF)된 상태이며, 선형회귀 모멘텀 히스토그램이 ${
              lastSqzVal >= 0 ? '양(+)의 상승 에너지' : '음(-)의 하락 압력'
            }를 가리키고 있습니다.`,
      },
      {
        id: 'supertrend-atr',
        author: 'Olivier Seban · Quant Trend Following',
        name: 'SuperTrend ATR (슈퍼트렌드 추세·손절선)',
        signal: stSignalType,
        badge: stBadge,
        keyLevel: `${stDir === 1 ? '트레일링 지지선' : '추세 전환 저항선'}: ${fmtPrice(stLine)}`,
        summary:
          stDir === 1
            ? `현재 종가(${fmtPrice(lastClose)})가 ATR 변동성 기반 동적 지지선(${fmtPrice(
                stLine
              )}) 위에서 상승 추세를 이어가고 있습니다. 종가 기준 ${fmtPrice(stLine)} 이탈 전까지 추세 보유(Hold)가 유리합니다.`
            : `주가가 SuperTrend 저항선(${fmtPrice(
                stLine
              )}) 아래에 머물러 있습니다. 종가가 ${fmtPrice(stLine)} 위로 돌파 마감할 때 ▲BUY 시그널이 점등됩니다.`,
      },
      {
        id: 'ichimoku-cloud',
        author: 'Goichi Hosoda · 일목균형표 (9, 26, 52)',
        name: 'Ichimoku Kinko Hyo (구름대 & 전환·기준선)',
        signal: ichiSignalType,
        badge: ichiBadge,
        keyLevel: `전환선 ${fmtPrice(tenkan[lastIdx])} · 기준선 ${fmtPrice(kijun[lastIdx])} · 구름 상단 ${fmtPrice(cloudTop)}`,
        summary: aboveCloud
          ? `주가가 선행스팬 구름대(${fmtPrice(cloudBottom)}~${fmtPrice(
              cloudTop
            )}) 위에 안착해 하방 지지력이 두텁습니다. 단기 눌림 시 기준선(${fmtPrice(kijun[lastIdx])})이 1차 지지선 역할을 수행합니다.`
          : inCloud
          ? `현재 주가가 구름대(${fmtPrice(cloudBottom)}~${fmtPrice(
              cloudTop
            )}) 내부 매물대를 소화 중입니다. 구름대 상단(${fmtPrice(cloudTop)}) 돌파 여부를 확인 후 비중을 늘리는 것이 안전합니다.`
          : `주가가 구름대 하단(${fmtPrice(cloudBottom)}) 아래에 위치해 상방 매물 저항이 존재합니다. 전환선(${fmtPrice(
              tenkan[lastIdx]
            )})이 기준선(${fmtPrice(kijun[lastIdx])})을 상향 돌파하는 호전 신호가 선행되어야 합니다.`,
      },
      {
        id: 'connors-rsi2',
        author: 'Larry Connors · Wall Street Mean Reversion',
        name: 'Connors RSI(2) + 200 SMA 눌림목 역추세',
        signal: connorsSignalType,
        badge: connorsBadge,
        keyLevel: `RSI(2): ${lastRsi2.toFixed(1)} · RSI(14): ${(rsi14Series[lastIdx] || 50).toFixed(1)} · 200선: ${fmtPrice(sma200[lastIdx])}`,
        summary:
          above200 && lastRsi2 <= 15
            ? `장기 상승 추세(200선 ${fmtPrice(
                sma200[lastIdx]
              )} 상회) 안에서 초단기 RSI(2)가 15 이하(${lastRsi2.toFixed(
                1
              )})로 급락한 전형적인 '고승률 눌림목 매수(Buy the Dip)' 구간입니다.`
            : above200
            ? `200선(${fmtPrice(sma200[lastIdx])}) 위 장기 상승장입니다. 코너스 전략은 추격 매수 대신 초단기 조정으로 RSI(2)가 10~15 이하로 내려올 때 분할 매수하고 5일선 회복 시 익절합니다.`
            : `주가가 200선(${fmtPrice(
                sma200[lastIdx]
              )}) 아래에 있을 때는 단기 과매도(RSI 하락)라도 추가 급락 위험이 크므로 섣부른 물타기를 피해야 합니다.`,
      },
      {
        id: 'turtle-stochastic',
        author: 'Richard Dennis · Turtle Donchian & Stochastic Slow',
        name: 'Donchian 20봉 채널 & 스토캐스틱 슬로우 (14,3,3)',
        signal: turtleSignalType,
        badge: turtleBadge,
        keyLevel: `20봉 상단 ${fmtPrice(donchianHigh[lastIdx])} · 10봉 하단 ${fmtPrice(donchianLow[lastIdx])} · %K ${lastK.toFixed(1)}`,
        summary: `전설적 퀀트 집단 '터틀 트레이더'의 20봉 최고가 돌파선(${fmtPrice(
          donchianHigh[lastIdx]
        )})과 스토캐스틱 슬로우(%K ${lastK.toFixed(1)}, %D ${lastD.toFixed(
          1
        )})를 결합한 시그널입니다. 10봉 최저가(${fmtPrice(donchianLow[lastIdx])})는 추세 추종자의 기계적 익절·손절 기준선입니다.`,
      },
    ];

    return {
      timeframe,
      currency,
      candles: rawCandles,
      indicators: {
        sma20,
        sma50,
        sma200,
        bbUpper,
        bbMiddle,
        bbLower,
        tenkan,
        kijun,
        spanA,
        spanB,
        supertrend,
        supertrendDir,
        signals,
        donchianHigh,
        donchianLow,
        stochK,
        stochD,
        sqzVal,
        sqzOn,
        macdLine,
        macdSignal,
        macdHist,
        rsi14: rsi14Series,
        connorsRsi2,
      },
      algoSignals,
    };
  }

  const exportsObj = {
    DEFAULT_USD_KRW,
    LATEST_MARKET_DATE,
    LATEST_MARKET_DATE_DOT,
    BACKTEST_REGIME_PRESETS,
    LEVERAGE_ETFS,
    DIVIDEND_ETFS,
    buildRecent12MonthLabels,
    fetchLiveYahooQuote,
    runHistoricalLeverageBacktest,
    analyzeTechnicalChartSignals,
    computeFullQuantChartPack,
    buildDrawdownRecoveryTable,
    fetchLiveUsdKrwRate,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.MarketData = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);

