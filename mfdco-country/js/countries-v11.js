"use strict";
document.addEventListener("DOMContentLoaded",async()=>{
const C=window.MFDCOCountry,X=window.MFDCOCountryV11,Cloud=window.MFDCOCountryCloud;
const grid=document.getElementById("country-grid"),search=document.getElementById("country-search"),sort=document.getElementById("country-sort"),count=document.getElementById("country-count"),createBtn=document.getElementById("create-country");if(!grid)return;

let currentIdentity={user:null,profile:null,linked:false,error:null};

function showLoginFallback(message=""){
 if(!createBtn)return;
 createBtn.disabled=false;
 createBtn.textContent="ログインして国家を作成";
 createBtn.classList.add("secondary");
 createBtn.title=message||"MFDCOアカウントへのログインが必要です";
}

async function refreshCreateButton(force=false){
 if(!createBtn)return;

 try{
  const st=await Cloud.sessionIdentity(force);
  currentIdentity=st||currentIdentity;
  createBtn.disabled=false;

  if(!st?.user){
   showLoginFallback(st?.error||"MFDCOアカウントへのログインが必要です");
   return;
  }

  if(!st?.profile){
   createBtn.textContent="プロフィール設定後に国家を作成";
   createBtn.classList.add("secondary");
   createBtn.title="ログイン済みですがMFDCOプロフィールを確認できません";
   return;
  }

  createBtn.textContent="＋ 国家を作成";
  createBtn.classList.remove("secondary");
  createBtn.title=`${st.profile.activity_name||"MFDCOアカウント"} として作成`;
 }catch(e){
  console.warn("COUNTRY CREATE AUTH",e);
  showLoginFallback(e?.message||String(e));
 }
}

// Never leave the button in a permanent "checking" state.
showLoginFallback("ログイン状態を確認しています");
refreshCreateButton(false);
window.addEventListener("mfdco-country-auth",()=>refreshCreateButton(false));

// Public list loading is independent of auth.
let items=await Cloud.listCountries({});
const market=document.createElement("section");market.className="card section-card world-market-card";market.id="world-market-today";document.querySelector(".list-controls")?.before(market);
async function renderMarket(){const theme=X.worldTheme(),month=X.monthlyTheme(),res=X.dailyResourceTheme(),snap=await Cloud.marketSnapshots(),priority=await Cloud.marketPriorityMap();const rows=snap.map(c=>{const p=priority[c.id]||{},move=X.simulatedMarket(c,new Date(),{isMain:!!p.isMain,isActive:!!p.isActive});return {c,move,score:X.exposureToTheme(c,theme.strong)-X.exposureToTheme(c,theme.weak)*.5}}).sort((a,b)=>b.score-a.score);market.innerHTML=`<div class="section-head"><div><div class="eyebrow">WORLD MARKET / ${theme.date}</div><h2>本日の世界経済テーマ</h2></div><a class="btn ghost small" href="country-market.html">履歴を見る</a></div><div class="world-theme-grid"><div class="world-theme good"><small>本日 優勢</small><strong>${C.esc(theme.strong.label)}</strong><span>資源 ${C.esc(res.strong.label)}</span></div><div class="world-theme bad"><small>本日 逆風</small><strong>${C.esc(theme.weak.label)}</strong><span>資源 ${C.esc(res.weak.label)}</span></div><div class="world-theme"><small>今月の基調</small><strong>${C.esc(month.strong.label)}</strong><span>${C.esc(month.resourceStrong.label)}が強い</span></div><div class="world-theme"><small>恩恵を受けやすい国家</small>${rows.slice(0,3).map(x=>`<a href="country.html?id=${x.c.id}">${C.esc(x.c.name)} <b>${x.move.enabled?(x.move.pct>=0?"+":"")+x.move.pct.toFixed(2)+"%":"設定OFF"}</b></a>`).join("")||"未設定"}</div></div><p class="fine">月・日・1時間ごとの決定論的変動と、資源・産業依存度、メイン/アクティブ国家の小さな優遇を組み合わせた創作用市場です。実際の投資情報ではありません。</p>`}
async function render(){const q=(search?.value||"").trim().toLowerCase();let rows=items.filter(c=>!q||[c.name,c.shortName,c.englishName,c.code,c.summary,...C.arr(c.tags)].join(" ").toLowerCase().includes(q));rows.sort((a,b)=>sort?.value==="strength"?C.num(b._index?.strength)-C.num(a._index?.strength):sort?.value==="complete"?C.num(b._index?.completeness)-C.num(a._index?.completeness):sort?.value==="name"?String(a.name).localeCompare(String(b.name),"ja"):String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));if(count)count.textContent=`${rows.length}か国`;grid.innerHTML="";for(const c of rows){const [flag,cover]=await Promise.all([Cloud.resolveMedia(c.media?.flagKey||""),Cloud.resolveMedia(c.media?.coverKey||"")]);const a=document.createElement("article");a.className="country-card";a.innerHTML=`<div class="country-card-cover" ${cover?`style="background-image:url('${cover.replace(/'/g,"%27")}')"`:""}>${flag?`<img class="country-card-flag" src="${flag}" alt="${C.esc(c.name)} 国旗">`:""}</div><div class="country-card-body"><div class="eyebrow">${C.esc(c.code||"COUNTRY")}</div><h3><a href="country.html?id=${c.id}">${C.esc(c.name)}</a></h3><div class="fine">${C.esc(c.capital?.name||"")}${c.government?.system?` ・ ${C.esc(c.government.system)}`:""}</div><p>${C.esc((c.summary||"").slice(0,140))}</p><div class="country-meta"><span class="pill">国家力 ${C.fmtNum(c._index?.strength||0)}</span><span class="pill gray">資料 ${C.fmtNum(c._index?.completeness||0)}%</span>${C.arr(c.tags).slice(0,3).map(t=>`<span class="pill gray">${C.esc(t)}</span>`).join("")}</div><div class="toolbar"><a class="btn small" href="country.html?id=${c.id}">資料を見る</a><a class="btn ghost small" href="country-compare.html?ids=${c.id}">比較</a></div></div>`;grid.appendChild(a)}if(!rows.length)grid.innerHTML='<div class="empty">該当する国家がありません。</div>'}
search?.addEventListener("input",render);sort?.addEventListener("change",render);createBtn?.addEventListener("click",async()=>{
 createBtn.disabled=true;
 try{
  const st=await Cloud.sessionIdentity(true);
  if(!st?.user){
   location.href=`https://mfdco.net/join.html?next=${encodeURIComponent(location.href)}`;
   return;
  }
  if(!st?.profile){
   location.href="https://mfdco.net/profile-setup.html";
   return;
  }
  location.href="country-templates.html";
 }catch(e){
  location.href=`https://mfdco.net/join.html?next=${encodeURIComponent(location.href)}`;
 }finally{
  createBtn.disabled=false;
 }
});await renderMarket();await render();
});
