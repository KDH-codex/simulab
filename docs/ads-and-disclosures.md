# 이번주 축제 광고와 네이버 검색 운영

## Google AdSense

1. [AdSense](https://adsense.google.com/)의 **사이트**에서 `simulab.kr`을 선택하거나 추가합니다. 기존 계정의 게시자 ID가 사이트의 `ads.txt`와 일치하는지 확인합니다. 소유권은 [ads.txt](https://simulab.kr/ads.txt) 또는 홈의 `google-adsense-account` 메타 태그로 확인하고 심사를 요청합니다. [사이트 연결 안내](https://support.google.com/adsense/answer/7584263?hl=ko)
2. 사이트 상태가 **준비됨**이 되면 **개인정보 보호 및 메시지**에서 광고 동의 설정을 검토합니다. EEA·영국·스위스 방문자에게 광고를 게재할 경우 적용되는 Google 인증 CMP 요건에 맞춰 메시지를 설정합니다. [Google 동의 관리 요건](https://support.google.com/adsense/answer/13554116?hl=ko)
3. **광고** 메뉴에서 자동 광고를 설정합니다. 준비가 끝나면 `assets/js/site-settings.js`의 `adsEnabled`를 `true`로 바꾸고 배포합니다. 홈과 예정·진행 중인 축제 상세에 코드가 들어갑니다. 자동 광고 미리보기에서 축제 필터·보관 버튼·예약 링크 주변을 확인하고 필요하면 해당 영역을 제외합니다. [자동 광고 설정](https://support.google.com/adsense/answer/9261307?hl=ko)
4. [개인정보처리방침](https://simulab.kr/legal/privacy)에서 Google의 데이터 이용과 맞춤 광고 설정 링크를 확인할 수 있습니다. 사이트의 방문 통계 설정과 광고 동의는 별도로 운영합니다. [Google 게시자 개인정보처리방침 요건](https://support.google.com/adsense/answer/1348695?hl=ko)

## 네이버 서치어드바이저

1. [웹마스터 도구](https://searchadvisor.naver.com/)에서 `https://simulab.kr`을 선택하거나 추가합니다. 기존 소유확인 상태를 확인하고 필요하면 홈페이지 메타 태그 또는 [HTML 인증 파일](https://simulab.kr/naver600f1685b4bb1a22e32ec0f968c5989b.html)로 확인합니다. 계정에 표시된 인증 값이 다르면 그 계정의 값으로 갱신합니다. [사이트 등록 및 소유확인](https://searchadvisor.naver.com/guide/faq-start-register)
2. **요청 → 사이트맵 제출**에서 [sitemap.xml](https://simulab.kr/sitemap.xml)을 제출합니다. **검증 → robots.txt**에서 검색로봇이 공개 페이지를 수집할 수 있는지 확인합니다. [사이트맵 제출 안내](https://searchadvisor.naver.com/guide/request-feed)
3. **요청 → 웹 페이지 수집**에서 홈과 주요 축제 페이지를 요청하고, 이후 **리포트 → 사이트 진단**에서 수집·색인 상태를 확인합니다. [사이트 진단 안내](https://searchadvisor.naver.com/guide/report-diagnosis)

`npm run build`로 배포용 파일을 생성하고 `node scripts/check-public.mjs`로 공개 링크와 광고 설정을 점검합니다.
