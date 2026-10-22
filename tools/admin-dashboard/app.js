import {signInAdmin,restoreAdminSession,getAnalyticsData,adminLogout} from './logic.js?v=20261023_overhaul1';
import {calculateKpis,exportToCsv,safeCount} from './metrics.js';
import {rankingRows,eventRows} from './render.js';
const $=id=>document.getElementById(id);
const titles=Object.fromEntries((window.SimuLab?.SITE_MENU||[]).flatMap(g=>g.items.map(t=>[t.tool,t.title])));
titles['home-portal']='홈';
let days=7,latest=null,busy=false;
function signedOut(message=''){ $('adminDashboard').hidden=true;$('adminLogin').hidden=false;$('loginMessage').textContent=message;latest=null; }
function draw(daily){
 const canvas=$('analyticsChart'),ctx=canvas.getContext('2d'),width=canvas.clientWidth||600,height=230,dpr=devicePixelRatio||1;
 canvas.width=width*dpr;canvas.height=height*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,width,height);
 const entries=Object.entries(daily||{}).sort(([a],[b])=>a.localeCompare(b));
 const maximum=Math.max(1,...entries.map(([,v])=>safeCount(v.pv)));
 ctx.font='11px system-ui';ctx.fillStyle='#70816c';
 if(!entries.length){ctx.fillText('집계된 데이터가 없습니다.',20,100);return;}
 const start=35,end=width-15,base=195,step=(end-start)/Math.max(1,entries.length-1);
 ctx.strokeStyle='#dce5de';ctx.beginPath();ctx.moveTo(start,20);ctx.lineTo(start,base);ctx.lineTo(end,base);ctx.stroke();
 const points=[];
 entries.forEach(([date,v],i)=>{const x=start+i*step,pv=safeCount(v.pv),sessions=safeCount(v.uv);ctx.fillStyle='#c4decf';ctx.fillRect(x-5,base-pv/maximum*160,10,pv/maximum*160);points.push([x,base-sessions/maximum*160]);if(i%Math.ceil(entries.length/6)===0){ctx.fillStyle='#70816c';ctx.fillText(date.slice(5),Math.max(0,x-13),218);}});
 ctx.strokeStyle='#176d53';ctx.lineWidth=2;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
 points.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fillStyle='#176d53';ctx.fill();});
}
function render(data){
 latest=data;const k=calculateKpis(data),number=n=>n.toLocaleString('ko-KR');
 $('kpiSessions').textContent=number(k.todaySessions);$('kpiPv').textContent=number(k.todayPv);$('kpiChange').textContent='전일 대비 '+k.change;$('kpiAverage').textContent='세션당 '+k.avgPv+'회';
 $('kpiPeriodSessions').textContent=number(k.periodSessions);$('kpiPeriodPv').textContent='페이지 조회 '+number(k.periodPv)+'회';$('kpiTop').textContent=titles[k.topTool]||k.topTool;$('kpiTopViews').textContent=number(k.topViews)+'회';
 $('toolRankings').innerHTML=rankingRows(data.toolRanking,titles);$('landingRankings').innerHTML=rankingRows(data.landingPages,titles);$('recentEvents').innerHTML=eventRows(data.recentEvents,titles);
 $('adminLogin').hidden=true;$('adminDashboard').hidden=false;$('connectionStatus').textContent='서버 집계 · 마지막 조회 '+new Date().toLocaleTimeString('ko-KR');
 $('chartDescription').textContent='연한 막대: 페이지 조회 · 초록 선: 세션 수. 선택 기간 총 페이지 조회 '+number(k.periodPv)+'회.';
 draw(data.daily);
}
async function refresh(){if(busy)return;busy=true;$('refreshAnalytics').disabled=true;try{render(await getAnalyticsData(days));}catch(error){signedOut(error.message);}finally{busy=false;$('refreshAnalytics').disabled=false;}}
$('adminLoginForm').addEventListener('submit',async event=>{event.preventDefault();if(busy)return;busy=true;$('adminSignIn').disabled=true;$('loginMessage').textContent='서버에서 인증과 관리자 권한을 확인하고 있습니다.';try{days=7;render(await signInAdmin($('adminEmail').value,$('adminPassword').value));$('adminPassword').value='';}catch(error){signedOut(error.message);}finally{busy=false;$('adminSignIn').disabled=false;}});
$('adminSignOut').addEventListener('click',async()=>{signedOut();await adminLogout();});
$('refreshAnalytics').addEventListener('click',refresh);
document.querySelectorAll('[data-days]').forEach(button=>button.addEventListener('click',()=>{if(busy)return;days=Number(button.dataset.days);document.querySelectorAll('[data-days]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));refresh();}));
$('exportAnalytics').addEventListener('click',()=>{if(!latest)return;const url=URL.createObjectURL(new Blob([exportToCsv(latest)],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='simulab-analytics.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),0);});
window.addEventListener('resize',()=>{if(latest)draw(latest.daily);});
try{const data=await restoreAdminSession();if(data)render(data);}catch(error){signedOut(error.message);}
