import {number} from '../../assets/js/date-only.js';
export function calculate({priceA=9000,shippingA=3000,countA=6,sizeA=500,priceB=12000,shippingB=0,countB=8,sizeB=500,unit='ml'}={}){
 [priceA,shippingA,priceB,shippingB].forEach(n=>number(n));[countA,countB].forEach(n=>number(n,1,100000,true));[sizeA,sizeB].forEach(n=>number(n,0.01,1e8));if(!['ml','g','개'].includes(unit))throw new RangeError('같은 단위로 비교해 주세요.');
 const scale=unit==='개'?1:100,a=(priceA+shippingA)/(countA*sizeA)*scale,b=(priceB+shippingB)/(countB*sizeB)*scale;return {a,b,scale,unit,winner:a===b?'동일':a<b?'A 상품':'B 상품',saving:Math.abs(a-b)};
}
