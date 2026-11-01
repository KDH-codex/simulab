import {filterRecords,isStaleRecord,REGION_GROUPS,koreaToday,shiftDate,periodText} from '../../tools/family-info-calendar/model.js';
import {CATEGORIES} from '../../tools/parenting-deals/model.js';
import {planHashtags} from './blog-tags.mjs';
export function weekKey(now=new Date()){const today=koreaToday(now);return shiftDate(today,-new Date(today+'T00:00:00Z').getUTCDay());}
export function publicationKey(week,category,kind,value){return [week,category,kind,value,'weekly'].join(':');}
export function groupPosts(feed,{day,now=new Date(),history=[]}={}){
 if(![3,4].includes(day))throw new Error('수요일(3) 또는 목요일(4)만 지정하세요.');
 const posts=[],held=[],week=weekKey(now);
 for(const category of feed.categories.filter(c=>c.blogDay===day)){
  const valid=filterRecords(feed.records,{category:category.id},now),rows=valid.filter(r=>!isStaleRecord(r,now));
  const covered=new Map();
  for(const entry of history)if(entry.key?.startsWith(week+':'+category.id+':')&&['published','publishing','unknown'].includes(entry.status))for(const id of entry.recordIds||[])covered.set(id,entry);
  const groups=new Map();
  for(const r of rows){let values,kind;
   const prior=covered.get(r.id);if(prior){held.push({categoryId:category.id,recordId:r.id,key:prior.key,url:prior.url||null,reason:prior.status==='published'?'동일 주차 항목 게시 완료 · 개별 글 포함':'동일 주차 항목의 게시 결과 확인 필요'});continue;}
   if(category.split==='sale-sector'){kind='sector';values=(r.sectorIds||[]).filter(id=>id!=='all'&&CATEGORIES[id]).map(id=>({id,label:CATEGORIES[id]}));}
   else if(category.split==='discount-sector'){kind='sector';values=(r.sectorIds||[]).filter(id=>['dining','attractions'].includes(id)).map(id=>({id,label:id==='dining'?'가족 외식':'관광시설'}));}
   else{kind=r.region==='전국'||r.region==='온라인'?'national':'region';const group=REGION_GROUPS.find(g=>g.regions.includes(r.region));values=[{id:group?.label||r.region,label:group?.label||r.region}];}
   if(!values.length){held.push({categoryId:category.id,recordId:r.id,reason:'지역/분야 분리 근거 부족'});continue;}
   for(const value of values){const key=publicationKey(week,category.id,kind,value.id);if(!groups.has(key))groups.set(key,{key,week,categoryId:category.id,title:value.label+' '+category.name+' · 이번 주 확인할 정보',split:kind,splitValue:value.id,snapshotId:feed.snapshotId,categoryRevision:category.categoryRevision,records:[]});groups.get(key).records.push(r);}
  }
  if(!rows.length)held.push({categoryId:category.id,reason:valid.length?'원문 확인 후 7일 초과 · 재검증 필요':'검증된 유효 항목 없음'});
  for(const post of groups.values()){const previous=history.find(e=>e.key===post.key);if(['published','publishing','unknown'].includes(previous?.status)){held.push({key:post.key,reason:previous.status==='published'?'동일 주차 글 게시 완료':'게시 결과 확인 후 재시도 필요'});continue;}posts.push(post);}
 }
 return {week,day,posts,held};
}
export function draftMarkdown(post,{hashtags=planHashtags(post).hashtags}={}){return '# '+post.title+'\n\n이번 주에는 아래 일정과 조건을 먼저 확인해 보세요. 신청과 예약은 공식 안내에서 진행해 주세요.\n\n'+post.records.map(r=>`## ✅ ${r.title}\n\n${r.summary}\n\n- 지역·장소: ${[r.region,r.location].filter(Boolean).join(' · ')}\n- 대상: ${r.audience}\n${r.applicationStart||r.applicationEnd||r.bookingStart?'- 신청: '+periodText(r.applicationStart||r.bookingStart,r.applicationEnd)+'\n':''}${r.applicationNote?'- 신청 안내: '+r.applicationNote+'\n':''}${r.eventStart?'- 이용·혜택: '+periodText(r.eventStart,r.eventEnd)+'\n':''}- 비용: ${r.feeText}\n\n${r.conditions.map(c=>'- '+c).join('\n')}\n\n[공식 안내](${r.canonicalUrl}) · [시뮬랩에서 보기](https://simulab.kr${r.siteUrl})${r.location&&!['전국','온라인'].includes(r.region)?' · [네이버지도](https://map.naver.com/p/search/'+encodeURIComponent(r.location)+')':''}\n\n출처 확인: ${r.verifiedAt}\n`).join('\n')+'\n확인일 이후 일정과 조건이 바뀔 수 있어요. 신청·방문 전에 공식 공지를 다시 살펴봐 주세요.\n\n'+hashtags.join(' ')+'\n';}
