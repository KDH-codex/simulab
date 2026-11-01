export const THEMES = { all: '전체', kids: '체험·문화', nature: '꽃·자연', food: '먹거리·수확', light: '빛·야간' };
export const REGIONS = ['전체', '서울', '경기', '인천', '강원', '대전', '세종', '충북', '충남', '광주', '전북', '전남', '대구', '부산', '울산', '경북', '경남', '제주'];
// Keep source records and API mappings in their original 17 regions.
export const REGION_GROUPS = [
  { label: '서울', regions: ['서울'] },
  { label: '경기지역', regions: ['경기', '인천'] },
  { label: '강원지역', regions: ['강원'] },
  { label: '충청지역', regions: ['대전', '세종', '충북', '충남'] },
  { label: '전라지역', regions: ['광주', '전북', '전남'] },
  { label: '경상지역', regions: ['대구', '부산', '울산', '경북', '경남'] },
  { label: '제주지역', regions: ['제주'] }
];
export const SEARCH_REGIONS = ['전체', ...REGION_GROUPS.map(group => group.label)];
export function normalizeSearchRegion(value) {
  if (value === '전체' || value === '전국') return '전체';
  return REGION_GROUPS.find(group => group.label === value || group.regions.includes(value))?.label || '';
}
export function sourcesForRegionGroup(value, registry) {
  const group = REGION_GROUPS.find(group => group.label === normalizeSearchRegion(value));
  if (!group) return [];
  const seen = new Set();
  return registry.filter(row => group.regions.includes(row.region)).flatMap(row =>
    row.sources.filter(source => {
      const key = row.region + ':' + source.url;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map(source => ({ ...source, region: row.region })));
}

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
  if (event.publicationStatus === 'cancelled') return '취소';
  if (event.endDate < today) return '종료';
  if (occursOn(event, today)) return event.scheduleType === 'period' ? '개최기간 중 · 운영일 확인' : '오늘 일정 있음';
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
export function validateEvent(event, { today = koreaToday() } = {}) {
  const errors = [];
  if (!event || typeof event !== 'object') return ['행사 객체 오류'];
  if (!event.id || !event.title || !event.location) errors.push('행사 ID·이름·장소 누락');
  if (!isDate(event.startDate) || !isDate(event.endDate) || event.startDate > event.endDate) errors.push('날짜 오류');
  if (!isDate(event.checkedAt) || event.verificationStatus !== 'verified') errors.push('검증 정보 누락');
  if (event.checkedAt > today || (Array.isArray(event.sources) && event.sources.some(s => s?.checkedAt > today))) errors.push('미래 확인일');
  if (event.scheduleType && !['period', 'continuous', 'dates'].includes(event.scheduleType)) errors.push('운영일 유형 오류');
  if (event.scheduleType === 'dates' && !event.dates) errors.push('개별 운영일 누락');
  if (event.scheduleType === 'period' && !event.scheduleNote) errors.push('기간 정보 안내 누락');
  if (event.publicationStatus && !['published', 'cancelled'].includes(event.publicationStatus)) errors.push('게시 상태 오류');
  if (!REGIONS.includes(event.region) || !THEMES[event.theme]) errors.push('지역·테마 오류');
  if (!['free', 'mixed', 'paid', 'unknown'].includes(event.feeStatus)) errors.push('요금 상태 오류');
  if (!Array.isArray(event.sources) || !event.sources.length || event.sources.some(s => !s || !s.publisher || !s.title || !s.facts || !isDate(s.checkedAt) || !safeUrl(s.url))) errors.push('공식 근거 누락');
  if (event.dates && (!event.dates.length || new Set(event.dates).size !== event.dates.length ||
      event.dates.some((d, i) => !isDate(d) || d < event.startDate || d > event.endDate || (i > 0 && d <= event.dates[i - 1])) ||
      event.dates[0] !== event.startDate || event.dates.at(-1) !== event.endDate)) errors.push('개별 운영일 오류');
  return errors;
}

export function coverageForRange(events, start, end, today = koreaToday(), {includeEnded=false}={}) {
  const valid = events.filter(e => !validateEvent(e, {today}).length && e.publicationStatus !== 'cancelled');
  return REGIONS.slice(1).map(region => {
    const regional = valid.filter(e => e.region === region);
    const inRange = regional.filter(e => (includeEnded || e.endDate >= today) && overlaps(e, start, end));
    const upcoming = regional.filter(e => overlaps(e, today, shiftDate(today, 60)));
    return {region, count:inRange.length, upcomingCount:upcoming.length,
      freshCount:inRange.filter(e => !isStale(e.checkedAt,today)).length,
      nextDate:regional.filter(e=>nextDate(e,today)>end).map(e=>nextDate(e,today)).sort()[0] || null};
  });
}

export function groupedCoverageForRange(events, start, end, today = koreaToday(), options = {}) {
  const coverage = coverageForRange(events, start, end, today, options);
  return REGION_GROUPS.map(group => {
    const rows = coverage.filter(row => group.regions.includes(row.region));
    const sum = key => rows.reduce((total, row) => total + row[key], 0);
    return { region: group.label, count: sum('count'), upcomingCount: sum('upcomingCount'),
      freshCount: sum('freshCount'), nextDate: rows.map(row => row.nextDate).filter(Boolean).sort()[0] || null };
  });
}

export function normalizedTitle(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/(?:19|20)\d{2}년?/g,'').replace(/제\s*\d+\s*회/g,'').replace(/[^\p{L}\p{N}]/gu,'');
}

export function duplicateRecord(a,b) {
  const place=v=>String(v||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
  return a.region===b.region && normalizedTitle(a.title)===normalizedTitle(b.title) && a.startDate===b.startDate && a.endDate===b.endDate &&
    Boolean(a.location && b.location && place(a.location)===place(b.location));
}

export function selectAcrossRegions(events, limit = 3) {
  const selected=[], regions=new Set();
  for(const event of events)if(!regions.has(event.region)&&selected.length<limit){selected.push(event);regions.add(event.region);}
  for(const event of events)if(selected.length<limit&&!selected.includes(event))selected.push(event);
  return selected;
}
// Validation enforces a record contract; it cannot verify factual truth.
// Editors must read each source. Legacy browser imports are intentionally not used.
export function filterEvents({ start, end, region = '전체', theme = 'all', onlyFree = false, keyword = '', includeEnded = true, today = koreaToday() }, events = []) {
  const words = keyword.trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);
  const selectedRegion = normalizeSearchRegion(region);
  return events.filter(event => !validateEvent(event, {today}).length && event.publicationStatus !== 'cancelled' && overlaps(event, start, end) &&
    (selectedRegion === '전체' || (selectedRegion && normalizeSearchRegion(event.region) === selectedRegion)) && (theme === 'all' || event.theme === theme) &&
    (!onlyFree || event.feeStatus === 'free') && (includeEnded || event.endDate >= today) &&
    words.every(word => [event.title, event.location, event.program, event.region].join(' ').toLocaleLowerCase('ko-KR').includes(word)))
    .sort((a, b) => nextDate(a, start).localeCompare(nextDate(b, start)) || a.title.localeCompare(b.title, 'ko'));
}
