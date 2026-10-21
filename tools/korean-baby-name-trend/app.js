/**
 * ==========================================================================
 * [별별 통계] 대한민국 아기이름 트렌드 UI 컨트롤러 (app.js)
 * --------------------------------------------------------------------------
 * 탭 전환, 랭킹 리스트 렌더링, 시계열 순위 Canvas 차트 시각화
 * ==========================================================================
 */

import { BabyNameLogic } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 탭 네비게이션
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
    });
  });

  // --------------------------------------------------------------------------
  // 2. 탭 1: 연도별 Top 랭킹 뷰
  // --------------------------------------------------------------------------
  const yearSelect = document.getElementById('yearSelect');
  const genderBoyBtn = document.getElementById('genderBoyBtn');
  const genderGirlBtn = document.getElementById('genderGirlBtn');
  const rankingListEl = document.getElementById('rankingList');
  const rankingSummaryEl = document.getElementById('rankingSummary');

  let currentYear = '2024';
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

    // 이름 클릭 시 바로 검색 탭으로 연결
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
  // 3. 탭 2: 내 이름 순위 검색기
  // --------------------------------------------------------------------------
  const nameSearchInput = document.getElementById('nameSearchInput');
  const btnSearchName = document.getElementById('btnSearchName');
  const searchResultBox = document.getElementById('searchResultBox');
  const historyCanvas = document.getElementById('historyCanvas');
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
        <h4 style="font-size:0.92rem; font-weight:750; margin-bottom:0.5rem;">📈 2008~2024년 순위 변천사 (높을수록 1위)</h4>
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

    const years = ['2008', '2014', '2018', '2022', '2024'];
    const maxRank = 100; // 100위 기준
    const minRank = 1;

    // Y축: 1위가 맨 위, 100위가 맨 아래
    function getY(rank) {
      const safeRank = Math.min(Math.max(rank, 1), 100);
      return padding.top + ((safeRank - minRank) / (maxRank - minRank)) * (height - padding.top - padding.bottom);
    }

    function getX(idx) {
      return padding.left + (idx / (years.length - 1)) * (width - padding.left - padding.right);
    }

    ctx.clearRect(0, 0, width, height);

    // 1. 가로 그리드선 (1위, 20위, 50위, 100위)
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

    // 2. X축 연도 라벨
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    years.forEach((yr, idx) => {
      const x = getX(idx);
      ctx.fillText(yr + '년', x, height - padding.bottom + 8);
    });

    // 3. 꺾은선 그래프
    const points = [];
    years.forEach((yr, idx) => {
      const r = history[yr] || 100;
      points.push({ x: getX(idx), y: getY(r), rank: history[yr] });
    });

    // 선 그리기
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 점 및 순위 숫자 라벨
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

  // 초기 랭킹 1회 렌더링
  renderRankings();
  // 기본 검색 예시 1회 실행
  doSearchName('이준');
});
