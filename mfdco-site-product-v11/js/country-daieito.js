"use strict";
(function(){
const C=window.MFDCOCountry;
if(!C)return;
const id=()=>C.uid();
const ind=(category,name,value,unit="",year="帝紀2686年",notes="")=>({id:id(),category,name,value,unit,year,notes});
const region=(state,name,popMan,summary,extra={})=>({id:id(),state,name,capital:"",population:Math.round(popMan*10000),area:0,summary,specialties:[],culture:"",heritage:[],industries:[],climate:"",latitude:null,longitude:null,imageKey:"",...extra});
const page=(type,title,summary,facts=[],sections=[],imageKey="",tags=[])=>({id:id(),type,title,summary,imageKey,facts:facts.map(([key,value])=>({key,value})),sections:sections.map(([title,body])=>({title,body})),tags,related:[]});
function make(){
 const c=C.defaultCountry();
 Object.assign(c,{name:"大永都帝國",shortName:"永都帝國、永都、NKT、NK",englishName:"Daieito Empire",code:"NKT",slug:"daieito-empire",summary:"大陸東方の島嶼部を中心に発展した立憲君主制国家。約2700年前に建国され、始祖帝の血統を継ぐ帝家が皇位を継承する。重工業・情報技術・軍需産業を中核とする技術大国で、海上交通路の確保を国家戦略の中心に置く。",isPublic:true,tags:["2686年","王朝","一億総監視社会","軍国主義","技術大国","島国","工業国家"],population:90000000,populationYear:"帝紀2686年",area:620000});
 c.media={flagKey:"assets/daieito/p2_img2.png",emblemKey:"assets/daieito/p2_img1.png",coverKey:"",mapKey:"assets/daieito/p8_img2.png",anthemKey:"",capitalImageKey:""};
 c.nationalSymbols={flagName:"六永旗",emblemName:"六永章",anthemName:"我が帝國",motto:""};
 c.foundation={label:"帝紀元年（約2700年前）",gregorianYear:-659,notes:"帝紀2686年＝西暦2026年として換算。"};
 c.capital={name:"永京府 永京市",summary:"帝都。永京府は行政区表で人口1,582万人、基本情報では首都圏人口約1,300万人とされる。",population:13000000,imageKey:""};
 c.sovereignty={status:"主権国家",recognizedBy:"資料上の承認国数は未記載",territorialWatersKm:0,eezArea:6200000};
 c.territory={area:620000,landArea:0,waterArea:0,eezArea:6200000,coastlineKm:0};
 c.timekeeping={referenceCity:"中海藩",latitude:null,longitude:null,standardMeridian:null,utcMode:"manual",utcOffset:null,timezoneName:"",notes:"行政区表で中海藩が『住宅地・標準時』とされる。標準時子午線・UTC差・緯度経度・標準時名称は本資料では未記載のため未設定。"};
 c.demographics={density:145,urbanizationPct:82,fertilityRate:1.44,populationGrowthPct:0,lifeExpectancyMale:80.9,lifeExpectancyFemale:87.1};
 c.welfare={...c.welfare,happinessRank:58,pressFreedomRank:145,democracyIndex:68,corruptionIndex:24,equalityIndex:161};
 c.populationGroups={children:0,working:0,elderly:0};
 c.nationalSymbols={flagName:"六永旗",emblemName:"六永章",anthemName:"我が帝國",motto:""};
 c.government={system:"立憲君主制",headOfState:"皇帝",headOfGovernment:"内閣（首相名は資料未記載）",legislature:"帝國議会（士族院・臣民院）",judiciary:"律令省等を含む法制度（司法機構の詳細は資料未記載）",rulingParties:["立憲君主党"]};
 c.culture={languages:["永都語"],religions:["永道（多神教）"],ethnicGroups:[],holidays:[],food:[],arts:[],sports:[],notes:"国教『永道』では万物に神が宿るとされる。始祖帝は神の遣いとして降り立ったとされ、皇帝は政治的元首以上に宗教的象徴として重要な地位を持つ。"};
 c.economy={gdp:4000000000000,gdpYear:"帝紀2686年・約4兆USD",gdpPerCapita:44000,currencyName:"帝永通宝",currencyCode:"Yei / 永",currencyMode:"independent",currencyRate:0,currencyBase:"USD",growthRate:0,unemploymentRate:0,inflationRate:0,debt:0};
 c.budget={year:"帝紀2686年",revenue:[
   {id:id(),name:"一般税",value:98000000000000},{id:id(),name:"貿易等",value:56000000000000},{id:id(),name:"国債",value:30000000000000},{id:id(),name:"その他",value:16000000000000}
 ],expenditure:[
   {id:id(),name:"国防",value:66000000000000},{id:id(),name:"社会保障",value:30000000000000},{id:id(),name:"教育・研究",value:16000000000000},{id:id(),name:"公共事業・インフラ",value:28000000000000},{id:id(),name:"地方交付",value:10000000000000},{id:id(),name:"行政",value:10000000000000},{id:id(),name:"外交",value:4000000000000},{id:id(),name:"国債費",value:22000000000000},{id:id(),name:"予備費",value:14000000000000}
 ]};
 c.industries=[{name:"重工業",share:25},{name:"AI・IT",share:18},{name:"軍需",share:17},{name:"サービス",share:20},{name:"金融",share:8},{name:"建設",share:5},{name:"農林水産",share:4},{name:"その他",share:3}];
 c.products=["軍艦・兵器・原子炉","特殊鋼・レアメタル","半導体・AI・量子計算","航空機・エンジン・UAV","宇宙・通信・衛星・量子通信","商船・LNG船・海洋構造物","水産物"];
 c.resources=["水産物","木材","水","原子力燃料","石炭","石油","天然ガス","ウラン","鉄鉱石","銅","アルミ原料","ニッケル","クロム","マンガン","チタン","タングステン","モリブデン","レアアース","シリコン","リチウム","コバルト","ガリウム","ゲルマニウム"];
 c.food={year:"帝紀2686年",selfSufficiencyCaloriePct:72,selfSufficiencyProductionValuePct:94,selfSufficiencyIntakePct:0,targetPct:0,arableLandPct:0,strategicReserveDays:0,stapleFoods:["穀物","米","野菜","水産物"],notes:"北州・南州の穀倉地帯と広大なEEZの漁業が食料供給を支える。水産物自給率は285%。"};
 c.energy={year:"帝紀2686年",selfSufficiencyPct:0,renewablePct:0,notes:"電力は国内発電で100%賄うが需要限界に近い。原子力燃料・石油・天然ガス・ウランは輸入依存が大きく、AI需要増大による電力不足が社会課題。",sources:[]};
 c.climate={zones:[],avgTemp:"",rainfall:"河川・降水量が豊富",notes:"本資料には気候帯の正式分類・平均気温の数値は記載されていない。行政区設定には寒冷地農業・酪農などの地域特性があり、森林率は約70%とされる。",monthlyTemps:Array(12).fill(null),monthlyRainfall:Array(12).fill(null)};
 c.companies=[
  {id:id(),name:"三永重工",type:"軍需・重工",summary:"軍艦・兵器・原子炉。総資産95兆永、年間売上42兆永、営業利益7.2兆永、時価総額78兆永、従業員42万人。",assetsTrillion:95,salesTrillion:42,profitTrillion:7.2,marketCapTrillion:78,revenue:42,operatingProfit:7.2,marketCap:78,financialUnit:"兆永",employees:420000,employeesMan:42,productionTags:"軍需, 造船, 原子炉, 防衛",dependencyTags:"鉄鋼, レアメタル",logoKey:""},
  {id:id(),name:"官営製鉄",type:"国有・製鉄",summary:"製鉄・特殊鋼・レアメタル。総資産88兆永、年間売上36兆永、営業利益5.4兆永、国有、従業員36万人。",assetsTrillion:88,salesTrillion:36,profitTrillion:5.4,marketCapTrillion:null,revenue:36,operatingProfit:5.4,marketCap:0,financialUnit:"兆永",employees:360000,employeesMan:36,productionTags:"製鉄, 特殊鋼, レアメタル",dependencyTags:"鉄鉱石, 石炭",logoKey:""},
  {id:id(),name:"三下電子",type:"半導体・AI",summary:"半導体・AI・量子計算。総資産74兆永、年間売上33兆永、営業利益8.6兆永、時価総額96兆永、従業員31万人。",assetsTrillion:74,salesTrillion:33,profitTrillion:8.6,marketCapTrillion:96,revenue:33,operatingProfit:8.6,marketCap:96,financialUnit:"兆永",employees:310000,employeesMan:31,productionTags:"半導体, AI, 量子計算, 電子",dependencyTags:"シリコン, コバルト, 電力",logoKey:""},
  {id:id(),name:"天鳳航空",type:"航空宇宙",summary:"航空機・エンジン・UAV。総資産63兆永、年間売上25兆永、営業利益4.8兆永、時価総額55兆永、従業員27万人。",assetsTrillion:63,salesTrillion:25,profitTrillion:4.8,marketCapTrillion:55,revenue:25,operatingProfit:4.8,marketCap:55,financialUnit:"兆永",employees:270000,employeesMan:27,productionTags:"航空, UAV, 軍需",dependencyTags:"石油, チタン, 半導体",logoKey:""},
  {id:id(),name:"光糸財閥",type:"宇宙・通信",summary:"宇宙・通信・衛星・量子通信。総資産56兆永、年間売上19兆永、営業利益3.7兆永、時価総額62兆永、従業員18万人。",assetsTrillion:56,salesTrillion:19,profitTrillion:3.7,marketCapTrillion:62,revenue:19,operatingProfit:3.7,marketCap:62,financialUnit:"兆永",employees:180000,employeesMan:18,productionTags:"宇宙, 通信, 衛星, 量子通信",dependencyTags:"半導体, レアメタル",logoKey:""},
  {id:id(),name:"三二造船",type:"造船",summary:"商船・LNG船・海洋構造物。総資産41兆永、年間売上18兆永、営業利益2.8兆永、時価総額35兆永、従業員22万人。",assetsTrillion:41,salesTrillion:18,profitTrillion:2.8,marketCapTrillion:35,revenue:18,operatingProfit:2.8,marketCap:35,financialUnit:"兆永",employees:220000,employeesMan:22,productionTags:"造船, 海運, LNG, 船舶",dependencyTags:"鉄鋼, 石油, 天然ガス",logoKey:""}
 ];
 c.parties=[
  {id:id(),name:"立憲君主党",type:"与党",summary:"与党。立憲君主制を支持。",logoKey:""},
  {id:id(),name:"帝國労働党",type:"右派・タカ派",summary:"軍部の後ろ盾もあり優勢。",logoKey:""},
  {id:id(),name:"臣民政友会",type:"中道・旧与党",summary:"旧与党。支持率は低下傾向。",logoKey:""},
  {id:id(),name:"国家社会党",type:"リベラル派",summary:"資料ではリベラル派の一つとして記載。支持率低下傾向。",logoKey:""},
  {id:id(),name:"臣民平等党",type:"リベラル派",summary:"平等を掲げる政党。支持率低下傾向。",logoKey:""}
 ];
 c.administration.summary="6州・2府・52藩・3直属島。行政区表は2府52藩の計54区画を掲載し、直属島3のうち表で確認できるのは天神島藩・南永藩の2件。";
 c.administration.ministries=["労働省","経済省","外交省","交通省","情報省","律令省","文部省","産業省","財政省","総督府"].map(name=>({id:id(),name,head:"",summary:"帝國行政組織図に掲載。"}));
 c.administration.laws=[{id:id(),name:"帝國憲制（立憲君主制）",year:"",status:"現行",summary:"皇帝を国家元首とし、帝國議会と内閣が平時の政治を運営。安全保障・戦争の最終意思決定には大本営が助言する。"},{id:id(),name:"臣民院選挙資格",year:"",status:"現行",summary:"第一次徴兵または志願兵役を修了した臣民に臣民院の選挙権を付与。"}];
 const regs=[
  ["南夷州","宗谷藩",48,"最北端・海軍基地・漁業",{industries:["漁業","海軍基地"]}],
  ["南夷州","氷川藩",40,"寒冷地農業・酪農",{industries:["農業","酪農"]}],
  ["南夷州","白嶺藩",62,"観光。連邦風の建造物が多数点在",{industries:["観光"],heritage:["連邦風建造物群"]}],
  ["南夷州","天塩藩",87,"穀倉地帯",{industries:["農業"],specialties:["穀物"]}],
  ["南夷州","北浜藩",154,"港湾・造船",{industries:["港湾","造船"]}],
  ["南夷州","北都藩",298,"政令指定都市。近代の都市計画により発展。大規模なローム層",{industries:["都市サービス"]}],
  ["南夷州","郭内藩",253,"世界自然遺産で北族の首都だった北稜郭を中心に発展",{heritage:["北稜郭","世界自然遺産"]}],
  ["北州","青野藩",62,"野菜やコメの産地で面積が最大",{specialties:["野菜","米"],industries:["農業"]}],
  ["北州","瑞穂藩",83,"米どころ",{specialties:["米"],industries:["農業"]}],
  ["北州","玄潮藩",430,"北方最大都市",{industries:["都市サービス"]}],
  ["北州","猛熊藩",38,"9割が森林。果実の名産地",{specialties:["果実","木材"],industries:["林業"]}],
  ["北州","旭野藩",92,"研究都市。大学や研究機関などが密集",{industries:["研究","教育"]}],
  ["北州","北央藩",110,"交通の要衝",{industries:["交通","物流"]}],
  ["北州","古町藩",121,"平野。古代からの名残で複雑な都市構造",{heritage:["古代都市構造"]}],
  ["北州","豊浜藩",49,"漁港",{industries:["漁業","港湾"]}],
  ["北州","雲井藩",55,"最多の原子力発電所数。以北の電力の60%を供給",{industries:["原子力発電"]}],
  ["伍州","金嶺藩",32,"砂金の産地。三大財閥の一つがここで誕生",{specialties:["砂金"],industries:["鉱業"]}],
  ["伍州","銀嶺藩",53,"鉱山（銀・石炭・鉄鋼）。現在でも少量採掘",{specialties:["銀","石炭","鉄"],industries:["鉱業"]}],
  ["伍州","緋月藩",79,"最古の軍需工場として有名。石炭の産地。大規模な城郭が残る",{specialties:["石炭"],industries:["軍需","鉱業"],heritage:["大規模城郭"]}],
  ["伍州","虎城藩",114,"虎城（有力豪族の本拠）の城下町として発展。商業都市",{industries:["商業"],heritage:["虎城"]}],
  ["伍州","千峰藩",40,"狭く険しい山岳。修行の地として有名",{culture:"修行文化"}],
  ["伍州","清流藩",63,"最長河川の上流。ダムなどが乱立",{industries:["水力・治水"]}],
  ["伍州","翠樹藩",64,"森林",{industries:["林業"]}],
  ["伍州","黒崎藩",123,"工業港",{industries:["工業","港湾"]}],
  ["伍州","岸藩",78,"プレート境界。大規模断層とリアス式海岸。観光地。震源地となることが多く、少数部族の拠点がある",{industries:["観光"],culture:"少数部族の拠点"}],
  ["伍州","高龗藩",153,"水力・地熱発電所が多く温泉が点在。硫黄の名産地",{specialties:["硫黄","温泉"],industries:["水力発電","地熱発電","観光"]}],
  ["府州","永京府",1582,"帝都。世界最大都市",{industries:["行政","金融","商業"]}],
  ["府州","西海藩",116,"西の貿易港",{industries:["貿易","港湾"]}],
  ["府州","中海藩",91,"住宅地・標準時",{industries:["住宅"]}],
  ["府州","流桜藩",325,"帝都近郊住宅地",{industries:["住宅"]}],
  ["府州","鳳城藩",319,"交通拠点・近郊農業・陸軍基地",{industries:["交通","農業","軍事"]}],
  ["府州","原藩",30,"平原。データセンタの建造計画地",{industries:["データセンター計画"]}],
  ["府州","紫野藩",60,"観光地。大陸風の建築と世界遺産",{industries:["観光"],heritage:["大陸風建築","世界遺産"]}],
  ["府州","永山藩",59,"山地・永都最高の永山がある",{heritage:["永山"]}],
  ["中州","旧京府",623,"第二都市圏",{industries:["都市サービス"]}],
  ["中州","大港藩",512,"国内海運の拠点",{industries:["海運","港湾"]}],
  ["中州","緋田藩",432,"工業地帯",{industries:["工業"]}],
  ["中州","玉鋼藩",126,"最大の製鉄所を持つ",{industries:["製鉄"]}],
  ["中州","翠浜藩",90,"空母工廠",{industries:["軍需","造船"]}],
  ["中州","出帝藩",50,"永道始まりの地",{culture:"永道発祥地",heritage:["永道発祥地"]}],
  ["中州","高浜藩",114,"北西の貿易港",{industries:["貿易","港湾"]}],
  ["中州","青葉藩",276,"住宅",{industries:["住宅"]}],
  ["中州","蒼河藩",97,"大規模な農地と多数の川がある",{industries:["農業"],specialties:["農産物"]}],
  ["中州","光陵藩",98,"データセンタ・先端技術の試験都市",{industries:["データセンター","先端技術"]}],
  ["中州","赭蛟藩",123,"陸軍都市",{industries:["軍事"]}],
  ["南州","南都藩",413,"南方最大都市",{industries:["都市サービス"]}],
  ["南州","鳳城藩",174,"海軍都市",{industries:["海軍","軍事"]}],
  ["南州","鳥羽藩",210,"港・外交の窓口",{industries:["港湾","外交"]}],
  ["南州","瀬礁藩",15,"諸島",{}],
  ["南州","潮崎藩",39,"航空・宇宙開発",{industries:["航空","宇宙"]}],
  ["南州","陽ノ浦藩",143,"造船業",{industries:["造船"]}],
  ["南州","朝凪藩",115,"南方艦隊",{industries:["海軍"]}],
  ["離島","天神島藩",3,"宇宙開発",{industries:["宇宙"]}],
  ["離島","南永藩",5,"諸島",{}]
 ];
 c.administration.regions=regs.map(x=>region(...x));
 c.cities=[
   {id:id(),name:"永京市",type:"首都・帝都",regionId:c.administration.regions.find(r=>r.name==="永京府")?.id||"",population:13000000,latitude:null,longitude:null,summary:"永京府内の首都。首都圏人口は約1,300万人とされる。",imageKey:""},
   {id:id(),name:"北都",type:"政令指定都市",regionId:c.administration.regions.find(r=>r.name==="北都藩")?.id||"",population:0,latitude:null,longitude:null,summary:"近代都市計画により発展した北部都市。",imageKey:""},
   {id:id(),name:"玄潮",type:"北方最大都市",regionId:c.administration.regions.find(r=>r.name==="玄潮藩")?.id||"",population:0,latitude:null,longitude:null,summary:"北方最大都市。",imageKey:""},
   {id:id(),name:"南都",type:"南方最大都市",regionId:c.administration.regions.find(r=>r.name==="南都藩")?.id||"",population:0,latitude:null,longitude:null,summary:"南方最大都市。",imageKey:""}
 ];
 c.chronology={currentGregorian:2026,calendars:[{id:id(),name:"帝紀",startYear:-659,endYear:null,prefix:"帝紀",suffix:"年"}]};
 c.eras=[
   {id:id(),name:"建国・古代",startYear:-659,endYear:1125},
   {id:id(),name:"武家政権期",startYear:1126,endYear:1875},
   {id:id(),name:"立憲・工業化期",startYear:1876,endYear:1995},
   {id:id(),name:"北伐後の繁栄",startYear:1996,endYear:2015},
   {id:id(),name:"統制強化・世界大戦期",startYear:2016,endYear:null}
 ];
 c.timeline=[
   {id:id(),date:"帝紀元年",year:-659,era:"建国・古代",title:"始祖帝即位・建国",summary:"始祖帝が即位し、永道の教えとともに国家の基礎を築く。",body:"各地の豪族を統率し、帝家を中心とする国家形成が始まった。",imageKey:""},
   {id:id(),date:"約900年前",year:1126,era:"武家政権期",title:"武家政権成立",summary:"貴族政治を経て武家政権が成立。",body:"",imageKey:""},
   {id:id(),date:"約150年前",year:1876,era:"立憲・工業化期",title:"倒幕・立憲君主制へ移行",summary:"武家政権を倒し、立憲君主制へ移行。急速な工業化と海軍増強を進める。",body:"",imageKey:""},
   {id:id(),date:"帝紀2650年前後",year:1990,era:"立憲・工業化期",title:"戦争による人口減少",summary:"戦争により人口が減少。",body:"人口推移資料で帝紀2650年前後の人口減少が示される。",imageKey:""},
   {id:id(),date:"約30年前",year:1996,era:"北伐後の繁栄",title:"北伐",summary:"連邦との戦争に勝利し、賠償金による大規模インフラ整備と繁栄へ。",body:"北伐軍の名称は、この戦争で連邦陸軍と交戦し勝利した12個師団規模の英雄的部隊に由来する。",imageKey:""},
   {id:id(),date:"約10年前",year:2016,era:"統制強化・世界大戦期",title:"恐慌",summary:"景気が悪化し、資源不足・人口減少とともに重要課題となる。統制体制を強化。",body:"",imageKey:""},
   {id:id(),date:"帝紀2685年",year:2025,era:"統制強化・世界大戦期",title:"世界大戦による人口減少・衛星損失",summary:"戦争による人口減少と衛星攻撃・サイバー攻撃が深刻化。",body:"開戦以降、人工衛星2300機以上が撃墜されたとされる。",imageKey:""},
   {id:id(),date:"帝紀2686年",year:2026,era:"統制強化・世界大戦期",title:"長期戦継続",summary:"資源確保と海上交通路維持を目的とした長期戦を継続。",body:"西方陣営などと戦闘状態。",imageKey:""}
 ];
 c.military={budget:66000000000000,budgetYear:"帝紀2686年・66兆永（国家歳出200兆永の33%）",budgetCurrency:"Yei",budgetUsdEquivalent:0,personnel:0,reservePersonnel:0,paramilitaryPersonnel:0,conscription:"第一次徴兵（18～25歳・1～3年）、第二次徴兵（戦時特例）",nuclearWarheads:400,headquarters:"大本営",doctrine:"海軍を中核とし、資源輸入国として『海上交通路の確保』と『敵補給路の遮断』を重視。空母打撃群は制空・上陸支援を主任務とし、敵空母の排除は潜水艦隊・駆逐艦隊・長距離打撃部隊による低リスク攻撃を優先。AI・UXVを早期から本格運用して少人数で高い戦闘能力を発揮する。",commanderInChief:"皇帝（統帥権）",branches:[
   {id:id(),name:"帝國海軍",type:"海軍",personnel:0,budget:34000000000000,commander:"",authority:"皇帝の統帥権・大本営の助言",description:"世界第3位の海軍戦力。海上交通路確保を最優先。"},
   {id:id(),name:"帝國陸軍",type:"陸軍",personnel:0,budget:14000000000000,commander:"",authority:"皇帝の統帥権・大本営の助言",description:"世界第8位の陸軍戦力。"},
   {id:id(),name:"帝國宙軍",type:"宇宙軍",personnel:0,budget:10000000000000,commander:"",authority:"皇帝の統帥権・大本営の助言",description:"衛星・宇宙領域を担当。"}
 ],units:[{id:id(),name:"北伐軍",branchId:"",type:"陸軍部隊群",base:"大陸の傀儡国",personnel:0,status:"活動中",summary:"北方警備部隊名目で総督軍から独立し、鉄道利権をめぐる武力衝突を起こすなど暴走傾向。名称は30年前の北伐で活躍した12個師団規模の部隊に由来。"}],equipment:[{id:id(),name:"核弾頭",type:"核兵器",count:400,notes:"少なくとも400発以上。鯨型原子力潜水艦、陸上、航空、一部水上艦艇、大陸間弾道ミサイルで運用可能。"}],namingRules:[],serviceTypes:[
   {id:id(),name:"陸海宙軍学校卒（宙軍兵含む）",details:"幹部育成を目的とした学校。士族のみ。"},
   {id:id(),name:"志願兵（宙軍兵含む）",details:"身分・性別を問わず、志願し受理された者。"},
   {id:id(),name:"第一次徴兵（陸海軍のみ）",details:"満18～25歳のうちに1～3年。特例を除き全男子対象。"},
   {id:id(),name:"第二次徴兵（戦時特例）",details:"第一次徴兵終了後、政府選定の対象者のみ。戦時下による特例。"}
 ]};
 c.strength.manual={technology:0,industry:0,resources:0,administration:0,diplomacy:0,logistics:0,foodSecurity:0,energySecurity:0};
 c.socialIssues=[
  {id:id(),name:"少子化による人口減少",category:"人口",severity:"重大",summary:"戦争による人口減少に加え、低出生率による人口減少が進行。"},
  {id:id(),name:"AI需要過多による電力・半導体不足",category:"産業・エネルギー",severity:"重大",summary:"生成AI需要増大で電力とデータセンター用半導体が不足。"},
  {id:id(),name:"石油不足",category:"資源",severity:"重大",summary:"禁輸と海上封鎖、脱石油政策の失敗が重なり石油資源が不足。"},
  {id:id(),name:"北伐軍の暴走",category:"軍事・政治",severity:"高",summary:"大陸駐在部隊の独自行動と軍閥との衝突が問題化。"},
  {id:id(),name:"衛星不足",category:"宇宙・軍事",severity:"重大",summary:"開戦後のサイバー・衛星攻撃で2300機以上を喪失し、補充資源も不足。"},
  {id:id(),name:"身分制度の限界",category:"社会",severity:"高",summary:"血統による士族・臣民制度への不満と平等化要求が拡大。"}
 ];
 c.indicators=[
  ind("国際順位","GDP",5,"位"),ind("国際順位","人口",18,"位"),ind("国際順位","面積",24,"位"),ind("国際順位","EEZ",5,"位"),ind("国際順位","海軍力",3,"位"),ind("国際順位","陸軍力",8,"位"),ind("国際順位","軍事費",4,"位"),ind("国際順位","AI産業",2,"位"),ind("国際順位","スパコン演算性能",1,"位"),ind("国際順位","インフラ",2,"位"),ind("国際順位","造船業",2,"位"),ind("国際順位","平均寿命",7,"位"),ind("国際順位","教育水準",6,"位"),ind("国際順位","幸福度",58,"位"),ind("国際順位","報道の自由",145,"位"),ind("国際順位","民主主義指数",68,"位"),ind("国際順位","汚職指数",24,"位"),ind("国際順位","出生率",160,"位"),ind("国際順位","男女平等指数",147,"位"),ind("国際順位","総合平等指数",161,"位"),
  ind("資源自給率","食料（カロリーベース）",72,"%","帝紀2686年","北州・南州の穀倉地帯とEEZの漁業"),ind("資源自給率","食料（生産額）",94,"%","帝紀2686年","高付加価値農業・畜産が強い"),ind("資源自給率","水産物",285,"%","帝紀2686年","世界有数の漁業国・輸出産業"),ind("資源自給率","木材",89,"%","帝紀2686年","森林率約70%"),ind("資源自給率","水",100,"%","帝紀2686年","河川・降水量が豊富"),ind("資源自給率","電力",100,"%","帝紀2686年","国内発電で賄うが限界が近い"),ind("資源自給率","原子力燃料",18,"%"),ind("資源自給率","石炭",58,"%","帝紀2686年","北夷州・伍州"),ind("資源自給率","石油",9,"%","帝紀2686年","深刻な問題"),ind("資源自給率","天然ガス",14,"%","帝紀2686年","EEZ海底ガス田"),ind("資源自給率","ウラン",12,"%"),ind("資源自給率","再生可能エネルギー",100,"%","帝紀2686年","国内資源"),ind("資源自給率","鉄鉱石",24,"%","帝紀2686年","品質は低い"),ind("資源自給率","銅",55,"%"),ind("資源自給率","アルミ原料",18,"%","帝紀2686年","輸入依存"),ind("資源自給率","ニッケル",10,"%","帝紀2686年","輸入"),ind("資源自給率","クロム",5,"%","帝紀2686年","輸入"),ind("資源自給率","マンガン",9,"%","帝紀2686年","輸入"),ind("資源自給率","チタン",82,"%","帝紀2686年","砂鉄・チタン鉱床"),ind("資源自給率","タングステン",67,"%","帝紀2686年","軍需向け重要資源"),ind("資源自給率","モリブデン",43,"%"),ind("資源自給率","レアアース",38,"%","帝紀2686年","EEZ海底資源"),ind("資源自給率","シリコン",46,"%","帝紀2686年","半導体産業"),ind("資源自給率","リチウム",28,"%","帝紀2686年","傀儡国にも鉱山"),ind("資源自給率","コバルト",4,"%","帝紀2686年","輸入依存"),ind("資源自給率","ガリウム",76,"%","帝紀2686年","精製技術が高い"),ind("資源自給率","ゲルマニウム",61,"%","帝紀2686年","副産物として回収"),ind("資源自給率","火薬",100,"%"),ind("資源自給率","ミサイル",100,"%"),ind("資源自給率","弾薬",100,"%"),ind("資源自給率","艦艇",100,"%"),ind("資源自給率","航空機",95,"%"),ind("資源自給率","ドローン",100,"%"),ind("資源自給率","核燃料加工",90,"%"),
  ind("基本","国号の呼称（南西方面）","なかと",""),ind("基本","国号の呼称（北東方面）","ながと",""),ind("経済","巨大財閥・AI産業の経済活動占有率",60,"%"),ind("国際順位","帝永通宝の流通額",5,"位"),ind("地理","森林率",70,"%","帝紀2686年","資料では約70%"),ind("地理","領海・EEZ",620,"万km²","帝紀2686年","資料の基本情報表では領海・EEZを合わせて約620万km²と記載"),ind("社会","官営SNS『電記』普及率",79,"%"),ind("社会","華族人口",4,"万人"),ind("社会","士族人口",360,"万人"),ind("社会","臣民人口",8370,"万人"),ind("社会","行政区表人口合計",9021,"万人","帝紀2686年","概数9000万人との丸め差がある"),ind("財政","歳入総額",200,"兆永"),ind("財政","歳出総額",200,"兆永"),ind("軍事","海軍予算",34,"兆永","帝紀2686年","国家歳出の17%"),ind("軍事","陸軍予算",14,"兆永","帝紀2686年","国家歳出の7%"),ind("軍事","宙軍予算",10,"兆永","帝紀2686年","国家歳出の5%"),ind("軍事","その他国防",8,"兆永","帝紀2686年","国家歳出の4%")
 ];
 c.systems=[
  {id:id(),name:"臣民証 / 國民証",type:"行政・ID",summary:"全国民に交付され、身分証明・旅券・行政サービスを一元管理。基本情報表では『國民証』、社会制度本文では『臣民証』と表記される。",body:"近年はスマートフォン連携が進められ、行政手続きの効率化が進展。"},
  {id:id(),name:"國家貢献度",type:"社会評価・行政",summary:"徴兵成績、公共奉仕、自主納税などを数値化。",body:"各種行政サービスや補助制度の基礎資料として試験導入。"},
  {id:id(),name:"官営SNS『電記』",type:"通信・SNS",summary:"政府運営の独自SNS。普及率79%。",body:"国外SNSを閲覧できるのは士族階級以上。投稿は政府と倫理AIにより監視され、AI判定の電力消費が大きいため日ごとの投稿数制限がある。"},
  {id:id(),name:"身分制度",type:"社会制度",summary:"帝家・華族・士族・臣民の身分制度。",body:"華族約4万人、士族約360万人、臣民約8370万人。血統継承が原則。華族・士族には政治・税・武器所持・教育・住宅・AI利用などの特権がある一方、士族校の厳しい教育や長い兵役など義務も大きい。"},
  {id:id(),name:"二院制帝國議会",type:"政治",summary:"推薦制の上院『士族院』と公選制の下院『臣民院』。",body:"臣民院選挙権は第一次徴兵または志願兵役修了者に限られる。"},
  {id:id(),name:"大本営",type:"安全保障",summary:"皇帝直属。安全保障や戦争に関する最終意思決定へ助言。",body:"海軍・陸軍・宙軍が皇帝の統帥権のもとに置かれる。"},
  {id:id(),name:"第一次・第二次徴兵",type:"徴兵・動員",summary:"平時の第一次徴兵と戦時特例の第二次徴兵。",body:"第一次徴兵は満18～25歳の特例を除く全男子が対象で1～3年。第二次徴兵は第一次徴兵修了後の政府選定対象者。"},
  {id:id(),name:"華族・士族特権",type:"社会制度",summary:"華族・士族に政治・税・武器所持・官位・教育・住宅・AI利用等の特権を付与。",body:"華族には士族院選挙の推薦権、消費免税、官位、大本営への被推薦権、士族権のすべてが与えられる。士族には士族院立候補、銃の所持と携帯、官位授受資格、士族学校入学、専用システムアクセス、優先住宅取得、AI無制限利用、臣民権のすべてが与えられる。"}
 ];
 c.statistics=[
  {id:id(),title:"GDP産業構成",category:"経済",type:"pie",unit:"%",featured:true,labels:c.industries.map(x=>x.name),series:[{name:"構成比",values:c.industries.map(x=>x.share)}]},
  {id:id(),title:"帝紀2686年 歳入",category:"財政",type:"pie",unit:"兆永",featured:true,labels:c.budget.revenue.map(x=>x.name),series:[{name:"歳入",values:[98,56,30,16]}]},
  {id:id(),title:"帝紀2686年 歳出",category:"財政",type:"pie",unit:"兆永",featured:true,labels:c.budget.expenditure.map(x=>x.name),series:[{name:"歳出",values:[66,30,16,28,10,10,4,22,14]}]},
  {id:id(),title:"主要資源自給率",category:"資源",type:"bar",unit:"%",featured:true,labels:["食料","水産物","木材","石炭","石油","天然ガス","鉄鉱石","レアアース","シリコン","ガリウム"],series:[{name:"自給率",values:[72,285,89,58,9,14,24,38,46,76]}]},
  {id:id(),title:"行政区人口",category:"行政",type:"bar",unit:"万人",featured:false,labels:c.administration.regions.map(x=>`${x.state}/${x.name}`),series:[{name:"人口",values:c.administration.regions.map(x=>x.population/10000)}]}
 ];
 c.wikiPages=[
  page("地理","領域・EEZ", "大陸東端の島国。6州と多数の離島からなり、大陸側には傀儡政権や租借地を持つ。",[["国土面積","約62万km²"],["EEZ","約620万km²"],["EEZ順位","世界5位"]],[["概要","EEZは非常に広大で、EEZを含む国家領域は世界第6位規模と記述される。"]],"assets/daieito/p8_img2.png",["地理","EEZ"]),
  page("政治","帝國行政組織", "皇帝・内閣・大本営・帝國議会を中核とする行政組織。",[["国家元首","皇帝"],["立法府","帝國議会"],["上院","士族院"],["下院","臣民院"]],[["概要","平時は帝國議会と内閣が政治を運営。安全保障・戦争では皇帝直属の大本営が助言する。"]],"assets/daieito/p4_img1.png",["政治","行政"]),
  page("軍事","帝國海軍艦隊編成", "海軍を中核とする艦隊編成図。",[["海軍力","世界第3位"]],[["運用思想","本土防衛・敵空母攻撃、海上封鎖、上陸作戦・島嶼防衛、補給、多方面展開を組み合わせる。"]],"assets/daieito/p11_img1.png",["海軍","艦隊"]),
  page("軍事","帝國海軍の艦隊運用", "敵補給路遮断・本土攻撃・島嶼防衛・多方面展開を組み合わせる運用図。",[],[["運用","空母打撃群は制空・上陸支援、敵空母排除は潜水艦隊・駆逐艦隊・長距離打撃部隊を優先。"]],"assets/daieito/p11_img2.png",["海軍","ドクトリン"]),
  page("人口","人口推移・人口ピラミッド", "帝紀2686年前後の人口推移と人口ピラミッド。",[["総人口","約9000万人"],["出生率","1.44"]],[["課題","戦争と少子化の双方による人口減少が進行。60年代には合計特殊出生率1.18を記録したとされる。"]],"assets/daieito/p13_img1.png",["人口","少子化"]),
  page("社会課題","AI需要による電力・半導体不足", "生成AI需要の急増により電力とデータセンター用半導体が不足。",[],[["現状","核融合発電の実用化による解消が期待されるが、戦時下で建設が進んでいない。貿易停止でAI関連産業も停滞。"]],"",["AI","電力"]),
  page("社会課題","石油不足", "禁輸と海上封鎖により石油資源が不足。",[["石油自給率","9%"]],[["背景","帝紀2680年までを期限とした脱石油政策の失敗も重なり、深刻な課題となっている。"]],"",["資源","石油"]),
  page("社会課題","北伐軍の暴走", "大陸の傀儡国に駐在する北伐軍が鉄道利権をめぐり連邦系軍閥と衝突。",[],[["背景","北伐論を唱える陸軍右派が北方警備部隊名目で総督軍から独立し、暴走傾向にある。"]],"",["軍事","政治"]),
  page("社会課題","衛星不足", "開戦後のサイバー攻撃・衛星攻撃で2300機以上の人工衛星を喪失。",[],[["見通し","宙軍は6か月以内に現在状態を維持できなくなる可能性が極めて高いと試算。"]],"",["宇宙","軍事"]),
  page("社会課題","身分制度の限界", "先進国で唯一、臣民に明確な身分制度が残る。",[["華族","4万人"],["士族","360万人"],["臣民","8370万人"]],[["課題","士族の若者を含め身分制廃止を求める声が強まり、『一億平等』への関心が高まっている。政府は國家貢献度を基準にした昇格枠を発表したが反対派の反発も強い。"],["資料上の注意","華族・士族・臣民の人数合計は総人口約9000万人と一致しないため、原資料の値をそのまま保持する。"]],"",["社会","身分制度"]),
  page("財政","帝紀2686年 国家歳入", "歳入総額200兆永。一般税、資金等、国債等で構成される。",[["歳入総額","200兆永"],["一般税","98兆永（49%）"],["資金等","56兆永（28%）"],["国債","30兆永（15%）"],["その他・特殊税等","16兆永（8%）"]],[["内訳","原資料の二重円グラフを画像として保持し、構造化データでは大分類を登録している。"]],"assets/daieito/p6_img1.png",["財政","歳入"]),
  page("財政","帝紀2686年 国家歳出", "歳出総額200兆永。国防33%を最大項目とする。",[["歳出総額","200兆永"],["国防","66兆永（33%）"],["社会保障","30兆永（15%）"],["公共事業・インフラ","28兆永（14%）"],["国債費","22兆永（11%）"]],[["国防内訳","海軍17%、陸軍7%、宙軍5%、その他4%。"],["資料","その他の詳細項目は原資料の二重円グラフを画像として保持している。"]],"assets/daieito/p6_img2.png",["財政","歳出"])
 ];
 c.usagePolicy={...C.defaultUsagePolicy(),appearance:"anyone",creditMode:"optional",creditFormat:"",creditExample:"大永都帝國（MFDCO / NAUKAT設定）",commercialUse:"allow",settingModification:"minor",defeatDestruction:"allow",attributionName:"大永都帝國",otherConditions:"利用条件は運営者が別途設定してください。資料そのものから利用許諾条件は読み取れないため、初期値は仮設定です。",legalNote:"この利用条件は資料記載ではなく、システム初期値です。公開前に必ず確認してください。"};
 c.sources=[{id:id(),title:"大永都帝國とは",type:"PDF",pages:16,author:"NAUKAT",notes:"帝紀2686年の国家設定資料。v8取り込み元。資料内の概数・表・本文に差異がある箇所（総人口約9000万人と行政区合計9021万人、首都圏約1300万人と永京府1582万人、國民証/臣民証、直属島3に対して行政区表で確認できる離島藩2件等）は原資料を優先して併記する。"}];
 c.advanced={...c.advanced,constitution:{...c.advanced.constitution,name:"帝國憲制",humanRightsSummary:"身分制度により権利差が存在。士族・華族に政治・武器所持・教育等の特権がある。",emergencyPowers:"安全保障・戦争の最終意思決定には皇帝直属の大本営が関与。"},governance:{...c.advanced.governance,electionSystem:"士族院は推薦制、臣民院は公選制。臣民院選挙権は第一次徴兵または志願兵役修了者のみ。",pressFreedomScore:null,corruptionScore:null},technology:{...c.advanced.technology,aiIndustryScore:null,supercomputerScore:null,notes:"AI産業世界2位、スパコン演算性能世界1位という順位設定。絶対スコアは資料未記載。"},migration:{...c.advanced.migration,notes:"年間移民・観光客数は資料未記載。"},information:{...c.advanced.information,notes:"官営SNS『電記』を政府と倫理AIが監視。国外SNS閲覧は士族階級以上に限定。"}};
 c.socialPlatforms=[{id:id(),name:"電記",type:"官営SNS",penetrationPct:79,censorship:"政府と倫理AIによる監視。国外SNS閲覧は士族階級以上に限定。",dailyLimit:"AI判定の電力消費増大のため日ごとの投稿数制限あり。",description:"政府アカウントを除く著名アカウントは前首相・歌手・英雄的軍人・スポーツ選手など。"}];
 c.marketDependencies=[{id:id(),name:"石油",tags:"石油, 燃料",dependencyPct:91,productionPct:9,notes:"自給率9%。禁輸・海上封鎖の影響が大きい。"},{id:id(),name:"天然ガス",tags:"天然ガス, LNG",dependencyPct:86,productionPct:14,notes:"EEZ海底ガス田を保有。"},{id:id(),name:"半導体材料",tags:"半導体, AI, 電子",dependencyPct:54,productionPct:46,notes:"シリコン自給率46%。AI需要による不足が社会課題。"},{id:id(),name:"レアアース",tags:"レアアース, レアメタル",dependencyPct:62,productionPct:38,notes:"EEZ海底資源。"},{id:id(),name:"水産物",tags:"食料, 水産",dependencyPct:0,productionPct:100,notes:"自給率285%で輸出産業。"}];
 c.resourceReserves=c.indicators.filter(x=>x.category==="資源自給率").map(x=>({id:id(),name:x.name,selfSufficiencyPct:Number(x.value)||0,reserves:0,unit:"",annualOutput:0,yearsRemaining:0,description:x.notes||""}));
 c._index.completeness=C.calculateCompleteness(c);c._index.strength=C.calculateStrength(c).total;
 return c;
}
window.MFDCODaieitoSample=make;
// ローカルプレビューでは資料サンプルを一度だけ自動追加する。
try{
 const Cloud=window.MFDCOCountryCloud;
 if(location.pathname.endsWith("countries.html") && (!Cloud||!Cloud.ready())){
  const all=C.load();
  if(!all.some(x=>x.code==="NKT"||x.name==="大永都帝國")){C.save(make())}
 }
}catch(e){console.warn("DAIEITO SAMPLE INIT",e)}
})();
