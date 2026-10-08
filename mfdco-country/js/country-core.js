"use strict";
(function(){
const STORAGE_KEY="mfdco.countries.v11";
const LEGACY_KEYS=["mfdco.countries.v10","mfdco.countries.v9","mfdco.countries.v8","mfdco.countries.v7","mfdco.countries.v6","mfdco.countries.v5","mfdco.countries.v4"];
const MEDIA_KEY="mfdco.country.media.v11";
const LEGACY_MEDIA_KEYS=["mfdco.country.media.v10","mfdco.country.media.v9","mfdco.country.media.v8","mfdco.country.media.v7","mfdco.country.media.v6"];
const CURRENT_KEY="mfdco.country.current";
const VERSION=13;
const uid=()=>globalThis.crypto?.randomUUID?crypto.randomUUID():`id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
const clone=o=>JSON.parse(JSON.stringify(o??null));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const arr=v=>Array.isArray(v)?v:[];
const str=v=>v==null?"":String(v);
function fmtNum(v,opt={}){const n=num(v,NaN);if(!Number.isFinite(n))return "—";return new Intl.NumberFormat("ja-JP",opt).format(n)}
function fmtPopulationMan(v){const n=num(v,NaN);if(!Number.isFinite(n))return "—";return `${new Intl.NumberFormat("ja-JP",{maximumFractionDigits:1}).format(n/10000)}万人`}
function fmtMoney(v,unit=""){return `${fmtNum(v,{maximumFractionDigits:2})}${unit?` ${unit}`:""}`}
function formatDate(v){if(!v)return "—";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat("ja-JP",{dateStyle:"medium"}).format(d)}
function slugify(s){return str(s).trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9\-ぁ-んァ-ヶ一-龠]/g,"").slice(0,64)}
function autoUtcFromLongitude(longitude){if(longitude===null||longitude===undefined||longitude==="")return null;const x=Number(longitude);if(!Number.isFinite(x))return null;return Math.max(-12,Math.min(14,Math.round(x/15)))}
function standardMeridianFromUtc(offset){if(offset===null||offset===undefined||offset==="")return null;const x=Number(offset);return Number.isFinite(x)?x*15:null}
function utcLabel(offset){if(offset===null||offset===undefined||offset==="")return "未設定";const n=Number(offset);if(!Number.isFinite(n))return "未設定";const sign=n>=0?"+":"-";const a=Math.abs(n),h=Math.floor(a),m=Math.round((a-h)*60);return `UTC${sign}${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`}
function defaultUsagePolicy(){return {
 appearance:"anyone",creditMode:"optional",creditFormat:"",creditExample:"",
 commercialUse:"allow",commercialNotes:"",settingModification:"unlimited",settingModificationNotes:"",
 defeatDestruction:"allow",defeatNotes:"",flagUse:"allow",anthemUse:"allow",
 attributionName:"",requestUrl:"",otherConditions:"",legalNote:""
}}
function defaultCountry(){const id=uid();return {
 id,slug:"",name:"新しい国家",shortName:"",englishName:"",code:"",summary:"",isPublic:false,tags:[],schemaVersion:VERSION,
 createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
 media:{flagKey:"",emblemKey:"",coverKey:"",mapKey:"",anthemKey:"",capitalImageKey:""},
 presentation:{youtubeUrl:"",externalLinks:[]},
 mediaDistribution:{defaultAccess:"deny",defaultTerms:"",requestNote:""},
 nationalSymbols:{flagName:"",emblemName:"",anthemName:"",motto:""},foundation:{label:"",gregorianYear:null,notes:""},
 identity:{demonym:"",officialScript:"",largestCity:"",callingCode:"",internetTld:"",drivingSide:"left",dateFormat:"",countryNumber:""},
 capital:{name:"",summary:"",population:0,imageKey:""},
 sovereignty:{status:"主権国家",recognizedBy:"",territorialWatersKm:12,eezArea:0},
 population:0,populationYear:"",populationGroups:{children:0,working:0,elderly:0},
 demographics:{density:0,urbanizationPct:0,fertilityRate:0,populationGrowthPct:0,lifeExpectancyMale:0,lifeExpectancyFemale:0},
 area:0,territory:{area:0,landArea:0,waterArea:0,eezArea:0,coastlineKm:0},
 timekeeping:{referenceCity:"",latitude:null,longitude:null,standardMeridian:null,utcMode:"auto",utcOffset:null,timezoneName:"",notes:""},
 government:{system:"",headOfState:"",headOfGovernment:"",legislature:"",judiciary:"",rulingParties:[]},
 economy:{gdp:0,gdpYear:"",gdpPerCapita:0,currencyName:"",currencyCode:"",currencyMode:"independent",currencyRate:0,currencyBase:"USD",growthRate:0,unemploymentRate:0,inflationRate:0,debt:0},
 taxation:{summary:"",taxes:[]},
 budget:{year:"",revenue:[],expenditure:[]},industries:[],products:[],resources:[],trade:{exports:[],imports:[]},
 food:{year:"",selfSufficiencyCaloriePct:0,selfSufficiencyProductionValuePct:0,selfSufficiencyIntakePct:0,targetPct:0,arableLandPct:0,strategicReserveDays:0,stapleFoods:[],notes:""},
 energy:{year:"",selfSufficiencyPct:0,renewablePct:0,notes:"",sources:[]},
 climate:{zones:[],avgTemp:"",rainfall:"",notes:"",monthlyTemps:Array(12).fill(null),monthlyRainfall:Array(12).fill(null)},culture:{languages:[],religions:[],ethnicGroups:[],holidays:[],food:[],arts:[],sports:[],notes:""},
 infrastructure:{railKm:0,roadKm:0,ports:0,airports:0,internetPct:0,electricityTwh:0,renewablePct:0},
 welfare:{literacyPct:0,lifeExpectancy:0,healthcare:"",education:"",happinessIndex:null,happinessRank:null,democracyIndex:null,pressFreedomRank:null,corruptionIndex:null,equalityIndex:null,hdi:null},security:{police:"",intelligence:"",emergency:""},science:{level:50,rndGdpPct:0,space:"",nuclear:""},
 advanced:{
  civilization:{yearEquivalent:null,notes:""},
  constitution:{name:"",enacted:"",effective:"",preamble:"",amendmentRule:"",emergencyPowers:"",humanRightsSummary:"",notes:""},
  governance:{corruptionScore:null,pressFreedomScore:null,electionSystem:"",votingAge:null,turnoutPct:null,judicialIndependence:null,ruleOfLaw:null,governmentEffectiveness:null,notes:""},
  territorialControl:{controlledPct:null,description:""},
  fiscal:{taxRevenueGdpPct:null,deficitGdpPct:null,debtGdpPct:null,debtAmount:null,interestExpensePct:null,notes:""},
  education:{spendingGdpPct:null,spendingBudgetPct:null,literacyPct:null,primaryEnrollmentPct:null,secondaryEnrollmentPct:null,tertiaryAttainmentPct:null,researchersPerMillion:null,brainDrainIndex:null,notes:""},
  social:{socialSpendingGdpPct:null,povertyPct:null,gini:null,hospitalBedsPer1000:null,doctorsPer1000:null,crimeRatePer100k:null,homicideRatePer100k:null,peaceIndex:null,trustGovernmentPct:null,trustPolicePct:null,trustMilitaryPct:null,civilDefenseCoveragePct:null,shelterCoveragePct:null,notes:""},
  finance:{centralBank:"",centralBankIndependence:null,policyRatePct:null,inflationTargetPct:null,fxRegime:"",baseFxPerUsd:null,stockIndexName:"",baseStockIndex:null,stockAverageName:"主要企業平均",autoMarketEnabled:false,averageHourlyMovePct:0.06,maxHourlyMovePct:0.35,averageDailyMovePct:0.25,maxDailyMovePct:1.5,marketCoefficient:1,anchorDate:"",fdiInUsd:null,fdiOutUsd:null,investmentGdpPct:null,capitalControls:"",notes:""},
  labor:{participationPct:null,employmentPct:null,unemploymentPct:null,minimumWageUsd:null,averageWageUsd:null,averageHoursWeek:null,notes:""},
  resources:{waterSecurityPct:null,fishSelfSufficiencyPct:null,fisheriesOutput:null,strategicOilDays:null,strategicGasDays:null,strategicCoalDays:null,powerReserveMarginPct:null,outageHoursYear:null,outageCountYear:null,notes:""},
  environment:{ghgMtCo2e:null,co2PerCapita:null,netZeroYear:null,ndcTarget:"",pm25:null,forestPct:null,recyclingPct:null,wastePerCapitaKg:null,waterPollutionIndex:null,notes:""},
  infrastructure:{roadKm:null,expresswayKm:null,railKm:null,railElectrificationPct:null,highSpeedRailKm:null,logisticsIndex:null,waterCoveragePct:null,sewerageCoveragePct:null,notes:""},
  migration:{immigrantsAnnual:null,emigrantsAnnual:null,refugeesAnnual:null,touristsAnnual:null,tourismRevenueUsd:null,notes:""},
  technology:{aiIndustryScore:null,roboticsIndustryScore:null,semiconductorScore:null,supercomputerScore:null,spaceCapabilityScore:null,notes:""},
  information:{informationWarfareScore:null,counterIntelligenceScore:null,assassinationDefenseScore:null,cyberDefenseScore:null,propagandaScore:null,notes:""},
  foreignPolicy:{openness:"balanced",notes:""}
 },
 administration:{summary:"",ministries:[],laws:[],regions:[]},cities:[],companies:[],parties:[],indicators:[],socialIssues:[],
 chronology:{currentGregorian:new Date().getFullYear(),calendars:[]},eras:[],historyMajorPeriods:[],historyMinorPeriods:[],regnalEras:[],timeline:[],posts:[],
 military:{budget:0,budgetYear:"",budgetCurrency:"",budgetUsdEquivalent:0,personnel:0,reservePersonnel:0,paramilitaryPersonnel:0,conscription:"",nuclearWarheads:0,doctrine:"",commanderInChief:"",headquarters:"",branches:[],units:[],equipment:[],namingRules:[],serviceTypes:[]},
 usagePolicy:defaultUsagePolicy(),wikiPages:[],statistics:[],mapPoints:[],systems:[],organizations:[],officialEquipment:[],relations:[],sources:[],highways:[],railways:[],
 territories:[],disputes:[],borders:[],overseasBases:[],universities:[],researchInstitutions:[],welfarePrograms:[],policies:[],opinionPolls:[],protests:[],trustMetrics:[],equalityMetrics:[],policeOrganizations:[],criminalOrganizations:[],ideologies:[],securityPrograms:[],banks:[],conglomerates:[],resourceReserves:[],environmentalIssues:[],sdgGoals:[],ports:[],airports:[],heritageSites:[],socialPlatforms:[],marketDependencies:[],
 autofill:{lastRun:"",fields:[],notes:[]},
 strength:{manual:{technology:50,industry:50,resources:50,administration:50,diplomacy:50,logistics:50,foodSecurity:50,energySecurity:50},last:null},
 _index:{strength:0,completeness:0}
}}
function japanSample(){const c=defaultCountry();Object.assign(c,{name:"日本国",shortName:"日本",englishName:"Japan",code:"JPN",slug:"japan",summary:"東アジアに位置する島国。現代日本を参考にした国家設定テンプレートです。公開統計を土台に、架空国家へ編集できます。",isPublic:true,tags:["現代","島国","先進国"],population:122650000,populationYear:"2026-09",area:377975});
c.capital={name:"東京都",summary:"事実上の首都。政治・経済・文化の中枢。",population:0,imageKey:""};
c.sovereignty={status:"主権国家",recognizedBy:"国際的承認",territorialWatersKm:12,eezArea:4470000};
c.territory={area:377975,landArea:364546,waterArea:13429,eezArea:4470000,coastlineKm:35000};
c.timekeeping={referenceCity:"東京",latitude:35.6895,longitude:139.6917,standardMeridian:135,utcMode:"manual",utcOffset:9,timezoneName:"日本標準時（JST）",notes:"標準時子午線は東経135度。"};
c.government={system:"議院内閣制・立憲君主制",headOfState:"天皇",headOfGovernment:"内閣総理大臣",legislature:"国会（衆議院・参議院）",judiciary:"最高裁判所を頂点とする司法制度",rulingParties:["自由民主党","日本維新の会"]};
c.economy={gdp:672700000000000,gdpYear:"2025年度",gdpPerCapita:0,currencyName:"日本円",currencyCode:"JPY",currencyMode:"JPY",currencyRate:1,currencyBase:"JPY",growthRate:0,unemploymentRate:0,inflationRate:0,debt:0};
c.budget={year:"2026年度",revenue:[{id:uid(),name:"租税及印紙収入",value:83370000000000},{id:uid(),name:"公債金",value:29200000000000},{id:uid(),name:"その他収入",value:8109200000000}],expenditure:[{id:uid(),name:"社会保障",value:39000000000000},{id:uid(),name:"国債費",value:31000000000000},{id:uid(),name:"地方交付税等",value:20000000000000},{id:uid(),name:"防衛関係費",value:9000000000000},{id:uid(),name:"公共事業等",value:9000000000000},{id:uid(),name:"教育・科学等",value:6000000000000},{id:uid(),name:"その他",value:8309200000000}]};
c.food={year:"2025年度（令和7年度）",selfSufficiencyCaloriePct:37,selfSufficiencyProductionValuePct:66,selfSufficiencyIntakePct:45,targetPct:45,arableLandPct:0,strategicReserveDays:0,stapleFoods:["米","小麦","大豆"],notes:"食料自給率は農林水産省公表値を参考にしたサンプル。"};
c.climate={zones:["温暖湿潤気候","亜寒帯湿潤気候","亜熱帯"],avgTemp:"地域差が大きい",rainfall:"梅雨・台風を含む多雨地域",notes:"南北に長く、北海道から南西諸島まで複数の気候帯を持つ。"};c.products=["自動車","電子機器","工作機械","食品","水産物","伝統工芸品"];
c.industries=[{name:"製造業",share:20},{name:"サービス業",share:70},{name:"農林水産業",share:1}];c.populationGroups={children:13800000,working:73700000,elderly:36200000};
c.military={budget:9000000000000,budgetYear:"2026年度",personnel:217701,doctrine:"専守防衛を基本とする防衛政策",commanderInChief:"内閣総理大臣",branches:[{id:uid(),name:"陸上自衛隊",type:"陸軍",personnel:129176,budget:0,commander:"陸上幕僚長",authority:"防衛大臣の指揮監督"},{id:uid(),name:"海上自衛隊",type:"海軍",personnel:41463,budget:0,commander:"海上幕僚長",authority:"防衛大臣の指揮監督"},{id:uid(),name:"航空自衛隊",type:"空軍",personnel:42324,budget:0,commander:"航空幕僚長",authority:"防衛大臣の指揮監督"}],units:[],equipment:[],namingRules:[]};
c.chronology={currentGregorian:2026,calendars:[{id:uid(),name:"令和",startYear:2019,prefix:"令和",suffix:"年"},{id:uid(),name:"平成",startYear:1989,endYear:2019,prefix:"平成",suffix:"年"}]};
c.eras=[{id:uid(),name:"古代",startYear:-10000,endYear:1185},{id:uid(),name:"中世",startYear:1185,endYear:1603},{id:uid(),name:"近世",startYear:1603,endYear:1868},{id:uid(),name:"近代",startYear:1868,endYear:1945},{id:uid(),name:"現代",startYear:1945,endYear:null}];
c.timeline=[{id:uid(),date:"1868",year:1868,era:"近代",title:"明治維新",summary:"近代国家形成の大きな転換点。",body:"",imageKey:""},{id:uid(),date:"1947-05-03",year:1947,era:"現代",title:"日本国憲法施行",summary:"現行憲法が施行された。",body:"",imageKey:""}];
c.administration.regions=["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"].map(name=>({id:uid(),name,capital:"",population:0,area:0,summary:"",specialties:[],culture:"",heritage:[],industries:[],climate:"",latitude:null,longitude:null,imageKey:""}));
c.cities=[{id:uid(),name:"東京",type:"首都・大都市",regionId:"",population:0,latitude:35.6895,longitude:139.6917,summary:"政治・経済・文化の中枢。",imageKey:""}];
c.administration.laws=[{id:uid(),name:"日本国憲法",year:1946,status:"施行中",summary:"国の基本法。"}];
c.usagePolicy={...defaultUsagePolicy(),appearance:"anyone",creditMode:"optional",commercialUse:"allow",settingModification:"minor",defeatDestruction:"allow",attributionName:"日本国",creditExample:"『日本国』を作品設定として使用（MFDCO国家運営ページ参照）",legalNote:"このテンプレートの利用条件はサンプルです。実在国そのものに対する権利許諾を意味しません。"};
c.wikiPages=[{id:uid(),type:"都市・首都",title:"東京都",summary:"日本の首都機能が集中する大都市圏。",imageKey:"",facts:[{key:"区分",value:"都"}],sections:[{title:"概要",body:"政治・経済・文化の中心。"}],tags:["都市"],related:[]},{id:uid(),type:"法律・制度",title:"日本国憲法",summary:"日本の現行憲法。",imageKey:"",facts:[{key:"施行",value:"1947年5月3日"}],sections:[{title:"概要",body:"国民主権、基本的人権の尊重、平和主義などを基本原理とする。"}],tags:["法律"],related:[]}];
return c}
function readFirst(keys){for(const k of keys){try{const v=JSON.parse(localStorage.getItem(k)||"null");if(Array.isArray(v)&&v.length)return v}catch{}}return []}
function load(){let data=[];try{data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{}if(!Array.isArray(data)||!data.length){data=readFirst(LEGACY_KEYS);if(!data.length)data=[japanSample()];saveAll(data.map(migrate))}return data.map(migrate)}
function migrate(c){const d=defaultCountry();const out={...d,...c};for(const k of ["media","presentation","mediaDistribution","nationalSymbols","foundation","identity","capital","sovereignty","territory","timekeeping","government","economy","taxation","budget","food","energy","climate","culture","infrastructure","welfare","security","science","administration","trade","military","strength","chronology","usagePolicy","demographics","_index"]){out[k]={...d[k],...(c?.[k]||{})}};out.advanced={...d.advanced,...(c?.advanced||{})};for(const k of Object.keys(d.advanced)){if(d.advanced[k]&&typeof d.advanced[k]==="object"&&!Array.isArray(d.advanced[k]))out.advanced[k]={...d.advanced[k],...(c?.advanced?.[k]||{})}};out.autofill={...d.autofill,...(c?.autofill||{})};for(const k of ["tags","industries","products","resources","cities","companies","parties","indicators","socialIssues","eras","historyMajorPeriods","historyMinorPeriods","regnalEras","timeline","posts","wikiPages","statistics","mapPoints","systems","organizations","officialEquipment","relations","sources","territories","disputes","borders","overseasBases","universities","researchInstitutions","welfarePrograms","policies","opinionPolls","protests","trustMetrics","equalityMetrics","policeOrganizations","criminalOrganizations","ideologies","securityPrograms","banks","conglomerates","resourceReserves","environmentalIssues","sdgGoals","ports","airports","highways","railways","heritageSites","socialPlatforms","marketDependencies"]){out[k]=arr(c?.[k])}for(const k of ["ministries","laws","regions"]){out.administration[k]=arr(c?.administration?.[k]).map(r=>k==="regions"?{state:"",specialties:[],heritage:[],industries:[],culture:"",climate:"",latitude:null,longitude:null,imageKey:"",...r}:r)}for(const k of ["branches","units","equipment","namingRules","serviceTypes"]){out.military[k]=arr(c?.military?.[k])}out.posts=out.posts.map(p=>({summary:"",details:"",url:"",imageKey:"",published:true,...p}));
out.taxation.taxes=arr(c?.taxation?.taxes);out.energy.sources=arr(c?.energy?.sources);out.socialIssues=arr(c?.socialIssues);out.culture.ethnicGroups=arr(c?.culture?.ethnicGroups);const fin=out.advanced?.finance||{};if(c?.advanced?.finance?.averageHourlyMovePct===undefined)fin.averageHourlyMovePct=Math.max(.02,Math.min(.18,num(fin.averageDailyMovePct,.25)/4));if(c?.advanced?.finance?.maxHourlyMovePct===undefined)fin.maxHourlyMovePct=Math.max(.12,Math.min(.75,num(fin.maxDailyMovePct,1.5)/4));if(!fin.stockAverageName)fin.stockAverageName="主要企業平均";
out.climate.monthlyTemps=Array.from({length:12},(_,i)=>c?.climate?.monthlyTemps?.[i]??null);out.climate.monthlyRainfall=Array.from({length:12},(_,i)=>c?.climate?.monthlyRainfall?.[i]??null);
out.schemaVersion=VERSION;if(out.timekeeping.utcMode==="auto"&&out.timekeeping.longitude!==null&&out.timekeeping.longitude!==""){out.timekeeping.utcOffset=autoUtcFromLongitude(out.timekeeping.longitude);out.timekeeping.standardMeridian=standardMeridianFromUtc(out.timekeeping.utcOffset)}return out}
function saveAll(items){localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}
function save(country){const items=load(),i=items.findIndex(x=>x.id===country.id);country.updatedAt=new Date().toISOString();country.schemaVersion=VERSION;if(country.timekeeping?.utcMode==="auto"&&country.timekeeping.longitude!==null&&country.timekeeping.longitude!==""){country.timekeeping.utcOffset=autoUtcFromLongitude(country.timekeeping.longitude);country.timekeeping.standardMeridian=standardMeridianFromUtc(country.timekeeping.utcOffset)}country._index=country._index||{};const st=calculateStrength(country);country._index.strength=st.total;country._index.completeness=calculateCompleteness(country);country.strength.last=st;if(i>=0)items[i]=clone(country);else items.unshift(clone(country));saveAll(items);return country}
function remove(id){saveAll(load().filter(c=>c.id!==id));if(localStorage.getItem(CURRENT_KEY)===id)localStorage.removeItem(CURRENT_KEY)}
function currentId(){const q=new URLSearchParams(location.search);return q.get("id")||localStorage.getItem(CURRENT_KEY)||load()[0]?.id||""}
function setCurrent(id){if(id)localStorage.setItem(CURRENT_KEY,id)}
function get(id=currentId()){const c=load().find(x=>x.id===id)||load()[0]||defaultCountry();setCurrent(c.id);return clone(c)}
function media(){for(const key of [MEDIA_KEY,...LEGACY_MEDIA_KEYS]){try{const x=JSON.parse(localStorage.getItem(key)||"{}");if(x&&Object.keys(x).length)return x}catch{}}return {}}
function mediaUrl(key){if(!key)return "";return media()[key]?.data||key}
function storeMedia(file,slot="file"){return new Promise((resolve,reject)=>{if(!file)return resolve("");if(file.size>25*1024*1024)return reject(new Error("1ファイル25MiBを超えています"));const r=new FileReader();r.onerror=()=>reject(r.error);r.onload=()=>{const key=`local/${Date.now()}_${uid()}_${file.name}`;const all=media();all[key]={data:r.result,type:file.type,name:file.name,size:file.size,slot};try{localStorage.setItem(MEDIA_KEY,JSON.stringify(all))}catch{return reject(new Error("ローカル保存容量を超えました。本番ではSupabase Storageを使用します。"))}resolve(key)};r.readAsDataURL(file)})}
function calculateCompleteness(c){
 const a=c.advanced||{};
 const checks=[
  c.name,c.summary,c.media?.flagKey,c.capital?.name,c.population,c.territory?.area||c.area,c.government?.system,
  CBOOL(c.culture?.languages),c.economy?.gdp,c.economy?.currencyName,CBOOL(c.industries),CBOOL(c.companies),
  c.food?.selfSufficiencyCaloriePct,c.energy?.selfSufficiencyPct,CBOOL(c.energy?.sources),CBOOL(c.climate?.zones),
  a.constitution?.name,a.constitution?.humanRightsSummary,a.governance?.electionSystem,c.taxation?.summary||CBOOL(c.taxation?.taxes),
  a.fiscal?.taxRevenueGdpPct,a.fiscal?.debtGdpPct,a.finance?.centralBank,a.education?.literacyPct,a.education?.spendingGdpPct,
  a.social?.povertyPct,a.social?.gini,c.welfare?.happinessIndex,CBOOL(c.welfarePrograms),CBOOL(c.socialIssues),
  CBOOL(c.policeOrganizations),CBOOL(c.criminalOrganizations),a.information?.cyberDefenseScore,
  a.environment?.ghgMtCo2e,a.environment?.forestPct,CBOOL(c.environmentalIssues),CBOOL(c.sdgGoals),
  a.infrastructure?.roadKm||c.infrastructure?.roadKm,a.infrastructure?.railKm||c.infrastructure?.railKm,CBOOL(c.ports),CBOOL(c.airports),
  CBOOL(c.heritageSites),CBOOL(c.socialPlatforms),CBOOL(c.timeline),c.military?.personnel,CBOOL(c.military?.branches),
  CBOOL(c.administration?.laws),CBOOL(c.administration?.regions),CBOOL(c.cities),c.timekeeping?.timezoneName||c.timekeeping?.utcOffset!==0,
  c.usagePolicy?.appearance,CBOOL(c.wikiPages),CBOOL(c.statistics),CBOOL(c.posts),CBOOL(c.sources)
 ];
 return Math.round(checks.filter(Boolean).length/checks.length*100);
}
function CBOOL(v){return Array.isArray(v)?v.length>0:!!v}
function averageSet(values,fallback=0){const a=values.filter(v=>v!==null&&v!==undefined&&v!=="").map(v=>Number(v)).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:fallback}
function calculateStrength(c){
 const pop=Math.max(num(c.population),1),gdp=Math.max(num(c.economy?.gdp),0),area=Math.max(num(c.territory?.area||c.area),0),eez=Math.max(num(c.sovereignty?.eezArea||c.territory?.eezArea),0);
 const mil=(num(c.military?.budgetUsdEquivalent)>0?num(c.military.budgetUsdEquivalent):(String(c.military?.budgetCurrency||"").toUpperCase()==="USD"?num(c.military?.budget):0)),person=num(c.military?.personnel),m=c.strength?.manual||{},a=c.advanced||{};
 const foodScore=num(c.food?.selfSufficiencyCaloriePct)>0?num(c.food.selfSufficiencyCaloriePct):num(m.foodSecurity);
 const energyScore=num(c.energy?.selfSufficiencyPct)>0?num(c.energy.selfSufficiencyPct):num(m.energySecurity);
 const techScore=averageSet([a.technology?.aiIndustryScore,a.technology?.roboticsIndustryScore,a.technology?.semiconductorScore,a.technology?.supercomputerScore,a.technology?.spaceCapabilityScore],num(c.science?.level,num(m.technology,50)));
 const infraScore=averageSet([num(a.infrastructure?.logisticsIndex,NaN)*20,c.infrastructure?.internetPct,a.infrastructure?.waterCoveragePct,a.infrastructure?.sewerageCoveragePct],num(m.logistics,50));
 const governanceScore=averageSet([a.governance?.governmentEffectiveness,a.governance?.ruleOfLaw,a.governance?.judicialIndependence,a.governance?.corruptionScore],num(m.administration,50));
 const humanScore=averageSet([num(c.welfare?.hdi,NaN)*100,a.education?.literacyPct,num(c.welfare?.happinessIndex,NaN)*10],50);
 const infoScore=averageSet([a.information?.informationWarfareScore,a.information?.counterIntelligenceScore,a.information?.cyberDefenseScore,a.information?.assassinationDefenseScore],50);
 const resilience=averageSet([foodScore,energyScore,a.resources?.waterSecurityPct,a.social?.civilDefenseCoveragePct],50);
 const industryShare=arr(c.industries).filter(x=>/工業|製造|造船|軍需|半導体|AI|航空|電子|化学|鉄鋼/.test(String(x.name||x))).reduce((x,y)=>x+num(y.share,0),0);
 const industryScore=num(m.industry)>0?num(m.industry):Math.min(100,35+industryShare*1.1+Math.min(25,arr(c.companies).length*2));
 const reserveVals=arr(c.resourceReserves).map(x=>x?.selfSufficiencyPct).filter(v=>v!==null&&v!==undefined&&v!=="").map(Number).filter(Number.isFinite).map(v=>Math.min(100,Math.max(0,v)));
 const resourceScore=num(m.resources)>0?num(m.resources):(reserveVals.length?reserveVals.reduce((x,y)=>x+y,0)/reserveVals.length:50);
 const adminDetail=Math.min(100,35+arr(c.administration?.ministries).length*2+arr(c.administration?.laws).length*3+arr(c.administration?.regions).length*.4);
 const administrationScore=num(m.administration)>0?num(m.administration):(averageSet([a.governance?.governmentEffectiveness,a.governance?.ruleOfLaw,a.governance?.judicialIndependence,a.governance?.corruptionScore],adminDetail));
 const diplomacyScore=num(m.diplomacy)>0?num(m.diplomacy):Math.min(100,35+arr(c.relations).length*6+arr(c.organizations).length*4);
 const logisticsScore=num(m.logistics)>0?num(m.logistics):infraScore;
 const factors={
  population:Math.log10(pop)*7.2,
  economy:gdp?Math.log10(gdp/1e9+1)*11:0,
  territory:Math.log10(area+1)*4.2,
  eez:Math.log10(eez+1)*2.4,
  military:(mil?Math.log10(mil/1e9+1)*5:0)+(person?Math.log10(person+1)*2.2:0),
  technology:techScore*.18,
  industry:industryScore*.15,
  resources:resourceScore*.10,
  infrastructure:infraScore*.10,
  administration:administrationScore*.10,
  diplomacy:diplomacyScore*.10,
  logistics:logisticsScore*.08,
  foodSecurity:foodScore*.06,
  energySecurity:energyScore*.06,
  humanDevelopment:humanScore*.07,
  informationSecurity:infoScore*.06,
  resilience:resilience*.05
 };
 const total=Math.max(0,Math.round(Object.values(factors).reduce((x,y)=>x+y,0)*10)/10),warnings=[];
 if(gdp&&mil/gdp>.1)warnings.push({level:"danger",text:"軍事費がGDPの10%を超えています。戦時体制・軍事国家など設定上の根拠を推奨します。"});else if(gdp&&mil/gdp>.05)warnings.push({level:"warn",text:"軍事費がGDPの5%を超える高負担設定です。"});
 if(pop&&person/pop>.04)warnings.push({level:"warn",text:"現役兵力が人口の4%を超えています。徴兵・動員制度との整合性を確認してください。"});
 if(area<50000&&eez>5000000)warnings.push({level:"info",text:"国土面積に比べEEZが非常に大きい設定です。多数の島嶼領土などの根拠があると説得力が増します。"});
 if(techScore>85&&num(m.industry,50)<35)warnings.push({level:"warn",text:"技術水準が非常に高い一方で産業基盤が低めです。輸入依存・研究特化などの背景設定を推奨します。"});
 if(pop>30000000&&num(c.food?.selfSufficiencyCaloriePct)>0&&num(c.food.selfSufficiencyCaloriePct)<30)warnings.push({level:"info",text:"人口規模に対して食料自給率が低めです。輸入先・備蓄・海上交通路などの設定があると整合性が高まります。"});
 if(num(a.fiscal?.debtGdpPct)>180&&num(a.fiscal?.deficitGdpPct)<-5)warnings.push({level:"warn",text:"政府債務が非常に大きく、同時に大幅な財政赤字です。通貨制度・国債保有主体・財政維持策の説明を推奨します。"});
 if(num(a.resources?.powerReserveMarginPct)>0&&num(a.resources.powerReserveMarginPct)<5)warnings.push({level:"warn",text:"電力予備率が5%未満です。大規模需要増・災害・戦時に電力不足が起きやすい設定です。"});
 if(num(a.social?.povertyPct)>25&&num(c.welfare?.happinessIndex)>7)warnings.push({level:"info",text:"高い貧困率と非常に高い幸福度が同居しています。社会制度・共同体・所得統計の定義を説明すると整合性が高まります。"});
 if(num(a.education?.literacyPct)>98&&num(a.education?.spendingGdpPct)>0&&num(a.education.spendingGdpPct)<2)warnings.push({level:"info",text:"識字率が非常に高い一方で教育支出が低い設定です。既存教育資産や民間負担などの背景があると自然です。"});
 let tier=total>=180?"超大国級":total>=150?"超大国の目安":total>=125?"主要先進国級":total>=100?"先進国の目安":total>=70?"中堅国級":"小～中規模国家";
 return {total,tier,factors,warnings,derived:{techScore,industryScore,resourceScore,infraScore,administrationScore,diplomacyScore,logisticsScore,governanceScore,humanScore,infoScore,resilience},calculatedAt:new Date().toISOString()};
}
function relationLabel(t){return ({alliance:"同盟",mutual_defense:"相互防衛条約",non_aggression:"不可侵条約",trade:"通商・貿易",technology:"技術協定",joint_exercise:"共同演習",ceasefire:"停戦",recognition:"国交樹立",data_share:"データ共有"})[t]||t||"関係"}
function qs(sel,root=document){return root.querySelector(sel)}function qsa(sel,root=document){return [...root.querySelectorAll(sel)]}
function topbar(){const el=document.getElementById("country-topbar");if(!el)return;const id=currentId(),u=id?`?id=${encodeURIComponent(id)}`:"";el.className="country-topbar";el.innerHTML=`<div class="country-topbar-inner"><a class="brand mfdco-home-link" href="https://mfdco.net" aria-label="MFDCOホームへ戻る">戻る</a><a class="country-module-link" href="countries.html">国家運営</a><a id="country-active-context" class="country-active-context" href="country-dashboard.html" hidden></a><a href="countries.html">国家一覧</a><a href="country-dashboard.html">ダッシュボード</a><details class="topbar-menu"><summary>見る</summary><div><a href="country-feed.html">国家ニュース</a><a href="country-compare.html">国家比較</a><a href="country-market.html">世界経済</a><a href="country-organizations.html">国際機関・条約</a><a href="country-templates.html">テンプレート</a></div></details>${id?`<details class="topbar-menu"><summary>この国家</summary><div><a href="country.html${u}">国家資料</a><a href="country-strength.html${u}">国家力</a><a href="country-exchange.html${u}">外交</a><a href="country-rights.html${u}">利用条件</a><a href="country.html${u}#country-media-downloads">素材</a></div></details><details class="topbar-menu"><summary>編集・管理</summary><div><a href="country-edit.html${u}">設定編集</a><a href="country-operations.html${u}">国家運営・計画</a><a href="country-stats.html${u}">図表</a><a href="country-wiki.html${u}">Wiki</a><a href="country-arsenal.html${u}">正式採用</a><a href="country-manage.html${u}">管理</a></div></details>`:""}<span class="topbar-spacer"></span><a href="country-help.html">ヘルプ</a></div>`;
 const menus=[...el.querySelectorAll("details.topbar-menu")];menus.forEach(d=>d.addEventListener("toggle",()=>{if(d.open)menus.forEach(o=>{if(o!==d)o.open=false})}));
 if(!document.querySelector(".fiction-disclaimer-bar")){const note=document.createElement("div");note.className="fiction-disclaimer-bar";note.textContent="このページは架空国家・創作世界の設定資料です。実在の国家・政府・統計を示すものではありません。";el.insertAdjacentElement("afterend",note)}
 setTimeout(async()=>{try{const Cloud=window.MFDCOCountryCloud,box=document.getElementById("country-active-context");if(!Cloud||!box)return;const p=await Cloud.getCountryPreferences(),cid=p.activeCountryId||p.mainCountryId;if(!cid)return;const cc=await Cloud.loadCountry(cid);if(!cc)return;const flag=await Cloud.resolveMedia(cc.media?.flagKey||"");box.href=`country.html?id=${encodeURIComponent(cid)}`;box.innerHTML=`${flag?`<img src="${flag}" alt="">`:""}<span>${esc(cc.name||"アクティブ国家")}</span>`;box.hidden=false}catch(e){console.warn("COUNTRY ACTIVE CONTEXT",e)}},0);
}
function download(name,text,type="application/json"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function fileToText(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>rej(r.error);r.readAsText(file)})}
function upsertById(list,item){const a=arr(list).slice(),i=a.findIndex(x=>x.id===item.id);if(i>=0)a[i]=item;else a.push(item);return a}
window.MFDCOCountry={VERSION,STORAGE_KEY,uid,clone,esc,num,arr,str,fmtNum,fmtPopulationMan,fmtMoney,formatDate,slugify,autoUtcFromLongitude,standardMeridianFromUtc,utcLabel,defaultUsagePolicy,defaultCountry,japanSample,migrate,load,save,saveAll,remove,get,currentId,setCurrent,mediaUrl,storeMedia,calculateCompleteness,calculateStrength,relationLabel,qs,qsa,topbar,download,fileToText,upsertById};
document.addEventListener("DOMContentLoaded",topbar);
})();
