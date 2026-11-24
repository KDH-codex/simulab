import {shiftDate, overlaps, occursOn, weekendRange, nextDate} from '../../tools/kids-outing-calendar/model.js';
import {EVENT_LOCALES} from './festival-event-locales.js';

export const THEME_WORDS={light:'빛·야간',food:'먹거리·수확',nature:'꽃·자연',kids:'체험·문화'};

// 겨울철·상황별로 자주 찾는 빠른 필터 목록 (화면 버튼과 URL ?preset= 에서 함께 사용)
export const QUICK_PRESETS=[
  ['indoor','🏛 실내·전시관'],
  ['ending','⏳ 이번 주 마감'],
  ['booking','📝 사전신청 안내']
];
export const PRESET_LABELS=Object.fromEntries(QUICK_PRESETS);

// 박물관·과학관·전시관 등 비·추위를 피할 수 있는 실내 장소 판별 정규식
const INDOOR_VENUE_PATTERN=/박물관|미술관|과학관|전시관|코엑스|킨텍스|벡스코|엑스코|컨벤션|아트센터|문화회관|도서관|실내|홀|백화점|아울렛|체육관|공연장|극장/;

// 사전예약·사전신청이 필요한 안내인지 판별하는 정규식 (예약 불필요 문구는 제외)
const ADVANCE_BOOKING_PATTERN=/사전\s*신청|사전\s*예약|온라인\s*신청|온라인\s*예약|예매|접수/;
const NO_BOOKING_PATTERN=/사전\s*예약\s*없음|별도\s*예약\s*없이|예약\s*불필요|예약\s*없이|예약\s*방법\s*확인\s*필요/;

/**
 * 행사의 장소명·제목·프로그램 설명에 실내 시설 키워드가 포함되어 있는지 확인합니다.
 */
export function isIndoorVenue(event) {
  const text=[event.location,event.title,event.program].filter(Boolean).join(' ');
  return INDOOR_VENUE_PATTERN.test(text);
}

/**
 * 한국시간 기준 '오늘'이 속한 주간의 일요일 날짜(YYYY-MM-DD)를 계산합니다.
 */
export function endingCutoffDate(today) {
  return weekendRange(today).end;
}

/**
 * 행사가 취소되지 않았고 오늘부터 이번 주 일요일 사이에 종료되는지 확인합니다.
 */
export function isEndingThisWeek(event,today) {
  return Boolean(today&&event.publicationStatus!=='cancelled'&&event.endDate>=today&&event.endDate<=endingCutoffDate(today));
}

/**
 * 사전신청·온라인 예약·예매 안내가 있는 행사인지 판별합니다.
 */
export function hasAdvanceBooking(event) {
  const text=event.booking||'';
  return Boolean(text&&!NO_BOOKING_PATTERN.test(text)&&ADVANCE_BOOKING_PATTERN.test(text));
}

/**
 * 선택된 빠른 조건(preset)에 행사가 부합하는지 검사합니다.
 */
export function matchesPreset(event,preset,today) {
  if(!preset)return true;
  if(preset==='indoor')return isIndoorVenue(event);
  if(preset==='ending')return isEndingThisWeek(event,today);
  if(preset==='booking')return hasAdvanceBooking(event);
  return true;
}

/**
 * 이번 주 일요일까지 종료되는 행사만 추려 종료일순 → 시작일순 → 제목순으로 정렬합니다.
 */
export function endingThisWeekEvents(events,today) {
  return events
    .filter(e=>isEndingThisWeek(e,today))
    .sort((a,b)=>a.endDate.localeCompare(b.endDate)||a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title,'ko'));
}

// 홈 상단 '스마트 주말 컨시어지'에서 제공하는 4가지 핵심 나들이 테마 모드
export const CONCIERGE_MODES=[
  ['indoor','🏛 추위 걱정 없는 실내·전시','비·추위 걱정 없이 박물관·과학관·전시관에서 즐기는 일정입니다.'],
  ['free','💸 입장 무료 알짜 나들이','입장·기본참여 무료로 확인된 부담 없는 나들이 일정입니다.'],
  ['night','✨ 겨울밤 빛축제·마켓','저녁 시간대 조명·야경·겨울 마켓 분위기를 즐길 수 있는 일정입니다.'],
  ['ending','⏳ 이번 일요일 마감 임박','이번 주 일요일을 끝으로 막을 내리는 놓치기 아쉬운 일정입니다.']
];

