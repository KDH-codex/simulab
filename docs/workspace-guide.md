# 이번주 축제 · 현재 작업 기준

## 먼저 읽을 문서

1. `festival-ui-details-20261104.md`: 사용자가 확정한 폰트·모션·태그·고정 필터·주간 달력·날씨 요구사항.
2. `festival-platform-maintenance.md`: 현재 화면 구조·정본·후속 축제 수집과 배포 정책.
3. `antigravity-review-request.md`: 독립 교차검토 범위와 결과 형식.

기준 배포 커밋은 `1b2b0876cfdb100f526a7672e64f35788024484f`다. 이번 폴더 정리는 그 위의 로컬 변경이며 아직 커밋·배포하지 않았다.

## 폴더 역할

| 경로 | 역할 |
| --- | --- |
| `scripts/festival-platform.mjs`, `scripts/festival-pages.mjs` | 현재 축제 화면 생성 소스 |
| `assets/js/festival-*.js`, `assets/css/festival-*.css` | 현재 축제 화면 동작·디자인 |
| `worker/` | 날씨 API와 정적 파일 라우팅 |
| `data/events/` | 검토된 축제와 이미지 정본 |
| `index.html`, `map/`, `calendar/`, `curation/`, `events/` | 생성되는 공개 페이지. 직접 수정하지 않는다 |
| `tools/`, `library/`, `debates/`, `guides/`, `admin/` | 기존 공개 주소와 관련 소스. 지금 메인에서 쓰지 않는다는 이유로 이동하지 않는다 |
| `supabase/` | 기존 DB 설정·마이그레이션. 이번 UI 검토 범위 밖 |
| `docs/` | 운영·검증 문서. 과거 진단은 이력으로 읽으며 현재 문서가 우선 |
| `scratch/stitch-import/` | 사용자가 지정한 최신 Stitch 원본. 현재 검토에 필요하므로 유지 |
| `scratch/` | 검증 기록·화면 증거·별도 검토 복사본. 배포 제외 |
| `dist/` | 빌드 결과. 직접 편집하지 않는다 |
| `archive/2026-11-05-cleanup/` | 참조되지 않는 옛 축제 번들·기획·시안·미연결 이미지 후보 62개. 배포·현재 구현 기준에서 제외 |

보관함의 `manifest.json`에 원래 위치·이동 위치·SHA256·이유가 있다. 파일은 삭제하지 않았다. 이전 축제 전달 문서는 현재와 다른 Stitch 프로젝트와 `festa-*` 번들을 지시하므로 현재 검토 지침으로 사용하지 않는다.

현재 활성 브랜드는 **이번주 축제**다. 오래된 문서의 `시뮬랩`, `이번주축제`, 과거 본문 서체·파일 경로보다 위 최신 UI 문서와 사용자 후속 지시가 우선한다.

## 검증

```text
npm test
npm run build
node scripts/check-public.mjs
node scripts/build-event-data.mjs --check
node scripts/build-kids-calendar.mjs --check
```

빌드 출력에는 `archive/`를 복사하지 않는다. 기존 Cloudflare 배포 경로는 유지한다.
