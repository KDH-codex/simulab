const checkedAt='2026-10-27';
const source=(title,url,scope)=>({title,url,scope,checkedAt});
export const guideSources={
 payslip:source('국가법령정보센터 · 근로기준법 제48조','https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029728415','임금대장과 임금명세서의 근거'),
 employment:source('고용24 · 고용보험 제도와 보험료','https://m.work24.go.kr/cm/c/f/1100/selecSystInfo.do?systClId=SC00000350&systId=SI00000419','일반 근로자의 실업급여 계정 보험료 본인 부담 0.9%'),
 pension:source('국민연금공단 · 보험료와 기준소득월액','https://www.nps.or.kr/eng/ntnlpnsplan/cntb/getOHAI0013M0.do','2026년 근로자 부담 4.75%, 2026년 7월~2027년 6월 기준소득월액 상·하한'),
 health:source('국민건강보험공단 · 2026년도 보험료율','https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html','건강보험 7.19%의 노사 절반 부담과 장기요양보험료 산식'),
 retirement:source('고용노동부 · 퇴직금 공식 계산','https://www.moel.go.kr/retirementpayCal.do','퇴직일·3개월 평균임금·통상임금 비교와 세전 산식'),
 unemployment:source('고용노동부 1350 · 2026 구직급여 기준','https://1350.moel.go.kr/rtmview.do?id=1000324861','2025·2026년 이직일별 상·하한과 소정급여일수'),
 annual:source('국가법령정보센터 · 근로기준법 제60조','https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1012828043','월별 연차·15일 부여·장기근속 가산·사용기간'),
 parentalLeave:source('고용24 · 육아휴직 제도 안내','https://m.work24.go.kr/cm/c/f/1100/selecSystInfo.do?currentPageNo=1&recordCountPerPage=10&systClId=SC00000251&systId=SI00000402','휴직 사용과 급여 수급의 조건·신청 시점은 구분'),
 parentalSimulation:source('고용24 · 육아휴직급여 모의계산','https://www.work24.go.kr/cm/c/f/1100/selecSimulate12.do?systClId=SC00000251&systId=SI00000402','일반 급여의 구간별 상한과 6+6 적용 시 별도 계산'),
 parentPay:source('보건복지부 · 2026 부모급여 안내','https://m.korea.kr/news/policyFocusView.do?newsId=148957936&pkgId=49500831','0·1세 금액, 출생 후 60일 신청, 어린이집 이용 시 차액'),
 parentApply:source('광진구 · 부모급여 신청 안내','https://www.gwangjin.go.kr/portal/main/contents.do?menuNo=201593','출생일 포함 60일, 신청 경로와 양육 방식 변경'),
 childLaw:source('국가법령정보센터 · 아동수당법','https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260910&lsiSeq=286729&urlMode=lsInfoP','부칙의 연도별 연령 확대와 기존 수급자 경과조치'),
 childApply:source('관악구 · 아동수당 지원','https://www.gwanak.go.kr/site/gwanak/05/10512010500002019021801.jsp','2026년 9세 미만, 기본 월 10만원, 출생 후 신청과 해외 체류 확인'),
 childOverview:source('찾기 쉬운 생활법령정보 · 양육 관련 재정 지원','https://www.easylaw.go.kr/CSP/CnpClsMainBtr.laf?ccfNo=3&cciNo=1&cnpClsNo=1&csmSeq=2604&menuType=cnpcls&popMenu=ov','연령별 아동수당 적용 특례와 양육지원 제도 연결'),
 voucher:source('보건복지부 · 첫만남이용권 지원','https://www.mw.go.kr/menu.es?mid=a10711020100','2024년 이후 출생 첫째 200만원·둘째 이상 300만원과 출생일부터 2년 사용'),
 care:source('아이사랑 · 시간제보육 안내','https://www.childcare.go.kr/?menuno=200','제공기관·신청 경로·등록과 이용 준비'),
 babysitter:source('아이돌봄서비스 · 서비스 신청안내','https://idolbom.go.kr/front/srvcUtztnGuide/srvcApply/emshtm','정부지원 결정과 실제 서비스 신청·연계 구분'),
 tax:source('국세청 · 2026 연말정산 미리보기 안내','https://www.korea.kr/multi/visualNewsView.do?newsId=148974171','2026-10-28~12-18 이용 안내, 예상 총급여·사용액·제공 동의'),
 minimum2027:source('고용노동부 · 2027년도 적용 최저임금 결정·고시','https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19744','2027년 적용 시간급 10,700원 결정·고시'),
 minimum:source('최저임금위원회 · 고시와 최저임금 현황','https://www.minimumwage.go.kr/index.jsp','2027년 적용 최저임금 고시 게시 확인'),
 telecom:source('스마트초이스 · 선택약정 신청 대상','https://smartchoice.or.kr/smc/service/danpageNew.do','지원금을 받지 않는 등 적용 조건을 충족할 때 1·2년 선택약정 요금 할인'),
 unit:source('한국소비자원 참가격 · 생필품 가격정보','https://price.go.kr/tprice/portal/main/main.do','상품·업체별 가격 비교 경로. 예시 상품 가격의 실측 출처는 아님'),
 housing:source('마이홈포털 · 주거정보','https://www.myhome.go.kr/hws/portal/main/selectMyHomeInfoView.do','주거 제도 확인 경로. 아래 가상 금리·계약의 승인을 뜻하지 않음'),
 wealth:{title:'2025년 가계금융복지조사 공식 결과 브리핑',url:'https://www.korea.kr/briefing/policyBriefingView.do?newsId=156733201',scope:'기존 계산기의 2025년 가구 평균 순자산 기준. 자산·부채 기준시점 2025-03-31',checkedAt:'2026-10-23'},
 statistics:source('국가통계포털 KOSIS','https://kosis.kr/','같은 통계표·기준연도·단위로 물가지수와 가구 통계를 확인하는 경로')
};
