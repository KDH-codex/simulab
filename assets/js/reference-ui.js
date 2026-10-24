export const money=value=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:0}).format(value)+'원';
export const pct=value=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:2}).format(value)+'%';
export const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function value(form,name){const raw=form.elements.namedItem(name).value;if(raw.trim()==='')throw new RangeError('빈 항목을 입력해 주세요.');const n=Number(raw);if(!Number.isFinite(n))throw new RangeError('유효한 숫자를 입력해 주세요.');return n;}
export function boot(read,calculate,render,{deferInitial=false}={}){
 const form=document.getElementById('calculator'),result=document.getElementById('result'),error=document.getElementById('calc-error');
 const run=(recordActivity=false)=>{try{if(!form.checkValidity())throw new RangeError('입력 범위와 필수 항목을 확인해 주세요.');const data=calculate(read(form));render(data,result);error.textContent='';result.hidden=false;if(recordActivity===true){try{window.SimuLabTracker?.trackEvent('calculate');}catch{}}}catch(e){result.hidden=true;error.textContent=e instanceof RangeError?e.message:'계산할 수 없습니다. 입력을 확인해 주세요.';}};
 form.addEventListener('submit',e=>{e.preventDefault();run(true);});form.addEventListener('input',()=>run(true));form.addEventListener('change',()=>run(true));
 document.querySelector('[data-share-tool]')?.addEventListener('click',()=>window.SimuLab?.shareSimulationUrl());if(!deferInitial)run();
}

export const details=rows=>'<dl>'+rows.map(([label,val])=>'<dt>'+escape(label)+'</dt><dd>'+escape(val)+'</dd>').join('')+'</dl>';
