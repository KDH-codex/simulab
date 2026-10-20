-- ==========================================================================
-- 002_create_game_rankings_table.sql
-- 시뮬랩(SimuLab) 미니게임 실시간 명예의 전당 온라인 랭킹 테이블
-- 
-- 적용 게임:
-- 1. 테트리스 (game-tetris)
-- 2. 미사일 피하기 닷지 1.9 (game-dodge)
-- 3. 스피드 타자 산성비 (game-typing)
-- 4. 네온 벽돌 깨기 (game-brick-breaker)
-- ==========================================================================

-- 1. 미니게임 실시간 랭킹 저장 테이블 생성
CREATE TABLE IF NOT EXISTS public.game_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL,                     -- 게임 식별자 ('game-tetris', 'game-dodge', 'game-typing', 'game-brick-breaker')
    nickname TEXT NOT NULL,                    -- 유저가 입력한 닉네임 (2~12자)
    score NUMERIC NOT NULL,                    -- 정렬용 점수 (테트리스/타자/벽돌깨기: 점수, 닷지: 생존 초)
    score_display TEXT NOT NULL,               -- 화면에 예쁘게 표시할 포맷 문자열 (예: '38,400점', '01:44.82')
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()) -- 기록 달성 시각 (UTC)
);

-- 2. 초고속 TOP 10 랭킹 조회를 위한 복합 인덱스 (Index) 생성
-- 게임 ID로 필터링하고 높은 점수(score DESC), 동점 시 먼저 달성한 순(created_at ASC)으로 즉시 인덱스 스캔
CREATE INDEX IF NOT EXISTS idx_game_rankings_leaderboard 
ON public.game_rankings(game_id, score DESC, created_at ASC);

-- 특정 유저의 등록 이력 및 생성일자 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_game_rankings_created_at 
ON public.game_rankings(created_at DESC);

-- 3. 행 수준 보안 (RLS, Row Level Security) 활성화
-- 외부 클라이언트(브라우저)에서 무단으로 데이터를 변조하거나 삭제하지 못하도록 엄격히 통제합니다.
ALTER TABLE public.game_rankings ENABLE ROW LEVEL SECURITY;

-- 4. 보안 정책 1: 누구나(익명 anon 및 로그인 사용자) 실시간 랭킹 목록을 조회(SELECT)할 수 있음
CREATE POLICY "Allow public read game rankings" 
ON public.game_rankings 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 5. 보안 정책 2: 정상적인 점수와 올바른 닉네임만 새로 등록(INSERT)할 수 있도록 검증 (강력한 보안 및 유효성 체크)
-- - game_id: 허용된 4가지 게임만 가능
-- - nickname: 공백 제외 2자 이상 12자 이하
-- - score: 0 초과 양수
CREATE POLICY "Allow public insert valid game rankings" 
ON public.game_rankings 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (
    game_id IN ('game-tetris', 'game-dodge', 'game-typing', 'game-brick-breaker')
    AND char_length(trim(nickname)) >= 2 
    AND char_length(trim(nickname)) <= 12
    AND score > 0
    AND score_display IS NOT NULL
);

-- 6. 보안 정책 3: 일반 사용자의 수정(UPDATE) 및 삭제(DELETE)는 차단 (오직 service_role 관리자만 가능)
-- (기본적으로 정책을 정의하지 않으면 anon 사용자는 UPDATE/DELETE가 전면 거부됩니다.)

-- 7. 편의 뷰(View): 각 게임별 상위 10위 랭킹을 한눈에 조회하는 집계 뷰
CREATE OR REPLACE VIEW public.game_rankings_top10 AS
WITH ranked AS (
    SELECT 
        id,
        game_id,
        nickname,
        score,
        score_display,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY game_id 
            ORDER BY score DESC, created_at ASC
        ) AS rank_num
    FROM public.game_rankings
)
SELECT 
    id,
    game_id,
    rank_num,
    nickname,
    score,
    score_display,
    created_at
FROM ranked
WHERE rank_num <= 10;
