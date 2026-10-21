/**
 * 세계 30대 주요국 인구, 영토 면적, 인구밀도 공공 빅데이터 (2024년 최신)
 * 
 * 출처:
 * 1. UN DESA (유엔 경제사회국) World Population Prospects 2024
 * 2. 세계은행(World Bank) Open Data - Land area (sq. km)
 * 3. FAO (유엔식량농업기구) 통계 DB
 * 
 * 단위:
 * - population: 만 명 (10,000 Persons)
 * - area: 만 ㎢ (10,000 ㎢)
 * - density: 명/㎢ (Persons per ㎢)
 */

export const WORLD_COUNTRIES_DATA = [
  {
    code: 'KOR',
    name: '대한민국',
    flag: '🇰🇷',
    continent: '아시아',
    population: 5175,
    area: 10.04,
    density: 515.4,
    highlight: true,
    desc: 'OECD 국가 중 인구밀도 1위. 수도권 과밀 및 국토의 70%가 산지인 대표적 고밀도 선진국.'
  },
  {
    code: 'IND',
    name: '인도',
    flag: '🇮🇳',
    continent: '아시아',
    population: 144170,
    area: 328.7,
    density: 438.6,
    desc: '2023년 중국을 제치고 세계 1위 인구 대국으로 등극. 청년층 인구 비중이 높은 경제 대국.'
  },
  {
    code: 'CHN',
    name: '중국',
    flag: '🇨🇳',
    continent: '아시아',
    population: 140960,
    area: 960.0,
    density: 146.8,
    desc: '세계 3위 영토 면적과 14억 거대 내수 시장을 보유한 G2 국가. 인구 감소세 진입.'
  },
  {
    code: 'USA',
    name: '미국',
    flag: '🇺🇸',
    continent: '아메리카',
    population: 34180,
    area: 952.5,
    density: 35.9,
    desc: '세계 3위 인구와 4위 영토를 지닌 글로벌 패권국. 한국 영토의 약 95배.'
  },
  {
    code: 'IDN',
    name: '인도네시아',
    flag: '🇮🇩',
    continent: '아시아',
    population: 27980,
    area: 190.4,
    density: 147.0,
    desc: '1만 7천여 개 섬으로 이루어진 세계 4위 인구 대국. 아세안 경제 맹주.'
  },
  {
    code: 'PAK',
    name: '파키스탄',
    flag: '🇵🇰',
    continent: '아시아',
    population: 24520,
    area: 88.2,
    density: 278.0,
    desc: '세계 5위 인구 대국. 서남아시아의 높은 출산율과 인구 증가세.'
  },
  {
    code: 'BRA',
    name: '브라질',
    flag: '🇧🇷',
    continent: '아메리카',
    population: 21760,
    area: 851.5,
    density: 25.6,
    desc: '남미 최대 영토(세계 5위)와 최대 인구를 보유한 자원 대국.'
  },
  {
    code: 'NGA',
    name: '나이지리아',
    flag: '🇳🇬',
    continent: '아프리카',
    population: 22910,
    area: 92.4,
    density: 247.9,
    desc: '아프리카 최대 인구 대국. 높은 출산율로 미래 인구 성장 잠재력 1위.'
  },
  {
    code: 'BGD',
    name: '방글라데시',
    flag: '🇧🇩',
    continent: '아시아',
    population: 17470,
    area: 14.8,
    density: 1180.4,
    desc: '인구 1,000만 이상 국가 중 세계 1위 초고밀도 국가. 한국보다 2.3배 조밀.'
  },
  {
    code: 'RUS',
    name: '러시아',
    flag: '🇷🇺',
    continent: '유럽',
    population: 14420,
    area: 1709.8,
    density: 8.4,
    desc: '전 세계 육지의 1/9을 차지하는 압도적 세계 1위 영토 대국(한국의 170배).'
  },
  {
    code: 'MEX',
    name: '멕시코',
    flag: '🇲🇽',
    continent: '아메리카',
    population: 12930,
    area: 196.4,
    density: 65.8,
    desc: '중남미 2위 경제·인구 대국. 미국과 국경을 맞댄 니어쇼어링 제조업 중심지.'
  },
  {
    code: 'JPN',
    name: '일본',
    flag: '🇯🇵',
    continent: '아시아',
    population: 12370,
    area: 37.8,
    density: 327.2,
    desc: '한국 영토의 3.8배, 인구 2.4배. 세계 최초 초고령사회 진입 국가.'
  },
  {
    code: 'PHL',
    name: '필리핀',
    flag: '🇵🇭',
    continent: '아시아',
    population: 11910,
    area: 30.0,
    density: 397.0,
    desc: '동남아의 대표적 젊은 인구 대국. 7천여 개 섬으로 구성된 군도 국가.'
  },
  {
    code: 'EGY',
    name: '이집트',
    flag: '🇪🇬',
    continent: '아프리카',
    population: 11450,
    area: 100.2,
    density: 114.3,
    desc: '영토의 95%가 사막이며, 나일강 주변 5% 좁은 회랑에 인구가 초밀집.'
  },
  {
    code: 'VNM',
    name: '베트남',
    flag: '🇻🇳',
    continent: '아시아',
    population: 10030,
    area: 33.1,
    density: 303.0,
    desc: '인구 1억 명 돌파. 한국의 3대 교역국이자 한국 기업 최대 생산 기지.'
  },
  {
    code: 'DEU',
    name: '독일',
    flag: '🇩🇪',
    continent: '유럽',
    population: 8440,
    area: 35.7,
    density: 236.4,
    desc: '유럽연합(EU) 1위 경제·인구 대국. 한국 영토의 3.5배.'
  },
  {
    code: 'TUR',
    name: '튀르키예',
    flag: '🇹🇷',
    continent: '아시아/유럽',
    population: 8620,
    area: 78.5,
    density: 109.8,
    desc: '아시아와 유럽을 잇는 지정학적 요충지. 한국 영토의 약 8배.'
  },
  {
    code: 'GBR',
    name: '영국',
    flag: '🇬🇧',
    continent: '유럽',
    population: 6770,
    area: 24.3,
    density: 278.6,
    desc: '서유럽 대표 강국. 한국 영토의 2.4배, 인구는 1.3배 수준.'
  },
  {
    code: 'FRA',
    name: '프랑스',
    flag: '🇫🇷',
    continent: '유럽',
    population: 6810,
    area: 55.1,
    density: 123.6,
    desc: '서유럽 최대 영토(한국의 5.5배). 풍요로운 농업과 관광 대국.'
  },
  {
    code: 'ITA',
    name: '이탈리아',
    flag: '🇮🇹',
    continent: '유럽',
    population: 5880,
    area: 30.1,
    density: 195.3,
    desc: '장화 모양의 남유럽 중심국. 한국과 인구 규모(5,800만 vs 5,170만)가 가장 유사.'
  },
  {
    code: 'ZAF',
    name: '남아공',
    flag: '🇿🇦',
    continent: '아프리카',
    population: 6040,
    area: 122.1,
    density: 49.5,
    desc: '아프리카 최남단 자원 부국. 한국 영토의 12배.'
  },
  {
    code: 'ESP',
    name: '스페인',
    flag: '🇪🇸',
    continent: '유럽',
    population: 4860,
    area: 50.6,
    density: 96.0,
    desc: '한국 영토의 5배에 달하는 넓은 영토에 인구는 한국보다 적어 쾌적한 밀도.'
  },
  {
    code: 'ARG',
    name: '아르헨티나',
    flag: '🇦🇷',
    continent: '아메리카',
    population: 4670,
    area: 278.0,
    density: 16.8,
    desc: '세계 8위 영토 대국(한국의 28배). 광활한 팜파스 평야 보유.'
  },
  {
    code: 'CAN',
    name: '캐나다',
    flag: '🇨🇦',
    continent: '아메리카',
    population: 4010,
    area: 998.4,
    density: 4.0,
    desc: '세계 2위 영토 대국(한국의 100배). 인구밀도는 한국의 1/128 수준.'
  },
  {
    code: 'POL',
    name: '폴란드',
    flag: '🇵🇱',
    continent: '유럽',
    population: 4060,
    area: 31.3,
    density: 129.7,
    desc: '중동부 유럽의 핵심 국가. K-방산 주요 수입국. 한국 영토의 3.1배.'
  },
  {
    code: 'SAU',
    name: '사우디',
    flag: '🇸🇦',
    continent: '아시아',
    population: 3690,
    area: 215.0,
    density: 17.2,
    desc: '아라비아 반도 최대 산유국. 한국 영토의 21배.'
  },
  {
    code: 'AUS',
    name: '호주',
    flag: '🇦🇺',
    continent: '오세아니아',
    population: 2660,
    area: 769.2,
    density: 3.5,
    desc: '대륙 전체를 차지하는 세계 6위 영토 대국(한국의 77배). 1㎢당 3.5명 거주.'
  },
  {
    code: 'TWN',
    name: '대만',
    flag: '🇹🇼',
    continent: '아시아',
    population: 2390,
    area: 3.62,
    density: 660.2,
    desc: '한국(10만 ㎢)의 1/3 크기 영토에 2,400만 명이 거주하는 세계 최상위 고밀도 지역.'
  },
  {
    code: 'NLD',
    name: '네덜란드',
    flag: '🇳🇱',
    continent: '유럽',
    population: 1790,
    area: 4.15,
    density: 431.3,
    desc: '유럽에서 한국과 유사하게 인구밀도가 매우 높은 스마트 농업·물류 강국.'
  },
  {
    code: 'CHE',
    name: '스위스',
    flag: '🇨🇭',
    continent: '유럽',
    population: 890,
    area: 4.13,
    density: 215.5,
    desc: '알프스 산맥의 유럽 최상위 부국. 한국 영토의 40% 크기.'
  }
];
