const BASE='https://apis.data.go.kr/B551011/KorService2/';
export async function collectTourAPI({serviceKey,today,fetchFn=fetch,maxPages=20,pageSize=200}){
 if(!serviceKey)return {status:'skipped',reason:'TOURAPI_SERVICE_KEY 미설정',items:[],areaNames:{}};
 let key=serviceKey.trim();try{if(/%[0-9a-f]{2}/i.test(key))key=decodeURIComponent(key);}catch{throw new Error('인증키 형식 확인 필요');}
 async function request(operation,parameters){
  const url=new URL(operation,BASE);url.search=new URLSearchParams({serviceKey:key,MobileOS:'ETC',MobileApp:'SimuLab',_type:'json',...parameters});
  let response;try{response=await fetchFn(url.href,{signal:AbortSignal.timeout(20000)});}catch{throw new Error('TourAPI 연결 실패; 이전 후보 파일을 유지합니다.');}
  if(!response.ok)throw new Error('TourAPI HTTP 응답 오류 '+response.status);
  let json;try{json=await response.json();}catch{throw new Error('TourAPI 응답이 JSON이 아닙니다. 인증·호출량 설정을 확인하세요.');}
  const envelope=json?.response;
  if(!['0000','00'].includes(String(envelope?.header?.resultCode)))throw new Error('TourAPI 응답 코드 오류; 이전 후보 파일을 유지합니다.');
  const body=envelope.body;if(!body||!Number.isInteger(Number(body.totalCount))||Number(body.totalCount)<0)throw new Error('TourAPI 건수 정보 오류');
  const raw=body.items?.item,items=Array.isArray(raw)?raw:raw&&typeof raw==='object'?[raw]:[];
  return {items,total:Number(body.totalCount)};
 }
 const areas=await request('areaCode2',{numOfRows:'100',pageNo:'1'});
 const areaNames=Object.fromEntries(areas.items.map(item=>[String(item.code),String(item.name)]));
 const items=[];let expected=null;
 // Includes already-running and year-crossing events; local review-window filtering happens later.
 const earliest=(Number(today.slice(0,4))-1)+'0101';
 for(let page=1;page<=maxPages;page++){
  const result=await request('searchFestival2',{eventStartDate:earliest,numOfRows:String(pageSize),pageNo:String(page),arrange:'C'});
  if(expected!==null&&result.total!==expected)throw new Error('TourAPI 목록이 수집 중 바뀌었습니다. 부분 결과를 저장하지 않습니다.');
  expected=result.total;items.push(...result.items);
  if(items.length>=expected){if(new Set(items.map(item=>String(item.contentid))).size!==items.length)throw new Error('TourAPI 페이지 중복 감지');return {status:'collected',items,areaNames};}
  if(!result.items.length)throw new Error('TourAPI 페이지 누락 감지');
 }
 throw new Error('TourAPI 페이지 상한 초과; 잘린 후보 목록을 저장하지 않습니다.');
}
