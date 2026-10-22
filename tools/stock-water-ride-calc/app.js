/**
 * ==========================================================================
 * SimuLab - 평단가 & 물타기 계산기 인터랙션 & 렌더링 컨트롤러 (app.js)
 * 파일 경로: tools/stock-water-ride-calc/app.js
 * --------------------------------------------------------------------------
 * [핵심 기능]
 * 1. 모드 1: 다회차 분할 매수 후 최종 평단가 및 현재가 대비 손익률 계산
 * 2. 모드 2: 원하는 목표 평단가까지 필요한 추가 매수 주식 수와 자금 정밀 역산
 * 3. 프리미엄 인풋 카드, 실시간 한글 금액 읽기(억/만 원), 퀵 칩 원터치 조절 지원
 * ==========================================================================
 */

(function () {
  'use strict';

  const TOOL_ID = 'stock-water-ride-calc';
  const SL = window.SimuLab || {};

  let currentMode = 'water-ride'; // 'water-ride' | 'target-water-ride'

  // 모드 1 주문 리스트
  let orders = [
    { price: 85000, quantity: 100 },
    { price: 65000, quantity: 150 },
  ];

  function init() {
    if (typeof SL.initCommonUI === 'function') {
      SL.initCommonUI(TOOL_ID);
    }

    bindEvents();
    renderOrdersTable();
    updateBadges();
    calculateAndRender();
  }

  function updateBadges() {
    const fmtKorean = SL.formatKoreanAmount;
    if (!fmtKorean) return;

    // 모드 1 현재가 배지
    const curMarketPrice = Number(document.getElementById('input-cur-market-price')?.value) || 0;
    const badgeCur = document.getElementById('badge-cur-market-price');
    if (badgeCur) badgeCur.textContent = fmtKorean(curMarketPrice);

    // 모드 2 배지들
    const curAvg = Number(document.getElementById('input-target-cur-avg')?.value) || 0;
    const curQty = Number(document.getElementById('input-target-cur-qty')?.value) || 0;
    const goalAvg = Number(document.getElementById('input-target-goal-avg')?.value) || 0;
    const addPrice = Number(document.getElementById('input-target-add-price')?.value) || 0;

    const badgeCurAvg = document.getElementById('badge-target-cur-avg');
    const badgeCurQty = document.getElementById('badge-target-cur-qty');
    const badgeGoalAvg = document.getElementById('badge-target-goal-avg');
    const badgeAddPrice = document.getElementById('badge-target-add-price');

    if (badgeCurAvg) badgeCurAvg.textContent = fmtKorean(curAvg);
    if (badgeCurQty) badgeCurQty.textContent = `${curQty.toLocaleString('ko-KR')}주`;
    if (badgeGoalAvg) badgeGoalAvg.textContent = fmtKorean(goalAvg);
    if (badgeAddPrice) badgeAddPrice.textContent = fmtKorean(addPrice);
  }

  function bindEvents() {
    // 탭 전환 버튼
    const tabBtns = document.querySelectorAll('.mode-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentMode = btn.getAttribute('data-mode');
        tabBtns.forEach((b) => b.classList.toggle('active', b === btn));
        
        document.getElementById('panel-water-ride').style.display =
          currentMode === 'water-ride' ? 'block' : 'none';
        document.getElementById('panel-target-water-ride').style.display =
          currentMode === 'target-water-ride' ? 'block' : 'none';

        updateBadges();
        calculateAndRender();
      });
    });

    // 주문 추가 버튼
    const addOrderBtn = document.getElementById('btn-add-order');
    if (addOrderBtn) {
      addOrderBtn.addEventListener('click', () => {
        orders.push({ price: 60000, quantity: 50 });
        renderOrdersTable();
        calculateAndRender();
      });
    }

    // 모드 1 현재가 입력
    const curPriceInput = document.getElementById('input-cur-market-price');
    if (curPriceInput) {
      curPriceInput.addEventListener('input', () => {
        updateBadges();
        calculateAndRender();
      });
    }

    // 모드 2 인풋 이벤트
    ['input-target-cur-avg', 'input-target-cur-qty', 'input-target-goal-avg', 'input-target-add-price'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          updateBadges();
          calculateAndRender();
        });
      }
    });

    // 퀵 칩 설정 리스너 ([data-chip-set])
    document.querySelectorAll('[data-chip-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const inputId = btn.getAttribute('data-chip-set');
        const val = Number(btn.getAttribute('data-val'));
        const inputEl = document.getElementById(inputId);
        if (inputEl && Number.isFinite(val)) {
          inputEl.value = val;
          updateBadges();
          calculateAndRender();
        }
      });
    });

    // 퀵 칩 증감 리스너 ([data-chip-add])
    document.querySelectorAll('[data-chip-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const inputId = btn.getAttribute('data-chip-add');
        const addVal = Number(btn.getAttribute('data-val')) || 0;
        const inputEl = document.getElementById(inputId);
        if (inputEl) {
          const cur = Number(inputEl.value) || 0;
          const next = Math.max(0, cur + addVal);
          inputEl.value = next;
          updateBadges();
          calculateAndRender();
        }
      });
    });
  }

  function renderOrdersTable() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    tbody.innerHTML = orders
      .map((ord, idx) => {
        const canDelete = orders.length > 1;
        return `
          <tr>
            <td style="font-weight: 700; width: 60px;">${idx + 1}차</td>
            <td>
              <input type="number" class="form-control order-price-input" data-index="${idx}" value="${ord.price}" step="any" min="0" style="padding: 0.4rem;" />
            </td>
            <td>
              <input type="number" class="form-control order-qty-input" data-index="${idx}" value="${ord.quantity}" step="1" min="1" style="padding: 0.4rem;" />
            </td>
            <td data-order-amount="${idx}" style="text-align: right; font-weight: 600;">
              ${new Intl.NumberFormat('ko-KR').format(ord.price * ord.quantity)}원
            </td>
            <td style="width: 50px; text-align: center;">
              ${
                canDelete
                  ? `<button type="button" class="btn btn-secondary btn-del-order" data-index="${idx}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">삭제</button>`
                  : '-'
              }
            </td>
          </tr>
        `;
      })
      .join('');

    // 인풋 이벤트 바인딩
    tbody.querySelectorAll('.order-price-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const i = Number(e.target.getAttribute('data-index'));
        orders[i].price = Number(e.target.value) || 0;
        calculateAndRender();
      });
    });

    tbody.querySelectorAll('.order-qty-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const i = Number(e.target.getAttribute('data-index'));
        orders[i].quantity = Number(e.target.value) || 0;
        calculateAndRender();
      });
    });

    tbody.querySelectorAll('.btn-del-order').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const i = Number(e.target.getAttribute('data-index'));
        if (orders.length > 1) {
          orders.splice(i, 1);
          renderOrdersTable();
          calculateAndRender();
        }
      });
    });
  }

  function calculateAndRender() {
    const fmt = (num) => new Intl.NumberFormat('ko-KR').format(Math.round(num));

    if (currentMode === 'water-ride') {
      const curMarketPrice = Number(document.getElementById('input-cur-market-price')?.value) || 0;
      const res = SL.calculateAveragePrice(orders, curMarketPrice);
      document.querySelectorAll('[data-order-amount]').forEach(cell => {
        const order = orders[Number(cell.dataset.orderAmount)];
        const price = Number.isFinite(Number(order?.price)) ? Math.max(0, Number(order.price)) : 0;
        const quantity = Number.isFinite(Number(order?.quantity)) ? Math.max(0, Number(order.quantity)) : 0;
        cell.textContent = `${fmt(price * quantity)}원`;
      });

      // 한 줄 결론 배너
      const verdictEl = document.getElementById('verdict-text');
      if (verdictEl) {
        verdictEl.innerHTML = `
          총 <strong>${fmt(res.totalAmount)}원</strong>을 투입하여 <strong>${fmt(res.totalQuantity)}주</strong>를 매수한 결과, 
          최종 평단가는 <strong>${fmt(res.averagePrice)}원</strong>입니다. (최초 매수가 대비 <strong>${res.priceDropPct > 0 ? '+' : ''}${res.priceDropPct.toFixed(1)}%</strong> 변동)<br/>
          ${curMarketPrice > 0 ? `(현재가 ${fmt(curMarketPrice)}원 기준 계좌 손익률: <strong>${res.currentProfitRate > 0 ? '+' : ''}${res.currentProfitRate.toFixed(2)}%</strong>)` : ''}
        `;
      }

      // KPI 카드 4종
      document.getElementById('kpi-avg-price').textContent = `${fmt(res.averagePrice)}원`;
      document.getElementById('kpi-total-qty').textContent = `${fmt(res.totalQuantity)}주`;
      document.getElementById('kpi-total-money').textContent = `${fmt(res.totalAmount)}원`;
      document.getElementById('kpi-drop-pct').textContent = `${res.priceDropPct.toFixed(1)}%`;

    } else {
      // 모드 2: 목표 평단가 역산
      const currentAvg = Number(document.getElementById('input-target-cur-avg')?.value) || 0;
      const currentQty = Number(document.getElementById('input-target-cur-qty')?.value) || 0;
      const targetAvg = Number(document.getElementById('input-target-goal-avg')?.value) || 0;
      const addPrice = Number(document.getElementById('input-target-add-price')?.value) || 0;

      const res = SL.calculateRequiredWaterRide({
        currentAvgPrice: currentAvg,
        currentQty,
        targetAvgPrice: targetAvg,
        addBuyPrice: addPrice,
      });

      const verdictEl = document.getElementById('verdict-text');
      if (verdictEl) {
        if (!res.isValid) {
          verdictEl.innerHTML = `<span class="text-danger">⚠️ ${res.error}</span>`;
        } else {
          verdictEl.innerHTML = `
            평단가를 <strong>${fmt(currentAvg)}원</strong>에서 <strong>${fmt(targetAvg)}원</strong>으로 낮추려면, 
            현재가 <strong>${fmt(addPrice)}원</strong>에 <strong>${fmt(res.requiredQuantity)}주(약 ${fmt(res.requiredAmount)}원)</strong>를 추가 매수해야 합니다!<br/>
            (물타기 완료 후 총 보유량은 ${fmt(res.finalTotalQuantity)}주, 총 투자금은 ${fmt(res.finalTotalAmount)}원이 됩니다.)
          `;
        }
      }

      document.getElementById('kpi-avg-price').textContent = res.isValid ? `${fmt(res.actualFinalAvgPrice)}원` : '-';
      document.getElementById('kpi-total-qty').textContent = res.isValid ? `+${fmt(res.requiredQuantity)}주 필요` : '-';
      document.getElementById('kpi-total-money').textContent = res.isValid ? `${fmt(res.requiredAmount)}원 필요` : '-';
      document.getElementById('kpi-drop-pct').textContent = res.isValid ? `${fmt(res.finalTotalAmount)}원 (총합)` : '-';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
