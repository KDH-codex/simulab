import {LANGUAGE_KEY,resolveLocale,languageURL,t,translateUI} from './festival-i18n.js';
import {eventTranslation} from './festival-event-locales.js';

export function initializeLanguage(events) {
  const current=new URL(location.href);
  let saved;try{saved=localStorage.getItem(LANGUAGE_KEY);}catch{}
  const locale=resolveLocale({query:current.searchParams.get('lang'),saved,languages:navigator.languages||[navigator.language]});
  document.documentElement.lang=locale;
  const select=document.getElementById('festival-language');
  if(select){select.value=locale;select.addEventListener('change',()=>{
    try{localStorage.setItem(LANGUAGE_KEY,select.value);}catch{}
    location.assign(languageURL(location.href,select.value,location.origin).href);
  });}
  document.addEventListener('click',event=>{const link=event.target.closest?.('a[href]');if(!link||link.getAttribute('href').startsWith('#'))return;const url=languageURL(link.href,locale,location.origin);if(url)link.href=url.href;},true);
  if(locale==='ko')return locale;
  // Persist explicit query in URLs, even when browser storage is blocked.
  current.searchParams.set('lang',locale);history.replaceState(null,'',current);
  const translated=new Map();
  const names=[];
  for(const event of events){const entry=eventTranslation(event,locale);if(!entry)continue;
    translated.set(event.title,entry.title);translated.set(event.program,entry.summary);names.push([event.title,entry.title]);
  }
  const originalTerms=new Set(events.flatMap(e=>[e.time,e.fee,e.booking,e.location,e.familyNote,e.scheduleNote]).filter(Boolean));
  const text=value=>{
    const trimmed=value.trim(),exact=translated.get(trimmed)||t(trimmed,locale);
    return exact!==trimmed?value.replace(trimmed,exact):originalTerms.has(trimmed)?value:translateUI(value,locale);
  };
  const hero={en:['This week,','discover Korea.'],ja:['今週は、','韓国のお祭りへ。'],'zh-CN':['这个周末，','探索韩国。'],'zh-TW':['這個週末，','探索韓國。']}[locale];
  const headings={
    map:{en:['Where will','you go?'],ja:['どこへ','出かけよう？'],'zh-CN':['下一站，','去哪里？'],'zh-TW':['下一站，','去哪裡？']},
    calendar:{en:['Pick a day.','Make a plan.'],ja:['いつ、','出かけよう？'],'zh-CN':['选个日期，','出发吧。'],'zh-TW':['選個日期，','出發吧。']},
    weekend:{en:['This weekend,','find your festival.'],ja:['今週末、','お祭りへ行こう。'],'zh-CN':['这个周末，','遇见精彩。'],'zh-TW':['這個週末，','遇見精彩。']}
  };
  const mainHeading=document.querySelector('.split-heading,.page-intro h1');
  if(mainHeading){const lines=mainHeading.matches('.split-heading')?hero:headings[document.body.dataset.festivalPage]?.[locale];
    if(lines){mainHeading.replaceChildren(...lines.map((line,i)=>{const span=document.createElement('span');span.className='localized-heading-line'+(i?' accent-text':'');span.textContent=line;return span;}));mainHeading.removeAttribute('aria-label');mainHeading.classList.add('localized-heading');mainHeading.removeAttribute('data-split-heading');}
  }
  // Detail terms and map-search venue names deliberately keep their verified original wording.
  function ignored(node){return node.parentElement?.closest('script,style,noscript,[translate="no"],[data-original],.sources-list,[contenteditable="true"]');}
  function visit(root){
    if(root.nodeType===Node.TEXT_NODE){if(!ignored(root)){const value=text(root.data);if(value!==root.data)root.data=value;else if(originalTerms.has(root.data.trim())&&/[가-힣]/.test(root.data))root.parentElement.lang='ko';}return;}
    if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
    if(root.nodeType===Node.ELEMENT_NODE){
      if(root.matches('.sources-list')){root.lang='ko';return;}
      if(root.matches('script,style,noscript,[translate="no"],[data-original],.sources-list,[contenteditable="true"]'))return;
      if(root.matches('.translation-only'))root.hidden=false;
      for(const attr of ['aria-label','title','placeholder'])if(root.hasAttribute(attr)){
        const old=root.getAttribute(attr);let value=old;for(const [original,name] of names)value=value.replaceAll(original,name);value=text(value);if(value!==old)root.setAttribute(attr,value);
      }
      if(root.matches('a[href]')&&!root.getAttribute('href').startsWith('#')){const url=languageURL(root.href,locale,location.origin);if(url&&root.href!==url.href)root.href=url.href;}
      if(root.matches('img')&&root.closest('.card-visual,.mini-image,.modal-cover,.detail-image,.detail-mobile-media,.hero-image')){
        const alt=root.getAttribute('alt')||'';
        if(/AI 생성/.test(alt))root.alt=t('AI 생성 이미지 · 현장 사진 아님',locale);
        else if(/현장 사진 아님/.test(alt))root.alt=t('주제 참고 · 현장 사진 아님',locale);
      }
    }
    for(const child of root.childNodes)visit(child);
  }
  visit(document.documentElement);
  const description={en:'Explore festivals and events across South Korea by date, region and theme. Check official schedules, fees and booking details before you travel.',ja:'韓国各地のお祭り・イベントを日付・地域・テーマから検索。出発前に公式日程・料金・予約条件を確認できます。','zh-CN':'按日期、地区与主题探索韩国各地节庆及活动。出发前确认官方日程、费用与预约条件。','zh-TW':'依日期、地區與主題探索韓國各地節慶及活動。出發前確認官方日程、費用與預約條件。'}[locale];
  const event=events.find(e=>location.pathname==='/events/'+e.id+'/');
  const pageTitle=event?eventTranslation(event,locale)?.title:t({home:'홈',map:'지역별 탐색',calendar:'축제 달력',weekend:'이번 주말'}[document.body.dataset.festivalPage],locale);
  document.title=(pageTitle||t('이번주 축제',locale))+' | '+t('이번주 축제',locale);
  for(const selector of ['meta[name="description"]','meta[property="og:description"]'])document.querySelector(selector)?.setAttribute('content',description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content',document.title);
  const pending=new Set();let queued=false;
  const observer=new MutationObserver(records=>{
    for(const record of records){if(record.type==='childList')for(const node of record.addedNodes)pending.add(node);else pending.add(record.target);}
    if(queued)return;queued=true;queueMicrotask(()=>{queued=false;observer.disconnect();for(const root of pending)if(root.isConnected)visit(root);pending.clear();observe();});
  });
  const observe=()=>observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['href','aria-label','title','placeholder']});
  observe();
  return locale;
}
