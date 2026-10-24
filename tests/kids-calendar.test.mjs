import test from 'node:test';
import assert from 'node:assert/strict';
import { FESTIVALS } from '../tools/kids-outing-calendar/data.js';
import { validateEvent, occursOn, filterEvents, monthRange, koreaToday, weekendRange, isDate, isStale, safeUrl, escapeHtml, REGIONS, REGION_GROUPS, SEARCH_REGIONS, normalizeSearchRegion, coverageForRange, groupedCoverageForRange, sourcesForRegionGroup, REGION_SOURCES } from '../tools/kids-outing-calendar/logic.js';

test('every published record has dated evidence, valid dates, a unique id and HTTPS sources', () => {
  assert.equal(new Set(FESTIVALS.map(e => e.id)).size, FESTIVALS.length);
  for (const event of FESTIVALS) assert.deepEqual(validateEvent(event), [], event.id);
});
test('Namsan appears only on its seven actual operating dates', () => {
  const event = FESTIVALS.find(e => e.id === 'namsan-night-2026');
  for (const date of event.dates) assert.equal(occursOn(event, date), true);
  for (const date of ['2026-10-25', '2026-10-29', '2026-11-08', '2026-11-13']) {
    assert.equal(occursOn(event, date), false);
    assert.ok(!filterEvents({ start: date, end: date }).some(e => e.id === event.id));
  }
});
test('corrected BBQ and drone dates do not leak into the wrong day', () => {
  const on = date => filterEvents({ start: date, end: date }).map(e => e.id);
  assert.ok(!on('2026-10-23').includes('seoul-bbq-2026'));
  assert.ok(on('2026-10-24').includes('seoul-bbq-2026'));
  assert.ok(!on('2026-10-25').includes('seoul-drone-2026'));
});
test('free filter excludes unknown fees, paid food and refundable deposits', () => {
  const events = filterEvents({ start: '2026-10-01', end: '2026-11-30', onlyFree: true });
  assert.ok(events.some(e=>e.id==='hangang-forest-2026'));
  assert.ok(events.every(e=>e.feeStatus==='free'));
  for(const id of ['namsan-night-2026','seoul-bbq-2026','seoul-drone-2026','mcst-13512-2026','mcst-11963-2026'])assert.ok(!events.some(e=>e.id===id));
});
test('combined search and region/theme filters respect actual occurrence dates', () => {
  assert.equal(filterEvents({ ...monthRange(2026, 10), region: '서울', theme: 'kids', keyword: '드론' }).length, 1);
  assert.equal(filterEvents({ ...monthRange(2026, 10), region: '제주', keyword: '드론' }).length, 0);
  assert.equal(filterEvents({ start: '2026-10-25', end: '2026-10-29', keyword: '남산' }).length, 0);
});
test('Korea today and weekends work across UTC midnight, month and year boundaries', () => {
  assert.equal(koreaToday(new Date('2026-10-22T16:00:00Z')), '2026-10-23');
  assert.deepEqual(weekendRange('2026-10-30'), { start: '2026-10-31', end: '2026-11-01' });
  assert.deepEqual(weekendRange('2026-11-01'), { start: '2026-10-31', end: '2026-11-01' });
  assert.deepEqual(weekendRange('2027-01-01'), { start: '2027-01-02', end: '2027-01-03' });
  assert.equal(monthRange(2028, 2).end, '2028-02-29');
});
test('past events are opt-in and stale data never gets a new verification date', () => {
  assert.equal(filterEvents({ ...monthRange(2026, 10), today: '2027-01-01', includeEnded: false }).length, 0);
  assert.ok(filterEvents({ ...monthRange(2026, 10), today: '2027-01-01', includeEnded: true }).length > 0);
  assert.equal(isStale('2026-10-23', '2026-10-30'), false);
  assert.equal(isStale('2026-10-23', '2026-10-31'), true);
});
test('bad dates, missing verification and dangerous URLs fail closed', () => {
  for (const date of ['2026-02-30', '2026-13-01', 'not-a-date']) assert.equal(isDate(date), false);
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:pass@example.com']) assert.equal(safeUrl(url), '');
  const invalid = { ...FESTIVALS[0], sources: [], verificationStatus: 'pending' };
  assert.deepEqual(filterEvents({ ...monthRange(2026, 10) }, [invalid]), []);
  assert.equal(escapeHtml('<img src=x onerror="bad()">'), '&lt;img src=x onerror=&quot;bad()&quot;&gt;');
});

