import {readFile,writeFile} from 'node:fs/promises';
import {validateEvent,REGIONS,isDate,duplicateRecord,koreaToday} from '../tools/kids-outing-calendar/model.js';
const root=new URL('../',import.meta.url),today=koreaToday();
const records=JSON.parse(await readFile(new URL('data/events/reviewed.json',root),'utf8'));
const registry=JSON.parse(await readFile(new URL('data/events/sources.json',root),'utf8'));
if(!Array.isArray(records)||!records.length)throw new Error('Reviewed records cannot be empty');
const ids=new Set();
for(const [i,event] of records.entries()){
 const errors=validateEvent(event,{today});
 if(ids.has(event.id))errors.push('중복 ID');ids.add(event.id);
 if(records.slice(0,i).some(other=>duplicateRecord(event,other)))errors.push('동일 행사 중복');
 if(!event.sources.some(source=>source.checkedAt===event.checkedAt))errors.push('행사 확인일과 일치하는 근거 없음');
 if(errors.length)throw new Error(event.id+': '+errors.join(', '));
}
if(registry.length!==REGIONS.length-1||new Set(registry.map(s=>s.region)).size!==registry.length||REGIONS.slice(1).some(region=>!registry.some(s=>s.region===region)))throw new Error('Regional registry must cover all search regions');
for(const row of registry)if(!row.sources?.length||row.sources.some(s=>!s.publisher||!/^https:\/\//.test(s.url)))throw new Error('Invalid regional source');
const reviewedAt=records.map(e=>e.checkedAt).filter(isDate).sort().at(-1);
const generated='// Generated from data/events/reviewed.json. Edit reviewed records, not this file.\n// checkedAt is an editorial review date, never a build or collection timestamp.\nexport const DATA_REVIEWED_AT = '+JSON.stringify(reviewedAt)+';\nexport const REGION_SOURCES = '+JSON.stringify(registry,null,2)+';\nexport const FESTIVALS = '+JSON.stringify(records,null,2)+';\n';
const output=new URL('tools/kids-outing-calendar/data.js',root);
if(process.argv.includes('--check')){
 if(await readFile(output,'utf8')!==generated)throw new Error('Browser event data is stale; run npm run build');
}else if(await readFile(output,'utf8').catch(()=>null)!==generated)await writeFile(output,generated);
console.log('Validated reviewed events: '+records.length+'; regional sources: '+registry.length+'.');
