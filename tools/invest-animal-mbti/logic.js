// 자체 제작한 오락용 질문지. 금융상품 적합성 검사나 표준 심리검사가 아닙니다.
export const QUESTIONS=[
 ['새로운 선택을 앞두면?','낯선 선택지도 먼저 살펴본다','익숙한 기준부터 확인한다'],
 ['계획을 세울 때는?','일단 작은 시도를 시작한다','준비한 뒤 시작한다'],
 ['금융 정보를 읽을 때 더 눈에 들어오는 것은?','새로운 이야기와 관점','조건과 숫자의 의미'],
 ['정보가 서로 다르면?','여러 가능성을 열어 둔다','출처를 하나씩 정리한다'],
 ['기록하는 방식은?','필요할 때 자유롭게 적는다','정해 둔 양식에 적는다'],
 ['계획이 달라지면?','새로운 방법을 찾아본다','처음 세운 기준을 점검한다'],
 ['결과를 돌아볼 때?','새로 배운 점을 먼저 떠올린다','과정을 정리한 뒤 평가한다'],
 ['쉬는 날의 모습은?','새로운 취미를 찾아본다','익숙한 취미를 이어 간다']
];
export const PROFILES=[
 {name:'거북이',theme:'차분한 정리',text:'익숙한 기준과 준비 과정을 고르는 응답이 많았습니다.'},
 {name:'부엉이',theme:'꼼꼼한 기록',text:'조건을 살피면서도 새로운 관점을 조금씩 받아들이는 응답입니다.'},
 {name:'고양이',theme:'선택적인 탐색',text:'준비와 탐색 사이에서 필요한 쪽을 골라 가는 응답입니다.'},
 {name:'판다',theme:'느긋한 균형',text:'정리와 시도를 함께 고르는 응답입니다.'},
 {name:'여우',theme:'유연한 전환',text:'여러 가능성을 열어 두는 응답과 점검하는 응답이 섞였습니다.'},
 {name:'돌고래',theme:'호기심 있는 시도',text:'새로운 관점과 작은 시도를 자주 고르는 응답입니다.'},
 {name:'원숭이',theme:'활발한 발견',text:'새로운 방법을 찾는 쪽의 응답이 많았습니다.'},
 {name:'독수리',theme:'넓게 살펴보기',text:'탐색과 변화 쪽의 응답을 많이 골랐습니다.'}
];
export function calculate({answers}={}){
 if(!Array.isArray(answers)||answers.length!==QUESTIONS.length||answers.some(a=>a!==0&&a!==1))throw new RangeError('8문항에 모두 응답해 주세요.');
 const exploration=answers.reduce((sum,a)=>sum+a,0);
 return {profile:PROFILES[Math.min(7,exploration)],exploration,total:QUESTIONS.length};
}
