/**
 * ==========================================================================
 * [라이프·일상생활] 🎪 아이와 가볼만한 곳 축제/행사 달력 엔진 (logic.js)
 * --------------------------------------------------------------------------
 * 1. 전국 8개 권역 (서울·경기 메인, 인천·강원·충청·전라·경상·제주) 40대 대표 가을 가족 축제
 * 2. 10월·11월 날짜 매핑 및 월~일 달력 일자별 축제 조회
 * 3. 키워드 실시간 통합 검색 (축제명, 장소, 체험 프로그램, 테마)
 * 4. 테마별 필터 (가을꽃·단풍 / 어린이·체험 / 먹거리·수확 / 빛·불꽃 / 무료입장)
 * 5. 외부 축제 데이터(JSON/공공데이터) 안전한 확장 및 병합 인터페이스
 * ==========================================================================
 */

export const KidsOutingLogic = {
  /**
   * 전국 공식 가을 가족 축제 & 체험 40선 빅데이터베이스
   */
  FESTIVALS_DATA: [
    // ------------------------------------------------------------------------
    // [서울 권역]
    // ------------------------------------------------------------------------
    {
      id: 'seoul-autumn-book',
      title: '서울 가을 북페스티벌',
      region: '서울',
      theme: 'kids',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      periodText: '10월 24일(토) ~ 25일(일)',
      location: '서울 야외 광장 및 도서관 일대',
      program: '어린이 야외 독서존, 그림책 작가와의 만남, 구연동화 체험',
      link: 'https://lib.seoul.go.kr',
      tagColor: 'blue',
      fee: '무료 관람 (일부 체험 사전신청)',
      icon: '📚',
      isFree: true,
      desc: '서울 도심 야외 잔디밭에서 아이와 함께 뒹굴며 책을 읽고 유명 그림책 작가를 직접 만나는 가을 대표 책 축제입니다.'
    },
    {
      id: 'seoul-silver-grass',
      title: '서울 억새축제',
      region: '서울',
      theme: 'nature',
      startDate: '2026-10-17',
      endDate: '2026-10-23',
      periodText: '10월 17일(토) ~ 23일(금)',
      location: '서울 마포구 월드컵공원 하늘공원 일대',
      program: '은빛 억새 미로길 산책, 맹꽁이 전기차 타기, 소원 바위 포토존',
      link: 'https://parks.seoul.go.kr',
      tagColor: 'green',
      fee: '무료 관람 (맹꽁이차 별도)',
      icon: '🌾',
      isFree: true,
      desc: '하늘과 맞닿은 언덕 위에서 은빛 억새 물결을 감상하며 아이와 함께 맹꽁이 전기차를 타고 가을 소풍을 즐길 수 있습니다.'
    },
    {
      id: 'seoul-light-island',
      title: '서울라이트 한강 빛섬축제',
      region: '서울',
      theme: 'light',
      startDate: '2026-10-02',
      endDate: '2026-10-11',
      periodText: '10월 2일(금) ~ 11일(일)',
      location: '서울 영등포구 여의도 한강공원 일원',
      program: '레이저 아트쇼, 야간 인터랙티브 미디어아트, 한강 야경 피크닉',
      link: 'https://hangang.seoul.go.kr',
      tagColor: 'purple',
      fee: '무료 관람',
      icon: '✨',
      isFree: true,
      desc: '여의도 한강변 밤하늘을 환상적인 레이저와 빛으로 수놓는 가을 대표 야간 미디어아트 축제입니다.'
    },
    {
      id: 'seoul-nowon-moonlight',
      title: '노원 달빛산책',
      region: '서울',
      theme: 'light',
      startDate: '2026-10-16',
      endDate: '2026-11-08',
      periodText: '10월 16일(금) ~ 11월 8일(일)',
      location: '서울 노원구 당현천 수변 일대',
      program: '당현천 수변 한지 등 조형물 감상, 어린이 달빛 공예 공방, 달빛 포토존',
      link: 'https://www.nowonarts.kr',
      tagColor: 'orange',
      fee: '무료 관람',
      icon: '🌕',
      isFree: true,
      desc: '졸졸 흐르는 당현천 물길을 따라 환상적인 등불 예술 작품을 감상하며 온 가족이 선선한 밤 산책을 즐기기 좋습니다.'
    },
    {
      id: 'seoul-gwangam-prehistoric',
      title: '강동 선사문화축제',
      region: '서울',
      theme: 'kids',
      startDate: '2026-10-16',
      endDate: '2026-10-18',
      periodText: '10월 16일(금) ~ 18일(일)',
      location: '서울 강동구 서울 암사동 유적 일원',
      program: '움집 만들기 체험, 원시 불 피우기, 선사 바비큐 구이, 캐릭터 거리 퍼레이드',
      link: 'https://sunsa.gangdong.go.kr',
      tagColor: 'orange',
      fee: '무료 입장 (체험비 일부)',
      icon: '⛺',
      isFree: true,
      desc: '교과서로만 보던 신석기 암사동 움집을 직접 만들어보고 원시인의 생활을 재미있는 놀이로 배우는 가족 역사 체험입니다.'
    },
    {
      id: 'seoul-lantern',
      title: '서울 빛초롱 축제',
      region: '서울',
      theme: 'light',
      startDate: '2026-11-06',
      endDate: '2026-11-22',
      periodText: '11월 6일(금) ~ 22일(일)',
      location: '서울 청계천 광교~장통교 일대',
      program: '빛 조형물 포토존, 캐릭터 등불 만들기 체험, 야간 가족 산책',
      link: 'https://korean.visitseoul.net',
      tagColor: 'blue',
      fee: '무료 관람',
      icon: '🏮',
      isFree: true,
      desc: '청계천 물길을 따라 환상적으로 불을 밝히는 한지 등불과 화려한 미디어아트 조형물이 늦가을 밤을 따스하게 수놓습니다.'
    },

    // ------------------------------------------------------------------------
    // [경기 권역]
    // ------------------------------------------------------------------------
    {
      id: 'yeoju-ogoknaru',
      title: '여주 오곡나루축제',
      region: '경기',
      theme: 'food',
      startDate: '2026-10-23',
      endDate: '2026-10-25',
      periodText: '10월 23일(금) ~ 25일(일)',
      location: '경기 여주 신륵사 관광지 일원',
      program: '초대형 장작불 군고구마 굽기, 전통 짚풀 공예, 동물 먹이 주기, 나루터 황포돛배',
      link: 'https://www.yeoju.go.kr',
      tagColor: 'orange',
      fee: '무료 입장 (체험비 별도)',
      icon: '🍠',
      isFree: true,
      desc: '남한강변에서 초대형 장작불에 군고구마를 직접 구워 먹고, 옛 나루터 전통 농경놀이와 가축 먹이주기를 즐길 수 있습니다.'
    },
    {
      id: 'goyang-flower',
      title: '고양 가을꽃축제',
      region: '경기',
      theme: 'nature',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      periodText: '10월 1일(목) ~ 31일(토)',
      location: '경기 고양 일산호수공원 일원',
      program: '어린이 테마 꽃밭 탐험, 수상 꽃자전거, 키즈 원예 교실, 야외 피크닉존',
      link: 'https://goyangflower.or.kr',
      tagColor: 'green',
      fee: '무료 관람',
      icon: '🌼',
      isFree: true,
      desc: '일산호수공원의 가을 정취 속에서 화려한 가을꽃 조형물과 아이들을 위한 다양한 자연 놀이터를 만날 수 있습니다.'
    },
    {
      id: 'ansung-farmland',
      title: '안성팜랜드 코스목동축제',
      region: '경기',
      theme: 'nature',
      startDate: '2026-10-10',
      endDate: '2026-11-08',
      periodText: '10월 10일(토) ~ 11월 8일(일)',
      location: '경기 안성시 공도읍 안성팜랜드',
      program: '핑크뮬리·코스모스 언덕, 가축 먹이주기, 트랙터 마차 타기, 양떼 방목 공연',
      link: 'https://www.nhasland.com',
      tagColor: 'pink',
      fee: '소인 12,000원 / 대인 14,000원',
      icon: '🐑',
      isFree: false,
      desc: '끝없이 펼쳐진 분홍빛 핑크뮬리와 코스모스 구릉지에서 양, 염소, 토끼 등 귀여운 동물들과 교감하는 가족 목장 체험입니다.'
    },
    {
      id: 'suwon-arboretum',
      title: '수원수목원 가을꽃축제',
      region: '경기',
      theme: 'kids',
      startDate: '2026-10-24',
      endDate: '2026-10-24',
      periodText: '10월 24일(토) 단하루 (09:30~21:00)',
      location: '경기 수원 일월수목원 잔디마당 및 주제정원',
      program: '목공 놀이터, 허브 향주머니 만들기, 압화 열쇠고리 공방, 가든 키즈 음악회',
      link: 'https://suwon.go.kr',
      tagColor: 'green',
      fee: '무료 입장 (체험 일부 유료)',
      icon: '🌳',
      isFree: true,
      desc: '가을 단풍이 물든 잔디마당에서 뚝딱뚝딱 목공 놀이와 향긋한 허브 체험을 온 가족이 함께 즐길 수 있습니다.'
    },
    {
      id: 'suwon-korean-pancake',
      title: '수원 전국 전 축제',
      region: '경기',
      theme: 'food',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      periodText: '10월 24일(토) ~ 25일(일)',
      location: '경기 수원시 만석공원 잔디광장',
      program: '우리가족 창작 전 경연, 날아라 전 프라이팬 뒤집기 대회, 전통 떡메치기',
      link: 'https://suwon.go.kr',
      tagColor: 'orange',
      fee: '무료 입장',
      icon: '🍳',
      isFree: true,
      desc: '팔도의 맛있는 부침개를 맛보고, 프라이팬 뒤집기 등 아이들과 함께 배꼽 잡고 웃을 수 있는 유쾌한 잔칫날입니다.'
    },
    {
      id: 'suwon-rice-dessert',
      title: '경기미 디저트 페스타',
      region: '경기',
      theme: 'food',
      startDate: '2026-11-21',
      endDate: '2026-11-22',
      periodText: '11월 21일(토) ~ 22일(일)',
      location: '경기 수원역 수원메쎄(Messe) 실내홀',
      program: '어린이 쌀쿠키 만들기, 쌀떡 케이크 쿠킹 클래스, 전국 쌀 디저트 시식',
      link: 'https://suwonmesse.com',
      tagColor: 'orange',
      fee: '무료 입장 (체험 사전예약)',
      icon: '🍪',
      isFree: true,
      desc: '우리 쌀로 만드는 고소한 쌀쿠키와 케이크를 아이 손으로 직접 구워보는 실내 키즈 베이킹 축제입니다.'
    },
    {
      id: 'yeoju-kimchi-fest',
      title: '여주 산북 AI 김장문화축제',
      region: '경기',
      theme: 'food',
      startDate: '2026-11-07',
      endDate: '2026-11-08',
      periodText: '11월 7일(토) ~ 8일(일)',
      location: '경기 여주시 산북면 일원',
      program: '온 가족 친환경 김장 담그기, 가마솥 수육 시식, 인절미 떡메치기 체험',
      link: 'https://www.yeoju.go.kr',
      tagColor: 'orange',
      fee: '무료 관람 (김장패키지 별도)',
      icon: '🥬',
      isFree: true,
      desc: '갓 수확한 싱싱한 배추로 가족만의 김치를 담그고 갓 삶은 수육과 쫄깃한 인절미를 함께 나눠 먹는 훈훈한 겨울나기 체험입니다.'
    },
    {
      id: 'paju-dmz-open',
      title: '파주 DMZ OPEN 평화누리 페스티벌',
      region: '경기',
      theme: 'kids',
      startDate: '2026-10-12',
      endDate: '2026-11-29',
      periodText: '10월 12일 ~ 11월 29일 (상설)',
      location: '경기 파주 임진각 평화누리 일원',
      program: '바람개비 언덕 연날리기, 평화누리 잔디 피크닉, 평화 DMZ 생태 탐방',
      link: 'https://gg.go.kr',
      tagColor: 'blue',
      fee: '무료 입장',
      icon: '🪁',
      isFree: true,
      desc: '수천 개의 오색 바람개비가 돌아가는 넓은 언덕에서 아이와 함께 연을 날리고 평화의 소중함을 배우는 가을 여행지입니다.'
    },
    {
      id: 'anseong-namsadang',
      title: '안성 남사당 풍물 상설공연',
      region: '경기',
      theme: 'kids',
      startDate: '2026-10-03',
      endDate: '2026-11-29',
      periodText: '매주 토·일 주말 상설 공연',
      location: '경기 안성 남사당공연장',
      program: '아슬아슬 줄타기 묘기, 버나(접시) 돌리기, 상모돌리기 풍물놀이 체험',
      link: 'https://www.anseong.go.kr/tour',
      tagColor: 'purple',
      fee: '어린이 5,000원 / 성인 10,000원',
      icon: '🎭',
      isFree: false,
      desc: '유네스코 인류무형문화유산에 등재된 남사당놀이의 아찔한 줄타기와 신명 나는 풍물 장단을 눈앞에서 관람할 수 있습니다.'
    },

    // ------------------------------------------------------------------------
    // [인천 권역]
    // ------------------------------------------------------------------------
    {
      id: 'incheon-dreampark',
      title: '인천 드림파크 가을 축제',
      region: '인천',
      theme: 'nature',
      startDate: '2026-10-17',
      endDate: '2026-10-25',
      periodText: '10월 17일(토) ~ 25일(일)',
      location: '인천 서구 드림파크 야생화단지',
      program: '가을꽃(국화, 코스모스) 길 산책, 친환경 업사이클 체험 부스, 키즈 버스킹',
      link: 'https://www.slc.or.kr',
      tagColor: 'pink',
      fee: '무료 입장',
      icon: '🌸',
      isFree: true,
      desc: '축구장 수십 개 규모의 드넓은 야생화단지에서 만개한 국화와 코스모스를 배경으로 온 가족 인생샷을 남길 수 있습니다.'
    },
    {
      id: 'incheon-soraepogu',
      title: '인천 소래포구 축제',
      region: '인천',
      theme: 'food',
      startDate: '2026-10-09',
      endDate: '2026-10-11',
      periodText: '10월 9일(금) ~ 11일(일)',
      location: '인천 남동구 소래포구 해오름광장',
      program: '맨손 대하·꽃게 잡기 체험, 어린이 꽃게 낚시, 해안 드론 라이트쇼',
      link: 'https://www.namdong.go.kr',
      tagColor: 'blue',
      fee: '무료 입장 (체험 일부 유료)',
      icon: '🦀',
      isFree: true,
      desc: '바다 내음 가득한 소래포구에서 아이들이 직접 살아있는 꽃게와 대하를 잡아보고 바다 생태를 체험할 수 있습니다.'
    },

    // ------------------------------------------------------------------------
    // [강원 권역]
    // ------------------------------------------------------------------------
    {
      id: 'chuncheon-toy',
      title: '춘천 토이페스티벌',
      region: '강원',
      theme: 'kids',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      periodText: '10월 24일(토) ~ 25일(일)',
      location: '강원 춘천 애니메이션박물관 일대',
      program: '대형 캐릭터 퍼레이드, 장난감 만들기 공방, 야외 어린이 인형극, 레고 레이싱',
      link: 'https://www.gica.or.kr',
      tagColor: 'purple',
      fee: '야외 무료 (박물관 내부 관람 별도)',
      icon: '🧸',
      isFree: true,
      desc: '의암호수를 배경으로 아이들이 좋아하는 인기 애니메이션 캐릭터 퍼레이드와 나만의 장난감 만들기 공방이 열립니다.'
    },
    {
      id: 'wonju-ginkgo-fest',
      title: '원주 반계리 은행나무 축제',
      region: '강원',
      theme: 'nature',
      startDate: '2026-10-26',
      endDate: '2026-11-08',
      periodText: '10월 26일(월) ~ 11월 8일(일)',
      location: '강원 원주시 문막읍 반계리 1495-1',
      program: '800년 수령 황금 은행나무 포토존, 은행잎 책갈피 만들기, 숲속 버스킹',
      link: 'https://www.wonju.go.kr',
      tagColor: 'orange',
      fee: '무료 관람',
      icon: '🍂',
      isFree: true,
      desc: '천연기념물로 지정된 거대한 800년 황금 은행나무가 뿜어내는 가을의 경이로운 장관 속에서 가족 사진을 찍기 최고입니다.'
    },
    {
      id: 'pyeongchang-kimchi',
      title: '평창 고랭지 김장축제',
      region: '강원',
      theme: 'food',
      startDate: '2026-11-04',
      endDate: '2026-11-16',
      periodText: '11월 4일(수) ~ 16일(월)',
      location: '강원 평창군 진부면 송어축제장 일원',
      program: '평창 고랭지 배추 김장 담그기, 갓 삶은 수육 시식, 떡메치기 전통놀이',
      link: 'https://www.gimchifestival.com',
      tagColor: 'orange',
      fee: '무료 입장 (체험 패키지 유료)',
      icon: '🍲',
      isFree: true,
      desc: '달고 아삭한 평창 고랭지 배추와 우리 농산물로 온 가족이 1년치 김치를 직접 담가 포장해 가는 유익한 가족 체험입니다.'
    },
    {
      id: 'yanggu-punchbowl-apple',
      title: '양구 펀치볼 시래기·사과축제',
      region: '강원',
      theme: 'food',
      startDate: '2026-11-06',
      endDate: '2026-11-08',
      periodText: '11월 6일(금) ~ 8일(일)',
      location: '강원 양구군 해안면 펀치볼 힐링하우스',
      program: 'DMZ 꿀사과 따기 체험, 트랙터 마차 타기, 시래기 떡볶이 시식, 어린이 사과 낚시',
      link: 'https://www.yanggu.go.kr',
      tagColor: 'pink',
      fee: '무료 입장 (사과 수확 유료)',
      icon: '🍎',
      isFree: true,
      desc: '해발 500m 분지 펀치볼에서 당도 높은 사과를 직접 따보고, 트랙터 마차를 타며 청정 DMZ 자연을 탐방할 수 있습니다.'
    },

    // ------------------------------------------------------------------------
    // [충청 권역]
    // ------------------------------------------------------------------------
    {
      id: 'daejeon-science',
      title: '대전 사이언스 페스티벌',
      region: '충청',
      theme: 'kids',
      startDate: '2026-10-23',
      endDate: '2026-10-26',
      periodText: '10월 23일(금) ~ 26일(월)',
      location: '대전 엑스포시민광장 및 대전컨벤션센터(DCC)',
      program: '어린이 로봇 축구대회, 드론 조종 체험, VR/AR 미래 과학 놀이터, 과학 마술쇼',
      link: 'https://djsf.kr',
      tagColor: 'purple',
      fee: '무료 체험',
      icon: '🚀',
      isFree: true,
      desc: '대한민국 과학 수도 대전에서 열리는 최대 과학 축제로, 인공지능과 로봇을 직접 만지고 조종해보는 어린이들의 꿈의 놀이터입니다.'
    },
    {
      id: 'asan-pinnacle-chrysanthemum',
      title: '아산 피나클랜드 국화·불꽃축제',
      region: '충청',
      theme: 'nature',
      startDate: '2026-10-01',
      endDate: '2026-11-30',
      periodText: '10월 1일 ~ 11월 30일 (토요일 불꽃쇼)',
      location: '충남 아산시 영인면 피나클랜드 수목원',
      program: '수천만 송이 국화 터널, 알파카·사슴 먹이주기, 매주 토요일 밤 음악 불꽃축제',
      link: 'https://www.pinnacleland.co.kr',
      tagColor: 'orange',
      fee: '소인 11,000원 / 대인 13,000원',
      icon: '🎆',
      isFree: false,
      desc: '아름다운 수목원 언덕 가득 만개한 국화 꽃길을 산책하고, 토요일 밤 화려한 불꽃놀이와 귀여운 알파카를 만날 수 있습니다.'
    },
    {
      id: 'yesan-market-samguk',
      title: '예산장터 삼국축제',
      region: '충청',
      theme: 'food',
      startDate: '2026-10-22',
      endDate: '2026-10-25',
      periodText: '10월 22일(목) ~ 25일(일)',
      location: '충남 예산군 예산전통시장 일원',
      program: '화려한 국화꽃 조형물 전시, 백종원 시장 맛있는 먹거리 탐방, 가을 국수 만들기',
      link: 'https://www.yesan.go.kr',
      tagColor: 'orange',
      fee: '무료 입장',
      icon: '🍜',
      isFree: true,
      desc: '국화(菊)·국밥·국수 세 가지의 ‘국’을 즐기는 예산 대표 가을 축제로, 정겨운 전통시장 속 활기찬 가족 미식 여행입니다.'
    },
    {
      id: 'cheongju-cheongnamdae',
      title: '청남대 가을 국화축제',
      region: '충청',
      theme: 'nature',
      startDate: '2026-10-17',
      endDate: '2026-11-08',
      periodText: '10월 17일(토) ~ 11월 8일(일)',
      location: '충북 청주시 상당구 문의면 청남대 대통령별장',
      program: '대청호반 단풍 숲길 산책, 대통령 역사 퀴즈 런, 가족 마술쇼, 숲속 버스킹',
      link: 'https://chnam.chungbuk.go.kr',
      tagColor: 'green',
      fee: '어린이 3,000원 / 어른 5,000원',
      icon: '🍁',
      isFree: false,
      desc: '대통령 별장이었던 청남대에서 대청호의 절경과 오색 단풍, 향긋한 국화 향기를 맡으며 여유로운 가을 피크닉을 즐길 수 있습니다.'
    },
    {
      id: 'geumsan-ginseng',
      title: '금산 세계인삼축제',
      region: '충청',
      theme: 'kids',
      startDate: '2026-10-02',
      endDate: '2026-10-11',
      periodText: '10월 2일(금) ~ 11일(일)',
      location: '충남 금산군 인삼엑스포 광장',
      program: '어린이 인삼 캐기 체험, 인삼 비누·화장품 만들기, 건강 키즈 놀이터',
      link: 'https://www.insamfestival.co.kr',
      tagColor: 'green',
      fee: '무료 입장 (인삼 수확 별도)',
      icon: '🌿',
      isFree: true,
      desc: '밭에서 직접 흙을 파내며 싱싱한 인삼을 캐보고, 아이들의 눈높이에 맞춘 건강 과학 놀이들을 즐길 수 있습니다.'
    },
    {
      id: 'seosan-haemi-castle',
      title: '서산 해미읍성축제',
      region: '충청',
      theme: 'kids',
      startDate: '2026-10-09',
      endDate: '2026-10-11',
      periodText: '10월 9일(금) ~ 11일(일)',
      location: '충남 서산시 해미읍성 일원',
      program: '조선 시대 병영 훈련 체험, 성벽 쌓기 놀이, 옥사 감옥 체험, 전통 연날리기',
      link: 'https://www.seosan.go.kr',
      tagColor: 'blue',
      fee: '무료 입장',
      icon: '🏹',
      isFree: true,
      desc: '넓은 잔디밭과 조선 시대 성곽 안에서 활쏘기, 투호, 병영 훈련 등 아이들이 옛날 군사가 되어보는 역사 체험의 장입니다.'
    },

    // ------------------------------------------------------------------------
    // [전라 권역]
    // ------------------------------------------------------------------------
    {
      id: 'suncheon-reed',
      title: '순천만 갈대축제',
      region: '전라',
      theme: 'nature',
      startDate: '2026-10-24',
      endDate: '2026-10-31',
      periodText: '10월 24일(토) ~ 31일(토)',
      location: '전남 순천시 순천만습지 일원',
      program: '황금빛 갈대밭 생태 산책, 천연기념물 흑두루미 망원경 탐조, 자연물 공예',
      link: 'https://scbay.suncheon.go.kr',
      tagColor: 'orange',
      fee: '어린이 6,000원 / 성인 10,000원',
      icon: '🌾',
      isFree: false,
      desc: '끝없이 펼쳐진 황금빛 갈대숲 길을 걸으며 순천만을 찾아온 겨울 철새 흑두루미를 직접 관찰할 수 있는 대한민국 최고의 생태 축제입니다.'
    },
    {
      id: 'hampyeong-chrysanthemum',
      title: '함평 대한민국 국향대전',
      region: '전라',
      theme: 'nature',
      startDate: '2026-10-23',
      endDate: '2026-11-08',
      periodText: '10월 23일(금) ~ 11월 8일(일)',
      location: '전남 함평군 함평엑스포공원',
      program: '실제 크기 국화 광화문 조형물, 뽀로로·동물 국화 포토존, 키즈 버블 매직쇼',
      link: 'https://www.hampyeong.go.kr',
      tagColor: 'pink',
      fee: '어린이 3,000원 / 어른 7,000원',
      icon: '🌻',
      isFree: false,
      desc: '아이들이 좋아하는 만화 캐릭터와 거대한 숭례문이 모두 국화꽃으로 꾸며진 국내 최대 규모의 가을꽃 예술 대전입니다.'
    },
    {
      id: 'iksan-chrysanthemum',
      title: '익산 천만송이 국화축제',
      region: '전라',
      theme: 'nature',
      startDate: '2026-10-23',
      endDate: '2026-11-01',
      periodText: '10월 23일(금) ~ 11월 1일(일)',
      location: '전북 익산시 중앙체육공원 일원',
      program: '백제 미륵사지 석탑 국화 조형물, 키즈 서커스 공연, 압화 책갈피 만들기',
      link: 'https://www.iksan.go.kr',
      tagColor: 'green',
      fee: '무료 관람 (실내 특별관 3,000원)',
      icon: '🌼',
      isFree: true,
      desc: '찬란한 백제 문화 유산 조형물과 천만 송이 국화의 진한 가을 향기를 온 가족이 함께 즐기며 추억을 쌓을 수 있습니다.'
    },
    {
      id: 'hwasun-dolmen-flower',
      title: '화순 고인돌 가을꽃 축제',
      region: '전라',
      theme: 'nature',
      startDate: '2026-10-17',
      endDate: '2026-10-25',
      periodText: '10월 17일(토) ~ 25일(일)',
      location: '전남 화순군 고인돌 유적지 일원',
      program: '선사 시대 고인돌 탐방, 핑크뮬리·해바라기 꽃밭 걷기, 원시 복장 체험',
      link: 'https://www.hwasun.go.kr',
      tagColor: 'pink',
      fee: '무료 관람',
      icon: '🗿',
      isFree: true,
      desc: '유네스코 세계문화유산 고인돌 유적지 사이로 화려하게 피어난 가을꽃을 감상하며 아이들과 여유롭게 뛰어놀 수 있습니다.'
    },
    {
      id: 'imsil-cheese-fest',
      title: '임실 N치즈축제',
      region: '전라',
      theme: 'food',
      startDate: '2026-10-08',
      endDate: '2026-10-11',
      periodText: '10월 8일(목) ~ 11일(일)',
      location: '전북 임실군 임실치즈테마파크 일원',
      program: '초대형 모짜렐라 치즈 늘리기, 화덕 피자 만들기, 치즈 퐁듀 시식, 바람의 언덕 썰매',
      link: 'https://www.imsilcheese.org',
      tagColor: 'orange',
      fee: '무료 입장 (체험 패키지 유료)',
      icon: '🧀',
      isFree: true,
      desc: '아이들이 환호하는 쭉쭉 늘어나는 고소한 생치즈를 직접 늘려보고, 나만의 수제 피자를 구워 먹는 최고의 가족 미식 축제입니다.'
    },
    {
      id: 'goheung-yuja-fest',
      title: '고흥 유자축제',
      region: '전라',
      theme: 'food',
      startDate: '2026-11-12',
      endDate: '2026-11-15',
      periodText: '11월 12일(목) ~ 15일(일)',
      location: '전남 고흥군 풍양면 유자 석류 공원',
      program: '황금빛 유자 따기 수확, 달콤한 수제 유자청 담그기, 유자 족욕 힐링, 유자 디저트 뷔페',
      link: 'https://www.goheung.go.kr',
      tagColor: 'orange',
      fee: '무료 관람 (수확 체험비 별도)',
      icon: '🍋',
      isFree: true,
      desc: '노랗게 익은 유자가 주렁주렁 열린 밭에서 상큼한 유자를 직접 따보고 감기 예방에 좋은 유자청을 만들어가는 실속 축제입니다.'
    },

    // ------------------------------------------------------------------------
    // [경상 권역]
    // ------------------------------------------------------------------------
    {
      id: 'goseong-dinosaur-expo',
      title: '경남고성 공룡세계엑스포',
      region: '경상',
      theme: 'kids',
      startDate: '2026-10-01',
      endDate: '2026-11-01',
      periodText: '10월 1일 ~ 11월 1일 (11월 초까지)',
      location: '경남 고성군 회화면 당항포관광지 일원',
      program: '실제 크기 움직이는 공룡 공원, 화석 발굴 체험관, 5D 공룡 실감 영상관, 공룡 퍼레이드',
      link: 'https://dino-expo.com',
      tagColor: 'purple',
      fee: '소인 12,000원 / 대인 18,000원',
      icon: '🦖',
      isFree: false,
      desc: '공룡을 사랑하는 모든 어린이들의 성지! 살아 숨 쉬듯 움직이는 거대 공룡들과 화석 발굴 놀이로 시간 가는 줄 모르는 축제입니다.'
    },
    {
      id: 'gimcheon-gimbap-fest',
      title: '김천 김밥축제',
      region: '경상',
      theme: 'food',
      startDate: '2026-10-23',
      endDate: '2026-10-25',
      periodText: '10월 23일(금) ~ 25일(일)',
      location: '경북 김천시 직지사 길 일원',
      program: '아이와 함께하는 이색 김밥 만들기, 전국 이색 김밥 맛보기, 소풍 피크닉존, 잔디밭 마술쇼',
      link: 'https://www.gc.go.kr',
      tagColor: 'orange',
      fee: '무료 입장',
      icon: '🍙',
      isFree: true,
      desc: '소풍의 상징이자 아이들의 소울푸드인 김밥을 주제로 펼쳐지는 깜찍한 축제로, 맛있는 김밥과 함께 가을 피크닉을 즐기기 좋습니다.'
    },
    {
      id: 'mungyeong-apple-fest',
      title: '문경 사과축제',
      region: '경상',
      theme: 'food',
      startDate: '2026-10-17',
      endDate: '2026-11-01',
      periodText: '10월 17일(토) ~ 11월 1일(일)',
      location: '경북 문경시 문경새재 도립공원 일원',
      program: '달콤한 꿀사과 따기 체험, 사과 껍질 길게 깎기 대회, 사과 파이 만들기, 단풍길 걷기',
      link: 'http://mgapple.or.kr',
      tagColor: 'pink',
      fee: '무료 입장 (사과 수확 별도)',
      icon: '🍎',
      isFree: true,
      desc: '문경새재의 고운 단풍 터널을 걷고, 햇살을 듬뿍 머금은 빨간 사과를 나무에서 직접 따서 한입 베어 무는 즐거움을 선사합니다.'
    },
    {
      id: 'jinju-yudeung-fest',
      title: '진주 남강유등축제',
      region: '경상',
      theme: 'light',
      startDate: '2026-10-03',
      endDate: '2026-10-18',
      periodText: '10월 3일(토) ~ 18일(일)',
      location: '경남 진주시 진주성 및 남강 일원',
      program: '남강 위에 띄우는 소망 유등 체험, 부교 걷기 체험, 대형 드론 라이트쇼, 불꽃놀이',
      link: 'https://yudeung.com',
      tagColor: 'blue',
      fee: '무료 관람 (부교 건너기 별도)',
      icon: '🏮',
      isFree: true,
      desc: '진주성과 남강 물결 위에 은은하게 떠 있는 수만 개의 오색 유등과 화려한 드론쇼가 아이들의 상상력을 자극하는 환상의 야경입니다.'
    },
    {
      id: 'busan-fireworks',
      title: '부산 불꽃축제 & 해변 키즈 페스타',
      region: '경상',
      theme: 'light',
      startDate: '2026-11-07',
      endDate: '2026-11-08',
      periodText: '11월 7일(토) ~ 8일(일)',
      location: '부산 광안리해수욕장 일대',
      program: '광안대교 초대형 해상 불꽃쇼, 캐릭터 버스킹, 백사장 모래놀이 존, 패밀리 플리마켓',
      link: 'https://www.bfo.or.kr',
      tagColor: 'purple',
      fee: '백사장 자유관람 무료',
      icon: '🎆',
      isFree: true,
      desc: '광안대교를 배경으로 밤하늘을 수놓는 아시아 최대 규모의 불꽃쇼와 함께 낮에는 다채로운 가족 버스킹과 놀이가 진행됩니다.'
    },
    {
      id: 'gyeongnam-arboretum-autumn',
      title: '경상남도수목원 단풍축제',
      region: '경상',
      theme: 'kids',
      startDate: '2026-10-31',
      endDate: '2026-11-22',
      periodText: '10월 31일 ~ 11월 22일 (주말 행사)',
      location: '경남 진주시 이반성면 경상남도수목원',
      program: '주말 키즈 버블쇼 & 벌룬쇼, 알록달록 낙엽 모빌 만들기, 숲속 자연 생태 관찰',
      link: 'https://tree.gyeongnam.go.kr',
      tagColor: 'green',
      fee: '어린이 500원 / 어른 1,500원',
      icon: '🍁',
      isFree: false,
      desc: '붉게 물든 미국풍나무길 단풍 산책과 더불어 주말마다 어린이들을 위한 신나는 비눗방울 쇼와 풍선 공연이 펼쳐집니다.'
    },

    // ------------------------------------------------------------------------
    // [제주 권역]
    // ------------------------------------------------------------------------
    {
      id: 'jeju-tangerine',
      title: '제주 국제감귤박람회',
      region: '제주',
      theme: 'food',
      startDate: '2026-11-13',
      endDate: '2026-11-17',
      periodText: '11월 13일(금) ~ 17일(화)',
      location: '제주 서귀포농업기술센터 일원',
      program: '황금빛 감귤 따기 체험, 감귤 디저트 쿠킹 클래스, 어린이 귤모자 만들기, 연날리기',
      link: 'http://www.jicexpo.com',
      tagColor: 'orange',
      fee: '미취학 아동 무료 / 성인 2,000원',
      icon: '🍊',
      isFree: false,
      desc: '주렁주렁 열린 노란 감귤밭에서 직접 감귤을 따서 맛보고, 아이들과 감귤 쿠키를 만드는 제주 대표 수확 체험입니다.'
    },
    {
      id: 'jeju-hueree-pinkmuhly',
      title: '제주 휴애리 핑크뮬리축제',
      region: '제주',
      theme: 'nature',
      startDate: '2026-10-01',
      endDate: '2026-11-15',
      periodText: '10월 1일 ~ 11월 15일 (매일 운영)',
      location: '제주 서귀포시 남원읍 휴애리 자연생활공원',
      program: '흑돼지 미끄럼틀 공연, 동물 먹이주기 체험, 핑크뮬리 정원 가족 스냅 촬영',
      link: 'https://hueree.com',
      tagColor: 'pink',
      fee: '어린이 9,000원 / 성인 13,000원',
      icon: '🐷',
      isFree: false,
      desc: '한라산 자락 아래 분홍빛 핑크뮬리와 동백꽃이 어우러지고, 귀여운 아기 흑돼지들의 미끄럼틀 쇼를 볼 수 있는 제주 인기 명소입니다.'
    }
  ],

  /**
   * 사용자가 가져오기(Import)한 추가 축제 목록
   */
  userImportedFestivals: [],

  /**
   * 로컬 스토리지에서 사용자 추가 축제 목록 복원
   */
  loadUserImportedFestivals() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('simulab_kids_custom_festivals');
      if (saved) {
        this.userImportedFestivals = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('사용자 축제 데이터 로드 실패:', e);
      this.userImportedFestivals = [];
    }
  },

  /**
   * 외부 축제 데이터 (JSON 형태)를 안전하게 병합 등록
   */
  importExternalEvents(newFestivals) {
    if (!Array.isArray(newFestivals)) return { success: false, count: 0 };
    
    let addedCount = 0;
    newFestivals.forEach(item => {
      // 필수 속성 유효성 검증
      if (item && item.title && item.startDate && item.endDate) {
        const safeItem = {
          id: item.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: String(item.title).slice(0, 50),
          region: item.region || '전국',
          theme: item.theme || 'kids',
          startDate: item.startDate,
          endDate: item.endDate,
          periodText: item.periodText || `${item.startDate} ~ ${item.endDate}`,
          location: item.location || '상세 주소 참고',
          program: item.program || '체험 프로그램 안내',
          link: item.link || '#',
          tagColor: item.tagColor || 'blue',
          fee: item.fee || '현장 문의',
          icon: item.icon || '🎪',
          isFree: item.isFree !== undefined ? !!item.isFree : (item.fee && item.fee.includes('무료')),
          desc: item.desc || '가족과 함께하는 특별한 축제입니다.'
        };
        this.userImportedFestivals.push(safeItem);
        addedCount++;
      }
    });

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('simulab_kids_custom_festivals', JSON.stringify(this.userImportedFestivals));
      } catch (e) {
        console.warn('사용자 축제 데이터 저장 실패:', e);
      }
    }

    return { success: true, count: addedCount };
  },

  /**
   * 전체 축제 목록 (기본 내장 40선 + 사용자 가져오기 축제 결합)
   */
  getAllFestivals() {
    return [...this.FESTIVALS_DATA, ...this.userImportedFestivals];
  },

  /**
   * 통합 검색 & 다중 필터 엔진
   * @param {Object} options
   * @param {number} options.year - 연도 (예: 2026)
   * @param {number} options.month - 월 (10 or 11)
   * @param {string} options.region - 지역 ('전체', '서울', '경기' 등)
   * @param {string} options.theme - 테마 ('all', 'nature', 'kids', 'food', 'light')
   * @param {boolean} options.onlyFree - 무료 입장 여부
   * @param {string} options.keyword - 검색어 (축제명, 장소, 프로그램 등)
   */
  searchFestivals({ year = 2026, month = 10, region = '전체', theme = 'all', onlyFree = false, keyword = '' } = {}) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const normalizedKeyword = keyword.trim().toLowerCase();

    return this.getAllFestivals().filter(ev => {
      // 1. 해당 월에 걸쳐 있는지 확인
      const inMonth = ev.startDate <= monthEnd && ev.endDate >= monthStart;
      if (!inMonth) return false;

      // 2. 지역 필터
      if (region !== '전체' && ev.region !== region) {
        return false;
      }

      // 3. 테마 필터
      if (theme !== 'all' && ev.theme !== theme) {
        return false;
      }

      // 4. 무료 전용 필터
      if (onlyFree && !ev.isFree) {
        return false;
      }

      // 5. 키워드 검색 (축제명, 장소, 주요 프로그램, 설명, 태그)
      if (normalizedKeyword) {
        const targetString = `${ev.title} ${ev.location} ${ev.program} ${ev.region} ${ev.desc}`.toLowerCase();
        if (!targetString.includes(normalizedKeyword)) {
          return false;
        }
      }

      return true;
    });
  },

  /**
   * 특정 날짜('YYYY-MM-DD')에 열리는 축제 목록 조회 (검색 조건 적용)
   */
  getEventsOnDate(dateStr, { region = '전체', theme = 'all', onlyFree = false, keyword = '' } = {}) {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return this.getAllFestivals().filter(ev => {
      // 일자 범위 포함 여부
      const onDay = ev.startDate <= dateStr && dateStr <= ev.endDate;
      if (!onDay) return false;

      if (region !== '전체' && ev.region !== region) return false;
      if (theme !== 'all' && ev.theme !== theme) return false;
      if (onlyFree && !ev.isFree) return false;

      if (normalizedKeyword) {
        const targetString = `${ev.title} ${ev.location} ${ev.program} ${ev.region} ${ev.desc}`.toLowerCase();
        if (!targetString.includes(normalizedKeyword)) return false;
      }

      return true;
    });
  }
};

// 초기화 시 사용자 데이터 로드
KidsOutingLogic.loadUserImportedFestivals();
