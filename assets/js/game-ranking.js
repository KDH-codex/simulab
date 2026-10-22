// User-submitted leaderboards. Remote writes use a validating RPC after setup.
(function(global){
 'use strict';
 const GAMES=new Set(['game-tetris','game-dodge','game-typing','game-brick-breaker']);
 const connection=new Map(),messages=new Map(),boards=new Map(),pending=new Map();
 let override=null;
 const storageKey=id=>'simulab_ranking_'+id+'_v2';
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function config(){const cfg=override||global.SIMULAB_SUPABASE_CONFIG,s=global.SIMULAB_SITE_SETTINGS;return s?.rankingRemoteEnabled===true&&s.contactEmail&&s.databaseRegion&&cfg?.url&&cfg?.anonKey?cfg:null;}
 function validScore(id,score){return GAMES.has(id)&&Number.isFinite(Number(score))&&Number(score)>0&&Number(score)<1e9&&(id!=='game-dodge'||Number(score)<=3600);}
 function normalize(row){return {nickname:String(row.nickname||'').slice(0,12),score:Number(row.score),display:String(row.display??row.score_display??row.score).slice(0,80),date:String(row.date||formatDate(row.created_at))};}
 function formatDate(value){const date=value?new Date(value):new Date();if(!Number.isFinite(date.getTime()))return '';return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(date);}
 function read(id){try{const rows=JSON.parse(localStorage.getItem(storageKey(id))||'[]');return Array.isArray(rows)?rows.filter(row=>row&&validScore(id,row.score)).map(normalize).sort((a,b)=>b.score-a.score).slice(0,10):[];}catch{return [];}}
 function cache(id,rows){try{localStorage.setItem(storageKey(id),JSON.stringify(rows.slice(0,10)));}catch{}}
 function update(id){boards.get(id)?.forEach(render=>render());}
 function status(id){return config()?(connection.get(id)||'loading'):'local';}
 const GameRanking={
 configure(value){override=value;},isCloudEnabled:()=>Boolean(config()),getRankings:read,
 checkRank(id,score){if(!validScore(id,score))return {isTop10:false,expectedRank:-1};const rank=1+read(id).filter(row=>row.score>=Number(score)).length;return {isTop10:rank<=10,expectedRank:rank<=10?rank:-1};},
 async fetchRankingsOnline(id){
  const cfg=config();if(!cfg||!GAMES.has(id))return read(id);connection.set(id,'loading');update(id);
  try{const response=await fetch(cfg.url+'/rest/v1/game_rankings?select=nickname,score,score_display,created_at&game_id=eq.'+encodeURIComponent(id)+'&order=score.desc,created_at.asc&limit=10',{headers:{apikey:cfg.anonKey,Authorization:'Bearer '+cfg.anonKey}});
   if(!response.ok)throw new Error('offline');const rows=await response.json();if(!Array.isArray(rows))throw new Error('invalid response');const list=rows.filter(row=>row&&validScore(id,row.score)).map(normalize);cache(id,list);connection.set(id,'online');update(id);return list;
  }catch{connection.set(id,'failed');update(id);return read(id);}
 },
 saveRecord(id,nickname,score,display){
  const nick=String(nickname||'').trim();if(!validScore(id,score)||nick.length<2||nick.length>12||/[<>\x00-\x1f]/.test(nick))return -1;
  const record={nickname:nick,score:Number(score),display:String(display||score).slice(0,80),date:formatDate(),isNew:true};
  const rows=[...read(id),record].sort((a,b)=>b.score-a.score).slice(0,10);const rank=rows.indexOf(record)+1;
  cache(id,rows.map(({isNew,...row})=>row));messages.set(id,'이 기기에 저장했습니다.');update(id);return rank||-1;
 },
 async saveRecordAsync(id,nickname,score,display){
  if(pending.has(id))return pending.get(id);
  const rank=GameRanking.saveRecord(id,nickname,score,display);if(rank<1)return {status:'invalid',rank:-1,message:'닉네임과 점수를 확인해 주세요.'};
  const cfg=config();if(!cfg)return {status:'local',rank,message:'이 기기에 저장했습니다.'};
  const task=Promise.resolve().then(async()=>{
   try{let submitter=localStorage.getItem('simulab_ranking_submitter_v1');if(!/^[0-9a-f-]{36}$/i.test(submitter||'')){submitter=crypto.randomUUID();localStorage.setItem('simulab_ranking_submitter_v1',submitter);}
    const response=await fetch(cfg.url+'/rest/v1/rpc/submit_game_score',{method:'POST',headers:{apikey:cfg.anonKey,Authorization:'Bearer '+cfg.anonKey,'Content-Type':'application/json'},body:JSON.stringify({p_game_id:id,p_nickname:String(nickname).trim(),p_score:Number(score),p_submitter_id:submitter,p_submission_id:crypto.randomUUID()})});
    if(!response.ok)throw new Error('write rejected');messages.set(id,'서버에 기록을 등록했습니다.');await GameRanking.fetchRankingsOnline(id);return {status:'saved',rank,message:messages.get(id)};
   }catch{messages.set(id,'서버 등록에 실패해 이 기기에만 보관했습니다. 잠시 후 연결 상태를 확인해 주세요.');connection.set(id,'failed');update(id);return {status:'failed',rank,message:messages.get(id)};}
   finally{pending.delete(id);}
  });pending.set(id,task);return task;
 },
 renderBoard(container,id){
  if(!container||!GAMES.has(id))return;
  if(!boards.has(id))boards.set(id,new Map());const renders=boards.get(id);
  const render=()=>{const state=status(id),labels={local:'이 기기에 보관',loading:'서버 조회 중',online:'서버 조회 완료',failed:'연결 실패 · 기기 기록 표시'};const rows=read(id);
   container.innerHTML='<div class="ranking-board-card"><div class="ranking-board-header"><strong>게임 기록 TOP 10</strong><span style="font-size:12px">'+labels[state]+'</span></div><div class="ranking-list-body">'+(rows.length?rows.map((row,i)=>'<div class="ranking-row"><span class="ranking-col-rank">'+(i+1)+'</span><span class="ranking-col-nick" title="'+escape(row.nickname)+'">'+escape(row.nickname)+'</span><strong class="ranking-col-score">'+escape(row.display)+'</strong><time class="ranking-col-date">'+escape(row.date)+'</time></div>').join(''):'<p style="padding:22px;font-size:14px;text-align:center">아직 저장된 기록이 없습니다.</p>')+'</div><p style="padding:12px 16px;font-size:12px;line-height:1.8;color:var(--text-muted)">사용자가 제출한 기록이며 실제 플레이를 인증한 순위는 아닙니다. 실명·연락처를 닉네임으로 쓰지 마세요.<br><span role="status">'+escape(messages.get(id)||'')+'</span></p></div>';
  };renders.set(container,render);render();if(config())GameRanking.fetchRankingsOnline(id);
 }
 };
 global.GameRanking=GameRanking;
})(typeof window!=='undefined'?window:globalThis);
