"use strict";
(function(){
const C=window.MFDCOCountry;
const L=window.MFDCOCountryLocalDB;
const VALID_STATUS=["official","draft","archived"];
const VALID_VIS=["public","members","collaborators","owner"];
const now=()=>new Date().toISOString();
function client(){return window.supabaseClient||null}
function cloudReady(){return !!client()}
function syncErrorText(e){
 return String(e?.message||e?.details||e?.hint||e||"保存に失敗しました");
}
async function currentUser(){
 if(!cloudReady())return null;

 try{
  if(window.MFDCOCountryCloud?.sessionIdentity){
   const st=await window.MFDCOCountryCloud.sessionIdentity(false);
   return st?.user||null;
  }

  if(window.MFDCOCountrySession?.getState){
   const st=await window.MFDCOCountrySession.getState(false);
   return st?.user||null;
  }

  const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error("auth timeout")),3000));
  const {data,error}=await Promise.race([client().auth.getSession(),timeout]);
  if(error)throw error;
  return data?.session?.user||null;
 }catch(e){
  console.warn("V20 current user fallback",e);
  return null;
 }
}
function cleanStatus(v){return VALID_STATUS.includes(v)?v:"draft"}
function cleanVisibility(v){return VALID_VIS.includes(v)?v:"owner"}
const docCacheKey=(cid,key)=>`v20:doc:${cid}:${key}`;
const entityCacheKey=(cid,type)=>`v20:entities:${cid}:${type||"*"}`;
const rulesCacheKey=cid=>`v20:visibility:${cid}`;

