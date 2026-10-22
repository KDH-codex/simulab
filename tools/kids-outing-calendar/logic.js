/**
 * ==========================================================================
 * [라이프·일상생활] 🎪 아이와 가볼만한 곳 축제/행사 달력 엔진 (logic.js)
 * --------------------------------------------------------------------------
 * 1. 10월·11월 전국 가을 가족 축제 & 체험 빅데이터
 * 2. 권역별 (서울·경기 중심, 전국 도 단위) 필터링
 * 3. 월간 날짜 매핑 및 특정 일자 축제 조회
 * ==========================================================================
 */

export const KidsOutingLogic = {
  /**
   * 10월 ~ 11월 전국 공식 가족 축제 & 체험 데이터베이스
   */
  FESTIVALS_DATA: [
    {
      id: 'seoul-autumn-book',
      title: '서울 가을 북페스티벌',
      region: '서울',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      periodText: '10월 24일(토) ~ 25일(일)',
      location: '서울 야외 광장 및 도서관 일대',
      program: '어린이 야외 독서존, 그림책 작가와의 만남, 구연동화 체험',
      link: 'https://lib.seoul.go.kr',
      tagColor: 'blue',
      fee: '무료 관람 (일부 체험 사전신청)',
      icon: '📚',
      desc: '서울 도심 야외 잔디밭에서 아이와 함께 뒹굴며 책을 읽고 유명 그림책 작가를 직접 만나는 가을 대표 책 축제입니다.'
    },
    {
      id: 'incheon-dreampark',
      title: '인천 드림파크 가을 축제',
      region: '인천',
      startDate: '2026-10-17',
      endDate: '2026-10-25',
      periodText: '진행 중 (이번 주말 10.25까지)',
      location: '인천 서구 드림파크 야생화단지',
      program: '가을꽃(국화, 코스모스) 길 산책, 친환경 체험 부스, 버스킹 공연',
      link: 'https://www.slc.or.kr',
      tagColor: 'pink',
      fee: '무료 입장',
      icon: '🌸',
      desc: '축구장 수십 개 규모의 드넓은 야생화단지에서 만개한 국화와 코스모스를 배경으로 가족 인생샷을 남길 수 있습니다.'
    },
    {
      id: 'yeoju-ogoknaru',
      title: '여주 오곡나루축제',
      region: '경기',
      startDate: '2026-10-23',
      endDate: '2026-10-25',
      periodText: '10월 23일(금) ~ 25일(일)',
      location: '경기 여주 신륵사 관광지 일원',
      program: '군고구마 굽기 체험, 전통 농경문화 체험, 동물 먹이 주기',
      link: 'https://www.yeoju.go.kr',
      tagColor: 'orange',
      fee: '무료 입장 (체험비 별도)',
      icon: '🍠',
      desc: '남한강변에서 초대형 장작불에 군고구마를 직접 구워 먹고, 옛 나루터 전통 농경놀이와 가축 먹이주기를 즐길 수 있습니다.'
    },
    {
      id: 'chuncheon-toy',
      title: '춘천 토이페스티벌',
      region: '강원',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      periodText: '10월 24일(토) ~ 25일(일)',
      location: '강원 춘천 애니메이션박물관 일대',
      program: '대형 캐릭터 퍼레이드, 장난감 체험 및 제작, 인형극 공연',
      link: 'https://www.gica.or.kr',
      tagColor: 'purple',
      fee: '야외 무료 (박물관 내부 관람 별도)',
      icon: '🧸',
      desc: '의암호수를 배경으로 아이들이 좋아하는 인기 애니메이션 캐릭터 퍼레이드와 나만의 장난감 만들기 공방이 열립니다.'
    },
    {
      id: 'goyang-flower',
      title: '고양 가을꽃축제',
      region: '경기',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      periodText: '10월 1일(목) ~ 31일(토)',
      location: '경기 고양 일산호수공원 일원',
      program: '어린이 테마 꽃밭 탐험, 수상 꽃자전거, 키즈 원예 교실',
      link: 'https://goyangflower.or.kr',
      tagColor: 'green',
      fee: '무료 관람',
      icon: '🌼',
      desc: '일산호수공원의 가을 정취 속에서 화려한 가을꽃 조형물과 아이들을 위한 다양한 자연 놀이터를 만날 수 있습니다.'
    },
    {
      id: 'ansung-farmland',
      title: '안성팜랜드 코스목동축제',
      region: '경기',
      startDate: '2026-10-10',
      endDate: '2026-11-08',
      periodText: '10월 10일 ~ 11월 8일',
      location: '경기 안성시 공도읍 안성팜랜드',
      program: '핑크뮬리·코스모스 언덕, 가축 먹이주기, 트랙터 마차 타기',
      link: 'https://www.nhasland.com',
      tagColor: 'pink',
      fee: '소인 12,000원 / 대인 14,000원',
      icon: '🐑',
      desc: '끝없이 펼쳐진 분홍빛 핑크뮬리와 코스모스 구릉지에서 양, 염소, 토끼 등 귀여운 동물들과 교감하는 목장 체험입니다.'
    },
    {
      id: 'seoul-lantern',
      title: '서울 빛초롱 축제',
      region: '서울',
      startDate: '2026-11-06',
      endDate: '2026-11-22',
      periodText: '11월 6일(금) ~ 22일(일)',
      location: '서울 청계천 광교~장통교 일대',
      program: '빛 조형물 포토존, 캐릭터 등불 만들기 체험, 야간 가족 산책',
      link: 'https://korean.visitseoul.net',
      tagColor: 'blue',
      fee: '무료 관람',
      icon: '🏮',
      desc: '청계천 물길을 따라 환상적으로 불을 밝히는 한지 등불과 화려한 미디어아트 조형물이 가을밤을 수놓습니다.'
    },
    {
      id: 'suncheon-reed',
      title: '순천만 갈대축제',
      region: '전라',
      startDate: '2026-10-24',
      endDate: '2026-10-31',
      periodText: '10월 24일(토) ~ 31일(토)',
      location: '전남 순천만습지 일원',
      program: '갈대밭 생태체험, 흑두루미 탐조 투어, 자연물 공예 체험',
      link: 'https://scbay.suncheon.go.kr',
      tagColor: 'orange',
      fee: '성인 10,000원 / 어린이 6,000원',
      icon: '🌾',
      desc: '황금빛 갈대 물결이 장관을 이루는 대한민국 대표 생태 관광지에서 천연기념물 흑두루미를 관찰하는 생태 탐방로입니다.'
    },
    {
      id: 'iksan-chrysanthemum',
      title: '익산 천만송이 국화축제',
      region: '전라',
      startDate: '2026-10-23',
      endDate: '2026-11-01',
      periodText: '10월 23일(금) ~ 11월 1일(일)',
      location: '전북 익산 중앙체육공원',
      program: '국화 대형 캐릭터 포토존, 키즈 매직쇼, 압화 책갈피 체험',
      link: 'https://www.iksan.go.kr',
      tagColor: 'green',
      fee: '무료 입장 (특별전시관 3,000원)',
      icon: '🌻',
      desc: '백제 왕궁 조형물과 아이들이 좋아하는 캐릭터로 꾸며진 천만 송이 국화의 진한 가을 향기를 온 가족이 만끽할 수 있습니다.'
    },
    {
      id: 'daejeon-science',
      title: '대전 사이언스 페스티벌',
      region: '충청',
      startDate: '2026-10-23',
      endDate: '2026-10-26',
      periodText: '10월 23일(금) ~ 26일(월)',
      location: '대전 엑스포시민광장 및 DCC',
      program: '로봇 축구, 드론 조종 체험, 어린이 VR/AR 과학 놀이터',
      link: 'https://djsf.kr',
      tagColor: 'purple',
      fee: '무료 체험',
      icon: '🚀',
      desc: '대한민국 과학 수도 대전에서 열리는 최대 과학 축제로, 인공지능, 자율주행, 로봇을 직접 만지고 조종해보는 어린이 천국입니다.'
    },
    {
      id: 'busan-fireworks',
      title: '부산 불꽃축제 & 키즈 페스타',
      region: '경상',
      startDate: '2026-11-07',
      endDate: '2026-11-08',
      periodText: '11월 7일(토) ~ 8일(일)',
      location: '부산 광안리해수욕장 일대',
      program: '초대형 해상 불꽃쇼, 캐릭터 버스킹, 해변 플리마켓',
      link: 'https://www.bfo.or.kr',
      tagColor: 'blue',
      fee: '백사장 자유관람 무료',
      icon: '🎆',
      desc: '광안대교를 배경으로 밤하늘을 수놓는 아시아 최대 규모의 불꽃쇼와 함께 낮에는 다채로운 가족 버스킹과 놀이가 진행됩니다.'
    },
    {
      id: 'jeju-tangerine',
      title: '제주 국제감귤박람회',
      region: '제주',
      startDate: '2026-11-13',
      endDate: '2026-11-17',
      periodText: '11월 13일(금) ~ 17일(화)',
      location: '제주 서귀포농업기술센터',
      program: '황금 감귤 따기 체험, 감귤 디저트 쿠킹 클래스, 어린이 연날리기',
      link: 'http://www.jicexpo.com',
      tagColor: 'orange',
      fee: '일반 2,000원 / 미취학 아동 무료',
      icon: '🍊',
      desc: '주렁주렁 열린 노란 감귤밭에서 직접 감귤을 따서 맛보고, 아이들과 감귤 쿠키를 만드는 제주 대표 수확 체험입니다.'
    }
  ],

  /**
   * 특정 연도와 월, 지역 필터에 해당하는 축제 목록 조회
   */
  getEventsForMonth(year = 2026, month = 10, regionFilter = '전체') {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return this.FESTIVALS_DATA.filter(ev => {
      if (regionFilter !== '전체' && ev.region !== regionFilter) {
        return false;
      }
      return ev.startDate <= monthEnd && ev.endDate >= monthStart;
    });
  },

  /**
   * 특정 날짜('YYYY-MM-DD')에 열리는 축제 목록 조회
   */
  getEventsOnDate(dateStr, regionFilter = '전체') {
    return this.FESTIVALS_DATA.filter(ev => {
      if (regionFilter !== '전체' && ev.region !== regionFilter) {
        return false;
      }
      return ev.startDate <= dateStr && dateStr <= ev.endDate;
    });
  }
};
