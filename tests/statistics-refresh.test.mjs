import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES, YEARS } from '../tools/world-gni-ranking-race/data.js';
import { getRankingsByYear, compareTwoCountries } from '../tools/world-gni-ranking-race/logic.js';
import { WORLD_COUNTRIES_DATA } from '../tools/world-population-area-rank/data.js';
import { getDensityVisualData } from '../tools/world-population-area-rank/logic.js';
import { POPULATION_PYRAMID_DATA, ELEMENTARY_HISTORY, REGIONAL_ELEMENTARY_2026 } from '../tools/korean-population-pyramid/data.js';
import { getPyramidByYear, matchMyGenerationSchool } from '../tools/korean-population-pyramid/logic.js';
import { TOURISM_YEARS, TOURISM_STATS, TOURISM_YTD_2026, OUTBOUND_TOP5_2026, INBOUND_TOP5_2026 } from '../tools/korean-tourism-travel-stats/data.js';
import { TRADE_YEARS, TRADE_TOTALS, TRADE_YTD_2026, EXPORT_RANKINGS } from '../tools/korean-trade-ranking/data.js';
import { getExportRankingsByYear } from '../tools/korean-trade-ranking/logic.js';
import { CityIncomeHousingLogic } from '../tools/korean-city-income-housing/logic.js';

test('GNI uses the latest annual release and omits missing observations instead of ranking zero', () => {
  assert.equal(YEARS.at(-1), 2025);
  assert.equal(COUNTRIES.length, 19);
  assert.equal(COUNTRIES.find(c => c.code === 'KOR').data[2025].gniPerCapita, 37880);
  assert.equal(getRankingsByYear(1990, 'gniPerCapita').some(c => c.code === 'RUS'), false);
  assert.equal(getRankingsByYear(1990, 'gniTotal').some(c => c.code === 'RUS'), true);
  const comparison = compareTwoCountries('RUS');
  assert.equal(comparison.comparisons[0].year, 1995);
  assert.equal(comparison.comparisons.at(-1).year, 2025);
  assert.ok(comparison.comparisons.every(c => Number.isFinite(c.targetVal) && Number.isFinite(c.korVal)));
});

test('population bins conserve exact registry totals and school regions reconcile to the education release', () => {
  assert.equal(getPyramidByYear().year, 2026);
  assert.equal(getPyramidByYear(1900).year, 2026);
  for (const data of Object.values(POPULATION_PYRAMID_DATA)) {
    const bins = [...Object.values(data.male), ...Object.values(data.female)];
    assert.equal(Math.round(bins.reduce((a,b) => a+b, 0) * 10000), Math.round(data.totalPop * 10000));
  }
  assert.equal(Math.round(POPULATION_PYRAMID_DATA[2026].totalPop * 10000), 51082431);
  assert.equal(REGIONAL_ELEMENTARY_2026.length, 17);
  assert.equal(REGIONAL_ELEMENTARY_2026.reduce((a,r) => a+r.students, 0), 2219370);
  assert.equal(Math.round(ELEMENTARY_HISTORY.at(-1).students * 10000), 2219370);
  assert.equal(ELEMENTARY_HISTORY.at(-1).classSize, 18.6);
  assert.equal(matchMyGenerationSchool().latestYear, 2026);
});

test('2026 partial tourism and trade observations cannot enter full-year charts or replace their defaults', () => {
  assert.equal(TOURISM_YEARS.at(-1), 2025);
  assert.equal(TRADE_YEARS.at(-1), 2025);
  assert.equal(getExportRankingsByYear().year, 2025);
  assert.equal(Math.round(TOURISM_STATS[2025].outbound * 10000), 29550177);
  assert.equal(Math.round(TOURISM_STATS[2025].inbound * 10000), 18936562);
  assert.deepEqual(TOURISM_YTD_2026, {period:'2026년 1~8월', outbound:19813036, inbound:15048435});
  assert.equal(TRADE_YTD_2026.period, '2026년 1~9월');
  assert.ok(Math.abs(TRADE_TOTALS[2025].export - TRADE_TOTALS[2025].import - TRADE_TOTALS[2025].balance) < 1e-8);
  assert.equal(EXPORT_RANKINGS[2025][0].amount, 1733.94);
  assert.equal(TOURISM_STATS[2025].balance, null);
  assert.deepEqual(OUTBOUND_TOP5_2026.map(r => r.country), ['일본','베트남','미국','태국','대만']);
  assert.ok(OUTBOUND_TOP5_2026.every(r => r.period === '2026년 1~8월' && !('share' in r)));
  assert.deepEqual(INBOUND_TOP5_2026.map(r => r.country), ['중국','일본','대만','미국','홍콩']);
});

test('world density consistently uses projection population and surface area; region income keeps its original year', () => {
  assert.equal(WORLD_COUNTRIES_DATA.length, 29);
  assert.equal(getDensityVisualData().length, 6);
  assert.ok(getDensityVisualData().every(Boolean));
  for (const c of WORLD_COUNTRIES_DATA) {
    assert.ok(c.area > 0 && c.population > 0);
    assert.ok(Math.abs(c.density - c.population / c.area) <= .051);
  }
  assert.equal(CityIncomeHousingLogic.REGIONS_DATA.seoul.income, 3222);
  assert.equal(CityIncomeHousingLogic.REGIONS_DATA.ulsan.income, 3112);
});

test('published pages distinguish source years and retain official provenance without scripts', async () => {
  const read = slug => readFile(new URL(`../tools/${slug}/index.html`, import.meta.url), 'utf8');
  const [tourism,trade,world,wealth,city] = await Promise.all(['korean-tourism-travel-stats','korean-trade-ranking','world-population-area-rank','korean-wealth-percentile-calc','korean-city-income-housing'].map(read));
  assert.match(tourism, /2026년 1~8월 누계/);
  assert.match(tourism, /bcIdx=311301/);
  assert.match(trade, /2026년 1~9월 누계/);
  assert.match(trade, /수입 에너지 품목 참고 \(2024년 연간 기준\)/);
  assert.match(world, /인구: 2026년 전망 · 면적: 2024년 표면적/);
  assert.match(wealth, /4억 7,144만원/);
  assert.match(wealth, /2025-03-31/);
  assert.match(city, /2024년 잠정 실적/);
});
