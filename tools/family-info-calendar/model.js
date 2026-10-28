import {FAMILY_EDITORIAL} from '../../assets/js/family-editorial.js';
import {REGION_GROUPS,isDate,koreaToday,shiftDate,safeUrl,escapeHtml} from '../kids-outing-calendar/model.js';
export {REGION_GROUPS,isDate,koreaToday,shiftDate,safeUrl,escapeHtml};
export const DAY_NAMES=['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
export const FEE_LABELS={free:'무료',paid:'유료',mixed:'일부 유료',unknown:'비용 확인 필요'};
export function validateSchedule(schedule){
 const categories=schedule?.categories||[],ids=categories.map(c=>c.id),expected=['kids-programs','local-parenting','family-support','camping-booking','family-culture','kids-popups','brand-sales','family-discounts','festivals'];
 const errors=[];
 if(schedule?.timezone!=='Asia/Seoul'||ids.length!==9||new Set(ids).size!==9||expected.some(id=>!ids.includes(id)))errors.push('9개 항목과 Asia/Seoul 설정을 확인하세요.');
 const slots=categories.map(c=>c.day+':'+c.hour);
 if(new Set(slots).size!==9||categories.some(c=>![0,1,2].includes(c.day)||![8,15,19].includes(c.hour)||![3,4].includes(c.blogDay)))errors.push('일·월·화 9슬롯 또는 수·목 배치 오류');
 if(categories.filter(c=>c.blogDay===3).length!==5||categories.filter(c=>c.blogDay===4).length!==4)errors.push('수요일 5항목·목요일 4항목 배치 오류');
 if(!Number.isInteger(schedule?.researchPolicy?.minimumDetailedNoticesPerCategory)||schedule.researchPolicy.minimumDetailedNoticesPerCategory<15)errors.push('항목별 상세 조사 최소 15건 기준 필요');
 return errors;
}
export function validDateTime(value){return isDate(value)||typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value))&&isDate(value.slice(0,10));}
export function datePart(value){if(!value)return '';return isDate(value)?value:koreaToday(new Date(value));}
export function sameOfficialHost(url,hosts){try{const u=new URL(safeUrl(url));return hosts.some(host=>u.hostname===host);}catch{return false;}}
export function validateRecord(record,{categories,providers,now=new Date()}={}){
 const errors=[],r=record||{},ids=categories.map(c=>c.id),provider=providers.find(p=>p.id===r.providerId);
 if(!/^[a-z0-9][a-z0-9-]{2,160}$/.test(r.id||'')||!r.title||!r.summary)errors.push('ID·제목·요약 필요');
 if(!Array.isArray(r.categoryIds)||!r.categoryIds.length||r.categoryIds.some(id=>!ids.includes(id))||new Set(r.categoryIds).size!==r.categoryIds.length)errors.push('분류 오류');
 if(!provider||!sameOfficialHost(r.canonicalUrl,provider.hosts))errors.push('등록된 공식 상세 출처 필요');
 if(provider&&r.categoryIds?.some(id=>!provider.categoryIds.includes(id)))errors.push('출처의 수집 분야와 불일치');
 if(!['candidate','verified','held'].includes(r.publicationStatus))errors.push('공개 검토 상태 필요');
 if(!validDateTime(r.verifiedAt)||datePart(r.verifiedAt)>koreaToday(now))errors.push('실제 확인일 필요');
 if(!['free','paid','mixed','unknown'].includes(r.feeStatus)||!r.feeText)errors.push('비용 상태와 설명 필요');
 if(!r.region||!['전국','온라인',...REGION_GROUPS.flatMap(g=>g.regions)].includes(r.region))errors.push('원본 지역 오류');
 if(!r.audience||!r.conditions?.length)errors.push('대상과 핵심 조건 필요');
 for(const key of ['applicationStart','applicationEnd','eventStart','eventEnd','bookingStart'])if(r[key]!=null&&!validDateTime(r[key]))errors.push(key+' 날짜 오류');
 for(const [start,end] of [['applicationStart','applicationEnd'],['eventStart','eventEnd']])if(r[start]&&r[end]&&(datePart(r[start])>datePart(r[end])||(!isDate(r[start])&&!isDate(r[end])&&Date.parse(r[start])>Date.parse(r[end]))))errors.push(start+' 기간 역전');
 if(r.applicationMode&&!['ongoing','relative'].includes(r.applicationMode))errors.push('신청 방식 오류');
 if(!r.applicationEnd&&!r.eventEnd&&(!r.applicationMode||!r.applicationNote))errors.push('신청 또는 이용 종료 근거 필요');
 if(r.applicationMode&&!r.applicationNote)errors.push('상시·개인별 신청기한 설명 필요');
 if(r.operatingDates&&(!Array.isArray(r.operatingDates)||!r.operatingDates.length||new Set(r.operatingDates).size!==r.operatingDates.length||r.operatingDates.some(d=>!isDate(d)||!r.eventStart||d<datePart(r.eventStart)||d>datePart(r.eventEnd))))errors.push('실제 운영일 오류');
 if(r.operatingWeekdays&&(!Array.isArray(r.operatingWeekdays)||!r.operatingWeekdays.length||new Set(r.operatingWeekdays).size!==r.operatingWeekdays.length||r.operatingWeekdays.some(d=>!Number.isInteger(d)||d<0||d>6)))errors.push('운영 요일 오류');
 const facts=r.evidence||[];
 if(!facts.length||facts.some(f=>!f.publisher||!f.summary||!Array.isArray(f.fields)||!f.fields.length||!provider||!sameOfficialHost(f.url,provider.hosts)||!validDateTime(f.verifiedAt)||datePart(f.verifiedAt)>koreaToday(now)))errors.push('필드별 공식 근거 필요');
 const required=['title','audience','conditions',...(r.lifecycleStatus==='closed'?['lifecycleStatus']:[]),...(r.applicationMode?['applicationMode','applicationNote']:[]),...['applicationStart','applicationEnd','eventStart','eventEnd','bookingStart','operatingWeekdays'].filter(k=>r[k]!=null),...(r.feeStatus!=='unknown'?['feeText']:[])];
 if(required.some(k=>!facts.some(f=>f.fields?.includes(k))))errors.push('공개 필드의 검증 근거 누락');
 if(r.lifecycleStatus&&!['upcoming','open','closed','ended','cancelled','unknown'].includes(r.lifecycleStatus))errors.push('진행 상태 오류');
 return errors;
}
export function hasPassed(value,now=new Date(),exclusive=false){if(!value)return false;if(isDate(value))return value<koreaToday(now);return exclusive?Date.parse(value)<=now.getTime():Date.parse(value)<now.getTime();}
export function hasStarted(value,now=new Date()){if(!value)return false;return isDate(value)?value<=koreaToday(now):Date.parse(value)<=now.getTime();}
export function recordState(r,now=new Date()){
 if(r.lifecycleStatus==='cancelled')return {code:'cancelled',label:'취소',current:false};
 const effectiveEnd=r.endInclusiveMinute&&!isDate(r.eventEnd)?new Date(Date.parse(r.eventEnd)+60000).toISOString():r.eventEnd;
 if(effectiveEnd&&hasPassed(effectiveEnd,now,r.endExclusive||r.endInclusiveMinute))return {code:'ended',label:'종료',current:false};
 if(r.lifecycleStatus==='closed')return {code:'closed',label:'신청 마감 · 이용일 확인',current:Boolean(r.eventEnd)};
 if(r.applicationEnd&&hasPassed(r.applicationEnd,now))return r.eventEnd?{code:'closed',label:'신청 마감 · 이용일 확인',current:true}:{code:'ended',label:'신청 종료',current:false};
 if(r.applicationStart&&!hasStarted(r.applicationStart,now))return {code:'upcoming',label:'신청 예정',current:true};
 if(r.applicationEnd&&(!r.applicationStart||hasStarted(r.applicationStart,now)))return {code:'open',label:'신청기간 중 · 잔여석 확인',current:true};
 if(r.eventStart&&!hasStarted(r.eventStart,now))return {code:'upcoming',label:r.categoryIds.includes('brand-sales')?'혜택 예정':'이용 예정',current:true};
 if(r.applicationMode&&!r.applicationEnd&&!r.eventEnd)return {code:'unknown',label:r.applicationMode==='ongoing'?'상시 신청 · 자격 확인':'개인별 신청기한 확인',current:true};
 if(r.eventStart)return {code:'open',label:r.categoryIds.includes('brand-sales')?'혜택 기간 중':r.scheduleNote||'이용기간 중 · 운영일 확인',current:true};
 return {code:'unknown',label:'공식 조건 확인',current:true};
}
export function isStaleRecord(r,now=new Date()){const d=datePart(r.verifiedAt);return !d||d>koreaToday(now)||shiftDate(d,7)<koreaToday(now);}
export function inRegion(r,region){return !region||region==='all'||r.region==='전국'||r.region==='온라인'||REGION_GROUPS.find(g=>g.label===region)?.regions.includes(r.region);}
export function operatesOn(r,date){return (!r.operatingDates||r.operatingDates.includes(date))&&(!r.operatingWeekdays||r.operatingWeekdays.includes(new Date(date+'T00:00:00Z').getUTCDay()));}
function occursInRange(r,from,to){if(!r.operatingDates&&!r.operatingWeekdays)return true;const start=[datePart(r.eventStart),from].filter(Boolean).sort().at(-1),end=[datePart(r.eventEnd),to].filter(Boolean).sort()[0];if(!start||!end)return false;for(let day=start;day<=end;day=shiftDate(day,1))if(operatesOn(r,day))return true;return false;}
export function filterRecords(records,filters={},now=new Date()){
 const {category='all',region='all',onlyFree=false,status='all',calendar='all',from='',to='',includeEnded=false,age='all'}=filters;
 return records.filter(r=>{
  if(r.publicationStatus!=='verified'||category!=='all'&&!r.categoryIds.includes(category)||!inRegion(r,region)||onlyFree&&r.feeStatus!=='free'||age!=='all'&&!r.ageGroups?.includes(age))return false;
  const state=recordState(r,now);if(!includeEnded&&!state.current)return false;
  if(status==='open'&&(state.code!=='open'||!r.applicationEnd||isStaleRecord(r,now)))return false;
  if(status==='closing'&&(state.code==='closed'||!r.applicationEnd||hasPassed(r.applicationEnd,now)||datePart(r.applicationEnd)>shiftDate(koreaToday(now),7)||isStaleRecord(r,now)))return false;
  if(status==='upcoming'&&state.code!=='upcoming')return false;
  const ranges=calendar==='application'?[[r.applicationStart||r.bookingStart,r.applicationEnd||r.bookingStart,false]]:calendar==='event'?[[r.eventStart,r.eventEnd,true]]:[[r.applicationStart||r.bookingStart,r.applicationEnd||r.bookingStart,false],[r.eventStart,r.eventEnd,true]];
  if(calendar!=='all'&&!ranges.some(([a,b])=>a||b))return false;
  if((from||to)&&!ranges.some(([a,b,eventRange])=>(a||b)&&(!to||datePart(a||b)<=to)&&(!from||datePart(b||a)>=from)&&(!eventRange||occursInRange(r,from,to))))return false;
  return true;
 });
}
export function datesForDay(r,date,type='all'){
 const hits=[];
 if(type!=='event'&&(r.applicationStart||r.applicationEnd||r.bookingStart)){const a=datePart(r.applicationStart||r.bookingStart||r.applicationEnd),b=datePart(r.applicationEnd||r.applicationStart||r.bookingStart);if(a<=date&&b>=date)hits.push('신청');}
 if(type!=='application'&&r.eventStart&&datePart(r.eventStart)<=date&&datePart(r.eventEnd)>=date&&operatesOn(r,date))hits.push(r.categoryIds.includes('brand-sales')?'혜택':'이용');
 return hits;
}
export function periodText(start,end){if(!start&&!end)return '공식 공지에서 확인';const fmt=v=>isDate(v)?v:new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));return start&&end?fmt(start)+' ~ '+fmt(end):start?fmt(start)+' 시작':fmt(end)+' 마감';}
export function renderRecord(r,categories,now=new Date()){
 const e=escapeHtml,state=recordState(r,now),stale=isStaleRecord(r,now),category=categories.find(c=>r.categoryIds.includes(c.id));
 return `<article class="info-card" id="${e(r.id)}"><div class="info-card-top"><span class="info-category">${e(category?.shortName||'가족 정보')}</span><span class="info-state state-${state.code}">${e(state.label)}</span></div><p class="info-location">${e([r.region,r.location].filter(Boolean).join(' · '))}</p><h3>${e(r.title)}</h3><p class="info-summary">${e(r.summary)}</p><dl><div><dt>대상</dt><dd>${e(r.audience)}</dd></div>${r.applicationStart||r.applicationEnd||r.bookingStart?`<div><dt>신청</dt><dd>${e(periodText(r.applicationStart||r.bookingStart,r.applicationEnd))}</dd></div>`:''}${r.applicationNote?`<div><dt>신청 안내</dt><dd>${e(r.applicationNote)}</dd></div>`:''}${r.eventStart?`<div><dt>${r.categoryIds.includes('brand-sales')?'혜택':'이용'}</dt><dd>${e(periodText(r.eventStart,r.eventEnd))}${r.scheduleNote?`<small>${e(r.scheduleNote)}</small>`:''}</dd></div>`:''}<div><dt>비용</dt><dd><span class="fee-label">${FEE_LABELS[r.feeStatus]}</span> ${e(r.feeText)}</dd></div></dl><details><summary>신청·이용 조건 살펴보기</summary><ul>${r.conditions.map(c=>`<li>${e(c)}</li>`).join('')}</ul></details>${stale?'<p class="stale-note">마지막 확인 후 7일이 지났습니다. 최신 조건을 다시 확인해 주세요.</p>':''}<footer>${FAMILY_EDITORIAL[r.id]?`<a href="/guides/${FAMILY_EDITORIAL[r.id]}/">예약·이용 상세 가이드 ↗</a>`:''}<span>원문 확인 <time datetime="${e(r.verifiedAt)}">${e(datePart(r.verifiedAt))}</time></span><a href="${e(r.canonicalUrl)}" target="_blank" rel="noopener noreferrer">공식 안내 ↗</a>${r.location&&!['전국','온라인'].includes(r.region)?`<a href="https://map.naver.com/p/search/${encodeURIComponent(r.location)}" target="_blank" rel="noopener noreferrer">지도 ↗</a>`:''}</footer></article>`;
}
