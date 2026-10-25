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
 assert.equal(window.SimuLab.SITE_MENU.flatMap(g=>g.items).length,55);
 assert.deepEqual(Array.from(window.SimuLab.SITE_MENU.find(g=>g.id==='weekday').items,t=>t.tool),['working-parents-guide','pay-work-guide','living-cost-guide']);
});

test('sensitive disclosures distinguish entertainment, health, financial estimates and statistics',async()=>{
 const scope={};vm.runInNewContext(await readFile(new URL('../assets/js/core-ui.js',import.meta.url),'utf8'),scope);
 const cases={'saju-wealth-sim':'entertainment','invest-animal-mbti':'entertainment','lotto-draw-sim':'entertainment','lotto-tax-interest-calc':'financial','life-hourglass-sim':'health','stock-water-ride-calc':'investment','korean-wealth-percentile-calc':'statistics','alcohol-widmark-calc':'safety'};
 for(const [id,kind] of Object.entries(cases))assert.equal(scope.SimuLab.getToolNotice(id).kind,kind,id);
 assert.equal(scope.SimuLab.getToolNotice('home'),null);
 assert.match(scope.SimuLab.buildSmartDisclaimerHtml('stock-water-ride-calc','../../'),/\.\.\/\.\.\/legal\/terms\.html/);
 assert.match(scope.SimuLab.buildSmartDisclaimerHtml('stock-water-ride-calc','../../'),/책임은 이 안내로 배제하지 않습니다/);
});
