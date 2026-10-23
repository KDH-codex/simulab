import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {koreaToday,shiftDate} from '../tools/kids-outing-calendar/model.js';
import {collectTourAPI} from './events/tourapi.mjs';
import {fromTourAPI,fromStandard,parseCSV,prepareCandidates} from './events/candidates.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');return i<0?[arg.replace(/^--/,''),true]:[arg.slice(2,i),arg.slice(i+1)];}));
const today=koreaToday(),fetchedAt=new Date().toISOString(),end=shiftDate(today,60);
try{
 let records,provider=args.provider||'tourapi';
 if(provider==='standard-csv'){
  if(!args.file)throw new Error('--file=공식CSV경로가 필요합니다.');
  const bytes=await readFile(path.resolve(root,args.file));let text;
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('euc-kr',{fatal:true}).decode(bytes);}
  records=parseCSV(text).map(row=>fromStandard(row,fetchedAt));
 }else if(provider==='tourapi'){
  const result=await collectTourAPI({serviceKey:process.env.TOURAPI_SERVICE_KEY,today});
  if(result.status==='skipped'){console.log(result.reason+' — API 수집은 실행하지 않았고 공개 정보도 바꾸지 않았습니다.');process.exit(0);}
  records=result.items.map(row=>fromTourAPI(row,fetchedAt,result.areaNames));
 }else throw new Error('지원하지 않는 공급자');
 const result=prepareCandidates(records,{start:today,end});
 const destination=path.join(root,'scratch','event-candidates-'+provider+'.json');
 await mkdir(path.dirname(destination),{recursive:true});
 const temp=destination+'.tmp';await writeFile(temp,JSON.stringify({provider,fetchedAt,window:{start:today,end},...result},null,2)+'\n');await rename(temp,destination);
 console.log(JSON.stringify({provider,candidates:result.candidates.length,quarantine:result.quarantine.length,discarded:result.discarded.length,output:path.relative(root,destination),publication:'수동 검토 대기 · 공개 달력 변경 없음'}));
}catch(error){console.error(error.message);process.exitCode=1;}
