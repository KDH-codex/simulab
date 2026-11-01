export const REQUIRED_TAG_COUNT=30;
export const BASE_TAGS=['가족정보','가족나들이','신청일정','육아정보','지역정보','공식안내','주간일정','시뮬랩'];
const excluded=new Set(['직장인아빠','51개월육아']);
const topics={'kids-programs':'체험교육','local-parenting':'육아프로그램','family-support':'가족지원','camping-booking':'공공시설예약','family-culture':'공연전시','kids-popups':'팝업','brand-sales':'세일','family-discounts':'시설할인',festivals:'축제'};
const terms=['캐치티니핑','쥬얼스타캐치티니핑','티니핑','해리포터','마호도코로','레고랜드','산리오','디즈니','스펀지밥','포토타임','포토존','포토네컷','굿즈','키링','랜덤박스','캐릭터','팝업스토어','팝업','그림책','어린이박물관','박물관','도서관','뮤지컬','인형극','발레','오케스트라','음악회','전시','공연','마켓','문화공연','체험','농산물','자원순환','사과','시래기','국화','정원','걷기','걷기축제','제주올레','올레길','김장','캠핑장','국립자연휴양림','자연휴양림','휴양림','숲나들e','숲체험','요리체험','미술','과학','양육포럼','친구관계','양육','부모교육','부모자녀','영양','건강','교통비','바우처','지원사업','보육','돌봄','임산부','출산','북돋움','세일','할인','쿠폰','멤버십','제휴카드','백화점','아울렛','놀이공원'];
const noise=/^(?:공식|이번|이번주|주간|정보|안내|확인|확인할|일정|날짜별|다름|이후|이전|현재|기간|한정|대상|일원|일대|부근|집결지|전체|선정된|실시간|온라인|또는|및|등|내|앞|옆|or|and|the|of|by|for|with|in|at|제\d+회|\d+층|B\d+)$/iu;
const cleanTitle=value=>String(value||'').replace(/(?:^|\s)20\d{2}년?(?=\s|$)/gu,' ').replace(/제?\d+회/gu,'').replace(/\d+\s*월/gu,'').trim();
function normalize(value){
 const raw=String(value||'').normalize('NFKC').trim();
 if(/https?:|www\.|@/iu.test(raw))return null;
 const tag=raw.replace(/^[#＃]+/u,'').replace(/[^\p{L}\p{N}]/gu,'');
 if(tag.length<2||tag.length>24||!/[\p{L}]/u.test(tag)||excluded.has(tag)||noise.test(tag))return null;
 return tag;
}
export function normalizeHashtags(values){
 const seen=new Set(),result=[];
 for(const value of values){const tag=normalize(value),key=tag?.toLocaleLowerCase('en');if(!tag||seen.has(key))continue;seen.add(key);result.push('#'+tag);}
 return result;
}
function titleKeywords(value){
 const title=cleanTitle(value),parts=title.split(/[·|,:/()<>「」『』《》]/u).map(s=>s.trim()).filter(Boolean);
 return [title,...parts,...parts.flatMap(p=>p.split(/\s+/u))].filter(value=>!noise.test(value)&&!/[~%₩]|\d+(?:원|만원|천원|코스)/u.test(value));
}
function locationKeywords(value){
 return String(value||'').split(/[·,()]/u).map(s=>s.trim().replace(/\s+(?:\d+층|B\d+|앞|옆|등).*$/iu,'').replace(/\s*(?:일원|일대)$/u,'').trim()).filter(s=>s&&!/\d|날짜별|출발지 다름|주소지|신청처|선정된|온라인|실시간|면적/u.test(s));
}
function interleave(buckets){
 const result=[];for(let i=0;i<Math.max(0,...buckets.map(b=>b.length));i++)for(const bucket of buckets)if(bucket[i])result.push(bucket[i]);return result;
}
export function planHashtags(post,{keywords=[]}={}){
 const records=post.records||[],topic=topics[post.categoryId],entities=records.map(r=>[...titleKeywords(r.title),...locationKeywords(r.location)]);
 const text=records.map(r=>[r.title,r.summary,r.location].filter(Boolean).join(' ')).join(' ').replace(/\s+/gu,'');
 const matched=terms.filter(term=>text.includes(term));
 const regions=[...new Set(records.map(r=>r.region).filter(r=>r&&!['전국','온라인'].includes(r)))];
 const local=topic?regions.flatMap(region=>[region+topic,region+topic+'일정',region+topic+'정보']):[];
 // Candidates name the actual subject or describe information about it. Never
 // infer free admission, booking availability, age eligibility or other terms.
 const refinements=interleave(entities.map(bucket=>normalizeHashtags(bucket).slice(0,3).flatMap(tag=>[tag+'일정',tag+'안내'])));
 const contextual=matched.flatMap(term=>[term+'정보',term+'안내']);
 const hashtags=normalizeHashtags([...BASE_TAGS,...keywords,...interleave(entities),...matched,...local,...(topic?[topic,topic+'정보',topic+'일정',topic+'안내']:[]),...refinements,...contextual]).slice(0,REQUIRED_TAG_COUNT);
 return {hashtags,tagCount:hashtags.length,requiredTagCount:REQUIRED_TAG_COUNT,tagStatus:hashtags.length===REQUIRED_TAG_COUNT?'complete':'needs-keywords',requiresTagReview:true};
}
