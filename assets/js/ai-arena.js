const file=document.querySelector('#file'),status=document.querySelector('#status'),root=document.querySelector('#result');
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n};
async function showRecord(text){
 root.replaceChildren();
 try{
  const m=JSON.parse(text);if(m.version!==1||!/^\d{3}-m\d{3}$/.test(m.id||'')||!Array.isArray(m.rounds)||m.rounds.length>4)throw Error('경기 기록 형식이 아닙니다.');
  const head=el('div',undefined,'match-head');head.append(el('h3',`경기 ${m.id} · ${m.status==='complete'?'완료':'진행 중'}`),el('p',m.status==='complete'?`자동 채점 · GPT ${m.scores?.GPT} : ${m.scores?.Gemini} Gemini · ${m.winner}`:'완료된 응답부터 표시합니다.'));root.append(head);
  for(const round of m.rounds){const section=el('section',undefined,'result-round');section.append(el('h3',round.name),el('p',round.prompt));const grid=el('div',undefined,'reply-grid');
   for(const name of ['GPT','Gemini']){const r=round.responses?.[name];const card=el('div',undefined,'reply');card.append(el('h4',name));if(r){card.append(el('p',`${r.model} · ${r.effort} · 호출 전체 ${(r.elapsedMs/1000).toFixed(1)}초`),el('pre',r.text),el('p',r.judgment?.pass===null?'관객 판정':r.judgment?.pass?'✓ 통과':'✕ 미통과',r.judgment?.pass===null?'':r.judgment?.pass?'pass':'fail'),el('p',r.judgment?.reason||''))}else card.append(el('p','응답 대기 중'));grid.append(card)}
   section.append(grid);if(round.id==='comedy'&&round.responses?.GPT&&round.responses?.Gemini){const vote=el('div',undefined,'audience-vote'),label=el('p','내가 더 웃긴 쪽 · 이 기기에만 저장');vote.append(label);const key='simulab-arena-vote-'+m.id;let saved;try{saved=localStorage.getItem(key)}catch{}const result=el('p',saved?`내 선택: ${saved}`:'아직 선택하지 않았습니다.');for(const name of ['GPT','Gemini']){const button=el('button',name+' 선택');button.type='button';button.addEventListener('click',()=>{try{localStorage.setItem(key,name);result.textContent=`내 선택: ${name} · 이 기기에 저장됨`}catch{result.textContent=`내 선택: ${name} · 현재 탭에만 표시`}});vote.append(button)}vote.append(result);section.append(vote)}root.append(section);
  }
  status.textContent='기록을 불러왔습니다. 시간에는 CLI 실행과 대기 시간이 포함되며 토큰·비용은 측정하지 않습니다.';
 }catch{status.textContent='경기 기록을 읽지 못했습니다. 진행실의 result.json 파일인지 확인해 주세요.'}
}
file.addEventListener('change',async()=>{const f=file.files?.[0];if(!f)return;if(f.size>1024*1024){status.textContent='1MB 이하의 경기 기록을 선택해 주세요.';return}await showRecord(await f.text())});
try{const r=await fetch('/debates/arena/matches/001-m001.json');if(r.ok)await showRecord(await r.text())}catch{}
