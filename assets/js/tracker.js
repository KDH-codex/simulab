// Optional aggregate analytics. Never send calculator inputs or free-text labels.
(function (global) {
  'use strict';
  if (global.__simulabTrackerInitialized) return;
  global.__simulabTrackerInitialized = true;
  const path=location.pathname;
  const isPrivate=/\/(admin|legal)\/|\/admin-dashboard\//.test(path);
  let recorded=false;
  function allowed() { return !global.SIMULAB_PREVIEW && !isPrivate && global.document?.body?.dataset?.publicationState!=='archived' && global.SimuLabPrivacy?.analyticsAllowed() === true; }
  function sessionId() {
    try { let id=sessionStorage.getItem('simulab_session_id_v3'); if(!id) { id=crypto.randomUUID(); sessionStorage.setItem('simulab_session_id_v3',id); } return id; } catch { return null; }
  }
  function toolId() { if(path.startsWith('/guides/')){const owner=global.document?.body?.dataset?.analyticsTool;return ['family-info-calendar','pay-work-guide','living-cost-guide'].includes(owner)?owner:'family-info-calendar';}return path.match(/\/tools\/([a-z0-9-]+)\//)?.[1] || 'home-portal'; }
  async function post(table,body) {
    const cfg=global.SIMULAB_SUPABASE_CONFIG; if(!allowed() || !cfg?.url || !cfg?.anonKey) return;
    try { await fetch(cfg.url+'/rest/v1/rpc/record_site_activity',{method:'POST',headers:{apikey:cfg.anonKey,Authorization:'Bearer '+cfg.anonKey,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({p_session_id:body.session_id,p_tool_id:body.tool_id,p_action:table==='analytics_pageviews'?'page_view':body.event_action}),keepalive:true}); } catch {}
  }
  function pageview() {
    if(recorded || !allowed()) return;
    const id=sessionId(); if(!id) return; recorded=true;
    let landing=false; try {landing=!sessionStorage.getItem('simulab_has_visited_v3');sessionStorage.setItem('simulab_has_visited_v3','1');} catch {}
    post('analytics_pageviews',{session_id:id,tool_id:toolId(),path:toolId()==='home-portal'?'/':'/tools/'+toolId()+'/',referrer:'',user_agent:'',is_landing_page:landing});
  }
  global.SimuLabTracker={trackEvent(action) {
    const supported=new Set(['calculate','share','game_complete','copy_share_url','reset']);
    if(!allowed() || !supported.has(action)) return;
    const id=sessionId(); if(id) post('analytics_events',{session_id:id,tool_id:toolId(),event_category:'interaction',event_action:action,event_label:''});
  }};
  global.addEventListener('simulab:privacychange',pageview); pageview();
})(window);
