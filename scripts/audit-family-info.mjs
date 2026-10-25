import {loadCatalog,readJson} from './family-info/catalog.mjs';
import {filterRecords,isStaleRecord,DAY_NAMES} from '../tools/family-info-calendar/model.js';
const catalog=await loadCatalog(),id=process.argv.find(a=>a.startsWith('--category='))?.slice(11);
if(id&&!catalog.categories.some(c=>c.id===id))throw new Error('등록되지 않은 분야: '+id);
const categories=catalog.categories.filter(c=>!id||c.id===id),held=await readJson('data/family-info/held.json');
for(const c of categories){const records=catalog.records.filter(r=>r.categoryIds.includes(c.id));console.log(JSON.stringify({category:c.id,name:c.name,verified:records.length,current:filterRecords(records).length,stale:records.filter(r=>isStaleRecord(r)).length,held:held.records.filter(r=>r.categoryIds?.includes(c.id)).length,collectionSlot:DAY_NAMES[c.day]+' '+c.hour+'시 무렵',blogDay:DAY_NAMES[c.blogDay],outcome:c.outcome,lastVerifiedAt:c.lastVerifiedAt,providers:catalog.providers.filter(p=>p.categoryIds.includes(c.id)).map(p=>p.id)}));}
console.log('Schema and schedule validated. This audit does not collect sources or certify factual accuracy.');
