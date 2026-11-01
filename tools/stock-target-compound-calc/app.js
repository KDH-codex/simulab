/**
 * ==========================================================================
 * SimuLab - 목표가 & 복리 계산기 인터랙션 & 렌더링 컨트롤러 (app.js)
 * 파일 경로: tools/stock-target-compound-calc/app.js
 * --------------------------------------------------------------------------
 * [핵심 기능]
 * 1. 모드 1: 내 매수가 기준 목표 수익률(+10%~+100%)을 위한 세후 필요 매도가 계산
 * 2. 모드 2: 매월 적립식 복리 스노우볼 및 72법칙 자산 2배 소요 기간 시뮬레이션
 * 3. 프리미엄 인풋 카드, 실시간 한글 금액 읽기(억/만 원), 퀵 칩 원터치 조절 지원
 * ==========================================================================
 */

(function () {
  'use strict';

  const TOOL_ID = 'stock-target-compound-calc';
  const SL = window.SimuLab || {};

  let currentMode = 'target-price'; // 'target-price' | 'compound'

  function init() {
    if (typeof SL.initCommonUI === 'function') {
      SL.initCommonUI(TOOL_ID);
    }

    bindEvents();
    updateBadges();
    calculateAndRender();
  }

  function updateBadges() {
    const fmtKorean = SL.formatKoreanAmount;
    if (!fmtKorean) return;

    // 모드 1 배지들
    const buyPrice = Number(document.getElementById('input-target-buy-price')?.value) || 0;
    const qty = Number(document.getElementById('input-target-qty')?.value) || 0;
    const badgeBuy = document.getElementById('badge-target-buy-price');
    const badgeQty = document.getElementById('badge-target-qty');

    if (badgeBuy) badgeBuy.textContent = fmtKorean(buyPrice);
    if (badgeQty) badgeQty.textContent = `${qty.toLocaleString('ko-KR')}주`;

    // 모드 2 배지들
    const initCap = Number(document.getElementById('input-compound-init')?.value) || 0;
    const monthly = Number(document.getElementById('input-compound-monthly')?.value) || 0;
    const badgeInit = document.getElementById('badge-compound-init');
    const badgeMonthly = document.getElementById('badge-compound-monthly');

    if (badgeInit) badgeInit.textContent = fmtKorean(initCap);
    if (badgeMonthly) badgeMonthly.textContent = fmtKorean(monthly);
  }

  function bindEvents() {
    // 탭 전환
    const tabBtns = document.querySelectorAll('.mode-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentMode = btn.getAttribute('data-mode');
        tabBtns.forEach((b) => b.classList.toggle('active', b === btn));

        document.getElementById('panel-target-price').style.display =
          currentMode === 'target-price' ? 'block' : 'none';
        document.getElementById('panel-compound').style.display =
          currentMode === 'compound' ? 'block' : 'none';

        document.getElementById('table-card-compound').style.display =
          currentMode === 'compound' ? 'block' : 'none';

        updateBadges();
        calculateAndRender();
      });
    });

    // 모드 1 인풋 이벤트
    ['input-target-buy-price', 'input-target-qty', 'input-target-profit-rate', 'checkbox-include-tax'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          updateBadges();
          calculateAndRender();
        });
        el.addEventListener('change', () => {
          updateBadges();
          calculateAndRender();
        });
      }
    });

    // 목표 수익률 퀵 버튼
    document.querySelectorAll('.rate-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rate = btn.getAttribute('data-rate');
        const input = document.getElementById('input-target-profit-rate');
        if (input) {
          input.value = rate;
          updateBadges();
          calculateAndRender();
        }
      });
    });

    // 모드 2 인풋 이벤트
    ['input-compound-init', 'input-compound-monthly', 'input-compound-rate', 'input-compound-years'].forEach((id) => {
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

  function calculateAndRender() {
    const fmt = (num) => new Intl.NumberFormat('ko-KR').format(Math.round(num));

    if (currentMode === 'target-price') {
      const buyPrice = Number(document.getElementById('input-target-buy-price')?.value) || 0;
      const quantity = Number(document.getElementById('input-target-qty')?.value) || 0;
      const profitRate = Number(document.getElementById('input-target-profit-rate')?.value) || 0;
      const includeTax = document.getElementById('checkbox-include-tax')?.checked !== false;

      const res = SL.calculateTargetSellPrice({
        buyPrice,
        quantity,
        targetProfitRate: profitRate,
        includeTax,
      });

      const verdictEl = document.getElementById('verdict-text');
      if (verdictEl) {
        verdictEl.innerHTML = `
          매수가 <strong>${fmt(buyPrice)}원</strong> 기준 세후 목표 수익률 <strong>+${profitRate}%</strong>를 달성하려면, 
          주가가 최소 <strong>${fmt(res.targetPrice)}원(+${res.requiredPriceRisePct.toFixed(2)}%)</strong>까지 상승해야 합니다!<br/>
          (이때 세후 순수익금은 약 <strong>${fmt(res.actualNetProfit)}원</strong>이며, 제세공과금으로 ${fmt(res.totalFeesAndTaxes)}원이 차감됩니다.)
        `;
      }

      document.getElementById('kpi-1-title').textContent = '목표 매도가격';
      document.getElementById('kpi-1-val').textContent = `${fmt(res.targetPrice)}원`;
      document.getElementById('kpi-1-sub').textContent = `필요 상승률 +${res.requiredPriceRisePct.toFixed(1)}%`;

      document.getElementById('kpi-2-title').textContent = '세후 순수익금';
      document.getElementById('kpi-2-val').textContent = `${fmt(res.actualNetProfit)}원`;
      document.getElementById('kpi-2-sub').textContent = `목표 수익률 +${profitRate}%`;

      document.getElementById('kpi-3-title').textContent = '총 매도 대금';
      document.getElementById('kpi-3-val').textContent = `${fmt(res.totalSellAmount)}원`;
      document.getElementById('kpi-3-sub').textContent = `원금: ${fmt(res.totalBuyAmount)}원`;

      document.getElementById('kpi-4-title').textContent = '총 제세공과금';
      document.getElementById('kpi-4-val').textContent = `${fmt(res.totalFeesAndTaxes)}원`;
      document.getElementById('kpi-4-sub').textContent = includeTax ? '거래세0.2% + 수수료' : '미반영 (표면치)';

    } else {
      // 모드 2: 복리 스노우볼
      const initCap = Number(document.getElementById('input-compound-init')?.value) || 0;
      const monthly = Number(document.getElementById('input-compound-monthly')?.value) || 0;
      const rate = Number(document.getElementById('input-compound-rate')?.value) || 0;
      const years = Number(document.getElementById('input-compound-years')?.value) || 10;

      const res = SL.calculateCompoundInterest({
        initialCapital: initCap,
        monthlyDeposit: monthly,
        annualRate: rate,
        years,
      });

      const verdictEl = document.getElementById('verdict-text');
      if (verdictEl) {
        verdictEl.innerHTML = `
          초기 <strong>${fmt(initCap)}원</strong>에 매월 <strong>${fmt(monthly)}원</strong>을 연 <strong>${rate}%</strong> 복리로 <strong>${years}년간</strong> 굴리면, 
          총 원금 <strong>${fmt(res.finalPrincipal)}원</strong>이 <strong>${fmt(res.finalBalance)}원</strong>으로 불어나 
          <strong>${fmt(res.finalInterest)}원 (+${res.totalProfitRatePct}%)</strong>의 순수 복리 수익이 생깁니다!<br/>
          (72 법칙에 따라 원금이 2배가 되는 데 약 <strong>${res.ruleOf72Years}년</strong>이 걸립니다.)
        `;
      }

      document.getElementById('kpi-1-title').textContent = '최종 복리 평가액';
      document.getElementById('kpi-1-val').textContent = `${fmt(res.finalBalance)}원`;
      document.getElementById('kpi-1-sub').textContent = `수익률 +${res.totalProfitRatePct}%`;

      document.getElementById('kpi-2-title').textContent = '순수 복리 이자수익';
      document.getElementById('kpi-2-val').textContent = `${fmt(res.finalInterest)}원`;
      document.getElementById('kpi-2-sub').textContent = '이자·배당 복리 증식분';

      document.getElementById('kpi-3-title').textContent = '총 납입 원금';
      document.getElementById('kpi-3-val').textContent = `${fmt(res.finalPrincipal)}원`;
      document.getElementById('kpi-3-sub').textContent = `월 ${fmt(monthly)}원씩 적립`;

      document.getElementById('kpi-4-title').textContent = '원금 2배 달성 기간';
      document.getElementById('kpi-4-val').textContent = `${res.ruleOf72Years}년`;
      document.getElementById('kpi-4-sub').textContent = '72 법칙 기준';

      // 복리 연차별 테이블 렌더링
      const tbody = document.getElementById('compound-tbody');
      if (tbody) {
        tbody.innerHTML = res.yearlyTable
          .map(
            (row) => `
            <tr>
              <td><strong>${row.year}년차</strong></td>
              <td>${fmt(row.principal)}원</td>
              <td class="text-accent" style="font-weight: 700;">${fmt(row.balance)}원</td>
              <td class="text-success">${fmt(row.interest)}원</td>
              <td style="font-weight: 600;">+${row.profitRatePct}%</td>
            </tr>
          `
          )
          .join('');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
