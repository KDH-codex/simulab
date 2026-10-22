export function koreaDate(now=new Date()) { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function safeCount(value) { const n=Number(value); return Number.isFinite(n)&&n>0?Math.floor(n):0; }
export function calculateKpis(data,now=new Date()) {
  const daily=data?.daily||{}, today=koreaDate(now);
  const yesterday=koreaDate(new Date(new Date(today+'T12:00:00+09:00').getTime()-86400000));
  const current=daily[today]||{}, previous=daily[yesterday]||{};
  const sessions=safeCount(current.uv),pv=safeCount(current.pv),old=safeCount(previous.uv);
  const entries=Object.entries(data?.toolRanking||{}).map(([id,n])=>[id,safeCount(n)]).sort((a,b)=>b[1]-a[1]);
  return {todaySessions:sessions,todayPv:pv,change:old?((sessions-old)/old*100).toFixed(1)+'%':'비교 기준 없음',
    avgPv:sessions?(pv/sessions).toFixed(1):'0.0',
    periodSessions:safeCount(data?.periodSessions),periodPv:Object.values(daily).reduce((n,row)=>n+safeCount(row.pv),0),
    topTool:entries[0]?.[0]||'아직 기록 없음',topViews:entries[0]?.[1]||0};
}
export function exportToCsv(data) {
  let csv='\uFEFF날짜,세션 수,페이지 조회,세션당 페이지 조회\n';
  for(const date of Object.keys(data?.daily||{}).sort()) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;
    const row=data.daily[date],sessions=safeCount(row.uv),pv=safeCount(row.pv);
    csv+=`${date},${sessions},${pv},${sessions?(pv/sessions).toFixed(2):'0.00'}\n`;
  }
  return csv;
}
