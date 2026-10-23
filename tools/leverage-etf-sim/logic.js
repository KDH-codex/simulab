// Hypothetical daily-reset model. No prices, forecasts or trade recommendations.
export function calculate({principal=1000000,leverage=3,annualFeePct=0,returns='10,-10,10,-10'}={}){
 if(!Number.isFinite(principal)||principal<=0||principal>1e12||!Number.isFinite(leverage)||leverage<1||leverage>5||!Number.isFinite(annualFeePct)||annualFeePct<0||annualFeePct>10)throw new RangeError('원금·배수·비용의 입력 범위를 확인해 주세요.');
 const tokens=String(returns).trim().split(/[,\s]+/);if(!tokens.length||tokens.length>1000||tokens.some(v=>!v||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v)))throw new RangeError('일별 수익률을 쉼표로 구분해 1~1,000개 입력해 주세요.');
 const rates=tokens.map(Number);if(rates.some(n=>!Number.isFinite(n)||n< -100||n>100))throw new RangeError('각 일별 수익률은 -100~100%로 입력해 주세요.');
 let base=principal,leveraged=principal,basePeak=principal,leveragedPeak=principal,baseMdd=0,leveragedMdd=0;
 const rows=[{day:0,rate:0,base,leveraged}];
 for(const [i,rate] of rates.entries()){
  base*=1+rate/100;leveraged*=Math.max(0,1+leverage*rate/100-annualFeePct/100/252);
  if(!Number.isFinite(base)||!Number.isFinite(leveraged)||base>1e18||leveraged>1e18)throw new RangeError('계산 규모가 너무 큽니다. 기간이나 수익률을 줄여 주세요.');
  basePeak=Math.max(basePeak,base);leveragedPeak=Math.max(leveragedPeak,leveraged);
  baseMdd=Math.min(baseMdd,(base/basePeak-1)*100);leveragedMdd=Math.min(leveragedMdd,(leveraged/leveragedPeak-1)*100);
  rows.push({day:i+1,rate,base,leveraged});
 }
 return {principal,leverage,annualFeePct,base,leveraged,baseReturn:(base/principal-1)*100,leveragedReturn:(leveraged/principal-1)*100,baseMdd,leveragedMdd,rows};
}
