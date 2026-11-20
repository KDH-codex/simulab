import {mkdir} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';
import {root, esc, shell, events, today, eventUrl, badge, imageMarkup} from './festival-platform.mjs';

const collectionPath = '/curation/christmas/';
const season = {start:'2026-11-20', end:'2027-01-10'};
const byId = new Map(events.map(event=>[event.id,event]));
const cover = byId.get('busan-christmas-village-2026');
const groups = [
  {id:'early', title:'11월 말~12월 초', ids:[
    'seoul-lotte-town-christmas-market-2026','busan-christmas-village-2026','ulsan-christmas-market-2026',
    'jeju-christmas-village-2026','chilgok-christmas-market-2026','daejeon-yuseong-christmas-2026',
    'daegu-christmas-fair-2026','incheon-ohslow-vintage-market-2026'
  ]},
  {id:'mid-december', title:'12월 중순', ids:[
    'seoul-gwanghwamun-market-2026','seogwipo-jeju-icc-santa-2026'
  ]},
  {id:'christmas-week', title:'성탄 주간', ids:[
    'seoul-hangang-christmas-market-2026','hampyeong-winter-lights-2026','incheon-paradise-alpine-market-2026'
  ]}
];

const cakes = [
  {name:'배스킨라빈스', start:'2026-11-19', end:'2026-12-15', pickup:'12.21–12.25',
    terms:'일반 사전예약 최대 30%. 배라앱·해피오더·카카오 등 채널별 조건을 확인하고 수령 매장을 선택하세요.',
    url:'https://baskinrobbins.co.kr/information-center/press/view.php?findword=&page=1&seq=1494'},
  {name:'뚜레쥬르', start:'2026-11-11', end:'2026-12-22', pickup:'12.18–12.25',
    terms:'뚜레쥬르 앱에서 대상 홀리데이 케이크 사전예약 시 최대 30%. 매장 수령일을 선택하세요.',
    url:'https://www.tlj.co.kr/microsite/2026/holiday/intro.asp'}
];

const decor = {
  name:'이케아 크리스마스 홈데코', start:'2026-11-14', end:'2026-11-30',
  terms:'IKEA Family 회원이 지정 크리스마스 제품을 7만원 이상 구매할 때 15%, 최대 5만원. 회원당 1회이며 배송·조립 비용은 제외됩니다.',
  url:'https://www.ikea.com/kr/ko/campaigns/11-14-pub6a561c20/'
};

const fmt = date=>date.slice(5).replace('-','.');
function dateRange(start,end) {
  return fmt(start)+'–'+(start.slice(0,4)===end.slice(0,4)?fmt(end):end.replaceAll('-','.'));
}
function seasonalImage(){
  return cover ? `<div class="christmas-image">${imageMarkup(cover,{compact:true})}</div>` : '';
}

export function christmasHomeSection() {
  if (today<season.start || today>season.end) return '';
  return `<section class="christmas-spotlight" aria-labelledby="christmas-heading" data-christmas-until="${season.end}">
    ${seasonalImage()}
    <div class="christmas-spotlight-copy">
      <h2 id="christmas-heading">크리스마스 특집</h2>
      <p>겨울 마켓과 빛축제, 성탄 주간 나들이와 케이크 예약을 모았어요.</p>
      <a class="button secondary" href="${collectionPath}">크리스마스 모음집 보기 <span aria-hidden="true">↗</span></a>
    </div>
    <nav class="christmas-shortcuts" aria-label="크리스마스 일정 바로가기">
      <a href="${collectionPath}#early">12월 초 마켓 <span aria-hidden="true">↗</span></a>
      <a href="${collectionPath}#christmas-week">성탄 주간 <span aria-hidden="true">↗</span></a>
      <a href="${collectionPath}#holiday-shopping">케이크 예약·장식 할인 <span aria-hidden="true">↗</span></a>
    </nav>
  </section>`;
}

