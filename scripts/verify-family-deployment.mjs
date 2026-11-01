import {mkdir,writeFile} from 'node:fs/promises';
import {loadCatalog} from './family-info/catalog.mjs';
const catalog=await loadCatalog(),base='https://simulab.kr',paths=['family-info-calendar',...catalog.categories.filter(c=>!['brand-sales','festivals'].includes(c.id)).map(c=>c.id)];
async function get(url){const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('운영 응답 '+response.status+': '+url);return response;}
const live=await (await get(base+'/feeds/family-info/latest.json?verify='+catalog.snapshotId)).json();
if(live.snapshotId!==catalog.snapshotId)throw new Error('운영 스냅샷 불일치: '+live.snapshotId+' != '+catalog.snapshotId);
for(const id of paths){const html=await (await get(base+'/tools/'+id+'/?verify='+catalog.snapshotId)).text();if(!html.includes('data-family-snapshot="'+catalog.snapshotId+'"')||!html.includes('rel="canonical" href="'+base+'/tools/'+id+'/"'))throw new Error('운영 화면 버전 불일치: '+id);}
const receipt={snapshotId:catalog.snapshotId,siteRevision:live.siteRevision,verifiedAt:new Date().toISOString(),pages:paths.map(id=>base+'/tools/'+id+'/')};await mkdir(new URL('../scratch/',import.meta.url),{recursive:true});await writeFile(new URL('../scratch/family-info-deployment.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
