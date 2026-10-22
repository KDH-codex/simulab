import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
test('PostgreSQL enforces the new admin and public-write boundaries',async t=>{
 const db=new PGlite();
 t.after(()=>db.close());
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
 GRANT USAGE ON SCHEMA auth TO anon,authenticated;`);
 for(const name of ['001_create_analytics_tables.sql','002_create_game_rankings_table.sql','003_create_analytics_rpc.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 await db.exec('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,authenticated;');
 await db.exec(await readFile(new URL('../supabase/migrations/004_harden_admin_and_public_writes.sql',import.meta.url),'utf8'));
 const admin=randomUUID(),member=randomUUID();
 await db.query('INSERT INTO auth.users(id) VALUES($1),($2)',[admin,member]);await db.query('INSERT INTO simulab_private.admin_users(user_id) VALUES($1)',[admin]);
 async function as(role,uid,fn){assert.ok(['anon','authenticated'].includes(role));await db.exec('SET ROLE '+role);await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[uid||'']);try{return await fn();}finally{await db.exec('RESET ROLE');await db.query("SELECT set_config('request.jwt.claim.sub','',false)");}}
 await t.test('anon and ordinary accounts cannot call the admin summary',async()=>{
  await as('anon',null,()=>assert.rejects(db.query('SELECT public.get_admin_dashboard_summary(7)'),e=>e.code==='42501'));
  await as('authenticated',member,()=>assert.rejects(db.query('SELECT public.get_admin_dashboard_summary(7)'),e=>e.code==='42501'));
 });
 await t.test('an allowlisted admin receives versioned data and invalid periods are rejected',async()=>{
  const result=await as('authenticated',admin,()=>db.query('SELECT public.get_admin_dashboard_summary(7) AS summary'));
  assert.equal(result.rows[0].summary.securityVersion,2);
  await as('authenticated',admin,()=>assert.rejects(db.query('SELECT public.get_admin_dashboard_summary(1000)'),e=>e.code==='22023'));
 });
 await t.test('direct anonymous writes and the old summary view are blocked',async()=>{
  await as('anon',null,()=>assert.rejects(db.exec("INSERT INTO public.analytics_pageviews(session_id,tool_id,path) VALUES('fake','tool','/')"),e=>e.code==='42501'));
  await as('anon',null,()=>assert.rejects(db.exec("INSERT INTO public.game_rankings(game_id,nickname,score,score_display) VALUES('game-tetris','가짜',999,'fake')"),e=>e.code==='42501'));
  await as('anon',null,()=>assert.rejects(db.query('SELECT * FROM public.analytics_daily_summary'),e=>e.code==='42501'));
 });
 await t.test('the analytics RPC deduplicates rapid pageviews without accepting free-text labels',async()=>{
  const id=randomUUID();const first=await as('anon',null,()=>db.query("SELECT public.record_site_activity($1,'area-pyeong-calc','page_view') AS accepted",[id]));assert.equal(first.rows[0].accepted,true);
  const second=await as('anon',null,()=>db.query("SELECT public.record_site_activity($1,'area-pyeong-calc','page_view') AS accepted",[id]));assert.equal(second.rows[0].accepted,false);
  await as('anon',null,()=>assert.rejects(db.query("SELECT public.record_site_activity($1,'area-pyeong-calc','<img>')",[id]),e=>e.code==='22023'));
  await as('anon',null,()=>assert.rejects(db.query("SELECT public.record_site_activity($1,'unknown-tool','page_view')",[id]),e=>e.code==='22023'));
 });
 await t.test('score RPC rejects special numbers and stores a server-generated display',async()=>{
  const submitter=randomUUID(),submission=randomUUID();
  for(const score of ['NaN','Infinity','-1','0'])await as('anon',null,()=>assert.rejects(db.query("SELECT public.submit_game_score('game-tetris','테스트',$1,$2,$3)",[score,submitter,randomUUID()]),e=>e.code==='22023'));
  const first=await as('anon',null,()=>db.query("SELECT public.submit_game_score('game-tetris','테스트',1234,$1,$2) AS id",[submitter,submission]));
  const again=await as('anon',null,()=>db.query("SELECT public.submit_game_score('game-tetris','테스트',1234,$1,$2) AS id",[submitter,submission]));assert.equal(first.rows[0].id,again.rows[0].id);
  const row=await as('anon',null,()=>db.query('SELECT nickname,score_display FROM public.game_rankings'));assert.equal(row.rows[0].nickname,'테스트');assert.equal(row.rows[0].score_display,'1,234점');
  await as('anon',null,()=>assert.rejects(db.query('SELECT submitter_id FROM public.game_rankings'),e=>e.code==='42501'));
  await as('anon',null,()=>assert.rejects(db.query("SELECT public.submit_game_score('game-tetris','테스트',2000,$1,$2)",[submitter,randomUUID()]),e=>e.code==='P0001'));
 });
});
