# 02_Architecture.md - 서버리스 정적 멀티 툴 아키텍처

## 1. Tech Stack (비용 0원 & 바이브 코딩 최적화 스택)
유료 LLM(Canvas/Artifacts)이 한 번에 오류 없이 코드를 생성하고 디버깅할 수 있도록 무거운 프레임워크 의존성을 최소화함.

* **Frontend Core:** HTML5, Vanilla JavaScript (ES6+ Modules)
  * *선정 이유:* React/Next.js 등 복잡한 빌드 체인 없이도 LLM이 단일 파일 단위로 완벽한 코드를 작성할 수 있으며, 런타임 번들 크기가 극소화되어 모바일 로딩 속도(Core Web Vitals)가 극대화됨.
* **Styling:** Tailwind CSS (CDN 또는 CLI 빌드) + 다크/라이트 모드 CSS 변수
* **Visualization:** HTML5 `<canvas>` 2D API (또는 경량 Chart.js)
  * *선정 이유:* 슬라이더 조작 시 수천 개의 데이터 포인트를 60fps로 즉시 리렌더링하고 PNG 이미지로 캡처(`canvas.toDataURL()`)하기에 가장 적합함.
* **Hosting & CDN:** Cloudflare Pages (무료 플랜)
  * *선정 이유:* GitHub 저장소 푸시 시 자동 배포(CI/CD) 지원, 대역폭(Bandwidth) 무제한 무료, 무료 플랜에서도 상업적 이용(AdSense 광고 및 제휴 수익화)이 약관상 허용됨.
* **Analytics & Monetization:** Google Analytics 4 (GA4), Google Search Console, Google AdSense, 제휴 마케팅 배너 컴포넌트.

## 2. Directory Structure (폴더 트리 구조)
새로운 시뮬레이터를 추가할 때 기존 코드를 건드리지 않고 `/tools/[새-도구-이름]/` 폴더만 복사·생성하면 되는 모듈형 구조.

```text
simulab-hub/
├── index.html                  # 메인 포털 (전체 도구 카드 목록 및 검색)
├── sitemap.xml                 # 검색엔진 제출용 사이트맵
├── robots.txt                  # 크롤러 허용 규칙
├── legal/                      # 애드센스 승인 및 법적 필수 페이지
│   ├── privacy.html            # 개인정보처리방침 및 쿠키 정책
│   ├── terms.html              # 이용약관 및 면책조항(Disclaimer)
│   └── about.html              # 사이트 소개 및 문의처
├── assets/
│   ├── css/
│   │   └── common.css          # 공통 레이아웃 및 디자인 토큰
│   └── js/
│       ├── core-ui.js          # 공통 헤더/푸터, 다크모드, 공유(URL/Storage) 유틸
│       ├── chart-engine.js     # HTML5 Canvas 공통 차트 렌더링 헬퍼
│       └── seo-schema.js       # JSON-LD 구조화 데이터 동적 주입기
└── tools/                      # 개별 마이크로 웹 도구 디렉토리
    ├── leverage-etf-sim/
    │   ├── index.html          # UI + SEO 해설 텍스트(1,500자+) + 광고 슬롯
    │   ├── logic.js            # 순수 수학/금융 계산 로직 (UI와 분리)
    │   └── app.js              # DOM 이벤트 바인딩 및 Canvas 렌더링 제어
    ├── logistics-roi-calc/
    │   ├── index.html
    │   ├── logic.js
    │   └── app.js
    └── running-zone-calc/
        ├── index.html
        ├── logic.js
        └── app.js