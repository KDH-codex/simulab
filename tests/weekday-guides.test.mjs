import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCatalog,filterItems,safeSourceUrl,validDate,sourceState,koreaDate,renderGuideCard} from '../assets/js/weekday-guide-model.js';
const data=JSON.parse(await readFile(new URL('../data/weekday-guides/reviewed.json',import.meta.url),'utf8'));
const now=new Date('2026-10-25T03:00:00Z');
test('reviewed guides have unique, valid, dated official sources and real categories',()=>{
 assert.deepEqual(validateCatalog(data,now),[]);
 assert.equal(data.guides.length,3);assert.equal(data.items.length,18);
 for(const g of data.guides)assert.equal(data.items.filter(i=>i.guide===g.id).length,6);
 const invalid=structuredClone(data);invalid.items[0].source='missing';invalid.items[1].category='unknown';invalid.sources[0].checkedAt='2026-10-26';
 assert.equal(validateCatalog(invalid,now).length,3);
 const duplicate=structuredClone(data);duplicate.items.push(duplicate.items[0]);assert.ok(validateCatalog(duplicate,now).includes('Duplicate item IDs'));
});
test('search combines category with every normalized search term across checklists',()=>{
 const items=data.items.filter(i=>i.guide==='working-parents-guide');
 assert.equal(filterItems(items).length,6);
 assert.deepEqual(filterItems(items,{category:'leave',query:' 육아휴직   시작일 '}).map(i=>i.id),['parent-leave-pay']);
 assert.equal(filterItems(items,{category:'care',query:'육아휴직'}).length,0);
 assert.equal(filterItems(items,{query:'없는검색어'}).length,0);
 assert.equal(filterItems([{title:'ＡＢＣ',summary:'',audience:'',checks:[],keywords:[],category:'x'}],{query:'abc'}).length,1);
});
test('source URL validation rejects lookalikes, credentials, scripts and insecure protocols',()=>{
 for(const url of ['javascript:alert(1)','http://www.moel.go.kr/','https://www.moel.go.kr.evil.test/','https://user:password@www.moel.go.kr/','https://evil.test/?url=https://www.moel.go.kr','not a URL'])assert.equal(safeSourceUrl(url),null);
 assert.equal(safeSourceUrl('https://www.moel.go.kr/retirementpay.do'),'https://www.moel.go.kr/retirementpay.do');
});
test('review freshness uses Korea dates without replacing the actual review date',()=>{
 assert.equal(koreaDate(new Date('2026-10-24T15:01:00Z')),'2026-10-25');
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2024-02-29'),true);
 assert.equal(sourceState({checkedAt:'2026-09-25'},now).code,'checked');
 assert.equal(sourceState({checkedAt:'2026-09-24'},now).code,'stale');
 assert.equal(sourceState({checkedAt:'2026-10-26'},now).code,'unverified');
 assert.equal(sourceState({checkedAt:'bad'},now).code,'unverified');
});
test('static cards escape editorial text and retain official links without JavaScript',()=>{
 const item={...data.items[0],title:'<script>alert("x")</script>',checks:['A & B','<input>']},source=data.sources[0];
 const html=renderGuideCard(item,source,{now,toolName:'월급 계산'});
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('A &amp; B'));assert.ok(html.includes('rel="noopener noreferrer"'));
 assert.ok(html.includes('href="/tools/salary-net-calc/"'));assert.ok(html.includes('datetime="2026-10-25"'));
 assert.throws(()=>renderGuideCard(item,{...source,url:'https://evil.test/'},{now}),/Invalid source URL/);
});
