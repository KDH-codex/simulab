import {number} from '../../assets/js/date-only.js';
export function calculate({monthlyNetSalary=3000000,workHours=174,commuteHours=40,workExpenses=150000,targetPrice=100000}={}){
 [monthlyNetSalary,commuteHours,workExpenses,targetPrice].forEach(n=>number(n));number(workHours,0.01,1000);number(commuteHours,0,1000);
 const available=monthlyNetSalary-workExpenses,totalHours=workHours+commuteHours,hourly=available/totalHours;
 return {available,totalHours,hourly,targetHours:hourly>0?targetPrice/hourly:null};
}
