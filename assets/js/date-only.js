const DAY=86400000;
export function date(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new RangeError('날짜를 YYYY-MM-DD 형식으로 입력해 주세요.');
 const d=new Date(value+'T00:00:00Z');
 if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==value||d.getUTCFullYear()<1900)throw new RangeError('실제 존재하는 날짜를 입력해 주세요.');return d;
}
export function shiftMonths(d,n){const y=d.getUTCFullYear(),m=d.getUTCMonth()+n,last=new Date(Date.UTC(y,m+1,0)).getUTCDate();return new Date(Date.UTC(y,m,Math.min(d.getUTCDate(),last)));}
export const days=(a,b)=>(b-a)/DAY;
export const iso=d=>d.toISOString().slice(0,10);
export function number(n,min=0,max=1e12,integer=false){if(!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))throw new RangeError('입력 범위와 정수 항목을 확인해 주세요.');return n;}

export const anniversary=(d,n)=>new Date(Date.UTC(d.getUTCFullYear()+n,d.getUTCMonth(),d.getUTCDate()));
