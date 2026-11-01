/**
 * ==========================================================================
 * SimuLab - 부동산 평수 ↔ ㎡ 면적 환산기 UI 컨트롤러
 * 파일 경로: tools/area-pyeong-calc/app.js
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const formatCurrency = window.SimuLab?.formatCurrency || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const formatKoreanAmount = window.SimuLab?.formatKoreanAmount || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);

  const inputSqm = document.getElementById('input-sqm');
  const inputPyeong = document.getElementById('input-pyeong');
  const statMainResult = document.getElementById('stat-main-result');
  const statSubResult = document.getElementById('stat-sub-result');

  // 단가
  const inputPrice = document.getElementById('input-unit-price');
  const badgePrice = document.getElementById('badge-unit-price');
  const statPriceConverted = document.getElementById('stat-price-converted');

  function updateFromSqm() {
    const s = Number(inputSqm.value) || 0;
    const p = window.AreaLogic.sqmToPyeong(s);
    inputPyeong.value = p;

    if (statMainResult) statMainResult.textContent = `${p} 평`;
    if (statSubResult) statSubResult.textContent = `${s} ㎡`;
    updatePrice();
  }

  function updateFromPyeong() {
    const p = Number(inputPyeong.value) || 0;
    const s = window.AreaLogic.pyeongToSqm(p);
    inputSqm.value = s;

    if (statMainResult) statMainResult.textContent = `${p} 평`;
    if (statSubResult) statSubResult.textContent = `${s} ㎡`;
    updatePrice();
  }

  function updatePrice() {
    const pr = Number(inputPrice.value) || 0;
    if (badgePrice) badgePrice.textContent = formatKoreanAmount(pr);

    const converted = window.AreaLogic.convertUnitPrice(pr, 'pyeong');
    if (statPriceConverted) {
      statPriceConverted.textContent = `㎡당 약 ${formatCurrency(converted)}`;
    }
  }

  // 프리셋 버튼 (59㎡, 84㎡, 114㎡ 등)
  document.querySelectorAll('.preset-area-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-area-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const sqm = Number(btn.getAttribute('data-sqm'));
      inputSqm.value = sqm;
      updateFromSqm();
    });
  });

  inputSqm.addEventListener('input', updateFromSqm);
  inputPyeong.addEventListener('input', updateFromPyeong);
  inputPrice.addEventListener('input', updatePrice);

  updateFromSqm();
});
