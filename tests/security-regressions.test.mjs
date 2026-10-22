import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {rankingRows,eventRows} from '../tools/admin-dashboard/render.js';
const rankingCode=await readFile(new URL('../assets/js/game-ranking.js',import.meta.url),'utf8');
const trackerCode=await readFile(new URL('../assets/js/tracker.js',import.meta.url),'utf8');
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
const payload='<img src=x onerror="alert(1)">';
const settings={rankingRemoteEnabled:true,contactEmail:'operator@example.test',databaseRegion:'test'};
function rankingContext(fetchFn){const store=storage();return vm.createContext({window:{SIMULAB_SITE_SETTINGS:settings,SIMULAB_SUPABASE_CONFIG:{url:'https://example.invalid',anonKey:'public'}},localStorage:store,console,Intl,fetch:fetchFn,crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'}});}
test('ranking escapes remote displays and cached names/dates before creating HTML',async()=>{
 const board={innerHTML:''},ctx=rankingContext(async()=>({ok:true,json:async()=>[{nickname:'<img>',score:10,score_display:payload,created_at:'2026-10-23'}]}));
 ctx.localStorage.setItem('simulab_ranking_game-tetris_v2',JSON.stringify([{nickname:'<img>',score:10,display:payload,date:payload}]));vm.runInContext(rankingCode,ctx);ctx.window.GameRanking.renderBoard(board,'game-tetris');
 assert.ok(board.innerHTML.includes('&lt;img'));assert.ok(!board.innerHTML.includes(payload));await new Promise(resolve=>setImmediate(resolve));assert.ok(board.innerHTML.includes('&lt;img'));assert.ok(!board.innerHTML.includes(payload));assert.ok(board.innerHTML.includes('서버 조회 완료'));
});
test('invalid scores and unknown games are rejected without sending data',()=>{
 let requests=0;const ctx=rankingContext(async()=>{requests++;return {ok:true};});vm.runInContext(rankingCode,ctx);
 for(const score of [NaN,Infinity,-1,0,1e9]){assert.equal(ctx.window.GameRanking.checkRank('game-tetris',score).isTop10,false);assert.equal(ctx.window.GameRanking.saveRecord('game-tetris','테스트',score,'점수'),-1);}
 assert.equal(ctx.window.GameRanking.saveRecord('unknown','테스트',100,'100점'),-1);assert.equal(ctx.window.GameRanking.checkRank('game-dodge',3601).isTop10,false);assert.equal(requests,0);
});
test('failed leaderboard fetch is visibly marked as a failure instead of online success',async()=>{
 const ctx=rankingContext(async()=>({ok:false})),board={innerHTML:''};vm.runInContext(rankingCode,ctx);ctx.window.GameRanking.renderBoard(board,'game-tetris');await new Promise(resolve=>setImmediate(resolve));assert.ok(board.innerHTML.includes('연결 실패'));assert.ok(!board.innerHTML.includes('서버 조회 완료'));
});
test('failed remote score writes preserve the local record and return a failure status',async()=>{
 const ctx=rankingContext(async()=>({ok:false}));vm.runInContext(rankingCode,ctx);const result=await ctx.window.GameRanking.saveRecordAsync('game-tetris','테스트',10,'10점');assert.equal(result.status,'failed');assert.equal(ctx.window.GameRanking.getRankings('game-tetris').length,1);assert.ok(result.message.includes('이 기기에만'));
});
test('admin untrusted IDs and event fields are escaped, and arbitrary labels are not rendered',()=>{
 const rankings=rankingRows({[payload]:3});const events=eventRows([{tool:payload,time:payload,action:payload}]);assert.ok(rankings.includes('&lt;img'));assert.ok(events.includes('&lt;img'));assert.ok(!rankings.includes(payload));assert.ok(!events.includes(payload));
});
function trackerContext(allowed=true){const requests=[],listeners={},state={allowed};const window={SIMULAB_SUPABASE_CONFIG:{url:'https://example.invalid',anonKey:'public'},SimuLabPrivacy:{analyticsAllowed:()=>state.allowed},addEventListener:(name,fn)=>{listeners[name]=fn;}};const ctx=vm.createContext({window,location:{pathname:'/tools/area-pyeong-calc/'},sessionStorage:storage(),crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000002'},fetch:async(...args)=>{requests.push(args);return {ok:true};}});return {ctx,requests,state,listeners};}
test('tracking remains silent without consent and emits only one pageview after consent',()=>{
 const {ctx,requests,state,listeners}=trackerContext(false);vm.runInContext(trackerCode,ctx);vm.runInContext(trackerCode,ctx);assert.equal(requests.length,0);state.allowed=true;listeners['simulab:privacychange']();listeners['simulab:privacychange']();assert.equal(requests.length,1);assert.ok(requests[0][0].endsWith('/rpc/record_site_activity'));
});
test('free-text event labels and names never enter analytics payloads; withdrawal stops events',()=>{
 const {ctx,requests,state}=trackerContext();vm.runInContext(trackerCode,ctx);ctx.window.SimuLabTracker.trackEvent('search_baby_name','민감한이름');ctx.window.SimuLabTracker.trackEvent('calculate','급여 9000');assert.equal(requests.length,2);assert.ok(!JSON.stringify(requests).includes('민감한이름'));assert.ok(!JSON.stringify(requests).includes('급여'));state.allowed=false;ctx.window.SimuLabTracker.trackEvent('calculate','private');assert.equal(requests.length,2);
});
