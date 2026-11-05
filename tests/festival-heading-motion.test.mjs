import test from 'node:test';
import assert from 'node:assert/strict';
import {splitHeading,typewriterText,setupHeadingMotion} from '../assets/js/festival-heading-motion.js';

test('animated headings preserve complete accessible text and escape markup',()=>{
  const split=splitHeading(['이번 주','어디 갈까?']);
  assert.match(split,/aria-label="이번 주 어디 갈까\?"/);
  assert.equal((split.match(/class="split-line" aria-hidden="true"/g)||[]).length,2);
  assert.match(typewriterText('어디로 떠나볼까요?'),/class="motion-sr-only">어디로 떠나볼까요\?</);
  assert.match(typewriterText('<img src=x>'),/&lt;img src=x&gt;/);
  assert.doesNotMatch(splitHeading(['<script>']),/<script>/);
});

const classes=()=>{const set=new Set();return {add:(...x)=>x.forEach(v=>set.add(v)),remove:(...x)=>x.forEach(v=>set.delete(v)),contains:x=>set.has(x)};};
const makeNode=()=>({classList:classes(),children:[],hidden:false,textContent:'',replaceChildren(...children){this.children=children;},insertBefore(node,before){this.children.splice(this.children.indexOf(before),0,node);}});

test('typing cancels and restores the complete fallback when reduced motion is enabled',t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const previousWindow=globalThis.window,previousDocument=globalThis.document;
  const output=makeNode(),title={...makeNode(),dataset:{typewriterText:'서울?'},isConnected:true,hasAttribute:()=>false,querySelector:()=>output};
  const root={querySelectorAll:selector=>selector==='[data-typewriter-text]'?[title]:[]};
  let onChange;
  const preference={matches:false,addEventListener:(_,handler)=>{onChange=handler;},removeEventListener:()=>{onChange=null;}};
  globalThis.window={};globalThis.document={createElement:makeNode};
  try{
    const cleanup=setupHeadingMotion({reducedMotion:preference,root});
    t.mock.timers.tick(60);
    assert.equal(output.children[0].textContent,'서');
    preference.matches=true;onChange();
    assert.equal(output.hidden,true);
    assert.equal(title.classList.contains('is-typing'),false);
    t.mock.timers.tick(1000);
    assert.equal(output.children.length,2,'no delayed letters after cancellation');
    cleanup();assert.equal(onChange,null);
  }finally{globalThis.window=previousWindow;globalThis.document=previousDocument;}
});
