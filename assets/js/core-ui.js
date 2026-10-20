/**
 * ==========================================================================
 * SimuLab Hub - 공통 UI, 듀얼 테마, 공유(URL/Storage), 법적 고지 유틸리티
 * 파일 경로: assets/js/core-ui.js
 * --------------------------------------------------------------------------
 * [핵심 호환성 설계]
 * - 사용자가 웹 서버 없이 윈도우 탐색기에서 index.html을 직접 더블클릭(file://)해
 *   열더라도 CORS 차단 없이 100% 동작하도록 window.SimuLab 전역 네임스페이스에 등록합니다.
 * - 조잡한 컬러 이모지를 배제하고 정교한 인라인 SVG 아이콘과 슬라이더 게이지 채움 효과를 제공합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const SimuLab = (global.SimuLab = global.SimuLab || {});

  /* ------------------------------------------------------------------------
     1. 방어적 숫자 검증 및 한국형 통화/소수점 포맷팅 함수
     ------------------------------------------------------------------------ */

  function clampNumber(value, min, max, fallback = min) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(Math.max(parsed, min), max);
  }

  function roundSafe(value, decimals = 2) {
    if (!Number.isFinite(value)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function formatCurrency(amount, compact = false) {
    if (!Number.isFinite(amount)) return '0원';
    const rounded = Math.round(amount);

    if (compact) {
      const absVal = Math.abs(rounded);
      const sign = rounded < 0 ? '-' : '';
      if (absVal >= 100000000) {
        const eok = Math.floor(absVal / 100000000);
        const man = Math.round((absVal % 100000000) / 10000);
        return man > 0
          ? `${sign}${new Intl.NumberFormat('ko-KR').format(eok)}억 ${new Intl.NumberFormat('ko-KR').format(man)}만원`
          : `${sign}${new Intl.NumberFormat('ko-KR').format(eok)}억원`;
      }
      if (absVal >= 10000) {
        const man = Math.round(absVal / 10000);
        return `${sign}${new Intl.NumberFormat('ko-KR').format(man)}만원`;
      }
    }

    return `${new Intl.NumberFormat('ko-KR').format(rounded)}원`;
  }

  /**
   * 토스/핀테크 스타일 실시간 한글 금액 변환 함수
   * 예: 400000000 -> "4억 원", 450000000 -> "4억 5,000만 원", 1500000 -> "150만 원"
   */
  function formatKoreanAmount(num) {
    if (!Number.isFinite(num) || num <= 0) return '0원';
    const val = Math.round(num);
    const uk = Math.floor(val / 100000000);
    const man = Math.floor((val % 100000000) / 10000);
    const won = val % 10000;

    const parts = [];
    if (uk > 0) parts.push(`${new Intl.NumberFormat('ko-KR').format(uk)}억`);
    if (man > 0) parts.push(`${new Intl.NumberFormat('ko-KR').format(man)}만`);
    if (won > 0 && uk === 0 && man === 0) parts.push(`${new Intl.NumberFormat('ko-KR').format(won)}`);

    return parts.length > 0 ? `${parts.join(' ')} 원` : '0원';
  }

  function formatNumber(value, decimals = 0) {
    if (!Number.isFinite(value)) return '0';
    const safeVal = roundSafe(value, decimals);
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(safeVal);
  }

  function formatPercent(value, decimals = 2, showPlus = false) {
    if (!Number.isFinite(value)) return '0.00%';
    const safeVal = roundSafe(value, decimals);
    const prefix = showPlus && safeVal > 0 ? '+' : '';
    return `${prefix}${safeVal.toFixed(decimals)}%`;
  }

  /* ------------------------------------------------------------------------
     2. 슬라이더(Range Input) 프로그레스 게이지 채움 효과
     ------------------------------------------------------------------------ */

  function updateSliderProgress(sliderEl) {
    if (!sliderEl) return;
    const min = Number(sliderEl.min) || 0;
    const max = Number(sliderEl.max) || 100;
    const val = Number(sliderEl.value) || 0;
    const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    const clampedPct = Math.min(100, Math.max(0, pct));
    sliderEl.style.setProperty('--slider-pct', `${clampedPct.toFixed(1)}%`);
  }

  function initAllSlidersProgress() {
    const sliders = document.querySelectorAll('.range-slider');
    sliders.forEach((slider) => {
      updateSliderProgress(slider);
      if (!slider._hasProgressListener) {
        slider._hasProgressListener = true;
        slider.addEventListener('input', () => updateSliderProgress(slider));
      }
    });
  }

  /* ------------------------------------------------------------------------
     3. 듀얼 테마(Dual-Theme) 관리 및 도구별 기본값 차등 적용
     ------------------------------------------------------------------------ */

  const THEME_STORAGE_PREFIX = 'simulab_theme_';

  const SVG_SUN = `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
  const SVG_MOON = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

  function initTheme(pageKey = 'global') {
    // [v2] 사용자 요청: 차분한 화이트 톤으로 완전 통일 (다크 모드 제거).
    // 과거에 저장된 'dark' 설정이 있어도 무시합니다. 롤백 시 core-ui.backup.v1.js 로 되돌리세요.
    applyThemeToDocument('light');
    return 'light';
  }

  function applyThemeToDocument(theme) {
    const validTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', validTheme);

    let metaScheme = document.querySelector('meta[name="color-scheme"]');
    if (!metaScheme) {
      metaScheme = document.createElement('meta');
      metaScheme.setAttribute('name', 'color-scheme');
      document.head.appendChild(metaScheme);
    }
    metaScheme.setAttribute('content', validTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      if (validTheme === 'dark') {
        toggleBtn.innerHTML = `${SVG_SUN} <span>Light Mode</span>`;
        toggleBtn.setAttribute('aria-label', '클린 라이트 테마(스타일 A)로 전환');
      } else {
        toggleBtn.innerHTML = `${SVG_MOON} <span>Dark Pro</span>`;
        toggleBtn.setAttribute('aria-label', '다크 프로 테마(스타일 B)로 전환');
      }
    }

    window.dispatchEvent(
      new CustomEvent('simulab:themechange', { detail: { theme: validTheme } })
    );
  }

  function toggleTheme(pageKey = 'global') {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const defaultTheme = document.documentElement.getAttribute('data-default-theme') || 'dark';

    try {
      if (nextTheme === defaultTheme) {
        localStorage.removeItem(`${THEME_STORAGE_PREFIX}${pageKey}`);
      } else {
        localStorage.setItem(`${THEME_STORAGE_PREFIX}${pageKey}`, nextTheme);
      }
    } catch (err) {}

    applyThemeToDocument(nextTheme);
    showToast(
      nextTheme === 'dark'
        ? 'Dark Pro 테마(스타일 B)가 적용되었습니다.'
        : 'Clean Light 테마(스타일 A)가 적용되었습니다.'
    );
  }

  /* ------------------------------------------------------------------------
     4. 공통 헤더, 푸터, 법적 면책 조항(Disclaimer) 및 쿠키 배너 렌더링
     ------------------------------------------------------------------------ */

  function getRootPrefix() {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.includes('/tools/')) {
      return '../../';
    }
    if (path.includes('/legal/')) {
      return '../';
    }
    return './';
  }

  /* ------------------------------------------------------------------------
     [v2] 사이트 메뉴 단일 정의 (SITE_MENU)
     - 상단 헤더 메가메뉴와 메인 포털의 카테고리 디렉토리가 이 데이터를 함께 사용합니다.
     - 새 계산기를 추가할 때는 이 배열에 한 줄만 추가하면 모든 메뉴에 자동 반영됩니다.
     - href는 사이트 루트 기준 상대경로이며, soon: true 이면 "준비 중" 표시로 비활성화됩니다.
     ------------------------------------------------------------------------ */
  const SITE_MENU = [
    {
      id: 'job',
      label: '직장인·퇴직',
      icon: '💼',
      hot: true,
      desc: '2026년 최신 4대보험 요율과 근로기준법·국민연금법을 반영한 퇴직금, 국민연금 조기수령 손익분기, 실업급여, 월급 실수령액 등 직장인·퇴직자 필수 시뮬레이터 모음입니다.',
      items: [
        { title: '국민연금 조기수령 시뮬', sub: '60세 조기 vs 65세 정상 역전 나이(BEP)', href: 'tools/national-pension-sim/index.html', tool: 'national-pension-sim', hot: true },
        { title: '직장인 퇴직금 계산기', sub: '평균임금·통상임금 비교 · IRP 30% 감면', href: 'tools/severance-pay-calc/index.html', tool: 'severance-pay-calc', hot: true },
        { title: '실업급여 모의계산기', sub: '2026년 상한액(6.6만) · 소정급여일수', href: 'tools/unemployment-benefit-calc/index.html', tool: 'unemployment-benefit-calc', hot: true },
        { title: '월급 실수령액 계산기', sub: '2026년 4대보험 · 소득세 · 비과세 식대', href: 'tools/salary-net-calc/index.html', tool: 'salary-net-calc', hot: true },
        { title: '시간당 노동 가치', sub: '내 한 시간의 진짜 시급 값어치', href: 'tools/hourly-labor-value-calc/index.html', tool: 'hourly-labor-value-calc' },
      ],
    },
    {
      id: 'stock',
      label: '주식·퀀트',
      icon: '📈',
      hot: true,
      desc:
        '레버리지 ETF의 과거 구간 백테스팅(월별 상세표)부터 낙폭·회복 기간, RSI·볼린저밴드·200일선 기술지표, 변동성 끌림이 반영된 미래 시뮬레이션까지 한 도구에서 단계적으로 분석합니다. 아래 간이 계산기는 매매 전 빠르게 확인하는 용도입니다.',
      items: [
        { title: '과거 시나리오 & 백테스팅', sub: '구간별 적립식 결과 · 월별 상세표', href: 'tools/leverage-etf-sim/index.html?tab=historical', tool: 'leverage-etf-sim', hot: true },
        { title: '과거 낙폭 & 회복력', sub: 'MDD · 고점 회복 기간', href: 'tools/leverage-etf-sim/index.html?tab=drawdown', tool: 'leverage-etf-sim' },
        { title: '현재 기술지표', sub: 'RSI · 볼린저밴드 · 200일선', href: 'tools/leverage-etf-sim/index.html?tab=technical', tool: 'leverage-etf-sim' },
        { title: '미래 시뮬레이션', sub: '음의 복리 · 변동성 끌림', href: 'tools/leverage-etf-sim/index.html?tab=formula', tool: 'leverage-etf-sim' },
        { title: '수익률 계산기', sub: '세금·수수료 반영 실질 수익률', href: 'tools/stock-profit-calc/index.html', tool: 'stock-profit-calc' },
        { title: '평단가 · 물타기 계산기', sub: '분할 매수 평균 단가', href: 'tools/stock-water-ride-calc/index.html', tool: 'stock-water-ride-calc' },
        { title: '목표가 · 복리 계산기', sub: '목표 수익률 달성 가격', href: 'tools/stock-target-compound-calc/index.html', tool: 'stock-target-compound-calc' },
      ],
    },
    {
      id: 'dividend',
      label: '배당·세금',
      icon: '💰',
      hot: true,
      desc:
        '배당성장주(SCHD·JEPI·JEPQ 등)의 재투자 복리 효과와 연 2,000만원 초과 시 적용되는 금융소득종합과세·건강보험료 부담, 절세계좌의 과세이연 효과를 비교합니다.',
      items: [
        { title: '배당 복리 & 세금', sub: '재투자(DRIP) · 건보료 · 절세계좌', href: 'tools/dividend-tax-sim/index.html', tool: 'dividend-tax-sim', hot: true },
        { title: '월 배당 목표 달성 계산기', sub: '목표 월급까지 필요한 투자금', href: 'tools/dividend-goal-calc/index.html', tool: 'dividend-goal-calc' },
      ],
    },
    {
      id: 'realty',
      label: '부동산·대출',
      icon: '🏠',
      hot: true,
      desc:
        '주택담보대출의 상환 방식별 총이자와 LTV·스트레스 DSR 한도, 전세와 월세의 기회비용 비교, 1세대1주택 비과세·장기보유특별공제를 반영한 양도소득세를 계산합니다.',
      items: [
        { title: '그때 그 아파트 샀다면', sub: '마래푸·은마 과거 매수가 vs 현재 실거래가', href: 'tools/past-apt-timemachine/index.html', tool: 'past-apt-timemachine', hot: true },
        { title: '주담대 한도 · DSR', sub: '상환 방식 비교 · 최대 한도', href: 'tools/loan-mortgage-calc/index.html', tool: 'loan-mortgage-calc', hot: true },
        { title: '전세 vs 월세', sub: '전환율 · 주거 기회비용', href: 'tools/jeonse-wolse-sim/index.html', tool: 'jeonse-wolse-sim' },
        { title: '양도소득세 · 세후 수익', sub: '12억 비과세 · 장특공제', href: 'tools/capital-gains-tax-sim/index.html', tool: 'capital-gains-tax-sim' },
        { title: '부동산 평수 ㎡ 환산기', sub: '84㎡(34평) · 59㎡(25평) · 평당가', href: 'tools/area-pyeong-calc/index.html', tool: 'area-pyeong-calc' },
      ],
    },
    {
      id: 'life',
      label: '라이프·생활',
      icon: '✨',
      hot: true,
      desc:
        '만나이·띠 계산, 쇼핑 퍼센트 할인율, 시간의 유한함을 일깨우는 감성 카운트다운 모음입니다. 부모님과의 시간, 반려동물 산책 등 소중한 순간을 숫자로 확인합니다.',
      items: [
        { title: '만나이 띠 계산기', sub: '개정 행정기본법 기준 · 12간지 · D-Day', href: 'tools/korean-age-calc/index.html', tool: 'korean-age-calc', hot: true },
        { title: '퍼센트 할인율 계산기', sub: '쇼핑 세일가 · 인상률 · 비중 계산', href: 'tools/percent-discount-calc/index.html', tool: 'percent-discount-calc', hot: true },
        { title: '부모님과의 남은 시간', sub: '평생 실질 대화 시간 · 함께할 식사 끼니', href: 'tools/life-hourglass-sim/index.html?mode=parents', tool: 'life-hourglass-sim' },
        { title: '반려동물 무지개 시계', sub: '강아지·고양이 잔여 산책 횟수 · 교감 시간', href: 'tools/life-hourglass-sim/index.html?mode=pet', tool: 'life-hourglass-sim' },
        { title: '아이가 품에 머무는 시간', sub: '만 12세 이전 품안 황금기 · 남은 주말', href: 'tools/life-hourglass-sim/index.html?mode=child', tool: 'life-hourglass-sim' },
        { title: '청춘의 사계절 & 여행', sub: 'WHO 건강수명 · 벚꽃 봄 · 자유 여행 주말', href: 'tools/life-hourglass-sim/index.html?mode=youth', tool: 'life-hourglass-sim' },
        { title: '연인과 함께 눈뜨는 아침', sub: '함께 눈뜰 아침 · 마주할 저녁 식사', href: 'tools/life-hourglass-sim/index.html?mode=couple', tool: 'life-hourglass-sim' },
        { title: '내 인생의 모래시계 (종합)', sub: '기대수명 대비 생애 진행률 · 잔여 일수', href: 'tools/life-hourglass-sim/index.html', tool: 'life-hourglass-sim' },
      ],
    },
    {
      id: 'fun',
      label: '심심풀이',
      icon: '🎲',
      hot: true,
      desc: '실시간 캔버스 사다리타기, 센스있는 더치페이 복불복, 로또 1등 무한 시뮬레이터, 세후 실수령액 등 모임과 여가를 위한 유쾌한 도구 모음입니다.',
      items: [
        { title: '로또 1등 무한 시뮬레이터', sub: '실제 확률 체감 · 1초 100회', href: 'tools/lotto-draw-sim/index.html', tool: 'lotto-draw-sim', hot: true },
        { title: '인터랙티브 사다리타기', sub: '2~12명 · 캔버스 애니메이션 · 복불복', href: 'tools/ladder-draw-game/index.html', tool: 'ladder-draw-game' },
        { title: '더치페이 & 뿜빠이 복불복', sub: '1/N 절사 · 지각자 벌금 · 카톡 문구 복사', href: 'tools/dutch-pay-roulette/index.html', tool: 'dutch-pay-roulette' },
        { title: '로또 세후 실수령 & 월이자', sub: '33% 세법 공제 · 예금·배당 이자', href: 'tools/lotto-tax-interest-calc/index.html', tool: 'lotto-tax-interest-calc' },
      ],
    },
    {
      id: 'game',
      label: '미니게임',
      icon: '🎮',
      hot: true,
      desc: '잠시 쉬어가는 힐링 타임! 클래식 레트로 테트리스, 스피드 타자 산성비, 벽돌 깨기, 미사일 피하기 닷지 1.9 등 가볍고 몰입감 넘치는 아케이드 게임 모음입니다.',
      items: [
        { title: '레트로 테트리스', sub: '정통 7블록 · 고스트 착지 · 모바일 터치패드', href: 'tools/game-tetris/index.html', tool: 'game-tetris', hot: true },
        { title: '스피드 타자 산성비', sub: '하늘에서 떨어지는 금융 단어 격추', href: 'tools/game-typing/index.html', tool: 'game-typing', hot: true },
        { title: '네온 벽돌 깨기', sub: '공 분열 & 레이저 아이템 알카노이드', href: 'tools/game-brick-breaker/index.html', tool: 'game-brick-breaker', hot: true },
        { title: '미사일 피하기 닷지', sub: '고전 명작 닷지 1.9 탄막 회피 서바이벌', href: 'tools/game-dodge/index.html', tool: 'game-dodge', hot: true },
      ],
    },
    {
      id: 'health',
      label: '헬스·생활',
      icon: '🏃',
      desc: '기초대사량(BMR)과 TDEE 칼로리 분석, 카페인 반감기 및 수면 골든타임, 러닝 Zone 2 심박수 등 건강과 일상 생활 활력 지표를 과학적으로 계산합니다.',
      items: [
        { title: '다이어트 BMR·TDEE', sub: '기초대사량 · 유지 칼로리 · 식단 처방', href: 'tools/diet-bmr-tdee-calc/index.html', tool: 'diet-bmr-tdee-calc' },
        { title: '카페인 반감기 & 꿀잠', sub: '체내 잔여 카페인 · 취침 골든타임', href: 'tools/caffeine-sleep-calc/index.html', tool: 'caffeine-sleep-calc' },
        { title: '러닝 Zone 2 심박수', sub: '심박수 구간 · 칼로리', href: 'tools/running-zone-calc/index.html', tool: 'running-zone-calc' },
      ],
    },
    {
      id: 'saju',
      label: '사주·심리',
      icon: '🔮',
      desc: '생년월일시 만세력 기반 오행 분석과 재물운 투자 성향, 행동경제학 8문항 기반 동물 MBTI, 존 보울비 애착이론 기반 사랑의 동물 연애 궁합 테스트를 제공합니다.',
      items: [
        { title: '사주 오행 & 재물운', sub: '만세력 오행 분석 · 자산 궁합', href: 'tools/saju-wealth-sim/index.html', tool: 'saju-wealth-sim' },
        { title: '투자 성향 동물 MBTI', sub: '16유형 페르소나 · 포트폴리오 처방', href: 'tools/invest-animal-mbti/index.html', tool: 'invest-animal-mbti' },
        { title: '연애 유형 & 사랑의 동물', sub: '존 보울비 애착이론 · 연인 궁합', href: 'tools/love-animal-attachment/index.html', tool: 'love-animal-attachment' },
      ],
    },
    {
      id: 'business',
      label: '비즈니스',
      icon: '📊',
      desc: '설비·자동화 도입의 투자 회수 기간(Payback), 손익분기점(BEP), 순현재가치(NPV)를 한 번에 확인합니다.',
      items: [
        { title: '설비 도입 ROI · BEP', sub: '회수 기간 · NPV · 손익분기', href: 'tools/logistics-roi-calc/index.html', tool: 'logistics-roi-calc' },
      ],
    },
    {
      id: 'insight',
      label: '인사이트',
      icon: '💡',
      desc:
        '일상의 소비와 선택을 숫자로 바꿔 보는 위트 있는 시뮬레이션입니다. 그 돈을 투자했을 때의 자산 격차를 실물과 함께 확인합니다.',
      items: [
        { title: '담배값 주식 투자 시뮬', sub: '하루 1갑 금연 후 S&P500 복리 + 건강 영수증', href: 'tools/smoking-wealth-sim/index.html', tool: 'smoking-wealth-sim', hot: true },
        { title: '소비 vs 투자 기회비용', sub: '신차·명품 대신 S&P500 복리 투자', href: 'tools/opportunity-cost-calc/index.html', tool: 'opportunity-cost-calc', hot: true },
        { title: '커피값 기회비용', sub: '그 돈을 TQQQ에 넣었다면?', href: 'tools/coffee-opportunity-calc/index.html', tool: 'coffee-opportunity-calc' },
        { title: '매도 후 상승분', sub: '팔고 나서 얼마나 올랐을까', href: 'tools/missed-investment-calc/index.html', tool: 'missed-investment-calc' },
        { title: '은퇴 생존 기간', sub: '자산으로 몇 년을 버틸까', href: 'tools/retirement-survival-sim/index.html', tool: 'retirement-survival-sim' },
        { title: '과거 물가 현재 환산', sub: '그때 그 돈의 지금 가치', href: 'tools/inflation-purchasing-power-calc/index.html', tool: 'inflation-purchasing-power-calc' },
      ],
    },
  ];

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  /* [v2.5] 차분하고 모던한 2중 레이어 상단 헤더 HTML 생성 */
  function buildHeaderHtml(prefix, activeToolId) {
    const groups = SITE_MENU.map((cat) => {
      const isActive = cat.items.some((it) => it.tool && it.tool === activeToolId);
      const links = cat.items
        .map((it) => {
          return it.soon
            ? `<span class="gnb-link is-soon" aria-disabled="true"><span>${escapeHtml(it.title)}</span><em>준비 중</em></span>`
            : `<a class="gnb-link" href="${prefix}${it.href}"><span class="gnb-link-title">${escapeHtml(it.title)}</span><small>${escapeHtml(it.sub)}</small></a>`;
        })
        .join('');

      return `
        <li class="gnb-item${isActive ? ' is-active' : ''}">
          <button type="button" class="gnb-btn" aria-haspopup="true" aria-expanded="false">
            <span>${escapeHtml(cat.label)}</span>
            <svg class="gnb-chevron" viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
              <path d="M3.2 5.5a.75.75 0 0 1 1.06 0L8 9.24l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L3.2 6.56a.75.75 0 0 1 0-1.06z"/>
            </svg>
          </button>
          <div class="gnb-panel">${links}</div>
        </li>`;
    }).join('');

    return `
      <div class="container header-inner">
        <a href="${prefix}index.html" class="brand-logo" aria-label="SimuLab 홈">
          <span class="brand-logo-mark">SL</span>
          <span class="brand-logo-text">SimuLab</span>
        </a>
        <nav class="gnb" id="gnb-nav" aria-label="주요 메뉴">
          <div class="gnb-pill-track">
            <ul class="gnb-list">${groups}</ul>
          </div>
        </nav>
        <div class="header-actions" style="display: flex; align-items: center; gap: 0.6rem;">
          <button type="button" class="btn-save-site" id="btn-save-site" title="스마트폰 홈 화면 또는 PC 바탕화면에 바로가기 아이콘 저장">
            <span>⭐</span><span class="save-btn-text">홈화면 저장</span>
          </button>
          <button type="button" class="gnb-burger" id="gnb-burger" aria-label="메뉴 열기" aria-expanded="false" aria-controls="gnb-nav">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    `;
  }

  /* PWA 홈 화면 추가 이벤트 캐싱 */
  let deferredInstallPrompt = null;
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
    });
  }

  /* 홈 화면 / 바로가기 저장 안내 모달 */
  function showSaveSiteModal() {
    if (document.getElementById('save-site-modal')) return;

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('SimuLab이 홈 화면에 성공적으로 추가되었습니다!');
        }
        deferredInstallPrompt = null;
      });
      return;
    }

    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

    let guideHtml = '';
    if (isIOS) {
      guideHtml = `
        <div style="background: #f8fafc; border: 1.5px solid var(--border-color); border-radius: 12px; padding: 1.15rem; margin: 1.25rem 0; text-align: left; font-size: 0.88rem; line-height: 1.6;">
          <div style="font-weight: 800; color: #1e3a8a; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>📱</span> 아이폰 / 아이패드 (Safari) 추가 방법
          </div>
          <ol style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary);">
            <li style="margin-bottom: 0.35rem;">하단 중앙의 <strong>공유 버튼 ( <span style="font-size: 1.05rem;">⎋</span> )</strong>을 누릅니다.</li>
            <li style="margin-bottom: 0.35rem;">메뉴를 아래로 내려 <strong>[홈 화면에 추가 ➕]</strong>를 선택합니다.</li>
            <li>우측 상단 <strong>[추가]</strong>를 누르면 앱처럼 아이콘이 생성되어 원터치로 접속됩니다!</li>
          </ol>
        </div>
      `;
    } else if (isMobile) {
      guideHtml = `
        <div style="background: #f8fafc; border: 1.5px solid var(--border-color); border-radius: 12px; padding: 1.15rem; margin: 1.25rem 0; text-align: left; font-size: 0.88rem; line-height: 1.6;">
          <div style="font-weight: 800; color: #1e3a8a; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>📱</span> 안드로이드 스마트폰 (Chrome / 삼성인터넷)
          </div>
          <ol style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary);">
            <li style="margin-bottom: 0.35rem;">브라우저 우측 상단 <strong>더보기 ( <span style="font-size: 1.05rem;">⋮</span> )</strong> 메뉴를 누릅니다.</li>
            <li style="margin-bottom: 0.35rem;"><strong>[홈 화면에 추가]</strong> 또는 <strong>[앱 설치]</strong>를 선택합니다.</li>
            <li>바탕화면에 생성된 <strong>SimuLab 아이콘</strong>으로 언제든 편하게 열어보세요!</li>
          </ol>
        </div>
      `;
    } else {
      guideHtml = `
        <div style="background: #f8fafc; border: 1.5px solid var(--border-color); border-radius: 12px; padding: 1.15rem; margin: 1.25rem 0; text-align: left; font-size: 0.88rem; line-height: 1.6;">
          <div style="font-weight: 800; color: #1e3a8a; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>💻</span> PC 데스크톱 (Chrome / Edge / Whale)
          </div>
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary);">
            <li style="margin-bottom: 0.35rem;"><strong>즐겨찾기(북마크) 등록:</strong> 키보드 단축키 <kbd style="background: #e2e8f0; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">Ctrl + D</kbd> (Mac: <kbd style="background: #e2e8f0; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">⌘ + D</kbd>)</li>
            <li><strong>바탕화면 바로가기 앱 설치:</strong> 주소창 맨 우측의 <strong>[앱 설치 ⊕]</strong> 아이콘 클릭</li>
          </ul>
        </div>
      `;
    }

    const modal = document.createElement('div');
    modal.id = 'save-site-modal';
    modal.className = 'save-site-modal-overlay';
    modal.innerHTML = `
      <div class="save-site-modal-card" style="background: #ffffff; border-radius: 16px; border: 1.5px solid var(--border-color); max-width: 480px; width: 90%; padding: 1.75rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 0.4rem;">
            <span>⭐</span> 홈 화면 & 바로가기 저장
          </h3>
          <button type="button" id="btn-close-save-modal" aria-label="닫기" style="border: none; background: transparent; font-size: 1.3rem; color: var(--text-muted); cursor: pointer; padding: 0.25rem;">✕</button>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
          앱 스토어 설치 없이 터치 한 번으로 언제든 편리하게 스마트 계산기들을 이용할 수 있습니다.
        </p>

        ${guideHtml}

        <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary" id="btn-copy-site-url" style="flex: 2; min-width: 160px; padding: 0.75rem; font-weight: 700;">
            🔗 사이트 주소 복사하기
          </button>
          <button type="button" class="btn btn-outline" id="btn-done-save-modal" style="flex: 1; padding: 0.75rem;">
            닫기
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    const btnClose = modal.querySelector('#btn-close-save-modal');
    const btnDone = modal.querySelector('#btn-done-save-modal');
    const btnCopy = modal.querySelector('#btn-copy-site-url');

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnDone) btnDone.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const url = window.location.href;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(() => {
            showToast('🔗 사이트 링크가 클립보드에 복사되었습니다! 카톡이나 메모장에 저장해 두세요.');
          }).catch(() => {
            prompt('아래 링크를 복사하세요:', url);
          });
        } else {
          prompt('아래 링크를 복사하세요:', url);
        }
      });
    }
  }

  /* [v2] 헤더 메뉴 동작: 데스크톱 클릭/호버 패널, 모바일 햄버거 드로어, ESC·바깥 클릭 닫기 */
  function bindHeaderMenu(headerEl) {
    const burger = headerEl.querySelector('#gnb-burger');
    const btnSaveSite = headerEl.querySelector('#btn-save-site');
    const items = Array.from(headerEl.querySelectorAll('.gnb-item'));

    if (btnSaveSite) {
      btnSaveSite.addEventListener('click', (e) => {
        e.preventDefault();
        showSaveSiteModal();
      });
    }

    function closeAllPanels() {
      items.forEach((li) => {
        li.classList.remove('open');
        const b = li.querySelector('.gnb-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }

    items.forEach((li) => {
      const btn = li.querySelector('.gnb-btn');
      if (!btn) return;
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const willOpen = !li.classList.contains('open');
        closeAllPanels();
        if (willOpen) {
          li.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    if (burger) {
      burger.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const opened = headerEl.classList.toggle('menu-open');
        burger.setAttribute('aria-expanded', opened ? 'true' : 'false');
        burger.setAttribute('aria-label', opened ? '메뉴 닫기' : '메뉴 열기');
      });
    }

    document.addEventListener('click', (ev) => {
      if (!headerEl.contains(ev.target)) {
        closeAllPanels();
        headerEl.classList.remove('menu-open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        closeAllPanels();
        headerEl.classList.remove('menu-open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------------------------------------
     [v2 Step 2] 도구 페이지 상단 통일: 브레드크럼 + 긴 부제 접기
     - 모든 도구의 .page-header 에 동일한 경로 표시(홈 > 카테고리 > 도구명)를 넣고,
       240자가 넘는 .page-subtitle 은 2줄로 접어 "자세히 보기"로 펼칩니다. (내용은 삭제하지 않음)
     ------------------------------------------------------------------------ */
  const TOOL_NAMES = {
    'leverage-etf-sim': '주식·ETF 퀀트 시뮬레이터',
    'dividend-tax-sim': '배당 복리 & 세금 계산기',
    'loan-mortgage-calc': '주담대 한도 & DSR',
    'jeonse-wolse-sim': '전세 vs 월세 손익 비교',
    'capital-gains-tax-sim': '부동산 양도세 계산기',
    'logistics-roi-calc': '물류 자동화 ROI 분석',
    'running-zone-calc': '러닝 Zone 2 심박수',
    'diet-bmr-tdee-calc': '다이어트 BMR·TDEE',
    'caffeine-sleep-calc': '카페인 반감기 & 꿀잠',
    'stock-profit-calc': '주식 실질 수익률 계산기',
    'stock-water-ride-calc': '주식 평단가 물타기',
    'stock-target-compound-calc': '목표가 & 복리 수익',
    'dividend-goal-calc': '월 배당 목표금액 계산기',
    'coffee-opportunity-calc': '커피값 투자 기회비용',
    'missed-investment-calc': '과거 그때 샀더라면',
    'retirement-survival-sim': '은퇴자금 조기소진 계산기',
    'hourly-labor-value-calc': '나의 진짜 시급 가치',
    'inflation-purchasing-power-calc': '화폐가치 하락 인플레',
    'saju-wealth-sim': '사주 오행 & 재물운 분석',
    'invest-animal-mbti': '투자 성향 동물 MBTI',
    'lotto-draw-sim': '로또 1등 당첨 시뮬레이터',
    'lotto-tax-interest-calc': '로또 세후 수령액 & 이자',
    'life-hourglass-sim': '내 인생의 모래시계',
    'alcohol-widmark-calc': '음주 알코올 분해시간',
    'love-animal-attachment': '연애 동물 애착 심리테스트',
    'ladder-draw-game': '인터랙티브 사다리타기',
    'dutch-pay-roulette': '센스있는 더치페이 계산기',
    'severance-pay-calc': '직장인 퇴직금 계산기',
    'salary-net-calc': '월급 실수령액 계산기',
    'opportunity-cost-calc': '소비 vs 투자 기회비용',
    'korean-age-calc': '만나이 띠 계산기',
    'percent-discount-calc': '퍼센트 할인율 계산기',
    'area-pyeong-calc': '부동산 평수 ㎡ 환산기',
    'national-pension-sim': '국민연금 조기수령 시뮬',
    'unemployment-benefit-calc': '실업급여 모의계산기',
    'past-apt-timemachine': '그때 그 아파트 샀다면',
    'smoking-wealth-sim': '담배값 주식 투자 시뮬',
  };

  function enhancePageHeader(prefix, activeToolId) {
    try {
      const ph = document.querySelector('.page-header');
      if (!ph || typeof ph.insertBefore !== 'function' || ph.getAttribute('data-enhanced') === '1') return;
      ph.setAttribute('data-enhanced', '1');

      const cat = SITE_MENU.find((c) => c.items.some((it) => it.tool === activeToolId));
      if (cat && TOOL_NAMES[activeToolId]) {
        const nav = document.createElement('nav');
        nav.className = 'breadcrumb';
        nav.setAttribute('aria-label', '현재 위치');
        nav.innerHTML =
          `<a href="${prefix}index.html">홈</a><span aria-hidden="true">/</span>` +
          `<a href="${prefix}index.html#cat-${cat.id}">${escapeHtml(cat.label)}</a><span aria-hidden="true">/</span>` +
          `<strong>${escapeHtml(TOOL_NAMES[activeToolId])}</strong>`;
        ph.insertBefore(nav, ph.firstChild);
      }

      const sub = ph.querySelector('.page-subtitle');
      if (sub && (sub.textContent || '').trim().length > 240) {
        sub.classList.add('is-clamped');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'subtitle-toggle';
        btn.textContent = '자세히 보기';
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', () => {
          const clamped = sub.classList.toggle('is-clamped');
          btn.textContent = clamped ? '자세히 보기' : '접기';
          btn.setAttribute('aria-expanded', clamped ? 'false' : 'true');
        });
        sub.insertAdjacentElement('afterend', btn);
      }
    } catch (err) {
      // 상단 보강 실패는 도구 동작에 영향을 주지 않도록 무시
    }
  }

  /**
   * 카테고리별 맞춤형 스마트 법적 면책 고지 및 법 개정 대비 방어 문구 생성기
   */
  function buildSmartDisclaimerHtml(activeToolId) {
    // 1) 법령 및 규정 개정 대비 공통 안전 조항 (모든 도구 공통 삽입)
    const lawRevisionNote = `
      <div style="margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-color); font-size: 0.78rem; color: var(--text-muted); line-height: 1.55;">
        <strong>※ 법령 및 제도 개정 관련 중요 안내:</strong> 본 시뮬레이터에 적용된 세율, 공제 기준, 대출 규제(DSR/LTV), 법적 기준 등은 <strong>2026년 현행 법령</strong>을 기준으로 설계되었습니다. 향후 세법 개정, 정부 부동산·금융 규제 정책 변경 또는 관련 법률 제·개정에 따라 실제 적용 기준과 차이가 발생할 수 있습니다. 법적·재정적 중요 의사결정 전 반드시 최신 공시 법령과 소관 부처(기획재정부, 국세청, 금융위원회 등)의 최신 공식 발표를 재확인하시기 바랍니다.
      </div>
    `;

    // 2) 음주/교통 도구 (초고위험: 도로교통법 제44조 및 음주운전 방어)
    if (activeToolId === 'alcohol-widmark-calc') {
      return `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1.5px solid #ef4444; border-radius: 8px; padding: 1rem; color: var(--text-primary); margin-bottom: 0.5rem;">
          <strong style="color: #ef4444; font-size: 0.95rem; display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.4rem;">
            ⚠️ 도로교통법 제44조 준수 및 법적 면책 강력 경고 (Disclaimer)
          </strong>
          <p style="margin: 0; line-height: 1.6; font-size: 0.85rem;">
            본 위드마크 시뮬레이터의 계산 결과는 스웨덴 생리학자 위드마크(Widmark)의 표준 이론 공식에 따른 <strong>단순 수학적 추정치</strong>에 불과합니다.<br/>
            실제 혈중알코올농도 및 알코올 완전 분해 소요시간은 개인의 체질, 간 효소(ADH/ALDH) 분해 능력, 수면 시간, 안주 섭취 여부, 체지방률, 복용 약물 등에 따라 <strong>극심한 개인차</strong>가 발생합니다.<br/>
            <strong>본 계산 결과는 도로교통법상 경찰 단속, 법정 소송, 행정 처분 등 어떠한 법적 증거 자료나 운전 가능 여부의 면책 근거로도 절대 사용될 수 없습니다.</strong><br/>
            단 한 방울의 술이라도 마신 후에는 <strong>절대 운전대를 잡지 마시고 대중교통이나 대리운전을 이용</strong>하시기 바랍니다.
          </p>
        </div>
        ${lawRevisionNote}
      `;
    }

    // 3) 세금/세무 도구 (고위험: 세무사법 제22조 및 세법 개정 방어)
    if (['capital-gains-tax-sim', 'dividend-tax-sim', 'lotto-tax-interest-calc'].includes(activeToolId)) {
      return `
        <strong>세무 및 법적 면책 고지 (Tax & Legal Disclaimer):</strong><br/>
        본 시뮬레이터는 <strong>「세무사법」 제22조(무자격자 세무대리 금지)</strong>를 준수하며, 특정 개인에 대한 맞춤형 세무 자문이나 확정 세액 산정 행위에 해당하지 않습니다.<br/>
        화면에 표시되는 산출 세액(양도소득세, 배당소득세, 지방소득세, 로또 원천징수세액 등)은 2026년 소득세법 및 조세특례제한법의 표준 세율을 기반으로 한 <strong>단순 모의 계산 결과</strong>입니다.<br/>
        납세의무자 본인의 타 소득(금융소득 종합과세, 근로/사업소득 합산), 인적공제, 세액감면, 과거 이월결손금, 그리고 <strong>국회 세법개정안(금투세, 대주주 요건, 배당 분리과세 등) 시행 여부</strong>에 따라 실제 국세청 부과 세액과 상당한 차이가 발생할 수 있습니다. 정확한 세무 신고 및 납부는 국세청 홈택스(Hometax) 또는 공인 세무사·회계사 등 세무 전문가와 상담하시기 바랍니다.
        ${lawRevisionNote}
      `;
    }

    // 3-1) 직장인·급여·노무·연금 도구 (근로기준법, 퇴직급여보장법, 국민연금법, 고용보험법 방어)
    if (['severance-pay-calc', 'salary-net-calc', 'hourly-labor-value-calc', 'national-pension-sim', 'unemployment-benefit-calc'].includes(activeToolId)) {
      return `
        <strong>노무·연금·고용보험 법적 면책 고지 (Labor & Pension Disclaimer):</strong><br/>
        본 시뮬레이터는 <strong>「근로기준법」, 「근로자퇴직급여 보장법」, 「국민연금법」, 「고용보험법」 및 2026년 현행 소득세법</strong>의 표준 산정 기준을 적용한 모의 시뮬레이터입니다.<br/>
        실제 지급되는 퇴직금, 실업급여, 국민연금 수령액은 개별 근로자의 소속 사업장 취업규칙, 실제 고용보험 피보험 단위기간, 퇴직 사유의 정당성 심사, 과거 납부 이력 및 국회 연금개혁 법안 시행 시점에 따라 실제 지급액과 차이가 발생할 수 있습니다. 확정 금액과 자격 심사는 고용노동부 고용복지플러스센터(1350) 또는 국민연금공단(1355)을 통해 확인하시기 바랍니다.
        ${lawRevisionNote}
      `;
    }

    // 4) 주식/퀀트/투자 도구 (고위험: 자본시장법 제6조, 제17조 및 원금손실 방어)
    if (['leverage-etf-sim', 'stock-profit-calc', 'stock-water-ride-calc', 'stock-target-compound-calc', 'dividend-goal-calc', 'missed-investment-calc', 'retirement-survival-sim', 'coffee-opportunity-calc', 'opportunity-cost-calc', 'smoking-wealth-sim'].includes(activeToolId)) {
      return `
        <strong>금융투자 법적 면책 고지 (Financial Investment Disclaimer):</strong><br/>
        본 서비스는 <strong>「자본시장과 금융투자업에 관한 법률」 제6조 및 제17조</strong>에 따른 '투자자문업' 또는 '유사투자자문업'에 해당하지 않으며, 특정 종목(주식, 레버리지 ETF, 채권 등)의 매수·매도 타이밍 추천이나 수익률을 보장하지 않습니다.<br/>
        백테스팅 및 과거 데이터 시뮬레이션 결과는 역사적 가격에 기반한 시계열 분석일 뿐, <strong>과거의 수익률이 미래의 투자 성과를 담보하지 않습니다.</strong> 레버리지 및 주식 투자는 시장 급변 시 극심한 원금 손실(음의 복리 효과, 롤오버 비용 등)이 수반될 수 있으며, 투자에 따른 최종 손익과 법적 책임은 전적으로 투자자 본인에게 귀속됩니다.
        ${lawRevisionNote}
      `;
    }

    // 5) 대출/부동산 도구 (중고위험: 금융소비자보호법 및 DSR 규제 방어)
    if (['loan-mortgage-calc', 'jeonse-wolse-sim', 'past-apt-timemachine'].includes(activeToolId)) {
      return `
        <strong>대출 한도 및 부동산 금융 면책 고지 (Loan & Real Estate Disclaimer):</strong><br/>
        본 계산기는 <strong>「금융소비자보호법」</strong>을 준수하며, 금융회사의 대출 상품 중개 또는 대출 승인을 약정하는 것이 아닙니다.<br/>
        산출된 주택담보대출 한도, 스트레스 DSR(총부채원리금상환비율), LTV, 예상 월 원리금 등은 금융당국의 일반 가이드라인을 바탕으로 한 추정치입니다. 실제 승인 한도 및 최종 금리는 각 은행·금융기관의 내부 여신 심사 규정, 개인 신용점수, 담보물 시세 감정가, 정부의 가계대출 총량 규제 정책에 따라 수시로 변동될 수 있습니다.
        ${lawRevisionNote}
      `;
    }

    // 6) 건강/의료 도구 (주의: 의료법 제27조 무면허 의료행위 방어)
    if (['diet-bmr-tdee-calc', 'caffeine-sleep-calc', 'running-zone-calc'].includes(activeToolId)) {
      return `
        <strong>건강 및 의학적 면책 고지 (Health & Medical Disclaimer):</strong><br/>
        본 도구에서 제공하는 기초대사량(BMR), 일일총에너지소비량(TDEE), 카페인 반감기, 러닝 심박수 Zone 등은 표준 스포츠 생리학 공식(해리스-베네딕트, 카르보넨 등)에 기초한 <strong>일반 건강 참고 정보</strong>입니다.<br/>
        본 결과는 <strong>「의료법」 제27조에 따른 의학적 진단, 질병의 예방 및 치료, 전문 처방을 대신할 수 없습니다.</strong> 기저질환자, 임산부, 청소년, 약물 복용자 또는 신체 이상 증상이 있으신 분은 운동이나 식이요법 변경 전 반드시 전문 의료진 또는 보건 전문가의 진료와 상담을 받으시기 바랍니다.
        ${lawRevisionNote}
      `;
    }

    // 7) 사행성/복권/엔터테인먼트 도구 (주의: 복권기금법 및 도박문제 상담 안내)
    if (['lotto-draw-sim', 'saju-wealth-sim', 'ladder-draw-game', 'dutch-pay-roulette'].includes(activeToolId)) {
      return `
        <strong>엔터테인먼트 및 사행성 방지 면책 고지 (Entertainment Disclaimer):</strong><br/>
        본 시뮬레이터는 수학적 확률(독립시행 난수 생성) 및 전통 명리학적 통계 알고리즘을 활용한 <strong>순수 엔터테인먼트 및 교양 목적의 콘텐츠</strong>입니다.<br/>
        로또 번호 추천이나 당첨 시뮬레이션은 어떠한 당첨 확률 향상도 보장하지 않으며, 사주 오행 분석 또한 운명을 결정짓는 과학적 사실이 아닙니다. 복권 과몰입은 가계 경제에 심각한 피해를 줄 수 있습니다.<br/>
        <span style="color: var(--text-muted); font-size: 0.8rem;">※ 도박문제로 어려움을 겪고 계시다면 <strong>한국도박문제예방치유원(국번없이 1336, 24시간 무료 상담)</strong>의 도움을 받으실 수 있습니다.</span>
        ${lawRevisionNote}
      `;
    }

    // 8) 기본 일반 면책 고지 (비즈니스/일상)
    return `
      <strong>법적 면책 고지 (General Legal Disclaimer):</strong><br/>
      본 시뮬레이션 결과는 사용자가 직접 입력한 조건에 기반한 단순 수학적·통계적 추정치이며, 실제 결과나 경제적 이익을 보증하지 않습니다.<br/>
      본 사이트는 100% 클라이언트 브라우저 연산 방식으로 운영되어 이용자의 개인정보나 입력값을 외부 서버로 전송·수집하지 않습니다.
      ${lawRevisionNote}
    `;
  }

  let isCommonUiInitialized = false;

  function autoDetectToolId() {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    const match = path.match(/\/tools\/([^\/]+)/);
    if (match) return match[1];
    if (path.includes('admin')) return 'admin-dashboard';
    return 'home';
  }

  function initCommonUI(activeToolId = 'home') {
    if (isCommonUiInitialized) return;
    isCommonUiInitialized = true;

    // 만약 activeToolId가 기본값 'home'인데 실제 URL이 특정 도구 경로라면 자동 감지
    if (activeToolId === 'home') {
      const detected = autoDetectToolId();
      if (detected !== 'home') activeToolId = detected;
    }

    const prefix = getRootPrefix();
    initTheme(activeToolId);

    // 0) 사용자 행동 및 방문 경로 자동 추적기(tracker.js) 비동기 로드
    if (!document.getElementById('simulab-tracker-script')) {
      const trackerScript = document.createElement('script');
      trackerScript.id = 'simulab-tracker-script';
      trackerScript.src = prefix + 'assets/js/tracker.js';
      trackerScript.async = true;
      document.head.appendChild(trackerScript);
    }

    // 1) 상단 헤더 주입 (v2: 카테고리 메가메뉴 + 모바일 햄버거)
    const headerEl = document.getElementById('site-header');
    if (headerEl) {
      headerEl.className = 'site-header';
      headerEl.innerHTML = buildHeaderHtml(prefix, activeToolId);
      bindHeaderMenu(headerEl);
    }
    enhancePageHeader(prefix, activeToolId);

    // 2) 카테고리별 맞춤형 스마트 법적 면책 조항(Disclaimer) 주입
    let disclaimerEl = document.getElementById('legal-disclaimer') || document.getElementById('disclaimer-container');
    if (!disclaimerEl && activeToolId !== 'home' && activeToolId !== 'admin-dashboard') {
      // id 요소가 누락된 도구인 경우 메인 컨테이너 최하단에 자동 생성하여 주입
      const mainEl = document.querySelector('main.container') || document.querySelector('main');
      if (mainEl) {
        disclaimerEl = document.createElement('div');
        disclaimerEl.id = 'legal-disclaimer';
        mainEl.appendChild(disclaimerEl);
      }
    }
    if (disclaimerEl) {
      disclaimerEl.className = 'legal-disclaimer-box';
      disclaimerEl.innerHTML = buildSmartDisclaimerHtml(activeToolId);
    }

    // 3) 표시광고법 준수 제휴 마케팅 고지 주입
    const affiliateEl = document.getElementById('affiliate-disclosure');
    if (affiliateEl) {
      affiliateEl.className = 'affiliate-disclosure-box';
      affiliateEl.innerHTML = `
        <strong>경제적 이해관계 안내 (표시광고법 준수):</strong>
        본 페이지에 포함된 일부 제휴 링크를 통해 구매가 이루어질 경우,
        서비스 운영자는 제휴 활동의 일환으로 일정액의 수수료를 제공받을 수 있습니다 (이용자 추가 부담 없음).
      `;
    }

    // 4) 하단 공통 푸터 주입
    const footerEl = document.getElementById('site-footer');
    if (footerEl) {
      footerEl.className = 'site-footer';
      footerEl.innerHTML = `
        <div class="container footer-inner">
          <div>
            <strong style="color: var(--text-primary);">SimuLab Analytics Hub</strong>
            <p style="margin-top: 0.2rem;">100% Client-Side Quantitative Financial, Business &amp; Biometric Simulation Platform</p>
          </div>
          <ul class="footer-links">
            <li><a href="${prefix}legal/about.html">서비스 소개</a></li>
            <li><a href="${prefix}legal/privacy.html"><strong>개인정보처리방침</strong></a></li>
            <li><a href="${prefix}legal/terms.html">이용약관 및 면책고지</a></li>
            <li><a href="${prefix}sitemap.xml">Sitemap</a></li>
          </ul>
        </div>
      `;
    }

    initCookieConsentBanner(prefix);
    initAllSlidersProgress();
    initConsentGate(activeToolId);
  }

  /**
   * [v2 법적 방어 게이트] 금융·대출·부동산 11개 도구 전용 '매번 물어보는 필수 면책 서약 게이트'
   * - 사용자 요청: 브라우저 저장(localStorage) 없이 매 접속/새로고침 시마다 무조건 미동의 잠금 상태로 시작
   * - 체크박스를 직접 체크해야만 아래 시뮬레이터 조작 영역(입력창, 슬라이더, 칩)이 활성화됨
   */
  const CONSENT_REQUIRED_TOOLS = [
    'leverage-etf-sim',
    'dividend-tax-sim',
    'capital-gains-tax-sim',
    'loan-mortgage-calc',
    'jeonse-wolse-sim',
    'stock-profit-calc',
    'stock-water-ride-calc',
    'stock-target-compound-calc',
    'dividend-goal-calc',
    'lotto-tax-interest-calc',
    'retirement-survival-sim',
  ];

  function initConsentGate(activeToolId) {
    if (!CONSENT_REQUIRED_TOOLS.includes(activeToolId)) return;

    const mainEl = document.querySelector('main.container') || document.querySelector('main');
    if (!mainEl) return;

    // 잠금 대상 컨테이너(시뮬레이터 조작 영역 및 그리드) 탐색
    const lockTargets = [];
    const simGrid = mainEl.querySelector('.simulator-grid');
    if (simGrid) {
      lockTargets.push(simGrid);
    } else {
      const cards = mainEl.querySelectorAll('.card, .kpi-grid, div[style*="grid"]');
      cards.forEach((c) => {
        if (!c.classList.contains('page-header') && !c.id.includes('verdict')) {
          lockTargets.push(c);
        }
      });
    }

    if (lockTargets.length === 0) return;

    // 서약 게이트 카드 생성 및 주입 (이미 생성되어 있지 않은 경우)
    let gateCard = document.getElementById('consent-gate-card');
    if (!gateCard) {
      gateCard = document.createElement('section');
      gateCard.id = 'consent-gate-card';
      gateCard.className = 'consent-gate-card';
      gateCard.setAttribute('aria-label', '필수 법적 면책 고지 및 이용자 서약');
      gateCard.innerHTML = `
        <div class="consent-gate-header">
          <span class="consent-gate-badge" id="consent-status-badge">🔒 미동의 (시뮬레이터 조작 잠금 상태)</span>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">접속 시마다 매번 서약 필수 (세션 비저장 원칙)</span>
        </div>
        <div class="consent-gate-body">
          <strong>⚖️ [필수] 법적 면책 고지 및 이용자 자기책임 서약서</strong><br/>
          본 시뮬레이터는 「자본시장법」상 투자자문이나 「세무사법」상 세무대리, 「금융소비자보호법」상 대출 승인 약정이 아닌 <strong>단순 통계·수학적 알고리즘 모의 계산기</strong>입니다.<br/>
          산출 결과는 2026년 현행 법령에 기초한 추정치이며, 세법 개정이나 금융 규제 변경, 수식 오차로 인해 실제와 다를 수 있습니다. 본 결과를 참고하여 행한 <strong>모든 투자·대출·세무 의사결정의 최종 책임은 전적으로 본인에게 귀속됨</strong>을 확인합니다.
        </div>
        <label class="consent-gate-checkbox-row" for="checkbox-legal-consent">
          <input type="checkbox" id="checkbox-legal-consent" class="consent-checkbox" />
          <span class="consent-checkbox-label">위 법적 면책 사항 및 자기책임 원칙을 충분히 확인하였으며, 이에 동의합니다. (필수)</span>
        </label>
      `;

      // 안내 잠금 배너 생성
      const lockBanner = document.createElement('div');
      lockBanner.id = 'consent-lock-banner';
      lockBanner.className = 'consent-lock-banner';
      lockBanner.innerHTML = `<span>🔒</span><span>상단 서약서의 [동의합니다]를 체크하셔야 입력창과 계산 기능이 활성화됩니다.</span>`;

      // 첫 번째 잠금 대상 바로 앞에 주입
      const firstTarget = lockTargets[0];
      firstTarget.parentNode.insertBefore(gateCard, firstTarget);
      firstTarget.parentNode.insertBefore(lockBanner, firstTarget);
    }

    const checkbox = document.getElementById('checkbox-legal-consent');
    const badge = document.getElementById('consent-status-badge');
    const lockBanner = document.getElementById('consent-lock-banner');

    if (!checkbox) return;

    // [중요] 사용자 명시 요청: 브라우저 저장 없이 항상 미동의(체크 해제) 상태로 시작
    checkbox.checked = false;
    lockTargets.forEach((t) => t.classList.add('simulator-locked'));
    if (lockBanner) lockBanner.style.display = 'flex';

    // 체크박스 클릭 인터랙션 바인딩
    checkbox.addEventListener('change', () => {
      const isAgreed = checkbox.checked;
      if (isAgreed) {
        gateCard.classList.add('unlocked');
        if (badge) badge.textContent = '✔ 동의 완료 (시뮬레이터 활성화됨)';
        lockTargets.forEach((t) => t.classList.remove('simulator-locked'));
        if (lockBanner) lockBanner.style.display = 'none';
        showToast('✔ 법적 면책 사항에 동의하셨습니다. 모든 시뮬레이션 기능이 활성화되었습니다.');
      } else {
        gateCard.classList.remove('unlocked');
        if (badge) badge.textContent = '🔒 미동의 (시뮬레이터 조작 잠금 상태)';
        lockTargets.forEach((t) => t.classList.add('simulator-locked'));
        if (lockBanner) lockBanner.style.display = 'flex';
        showToast('🔒 동의가 해제되어 시뮬레이션 조작이 잠금 처리되었습니다.');
      }
    });
  }

  function initCookieConsentBanner(prefix) {
    const CONSENT_KEY = 'simulab_cookie_consent_v1';
    try {
      if (localStorage.getItem(CONSENT_KEY) === 'accepted') {
        return;
      }
    } catch (err) {
      return;
    }

    const banner = document.createElement('aside');
    banner.className = 'cookie-banner';
    banner.setAttribute('aria-label', '쿠키 및 개인정보처리방침 안내');
    banner.innerHTML = `
      <div style="flex: 1; min-width: 260px; font-size: 0.82rem; color: var(--text-secondary);">
        <strong style="color: var(--text-primary);">쿠키(Cookie) 및 프라이버시 안내:</strong>
        본 사이트는 사용자의 시뮬레이션 입력값을 외부 서버로 수집·저장하지 않습니다.
        다만 방문 통계 분석(GA4) 및 광고 제공(Google AdSense)을 위해 브라우저 쿠키를 사용합니다.
        자세한 내용은 <a href="${prefix}legal/privacy.html" style="text-decoration: underline;">개인정보처리방침</a>을 확인해 주세요.
      </div>
      <div>
        <button type="button" id="cookie-accept-btn" class="btn btn-primary">확인 및 닫기</button>
      </div>
    `;

    document.body.appendChild(banner);
    const acceptBtn = document.getElementById('cookie-accept-btn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        try {
          localStorage.setItem(CONSENT_KEY, 'accepted');
        } catch (err) {}
        banner.remove();
      });
    }
  }

  /* ------------------------------------------------------------------------
     5. URL 쿼리스트링 공유 및 localStorage 상태 관리
     ------------------------------------------------------------------------ */

  function parseUrlParams(defaultInputs) {
    const params = new URLSearchParams(window.location.search);
    const result = { ...defaultInputs };

    for (const key of Object.keys(defaultInputs)) {
      if (params.has(key)) {
        const rawVal = params.get(key);
        if (typeof defaultInputs[key] === 'string') {
          if (rawVal && rawVal.trim().length > 0) {
            result[key] = rawVal.trim();
          }
        } else {
          const numVal = Number(rawVal);
          if (Number.isFinite(numVal)) {
            result[key] = numVal;
          }
        }
      }
    }
    return result;
  }

  async function shareSimulationUrl(currentInputs) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(currentInputs)) {
      params.set(key, String(value));
    }
    const newRelativeUrl = `${window.location.pathname}?${params.toString()}`;
    try {
      window.history.replaceState(null, '', newRelativeUrl);
    } catch (e) {}

    const fullShareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      showToast('현재 시뮬레이션 조건이 담긴 공유 URL이 클립보드에 복사되었습니다.');
    } catch (err) {
      showToast('주소창에 시뮬레이션 공유 URL이 생성되었습니다.');
    }
  }

  function saveToolState(toolId, currentInputs, pinnedScenario = null) {
    const payload = {
      toolId,
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      currentInputs,
      pinnedScenario,
    };

    try {
      localStorage.setItem(`simulab_state_${toolId}`, JSON.stringify(payload));
    } catch (err) {}
  }

  function loadToolState(toolId) {
    try {
      const raw = localStorage.getItem(`simulab_state_${toolId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  /* ------------------------------------------------------------------------
     6. 이미지(PNG) 및 엑셀(CSV) 내보내기, 토스트 알림 유틸리티
     ------------------------------------------------------------------------ */

  function showToast(message) {
    let toast = document.getElementById('simulab-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'simulab-toast';
      toast.className = 'toast-notification';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    if (toast._hideTimer) {
      clearTimeout(toast._hideTimer);
    }
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function exportCanvasToPng(canvasEl, filename = 'simulation-chart.png') {
    if (!canvasEl) return;
    try {
      const dataUrl = canvasEl.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('고해상도 차트 이미지(PNG)가 다운로드되었습니다.');
    } catch (err) {
      showToast('차트 이미지 저장 중 오류가 발생했습니다.');
    }
  }

  function exportDataToCsv(headers, rows, filename = 'simulation-data.csv') {
    const escapeCsvCell = (cell) => {
      const str = String(cell ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ];

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast('상세 데이터 테이블이 CSV(엑셀) 파일로 다운로드되었습니다.');
  }

  // 전역 SimuLab 네임스페이스에 등록
  Object.assign(SimuLab, {
    clampNumber,
    roundSafe,
    formatCurrency,
    formatKoreanAmount,
    formatNumber,
    formatPercent,
    updateSliderProgress,
    initAllSlidersProgress,
    initTheme,
    applyThemeToDocument,
    toggleTheme,
    getRootPrefix,
    initCommonUI,
    SITE_MENU,
    parseUrlParams,
    shareSimulationUrl,
    saveToolState,
    loadToolState,
    showToast,
    showSaveSiteModal,
    exportCanvasToPng,
    exportDataToCsv,
  });

  // 페이지 로드 시 initCommonUI 자동 실행 (개별 도구 app.js에서 미호출 시에도 100% 면책조항/헤더 보장)
  if (typeof document !== 'undefined') {
    const runAutoInit = () => {
      if (!isCommonUiInitialized) {
        initCommonUI(autoDetectToolId());
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runAutoInit);
    } else {
      runAutoInit();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
