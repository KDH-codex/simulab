import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {koreaToday, shiftDate, isStale, REGION_GROUPS, overlaps} from '../tools/kids-outing-calendar/model.js';
import {shoppingState} from '../assets/js/shopping-model.js';

/**
 * 운영자 주간 점검용: 72시간 내 만료 예정 할인, 확인일 7일 경과(stale) 활성 축제, 권역별 활성 공백 위험을 리포트로 출력합니다.
 */
const now = new Date();
const today = koreaToday(now);
const plus3 = shiftDate(today, 3);
const plus60 = shiftDate(today, 60);

const events = JSON.parse(await readFile(new URL('../data/events/reviewed.json', import.meta.url), 'utf8'));
const deals = JSON.parse(await readFile(new URL('../data/deals/reviewed.json', import.meta.url), 'utf8')).events.filter(e => e.shopping && e.publicationStatus !== 'held');

const activeEvents = events.filter(e => e.publicationStatus !== 'cancelled' && e.endDate >= today);
const staleEvents = activeEvents.filter(e => isStale(e.checkedAt, today));
const regionCounts = REGION_GROUPS.map(g => ({
  region: g.label,
  active60: activeEvents.filter(e => g.regions.includes(e.region) && overlaps(e, today, plus60)).length
}));

const activeDeals = deals.filter(d => shoppingState(d, now).active);
const expiringDeals = activeDeals.filter(d => d.endDate <= plus3);

const lines = [
  `# 이번주 축제·할인 신선도 점검 리포트 (${today} KST)`,
  '',
  `- 전체 활성·예정 축제: **${activeEvents.length}건** (그중 확인일 7일 경과 \`stale\`: **${staleEvents.length}건**)`,
  `- 현재 유효한 할인·쇼핑: **${activeDeals.length}건** (3일 이내 종료 예정 \`~${plus3}\`: **${expiringDeals.length}건**)`,
  '',
  '## 1. 권역별 60일 내 활성 축제 수',
  ...regionCounts.map(r => `- **${r.region}**: ${r.active60}건${r.active60 < 3 ? ' ⚠️ 보강 권장' : ''}`),
  '',
  '## 2. 3일 내 종료 예정 할인',
  ...(expiringDeals.length ? expiringDeals.map(d => `- \`${d.id}\` (${d.endDate}) · ${d.title}`) : ['- 없음']),
  '',
  '## 3. 확인일 재점검 권장 축제 (`stale`)',
  ...(staleEvents.length ? staleEvents.map(e => `- \`${e.id}\` (${e.region}, 확인일 ${e.checkedAt}, 종료 ${e.endDate}) · ${e.title}`) : ['- 없음'])
];

await mkdir(new URL('../scratch/', import.meta.url), {recursive: true});
await writeFile(new URL('../scratch/freshness-report.md', import.meta.url), lines.join('\n') + '\n', 'utf8');
console.log(JSON.stringify({
  today,
  activeEvents: activeEvents.length,
  staleEvents: staleEvents.length,
  activeDeals: activeDeals.length,
  expiringDeals3Days: expiringDeals.length,
  lowRegions: regionCounts.filter(r => r.active60 < 3)
}));
