"use strict";

document.addEventListener("DOMContentLoaded",async()=>{
 const C=MFDCOCountry,V=MFDCOCountryV6,Cloud=MFDCOCountryCloud;
 const LocalDB=MFDCOCountryLocalDB,V20=MFDCOCountryV20Data;
 const root=document.getElementById("manage-app");
 if(!root)return;

 const c=await V.load();
 const u=await Cloud.user();
 const role=await Cloud.role(c.id);
 const roleLabel={owner:"所有者",admin:"管理者",editor:"編集者",viewer:"閲覧者"};
 const canManage=["owner","admin"].includes(role);
 const canEdit=["owner","admin","editor"].includes(role);

 if(Cloud.ready()&&!u){
  root.innerHTML='<div class="alert warn">国家管理にはMFDCOアカウントでログインしてください。</div>';
  return;
 }

 let members=[],invites=[];
 const versions=await Cloud.versions(c.id);
 if(Cloud.ready()){
  let r=await window.supabaseClient.rpc("mfdco_country_members_with_profiles",{p_country_id:c.id});
  if(!r.error)members=r.data||[];
  r=await window.supabaseClient.rpc("mfdco_country_member_invitations",{p_country_id:c.id});
  if(!r.error)invites=r.data||[];
 }
 const [accountUsage,countryUsage]=await Promise.all([
  Cloud.accountStorageUsage(),
  Cloud.countryStorageUsage(c.id)
 ]);

 const mb=n=>(Number(n||0)/1024/1024).toFixed(1);
 const pct=(used,limit)=>limit?Math.min(100,Math.max(0,Number(used||0)/Number(limit)*100)):0;
 const escAttr=v=>C.esc(String(v??"")).replace(/"/g,"&quot;");

 function memberCanBeManaged(m){
  if(!canManage||m.role==="owner")return false;
  if(role==="admin"&&m.role==="admin")return false;
  return true;
 }
 function roleOptions(current){
  const values=role==="owner"?["admin","editor","viewer"]:["editor","viewer"];
  return values.map(x=>`<option value="${x}" ${x===current?"selected":""}>${roleLabel[x]}</option>`).join("");
 }
 function memberRow(m){
  const manageable=memberCanBeManaged(m);
  const me=u&&m.user_id===u.id;
  return `<tr>
   <td><strong>${C.esc(m.activity_name||"MFDCOアカウント")}</strong>${me?' <span class="pill">自分</span>':''}<div class="fine">${C.esc(m.user_id)}</div></td>
   <td>${manageable?`<select class="select member-role-select" data-user="${m.user_id}">${roleOptions(m.role)}</select>`:`${C.esc(roleLabel[m.role]||m.role)}`}</td>
   <td>${manageable?`<input class="input member-display-role" data-user="${m.user_id}" value="${escAttr(m.display_role||"")}" placeholder="例: 外務担当">`:C.esc(m.display_role||"")}</td>
   <td>${manageable?`<div class="toolbar"><button class="btn secondary small member-update" data-user="${m.user_id}">更新</button><button class="btn danger small member-remove" data-user="${m.user_id}" data-name="${escAttr(m.activity_name||m.user_id)}">削除</button></div>`:"—"}</td>
  </tr>`;
 }

 const invitationRows=invites.map(i=>{
  const revokable=i.status==="pending"&&canManage&&!(role==="admin"&&i.role==="admin");
  return `<tr><td>${C.esc(i.activity_name||i.invitee_id)}</td><td>${C.esc(roleLabel[i.role]||i.role)}</td><td>${C.esc(i.display_role||"")}</td><td>${C.esc(i.status)}</td><td>${revokable?`<button class="btn danger small invite-revoke" data-id="${i.id}">招待取消</button>`:"—"}</td></tr>`;
 }).join("");

 const accountCapacity=accountUsage?`<div class="storage-block"><div class="section-head"><div><h3>MFDCOアカウント</h3><p>${C.esc(accountUsage.activity_name||"ログイン中のアカウント")} のCountry関連ストレージ。</p></div><strong>${mb(accountUsage.total_bytes)} / ${mb(accountUsage.account_limit_bytes)} MiB</strong></div><div class="storage-meter"><div class="storage-meter-bar" style="width:${pct(accountUsage.total_bytes,accountUsage.account_limit_bytes)}%"></div></div><div class="fine">国家メディア ${mb(accountUsage.media_bytes)} MiB / 配布素材 ${mb(accountUsage.asset_bytes)} MiB / 非公開バックアップ ${mb(accountUsage.private_archive_bytes)} MiB / 1ファイル上限 ${mb(accountUsage.max_file_bytes)} MiB</div></div>`:'<div class="alert warn">アカウント容量を取得できません。v20.2 SQLの適用を確認してください。</div>';
 const countryCapacity=countryUsage?`<div class="storage-block"><div class="section-head"><div><h3>この国家</h3><p>全共同編集者がアップロードした共有素材の合計です。</p></div><strong>${mb(countryUsage.total_bytes)} / ${mb(countryUsage.country_limit_bytes)} MiB</strong></div><div class="storage-meter"><div class="storage-meter-bar" style="width:${pct(countryUsage.total_bytes,countryUsage.country_limit_bytes)}%"></div></div><div class="fine">国家メディア ${mb(countryUsage.media_bytes)} MiB / 配布素材 ${mb(countryUsage.asset_bytes)} MiB</div></div>`:"";

 const inviteForm=canManage?`<div class="alert info">共同編集へ招待できるのはMFDCOプロフィールを持つアカウントのみです。${role==='admin'?'管理者は editor / viewer のみ招待できます。':'所有者は admin / editor / viewer を招待できます。'}</div><div class="form-grid"><div class="field"><label>MFDCO活動名で検索</label><input id="member-search" class="input" placeholder="2文字以上"></div><div class="field"><label>権限</label><select id="member-role" class="select">${roleOptions("editor")}</select></div><div class="field"><label>表示役職（任意）</label><input id="member-display-role" class="input" placeholder="例: 外務担当"></div><div id="profile-results" class="field full"></div></div>`:'<div class="alert info">メンバー管理は owner / admin のみ利用できます。</div>';

 root.innerHTML=`
  <div class="metric-grid">
   <div class="metric"><div class="metric-label">自分の権限</div><div class="metric-value compact">${C.esc(roleLabel[role]||role||"なし")}</div></div>
   <div class="metric"><div class="metric-label">MFDCOアカウント</div><div class="metric-value compact">${accountUsage?"接続済み":"要確認"}</div></div>
   <div class="metric"><div class="metric-label">メンバー</div><div class="metric-value">${members.length}</div></div>
   <div class="metric"><div class="metric-label">変更履歴</div><div class="metric-value">${versions.length}</div></div>
  </div>

  <section class="card section-card"><div class="section-head"><div><h2>MFDCOアカウント共同編集</h2><p>国家は1人の所有者に紐づき、他のMFDCOアカウントへ権限を付与します。</p></div></div>${inviteForm}${members.length?`<div class="table-wrap"><table><thead><tr><th>アカウント</th><th>権限</th><th>表示役職</th><th>操作</th></tr></thead><tbody>${members.map(memberRow).join("")}</tbody></table></div>`:'<div class="empty">メンバー情報を取得できません。</div>'}${role!=="owner"&&role?`<div class="toolbar" style="margin-top:14px"><button id="leave-country" class="btn danger">この国家の共同編集から退出</button></div>`:""}<h3>招待履歴</h3>${invites.length?`<div class="table-wrap"><table><thead><tr><th>アカウント</th><th>権限</th><th>役職</th><th>状態</th><th>操作</th></tr></thead><tbody>${invitationRows}</tbody></table></div>`:'<div class="empty">招待なし</div>'}</section>

  <section class="card section-card"><div class="section-head"><div><h2>容量制限</h2><p>共同編集者のアップロードは「この国家の容量」と「アップロードした本人のアカウント容量」の両方に加算されます。</p></div></div>${countryCapacity}${accountCapacity}</section>

  <section class="card section-card"><h2>保存・バックアップ</h2>${canEdit?`<div class="toolbar"><button id="export-json" class="btn secondary">JSONエクスポート</button><label class="btn ghost">JSONインポート<input id="import-json" type="file" accept="application/json" hidden></label></div>`:'<div class="alert info">viewer は国家データを変更できません。</div>'}<p class="help">従来保存の変更履歴は最大30世代。v20データは差分ログを使用します。</p>${versions.length?`<div class="table-wrap"><table><thead><tr><th>世代</th><th>保存日時</th><th></th></tr></thead><tbody>${versions.map(v=>`<tr><td>#${v.id}</td><td>${C.formatDate(v.created_at)}</td><td>${canEdit?`<button class="btn ghost small restore-version" data-id="${v.id}">この版へ復元</button>`:""}</td></tr>`).join("")}</tbody></table></div>`:""}</section>

  <section class="card section-card"><h2>ユーザー領域・軽量保存</h2><div id="v20-storage-summary" class="alert info">端末保存領域を確認しています…</div><div class="toolbar">${canEdit?'<button id="save-local-draft" class="btn secondary">端末に下書き保存</button><button id="upload-user-archive" class="btn ghost">非公開クラウド保管</button><button id="flush-local-queue" class="btn ghost">同期待ちを送信</button>':''}<button id="clear-v20-cache" class="btn danger">この国家の端末キャッシュ削除</button></div><p class="help">非公開クラウド保管も、実行したMFDCOアカウント自身の容量へ加算されます。</p></section>

  <section class="card section-card"><h2>危険な操作</h2><div class="toolbar"><button id="delete-local" class="btn danger">ローカル国家データを削除</button>${role==='owner'&&Cloud.ready()?'<button id="archive-cloud" class="btn danger">本番国家をアーカイブ</button><button id="delete-cloud" class="btn danger">本番国家を完全削除</button>':''}</div><p class="help">国家そのものの削除・アーカイブは所有者だけが実行できます。</p></section>`;

 // Search MFDCO accounts and invite.
 let timer;
 document.getElementById("member-search")?.addEventListener("input",e=>{
  clearTimeout(timer);
  timer=setTimeout(async()=>{
   const q=e.target.value.trim(),box=document.getElementById("profile-results");
   if(!box)return;
   if(q.length<2){box.innerHTML='<span class="fine">2文字以上入力してください。</span>';return}
   const r=await window.supabaseClient.rpc("mfdco_search_country_member_profiles",{p_query:q,p_limit:10});
   if(r.error){box.textContent=r.error.message;return}
   const rows=r.data||[];
   box.innerHTML=rows.length?rows.map(p=>`<div class="relation-line"><div><strong>${C.esc(p.activity_name||"MFDCOアカウント")}</strong><div class="fine">${C.esc(p.user_id)}</div></div><button class="btn small invite-user" data-id="${p.user_id}">招待</button></div>`).join(""):'<div class="empty">該当するMFDCOアカウントがありません。</div>';
   box.querySelectorAll(".invite-user").forEach(b=>b.addEventListener("click",async()=>{
    const x=await window.supabaseClient.rpc("mfdco_invite_country_member",{
     p_country_id:c.id,p_invitee_id:b.dataset.id,
     p_role:document.getElementById("member-role").value,
     p_display_role:document.getElementById("member-display-role").value.trim()
    });
    if(x.error)V.toast(x.error.message,"danger");else{V.toast("招待を送りました");location.reload()}
   }));
  },300);
 });

 document.querySelectorAll(".member-update").forEach(b=>b.addEventListener("click",async()=>{
  const id=b.dataset.user;
  const roleInput=document.querySelector(`.member-role-select[data-user="${CSS.escape(id)}"]`);
  const displayInput=document.querySelector(`.member-display-role[data-user="${CSS.escape(id)}"]`);
  const r=await window.supabaseClient.rpc("mfdco_update_country_member",{p_country_id:c.id,p_user_id:id,p_role:roleInput.value,p_display_role:displayInput.value.trim()});
  if(r.error)V.toast(r.error.message,"danger");else{V.toast("共同編集権限を更新しました");location.reload()}
 }));

 document.querySelectorAll(".member-remove").forEach(b=>b.addEventListener("click",async()=>{
  if(!confirm(`${b.dataset.name} をこの国家の共同編集から削除しますか？`))return;
  const r=await window.supabaseClient.rpc("mfdco_remove_country_member",{p_country_id:c.id,p_user_id:b.dataset.user});
  if(r.error)V.toast(r.error.message,"danger");else{V.toast("メンバーを削除しました");location.reload()}
 }));

 document.querySelectorAll(".invite-revoke").forEach(b=>b.addEventListener("click",async()=>{
  const r=await window.supabaseClient.rpc("mfdco_revoke_country_member_invitation",{p_invitation_id:b.dataset.id});
  if(r.error)V.toast(r.error.message,"danger");else location.reload();
 }));

 document.getElementById("leave-country")?.addEventListener("click",async()=>{
  if(!confirm("この国家の共同編集から退出しますか？再参加には新しい招待が必要です。"))return;
  const r=await window.supabaseClient.rpc("mfdco_leave_country",{p_country_id:c.id});
  if(r.error)V.toast(r.error.message,"danger");else location.href="country-dashboard.html";
 });

 document.getElementById("export-json")?.addEventListener("click",()=>C.download(`${C.slugify(c.name)||"country"}.json`,JSON.stringify(c,null,2)));
 document.getElementById("import-json")?.addEventListener("change",async e=>{
  try{const obj=JSON.parse(await C.fileToText(e.target.files[0]));obj.id=c.id;await V.save(obj);V.toast("インポートしました");location.reload()}catch(err){V.toast(err.message,"danger")}
 });
 document.querySelectorAll(".restore-version").forEach(b=>b.addEventListener("click",async()=>{
  if(!confirm("この保存世代へ復元しますか？現在の状態も新しい履歴として残ります。"))return;
  const r=await window.supabaseClient.rpc("mfdco_country_version_snapshot",{p_version_id:Number(b.dataset.id)});
  if(r.error)return V.toast(r.error.message,"danger");
  const snap=r.data;snap.id=c.id;await V.save(snap);V.toast("復元しました");location.reload();
 }));

 const storageBox=document.getElementById("v20-storage-summary");
 LocalDB.estimate().then(x=>{storageBox.textContent=`端末保存: ${mb(x.usage)} MiB / 推定上限 ${mb(x.quota)} MiB｜下書き ${x.counts.drafts}｜キャッシュ ${x.counts.cache}｜同期待ち ${x.counts.queue}`}).catch(()=>{storageBox.textContent="IndexedDB容量を取得できませんでした。"});
 document.getElementById("save-local-draft")?.addEventListener("click",async()=>{await LocalDB.saveCountryDraft(c.id,"manual-backup",C.clone(c));V.toast("端末に下書きを保存しました")});
 document.getElementById("upload-user-archive")?.addEventListener("click",async()=>{try{const path=await V20.uploadUserArchive(c.id,`${C.slugify(c.name)||"country"}-${new Date().toISOString().slice(0,10)}`,c);V.toast(`非公開保管しました: ${path}`);location.reload()}catch(e){V.toast(e.message||String(e),"danger")}});
 document.getElementById("flush-local-queue")?.addEventListener("click",async()=>{try{const r=await V20.flushQueue();V.toast(`${r.processed}件を同期 / 残り${r.remaining}件`);location.reload()}catch(e){V.toast(e.message||String(e),"danger")}});
 document.getElementById("clear-v20-cache")?.addEventListener("click",async()=>{if(confirm("この端末のこの国家のv20下書き・キャッシュを削除しますか？クラウドDBは削除しません。")){await LocalDB.clearCountry(c.id);V.toast("端末キャッシュを削除しました");location.reload()}});
 document.getElementById("delete-local")?.addEventListener("click",async()=>{if(confirm("ローカルの国家データを削除しますか？本番DBは削除しません。")){C.remove(c.id);await LocalDB.clearCountry(c.id).catch(()=>{});location.href="countries.html"}});
 document.getElementById("archive-cloud")?.addEventListener("click",async()=>{if(!confirm("本番国家をアーカイブしますか？"))return;const r=await window.supabaseClient.rpc("mfdco_archive_country",{p_country_id:c.id,p_archive:true});if(r.error)V.toast(r.error.message,"danger");else location.href="country-dashboard.html"});
 document.getElementById("delete-cloud")?.addEventListener("click",async()=>{const name=prompt(`完全削除するには国家名「${c.name}」を入力してください。`);if(name===null)return;const r=await window.supabaseClient.rpc("mfdco_delete_country",{p_country_id:c.id,p_confirmation:name});if(r.error)V.toast(r.error.message,"danger");else{C.remove(c.id);location.href="countries.html"}});
});
