import {number} from '../../assets/js/date-only.js';
export function calculate({ownCapital=100000000,jeonseDeposit=250000000,wolseDeposit=30000000,monthlyRent=800000,loanRate=4,opportunityRate=0,months=24}={}){
 [ownCapital,jeonseDeposit,wolseDeposit,monthlyRent].forEach(n=>number(n));number(loanRate,0,30);number(opportunityRate,0,30);number(months,1,120,true);
 const cost=(deposit,rent)=>{const borrowed=Math.max(0,deposit-ownCapital),locked=Math.min(deposit,ownCapital),interest=borrowed*loanRate/100*months/12,rents=rent*months,opportunity=locked*opportunityRate/100*months/12;return {borrowed,locked,interest,rents,opportunity,cash:interest+rents,total:interest+rents+opportunity};};
 const jeonse=cost(jeonseDeposit,0),wolse=cost(wolseDeposit,monthlyRent);return {jeonse,wolse,months,difference:wolse.total-jeonse.total};
}
