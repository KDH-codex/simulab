export const CATEGORIES={all:'전체',life:'라이프',fashion:'패션',kids:'유아·키즈 패션',furniture:'가구·리빙',appliances:'가전·디지털',kitchen:'주방용품'};
export const BENEFITS={sale:'가격 할인',coupon:'쿠폰',points:'적립·페이백',installment:'무이자 할부',shipping:'배송 혜택',live:'쇼핑 라이브',mixed:'복합 혜택'};
export const CHANNELS={online:'온라인',store:'매장',phone:'전화 주문',unknown:'적용 채널 확인'};
const DAY=86400000,HOUR=3600000;
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function validMonth(value){return /^\d{4}-(0[1-9]|1[0-2])$/.test(value||'')&&Number(value.slice(0,4))>=1970&&Number(value.slice(0,4))<=2099;}
export function addDays(date,count){return new Date(Date.parse(date+'T00:00:00Z')+count*DAY).toISOString().slice(0,10);}
export function koreaToday(now=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));}
export function monthRange(month){if(!validMonth(month))throw new Error('Invalid month');const start=month+'-01';return {start,end:new Date(Date.UTC(+month.slice(0,4),+month.slice(5),0)).toISOString().slice(0,10)};}
export function shiftMonth(month,offset){if(!validMonth(month)||!Number.isInteger(offset)||Math.abs(offset)>12)throw new Error('Invalid month shift');const date=new Date(Date.UTC(+month.slice(0,4),+month.slice(5)-1+offset,1)).toISOString().slice(0,7);return validMonth(date)?date:month;}
export const shortDate=value=>value.slice(5).replace('-','.');
export const formatCheckedAt=value=>value.slice(0,16).replace('T',' ')+' KST';
export function safeOfficialUrl(value,hosts){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&hosts.includes(url.hostname);}catch{return false;}}
function validTimestamp(value){return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(value||'')&&Number.isFinite(Date.parse(value))&&new Date(Date.parse(value)+9*HOUR).toISOString().slice(0,19)===value.slice(0,19);}
export const MAX_SALE_DAYS=31;
export function calendarExclusionReason(event){
 if(event.placement!=='calendar')return '월간 대표 세일 외 혜택';
 if(!validDate(event.startDate)||!validDate(event.endDate)||event.startDate>event.endDate)return '확인된 행사 기간 없음';
 const days=(Date.parse(event.endDate+'T00:00:00Z')-Date.parse(event.startDate+'T00:00:00Z'))/DAY+1;
 if(days>MAX_SALE_DAYS)return '31일을 넘는 장기 행사';
 if(event.campaignKind!=='limited-sale')return '기간 한정 세일 외 안내';
 if(!['brand','multi-category','category'].includes(event.campaignScope))return '개별 상품·대상자 혜택';
 if(!['sale','mixed','coupon'].includes(event.benefitType))return '할부·배송·방송 등 부가 혜택';
 return '';
}
export const isCalendarEligible=event=>event.publicationStatus==='reviewed'&&!calendarExclusionReason(event);
export function filterSources(sources,{category='all',brand='all',query=''}={}){
 const words=query.slice(0,100).trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);
 return sources.filter(source=>(category==='all'||source.categories.includes(category))&&(brand==='all'||source.id===brand)&&words.every(word=>[source.name,...(source.aliases||[]),...source.categories.map(c=>CATEGORIES[c])].join(' ').toLocaleLowerCase('ko-KR').includes(word)));
}
export function renderSourceDirectory(sources,events,{now=new Date()}={}){
 return Object.entries(CATEGORIES).filter(([id])=>id!=='all').map(([id,label])=>{
  const members=sources.filter(source=>source.categories[0]===id);
  if(!members.length)return '';
  return '<section class="source-group" data-source-group="'+id+'"><h3>'+escapeHtml(label)+' <span>'+members.length+'</span></h3><div class="source-links">'+members.map(source=>{
   const records=events.filter(event=>isCalendarEligible(event)&&event.brandId===source.id),active=records.filter(event=>eventState(event,now).active).length;
   const label=active?'기간 한정 세일 '+active+'개':records.length?'수록 일정 '+records.length+'개':'대표 세일 추가 확인';
   return '<a class="source-link" data-source-brand="'+escapeHtml(source.id)+'" href="'+escapeHtml(source.officialUrl)+'" target="_blank" rel="noopener noreferrer"><span>'+escapeHtml(source.name)+'</span><b class="source-status'+(active?' has-sale':'')+'">'+escapeHtml(label)+'</b><small>'+escapeHtml(source.note||'공식 기간·품목·이용 채널 확인')+'</small><small class="source-checked">출처 확인 '+escapeHtml(formatCheckedAt(source.checkedAt))+'</small><span class="source-arrow" aria-hidden="true">↗</span></a>';
  }).join('')+'</div></section>';
 }).join('');
}
export function validateSource(source,now=new Date()){
 const errors=[];for(const key of ['id','name','operator','officialUrl','checkedAt','rightsNote'])if(!source[key])errors.push('Missing source '+key);
 if(!/^[a-z0-9-]+$/.test(source.id||''))errors.push('Invalid source id');
 if(!Array.isArray(source.allowedHosts)||!safeOfficialUrl(source.officialUrl,source.allowedHosts))errors.push('Unsafe official URL');
 if(!Array.isArray(source.categories)||!source.categories.length||source.categories.some(c=>!Object.hasOwn(CATEGORIES,c)||c==='all'))errors.push('Invalid source categories');
 if(!Array.isArray(source.aliases)||source.aliases.some(alias=>typeof alias!=='string'))errors.push('Invalid aliases');
 if(!['priority','standard','additional'].includes(source.trackingTier))errors.push('Invalid tracking tier');
 if(!source.note)errors.push('Missing tracking note');
 if(!validTimestamp(source.checkedAt)||Date.parse(source.checkedAt)>+new Date(now))errors.push('Invalid source review date');
 return errors;
}
export function validateEvent(event,sources,now=new Date()){
 const errors=[];const source=sources.find(s=>s.id===event.brandId);
 for(const field of ['id','brandId','title','startDate','endDate','summary','sourceUrl','checkedAt','periodNote'])if(!event[field])errors.push('Missing '+field);
 if(!source)errors.push('Unknown official source');
 if(!/^[a-z0-9-]+$/.test(event.id||''))errors.push('Invalid id');
 if(!validDate(event.startDate)||!validDate(event.endDate)||event.startDate>event.endDate)errors.push('Invalid period');
 if(!validTimestamp(event.checkedAt)||Date.parse(event.checkedAt)>+new Date(now))errors.push('Invalid event review date');
 if(!Array.isArray(event.categories)||!event.categories.length||event.categories.some(c=>!Object.hasOwn(CATEGORIES,c)||c==='all'))errors.push('Invalid categories');
 if(!Array.isArray(event.channels)||!event.channels.length||event.channels.some(c=>!Object.hasOwn(CHANNELS,c)))errors.push('Invalid channels');
 if(!Object.hasOwn(BENEFITS,event.benefitType))errors.push('Invalid benefit type');
 if(!Array.isArray(event.conditions)||!event.conditions.length)errors.push('Missing conditions');
 if(!['reviewed','held','cancelled'].includes(event.publicationStatus))errors.push('Missing publication review');
 if(!['limited-sale','ongoing','longterm','member-benefit','product-offer'].includes(event.campaignKind))errors.push('Missing campaign kind');
 if(!['brand','multi-category','category','product','member'].includes(event.campaignScope))errors.push('Missing campaign scope');
 if(event.publicationStatus==='reviewed'&&calendarExclusionReason(event))errors.push('Not eligible for calendar: '+calendarExclusionReason(event));
 if(!['calendar','longterm'].includes(event.placement))errors.push('Invalid placement');
 if(!['facts-summary','schedule-only'].includes(event.publicationScope))errors.push('Missing editorial scope');
 if(!Number.isInteger(event.reviewWithinDays)||event.reviewWithinDays<1||event.reviewWithinDays>14)errors.push('Invalid review interval');
 if(event.endTimeExclusive!==undefined&&typeof event.endTimeExclusive!=='boolean')errors.push('Invalid end-time boundary');
 if(event.endTimeExclusive&&!event.endTime)errors.push('Missing exclusive end time');
 for(const key of ['startTime','endTime'])if(event[key]&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(event[key]))errors.push('Invalid '+key);
 for(const key of ['sourceUrl','periodSourceUrl'])if(!source||!safeOfficialUrl(event[key],source.allowedHosts))errors.push('Unsafe '+key);
 if(event.priceWon!=null||event.discountedPrice!=null)errors.push('Individual product pricing is not a calendar event');
 return errors;
}
export function eventState(event,now=new Date()){
 const today=koreaToday(now);
 if(event.publicationStatus!=='reviewed')return {code:event.publicationStatus,label:event.publicationStatus==='cancelled'?'취소 안내':event.publicationStatus==='held'?'보류':'검토 전',active:false};
 if(!validDate(event.startDate)||!validDate(event.endDate)||!validTimestamp(event.checkedAt)||Date.parse(event.checkedAt)>+new Date(now))return {code:'pending',label:'검토 필요',active:false};
 if(!isCalendarEligible(event))return {code:'excluded',label:'수록 기준 제외',active:false};
 const exactEnd=event.endTime?Date.parse(event.endDate+'T'+event.endTime+':00+09:00')+(event.endTimeExclusive?0:60000):null;
 if(today>event.endDate||(exactEnd!==null&&+new Date(now)>=exactEnd))return {code:'ended',label:'종료된 일정',active:false};
 const stale=+new Date(now)-Date.parse(event.checkedAt)>event.reviewWithinDays*DAY;
 if(stale)return {code:'stale',label:'재확인 필요',active:false};
 if(today<event.startDate||(today===event.startDate&&event.startTime&&+new Date(now)<Date.parse(today+'T'+event.startTime+':00+09:00')))return {code:'upcoming',label:'시작 예정',active:false};
 if(event.scheduleKind==='broadcast')return {code:'broadcast',label:'방송일 · 진행 확인',active:false};
 return {code:'active',label:today===event.endDate?'오늘 종료 예정':'공지 기간 중',active:true};
}
export function filterEvents(events,{month,category='all',brand='all',channel='all',status='month',query='',rangeStart='',rangeEnd='',placement='calendar'}={},now=new Date()){
 const today=koreaToday(now),range=month?monthRange(month):null;
 const words=query.slice(0,100).trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);
 return events.filter(event=>{
  if(!isCalendarEligible(event)||event.placement!==placement)return false;
  if(range&&(event.endDate<range.start||event.startDate>range.end))return false;
  if(rangeStart&&rangeEnd&&(event.endDate<rangeStart||event.startDate>rangeEnd))return false;
  if(category!=='all'&&!event.categories.includes(category)||brand!=='all'&&event.brandId!==brand||channel!=='all'&&!event.channels.includes(channel))return false;
  if(!words.every(w=>[event.title,event.brandName,...(event.brandAliases||[]),event.summary,...event.categories.map(c=>CATEGORIES[c])].join(' ').toLocaleLowerCase('ko-KR').includes(w)))return false;
  const state=eventState(event,now),days=(Date.parse(event.endDate+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/DAY;
  if(status==='active'&&!state.active||status==='soon'&&(!state.active||days<0||days>6)||status==='upcoming'&&state.code!=='upcoming'||status==='ended'&&state.code!=='ended'||status==='stale'&&state.code!=='stale')return false;
  return true;
 }).sort((a,b)=>a.endDate.localeCompare(b.endDate)||a.startDate.localeCompare(b.startDate)||a.id.localeCompare(b.id));
}
export function monthWeeks(month,events,{maxLanes=3}={}){
 if(!Number.isInteger(maxLanes)||maxLanes<1||maxLanes>8)throw new Error('Invalid lane count');
 const range=monthRange(month),offset=new Date(range.start+'T00:00:00Z').getUTCDay(),first=addDays(range.start,-offset),weeks=[];
 for(let weekStart=first;weekStart<=range.end;weekStart=addDays(weekStart,7)){
  const end=addDays(weekStart,6),segments=[],laneEnds=[],hiddenIds=[];
  const candidates=events.filter(e=>isCalendarEligible(e)&&e.endDate>=weekStart&&e.startDate<=end&&e.endDate>=range.start&&e.startDate<=range.end).sort((a,b)=>a.endDate.localeCompare(b.endDate)||a.id.localeCompare(b.id));
  for(const event of candidates){
   const start=[event.startDate,weekStart,range.start].sort().at(-1),stop=[event.endDate,end,range.end].sort()[0];
   const col=Math.round((Date.parse(start+'T00:00:00Z')-Date.parse(weekStart+'T00:00:00Z'))/DAY);
   const span=Math.round((Date.parse(stop+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/DAY)+1;
   let lane=laneEnds.findIndex(last=>last<col);if(lane<0)lane=laneEnds.length;laneEnds[lane]=col+span-1;
   if(lane>=maxLanes)hiddenIds.push(event.id);else segments.push({event,start,stop,col:col+1,span,lane:lane+1,continuesBefore:event.startDate<start,continuesAfter:event.endDate>stop});
  }
  weeks.push({start:weekStart,end,days:Array.from({length:7},(_,i)=>addDays(weekStart,i)),segments,hiddenIds});
 }
 return weeks;
}
export function renderCalendar(month,events,{today=koreaToday(),selectedDate=today,now=new Date()}={}){
 const esc=escapeHtml;
 return '<div class="weekdays" aria-hidden="true">'+['일','월','화','수','목','금','토'].map(x=>'<span>'+x+'</span>').join('')+'</div>'+
 monthWeeks(month,events).map(week=>'<div class="sale-week"><div class="week-dates">'+week.days.map((date,index)=>{
  const outside=date.slice(0,7)!==month,cls='date-cell'+(outside?' outside':'')+(date===today?' today':'')+(date===selectedDate?' selected':'');
  return '<div class="'+cls+'">'+(outside?'<span>'+Number(date.slice(8))+'</span>':'<button type="button" data-date="'+date+'" aria-label="'+date+' 행사 보기" aria-pressed="'+(date===selectedDate)+'">'+Number(date.slice(8))+'</button>')+'</div>';
 }).join('')+'</div><div class="week-bars">'+week.segments.map(s=>{
  const state=eventState(s.event,now);return '<a class="sale-bar category-'+esc(s.event.categories[0])+' state-'+state.code+(s.continuesBefore?' continues-before':'')+(s.continuesAfter?' continues-after':'')+'" href="#sale-'+esc(s.event.id)+'" data-event="'+esc(s.event.id)+'" style="grid-column:'+s.col+' / span '+s.span+';grid-row:'+s.lane+'" aria-label="'+esc(s.event.brandName+' · '+s.event.title+' · '+s.event.startDate+'부터 '+s.event.endDate+'까지 · '+state.label)+'"><span>'+esc(s.event.brandName)+'</span> '+esc(s.event.shortTitle||s.event.title)+'</a>';
 }).join('')+'</div>'+(week.hiddenIds.length?'<button class="week-more" type="button" data-week-start="'+week.start+'" data-week-end="'+week.end+'">이 주의 일정 '+week.hiddenIds.length+'개 더 보기 <span aria-hidden="true">↗</span></button>':'<div class="week-more-space"></div>')+'</div>').join('');
}
export function periodText(event){const date=value=>event.startDate.slice(0,4)!==event.endDate.slice(0,4)?value.replaceAll('-','.'):shortDate(value);const start=date(event.startDate)+(event.startTime?' '+event.startTime:'');if(event.startDate===event.endDate)return start+(event.endTime?(event.startTime?' – ':' 종료 ')+event.endTime:'');return start+' – '+date(event.endDate)+(event.endTime?' '+event.endTime:'');}
export function renderEvent(event,{now=new Date(),detail=false}={}){
 const esc=escapeHtml,state=eventState(event,now);
 return '<article class="sale-card'+(detail?' detail-card':'')+'" id="'+(detail?'detail-':'sale-')+esc(event.id)+'" data-sale-card="'+esc(event.id)+'"><div class="sale-card-meta"><span class="category-label category-'+esc(event.categories[0])+'">'+esc(CATEGORIES[event.categories[0]])+'</span><span class="state-label state-'+state.code+'">'+esc(state.label)+'</span></div><p class="sale-brand">'+esc(event.brandName)+'</p><h3>'+esc(event.title)+'</h3><p class="sale-period"><span aria-hidden="true">▦</span> <time datetime="'+event.startDate+'">'+esc(periodText(event))+'</time><small>'+esc(event.periodNote)+'</small></p><p class="sale-summary">'+esc(event.summary)+'</p><div class="benefit-line"><span>'+esc(BENEFITS[event.benefitType])+'</span><span>'+event.channels.map(c=>esc(CHANNELS[c])).join(' · ')+'</span></div><details class="sale-conditions"'+(detail?' open':'')+'><summary>적용 조건과 확인할 내용</summary><ul>'+event.conditions.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul></details>'+(state.code==='stale'?'<p class="stale-note">마지막 확인 후 '+event.reviewWithinDays+'일이 지났습니다. 새 공지를 확인하기 전 현재 진행 중인 혜택으로 집계하지 않습니다.</p>':'')+'<div class="sale-card-bottom"><p>공지 확인 <time datetime="'+esc(event.checkedAt)+'">'+esc(formatCheckedAt(event.checkedAt))+'</time></p><a class="sale-official" href="'+esc(event.sourceUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(event.brandName+' '+event.title)+' 공식 안내 새 창에서 보기">공식 안내 <span aria-hidden="true">↗</span></a></div></article>';
}
