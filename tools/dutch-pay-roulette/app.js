/**
 * ==========================================================================
 * SimuLab Analytics Hub - 센스있는 더치페이 & 뿜빠이 복불복 계산기 UI 컨트롤러
 * 파일 경로: tools/dutch-pay-roulette/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 구조 및 이벤트 바인딩 설명]
 * 1) 총 금액, 인원수, 절사 단위 및 모드(균등, 지각자 가산, 비음주자 할인, 몰아주기)에 따라
 *    logic.js의 calculateDutchPay()를 호출하여 정산표를 동적으로 구성합니다.
 * 2) 카카오톡 단톡방에 즉시 붙여넣을 수 있는 정돈된 정산 텍스트를 생성하여 원클릭 복사합니다.
 * 3) 프리미엄 인풋 카드와 원터치 칩 버튼 연동으로 터치 인터랙션을 극대화합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 1. 필요한 DOM 요소 캐싱
  const inputTotalAmount = document.getElementById('input-total-amount');
  const inputMemberCount = document.getElementById('input-member-count');
  const selectRoundUnit = document.getElementById('select-round-unit');
  const selectRoundMode = document.getElementById('select-round-mode');

  const badgeTotalAmount = document.getElementById('badge-total-amount');
  const badgeMemberCount = document.getElementById('badge-member-count');

  // 모드 선택 라디오 및 서브 패널
  const modeRadios = document.querySelectorAll('input[name="calc-mode"]');
  const panelLate = document.getElementById('panel-late');
  const inputLateCount = document.getElementById('input-late-count');
  const inputLatePenalty = document.getElementById('input-late-penalty');

  const panelNonDrinker = document.getElementById('panel-non-drinker');
  const inputNonDrinkerCount = document.getElementById('input-non-drinker-count');
  const inputNonDrinkerDiscount = document.getElementById('input-non-drinker-discount');

  // 조작 버튼
  const btnCalculate = document.getElementById('btn-calculate');
  const btnReset = document.getElementById('btn-reset');
  const btnCopyKakao = document.getElementById('btn-copy-kakao');

  // 배너 및 KPI 카드 DOM
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictText = document.getElementById('verdict-text');
  const kpiPerPerson = document.getElementById('kpi-per-person');
  const kpiTotalCollected = document.getElementById('kpi-total-collected');
  const kpiDiffAmount = document.getElementById('kpi-diff-amount');
  const kpiActiveMode = document.getElementById('kpi-active-mode');

  // 결과 테이블 및 카톡 프리뷰 DOM
  const memberTableBody = document.getElementById('member-table-body');
  const kakaoPreviewText = document.getElementById('kakao-preview-text');

  // 엔진 참조
  const engine = global.SimuLab && global.SimuLab.DutchPay;
  if (!engine) {
    console.error('[DutchPay] 엔진 모듈(logic.js)이 먼저 로드되지 않았습니다.');
    return;
  }

  let latestKakaoMessage = '';

  /**
   * 2. 사용자 입력값 수집 및 배지 갱신
   */
  function collectInputs() {
    let selectedMode = 'equal';
    modeRadios.forEach((r) => {
      if (r.checked) selectedMode = r.value;
    });

    const totalAmount = Number(inputTotalAmount ? inputTotalAmount.value : 120000) || 0;
    const memberCount = Number(inputMemberCount ? inputMemberCount.value : 4) || 1;

    // 배지 갱신
    if (badgeTotalAmount) {
      if (global.SimuLab && typeof global.SimuLab.formatKoreanAmount === 'function') {
        badgeTotalAmount.textContent = global.SimuLab.formatKoreanAmount(totalAmount);
      } else {
        badgeTotalAmount.textContent = `${new Intl.NumberFormat('ko-KR').format(totalAmount)}원`;
      }
    }
    if (badgeMemberCount) {
      badgeMemberCount.textContent = `${memberCount}명`;
    }

    return {
      totalAmount,
      memberCount,
      roundUnit: Number(selectRoundUnit ? selectRoundUnit.value : 1000) || 1000,
      roundMode: selectRoundMode ? selectRoundMode.value : 'ceil',
      mode: selectedMode,
      lateCount: Number(inputLateCount ? inputLateCount.value : 1) || 1,
      latePenalty: Number(inputLatePenalty ? inputLatePenalty.value : 10000) || 0,
      nonDrinkerCount: Number(inputNonDrinkerCount ? inputNonDrinkerCount.value : 1) || 1,
      nonDrinkerDiscountPct: Number(inputNonDrinkerDiscount ? inputNonDrinkerDiscount.value : 30) || 30,
    };
  }

  /**
   * 3. 모드별 서브 패널 노출 토글
   */
  function updateSubPanels() {
    let selectedMode = 'equal';
    modeRadios.forEach((r) => {
      if (r.checked) selectedMode = r.value;
    });

    if (panelLate) panelLate.style.display = selectedMode === 'late' ? 'block' : 'none';
    if (panelNonDrinker) panelNonDrinker.style.display = selectedMode === 'non_drinker' ? 'block' : 'none';
  }

  /**
   * 4. 메인 계산 및 화면 렌더링
   */
  function runCalculation() {
    const inputs = collectInputs();
    const result = engine.calculateDutchPay(inputs);
    const { summary, memberDetails, kakaoMessage } = result;
    latestKakaoMessage = kakaoMessage;

    // 1) Verdict 배너 갱신
    if (verdictBanner) verdictBanner.className = 'verdict-banner verdict-accent';
    if (verdictText) {
      const modeLabelMap = {
        equal: '기본 1/N 균등 정산',
        late: '지각자 벌금 가산 정산',
        non_drinker: '비음주자 할인 정산',
        roulette: '1명 40% 몰아주기 복불복',
      };
      verdictText.innerHTML = `
        <strong>${modeLabelMap[inputs.mode]}</strong> 적용 완료! 
        1인당 기본 <strong>${new Intl.NumberFormat('ko-KR').format(summary.roundedPerPerson)}원</strong> 수준이며, 
        총 <strong>${new Intl.NumberFormat('ko-KR').format(summary.actualCollectedTotal)}원</strong>이 수금됩니다.
      `;
    }

    // 2) 4대 KPI 카드 갱신
    if (kpiPerPerson) {
      kpiPerPerson.textContent = `${new Intl.NumberFormat('ko-KR').format(summary.roundedPerPerson)}원`;
    }
    if (kpiTotalCollected) {
      kpiTotalCollected.textContent = `${new Intl.NumberFormat('ko-KR').format(summary.actualCollectedTotal)}원`;
    }
    if (kpiDiffAmount) {
      const sign = summary.difference > 0 ? '+' : '';
      const statusText = summary.difference === 0 ? '정확히 일치' : (summary.difference > 0 ? '총무 팁 잉여' : '부족');
      kpiDiffAmount.textContent = `${sign}${new Intl.NumberFormat('ko-KR').format(summary.difference)}원 (${statusText})`;
      kpiDiffAmount.style.color = summary.difference >= 0 ? '#10b981' : '#ef4444';
    }
    if (kpiActiveMode) {
      const modeShortMap = {
        equal: '1/N 균등 분할',
        late: '지각 가산',
        non_drinker: '비음주 할인',
        roulette: '몰아주기 복불복',
      };
      kpiActiveMode.textContent = modeShortMap[inputs.mode] || '1/N 균등';
    }

    // 3) 상세 멤버 테이블 렌더링 (innerHTML 기반으로 고속 렌더링)
    if (memberTableBody && Array.isArray(memberDetails)) {
      memberTableBody.innerHTML = memberDetails
        .map(
          (m) => `
          <tr>
            <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); font-weight: 700;">
              ${m.name}
            </td>
            <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); text-align: center; color: var(--text-secondary); font-size: 0.85rem;">
              <span style="background: var(--bg-secondary); padding: 0.2rem 0.5rem; border-radius: 4px;">${m.role}</span>
            </td>
            <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); text-align: right; font-weight: 800; color: #2563eb;">
              ${new Intl.NumberFormat('ko-KR').format(m.amount)}원
            </td>
          </tr>
        `
        )
        .join('');
    }

    // 4) 카카오톡 공유 프리뷰 갱신
    if (kakaoPreviewText) {
      kakaoPreviewText.textContent = kakaoMessage;
    }
  }

  /**
   * 5. 카카오톡 정산 문구 클립보드 복사
   */
  function copyKakaoMessage() {
    if (!latestKakaoMessage) runCalculation();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(latestKakaoMessage).then(() => {
        alert('📱 단톡방 정산 안내 문구가 클립보드에 복사되었습니다!\n원하는 카톡/메신저 채팅방에 바로 붙여넣기(Ctrl+V) 하세요.');
      }).catch(() => {
        prompt('아래 문구를 복사하여 단톡방에 전달하세요:', latestKakaoMessage);
      });
    } else {
      prompt('아래 문구를 복사하여 단톡방에 전달하세요:', latestKakaoMessage);
    }
  }

  /**
   * 6. 초기화
   */
  function resetInputs() {
    if (inputTotalAmount) inputTotalAmount.value = '120000';
    if (inputMemberCount) inputMemberCount.value = '4';
    if (selectRoundUnit) selectRoundUnit.value = '1000';
    if (selectRoundMode) selectRoundMode.value = 'ceil';

    modeRadios.forEach((r) => {
      r.checked = r.value === 'equal';
    });

    if (inputLateCount) inputLateCount.value = '1';
    if (inputLatePenalty) inputLatePenalty.value = '10000';
    if (inputNonDrinkerCount) inputNonDrinkerCount.value = '1';
    if (inputNonDrinkerDiscount) inputNonDrinkerDiscount.value = '30';

    updateSubPanels();
    runCalculation();
  }

  // 이벤트 리스너 바인딩
  modeRadios.forEach((r) => {
    r.addEventListener('change', () => {
      updateSubPanels();
      runCalculation();
    });
  });

  const liveInputs = [
    inputTotalAmount, inputMemberCount, selectRoundUnit, selectRoundMode,
    inputLateCount, inputLatePenalty, inputNonDrinkerCount, inputNonDrinkerDiscount,
  ];

  liveInputs.forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  // 퀵 칩 버튼 원터치 조절 이벤트 (+1만, +1명 등)
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

  if (btnCalculate) btnCalculate.addEventListener('click', runCalculation);
  if (btnReset) btnReset.addEventListener('click', resetInputs);
  if (btnCopyKakao) btnCopyKakao.addEventListener('click', copyKakaoMessage);

  // 초기 렌더링
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateSubPanels();
      runCalculation();
    });
  } else {
    updateSubPanels();
    runCalculation();
  }

})(typeof window !== 'undefined' ? window : globalThis);
