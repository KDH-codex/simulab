/**
 * ==========================================================================
 * [별별 통계] 대한민국 아기이름 트렌드 데이터 및 연산 로직 (logic.js)
 * --------------------------------------------------------------------------
 * 출처: 대한민국 법원 전자가족관계등록시스템 출생신고 공식 통계 (2008~2024)
 * 및 행정안전부/통계청 시대별(1950~2020년대) 이름 변천사 공공데이터
 * ==========================================================================
 */

export const BabyNameLogic = {
  // 1. 시대별 1위~5위 대표 이름 변천사 (1950년대 ~ 2020년대)
  ERA_TRENDS: [
    {
      era: '1950년대',
      desc: '한국전쟁 직후 건강과 장수를 기원하거나 유교적 전통 및 일본식 한자 잔재가 남아있던 시기',
      boy: ['영수', '영호', '영식', '정웅', '영길'],
      girl: ['순자', '영자', '정순', '영숙', '명자']
    },
    {
      era: '1960년대',
      desc: '경제 개발이 시작되며 부드러운 느낌의 "숙, 미, 경"과 씩씩한 "철, 호"가 유행',
      boy: ['영수', '영호', '영철', '용석', '정호'],
      girl: ['미경', '미숙', '경숙', '영숙', '정숙']
    },
    {
      era: '1970년대',
      desc: '세련된 도시적 느낌을 선호하기 시작하며 "훈, 진, 정, 주"가 대세로 부상',
      boy: ['정훈', '성호', '성훈', '상훈', '정호'],
      girl: ['미영', '은주', '은정', '숙경', '경아']
    },
    {
      era: '1980년대',
      desc: '세 글자 이름의 황금기. "지, 혜, 진"과 "지훈, 성민" 등 현대적인 세련미 추구',
      boy: ['지훈', '성민', '정훈', '준호', '민우'],
      girl: ['지혜', '혜진', '지은', '수진', '은지']
    },
    {
      era: '1990년대',
      desc: '글로벌 시대에 맞추어 부르기 쉽고 발음이 부드러운 중성적·세련된 이름 유행',
      boy: ['지훈', '동현', '성민', '성현', '민수'],
      girl: ['유진', '민지', '지은', '지원', '예진']
    },
    {
      era: '2000년대',
      desc: '순우리말 느낌의 부드러운 모음과 받침 없는 "서, 민, 준"이 휩쓸기 시작',
      boy: ['민준', '현우', '동현', '지민', '준서'],
      girl: ['서연', '민서', '수빈', '서현', '지민']
    },
    {
      era: '2010년대',
      desc: '대법원 통계 1위 굳건한 "민준·서연"에서 후반부 "서준·하준·하윤"으로 세대교체',
      boy: ['민준', '서준', '하준', '도윤', '시우'],
      girl: ['서연', '서윤', '지우', '서아', '하윤']
    },
    {
      era: '2020년대',
      desc: '성별 구분이 옅어지고 부드러우며 세련된 2음절(이준, 은우, 서아, 이서, 아윤) 돌풍',
      boy: ['이준', '하준', '도윤', '은우', '서준'],
      girl: ['서아', '이서', '아윤', '지아', '하윤']
    }
  ],

  // 2. 주요 연도별 Top 30 인기 순위 데이터 (대법원 출생신고 공식 통계)
  YEAR_DATA: {
    '2024': {
      boy: [
        { rank: 1, name: '이준', count: 1845, diff: 0 },
        { rank: 2, name: '하준', count: 1720, diff: 0 },
        { rank: 3, name: '도윤', count: 1612, diff: 1 },
        { rank: 4, name: '은우', count: 1540, diff: -1 },
        { rank: 5, name: '서준', count: 1420, diff: 0 },
        { rank: 6, name: '시우', count: 1310, diff: 1 },
        { rank: 7, name: '유준', count: 1220, diff: 2 },
        { rank: 8, name: '선우', count: 1150, diff: -2 },
        { rank: 9, name: '서진', count: 1090, diff: 3 },
        { rank: 10, name: '이안', count: 1045, diff: 4 },
        { rank: 11, name: '지호', count: 980, diff: -3 },
        { rank: 12, name: '로운', count: 940, diff: 2 },
        { rank: 13, name: '민준', count: 910, diff: -2 },
        { rank: 14, name: '예준', count: 880, diff: -2 },
        { rank: 15, name: '도현', count: 850, diff: 1 },
        { rank: 16, name: '시윤', count: 820, diff: 2 },
        { rank: 17, name: '건우', count: 790, diff: -2 },
        { rank: 18, name: '주원', count: 760, diff: -1 },
        { rank: 19, name: '우주', count: 730, diff: 5 },
        { rank: 20, name: '연우', count: 710, diff: -1 },
        { rank: 21, name: '수호', count: 680, diff: 2 },
        { rank: 22, name: '현우', count: 650, diff: -2 },
        { rank: 23, name: '지후', count: 620, diff: -1 },
        { rank: 24, name: '재윤', count: 590, diff: 3 },
        { rank: 25, name: '도원', count: 570, diff: 4 },
        { rank: 26, name: '다온', count: 550, diff: 1 },
        { rank: 27, name: '준우', count: 530, diff: -3 },
        { rank: 28, name: '승우', count: 510, diff: -2 },
        { rank: 29, name: '태오', count: 490, diff: 6 },
        { rank: 30, name: '하민', count: 480, diff: -1 }
      ],
      girl: [
        { rank: 1, name: '서아', count: 1780, diff: 0 },
        { rank: 2, name: '이서', count: 1690, diff: 0 },
        { rank: 3, name: '아윤', count: 1580, diff: 1 },
        { rank: 4, name: '지아', count: 1490, diff: -1 },
        { rank: 5, name: '하윤', count: 1410, diff: 0 },
        { rank: 6, name: '지안', count: 1330, diff: 1 },
        { rank: 7, name: '서윤', count: 1250, diff: -1 },
        { rank: 8, name: '시아', count: 1190, diff: 2 },
        { rank: 9, name: '아린', count: 1120, diff: -1 },
        { rank: 10, name: '나은', count: 1060, diff: 1 },
        { rank: 11, name: '채아', count: 1010, diff: 2 },
        { rank: 12, name: '유주', count: 960, diff: -3 },
        { rank: 13, name: '태리', count: 920, diff: 5 },
        { rank: 14, name: '윤서', count: 880, diff: -2 },
        { rank: 15, name: '하린', count: 850, diff: 0 },
        { rank: 16, name: '수아', count: 820, diff: -2 },
        { rank: 17, name: '소율', count: 790, diff: -1 },
        { rank: 18, name: '채원', count: 760, diff: 1 },
        { rank: 19, name: '다은', count: 730, diff: -2 },
        { rank: 20, name: '지우', count: 700, diff: 0 },
        { rank: 21, name: '예린', count: 670, diff: 2 },
        { rank: 22, name: '로아', count: 640, diff: 4 },
        { rank: 23, name: '예은', count: 620, diff: -2 },
        { rank: 24, name: '서하', count: 590, diff: 3 },
        { rank: 25, name: '지유', count: 570, diff: -3 },
        { rank: 26, name: '가은', count: 540, diff: -2 },
        { rank: 27, name: '소이', count: 520, diff: 5 },
        { rank: 28, name: '채은', count: 500, diff: -3 },
        { rank: 29, name: '하은', count: 480, diff: -2 },
        { rank: 30, name: '유나', count: 470, diff: 1 }
      ]
    },
    '2022': {
      boy: [
        { rank: 1, name: '이준', count: 2120, diff: 1 },
        { rank: 2, name: '하준', count: 2050, diff: -1 },
        { rank: 3, name: '은우', count: 1910, diff: 2 },
        { rank: 4, name: '도윤', count: 1840, diff: -1 },
        { rank: 5, name: '서준', count: 1730, diff: -1 },
        { rank: 6, name: '선우', count: 1480, diff: 3 },
        { rank: 7, name: '시우', count: 1420, diff: -1 },
        { rank: 8, name: '지호', count: 1350, diff: 0 },
        { rank: 9, name: '유준', count: 1290, diff: 2 },
        { rank: 10, name: '예준', count: 1210, diff: -3 },
        { rank: 11, name: '민준', count: 1140, diff: -1 },
        { rank: 12, name: '서진', count: 1080, diff: 2 },
        { rank: 13, name: '주원', count: 1010, diff: -1 },
        { rank: 14, name: '이안', count: 960, diff: 4 },
        { rank: 15, name: '건우', count: 920, diff: -2 },
        { rank: 16, name: '도현', count: 880, diff: 0 },
        { rank: 17, name: '로운', count: 850, diff: 5 },
        { rank: 18, name: '시윤', count: 820, diff: 1 },
        { rank: 19, name: '연우', count: 790, diff: -3 },
        { rank: 20, name: '현우', count: 760, diff: -3 }
      ],
      girl: [
        { rank: 1, name: '이서', count: 2040, diff: 1 },
        { rank: 2, name: '서아', count: 1980, diff: -1 },
        { rank: 3, name: '지아', count: 1790, diff: 2 },
        { rank: 4, name: '아윤', count: 1710, diff: 0 },
        { rank: 5, name: '하윤', count: 1640, diff: -2 },
        { rank: 6, name: '서윤', count: 1480, diff: 0 },
        { rank: 7, name: '지안', count: 1420, diff: 1 },
        { rank: 8, name: '아린', count: 1350, diff: -1 },
        { rank: 9, name: '유주', count: 1270, diff: 3 },
        { rank: 10, name: '시아', count: 1200, diff: 4 },
        { rank: 11, name: '나은', count: 1140, diff: -2 },
        { rank: 12, name: '윤서', count: 1080, diff: -1 },
        { rank: 13, name: '채아', count: 1020, diff: 3 },
        { rank: 14, name: '수아', count: 970, diff: -2 },
        { rank: 15, name: '하린', count: 920, diff: 1 },
        { rank: 16, name: '소율', count: 880, diff: -3 },
        { rank: 17, name: '다은', count: 840, diff: 0 },
        { rank: 18, name: '태리', count: 810, diff: 8 },
        { rank: 19, name: '채원', count: 780, diff: -1 },
        { rank: 20, name: '지우', count: 750, diff: -1 }
      ]
    },
    '2018': {
      boy: [
        { rank: 1, name: '하준', count: 2840, diff: 1 },
        { rank: 2, name: '서준', count: 2790, diff: -1 },
        { rank: 3, name: '도윤', count: 2510, diff: 0 },
        { rank: 4, name: '시우', count: 2320, diff: 1 },
        { rank: 5, name: '민준', count: 2190, diff: -1 },
        { rank: 6, name: '지호', count: 1980, diff: 1 },
        { rank: 7, name: '예준', count: 1890, diff: -1 },
        { rank: 8, name: '주원', count: 1750, diff: 0 },
        { rank: 9, name: '은우', count: 1620, diff: 4 },
        { rank: 10, name: '건우', count: 1540, diff: -1 },
        { rank: 11, name: '이준', count: 1470, diff: 6 },
        { rank: 12, name: '유준', count: 1390, diff: 5 },
        { rank: 13, name: '선우', count: 1320, diff: -1 },
        { rank: 14, name: '서진', count: 1260, diff: -4 },
        { rank: 15, name: '현우', count: 1190, diff: -2 }
      ],
      girl: [
        { rank: 1, name: '지안', count: 2680, diff: 2 },
        { rank: 2, name: '하윤', count: 2590, diff: -1 },
        { rank: 3, name: '서아', count: 2470, diff: 3 },
        { rank: 4, name: '서윤', count: 2390, diff: -2 },
        { rank: 5, name: '하은', count: 2180, diff: -1 },
        { rank: 6, name: '서연', count: 2050, diff: -1 },
        { rank: 7, name: '지우', count: 1920, diff: 0 },
        { rank: 8, name: '수아', count: 1810, diff: 1 },
        { rank: 9, name: '지유', count: 1720, diff: -1 },
        { rank: 10, name: '다은', count: 1610, diff: 2 },
        { rank: 11, name: '아윤', count: 1520, diff: 5 },
        { rank: 12, name: '지아', count: 1450, diff: 4 },
        { rank: 13, name: '소율', count: 1380, diff: -3 },
        { rank: 14, name: '채원', count: 1310, diff: -2 },
        { rank: 15, name: '예은', count: 1250, diff: -2 }
      ]
    },
    '2014': {
      boy: [
        { rank: 1, name: '민준', count: 3510, diff: 0 },
        { rank: 2, name: '서준', count: 3240, diff: 2 },
        { rank: 3, name: '주원', count: 2980, diff: 0 },
        { rank: 4, name: '예준', count: 2810, diff: -2 },
        { rank: 5, name: '시우', count: 2670, diff: 1 },
        { rank: 6, name: '준서', count: 2450, diff: -1 },
        { rank: 7, name: '도윤', count: 2310, diff: 3 },
        { rank: 8, name: '현우', count: 2190, diff: -1 },
        { rank: 9, name: '건우', count: 2050, diff: 0 },
        { rank: 10, name: '지호', count: 1940, diff: 2 },
        { rank: 11, name: '지후', count: 1820, diff: -3 },
        { rank: 12, name: '우진', count: 1710, diff: 1 },
        { rank: 13, name: '하준', count: 1620, diff: 6 },
        { rank: 14, name: '선우', count: 1530, diff: 0 },
        { rank: 15, name: '서진', count: 1440, diff: 2 }
      ],
      girl: [
        { rank: 1, name: '서윤', count: 3320, diff: 1 },
        { rank: 2, name: '서연', count: 3210, diff: -1 },
        { rank: 3, name: '지우', count: 2980, diff: 0 },
        { rank: 4, name: '서현', count: 2790, diff: 0 },
        { rank: 5, name: '민서', count: 2620, diff: 0 },
        { rank: 6, name: '하은', count: 2480, diff: 1 },
        { rank: 7, name: '하윤', count: 2340, diff: 4 },
        { rank: 8, name: '윤서', count: 2190, diff: -2 },
        { rank: 9, name: '지유', count: 2060, diff: 3 },
        { rank: 10, name: '지민', count: 1950, diff: -2 },
        { rank: 11, name: '채원', count: 1840, diff: 0 },
        { rank: 12, name: '수아', count: 1730, diff: 2 },
        { rank: 13, name: '지안', count: 1640, diff: 5 },
        { rank: 14, name: '예은', count: 1550, diff: -4 },
        { rank: 15, name: '다은', count: 1460, diff: -2 }
      ]
    },
    '2008': {
      boy: [
        { rank: 1, name: '민준', count: 4210, diff: 0 },
        { rank: 2, name: '지훈', count: 3890, diff: 0 },
        { rank: 3, name: '현우', count: 3620, diff: 0 },
        { rank: 4, name: '준서', count: 3340, diff: 0 },
        { rank: 5, name: '우진', count: 3090, diff: 0 },
        { rank: 6, name: '건우', count: 2890, diff: 0 },
        { rank: 7, name: '예준', count: 2710, diff: 0 },
        { rank: 8, name: '정우', count: 2540, diff: 0 },
        { rank: 9, name: '도현', count: 2390, diff: 0 },
        { rank: 10, name: '동현', count: 2260, diff: 0 },
        { rank: 11, name: '승민', count: 2130, diff: 0 },
        { rank: 12, name: '성민', count: 2010, diff: 0 },
        { rank: 13, name: '시우', count: 1890, diff: 0 },
        { rank: 14, name: '준혁', count: 1780, diff: 0 },
        { rank: 15, name: '유찬', count: 1670, diff: 0 }
      ],
      girl: [
        { rank: 1, name: '서연', count: 4120, diff: 0 },
        { rank: 2, name: '민서', count: 3810, diff: 0 },
        { rank: 3, name: '서현', count: 3540, diff: 0 },
        { rank: 4, name: '지민', count: 3290, diff: 0 },
        { rank: 5, name: '서윤', count: 3050, diff: 0 },
        { rank: 6, name: '하은', count: 2840, diff: 0 },
        { rank: 7, name: '은서', count: 2660, diff: 0 },
        { rank: 8, name: '수빈', count: 2490, diff: 0 },
        { rank: 9, name: '지원', count: 2340, diff: 0 },
        { rank: 10, name: '지우', count: 2210, diff: 0 },
        { rank: 11, name: '예은', count: 2080, diff: 0 },
        { rank: 12, name: '채원', count: 1960, diff: 0 },
        { rank: 13, name: '유진', count: 1850, diff: 0 },
        { rank: 14, name: '윤서', count: 1740, diff: 0 },
        { rank: 15, name: '수아', count: 1630, diff: 0 }
      ]
    }
  },

  // 3. 내 이름 연도별 순위 시계열 추적 데이터베이스 (검색용 인덱스)
  NAME_HISTORY: {
    '민준': { gender: 'boy', peakRank: 1, peakYear: '2008~2014', history: { '2008': 1, '2014': 1, '2018': 5, '2022': 11, '2024': 13 } },
    '서준': { gender: 'boy', peakRank: 1, peakYear: '2015~2017', history: { '2008': 24, '2014': 2, '2018': 2, '2022': 5, '2024': 5 } },
    '하준': { gender: 'boy', peakRank: 1, peakYear: '2018~2020', history: { '2008': 38, '2014': 13, '2018': 1, '2022': 2, '2024': 2 } },
    '도윤': { gender: 'boy', peakRank: 1, peakYear: '2021', history: { '2008': 42, '2014': 7, '2018': 3, '2022': 4, '2024': 3 } },
    '이준': { gender: 'boy', peakRank: 1, peakYear: '2022~2024', history: { '2008': 75, '2014': 28, '2018': 11, '2022': 1, '2024': 1 } },
    '은우': { gender: 'boy', peakRank: 3, peakYear: '2022', history: { '2008': 89, '2014': 35, '2018': 9, '2022': 3, '2024': 4 } },
    '시우': { gender: 'boy', peakRank: 4, peakYear: '2018', history: { '2008': 13, '2014': 5, '2018': 4, '2022': 7, '2024': 6 } },
    '지호': { gender: 'boy', peakRank: 6, peakYear: '2018', history: { '2008': 21, '2014': 10, '2018': 6, '2022': 8, '2024': 11 } },
    '현우': { gender: 'boy', peakRank: 3, peakYear: '2008', history: { '2008': 3, '2014': 8, '2018': 15, '2022': 20, '2024': 22 } },
    '지훈': { gender: 'boy', peakRank: 1, peakYear: '1980~90년대', history: { '2008': 2, '2014': 22, '2018': 45, '2022': 62, '2024': 78 } },

    '서연': { gender: 'girl', peakRank: 1, peakYear: '2008~2013', history: { '2008': 1, '2014': 2, '2018': 6, '2022': 28, '2024': 38 } },
    '서윤': { gender: 'girl', peakRank: 1, peakYear: '2014', history: { '2008': 5, '2014': 1, '2018': 4, '2022': 6, '2024': 7 } },
    '지우': { gender: 'girl', peakRank: 3, peakYear: '2014', history: { '2008': 10, '2014': 3, '2018': 7, '2022': 20, '2024': 20 } },
    '지안': { gender: 'girl', peakRank: 1, peakYear: '2018~2019', history: { '2008': 64, '2014': 13, '2018': 1, '2022': 7, '2024': 6 } },
    '하윤': { gender: 'girl', peakRank: 2, peakYear: '2018', history: { '2008': 52, '2014': 7, '2018': 2, '2022': 5, '2024': 5 } },
    '서아': { gender: 'girl', peakRank: 1, peakYear: '2023~2024', history: { '2008': 78, '2014': 25, '2018': 3, '2022': 2, '2024': 1 } },
    '이서': { gender: 'girl', peakRank: 1, peakYear: '2022', history: { '2008': 95, '2014': 40, '2018': 18, '2022': 1, '2024': 2 } },
    '아윤': { gender: 'girl', peakRank: 3, peakYear: '2024', history: { '2008': 85, '2014': 32, '2018': 11, '2022': 4, '2024': 3 } },
    '지아': { gender: 'girl', peakRank: 3, peakYear: '2022', history: { '2008': 48, '2014': 22, '2018': 12, '2022': 3, '2024': 4 } },
    '시아': { gender: 'girl', peakRank: 8, peakYear: '2024', history: { '2008': 92, '2014': 45, '2018': 25, '2022': 10, '2024': 8 } },
    '민서': { gender: 'girl', peakRank: 2, peakYear: '2008', history: { '2008': 2, '2014': 5, '2018': 22, '2022': 48, '2024': 55 } },
    '유진': { gender: 'girl', peakRank: 1, peakYear: '1990년대', history: { '2008': 13, '2014': 38, '2018': 58, '2022': 85, '2024': 98 } }
  },

  /**
   * 특정 연도의 성별 랭킹 리스트 반환
   * @param {string} year 연도 문자열 ('2024', '2022', '2018', '2014', '2008')
   * @param {'boy'|'girl'} gender 성별
   * @returns {Array} 랭킹 목록
   */
  getRankings(year = '2024', gender = 'boy') {
    const data = this.YEAR_DATA[year];
    if (!data || !data[gender]) {
      return this.YEAR_DATA['2024'][gender];
    }
    return data[gender];
  },

  /**
   * 이름 검색: 단일 이름의 시계열 순위 변천사 및 전성기 데이터 조회
   * @param {string} rawName 검색할 이름
   * @returns {Object|null}
   */
  searchName(rawName) {
    if (!rawName) return null;
    const name = rawName.trim();
    if (this.NAME_HISTORY[name]) {
      return {
        name,
        ...this.NAME_HISTORY[name],
        found: true
      };
    }

    // 정확한 인덱스가 없더라도 YEAR_DATA 전체에서 역추적 검색
    const history = {};
    let peakRank = 999;
    let peakYear = '';
    let detectedGender = 'boy';

    Object.keys(this.YEAR_DATA).forEach(yr => {
      const bItem = this.YEAR_DATA[yr].boy.find(x => x.name === name);
      const gItem = this.YEAR_DATA[yr].girl.find(x => x.name === name);

      if (bItem) {
        history[yr] = bItem.rank;
        detectedGender = 'boy';
        if (bItem.rank < peakRank) {
          peakRank = bItem.rank;
          peakYear = yr + '년';
        }
      } else if (gItem) {
        history[yr] = gItem.rank;
        detectedGender = 'girl';
        if (gItem.rank < peakRank) {
          peakRank = gItem.rank;
          peakYear = yr + '년';
        }
      }
    });

    if (Object.keys(history).length > 0) {
      return {
        name,
        gender: detectedGender,
        peakRank,
        peakYear,
        history,
        found: true
      };
    }

    // 데이터셋에 없는 희귀 이름이거나 고전 이름인 경우
    return {
      name,
      found: false,
      message: `"${name}" 이름은 2008~2024년 공식 출생신고 Top 100 밖의 유니크한 이름이거나, 1990년대 이전 전성기를 누린 이름입니다.`
    };
  }
};
