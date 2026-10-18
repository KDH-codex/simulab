/**
 * ==========================================================================
 * SimuLab Analytics Hub - 연애 유형 & 사랑의 동물 애착 심리테스트 UI 인터랙션 컨트롤러
 * 파일 경로: tools/love-animal-attachment/app.js
 * --------------------------------------------------------------------------
 * [초보자를 위한 UI 구조 및 바인딩 설명]
 * 1) 8문항 연애 심리 질문에 대한 사용자 라디오 응답을 수집하고 진행률을 계산합니다.
 * 2) URL 쿼리스트링(?invite=SEC_RETRIEVER&sender=골든리트리버)을 감지하여 초대 배너를 표시합니다.
 * 3) 8문항 완료 시 나의 연애 동물 페르소나 및 초대자와의 실시간 궁합 점수를 산출합니다.
 * 4) 친구/연인에게 링크를 보내 둘의 궁합을 맞출 수 있는 전용 초대 링크 복사 기능을 제공합니다.
 * 5) Pretendard 화이트 모던 테마 및 audit.mjs 표준 검증 규격을 엄격히 준수합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 1. 필요한 DOM 요소 캐싱
  const questionsContainer = document.getElementById('questions-container');
  const progressText = document.getElementById('progress-text');
  const progressBar = document.getElementById('progress-bar');
  const btnCalculate = document.getElementById('btn-calculate');
  const btnReset = document.getElementById('btn-reset');
  const btnShare = document.getElementById('btn-share');

  // 초대 감지 배너 DOM
  const inviteBanner = document.getElementById('invite-banner');
  const inviteSenderName = document.getElementById('invite-sender-name');

  // 결과 영역 DOM
  const resultsSection = document.getElementById('results-section');
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictText = document.getElementById('verdict-text');

  // 4대 축 KPI 카드 DOM
  const kpiAttachmentType = document.getElementById('kpi-attachment-type');
  const kpiAnxiety = document.getElementById('kpi-anxiety');
  const kpiAvoidance = document.getElementById('kpi-avoidance');
  const kpiLoveStyle = document.getElementById('kpi-love-style');

  // 동물 상세 프로필 DOM
  const animalIcon = document.getElementById('animal-icon');
  const animalName = document.getElementById('animal-name');
  const animalSubtitle = document.getElementById('animal-subtitle');
  const animalCode = document.getElementById('animal-code');
  const animalSummary = document.getElementById('animal-summary');
  const animalStrengths = document.getElementById('animal-strengths');
  const animalCautions = document.getElementById('animal-cautions');
  const animalIdealStyle = document.getElementById('animal-ideal-style');
  const matchBest = document.getElementById('match-best');
  const matchWorst = document.getElementById('match-worst');

  // 초대한 연인/친구와의 궁합 매칭 카드 DOM
  const partnerMatchCard = document.getElementById('partner-match-card');
  const partnerMatchNames = document.getElementById('partner-match-names');
  const partnerMatchScore = document.getElementById('partner-match-score');
  const partnerMatchGrade = document.getElementById('partner-match-grade');
  const partnerMatchTitle = document.getElementById('partner-match-title');
  const partnerMatchSynergy = document.getElementById('partner-match-synergy');
  const partnerMatchPrescription = document.getElementById('partner-match-prescription');

  // 바이럴 초대 버튼 DOM
  const btnCopyInvite = document.getElementById('btn-copy-invite');
  const btnCopyKakaoText = document.getElementById('btn-copy-kakao-text');

  // 엔진 참조
  const engine = global.SimuLab && global.SimuLab.LoveAnimalAttachment;
  if (!engine) {
    console.error('[LoveAnimalAttachment] 엔진 모듈(logic.js)이 먼저 로드되지 않았습니다.');
    return;
  }

  // 현재 응답 상태 저장 객체
  let currentAnswers = { ...engine.DEFAULT_LOVE_ANSWERS };
  let lastEvaluatedResult = null;

  // URL 파라미터 파싱 (초대자 정보)
  const urlParams = new URLSearchParams(window.location.search);
  const invitedCode = urlParams.get('invite') || '';
  const invitedSender = urlParams.get('sender') || '';

  /**
   * 2. 질문 리스트 렌더링 함수
   */
  function renderQuestions() {
    if (!questionsContainer) return;
    questionsContainer.innerHTML = '';

    engine.LOVE_QUESTIONS.forEach((q, idx) => {
      const qNum = idx + 1;
      const card = document.createElement('div');
      card.className = 'survey-question-card';
      card.id = `card-${q.id}`;

      card.innerHTML = `
        <div class="survey-q-header">
          <span class="q-badge">Q${qNum}</span>
          <span class="q-text">${q.text}</span>
        </div>
        <div class="survey-options-grid">
          <label class="survey-option-label" id="label-${q.id}-A">
            <input type="radio" name="${q.id}" value="${q.optionA.value}" ${currentAnswers[q.id] === q.optionA.value ? 'checked' : ''}>
            <div class="option-content">
              <span class="option-symbol">A</span>
              <span class="option-desc">${q.optionA.label}</span>
            </div>
          </label>
          <label class="survey-option-label" id="label-${q.id}-B">
            <input type="radio" name="${q.id}" value="${q.optionB.value}" ${currentAnswers[q.id] === q.optionB.value ? 'checked' : ''}>
            <div class="option-content">
              <span class="option-symbol">B</span>
              <span class="option-desc">${q.optionB.label}</span>
            </div>
          </label>
        </div>
      `;

      questionsContainer.appendChild(card);
    });

    // 라디오 변경 이벤트 리스너 등록
    engine.LOVE_QUESTIONS.forEach((q) => {
      const radios = document.querySelectorAll(`input[name="${q.id}"]`);
      radios.forEach((radio) => {
        radio.addEventListener('change', (e) => {
          currentAnswers[q.id] = e.target.value;
          updateProgress();
          highlightSelectedOptions(q.id);
        });
      });
      highlightSelectedOptions(q.id);
    });

    updateProgress();
  }

  /**
   * 3. 선택된 옵션 시각적 하이라이트
   */
  function highlightSelectedOptions(questionId) {
    const labelA = document.getElementById(`label-${questionId}-A`);
    const labelB = document.getElementById(`label-${questionId}-B`);
    const radioA = labelA ? labelA.querySelector('input') : null;
    const radioB = labelB ? labelB.querySelector('input') : null;

    if (labelA && radioA) {
      if (radioA.checked) {
        labelA.classList.add('selected');
      } else {
        labelA.classList.remove('selected');
      }
    }

    if (labelB && radioB) {
      if (radioB.checked) {
        labelB.classList.add('selected');
      } else {
        labelB.classList.remove('selected');
      }
    }
  }

  /**
   * 4. 설문 진행률 계산 및 프로그레스 바 갱신
   */
  function updateProgress() {
    let answeredCount = 0;
    engine.LOVE_QUESTIONS.forEach((q) => {
      if (currentAnswers[q.id]) {
        answeredCount++;
      }
    });

    const total = engine.LOVE_QUESTIONS.length;
    const percent = Math.round((answeredCount / total) * 100);

    if (progressText) {
      progressText.textContent = `${answeredCount} / ${total} 문항 완료 (${percent}%)`;
    }
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
  }

  /**
   * 5. 테스트 결과 계산 및 화면 렌더링
   */
  function calculateAndRender() {
    // 8문항 전체 응답 여부 점검
    const unanswered = engine.LOVE_QUESTIONS.filter((q) => !currentAnswers[q.id]);
    if (unanswered.length > 0) {
      alert(`아직 답변하지 않은 질문이 ${unanswered.length}개 있습니다. 모든 질문에 답해주세요.`);
      const firstUnansweredCard = document.getElementById(`card-${unanswered[0].id}`);
      if (firstUnansweredCard) {
        firstUnansweredCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // 엔진 분석 실행
    const result = engine.evaluateLoveAttachment(currentAnswers);
    lastEvaluatedResult = result;
    const { animal, metrics, profileCode } = result;

    // 1) Verdict 배너 갱신
    if (verdictBanner) {
      verdictBanner.className = 'verdict-banner verdict-accent';
    }
    if (verdictText) {
      verdictText.innerHTML = `
        당신의 사랑의 동물 페르소나는 <strong>[${animal.name}]</strong> (${animal.type}) 입니다.<br>
        <span style="font-size: 0.95rem; font-weight: 400; color: #475569;">${animal.subtitle} | 코드: ${profileCode}</span>
      `;
    }

    // 2) 4대 축 KPI 카드 갱신
    if (kpiAttachmentType) kpiAttachmentType.textContent = metrics.attachmentType;
    if (kpiAnxiety) kpiAnxiety.textContent = metrics.anxietyLevel;
    if (kpiAvoidance) kpiAvoidance.textContent = metrics.avoidanceLevel;
    if (kpiLoveStyle) kpiLoveStyle.textContent = animal.english;

    // 3) 동물 상세 프로필 갱신
    if (animalIcon) animalIcon.textContent = animal.icon;
    if (animalName) animalName.textContent = animal.name;
    if (animalSubtitle) animalSubtitle.textContent = animal.subtitle;
    if (animalCode) animalCode.textContent = animal.type;
    if (animalSummary) animalSummary.textContent = animal.summary;

    // 연애 강점 목록
    if (animalStrengths) {
      animalStrengths.innerHTML = animal.strengths
        .map((s) => `<li><span class="bullet-check">✓</span> ${s}</li>`)
        .join('');
    }

    // 주의해야 할 사랑의 덫
    if (animalCautions) {
      animalCautions.innerHTML = animal.cautions
        .map((c) => `<li><span class="bullet-warn">⚠</span> ${c}</li>`)
        .join('');
    }

    // 이상적인 연애 스타일
    if (animalIdealStyle) {
      animalIdealStyle.textContent = animal.idealStyle;
    }

    // 기본 궁합
    if (matchBest) matchBest.textContent = animal.bestMatch;
    if (matchWorst) matchWorst.textContent = animal.worstMatch;

    // 4) 초대한 친구/연인과의 실시간 궁합 분석 처리
    if (invitedCode && engine.getLoveChemistry) {
      const chemistry = engine.getLoveChemistry(invitedCode, profileCode);
      if (chemistry && partnerMatchCard) {
        partnerMatchCard.style.display = 'block';
        if (partnerMatchNames) {
          const senderLabel = invitedSender ? decodeURIComponent(invitedSender) : chemistry.pA.name;
          partnerMatchNames.innerHTML = `초대자 [${senderLabel}] ✕ 나의 [${animal.name}] 연애 케미`;
        }
        if (partnerMatchScore) partnerMatchScore.textContent = `${chemistry.score}점`;
        if (partnerMatchGrade) partnerMatchGrade.textContent = `${chemistry.grade}등급`;
        if (partnerMatchTitle) partnerMatchTitle.textContent = chemistry.title;
        if (partnerMatchSynergy) partnerMatchSynergy.textContent = chemistry.synergy;
        if (partnerMatchPrescription) partnerMatchPrescription.textContent = chemistry.prescription;
      }
    }

    // 결과 섹션 표시 및 부드러운 스크롤
    if (resultsSection) {
      resultsSection.style.display = 'block';
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * 6. 나만의 초대 링크 URL 생성
   */
  function generateInviteUrl() {
    const code = lastEvaluatedResult ? lastEvaluatedResult.profileCode : 'SEC_RETRIEVER';
    const name = lastEvaluatedResult ? lastEvaluatedResult.animal.name : '골든리트리버';
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?invite=${code}&sender=${encodeURIComponent(name)}`;
  }

  /**
   * 7. 초대 링크 클립보드 복사
   */
  function copyInviteLink() {
    const inviteUrl = generateInviteUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        alert('🎉 나만의 전용 연애 궁합 초대 링크가 복사되었습니다!\n\n연인이나 친구에게 보내면 상대방이 테스트를 마친 즉시 두 사람의 [실시간 연애 궁합 점수(0~100점)]가 공개됩니다.');
      }).catch(() => {
        prompt('아래 전용 초대 링크를 복사하여 전달하세요:', inviteUrl);
      });
    } else {
      prompt('아래 전용 초대 링크를 복사하여 전달하세요:', inviteUrl);
    }
  }

  /**
   * 8. 카카오톡 단톡방/연인 공유용 문구 복사
   */
  function copyKakaoText() {
    const inviteUrl = generateInviteUrl();
    const myAnimal = lastEvaluatedResult ? lastEvaluatedResult.animal.name : '골든리트리버';
    const message = `[SimuLab 연애 유형 & 사랑의 동물 테스트]\n\n나의 연애 동물 페르소나는 "${myAnimal}"(으)로 나왔어! 🐾\n너는 어떤 사랑의 동물인지 알아보고, 우리 둘의 연애 궁합 몇 점 나오는지 맞춰보자!\n\n👇 아래 링크에서 바로 확인해봐:\n${inviteUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).then(() => {
        alert('📱 공유 문구가 클립보드에 복사되었습니다!\n카톡 채팅방에 바로 붙여넣기(Ctrl+V) 하세요.');
      }).catch(() => {
        prompt('아래 문구를 복사하여 채팅방에 붙여넣으세요:', message);
      });
    } else {
      prompt('아래 문구를 복사하여 채팅방에 붙여넣으세요:', message);
    }
  }

  /**
   * 9. 초기화 함수
   */
  function resetSurvey() {
    currentAnswers = { ...engine.DEFAULT_LOVE_ANSWERS };
    renderQuestions();
    if (resultsSection) {
      resultsSection.style.display = 'none';
    }
    if (partnerMatchCard) {
      partnerMatchCard.style.display = 'none';
    }
    if (verdictBanner) {
      verdictBanner.className = 'verdict-banner verdict-neutral';
    }
    if (verdictText) {
      verdictText.textContent = '8개 질문에 답변하고 나의 사랑의 동물 페르소나를 확인해보세요.';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 이벤트 리스너 바인딩
  if (btnCalculate) {
    btnCalculate.addEventListener('click', calculateAndRender);
  }

  if (btnReset) {
    btnReset.addEventListener('click', resetSurvey);
  }

  if (btnShare) {
    btnShare.addEventListener('click', copyInviteLink);
  }

  if (btnCopyInvite) {
    btnCopyInvite.addEventListener('click', copyInviteLink);
  }

  if (btnCopyKakaoText) {
    btnCopyKakaoText.addEventListener('click', copyKakaoText);
  }

  // 초기 렌더링 및 초대자 정보 감지
  document.addEventListener('DOMContentLoaded', () => {
    if (invitedCode && inviteBanner) {
      inviteBanner.style.display = 'block';
      if (inviteSenderName && invitedSender) {
        inviteSenderName.textContent = decodeURIComponent(invitedSender);
      }
    }
    renderQuestions();
  });

})(typeof window !== 'undefined' ? window : globalThis);