function eventRow(event) {
  return `<article class="christmas-event">
    <div class="christmas-event-meta"><span>${esc(event.region)}</span><span>${esc(dateRange(event.startDate,event.endDate))}</span></div>
    <h3><a href="${eventUrl(event)}">${esc(event.title)}</a></h3>
    <p class="christmas-program">${esc(event.program)}</p>
    <dl>
      <div><dt>장소</dt><dd data-original lang="ko">${esc(event.location)}</dd></div>
      <div><dt>운영 시간</dt><dd data-original lang="ko">${esc(event.time||'운영 시간은 공식 안내 확인')}</dd></div>
      <div><dt>예약·비용</dt><dd data-original lang="ko">${esc(event.fee)}<br>${esc(event.booking)}</dd></div>
    </dl>
    ${event.scheduleNote?`<p class="christmas-date-note" data-original lang="ko">${esc(event.scheduleNote)}</p>`:''}
    <div class="christmas-event-links">
      <a href="${eventUrl(event)}">상세보기 <span aria-hidden="true">↗</span></a>
      <a href="${esc(event.sources[0].url)}" target="_blank" rel="noopener noreferrer">공식 안내 <span aria-hidden="true">↗</span></a>
      <span class="christmas-state" data-event-status="${event.id}">${esc(badge(event))}</span>
    </div>
  </article>`;
}

function campaignStatus(end) {
  return `<span class="christmas-state" data-christmas-offer-end="${end}"${end<today?'':' hidden'}>종료된 일정</span>`;
}

export async function buildChristmasCollection() {
  const content = groups.map(group=>({
    ...group, entries:group.ids.map(id=>byId.get(id)).filter(Boolean)
  })).filter(group=>group.entries.length);
  const nav = content.map(group=>`<a href="#${group.id}">${esc(group.title)}</a>`).join('');
  const sections = content.map(group=>`<section class="christmas-group" id="${group.id}">
    <h2>${esc(group.title)}</h2><div class="christmas-event-grid">${group.entries.map(eventRow).join('')}</div>
  </section>`).join('');
  const shopping = `<section class="christmas-group" id="holiday-shopping">
    <h2>케이크 예약·장식 할인</h2>
    <div class="christmas-offers">${cakes.map(cake=>`<article>
      <h3 data-original lang="ko">${esc(cake.name)}</h3>
      <dl><div><dt>예약 기간</dt><dd>${esc(dateRange(cake.start,cake.end))}</dd></div>
      <div><dt>매장 수령</dt><dd>${esc(cake.pickup)}</dd></div></dl>
      <p data-original lang="ko">${esc(cake.terms)}</p>
      <a href="${esc(cake.url)}" target="_blank" rel="noopener noreferrer">공식 예약 안내 <span aria-hidden="true">↗</span></a>
      ${campaignStatus(cake.end)}
    </article>`).join('')}
    <article>
      <h3 data-original lang="ko">${esc(decor.name)}</h3>
      <dl><div><dt>할인 기간</dt><dd>${esc(dateRange(decor.start,decor.end))}</dd></div></dl>
      <p data-original lang="ko">${esc(decor.terms)}</p>
      <a href="${esc(decor.url)}" target="_blank" rel="noopener noreferrer">공식 쿠폰 안내 <span aria-hidden="true">↗</span></a>
      ${campaignStatus(decor.end)}
    </article></div>
    <a class="text-link" href="/sales/">할인·쇼핑 더 보기 <span aria-hidden="true">↗</span></a>
  </section>`;
  const body = `<main id="main" class="page-width christmas-page">
    <div class="christmas-collection-hero"><div>
      <p class="christmas-season-year">2026</p>
      <h1>크리스마스 모음집</h1>
      <p>겨울 마켓부터 성탄 주간 행사까지. 운영일과 예약 조건을 확인하고 갈 곳을 골라보세요.</p>
    </div>${seasonalImage()}</div>
    <nav class="christmas-nav" aria-label="크리스마스 일정 바로가기">${nav}<a href="#holiday-shopping">케이크 예약·장식 할인</a></nav>
    ${sections}${shopping}
  </main>`;
  await mkdir(new URL(collectionPath.slice(1),root),{recursive:true});
  await writeFile(new URL('curation/christmas/index.html',root),shell({
    title:'2026 크리스마스 모음집 | 마켓·빛축제·케이크 사전예약',
    description:'2026 전국 크리스마스 마켓과 빛축제, 성탄 주간 나들이 일정, 케이크 사전예약 기간과 수령일을 공식 링크로 안내합니다.',
    path:collectionPath,page:'christmas',body,
    extraHead:'<link rel="stylesheet" href="/assets/css/festival-christmas.css">'
  }));
}
