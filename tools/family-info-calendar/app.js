import {filterRecords,renderRecord,datesForDay,koreaToday,shiftDate,escapeHtml as e,isDate} from './model.js';
const data=JSON.parse(document.querySelector('#family-info-data').textContent),form=document.querySelector('#info-filters'),list=document.querySelector('#info-list'),empty=document.querySelector('#info-empty'),counter=document.querySelector('#info-count'),calendar=document.querySelector('#info-calendar'),monthInput=document.querySelector('#calendar-month'),grid=document.querySelector('#calendar-grid'),dayInfo=document.querySelector('#calendar-day-info');
const params=new URLSearchParams(location.search),allowedCategories=['all',...data.categories.map(c=>c.id)];
let view=params.get('view')==='calendar'?'calendar':'list',selectedDay='',currentRows=[];
for(const name of ['category','region','calendar','status','age','from','to']){const control=form.elements.namedItem(name),value=params.get(name);if(control&&value&&(control.tagName!=='SELECT'||[...control.options].some(o=>o.value===value))&&(!['from','to'].includes(name)||isDate(value)))control.value=value;}
for(const name of ['onlyFree','includeEnded'])form.elements.namedItem(name).checked=params.get(name)==='1';
function filters(){const values=Object.fromEntries(new FormData(form));return {...values,category:data.pageCategory==='all'&&allowedCategories.includes(values.category)?values.category:data.pageCategory,onlyFree:form.elements.onlyFree.checked,includeEnded:form.elements.includeEnded.checked};}
function syncUrl(f){const query=new URLSearchParams();for(const [key,value]of Object.entries(f))if(value&&value!=='all'&&key!=='category'||key==='category'&&data.pageCategory==='all'&&value!=='all')query.set(key,value===true?'1':value);if(view==='calendar')query.set('view',view);history.replaceState(null,'',location.pathname+(query.size?'?'+query:'')+location.hash);}
function drawCalendar(){
 const month=/^\d{4}-\d{2}$/.test(monthInput.value)?monthInput.value:koreaToday().slice(0,7),first=month+'-01',start=shiftDate(first,-new Date(first+'T00:00:00Z').getUTCDay()),today=koreaToday(),type=filters().calendar;
 grid.innerHTML=['일','월','화','수','목','금','토'].map(day=>`<div class="calendar-weekday">${day}</div>`).join('')+Array.from({length:42},(_,index)=>{
  const date=shiftDate(start,index),items=currentRows.filter(r=>datesForDay(r,date,type).length),outside=!date.startsWith(month),label=`${date}, 확인된 정보 ${items.length}개`;
  return `<button type="button" class="calendar-cell${outside?' outside':''}${date===today?' today':''}" data-date="${date}" aria-label="${label}" aria-pressed="${selectedDay===date}"><span class="calendar-day">${Number(date.slice(8))}</span>${items.slice(0,2).map(r=>`<span class="calendar-entry"><i>${e(datesForDay(r,date,type).join('·'))}</i>${e(r.title)}</span>`).join('')}${items.length>2?`<small>+${items.length-2}개</small>`:''}${items.length?`<span class="calendar-mobile-count">${items.length}개</span>`:''}</button>`;
 }).join('');
}
function render(){
 const f=filters();form.elements.to.setCustomValidity(f.from&&f.to&&f.from>f.to?'종료일은 시작일 이후로 선택해 주세요.':'');
 if(!form.reportValidity())return;
 currentRows=filterRecords(data.records,f);const shown=view==='calendar'&&selectedDay?currentRows.filter(r=>datesForDay(r,selectedDay,f.calendar).length):currentRows;
 list.innerHTML=shown.map(r=>renderRecord(r,data.categories)).join('');empty.hidden=shown.length>0;
 if(!shown.length){empty.querySelector('h3').textContent=data.records.some(r=>data.pageCategory==='all'||r.categoryIds.includes(data.pageCategory))?'선택한 조건에 맞는 정보가 없어요.':'아직 확인된 정보가 없어요.';empty.querySelector('p').innerHTML='조건을 바꾸거나 아래 공식 확인처에서 새 공지를 살펴보세요.<br>확인된 모집·행사만 안내합니다.';}
 counter.textContent='확인된 정보 '+currentRows.length+'개'+(view==='calendar'&&selectedDay?' · '+selectedDay+' '+shown.length+'개':'');
 document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));calendar.hidden=view!=='calendar';
 dayInfo.innerHTML=selectedDay?`<strong>${e(selectedDay)} · ${shown.length}개</strong><button type="button" id="day-clear">날짜 선택 해제</button>`:'';
 drawCalendar();syncUrl(f);
}
form.hidden=false;document.querySelector('.info-toolbar').hidden=false;
form.addEventListener('change',()=>{selectedDay='';render();});form.addEventListener('submit',event=>{event.preventDefault();render();});
form.addEventListener('reset',()=>{selectedDay='';queueMicrotask(()=>{form.elements.to.setCustomValidity('');render();});});
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view;selectedDay='';render();}));
grid.addEventListener('click',event=>{const button=event.target.closest('[data-date]');if(!button)return;selectedDay=button.dataset.date;render();document.querySelector('#info-list').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
dayInfo.addEventListener('click',event=>{if(event.target.closest('#day-clear')){selectedDay='';render();}});
monthInput.addEventListener('change',()=>{selectedDay='';render();});
for(const [id,delta]of [['month-prev',-1],['month-next',1]])document.querySelector('#'+id).addEventListener('click',()=>{const date=new Date(monthInput.value+'-01T00:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta);monthInput.value=date.toISOString().slice(0,7);selectedDay='';render();});
render();
