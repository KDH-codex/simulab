import {validateEvent,eventState,isCalendarEligible,koreaToday,addDays} from '../../tools/parenting-deals/model.js';
import {weekendRange} from '../../tools/kids-outing-calendar/model.js';

export const SHOP_KINDS={all:'전체',mall:'몰·아울렛',mart:'마트·창고형',department:'백화점',brand:'브랜드'};
export const SHOP_CATEGORIES={all:'모든 품목',life:'식품·생활',fashion:'패션·스포츠',beauty:'뷰티',furniture:'리빙·가구',appliances:'가전·디지털',kitchen:'주방용품',kids:'키즈'};
export const SHOP_AREAS={all:'모든 지역',nationwide:'전국·온라인',seoul:'서울',gyeonggi:'경기·인천',gangwon:'강원',chungcheong:'충청',jeolla:'전라',gyeongsang:'경상',jeju:'제주'};
export const SHOP_CHANNELS={all:'모든 채널',online:'온라인',store:'매장',app:'앱',phone:'전화 주문'};
export const SHOP_STORAGE='thisweekfestival.shopping.saved.v1';
export const saleURL=e=>'/sales/'+encodeURIComponent(e.id)+'/';
export function validateShoppingEvent(e,sources,now=new Date()) {
  const errors=validateEvent(e,sources,now),s=e.shopping;
  if(!s)return [...errors,'Missing shopping scope'];
  if(!Object.hasOwn(SHOP_KINDS,s.kind)||s.kind==='all')errors.push('Invalid retail kind');
  if(!Object.hasOwn(SHOP_AREAS,s.area)||s.area==='all')errors.push('Invalid shopping area');
  for(const key of ['brand','brandCode','retailerId','storeScope'])if(typeof s[key]!=='string'||!s[key].trim())errors.push('Missing shopping '+key);
  if(s.retailerId!==e.brandId)errors.push('Retailer must match official publisher');
  for(const key of ['specificStore','membership','card','app'])if(typeof s[key]!=='boolean')errors.push('Invalid scope flag '+key);
  if(!Number.isInteger(s.reviewWithinHours)||s.reviewWithinHours<1||s.reviewWithinHours>168)errors.push('Invalid shopping freshness');
  for(const lang of ['en','ja','zh-CN','zh-TW'])if(!s.locales?.[lang]?.title||!s.locales?.[lang]?.summary)errors.push('Missing shopping translation '+lang);
  return errors;
}
export function shoppingState(e,now=new Date()) {
  const result=eventState(e,now);
  if(['ended','cancelled','held','pending','excluded'].includes(result.code))return result;
  if(!e.shopping||+new Date(now)-Date.parse(e.checkedAt)>e.shopping.reviewWithinHours*3600000)return {code:'stale',label:'재확인 필요',active:false};
  return result;
}
export function shoppingText(e,locale='ko') {return locale==='ko'?{title:e.title,summary:e.summary}:e.shopping.locales[locale]||{title:e.title,summary:e.summary};}
export function filterShopping(events,state={},now=new Date(),saved=[]) {
  const today=koreaToday(now),weekend=weekendRange(today),limit=addDays(today,60);
  const words=String(state.query||'').slice(0,100).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return events.filter(e=>{
    if(!e.shopping||!isCalendarEligible(e))return false;
    const s=e.shopping,status=shoppingState(e,now);
    if(state.saved&&!saved.includes(e.id))return false;
    if(state.kind&&state.kind!=='all'&&state.kind!==s.kind)return false;
    if(state.category&&state.category!=='all'&&!e.categories.includes(state.category))return false;
    if(state.area&&state.area!=='all'&&state.area!==s.area&&s.area!=='nationwide')return false;
    if(state.brand&&state.brand!=='all'&&state.brand!==s.brandCode)return false;
    if(state.member&&!s.membership||state.card&&!s.card)return false;
    if(state.channel&&state.channel!=='all'&&!(state.channel==='app'?s.app:e.channels.includes(state.channel)))return false;
    const haystack=[e.title,e.summary,e.brandName,s.brand,s.brandCode,s.storeScope,...Object.values(s.locales).flatMap(x=>[x.title,x.summary])].join(' ').toLocaleLowerCase();
    if(!words.every(word=>haystack.includes(word)))return false;
    const period=state.period||'all';
    if(period==='archive')return ['ended','stale'].includes(status.code);
    if(period==='all'&&state.saved)return true;
    if(!['active','upcoming'].includes(status.code)||e.startDate>limit)return false;
    if(period==='ending')return status.active&&e.endDate===today;
    if(period==='upcoming')return status.code==='upcoming';
    if(period==='weekend')return e.endDate>=weekend.start&&e.startDate<=weekend.end;
    return true;
  }).sort((a,b)=>{
    if(state.sort==='start')return a.startDate.localeCompare(b.startDate)||a.id.localeCompare(b.id);
    return a.endDate.localeCompare(b.endDate)||a.id.localeCompare(b.id);
  });
}
export function restoreShoppingSaved(value,events) {
  try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?[...new Set(parsed.filter(id=>typeof id==='string'&&events.some(e=>e.id===id)))]:[];}catch{return [];}
}
