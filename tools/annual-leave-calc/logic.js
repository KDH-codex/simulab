import {date,shiftMonths,anniversary,iso,number} from '../../assets/js/date-only.js';
export function calculate({hireDate='2023-07-01',asOfDate='2026-10-27',usedDays=5}={}){
 const hire=date(hireDate),asOf=date(asOfDate);number(usedDays,0,100);if(asOf<hire)throw new RangeError('기준일은 입사일 이후로 입력해 주세요.');
 let years=asOf.getUTCFullYear()-hire.getUTCFullYear();if(anniversary(hire,years)>asOf)years--;
 let grant,periodStart,periodEnd;
 if(years===0){let months=(asOf.getUTCFullYear()-hire.getUTCFullYear())*12+asOf.getUTCMonth()-hire.getUTCMonth();if(shiftMonths(hire,months)>asOf)months--;grant=Math.min(11,months);periodStart=hire;periodEnd=anniversary(hire,1);}
 else{grant=Math.min(25,15+Math.floor((years-1)/2));periodStart=anniversary(hire,years);periodEnd=anniversary(hire,years+1);}
 if(usedDays>grant)throw new RangeError('사용일수가 이번 기간의 발생일수를 넘습니다. 선사용·이월은 회사 기준을 확인해 주세요.');
 return {years,grant,remaining:grant-usedDays,periodStart:iso(periodStart),periodEnd:iso(periodEnd)};
}
