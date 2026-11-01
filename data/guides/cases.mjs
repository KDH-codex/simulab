// Fictional examples, calculated by the same modules as the public tools.
export const toolGuidePairs={
 'salary-net-calc':'take-home-pay-cases-2026','severance-pay-calc':'severance-pay-cases','unemployment-benefit-calc':'unemployment-benefit-cases-2026','annual-leave-calc':'annual-leave-dates',
 'hourly-labor-value-calc':'commute-and-hourly-income','percent-discount-calc':'shopping-membership-comparison','unit-price-calc':'shopping-membership-comparison','membership-benefit-calc':'shopping-membership-comparison',
 'dutch-pay-roulette':'family-trip-budget-cases','travel-budget-calc':'family-trip-budget-cases','korean-wealth-percentile-calc':'household-budget-baselines','inflation-purchasing-power-calc':'household-budget-baselines',
 'loan-mortgage-calc':'housing-cost-comparison','jeonse-wolse-sim':'housing-cost-comparison','area-pyeong-calc':'housing-cost-comparison','korean-age-calc':'support-by-child-age-2026'
};
export const exampleSets={
 'salary-net-calc':[
  {label:'월급 250만원',input:{inputValue:2500000,incomeTax:50000},condition:'비과세 식대 20만원 포함, 확인한 소득세 5만원'},
  {label:'월급 350만원',input:{inputValue:3500000,incomeTax:100000},condition:'비과세 식대 20만원 포함, 확인한 소득세 10만원'},
  {label:'월급 500만원',input:{inputValue:5000000,incomeTax:250000},condition:'비과세 식대 20만원 포함, 확인한 소득세 25만원'},
  {label:'소득세를 모르는 경우',input:{inputValue:3500000,incomeTax:null},condition:'소득세 미입력. 보험료만 차감한 금액으로 구분'}
 ],
 'severance-pay-calc':[
  {label:'3년 근무·평균임금',input:{hireDate:'2023-10-01',leaveDate:'2026-10-01',wageTotal:9000000},condition:'입사 2023-10-01 / 퇴직 2026-10-01 / 3개월 임금 900만원'},
  {label:'산입 상여가 있는 경우',input:{hireDate:'2023-10-01',leaveDate:'2026-10-01',wageTotal:9000000,annualBonus:4000000},condition:'첫 사례에 산입 대상 연간 상여 400만원 추가'},
  {label:'통상임금이 더 큰 경우',input:{hireDate:'2023-10-01',leaveDate:'2026-10-01',wageTotal:9000000,dailyOrdinaryWage:120000},condition:'첫 사례에 확인된 1일 통상임금 12만원 입력'},
  {label:'1주년 전에 퇴직',input:{hireDate:'2025-10-02',leaveDate:'2026-10-01',wageTotal:9000000},condition:'365라는 숫자만 보지 않고 입사 기념일과 계속근로 요건 확인'}
 ],
 'unemployment-benefit-calc':[
  {label:'35세·가입 3년',input:{age:35,insuranceYears:3,wageTotal:9000000,wageDays:90},condition:'2026년 이직, 8시간, 임금 900만원/90일'},
  {label:'상한에 도달하는 임금',input:{age:35,insuranceYears:3,wageTotal:12000000,wageDays:90},condition:'2026년 이직, 8시간, 임금 1,200만원/90일'},
  {label:'52세·가입 10년',input:{age:52,insuranceYears:10,wageTotal:9000000,wageDays:90},condition:'첫 사례와 임금·시간은 같고 연령·가입기간만 변경'},
  {label:'1일 4시간 근로',input:{age:35,insuranceYears:3,wageTotal:1000000,wageDays:90,dailyWorkHours:4},condition:'2026년 이직, 4시간 하한 비교를 위한 가상 저임금 입력'}
 ],
 'annual-leave-calc':[
  {label:'입사 첫해',input:{hireDate:'2026-01-01',asOfDate:'2026-10-27',usedDays:3},condition:'완료된 월 모두 개근, 현재 기간 3일 사용'},
  {label:'첫 1주년 이후 계속 재직',input:{hireDate:'2025-10-27',asOfDate:'2026-10-27',usedDays:0},condition:'직전 1년 출근율 80% 이상, 발생일에도 재직'},
  {label:'근속 3년',input:{hireDate:'2023-07-01',asOfDate:'2026-07-01',usedDays:5},condition:'출근 요건 충족, 이번 발생 기간에서 5일 사용'}
 ],
 'hourly-labor-value-calc':[40,20,60].map(commuteHours=>({label:'월 통근 '+commuteHours+'시간',input:{monthlyNetSalary:3000000,workHours:174,commuteHours,workExpenses:150000},condition:'월 실수령 300만원, 근무 174시간, 추가 업무비용 15만원'})),
 'percent-discount-calc':[
  {label:'10만원, 20% 뒤 10%',input:{price:100000,first:20,second:10},condition:'할인율 합산 대신 남은 가격에 연속 적용'},
  {label:'12만원, 15% 뒤 5%',input:{price:120000,first:15,second:5},condition:'쿠폰 상한·제외 품목을 별도로 확인하는 가상 가격'},
  {label:'5만원, 30%',input:{price:50000,first:30,second:0},condition:'추가 할인 없이 한 번만 적용'}
 ],
 'unit-price-calc':[
  {label:'배송비로 바뀌는 단가',input:{},condition:'A: 500ml×6, 9천원+배송3천원 / B: 500ml×8, 1만2천원 무료배송'},
  {label:'A가 무료배송이면',input:{shippingA:0},condition:'첫 사례에서 A 배송비만 0원으로 변경'},
  {label:'같은 규격의 개수 비교',input:{unit:'개',priceA:6000,shippingA:0,countA:6,sizeA:1,priceB:7500,shippingB:0,countB:10,sizeB:1},condition:'동일 규격 A 6개 6천원 / B 10개 7,500원'}
 ],
 'membership-benefit-calc':[
  {label:'할인으로 회비 만회',input:{},condition:'회비 4,900원, 대상 구매 10만원, 5% 할인·한도5천원'},
  {label:'할인 한도 3천원',input:{cap:3000},condition:'첫 사례에서 월 할인 한도만 낮춤'},
  {label:'배송비 3천원도 절약',input:{shippingSaved:3000},condition:'첫 사례에서 실제 필요 주문의 배송비 절감 추가'}
 ],
 'dutch-pay-roulette':[{label:'10만원을 3명',input:{total:100000,people:3},condition:'1원 나머지를 별도 배분'},{label:'75,000원을 4명',input:{total:75000,people:4},condition:'원 단위로 정확히 나누어짐'},{label:'비용이 0원인 모임',input:{total:0,people:5},condition:'인원은 양수, 총액 0원도 유효'}],
 'travel-budget-calc':[
  {label:'3명 1박 2일',input:{},condition:'숙박12만원·교통6만원·1인1일식비2.5만원·입장4만원·주차1만원·예비비10%'},
  {label:'3명 당일 나들이',input:{days:1,nights:0,transport:40000,foodPerPersonDay:20000,adultAdmission:10000,childAdmission:0,parking:5000},condition:'숙박0·교통4만원·식비6만원·입장2만원·주차5천원·예비비10%'},
  {label:'같은 숙박 여행, 예비비 20%',input:{bufferPercent:20},condition:'첫 사례의 계획은 그대로, 예비비만 20%'}
 ],
 'jeonse-wolse-sim':[
  {label:'현금 지출만 비교',input:{},condition:'자금1억·전세2.5억·월세보증금3천만원/월80만원·금리4%·24개월'},
  {label:'자기자금 기회비용 3%',input:{opportunityRate:3},condition:'첫 사례에 가상 기회비용 연3% 추가'},
  {label:'대출금리 6%',input:{loanRate:6},condition:'첫 사례에서 대출금리만 6%, 기회비용0%'}
 ],
 'loan-mortgage-calc':['equal_pi','equal_principal','bullet'].map((type,i)=>({label:['원리금균등','원금균등','만기일시'][i],input:{loanAmount:120000000,annualRate:4,years:20,type},condition:'대출1억2천만원·연4% 고정·20년·거치0개월, 수수료 제외'})),
 'area-pyeong-calc':[59,84,114].map(sqm=>({label:sqm+'㎡',input:{sqm},condition:'같은 종류의 면적끼리 단위만 변환'})),
 'korean-wealth-percentile-calc':[
  {label:'자산5억·부채1억',input:{assets:500000000,debts:100000000},condition:'2025 가구 평균 순자산 4억7,144만원과 비교'},
  {label:'평균과 같은 순자산',input:{assets:471440000,debts:0},condition:'평균 대비 비율이 100%여도 백분위 순위는 아님'},
  {label:'자산보다 부채가 큼',input:{assets:10000000,debts:20000000},condition:'음수 순자산을 0원으로 덮지 않음'}
 ],
 'inflation-purchasing-power-calc':[
  {label:'지수100→110',input:{amount:1000000,baseIndex:100,targetIndex:110},condition:'가상 지수, 같은 기준연도·항목을 전제'},
  {label:'지수100→120',input:{amount:1000000,baseIndex:100,targetIndex:120},condition:'현재 물가 실측값이나 미래 예측값이 아님'},
  {label:'지수110→100',input:{amount:1000000,baseIndex:110,targetIndex:100},condition:'지수가 낮아지는 반대 방향도 같은 비율식 사용'}
 ],
 'korean-age-calc':[
  {label:'생일 직전',input:{birth:'2020-11-01',on:'2026-10-27'},condition:'2020-11-01생 / 기준일2026-10-27'},
  {label:'생일 당일',input:{birth:'2020-11-01',on:'2026-11-01'},condition:'같은 아이 / 기준일만 생일 당일로 변경'},
  {label:'지원 연도가 바뀐 경우',input:{birth:'2018-03-01',on:'2027-03-01'},condition:'2018-03-01생 / 기준일2027-03-01. 지원 자격은 별도 법령 확인'}
 ]
};
