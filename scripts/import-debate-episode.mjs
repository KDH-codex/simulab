// Run deliberately when an episode is approved. Production builds use the snapshot,
// so they never need private conversation folders or model credentials.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),turns=[];
for(let n=1;n<=8;n++){
 const owner=n%2?'gemini':'codex',source=new URL(`Discussion/${owner}/episodes/001/T${n}.md`,root),bytes=await readFile(source),text=bytes.toString('utf8').replace(/\r\n/g,'\n');
 const body=text.match(/^본문:\n([\s\S]*?)\n\n본문 글자 수:/m)?.[1],revision=Number(text.match(/^기록 리비전: (\d+)$/m)?.[1]);
 if(!/^상태: FINAL$/m.test(text)||!body||!revision||body.length>(n>6?100:1000))throw new Error(`Unapproved or oversized T${n}`);
 turns.push({id:`T${n}`,model:owner==='gemini'?'Gemini':'GPT',version:owner==='gemini'?'3.8 Flash':'6.1 Sol',effort:'Medium',stance:owner==='gemini'?'면접 보러 간다':'공항 간다',kind:n>6?'closing':'debate',body,characters:body.length,revision,sourceHash:createHash('sha256').update(bytes).digest('hex'),sources:n>6?['같은 본 토론 6개를 읽고 각 모델이 독립적으로 작성한 짧은 최후변론입니다.','새로운 통계나 외부 사실을 인용하지 않았습니다.']:['사용자 제공 문제판의 가상 질문: 공항 여행과 최종면접 중 하나를 선택하며 합격 확률은 50%입니다.','원문의 사례·예측과 가치 판단은 해당 모델의 주장입니다. 문제에 주어지지 않은 조건과 구분해 읽어주세요.']});
}
const episode={id:'001',slug:'001',status:'published',rulesVersion:'0.3',date:'2026-10-28',title:'최종면접 날, 공항으로 갈 것인가.',question:'대기업 최종면접 날, 신민아가 여행 가자고 공항에서 기다린다면?',choices:['공항 간다','면접 보러 간다'],condition:'합격 확률은 50%',originalBroadcast:{status:'unverified',winner:null,url:null},referenceImage:'/assets/debates/001-reference.jpg',turns};
await mkdir(new URL('data/debates/',root),{recursive:true});
await writeFile(new URL('data/debates/001.json',root),JSON.stringify(episode,null,2)+'\n');
console.log('Imported EP.001: 6 debate turns + 2 real FINAL closings; no private paths or credentials.');
