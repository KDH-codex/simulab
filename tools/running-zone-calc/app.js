/**
 * ==========================================================================
 * [도구 4] 심박수 Zone 2 및 러닝 페이스·칼로리 시뮬레이터 - UI/이벤트 컨트롤러
 * 파일 경로: tools/running-zone-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 역할 설명]
 * - 나이, 안정시 심박수(RHR), 체중, 목표 페이스 슬라이더나 칩 버튼을 조작할 때마다
 *   카르보넨(Karvonen) 공식에 따른 Zone 1~5 심박수 구간 바 차트를 60fps로 그리고,
 *   마라톤 거리별 완주 예상 시간과 소모 칼로리 표를 실시간 업데이트합니다.
 * - 로컬(file://) 환경에서 더블클릭으로 열어도 CORS 차단 없이 즉시 작동합니다.
 * ==========================================================================
 */

(function () {
  const {
    initCommonUI,
    formatNumber,
    parseUrlParams,
    shareSimulationUrl,
    saveToolState,
    loadToolState,
    exportCanvasToPng,
    exportDataToCsv,
    showToast,
    updateSliderProgress,
    initAllSlidersProgress,
    renderZoneBarChart,
    injectSeoSchema,
  } = window.SimuLab;

  const {
    DEFAULT_RUNNING_INPUTS,
    sanitizeRunningInputs,
    calculateRunningSimulation,
    formatPaceString,
  } = window.SimuLab.RunningLogic;

  const TOOL_ID = 'running-zone-calc';

  let state = {
    currentInputs: { ...DEFAULT_RUNNING_INPUTS },
    pinnedScenario: null,
    lastResult: null,
  };

  let rafPending = false;

  function bootstrap() {
    // 1) 공통 헤더, 푸터, 면책 조항, 쿠키 배너 초기화 (기본 테마: 스타일 A 클린 라이트)
    initCommonUI(TOOL_ID);

    // 2) 구글 리치 스니펫용 JSON-LD 구조화 데이터 주입
    injectSeoSchema({
      name: '심박수 Zone 2 및 러닝 페이스·칼로리 시뮬레이터 (카르보넨 공식)',
      description:
        '나이와 안정시 심박수(RHR)를 기반으로 카르보넨(Karvonen) 공식에 따른 맞춤 심박수 Zone 1~5 구간, 마라톤 완주 시간, 소모 칼로리를 계산하는 러닝 시뮬레이터',
      category: 'HealthApplication',
    });

    // 3) 이전 저장 상태 또는 URL 쿼리스트링 복원
    const savedState = loadToolState(TOOL_ID);
    if (savedState && savedState.currentInputs) {
      state.currentInputs = sanitizeRunningInputs(savedState.currentInputs);
      if (savedState.pinnedScenario) {
        state.pinnedScenario = savedState.pinnedScenario;
      }
    }
    if (window.location.search) {
      state.currentInputs = sanitizeRunningInputs(parseUrlParams(state.currentInputs));
    }

    // 4) DOM 동기화 및 이벤트 연결 후 초기 렌더링
    syncInputsToDOM(state.currentInputs);
    bindEvents();
    runSimulationAndRender();
  }

  function syncInputsToDOM(inputs) {
    const fields = ['age', 'restingHr', 'weightKg', 'paceTotalSeconds', 'distanceKm'];
    fields.forEach((key) => {
      const slider = document.getElementById(`slider-${key}`);
      const numInput = document.getElementById(`input-${key}`);
      if (slider) {
        slider.value = String(inputs[key]);
        updateSliderProgress(slider);
      }
      if (numInput) numInput.value = String(inputs[key]);
    });

    // 최대심박수 공식 선택 버튼 동기화
    const formulaBtns = document.querySelectorAll('[data-formula]');
    formulaBtns.forEach((btn) => {
      const f = Number(btn.getAttribute('data-formula'));
      btn.classList.toggle('active', f === inputs.maxHrFormula);
    });

    // 목표 거리 빠른 선택 버튼 동기화
    const distBtns = document.querySelectorAll('[data-distance]');
    distBtns.forEach((btn) => {
      const d = Number(btn.getAttribute('data-distance'));
      btn.classList.toggle('active', Math.abs(d - inputs.distanceKm) < 0.01);
    });

    initAllSlidersProgress();
  }

  function bindEvents() {
    const fields = ['age', 'restingHr', 'weightKg', 'paceTotalSeconds', 'distanceKm'];

    fields.forEach((key) => {
      const slider = document.getElementById(`slider-${key}`);
      const numInput = document.getElementById(`input-${key}`);

      const handleUpdate = (sourceEl, targetEl) => {
        if (targetEl) targetEl.value = sourceEl.value;
        if (slider) updateSliderProgress(slider);
        state.currentInputs[key] = Number(sourceEl.value);
        scheduleRender();
      };

      if (slider) {
        slider.addEventListener('input', () => handleUpdate(slider, numInput));
      }
      if (numInput) {
        numInput.addEventListener('input', () => handleUpdate(numInput, slider));
      }
    });

    // 퀵 칩 버튼 원터치 조절 이벤트 (+1세, 페이스 조절 등)
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
        inputEl.value = cur;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    // 최대심박수 공식 선택 (표준 220-나이 vs 다나카 공식 208-0.7*나이)
    const formulaBtns = document.querySelectorAll('[data-formula]');
    formulaBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentInputs.maxHrFormula = Number(btn.getAttribute('data-formula'));
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
      });
    });

    // 목표 거리 빠른 선택 버튼 (5km / 10km / Half / Full)
    const distBtns = document.querySelectorAll('[data-distance]');
    distBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = Number(btn.getAttribute('data-distance'));
        state.currentInputs.distanceKm = d;
        syncInputsToDOM(state.currentInputs);
        scheduleRender();
      });
    });

    // [현재 조건 고정 (Case A 비교)] 버튼
    const pinBtn = document.getElementById('btn-pin-scenario');
    if (pinBtn) {
      pinBtn.addEventListener('click', () => {
        if (!state.lastResult) return;

        if (state.pinnedScenario) {
          state.pinnedScenario = null;
          pinBtn.textContent = '현재 조건 고정 (Case A 비교)';
          showToast('고정된 비교 조건(Case A)이 해제되었습니다.');
        } else {
          const { inputs, summary } = state.lastResult;
          state.pinnedScenario = {
            label: `고정(Case A): RHR ${inputs.restingHr}bpm · 페이스 ${summary.paceText}`,
            zone2MinBpm: summary.zone2MinBpm,
            zone2MaxBpm: summary.zone2MaxBpm,
            totalDurationSeconds: summary.totalDurationSeconds,
            totalDurationText: summary.totalDurationText,
            totalCaloriesKcal: summary.totalCaloriesKcal,
          };
          pinBtn.textContent = '고정 조건(Case A) 해제';
          showToast('현재 심박수·페이스 조건이 Case A로 고정되었습니다.');
        }

        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        scheduleRender();
      });
    }

    // [초기화] 버튼
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.currentInputs = { ...DEFAULT_RUNNING_INPUTS };
        state.pinnedScenario = null;
        const pinBtnEl = document.getElementById('btn-pin-scenario');
        if (pinBtnEl) pinBtnEl.textContent = '현재 조건 고정 (Case A 비교)';
        syncInputsToDOM(state.currentInputs);
        saveToolState(TOOL_ID, state.currentInputs, null);
        window.history.replaceState(null, '', window.location.pathname);
        scheduleRender();
        showToast('모든 입력값이 기본값으로 초기화되었습니다.');
      });
    }

    // [URL 공유] 버튼
    const shareBtn = document.getElementById('btn-share-url');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        saveToolState(TOOL_ID, state.currentInputs, state.pinnedScenario);
        shareSimulationUrl(state.currentInputs);
      });
    }

    // [PNG 차트 저장] 버튼
    const pngBtn = document.getElementById('btn-export-png');
    if (pngBtn) {
      pngBtn.addEventListener('click', () => {
        const canvas = document.getElementById('sim-canvas');
        exportCanvasToPng(canvas, `running-zone2-age${state.currentInputs.age}-rhr${state.currentInputs.restingHr}.png`);
      });
    }

    // [CSV 다운로드] 버튼
    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        if (!state.lastResult) return;
        const headers = [
          '구간(Zone)',
          '훈련 목적',
          '여유심박수 강도(%)',
          '최소 심박수(bpm)',
          '최대 심박수(bpm)',
          '훈련 설명',
        ];
        const rows = state.lastResult.zones.map((z) => [
          z.zone,
          z.name,
          `${z.minPct}~${z.maxPct}%`,
          z.minBpm,
          z.maxBpm,
          z.desc,
        ]);
        exportDataToCsv(headers, rows, 'running-heart-rate-zones.csv');
      });
    }
  }

  function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      runSimulationAndRender();
    });
  }

  function runSimulationAndRender() {
    const result = calculateRunningSimulation(state.currentInputs);
    state.lastResult = result;
    const { inputs, summary, zones, raceTable } = result;

    // 1) 좌측 컨트롤 라벨 배지 업데이트
    setText('badge-age', `만 ${inputs.age}세`);
    setText('badge-restingHr', `${inputs.restingHr} bpm`);
    setText('badge-weightKg', `${inputs.weightKg} kg`);
    setText('badge-paceTotalSeconds', `${formatPaceString(inputs.paceTotalSeconds)} /km`);
    setText('badge-distanceKm', `${inputs.distanceKm} km`);

    // 2) 우측 상단 KPI 요약 카드 4종 업데이트
    setText('kpi-zone2', `${summary.zone2MinBpm} ~ ${summary.zone2MaxBpm} bpm`);
    setText('kpi-zone2-sub', `최대심박수 ${summary.maxHr}bpm · 여유심박수 ${summary.hrr}bpm`);

    setText('kpi-duration', summary.totalDurationText);
    setText('kpi-duration-sub', `${inputs.distanceKm}km 완주 시간 (시속 ${summary.speedKmh}km/h)`);

    setText('kpi-calories', `${formatNumber(summary.totalCaloriesKcal)} kcal`);
    setText('kpi-calories-sub', `체중 ${inputs.weightKg}kg × ${inputs.distanceKm}km 기준`);

    setText('kpi-fatburn', `약 ${formatNumber(summary.estimatedFatBurnGrams)} g`);
    setText('kpi-fatburn-sub', 'Zone 2 지방 대사율(68%) 적용 추정치');

    const verdictEl = document.getElementById('verdict-text');
    if (verdictEl) {
      verdictEl.innerHTML = `
        만 <strong>${inputs.age}세</strong>(안정시 심박수 <strong>${inputs.restingHr}bpm</strong>) 러너님의 진짜 지방 연소 <strong>Zone 2 심박수는 <span class="verdict-success">${summary.zone2MinBpm} ~ ${summary.zone2MaxBpm} bpm</span></strong>이며, 현재 페이스(${summary.paceText})로 <strong>${inputs.distanceKm}km</strong>를 달리면 <span class="verdict-highlight">${summary.totalDurationText}</span> 만에 완주하고 순수 체지방 약 <span class="verdict-success">${formatNumber(
        summary.estimatedFatBurnGrams
      )}g</span>을 태웁니다!
      `;
    }

    // 3) 고정 시나리오(Case A) 비교 배너
    const pinBanner = document.getElementById('pinned-comparison-banner');
    if (pinBanner) {
      if (state.pinnedScenario) {
        const timeDiffSec = summary.totalDurationSeconds - state.pinnedScenario.totalDurationSeconds;
        const absMin = Math.floor(Math.abs(timeDiffSec) / 60);
        const absSec = Math.round(Math.abs(timeDiffSec) % 60);
        const timeDiffStr =
          timeDiffSec === 0
            ? '동일'
            : timeDiffSec < 0
            ? `-${absMin}분 ${absSec}초 단축`
            : `+${absMin}분 ${absSec}초 증가`;

        pinBanner.style.display = 'block';
        pinBanner.innerHTML = `
          <strong>시나리오 A/B 비교 중:</strong>
          [${state.pinnedScenario.label}] Zone 2: <strong>${state.pinnedScenario.zone2MinBpm}~${state.pinnedScenario.zone2MaxBpm}bpm</strong>,
          완주 시간: <strong>${state.pinnedScenario.totalDurationText}</strong>
          → 현재(Case B) 시간 변화: <span class="${timeDiffSec <= 0 ? 'text-success' : 'text-warning'}" style="font-weight:700;">${timeDiffStr}</span>
        `;
      } else {
        pinBanner.style.display = 'none';
      }
    }

    // 4) Canvas 심박수 구간(Zone 1~5) 수평 바 차트 렌더링
    const canvas = document.getElementById('sim-canvas');
    renderZoneBarChart(canvas, zones);

    // 5) 거리별 완주 예상 시간 및 소모 칼로리 테이블 렌더링
    const tbody = document.getElementById('race-table-body');
    if (tbody) {
      tbody.innerHTML = raceTable
        .map((row) => {
          const isCurrentDist = Math.abs(row.distanceKm - inputs.distanceKm) < 0.05;
          return `
            <tr style="${isCurrentDist ? 'background-color: var(--accent-soft); font-weight: 700;' : ''}">
              <td><strong>${row.label}</strong></td>
              <td>${summary.paceText}</td>
              <td class="text-accent"><strong>${row.durationText}</strong></td>
              <td>${formatNumber(row.caloriesKcal)} kcal</td>
              <td class="text-success">약 ${formatNumber(row.fatBurnGrams)} g</td>
            </tr>
          `;
        })
        .join('');
    }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
