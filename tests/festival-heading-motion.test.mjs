import test from 'node:test';
import assert from 'node:assert/strict';
import {splitHeading,typewriterText,setupHeadingMotion} from '../assets/js/festival-heading-motion.js';

test('animated headings preserve complete accessible text and escape markup',()=>{
  const split=splitHeading(['이번 주','어디 갈까?']);
  assert.match(split,/aria-label="이번 주 어디 갈까\?"/);
  assert.equal((split.match(/class="split-line" aria-hidden="true"/g)||[]).length,2);
  assert.match(split,/--split-delay:0ms">이<.*--split-delay:125ms">번</);
  const title=typewriterText([[{text:'어디로'}],[{text:'떠나볼까요?',accent:true}]]);
  assert.match(title,/class="motion-sr-only">어디로 떠나볼까요\?</);
  assert.equal((title.match(/class="typewriter-line"/g)||[]).length,2);
  assert.equal((title.match(/class="typewriter-char heading-accent"/g)||[]).length,6);
  assert.match(typewriterText('<img src=x>'),/&lt;img src=x&gt;/);
  assert.doesNotMatch(splitHeading(['<script>']),/<script>/);
});

const classes=()=>{const set=new Set();return {add:(...x)=>x.forEach(v=>set.add(v)),remove:(...x)=>x.forEach(v=>set.delete(v)),contains:x=>set.has(x)};};
test('typing uses the existing glyphs and stops revealing them when reduced motion is enabled',t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const previousWindow=globalThis.window;
  const letters=Array.from('서울?',textContent=>({classList:classes(),textContent}));
  const title={
    classList:classes(),isConnected:true,hasAttribute:()=>false,
    querySelectorAll:()=>letters,
    querySelector:()=>letters.find(letter=>letter.classList.contains('has-cursor'))
  };
  const root={querySelectorAll:selector=>selector==='[data-typewriter]'?[title]:[]};
  let onChange;
  const preference={matches:false,addEventListener:(_,handler)=>{onChange=handler;},removeEventListener:()=>{onChange=null;}};
  globalThis.window={};
  try{
    const cleanup=setupHeadingMotion({reducedMotion:preference,root});
    t.mock.timers.tick(60);
    assert.equal(letters[0].classList.contains('is-typed'),true);
    assert.equal(letters[1].classList.contains('is-typed'),false);
    preference.matches=true;onChange();
    assert.equal(letters[0].classList.contains('has-cursor'),false);
    assert.equal(title.classList.contains('is-typing'),false);
    t.mock.timers.tick(1000);
    assert.equal(letters[1].classList.contains('is-typed'),false,'no delayed letters after cancellation');
    cleanup();assert.equal(onChange,null);
  }finally{globalThis.window=previousWindow;}
});
