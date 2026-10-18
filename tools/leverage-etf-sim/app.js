/**
 * ==========================================================================
 * [도구 1] 레버리지 ETF 10종 기간별 백테스팅(2015~2026.10.17) & 최신 주가 기술적 차트 분석 컨트롤러
 * 파일 경로: tools/leverage-etf-sim/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 10개 인기 레버리지 ETF(TQQQ, SOXL, UPRO, FNGU, QLD, SSO, NVDL, TSLL, TMF, KODEX 레버리지) 중
 *   원하는 종목을 선택하고, 4대 딥다이브 탭을 전환하며 분석할 수 있습니다.
 *   1) 탭 1 (historical): 시작 연도 ~ 종료 연도(2015~2026.10.17 최신) 및 6대 시장 국면 프리셋 백테스팅
 *   2) 탭 2 (technical) : 최신 조회 기준일(2026.10.17, 최근 12개월: 25.11~26.10.17) 주가 + 50일/200일 이동평균선 + 볼린저밴드 + RSI(14) 차트 분석 및 3대 퀀트 제안
 *   3) 탭 3 (drawdown)  : 고점 대비 낙폭(Underwater MDD) 수중 차트 및 원금 회복 필요 수익률 분석
 *   4) 탭 4 (formula)   : 이토 보조정리(Itô's Lemma) 음의 복리 및 켈리 최적 배수 미래 시뮬레이션
 * ==========================================================================
 */

