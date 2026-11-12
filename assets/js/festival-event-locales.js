// Editorial guide names, not organizer-certified translations. Keep Korean names for maps/sources.
// id | summary topic | English | Japanese | Simplified Chinese | Traditional Chinese
const rows = `
seosan-chrysanthemum-2026|flowers|26th Seosan Chrysanthemum Festival|第26回 瑞山菊祭り|第26届瑞山菊花节|第26屆瑞山菊花節
yangsan-chrysanthemum-2026|flowers|2026 Yangsan Chrysanthemum Festival|2026 梁山菊祭り|2026 梁山菊花节|2026 梁山菊花節
seoul-drone-2026|drone|Seoul International Drone Racing World Cup|ソウル国際ドローンレースW杯|首尔国际无人机竞速世界杯|首爾國際無人機競速世界盃
seoul-bbq-2026|food|Seoul BBQ Festival|ソウルBBQフェスティバル|首尔烧烤节|首爾烤肉節
namsan-night-2026|night|Namsan Night Festival|南山ナイトフェスティバル|南山夜间节|南山夜間節
hangang-forest-2026|family|Hangang Forest Adventure|漢江フォレストアドベンチャー|汉江森林探险|漢江森林探險
seoul-market-2026|market|Seoul Market Fair|ソウルマーケットフェア|首尔市集博览会|首爾市集博覽會
yongsan-harvest-2026|family|Yongsan Family Park Harvest Day|龍山家族公園 秋の収穫祭|龙山家庭公园秋收节|龍山家庭公園秋收節
botanic-exhibition-2026|art|Seoul Botanic Park: A Gentle Balance|ソウル植物園「やさしいバランス」|首尔植物园：温柔的平衡|首爾植物園：溫柔的平衡
yeoju-ogok-2026|harvest|Yeoju Ogok Naru Festival|驪州五穀ナル祭り|骊州五谷渡口节|驪州五穀渡口節
iksan-chrysanthemum-2026|flowers|Iksan Ten Million Chrysanthemums Festival|益山千万本の菊祭り|益山千万朵菊花节|益山千萬朵菊花節
goesan-kimjang-2026|kimchi|Goesan Kimchi-Making Festival|槐山キムジャン祭り|槐山腌泡菜节|槐山醃泡菜節
busan-fireworks-2026|fireworks|21st Busan Fireworks Festival|第21回釜山花火祭り|第21届釜山烟花节|第21屆釜山煙火節
seogwipo-chilsimni-2026|culture|32nd Seogwipo Chilsimni Festival|第32回西帰浦七十里祭り|第32届西归浦七十里节|第32屆西歸浦七十里節
jeju-olle-2026|walk|Jeju Olle Walking Festival|済州オルレウォーキングフェスティバル|济州偶来徒步节|濟州偶來健行節
mcst-13344-2026|culture|Busan Folk Arts Festival|釜山総合民俗芸術祭|釜山综合民俗艺术节|釜山綜合民俗藝術節
mcst-12777-2026|art|Busan Global Webtoon Festival|釜山グローバルウェブトゥーンフェスティバル|釜山国际网络漫画节|釜山國際網路漫畫節
mcst-13337-2026|food|Tteokbokki Festival|トッポッキフェスティバル|辣炒年糕节|辣炒年糕節
mcst-12851-2026|flowers|Dream Park Chrysanthemum Festival|ドリームパーク菊祭り|梦想公园菊花节|夢想公園菊花節
mcst-13561-2026|books|Daejeon Seo-gu Book Festival|大田西区ブックフェスティバル|大田西区读书节|大田西區讀書節
mcst-13551-2026|culture|Daedeok Daecheong Lake Wave Festival|大徳大清湖ウェーブフェスティバル|大德大清湖波浪节|大德大清湖波浪節
mcst-13542-2026|heritage|Ulsan Jung-gu Heritage Night|蔚山中区国家遺産ナイト|蔚山中区国家遗产夜游|蔚山中區國家遺產夜遊
mcst-13566-2026|culture|Korea–US Friendship Cultural Festival|韓米親善文化フェスティバル|韩美友好文化节|韓美友好文化節
mcst-13334-2026|flowers|Yeoncheon Chrysanthemum Festival|漣川菊祭り|涟川菊花节|漣川菊花節
mcst-12899-2026|food|Wonju Dumpling Festival|原州マンドゥ祭り|原州饺子节|原州餃子節
mcst-11752-2026|coffee|Gangneung Coffee Festival|江陵コーヒーフェスティバル|江陵咖啡节|江陵咖啡節
mcst-13388-2026|harvest|Yanggu Punch Bowl Apple & Siraegi Festival|楊口パンチボウル りんご・干し大根葉祭り|杨口盆地苹果与干萝卜叶节|楊口盆地蘋果與乾蘿蔔葉節
mcst-13539-2026|media|Cheongju Heritage Media Art|清州 国家遺産メディアアート|清州国家遗产媒体艺术|清州國家遺產媒體藝術
mcst-11777-2026|harvest|Boeun Jujube Festival|報恩なつめ祭り|报恩红枣节|報恩紅棗節
mcst-11775-2026|food|Yesan Market Samguk Festival|礼山市場サムグク祭り|礼山集市三菊节|禮山集市三菊節
mcst-13555-2026|flowers|Buyeo Chrysanthemum Festival|扶余菊祭り|扶余菊花节|扶餘菊花節
mcst-12626-2026|eco|Gimje Saerobomi Recycling Festival|金堤セロボミ資源循環祭り|金堤资源循环节|金堤資源循環節
mcst-13512-2026|flowers|Hwasun Dolmen Autumn Flower Festival|和順支石墓 秋の花祭り|和顺支石墓秋花节|和順支石墓秋花節
mcst-11963-2026|heritage|Suncheon Naganeupseong Folk Culture Festival|順天楽安邑城民俗文化祭り|顺天乐安邑城民俗文化节|順天樂安邑城民俗文化節
mcst-11911-2026|kimchi|Gwangju Kimchi Festival|光州キムチ祭り|光州泡菜节|光州泡菜節
mcst-13374-2026|fireworks|Yeosu Night Sea Fireworks Festival|麗水夜の海 花火祭り|丽水夜海烟花节|麗水夜海煙火節
mcst-12854-2026|food|Gimcheon Gimbap Festival|金泉キンパ祭り|金泉紫菜包饭节|金泉紫菜包飯節
mcst-12275-2026|family|Yecheon Archery Festival|醴泉弓祭り|醴泉射箭节|醴泉射箭節
mcst-12036-2026|food|Gumi Ramyeon Festival|亀尾ラーメン祭り|龟尾方便面节|龜尾泡麵節
mcst-11940-2026|culture|MAMF Cultural Diversity Festival|MAMF文化多様性フェスティバル|MAMF多元文化节|MAMF多元文化節
mcst-11909-2026|airshow|Sacheon Air Show|泗川エアショー|泗川航空展|泗川航空展
mcst-13559-2026|family|Jeju Horse Festival|済州馬祭り|济州马节|濟州馬節
mcst-12784-2026|books|Jeju Reading Festival|済州読書フェスティバル|济州读书节|濟州讀書節
sejong-hangeul-family-2026|family|Hangeul Visits Sejong and Nam June Paik|世宗とナムジュン：ハングル美術館体験|韩文字走进世宗与白南准的美术馆|韓文字走進世宗與白南準的美術館
mcst-13422-2026|garden|Seoul International Garden Show|ソウル国際庭園博覧会|首尔国际庭园博览会|首爾國際庭園博覽會
mcst-13560-2026|heritage|Janghang 1931: A Night Journey|長項1931 夜の紀行|长项1931夜之旅|長項1931夜之旅
mcst-13545-2026|books|Dongducheon Book Culture Festival|東豆川ブックカルチャーフェスティバル|东豆川图书文化节|東豆川圖書文化節
mcst-13528-2026|culture|Seongbuk Dada Festa|城北ダダフェスタ|城北多多街头文化节|城北多多街頭文化節
mcst-13510-2026|garden|Semiwon Water Lily Festival|洗美苑スイレン文化祭|洗美苑睡莲文化节|洗美苑睡蓮文化節
mcst-13333-2026|harvest|Yesan Apple Festival|礼山りんご祭り|礼山苹果节|禮山蘋果節
mcst-12731-2026|performance|Mato Arts Festival: Broadway in Anjeong-ri|マト芸術祭：安亭里のブロードウェイ|马土艺术节：安亭里的百老汇|馬土藝術節：安亭里的百老匯
mcst-13554-2026|drone|Gyeonggi–Yangju Dronebot Festival|京畿・楊州ドローンボットフェスティバル|京畿杨州无人机机器人节|京畿楊州無人機機器人節
mcst-13552-2026|heritage|Mokpo Heritage Night|木浦国家遺産ナイト|木浦国家遗产夜游|木浦國家遺產夜遊
mcst-13533-2026|food|Miryang Spicy Food Festival|密陽激辛フェスティバル|密阳辣味节|密陽辣味節
mcst-13366-2026|coffee|Seongnam-dong Coffee Festival, Ulsan|蔚山・城南洞コーヒーフェスティバル|蔚山城南洞咖啡节|蔚山城南洞咖啡節
mcst-12919-2026|flowers|Yuseong Chrysanthemum Festival|儒城菊祭り|儒城菊花节|儒城菊花節
mcst-12641-2026|garden|Pocheon Hantangang Garden Festa|抱川漢灘江ガーデンフェスタ|抱川汉滩江庭园节|抱川漢灘江庭園節
nowon-moonlight-2026|night|Nowon Moonlight Walk|蘆原 月明かり散歩|芦原月光漫步|蘆原月光漫步
unjeong-light-garden-2026|night|Unjeong Lake Park Light Garden|雲井湖公園 光の庭園|云井湖公园灯光庭园|雲井湖公園燈光庭園
incheon-sky-festival-2026|performance|Incheon Airport SKY FESTIVAL|仁川空港SKY FESTIVAL|仁川机场SKY FESTIVAL|仁川機場SKY FESTIVAL
pyeongchang-kimjang-2026|kimchi|Pyeongchang Highland Kimchi Festival|平昌高冷地キムジャン祭り|平昌高冷地腌泡菜节|平昌高冷地醃泡菜節
daejeon-wine-expo-2026|wine|Daejeon International Wine EXPO: Public Days|大田国際ワインEXPO 一般公開|大田国际葡萄酒博览会公众日|大田國際葡萄酒博覽會公眾日
hampyeong-chrysanthemum-2026|flowers|Hampyeong Grand Chrysanthemum Festival|咸平 大韓民国菊香大典|咸平大韩民国菊香大典|咸平大韓民國菊香大典
masan-chrysanthemum-2026|flowers|26th Masan Gagopa Chrysanthemum Festival|第26回馬山カゴパ菊祭り|第26届马山加古坡菊花节|第26屆馬山加古坡菊花節
cheongsong-apple-2026|harvest|20th Cheongsong Apple Festival|第20回青松りんご祭り|第20届青松苹果节|第20屆青松蘋果節
gimhae-buncheong-2026|craft|31st Gimhae Buncheong Ceramics Festival|第31回金海粉青陶磁器祭り|第31届金海粉青陶瓷节|第31屆金海粉青陶瓷節
jeju-garden-expo-2026|garden|Korea Jeju Garden Culture Expo|大韓民国済州庭園文化博覧会|韩国济州庭园文化博览会|韓國濟州庭園文化博覽會
iksan-treasure-2026|family|Iksan Treasure Hunt: Find the Gold Bar|益山宝探し：金塊を探せ|益山寻宝节：寻找金条|益山尋寶節：尋找金條
yeoju-sanbuk-kimjang-2026|kimchi|Sanbuk Pumsil & AI Kimchi Culture Festival|山北プムシル・AIキムジャン文化祭り|山北品实与AI腌泡菜文化节|山北品實與AI醃泡菜文化節
goheung-yuja-2026|harvest|Goheung Yuja Festival|高興ゆず祭り|高兴柚子节|高興柚子節
daejeon-noodle-2026|food|Noodle Daejeon Festival|ヌードル大田フェスティバル|大田面条节|大田麵條節
pohang-fire-light-2026|fireworks|Pohang International Fire & Light Festival|浦項国際花火祭り|浦项国际烟花节|浦項國際煙火節
sunchang-tteokbokki-2026|food|Sunchang KOREA Tteokbokki Festa|淳昌KOREAトッポッキフェスタ|淳昌韩国辣炒年糕节|淳昌韓國辣炒年糕節
seoul-souvenir-fair-2026|market|Korea Tourism Souvenir Fair|大韓民国観光記念品博覧会|韩国旅游纪念品博览会|韓國旅遊紀念品博覽會
incheon-art-show-2026|art|Incheon Art Show|仁川アートショー|仁川艺术博览会|仁川藝術博覽會
suseong-biennale-2026|art|Suseong International Biennale|寿城国際ビエンナーレ|寿城国际双年展|壽城國際雙年展
ulsan-startup-festa-2026|expo|Ulsan Startup Festa|蔚山スタートアップフェスタ|蔚山创业节|蔚山創業節
gwangju-biennale-2026|art|Gwangju Biennale|光州ビエンナーレ|光州双年展|光州雙年展
uljin-jukbyeon-seafood-2026|seafood|Jukbyeon Port Seafood Festival|竹辺港水産物祭り|竹边港海鲜节|竹邊港海鮮節
beautysum-suwon-2026|expo|Beauty Sum Suwon|ビューティーサム水原|水原美妆展|水原美妝展
andong-independence-fair-2026|heritage|June 10 Independence Movement Centennial Fair|6・10万歳運動100周年独立フェア|六一〇万岁运动百年独立展|六一〇萬歲運動百年獨立展
busan-traditional-markets-2026|market|Yeongnam–Honam Traditional Market Fair|嶺南・湖南伝統市場博覧会|岭南湖南传统市场博览会|嶺南湖南傳統市場博覽會
jeju-pet-fair-2026|pets|Jeju Pet Culture & Industry Fair|済州ペット文化産業フェア|济州宠物文化产业展|濟州寵物文化產業展
tongyeong-port-village-2026|seafood|Eobu Market × Port Village Tongyeong|漁師市場×ポートビレッジ統営|渔夫集市×统营港口村|漁夫市集×統營港口村
busan-illustration-fair-2026|art|Busan Illustration Fair V.7|釜山イラストレーションフェアV.7|釜山插画展V.7|釜山插畫展V.7
gongju-hasuk-festival-2026|culture|Gongju Boarding House No. 1 Festival|公州 下宿洞1番地祭り|公州寄宿街一号节|公州寄宿街一號節
jinju-agrex-experience-2026|family|Jinju International Agri-Food Expo: Activities|晋州国際農食品博覧会 農業体験館|晋州国际农食品博览会体验馆|晉州國際農食品博覽會體驗館
busan-burak-festa-2026|culture|Busan Burak Festa|釜山ブラクフェスタ|釜山部落节|釜山部落節
jeongdok-family-book-festival-2026|books|Jeongdok Family Book Festival|正読図書館 家族ブックフェスティバル|正读图书馆全家读书节|正讀圖書館全家讀書節
anseong-toktok-festival-2026|family|Anseong Toktok Dalkom Festival|安城トクトクダルコムフェスティバル|安城甜蜜欢乐节|安城甜蜜歡樂節
gimpo-marines-festival-2026|military|Gimpo Marine Corps Culture Festival|金浦海兵隊文化祭り|金浦海军陆战队文化节|金浦海軍陸戰隊文化節
gyeongju-peace-ondam-2026|culture|Gyeongju Peace Ondam|慶州ピース・オンダム|庆州和平温谈|慶州和平溫談
ansan-science-festival-2026|science|Ansan ASV Science Festival|安山ASV科学祭り|安山ASV科学节|安山ASV科學節
masan-outdoor-library-2026|books|Masan Outdoor Library|馬山野外図書館|马山户外图书馆|馬山戶外圖書館
seoul-materialism-exhibition-2026|art|MATERIALISM BIG Exhibition|MATERIALISM BIG展|MATERIALISM BIG展览|MATERIALISM BIG展覽
gwangju-yangdong-hongtak-2026|food|Yangdong Hongtak Festa|良洞ホンタクフェスタ|良洞洪浊美食节|良洞洪濁美食節
seoul-k-sool-festival-2026|wine|Korea Sool Festival|大韓民国ウリスル大祝祭|韩国传统酒文化节|韓國傳統酒文化節
yeongju-apple-seoul-2026|harvest|Yeongju Apple Festival: Seoul Edition|栄州りんご祭り ソウル会場|荣州苹果节首尔场|榮州蘋果節首爾場
pocheon-petstar-2026|pets|Pocheon Pet Star|抱川ペットスター|抱川宠物之星|抱川寵物之星
busan-run-festival-2026|walk|Run Busan Running Festival|走れ釜山 ランニングフェスティバル|奔跑釜山跑步节|奔跑釜山跑步節
sejong-mind-walk-2026|walk|Sejong Mental Wellness Walk|世宗 心の健康ウォーキング|世宗心理健康徒步活动|世宗心理健康健行活動
asan-ginkgo-art-street-2026|performance|Asan Ginkgo Road Street Arts Festival|牙山イチョウ並木ストリートアート祭り|牙山银杏路街头艺术节|牙山銀杏路街頭藝術節
changwon-dotseom-picnic-2026|family|Lekki’s Mysterious Picnic on Dotseom|トッソム レッキの不思議なピクニック|猪岛莱基的神秘野餐|豬島萊基的神祕野餐
seoul-quad-flames-2026|performance|QUAD: Incendies|QUAD「炎 アンサンディ」|QUAD话剧《烈火》|QUAD話劇《烈火》
busan-folk-arts-festival-2026|culture|Busan Folk Arts Festival|釜山総合民俗芸術祭|釜山综合民俗艺术节|釜山綜合民俗藝術節
daejeon-energy-walk-2026|eco|Daejeon Citizens’ Energy Walk|大田 市民エネルギーウォーキング|大田市民能源徒步节|大田市民能源健行節
busan-game-culture-festival-2026|games|Busan Game Culture Festival|釜山ゲーム文化祭り|釜山游戏文化节|釜山遊戲文化節
incheon-design-fair-2026|art|Incheon International Design Fair|仁川国際デザインフェア|仁川国际设计展|仁川國際設計展
muan-yd-festival-2026|culture|Muan YD Festival|務安YDフェスティバル|务安YD青年节|務安YD青年節
namhae-runtrip-2026|walk|Runtrip Namhae|ラントリップ南海|南海跑步旅行|南海跑步旅行
seoul-boardgame-festa-2026|games|Board Game Festa: Season 2|ボードゲームフェスタ シーズン2|桌游节第二季|桌遊節第二季
suwon-rice-dessert-festa-2026|food|Gyeonggi Rice Dessert Festa|京畿米デザートフェスタ|京畿大米甜点节|京畿稻米甜點節
gangneung-dandan-festival-2026|performance|Gangneung Dandandan Festival|江陵ダンダンダンフェスティバル|江陵端端端民俗艺术节|江陵端端端民俗藝術節
ulsan-culture-expo-2026|culture|Ulsan Culture Expo|蔚山文化博覧会|蔚山文化博览会|蔚山文化博覽會
busan-christmas-village-2026|market|Christmas Village Busan|クリスマスビレッジ釜山|釜山圣诞村|釜山聖誕村
yeosu-jinnamgwan-media-2026|media|Yeosu Jinnamgwan Media Art|麗水鎮南館メディアアート|丽水镇南馆媒体艺术|麗水鎮南館媒體藝術
yangjae-picturebook-2026|books|Yangjae Library: Picture Books by the Stream|良才図書館 川辺の絵本|良才图书馆溪畔绘本活动|良才圖書館溪畔繪本活動
cheonan-maple-healing-2026|garden|Independence Hall Autumn Forest Healing Festival|独立記念館 紅葉の森ヒーリング祭り|独立纪念馆枫林疗愈节|獨立紀念館楓林療癒節
hongseong-namdang-shrimp-2026|seafood|Hongseong Namdang Port Prawn Festival|洪城南塘港 大エビ祭り|洪城南塘港大虾节|洪城南塘港大蝦節
hwasun-unju-festival-2026|heritage|Hwasun Unju Culture Festival|和順雲住文化祭り|和顺云住文化节|和順雲住文化節
yesan-good-brothers-2026|heritage|Yesan Good Brothers Festival|礼山 義兄弟祭り|礼山好兄弟节|禮山好兄弟節
yeongam-wolchulsan-chrysanthemum-2026|flowers|Wolchulsan Chrysanthemum Festival|月出山菊祭り|月出山菊花节|月出山菊花節
pohang-marines-festival-2026|military|Pohang Marine Corps Culture Festival|浦項海兵隊文化祭り|浦项海军陆战队文化节|浦項海軍陸戰隊文化節
jeju-moseulpo-yellowtail-2026|seafood|Moseulpo Yellowtail Festival|最南端ブリ祭り|最南端鰤鱼节|最南端鰤魚節
jinan-kimchi-bossam-2026|kimchi|Jinan Highland Kimchi & Bossam Festival|鎮安高原キムチ・ポッサム祭り|镇安高原泡菜包肉节|鎮安高原泡菜包肉節
paju-jangdan-bean-2026|harvest|Paju Jangdan Soybean Festival|坡州長湍豆祭り|坡州长湍豆节|坡州長湍豆節
goyang-k-rice-festa-2026|food|K-Rice Festa, Goyang|高陽Kライスフェスタ|高阳K大米节|高陽K稻米節
seoul-design-festival-2026|art|Seoul Design Festival|ソウルデザインフェスティバル|首尔设计节|首爾設計節
incheon-robotex-2026|science|Robotex World Championship, Incheon|仁川ロボテックス世界大会|仁川Robotex机器人世界大赛|仁川Robotex機器人世界大賽
dangjin-chrysanthemum-2026|flowers|Dangjin Chrysanthemum Exhibition|唐津菊展示会|唐津菊花展|唐津菊花展
gyeonggi-dmz-open-2026|culture|DMZ OPEN Festival|DMZ OPENフェスティバル|DMZ OPEN节|DMZ OPEN節
jeonju-jeolla-governor-2026|heritage|Jeonju Jeolla Gamyeong: Governor Experience|全州 全羅監営 観察使体験|全州全罗监营观察使体验|全州全羅監營觀察使體驗
incheon-jemulpo-wave-market-2026|market|Jemulpo Wave: Fourth Market|済物浦ウェーブ 第4回マーケット|济物浦浪潮第四期市集|濟物浦浪潮第四期市集
gyeongbuk-apple-promotion-seoul-2026|harvest|Gyeongbuk Apple Promotion, Seoul|慶北りんごPR ソウル会場|庆北苹果首尔推广活动|慶北蘋果首爾推廣活動
gwanak-sinwon-night-market-2026|market|Sinwon Market Night Market|新源市場ナイトマーケット|新源市场夜市|新源市場夜市
yeongdeungpo-dungdung-2026|art|Yeongdeungpo Dungdung Festival|永登浦ドゥンドゥン祭り|永登浦浮岛艺术节|永登浦浮島藝術節
maeheon-garden-concert-2026|performance|Maeheon Garden Concert|梅軒庭園コンサート|梅轩庭园音乐会|梅軒庭園音樂會
yeouido-autumn-river-concert-2026|performance|Autumn Night Hangang Concert|秋の夜の漢江コンサート|汉江秋夜音乐会|漢江秋夜音樂會
seoul-cafe-show-2026|coffee|Seoul Cafe Show: Public Days|ソウルカフェショー 一般公開|首尔咖啡展公众日|首爾咖啡展公眾日
seoul-independent-film-festival-2026|film|Seoul Independent Film Festival|ソウル独立映画祭|首尔独立电影节|首爾獨立電影節
yangpyeong-migam-market-2026|market|Yangpyeong Migam Handmade Flea Market|楊平ミガム ハンドメイド市場|杨平美感手作市集|楊平美感手作市集
gwacheon-grandpark-autumn-2026|family|Seoul Grand Park Autumn Festival|ソウル大公園 秋祭り|首尔大公园秋季节|首爾大公園秋季節
anyang-apap8-2026|art|8th Anyang Public Art Project: APAP8|第8回安養パブリックアートプロジェクト|第八届安养公共艺术项目|第八屆安養公共藝術計畫
paju-hope-art-festival-2026|art|Paju Hope-Sharing Art Festival|希望を分かち合う坡州アート祭り|坡州希望分享艺术节|坡州希望分享藝術節
gwangju-hwadam-autumn-2026|garden|Hwadam Forest Autumn Foliage Festival|和談の森 紅葉祭り|和谈林秋季赏枫节|和談林秋季賞楓節
incheon-green-sharing-market-2026|eco|Incheon Green Sharing Market|仁川グリーンシェアリング市場|仁川绿色分享市集|仁川綠色分享市集
incheon-resident-expo-2026|culture|Incheon Residents’ Autonomy Expo|仁川住民自治博覧会|仁川居民自治博览会|仁川居民自治博覽會
ganghwa-local-artists-2026|art|Ganghwa Local Artists Festival|江華アーティスト祭り|江华艺术家节|江華藝術家節
incheon-iap-open-studio-2026|art|Incheon Art Platform Open Studios|仁川アートプラットフォーム オープンスタジオ|仁川艺术平台开放工作室|仁川藝術平台開放工作室
incheon-yeonsudam-food-2026|food|Yeonsudam Traditional Food Festival|ヨンスダム伝統食文化祭り|延寿谈传统饮食节|延壽談傳統飲食節
incheon-art-t-day-tour-2026|art|Art T Incheon One-Day Art Tour|アートT 仁川日帰りアートツアー|Art T仁川一日艺术游|Art T仁川一日藝術遊
bupyeong-campmarket-november-2026|family|Camp Market: November Weekends|キャンプマーケット 11月の週末|营地市场十一月周末活动|營地市場十一月週末活動
seongbuk-youth-market-2026|market|Seongbuk Youth Together Market: Round 2|城北青年共生マーケット 第2回|城北青年共生市集第二场|城北青年共生市集第二場
anseong-namsadang-november-2026|performance|Anseong Namsadang: November Performances|安城男寺党 11月公演|安城男寺党十一月演出|安城男寺黨十一月演出
`.trim().split('\n').map(row=>row.split('|'));
export const EVENT_LOCALES = Object.fromEntries(rows.map(([id,topic,...titles])=>[id,{topic,titles}]));
const topics = {
fireworks:['Fireworks by the water. Check display times and traffic notices.','水辺の花火。打ち上げ時刻・交通規制をご確認ください。','水畔烟花活动。请确认演出时间与交通管制。','水畔煙火活動。請確認演出時間與交通管制。'],
drone:['Drone displays, competitions or hands-on activities. See the official program.','ドローンの競技・展示・体験。詳細は公式プログラムへ。','无人机竞赛、展示或体验。详情请查看官方日程。','無人機競賽、展示或體驗。詳情請查看官方日程。'],
food:['Discover the flavors of Korea. Food and activity charges vary.','韓国の食を楽しむイベント。飲食・体験料金は内容により異なります。','探索韩国美食。餐饮及体验费用因项目而异。','探索韓國美食。餐飲及體驗費用因項目而異。'],
harvest:['Meet local produce and harvest traditions. Check the daily program.','地元の農産物と収穫文化に出会う催し。日別の内容をご確認ください。','体验当地农产与丰收文化。请确认每日活动。','體驗當地農產與豐收文化。請確認每日活動。'],
kimchi:['Explore Korean kimchi culture. Reservations may be needed for hands-on sessions.','キムチ文化に触れる催し。体験は事前予約が必要な場合があります。','探索韩国泡菜文化。制作体验可能需要预约。','探索韓國泡菜文化。製作體驗可能需要預約。'],
flowers:['Seasonal chrysanthemum and flower displays. Check opening hours before visiting.','季節の菊・花の展示。来場前に開園時間をご確認ください。','欣赏应季菊花与花卉。出发前请确认开放时间。','欣賞應季菊花與花卉。出發前請確認開放時間。'],
garden:['Enjoy gardens and seasonal scenery. Check admission and operating days.','庭園と季節の景色を楽しもう。入場条件・営業日をご確認ください。','欣赏庭园与季节风景。请确认门票及开放日。','欣賞庭園與季節風景。請確認門票及開放日。'],
night:['An evening outing with illuminated scenery. Check daily opening hours.','ライトアップを楽しむ夜のお出かけ。日別の開催時間をご確認ください。','欣赏灯光夜景。请确认每日开放时间。','欣賞燈光夜景。請確認每日開放時間。'],
media:['Light and media art in a heritage setting. Check screening times.','文化遺産を舞台にした光とメディアアート。上映時間をご確認ください。','在文化遗产场景欣赏光影媒体艺术。请确认放映时间。','在文化遺產場景欣賞光影媒體藝術。請確認放映時間。'],
family:['Activities for a family outing. Age limits and reservations depend on the program.','家族のお出かけに。対象年齢・予約条件はプログラムごとに異なります。','适合家庭出游的活动。年龄限制与预约条件依项目而定。','適合家庭出遊的活動。年齡限制與預約條件依項目而定。'],
market:['Browse local goods and market stalls. Check market dates and hours.','地域の商品やマーケットを巡ろう。開催日・時間をご確認ください。','逛当地商品与市集摊位。请确认举办日期与时间。','逛當地商品與市集攤位。請確認舉辦日期與時間。'],
books:['Books, reading and cultural programs. Session schedules and booking rules vary.','本・読書・文化プログラム。回ごとの時間と予約条件をご確認ください。','图书、阅读与文化活动。各场时间与预约条件有所不同。','圖書、閱讀與文化活動。各場時間與預約條件有所不同。'],
art:['Discover exhibitions, artists and creative work. Check ticket and program details.','展示・作家・クリエイティブな作品に出会おう。チケットと内容をご確認ください。','探索展览、艺术家与创作。请确认门票及活动详情。','探索展覽、藝術家與創作。請確認門票及活動詳情。'],
culture:['Experience local culture and community programs. Check the day-by-day schedule.','地域文化や交流プログラムを楽しもう。日別の予定をご確認ください。','体验当地文化与社区活动。请确认每日安排。','體驗當地文化與社區活動。請確認每日安排。'],
heritage:['Discover Korean history and heritage. Check tour times and participation rules.','韓国の歴史・文化遺産に出会おう。開催時間と参加条件をご確認ください。','探索韩国历史与文化遗产。请确认活动时间与参与条件。','探索韓國歷史與文化遺產。請確認活動時間與參與條件。'],
walk:['Walking or running outdoors. Check route, registration and weather guidance.','屋外でのウォーキング・ランニング。コース・申込・天候案内をご確認ください。','户外步行或跑步活动。请确认路线、报名与天气指引。','戶外步行或跑步活動。請確認路線、報名與天氣指引。'],
performance:['Live performances. Check individual show times and admission rules.','ライブ公演。各回の開演時間と入場条件をご確認ください。','现场演出。请确认各场时间与入场条件。','現場演出。請確認各場時間與入場條件。'],
coffee:['Coffee culture and related exhibits. Check public admission dates and ticket rules.','コーヒー文化と関連展示。一般入場日とチケット条件をご確認ください。','咖啡文化与相关展览。请确认公众开放日及门票条件。','咖啡文化與相關展覽。請確認公眾開放日及門票條件。'],
wine:['Alcohol-related exhibits and tasting. Check age restrictions and admission conditions.','お酒の展示・試飲。年齢制限と入場条件をご確認ください。','酒类展览与品鉴。请确认年龄限制及入场条件。','酒類展覽與品鑑。請確認年齡限制及入場條件。'],
seafood:['Local seafood and food culture. Check menus, prices and activity schedules.','地元の海産物と食文化。メニュー・料金・体験日程をご確認ください。','当地海鲜与饮食文化。请确认菜单、价格与活动日程。','當地海鮮與飲食文化。請確認菜單、價格與活動日程。'],
craft:['Ceramics, craft displays and creative activities. Check session and fee details.','陶芸・工芸の展示や体験。実施回と料金をご確認ください。','陶瓷、工艺展示与创作体验。请确认场次及费用。','陶瓷、工藝展示與創作體驗。請確認場次及費用。'],
eco:['Reuse and environmental activities. Check market and activity operating hours.','リユースや環境に関する催し。市場・体験の開催時間をご確認ください。','二手循环与环保活动。请确认市集及体验时间。','二手循環與環保活動。請確認市集及體驗時間。'],
pets:['Pet-related programs. Check entry rules, pet policies and participation conditions.','ペットに関する催し。入場・ペット同伴・参加条件をご確認ください。','宠物相关活动。请确认入场、携宠及参与条件。','寵物相關活動。請確認入場、攜寵及參與條件。'],
expo:['Industry exhibits and related programs. Check visitor registration and public entry.','産業展示と関連企画。来場登録と一般入場条件をご確認ください。','行业展览与相关活动。请确认观众登记及公众入场条件。','產業展覽與相關活動。請確認觀眾登記及公眾入場條件。'],
military:['Marine Corps culture and related programs. Check the official daily timetable.','海兵隊の文化と関連プログラム。公式の日別予定をご確認ください。','海军陆战队文化与相关活动。请查看官方每日时间表。','海軍陸戰隊文化與相關活動。請查看官方每日時間表。'],
science:['Science and technology programs. Check activity times and eligibility.','科学・技術のプログラム。体験時間と参加対象をご確認ください。','科学与技术活动。请确认体验时间与参与资格。','科學與技術活動。請確認體驗時間與參與資格。'],
games:['Games and related programs. Check session times and competition entry rules.','ゲームと関連プログラム。開催回と大会の参加条件をご確認ください。','游戏与相关活动。请确认场次及比赛报名条件。','遊戲與相關活動。請確認場次及比賽報名條件。'],
airshow:['Aviation displays and flight programs. Weather may affect the timetable.','航空展示と飛行プログラム。天候により予定が変わる場合があります。','航空展览与飞行表演。日程可能受天气影响。','航空展覽與飛行表演。日程可能受天氣影響。'],
film:['Independent film screenings. Check the screening schedule and ticket conditions.','インディペンデント映画の上映。上映日程とチケット条件をご確認ください。','独立电影放映。请确认放映日程与票务条件。','獨立電影放映。請確認放映日程與票務條件。']
};
export const GUIDE_TOPICS=topics;
export const LOCALE_COLUMNS={'en':0,'ja':1,'zh-CN':2,'zh-TW':3};
export function eventTranslation(event,locale) {
  const column=LOCALE_COLUMNS[locale],row=EVENT_LOCALES[event.id];
  return column===undefined||!row?null:{title:row.titles[column],summary:topics[row.topic][column]};
}
