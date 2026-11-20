import {escapeHtml as esc} from '../../tools/parenting-deals/model.js';
import {SHOP_KINDS,SHOP_CATEGORIES,SHOP_AREAS,SHOP_CHANNELS,shoppingState,shoppingText,saleURL} from './shopping-model.js';
import {shopT as t} from './shopping-i18n.js';
const join=(values,locale)=>values.map(x=>t(x,locale)).join(' · ');
const photoRoot = '/assets/img/shopping/';
export const SHOPPING_PHOTOS = {
  life: {src: photoRoot+'life-reference.webp', alt: '채소와 과일이 담긴 장바구니'},
  fashion: {src: photoRoot+'fashion-reference.webp', alt: '매장에 걸린 겨울 코트와 니트'},
  furniture: {src: photoRoot+'furniture-reference.webp', alt: '소파와 테이블이 놓인 거실'},
  appliances: {src: photoRoot+'appliances-reference.webp', alt: '세탁기와 냉장고가 놓인 공간'},
  kids: {src: photoRoot+'kids-reference.webp', alt: '접어 둔 아기 옷과 기저귀'},
  market: {src: photoRoot+'market-reference.webp', alt: '식료품과 생활용품이 담긴 쇼핑 카트'}
};

function saleFigure(image,{locale='ko',eager=false}={}) {
  const official = Boolean(image.credit);
  const label = official ? t('공식 홍보 이미지',locale)+' · '+image.credit : t('AI 참고 이미지',locale);
  return `<figure class="shopping-photo${official?' shopping-photo-official':''}">
    <img src="${esc(image.src)}" alt="${esc(official?image.alt:t(image.alt,locale))}" ${official?'lang="ko"':''} loading="${eager?'eager':'lazy'}" decoding="async">
    <figcaption>${esc(label)}</figcaption>
  </figure>`;
}

function saleImage(event) {
  const category = event.categories.find(key=>Object.hasOwn(SHOPPING_PHOTOS,key));
  return event.shopping.image || SHOPPING_PHOTOS[category] || SHOPPING_PHOTOS.market;
}

function dateRange(event) {
  return event.startDate.replaceAll('-','.')+' – '+event.endDate.replaceAll('-','.');
}

export function shoppingCategoryLinks() {
  return Object.entries(SHOPPING_PHOTOS).filter(([key])=>key!=='market').map(([key,image])=>
    `<a href="/sales/?category=${key}#shopping-results" data-shop-category-link="${key}">
      <img src="${image.src}" alt="" width="508" height="508" loading="lazy" decoding="async">
      <span>${esc(SHOP_CATEGORIES[key])}</span><span aria-hidden="true">↗</span>
    </a>`
  ).join('');
}

export function saleSpotlight(events,{locale='ko',now=new Date()}={}) {
  const active = events.filter(event=>shoppingState(event,now).active);
  const selected = active.find(event=>event.shopping.image) || active[0] || events[0];
  if (!selected) return saleFigure(SHOPPING_PHOTOS.market,{locale,eager:true});
  const copy = shoppingText(selected,locale);
  return `${saleFigure(saleImage(selected),{locale,eager:true})}
    <div class="shopping-spotlight-caption">
      <div><p>${esc(t('주목할 할인',locale))} · ${esc(dateRange(selected))}</p>
      <h2><a href="${saleURL(selected)}" data-sale-preview="${esc(selected.id)}">${esc(copy.title)}</a></h2></div>
      <a class="button secondary" href="${saleURL(selected)}" data-sale-preview="${esc(selected.id)}">${esc(t('조건 확인하기',locale))} ↗</a>
    </div>`;
}

