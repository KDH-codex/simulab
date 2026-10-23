// Employee contribution estimates, 2026. Income tax is entered from the payslip.
export const PERIODS={'2026-h1':{label:'2026년 1~6월',pensionMin:400000,pensionMax:6370000},'2026-h2':{label:'2026년 7~12월',pensionMin:410000,pensionMax:6590000}};
const floor10=n=>Math.floor((n+1e-8)/10)*10;
function number(n,min,max,label){if(!Number.isFinite(n)||n<min||n>max)throw new RangeError(label+'의 범위를 확인해 주세요.');return n;}
export function calculate({inputMode='salary',inputValue=3500000,taxFreeMeal=200000,period='2026-h2',incomeTax=null}={}){
 if(!['salary','annual'].includes(inputMode))throw new RangeError('급여 입력 방식을 확인해 주세요.');
 const rule=PERIODS[period];if(!rule)throw new RangeError('지원하는 적용 기간을 선택해 주세요.');
 const gross=number(inputValue,0,inputMode==='annual'?240000000:20000000,'급여')/(inputMode==='annual'?12:1);
 const nonTaxable=Math.min(gross,number(taxFreeMeal,0,200000,'비과세 식대')),taxable=Math.max(0,gross-nonTaxable);
 const pensionBase=taxable===0?0:Math.min(rule.pensionMax,Math.max(rule.pensionMin,Math.floor(taxable/1000)*1000));
 const nationalPension=floor10(pensionBase*0.0475),healthInsurance=floor10(taxable*0.03595);
 const longTermCare=floor10(healthInsurance*(0.009448/0.0719)),employmentInsurance=floor10(taxable*0.009);
 const totalInsurance=nationalPension+healthInsurance+longTermCare+employmentInsurance,incomeTaxProvided=incomeTax!==null;
 const tax=incomeTaxProvided?number(incomeTax,0,gross,'월 원천징수 소득세'):0,localIncomeTax=floor10(tax*0.1),totalDeductions=totalInsurance+tax+localIncomeTax;
 if(totalDeductions>gross)throw new RangeError('공제액이 급여보다 큽니다. 적용 대상과 입력 금액을 확인해 주세요.');
 return {rule,monthlyGross:Math.round(gross),nonTaxable,taxableSalary:taxable,nationalPension,healthInsurance,longTermCare,employmentInsurance,totalInsurance,incomeTax:tax,localIncomeTax,incomeTaxProvided,totalDeductions,monthlyNetSalary:Math.max(0,Math.round(gross-totalDeductions))};
}
