/**
 * ==========================================================================
 * SimuLab Analytics Hub - 음주 후 알코올 분해 시간(위드마크) 계산기 UI 컨트롤러
 * 파일 경로: tools/alcohol-widmark-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 설명]
 * - 마신 술의 종류와 양, 체중, 음주 종료 시각을 입력받아 경찰청 위드마크 공식으로
 *   시간대별 혈중알코올농도 감쇄 차트와 안전 운전 가능 시각을 도출합니다.
 * - 프리미엄 인풋 카드와 원터치 칩 버튼 연동으로 조작 편의성을 극대화합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const WidmarkCalc = SimuLab.AlcoholWidmark || {};

  let currentInputs = { ...WidmarkCalc.DEFAULT_WIDMARK_INPUTS };
  let bacChartInstance = null;

  function getEl(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    const el = getEl(id);
    if (el) el.textContent = text;
  }

  function readInputsFromUI() {
    const weight = Number(getEl('weight-input')?.value) || 70;
    const soju = Number(getEl('soju-input')?.value) || 0;
    const beer = Number(getEl('beer-input')?.value) || 0;
    const wine = Number(getEl('wine-input')?.value) || 0;
    const whiskey = Number(getEl('whiskey-input')?.value) || 0;

    // 배지 실시간 동기화
    setText('badge-weight', `${weight} kg`);
    setText('badge-soju', `${soju}병`);
    setText('badge-beer', `${beer}캔`);
    setText('badge-wine', `${wine}잔`);
    setText('badge-whiskey', `${whiskey}잔`);

    return {
      gender: getEl('gender-select')?.value || 'male',
      weightKg: weight,
      finishHour: Number(getEl('finish-hour-select')?.value) || 23,
      finishMinute: Number(getEl('finish-minute-select')?.value) || 0,
      sojuBottles: soju,
      beerGlasses: beer,
      wineGlasses: wine,
      whiskeyShots: whiskey,
      metabolicRate: 0.015,
    };
  }

  function syncInputsToUI(inputs) {
    if (getEl('gender-select')) getEl('gender-select').value = inputs.gender;
    if (getEl('weight-input')) getEl('weight-input').value = inputs.weightKg;
    if (getEl('weight-slider')) getEl('weight-slider').value = inputs.weightKg;
    if (getEl('finish-hour-select')) getEl('finish-hour-select').value = inputs.finishHour;
    if (getEl('finish-minute-select')) getEl('finish-minute-select').value = inputs.finishMinute;

    if (getEl('soju-input')) getEl('soju-input').value = inputs.sojuBottles;
    if (getEl('beer-input')) getEl('beer-input').value = inputs.beerGlasses;
    if (getEl('wine-input')) getEl('wine-input').value = inputs.wineGlasses;
    if (getEl('whiskey-input')) getEl('whiskey-input').value = inputs.whiskeyShots;

    setText('badge-weight', `${inputs.weightKg} kg`);
    setText('badge-soju', `${inputs.sojuBottles}병`);
    setText('badge-beer', `${inputs.beerGlasses}캔`);
    setText('badge-wine', `${inputs.wineGlasses}잔`);
    setText('badge-whiskey', `${inputs.whiskeyShots}잔`);

    if (SimuLab.initAllSlidersProgress) SimuLab.initAllSlidersProgress();
  }

  /**
   * 1. BAC 시간대별 감소 차트 렌더링
   */
  function renderBacChart(timeline) {
    const canvas = getEl('bac-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = timeline.map((d) => d.timeLabel);
    const bacValues = timeline.map((d) => d.bac);

    if (bacChartInstance) {
      bacChartInstance.destroy();
    }

    bacChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '예상 혈중알코올농도 (%)',
            data: bacValues,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.2,
          },
          {
            label: '면허정지 기준선 (0.03%)',
            data: labels.map(() => 0.03),
            borderColor: '#f59e0b',
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Pretendard, sans-serif', size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 8, font: { size: 10 } },
          },
          y: {
            suggestedMin: 0,
            ticks: {
              callback: (val) => `${val.toFixed(3)}%`,
            },
          },
        },
      },
    });
  }

  /**
   * 2. 메인 시뮬레이션 실행 및 결과 반영
   */
  function runSimulation() {
    currentInputs = readInputsFromUI();
    const result = WidmarkCalc.calculateWidmark(currentInputs);
    const s = result.summary;

    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      if (s.peakBac >= 0.03) {
        verdictText.innerHTML = `
          <strong>경고! 최고 혈중알코올농도 ${s.peakBac}% (${s.penaltyLevel.split('+')[0].trim()})</strong><br/>
          음주 종료 후 알코올이 완전히 흡수되면 최고 <strong>${s.peakBac}%</strong>에 도달합니다.<br/>
          면허정지(0.03%) 미만 안전 시각은 <strong>[${s.safeDriveTimeText}]</strong>이며, 완전 분해는 <strong>[${s.fullZeroTimeText}]</strong>입니다. 다음날 아침 출근길 숙취 운전에 각별히 유의하세요!
        `;
        if (verdictBanner) verdictBanner.style.borderColor = '#ef4444';
      } else {
        verdictText.innerHTML = `
          <strong>안전: 최고 혈중알코올농도 ${s.peakBac}% (단속 기준 0.03% 미만)</strong><br/>
          섭취한 알코올량이 적어 도로교통법상 면허정지 기준(0.03%) 미만으로 추정됩니다. 다만 개인의 컨디션에 따라 반응 속도가 저하될 수 있으므로 음주 직후 운전은 금물입니다.
        `;
        if (verdictBanner) verdictBanner.style.borderColor = '#10b981';
      }
    }

    // 요약 카드 4종
    setText('card-peak-bac', `${s.peakBac}%`);
    setText('card-safe-drive-time', s.safeDriveTimeText);
    setText('card-total-hours', `${s.hoursToFullZero}시간`);
    setText('card-penalty-level', s.peakBac >= 0.08 ? '면허 취소' : s.peakBac >= 0.03 ? '면허 정지' : '단속 미만');

    // 세부 배지
    setText('stat-alcohol-grams', `${s.totalAlcoholGrams}g`);
    setText('stat-finish-time', s.fullZeroTimeText);
    setText('stat-metabolic-rate', `시간당 0.015%`);
    setText('stat-risk-badge', s.peakBac >= 0.08 ? '위험 (면허취소)' : s.peakBac >= 0.03 ? '주의 (면허정지)' : '안전');

    renderBacChart(result.timeline);

    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('alcohol-widmark-calc', currentInputs);
    }
  }

  /**
   * 3. 이벤트 바인딩
   */
  function bindEvents() {
    const wInput = getEl('weight-input');
    const wSlider = getEl('weight-slider');
    if (wInput && wSlider) {
      wInput.addEventListener('input', () => {
        wSlider.value = wInput.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(wSlider);
        runSimulation();
      });
      wSlider.addEventListener('input', () => {
        wInput.value = wSlider.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(wSlider);
        runSimulation();
      });
    }

    ['gender-select', 'finish-hour-select', 'finish-minute-select', 'soju-input', 'beer-input', 'wine-input', 'whiskey-input'].forEach((id) => {
      const el = getEl(id);
      if (el) el.addEventListener('input', runSimulation);
    });

    // 퀵 프리셋 버튼 (소주 1병, 소주 2병, 맥주 2캔, 소맥)
    document.querySelectorAll('[data-drink-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-drink-preset');
        if (type === 'soju1') {
          if (getEl('soju-input')) getEl('soju-input').value = 1;
          if (getEl('beer-input')) getEl('beer-input').value = 0;
        } else if (type === 'soju2') {
          if (getEl('soju-input')) getEl('soju-input').value = 2;
          if (getEl('beer-input')) getEl('beer-input').value = 0;
        } else if (type === 'beer2') {
          if (getEl('soju-input')) getEl('soju-input').value = 0;
          if (getEl('beer-input')) getEl('beer-input').value = 2;
        } else if (type === 'somaek') {
          if (getEl('soju-input')) getEl('soju-input').value = 0.5;
          if (getEl('beer-input')) getEl('beer-input').value = 2;
        }
        runSimulation();
      });
    });

    // 퀵 칩 버튼 원터치 조절 이벤트 (+1kg, +반병, 2병 등)
    const chipBtns = document.querySelectorAll('.chip-btn[data-target]');
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
        inputEl.value = Math.max(0, cur);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    const shareBtn = getEl('share-btn');
    if (shareBtn && SimuLab.shareSimulationUrl) {
      shareBtn.addEventListener('click', () => {
        SimuLab.shareSimulationUrl(readInputsFromUI());
      });
    }
  }

  function init() {
    if (SimuLab.initCommonUI) {
      SimuLab.initCommonUI('alcohol-widmark-calc');
    }

    let initialValues = { ...WidmarkCalc.DEFAULT_WIDMARK_INPUTS };
    if (SimuLab.parseUrlParams) {
      initialValues = SimuLab.parseUrlParams(initialValues);
    } else if (SimuLab.loadToolState) {
      const saved = SimuLab.loadToolState('alcohol-widmark-calc');
      if (saved && saved.currentInputs) initialValues = { ...initialValues, ...saved.currentInputs };
    }

    syncInputsToUI(initialValues);
    bindEvents();
    runSimulation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