export function saleCard(event,{locale='ko',now=new Date(),saved=[]}={}) {
  const shop = event.shopping;
  const copy = shoppingText(event,locale);
  const status = shoppingState(event,now);
  const isSaved = saved.includes(event.id);
  const scope = shop.specificStore?'특정 지점':(event.channels.includes('store')?'참여 점포 확인':'온라인');
  const url = saleURL(event);
  const id = esc(event.id);
  return `<article class="festival-card shopping-card" data-shopping-id="${id}">
    <div class="shopping-art">
      <a class="shopping-cover-link" href="${url}" data-sale-preview="${id}" aria-label="${esc(copy.title)}">${saleFigure(saleImage(event),{locale})}</a>
      <span class="shopping-status state-${status.code}">${esc(t(status.label,locale))}</span>
      <button type="button" class="save-button" data-sale-save="${id}" aria-pressed="${isSaved}" aria-label="${esc(copy.title+' · '+t('할인 보관함',locale))}">${isSaved?'♥':'♡'}</button>
    </div>
    <div class="card-content">
      <p class="place-label">${esc(t(SHOP_KINDS[shop.kind],locale))} · ${esc(t(SHOP_AREAS[shop.area],locale))}</p>
      <h3><a href="${url}" data-sale-preview="${id}">${esc(copy.title)}</a></h3>
      <p class="shopping-card-period">${esc(dateRange(event))}</p>
      <p class="card-description">${esc(copy.summary)}</p>
      <div class="tag-row shopping-tags">
        <span>${esc(t(scope,locale))}</span>${shop.membership?'<span>'+esc(t('회원·가입 조건',locale))+'</span>':''}${shop.card?'<span>'+esc(t('카드 조건',locale))+'</span>':''}
      </div>
      <div class="card-bottom">
        <small>${esc(t('원문 확인',locale))} ${esc(event.checkedAt.slice(0,10).replaceAll('-','.'))}</small>
        <a class="detail-button" href="${url}" data-sale-preview="${id}">${esc(t('조건 확인하기',locale))} ↗</a>
      </div>
    </div>
  </article>`;
}
export function saleDetails(e,{locale='ko',now=new Date(),saved=[]}={}) {
 const s=e.shopping,copy=shoppingText(e,locale),status=shoppingState(e,now);
 return '<div class="shopping-detail-heading"><p class="eyebrow">'+esc(t(SHOP_KINDS[s.kind],locale))+' · <span translate="no">'+esc(s.brandCode)+'</span></p><h2 id="dialog-title">'+esc(copy.title)+'</h2><p>'+esc(copy.summary)+'</p><span class="shopping-inline-status state-'+status.code+'">'+esc(t(status.label,locale))+'</span></div><div class="shopping-detail-image">'+saleFigure(saleImage(e),{locale})+(s.image?'<a href="'+esc(s.image.usageUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(t('이미지 이용 안내 ↗',locale))+'</a>':'')+'</div><dl class="fact-grid"><div><dt>'+esc(t('기간',locale))+'</dt><dd>'+esc(e.startDate.replaceAll('-','.'))+' — '+esc(e.endDate.replaceAll('-','.'))+'</dd></div><div><dt>'+esc(t('이용 채널',locale))+'</dt><dd>'+esc(join([...e.channels.map(c=>SHOP_CHANNELS[c]),...(s.app?['앱']:[])],locale))+'</dd></div><div><dt>'+esc(t('판매처',locale))+'</dt><dd data-original lang="ko">'+esc(e.brandName)+'</dd></div><div><dt>'+esc(t('적용 지점',locale))+'</dt><dd data-original lang="ko">'+esc(s.storeScope)+'</dd></div></dl><p class="shopping-original-note">'+esc(t('세부 조건은 한국어 원문과 공식 안내를 확인하세요.',locale))+'</p><div class="modal-tabs shopping-detail-tabs" role="tablist" aria-label="'+esc(t('할인 상세',locale))+'">'+[['conditions','혜택과 이용 조건'],['schedule','기간·적용 범위'],['source','공식 출처']].map(([id,label],i)=>'<button type="button" role="tab" id="shopping-tab-'+id+'" aria-controls="shopping-panel-'+id+'" aria-selected="'+!i+'" tabindex="'+(i?-1:0)+'" data-sale-tab="'+id+'">'+esc(t(label,locale))+'</button>').join('')+'</div><section class="modal-panel" id="shopping-panel-conditions" role="tabpanel" aria-labelledby="shopping-tab-conditions"><h3>'+esc(t('혜택과 이용 조건',locale))+'</h3><ul class="shopping-conditions" data-original lang="ko">'+e.conditions.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul></section><section class="modal-panel" id="shopping-panel-schedule" role="tabpanel" aria-labelledby="shopping-tab-schedule" hidden><h3>'+esc(t('기간·적용 범위',locale))+'</h3><p data-original lang="ko">'+esc(e.periodNote)+'</p><p>'+esc(t('기간은 한국시간, 금액은 원(KRW) 기준입니다. 재고·쿠폰 잔여량은 실시간 정보가 아닙니다.',locale))+'</p><p>'+esc(t('최근 원문 확인 후 48시간이 지난 행사는 재확인이 필요합니다.',locale))+'</p></section><section class="modal-panel" id="shopping-panel-source" role="tabpanel" aria-labelledby="shopping-tab-source" hidden><h3>'+esc(t('공식 출처',locale))+'</h3><p><span data-original lang="ko">'+esc(e.brandName)+'</span> · '+esc(t('원문 확인',locale))+' '+esc(e.checkedAt)+'</p><a class="button secondary" href="'+esc(e.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(t('공식 쇼핑 안내 ↗',locale))+'</a></section><p class="microcopy shopping-disclaimer">'+esc(t('제공처 안내가 우선합니다. 판매·예약·쿠폰 발급을 대행하지 않습니다.',locale))+'</p>';
}
export function saleActions(e,{locale='ko',saved=[],includeDetailLink=true}={}) {
 return '<div class="modal-bottom shopping-actions"><a class="button primary" href="'+esc(e.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(t('공식 쇼핑 안내 ↗',locale))+'</a>'+(includeDetailLink?'<a class="button secondary" href="'+saleURL(e)+'">'+esc(t('전체 상세보기',locale))+'</a>':'')+'<button type="button" class="button secondary" data-sale-save="'+esc(e.id)+'" aria-pressed="'+saved.includes(e.id)+'">'+esc(t(saved.includes(e.id)?'♥ 보관됨':'♡ 할인 보관',locale))+'</button><button type="button" class="share-button" data-sale-share="'+esc(e.id)+'" aria-label="'+esc(t('공유',locale))+'">↗</button></div>';
}
export function sourceLinks(sources,locale='ko') {return sources.map(source=>'<a href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer"><b data-original lang="ko">'+esc(source.name)+'</b><span>'+esc(t(source.status,locale))+'</span><small>'+esc(t('공식 홈페이지 ↗',locale))+'</small></a>').join('');}
