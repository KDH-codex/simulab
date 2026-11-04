# 수정본 배포 전 독립 검토 · Argon Medium

실행 모델 `gemini-4-argon-medium`, effort `medium`을 유지하라. 이번에는 수정본의 코드와 실제 캡처를 읽고 남아 있는 중요 문제를 검토한다. 코드 수정·커밋·배포·추가 에이전트 호출은 하지 않는다. 보고서 작성 파일이나 승인 대기 없이 최종 응답으로 반환한다.

먼저 `review-baseline.json`에서 실제 기준 커밋·검증 범위를 읽어라. 이 복사본은 Git 저장소가 아니다. 현재 원격 운영 페이지는 아직 수정 전이므로 이번 구현의 증거로 사용하지 않는다. 과거 검토의 파일명·확인 시각을 추정해서 재사용하지 않는다.

다음 문서를 기준으로 검토한다:

- `docs/festival-ui-implementation-20261105.md`
- `docs/festival-design-review-plan-20261105.md`
- `docs/festival-ui-details-20261104.md`

디자인 기준은 `scratch/stitch-import/`의 홈·달력·지도·모달 화면과 `references/user-motion/`의 UI·모션 참고 3장이다. 실제 수정 화면은 `scratch/design-home-desktop.jpg`, `scratch/design-modal-mobile.jpg`, `scratch/design-calendar-desktop.jpg`, `scratch/design-map-desktop.jpg`, `scratch/design-detail-mobile.jpg`다. 이미지를 직접 열어 비교한다.

주안점: Stitch의 따뜻한 색상·구도·정보 위계를 유지했는지, 사진·일러스트가 적절한 위치에 있는지, 작은 글씨·모바일 조작·고정 필터·주간 달력·상세 시트·모션이 사용자 흐름을 돕는지 확인한다. 확인된 사실과 제안을 구분한다.

실제 소스는 `scripts/festival-platform.mjs`, `scripts/festival-pages.mjs`, `assets/js/festival-platform.js`, `festival-ui-model.js`, `festival-presentation.js`, `festival-modal.js`, CSS 3종(platform/enhancements/refinements)이다. 이전 보고서에 있었던 `eventKeywords`, `.day-cell`, `.region-pin`, `build-festival-platform.mjs` 등 존재하지 않는 대상을 인용하지 않는다. 실제 함수·선택자를 확인하라. 날씨는 MET Norway이며 이번 변경에서 Worker는 수정하지 않았다.

특히 확인할 회귀:
1. 상세 태그 이동과 달력 내 필터를 구분했는가? 무료·보관함·키워드·기간의 표시·해제가 같은 상태를 쓰는가?
2. 모달 네 탭과 키보드·닫기·초점·고정 행동부가 일관되는가?
3. 주간 날짜 재클릭과 월 경계·스크롤·재렌더 초점을 보존하는가?
4. 대표 카드 3초 전환·읽기 중 정지·동일 점 재클릭·이전 방향·모션 줄이기가 모순되지 않는가?
5. 참고 사진 고지와 대체 그래픽이 가짜 공식 사진·날씨·요금·위치를 만들지 않는가?

결과는 **한국어 2,500자 이내, 지적 최대 6개**로 제한한다. 각 지적에 분류(확인된 결함/개선 제안/미검증), 우선순위, 실제 파일·요소, 근거, 수정 방향을 적는다. 문제가 없으면 억지로 지적하지 않는다. 긴 절대경로 링크와 전체 코드 인용은 사용하지 않는다. 마지막에 배포를 막을 확인된 문제의 유무와 실제 검토하지 못한 범위를 명시한다. 브라우저에서 직접 조작하지 않았다면 그 사실을 정확히 기록한다.
