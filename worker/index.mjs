import {weatherResponse} from './weather.mjs';
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname==='/api/weather')return weatherResponse(request,{cache:caches.default});
    if(url.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
    // Serve the Naver verification file at its original .html URL without an external redirect.
    if(/^\/naver[a-f0-9]+\.html$/.test(url.pathname)){
      url.pathname=url.pathname.slice(0,-5);
      return env.ASSETS.fetch(new Request(url,request));
    }
    return env.ASSETS.fetch(request);
  }
};
