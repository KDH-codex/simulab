import {UI_TRANSLATIONS,t} from './festival-i18n.js';
const rows=`
할인·쇼핑|Shopping offers|セール情報|优惠购物|優惠購物
공지 기간 중|Offer period|キャンペーン期間中|活动期间|活動期間
재확인 필요|Needs recheck|要再確認|需要复核|需要複核
취소 안내|Cancelled|中止の案内|已取消|已取消
오늘 종료 예정|Ending today|本日終了予定|预计今日结束|預計今日結束
품목|Category|商品分野|品类|品類
회원 혜택 안내만|Membership offers|会員特典のみ|仅会员优惠|僅會員優惠
카드 혜택 안내만|Card offers|カード特典のみ|仅银行卡优惠|僅銀行卡優惠
이번 주,|This week,|今週、|本周，|本週，
알뜰하게 즐겨요.|find a good offer.|お得を見つけよう。|发现好优惠。|發現好優惠。
이번 주 장보기부터 브랜드 세일까지, 기간과 적용 조건을 확인하세요.|From weekly groceries to brand promotions: check dates, stores and conditions.|毎週の買い物からブランドセールまで。期間・店舗・条件を確認。|从每周采购到品牌促销，确认日期、门店及适用条件。|從每週採購到品牌促銷，確認日期、門市及適用條件。
몰·아울렛|Malls & outlets|モール・アウトレット|商场与奥特莱斯|商場與暢貨中心
마트·창고형|Supermarkets|スーパー・倉庫店|超市与仓储店|超市與倉儲店
백화점|Department stores|百貨店|百货商店|百貨公司
브랜드|Brands|ブランド|品牌|品牌
모든 품목|All categories|全商品分野|全部品类|全部品類
식품·생활|Groceries & daily goods|食品・日用品|食品与日用品|食品與日用品
패션·스포츠|Fashion & sports|ファッション・スポーツ|时尚与运动|時尚與運動
뷰티|Beauty|ビューティー|美妆|美妝
리빙·가구|Home & furniture|生活・家具|家居与家具|家居與家具
가전·디지털|Electronics|家電・デジタル|家电与数码|家電與數位
주방용품|Kitchen|キッチン|厨房用品|廚房用品
키즈|Kids|キッズ|儿童|兒童
모든 지역|All regions|全地域|全部地区|全部地區
전국·온라인|Nationwide / online|全国・オンライン|全国／线上|全國／線上
경기·인천|Gyeonggi & Incheon|京畿・仁川|京畿与仁川|京畿與仁川
모든 채널|All channels|全チャネル|全部渠道|全部管道
온라인|Online|オンライン|线上|線上
매장|In store|店舗|门店|門市
앱|App|アプリ|应用|應用程式
모든 브랜드|All brands|全ブランド|全部品牌|全部品牌
판매처·브랜드 검색|Search retailer or brand|販売店・ブランド検索|搜索商家或品牌|搜尋商家或品牌
브랜드·행사·지점을 검색하세요|Search brands, offers or stores|ブランド・セール・店舗を検索|搜索品牌、活动或门店|搜尋品牌、活動或門市
진행·예정 할인|Current & upcoming offers|開催中・開催予定のセール|当前与即将开始的优惠|目前與即將開始的優惠
오늘 종료|Ending today|本日終了|今日结束|今日結束
지난 행사·재확인|Past / needs recheck|過去・要再確認|已结束／待复核|已結束／待複核
종료 임박순|Ending soonest|終了が近い順|按结束日期|依結束日期
보관한 할인|Saved offers|保存したセール|已收藏优惠|已收藏優惠
검토한 할인 행사|Reviewed shopping offers|確認したセール|已核实优惠活动|已核實優惠活動
조건에 맞는 할인 행사가 없어요|No matching reviewed offers|条件に合う確認済みセールがありません|暂无符合条件的已核实优惠|暫無符合條件的已核實優惠
다른 조건을 선택하거나 아래 공식 출처에서 최신 행사를 확인하세요.|Try other filters or visit the official sources below.|別の条件を選ぶか、下の公式情報をご確認ください。|请更换筛选条件，或查看下方官方来源。|請更換篩選條件，或查看下方官方來源。
확인한 목록 기준이며, 모든 업체의 세일을 뜻하지 않습니다.|Counts cover our reviewed listings, not every retailer’s offers.|件数は確認済み掲載情報です。全店のセール数ではありません。|数量仅代表本站核实收录，并非全部商家的优惠。|數量僅代表本站核實收錄，並非全部商家的優惠。
특정 지점|Selected store|特定店舗|指定门店|指定門市
참여 점포 확인|Check participating stores|対象店舗を確認|确认参与门店|確認參與門市
회원·가입 조건|Membership / sign-up|会員・登録条件|会员／注册条件|會員／註冊條件
카드 조건|Card conditions|カード条件|银行卡条件|銀行卡條件
품목·수량 조건|Item / quantity conditions|商品・数量条件|商品／数量条件|商品／數量條件
조건 확인하기|See conditions|条件を確認|查看条件|查看條件
할인 상세|Offer details|セール詳細|优惠详情|優惠詳情
혜택과 이용 조건|Offer & conditions|特典と利用条件|优惠与适用条件|優惠與適用條件
기간·적용 범위|Dates & scope|期間・対象範囲|日期与适用范围|日期與適用範圍
판매처|Retailer|販売元|商家|商家
적용 지점|Applicable stores|対象店舗|适用门店|適用門市
이용 채널|Channels|利用チャネル|适用渠道|適用管道
원문 확인|Source checked|原文確認|原文核实|原文核實
공식 쇼핑 안내 ↗|Official offer ↗|公式セール案内 ↗|官方优惠公告 ↗|官方優惠公告 ↗
공식 출처 모아보기|Official shopping sources|公式ショッピング情報|官方购物来源|官方購物來源
검토 중인 출처|Sources under review|確認中の情報元|待核实来源|待核實來源
행사 상세 추가 확인|Offer details being checked|セール詳細を確認中|活动详情待核实|活動詳情待核實
공식 홈페이지 ↗|Official website ↗|公式サイト ↗|官方网站 ↗|官方網站 ↗
세부 조건은 한국어 원문과 공식 안내를 확인하세요.|Detailed terms remain in Korean. Confirm them on the official site.|詳しい条件は韓国語原文と公式案内をご確認ください。|详细条件请查看韩文原文与官方公告。|詳細條件請查看韓文原文與官方公告。
할인율은 더하지 않아요|Discount rates are not added|割引率は単純合算しません|折扣率不简单相加|折扣率不簡單相加
할인·쿠폰·적립은 적용 순서와 대상이 다릅니다. 결제 전 공식 조건을 확인하세요.|Discounts, coupons and points have different rules. Check the official terms before paying.|割引・クーポン・ポイントは順序と対象が異なります。支払い前に公式条件をご確認ください。|折扣、优惠券与积分的适用顺序及对象不同，付款前请确认官方条件。|折扣、優惠券與積分的適用順序及對象不同，付款前請確認官方條件。
기간은 한국시간, 금액은 원(KRW) 기준입니다. 재고·쿠폰 잔여량은 실시간 정보가 아닙니다.|Dates use Korean time and amounts are in KRW. Stock and coupon availability are not live.|日時は韓国時間、料金はウォンです。在庫・クーポン残数はリアルタイム情報ではありません。|日期使用韩国时间，金额为韩元。库存与优惠券余量非实时信息。|日期使用韓國時間，金額為韓元。庫存與優惠券餘量非即時資訊。
최근 원문 확인 후 48시간이 지난 행사는 재확인이 필요합니다.|Offers need rechecking 48 hours after the last source review.|原文確認から48時間を過ぎたセールは再確認が必要です。|距上次原文核实超过48小时的活动需复核。|距上次原文核實超過48小時的活動需複核。
♡ 할인 보관|♡ Save offer|♡ セール保存|♡ 收藏优惠|♡ 收藏優惠
할인 링크를 복사했어요.|Offer link copied.|セールリンクをコピーしました。|优惠链接已复制。|優惠連結已複製。
할인 보관함에 저장했어요.|Offer saved.|セールを保存しました。|优惠已收藏。|優惠已收藏。
할인 보관함에서 꺼냈어요.|Offer removed.|保存を解除しました。|优惠已取消收藏。|優惠已取消收藏。
이 화면에서만 저장돼요. 브라우저 저장 공간을 사용할 수 없습니다.|Saved for this screen only; browser storage is unavailable.|この画面のみ保存。ブラウザーの保存領域を使用できません。|仅在当前页面保存，浏览器存储不可用。|僅在目前頁面儲存，瀏覽器儲存空間無法使用。
할인 보관함|Saved shopping offers|セール保存一覧|优惠收藏夹|優惠收藏夾
축제 보관함 ↗|Saved festivals ↗|保存したお祭り ↗|节庆收藏夹 ↗|節慶收藏夾 ↗
공유|Share|共有|分享|分享
제공처 안내가 우선합니다. 판매·예약·쿠폰 발급을 대행하지 않습니다.|Official terms take priority. We do not sell, book or issue coupons.|提供元の案内を優先します。販売・予約・クーポン発行の代行ではありません。|以官方公告为准，本站不代售、预约或发放优惠券。|以官方公告為準，本站不代售、預約或發放優惠券。
상품 사진이 아닌 안내 카드입니다.|Guide card, not a product photograph.|商品写真ではなく案内カードです。|此为信息卡片，非商品照片。|此為資訊卡片，非商品照片。
채널·점포별 조건 확인|Check channel and store terms|チャネル・店舗条件を確認|确认渠道与门店条件|確認管道與門市條件
`.trim().split('\n');
Object.assign(UI_TRANSLATIONS,Object.fromEntries(rows.map(row=>{const [key,...values]=row.split('|');return [key,values];})));
export const shopT=t;
