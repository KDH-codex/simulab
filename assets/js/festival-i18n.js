export const LANGUAGES=[['ko','한국어'],['en','English'],['ja','日本語'],['zh-CN','简体中文'],['zh-TW','繁體中文']];
export const LANGUAGE_KEY='thisweekfestival.language.v1';
export function normalizeLocale(value='') {
  if(typeof value!=='string')return null;
  const language=value.toLowerCase();
  if(/^zh-(tw|hk|mo|hant)(-|$)/.test(language))return 'zh-TW';
  if(/^zh(-|$)/.test(language))return 'zh-CN';
  if(/^en(-|$)/.test(language))return 'en';
  if(/^ja(-|$)/.test(language))return 'ja';
  if(/^ko(-|$)/.test(language))return 'ko';
  return null;
}
export function resolveLocale({query,saved,languages=[]}={}) {
  return normalizeLocale(query)||normalizeLocale(saved)||languages.map(normalizeLocale).find(Boolean)||'ko';
}
export function languageURL(value,locale,origin='https://simulab.kr') {
  const url=new URL(value,origin);
  if(url.origin!==new URL(origin).origin||!/^\/(?:$|map\/$|calendar\/$|curation\/$|sales\/(?:[a-z0-9-]+\/)?$|events\/[a-z0-9-]+\/$)/.test(url.pathname))return null;
  url.searchParams.set('lang',normalizeLocale(locale)||'ko');
  return url;
}
// Hand-authored interface copy. Event guide names/summaries live in festival-event-locales.js.
const rows=`
이번주 축제|Korea Festival Guide|韓国お祭りガイド|韩国节庆指南|韓國節慶指南
홈|Home|ホーム|首页|首頁
본문으로|Skip to content|本文へ|跳到正文|跳到正文
지역별 탐색|Explore regions|地域から探す|按地区探索|依地區探索
축제 달력|Festival calendar|お祭りカレンダー|节庆日历|節慶月曆
이번 주말|This weekend|今週末|本周末|本週末
할인·쇼핑|Shopping offers|セール情報|优惠购物|優惠購物
할인 보관함|Saved shopping offers|セール保存一覧|优惠收藏夹|優惠收藏夾
앱설치|Install|アプリ追加|安装|安裝
보관함|Saved|保存|收藏|收藏
보관한 축제|Saved festivals|保存したお祭り|已收藏节庆|已收藏節慶
축제 탐색|Browse festivals|お祭りを探す|浏览节庆|瀏覽節慶
일상에 설렘을 더하는 축제 한 조각|Your next good day starts here|韓国で、とっておきの一日を|在韩国发现美好的一天|在韓國發現美好的一天
● 이번 주의 발견|● This week’s picks|● 今週の発見|● 本周精选|● 本週精選
✦ 다가오는 축제|✦ Coming up|✦ これからのお祭り|✦ 即将举办|✦ 即將舉辦
다가오는 축제|Coming up|これからのお祭り|即将举办|即將舉辦
축제 자세히 보기 ↗|Explore this event ↗|このイベントを見る ↗|查看活动详情 ↗|查看活動詳情 ↗
달력으로 찾아보기 →|Browse the calendar →|カレンダーで探す →|查看日历 →|查看月曆 →
이번 주말, 같이 떠나요|Make a weekend of it|今週末、一緒に出かけよう|一起享受这个周末|一起享受這個週末
전국 축제 모아보기|Festivals across Korea|韓国各地のお祭り|韩国各地节庆|韓國各地節慶
날짜와 지역, 좋아하는 테마로 다음 나들이를 골라보세요.|Find festivals across South Korea by date, region and theme.|日付・地域・テーマから韓国のお祭りを探そう。|按日期、地区与主题寻找韩国节庆。|依日期、地區與主題尋找韓國節慶。
지역별로 둘러보기 ↗|Explore by region ↗|地域から探す ↗|按地区浏览 ↗|依地區瀏覽 ↗
이번 주말엔 이런 축제 어때요?|Plans for this weekend|今週末に行きたいお祭り|本周末活动推荐|本週末活動推薦
주말 일정 모두 보기 ↗|All weekend events ↗|週末の予定をすべて見る ↗|全部周末活动 ↗|全部週末活動 ↗
가고 싶은 지역부터|Start with a place|行きたい場所から|从目的地开始|從目的地開始
서울부터 제주까지, 7개 권역으로 가볍게 탐색해요.|Explore seven regions, from Seoul to Jeju.|ソウルから済州まで、7つのエリアを探索。|从首尔到济州，探索七大区域。|從首爾到濟州，探索七大區域。
비어 있는 날짜부터|Start with a free day|空いている日から|从空闲日期开始|從空閒日期開始
달력에서 날짜를 누르면 그날의 수록 일정을 볼 수 있어요.|Pick a calendar date to see listed events.|カレンダーの日付を選ぶと掲載イベントが見られます。|选择日历日期，查看已收录活动。|選擇月曆日期，查看已收錄活動。
즐거운 나들이의 시작은, 정확한 정보에서|A good trip starts with reliable details|楽しい旅は、確かな情報から|美好旅程从可靠信息开始|美好旅程從可靠資訊開始
공식 안내를 읽고 개최일·요금·예약 조건을 정리합니다. 각 상세안내에서 출처와 확인일을 확인하세요.|Dates, fees and booking guidance are checked against official notices. Each event links to its sources and review date.|公式案内をもとに日程・料金・予約条件を整理。詳細ページで出典と確認日を確認できます。|日期、费用与预约信息依据官方公告整理。详情页提供来源与核实日期。|日期、費用與預約資訊依據官方公告整理。詳情頁提供來源與核實日期。
자료 확인|Last reviewed|資料確認|资料核实|資料核實
전국|All Korea|全国|全韩国|全韓國
전체|All|すべて|全部|全部
서울|Seoul|ソウル|首尔|首爾
인천|Incheon|仁川|仁川|仁川
경기|Gyeonggi|京畿|京畿|京畿
경기지역|Gyeonggi & Incheon|京畿・仁川|京畿与仁川|京畿與仁川
강원지역|Gangwon|江原|江原|江原
충청지역|Chungcheong|忠清|忠清|忠清
전라지역|Jeolla & Gwangju|全羅・光州|全罗与光州|全羅與光州
경상지역|Gyeongsang & Busan|慶尚・釜山|庆尚与釜山|慶尚與釜山
제주지역|Jeju|済州|济州|濟州
제주|Jeju|済州|济州|濟州
부산|Busan|釜山|釜山|釜山
대구|Daegu|大邱|大邱|大邱
대전|Daejeon|大田|大田|大田
광주|Gwangju|光州|光州|光州
울산|Ulsan|蔚山|蔚山|蔚山
세종|Sejong|世宗|世宗|世宗
강원|Gangwon|江原|江原|江原
충북|Chungbuk|忠北|忠北|忠北
충남|Chungnam|忠南|忠南|忠南
전북|Jeonbuk|全北|全北|全北
전남|Jeonnam|全南|全南|全南
경북|Gyeongbuk|慶北|庆北|慶北
경남|Gyeongnam|慶南|庆南|慶南
⌖ 지역 선택|⌖ Region|⌖ 地域|⌖ 地区|⌖ 地區
✳ 테마 선택|✳ Theme|✳ テーマ|✳ 主题|✳ 主題
▦ 날짜 선택|▦ Dates|▦ 日付|▦ 日期|▦ 日期
지역|Region|地域|地区|地區
테마|Theme|テーマ|主题|主題
날짜|Dates|日付|日期|日期
전체 테마|All themes|全テーマ|全部主题|全部主題
불꽃·야경|Fireworks & nights|花火・夜景|烟花与夜景|煙火與夜景
빛·야간|Lights & nights|光・夜景|灯光与夜景|燈光與夜景
먹거리·수확|Food & harvest|グルメ・収穫|美食与丰收|美食與豐收
꽃·자연|Flowers & nature|花・自然|花卉与自然|花卉與自然
체험·문화|Activities & culture|体験・文化|体验与文化|體驗與文化
불꽃|Fireworks|花火|烟花|煙火
드론|Drones|ドローン|无人机|無人機
국화|Chrysanthemums|菊|菊花|菊花
정원|Gardens|庭園|庭园|庭園
라면|Ramyeon|ラーメン|方便面|泡麵
김장|Kimchi-making|キムジャン|腌泡菜|醃泡菜
사과|Apples|りんご|苹果|蘋果
걷기|Walking|ウォーキング|徒步|健行
한글|Hangeul|ハングル|韩文字|韓文字
캠프닉|Camp picnic|キャンプピクニック|露营野餐|露營野餐
미디어아트|Media art|メディアアート|媒体艺术|媒體藝術
문화유산|Heritage|文化遺産|文化遗产|文化遺產
체험|Activities|体験|体验|體驗
공연|Performances|公演|演出|演出
나이트|Night|ナイト|夜间|夜間
야경|Night views|夜景|夜景|夜景
꽃|Flowers|花|花卉|花卉
웹툰|Webtoons|ウェブトゥーン|网络漫画|網路漫畫
오늘|Today|今日|今天|今天
앞으로 60일|Next 60 days|今後60日|未来60天|未來60天
진행·예정|Ongoing & upcoming|開催中・開催予定|正在举办与即将举办|正在舉辦與即將舉辦
진행 중|Ongoing|開催中|正在举办|正在舉辦
개최기간 중 · 운영일 확인|Within event period · check operating days|会期中・営業日を確認|活动期间 · 请确认开放日|活動期間 · 請確認開放日
기간 내 운영일 확인|Check operating days|営業日を確認|请确认开放日|請確認開放日
운영일 확인|Check operating days|営業日を確認|确认开放日|確認開放日
종료된 일정|Past event|終了したイベント|已结束|已結束
취소|Cancelled|中止|已取消|已取消
예정|Upcoming|開催予定|即将举办|即將舉辦
입장·기본참여 무료|Free basic admission|入場・基本参加無料|基本入场免费|基本入場免費
일부 유료|Some activities cost extra|一部有料|部分收费|部分收費
유료|Paid admission|有料|收费|收費
요금 확인 필요|Check fees|料金要確認|费用待确认|費用待確認
입장·참여 비용|Admission & activities|入場・参加費|入场与体验费用|入場與體驗費用
무료 일정만|Free admission only|無料の予定のみ|仅免费入场|僅免費入場
보관한 일정만|Saved events only|保存した予定のみ|仅收藏活动|僅收藏活動
보관한 일정|Saved events|保存した予定|收藏活动|收藏活動
시작일순|Start date|開始日順|开始日期|開始日期
종료일순|End date|終了日順|结束日期|結束日期
초기화|Reset|リセット|重置|重設
조건 초기화|Reset filters|条件をリセット|重置筛选|重設篩選
더 많은 축제 보기|Load more festivals|お祭りをもっと見る|加载更多节庆|載入更多節慶
더 보기|Load more|もっと見る|加载更多|載入更多
상세보기|Details|詳細|详情|詳情
전체 상세보기|Full event details|詳細ページへ|完整活动详情|完整活動詳情
♡ 일정 보관|♡ Save event|♡ 予定を保存|♡ 收藏活动|♡ 收藏活動
♥ 보관됨|♥ Saved|♥ 保存済み|♥ 已收藏|♥ 已收藏
공유하기 ↗|Share ↗|共有 ↗|分享 ↗|分享 ↗
이 축제 공유|Share this event|このイベントを共有|分享活动|分享活動
이 기기의 보관함에 저장했어요.|Saved on this device.|この端末に保存しました。|已在此设备收藏。|已在此裝置收藏。
보관함에서 꺼냈어요.|Removed from saved events.|保存から削除しました。|已取消收藏。|已取消收藏。
이 화면에서만 보관됩니다. 브라우저 저장 공간을 사용할 수 없어요.|Saved for this screen only. Browser storage is unavailable.|この画面のみ保存。ブラウザーの保存領域を使用できません。|仅在当前页面保存，浏览器存储不可用。|僅在目前頁面保存，瀏覽器儲存空間無法使用。
축제 링크를 복사했어요.|Event link copied.|リンクをコピーしました。|活动链接已复制。|活動連結已複製。
공유하지 못했어요. 상세 페이지 주소를 복사해 주세요.|Could not share. Copy the event page address.|共有できませんでした。詳細ページのURLをコピーしてください。|分享失败，请复制详情页地址。|分享失敗，請複製詳情頁網址。
선택한 키워드|Selected tag|選択したタグ|已选标签|已選標籤
전체 조건 ↑|All filters ↑|全条件 ↑|全部筛选 ↑|全部篩選 ↑
선택한 조건에 맞는 축제가 없어요|No matching festivals|条件に合うお祭りがありません|没有符合条件的节庆|沒有符合條件的節慶
이 조건에서 수록된 일정이 없어요|No listed events match|条件に合う掲載予定がありません|没有符合条件的已收录活动|沒有符合條件的已收錄活動
다른 날짜나 지역을 선택해 보세요. 공식 공지를 검토한 자료부터 수록합니다.|Try another date or region. We list events after checking official notices.|別の日付・地域を選んでください。公式案内を確認してから掲載しています。|请尝试其他日期或地区。我们核对官方公告后收录活动。|請嘗試其他日期或地區。我們核對官方公告後收錄活動。
AI 생성 이미지|AI-generated image|AI生成画像|AI生成图片|AI生成圖片
AI 생성 이미지 · 현장 사진 아님|AI-generated · not an event photo|AI生成・現地写真ではありません|AI生成 · 非现场照片|AI生成 · 非現場照片
테마 일러스트|Theme illustration|テーマイラスト|主题插画|主題插畫
현장 사진 아님|Not an event photo|現地写真ではありません|非现场照片|非現場照片
주제 참고 · 현장 사진 아님|Illustrative reference · not an event photo|テーマ参考・現地写真ではありません|主题参考 · 非现场照片|主題參考 · 非現場照片
행사 주제를 바탕으로 만든 AI 참고 이미지입니다. 실제 행사나 장소를 촬영한 사진이 아닙니다.|AI-created illustration of the event theme; not a photograph of the event or venue.|イベントのテーマをもとにしたAI参考画像です。実際の会場写真ではありません。|依据活动主题生成的AI参考图，非实际活动或场地照片。|依據活動主題生成的AI參考圖，非實際活動或場地照片。
공식 포스터 원문 ↗|Official poster source ↗|公式ポスター原文 ↗|官方海报原文 ↗|官方海報原文 ↗
기간|Dates|期間|日期|日期
행사 기간|Event dates|開催期間|活动日期|活動日期
시간|Time|時間|时间|時間
운영 시간|Opening hours|開催時間|开放时间|開放時間
비용|Fees|料金|费用|費用
관람·참여 비용|Admission & fees|入場・参加費|参观与参与费用|參觀與參與費用
장소|Venue|会場|地点|地點
개최 장소|Venue|会場|举办地点|舉辦地點
일정·프로그램|Schedule|日程・内容|日程|日程
예약·비용|Booking & fees|予約・料金|预约与费用|預約與費用
공식 출처|Official sources|公式出典|官方来源|官方來源
상세안내|Event details|詳細案内|活动详情|活動詳情
축제 상세안내|Event details|お祭りの詳細|节庆详情|節慶詳情
일정과 프로그램|Schedule & program|日程とプログラム|日程与内容|日程與內容
언제, 어떻게 즐길까요?|Plan your visit|いつ、どう楽しむ？|规划行程|規劃行程
예약과 비용|Booking & fees|予約と料金|预约与费用|預約與費用
예약과 참여 조건|Booking & eligibility|予約と参加条件|预约与参与条件|預約與參與條件
찾아가는 곳|Getting there|アクセス|如何前往|如何前往
직접 확인한 공식 출처|Official sources we checked|確認した公式出典|已核实的官方来源|已核實的官方來源
확인한 공식 안내|Official notices checked|確認した公式案内|已核实的官方公告|已核實的官方公告
공식 안내 확인 ↗|Visit official website ↗|公式案内を確認 ↗|查看官方公告 ↗|查看官方公告 ↗
공식 안내 확인|Check official notice|公式案内を確認|查看官方公告|查看官方公告
네이버 지도에서 장소 검색 ↗|Find the Korean venue on Naver Map ↗|韓国語の会場名でNaver Map検索 ↗|在Naver地图搜索韩文地点 ↗|在Naver地圖搜尋韓文地點 ↗
공식 공지의 개최 기간입니다.|Dates from the official notice.|公式案内の開催期間です。|日期依据官方公告。|日期依據官方公告。
날짜별 운영과 프로그램은 공식 공지에서 확인하세요.|Check daily operation and program details on the official website.|日別の営業・プログラムは公式案内でご確認ください。|每日开放与活动内容请查看官方公告。|每日開放與活動內容請查看官方公告。
참여 조건은 공식 안내를 확인하세요.|Check eligibility with the organizer.|参加条件は公式案内をご確認ください。|参与条件请查看官方公告。|參與條件請查看官方公告。
예약 가능 여부·마감·취소는 실시간 정보가 아닙니다. 공식 운영처에서 최종 확인하세요.|Booking availability, deadlines and cancellations are not live. Confirm with the organizer.|予約状況・締切・中止はリアルタイム情報ではありません。公式運営先でご確認ください。|预约名额、截止与取消状态非实时信息，请向主办方确认。|預約名額、截止與取消狀態非即時資訊，請向主辦方確認。
이 사이트는 축제 주최·예약 대행사가 아닙니다. 출발 전 공식 안내에서 변경 여부를 확인하세요.|We are an independent guide, not an organizer or booking agent. Check official notices before travel.|当サイトは主催者・予約代行ではありません。出発前に公式案内をご確認ください。|本网站为独立指南，非主办方或预约代理。出发前请确认官方公告。|本網站為獨立指南，非主辦方或預約代理。出發前請確認官方公告。
닫기|Close|閉じる|关闭|關閉
북마크 저장|Save a bookmark|ブックマーク保存|添加书签|加入書籤
월간|Month|月間|月视图|月檢視
주간 일정|Week|週間|周视图|週檢視
이전 달|Previous month|前の月|上个月|上個月
다음 달|Next month|次の月|下个月|下個月
이전 주|Previous week|前の週|上周|上週
다음 주|Next week|次の週|下周|下週
주차별 둘러보기|Browse by week|週から探す|按周浏览|依週瀏覽
이 달 전체 보기|Show full month|月全体を見る|查看整月|查看整月
선택한 달 보기|Show selected month|選択した月を見る|查看所选月份|查看所選月份
선택한 달 전체 보기|Show full month|月全体を見る|查看整月|查看整月
이 주 전체 보기|Show full week|週全体を見る|查看整周|查看整週
날짜를 누르면 아래 카드도 함께 바뀌어요.|Choose a day to update the event cards below.|日付を選ぶと下のカードも変わります。|选择日期即可更新下方活动卡片。|選擇日期即可更新下方活動卡片。
선택한 일정 카드 보기 ↓|View selected event cards ↓|選択した予定を見る ↓|查看所选活动卡片 ↓|查看所選活動卡片 ↓
테마별로 만나는 축제|Explore by theme|テーマから探す|按主题探索|依主題探索
이 달의 수록 축제|Listed events this month|今月の掲載イベント|本月已收录活动|本月已收錄活動
수록 일정 없음|No listed events|掲載予定なし|暂无收录活动|暫無收錄活動
하루 일정|One-day event|1日のイベント|单日活动|單日活動
시작|Starts|開始|开始|開始
종료|Ends|終了|结束|結束
운영일|Operating day|開催日|开放日|開放日
시간 확인 필요|Check times|時間要確認|时间待确认|時間待確認
예보 기준|Forecast city|予報地点|预报城市|預報城市
날씨 기준 도시|Forecast city|予報都市|预报城市|預報城市
지난 날짜|Past date|過去の日付|过去日期|過去日期
예보 확인 중|Loading forecast|予報取得中|加载预报中|載入預報中
예보 연결 실패|Forecast unavailable|予報取得失敗|预报暂不可用|預報暫無法使用
예보 미제공|No forecast|予報なし|无预报|無預報
대한민국 축제 지도|Korea festival regions|韓国お祭りエリアマップ|韩国节庆区域图|韓國節慶區域圖
7개 권역|7 regions|7エリア|七大区域|七大區域
지도를 눌러, 다음 여행을 골라보세요|Pick a region for your next trip|地図から次の旅先を選ぼう|在地图上选择下次旅行目的地|在地圖上選擇下次旅行目的地
수록된 정보가 없는 지역도 있습니다. 0건은 그 지역에 행사가 없다는 뜻이 아닙니다.|Some regions have no reviewed listings yet. Zero does not mean there are no events.|未掲載の地域もあります。0件はイベントがないことを意味しません。|部分地区暂无已核实收录。零条不代表当地没有活动。|部分地區暫無已核實收錄。零筆不代表當地沒有活動。
권역 선택용 개략도입니다. 표시 위치는 실제 행사장의 좌표가 아니며 지형·행정경계는 정확한 지도와 다를 수 있습니다.|Schematic region selector, not an exact map or venue location.|エリア選択用の概略図です。正確な地図や会場位置ではありません。|此为区域选择示意图，非精确地图或场地坐标。|此為區域選擇示意圖，非精確地圖或場地座標。
가고 싶은 축제 찾기|Find your festival|行きたいお祭りを探す|寻找心仪节庆|尋找心儀節慶
7개 권역으로 탐색|Explore 7 regions|7エリアから探す|探索七大区域|探索七大區域
날짜별 축제 달력|Calendar by date|日付別カレンダー|按日期查看日历|依日期查看月曆
이번 주말 일정|This weekend’s events|今週末の予定|本周末活动|本週末活動
정보 이용 안내|About this guide|ご利用案内|使用指南|使用指南
서비스 소개·문의|About & contact (Korean)|サービス紹介・問合せ（韓国語）|介绍与联系（韩文）|介紹與聯絡（韓文）
이용약관·면책 안내|Terms (Korean)|利用規約（韓国語）|条款（韩文）|條款（韓文）
개인정보처리방침|Privacy (Korean)|プライバシー（韓国語）|隐私政策（韩文）|隱私政策（韓文）
출처·검토·정정 기준|Editorial policy (Korean)|編集方針（韓国語）|编辑标准（韩文）|編輯標準（韓文）
사용 서체·출처|Font credits (Korean)|フォント出典（韓国語）|字体来源（韩文）|字型來源（韓文）
기존 시뮬랩 자료|Simulab archive (Korean)|Simulabアーカイブ（韓国語）|Simulab存档（韩文）|Simulab存檔（韓文）
이번 주, 새로운 즐거움을 발견하세요.|Find something wonderful this week.|今週、新しい楽しみを見つけよう。|本周发现新乐趣。|本週發現新樂趣。
공식 안내를 바탕으로 모은 전국 축제·행사.|Festivals and events across South Korea, checked against official notices.|公式案内をもとに集めた韓国各地のお祭り・イベント。|依据官方公告整理的韩国各地节庆与活动。|依據官方公告整理的韓國各地節慶與活動。
축제 주최·예약 대행 서비스가 아닙니다. 일정·요금·예약 및 취소 여부는 출발 전 공식 안내에서 다시 확인하세요. 카드 건수는 이 사이트에 수록된 일정 수이며 전국 전체 개최 수가 아닙니다.|An independent guide, not a booking agent. Confirm dates, fees, booking and cancellations with the organizer before travel. Counts refer to our listings, not all events in Korea.|主催・予約代行サービスではありません。日程・料金・予約・中止は出発前に公式案内でご確認ください。件数は当サイトの掲載数です。|独立活动指南，非预约代理。出发前请向主办方确认日期、费用、预约与取消信息。数量仅代表本站收录。|獨立活動指南，非預約代理。出發前請向主辦方確認日期、費用、預約與取消資訊。數量僅代表本站收錄。
HOT · 주목할 행사|HOT · Editor’s pick|HOT · 注目イベント|HOT · 编辑推荐|HOT · 編輯推薦
공식 규모·대표성에 근거한 편집 선정이며 실시간 인기 순위가 아닙니다.|Selected for official scale or regional significance, not real-time popularity.|公式規模・地域の代表性による編集選定。リアルタイム人気順位ではありません。|依据官方规模或地区代表性编辑精选，非实时人气排名。|依據官方規模或地區代表性編輯精選，非即時人氣排名。
여행자를 위한 축제 안내|A local guide to Korea’s festivals|韓国のお祭り、旅のガイド|韩国节庆旅行指南|韓國節慶旅行指南
일정은 한국시간(KST), 금액은 원(KRW) 기준입니다. 장소명은 지도 검색을 위해 한국어 원문도 제공합니다.|Dates and times are in Korea Standard Time (KST). Prices are in Korean won (KRW). Korean venue names are kept for map searches.|日時は韓国標準時（KST）、料金はウォン（KRW）です。地図検索用に会場名は韓国語も表示します。|日期与时间为韩国标准时间（KST），金额为韩元（KRW）。保留韩文地点名，方便地图搜索。|日期與時間為韓國標準時間（KST），金額為韓元（KRW）。保留韓文地點名，方便地圖搜尋。
번역은 탐색을 돕기 위한 행사명·주제 요약입니다. 상세 예약·참여 조건과 공식 출처는 한국어 원문을 확인하세요.|Translated guide names and topic summaries help you browse. Detailed booking and participation terms, venue names and source notices remain in Korean. Confirm them with the organizer.|翻訳は検索用のイベント名・テーマ要約です。予約・参加条件、会場名、公式出典は韓国語原文を主催者にご確認ください。|翻译提供活动名与主题摘要，方便浏览。详细预约与参与条件、地点名及官方来源保留韩文，请向主办方确认。|翻譯提供活動名與主題摘要，方便瀏覽。詳細預約與參與條件、地點名及官方來源保留韓文，請向主辦方確認。
원문 상세 안내 · 한국어|Original details · Korean|原文の詳細案内・韓国語|原文详情 · 韩文|原文詳情 · 韓文
한국어 행사명|Korean event name|韓国語のイベント名|韩文活动名|韓文活動名
선정 근거 보기 ↗|Why this event? ↗|選定理由を見る ↗|查看推荐依据 ↗|查看推薦依據 ↗
`.trim().split('\n').map(row=>row.split('|'));
export const UI_TRANSLATIONS=Object.fromEntries(rows.map(([key,...values])=>[key,values]));
for(const row of `
오늘 일정 있음|Runs today|本日開催|今日开放|今日開放
이전 추천|Previous pick|前のおすすめ|上一推荐|上一推薦
다음 추천|Next pick|次のおすすめ|下一推荐|下一推薦
이전 주말 카드|Previous weekend cards|前の週末カード|上一组周末活动|上一組週末活動
다음 주말 카드|Next weekend cards|次の週末カード|下一组周末活动|下一組週末活動
일정순|By date|日程順|按日期|依日期
마감순|Ending soon|終了日順|即将结束|即將結束
일정 더보기|Load more events|予定をもっと見る|加载更多活动|載入更多活動
축제 조건|Festival filters|お祭りの絞り込み|节庆筛选|節慶篩選
일정 범위|Date range|日付範囲|日期范围|日期範圍
정렬|Sort|並び替え|排序|排序
선택한 달|Selected month|選択した月|所选月份|所選月份
무료 조건은 입장·기본참여 기준입니다. 식음료·선택 체험 비용은 별도일 수 있습니다. 기간형 행사는 휴무·실제 운영일을 공식 안내에서 확인하세요.|Free refers to basic admission or participation. Food and optional activities may cost extra. Check actual operating days and closures with the organizer.|無料は入場・基本参加が対象です。飲食や追加体験は別料金の場合があります。休業日・実際の開催日は公式案内でご確認ください。|免费指基本入场或参与，餐饮及可选体验可能另收费。请向主办方确认实际开放日与休息日。|免費指基本入場或參與，餐飲及可選體驗可能另收費。請向主辦方確認實際開放日與休息日。
아직 수록된 일정이 없어요|No listed events yet|掲載予定がまだありません|暂无已收录活动|暫無已收錄活動
이 조건에서 확인된 자료가 없습니다. 다른 지역이나 날짜를 선택해 보세요.|No reviewed listings match. Try another region or date.|条件に合う確認済みの掲載がありません。別の地域・日付を選んでください。|没有符合条件的已核实信息，请选择其他地区或日期。|沒有符合條件的已核實資訊，請選擇其他地區或日期。
전체 일정 보기|Show all events|全予定を見る|查看全部活动|查看全部活動
이 주말의 수록 일정이 없어요. 달력에서 다른 날짜를 살펴보세요.|No listed events this weekend. Try another date on the calendar.|今週末の掲載予定はありません。カレンダーで別の日付をお試しください。|本周末暂无收录活动，请在日历中选择其他日期。|本週末暫無收錄活動，請在月曆中選擇其他日期。
서울부터 제주까지. 가고 싶은 권역을 누르면 수록된 축제와 행사를 모아볼 수 있어요.|From Seoul to Jeju: choose a region to explore its listed festivals and events.|ソウルから済州まで。行きたいエリアを選ぶと掲載イベントをまとめて見られます。|从首尔到济州，选择目的地区域查看已收录节庆与活动。|從首爾到濟州，選擇目的地區域查看已收錄節慶與活動。
비어 있는 하루에 즐거운 계획을 더해보세요. 날짜를 누르면 수록된 축제와 행사를 보여드려요.|Make a plan for your free day. Select a date to see listed festivals and events.|空いている日に楽しい予定を。日付を選ぶと掲載イベントを表示します。|为空闲的一天安排精彩行程，选择日期查看已收录节庆与活动。|為空閒的一天安排精彩行程，選擇日期查看已收錄節慶與活動。
기간형 일정은 매일 운영을 뜻하지 않습니다. 세부 운영일을 확인하세요.|An event period does not mean daily opening. Check actual operating days.|会期中も毎日開催とは限りません。実施日をご確認ください。|活动期间不代表每日开放，请确认实际开放日。|活動期間不代表每日開放，請確認實際開放日。
건수는 선택한 월·지역·테마에 해당하는 수록 행사 수입니다. 지정 운영일은 해당 날짜에만, 기간형 공지는 ‘운영일 확인’으로 표시합니다.|Counts show our listings for the selected month, region and theme. Specific dates are shown only on those days; period-based notices require operating-day checks.|件数は選択した月・地域・テーマの掲載数です。指定日はその日のみ、期間型の案内は営業日確認として表示します。|数量为所选月份、地区与主题的本站收录数。指定日期仅在当日显示，期间型公告需另确认开放日。|數量為所選月份、地區與主題的本站收錄數。指定日期僅在當日顯示，期間型公告需另確認開放日。
◇ 기간형 공지는 실제 운영일 확인이 필요합니다.|◇ Check actual operating days for period-based notices.|◇ 期間型の案内は実際の開催日をご確認ください。|◇ 期间型公告需确认实际开放日。|◇ 期間型公告需確認實際開放日。
SUN 일|SUN|日|周日|週日
MON 월|MON|月|周一|週一
TUE 화|TUE|火|周二|週二
WED 수|WED|水|周三|週三
THU 목|THU|木|周四|週四
FRI 금|FRI|金|周五|週五
SAT 토|SAT|土|周六|週六
대표 지점 예보를 불러오는 중입니다.|Loading a representative city forecast.|代表地点の予報を読み込み中です。|正在加载代表城市预报。|正在載入代表城市預報。
날짜 선택|Select a date|日付を選択|选择日期|選擇日期
달력 보기 방식|Calendar view|カレンダー表示|日历视图|月曆檢視
선택 일정 카드 목록|Selected event cards|選択予定のカード|所选活动卡片|所選活動卡片
주간 날짜별 축제|Weekly festival timetable|週の日別お祭り予定|每周节庆日程|每週節慶日程
상세안내 항목|Event detail sections|詳細項目|活动详情栏目|活動詳情欄目
날짜별 프로그램과 실제 운영 시간은 공식 안내에서 확인하세요.|Check daily programs and operating hours on the official website.|日別の内容と開催時間は公式案内をご確認ください。|每日内容与开放时间请查看官方公告。|每日內容與開放時間請查看官方公告。
예약 가능 좌석·마감·취소 여부를 실시간으로 제공하지 않습니다. 예약과 결제는 공식 운영처에서 진행하세요.|Seat availability, deadlines and cancellations are not live. Book and pay through the official operator.|空席・締切・中止はリアルタイム情報ではありません。予約・決済は公式運営先で行ってください。|座位、截止与取消状态非实时信息，请通过官方渠道预约和付款。|座位、截止與取消狀態非即時資訊，請透過官方管道預約和付款。
주소 검색 링크입니다. 실제 행사장 위치·주차·교통 통제는 공식 공지를 확인하세요.|This is an address search. Check the organizer’s notice for the exact venue, parking and road closures.|住所検索リンクです。会場の位置・駐車場・交通規制は公式案内でご確認ください。|此为地址搜索，请查看官方公告确认实际场地、停车与交通管制。|此為地址搜尋，請查看官方公告確認實際場地、停車與交通管制。
주소 검색 링크입니다. 확정된 행사장 위치·주차·교통 통제는 주최 측 공지를 확인하세요.|This is an address search. Check the organizer’s notice for the confirmed venue, parking and road closures.|住所検索リンクです。確定会場・駐車場・交通規制は主催者案内でご確認ください。|此为地址搜索，请查看主办方公告确认场地、停车与交通管制。|此為地址搜尋，請查看主辦方公告確認場地、停車與交通管制。
출발 전에 한 번 더 확인해요|Check once more before travel|出発前にもう一度確認を|出发前再确认一次|出發前再確認一次
날씨와 현장 사정으로 일정이 바뀔 수 있습니다. 최종 운영일·예약·참여 조건은 공식 공지를 우선합니다.|Weather and local conditions may change schedules. The organizer’s notice takes priority for operating dates, booking and eligibility.|天候・現地事情で予定が変わる場合があります。開催日・予約・参加条件は公式案内を優先します。|天气与现场情况可能影响日程。开放日、预约与参与条件以官方公告为准。|天氣與現場情況可能影響日程。開放日、預約與參與條件以官方公告為準。
다른 날짜 보기 ↗|Explore other dates ↗|別の日付を見る ↗|查看其他日期 ↗|查看其他日期 ↗
떠나기 전 확인할 세 가지|Three things to check before you go|出発前に確認する3つのこと|出发前确认三件事|出發前確認三件事
실제 운영일, 참여 비용, 사전예약 여부. 상세안내의 확인일과 공식 공지를 함께 확인하세요.|Operating dates, participation fees and advance booking. Check the review date and the official notice.|実際の開催日・参加費・事前予約。詳細の確認日と公式案内を合わせてご確認ください。|实际开放日、参与费用与是否需预约。请结合核实日期查看官方公告。|實際開放日、參與費用與是否需預約。請結合核實日期查看官方公告。
날짜로 찾는 나들이|Find an outing by date|日付から探すお出かけ|按日期寻找出游活动|依日期尋找出遊活動
지역을 골랐다면, 떠날 날짜도 확인해 보세요.|Picked a region? Choose your travel date next.|エリアを決めたら、お出かけの日も確認しよう。|选好地区后，再确认出发日期。|選好地區後，再確認出發日期。
가까워진 이번 주말|This weekend is nearly here|もうすぐ今週末|这个周末即将到来|這個週末即將到來
이번 토요일과 일요일의 수록 일정을 한눈에.|Listed events for this Saturday and Sunday.|今週土・日の掲載予定をひと目で。|一览本周六、日已收录活动。|一覽本週六、日已收錄活動。
브라우저 메뉴에서 이 페이지를 북마크에 추가하세요.|Bookmark this page from your browser’s menu.|ブラウザーのメニューからブックマークに追加してください。|请从浏览器菜单将本页添加至书签。|請從瀏覽器選單將本頁加入書籤。
홈 화면에 추가|Add to Home Screen|ホーム画面に追加|添加到主屏幕|加入主畫面
`.trim().split('\n')){const [key,...values]=row.split('|');UI_TRANSLATIONS[key]=values;}
const columns={en:0,ja:1,'zh-CN':2,'zh-TW':3};
for(const row of `
수원|Suwon|水原|水原|水原
강릉|Gangneung|江陵|江陵|江陵
상태:|Status:|状態：|状态：|狀態：
현재 상태:|Status:|現在の状態：|当前状态：|目前狀態：
이미지:|Image:|画像：|图片：|圖片：
이용 조건|License|利用条件|使用条款|使用條款
대표 지점|Representative city|代表地点|代表城市|代表城市
예보 갱신|Forecast updated|予報更新|预报更新|預報更新
제공 범위|Forecast range|予報期間|预报范围|預報範圍
예보를 불러오는 중입니다.|Loading forecast.|予報読み込み中。|正在加载预报。|正在載入預報。
예보 연결 실패 · 잠시 후 다시 확인해 주세요.|Forecast unavailable. Please try again later.|予報を取得できません。後でもう一度お試しください。|预报暂不可用，请稍后重试。|預報暫無法使用，請稍後再試。
분청사기 소장품 사진 · 축제 현장 아님|Buncheong collection photograph · not the festival|粉青沙器の所蔵品写真・祭りの現地写真ではありません|粉青陶瓷藏品照片 · 非节庆现场|粉青陶瓷藏品照片 · 非節慶現場
당현천 2021년 · 장소 참고 사진|Danghyeoncheon, 2021 · venue reference|堂峴川 2021年・場所の参考写真|堂岘川2021年 · 地点参考照片|堂峴川2021年 · 地點參考照片
운정호수공원 2014년 · 장소 참고 사진|Unjeong Lake Park, 2014 · venue reference|雲井湖公園 2014年・場所の参考写真|云井湖公园2014年 · 地点参考照片|雲井湖公園2014年 · 地點參考照片
2016년 포항국제불빛축제 기록 사진|Pohang fireworks archive photograph, 2016|2016年浦項国際花火祭りの記録写真|2016年浦项国际烟花节资料照片|2016年浦項國際煙火節資料照片
2015년 여수 진남관 장소 참고 사진 · 행사 현장 사진 아님|Yeosu Jinnamgwan, 2015 · venue reference, not an event photo|麗水鎮南館 2015年・場所の参考、イベント写真ではありません|丽水镇南馆2015年 · 地点参考，非活动现场|麗水鎮南館2015年 · 地點參考，非活動現場
2007년 화순 운주사 장소 참고 사진 · 행사 현장 사진 아님|Hwasun Unjusa, 2007 · venue reference, not an event photo|和順雲住寺 2007年・場所の参考、イベント写真ではありません|和顺云住寺2007年 · 地点参考，非活动现场|和順雲住寺2007年 · 地點參考，非活動現場
2024년 전라감영 선화당 장소 참고 사진 · 행사 현장 사진 아님|Jeolla Gamyeong Seonhwadang, 2024 · venue reference, not an event photo|全羅監営宣化堂 2024年・場所の参考、イベント写真ではありません|全罗监营宣化堂2024年 · 地点参考，非活动现场|全羅監營宣化堂2024年 · 地點參考，非活動現場
예보 출처:|Forecast source:|予報出典：|预报来源：|預報來源：
· 한국시간 일자별 대표시각 예보로 재구성. 행사장 실황이나 일 최저·최고 기온이 아닙니다.|· A representative forecast time for each Korean date; not live venue conditions or daily highs/lows.|· 韓国時間の日付ごとの代表時刻予報。会場実況や日最高・最低気温ではありません。|· 按韩国日期选取代表时刻预报，非现场实况或每日最高最低温。|· 依韓國日期選取代表時刻預報，非現場實況或每日最高最低溫。
이번 주말 아이와 갈 곳을 찾는다면|For a family outing this weekend, see|今週末、子どもと出かけるなら|本周末亲子出游可查看|本週末親子出遊可查看
주말 가족 나들이|weekend family events|週末の家族のお出かけ|周末亲子活动|週末親子活動
에서 체험·문화 행사를 살펴보세요. 저녁에 함께 갈 곳은|for activities and culture. For evening plans, see|で体験・文化イベントを。夜のお出かけは|中的体验与文化活动。夜间出游可查看|中的體驗與文化活動。夜間出遊可查看
주말 데이트|weekend date ideas|週末のデート|周末约会|週末約會
에서 불꽃·야경 행사를 골라보세요.|for fireworks and night views.|で花火・夜景を探そう。|中的烟花与夜景活动。|中的煙火與夜景活動。
· 토요일과 일요일에 겹치는 수록 일정을 모았어요.|· Listed events overlapping Saturday and Sunday.|· 土曜日・日曜日に重なる掲載予定です。|· 汇总与周六、日重叠的已收录活动。|· 彙整與週六、日重疊的已收錄活動。
앱 설치 상태|App installation|アプリの状態|应用安装状态|應用程式安裝狀態
이미 이번주 축제를 앱으로 열고 있어요.|You are already using the installed festival app.|すでにインストール済みアプリで開いています。|您已在使用已安装的节庆应用。|您已在使用已安裝的節慶應用程式。
이번주 축제를 앱으로 설치했어요.|The festival app is installed.|お祭りアプリを追加しました。|节庆应用已安装。|節慶應用程式已安裝。
Safari에서 공유 버튼 → 책갈피 추가를 선택하세요. 다른 브라우저에서는 메뉴의 북마크 추가를 선택하세요.|In Safari, choose Share → Add Bookmark. In other browsers, use Add Bookmark in the menu.|Safariで共有→ブックマークを追加。ほかのブラウザーではメニューのブックマーク追加を選んでください。|Safari中选择分享→添加书签，其他浏览器请使用菜单中的添加书签。|Safari中選擇分享→加入書籤，其他瀏覽器請使用選單中的加入書籤。
브라우저 더보기 메뉴(⋮)에서 별표 또는 북마크 추가를 누르세요.|In the browser menu (⋮), tap the star or Add Bookmark.|ブラウザーのメニュー（⋮）から星印かブックマーク追加を選んでください。|在浏览器菜单（⋮）中点击星标或添加书签。|在瀏覽器選單（⋮）中點選星號或加入書籤。
를 누르거나 주소창의 별표로 이 페이지를 북마크에 추가하세요.|to bookmark this page, or use the star in the address bar.|を押すか、アドレスバーの星印でブックマークしてください。|可添加本页为书签，或点击地址栏星标。|可將本頁加入書籤，或點選網址列星號。
앱 아이콘을 만들려면 Safari의 공유 메뉴에서|To create an app icon, use Safari’s Share menu and choose|アプリアイコンを作るにはSafariの共有メニューで|创建应用图标，请在Safari分享菜单中选择|建立應用程式圖示，請在Safari分享選單中選擇
를 선택하세요.|.|を選んでください。|。|。
`.trim().split('\n')){const [key,...values]=row.split('|');UI_TRANSLATIONS[key]=values;}
const tokenRules=Object.keys(UI_TRANSLATIONS).sort((a,b)=>b.length-a.length).map(token=>{
  const escaped=token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return [token,new RegExp('(^|[\\s#·⌖✦◒❋✳●©])'+escaped+'(?=$|[\\s·↗→↓↑\\d])','g')];
});
export function t(text,locale='ko') {return UI_TRANSLATIONS[text]?.[columns[locale]]||text;}
export function translateUI(text,locale='ko') {
  if(columns[locale]===undefined||!text)return text;
  const value=text.trim();
  if(UI_TRANSLATIONS[value])return text.replace(value,t(value,locale));
  // Compose known UI phrases while keeping numbers, ISO dates and Korean venue names intact.
  const literals=['공식 출처 확인','정보 확인','다음 운영','수록 일정','수록','건','주차','개 더','축제 모아보기','조건 해제','상세안내','보관','추천','이전 카드','다음 카드','이전 추천','다음 추천','자동 전환 일시정지','자동 전환 재생'];
  const dynamic={
    '공식 출처 확인':['Official sources checked','公式出典確認','官方来源核实','官方來源核實'],'정보 확인':['Reviewed','情報確認','信息核实','資訊核實'],
    '다음 운영':['Next date','次回開催','下次开放','下次開放'],'수록 일정':['Listed events','掲載予定','已收录活动','已收錄活動'],'수록':['Listed','掲載','已收录','已收錄'],
    '건':[' events','件','项','項'],'주차':[' · week','週目','周','週'],'개 더':[' more','件追加','项更多','項更多'],'축제 모아보기':['festivals','のお祭り','节庆','節慶'],
    '조건 해제':['remove filter','条件解除','清除条件','清除條件'],'상세안내':['details','詳細','详情','詳情'],'보관':['save','保存','收藏','收藏'],
    '추천':['Pick','おすすめ','推荐','推薦'],'이전 카드':['Previous cards','前のカード','上一组卡片','上一組卡片'],'다음 카드':['Next cards','次のカード','下一组卡片','下一組卡片'],
    '이전 추천':['Previous pick','前のおすすめ','上一推荐','上一推薦'],'다음 추천':['Next pick','次のおすすめ','下一推荐','下一推薦'],
    '자동 전환 일시정지':['Pause slideshow','自動切替を停止','暂停轮播','暫停輪播'],'자동 전환 재생':['Play slideshow','自動切替を再生','播放轮播','播放輪播']
  };
  let result=text.replace(/수록 일정 (\d+)건/g,(_,count)=>[
    'Listed events: '+count,'掲載予定 '+count+'件','已收录活动：'+count+'项','已收錄活動：'+count+'項'
  ][columns[locale]]).replace(/(\d+)주차/g,(_,week)=>['Week '+week,week+'週目','第'+week+'周','第'+week+'週'][columns[locale]])
    .replace(/의 축제/g,[' · festivals','のお祭り',' · 节庆',' · 節慶'][columns[locale]])
    .replace(/주간 축제/g,[' · weekly festivals','週間のお祭り','每周节庆','每週節慶'][columns[locale]])
    .replace(/시작 (\d+)/g,(_,count)=>t('시작',locale)+' '+count).replace(/종료 (\d+)/g,(_,count)=>t('종료',locale)+' '+count);
  for(const token of literals)result=result.replace(new RegExp('(?<![가-힣])'+token+'(?![가-힣])','g'),dynamic[token][columns[locale]]);
  // Replace full known tokens only at UI separators, so source/venue wording is not partially translated.
  for(const [token,pattern] of tokenRules) {
    result=result.replace(pattern,(_,prefix)=>prefix+t(token,locale));
  }
  return result;
}
