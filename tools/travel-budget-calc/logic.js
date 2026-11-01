import {number} from '../../assets/js/date-only.js';
export function calculate({adults=2,children=1,days=2,nights=1,roomPerNight=120000,transport=60000,foodPerPersonDay=25000,adultAdmission=15000,childAdmission=10000,parking=10000,other=0,bufferPercent=10}={}){
 [adults,children].forEach(n=>number(n,0,100,true));number(days,1,365,true);number(nights,0,364,true);number(bufferPercent,0,100);
 if(adults+children===0||nights>=days)throw new RangeError('인원과 일정(숙박 수 < 여행 일수)을 확인해 주세요.');
 [roomPerNight,transport,foodPerPersonDay,adultAdmission,childAdmission,parking,other].forEach(n=>number(n));
 const stay=roomPerNight*nights,food=(adults+children)*foodPerPersonDay*days,admission=adults*adultAdmission+children*childAdmission,base=stay+transport+food+admission+parking+other,buffer=base*bufferPercent/100;
 return {stay,food,admission,base,buffer,total:base+buffer,perPerson:(base+buffer)/(adults+children)};
}
