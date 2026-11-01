import {EVENTS,SOURCES,MEMBER_OFFERS} from './data.js';
import {filterEvents,eventState,koreaToday,monthRange,shiftMonth,renderCalendar,renderEvent,filterSources,filterMemberOffers,renderMemberOffer,escapeHtml as esc} from './model.js';
const $=id=>document.getElementById(id),today=koreaToday();
const state={month:today.slice(0,7),category:'all',brand:'all',channel:'all',status:'month',query:'',view:'calendar',selectedDate:today,selectedId:'',rangeStart:'',rangeEnd:''};
const form=$('sale-filters'),chips=$('sale-categories');
function saveView(){try{localStorage.setItem('simulab_sale_view',state.view);}catch{}}
try{const saved=localStorage.getItem('simulab_sale_view');if(['calendar','list'].includes(saved))state.view=saved;}catch{}
function matching(){return filterEvents(EVENTS,state);}
function resetRange(){state.rangeStart='';state.rangeEnd='';}
function renderDetail(rows){
 const onDay=rows.filter(e=>e.startDate<=state.selectedDate&&e.endDate>=state.selectedDate);
 const selected=rows.find(e=>e.id===state.selectedId)||onDay[0]||rows[0];
 state.selectedId=selected?.id||'';
 $('selected-date-label').textContent=Number(state.selectedDate.slice(5,7))+'월 '+Number(state.selectedDate.slice(8))+'일';
 $('day-count').textContent=onDay.length+'개 공지';
 $('day-events').innerHTML=onDay.length?onDay.map(e=>'<button type="button" data-event="'+esc(e.id)+'" aria-pressed="'+(e.id===selected?.id)+'"><span class="agenda-dot category-'+esc(e.categories[0])+'"></span><span>'+esc(e.brandName)+'<small>'+esc(e.shortTitle||e.title)+'</small></span><b aria-hidden="true">↗</b></button>').join(''):'<p class="agenda-empty">선택한 조건에 해당하는 일정이 없습니다. 다른 날짜를 눌러보세요.</p>';
 $('selected-event').innerHTML=selected?renderEvent(selected,{detail:true}):'<div class="empty-detail">현재 조건에 맞는 일정이 없습니다.</div>';
 $('detail-caption').textContent=selected?(onDay.some(e=>e.id===selected.id)?'선택한 일정':'이번 달의 다른 일정'):'일정 안내';
}
function render(){
 const now=new Date(),rows=matching(),base=filterEvents(EVENTS,{...state,status:'month',rangeStart:'',rangeEnd:''},now);
 $('month-label').textContent=state.month.slice(0,4)+'년 '+Number(state.month.slice(5))+'월';
 $('sale-count').textContent=rows.length+'개 일정 · '+new Set(rows.map(e=>e.brandId)).size+'개 브랜드';
 const codeCount=code=>base.filter(e=>eventState(e,now).code===code).length;
 $('active-count').textContent=codeCount('active');$('upcoming-count').textContent=codeCount('upcoming');
 $('soon-count').textContent=filterEvents(EVENTS,{...state,status:'soon',rangeStart:'',rangeEnd:''},now).length;
 $('sales-calendar').innerHTML=renderCalendar(state.month,rows,{today:koreaToday(now),selectedDate:state.selectedDate,now});
 $('sales-list').innerHTML=rows.map(e=>renderEvent(e,{now})).join('');
 $('sale-empty').hidden=rows.length!==0;
 $('calendar-section').hidden=state.view!=='calendar'||rows.length===0;$('sale-list-section').hidden=state.view!=='list';
 document.querySelectorAll('[data-sale-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.saleView===state.view)));
 document.querySelectorAll('[data-sale-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.saleCategory===state.category)));
 document.querySelectorAll('[data-status-shortcut]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.statusShortcut===state.status)));
 $('sale-status').value=state.status;
 $('range-note').hidden=!state.rangeStart;
 $('range-label').textContent=state.rangeStart?'선택한 주 '+state.rangeStart+' ~ '+state.rangeEnd:'';
 $('month-context').textContent=state.status==='month'?'선택한 달과 겹치는 기간 한정 대표 세일입니다.':'선택한 달의 일정에 상태 필터를 적용했습니다.';
 renderDetail(rows);
 const visibleSources=filterSources(SOURCES,state),sourceIds=new Set(visibleSources.map(source=>source.id));
 $('source-links').querySelectorAll('[data-source-brand]').forEach(card=>{card.hidden=!sourceIds.has(card.dataset.sourceBrand);});
 $('source-links').querySelectorAll('[data-source-group]').forEach(group=>{const count=[...group.querySelectorAll('[data-source-brand]')].filter(card=>!card.hidden).length;group.hidden=count===0;group.querySelector('h3>span').textContent=count;});
 $('source-visible-count').textContent=visibleSources.length+'개 브랜드';
 $('source-empty').hidden=visibleSources.length!==0;
 const memberRows=filterMemberOffers(MEMBER_OFFERS,state,now);
 $('member-offer-list').innerHTML=memberRows.map(o=>renderMemberOffer(o,{now})).join('');
 $('member-offer-count').textContent=memberRows.length+'개 안내';
 $('member-offer-empty').hidden=memberRows.length!==0;

}
function selectEvent(id){
 const event=matching().find(e=>e.id===id);if(!event)return;
 state.selectedId=id;
 if(state.selectedDate<event.startDate||state.selectedDate>event.endDate)state.selectedDate=[event.startDate,state.month+'-01'].sort().at(-1);
 render();if(state.view==='calendar'){$('selected-event').focus({preventScroll:true});if(matchMedia('(max-width:850px)').matches)$('selected-event').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});}
}
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-event],[data-date],[data-week-start],[data-sale-category],[data-sale-view],[data-status-shortcut],[data-month-step]');
 if(!target)return;
 if(target.dataset.event){event.preventDefault();selectEvent(target.dataset.event);return;}
 if(target.dataset.date){state.selectedDate=target.dataset.date;state.selectedId='';render();return;}
 if(target.dataset.weekStart){state.rangeStart=target.dataset.weekStart;state.rangeEnd=target.dataset.weekEnd;state.view='list';saveView();render();return;}
 if(target.dataset.saleCategory){state.category=target.dataset.saleCategory;resetRange();state.selectedId='';render();return;}
 if(target.dataset.saleView){state.view=target.dataset.saleView;saveView();render();return;}
 if(target.dataset.statusShortcut){state.status=state.status===target.dataset.statusShortcut?'month':target.dataset.statusShortcut;resetRange();render();return;}
 if(target.dataset.monthStep){state.month=shiftMonth(state.month,Number(target.dataset.monthStep));state.selectedDate=state.month===koreaToday().slice(0,7)?koreaToday():state.month+'-01';state.selectedId='';resetRange();render();}
});
form.addEventListener('submit',e=>e.preventDefault());
$('sale-query').addEventListener('input',e=>{state.query=e.target.value;resetRange();render();});
for(const [id,key] of [['sale-brand','brand'],['sale-channel','channel'],['sale-status','status']])$(id).addEventListener('change',e=>{state[key]=e.target.value;resetRange();state.selectedId='';render();});
form.addEventListener('reset',()=>{Object.assign(state,{category:'all',brand:'all',channel:'all',status:'month',query:'',selectedId:''});resetRange();$('sale-query').value='';$('sale-brand').value='all';$('sale-channel').value='all';$('sale-status').value='month';render();});
$('month-today').addEventListener('click',()=>{state.month=koreaToday().slice(0,7);state.selectedDate=koreaToday();state.selectedId='';resetRange();render();});
$('clear-range').addEventListener('click',()=>{resetRange();render();});
$('show-all-status').addEventListener('click',()=>form.reset());
form.hidden=false;chips.hidden=false;$('sale-view-controls').hidden=false;$('month-buttons').hidden=false;$('status-shortcuts').hidden=false;
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});setInterval(render,60000);render();

if(location.hash==='#tracked-brands')requestAnimationFrame(()=>$('tracked-brands').scrollIntoView({block:'start'}));
