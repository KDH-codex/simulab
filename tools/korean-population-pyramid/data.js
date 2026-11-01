// MOIS resident registry 2024-12 / 2026-09; MOE 2026 Basic Education Statistics, reference 2026-04-01. Population and students in 10,000 persons, regional students in persons.
// Reviewed 2026-10-26. See docs/statistics-refresh-20261026.md for source periods.

export const POP_YEARS = [
  2024,
  2026
];

export const POP_AGE_GROUPS = [
  "80세+",
  "70~79세",
  "60~69세",
  "50~59세",
  "40~49세",
  "30~39세",
  "20~29세",
  "10~19세",
  "0~9세"
];

export const POPULATION_PYRAMID_DATA = {
  "2024": {
    "totalPop": 5121.7221,
    "medianAge": 46.8,
    "elderlyRate": 20.0,
    "period": "2024-12",
    "highlight": "2024년 12월 말 주민등록 인구 · 외국인 제외 · 중위연령은 각세 자료로 근사 계산",
    "male": {
      "0~9세": 160.906,
      "10~19세": 237.3758,
      "20~29세": 310.0524,
      "30~39세": 345.7978,
      "40~49세": 392.612,
      "50~59세": 439.1271,
      "60~69세": 385.0559,
      "70~79세": 193.1802,
      "80세+": 85.7252
    },
    "female": {
      "0~9세": 153.1058,
      "10~19세": 224.5507,
      "20~29세": 285.5132,
      "30~39세": 316.6585,
      "40~49세": 379.6703,
      "50~59세": 431.5099,
      "60~69세": 396.8224,
      "70~79세": 225.4795,
      "80세+": 158.5794
    }
  },
  "2026": {
    "totalPop": 5108.2431,
    "medianAge": 47.8,
    "elderlyRate": 22.1,
    "period": "2026-09",
    "highlight": "2026년 9월 말 주민등록 인구 · 외국인 제외 · 중위연령은 각세 자료로 근사 계산",
    "male": {
      "0~9세": 146.7182,
      "10~19세": 236.5082,
      "20~29세": 285.4433,
      "30~39세": 351.485,
      "40~49세": 381.5314,
      "50~59세": 432.1707,
      "60~69세": 395.4442,
      "70~79세": 219.2287,
      "80세+": 92.463
    },
    "female": {
      "0~9세": 139.5364,
      "10~19세": 224.6383,
      "20~29세": 265.2658,
      "30~39세": 319.9464,
      "40~49세": 367.6914,
      "50~59세": 425.7617,
      "60~69세": 404.3004,
      "70~79세": 254.6071,
      "80세+": 165.5029
    }
  }
};

export const ELEMENTARY_HISTORY = [
  {
    "year": 1970,
    "students": 574.9301,
    "classSize": 62.1,
    "comment": "교육부 2026 교육기본통계 수록 1970년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 1980,
    "students": 565.8002,
    "classSize": 51.5,
    "comment": "교육부 2026 교육기본통계 수록 1980년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 1990,
    "students": 486.852,
    "classSize": 41.4,
    "comment": "교육부 2026 교육기본통계 수록 1990년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2000,
    "students": 401.9991,
    "classSize": 35.8,
    "comment": "교육부 2026 교육기본통계 수록 2000년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2010,
    "students": 329.9094,
    "classSize": 26.6,
    "comment": "교육부 2026 교육기본통계 수록 2010년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2015,
    "students": 271.461,
    "classSize": 22.6,
    "comment": "교육부 2026 교육기본통계 수록 2015년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2020,
    "students": 269.3716,
    "classSize": 21.8,
    "comment": "교육부 2026 교육기본통계 수록 2020년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2021,
    "students": 267.234,
    "classSize": 21.5,
    "comment": "교육부 2026 교육기본통계 수록 2021년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2022,
    "students": 266.4278,
    "classSize": 21.1,
    "comment": "교육부 2026 교육기본통계 수록 2022년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2023,
    "students": 260.3929,
    "classSize": 20.7,
    "comment": "교육부 2026 교육기본통계 수록 2023년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2024,
    "students": 249.5005,
    "classSize": 20.0,
    "comment": "교육부 2026 교육기본통계 수록 2024년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2025,
    "students": 234.5488,
    "classSize": 19.3,
    "comment": "교육부 2026 교육기본통계 수록 2025년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  },
  {
    "year": 2026,
    "students": 221.937,
    "classSize": 18.6,
    "comment": "교육부 2026 교육기본통계 수록 2026년 실적. 입학연도와 가장 가까운 수록연도를 비교합니다."
  }
];

export const REGIONAL_ELEMENTARY_2026 = [
  {
    "region": "경기",
    "students": 653006,
    "share": 29.4
  },
  {
    "region": "서울",
    "students": 322736,
    "share": 14.5
  },
  {
    "region": "경남",
    "students": 147985,
    "share": 6.7
  },
  {
    "region": "인천",
    "students": 138837,
    "share": 6.3
  },
  {
    "region": "부산",
    "students": 130135,
    "share": 5.9
  },
  {
    "region": "대구",
    "students": 105332,
    "share": 4.7
  },
  {
    "region": "경북",
    "students": 101176,
    "share": 4.6
  },
  {
    "region": "충남",
    "students": 99712,
    "share": 4.5
  },
  {
    "region": "전남",
    "students": 71415,
    "share": 3.2
  },
  {
    "region": "전북",
    "students": 70524,
    "share": 3.2
  },
  {
    "region": "충북",
    "students": 69854,
    "share": 3.1
  },
  {
    "region": "광주",
    "students": 68664,
    "share": 3.1
  },
  {
    "region": "대전",
    "students": 63488,
    "share": 2.9
  },
  {
    "region": "강원",
    "students": 58433,
    "share": 2.6
  },
  {
    "region": "울산",
    "students": 54213,
    "share": 2.4
  },
  {
    "region": "제주",
    "students": 34560,
    "share": 1.6
  },
  {
    "region": "세종",
    "students": 29300,
    "share": 1.3
  }
];
