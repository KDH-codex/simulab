# 시뮬랩 축제 인터랙션 V02

## 참고 화면

- [Stitch 프로젝트](https://stitch.withgoogle.com/projects/16870204999804682049)의 프로토타입에 데스크톱 홈·상세, 모바일 홈·상세 화면을 추가했다. 각 화면의 시각 구조와 진입 흐름을 참고한다.
- [AI Studio 앱](https://ai.studio/apps/604f4b16-815d-432b-a240-a07d2d001e48)과 [공개 미리보기](https://festa-calendar.ai.studio/)에서 캐러셀, 달력, 행사 상세, 저장, 공유, 필터의 동작을 확인했다.
- 참고 앱에 보이는 2025년 행사, 실시간 수치, 순위, 후기, 티켓 가격과 예약 절차는 운영 데이터로 사용하지 않는다. 시뮬랩은 `data/events/reviewed.json`의 검토된 정보만 게시한다.

## 구현한 행동

| 화면 | 사용자 행동 | 구현 위치 |
| --- | --- | --- |
| 메인 | 날짜 선택, 월간·주간 보기, 이전·다음·오늘 이동 | `assets/js/festa-home.js` |
| 메인 | 지역·테마·검색 필터, 더 보기 | `assets/js/festa-home.js` |
| 메인 | 카드·달력·추천 행사에서 상세 페이지 이동 | `scripts/build-festa-home.mjs`, `assets/js/festa-home.js` |
| 메인 | 행사 저장과 보관함 열기, 모바일 하단 메뉴 | `assets/js/festa-home.js`, `assets/css/festa-home.css` |
| 상세 | 일정·장소·요금·접수·공식 출처 확인 | `scripts/build-festa-details.mjs` |
| 상세 | 저장, OS 공유 메뉴 또는 링크 복사 | `assets/js/festa-detail.js` |

저장은 브라우저 `localStorage`의 `simulab:saved-events:v1`에 행사 ID만 기록한다. 계정 간 동기화나 실제 예매는 제공하지 않는다. 공유는 해당 행사 상세 URL을 사용한다.

## 데이터와 생성 규칙

- `scripts/build-site.mjs`가 홈과 `/events/{id}/` 상세 페이지를 생성하고, 상세 주소를 사이트맵에 포함한다.
- 종료된 행사는 상세 기록을 유지하되 메인 카드에서는 숨긴다. 상세에 종료 상태를 표시한다.
- 운영일이 별도로 있는 행사에는 그 날짜만 달력에 표시한다.
- 공식 안내 링크는 검토 데이터의 출처 URL을 사용한다. 현장 운영 변경 가능성도 안내한다.
- 생성된 `index.html`이나 `events/**/index.html`을 직접 고치지 않는다. 생성 스크립트, CSS, JS, 검토 데이터의 소유 범위를 지킨다.

## 다음 확장 기준

- Stitch/AI Studio에서 새 인터랙션을 만들 때는 실제 행동을 먼저 프로토타입에서 확인하고, 운영 데이터 모델과 맞는 기능만 이식한다.
- 예약·회원 계정·후기·실시간 순위는 실제 백엔드와 운영 정책이 마련되기 전까지 버튼이나 숫자를 임의로 표시하지 않는다.
- 수정 후 `node scripts/build-site.mjs`와 `node scripts/check-public.mjs`를 실행하고 모바일 화면을 확인한다.
