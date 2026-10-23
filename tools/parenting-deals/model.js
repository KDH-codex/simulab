export const CATEGORIES = {all:'전체', supplies:'출산·생활용품', clothing:'아이 옷', toys:'완구·놀이'};
export const TYPES = {sale:'표시가격', coupon:'회원 쿠폰', guide:'공식 안내'};
const hour = 3600000;
const isKstTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)+9*hour).toISOString().slice(0,19) === value.slice(0,19);
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeOfficialUrl(value, hosts) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && hosts.includes(url.hostname) && !url.hash; } catch { return false; }
}
export function reviewState(item, now = new Date()) {
  if (item.mode === 'link') return {code:'link', label:'공식몰에서 확인', current:false};
  const checked = Date.parse(item.checkedAt), time = +new Date(now);
  if (!Number.isFinite(checked) || !Number.isFinite(time) || checked > time) return {code:'pending', label:'검토 필요', current:false};
  if (item.endsAt && time >= Date.parse(item.endsAt)) return {code:'ended', label:'종료된 안내', current:false};
  if (item.startsAt && time < Date.parse(item.startsAt)) return {code:'upcoming', label:'시작 전 안내', current:false};
  if (time - checked > item.reviewWithinHours * hour) return {code:'stale', label:'재확인 필요', current:false};
  return {code:'reviewed', label:item.endsAt ? '기간 안내 확인' : '표시정보 확인 · 종료일 미공개', current:true};
}
export function matchesFilters(item, {category='all', type='all', query=''}={}) {
  const words = query.trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);
  const haystack = [item.name,item.title,CATEGORIES[item.category],item.category==='toys'?'장난감':'',item.operator,item.summary,item.linkNote].join(' ').toLocaleLowerCase('ko-KR');
  return (category === 'all' || item.category === category) && (type === 'all' || item.type === type) && words.every(word => haystack.includes(word));
}
export function validateShop(item, now = new Date()) {
  const errors = [];
  for (const field of ['id','name','operator','category','title','checkedAt','sourceUrl','termsUrl','rightsNote','shipping']) if (!item[field]) errors.push('Missing '+field);
  if (!/^[a-z0-9-]+$/.test(item.id || '')) errors.push('Invalid id');
  if (!Object.hasOwn(CATEGORIES,item.category) || item.category === 'all') errors.push('Invalid category');
  if (!Object.hasOwn(TYPES,item.type)) errors.push('Invalid type');
  if (!['summary','link'].includes(item.mode)) errors.push('Invalid publication mode');
  for (const field of ['sourceUrl','termsUrl','identityUrl']) if (!safeOfficialUrl(item[field],item.allowedHosts || [])) errors.push('Unsafe '+field);
  if (!isKstTimestamp(item.checkedAt) || Date.parse(item.checkedAt) > +new Date(now)) errors.push('Invalid or future review timestamp');
  for (const field of ['startsAt','endsAt']) if (item[field] && !isKstTimestamp(item[field])) errors.push('Invalid '+field);
  if (item.startsAt && item.endsAt && item.startsAt >= item.endsAt) errors.push('Inverted period');
  if (item.mode === 'summary') {
    if (item.rightsStatus !== 'facts-only' || !item.summary || !item.conditions?.length) errors.push('Unreviewed summary');
    if (!Number.isInteger(item.reviewWithinHours) || item.reviewWithinHours < 1 || item.reviewWithinHours > 168) errors.push('Invalid recheck interval');
    if (item.type === 'sale' && (!Number.isSafeInteger(item.priceWon) || item.priceWon <= 0 || item.reviewWithinHours > 24)) errors.push('Invalid price or price review interval');
    if (item.type === 'coupon' && !item.eligibility) errors.push('Missing coupon eligibility');
  } else if (item.priceWon != null || item.summary || item.conditions?.length || item.startsAt || item.endsAt || item.type !== 'guide') errors.push('Restricted shop leaked promotion details');
  return errors;
}
export const formatCheckedAt = value => value.slice(0,16).replace('T',' ')+' KST';
export function renderShop(item, now = new Date()) {
  const esc = escapeHtml, state = reviewState(item,now), isSummary = item.mode === 'summary';
  const facts = isSummary ? `<div class="deal-facts"${state.current?'':' hidden'}><p class="deal-summary">${esc(item.summary)}</p><ul>${item.conditions.map(condition=>'<li>'+esc(condition)+'</li>').join('')}</ul><p class="shipping"><b>배송</b> ${esc(item.shipping)}</p></div>` : `<p class="deal-summary">${esc(item.linkNote)}</p>`;
  return `<article class="deal-card ${isSummary?'':'link-card'}" id="shop-${esc(item.id)}" data-shop="${esc(item.id)}"><div class="deal-meta"><span class="shop-category">${esc(CATEGORIES[item.category])}</span><span class="review-state" data-state="${state.code}">${esc(state.label)}</span></div><div class="shop-heading"><span class="shop-monogram" aria-hidden="true">${esc(item.mark)}</span><div><p class="shop-name">${esc(item.name)}</p><p class="shop-operator">${esc(item.operator)}</p></div></div><h3>${esc(item.title)}</h3><div class="deal-highlight"${isSummary&&state.current?'':' hidden'}>${esc(item.highlight || '')}<span>${esc(TYPES[item.type])} · 확인 당시</span></div>${facts}<p class="recheck-note"${isSummary&&!state.current?'':' hidden'}>확인 주기를 지났거나 기간이 달라졌습니다. 이전 가격·조건을 현재 혜택으로 표시하지 않습니다. 공식 안내를 확인해 주세요.</p><div class="deal-period"><span>${isSummary?'종료일':'안내 범위'}</span><b>${isSummary?(item.endsAt?esc(formatCheckedAt(item.endsAt)):'공개 안내에서 확인하지 못함'):'세부 혜택은 원문에서 확인'}</b></div><div class="deal-bottom"><p>공식 페이지 검토 <time datetime="${esc(item.checkedAt)}">${esc(formatCheckedAt(item.checkedAt))}</time></p><a class="official-link" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.name)} 공식 안내 새 창에서 보기">공식 안내 보기 <span aria-hidden="true">↗</span></a></div><details class="source-details"><summary>출처와 수록 기준</summary><p>${esc(item.rightsNote)}</p><a href="${esc(item.identityUrl)}" target="_blank" rel="noopener noreferrer">운영사·공식몰 확인</a><a href="${esc(item.termsUrl)}" target="_blank" rel="noopener noreferrer">이용약관</a></details></article>`;
}
