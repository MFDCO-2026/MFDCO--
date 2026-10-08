"use strict";
(function(){
const ACCESS={deny:"ダウンロード不可",approval:"承認制",allow:"ダウンロード可"};
const esc=v=>window.MFDCOCountry?.esc(v??"")??String(v??"");
function collect(country){
 const found=new Map();
 function title(path,root){
  const s=path.join(".");
  if(s==="media.flagKey")return "国旗";
  if(s==="media.emblemKey")return "国章";
  if(s==="media.coverKey")return "背景画像";
  if(s==="media.mapKey")return "地図";
  if(s==="media.anthemKey")return "国歌";
  if(s==="media.capitalImageKey"||s==="capital.imageKey")return "首都画像";
  const i=path.findIndex(x=>/^\d+$/.test(String(x)));
  if(i>0){const arr=path[i-1],idx=Number(path[i]),row=root?.[arr]?.[idx];if(row){const name=row.name||row.title||row.label||"";if(arr==="companies"||arr==="parties")return `${name||"組織"} ロゴ`;if(arr==="heritageSites")return `${name||"文化財"} 画像`;if(arr==="posts")return `${name||"記事"} プレビュー画像`;if(arr==="wikiPages")return `${name||"Wiki"} 画像`;if(arr==="regions")return `${name||"行政区"} 画像`;}}
  return path.at(-1)?.toLowerCase().includes("logo")?"ロゴ":path.at(-1)?.toLowerCase().includes("image")?"画像":"国家素材";
 }
 function walk(v,path=[]){
  if(typeof v==="string"){const isStorage=v.startsWith("storage:"),isStatic=!/^https?:/i.test(v)&&/\.(?:png|jpe?g|webp|gif|mp3|ogg|wav|m4a|mp4)(?:[?#].*)?$/i.test(v);if(isStorage||isStatic){const storagePath=isStorage?v.slice(8):`static:${v}`;if(!found.has(storagePath))found.set(storagePath,{storagePath,key:v,keyPath:path.join("."),title:title(path,country),managed:isStorage});return}}
  if(Array.isArray(v)){v.forEach((x,i)=>walk(x,[...path,String(i)]));return}
  if(v&&typeof v==="object"){for(const [k,x] of Object.entries(v)){if(k==="sources"||k==="autofill")continue;walk(x,[...path,k])}}
 }
 walk(country,[]);return [...found.values()];
}
async function mount(country,hostId="country-media-inline"){
 const C=window.MFDCOCountry,V=window.MFDCOCountryV6,Cloud=window.MFDCOCountryCloud,host=document.getElementById(hostId);if(!host||!C||!Cloud)return;
 const refs=collect(country),user=await Cloud.user(),role=await Cloud.role(country.id),canManage=["owner","admin"].includes(role),canEdit=["owner","admin","editor"].includes(role);
 let rows=[];
 if(Cloud.ready()&&refs.some(x=>x.managed)){
  const q=await window.supabaseClient.rpc("mfdco_list_country_page_media",{p_country_id:country.id,p_paths:refs.filter(x=>x.managed).map(x=>x.storagePath)});
  if(q.error)console.warn("MEDIA LIST",q.error);else rows=q.data||[];
 }
 const known=new Set(rows.map(x=>x.storage_path));for(const [i,r] of refs.entries()){if(!r.managed&&!known.has(r.storagePath))rows.push({id:`static-${i}`,storage_path:r.storagePath,slot:r.keyPath,kind:/anthem|audio|\.(mp3|ogg|wav|m4a|mp4)$/i.test(r.key)?"audio":"image",original_name:r.title,size_bytes:0,effective_access:"deny",effective_terms:"固定サイト素材はダウンロード設定対象外です。Storageへアップロードした素材のみ条件変更できます。",can_download:false,download_access_override:null,download_terms_override:null,static_asset:true})}
 if(!Cloud.ready())rows=refs.map((r,i)=>({id:`local-${i}`,storage_path:r.storagePath,slot:r.keyPath,kind:/anthem|audio/i.test(r.keyPath)?"audio":"image",original_name:r.title,size_bytes:0,effective_access:country.mediaDistribution?.defaultAccess||"deny",effective_terms:country.mediaDistribution?.defaultTerms||"",can_download:false,download_access_override:null,download_terms_override:null,static_asset:!r.managed}));
 const refByPath=new Map(refs.map(x=>[x.storagePath,x]));
 function label(r){return refByPath.get(r.storage_path)?.title||r.display_name||r.original_name||r.slot||"国家素材"}
 async function preview(r){
  const ref=refByPath.get(r.storage_path);if(!ref)return "";const url=await Cloud.resolveMedia(ref.key,900);if(!url)return "";
  if((r.kind||"")==="audio")return `<audio controls preload="none" src="${esc(url)}"></audio>`;
  if((r.kind||"")==="image")return `<img src="${esc(url)}" alt="${esc(label(r))}">`;
  return "";
 }
 async function draw(){
  const previews=new Map();for(const r of rows)previews.set(r.id,await preview(r));
  const defaultAccess=rows[0]?.default_access||country.mediaDistribution?.defaultAccess||"deny",defaultTerms=rows[0]?.default_terms||country.mediaDistribution?.defaultTerms||"";
  host.innerHTML=`${canManage?`<div class="media-policy-panel"><div class="section-head"><div><h3>素材ダウンロード一括設定</h3><p>ページ内で使われている画像・音声へ適用します。個別設定をした素材はそちらを優先します。</p></div></div><div class="form-grid"><div class="field"><label>初期・一括条件</label><select id="media-default-access" class="select"><option value="deny" ${defaultAccess==="deny"?"selected":""}>ダウンロード不可</option><option value="approval" ${defaultAccess==="approval"?"selected":""}>承認制</option><option value="allow" ${defaultAccess==="allow"?"selected":""}>ダウンロード可</option></select></div><div class="field full"><label>一括利用規約</label><textarea id="media-default-terms" class="textarea" rows="2">${esc(defaultTerms)}</textarea></div></div><button id="save-media-defaults" class="btn small">一括設定を保存</button></div>`:""}
  ${rows.length?`<div class="media-grid inline-media-grid">${rows.map(r=>`<article class="media-card"><div class="media-card-preview">${previews.get(r.id)||`<span>${esc((r.kind||"file").toUpperCase())}</span>`}</div><div class="media-card-body"><h3>${esc(label(r))}</h3><div class="fine">${esc(r.original_name||"")}${r.size_bytes?` / ${(Number(r.size_bytes)/1048576).toFixed(2)} MiB`:""}</div><strong class="access-${esc(r.effective_access)}">${esc(ACCESS[r.effective_access]||r.effective_access)}</strong>${r.effective_terms?`<p class="allow-wrap">${esc(r.effective_terms)}</p>`:""}${canManage&&!r.static_asset?`<div class="media-rule-editor"><select class="select media-rule-access" data-id="${r.id}"><option value="" ${!r.download_access_override?"selected":""}>一括設定に従う</option><option value="deny" ${r.download_access_override==="deny"?"selected":""}>不可</option><option value="approval" ${r.download_access_override==="approval"?"selected":""}>承認制</option><option value="allow" ${r.download_access_override==="allow"?"selected":""}>許可</option></select><textarea class="textarea media-rule-terms" data-id="${r.id}" rows="2" placeholder="空欄なら一括利用規約">${esc(r.download_terms_override||"")}</textarea><button class="btn ghost small save-media-rule" data-id="${r.id}">個別設定を保存</button></div>`:""}<div class="toolbar">${r.static_asset?`<button class="btn ghost small" disabled>固定アセット</button>`:r.effective_access==="deny"?`<button class="btn ghost small" disabled>ダウンロード不可</button>`:r.effective_access==="approval"&&!r.can_download?`<button class="btn secondary small request-media" data-id="${r.id}">利用申請</button>`:`<button class="btn small download-media" data-id="${r.id}">ダウンロード</button>`}</div></div></article>`).join("")}</div>`:'<div class="empty">現在の国家ページで利用中の画像・音声はありません。</div>'}<div id="country-media-request-ui"></div><div id="country-media-admin-requests"></div>`;
  bind();if(canManage&&Cloud.ready())await renderRequests();
 }
 function bind(){
  document.getElementById("save-media-defaults")?.addEventListener("click",async()=>{const access=document.getElementById("media-default-access").value,terms=document.getElementById("media-default-terms").value;const q=await window.supabaseClient.rpc("mfdco_set_country_media_defaults",{p_country_id:country.id,p_access:access,p_terms:terms});if(q.error)return V.toast(q.error.message,"danger");country.mediaDistribution={...(country.mediaDistribution||{}),defaultAccess:access,defaultTerms:terms};V.toast("一括設定を保存しました");await mount(country,hostId)});
  host.querySelectorAll(".save-media-rule").forEach(b=>b.onclick=async()=>{const id=b.dataset.id,access=host.querySelector(`.media-rule-access[data-id="${id}"]`)?.value||null,terms=host.querySelector(`.media-rule-terms[data-id="${id}"]`)?.value||null;const q=await window.supabaseClient.rpc("mfdco_set_country_media_rule",{p_media_id:id,p_access:access||null,p_terms:terms||null});if(q.error)return V.toast(q.error.message,"danger");V.toast("個別設定を保存しました");await mount(country,hostId)});
  host.querySelectorAll(".download-media").forEach(b=>b.onclick=()=>download(b.dataset.id));
  host.querySelectorAll(".request-media").forEach(b=>b.onclick=()=>requestForm(b.dataset.id));
 }
 async function download(id){if(!Cloud.ready())return V.toast("本番接続時に利用できます","warn");const q=await window.supabaseClient.rpc("mfdco_get_country_media_download_path",{p_media_id:id});if(q.error||!q.data)return V.toast(q.error?.message||"ダウンロード権限がありません","warn");const row=rows.find(x=>x.id===id),s=await window.supabaseClient.storage.from("country-media").createSignedUrl(q.data,90,{download:row?.original_name||true});if(s.error)return V.toast(s.error.message,"danger");location.href=s.data.signedUrl}
 function requestForm(id){if(!user)return V.toast("承認制素材の申請にはログインが必要です","warn");const r=rows.find(x=>x.id===id),box=document.getElementById("country-media-request-ui");box.innerHTML=`<div class="card section-card media-request-box"><h3>素材利用申請</h3><p><strong>${esc(label(r))}</strong></p><div class="form-grid"><div class="field"><label>申請者名</label><input id="cmr-name" class="input"></div><div class="field"><label>利用目的</label><input id="cmr-purpose" class="input" placeholder="YouTube動画、Web記事など"></div><div class="field full"><label>利用内容・公開先</label><textarea id="cmr-details" class="textarea"></textarea></div></div>${country.mediaDistribution?.requestNote?`<div class="alert info">${esc(country.mediaDistribution.requestNote)}</div>`:""}<div class="toolbar"><button id="cmr-send" class="btn">申請を送る</button><button id="cmr-cancel" class="btn ghost">閉じる</button></div></div>`;document.getElementById("cmr-cancel").onclick=()=>box.innerHTML="";document.getElementById("cmr-send").onclick=async()=>{const name=document.getElementById("cmr-name").value.trim(),purpose=document.getElementById("cmr-purpose").value.trim(),details=document.getElementById("cmr-details").value.trim();if(!name||!purpose)return V.toast("申請者名と利用目的を入力してください","warn");const q=await window.supabaseClient.rpc("mfdco_request_country_media",{p_media_id:id,p_requester_name:name,p_purpose:purpose,p_details:details});if(q.error)return V.toast(q.error.message,"danger");V.toast("利用申請を送信しました");box.innerHTML=""}}
 async function renderRequests(){const out=document.getElementById("country-media-admin-requests"),q=await window.supabaseClient.from("country_media_requests").select("id,media_id,requester_name,purpose,details,status,expires_at,decision_note,created_at,country_media(original_name,slot)").eq("country_id",country.id).order("created_at",{ascending:false}).limit(100);if(q.error){console.warn(q.error);return}const req=q.data||[];if(!req.length)return;out.innerHTML=`<div class="media-request-admin"><h3>素材利用申請</h3><div class="table-wrap"><table><thead><tr><th>素材</th><th>申請者</th><th>目的</th><th>状態</th><th>期限</th><th>備考</th><th></th></tr></thead><tbody>${req.map(x=>`<tr><td>${esc(x.country_media?.original_name||x.country_media?.slot||"")}</td><td>${esc(x.requester_name)}</td><td>${esc(x.purpose)}</td><td>${esc(x.status)}</td><td>${x.status==="pending"?`<input type="date" class="input cmr-exp" data-id="${x.id}">`:esc(x.expires_at?String(x.expires_at).slice(0,10):"")}</td><td>${x.status==="pending"?`<input class="input cmr-note" data-id="${x.id}" placeholder="条件・備考">`:esc(x.decision_note||"")}</td><td>${x.status==="pending"?`<button class="btn small cmr-decide" data-id="${x.id}" data-status="approved">承認</button> <button class="btn danger small cmr-decide" data-id="${x.id}" data-status="rejected">否認</button>`:""}</td></tr>`).join("")}</tbody></table></div></div>`;out.querySelectorAll(".cmr-decide").forEach(b=>b.onclick=async()=>{const rid=b.dataset.id,status=b.dataset.status,exp=out.querySelector(`.cmr-exp[data-id="${rid}"]`)?.value||null,note=out.querySelector(`.cmr-note[data-id="${rid}"]`)?.value||"";const rr=await window.supabaseClient.rpc("mfdco_respond_country_media_request",{p_request_id:rid,p_status:status,p_expires_at:exp||null,p_note:note});if(rr.error)return V.toast(rr.error.message,"danger");if(status==="approved"){try{await window.supabaseClient.functions.invoke("country-license-email",{body:{request_id:rid,request_type:"country_media"}})}catch(e){console.warn(e);V.toast("承認済みですがメール送信を確認してください","warn")}}await mount(country,hostId)})}
 await draw();
}
window.MFDCOCountryMediaInline={collect,mount};
})();
