"use strict";

document.addEventListener("DOMContentLoaded",async()=>{
 const C=window.MFDCOCountry,V=window.MFDCOCountryV6,Cloud=window.MFDCOCountryCloud,X=window.MFDCOCountryV11;
 const root=document.getElementById("dashboard-app");
 if(!root)return;

 const roleLabel={owner:"所有者",admin:"管理者",editor:"編集者",viewer:"閲覧者"};
 const e=v=>C.esc(v??"");
 const q=id=>id?`?id=${encodeURIComponent(id)}`:"";
 const compact=n=>{n=Number(n||0);if(!Number.isFinite(n))return "—";const a=Math.abs(n);if(a>=1e12)return `${(n/1e12).toFixed(2)}兆`;if(a>=1e8)return `${(n/1e8).toFixed(2)}億`;if(a>=1e4)return `${(n/1e4).toFixed(1)}万`;return new Intl.NumberFormat("ja-JP",{maximumFractionDigits:2}).format(n)};
 const pct=n=>`${Number(n||0)>=0?"+":""}${Number(n||0).toFixed(3)}%`;
 const dateText=v=>{if(!v)return "";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})};
 const safe=async(fn,fallback)=>{try{return await fn()}catch(err){console.warn("DASHBOARD DATA",err);return fallback}};
 const timed=(p,ms=6500)=>Cloud.withTimeout?Cloud.withTimeout(p,ms,"dashboard timeout"):p;

 root.innerHTML='<div class="dashboard-loading">MFDCOアカウントと国家情報を確認しています…</div>';
 const account=await safe(()=>timed(Cloud.mfdcoAccount(),4500),null);
 if(!account){
  root.innerHTML=`<div class="dashboard-login-card"><strong>MFDCOアカウントでログインしてください</strong><span>ホームページと同じアカウントで国家ダッシュボードを利用します。</span><a class="btn small" href="https://mfdco.net/join.html?next=${encodeURIComponent(location.href)}">MFDCOでログイン</a></div>`;
  return;
 }
 const user=account.user,profile=account.profile||{};

 const baseResults=await Promise.all([
  safe(()=>timed(Cloud.myCountryAccess()),[]),
  safe(()=>timed(Cloud.getCountryPreferences()),{}),
  safe(()=>timed(Cloud.notifications()),[]),
  safe(()=>timed(Cloud.accountStorageUsage()),null)
 ]);
 const [access,prefs,notifs,accountUsage]=baseResults;
 const owned=access.filter(x=>x.role==="owner"),shared=access.filter(x=>x.role!=="owner");
 const activeId=prefs.activeCountryId||prefs.mainCountryId||owned[0]?.id||access[0]?.id||"";
 const activeAccess=access.find(x=>x.id===activeId)||null;

 const [activeCountry,overview,marketCountries,invites] = await Promise.all([
  activeId?safe(()=>timed(Cloud.loadCountry(activeId)),null):null,
  safe(()=>loadOverview(activeId),{news:[],organizations:[],treaties:[],activity:{}}),
  safe(()=>timed(Cloud.marketSnapshots(),6500),[]),
  safe(loadInvites,[])
 ]);

 if(user)setTimeout(()=>Cloud.backfillDeterministicMarket(72).catch(err=>console.warn("MARKET AUTO BACKFILL",err)),0);

 async function loadInvites(){
  if(!Cloud.ready()||!user)return [];
  const r=await timed(window.supabaseClient.rpc("mfdco_my_country_member_invitations"),5000);
  if(r.error)throw r.error;return r.data||[];
 }

 async function loadOverview(countryId){
  if(Cloud.ready()){
   try{
    const r=await timed(window.supabaseClient.rpc("mfdco_country_dashboard_overview",{p_country_id:countryId||null}),6000);
    if(!r.error&&r.data)return r.data;
   }catch(err){console.warn("DASHBOARD OVERVIEW RPC",err)}
  }
  const result={news:[],organizations:[],treaties:[],activity:{}};
  if(!Cloud.ready())return result;
  try{
   const r=await timed(window.supabaseClient.rpc("mfdco_public_country_feed",{p_limit:6,p_offset:0}),5000);
   if(!r.error)result.news=r.data||[];
  }catch{}
  try{
   const r=await timed(window.supabaseClient.from("international_organizations").select("id,name,short_name,org_type,updated_at,is_public,founder_country_id").order("updated_at",{ascending:false}).limit(6),5000);
   if(!r.error)result.organizations=r.data||[];
  }catch{}
  try{
   const r=await timed(window.supabaseClient.from("international_organization_treaties").select("id,organization_id,title,treaty_type,status,effective_date,updated_at").order("updated_at",{ascending:false}).limit(6),5000);
   if(!r.error)result.treaties=r.data||[];
  }catch{}
  if(countryId){
   const [props,rels,ents,memberships]=await Promise.all([
    safe(()=>Cloud.proposals(countryId),[]),safe(()=>Cloud.relations(countryId),[]),
    safe(async()=>{const r=await window.supabaseClient.from("country_entities").select("entity_type,status").eq("country_id",countryId).neq("status","archived");return r.error?[]:r.data||[]},[]),
    safe(async()=>{const r=await window.supabaseClient.from("international_organization_members").select("organization_id,status").eq("country_id",countryId).eq("status","active");return r.error?[]:r.data||[]},[])
   ]);
   const count=t=>ents.filter(x=>x.entity_type===t).length;
   result.activity={pending_proposals:props.filter(x=>x.status==="pending").length,relations:rels.length,organizations:memberships.length,projects:count("national_project"),laws:count("law_history"),military_units:count("military_unit")};
  }
  return result;
 }

 const unreadRows=notifs.filter(x=>!x.read_at);
 const unread=unreadRows.length;
 const pendingInvites=invites.filter(x=>x.status==="pending");
 const mb=n=>(Number(n||0)/1024/1024).toFixed(1);
 const storagePct=accountUsage?.account_limit_bytes?Math.min(100,Number(accountUsage.total_bytes||0)/Number(accountUsage.account_limit_bytes)*100):0;

 // Economy snapshot for the active country + world average.
 let market=null,worldAvg=0,companyMoves=[];
 if(activeCountry&&X){
  market=X.simulatedMarket(activeCountry,new Date(),{loggedIn:true,isMain:prefs.mainCountryId===activeId,isActive:true});
  const states=(marketCountries||[]).map(c=>({c,m:X.simulatedMarket(c)})).filter(x=>x.m?.enabled);
  worldAvg=states.length?states.reduce((a,x)=>a+Number(x.m.pct||0),0)/states.length:0;
  companyMoves=C.arr(activeCountry.companies).map(c=>({name:c.name||"企業",ticker:c.stockTicker||"",pct:X.companyMove(activeCountry,c),price:Number(c.baseStockPrice||0)})).sort((a,b)=>Math.abs(b.pct)-Math.abs(a.pct)).slice(0,4);
 }

 const activeName=activeCountry?.name||activeAccess?.name||"アクティブ国家未設定";
 const activeHref=activeId?`country.html${q(activeId)}`:"countries.html";
 const actions=activeId?[
  ["国家資料",`country.html${q(activeId)}`],["運営・計画",`country-operations.html${q(activeId)}`],["外交",`country-exchange.html${q(activeId)}`],["正式採用",`country-arsenal.html${q(activeId)}`],["ニュース投稿",`country-feed.html`],["世界経済","country-market.html"],["国際機関",`country-organizations.html${q(activeId)}`],["設定編集",`country-edit.html${q(activeId)}`]
 ]:[
  ["国家一覧","countries.html"],["国家を作成","country-templates.html"],["世界経済","country-market.html"],["国際機関","country-organizations.html"]
 ];

 function smallCountry(c){
  return `<a class="dash-country-row" href="country.html?id=${encodeURIComponent(c.id)}"><span><strong>${e(c.name)}</strong><small>${e(roleLabel[c.role]||c.role)}${prefs.activeCountryId===c.id?" · アクティブ":""}${prefs.mainCountryId===c.id?" · メイン":""}</small></span><span class="dash-country-score">${C.fmtNum(c.strengthScore||0)}</span></a>`;
 }
 function newsRow(r){
  return `<a class="dash-list-row" href="country-post.html?id=${encodeURIComponent(r.country_id)}&post=${encodeURIComponent(r.record_id)}"><span class="dash-row-main"><strong>${e(r.post_title||"無題")}</strong><small>${e(r.country_name||"")} · ${e(r.category||"更新")} · ${e(r.post_date||dateText(r.updated_at))}</small></span><span>›</span></a>`;
 }
 function orgRow(o){
  const id=o.id||o.organization_id;
  return `<a class="dash-list-row" href="country-organizations.html${activeId?q(activeId):""}"><span class="dash-row-main"><strong>${e(o.name||o.title||"国際機関")}</strong><small>${e(o.org_type||o.treaty_type||"")}${o.updated_at?` · ${e(dateText(o.updated_at))}`:""}</small></span><span>›</span></a>`;
 }
 function notifRow(n){
  return `<a class="dash-list-row ${n.read_at?"":"is-unread"}" href="${e(n.link||"country-notifications.html")}"><span class="dash-row-main"><strong>${e(n.title||"通知")}</strong><small>${e(n.body||"")} ${n.created_at?`· ${e(dateText(n.created_at))}`:""}</small></span><span>›</span></a>`;
 }

 const activity=overview.activity||{};
 const orgItems=[...(overview.organizations||[]).map(x=>({...x,_kind:"org"})),...(overview.treaties||[]).map(x=>({...x,name:x.title,org_type:`条約 / ${x.treaty_type||""}`,_kind:"treaty"}))].sort((a,b)=>String(b.updated_at||b.effective_date||"").localeCompare(String(a.updated_at||a.effective_date||""))).slice(0,6);

 root.innerHTML=`
  <section class="dashboard-command-card">
   <div class="dashboard-active-country">
    <div class="dashboard-active-label">ACTIVE COUNTRY</div>
    <a href="${activeHref}" class="dashboard-active-name">${e(activeName)}</a>
    <div class="dashboard-active-meta">${activeAccess?`${e(roleLabel[activeAccess.role]||activeAccess.role)} · 国家力 ${C.fmtNum(activeAccess.strengthScore||0)} · 完成度 ${C.fmtNum(activeAccess.completenessScore||0)}%`:"国家を選択すると運営情報を集約します"}</div>
   </div>
   <div class="dashboard-command-actions">${actions.map(([label,href])=>`<a href="${href}">${e(label)}</a>`).join("")}</div>
  </section>

  <div class="dashboard-metrics-compact">
   <a href="countries.html"><span>所有国家</span><strong>${owned.length}</strong></a>
   <a href="countries.html"><span>共同編集</span><strong>${shared.length}</strong></a>
   <a href="country-notifications.html"><span>未読通知</span><strong>${unread}</strong></a>
   <a href="country-dashboard.html#invites"><span>招待</span><strong>${pendingInvites.length}</strong></a>
   <a href="country-exchange.html${activeId?q(activeId):""}"><span>外交保留</span><strong>${Number(activity.pending_proposals||0)}</strong></a>
   <a href="country-organizations.html${activeId?q(activeId):""}"><span>参加機関</span><strong>${Number(activity.organizations||0)}</strong></a>
  </div>

  <div class="dashboard-hub-grid">
   <section class="dash-panel dash-span-7">
    <div class="dash-panel-head"><div><span>ECONOMY</span><h2>経済・市場</h2></div><a href="country-market.html">世界経済 →</a></div>
    ${activeCountry?`<div class="dash-economy-grid">
      <div><span>国家株価指数</span><strong>${market?.stock?compact(market.stock):"—"}</strong><small class="${Number(market?.pct||0)>=0?"up":"down"}">${market?.enabled?pct(market.pct):"自動市場OFF"}</small></div>
      <div><span>対USD為替</span><strong>${market?.fx?compact(market.fx):"—"}</strong><small>${activeCountry.economy?.currencyCode||activeCountry.economy?.currencyName||"通貨"}</small></div>
      <div><span>世界平均</span><strong class="${worldAvg>=0?"up":"down"}">${pct(worldAvg)}</strong><small>1時間変動</small></div>
      <div><span>GDP</span><strong>${compact(activeCountry.economy?.gdp)}</strong><small>設定値</small></div>
     </div>
     <div class="dash-company-strip">${companyMoves.length?companyMoves.map(x=>`<span><b>${e(x.ticker||x.name)}</b><i class="${x.pct>=0?"up":"down"}">${pct(x.pct)}</i></span>`).join(""):'<span class="muted">企業株価データはまだありません。</span>'}</div>`:'<div class="dash-empty-small">アクティブ国家を設定すると経済状況を表示します。</div>'}
   </section>

   <section class="dash-panel dash-span-5">
    <div class="dash-panel-head"><div><span>OPERATIONS</span><h2>国家運営状況</h2></div>${activeId?`<a href="country-operations.html${q(activeId)}">運営画面 →</a>`:""}</div>
    <div class="dash-ops-grid">
     <a href="country-operations.html${activeId?q(activeId):""}"><span>国家事業</span><strong>${Number(activity.projects||0)}</strong></a>
     <a href="country-operations.html${activeId?q(activeId):""}"><span>法律履歴</span><strong>${Number(activity.laws||0)}</strong></a>
     <a href="country-operations.html${activeId?q(activeId):""}"><span>軍事編制</span><strong>${Number(activity.military_units||0)}</strong></a>
     <a href="country-exchange.html${activeId?q(activeId):""}"><span>外交関係</span><strong>${Number(activity.relations||0)}</strong></a>
    </div>
    <div class="dash-storage-mini"><span>MFDCO容量 ${accountUsage?`${mb(accountUsage.total_bytes)} / ${mb(accountUsage.account_limit_bytes)} MiB`:"—"}</span><div><i style="width:${storagePct}%"></i></div></div>
   </section>

   <section class="dash-panel dash-span-6">
    <div class="dash-panel-head"><div><span>NEWS</span><h2>最新ニュース</h2></div><a href="country-feed.html">すべて見る →</a></div>
    <div class="dash-scroll-list">${(overview.news||[]).length?(overview.news||[]).slice(0,6).map(newsRow).join(""):'<div class="dash-empty-small">公開ニュースはありません。</div>'}</div>
   </section>

   <section class="dash-panel dash-span-6">
    <div class="dash-panel-head"><div><span>INTERNATIONAL</span><h2>国際機関・条約の動き</h2></div><a href="country-organizations.html${activeId?q(activeId):""}">国際機関 →</a></div>
    <div class="dash-scroll-list">${orgItems.length?orgItems.map(orgRow).join(""):'<div class="dash-empty-small">最近の国際機関・条約情報はありません。</div>'}</div>
   </section>

   <section class="dash-panel dash-span-6">
    <div class="dash-panel-head"><div><span>COUNTRIES</span><h2>自分の国家</h2></div><a href="countries.html">国家一覧 →</a></div>
    <div class="dash-country-columns"><div><h3>所有</h3>${owned.slice(0,4).map(smallCountry).join("")||'<div class="dash-empty-small">所有国家なし</div>'}</div><div><h3>共同編集</h3>${shared.slice(0,4).map(smallCountry).join("")||'<div class="dash-empty-small">共同編集なし</div>'}</div></div>
   </section>

   <section class="dash-panel dash-span-6" id="invites">
    <div class="dash-panel-head"><div><span>ACCOUNT</span><h2>通知・共同編集</h2></div><a href="country-notifications.html">通知一覧 →</a></div>
    <div class="dash-scroll-list">${pendingInvites.slice(0,3).map(i=>`<div class="dash-invite-row"><span><strong>${e(i.country_name)}</strong><small>${e(roleLabel[i.role]||i.role)}${i.display_role?` · ${e(i.display_role)}`:""}</small></span><span><button class="btn small invite-response" data-id="${i.id}" data-status="accepted">受理</button><button class="btn danger small invite-response" data-id="${i.id}" data-status="declined">辞退</button></span></div>`).join("")}${unreadRows.slice(0,4).map(notifRow).join("")||(!pendingInvites.length?'<div class="dash-empty-small">新しい招待・通知はありません。</div>':"")}</div>
   </section>
  </div>
 `;

 document.querySelectorAll(".invite-response").forEach(b=>b.addEventListener("click",async()=>{
  b.disabled=true;
  try{
   const r=await window.supabaseClient.rpc("mfdco_respond_country_member_invitation",{p_invitation_id:b.dataset.id,p_status:b.dataset.status});
   if(r.error)throw r.error;location.reload();
  }catch(err){V.toast(err.message||String(err),"danger");b.disabled=false}
 }));
});
