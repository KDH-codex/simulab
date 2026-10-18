/**
 * ==========================================================================
 * SimuLab - 그때 그 아파트 샀다면 (부동산 타임머신) UI 컨트롤러
 * 파일 경로: tools/past-apt-timemachine/app.js
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const formatCurrency = window.SimuLab?.formatCurrency || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const formatKoreanAmount = window.SimuLab?.formatKoreanAmount || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const showToast = window.SimuLab?.showToast || ((msg) => alert(msg));

  // DOM 엘리먼트
  const inputPastPrice = document.getElementById('input-past-price');
  const badgePastPrice = document.getElementById('badge-past-price');
  const inputCurrentPrice = document.getElementById('input-current-price');
  const badgeCurrentPrice = document.getElementById('badge-current-price');
  const inputLtv = document.getElementById('input-ltv');
  const inputRate = document.getElementById('input-rate');
  const inputYear = document.getElementById('input-year');

  // 결과 디스플레이
  const statNetProfit = document.getElementById('stat-net-profit');
  const statNetProfitKorean = document.getElementById('stat-net-profit-korean');
  const statRoe = document.getElementById('stat-roe');
  const statSeedMoney = document.getElementById('stat-seed-money');
  const statGainGross = document.getElementById('stat-gain-gross');
  const statInterest = document.getElementById('stat-interest');
  const statReceiptComment = document.getElementById('stat-receipt-comment');
  const statGradeTitle = document.getElementById('stat-grade-title');

  let currentAptKey = 'mapo_raemian';
  let currentYearVal = 2014;

  function updateKoreanBadges() {
    if (badgePastPrice) badgePastPrice.textContent = formatKoreanAmount(Number(inputPastPrice.value) || 0);
    if (badgeCurrentPrice) badgeCurrentPrice.textContent = formatKoreanAmount(Number(inputCurrentPrice.value) || 0);
  }

  function runCalculation() {
    updateKoreanBadges();

    const params = {
      pastPrice: Number(inputPastPrice.value) || 0,
      currentPrice: Number(inputCurrentPrice.value) || 0,
      purchaseYear: Number(inputYear.value) || 2014,
      ltvPercent: Number(inputLtv.value) || 50,
      annualMortgageRate: Number(inputRate.value) || 3.5
    };

    const res = window.AptTimemachineLogic.calculate(params);

    // 하이라이트: 순수익
    if (statNetProfit) statNetProfit.textContent = `+${formatCurrency(res.netProfit)}`;
    if (statNetProfitKorean) statNetProfitKorean.textContent = `순자산 +${formatKoreanAmount(res.netProfit)} 증가!`;

    if (statRoe) statRoe.textContent = `+${res.roePercent}% (내 돈 대비)`;
    if (statSeedMoney) statSeedMoney.textContent = formatCurrency(res.mySeedMoney);
    if (statGainGross) statGainGross.textContent = `+${formatCurrency(res.capitalGain)}`;
    if (statInterest) statInterest.textContent = `-${formatCurrency(res.totalInterestPaid)}`;

    if (statGradeTitle) statGradeTitle.textContent = res.gradeTitle;
    if (statReceiptComment) statReceiptComment.textContent = `"${res.gradeComment}"`;
  }

  // 아파트 프리셋 클릭 리스너
  document.querySelectorAll('.apt-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.apt-preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      currentAptKey = btn.getAttribute('data-apt');
      const aptData = window.AptTimemachineLogic.APARTMENT_PRESETS[currentAptKey];
      if (!aptData) return;

      // 가능한 연도 찾기
      const years = Object.keys(aptData.prices).map(Number).sort((a, b) => a - b);
      const chosenYear = years.includes(currentYearVal) ? currentYearVal : years[0];
      currentYearVal = chosenYear;
      inputYear.value = chosenYear;

      inputPastPrice.value = aptData.prices[chosenYear];
      inputCurrentPrice.value = aptData.currentPrice;

      // 연도 버튼 상태 업데이트
      document.querySelectorAll('.year-btn').forEach((yb) => {
        const y = Number(yb.getAttribute('data-year'));
        yb.classList.toggle('active', y === chosenYear);
        yb.style.display = years.includes(y) ? 'block' : 'none';
      });

      runCalculation();
    });
  });

  // 연도 버튼 클릭 리스너
  document.querySelectorAll('.year-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.year-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const y = Number(btn.getAttribute('data-year'));
      currentYearVal = y;
      inputYear.value = y;

      const aptData = window.AptTimemachineLogic.APARTMENT_PRESETS[currentAptKey];
      if (aptData && aptData.prices[y]) {
        inputPastPrice.value = aptData.prices[y];
      }
      runCalculation();
    });
  });

  // LTV 프리셋 버튼 (0%, 40%, 50%, 60%)
  document.querySelectorAll('.ltv-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ltv-chip-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      inputLtv.value = btn.getAttribute('data-ltv');
      runCalculation();
    });
  });

  // 카톡 공유 버튼
  const btnCopyReceipt = document.getElementById('btn-copy-receipt');
  if (btnCopyReceipt) {
    btnCopyReceipt.addEventListener('click', () => {
      const aptData = window.AptTimemachineLogic.APARTMENT_PRESETS[currentAptKey];
      const aptName = aptData ? aptData.name : '아파트';
      const profitText = statNetProfitKorean.textContent;
      const text = `[내 인생 최대의 실수 영수증 😭]\n그때 ${currentYearVal}년에 ${aptName} 샀으면...\n👉 지금 ${profitText}\n\n당신이 놓친 부동산 자산은 얼마인지 확인해보세요!\nhttps://simulab.kr/tools/past-apt-timemachine/`;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('📋 영수증 문구가 클립보드에 복사되었습니다! 카톡으로 친구들에게 공유해보세요.');
        });
      } else {
        prompt('아래 문구를 복사하세요:', text);
      }
    });
  }

  [inputPastPrice, inputCurrentPrice, inputLtv, inputRate, inputYear].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  // 초기 실행 (마포래미안푸르지오 2014년 입주 시점 기본)
  runCalculation();
});
