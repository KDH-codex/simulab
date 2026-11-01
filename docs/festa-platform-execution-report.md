# FESTA CALENDAR 플랫폼 전면 고도화 기획 및 실행 종합 보고서
**프로젝트**: 시뮬랩(Simulab) 전국 축제 탐색 포털 (`https://simulab.kr/`)  
**기반 레퍼런스**: Google Stitch 축제 캘린더 플랫폼 (Project ID: `16870204999804682049`, 14개 화면) 및 Festive Pulse 디자인 시스템  
**작성 일시**: 2026-11-01  
**상태**: Step 1 ~ Step 7 전 단계 구현, 무결성 검증, 핫픽스 및 실서버 배포 완료 (`origin/main`)

---

## 1. 프로젝트 배경 및 목표

기존 시뮬랩 사이트는 전국 55개 검증된 축제와 184개 가족 정보 데이터가 충실히 수집되어 있었으나, 모바일 최적화 GUI, 인터랙티브 지도, 동적 필터링, 부드러운 전환 효과(Smooth Transitions) 측면에서 사용자 경험(UX) 개선이 요구되었습니다.

이에 따라 Google Stitch의 **14개 기획 화면**과 **Festive Pulse 디자인 가이드**를 토대로 사이트 구조를 전면 개편하고, 모바일 및 데스크톱 모두에서 매끄럽게 동작하는 고품질 축제 플랫폼으로 고도화하였습니다.

### 핵심 달성 원칙
1. **데이터 및 사진 100% 무손실 보존**: 기존 46장 고화질 로컬 축제 사진(`assets/img/festivals/`)과 55개 축제 데이터, 184개 가족 정보, 29종 생활 도구의 영구 보존.
2. **카피 앤 페이스트(Copy & Paste) 보장**: 모든 스크립트와 템플릿의 생략 없는 전체 코드 작성 및 빌드 자동화.
3. **모바일 퍼스트 반응형 UX**: 모바일 화면 폭 360~400px에서도 헤더 깨짐이 없는 단일 뷰포트 레이아웃 및 하단 5탭 고정 내비게이션 바(`.mobile-bottom-nav`) 구축.

---

## 2. 단계별 구현 및 개선 상세 내역

### [Step 1] 공통 기반 및 메인 홈 (`/`) 고도화
* **적용 파일**: `scripts/build-festa-home.mjs`, `assets/css/festa-home.css`, `assets/js/festa-home.js`, `index.html`
* **주요 구현 내용**:
  - **Festive Pulse 디자인 토큰**: 비비드 오렌지(`#ff5a1f`), 딥 바이올렛(`#5300e6`), 틸 그린(`#0d7a6f`), 다크 네이비 카드(`#131b2e`) 적용.
  - **3대 핵심 허브 바로가기 배너**: `축제달력`, `내주변 지도 RADAR`, `테마별 큐레이션` 원클릭 퀵 카드.
  - **부드러운 슬라이더 전환 효과**:
    - `< 02 / 03 >` 버튼 호버 시 보라색 링 글로우 애니메이션 및 스프링 감속 곡선(`cubic-bezier(0.16, 1, 0.3, 1)`).
    - 캐러셀 전환 시 사진 크로스페이드(`heroPhotoFade`) 및 텍스트 슬라이드인(`heroSlideFade`).
  - **모바일 7일 가로 날짜 스트립 & 아코디언 달력**: 모바일 화면에서 스크롤 부담 없이 오늘부터 7일간의 축제를 날짜별로 즉시 확인.
  - **모바일 하단 5탭 내비게이션 바**: 홈 / 달력 / 내주변 지도 / 큐레이션 / 찜 보관함.

---

### [Step 2] 날짜별 축제 탐색기 (`/calendar/`) 구축
* **적용 파일**: `scripts/build-calendar-page.mjs`, `assets/css/festa-calendar.css`, `assets/js/festa-calendar.js`, `calendar/index.html`
* **주요 구현 내용**:
  - **3대 뷰 전환 스위치**:
    1. `월간 캘린더 그리드`: 전체 한 달 축제 일정을 날짜 셀별로 조망.
    2. `달력·지도 5:7 분할 뷰`: 좌측 달력 날짜 선택 시 우측에 축제 카드와 미니 맵 연동.
    3. `타임라인 리스트 뷰`: 일정별 세로 타임라인으로 탐색.
  - **46장 로컬 축제 실사 사진 100% 정상 연동 복구**: 이미지 데이터 필드 매핑 규칙(`images[e.id]?.src`)을 완벽하게 맞추어 고화질 썸네일 노출.
  - **에디터 추천 1일 연계 코스 & 날씨/복장 팁**: 자전거/도보 이동 시간 및 현장 꿀팁 안내.

---

