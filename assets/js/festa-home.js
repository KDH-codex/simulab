const events = JSON.parse(document.getElementById('festa-data')?.textContent || '[]');
const cards = [...document.querySelectorAll('.event-card')];
const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const safe = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isOn = (e,d) => e.dates?.length ? e.dates.includes(d) : e.startDate<=d && e.endDate>=d;
let shown = new Date(Number(today.slice(0,4)),Number(today.slice(5,7))-1,1);
let selected = today, theme='all', expanded=false;
const byId = id => document.getElementById(id);
const monthName = d => new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long'}).format(d);
const dayName = d => new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'long'}).format(new Date(Number(d.slice(0,4)),Number(d.slice(5,7))-1,Number(d.slice(8,10))));
const onDate = d => events.filter(e=>isOn(e,d));
function syncSpotlight(){
  const next=e=>e.dates?.length?e.dates.find(d=>d>=today):(e.endDate>=today?(e.startDate>today?e.startDate:today):undefined);
  const available=events.filter(next).sort((a,b)=>next(a).localeCompare(next(b))||a.title.localeCompare(b.title));
  const pick=available.find(e=>e.theme==='light')||available[0];
  const pill=document.querySelector('.hero-copy .pill'),title=document.querySelector('.hero-event'),link=document.querySelector('.hero-actions .orange');
  if(pick){
    pill.textContent=`${pick.region} · ${next(pick).slice(5).replace('-','.')}`;
    title.textContent=pick.title;
    link.href=pick.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='공식 행사 안내 ↗';
  }else{
    pill.textContent='새 일정 준비 중';title.textContent='새 행사를 확인하고 있어요';
    link.href='/tools/kids-outing-calendar/';link.removeAttribute('target');link.removeAttribute('rel');link.textContent='나들이 달력 보기 ↗';
  }
  document.querySelectorAll('.hero-side .mini-event').forEach(e=>e.remove());
  const label=document.querySelector('.side-label');
  for(const e of available.filter(e=>e!==pick).slice(0,2).reverse()){
    label.insertAdjacentHTML('afterend',`<a class="mini-event" href="${safe(e.url)}" target="_blank" rel="noopener noreferrer"><span class="mini-date">${next(e).slice(5).replace('-','.')}</span><span><b>${safe(e.title)}</b><small>${safe(e.region)} · ${safe(e.location)}</small></span><i aria-hidden="true">↗</i></a>`);
  }
}
function renderDay(){
  const current=onDate(selected);
  byId('day-title').textContent=dayName(selected);
  byId('day-subtitle').textContent=current.length?`확인된 행사 ${current.length}개 · 방문 전 공식 공지 확인`:'이 날짜에 확인된 행사가 없습니다.';
  byId('day-events').innerHTML=current.length?current.map(e=>`<a class="day-event" href="${safe(e.url)}" target="_blank" rel="noopener noreferrer"><span class="badge">${safe(e.region)}</span><span><strong>${safe(e.title)}</strong><small>공식 행사 안내</small></span><i aria-hidden="true">↗</i></a>`).join(''):'<p class="day-empty">다른 날을 눌러보세요. 곧 열릴 행사가 기다리고 있어요.</p>';
}
function renderMonth(){
  byId('month-label').textContent=monthName(shown);
  const y=shown.getFullYear(),m=shown.getMonth(),offset=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate();
  let html='';
  for(let i=0;i<offset;i++)html+='<button type="button" disabled aria-hidden="true"></button>';
  for(let n=1;n<=last;n++){
    const d=`${y}-${String(m+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`;
    const count=onDate(d).length;
    html+=`<button type="button" data-day="${d}" class="${count?'has-event ':''}${d===selected?'selected ':''}${d<today?'past':''}" aria-label="${dayName(d)}, 행사 ${count}개" aria-pressed="${d===selected}">${n}</button>`;
  }
  byId('calendar-days').innerHTML=html;
  byId('calendar-days').querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.day;renderMonth();renderDay();}));
}
function renderCards(){
  const q=byId('event-search').value.trim().toLowerCase(),region=byId('region-filter').value;
  let count=0;
  for(const card of cards){
    const active=card.dataset.end>=today && (theme==='all'||card.dataset.theme===theme) && (region==='all'||card.dataset.region===region) && (!q||card.dataset.search.includes(q));
    if(active)count++;
    card.hidden=!active||(!expanded&&count>9);
  }
  byId('result-count').textContent=`${count}개의 행사`;
  byId('event-empty').hidden=count>0;
  byId('show-more').hidden=expanded||count<=9;
}
byId('month-prev').addEventListener('click',()=>{shown=new Date(shown.getFullYear(),shown.getMonth()-1,1);renderMonth();});
byId('month-next').addEventListener('click',()=>{shown=new Date(shown.getFullYear(),shown.getMonth()+1,1);renderMonth();});
byId('month-today').addEventListener('click',()=>{shown=new Date(Number(today.slice(0,4)),Number(today.slice(5,7))-1,1);selected=today;renderMonth();renderDay();});
byId('event-search').addEventListener('input',renderCards);
byId('region-filter').addEventListener('change',renderCards);
byId('show-more').addEventListener('click',()=>{expanded=true;renderCards();});
document.querySelectorAll('.chip-list button[data-theme]').forEach(b=>b.addEventListener('click',()=>{theme=b.dataset.theme;document.querySelectorAll('.chip-list button[data-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCards();}));
syncSpotlight();renderMonth();renderDay();renderCards();
