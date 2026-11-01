import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {coverageForRange,koreaToday,shiftDate,isStale,validateEvent,duplicateRecord} from '../tools/kids-outing-calendar/model.js';
const today=koreaToday(),end=shiftDate(today,60);
const events=JSON.parse(await readFile(new URL('../data/events/reviewed.json',import.meta.url),'utf8'));
const coverage=coverageForRange(events,today,end,today);
const report={reviewedOn:today,window:{start:today,end},total:events.length,
 coverage,missingRegions:coverage.filter(r=>!r.count).map(r=>r.region),
 stale:events.filter(e=>e.endDate>=today&&isStale(e.checkedAt,today)).map(e=>({id:e.id,region:e.region,title:e.title,checkedAt:e.checkedAt})),
 invalid:events.flatMap(e=>{const errors=validateEvent(e,{today});return errors.length?[{id:e.id,errors}]:[];}),
 duplicates:events.flatMap((e,i)=>events.slice(0,i).filter(b=>duplicateRecord(e,b)).map(b=>[b.id,e.id]))};
await mkdir(new URL('../scratch/',import.meta.url),{recursive:true});
await writeFile(new URL('../scratch/event-review-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.table(coverage.map(r=>({region:r.region,next60Days:r.count,fresh:r.freshCount})));
console.log(JSON.stringify({total:report.total,missingRegions:report.missingRegions,stale:report.stale.length,invalid:report.invalid,duplicates:report.duplicates}));
if(report.invalid.length||report.duplicates.length)process.exitCode=1;
