import test from 'node:test';
import assert from 'node:assert/strict';
import { FESTIVALS } from '../tools/kids-outing-calendar/data.js';
import { validateEvent, occursOn, filterEvents, monthRange, koreaToday, weekendRange, isDate, isStale, safeUrl, escapeHtml } from '../tools/kids-outing-calendar/logic.js';

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
