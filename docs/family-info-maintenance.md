# 가족 정보 9항목 운영

2026-10-25: 기존 세일·축제를 유지하면서 신규 7개 분야의 전용 페이지와 통합 달력, 공개 피드, 수목 원고 큐를 추가했다. 사용자 요청은 신규 분야 화면을 먼저 만들고 기존 예약을 새 일정으로 전환하는 것이다.

## 공개 화면과 원본

- 통합: `/tools/family-info-calendar/`.
- 신규: `/tools/kids-programs/`, `/tools/local-parenting/`, `/tools/family-support/`, `/tools/camping-booking/`, `/tools/family-culture/`, `/tools/kids-popups/`, `/tools/family-discounts/`.
- 기존: `/tools/parenting-deals/`, `/tools/kids-outing-calendar/`를 유지한다.
- `data/family-info/schedule.json`이 9항목·일월화 슬롯·수목 분리 정책의 기준이다. 한국시간 오전 8시, 오후 15시, 저녁 19시는 기본값이며 정각 시작을 보장하지 않는다.
- `data/family-info/reviewed.json`: 신규 분야의 실제 검증 원본. `held.json`: 상충·검증 실패 기록. `sources.json`: 공식 확인처와 허용 호스트. 단순 확인처 등록은 실수집 성공이 아니다.
- `data/events/reviewed.json`, `data/deals/reviewed.json`는 기존 정본이다. 통합 달력은 어댑터로 읽고 기존 확인시각과 대표 세일 기준을 보존한다.
- `feeds/family-info/latest.json` 및 9개 항목별 JSON은 공개 allowlist 생성물이다. 내부 데이터 전체, 보류 사유, 블로그 이력, 인증·내부 메모를 배포하지 않는다.
- 원본 JSON과 생성기·공유 모델을 편집한다. 생성된 HTML/피드를 직접 편집하지 않는다.

## 현재 자동화의 성격

예약된 Codex가 공식 웹의 상세 공지를 직접 검토하고 원본을 편집하는 방식이다. 모든 출처의 무인 파서/API를 구현한 서비스가 아니며 새로운 유료 API를 연결하지 않았다. PC와 앱이 실행 가능한 상태여야 하는 로컬 예약이다. 키·브라우저·출처 접근 실패는 실제 실행에서 기록한다.

새 출처를 등록할 때 실제 공식 운영 주체와 상세 URL 호스트를 확인한다. HTML 200·검색 요약만으로 공개하지 않는다. 이미지 공지의 날짜·대상·가격은 원본과 대조한다. 공식 이미지·포스터·긴 원문을 복제하지 않는다.

초기 신규 자료는 2026-10-25 원문을 확인한 양재천 체험과 국립휴양림 11월 신청 일정 2건이다. 휴양림은 2026년 공식 매월 접수 규칙으로 산출했음을 명시했다. 지원사업 1건은 장소/신청 방식 상충으로 보류했다. 다른 신규 분야의 빈 상태는 유효 공고가 없다는 판정이 아니라 아직 공개할 검증 자료가 없다는 뜻이다.

## 사이트 슬롯 실행 절차

1. 현재 Git 상태와 최신 원격 main을 확인한다. 해당 예약의 category ID **하나만** 검토한다. 다른 작업·다른 8개 분야의 정상 원본을 덮어쓰지 않는다.
2. `npm run family:audit -- --category=ID`로 기존 자료·공식 확인처를 확인한다. 기존 축제는 event 유지관리·편집 정책, 세일은 브랜드 세일 수록 기준도 읽는다.
3. 공식 상세 원문에서 해당 연도, 접수 시작/마감, 이용일/휴무/실제 회차, 공식 대상, 거주·회원·연령 조건, 비용·보호자 요금, 취소를 검토한다. 전국 대상은 전국으로 유지하고 지역별 복제하지 않는다. 대표 확인처 외 지자체·기관의 지역 공지도 공식 운영 주체를 확인해 등록할 수 있다.
4. 신규 분야는 안정적인 ID와 categoryIds, title, providerId, canonicalUrl, 원본 region, audience, summary, feeStatus/feeText, conditions, 실제 verifiedAt, evidence를 작성한다. 각 evidence에 공식 URL·publisher·실제 확인일·summary·근거 fields를 남긴다. 모든 공개 날짜·대상·조건과 확정 비용에 필드 근거가 있어야 한다. 알 수 없는 값은 null/unknown으로 둔다. `ageGroups`는 공식 연령/학년으로 확인한 유아·초등만 분류한다.
5. 동일 공지는 같은 레코드를 재사용한다. 상충은 held, 취소는 공식 근거와 lifecycleStatus=cancelled로 남긴다. 접속 실패/새 정보 없음/확인된 0건/일부 실패를 구분한다. 실패를 이유로 기존 목록을 지우지 않는다. 기존 확인일을 빌드·실행 시각으로 바꾸지 않는다.
6. 해당 분야의 `state.json` 항목에 실제 마지막 수집시각, outcome(`reviewed`, `partial-review`, `no-new-information`, `no-valid-records`, `failed`), 공급자별 결과를 기록한다. 실패 원문·인증값을 공개 상태에 넣지 않는다. 단순 페이지 링크 확인을 수집/검증 건수로 세지 않는다.
7. 아래 검증을 통과하고 모바일/데스크톱에서 영향 있는 화면을 확인한다. 관련 변경만 커밋한다. 최신 main과 안전하게 통합하고 일반 push로 기존 Cloudflare 연동에 배포한다. 강제 push·새 호스팅 생성은 하지 않는다.
8. GitHub 반영, Cloudflare 빌드 상태, 실제 운영 페이지·피드의 snapshotId를 각각 확인한다. `node scripts/verify-family-deployment.mjs`는 원본에서 기대하는 스냅샷과 운영 피드를 대조하고 8개 페이지를 확인한다. 배포 확인 실패는 사이트 갱신 완료로 보고하지 않는다. 변경 내용·실행 상태·남은 문제를 보고한다.

