import {mkdir,writeFile} from 'node:fs/promises';
const base='https://simulab.kr';
const checks=[
 ['/', ['AI는 토론하고', '당신이 판정합니다.', '/library/', '/debates/001/']],
 ['/library/', ['도구와 생활정보는', 'data-archived-tool', 'salary-net-calc', 'https://simulab.kr/library/']],
 ['/debates/001/', ['https://simulab.kr/debates/001/', '97/100자', '91/100자', '내 브라우저에만 남기는 시범 판정']],
 ['/assets/css/debate-home.css', ['.home-nav']],
 ['/assets/js/ai-debate.js', ['localStorage']],
];
for(const [path,needles] of checks){
 const response=await fetch(base+path+'?verify=debate-home-v1',{cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(path+': HTTP '+response.status);
 const text=await response.text();
 for(const needle of needles)if(!text.includes(needle))throw new Error(path+': missing '+needle);
 console.log('Verified '+path);
}
const receipt={verifiedAt:new Date().toISOString(),pages:checks.map(([path])=>base+path)};
await mkdir(new URL('../scratch/',import.meta.url),{recursive:true});
await writeFile(new URL('../scratch/debate-deployment.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');
