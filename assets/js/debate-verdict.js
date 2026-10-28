export const criteria=[['overall','최종 선택'],['humor','유머(센스)'],['logic','논리']];
export const models=['GPT','Gemini'],storageKey='simulab-ai-debate-verdicts-v2';
export function validBallot(b){return Boolean(b&&b.episodeId==='001'&&criteria.every(([id])=>models.includes(b[id]))&&typeof b.comment==='string'&&b.comment.length<=300);}
export function readBallots(storage){try{const b=JSON.parse(storage.getItem(storageKey));return Array.isArray(b)?b.filter(validBallot):[];}catch{return [];}}
export function saveBallot(storage,b){if(!validBallot(b))throw Error('Invalid ballot');const list=readBallots(storage).filter(x=>x.episodeId!==b.episodeId);list.push(b);storage.setItem(storageKey,JSON.stringify(list));return list;}
export function standings(ballots){const rows=models.map(model=>({model,...Object.fromEntries(criteria.map(([id])=>[id,{wins:0,losses:0}]))}));for(const b of ballots.filter(validBallot))for(const row of rows)for(const [id]of criteria)row[id][b[id]===row.model?'wins':'losses']++;return rows;}
