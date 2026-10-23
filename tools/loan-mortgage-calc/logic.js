// 고정 금리·월말 납부·수수료 제외 상환 예시. 금융기관의 규제 DSR 계산이 아닙니다.
function check(n,min,max){return Number.isFinite(n)&&n>=min&&n<=max;}
export function schedule(principal,annualRate,years,graceMonths,type){
 const months=years*12,rate=annualRate/1200,amortMonths=months-graceMonths;
 const annuity=rate===0?principal/amortMonths:principal*rate/(1-Math.pow(1+rate,-amortMonths));
 let balance=principal,totalInterest=0,totalPayment=0,yearly=[],annualPrincipal=0,annualInterest=0,firstPayment=0,afterGracePayment=0;
 for(let m=1;m<=months;m++){
  const interest=balance*rate;
  let capital=type==='bullet'?(m===months?balance:0):m<=graceMonths?0:type==='equal_pi'?annuity-interest:principal/amortMonths;
  capital=m===months?balance:Math.min(balance,Math.max(0,capital));
  const payment=interest+capital;
  balance=Math.max(0,balance-capital);totalInterest+=interest;totalPayment+=payment;
  annualPrincipal+=capital;annualInterest+=interest;
  if(m===1)firstPayment=payment;
  if(m===graceMonths+1)afterGracePayment=payment;
  if(m%12===0){yearly.push({year:m/12,principal:annualPrincipal,interest:annualInterest,total:annualPrincipal+annualInterest,balance});annualPrincipal=0;annualInterest=0;}
 }
 return {firstPayment,afterGracePayment,totalInterest,totalPayment,yearly,firstYearPayment:yearly[0].total};
}
export function calculate({propertyPrice=600000000,loanAmount=350000000,annualRate=4.2,years=30,graceMonths=0,type='equal_pi',annualIncome=70000000,existingAnnualPayment=3000000,extraRate=1.5}={}){
 if(!check(propertyPrice,10000000,20000000000)||!check(loanAmount,1000000,15000000000)||!check(annualRate,0,25)||!Number.isInteger(years)||!check(years,1,50)||!Number.isInteger(graceMonths)||!check(graceMonths,0,Math.min(120,years*12-12))||!['equal_pi','equal_principal','bullet'].includes(type)||!check(annualIncome,1,5000000000)||!check(existingAnnualPayment,0,2000000000)||!check(extraRate,0,10))throw new RangeError('입력 범위를 확인해 주세요. 거치는 만기보다 최소 12개월 짧아야 합니다.');
 const base=schedule(loanAmount,annualRate,years,graceMonths,type);
 const stressed=schedule(loanAmount,annualRate+extraRate,years,graceMonths,type);
 return {base,stressed,ltv:loanAmount/propertyPrice*100,firstYearRatio:(base.firstYearPayment+existingAnnualPayment)/annualIncome*100,stressedFirstYearRatio:(stressed.firstYearPayment+existingAnnualPayment)/annualIncome*100,extraRate,type};
}