(function () {
  'use strict';

  const {
    initCommonUI,
    formatCurrency,
    formatPercent,
    updateSliderProgress,
    initAllSlidersProgress,
    parseUrlParams,
    shareSimulationUrl,
    saveToolState,
    loadToolState,
    exportCanvasToPng,
    exportDataToCsv,
    showToast,
    renderLineChart,
    renderQuantCandleChart,
    getThemeChartColors,
    injectSeoSchema,
  } = window.SimuLab;

  const {
    DEFAULT_INPUTS,
    sanitizeLeverageInputs,
    calculateLeverageSimulation,
  } = window.SimuLab.LeverageLogic;

  const MarketData = window.SimuLab.MarketData || {
    DEFAULT_USD_KRW: 1385.0,
    LATEST_MARKET_DATE: '2026-10-17',
    LATEST_MARKET_DATE_DOT: '2026.10.17',
    BACKTEST_REGIME_PRESETS: {},
    LEVERAGE_ETFS: {},
    runHistoricalLeverageBacktest: null,
    analyzeTechnicalChartSignals: null,
    computeFullQuantChartPack: null,
    buildDrawdownRecoveryTable: null,
    fetchLiveUsdKrwRate: async () => ({ rate: 1385.0, dateStr: '2026.10.17', isLive: false }),
  };

  const TOOL_ID = 'leverage-etf-sim';

  let state = {
    currentInputs: {
      ...DEFAULT_INPUTS,
      leverageMultiplier: 3,
      annualReturnRate: 14.5,
      annualVolatility: 23.5,
      expenseRatio: 0.88,
    },
    selectedTicker: 'TQQQ',
    tickerCategory: 'lev_10',
    tickerSearch: '',
    deepTab: 'historical', // 'historical' | 'technical' | 'drawdown' | 'formula'
    startYear: 2015,
    startMonth: 1,
    endYear: 2026,
    endMonth: 10,
    activeRegime: 'full',
    timeframe: '1D', // '1D'(일봉) | '1W'(주봉) | '1M'(월봉) | '1Y'(년봉)
    chartStyle: 'candle', // 'candle'(시가-종가 봉차트) | 'line'(종가 선차트)
    overlays: {
      sma: true, // 클린 뷰 기본값: 200 SMA만 표시하여 차트 시인성 극대화
      ichimoku: false,
      bollinger: false,
      supertrend: false,
      donchian: false,
    },
    subIndicator: 'stochastic', // 'stochastic' | 'squeeze' | 'macd' | 'rsi'
    customTech: null, // 사용자가 탭 2에서 직접 수정한 기준일/주가/이평선/RSI 값
    usdKrwRate: MarketData.DEFAULT_USD_KRW || 1385.0,
    pinnedScenario: null,
    lastResult: null,
  };

  let rafPending = false;

  function updateCompactTickerBar(tickerKey) {
    const etf = MarketData.LEVERAGE_ETFS && MarketData.LEVERAGE_ETFS[tickerKey];
    if (!etf) return;
    const snap = etf.techSnapshot || {};
    const cur = snap.currency || '$';
    const isKrw = cur === '원' || cur === '₩';
    const priceStr = isKrw
      ? `${Math.round(snap.currentPrice || 0).toLocaleString('ko-KR')}원`
      : `$${Number(snap.currentPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    setText('current-ticker-symbol', etf.symbol);
    setText('current-ticker-name', `${etf.name} · ${etf.leverageMultiplier}배`);
    setText('current-ticker-price', priceStr);

    const priceEl = document.getElementById('current-ticker-price');
    if (priceEl) {
      priceEl.setAttribute('title', `기준 시뮬레이션 단가 (최근 마감가: ${priceStr})`);
    }

    const gap = snap.sma200 ? ((snap.currentPrice - snap.sma200) / snap.sma200) * 100 : 0;
    const gapEl = document.getElementById('current-ticker-gap');
    if (gapEl) {
      gapEl.textContent = `200선 ${gap >= 0 ? '+' : ''}${gap.toFixed(1)}% (${gap >= 0 ? '정배열' : '역배열'})`;
      gapEl.className = `compact-pill ${gap >= 0 ? 'text-success' : 'text-danger'}`;
    }

    const rsiEl = document.getElementById('current-ticker-rsi');
    if (rsiEl) {
      const rsiVal = snap.rsi14 || 50;
      rsiEl.textContent = `RSI ${rsiVal.toFixed(1)}`;
      rsiEl.className = `compact-pill ${rsiVal >= 70 ? 'text-danger' : rsiVal <= 30 ? 'text-success' : ''}`;
    }

    // 퀵 티커 알약(pill) 활성 클래스 동기화
    const pills = document.querySelectorAll('.quick-ticker-pill[data-ticker], [data-ticker]');
    pills.forEach((p) => {
      p.classList.toggle('active', p.getAttribute('data-ticker') === tickerKey);
    });
  }

  function syncOverlayChipsToDOM() {
    const overlayChips = document.querySelectorAll('[data-overlay]');
    overlayChips.forEach((chip) => {
      const key = chip.getAttribute('data-overlay');
      if (key && key in state.overlays) {
        chip.classList.toggle('active', Boolean(state.overlays[key]));
      }
    });
  }

  function initTickerPills() {
    const container = document.getElementById('quick-ticker-chips-container');
    if (!container) return;

    const etfs = MarketData.LEVERAGE_ETFS || {};
    const html = Object.entries(etfs)
      .map(([key, asset]) => {
        const cat = asset.category || 'lev_10';
        const lev = asset.leverageMultiplier || 1;
        const isKr = (asset.techSnapshot && (asset.techSnapshot.currency === '원' || asset.techSnapshot.currency === '₩')) || asset.yahooTicker?.endsWith('.KS') || asset.yahooTicker?.endsWith('.KQ');
        const subLabel = lev > 1 ? `${lev}X` : isKr ? '국내' : '1X';
        const isActive = key === state.selectedTicker;
        return `
          <button type="button" 
            class="quick-ticker-pill ticker-btn ${isActive ? 'active' : ''}" 
            data-ticker="${key}" 
            data-cat="${cat}" 
            data-name="${asset.name || ''}" 
            data-symbol="${asset.symbol || ''}" 
            title="${asset.name} (${asset.tag || ''})">
            ${asset.symbol} <span class="pill-sub">(${subLabel})</span>
          </button>
        `;
      })
      .join('');

    container.innerHTML = html;
    filterTickerPills();
  }

  function filterTickerPills() {
    const cat = state.tickerCategory || 'lev_10';
    const q = (state.tickerSearch || '').trim().toLowerCase();
    const pills = document.querySelectorAll('#quick-ticker-chips-container .quick-ticker-pill');

    pills.forEach((pill) => {
      const itemCat = pill.getAttribute('data-cat');
      const itemSymbol = (pill.getAttribute('data-symbol') || '').toLowerCase();
      const itemName = (pill.getAttribute('data-name') || '').toLowerCase();
      const itemKey = (pill.getAttribute('data-ticker') || '').toLowerCase();

      const matchCat = cat === 'all' || itemCat === cat;
      const matchSearch =
        !q ||
        itemSymbol.includes(q) ||
        itemName.includes(q) ||
        itemKey.includes(q);

      pill.style.display = matchCat && matchSearch ? 'inline-flex' : 'none';
    });
  }

  function bootstrap() {
    initCommonUI(TOOL_ID);

    injectSeoSchema({
      name: '레버리지 ETF 10종 기간별 백테스팅(TQQQ·SOXL·NVDL·TSLL) & 최신 주가(2026.10.17) 기술적 차트 분석 시뮬레이터',
      description:
        '10대 레버리지 ETF의 2015~2026.10.17 구간별 역사적 백테스팅과 200일 이동평균선·볼린저밴드·RSI·52주 낙폭 기반 기술적 차트 진단 및 퀀트 운용 제안을 제공하는 금융 워크스테이션',
      category: 'FinanceApplication',
    });

    const savedState = loadToolState(TOOL_ID);
    if (savedState && savedState.currentInputs) {
      state.currentInputs = sanitizeLeverageInputs(savedState.currentInputs);
      if (savedState.pinnedScenario) {
        state.pinnedScenario = savedState.pinnedScenario;
      }
    }
    if (window.location.search) {
      state.currentInputs = sanitizeLeverageInputs(parseUrlParams(state.currentInputs));
    }

    initTickerPills();
    syncTechInputsFromTicker(state.selectedTicker);
    syncInputsToDOM(state.currentInputs);
    updateCompactTickerBar(state.selectedTicker);
    syncOverlayChipsToDOM();
    bindEvents();
    runSimulationAndRender();

    if (typeof MarketData.fetchLiveUsdKrwRate === 'function') {
      MarketData.fetchLiveUsdKrwRate().then((fxInfo) => {
        if (fxInfo && fxInfo.rate) {
          state.usdKrwRate = fxInfo.rate;
          const fxBadge = document.getElementById('live-fx-badge');
          if (fxBadge) {
            fxBadge.innerHTML = `<span class="live-dot"></span><span>기준일 2026.10.17 · 실시간 환율 1$ = ${fxInfo.rate.toLocaleString('ko-KR')}원</span>`;
          }
          updateUsdHelperText();
        }
      });
    }
  }

  function syncTechInputsFromTicker(tickerKey) {
    const etf = MarketData.LEVERAGE_ETFS && MarketData.LEVERAGE_ETFS[tickerKey];
    if (!etf || !etf.techSnapshot) return;
    const snap = etf.techSnapshot;
    const defaultDate = snap.asOfDate || MarketData.LATEST_MARKET_DATE || '2026-10-17';

    state.customTech = {
      asOfDate: defaultDate,
      currentPrice: snap.currentPrice,
      sma200: snap.sma200,
      sma50: snap.sma50,
      rsi14: snap.rsi14,
    };

    const dateEl = document.getElementById('input-tech-date');
    const priceEl = document.getElementById('input-tech-price');
    const sma200El = document.getElementById('input-tech-sma200');
    const sma50El = document.getElementById('input-tech-sma50');
    const rsiEl = document.getElementById('input-tech-rsi');

    if (dateEl) dateEl.value = String(defaultDate);
    if (priceEl) priceEl.value = String(snap.currentPrice);
    if (sma200El) sma200El.value = String(snap.sma200);
    if (sma50El) sma50El.value = String(snap.sma50);
    if (rsiEl) rsiEl.value = String(snap.rsi14);
  }

  function updateUsdHelperText() {
    const usdEl = document.getElementById('usd-equiv-initial');
    if (usdEl) {
      const usdInitial = Math.round(state.currentInputs.initialCapital / state.usdKrwRate);
      const usdMonthly = Math.round(state.currentInputs.monthlyContribution / state.usdKrwRate);
      usdEl.textContent = `2026.10.17 환율 기준 초기 약 $${usdInitial.toLocaleString('en-US')} 거치 + 월 약 $${usdMonthly.toLocaleString('en-US')} 적립 투자에 해당합니다.`;
    }
  }

  function syncInputsToDOM(inputs) {
    const fields = [
      { key: 'initialCapital', scale: 0.0001 },
      { key: 'monthlyContribution', scale: 0.0001 },
      { key: 'annualReturnRate', scale: 1 },
      { key: 'annualVolatility', scale: 1 },
      { key: 'expenseRatio', scale: 1 },
      { key: 'years', scale: 1 },
    ];

    fields.forEach(({ key, scale }) => {
      const displayVal = Math.round(inputs[key] * scale * 100) / 100;
      const slider = document.getElementById(`slider-${key}`);
      const numInput = document.getElementById(`input-${key}`);
      if (slider) {
        slider.value = String(displayVal);
        updateSliderProgress(slider);
      }
      if (numInput) {
        numInput.value = String(displayVal);
      }
    });

    const levBtns = document.querySelectorAll('[data-leverage]');
    levBtns.forEach((btn) => {
      const val = Number(btn.getAttribute('data-leverage'));
      btn.classList.toggle('active', val === inputs.leverageMultiplier);
    });

    const startYearSelect = document.getElementById('select-start-year');
    const startMonthSelect = document.getElementById('select-start-month');
    const endYearSelect = document.getElementById('select-end-year');
    const endMonthSelect = document.getElementById('select-end-month');
    if (startYearSelect) startYearSelect.value = String(state.startYear);
    if (startMonthSelect) startMonthSelect.value = String(state.startMonth || 1);
    if (endYearSelect) endYearSelect.value = String(state.endYear);
    if (endMonthSelect) endMonthSelect.value = String(state.endMonth || 10);

    initAllSlidersProgress();
    updateUsdHelperText();
  }

  function bindEvents() {
    const fields = [
      { key: 'initialCapital', toRaw: (v) => Number(v) * 10000 },
      { key: 'monthlyContribution', toRaw: (v) => Number(v) * 10000 },
      { key: 'annualReturnRate', toRaw: (v) => Number(v) },
      { key: 'annualVolatility', toRaw: (v) => Number(v) },
      { key: 'expenseRatio', toRaw: (v) => Number(v) },
      { key: 'years', toRaw: (v) => Number(v) },
    ];

    fields.forEach(({ key, toRaw }) => {
      const slider = document.getElementById(`slider-${key}`);
      const numInput = document.getElementById(`input-${key}`);

      const handleUpdate = (sourceEl, targetEl) => {
        if (targetEl) targetEl.value = sourceEl.value;
        if (slider) updateSliderProgress(slider);
        state.currentInputs[key] = toRaw(sourceEl.value);
        updateUsdHelperText();
        scheduleRender();
      };

      if (slider) {
        slider.addEventListener('input', () => handleUpdate(slider, numInput));
      }
      if (numInput) {
        numInput.addEventListener('input', () => handleUpdate(numInput, slider));
      }
    });

    // 원터치 퀵 칩 버튼 바인딩 (초기 거치금, 월 적립금, 기대수익률, 기간 등 빠른 설정)
    document.querySelectorAll('.chip-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const val = Number(btn.dataset.val);
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          targetInput.value = String(val);
          targetInput.dispatchEvent(new Event('input'));
        }
      });
    });

    // 레버리지 배수 버튼 (1x / 2x / 3x)
    const levBtns = document.querySelectorAll('[data-leverage]');
    levBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentInputs.leverageMultiplier = Number(btn.getAttribute('data-leverage'));
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
      });
    });

    // 60종 자산 카테고리 필터 탭 (레버리지 10종 / 해외 TOP 20 / 국내 TOP 20 / 배당 TOP 10 / 전체)
    const assetCatBtns = document.querySelectorAll('[data-asset-cat]');
    assetCatBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-asset-cat') || 'lev_10';
        state.tickerCategory = cat;
        assetCatBtns.forEach((b) => b.classList.toggle('active', b === btn));
        filterTickerPills();
      });
    });

    // 60종 실시간 종목 검색 인풋 (티커, 종목명, 국문/영문 즉시 매칭)
    const searchInput = document.getElementById('input-ticker-search');
    const clearSearchBtn = document.getElementById('btn-clear-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.tickerSearch = e.target.value;
        if (clearSearchBtn) {
          clearSearchBtn.style.display = state.tickerSearch ? 'block' : 'none';
        }
        filterTickerPills();
      });
    }
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        state.tickerSearch = '';
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        clearSearchBtn.style.display = 'none';
        filterTickerPills();
      });
    }

    // 60종 칩 컨테이너 이벤트 위임 (클릭 시 종목 즉시 전환)
    const chipsContainer = document.getElementById('quick-ticker-chips-container');
    if (chipsContainer) {
      chipsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-ticker-pill[data-ticker]');
        if (!btn) return;
        const tickerKey = btn.getAttribute('data-ticker');
        const etf = MarketData.LEVERAGE_ETFS && MarketData.LEVERAGE_ETFS[tickerKey];
        if (!etf) return;

        state.selectedTicker = tickerKey;
        updateCompactTickerBar(tickerKey);

        state.currentInputs.leverageMultiplier = etf.leverageMultiplier;
        state.currentInputs.annualReturnRate = etf.expectedAnnualReturn;
        state.currentInputs.annualVolatility = etf.annualVolatility;
        state.currentInputs.expenseRatio = etf.expenseRatio;

        syncTechInputsFromTicker(tickerKey);
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
        showToast(`${etf.symbol} (${etf.name}) 2015~2026.10.17 분석 지표가 적용되었습니다.`);
      });
    }

    // 4대 딥다이브 분석 탭 전환
    const deepTabBtns = document.querySelectorAll('[data-deep-tab]');
    deepTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.deepTab = btn.getAttribute('data-deep-tab') || 'historical';
        deepTabBtns.forEach((b) =>
          b.classList.toggle('active', b.getAttribute('data-deep-tab') === state.deepTab)
        );
        scheduleRender();
      });
    });

    // [v2] 메인 메뉴 딥링크: index.html?tab=historical|drawdown|technical|formula
    try {
      const requestedTab = new URLSearchParams(window.location.search).get('tab');
      const validTabs = ['historical', 'drawdown', 'technical', 'formula'];
      if (requestedTab && validTabs.includes(requestedTab)) {
        state.deepTab = requestedTab;
        deepTabBtns.forEach((b) =>
          b.classList.toggle('active', b.getAttribute('data-deep-tab') === state.deepTab)
        );
      }
    } catch (err) {
      // URL 파싱 실패 시 기본 탭 유지
    }

    // 백테스팅 시작 년·월 ~ 종료 년·월 드롭다운 이벤트
    const startYearSelect = document.getElementById('select-start-year');
    const startMonthSelect = document.getElementById('select-start-month');
    const endYearSelect = document.getElementById('select-end-year');
    const endMonthSelect = document.getElementById('select-end-month');

    const handleDateRangeChange = () => {
      let sY = startYearSelect ? Number(startYearSelect.value) : 2015;
      let sM = startMonthSelect ? Number(startMonthSelect.value) : 1;
      let eY = endYearSelect ? Number(endYearSelect.value) : 2026;
      let eM = endMonthSelect ? Number(endMonthSelect.value) : 10;

      const sTotal = sY * 12 + sM;
      const eTotal = eY * 12 + eM;

      if (sTotal > eTotal) {
        sY = eY;
        sM = eM;
        if (startYearSelect) startYearSelect.value = String(sY);
        if (startMonthSelect) startMonthSelect.value = String(sM);
      }

      state.startYear = sY;
      state.startMonth = sM;
      state.endYear = eY;
      state.endMonth = eM;
      state.activeRegime = 'custom';
      document.querySelectorAll('[data-regime]').forEach((b) => b.classList.remove('active'));
      scheduleRender();
    };

    if (startYearSelect) startYearSelect.addEventListener('change', handleDateRangeChange);
    if (startMonthSelect) startMonthSelect.addEventListener('change', handleDateRangeChange);
    if (endYearSelect) endYearSelect.addEventListener('change', handleDateRangeChange);
    if (endMonthSelect) endMonthSelect.addEventListener('change', handleDateRangeChange);

    // 역사적 시장 국면 프리셋 버튼 이벤트
    const regimeBtns = document.querySelectorAll('[data-regime]');
    regimeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const regimeKey = btn.getAttribute('data-regime');
        const preset =
          MarketData.BACKTEST_REGIME_PRESETS && MarketData.BACKTEST_REGIME_PRESETS[regimeKey];
        if (!preset) return;

        state.activeRegime = regimeKey;
        state.startYear = preset.startYear;
        state.startMonth = regimeKey === 'recent1Y' ? 10 : 1;
        state.endYear = preset.endYear;
        state.endMonth = preset.endYear === 2026 ? 10 : 12;

        if (startYearSelect) startYearSelect.value = String(state.startYear);
        if (startMonthSelect) startMonthSelect.value = String(state.startMonth);
        if (endYearSelect) endYearSelect.value = String(state.endYear);
        if (endMonthSelect) endMonthSelect.value = String(state.endMonth);

        regimeBtns.forEach((b) =>
          b.classList.toggle('active', b.getAttribute('data-regime') === regimeKey)
        );
        scheduleRender();
        showToast(`[${preset.label}] 백테스팅 구간이 적용되었습니다.`);
      });
    });

    // 탭 2: 최신 조회 기준일(date) 및 주가·이평선·RSI 입력창 실시간 이벤트
    const techDateEl = document.getElementById('input-tech-date');
    if (techDateEl) {
      techDateEl.addEventListener('change', () => {
        if (!state.customTech) syncTechInputsFromTicker(state.selectedTicker);
        if (techDateEl.value) {
          state.customTech.asOfDate = techDateEl.value;
          scheduleRender();
          showToast(`차트 조회 기준일이 ${techDateEl.value.replace(/-/g, '.')}로 변경되었습니다.`);
        }
      });
    }

    const techInputIds = [
      { id: 'input-tech-price', key: 'currentPrice' },
      { id: 'input-tech-sma200', key: 'sma200' },
      { id: 'input-tech-sma50', key: 'sma50' },
      { id: 'input-tech-rsi', key: 'rsi14' },
    ];
    techInputIds.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          if (!state.customTech) syncTechInputsFromTicker(state.selectedTicker);
          const val = Number(el.value);
          if (Number.isFinite(val) && val > 0) {
            state.customTech[key] = val;
            scheduleRender();
          }
        });
      }
    });

    const syncLiveQuoteBtn = document.getElementById('btn-sync-live-quote');
    if (syncLiveQuoteBtn) {
      syncLiveQuoteBtn.addEventListener('click', async () => {
        if (typeof MarketData.fetchLiveYahooQuote !== 'function') return;
        const statusEl = document.getElementById('live-quote-status');
        syncLiveQuoteBtn.disabled = true;
        syncLiveQuoteBtn.textContent = '⏳ 야후 파이낸스 조회 중...';
        if (statusEl) {
          statusEl.textContent = '● Yahoo Finance 실시간 일봉 조회 중...';
        }
        try {
          const res = await MarketData.fetchLiveYahooQuote(state.selectedTicker, true);
          syncTechInputsFromTicker(state.selectedTicker);
          scheduleRender();
          if (statusEl) {
            statusEl.textContent = res.isLive
              ? `● ${res.source} 동기화 완료 (${state.selectedTicker}: ${res.snapshot.currency}${res.snapshot.currentPrice})`
              : `● ${res.source} 적용됨 (${state.selectedTicker}: ${res.snapshot.currency}${res.snapshot.currentPrice})`;
          }
          showToast(
            `${state.selectedTicker} 최신 주가(${res.snapshot.currency}${res.snapshot.currentPrice}) 및 이평선·RSI가 동기화되었습니다.`
          );
        } finally {
          syncLiveQuoteBtn.disabled = false;
          syncLiveQuoteBtn.textContent = '실시간 야후 파이낸스 시세 동기화';
        }
      });
    }

    const resetTechBtn = document.getElementById('btn-reset-tech');
    if (resetTechBtn) {
      resetTechBtn.addEventListener('click', () => {
        syncTechInputsFromTicker(state.selectedTicker);
        const statusEl = document.getElementById('live-quote-status');
        if (statusEl) {
          statusEl.textContent = '● Yahoo Finance 실측 마감가 복원됨';
        }
        scheduleRender();
        showToast(`${state.selectedTicker} 종목의 Yahoo Finance 실측 마감가·지표로 복원되었습니다.`);
      });
    }

    // 탭 2: 봉차트 주기(1D/1W/1M/1Y) 버튼 이벤트
    const tfBtns = document.querySelectorAll('[data-tf]');
    tfBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tf = btn.getAttribute('data-tf') || '1D';
        state.timeframe = tf;
        tfBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-tf') === tf));
        scheduleRender();
      });
    });

    // 탭 2: 시가·종가 봉차트(candle) vs 선차트(line) 전환 이벤트
    const styleBtns = document.querySelectorAll('[data-chart-style]');
    styleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const st = btn.getAttribute('data-chart-style') || 'candle';
        state.chartStyle = st;
        styleBtns.forEach((b) =>
          b.classList.toggle('active', b.getAttribute('data-chart-style') === st)
        );
        scheduleRender();
      });
    });

    // 탭 2: 메인 차트 오버레이 지표(이동평균선, 일목균형표, 볼린저밴드, SuperTrend, 돈치안) 멀티 토글
    const overlayChips = document.querySelectorAll('[data-overlay]');
    overlayChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const key = chip.getAttribute('data-overlay');
        if (!key || !(key in state.overlays)) return;
        state.overlays[key] = !state.overlays[key];
        chip.classList.toggle('active', Boolean(state.overlays[key]));
        scheduleRender();
      });
    });

    // 탭 2: 하단 오실레이터(스토캐스틱 슬로우 / LazyBear 스퀴즈 모멘텀 / MACD / RSI·코너스RSI2) 선택
    const subIndSelect = document.getElementById('select-sub-indicator');
    if (subIndSelect) {
      subIndSelect.addEventListener('change', () => {
        state.subIndicator = subIndSelect.value || 'stochastic';
        scheduleRender();
      });
    }

    // 탭 2: 5대 알고리즘 상세 매매 원리 및 대응법 보기 아코디언 토글 (이벤트 위임)
    const algoGridEl = document.getElementById('algo-signal-grid');
    if (algoGridEl) {
      algoGridEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-algo-toggle]');
        if (!btn) return;
        const algoId = btn.getAttribute('data-algo-toggle');
        const detailBox = document.getElementById(`algo-detail-${algoId}`);
        if (detailBox) {
          const isOpen = detailBox.classList.toggle('show');
          btn.innerHTML = isOpen
            ? '<span>지표 수식 원리 &amp; 시나리오 접기</span> ▴'
            : '<span>지표 수식 원리 &amp; 시나리오 보기</span> ▾';
        }
      });
    }

    // 접이식 아코디언 카드 토글 이벤트 (3대 퀀트 리포트 및 하단 데이터표)
    const accordionToggleBtns = document.querySelectorAll('[data-accordion-target]');
    accordionToggleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-accordion-target');
        const card = document.getElementById(targetId);
        if (card) {
          card.classList.toggle('open');
        }
      });
    });

    // 시나리오 고정 (Case A 비교)
    const pinBtn = document.getElementById('btn-pin-scenario');
    if (pinBtn) {
      pinBtn.addEventListener('click', () => {
        if (!state.lastResult) return;

        if (state.pinnedScenario) {
          state.pinnedScenario = null;
          pinBtn.textContent = '현재 조건 고정 (Case A 비교)';
          showToast('고정된 비교 시나리오(Case A)가 해제되었습니다.');
        } else {
          const { summary, chartData } = state.lastResult;
          const endLabel = state.endYear === 2026 ? '2026.10.17' : state.endYear;
          state.pinnedScenario = {
            label: `고정(Case A): ${state.selectedTicker} (${state.startYear}~${endLabel})`,
            finalValue: summary.finalValue || 0,
            cagr: Number((summary.cagr || 0).toFixed(2)),
            series: chartData && chartData.leveragedSeries ? [...chartData.leveragedSeries] : [],
          };
          pinBtn.textContent = '고정 시나리오(Case A) 해제';
          showToast('현재 시나리오가 Case A로 고정되었습니다. 다른 종목이나 기간을 선택해 비교해 보세요.');
        }

        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        scheduleRender();
      });
    }

    // 법적 면책 조항 워터마크가 합성된 캔버스 PNG 저장 함수
    function exportCanvasWithLegalDisclaimer(sourceCanvas, filename) {
      if (!sourceCanvas) return;
      const barHeight = 28;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = sourceCanvas.width;
      exportCanvas.height = sourceCanvas.height + barHeight;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) {
        exportCanvasToPng(sourceCanvas, filename);
        return;
      }

      // 1) 원본 캔버스 차트 복사
      ctx.drawImage(sourceCanvas, 0, 0);

      // 2) 하단 자본시장법 준수 법적 면책 조항 바 렌더링
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, sourceCanvas.height, exportCanvas.width, barHeight);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        'SimuLab Hub | 본 이미지는 과거 데이터·통계 수식 기반 모의 시뮬레이션 결과이며 금융투자상품에 대한 매매 권유나 자문이 아닙니다.',
        exportCanvas.width / 2,
        sourceCanvas.height + barHeight / 2
      );

      // 3) 다운로드 실행
      exportCanvasToPng(exportCanvas, filename);
    }

    // 전체 초기화
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.selectedTicker = 'TQQQ';
        state.startYear = 2015;
        state.endYear = 2026;
        state.activeRegime = 'full';
        state.currentInputs = {
          ...DEFAULT_INPUTS,
          leverageMultiplier: 3,
          annualReturnRate: 14.5,
          annualVolatility: 23.5,
          expenseRatio: 0.88,
        };
        state.pinnedScenario = null;
        const pinBtnEl = document.getElementById('btn-pin-scenario');
        if (pinBtnEl) pinBtnEl.textContent = '현재 조건 고정 (Case A 비교)';

        document.querySelectorAll('[data-ticker]').forEach((b) =>
          b.classList.toggle('active', b.getAttribute('data-ticker') === 'TQQQ')
        );
        document.querySelectorAll('[data-regime]').forEach((b) =>
          b.classList.toggle('active', b.getAttribute('data-regime') === 'full')
        );

        updateCompactTickerBar('TQQQ');
        syncTechInputsFromTicker('TQQQ');
        syncInputsToDOM(state.currentInputs);
        saveToolState(TOOL_ID, state.currentInputs, null);
        scheduleRender();
        showToast('초기 기본값(TQQQ · 2015~2026.10.17 최신)으로 재설정되었습니다.');
      });
    }

    function showActionResultModal(title, desc) {
      const modalEl = document.getElementById('action-result-modal');
      if (!modalEl) return;
      if (title) setText('modal-action-title', title);
      if (desc) setText('modal-action-desc', desc);
      modalEl.classList.add('open');
    }

    function hideActionResultModal() {
      const modalEl = document.getElementById('action-result-modal');
      if (modalEl) modalEl.classList.remove('open');
    }

    const closeModalBtn = document.getElementById('btn-close-modal');
    const confirmModalBtn = document.getElementById('btn-modal-confirm');
    const modalOverlay = document.getElementById('action-result-modal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideActionResultModal);
    if (confirmModalBtn) confirmModalBtn.addEventListener('click', hideActionResultModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) hideActionResultModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideActionResultModal();
    });

    // URL 공유
    const shareBtn = document.getElementById('btn-share-url');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        shareSimulationUrl(state.currentInputs);
        showActionResultModal(
          '결과 URL 공유 완료',
          '현재 설정하신 조건 링크가 클립보드에 복사되었습니다. 링크를 친구나 커뮤니티에 바로 공유할 수 있습니다.'
        );
      });
    }

    // 차트 PNG 저장 (법적 면책 조항 워터마크 자동 합성)
    const pngBtn = document.getElementById('btn-export-png');
    if (pngBtn) {
      pngBtn.addEventListener('click', () => {
        const canvas = document.getElementById('sim-canvas');
        exportCanvasWithLegalDisclaimer(canvas, `simulab-${state.selectedTicker}-${state.deepTab}-20261017.png`);
        showActionResultModal(
          '차트 이미지(PNG) 저장 완료',
          '고해상도 차트 이미지(자본시장법 준수 법적 면책 워터마크 포함)가 다운로드되었습니다.'
        );
      });
    }

    // CSV 다운로드 (월단위 정밀 데이터 내보내기)
    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        if (!state.lastResult) return;
        const tableData =
          state.lastResult.monthlyTable && state.lastResult.monthlyTable.length > 0
            ? state.lastResult.monthlyTable
            : state.lastResult.yearlyTable;
        if (!tableData) return;

        const headers = [
          '기준 시점(년.월)',
          '누적 투자원금',
          '1배수 기초지수 평가액',
          '레버리지 적립식 평가액',
          '원금대비 수익률(%)',
          '1배수 대비 차액',
        ];
        const rows = tableData.map((r) => [
          r.date || r.year,
          r.principal,
          r.baseValue,
          r.leveragedValue,
          Number(r.profitRatePct || 0).toFixed(2),
          r.diffVsBase,
        ]);
        exportDataToCsv(
          headers,
          rows,
          `leverage-etf-${state.selectedTicker}-monthly-${state.startYear}-${state.endYear}.csv`
        );
        showActionResultModal(
          '월단위 분석 데이터(CSV) 다운로드 완료',
          `선택하신 ${state.selectedTicker} 종목의 총 ${rows.length}개 구간 월별 상세 백테스팅 데이터가 CSV 파일로 정상 저장되었습니다.`
        );
      });
    }
  }

  function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      runSimulationAndRender();
    });
  }

  function runSimulationAndRender() {
    const inputs = state.currentInputs;

    // 1) 좌측 슬라이더 배지 업데이트
    setText('badge-initialCapital', formatCurrency(inputs.initialCapital, true));
    setText('badge-monthlyContribution', formatCurrency(inputs.monthlyContribution, true));
    setText('badge-annualReturnRate', formatPercent(inputs.annualReturnRate, 1, true));
    setText('badge-annualVolatility', formatPercent(inputs.annualVolatility, 1, false));
    setText('badge-expenseRatio', formatPercent(inputs.expenseRatio, 2, false));
    setText('badge-years', `${inputs.years}년`);

    // 2) 탭별 컨텍스트 패널 및 사이드바 표시/숨김 제어
    const sidebarHist = document.getElementById('sidebar-step-historical');
    const sidebarFormula = document.getElementById('sidebar-step-formula');
    const techPanel = document.getElementById('tech-analyzer-panel');
    const proposalBox = document.getElementById('proposal-box');

    const isFormulaTab = state.deepTab === 'formula';
    if (sidebarHist) {
      sidebarHist.classList.toggle('hidden', isFormulaTab);
      sidebarHist.style.display = isFormulaTab ? 'none' : 'block';
    }
    if (sidebarFormula) {
      sidebarFormula.classList.toggle('hidden', !isFormulaTab);
      sidebarFormula.style.display = isFormulaTab ? 'block' : 'none';
    }

    if (techPanel) {
      techPanel.style.display = state.deepTab === 'technical' ? 'block' : 'none';
    }
    if (proposalBox) {
      proposalBox.style.display = state.deepTab === 'technical' ? 'block' : 'none';
    }

    updateCompactTickerBar(state.selectedTicker);

    // 3) 선택된 탭에 맞춰 분기 렌더링
    if (state.deepTab === 'historical') {
      renderHistoricalTab();
    } else if (state.deepTab === 'technical') {
      renderTechnicalTab();
    } else if (state.deepTab === 'drawdown') {
      renderDrawdownTab();
    } else {
      renderFormulaTab();
    }
  }

  /**
   * [탭 1] 기간별 실전 역사적 백테스팅 렌더링 (2015~2026.10.17 중 선택 구간)
   */
  function renderHistoricalTab() {
    const sMonthPad = String(state.startMonth || 1).padStart(2, '0');
    const eMonthPad = String(state.endMonth || 10).padStart(2, '0');
    const startDisplay = `${state.startYear}.${sMonthPad}`;
    const endDisplay =
      state.endYear === 2026 && (state.endMonth || 10) === 10
        ? '2026.10.17(최신)'
        : `${state.endYear}.${eMonthPad}`;

    const histResult = MarketData.runHistoricalLeverageBacktest(
      state.selectedTicker,
      state.currentInputs.initialCapital,
      state.currentInputs.monthlyContribution,
      {
        startYear: state.startYear,
        startMonth: state.startMonth || 1,
        endYear: state.endYear,
        endMonth: state.endMonth || 10,
      }
    );
    state.lastResult = histResult;
    const { etf, period, summary, chartData, yearlyTable } = histResult;

    const presetObj =
      MarketData.BACKTEST_REGIME_PRESETS && MarketData.BACKTEST_REGIME_PRESETS[state.activeRegime];
    const regimeDescEl = document.getElementById('regime-desc-note');
    if (regimeDescEl) {
      const prefix = presetObj ? `[${presetObj.label}] ${presetObj.desc} · ` : '';
      regimeDescEl.innerHTML = `${prefix}<strong>종목 노트:</strong> ${etf.worstYearNote}`;
    }

    // 한 줄 핵심 결론 배너
    setText(
      'verdict-q-tag',
      `Q. ${startDisplay} ~ ${endDisplay}(${period.numYears}개년 구간) 실제 시장에서 ${etf.symbol}을 모았다면?`
    );
    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      const diffVsBase = summary.finalValue - summary.finalBaseValue;
      const isWin = diffVsBase >= 0;
      verdictEl.innerHTML = `
        <strong>${period.startYear}년 ~ ${endDisplay}(${period.numYears}개년)</strong> 원금 총 <strong>${formatCurrency(
        summary.finalPrincipal,
        true
      )}</strong>을 투입한 결과, <strong>${etf.symbol}(${etf.leverageMultiplier}배) 적립식 최종 자산은 <span class="${
        isWin ? 'verdict-success' : 'verdict-warning'
      }">${formatCurrency(summary.finalValue, true)}</span></strong>으로 1배수(${
        etf.baseSymbol
      }: ${formatCurrency(summary.finalBaseValue, true)}) 대비 <strong>${
        isWin ? '+' : ''
      }${formatCurrency(diffVsBase, true)}</strong>을 기록했습니다!
        (단, <strong>${summary.worstYear}년 한 해 최대 <span class="verdict-danger">${summary.maxDrawdown}%</span></strong> 하락을 견뎌야 했으며, 순수 거치식 단독 잔고는 ${formatCurrency(
        summary.finalLumpSumValue,
        true
      )}입니다.)
      `;
    }

    // KPI 카드 4종 업데이트
    const kpiEndShort = period.endYear === 2026 ? '26.10.17' : period.endYear;
    setText('kpi-label-1', `${period.startYear}~${kpiEndShort} 적립식 최종자산`);
    setText('kpi-final-value', formatCurrency(summary.finalValue, true));
    setText('kpi-final-sub', `총 투입 원금: ${formatCurrency(summary.finalPrincipal, true)}`);

    setText('kpi-label-2', '구간 실제 연복리 (CAGR)');
    const cagrEl = document.getElementById('kpi-cagr');
    if (cagrEl) {
      cagrEl.textContent = formatPercent(summary.cagr, 2, true);
      cagrEl.className = `kpi-value ${summary.cagr >= 0 ? 'text-success' : 'text-danger'}`;
    }
    setText('kpi-cagr-sub', `1배수(${etf.baseSymbol}) 연복리: ${formatPercent(summary.baseCagr, 2, true)}`);

    setText('kpi-label-3', '초기원금 거치식 단독 결과');
    setText('kpi-drag', formatCurrency(summary.finalLumpSumValue, true));
    setText(
      'kpi-drag-sub',
      `최고의 해: ${summary.bestYear}년 (${formatPercent(summary.bestReturnPct, 1, true)})`
    );

    setText('kpi-label-4', '구간 내 최악의 연간 손실');
    setText('kpi-mdd', `${summary.maxDrawdown.toFixed(1)}%`);
    setText('kpi-mdd-sub', `${summary.worstYear}년 실제 연간 수익률 기준`);

    // 차트 렌더링
    const canvas = document.getElementById('sim-canvas');
    const colors = getThemeChartColors();
    const datasets = [
      {
        label: `${etf.symbol} (${etf.leverageMultiplier}x 적립식 DCA)`,
        data: chartData.leveragedSeries,
        color: colors.colorCaseB,
        fillArea: true,
      },
      {
        label: `${etf.baseSymbol} (1x 기초지수 적립식)`,
        data: chartData.baseIndexSeries,
        color: colors.colorSuccess,
        fillArea: false,
      },
      {
        label: `누적 투입 원금`,
        data: chartData.principalSeries,
        color: colors.colorBaseline,
        dashed: true,
      },
    ];

    if (
      state.pinnedScenario &&
      Array.isArray(state.pinnedScenario.series) &&
      state.pinnedScenario.series.length === chartData.labels.length
    ) {
      datasets.push({
        label: state.pinnedScenario.label,
        data: state.pinnedScenario.series,
        color: colors.colorWarning,
        dashed: true,
      });
    }

    renderLineChart(canvas, {
      labels: chartData.labels,
      datasets,
      includeZero: true,
      yFormatter: (val) => formatCurrency(val, true),
      watermarkText: `SIMULAB · ${etf.symbol} (${period.startYear}-${kpiEndShort}) BACKTEST`,
    });

    // [사용자 요청 100% 반영] 월단위 백테스팅 상세 테이블 렌더링
    const monthlyList = histResult.monthlyTable || [];
    setText(
      'table-title',
      `${etf.symbol} vs ${etf.baseSymbol} (${startDisplay} ~ ${endDisplay}) 실제 월단위 백테스팅 상세표`
    );
    setText(
      'table-subtitle',
      `총 ${monthlyList.length}개월간 매월 누적 투자원금과 1배수 vs ${etf.leverageMultiplier}배수 적립식 계좌 평가액 (월단위 정밀 시뮬레이션)`
    );

    const thead = document.getElementById('yearly-table-head');
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>기준 시점 (년·월)</th>
          <th>누적 투자원금</th>
          <th>${etf.baseSymbol} (1X) 평가액</th>
          <th>${etf.symbol} (${etf.leverageMultiplier}X) 적립식 평가액</th>
          <th>누적 수익률</th>
          <th>월간 수익률 (1X vs ${etf.leverageMultiplier}X)</th>
        </tr>
      `;
    }

    const tbody = document.getElementById('yearly-table-body');
    if (tbody) {
      tbody.innerHTML = monthlyList
        .map((row) => {
          const profitClass = row.profitRatePct >= 0 ? 'text-success' : 'text-danger';
          const levRetClass = row.levMonthlyReturnPct >= 0 ? 'text-accent' : 'text-danger';
          return `
            <tr>
              <td><strong>${row.date}</strong></td>
              <td>${formatCurrency(row.principal, true)}</td>
              <td>${formatCurrency(row.baseValue, true)}</td>
              <td><strong>${formatCurrency(row.leveragedValue, true)}</strong></td>
              <td class="${profitClass}"><strong>${formatPercent(row.profitRatePct, 1, true)}</strong></td>
              <td class="${levRetClass}">
                1X ${formatPercent(row.baseMonthlyReturnPct, 1, true)} / <strong>${etf.symbol} ${formatPercent(
            row.levMonthlyReturnPct,
            1,
            true
          )}</strong>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  /**
   * [탭 2] 최신 주가(2026.10.17 기준) 시가-종가 봉차트(일·주·월·년) + 일목균형표·볼린저·스토캐스틱·트레이딩뷰 5대 퀀트 알고리즘 렌더링
   */
  function renderTechnicalTab() {
    const analysis = MarketData.analyzeTechnicalChartSignals(
      state.selectedTicker,
      state.customTech
    );
    const { etf, techInputs, metrics, proposals, techChartData } = analysis;
    const cur = techInputs.currency;
    const dateDot = techInputs.asOfDateDot || '2026.10.17';

    const quantPack =
      typeof MarketData.computeFullQuantChartPack === 'function'
        ? MarketData.computeFullQuantChartPack(
            state.selectedTicker,
            state.timeframe,
            state.customTech || {}
          )
        : null;

    const tfNameMap = {
      '1D': '일봉 (1D · 최근 70거래일)',
      '1W': '주봉 (1W · 최근 60주)',
      '1M': '월봉 (1M · 최근 48개월)',
      '1Y': '년봉 (1Y · 2015~2026년)',
    };
    const tfTitle = tfNameMap[state.timeframe] || '일봉 (1D)';

    const fmtPrice = (val) =>
      cur === '원' || cur === '₩'
        ? `${Math.round(val).toLocaleString('ko-KR')}원`
        : `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 한 줄 핵심 결론 배너
    setText(
      'verdict-q-tag',
      `Q. [기준일: ${dateDot} · ${tfTitle}] ${etf.symbol} 시가·종가 봉차트 및 5대 퀀트 기술적 지표 현황은?`
    );
    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      const candles = quantPack && quantPack.candles ? quantPack.candles : [];
      const lastBar = candles[candles.length - 1] || {
        o: techInputs.currentPrice,
        h: techInputs.currentPrice,
        l: techInputs.currentPrice,
        c: techInputs.currentPrice,
      };
      const prevBar = candles[Math.max(0, candles.length - 2)] || lastBar;
      const barChgPct =
        prevBar.c > 0 ? ((lastBar.c - prevBar.c) / prevBar.c) * 100 : 0;

      verdictEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.28rem;">
          <span class="${metrics.regimeColorClass}" style="font-size: 0.92rem; font-weight: 800;">● ${metrics.regimeTitle}</span>
          <span style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-muted); font-weight: 700;">
            최신 종가 <strong>${fmtPrice(lastBar.c)}</strong> (<span class="${barChgPct >= 0 ? 'text-success' : 'text-danger'}">${barChgPct >= 0 ? '+' : ''}${barChgPct.toFixed(2)}%</span>)
          </span>
        </div>
        <div style="font-size: 0.83rem; color: var(--text-secondary); line-height: 1.52;">
          장기 생명선 200일선(${fmtPrice(techInputs.sma200)}) 대비 <strong class="${metrics.isAboveSma200 ? 'text-success' : 'text-danger'}">${formatPercent(metrics.sma200GapPct, 1, true)}</strong>, RSI(14) <strong>${techInputs.rsi14.toFixed(1)}</strong> 위치입니다. 아래 5대 기술적 지표 구간 분석과 통계적 시나리오를 확인하세요.
        </div>
      `;
    }

    // KPI 카드 4종을 기술적 지표 4대 핵심 카드로 업데이트
    setText('kpi-label-1', `① 200일선 이격도 (${dateDot})`);
    const kpi1 = document.getElementById('kpi-final-value');
    if (kpi1) {
      kpi1.textContent = formatPercent(metrics.sma200GapPct, 1, true);
      kpi1.className = `kpi-value ${metrics.isAboveSma200 ? 'text-success' : 'text-danger'}`;
    }
    setText(
      'kpi-final-sub',
      `${metrics.isAboveSma200 ? '200일선 상회 (장기 정배열)' : '200일선 하회 (변동성 주의)'} · 200일선 ${fmtPrice(
        techInputs.sma200
      )}`
    );

    setText('kpi-label-2', '② 스토캐스틱 슬로우 & RSI(14)');
    const kpi2 = document.getElementById('kpi-cagr');
    const lastStochK =
      quantPack && quantPack.indicators && quantPack.indicators.stochK
        ? quantPack.indicators.stochK[quantPack.indicators.stochK.length - 1]
        : 50;
    const lastStochD =
      quantPack && quantPack.indicators && quantPack.indicators.stochD
        ? quantPack.indicators.stochD[quantPack.indicators.stochD.length - 1]
        : 50;
    if (kpi2) {
      kpi2.textContent = `RSI ${techInputs.rsi14.toFixed(1)} · %K ${lastStochK.toFixed(0)}`;
      kpi2.className = `kpi-value ${metrics.rsiBadgeClass}`;
    }
    setText(
      'kpi-cagr-sub',
      `Stoch Slow(14,3,3) %K ${lastStochK.toFixed(1)} / %D ${lastStochD.toFixed(1)} (${
        lastStochK >= lastStochD ? '골든크로스 우위' : '데드크로스 조정'
      })`
    );

    setText('kpi-label-3', '③ 일목균형표 구름대 & 볼린저');
    const lastSpanA =
      quantPack && quantPack.indicators && quantPack.indicators.spanA
        ? quantPack.indicators.spanA[quantPack.indicators.spanA.length - 1]
        : techInputs.sma50;
    const lastSpanB =
      quantPack && quantPack.indicators && quantPack.indicators.spanB
        ? quantPack.indicators.spanB[quantPack.indicators.spanB.length - 1]
        : techInputs.sma200;
    const cloudTop = Math.max(lastSpanA, lastSpanB);
    setText('kpi-drag', `%B ${metrics.percentB.toFixed(0)}%`);
    setText(
      'kpi-drag-sub',
      `구름대 상단 ${fmtPrice(cloudTop)} · 볼린저 ${fmtPrice(techInputs.bbLower)}~${fmtPrice(
        techInputs.bbUpper
      )}`
    );

    setText('kpi-label-4', '④ 52주 고점 대비 할인율(낙폭)');
    setText('kpi-mdd', `${metrics.ddFrom52wHighPct.toFixed(1)}%`);
    setText(
      'kpi-mdd-sub',
      `전고점(${fmtPrice(techInputs.high52w)}) 탈환 시 +${metrics.recoveryGainNeededPct.toFixed(1)}% 수익`
    );

    // Canvas 차트: 시가-종가 봉차트(일·주·월·년) + 일목균형표 구름대 + 볼린저밴드 + SuperTrend + 하단 오실레이터
    const canvas = document.getElementById('sim-canvas');
    if (quantPack && typeof renderQuantCandleChart === 'function') {
      const ind = quantPack.indicators || {};
      const overlaysConfig = {
        showSMA: Boolean(state.overlays && state.overlays.sma),
        sma20: ind.sma20,
        sma50: ind.sma50,
        sma200: ind.sma200,
        showIchimoku: Boolean(state.overlays && state.overlays.ichimoku),
        spanA: ind.spanA,
        spanB: ind.spanB,
        tenkan: ind.tenkan,
        kijun: ind.kijun,
        showBollinger: Boolean(state.overlays && state.overlays.bollinger),
        bbUpper: ind.bbUpper,
        bbLower: ind.bbLower,
        bbMiddle: ind.bbMiddle,
        showSupertrend: Boolean(state.overlays && state.overlays.supertrend),
        supertrend: ind.supertrend,
        supertrendDir: ind.supertrendDir,
        signals: ind.signals,
        showDonchian: Boolean(state.overlays && state.overlays.donchian),
        donchianHigh: ind.donchianHigh,
        donchianLow: ind.donchianLow,
      };

      const subChartConfig = {
        type: state.subIndicator || 'stochastic',
        stochK: ind.stochK,
        stochD: ind.stochD,
        sqzVal: ind.sqzVal,
        sqzOn: ind.sqzOn,
        macdLine: ind.macdLine,
        macdSignal: ind.macdSignal,
        macdHist: ind.macdHist,
        rsi14: ind.rsi14,
        connorsRsi2: ind.connorsRsi2,
      };

      renderQuantCandleChart(canvas, {
        candles: quantPack.candles,
        overlays: overlaysConfig,
        subChart: subChartConfig,
        chartStyle: state.chartStyle,
        yFormatter: (val) => fmtPrice(val),
        watermarkText: `SIMULAB · ${etf.symbol} (${state.timeframe}) OHLCV & QUANT`,
      });
    } else {
      const colors = getThemeChartColors();
      renderLineChart(canvas, {
        labels: techChartData.labels,
        datasets: [
          {
            label: `${etf.symbol} 주가 추이`,
            data: techChartData.priceSeries,
            color: colors.colorCaseB,
            fillArea: true,
          },
        ],
        includeZero: false,
        yFormatter: (val) => fmtPrice(val),
      });
    }

    // 트레이딩뷰 & 월가 퀀트 5대 알고리즘 시그널 보드 렌더링 (콤팩트 + 아코디언 토글)
    setText('algo-tf-badge', `${tfTitle} OHLCV 실측`);
    const algoGridEl = document.getElementById('algo-signal-grid');
    if (algoGridEl && quantPack && Array.isArray(quantPack.algoSignals)) {
      algoGridEl.innerHTML = quantPack.algoSignals
        .map((algo) => {
          const sigLower = (algo.signal || 'HOLD').toLowerCase();
          return `
            <div class="algo-card signal-${sigLower}">
              <div class="algo-card-top">
                <span class="algo-author">${algo.author}</span>
                <span class="algo-signal-pill ${sigLower}">${algo.signal} · ${algo.badge}</span>
              </div>
              <div class="algo-name">${algo.name}</div>
              <div class="algo-key-level">${algo.keyLevel}</div>
              <button type="button" class="algo-toggle-btn" data-algo-toggle="${algo.id}">
                <span>지표 수식 원리 &amp; 시나리오 보기</span> ▾
              </button>
              <div id="algo-detail-${algo.id}" class="algo-detail-box">
                ${algo.summary}
              </div>
            </div>
          `;
        })
        .join('');
    }

    // 3대 퀀트 기술적 시나리오 분석 카드 렌더링
    setText('quant-score-pill', `종합 퀀트 기술적 스코어 (${dateDot}): ${metrics.quantScore} / 100점`);
    const propListEl = document.getElementById('proposal-list');
    if (propListEl) {
      propListEl.innerHTML = proposals
        .map(
          (p) => `
          <div class="proposal-card">
            <div class="proposal-card-top">
              <span class="proposal-cat">${p.category}</span>
              <span class="proposal-badge badge-${p.badgeType}">${p.badge}</span>
            </div>
            <div class="proposal-main-title">${p.title}</div>
            <div class="proposal-detail">${p.detail}</div>
          </div>
        `
        )
        .join('');
    }

    // 하단 테이블: 선택된 주기(일/주/월/년봉)의 최근 봉 시가·고가·저가·종가(OHLC) 및 주요 퀀트 지표 상세표
    setText(
      'table-title',
      `${etf.symbol} [${tfTitle}] 최근 시가·고가·저가·종가(OHLC) 및 일목·볼린저·스토캐스틱·스퀴즈 상세표`
    );
    setText(
      'table-subtitle',
      `선택하신 차트 주기(${state.timeframe})의 최근 봉별 시가-종가 등락률과 핵심 퀀트 지표 실측 테이블`
    );

    const thead = document.getElementById('yearly-table-head');
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>일자 / 주기 (${state.timeframe})</th>
          <th>시가 (Open)</th>
          <th>고가 (High) / 저가 (Low)</th>
          <th>종가 (Close) &amp; 등락률</th>
          <th>일목 구름상단 / 볼린저 상·하단</th>
          <th>Stoch(%K/%D) · 스퀴즈 · SuperTrend</th>
        </tr>
      `;
    }

    const tbody = document.getElementById('yearly-table-body');
    if (tbody && quantPack && Array.isArray(quantPack.candles)) {
      const candles = quantPack.candles;
      const ind = quantPack.indicators;
      const total = candles.length;
      const recentIndices = [];
      for (let i = total - 1; i >= Math.max(0, total - 15); i--) {
        recentIndices.push(i);
      }

      tbody.innerHTML = recentIndices
        .map((idx, rowNum) => {
          const bar = candles[idx];
          const prev = candles[Math.max(0, idx - 1)];
          const chgPct = prev && prev.c > 0 ? ((bar.c - prev.c) / prev.c) * 100 : 0;
          const isBull = bar.c >= bar.o;
          const cTop = Math.max(ind.spanA[idx] || 0, ind.spanB[idx] || 0);
          const stDir = ind.supertrendDir[idx] === 1 ? '▲상승지지' : '▼하락저항';
          const stClass = ind.supertrendDir[idx] === 1 ? 'text-success' : 'text-danger';
          const sqzStr = ind.sqzOn[idx] ? '응축(ON)' : '방출(OFF)';

          return `
            <tr style="${rowNum === 0 ? 'background-color: var(--accent-soft); font-weight: 700;' : ''}">
              <td><strong>${bar.t}</strong></td>
              <td>${fmtPrice(bar.o)}</td>
              <td>고가 ${fmtPrice(bar.h)} / 저가 ${fmtPrice(bar.l)}</td>
              <td class="${isBull ? 'text-success' : 'text-danger'}">
                <strong>${fmtPrice(bar.c)}</strong> (${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)}%)
              </td>
              <td>구름 ${fmtPrice(cTop)} · BB ${fmtPrice(ind.bbLower[idx])}~${fmtPrice(ind.bbUpper[idx])}</td>
              <td>
                %K ${(ind.stochK[idx] || 0).toFixed(0)}/%D ${(ind.stochD[idx] || 0).toFixed(0)} · ${sqzStr} ·
                <span class="${stClass}"><strong>${stDir}(${fmtPrice(ind.supertrend[idx])})</strong></span>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  /**
   * [탭 2] 고점 대비 낙폭(Underwater MDD) & 원금 회복 탄력성 분석 렌더링
   */
  function renderDrawdownTab() {
    const sMonthPad = String(state.startMonth || 1).padStart(2, '0');
    const eMonthPad = String(state.endMonth || 10).padStart(2, '0');
    const startDisplay = `${state.startYear}.${sMonthPad}`;
    const endDisplay =
      state.endYear === 2026 && (state.endMonth || 10) === 10
        ? '2026.10.17(최신)'
        : `${state.endYear}.${eMonthPad}`;

    const histResult = MarketData.runHistoricalLeverageBacktest(
      state.selectedTicker,
      state.currentInputs.initialCapital,
      state.currentInputs.monthlyContribution,
      {
        startYear: state.startYear,
        startMonth: state.startMonth || 1,
        endYear: state.endYear,
        endMonth: state.endMonth || 10,
      }
    );
    state.lastResult = histResult;
    const { etf, period, summary, chartData } = histResult;

    setText(
      'verdict-q-tag',
      `Q. ${etf.symbol} 투자 시 전고점 대비 최대 얼마나 물리고, 원금 회복에 몇 % 상승이 필요할까요?`
    );
    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      const absMaxDd = Math.min(98, Math.abs(summary.maxDrawdown));
      const needGain = (absMaxDd / Math.max(1, 100 - absMaxDd)) * 100;
      verdictEl.innerHTML = `
        <strong>${etf.symbol}(${etf.leverageMultiplier}배)</strong>은 ${startDisplay} ~ ${
        endDisplay
      } 중 최악의 해(${summary.worstYear}년)에 <span class="verdict-danger">${
        summary.maxDrawdown
      }%</span> 하락했습니다.
        계좌가 <strong>${summary.maxDrawdown}% 하락하면 원금 회복에만 무려 <span class="verdict-warning">+${needGain.toFixed(
        0
      )}%의 반등 수익률</span></strong>이 필요합니다! 따라서 거치식 몰빵을 피하고 현금 비중이나 월 적립식(DCA)을 반드시 병행해야 합니다.
      `;
    }

    setText('kpi-label-1', '최악의 해 연간 하락률');
    setText('kpi-final-value', `${summary.maxDrawdown.toFixed(1)}%`);
    setText('kpi-final-sub', `${summary.worstYear}년 실제 기록 (${etf.symbol})`);

    setText('kpi-label-2', '누적 전고점 대비 최대낙폭');
    setText('kpi-cagr', `${summary.maxUnderwaterDdPct.toFixed(1)}%`);
    setText('kpi-cagr-sub', `${period.startYear}년~${endDisplay} 수중(Underwater) 낙폭`);

    const absDd = Math.min(98, Math.abs(summary.maxDrawdown));
    const reqGain = (absDd / Math.max(1, 100 - absDd)) * 100;
    setText('kpi-label-3', '최악 낙폭 후 원금회복 필요수익률');
    setText('kpi-drag', `+${reqGain.toFixed(0)}% 상승 필요`);
    setText('kpi-drag-sub', `기초지수(${etf.baseSymbol}) 기준 약 +${(reqGain / etf.leverageMultiplier).toFixed(0)}% 반등 필요`);

    setText('kpi-label-4', '적립식(DCA) 물타기 방어 후 잔고');
    setText('kpi-mdd', formatCurrency(summary.finalValue, true));
    setText('kpi-mdd-sub', `순수 거치식(${formatCurrency(summary.finalLumpSumValue, true)}) 대비 압도적 회복`);

    // 수중 낙폭(Underwater Drawdown) 차트 렌더링
    const canvas = document.getElementById('sim-canvas');
    const colors = getThemeChartColors();
    renderLineChart(canvas, {
      labels: chartData.labels,
      datasets: [
        {
          label: `${etf.symbol} (${etf.leverageMultiplier}x) 전고점 대비 낙폭(%)`,
          data: chartData.drawdownSeries,
          color: colors.colorDanger,
          fillArea: true,
        },
        {
          label: `${etf.baseSymbol} (1x 기초지수) 전고점 대비 낙폭(%)`,
          data: chartData.baseDrawdownSeries,
          color: colors.colorCaseB,
          fillArea: false,
        },
      ],
      includeZero: true,
      yFormatter: (val) => `${val.toFixed(0)}%`,
      watermarkText: `SIMULAB · ${etf.symbol} UNDERWATER DRAWDOWN (%)`,
    });

    // 하단 테이블: 기초지수 하락폭별 레버리지 손실률 및 원금 회복 필요 수익률 비교표
    setText(
      'table-title',
      `기초지수 하락폭별 ${etf.leverageMultiplier}배 레버리지 손실률 & 원금 회복(탈출) 필요 수익률 표`
    );
    setText('table-subtitle', '왜 레버리지 투자에서 큰 폭의 하락(MDD)을 피하는 것이 가장 중요한지 보여주는 수학적 표');

    const thead = document.getElementById('yearly-table-head');
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>1배수 기초지수 하락폭</th>
          <th>1배수 원금회복 필요수익률</th>
          <th>${etf.leverageMultiplier}배 레버리지 예상 손실률</th>
          <th>${etf.leverageMultiplier}배 원금회복 필요수익률</th>
          <th>탈출을 위해 필요한 기초지수 반등폭</th>
          <th>위험도 판정</th>
        </tr>
      `;
    }

    const tbody = document.getElementById('yearly-table-body');
    if (tbody && typeof MarketData.buildDrawdownRecoveryTable === 'function') {
      const recoveryRows = MarketData.buildDrawdownRecoveryTable(etf.leverageMultiplier);
      tbody.innerHTML = recoveryRows
        .map((r) => {
          const dangerBadge =
            r.levDropPct <= -75
              ? '<span class="text-danger" style="font-weight:700;">거치식 회복 불능 위험 (적립식 필수)</span>'
              : r.levDropPct <= -45
              ? '<span class="text-warning" style="font-weight:700;">장기 침체 주의 구간</span>'
              : '<span class="text-success">정상 조정 범위</span>';

          return `
            <tr>
              <td><strong>${r.baseDropPct}% 하락 시</strong></td>
              <td>+${r.baseNeedPct}%</td>
              <td class="text-danger"><strong>${r.levDropPct}% 손실</strong></td>
              <td class="text-warning"><strong>+${r.levNeedPct}% 폭등 필요</strong></td>
              <td class="text-accent">기초지수 +${r.baseIndexNeededForLevRecovery}% 상승 필요</td>
              <td>${dangerBadge}</td>
            </tr>
          `;
        })
        .join('');
    }
  }

  /**
   * [탭 4] 수학적 음의 복리(Itô's Lemma) & 켈리 최적 배수 미래 시뮬레이션 렌더링
   */
  function renderFormulaTab() {
    const result = calculateLeverageSimulation(state.currentInputs);
    state.lastResult = result;
    const { inputs, summary, chartData, yearlyTable } = result;

    const muDec = inputs.annualReturnRate / 100;
    const sigmaDec = Math.max(0.05, inputs.annualVolatility / 100);
    const kellyOpt = Math.max(0, (muDec - 0.035) / (sigmaDec * sigmaDec));

    setText(
      'verdict-q-tag',
      `Q. 연변동성 ${inputs.annualVolatility}% 시장에서 ${inputs.leverageMultiplier}배 레버리지의 음의 복리와 최적 배수는?`
    );
    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      const diffVsBase = summary.finalValue - summary.finalBaseValue;
      verdictEl.innerHTML = `
        이토 보조정리(Itô's Lemma) 수식 계산 결과, 연변동성 <strong>${inputs.annualVolatility}%</strong>에 의해 매년 <span class="verdict-warning">-${summary.volatilityDragPct.toFixed(
        2
      )}%p의 음의 복리(Volatility Drag) 손실</span>이 차감되어 실효 연복리(CAGR)는 <strong>${formatPercent(
        summary.cagr,
        2,
        true
      )}</strong>가 됩니다.
        이 시장에서 장기 복리를 극대화하는 <strong>수학적 켈리 최적 배수는 약 <span class="verdict-highlight">${kellyOpt.toFixed(
          2
        )}배</span></strong>이며, ${inputs.years}년 후 예상 자산은 <strong>${formatCurrency(
        summary.finalValue,
        true
      )}</strong>(1배수 대비 ${diffVsBase >= 0 ? '+' : ''}${formatCurrency(diffVsBase, true)})입니다.
      `;
    }

    setText('kpi-label-1', `${inputs.years}년 후 예상 평가금액`);
    setText('kpi-final-value', formatCurrency(summary.finalValue, true));
    setText('kpi-final-sub', `원금 ${formatCurrency(summary.totalPrincipal, true)} 대비 ${formatPercent(summary.totalReturnPct, 1, true)}`);

    setText('kpi-label-2', '실효 연복리 성장률 (CAGR)');
    setText('kpi-cagr', formatPercent(summary.cagr, 2, true));
    setText('kpi-cagr-sub', `단순 산술(${inputs.leverageMultiplier}×μ): ${formatPercent(summary.naiveReturnPct, 1, true)}`);

    setText('kpi-label-3', '연간 변동성 끌림 손실률');
    setText('kpi-drag', `-${summary.volatilityDragPct.toFixed(2)}%p /년`);
    setText('kpi-drag-sub', `켈리 최적 레버리지: 약 ${kellyOpt.toFixed(2)}배`);

    setText('kpi-label-4', '95% 신뢰구간 예상 MDD');
    setText('kpi-mdd', `${summary.maxDrawdown.toFixed(1)}%`);
    setText('kpi-mdd-sub', `연 변동성 ${inputs.annualVolatility}% × ${inputs.leverageMultiplier}배 기준`);

    const canvas = document.getElementById('sim-canvas');
    const colors = getThemeChartColors();
    renderLineChart(canvas, {
      labels: chartData.labels,
      datasets: [
        {
          label: `${inputs.leverageMultiplier}x 레버리지 예상 궤적`,
          data: chartData.leveragedSeries,
          color: colors.colorCaseB,
          fillArea: true,
        },
        {
          label: `1x 기초지수 (연 ${inputs.annualReturnRate}%)`,
          data: chartData.baseIndexSeries,
          color: colors.colorSuccess,
          fillArea: false,
        },
        {
          label: `누적 투자 원금`,
          data: chartData.principalSeries,
          color: colors.colorBaseline,
          dashed: true,
        },
      ],
      includeZero: true,
      yFormatter: (val) => formatCurrency(val, true),
      watermarkText: 'SIMULAB · ITO LEMMA VOLATILITY DRAG ENGINE',
    });

    setText('table-title', `미래 ${inputs.years}년 연차별 수식 시뮬레이션 상세 비교표`);
    setText('table-subtitle', '이토 보조정리(변동성 끌림 차감) 적용 연차별 복리 성장 추이');

    const thead = document.getElementById('yearly-table-head');
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>경과 연차</th>
          <th>누적 투자원금</th>
          <th>1배수 기초지수 평가액</th>
          <th>${inputs.leverageMultiplier}배 레버리지 평가액</th>
          <th>원금 대비 수익률</th>
          <th>1배수 대비 손익 차액</th>
        </tr>
      `;
    }

    const tbody = document.getElementById('yearly-table-body');
    if (tbody) {
      tbody.innerHTML = yearlyTable
        .map((row) => {
          const profitClass = row.profitRatePct >= 0 ? 'text-success' : 'text-danger';
          const diffClass = row.diffVsBase >= 0 ? 'text-accent' : 'text-danger';
          const diffSign = row.diffVsBase >= 0 ? '+' : '';
          return `
            <tr>
              <td><strong>${row.year}년차</strong></td>
              <td>${formatCurrency(row.principal, true)}</td>
              <td>${formatCurrency(row.baseValue, true)}</td>
              <td><strong>${formatCurrency(row.leveragedValue, true)}</strong></td>
              <td class="${profitClass}">${formatPercent(row.profitRatePct, 1, true)}</td>
              <td class="${diffClass}">${diffSign}${formatCurrency(row.diffVsBase, true)}</td>
            </tr>
          `;
        })
        .join('');
    }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
