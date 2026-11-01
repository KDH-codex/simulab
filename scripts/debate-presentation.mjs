export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Formatting is a separate presentation layer. None of these change the spoken text.
export const emphasis = {
  1: {bold:['합격 확률이 무려 50%','낭만은 통장에 잔고가 찍혀야','제 인생 최종 탈락 버튼'], highlight:['신민아 씨가 내 인생 4대 보험 들어줍니까?']},
  2: {bold:['그 비용은 인정합니다.','같이 여행하는 경험 자체','제 인생 자기소개서 첫 줄'], highlight:['오늘 최종면접은 제가 아니라 제 신용등급이 보는 모양입니다.','토론이 아니라 설정집 증축입니다.']},
  3: {bold:['경험 자체','주체적인 삶','그 ‘경험’으로 평생 밥 비벼 드실 겁니까?'], highlight:['연예인 1일 가이드 체험판','회사에 인생 소유권 넘기기 싫다더니, 정작 남의 변덕에 인생 운전대를 넘겨주고 계시네요!']},
  4: {bold:['면접 기회를 놓친 책임도 제 몫','그 가치가 제게 면접 기회보다 크다'], highlight:['토론이 아니라 악역 캐스팅입니다.','캐리어에 노후 대책까지 넣으라는 얘기죠.']},
  5: {bold:['내 노력으로 감당하고 자산으로 남길 수 있는가','내 인생의 주체적 도전','내 삶의 자립과 존엄'], highlight:['제 인생의 사원증을 직접 쟁취하러 면접장 문을 열겠습니다!']},
  6: {bold:['여행에서 함께 보낸 시간과 기억','기회 하나를 놓치는 책임까지','오늘 제 인생의 최종면접관은 저입니다.'], highlight:['같은 경험인데 한쪽에만 경력증명서를 발급하는 셈이죠.','존엄에는 사원증 발급 조건이 붙어 있지 않습니다.']}
};

export const hostPunchlines = {
  2: '여러분, 거울 볼 때는 조명부터 바꾸면서 이런 여행 앞에서는 왜 갑자기 인사팀보다 까다로워지십니까?',
  4: '여행 한 번에 취업·연애·노후까지 보장하라니요. 여러분, 그건 탑승권이 아니라 종합보험 청약서입니다.'
};

export function formatInline(text, styles = {}) {
  const ranges = [];
  for (const match of text.matchAll(/“[^”\n]*”|‘[^’\n]*’|"[^"\n]+"/g)) ranges.push({start:match.index,end:match.index+match[0].length,type:'quote'});
  for (const [type, phrases] of Object.entries(styles)) for (const phrase of phrases) {
    let from = 0;
    while (text.indexOf(phrase, from) !== -1) {
      const start = text.indexOf(phrase, from);
      ranges.push({start,end:start+phrase.length,type});
      from = start + phrase.length;
    }
  }
  const points = [...new Set([0,text.length,...ranges.flatMap(range => [range.start,range.end])])].sort((a,b) => a-b);
  return points.slice(0,-1).map((start,index) => {
    const end = points[index+1];
    const types = new Set(ranges.filter(range => range.start <= start && range.end >= end).map(range => range.type));
    let piece = escapeHtml(text.slice(start,end));
    if (types.has('highlight')) piece = `<mark class="punch-highlight">${piece}</mark>`;
    if (types.has('bold')) piece = `<strong>${piece}</strong>`;
    if (types.has('quote')) piece = `<span class="spoken-quote">${piece}</span>`;
    return piece;
  }).join('');
}

export function formatSpeech(body, styles = {}) {
  return body.split('\n\n').map(paragraph => `<p>${formatInline(paragraph, styles)}</p>`).join('\n');
}
