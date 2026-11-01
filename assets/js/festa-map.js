/**
 * 내 주변 축제 지도 인터랙티브 엔진 (FESTA MAP)
 * - Leaflet 기반 고화질 실제 인터랙티브 지도 렌더링
 * - 반경 1km/3km/5km/10km 레이더 원 오버레이
 * - 축제 마커 핀 클릭 시 우측 상세 패널 연동
 * - 네이버 지도 / 카카오맵 원클릭 길찾기 연동
 * - 하단 핫 축제 캐러셀 연동
 */

(function () {
  'use strict';

  // 축제 JSON 데이터 로드
  const dataEl = document.getElementById('map-events-data');
  if (!dataEl) return;

  let allFestas = [];
  try {
    allFestas = JSON.parse(dataEl.textContent || '[]');
  } catch (err) {
    console.error('지도 데이터 파싱 실패:', err);
    allFestas = [];
  }

  // 상태 관리 객체
  const state = {
    userLat: 37.5283, // 기본값: 서울 여의도 한강공원
    userLng: 126.9328,
    radiusKm: 3, // 기본 반경: 3km
    selectedLayer: 'all', // all | busking | market | foodtruck | parking
    selectedFestaId: allFestas[0]?.id || null,
    map: null,
    userMarker: null,
    radarCircle: null,
    markersGroup: null
  };

  // DOM 엘리먼트 캐싱
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

  // Haversine 두 지점 간 거리(km) 계산 공식
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  // 1. Leaflet 지도 초기화
  function initLeafletMap() {
    const mapContainer = document.getElementById('leaflet-map-container');
    if (!mapContainer || typeof L === 'undefined') return;

    // 실제 Leaflet 맵 객체 생성
    state.map = L.map('leaflet-map-container', {
      center: [state.userLat, state.userLng],
      zoom: 14,
      zoomControl: false // 커스텀 줌 컨트롤 또는 우측 하단 배치
    });

    // 줌 컨트롤 우측 하단에 배치
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);

    // 고화질 CartoDB / OSM 지도 타일 로드 (실제 한국어 지명 및 한강, 도로 표시)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(state.map);

    // 마커 그룹 레이어 생성
    state.markersGroup = L.layerGroup().addTo(state.map);

    // 내 위치 마커 생성 (펄스 애니메이션 파란 점)
    const userIcon = L.divIcon({
      className: 'custom-my-location-marker',
      html: `
        <div class="my-location-marker-inner">
          <div class="my-loc-pulse"></div>
          <div class="my-loc-dot"></div>
          <span class="my-loc-tooltip">여의도 한강공원 (내 위치)</span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    state.userMarker = L.marker([state.userLat, state.userLng], {
      icon: userIcon,
      zIndexOffset: 1000
    }).addTo(state.map);

    // 탐색 반경 동심원 (레이더 서클) 그리기
    updateRadarCircle();

    // 축제 마커 핀 그리기
    renderMarkers();

    // URL 파라미터로 특정 축제 focus가 넘어온 경우
    const urlParams = new URLSearchParams(window.location.search);
    const focusId = urlParams.get('focus');
    if (focusId) {
      const target = allFestas.find(f => f.id === focusId);
      if (target) {
        selectFesta(target, true);
      }
    } else if (allFestas.length > 0) {
      selectFesta(allFestas[0], false);
    }
  }

  // 2. 반경 원 갱신
  function updateRadarCircle() {
    if (!state.map) return;
    if (state.radarCircle) {
      state.map.removeLayer(state.radarCircle);
    }

    state.radarCircle = L.circle([state.userLat, state.userLng], {
      radius: state.radiusKm * 1000,
      color: '#ff5a1f',
      weight: 2,
      opacity: 0.6,
      dashArray: '6, 6',
      fillColor: '#ff5a1f',
      fillOpacity: 0.06
    }).addTo(state.map);

    // 반경에 맞춰 줌 레벨 조정
    if (state.radiusKm <= 1) state.map.setZoom(15);
    else if (state.radiusKm <= 3) state.map.setZoom(14);
    else if (state.radiusKm <= 5) state.map.setZoom(13);
    else state.map.setZoom(12);
  }

  // 3. 필터 조건에 맞는 축제 목록 추출
  function getFilteredFestas() {
    return allFestas.filter(item => {
      // 거리 계산
      const dist = getDistanceKm(state.userLat, state.userLng, item.lat, item.lng);
      item.liveDist = dist;

      // 반경 필터 (반경 1.5배까지 유연하게 탐색)
      if (dist > state.radiusKm * 1.6) return false;

      // 레이어 테마 필터
      if (state.selectedLayer === 'all') return true;
      if (state.selectedLayer === 'busking') {
        return item.theme === 'kids' || item.title.includes('음악') || item.title.includes('버스킹') || item.title.includes('밴드');
      }
      if (state.selectedLayer === 'market') {
        return item.theme === 'food' || item.title.includes('마켓') || item.title.includes('플리마켓');
      }
      if (state.selectedLayer === 'foodtruck') {
        return item.theme === 'food';
      }
      if (state.selectedLayer === 'parking') {
        return true;
      }
      return true;
    });
  }

  // 4. 지도 위의 축제 핀 마커 렌더링
  function renderMarkers() {
    if (!state.markersGroup) return;
    state.markersGroup.clearLayers();

    const filtered = getFilteredFestas();

    // 레이어 카운터 숫자 갱신
    updateLayerCounts();

    filtered.forEach(item => {
      const isSelected = item.id === state.selectedFestaId;
      const themeTone = getThemeTone(item.theme);

      // 커스텀 SVG 축제 마커 아이콘
      const pinIcon = L.divIcon({
        className: 'custom-festa-leaflet-pin',
        html: `
          <div class="festa-pin-container ${isSelected ? 'is-active' : ''} tone-${themeTone}">
            <div class="festa-pin-bubble">
              <span class="festa-pin-symbol">${getThemeEmoji(item.theme)}</span>
              <span class="festa-pin-text">${esc(item.title.slice(0, 9))}</span>
            </div>
            <div class="festa-pin-point"></div>
          </div>
        `,
        iconSize: [110, 44],
        iconAnchor: [55, 42]
      });

      const marker = L.marker([item.lat, item.lng], { icon: pinIcon });
      marker.on('click', () => {
        selectFesta(item, true);
      });
      state.markersGroup.addLayer(marker);
    });

    // 하단 캐러셀 갱신
    renderBottomCarousel(filtered);
  }

  function getThemeTone(theme) {
    if (theme === 'light') return 'indigo';
    if (theme === 'food') return 'amber';
    if (theme === 'nature') return 'emerald';
    if (theme === 'kids') return 'violet';
    return 'sky';
  }

  function getThemeEmoji(theme) {
    if (theme === 'light') return '✦';
    if (theme === 'food') return '◒';
    if (theme === 'nature') return '❋';
    if (theme === 'kids') return '✳';
    return '★';
  }

  // 5. 특정 축제 선택 및 우측 상세 패널 열기
  function selectFesta(item, panToCenter) {
    if (!item) return;
    state.selectedFestaId = item.id;

    if (panToCenter && state.map) {
      state.map.panTo([item.lat, item.lng], { animate: true, duration: 0.5 });
    }

    // 마커 재렌더링하여 활성 클래스 부여
    renderMarkers();

    // 우측 패널 내용 채우기
    if (panelContentEl) {
      panelContentEl.innerHTML = `
        <div class="map-panel-hero">
          <img class="map-panel-img" src="${item.imageUrl}" alt="${esc(item.title)}">
          <span class="map-panel-badge">${esc(item.region)} · ${item.feeLabel}</span>
        </div>
        <div class="map-panel-body">
          <div class="map-panel-subrow">
            <span class="map-panel-dist">📍 현재 위치에서 약 ${item.distKm}km</span>
            <span class="map-panel-fee">${item.feeStatus === 'free' ? '무료관람' : '입장요금 있음'}</span>
          </div>
          <h3 class="map-panel-title">${esc(item.title)}</h3>
          <p class="map-panel-venue">개최 장소: <strong>${esc(item.venue || item.location)}</strong></p>
          <p class="map-panel-dates">행사 일정: ${item.startDate} ~ ${item.endDate}</p>

          <!-- 오늘의 타임테이블 -->
          <div class="map-timetable-card">
            <h4>오늘의 주요 타임테이블</h4>
            <ul>
              ${(item.buskingTimes || ['14:00 오프닝', '17:00 라이브 무대', '20:30 야간 불꽃쇼']).map(t => `<li><span class="time-dot"></span>${esc(t)}</li>`).join('')}
            </ul>
          </div>

          <!-- 현장 시설 현황 -->
          <div class="map-facilities-row">
            <div class="fac-box">
              <span class="fac-label">푸드트럭</span>
              <strong class="fac-val">${item.facilities?.foodtrucks || 5}대 운영</strong>
            </div>
            <div class="fac-box">
              <span class="fac-label">주차 현황</span>
              <strong class="fac-val text-amber">${item.facilities?.parkingStatus || '여유'}</strong>
            </div>
            <div class="fac-box">
              <span class="fac-label">현재 날씨</span>
              <strong class="fac-val">${item.facilities?.weather || '19°C 맑음'}</strong>
            </div>
          </div>

          <!-- 네이버 / 카카오 지도 길찾기 및 공식 링크 버튼 -->
          <div class="map-panel-actions">
            <a class="btn-panel-naver" href="https://map.naver.com/v5/search/${encodeURIComponent(item.venue || item.title)}" target="_blank" rel="noopener noreferrer">
              <span>네이버 지도 길찾기 ↗</span>
            </a>
            <a class="btn-panel-kakao" href="https://map.kakao.com/link/search/${encodeURIComponent(item.venue || item.title)}" target="_blank" rel="noopener noreferrer">
              <span>카카오맵으로 보기 ↗</span>
            </a>
          </div>

          <a class="btn-panel-official" href="${item.officialUrl || '/events/' + encodeURIComponent(item.id) + '/'}" target="_blank" rel="noopener noreferrer">
            축제 공식 사이트 바로가기 ↗
          </a>
        </div>
      `;

      if (panelEl) {
        panelEl.classList.add('is-open');
      }
    }
  }

  // 6. 하단 퀵 캐러셀 바 렌더링
  function renderBottomCarousel(list) {
    if (!carouselTrackEl) return;
    carouselTrackEl.innerHTML = '';

    if (carouselCountTextEl) {
      carouselCountTextEl.textContent = `반경 ${state.radiusKm}km 내 ${list.length}개 행사 진행 중`;
    }

    list.forEach(item => {
      const isSelected = item.id === state.selectedFestaId;
      const card = document.createElement('div');
      card.className = `c-card ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        <img class="c-card-img" src="${item.imageUrl}" alt="${esc(item.title)}" loading="lazy">
        <div class="c-card-info">
          <span class="c-card-dist">${item.distKm}km</span>
          <h4 class="c-card-title">${esc(item.title)}</h4>
          <p class="c-card-meta">${esc(item.venue)}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        selectFesta(item, true);
      });

      carouselTrackEl.appendChild(card);
    });
  }

  // 7. 레이어 카운트 업데이트
  function updateLayerCounts() {
    const radiusFiltered = allFestas.filter(item => {
      const dist = getDistanceKm(state.userLat, state.userLng, item.lat, item.lng);
      return dist <= state.radiusKm * 1.6;
    });

    if (countAllEl) countAllEl.textContent = radiusFiltered.length;
    if (countBuskingEl) countBuskingEl.textContent = radiusFiltered.filter(i => i.theme === 'kids' || i.title.includes('음악') || i.title.includes('버스킹')).length;
    if (countMarketEl) countMarketEl.textContent = radiusFiltered.filter(i => i.theme === 'food' || i.title.includes('마켓')).length;
    if (countFoodtruckEl) countFoodtruckEl.textContent = radiusFiltered.filter(i => i.theme === 'food').length;
  }

  // 8. 이벤트 바인딩
  // 반경 탭 클릭
  radiusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      radiusTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.radiusKm = Number(tab.getAttribute('data-radius') || 3);
      updateRadarCircle();
      renderMarkers();
    });
  });

  // 레이어 필 클릭
  layerPills.forEach(pill => {
    pill.addEventListener('click', () => {
      layerPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.selectedLayer = pill.getAttribute('data-layer') || 'all';
      renderMarkers();
    });
  });

  // 우측 패널 닫기 버튼
  if (panelCloseBtn && panelEl) {
    panelCloseBtn.addEventListener('click', () => {
      panelEl.classList.remove('is-open');
    });
  }

  // GPS 내 위치 재설정 버튼
  if (relocateBtn) {
    relocateBtn.addEventListener('click', () => {
      if ('geolocation' in navigator) {
        relocateBtn.textContent = '위치 확인 중...';
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            state.userLat = pos.coords.latitude;
            state.userLng = pos.coords.longitude;
            const locValEl = document.getElementById('user-location-val');
            if (locValEl) locValEl.textContent = '📍 현재 GPS 감지 위치';

            if (state.userMarker) {
              state.userMarker.setLatLng([state.userLat, state.userLng]);
            }
            if (state.map) {
              state.map.setView([state.userLat, state.userLng], 14);
            }
            updateRadarCircle();
            renderMarkers();
            relocateBtn.innerHTML = '<span class="material-symbols-outlined">my_location</span> 내 위치';
          },
          (err) => {
            alert('위치 정보를 가져올 수 없습니다. 기본 위치(서울 여의도)로 유지합니다.');
            relocateBtn.innerHTML = '<span class="material-symbols-outlined">my_location</span> 내 위치';
          },
          { timeout: 7000 }
        );
      } else {
        alert('이 브라우저는 위치 정보(GPS)를 지원하지 않습니다.');
      }
    });
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // DOM 로드 완료 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeafletMap);
  } else {
    initLeafletMap();
  }

})();
