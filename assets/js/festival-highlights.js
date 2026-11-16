import {koreaToday, escapeHtml as esc, nextDate, overlaps, weekendRange} from '../../tools/kids-outing-calendar/model.js';

export const FESTIVAL_HIGHLIGHTS={
  'busan-fireworks-2026':{reason:'부산광역시 주최 제21회 대표 불꽃 행사',source:'https://www.busanfireworks.com/bbs/content.php?co_id=overview'},
  'goheung-yuja-2026':{reason:'전남 대표축제로 선정된 고흥 유자 산지 축제',source:'https://tour.goheung.go.kr/front/M0000037/article/view.do?atcId=AT000619'},
  'gwangju-biennale-2026':{reason:'2024년 개막 한 달 동안 15만여 명 방문(재단 발표)',source:'https://www.gwangjubiennale.org/gb/Board/11829/detailView.do'},
  'seoul-cafe-show-2026':{reason:'코엑스 전관을 사용하는 국제 커피 전시와 서울커피페스티벌',source:'https://kor.cafeshow.com/kor/cafeshow/summary.asp'},
  'seoul-design-festival-2026':{reason:'국내외 디자이너·브랜드가 참여하는 디자인 전문 전시',source:'https://seoul.designfestival.co.kr/sdf/overview/'},
  'pohang-fire-light-2026':{reason:'포항시 대표 국제불꽃 행사로 시의회에서 연간 관람 규모를 약 30만 명으로 추산',source:'https://council.pohang.go.kr/mnts/cnts/mnt/mntsViewer.php?schSn=6110'},
  'busan-gstar-2026':{reason:'벡스코에서 열리는 한국게임산업협회 주최 국제게임전시회',source:'https://gstar.or.kr/gstar/gstar_info.do'},
  'jeju-moseulpo-yellowtail-2026':{reason:'모슬포항의 제26회 제주 대표 제철 방어 축제',source:'https://www.visitjeju.net/kr/festival/view?contentsid=CNTS_300000000015191'},
  'seoul-lantern-winter-2026':{reason:'서울관광재단 집계 2025년 383만 명 방문',source:'https://sto.or.kr/press/16035_/16035'},
  'busan-haeundae-light-2026':{reason:'해운대 해변과 구남로를 잇는 제13회 부산 겨울 빛축제',source:'https://www.mcst.go.kr/site/s_culture/festival/festivalView.jsp?pSeq=12038'},
  'goyang-agf-2026':{reason:'킨텍스에서 열리는 애니메이션·게임 축제',source:'https://www.agfkorea.com/'},
  'hampyeong-winter-lights-2026':{reason:'함평축제관광재단 집계 2025년 회차 약 16만 명 방문',source:'https://www.hpftf.or.kr/boardView.do?boardId=BD0006&movePage=1&pageId=www16&searchCtgry=4&seq=7274660'},
  'paju-jangdan-bean-2026':{reason:'파주시가 소개하는 지역 대표 농특산물 축제',source:'https://tour.paju.go.kr/tour/festival/festival02/festival02_2/festival02_2_01/festival02_2_01_01.jsp'}
};

// The key is the Saturday of the featured weekend in Korea.
const WEEKEND_PICKS = {
  '2026-11-14': ['goheung-yuja-2026', 'gwangju-biennale-2026', 'seoul-cafe-show-2026'],
  '2026-11-21': ['pohang-fire-light-2026', 'busan-gstar-2026', 'jeju-moseulpo-yellowtail-2026', 'sunchang-tteokbokki-2026'],
  '2026-11-28': ['paju-jangdan-bean-2026', 'busan-haeundae-light-2026', 'busan-christmas-village-2026'],
  '2026-12-05': ['goyang-agf-2026', 'busan-haeundae-light-2026', 'daejeon-yuseong-christmas-2026'],
  '2026-12-12': ['seoul-lantern-winter-2026', 'busan-haeundae-light-2026', 'nonsan-yangchon-persimmon-2026'],
  '2026-12-19': ['seoul-lantern-winter-2026', 'busan-haeundae-light-2026', 'hampyeong-winter-lights-2026'],
  '2026-12-26': ['seoul-lantern-winter-2026', 'busan-haeundae-light-2026', 'hampyeong-winter-lights-2026']
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
