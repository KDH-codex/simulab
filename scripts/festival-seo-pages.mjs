import {mkdir} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';
import {root, esc, shell, active, activeDeals, dealCardHTML, today, card, eventUrl} from './festival-platform.mjs';
import {REGION_SEO_PAGES, isIndoorVenue, isWinterSeasonEvent, eventCategoryOf} from '../assets/js/festival-ui-model.js';

/**
 * 10개 SEO 전용 랜딩 페이지(/region/* 7개 + /curation/indoor, free, winter-2026)를 정적 생성합니다.
 */
function buildFaqItems(heading, items, indoorCount, freeCount) {
  const topNames = items.slice(0, 3).map(e => e.title).join(', ');
  return [
    {
      q: `${heading}에는 현재 몇 건의 공식 확인 일정이 있나요?`,
      a: `한국시간 ${today} 기준 공식 출처로 확인된 활성 일정 ${items.length}건(그중 실내 시설 ${indoorCount}건, 입장·기본참여 무료 ${freeCount}건)을 수록했습니다.${topNames ? ` 대표 일정으로 ${topNames} 등이 있습니다.` : ''}`
    },
    {
      q: '표기된 입장 무료 여부나 시간은 방문 전 그대로 믿어도 되나요?',
      a: '우천·한파·현장 혼잡이나 회차 마감에 따라 운영 시간이 바뀔 수 있고, 무료 입장 행사도 체험·먹거리 비용은 별도일 수 있으므로 출발 전 각 상세 페이지의 공식 공지 링크를 꼭 확인해 주세요.'
    },
    {
      q: '여러 후보 일정을 일행에게 공유하거나 한눈에 비교할 수 있나요?',
      a: '상단의 "추천 3곳 한눈에 비교하기" 버튼을 누르거나 관심 카드의 ♡ 버튼을 눌러 보관함에 담은 뒤, 일행과 비교 보드 링크·카톡 요약 텍스트를 바로 공유할 수 있습니다.'
    }
  ];
}

function seoNavigationBar(currentPath) {
  const collections = [
    ['/curation/exhibitions/', '🖼️ 전시·박람회'],
    ['/curation/indoor/', '🏛 실내 체험·기관'],
    ['/curation/free/', '💸 입장 무료'],
    ['/curation/winter-2026/', '❄️ 겨울·연말 특집'],
    ['/curation/christmas/', '🎄 크리스마스'],
    ...REGION_SEO_PAGES.map(r => [`/region/${r.slug}/`, `⌖ ${r.shortLabel}`])
  ];
  return `<nav class="seo-nav-pills" aria-label="권역·테마별 모음 바로가기">${collections.map(([href, label]) =>
    `<a href="${href}"${href === currentPath ? ' aria-current="page"' : ''}>${esc(label)}</a>`
  ).join('')}</nav>`;
}

function pickRelatedDeals(areaKeys = []) {
  const local = areaKeys.length ? activeDeals.filter(d => areaKeys.includes(d.shopping?.area)) : [];
  const nationwide = activeDeals.filter(d => d.shopping?.area === 'nationwide');
  const picked = []; const seen = new Set();
  for (const deal of [...local, ...nationwide]) {
    if (seen.has(deal.brandId)) continue;
    seen.add(deal.brandId);
    picked.push(deal);
    if (picked.length >= 3) break;
  }
  return picked;
}

