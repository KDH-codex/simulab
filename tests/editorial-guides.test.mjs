import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {editorialGuides,guidePillars,GUIDE_DATE} from '../data/guides/catalog.mjs';
import {familyGuides} from '../data/family-guides.mjs';
import {guideSources} from '../data/guides/sources.mjs';
import {toolGuidePairs,exampleSets} from '../data/guides/cases.mjs';
import {coreToolGuides} from '../data/core-tool-guides.mjs';
import {publicationCatalog} from '../scripts/publication.mjs';
import {calculateExamples} from '../scripts/guide-examples.mjs';
test('each core calculator has a real paired guide, three examples, and only public related tools',async()=>{
 const {ids}=await publicationCatalog(),slugs=new Set([...editorialGuides,...familyGuides].map(g=>g.slug));
 assert.equal(slugs.size,28);assert.equal(editorialGuides.length,22);assert.equal(guidePillars.length,3);
 assert.deepEqual(Object.keys(toolGuidePairs).sort(),coreToolGuides.map(g=>g[0]).sort());
 for(const [id,slug] of Object.entries(toolGuidePairs)){assert.ok(slugs.has(slug));assert.ok(exampleSets[id].length>=3);assert.ok(editorialGuides.find(g=>g.slug===slug).caseTools.includes(id));}
 for(const g of editorialGuides){assert.ok(g.sections.length>=3);assert.ok(g.prepare.length>=3);assert.ok(g.mistakes.length>=2);assert.ok(g.timing);assert.ok(g.sources.length||g.records?.length||g.methods);for(const id of g.tools)assert.ok(ids.has(id));for(const slug of g.related)assert.ok(slugs.has(slug));for(const id of g.sources){const s=guideSources[id];assert.ok(s?.scope);assert.ok(s.checkedAt<=GUIDE_DATE);assert.ok(new URL(s.url).protocol==='https:');}}
});
test('published case numbers preserve missing tax, severance eligibility and benefit limits',()=>{
 const pay=calculateExamples('salary-net-calc');assert.equal(pay[0].result.monthlyNetSalary,2221510);assert.equal(pay[1].result.monthlyNetSalary,3069340);assert.equal(pay[2].result.monthlyNetSalary,4258570);assert.equal(pay[3].result.incomeTaxProvided,false);
 const retire=calculateExamples('severance-pay-calc');assert.equal(Math.round(retire[0].result.gross),8812388);assert.equal(retire[3].result.eligible,false);assert.ok(!retire[3].outputs.at(-1)[1].includes('0원'));
 const benefit=calculateExamples('unemployment-benefit-calc');assert.equal(benefit[0].result.totalBenefit,11888640);assert.equal(benefit[1].result.finalDailyBenefit,68100);assert.equal(benefit[2].result.benefitDays,270);assert.equal(benefit[3].result.finalDailyBenefit,33024);
 for(const id of Object.keys(exampleSets))for(const c of calculateExamples(id))for(const [,value] of c.outputs)assert.doesNotMatch(value,/NaN|Infinity|undefined/);
});
test('seasonal articles distinguish confirmed dates, school breaks, and year-specific support',()=>{
 const tax=editorialGuides.find(g=>g.slug==='year-end-tax-checklist-2026');assert.match(tax.timing,/2026-10-28~12-18/);
 const winter=editorialGuides.find(g=>g.slug==='winter-break-program-preparation');assert.match(winter.intro,/공개/);assert.match(winter.timing,/실제 공고/);
 const child=editorialGuides.find(g=>g.slug==='child-allowance-apply-2026');assert.ok(child.sections.some(s=>s[1].includes('2026년 9세 미만, 2027년 10세 미만')));
 const change=editorialGuides.find(g=>g.slug==='changes-2026-to-2027');assert.ok(change.sections.some(s=>s[1].includes('예산안')));
});
test('new guide hub and articles remain readable without JavaScript and point back to calculators',async()=>{
 const winter=await readFile(new URL('../guides/winter-break-program-preparation/index.html',import.meta.url),'utf8');assert.ok(winter.includes('2026-11-25 00:00 KST'));
 const hub=await readFile(new URL('../guides/index.html',import.meta.url),'utf8');for(const g of editorialGuides){assert.ok(hub.includes('/guides/'+g.slug+'/'));const h=await readFile(new URL('../guides/'+g.slug+'/index.html',import.meta.url),'utf8');assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.ok(h.includes(g.title));assert.ok(h.includes('id="sources"'));for(const id of g.tools)assert.ok(h.includes('/tools/'+id+'/'));for(const id of g.caseTools||[])assert.ok(h.includes('data-example-tool="'+id+'"'));}
});
