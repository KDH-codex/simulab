/**
 * ==========================================================================
 * SimuLab - 국민연금 조기수령 vs 정상 vs 연기 손익분기 시뮬레이터 UI 컨트롤러
 * 파일 경로: tools/national-pension-sim/app.js
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const formatCurrency = window.SimuLab?.formatCurrency || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const formatKoreanAmount = window.SimuLab?.formatKoreanAmount || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const showToast = window.SimuLab?.showToast || ((msg) => alert(msg));

  // DOM 엘리먼트 수집
  const inputBasePay = document.getElementById('input-base-pay');
  const badgeBasePay = document.getElementById('badge-base-pay');
  const inputEarlyYears = document.getElementById('input-early-years');
  const inputDelayYears = document.getElementById('input-delay-years');
  const inputLifespan = document.getElementById('input-lifespan');

  // 결과 디스플레이
  const statBepAge = document.getElementById('stat-bep-age');
  const statBepDesc = document.getElementById('stat-bep-desc');
  const statEarlyMonthly = document.getElementById('stat-early-monthly');
  const statNormalMonthly = document.getElementById('stat-normal-monthly');
  const statDelayMonthly = document.getElementById('stat-delay-monthly');

  const statCumEarly = document.getElementById('stat-cum-early');
  const statCumNormal = document.getElementById('stat-cum-normal');
  const statCumDelay = document.getElementById('stat-cum-delay');
  const statWinnerBadge = document.getElementById('stat-winner-badge');

  // 나이대별 비교 테이블
  const tableBody = document.getElementById('age-breakdown-tbody');

  function updateKoreanBadges() {
    if (badgeBasePay) {
      badgeBasePay.textContent = formatKoreanAmount(Number(inputBasePay.value) || 0);
    }
  }

  function runCalculation() {
    updateKoreanBadges();

    const params = {
      normalMonthlyPay: Number(inputBasePay.value) || 0,
      earlyYears: Number(inputEarlyYears.value) || 5,
      delayYears: Number(inputDelayYears.value) || 5,
      expectedLifespan: Number(inputLifespan.value) || 85
    };

    const res = window.PensionLogic.calculate(params);

    // 1. 손익분기점(BEP) 하이라이트
    if (statBepAge) {
      statBepAge.textContent = `만 ${res.exactBEPAgeYear}세 ${res.exactBEPAgeMonth}개월`;
    }
    if (statBepDesc) {
      statBepDesc.textContent = `만 ${res.exactBEPAgeYear}세 이전까지는 먼저 받는 조기수령이 유리하지만, 그 이후로 장수하시면 65세 정상수령의 누적액이 더 커집니다!`;
    }

    // 2. 월 수령액 비교
    if (statEarlyMonthly) statEarlyMonthly.textContent = `${formatCurrency(res.earlyMonthly)} (${res.earlyAge}세 개시, -${res.earlyReductionRate}%)`;
    if (statNormalMonthly) statNormalMonthly.textContent = `${formatCurrency(res.normalMonthly)} (65세 정상개시)`;
    if (statDelayMonthly) statDelayMonthly.textContent = `${formatCurrency(res.delayMonthly)} (${res.delayAge}세 개시, +${res.delayIncreaseRate}%)`;

    // 3. 기대수명 시점 총 누적액
    if (statCumEarly) statCumEarly.textContent = `${formatCurrency(res.totalCumEarlyAtLifespan)} (${formatKoreanAmount(res.totalCumEarlyAtLifespan)})`;
    if (statCumNormal) statCumNormal.textContent = `${formatCurrency(res.totalCumNormalAtLifespan)} (${formatKoreanAmount(res.totalCumNormalAtLifespan)})`;
    if (statCumDelay) statCumDelay.textContent = `${formatCurrency(res.totalCumDelayAtLifespan)} (${formatKoreanAmount(res.totalCumDelayAtLifespan)})`;

    // 승자 배지 판정
    if (statWinnerBadge) {
      if (res.totalCumDelayAtLifespan > res.totalCumNormalAtLifespan && res.totalCumDelayAtLifespan > res.totalCumEarlyAtLifespan) {
        statWinnerBadge.textContent = `🏆 ${res.expectedLifespan}세 기준 최다 수령: [연기연금] (${formatKoreanAmount(res.totalCumDelayAtLifespan)})`;
        statWinnerBadge.style.color = '#7c3aed';
      } else if (res.totalCumNormalAtLifespan > res.totalCumEarlyAtLifespan) {
        statWinnerBadge.textContent = `🏆 ${res.expectedLifespan}세 기준 최다 수령: [정상수령] (${formatKoreanAmount(res.totalCumNormalAtLifespan)})`;
        statWinnerBadge.style.color = '#16a34a';
      } else {
        statWinnerBadge.textContent = `🏆 ${res.expectedLifespan}세 기준 최다 수령: [조기수령] (${formatKoreanAmount(res.totalCumEarlyAtLifespan)})`;
        statWinnerBadge.style.color = '#2563eb';
      }
    }

    // 4. 나이대별 누적 비교 테이블 렌더링 (65, 70, 75, 80, 85, 90, 95세)
    if (tableBody) {
      tableBody.innerHTML = '';
      const milestoneAges = [65, 70, 75, 77, 80, 85, 90];
      milestoneAges.forEach((age) => {
        const rowData = res.ageBreakdown.find((r) => r.age === age);
        if (!rowData) return;

        const tr = document.createElement('tr');
        const isBedTest = age >= res.exactBEPAgeYear && age <= res.exactBEPAgeYear + 1;
        if (isBedTest) {
          tr.style.background = 'rgba(37, 99, 235, 0.08)';
          tr.style.fontWeight = '800';
        }

        tr.innerHTML = `
          <td style="padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--border-color);">${age}세</td>
          <td style="padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--border-color); color: #2563eb;">${formatCurrency(rowData.cumEarly, true)}</td>
          <td style="padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--border-color); color: #16a34a;">${formatCurrency(rowData.cumNormal, true)}</td>
          <td style="padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--border-color); color: #7c3aed;">${formatCurrency(rowData.cumDelay, true)}</td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  // 퀵 칩 버튼 (+20만, +50만, +100만)
  document.querySelectorAll('.quick-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const addVal = Number(btn.getAttribute('data-add')) || 0;
      const setVal = btn.getAttribute('data-set');
      if (setVal !== null && setVal !== undefined) {
        inputBasePay.value = Number(setVal);
      } else if (addVal > 0) {
        inputBasePay.value = (Number(inputBasePay.value) || 0) + addVal;
      }
      runCalculation();
    });
  });

  // 조기수령 연수 버튼
  document.querySelectorAll('.early-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.early-chip-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      inputEarlyYears.value = btn.getAttribute('data-years');
      runCalculation();
    });
  });

  // 기대수명 버튼
  document.querySelectorAll('.lifespan-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lifespan-chip-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      inputLifespan.value = btn.getAttribute('data-age');
      runCalculation();
    });
  });

  [inputBasePay, inputEarlyYears, inputDelayYears, inputLifespan].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  // 초기 실행
  runCalculation();
});
