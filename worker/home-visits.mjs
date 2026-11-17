const headers={'Cache-Control':'no-store'};
const dateFormatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});

export async function homeVisitResponse(request,namespace,now=new Date()) {
  const {method}=request;
  if(method!=='GET'&&method!=='POST'){
    return new Response(null,{status:405,headers:{...headers,Allow:'GET, POST'}});
  }
  const date=dateFormatter.format(now);
  if(method==='POST'){
    const site=request.headers.get('Sec-Fetch-Site');
    if(request.headers.get('Origin')!==new URL(request.url).origin||(site&&site!=='same-origin')){
      return new Response(null,{status:403,headers});
    }
    if(request.headers.get('X-Simulab-Visit-Day')!==date){
      return new Response(null,{status:400,headers});
    }
  }
  // Forward only the date and verb. No visitor headers or identifiers reach storage.
  try{
    const counter=namespace.get(namespace.idFromName('home-totals'));
    return await counter.fetch('https://home-visits.internal/'+date,{method});
  }catch{
    return new Response(null,{status:503,headers});
  }
}

export class HomeVisitCounter {
  constructor(state){
    this.sql=state.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS daily_totals (date TEXT PRIMARY KEY, visits INTEGER NOT NULL)');
  }

  fetch(request){
    const date=new URL(request.url).pathname.slice(1);
    const rows=request.method==='POST'
      ? this.sql.exec(`INSERT INTO daily_totals (date,visits) VALUES (?,1)
        ON CONFLICT(date) DO UPDATE SET visits=visits+1 RETURNING visits`,date)
      : this.sql.exec('SELECT visits FROM daily_totals WHERE date=?',date);
    const visits=rows.toArray()[0]?.visits??0;
    const {totalVisits}=this.sql.exec('SELECT COALESCE(SUM(visits),0) AS totalVisits FROM daily_totals').toArray()[0];
    return Response.json({date,visits,totalVisits},{headers});
  }
}
