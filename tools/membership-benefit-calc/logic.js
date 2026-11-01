import {number} from '../../assets/js/date-only.js';
export function calculate({fee=4900,spend=100000,rate=5,cap=5000,shippingSaved=0}={}){
 [fee,spend,cap,shippingSaved].forEach(n=>number(n));number(rate,0,100);const discount=Math.min(spend*rate/100,cap),benefit=discount+shippingSaved,remainder=Math.max(0,fee-shippingSaved);
 return {discount,benefit,net:benefit-fee,breakEven:remainder===0?0:rate>0&&remainder<=cap?Math.ceil(remainder/(rate/100)):null};
}
