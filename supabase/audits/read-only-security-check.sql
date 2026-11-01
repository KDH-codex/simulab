-- SimuLab permission audit: READ ONLY, no visitor/ranking rows, no secret keys.
-- Run in the intended project's Supabase SQL Editor. Read all result sets.
-- This script does NOT fix or change any policy, function or data.
BEGIN TRANSACTION READ ONLY;

-- 1. RLS status and view options. security_invoker=true matters for views.
SELECT n.nspname AS schema_name, c.relname AS object_name, c.relkind,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
       c.reloptions AS view_options
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN
 ('analytics_pageviews','analytics_events','analytics_daily_summary',
  'game_rankings','game_rankings_top10')
ORDER BY c.relname;

-- 2. Effective table/view grants, including grants inherited from PUBLIC.
-- A table grant is not enough to read protected rows: inspect RLS as well.
SELECT c.relname AS object_name, r.role_name,
       has_table_privilege(r.role_name::name, c.oid, 'SELECT') AS can_select,
       has_table_privilege(r.role_name::name, c.oid, 'INSERT') AS can_insert,
       has_table_privilege(r.role_name::name, c.oid, 'UPDATE') AS can_update,
       has_table_privilege(r.role_name::name, c.oid, 'DELETE') AS can_delete
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN (VALUES ('anon'),('authenticated')) AS r(role_name)
WHERE n.nspname = 'public' AND c.relname IN
 ('analytics_pageviews','analytics_events','analytics_daily_summary',
  'game_rankings','game_rankings_top10')
ORDER BY c.relname, r.role_name;

-- 3. Actual deployed RLS policies (the repository may differ).
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN
 ('analytics_pageviews','analytics_events','game_rankings')
ORDER BY tablename, policyname;

-- 4. Admin RPC privilege, definer status, fixed search_path and auth indicators.
-- Indicators are hints, NOT proof of correct authorization.
SELECT p.oid::regprocedure AS function_signature,
       p.prosecdef AS security_definer, p.proconfig AS function_settings,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
       position('auth.uid' in lower(p.prosrc)) > 0 AS mentions_auth_uid,
       position('auth.jwt' in lower(p.prosrc)) > 0 AS mentions_auth_jwt
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN
 ('get_admin_dashboard_summary','record_site_activity','submit_game_score');

-- 5. Constraints and writable columns: verify score bounds and server-owned fields.
SELECT c.relname AS table_name, con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN
 ('analytics_pageviews','analytics_events','game_rankings')
ORDER BY c.relname, con.conname;

SELECT column_name,
       has_column_privilege('anon','public.game_rankings',column_name,'INSERT') AS anon_can_insert,
       has_column_privilege('authenticated','public.game_rankings',column_name,'INSERT') AS authenticated_can_insert
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'game_rankings'
ORDER BY ordinal_position;

ROLLBACK;
