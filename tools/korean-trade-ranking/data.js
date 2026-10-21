/**
 * 대한민국 24개년 수출·수입 품목 및 무역수지 공공 빅데이터 (2000~2024)
 * 
 * 출처:
 * 1. 관세청(KCS) 수출입 무역통계
 * 2. 산업통상자원부 연간 수출입 동향 발표 자료
 * 3. 한국무역협회(KITA) 무역통계 DB
 * 
 * 단위: 억 달러 (100 Million USD)
 */

export const TRADE_YEARS = [2000, 2005, 2010, 2015, 2020, 2022, 2024];

// 연도별 총 무역 규모 및 무역수지
export const TRADE_TOTALS = {
  2000: { export: 1723, import: 1605, balance: 118, highlight: 'IT 벤처 붐 및 IMF 외환위기 극복 무역흑자' },
  2005: { export: 2844, import: 2612, balance: 232, highlight: '중국 경제 급성장에 따른 대중 수출 호조' },
  2010: { export: 4664, import: 4252, balance: 412, highlight: '금융위기 조기 극복 및 조선·반도체 쌍끌이 흑자' },
  2015: { export: 5268, import: 4365, balance: 903, highlight: '사상 최대 무역수지 흑자 (903억 달러)' },
  2020: { export: 5128, import: 4672, balance: 456, highlight: '코로나19 팬데믹 충격 속 반도체 선방' },
  2022: { export: 6836, import: 7312, balance: -476, highlight: '에너지(원유·가스) 가격 폭등으로 무역적자 발생' },
  2024: { export: 6838, import: 6330, balance: 508, highlight: '반도체 HBM 슈퍼사이클 & 자동차 역대급 수출로 흑자 전환' }
};

