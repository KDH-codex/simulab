/**
 * ==========================================================================
 * SimuLab Analytics Hub - 다이어트 BMR·TDEE 계산기 UI 컨트롤러
 * 파일 경로: tools/diet-bmr-tdee-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 구조 및 캔버스 도넛 차트 설명]
 * 1) 사용자가 입력한 신체 스펙(성별, 나이, 키, 체중, 활동량, 목표)을 바탕으로
 *    logic.js의 calculateDietMacro()를 호출하여 계산 결과를 갱신합니다.
 * 2) 프리미엄 인풋 카드와 원터치 칩 버튼 연동으로 모바일 사용성을 극대화합니다.
 * 3) HTML5 Canvas 2D API를 활용해 탄수화물(파랑), 단백질(초록), 지방(주황)의
 *    섭취 칼로리 비율을 미려한 도넛 차트로 직접 렌더링합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 1. 필요한 DOM 요소 캐싱
  const genderRadios = document.querySelectorAll('input[name="input-gender"]');
  const inputAge = document.getElementById('input-age');
  const inputHeight = document.getElementById('input-height');
  const inputWeight = document.getElementById('input-weight');
  const selectActivity = document.getElementById('select-activity');
  const selectGoal = document.getElementById('select-goal');

  const badgeAge = document.getElementById('badge-age');
  const badgeHeight = document.getElementById('badge-height');
  const badgeWeight = document.getElementById('badge-weight');

  const btnCalculate = document.getElementById('btn-calculate');
  const btnReset = document.getElementById('btn-reset');

  // 배너 및 KPI DOM
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictText = document.getElementById('verdict-text');
  const kpiTargetCalories = document.getElementById('kpi-target-calories');
  const kpiGoalText = document.getElementById('kpi-goal-text');
  const kpiTdee = document.getElementById('kpi-tdee');
  const kpiBmr = document.getElementById('kpi-bmr');
  const kpiWeightChange = document.getElementById('kpi-weight-change');
  const kpiBmiText = document.getElementById('kpi-bmi-text');

  // 탄단지 뱃지 & 프로그레스 바 DOM
  const valCarbsG = document.getElementById('val-carbs-g');
  const valCarbsKcal = document.getElementById('val-carbs-kcal');
  const valProteinG = document.getElementById('val-protein-g');
  const valProteinKcal = document.getElementById('val-protein-kcal');
  const valFatG = document.getElementById('val-fat-g');
  const valFatKcal = document.getElementById('val-fat-kcal');

  const barCarbs = document.getElementById('bar-carbs');
  const barProtein = document.getElementById('bar-protein');
  const barFat = document.getElementById('bar-fat');
  const chartCanvas = document.getElementById('macro-chart-canvas');

  // 엔진 모듈 참조
  const engine = global.SimuLab && global.SimuLab.DietBmrTdee;
  if (!engine) {
    console.error('[DietBmrTdee] 엔진 모듈(logic.js)이 먼저 로드되지 않았습니다.');
    return;
  }

  /**
   * 2. 사용자 입력값 수집
   */
  function collectInputs() {
    let gender = 'male';
    genderRadios.forEach((r) => {
      if (r.checked) gender = r.value;
    });

    const age = Number(inputAge ? inputAge.value : 30) || 30;
    const heightCm = Number(inputHeight ? inputHeight.value : 175) || 175;
    const weightKg = Number(inputWeight ? inputWeight.value : 72) || 72;

    if (badgeAge) badgeAge.textContent = `${age}세`;
    if (badgeHeight) badgeHeight.textContent = `${heightCm} cm`;
    if (badgeWeight) badgeWeight.textContent = `${weightKg} kg`;

    return {
      gender,
      age,
      heightCm,
      weightKg,
      activityLevel: selectActivity ? selectActivity.value : 'moderate',
      goal: selectGoal ? selectGoal.value : 'cut_moderate',
    };
  }

  /**
   * 3. HTML5 Canvas 2D 탄단지 도넛 차트 그리기
   */
  function drawMacroDonutChart(canvas, macros) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.62;

    const data = [
      { name: '탄수화물', pct: macros.carbs.pct, color: '#3b82f6' },
      { name: '단백질', pct: macros.protein.pct, color: '#10b981' },
      { name: '지방', pct: macros.fat.pct, color: '#f59e0b' },
    ];

    let startAngle = -Math.PI / 2;

    data.forEach((seg) => {
      const sliceAngle = (seg.pct / 100) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = seg.color;
      ctx.fill();

      startAngle = endAngle;
    });

    // 도넛 중앙 텍스트
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px "Pretendard Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${macros.totalKcal} kcal`, centerX, centerY - 8);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px "Pretendard Variable", sans-serif';
    ctx.fillText('하루 총 에너지', centerX, centerY + 16);
  }

  /**
   * 4. 메인 계산 및 화면 렌더링
   */
  function runCalculation() {
    const inputs = collectInputs();
    const result = engine.calculateDietMacro(inputs);
    const { summary, macros } = result;

    // 1) Verdict 배너 갱신
    if (verdictText) {
      const changeDesc = summary.weeklyWeightChangeKg < 0
        ? `매주 약 ${Math.abs(summary.weeklyWeightChangeKg)}kg씩 건강하게 감량`
        : summary.weeklyWeightChangeKg > 0
          ? `매주 약 ${summary.weeklyWeightChangeKg}kg씩 근육량 증가`
          : '체중 및 체형을 안정적으로 유지';

      verdictText.innerHTML = `
        <strong>[처방 결과]</strong> 하루에 <strong>${new Intl.NumberFormat('ko-KR').format(summary.targetCalories)} kcal</strong>를 섭취하시면 <strong>${changeDesc}</strong>할 수 있습니다.
        (기초대사량: ${new Intl.NumberFormat('ko-KR').format(summary.bmr)} kcal, 유지 대사량: ${new Intl.NumberFormat('ko-KR').format(summary.tdee)} kcal)
      `;
    }

    // 2) KPI 스탯 카드 갱신
    if (kpiTargetCalories) kpiTargetCalories.textContent = `${new Intl.NumberFormat('ko-KR').format(summary.targetCalories)} kcal`;
    if (kpiGoalText) kpiGoalText.textContent = `${result.goalLabel}`;
    if (kpiTdee) kpiTdee.textContent = `${new Intl.NumberFormat('ko-KR').format(summary.tdee)} kcal`;
    if (kpiBmr) kpiBmr.textContent = `${new Intl.NumberFormat('ko-KR').format(summary.bmr)} kcal`;

    if (kpiWeightChange) {
      const prefix = summary.weeklyWeightChangeKg > 0 ? '+' : '';
      kpiWeightChange.textContent = `${prefix}${summary.weeklyWeightChangeKg} kg/주`;
      kpiWeightChange.style.color = summary.weeklyWeightChangeKg < 0 ? '#2563eb' : summary.weeklyWeightChangeKg > 0 ? '#10b981' : '#64748b';
    }
    if (kpiBmiText) {
      let bmiStatus = '정상';
      if (summary.bmi < 18.5) bmiStatus = '저체중';
      else if (summary.bmi >= 25) bmiStatus = '과체중·비만';
      kpiBmiText.textContent = `BMI: ${summary.bmi} (${bmiStatus})`;
    }

    // 3) 탄단지 뱃지 갱신
    if (valCarbsG) valCarbsG.textContent = `${macros.carbs.grams} g`;
    if (valCarbsKcal) valCarbsKcal.textContent = `${new Intl.NumberFormat('ko-KR').format(macros.carbs.kcal)} kcal (${macros.carbs.pct}%)`;

    if (valProteinG) valProteinG.textContent = `${macros.protein.grams} g`;
    if (valProteinKcal) valProteinKcal.textContent = `${new Intl.NumberFormat('ko-KR').format(macros.protein.kcal)} kcal (${macros.protein.pct}%)`;

    if (valFatG) valFatG.textContent = `${macros.fat.grams} g`;
    if (valFatKcal) valFatKcal.textContent = `${new Intl.NumberFormat('ko-KR').format(macros.fat.kcal)} kcal (${macros.fat.pct}%)`;

    // 4) 프로그레스 바 갱신
    if (barCarbs) barCarbs.style.width = `${macros.carbs.pct}%`;
    if (barProtein) barProtein.style.width = `${macros.protein.pct}%`;
    if (barFat) barFat.style.width = `${macros.fat.pct}%`;

    // 5) 캔버스 도넛 차트 렌더링
    drawMacroDonutChart(chartCanvas, macros);
  }

  /**
   * 5. 초기화
   */
  function resetInputs() {
    genderRadios.forEach((r) => {
      r.checked = r.value === 'male';
    });
    if (inputAge) inputAge.value = '30';
    if (inputHeight) inputHeight.value = '175';
    if (inputWeight) inputWeight.value = '72';
    if (selectActivity) selectActivity.value = 'moderate';
    if (selectGoal) selectGoal.value = 'cut_moderate';

    runCalculation();
  }

  // 6. 이벤트 바인딩
  const liveInputs = [inputAge, inputHeight, inputWeight, selectActivity, selectGoal];
  liveInputs.forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  genderRadios.forEach((r) => {
    r.addEventListener('change', runCalculation);
  });

  // 퀵 칩 버튼 원터치 조절 이벤트 (+1세, 175cm, 72kg 등)
  const chipBtns = document.querySelectorAll('.chip-btn');
  chipBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const addVal = btn.getAttribute('data-add');
      const setVal = btn.getAttribute('data-set');
      const inputEl = document.getElementById(targetId);
      if (!inputEl) return;

      let cur = Number(inputEl.value) || 0;
      if (setVal !== null && setVal !== undefined) {
        cur = Number(setVal);
      } else if (addVal) {
        cur += Number(addVal);
      }
      inputEl.value = cur;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  if (btnCalculate) btnCalculate.addEventListener('click', runCalculation);
  if (btnReset) btnReset.addEventListener('click', resetInputs);

  // 초기 로드 시 1회 계산
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCalculation);
  } else {
    runCalculation();
  }
})(typeof window !== 'undefined' ? window : globalThis);
