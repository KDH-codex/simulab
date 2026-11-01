import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate as leave} from '../tools/annual-leave-calc/logic.js';
import {calculate as severance} from '../tools/severance-pay-calc/logic.js';
import {calculate as hourly} from '../tools/hourly-labor-value-calc/logic.js';
import {calculate as housing} from '../tools/jeonse-wolse-sim/logic.js';
import {calculate as unit} from '../tools/unit-price-calc/logic.js';
import {calculate as member} from '../tools/membership-benefit-calc/logic.js';
import {calculate as trip} from '../tools/travel-budget-calc/logic.js';
import {readFile} from 'node:fs/promises';
import {coreToolGuides} from '../data/core-tool-guides.mjs';
import {publicationCatalog} from '../scripts/publication.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('annual leave separates first-year monthly grants, anniversary grants, service increments and cap',()=>{
 assert.equal(leave({hireDate:'2025-10-28',asOfDate:'2026-10-27',usedDays:0}).grant,11);
 assert.equal(leave({hireDate:'2025-10-28',asOfDate:'2026-10-28',usedDays:0}).grant,15);
 assert.equal(leave({hireDate:'2023-07-01',asOfDate:'2026-07-01',usedDays:5}).remaining,11);
 assert.equal(leave({hireDate:'2000-01-01',asOfDate:'2026-10-27',usedDays:0}).grant,25);
 assert.equal(leave({hireDate:'2024-02-29',asOfDate:'2025-02-28',usedDays:0}).years,0);
 assert.equal(leave({hireDate:'2024-02-29',asOfDate:'2025-03-01',usedDays:0}).years,1);
 assert.throws(()=>leave({hireDate:'2026-02-30'}),RangeError);
 assert.throws(()=>leave({usedDays:26}),RangeError);
});
test('severance follows official example with calendar days and higher daily ordinary wage',()=>{
 const r=severance({hireDate:'2014-10-02',leaveDate:'2017-09-16',wageTotal:7080000,annualBonus:4000000,annualLeavePay:300000});
 assert.equal(r.serviceDays,1080);assert.equal(r.wageDays,92);close(r.averageDaily,8155000/92);close(r.gross,8155000/92*30*1080/365);
 assert.equal(severance({dailyOrdinaryWage:120000}).baseDaily,120000);
 assert.equal(severance({hireDate:'2025-10-02',leaveDate:'2026-10-01'}).eligible,false);
 assert.equal(severance({weeklyHours:14.9}).eligible,false);
 assert.equal(severance({leaveDate:'2026-05-31'}).periodStart,'2026-02-28');
});
test('time and housing comparisons use actual inputs, retain negative outcomes, and do not infer taxes',()=>{
 close(hourly().hourly,2850000/214);assert.equal(hourly({monthlyNetSalary:0}).targetHours,null);
 assert.ok(hourly({workExpenses:4000000}).hourly<0);
 const r=housing();assert.equal(r.jeonse.cash,12000000);assert.equal(r.wolse.cash,19200000);assert.equal(r.difference,7200000);
 assert.equal(housing({opportunityRate:3}).difference,3000000);
 assert.throws(()=>housing({months:1.5}),RangeError);
});
test('unit comparisons include shipping and reject mixed or zero quantity units',()=>{
 const r=unit();assert.equal(r.a,400);assert.equal(r.b,300);assert.equal(r.winner,'B 상품');
 assert.throws(()=>unit({sizeA:0}),RangeError);assert.throws(()=>unit({countB:1.5}),RangeError);assert.throws(()=>unit({unit:'kg'}),RangeError);
});
test('membership break-even respects cash-discount caps and zero rates',()=>{
 assert.equal(member({fee:100,rate:3}).breakEven,3334);assert.equal(member().net,100);assert.equal(member().breakEven,98000);
 assert.equal(member({cap:4000}).breakEven,null);assert.equal(member({rate:0}).breakEven,null);
 assert.equal(member({shippingSaved:4900}).breakEven,0);
});
test('travel budget applies per-person and group costs once, and distinguishes a day trip',()=>{
 const r=trip();assert.equal(r.base,380000);assert.equal(r.total,418000);
 assert.equal(trip({days:1,nights:0}).stay,0);
 assert.throws(()=>trip({adults:0,children:0}),RangeError);assert.throws(()=>trip({days:1,nights:1}),RangeError);
});
test('public focus has sixteen explained calculators and excludes archived categories consistently',async()=>{
 const {ids}=await publicationCatalog();assert.equal(coreToolGuides.length,16);assert.equal(ids.size,29);
 for(const [id] of coreToolGuides)assert.ok(ids.has(id));
 for(const id of ['game-dodge','saju-wealth-sim','invest-animal-mbti','alcohol-widmark-calc'])assert.equal(ids.has(id),false);
 const home=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.doesNotMatch(home,/data-tool="(?:game-|saju-|alcohol-)/);
});
