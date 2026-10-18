/**
 * ==========================================================================
 * SimuLab Analytics Hub - 카페인 반감기 & 꿀잠 계산기 UI 컨트롤러
 * 파일 경로: tools/caffeine-sleep-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 구조 및 Canvas 2D 곡선 렌더링 설명]
 * 1) 섭취한 음료 프리셋(아메리카노, 샷 추가, 콜드브루 등)과 섭취 시각,
 *    목표 취침 시각을 입력받아 logic.js의 calculateCaffeineSleep()를 호출합니다.
 * 2) HTML5 Canvas 2D API를 활용해 24시간 동안 카페인이 5시간 반감기를 거쳐
 *    지수 감쇠(Exponential Decay)하는 곡선과 50mg 수면 안전선, 취침 포인트를 시각화합니다.
 * 3) 원터치 퀵 칩 버튼과 실시간 배지 연동으로 터치 인터랙션을 극대화합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 1. 필요한 DOM 요소 캐싱
  const drinkChipItems = document.querySelectorAll('.drink-chip-item');
  const inputDrinkCount = document.getElementById('input-drink-count');
  const inputIntakeTime = document.getElementById('input-intake-time');
  const inputBedTime = document.getElementById('input-bed-time');

  const badgeDrinkCount = document.getElementById('badge-drink-count');
  const badgeIntakeTime = document.getElementById('badge-intake-time');
  const badgeBedTime = document.getElementById('badge-bed-time');

  const btnCalculate = document.getElementById('btn-calculate');
  const btnReset = document.getElementById('btn-reset');

  // 배너 및 KPI DOM
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictText = document.getElementById('verdict-text');
  const kpiTotalMg = document.getElementById('kpi-total-mg');
  const kpiBedMg = document.getElementById('kpi-bed-mg');
  const kpiBedStatus = document.getElementById('kpi-bed-status');
  const kpiSleepGrade = document.getElementById('kpi-sleep-grade');
  const kpiGoldenTime = document.getElementById('kpi-golden-time');

  const chartCanvas = document.getElementById('caffeine-chart-canvas');
  const verdictBox = document.getElementById('caffeine-verdict-box');

  // 엔진 참조
  const engine = global.SimuLab && global.SimuLab.CaffeineSleep;
  if (!engine) {
    console.error('[CaffeineSleep] 엔진 모듈(logic.js)이 먼저 로드되지 않았습니다.');
    return;
  }

  let selectedDrinkType = 'americano';

  /**
   * 2. 사용자 입력값 수집 및 배지 갱신
   */
  function collectInputs() {
    const intakeParts = (inputIntakeTime ? inputIntakeTime.value : '14:00').split(':');
    const bedParts = (inputBedTime ? inputBedTime.value : '23:00').split(':');

    const intakeHour = parseInt(intakeParts[0], 10) || 14;
    const intakeMinute = parseInt(intakeParts[1], 10) || 0;

    const bedHour = parseInt(bedParts[0], 10) || 23;
    const bedMinute = parseInt(bedParts[1], 10) || 0;

    const count = Math.max(1, parseInt(inputDrinkCount ? inputDrinkCount.value : '1', 10) || 1);

    // 배지 실시간 업데이트
    if (badgeDrinkCount) badgeDrinkCount.textContent = `${count}잔`;
    if (badgeIntakeTime) badgeIntakeTime.textContent = `${inputIntakeTime.value} 마심`;
    if (badgeBedTime) badgeBedTime.textContent = `${inputBedTime.value} 취침`;

    return {
      drinks: [
        {
          type: selectedDrinkType,
          count,
          intakeHour,
          intakeMinute,
        },
      ],
      targetBedHour: bedHour,
      targetBedMinute: bedMinute,
      halfLifeHours: 5.0,
      sleepThresholdMg: 50.0,
    };
  }

  /**
   * 3. Canvas 2D 카페인 지수 감쇠 곡선 렌더링
   */
  function drawCaffeineCurveChart(canvas, result) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // 반응형 크기 계산
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width || 600;
    const cssHeight = rect.height || 250;

    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padLeft = 45;
    const padRight = 20;
    const padTop = 25;
    const padBottom = 35;

    const plotW = cssWidth - padLeft - padRight;
    const plotH = cssHeight - padTop - padBottom;

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const timeline = result.timeline;
    if (!timeline || timeline.length < 2) return;

    const maxMg = Math.max(result.summary.totalIntakeMg * 1.15, 120);

    // X, Y 좌표 변환 함수
    const getX = (idx) => padLeft + (idx / (timeline.length - 1)) * plotW;
    const getY = (mg) => padTop + plotH - (Math.max(0, mg) / maxMg) * plotH;

    // 1) 그리드 라인 & Y축 눈금
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Pretendard Variable", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ySteps = [0, 50, Math.round(maxMg / 2), Math.round(maxMg)];
    ySteps.forEach((val) => {
      const y = getY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();
      ctx.fillText(`${val}mg`, padLeft - 6, y);
    });

    // 2) 50mg 수면 방해 한계선 (빨간 점선)
    const threshY = getY(50);
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, threshY);
    ctx.lineTo(padLeft + plotW, threshY);
    ctx.stroke();
    ctx.restore();

    // 3) 카페인 지수 감쇠 곡선 채우기 & 선 그리기
    ctx.beginPath();
    timeline.forEach((pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.remainingMg);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 곡선 아래 그라데이션 영역 채우기
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // 4) X축 레이블 (시간대)
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Pretendard Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const stepInterval = Math.max(1, Math.floor(timeline.length / 6));
    timeline.forEach((pt, idx) => {
      if (idx % stepInterval === 0 || idx === timeline.length - 1) {
        const x = getX(idx);
        ctx.fillText(pt.timeStr, x, padTop + plotH + 8);
      }
    });

    // 5) 목표 취침 시점 표시 (보라색 수직선 & 도트)
    timeline.forEach((pt, idx) => {
      if (pt.isBedTime) {
        const x = getX(idx);
        const y = getY(pt.remainingMg);

        // 수직 점선
        ctx.save();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + plotH);
        ctx.stroke();
        ctx.restore();

        // 포인트 원
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 텍스트 배지
        ctx.fillStyle = '#8b5cf6';
        ctx.font = 'bold 11px "Pretendard Variable", sans-serif';
        ctx.fillText(`취침: ${pt.remainingMg}mg`, x, Math.max(padTop + 2, y - 20));
      }
    });
  }

  /**
   * 4. 메인 계산 및 화면 렌더링
   */
  function runCalculation() {
    const inputs = collectInputs();
    const result = engine.calculateCaffeineSleep(inputs);
    const { summary } = result;

    // 1) Verdict 배너 갱신
    if (verdictText) {
      verdictText.innerHTML = `
        <strong>[분석 결과]</strong> 목표 취침 시각 기준 체내 잔여 카페인은 <strong>${summary.bedRemainingMg} mg</strong>입니다.
        ${summary.bedRemainingMg <= 50
          ? '수면 방해 한계선(50mg) 이하로 깊은 서파 수면(REM)에 안심하고 드실 수 있습니다.'
          : `수면 방해 한계선(50mg)을 초과하므로 <strong>${summary.safeBedTimeStr} 이후</strong>에 주무시는 것이 숙면에 안전합니다.`}
      `;
    }

    // 2) KPI 스탯 갱신
    if (kpiTotalMg) kpiTotalMg.textContent = `${summary.totalIntakeMg} mg`;
    if (kpiBedMg) kpiBedMg.textContent = `${summary.bedRemainingMg} mg`;

    if (kpiBedStatus) {
      if (summary.bedRemainingMg <= 50) {
        kpiBedStatus.textContent = '안전 기준(50mg) 통과';
        kpiBedStatus.style.color = '#10b981';
      } else {
        kpiBedStatus.textContent = `기준 초과 (+${summary.bedRemainingMg - 50}mg)`;
        kpiBedStatus.style.color = '#ef4444';
      }
    }

    if (kpiSleepGrade) {
      kpiSleepGrade.textContent = summary.sleepVerdict.split(' ')[0] + ' (' + summary.sleepGrade + ')';
      kpiSleepGrade.style.color = summary.sleepGrade === 'SAFE' ? '#10b981' : summary.sleepGrade === 'CAUTION' ? '#3b82f6' : '#ef4444';
    }

    if (kpiGoldenTime) {
      kpiGoldenTime.textContent = `${summary.safeBedTimeStr} 이후`;
    }

    // 3) 처방 박스 갱신
    if (verdictBox) {
      if (summary.sleepGrade === 'SAFE' || summary.sleepGrade === 'CAUTION') {
        verdictBox.style.background = '#f0fdf4';
        verdictBox.style.borderColor = '#bbf7d0';
        verdictBox.style.color = '#166534';
        verdictBox.innerHTML = `
          <strong>🌿 수면 안전 판정:</strong> ${summary.sleepVerdict}<br>
          취침 시 체내 카페인이 50mg 이하로 충분히 분해되어 뇌의 아데노신 피로 회복과 깊은 서파 수면을 방해받지 않습니다.
        `;
      } else {
        verdictBox.style.background = '#fef2f2';
        verdictBox.style.borderColor = '#fecaca';
        verdictBox.style.color = '#991b1b';
        verdictBox.innerHTML = `
          <strong>⚠️ 수면 방해 주의:</strong> ${summary.sleepVerdict}<br>
          뇌 속 아데노신 수용체가 카페인에 막혀 잠에 들더라도 깊은 렘 수면 비율이 떨어질 수 있습니다. 가급적 <strong>${summary.safeBedTimeStr} 이후</strong> 취침하시거나 미온수 샤워 및 따뜻한 보리차 섭취를 추천합니다.
        `;
      }
    }

    // 4) 캔버스 차트 그리기
    drawCaffeineCurveChart(chartCanvas, result);
  }

  /**
   * 5. 음료 선택 칩 인터랙션 바인딩
   */
  drinkChipItems.forEach((chip) => {
    chip.addEventListener('click', () => {
      drinkChipItems.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedDrinkType = chip.getAttribute('data-type') || 'americano';
      runCalculation();
    });
  });

  /**
   * 6. 초기화
   */
  function resetInputs() {
    selectedDrinkType = 'americano';
    drinkChipItems.forEach((c) => {
      c.classList.toggle('active', c.getAttribute('data-type') === 'americano');
    });

    if (inputDrinkCount) inputDrinkCount.value = '1';
    if (inputIntakeTime) inputIntakeTime.value = '14:00';
    if (inputBedTime) inputBedTime.value = '23:00';

    runCalculation();
  }

  // 7. 실시간 이벤트 바인딩
  const liveInputs = [inputDrinkCount, inputIntakeTime, inputBedTime];
  liveInputs.forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  // 퀵 칩 버튼 원터치 조절 이벤트 (+1잔, 2잔 등)
  const chipBtns = document.querySelectorAll('.chip-btn');
  chipBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const timeTargetId = btn.getAttribute('data-time-target');
      const addVal = btn.getAttribute('data-add');
      const setVal = btn.getAttribute('data-set');
      const timeVal = btn.getAttribute('data-time');

      if (targetId) {
        const inputEl = document.getElementById(targetId);
        if (inputEl) {
          let cur = Number(inputEl.value) || 0;
          if (setVal !== null && setVal !== undefined) {
            cur = Number(setVal);
          } else if (addVal) {
            cur += Number(addVal);
          }
          inputEl.value = Math.max(1, cur);
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else if (timeTargetId && timeVal) {
        const timeInputEl = document.getElementById(timeTargetId);
        if (timeInputEl) {
          timeInputEl.value = timeVal;
          timeInputEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  });

  if (btnCalculate) btnCalculate.addEventListener('click', runCalculation);
  if (btnReset) btnReset.addEventListener('click', resetInputs);

  window.addEventListener('resize', () => {
    const inputs = collectInputs();
    const result = engine.calculateCaffeineSleep(inputs);
    drawCaffeineCurveChart(chartCanvas, result);
  });

  // 초기 렌더링
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCalculation);
  } else {
    runCalculation();
  }
})(typeof window !== 'undefined' ? window : globalThis);
