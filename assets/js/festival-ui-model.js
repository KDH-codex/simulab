import {shiftDate, overlaps, occursOn, weekendRange, nextDate} from '../../tools/kids-outing-calendar/model.js';
import {EVENT_LOCALES} from './festival-event-locales.js';

export const THEME_WORDS={light:'빛·야간',food:'먹거리·수확',nature:'꽃·자연',kids:'체험·문화'};

// 홈·탐색 화면에서 축제·전시·실내 체험을 명확히 구분해 보여주기 위한 3대 대분류 정의
export const EVENT_CATEGORIES=[
  ['festival','🎪 야외·지역 축제','빛축제·겨울·먹거리·지역 대표 축제와 야외 행사'],
  ['exhibition','🖼️ 전시·박람회','박물관·미술관 특별전, 기획전, 사진전, 비엔날레·박람회'],
  ['indoor','🏛 실내 체험·기관','과학관·박물관 체험, 공연, 도서관·문화회관·실내 기관 이벤트']
];
export const CATEGORY_LABELS=Object.fromEntries(EVENT_CATEGORIES.map(([id,label])=>[id,label]));

// 겨울철·상황별로 자주 찾는 빠른 필터 목록 (화면 버튼과 URL ?preset= 에서 함께 사용)
export const QUICK_PRESETS=[
  ['indoor','🏛 실내·전시관'],
  ['ending','⏳ 이번 주 마감'],
  ['booking','📝 사전신청 안내']
];
export const PRESET_LABELS=Object.fromEntries(QUICK_PRESETS);

// 박물관·과학관·전시관 등 비·추위를 피할 수 있는 실내 장소 판별 정규식
const INDOOR_VENUE_PATTERN=/박물관|미술관|과학관|전시관|코엑스|킨텍스|벡스코|엑스코|유에코|컨벤션|아트센터|문화회관|예술의전당|도서관|실내|홀|백화점|아울렛|체육관|공연장|극장|온실|생물자원관|SETEC|상상플랫폼|CGV|창의예술|교육센터|아트플랫폼|전시장|어린이세상|해양과학관|생태원|아트벙커/;
const OUTDOOR_FESTIVAL_PATTERN=/얼음낚시|송어축제|산천어|철새|해맞이|일출|타종|호수공원|유림공원|차\s*없는\s*거리|불꽃축제|얼음트레킹/;
const EXHIBITION_TITLE_PATTERN=/특별전|기획전|사진전|미술전|열린전시|전시|비엔날레|트리엔날레|오픈\s*스튜디오|아트쇼|박람회|페어|엑스포|전람회|작품전|명작전|교류전|어린왕자|피카소|달구벌|제석사|마한|김영갑|물신|MATERIALISM/i;
const FESTIVAL_TITLE_PATTERN=/빛축제|불빛|눈꽃|산천어|송어|빙어|얼음|스케이트|일출|해맞이|타종|김장|불꽃/;

// 사전예약·사전신청이 필요한 안내인지 판별하는 정규식 (예약 불필요 문구는 제외)
const ADVANCE_BOOKING_PATTERN=/사전\s*신청|사전\s*예약|온라인\s*신청|온라인\s*예약|예매|접수/;
const NO_BOOKING_PATTERN=/사전\s*예약\s*없음|별도\s*예약\s*없이|예약\s*불필요|예약\s*없이|예약\s*방법\s*확인\s*필요/;

/**
 * 행사의 장소명·제목·프로그램 설명에 실내 시설 키워드가 포함되어 있는지 확인합니다.
 * 정본 데이터에 boolean `indoor` 필드가 있으면 이를 최우선으로 사용합니다.
 */
export function isIndoorVenue(event) {
  if(typeof event?.indoor==='boolean')return event.indoor;
  const title=String(event?.title||'');
  if(OUTDOOR_FESTIVAL_PATTERN.test(title))return false;
  const text=[event?.location,event?.title,event?.program].filter(Boolean).join(' ');
  return INDOOR_VENUE_PATTERN.test(text);
}

/**
 * 행사 레코드를 'festival'(야외·지역 축제), 'exhibition'(전시·박람회), 'indoor'(실내 체험·기관)로 분류합니다.
 */
export function eventCategoryOf(event) {
  if(event?.eventCategory==='festival'||event?.eventCategory==='exhibition'||event?.eventCategory==='indoor'){
    return event.eventCategory;
  }
  const title=String(event?.title||'');
  if(EXHIBITION_TITLE_PATTERN.test(title)&&!FESTIVAL_TITLE_PATTERN.test(title))return 'exhibition';
  if(isIndoorVenue(event))return 'indoor';
  return 'festival';
}

/**
 * 선택한 대분류('all' | 'festival' | 'exhibition' | 'indoor')와 행사 분류가 일치하는지 확인합니다.
 */