// 연도별 수출 10대 품목 목록
export const EXPORT_RANKINGS = {
  2000: [
    { rank: 1, name: '반도체', icon: '💾', amount: 260, share: 15.1, category: 'IT·전자' },
    { rank: 2, name: '섬유류', icon: '🧵', amount: 184, share: 10.7, category: '전통제조' },
    { rank: 3, name: '컴퓨터', icon: '🖥️', amount: 146, share: 8.5, category: 'IT·전자' },
    { rank: 4, name: '자동차', icon: '🚗', amount: 132, share: 7.7, category: '모빌리티' },
    { rank: 5, name: '석유제품', icon: '⛽', amount: 92, share: 5.3, category: '에너지·화학' },
    { rank: 6, name: '선박(조선)', icon: '🚢', amount: 82, share: 4.8, category: '중공업' },
    { rank: 7, name: '무선통신기기', icon: '📱', amount: 81, share: 4.7, category: 'IT·전자' },
    { rank: 8, name: '철강판', icon: '🏗️', amount: 71, share: 4.1, category: '소재' },
    { rank: 9, name: '합성수지', icon: '🧪', amount: 62, share: 3.6, category: '에너지·화학' },
    { rank: 10, name: '자동차부품', icon: '⚙️', amount: 22, share: 1.3, category: '모빌리티' }
  ],
  2005: [
    { rank: 1, name: '반도체', icon: '💾', amount: 299, share: 10.5, category: 'IT·전자' },
    { rank: 2, name: '자동차', icon: '🚗', amount: 295, share: 10.4, category: '모빌리티' },
    { rank: 3, name: '무선통신기기', icon: '📱', amount: 277, share: 9.7, category: 'IT·전자' },
    { rank: 4, name: '선박(조선)', icon: '🚢', amount: 177, share: 6.2, category: '중공업' },
    { rank: 5, name: '석유제품', icon: '⛽', amount: 153, share: 5.4, category: '에너지·화학' },
    { rank: 6, name: '컴퓨터', icon: '🖥️', amount: 132, share: 4.6, category: 'IT·전자' },
    { rank: 7, name: '철강판', icon: '🏗️', amount: 128, share: 4.5, category: '소재' },
    { rank: 8, name: '합성수지', icon: '🧪', amount: 115, share: 4.0, category: '에너지·화학' },
    { rank: 9, name: '자동차부품', icon: '⚙️', amount: 80, share: 2.8, category: '모빌리티' },
    { rank: 10, name: '섬유류', icon: '🧵', amount: 78, share: 2.7, category: '전통제조' }
  ],
  2010: [
    { rank: 1, name: '반도체', icon: '💾', amount: 507, share: 10.9, category: 'IT·전자' },
    { rank: 2, name: '선박(조선)', icon: '🚢', amount: 491, share: 10.5, category: '중공업' },
    { rank: 3, name: '자동차', icon: '🚗', amount: 357, share: 7.7, category: '모빌리티' },
    { rank: 4, name: '석유제품', icon: '⛽', amount: 315, share: 6.8, category: '에너지·화학' },
    { rank: 5, name: '평판디스플레이', icon: '📺', amount: 299, share: 6.4, category: 'IT·전자' },
    { rank: 6, name: '무선통신기기', icon: '📱', amount: 247, share: 5.3, category: 'IT·전자' },
    { rank: 7, name: '합성수지', icon: '🧪', amount: 198, share: 4.2, category: '에너지·화학' },
    { rank: 8, name: '자동차부품', icon: '⚙️', amount: 190, share: 4.1, category: '모빌리티' },
    { rank: 9, name: '철강판', icon: '🏗️', amount: 185, share: 4.0, category: '소재' },
    { rank: 10, name: '일반기계', icon: '🏭', amount: 154, share: 3.3, category: '기계' }
  ],
  2015: [
    { rank: 1, name: '반도체', icon: '💾', amount: 629, share: 11.9, category: 'IT·전자' },
    { rank: 2, name: '자동차', icon: '🚗', amount: 459, share: 8.7, category: '모빌리티' },
    { rank: 3, name: '선박(조선)', icon: '🚢', amount: 401, share: 7.6, category: '중공업' },
    { rank: 4, name: '석유제품', icon: '⛽', amount: 329, share: 6.2, category: '에너지·화학' },
    { rank: 5, name: '평판디스플레이', icon: '📺', amount: 325, share: 6.2, category: 'IT·전자' },
    { rank: 6, name: '무선통신기기', icon: '📱', amount: 291, share: 5.5, category: 'IT·전자' },
    { rank: 7, name: '자동차부품', icon: '⚙️', amount: 256, share: 4.9, category: '모빌리티' },
    { rank: 8, name: '합성수지', icon: '🧪', amount: 215, share: 4.1, category: '에너지·화학' },
    { rank: 9, name: '철강판', icon: '🏗️', amount: 212, share: 4.0, category: '소재' },
    { rank: 10, name: '일반기계', icon: '🏭', amount: 205, share: 3.9, category: '기계' }
  ],
  2020: [
    { rank: 1, name: '반도체', icon: '💾', amount: 992, share: 19.3, category: 'IT·전자' },
    { rank: 2, name: '자동차', icon: '🚗', amount: 374, share: 7.3, category: '모빌리티' },
    { rank: 3, name: '일반기계', icon: '🏭', amount: 356, share: 6.9, category: '기계' },
    { rank: 4, name: '석유화학', icon: '🧪', amount: 356, share: 6.9, category: '에너지·화학' },
    { rank: 5, name: '석유제품', icon: '⛽', amount: 241, share: 4.7, category: '에너지·화학' },
    { rank: 6, name: '선박(조선)', icon: '🚢', amount: 197, share: 3.8, category: '중공업' },
    { rank: 7, name: '자동차부품', icon: '⚙️', amount: 186, share: 3.6, category: '모빌리티' },
    { rank: 8, name: '철강판', icon: '🏗️', amount: 182, share: 3.5, category: '소재' },
    { rank: 9, name: '디스플레이', icon: '📺', amount: 180, share: 3.5, category: 'IT·전자' },
    { rank: 10, name: '2차전지(배터리)', icon: '🔋', amount: 75, share: 1.5, category: '신산업' }
  ],
  2022: [
    { rank: 1, name: '반도체', icon: '💾', amount: 1292, share: 18.9, category: 'IT·전자' },
    { rank: 2, name: '석유제품', icon: '⛽', amount: 630, share: 9.2, category: '에너지·화학' },
    { rank: 3, name: '자동차', icon: '🚗', amount: 541, share: 7.9, category: '모빌리티' },
    { rank: 4, name: '석유화학', icon: '🧪', amount: 540, share: 7.9, category: '에너지·화학' },
    { rank: 5, name: '일반기계', icon: '🏭', amount: 511, share: 7.5, category: '기계' },
    { rank: 6, name: '철강판', icon: '🏗️', amount: 384, share: 5.6, category: '소재' },
    { rank: 7, name: '자동차부품', icon: '⚙️', amount: 233, share: 3.4, category: '모빌리티' },
    { rank: 8, name: '디스플레이', icon: '📺', amount: 211, share: 3.1, category: 'IT·전자' },
    { rank: 9, name: '선박(조선)', icon: '🚢', amount: 182, share: 2.7, category: '중공업' },
    { rank: 10, name: '2차전지(배터리)', icon: '🔋', amount: 100, share: 1.5, category: '신산업' }
  ],
  2024: [
    { rank: 1, name: '반도체', icon: '💾', amount: 1419, share: 20.8, category: 'IT·전자' },
    { rank: 2, name: '자동차', icon: '🚗', amount: 708, share: 10.4, category: '모빌리티' },
    { rank: 3, name: '일반기계', icon: '🏭', amount: 535, share: 7.8, category: '기계' },
    { rank: 4, name: '석유제품', icon: '⛽', amount: 525, share: 7.7, category: '에너지·화학' },
    { rank: 5, name: '석유화학', icon: '🧪', amount: 480, share: 7.0, category: '에너지·화학' },
    { rank: 6, name: '철강', icon: '🏗️', amount: 330, share: 4.8, category: '소재' },
    { rank: 7, name: '자동차부품', icon: '⚙️', amount: 226, share: 3.3, category: '모빌리티' },
    { rank: 8, name: '선박(조선)', icon: '🚢', amount: 215, share: 3.1, category: '중공업' },
    { rank: 9, name: '무선통신기기', icon: '📱', amount: 155, share: 2.3, category: 'IT·전자' },
    { rank: 10, name: '바이오헬스', icon: '💊', amount: 148, share: 2.2, category: '신산업' }
  ]
};