### [Step 3] 전국 55개 축제 상세 페이지 (`/events/{id}/`) 구축
* **적용 파일**: `scripts/build-festa-details.mjs`, `assets/css/festa-detail.css`, `assets/js/festa-detail.js`, `events/**/index.html`
* **주요 구현 내용**:
  - **데스크톱 2열 68:32 레이아웃 (Stitch 2025_2 규격)**: 좌측 68% 본문 블록 + 우측 32% 스티키 액션 박스.
  - **Ambient Photo Hero**: 고화질 실사 배경 + 실시간 D-Day 뱃지(`D-N` / `LIVE` / `종료`) + 주최 측 공식 검증 완료 뱃지.
  - **스티키 서브탭 스크롤 스파이 (ScrollSpy)**: `#overview`(핵심 요약) → `#schedule`(운영 일정) → `#visit`(오시는 길) → `#checklist`(준비물) → `#sources`(공식 출처) 자동 하이라이트.
  - **대화형 나들이 준비물 체크리스트**:
    - 편한 운동화, 보조 배터리, 돗자리/물티슈, 겉옷 등 4대 필수품.
    - 체크박스 클릭 시 취소선 및 상단 `N/4 완료` 배지 실시간 동기화.
    - 브라우저 로컬스토리지(`localStorage`)에 저장되어 새로고침 후에도 체크 상태 영구 보존.
  - **캘린더 일정 등록 (.ics) & 길찾기 딥링크**:
    - 구글·애플 캘린더에 축제 날짜와 장소를 바로 등록하는 `.ics` 파일 자동 생성 다운로드.
    - 네이버 지도 및 카카오맵 원클릭 길찾기 검색 딥링크 제공.
  - **모바일 하단 플로팅 액션 바**: 화면 폭 768px 이하에서 하단에 고정되어 [찜하기] + [길찾기] + [공식 사이트 보기] 3대 액션 제공.

---

### [Step 4] 취향 맞춤 테마별 큐레이션 (`/curation/`) 구축
* **적용 파일**: `scripts/build-curation-page.mjs`, `assets/css/festa-curation.css`, `assets/js/festa-curation.js`, `curation/index.html`
* **주요 구현 내용**:
  - **보케 조명 히어로 배너 & 실시간 트렌드 해시태그 바**: `#미식페스타`, `#불꽃야간축제`, `#가을꽃산책`, `#아이와함께`, `#스트리트버스킹`, `#로컬마켓` 칩 클릭 시 해당 축제로 부드러운 스크롤 & 페이드인 필터링.
  - **취향 맞춤 7대 테마 리본 카드**: 미식, 불꽃야경, 자연정원, 문화예술, 키즈체험, 전통역사, 플리마켓.
  - **에디터스 픽 7:5 벤토 쇼케이스 & 민서영 수석 큐레이터 꿀팁 스트립**: 이번 주 최고 추천 축제 대형 하이라이트 카드와 서브 카드 4종.
  - **1일 추천 완벽 코스 타임라인**: 10:30 모닝 플리마켓 → 12:30 푸드트럭 런치 → 15:30 인디 버스킹 → 19:30 야간 불꽃쇼 4단계 코스.

---

### [Step 5] 내주변 축제 지도 탐색기 (`/map/`) 구축
* **적용 파일**: `scripts/build-map-page.mjs`, `assets/css/festa-map.css`, `assets/js/festa-map.js`, `map/index.html`
* **주요 구현 내용**:
  - **Leaflet 기반 오픈소스 고화질 인터랙티브 맵**: 지도 타일, 부드러운 줌/패닝 및 전국 55개 축제 좌표 배치.
  - **탐색 반경 탭 & 동심원 레이더 오버레이**: `1km`(도보 15분), `3km`(자전거), `5km`(차량 10분), `10km`(차량 20분) 선택 시 레이더 서클 동적 갱신.
  - **테마별 핀 토글**: 전체 축제, 인디 버스킹, 주말 플리마켓, 푸드트럭, 공영주차장 필터링.
  - **우측 슬라이드아웃 상세 패널 & 모바일 바텀시트**: 핀 클릭 시 개최 장소, 일정, 타임테이블, 주차 현황, 시뮬랩 상세 가이드 바로가기 제공.

---

### [Step 6 & 핫픽스] 모바일 최상단 그리드 깨짐 & 지도 화이트아웃 해결
* **문제 현상**:
  1. 모바일에서 최상단 헤더의 가로 메뉴 텍스트들이 줄바꿈되어 겹치고 깨지는 현상.
  2. 모바일/웹 지도(`/map/`) 접속 시 지도가 로드되지 않고 화면 전체가 하얗게 죽는 현상.
* **원인 규명 및 해결**:
  1. **헤더 모바일 깨짐 해결**: 화면 폭 900px 이하에서 `.site-head nav`를 `display: none !important;`로 설정하여 모바일 최상단을 `[✳ simulab 로고] ------- [♡ 0 찜 버튼]`의 깔끔한 양 끝 정렬로 변경.
  2. **지도 높이 0px 버그 해결**: HTML `<body class="festa-map-body">`와 CSS의 클래스명 불일치를 바로잡고, 뷰포트 높이를 `calc(100vh - 66px)`로 명시.
  3. **Leaflet 캔버스 리사이즈 갱신**: `state.map.invalidateSize()`를 실행하여 브라우저 로딩 즉시 지도 타일이 100% 렌더링되도록 조치.

