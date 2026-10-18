/**
 * ==========================================================================
 * SimuLab - 주식 실질 수익률 계산기 인터랙션 & 렌더링 컨트롤러 (app.js)
 * 파일 경로: tools/stock-profit-calc/app.js
 * --------------------------------------------------------------------------
 * [핵심 기능]
 * 1. 국내주식(KRW, 거래세 0.20%) / 해외주식(USD, 거래세 0.00%) 간편 원클릭 프리셋 전환
 * 2. 프리미엄 인풋 카드, 실시간 한글 금액 읽기(억/만 원), 퀵 칩 원터치 조절
 * 3. 매수가 대비 목표 수익률(+1%, +5% 등) 원터치 매도가 자동 산출
 * 4. 결과 공유(URL 파라미터 복사) 및 결과 텍스트 클립보드 복사 지원
 * ==========================================================================
 */

(function () {
  'use strict';

  const TOOL_ID = 'stock-profit-calc';
  const SL = window.SimuLab || {};

  // 기본 입력값
  const defaultInputs = {
    marketType: 'KR',
    buyPrice: 70000,
    sellPrice: 84000,
    quantity: 100,
    buyFeeRate: 0.015,
    sellFeeRate: 0.015,
    taxRate: 0.20,
  };

  let currentInputs = { ...defaultInputs };

  function init() {
    // 1. 공통 헤더·푸터·브레드크럼 초기화
    if (typeof SL.initCommonUI === 'function') {
      SL.initCommonUI(TOOL_ID);
    }

    // 2. URL 쿼리 파라미터 파싱 (공유된 링크 대응)
    if (typeof SL.parseUrlParams === 'function') {
      currentInputs = SL.parseUrlParams(defaultInputs);
    }

    // 3. DOM 요소 바인딩
    bindEvents();
    syncInputsToDOM();
    calculateAndRender();
  }

  function updateBadges(inputs) {
    const isUS = inputs.marketType === 'US';
    const buyBadge = document.getElementById('badge-buy-price');
    const sellBadge = document.getElementById('badge-sell-price');
    const qtyBadge = document.getElementById('badge-quantity');

    if (buyBadge) {
      if (isUS) {
        buyBadge.textContent = `$${inputs.buyPrice.toLocaleString('en-US')}`;
      } else {
        buyBadge.textContent = SL.formatKoreanAmount ? SL.formatKoreanAmount(inputs.buyPrice) : `${inputs.buyPrice.toLocaleString('ko-KR')}원`;
      }
    }

    if (sellBadge) {
      if (isUS) {
        sellBadge.textContent = `$${inputs.sellPrice.toLocaleString('en-US')}`;
      } else {
        sellBadge.textContent = SL.formatKoreanAmount ? SL.formatKoreanAmount(inputs.sellPrice) : `${inputs.sellPrice.toLocaleString('ko-KR')}원`;
      }
    }

    if (qtyBadge) {
      qtyBadge.textContent = `${inputs.quantity.toLocaleString('ko-KR')}주`;
    }
  }

  function bindEvents() {
    // 시장 프리셋 토글 (국내주식 vs 미국/해외주식)
    const marketBtns = document.querySelectorAll('.market-preset-btn');
    marketBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const market = btn.getAttribute('data-market');
        currentInputs.marketType = market;
        if (market === 'US') {
          currentInputs.taxRate = 0.00;
          currentInputs.buyFeeRate = 0.07;
          currentInputs.sellFeeRate = 0.07;
          if (currentInputs.buyPrice > 5000) {
            currentInputs.buyPrice = 150;
            currentInputs.sellPrice = 180;
          }
        } else {
          currentInputs.taxRate = 0.20;
          currentInputs.buyFeeRate = 0.015;
          currentInputs.sellFeeRate = 0.015;
          if (currentInputs.buyPrice < 1000) {
            currentInputs.buyPrice = 70000;
            currentInputs.sellPrice = 84000;
          }
        }
        syncInputsToDOM();
        calculateAndRender();
      });
    });

    // 숫자 인풋 이벤트 바인딩
    const inputIds = [
      'input-buy-price',
      'input-sell-price',
      'input-quantity',
      'input-buy-fee-rate',
      'input-sell-fee-rate',
      'input-tax-rate',
    ];

    inputIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          readInputsFromDOM();
          calculateAndRender();
        });
      }
    });

    // 매수가 퀵 칩 설정
    document.querySelectorAll('[data-buy-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-buy-set'));
        const inputEl = document.getElementById('input-buy-price');
        if (inputEl && Number.isFinite(val)) {
          inputEl.value = val;
          currentInputs.buyPrice = val;
          calculateAndRender();
        }
      });
    });

    // 매수가 퀵 칩 증감
    document.querySelectorAll('[data-buy-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-buy-add')) || 0;
        const inputEl = document.getElementById('input-buy-price');
        if (inputEl) {
          const cur = Number(inputEl.value) || 0;
          const next = Math.max(0, cur + addVal);
          inputEl.value = next;
          currentInputs.buyPrice = next;
          calculateAndRender();
        }
      });
    });

    // 매도가 퍼센트 퀵 칩 (+1%, +3%, +5%, +10%, +20%)
    document.querySelectorAll('[data-sell-pct]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pct = Number(btn.getAttribute('data-sell-pct')) || 0;
        const buyPrice = currentInputs.buyPrice || 0;
        const isUS = currentInputs.marketType === 'US';
        let targetSell = buyPrice * (1 + pct / 100);
        targetSell = isUS ? Math.round(targetSell * 100) / 100 : Math.round(targetSell);

        const sellInput = document.getElementById('input-sell-price');
        if (sellInput) {
          sellInput.value = targetSell;
          currentInputs.sellPrice = targetSell;
          calculateAndRender();
        }
      });
    });

    // 수량 퀵 칩 설정
    document.querySelectorAll('[data-qty-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-qty-set'));
        const inputEl = document.getElementById('input-quantity');
        if (inputEl && Number.isFinite(val)) {
          inputEl.value = val;
          currentInputs.quantity = val;
          calculateAndRender();
        }
      });
    });

    // 수량 퀵 칩 증감
    document.querySelectorAll('[data-qty-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-qty-add')) || 0;
        const inputEl = document.getElementById('input-quantity');
        if (inputEl) {
          const cur = Number(inputEl.value) || 0;
          const next = Math.max(1, cur + addVal);
          inputEl.value = next;
          currentInputs.quantity = next;
          calculateAndRender();
        }
      });
    });

    // 초기화 버튼
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentInputs = { ...defaultInputs };
        syncInputsToDOM();
        calculateAndRender();
        if (typeof SL.showToast === 'function') {
          SL.showToast('입력값이 기본값으로 초기화되었습니다.');
        }
      });
    }

    // URL 공유 버튼
    const shareBtn = document.getElementById('btn-share-url');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (typeof SL.shareSimulationUrl === 'function') {
          SL.shareSimulationUrl(currentInputs);
        }
      });
    }
  }

  function readInputsFromDOM() {
    const buyPriceEl = document.getElementById('input-buy-price');
    const sellPriceEl = document.getElementById('input-sell-price');
    const qtyEl = document.getElementById('input-quantity');
    const buyFeeEl = document.getElementById('input-buy-fee-rate');
    const sellFeeEl = document.getElementById('input-sell-fee-rate');
    const taxEl = document.getElementById('input-tax-rate');

    if (buyPriceEl) currentInputs.buyPrice = Number(buyPriceEl.value) || 0;
    if (sellPriceEl) currentInputs.sellPrice = Number(sellPriceEl.value) || 0;
    if (qtyEl) currentInputs.quantity = Number(qtyEl.value) || 0;
    if (buyFeeEl) currentInputs.buyFeeRate = Number(buyFeeEl.value) || 0;
    if (sellFeeEl) currentInputs.sellFeeRate = Number(sellFeeEl.value) || 0;
    if (taxEl) currentInputs.taxRate = Number(taxEl.value) || 0;
  }

  function syncInputsToDOM() {
    const isUS = currentInputs.marketType === 'US';

    // 버튼 활성화 상태
    document.querySelectorAll('.market-preset-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-market') === currentInputs.marketType);
    });

    // 통화 단위 라벨
    const unitLabels = document.querySelectorAll('.currency-unit-label');
    unitLabels.forEach((el) => {
      el.textContent = isUS ? '$' : '원';
    });

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('input-buy-price', currentInputs.buyPrice);
    setVal('input-sell-price', currentInputs.sellPrice);
    setVal('input-quantity', currentInputs.quantity);
    setVal('input-buy-fee-rate', currentInputs.buyFeeRate);
    setVal('input-sell-fee-rate', currentInputs.sellFeeRate);
    setVal('input-tax-rate', currentInputs.taxRate);

    // 퀵 칩 라벨 갱신
    const buyChipsRow = document.getElementById('buy-price-chips');
    if (buyChipsRow) {
      if (isUS) {
        buyChipsRow.innerHTML = `
          <button type="button" class="quick-chip-btn" data-buy-set="50">$50</button>
          <button type="button" class="quick-chip-btn" data-buy-set="100">$100</button>
          <button type="button" class="quick-chip-btn" data-buy-set="150">$150</button>
          <button type="button" class="quick-chip-btn" data-buy-set="200">$200</button>
          <button type="button" class="quick-chip-btn" data-buy-add="10">+$10</button>
          <button type="button" class="quick-chip-btn" data-buy-add="50">+$50</button>
        `;
      } else {
        buyChipsRow.innerHTML = `
          <button type="button" class="quick-chip-btn" data-buy-set="50000">5만</button>
          <button type="button" class="quick-chip-btn" data-buy-set="70000">7만</button>
          <button type="button" class="quick-chip-btn" data-buy-set="100000">10만</button>
          <button type="button" class="quick-chip-btn" data-buy-add="10000">+1만</button>
          <button type="button" class="quick-chip-btn" data-buy-add="50000">+5만</button>
        `;
      }
      // 동적으로 변경된 버튼 이벤트 다시 연결
      buyChipsRow.querySelectorAll('[data-buy-set]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const val = Number(btn.getAttribute('data-buy-set'));
          const inputEl = document.getElementById('input-buy-price');
          if (inputEl && Number.isFinite(val)) {
            inputEl.value = val;
            currentInputs.buyPrice = val;
            calculateAndRender();
          }
        });
      });
      buyChipsRow.querySelectorAll('[data-buy-add]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const addVal = Number(btn.getAttribute('data-buy-add')) || 0;
          const inputEl = document.getElementById('input-buy-price');
          if (inputEl) {
            const cur = Number(inputEl.value) || 0;
            const next = Math.max(0, cur + addVal);
            inputEl.value = next;
            currentInputs.buyPrice = next;
            calculateAndRender();
          }
        });
      });
    }

    updateBadges(currentInputs);
  }

  function calculateAndRender() {
    if (typeof SL.calculateStockProfit !== 'function') return;

    updateBadges(currentInputs);

    const res = SL.calculateStockProfit(currentInputs);
    const isUS = res.marketType === 'US';
    const currSym = isUS ? '$' : '원';

    const fmtMoney = (val) => {
      if (!Number.isFinite(val)) return `0${currSym}`;
      if (isUS) {
        return `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
      }
      return `${new Intl.NumberFormat('ko-KR').format(Math.round(val))}원`;
    };

    const fmtPct = (val) => {
      const sign = val > 0 ? '+' : '';
      return `${sign}${val.toFixed(2)}%`;
    };

    // 1. 핵심 결론 브리핑 배너
    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      const isProfit = res.netProfit > 0;
      const profitColorClass = isProfit ? 'text-success' : res.netProfit < 0 ? 'text-danger' : '';
      verdictEl.innerHTML = `
        매수가 <strong>${fmtMoney(res.buyPrice)}</strong>에 <strong>${new Intl.NumberFormat('ko-KR').format(res.quantity)}주</strong>를 매수 후 
        <strong>${fmtMoney(res.sellPrice)}</strong>에 매도 시, 
        제세공과금(수수료·세금 <strong>${fmtMoney(res.totalFeesAndTaxes)}</strong>)을 제한 
        <strong>실질 세후 순손익은 <span class="${profitColorClass}">${fmtMoney(res.netProfit)} (${fmtPct(res.netProfitRate)})</span></strong>입니다!<br/>
        (원금 회수를 위한 최소 본전 매도가는 <strong>${fmtMoney(res.breakEvenPrice)}</strong>입니다.)
      `;
    }

    // 2. 상단 4대 핵심 KPI 카드
    const kpiNetProfit = document.getElementById('kpi-net-profit');
    const kpiNetRate = document.getElementById('kpi-net-rate');
    const kpiTotalFees = document.getElementById('kpi-total-fees');
    const kpiBreakEven = document.getElementById('kpi-break-even');

    if (kpiNetProfit) {
      kpiNetProfit.textContent = fmtMoney(res.netProfit);
      kpiNetProfit.className = `kpi-value ${res.netProfit >= 0 ? 'text-success' : 'text-danger'}`;
    }
    if (kpiNetRate) {
      kpiNetRate.textContent = fmtPct(res.netProfitRate);
      kpiNetRate.className = `kpi-value ${res.netProfitRate >= 0 ? 'text-success' : 'text-danger'}`;
    }
    if (kpiTotalFees) {
      kpiTotalFees.textContent = fmtMoney(res.totalFeesAndTaxes);
    }
    if (kpiBreakEven) {
      kpiBreakEven.textContent = fmtMoney(res.breakEvenPrice);
    }

    // 3. 상세 비교 테이블 명세
    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('val-total-buy', fmtMoney(res.totalBuyAmount));
    setTxt('val-total-sell', fmtMoney(res.totalSellAmount));
    setTxt('val-gross-profit', `${fmtMoney(res.grossProfit)} (${fmtPct(res.grossProfitRate)})`);
    setTxt('val-buy-fee', fmtMoney(res.buyFee));
    setTxt('val-sell-fee', fmtMoney(res.sellFee));
    setTxt('val-tax', fmtMoney(res.transactionTax));
    setTxt('val-total-fees-table', fmtMoney(res.totalFeesAndTaxes));
    setTxt('val-net-profit-share', fmtMoney(res.netProfitPerShare));
  }

  // DOM 로드 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
