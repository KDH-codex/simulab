/**
 * ==========================================================================
 * SimuLab - 만나이 & 띠 계산기 UI 컨트롤러
 * 파일 경로: tools/korean-age-calc/app.js
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const birthInput = document.getElementById('input-birth-date');
  const targetInput = document.getElementById('input-target-date');

  // 결과 디스플레이
  const statInternationalAge = document.getElementById('stat-intl-age');
  const statZodiacIcon = document.getElementById('stat-zodiac-icon');
  const statZodiacName = document.getElementById('stat-zodiac-name');
  const statYearAge = document.getElementById('stat-year-age');
  const statKoreanAge = document.getElementById('stat-korean-age');
  const statLivedDays = document.getElementById('stat-lived-days');
  const statNextBday = document.getElementById('stat-next-bday');
  const legalRightsContainer = document.getElementById('legal-rights-list');

  // 오늘 날짜로 기준일 설정
  function initDates() {
    const today = new Date();
    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (!targetInput.value) targetInput.value = formatDate(today);
    if (!birthInput.value) birthInput.value = '1995-05-15'; // 30대 기본 예시
  }

  function runCalculation() {
    const result = window.AgeLogic.calculate(birthInput.value, targetInput.value);
    if (!result) return;

    if (statInternationalAge) {
      statInternationalAge.textContent = `만 ${result.internationalAge}세`;
    }
    if (statZodiacIcon) statZodiacIcon.textContent = result.zodiac.icon;
    if (statZodiacName) statZodiacName.textContent = `${result.birthYear}년생 ${result.zodiac.name}`;

    if (statYearAge) statYearAge.textContent = `${result.yearAge}세`;
    if (statKoreanAge) statKoreanAge.textContent = `${result.koreanAge}세`;
    if (statLivedDays) statLivedDays.textContent = `${result.livedDays.toLocaleString('ko-KR')}일`;
    if (statNextBday) {
      statNextBday.textContent = result.daysUntilNextBday === 0 ? '오늘 생일입니다! 🎂' : `D-${result.daysUntilNextBday}`;
    }

    // 법정 자격 목록 렌더링
    if (legalRightsContainer) {
      legalRightsContainer.innerHTML = '';
      result.legalRights.forEach((r) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '0.55rem 0.2rem';
        item.style.borderBottom = '1px solid var(--border-color)';
        item.style.fontSize = '0.85rem';

        const statusBadge = r.eligible
          ? '<span style="color:#16a34a; font-weight:800; background:rgba(22,163,74,0.1); padding:0.15rem 0.5rem; border-radius:6px;">가능 / 완료</span>'
          : '<span style="color:#dc2626; font-weight:700; background:rgba(220,38,38,0.08); padding:0.15rem 0.5rem; border-radius:6px;">미달</span>';

        item.innerHTML = `
          <span>• <strong>${r.title}</strong></span>
          ${statusBadge}
        `;
        legalRightsContainer.appendChild(item);
      });
    }
  }

  // 출생연도 빠른 칩
  document.querySelectorAll('.year-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const year = btn.getAttribute('data-year');
      birthInput.value = `${year}-01-01`;
      runCalculation();
    });
  });

  [birthInput, targetInput].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', runCalculation);
      inp.addEventListener('change', runCalculation);
    }
  });

  initDates();
  runCalculation();
});
