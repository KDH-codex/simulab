import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { FESTIVALS, DATA_REVIEWED_AT } from '../tools/kids-outing-calendar/data.js';
import { validateEvent, escapeHtml as esc, safeUrl } from '../tools/kids-outing-calendar/logic.js';
const page = fileURLToPath(new URL('../tools/kids-outing-calendar/index.html', import.meta.url));
const ids = new Set();
for (const event of FESTIVALS) {
  const errors = validateEvent(event);
  if (ids.has(event.id)) errors.push('중복 ID');
  ids.add(event.id);
  if (errors.length) throw new Error(event.id + ': ' + errors.join(', '));
}
const table = '<div class="outing-source-table-wrap"><table class="outing-source-table"><caption>공식 공지 확인 목록 · ' + DATA_REVIEWED_AT + ' 검토</caption><thead><tr><th scope="col">행사</th><th scope="col">일정</th><th scope="col">장소</th><th scope="col">공식 출처 / 확인일</th></tr></thead><tbody>' +
  FESTIVALS.map(e => '<tr><th scope="row">' + esc(e.title) + '</th><td>' + esc(e.scheduleNote || e.startDate + ' ~ ' + e.endDate) + '</td><td>' + esc(e.location) + '</td><td>' +
    e.sources.map(s => '<a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(s.publisher) + '</a>').join('<br>') + '<br>' + esc(e.checkedAt) + '</td></tr>').join('\n') + '</tbody></table></div>';
const schema = {
  '@context': 'https://schema.org', '@type': 'CollectionPage',
  name: '아이와 가볼만한 곳 달력', url: 'https://simulab.kr/tools/kids-outing-calendar/',
  dateModified: DATA_REVIEWED_AT, inLanguage: 'ko-KR',
  mainEntity: { '@type': 'ItemList', numberOfItems: FESTIVALS.length, itemListElement: FESTIVALS.map((e, i) => ({
    '@type': 'ListItem', position: i + 1, name: e.title, url: e.sources[0].url
  })) }
};
let html = await readFile(page, 'utf8');
if(!html.includes('href="/tools/family-info-calendar/"'))html=html.replace(/(<main\b[^>]*>)/,'$1\n<nav class="family-tabs" aria-label="가족 정보"><a href="/tools/family-info-calendar/">가족 정보 모아보기 ↗</a><a href="/tools/parenting-deals/">브랜드 세일 달력 ↗</a></nav>');
for (const [marker, content] of Object.entries({
  SCHEMA: '<script type="application/ld+json">' + JSON.stringify(schema).replaceAll('<', '\\u003c') + '</script>',
  REVIEW: '<p>마지막 검토 <time datetime="' + DATA_REVIEWED_AT + '">' + DATA_REVIEWED_AT + '</time> · ' + FESTIVALS.length + '개 행사</p>',
  SOURCES: table
})) {
  const start = '<!-- GENERATED:' + marker + ':START -->';
  const end = '<!-- GENERATED:' + marker + ':END -->';
  const startIndex = html.indexOf(start), endIndex = html.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) throw new Error('Missing marker ' + marker);
  html = html.slice(0, startIndex + start.length) + '\n' + content + '\n  ' + html.slice(endIndex);
}
if (process.argv.includes('--check')) {
  if (html !== await readFile(page, 'utf8')) throw new Error('Generated page is stale. Run node scripts/build-kids-calendar.mjs');
  console.log('Calendar data and static HTML agree: ' + FESTIVALS.length + ' records.');
} else {
  await writeFile(page, html, 'utf8'); console.log('Updated static source list, review count and schema.');
}
