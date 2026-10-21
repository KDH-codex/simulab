-- ==========================================================================
-- 003_create_analytics_rpc.sql
-- 시뮬랩(SimuLab) 관리자 대시보드 전용 안전한 실시간 통계 집계 함수 (RPC)
-- 
-- [보안 및 성능 최적화]
-- 1. 브라우저에 최고 관리자(service_role) 키를 절대 노출하지 않고,
--    익명(anon) 키로도 안전하게 집계된 통계(UV, PV, 랭킹)만 조회 가능
-- 2. 단 1회의 RPC 호출로 차트, 랭킹, 실시간 로그를 JSON 형태로 즉시 반환
-- ==========================================================================

-- 1. 관리자 대시보드 종합 통계 집계 RPC 함수 생성
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary(days_count INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 생성자의 권한으로 안전하게 집계 실행 (테이블 직접 노출 방지)
AS $$
DECLARE
    result JSONB;
    start_date TIMESTAMPTZ;
BEGIN
    -- 집계 시작 기준일 계산 (기본 최근 30일)
    start_date := timezone('utc'::text, now()) - (days_count || ' days')::INTERVAL;

    WITH 
    -- 1) 일별 순방문자(UV) 및 총 페이지뷰(PV) 집계
    daily_stats AS (
        SELECT 
            to_char(timezone('Asia/Seoul', created_at), 'YYYY-MM-DD') AS stat_date,
            COUNT(DISTINCT session_id) AS uv,
            COUNT(*) AS pv
        FROM public.analytics_pageviews
        WHERE created_at >= start_date
        GROUP BY 1
        ORDER BY 1 ASC
    ),
    daily_json AS (
        SELECT COALESCE(
            jsonb_object_agg(
                stat_date, 
                jsonb_build_object('uv', uv, 'pv', pv)
            ), 
            '{}'::jsonb
        ) AS daily_map
        FROM daily_stats
    ),

    -- 2) 도구별 총 뷰수 순위 (상위 40개)
    tool_ranking AS (
        SELECT 
            tool_id,
            COUNT(*) AS view_count
        FROM public.analytics_pageviews
        WHERE created_at >= start_date
        GROUP BY tool_id
        ORDER BY view_count DESC
        LIMIT 40
    ),
    ranking_json AS (
        SELECT COALESCE(
            jsonb_object_agg(tool_id, view_count), 
            '{}'::jsonb
        ) AS ranking_map
        FROM tool_ranking
    ),

    -- 3) 첫 진입(Landing Page) 통계
    landing_stats AS (
        SELECT 
            tool_id,
            COUNT(*) AS landing_count
        FROM public.analytics_pageviews
        WHERE is_landing_page = TRUE
          AND created_at >= start_date
        GROUP BY tool_id
        ORDER BY landing_count DESC
        LIMIT 20
    ),
    landing_json AS (
        SELECT COALESCE(
            jsonb_object_agg(tool_id, landing_count), 
            '{}'::jsonb
        ) AS landing_map
        FROM landing_stats
    ),

    -- 4) 최근 발생한 실시간 이벤트 로그 (최신 30건)
    recent_logs AS (
        SELECT 
            to_char(timezone('Asia/Seoul', created_at), 'HH24:MI:SS') AS time,
            tool_id AS tool,
            event_action || COALESCE(' (' || event_label || ')', '') AS action,
            substring(session_id from 1 for 10) AS sid
        FROM public.analytics_events
        ORDER BY created_at DESC
        LIMIT 30
    ),
    events_json AS (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'time', time,
                    'tool', tool,
                    'action', action,
                    'sid', sid
                )
            ), 
            '[]'::jsonb
        ) AS events_arr
        FROM recent_logs
    )

    -- 최종 집계 JSON 결과 조합
    SELECT jsonb_build_object(
        'daily', (SELECT daily_map FROM daily_json),
        'toolRanking', (SELECT ranking_map FROM ranking_json),
        'landingPages', (SELECT landing_map FROM landing_json),
        'recentEvents', (SELECT events_arr FROM events_json),
        'is_cloud', true
    ) INTO result;

    RETURN result;
END;
$$;

-- 2. 일반 방문자/관리자 인터페이스에서 이 집계 함수를 호출할 수 있도록 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_summary(INT) TO anon, authenticated, service_role;
