-- Add the focused calculators and existing family pages to the collector allowlist.
-- Historical IDs remain valid; archived pages stop sending activity in the browser.
-- The browser requests this write-only RPC only after analytics consent.
-- Anonymous collection intentionally does not require a signed-in Auth user.
-- Raw tables remain inaccessible to public clients.
ALTER TABLE public.analytics_pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.analytics_pageviews,public.analytics_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.record_site_activity(
  p_session_id uuid,p_tool_id text,p_action text DEFAULT 'page_view'
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $collector$
DECLARE landing boolean;
BEGIN
  IF p_session_id IS NULL OR p_session_id='00000000-0000-0000-0000-000000000000'::uuid
    OR p_tool_id IS NULL OR p_tool_id NOT IN (
      'home-portal','national-pension-sim','severance-pay-calc','salary-net-calc',
      'unemployment-benefit-calc','hourly-labor-value-calc','leverage-etf-sim',
      'stock-profit-calc','stock-water-ride-calc','stock-target-compound-calc',
      'dividend-tax-sim','dividend-goal-calc','past-apt-timemachine','loan-mortgage-calc',
      'jeonse-wolse-sim','capital-gains-tax-sim','area-pyeong-calc','logistics-roi-calc',
      'kids-outing-calendar','parenting-deals','korean-age-calc','percent-discount-calc',
      'working-parents-guide','pay-work-guide','living-cost-guide',
      'life-hourglass-sim','diet-bmr-tdee-calc','caffeine-sleep-calc','running-zone-calc',
      'alcohol-widmark-calc','saju-wealth-sim','invest-animal-mbti','love-animal-attachment',
      'korean-wealth-percentile-calc','korean-average-vs-me','korean-baby-name-trend',
      'korean-city-income-housing','world-gni-ranking-race','korean-trade-ranking',
      'korean-tourism-travel-stats','korean-population-pyramid','world-population-area-rank',
      'game-typing','game-brick-breaker','game-dodge','ladder-draw-game','dutch-pay-roulette',
      'lotto-draw-sim','lotto-tax-interest-calc','smoking-wealth-sim','opportunity-cost-calc',
      'coffee-opportunity-calc','missed-investment-calc','retirement-survival-sim',
      'inflation-purchasing-power-calc',
      'family-info-calendar','kids-programs','local-parenting','family-support','camping-booking','family-culture','kids-popups','family-discounts','annual-leave-calc','unit-price-calc','membership-benefit-calc','travel-budget-calc'
    ) OR p_action IS NULL OR p_action NOT IN (
      'page_view','calculate','share','game_complete','copy_share_url','reset'
    ) THEN
    RAISE EXCEPTION 'Invalid activity' USING ERRCODE='22023';
  END IF;

  -- Serialize the shared ceiling. This is a write limit, not bot identification.
  PERFORM pg_catalog.pg_advisory_xact_lock(20481023);
  IF (SELECT count(*) FROM public.analytics_pageviews WHERE created_at>now()-interval '1 minute')
    +(SELECT count(*) FROM public.analytics_events WHERE created_at>now()-interval '1 minute')>=120
  THEN RETURN false; END IF;

  IF p_action='page_view' THEN
    IF EXISTS(SELECT 1 FROM public.analytics_pageviews WHERE session_id=p_session_id::text
      AND tool_id=p_tool_id AND created_at>now()-interval '10 seconds')
    THEN RETURN false; END IF;
    landing:=NOT EXISTS(SELECT 1 FROM public.analytics_pageviews WHERE session_id=p_session_id::text);
    INSERT INTO public.analytics_pageviews(session_id,tool_id,path,referrer,user_agent,is_landing_page,created_at)
    VALUES(p_session_id::text,p_tool_id,CASE WHEN p_tool_id='home-portal' THEN '/' ELSE '/tools/'||p_tool_id||'/' END,
      '','',landing,now());
  ELSE
    IF EXISTS(SELECT 1 FROM public.analytics_events WHERE session_id=p_session_id::text
      AND tool_id=p_tool_id AND event_action=p_action AND created_at>now()-interval '2 seconds')
    THEN RETURN false; END IF;
    INSERT INTO public.analytics_events(session_id,tool_id,event_category,event_action,event_label,created_at)
    VALUES(p_session_id::text,p_tool_id,'interaction',p_action,'',now());
  END IF;
  RETURN true;
END;
$collector$;
REVOKE ALL ON FUNCTION public.record_site_activity(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_site_activity(uuid,text,text) TO anon,authenticated;
COMMENT ON FUNCTION public.record_site_activity(uuid,text,text) IS
  'Write-only consent-based analytics endpoint: fixed tool/action lists, server-owned fields, deduplication, shared 120 writes/minute ceiling.';
NOTIFY pgrst, 'reload schema';
