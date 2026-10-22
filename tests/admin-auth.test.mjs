import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminClient} from '../tools/admin-dashboard/auth-client.js';
import {calculateKpis,exportToCsv} from '../tools/admin-dashboard/metrics.js';
function storage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
const config={url:'https://example.invalid',anonKey:'public-key'};
const response=(data,status=200)=>({ok:status<400,status,json:async()=>data});
test('a legacy browser flag cannot authorize any admin request',async()=>{
 const store=storage();store.setItem('simulab_admin_session','fake');let calls=0;
 const client=createAdminClient({getConfig:()=>config,storage:store,fetchFn:async()=>{calls++;return response({});}});
 assert.equal(await client.restore(),null);await assert.rejects(client.summary(),/로그인/);assert.equal(calls,0);
});
test('admin requests carry the user token and old unprotected summaries fail closed',async()=>{
 const calls=[],store=storage();const client=createAdminClient({getConfig:()=>config,storage:store,fetchFn:async(url,init)=>{calls.push([url,init]);return response(url.includes('/token?')?{access_token:'user-token',expires_in:3600,user:{id:'user-id'}}:{daily:{}});}});
 await assert.rejects(client.signIn('admin@example.test','example-password'),/보안 설정/);
 assert.equal(calls[1][1].headers.Authorization,'Bearer user-token');
 assert.equal(store.getItem('simulab_admin_auth_v2'),null);
});
test('a successful server-authorized session expires and cannot keep querying',async()=>{
 let now=1000,calls=0;const store=storage();
 const client=createAdminClient({getConfig:()=>config,storage:store,now:()=>now,fetchFn:async(url)=>{calls++;return response(url.includes('/token?')?{access_token:'user-token',expires_in:120,user:{id:'user-id'}}:{securityVersion:2,daily:{}});}});
 assert.equal((await client.signIn('admin@example.test','example-password')).securityVersion,2);
 assert.ok(store.getItem('simulab_admin_auth_v2'));now+=121000;
 await assert.rejects(client.summary(),/로그인/);assert.equal(calls,2);assert.equal(store.getItem('simulab_admin_auth_v2'),null);
});
test('a normal authenticated account denied by the server is not saved as admin',async()=>{
 const store=storage(),client=createAdminClient({getConfig:()=>config,storage:store,fetchFn:async url=>url.includes('/token?')?response({access_token:'user-token',expires_in:3600,user:{id:'normal-user'}}):response({},403)});
 await assert.rejects(client.signIn('member@example.test','example-password'),/관리자 권한/);assert.equal(store.getItem('simulab_admin_auth_v2'),null);
});
test('KST today stays zero when only older records exist and period distinct is not a sum',()=>{
 const data={daily:{'2026-10-22':{uv:8,pv:12},'2026-10-23':{uv:4,pv:6}},periodSessions:9};
 const k=calculateKpis(data,new Date('2026-10-23T15:00:00Z'));
 assert.equal(k.todaySessions,0);assert.equal(k.todayPv,0);assert.equal(k.periodSessions,9);assert.equal(k.periodPv,18);assert.equal(k.change,'-100.0%');
});
test('CSV rejects arbitrary date keys and non-finite counts',()=>{
 const csv=exportToCsv({daily:{'=HYPERLINK("bad")':{uv:10,pv:20},'2026-10-23':{uv:Infinity,pv:NaN}}});
 assert.ok(!csv.includes('HYPERLINK'));assert.ok(csv.includes('2026-10-23,0,0,0.00'));
});