async function writeCollectionPage({relDir, pathUrl, h1, eyebrow, lead, title, description, items, areaKeys = [], page = 'collection'}) {
  const indoorCount = items.filter(isIndoorVenue).length;
  const freeCount = items.filter(e => e.feeStatus === 'free').length;
  const latestChecked = items.map(e => e.checkedAt).sort().at(-1) || today;
  const topIds = items.slice(0, 3).map(e => e.id).join(',');
  const compareHref = topIds ? `/?picks=${encodeURIComponent(topIds)}#shared-picks-board` : '/#discover';
  const relatedDeals = pickRelatedDeals(areaKeys);
  const faqs = buildFaqItems(h1, items, indoorCount, freeCount);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: h1,
        description,
        url: 'https://simulab.kr' + pathUrl,
        inLanguage: 'ko-KR'
      },
      {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.slice(0, 20).map((e, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: e.title,
          url: 'https://simulab.kr' + eventUrl(e)
        }))
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {'@type': 'Answer', text: f.a}
        }))
      }
    ]
  };

  const heroSection = `<section class="seo-hero">
    <p class="eyebrow">${esc(eyebrow)}</p>
    <h1>${esc(h1)}</h1>
    <p class="seo-lead">${esc(lead)}</p>
    <dl class="seo-stats">
      <div><dt>수록 일정</dt><dd>${items.length}건</dd></div>
      <div><dt>실내 시설</dt><dd>${indoorCount}건</dd></div>
      <div><dt>기본 입장 무료</dt><dd>${freeCount}건</dd></div>
      <div><dt>최근 확인일</dt><dd>${esc(latestChecked)}</dd></div>
    </dl>
    <div class="seo-hero-actions">
      <a class="button primary" href="${esc(compareHref)}">🔍 추천 3곳 한눈에 비교하기 ↗</a>
      <a class="button secondary" href="/calendar/">📅 달력으로 일정 보기 ↗</a>
    </div>
  </section>`;

  const dealsSection = relatedDeals.length
    ? `<section class="nearby-deals-section" aria-labelledby="collection-deals-heading"><div class="section-title"><div><p class="eyebrow">SHOPPING & DEALS NEARBY</p><h2 id="collection-deals-heading">🛍 함께 확인하면 좋은 이번 주 할인</h2><p>나들이 전후 챙길 해당 권역·온라인 공식 확인 할인입니다.</p></div><a class="text-link" href="/sales/">전체 할인·쇼핑 보기 ↗</a></div><div class="home-deals-grid seo-deals-grid">${relatedDeals.map(dealCardHTML).join('')}</div></section>`
    : '';

  const faqSection = `<section class="seo-faq" aria-labelledby="seo-faq-heading"><h2 id="seo-faq-heading">자주 묻는 질문</h2><div class="seo-faq-list">${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div></section>`;

  const cardsMarkup = items.length
    ? `<div class="event-grid collection-grid">${items.map(card).join('')}</div>`
    : `<div class="empty-state"><h3>현재 수록된 예정 일정이 없습니다</h3><p>다른 권역이나 전체 축제 달력에서 일정을 확인해 보세요.</p><a class="button secondary" href="/">전체 일정 보기 ↗</a></div>`;

  const body = `<main id="main" class="page-width collection-page">
    <div class="breadcrumbs"><a href="/">홈</a><span>/</span><a href="/map/">지역·테마 모음</a><span>/</span><span>${esc(h1)}</span></div>
    ${heroSection}
    ${seoNavigationBar(pathUrl)}
    <section aria-label="${esc(h1)} 목록">${cardsMarkup}</section>
    ${dealsSection}
    ${faqSection}
  </main>`;

  await mkdir(new URL(relDir, root), {recursive: true});
  await writeFile(new URL(relDir + 'index.html', root), shell({
    title, description, path: pathUrl, page, body, adEligible: false, structuredData
  }), 'utf8');
}

