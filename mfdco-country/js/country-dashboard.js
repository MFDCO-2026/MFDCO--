"use strict";

document.addEventListener("DOMContentLoaded",async()=>{
 const C=MFDCOCountry,V=MFDCOCountryV6,Cloud=MFDCOCountryCloud;
 const root=document.getElementById("dashboard-app");
 if(!root)return;

 const roleLabel={owner:"所有者",admin:"管理者",editor:"編集者",viewer:"閲覧者"};
 const account=await Cloud.mfdcoAccount();
 const u=account?.user||null;
 if(!account){
  root.innerHTML=`<div class="alert warn"><strong>国家ダッシュボードにはMFDCOアカウントでのログインが必要です。</strong><br><a class="btn small" href="https://mfdco.net/join.html">MFDCOでログイン</a></div>`;
  return;
 }

 const [access,prefs,notifs,accountUsage]=await Promise.all([
  Cloud.myCountryAccess(),
  Cloud.getCountryPreferences(),
  Cloud.notifications(),
  Cloud.accountStorageUsage()
 ]);
 let invites=[];
 if(Cloud.ready()&&u){
  const r=await window.supabaseClient.rpc("mfdco_my_country_member_invitations");
  if(!r.error)invites=r.data||[];
 }
 if(u)setTimeout(()=>Cloud.backfillDeterministicMarket(72).catch(e=>console.warn("MARKET AUTO BACKFILL",e)),0);

 const owned=access.filter(x=>x.role==="owner");
 const shared=access.filter(x=>x.role!=="owner");
 const unread=notifs.filter(x=>!x.read_at).length;
 const mb=n=>(Number(n||0)/1024/1024).toFixed(1);
 const pct=(used,limit)=>limit?Math.min(100,Math.max(0,Number(used||0)/Number(limit)*100)):0;

 function card(c){
  const editable=!!c.canEdit;
  const manageable=!!c.canManage;
  const prefButtons=editable?`<button class="btn ghost small pref-set" data-kind="main" data-id="${c.id}">メインに設定</button><button class="btn secondary small pref-set" data-kind="active" data-id="${c.id}">アクティブに設定</button>`:"";
  return `<div class="relation-line country-manage-row">
   <div>
    <strong><a href="country.html?id=${encodeURIComponent(c.id)}">${C.esc(c.name)}</a></strong>
    <div class="fine">${C.esc(roleLabel[c.role]||c.role)}${c.displayRole?` / ${C.esc(c.displayRole)}`:""}｜国家力 ${C.fmtNum(c.strengthScore)} / 完成度 ${C.fmtNum(c.completenessScore)}%</div>
    <div class="tag-list">${prefs.mainCountryId===c.id?'<span class="pill ok">メイン国家</span>':''}${prefs.activeCountryId===c.id?'<span class="pill">アクティブ</span>':''}</div>
   </div>
   <div class="toolbar">${prefButtons}<a class="btn ghost small" href="country.html?id=${encodeURIComponent(c.id)}">見る</a>${editable?`<a class="btn small" href="country-edit.html?id=${encodeURIComponent(c.id)}">編集</a><a class="btn secondary small" href="country-operations.html?id=${encodeURIComponent(c.id)}">運営</a>`:""}${manageable?`<a class="btn ghost small" href="country-manage.html?id=${encodeURIComponent(c.id)}">管理</a>`:""}</div>
  </div>`;
 }

 const storage=accountUsage?`<section class="card section-card"><div class="section-head"><div><h2>MFDCOアカウント容量</h2><p>共同編集でアップロードした素材も、アップロードした本人のアカウント容量に加算されます。</p></div></div><div class="storage-meter"><div class="storage-meter-bar" style="width:${pct(accountUsage.total_bytes,accountUsage.account_limit_bytes)}%"></div></div><div class="fine">${mb(accountUsage.total_bytes)} / ${mb(accountUsage.account_limit_bytes)} MiB｜国家メディア ${mb(accountUsage.media_bytes)} MiB｜配布素材 ${mb(accountUsage.asset_bytes)} MiB｜非公開バックアップ ${mb(accountUsage.private_archive_bytes)} MiB</div></section>`:"";

 root.innerHTML=`
  <div class="fiction-disclaimer-card">架空国家・創作世界を管理するためのダッシュボードです。共同編集はMFDCOアカウントに紐づきます。</div>
  <div class="metric-grid">
   <div class="metric"><div class="metric-label">所有国家</div><div class="metric-value">${owned.length}</div><div class="metric-sub">上限 ${accountUsage?.max_owned_countries||5}</div></div>
   <div class="metric"><div class="metric-label">共同編集参加</div><div class="metric-value">${shared.length}</div></div>
   <div class="metric"><div class="metric-label">アクティブ国家</div><div class="metric-value compact">${C.esc(access.find(x=>x.id===prefs.activeCountryId)?.name||"未設定")}</div></div>
   <div class="metric"><div class="metric-label">未読通知</div><div class="metric-value">${unread}</div></div>
  </div>
  <div class="quick-links" style="margin:18px 0"><a class="quick-link" href="countries.html"><strong>国家一覧</strong>設定資料を閲覧・作成</a><a class="quick-link" href="country-market.html"><strong>世界経済</strong>市場テーマと履歴</a><a class="quick-link" href="country-feed.html"><strong>国家ニュース</strong>最新投稿を見る</a><a class="quick-link" href="country-organizations.html"><strong>国際機関</strong>共同体・条約</a><a class="quick-link" href="country-operations.html"><strong>国家運営・計画</strong>予算・行政・計画・軍備</a></div>
  <section class="card section-card"><div class="section-head"><div><h2>所有国家</h2><p>あなたのMFDCOアカウントが所有する国家です。</p></div></div>${owned.length?owned.map(card).join(""):'<div class="empty">所有国家はまだありません。</div>'}</section>
  <section class="card section-card"><div class="section-head"><div><h2>共同編集中の国家</h2><p>他のMFDCOアカウントから共有された国家です。権限に応じて編集・閲覧できます。</p></div></div>${shared.length?shared.map(card).join(""):'<div class="empty">共同編集に参加している国家はありません。</div>'}</section>
  <section class="card section-card"><h2>共同編集招待</h2>${invites.filter(x=>x.status==='pending').map(i=>`<div class="relation-line"><div><strong>${C.esc(i.country_name)}</strong><div class="fine">権限: ${C.esc(roleLabel[i.role]||i.role)}${i.display_role?` / ${C.esc(i.display_role)}`:""}</div></div><div class="toolbar"><button class="btn small invite-response" data-id="${i.id}" data-status="accepted">受理</button><button class="btn danger small invite-response" data-id="${i.id}" data-status="declined">辞退</button></div></div>`).join("")||'<div class="empty">保留中の招待はありません。</div>'}</section>
  ${storage}`;

 document.querySelectorAll(".pref-set").forEach(b=>b.addEventListener("click",async()=>{
  try{
   const patch=b.dataset.kind==="main"?{mainCountryId:b.dataset.id}:{activeCountryId:b.dataset.id};
   await Cloud.setCountryPreferences(patch);
   location.reload();
  }catch(e){V.toast(e.message||String(e),"danger")}
 }));

 document.querySelectorAll(".invite-response").forEach(b=>b.addEventListener("click",async()=>{
  const r=await window.supabaseClient.rpc("mfdco_respond_country_member_invitation",{p_invitation_id:b.dataset.id,p_status:b.dataset.status});
  if(r.error)V.toast(r.error.message,"danger");else location.reload();
 }));
});
