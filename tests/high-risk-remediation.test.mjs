import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {calculate as salary} from '../tools/salary-net-calc/logic.js';
import {calculate as unemployment,calculateDays} from '../tools/unemployment-benefit-calc/logic.js';
import {calculate as leverage} from '../tools/leverage-etf-sim/logic.js';
import {calculate as loan} from '../tools/loan-mortgage-calc/logic.js';
import {calculate as caffeine} from '../tools/caffeine-sleep-calc/logic.js';
import {calculate as energy} from '../tools/diet-bmr-tdee-calc/logic.js';
import {calculate as wealth} from '../tools/korean-wealth-percentile-calc/logic.js';
import {calculate as inflation} from '../tools/inflation-purchasing-power-calc/logic.js';
import {calculate as animal} from '../tools/invest-animal-mbti/logic.js';
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-6,`${actual} != ${expected}`);

test('2026 payroll estimates use verified contribution rates and July pension boundary',()=>{
 const r=salary();
 assert.equal(r.nationalPension,156750);assert.equal(r.healthInsurance,118630);
 assert.equal(r.longTermCare,15580);assert.equal(r.employmentInsurance,29700);
 assert.equal(r.monthlyNetSalary,3179340);assert.equal(r.incomeTaxProvided,false);
 assert.equal(salary({inputValue:10000000,period:'2026-h1'}).nationalPension,302570);
 assert.equal(salary({inputValue:10000000,period:'2026-h2'}).nationalPension,313020);
 assert.equal(salary({inputValue:400000,taxFreeMeal:0,period:'2026-h2'}).nationalPension,19470);
 assert.equal(salary({inputMode:'annual',inputValue:42000000}).monthlyNetSalary,r.monthlyNetSalary);
});
test('missing payroll tax is distinct from a confirmed zero; impossible deductions are rejected',()=>{
 assert.equal(salary({incomeTax:0}).incomeTaxProvided,true);
 assert.equal(salary({incomeTax:100000}).monthlyNetSalary,3069340);
 assert.throws(()=>salary({incomeTax:3500000}),RangeError);
 assert.throws(()=>salary({period:'2027-h1'}),RangeError);
 assert.throws(()=>salary({inputMode:'invalid'}),RangeError);
});
test('unemployment caps and hourly floors follow separation year, not current browser year',()=>{
 assert.equal(unemployment().finalDailyBenefit,66048);
 assert.equal(unemployment().totalBenefit,11888640);
 assert.equal(unemployment({separationDate:'2025-12-31'}).finalDailyBenefit,64192);
 assert.equal(unemployment({wageTotal:12000000}).finalDailyBenefit,68100);
 assert.equal(unemployment({wageTotal:12000000,separationDate:'2025-12-31'}).finalDailyBenefit,66000);
 assert.equal(unemployment({wageTotal:1000000,dailyWorkHours:4}).finalDailyBenefit,33024);
 assert.throws(()=>unemployment({separationDate:'2026-02-30'}),RangeError);
 assert.throws(()=>unemployment({separationDate:'2027-01-01'}),RangeError);
 assert.throws(()=>unemployment({dailyWorkHours:4.5}),RangeError);
});
test('benefit duration preserves age, disability and insurance-year boundaries',()=>{
 assert.equal(calculateDays(49,2.99),150);assert.equal(calculateDays(50,2.99),180);
 assert.equal(calculateDays(49,3),180);assert.equal(calculateDays(49,3,true),210);
 assert.equal(calculateDays(50,10),270);assert.equal(calculateDays(35,0.9),120);
});
test('daily resetting compounding and drawdowns use the supplied path; wiped-out funds do not revive',()=>{
 const r=leverage({principal:100,returns:'10,-10',leverage:3});
 close(r.base,99);close(r.leveraged,91);close(r.baseMdd,-10);close(r.leveragedMdd,-30);
 const reversed=leverage({principal:100,returns:'-10,10',leverage:3});
 close(reversed.leveraged,91);close(reversed.leveragedMdd,-30);
 const wipe=leverage({principal:100,returns:'-40,100',leverage:3});
 assert.equal(wipe.leveraged,0);assert.equal(wipe.leveragedMdd,-100);
 assert.throws(()=>leverage({returns:'10,not-a-rate'}),RangeError);
 assert.throws(()=>leverage({returns:'101'}),RangeError);
});
test('loan schedule conserves principal and uses actual first-year payments, including balloon maturity',()=>{
 const r=loan({loanAmount:120000000,annualRate:12,years:2,type:'equal_principal',annualIncome:100000000,existingAnnualPayment:0});
 // First year: 60m principal + (1.20m + ... + 0.65m) interest = 71.1m.
 close(r.base.firstYearPayment,71100000);close(r.firstYearRatio,71.1);
 close(r.base.yearly.reduce((s,y)=>s+y.principal,0),120000000);
 assert.ok(r.base.firstYearPayment>r.base.totalPayment/2);
 assert.equal(r.base.yearly.at(-1).balance,0);
 const zero=loan({loanAmount:120000000,annualRate:0,years:1});
 close(zero.base.firstPayment,10000000);close(zero.base.totalInterest,0);
 const bullet=loan({loanAmount:120000000,annualRate:12,years:2,type:'bullet'});
 close(bullet.base.yearly[0].total,14400000);close(bullet.base.yearly[1].total,134400000);
 assert.throws(()=>loan({years:1,graceMonths:12}),RangeError);
});
test('caffeine model handles midnight, explicit next day and zero intake without a safety verdict',()=>{
 const midnight=caffeine({doseMg:100,intakeTime:'00:00',checkTime:'05:00',halfLife:5});
 close(midnight.remainingMg,50);assert.equal(midnight.elapsedHours,5);
 const next=caffeine({doseMg:100,intakeTime:'23:00',checkTime:'04:00',dayOffset:1,halfLife:5});
 close(next.remainingMg,50);assert.equal(caffeine({doseMg:0}).remainingMg,0);
 assert.throws(()=>caffeine({intakeTime:'23:00',checkTime:'04:00'}),RangeError);
 assert.throws(()=>caffeine({halfLife:0}),RangeError);
 assert.equal(Object.keys(midnight).some(k=>/safe|sleep|grade|bed/i.test(k)),false);
});
test('energy estimate matches published equation without prescribing intake or muscle gain',()=>{
 const male=energy({sex:'male',weightKg:70,heightCm:170,age:35,activity:'sedentary'});
 close(male.restingEnergy,1592.5);close(male.totalEnergy,1911);
 close(energy({sex:'female',weightKg:70,heightCm:170,age:35}).restingEnergy,1426.5);
 assert.throws(()=>energy({age:12}),RangeError);assert.throws(()=>energy({activity:'unknown'}),RangeError);
 assert.equal(Object.keys(male).some(k=>/gain|loss|intake|prescription/i.test(k)),false);
});
test('household mean comparison supports negative equity and never turns it into a percentile',()=>{
 const r=wealth({assets:448940000,debts:0});assert.equal(r.ratio,100);assert.equal(r.difference,0);
 assert.equal(wealth({assets:0,debts:1000000}).net,-1000000);
 assert.equal('percentile' in r,false);assert.throws(()=>wealth({assets:NaN}),RangeError);
});
test('purchasing-power conversion uses consistent index ratios and rejects zero or subnormal indices',()=>{
 const r=inflation({amount:1000000,baseIndex:100,targetIndex:110});
 close(r.equivalent,1100000);close(r.purchasingPower,1000000/1.1);
 close(inflation({amount:1000000,baseIndex:110,targetIndex:110}).powerChange,0);
 assert.throws(()=>inflation({baseIndex:0}),RangeError);
 assert.throws(()=>inflation({baseIndex:Number.MIN_VALUE}),RangeError);
});
test('entertainment results require complete answers and contain no financial product allocation',async()=>{
 assert.throws(()=>animal({answers:[1,0]}),RangeError);
 for(let count=0;count<=8;count++){
  const r=animal({answers:Array.from({length:8},(_,i)=>i<count?1:0)});
  assert.equal(r.exploration,count);assert.doesNotMatch(JSON.stringify(r),/ETF|TQQQ|SOXL|NVDA|SCHD|portfolio|allocation/i);
 }
 const scope={};vm.runInNewContext(await readFile(new URL('../tools/saju-wealth-sim/logic.js',import.meta.url),'utf8'),scope);
 const e=scope.SimuLab.SajuTheme,r=e.calculateSajuTheme({birthHour:0});
 assert.equal(r.inputs.birthHour,0);assert.equal(r.pillars.hourPillar.branch.name,'자');
 assert.equal(Object.values(r.elementScores).reduce((s,n)=>s+n,0),100);
 assert.doesNotMatch(JSON.stringify(r),/ETF|TQQQ|SOXL|NVDA|SCHD|recommendedAssets|investStyle/i);
 assert.throws(()=>e.calculateSajuTheme({birthYear:2026,birthMonth:2,birthDay:30}));
});
test('shared tool addresses drop every query field and fragment, including legacy private inputs',async()=>{
 const scope={URL};vm.runInNewContext(await readFile(new URL('../assets/js/core-ui.js',import.meta.url),'utf8'),scope);
 const url=scope.SimuLab.buildToolShareUrl('https://simulab.kr/tools/saju-wealth-sim/?birthYear=1992&income=90000000#private');
 assert.equal(url,'https://simulab.kr/tools/saju-wealth-sim/');
});

test('the actual share action ignores supplied inputs and clears legacy queries before clipboard copy',async()=>{
 let copied,replaced;const actions=[];
 const toast={classList:{add(){},remove(){}}};
 const document={readyState:'loading',addEventListener(){},getElementById:()=>toast};
 const window={location:{href:'https://simulab.kr/tools/saju-wealth-sim/?birthYear=1992&salary=90000000#private'},history:{replaceState:(_,__,url)=>{replaced=url;}},addEventListener(){},SimuLabTracker:{trackEvent:(...args)=>actions.push(args)}};
 const scope={URL,document,window,navigator:{clipboard:{writeText:async text=>{copied=text;}}},setTimeout(){},clearTimeout(){}};
 vm.runInNewContext(await readFile(new URL('../assets/js/core-ui.js',import.meta.url),'utf8'),scope);
 await window.SimuLab.shareSimulationUrl({birthYear:1992,salary:90000000});
 assert.equal(copied,'https://simulab.kr/tools/saju-wealth-sim/');assert.equal(replaced,copied);
 assert.match(toast.textContent,/입력값을 제외/);
 assert.deepEqual(actions,[['copy_share_url']]);
});
