# 이번주 축제

축제·행사를 지역·날짜·테마로 살펴보는 정적 웹사이트다. 운영 주소는 <https://simulab.kr/>다.

- [현재 폴더·소스 안내](docs/workspace-guide.md)
- [Argon 교차검토 반영 실행계획](docs/festival-design-review-plan-20261105.md)
- [사용자 확정 UI 요구사항](docs/festival-ui-details-20261104.md)
- [구조·정보 갱신·배포 정책](docs/festival-platform-maintenance.md)
- [Antigravity 검토 요청서](docs/antigravity-review-request.md)
- [교차검토 운영안](docs/antigravity-cross-review.md)
- [옛 코드·기획·시안 보관함](archive/2026-11-05-cleanup/README.md)

현재 축제 화면은 `scripts/festival-platform.mjs`, `scripts/festival-pages.mjs`와 `assets/`의 `festival-*` 파일을 사용한다. 생성된 HTML을 직접 편집하지 않는다. 보관함은 현재 구현 기준이 아니며 배포에서 제외한다.

```text
npm test
npm run build
node scripts/check-public.mjs
```

기존 공개 주소·정본과 Supabase·관리자·광고 설정은 폴더 정리 과정에서 유지한다. 로컬 검토 복사본과 실행 기록은 배포되지 않는 `scratch/antigravity-review/`에 보관한다.
