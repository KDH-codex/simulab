/**
 * ==========================================================================
 * SimuLab Analytics Hub - 내 인생의 모래시계 (Life Countdown) UI 컨트롤러
 * 파일 경로: tools/life-hourglass-sim/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 & Canvas 엽서 생성 설명]
 * 1) 5대 감성 탭 (부모님, 반려동물, 자녀, 청춘, 연인) 전환 시
 *    각 모드에 맞게 입력 폼과 테마 그라디언트, 감성 문구를 실시간 갱신합니다.
 * 2) HTML5 Canvas 2D 그래픽스를 이용하여 브라우저 상에서 인스타/카톡 스토리용
 *    1080x1080 고해상도 감성 엽서 이미지를 1초 만에 렌더링하고 다운로드합니다.
 * 3) 프리미엄 인풋 카드와 원터치 칩 버튼 연동으로 조작 편의성을 극대화합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  const SimuLab = window.SimuLab || {};
  const LifeCalc = SimuLab.LifeHourglass || {};

  let currentMode = 'parents';
  let currentInputs = { ...LifeCalc.DEFAULT_LIFE_INPUTS };
  let lastResult = null;

  function getEl(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    const el = getEl(id);
    if (el) el.textContent = text;
  }

  /**
   * UI로부터 5대 모드 전체 입력값 추출 및 배지 갱신
   */
  function readInputsFromUI() {
    const expAge = Number(getEl('expected-age-input')?.value) || 85;
    setText('badge-expected-age', `${expAge}세`);

    return {
      mode: currentMode,
      birthYear: Number(getEl('birth-year-input')?.value) || 1994,
      birthMonth: Number(getEl('birth-month-input')?.value) || 5,
      birthDay: Number(getEl('birth-day-input')?.value) || 20,
      expectedAge: expAge,
      // 부모님
      parentsAge: Number(getEl('parents-age-input')?.value) || 70,
      visitDaysPerYear: Number(getEl('visit-days-input')?.value) || 4,
      parentTalkHoursPerDay: Number(getEl('parent-talk-hours-input')?.value) || 4,
      // 반려동물
      petAge: Number(getEl('pet-age-input')?.value) || 5,
      petWalksPerWeek: Number(getEl('pet-walks-input')?.value) || 5,
      // 자녀
      childAge: Number(getEl('child-age-input')?.value) || 4,
      // 연인
      coupleAge: Number(getEl('couple-age-input')?.value) || 30,
    };
  }

  /**
   * 모드 변경 시 해당 모드의 입력 섹션만 표시
   */
  function switchMode(newMode) {
    currentMode = newMode;

    // 탭 버튼 active 클래스 갱신
    document.querySelectorAll('.emotional-tab-btn').forEach((btn) => {
      const mode = btn.getAttribute('data-mode');
      if (mode === newMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 입력 폼 섹션 토글
    const secParents = getEl('section-parents-inputs');
    const secPet = getEl('section-pet-inputs');
    const secChild = getEl('section-child-inputs');
    const secYouth = getEl('section-youth-inputs');
    const secCouple = getEl('section-couple-inputs');

    if (secParents) secParents.style.display = newMode === 'parents' ? 'block' : 'none';
    if (secPet) secPet.style.display = newMode === 'pet' ? 'block' : 'none';
    if (secChild) secChild.style.display = newMode === 'child' ? 'block' : 'none';
    if (secYouth) secYouth.style.display = newMode === 'youth' ? 'block' : 'none';
    if (secCouple) secCouple.style.display = newMode === 'couple' ? 'block' : 'none';

    runSimulation();
  }

  /**
   * 메인 연산 및 UI 시각화 갱신
   */
  function runSimulation() {
    currentInputs = readInputsFromUI();
    const result = LifeCalc.calculateLifeHourglass(currentInputs);
    lastResult = result;
    const s = result.summary;
    const theme = result.theme || LifeCalc.EMOTIONAL_THEMES[currentMode];

    // 1. 감성 비주얼 엽서 배너 스타일 및 텍스트 갱신
    const verdictBanner = getEl('verdict-banner');
    if (verdictBanner && theme) {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      verdictBanner.style.background = isDark ? theme.darkGradient : theme.gradient;
      verdictBanner.style.borderColor = theme.accentColor;
    }

    // 배지 갱신
    setText('postcard-badge-icon', theme.icon);
    setText('postcard-badge-text', theme.badge);

    // 하이라이트 문구 및 디테일 멘트 갱신
    setText('verdict-text', s.verdictHighlight);
    setText('verdict-details', s.verdictDetails);

    // 2. 모래시계 게이지 바 업데이트
    const fillBar = getEl('hourglass-fill-bar');
    if (fillBar) {
      fillBar.style.width = `${s.lifeProgressPct}%`;
      fillBar.style.background = `linear-gradient(90deg, ${theme.accentColor}, #60a5fa)`;
    }

    // 3. KPI 카드 4종 동적 갱신
    setText('card-life-pct', `${s.lifeProgressPct}%`);
    setText('card-days-left', `${s.daysLeft.toLocaleString()}일`);

    // 카드 3 & 4 (모드별 맞춤 라벨과 수치)
    const st = s.modeStats;
    if (currentMode === 'parents') {
      setText('card-label-3', '부모님과 남은 실질 시간');
      setText('card-weekends-left', `${s.parentsHoursTotal}시간`);
      setText('card-sub-3', `약 ${s.parentsDaysEquivalent}일치 대화`);

      setText('card-label-4', '함께할 식사 끼니 수');
      setText('card-parents-time', `${st.val3}`);
      setText('card-sub-4', `1년 ${currentInputs.visitDaysPerYear}일 방문 기준`);
    } else if (currentMode === 'pet') {
      setText('card-label-3', '함께할 산책 횟수');
      setText('card-weekends-left', `${st.val2}`);
      setText('card-sub-3', `${st.sub2}`);

      setText('card-label-4', '눈맞춤 교감 시간');
      setText('card-parents-time', `${st.val3}`);
      setText('card-sub-4', `${st.sub3}`);
    } else if (currentMode === 'child') {
      setText('card-label-3', '품안의 남은 주말');
      setText('card-weekends-left', `${st.val2}`);
      setText('card-sub-3', '초등학교 졸업(만 12세) 이전');

      setText('card-label-4', '안아 재울 수 있는 밤');
      setText('card-parents-time', `${st.val3}`);
      setText('card-sub-4', '동화책 읽어주며 재우는 밤');
    } else if (currentMode === 'youth') {
      setText('card-label-3', '벚꽃 볼 수 있는 봄');
      setText('card-weekends-left', `${st.val2}`);
      setText('card-sub-3', '아프지 않은 건강 수명 기준');

      setText('card-label-4', '자유 여행 주말 횟수');
      setText('card-parents-time', `${st.val3}`);
      setText('card-sub-4', '두 다리로 떠나는 여행');
    } else if (currentMode === 'couple') {
      setText('card-label-3', '함께 맞이할 아침');
      setText('card-weekends-left', `${st.val2}`);
      setText('card-sub-3', '굿모닝 인사를 나누는 날');

      setText('card-label-4', '마주할 저녁 식사');
      setText('card-parents-time', `${st.val3}`);
      setText('card-sub-4', '함께 밥 먹는 시간');
    }

    // 4. 세부 통계 배지
    setText('stat-days-lived', `${s.daysLived.toLocaleString()}일`);
    setText('stat-meals-left', `${s.mealsLeft.toLocaleString()}끼`);
    setText('stat-sleep-left', `${Math.round(s.sleepHoursLeft / 24).toLocaleString()}일치`);
    setText('stat-season-badge', s.lifeSeason);

    // 5. 우측 가이드 문구 모드별 맞춤화
    updateSideGuide(currentMode, s);

    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('life-hourglass-sim', currentInputs);
    }
  }

  /**
   * 우측 가이드 박스 모드별 문구 변경
   */
  function updateSideGuide(mode, s) {
    const titleEl = getEl('side-guide-title');
    const descEl = getEl('side-guide-desc');
    const listEl = getEl('side-guide-list');

    if (!titleEl || !descEl || !listEl) return;

    if (mode === 'parents') {
      titleEl.textContent = '부모님께 안부 전화를 드려야 하는 이유:';
      descEl.textContent = '1년에 설·추석 명절 2번 부모님을 뵙는다면, 평생 부모님과 함께할 수 있는 실질적인 시간은 단 며칠에 불과합니다.';
      listEl.innerHTML = `
        <li>연세가 드실수록 자녀의 목소리를 듣는 것만으로도 큰 위로와 생기를 얻으십니다.</li>
        <li>오늘 퇴근길, 5분만 시간을 내어 "엄마 밥 먹었어?" 안부 전화를 걸어보세요.</li>
      `;
    } else if (mode === 'pet') {
      titleEl.textContent = '반려동물의 시간은 5배 빠르게 흐릅니다:';
      descEl.textContent = '사람의 하루는 강아지·고양이에게 5일에서 일주일의 시간과 같습니다.';
      listEl.innerHTML = `
        <li>우리에겐 일상의 일부지만, 그 아이들에게 우리는 세상의 전부입니다.</li>
        <li>오늘 저녁, 핸드폰을 내려놓고 30분 동안 아이의 눈을 맞추며 산책해 주세요.</li>
      `;
    } else if (mode === 'child') {
      titleEl.textContent = '아이가 품에 안기는 마법의 12년:';
      descEl.textContent = '중학교에 입학하는 순간부터 아이는 친구와 세상으로 나아가며 부모의 손길을 떠납니다.';
      listEl.innerHTML = `
        <li>"안아줘"라고 보채는 이 시기는 다시는 돌아오지 않을 인생 최고의 황금기입니다.</li>
        <li>오늘 밤, 스마트폰 대신 아이가 좋아하는 동화책을 마음을 담아 읽어주세요.</li>
      `;
    } else if (mode === 'youth') {
      titleEl.textContent = '건강하게 떠날 수 있는 진짜 청춘의 시간:';
      descEl.textContent = '무릎이 아프지 않고 가벼운 발걸음으로 배낭을 멜 수 있는 계절은 영원하지 않습니다.';
      listEl.innerHTML = `
        <li>돈은 나중에도 벌 수 있지만, 지금 마주하는 청춘의 바다와 단풍은 이번뿐입니다.</li>
        <li>망설이던 버킷리스트 여행이 있다면 이번 주말 계획을 세워보세요.</li>
      `;
    } else if (mode === 'couple') {
      titleEl.textContent = '매일 마주하는 익숙함이 가장 큰 기적입니다:';
      descEl.textContent = '함께 아침을 맞이하고 식탁에 둘러앉아 따뜻한 밥을 먹는 평범한 일상이 곧 행복입니다.';
      listEl.innerHTML = `
        <li>당연하게 느껴지는 상대방의 배려와 존재에 오늘 "고마워"라고 속삭여 보세요.</li>
        <li>평생 남은 수만 번의 식사 중 오늘 저녁은 조금 더 서로에게 집중해 보세요.</li>
      `;
    }
  }

  /**
   * 고해상도(1080x1080) 감성 엽서 캔버스 생성 및 PNG 다운로드
   */
  function exportPostcardImage() {
    if (!lastResult) return;
    const { summary, theme } = lastResult;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. 배경 그라디언트
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // 내부 여백 카드
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.beginPath();
    ctx.roundRect(80, 80, 920, 920, 32);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // 2. 상단 뱃지
    ctx.fillStyle = theme.accentColor;
    ctx.beginPath();
    ctx.roundRect(140, 140, 260, 48, 24);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Pretendard Variable", sans-serif';
    ctx.fillText(`${theme.icon} ${theme.badge}`, 165, 172);

    // 3. 따옴표 그래픽
    ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.font = 'bold 120px Georgia, serif';
    ctx.fillText('“', 140, 300);

    // 4. 하이라이트 문구 (줄바꿈 처리)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px "Pretendard Variable", sans-serif';
    const lines = wrapText(ctx, summary.verdictHighlight, 800);
    let startY = 320;
    lines.forEach((line) => {
      ctx.fillText(line, 140, startY);
      startY += 54;
    });

    // 5. 부가 감성 디테일
    ctx.fillStyle = '#64748b';
    ctx.font = '24px "Pretendard Variable", sans-serif';
    const detailLines = wrapText(ctx, summary.verdictDetails, 800);
    startY += 10;
    detailLines.forEach((line) => {
      ctx.fillText(line, 140, startY);
      startY += 38;
    });

    // 6. 스탯 박스 3종
    const boxY = 640;
    const boxW = 250;
    const boxH = 150;
    const gap = 25;
    const st = summary.modeStats;

    const statsToDraw = [
      { label: '인생 경과율', val: `${summary.lifeProgressPct}%`, sub: '기대수명 대비' },
      { label: st.label2, val: st.val2, sub: st.sub2 },
      { label: st.label3, val: st.val3, sub: st.sub3 },
    ];

    statsToDraw.forEach((box, i) => {
      const bx = 140 + i * (boxW + gap);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '18px "Pretendard Variable", sans-serif';
      ctx.fillText(box.label, bx + 24, boxY + 42);

      ctx.fillStyle = theme.accentColor;
      ctx.font = 'bold 32px "Pretendard Variable", sans-serif';
      ctx.fillText(box.val, bx + 24, boxY + 86);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px "Pretendard Variable", sans-serif';
      ctx.fillText(box.sub, bx + 24, boxY + 120);
    });

    // 7. 하단 워터마크 브랜딩
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px "Pretendard Variable", sans-serif';
    ctx.fillText('SimuLab Hub · 내 인생의 모래시계', 140, 930);
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleDateString('ko-KR'), 940, 930);
    ctx.textAlign = 'left';

    // 8. 다운로드 트리거
    const link = document.createElement('a');
    link.download = `life-hourglass-${currentMode}-postcard.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  /**
   * 이벤트 리스너 바인딩
   */
  function bindEvents() {
    // 1. 탭 전환
    document.querySelectorAll('.emotional-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        switchMode(mode);
      });
    });

    // 2. 수명 슬라이더
    const ageInput = getEl('expected-age-input');
    const ageSlider = getEl('expected-age-slider');
    if (ageInput && ageSlider) {
      ageInput.addEventListener('input', () => {
        ageSlider.value = ageInput.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(ageSlider);
        runSimulation();
      });
      ageSlider.addEventListener('input', () => {
        ageInput.value = ageSlider.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(ageSlider);
        runSimulation();
      });
    }

    // 3. 모든 입력값 변경 감지
    const inputs = [
      'birth-year-input', 'birth-month-input', 'birth-day-input',
      'parents-age-input', 'visit-days-input', 'parent-talk-hours-input',
      'pet-age-input', 'pet-walks-input',
      'child-age-input',
      'couple-age-input',
    ];
    inputs.forEach((id) => {
      const el = getEl(id);
      if (el) {
        el.addEventListener('input', runSimulation);
        el.addEventListener('change', runSimulation);
      }
    });

    // 퀵 칩 버튼 원터치 조절 이벤트 (+1세, 프리셋 등)
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

    // 4. 감성 엽서 이미지 저장 버튼
    const savePostcardBtn = getEl('save-postcard-btn');
    if (savePostcardBtn) {
      savePostcardBtn.addEventListener('click', exportPostcardImage);
    }

    // 5. 감동 문구 복사 버튼
    const copyMsgBtn = getEl('copy-msg-btn');
    if (copyMsgBtn) {
      copyMsgBtn.addEventListener('click', async () => {
        if (!lastResult) return;
        const msg = `[내 인생의 모래시계 - ${lastResult.theme.name}]\n\n${lastResult.summary.fullMessage}\n\n나의 인생 모래시계 확인하기:\n${window.location.href}`;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(msg);
          } else {
            prompt('아래 문구를 복사하세요:', msg);
          }
          const orig = copyMsgBtn.textContent;
          copyMsgBtn.textContent = '✅ 복사 완료!';
          setTimeout(() => { copyMsgBtn.textContent = orig; }, 2000);
        } catch (e) {
          console.error(e);
        }
      });
    }

    // 6. 모래시계 URL 공유 버튼
    const shareBtn = getEl('share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        try {
          const url = window.location.href;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          }
          const orig = shareBtn.textContent;
          shareBtn.textContent = '✅ URL 복사 완료!';
          setTimeout(() => { shareBtn.textContent = orig; }, 2000);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  function init() {
    if (SimuLab.initAllSlidersProgress) SimuLab.initAllSlidersProgress();

    // 1. URL 쿼리 파라미터 (?mode=parents | pet | child | youth | couple) 우선 처리
    let hasUrlMode = false;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qMode = urlParams.get('mode');
      if (qMode && LifeCalc.EMOTIONAL_THEMES && LifeCalc.EMOTIONAL_THEMES[qMode]) {
        currentMode = qMode;
        hasUrlMode = true;
      }
    } catch (e) {}

    // 2. 저장된 이전 상태 복원
    if (SimuLab.restoreToolState) {
      const saved = SimuLab.restoreToolState('life-hourglass-sim');
      if (saved) {
        currentInputs = { ...LifeCalc.DEFAULT_LIFE_INPUTS, ...saved };
        // URL 쿼리가 명시되지 않았을 때만 저장된 모드 복원
        if (saved.mode && !hasUrlMode) currentMode = saved.mode;
        // UI 반영
        if (getEl('birth-year-input')) getEl('birth-year-input').value = currentInputs.birthYear;
        if (getEl('birth-month-input')) getEl('birth-month-input').value = currentInputs.birthMonth;
        if (getEl('birth-day-input')) getEl('birth-day-input').value = currentInputs.birthDay;
        if (getEl('expected-age-input')) getEl('expected-age-input').value = currentInputs.expectedAge;
        if (getEl('expected-age-slider')) getEl('expected-age-slider').value = currentInputs.expectedAge;
        if (getEl('parents-age-input')) getEl('parents-age-input').value = currentInputs.parentsAge;
        if (getEl('visit-days-input')) getEl('visit-days-input').value = currentInputs.visitDaysPerYear;
        if (getEl('parent-talk-hours-input')) getEl('parent-talk-hours-input').value = currentInputs.parentTalkHoursPerDay;
        if (getEl('pet-age-input')) getEl('pet-age-input').value = currentInputs.petAge;
        if (getEl('pet-walks-input')) getEl('pet-walks-input').value = currentInputs.petWalksPerWeek;
        if (getEl('child-age-input')) getEl('child-age-input').value = currentInputs.childAge;
        if (getEl('couple-age-input')) getEl('couple-age-input').value = currentInputs.coupleAge;
      }
    }

    bindEvents();
    switchMode(currentMode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
