"use strict";
(function(){
const C=window.MFDCOCountry;
const L=window.MFDCOCountryLocalDB;
const VALID_STATUS=["official","draft","archived"];
const VALID_VIS=["public","members","collaborators","owner"];
const now=()=>new Date().toISOString();
function client(){return window.supabaseClient||null}
function cloudReady(){return !!client()}
async function currentUser(){if(!cloudReady())return null;try{return (await client().auth.getUser()).data?.user||null}catch{return null}}
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
 const row={country_id:countryId,document_key:documentKey,status:cleanStatus(status),visibility:cleanVisibility(visibility),payload:payload||{},updated_at:now()};
 await L?.setCache?.(docCacheKey(countryId,documentKey),row);
 await L?.saveCountryDraft?.(countryId,`document:${documentKey}`,row);
 const u=await currentUser();
 if(!cloudReady()||!u){
  await L?.queueChange?.({kind:"document_upsert",countryId,documentKey,row});
  return {...row,localOnly:true};
 }
 const {data,error}=await client().from("country_documents").upsert(row,{onConflict:"country_id,document_key"}).select().single();
 if(error)throw error;
 await L?.setCache?.(docCacheKey(countryId,documentKey),data);
 await L?.clearCountryDraft?.(countryId,`document:${documentKey}`);
 return data;
}
async function listEntities(countryId,entityType=null,{includeArchived=false}={}){
 if(!countryId)return [];
 if(cloudReady()){
  try{
   let q=client().from("country_entities").select("*").eq("country_id",countryId).order("sort_order").order("updated_at");
   if(entityType)q=q.eq("entity_type",entityType);
   if(!includeArchived)q=q.neq("status","archived");
   const {data,error}=await q;if(error)throw error;
   await L?.setCache?.(entityCacheKey(countryId,entityType),data||[]);
   return data||[];
  }catch(e){console.warn("V20 entities cloud fallback",e)}
 }
 return await L?.getCache?.(entityCacheKey(countryId,entityType),[]);
}
async function saveEntity(countryId,entity,{entityType=null}={}){
 const id=entity.id||crypto?.randomUUID?.()||`e_${Date.now()}_${Math.random().toString(36).slice(2)}`;
 const row={
  id,country_id:countryId,parent_id:entity.parent_id||null,
  entity_type:entityType||entity.entity_type||"generic",
  name:String(entity.name||"新しい項目"),
  status:cleanStatus(entity.status),
  visibility:cleanVisibility(entity.visibility),
  valid_from:entity.valid_from||null,valid_to:entity.valid_to||null,
  sort_order:Number(entity.sort_order)||0,payload:entity.payload||{},
  updated_at:now()
 };
 const type=row.entity_type;
 const cached=(await L?.getCache?.(entityCacheKey(countryId,type),[]))||[];
 const i=cached.findIndex(x=>x.id===id);if(i>=0)cached[i]=row;else cached.push(row);
 await L?.setCache?.(entityCacheKey(countryId,type),cached);
 const u=await currentUser();
 if(!cloudReady()||!u){
  await L?.queueChange?.({kind:"entity_upsert",countryId,row});
  return {...row,localOnly:true};
 }
 const {data,error}=await client().from("country_entities").upsert(row,{onConflict:"id"}).select().single();
 if(error)throw error;
 return data;
}
async function deleteEntity(countryId,id,entityType=null){
 if(!id)return;
 const u=await currentUser();
 if(!cloudReady()||!u){
  const rows=(await L?.getCache?.(entityCacheKey(countryId,entityType),[]))||[];
  await L?.setCache?.(entityCacheKey(countryId,entityType),rows.filter(x=>x.id!==id));
  await L?.queueChange?.({kind:"entity_delete",countryId,id,entityType});
  return;
 }
 const {error}=await client().from("country_entities").delete().eq("id",id).eq("country_id",countryId);
 if(error)throw error;
}
async function listLinks(countryId,linkType=null){
 if(!cloudReady())return await L?.getCache?.(`v20:links:${countryId}:${linkType||"*"}`,[]);
 let q=client().from("country_links").select("*").eq("country_id",countryId).order("updated_at",{ascending:false});
 if(linkType)q=q.eq("link_type",linkType);
 const {data,error}=await q;if(error)throw error;
 await L?.setCache?.(`v20:links:${countryId}:${linkType||"*"}`,data||[]);
 return data||[];
}
async function saveLink(countryId,link){
 const row={id:link.id||crypto.randomUUID(),country_id:countryId,target_country_id:link.target_country_id||null,link_type:link.link_type||"generic",status:cleanStatus(link.status),visibility:cleanVisibility(link.visibility),payload:link.payload||{},updated_at:now()};
 const u=await currentUser();
 if(!cloudReady()||!u){await L?.queueChange?.({kind:"link_upsert",countryId,row});return {...row,localOnly:true}}
 const {data,error}=await client().from("country_links").upsert(row,{onConflict:"id"}).select().single();if(error)throw error;return data;
}
async function listVisibilityRules(countryId){
 if(!cloudReady())return await L?.getCache?.(rulesCacheKey(countryId),[]);
 const {data,error}=await client().from("country_visibility_rules").select("*").eq("country_id",countryId).order("path");
 if(error)throw error;await L?.setCache?.(rulesCacheKey(countryId),data||[]);return data||[];
}
async function saveVisibilityRule(countryId,path,visibility){
 const row={country_id:countryId,path:String(path||"").trim(),visibility:cleanVisibility(visibility),updated_at:now()};
 if(!row.path)throw new Error("公開設定のパスが空です");
 const u=await currentUser();
 if(!cloudReady()||!u){await L?.queueChange?.({kind:"visibility_upsert",countryId,row});return {...row,localOnly:true}}
 const {data,error}=await client().from("country_visibility_rules").upsert(row,{onConflict:"country_id,path"}).select().single();if(error)throw error;return data;
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
 const rows=Object.entries(metrics||{}).filter(([,v])=>v!==null&&v!==undefined&&Number.isFinite(Number(v))).map(([metric_key,value])=>({country_id:countryId,metric_key,value:Number(value),computed_at:now()}));
 if(!rows.length)return [];
 if(!cloudReady()||!(await currentUser())){await L?.setCache?.(`v20:metrics:${countryId}`,rows);return rows}
 const {data,error}=await client().from("country_metrics").upsert(rows,{onConflict:"country_id,metric_key"}).select();if(error)throw error;return data||[];
}
async function uploadUserArchive(countryId,name,payload){
 const u=await currentUser();if(!cloudReady()||!u)throw new Error("クラウドアーカイブにはログインが必要です");
 const safe=String(name||"archive").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(0,80);
 const path=`${u.id}/${countryId}/archives/${Date.now()}_${safe}.json`;
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
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