export async function buildSeoCollections() {
  for (const reg of REGION_SEO_PAGES) {
    const items = active.filter(e => reg.regions.includes(e.region));
    await writeCollectionPage({
      relDir: `region/${reg.slug}/`,
      pathUrl: `/region/${reg.slug}/`,
      h1: `${reg.shortLabel} 축제·전시 모음`,
      eyebrow: `${reg.slug.toUpperCase()} FESTIVAL GUIDE`,
      lead: reg.description,
      title: reg.title,
      description: reg.description,
      items,
      areaKeys: reg.areaKeys
    });
  }

  const exhibitionItems = active.filter(e => eventCategoryOf(e) === 'exhibition');
  await writeCollectionPage({
    relDir: 'curation/exhibitions/',
    pathUrl: '/curation/exhibitions/',
    page: 'exhibitions',
    h1: '전국 전시·박물관·박람회 모음',
    eyebrow: 'EXHIBITIONS & MUSEUMS',
    lead: '야외 지역축제와 구분해 전국 국립·시립 박물관 특별전, 미술관 기획전, 사진전·비엔날레·박람회 일정만 깔끔하게 모았습니다.',
    title: '전국 전시·박물관·박람회 모음 | 이번 주 가볼 만한 전시',
    description: '지역 축제와 분리해 살펴보는 전국 박물관 특별전, 미술관 기획전, 사진전, 아트페어 및 산업 박람회 공식 관람 안내입니다.',
    items: exhibitionItems,
    areaKeys: ['seoul', 'gyeonggi', 'gyeongsang', 'chungcheong']
  });

  const indoorItems = active.filter(e => eventCategoryOf(e) === 'indoor');
  await writeCollectionPage({
    relDir: 'curation/indoor/',
    pathUrl: '/curation/indoor/',
    page: 'indoor',
    h1: '전국 실내 체험·박물관·기관 이벤트 모음',
    eyebrow: 'INDOOR EXPERIENCES & INSTITUTIONS',
    lead: '한파·눈·비 걱정 없이 방문하기 좋은 과학관 체험, 어린이박물관, 도서관, 문화예술회관 공연과 실내 기관 행사를 모았습니다. (박물관·미술관 특별전은 전시 탭에서 따로 볼 수 있습니다.)',
    title: '전국 실내 체험·기관 이벤트 모음 | 과학관·어린이박물관·공연',
    description: '추위나 비 걱정 없이 즐기는 전국 과학관 사이언스 체험, 어린이박물관·도서관 프로그램, 문화예술회관 공연 및 실내 기관 이벤트 안내입니다.',
    items: indoorItems,
    areaKeys: ['seoul', 'gyeonggi', 'gyeongsang', 'chungcheong']
  });

  const freeItems = active.filter(e => e.feeStatus === 'free');
  await writeCollectionPage({
    relDir: 'curation/free/',
    pathUrl: '/curation/free/',
    h1: '입장 무료 전국 축제·전시 모음',
    eyebrow: 'FREE ADMISSION FESTIVALS',
    lead: '기본 입장료나 관람료가 무료로 공식 확인된 전국 축제와 박물관·전시 일정입니다. (선택 체험·먹거리 비용은 별도일 수 있습니다.)',
    title: '입장 무료 전국 축제·전시 모음 | 부담 없는 주말 나들이',
    description: '기본 입장 무료로 확인된 전국 지역 축제, 빛축제, 국공립 박물관·전시관 주말 나들이 일정과 운영시간을 한눈에 확인하세요.',
    items: freeItems,
    areaKeys: ['seoul', 'gyeonggi', 'gyeongsang', 'chungcheong']
  });

  const winterItems = active.filter(isWinterSeasonEvent);
  await writeCollectionPage({
    relDir: 'curation/winter-2026/',
    pathUrl: '/curation/winter-2026/',
    h1: '2026–2027 겨울·빛축제·연말 특집',
    eyebrow: 'WINTER & YEAR-END SPECIAL',
    lead: '12월부터 새해까지 이어지는 겨울 빛축제, 크리스마스 마켓·공연, 눈·얼음·먹거리 축제와 연말 타종·해맞이 명소 일정을 모았습니다.',
    title: '2026–2027 겨울 축제·빛축제·해맞이 모음 | 연말연시 가볼 만한 곳',
    description: '2026년 12월~2027년 1월 전국 겨울 빛축제, 크리스마스 행사, 얼음·겨울 먹거리 축제 및 제야의 종·해맞이 명소 공식 안내입니다.',
    items: winterItems,
    areaKeys: ['seoul', 'gyeonggi', 'gyeongsang', 'chungcheong']
  });
}
