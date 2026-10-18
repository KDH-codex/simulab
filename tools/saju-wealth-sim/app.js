/**
 * ==========================================================================
 * SimuLab Analytics Hub - 사주 오행 & 재물운·투자 성향 분석기 UI 컨트롤러
 * 파일 경로: tools/saju-wealth-sim/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 설명]
 * - 사용자의 생년월일시를 받아 사주 8글자와 오행 레이더 차트를 그리고,
 *   명리학적 기운에 최적화된 자산 배분 전략을 제시합니다.
 * - 프리미엄 핀테크 모던 인풋 카드와 실시간 배지, 빠른 연대 칩 버튼을 지원합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const SajuCalc = SimuLab.SajuWealth || {};

  let currentInputs = { ...SajuCalc.DEFAULT_SAJU_INPUTS };
  let radarChartInstance = null;

  function getEl(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    const el = getEl(id);
    if (el) el.textContent = text;
  }

  /**
   * 인풋 배지 실시간 동기화
   */
  function updateInputBadges(inputs) {
    const yearBadge = getEl('birth-year-badge');
    if (yearBadge) yearBadge.textContent = `${inputs.birthYear}년생`;

    const monthBadge = getEl('birth-month-badge');
    if (monthBadge) monthBadge.textContent = `${inputs.birthMonth}월`;

    const dayBadge = getEl('birth-day-badge');
    if (dayBadge) dayBadge.textContent = `${inputs.birthDay}일`;
  }

  function readInputsFromUI() {
    return {
      birthYear: Number(getEl('birth-year-input')?.value) || 1992,
      birthMonth: Number(getEl('birth-month-input')?.value) || 7,
      birthDay: Number(getEl('birth-day-input')?.value) || 15,
      birthHour: Number(getEl('birth-hour-select')?.value) || 12,
      gender: getEl('gender-select')?.value || 'male',
    };
  }

  function syncInputsToUI(inputs) {
    if (getEl('birth-year-input')) getEl('birth-year-input').value = inputs.birthYear;
    if (getEl('birth-month-input')) getEl('birth-month-input').value = inputs.birthMonth;
    if (getEl('birth-day-input')) getEl('birth-day-input').value = inputs.birthDay;
    if (getEl('birth-hour-select')) getEl('birth-hour-select').value = inputs.birthHour;
    if (getEl('gender-select')) getEl('gender-select').value = inputs.gender;
    updateInputBadges(inputs);
  }

  /**
   * 1. 오행 레이더 차트 렌더링
   */
  function renderRadarChart(scores) {
    const canvas = getEl('saju-radar-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (radarChartInstance) {
      radarChartInstance.destroy();
    }

    radarChartInstance = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['목 (木·성장)', '화 (火·열정)', '토 (土·안정)', '금 (金·결실)', '수 (水·유동성)'],
        datasets: [
          {
            label: '나의 오행 분포 점수 (%)',
            data: [scores.wood, scores.fire, scores.earth, scores.metal, scores.water],
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            borderColor: '#2563eb',
            borderWidth: 2,
            pointBackgroundColor: '#2563eb',
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: '#e2e8f0' },
            grid: { color: '#f1f5f9' },
            suggestedMin: 0,
            suggestedMax: 50,
            ticks: { stepSize: 12.5, font: { size: 10 } },
            pointLabels: { font: { family: 'Pretendard, sans-serif', size: 12, weight: 600 } },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  /**
   * 2. 사주 8글자 만세력 테이블 렌더링
   */
  function renderPillarsTable(pillars) {
    const p = pillars;
    setText('pillar-hour-stem', `${p.hourPillar.stem.name} (${p.hourPillar.stem.hanja})`);
    setText('pillar-hour-branch', `${p.hourPillar.branch.name} (${p.hourPillar.branch.hanja})`);
    setText('pillar-day-stem', `${p.dayPillar.stem.name} (${p.dayPillar.stem.hanja})`);
    setText('pillar-day-branch', `${p.dayPillar.branch.name} (${p.dayPillar.branch.hanja})`);
    setText('pillar-month-stem', `${p.monthPillar.stem.name} (${p.monthPillar.stem.hanja})`);
    setText('pillar-month-branch', `${p.monthPillar.branch.name} (${p.monthPillar.branch.hanja})`);
    setText('pillar-year-stem', `${p.yearPillar.stem.name} (${p.yearPillar.stem.hanja})`);
    setText('pillar-year-branch', `${p.yearPillar.branch.name} (${p.yearPillar.branch.hanja})`);
  }

  /**
   * 3. 추천 자산 리스트 렌더링
   */
  function renderRecommendedAssets(assets) {
    const container = getEl('recommended-assets-list');
    if (!container) return;

    container.innerHTML = assets
      .map(
        (asset) => `
        <div style="padding: 0.6rem 0.9rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 6px; display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--primary-color); font-weight: 700;">✓</span>
          <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${asset}</span>
        </div>
      `
      )
      .join('');
  }

  /**
   * 4. 메인 분석 실행 및 결과 반영
   */
  function runSimulation() {
    currentInputs = readInputsFromUI();
    updateInputBadges(currentInputs);

    const result = SajuCalc.calculateSajuWealth(currentInputs);
    const s = result.summary;
    const dom = result.dominant;
    const lack = result.lacking;

    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      verdictText.innerHTML = `
        당신의 타고난 본원(일간)은 <strong>${s.dayMasterLabel}</strong>이며, 사주에 가장 강하게 깃든 기운은 <strong>${s.dominantElement} (${s.dominantScore}%)</strong>입니다.<br/>
        명리학적 기운에 따른 추천 투자 성향은 <strong>[${dom.investStyle}]</strong>이며, ${dom.wealthTrait}을 발휘할 때 자산이 가장 크게 번창합니다.
      `;
      if (verdictBanner) verdictBanner.style.borderColor = '#2563eb';
    }

    // 요약 카드 4종
    setText('card-day-master', result.pillars.dayMaster.hanja + ' ' + result.pillars.dayMaster.name);
    setText('card-dominant-elem', `${dom.name} (${s.dominantScore}%)`);
    setText('card-lacking-elem', `${lack.name} (${result.elementScores[result.lacking.traits ? Object.keys(result.elementScores).find(k => result.elementScores[k] === 0) || '0' : '0']}%)`);
    setText('card-invest-style', dom.investStyle);

    // 세부 배지
    setText('stat-eight-chars', s.fourPillarsText);
    setText('stat-wealth-trait', dom.traits);
    setText('stat-lucky-color', lack.colorName);
    setText('stat-lucky-number', lack.luckyNumbers.join(', '));

    renderRadarChart(result.elementScores);
    renderPillarsTable(result.pillars);
    renderRecommendedAssets(dom.recommendedAssets);

    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('saju-wealth-sim', currentInputs);
    }
  }

  /**
   * 5. 이벤트 리스너 바인딩
   */
  function bindEvents() {
    ['birth-year-input', 'birth-month-input', 'birth-day-input'].forEach((id) => {
      const el = getEl(id);
      if (el) {
        el.addEventListener('input', runSimulation);
        el.addEventListener('change', runSimulation);
      }
    });

    ['birth-hour-select', 'gender-select'].forEach((id) => {
      const el = getEl(id);
      if (el) el.addEventListener('change', runSimulation);
    });

    // 퀵 칩 버튼 바인딩
    document.querySelectorAll('.chip-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.dataset.target;
        const val = btn.dataset.val;
        const targetInput = getEl(targetId);
        if (targetInput) {
          targetInput.value = val;
          runSimulation();
        }
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
      SimuLab.initCommonUI('saju-wealth-sim');
    }

    let initialValues = { ...SajuCalc.DEFAULT_SAJU_INPUTS };
    if (SimuLab.parseUrlParams) {
      initialValues = SimuLab.parseUrlParams(initialValues);
    } else if (SimuLab.loadToolState) {
      const saved = SimuLab.loadToolState('saju-wealth-sim');
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
