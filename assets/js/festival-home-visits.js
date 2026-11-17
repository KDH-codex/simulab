const key='simulab_home_visit_day';
const endpoint='/api/home-visits';
const labels={
  ko:(n,total)=>'오늘 방문자 '+n+'명 · 누적 '+total+'명',
  en:(n,total)=>'Visitors today: '+n+' · Total visits: '+total,
  ja:(n,total)=>'今日の訪問者：'+n+'人 · 累計：'+total+'人',
  'zh-CN':(n,total)=>'今日访客：'+n+'人 · 累计：'+total+'人',
  'zh-TW':(n,total)=>'今日訪客：'+n+'人 · 累計：'+total+'人'
};

export function setupHomeVisits(label,locale,koreaToday){
  if(!label||location.pathname!=='/'||window.SIMULAB_PREVIEW)return;

  async function update(){
    if(document.visibilityState!=='visible')return;
    const day=koreaToday();
    let countVisit=false;
    try{
      const choice=JSON.parse(localStorage.getItem('simulab_privacy_v3'));
      if(navigator.globalPrivacyControl!==true&&choice?.analytics!==false&&localStorage.getItem(key)!==day){
        // Reserve the day before sending; a lost response must not cause a second increment.
        localStorage.setItem(key,day);
        countVisit=true;
      }
    }catch{} // With blocked storage we can read the total without risking repeat increments.

    const response=await fetch(endpoint,{
      method:countVisit?'POST':'GET',
      headers:countVisit?{'X-Simulab-Visit-Day':day}:{},
      credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',keepalive:countVisit
    });
    if(!response.ok)return;
    const {visits,totalVisits}=await response.json();
    if(!Number.isSafeInteger(visits)||visits<0||!Number.isSafeInteger(totalVisits)||totalVisits<visits)return;
    const format=new Intl.NumberFormat(locale);
    label.textContent=(labels[locale]||labels.ko)(format.format(visits),format.format(totalVisits));
    label.hidden=false;
  }
  function start(){
    if(document.visibilityState!=='visible')return;
    document.removeEventListener('visibilitychange',start);
    // Recent browsers can also serialize visits from tabs opened at the same time.
    const task=navigator.locks?navigator.locks.request(key,update):update();
    task.catch(()=>{});
  }
  if(document.visibilityState==='visible')start();
  else document.addEventListener('visibilitychange',start);
  addEventListener('pageshow',event=>{if(event.persisted)start();});
}
