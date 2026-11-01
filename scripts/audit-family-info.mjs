import {loadCatalog,readJson} from './family-info/catalog.mjs';
import {filterRecords,isStaleRecord,DAY_NAMES} from '../tools/family-info-calendar/model.js';
import {researchCoverage} from './family-info/research.mjs';
const catalog=await loadCatalog(),id=process.argv.find(a=>a.startsWith('--category='))?.slice(11);
if(id&&!catalog.categories.some(c=>c.id===id))throw new Error('등록되지 않은 분야: '+id);
const categories=catalog.categories.filter(c=>!id||c.id===id),held=await readJson('data/family-info/held.json');
const research=await readJson('data/family-info/research.json'),schedule=await readJson('data/family-info/schedule.json'),runId=process.argv.find(a=>a.startsWith('--run='))?.slice(6),minimum=schedule.researchPolicy.minimumDetailedNoticesPerCategory;
let shortfall=false;
for(const c of categories){const current=filterRecords(catalog.records,{category:c.id}).length,coverage=researchCoverage(c.id,research.reviews,{minimum,runId});if(!coverage.targetMet)shortfall=true;console.log(JSON.stringify({category:c.id,research:coverage,currentPublicRecords:current,currentPublicTarget:schedule.researchPolicy.currentVerifiedRecordsTarget,publicShortfall:Math.max(0,schedule.researchPolicy.currentVerifiedRecordsTarget-current)}));}
for(const c of categories){const records=catalog.records.filter(r=>r.categoryIds.includes(c.id));console.log(JSON.stringify({category:c.id,name:c.name,verified:records.length,current:filterRecords(records).length,stale:records.filter(r=>isStaleRecord(r)).length,held:held.records.filter(r=>r.categoryIds?.includes(c.id)).length,collectionSlot:DAY_NAMES[c.day]+' '+c.hour+'시 무렵',blogDay:DAY_NAMES[c.blogDay],outcome:c.outcome,lastVerifiedAt:c.lastVerifiedAt,providers:catalog.providers.filter(p=>p.categoryIds.includes(c.id)).map(p=>p.id)}));}
console.log('Schema and schedule validated. This audit does not collect sources or certify factual accuracy.');
if(process.argv.includes('--require-minimum')){if(!runId)throw new Error('--require-minimum에는 이번 실행의 --run=ID가 필요합니다.');if(shortfall){console.error('이번 실행의 항목별 상세 조사 최소 15건 기준 미달');process.exitCode=2;}}
