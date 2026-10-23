import {readFile,writeFile} from 'node:fs/promises';
import {validateSource,validateEvent,renderCalendar,renderEvent,eventState,filterEvents,escapeHtml as esc,koreaToday,shortDate} from '../tools/parenting-deals/model.js';
const root=new URL('../',import.meta.url),now=new Date(),today=koreaToday(now),month=today.slice(0,7);
const {sources}=JSON.parse(await readFile(new URL('data/deals/sources.json',root),'utf8'));
const {events}=JSON.parse(await readFile(new URL('data/deals/reviewed.json',root),'utf8'));
if(new Set(sources.map(s=>s.id)).size!==sources.length||new Set(events.map(e=>e.id)).size!==events.length)throw new Error('Duplicate source or event ID');
for(const source of sources){const errors=validateSource(source,now);if(errors.length)throw new Error(source.id+': '+errors.join(', '));}
for(const event of events){const errors=validateEvent(event,sources,now);if(errors.length)throw new Error(event.id+': '+errors.join(', '));event.brandName=sources.find(s=>s.id===event.brandId).name;}
const published=events.filter(e=>e.publicationStatus==='reviewed'),rows=filterEvents(published,{month},now),longterm=filterEvents(published,{placement:'longterm'},now),day=rows.filter(e=>e.startDate<=today&&e.endDate>=today),selected=day[0]||rows[0];
const reviewedDate=[...published.map(e=>e.checkedAt)].sort().at(-1).slice(0,10);
const scopeNote='This file contains reviewed editorial records. Build time never changes checkedAt.';
await writeFile(new URL('tools/parenting-deals/data.js',root),'// '+scopeNote+'\nexport const SOURCES = '+JSON.stringify(sources,null,2)+';\nexport const EVENTS = '+JSON.stringify(published,null,2)+';\n');
const categories={all:'전체',fashion:'패션',appliances:'가전·디지털',kitchen:'주방용품',furniture:'가구·리빙'};
const schema={'@context':'https://schema.org','@type':'CollectionPage',name:'브랜드 세일 달력',url:'https://simulab.kr/tools/parenting-deals/',inLanguage:'ko-KR',dateModified:reviewedDate,mainEntity:{'@type':'ItemList',numberOfItems:published.length,itemListElement:published.map((e,i)=>({'@type':'ListItem',position:i+1,name:e.brandName+' '+e.title,url:e.sourceUrl}))}};
const tokens={SCHEMA:JSON.stringify(schema).replaceAll('<','\\u003c'),EVENT_COUNT:rows.length,BRAND_COUNT:new Set(rows.map(e=>e.brandId)).size,SOURCE_COUNT:sources.length,REVIEWED_DATE:reviewedDate,MONTH_LABEL:month.slice(0,4)+'년 '+Number(month.slice(5))+'월',SELECTED_DAY:Number(today.slice(5,7))+'월 '+Number(today.slice(8))+'일',DAY_COUNT:day.length,ACTIVE_COUNT:rows.filter(e=>eventState(e,now).active).length,UPCOMING_COUNT:rows.filter(e=>eventState(e,now).code==='upcoming').length,SOON_COUNT:filterEvents(published,{month,status:'soon'},now).length,CALENDAR:renderCalendar(month,rows,{today,selectedDate:today,now}),LIST:rows.map(e=>renderEvent(e,{now})).join('\n'),LONGTERM:longterm.map(e=>renderEvent(e,{now})).join('\n'),DETAIL:selected?renderEvent(selected,{now,detail:true}):'<p>확인된 일정이 없습니다.</p>',DAY_EVENTS:day.map(e=>'<a class="static-day-event" href="#sale-'+esc(e.id)+'">'+esc(e.brandName+' · '+e.title)+'</a>').join(''),BRAND_OPTIONS:sources.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join(''),CATEGORY_CHIPS:Object.entries(categories).map(([id,label])=>'<button type="button" data-sale-category="'+id+'" aria-pressed="'+(id==='all')+'">'+label+'</button>').join(''),SOURCE_LINKS:sources.map(s=>{
 const count=published.filter(e=>e.brandId===s.id).length;
 return '<a class="source-link" data-source-brand="'+esc(s.id)+'" href="'+esc(s.officialUrl)+'" target="_blank" rel="noopener noreferrer"><span>'+esc(s.name)+'</span><small>'+esc(count?count+'개 기간 안내 수록':s.note)+'</small><span class="source-arrow" aria-hidden="true">↗</span></a>';
}).join('')};
let html=await readFile(new URL('scripts/templates/brand-sale-calendar.html',root),'utf8');
html=html.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{if(!Object.hasOwn(tokens,key))throw new Error('Missing template token '+key);return String(tokens[key]);});
await writeFile(new URL('tools/parenting-deals/index.html',root),html);
console.log('Brand sale calendar: '+rows.length+' monthly events, '+longterm.length+' long-term benefits, '+sources.length+' reviewed official brand sources.');
