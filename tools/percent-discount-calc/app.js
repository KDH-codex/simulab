/**
 * ==========================================================================
 * SimuLab - 퍼센트 & 할인율 계산기 UI 컨트롤러
 * 파일 경로: tools/percent-discount-calc/app.js
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const formatCurrency = window.SimuLab?.formatCurrency || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const formatKoreanAmount = window.SimuLab?.formatKoreanAmount || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);

  // 1. 세일 할인 모듈
  const inputOrigPrice = document.getElementById('input-orig-price');
  const badgeOrigPrice = document.getElementById('badge-orig-price');
  const inputDiscountRate = document.getElementById('input-discount-rate');
  const statFinalPrice = document.getElementById('stat-final-price');
  const statDiscountAmount = document.getElementById('stat-discount-amount');
  const statEffectiveRate = document.getElementById('stat-effective-rate');

  function updateDiscount() {
    const orig = Number(inputOrigPrice.value) || 0;
    const rate = Number(inputDiscountRate.value) || 0;
    if (badgeOrigPrice) badgeOrigPrice.textContent = formatKoreanAmount(orig);

    const res = window.PercentLogic.calcDiscount(orig, rate);
    if (statFinalPrice) statFinalPrice.textContent = formatCurrency(res.finalPrice);
    if (statDiscountAmount) statDiscountAmount.textContent = `-${formatCurrency(res.totalDiscountAmount)}`;
    if (statEffectiveRate) statEffectiveRate.textContent = `${res.effectiveDiscountRate}% 할인`;
  }

  // 2. N% 금액 모듈
  const inputTotalVal = document.getElementById('input-total-val');
  const inputPctVal = document.getElementById('input-pct-val');
  const statPctResult = document.getElementById('stat-pct-result');

  function updatePercentOf() {
    const t = Number(inputTotalVal.value) || 0;
    const p = Number(inputPctVal.value) || 0;
    const res = window.PercentLogic.calcPercentOf(t, p);
    if (statPctResult) statPctResult.textContent = `${res.amount.toLocaleString('ko-KR')}`;
  }

  // 3. 변동률 모듈 (A -> B)
  const inputFromVal = document.getElementById('input-from-val');
  const inputToVal = document.getElementById('input-to-val');
  const statChangeResult = document.getElementById('stat-change-result');

  function updateChangeRate() {
    const from = Number(inputFromVal.value) || 0;
    const to = Number(inputToVal.value) || 0;
    const res = window.PercentLogic.calcChangeRate(from, to);
    if (statChangeResult) {
      const sign = res.isIncrease ? '+' : '';
      const color = res.isIncrease ? '#dc2626' : '#2563eb';
      statChangeResult.innerHTML = `<span style="color:${color}; font-weight:800;">${sign}${res.changeRate}%</span> (${sign}${res.diff.toLocaleString('ko-KR')})`;
    }
  }

  // 퀵 할인율 버튼 (10%, 20%, 30%, 50%)
  document.querySelectorAll('.discount-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      inputDiscountRate.value = btn.getAttribute('data-rate');
      updateDiscount();
    });
  });

  // 이벤트 바인딩
  [inputOrigPrice, inputDiscountRate].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', updateDiscount);
      inp.addEventListener('change', updateDiscount);
    }
  });

  [inputTotalVal, inputPctVal].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', updatePercentOf);
      inp.addEventListener('change', updatePercentOf);
    }
  });

  [inputFromVal, inputToVal].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', updateChangeRate);
      inp.addEventListener('change', updateChangeRate);
    }
  });

  // 초기 실행
  updateDiscount();
  updatePercentOf();
  updateChangeRate();
});