export function matchesCategory(event,category) {
  return !category||category==='all'||eventCategoryOf(event)===category;
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

/**
 * 7개 권역별 SEO 전용 랜딩 페이지(/region/{slug}/) 메타데이터 정의입니다.
 */
export const REGION_SEO_PAGES=[
  {slug:'seoul',label:'서울',shortLabel:'서울',regions:['서울'],areaKeys:['seoul','gyeonggi'],title:'이번 주 서울 축제·전시 | 주말 가볼 만한 곳',description:'서울 도심 축제·박물관·야간 빛축제·겨울 마켓 일정을 운영일·입장료·예약 조건과 함께 한곳에서 확인하세요.'},
  {slug:'gyeonggi',label:'경기지역',shortLabel:'경기·인천',regions:['경기','인천'],areaKeys:['gyeonggi','seoul'],title:'경기·인천 축제·행사 | 수도권 주말 나들이 모음',description:'경기·인천의 주말 축제, 야간 불빛정원, 수목원·과학관 전시와 반려동물·먹거리 행사를 한눈에 살펴보세요.'},
  {slug:'gangwon',label:'강원지역',shortLabel:'강원',regions:['강원'],areaKeys:[],title:'강원 겨울·지역 축제 | 춘천·강릉·평창·홍천 가볼 만한 곳',description:'강원의 겨울 빛·공예 전시·눈꽃·송어·연말 해맞이 축제 일정과 운영시간·요금 안내를 확인하세요.'},
  {slug:'chungcheong',label:'충청지역',shortLabel:'대전·세종·충청',regions:['대전','세종','충북','충남'],areaKeys:['chungcheong'],title:'대전·세종·충청 축제·전시 | 주말 가족 나들이',description:'대전·세종·충북·충남의 겨울 크리스마스 축제, 수목원·생태원·박물관 특별전과 먹거리 행사 모음입니다.'},
  {slug:'jeolla',label:'전라지역',shortLabel:'광주·전라',regions:['광주','전북','전남'],areaKeys:[],title:'광주·전라 축제·전시 | 전주·나주·익산·여수 가볼 만한 곳',description:'광주·전북·전남의 김장·주류·빛축제, 국립박물관 특별전과 해맞이 명소 일정을 확인하세요.'},
  {slug:'gyeongsang',label:'경상지역',shortLabel:'부산·대구·울산·경상',regions:['대구','부산','울산','경북','경남'],areaKeys:['gyeongsang'],title:'부산·대구·울산·경상 축제·전시 | 영남 주말 나들이',description:'부산·대구·울산·경북·경남의 해운대 빛축제, 크리스마스 마켓·트리축제, 과학관·미술관·수목원 전시 안내입니다.'},
  {slug:'jeju',label:'제주지역',shortLabel:'제주',regions:['제주'],areaKeys:[],title:'제주 축제·전시 | 겨울 동백·크리스마스·일출 여행 일정',description:'제주 크리스마스 빌리지, 겨울꽃 축제, 국립제주박물관 사진전과 성산 일출 일정을 공식 출처로 확인하세요.'}
];

const WINTER_SEASON_PATTERN=/겨울|윈터|눈꽃|얼음|빙어|송어|산천어|눈썰매|스케이트|빛축제|불빛|일루미|트리|크리스마스|성탄|산타|제야|타종|해맞이|해넘이|일출|송년|연말|온실/;

/**
 * 12월 이후까지 이어지는 겨울·연말·빛·눈·해맞이·동절기 실내 특별전 행사인지 판별합니다.
 */
export function isWinterSeasonEvent(event) {
  if(!event||event.publicationStatus==='cancelled'||event.endDate<'2026-12-01')return false;
  const text=[event.title,event.program,event.location].filter(Boolean).join(' ');
  return event.theme==='light'||WINTER_SEASON_PATTERN.test(text);
}

/**
 * 축제 권역과 겹치거나 전국에서 바로 이용 가능한 진행 중 할인 행사를 브랜드 중복 없이 최대 limit건 고릅니다.
 */
export function nearbyDealsForEvent(event,activeDeals,getGroup,limit=3) {
  if(!event||!Array.isArray(activeDeals)||!activeDeals.length)return [];
  const group=typeof getGroup==='function'?getGroup(event):event.region;
  const meta=REGION_SEO_PAGES.find(p=>p.label===group||p.regions.includes(event.region));
  const areaKeys=meta?.areaKeys||[];
  const local=areaKeys.length?activeDeals.filter(d=>areaKeys.includes(d.shopping?.area)):[];
  const nationwide=activeDeals.filter(d=>d.shopping?.area==='nationwide');
  const seen=new Set();const picked=[];
  for(const deal of [...local,...nationwide]){
    if(seen.has(deal.brandId))continue;
    seen.add(deal.brandId);
    picked.push(deal);
    if(picked.length>=limit)break;
  }
  return picked;
}

/**
 * 선택한 비교 후보들을 카카오톡·블로그 등에 바로 붙여넣기 좋은 일정 요약 텍스트로 변환합니다.
 */
export function formatCourseSummaryText(items,shareUrl,today='') {
  if(!Array.isArray(items)||!items.length)return '';
  const feeNames={free:'입장·기본참여 무료',mixed:'일부 유료',paid:'유료',unknown:'요금 확인 필요'};
  const lines=['📅 [이번주 축제] 나들이 추천 코스 ('+items.length+'곳)'];
  if(today)lines.push('기준일: '+today+' KST');
  lines.push('');
  items.forEach((e,i)=>{
    const dates=e.startDate===e.endDate?e.startDate:e.startDate+' ~ '+e.endDate;
    const indoor=isIndoorVenue(e)?' · 🏛 실내 시설':'';
    const feeText=e.fee||feeNames[e.feeStatus]||'요금 확인 필요';
    lines.push((i+1)+'. ['+e.region+'] '+e.title);
    lines.push('   · 일정: '+dates+indoor);
    lines.push('   · 장소: '+e.location);
    lines.push('   · 비용: '+feeText);
  });
  if(shareUrl){lines.push('');lines.push('👉 한눈에 비교하기: '+shareUrl);}
  return lines.join('\n');
}
