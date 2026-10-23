export function calculate({amount=1000000,baseIndex=100,targetIndex=110}={}){
 if(!Number.isFinite(amount)||amount<0||amount>1e15||![baseIndex,targetIndex].every(n=>Number.isFinite(n)&&n>=0.001&&n<=100000))throw new RangeError('금액과 0.001 이상 물가지수를 입력해 주세요.');
 const multiplier=targetIndex/baseIndex;
 return {amount,baseIndex,targetIndex,multiplier,equivalent:amount*multiplier,purchasingPower:amount/multiplier,priceChange:(multiplier-1)*100,powerChange:(1/multiplier-1)*100};
}
