export const RULES={2025:{max:66000,hourlyFloor:8024},2026:{max:68100,hourlyFloor:8256}};
export function calculateDays(age,years,isDisabled=false){const older=age>=50||isDisabled;return years<1?120:years<3?(older?180:150):years<5?(older?210:180):years<10?(older?240:210):(older?270:240);}
export function calculate({separationDate='2026-10-23',wageTotal=9000000,wageDays=90,age=35,insuranceYears=3,dailyWorkHours=8,isDisabled=false}={}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(separationDate)||!Number.isFinite(Date.parse(separationDate+'T00:00:00Z'))||new Date(separationDate+'T00:00:00Z').toISOString().slice(0,10)!==separationDate)throw new RangeError('올바른 이직일을 입력해 주세요.');
 const year=Number(separationDate.slice(0,4)),rule=RULES[year];if(!rule)throw new RangeError('2025·2026년 이직일만 지원합니다. 다른 연도는 고용센터에서 확인해 주세요.');
 for(const [n,min,max] of [[wageTotal,1,300000000],[wageDays,1,100],[age,15,100],[insuranceYears,0,60],[dailyWorkHours,1,8]])if(!Number.isFinite(n)||n<min||n>max)throw new RangeError('임금·기간·근로시간의 입력 범위를 확인해 주세요.');
 if(!Number.isInteger(wageDays)||!Number.isInteger(dailyWorkHours))throw new RangeError('일수와 1일 근로시간은 정수로 입력해 주세요.');
 const dailyWage=wageTotal/wageDays,minAmount=rule.hourlyFloor*dailyWorkHours,finalDailyBenefit=Math.floor(Math.max(minAmount,Math.min(rule.max,dailyWage*0.6))),benefitDays=calculateDays(age,insuranceYears,isDisabled);
 return {year,dailyWage,minAmount,maxAmount:rule.max,finalDailyBenefit,benefitDays,totalBenefit:finalDailyBenefit*benefitDays};
}
