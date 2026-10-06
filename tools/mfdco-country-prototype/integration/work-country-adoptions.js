"use strict";

/* ============================================================
   MFDCO Work -> Country Operations integration v1
   Add AFTER supabase-config.js on work.html.
   It appends a country-adoption section to the existing Work page.
   ============================================================ */

(async()=>{
  const supabase=window.supabaseClient;
  if(!supabase)return;
  const workId=new URLSearchParams(location.search).get("id");
  if(!workId)return;
  const {data,error}=await supabase.from("country_work_adoptions")
    .select("id,country_id,designation,category,branch_name,notes,status,adopted_at,countries(id,name,short_name,code,flag_key,is_public)")
    .eq("work_id",workId).eq("status","active").order("adopted_at",{ascending:false,nullsFirst:false});
  if(error){console.warn("WORK COUNTRY ADOPTIONS:",error);return;}
  const rows=data||[];
  const host=document.getElementById("work-content")||document.querySelector("main")||document.body;
  const section=document.createElement("section");
  section.id="work-country-adoptions";
  section.className="work-country-adoptions";
  section.innerHTML=`<style>
    .work-country-adoptions{margin:28px 0;padding:24px;background:#fff;border:1px solid #ddd}.work-country-adoptions h2{margin:0 0 6px;font-size:22px}.work-country-adoptions>p{margin:0 0 16px;color:#666;font-size:13px}.work-country-adoption-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.work-country-adoption{border:1px solid #ddd;padding:12px;text-decoration:none;color:#111;display:grid;grid-template-columns:66px 1fr;gap:11px}.work-country-adoption-flag{width:66px;aspect-ratio:3/2;background:#edf1f0;overflow:hidden}.work-country-adoption-flag img{width:100%;height:100%;object-fit:cover}.work-country-adoption b,.work-country-adoption small{display:block}.work-country-adoption b{font-size:13px;margin:2px 0 5px}.work-country-adoption small{font-size:10px;color:#666;line-height:1.6}@media(max-width:760px){.work-country-adoption-grid{grid-template-columns:1fr}}
  </style><h2>正式採用国</h2><p>MFDCO国家運営で、この作品を国家単位の正式採用品として登録している国です。</p><div class="work-country-adoption-grid">${rows.map((r,i)=>`<a class="work-country-adoption" href="country.html?id=${encodeURIComponent(r.country_id)}"><div class="work-country-adoption-flag" data-country-flag="${i}"></div><div><b>${escapeHtml(r.countries?.name||r.country_id)}</b><small>${escapeHtml(r.designation||"")}${r.branch_name?`<br>${escapeHtml(r.branch_name)}`:""}${r.adopted_at?`<br>採用 ${escapeHtml(r.adopted_at)}`:""}</small></div></a>`).join("")||'<div style="color:#777;font-size:13px">国家単位の正式採用はまだありません。</div>'}</div>`;
  host.appendChild(section);

  for(let i=0;i<rows.length;i++){
    const key=rows[i].countries?.flag_key;if(!key||!String(key).startsWith("cloud:"))continue;
    const {data:u,error:e}=await supabase.storage.from("country-media").createSignedUrl(String(key).replace(/^cloud:/,""),3600);
    if(e||!u?.signedUrl)continue;
    const el=section.querySelector(`[data-country-flag="${i}"]`);if(el)el.innerHTML=`<img src="${u.signedUrl}" alt="">`;
  }

  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[m]);}
})();
