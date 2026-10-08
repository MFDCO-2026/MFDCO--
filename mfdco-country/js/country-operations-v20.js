"use strict";
document.addEventListener("DOMContentLoaded",async()=>{
 const C=window.MFDCOCountry,V=window.MFDCOCountryV6,D=window.MFDCOCountryV20Data,L=window.MFDCOCountryLocalDB;
 const root=document.getElementById("operations-app");
 const country=await V.load();
 const countryId=country.id;
 let active="core";
 const docState={};

 const groups=[
  ["core","予算・人口・需給"],
  ["government","政府・議会・行政"],
  ["economy","貿易・企業・国家計画"],
  ["science","技術・災害・社会"],
  ["diplomacy","外交・条約"],
  ["military","軍備・編制"],
  ["access","公開・変更履歴"]
 ];

 const entityDefs={
  law_history:{label:"法律・政策履歴",fields:[["kind","区分","法律"],["enacted","制定日",""],["revised","最終改正",""],["repealed","廃止日",""]]},
  region:{label:"行政区",fields:[["level","階層","州/県/市"],["population","人口","0","number"],["gdp","GDP","0","number"],["capital","中心都市",""]]},
  cabinet:{label:"政権・内閣",fields:[["leader","首班",""],["party","政党・連立",""],["start","開始",""],["end","終了",""]]},
  election:{label:"議会・選挙",fields:[["date","選挙日",""],["turnout","投票率%","0","number"],["seats","議席数","0","number"],["winner","第一党",""]]},
  ministry:{label:"省庁・国家機関",fields:[["category","種別","省庁"],["head","長",""],["parent","上位組織",""],["budget","予算","0","number"]]},
  court:{label:"司法・裁判所",fields:[["level","階層","最高裁"],["jurisdiction","管轄",""],["judges","裁判官数","0","number"]]},
  citizenship_rule:{label:"国籍・在留制度",fields:[["category","区分","国籍"],["requirement","条件",""],["dual","二重国籍","条件付可"],["residenceYears","必要在留年数","0","number"]]},
  trade_partner:{label:"貿易相手・関税",fields:[["partner","相手国",""],["exports","輸出額","0","number"],["imports","輸入額","0","number"],["tariff","平均関税率%","0","number"]]},
  company_profile:{label:"企業・市場連携",fields:[["sector","業種",""],["stockTicker","銘柄コード",""],["baseStockPrice","基準株価","1000","number"],["revenue","売上","0","number"],["profit","純利益","0","number"],["marketCap","時価総額","0","number"],["stateShare","国有比率%","0","number"],["productionTags","強みタグ",""],["dependencyTags","依存タグ",""]]},
  national_project:{label:"国家事業・計画",fields:[["category","分野","インフラ"],["budget","予算","0","number"],["progress","進捗率%","0","number"],["start","開始",""],["due","完成予定",""]]},
  national_goal:{label:"国家目標",fields:[["metric","指標",""],["target","目標値",""],["targetYear","期限",""],["progress","進捗率%","0","number"]]},
  technology:{label:"研究・技術",fields:[["category","分野",""],["level","技術レベル","0","number"],["progress","研究進捗%","0","number"],["prerequisite","前提技術",""]]},
  crisis:{label:"災害・危機",fields:[["date","発生日",""],["category","種類",""],["severity","重大度","中"],["loss","損失額","0","number"],["response","復旧状況",""]]},
  social_stability:{label:"治安・社会安定",fields:[["stability","社会安定度","50","number"],["support","政府支持率%","50","number"],["crime","犯罪率","0","number"],["protests","抗議規模","0","number"]]},
  embassy:{label:"大使館・外交官",fields:[["hostCountry","駐在国",""],["city","都市",""],["ambassador","大使",""],["state","状態","開設"]]},
  treaty_obligation:{label:"条約義務・期限",fields:[["treaty","条約",""],["obligation","義務",""],["due","期限",""],["compliance","履行状態","履行中"]]},
  diplomacy_effect:{label:"外交関係の実効効果",fields:[["target","対象国",""],["effect","効果","貿易"],["tradeModifier","貿易補正%","0","number"],["securityModifier","安全保障補正","0","number"]]},
  military_inventory:{label:"装備在庫",fields:[["equipment","装備名/Work",""],["active","配備数","0","number"],["reserve","予備数","0","number"],["storage","保管数","0","number"],["annualProduction","年間生産","0","number"]]},
  military_unit:{label:"軍事編成",fields:[["branch","軍種",""],["parent","上位部隊",""],["personnel","人員","0","number"],["location","所在地",""]]}
 };

 const groupEntities={
  government:["law_history","region","cabinet","election","ministry","court","citizenship_rule"],
  economy:["trade_partner","company_profile","national_project","national_goal"],
  science:["technology","crisis","social_stability"],
  diplomacy:["embassy","treaty_obligation","diplomacy_effect"],
  military:["military_inventory","military_unit"]
 };

 function esc(v){return C.esc(v??"")}
 function fmt(v){return v==null?"—":new Intl.NumberFormat("ja-JP",{maximumFractionDigits:2}).format(Number(v))}
 function statusOptions(v){return [["official","公式"],["draft","草案"],["archived","アーカイブ"]].map(([x,l])=>`<option value="${x}" ${x===v?"selected":""}>${l}</option>`).join("")}
 function visOptions(v){return [["public","公開"],["members","加盟者"],["collaborators","共同編集者"],["owner","所有者のみ"]].map(([x,l])=>`<option value="${x}" ${x===v?"selected":""}>${l}</option>`).join("")}

 async function loadDocs(){
  const legacyBudget={year:country.budget?.year||"",revenueTotal:C.arr(country.budget?.revenue).reduce((a,x)=>a+C.num(x.value),0),expenditureTotal:C.arr(country.budget?.expenditure).reduce((a,x)=>a+C.num(x.value),0),debt:country.advanced?.fiscal?.debtAmount||0,defense:country.military?.budget||0,education:0,welfare:0,infrastructure:0,research:0,notes:""};
  const legacyDemo={referenceYear:country.populationYear||"",births:0,deaths:0,immigration:country.advanced?.migration?.immigrantsAnnual||0,emigration:country.advanced?.migration?.emigrantsAnnual||0,childrenPct:country.population?C.num(country.populationGroups?.children)/country.population*100:0,workingPct:country.population?C.num(country.populationGroups?.working)/country.population*100:0,elderlyPct:country.population?C.num(country.populationGroups?.elderly)/country.population*100:0,notes:""};
  const legacySupply={foodProduction:country.food?.selfSufficiencyCaloriePct||0,foodConsumption:100,powerGeneration:country.infrastructure?.electricityTwh||0,powerDemand:country.infrastructure?.electricityTwh||0,oilProduction:0,oilConsumption:0,strategicReserveDays:country.food?.strategicReserveDays||0,notes:""};
  docState.budget=await D.getDocument(countryId,"budget",legacyBudget);
  docState.demography=await D.getDocument(countryId,"demography",legacyDemo);
  docState.supply=await D.getDocument(countryId,"supply",legacySupply);
 }

 async function render(){
  if(active==="core")return renderCore();
  if(active==="access")return renderAccess();
  return renderEntities(active);
 }

 function shell(body){
  root.innerHTML=`<div class="operations-layout"><aside class="operations-nav">${groups.map(([k,l])=>`<button type="button" class="operations-tab ${active===k?"active":""}" data-tab="${k}">${l}</button>`).join("")}</aside><section class="operations-main">${body}</section></div>`;
  root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{active=b.dataset.tab;render()});
 }

 function docFields(prefix,payload,fields){
  return `<div class="form-grid three">${fields.map(([k,l,type="number"])=>`<div class="field"><label>${l}</label><input class="input op-doc" data-doc="${prefix}" data-key="${k}" type="${type}" ${type==="number"?'step="any"':""} value="${esc(payload?.[k]??"")}"></div>`).join("")}</div>`;
 }
 function docMeta(name,row){
  return `<div class="form-grid three operations-doc-meta">
   <div class="field"><label>状態</label><select class="select op-doc-meta" data-doc="${name}" data-key="status">${statusOptions(row?.status||"draft")}</select></div>
   <div class="field"><label>公開範囲</label><select class="select op-doc-meta" data-doc="${name}" data-key="visibility">${visOptions(row?.visibility||"owner")}</select></div>
  </div>`;
 }
 async function renderCore(){
  const b=docState.budget?.payload||{},d=docState.demography?.payload||{},s=docState.supply?.payload||{};
  const trade=await D.listEntities(countryId,"trade_partner");
  const metrics=D.computeMetrics(country,{budget:b,demography:d,supply:s,tradePartners:trade});
  shell(`
   <section class="card section-card"><div class="section-head"><div><h2>国家予算</h2><p>歳入・歳出・債務は計算指標へ連動します。</p></div><button class="btn small save-doc" data-doc="budget">保存</button></div>
   ${docMeta("budget",docState.budget)}${docFields("budget",b,[["year","年度","text"],["revenueTotal","歳入総額"],["expenditureTotal","歳出総額"],["debt","政府債務"],["defense","防衛"],["education","教育"],["welfare","福祉"],["infrastructure","インフラ"],["research","研究"]])}
   <div class="field"><label>注記</label><textarea class="textarea op-doc" data-doc="budget" data-key="notes">${esc(b.notes||"")}</textarea></div></section>
   <section class="card section-card"><div class="section-head"><div><h2>人口動態</h2><p>出生・死亡・移民から年間純増減を算出します。</p></div><button class="btn small save-doc" data-doc="demography">保存</button></div>
   ${docMeta("demography",docState.demography)}${docFields("demography",d,[["referenceYear","基準年","text"],["births","出生数"],["deaths","死亡数"],["immigration","移入"],["emigration","移出"],["childrenPct","年少人口%"],["workingPct","生産年齢人口%"],["elderlyPct","高齢人口%"]])}</section>
   <section class="card section-card"><div class="section-head"><div><h2>食料・電力・資源需給</h2><p>生産/需要から自給率を自動計算します。</p></div><button class="btn small save-doc" data-doc="supply">保存</button></div>
   ${docMeta("supply",docState.supply)}${docFields("supply",s,[["foodProduction","食料生産"],["foodConsumption","食料消費"],["powerGeneration","発電量"],["powerDemand","電力需要"],["oilProduction","石油生産"],["oilConsumption","石油消費"],["strategicReserveDays","戦略備蓄日数"]])}</section>
   <section class="card section-card"><h2>自動計算</h2><div class="metric-grid">
   <div class="metric"><div class="metric-label">財政収支</div><div class="metric-value">${fmt(metrics.fiscalBalance)}</div></div>
   <div class="metric"><div class="metric-label">債務/GDP</div><div class="metric-value">${metrics.debtGdpPct==null?"—":fmt(metrics.debtGdpPct)+"%"}</div></div>
   <div class="metric"><div class="metric-label">人口純増減</div><div class="metric-value">${fmt(metrics.netPopulationChange)}</div></div>
   <div class="metric"><div class="metric-label">食料自給率</div><div class="metric-value">${metrics.foodSelfSufficiency==null?"—":fmt(metrics.foodSelfSufficiency)+"%"}</div></div>
   <div class="metric"><div class="metric-label">電力自給率</div><div class="metric-value">${metrics.powerSelfSufficiency==null?"—":fmt(metrics.powerSelfSufficiency)+"%"}</div></div>
   <div class="metric"><div class="metric-label">貿易収支</div><div class="metric-value">${fmt(metrics.tradeBalance)}</div></div>
   </div><div class="toolbar"><button id="save-metrics" class="btn secondary">計算値を検索用キャッシュへ保存</button></div></section>`);
  bindDocInputs();document.getElementById("save-metrics").onclick=async()=>{await D.saveMetrics(countryId,metrics);V.toast("計算値を保存しました")};
 }

 function bindDocInputs(){
  root.querySelectorAll(".op-doc-meta").forEach(el=>el.onchange=async()=>{
   const row=docState[el.dataset.doc];row[el.dataset.key]=el.value;
   await L?.saveCountryDraft?.(countryId,`document:${el.dataset.doc}`,row);
  });
  root.querySelectorAll(".op-doc").forEach(el=>el.oninput=async()=>{
   const name=el.dataset.doc,key=el.dataset.key,row=docState[name],p=row.payload||{};
   p[key]=el.type==="number"?(el.value===""?null:Number(el.value)):el.value;row.payload=p;
   await L?.saveCountryDraft?.(countryId,`document:${name}`,row);
  });
  root.querySelectorAll(".save-doc").forEach(b=>b.onclick=async()=>{
   const name=b.dataset.doc,row=docState[name];
   docState[name]=await D.saveDocument(countryId,name,row.payload,{status:row.status||"draft",visibility:row.visibility||"owner"});
   V.toast("保存しました");
  });
 }

 async function renderEntities(group){
  const types=groupEntities[group]||[];
  const blocks=[];
  for(const type of types){
   const def=entityDefs[type],rows=await D.listEntities(countryId,type);
   blocks.push(`<section class="card section-card"><div class="section-head"><div><h2>${def.label}</h2><p>${rows.length}件</p></div><button type="button" class="btn small add-entity" data-type="${type}">＋追加</button></div>
   <div class="operations-entity-list">${rows.map(r=>entityCard(type,r,def)).join("")||'<div class="empty">まだありません。</div>'}</div></section>`);
  }
  shell(blocks.join(""));
  bindEntities();
 }
 function entityCard(type,r,def){
  return `<div class="operations-entity" data-id="${r.id}" data-type="${type}">
   <div class="form-grid three">
    <div class="field"><label>名称</label><input class="input ent-base" data-key="name" value="${esc(r.name)}"></div>
    <div class="field"><label>状態</label><select class="select ent-base" data-key="status">${statusOptions(r.status)}</select></div>
    <div class="field"><label>公開範囲</label><select class="select ent-base" data-key="visibility">${visOptions(r.visibility)}</select></div>
    ${def.fields.map(([k,l,ph="",type2="text"])=>`<div class="field"><label>${l}</label><input class="input ent-payload" data-key="${k}" type="${type2}" ${type2==="number"?'step="any"':""} placeholder="${esc(ph)}" value="${esc(r.payload?.[k]??"")}"></div>`).join("")}
   </div><div class="toolbar"><button class="btn small save-entity">保存</button><button class="btn danger small delete-entity">削除</button></div>
  </div>`;
 }
 function bindEntities(){
  root.querySelectorAll(".add-entity").forEach(b=>b.onclick=async()=>{
   await D.saveEntity(countryId,{name:"新しい項目",status:"draft",visibility:"owner",payload:{}},{entityType:b.dataset.type});render()
  });
  root.querySelectorAll(".operations-entity").forEach(box=>{
   const id=box.dataset.id,type=box.dataset.type;
   box.querySelector(".save-entity").onclick=async()=>{
    const entity={id,payload:{}};
    box.querySelectorAll(".ent-base").forEach(el=>entity[el.dataset.key]=el.value);
    box.querySelectorAll(".ent-payload").forEach(el=>entity.payload[el.dataset.key]=el.type==="number"?(el.value===""?null:Number(el.value)):el.value);
    await D.saveEntity(countryId,entity,{entityType:type});V.toast("保存しました")
   };
   box.querySelector(".delete-entity").onclick=async()=>{if(confirm("削除しますか？")){await D.deleteEntity(countryId,id,type);render()}};
  });
 }
 async function renderAccess(){
  const rules=await D.listVisibilityRules(countryId),changes=await D.listChanges(countryId,60),estimate=await L?.estimate?.();
  shell(`<section class="card section-card"><h2>公式・草案・非公開</h2><p class="help">各新規エンティティは状態と公開範囲を持ちます。さらに特定フィールドだけ例外公開できます。</p>
   <div class="form-grid three"><div class="field"><label>パス</label><input id="vis-path" class="input" placeholder="military.units / finance.debt"></div><div class="field"><label>公開範囲</label><select id="vis-value" class="select">${visOptions("owner")}</select></div><div class="field"><label>&nbsp;</label><button id="add-rule" class="btn">設定</button></div></div>
   <div class="table-wrap"><table><thead><tr><th>パス</th><th>公開範囲</th></tr></thead><tbody>${rules.map(x=>`<tr><td>${esc(x.path)}</td><td>${esc(x.visibility)}</td></tr>`).join("")||'<tr><td colspan="2">例外設定なし</td></tr>'}</tbody></table></div></section>
   <section class="card section-card"><h2>変更差分</h2><div class="table-wrap"><table><thead><tr><th>日時</th><th>種別</th><th>対象</th><th>変更</th></tr></thead><tbody>${changes.map(x=>`<tr><td>${esc(x.changed_at||"")}</td><td>${esc(x.change_type)}</td><td>${esc(x.entity_type||x.document_key||"")}</td><td>${esc(x.path||"")}</td></tr>`).join("")||'<tr><td colspan="4">クラウド差分履歴はまだありません。</td></tr>'}</tbody></table></div></section>
   <section class="card section-card"><h2>ユーザー領域</h2><p>IndexedDB: 下書き ${estimate?.counts?.drafts||0} / キャッシュ ${estimate?.counts?.cache||0} / 同期待ち ${estimate?.counts?.queue||0}</p><p class="help">草案・開閉状態・一時キャッシュは端末側へ保存し、正式公開データだけをDBへ送る設計です。</p></section>`);
  document.getElementById("add-rule").onclick=async()=>{await D.saveVisibilityRule(countryId,document.getElementById("vis-path").value,document.getElementById("vis-value").value);render()};
 }

 await loadDocs();
 await render();
});
