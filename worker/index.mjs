import {weatherResponse} from './weather.mjs';
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname==='/api/weather')return weatherResponse(request,{cache:caches.default});
    if(url.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
    return env.ASSETS.fetch(request);
  }
};
