import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateShoppingEvent,filterShopping,shoppingState,restoreShoppingSaved,shoppingText,SHOP_STORAGE} from '../assets/js/shopping-model.js';
import {saleCard,saleDetails} from '../assets/js/shopping-presentation.js';
import {languageURL} from '../assets/js/festival-i18n.js';
import {approvedURL,discoverLinks,fetchApproved} from '../scripts/shopping/discovery.mjs';
const {sources}=JSON.parse(await readFile(new URL('../data/deals/sources.json',import.meta.url),'utf8'));
const records=JSON.parse(await readFile(new URL('../data/deals/reviewed.json',import.meta.url),'utf8')).events.filter(e=>e.shopping);
const rows=records.map(e=>({...e,brandName:sources.find(s=>s.id===e.brandId).name}));
const now=new Date(Math.max(...rows.map(e=>Date.parse(e.checkedAt)))+600000);
test('shopping records retain retailer, brand and branch scope and four translated summaries',()=>{
 assert.ok(rows.length>=12);assert.equal(new Set(rows.map(e=>e.id)).size,rows.length);
 for(const e of rows)assert.deepEqual(validateShoppingEvent(e,sources,now),[],e.id);
 const nike=rows.find(e=>e.shopping.brandCode==='NIKE');
 assert.equal(nike.brandId,'shinsegae-simon');assert.equal(nike.shopping.specificStore,true);assert.match(nike.shopping.storeScope,/여주/);
 assert.ok(validateShoppingEvent({...nike,shopping:{...nike.shopping,retailerId:'nike'}},sources,now).length);
 assert.ok(validateShoppingEvent({...nike,shopping:{...nike.shopping,area:'guessed'}},sources,now).length);
});
test('shopping filters combine category, channel, membership, region and translated search without widening store scope',()=>{
 assert.equal(filterShopping(rows,{kind:'mart'},now).length,2);
 assert.equal(filterShopping(rows,{channel:'app'},now)[0].shopping.brandCode,'IKEA');
 assert.ok(filterShopping(rows,{member:true,channel:'online'},now).every(e=>e.shopping.membership));
 assert.equal(filterShopping(rows,{kind:'mall',area:'seoul'},now).length,0);
 assert.equal(filterShopping(rows,{query:'nike'},now)[0].shopping.area,'gyeonggi');
 assert.equal(filterShopping(rows,{query:'アディダス'},now)[0].shopping.brandCode,'ADIDAS');
 assert.ok(filterShopping(rows,{kind:'department'},now).length===0);
});
test('expired and stale offers stay out of current lists but remain available to explicit saved/archive views',()=>{
 const row=rows.find(e=>e.shopping.brandCode==='NIKE');
 const stale=new Date(Date.parse(row.checkedAt)+48*3600000+1);
 assert.equal(shoppingState(row,stale).code,'stale');assert.equal(filterShopping([row],{},stale).length,0);
 assert.equal(filterShopping([row],{period:'archive'},stale).length,1);
 assert.equal(filterShopping([row],{saved:true},stale,[row.id]).length,1);
 assert.equal(shoppingState(row,'2026-11-16T00:00:00+09:00').code,'ended');
 const cancelled={...row,publicationStatus:'cancelled'};assert.equal(filterShopping([cancelled],{},now).length,0);
 const todayEnd=rows.find(e=>e.id==='emart-ssg-flyer-20261105');assert.equal(shoppingState(todayEnd,'2026-11-09T00:00:00+09:00').code,'ended');
});
test('shopping saved IDs and language links survive navigation without mixing festival storage',()=>{
 assert.notEqual(SHOP_STORAGE,'thisweekfestival.saved.v1');const id=rows[0].id;
 assert.deepEqual(restoreShoppingSaved(JSON.stringify([id,id,'unrelated']),rows),[id]);assert.deepEqual(restoreShoppingSaved('{',rows),[]);
 const url=languageURL('/sales/?kind=mall&member=1&saved=1#shopping-results','ja');
 assert.equal(url.searchParams.get('kind'),'mall');assert.equal(url.searchParams.get('member'),'1');assert.equal(url.hash,'#shopping-results');
 assert.equal(languageURL('/sales/'+id+'/','zh-TW').searchParams.get('lang'),'zh-TW');
});
test('shopping cards escape untrusted text, preserve Korean original conditions and do not promise live inventory',()=>{
 const row={...rows[0],title:'<img src=x onerror=alert(1)>',conditions:['<script>alert(1)</script>']};
 const markup=saleCard(row,{now})+saleDetails(row,{now});assert.ok(!markup.includes('<img src=x'));assert.ok(!markup.includes('<script>alert'));
 assert.match(markup,/data-original lang="ko"/);assert.match(markup,/실시간 정보가 아닙니다/);
 for(const e of rows)for(const lang of ['en','ja','zh-CN','zh-TW'])assert.ok(shoppingText(e,lang).summary);
});
test('candidate discovery retains only approved official detailed links and never marks candidates reviewed',()=>{
 const source={url:'https://www.premiumoutlets.co.kr/rpage/main/index/01',hosts:['www.premiumoutlets.co.kr'],adapter:'outlet-links'};
 const good='/rpage/shopping-info/news/special-detail/01/20267';
 const html='<a href="'+good+'">Nike</a><a href="'+good+'">duplicate</a><a href="https://evil.test'+good+'">bad</a><a href="javascript:alert(1)">bad</a>';
 const candidates=discoverLinks(html,source);assert.equal(candidates.length,1);assert.equal(candidates[0].publicationStatus,'pending');
 assert.equal(approvedURL('https://www.premiumoutlets.co.kr.evil.test/',source.url,source.hosts),null);
 assert.equal(approvedURL('https://user:pass@www.premiumoutlets.co.kr/',source.url,source.hosts),null);
});
test('source requests stop on forbidden responses and off-domain redirects instead of bypassing them',async()=>{
 const source={url:'https://www.ikea.com/kr/ko/offers/',hosts:['www.ikea.com']};let requests=0;
 await assert.rejects(fetchApproved(source,{fetcher:async()=>{requests++;return new Response('denied',{status:403});}}),/403/);assert.equal(requests,1);
 await assert.rejects(fetchApproved(source,{fetcher:async()=>new Response(null,{status:302,headers:{Location:'https://evil.test/'}})}),/outside approved/);
});
