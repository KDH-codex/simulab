import {koreaToday,escapeHtml as esc} from '../../tools/kids-outing-calendar/model.js';
// Editorial picks based on organizers' descriptions, never inferred visitor counts or live rankings.
export const FESTIVAL_HIGHLIGHTS={
  'busan-fireworks-2026':{reason:'부산광역시 주최 제21회 대표 불꽃 행사',source:'https://www.busanfireworks.com/bbs/content.php?co_id=overview'},
  'gwangju-biennale-2026':{reason:'제16회 국제 현대미술 비엔날레',source:'https://www.gwangjubiennale.org/gb/Board/12146/detailView.do'},
  'seoul-cafe-show-2026':{reason:'국제 커피·카페 산업 전시',source:'https://eng.cafeshow.com/kor/visitor/visitor_info.asp'},
  'seoul-design-festival-2026':{reason:'국내외 디자이너·브랜드가 참여하는 디자인 전문 전시',source:'https://seoul.designfestival.co.kr/sdf/overview/'},
  'paju-jangdan-bean-2026':{reason:'파주시가 소개하는 지역 대표 농특산물 축제',source:'https://tour.paju.go.kr/tour/festival/festival02/festival02_2/festival02_2_01/festival02_2_01_01.jsp'}
};
export function highlightFor(event,today=koreaToday()) {
  return event.publicationStatus!=='cancelled'&&event.endDate>=today?FESTIVAL_HIGHLIGHTS[event.id]||null:null;
}
export function highlightBadge(event,{today=koreaToday()}={}) {
  if(!highlightFor(event,today))return '';
  return '<span class="event-highlight" data-highlight-id="'+esc(event.id)+'" title="공식 규모·대표성에 근거한 편집 선정이며 실시간 인기 순위가 아닙니다." aria-label="HOT · 주목할 행사"><span aria-hidden="true">✦</span> HOT</span>';
}
