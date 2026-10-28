import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {publicationCatalog} from '../scripts/publication.mjs';
import {formatSpeech} from '../scripts/debate-presentation.mjs';
const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');

test('public episode has actual six main turns and two short model closings',async()=>{
 const episode=JSON.parse(await read('data/debates/001.json'));
 assert.deepEqual(episode.turns.map(t=>t.id),['T1','T2','T3','T4','T5','T6','T7','T8']);
 for(const model of ['GPT','Gemini']){
  assert.equal(episode.turns.filter(t=>t.model===model&&t.kind==='debate').length,3);
  assert.equal(episode.turns.filter(t=>t.model===model&&t.kind==='closing').length,1);
 }
 for(const turn of episode.turns){assert.equal(turn.body.length,turn.characters);assert.ok(turn.characters<=(turn.kind==='closing'?100:1000));assert.match(turn.sourceHash,/^[a-f0-9]{64}$/);}
 assert.deepEqual(episode.turns.slice(6).map(t=>t.characters),[97,91]);
 assert.equal(episode.originalBroadcast.winner,null);
 assert.doesNotMatch(JSON.stringify(episode),/claimToken|C:\\|\.codex-remote-attachments|API_TOKEN/);
});

test('new front door separates debates from the complete existing directory',async()=>{
 const home=await read('index.html'),library=await read('library/index.html'),{ids}=await publicationCatalog();
 assert.match(home,/<h1[^>]*>AI는 토론하고/);assert.match(home,/href="\/debates\/001\/"/);assert.match(home,/href="\/library\/"/);
 assert.doesNotMatch(home,/class="family-first"|id="tool-directory"/);
 for(const id of ids)assert.ok(library.includes('data-tool="'+id+'"'),id);
 assert.match(library,/href="\/guides\/"/);assert.match(library,/id="archived-tools"/);
 assert.doesNotMatch(library,/data-archived-tool="(?:game-tetris|alcohol-widmark-calc)"/);
 assert.match(library,/rel="canonical" href="https:\/\/simulab.kr\/library\/"/);
});

test('published debate contains both actual final appeals and no temporary preview state',async()=>{
 const html=await read('debates/001/index.html');
 assert.equal((html.match(/data-step="/g)||[]).length,8);
 assert.equal((html.match(/data-status="FINAL"/g)||[]).length,2);
 assert.doesNotMatch(html,/EXCERPT_PENDING_FINAL|새 발언 대기|noindex,nofollow|로컬 미리보기/);
 assert.match(html,/class="topic-dock"/);assert.match(html,/진행자 한마디 · 편집 연출/);
 assert.match(html,/rel="canonical" href="https:\/\/simulab.kr\/debates\/001\/"/);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
});

test('typographic enrichment escapes text and cannot turn quoted input into HTML',()=>{
 const html=formatSpeech('“<img src=x onerror=alert(1)>” 핵심 문장',{bold:['핵심'],highlight:['문장']});
 assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);
 assert.match(html,/class="spoken-quote"/);assert.match(html,/<strong>핵심<\/strong>/);assert.match(html,/<mark class="punch-highlight">문장<\/mark>/);
});
