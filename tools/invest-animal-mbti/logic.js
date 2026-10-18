/**
 * ==========================================================================
 * SimuLab Analytics Hub - 투자 성향 동물 MBTI 16유형 테스트 순수 연산 엔진
 * 파일 경로: tools/invest-animal-mbti/logic.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 투자 성향 분석 원리 설명]
 * 1) 4가지 투자 심리 축 (총 8문항):
 *    - 위험 선호: H (High Risk / 공격적) vs L (Low Risk / 안정적)
 *    - 의사 결정: Q (Quant / 데이터 중심) vs I (Intuition / 직관과 뉴스)
 *    - 투자 시계: S (Short / 단기 트레이딩) vs L (Long / 장기 가치투자)
 *    - 수익 목표: C (Capital Gain / 시세차익) vs D (Dividend / 배당 현금흐름)
 * 2) 8대 대표 투자 동물 페르소나 매칭 및 전략 처방.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 8문항 테스트 질문지
  const QUESTIONS = [
    {
      id: 'q1',
      axis: 'risk',
      text: '보유 중인 주식이 하루 만에 -15% 급락했습니다. 당신의 첫 번째 반응은?',
      optionA: { label: '바겐세일이다! 신용/대출을 써서라도 추가 매수한다.', value: 'H' },
      optionB: { label: '불안해서 잠이 안 온다. 일단 비중을 줄이고 안전자산으로 피신한다.', value: 'L' },
    },
    {
      id: 'q2',
      axis: 'risk',
      text: '둘 중 하나에 1억원을 투자해야 한다면 나의 선택은?',
      optionA: { label: '1년 뒤 2배(+100%)가 되거나 반토막(-50%)이 나는 혁신 테크주', value: 'H' },
      optionB: { label: '원금이 거의 보장되면서 연 4~5% 이자/배당이 따박따박 나오는 채권형 ETF', value: 'L' },
    },
    {
      id: 'q3',
      axis: 'decision',
      text: '매수할 종목을 고를 때 내가 더 신뢰하는 것은?',
      optionA: { label: '재무제표, PER/PBR, 백테스팅 통계, 200일선 등 객관적 숫자 지표', value: 'Q' },
      optionB: { label: '뉴스와 유튜브, 커뮤니티 반응, 세상을 바꿀 것 같은 직관적 느낌', value: 'I' },
    },
    {
      id: 'q4',
      axis: 'decision',
      text: '매매 타이밍을 잡을 때 나의 방식은?',
      optionA: { label: '사전에 철저히 정해둔 분할매수·손절선 규칙을 기계처럼 지킨다.', value: 'Q' },
      optionB: { label: '시장 분위기와 차트의 흐름을 보며 유연하게 감각적으로 대응한다.', value: 'I' },
    },
    {
      id: 'q5',
      axis: 'horizon',
      text: '내가 주식을 매수하고 보유하는 일반적인 기간은?',
      optionA: { label: '몇 시간~며칠, 길어야 몇 달 안에 승부를 보는 단기 스윙/트레이딩', value: 'S' },
      optionB: { label: '최소 3년~10년 이상 회사의 성장과 함께하는 장기 복리 투자', value: 'L' },
    },
    {
      id: 'q6',
      axis: 'horizon',
      text: '주식 계좌 앱(MTS)을 확인하는 빈도는?',
      optionA: { label: '장이 열리면 수시로 시세를 확인하고 호가창을 본다.', value: 'S' },
      optionB: { label: '한 달에 한두 번 적립식 매수할 때만 열어보거나 거의 안 본다.', value: 'L' },
    },
    {
      id: 'q7',
      axis: 'yield',
      text: '내가 투자에서 가장 큰 쾌감을 느끼는 순간은?',
      optionA: { label: '단숨에 주가가 폭등하여 계좌 평가액이 빨간색으로 급증할 때', value: 'C' },
      optionB: { label: '매달 내 통장에 배당금/분배금이 달러와 원화로 꽂힐 때', value: 'D' },
    },
    {
      id: 'q8',
      axis: 'yield',
      text: '나의 최종적인 자산 운용 목표는?',
      optionA: { label: '빠르게 원금을 10배로 불려 파이어족이 되는 자본 차익', value: 'C' },
      optionB: { label: '월 500만원의 배당 월급을 만들어 평생 마르지 않는 현금흐름 구축', value: 'D' },
    },
  ];

  // 대표 동물 유형 데이터베이스
  const ANIMAL_PROFILES = {
    // 1. 공격형 퀀트
    HQSC: {
      name: '화끈한 사냥꾼 불곰 (Aggressive Bear)',
      code: 'HQSC',
      keyword: '스피드, 결단력, 고수익 추구',
      desc: '철저한 손익비 계산을 바탕으로 테크 레버리지와 변동성 장세를 즐기는 화끈한 공격수입니다.',
      strength: '상승장 모멘텀을 타서 단기간에 자산을 폭발적으로 불리는 결단력',
      weakness: '예상치 못한 블랙스완 하락장에 큰 손실을 입을 위험',
      recommendedAssets: 'TQQQ, SOXL, AI 주도주, 레버리지 ETF',
      bestPartner: '도토리 모으는 다람쥐 (위험을 방어해 줌)',
      worstPartner: '불꽃을 쫓는 불나방 (함께 계좌를 태움)',
    },
    HQSD: {
      name: '바다의 제왕 범고래 (Killer Whale)',
      code: 'HQSD',
      keyword: '전략적 사냥, 고배당 인컴, 유연성',
      desc: '고배당 커버드콜과 레버리지를 능숙하게 넘나들며 현금과 차익을 동시에 사냥하는 실력파입니다.',
      strength: '하락장에서도 배당 현금흐름으로 멘탈을 지켜내는 밸런스 감각',
      weakness: '커버드콜의 상방 제한 구조로 인한 대세 상승장 소외감',
      recommendedAssets: 'JEPI, JEPQ, 단기채권, 빅테크',
      bestPartner: '지혜로운 부엉이 (정밀한 데이터 보좌)',
      worstPartner: '느긋한 나무늘보 (속도가 안 맞음)',
    },
    // 2. 안정형 퀀트
    LQLL: {
      name: '지혜로운 철학자 부엉이 (Quant Owl)',
      code: 'LQLL',
      keyword: '데이터 신뢰, 분산투자, 원칙주의',
      desc: '감정을 배제하고 백테스팅 통계와 자산배분 모델로만 시장을 대하는 냉철한 퀀트 전략가입니다.',
      strength: '시장 폭락에도 흔들리지 않고 원칙대로 리밸런싱하는 냉철함',
      weakness: '과도한 데이터 신중함으로 인해 초반 급등 기회를 놓치는 경향',
      recommendedAssets: 'S&P 500 (SPY), 올웨더 포트폴리오, 금(Gold)',
      bestPartner: '화끈한 사냥꾼 불곰 (추진력을 더해줌)',
      worstPartner: '불꽃을 쫓는 불나방 (비이성적 매매에 분노함)',
    },
    // 3. 안정형 배당 농부
    LLLD: {
      name: '도토리 모으는 다람쥐 (Dividend Squirrel)',
      code: 'LLLD',
      keyword: '성실함, 복리 재투자, 현금흐름',
      desc: '비가 오나 눈이 오나 매달 정해진 날짜에 배당성장주를 모아 눈덩이 복리를 굴리는 현명한 농부입니다.',
      strength: '주가 등락에 일희일비하지 않고 평온한 일상을 누리는 멘탈',
      weakness: '급등하는 테크 테마주를 볼 때 약간의 소외감(FOMO)',
      recommendedAssets: 'SCHD, 리얼티인컴(O), 맥쿼리인프라, 고배당주',
      bestPartner: '천년 만년 바다거북 (느린 복리의 미학을 공유)',
      worstPartner: '화끈한 사냥꾼 불곰 (심장이 떨려서 같이 못 봄)',
    },
    // 4. 장기 거북이
    LLLC: {
      name: '천년 만년 바다거북 (Patient Turtle)',
      code: 'LLLC',
      keyword: '우직함, 10년 장기보유, 거인의 어깨',
      desc: '세계 1등 기업과 지수 ETF를 매수하고 10년 뒤에 계좌를 열어보는 워런 버핏 스타일의 거목입니다.',
      strength: '단기 소음과 뉴스에 전혀 흔들리지 않는 압도적인 인내심',
      weakness: '시장 트렌드 변화에 다소 둔감하여 리밸런싱 타이밍을 놓침',
      recommendedAssets: '미국 나스닥 100 (QQQ), 애플, 마이크로소프트',
      bestPartner: '도토리 모으는 다람쥐 (차분한 동반자)',
      worstPartner: '단타 치는 치타 (어지러워서 멀미 남)',
    },
    // 5. 직관 단기형
    HISC: {
      name: '불꽃을 쫓는 불나방 (Momentum Moth)',
      code: 'HISC',
      keyword: '화제성, 뉴스 매매, 직관과 스릴',
      desc: '가장 뜨거운 테마와 뉴스에 과감히 올라타며 시장의 스릴을 즐기는 본능적 트레이더입니다.',
      strength: '시장 트렌드와 대중의 심리를 귀신같이 읽어내는 순발력',
      weakness: '고점 추격매수와 뇌동매매로 인한 원금 손실 위험',
      recommendedAssets: '당일 주도 테마주, 신규 상장주, 급등 코인',
      bestPartner: '지혜로운 부엉이 (고점에서 브레이크를 밟아줌)',
      worstPartner: '화끈한 사냥꾼 불곰 (함께 손잡고 불속으로)',
    },
    // 6. 느긋한 관조형
    LISD: {
      name: '평온한 나무늘보 (Zen Sloth)',
      code: 'LISD',
      keyword: '무소유, 계좌 방치, 느긋함',
      desc: '계좌 비밀번호를 까먹은 상태가 가장 높은 수익률을 낸다는 통계를 몸소 실천하는 관조파입니다.',
      strength: '매매를 거의 하지 않아 거래세와 수수료가 0원에 수렴',
      weakness: '매수한 종목에 악재가 터져도 방치하여 잡초가 자랄 위험',
      recommendedAssets: '타깃데이트펀드 (TDF), 글로벌 분산펀드',
      bestPartner: '지혜로운 부엉이 (주기적으로 계좌 청소해 줌)',
      worstPartner: '바다의 제왕 범고래 (너무 바쁘게 움직여 피곤함)',
    },
    // 7. 실속형 비버
    LQSD: {
      name: '빈틈없는 건축가 비버 (Diligent Beaver)',
      code: 'LQSD',
      keyword: '철저한 손익비, 단기 확정수익, 실속',
      desc: '단 1원의 손실도 용납하지 않고 정밀한 댐을 짓듯이 작은 이익을 차곡차곡 쌓아가는 알짜배기입니다.',
      strength: '승률 높은 자리에서만 진입하여 안정적인 계좌 우상향 달성',
      weakness: '수익을 너무 일찍 실현하여 대시세를 놓치는 경향',
      recommendedAssets: '공모주 청약, 국채 단기물, 우량 배당락 매매',
      bestPartner: '지혜로운 부엉이 (논리적 궁합 100%)',
      worstPartner: '불꽃을 쫓는 불나방 (비효율의 극치라 생각함)',
    },
  };

  const DEFAULT_ANSWERS = {
    q1: 'H', q2: 'H', q3: 'Q', q4: 'Q',
    q5: 'S', q6: 'S', q7: 'C', q8: 'C',
  };

  /**
   * 답변을 기반으로 4글자 코드 및 동물 매칭
   */
  function evaluateInvestMbti(answers = {}) {
    const ans = { ...DEFAULT_ANSWERS, ...answers };

    // 1) Risk (H / L)
    const riskScore = (ans.q1 === 'H' ? 1 : 0) + (ans.q2 === 'H' ? 1 : 0);
    const riskCode = riskScore >= 1 ? 'H' : 'L';

    // 2) Decision (Q / I)
    const decScore = (ans.q3 === 'Q' ? 1 : 0) + (ans.q4 === 'Q' ? 1 : 0);
    const decCode = decScore >= 1 ? 'Q' : 'I';

    // 3) Horizon (S / L)
    const horScore = (ans.q5 === 'S' ? 1 : 0) + (ans.q6 === 'S' ? 1 : 0);
    const horCode = horScore >= 1 ? 'S' : 'L';

    // 4) Yield (C / D)
    const yldScore = (ans.q7 === 'C' ? 1 : 0) + (ans.q8 === 'C' ? 1 : 0);
    const yldCode = yldScore >= 1 ? 'C' : 'D';

    const fullCode = `${riskCode}${decCode}${horCode}${yldCode}`;

    // 동물 프로필 매칭 (fallback: HQSC)
    const animal = ANIMAL_PROFILES[fullCode] || ANIMAL_PROFILES.HQSC;

    return {
      answers: ans,
      fullCode,
      animal,
      traits: {
        risk: riskCode === 'H' ? '공격적 (High Risk)' : '안정적 (Low Risk)',
        decision: decCode === 'Q' ? '데이터 퀀트형 (Quant)' : '직관 모멘텀형 (Intuition)',
        horizon: horCode === 'S' ? '단기 트레이딩 (Short)' : '장기 가치투자 (Long)',
        yield: yldCode === 'C' ? '시세 차익형 (Capital)' : '배당 현금흐름 (Dividend)',
      },
    };
  }

  /**
   * 두 사람의 투자 동물 코드 간 상호 궁합 점수 및 케미 분석
   */
  function getChemistryBetween(codeA, codeB) {
    const animalA = ANIMAL_PROFILES[codeA] || ANIMAL_PROFILES.HQSC;
    const animalB = ANIMAL_PROFILES[codeB] || ANIMAL_PROFILES.HQSC;

    if (!codeA || !codeB) {
      return null;
    }

    // 4개 축 일치 여부 카운트
    let matchCount = 0;
    for (let i = 0; i < 4; i++) {
      if (codeA[i] === codeB[i]) matchCount++;
    }

    let score = 75;
    let grade = 'A';
    let title = '서로에게 든든한 페이스메이커';
    let synergy = '투자 철학이 통하면서도 적당한 긴장감을 유지할 수 있는 좋은 관계입니다.';
    let caution = '시장 급변 시 의견 대립이 있을 수 있으니 사전 합의된 규칙을 준수하세요.';

    if (codeA === codeB) {
      score = 88;
      grade = 'A+';
      title = `도플갱어 투자 파트너 (${animalA.name} x ${animalB.name})`;
      synergy = `말하지 않아도 서로의 매매 타이밍과 심리를 100% 이해하는 영혼의 단짝입니다.`;
      caution = `같은 약점을 공유하므로 하락장에 둘 다 동시에 패닉에 빠질 수 있습니다.`;
    } else if (matchCount === 2) {
      // 2개 일치, 2개 반대: 가장 이상적인 상호 보완 밸런스!
      score = 96;
      grade = 'S';
      title = '서로의 계좌를 지켜주는 환상의 깐부';
      synergy = `한 명이 무리하게 질주할 때 다른 한 명이 브레이크를 잡아주고, 한 명이 망설일 때 용기를 불어넣어 주는 최상의 궁합입니다.`;
      caution = `상대방의 다른 관점을 '틀린 것'이 아니라 '보완재'로 인정하는 태도가 필요합니다.`;
    } else if (matchCount === 1) {
      score = 82;
      grade = 'B+';
      title = '배울 점이 많은 자극제 관계';
      synergy = `평소 내가 보지 못하던 시장의 이면과 새로운 투자 종목을 발견하게 해줍니다.`;
      caution = `매매 호흡이 달라 공동 펀드를 운영하기보다는 각자의 계좌를 존중하는 것이 좋습니다.`;
    } else if (matchCount === 0) {
      // 4개 축 전부 반대 (완전한 정반대)
      score = 65;
      grade = 'C';
      title = '화성인과 금성인의 만남 (극과 극)';
      synergy = `시장 사이클의 어떤 국면에서도 둘 중 한 명은 살아남아 계좌를 방어하는 헤지(Hedge) 효과가 있습니다.`;
      caution = `종목 토론을 하다가 언쟁이 발생하기 쉬우니 투자 이야기는 재미로만 나누세요!`;
    }

    return {
      codeA,
      codeB,
      animalA,
      animalB,
      score,
      grade,
      title,
      synergy,
      caution,
    };
  }

  const exportsObj = {
    QUESTIONS,
    ANIMAL_PROFILES,
    DEFAULT_ANSWERS,
    evaluateInvestMbti,
    getChemistryBetween,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  global.SimuLab = global.SimuLab || {};
  global.SimuLab.InvestAnimalMbti = exportsObj;
})(typeof window !== 'undefined' ? window : globalThis);
