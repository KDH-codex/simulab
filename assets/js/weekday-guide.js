import {filterItems,sourceState} from './weekday-guide-model.js';
const data=JSON.parse(document.getElementById('guide-data').textContent),form=document.getElementById('guide-filter'),query=document.getElementById('guide-query');
const cards=new Map([...document.querySelectorAll('[data-guide-card]')].map(el=>[el.dataset.guideCard,el]));
const status=document.getElementById('guide-status'),empty=document.getElementById('guide-empty');
let category='all';
function render(){const rows=filterItems(data.items,{category,query:query.value}),ids=new Set(rows.map(r=>r.id));cards.forEach((el,id)=>{el.hidden=!ids.has(id);});status.textContent=rows.length+'개 안내'+(query.value.trim()?' · 검색 결과':'');empty.hidden=rows.length!==0;document.querySelectorAll('[data-guide-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guideCategory===category)));}
form.hidden=false;form.addEventListener('submit',e=>e.preventDefault());query.addEventListener('input',render);
document.querySelectorAll('[data-guide-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.guideCategory;render();}));
document.getElementById('guide-reset').addEventListener('click',()=>{category='all';query.value='';render();query.focus();});
const anchor=location.hash.slice(1),anchored=data.items.find(i=>i.id===anchor);if(anchored){category=anchored.category;render();}
for(const item of data.items){const source=data.sources.find(s=>s.id===item.source),el=cards.get(item.id),date=el.querySelector('.guide-check-date'),state=sourceState(source);date.classList.toggle('stale',state.code==='stale');if(state.code==='stale')date.firstChild.textContent=state.label+' ';}
document.querySelectorAll('[data-copy-guide]').forEach(button=>{button.hidden=false;button.addEventListener('click',async()=>{const item=data.items.find(i=>i.id===button.dataset.copyGuide),source=data.sources.find(s=>s.id===item.source),url=new URL('/tools/'+data.guide.id+'/',location.origin);url.hash=item.id;try{await navigator.clipboard.writeText(item.title+'\n'+url.href+'\n출처: '+source.name+' '+source.url+'\n출처 확인: '+source.checkedAt);document.getElementById('guide-copy-status').textContent='안내 링크와 공식 출처를 복사했습니다.';window.SimuLabTracker?.trackEvent('copy_share_url');}catch{document.getElementById('guide-copy-status').textContent='복사하지 못했습니다. 안내 제목의 위치와 공식 링크를 확인해 주세요.';}});});
render();
