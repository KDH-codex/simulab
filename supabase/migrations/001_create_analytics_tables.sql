-- ==========================================================================
-- 001_create_analytics_tables.sql
-- 시뮬랩(SimuLab) 방문자 행동 분석 및 사용자 여정(User Flow) 추적 테이블
-- ==========================================================================

-- 1. 방문 페이지뷰 로그 테이블 (어디로 접속했는지, 첫 방문 여부 추적)
CREATE TABLE IF NOT EXISTS public.analytics_pageviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,                  -- 브라우저 세션 고유 식별자 (익명화)
    tool_id TEXT NOT NULL,                     -- 방문한 계산기 도구 ID (예: 'past-apt-timemachine')
    path TEXT NOT NULL,                        -- 실제 URL 경로 (예: '/tools/past-apt-timemachine/index.html')
    referrer TEXT,                             -- 이전 유입 경로 (외부 검색엔진 또는 이전 도구)
    is_landing_page BOOLEAN DEFAULT FALSE,     -- 최초 유입 페이지(Landing Page) 여부
    user_agent TEXT,                           -- 브라우저 및 기기 정보
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. 사용자 세부 인터랙션 이벤트 테이블 (계산 실행, 공유 버튼 클릭 등)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    event_category TEXT NOT NULL,              -- 이벤트 대분류 (예: 'interaction', 'share', 'preset')
    event_action TEXT NOT NULL,                -- 세부 액션 (예: 'calculate', 'copy_share_url', 'change_pack')
    event_label TEXT,                          -- 부가 정보 (예: 'mapo_raemian', 'sp500_8pct')
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. 빠른 통계 집계를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_pageviews_created_at ON public.analytics_pageviews(created_at);
CREATE INDEX IF NOT EXISTS idx_pageviews_tool_id ON public.analytics_pageviews(tool_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_session_id ON public.analytics_pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.analytics_events(created_at);

-- 4. 행 수준 보안(RLS, Row Level Security) 활성화
ALTER TABLE public.analytics_pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 5. 보안 정책: 일반 방문자는 오직 INSERT(데이터 기록)만 가능, 조회(SELECT)는 차단
CREATE POLICY "Allow anonymous insert pageviews" 
ON public.analytics_pageviews 
FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Allow anonymous insert events" 
ON public.analytics_events 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- 6. 보안 정책: 관리자(service_role)만 모든 데이터 조회 및 분석 가능
CREATE POLICY "Allow service_role select pageviews" 
ON public.analytics_pageviews 
FOR SELECT 
TO service_role 
USING (true);

CREATE POLICY "Allow service_role select events" 
ON public.analytics_events 
FOR SELECT 
TO service_role 
USING (true);

-- 7. 일별 요약 통계를 빠르게 조회하기 위한 집계 뷰
CREATE OR REPLACE VIEW public.analytics_daily_summary AS
SELECT 
    date_trunc('day', created_at) AS date,
    COUNT(DISTINCT session_id) AS unique_visitors,
    COUNT(*) AS total_pageviews,
    COUNT(DISTINCT CASE WHEN is_landing_page THEN session_id END) AS new_landing_visitors
FROM public.analytics_pageviews
GROUP BY 1
ORDER BY 1 DESC;
