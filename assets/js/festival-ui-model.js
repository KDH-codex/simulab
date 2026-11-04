import {shiftDate, overlaps, occursOn} from '../../tools/kids-outing-calendar/model.js';

export const THEME_WORDS={light:'빛·야간',food:'먹거리·수확',nature:'꽃·자연',kids:'체험·문화'};
export function eventTags(event) {
  const text=[event.title,event.program].join(' ');
  const words=['불꽃','드론','국화','정원','라면','김장','사과','걷기','한글','캠프닉','미디어아트','문화유산','체험','공연','나이트','야경','꽃','웹툰'];
  const hits=words.filter(word=>text.includes(word)&&!(word==='꽃'&&event.theme!=='nature'));
  return [...new Set([...hits,event.region,THEME_WORDS[event.theme]].filter(Boolean))].slice(0,4);
}
export function matchesKeyword(event,keyword) {
  return !keyword||[event.title,event.program,event.location,event.region,THEME_WORDS[event.theme]].join(' ').toLocaleLowerCase('ko').includes(keyword.toLocaleLowerCase('ko'));
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
