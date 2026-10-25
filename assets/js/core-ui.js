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
      id:'family',label:'가족 정보',icon:'◷',hot:true,
      desc:'체험·교육·육아·공연·캠핑의 신청일과 이용일을 공식 조건과 함께 확인합니다.',
      subgroups:[{title:'신청일과 함께 나갈 날',items:[
        {title:'가족 정보 통합 달력',sub:'9개 분야 · 신청일과 이용일을 나누어 확인',href:'tools/family-info-calendar/',tool:'family-info-calendar',hot:true},
        {title:'아이 체험·교육',sub:'접수기간 · 공식 대상 연령 · 이용일',href:'tools/kids-programs/',tool:'kids-programs'},
        {title:'도서관·육아지원센터',sub:'지역·회원 조건 · 프로그램 신청',href:'tools/local-parenting/',tool:'local-parenting'},
        {title:'육아·가족 지원사업',sub:'신청기간 · 거주지·지원 자격 확인',href:'tools/family-support/',tool:'family-support'},
        {title:'공공 캠핑장·휴양림',sub:'예약 개시 · 추첨 · 이용기간',href:'tools/camping-booking/',tool:'camping-booking'},
        {title:'어린이 공연·전시',sub:'관람연령 · 운영일 · 예약 조건',href:'tools/family-culture/',tool:'family-culture'},
        {title:'키즈 팝업·캐릭터 행사',sub:'지점 · 기간 · 현장입장·예약 안내',href:'tools/kids-popups/',tool:'kids-popups'},
        {title:'가족 외식·시설 할인',sub:'외식·관광시설 · 카드·요일·채널 조건',href:'tools/family-discounts/',tool:'family-discounts'}
      ]}]
    },
    {
      id: 'weekday', label: '평일 생활', icon: '☀️', hot: true,
      desc: '육아휴직과 복직, 월급과 퇴직, 생활비 비교에 필요한 공식 정보와 확인 목록을 모았습니다.',
      subgroups: [{title:'일하는 날의 생활 안내',items:[
        {title:'육아휴직·복직',sub:'휴가·단축근무 · 보육·돌봄 공식 안내',href:'tools/working-parents-guide/',tool:'working-parents-guide',hot:true},
        {title:'월급·퇴직',sub:'급여명세서 · 퇴직금·실업급여 확인 목록',href:'tools/pay-work-guide/',tool:'pay-work-guide',hot:true},
        {title:'생활비 절약',sub:'장보기 · 통신·멤버십 · 주거비 비교',href:'tools/living-cost-guide/',tool:'living-cost-guide',hot:true}
      ]}]
    },
    {
      id: 'finance',
      label: '금융·재테크',
      icon: '💰',
      hot: true,
      desc: '급여·퇴직·투자·주거 비용을 가정에 따라 계산하고 비교합니다. 각 도구의 적용 기준과 한계를 확인해 주세요.',
      subgroups: [
        {
          title: '💼 직장인·퇴직',
          items: [
            { title: '국민연금 조기수령 시뮬', sub: '60세 조기 vs 65세 정상 역전 나이(BEP)', href: 'tools/national-pension-sim/', tool: 'national-pension-sim', hot: true },
            { title: '직장인 퇴직금 계산기', sub: '근무 기간 · 평균임금 기준 추정', href: 'tools/severance-pay-calc/', tool: 'severance-pay-calc', hot: true },
            { title: '월급 공제·실수령액 계산기', sub: '2026년 보험료 · 소득세 직접 입력', href: 'tools/salary-net-calc/', tool: 'salary-net-calc', hot: true },
            { title: '실업급여 모의계산기', sub: '가입 기간 · 연령별 지급액 추정', href: 'tools/unemployment-benefit-calc/', tool: 'unemployment-benefit-calc', hot: true },
            { title: '나의 진짜 시급 가치', sub: '내 한 시간의 진짜 시급 값어치', href: 'tools/hourly-labor-value-calc/', tool: 'hourly-labor-value-calc' }
          ]
        },
        {
          title: '📈 주식·배당',
          items: [
            { title: '레버리지 복리·변동성 계산기', sub: '직접 입력한 일별 가정 경로 비교', href: 'tools/leverage-etf-sim/', tool: 'leverage-etf-sim', hot: true },
            { title: '주식 실질 수익률 계산기', sub: '세금·수수료 반영 실질 수익률', href: 'tools/stock-profit-calc/', tool: 'stock-profit-calc' },
            { title: '평단가 · 물타기 계산기', sub: '분할 매수 평균 단가', href: 'tools/stock-water-ride-calc/', tool: 'stock-water-ride-calc' },
            { title: '목표가 · 복리 계산기', sub: '목표 수익률 달성 가격', href: 'tools/stock-target-compound-calc/', tool: 'stock-target-compound-calc' },
            { title: '배당 복리 & 세금', sub: '재투자(DRIP) · 건보료 · 절세계좌', href: 'tools/dividend-tax-sim/', tool: 'dividend-tax-sim', hot: true },
            { title: '월 배당 목표 달성 계산기', sub: '목표 월급까지 필요한 투자금', href: 'tools/dividend-goal-calc/', tool: 'dividend-goal-calc' }
          ]
        },
        {
          title: '🏠 부동산·비즈니스',
          items: [
            { title: '그때 그 아파트 샀다면', sub: '마래푸·은마 과거 매수가 vs 현재 실거래가', href: 'tools/past-apt-timemachine/', tool: 'past-apt-timemachine', hot: true },
            { title: '주택대출 상환·비율 가정 계산기', sub: '고정 금리 상환 · 첫해 납부 비율', href: 'tools/loan-mortgage-calc/', tool: 'loan-mortgage-calc', hot: true },
            { title: '전세 vs 월세', sub: '전환율 · 주거 기회비용', href: 'tools/jeonse-wolse-sim/', tool: 'jeonse-wolse-sim' },
            { title: '양도소득세 · 세후 수익', sub: '12억 비과세 · 장특공제', href: 'tools/capital-gains-tax-sim/', tool: 'capital-gains-tax-sim' },
            { title: '부동산 평수 ㎡ 환산기', sub: '㎡ ↔ 평 · 면적 단위 변환', href: 'tools/area-pyeong-calc/', tool: 'area-pyeong-calc' },
            { title: '설비 도입 ROI · BEP', sub: '회수 기간 · NPV · 손익분기', href: 'tools/logistics-roi-calc/', tool: 'logistics-roi-calc' }
          ]
        }
      ]
    },
    {
      id: 'life',
      label: '라이프·건강',
      icon: '🌿',
      hot: true,
      desc: '나이·할인율 같은 생활 계산과 일반적인 건강 참고 계산, 오락용 테마 도구를 제공합니다. 결과의 가정과 적용 범위를 함께 확인해 주세요.',
      subgroups: [
        {
          title: '🌿 일상·생활',
          items: [
            { title: '아이와 가볼만한 곳 달력', sub: '공식 공지로 확인한 일정 · 비용 · 예약 안내', href: 'tools/kids-outing-calendar/', tool: 'kids-outing-calendar', hot: true },
            { title: '브랜드 세일 달력', sub: '라이프·패션·뷰티·키즈·가구 · 세일과 회원 혜택', href: 'tools/parenting-deals/', tool: 'parenting-deals', hot: true },
            { title: '만나이 띠 계산기', sub: '생일 기준 만나이 · 출생연도 띠 · D-Day', href: 'tools/korean-age-calc/', tool: 'korean-age-calc', hot: true },
            { title: '퍼센트 할인율 계산기', sub: '쇼핑 세일가 · 인상률 · 비중 계산', href: 'tools/percent-discount-calc/', tool: 'percent-discount-calc', hot: true },
            { title: '내 인생의 모래시계', sub: '기대수명 대비 생애 진행률 · 잔여 일수', href: 'tools/life-hourglass-sim/', tool: 'life-hourglass-sim' }
          ]
        },
        {
          title: '🏃 헬스·수면',
          items: [
            { title: 'BMR·TDEE 참고 계산기', sub: '성인 휴식대사량 · 활동계수 가정', href: 'tools/diet-bmr-tdee-calc/', tool: 'diet-bmr-tdee-calc' },
            { title: '카페인 잔여량 가정 계산기', sub: '섭취량 · 반감기 가정별 잔여량', href: 'tools/caffeine-sleep-calc/', tool: 'caffeine-sleep-calc' },
            { title: '러닝 Zone 2 심박수', sub: '심박수 구간 · 칼로리', href: 'tools/running-zone-calc/', tool: 'running-zone-calc' },
            { title: '음주 알코올 분해시간', sub: '위드마크 공식 기준 분해 소요시간', href: 'tools/alcohol-widmark-calc/', tool: 'alcohol-widmark-calc' }
          ]
        },
        {
          title: '🔮 사주·심리',
          items: [
            { title: '사주 오행 테마 놀이', sub: '간이 규칙으로 살펴보는 오락용 테마', href: 'tools/saju-wealth-sim/', tool: 'saju-wealth-sim' },
            { title: '금융 정보 습관 동물 테스트', sub: '8문항 자체 제작 오락 콘텐츠', href: 'tools/invest-animal-mbti/', tool: 'invest-animal-mbti' },
            { title: '연애 동물 애착 심리테스트', sub: '존 보울비 애착이론 · 연인 궁합', href: 'tools/love-animal-attachment/', tool: 'love-animal-attachment' }
          ]
        }
      ]
    },
    {
      id: 'stats',
      label: '별별 통계',
      icon: '📊',
      hot: true,
      desc: '수록된 통계를 비교하고 이름 후보를 탐색합니다. 자료의 집계 시점과 추정 범위는 페이지별 안내를 확인해 주세요.',
      subgroups: [
        {
          title: '📊 재미있는 공공 빅데이터',
          items: [
            { title: '가구 순자산 정리·평균 비교', sub: '2025년 가구 평균과 입력 금액 비교', href: 'tools/korean-wealth-percentile-calc/', tool: 'korean-wealth-percentile-calc', hot: true },
            { title: '대한민국 평균 vs 나', sub: '연봉·근무시간·점심값 5각형 레이더 차트', href: 'tools/korean-average-vs-me/', tool: 'korean-average-vs-me', hot: true },
            { title: '아기이름 후보 찾기', sub: '이름 후보 탐색 · 기기에 찜하기', href: 'tools/korean-baby-name-trend/', tool: 'korean-baby-name-trend', hot: true },
            { title: '전국 도시별 소득 & 집값', sub: '17개 시도별 소득·아파트값·PIR·1인가구', href: 'tools/korean-city-income-housing/', tool: 'korean-city-income-housing', hot: true },
            { title: '주요 19개국 소득 순위변화', sub: '1990~2025 세계은행 GNI·Atlas 1인당 소득', href: 'tools/world-gni-ranking-race/', tool: 'world-gni-ranking-race', hot: true },
            { title: '우리나라 수출입 품목 순위', sub: '2025년 연간·2026년 1~9월 수출입 누계', href: 'tools/korean-trade-ranking/', tool: 'korean-trade-ranking', hot: true },
            { title: '연도별 출입국 관광객 통계', sub: '2025년 연간·2026년 1~8월 관광 누계', href: 'tools/korean-tourism-travel-stats/', tool: 'korean-tourism-travel-stats', hot: true },
            { title: '대한민국 연령별 인구와 초등생수', sub: '2026년 9월 인구·2026년 초등학생 통계', href: 'tools/korean-population-pyramid/', tool: 'korean-population-pyramid', hot: true },
            { title: '주요 29개국 인구 면적 순위', sub: '2026년 인구 전망·2024년 표면적 비교', href: 'tools/world-population-area-rank/', tool: 'world-population-area-rank', hot: true }
          ]
        }
      ]
    },
    {
      id: 'game',
      label: '오락·미니게임',
      icon: '🎮',
      hot: true,
      desc: '잠시 쉬어가는 힐링 타임! 클래식 레트로 테트리스, 산성비 타자, 벽돌깨기, 닷지 1.9 탄막 회피 등 실시간 랭킹 게임과 인터랙티브 사다리, 로또 1등 무한 시뮬레이터입니다.',
      subgroups: [
        {
          title: '🕹️ 실시간 랭킹 아케이드',
          items: [
            { title: '블록 퍼즐 공개 점검 안내', sub: '공개 실행 보류 · 권리 확인 중', href: 'tools/game-tetris/', tool: 'game-tetris', hot: true },
            { title: '스피드 타자 산성비', sub: '금융 단어 격추 · 타자 전국 실시간 랭킹', href: 'tools/game-typing/', tool: 'game-typing', hot: true },
            { title: '네온 벽돌 깨기', sub: '공 분열 & 레이저 알카노이드 · 전국 랭킹', href: 'tools/game-brick-breaker/', tool: 'game-brick-breaker', hot: true },
            { title: '미사일 피하기 닷지', sub: '고전 1.9 탄막 회피 서바이벌 · 전국 랭킹', href: 'tools/game-dodge/', tool: 'game-dodge', hot: true }
          ]
        },
        {
          title: '🎲 모임 복불복 & 복권',
          items: [
            { title: '인터랙티브 사다리타기', sub: '2~12명 · 캔버스 애니메이션 · 복불복', href: 'tools/ladder-draw-game/', tool: 'ladder-draw-game' },
            { title: '더치페이·정산 계산기', sub: '1/N 절사 · 지각자 벌금 · 카톡 문구 복사', href: 'tools/dutch-pay-roulette/', tool: 'dutch-pay-roulette' },
            { title: '로또 1등 당첨 시뮬레이터', sub: '실제 확률 체감 · 1초 100회 무한 추첨', href: 'tools/lotto-draw-sim/', tool: 'lotto-draw-sim', hot: true },
            { title: '로또 세후 수령액 & 이자', sub: '원천징수 가정 · 예금·배당 이자', href: 'tools/lotto-tax-interest-calc/', tool: 'lotto-tax-interest-calc' }
          ]
        }
      ]
    },
    {
      id: 'insight',
      label: '인사이트',
      icon: '💡',
      desc: '일상의 사소한 소비와 매매 결정이 가져오는 나비효과를 숫자로 시각화합니다. 담배값·커피값 S&P500 복리 투자부터 은퇴 자금 조기소진, 화폐가치 인플레이션 분석까지 확인해보세요.',
      subgroups: [
        {
          title: '💡 미래 나비효과 시뮬레이션',
          items: [
            { title: '담배값 주식 투자 시뮬', sub: '하루 1갑 금연 후 S&P500 복리 + 건강 영수증', href: 'tools/smoking-wealth-sim/', tool: 'smoking-wealth-sim', hot: true },
            { title: '소비 vs 투자 기회비용', sub: '신차·명품 대신 S&P500 복리 투자', href: 'tools/opportunity-cost-calc/', tool: 'opportunity-cost-calc', hot: true },
            { title: '커피값 투자 기회비용', sub: '그 돈을 TQQQ에 넣었다면?', href: 'tools/coffee-opportunity-calc/', tool: 'coffee-opportunity-calc' },
            { title: '과거 그때 샀더라면', sub: '팔고 나서 얼마나 올랐을까 (매도 후 상승분)', href: 'tools/missed-investment-calc/', tool: 'missed-investment-calc' },
            { title: '은퇴자금 조기소진 계산기', sub: '현재 자산으로 몇 년을 버틸 수 있을까?', href: 'tools/retirement-survival-sim/', tool: 'retirement-survival-sim' },
            { title: '물가지수·구매력 계산기', sub: '직접 입력한 지수로 금액 환산', href: 'tools/inflation-purchasing-power-calc/', tool: 'inflation-purchasing-power-calc' }
          ]
        }
      ]
    }
  ];

  // 기존 코드 호환성을 위해 각 cat.items 를 subgroups 에서 자동 평탄화하여 채워 넣음
  SITE_MENU.forEach(cat => {
    if (!cat.items && cat.subgroups) {
      cat.items = cat.subgroups.flatMap(sg => sg.items);
    }
  });

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  /* [v2.6] 하위 카테고리(Sub-groups) 분할형 모던 메가 드롭다운 상단 헤더 생성 */
  function buildHeaderHtml(prefix, activeToolId) {
    const groups = SITE_MENU.map((cat) => {
      const allItems = cat.items || (cat.subgroups ? cat.subgroups.flatMap(sg => sg.items) : []);
      const isActive = allItems.some((it) => it.tool && it.tool === activeToolId);

      let panelInnerHtml = '';
      const isMega = cat.subgroups && cat.subgroups.length > 1;

      if (cat.subgroups && cat.subgroups.length > 0) {
        const cols = cat.subgroups.map(sg => {
          const links = sg.items.map(it => {
            return it.soon
              ? `<span class="gnb-link is-soon" aria-disabled="true"><span>${escapeHtml(it.title)}</span><em>준비 중</em></span>`
              : `<a class="gnb-link" href="${prefix}${it.href}"><span class="gnb-link-title">${escapeHtml(it.title)}</span><small>${escapeHtml(it.sub)}</small></a>`;
          }).join('');

          return `
            <div class="gnb-subgroup-col">
              <div class="gnb-subgroup-title">${escapeHtml(sg.title)}</div>
              <div class="gnb-subgroup-links">${links}</div>
            </div>`;
        }).join('');

        panelInnerHtml = `<div class="gnb-subgroups-row">${cols}</div>`;
      } else {
        panelInnerHtml = allItems.map((it) => {
          return it.soon
            ? `<span class="gnb-link is-soon" aria-disabled="true"><span>${escapeHtml(it.title)}</span><em>준비 중</em></span>`
            : `<a class="gnb-link" href="${prefix}${it.href}"><span class="gnb-link-title">${escapeHtml(it.title)}</span><small>${escapeHtml(it.sub)}</small></a>`;
        }).join('');
      }

      return `
        <li class="gnb-item${isActive ? ' is-active' : ''}">
          <button type="button" class="gnb-btn" aria-haspopup="true" aria-expanded="false">
            <span>${escapeHtml(cat.label)}</span>
            <svg class="gnb-chevron" viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
              <path d="M3.2 5.5a.75.75 0 0 1 1.06 0L8 9.24l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L3.2 6.56a.75.75 0 0 1 0-1.06z"/>
            </svg>
          </button>
          <div class="gnb-panel${isMega ? ' gnb-panel-mega' : ''}">${panelInnerHtml}</div>
        </li>`;
    }).join('');

    return `
      <div class="container header-inner">
        <a href="${prefix}" class="brand-logo" aria-label="SimuLab 홈">
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
    'working-parents-guide': '육아휴직·복직',
    'pay-work-guide': '월급·퇴직',
    'living-cost-guide': '생활비 절약',
    'parenting-deals': '브랜드 세일 달력',
    'leverage-etf-sim': '레버리지 복리·변동성 계산기',
    'dividend-tax-sim': '배당 복리 & 세금 계산기',
    'loan-mortgage-calc': '주택대출 상환·비율 가정 계산기',
    'jeonse-wolse-sim': '전세 vs 월세 손익 비교',
    'capital-gains-tax-sim': '부동산 양도세 계산기',
    'logistics-roi-calc': '물류 자동화 ROI 분석',
    'running-zone-calc': '러닝 Zone 2 심박수',
    'diet-bmr-tdee-calc': 'BMR·TDEE 참고 계산기',
    'caffeine-sleep-calc': '카페인 잔여량 가정 계산기',
    'stock-profit-calc': '주식 실질 수익률 계산기',
    'stock-water-ride-calc': '주식 평단가 물타기',
    'stock-target-compound-calc': '목표가 & 복리 수익',
    'dividend-goal-calc': '월 배당 목표금액 계산기',
    'coffee-opportunity-calc': '커피값 투자 기회비용',
    'missed-investment-calc': '과거 그때 샀더라면',
    'retirement-survival-sim': '은퇴자금 조기소진 계산기',
    'hourly-labor-value-calc': '나의 진짜 시급 가치',
    'inflation-purchasing-power-calc': '물가지수·구매력 계산기',
    'saju-wealth-sim': '사주 오행 테마 놀이',
    'invest-animal-mbti': '금융 정보 습관 동물 테스트',
    'lotto-draw-sim': '로또 1등 당첨 시뮬레이터',
    'lotto-tax-interest-calc': '로또 세후 수령액 & 이자',
    'life-hourglass-sim': '내 인생의 모래시계',
    'alcohol-widmark-calc': '음주 알코올 분해시간',
    'love-animal-attachment': '연애 동물 애착 심리테스트',
    'ladder-draw-game': '인터랙티브 사다리타기',
    'dutch-pay-roulette': '센스있는 더치페이 계산기',
    'severance-pay-calc': '직장인 퇴직금 계산기',
    'salary-net-calc': '월급 공제·실수령액 계산기',
    'opportunity-cost-calc': '소비 vs 투자 기회비용',
    'korean-age-calc': '만나이 띠 계산기',
    'percent-discount-calc': '퍼센트 할인율 계산기',
    'area-pyeong-calc': '부동산 평수 ㎡ 환산기',
    'national-pension-sim': '국민연금 조기수령 시뮬',
    'unemployment-benefit-calc': '실업급여 모의계산기',
    'past-apt-timemachine': '그때 그 아파트 샀다면',
    'smoking-wealth-sim': '담배값 주식 투자 시뮬',
    'korean-wealth-percentile-calc': '가구 순자산 정리·평균 비교',
    'korean-average-vs-me': '대한민국 평균 vs 나',
    'korean-baby-name-trend': '아기이름 후보 찾기',
    'korean-city-income-housing': '전국 도시별 소득 & 집값',
    'game-tetris': '블록 퍼즐 공개 점검 안내',
    'game-typing': '스피드 타자 산성비',
    'game-brick-breaker': '네온 벽돌 깨기',
    'game-dodge': '미사일 피하기 닷지',
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
          `<a href="${prefix}">홈</a><span aria-hidden="true">/</span>` +
          `<a href="${prefix}#cat-${cat.id}">${escapeHtml(cat.label)}</a><span aria-hidden="true">/</span>` +
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
  // Shared by the static build and the runtime fallback.
  function getToolNotice(id) {
    if (['home','admin-dashboard','legal'].includes(id)) return null;
    let kind = 'general', title = '계산·정보 이용 안내';
    let message = '입력 조건과 표시된 가정에 따른 참고 결과입니다. 단위·반올림·적용 기준을 확인하고, 계약이나 신청 전에는 공식 자료와 대조해 주세요.';
    if (['family-info-calendar','kids-programs','local-parenting','family-support','camping-booking','family-culture','kids-popups','family-discounts'].includes(id)) {
      kind='family';title='신청일과 이용 조건을 함께 확인하세요';
      message='공식 공지를 확인한 정보만 안내합니다. 신청기간·이용기간·대상·비용은 서로 다를 수 있으며, 확인일 이후 변경될 수 있습니다. 예약 잔여석·지원 자격·최종 할인 적용은 공식 상세 공지에서 다시 확인하세요.';
    } else if (['working-parents-guide','pay-work-guide','living-cost-guide'].includes(id)) {
      kind = 'guide'; title = '신청·구매 전 공식 조건을 확인하세요';
      message = '공식 안내를 확인해 정리한 목록입니다. 제도 신청 자격·지급액·가격을 실시간으로 확인하지 않습니다. 출처 확인일과 본인 조건을 살펴보고 담당 기관이나 서비스에서 최신 안내를 확인해 주세요.';
    } else if (id === 'kids-outing-calendar') {
      kind = 'events'; title = '방문 전 공식 안내를 확인하세요';
      message = '공식 출처와 확인일을 제공하지만 일정·요금·운영 회차는 변경될 수 있습니다. 예약 잔여석은 실시간 조회하지 않으며, 어린이 참여 조건은 주최 기관의 최신 안내를 확인해 주세요.';
    } else if (id === 'parenting-deals') {
      kind = 'shopping'; title = '행사 기간과 적용 조건을 함께 확인하세요';
      message = '공식 공지를 확인한 시점의 일정입니다. 일부 품목·회원·매장·결제수단 조건과 조기 종료 여부를 확인하세요. 실시간 재고·최종 가격을 보장하지 않으며, 적립금과 사은품은 즉시 할인과 구분합니다.';
    } else if (id === 'alcohol-widmark-calc') {
      kind = 'safety'; title = '운전 가능 여부를 판단하는 도구가 아닙니다';
      message = '이론에 따른 추정치로 실제 혈중알코올농도나 안전한 운전 시각을 알 수 없습니다. 계산 결과와 관계없이 음주 후에는 운전하지 마세요.';
    } else if (['diet-bmr-tdee-calc','caffeine-sleep-calc','running-zone-calc','life-hourglass-sim'].includes(id)) {
      kind = 'health'; title = '건강 정보 이용 전 확인';
      message = '일반적인 통계·공식에 따른 참고치이며 개인의 상태와 다를 수 있습니다. 진단·치료·수명 예측이나 개인별 운동·식이 처방을 대신하지 않습니다.';
    } else if (['saju-wealth-sim','invest-animal-mbti','love-animal-attachment','lotto-draw-sim'].includes(id)) {
      kind = 'entertainment'; title = '오락용 콘텐츠 안내';
      message = '재미와 참고를 위한 콘텐츠입니다. 과학적 진단, 확정적인 미래·재물운 예측, 투자 조언이나 당첨 확률 향상을 제공하지 않습니다.';
    } else if (id === 'korean-baby-name-trend') {
      kind = 'names'; title = '이름 후보 탐색 안내';
      message = '이름 후보를 찾아 기기에 보관하는 도구입니다. 실제 출생신고 이름 순위·인원수나 이름에 따른 성격·운명을 제공하지 않습니다.';
    } else if (['korean-average-vs-me','korean-city-income-housing','korean-population-pyramid','korean-tourism-travel-stats','korean-trade-ranking','korean-wealth-percentile-calc','world-gni-ranking-race','world-population-area-rank'].includes(id)) {
      kind = 'statistics'; title = '통계 해석 전 확인';
      message = '통계의 집계 연도·표본·단위·원자료와 추정 범위를 확인해 주세요. 수록 시점의 자료로 현재의 실시간 값이나 개인의 정확한 순위를 보장하지 않습니다.';
    } else if (/tax|pension|salary|severance|unemployment|loan|mortgage/.test(id)) {
      kind = 'financial'; title = '금액·적용 기준 확인';
      message = '입력 가정과 페이지에 표시된 기준으로 계산한 추정치입니다. 실제 세액·지급액·대출 한도·승인은 개인 조건과 적용 시점에 따라 다릅니다. 신고·신청·계약 전 담당 기관에서 확인해 주세요.';
    } else if (/stock|etf|invest|dividend|retirement|wealth|opportunity|jeonse|apt|roi/.test(id)) {
      kind = 'investment'; title = '투자·계약 판단 전 확인';
      message = '가정에 따른 비교 결과이며 투자 권유나 개별 금융·부동산 자문이 아닙니다. 수익·가격을 보장하지 않으며 원금 손실이 발생할 수 있습니다. 과거 성과는 미래 결과를 보장하지 않습니다.';
    } else if (/^game-|draw-game|roulette/.test(id)) {
      kind = 'games'; title = '게임·추첨 이용 안내';
      message = '오락과 참고를 위한 도구입니다. 게임 기록은 공인 인증 기록이 아니며, 추첨 결과에 상품·상금·공정성 인증을 약속하지 않습니다. 중요한 배분은 참여자와 기준을 먼저 합의해 주세요.';
    }
    return {kind,title,message};
  }

  function buildToolNoticeHtml(id) {
    const notice = getToolNotice(id); if (!notice) return '';
    return '<aside id="tool-use-notice" class="tool-use-notice" data-notice-kind="' + notice.kind + '" aria-labelledby="tool-use-notice-title"><strong id="tool-use-notice-title">' + escapeHtml(notice.title) + '</strong><p>' + escapeHtml(notice.message) + '</p><a href="#legal-disclaimer">이용 범위와 면책고지 보기 ↓</a></aside>';
  }

  function buildSmartDisclaimerHtml(id, prefix = getRootPrefix()) {
    const notice = getToolNotice(id); if (!notice) return '';
    return '<strong>이용 범위와 면책고지</strong><p>' + escapeHtml(notice.message) + '</p><p class="disclaimer-responsibility">운영자의 고의·중과실 등 관계 법령상 제한할 수 없는 책임은 이 안내로 배제하지 않습니다.</p><div class="disclaimer-links"><a href="' + prefix + 'legal/terms.html">이용약관·면책고지</a><a href="' + prefix + 'legal/editorial.html">출처·정정 기준</a></div>';
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

    // Ordered dependencies prevent settings/tracker races.
    loadCommonScript(prefix + 'assets/js/site-settings.js?v=20261023_overhaul1', 'simulab-settings-script')
      .then(() => loadCommonScript(prefix + 'assets/js/supabase-config.js?v=20261023_overhaul1', 'simulab-supabase-config-script'))
      .then(() => loadCommonScript(prefix + 'assets/js/privacy.js?v=20261023_overhaul1', 'simulab-privacy-script'))
      .then(() => loadCommonScript(prefix + 'assets/js/tracker.js?v=20261023_overhaul1', 'simulab-tracker-script'))
      .catch(() => {});

    // 1) 상단 헤더 주입 (v2: 카테고리 메가메뉴 + 모바일 햄버거)
    const headerEl = document.getElementById('site-header');
    if (headerEl) {
      headerEl.className = 'site-header';
      headerEl.innerHTML = buildHeaderHtml(prefix, activeToolId);
      bindHeaderMenu(headerEl);
    }
    enhancePageHeader(prefix, activeToolId);
    if (SITE_MENU.some(group => group.items.some(item => item.tool === activeToolId))) {
      try { let recent = JSON.parse(localStorage.getItem('simulab_recent_tools') || '[]'); if (!Array.isArray(recent)) recent = []; localStorage.setItem('simulab_recent_tools', JSON.stringify([activeToolId, ...recent.filter(id => id !== activeToolId)].slice(0, 6))); } catch {}
    }

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
      if (!disclaimerEl.getAttribute('data-notice-version')) disclaimerEl.innerHTML = buildSmartDisclaimerHtml(activeToolId);
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
            <strong style="color: var(--text-primary);">SimuLab</strong>
            <p style="margin-top: 0.2rem;">생활에 필요한 계산·통계·나들이 정보를 한곳에.</p>
          </div>
          <ul class="footer-links">
            <li><a href="${prefix}legal/about.html">서비스 소개</a></li>
            <li><a href="${prefix}legal/privacy.html"><strong>개인정보처리방침</strong></a></li>
            <li><a href="${prefix}legal/terms.html">이용약관 및 면책고지</a></li>
            <li><a href="${prefix}legal/editorial.html">출처·정정 기준</a></li>
            <li><button type="button" class="footer-privacy" data-privacy-settings>개인정보 설정</button></li>
          </ul>
        </div>
      `;
    }

    initAllSlidersProgress();
  }

  // Load optional settings and privacy controls before analytics.
  function loadCommonScript(src,id) {
    if(document.getElementById(id)) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script'); script.id=id; script.src=src;
      script.onload=resolve; script.onerror=reject; document.head.append(script);
    });
  }

  /* Privacy choices are managed by privacy.js; calculator inputs stay available. */

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

  function buildToolShareUrl(href) {
    const url = new URL(href);
    url.search = '';
    url.hash = '';
    return url.href;
  }

  async function shareSimulationUrl() {
    const fullShareUrl = buildToolShareUrl(window.location.href);
    // Never serialize raw personal or financial inputs into shared addresses.
    try { window.history.replaceState(null, '', fullShareUrl); } catch (err) {}
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      try { window.SimuLabTracker?.trackEvent('copy_share_url'); } catch (err) {}
      showToast('입력값을 제외한 도구 링크를 복사했습니다.');
    } catch (err) {
      showToast('복사하지 못했습니다. 입력값이 제거된 주소창의 도구 링크를 복사해 주세요.');
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
    getToolNotice,
    buildToolNoticeHtml,
    buildSmartDisclaimerHtml,
    initCommonUI,
    SITE_MENU,
    parseUrlParams,
    shareSimulationUrl,
    buildToolShareUrl,
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