// 대표 6대 주력 품목 시계열 추이 (2000~2024 성장 배수)
export const TIMELINE_KEY_PRODUCTS = [
  {
    name: '반도체',
    icon: '💾',
    desc: '대한민국 수출의 20%를 책임지는 압도적 1위 쌀(Rice of Industry). AI HBM 메모리 주도.',
    series: [
      { year: 2000, amount: 260 },
      { year: 2005, amount: 299 },
      { year: 2010, amount: 507 },
      { year: 2015, amount: 629 },
      { year: 2020, amount: 992 },
      { year: 2022, amount: 1292 },
      { year: 2024, amount: 1419 }
    ]
  },
  {
    name: '자동차',
    icon: '🚗',
    desc: '내연기관에서 전기차·하이브리드 친환경 모빌리티로 체질 전환에 성공하며 역대 최대 700억$ 돌파.',
    series: [
      { year: 2000, amount: 132 },
      { year: 2005, amount: 295 },
      { year: 2010, amount: 357 },
      { year: 2015, amount: 459 },
      { year: 2020, amount: 374 },
      { year: 2022, amount: 541 },
      { year: 2024, amount: 708 }
    ]
  },
  {
    name: '선박(조선)',
    icon: '🚢',
    desc: '2000년대 후반 세계 1위를 독식하며 수출 2위까지 올랐다가 구조조정을 거쳐 고부가가치 LNG선 중심 부활.',
    series: [
      { year: 2000, amount: 82 },
      { year: 2005, amount: 177 },
      { year: 2010, amount: 491 },
      { year: 2015, amount: 401 },
      { year: 2020, amount: 197 },
      { year: 2022, amount: 182 },
      { year: 2024, amount: 215 }
    ]
  },
  {
    name: '석유제품',
    icon: '⛽',
    desc: '원유를 수입해 정제하여 고도화된 휘발유·경유·항공유로 재수출하는 대한민국 대표 캐시카우 산업.',
    series: [
      { year: 2000, amount: 92 },
      { year: 2005, amount: 153 },
      { year: 2010, amount: 315 },
      { year: 2015, amount: 329 },
      { year: 2020, amount: 241 },
      { year: 2022, amount: 630 },
      { year: 2024, amount: 525 }
    ]
  },
  {
    name: '2차전지(배터리)',
    icon: '🔋',
    desc: '2010년대 후반부터 전기차 붐을 타고 급성장하여 신성장 엔진으로 자리잡은 미래 먹거리 산업.',
    series: [
      { year: 2000, amount: 5 },
      { year: 2005, amount: 18 },
      { year: 2010, amount: 35 },
      { year: 2015, amount: 48 },
      { year: 2020, amount: 75 },
      { year: 2022, amount: 100 },
      { year: 2024, amount: 102 }
    ]
  },
  {
    name: '바이오헬스',
    icon: '💊',
    desc: '바이오시밀러, 백신 위탁생산(CDMO), 의료기기를 중심으로 2024년 수출 10대 품목에 공식 신규 진입.',
    series: [
      { year: 2000, amount: 12 },
      { year: 2005, amount: 25 },
      { year: 2010, amount: 44 },
      { year: 2015, amount: 72 },
      { year: 2020, amount: 141 },
      { year: 2022, amount: 162 },
      { year: 2024, amount: 148 }
    ]
  }
];

// 2024년 대한민국 주요 수입 품목 TOP 5 (원자재·에너지 의존도)
export const IMPORT_TOP5_2024 = [
  { rank: 1, name: '원유 (에너지)', amount: 862, share: 13.6, icon: '🛢️' },
  { rank: 2, name: '반도체 (장비·소재·웨이퍼)', amount: 651, share: 10.3, icon: '🔬' },
  { rank: 3, name: '천연가스 (LNG)', amount: 378, share: 6.0, icon: '🔥' },
  { rank: 4, name: '석유제품', amount: 235, share: 3.7, icon: '⛽' },
  { rank: 5, name: '석탄', amount: 198, share: 3.1, icon: '⛏️' }
];
