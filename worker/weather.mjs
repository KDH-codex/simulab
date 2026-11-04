import {WEATHER_STATIONS,summarizeForecast} from '../assets/js/festival-weather-model.js';
const provider='MET Norway';
const sourceUrl='https://api.met.no/weatherapi/locationforecast/2.0/documentation';
const license='https://creativecommons.org/licenses/by/4.0/';
const inFlight=new Map();
const json=(data,status=200,ttl=60)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age='+ttl,'X-Content-Type-Options':'nosniff'}});
export async function weatherResponse(request,{fetchFn=fetch,cache=null,now=new Date()}={}) {
  if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
  const url=new URL(request.url),id=url.searchParams.get('region')||'seoul';
  if(!Object.hasOwn(WEATHER_STATIONS,id)||[...url.searchParams.keys()].some(k=>k!=='region'))return json({error:'invalid-region'},400);
  const station=WEATHER_STATIONS[id];
  const cacheKey=new Request(url.origin+'/api/weather?region='+id);
  if(cache){const cached=await cache.match(cacheKey);if(cached)return cached;}
  if(!inFlight.has(id))inFlight.set(id,(async()=>{
    try {
      const upstream=await fetchFn('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat='+station.lat+'&lon='+station.lon,{headers:{'User-Agent':'ThisWeekFestival/1.0 https://github.com/KDH-codex/simulab','Accept':'application/json'},signal:AbortSignal.timeout(12000)});
      if(!upstream.ok)throw new Error('Weather provider unavailable');
      const forecast=summarizeForecast(await upstream.json(),{now});
      const expires=Date.parse(upstream.headers.get('Expires'));
      const ttl=Number.isFinite(expires)&&expires>now.getTime()?Math.ceil((expires-now.getTime())/1000):3600;
      const body={provider,sourceUrl,license,station:{id,...station},...forecast,fetchedAt:now.toISOString(),expiresAt:new Date(now.getTime()+ttl*1000).toISOString(),note:'한국시간 일자별 대표시각 예보입니다. 일 최저·최고 기온이나 행사장 실황이 아닙니다.'};
      const response=json(body,200,ttl);
      if(cache)await cache.put(cacheKey,response.clone());
      return response;
    } catch {return json({error:'weather-unavailable',provider,message:'예보를 불러오지 못했습니다. 잠시 후 다시 확인하세요.'},503,60);}
  })().finally(()=>inFlight.delete(id)));
  return (await inFlight.get(id)).clone();
}
