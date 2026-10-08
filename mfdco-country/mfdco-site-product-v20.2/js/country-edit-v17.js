"use strict";
(() => {
const C=window.MFDCOCountry;
const V=window.MFDCOCountryV6;
const X=window.MFDCOCountryV11;
const Cloud=window.MFDCOCountryCloud;
const LocalDB=window.MFDCOCountryLocalDB;

const main=document.getElementById("editor-main");
const nav=document.getElementById("editor-nav");
const state=document.getElementById("save-state");
const bottom=document.getElementById("bottom-state");
const saveBtn=document.getElementById("bottom-save");

if(!main||!nav){
 console.error("[MFDCO country editor v17.1] required DOM nodes are missing");
 return;
}

const CATS=[
 ["overview","基本・百科事典"],
 ["territory","領土・地理"],
 ["population","人口・移民"],
 ["politics","政治・法"],
 ["finance","財政・金融"],
 ["industry","産業・企業"],
 ["education","教育・研究"],
 ["society","社会・福祉・社会問題"],
 ["security","治安・情報"],
 ["resources","資源・環境"],
 ["infra","交通・インフラ"],
 ["culture","文化・遺産"],
 ["history","歴史・軍事・外交"],
 ["publishing","ニュース・分析"]
];

let c=null;
let id="";
let dirty=false;
let ready=false;
let loadError=null;
let draftTimer=null;
const detailState=new Map();let suppressDetailToggle=false;

function normalizeCategory(value){
 const key=String(value||"")
  .replace(/^#/,"")
  .replace(/^cat-/,"")
  .trim();
 return CATS.some(([categoryId])=>categoryId===key)?key:"overview";
}

function readInitialCategory(){
 const rawHash=String(location.hash||"");
 if(rawHash.startsWith("#cat-")){
  const fromHash=normalizeCategory(rawHash);
  if(CATS.some(([categoryId])=>categoryId===fromHash))return fromHash;
 }

 try{
  const stored=sessionStorage.getItem("mfdco_country_editor_active_category");
  if(stored&&CATS.some(([categoryId])=>categoryId===stored))return stored;
 }catch(_){}

 return "overview";
}

let activeCategory=readInitialCategory();

function categoryLabel(key){
 return CATS.find(([categoryId])=>categoryId===key)?.[1]||key;
}

function updateNavState(){
 nav.querySelectorAll("button[data-category]").forEach(button=>{
  const active=button.dataset.category===activeCategory;
  button.classList.toggle("active",active);
  button.setAttribute("aria-selected",active?"true":"false");
  button.setAttribute("tabindex",active?"0":"-1");
 });
}

function persistCategory(){
 try{
  sessionStorage.setItem(
   "mfdco_country_editor_active_category",
   activeCategory
  );
 }catch(_){}

 const nextHash=`#cat-${activeCategory}`;
 if(location.hash!==nextHash){
  history.replaceState(
   null,
   "",
   `${location.pathname}${location.search}${nextHash}`
  );
 }
}

function escapeFallback(value){
 return String(value??"").replace(/[&<>]/g,ch=>({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;"
 })[ch]);
}

function showLoading(){
 main.innerHTML=`<section class="card section-card editor-status-card">
  <div class="section-head"><div><h2>${categoryLabel(activeCategory)}</h2></div></div>
  <p class="muted">国家データを読み込んでいます…</p>
 </section>`;
}

function showLoadError(error){
 const message=String(error?.message||error||"不明なエラー");
 const escaped=C?.esc?C.esc(message):escapeFallback(message);

 main.innerHTML=`<section class="card section-card editor-status-card">
  <div class="section-head"><div><h2>国家データを読み込めませんでした</h2></div></div>
  <p>カテゴリ操作は利用できますが、国家データの読み込みに失敗しています。</p>
  <pre class="codebox">${escaped}</pre>
  <button type="button" class="btn secondary" id="editor-retry-load">再読み込み</button>
 </section>`;

 document.getElementById("editor-retry-load")?.addEventListener(
  "click",
  ()=>location.reload()
 );
}

function showRenderError(error){
 const message=String(error?.stack||error?.message||error||"不明なエラー");
 const escaped=C?.esc?C.esc(message):escapeFallback(message);

 main.innerHTML=`<section class="card section-card editor-status-card">
  <div class="section-head"><div><h2>${categoryLabel(activeCategory)} の表示エラー</h2></div></div>
  <p>このカテゴリだけ描画に失敗しました。左の別カテゴリは引き続き選択できます。</p>
  <pre class="codebox editor-error-detail">${escaped}</pre>
 </section>`;
}

function renderSafe(){
 if(!ready||!c){
  if(loadError)showLoadError(loadError);
  else showLoading();
  return;
 }

 try{
  render();
 }catch(error){
  console.error(
   `[MFDCO country editor v17.1] render failed: ${activeCategory}`,
   error
  );
  showRenderError(error);
 }
}

function selectCategory(key,{persist=true}={}){
 activeCategory=normalizeCategory(key);
 updateNavState();

 if(persist)persistCategory();

 renderSafe();
}

function setupNavigation(){
 const buttons=[...nav.querySelectorAll("button[data-category]")];

 for(const button of buttons){
  button.addEventListener("click",()=>{
   selectCategory(button.dataset.category);
  });
 }

 nav.addEventListener("keydown",event=>{
  if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key))return;

  const current=Math.max(0,buttons.indexOf(document.activeElement));
  let next=current;

  if(event.key==="ArrowDown")next=(current+1)%buttons.length;
  if(event.key==="ArrowUp")next=(current-1+buttons.length)%buttons.length;
  if(event.key==="Home")next=0;
  if(event.key==="End")next=buttons.length-1;

  event.preventDefault();
  buttons[next].focus();
  selectCategory(buttons[next].dataset.category);
 });

 updateNavState();
}

setupNavigation();
showLoading();

async function boot(){
 try{
  if(!C||!V||!X||!Cloud){
   throw new Error(
    "国家編集に必要な共通スクリプトを読み込めませんでした。"
   );
  }

  c=await V.load();

  if(!c){
   throw new Error("国家データが空です。");
  }

  id=String(c.id||"");
  const localDraft=await LocalDB?.getCountryDraft?.(id,"legacy-country").catch(()=>null);
  if(localDraft?.payload){
   const draftTime=Date.parse(localDraft.savedAt||0)||0;
   const cloudTime=Date.parse(c.updatedAt||0)||0;
   if(draftTime>cloudTime&&confirm("この端末に未保存の編集内容があります。復元しますか？")){
    c=C.migrate(localDraft.payload);
   }
  }
  ready=true;
  loadError=null;

  for(const q of ["preview-link","bottom-preview"]){
   const element=document.getElementById(q);
   if(element){
    element.href=`country.html?id=${encodeURIComponent(id)}`;
   }
  }

  const stats=document.getElementById("stats-link");
  const wiki=document.getElementById("wiki-link");
  const operations=document.getElementById("operations-link");

  if(stats){
   stats.href=`country-stats.html?id=${encodeURIComponent(id)}`;
  }
  if(wiki){
   wiki.href=`country-wiki.html?id=${encodeURIComponent(id)}`;
  }
  if(operations){
   operations.href=`country-operations.html?id=${encodeURIComponent(id)}`;
  }

  const toolbar=document.getElementById("country-editor-toolbar");

  if(toolbar&&!document.getElementById("autofill-country")){
   const button=document.createElement("button");
   button.id="autofill-country";
   button.className="btn secondary";
   button.type="button";
   button.textContent="空欄を自動補完";
   button.addEventListener("click",runAutofill);
   toolbar.appendChild(button);
  }

  if(saveBtn){
   saveBtn.addEventListener("click",save);
  }

  window.addEventListener("beforeunload",event=>{
   if(dirty){
    event.preventDefault();
    event.returnValue="";
   }
  });

  renderSafe();
 }catch(error){
  ready=false;
  loadError=error;
  console.error("[MFDCO country editor v17.1] load failed",error);
  showLoadError(error);
 }
}

function g(path){return path.split(".").reduce((o,k)=>o?.[k],c)}
function s(path,value){const p=path.split(".");let o=c;for(const k of p.slice(0,-1))o=o[k]??={};o[p.at(-1)]=value}
function esc(v){return C.esc(v??"")}
function guide(k){const a=X.guide(k);if(!a)return"";return `<details class="field-guide"><summary>目安・意味</summary><div><b>${esc(a.meaning)}</b><br>日本: ${esc(a.japan)} / 強い国: ${esc(a.strong)} / 中堅: ${esc(a.middle)} / 弱い国: ${esc(a.weak)}</div></details>`}
function field(path,label,type="text",opts={}){let v=g(path);if(v==null)v="";const attr=[opts.step!=null?`step="${opts.step}"`:"",opts.min!=null?`min="${opts.min}"`:"",opts.max!=null?`max="${opts.max}"`:"",opts.placeholder?`placeholder="${esc(opts.placeholder)}"`:""].filter(Boolean).join(" ");return `<div class="field ${opts.full?"full":""}"><label>${label}${opts.calc?` <span class="auto-badge">自動計算</span>`:""}</label><input class="input v11-bind" data-path="${path}" type="${type}" value="${esc(v)}" ${attr}>${opts.note?`<small>${esc(opts.note)}</small>`:""}${opts.guide?guide(opts.guide):""}</div>`}
function popField(path,label,opts={}){return `<div class="field"><label>${label}（万人）</label><input class="input v11-pop" data-path="${path}" type="number" step="0.1" value="${esc(C.num(g(path))/10000)}">${opts.note?`<small>${esc(opts.note)}</small>`:""}</div>`}
function ta(path,label,opts={}){return `<div class="field full"><label>${label}</label><textarea class="textarea v11-bind" data-path="${path}" rows="${opts.rows||3}">${esc(g(path)||"")}</textarea>${opts.note?`<small>${esc(opts.note)}</small>`:""}</div>`}
function select(path,label,values,opts={}){const v=String(g(path)??"");return `<div class="field"><label>${label}</label><select class="select v11-bind" data-path="${path}">${values.map(x=>{const [value,text]=Array.isArray(x)?x:[x,x];return `<option value="${esc(value)}" ${String(value)===v?"selected":""}>${esc(text)}</option>`}).join("")}</select>${opts.note?`<small>${esc(opts.note)}</small>`:""}</div>`}
function calc(label,value,note=""){return `<div class="field calc-field"><label>${label} <span class="auto-badge">表示のみ</span></label><div class="calc-value">${esc(value??"—")}</div>${note?`<small>${esc(note)}</small>`:""}</div>`}
function card(title,body,desc="",open=false){
 const key=`${activeCategory}:${String(title)}`;
 const shouldOpen=detailState.has(key)?detailState.get(key):open;
 return `<details class="compact-details" data-detail-key="${esc(key)}" ${shouldOpen?"open":""}><summary><span>${title}</span>${desc?`<small>${esc(desc)}</small>`:""}</summary><div class="compact-details-body">${body}</div></details>`
}
function category(key,title,body){return `<section id="cat-${key}" class="card section-card v11-category"><div class="section-head"><div><h2>${title}</h2></div></div>${body}</section>`}
function addBtn(path,label,kind){return `<button class="btn small v11-add" type="button" data-path="${path}" data-kind="${kind}">＋ ${label}</button>`}
function table(path,cols,kind,empty="未設定"){const rows=C.arr(g(path));return `<div class="v11-table-head">${addBtn(path,"追加",kind)}<span>${rows.length}件</span></div><div class="table-wrap compact-table"><table><thead><tr>${cols.map(x=>`<th>${x.label}</th>`).join("")}<th></th></tr></thead><tbody>${rows.length?rows.map((r,i)=>`<tr>${cols.map(col=>{let val=r[col.key]??"";if(col.population)val=C.num(val)/10000;if(col.options)return `<td><select class="select v11-arr" data-path="${path}" data-index="${i}" data-key="${col.key}">${col.options.map(x=>`<option ${String(x)===String(val)?"selected":""}>${esc(x)}</option>`).join("")}</select></td>`;return `<td><input class="input v11-arr ${col.population?"population-cell":""}" data-path="${path}" data-index="${i}" data-key="${col.key}" data-population="${col.population?"1":"0"}" type="${col.type||"text"}" step="${col.step||"any"}" value="${esc(val)}"></td>`}).join("")}<td><button class="btn danger small v11-del" data-path="${path}" data-index="${i}" type="button">削除</button></td></tr>`).join(""):`<tr><td colspan="${cols.length+1}" class="fine">${esc(empty)}</td></tr>`}</tbody></table></div>`}
function mediaField(path,label,accept="image/*"){return `<div class="field"><label>${label}</label><input class="input v11-media" type="file" accept="${accept}" data-path="${path}"><small>${g(path)?"ファイル設定済み":"未設定"}</small></div>`}
function listLines(path,label){return `<div class="field full"><label>${label}</label><textarea class="textarea v11-lines" data-path="${path}" rows="2">${esc(C.arr(g(path)).join("\n"))}</textarea><small>1行1項目</small></div>`}
function totals(){const rev=C.arr(c.budget?.revenue).reduce((a,x)=>a+C.num(x.value),0),exp=C.arr(c.budget?.expenditure).reduce((a,x)=>a+C.num(x.value),0),gdp=C.num(c.economy?.gdp),bal=rev-exp;return {rev,exp,bal,balPct:gdp?bal/gdp*100:null,debtPct:gdp&&C.num(c.advanced?.fiscal?.debtAmount)?C.num(c.advanced.fiscal.debtAmount)/gdp*100:C.num(c.advanced?.fiscal?.debtGdpPct,null)}}
function marketBox(){const m=X.simulatedMarket(c);return `<div class="market-preview"><div><b>現在の強材料</b><span>${esc(m.theme.strong.label)} ↑ / ${esc(m.theme.weak.label)} ↓</span></div><div><b>1時間変動</b><span class="${m.pct>=0?"up":"down"}">${m.enabled?(m.pct>=0?"+":"")+m.pct.toFixed(3)+"%":"自動変動OFF"}</span></div><div><b>次の材料更新</b><span>${m.regime?.nextEventAt?new Date(m.regime.nextEventAt).toLocaleString("ja-JP"):"—"}</span></div><div><b>株価指数</b><span>${m.stock?C.fmtNum(m.stock,{maximumFractionDigits:2}):"未設定"}</span></div></div>`}
function render(){
const t=totals(),gdp=C.num(c.economy?.gdp),pop=Math.max(1,C.num(c.population)),capitalRatio=C.num(c.capital?.population)?C.num(c.capital.population)/pop*100:null,pc=C.num(c.economy?.gdpPerCapita)||(gdp?gdp/pop:0);
 const renderers={
  "overview":()=>(category("overview","基本・百科事典",card("基本情報",`<div class="form-grid three">${field("name","正式国名")}${field("shortName","略称")}${field("englishName","英語名")}${field("code","国コード")}${field("capital.name","首都")}${field("identity.largestCity","最大都市")}${field("nationalSymbols.motto","国の標語")}${field("identity.demonym","国民呼称")}${field("identity.officialScript","公用文字")}${field("culture.languages","公用語（カンマ区切り）")}${field("culture.religions","主要宗教（カンマ区切り）")}${field("identity.callingCode","国際電話番号")}${field("identity.internetTld","国別TLD")}${field("foundation.label","建国・紀年")}${field("advanced.civilization.yearEquivalent","文明レベル：史実何年相当","number",{note:"技術・制度・産業を総合して、史実の西暦何年頃に相当するかを数値で入力。"})}${select("isPublic","公開状態",[["true","公開"],["false","非公開/下書き"]])}${ta("summary","概要",{rows:3})}</div>`,"Wikipediaの冒頭・基本情報欄に相当",true)+card("画像・国歌",`<div class="form-grid three">${mediaField("media.flagKey","国旗")}${mediaField("media.emblemKey","国章")}${mediaField("media.coverKey","背景")}${mediaField("media.mapKey","地図")}${mediaField("media.capitalImageKey","首都画像")}${mediaField("media.anthemKey","国歌","audio/*")}</div><p class="fine">ここで設定した画像・音声は国家ページの「素材ダウンロード」に自動反映されます。初期状態はダウンロード不可です。</p>`)+card("国家紹介・外部リンク",`<div class="form-grid">${field("presentation.youtubeUrl","国家紹介YouTube URL","url",{placeholder:"https://www.youtube.com/watch?v=...",note:"YouTube / youtu.be URLを貼ると公開国家ページに埋め込みます。"})}${ta("mediaDistribution.requestNote","素材利用申請への案内",{rows:2})}</div>${table("presentation.externalLinks",[{key:"label",label:"表示名"},{key:"url",label:"外部URL"},{key:"description",label:"説明"}],"externalLink")}<p class="fine">公式サイト、Wiki、SNS、配布サイトなど国家に関係する外部ページを登録できます。</p>`))),
  "territory":()=>(category("territory","領土・地理",card("主権・海域",`<div class="form-grid three">${field("sovereignty.status","主権状態")}${field("sovereignty.recognizedBy","国際承認")}${field("territory.area","国土面積 km²","number")}${field("sovereignty.territorialWatersKm","領海幅 km","number")}${field("sovereignty.eezArea","EEZ km²","number")}${field("territory.coastlineKm","海岸線 km","number")}${field("advanced.territorialControl.controlledPct","政府実効支配率 %","number",{min:0,max:100})}${ta("advanced.territorialControl.description","実効支配・統治状況")}</div>`)+card("植民地・海外領土・占領地",table("territories",[{key:"name",label:"名称"},{key:"type",label:"区分",options:["海外領土","植民地","保護国","租借地","占領地","傀儡国","自治領","その他"]},{key:"area",label:"面積km²",type:"number"},{key:"population",label:"人口(万人)",type:"number",population:true},{key:"autonomy",label:"自治度"},{key:"resources",label:"資源"},{key:"description",label:"説明"}],"territory"),"本国以外の支配地域")+card("係争地域",table("disputes",[{key:"name",label:"地域"},{key:"claimants",label:"主張国"},{key:"control",label:"実効支配"},{key:"since",label:"開始年"},{key:"status",label:"状態"},{key:"description",label:"説明"}],"dispute"))+card("国境",table("borders",[{key:"neighbor",label:"相手国"},{key:"type",label:"国境",options:["陸上","海上","停戦線","非武装地帯","その他"]},{key:"lengthKm",label:"延長km",type:"number"},{key:"crossings",label:"主要検問所"},{key:"description",label:"説明"}],"border"))+card("海外軍事基地",table("overseasBases",[{key:"name",label:"基地名"},{key:"hostCountry",label:"所在国"},{key:"type",label:"種類"},{key:"personnel",label:"駐留人員",type:"number"},{key:"leaseUntil",label:"期限"},{key:"description",label:"説明"}],"overseasBase"))+card("標準時",`<div class="form-grid three">${field("timekeeping.referenceCity","基準都市")}${field("timekeeping.latitude","緯度","number",{step:.0001})}${field("timekeeping.longitude","経度","number",{step:.0001})}${select("timekeeping.utcMode","UTC差",[["auto","経度から自動"],["manual","手動"]])}${field("timekeeping.utcOffset","UTC差(時間)","number",{step:.5})}${field("timekeeping.standardMeridian","標準時子午線","number",{step:.5})}${field("timekeeping.timezoneName","標準時名称")}</div>`))),
  "population":()=>(category("population","人口・移民",card("人口",`<div class="form-grid three">${popField("population","総人口")}${field("populationYear","基準年")}${calc("人口密度",(C.num(c.territory?.area||c.area)>0?(C.num(c.population)/C.num(c.territory?.area||c.area)).toFixed(1)+" 人/km²":"—"),"総人口÷国土面積")}${field("demographics.urbanizationPct","都市化率 %","number")}${field("demographics.fertilityRate","出生率(TFR)","number",{step:.01})}${popField("capital.population","首都人口")}${calc("首都人口比",capitalRatio!=null?capitalRatio.toFixed(2)+"%":"—","首都人口÷総人口")}${calc("1人当たりGDP",pc?C.fmtNum(pc,{maximumFractionDigits:0}):"—","GDP÷人口")}</div>`)+card("移民・観光",`<div class="form-grid three">${field("advanced.migration.immigrantsAnnual","年間移民流入","number")}${field("advanced.migration.emigrantsAnnual","年間移民流出","number")}${field("advanced.migration.refugeesAnnual","年間難民受入","number")}${field("advanced.migration.touristsAnnual","年間外国人観光客","number")}${field("advanced.migration.tourismRevenueUsd","観光収入 USD","number")}${ta("advanced.migration.notes","移民・観光の説明")}</div>`))),
  "politics":()=>(category("politics","政治・法",card("憲法",`<div class="form-grid three">${field("advanced.constitution.name","憲法名")}${field("advanced.constitution.enacted","制定日")}${field("advanced.constitution.effective","施行日")}${ta("advanced.constitution.preamble","前文・理念")}${ta("advanced.constitution.amendmentRule","改正手続")}${ta("advanced.constitution.emergencyPowers","非常事態・緊急権")}${ta("advanced.constitution.humanRightsSummary","基本的人権")}${ta("advanced.constitution.notes","憲法の説明")}</div>`)+card("政府・選挙・司法",`<div class="form-grid three">${field("government.system","政体")}${field("government.headOfState","国家元首")}${field("government.headOfGovernment","政府首班")}${field("government.legislature","立法府")}${field("government.judiciary","司法制度")}${field("advanced.governance.electionSystem","選挙制度")}${field("advanced.governance.votingAge","投票年齢","number")}${field("advanced.governance.turnoutPct","投票率 %","number",{guide:"turnout"})}${field("advanced.governance.judicialIndependence","司法独立度 0-100","number",{min:0,max:100})}${field("advanced.governance.corruptionScore","腐敗抑制度 0-100","number",{min:0,max:100,guide:"corruption"})}${field("advanced.governance.pressFreedomScore","報道自由 0-100","number",{min:0,max:100,guide:"press"})}${ta("advanced.governance.notes","政治制度の説明")}</div>`))),
  "finance":()=>(category("finance","財政・金融",card("経済・通貨",`<div class="form-grid three">${field("economy.gdp","名目GDP（基準通貨額）","number")}${field("economy.gdpYear","GDP基準年")}${calc("1人当たりGDP",pc?C.fmtNum(pc,{maximumFractionDigits:0}):"—","GDP÷総人口")}${field("economy.growthRate","実質成長率 %","number",{step:.01})}${field("economy.inflationRate","インフレ率 %","number",{step:.01})}${field("economy.currencyName","通貨名")}${field("economy.currencyCode","通貨コード")}${field("economy.currencyMode","現実通貨との関係")}${ta("economy.notes","経済・通貨の説明")}</div>`)+card("税制",`<div class="form-grid three">${field("advanced.fiscal.taxRevenueGdpPct","税収/GDP %","number",{step:.1,guide:"tax"})}${field("advanced.fiscal.deficitGdpPct","財政収支/GDP %","number",{step:.1})}${field("advanced.fiscal.debtGdpPct","政府債務/GDP %","number",{step:.1,guide:"debt"})}${field("advanced.fiscal.debtAmount","政府債務額","number")}${field("advanced.fiscal.interestExpensePct","利払い/歳出 %","number",{step:.1})}${ta("taxation.summary","税制概要")}</div>${table("taxation.taxes",[{key:"name",label:"税名"},{key:"type",label:"分類"},{key:"rate",label:"税率%",type:"number"},{key:"base",label:"課税対象"},{key:"notes",label:"説明"}],"tax")}`)+card("予算・自動計算",`<div class="form-grid three">${calc("歳入合計",C.fmtNum(t.rev))}${calc("歳出合計",C.fmtNum(t.exp))}${calc("財政収支",C.fmtNum(t.bal))}${calc("財政収支/GDP",t.balPct!=null?t.balPct.toFixed(2)+"%":"—")}${calc("政府債務/GDP",t.debtPct!=null?t.debtPct.toFixed(1)+"%":"—")}</div><div class="split">${table("budget.revenue",[{key:"name",label:"歳入"},{key:"value",label:"金額",type:"number"}],"revenue")}${table("budget.expenditure",[{key:"name",label:"歳出"},{key:"value",label:"金額",type:"number"}],"expenditure")}</div>`)+card("中央銀行・為替・株式",`<div class="form-grid three">${field("advanced.finance.centralBank","中央銀行")}${field("advanced.finance.centralBankIndependence","中央銀行独立性 0-100","number")}${field("advanced.finance.policyRatePct","政策金利 %","number",{step:.01})}${field("advanced.finance.inflationTargetPct","インフレ目標 %","number",{step:.01})}${field("advanced.finance.fxRegime","為替制度")}${field("advanced.finance.baseFxPerUsd","1 USDあたり通貨単位","number",{step:.000001,note:"シミュレーション基準はUSD。例: 1 USD = 150 JPY なら150。"})}${field("advanced.finance.stockIndexName","代表株価指数名")}${field("advanced.finance.baseStockIndex","株価指数 基準値","number",{step:.01})}${select("advanced.finance.autoMarketEnabled","1時間自動変動",[["false","OFF（固定値）"],["true","ON（世界市場連動）"]])}${field("advanced.finance.averageHourlyMovePct","平均1時間変動 %","number",{step:.01,note:"通常は0.03〜0.15%程度。大きすぎる値は市場が荒くなります。"})}${field("advanced.finance.maxHourlyMovePct","最大1時間変動幅 %","number",{step:.01,note:"通常時の上限。強材料更新時もこの範囲を基本に抑えます。"})}${field("advanced.finance.stockAverageName","企業株価平均の名称", "text",{placeholder:"例: MFDCO30平均"})}${field("advanced.finance.marketCoefficient","市場係数","number",{step:.05,note:"1.0を基準。高いほど世界テーマに敏感。"})}${field("advanced.finance.fdiInUsd","対内投資(FDI) USD","number")}${field("advanced.finance.fdiOutUsd","対外投資(FDI) USD","number")}${field("advanced.finance.investmentGdpPct","国内総投資/GDP %","number",{step:.1})}${field("advanced.finance.capitalControls","資本規制")}${ta("advanced.finance.notes","金融・市場の説明")}</div>${marketBox()}`)+card("銀行",table("banks",[{key:"name",label:"銀行名"},{key:"type",label:"種類"},{key:"assetsUsd",label:"総資産USD",type:"number"},{key:"owner",label:"所有"},{key:"description",label:"説明"}],"bank")))),
  "industry":()=>(category("industry","産業・企業",card("主要産業・労働",`<div class="form-grid three">${field("advanced.labor.participationPct","労働参加率 %","number",{guide:"unemployment"})}${field("advanced.labor.employmentPct","就業率 %","number")}${field("advanced.labor.unemploymentPct","失業率 %","number",{guide:"unemployment"})}${field("advanced.labor.minimumWageUsd","最低賃金 USD換算","number")}${field("advanced.labor.averageWageUsd","平均賃金 USD換算","number")}${field("advanced.labor.averageHoursWeek","週平均労働時間","number")}${ta("advanced.labor.notes","労働市場の説明")}</div>${table("industries",[{key:"name",label:"産業"},{key:"share",label:"GDP比%",type:"number"},{key:"description",label:"説明"}],"industry")}`)+card("AI・ロボット・先端産業",`<div class="form-grid three">${field("advanced.technology.aiIndustryScore","AI産業 0-100","number",{min:0,max:100})}${field("advanced.technology.roboticsIndustryScore","ロボット産業 0-100","number",{min:0,max:100})}${field("advanced.technology.semiconductorScore","半導体産業 0-100","number",{min:0,max:100})}${field("advanced.technology.supercomputerScore","スパコン能力 0-100","number",{min:0,max:100})}${field("advanced.technology.spaceCapabilityScore","宇宙開発能力 0-100","number",{min:0,max:100})}${ta("advanced.technology.notes","先端産業の説明")}</div>`)+card("主要企業・利益・市場依存",table("companies",[{key:"name",label:"企業名"},{key:"type",label:"主要事業"},{key:"revenue",label:"売上",type:"number"},{key:"operatingProfit",label:"営業利益",type:"number"},{key:"netProfit",label:"純利益",type:"number"},{key:"marketCap",label:"時価総額",type:"number"},{key:"financialUnit",label:"単位"},{key:"stockTicker",label:"銘柄"},{key:"baseStockPrice",label:"基準株価USD",type:"number"},{key:"employees",label:"従業員",type:"number"},{key:"productionTags",label:"生産/強みタグ"},{key:"dependencyTags",label:"依存タグ"}],"company"),"タグ例: 石油, 半導体, AI, 海運")+card("財閥・企業グループ",table("conglomerates",[{key:"name",label:"名称"},{key:"parent",label:"中核企業"},{key:"sectors",label:"分野"},{key:"assetsUsd",label:"総資産USD",type:"number"},{key:"influence",label:"影響力"},{key:"description",label:"説明"}],"conglomerate"))+card("世界市場への依存・生産",table("marketDependencies",[{key:"name",label:"項目"},{key:"tags",label:"市場タグ"},{key:"dependencyPct",label:"輸入/依存%",type:"number"},{key:"productionPct",label:"生産/輸出%",type:"number"},{key:"notes",label:"説明"}],"marketDependency"),"1時間シミュレーションで使用。タグ例: 石油, 半導体, AI, 食料, 海運"))),
  "education":()=>(category("education","教育・研究",card("教育指標",`<div class="form-grid three">${field("advanced.education.spendingGdpPct","教育費/GDP %","number",{step:.1,guide:"educationSpend"})}${field("advanced.education.spendingBudgetPct","教育費/政府支出 %","number",{step:.1})}${field("advanced.education.literacyPct","識字率 %","number",{guide:"literacy"})}${field("advanced.education.primaryEnrollmentPct","初等就学率 %","number")}${field("advanced.education.secondaryEnrollmentPct","中等就学率 %","number")}${field("advanced.education.tertiaryAttainmentPct","高等教育修了率 %","number",{guide:"tertiary"})}${field("science.rndGdpPct","研究開発費/GDP %","number",{step:.1,guide:"rnd"})}${field("advanced.education.researchersPerMillion","研究者/100万人","number")}${field("advanced.education.brainDrainIndex","頭脳流出(-) / 流入(+)指数","number",{step:.1})}${ta("advanced.education.notes","教育・研究制度の説明")}</div>`)+card("大学",table("universities",[{key:"name",label:"大学"},{key:"city",label:"都市"},{key:"type",label:"区分"},{key:"students",label:"学生数",type:"number"},{key:"founded",label:"設立年",type:"number"},{key:"fields",label:"主要分野"},{key:"description",label:"説明"}],"university"))+card("研究機関",table("researchInstitutions",[{key:"name",label:"機関"},{key:"type",label:"種類"},{key:"city",label:"所在地"},{key:"researchers",label:"研究者",type:"number"},{key:"fields",label:"研究分野"},{key:"description",label:"説明"}],"researchInstitution")))),
  "society":()=>(category("society","社会・福祉",card("福祉・医療・格差",`<div class="form-grid three">${field("advanced.social.socialSpendingGdpPct","社会支出/GDP %","number",{guide:"social"})}${field("advanced.social.povertyPct","貧困率 %","number",{guide:"poverty"})}${field("advanced.social.gini","Gini係数","number",{step:.01,guide:"gini"})}${field("welfare.happinessIndex","国民幸福度 0-10","number",{step:.01,min:0,max:10,guide:"happiness"})}${field("welfare.hdi","HDI","number",{step:.001,min:0,max:1,guide:"hdi"})}${field("advanced.social.hospitalBedsPer1000","病床/1000人","number",{step:.1,guide:"beds"})}${field("advanced.social.doctorsPer1000","医師/1000人","number",{step:.1,guide:"doctors"})}${ta("welfare.healthcare","医療制度")}${ta("welfare.education","教育制度概要")}${ta("advanced.social.notes","社会・福祉の説明")}</div>`)+card("福祉制度",table("welfarePrograms",[{key:"name",label:"制度"},{key:"type",label:"分野",options:["年金","医療","失業","障害","生活保護","住宅","子育て","介護","その他"]},{key:"coveragePct",label:"対象率%",type:"number"},{key:"budget",label:"予算",type:"number"},{key:"description",label:"説明"}],"welfareProgram"))+`<div id="social-issues" class="anchor-target"></div>`+card("社会問題",table("socialIssues",[{key:"name",label:"問題"},{key:"category",label:"分類"},{key:"severity",label:"深刻度",options:["低","中","高","危機的"]},{key:"affectedPopulation",label:"影響人口",type:"number"},{key:"trend",label:"傾向",options:["改善","横ばい","悪化"]},{key:"summary",label:"説明"}],"socialIssue"))+card("政府政策",table("policies",[{key:"name",label:"政策"},{key:"ministry",label:"担当"},{key:"startYear",label:"開始年",type:"number"},{key:"budget",label:"予算",type:"number"},{key:"target",label:"目標/KPI"},{key:"status",label:"状態"},{key:"description",label:"説明"}],"policy"))+card("世論調査",table("opinionPolls",[{key:"date",label:"日付"},{key:"topic",label:"質問/対象"},{key:"supportPct",label:"支持%",type:"number"},{key:"opposePct",label:"反対%",type:"number"},{key:"sample",label:"標本数",type:"number"}],"opinionPoll"))+card("デモ・ストライキ",table("protests",[{key:"date",label:"日付"},{key:"name",label:"名称"},{key:"participants",label:"参加者",type:"number"},{key:"issue",label:"争点"},{key:"result",label:"結果"}],"protest"))+card("信頼・平等",`${table("trustMetrics",[{key:"name",label:"対象"},{key:"value",label:"信頼度%",type:"number"},{key:"year",label:"年"},{key:"description",label:"説明"}],"trustMetric")}${table("equalityMetrics",[{key:"name",label:"格差/平等指標"},{key:"value",label:"値",type:"number"},{key:"unit",label:"単位"},{key:"description",label:"説明"}],"equalityMetric")}`))),
  "security":()=>(category("security","治安・情報",card("治安指標",`<div class="form-grid three">${field("advanced.social.crimeRatePer100k","犯罪件数/10万人","number",{guide:"crime"})}${field("advanced.social.homicideRatePer100k","殺人/10万人","number",{step:.01,guide:"homicide"})}${field("advanced.social.peaceIndex","平和・治安 0-100","number",{guide:"peace"})}${field("advanced.social.trustPolicePct","警察信頼度 %","number")}${field("advanced.social.trustMilitaryPct","軍信頼度 %","number")}${field("advanced.social.civilDefenseCoveragePct","民間防衛カバー率 %","number",{guide:"civilDefense"})}${field("advanced.social.shelterCoveragePct","避難シェルター収容率 %","number")}${field("advanced.information.informationWarfareScore","情報戦能力 0-100","number")}${field("advanced.information.counterIntelligenceScore","防諜能力 0-100","number")}${field("advanced.information.assassinationDefenseScore","暗殺防御 0-100","number")}${field("advanced.information.cyberDefenseScore","サイバー防御 0-100","number")}${field("advanced.information.propagandaScore","宣伝・世論工作 0-100","number")}${ta("advanced.information.notes","情報機関・防諜の説明")}</div>`)+card("具体的な警察組織",table("policeOrganizations",[{key:"name",label:"組織名"},{key:"type",label:"種類"},{key:"personnel",label:"人員",type:"number"},{key:"jurisdiction",label:"管轄"},{key:"powers",label:"権限"},{key:"description",label:"説明"}],"policeOrg"))+card("犯罪組織",table("criminalOrganizations",[{key:"name",label:"組織名"},{key:"type",label:"種類"},{key:"ideology",label:"思想"},{key:"members",label:"規模",type:"number"},{key:"area",label:"活動地域"},{key:"threat",label:"脅威度"},{key:"description",label:"説明"}],"criminalOrg"))+card("思想・過激思想",table("ideologies",[{key:"name",label:"思想名"},{key:"type",label:"分類"},{key:"supportPct",label:"支持率%",type:"number"},{key:"groups",label:"関連組織"},{key:"description",label:"説明"}],"ideology"))+card("情報戦・スパイ・暗殺防御",table("securityPrograms",[{key:"name",label:"制度/作戦"},{key:"type",label:"分野",options:["情報戦","防諜","暗殺防御","サイバー","心理戦","監視","その他"]},{key:"agency",label:"担当機関"},{key:"score",label:"能力0-100",type:"number"},{key:"description",label:"説明"}],"securityProgram")))),
  "resources":()=>(category("resources","資源・環境",card("食料・水・漁業",`<div class="form-grid three">${field("food.selfSufficiencyCaloriePct","食料自給率(カロリー)%","number",{guide:"food"})}${field("food.selfSufficiencyProductionValuePct","食料自給率(生産額)%","number")}${field("food.strategicReserveDays","食料備蓄 日","number")}${field("advanced.resources.waterSecurityPct","水安全保障/自給 0-100","number")}${field("advanced.resources.fishSelfSufficiencyPct","水産物自給率 %","number")}${field("advanced.resources.fisheriesOutput","漁業・養殖生産量","number")}${ta("food.notes","食料事情の説明")}</div>`)+card("エネルギー",`<div class="form-grid three">${field("energy.selfSufficiencyPct","エネルギー自給率 %","number",{guide:"energy"})}${field("energy.renewablePct","再エネ比率 %","number")}${field("advanced.resources.strategicOilDays","石油備蓄 日","number")}${field("advanced.resources.strategicGasDays","天然ガス備蓄 日","number")}${field("advanced.resources.strategicCoalDays","石炭備蓄 日","number")}${field("advanced.resources.powerReserveMarginPct","電力予備率 %","number",{guide:"powerReserve"})}${field("advanced.resources.outageHoursYear","年間停電時間","number")}${field("advanced.resources.outageCountYear","年間停電回数","number")}${ta("energy.notes","エネルギー事情")}</div>${table("energy.sources",[{key:"name",label:"電源/資源"},{key:"sharePct",label:"構成比%",type:"number"},{key:"selfSufficiencyPct",label:"自給率%",type:"number"},{key:"generationTwh",label:"発電TWh",type:"number"},{key:"capacityGw",label:"容量GW",type:"number"},{key:"notes",label:"説明"}],"energySource")}`)+card("資源埋蔵・自給",table("resourceReserves",[{key:"name",label:"資源"},{key:"selfSufficiencyPct",label:"自給率%",type:"number"},{key:"reserves",label:"埋蔵量",type:"number"},{key:"unit",label:"単位"},{key:"annualOutput",label:"年産",type:"number"},{key:"yearsRemaining",label:"可採年数",type:"number"},{key:"description",label:"説明"}],"resourceReserve"))+card("環境・公害",`<div class="form-grid three">${field("advanced.environment.ghgMtCo2e","温室効果ガス MtCO2e","number")}${field("advanced.environment.co2PerCapita","CO2/人 t","number",{step:.01})}${field("advanced.environment.netZeroYear","ネットゼロ年","number")}${field("advanced.environment.ndcTarget","削減目標/NDC")}${field("advanced.environment.pm25","PM2.5","number",{step:.1})}${field("advanced.environment.forestPct","森林率 %","number",{guide:"forest"})}${field("advanced.environment.recyclingPct","リサイクル率 %","number",{guide:"recycling"})}${field("advanced.environment.wastePerCapitaKg","廃棄物 kg/人年","number")}${field("advanced.environment.waterPollutionIndex","水質汚染指数 0-100","number")}${ta("advanced.environment.notes","環境政策の説明")}</div>${table("environmentalIssues",[{key:"name",label:"問題/公害"},{key:"type",label:"種類"},{key:"region",label:"地域"},{key:"severity",label:"深刻度"},{key:"cause",label:"原因"},{key:"impact",label:"被害"},{key:"response",label:"対策"}],"environmentIssue")}`)+card("SDGs・国家目標",table("sdgGoals",[{key:"goal",label:"目標"},{key:"status",label:"進捗",options:["達成","順調","進展","停滞","後退"]},{key:"score",label:"0-100",type:"number"},{key:"targetYear",label:"目標年",type:"number"},{key:"description",label:"取り組み"}],"sdgGoal")))),
  "infra":()=>(category("infra","交通・インフラ",card("交通・物流指標",`<div class="form-grid three">${field("advanced.infrastructure.roadKm","道路総延長 km","number")}${field("advanced.infrastructure.expresswayKm","高速道路 km","number")}${field("advanced.infrastructure.railKm","鉄道総延長 km","number")}${field("advanced.infrastructure.railElectrificationPct","鉄道電化率 %","number")}${field("advanced.infrastructure.highSpeedRailKm","高速鉄道 km","number")}${field("advanced.infrastructure.logisticsIndex","物流指数 0-5","number",{step:.01,guide:"logistics"})}${field("advanced.infrastructure.waterCoveragePct","上水道普及率 %","number")}${field("advanced.infrastructure.sewerageCoveragePct","下水道普及率 %","number")}${ta("advanced.infrastructure.notes","インフラの説明")}</div>`)+card("高速道路網",table("highways",[{key:"name",label:"路線名"},{key:"route",label:"区間"},{key:"lengthKm",label:"延長km",type:"number"},{key:"lanes",label:"車線数",type:"number"},{key:"maxSpeed",label:"最高速度km/h",type:"number"},{key:"operator",label:"運営"},{key:"openedYear",label:"開通年",type:"number"}],"highway"))+card("鉄道路線",table("railways",[{key:"name",label:"路線名"},{key:"type",label:"種別",options:["在来線","高速鉄道","地下鉄","貨物鉄道","モノレール","その他"]},{key:"route",label:"区間"},{key:"lengthKm",label:"延長km",type:"number"},{key:"gaugeMm",label:"軌間mm",type:"number"},{key:"electrified",label:"電化"},{key:"maxSpeed",label:"最高速度km/h",type:"number"},{key:"operator",label:"運営"}],"railway"))+card("港湾",table("ports",[{key:"name",label:"港"},{key:"city",label:"都市"},{key:"type",label:"種類"},{key:"throughput",label:"取扱量"},{key:"military",label:"軍港"},{key:"description",label:"説明"}],"port"))+card("空港",table("airports",[{key:"name",label:"空港"},{key:"city",label:"都市"},{key:"passengers",label:"年間旅客",type:"number"},{key:"cargo",label:"貨物"},{key:"runways",label:"滑走路",type:"number"},{key:"military",label:"軍民共用"},{key:"description",label:"説明"}],"airport")))),
  "culture":()=>(category("culture","文化・遺産",card("文化・スポーツ・芸術",`${listLines("culture.ethnicGroups","民族・住民集団")}${listLines("culture.holidays","祝祭日")}${listLines("culture.sports","主要スポーツ・競技")}${listLines("culture.arts","芸術・文化分野")}${listLines("culture.food","食文化・料理")}${ta("culture.notes","文化の説明")}<div class="form-grid three">${field("infrastructure.internetPct","インターネット普及率 %","number",{guide:"internet"})}</div>${table("socialPlatforms",[{key:"name",label:"SNS/メディア"},{key:"type",label:"運営"},{key:"penetrationPct",label:"普及率%",type:"number"},{key:"censorship",label:"検閲/監視"},{key:"dailyLimit",label:"制限"},{key:"description",label:"説明"}],"socialPlatform")}`)+card("国宝・遺跡・文化財",`${table("heritageSites",[{key:"name",label:"名称"},{key:"type",label:"種類",options:["国宝","遺跡","史跡","城郭","宗教施設","自然遺産","文化遺産","その他"]},{key:"region",label:"所在地"},{key:"period",label:"時代"},{key:"description",label:"説明"}],"heritage")}<p class="fine">各文化財の画像は追加後に専用の「画像」ボタンからファイル選択できます。</p><div id="heritage-media-list"></div>`))),
  "history":()=>(category("history","歴史・軍事・外交",card("歴史",`<div class="toolbar"><a class="btn secondary small" href="country-history.html?id=${id}">年表専用編集</a><a class="btn ghost small" href="country-wiki.html?id=${id}">Wiki記事</a></div><p class="fine">大量の出来事は専用年表で1件ずつ追加できます。</p>`)+card("軍事",`<div class="form-grid three">${field("military.personnel","現役兵力","number")}${field("military.reservePersonnel","予備役","number")}${field("military.paramilitaryPersonnel","準軍事組織","number")}${field("military.budget","軍事予算","number")}${field("military.nuclearWarheads","核弾頭","number")}${field("military.conscription","徴兵制度")}${field("military.commanderInChief","最高指揮権")}${field("military.headquarters","最高司令部")}${ta("military.doctrine","軍事ドクトリン")}</div><div class="toolbar"><a class="btn secondary small" href="country-arsenal.html?id=${id}">正式採用兵器（種類別）</a><a class="btn ghost small" href="country-strength.html?id=${id}">国家力分析</a></div>`)+card("外交",`<div class="form-grid three">${select("advanced.foreignPolicy.openness","外交の積極性",[["isolation","鎖国"],["closed","閉鎖的"],["cautious","消極的"],["balanced","中立・選択的"],["active","積極的"],["very_active","非常に積極的"]])}${ta("advanced.foreignPolicy.notes","外交方針・対外政策の説明",{rows:2})}</div><div class="toolbar"><a class="btn secondary small" href="country-exchange.html?id=${id}">同盟・条約・貿易</a><a class="btn ghost small" href="country-organizations.html?id=${id}">国際機関</a></div><p class="fine">成立済みの同盟・条約は公開国家ページにも表示されます。</p>`))),
  "publishing":()=>(category("publishing","ニュース・分析",card("公開・ニュース",`<div class="toolbar"><a class="btn secondary small" href="country-feed.html">国家ニュース</a><a class="btn ghost small" href="country-post-edit.html?id=${id}">新規投稿</a><a class="btn ghost small" href="country-rights.html?id=${id}&return=${encodeURIComponent(location.href)}">登場・二次利用条件</a><a class="btn ghost small" href="country.html?id=${id}#country-media-downloads">国家ページの素材設定</a></div>`)+card("自動補完",`<p>関心のない空欄を、既存の人口・GDP・政体・技術・資源・戦争状態などから補完します。既存の入力値は上書きしません。</p><div id="autofill-summary" class="alert info">まだ実行していません。</div><button id="autofill-inline" type="button" class="btn">空欄を自動補完</button>`)+card("計算・分析",`<div class="metric-grid"><div class="metric"><div class="metric-label">国家力</div><div class="metric-value">${C.calculateStrength(c).total}</div></div><div class="metric"><div class="metric-label">資料完成度</div><div class="metric-value">${C.calculateCompleteness(c)}%</div></div><div class="metric"><div class="metric-label">文明レベル</div><div class="metric-value">${esc(c.advanced?.civilization?.yearEquivalent||"—")}</div><div class="metric-sub">史実西暦相当</div></div></div><div class="toolbar"><a class="btn secondary small" href="country-stats.html?id=${id}">図表</a><a class="btn ghost small" href="country-strength.html?id=${id}">国家力</a><a class="btn ghost small" href="country-compare.html?ids=${id}">比較</a></div>`)))
 };
 const renderer=renderers[activeCategory]||renderers.overview;
 suppressDetailToggle=true;
 main.innerHTML=renderer();
 updateNavState();
 bind();
 renderHeritageMedia();
 setTimeout(()=>{suppressDetailToggle=false},0);
}
function mark(){
 dirty=true;
 if(state){state.textContent="未保存";state.className="save-state saving"}
 if(bottom){bottom.textContent="未保存の変更があります";bottom.className="save-state saving"}
 clearTimeout(draftTimer);
 draftTimer=setTimeout(()=>LocalDB?.saveCountryDraft?.(c?.id||id,"legacy-country",C.clone(c)).catch(()=>{}),500);
}
function captureDetailState(){
 main.querySelectorAll("details.compact-details[data-detail-key]").forEach(detail=>{detailState.set(detail.dataset.detailKey,detail.open)});
}
function bind(){
 main.querySelectorAll("details.compact-details[data-detail-key]").forEach(detail=>{
  detail.addEventListener("toggle",()=>{
   if(suppressDetailToggle)return;
   detailState.set(detail.dataset.detailKey,detail.open);
  });
 });
 main.querySelectorAll(".v11-bind").forEach(el=>el.addEventListener("input",()=>{let v=el.value;if(el.type==="number")v=el.value===""?null:Number(el.value);if(el.dataset.path==="isPublic"||el.dataset.path==="advanced.finance.autoMarketEnabled")v=el.value==="true";if(["culture.languages","culture.religions"].includes(el.dataset.path))v=String(v).split(",").map(x=>x.trim()).filter(Boolean);s(el.dataset.path,v);if(el.dataset.path==="timekeeping.longitude"&&c.timekeeping.utcMode!=="manual"){c.timekeeping.utcOffset=C.autoUtcFromLongitude(v);c.timekeeping.standardMeridian=C.standardMeridianFromUtc(c.timekeeping.utcOffset)}mark()}));
 main.querySelectorAll(".v11-pop").forEach(el=>el.addEventListener("input",()=>{s(el.dataset.path,Math.round(C.num(el.value)*10000));mark()}));
 main.querySelectorAll(".v11-lines").forEach(el=>el.addEventListener("input",()=>{s(el.dataset.path,el.value.split("\n").map(x=>x.trim()).filter(Boolean));mark()}));
 main.querySelectorAll(".v11-arr").forEach(el=>el.addEventListener("input",()=>{const rows=C.arr(g(el.dataset.path)),i=+el.dataset.index,key=el.dataset.key;rows[i]??={};let v=el.value;if(el.type==="number")v=el.value===""?null:Number(el.value);if(el.dataset.population==="1")v=Math.round(C.num(el.value)*10000);rows[i][key]=v;s(el.dataset.path,rows);mark()}));
 main.querySelectorAll(".v11-del").forEach(el=>el.addEventListener("click",()=>{const parent=el.closest("details.compact-details[data-detail-key]");if(parent)detailState.set(parent.dataset.detailKey,true);captureDetailState();const rows=C.arr(g(el.dataset.path)).slice();rows.splice(+el.dataset.index,1);s(el.dataset.path,rows);mark();render()}));
 main.querySelectorAll(".v11-add").forEach(el=>el.addEventListener("click",()=>{const parent=el.closest("details.compact-details[data-detail-key]");if(parent)detailState.set(parent.dataset.detailKey,true);captureDetailState();const path=el.dataset.path,rows=C.arr(g(path)).slice();rows.push(factory(el.dataset.kind));s(path,rows);mark();render()}));
 main.querySelectorAll(".v11-media").forEach(el=>el.addEventListener("change",async()=>{const file=el.files?.[0];if(!file)return;try{s(el.dataset.path,await Cloud.uploadMedia(c,file,el.dataset.path));mark();render()}catch(e){V.toast(e.message||String(e),"danger")}}));
 for(const q of ["autofill-inline"]){const b=document.getElementById(q);if(b)b.addEventListener("click",runAutofill)}
}
function factory(kind){const x={id:C.uid(),description:""};const defs={externalLink:{label:"公式サイト",url:"https://",description:""},territory:{name:"新しい海外領土",type:"海外領土",area:0,population:0,autonomy:"",resources:""},dispute:{name:"新しい係争地域",claimants:"",control:"",since:"",status:"",description:""},border:{neighbor:"",type:"陸上",lengthKm:0,crossings:"",description:""},overseasBase:{name:"新しい基地",hostCountry:"",type:"軍事基地",personnel:0,leaseUntil:"",description:""},tax:{name:"新しい税",type:"直接税",rate:0,base:"",notes:""},revenue:{name:"新しい歳入",value:0},expenditure:{name:"新しい歳出",value:0},bank:{name:"新しい銀行",type:"商業銀行",assetsUsd:0,owner:"",description:""},industry:{name:"新しい産業",share:0,description:""},company:{name:"新しい企業",type:"",revenue:0,operatingProfit:0,netProfit:0,marketCap:0,financialUnit:"億USD",stockTicker:"",baseStockPrice:0,employees:0,productionTags:"",dependencyTags:"",summary:""},conglomerate:{name:"新しい企業グループ",parent:"",sectors:"",assetsUsd:0,influence:"",description:""},marketDependency:{name:"新しい市場項目",tags:"",dependencyPct:0,productionPct:0,notes:""},university:{name:"新しい大学",city:"",type:"国立",students:0,founded:"",fields:"",description:""},researchInstitution:{name:"新しい研究機関",type:"国立",city:"",researchers:0,fields:"",description:""},welfareProgram:{name:"新しい福祉制度",type:"その他",coveragePct:0,budget:0,description:""},socialIssue:{name:"新しい社会問題",category:"社会",severity:"中",affectedPopulation:0,trend:"横ばい",summary:""},policy:{name:"新しい政策",ministry:"",startYear:"",budget:0,target:"",status:"実施中",description:""},opinionPoll:{date:new Date().toISOString().slice(0,10),topic:"",supportPct:0,opposePct:0,sample:0},protest:{date:"",name:"",participants:0,issue:"",result:""},trustMetric:{name:"政府",value:0,year:"",description:""},equalityMetric:{name:"地域格差",value:0,unit:"",description:""},policeOrg:{name:"新しい警察組織",type:"警察",personnel:0,jurisdiction:"",powers:"",description:""},criminalOrg:{name:"新しい犯罪組織",type:"組織犯罪",ideology:"",members:0,area:"",threat:"中",description:""},ideology:{name:"新しい思想",type:"政治思想",supportPct:0,groups:"",description:""},securityProgram:{name:"新しい安全保障制度",type:"防諜",agency:"",score:0,description:""},energySource:{name:"新しい電源",sharePct:0,selfSufficiencyPct:0,generationTwh:0,capacityGw:0,notes:""},resourceReserve:{name:"新しい資源",selfSufficiencyPct:0,reserves:0,unit:"",annualOutput:0,yearsRemaining:0,description:""},environmentIssue:{name:"新しい環境問題",type:"公害",region:"",severity:"中",cause:"",impact:"",response:""},sdgGoal:{goal:"新しい目標",status:"進展",score:0,targetYear:"",description:""},port:{name:"新しい港湾",city:"",type:"商港",throughput:"",military:"いいえ",description:""},airport:{name:"新しい空港",city:"",passengers:0,cargo:"",runways:1,military:"いいえ",description:""},highway:{name:"新しい高速道路",route:"",lengthKm:0,lanes:4,maxSpeed:100,operator:"",openedYear:null,description:""},railway:{name:"新しい鉄道路線",type:"在来線",route:"",lengthKm:0,gaugeMm:1067,electrified:"はい",maxSpeed:120,operator:"",description:""},socialPlatform:{name:"新しいSNS",type:"民営",penetrationPct:0,censorship:"",dailyLimit:"",description:""},heritage:{name:"新しい文化財",type:"国宝",region:"",period:"",description:"",imageKey:""}};return {...x,...(defs[kind]||{})}}
async function runAutofill(){captureDetailState();if(!confirm("未入力項目のみを国の現状から自動補完します。既存値は上書きしません。実行しますか？"))return;const r=X.autofill(c),a=r.classification||{};mark();render();const box=document.getElementById("autofill-summary");if(box){const wealth=a.wealth==="high"?"高所得":a.wealth==="mid"?"中所得":"低所得";box.textContent=`${r.changed.length}項目を補完しました。判定: ${wealth} / 技術 ${Math.round(a.tech||0)} / 産業 ${Math.round(a.industry||0)} / ${a.authoritarian?"統制的政体":"非統制的政体"}${a.war?" / 戦争・紛争影響あり":""}${a.stressed?" / 経済・財政ストレスあり":""}。既存値は変更していません。`}}
async function renderHeritageMedia(){const host=document.getElementById("heritage-media-list");if(!host)return;const rows=C.arr(c.heritageSites);host.innerHTML=rows.map((r,i)=>`<div class="heritage-media-row"><span>${esc(r.name)}</span><input type="file" accept="image/*" data-i="${i}" class="heritage-file"><small>${r.imageKey?"画像設定済み":"画像なし"}</small></div>`).join("");host.querySelectorAll(".heritage-file").forEach(el=>el.addEventListener("change",async()=>{const f=el.files?.[0];if(!f)return;try{rows[+el.dataset.i].imageKey=await Cloud.uploadMedia(c,f,"heritage");c.heritageSites=rows;mark();renderHeritageMedia()}catch(e){V.toast(e.message||String(e),"danger")}}))}
async function save(){
 if(state){state.textContent="保存中...";state.className="save-state saving"}
 try{
  c.area=c.territory?.area||c.area;c._index=c._index||{};
  c._index.strength=C.calculateStrength(c).total;c._index.completeness=C.calculateCompleteness(c);
  await V.save(c);
  await LocalDB?.clearCountryDraft?.(c.id,"legacy-country").catch(()=>{});
  dirty=false;
  if(state){state.textContent="保存済み";state.className="save-state saved"}
  if(bottom){bottom.textContent="保存済み";bottom.className="save-state saved"}
  V.toast("保存しました")
 }catch(e){
  if(state){state.textContent="保存エラー";state.className="save-state error"}
  V.toast(e.message||String(e),"danger")
 }
}

boot();
})();
