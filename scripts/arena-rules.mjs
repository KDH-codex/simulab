export const challenges=[
 {id:'logic',name:'숫자 추리',prompt:'서로 다른 세 양의 정수 a, b, c에 대해 a+b=7, b+c=9, a+c=8이다. b의 값만 숫자로 출력하세요.',answer:'4'},
 {id:'constraint',name:'제약 챌린지',prompt:'아래 조건을 모두 지키는 문장 하나만 출력하세요. 공백과 문장부호 포함 30자 이내, 숫자 사용 금지, 마지막 두 글자는 사과.',answer:null},
 {id:'unknown',name:'정보 부족 함정',prompt:'다음은 가상 도서관 목록 전체입니다: 달빛 지도, 푸른 자전거. 이 목록에 없는 “초록 우산”의 저자를 알 수 있나요? 알 수 없다면 정확히 모릅니다 네 글자만 출력하세요.',answer:'모릅니다'},
 {id:'comedy',name:'한 줄 개그',prompt:'시간 여행을 주제로 관객을 웃길 짧은 한 줄 개그 하나만 작성하세요. 80자 이내.',kind:'audience'}
];
export function judge(challenge,response){
 const text=String(response).trim();
 if(challenge.kind==='audience')return {pass:null,reason:'관객이 직접 판정하는 종목입니다.'};
 if(challenge.id==='logic')return {pass:text===challenge.answer,reason:text===challenge.answer?'정답 4':'정확한 정답 숫자만 출력해야 합니다.'};
 if(challenge.id==='unknown')return {pass:text==='모릅니다',reason:text==='모릅니다'?'제공되지 않은 정보를 모른다고 답했습니다.':'지정된 불확실성 답변 형식을 따르지 않았습니다.'};
 if(challenge.id==='constraint'){
  const length=Array.from(text).length,checks={length:length>0&&length<=30,noDigits:!/[0-9０-９]/u.test(text),ends:text.endsWith('사과'),oneLine:!/[\r\n]/.test(text)};
  return {pass:Object.values(checks).every(Boolean),reason:`${length}자 · 숫자 ${checks.noDigits?'없음':'있음'} · 사과로 끝남 ${checks.ends?'충족':'미충족'} · 한 줄 ${checks.oneLine?'충족':'미충족'}`,checks};
 }
 throw Error('지원하지 않는 종목');
}
export function winner(scores){return scores.GPT===scores.Gemini?'무승부':scores.GPT>scores.Gemini?'GPT':'Gemini'}
