import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {escapeHtml as e,validateCatalog,renderGuideCard} from '../assets/js/weekday-guide-model.js';
const root=new URL('../',import.meta.url),data=JSON.parse(await readFile(new URL('data/weekday-guides/reviewed.json',root),'utf8'));
const errors=validateCatalog(data);if(errors.length)throw new Error(errors.join('\n'));
const scope={};vm.runInNewContext(await readFile(new URL('assets/js/core-ui.js',root),'utf8'),scope);
const tools=scope.SimuLab.SITE_MENU.flatMap(g=>g.items),tool=id=>{const row=tools.find(t=>t.tool===id);if(!row)throw new Error('Unknown related tool '+id);return row;};
const json=value=>JSON.stringify(value).replaceAll('<','\\u003c');
for(const guide of data.guides){
 const items=data.items.filter(i=>i.guide===guide.id),sources=data.sources.filter(s=>items.some(i=>i.source===s.id));
 for(const id of [...guide.tools,...items.flatMap(i=>i.tool?[i.tool]:[])])tool(id);
 const date=[...sources.map(s=>s.checkedAt)].sort().at(-1),url='https://simulab.kr/tools/'+guide.id+'/',title=guide.name+' 안내 · 공식 정보와 확인 목록 | 시뮬랩';
 const structured={'@context':'https://schema.org','@type':'CollectionPage',name:guide.name+' 안내',description:guide.description,url,inLanguage:'ko-KR',dateModified:date,mainEntity:{'@type':'ItemList',numberOfItems:items.length,itemListElement:items.map((i,n)=>({'@type':'ListItem',position:n+1,name:i.title,url:url+'#'+i.id}))}};
 const html=`<!doctype html>
<html lang="ko" data-default-theme="light" data-theme="light"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<title>${e(title)}</title><meta name="description" content="${e(guide.description)}"><link rel="canonical" href="${url}"><link rel="icon" href="/favicon.svg">
<meta property="og:type" content="website"><meta property="og:site_name" content="시뮬랩"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(guide.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://simulab.kr/assets/icons/icon-512.png"><meta name="twitter:card" content="summary">
<meta name="google-adsense-account" content="ca-pub-9815778998394475">
<link rel="stylesheet" href="/assets/css/common.css?v=20261023"><link rel="stylesheet" href="/assets/css/weekday-guide.css?v=20261023">
<script type="application/ld+json">${json(structured)}</script></head>
<body class="weekday-page accent-${e(guide.accent)}"><a class="guide-skip" href="#guide-browser">안내 목록으로 건너뛰기</a><header id="site-header"></header>
<main id="main" class="guide-main">
<nav class="guide-breadcrumb" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">/</span><a href="/#weekday-life">평일 생활</a><span aria-hidden="true">/</span><strong>${e(guide.name)}</strong></nav>
<nav class="guide-tabs" aria-label="평일 생활 분야">${data.guides.map(g=>`<a href="/tools/${g.id}/"${g.id===guide.id?' aria-current="page"':''}>${e(g.name)}<span aria-hidden="true">↗</span></a>`).join('')}</nav>
<section class="guide-hero"><div><p class="guide-eyebrow">평일 생활 · ${e(guide.eyebrow)}</p><h1>${e(guide.title).replace('\n','<br>')}</h1><p class="guide-intro">${e(guide.description)}</p><a class="guide-hero-link" href="#guide-browser">내 상황에 맞는 안내 찾기 <span aria-hidden="true">↓</span></a></div><aside class="guide-start" aria-label="이렇게 시작해 보세요"><span class="guide-start-label">이렇게 시작해 보세요</span><ol>${guide.steps.map(s=>`<li>${e(s)}</li>`).join('')}</ol><p>공식 출처 <strong>${sources.length}곳</strong><span>·</span>확인 목록 <strong>${items.length}개</strong></p></aside></section>
<div id="guide-notice-anchor"></div>
<section id="guide-browser" class="guide-browser" aria-labelledby="guide-list-title"><div class="guide-section-heading"><div><p class="guide-eyebrow">지금 필요한 정보</p><h2 id="guide-list-title">어떤 상황이신가요?</h2></div><p id="guide-status" role="status">${items.length}개 안내</p></div>
<form id="guide-filter" role="search" hidden><div class="guide-search"><label for="guide-query">안내 검색</label><input id="guide-query" type="search" placeholder="예: ${e(items[0].keywords[0])}, ${e(items.at(-1).keywords[0])}" maxlength="80" autocomplete="off"><button type="submit">찾기</button></div><div class="guide-categories" role="group" aria-label="상황별 분류"><button type="button" data-guide-category="all" aria-pressed="true">전체 ${items.length}</button>${Object.entries(guide.categories).map(([id,label])=>`<button type="button" data-guide-category="${id}" aria-pressed="false">${e(label)} <small>${items.filter(i=>i.category===id).length}</small></button>`).join('')}</div></form>
<p class="guide-list-hint">확인 목록을 펼쳐 준비할 내용을 살펴보고, 공식 안내에서 최신 조건을 확인하세요.</p>
<div class="guide-grid">${items.map(i=>renderGuideCard(i,sources.find(s=>s.id===i.source),{toolName:i.tool?tool(i.tool).title:''})).join('\n')}</div>
<div id="guide-empty" class="guide-empty" hidden><h3>일치하는 안내가 없어요.</h3><p>다른 단어로 검색하거나 전체 안내를 살펴보세요.</p><button type="button" id="guide-reset">전체 안내 보기</button></div><p id="guide-copy-status" class="guide-copy-status" role="status"></p><noscript><p>모든 안내와 공식 링크는 그대로 이용할 수 있습니다. 검색·필터·복사는 JavaScript를 켜면 이용할 수 있습니다.</p></noscript></section>
<section class="guide-related" aria-labelledby="related-title"><div class="guide-section-heading"><div><p class="guide-eyebrow">숫자도 함께 살펴봐요</p><h2 id="related-title">관련 도구로 이어가기</h2></div></div><div class="guide-related-grid">${guide.tools.map(id=>{const t=tool(id);return `<a href="/tools/${id}/"><span>${e(t.title)}</span><p>${e(t.sub)}</p><b aria-hidden="true">↗</b></a>`;}).join('')}</div><p class="guide-related-note">계산기는 페이지에 표시된 가정으로 비교하는 도구입니다. 제도 신청 자격이나 실제 지급액은 담당 기관에서 확인해 주세요.</p></section>
<section id="guide-source-policy" class="guide-source-policy" aria-labelledby="source-title"><p class="guide-eyebrow">출처와 이용 안내</p><h2 id="source-title">확인한 정보에서 시작해요.</h2><p>이 페이지는 시뮬랩이 공식 서비스의 안내를 확인해 정리한 목록입니다. 실시간으로 가격이나 제도 변경을 수집하지 않습니다. 각 카드의 출처 확인일 이후 조건이 달라질 수 있으므로 신청·계약·구매 전 공식 안내를 확인해 주세요.</p><p>같은 출처라도 안내 범위가 다릅니다. 아래 링크의 서비스명과 페이지 제목을 함께 확인해 주세요.</p><details><summary>이 페이지의 공식 출처 ${sources.length}곳 보기</summary><ul>${sources.map(s=>`<li><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.name)} · ${e(s.title)} <span class="sr-only">(새 창)</span> ↗</a><time datetime="${s.checkedAt}">${s.checkedAt} 확인</time></li>`).join('')}</ul></details><a href="/legal/editorial.html">정보·정정 기준 보기 ↗</a></section>
<p class="guide-related-note"><a href="/tools/family-info-calendar/">체험·교육·지원사업의 신청일과 가족 나들이 정보를 함께 확인하세요 ↗</a></p></main><footer id="site-footer"></footer><script id="guide-data" type="application/json">${json({guide,items,sources})}</script><script src="/assets/js/core-ui.js?v=20261023"></script><script type="module" src="/assets/js/weekday-guide.js?v=20261023"></script></body></html>\n`;
 await mkdir(new URL('tools/'+guide.id+'/',root),{recursive:true});await writeFile(new URL('tools/'+guide.id+'/index.html',root),html);
}
console.log('Built weekday guides: '+data.guides.length+' pages, '+data.items.length+' reviewed items.');
