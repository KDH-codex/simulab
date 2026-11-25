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
  if(url.origin!==new URL(origin).origin||!/^\/(?:$|map\/$|calendar\/$|curation\/(?:christmas\/)?$|sales\/(?:[a-z0-9-]+\/)?$|events\/[a-z0-9-]+\/$)/.test(url.pathname))return null;
  url.searchParams.set('lang',normalizeLocale(locale)||'ko');
  return url;
}
// Hand-authored interface copy. Event guide names/summaries live in festival-event-locales.js.
const rows=`
크리스마스|Christmas|クリスマス|圣诞节|聖誕節
2026 크리스마스 가볼 만한 곳|Where to go this Christmas 2026|2026年クリスマスのお出かけ先|2026圣诞节好去处|2026聖誕節好去處
크리스마스 TOP 3|Top 3 Christmas picks|クリスマスおすすめ3選|圣诞精选TOP 3|聖誕精選TOP 3
마켓·빛축제·성탄 주간|Markets, lights and Christmas week|マーケット・イルミネーション・クリスマスの週|市集、灯光节与圣诞周|市集、燈光節與聖誕週
크리스마스 행사 모두 보기|Explore all Christmas events|クリスマスイベント一覧|查看全部圣诞活动|查看全部聖誕活動
성탄 주간 일정 보기|See what is on Christmas week|クリスマスの週のイベントを見る|查看圣诞周活动|查看聖誕週活動
크리스마스 특집|Christmas special|クリスマス特集|圣诞特辑|聖誕特輯
크리스마스 모음집|Christmas guide|クリスマスガイド|圣诞指南|聖誕指南
겨울 마켓과 빛축제, 성탄 주간 나들이와 케이크 예약을 모았어요.|Find winter markets, light festivals, Christmas week outings and cake reservations.|冬のマーケット、イルミネーション、クリスマスのお出かけとケーキ予約をまとめました。|冬日市集、灯会、圣诞出游与蛋糕预订一览。|冬日市集、燈會、聖誕出遊與蛋糕預訂一覽。
크리스마스 모음집 보기|Open the Christmas guide|クリスマスガイドを見る|查看圣诞指南|查看聖誕指南
크리스마스 일정 바로가기|Jump to Christmas dates|クリスマス日程へ|跳转到圣诞日程|跳轉到聖誕日程
12월 초 마켓|Early December markets|12月上旬のマーケット|十二月初市集|十二月初市集
11월 말~12월 초|Late November to early December|11月下旬〜12月上旬|十一月下旬至十二月初|十一月下旬至十二月初
12월 중순|Mid-December|12月中旬|十二月中旬|十二月中旬
성탄 주간|Christmas week|クリスマスの週|圣诞周|聖誕週
케이크 예약·장식 할인|Cake preorders and décor offers|ケーキ予約と装飾品セール|蛋糕预订和装饰优惠|蛋糕預訂和裝飾優惠
겨울 마켓부터 성탄 주간 행사까지. 운영일과 예약 조건을 확인하고 갈 곳을 골라보세요.|From winter markets to Christmas week events, check opening days and booking details before you go.|冬のマーケットからクリスマスの催しまで。開催日と予約条件を確認してお出かけ先を選べます。|从冬日市集到圣诞周活动，查好开放日与预约条件再出发。|從冬日市集到聖誕週活動，查好開放日與預約條件再出發。
예약 기간|Preorder dates|予約期間|预订日期|預訂日期
매장 수령|In-store pickup|店舗受け取り|门店领取|門市領取
할인 기간|Offer dates|セール期間|优惠日期|優惠日期
공식 예약 안내|Official booking information|公式予約案内|官方预订指南|官方預訂指南
공식 쿠폰 안내|Official coupon terms|公式クーポン案内|官方优惠券规则|官方優惠券規則
할인·쇼핑 더 보기|More shopping offers|ほかのセールを見る|查看其他购物优惠|查看其他購物優惠
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
✦ 이번 주말 추천|✦ This weekend’s picks|✦ 今週末のおすすめ|✦ 本周末推荐|✦ 本週末推薦
이번 주말 추천|This weekend’s picks|今週末のおすすめ|本周末推荐|本週末推薦
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
⌕ 빠른 검색|⌕ Quick search|⌕ キーワード検索|⌕ 快速搜索|⌕ 快速搜尋
축제명·장소·키워드 검색 (예: 크리스마스, 과학관, 부산)|Search by festival, venue or keyword (e.g. Christmas, museum, Busan)|祭り名・会場・キーワード検索（例：クリスマス、科学館、釜山）|搜索节庆、地点或关键词（如：圣诞、科学馆、釜山）|搜尋節慶、地點或關鍵字（如：聖誕、科學館、釜山）
검색어 지우기|Clear search|検索語を消去|清除搜索词|清除搜尋詞
⚡ 빠른 조건|⚡ Quick filters|⚡ クイック条件|⚡ 快捷筛选|⚡ 快速篩選
상황별 빠른 조건|Quick situational filters|状況別クイック条件|按场景快捷筛选|依情境快速篩選
전체 조건|All options|すべての条件|全部条件|全部條件
🏛 실내·전시관|🏛 Indoor & halls|🏛 屋内・展示館|🏛 室内与展馆|🏛 室內與展館
⏳ 이번 주 마감|⏳ Ending this week|⏳ 今週終了|⏳ 本周截止|⏳ 本週截止
📝 사전신청 안내|📝 Advance booking|📝 事前予約あり|📝 需提前预约|📝 需提前預約
⏳ 이번 주말이 마지막인 축제|⏳ Last chance this weekend|⏳ 今週末で終了するお祭り|⏳ 本周末即将结束的节庆|⏳ 本週末即將結束的節慶
이번 주 일요일 전에 종료되는 수록 일정입니다. 놓치기 전에 운영 시간을 확인하세요.|Listed events ending by this Sunday. Check operating hours before you go.|今週日曜日までに終了する掲載予定です。出発前に開催時間をご確認ください。|本周日前结束的已收录活动，出发前请确认开放时间。|本週日前結束的已收錄活動，出發前請確認開放時間。
마감 임박 모두 보기 ↗|See all ending soon ↗|まもなく終了をすべて見る ↗|查看全部即将结束 ↗|查看全部即將結束 ↗
이전 마감 임박 카드|Previous ending-soon cards|前の終了間近カード|上一组即将结束卡片|上一組即將結束卡片
다음 마감 임박 카드|Next ending-soon cards|次の終了間近カード|下一组即将结束卡片|下一組即將結束卡片
이번 주 할인·쇼핑|This week’s shopping offers|今週のセール情報|本周优惠购物|本週優惠購物
나들이 전후 챙길 마트·아울렛·백화점 할인 조건을 한곳에서 확인하세요.|Check mart, outlet and department store offers before or after your outing.|お出かけ前後に使えるマート・アウトレット・百貨店のセール条件を確認。|出游前后顺便查看超市、奥莱与百货优惠条件。|出遊前後順道查看超市、Outlet與百貨優惠條件。
이번 주말, 상황별 맞춤 코스 3선|Weekend picks for any plan|今週末のテーマ別おすすめ3選|本周末场景精选3选|本週末情境精選3選
🏛 추위 걱정 없는 실내·전시|🏛 Cozy indoor exhibitions|🏛 寒い日も安心の屋内展示|🏛 温暖室内展览|🏛 溫暖室內展覽
💸 입장 무료 알짜 나들이|💸 Free admission outings|💸 入場無料のお出かけ|💸 免费入场推荐|💸 免費入場推薦
✨ 겨울밤 빛축제·마켓|✨ Winter lights & markets|✨ 冬のイルミ・マーケット|✨ 冬夜灯会与市集|✨ 冬夜燈會與市集
⏳ 이번 일요일 마감 임박|⏳ Ending this Sunday|⏳ 今週日曜で終了|⏳ 本周日即将结束|⏳ 本週日即將結束
비·추위 걱정 없이 박물관·과학관·전시관에서 즐기는 일정입니다.|Enjoy museums, science centers and exhibition halls without worrying about the weather.|雨や寒さを気にせず博物館・科学館・展示館で楽しめる予定です。|无需担心风雨寒冷，在博物馆、科学馆与展馆轻松游玩。|無需擔心風雨寒冷，在博物館、科學館與展館輕鬆遊玩。
입장·기본참여 무료로 확인된 부담 없는 나들이 일정입니다.|Checked listings with free basic admission for an easy outing.|入場・基本参加が無料と確認された気軽なお出かけ先です。|已确认基本入场免费的轻松出游选择。|已確認基本入場免費的輕鬆出遊選擇。
저녁 시간대 조명·야경·겨울 마켓 분위기를 즐길 수 있는 일정입니다.|Evening illuminations, night views and winter market gatherings.|夜のライトアップや夜景、冬のマーケットを楽しめる予定です。|适合夜间赏灯、看夜景与逛冬日市集的活动。|適合夜間賞燈、看夜景與逛冬日市集的活動。
이번 주 일요일을 끝으로 막을 내리는 놓치기 아쉬운 일정입니다.|Listed events closing by this Sunday so you do not miss them.|今週日曜日で終了する見逃せない掲載予定です。|本周日即将结束的精彩活动，错过不再。|本週日即將結束的精彩活動，錯過不再。
⛅ 주말 날씨|⛅ Weekend weather|⛅ 週末の天気|⛅ 周末天气|⛅ 週末天氣
홈 주말 날씨 기준 도시|Weekend weather forecast city|週末天気の対象都市|周末天气预报城市|週末天氣預報城市
주말 예보를 확인하고 있어요.|Checking the weekend forecast.|週末の予報を確認中です。|正在获取周末天气预报。|正在取得週末天氣預報。
추위·우천 대비 실내 추천 보기 ↗|See indoor picks for cold or rainy weather ↗|寒い日・雨の日の屋内おすすめを見る ↗|查看防寒防雨室内推荐 ↗|查看防寒防雨室內推薦 ↗
주말 나들이 맞춤 모드|Weekend concierge modes|週末お出かけモード|周末出游精选模式|週末出遊精選模式
예보 출처: MET Norway 대표 지점 낮 예보 · 행사장 실황이 아닙니다.|Forecast source: MET Norway daytime city forecast; not live venue weather.|予報出典：MET Norway代表地点の昼予報・会場実況ではありません。|预报来源：MET Norway代表城市日间预报，非现场实况。|預報來源：MET Norway代表城市日間預報，非現場實況。
이 조건 전체 보기 →|See all matching events →|この条件をすべて見る →|查看全部符合活动 →|查看全部符合活動 →
주말 나들이 후보 비교 보드|Weekend shortlist comparison board|週末のお出かけ候補比較ボード|周末出游候选对比看板|週末出遊候選對比看板
💌 함께 고르는 주말 나들이 후보|💌 Compare weekend picks together|💌 みんなで選ぶ週末お出かけ候補|💌 一起对比周末出游候选|💌 一起對比週末出遊候選
기간·장소·실내 여부·비용·예약 조건을 한눈에 비교하고 일행에게 공유해 보세요.|Compare dates, venues, indoor access, fees and booking details, then share with your group.|日程・場所・屋内施設・料金・予約条件をまとめて比較して共有できます。|一站式对比日期、地点、室内与否、费用和预约条件并分享给同伴。|一站式對比日期、地點、室內與否、費用和預約條件並分享給同伴。
💬 비교 링크 공유|💬 Share comparison link|💬 比較リンクを共有|💬 分享对比链接|💬 分享對比連結
♡ 내 보관함에 모두 담기|♡ Save all to my list|♡ すべて自分の保存へ|♡ 全部加入我的收藏|♡ 全部加入我的收藏
닫기 ×|Close ×|閉じる ×|关闭 ×|關閉 ×
비교 항목|Compare|比較項目|对比项目|對比項目
목록에서 빼기|Remove|リストから外す|移出清单|移出清單
운영 기간|Dates|開催期間|开放日期|開放日期
지역 · 장소|Region & venue|地域・会場|地区与地点|地區與地點
🏛 실내 시설|🏛 Indoor venue|🏛 屋内施設|🏛 室内场馆|🏛 室內場館
예약 · 시간|Booking & hours|予約・時間|预约与时间|預約與時間
일정 담기|Calendar & link|予定保存|加入日程|加入日程
📅 폰 달력 저장|📅 Save to phone calendar|📅 カレンダーに保存|📅 保存到手机日历|📅 儲存到手機行事曆
📅 달력 저장|📅 Save date|📅 カレンダー保存|📅 保存日程|📅 儲存日程
구글 캘린더 ↗|Google Calendar ↗|Googleカレンダー ↗|Google日历 ↗|Google日曆 ↗
📅 구글 캘린더에 바로 등록 ↗|📅 Add directly to Google Calendar ↗|📅 Googleカレンダーに登録 ↗|📅 直接添加到Google日历 ↗|📅 直接加入Google日曆 ↗
보관한 축제 비교 및 공유|Compare and share saved festivals|保存したお祭りを比較・共有|对比与分享已收藏节庆|對比與分享已收藏節慶
보관한 후보|Saved picks|保存した候補|已收藏候选|已收藏候選
🔍 한눈에 비교|🔍 Compare|🔍 まとめて比較|🔍 一键对比|🔍 一鍵對比
💬 일행에게 공유|💬 Share with group|💬 みんなに共有|💬 分享给同伴|💬 分享給同伴
후보 비교 링크를 복사했어요. 일행에게 보내 함께 골라보세요!|Comparison link copied. Send it to your group to decide together!|比較リンクをコピーしました。家族や友人に送って一緒に選びましょう！|已复制对比链接，发送给同伴一起挑选吧！|已複製對比連結，傳送給同伴一起挑選吧！
공유하지 못했어요. 주소창 링크를 복사해 주세요.|Could not share. Please copy the link from the address bar.|共有できませんでした。アドレスバーのURLをコピーしてください。|无法分享，请复制地址栏链接。|無法分享，請複製網址列連結。
공유받은 후보 일정을 내 보관함에 모두 담았어요.|All shared candidates have been saved to your list.|共有された候補をすべて保存しました。|已将分享的候选活动全部加入我的收藏。|已將分享的候選活動全部加入我的收藏。
달력 일정 파일(.ics)을 저장했어요.|Calendar event file (.ics) saved.|カレンダー予定ファイル(.ics)を保存しました。|已保存日历日程文件(.ics)。|已儲存行事曆檔案(.ics)。
같은 권역 추천 축제|Nearby festivals in the same region|同じエリアのおすすめお祭り|同地区推荐节庆|同地區推薦節慶
같은 권역에서 함께 열리는 축제|More festivals nearby|同じエリアで開催中のお祭り|同地区正在举办的其他节庆|同地區正在舉辦的其他節慶
권역 일정 더 보기 ↗|More in this region ↗|エリアの一覧を見る ↗|查看更多同地区活动 ↗|查看更多同地區活動 ↗
비슷한 테마 추천 축제|Festivals with a similar theme|似たテーマのおすすめお祭り|相似主题推荐节庆|相似主題推薦節慶
비슷한 분위기의 추천 축제|Festivals with a similar vibe|同じ雰囲気のお祭り|相似氛围推荐节庆|相似氛圍推薦節慶
같은 테마 더 보기 ↗|More with this theme ↗|同じテーマを見る ↗|查看更多同主题活动 ↗|查看更多同主題活動 ↗
📝 사전신청 안내|📝 Booking guide|📝 事前申込案内|📝 预约指南|📝 預約指南
이번 주 검증된 할인·쇼핑 스포트라이트|This week’s verified shopping spotlight|今週の確認済みセール注目情報|本周已核实购物优惠精选|本週已核實購物優惠精選
나들이 장보기부터 백화점·가전·뷰티까지 오늘 바로 이용 가능한 공식 확인 할인입니다.|Verified grocery, department store, electronics and beauty offers available today.|お出かけ前の買い出しから百貨店・家電・ビューティーまで今日使える公式セール。|涵盖生鲜采购、百货、家电与美妆，今日即可使用的官方核实优惠。|涵蓋生鮮採購、百貨、家電與美妝，今日即可使用的官方核實優惠。
전체 할인·쇼핑 보기 ↗|See all shopping offers ↗|すべてのセールを見る ↗|查看全部购物优惠 ↗|查看全部購物優惠 ↗
몰·아울렛|Malls & outlets|モール・アウトレット|商场与奥特莱斯|商場與暢貨中心
마트·창고형|Supermarkets|スーパー・倉庫店|超市与仓储店|超市與倉儲店
백화점|Department stores|百貨店|百货商店|百貨公司
브랜드|Brands|ブランド|品牌|品牌
조건 확인하기 ↗|See conditions ↗|条件を確認 ↗|查看条件 ↗|查看條件 ↗
출발 전 3초 체크리스트|Quick 3-point checklist|出発前3秒チェック|出发前3秒检查清单|出發前3秒檢查清單
공식 공지에서 우천·휴관 변동 확인|Weather or closure updates checked|雨天・休館の変更を公式で確認|核对官方雨天或闭馆调整|核對官方雨天或閉館調整
주차장·대중교통 및 입장 마감 시간 확인|Parking, transit and last entry time|駐車場・交通と最終入場時間|确认停车、交通与最晚入场时间|確認停車、交通與最晚入場時間
사전예약·신분증·할인 증빙 지참 확인|Reservation, ID or discount proof ready|事前予約・身分証・割引証明|携带预约凭证、身份证或优惠证明|攜帶預約憑證、身分證或優惠證明
함께 쓰면 편한 나들이 도구|Handy trip tools|お出かけに便利なツール|实用出游小工具|實用出遊小工具
🧮 여행·나들이 예산 계산기 ↗|🧮 Outing budget calculator ↗|🧮 お出かけ予算計算機 ↗|🧮 出游预算计算器 ↗|🧮 出遊預算計算器 ↗
💸 모임 더치페이 정산 ↗|💸 Group split-bill calculator ↗|💸 割り勘精算ツール ↗|💸 聚会AA制分账 ↗|💸 聚會AA制分帳 ↗
📋 카톡·블로그 요약 복사|📋 Copy summary text|📋 まとめテキストをコピー|📋 复制行程摘要文本|📋 複製行程摘要文字
카톡·블로그에 바로 붙여넣을 코스 요약을 복사했어요!|Copied the course summary to paste into chat or notes!|メッセージやメモに貼れるコース概要をコピーしました！|已复制行程摘要，可直接粘贴分享给同伴！|已複製行程摘要，可直接貼上分享給同伴！
요약 복사에 실패했어요. 비교 링크 공유를 이용해 주세요.|Could not copy summary. Please share the comparison link instead.|コピーできませんでした。比較リンク共有をご利用ください。|无法复制摘要，请使用对比链接分享。|無法複製摘要，請使用對比連結分享。
서울 축제·전시 모음|Seoul Festivals & Exhibitions|ソウルのお祭り・展示|首尔节庆与展览精选|首爾節慶與展覽精選
경기·인천 축제·전시 모음|Gyeonggi & Incheon Festivals|京畿・仁川のお祭り・展示|京畿与仁川节庆活动精选|京畿與仁川節慶活動精選
강원 축제·전시 모음|Gangwon Festivals & Winter Events|江原のお祭り・冬のイベント|江原道冬日与节庆精选|江原道冬日與節慶精選
대전·세종·충청 축제·전시 모음|Chungcheong Festivals & Exhibitions|大田・世宗・忠清のお祭り|大田·世宗·忠清节庆与展览|大田·世宗·忠清節慶與展覽
광주·전라 축제·전시 모음|Jeolla Festivals & Exhibitions|光州・全羅のお祭り・展示|光州与全罗节庆活动精选|光州與全羅節慶活動精選
부산·대구·울산·경상 축제·전시 모음|Gyeongsang & Busan Festivals|釜山・大邱・慶尚のお祭り|釜山·大邱·庆尚节庆精选|釜山·大邱·慶尚節慶精選
제주 축제·전시 모음|Jeju Festivals & Exhibitions|済州のお祭り・展示案内|济州节庆与展览精选|濟州節慶與展覽精選
전국 실내 전시·박물관·과학관 모음|Indoor Museums & Exhibitions|全国 屋内展示・博物館特集|韩国室内展览·博物馆·科学馆精选|韓國室內展覽·博物館·科學館精選
입장 무료 전국 축제·전시 모음|Free Admission Festivals|入場無料のお祭り・展示特集|免费入场韩国节庆与展览精选|免費入場韓國節慶與展覽精選
2026–2027 겨울·빛축제·연말 특집|Winter Lights & Year-End Special|2026–2027 冬・ライト・年末特集|2026–2027 韩国冬季灯会与岁末特辑|2026–2027 韓國冬季燈會與歲末特輯
기본 입장 무료|Free admission|基本入場無料|免费入场|免費入場
최근 확인일|Last reviewed|最終確認日|最近核实日期|最近核實日期
🔍 추천 3곳 한눈에 비교하기 ↗|🔍 Compare top 3 picks ↗|🔍 おすすめ3選を比較する ↗|🔍 一键对比前3项推荐 ↗|🔍 一鍵對比前3項推薦 ↗
📅 달력으로 일정 보기 ↗|📅 Browse on calendar ↗|📅 カレンダーで見る ↗|📅 在日历中查看日程 ↗|📅 在行事曆中查看日程 ↗
🏛 실내 전시·박물관|🏛 Indoor exhibitions|🏛 屋内展示・博物館|🏛 室内展览·博物馆|🏛 室內展覽·博物館
💸 입장 무료|💸 Free admission|💸 入場無料|💸 免费入场|💸 免費入場
❄️ 겨울·연말 특집|❄️ Winter & year-end|❄️ 冬・年末特集|❄️ 冬季·岁末特辑|❄️ 冬季·歲末特輯
🎄 크리스마스|🎄 Christmas guide|🎄 クリスマス|🎄 圣诞节特辑|🎄 聖誕節特輯
🛍 함께 확인하면 좋은 이번 주 할인|🛍 Verified shopping deals nearby|🛍 あわせてチェックしたい今週のセール|🛍 同区域及线上本周精选优惠|🛍 同區域及線上本週精選優惠
🛍 다녀오는 길에 함께 챙길 할인|🛍 Verified shopping deals for your trip|🛍 お出かけ前後に使える公式セール|🛍 出游顺路可享的核实优惠|🛍 出遊順路可享的核實優惠
나들이 전후 챙길 해당 권역·온라인 공식 확인 할인입니다.|Verified regional and online offers to pair with your outing.|お出かけ前後に役立つ地域・オンラインの公式確認済みセールです。|适合出游前后顺便查看的该地区及线上官方优惠。|適合出遊前後順便查看的該地區及線上官方優惠。
해당 권역이나 온라인에서 지금 바로 이용할 수 있는 공식 확인 할인 행사입니다.|Verified regional or nationwide online deals available right now.|対象地域やオンラインで今すぐ使える公式確認済みセールです。|该地区或全国线上目前即可使用的官方核实优惠。|該地區或全國線上目前即可使用的官方核實優惠。
지역·테마 모음|Regional & theme collections|地域・テーマ特集|地区与主题合集|地區與主題合集
권역·테마별 전용 안내|Browse by region & season|地域別・テーマ別専用ページ|按地区与季节专题浏览|按地區與季節專題瀏覽
검색하기 좋은 지역별·테마별 맞춤 페이지로 바로 이동하세요.|Jump directly to dedicated regional guides and winter or indoor picks.|検索しやすい地域別ガイドや屋内・冬特集ページへすぐ移動できます。|直达各地区与室内、免费、冬日专题页面。|直達各地區與室內、免費、冬日專題頁面。
실내 전시·박물관 모음|Indoor exhibitions|屋内展示・博物館特集|室内展览·博物馆合集|室內展覽·博物館合集
무료 축제 모음|Free festivals|無料お祭り特集|免费节庆合集|免費節慶合集
겨울·연말 축제 특집|Winter & year-end guide|冬・年末お祭り特集|冬季·岁末节庆特辑|冬季·歲末節慶特輯
자주 묻는 질문|Frequently asked questions|よくある質問|常见问题|常見問題
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
  let result=text.replace(/종료 포함 · 보관 일정 (\d+)건/g,(_,count)=>[
    'Saved events including ended: '+count,'終了分を含む保存済み '+count+'件','已收藏（含已结束）：'+count+'项','已收藏（含已結束）：'+count+'項'
  ][columns[locale]]).replace(/수록 일정 (\d+)건/g,(_,count)=>[
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
