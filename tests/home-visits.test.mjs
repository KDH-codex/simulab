import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {HomeVisitCounter,homeVisitResponse} from '../worker/home-visits.mjs';

const origin='https://simulab.kr';
const api=origin+'/api/home-visits';
const beforeMidnight=new Date('2026-11-17T14:59:59.999Z');
const midnight=new Date('2026-11-17T15:00:00.000Z');

test('home visits are durable Korean-day totals, with no writes from reads or cross-origin requests',async()=>{
  const db=new DatabaseSync(':memory:');
  try{
    const counter=()=>new HomeVisitCounter({storage:{sql:{
      exec(query,...bindings){const rows=db.prepare(query).all(...bindings);return {toArray:()=>rows};}
    }}});
    let object=counter();
    const namespace={idFromName:name=>name,get:()=>({fetch:(url,init)=>object.fetch(new Request(url,init))})};
    const read=now=>homeVisitResponse(new Request(api),namespace,now);
    const write=(now,day,headers={})=>homeVisitResponse(new Request(api,{method:'POST',headers:{
      Origin:origin,'Sec-Fetch-Site':'same-origin','X-Simulab-Visit-Day':day,...headers
    }}),namespace,now);
    assert.equal((await write(beforeMidnight,'2026-11-17',{Origin:'https://elsewhere.test'})).status,403);
    assert.equal((await write(midnight,'2026-11-17')).status,400);
    assert.deepEqual(await (await read(beforeMidnight)).json(),{date:'2026-11-17',visits:0});
    const first=await write(beforeMidnight,'2026-11-17');
    assert.equal(first.headers.get('Cache-Control'),'no-store');
    assert.deepEqual(await first.json(),{date:'2026-11-17',visits:1});
    object=counter();
    assert.equal((await (await read(beforeMidnight)).json()).visits,1);
    assert.equal((await (await write(beforeMidnight,'2026-11-17')).json()).visits,2);
    assert.deepEqual(await (await read(midnight)).json(),{date:'2026-11-18',visits:0});
    assert.deepEqual(await (await write(midnight,'2026-11-18')).json(),{date:'2026-11-18',visits:1});
  }finally{db.close();}
});

test('the home footer counts a reload once, resets on a new Korean day, and respects a saved opt-out',async()=>{
  const source=await readFile(new URL('../assets/js/festival-home-visits.js',import.meta.url),'utf8');
  const {window}=new JSDOM('<span hidden data-home-visits></span>',{url:origin,runScripts:'outside-only',pretendToBeVisual:true});
  try{
    const requests=[];
    let day='2026-11-17';
    const label=window.document.querySelector('[data-home-visits]');
    window.fetch=async(path,options)=>{
      requests.push({path,...options});
      return Response.json({date:day,visits:42});
    };
    const setup=window.eval(source.replace('export function','function')+'\nsetupHomeVisits');
    const visit=async()=>{
      setup(label,'ko',()=>day);
      await new Promise(resolve=>setImmediate(resolve));
    };
    await visit();
    await visit();
    day='2026-11-18';
    await visit();
    day='2026-11-19';
    window.localStorage.setItem('simulab_privacy_v3','{"version":3,"analytics":false}');
    await visit();
    assert.deepEqual(requests.map(x=>x.method),['POST','GET','POST','GET']);
    assert.ok(requests.every(x=>x.path==='/api/home-visits'&&x.credentials==='omit'));
    assert.equal(label.textContent,'오늘 방문자 42명');
    assert.equal(label.hidden,false);
  }finally{window.close();}
});
