// KTO 2026-08 tourism statistics (published 2026-09-28); destination workbook (published 2026-10-08). Annual chart excludes partial 2026. Destination ranks only cover listed places with all eight months available.
// Reviewed 2026-10-26. See docs/statistics-refresh-20261026.md for source periods.

export const TOURISM_YEARS = [
  2000,
  2005,
  2010,
  2015,
  2018,
  2019,
  2020,
  2021,
  2022,
  2023,
  2024,
  2025
];

export const TOURISM_STATS = {
  "2000": {
    "outbound": 550.8242,
    "inbound": 532.1792,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2005": {
    "outbound": 1008.0143,
    "inbound": 602.2752,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2010": {
    "outbound": 1248.8364,
    "inbound": 879.7658,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2015": {
    "outbound": 1931.043,
    "inbound": 1323.1651,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2018": {
    "outbound": 2869.5983,
    "inbound": 1534.6879,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2019": {
    "outbound": 2871.4247,
    "inbound": 1750.2756,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2020": {
    "outbound": 427.6006,
    "inbound": 251.9118,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2021": {
    "outbound": 122.2541,
    "inbound": 96.7003,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2022": {
    "outbound": 655.4031,
    "inbound": 319.8017,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2023": {
    "outbound": 2271.5841,
    "inbound": 1103.1665,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2024": {
    "outbound": 2868.6435,
    "inbound": 1636.9629,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  },
  "2025": {
    "outbound": 2955.0177,
    "inbound": 1893.6562,
    "balance": null,
    "highlight": "한국관광공사 출입국 관광통계 연간 실적"
  }
};

export const LATEST_TOURISM_YEAR = 2025;

export const TOURISM_YTD_2026 = {
  "period": "2026년 1~8월",
  "outbound": 19813036,
  "inbound": 15048435
};

export const OUTBOUND_TOP5_2026 = [
  {
    "rank": 1,
    "flag": "🇯🇵",
    "country": "일본",
    "visitors": 742.034,
    "period": "2026년 1~8월",
    "comment": "목적지 기관별 방문 집계 · 국적/거주지 등 집계 기준이 다를 수 있습니다."
  },
  {
    "rank": 2,
    "flag": "🇻🇳",
    "country": "베트남",
    "visitors": 275.9265,
    "period": "2026년 1~8월",
    "comment": "목적지 기관별 방문 집계 · 국적/거주지 등 집계 기준이 다를 수 있습니다."
  },
  {
    "rank": 3,
    "flag": "🇺🇸",
    "country": "미국",
    "visitors": 85.1625,
    "period": "2026년 1~8월",
    "comment": "목적지 기관별 방문 집계 · 국적/거주지 등 집계 기준이 다를 수 있습니다."
  },
  {
    "rank": 4,
    "flag": "🇹🇭",
    "country": "태국",
    "visitors": 76.993,
    "period": "2026년 1~8월",
    "comment": "목적지 기관별 방문 집계 · 국적/거주지 등 집계 기준이 다를 수 있습니다."
  },
  {
    "rank": 5,
    "flag": "🇹🇼",
    "country": "대만",
    "visitors": 62.8158,
    "period": "2026년 1~8월",
    "comment": "목적지 기관별 방문 집계 · 국적/거주지 등 집계 기준이 다를 수 있습니다."
  }
];

export const INBOUND_TOP5_2026 = [
  {
    "rank": 1,
    "country": "중국",
    "flag": "🇨🇳",
    "visitors": 481.6134,
    "share": 32.0,
    "comment": "2026년 1~8월 방한 외래관광객 · 국적 기준"
  },
  {
    "rank": 2,
    "country": "일본",
    "flag": "🇯🇵",
    "visitors": 269.8857,
    "share": 17.9,
    "comment": "2026년 1~8월 방한 외래관광객 · 국적 기준"
  },
  {
    "rank": 3,
    "country": "대만",
    "flag": "🇹🇼",
    "visitors": 165.6255,
    "share": 11.0,
    "comment": "2026년 1~8월 방한 외래관광객 · 국적 기준"
  },
  {
    "rank": 4,
    "country": "미국",
    "flag": "🇺🇸",
    "visitors": 107.9727,
    "share": 7.2,
    "comment": "2026년 1~8월 방한 외래관광객 · 국적 기준"
  },
  {
    "rank": 5,
    "country": "홍콩",
    "flag": "🇭🇰",
    "visitors": 49.568,
    "share": 3.3,
    "comment": "2026년 1~8월 방한 외래관광객 · 국적 기준"
  }
];
