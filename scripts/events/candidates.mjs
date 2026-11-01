import {isDate,normalizedTitle,duplicateRecord} from '../../tools/kids-outing-calendar/model.js';
export const TOURAPI_CATALOG='https://www.data.go.kr/data/15101578/openapi.do';
export const STANDARD_CATALOG='https://www.data.go.kr/data/15013104/standard.do';
const areaCodes={'1':'서울','2':'인천','3':'대전','4':'대구','5':'광주','6':'부산','7':'울산','8':'세종','31':'경기','32':'강원','33':'충북','34':'충남','35':'경북','36':'경남','37':'전북','38':'전남','39':'제주'};
export function cleanText(value,max=500){return String(value??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim().slice(0,max);}
export function normalizeRegion(value){
 const text=cleanText(value);
 const aliases=[['서울','서울'],['부산','부산'],['인천','인천'],['대구','대구'],['대전','대전'],['울산','울산'],['세종','세종'],['경기','경기'],['강원','강원'],['충청북','충북'],['충북','충북'],['충청남','충남'],['충남','충남'],['전라북','전북'],['전북','전북'],['경상북','경북'],['경북','경북'],['경상남','경남'],['경남','경남'],['제주','제주']];
 if(/^전남광주/.test(text))return ''; // Combined provider labels require address-level editorial mapping.
 if(/^광주/.test(text))return '광주';
 if(/^전라남|^전남/.test(text))return '전남';
 return aliases.find(([prefix])=>text.startsWith(prefix))?.[1]||'';
}
const date=value=>{const text=String(value||'').trim();const iso=/^\d{8}$/.test(text)?text.slice(0,4)+'-'+text.slice(4,6)+'-'+text.slice(6,8):text;return isDate(iso)?iso:'';};
function coordinates(x,y){const lon=Number(x),lat=Number(y);return x&&y&&Number.isFinite(lon)&&Number.isFinite(lat)&&lon>=124&&lon<=132&&lat>=32&&lat<=40?{latitude:lat,longitude:lon}:{};}
export function fromTourAPI(row,fetchedAt,providerAreas={}){
 const address=cleanText([row.addr1,row.addr2].filter(Boolean).join(' '));
 const namedRegion=providerAreas[String(row.areacode)];
 return {provider:'tourapi',sourceRecordId:cleanText(row.contentid,80),sourceUrl:TOURAPI_CATALOG,
  title:cleanText(row.title,200),region:namedRegion?normalizeRegion(namedRegion):normalizeRegion(address)||areaCodes[String(row.areacode)]||'',
  startDate:date(row.eventstartdate),endDate:date(row.eventenddate),location:address,providerModifiedAt:cleanText(row.modifiedtime,30),
  ...coordinates(row.mapx,row.mapy),verificationStatus:'pending',fetchedAt,feeStatus:'unknown'};
}
export function fromStandard(row,fetchedAt){
 const location=cleanText(row['개최장소']||row.opar),address=cleanText(row['소재지도로명주소']||row.rdnmadr||row['소재지지번주소']||row.lnmadr);
 return {provider:'standard',sourceRecordId:cleanText(row['제공기관코드']||row.insttCode,80)+':'+cleanText(row['축제명']||row.fstvlNm,200),sourceUrl:STANDARD_CATALOG,
  title:cleanText(row['축제명']||row.fstvlNm,200),region:normalizeRegion(address),location,address,
  startDate:date(row['축제시작일자']||row.fstvlStartDate),endDate:date(row['축제종료일자']||row.fstvlEndDate),
  providerModifiedAt:cleanText(row['데이터기준일자']||row.referenceDate,30),
  ...coordinates(row['경도']||row.longitude,row['위도']||row.latitude),verificationStatus:'pending',fetchedAt,feeStatus:'unknown'};
}
export function parseCSV(text){
 const rows=[],row=[];let field='',quoted=false;
 for(let i=0;i<text.length;i++){const char=text[i];
  if(char==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else if(quoted||field==='')quoted=!quoted;else throw new Error('잘못된 CSV 따옴표');}
  else if(char===','&&!quoted){row.push(field);field='';}
  else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>v!==''))rows.push(row.splice(0));else row.splice(0);}
  else field+=char;
 }
 if(quoted)throw new Error('CSV 따옴표가 닫히지 않음');
 if(field||row.length){row.push(field);rows.push(row);}
 if(!rows.length)return [];
 const headers=rows.shift().map((v,i)=>i===0?v.replace(/^\uFEFF/,''):v);
 if(new Set(headers).size!==headers.length)throw new Error('중복 CSV 열');
 return rows.map(cells=>{if(cells.length!==headers.length)throw new Error('CSV 열 수 불일치');return Object.fromEntries(headers.map((key,i)=>[key,cells[i]]));});
}
function nearby(a,b){
 if(a.latitude===undefined||b.latitude===undefined)return false;
 const radians=n=>n*Math.PI/180,dLat=radians(a.latitude-b.latitude),dLon=radians(a.longitude-b.longitude);
 const h=Math.sin(dLat/2)**2+Math.cos(radians(a.latitude))*Math.cos(radians(b.latitude))*Math.sin(dLon/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)))<=0.5;
}
export function prepareCandidates(rows,{start,end}){
 const candidates=[],quarantine=[],discarded=[];
 for(const row of rows){
  const reasons=[];
  if(!row.title||!row.location||!row.region||!row.sourceRecordId)reasons.push('이름·장소·지역·출처 식별자 부족');
  if(!isDate(row.startDate)||!isDate(row.endDate)||row.startDate>row.endDate)reasons.push('날짜 오류');
  if(row.title.match(/(?:19|20)\d{2}/g)?.some(year=>year!==row.startDate.slice(0,4)))reasons.push('제목 연도와 기간 충돌');
  if(reasons.length){quarantine.push({...row,reasons});continue;}
  if(row.endDate<start||row.startDate>end){discarded.push({provider:row.provider,sourceRecordId:row.sourceRecordId,reason:'검토 기간 밖'});continue;}
  const samePlace=other=>other.region===row.region&&normalizedTitle(other.title)===normalizedTitle(row.title)&&
   ((row.location&&other.location&&cleanText(row.location).replace(/\s/g,'')===cleanText(other.location).replace(/\s/g,''))||nearby(row,other));
  if(quarantine.some(other=>samePlace(other)&&other.startDate.slice(0,4)===row.startDate.slice(0,4))){quarantine.push({...row,reasons:['같은 행사 후보의 기존 날짜 충돌']});continue;}
  const duplicate=candidates.find(other=>duplicateRecord(row,other)||(samePlace(other)&&row.startDate===other.startDate&&row.endDate===other.endDate));
  if(duplicate){duplicate.provenance.push({provider:row.provider,sourceRecordId:row.sourceRecordId,sourceUrl:row.sourceUrl});continue;}
  const conflict=candidates.find(other=>samePlace(other)&&other.startDate.slice(0,4)===row.startDate.slice(0,4)&&(other.startDate!==row.startDate||other.endDate!==row.endDate));
  if(conflict){candidates.splice(candidates.indexOf(conflict),1);quarantine.push({...conflict,reasons:['같은 행사 후보의 날짜 충돌']},{...row,reasons:['같은 행사 후보의 날짜 충돌']});continue;}
  // No checkedAt, verified status, price or child eligibility is invented here.
  candidates.push({...row,verificationStatus:'pending',feeStatus:'unknown',provenance:[{provider:row.provider,sourceRecordId:row.sourceRecordId,sourceUrl:row.sourceUrl}]});
 }
 return {candidates,quarantine,discarded};
}
