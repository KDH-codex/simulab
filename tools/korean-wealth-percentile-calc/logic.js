// Verified household mean only. No unverified percentile or age boundaries.
export const HOUSEHOLD_MEAN_2025=471440000;
export function calculate({assets=600000000,debts=150000000}={}){
 if(![assets,debts].every(n=>Number.isFinite(n)&&n>=0&&n<=1e15))throw new RangeError('자산과 부채를 0 이상의 금액으로 입력해 주세요.');
 const net=assets-debts;
 return {assets,debts,net,mean:HOUSEHOLD_MEAN_2025,difference:net-HOUSEHOLD_MEAN_2025,ratio:net/HOUSEHOLD_MEAN_2025*100};
}
