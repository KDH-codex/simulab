import {readdir,readFile} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';
const root=new URL('../',import.meta.url);
const bar=`<div class="sharing-bar" data-sharing-bar><div class="sharing-bar-inner"><span class="sharing-bar-label">AI 사망토론 · 언제든 편하게 즐기세요</span><button type="button" data-action="install">⌂ 홈 화면에 추가</button><button type="button" data-action="share">↗ 앱으로 공유</button><button type="button" data-action="copy">링크 복사</button><span class="sharing-feedback" data-sharing-feedback role="status"></span></div><p class="sharing-help" data-install-help hidden>안드로이드: 브라우저 메뉴에서 ‘홈 화면에 추가’ 또는 ‘앱 설치’를 선택하세요. 아이폰: Safari의 공유 버튼 → ‘홈 화면에 추가’를 선택하세요. 기기와 브라우저에 따라 메뉴 이름이 다를 수 있습니다.</p></div>`;
const notice=`<aside class="debate-disclaimer"><strong>웃자고 하는 토론입니다!</strong> 재미를 위한 과장과 풍자, 억지가 조금 섞여 있을 수 있어요. 너그럽게 즐기고 여러분의 한 표를 들려주세요.</aside>`;
const addToHead=(html,content)=>html.includes('</head>')?html.replace('</head>',content+'</head>'):html.replace(/<body\b/,content+'<body');
const pages=['debates/001/index.html','debates/002/index.html'];
try{for(const e of await readdir(new URL('debates/generated/',root),{withFileTypes:true}))if(e.isDirectory()&&/^\d{3}-m\d{3}$/.test(e.name))pages.push(`debates/generated/${e.name}/index.html`)}catch(error){if(error.code!=='ENOENT')throw error}
for(const page of pages){const url=new URL(page,root);let html=await readFile(url,'utf8');if(html.includes('data-sharing-bar'))continue;
 const extra='<link rel="stylesheet" href="/assets/css/debate-sharing.css"><script type="module" src="/assets/js/debate-sharing.js"></script><link rel="apple-touch-icon" href="/assets/icons/icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes">'+(html.includes('rel="manifest"')?'':'<link rel="manifest" href="/manifest.json">');
 html=addToHead(html,extra).replace(/<body([^>]*)>/,`<body$1>${bar}`);
 if(page!=='index.html'){html=html.replace(/<main([^>]*)>/,`<main$1>${notice}`);if(!html.includes('property="og:title"')){const title=html.match(/<title>([^<]*)<\/title>/)?.[1]||'AI 사망토론';const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];if(canonical)html=addToHead(html,`<meta property="og:type" content="article"><meta property="og:title" content="${title}"><meta property="og:description" content="AI가 토론하고 여러분이 판정합니다."><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://simulab.kr/assets/icons/icon-512.png">`)}}
 await writeFile(url,html);
}
console.log(`Sharing and installation controls built: ${pages.length} pages.`);
