export const OFFICIAL_HOSTS=new Set(['www.work24.go.kr','www.childcare.go.kr','www.idolbom.go.kr','www.moel.go.kr','1350.moel.go.kr','price.go.kr','nid.naver.com','smartchoice.or.kr','www.myhome.go.kr']);
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function koreaDate(now=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(now);}
export function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00+09:00'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function safeSourceUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&OFFICIAL_HOSTS.has(u.hostname)?u.href:null;}catch{return null;}}
export function sourceState(source,now=new Date()){
 const valid=validDate(source.checkedAt)&&source.checkedAt<=koreaDate(now);
 if(!valid)return {code:'unverified',label:'확인일 점검 필요'};
 const age=Math.floor((Date.parse(koreaDate(now)+'T00:00:00+09:00')-Date.parse(source.checkedAt+'T00:00:00+09:00'))/86400000);
 return age>30?{code:'stale',label:'출처 재확인 권장'}:{code:'checked',label:'출처 확인'};
}
export function validateCatalog(data,now=new Date()){
 const errors=[],unique=(rows,key)=>new Set(rows.map(r=>r[key])).size===rows.length;
 if(data.version!==1||!Array.isArray(data.guides)||!Array.isArray(data.sources)||!Array.isArray(data.items))return ['Invalid catalog structure'];
 for(const [name,rows]of [['guide',data.guides],['source',data.sources],['item',data.items]])if(!unique(rows,'id'))errors.push('Duplicate '+name+' IDs');
 for(const g of data.guides)if(!/^[a-z0-9-]+$/.test(g.id)||!g.name||!g.title||!g.description||!Object.keys(g.categories||{}).length)errors.push('Invalid guide '+g.id);
 for(const s of data.sources)if(!safeSourceUrl(s.url)||!s.name||!s.title||!validDate(s.checkedAt)||s.checkedAt>koreaDate(now))errors.push('Invalid source '+s.id);
 for(const item of data.items){const guide=data.guides.find(g=>g.id===item.guide);if(!/^[a-z0-9-]+$/.test(item.id)||!guide||!guide.categories[item.category]||!item.title||!item.summary||!item.audience||!Array.isArray(item.checks)||item.checks.length<2||!data.sources.some(s=>s.id===item.source)||!Array.isArray(item.keywords)||item.tool&&!/^[a-z0-9-]+$/.test(item.tool))errors.push('Invalid item '+item.id);}
 return errors;
}
export function filterItems(items,{category='all',query=''}={}){
 const words=String(query).normalize('NFKC').trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);
 return items.filter(i=>(category==='all'||i.category===category)&&words.every(w=>[i.title,i.summary,i.audience,...i.checks,...i.keywords].join(' ').normalize('NFKC').toLocaleLowerCase('ko-KR').includes(w)));
}
export function renderGuideCard(item,source,{toolName='',now=new Date()}={}){
 const e=escapeHtml,state=sourceState(source,now),href=safeSourceUrl(source.url);if(!href)throw new Error('Invalid source URL');
 return `<article class="guide-card" id="${e(item.id)}" data-guide-card="${e(item.id)}"><div class="guide-card-top"><span class="guide-source-label">${e(source.name)}</span><span class="guide-check-date ${state.code}">${e(state.label)} <time datetime="${e(source.checkedAt)}">${e(source.checkedAt.replaceAll('-','.'))}</time></span></div><h3>${e(item.title)}</h3><p class="guide-card-summary">${e(item.summary)}</p><p class="guide-audience"><span>이런 분께</span> ${e(item.audience)}</p><details class="guide-checklist"><summary>확인할 항목 ${item.checks.length}가지 <span aria-hidden="true">＋</span></summary><ul>${item.checks.map(c=>'<li>'+e(c)+'</li>').join('')}</ul></details><div class="guide-card-actions"><a class="guide-official-link" href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(source.name)} 안내 <span aria-hidden="true">↗</span><span class="sr-only"> (새 창)</span></a>${item.tool?`<a class="guide-tool-link" href="/tools/${e(item.tool)}/">${e(toolName||'관련 계산기')} ↗</a>`:''}<button type="button" class="guide-copy" data-copy-guide="${e(item.id)}" hidden>이 안내 공유</button></div></article>`;
}
