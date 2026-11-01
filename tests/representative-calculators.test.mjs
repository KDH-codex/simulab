import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
async function load(id){const scope={};vm.runInNewContext(await readFile(new URL('../tools/'+id+'/logic.js',import.meta.url),'utf8'),scope);return scope;}
test('area conversion agrees with reciprocal units and rejects non-finite inputs',async()=>{
 const {AreaLogic:a}=await load('area-pyeong-calc');assert.equal(a.sqmToPyeong(84),25.41);assert.equal(a.pyeongToSqm(1),3.31);assert.equal(a.convertUnitPrice(4000000,'pyeong'),1210000);assert.equal(a.pyeongToSqm(Infinity),0);assert.equal(a.sqmToPyeong(-1),0);
});
test('successive discounts multiply remaining prices rather than adding percentages',async()=>{
 const {PercentLogic:p}=await load('percent-discount-calc');const result=p.calcDiscount(100000,20,10);assert.equal(result.finalPrice,72000);assert.equal(result.effectiveDiscountRate,28);assert.equal(p.calcRatio(1,0),0);assert.equal(p.calcDiscount(Infinity,20).finalPrice,0);
});
test('age uses date-only boundaries and rejects impossible or future birth dates',async()=>{
 const {AgeLogic:a}=await load('korean-age-calc');assert.equal(a.calculate('2000-10-24','2026-10-23').internationalAge,25);assert.equal(a.calculate('2000-10-24','2026-10-24').internationalAge,26);assert.equal(a.calculate('2000-10-24','2026-10-24').daysUntilNextBday,0);assert.equal(a.calculate('2026-02-29','2026-10-23'),null);assert.equal(a.calculate('2027-01-01','2026-10-23'),null);assert.equal(a.calculate('2000-02-29','2026-02-28').daysUntilNextBday,1);
});
test('bill splitting uses whole people and reports the actual collected amount',async()=>{
 const scope=await load('dutch-pay-roulette');const calculate=scope.SimuLab.DutchPay.calculateDutchPay;
 const result=calculate({totalAmount:100000,memberCount:3,roundUnit:1,mode:'equal'});assert.equal(result.memberDetails.length,3);assert.equal(result.summary.actualCollectedTotal,result.memberDetails.reduce((n,row)=>n+row.amount,0));assert.equal(result.summary.difference,result.summary.actualCollectedTotal-100000);
 assert.equal(calculate({memberCount:2.5}).memberDetails.length,2);const late=calculate({totalAmount:10000,memberCount:4,mode:'late',lateCount:3,latePenalty:10000,roundUnit:1});assert.ok(late.memberDetails.every(row=>row.amount>=0));assert.ok(late.summary.actualCollectedTotal<=10004);
});
test('average share price is weighted by quantity, and unreachable targets are rejected',async()=>{
 const {SimuLab:s}=await load('stock-water-ride-calc');const avg=s.calculateAveragePrice([{price:100,quantity:1},{price:200,quantity:3}],200);assert.equal(avg.averagePrice,175);assert.equal(avg.totalAmount,700);assert.equal(avg.totalQuantity,4);
 const target=s.calculateRequiredWaterRide({currentAvgPrice:100,currentQty:10,targetAvgPrice:80,addBuyPrice:80});assert.equal(target.isValid,false);
});
