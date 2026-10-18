## 3. 개발 및 바이브 코딩 가이드라인 (`03_Guidelines.md`)

아래 블록을 복사하여 프로젝트 루트 폴더에 `03_Guidelines.md`로 저장하십시오. 유료 LLM에게 코딩을 지시할 때 이 문서를 함께 첨부하면 코드 품질이 일관되게 유지됩니다.

```markdown
# 03_Guidelines.md - 바이브 코딩(Vibe Coding) 및 개발 원칙

## 1. Coding Conventions (네이밍 및 모듈 분리 원칙)
* **비즈니스 로직과 UI의 엄격한 분리:** 
  * 모든 수학·재무·통계 수식은 DOM 참조(`document.getElementById` 등)가 전혀 없는 순수 함수(Pure Function) 형태로 `logic.js`에 작성한다.
  * LLM에게 수식 검증을 시킬 때는 `logic.js`만 단독으로 내장 Python이나 Node.js에서 테스트하여 계산 무결성을 보장한다.
* **네이밍 규칙:**
  * 변수 및 함수명: `camelCase` (예: `calculateVolatilityDrag`, `monthlyContribution`)
  * 상수 및 기본 설정값: `UPPER_SNAKE_CASE` (예: `TRADING_DAYS_PER_YEAR = 252`)
  * 폴더 및 HTML 파일명: 검색엔진 친화적인 `kebab-case` (예: `leverage-etf-simulator`)

## 2. State Management & Data Flow (단방향 상태 흐름)
1. **Event Trigger:** 사용자의 슬라이더(`input` 이벤트) 또는 숫자 입력창 변경 감지.
2. **Debounce & Sanitize:** 과도한 연산 방지를 위해 `requestAnimationFrame` 주기에 맞춰 입력값을 정규화(NaN, 음수, 극단치 방어).
3. **Pure Calculation:** `logic.js`의 `calculateSimulation()` 호출 -> 결과 배열 반환.
4. **Render Update:** 요약 카드(KPI 숫자) 업데이트 및 `chart-engine.js`를 통한 Canvas 재드로잉.
5. **URL/Storage Sync:** 사용자가 '저장' 또는 '공유' 클릭 시에만 `history.replaceState` 및 `localStorage` 업데이트.

## 3. Error Handling & Edge Cases (방어적 프로그래밍)
* **Zero Division & Infinity 방어:** 이자율 0%, 기간 0년, 변동성 100% 초과 등 극단적인 입력값에서도 화면이 멈추거나 `NaN`, `Infinity`가 UI에 노출되지 않도록 최소/최대 범위(Clamping)를 강제한다.
* **부동소수점 오차 보정:** 금액 및 수익률 표기 시 `Number.EPSILON` 보정 및 `Intl.NumberFormat('ko-KR')`을 사용하여 통화/소수점 자리수를 정확히 포맷팅한다.
* **법적 면책 조항(Disclaimer) 상시 렌더링:** 계산 결과 박스 바로 아래에 *"본 시뮬레이션 결과는 입력된 가정에 기반한 수학적 추정치이며, 실제 투자 수익이나 법적 효력을 보증하지 않습니다"*라는 문구가 누락되지 않도록 공통 컴포넌트로 강제 주입한다.

## 4. SEO & AdSense Approval Standards (수익화 및 검색 최적화 규칙)
* **시맨틱 HTML 필수:** `<main>`, `<article>`, `<section>`, `<h1>~<h3>` 태그를 계층에 맞게 사용하며, 각 도구 페이지당 `<h1>`은 정확히 1개만 존재해야 한다.
* **JSON-LD 구조화 데이터:** 모든 도구 페이지 `<head>`에 `SoftwareApplication` 및 `FAQPage` 스키마 마크업을 포함하여 구글 검색 결과에서 리치 스니펫(Rich Snippet) 노출을 유도한다.
* **CLS(Cumulative Layout Shift) 방지:** 애드센스 광고 슬롯 영역과 Canvas 차트 영역은 반드시 고정 높이(`min-height` 또는 `aspect-ratio`)를 미리 지정하여 로딩 중 화면 밀림 현상을 0으로 유지한다.

## 5. Git & Vibe Coding Workflow (프롬프트 기반 배포 전략)
* `main` 브랜치에 푸시되면 Cloudflare Pages가 30초 내에 상용 배포하므로, 새로운 시뮬레이터 제작 시 `feat/tool-[이름]` 브랜치(또는 로컬 프리뷰)에서 동작과 수식 오차를 먼저 검증한 뒤 병합한다.
* LLM에게 코드 수정을 요청할 때는 전체 코드를 다시 짜게 하지 말고, 변경이 필요한 함수나 파일(`logic.js` 또는 `app.js`) 범위를 명시하여 기존 작동 코드가 훼손(Regression)되는 것을 방지한다.