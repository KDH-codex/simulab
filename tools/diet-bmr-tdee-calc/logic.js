export const ACTIVITY_FACTORS={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,veryActive:1.9};
export function calculate({sex='male',age=35,heightCm=170,weightKg=70,activity='sedentary'}={}){
 if(!['male','female'].includes(sex)||!Number.isFinite(age)||age<19||age>78||!Number.isFinite(heightCm)||heightCm<120||heightCm>230||!Number.isFinite(weightKg)||weightKg<30||weightKg>250||!Object.hasOwn(ACTIVITY_FACTORS,activity))throw new RangeError('성인 대상 입력 범위를 확인해 주세요.');
 const restingEnergy=10*weightKg+6.25*heightCm-5*age+(sex==='male'?5:-161);
 if(restingEnergy<=0)throw new RangeError('이 입력에는 모형을 적용할 수 없습니다.');
 return {restingEnergy,activityFactor:ACTIVITY_FACTORS[activity],totalEnergy:restingEnergy*ACTIVITY_FACTORS[activity]};
}
