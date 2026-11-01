/**
 * ==========================================================================
 * SimuLab Analytics Hub - 로또 세후 실수령액 & 당첨금 월이자 계산기 UI 컨트롤러
 * 파일 경로: tools/lotto-tax-interest-calc/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 바인딩 설명]
 * - 당첨금을 입력하면 22%/33% 세법에 따라 공제세액과 실수령액을 역산하고,
 *   은행 예금 및 배당 투자 시 매월 통장에 꽂히는 이자를 보여줍니다.
 * - 프리미엄 핀테크 인풋 카드, 실시간 한글 금액 읽기(억/만 원),
 *   원터치 퀵 조절 칩 버튼을 지원합니다.
 * ==========================================================================
 */

(function () {
  'use strict';

  // SimuLab 전역 객체 및 로직 모듈 참조
  const SimuLab = window.SimuLab || {};
  const LottoTaxCalc = SimuLab.LottoTaxInterest || {};

  // 현재 사용자 입력 상태값
  let currentInputs = { ...LottoTaxCalc.DEFAULT_LOTTO_TAX_INPUTS };

  /**
   * DOM 요소를 편리하게 가져오는 헬퍼 함수
   */
  function getEl(id) {
    return document.getElementById(id);
  }

  /**
   * DOM 텍스트를 안전하게 변경하는 헬퍼 함수
   */
  function setText(id, text) {
    const el = getEl(id);
    if (el) el.textContent = text;
  }

  /**
   * 통화 금액 포맷팅 (원 단위)
   */
  function formatMoney(amount) {
    return SimuLab.formatCurrency ? SimuLab.formatCurrency(amount) : `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  /**
   * 축약형 통화 금액 포맷팅 (예: 25억 원)
   */
  function formatMoneyCompact(amount) {
    return SimuLab.formatCurrency ? SimuLab.formatCurrency(amount, true) : `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  /**
   * UI 입력창에서 최신 값들을 읽어오는 함수
   */
  function readInputsFromUI() {
    return {
      prizeAmount: Number(getEl('prize-amount-input')?.value) || 2500000000,
      depositRate: Number(getEl('deposit-rate-input')?.value) || 3.5,
      dividendRate: Number(getEl('dividend-rate-input')?.value) || 4.5,
    };
  }

  /**
   * 상태값을 화면 UI 필드에 동기화하고 한글 뱃지를 갱신하는 함수
   */
  function syncInputsToUI(inputs) {
    if (getEl('prize-amount-input')) getEl('prize-amount-input').value = inputs.prizeAmount;
    if (getEl('prize-amount-slider')) getEl('prize-amount-slider').value = inputs.prizeAmount;
    if (getEl('deposit-rate-input')) getEl('deposit-rate-input').value = inputs.depositRate;
    if (getEl('dividend-rate-input')) getEl('dividend-rate-input').value = inputs.dividendRate;

    updateBadges(inputs);

    // 슬라이더 배경 채움 바(fill bar) 진행도 초기화
    if (SimuLab.initAllSlidersProgress) SimuLab.initAllSlidersProgress();
  }

  /**
   * 숫자를 읽기 쉬운 한글 금액("25억 원") 뱃지로 갱신
   */
  function updateBadges(inputs) {
    if (SimuLab.formatKoreanAmount) {
      setText('badge-prize-amount', SimuLab.formatKoreanAmount(inputs.prizeAmount));
    }
  }

  /**
   * 메인 계산 및 결과 렌더링
   */
  function runSimulation() {
    currentInputs = readInputsFromUI();
    updateBadges(currentInputs);

    // 비즈니스 로직 계산 실행
    const result = LottoTaxCalc.calculateLottoTaxAndInterest(currentInputs);
    const s = result.summary;

    // 상단 브리핑 배너 업데이트
    const verdictBanner = getEl('verdict-banner');
    const verdictText = getEl('verdict-text');
    if (verdictText) {
      verdictText.innerHTML = `
        당첨금 <strong>${formatMoneyCompact(s.prizeAmount)}</strong> 중 세금으로 <strong>${formatMoneyCompact(s.totalTax)}</strong>(실효세율 ${s.effectiveTaxRate}%)이 공제되어 실제 통장에는 <strong>${formatMoneyCompact(s.netPayout)}</strong>이 입금됩니다.<br/>
        이 실수령액을 1금융권 정기예금(연 ${currentInputs.depositRate}%)에만 예치해도 매월 세후 <strong>${formatMoney(s.monthlyNetInterest)}</strong>, 배당성장 ETF(연 ${currentInputs.dividendRate}%) 투자 시 매월 <strong>${formatMoney(s.monthlyNetDividend)}</strong>의 불로소득이 평생 발생합니다!
      `;
      if (verdictBanner) verdictBanner.style.borderColor = '#10b981';
    }

    // 요약 KPI 카드 4종
    setText('card-net-payout', formatMoneyCompact(s.netPayout));
    setText('card-total-tax', formatMoneyCompact(s.totalTax));
    setText('card-monthly-interest', formatMoney(s.monthlyNetInterest));
    setText('card-monthly-fire', formatMoney(s.monthlyFireExpense));

    // 우측 세부 배지
    setText('stat-effective-tax', `${s.effectiveTaxRate}%`);
    setText('stat-tax-under3', formatMoneyCompact(s.taxUnder300m));
    setText('stat-tax-over3', formatMoneyCompact(s.taxOver300m));
    setText('stat-monthly-dividend', formatMoney(s.monthlyNetDividend));

    // 로컬 스토리지에 현재 입력값 저장
    if (SimuLab.saveToolState) {
      SimuLab.saveToolState('lotto-tax-interest-calc', currentInputs);
    }
  }

  /**
   * 이벤트 리스너 바인딩 (입력창, 슬라이더, 퀵 칩 버튼)
   */
  function bindEvents() {
    const pInput = getEl('prize-amount-input');
    const pSlider = getEl('prize-amount-slider');

    // 당첨금 입력창 및 슬라이더 연동
    if (pInput && pSlider) {
      pInput.addEventListener('input', () => {
        pSlider.value = pInput.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(pSlider);
        runSimulation();
      });
      pSlider.addEventListener('input', () => {
        pInput.value = pSlider.value;
        if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(pSlider);
        runSimulation();
      });
    }

    // 예금 및 배당 금리 입력 감지
    ['deposit-rate-input', 'dividend-rate-input'].forEach((id) => {
      const el = getEl(id);
      if (el) el.addEventListener('input', runSimulation);
    });

    // 퀵 프리셋 버튼들 (15억, 20억, 25억, 30억)
    document.querySelectorAll('[data-prize-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-prize-preset'));
        if (Number.isFinite(val)) {
          if (pInput) pInput.value = val;
          if (pSlider) {
            pSlider.value = val;
            if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(pSlider);
          }
          runSimulation();
        }
      });
    });

    // 퀵 증감 칩 버튼들 (+1억, +5억)
    document.querySelectorAll('[data-prize-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const addVal = Number(btn.getAttribute('data-prize-add')) || 0;
        const curVal = Number(pInput?.value) || 0;
        const nextVal = Math.max(0, curVal + addVal);
        if (pInput) pInput.value = nextVal;
        if (pSlider) {
          pSlider.value = nextVal;
          if (SimuLab.updateSliderProgress) SimuLab.updateSliderProgress(pSlider);
        }
        runSimulation();
      });
    });

    // URL 공유 버튼
    const shareBtn = getEl('share-btn');
    if (shareBtn && SimuLab.shareSimulationUrl) {
      shareBtn.addEventListener('click', () => {
        SimuLab.shareSimulationUrl(readInputsFromUI());
      });
    }
  }

  /**
   * 계산기 초기화 진입점
   */
  function init() {
    if (SimuLab.initCommonUI) {
      SimuLab.initCommonUI('lotto-tax-interest-calc');
    }

    let initialValues = { ...LottoTaxCalc.DEFAULT_LOTTO_TAX_INPUTS };
    if (SimuLab.parseUrlParams) {
      initialValues = SimuLab.parseUrlParams(initialValues);
    } else if (SimuLab.loadToolState) {
      const saved = SimuLab.loadToolState('lotto-tax-interest-calc');
      if (saved && saved.currentInputs) initialValues = { ...initialValues, ...saved.currentInputs };
    }

    syncInputsToUI(initialValues);
    bindEvents();
    runSimulation();
  }

  // DOM 로드 완료 시 초기화 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
