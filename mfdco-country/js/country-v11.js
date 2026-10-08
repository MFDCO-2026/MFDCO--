"use strict";
(function(){
const C=window.MFDCOCountry;
if(!C)return;

const REFERENCE_GUIDES={
 happiness:{label:"国民幸福度",unit:"/10",meaning:"国民が自分の生活を0〜10で評価する主観的幸福度の目安。",japan:"約6前後",strong:"7.0以上",middle:"5〜7",weak:"4未満"},
 hdi:{label:"HDI",unit:"",meaning:"健康・教育・所得をまとめた人間開発の目安。",japan:"約0.9台前半",strong:"0.90以上",middle:"0.70〜0.89",weak:"0.55未満"},
 literacy:{label:"識字率",unit:"%",meaning:"成人の基礎的な読み書き能力の普及度。",japan:"ほぼ100%",strong:"98〜100",middle:"85〜97",weak:"80未満"},
 rnd:{label:"研究開発費/GDP",unit:"%",meaning:"国内総生産のうち研究開発に投入する割合。技術国家ほど高い傾向。",japan:"3%台",strong:"3〜5",middle:"1〜3",weak:"1未満"},
 tax:{label:"税収/GDP",unit:"%",meaning:"経済規模に対する政府の租税収入。社会保険料を含めるかは統計定義に注意。",japan:"30%台の目安",strong:"30〜45",middle:"20〜35",weak:"20未満"},
 social:{label:"社会支出/GDP",unit:"%",meaning:"年金・医療・失業・家族給付など公的社会支出の規模。",japan:"20%台の目安",strong:"20〜30",middle:"10〜20",weak:"10未満"},
 gini:{label:"Gini係数",unit:"",meaning:"所得格差。0に近いほど平等、1に近いほど格差が大きい。",japan:"0.3台前半の目安",strong:"0.25〜0.35",middle:"0.35〜0.45",weak:"0.45超"},
 poverty:{label:"相対的貧困率",unit:"%",meaning:"所得中央値の一定割合未満で暮らす人口の割合。",japan:"10%台の目安",strong:"10未満",middle:"10〜20",weak:"20超"},
 beds:{label:"病床数",unit:"床/1000人",meaning:"人口1000人当たりの病床数。制度差が大きいので単純な優劣ではない。",japan:"10床超",strong:"5〜12",middle:"2〜5",weak:"2未満"},
 doctors:{label:"医師数",unit:"人/1000人",meaning:"人口1000人当たり医師数。",japan:"2〜3程度",strong:"3〜5",middle:"1.5〜3",weak:"1未満"},
 peace:{label:"平和・治安指数",unit:"0-100",meaning:"このツール内の簡易指数。高いほど国内外の安全が高い。",japan:"80前後の目安",strong:"75〜100",middle:"50〜75",weak:"50未満"},
 logistics:{label:"物流力",unit:"0-5",meaning:"税関・交通インフラ・輸送品質・追跡・定時性などの総合目安。",japan:"4前後",strong:"3.8〜5",middle:"2.5〜3.8",weak:"2.5未満"},
 internet:{label:"インターネット普及率",unit:"%",meaning:"人口に占めるインターネット利用者の割合。",japan:"90%超",strong:"90〜100",middle:"60〜90",weak:"50未満"},
 forest:{label:"森林率",unit:"%",meaning:"国土に占める森林面積。高ければ必ず環境政策が優秀という意味ではない。",japan:"約2/3",strong:"国土条件による",middle:"国土条件による",weak:"国土条件による"},
 unemployment:{label:"失業率",unit:"%",meaning:"労働力人口のうち職を探している失業者の割合。",japan:"2〜3%程度",strong:"2〜5",middle:"5〜10",weak:"10超"},
 debt:{label:"政府債務/GDP",unit:"%",meaning:"経済規模に対する政府債務残高。通貨制度や国内保有構造でも持続可能性は変わる。",japan:"200%超の特殊例",strong:"60未満",middle:"60〜120",weak:"120超は要説明"},
 energy:{label:"エネルギー自給率",unit:"%",meaning:"国内で消費する一次エネルギーのうち国内資源で賄える割合。",japan:"低い部類",strong:"80〜100",middle:"30〜80",weak:"30未満"},
 food:{label:"食料自給率",unit:"%",meaning:"国内の食料需要を国内生産でどの程度賄えるか。カロリー・生産額など方式を区別する。",japan:"カロリー基準は40%弱の目安",strong:"80〜100",middle:"40〜80",weak:"40未満"},
 educationSpend:{label:"教育費/GDP",unit:"%",meaning:"GDPに対する政府・公的教育支出の規模。教育制度や私費負担で適正値は変わる。",japan:"3〜4%台の目安",strong:"4〜6",middle:"3〜5",weak:"3未満"},
 tertiary:{label:"高等教育修了率",unit:"%",meaning:"若年成人など対象人口に占める大学・高専等の高等教育修了者の割合。",japan:"50%前後の目安",strong:"45〜70",middle:"20〜45",weak:"20未満"},
 turnout:{label:"投票率",unit:"%",meaning:"有権者に占める投票者の割合。義務投票制では非常に高くなることがある。",japan:"国政選挙で50%台前後が多い",strong:"70以上",middle:"45〜70",weak:"45未満"},
 corruption:{label:"腐敗抑制度",unit:"0-100",meaning:"高いほど公的部門の腐敗が少ないという設定用尺度。実在指標とは名称・年度を区別する。",japan:"70点台の目安",strong:"75〜100",middle:"45〜75",weak:"45未満"},
 press:{label:"報道自由度",unit:"0-100",meaning:"高いほど報道機関が政治・経済・法的圧力を受けにくい設定用尺度。",japan:"60〜70程度の目安",strong:"75〜100",middle:"45〜75",weak:"45未満"},
 crime:{label:"犯罪率",unit:"件/10万人",meaning:"人口10万人当たりの認知犯罪件数。法制度・届出率が国ごとに違うため単純比較に注意。",japan:"比較的低い",strong:"低いほど治安面では良好",middle:"制度差大",weak:"高い場合は治安対策が必要"},
 homicide:{label:"殺人率",unit:"件/10万人",meaning:"人口10万人当たり故意の殺人件数。国際比較で比較的使いやすい治安指標。",japan:"1未満の低水準",strong:"1未満",middle:"1〜5",weak:"5超"},
 powerReserve:{label:"電力予備率",unit:"%",meaning:"最大需要に対して余っている供給能力。低いほど需給逼迫リスクが高い。",japan:"季節により変動",strong:"10以上",middle:"5〜10",weak:"5未満"},
 recycling:{label:"リサイクル率",unit:"%",meaning:"廃棄物のうち再資源化される割合。算定範囲で大きく変わる。",japan:"品目・統計定義で大きく異なる",strong:"50以上",middle:"20〜50",weak:"20未満"},
 civilDefense:{label:"民間防衛カバー率",unit:"%",meaning:"警報・避難計画・訓練・防護施設などの対象となる人口割合。",japan:"直接比較しにくい",strong:"80以上",middle:"40〜80",weak:"40未満"}
}

const MARKET_THEMES=[
 {key:"oil",label:"原油・石油",tags:["石油","石油化学","燃料","海運"],producer:+1,consumer:-1},
 {key:"gas",label:"天然ガス・LNG",tags:["天然ガス","LNG","ガス","化学"],producer:+1,consumer:-1},
 {key:"semiconductor",label:"半導体",tags:["半導体","AI","電子","データセンター","ロボット"],producer:+1,consumer:-.45},
 {key:"ai",label:"AI・計算資源",tags:["AI","人工知能","GPU","データセンター","ソフトウェア"],producer:+1,consumer:-.25},
 {key:"shipping",label:"海運・造船",tags:["海運","造船","港湾","船舶","物流"],producer:+1,consumer:-.15},
 {key:"food",label:"食料・穀物",tags:["食料","農業","小麦","米","穀物","水産"],producer:+1,consumer:-.75},
 {key:"rare",label:"レアメタル・鉱物",tags:["レアアース","レアメタル","リチウム","コバルト","銅","鉱業"],producer:+1,consumer:-.7},
 {key:"defense",label:"防衛・軍需",tags:["軍需","兵器","航空宇宙","造船","ミサイル"],producer:+1,consumer:-.15},
 {key:"green",label:"再生可能エネルギー",tags:["再生可能","太陽光","風力","水力","地熱","蓄電池"],producer:+1,consumer:-.2},
 {key:"tourism",label:"観光・サービス",tags:["観光","航空","ホテル","文化","サービス"],producer:+1,consumer:0},
 {key:"finance",label:"金融・投資",tags:["金融","銀行","証券","投資","保険"],producer:+1,consumer:0},
 {key:"cyber",label:"サイバー・通信",tags:["通信","サイバー","量子通信","ネットワーク","IT"],producer:+1,consumer:-.1}
];


const RESOURCE_THEMES=[
 {key:"oil",label:"原油",tags:["石油","原油","燃料"]},{key:"gas",label:"天然ガス",tags:["天然ガス","LNG"]},{key:"iron",label:"鉄鉱石・鉄鋼",tags:["鉄鉱石","鉄鋼","製鉄"]},{key:"copper",label:"銅",tags:["銅","電線","電子"]},{key:"uranium",label:"ウラン・核燃料",tags:["ウラン","核燃料","原子力"]},{key:"rareearth",label:"レアアース",tags:["レアアース","希土類"]},{key:"lithium",label:"リチウム",tags:["リチウム","蓄電池"]},{key:"grain",label:"穀物・食料",tags:["小麦","米","穀物","食料"]},{key:"silicon",label:"半導体材料",tags:["シリコン","半導体","ガリウム","ゲルマニウム"]},{key:"timber",label:"木材",tags:["木材","林業"]}
];
function monthKey(date=new Date()){return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}`}
function hourKey(date=new Date()){return `${dayKey(date)}T${String(date.getUTCHours()).padStart(2,"0")}`}
function pickDifferent(r,list,avoid=-1){let i=Math.floor(r()*list.length);if(list.length>1&&i===avoid)i=(i+1+Math.floor(r()*(list.length-1)))%list.length;return i}

function avgSet(values,fallback=0){const a=values.filter(v=>v!==null&&v!==undefined&&v!=="").map(Number).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:fallback}
function techLevel(c){return avgSet([c.advanced?.technology?.aiIndustryScore,c.advanced?.technology?.roboticsIndustryScore,c.advanced?.technology?.semiconductorScore,c.advanced?.technology?.supercomputerScore,c.advanced?.technology?.spaceCapabilityScore],C.num(c.science?.level,C.num(c.strength?.manual?.technology,50)))}
function industryLevel(c){const manu=C.num(c.strength?.manual?.industry,50),industrial=C.arr(c.industries).filter(x=>/工業|製造|造船|軍需|半導体|AI|航空|電子|化学|鉄鋼/.test(String(x.name||x))).reduce((a,x)=>a+C.num(x.share,0),0);return Math.max(0,Math.min(100,industrial?Math.max(manu,45+industrial*.8):manu))}
function resourceLevel(c){const vals=C.arr(c.resourceReserves).map(x=>C.num(x.selfSufficiencyPct,NaN)).filter(Number.isFinite);return vals.length?Math.max(0,Math.min(100,vals.reduce((a,b)=>a+b,0)/vals.length)):C.num(c.strength?.manual?.resources,50)}
const MARKET_TRAITS=[
 {key:"technology",label:"技術大国",score:c=>techLevel(c)/100},
 {key:"maritime",label:"海洋・貿易国家",score:c=>Math.min(1.5,(C.num(c.sovereignty?.eezArea)+C.arr(c.ports).length*100000)/(Math.max(1,C.num(c.territory?.area||c.area))*8))},
 {key:"resource",label:"資源自立国家",score:c=>Math.max(C.num(c.energy?.selfSufficiencyPct),C.num(c.food?.selfSufficiencyCaloriePct),resourceLevel(c))/100},
 {key:"industry",label:"工業国家",score:c=>industryLevel(c)/100},
 {key:"finance",label:"金融国家",score:c=>Math.min(1.2,C.arr(c.banks).length*.12+C.arr(c.companies).filter(x=>/金融|銀行|証券|保険/.test(`${x.type||""}${x.productionTags||""}`)).length*.18)},
 {key:"population",label:"人口大国",score:c=>Math.min(1.3,Math.log10(Math.max(1,C.num(c.population)))/9)},
 {key:"military",label:"軍事・軍需国家",score:c=>Math.min(1.4,(C.num(c.military?.personnel)/1000000)+(industryLevel(c)/200))},
 {key:"stability",label:"社会安定国家",score:c=>Math.min(1.2,(C.num(c.welfare?.happinessIndex,5)/10)+(C.num(c.advanced?.social?.peaceIndex,50)/200))}
];
function hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let x=hash(seed)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function dayKey(date=new Date()){return date.toISOString().slice(0,10)}
function epochHour(date=new Date()){return Math.floor(date.getTime()/3600000)}
function eventHourForBlock(block){const r=rng(`MFDCO:MARKET_EVENT:${block}`);return block*6+Math.floor(r()*6)}
function marketRegime(date=new Date()){
 const h=epochHour(date),block=Math.floor(h/6);let current=null,next=null;
 for(let b=block-3;b<=block+2;b++){const eh=eventHourForBlock(b);if(eh<=h&&(current===null||eh>current))current=eh;if(eh>h&&(next===null||eh<next))next=eh}
 if(current===null)current=eventHourForBlock(block-1);if(next===null)next=eventHourForBlock(block+1);
 const r=rng(`MFDCO:MARKET_REGIME:${current}`),i=Math.floor(r()*MARKET_THEMES.length),j=pickDifferent(r,MARKET_THEMES,i),ri=Math.floor(r()*RESOURCE_THEMES.length),rj=pickDifferent(r,RESOURCE_THEMES,ri),ti=Math.floor(r()*MARKET_TRAITS.length);
 return {id:`regime-${current}`,eventHour:current,nextEventHour:next,eventAt:new Date(current*3600000).toISOString(),nextEventAt:new Date(next*3600000).toISOString(),strong:{...MARKET_THEMES[i],strength:.55+r()*.55},weak:{...MARKET_THEMES[j],strength:.45+r()*.45},resourceStrong:{...RESOURCE_THEMES[ri],strength:.5+r()*.5},resourceWeak:{...RESOURCE_THEMES[rj],strength:.4+r()*.45},trait:{...MARKET_TRAITS[ti],strength:.35+r()*.45}}
}
function worldTheme(date=new Date()){const reg=marketRegime(date);return {date:dayKey(date),hour:hourKey(date),strong:reg.strong,weak:reg.weak,trait:reg.trait,eventAt:reg.eventAt,nextEventAt:reg.nextEventAt,regimeId:reg.id}}
function monthlyTheme(date=new Date()){const reg=marketRegime(date);return {month:monthKey(date),strong:reg.strong,weak:reg.weak,resourceStrong:reg.resourceStrong,resourceWeak:reg.resourceWeak,eventAt:reg.eventAt,nextEventAt:reg.nextEventAt,legacyOnly:true}}
function dailyResourceTheme(date=new Date()){const reg=marketRegime(date);return {date:dayKey(date),strong:reg.resourceStrong,weak:reg.resourceWeak,eventAt:reg.eventAt,nextEventAt:reg.nextEventAt}}
function normalizeText(c){return [
 ...C.arr(c.industries).map(x=>`${x.name||x} ${x.share||""}`),...C.arr(c.products),...C.arr(c.resources).map(x=>`${x.name||""} ${x.notes||""}`),
 ...C.arr(c.companies).map(x=>`${x.name||""} ${x.type||""} ${x.productionTags||""} ${x.dependencyTags||""}`),
 c.summary,c.economy?.currencyName,c.energy?.notes,c.food?.notes
].join(" ").toLowerCase()}
function exposureToTheme(c,theme){const text=normalizeText(c);let score=0;for(const t of theme.tags||[]){const re=new RegExp(String(t).toLowerCase(),"g");const m=text.match(re);if(m)score+=Math.min(3,m.length)*.35}for(const d of C.arr(c.marketDependencies)){const tags=String(d.tags||d.name||"").toLowerCase();if((theme.tags||[]).some(t=>tags.includes(String(t).toLowerCase()))){const dep=C.num(d.dependencyPct,0)/100,prod=C.num(d.productionPct,0)/100;score+=prod*C.num(theme.producer,1)+dep*C.num(theme.consumer,-.4)}}return Math.max(-2.5,Math.min(2.5,score))}
function resourceExposure(c,res){const text=normalizeText(c);let v=0;for(const t of res.tags||[]){if(text.includes(String(t).toLowerCase()))v+=.35;for(const x of C.arr(c.resourceReserves)){if(`${x.name||""}`.includes(t)){v+=(C.num(x.selfSufficiencyPct)-50)/100+(C.num(x.annualOutput)>0?.2:0)}}}return Math.max(-1.5,Math.min(1.8,v))}
function hourlySettings(c){const f=c.advanced?.finance||{},legacyAvg=Math.max(.01,C.num(f.averageDailyMovePct,.25)),legacyMax=Math.max(legacyAvg,C.num(f.maxDailyMovePct,1.5)),avg=Math.max(.005,Math.min(.5,C.num(f.averageHourlyMovePct,legacyAvg/4))),max=Math.max(avg*1.8,Math.min(1.5,C.num(f.maxHourlyMovePct,legacyMax/4))),coef=Math.max(.05,Math.min(4,C.num(f.marketCoefficient,1)));return {avg,max,coef}}
function hourlyPulse(c,date=new Date()){const {avg}=hourlySettings(c),r=rng(`MFDCO:HOUR_NOISE:${hourKey(date)}:${c.id}`),normal=((r()+r()+r())/3-.5)*2;return normal*avg*.72}
function preferenceBias(){return 0}
function marketState(c,date=new Date(),context={}){
 const f=c.advanced?.finance||{},reg=marketRegime(date),theme=worldTheme(date),resource=dailyResourceTheme(date),settings=hourlySettings(c),fx0=C.num(f.baseFxPerUsd,c.economy?.currencyBase==="USD"?c.economy?.currencyRate:0),st0=C.num(f.baseStockIndex,0);
 if(!f.autoMarketEnabled)return {enabled:false,date:dayKey(date),month:monthKey(date),hour:hourKey(date),pct:0,fxPct:0,theme,monthTheme:monthlyTheme(date),dailyResource:resource,regime:reg,hourly:0,bias:0,fx:fx0||null,stock:st0||null,baseFx:fx0,baseStock:st0};
 const exp=exposureToTheme(c,reg.strong)-exposureToTheme(c,reg.weak)*.45,resExp=resourceExposure(c,reg.resourceStrong)-resourceExposure(c,reg.resourceWeak)*.4,trait=Math.max(0,C.num(reg.trait.score(c),0)),noise=hourlyPulse(c,date),r=rng(`MFDCO:HOUR_SIGNAL:${hourKey(date)}:${c.id}`);
 const signal=(exp*.14*reg.strong.strength+resExp*.09*reg.resourceStrong.strength+trait*.045*reg.trait.strength)*settings.avg;
 const eventBoost=epochHour(date)===reg.eventHour?((exp*.16+resExp*.1)+(r()-.5)*.15)*settings.avg:0;
 const pct=Math.max(-settings.max,Math.min(settings.max,(noise+signal+eventBoost)*settings.coef));
 const fxNoise=((r()+r())/2-.5)*settings.avg*.22,fxPct=Math.max(-settings.max*.6,Math.min(settings.max*.6,(-pct*.28+fxNoise)));
 return {enabled:true,date:dayKey(date),month:monthKey(date),hour:hourKey(date),pct:Math.round(pct*10000)/10000,fxPct:Math.round(fxPct*10000)/10000,theme,monthTheme:monthlyTheme(date),dailyResource:resource,regime:reg,hourly:noise,bias:0,fx:fx0?fx0*(1+fxPct/100):null,stock:st0?st0*(1+pct/100):null,baseFx:fx0,baseStock:st0,eventActive:epochHour(date)===reg.eventHour}
}
function dailyMove(c,date=new Date()){return marketState(c,date)}
function simulatedMarket(c,date=new Date(),context={}){return marketState(c,date,context)}
function companyMove(c,company,date=new Date()){const m=marketState(c,date);if(!m.enabled)return 0;const settings=hourlySettings(c),strong=m.regime.strong.tags||[],weak=m.regime.weak.tags||[],p=String(company.productionTags||company.products||company.type||"").toLowerCase(),d=String(company.dependencyTags||"").toLowerCase();let ex=0;for(const t of strong){if(p.includes(String(t).toLowerCase()))ex+=.55;if(d.includes(String(t).toLowerCase()))ex-=.25}for(const t of weak){if(p.includes(String(t).toLowerCase()))ex-=.35;if(d.includes(String(t).toLowerCase()))ex+=.12}const r=rng(`MFDCO:COMPANY_HOUR:${hourKey(date)}:${company.id||company.name}`),noise=((r()+r()+r())/3-.5)*2*settings.avg*.85,pct=m.pct*.58+ex*settings.avg*.32+noise;return Math.max(-settings.max*1.65,Math.min(settings.max*1.65,Math.round(pct*10000)/10000))}

function classify(c){const sys=String(c.government?.system||"")+" "+C.arr(c.ideologies).map(x=>x.name||x).join(" ");const authoritarian=/独裁|軍政|一党|全体主義|監視|絶対君主|軍国/.test(sys)?1:0;const gdp=C.num(c.economy?.gdp),pop=Math.max(1,C.num(c.population)),pc=C.num(c.economy?.gdpPerCapita)||(gdp?gdp/pop:0);const tech=techLevel(c),industry=industryLevel(c),strength=C.calculateStrength(c).total;const resource=Math.max(C.num(c.energy?.selfSufficiencyPct),C.num(c.food?.selfSufficiencyCaloriePct),resourceLevel(c));const war=C.arr(c.socialIssues).some(x=>/戦争|紛争|封鎖|動員|侵攻/.test(`${x.name||""}${x.summary||""}`))||C.arr(c.disputes).some(x=>/戦争|交戦|占領|紛争/.test(`${x.status||""}${x.summary||""}`));const debt=C.num(c.advanced?.fiscal?.debtGdpPct,0);const stressed=(C.num(c.economy?.growthRate,0)<-1)||(C.num(c.economy?.unemploymentRate,0)>10)||debt>150;return {authoritarian,pc,tech,industry,strength,resource,war,stressed,wealth:pc>45000?"high":pc>15000?"mid":"low"}}
function getPath(obj,path){return path.split(".").reduce((o,k)=>o?.[k],obj)}
function setPath(obj,path,value){const p=path.split(".");let o=obj;for(const k of p.slice(0,-1))o=o[k]??={};o[p.at(-1)]=value}
function blank(v,zeroBlank=false){return v===null||v===undefined||v===""||(zeroBlank&&Number(v)===0)}
function autofill(c){const a=classify(c),changed=[],notes=[];const set=(path,value,why,{zeroBlank=true}={})=>{if(blank(getPath(c,path),zeroBlank)){setPath(c,path,value);changed.push(path);notes.push({path,value,why})}};
 set("advanced.civilization.yearEquivalent",Math.round(1900+(a.tech/100)*145),`技術力 ${a.tech} を基準に史実相当年を推定`);
 set("advanced.fiscal.taxRevenueGdpPct",a.wealth==="high"?34:a.wealth==="mid"?27:20,"所得水準から一般的な政府徴収規模を補完");
 set("advanced.fiscal.debtGdpPct",a.war?105:a.wealth==="high"?75:a.wealth==="mid"?60:45,"戦時状態と所得水準から暫定推定");
 set("advanced.fiscal.deficitGdpPct",a.war?-7:a.wealth==="low"?-5:-3,"平時/戦時と経済力から暫定推定",{zeroBlank:false});
 set("advanced.education.spendingGdpPct",a.wealth==="high"?4.8:a.wealth==="mid"?4.1:3.2,"所得水準から教育投資を補完");
 set("advanced.education.literacyPct",a.wealth==="high"?99:a.wealth==="mid"?91:74,"所得・教育水準から識字率を補完");
 set("advanced.education.tertiaryAttainmentPct",a.wealth==="high"?46:a.wealth==="mid"?25:10,"所得・教育水準から高等教育修了率を補完");
 set("science.rndGdpPct",a.tech>=80?3.6:a.tech>=60?2.1:a.tech>=40?1.1:.5,"技術力から研究開発投資を補完");
 set("advanced.social.socialSpendingGdpPct",a.stressed?(a.wealth==="high"?16:a.wealth==="mid"?10:5):(a.wealth==="high"?22:a.wealth==="mid"?14:7),a.stressed?"財政・景気の不安定さを考慮して福祉支出を抑えた仮値":"経済力に応じた福祉支出を補完");
 set("advanced.social.povertyPct",a.wealth==="high"?12:a.wealth==="mid"?20:34,"所得水準から相対的な貧困規模を補完");
 set("advanced.social.gini",a.authoritarian?.42:a.wealth==="high"?.33:a.wealth==="mid"?.39:.46,"政体と所得水準から格差を補完");
 set("welfare.happinessIndex",Math.max(2.5,Math.min(8.1,(a.wealth==="high"?6.6:a.wealth==="mid"?5.6:4.5)-(a.war?.7:0)-(a.authoritarian?.35:0))),"所得・戦争・政体から幸福度の空欄を補完");
 set("advanced.social.hospitalBedsPer1000",a.wealth==="high"?5.8:a.wealth==="mid"?3.2:1.4,"医療供給能力を所得水準から補完");
 set("advanced.social.doctorsPer1000",a.wealth==="high"?3.2:a.wealth==="mid"?2.0:.8,"医療供給能力を所得水準から補完");
 set("advanced.social.peaceIndex",Math.max(20,Math.min(95,78-(a.war?28:0)-(a.authoritarian?8:0))),"戦争状態・政体から治安/平和度を補完");
 set("advanced.information.informationWarfareScore",a.authoritarian?Math.min(95,60+a.tech*.3):Math.min(90,35+a.tech*.4),"独裁・監視体制と技術力から情報戦能力を補完");
 set("advanced.information.counterIntelligenceScore",a.authoritarian?Math.min(95,58+a.tech*.32):Math.min(90,42+a.tech*.35),"政体と技術力から防諜能力を補完");
 set("advanced.information.cyberDefenseScore",Math.min(96,25+a.tech*.65),"技術力からサイバー防御能力を補完");
 set("advanced.finance.policyRatePct",a.wealth==="high"?2:a.wealth==="mid"?4:7,"経済水準から政策金利の仮値を補完");
 set("advanced.finance.inflationTargetPct",2,"一般的な物価安定目標として仮置き");
 set("advanced.labor.unemploymentPct",C.num(c.economy?.unemploymentRate)|| (a.wealth==="high"?4:a.wealth==="mid"?7:11),"経済力から失業率を補完");
 set("advanced.labor.participationPct",a.wealth==="high"?64:a.wealth==="mid"?60:55,"労働参加率を補完");
 set("advanced.environment.forestPct",35,"地理情報がないため世界観用の中立的仮値");
 set("advanced.infrastructure.logisticsIndex",a.tech>=80?4.1:a.tech>=60?3.4:a.tech>=40?2.8:2.2,"技術・産業基盤から物流力を補完");
 set("advanced.technology.aiIndustryScore",Math.min(100,a.tech+(a.industry-50)*.25),"技術力と産業基盤からAI産業を補完");
 set("advanced.technology.roboticsIndustryScore",Math.min(100,a.tech*.85+a.industry*.15),"技術力と産業基盤からロボット産業を補完");
 set("advanced.finance.centralBank",c.economy?.currencyName?`${c.economy.currencyName}中央銀行（仮称）`:"中央銀行（自動補完）","独自通貨の運営主体として仮置き",{zeroBlank:false});
 const addRows=(path,rows,why)=>{if(C.arr(getPath(c,path)).length===0){const made=rows.map(r=>({id:C.uid(),autoGenerated:true,autoReason:why,...r}));setPath(c,path,made);changed.push(path);notes.push({path,value:`${made.length}件`,why})}};
 addRows("taxation.taxes",[
  {name:"所得税",type:"直接税",rate:a.wealth==="high"?25:a.wealth==="mid"?18:10,base:"個人所得",notes:"自動補完。累進税率の代表値として扱う。"},
  {name:"法人税",type:"直接税",rate:a.wealth==="high"?24:a.wealth==="mid"?26:20,base:"法人所得",notes:"自動補完。"},
  {name:"消費税・付加価値税",type:"間接税",rate:a.wealth==="high"?10:a.wealth==="mid"?8:5,base:"消費",notes:"自動補完。"}
 ],"経済水準から最低限の税制を仮置き");
 addRows("welfarePrograms",[
  {name:"公的医療保障",type:"医療",coveragePct:a.wealth==="high"?98:a.wealth==="mid"?75:45,budget:0,description:"自動補完された基本制度。"},
  {name:"公的年金",type:"年金",coveragePct:a.wealth==="high"?92:a.wealth==="mid"?65:30,budget:0,description:"自動補完された基本制度。"},
  {name:"失業・生活支援",type:"失業",coveragePct:a.wealth==="high"?75:a.wealth==="mid"?45:20,budget:0,description:"自動補完された基本制度。"}
 ],"所得水準と社会支出から最低限の福祉制度を補完");
 addRows("policeOrganizations",[
  {name:"国家警察",type:"一般警察",personnel:0,jurisdiction:"全国",powers:"治安・捜査・交通・警備",description:"自動補完。名称・権限は世界観に合わせて変更してください。"},
  ...(a.authoritarian?[{name:"国内保安局",type:"公安・治安機関",personnel:0,jurisdiction:"全国",powers:"防諜・反体制活動監視",description:"統制的な政体から自動補完。不要なら削除してください。"}]:[])
 ],"政体に応じた基本的な警察・保安組織を仮置き");
 addRows("securityPrograms",[
  {name:"国家サイバー防御計画",type:"サイバー",agency:"情報・通信担当機関",score:Math.round(C.num(c.advanced?.information?.cyberDefenseScore,50)),description:"自動補完。"},
  {name:"防諜保全制度",type:"防諜",agency:"情報機関・警察",score:Math.round(C.num(c.advanced?.information?.counterIntelligenceScore,50)),description:"自動補完。"}
 ],"情報戦・防諜能力値から最低限の安全保障制度を補完");
 if(C.arr(c.socialIssues).length===0){const issues=[];if(C.num(c.demographics?.fertilityRate)>0&&C.num(c.demographics.fertilityRate)<1.6)issues.push({id:C.uid(),name:"少子化・人口構造",category:"人口",severity:"高",affectedPopulation:0,trend:"悪化",summary:"低い出生率から自動検出。",autoGenerated:true});if(C.num(c.energy?.selfSufficiencyPct)>0&&C.num(c.energy.selfSufficiencyPct)<30)issues.push({id:C.uid(),name:"エネルギー輸入依存",category:"資源・エネルギー",severity:"高",affectedPopulation:0,trend:"横ばい",summary:"低いエネルギー自給率から自動検出。",autoGenerated:true});if(C.num(c.advanced?.fiscal?.debtGdpPct)>150)issues.push({id:C.uid(),name:"高水準の政府債務",category:"財政",severity:"高",affectedPopulation:0,trend:"横ばい",summary:"政府債務/GDPから自動検出。",autoGenerated:true});if(issues.length){c.socialIssues=issues;changed.push("socialIssues");notes.push({path:"socialIssues",value:`${issues.length}件`,why:"既存統計から代表的な社会課題を自動検出"})}}
 c.autofill={lastRun:new Date().toISOString(),fields:[...new Set([...(c.autofill?.fields||[]),...changed])],notes};return {changed,notes,classification:a}}
function guide(key){return REFERENCE_GUIDES[key]||null}
window.MFDCOCountryV11={REFERENCE_GUIDES,MARKET_THEMES,RESOURCE_THEMES,MARKET_TRAITS,dayKey,monthKey,hourKey,marketRegime,worldTheme,monthlyTheme,dailyResourceTheme,exposureToTheme,resourceExposure,hourlySettings,hourlyPulse,marketState,dailyMove,simulatedMarket,companyMove,classify,autofill,guide};
})();
