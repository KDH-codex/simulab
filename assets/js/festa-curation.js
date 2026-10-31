/**
 * 테마별 큐레이션 인터랙티브 스크립트 (FESTA CURATION)
 * - 트렌딩 해시태그 및 7대 테마 리본 인터랙션
 * - 하단 풀 아카이브 카드 동적 필터링 및 렌더링
 */

(function () {
  'use strict';

  const dataEl = document.getElementById('curation-data');
  if (!dataEl) return;

  let curationData = { themedEvents: [], editorsPicks: [] };
  try {
    curationData = JSON.parse(dataEl.textContent || '{}');
  } catch (err) {
    console.error('큐레이션 데이터 파싱 실패:', err);
    return;
  }

  const { themedEvents, editorsPicks } = curationData;

  // 전체 축제 목록 취합
  const allThemedMap = new Map();
  themedEvents.forEach(t => {
    (t.events || []).forEach(e => {
      if (!allThemedMap.has(e.id)) {
        allThemedMap.set(e.id, { ...e, themeTitle: t.title, themeTag: t.tag });
      }
    });
  });
  const allEventsList = [...allThemedMap.values()];

  // DOM 캐싱
  const archiveGridEl = document.getElementById('cur-archive-cards');
  const archiveTitleEl = document.getElementById('cur-archive-title');
  const trendChips = document.querySelectorAll('.trend-tag-chip');
  const ribbonCards = document.querySelectorAll('.cur-ribbon-card');

  let currentFilter = 'all';

  // 아카이브 카드 렌더링
  function renderArchiveCards(filterKey) {
    if (!archiveGridEl) return;
    archiveGridEl.innerHTML = '';

    let list = [];
    if (filterKey === 'all') {
      list = allEventsList;
      if (archiveTitleEl) archiveTitleEl.textContent = `선택된 테마 축제 전체 보기 (총 ${list.length}개)`;
    } else {
      const foundTheme = themedEvents.find(t => t.key === filterKey);
      list = foundTheme ? foundTheme.events : [];
      if (archiveTitleEl) {
        archiveTitleEl.textContent = `${foundTheme ? foundTheme.title : '선택된 테마'} 컬렉션 (총 ${list.length}개)`;
      }
    }

    if (list.length === 0) {
      archiveGridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: #94a3b8;">
          선택하신 테마에 등록된 일정이 없습니다.
        </div>
      `;
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'cur-card';

      const dateStr = item.startDate === item.endDate
        ? item.startDate
        : `${item.startDate} ~ ${item.endDate}`;

      card.innerHTML = `
        ${item.image?.src ? `<img class="cur-card-img" src="${item.image.src}" alt="${item.title}" loading="lazy">` : ''}
        <div class="cur-card-body">
          <div>
            <h4 class="cur-card-title">${item.title}</h4>
            <div class="cur-card-meta">
              <span>📍 ${item.region} · ${item.location}</span>
              <span>📅 ${dateStr}</span>
            </div>
          </div>
          <div class="cur-card-footer">
            <span class="cur-card-fee">${item.fee}</span>
            <a class="cur-card-btn" href="${item.officialUrl}" target="_blank" rel="noopener">
              공식 상세 ↗
            </a>
          </div>
        </div>
      `;

      archiveGridEl.appendChild(card);
    });
  }

  // 필터 활성화 함수
  function setFilter(filterKey, scrollToArchive = false) {
    currentFilter = filterKey;

    // 태그 칩 활성화 상태 동기화
    trendChips.forEach(chip => {
      if (chip.dataset.filter === filterKey) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    renderArchiveCards(filterKey);

    if (scrollToArchive && archiveGridEl) {
      archiveGridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // 트렌딩 태그 칩 클릭 리스너
  trendChips.forEach(chip => {
    chip.addEventListener('click', () => {
      setFilter(chip.dataset.filter, false);
    });
  });

  // 7대 테마 리본 카드 클릭 리스너
  ribbonCards.forEach(card => {
    card.addEventListener('click', () => {
      const themeKey = card.dataset.theme;
      setFilter(themeKey, true);
    });
  });

  // 초기 렌더링
  renderArchiveCards('all');

})();
