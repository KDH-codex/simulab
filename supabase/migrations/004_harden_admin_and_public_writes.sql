-- Review and apply in the intended project after migrations 001-003.
-- This changes access rules; it does not delete existing rows or create users.
BEGIN;
CREATE SCHEMA IF NOT EXISTS simulab_private;
REVOKE ALL ON SCHEMA simulab_private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS simulab_private.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE simulab_private.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE simulab_private.admin_users FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary(days_count integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE start_at timestamptz; result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM simulab_private.admin_users a WHERE a.user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501';
  END IF;
  IF days_count IS NULL OR days_count < 1 OR days_count > 90 THEN
    RAISE EXCEPTION 'days_count must be between 1 and 90' USING ERRCODE='22023';
  END IF;
  start_at := ((now() AT TIME ZONE 'Asia/Seoul')::date - (days_count-1))::timestamp AT TIME ZONE 'Asia/Seoul';
  SELECT jsonb_build_object(
    'securityVersion',2,'is_cloud',true,
    'daily',COALESCE((SELECT jsonb_object_agg(d.day,jsonb_build_object('uv',d.sessions,'pv',d.views)) FROM (
      SELECT to_char(p.created_at AT TIME ZONE 'Asia/Seoul','YYYY-MM-DD') AS day,count(DISTINCT p.session_id) AS sessions,count(*) AS views
      FROM public.analytics_pageviews p WHERE p.created_at>=start_at AND p.created_at<=now() GROUP BY 1
    ) d),'{}'::jsonb),
    'periodSessions',(SELECT count(DISTINCT p.session_id) FROM public.analytics_pageviews p WHERE p.created_at>=start_at AND p.created_at<=now()),
    'toolRanking',COALESCE((SELECT jsonb_object_agg(t.tool_id,t.views) FROM (
      SELECT p.tool_id,count(*) AS views FROM public.analytics_pageviews p WHERE p.created_at>=start_at AND p.created_at<=now() GROUP BY p.tool_id ORDER BY views DESC LIMIT 60
    ) t),'{}'::jsonb),
    'landingPages',COALESCE((SELECT jsonb_object_agg(t.tool_id,t.views) FROM (
      SELECT p.tool_id,count(*) AS views FROM public.analytics_pageviews p WHERE p.is_landing_page AND p.created_at>=start_at AND p.created_at<=now() GROUP BY p.tool_id ORDER BY views DESC LIMIT 20
    ) t),'{}'::jsonb),
    'recentEvents',COALESCE((SELECT jsonb_agg(jsonb_build_object('time',e.event_time,'tool',e.tool_id,'action',e.event_action) ORDER BY e.created_at DESC) FROM (
      SELECT to_char(v.created_at AT TIME ZONE 'Asia/Seoul','MM-DD HH24:MI') AS event_time,v.tool_id,v.event_action,v.created_at
      FROM public.analytics_events v WHERE v.created_at>=start_at AND v.created_at<=now() ORDER BY v.created_at DESC LIMIT 30
    ) e),'[]'::jsonb)
  ) INTO result;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.get_admin_dashboard_summary(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_summary(integer) TO authenticated;
ALTER VIEW public.analytics_daily_summary SET (security_invoker=true);
REVOKE ALL ON public.analytics_daily_summary FROM PUBLIC,anon,authenticated;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.analytics_pageviews,public.analytics_events FROM PUBLIC,anon,authenticated;

-- Public collection accepts fixed fields only. It has a shared write ceiling,
-- not a claim of bot-proof analytics. Add edge-level rate limits as traffic grows.
CREATE OR REPLACE FUNCTION public.record_site_activity(p_session_id uuid,p_tool_id text,p_action text DEFAULT 'page_view')
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE landing boolean;
BEGIN
  IF p_session_id IS NULL OR p_tool_id IS NULL OR p_tool_id !~ '^[a-z0-9-]{1,80}$' OR p_tool_id NOT IN ('home-portal','national-pension-sim','severance-pay-calc','salary-net-calc','unemployment-benefit-calc','hourly-labor-value-calc','leverage-etf-sim','stock-profit-calc','stock-water-ride-calc','stock-target-compound-calc','dividend-tax-sim','dividend-goal-calc','past-apt-timemachine','loan-mortgage-calc','jeonse-wolse-sim','capital-gains-tax-sim','area-pyeong-calc','logistics-roi-calc','kids-outing-calendar','korean-age-calc','percent-discount-calc','life-hourglass-sim','diet-bmr-tdee-calc','caffeine-sleep-calc','running-zone-calc','alcohol-widmark-calc','saju-wealth-sim','invest-animal-mbti','love-animal-attachment','korean-wealth-percentile-calc','korean-average-vs-me','korean-baby-name-trend','korean-city-income-housing','world-gni-ranking-race','korean-trade-ranking','korean-tourism-travel-stats','korean-population-pyramid','world-population-area-rank','game-tetris','game-typing','game-brick-breaker','game-dodge','ladder-draw-game','dutch-pay-roulette','lotto-draw-sim','lotto-tax-interest-calc','smoking-wealth-sim','opportunity-cost-calc','coffee-opportunity-calc','missed-investment-calc','retirement-survival-sim','inflation-purchasing-power-calc') OR p_action IS NULL OR p_action NOT IN ('page_view','calculate','share','game_complete','copy_share_url','reset') THEN
    RAISE EXCEPTION 'Invalid activity' USING ERRCODE='22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(20481023);
  IF (SELECT count(*) FROM public.analytics_pageviews WHERE created_at>now()-interval '1 minute') +
     (SELECT count(*) FROM public.analytics_events WHERE created_at>now()-interval '1 minute') >= 120 THEN RETURN false; END IF;
  IF p_action='page_view' THEN
    IF EXISTS(SELECT 1 FROM public.analytics_pageviews WHERE session_id=p_session_id::text AND tool_id=p_tool_id AND created_at>now()-interval '10 seconds') THEN RETURN false; END IF;
    landing := NOT EXISTS(SELECT 1 FROM public.analytics_pageviews WHERE session_id=p_session_id::text);
    INSERT INTO public.analytics_pageviews(session_id,tool_id,path,referrer,user_agent,is_landing_page,created_at)
      VALUES(p_session_id::text,p_tool_id,CASE WHEN p_tool_id='home-portal' THEN '/' ELSE '/tools/'||p_tool_id||'/' END,'','',landing,now());
  ELSE
    IF EXISTS(SELECT 1 FROM public.analytics_events WHERE session_id=p_session_id::text AND event_action=p_action AND created_at>now()-interval '2 seconds') THEN RETURN false; END IF;
    INSERT INTO public.analytics_events(session_id,tool_id,event_category,event_action,event_label,created_at)
      VALUES(p_session_id::text,p_tool_id,'interaction',p_action,'',now());
  END IF;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.record_site_activity(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_site_activity(uuid,text,text) TO anon,authenticated;

-- Scores remain user-submitted records, not verified gameplay. The server sets
-- timestamps and display text, rejects invalid values and caps new writes.
ALTER TABLE public.game_rankings ADD COLUMN IF NOT EXISTS submission_id uuid;
ALTER TABLE public.game_rankings ADD COLUMN IF NOT EXISTS submitter_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS game_rankings_submission_id_unique ON public.game_rankings(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS game_rankings_game_created ON public.game_rankings(game_id,created_at DESC);
CREATE INDEX IF NOT EXISTS game_rankings_submitter_created ON public.game_rankings(submitter_id,created_at DESC);
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.game_rankings FROM PUBLIC,anon,authenticated;
REVOKE SELECT ON public.game_rankings FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,game_id,nickname,score,score_display,created_at) ON public.game_rankings TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.submit_game_score(p_game_id text,p_nickname text,p_score numeric,p_submitter_id uuid,p_submission_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE new_id uuid; display_text text; clean_nick text;
BEGIN
  clean_nick:=btrim(p_nickname);
  IF p_game_id IS NULL OR p_game_id NOT IN ('game-tetris','game-dodge','game-typing','game-brick-breaker') OR
     clean_nick IS NULL OR char_length(clean_nick) NOT BETWEEN 2 AND 12 OR clean_nick ~ '[[:cntrl:]<>]' OR
     p_score IS NULL OR NOT (p_score>0 AND p_score<1000000000) OR
     (p_game_id='game-dodge' AND p_score>3600) OR p_submitter_id IS NULL OR p_submission_id IS NULL THEN
    RAISE EXCEPTION 'Invalid score submission' USING ERRCODE='22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(20481024);
  SELECT id INTO new_id FROM public.game_rankings WHERE submission_id=p_submission_id;
  IF new_id IS NOT NULL THEN RETURN new_id; END IF;
  IF EXISTS(SELECT 1 FROM public.game_rankings WHERE submitter_id=p_submitter_id AND created_at>now()-interval '30 seconds') OR
     (SELECT count(*) FROM public.game_rankings WHERE created_at>now()-interval '1 minute')>=60 THEN
    RAISE EXCEPTION 'Submission rate exceeded' USING ERRCODE='P0001';
  END IF;
  display_text:=CASE WHEN p_game_id='game-dodge' THEN to_char(p_score,'FM999990.00')||'초' ELSE to_char(trunc(p_score),'FM999,999,999,990')||'점' END;
  INSERT INTO public.game_rankings(game_id,nickname,score,score_display,created_at,submitter_id,submission_id)
    VALUES(p_game_id,clean_nick,p_score,display_text,now(),p_submitter_id,p_submission_id) RETURNING id INTO new_id;
  RETURN new_id;
END; $$;
REVOKE ALL ON FUNCTION public.submit_game_score(text,text,numeric,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_game_score(text,text,numeric,uuid,uuid) TO anon,authenticated;
COMMIT;
