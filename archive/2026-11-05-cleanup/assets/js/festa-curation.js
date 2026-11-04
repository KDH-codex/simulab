/**
 * FESTA CURATION - 테마별 큐레이션 매거진 & 동적 필터 스크립트
 * 시뮬랩(Simulab) 전국 55개 축제 테마 아카이브 인터랙션
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

  const { themedEvents } = curationData;

  // 전체 축제 목록 취합 (중복 제거)
  const allThemedMap = new Map();
  themedEvents.forEach(t => {
    (t.events || []).forEach(e => {
      if (!allThemedMap.has(e.id)) {
        allThemedMap.set(e.id, {
          ...e,
          themeTitle: t.title,
          themeTag: t.tag,
          themeIcon: t.icon,
          themeColor: t.color
        });
      }
    });
  });
  const allEventsList = [...allThemedMap.values()];

  // DOM 캐싱
  const archiveGridEl = document.getElementById('cur-archive-cards');
  const archiveTitleEl = document.getElementById('cur-archive-title');
  const trendChips = document.querySelectorAll('.trend-tag-chip');
  const ribbonCards = document.querySelectorAll('.cur-ribbon-card');

  // 아카이브 카드 렌더링 (부드러운 전환 효과 적용)
  function renderArchiveCards(filterKey, shouldScroll = false) {
    if (!archiveGridEl) return;

    // 부드러운 전환 효과: 페이드아웃 후 데이터 교체 및 페이드인
    archiveGridEl.style.opacity = '0';
    archiveGridEl.style.transform = 'translateY(12px)';

    setTimeout(() => {
      archiveGridEl.innerHTML = '';

      let list = [];
      if (filterKey === 'all') {
        list = allEventsList;
        if (archiveTitleEl) archiveTitleEl.textContent = `전체 테마 축제 아카이브 (${list.length}개)`;
      } else {
        const foundTheme = themedEvents.find(t => t.key === filterKey);
        list = foundTheme ? foundTheme.events : [];
        if (archiveTitleEl) {
          archiveTitleEl.textContent = `${foundTheme ? foundTheme.title : '선택된 테마'} 컬렉션 (${list.length}개)`;
        }
      }

      if (list.length === 0) {
        archiveGridEl.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 4rem 1rem; text-align: center; color: var(--muted); font-size: 15px;">
            <span class="material-symbols-outlined" style="font-size: 42px; display: block; margin-bottom: 8px; color: var(--outline);">search_off</span>
            선택하신 테마에 등록된 축제 일정이 없습니다.
          </div>
        `;
      } else {
        const fragment = document.createDocumentFragment();

        list.forEach(item => {
          const card = document.createElement('article');
          card.className = 'cur-card';

          const dateStr = item.startDate === item.endDate
            ? item.startDate.replaceAll('-', '.')
            : `${item.startDate.replaceAll('-', '.')} ~ ${item.endDate.replaceAll('-', '.')}`;

          card.innerHTML = `
            <div class="cur-card-img-wrap">
              ${item.image?.src
                ? `<img class="cur-card-img" src="${item.image.src}" alt="${item.title}" loading="lazy">`
                : `<div style="width:100%; height:100%; display:grid; place-items:center; background:var(--wash); color:var(--muted); font-size:24px;">✦</div>`
              }
              <span class="cur-card-badge">${item.region}</span>
            </div>
            <div class="cur-card-body">
              <div>
                <h3 class="cur-card-title">${item.title}</h3>
                <div class="cur-card-meta">
                  <span>
                    <span class="material-symbols-outlined" style="font-size:14px;">location_on</span>
                    <span>${item.location}</span>
                  </span>
                  <span>
                    <span class="material-symbols-outlined" style="font-size:14px;">calendar_today</span>
                    <span>${dateStr}</span>
                  </span>
                </div>
              </div>
              <div class="cur-card-footer">
                <span class="cur-card-fee">${item.fee}</span>
                <div class="cur-card-actions">
                  <a class="cur-card-btn primary" href="${item.url}">
                    <span>상세보기</span>
                    <span class="material-symbols-outlined" style="font-size:14px;">arrow_forward</span>
                  </a>
                  <a class="cur-card-btn secondary" href="${item.officialUrl}" target="_blank" rel="noopener noreferrer" title="공식 안내 사이트 ↗">
                    <span class="material-symbols-outlined" style="font-size:14px;">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          `;

          fragment.appendChild(card);
        });

        archiveGridEl.appendChild(fragment);
      }

      // 페이드인 완료
      requestAnimationFrame(() => {
        archiveGridEl.style.transition = 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        archiveGridEl.style.opacity = '1';
        archiveGridEl.style.transform = 'translateY(0)';
      });

      if (shouldScroll) {
        const sec = document.getElementById('archive-section');
        if (sec) {
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 180);
  }

  // 필터 활성화 함수
  function setFilter(filterKey, shouldScroll = false) {
    // 트렌딩 칩 활성화 상태 동기화
    trendChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === filterKey);
    });

    // 7대 테마 리본 카드 활성화 상태 동기화
    ribbonCards.forEach(card => {
      card.classList.toggle('active', card.dataset.theme === filterKey);
    });

    renderArchiveCards(filterKey, shouldScroll);
  }

  // 트렌딩 태그 클릭 이벤트
  trendChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.filter || 'all';
      setFilter(key, false);
    });
  });

  // 7대 리본 카드 클릭 이벤트
  ribbonCards.forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.theme;
      setFilter(key, true);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // 찜(북마크) 개수 동기화
  function syncBookmarkBadge() {
    try {
      const raw = localStorage.getItem('festa_saved_events');
      const ids = raw ? JSON.parse(raw) : [];
      document.querySelectorAll('[data-saved-count-badge]').forEach(el => {
        el.textContent = String(ids.length);
        el.hidden = ids.length === 0;
      });
    } catch (e) {}
  }

  // URL 해시 확인 (#food, #light 등)
  function checkUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['food', 'light', 'nature', 'art', 'kids', 'heritage', 'market'].includes(hash)) {
      setFilter(hash, true);
    } else {
      renderArchiveCards('all', false);
    }
  }

  // 초기화
  window.addEventListener('DOMContentLoaded', () => {
    checkUrlHash();
    syncBookmarkBadge();
  });
})();
