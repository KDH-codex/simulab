import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {validateShop,reviewState,matchesFilters,renderShop,safeOfficialUrl} from '../tools/parenting-deals/model.js';
const {shops}=JSON.parse(await readFile(new URL('../data/deals/shops.json',import.meta.url),'utf8'));
const at='2026-10-24T01:14:47+09:00',price=shops.find(s=>s.id==='motherk'),coupon=shops.find(s=>s.id==='bebesup');

test('ten distinct official shops publish four factual summaries and six transparent link guides',()=>{
 assert.equal(shops.length,10);assert.equal(new Set(shops.map(s=>s.operator)).size,10);
 assert.equal(shops.filter(s=>s.mode==='summary').length,4);assert.equal(shops.filter(s=>s.mode==='link').length,6);
 for(const shop of shops)assert.deepEqual(validateShop(shop,at),[],shop.id);
 for(const shop of shops.filter(s=>s.mode==='link'))assert.equal(validateShop({...shop,priceWon:1000},at).includes('Restricted shop leaked promotion details'),true);
});
test('review time does not invent a promotion deadline or promise it is active',()=>{
 const state=reviewState(price,at);assert.equal(state.code,'reviewed');assert.match(state.label,/종료일 미공개/);
 assert.doesNotMatch(renderShop(price,at),/상시 진행|역대 최저|진행 중|오늘 마감/);
 assert.equal(reviewState({...price,checkedAt:'2026-10-25T00:00:00+09:00'},at).current,false);
});
test('prices expire after 24 hours and coupon summaries after seven days without another deployment',()=>{
 const tomorrow='2026-10-25T01:14:48+09:00',weekLater='2026-10-31T01:14:48+09:00';
 assert.equal(reviewState(price,tomorrow).code,'stale');assert.equal(reviewState(coupon,tomorrow).current,true);assert.equal(reviewState(coupon,weekLater).code,'stale');
 const html=renderShop(price,tomorrow);assert.match(html,/class="deal-highlight" hidden/);assert.match(html,/class="deal-facts" hidden/);assert.match(html,/재확인 필요/);
});
test('an exact Korean deadline ends the offer and future offers are never current',()=>{
 const dated={...coupon,startsAt:'2026-10-24T09:00:00+09:00',endsAt:'2026-10-25T00:00:00+09:00'};
 assert.equal(reviewState(dated,at).code,'upcoming');assert.equal(reviewState(dated,'2026-10-24T12:00:00+09:00').current,true);
 assert.equal(reviewState(dated,'2026-10-24T15:00:00Z').code,'ended');
 assert.ok(validateShop({...dated,endsAt:'2026-02-30T00:00:00+09:00'},at).length);
});
test('unapproved hosts, executable URLs, credentials and unreviewed promotions fail publication',()=>{
 assert.equal(safeOfficialUrl('https://motherkmall.co.kr.evil.example/',price.allowedHosts),false);
 assert.equal(safeOfficialUrl('javascript:alert(1)',price.allowedHosts),false);
 assert.equal(safeOfficialUrl('https://user:pass@motherkmall.co.kr/',price.allowedHosts),false);
 for(const override of [{sourceUrl:'http://motherkmall.co.kr/'},{rightsStatus:'pending'},{checkedAt:'2026-02-30T00:00:00+09:00'},{reviewWithinHours:168},{priceWon:-1}])assert.ok(validateShop({...price,...override},at).length);
 assert.ok(validateShop({...coupon,eligibility:''},at).length);
});
test('filters combine category, type and all search words; source content is escaped',()=>{
 assert.equal(matchesFilters(coupon,{category:'supplies',type:'coupon',query:'베베숲 가입'}),true);
 assert.equal(matchesFilters(coupon,{category:'clothing'}),false);
 assert.equal(matchesFilters(shops.find(s=>s.id==='toytron'),{query:'장난감'}),true);
 const html=renderShop({...price,name:'<img src=x onerror=alert(1)>',summary:'<script>alert(1)</script>'},at);
 assert.doesNotMatch(html,/<img src=x|<script>alert/);assert.match(html,/&lt;script&gt;/);
});
test('family links lead the home content and shopping disclosures describe conditions',async()=>{
 const home=await readFile(new URL('../scripts/build-home.mjs',import.meta.url),'utf8');
 assert.ok(home.indexOf('class="family-first"')<home.indexOf('class="home-hero"'));assert.match(home,/href="\/tools\/parenting-deals\/"/);
 const scope={};vm.runInNewContext(await readFile(new URL('../assets/js/core-ui.js',import.meta.url),'utf8'),scope);
 assert.equal(scope.SimuLab.getToolNotice('parenting-deals').kind,'shopping');assert.match(scope.SimuLab.getToolNotice('parenting-deals').message,/적립금과 사은품/);
});
