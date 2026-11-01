import {NAME_CANDIDATES,filterNames} from './logic.js?v=20261023_overhaul1';
const key='simulab_name_candidates_v1',allowed=new Set(NAME_CANDIDATES),$=id=>document.getElementById(id);
let saved=[];try{const old=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(old))saved=[...new Set(old)].filter(name=>allowed.has(name));}catch{}
function persist(){try{localStorage.setItem(key,JSON.stringify(saved));}catch{$('nameStatus').textContent='기기 저장이 제한되어 현재 화면에서만 보관합니다.';}}
function render(){
 const list=filterNames($('nameQuery').value,$('nameEnding').value);$('nameCount').textContent='이름 후보 '+list.length+'개 · 가나다순';$('nameEmpty').hidden=!!list.length;
 $('nameCandidates').replaceChildren(...list.map(name=>{const card=document.createElement('div');card.className='name-candidate';const label=document.createElement('span');label.textContent=name;const button=document.createElement('button');button.type='button';button.dataset.name=name;button.textContent=saved.includes(name)?'♥':'♡';button.setAttribute('aria-label',name+' 찜하기');button.setAttribute('aria-pressed',String(saved.includes(name)));button.addEventListener('click',()=>{saved=saved.includes(name)?saved.filter(n=>n!==name):[...saved,name];persist();render();$('nameCandidates').querySelector('button[data-name="'+name+'"]')?.focus({preventScroll:true});$('nameStatus').textContent=name+(saved.includes(name)?' 이름을 찜했습니다.':' 이름을 찜에서 지웠습니다.');});card.append(label,button);return card;}));
 $('savedNames').replaceChildren(...saved.map(name=>{const button=document.createElement('button');button.type='button';button.textContent=name+' ×';button.setAttribute('aria-label',name+' 찜에서 지우기');button.addEventListener('click',()=>{saved=saved.filter(n=>n!==name);persist();render();});return button;}));
 $('copyNames').disabled=!saved.length;$('clearNames').disabled=!saved.length;
}
$('nameFilters').addEventListener('submit',event=>event.preventDefault());$('nameQuery').addEventListener('input',render);$('nameEnding').addEventListener('change',render);
$('clearNames').addEventListener('click',()=>{saved=[];persist();render();$('nameStatus').textContent='찜한 후보를 지웠습니다.';});
$('copyNames').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(saved.join(', '));$('nameStatus').textContent='이름 후보 목록을 복사했습니다.';}catch{$('nameStatus').textContent='직접 복사해 주세요: '+saved.join(', ');}});
render();
