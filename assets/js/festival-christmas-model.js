export const CHRISTMAS_PATH = '/curation/christmas/';
export const CHRISTMAS_START = '2026-11-20';
export const CHRISTMAS_END = '2027-01-10';
export const CHRISTMAS_HEADING = '2026 크리스마스 가볼 만한 곳';

export const CHRISTMAS_GROUPS = [
  {id:'early', title:'11월 말~12월 초', ids:[
    'seoul-lotte-town-christmas-market-2026','chuncheon-legoland-christmas-2026',
    'busan-christmas-village-2026','ulsan-christmas-market-2026','jeju-christmas-village-2026',
    'chilgok-christmas-market-2026','daejeon-yuseong-christmas-2026','daegu-christmas-fair-2026',
    'incheon-ohslow-vintage-market-2026'
  ]},
  {id:'mid-december', title:'12월 중순', ids:[
    'seoul-gwanghwamun-market-2026','seoul-lantern-winter-2026','seoul-christmas-pet-show-2026',
    'seogwipo-jeju-icc-santa-2026'
  ]},
  {id:'christmas-week', title:'성탄 주간', ids:[
    'seoul-hangang-christmas-market-2026','seoul-plaza-ice-rink-2026',
    'hampyeong-winter-lights-2026','incheon-paradise-alpine-market-2026'
  ]}
];
const topIds = ['seoul-lotte-town-christmas-market-2026','busan-christmas-village-2026','seoul-gwanghwamun-market-2026'];
const moreIds = ['jeju-christmas-village-2026','daejeon-yuseong-christmas-2026','seoul-hangang-christmas-market-2026','incheon-paradise-alpine-market-2026','seoul-plaza-ice-rink-2026'];
const collectionIds = CHRISTMAS_GROUPS.flatMap(group=>group.ids);
export function isChristmasSeason(today) {
  return today>=CHRISTMAS_START && today<=CHRISTMAS_END;
}

export function christmasRecommendations(events,today,hasImage) {
  if (!isChristmasSeason(today)) return {heroes:[], cards:[]};
  const available = new Map(events.filter(event=>
    event.publicationStatus!=='cancelled' && event.endDate>=today && event.startDate<=CHRISTMAS_END
  ).map(event=>[event.id,event]));
  const ranked = [...new Set([...topIds,...moreIds,...collectionIds])].map(id=>available.get(id)).filter(Boolean);
  const heroes = ranked.filter(hasImage).slice(0,3);
  const featured = new Set(heroes.map(event=>event.id));
  return {heroes,cards:ranked.filter(event=>!featured.has(event.id)).slice(0,3)};
}
