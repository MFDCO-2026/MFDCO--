"use strict";
(function(){
const STORAGE_KEY="mfdco.countries.v6";
const MEDIA_KEY="mfdco.country.media.v6";
const CURRENT_KEY="mfdco.country.current";
const VERSION=6;
const uid=()=>crypto?.randomUUID?crypto.randomUUID():`id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
const clone=o=>JSON.parse(JSON.stringify(o??null));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const arr=v=>Array.isArray(v)?v:[];
const str=v=>v==null?"":String(v);
function fmtNum(v,opt={}){const n=num(v,NaN);if(!Number.isFinite(n))return "—";return new Intl.NumberFormat("ja-JP",opt).format(n)}
function fmtMoney(v,unit=""){return `${fmtNum(v,{maximumFractionDigits:2})}${unit?` ${unit}`:""}`}
function formatDate(v){if(!v)return "—";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat("ja-JP",{dateStyle:"medium"}).format(d)}
function slugify(s){return str(s).trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9\-ぁ-んァ-ヶ一-龠]/g,"").slice(0,64)}
function defaultCountry(){const id=uid();return {
 id,slug:"",name:"新しい国家",shortName:"",englishName:"",code:"",summary:"",isPublic:false,tags:[],schemaVersion:VERSION,
 createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
 media:{flagKey:"",coverKey:"",mapKey:"",anthemKey:"",capitalImageKey:""},
 capital:{name:"",summary:"",population:0,imageKey:""},sovereignty:{status:"主権国家",recognizedBy:"",territorialWatersKm:12,eezArea:0},
 population:0,populationYear:"",populationGroups:{children:0,working:0,elderly:0},area:0,territory:{area:0,landArea:0,waterArea:0,eezArea:0,coastlineKm:0},
 government:{system:"",headOfState:"",headOfGovernment:"",legislature:"",judiciary:"",rulingParties:[]},
 economy:{gdp:0,gdpYear:"",gdpPerCapita:0,currencyName:"",currencyCode:"",currencyMode:"independent",currencyRate:0,currencyBase:"USD",growthRate:0,unemploymentRate:0,inflationRate:0,debt:0},
 budget:{year:"",revenue:[],expenditure:[]},industries:[],products:[],resources:[],trade:{exports:[],imports:[]},
 climate:{zones:[],avgTemp:"",rainfall:"",notes:""},culture:{languages:[],religions:[],holidays:[],food:[],arts:[],sports:[],notes:""},
 infrastructure:{railKm:0,roadKm:0,ports:0,airports:0,internetPct:0,electricityTwh:0,renewablePct:0},
 welfare:{literacyPct:0,lifeExpectancy:0,healthcare:"",education:""},
 security:{police:"",intelligence:"",emergency:""},science:{level:50,rndGdpPct:0,space:"",nuclear:""},
 administration:{ministries:[],laws:[],regions:[]},companies:[],parties:[],
 chronology:{currentGregorian:new Date().getFullYear(),calendars:[]},eras:[],timeline:[],posts:[],military:{budget:0,budgetYear:"",personnel:0,doctrine:"",commanderInChief:"",branches:[],units:[],equipment:[],namingRules:[]},
 wikiPages:[],statistics:[],mapPoints:[],systems:[],organizations:[],officialEquipment:[],relations:[],
 strength:{manual:{technology:50,industry:50,resources:50,administration:50,diplomacy:50,logistics:50,foodSecurity:50,energySecurity:50},last:null},
 _index:{strength:0,completeness:0}
}}
function japanSample(){const c=defaultCountry();Object.assign(c,{name:"日本国",shortName:"日本",englishName:"Japan",code:"JPN",slug:"japan",summary:"東アジアに位置する島国。現代日本を参考にした国家設定テンプレートです。公開統計を土台に、架空国家へ編集できます。",isPublic:true,tags:["現代","島国","先進国"],population:122650000,populationYear:"2026-09",area:377975});
c.capital={name:"東京都",summary:"事実上の首都。政治・経済・文化の中枢。",population:0,imageKey:""};c.sovereignty={status:"主権国家",recognizedBy:"国際的承認",territorialWatersKm:12,eezArea:4470000};c.territory={area:377975,landArea:364546,waterArea:13429,eezArea:4470000,coastlineKm:35000};
c.government={system:"議院内閣制・立憲君主制",headOfState:"天皇",headOfGovernment:"内閣総理大臣",legislature:"国会（衆議院・参議院）",judiciary:"最高裁判所を頂点とする司法制度",rulingParties:["自由民主党","日本維新の会"]};
c.economy={gdp:672700000000000,gdpYear:"2025年度",gdpPerCapita:0,currencyName:"日本円",currencyCode:"JPY",currencyMode:"JPY",currencyRate:1,currencyBase:"JPY",growthRate:0,unemploymentRate:0,inflationRate:0,debt:0};
c.budget={year:"2026年度",revenue:[{name:"租税及印紙収入",value:83370000000000},{name:"公債金",value:29200000000000},{name:"その他収入",value:8109200000000}],expenditure:[{name:"社会保障",value:39000000000000},{name:"国債費",value:31000000000000},{name:"地方交付税等",value:20000000000000},{name:"防衛関係費",value:9000000000000},{name:"公共事業等",value:9000000000000},{name:"教育・科学等",value:6000000000000},{name:"その他",value:8309200000000}]};
c.climate={zones:["温帯湿潤気候","亜寒帯湿潤気候","亜熱帯"],avgTemp:"地域差が大きい",rainfall:"梅雨・台風を含む多雨地域",notes:"南北に長く、北海道から南西諸島まで複数の気候帯を持つ。"};c.products=["自動車","電子機器","工作機械","食品","水産物","伝統工芸品"];
c.industries=[{name:"製造業",share:20},{name:"サービス業",share:70},{name:"農林水産業",share:1}];c.populationGroups={children:13800000,working:73700000,elderly:36200000};
c.military={budget:9000000000000,budgetYear:"2026年度",personnel:217701,doctrine:"専守防衛を基本とする防衛政策",commanderInChief:"内閣総理大臣",branches:[{id:uid(),name:"陸上自衛隊",type:"陸軍",personnel:129176,budget:0,commander:"陸上幕僚長",authority:"防衛大臣の指揮監督"},{id:uid(),name:"海上自衛隊",type:"海軍",personnel:41463,budget:0,commander:"海上幕僚長",authority:"防衛大臣の指揮監督"},{id:uid(),name:"航空自衛隊",type:"空軍",personnel:42324,budget:0,commander:"航空幕僚長",authority:"防衛大臣の指揮監督"}],units:[],equipment:[],namingRules:[]};
c.chronology={currentGregorian:2026,calendars:[{id:uid(),name:"令和",startYear:2019,prefix:"令和",suffix:"年"},{id:uid(),name:"平成",startYear:1989,endYear:2019,prefix:"平成",suffix:"年"}]};
c.eras=[{id:uid(),name:"古代",startYear:-10000,endYear:1185},{id:uid(),name:"中世",startYear:1185,endYear:1603},{id:uid(),name:"近世",startYear:1603,endYear:1868},{id:uid(),name:"近代",startYear:1868,endYear:1945},{id:uid(),name:"現代",startYear:1945,endYear:null}];
c.timeline=[{id:uid(),date:"1868",year:1868,era:"近代",title:"明治維新",summary:"近代国家形成の大きな転換点。",body:"",imageKey:""},{id:uid(),date:"1947-05-03",year:1947,era:"現代",title:"日本国憲法施行",summary:"現行憲法が施行された。",body:"",imageKey:""}];
c.administration.regions=["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"].map(name=>({id:uid(),name,capital:"",population:0,area:0,summary:"",imageKey:""}));
c.administration.laws=[{id:uid(),name:"日本国憲法",year:1946,status:"施行中",summary:"国の基本法。"}];c.wikiPages=[{id:uid(),type:"都市・首都",title:"東京都",summary:"日本の首都機能が集中する大都市圏。",imageKey:"",facts:[{key:"区分",value:"都"}],sections:[{title:"概要",body:"政治・経済・文化の中心。"}],tags:["都市"],related:[]},{id:uid(),type:"法律・制度",title:"日本国憲法",summary:"日本の現行憲法。",imageKey:"",facts:[{key:"施行",value:"1947年5月3日"}],sections:[{title:"概要",body:"国民主権、基本的人権の尊重、平和主義などを基本原理とする。"}],tags:["法律"],related:[]}];
return c}
function load(){let data=[];try{data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{}if(!Array.isArray(data)||!data.length){data=[japanSample()];saveAll(data)}return data.map(migrate)}
function migrate(c){const d=defaultCountry();const out={...d,...c};for(const k of ["media","capital","sovereignty","territory","government","economy","budget","climate","culture","infrastructure","welfare","security","science","administration","trade","military","strength","chronology","_index"]){out[k]={...d[k],...(c?.[k]||{})}};for(const k of ["tags","industries","products","resources","companies","parties","eras","timeline","posts","wikiPages","statistics","mapPoints","systems","organizations","officialEquipment","relations"]){out[k]=arr(c?.[k])}for(const k of ["ministries","laws","regions"]){out.administration[k]=arr(c?.administration?.[k])}for(const k of ["branches","units","equipment","namingRules"]){out.military[k]=arr(c?.military?.[k])}out.schemaVersion=VERSION;return out}
function saveAll(items){localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}
function save(country){const items=load();const i=items.findIndex(x=>x.id===country.id);country.updatedAt=new Date().toISOString();country._index=country._index||{};const st=calculateStrength(country);country._index.strength=st.total;country._index.completeness=calculateCompleteness(country);country.strength.last=st;if(i>=0)items[i]=clone(country);else items.unshift(clone(country));saveAll(items);return country}
function remove(id){saveAll(load().filter(c=>c.id!==id));if(localStorage.getItem(CURRENT_KEY)===id)localStorage.removeItem(CURRENT_KEY)}
function currentId(){const q=new URLSearchParams(location.search);return q.get("id")||localStorage.getItem(CURRENT_KEY)||load()[0]?.id||""}
function setCurrent(id){if(id)localStorage.setItem(CURRENT_KEY,id)}
function get(id=currentId()){const c=load().find(x=>x.id===id)||load()[0]||defaultCountry();setCurrent(c.id);return clone(c)}
function media(){try{return JSON.parse(localStorage.getItem(MEDIA_KEY)||"{}")}catch{return {}}}
function mediaUrl(key){if(!key)return "";return media()[key]?.data||key}
function storeMedia(file,slot="file"){return new Promise((resolve,reject)=>{if(!file)return resolve("");if(file.size>25*1024*1024)return reject(new Error("1ファイル25MiBを超えています"));const r=new FileReader();r.onerror=()=>reject(r.error);r.onload=()=>{const key=`local/${Date.now()}_${uid()}_${file.name}`;const all=media();all[key]={data:r.result,type:file.type,name:file.name,size:file.size,slot};try{localStorage.setItem(MEDIA_KEY,JSON.stringify(all))}catch(e){return reject(new Error("ローカル保存容量を超えました。本番ではSupabase Storageを使用します。"))}resolve(key)};r.readAsDataURL(file)})}
function calculateCompleteness(c){const checks=[c.name,c.summary,c.media?.flagKey,c.capital?.name,c.population,c.territory?.area||c.area,c.government?.system,c.economy?.gdp,c.economy?.currencyName,arr(c.climate?.zones).length,arr(c.products).length,arr(c.industries).length,arr(c.timeline).length,c.military?.personnel,arr(c.military?.branches).length,arr(c.administration?.laws).length,arr(c.administration?.regions).length,arr(c.wikiPages).length,arr(c.statistics).length,arr(c.posts).length];return Math.round(checks.filter(Boolean).length/checks.length*100)}
function calculateStrength(c){const pop=Math.max(num(c.population),1),gdp=Math.max(num(c.economy?.gdp),0),area=Math.max(num(c.territory?.area||c.area),0),eez=Math.max(num(c.sovereignty?.eezArea||c.territory?.eezArea),0),mil=num(c.military?.budget),person=num(c.military?.personnel),m=c.strength?.manual||{};
 const factors={population:Math.log10(pop)*7.2,economy:gdp?Math.log10(gdp/1e9+1)*11:0,territory:Math.log10(area+1)*4.2,eez:Math.log10(eez+1)*2.4,military:(mil?Math.log10(mil/1e9+1)*5:0)+(person?Math.log10(person+1)*2.2:0),technology:num(m.technology)*.18,industry:num(m.industry)*.15,resources:num(m.resources)*.10,infrastructure:((num(c.infrastructure?.internetPct)+num(c.infrastructure?.renewablePct))/2)*.08,administration:num(m.administration)*.10,diplomacy:num(m.diplomacy)*.10,logistics:num(m.logistics)*.10,foodSecurity:num(m.foodSecurity)*.06,energySecurity:num(m.energySecurity)*.06};
 const total=Math.max(0,Math.round(Object.values(factors).reduce((a,b)=>a+b,0)*10)/10);const warnings=[];if(gdp&&mil/gdp>.1)warnings.push({level:"danger",text:"軍事費がGDPの10%を超えています。戦時体制・軍事国家など設定上の根拠を推奨します。"});else if(gdp&&mil/gdp>.05)warnings.push({level:"warn",text:"軍事費がGDPの5%を超える高負担設定です。"});if(pop&&person/pop>.04)warnings.push({level:"warn",text:"現役兵力が人口の4%を超えています。徴兵・動員制度との整合性を確認してください。"});if(area<50000&&eez>5000000)warnings.push({level:"info",text:"国土面積に比べEEZが非常に大きい設定です。多数の島嶼領土などの根拠があると説得力が増します。"});if(num(m.technology)>85&&num(m.industry)<35)warnings.push({level:"warn",text:"技術水準が非常に高い一方で産業基盤が低めです。輸入依存・研究特化などの背景設定を推奨します。"});
 let tier=total>=180?"超大国級":total>=150?"超大国の目安":total>=125?"主要先進国級":total>=100?"先進国の目安":total>=70?"中堅国級":"小～中規模国家";return {total,tier,factors,warnings,calculatedAt:new Date().toISOString()}}
function relationLabel(t){return ({alliance:"同盟",mutual_defense:"相互防衛条約",non_aggression:"不可侵条約",trade:"通商・貿易",technology:"技術協定",joint_exercise:"共同演習",ceasefire:"停戦",recognition:"国交樹立",data_share:"データ共有"})[t]||t||"関係"}
function qs(sel,root=document){return root.querySelector(sel)}function qsa(sel,root=document){return [...root.querySelectorAll(sel)]}
function topbar(){const el=document.getElementById("country-topbar");if(!el)return;const id=currentId(),u=id?`?id=${encodeURIComponent(id)}`:"";el.className="country-topbar";el.innerHTML=`<div class="country-topbar-inner"><a class="brand" href="countries.html">MFDCO 国家運営</a><a href="country-dashboard.html">ダッシュボード</a><a href="countries.html">国家一覧</a><a href="country-feed.html">ニュース</a><a href="country-compare.html">比較</a><a href="country-organizations.html">国際機関</a><a href="country-templates.html">テンプレート</a><a href="country-help.html">ヘルプ</a><span class="topbar-spacer"></span>${id?`<a href="country.html${u}">国家資料</a><a href="country-edit.html${u}">編集</a><a href="country-strength.html${u}">国家力</a><a href="country-exchange.html${u}">外交</a><a href="country-manage.html${u}">管理</a>`:""}</div>`}
function download(name,text,type="application/json"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function fileToText(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>rej(r.error);r.readAsText(file)})}
function upsertById(list,item){const a=arr(list).slice(),i=a.findIndex(x=>x.id===item.id);if(i>=0)a[i]=item;else a.push(item);return a}
window.MFDCOCountry={VERSION,STORAGE_KEY,uid,clone,esc,num,arr,str,fmtNum,fmtMoney,formatDate,slugify,defaultCountry,japanSample,migrate,load,save,saveAll,remove,get,currentId,setCurrent,mediaUrl,storeMedia,calculateCompleteness,calculateStrength,relationLabel,qs,qsa,topbar,download,fileToText,upsertById};
document.addEventListener("DOMContentLoaded",topbar);
})();
