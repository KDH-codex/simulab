// 단일 섭취량을 즉시 흡수했다고 가정한 1차 지수 감소 모형.
const clock=raw=>{if(typeof raw!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(raw))throw new RangeError('시각을 확인해 주세요.');const [h,m]=raw.split(':').map(Number);return h*60+m;};
export function calculate({doseMg=150,intakeTime='14:00',checkTime='23:00',dayOffset=0,halfLife=5}={}){
 if(!Number.isFinite(doseMg)||doseMg<0||doseMg>2000||!Number.isFinite(halfLife)||halfLife<1||halfLife>12||!Number.isInteger(dayOffset)||dayOffset<0||dayOffset>2)throw new RangeError('섭취량·반감기·날짜 범위를 확인해 주세요.');
 const elapsedHours=(clock(checkTime)+dayOffset*1440-clock(intakeTime))/60;
 if(elapsedHours<0)throw new RangeError('확인 시각이 섭취 이전입니다. 다음 날 여부를 확인해 주세요.');
 const fraction=Math.pow(.5,elapsedHours/halfLife);
 return {doseMg,elapsedHours,remainingMg:doseMg*fraction,remainingPct:doseMg===0?0:fraction*100,halfLife};
}
