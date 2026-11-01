import {escapeHtml as esc} from '../../assets/js/html-utils.js';
import {safeCount} from './metrics.js';
export function rankingRows(values,titles={}) {
  return Object.entries(values||{}).map(([id,n])=>[id,safeCount(n)]).sort((a,b)=>b[1]-a[1]).slice(0,10)
    .map(([id,n],i)=>'<li><span class="admin-rank">'+(i+1)+'</span><span>'+esc(titles[id]||id)+'</span><strong>'+n.toLocaleString('ko-KR')+'</strong></li>').join('')||'<li class="admin-empty">아직 집계된 기록이 없습니다.</li>';
}
export function eventRows(events,titles={}) {
  const actions={calculate:'계산 실행',share:'공유',game_complete:'게임 완료',copy_share_url:'공유 링크 복사',reset:'초기화'};
  return (Array.isArray(events)?events:[]).slice(0,12).map(e=>'<li><time>'+esc(e.time||'')+'</time><span>'+esc(titles[e.tool]||e.tool||'')+'</span><small>'+esc(actions[e.action]||'도구 이용')+'</small></li>').join('')||'<li class="admin-empty">아직 집계된 이용 기록이 없습니다.</li>';
}
