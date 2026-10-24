import {readFile} from 'node:fs/promises';
import {validateSource,validateEvent,eventState,isCalendarEligible} from '../tools/parenting-deals/model.js';
const {sources}=JSON.parse(await readFile(new URL('../data/deals/sources.json',import.meta.url),'utf8'));
const {events}=JSON.parse(await readFile(new URL('../data/deals/reviewed.json',import.meta.url),'utf8'));
let errors=0;
for(const source of sources){const issues=validateSource(source);if(issues.length){errors++;console.error(source.id+': '+issues.join(', '));}}
for(const event of events){const issues=validateEvent(event,sources);if(issues.length){errors++;console.error(event.id+': '+issues.join(', '));}console.log(event.brandId+' · '+event.title+' · '+event.startDate+'~'+event.endDate+' · '+eventState(event).label+(event.holdReason?' · '+event.holdReason:''));}
if(errors)process.exitCode=1;else console.log('Validated '+events.filter(isCalendarEligible).length+' published sales; '+events.filter(e=>!isCalendarEligible(e)).length+' held records; '+sources.length+' tracked brands. No timestamps changed and no external collection performed.');