async function getDocument(countryId,documentKey,fallback={}){
 if(!countryId||!documentKey)return fallback;
 if(cloudReady()){
  try{
   const {data,error}=await client().from("country_documents")
    .select("country_id,document_key,status,visibility,payload,revision,updated_at")
    .eq("country_id",countryId).eq("document_key",documentKey).maybeSingle();
   if(error)throw error;
   if(data){await L?.setCache?.(docCacheKey(countryId,documentKey),data);return data}
  }catch(e){console.warn("V20 document cloud fallback",e)}
 }
 const cached=await L?.getCache?.(docCacheKey(countryId,documentKey),null);
 return cached||{country_id:countryId,document_key:documentKey,status:"draft",visibility:"owner",payload:fallback,revision:0,updated_at:null};
}
async function saveDocument(countryId,documentKey,payload,{status="draft",visibility="owner"}={}){
 const row={
  country_id:countryId,
  document_key:documentKey,
  status:cleanStatus(status),
  visibility:cleanVisibility(visibility),
  payload:payload||{},
  updated_at:now()
 };

 await L?.setCache?.(docCacheKey(countryId,documentKey),row);
 await L?.saveCountryDraft?.(countryId,`document:${documentKey}`,row);

 const u=await currentUser();
 if(!cloudReady()||!u){
  await L?.queueChange?.({kind:"document_upsert",countryId,documentKey,row});
  return {...row,localOnly:true,pendingSync:true};
 }

 try{
  const {data,error}=await client()
   .from("country_documents")
   .upsert(row,{onConflict:"country_id,document_key"})
   .select()
   .single();

  if(error)throw error;

  await L?.setCache?.(docCacheKey(countryId,documentKey),data);
  await L?.clearCountryDraft?.(countryId,`document:${documentKey}`);
  return data;
 }catch(e){
  console.warn("V20 document cloud save queued",e);
  await L?.queueChange?.({kind:"document_upsert",countryId,documentKey,row});
  const local={...row,localOnly:true,pendingSync:true,syncError:syncErrorText(e)};
  await L?.setCache?.(docCacheKey(countryId,documentKey),local);
  return local;
 }
}
async function listEntities(countryId,entityType=null,{includeArchived=false}={}){
 if(!countryId)return [];

 const cached=(await L?.getCache?.(entityCacheKey(countryId,entityType),[]))||[];

 if(cloudReady()){
  try{
   let q=client()
    .from("country_entities")
    .select("*")
    .eq("country_id",countryId)
    .order("sort_order")
    .order("updated_at");

   if(entityType)q=q.eq("entity_type",entityType);
   if(!includeArchived)q=q.neq("status","archived");

   const {data,error}=await q;
   if(error)throw error;

   const remote=data||[];
   const remoteIds=new Set(remote.map(x=>x.id));
   const pending=cached.filter(x=>x?._pendingSync && !remoteIds.has(x.id));
   const merged=[...remote,...pending];

   await L?.setCache?.(entityCacheKey(countryId,entityType),merged);
   return merged;
  }catch(e){
   console.warn("V20 entities cloud fallback",e);
  }
 }

 return cached;
}
async function saveEntity(countryId,entity,{entityType=null}={}){
 const id=entity.id||globalThis.crypto?.randomUUID?.()||`e_${Date.now()}_${Math.random().toString(36).slice(2)}`;
 const row={
  id,
  country_id:countryId,
  parent_id:entity.parent_id||null,
  entity_type:entityType||entity.entity_type||"generic",
  name:String(entity.name||"新しい項目"),
  status:cleanStatus(entity.status),
  visibility:cleanVisibility(entity.visibility),
  valid_from:entity.valid_from||null,
  valid_to:entity.valid_to||null,
  sort_order:Number(entity.sort_order)||0,
  payload:entity.payload||{},
  updated_at:now()
 };

 const type=row.entity_type;
 const cacheKey=entityCacheKey(countryId,type);
 const cached=(await L?.getCache?.(cacheKey,[]))||[];
 const localRow={...row,_pendingSync:true};

 const i=cached.findIndex(x=>x.id===id);
 if(i>=0)cached[i]=localRow;
 else cached.push(localRow);
 await L?.setCache?.(cacheKey,cached);

 const u=await currentUser();
 if(!cloudReady()||!u){
  await L?.queueChange?.({kind:"entity_upsert",countryId,row});
  return {...localRow,localOnly:true,pendingSync:true};
 }

 try{
  const {data,error}=await client()
   .from("country_entities")
   .upsert(row,{onConflict:"id"})
   .select()
   .single();

  if(error)throw error;

  const latest=(await L?.getCache?.(cacheKey,[]))||[];
  const n=latest.findIndex(x=>x.id===id);
  if(n>=0)latest[n]=data;
  else latest.push(data);
  await L?.setCache?.(cacheKey,latest);

  return data;
 }catch(e){
  console.warn("V20 entity cloud save queued",e);
  await L?.queueChange?.({kind:"entity_upsert",countryId,row});

  const latest=(await L?.getCache?.(cacheKey,[]))||[];
  const n=latest.findIndex(x=>x.id===id);
  const pending={
   ...row,
   _pendingSync:true,
   localOnly:true,
   pendingSync:true,
   syncError:syncErrorText(e)
  };
  if(n>=0)latest[n]=pending;
  else latest.push(pending);
  await L?.setCache?.(cacheKey,latest);

  return pending;
 }
}
async function deleteEntity(countryId,id,entityType=null){
 if(!id)return;

 const key=entityCacheKey(countryId,entityType);
 const rows=(await L?.getCache?.(key,[]))||[];
 await L?.setCache?.(key,rows.filter(x=>x.id!==id));

 const u=await currentUser();
 if(!cloudReady()||!u){
  await L?.queueChange?.({kind:"entity_delete",countryId,id,entityType});
  return {localOnly:true,pendingSync:true};
 }

 try{
  const {error}=await client()
   .from("country_entities")
   .delete()
   .eq("id",id)
   .eq("country_id",countryId);

  if(error)throw error;
  return {deleted:true};
 }catch(e){
  console.warn("V20 entity delete queued",e);
  await L?.queueChange?.({kind:"entity_delete",countryId,id,entityType});
  return {localOnly:true,pendingSync:true,syncError:syncErrorText(e)};
 }
}
async function listLinks(countryId,linkType=null){
 const key=`v20:links:${countryId}:${linkType||"*"}`;
 const cached=(await L?.getCache?.(key,[]))||[];
 if(!cloudReady())return cached;
 try{
  let q=client().from("country_links").select("*").eq("country_id",countryId).order("updated_at",{ascending:false});
  if(linkType)q=q.eq("link_type",linkType);
  const {data,error}=await q;
  if(error)throw error;
  await L?.setCache?.(key,data||[]);
  return data||[];
 }catch(e){
  console.warn("V20 links cloud fallback",e);
  return cached;
 }
}
async function saveLink(countryId,link){
 const row={
  id:link.id||globalThis.crypto?.randomUUID?.()||`l_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  country_id:countryId,
  target_country_id:link.target_country_id||null,
  link_type:link.link_type||"generic",
  status:cleanStatus(link.status),
  visibility:cleanVisibility(link.visibility),
  payload:link.payload||{},
  updated_at:now()
 };
 const key=`v20:links:${countryId}:${row.link_type||"*"}`;
 const cached=(await L?.getCache?.(key,[]))||[];
 const i=cached.findIndex(x=>x.id===row.id);
 const local={...row,_pendingSync:true};
 if(i>=0)cached[i]=local;else cached.push(local);
 await L?.setCache?.(key,cached);

 const u=await currentUser();
 if(!cloudReady()||!u){
  await L?.queueChange?.({kind:"link_upsert",countryId,row});
  return {...local,localOnly:true,pendingSync:true};
 }
 try{
  const {data,error}=await client().from("country_links").upsert(row,{onConflict:"id"}).select().single();
  if(error)throw error;
  return data;
 }catch(e){
  await L?.queueChange?.({kind:"link_upsert",countryId,row});
  return {...local,localOnly:true,pendingSync:true,syncError:syncErrorText(e)};
 }
}
async function listVisibilityRules(countryId){
 const key=rulesCacheKey(countryId);
 const cached=(await L?.getCache?.(key,[]))||[];
 if(!cloudReady())return cached;
 try{
  const {data,error}=await client().from("country_visibility_rules").select("*").eq("country_id",countryId).order("path");
  if(error)throw error;
  await L?.setCache?.(key,data||[]);
  return data||[];
 }catch(e){
  console.warn("V20 visibility rules cloud fallback",e);
  return cached;
 }
}
async function saveVisibilityRule(countryId,path,visibility){
 const row={country_id:countryId,path:String(path||"").trim(),visibility:cleanVisibility(visibility),updated_at:now()};
 if(!row.path)throw new Error("公開設定のパスが空です");

 const key=rulesCacheKey(countryId);
 const cached=(await L?.getCache?.(key,[]))||[];
 const i=cached.findIndex(x=>x.path===row.path);
 const local={...row,_pendingSync:true};
 if(i>=0)cached[i]=local;else cached.push(local);
 await L?.setCache?.(key,cached);

 const u=await currentUser();
 if(!cloudReady()||!u){
  await L?.queueChange?.({kind:"visibility_upsert",countryId,row});
  return {...local,localOnly:true,pendingSync:true};
 }
 try{
  const {data,error}=await client().from("country_visibility_rules").upsert(row,{onConflict:"country_id,path"}).select().single();
  if(error)throw error;
  return data;
 }catch(e){
  await L?.queueChange?.({kind:"visibility_upsert",countryId,row});
  return {...local,localOnly:true,pendingSync:true,syncError:syncErrorText(e)};
 }
}
async function listChanges(countryId,limit=100){
 if(!cloudReady())return [];
 const {data,error}=await client().from("country_change_log").select("*").eq("country_id",countryId).order("changed_at",{ascending:false}).limit(Math.min(500,Math.max(1,limit)));
 return error?[]:data||[];
}
function computeMetrics(country,{budget=null,demography=null,supply=null,tradePartners=[]}={}){
 const gdp=C?.num?.(country?.economy?.gdp,0)||0;
 const pop=C?.num?.(country?.population,0)||0;
 const area=C?.num?.(country?.territory?.area||country?.area,0)||0;
 const b=budget||{};
 const revenue=Number(b.revenueTotal||0),expenditure=Number(b.expenditureTotal||0),debt=Number(b.debt||country?.economy?.debt||0);
 const d=demography||{};
 const births=Number(d.births||0),deaths=Number(d.deaths||0),immigration=Number(d.immigration||0),emigration=Number(d.emigration||0);
 const s=supply||{};
 const exports=tradePartners.reduce((a,x)=>a+Number(x.payload?.exports||0),0),imports=tradePartners.reduce((a,x)=>a+Number(x.payload?.imports||0),0);
 return {
  populationDensity:area?pop/area:null,
  gdpPerCapita:pop?gdp/pop:null,
  fiscalBalance:revenue-expenditure,
  fiscalBalanceGdpPct:gdp?(revenue-expenditure)/gdp*100:null,
  debtGdpPct:gdp?debt/gdp*100:null,
  netPopulationChange:births-deaths+immigration-emigration,
  foodSelfSufficiency:Number(s.foodConsumption||0)?Number(s.foodProduction||0)/Number(s.foodConsumption)*100:null,
  powerSelfSufficiency:Number(s.powerDemand||0)?Number(s.powerGeneration||0)/Number(s.powerDemand)*100:null,
  tradeBalance:exports-imports,
  tradeDependencyPct:gdp?((exports+imports)/gdp*100):null
 };
}
async function saveMetrics(countryId,metrics){
 const rows=Object.entries(metrics||{})
  .filter(([,v])=>v!==null&&v!==undefined&&Number.isFinite(Number(v)))
  .map(([metric_key,value])=>({country_id:countryId,metric_key,value:Number(value),computed_at:now()}));
 if(!rows.length)return [];

 await L?.setCache?.(`v20:metrics:${countryId}`,rows);

 if(!cloudReady()||!(await currentUser())){
  await L?.queueChange?.({kind:"metrics_upsert",countryId,rows});
  return Object.assign(rows,{pendingSync:true,localOnly:true});
 }

 try{
  const {data,error}=await client().from("country_metrics").upsert(rows,{onConflict:"country_id,metric_key"}).select();
  if(error)throw error;
  return data||[];
 }catch(e){
  await L?.queueChange?.({kind:"metrics_upsert",countryId,rows});
  const local=rows.slice();
  local.pendingSync=true;local.localOnly=true;local.syncError=syncErrorText(e);
  return local;
 }
}
async function uploadUserArchive(countryId,name,payload){
 const u=await currentUser();if(!cloudReady()||!u)throw new Error("クラウドアーカイブにはログインが必要です");
 const safe=String(name||"archive").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(0,80);
 const path=`${u.id}/${countryId}/archives/${Date.now()}_${safe}.json`;
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const quota=await client().rpc("mfdco_check_account_storage_quota",{p_added_bytes:blob.size});
 if(quota.error)throw quota.error;
 if(quota.data&&!quota.data.allowed){
  const mb=n=>(Number(n||0)/1024/1024).toFixed(1);
  if(quota.data.file_allowed===false)throw new Error(`バックアップ1件の上限を超えています（上限 ${mb(quota.data.max_file_bytes)} MiB）`);
  throw new Error(`MFDCOアカウント容量を超えます（${mb(quota.data.projected_account)} / ${mb(quota.data.account_limit_bytes||quota.data.account_limit)} MiB）`);
 }
 const {error}=await client().storage.from("country-user-data").upload(path,blob,{contentType:"application/json",upsert:false});if(error)throw error;
 return path;
}
async function flushQueue(){
 if(!cloudReady())return {processed:0,remaining:(await L?.queued?.())?.length||0};
 const u=await currentUser();if(!u)return {processed:0,remaining:(await L?.queued?.())?.length||0};
 let processed=0;
 for(const item of await L?.queued?.()||[]){
  try{
   if(item.kind==="document_upsert"){
    const {error}=await client().from("country_documents").upsert(item.row,{onConflict:"country_id,document_key"});if(error)throw error;
   }else if(item.kind==="entity_upsert"){
    const {error}=await client().from("country_entities").upsert(item.row,{onConflict:"id"});if(error)throw error;
   }else if(item.kind==="entity_delete"){
    const {error}=await client().from("country_entities").delete().eq("id",item.id).eq("country_id",item.countryId);if(error)throw error;
   }else if(item.kind==="link_upsert"){
    const {error}=await client().from("country_links").upsert(item.row,{onConflict:"id"});if(error)throw error;
   }else if(item.kind==="visibility_upsert"){
    const {error}=await client().from("country_visibility_rules").upsert(item.row,{onConflict:"country_id,path"});if(error)throw error;
   }else if(item.kind==="metrics_upsert"){
    const {error}=await client().from("country_metrics").upsert(item.rows||[],{onConflict:"country_id,metric_key"});if(error)throw error;
   }
   await L?.removeQueued?.(item.id);processed++;
  }catch(e){console.warn("V20 queue item failed",item,e)}
 }
 const remaining=(await L?.queued?.())?.length||0;return {processed,remaining};
}
window.MFDCOCountryV20Data={VALID_STATUS,VALID_VIS,getDocument,saveDocument,listEntities,saveEntity,deleteEntity,listLinks,saveLink,listVisibilityRules,saveVisibilityRule,listChanges,computeMetrics,saveMetrics,uploadUserArchive,flushQueue};
window.addEventListener("online",()=>flushQueue().catch(()=>{}));
setTimeout(()=>flushQueue().catch(()=>{}),1500);
})();
