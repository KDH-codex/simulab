/**
 * ==========================================================================
 * [라이프·일상생활] 🎪 아이와 가볼만한 곳 축제/행사 달력 엔진 (logic.js)
 * --------------------------------------------------------------------------
 * 1. 유아·어린이 동반 가족을 위한 역동적이고 재미있는 전국 40대 핫 페스티벌
 *    (드론 레이싱, 바베큐 페스티벌, 나이트 페스타, 마술, 레고랜드, 캠핑, 불꽃쇼 등)
 * 2. 10월·11월 날짜 매핑 및 월~일 달력 일자별 축제 조회
 * 3. 키워드 실시간 통합 검색 (축제명, 장소, 체험 프로그램, 테마)
 * 4. 테마별 필터 (가을꽃·단풍 / 어린이·체험 / 먹거리·수확 / 빛·불꽃 / 무료입장)
 * 5. 외부 축제 데이터(JSON/공공데이터) 안전한 확장 및 병합 인터페이스
 * ==========================================================================
 */

export const KidsOutingLogic = {
  /**
   * 전국 공식 핫 페스티벌 & 이색 가족 축제 40선 빅데이터베이스
   */
  FESTIVALS_DATA: [
    // ------------------------------------------------------------------------
    // [서울 권역 - 트렌디 & 이색 페스티벌]
    // ------------------------------------------------------------------------
    {
      id: 'seoul-nanji-bbq',
      title: '서울 난지 캠핑 바베큐 페스티벌',
      region: '서울',
      theme: 'food',
      startDate: '2026-10-23',
      endDate: '2026-10-25',
      periodText: '10월 23일(금) ~ 25일(일)',
      location: '서울 마포구 난지한강공원 캠핑장 잔디마당',
      program: '초대형 텍사스 바베큐 그릴쇼, 우리가족 꼬치구이 만들기, 키즈 쿠킹 클래스, 잔디밭 인디 버스킹',
      link: 'https://hangang.seoul.go.kr',
      tagColor: 'orange',
      fee: '입장 무료 (바베큐 패키지 예약제)',
      icon: '🍖',
      isFree: true,
      desc: '한강 바람을 맞으며 온 가족이 두툼한 고기를 직접 굽고, 아이들은 마시멜로 퐁듀와 미니 수제버거를 만들어보는 서울 대표 가을 캠핑 페스티벌입니다.'
    },
    {
      id: 'seoul-drone-racing-cup',
      title: '2026 서울 국제 드론 레이싱 월드컵 & 라이트쇼',
      region: '서울',
      theme: 'kids',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      periodText: '10월 24일(토) ~ 25일(일)',
      location: '서울 송파구 올림픽공원 평화의광장 일원',
      program: '세계 최고 파일럿 초고속 FPV 드론 레이싱 경기, 어린이 드론 조종 체험교실, 1,000대 군집 드론 라이트쇼',
      link: 'https://korean.visitseoul.net',
      tagColor: 'purple',
      fee: '무료 관람 (체험존 현장접수)',
      icon: '🛸',
      isFree: true,
      desc: '시속 150km가 넘는 짜릿한 드론 레이싱을 눈앞에서 관람하고, 아이들이 안전망 안에서 직접 드론을 조종하며 비행 원리를 배우는 첨단 미래 축제입니다.'
    },
    {
      id: 'seoul-namsan-night-fest',
      title: '2026 남산 나이트 페스티벌',
      region: '서울',
      theme: 'light',
      startDate: '2026-10-16',
      endDate: '2026-10-18',
      periodText: '10월 16일(금) ~ 18일(일)',
      location: '서울 중구 남산골한옥마을 & N서울타워 일대',
      program: '야광 페이스페인팅, 숲속 달빛 보물찾기 랠리, 한옥 미디어파사드 레이저쇼, 야간 가족 숲 트레킹',
      link: 'https://www.hanokmaeul.or.kr',
      tagColor: 'blue',
      fee: '무료 관람',
      icon: '🌃',
      isFree: true,
      desc: '서울의 상징 남산에서 펼쳐지는 가을밤의 환상 축제! 알록달록 야광 분장을 하고 숲속 요정을 찾는 보물찾기와 화려한 한옥 조명 쇼가 펼쳐집니다.'
    },
    {
      id: 'seoul-banpo-pizza-festa',
      title: '한강 피크닉 & 수제피자·푸드트럭 페스타',
      region: '서울',
      theme: 'food',
      startDate: '2026-10-10',
      endDate: '2026-10-11',
      periodText: '10월 10일(토) ~ 11일(일)',
      location: '서울 서초구 반포한강공원 달빛광장',
      program: '화덕 피자 토핑 체험, 키즈 주스 만들기, 한강 돗자리 버블 매직쇼, 달빛무지개분수 야간 관람',
      link: 'https://hangang.seoul.go.kr',
      tagColor: 'orange',
      fee: '무료 입장 (음식 개별 구매)',
      icon: '🍕',
      isFree: true,
      desc: '시원한 한강변 잔디밭에 돗자리를 펴고 전국 유명 청년 푸드트럭의 맛있는 피자와 간식을 맛보며 마술쇼와 무지개분수를 즐기는 감성 피크닉입니다.'
    },
    {
      id: 'seoul-seongsu-toy-dessert',
      title: '성수 팝업 디저트 & 키즈 토이 페스타',
      region: '서울',
      theme: 'kids',
      startDate: '2026-11-13',
      endDate: '2026-11-15',
      periodText: '11월 13일(금) ~ 15일(일)',
      location: '서울 성동구 성수동 에스팩토리 복합문화공간',
      program: '초콜릿 퐁듀 퐁당 공방, 인기 캐릭터 한정판 굿즈 팝업스토어, 레고 브릭 플레이존, 캡슐 토이 뽑기',
      link: 'https://korean.visitseoul.net',
      tagColor: 'pink',
      fee: '입장료 5,000원 (미취학 아동 무료)',
      icon: '🍫',
      isFree: false,
      desc: 'MZ세대의 핫플레이스 성수동에서 아이들이 좋아하는 달콤한 디저트와 최신 인기 캐릭터 피규어, 장난감을 한곳에서 만나는 실내 테마 페스타입니다.'
    },
    {
      id: 'seoul-autumn-book',
      title: '서울 가을 북페스티벌 & 그림책 피크닉',
      region: '서울',
      theme: 'kids',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      periodText: '10월 24일(토) ~ 25일(일)',
      location: '서울 중구 서울시청 앞 서울광장 야외 잔디밭',
      program: '빈백 소파 야외 독서존, 인기 그림책 작가 낭독회, 키즈 인형극, 나만의 팝업북 만들기',
      link: 'https://lib.seoul.go.kr',
      tagColor: 'blue',
      fee: '무료 관람',
      icon: '📚',
      isFree: true,
      desc: '도심 한가운데 푹신한 빈백에 누워 아이와 동화책을 읽고 재미있는 인형극과 작가님과의 특별한 대화를 나누는 가을 힐링 책 축제입니다.'
    },
    {
      id: 'seoul-light-island',
      title: '서울라이트 한강 빛섬 레이저 페스타',
      region: '서울',
      theme: 'light',
      startDate: '2026-10-02',
      endDate: '2026-10-11',
      periodText: '10월 2일(금) ~ 11일(일)',
      location: '서울 영등포구 여의도 한강공원 일원',
      program: '초대형 3D 레이저 쇼, 빛 반응 인터랙티브 놀이터, 발광 조명 그네 포토존',
      link: 'https://hangang.seoul.go.kr',
      tagColor: 'purple',
      fee: '무료 관람',
      icon: '✨',
      isFree: true,
      desc: '여의도 밤하늘을 수놓는 환상적인 3D 레이저와 아이들의 발걸음에 반응해 색이 바뀌는 빛 놀이터가 마법 같은 저녁을 선사합니다.'
    },
    {
      id: 'seoul-lantern',
      title: '서울 빛초롱 & 광화문 등불 페스타',
      region: '서울',
      theme: 'light',
      startDate: '2026-11-06',
      endDate: '2026-11-22',
      periodText: '11월 6일(금) ~ 22일(일)',
      location: '서울 청계천 광교~장통교 및 광화문광장',
      program: '대형 캐릭터 한지 등불 관람, 나만의 소망 등불 띄우기, 전통 등 만들기 체험 공방',
      link: 'https://korean.visitseoul.net',
      tagColor: 'blue',
      fee: '무료 관람',
      icon: '🏮',
      isFree: true,
      desc: '청계천 물길을 따라 뽀로로, 로보카폴리 등 아이들이 사랑하는 캐릭터와 전통 전설 속 동물들이 환하게 빛나는 도심 최고의 야경 축제입니다.'
    },

    // ------------------------------------------------------------------------
    // [경기 권역 - 테마파크 & 액티비티 페스타]
    // ------------------------------------------------------------------------
    {
      id: 'everland-autumn-fest',
      title: '용인 에버랜드 가을 어텀 페스타 & 카니발 퍼레이드',
      region: '경기',
      theme: 'kids',
      startDate: '2026-10-01',
      endDate: '2026-11-15',
      periodText: '10월 1일 ~ 11월 15일 (매일 진행)',
      location: '경기 용인시 포곡읍 에버랜드 리조트',
      program: '가을 숲 요정 카니발 퍼레이드, 로스트밸리 초식동물 먹이주기, 야외 달빛 레이저 불꽃쇼',
      link: 'https://www.everland.com',
      tagColor: 'pink',
      fee: '에버랜드 자유이용권 (제휴카드 할인)',
      icon: '🎡',
      isFree: false,
      desc: '단풍으로 물든 테마파크에서 화려한 캐릭터 퍼레이드와 사파리 동물 친구들을 만나고 밤에는 음악과 함께 터지는 웅장한 불꽃놀이를 만끽하세요.'
    },
    {
      id: 'kintex-mobility-supercar',
      title: '킨텍스 미래 모빌리티 & 키즈 슈퍼카 모터쇼',
      region: '경기',
      theme: 'kids',
      startDate: '2026-10-16',
      endDate: '2026-10-18',
      periodText: '10월 16일(금) ~ 18일(일)',
      location: '경기 고양시 일산서구 킨텍스(KINTEX) 제1전시장',
      program: '전설의 슈퍼카 탑승 포토존, 어린이 전동 레이싱 카트 서킷 체험, AI 자율주행 미니버스 시승',
      link: 'https://www.kintex.com',
      tagColor: 'blue',
      fee: '어린이 8,000원 / 성인 12,000원',
      icon: '🏎️',
      isFree: false,
      desc: '자동차를 사랑하는 아이들의 심장을 뛰게 할 슈퍼카 전시회! 직접 운전해보는 전동 카트 레이싱과 신기한 미래 로봇차를 타볼 수 있습니다.'
    },
    {
      id: 'jarasum-camping-jazz',
      title: '가평 자라섬 가을 캠핑 & 피크닉 페스타',
      region: '경기',
      theme: 'kids',
      startDate: '2026-10-16',
      endDate: '2026-10-18',
      periodText: '10월 16일(금) ~ 18일(일)',
      location: '경기 가평군 자라섬 중도 잔디광장',
      program: '잔디밭 돗자리 패밀리 피크닉, 키즈 잔디 썰매장, 야외 모닥불 마시멜로 굽기, 가을 어쿠스틱 라이브',
      link: 'https://www.jarasum.net',
      tagColor: 'green',
      fee: '일부 유료 (피크닉존 사전예매)',
      icon: '⛺',
      isFree: false,
      desc: '북한강변 드넓은 잔디밭에 텐트와 돗자리를 펴고 신나는 잔디 썰매를 타며 온 가족이 여유롭게 음악과 가을 낭만을 누리는 축제입니다.'
    },
    {
      id: 'seoul-grandpark-camping',
      title: '과천 서울대공원 가을 캠핑 & 별빛 나이트 투어',
      region: '경기',
      theme: 'kids',
      startDate: '2026-10-23',
      endDate: '2026-10-25',
      periodText: '10월 23일(금) ~ 25일(일)',
      location: '경기 과천시 서울대공원 캠핑장 및 동물원',
      program: '밤의 동물원 생태 탐험, 야간 곤충 플래시 투어, 야외 잔디밭 가족 보물찾기, 숲속 바베큐',
      link: 'https://grandpark.seoul.go.kr',
      tagColor: 'purple',
      fee: '캠핑장 이용료 (사전예약)',
      icon: '🦁',
      isFree: false,
      desc: '낮에는 코끼리와 기린을 보고, 밤에는 손전등을 켜고 야행성 동물들의 신비로운 모습을 관찰하는 이색 자연 캠핑 프로그램입니다.'
    },
    {
      id: 'bucheon-biaf-animation',
      title: '부천 국제 애니메이션 페스티벌 (BIAF 키즈 페스타)',
      region: '경기',
      theme: 'kids',
      startDate: '2026-10-23',
      endDate: '2026-10-27',
      periodText: '10월 23일(금) ~ 27일(화)',
      location: '경기 부천시 한국만화박물관 & 부천아트센터',
      program: '전 세계 최신 키즈 애니메이션 무료 상영, 캐릭터 퍼레이드, 어린이 성우 더빙 체험 교실, 플리마켓',
      link: 'https://www.biaf.or.kr',
      tagColor: 'purple',
      fee: '야외 행사 무료 (극장 상영 일부 유료)',
      icon: '🎈',
      isFree: true,
      desc: '상상 속 만화 캐릭터들이 살아 움직이는 애니메이션 천국! 아이가 직접 만화영화 속 주인공 목소리를 녹음해보는 특별한 추억을 선물합니다.'
    },
    {
      id: 'yeoju-ogoknaru',
      title: '여주 오곡나루 군고구마 & 나루터 축제',
      region: '경기',
      theme: 'food',
      startDate: '2026-10-23',
      endDate: '2026-10-25',
      periodText: '10월 23일(금) ~ 25일(일)',
      location: '경기 여주 신륵사 관광지 일원',
      program: '길이 50m 초대형 장작불 군고구마 굽기, 전통 뗏목 타기, 가축 먹이주기 체험, 짚풀 놀이터',
      link: 'https://www.yeoju.go.kr',
      tagColor: 'orange',
      fee: '무료 입장 (체험비 별도)',
      icon: '🍠',
      isFree: true,
      desc: '남한강변에서 초대형 장작불에 노릇노릇 군고구마를 직접 구워 호호 불며 먹고, 옛 나루터 전통 배를 타보는 신나는 가을 장터입니다.'
    },
    {
      id: 'ansung-farmland',
      title: '안성팜랜드 핑크뮬리 & 키즈 목장 레이싱',
      region: '경기',
      theme: 'nature',
      startDate: '2026-10-10',
      endDate: '2026-11-08',
      periodText: '10월 10일(토) ~ 11월 8일(일)',
      location: '경기 안성시 공도읍 안성팜랜드',
      program: '핑크빛 핑크뮬리 언덕 탐험, 아기양·토끼 당근 주기, 트랙터 마차 투어, 어린이 전동카트 서킷',
      link: 'https://www.nhasland.com',
      tagColor: 'pink',
      fee: '소인 12,000원 / 대인 14,000원',
      icon: '🐑',
      isFree: false,
      desc: '끝없이 펼쳐진 분홍빛 핑크뮬리 동산에서 동물들과 함께 뛰놀고 신나는 트랙터 마차를 타며 인생 가족사진을 건질 수 있습니다.'
    },
    {
      id: 'goyang-flower',
      title: '고양 가을꽃축제 & 수상 꽃자전거',
      region: '경기',
      theme: 'nature',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      periodText: '10월 1일(목) ~ 31일(토)',
      location: '경기 고양 일산호수공원 일원',
      program: '호수 위 수상 꽃자전거 타기, 비밀의 숲 꽃터널 미로, 어린이 원예 공방, 야외 버스킹',
      link: 'https://goyangflower.or.kr',
      tagColor: 'green',
      fee: '무료 관람 (꽃자전거 별도)',
      icon: '🌼',
      isFree: true,
      desc: '넓은 일산호수 위에서 온 가족이 페달을 밟으며 꽃자전거를 타고, 가을꽃으로 만든 거대한 동물 조형물과 함께 산책을 즐겨보세요.'
    },

    // ------------------------------------------------------------------------
    // [인천 권역]
    // ------------------------------------------------------------------------
    {
      id: 'songdo-drone-food-festa',
      title: '인천 송도 드론 라이트 & 푸드트럭 페스타',
      region: '인천',
      theme: 'light',
      startDate: '2026-10-17',
      endDate: '2026-10-18',
      periodText: '10월 17일(토) ~ 18일(일)',
      location: '인천 연수구 송도달빛축제공원',
      program: '밤하늘을 수놓는 음악 드론쇼, 글로벌 키즈 푸드코트, 잔디밭 비눗방울 버블쇼, 플리마켓',
      link: 'https://www.yeonsu.go.kr',
      tagColor: 'purple',
      fee: '무료 관람',
      icon: '✨',
      isFree: true,
      desc: '송도의 미래적인 야경을 배경으로 음악에 맞춰 춤추는 드론쇼와 함께 잔디밭에서 맛있는 음식을 먹으며 힐링하는 가을밤의 축제입니다.'
    },
    {
      id: 'incheon-dreampark',
      title: '인천 드림파크 야생화 & 키즈 에코 페스티벌',
      region: '인천',
      theme: 'nature',
      startDate: '2026-10-17',
      endDate: '2026-10-25',
      periodText: '10월 17일(토) ~ 25일(일)',
      location: '인천 서구 드림파크 야생화단지',
      program: '축구장 40배 크기 가을꽃길 산책, 폐품을 활용한 친환경 정크아트 공방, 에코 버스킹',
      link: 'https://www.slc.or.kr',
      tagColor: 'pink',
      fee: '무료 입장',
      icon: '🌸',
      isFree: true,
      desc: '거대한 야생화 정원에서 코스모스와 국화를 실컷 구경하고, 버려진 장난감과 캔으로 나만의 예술작품을 만들어보는 친환경 놀이터입니다.'
    },

    // ------------------------------------------------------------------------
    // [강원 권역 - 어드벤처 & 천문 우주]
    // ------------------------------------------------------------------------
    {
      id: 'chuncheon-legoland-monster',
      title: '춘천 레고랜드 가을 몬스터 페스티벌',
      region: '강원',
      theme: 'kids',
      startDate: '2026-10-01',
      endDate: '2026-11-08',
      periodText: '10월 1일 ~ 11월 8일 (매일 운영)',
      location: '강원 춘천시 하중도길 레고랜드 코리아 리조트',
      program: '키즈 몬스터 코스튬 파티, 초대형 레고 호박 브릭 만들기, 트릭 오어 트릿 사탕 바구니 받기',
      link: 'https://www.legoland.kr',
      tagColor: 'orange',
      fee: '레고랜드 1일 이용권',
      icon: '🧱',
      isFree: false,
      desc: '아이들의 로망 레고랜드가 가을 몬스터 파티장으로 변신! 무섭지 않고 귀여운 몬스터 친구들과 춤추고 사탕을 받는 최고의 키즈 이벤트입니다.'
    },
    {
      id: 'chuncheon-toy',
      title: '춘천 토이페스티벌 & 캐릭터 퍼레이드',
      region: '강원',
      theme: 'kids',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      periodText: '10월 24일(토) ~ 25일(일)',
      location: '강원 춘천 애니메이션박물관 & 토이로봇관 일원',
      program: '대형 애니메이션 캐릭터 거리 행진, 나만의 나무 장난감 공방, 어린이 인형극, RC카 레이싱',
      link: 'https://www.gica.or.kr',
      tagColor: 'purple',
      fee: '야외 무료 (박물관 내부 별도)',
      icon: '🧸',
      isFree: true,
      desc: '의암호수를 배경으로 아이들이 좋아하는 인기 만화 캐릭터 퍼레이드와 장난감 공작소가 열려 온종일 웃음이 끊이지 않습니다.'
    },
    {
      id: 'yeongwol-star-space-fest',
      title: '영월 별마로 천문대 별빛 우주 페스티벌',
      region: '강원',
      theme: 'kids',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      periodText: '10월 24일(토) ~ 25일(일)',
      location: '강원 영월군 봉래산 정상 별마로천문대',
      program: '대형 망원경 토성 고리 & 가을 별자리 관측, 에어로켓 발사 대회, 천체투영관 가상 우주여행',
      link: 'https://www.yao.or.kr',
      tagColor: 'blue',
      fee: '천문대 예약 (야외 행사 무료)',
      icon: '🌌',
      isFree: false,
      desc: '해발 800m 봉래산 정상에서 쏟아질 듯한 밤하늘 은하수를 직접 눈으로 관찰하고 나만의 로켓을 밤하늘로 쏘아 올리는 감동적인 우주 캠프입니다.'
    },
    {
      id: 'pyeongchang-kimchi',
      title: '평창 고랭지 김장 & 가마솥 수육 패밀리 데이',
      region: '강원',
      theme: 'food',
      startDate: '2026-11-04',
      endDate: '2026-11-16',
      periodText: '11월 4일(수) ~ 16일(월)',
      location: '강원 평창군 진부면 송어축제장 일원',
      program: '아삭한 고랭지 배추 김장 담그기, 가마솥 즉석 수육 시식, 쫄깃한 인절미 떡메치기 체험',
      link: 'https://www.gimchifestival.com',
      tagColor: 'orange',
      fee: '무료 관람 (김장 패키지 유료)',
      icon: '🍲',
      isFree: true,
      desc: '아이들의 고사리손으로 직접 배추 양념을 버무려 1년 김치를 담그고, 갓 삶아낸 김이 모락모락 나는 가마솥 수육을 맛보는 든든한 가족 축제입니다.'
    },
    {
      id: 'yanggu-punchbowl-apple',
      title: '양구 펀치볼 DMZ 사과 따기 & 트랙터 마차',
      region: '강원',
      theme: 'food',
      startDate: '2026-11-06',
      endDate: '2026-11-08',
      periodText: '11월 6일(금) ~ 8일(일)',
      location: '강원 양구군 해안면 펀치볼 힐링하우스',
      program: '빨간 꿀사과 따기 체험, 덜컹덜컹 트랙터 마차 탐방, 사과 낚시 게임, 사과 파이 시식',
      link: 'https://www.yanggu.go.kr',
      tagColor: 'pink',
      fee: '무료 입장 (수확 체험 유료)',
      icon: '🍎',
      isFree: true,
      desc: '분지 지형의 청정 자연에서 자란 꿀사과를 나무에서 직접 똑 따서 맛보고, 트랙터 마차를 타고 DMZ 숲길을 달리는 이색 체험입니다.'
    },
    {
      id: 'wonju-ginkgo-fest',
      title: '원주 반계리 800년 황금 은행나무 인생샷 페스타',
      region: '강원',
      theme: 'nature',
      startDate: '2026-10-26',
      endDate: '2026-11-08',
      periodText: '10월 26일(월) ~ 11월 8일(일)',
      location: '강원 원주시 문막읍 반계리 1495-1',
      program: '웅장한 800년 은행나무 아래 가족 스냅 사진 촬영, 노란 은행잎 왕관 만들기, 숲속 버스킹',
      link: 'https://www.wonju.go.kr',
      tagColor: 'orange',
      fee: '무료 관람',
      icon: '🍂',
      isFree: true,
      desc: '어른 수십 명이 둘러싸야 할 만큼 거대한 천연기념물 황금 은행나무 아래에서 황금빛 카펫을 밟으며 영화 속 한 장면 같은 가족사진을 남기세요.'
    },

    // ------------------------------------------------------------------------
    // [충청 권역 - 테크 & 로봇 & 불꽃]
    // ------------------------------------------------------------------------
    {
      id: 'daejeon-science',
      title: '대전 사이언스 페스티벌 & 로봇 테크 파크',
      region: '충청',
      theme: 'kids',
      startDate: '2026-10-23',
      endDate: '2026-10-26',
      periodText: '10월 23일(금) ~ 26일(월)',
      location: '대전 엑스포시민광장 및 대전컨벤션센터(DCC)',
      program: '어린이 배틀로봇 축구대회, 자율주행 모빌리티 시승, 우주인 VR 무중력 체험, 신비한 과학 버블쇼',
      link: 'https://djsf.kr',
      tagColor: 'purple',
      fee: '무료 체험',
      icon: '🚀',
      isFree: true,
      desc: '로봇이 춤추고 인공지능이 그림을 그려주는 과학 수도 대전의 시그니처 축제! 아이들이 미래 과학자가 되어보는 흥미진진한 체험존이 가득합니다.'
    },
    {
      id: 'asan-pinnacle-chrysanthemum',
      title: '아산 피나클랜드 가을 국화 & 토요 음악 불꽃쇼',
      region: '충청',
      theme: 'light',
      startDate: '2026-10-01',
      endDate: '2026-11-30',
      periodText: '10월 1일 ~ 11월 30일 (매주 토요일 불꽃놀이)',
      location: '충남 아산시 영인면 피나클랜드 수목원',
      program: '수목원 언덕 국화꽃길 산책, 알파카 & 꽃사슴 먹이주기, 토요일 밤 8시 초대형 음악 불꽃축제',
      link: 'https://www.pinnacleland.co.kr',
      tagColor: 'orange',
      fee: '소인 11,000원 / 대인 13,000원',
      icon: '🎆',
      isFree: false,
      desc: '낮에는 귀여운 알파카에게 당근을 주고 만개한 국화밭을 걷다가, 토요일 밤에는 음악에 맞춰 밤하늘을 수놓는 화려한 불꽃놀이를 직관할 수 있습니다.'
    },
    {
      id: 'geumsan-ginseng',
      title: '금산 세계인삼축제 & 어린이 건강 어드벤처',
      region: '충청',
      theme: 'kids',
      startDate: '2026-10-02',
      endDate: '2026-10-11',
      periodText: '10월 2일(금) ~ 11일(일)',
      location: '충남 금산군 인삼엑스포 광장',
      program: '어린이 인삼 캐기 흙놀이 체험, 인삼 버블 비누 만들기, 건강 키즈 놀이터, 농악 퍼레이드',
      link: 'https://www.insamfestival.co.kr',
      tagColor: 'green',
      fee: '무료 입장 (수확 체험 일부)',
      icon: '🌿',
      isFree: true,
      desc: '직접 모종삽을 들고 흙을 파내어 굵직한 인삼을 쏙 뽑아보는 뿌듯한 자연 체험과 아이들을 위한 다양한 건강 게임이 진행됩니다.'
    },
    {
      id: 'seosan-haemi-castle',
      title: '서산 해미읍성 조선 병영 체험 축제',
      region: '충청',
      theme: 'kids',
      startDate: '2026-10-09',
      endDate: '2026-10-11',
      periodText: '10월 9일(금) ~ 11일(일)',
      location: '충남 서산시 해미읍성 잔디광장 일원',
      program: '조선 시대 무과 시험 활쏘기 체험, 옛날 감옥 옥사 체험, 잔디밭 대형 가오리연 날리기, 전통 무예 공연',
      link: 'https://www.seosan.go.kr',
      tagColor: 'blue',
      fee: '무료 입장',
      icon: '🏹',
      isFree: true,
      desc: '조선 시대 장수가 되어 성벽을 누비며 활을 쏘고 투호를 던지는 살아있는 역사 놀이터로, 넓은 잔디밭에서 연을 날리기 아주 좋습니다.'
    },

    // ------------------------------------------------------------------------
    // [경상 권역 - 매직 & 공룡 & 메가 불꽃]
    // ------------------------------------------------------------------------
    {
      id: 'busan-magic-festival',
      title: '부산 국제 매직 페스티벌 (키즈 일루션 매직쇼)',
      region: '경상',
      theme: 'kids',
      startDate: '2026-10-16',
      endDate: '2026-10-18',
      periodText: '10월 16일(금) ~ 18일(일)',
      location: '부산 해운대 구남로 야외무대 & 벡스코(BEXCO)',
      program: '세계 정상급 마술사 일루션 매직쇼, 길거리 코믹 서커스, 어린이 마술 공방 (나도 마술사)',
      link: 'https://www.hibimf.org',
      tagColor: 'purple',
      fee: '야외 거리 공연 무료 (갈라쇼 일부 유료)',
      icon: '🪄',
      isFree: true,
      desc: '비둘기가 나타나고 사람이 공중에 뜨는 신기한 마술 공연이 거리 곳곳에서 펼쳐지며, 아이들이 직접 간단한 트릭 마술을 배워볼 수 있습니다.'
    },
    {
      id: 'goseong-dinosaur-expo',
      title: '경남고성 공룡세계엑스포 & 화석 발굴',
      region: '경상',
      theme: 'kids',
      startDate: '2026-10-01',
      endDate: '2026-11-01',
      periodText: '10월 1일 ~ 11월 1일 (11월 초까지)',
      location: '경남 고성군 회화면 당항포관광지 일원',
      program: '실제 크기 움직이는 거대 공룡 공원, 모래 속 진짜 공룡 뼈 발굴 체험, 5D 공룡 입체 라이딩관, 공룡 퍼레이드',
      link: 'https://dino-expo.com',
      tagColor: 'purple',
      fee: '소인 12,000원 / 대인 18,000원',
      icon: '🦖',
      isFree: false,
      desc: '티라노사우루스가 으르렁거리며 눈앞에서 움직이는 국내 최대 공룡 테마파크! 공룡을 좋아하는 아이들에게는 평생 기억에 남을 꿈의 성지입니다.'
    },
    {
      id: 'daegu-naturepark-spooky',
      title: '대구 네이처파크 스푸키 할로윈 & 동물 탐험',
      region: '경상',
      theme: 'kids',
      startDate: '2026-10-10',
      endDate: '2026-11-08',
      periodText: '10월 10일 ~ 11월 8일 (주말 행사)',
      location: '대구 달성군 가창면 네이처파크 스파밸리',
      program: '스푸키 호박 정원 코스튬 런, 알파카 & 카피바라 야외 방목 먹이주기, 트릭 오어 트릿 스탬프 투어',
      link: 'http://spavalley.co.kr/naturepark',
      tagColor: 'orange',
      fee: '소인 14,000원 / 대인 18,000원',
      icon: '🎃',
      isFree: false,
      desc: '알록달록 예쁜 호박 조형물과 숲속 동물들이 어우러진 가을 숲 테마파크로, 아이들이 마녀나 히어로 옷을 입고 스탬프를 모으는 재미가 쏠쏠합니다.'
    },
    {
      id: 'busan-fireworks',
      title: '부산 불꽃축제 & 광안리 메가 드론쇼',
      region: '경상',
      theme: 'light',
      startDate: '2026-11-07',
      endDate: '2026-11-08',
      periodText: '11월 7일(토) ~ 8일(일)',
      location: '부산 수영구 광안리해수욕장 백사장 일원',
      program: '광안대교 해상 초대형 멀티 불꽃쇼, 2,000대 군집 드론 라이트 퍼포먼스, 해변 캐릭터 버스킹',
      link: 'https://www.bfo.or.kr',
      tagColor: 'blue',
      fee: '백사장 자유관람 무료',
      icon: '🎆',
      isFree: true,
      desc: '광안대교 밤바다 위로 쏟아지는 화려한 불꽃과 수천 대의 드론이 밤하늘에 그리는 빛의 그림이 아이들에게 잊지 못할 전율을 선사합니다.'
    },
    {
      id: 'gimcheon-gimbap-fest',
      title: '김천 김밥축제 & 잔디밭 소풍 피크닉',
      region: '경상',
      theme: 'food',
      startDate: '2026-10-23',
      endDate: '2026-10-25',
      periodText: '10월 23일(금) ~ 25일(일)',
      location: '경북 김천시 직지사 길 일원 잔디마당',
      program: '우리아이 이색 캐릭터 김밥 만들기, 전국 이색 김밥 시식 릴레이, 보물찾기 소풍 놀이, 벌룬쇼',
      link: 'https://www.gc.go.kr',
      tagColor: 'orange',
      fee: '무료 입장',
      icon: '🍙',
      isFree: true,
      desc: '아이들의 영원한 소풍 단짝 김밥을 테마로 열리는 이색 축제! 귀여운 판다 김밥을 직접 말고 가을바람 솔솔 부는 잔디밭에서 피크닉을 즐겨보세요.'
    },
    {
      id: 'jinju-yudeung-fest',
      title: '진주 남강유등축제 & 수상 부교 걷기',
      region: '경상',
      theme: 'light',
      startDate: '2026-10-03',
      endDate: '2026-10-18',
      periodText: '10월 3일(토) ~ 18일(일)',
      location: '경남 진주시 진주성 및 남강 일원',
      program: '남강 위에 띄우는 소망 유등 체험, 출렁출렁 물 위 부교 건너기, 야간 드론쇼, 불꽃놀이',
      link: 'https://yudeung.com',
      tagColor: 'blue',
      fee: '무료 관람 (부교 체험 별도)',
      icon: '🏮',
      isFree: true,
      desc: '남강 물결 위에 은은하게 떠 있는 수만 개의 오색 유등 사이로 물 위를 걷는 부교를 건너며 동화 속 세상으로 들어간 듯한 신비로운 밤을 경험하세요.'
    },
    {
      id: 'mungyeong-apple-fest',
      title: '문경 사과축제 & 새재 단풍 트레킹',
      region: '경상',
      theme: 'food',
      startDate: '2026-10-17',
      endDate: '2026-11-01',
      periodText: '10월 17일(토) ~ 11월 1일(일)',
      location: '경북 문경시 문경새재 도립공원 일원',
      program: '달콤한 꿀사과 따기 체험, 사과 껍질 길게 깎기 대회, 미니 사과파이 만들기, 황톳길 맨발 걷기',
      link: 'http://mgapple.or.kr',
      tagColor: 'pink',
      fee: '무료 입장 (수확 체험 별도)',
      icon: '🍎',
      isFree: true,
      desc: '문경새재의 오색 단풍길을 가볍게 산책하고, 햇살을 듬뿍 머금은 빨간 사과를 나무에서 직접 따서 아삭하게 베어 무는 즐거운 수확 여행입니다.'
    },

    // ------------------------------------------------------------------------
    // [전라 권역 - 생태 & 치즈]
    // ------------------------------------------------------------------------
    {
      id: 'imsil-cheese-fest',
      title: '임실 N치즈축제 & 대형 피자 만들기',
      region: '전라',
      theme: 'food',
      startDate: '2026-10-08',
      endDate: '2026-10-11',
      periodText: '10월 8일(목) ~ 11일(일)',
      location: '전북 임실군 임실치즈테마파크 일원',
      program: '길게 늘어나는 생치즈 늘리기 체험, 화덕 피자 굽기, 유럽풍 성곽 잔디 썰매 타기, 치즈 퐁듀 시식',
      link: 'https://www.imsilcheese.org',
      tagColor: 'orange',
      fee: '무료 입장 (체험 패키지 유료)',
      icon: '🧀',
      isFree: true,
      desc: '모짜렐라 치즈를 쭈욱 늘려보고 나만의 수제 피자를 구워 먹는 아이들의 천국! 유럽풍 성곽 언덕에서 잔디 썰매도 탈 수 있습니다.'
    },
    {
      id: 'suncheon-reed',
      title: '순천만 갈대축제 & 흑두루미 탐조 탐험',
      region: '전라',
      theme: 'nature',
      startDate: '2026-10-24',
      endDate: '2026-10-31',
      periodText: '10월 24일(토) ~ 31일(토)',
      location: '전남 순천시 순천만습지 일원',
      program: '황금빛 갈대 미로 숲 산책, 고배율 망원경 흑두루미 철새 탐조, 갈대 잎 공예 공방',
      link: 'https://scbay.suncheon.go.kr',
      tagColor: 'orange',
      fee: '어린이 6,000원 / 성인 10,000원',
      icon: '🌾',
      isFree: false,
      desc: '바람에 사각거리는 황금빛 갈대숲 길을 걷고, 먼 시베리아에서 날아온 천연기념물 흑두루미를 망원경으로 직접 관찰하는 살아있는 생태 교실입니다.'
    },
    {
      id: 'goheung-yuja-fest',
      title: '고흥 유자 따기 & 달콤 유자청 쿠킹',
      region: '전라',
      theme: 'food',
      startDate: '2026-11-12',
      endDate: '2026-11-15',
      periodText: '11월 12일(목) ~ 15일(일)',
      location: '전남 고흥군 풍양면 유자 석류 공원',
      program: '황금 유자 수확 체험, 달콤한 수제 유자청 만들기, 유자 족욕 힐링, 어린이 유자 머핀 굽기',
      link: 'https://www.goheung.go.kr',
      tagColor: 'orange',
      fee: '무료 관람 (수확 체험 별도)',
      icon: '🍋',
      isFree: true,
      desc: '노랗게 익은 상큼한 유자밭에서 직접 유자를 따고, 겨울철 감기를 쫓아줄 달콤한 유자청과 머핀을 아이 손으로 직접 만들어갑니다.'
    },
    {
      id: 'hampyeong-chrysanthemum',
      title: '함평 대한민국 국향대전 & 마술 버블쇼',
      region: '전라',
      theme: 'nature',
      startDate: '2026-10-23',
      endDate: '2026-11-08',
      periodText: '10월 23일(금) ~ 11월 8일(일)',
      location: '전남 함평군 함평엑스포공원',
      program: '실물 크기 뽀로로·동물 국화 조형물 포토존, 키즈 매직 서커스쇼, 압화 책갈피 만들기',
      link: 'https://www.hampyeong.go.kr',
      tagColor: 'pink',
      fee: '어린이 3,000원 / 어른 7,000원',
      icon: '🌻',
      isFree: false,
      desc: '화려한 국화꽃으로 만들어진 인기 캐릭터와 대형 조형물이 가득한 가을꽃 축제로, 주말마다 신나는 마술쇼와 비눗방울 공연이 열립니다.'
    },
    {
      id: 'iksan-chrysanthemum',
      title: '익산 천만송이 국화 & 백제 미륵사지 야경',
      region: '전라',
      theme: 'nature',
      startDate: '2026-10-23',
      endDate: '2026-11-01',
      periodText: '10월 23일(금) ~ 11월 1일(일)',
      location: '전북 익산시 중앙체육공원 일원',
      program: '백제 미륵사지 석탑 국화 조형물, 캐릭터 등불 포토존, 전통 떡메치기 체험',
      link: 'https://www.iksan.go.kr',
      tagColor: 'green',
      fee: '무료 관람',
      icon: '🌼',
      isFree: true,
      desc: '천만 송이 국화의 그윽한 향기 속에서 찬란한 백제 문화 조형물을 감상하고 온 가족이 즐거운 가을 나들이를 만끽할 수 있습니다.'
    },

    // ------------------------------------------------------------------------
    // [제주 권역 - 감귤 & 리조트 페스타]
    // ------------------------------------------------------------------------
    {
      id: 'jeju-shinhwa-fireworks',
      title: '제주 신화월드 키즈 캐릭터 & 불꽃 페스티벌',
      region: '제주',
      theme: 'light',
      startDate: '2026-10-09',
      endDate: '2026-10-11',
      periodText: '10월 9일(금) ~ 11일(일)',
      location: '제주 서귀포시 안덕면 제주신화월드 신화스퀘어',
      program: '투바앤 인기 캐릭터 퍼레이드, 키즈 댄스 챌린지, 야간 초대형 음악 불꽃놀이, 플리마켓',
      link: 'https://www.shinhwaworld.com',
      tagColor: 'purple',
      fee: '야외 광장 관람 무료',
      icon: '🎆',
      isFree: true,
      desc: '제주 가을밤을 수놓는 음악 불꽃놀이와 귀여운 라바 캐릭터들의 신나는 퍼레이드가 가족 여행객들을 반겨줍니다.'
    },
    {
      id: 'jeju-tangerine',
      title: '제주 국제감귤박람회 & 황금귤 수확',
      region: '제주',
      theme: 'food',
      startDate: '2026-11-13',
      endDate: '2026-11-17',
      periodText: '11월 13일(금) ~ 17일(화)',
      location: '제주 서귀포농업기술센터 일원',
      program: '노란 감귤 따기 체험, 귤잼 쿠킹 클래스, 어린이 감귤 모자 만들기, 연날리기',
      link: 'http://www.jicexpo.com',
      tagColor: 'orange',
      fee: '미취학 아동 무료 / 성인 2,000원',
      icon: '🍊',
      isFree: false,
      desc: '주렁주렁 열린 노란 감귤밭에서 직접 귤을 똑 따서 한입 가득 베어 물고 달콤한 귤잼을 만들어보는 제주의 대표 수확 축제입니다.'
    },
    {
      id: 'jeju-hueree-pinkmuhly',
      title: '제주 휴애리 핑크뮬리 & 아기 흑돼지쇼',
      region: '제주',
      theme: 'nature',
      startDate: '2026-10-01',
      endDate: '2026-11-15',
      periodText: '10월 1일 ~ 11월 15일 (매일 운영)',
      location: '제주 서귀포시 남원읍 휴애리 자연생활공원',
      program: '귀여운 아기 흑돼지 미끄럼틀 공연, 동물 당근 먹이주기, 핑크뮬리 가족 스냅 촬영',
      link: 'https://hueree.com',
      tagColor: 'pink',
      fee: '어린이 9,000원 / 성인 13,000원',
      icon: '🐷',
      isFree: false,
      desc: '한라산 아래 분홍빛 핑크뮬리 정원에서 인생샷을 남기고 귀여운 아기 흑돼지들이 엉금엉금 미끄럼틀을 타는 유쾌한 쇼를 볼 수 있습니다.'
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
