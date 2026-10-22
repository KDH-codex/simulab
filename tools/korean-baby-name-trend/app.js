/**
 * ==========================================================================
 * [별별 통계] 대한민국 아기이름 트렌드 UI 컨트롤러 (app.js)
 * --------------------------------------------------------------------------
 * 1. 탭 네비게이션 (Top 랭킹 / 내 이름 검색 / 시대별 변천사 / 성씨+풀네임 랭킹)
 * 2. 2026년 최신 공식 출생신고 순위 렌더링
 * 3. 시계열 순위 캔버스(Canvas) 차트 시각화 (2008~2026년)
 * 4. 통계청 10대 성씨 + 2026 인기 아기이름 결합 풀네임 랭킹 엔진
 * 5. LocalStorage 기반 안전한 나만의 이름 후보 보관함(즐겨찾기)
 * ==========================================================================
 */

import { BabyNameLogic } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. 공통 탭 네비게이션 제어 (4개 서브탭)
  // --------------------------------------------------------------------------
  const tabBtns = document.querySelectorAll('.sub-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');

      // 4번째 풀네임 탭으로 이동 시 초기 렌더링 실행
      if (targetId === 'panel-fullname') {
        renderFullnames();
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. 탭 1: 연도별 Top 랭킹 뷰 (2026년 최신 반영)
  // --------------------------------------------------------------------------
  const yearSelect = document.getElementById('yearSelect');
  const genderBoyBtn = document.getElementById('genderBoyBtn');
  const genderGirlBtn = document.getElementById('genderGirlBtn');
  const rankingListEl = document.getElementById('rankingList');
  const rankingSummaryEl = document.getElementById('rankingSummary');

  let currentYear = '2026';
  let currentGender = 'boy';

  function renderRankings() {
    if (!rankingListEl) return;
    const list = BabyNameLogic.getRankings(currentYear, currentGender);
    rankingListEl.innerHTML = '';

    const genderText = currentGender === 'boy' ? '남아 👦' : '여아 👧';
    if (rankingSummaryEl) {
      rankingSummaryEl.innerHTML = `<strong>${currentYear}년 대한민국 ${genderText} 인기 이름 Top ${list.length}</strong>`;
    }

    list.forEach(item => {
      let diffHtml = '';
      if (item.diff > 0) {
        diffHtml = `<span style="color:#10b981; font-weight:750; font-size:0.75rem;">▲ ${item.diff}</span>`;
      } else if (item.diff < 0) {
        diffHtml = `<span style="color:#ef4444; font-weight:750; font-size:0.75rem;">▼ ${Math.abs(item.diff)}</span>`;
      } else {
        diffHtml = `<span style="color:#94a3b8; font-weight:600; font-size:0.75rem;">-</span>`;
      }

      // 1~3위 메달 하이라이트
      let rankBadge = `<span class="rank-num">${item.rank}</span>`;
      if (item.rank === 1) rankBadge = `<span class="rank-num rank-gold">🥇 1</span>`;
      else if (item.rank === 2) rankBadge = `<span class="rank-num rank-silver">🥈 2</span>`;
      else if (item.rank === 3) rankBadge = `<span class="rank-num rank-bronze">🥉 3</span>`;

      const card = document.createElement('div');
      card.className = 'ranking-item-card';
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.6rem;">
          ${rankBadge}
          <div>
            <strong class="clickable-name" data-name="${item.name}">${item.name}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted); display:block;">출생등록 ${item.count.toLocaleString()}건</span>
          </div>
        </div>
        <div style="text-align:right;">
          ${diffHtml}
        </div>
      `;
      rankingListEl.appendChild(card);
    });

    // 이름을 클릭하면 2번째 '내 이름 순위 검색' 탭으로 바로 이동
    rankingListEl.querySelectorAll('.clickable-name').forEach(el => {
      el.addEventListener('click', (e) => {
        const name = e.target.getAttribute('data-name');
        switchToSearch(name);
      });
    });
  }

  if (yearSelect) {
    yearSelect.addEventListener('change', (e) => {
      currentYear = e.target.value;
      renderRankings();
    });
  }

  if (genderBoyBtn && genderGirlBtn) {
    genderBoyBtn.addEventListener('click', () => {
      currentGender = 'boy';
      genderBoyBtn.classList.add('active');
      genderGirlBtn.classList.remove('active');
      renderRankings();
    });
    genderGirlBtn.addEventListener('click', () => {
      currentGender = 'girl';
      genderGirlBtn.classList.add('active');
      genderBoyBtn.classList.remove('active');
      renderRankings();
    });
  }

  // --------------------------------------------------------------------------
  // 3. 탭 2: 내 이름 순위 검색기 (2008~2026 시계열 차트)
  // --------------------------------------------------------------------------
  const nameSearchInput = document.getElementById('nameSearchInput');
  const btnSearchName = document.getElementById('btnSearchName');
  const searchResultBox = document.getElementById('searchResultBox');
  const quickNameChips = document.querySelectorAll('.name-chip');

  function doSearchName(name) {
    if (!name || !name.trim()) return;
    const res = BabyNameLogic.searchName(name);

    searchResultBox.style.display = 'block';

    if (!res.found) {
      searchResultBox.innerHTML = `
        <div class="result-not-found">
          <div style="font-size:2rem; margin-bottom:0.5rem;">🌟</div>
          <h3 style="font-size:1.1rem; font-weight:750; margin-bottom:0.3rem;">희귀하거나 유니크한 이름입니다!</h3>
          <p style="color:var(--text-secondary); font-size:0.88rem; line-height:1.5;">${res.message}</p>
        </div>
      `;
      return;
    }

    const genderLabel = res.gender === 'boy' ? '남아 👦' : '여아 👧';
    searchResultBox.innerHTML = `
      <div class="name-analysis-header">
        <div>
          <span class="gender-pill ${res.gender}">${genderLabel}</span>
          <h3 style="font-size:1.4rem; font-weight:850; margin:0.3rem 0 0.2rem;">${res.name}</h3>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.8rem; color:var(--text-muted); display:block;">역대 최고 순위</span>
          <strong style="font-size:1.3rem; color:var(--accent-color); font-weight:850;">${res.peakRank}위</strong>
          <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">(전성기: ${res.peakYear})</span>
        </div>
      </div>

      <div style="margin-top:1.25rem;">
        <h4 style="font-size:0.92rem; font-weight:750; margin-bottom:0.5rem;">📈 2008~2026년 순위 변천사 (높을수록 1위)</h4>
        <div style="position:relative; width:100%; height:240px;">
          <canvas id="historyCanvas" style="width:100%; height:240px;"></canvas>
        </div>
      </div>
    `;

    // 캔버스 차트 렌더링
    const canvas = document.getElementById('historyCanvas');
    if (canvas) {
      drawHistoryChart(canvas, res.history);
    }

    if (window.SimuLabTracker && window.SimuLabTracker.trackEvent) {
      window.SimuLabTracker.trackEvent('search_baby_name', res.name);
    }
  }

  function drawHistoryChart(canvas, history) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 30, bottom: 40, left: 45 };

    const years = ['2008', '2014', '2018', '2020', '2022', '2024', '2025', '2026'];
    const maxRank = 100;
    const minRank = 1;

    function getY(rank) {
      const safeRank = Math.min(Math.max(rank, 1), 100);
      return padding.top + ((safeRank - minRank) / (maxRank - minRank)) * (height - padding.top - padding.bottom);
    }

    function getX(idx) {
      return padding.left + (idx / (years.length - 1)) * (width - padding.left - padding.right);
    }

    ctx.clearRect(0, 0, width, height);

    const gridRanks = [1, 20, 50, 100];
    ctx.font = '600 10px Pretendard, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    gridRanks.forEach(r => {
      const y = getY(r);
      ctx.beginPath();
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(r + '위', padding.left - 6, y);
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    years.forEach((yr, idx) => {
      const x = getX(idx);
      ctx.fillText(yr.slice(2) + '년', x, height - padding.bottom + 8);
    });

    const points = [];
    years.forEach((yr, idx) => {
      const r = history[yr] || 100;
      points.push({ x: getX(idx), y: getY(r), rank: history[yr] });
    });

    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    points.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#4f46e5';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (pt.rank && pt.rank < 100) {
        ctx.font = '750 11px Pretendard, sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(pt.rank + '위', pt.x, pt.y - 7);
      }
    });
  }

  function switchToSearch(name) {
    const searchTabBtn = document.querySelector('.sub-tab-btn[data-target="panel-search"]');
    if (searchTabBtn) searchTabBtn.click();
    if (nameSearchInput) nameSearchInput.value = name;
    doSearchName(name);
  }

  if (btnSearchName && nameSearchInput) {
    btnSearchName.addEventListener('click', () => doSearchName(nameSearchInput.value));
    nameSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearchName(nameSearchInput.value);
    });
  }

  quickNameChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const name = chip.getAttribute('data-name');
      if (nameSearchInput) nameSearchInput.value = name;
      doSearchName(name);
    });
  });

  // --------------------------------------------------------------------------
  // 4. 탭 3: 시대별 1위 변천사 뷰
  // --------------------------------------------------------------------------
  const eraTimelineEl = document.getElementById('eraTimeline');
  if (eraTimelineEl) {
    eraTimelineEl.innerHTML = '';
    BabyNameLogic.ERA_TRENDS.forEach(eraItem => {
      const card = document.createElement('div');
      card.className = 'era-card';
      card.innerHTML = `
        <div class="era-badge">${eraItem.era}</div>
        <p class="era-desc">${eraItem.desc}</p>
        <div class="era-names-grid">
          <div class="era-name-col">
            <span style="font-size:0.78rem; font-weight:750; color:#3b82f6;">👦 남아 대표</span>
            <div style="font-weight:750; font-size:0.95rem; margin-top:0.25rem;">${eraItem.boy.join(', ')}</div>
          </div>
          <div class="era-name-col">
            <span style="font-size:0.78rem; font-weight:750; color:#ec4899;">👧 여아 대표</span>
            <div style="font-weight:750; font-size:0.95rem; margin-top:0.25rem;">${eraItem.girl.join(', ')}</div>
          </div>
        </div>
      `;
      eraTimelineEl.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // 5. 탭 4: 성씨+이름 풀네임 결합 랭킹 & 보관함
  // --------------------------------------------------------------------------
  const STORAGE_KEY = 'simulab_saved_baby_names';

  function getSavedList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('LocalStorage 접근 실패:', e);
      return [];
    }
  }

  function setSavedList(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      updateSavedBadge();
    } catch (e) {
      console.error('LocalStorage 저장 실패:', e);
    }
  }

  function isFullnameSaved(fullname) {
    const list = getSavedList();
    return list.some(item => item.fullname === fullname);
  }

  function toggleSaveFullname(fullname, surname, name, gender, detail) {
    const list = getSavedList();
    const existingIndex = list.findIndex(item => item.fullname === fullname);

    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
      setSavedList(list);
      return false;
    } else {
      list.unshift({
        fullname,
        surname,
        name,
        gender,
        detail,
        savedAt: new Date().toISOString()
      });
      setSavedList(list);
      return true;
    }
  }

  function updateSavedBadge() {
    const badge = document.getElementById('savedCountBadge');
    if (badge) {
      const count = getSavedList().length;
      badge.textContent = count;
    }
  }

  let currentSurnameFilter = '전체';
  let currentFnGender = 'all';

  const surnameChips = document.querySelectorAll('.surname-chip');
  const customSurnameInput = document.getElementById('customSurnameInput');
  const btnApplyCustomSurname = document.getElementById('btnApplyCustomSurname');
  const fnGenderBtns = document.querySelectorAll('.fn-gender-btn');
  const fullnameRankingList = document.getElementById('fullnameRankingList');
  const fullnameSummaryNotice = document.getElementById('fullnameSummaryNotice');

  const btnOpenSavedModal = document.getElementById('btnOpenSavedModal');
  const btnCloseSavedModal = document.getElementById('btnCloseSavedModal');
  const savedModal = document.getElementById('savedModal');
  const savedNameListContainer = document.getElementById('savedNameListContainer');
  const btnCopyAllSaved = document.getElementById('btnCopyAllSaved');
  const btnClearAllSaved = document.getElementById('btnClearAllSaved');

  function renderFullnames() {
    if (!fullnameRankingList) return;

    const list = BabyNameLogic.getFullnameRankings(currentSurnameFilter, currentFnGender, '2026');
    fullnameRankingList.innerHTML = '';

    if (fullnameSummaryNotice) {
      let genderText = '전체 (남아·여아)';
      if (currentFnGender === 'boy') genderText = '남아 👦';
      else if (currentFnGender === 'girl') genderText = '여아 👧';

      if (currentSurnameFilter === '전체') {
        fullnameSummaryNotice.innerHTML = `
          📌 <strong>2026 대한민국 전국 통합 예상 풀네임 순위</strong> (${genderText}, 통계청 인구 가중치 적용 Top ${list.length})
        `;
      } else {
        fullnameSummaryNotice.innerHTML = `
          📌 <strong>'${currentSurnameFilter}'씨 가문 2026 신생아 인기 이름 결합 순위</strong> (${genderText}, Top ${list.length})
        `;
      }
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'fn-card';

      let rankBadgeHtml = `<span class="fn-rank">${item.rank}</span>`;
      if (item.rank === 1) rankBadgeHtml = `<span class="fn-rank fn-rank-gold">🥇 1</span>`;
      else if (item.rank === 2) rankBadgeHtml = `<span class="fn-rank fn-rank-silver">🥈 2</span>`;
      else if (item.rank === 3) rankBadgeHtml = `<span class="fn-rank fn-rank-bronze">🥉 3</span>`;

      const genderBadgeClass = item.gender === 'boy' ? 'fn-gender-boy' : 'fn-gender-girl';
      const genderText = item.gender === 'boy' ? '남아' : '여아';

      const saved = isFullnameSaved(item.fullname);
      const favClass = saved ? 'fn-btn-fav is-saved' : 'fn-btn-fav';
      const favIcon = saved ? '⭐' : '☆';

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.65rem;">
          ${rankBadgeHtml}
          <div>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span class="fn-name-title">${item.fullname}</span>
              <span class="fn-gender-badge ${genderBadgeClass}">${genderText}</span>
            </div>
            <span class="fn-detail-text">${item.calcNote}</span>
          </div>
        </div>
        <button class="${favClass}" data-fullname="${item.fullname}" title="보관함에 저장하기">
          ${favIcon}
        </button>
      `;

      const favBtn = card.querySelector('.fn-btn-fav');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowSaved = toggleSaveFullname(
          item.fullname,
          item.surname,
          item.name,
          item.gender,
          item.calcNote
        );

        if (nowSaved) {
          favBtn.classList.add('is-saved');
          favBtn.textContent = '⭐';
        } else {
          favBtn.classList.remove('is-saved');
          favBtn.textContent = '☆';
        }

        if (window.SimuLabTracker && window.SimuLabTracker.trackEvent) {
          window.SimuLabTracker.trackEvent('toggle_fav_name', item.fullname);
        }
      });

      fullnameRankingList.appendChild(card);
    });
  }

  surnameChips.forEach(chip => {
    chip.addEventListener('click', () => {
      surnameChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentSurnameFilter = chip.getAttribute('data-surname');
      if (customSurnameInput) customSurnameInput.value = '';
      renderFullnames();
    });
  });

  if (btnApplyCustomSurname && customSurnameInput) {
    function applyCustomSurname() {
      const val = customSurnameInput.value.trim();
      if (!val) {
        alert('조회하고 싶으신 성씨(예: 한, 서, 권, 배 등)를 입력해주세요.');
        customSurnameInput.focus();
        return;
      }
      surnameChips.forEach(c => c.classList.remove('active'));
      currentSurnameFilter = val;
      renderFullnames();
    }

    btnApplyCustomSurname.addEventListener('click', applyCustomSurname);
    customSurnameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyCustomSurname();
    });
  }

  fnGenderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      fnGenderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFnGender = btn.getAttribute('data-gender');
      renderFullnames();
    });
  });

  function openSavedModal() {
    renderSavedList();
    if (savedModal) savedModal.classList.add('open');
  }

  function closeSavedModal() {
    if (savedModal) savedModal.classList.remove('open');
    renderFullnames();
  }

  function renderSavedList() {
    if (!savedNameListContainer) return;
    const list = getSavedList();
    savedNameListContainer.innerHTML = '';

    if (list.length === 0) {
      savedNameListContainer.innerHTML = `
        <div class="saved-empty-box">
          <div style="font-size:2.2rem; margin-bottom:0.5rem;">⭐</div>
          <strong style="font-size:0.95rem; color:var(--text-primary); display:block; margin-bottom:0.3rem;">
            아직 보관함에 담긴 이름이 없습니다.
          </strong>
          <span style="font-size:0.82rem; color:var(--text-muted);">
            풀네임 순위에서 마음에 드는 이름 옆의 별표(☆)를 눌러 후보에 저장해보세요!
          </span>
        </div>
      `;
      return;
    }

    list.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'saved-item-row';

      const genderBadgeClass = item.gender === 'boy' ? 'fn-gender-boy' : 'fn-gender-girl';
      const genderText = item.gender === 'boy' ? '남아' : '여아';

      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:0.82rem; font-weight:800; color:var(--text-muted); width:20px;">${idx + 1}.</span>
          <div>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <strong style="font-size:1.05rem; font-weight:850;">${item.fullname}</strong>
              <span class="fn-gender-badge ${genderBadgeClass}">${genderText}</span>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted);">${item.detail || ''}</span>
          </div>
        </div>
        <button class="btn-saved-delete" data-fullname="${item.fullname}" title="후보에서 삭제">×</button>
      `;

      row.querySelector('.btn-saved-delete').addEventListener('click', () => {
        const updated = getSavedList().filter(x => x.fullname !== item.fullname);
        setSavedList(updated);
        renderSavedList();
      });

      savedNameListContainer.appendChild(row);
    });
  }

  if (btnOpenSavedModal) {
    btnOpenSavedModal.addEventListener('click', openSavedModal);
  }
  if (btnCloseSavedModal) {
    btnCloseSavedModal.addEventListener('click', closeSavedModal);
  }

  if (savedModal) {
    savedModal.addEventListener('click', (e) => {
      if (e.target === savedModal) closeSavedModal();
    });
  }

  if (btnCopyAllSaved) {
    btnCopyAllSaved.addEventListener('click', () => {
      const list = getSavedList();
      if (list.length === 0) {
        alert('보관함에 복사할 이름이 없습니다. 먼저 마음에 드는 이름을 저장해주세요!');
        return;
      }

      let copyText = `👶 [시뮬랩] 내가 찜한 2026 아기이름 후보 목록 (${list.length}개)\n`;
      copyText += `------------------------------------\n`;
      list.forEach((item, idx) => {
        const gText = item.gender === 'boy' ? '남아' : '여아';
        copyText += `${idx + 1}. ${item.fullname} (${gText})\n`;
      });
      copyText += `------------------------------------\n`;
      copyText += `출처: 시뮬랩 대한민국 아기이름 트렌드 (https://simulab.kr)`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(() => {
          alert('✅ 보관함 속 전체 이름 목록이 클립보드에 복사되었습니다!\n가족이나 친구들과 공유해보세요.');
        }).catch(() => {
          prompt('아래 목록을 복사하세요:', copyText);
        });
      } else {
        prompt('아래 목록을 복사하세요:', copyText);
      }
    });
  }

  if (btnClearAllSaved) {
    btnClearAllSaved.addEventListener('click', () => {
      const list = getSavedList();
      if (list.length === 0) return;
      if (confirm('보관함에 저장된 모든 아기이름 후보를 비우시겠습니까?')) {
        setSavedList([]);
        renderSavedList();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 초기 실행
  // --------------------------------------------------------------------------
  updateSavedBadge();
  renderRankings();
  doSearchName('이준');
});
