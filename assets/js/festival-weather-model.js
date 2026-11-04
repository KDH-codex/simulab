// Representative city points, never festival-venue coordinates or device location.
export const WEATHER_STATIONS={
  seoul:{city:'서울',group:'서울',lat:37.5665,lon:126.978},
  suwon:{city:'수원',group:'경기지역',lat:37.2636,lon:127.0286},
  gangneung:{city:'강릉',group:'강원지역',lat:37.7519,lon:128.8761},
  daejeon:{city:'대전',group:'충청지역',lat:36.3504,lon:127.3845},
  gwangju:{city:'광주',group:'전라지역',lat:35.1595,lon:126.8526},
  busan:{city:'부산',group:'경상지역',lat:35.1796,lon:129.0756},
  jeju:{city:'제주',group:'제주지역',lat:33.4996,lon:126.5312}
};
export function weatherDescription(symbol='') {
  const base=String(symbol).replace(/_(day|night|polartwilight)$/,'');
  if(base.includes('thunder'))return {icon:'⛈',label:'천둥·번개'};
  if(base.includes('sleet'))return {icon:'🌨',label:'진눈깨비'};
  if(base.includes('snow'))return {icon:'❄',label:'눈'};
  if(base.includes('rain'))return {icon:'☂',label:'비'};
  if(base==='fog')return {icon:'≋',label:'안개'};
  if(base==='cloudy')return {icon:'☁',label:'흐림'};
  if(base==='partlycloudy')return {icon:'⛅',label:'구름 많음'};
  if(base==='fair')return {icon:'🌤',label:'대체로 맑음'};
  if(base==='clearsky')return {icon:symbol.endsWith('_night')?'☾':'☀',label:'맑음'};
  return {icon:'—',label:'상태 확인 필요'};
}
export function summarizeForecast(raw,{now=new Date()}={}) {
  if(!Array.isArray(raw?.properties?.timeseries))throw new Error('Invalid weather timeseries');
  const updatedAt=raw.properties.meta?.updated_at;
  if(!Number.isFinite(Date.parse(updatedAt))||raw.properties.meta?.units?.air_temperature!=='celsius')throw new Error('Invalid weather metadata');
  if(now-new Date(updatedAt)>36*3600000||new Date(updatedAt)-now>3600000)throw new Error('Stale weather forecast');
  const days=new Map();
  for(const row of raw.properties.timeseries) {
    const at=Date.parse(row.time),temperature=row.data?.instant?.details?.air_temperature;
    if(!Number.isFinite(at)||at<now.getTime()-60000||!Number.isFinite(temperature)||temperature< -80||temperature>65)continue;
    const local=new Date(at+9*3600000).toISOString();
    const date=local.slice(0,10),hour=Number(local.slice(11,13));
    const period=row.data.next_1_hours||row.data.next_6_hours||row.data.next_12_hours;
    const symbol=period?.summary?.symbol_code;
    if(typeof symbol!=='string'||symbol.length>60)continue;
    const candidate={date,at:row.time,localTime:local.slice(11,16),temperature:Math.round(temperature),symbol,...weatherDescription(symbol),score:Math.abs(hour-12)};
    if(!days.has(date)||candidate.score<days.get(date).score)days.set(date,candidate);
  }
  if(!days.size)throw new Error('No usable weather forecast');
  return {updatedAt,days:[...days.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(({score,...day})=>day)};
}
