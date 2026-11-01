const toc=document.querySelector('[data-article-toc]');if(toc&&matchMedia('(max-width:900px)').matches)toc.open=false;
document.querySelector('[data-guide-share]')?.addEventListener('click',()=>window.SimuLab?.shareSimulationUrl());
const input=document.getElementById('guide-search');
if(input){
 let category='all';
 const cards=[...document.querySelectorAll('[data-editorial-card]')];
 const filter=()=>{const words=input.value.normalize('NFKC').trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);let count=0;for(const card of cards){const text=card.dataset.search.normalize('NFKC').toLocaleLowerCase('ko-KR');const show=(category==='all'||card.dataset.pillar===category)&&words.every(w=>text.includes(w));card.hidden=!show;if(show)count++;}for(const section of document.querySelectorAll('[data-pillar-section]'))section.hidden=![...section.querySelectorAll('[data-editorial-card]')].some(c=>!c.hidden);document.getElementById('guide-status').textContent=count+'편을 찾았습니다.';document.getElementById('guide-empty').hidden=count>0;};
 input.addEventListener('input',filter);input.form.addEventListener('submit',e=>{e.preventDefault();filter();});
 for(const button of document.querySelectorAll('[data-guide-filter]'))button.addEventListener('click',()=>{category=button.dataset.guideFilter;for(const b of document.querySelectorAll('[data-guide-filter]'))b.setAttribute('aria-pressed',String(b===button));filter();});
 const initial=new URL(location.href).searchParams.get('q');if(initial){input.value=initial.slice(0,100);filter();}
}
