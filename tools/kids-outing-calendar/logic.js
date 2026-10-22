import { FESTIVALS, DATA_REVIEWED_AT } from './data.js?v=20261023_verified1';
export { DATA_REVIEWED_AT };
export const THEMES = { all: '전체', kids: '체험·문화', nature: '꽃·자연', food: '먹거리·수확', light: '빛·야간' };
export const REGIONS = ['전체', '서울', '경기', '인천', '강원', '대전', '세종', '충북', '충남', '광주', '전북', '전남', '대구', '부산', '울산', '경북', '경남', '제주'];

export function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function koreaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return get('year') + '-' + get('month') + '-' + get('day');
}
export function shiftDate(date, days) {
  const result = new Date(date + 'T00:00:00Z');
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}
export function weekendRange(today) {
  const day = new Date(today + 'T00:00:00Z').getUTCDay();
  const start = shiftDate(today, day === 0 ? -1 : 6 - day);
  return { start, end: shiftDate(start, 1) };
}
export function monthRange(year, month) {
  const prefix = year + '-' + String(month).padStart(2, '0') + '-';
  return { start: prefix + '01', end: prefix + new Date(Date.UTC(year, month, 0)).getUTCDate() };
}
export function occursOn(event, date) {
  if (!isDate(date) || date < event.startDate || date > event.endDate) return false;
  return event.dates ? event.dates.includes(date) : true;
}
export function overlaps(event, start, end) {
  if (event.startDate > end || event.endDate < start) return false;
  return event.dates ? event.dates.some(date => date >= start && date <= end) : true;
}
export function nextDate(event, from) {
  if (event.dates) return event.dates.find(date => date >= from) || event.endDate;
  return event.startDate >= from ? event.startDate : from <= event.endDate ? from : event.endDate;
}
export function eventStatus(event, today) {
  if (event.endDate < today) return '종료';
  if (occursOn(event, today)) return '오늘 일정 있음';
  return '예정';
}
export function isStale(checkedAt, today) {
  return isDate(checkedAt) && today > shiftDate(checkedAt, 7);
}
export function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
export function validateEvent(event) {
  const errors = [];
  if (!event.id || !event.title || !event.location) errors.push('행사 ID·이름·장소 누락');
  if (!isDate(event.startDate) || !isDate(event.endDate) || event.startDate > event.endDate) errors.push('날짜 오류');
  if (!isDate(event.checkedAt) || event.verificationStatus !== 'verified') errors.push('검증 정보 누락');
  if (!REGIONS.includes(event.region) || !THEMES[event.theme]) errors.push('지역·테마 오류');
  if (!['free', 'mixed', 'paid', 'unknown'].includes(event.feeStatus)) errors.push('요금 상태 오류');
  if (!event.sources?.length || event.sources.some(s => !s.publisher || !s.title || !s.facts || !isDate(s.checkedAt) || !safeUrl(s.url))) errors.push('공식 근거 누락');
  if (event.dates && (!event.dates.length || new Set(event.dates).size !== event.dates.length ||
      event.dates.some((d, i) => !isDate(d) || d < event.startDate || d > event.endDate || (i > 0 && d <= event.dates[i - 1])) ||
      event.dates[0] !== event.startDate || event.dates.at(-1) !== event.endDate)) errors.push('개별 운영일 오류');
  return errors;
}
// Validation enforces a record contract; it cannot verify factual truth.
// Editors must read each source. Legacy browser imports are intentionally not used.
export function filterEvents({ start, end, region = '전체', theme = 'all', onlyFree = false, keyword = '', includeEnded = true, today = koreaToday() }, events = FESTIVALS) {
  const words = keyword.trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);
  return events.filter(event => !validateEvent(event).length && overlaps(event, start, end) &&
    (region === '전체' || event.region === region) && (theme === 'all' || event.theme === theme) &&
    (!onlyFree || event.feeStatus === 'free') && (includeEnded || event.endDate >= today) &&
    words.every(word => [event.title, event.location, event.program, event.region].join(' ').toLocaleLowerCase('ko-KR').includes(word)))
    .sort((a, b) => nextDate(a, start).localeCompare(nextDate(b, start)) || a.title.localeCompare(b.title, 'ko'));
}
export const KidsOutingLogic = {
  FESTIVALS_DATA: FESTIVALS,
  getAllFestivals: () => FESTIVALS.filter(event => !validateEvent(event).length),
  searchFestivals({ year, month, ...options }) { return filterEvents({ ...monthRange(year, month), ...options }); },
  getEventsOnDate(date, options = {}) { return filterEvents({ start: date, end: date, ...options }); }
};