test('seven public region groups cover every original region once and accept old shared links', () => {
  assert.deepEqual(SEARCH_REGIONS, ['전체','서울','경기지역','강원지역','충청지역','전라지역','경상지역','제주지역']);
  const members = REGION_GROUPS.flatMap(group => group.regions);
  assert.equal(members.length, 17); assert.equal(new Set(members).size, 17);
  assert.deepEqual([...members].sort(), REGIONS.slice(1).sort());
  for (const group of REGION_GROUPS) {
    assert.equal(normalizeSearchRegion(group.label), group.label);
    for (const member of group.regions) assert.equal(normalizeSearchRegion(member), group.label);
  }
  assert.equal(normalizeSearchRegion('인천'), '경기지역');
  assert.equal(normalizeSearchRegion('세종'), '충청지역');
  assert.equal(normalizeSearchRegion('광주'), '전라지역');
  assert.equal(normalizeSearchRegion('부산'), '경상지역');
  assert.equal(normalizeSearchRegion('전국'), '전체');
  assert.equal(normalizeSearchRegion('잘못된 지역'), '');
});

test('regional searches include every grouped city without relabeling source records', () => {
  const fixture = REGIONS.slice(1).map((region,index) => ({ ...FESTIVALS[0],
    id:'group-fixture-'+index, region, title:region+' 가족 행사', location:region+' 공원',
    startDate:'2026-10-24', endDate:'2026-10-25', dates:undefined, scheduleType:'continuous',
    publicationStatus:'published', feeStatus:index%2?'paid':'free' }));
  const range = { start:'2026-10-24', end:'2026-10-25', today:'2026-10-24' };
  for (const group of REGION_GROUPS) {
    const selected = filterEvents({...range, region:group.label}, fixture);
    assert.deepEqual(selected.map(event=>event.region).sort(), [...group.regions].sort());
    assert.ok(selected.every(event=>fixture.includes(event)));
  }
  assert.equal(filterEvents({...range,region:'인천'},fixture).length,2);
  assert.equal(filterEvents({...range,region:'대전'},fixture).length,4);
  const free = filterEvents({...range,region:'경상지역',onlyFree:true},fixture);
  assert.ok(free.length>0); assert.ok(free.every(event=>event.feeStatus==='free' && ['대구','부산','울산','경북','경남'].includes(event.region)));
  assert.equal(filterEvents({...range,region:'잘못된 지역'},fixture).length,0);
});

test('grouped coverage preserves counts, freshness, future dates and empty states', () => {
  for (const [today,includeEnded] of [['2026-10-24',false],['2027-01-01',true]]) {
    const args=[FESTIVALS,'2026-10-24','2026-10-25',today,{includeEnded}];
    const original=coverageForRange(...args), grouped=groupedCoverageForRange(...args);
    assert.equal(grouped.length,7);
    for (const key of ['count','freshCount','upcomingCount']) {
      assert.equal(grouped.reduce((sum,row)=>sum+row[key],0),original.reduce((sum,row)=>sum+row[key],0));
    }
    for (const group of REGION_GROUPS) {
      const members=original.filter(row=>group.regions.includes(row.region));
      const row=grouped.find(row=>row.region===group.label);
      assert.equal(row.count,members.reduce((sum,row)=>sum+row.count,0));
      assert.equal(row.nextDate,members.map(row=>row.nextDate).filter(Boolean).sort()[0]||null);
    }
  }
  assert.ok(groupedCoverageForRange([],'2026-10-24','2026-10-25','2026-10-24').every(row=>!row.count&&!row.upcomingCount&&row.nextDate===null));
});

test('each grouped official guide keeps its constituent cities and removes duplicate links', () => {
  const guides=sourcesForRegionGroup('충청지역',REGION_SOURCES);
  assert.deepEqual([...new Set(guides.map(source=>source.region))].sort(),['대전','세종','충남','충북'].sort());
  assert.ok(guides.every(source=>safeUrl(source.url)));
  const withDuplicate=[...REGION_SOURCES,{...REGION_SOURCES.find(row=>row.region==='세종')}];
  assert.deepEqual(sourcesForRegionGroup('세종',withDuplicate),guides);
  assert.deepEqual(sourcesForRegionGroup('전체',REGION_SOURCES),[]);
  assert.deepEqual(sourcesForRegionGroup('잘못된 지역',REGION_SOURCES),[]);
});
