import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {JSDOM} from 'jsdom';
const html=await readFile(new URL('../sales/index.html',import.meta.url),'utf8');
const data=JSON.parse(html.match(/id="sales-data">([\s\S]*?)<\/script>/)[1]);
const at=Math.max(...data.map(e=>Date.parse(e.checkedAt)))+600000;
let run=0;
async function runtime(locale,callback,{blockedStorage=false,detail=false}={}){
 const page=detail?await readFile(new URL('../sales/'+data[0].id+'/index.html',import.meta.url),'utf8'):html;
 const url='https://simulab.kr/sales/'+(detail?data[0].id+'/':'')+'?lang='+locale;
 const dom=new JSDOM(page,{url,pretendToBeVisual:true,runScripts:'outside-only'}),w=dom.window;
 w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 if(blockedStorage)Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage disabled');}});
 const original=new Map(),NativeDate=Date,observers=[];
 class TrackedObserver extends w.MutationObserver {constructor(callback){super(callback);observers.push(this);}}
 class Clock extends NativeDate {constructor(...args){super(...(args.length?args:[at]));}static now(){return at;}}
 const globals={window:w,document:w.document,Node:w.Node,MutationObserver:TrackedObserver,location:w.location,history:w.history,navigator:w.navigator,matchMedia:w.matchMedia,Date:Clock,setInterval:()=>0};
 try{
  for(const [key,value] of Object.entries(globals)){original.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});}
  if(!blockedStorage)globalThis.localStorage=w.localStorage;else Object.defineProperty(globalThis,'localStorage',{get(){throw new Error('Storage disabled');},configurable:true});
  await import('../assets/js/festival-sales.js?domtest='+(run++));await delay(0);await callback(w);await delay(0);
 }finally{observers.forEach(observer=>observer.disconnect());dom.window.close();delete globalThis.localStorage;for(const [key,descriptor] of original){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
}
for(const [locale,title] of [['ko','검토한 할인 행사'],['en','Reviewed shopping offers'],['ja','確認したセール'],['zh-CN','已核实优惠活动'],['zh-TW','已核實優惠活動']])test('shopping DOM: filters, modal tabs, language links and saved offers in '+locale,async()=>{
 await runtime(locale,async w=>{
  const doc=w.document;assert.equal(doc.documentElement.lang,locale);assert.equal(doc.querySelector('#shop-result-title').textContent,title);
  if(locale==='en')assert.equal(doc.querySelector('#shop-saved').textContent,'♡ Saved offers');
  assert.equal(doc.querySelectorAll('#shop-grid article').length,9);
  doc.querySelector('[data-shop-kind="mart"]').click();await delay(0);assert.equal(doc.querySelectorAll('#shop-grid article').length,2);
  assert.equal(new URL(w.location.href).searchParams.get('kind'),'mart');
  doc.querySelector('[data-shop-kind="department"]').click();await delay(0);assert.equal(doc.querySelector('#shop-empty').hidden,false);
  doc.querySelector('[data-shop-reset]').click();await delay(0);
  const preview=doc.querySelector('#shop-grid [data-sale-preview]');preview.click();await delay(0);
  assert.ok(doc.querySelector('#festival-dialog').hasAttribute('open'));
  doc.querySelector('[data-sale-tab="schedule"]').click();assert.equal(doc.querySelector('#shopping-panel-schedule').hidden,false);
  assert.ok(doc.querySelector('.shopping-conditions').hasAttribute('data-original'));
  const id=doc.querySelector('.shopping-actions [data-sale-save]').dataset.saleSave;doc.querySelector('.shopping-actions [data-sale-save]').click();
  assert.equal(doc.querySelector('[data-saved-count]').textContent,'1');
  assert.deepEqual(JSON.parse(w.localStorage.getItem('thisweekfestival.shopping.saved.v1')),[id]);
  doc.querySelector('[data-close-dialog]').click();doc.querySelector('#shop-saved').click();await delay(0);
  assert.equal(doc.querySelectorAll('#shop-grid article').length,1);
  const link=doc.querySelector('#shop-grid h3 a');assert.equal(new URL(link.href).searchParams.get('lang'),locale);
  assert.equal(doc.querySelector('a.header-saved').pathname,'/sales/');
 });
});
test('shopping DOM: blocked browser storage still permits filtering, saving in memory and localized links',async()=>{
 await runtime('en',async w=>{const d=w.document;d.querySelector('[data-sale-save]').click();assert.equal(d.querySelector('[data-saved-count]').textContent,'1');assert.match(d.querySelector('#festival-toast').textContent,/storage is unavailable/);d.querySelector('#shop-saved').click();await delay(0);assert.equal(d.querySelectorAll('#shop-grid article').length,1);},{blockedStorage:true});
});
test('shopping DOM: a standalone translated detail page keeps canonical and original conditions',async()=>{
 await runtime('en',async w=>{const d=w.document;assert.equal(d.querySelectorAll('h1').length,1);assert.equal(d.querySelector('h1').textContent,data[0].shopping.locales.en.title);assert.ok(d.querySelector('link[rel="canonical"]').href.endsWith('/'+data[0].id+'/'));d.querySelector('[data-sale-tab="source"]').click();assert.equal(d.querySelector('#shopping-panel-source').hidden,false);},{detail:true});
});