/**
 * 선택한 컨시어지 모드에 맞는 활성 행사 3선을 선별합니다. (고유 사진 보유 행사 우선)
 */
export function conciergePicksFor(events,mode='indoor',today) {
  const horizon=shiftDate(today,60);
  const pool=events.filter(e=>e.publicationStatus!=='cancelled'&&e.endDate>=today&&e.startDate<=horizon);
  const matched=pool.filter(e=>{
    if(mode==='free')return e.feeStatus==='free';
    if(mode==='night')return e.theme==='light';
    if(mode==='ending')return isEndingThisWeek(e,today);
    return isIndoorVenue(e);
  }).sort((a,b)=>{
    const imgDiff=Number(Boolean(b.image))-Number(Boolean(a.image));
    if(imgDiff!==0)return imgDiff;
    if(mode==='ending'){
      const endDiff=a.endDate.localeCompare(b.endDate);
      if(endDiff!==0)return endDiff;
    }
    return nextDate(a,today).localeCompare(nextDate(b,today))||a.title.localeCompare(b.title,'ko');
  });
  return {mode,total:matched.length,picks:matched.slice(0,3)};
}

/**
 * URL ?picks= 파라미터에서 유효한 행사 ID만 안전하게 최대 6개까지 파싱합니다.
 */
export function parseSharedPicks(raw,validIds) {
  const valid=validIds instanceof Set?validIds:new Set(Object.keys(validIds||{}));
  const out=[];
  for(const part of String(raw||'').split(',')){
    const id=part.trim();
    if(/^[a-z0-9-]+$/.test(id)&&valid.has(id)&&!out.includes(id))out.push(id);
    if(out.length>=6)break;
  }
  return out;
}

/**
 * 일행과 함께 볼 수 있는 비교 보드 공유 URL을 생성합니다.
 */
export function buildSharedPicksURL(ids,origin='https://simulab.kr',locale='ko') {
  const clean=[...new Set((ids||[]).filter(id=>typeof id==='string'&&/^[a-z0-9-]+$/.test(id)))].slice(0,6);
  const url=new URL('/',origin);
  if(clean.length){
    url.searchParams.set('picks',clean.join(','));
    url.hash='#shared-picks-board';
  }
  if(locale&&locale!=='ko')url.searchParams.set('lang',locale);
  return url.href;
}

/**
 * 캘린더 등록 시 장기 축제가 달력을 도배하지 않도록 대표 날짜 범위를 계산합니다.
 */
export function calendarDatesFor(event,today=event.startDate) {
  let start=event.startDate;
  let end=event.endDate;
  if(Array.isArray(event.dates)&&event.dates.length){
    const next=event.dates.find(d=>d>=today)||event.dates[0];
    start=next;end=next;
  }else{
    const spanDays=Math.round((new Date(event.endDate+'T00:00:00Z')-new Date(event.startDate+'T00:00:00Z'))/86400000);
    if(spanDays>7){
      const first=event.startDate>today?event.startDate:today;
      start=first;end=first;
    }
  }
  return {start,end,startCompact:start.replaceAll('-',''),endExclusiveCompact:shiftDate(end,1).replaceAll('-','')};
}

/**
 * Google 캘린더에 일정을 바로 추가하는 링크를 만듭니다.
 */
export function googleCalendarUrl(event,today=event.startDate) {
  const {startCompact,endExclusiveCompact}=calendarDatesFor(event,today);
  const url=new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action','TEMPLATE');
  url.searchParams.set('text',event.title);
  url.searchParams.set('dates',startCompact+'/'+endExclusiveCompact);
  url.searchParams.set('location',[event.region,event.location].filter(Boolean).join(' '));
  url.searchParams.set('details',[
    '[이번주 축제] '+(event.program||''),
    '운영 시간: '+(event.time||'공식 안내 확인'),
    '비용: '+(event.fee||'상세 안내 확인'),
    '상세 및 공식 출처: https://simulab.kr/events/'+encodeURIComponent(event.id)+'/'
  ].join('\n'));
  return url.href;
}

