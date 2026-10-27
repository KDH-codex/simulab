import {date,shiftMonths,anniversary,days,iso,number} from '../../assets/js/date-only.js';
export function calculate({hireDate='2023-10-01',leaveDate='2026-10-01',wageTotal=9000000,annualBonus=0,annualLeavePay=0,dailyOrdinaryWage=0,weeklyHours=40}={}){
 const hire=date(hireDate),leave=date(leaveDate),start=shiftMonths(leave,-3),serviceDays=days(hire,leave),wageDays=days(start,leave);
 if(serviceDays<=0||hire>start)throw new RangeError('입사일·퇴직일과 퇴직 전 3개월 자료를 확인해 주세요.');
 [wageTotal,annualBonus,annualLeavePay,dailyOrdinaryWage].forEach(n=>number(n));number(weeklyHours,0,100);
 const eligible=leave>=anniversary(hire,1)&&weeklyHours>=15,averageDaily=(wageTotal+(annualBonus+annualLeavePay)*3/12)/wageDays,baseDaily=Math.max(averageDaily,dailyOrdinaryWage);
 return {serviceDays,wageDays,averageDaily,baseDaily,eligible,periodStart:iso(start),periodEnd:iso(leave),gross:eligible?baseDaily*30*serviceDays/365:0};
}
