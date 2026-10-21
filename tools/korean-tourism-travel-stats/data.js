/**
 * 대한민국 24개년 출입국 관광객 및 관광수지 공공 빅데이터 (2000~2024)
 * 
 * 출처:
 * 1. 한국관광공사(KTO) 한국관광 데이터랩 (출입국 관광통계)
 * 2. 법무부 출입국·외국인정책본부 통계월보
 * 3. 한국은행 경제통계시스템(ECOS) 국제수지표 여행수지
 * 
 * 단위:
 * - outbound (국민 해외출국자): 만 명 (10,000 Persons)
 * - inbound (방한 외래관광객): 만 명
 * - balance (관광수지): 억 달러 (100M USD)
 */

export const TOURISM_YEARS = [2000, 2005, 2010, 2015, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

export const TOURISM_STATS = {
  2000: { outbound: 551, inbound: 532, balance: -3, highlight: '해외여행 자유화 정착기 (출국과 입국 팽팽한 균형)' },
  2005: { outbound: 1008, inbound: 602, balance: -96, highlight: '국민 해외여행객 사상 첫 1,000만 명 돌파' },
  2010: { outbound: 1249, inbound: 880, balance: -84, highlight: '저비용 항공사(LCC) 성장 및 동남아 여행 대중화' },
  2015: { outbound: 1931, inbound: 1323, balance: -68, highlight: '메르스(MERS) 여파 일시적 충격 극복 및 유커 급증' },
  2018: { outbound: 2870, inbound: 1535, balance: -132, highlight: '워라밸·욜로(YOLO) 트렌드 속 사상 최대 해외여행 열풍' },
  2019: { outbound: 2871, inbound: 1750, balance: -101, highlight: '코로나 직전 역대 최고 피크 (방한 외래객 1,750만 명 달성)' },
  2020: { outbound: 428, inbound: 252, balance: -58, highlight: '코로나19 팬데믹 발발, 전 세계 국경 폐쇄 충격' },
  2021: { outbound: 122, inbound: 97, balance: -70, highlight: '글로벌 봉쇄 절정기 (출입국자 수 95% 이상 증발)' },
  2022: { outbound: 655, inbound: 320, balance: -80, highlight: '하반기 해외 입국자 격리면제 시작 및 여행 재개 시동' },
  2023: { outbound: 2272, inbound: 1103, balance: -125, highlight: '엔데믹 보복 해외여행 폭발 (일본 엔저 특수 개막)' },
  2024: { outbound: 2850, inbound: 1650, balance: -115, highlight: '2019년 수준 99% 완전 회복 (방한 K-컬처 붐 & 방일 여행 대폭발)' }
};

// 2024년 한국인이 가장 많이 떠난 해외여행지 TOP 5
export const OUTBOUND_TOP5_2024 = [
  { rank: 1, country: '일본', flag: '🇯🇵', visitors: 880, share: 30.9, comment: '역대급 엔저 특수와 항공 노선 확대로 역대 최다 방문' },
  { rank: 2, country: '베트남', flag: '🇻🇳', visitors: 430, share: 15.1, comment: '다낭·나트랑·푸꾸옥 등 가성비 최고 가족 휴양지' },
  { rank: 3, country: '태국', flag: '🇹🇭', visitors: 165, share: 5.8, comment: '방콕·치앙마이·푸껫 미식과 힐링의 성지' },
  { rank: 4, country: '필리핀', flag: '🇵🇭', visitors: 145, share: 5.1, comment: '세부·보라카이 해양 레저 및 어학연수 명소' },
  { rank: 5, country: '미국', flag: '🇺🇸', visitors: 120, share: 4.2, comment: '괌·사이판·하와이 휴양지 및 본토 비즈니스/관광' }
];

// 2024년 대한민국을 가장 많이 찾은 외국인 국적 TOP 5
export const INBOUND_TOP5_2024 = [
  { rank: 1, country: '중국', flag: '🇨🇳', visitors: 470, share: 28.5, comment: '단체관광 재개 및 2030 개별 자유여행(FIT) 중심 회복' },
  { rank: 2, country: '일본', flag: '🇯🇵', visitors: 300, share: 18.2, comment: 'K-POP 아이돌, K-뷰티, 성수동·올리브영 쇼핑 열풍' },
  { rank: 3, country: '대만', flag: '🇹🇼', visitors: 140, share: 8.5, comment: 'K-드라마 및 한국 미식 문화 선호도 아시아 최상위' },
  { rank: 4, country: '미국', flag: '🇺🇸', visitors: 125, share: 7.6, comment: 'K-컬처 글로벌 인기 및 한미 비즈니스 교류 활성화' },
  { rank: 5, country: '베트남', flag: '🇻🇳', visitors: 50, share: 3.0, comment: '동남아 경제 성장과 함께 급부상한 방한 시장' }
];
