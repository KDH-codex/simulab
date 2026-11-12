import {koreaToday, escapeHtml as esc, nextDate, overlaps, weekendRange} from '../../tools/kids-outing-calendar/model.js';

export const FESTIVAL_HIGHLIGHTS={
  'busan-fireworks-2026':{reason:'부산광역시 주최 제21회 대표 불꽃 행사',source:'https://www.busanfireworks.com/bbs/content.php?co_id=overview'},
  'goheung-yuja-2026':{reason:'전남 대표축제로 선정된 고흥 유자 산지 축제',source:'https://tour.goheung.go.kr/front/M0000037/article/view.do?atcId=AT000619'},
  'gwangju-biennale-2026':{reason:'2024년 개막 한 달 동안 15만여 명 방문(재단 발표)',source:'https://www.gwangjubiennale.org/gb/Board/11829/detailView.do'},
  'seoul-cafe-show-2026':{reason:'코엑스 전관을 사용하는 국제 커피 전시와 서울커피페스티벌',source:'https://kor.cafeshow.com/kor/cafeshow/summary.asp'},
  'seoul-design-festival-2026':{reason:'국내외 디자이너·브랜드가 참여하는 디자인 전문 전시',source:'https://seoul.designfestival.co.kr/sdf/overview/'},
  'paju-jangdan-bean-2026':{reason:'파주시가 소개하는 지역 대표 농특산물 축제',source:'https://tour.paju.go.kr/tour/festival/festival02/festival02_2/festival02_2_01/festival02_2_01_01.jsp'}
};

// The key is the Saturday of the featured weekend in Korea.
const WEEKEND_PICKS = {
  '2026-11-14': ['goheung-yuja-2026', 'gwangju-biennale-2026', 'seoul-cafe-show-2026']
};

export function homeRecommendations(events, today, hasImage) {
  const weekend = weekendRange(today);
  const start = today > weekend.start ? today : weekend.start;
  const eligible = events.filter(event =>
    event.publicationStatus !== 'cancelled' && overlaps(event, start, weekend.end)
  );
  const priority = WEEKEND_PICKS[weekend.start] || [];
  const ranked = [
    ...priority.map(id => eligible.find(event => event.id === id)).filter(Boolean),
    ...eligible.filter(event => !priority.includes(event.id)).sort((a, b) =>
      Number(!!highlightFor(b, today)) - Number(!!highlightFor(a, today)) ||
      nextDate(a, start).localeCompare(nextDate(b, start)) ||
      a.title.localeCompare(b.title, 'ko')
    )
  ];
  return { weekend, events: ranked, heroes: ranked.filter(hasImage).slice(0, 3) };
}
export function highlightFor(event,today=koreaToday()) {
  return event.publicationStatus!=='cancelled'&&event.endDate>=today?FESTIVAL_HIGHLIGHTS[event.id]||null:null;
}
export function highlightBadge(event,{today=koreaToday()}={}) {
  if(!highlightFor(event,today))return '';
  return '<span class="event-highlight" data-highlight-id="'+esc(event.id)+'" title="공식 규모·대표성에 근거한 편집 선정이며 실시간 인기 순위가 아닙니다." aria-label="HOT · 주목할 행사"><span aria-hidden="true">✦</span> HOT</span>';
}
