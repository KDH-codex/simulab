# 이번주 축제 · Antigravity 교차검토 운영안

사용자 의도: Codex가 구현한 결과를 실제 Antigravity가 독립적으로 검토하고, 디자인·UI·UX·모션·이펙트의 누락을 찾아 다음 실행계획에 반영한다.

## 현재 준비 상태

- 로컬 Antigravity CLI `agy` 버전 1.5.0과 `--print`, `--mode plan`, `--output-format json`, `--print-timeout` 옵션을 실제 확인했다.
- 2026-11-05 기존 로그인과 모델 목록을 확인하고, 사용자가 지정한 `gemini-4-argon-medium` / effort `medium`으로 실제 검토를 요청했다. 실행 시작 이벤트에서도 해당 모델을 확인했다. 실행 기록은 `scratch/antigravity-review/argon-medium-20261105/`에 보관한다. 실행 시작을 검토 완료로 보고하지 않는다.
- Codex 내부 하위 에이전트의 검토는 Antigravity 검토로 기록하지 않는다.
- 검토 기준 커밋: `1b2b0876cfdb100f526a7672e64f35788024484f`.
- 구현 작업 폴더: `C:/Users/dongh/.codex/visualizations/2026/10/22/01a16474-cd50-77f2-88e1-bd3a4218c615/festival-platform`.
- 공개 사이트: <https://simulab.kr/>. 운영 사이트는 변할 수 있으므로 검토 시 공개 피드의 siteRevision을 기준 커밋과 대조한다.
- 원래 `C:/project/addseo`에는 별도 미완료 변경이 많다. 해당 폴더를 배포 버전으로 간주하지 않는다.

## 역할과 순서

1. **Codex / 검토 준비**: 기준 커밋, 사용자 요구사항, Stitch 원본, 실제 변경 파일, 화면 확인 시나리오를 고정한다. 검토 중에는 기준 구현을 수정하지 않는다.
2. **Antigravity / 독립 검토**: `antigravity-review-request.md`에 따라 코드와 실제 화면을 검토한다. 구현·데이터 수정·커밋·배포는 맡기지 않는다. 보고서는 표준 출력 또는 별도 검토 산출물로 전달한다.
3. **Codex / 지적 재현**: 각 지적을 재현하고 `수용 / 보류 / 제외`로 분류한다. 취향 제안과 기능 결함을 구분하고, 제외 이유도 기록한다.
4. **Codex / 실행계획 통합**: 지적 ID → 사용자 영향 → 변경 파일 → 구현 순서 → 화면 검증 조건을 연결한다. 계획을 먼저 확정한 뒤 실제 구현한다.
5. **Codex 구현 → Antigravity 재검토**: 수용한 지적과 회귀 항목만 다시 확인한다. 기본 2회 이내로 제한하며, 남은 지적은 명시적으로 기록한다. 테스트 통과와 실제 화면 검증 후 기존 배포 절차를 따른다.

여러 에이전트가 같은 파일을 동시에 수정하지 않는다. Antigravity에는 검토자의 역할을, Codex에는 통합 구현자의 역할을 부여한다. `plan`과 프롬프트는 작업 범위 지시이며 운영체제 수준의 읽기 전용 권한을 보장하지 않는다. 실행 자동화 시에는 별도 검토 복사본을 사용하고 변경 여부를 확인한다.

## 결과물과 판정

각 검토 실행은 기준 커밋·CLI 버전·실제 모델·실행 시각·종료 상태·도구 제약을 남긴다. 모델명이 확인되지 않으면 추정해서 Gemini라고 기록하지 않는다.

- **정적 검토**: 파일과 코드에서 확인한 사항.
- **화면 검토**: 실제 URL·화면 폭·스크린샷으로 확인한 사항.
- **모션 검토**: 자동/수동 전환·스크롤·키보드·모션 줄이기를 실제 작동시켜 확인한 사항.

정적 검토만 가능했다면 화면·모션은 `미검증`이다. 오류·로그인 대기·시간 초과·브라우저 도구 없음·버전 불일치는 각각 기록하고 검토 완료로 합치지 않는다. 보고서가 없거나 코드와 운영 버전이 다르면 실행계획에 ‘검증된 결함’으로 반영하지 않는다.

## CLI 연결 방식

별도 MCP 서버 없이 설치된 CLI를 호출한다. 실제 실행은 필요한 파일만 복사한 별도 검토 폴더에서, 파일 쓰기·터미널 명령·MCP 호출을 거부하는 이번 실행 전용 설정을 적용했다. 아래는 모델·에포트를 명시하는 기본 형식이다. 실제 실행 기록의 명령·설정과 함께 참고한다.

```powershell
$reviewPrompt = Get-Content -LiteralPath './docs/antigravity-review-request.md' -Raw
agy --mode plan --model gemini-4-argon-medium --effort medium --output-format json --print-timeout 20m --print $reviewPrompt
```

이 예시는 기존 로그인과 명시한 Argon Medium을 사용한다. 다른 모델·에포트로 대체하지 않는다. 인증·권한·브라우저 제약이 나오면 해당 제약을 기록하고 원인을 해결한다. 권한 일괄 우회 옵션을 추가해 해결하지 않는다. 완전 자동 실행은 실제 로그인, 1회 호출, 브라우저 검토, 결과 회수까지 성공한 뒤 도입한다.

## 실행계획에 넣는 표

| 지적 ID | 판정·근거 | 사용자 영향 | 변경 파일 | 작업 순서 | 완료 확인 |
| --- | --- | --- | --- | --- | --- |
| 실제 검토 후 작성 | 수용/보류/제외와 재현 결과 | 구체적 영향 | 실제 경로 | 의존관계 포함 | 실제 화면·조작 기준 |

현재 실행의 완료 여부·결과·제약은 실제 종료 이벤트와 회수한 보고서를 기준으로 기록한다. 정적 검토 결과와 실제 화면·모션 검증 범위를 구분한다.

## 공식 참고

- Antigravity CLI headless: <https://antigravity.google/docs/cli/headless/>
- CLI 옵션: <https://antigravity.google/docs/cli/reference>
- 계획·검토 방식: <https://antigravity.google/docs/artifact-review>
- Codex MCP 연결: <https://learn.chatgpt.com/docs/extend/mcp?surface=cli>