const escapeIcsText=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');

/**
 * 아이폰·갤럭시 기본 캘린더 앱에서 바로 열리는 표준 .ics 파일 내용을 생성합니다.
 */
export function icsContent(event,today=event.startDate) {
  const {startCompact,endExclusiveCompact}=calendarDatesFor(event,today);
  const detailUrl='https://simulab.kr/events/'+encodeURIComponent(event.id)+'/';
  const description=[
    event.program||'',
    '운영 시간: '+(event.time||'공식 안내 확인'),
    '비용: '+(event.fee||'상세 안내 확인'),
    '상세 안내: '+detailUrl
  ].join('\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SimuLab//ThisWeekFestival//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:'+event.id+'@simulab.kr',
    'DTSTAMP:'+today.replaceAll('-','')+'T000000Z',
    'DTSTART;VALUE=DATE:'+startCompact,
    'DTEND;VALUE=DATE:'+endExclusiveCompact,
    'SUMMARY:'+escapeIcsText(event.title),
    'LOCATION:'+escapeIcsText([event.region,event.location].filter(Boolean).join(' ')),
    'DESCRIPTION:'+escapeIcsText(description),
    'URL:'+detailUrl,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * 상세 페이지 하단에 연결할 같은 권역·같은 테마 추천 축제를 중복 없이 최대 3건씩 고릅니다.
 */
export function relatedEventsFor(target,pool,getGroup) {
  const others=pool.filter(e=>e.id!==target.id&&e.publicationStatus!=='cancelled');
  const targetGroup=getGroup(target);
  const sameRegion=others.filter(e=>getGroup(e)===targetGroup).slice(0,3);
  const seen=new Set(sameRegion.map(e=>e.id));
  const sameTheme=others.filter(e=>!seen.has(e.id)&&e.theme===target.theme).slice(0,3);
  return {sameRegion,sameTheme};
}

export function eventTags(event) {
  const text=[event.title,event.program].join(' ');
  const words=['불꽃','드론','국화','정원','라면','김장','사과','걷기','한글','캠프닉','미디어아트','문화유산','체험','공연','나이트','야경','꽃','웹툰'];
  const hits=words.filter(word=>text.includes(word)&&!(word==='꽃'&&event.theme!=='nature'));
  return [...new Set([...hits,event.region,THEME_WORDS[event.theme]].filter(Boolean))].slice(0,4);
}
export function matchesKeyword(event,keyword) {
  return !keyword||[event.title,event.program,event.location,event.region,THEME_WORDS[event.theme],...(EVENT_LOCALES[event.id]?.titles||[])].join(' ').toLocaleLowerCase('ko').includes(keyword.toLocaleLowerCase('ko'));
}
export function weekRangeFor(date) {
  const start=shiftDate(date,-new Date(date+'T00:00:00Z').getUTCDay());
  return {start,end:shiftDate(start,6)};
}
export function weekDays(start) {return Array.from({length:7},(_,i)=>shiftDate(start,i));}
export function weeklyEvents(events,start) {
  return events.filter(e=>e.publicationStatus!=='cancelled'&&overlaps(e,start,shiftDate(start,6)));
}
export function eventsForDay(events,date) {
  return events.filter(e=>e.publicationStatus!=='cancelled'&&occursOn(e,date));
}
export function dayMilestone(event,date) {
  if(event.startDate===date&&event.endDate===date)return '하루 일정';
  if(event.startDate===date)return '시작';
  if(event.endDate===date)return '종료';
  return event.scheduleType==='period'?'운영일 확인':'운영일';
}
export function toggleDaySelection(current,date,{view='month',weekStart}={}) {
  return view==='week'&&current?.start===date&&current?.end===date
    ?{start:weekStart,end:shiftDate(weekStart,6)}:{start:date,end:date};
}
