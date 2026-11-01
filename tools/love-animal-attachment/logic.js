/**
 * ==========================================================================
 * SimuLab Analytics Hub - 연애 유형 & 사랑의 동물 애착 심리테스트 순수 연산 엔진
 * 파일 경로: tools/love-animal-attachment/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 연애 애착 심리학 설명]
 * 1) 존 보울비(John Bowlby)와 메리 에인스워스의 '성인 애착 이론(Adult Attachment)':
 *    - 관계 불안(Anxiety): 상대의 사랑이 식을까 봐 두려워하는 정도 (A1~A4)
 *    - 친밀 회피(Avoidance): 상대와 너무 가까워지면 구속감을 느껴 거리를 두는 정도 (B1~B4)
 * 2) 4대 기본 애착 유형:
 *    - 안정형 (Secure): 저불안 + 저회피
 *    - 불안형 (Anxious): 고불안 + 저회피
 *    - 회피형 (Avoidant): 저불안 + 고회피
 *    - 혼란형 (Fearful): 고불안 + 고회피
 * 3) 8대 사랑의 동물 페르소나 및 연인/친구 간 1:1 상호 궁합 매트릭스 제공.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 8문항 연애 심리 테스트 질문지
  const LOVE_QUESTIONS = [
    {
      id: 'q1',
      dimension: 'anxiety',
      text: '연인에게 카톡을 보냈는데 2시간 동안 "읽씹" 상태입니다. 나의 머릿속은?',
      optionA: { label: '"많이 바쁜가 보네, 끝나면 연락 오겠지!" 하며 내 할 일에 집중한다.', value: 'LA' }, // Low Anxiety
      optionB: { label: '"혹시 내가 뭐 실수했나? 기분 나쁜가?" 불안해서 폰을 계속 쳐다본다.', value: 'HA' }, // High Anxiety
    },
    {
      id: 'q2',
      dimension: 'anxiety',
      text: '연인이 이성 친구나 직장 동료와 단둘이 커피를 마신다고 할 때 내 심정은?',
      optionA: { label: '일이나 친목일 텐데 뭐 어때? 쿨하게 "재밌게 얘기하고 와"라고 한다.', value: 'LA' },
      optionB: { label: '겉으로는 쿨한 척하지만 온 신경이 곤두서고 마음이 하루 종일 타들어간다.', value: 'HA' },
    },
    {
      id: 'q3',
      dimension: 'anxiety',
      text: '연애할 때 내가 상대방에게 더 자주 바라는 것은?',
      optionA: { label: '서로를 신뢰하며 편안하게 일상을 공유하는 안정적인 평화', value: 'LA' },
      optionB: { label: '"너를 정말 사랑해"라는 끊임없는 애정 표현과 다정한 확인', value: 'HA' },
    },
    {
      id: 'q4',
      dimension: 'anxiety',
      text: '연인과 사소한 말다툼이 생겼을 때 나의 가장 큰 공포는?',
      optionA: { label: '문제가 제때 해결되지 않고 감정 소모가 길어지는 피로감', value: 'LA' },
      optionB: { label: '이 싸움 때문에 상대방의 마음이 식어서 날 떠나버릴지도 모른다는 두려움', value: 'HA' },
    },
    {
      id: 'q5',
      dimension: 'avoidance',
      text: '연인과 하루 종일 데이트를 하고 집에 돌아왔을 때 나의 상태는?',
      optionA: { label: '벌써 보고 싶다! 집에 와서도 자기 전까지 통화하거나 톡을 이어간다.', value: 'LV' }, // Low Avoidance
      optionB: { label: '너무 좋았지만 이제야 살 것 같다. 나만의 방에서 혼자 충전할 시간이 필요하다.', value: 'HV' }, // High Avoidance
    },
    {
      id: 'q6',
      dimension: 'avoidance',
      text: '힘들고 속상한 일이 생겼을 때 나의 대처 방식은?',
      optionA: { label: '연인에게 달려가서 털어놓고 안겨서 위로를 받고 싶다.', value: 'LV' },
      optionB: { label: '혼자만의 동굴에 들어가서 스스로 감정을 정리한 뒤 대화하고 싶다.', value: 'HV' },
    },
    {
      id: 'q7',
      dimension: 'avoidance',
      text: '연인이 내 사생활(일기장, 휴대폰, 친구 관계 등)을 깊게 알고 싶어 할 때?',
      optionA: { label: '숨길 게 없으니 자연스럽게 보여주고 내 모든 것을 공유해도 좋다.', value: 'LV' },
      optionB: { label: '아무리 사랑하는 연인이라도 내 침범받지 않는 선을 넘는 것 같아 답답하다.', value: 'HV' },
    },
    {
      id: 'q8',
      dimension: 'avoidance',
      text: '상대방이 나에게 미래(결혼, 동거, 평생 약속)를 진지하게 묻는다면?',
      optionA: { label: '함께할 미래를 상상하면 가슴이 뛰고 적극적으로 설계하고 싶다.', value: 'LV' },
      optionB: { label: '마음 한구석에서 묘한 중압감과 도망치고 싶은 구속감이 스친다.', value: 'HV' },
    },
  ];

  // 8대 사랑의 동물 페르소나 프로필
  const LOVE_ANIMAL_PROFILES = {
    // 1) 안정형 (저불안 + 저회피)
    SEC_RETRIEVER: {
      code: 'SEC_RETRIEVER',
      type: '안정-헌신형',
      name: '골든리트리버',
      english: 'Golden Retriever',
      icon: '🐶',
      subtitle: '사랑이 넘치는 태양 같은 수호천사',
      summary: '연인을 온전히 신뢰하며 언제나 따뜻하고 변함없는 사랑을 베풉니다. 자존감이 높아 상대의 사소한 변화에 휘둘리지 않고, 갈등이 생겨도 회피하지 않고 솔직하게 대화로 풀어냅니다.',
      strengths: [
        '상대방에게 안정감과 무한한 자존감 회복을 선물함',
        '밀당을 하지 않고 진솔하며 솔직한 애정 표현',
        '불안형이나 회피형 연인의 상처까지 보듬어주는 치유력',
      ],
      cautions: [
        '자신의 힘듦을 참고 배려하다가 혼자 지칠 수 있음',
        '상대가 자신의 호의를 당연하게 여기지 않도록 경계 필요',
        '연인에게도 가끔은 응석을 부리고 기대는 연습이 필요함',
      ],
      idealStyle: '서로를 존중하며 함께 성장하는 건강하고 따뜻한 동반자 연애',
      bestMatch: '아기고양이 (불안을 잠재워줌), 돌고래 (최고의 티키타카)',
      worstMatch: '사막여우 (독립성이 지나쳐 가끔 섭섭함)',
    },
    SEC_DOLPHIN: {
      code: 'SEC_DOLPHIN',
      type: '안정-소통형',
      name: '돌고래',
      english: 'Playful Dolphin',
      icon: '🐬',
      subtitle: '유쾌하고 센스 넘치는 티키타카 메이커',
      summary: '밝고 긍정적인 에너지로 연애에 웃음이 끊이지 않게 만드는 분위기 메이커입니다. 감정 표현이 솔직하며, 문제가 생기면 심각해지기보다 재치 있게 분위기를 전환하며 대화를 유도합니다.',
      strengths: [
        '함께 있으면 시간 가는 줄 모르는 재치 있는 유머 감각',
        '서운한 점을 앙금으로 남기지 않고 즉시 건강하게 소통함',
        '연인의 자율성을 존중하면서도 끈끈한 친밀감 유지',
      ],
      cautions: [
        '진지하고 무거운 감정적 대화를 장난으로 넘기려 할 수 있음',
        '갈등의 뿌리 깊은 원인을 끝까지 파헤치는 인내심 필요',
      ],
      idealStyle: '친구처럼 편안하면서도 매일 설레는 유쾌 발랄한 연애',
      bestMatch: '골든리트리버 (안정감 200%), 토끼 (감성을 채워줌)',
      worstMatch: '올빼미 (지나치게 차가워서 답답함)',
    },

    // 2) 불안형 (고불안 + 저회피)
    ANX_KITTEN: {
      code: 'ANX_KITTEN',
      type: '불안-애정추구형',
      name: '아기고양이',
      english: 'Sweet Kitten',
      icon: '🐱',
      subtitle: '사랑을 온몸으로 갈망하는 사랑꾼',
      summary: '연인이 내 세상의 전부가 되는 올인형 로맨티시스트입니다. 사랑받고 있음을 확인할 때 세상에서 가장 행복하지만, 상대의 작은 무관심이나 연락 지연에도 심장이 쿵 내려앉으며 불안해합니다.',
      strengths: [
        '연인을 세상에서 가장 특별하고 소중한 존재로 대우함',
        '풍부한 감수성과 사랑스러운 애교, 세심한 배려',
        '한 번 빠지면 다른 이성은 쳐다도 보지 않는 일편단심',
      ],
      cautions: [
        '상대의 사소한 단답이나 표정에 지레 겁먹고 상처받음',
        '연애에 내 모든 자존감을 걸지 말고 나만의 취미와 시간 갖기',
        '시험에 들게 하는 식의 밀당이나 확인 질문 줄이기',
      ],
      idealStyle: '끊임없는 애정 표현과 다정한 확신을 주는 듬직한 연애',
      bestMatch: '골든리트리버 (영혼의 치유자, 불안을 녹여줌)',
      worstMatch: '사막여우 (최악의 롤러코스터, 피 말리는 추격전)',
    },
    ANX_RABBIT: {
      code: 'ANX_RABBIT',
      type: '불안-감성섬세형',
      name: '토끼',
      english: 'Sensitive Rabbit',
      icon: '🐰',
      subtitle: '유리알처럼 투명하고 여린 로맨티시스트',
      summary: '상대의 미세한 감정선까지 기가 막히게 알아채는 섬세한 마음의 소유자입니다. 다정하지만 상처받는 것을 너무나 두려워하여 혼자 속으로 끙끙 앓다가 눈물을 쏟아내기도 합니다.',
      strengths: [
        '상대의 기분을 즉각 배려하는 놀라운 공감 능력',
        '기념일과 소소한 추억을 소중히 간직하는 로맨틱함',
        '연인을 위해 온 정성을 다해 헌신하는 따스함',
      ],
      cautions: [
        '혼자만의 상상으로 비극적인 결말을 미리 쓰는 습관 주의',
        '서운한 것이 있다면 삼키지 말고 예쁜 말로 즉시 표현하기',
      ],
      idealStyle: '따뜻한 눈빛과 온기 속에서 마음 편히 안길 수 있는 연애',
      bestMatch: '골든리트리버 (포근한 보금자리), 돌고래',
      worstMatch: '올빼미 (감정을 논리로 따져서 마음에 멍이 듦)',
    },

    // 3) 회피형 (저불안 + 고회피)
    AVD_FOX: {
      code: 'AVD_FOX',
      type: '회피-독립쿨형',
      name: '사막여우',
      english: 'Cool Desert Fox',
      icon: '🦊',
      subtitle: '나만의 오아시스가 필요한 자유로운 영혼',
      summary: '쿨하고 매력적이며 자기 관리가 철저한 독립주의자입니다. 연인을 사랑하지만 자신만의 시공간과 개인적 영역이 침범당하면 숨이 턱 막히며 본능적으로 뒤로 물러서는 경향이 있습니다.',
      strengths: [
        '연인에게 과도하게 집착하거나 의존하지 않는 어른스러운 관계',
        '자기 영역에서 확실한 성취를 이루는 유능함과 매력',
        '감정에 휘둘리지 않고 차분하게 상황을 해결하는 이성',
      ],
      cautions: [
        '갈등이 생기면 회피하거나 잠수를 타서 상대를 미치게 함',
        '"시간이 필요해"라는 말이라도 건네고 동굴에 들어가는 배려 필요',
        '약점을 드러내는 것이 나약한 것이 아님을 배우기',
      ],
      idealStyle: '각자의 삶을 존중하며 적당한 거리를 두고 빛나는 연애',
      bestMatch: '골든리트리버 (동굴 밖에서 조용히 기다려줌)',
      worstMatch: '아기고양이 (숨 막히는 집착과 끝없는 추격전)',
    },
    AVD_OWL: {
      code: 'AVD_OWL',
      type: '회피-신중분석형',
      name: '올빼미',
      english: 'Wise Owl',
      icon: '🦉',
      subtitle: '냉철한 이성 뒤에 서툰 감정을 숨긴 관찰자',
      summary: '감정보다는 논리와 팩트를 중시하는 뇌섹남/뇌섹녀 스타일입니다. 마음에 드는 상대가 있어도 섣불리 다가가지 않고 신중하게 관찰하며, 감정적인 눈물이나 격한 싸움을 매우 힘들어합니다.',
      strengths: [
        '감정적인 파도에 휩쓸리지 않고 객관적인 해결책 제시',
        '한 번 신뢰가 형성되면 배신하지 않는 묵직한 의리',
        '차분하고 침착하여 연인에게 든든한 멘토가 되어줌',
      ],
      cautions: [
        '연인이 원하는 것은 "해결책"이 아니라 "공감"임을 기억할 것',
        '지나치게 따지고 드는 말투는 연인의 마음에 생채기를 냄',
      ],
      idealStyle: '지적 대화가 통하고 서로의 성장을 응원하는 차분한 연애',
      bestMatch: '돌고래 (어색한 감정을 부드럽게 녹여줌), 늑대',
      worstMatch: '토끼 (감정 충돌 시 서로를 완전히 이해 못 함)',
    },

    // 4) 혼란형 (고불안 + 고회피)
    FEAR_HEDGEHOG: {
      code: 'FEAR_HEDGEHOG',
      type: '혼란-가시츤데레형',
      name: '고슴도치',
      english: 'Prickly Hedgehog',
      icon: '🦔',
      subtitle: '다가오면 찌르고 멀어지면 외로운 츤데레',
      summary: '누구보다 깊은 사랑을 원하지만 동시에 상처받는 것이 너무 두려워 상대가 다가오면 본능적으로 가시를 세웁니다. "날 떠날 거지?"라며 상대를 밀어내면서도 속으로는 잡아주길 간절히 바라는 복합적인 마음입니다.',
      strengths: [
        '가시 속에 감춰진 세상에서 가장 여리고 순수한 진심',
        '상처를 공유할 수 있는 깊이 있는 영혼의 대화 가능',
        '나를 진심으로 품어준 사람에게는 모든 것을 내어주는 충성심',
      ],
      cautions: [
        '상대의 사랑을 시험하기 위해 일부러 차갑게 대하는 행동 멈추기',
        '가시를 세우기 전에 "나 지금 사실 조금 무서워"라고 솔직해지기',
      ],
      idealStyle: '어떤 가시에도 물러서지 않고 안아주는 단단한 사랑',
      bestMatch: '골든리트리버 (유일하게 가시를 품어줄 수 있는 대인배)',
      worstMatch: '고슴도치 (서로 찌르다가 피투성이가 되는 파국)',
    },
    FEAR_WOLF: {
      code: 'FEAR_WOLF',
      type: '혼란-외골수순정형',
      name: '외로운 늑대',
      english: 'Lone Wolf',
      icon: '🐺',
      subtitle: '마음의 벽은 높지만 열리면 목숨 바치는 순정파',
      summary: '세상에 쉽게 곁을 주지 않는 고독한 늑대입니다. 사람을 깊게 믿지 못해 오랜 시간 경계하지만, 한 번 나의 짝으로 인정한 상대에게는 목숨까지 바칠 정도로 지독한 순정을 바칩니다.',
      strengths: [
        '단 한 사람만을 바라보는 압도적인 순정과 책임감',
        '연인을 지키기 위해서라면 어떤 위협도 무릅쓰는 든든함',
        '가벼운 만남을 혐오하고 평생의 신의를 지키는 묵직함',
      ],
      cautions: [
        '마음의 문을 여는 데 시간이 너무 오래 걸려 인연을 놓칠 수 있음',
        '연인을 향한 과도한 보호 본능이 소유욕으로 번지지 않게 주의',
      ],
      idealStyle: '세상 모든 풍파를 함께 뚫고 나가는 전우애 같은 사랑',
      bestMatch: '골든리트리버, 올빼미 (상호 신뢰 구축 가능)',
      worstMatch: '사막여우 (마음을 열기도 전에 멀리 도망침)',
    },
  };

  const DEFAULT_LOVE_ANSWERS = {
    q1: 'LA', q2: 'LA', q3: 'LA', q4: 'LA',
    q5: 'LV', q6: 'LV', q7: 'LV', q8: 'LV',
  };

  /**
   * 8문항 응답으로 애착 차원 및 동물 페르소나 산출
   */
  function evaluateLoveAttachment(answers = {}) {
    const ans = { ...DEFAULT_LOVE_ANSWERS, ...answers };

    // 1) 불안 차원 점수 (HA 개수)
    const anxScore = (ans.q1 === 'HA' ? 1 : 0) +
                     (ans.q2 === 'HA' ? 1 : 0) +
                     (ans.q3 === 'HA' ? 1 : 0) +
                     (ans.q4 === 'HA' ? 1 : 0);
    const isHighAnx = anxScore >= 2;

    // 2) 회피 차원 점수 (HV 개수)
    const avdScore = (ans.q5 === 'HV' ? 1 : 0) +
                     (ans.q6 === 'HV' ? 1 : 0) +
                     (ans.q7 === 'HV' ? 1 : 0) +
                     (ans.q8 === 'HV' ? 1 : 0);
    const isHighAvd = avdScore >= 2;

    let profileCode = 'SEC_RETRIEVER';

    if (!isHighAnx && !isHighAvd) {
      // 안정형
      profileCode = ans.q3 === 'LA' && ans.q5 === 'LV' ? 'SEC_RETRIEVER' : 'SEC_DOLPHIN';
    } else if (isHighAnx && !isHighAvd) {
      // 불안형
      profileCode = ans.q1 === 'HA' ? 'ANX_KITTEN' : 'ANX_RABBIT';
    } else if (!isHighAnx && isHighAvd) {
      // 회피형
      profileCode = ans.q6 === 'HV' ? 'AVD_FOX' : 'AVD_OWL';
    } else {
      // 혼란형 (고불안 + 고회피)
      profileCode = ans.q4 === 'HA' ? 'FEAR_HEDGEHOG' : 'FEAR_WOLF';
    }

    const animal = LOVE_ANIMAL_PROFILES[profileCode] || LOVE_ANIMAL_PROFILES.SEC_RETRIEVER;

    return {
      answers: ans,
      anxScore,
      avdScore,
      isHighAnx,
      isHighAvd,
      profileCode,
      animal,
      metrics: {
        attachmentType: animal.type,
        anxietyLevel: isHighAnx ? '높음 (관계 민감형)' : '낮음 (안정 신뢰형)',
        avoidanceLevel: isHighAvd ? '높음 (독립 추구형)' : '낮음 (친밀 교감형)',
        loveLanguage: animal.idealStyle,
      },
    };
  }

  /**
   * 두 사람의 연애 애착 동물 간 실시간 궁합(Chemistry) 산출
   */
  function getLoveChemistry(codeA, codeB) {
    const pA = LOVE_ANIMAL_PROFILES[codeA] || LOVE_ANIMAL_PROFILES.SEC_RETRIEVER;
    const pB = LOVE_ANIMAL_PROFILES[codeB] || LOVE_ANIMAL_PROFILES.SEC_RETRIEVER;

    if (!codeA || !codeB) return null;

    // 유형 코드 추출 (SEC, ANX, AVD, FEAR)
    const typeA = codeA.split('_')[0];
    const typeB = codeB.split('_')[0];

    let score = 80;
    let grade = 'A';
    let title = '서로에게 따스한 온기를 주는 연인';
    let synergy = '서로의 성향을 이해하고 맞춰가며 좋은 관계를 만들어갈 수 있습니다.';
    let prescription = '상대방의 애정 표현 방식을 있는 그대로 인정해 주세요.';

    if (typeA === 'SEC' && typeB === 'SEC') {
      score = 98;
      grade = 'S+';
      title = '축복받은 천생연분 (무결점 케미)';
      synergy = '서로에 대한 신뢰가 깊어 오해나 불안 없이 가장 편안하고 성숙한 사랑을 키워나갑니다.';
      prescription = '지금처럼 서로를 아끼고 존중하며 예쁜 사랑을 이어가세요!';
    } else if ((typeA === 'SEC' && typeB === 'ANX') || (typeA === 'ANX' && typeB === 'SEC')) {
      score = 94;
      grade = 'S';
      title = '불안을 녹여주는 구원투수와 사랑꾼';
      synergy = '안정형의 흔들림 없는 다정함이 불안형의 두려움을 눈 녹듯 사라지게 해주는 최고의 힐링 궁합입니다.';
      prescription = '안정형은 아낌없이 확신을 주고, 불안형은 과도한 확인 질문을 줄이면 완벽합니다.';
    } else if ((typeA === 'SEC' && typeB === 'AVD') || (typeA === 'AVD' && typeB === 'SEC')) {
      score = 91;
      grade = 'S-';
      title = '동굴 밖을 지켜주는 든든한 나무와 자유로운 바람';
      synergy = '안정형의 넉넉한 포용력이 회피형에게 구속감 없는 안전지대를 마련해 줍니다.';
      prescription = '회피형이 혼자만의 시간이 필요할 때 안정형이 재촉하지 않고 기다려주면 관계가 깊어집니다.';
    } else if ((typeA === 'ANX' && typeB === 'AVD') || (typeA === 'AVD' && typeB === 'ANX')) {
      score = 58;
      grade = 'C';
      title = '애착 이론의 전설: 쫓고 쫓기는 롤러코스터 커플';
      synergy = '처음엔 정반대의 매력에 강하게 끌리지만, 한 명은 다가가고 한 명은 도망치며 피 말리는 추격전이 벌어집니다.';
      prescription = '불안형은 혼자만의 시간을 존중해 주고, 회피형은 "널 사랑하지만 지금은 피곤해"라고 미리 말해주는 연습이 필수입니다.';
    } else if (typeA === 'ANX' && typeB === 'ANX') {
      score = 78;
      grade = 'B+';
      title = '세상에서 가장 뜨거운 사랑꾼들의 만남';
      synergy = '서로가 원하는 애정 표현과 사랑의 확신을 200% 채워주는 불꽃같은 연애를 합니다.';
      prescription = '둘 다 동시에 감정에 북받쳐 서운해하면 걷잡을 수 없으니 제3자의 시선으로 한 템포 쉬어가세요.';
    } else if (typeA === 'AVD' && typeB === 'AVD') {
      score = 72;
      grade = 'B';
      title = '각자의 행성에서 평화롭게 공존하는 쿨한 커플';
      synergy = '서로의 영역을 절대 침범하지 않아 싸울 일이 거의 없고 매우 편안합니다.';
      prescription = '너무 거리를 두다 보면 연인인지 남인지 모르게 식어버릴 수 있으니 의도적인 데이트 루틴을 만드세요.';
    } else if (typeA === 'FEAR' || typeB === 'FEAR') {
      score = 68;
      grade = 'B-';
      title = '가시 속에 숨겨진 진심을 찾아가는 여정';
      synergy = '서로의 깊은 상처를 이해하고 보듬어줄 수 있을 때 그 누구보다 단단한 유대감이 형성됩니다.';
      prescription = '상대의 날 선 말에 상처받지 말고, 그 이면에 있는 "나 버리지 마"라는 두려움을 읽어주세요.';
    }

    return {
      codeA,
      codeB,
      pA,
      pB,
      score,
      grade,
      title,
      synergy,
      prescription,
    };
  }

  const exportsObj = {
    LOVE_QUESTIONS,
    LOVE_ANIMAL_PROFILES,
    DEFAULT_LOVE_ANSWERS,
    evaluateLoveAttachment,
    getLoveChemistry,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.LoveAnimalAttachment = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
