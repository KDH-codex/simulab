import test from 'node:test';
import assert from 'node:assert/strict';
import {addCharacters,characterLog,catchphraseLog} from '../scripts/debate-characters.mjs';
const fixture=first=>`<html><head></head><body><div class="start-area"></div>${Array.from({length:6},(_,i)=>{const name=i%2?(first==='GPT'?'Gemini':'GPT'):first;return `<article class="turn-card ${name==='GPT'?'codex':'gemini'}" data-model="${name}"><div class="speech"><p>실제 발언 ${i+1}</p></div></article>`}).join('')}</body></html>`;
for(const first of ['GPT','Gemini'])test(`character introductions follow ${first} first without changing speeches`,()=>{
 const before=fixture(first),after=addCharacters(before);
 assert.ok(after.indexOf(first==='GPT'?'태종대 교수 · GPT':'경포대 교수 · Gemini')<after.indexOf(first==='GPT'?'경포대 교수 · Gemini':'태종대 교수 · GPT'));
 for(let i=1;i<=6;i++)assert.ok(after.includes(`<p>실제 발언 ${i}</p>`));
 assert.equal((after.match(/data-character-catchphrase/g)||[]).length,2);
 assert.equal((after.match(/data-character-intro/g)||[]).length,1);
 assert.ok(after.includes('아주 날카로운 지적입니다'));assert.ok(after.includes('구글링해봤는데~'));
 assert.ok(!after.includes('사용량 한도에 도달했습니다'));assert.equal(addCharacters(after),after);
});
test('log labels character lines as staging separately from actual words',()=>{
 const log=characterLog({draw:{first:'Gemini'}});assert.ok(log.includes('캐릭터 연출'));assert.ok(log.indexOf('경포대 교수 Gemini')<log.indexOf('태종대 교수 GPT'));
 assert.ok(catchphraseLog({number:3,speaker:'Gemini'}).includes('일단 그림으로'));assert.equal(catchphraseLog({number:1,speaker:'GPT'}),'');
});
