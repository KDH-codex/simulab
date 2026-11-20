import {splitHeading} from '../assets/js/festival-heading-motion.js';
import {CHRISTMAS_HEADING} from '../assets/js/festival-christmas-model.js';
import {imageCaption, miniEvent} from '../assets/js/festival-presentation.js';
import {esc, images, imageMarkup, keywordTags, badge, shortRange, themes, eventUrl} from './festival-platform.mjs';

export function renderFestivalHero(picks,{seasonal=false,weekend,weekendCount=0}={}) {
  const hero = picks[0];
  const heading = seasonal ? `<h1 class="christmas-hero-heading">${CHRISTMAS_HEADING}</h1>` : splitHeading(['이번 주','어디 갈까?']);
  const sideTitle = seasonal?'크리스마스 TOP 3':'✦ 이번 주말 추천';
  const summary = seasonal?'마켓·빛축제·성탄 주간':
    `${weekend.start.slice(5).replace('-','.')} — ${weekend.end.slice(5).replace('-','.')} · 수록 일정 ${weekendCount}건`;
  const secondaryUrl = seasonal ? '#early' : '/calendar/';
  const sideUrl = seasonal ? '#christmas-week' : '/curation/';
  const showControls = picks.length>1?'':' hidden';
  return `<section class="hero-layout${seasonal?' christmas-hero':''}" data-hero-mode="${seasonal?'christmas':'weekend'}" aria-label="${sideTitle}"${hero?'':' hidden'}>
    <div class="hero-main theme-${esc(hero?.theme||'kids')}" id="hero-main">
      <div class="hero-image" data-hero-image>${hero?imageMarkup(hero,{hero:true}):''}</div>
      <div class="hero-shade"></div>
      <p class="hero-picture-note" data-hero-credit>${esc(imageCaption(hero&&images[hero.id]))}</p>
      <div class="hero-top">
        <span class="orange-badge">${seasonal?'크리스마스 특집':'● 이번 주의 발견'}</span>
        <div class="hero-controls"${showControls}>
          <button id="hero-prev" aria-label="이전 추천">‹</button>
          <button id="hero-pause" aria-label="자동 전환 일시정지" aria-pressed="false">Ⅱ</button>
          <span id="hero-position">01 / ${String(picks.length).padStart(2,'0')}</span>
          <button id="hero-next" aria-label="다음 추천">›</button>
        </div>
      </div>
      <div class="hero-copy">
        <p class="hero-kicker">${seasonal?'마켓·빛축제·성탄 주간':'일상에 설렘을 더하는 축제 한 조각'}</p>
        <div>${heading}</div>
        <div class="hero-event-details">
          <p class="hero-event" data-hero-title>${esc(hero?.title)}</p>
          <p class="hero-meta" data-hero-meta>${hero?'▦ '+esc(shortRange(hero))+'　⌖ '+esc(hero.region):''}</p>
          <p class="hero-description" data-hero-description>${esc(hero?.program)}</p>
          <div data-hero-tags>${hero&&!seasonal?keywordTags(hero,'hero-tags'):''}</div>
          <div class="hero-actions">
            <a href="${hero?eventUrl(hero):'/curation/'}" data-preview="${esc(hero?.id)}" data-hero-detail class="button primary">축제 자세히 보기 ↗</a>
            <a class="hero-calendar-link" href="${secondaryUrl}">${seasonal?'크리스마스 행사 모두 보기':'달력으로 찾아보기 →'}</a>
          </div>
        </div>
      </div>
      <div class="hero-dots"${showControls}>${picks.map((event,index)=>
        `<button type="button" data-hero-slide="${index}" aria-label="추천 ${index+1} · ${esc(event.title)}" aria-pressed="${index===0}"></button>`
      ).join('')}</div>
    </div>
    <aside class="hero-side">
      <div class="section-title small"><h2>${sideTitle}</h2><span${seasonal?' hidden':''}>FESTIVAL PICKS</span></div>
      <div class="hero-side-items" data-hero-side-items>${picks.slice(1).map(event=>miniEvent(event,{
        url:eventUrl(event),image:images[event.id],status:badge(event),dates:shortRange(event),theme:themes[event.theme][1]
      })).join('')}</div>
      <a class="weekend-banner" href="${sideUrl}"><span class="banner-symbol" aria-hidden="true">${seasonal?'✦':'✳'}</span>
        <span><b>${seasonal?'성탄 주간 일정 보기':'이번 주말, 같이 떠나요'}</b><small data-weekend-summary>${esc(summary)}</small></span>
        <span aria-hidden="true">↗</span>
      </a>
    </aside>
  </section>`;
}