검증 명령:

```powershell
npm run family:audit
npm test
npm run build
node scripts/check-public.mjs
node scripts/build-family-info.mjs --check
node scripts/build-publishing-ui.mjs --check
node scripts/build-event-data.mjs --check
node scripts/build-kids-calendar.mjs --check
```

`build-parenting-deals.mjs`에는 읽기 전용 --check가 없다. 전체 빌드에서 사용하며, 따로 --check 검사라고 실행하지 않는다. 기존 세일·축제 원본이 바뀌면 해당 audit도 실행한다. Supabase·광고·통계·관리자·연락처 설정은 이 작업에서 변경하지 않는다.

## 수·목 블로그 큐

- 대상: `https://blog.naver.com/6a_blog`. 수요일은 5항목, 목요일은 4항목이다. 실제 글 수는 유효 지역/분야 분할 수에 따른다. 세일은 뷰티를 포함한 현행 7개 분야, 축제는 7개 권역을 유지한다.
- 운영 배포 확인 후 `npm run family:blog -- --live --day=3` 또는 `--day=4`로 **운영 피드**에서 큐를 만든다. 로컬 파일 모드는 검수용이며 운영 게시 근거로 사용하지 않는다.
- 주차는 일요일 시작 KST다. 키는 `주차 시작일:분야:region/sector/national:분리값:weekly`다. 스냅샷만 바뀌었다고 재발행하지 않는다.
- 큐는 `scratch/family-blog/주차/요일/queue.json`과 읽기 좋은 Markdown 원고다. 초안 생성은 게시 성공이 아니다. 실제 게시 URL·사용 항목 버전을 이력에 남겨야 한다.
- 발행 전에 사용할 항목의 마감·취소·중요 조건을 공식 원문에서 다시 확인한다. 변경이 있으면 사이트 원본 정정·재배포·운영 확인 후 큐를 다시 만든다. 필요한 레코드만 재검증하며 매일 전체 수집으로 확대하지 않는다.
- 따뜻하고 간결한 구어체로 다듬되 방문 경험을 만들어내지 않는다. 날짜·대상·비용·핵심 조건·공식 링크·시뮬랩 링크·유효한 지도 링크·출처 확인일을 넣는다. 관련 자체 정리 화면 캡처 1장을 준비하고 캡처시각을 기록한다. 해시태그 8~10개, `#직장인아빠`·`#51개월육아` 제외.
- 네이버 브라우저 접근·로그인과 기존 배치 발행 승인 조건을 확인한다. 준비가 안 되어도 원고·캡처부터 준비하고 배치 단위로 필요한 조치를 보고한다. 이미 허용된 범위에 같은 승인을 글마다 반복 요구하지 않는다. 앱/컴퓨터가 꺼졌을 때 깨울 수 있다고 설명하지 않는다.
- 게시 직전 `record-family-publication.mjs`로 publishing을 기록한다. 성공 후 실제 게시 URL을 확인하여 published로 기록한다. 응답 불명은 unknown으로 남기고 실제 게시 여부를 대조한다. publishing/unknown/published는 자동 재발행하지 않는다. failed만 정상 재시도 대상으로 두며 같은 키를 유지한다.

```powershell
node scripts/record-family-publication.mjs --key="주차:분야:region:지역:weekly" --status=publishing --snapshot=실제24자리ID --revision=항목버전 --records=레코드ID
# 실제 게시 성공과 URL 확인 후
node scripts/record-family-publication.mjs --key="같은키" --status=published --snapshot=같은ID --url=https://blog.naver.com/6a_blog/실제글번호
```

현재는 큐와 이력 도구가 구현되어 있다. 네이버 게시가 성공했다는 보고는 실제 게시 영수증이 있을 때만 한다. 기존 글 수정·새 비용·새 인증키/계정 발급은 승인 범위를 별도로 확인한다.

## 예약 전환

기존 `automation`은 축제와 세일을 월·목에 같이 검토했다. 새 사이트 경로·스냅샷·검증을 확인한 후 이 ID를 화요일 저녁 축제 전용으로 바꾸고, 나머지 8개 항목은 각각 별도 예약으로 설정한다. 수목 블로그는 한 예약이 요일별 큐를 선택한다. 전환 ID와 상태는 `docs/family-info-automation-status.json`에 기록한다. 준비 중 생성한 PAUSED 예약은 실제 활성화 전까지 활성이라고 보고하지 않는다.
