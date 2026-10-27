import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {exampleSets} from '../data/guides/cases.mjs';
import {calculate as salary} from '../tools/salary-net-calc/logic.js';
import {calculate as severance} from '../tools/severance-pay-calc/logic.js';
import {calculate as unemployment} from '../tools/unemployment-benefit-calc/logic.js';
import {calculate as leave} from '../tools/annual-leave-calc/logic.js';
import {calculate as hourly} from '../tools/hourly-labor-value-calc/logic.js';
import {calculate as unit} from '../tools/unit-price-calc/logic.js';
import {calculate as membership} from '../tools/membership-benefit-calc/logic.js';
import {calculate as trip} from '../tools/travel-budget-calc/logic.js';
import {calculate as split} from '../tools/dutch-pay-roulette/calculator.js';
import {calculate as housing} from '../tools/jeonse-wolse-sim/logic.js';
import {calculate as loan} from '../tools/loan-mortgage-calc/logic.js';
import {calculate as wealth} from '../tools/korean-wealth-percentile-calc/logic.js';
import {calculate as inflation} from '../tools/inflation-purchasing-power-calc/logic.js';
const money=n=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:0}).format(n)+'원',decimal=n=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:2}).format(n);
const modules={};
for(const id of ['area-pyeong-calc','percent-discount-calc','korean-age-calc']){const scope={};vm.runInNewContext(await readFile(new URL('../tools/'+id+'/logic.js',import.meta.url),'utf8'),scope);modules[id]=scope;}
const calculators={'salary-net-calc':salary,'severance-pay-calc':severance,'unemployment-benefit-calc':unemployment,'annual-leave-calc':leave,'hourly-labor-value-calc':hourly,'unit-price-calc':unit,'membership-benefit-calc':membership,'travel-budget-calc':trip,'dutch-pay-roulette':split,'jeonse-wolse-sim':housing,'loan-mortgage-calc':loan,'korean-wealth-percentile-calc':wealth,'inflation-purchasing-power-calc':inflation,
 'area-pyeong-calc':x=>({pyeong:modules['area-pyeong-calc'].AreaLogic.sqmToPyeong(x.sqm)}),
 'percent-discount-calc':x=>modules['percent-discount-calc'].PercentLogic.calcDiscount(x.price,x.first,x.second),
 'korean-age-calc':x=>modules['korean-age-calc'].AgeLogic.calculate(x.birth,x.on)
};
function rows(id,r){switch(id){
 case 'salary-net-calc':return [['보험료 합계',money(r.totalInsurance)],['소득세·지방소득세',r.incomeTaxProvided?money(r.incomeTax+r.localIncomeTax):'미입력·미차감'],[r.incomeTaxProvided?'세금·보험료 차감 후':'보험료만 차감 후',money(r.monthlyNetSalary)]];
 case 'severance-pay-calc':return [['재직·산정 일수',r.serviceDays+'일 / '+r.wageDays+'일'],['기준 1일 임금',money(r.baseDaily)],['세전 퇴직금',r.eligible?money(r.gross):'계속근로 등 기본 요건 확인 필요']];
 case 'unemployment-benefit-calc':return [['1일 구직급여',money(r.finalDailyBenefit)],['소정급여일수',r.benefitDays+'일'],['일액×일수',money(r.totalBenefit)]];
 case 'annual-leave-calc':return [['현재 발생 기간',r.periodStart+' ~ '+r.periodEnd+' 전날'],['발생·잔여',r.grant+'일 / '+r.remaining+'일']];
 case 'hourly-labor-value-calc':return [['비용 차감 수입',money(r.available)],['총 투입 시간',r.totalHours+'시간'],['시간당 수입',money(r.hourly)]];
 case 'percent-discount-calc':return [['최종 가격',money(r.finalPrice)],['실질 할인율',decimal(r.effectiveDiscountRate)+'%']];
 case 'unit-price-calc':return [['비교 단위',r.scale+r.unit+'당'],['A / B 단가',money(r.a)+' / '+money(r.b)],['낮은 단가',r.winner]];
 case 'membership-benefit-calc':return [['실제 할인',money(r.discount)],['회비 차감 후',money(r.net)],['손익분기 결제액',r.breakEven===null?'현재 한도로 만회 불가':money(r.breakEven)]];
 case 'travel-budget-calc':return [['예비비 전',money(r.base)],['예비비',money(r.buffer)],['총예산',money(r.total)]];
 case 'dutch-pay-roulette':return [['기본 몫',money(r.base)],['1원 추가 인원',r.extra+'명'],['정산 합계',money(r.total)]];
 case 'jeonse-wolse-sim':return [['전세 총비용',money(r.jeonse.total)],['월세 총비용',money(r.wolse.total)],['월세−전세',money(r.difference)]];
 case 'loan-mortgage-calc':return [['첫 월 납입',money(r.base.firstPayment)],['첫해 상환 합계',money(r.base.firstYearPayment)],['총이자',money(r.base.totalInterest)]];
 case 'area-pyeong-calc':return [['변환 면적',decimal(r.pyeong)+'평']];
 case 'korean-wealth-percentile-calc':return [['순자산',money(r.net)],['가구 평균 대비',decimal(r.ratio)+'%'],['평균과 차이',money(r.difference)]];
 case 'inflation-purchasing-power-calc':return [['같은 구매력 금액',money(r.equivalent)],['기준시점 구매력',money(r.purchasingPower)]];
 case 'korean-age-calc':return [['기준일의 만 나이',r.internationalAge+'세']];
 default:throw new Error('Missing example output '+id);
}}
export function calculateExamples(id){if(!calculators[id]||!exampleSets[id])throw new Error('Missing examples '+id);return exampleSets[id].map(c=>{const result=calculators[id](c.input);return {...c,result,outputs:rows(id,result)};});}
export const exampleAssumptions={
 'salary-net-calc':'2026년 하반기·비과세 식대 20만원 포함. 소득세는 각 사례의 가상 확인값이며 실제 간이세액표가 아닙니다.',
 'severance-pay-calc':'주 소정근로 40시간, 제외기간·중간정산 없음. 미표기 상여·연차수당·통상임금은 0원 입력입니다.',
 'unemployment-benefit-calc':'2026년 이직·장애 특례 없음. 미표기 연령 35세·가입3년·1일8시간, 수급자격 인정과 전 기간 실업인정을 가정합니다.',
 'loan-mortgage-calc':'고정금리·거치 없음. 일할이자·수수료와 승인 심사는 제외하며 만기일시는 원금 준비가 별도입니다.',
 'jeonse-wolse-sim':'24개월, 고정금리·만기 원금 상환 가정. 보증금 반환·세금·보증료·관리비·계약 위험은 제외합니다.'
};
