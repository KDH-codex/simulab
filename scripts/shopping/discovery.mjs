export function approvedURL(value,base,hosts) {
 try{const url=new URL(value.replaceAll('&amp;','&'),base);return url.protocol==='https:'&&!url.username&&!url.password&&hosts.includes(url.hostname)?url:null;}catch{return null;}
}
export const publicText=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export function discoverLinks(html,source) {
 const seen=new Set(),items=[];
 for(const [,href,label] of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const url=approvedURL(href,source.url,source.hosts);if(!url)continue;url.hash='';
  const match=source.adapter==='outlet-links'?/\/shopping-info\/news\/special-detail\//.test(url.pathname):source.adapter==='campaign-links'?/\/campaigns\/|EV000003|SN_0201000/.test(url.pathname):false;
  if(!match||seen.has(url.href))continue;seen.add(url.href);
  items.push({url:url.href,label:publicText(label).slice(0,180),publicationStatus:'pending',reviewRequired:['해당 연도와 전체 기간','판매처·브랜드·적용 지점','혜택·채널·회원·카드·수량 조건','기존 자료와 중복 여부']});
  if(items.length>=30)break;
 }
 return items;
}
export async function fetchApproved(source,{fetcher=fetch,timeoutMs=15000}={}) {
 let url=approvedURL(source.url,source.url,source.hosts);if(!url)throw Error('Source URL is not approved');
 const signal=AbortSignal.timeout(timeoutMs);
 for(let hops=0;hops<4;hops++){
  const response=await fetcher(url.href,{redirect:'manual',signal,headers:{Accept:'text/html,application/xhtml+xml'}});
  if([301,302,303,307,308].includes(response.status)){
   const next=approvedURL(response.headers.get('location')||'',url.href,source.hosts);if(!next)throw Error('Redirect outside approved source');url=next;continue;
  }
  if(!response.ok)throw Error('HTTP '+response.status+'; do not bypass restrictions');
  const type=response.headers.get('content-type')||'';if(!/text\/html|application\/xhtml\+xml/.test(type))throw Error('Unexpected source content type');
  const html=await response.text();if(html.length>4_000_000)throw Error('Source response exceeds scope');
  return {html,url:url.href};
 }
 throw Error('Too many redirects');
}
