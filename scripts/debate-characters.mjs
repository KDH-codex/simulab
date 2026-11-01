import {readdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {writeFile} from './write-public-file.mjs';

export const characters={
 GPT:{title:'태종대 교수',intro:'아주 날카로운 지적입니다',catchphrase:'와... 너 정말, 핵심을 찔렀어.'},
 Gemini:{title:'경포대 교수',intro:'구글링해봤는데~',catchphrase:'일단 그림으로 그려서 보여줄게'},
 Claude:{title:'해운대 교수',intro:'사용량 한도에 도달했습니다',catchphrase:'Resets at 03:55 am'}
};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function characterIntro(order){
 if(order.length!==2||new Set(order).size!==2||order.some(x=>!characters[x]))throw Error('참가자 순서를 확인할 수 없습니다.');
 const [a,b]=order.map(x=>characters[x].title+' '+x);
 return `<section class="character-intro" data-character-intro aria-label="교수 소개"><p class="character-label">사회자 · 캐릭터 연출</p><h2>오늘의 교수님을 소개합니다!</h2><p>오늘도 두 교수님을 모셨습니다! <strong>${escape(a)}</strong>와 <strong>${escape(b)}</strong>! 연구실은 없지만 주장은 있습니다.</p><div class="character-entrances">${order.map(x=>`<div class="character-entrance ${x.toLowerCase()}"><span>${escape(characters[x].title)} · ${escape(x)}</span><strong>“${escape(characters[x].intro)}”</strong></div>`).join('')}</div><small>가상의 교수 캐릭터와 인사말은 편집 연출입니다.</small></section>`;
}
export function addCharacters(html){
 if(html.includes('data-character-intro'))return html;
 const cards=[...html.matchAll(/<article\b[^>]*class="[^"]*\bturn-card\b[^"]*"[^>]*>/g)];
 const speakers=cards.map(x=>x[0].match(/data-model="([^"]+)"/)?.[1]);
 const order=[...new Set(speakers)].filter(x=>characters[x]);
 if(cards.length!==6||order.length!==2||!html.includes('<div class="start-area">'))throw Error('토론 발언이나 참가자 순서를 확인할 수 없습니다.');
 let seen={};
 html=html.replace(/<article\b[^>]*class="[^"]*\bturn-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/g,card=>{
  const name=card.match(/data-model="([^"]+)"/)?.[1];if(!characters[name])throw Error('알 수 없는 발언자');
  seen[name]=(seen[name]||0)+1;
  if(seen[name]!==2)return card;
  const tag=`<p class="character-catchphrase ${name.toLowerCase()}" data-character-catchphrase><span>캐릭터 단골멘트 · 연출</span> “${escape(characters[name].catchphrase)}”</p>`;
  if(!card.includes('<div class="speech">'))throw Error('발언 본문 위치를 찾을 수 없습니다.');
  return card.replace('<div class="speech">',tag+'<div class="speech">');
 });
 html=html.replace('<div class="start-area">',characterIntro(order)+'<div class="start-area">');
 return html.replace('</head>','<link rel="stylesheet" href="/assets/css/debate-characters.css"></head>');
}
export function characterLog(m){
 const first=m.draw.first,other=first==='GPT'?'Gemini':'GPT',order=[first,other];
 return `## 교수 소개 · 캐릭터 연출\n\n사회자: 오늘도 두 교수님을 모셨습니다! ${order.map(x=>characters[x].title+' '+x).join('와 ')}! 연구실은 없지만 주장은 있습니다.\n\n${order.map(x=>`${characters[x].title} ${x}: “${characters[x].intro}”`).join('\n\n')}\n\n위 인사말과 단골멘트는 고정 연출이며 실제 발언과 글자 수에 포함되지 않습니다.\n\n`;
}
export function catchphraseLog(t){return t.number===3||t.number===4?`- 캐릭터 단골멘트 · 연출: “${characters[t.speaker].catchphrase}”\n`:''}

async function build(){
 const root=new URL('../',import.meta.url),pages=['debates/001/index.html','debates/002/index.html'];
 try{for(const e of await readdir(new URL('debates/generated/',root),{withFileTypes:true}))if(e.isDirectory()&&/^\d{3}-m\d{3}$/.test(e.name))pages.push(`debates/generated/${e.name}/index.html`)}catch(e){if(e.code!=='ENOENT')throw e}
 for(const page of pages){const url=new URL(page,root),html=await readFile(url,'utf8');await writeFile(url,addCharacters(html));}
 console.log(`Character introductions built: ${pages.length} debates.`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))build().catch(e=>{console.error(e.message);process.exitCode=1});
