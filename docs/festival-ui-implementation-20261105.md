# 이번주 축제 · 교차검토 후 UI 보완

사용자가 승인한 `festival-design-review-plan-20261105.md`를 구현했다. 브랜드는 **이번주 축제**, 어그로/페이퍼로지/프리텐다드와 오렌지·인디고·보라 색상 체계를 유지한다.

## 변경

- 대표 영역: 한국어 문구·읽기 크기·이미지 대비를 정리하고 3초 자동 전환과 같은 수동 효과를 유지했다. 이전/다음 방향을 구분하고 현재 점 재클릭은 생략한다. 사진 고지는 어두운 이미지 레이어 밖의 읽을 수 있는 배지로 표시한다.
- 이미지: 서버·브라우저가 같은 이미지 표시 함수를 사용한다. 참고 사진을 현장 사진으로 설명하지 않는다. 사진 없는 행사는 실제 지역·날짜와 4개 기존 테마를 조합한 벡터 그래픽으로 표시한다. 기존 미연결 이미지 후보는 출처·권리 확인 전까지 보관함에 둔다.
- 탐색: 상세 페이지 태그는 홈의 실제 결과로 연결한다. 달력 태그는 현재 달력 안에서 작동한다. 무료·기간 조건도 URL에 보존한다.
- 고정 필터: 원래 필터를 지난 뒤에만 표시한다. 지역·테마 외에 활성 키워드·무료·보관함·기간을 보여주고 해제한다. 실제 도크 높이를 스크롤 여백에 반영한다.
- 달력: 월간 기본값·주차 선택·7열 내부 가로 스크롤을 유지했다. 날짜 재선택으로 주간 전체에 돌아가며 날짜/주/월 복귀 문구와 아래 카드 안내를 연결했다. 날짜 재렌더 시 키보드 초점과 가로 스크롤을 보존한다.
- 상세: 모달에 사진·태그·장소 탭을 추가하고 4개 탭의 키보드 이동을 연결했다. 모바일은 하단 시트와 고정 행동부, 데스크톱은 중앙 모달이다. 상세 페이지 모바일 이미지도 본문 앞에서 볼 수 있게 배치했다.
- 모션: 카드 순차 등장, 짧은 선택 전환, 고정 바 등장, 보관 피드백을 적용했다. 모션 줄이기 분기를 보존했다. 새 모션 라이브러리는 추가하지 않았다.
- 가독성: 본문·메타·출처와 보조 설명을 역할별로 조정했다. 모바일 ‘오늘’ 표시는 5px 글자 대신 접근성 문구를 유지하는 작은 색상 표시로 바꿨다.

## 검증 기록

- 테스트 155개, 빌드, 공개 171개 HTML 링크·canonical 검사 통과.
- 축제 정본과 기존 달력 55건 일치. `data/events`, 다른 8개 분야 정본·확인시각, Worker·Supabase·관리자·광고·통계 설정 변경 없음.
- 실제 브라우저: 1440/390/320px 가로 넘침 없음. 상세 태그 이동, 무료 조건 유지·해제, 고정 필터 진입, 4개 모달 탭·화살표 키, 배경 스크롤 잠금, 하단 행동부, 날짜 선택·재선택, 지도 권역 선택, 사진 없는 상세 그래픽을 확인했다.
- 자동 전환과 이전 카드의 순환 이동을 확인했다. 읽는 중 포인터가 대표 영역에 있으면 자동 전환이 정지한다. 미디어 설정 자체를 전환하는 브라우저 테스트는 수행하지 않았으며, 모션 줄이기 처리는 코드 분기로 검토한다.
- 화면 기록: `scratch/design-home-desktop.jpg`, `design-modal-mobile.jpg`, `design-calendar-desktop.jpg`, `design-map-desktop.jpg`, `design-detail-mobile.jpg`.

수정본의 Argon Medium 재검토와 실제 배포 결과는 해당 실행 기록 및 후속 커밋에 남긴다. 이 문서의 빌드 성공을 운영 반영으로 설명하지 않는다.

## 지도 이미지 제작 기록

기존 Stitch 지도에서 장식 점만 제거하도록 내장 **Imagegen**으로 편집했다. 결과를 `assets/img/brand/korea-festival-map-clean.png`에 복사해 연결했다. 원본 `korea-festival-map.jpg`는 비교와 출처 이력을 위해 유지했다. 화면의 ‘권역 선택용 개략도·실제 좌표 아님’ 안내도 유지한다.

실제 전달 프롬프트:

> Edit target: the provided minimal South Korea regional map illustration for an existing festival discovery website. Preserve exactly the existing peninsula and island silhouettes, composition, coastline and all internal region outlines and the generous white background. Preserve warm cream, apricot and soft lavender fill colors and delicate warm gray borders. Remove ALL orange dots, glows, specks, light trails and bright markers along the east coast and southeast coast. Fill those areas with clean matching cream or lavender region colors. The final image must have no pins, no dots, no text, no place labels, no added buildings, no symbols, no fireworks and no decorative lights. Keep the same clean refined vector-like cartographic aesthetic and portrait composition. This is a schematic region-selection background, not a factual event location map. Output a high quality clean portrait asset at the same aspect ratio. Save the generated image normally so it can be copied into the project.
