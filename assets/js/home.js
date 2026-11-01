import { filterEvents, selectAcrossRegions, koreaToday, weekendRange, nextDate, isStale, escapeHtml as esc } from '/tools/kids-outing-calendar/logic.js?v=20261023_verified1';
const search=document.getElementById('tool-search'), directory=document.getElementById('tool-directory');
const groups=[...directory.querySelectorAll('[data-group]')], cards=[...directory.querySelectorAll('[data-tool]')];
let category='all';
function filter() {
  const words=search.value.trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean); let count=0;
  cards.forEach(card=>{card.hidden=!(category==='all'||category===card.dataset.category)||!words.every(word=>card.dataset.search.toLocaleLowerCase('ko-KR').includes(word)); if(!card.hidden)count++;});
  groups.forEach(group=>{group.hidden=![...group.querySelectorAll('[data-tool]')].some(card=>!card.hidden); if(words.length||category!=='all') group.open=!group.hidden;});
  document.getElementById('catalog-status').textContent=count+'개 도구·안내'+(words.length?' · 검색 결과':'');
  document.getElementById('catalog-empty').hidden=count!==0;
  document.querySelectorAll('[data-category-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.categoryFilter===category)));
}
document.querySelector('.home-search').addEventListener('submit',event=>{event.preventDefault();filter();document.getElementById('all-tools').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
search.addEventListener('input',filter);
document.querySelectorAll('[data-category-filter]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.categoryFilter;filter();}));
const query=new URLSearchParams(location.search).get('q');if(query){search.value=query.slice(0,100);filter();}
const catalog=new Map(cards.map(card=>[card.dataset.tool,card]));
function renderRecents() {
  let ids=[];try{ids=JSON.parse(localStorage.getItem('simulab_recent_tools')||'[]');}catch{}
  if(!Array.isArray(ids))ids=[];ids=[...new Set(ids)].filter(id=>catalog.has(id)).slice(0,6);
  document.getElementById('saved-section').hidden=!ids.length;
  document.getElementById('recent-tools').replaceChildren(...ids.map(id=>{const link=document.createElement('a');link.href=catalog.get(id).getAttribute('href');link.textContent=catalog.get(id).querySelector('h3').textContent;return link;}));
}
document.getElementById('clear-recents').addEventListener('click',()=>{try{localStorage.removeItem('simulab_recent_tools');}catch{}renderRecents();});
renderRecents();
const container=document.getElementById('home-events');
const today=koreaToday(),events=selectAcrossRegions(filterEvents({...weekendRange(today),today,includeEnded:false}),3);
container.innerHTML=events.length?events.map(e=>'<a class="weekend-event" href="/tools/kids-outing-calendar/?range=day&amp;date='+nextDate(e,weekendRange(today).start)+'&amp;q='+encodeURIComponent(e.title)+'&amp;view=list"><span class="event-date">'+esc(nextDate(e,weekendRange(today).start).slice(5).replace('-','.'))+'<small>'+esc(e.region)+'</small></span><div><h3>'+esc(e.title)+'</h3><p>'+esc(e.location)+'</p><span>'+esc(e.fee)+'</span></div><b aria-hidden="true">↗</b></a>').join(''):'<p>이번 주말에 해당하는 검토된 정보가 아직 없습니다. <a href="/tools/kids-outing-calendar/">나들이 달력 보기 ↗</a></p>';
if(isStale(container.dataset.reviewed,today)){const notice=document.createElement('p');notice.className='weekend-reviewed';notice.textContent='검토일로부터 7일이 지났습니다. 방문 전 최신 공지를 확인하세요.';container.prepend(notice);}

function openLinkedGroup(){const group=groups.find(item=>'#'+item.id===location.hash);if(group){category=group.dataset.group;search.value='';filter();group.open=true;}}
window.addEventListener('hashchange',openLinkedGroup);openLinkedGroup();
