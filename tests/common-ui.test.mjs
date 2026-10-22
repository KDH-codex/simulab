import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('common initialization completes after removing the old blocking consent gate',async()=>{
 const elements=new Map(),attrs=new Map(),head={append(){},appendChild(){}};
 const document={readyState:'loading',documentElement:{setAttribute:(k,v)=>attrs.set(k,v)},head,addEventListener(){},getElementById:id=>elements.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({setAttribute(){}})};
 const window={location:{pathname:'/'},addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(await readFile(new URL('../assets/js/core-ui.js',import.meta.url),'utf8'),{document,window,CustomEvent:class{},localStorage:{getItem:()=>null,setItem(){}}});
 assert.doesNotThrow(()=>window.SimuLab.initCommonUI('home'));assert.equal(attrs.get('data-theme'),'light');
 assert.equal(window.SimuLab.SITE_MENU.flatMap(g=>g.items).length,51);
});
