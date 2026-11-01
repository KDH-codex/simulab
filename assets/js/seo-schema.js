/**
 * ==========================================================================
 * SimuLab Hub - 검색엔진 최적화(SEO) JSON-LD 구조화 데이터 동적 주입기
 * 파일 경로: assets/js/seo-schema.js
 * --------------------------------------------------------------------------
 * - file:// 직접 실행 시에도 CORS 오류 없이 동작하도록 window.SimuLab에 등록합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const SimuLab = (global.SimuLab = global.SimuLab || {});

  function injectSeoSchema(appInfo) {
    if (!appInfo || !appInfo.name) return;

    const softwareSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: appInfo.name,
      description: appInfo.description || '',
      applicationCategory: appInfo.category || 'FinanceApplication',
      operatingSystem: 'All (Web Browser)',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
      },
    };

    const faqElements = document.querySelectorAll('.faq-item');
    const faqEntities = [];

    faqElements.forEach((item) => {
      const questionEl = item.querySelector('summary');
      const answerEl = item.querySelector('.faq-answer');
      if (questionEl && answerEl) {
        faqEntities.push({
          '@type': 'Question',
          name: questionEl.textContent.trim(),
          acceptedAnswer: {
            '@type': 'Answer',
            text: answerEl.textContent.trim(),
          },
        });
      }
    });

    const graph = [softwareSchema];
    if (faqEntities.length > 0) {
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqEntities,
      });
    }

    let scriptEl = document.getElementById('simulab-jsonld-schema');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'simulab-jsonld-schema';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(graph.length === 1 ? graph[0] : graph, null, 2);
  }

  SimuLab.injectSeoSchema = injectSeoSchema;
})(typeof window !== 'undefined' ? window : globalThis);
