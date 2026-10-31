/**
 * 내 주변 축제 지도 인터랙티브 스크립트 (FESTA MAP)
 * - Stitch 3번 시안 기반 레이더 맵 & 반경별 핀 렌더링
 * - 테마 레이어(전체/버스킹/플리마켓/푸드트럭/주차장) 토글
 * - 우측 슬라이드 패널 상세 정보 주입 및 타임테이블 연동
 * - 하단 퀵 캐러셀 동기화
 */

(function () {
  'use strict';

  const dataEl = document.getElementById('map-events-data');
  if (!dataEl) return;

  let allFestas = [];
  try {
    allFestas = JSON.parse(dataEl.textContent || '[]');
  } catch (err) {
    console.error('지도 데이터 파싱 실패:', err);
    allFestas = [];
  }

  // 앱 상태
  const state = {
    userLat: 37.5283,
    userLng: 126.9328,
    radiusKm: 3, // 기본 반경 3km
    selectedLayer: 'all', // all | busking | market | foodtruck | parking
    selectedFestaId: allFestas[0]?.id || null,
    zoomLevel: 1.0
  };

  // DOM 캐싱
  const pinsLayerEl = document.getElementById('map-pins-layer');
  const panelEl = document.getElementById('map-detail-panel');
  const panelContentEl = document.getElementById('map-panel-content');
  const panelCloseBtn = document.getElementById('map-panel-close-btn');

  const countAllEl = document.getElementById('count-all-festa');
  const countBuskingEl = document.getElementById('count-busking');
  const countMarketEl = document.getElementById('count-market');
  const countFoodtruckEl = document.getElementById('count-foodtruck');

  const carouselTrackEl = document.getElementById('carousel-cards-track');
  const carouselCountTextEl = document.getElementById('carousel-count-text');

  const radiusTabs = document.querySelectorAll('.radius-tab');
  const layerPills = document.querySelectorAll('.layer-pill');
  const relocateBtn = document.getElementById('map-relocate-btn');

  const zoomInBtn = document.getElementById('btn-zoom-in');
  const zoomOutBtn = document.getElementById('btn-zoom-out');

  // 거리 계산 (Haversine 공식)
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 현재 필터에 부합하는 축제 목록
  function getFilteredFestas() {
    return allFestas.filter(item => {
      // 거리 필터
      const dist = getDistanceKm(state.userLat, state.userLng, item.lat, item.lng);
      if (dist > state.radiusKm * 1.5) return false;

      // 레이어 필터
      if (state.selectedLayer === 'all') return true;
      if (state.selectedLayer === 'parking') return true;
      return item.layers && item.layers[state.selectedLayer];
    });
  }

  // 레이어 카운트 업데이트
  function updateLayerCounts() {
    const radiusFiltered = allFestas.filter(item => {
      const dist = getDistanceKm(state.userLat, state.userLng, item.lat, item.lng);
      return dist <= state.radiusKm * 1.5;
    });

    if (countAllEl) countAllEl.textContent = radiusFiltered.length;
    if (countBuskingEl) countBuskingEl.textContent = radiusFiltered.filter(i => i.layers?.busking).length;
    if (countMarketEl) countMarketEl.textContent = radiusFiltered.filter(i => i.layers?.market).length;
    if (countFoodtruckEl) countFoodtruckEl.textContent = radiusFiltered.filter(i => i.layers?.foodtruck).length;
  }

  // 핀 렌더링
  function renderPins() {
    if (!pinsLayerEl) return;
    pinsLayerEl.innerHTML = '';

    const list = getFilteredFestas();

    list.forEach((item, idx) => {
      // 중심점 기준 상대 좌표 계산
      const dLat = (item.lat - state.userLat);
      const dLng = (item.lng - state.userLng);

      // 화면 배율 스케일링
      const scale = 2400 / (state.radiusKm * state.zoomLevel);
      const xPercent = 50 + (dLng * scale);
      const yPercent = 50 - (dLat * scale);

      // 화면 경계 내에만 렌더링
      if (xPercent < 2 || xPercent > 98 || yPercent < 2 || yPercent > 98) return;

      const marker = document.createElement('div');
      marker.className = `festa-pin-marker theme-${item.theme || 'kids'}`;
      if (item.id === state.selectedFestaId) marker.classList.add('active');

      marker.style.left = `${xPercent}%`;
      marker.style.top = `${yPercent}%`;

      const themeIcons = { light: '✦', food: '◒', nature: '❋', kids: '✳' };
      const icon = themeIcons[item.theme] || '★';

      marker.innerHTML = `
        <div class="festa-pin-bubble">
          <span>${icon}</span>
          <span>${item.title.slice(0, 8)}</span>
        </div>
        <div class="festa-pin-dot"></div>
      `;

      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        selectFesta(item.id);
      });

      pinsLayerEl.appendChild(marker);
    });

    renderCarousel(list);
  }

  // 하단 캐러셀 렌더링
  function renderCarousel(list) {
    if (!carouselTrackEl) return;
    carouselTrackEl.innerHTML = '';

    if (carouselCountTextEl) {
      carouselCountTextEl.textContent = `반경 ${state.radiusKm}km 이내 ${list.length}개 행사 진행 중`;
    }

    if (list.length === 0) {
      carouselTrackEl.innerHTML = '<div style="color: #94a3b8; font-size: 0.85rem; padding: 0.5rem 0;">선택하신 반경 내에 진행 중인 행사가 없습니다. 반경을 넓혀보세요.</div>';
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'c-card';
      if (item.id === state.selectedFestaId) card.classList.add('active');

      const dist = getDistanceKm(state.userLat, state.userLng, item.lat, item.lng).toFixed(1);

      card.innerHTML = `
        <h5 class="c-card-title">${item.title}</h5>
        <div class="c-card-meta">
          <span>📍 ${item.location.slice(0, 10)}</span>
          <span>🚶 ${dist}km</span>
        </div>
      `;

      card.addEventListener('click', () => {
        selectFesta(item.id);
      });

      carouselTrackEl.appendChild(card);
    });
  }

  // 축제 선택 및 우측 상세 패널 열기
  function selectFesta(id) {
    state.selectedFestaId = id;
    const festa = allFestas.find(f => f.id === id);
    if (!festa) return;

    // 활성 핀 및 캐러셀 카드 업데이트
    document.querySelectorAll('.festa-pin-marker.active').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.c-card.active').forEach(c => c.classList.remove('active'));

    // 패널 열기
    if (panelEl) panelEl.classList.remove('closed');

    const dist = getDistanceKm(state.userLat, state.userLng, festa.lat, festa.lng).toFixed(1);
    const walkMin = Math.round(dist * 14);

    if (panelContentEl) {
      panelContentEl.innerHTML = `
        <span class="panel-header-badge">★ 실시간 추천 인기 축제</span>
        ${festa.image?.src ? `<img class="panel-hero-img" src="${festa.image.src}" alt="${festa.title}">` : ''}
        <h3 class="panel-title">${festa.title}</h3>
        <div class="panel-loc-meta">
          <span>📍 ${festa.region} · ${festa.location}</span>
          <span>🚶 현재 위치에서 약 ${dist}km (도보 약 ${walkMin}분)</span>
        </div>

        <div class="panel-status-strip">
          <div>
            <span class="status-cell-title">푸드트럭</span>
            <span class="status-cell-val">운영 중</span>
          </div>
          <div>
            <span class="status-cell-title">주차 여유</span>
            <span class="status-cell-val">인근 공영</span>
          </div>
          <div>
            <span class="status-cell-title">현재 날씨</span>
            <span class="status-cell-val">19°C 맑음</span>
          </div>
        </div>

        <div class="panel-timetable-box">
          <h4 class="timetable-title">오늘의 주요 타임테이블</h4>
          <div class="timetable-item">
            <span class="tt-time">14:00</span>
            <span class="tt-desc">인디 버스킹 &amp; 플리마켓 오프닝</span>
          </div>
          <div class="timetable-item">
            <span class="tt-time">17:00</span>
            <span class="tt-desc">메인 무대 라이브 공연 <span class="tt-live-tag">LIVE</span></span>
          </div>
          <div class="timetable-item">
            <span class="tt-time">20:30</span>
            <span class="tt-desc">야간 조명 연출 &amp; 수변 산책 피날레</span>
          </div>
        </div>

        <p style="margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.5;">
          ${festa.program}
        </p>

        <a class="panel-cta-btn" href="${festa.officialUrl}" target="_blank" rel="noopener">
          축제 공식 사이트 바로가기 ↗
        </a>
      `;
    }
  }

  // 이벤트 리스너 등록
  radiusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      radiusTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.radiusKm = Number(tab.dataset.radius);
      updateLayerCounts();
      renderPins();
    });
  });

  layerPills.forEach(pill => {
    pill.addEventListener('click', () => {
      layerPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.selectedLayer = pill.dataset.layer;
      renderPins();
    });
  });

  if (panelCloseBtn) {
    panelCloseBtn.addEventListener('click', () => {
      if (panelEl) panelEl.classList.add('closed');
    });
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      state.zoomLevel = Math.min(2.5, state.zoomLevel + 0.25);
      renderPins();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      state.zoomLevel = Math.max(0.6, state.zoomLevel - 0.25);
      renderPins();
    });
  }

  if (relocateBtn) {
    relocateBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            state.userLat = pos.coords.latitude;
            state.userLng = pos.coords.longitude;
            const locValEl = document.getElementById('user-location-val');
            if (locValEl) locValEl.textContent = '📍 현재 GPS 감지 위치';
            updateLayerCounts();
            renderPins();
          },
          () => {
            alert('현재 위치 정보를 가져올 수 없어 기본 위치(서울 여의도)로 설정됩니다.');
          }
        );
      } else {
        alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
      }
    });
  }

  // 초기화
  updateLayerCounts();
  renderPins();
  if (state.selectedFestaId) {
    selectFesta(state.selectedFestaId);
  }

})();
