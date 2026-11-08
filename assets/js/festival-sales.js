import {initializeLanguage} from './festival-language.js';
import {setupHeadingMotion} from './festival-heading-motion.js';
import {languageURL} from './festival-i18n.js';
import {shopT as t} from './shopping-i18n.js';
import {SHOP_KINDS,SHOP_CATEGORIES,SHOP_AREAS,SHOP_CHANNELS,SHOP_STORAGE,shoppingState,shoppingText,filterShopping,restoreShoppingSaved,saleURL} from './shopping-model.js';
import {saleCard,saleDetails,saleActions} from './shopping-presentation.js';

const rows=JSON.parse(document.getElementById('sales-data')?.textContent||'[]');
const byId=new Map(rows.map(e=>[e.id,e]));
const extraTexts=rows.flatMap(e=>['title','summary'].map(key=>({original:e[key],translations:Object.fromEntries(Object.entries(e.shopping.locales).map(([lang,copy])=>[lang,copy[key]]))})));
const locale=initializeLanguage([],{extraTexts});
const $=id=>document.getElementById(id),dialog=$('festival-dialog'),params=new URL(location.href).searchParams;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const allowed=(key,values,fallback='all')=>values.includes(params.get(key))?params.get(key):fallback;
const state={kind:allowed('kind',Object.keys(SHOP_KINDS)),category:allowed('category',Object.keys(SHOP_CATEGORIES)),area:allowed('area',Object.keys(SHOP_AREAS)),channel:allowed('channel',Object.keys(SHOP_CHANNELS)),brand:allowed('brand',rows.map(e=>e.shopping.brandCode)),period:allowed('period',['all','ending','weekend','upcoming','archive']),sort:allowed('sort',['end','start'],'end'),query:(params.get('q')||'').slice(0,100),saved:params.get('saved')==='1',member:params.get('member')==='1',card:params.get('card')==='1',limit:9};
let saved=[];try{saved=restoreShoppingSaved(localStorage.getItem(SHOP_STORAGE),rows);}catch{}
let opener,activeEvent,toastTimer,searchTimer,observer;
function toast(message){const element=$('festival-toast');element.textContent=message;element.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.hidden=true,3400);}
function updateURL(){const url=new URL(location.href);for(const [key,value] of Object.entries({kind:state.kind,category:state.category,area:state.area,channel:state.channel,brand:state.brand,period:state.period,sort:state.sort,q:state.query,saved:state.saved?'1':'',member:state.member?'1':'',card:state.card?'1':''})){if(value===''||value==='all'||key==='sort'&&value==='end')url.searchParams.delete(key);else url.searchParams.set(key,value);}url.searchParams.set('lang',locale);history.replaceState(null,'',url);}
function syncSaved(){
 document.querySelectorAll('[data-saved-count]').forEach(el=>el.textContent=saved.length);
 document.querySelectorAll('[data-sale-save]').forEach(button=>{const on=saved.includes(button.dataset.saleSave);button.setAttribute('aria-pressed',String(on));button.classList.toggle('is-saved',on);button.textContent=button.classList.contains('save-button')?(on?'♥':'♡'):t(on?'♥ 보관됨':'♡ 할인 보관',locale);});
}
function reveal(){observer?.disconnect();const cards=[...document.querySelectorAll('#shop-grid .festival-card')];
 if(motion.matches||!('IntersectionObserver' in window)){cards.forEach(card=>card.classList.add('reveal-complete'));return;}
 observer=new IntersectionObserver(entries=>{entries.filter(e=>e.isIntersecting).forEach(({target},i)=>{target.style.setProperty('--reveal-delay',Math.min(i,5)*100+'ms');target.classList.add('is-revealed');target.addEventListener('animationend',event=>{if(event.animationName==='festival-card-reveal')target.classList.add('reveal-complete');},{once:true});observer.unobserve(target);});},{threshold:.06});
 cards.forEach(card=>{card.classList.add('reveal-pending');observer.observe(card);});
}
function render(){
 if(!$('shop-grid'))return;
 const filtered=filterShopping(rows,state,new Date(),saved),pool=filterShopping(rows,{...state,kind:'all'},new Date(),saved);
 $('shop-grid').innerHTML=filtered.slice(0,state.limit).map(e=>saleCard(e,{locale,saved})).join('');
 $('shop-empty').hidden=filtered.length>0;$('shop-more').hidden=filtered.length<=state.limit;
 $('shop-result-title').textContent=t(state.saved?'보관한 할인':'검토한 할인 행사',locale);
 $('shop-result-summary').textContent=new Intl.NumberFormat(locale).format(filtered.length)+' · '+t('확인한 목록 기준이며, 모든 업체의 세일을 뜻하지 않습니다.',locale);
 for(const key of ['category','area','channel','brand','period','sort'])if($('shop-'+key))$('shop-'+key).value=state[key];
 $('shop-query').value=state.query;$('shop-saved').setAttribute('aria-pressed',String(state.saved));
 $('shop-saved').textContent='♡ '+t('보관한 할인',locale);
 $('shop-member').checked=state.member;$('shop-card').checked=state.card;
 document.querySelectorAll('[data-shop-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shopKind===state.kind)));
 document.querySelectorAll('[data-shop-count]').forEach(el=>el.textContent=pool.filter(e=>el.dataset.shopCount==='all'||e.shopping.kind===el.dataset.shopCount).length);
 $('shop-stat-total').textContent=filterShopping(rows).length;$('shop-stat-ending').textContent=filterShopping(rows,{period:'ending'}).length;$('shop-stat-upcoming').textContent=filterShopping(rows,{period:'upcoming'}).length;
 syncSaved();reveal();
}
function reset(){clearTimeout(searchTimer);Object.assign(state,{kind:'all',category:'all',area:'all',channel:'all',brand:'all',period:'all',sort:'end',query:'',saved:false,member:false,card:false,limit:9});updateURL();render();}
function tab(id,focus=false){document.querySelectorAll('[data-sale-tab]').forEach(b=>{const on=b.dataset.saleTab===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus();});for(const key of ['conditions','schedule','source'])$('shopping-panel-'+key).hidden=key!==id;}
function openPreview(event,button){opener=button;activeEvent=event;clearTimeout(searchTimer);$('dialog-content').innerHTML='<div class="modal-scroll-area">'+saleDetails(event,{locale,saved})+'</div>'+saleActions(event,{locale,saved});document.body.classList.add('modal-open');dialog.showModal();dialog.querySelector('[data-close-dialog]').focus();syncSaved();}
dialog?.addEventListener('close',()=>{activeEvent=null;document.body.classList.remove('modal-open');opener?.focus();});
dialog?.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
document.addEventListener('click',async event=>{
 const button=event.target.closest('button,a');if(!button)return;
 if(button.dataset.saleSave){const id=button.dataset.saleSave;if(!byId.has(id))return;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];let persisted=true;try{localStorage.setItem(SHOP_STORAGE,JSON.stringify(saved));}catch{persisted=false;}syncSaved();if(state.saved&&!dialog?.open)render();toast(t(persisted?(saved.includes(id)?'할인 보관함에 저장했어요.':'할인 보관함에서 꺼냈어요.'):'이 화면에서만 저장돼요. 브라우저 저장 공간을 사용할 수 없습니다.',locale));return;}
 if(button.dataset.salePreview&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&event.button===0){const item=byId.get(button.dataset.salePreview);if(item){event.preventDefault();openPreview(item,button);}return;}
 if(button.dataset.saleTab){tab(button.dataset.saleTab);return;}
 if(button.hasAttribute('data-close-dialog')){dialog.close();return;}
 if(button.dataset.saleShare){const item=byId.get(button.dataset.saleShare);if(!item)return;const url=languageURL(saleURL(item),locale,location.origin).href;try{if(navigator.share)await navigator.share({title:shoppingText(item,locale).title,url});else{await navigator.clipboard.writeText(url);toast(t('할인 링크를 복사했어요.',locale));}}catch(error){if(error.name!=='AbortError')toast(url);}return;}
 if(button.dataset.shopKind){state.kind=button.dataset.shopKind;state.limit=9;updateURL();render();return;}
 if(button.id==='shop-saved'){state.saved=!state.saved;state.limit=9;updateURL();render();return;}
 if(button.id==='shop-more'){state.limit+=9;render();return;}
 if(button.hasAttribute('data-shop-reset'))reset();
});
$('shopping-filters')?.addEventListener('submit',event=>event.preventDefault());
$('shopping-filters')?.addEventListener('reset',event=>{event.preventDefault();reset();});
for(const key of ['category','area','channel','brand','period','sort'])$('shop-'+key)?.addEventListener('change',event=>{state[key]=event.target.value;state.limit=9;updateURL();render();});
for(const key of ['member','card'])$('shop-'+key)?.addEventListener('change',event=>{state[key]=event.target.checked;state.limit=9;updateURL();render();});
$('shop-query')?.addEventListener('input',event=>{const value=event.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.query=value.slice(0,100);state.limit=9;updateURL();render();},160);});
document.addEventListener('keydown',event=>{const b=event.target.closest?.('[data-sale-tab]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const ids=['conditions','schedule','source'],i=ids.indexOf(b.dataset.saleTab);event.preventDefault();tab(event.key==='Home'?ids[0]:event.key==='End'?ids.at(-1):ids[(i+(event.key==='ArrowRight'?1:2))%3],true);});
window.addEventListener('storage',event=>{if(event.key!==SHOP_STORAGE)return;saved=restoreShoppingSaved(event.newValue,rows);syncSaved();if(state.saved)render();});
let timeSignature='';function refreshTime(){const signature=rows.map(e=>shoppingState(e).code).join('|');if(signature===timeSignature)return;timeSignature=signature;render();document.querySelectorAll('.shopping-inline-status').forEach(el=>{const item=activeEvent||rows.find(e=>location.pathname===saleURL(e));if(item){const status=shoppingState(item);el.textContent=t(status.label,locale);el.className='shopping-inline-status state-'+status.code;}});}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshTime();});setInterval(refreshTime,60000);
motion.addEventListener('change',reveal);
render();syncSaved();refreshTime();setupHeadingMotion({reducedMotion:motion});
