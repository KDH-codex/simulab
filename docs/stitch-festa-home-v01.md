# 시뮬랩 축제 메인 전환 V01

## 기준

- 메인 주소 `/`는 행사·축제 발견 서비스다. 이전 토론/실험실 이름과 섹션은 메인에 노출하지 않는다.
- 제공된 Stitch ZIP의 화면 구도(강한 히어로, 옆 추천, 달력, 지역·취향 카드)를 참고한다. HTML 목업의 가상 행사, 순위, 실시간 수치, 가입 버튼, 원격 데모 사진은 실제 서비스에 복사하지 않는다.
- 메인 브랜드는 `SimuLab / 시뮬랩`, 시각 언어는 오렌지·보라·밤 축제 그래픽이다. 접근성, 모바일 너비, 공식 안내 연결이 우선이다.
- 과거 토론 페이지 주소는 보존하되 메인에서 안내하지 않는다. 생활 도구는 `/library/`에서 계속 제공한다.

## 구현 위치와 데이터

- `scripts/build-home.mjs` → `scripts/build-festa-home.mjs` 호출. `index.html`은 생성물이라 직접 고치지 않는다.
- `assets/css/festa-home.css`: 화면 디자인과 모바일 스타일.
- `assets/js/festa-home.js`: 달력, 검색, 분위기·지역 필터. 화면 문자열은 이 파일을 수정한다.
- `data/events/reviewed.json`: 검토된 행사 원본. 실제 날짜·운영일·요금·공식 출처가 있는 항목만 메인에 반영한다.
- `manifest.json`, `favicon.svg`, `assets/icons/icon-192.png`, `assets/icons/icon-512.png`: 앱 아이콘과 브라우저 브랜딩.
- 메인 카드와 캘린더는 빌드 시 검토된 데이터를 읽는다. 종료된 카드의 화면 표시는 브라우저에서 숨기지만, 새 행사는 원본 데이터 갱신과 재배포가 있어야 추가된다.

## Stitch / Google AI Studio로 고치는 절차

1. Stitch 프로젝트 소유 계정으로 [프로젝트](https://stitch.withgoogle.com/projects/16870204999804682049)를 연다. 2026-10-31 현재 이 작업 브라우저에서는 “This page doesn't exist or isn't shared with you”가 표시되어 라이브 화면은 볼 수 없었다. 제공 ZIP의 `screen.png`, `code.html`, `DESIGN.md`를 기준으로 구현했다.
2. 시각 시안만 수정하려면 Stitch의 대화/테마 수정 기능을 사용하고 새 화면을 내보낸다. 내보낸 HTML은 **디자인 참고자료**로 쓰고, 위 세 소스 파일에 선택적으로 반영한다.
3. Google AI Studio **Build**에서는 입력창의 **+ → Import from GitHub**로 현재 저장소를 가져올 수 있다. 코드 패널에서 직접 수정하거나 대화/주석 모드로 변경을 요청할 수 있고, 설정의 GitHub 탭에서 동기화할 수 있다. 직접 운영 브랜치에 자동 푸시하기 전에 변경 파일과 미리보기를 검토한다. 이 저장소는 정적 사이트 생성 구조라 생성된 `index.html`만 AI Studio에서 고치면 다음 빌드 때 덮어써진다.
4. 작업 브랜치에서 `node scripts/build-site.mjs`, `node scripts/check-public.mjs`를 실행하고 데스크톱·모바일 미리보기를 확인한 다음 운영 브랜치에 반영한다. 기존 행사 데이터 변경에는 공식 출처 확인이 필요하다.
5. AI Studio 앱을 Cloud Run에 따로 배포하면 기존 `simulab.kr` 배포와 별개의 서비스가 된다. 현재 사이트를 업데이트하려면 기존 GitHub/Cloudflare 배포 흐름으로 반영한다.

Google 공식 참고: [Stitch 소개](https://developers.googleblog.com/en/stitch-a-new-way-to-design-uis/), [AI Studio Build와 GitHub 가져오기·양방향 동기화](https://ai.google.dev/gemini-api/docs/aistudio-build-mode).

## AI Studio / Antigravity 전달 프롬프트

```text
시뮬랩(simulab.kr)의 축제/행사 메인 화면을 다듬어 주세요.
참고 시안은 Stitch 프로젝트 16870204999804682049의 ZIP과 docs/stitch-festa-home-v01.md입니다.
기존 정적 사이트 생성 구조를 유지하세요. index.html은 생성물이므로 직접 수정하지 말고
scripts/build-festa-home.mjs, assets/css/festa-home.css, assets/js/festa-home.js를 수정하세요.

목표: Stitch의 오렌지/보라 축제 분위기는 유지하면서 시뮬랩만의 간결한 그래픽, 읽기 쉬운 한국어,
모바일 한 손 사용, 달력·지역·취향 탐색을 더 좋게 만드세요.
메인에 AI 사망토론/실험실을 노출하지 마세요. 기존 /library/와 기존 토론 URL은 유지하세요.
행사 제목·날짜·장소·요금·링크는 data/events/reviewed.json의 검토된 정보만 사용하세요.
실시간 인기 순위, 남은 날짜, 좋아요 수, 행사 사진, 예약·구독 기능을 지어내지 마세요.
공식 이미지가 필요하다면 원본 URL과 이용 가능 여부를 먼저 확인하세요.
구체적 변경안을 파일별 diff로 제시하고, 빌드와 공개 링크 검사를 통과시키세요.
```