---

### [Step 7] 구글 검색 최적화 (SEO - Schema.org Event JSON-LD)
* **적용 파일**: `scripts/build-festa-details.mjs`, 55개 축제 상세 HTML
* **주요 구현 내용**:
  - 구글 검색 엔진이 인식하는 표준 `Event` 구조화 데이터를 55개 개별 축제 상세 페이지의 `<head>`에 탑재.
  - 구글 검색창에서 행사명, 시작/종료일, 개최 장소, 관람 요금, 대표 썸네일 이미지가 **리치 스니펫(카드 형태)**으로 자동 노출되도록 최적화 완료.

---

## 3. 사이트 아키텍처 및 핵심 파일 맵

```
c:\project\addseo\
├── index.html                     # 메인 포털 홈 (Festive Pulse & 3대 허브)
├── calendar/                      # 날짜별 축제 탐색기 (월간/분할/타임라인)
│   └── index.html
├── curation/                      # 테마별 큐레이션 (7대 리본 & 벤토)
│   └── index.html
├── map/                           # 내주변 지도 (Leaflet & 레이더 오버레이)
│   └── index.html
├── events/                        # 55개 검증 축제 상세 페이지
│   ├── busan-fireworks-2026/
│   ├── namsan-night-2026/
│   └── ...
├── assets/
│   ├── css/
│   │   ├── festa-home.css         # 글로벌 헤더, 메인 홈, 모바일 5탭 바
│   │   ├── festa-calendar.css     # 캘린더 전용 스타일시트
│   │   ├── festa-detail.css       # 2열 상세 및 준비물 체크리스트
│   │   ├── festa-curation.css     # 큐레이션 매거진 & 벤토 스타일시트
│   │   └── festa-map.css          # 인터랙티브 지도 & 레이더 스타일시트
│   ├── js/
│   │   ├── festa-home.js          # 홈 슬라이더, 퀵서치, 날짜 탭
│   │   ├── festa-calendar.js      # 캘린더 3대 뷰 전환 & 렌더링 엔진
│   │   ├── festa-detail.js        # 찜 동기화, .ics 생성, 체크리스트 저장
│   │   ├── festa-curation.js      # 테마 칩 동적 필터링 & 페이드 전환
│   │   └── festa-map.js           # Leaflet 지도 렌더러, 반경 계산, 핀 연동
│   └── img/festivals/             # 46장 고화질 로컬 축제 실사 사진 보존
└── scripts/
    ├── build-festa-home.mjs       # 홈 빌더
    ├── build-calendar-page.mjs    # 캘린더 빌더
    ├── build-festa-details.mjs    # 55개 상세 및 JSON-LD 빌더
    ├── build-curation-page.mjs    # 큐레이션 빌더
    ├── build-map-page.mjs         # 지도 빌더
    ├── build-site.mjs             # 전체 사이트 종합 빌더
    └── check-public.mjs           # 166개 HTML 무결성 검증기
```

---

## 4. 실서버 배포 검증 및 안전 프로토콜

* **최신 배포 커밋**: `8ad967834b0526a510059259cdce654cc9b47a42`
* **무손실 배포 프로토콜**:
  - 임시 인덱스에 `git read-tree origin/main`을 먼저 수행하여 기존 파일 및 46장 사진의 유실을 원천 차단.
  - `git diff --cached --stat origin/main`으로 삭제 파일이 0개임을 전수 검증한 후 커밋 및 푸시 실행.
* **실서버 엔드포인트 응답 상태**:
  - `https://simulab.kr/` → `200 OK`
  - `https://simulab.kr/calendar/` → `200 OK`
  - `https://simulab.kr/curation/` → `200 OK`
  - `https://simulab.kr/map/` → `200 OK`
  - `https://simulab.kr/events/busan-fireworks-2026/` → `200 OK`
  - `https://simulab.kr/assets/img/festivals/pexels-18689980.jpg` → `200 OK`
* **검증 통과**: `node scripts/check-public.mjs` 검사 기준 **166개 HTML 파일, 로컬 에셋 링크 및 Canonical URL 100% 정상 통과**.

---

## 5. 운영 및 유지보수 가이드 (교육용)

1. **새로운 축제 데이터를 추가할 때**:
   - `data/events/reviewed.json`에 축제 정보(일정, 장소, 요금, 공식 출처 URL)를 등록합니다.
   - 대표 사진이 있을 경우 `assets/img/festivals/`에 이미지를 넣고, `data/events/images.json`에 `"축제ID": { "src": "/assets/img/festivals/파일명.jpg", "credit": "..." }` 형태로 경로를 지정합니다. (**주의: `url`이 아닌 `src` 필드명을 사용해야 합니다.**)
2. **사이트 전체 빌드 및 검사 실행**:
   ```bash
   node scripts/build-site.mjs
   node scripts/check-public.mjs
   ```
3. **안전한 Git 배포 방법**:
   - 코드를 수정 후 배포할 때는 기존 파일들이 누락되지 않도록 `git read-tree origin/main` 기반의 무손실 배포 프로토콜을 사용합니다.
