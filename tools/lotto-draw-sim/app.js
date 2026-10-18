/**
 * ==========================================================================
 * SimuLab Analytics Hub - 로또 1등 당첨 무한 시뮬레이터 UI 컨트롤러
 * 파일 경로: tools/lotto-draw-sim/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 및 기회비용 연산 설명]
 * 1) 1회(5게임), 100게임, 1,000게임 및 1등 당첨까지 고속 자동 추첨 루프 제공.
 * 2) 실시간 구매금액, 당첨금액, 순손실액(-원) 및 수익률(%)을 화면 어디서든
 *    한눈에 볼 수 있도록 상단 KPI 카드 및 3번 통계표 상단 지표 바에 동시 바인딩.
 * 3) 25가지 현실 기회비용 데이터베이스(먹거리, 테크, 여행, 자동차·부동산, 노동)를
 *    구축하여, 탕진한 손실액으로 무엇을 살 수 있었는지 5개씩 생생하게 환산합니다.
 * 4) [다르게 자각해보기] 버튼을 누르면 5가지 컨셉이 실시간으로 순환 전환됩니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const LottoCalc = SimuLab.LottoDraw || {};

  let simulationState = null;
  let winningSet = null;
  let autoDrawTimer = null;
  let isAutoRunning = false;
  let currentThemeIndex = 0; // 현재 활성화된 현실 자각 컨셉 테마 인덱스

  /**
   * 25종 현실 기회비용 데이터베이스 (5개 컨셉 테마)
   */
  const REALITY_THEMES = [
    {
      id: 'food',
      name: '🍕 배부른 먹거리 컨셉',
      badgeBg: '#fee2e2',
      badgeColor: '#b91c1c',
      items: [
        { name: '황금올리브 치킨', icon: '🍗', price: 20000, unit: '마리', comment: '1일 1닭을 몇 년 동안 실컷 뜯었을 돈!' },
        { name: '스타벅스 아메리카노', icon: '☕', price: 4500, unit: '잔', comment: '평생 모닝커피 걱정 없이 마실 수 있었던...' },
        { name: '도미노 프리미엄 피자', icon: '🍕', price: 35000, unit: '판', comment: '온 동네 사람들에게 피자 파티 열었을 돈!' },
        { name: '고급 오마카세 디너', icon: '🍣', price: 150000, unit: '회', comment: '기념일마다 최고급 초밥을 맛봤을 텐데...' },
        { name: '한우 투뿔 등심', icon: '🥩', price: 60000, unit: '인분', comment: '살살 녹는 소고기로 배 터지게 외식할 돈!' }
      ]
    },
    {
      id: 'tech',
      name: '💻 최신 전자기기·얼리어답터 컨셉',
      badgeBg: '#e0e7ff',
      badgeColor: '#3730a3',
      items: [
        { name: '아이폰 16 Pro', icon: '📱', price: 1600000, unit: '대', comment: '온 가족 스마트폰을 최신형으로 싹 바꿀 돈!' },
        { name: '에어팟 프로 2', icon: '🎧', price: 350000, unit: '개', comment: '노이즈 캔슬링으로 현실의 쓴맛을 지울 수 있었을...' },
        { name: '맥북 프로 16인치 M3', icon: '💻', price: 3500000, unit: '대', comment: '개발자·크리에이터용 최고 사양 노트북!' },
        { name: '플레이스테이션 5 프로', icon: '🎮', price: 1100000, unit: '대', comment: '밤새워 콘솔 게임만 즐겨도 행복했을 돈...' },
        { name: '85인치 대형 스마트 TV', icon: '📺', price: 2500000, unit: '대', comment: '거실 벽면을 통째로 영화관으로 채웠을 돈!' }
      ]
    },
    {
      id: 'travel',
      name: '✈️ 럭셔리 여행 & 호캉스 컨셉',
      badgeBg: '#ecfdf5',
      badgeColor: '#065f46',
      items: [
        { name: '하와이 왕복 비행기표', icon: '✈️', price: 1800000, unit: '장', comment: '와이키키 해변에서 칵테일 마시고 있었을 텐데...' },
        { name: '5성급 호텔 호캉스 1박', icon: '🏨', price: 450000, unit: '박', comment: '포근한 호텔 침대와 조식 뷔페를 즐길 날들!' },
        { name: '에버랜드 자유이용권', icon: '🎢', price: 65000, unit: '장', comment: '동심으로 돌아가 롤러코스터 실컷 탈 돈!' },
        { name: '호텔 럭셔리 전신 스파', icon: '💆', price: 220000, unit: '회', comment: '피로를 싹 풀고 힐링할 수 있었던 시간!' },
        { name: '감성 캠핑 풀세트 장비', icon: '⛺', price: 3000000, unit: '세트', comment: '자연 속에서 불멍하며 여유를 만끽할 장비!' }
      ]
    },
    {
      id: 'flex',
      name: '🚗 플렉스 자동차 & 부동산 컨셉',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      items: [
        { name: '현대 아반떼 신차', icon: '🚗', price: 25000000, unit: '대', comment: '출퇴근길을 든든하게 지켜줄 신차 한 대!' },
        { name: '제네시스 G80 풀옵션', icon: '🚘', price: 75000000, unit: '대', comment: '도로 위에서 시선을 한 몸에 받을 럭셔리 세단!' },
        { name: '배달용 고성능 스쿠터', icon: '🛵', price: 3500000, unit: '대', comment: '골목길을 가르는 기동력 최고의 라이딩!' },
        { name: '서울 아파트 분양 면적', icon: '🏢', price: 40000000, unit: '평', comment: '내 집 마련을 위한 소중한 벽돌 몇 장...' },
        { name: '휘발유 주유 (1,650원/L)', icon: '⛽', price: 1650, unit: '리터', comment: '지구를 몇 바퀴나 완주할 수 있는 기름!' }
      ]
    },
    {
      id: 'life',
      name: '💼 피땀눈물 노동 & 일상 현실 컨셉',
      badgeBg: '#f3e8ff',
      badgeColor: '#6b21a8',
      items: [
        { name: '최저시급 노동시간', icon: '⏰', price: 9860, unit: '시간', comment: '땀 흘려 번 피 같은 내 소중한 노동의 대가!' },
        { name: '직장인 평균 월급치', icon: '💼', price: 3500000, unit: '개월', comment: '아침 일찍 지옥철 타고 출근한 땀방울...' },
        { name: '헬스장 1년 VIP 회원권', icon: '🏋️', price: 800000, unit: '년', comment: '3대 500 찍을 때까지 쇠질할 수 있었던 시간!' },
        { name: '베스트셀러 도서', icon: '📚', price: 18000, unit: '권', comment: '집에 미니 도서관을 차릴 만큼의 지식과 교양!' },
        { name: '영화관 팝콘 콤보 세트', icon: '🍿', price: 15000, unit: '세트', comment: '주말마다 영화 보며 스트레스 풀었을 돈!' }
      ]
    }
  ];

  function getEl(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    const el = getEl(id);
    if (el) el.textContent = text;
  }

  function formatMoney(amount) {
    return SimuLab.formatCurrency ? SimuLab.formatCurrency(amount) : `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  function formatMoneyCompact(amount) {
    return SimuLab.formatCurrency ? SimuLab.formatCurrency(amount, true) : `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  /**
   * 로또 공 색상 반환 유틸리티 (실제 복권 번호별 고유 색상)
   */
  function getBallColor(num) {
    if (num <= 10) return { bg: '#f59e0b', color: '#fff' }; // 1~10: 노랑
    if (num <= 20) return { bg: '#2563eb', color: '#fff' }; // 11~20: 파랑
    if (num <= 30) return { bg: '#ef4444', color: '#fff' }; // 21~30: 빨강
    if (num <= 40) return { bg: '#64748b', color: '#fff' }; // 31~40: 회색
    return { bg: '#10b981', color: '#fff' };               // 41~45: 초록
  }

  /**
   * 1. 당첨 번호 볼 렌더링
   */
  function renderWinningBalls(win) {
    const container = getEl('winning-balls-container');
    if (!container || !win) return;

    const mainBalls = win.mainNumbers
      .map((num) => {
        const c = getBallColor(num);
        return `<span style="display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; background: ${c.bg}; color: ${c.color}; font-weight: 700; font-size: 0.95rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${num}</span>`;
      })
      .join('');

    const bonusColor = getBallColor(win.bonus);
    const bonusBall = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; background: ${bonusColor.bg}; color: ${bonusColor.color}; font-weight: 700; font-size: 0.95rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${win.bonus}</span>`;

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
        ${mainBalls}
        <span style="font-size: 1.2rem; font-weight: 700; color: var(--text-muted); margin: 0 0.3rem;">+</span>
        ${bonusBall}
      </div>
    `;
  }

  /**
   * 2. 등수별 상세 테이블 및 하단 합계(Total) 렌더링
   */
  function renderStatsTable(state) {
    const tbody = getEl('lotto-stats-table-body');
    const tfoot = getEl('lotto-stats-table-foot');
    if (!tbody || !state) return;

    const ranks = [
      { name: '1등 (6개 일치)', prize: LottoCalc.AVERAGE_PRIZES.rank1, count: state.rankCounts.rank1, prob: '1 / 8,145,060' },
      { name: '2등 (5개 + 보너스)', prize: LottoCalc.AVERAGE_PRIZES.rank2, count: state.rankCounts.rank2, prob: '1 / 1,357,510' },
      { name: '3등 (5개 일치)', prize: LottoCalc.AVERAGE_PRIZES.rank3, count: state.rankCounts.rank3, prob: '1 / 35,724' },
      { name: '4등 (4개 일치)', prize: LottoCalc.AVERAGE_PRIZES.rank4, count: state.rankCounts.rank4, prob: '1 / 733' },
      { name: '5등 (3개 일치)', prize: LottoCalc.AVERAGE_PRIZES.rank5, count: state.rankCounts.rank5, prob: '1 / 45' },
      { name: '낙첨 (2개 이하)', prize: 0, count: state.rankCounts.lose, prob: '약 97.6%' },
    ];

    tbody.innerHTML = ranks
      .map(
        (r) => `
        <tr style="${r.count > 0 && r.prize > 10000000 ? 'background: rgba(37, 99, 235, 0.08); font-weight: 600;' : ''}">
          <td style="padding: 0.6rem; font-weight: 600;">${r.name}</td>
          <td style="padding: 0.6rem; text-align: right; color: var(--text-secondary);">${r.prob}</td>
          <td style="padding: 0.6rem; text-align: right;">${r.prize > 0 ? formatMoneyCompact(r.prize) : '-'}</td>
          <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: ${r.count > 0 ? 'var(--primary-color)' : 'var(--text-muted)'};">
            ${r.count.toLocaleString()}회
          </td>
          <td style="padding: 0.6rem; text-align: right; font-weight: 600;">${formatMoneyCompact(r.prize * r.count)}</td>
        </tr>
      `
      )
      .join('');

    // 하단 tfoot 합계 행 렌더링
    if (tfoot) {
      const totalWins = state.rankCounts.rank1 + state.rankCounts.rank2 + state.rankCounts.rank3 + state.rankCounts.rank4 + state.rankCounts.rank5;
      const winRate = state.totalGames > 0 ? ((totalWins / state.totalGames) * 100).toFixed(2) : '0.00';
      const netProfit = state.totalPrize - state.totalCost;
      const roi = state.totalCost > 0 ? ((netProfit / state.totalCost) * 100).toFixed(1) : '0.0';

      tfoot.innerHTML = `
        <tr style="background: var(--bg-main); border-top: 2px solid var(--border-color);">
          <td style="padding: 0.75rem 0.6rem; font-weight: 700; color: var(--text-primary);">
            📊 총계 (전체 합계)
          </td>
          <td style="padding: 0.75rem 0.6rem; text-align: right; color: var(--text-muted); font-size: 0.8rem;">
            전체 100%
          </td>
          <td style="padding: 0.75rem 0.6rem; text-align: right; font-weight: 700; color: #ef4444;">
            구매: ${formatMoneyCompact(state.totalCost)}
          </td>
          <td style="padding: 0.75rem 0.6rem; text-align: right; font-weight: 700; color: #10b981;">
            총 ${totalWins.toLocaleString()}회 (${winRate}%)
          </td>
          <td style="padding: 0.75rem 0.6rem; text-align: right; font-weight: 700; color: #10b981;">
            당첨: ${formatMoneyCompact(state.totalPrize)}
          </td>
        </tr>
        <tr style="background: ${netProfit >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; font-size: 0.85rem;">
          <td colspan="5" style="padding: 0.6rem 0.8rem; text-align: center;">
            <span style="color: var(--text-secondary); margin-right: 0.5rem;">최종 정산:</span>
            <strong style="color: ${netProfit >= 0 ? '#10b981' : '#dc2626'}; font-size: 0.95rem;">
              ${netProfit >= 0 ? '순수익 +' : '순손실 '}${formatMoneyCompact(Math.abs(netProfit))} (수익률 ${roi}%)
            </strong>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem;">
              (${state.totalGames.toLocaleString()}게임 탕진 결과)
            </span>
          </td>
        </tr>
      `;
    }
  }

  /**
   * 3. 🚨 현실 자각 타임: 날려버린 기회비용 체감 위젯 렌더링
   */
  function renderOpportunityCost(netProfit) {
    const grid = getEl('reality-cards-grid');
    const badge = getEl('reality-theme-badge');
    const subText = getEl('reality-check-sub');
    if (!grid) return;

    const theme = REALITY_THEMES[currentThemeIndex];
    if (badge) {
      badge.textContent = theme.name;
      badge.style.background = theme.badgeBg;
      badge.style.color = theme.badgeColor;
    }

    const netLoss = -netProfit; // 손실액 (손실일 때 양수)

    if (netLoss <= 0 && simulationState && simulationState.totalGames > 0) {
      // 1등 당첨 등으로 수익 상태일 때
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; background: var(--bg-card); border-radius: 10px; border: 1px solid #10b981;">
          <div style="font-size: 2.2rem; margin-bottom: 0.4rem;">🎉</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #10b981; margin: 0 0 0.4rem 0;">기적의 1등 당첨! 인생 역전에 성공했습니다!</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
            현재 순손실이 아닌 <strong>순수익 +${formatMoneyCompact(netProfit)}</strong> 상태입니다! 축하드립니다!
          </p>
        </div>
      `;
      if (subText) subText.textContent = '현재 당첨금으로 대박 순수익을 달성한 상태입니다!';
      return;
    }

    if (!simulationState || simulationState.totalGames === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 1.25rem; text-align: center; background: var(--bg-card); border-radius: 10px; color: var(--text-muted); font-size: 0.85rem;">
          아직 로또를 구매하지 않았습니다. 위 [5게임 구매] 또는 [무한 구매] 버튼을 눌러보세요!
        </div>
      `;
      if (subText) subText.textContent = '구매를 시작하시면 실시간 탕진 금액으로 살 수 있었던 현실 물건들이 계산됩니다.';
      return;
    }

    if (subText) {
      subText.innerHTML = `현재까지 복권방에 기부한 <strong>순손실액 ${formatMoneyCompact(netLoss)}</strong>으로 살 수 있었던 실제 물건들입니다.`;
    }

    grid.innerHTML = theme.items
      .map((item) => {
        const count = Math.floor(netLoss / item.price);
        const countFormatted = count.toLocaleString('ko-KR');

        return `
          <div class="reality-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.9rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 1.8rem; margin-bottom: 0.3rem;">${item.icon}</div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem;">${item.name}</div>
              <div style="font-size: 1.15rem; font-weight: 800; color: #dc2626; margin-bottom: 0.2rem;">
                약 ${count > 0 ? countFormatted : '0'}${item.unit}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                (단가: ${formatMoneyCompact(item.price)})
              </div>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35; word-break: keep-all; background: var(--bg-main); padding: 0.35rem 0.5rem; border-radius: 6px;">
              ${item.comment}
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * 4. UI 통계 및 배너 갱신
   */
  function updateUI() {
    if (!simulationState) return;

    const netProfit = simulationState.totalPrize - simulationState.totalCost;
    const roi = simulationState.totalCost > 0 ? (netProfit / simulationState.totalCost) * 100 : 0;
    const equivYears = Math.round((simulationState.totalGames / 10 / 52) * 10) / 10;

    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      if (simulationState.rankCounts.rank1 > 0) {
        verdictText.innerHTML = `
          <strong>기적 발생! 1등 당첨에 성공했습니다!</strong><br/>
          총 <strong>${simulationState.totalGames.toLocaleString()}게임</strong>(매주 1만원씩 약 <strong>${equivYears}년</strong> 구매 분량) 만에 1등 번호가 맞았습니다!<br/>
          총 구매원금: ${formatMoneyCompact(simulationState.totalCost)} | 총 당첨금: ${formatMoneyCompact(simulationState.totalPrize)} (순수익 ${formatMoneyCompact(netProfit)})
        `;
        if (verdictBanner) verdictBanner.style.borderColor = '#10b981';
      } else {
        verdictText.innerHTML = `
          현재까지 총 <strong>${simulationState.totalGames.toLocaleString()}게임</strong>(매주 1만원씩 <strong>약 ${equivYears}년치</strong> 구매)을 진행했습니다.<br/>
          총 <strong>${formatMoneyCompact(simulationState.totalCost)}</strong>을 복권방에 썼지만 회수액은 <strong>${formatMoneyCompact(simulationState.totalPrize)}</strong>에 불과합니다 (순손실 ${formatMoneyCompact(Math.abs(netProfit))}, 수익률 ${Math.round(roi)}%).
        `;
        if (verdictBanner) verdictBanner.style.borderColor = '#ef4444';
      }
    }

    // [상단 요약 KPI 카드 4종]
    setText('card-total-cost', formatMoneyCompact(simulationState.totalCost));
    setText('card-total-prize', formatMoneyCompact(simulationState.totalPrize));
    setText('card-net-profit', `${netProfit >= 0 ? '+' : ''}${formatMoneyCompact(netProfit)}`);
    setText('card-years-spent', `약 ${equivYears}년치`);

    // [3번 섹션 미니 지표 바]
    setText('stat-total-games', `${simulationState.totalGames.toLocaleString()}게임`);
    setText('stat-total-cost', formatMoneyCompact(simulationState.totalCost));
    setText('stat-total-prize', formatMoneyCompact(simulationState.totalPrize));
    setText('stat-net-loss', `${netProfit >= 0 ? '+' : ''}${formatMoneyCompact(netProfit)} (${Math.round(roi)}%)`);
    setText('stat-rank1-count', `${simulationState.rankCounts.rank1}회`);
    setText('stat-rank23-count', `${simulationState.rankCounts.rank2}회 / ${simulationState.rankCounts.rank3}회`);

    renderWinningBalls(winningSet);
    renderStatsTable(simulationState);
    renderOpportunityCost(netProfit);
  }

  /**
   * 5. 배치 실행 함수
   */
  function executeDraw(batchSize) {
    if (!winningSet) {
      winningSet = LottoCalc.generateWinningSet();
    }
    const result = LottoCalc.runLottoBatch(batchSize, simulationState, winningSet);
    simulationState = result.state;
    updateUI();

    if (simulationState.isFirstRankWon && isAutoRunning) {
      stopAutoDraw();
    }
  }

  function startAutoDraw() {
    if (isAutoRunning) return;
    isAutoRunning = true;
    const btn = getEl('btn-auto-toggle');
    if (btn) {
      btn.textContent = '일시 정지';
      btn.classList.add('btn-danger');
    }

    autoDrawTimer = setInterval(() => {
      // 1초에 약 300게임 고속 추첨 (30ms마다 10게임)
      executeDraw(10);
    }, 30);
  }

  function stopAutoDraw() {
    isAutoRunning = false;
    if (autoDrawTimer) {
      clearInterval(autoDrawTimer);
      autoDrawTimer = null;
    }
    const btn = getEl('btn-auto-toggle');
    if (btn) {
      btn.textContent = '1등 나올 때까지 무한 구매';
      btn.classList.remove('btn-danger');
    }
  }

  function resetSimulation() {
    stopAutoDraw();
    winningSet = LottoCalc.generateWinningSet();
    simulationState = {
      totalGames: 0,
      totalCost: 0,
      totalPrize: 0,
      rankCounts: { rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0, lose: 0 },
      isFirstRankWon: false,
    };
    updateUI();
  }

  /**
   * 6. 이벤트 바인딩
   */
  function bindEvents() {
    getEl('btn-buy-5')?.addEventListener('click', () => executeDraw(5));
    getEl('btn-buy-100')?.addEventListener('click', () => executeDraw(100));
    getEl('btn-buy-1000')?.addEventListener('click', () => executeDraw(1000));

    getEl('btn-auto-toggle')?.addEventListener('click', () => {
      if (isAutoRunning) {
        stopAutoDraw();
      } else {
        startAutoDraw();
      }
    });

    getEl('btn-reset')?.addEventListener('click', resetSimulation);

    getEl('btn-new-winning')?.addEventListener('click', () => {
      winningSet = LottoCalc.generateWinningSet();
      renderWinningBalls(winningSet);
      if (SimuLab.showToast) SimuLab.showToast('새로운 당첨 번호가 추첨되었습니다.');
    });

    // 🎲 다르게 자각해보기 버튼: 5대 컨셉 테마 순환 전환
    getEl('btn-shuffle-reality')?.addEventListener('click', () => {
      currentThemeIndex = (currentThemeIndex + 1) % REALITY_THEMES.length;
      const netProfit = simulationState ? simulationState.totalPrize - simulationState.totalCost : 0;
      renderOpportunityCost(netProfit);
      if (SimuLab.showToast) {
        SimuLab.showToast(`${REALITY_THEMES[currentThemeIndex].name}으로 전환되었습니다!`);
      }
    });
  }

  function init() {
    if (SimuLab.initCommonUI) {
      SimuLab.initCommonUI('lotto-draw-sim');
    }
    resetSimulation();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
