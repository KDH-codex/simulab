import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeLocale,resolveLocale,languageURL,UI_TRANSLATIONS,translateUI,LANGUAGES} from '../assets/js/festival-i18n.js';
import {EVENT_LOCALES,eventTranslation} from '../assets/js/festival-event-locales.js';
import {highlightFor,FESTIVAL_HIGHLIGHTS} from '../assets/js/festival-highlights.js';
import {matchesKeyword} from '../assets/js/festival-ui-model.js';
const events=JSON.parse(await readFile(new URL('../data/events/reviewed.json',import.meta.url),'utf8'));

test('language preference uses explicit link, then saved preference, then supported browser language',()=>{
  assert.equal(resolveLocale({query:'ko',saved:'en',languages:['ja']}),'ko');
  assert.equal(resolveLocale({query:'bogus',saved:'ja',languages:['en-US']}),'ja');
  assert.equal(resolveLocale({languages:['fr-FR','zh-Hant-TW']}),'zh-TW');
  assert.equal(normalizeLocale('zh-HK'),'zh-TW');assert.equal(normalizeLocale('zh-SG'),'zh-CN');
  assert.equal(resolveLocale({languages:['de']}),'ko');
  assert.equal(normalizeLocale('<script>'),null);
});
test('language links preserve dates, region, saved filter and anchor without leaking locale to other sites',()=>{
  const url=languageURL('/calendar/?region=서울&saved=1&period=today#selected-day-section','zh-TW');
  assert.equal(url.searchParams.get('region'),'서울');assert.equal(url.searchParams.get('saved'),'1');
  assert.equal(url.searchParams.get('period'),'today');assert.equal(url.hash,'#selected-day-section');
  assert.equal(url.searchParams.get('lang'),'zh-TW');
  assert.equal(languageURL('https://map.naver.com/v5/search/서울','en'),null);
  assert.equal(languageURL('/legal/privacy','en'),null);
  assert.equal(languageURL('/events/busan-fireworks-2026/','ja').searchParams.get('lang'),'ja');
});
test('every reviewed event has four guide names and topic summaries, with Korean data preserved',()=>{
  for(const event of events){assert.ok(EVENT_LOCALES[event.id],event.id);
    for(const [locale] of LANGUAGES.filter(([locale])=>locale!=='ko')){
      const entry=eventTranslation(event,locale);assert.ok(entry.title.length>3,event.id+' '+locale);assert.ok(entry.summary.length>15);
    }
    assert.equal(eventTranslation(event,'ko'),null);
  }
  assert.deepEqual(Object.keys(EVENT_LOCALES).sort(),events.map(e=>e.id).sort());
});
test('all interface entries include four translations, and dynamic UI labels retain their numbers',()=>{
  for(const [key,values] of Object.entries(UI_TRANSLATIONS)){assert.equal(values.length,4,key);assert.ok(values.every(Boolean),key);}
  assert.equal(translateUI('수록 일정 12건','en'),'Listed events: 12');
  assert.equal(translateUI('공식 출처 확인 2026-11-07','en'),'Official sources checked 2026-11-07');
  assert.equal(translateUI('서울 축제 모아보기','en'),'Seoul festivals');
  assert.equal(translateUI('오늘 일정 있음','en'),'Runs today');
  assert.equal(translateUI('이전 추천','en'),'Previous pick');
  assert.equal(translateUI('2026.11.07 — 11.08','ja'),'2026.11.07 — 11.08');
});
test('translated names participate in keyword filtering alongside original Korean names',()=>{
  const event=events.find(e=>e.id==='busan-fireworks-2026');
  assert.ok(matchesKeyword(event,'busan'));assert.ok(matchesKeyword(event,'釜山'));assert.ok(matchesKeyword(event,'부산'));
  assert.equal(matchesKeyword(event,'unrelated'),false);
});
test('editorial HOT marks expire and cannot be applied to cancelled or unselected events',()=>{
  const selected=events.find(e=>e.id==='busan-fireworks-2026');
  assert.ok(highlightFor(selected,'2026-11-07'));
  assert.equal(highlightFor(selected,'2026-11-08'),null);
  assert.equal(highlightFor({...selected,publicationStatus:'cancelled'},'2026-11-07'),null);
  assert.equal(highlightFor({...selected,id:'unknown'},'2026-11-07'),null);
  for(const [id,entry] of Object.entries(FESTIVAL_HIGHLIGHTS)){assert.ok(events.some(e=>e.id===id));assert.ok(entry.reason);assert.equal(new URL(entry.source).protocol,'https:');}
});
