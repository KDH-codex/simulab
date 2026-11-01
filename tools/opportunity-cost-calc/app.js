/**
 * ==========================================================================
 * SimuLab - 소비 vs 투자 기회비용 계산기 UI 컨트롤러
 * 파일 경로: tools/opportunity-cost-calc/app.js
 * --------------------------------------------------------------------------
 * - DOM 이벤트 바인딩, 프리셋 선택, 실시간 반응형 차트 및 체감형 지표 렌더링
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const formatCurrency = window.SimuLab?.formatCurrency || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const formatKoreanAmount = window.SimuLab?.formatKoreanAmount || ((v) => `${Math.round(v).toLocaleString('ko-KR')}원`);
  const showToast = window.SimuLab?.showToast || ((msg) => alert(msg));

  // DOM 엘리먼트 수집
  const inputTypeRadios = document.querySelectorAll('input[name="spend-type"]');
  const inputAmount = document.getElementById('input-amount');
  const badgeAmount = document.getElementById('badge-amount');
  const amountUnitLabel = document.getElementById('amount-unit-label');
  const inputReturn = document.getElementById('input-return');
  const inputYears = document.getElementById('input-years');
  const inputDeprec = document.getElementById('input-deprec');

  // 결과 디스플레이 엘리먼트
  const statFutureValue = document.getElementById('stat-future-value');
  const statFutureKorean = document.getElementById('stat-future-korean');
  const statResidualValue = document.getElementById('stat-residual-value');
  const statOpportunityGap = document.getElementById('stat-opportunity-gap');
  const statMultiplier = document.getElementById('stat-multiplier');
  const statRealEstate = document.getElementById('stat-real-estate');
  const statMonthlyDividend = document.getElementById('stat-monthly-dividend');
  const statChickenCount = document.getElementById('stat-chicken-count');
  const statTravelCount = document.getElementById('stat-travel-count');

  // 연도별 프로그레스 바 컨테이너
  const breakdownList = document.getElementById('breakdown-list');

  // 소비 프리셋 버튼
  const presetBtns = document.querySelectorAll('.spend-preset-btn');
  // 투자 자산 프리셋 버튼
  const assetBtns = document.querySelectorAll('.asset-preset-btn');
  // 기간 프리셋 버튼
  const periodBtns = document.querySelectorAll('.period-btn');

  let currentSpendType = 'lump'; // 'lump' or 'recurring'

  // 한글 금액 뱃지 업데이트
  function updateAmountBadge() {
    const amt = Number(inputAmount.value) || 0;
    if (badgeAmount) {
      badgeAmount.textContent = formatKoreanAmount(amt);
    }
  }

  // 메인 계산 함수
  function runCalculation() {
    updateAmountBadge();

    const params = {
      type: currentSpendType,
      amount: Number(inputAmount.value) || 0,
      annualReturn: (Number(inputReturn.value) || 8) / 100,
      years: Number(inputYears.value) || 10,
      deprecRate: (Number(inputDeprec.value) || 12) / 100
    };

    const result = window.OpportunityLogic.calculate(params);

    // 1. 투자 미래 가치
    if (statFutureValue) statFutureValue.textContent = formatCurrency(result.futureInvestValue);
    if (statFutureKorean) statFutureKorean.textContent = formatKoreanAmount(result.futureInvestValue);

    // 2. 소비 물품 잔존 가치
    if (statResidualValue) {
      if (currentSpendType === 'lump') {
        statResidualValue.textContent = `${formatCurrency(result.itemResidualValue)} (감가 잔존)`;
      } else {
        statResidualValue.textContent = '0원 (완전 소비)';
      }
    }

    // 3. 기회비용 총 격차
    if (statOpportunityGap) {
      statOpportunityGap.textContent = formatCurrency(result.opportunityCostGap);
    }

    // 4. 수익 배수
    if (statMultiplier) {
      statMultiplier.textContent = `${result.multiplier}배`;
    }

    // 5. 실물 비교 체감 지표
    const { comparisons } = result;
    if (statRealEstate) statRealEstate.textContent = comparisons.realEstateText;
    if (statMonthlyDividend) statMonthlyDividend.textContent = `평생 월 ${formatCurrency(comparisons.monthlyDividend)} 배당금`;
    if (statChickenCount) statChickenCount.textContent = `${comparisons.chickenCount.toLocaleString('ko-KR')} 마리`;
    if (statTravelCount) statTravelCount.textContent = `${comparisons.travelCount.toLocaleString('ko-KR')} 회`;

    // 6. 연도별 누적 추이 리스트 렌더링
    if (breakdownList) {
      breakdownList.innerHTML = '';
      const sampleYears = result.yearlyBreakdown.filter((item) => {
        const total = result.yearlyBreakdown.length;
        if (total <= 10) return true;
        // 10년 초과 시 5년 단위 또는 주요 지점 필터링
        return item.year === 1 || item.year % 5 === 0 || item.year === total;
      });

      const maxVal = Math.max(...sampleYears.map((s) => s.investValue), 1);

      sampleYears.forEach((item) => {
        const pct = Math.min(100, Math.round((item.investValue / maxVal) * 100));
        const row = document.createElement('div');
        row.style.marginBottom = '0.75rem';
        row.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.25rem;">
            <span><strong>${item.year}년 후</strong> (자산 격차 ${formatKoreanAmount(item.gap)})</span>
            <span style="font-weight: 700; color: var(--accent-primary);">${formatCurrency(item.investValue)}</span>
          </div>
          <div style="width: 100%; height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #1d4ed8); border-radius: 4px; transition: width 0.3s ease;"></div>
          </div>
        `;
        breakdownList.appendChild(row);
      });
    }
  }

  // 소비 유형 라디오 변경
  inputTypeRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      currentSpendType = e.target.value;
      const deprecGroup = document.getElementById('group-deprec');
      if (currentSpendType === 'recurring') {
        if (amountUnitLabel) amountUnitLabel.textContent = '원/월';
        if (deprecGroup) deprecGroup.style.display = 'none';
        if (Number(inputAmount.value) > 2000000) {
          inputAmount.value = 250000; // 월 지출 기본값으로 조정
        }
      } else {
        if (amountUnitLabel) amountUnitLabel.textContent = '원';
        if (deprecGroup) deprecGroup.style.display = 'block';
        if (Number(inputAmount.value) < 1000000) {
          inputAmount.value = 35000000;
        }
      }
      runCalculation();
    });
  });

  // 소비 프리셋 클릭 리스너
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      presetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const presetKey = btn.getAttribute('data-preset');
      const preset = window.OpportunityLogic.PRESETS[presetKey];
      if (!preset) return;

      currentSpendType = preset.type;
      const targetRadio = document.querySelector(`input[name="spend-type"][value="${preset.type}"]`);
      if (targetRadio) targetRadio.checked = true;

      const deprecGroup = document.getElementById('group-deprec');
      if (currentSpendType === 'recurring') {
        if (amountUnitLabel) amountUnitLabel.textContent = '원/월';
        if (deprecGroup) deprecGroup.style.display = 'none';
      } else {
        if (amountUnitLabel) amountUnitLabel.textContent = '원';
        if (deprecGroup) deprecGroup.style.display = 'block';
      }

      inputAmount.value = preset.amount;
      inputDeprec.value = Math.round(preset.depreciationRateYearly * 100);
      runCalculation();
    });
  });

  // 투자 자산 프리셋 클릭 리스너
  assetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      assetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const assetKey = btn.getAttribute('data-asset');
      const asset = window.OpportunityLogic.ASSETS[assetKey];
      if (asset) {
        inputReturn.value = Math.round(asset.annualReturn * 100);
        runCalculation();
      }
    });
  });

  // 기간 버튼 클릭 리스너
  periodBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      periodBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      inputYears.value = btn.getAttribute('data-years');
      runCalculation();
    });
  });

  // 퀵 칩 버튼 (+100만, +500만, +1000만 등)
  document.querySelectorAll('.quick-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const addVal = Number(btn.getAttribute('data-add')) || 0;
      const setVal = btn.getAttribute('data-set');
      if (setVal !== null && setVal !== undefined) {
        inputAmount.value = Number(setVal);
      } else if (addVal > 0) {
        inputAmount.value = (Number(inputAmount.value) || 0) + addVal;
      }
      runCalculation();
    });
  });

  // 입력 변경 리스너
  [inputAmount, inputReturn, inputYears, inputDeprec].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  // 초기화 버튼
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentSpendType = 'lump';
      const defaultRadio = document.querySelector('input[name="spend-type"][value="lump"]');
      if (defaultRadio) defaultRadio.checked = true;
      inputAmount.value = 35000000;
      inputReturn.value = 8;
      inputYears.value = 10;
      inputDeprec.value = 12;
      const deprecGroup = document.getElementById('group-deprec');
      if (deprecGroup) deprecGroup.style.display = 'block';
      if (amountUnitLabel) amountUnitLabel.textContent = '원';

      presetBtns.forEach((b) => b.classList.remove('active'));
      document.querySelector('.spend-preset-btn[data-preset="car"]')?.classList.add('active');
      assetBtns.forEach((b) => b.classList.remove('active'));
      document.querySelector('.asset-preset-btn[data-asset="sp500"]')?.classList.add('active');
      periodBtns.forEach((b) => b.classList.remove('active'));
      document.querySelector('.period-btn[data-years="10"]')?.classList.add('active');

      runCalculation();
      showToast('기본값(3,500만원 신차 vs S&P500 10년)으로 복원되었습니다.');
    });
  }

  // 초기 실행
  runCalculation();
});
