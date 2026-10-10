"use strict";
(function(){
const C=window.MFDCOCountry;
const L=window.MFDCOCountryLocalDB;
async function waitForClient(timeoutMs=2500){
 const started=Date.now();
 while(!window.supabaseClient && Date.now()-started<timeoutMs){await new Promise(r=>setTimeout(r,40))}
 return window.supabaseClient||null;
}
function withTimeout(promise,timeoutMs=3000,label="request timeout"){
 let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),timeoutMs)});
 return Promise.race([Promise.resolve(promise),timeout]).finally(()=>clearTimeout(timer));
}
const MAP={timeline:"timeline",posts:"post",wikiPages:"wiki",statistics:"statistic",mapPoints:"map_point",systems:"system",organizations:"organization",officialEquipment:"official_equipment",cities:"city",companies:"company",territories:"territory",disputes:"dispute",borders:"border",overseasBases:"overseas_base",universities:"university",researchInstitutions:"research_institution",welfarePrograms:"welfare_program",policies:"policy",opinionPolls:"opinion_poll",protests:"protest",trustMetrics:"trust_metric",equalityMetrics:"equality_metric",policeOrganizations:"police_org",criminalOrganizations:"criminal_org",ideologies:"ideology",securityPrograms:"security_program",banks:"bank",conglomerates:"conglomerate",resourceReserves:"resource_reserve",environmentalIssues:"environment_issue",sdgGoals:"sdg_goal",ports:"port",airports:"airport",highways:"highway",railways:"railway",historyMajorPeriods:"history_major_period",historyMinorPeriods:"history_minor_period",regnalEras:"regnal_era",heritageSites:"heritage",socialPlatforms:"social_platform",marketDependencies:"market_dependency"};
const reverse=Object.fromEntries(Object.entries(MAP).map(([k,v])=>[v,k]));
function ready(){return !!window.supabaseClient}
async function sessionIdentity(force=false){
 await waitForClient(2500);

 if(window.MFDCOCountrySession?.getState){
  try{
   const st=await withTimeout(
    window.MFDCOCountrySession.getState(force),
    4500,
    "country session timeout"
   );
   return {
    user:st?.user||null,
    profile:st?.profile||null,
    linked:!!(st?.user&&st?.profile),
    error:st?.error||null
   };
  }catch(e){
   return {user:null,profile:null,linked:false,error:e?.message||String(e)};
  }
 }

 if(!ready())return {
  user:null,profile:null,linked:false,error:"Supabase client unavailable"
 };

 try{
  const {data,error}=await withTimeout(
   window.supabaseClient.auth.getSession(),
   3000,
   "login session lookup timeout"
  );
  if(error)throw error;

  const u=data?.session?.user||null;
  if(!u)return {user:null,profile:null,linked:false,error:null};

  const q=await withTimeout(
   window.supabaseClient
    .from("profiles")
    .select("id,activity_name,icon_url,status,permanent_member,admin")
    .eq("id",u.id)
    .maybeSingle(),
   3000,
   "profile lookup timeout"
  );

  return {
   user:u,
   profile:q.error?null:(q.data||null),
   linked:!!q.data,
   error:q.error?.message||null
  };
 }catch(e){
  return {user:null,profile:null,linked:false,error:e?.message||String(e)};
 }
}
async function user(){return (await sessionIdentity()).user||null}
async function mfdcoAccount(){
 const st=await sessionIdentity();
 return st.linked?{user:st.user,profile:st.profile}:null;
}
async function countryAccess(countryId){
 const account=await mfdcoAccount();
 if(!account)return {account:null,role:null,canEdit:false,canManage:false};
 const r=await role(countryId);
 return {
  account,
  role:r,
  canEdit:["owner","admin","editor"].includes(r),
  canManage:["owner","admin"].includes(r)
 };
}
async function requireCountryAccess(countryId,level="edit"){
 const a=await countryAccess(countryId);
 const ok=level==="manage"?a.canManage:level==="view"?!!a.role:a.canEdit;
 return {...a,ok};
}
async function ownerProfile(countryId){
 if(!countryId)return null;
 await waitForClient(8000);
 if(!ready())return null;
 try{
  const rpc=await window.supabaseClient.rpc("mfdco_public_country_owner_profile",{p_country_id:countryId});
  if(!rpc.error){const row=Array.isArray(rpc.data)?(rpc.data[0]||null):(rpc.data||null);if(row)return row}
 }catch(e){console.warn("OWNER PROFILE RPC",e)}
 try{
  const cq=await window.supabaseClient.from("countries").select("owner_id").eq("id",countryId).maybeSingle();
  const ownerId=cq.data?.owner_id||null;
  if(!ownerId)return null;
  const pq=await window.supabaseClient.from("profiles")
   .select("id,activity_name,icon_url,fictional_country,flag_url,permanent_member")
   .eq("id",ownerId).maybeSingle();
  if(!pq.error&&pq.data)return {user_id:pq.data.id,activity_name:pq.data.activity_name||"",icon_url:pq.data.icon_url||"",fictional_country:pq.data.fictional_country||"",flag_url:pq.data.flag_url||"",permanent_member:!!pq.data.permanent_member};
  return {user_id:ownerId,activity_name:"MFDCOアカウント",icon_url:"",fictional_country:"",flag_url:"",permanent_member:false};
 }catch(e){console.warn("OWNER PROFILE FALLBACK",e);return null}
}
function coreFromCountry(c){const core=C.clone(c);for(const k of Object.keys(MAP))delete core[k];core.public=!!c.isPublic;core.schemaVersion=15;core.basic={capital:c.capital?.name||"",government:c.government?.system||""};core._index=core._index||{};const st=C.calculateStrength(c);core._index.strength=st.total;core._index.completeness=C.calculateCompleteness(c);return core}
function recordsFromCountry(c){const out=[];for(const [key,type] of Object.entries(MAP)){C.arr(c[key]).forEach((item,i)=>out.push({id:item.id||C.uid(),record_type:type,title:item.title||item.name||item.label||`${type} ${i+1}`,sort_order:i,payload:{...item,id:item.id||undefined}}))}return out}
function merge(core,records){const c=C.clone(core||{});c.isPublic=!!(core?.isPublic??core?.public);for(const k of Object.keys(MAP))c[k]=[];for(const r of records||[]){const key=reverse[r.record_type];if(key)c[key].push({...r.payload,id:r.id,title:r.payload?.title||r.title})}return C.migrate(c)}
async function saveCountry(c){
 if(!ready())throw new Error("MFDCO本体のアカウント接続が必要です");
 const account=await mfdcoAccount();
 if(!account)throw new Error("MFDCOアカウントでログインしてください");
 const u=account.user;
 const core=coreFromCountry(c),records=recordsFromCountry(c),snapshot=C.clone(c);
 const {data,error}=await window.supabaseClient.rpc("mfdco_save_country",{p_core:core,p_records:records,p_snapshot:snapshot});
 if(error)throw error;
 c.id=data||c.id;
 C.save(c);
 await L?.setCache?.(`country:${c.id}`,C.clone(c)).catch(()=>{});
 await L?.clearCountryDraft?.(c.id,"legacy-country").catch(()=>{});
 return c
}
async function loadCountry(id){
 const localFallback=async()=>{
  const cached=await L?.getCache?.(`country:${id}`,null).catch(()=>null);
  return cached?C.migrate(cached):C.get(id);
 };
 if(!ready())return localFallback();
 try{
  const {data,error}=await window.supabaseClient.from("countries").select("id,core_data,is_public,owner_id").eq("id",id).maybeSingle();
  if(error)throw error;
  if(!data)return null;
  const rr=await window.supabaseClient.from("country_records").select("id,record_type,title,sort_order,payload").eq("country_id",id).order("record_type").order("sort_order");
  if(rr.error)throw rr.error;
  const c=merge({...data.core_data,id:data.id,isPublic:data.is_public,ownerId:data.owner_id||data.core_data?.ownerId||""},rr.data||[]);
  C.save(c);
  await L?.setCache?.(`country:${c.id}`,C.clone(c)).catch(()=>{});
  return c
 }catch(e){
  console.warn("CLOUD LOAD",e);
  return null;
 }
}
async function listCountries({mine=false,publicOnly=false}={}){
 if(!ready())return C.load();

 let q=window.supabaseClient
  .from("countries")
  .select("id,name,short_name,english_name,code,summary,is_public,tags,updated_at,population,area_km2,capital,government,strength_score,completeness_score,flag_key,cover_key,owner_id")
  .is("archived_at",null);

 // Public country listing must never wait for authentication.
 // Only resolve a user when the caller explicitly asks for "mine".
 if(mine){
  const u=await user();
  if(!u)return [];
  q=q.eq("owner_id",u.id);
 }

 if(publicOnly)q=q.eq("is_public",true);

 try{
  const {data,error}=await withTimeout(
   q.order("updated_at",{ascending:false}),
   6000,
   "country list timeout"
  );
  if(error)throw error;

  return (data||[]).map(x=>({
   id:x.id,
   name:x.name,
   shortName:x.short_name,
   englishName:x.english_name,
   code:x.code,
   summary:x.summary,
   isPublic:x.is_public,
   tags:x.tags||[],
   updatedAt:x.updated_at,
   population:x.population,
   territory:{area:x.area_km2},
   capital:{name:x.capital},
   government:{system:x.government},
   media:{flagKey:x.flag_key,coverKey:x.cover_key},
   _index:{strength:x.strength_score,completeness:x.completeness_score},
   ownerId:x.owner_id
  }));
 }catch(e){
  console.warn("COUNTRY LIST",e);
  return C.load();
 }
}
async function role(id){
 if(!ready())return null;
 const account=await mfdcoAccount();
 if(!account)return null;
 const {data,error}=await window.supabaseClient.rpc("mfdco_country_role",{p_country_id:id});
 if(error)return null;
 return data||null;
}
async function uploadMedia(country,file,slot="file"){
 const FILE_LIMIT=25*1024*1024;if(file.size>FILE_LIMIT)throw new Error("1ファイル25MiBまでです");
 if(!ready())throw new Error("MFDCO本体のアカウント接続が必要です");
 const account=await mfdcoAccount();
 if(!account)throw new Error("MFDCOアカウントでログインしてください");
 const u=account.user;
 const quota=await window.supabaseClient.rpc("mfdco_check_country_media_quota",{p_country_id:country.id,p_added_bytes:file.size,p_slot:slot});
 if(quota.error)throw quota.error;
 if(quota.data&&!quota.data.allowed){
  const mb=n=>(Number(n||0)/1024/1024).toFixed(1);
  if(quota.data.file_allowed===false)throw new Error(`1ファイル上限を超えています（上限 ${mb(quota.data.max_file_bytes)} MiB）`);
  if(Number(quota.data.projected_country)>Number(quota.data.country_limit))throw new Error(`この国家の保存容量を超えます（${mb(quota.data.projected_country)} / ${mb(quota.data.country_limit)} MiB）`);
  throw new Error(`あなたのMFDCOアカウント容量を超えます（${mb(quota.data.projected_account)} / ${mb(quota.data.account_limit)} MiB）`);
 }
 const old=await window.supabaseClient.from("country_media").select("id,storage_path").eq("country_id",country.id).eq("slot",slot);
 const ext=(file.name.split(".").pop()||"bin").replace(/[^a-z0-9]/gi,"");const path=`${country.id}/${u.id}/${Date.now()}_${C.uid()}.${ext}`;
 const up=await window.supabaseClient.storage.from("country-media").upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;
 const ins=await window.supabaseClient.from("country_media").insert({country_id:country.id,uploader_id:u.id,storage_path:path,slot,kind:file.type.startsWith("audio/")?"audio":file.type.startsWith("image/")?"image":"file",mime_type:file.type,original_name:file.name,size_bytes:file.size}).select("id").single();
 if(ins.error){await window.supabaseClient.storage.from("country-media").remove([path]);throw ins.error}
 const stale=(old.data||[]).filter(x=>x.id!==ins.data?.id);if(stale.length){await window.supabaseClient.from("country_media").delete().in("id",stale.map(x=>x.id));await window.supabaseClient.storage.from("country-media").remove(stale.map(x=>x.storage_path))}
 return `storage:${path}`
}
async function resolveMedia(key,expires=3600){
 if(!key)return "";
 if(key.startsWith("idbfile:"))return L?.fileUrl?await L.fileUrl(key):"";
 if(!key.startsWith("storage:"))return C.mediaUrl(key);
 if(!ready())return "";
 const path=key.slice(8);
 const {data,error}=await window.supabaseClient.storage.from("country-media").createSignedUrl(path,expires);
 return error?"":data?.signedUrl||""
}
async function notifications(){if(!ready())return [];const {data,error}=await window.supabaseClient.from("country_notifications").select("*").order("created_at",{ascending:false}).limit(100);return error?[]:data||[]}
async function markNotification(id){if(!ready())return;await window.supabaseClient.from("country_notifications").update({read_at:new Date().toISOString()}).eq("id",id)}
async function relations(countryId){if(!ready())return C.get(countryId).relations||[];const {data,error}=await window.supabaseClient.from("country_relations").select("*").or(`country_a_id.eq.${countryId},country_b_id.eq.${countryId}`).order("started_at",{ascending:false});return error?[]:data||[]}
async function proposals(countryId){if(!ready())return [];const {data,error}=await window.supabaseClient.from("country_proposals").select("*").or(`source_country_id.eq.${countryId},target_country_id.eq.${countryId}`).order("created_at",{ascending:false});return error?[]:data||[]}
async function createProposal(obj){if(!ready())throw new Error("外交提案の本番処理にはSupabase接続が必要です");const u=await user();if(!u)throw new Error("ログインが必要です");const {data,error}=await window.supabaseClient.from("country_proposals").insert({...obj,proposed_by:u.id}).select().single();if(error)throw error;return data}
async function respondProposal(id,status){const {data,error}=await window.supabaseClient.rpc("mfdco_respond_country_proposal",{p_proposal_id:id,p_status:status});if(error)throw error;return data}


async function editableCountryChoices({manageOnly=false}={}){
 if(!ready())return [];
 const account=await mfdcoAccount();if(!account)return [];
 const u=account.user;
 const owned=await window.supabaseClient.from("countries").select("id,name,code,flag_key").eq("owner_id",u.id).is("archived_at",null);
 const roles=manageOnly?["owner","admin"]:["owner","admin","editor"];
 const mem=await window.supabaseClient.from("country_members").select("country_id,role").eq("user_id",u.id).in("role",roles);
 const ids=[...(owned.data||[]).map(x=>x.id),...(mem.data||[]).map(x=>x.country_id)];
 if(!ids.length)return [];
 const q=await window.supabaseClient.from("countries").select("id,name,code,flag_key").in("id",[...new Set(ids)]).is("archived_at",null).order("name");
 const rows=q.error?(owned.data||[]):q.data||[];
 return rows.map(x=>({id:x.id,name:x.name,code:x.code||"",flagKey:x.flag_key||""}));
}
async function myCountryAccess(){
 if(!ready())return [];
 const account=await mfdcoAccount();if(!account)return [];
 const u=account.user;
 const byId=new Map();

 const normalize=x=>({
  id:x.id,
  name:x.name||"",
  shortName:x.short_name||"",
  code:x.code||"",
  summary:x.summary||"",
  isPublic:!!x.is_public,
  updatedAt:x.updated_at||null,
  flagKey:x.flag_key||"",
  coverKey:x.cover_key||"",
  strengthScore:Number(x.strength_score)||0,
  completenessScore:Number(x.completeness_score)||0,
  role:x.role||"viewer",
  displayRole:x.display_role||"",
  canEdit:!!x.can_edit,
  canManage:!!x.can_manage
 });

 // Shared/owner access from the canonical RPC.
 try{
  const {data,error}=await window.supabaseClient.rpc("mfdco_my_country_access");
  if(error)console.warn("MY COUNTRY ACCESS RPC",error);
  else for(const x of data||[])byId.set(x.id,normalize(x));
 }catch(e){console.warn("MY COUNTRY ACCESS RPC",e)}

 // Ownership is canonical in countries.owner_id.
 // Always merge it directly so an old/missing country_members owner mirror
 // can never hide an owned country from the dashboard.
 try{
  const {data,error}=await window.supabaseClient
   .from("countries")
   .select("id,name,short_name,code,summary,is_public,updated_at,flag_key,cover_key,strength_score,completeness_score,owner_id")
   .eq("owner_id",u.id)
   .is("archived_at",null)
   .order("updated_at",{ascending:false});
  if(error)console.warn("MY OWNED COUNTRIES",error);
  else for(const x of data||[]){
   byId.set(x.id,normalize({
    ...x,
    role:"owner",
    display_role:"所有者",
    can_edit:true,
    can_manage:true
   }));
  }
 }catch(e){console.warn("MY OWNED COUNTRIES",e)}

 const rank={owner:0,admin:1,editor:2,viewer:3};
 return [...byId.values()].sort((a,b)=>
  (rank[a.role]??9)-(rank[b.role]??9) ||
  String(b.updatedAt||"").localeCompare(String(a.updatedAt||""))
 );
}
async function accountStorageUsage(){
 if(!ready()||!(await mfdcoAccount()))return null;
 const {data,error}=await window.supabaseClient.rpc("mfdco_account_storage_usage");
 if(error){console.warn("ACCOUNT STORAGE",error);return null}
 return data||null;
}
async function countryStorageUsage(countryId){
 if(!ready()||!(await user())||!countryId)return null;
 const {data,error}=await window.supabaseClient.rpc("mfdco_country_storage_usage",{p_country_id:countryId});
 if(error){console.warn("COUNTRY STORAGE",error);return null}
 return data||null;
}
async function publicWorksForAdoption(query="",limit=250){
 if(!ready())return [];
 try{
  const rpc=await window.supabaseClient.rpc("mfdco_public_works_for_adoption",{p_query:String(query||""),p_limit:Math.min(500,Math.max(1,Number(limit)||250))});
  if(!rpc.error&&Array.isArray(rpc.data))return rpc.data.map(x=>x.payload||x).filter(Boolean);
 }catch(e){console.warn("ADOPTION WORK RPC",e)}
 try{
  const {data,error}=await window.supabaseClient.from("works").select("id,title,image_url,tags,description,submission_type,download_access,status,created_at").eq("status","approved").order("created_at",{ascending:false}).limit(Math.min(500,Math.max(1,Number(limit)||250)));
  if(error)throw error;return data||[];
 }catch(e){console.warn("ADOPTION WORK FALLBACK",e);throw e}
}
async function usageRequests(countryId){if(!ready())return [];const {data,error}=await window.supabaseClient.from("country_usage_requests").select("*").eq("country_id",countryId).order("created_at",{ascending:false});return error?[]:data||[]}
async function createUsageRequest(obj){if(!ready())throw new Error("利用申請にはSupabase接続が必要です");const u=await user();if(!u)throw new Error("ログインが必要です");const {data,error}=await window.supabaseClient.from("country_usage_requests").insert({...obj,requester_id:u.id}).select().single();if(error)throw error;return data}
async function respondUsageRequest(id,status){if(!ready())throw new Error("Supabase接続が必要です");const {data,error}=await window.supabaseClient.rpc("mfdco_respond_country_usage_request",{p_request_id:id,p_status:status});if(error)throw error;return data}
async function versions(countryId){if(!ready())return [];const {data,error}=await window.supabaseClient.from("country_versions").select("id,created_at,created_by").eq("country_id",countryId).order("created_at",{ascending:false}).limit(30);return error?[]:data||[]}
async function mergeV20MarketEntities(rows){
 if(!ready()||!Array.isArray(rows)||!rows.length)return rows||[];
 try{
  const ids=rows.map(x=>x.id).filter(Boolean);
  if(!ids.length)return rows;
  const q=await window.supabaseClient.from("country_entities")
   .select("id,country_id,name,payload")
   .in("country_id",ids)
   .eq("entity_type","company_profile")
   .eq("status","official")
   .eq("visibility","public");
  if(q.error)return rows;
  const by=new Map(rows.map(x=>[x.id,x]));
  for(const r of q.data||[]){
   const c=by.get(r.country_id);if(!c)continue;
   const p=r.payload||{};
   const item={id:r.id,name:r.name,type:p.sector||"",stockTicker:p.stockTicker||"",baseStockPrice:Number(p.baseStockPrice)||0,revenue:Number(p.revenue)||0,netProfit:Number(p.profit)||0,marketCap:Number(p.marketCap)||0,stateShare:Number(p.stateShare)||0,productionTags:p.productionTags||"",dependencyTags:p.dependencyTags||"",summary:p.summary||""};
   c.companies=C.arr(c.companies).filter(x=>x.id!==r.id&&x.name!==r.name);
   c.companies.push(item);
  }
 }catch(e){console.warn("V20 market entity bridge",e)}
 return rows;
}
async function marketSnapshots(){
 if(!ready())return C.load().filter(x=>x.isPublic);
 try{
  const rpc=await window.supabaseClient.rpc("mfdco_public_market_snapshots");
  if(!rpc.error&&Array.isArray(rpc.data)){
   const rows=rpc.data.map(x=>C.migrate(x.payload||{id:x.id,name:x.name,isPublic:true}));
   return mergeV20MarketEntities(rows);
  }
 }catch(e){console.warn("MARKET RPC fallback",e)}
 try{
  const {data,error}=await window.supabaseClient.from("countries").select("id,name,short_name,is_public,core_data").eq("is_public",true).is("archived_at",null).limit(250);if(error)throw error;
  const rows=(data||[]).map(x=>C.migrate({...x.core_data,id:x.id,name:x.name,shortName:x.short_name,isPublic:x.is_public})),ids=rows.map(x=>x.id);
  if(ids.length){const rr=await window.supabaseClient.from("country_records").select("country_id,record_type,payload,id").in("country_id",ids).in("record_type",["company","market_dependency","port","resource_reserve"]);if(!rr.error){const by=new Map(rows.map(x=>[x.id,x]));for(const r of rr.data||[]){const c=by.get(r.country_id);if(!c)continue;const item={...r.payload,id:r.id};if(r.record_type==="company")c.companies.push(item);if(r.record_type==="market_dependency")c.marketDependencies.push(item);if(r.record_type==="port")c.ports.push(item);if(r.record_type==="resource_reserve")c.resourceReserves.push(item)}}}
  return mergeV20MarketEntities(rows)
 }catch(e){console.warn("MARKET SNAPSHOTS fallback",e);return C.load().filter(x=>x.isPublic)}
}
const PREF_KEY="mfdco_country_preferences_v15";
function localPrefs(){try{return JSON.parse(localStorage.getItem(PREF_KEY)||"{}")||{}}catch{return {}}}
function isMissingPreferencesTableError(error){
 const code=String(error?.code||"");
 const msg=String(error?.message||error||"").toLowerCase();
 return code==="PGRST205" ||
        code==="42P01" ||
        (msg.includes("country_user_preferences") &&
         (msg.includes("schema cache") || msg.includes("does not exist")));
}
async function getCountryPreferences(){
 const u=await user();
 if(!ready()||!u)return localPrefs();
 try{
  const {data,error}=await window.supabaseClient
   .from("country_user_preferences")
   .select("main_country_id,active_country_id")
   .eq("user_id",u.id)
   .maybeSingle();

  if(error){
   if(isMissingPreferencesTableError(error)){
    console.warn("COUNTRY PREFS: DB table missing; using local preferences until DB hotfix is applied.");
    return localPrefs();
   }
   console.warn("COUNTRY PREFS READ",error);
   return localPrefs();
  }

  const p={
   mainCountryId:data?.main_country_id||"",
   activeCountryId:data?.active_country_id||""
  };
  localStorage.setItem(PREF_KEY,JSON.stringify(p));
  return p;
 }catch(e){
  console.warn("COUNTRY PREFS READ",e);
  return localPrefs();
 }
}
async function setCountryPreferences(patch){
 const cur={...localPrefs(),...patch};
 localStorage.setItem(PREF_KEY,JSON.stringify(cur));

 const u=await user();
 if(ready()&&u){
  const row={
   user_id:u.id,
   main_country_id:cur.mainCountryId||null,
   active_country_id:cur.activeCountryId||null,
   updated_at:new Date().toISOString()
  };

  try{
   const {error}=await window.supabaseClient
    .from("country_user_preferences")
    .upsert(row,{onConflict:"user_id"});

   if(error){
    if(isMissingPreferencesTableError(error)){
     console.warn("COUNTRY PREFS: DB table missing; preference was kept locally.");
     return cur;
    }
    throw error;
   }
  }catch(e){
   if(isMissingPreferencesTableError(e)){
    console.warn("COUNTRY PREFS: DB table missing; preference was kept locally.");
    return cur;
   }
   throw e;
  }
 }
 return cur;
}
async function recordMarketSnapshot(country,state,worldAverage=null){if(!country?.id||!state?.enabled)return;
 if(!ready()){const key="mfdco_market_history_v17_3",rows=JSON.parse(localStorage.getItem(key)||"[]"),hour=new Date().toISOString().slice(0,13)+":00:00Z",row={country_id:country.id,captured_hour:hour,market_date:state.date,market_month:state.month,market_hour:state.hour,change_pct:state.pct,fx_value:state.fx,stock_value:state.stock,world_average_pct:worldAverage,themes:{version:"hourly-v17.3",regime:state.regime||state.theme}};const i=rows.findIndex(x=>x.country_id===country.id&&x.captured_hour===hour);if(i>=0)rows[i]=row;else rows.push(row);localStorage.setItem(key,JSON.stringify(rows.slice(-5000)));return}
 const u=await user();if(!u)return;const row={country_id:country.id,captured_hour:new Date().toISOString().slice(0,13)+":00:00Z",market_date:state.date,market_month:state.month,market_hour:state.hour,change_pct:state.pct,fx_value:state.fx,stock_value:state.stock,world_average_pct:worldAverage,themes:{version:"hourly-v17.3",regime:state.regime||state.theme},recorded_by:u.id};await window.supabaseClient.from("country_market_history").upsert(row,{onConflict:"country_id,captured_hour"})}
async function marketHistory(countryId=null,limit=1000){if(!ready()){const rows=JSON.parse(localStorage.getItem("mfdco_market_history_v17_3")||"[]").filter(x=>!countryId||x.country_id===countryId);return rows.sort((a,b)=>String(b.captured_hour).localeCompare(String(a.captured_hour))).slice(0,limit)};let q=window.supabaseClient.from("country_market_history").select("*").order("captured_hour",{ascending:false}).limit(limit);if(countryId)q=q.eq("country_id",countryId);const {data,error}=await q;return error?[]:data||[]}

async function backfillMarketHistory(rows){
 if(!ready()||!Array.isArray(rows)||!rows.length)return 0;
 const u=await user();if(!u)return 0;
 let inserted=0;
 for(let i=0;i<rows.length;i+=400){
  const batch=rows.slice(i,i+400);
  const {data,error}=await window.supabaseClient.rpc("mfdco_backfill_market_history",{p_rows:batch});
  if(error)throw error;
  inserted+=Number(data||0);
 }
 return inserted;
}
async function backfillDeterministicMarket(requestedHours=72){
 if(!ready())return {inserted:0,hours:0,skipped:true};
 const u=await user();if(!u)return {inserted:0,hours:0,skipped:true};
 const X=window.MFDCOCountryV11;if(!X)return {inserted:0,hours:0,skipped:true};
 const countries=await marketSnapshots(),priority=await marketPriorityMap(),hours=Math.min(Number(requestedHours)||72,Math.max(24,Math.floor(6000/Math.max(1,countries.length)))),now=new Date(),end=new Date(Math.floor(now.getTime()/3600000)*3600000),key=`${X.hourKey(now)}:${hours}:hourly-v17.3`;
 try{if(localStorage.getItem("mfdco_market_auto_backfill_v17_3")===key)return {inserted:0,hours,skipped:true}}catch(_){ }
 const running=new Map();for(const c of countries){const f=c.advanced?.finance||{};running.set(c.id,{stock:C.num(f.baseStockIndex,0)||10000,fx:C.num(f.baseFxPerUsd,0)||null})}
 const rows=[];
 for(let i=hours-1;i>=0;i--){const at=new Date(end.getTime()-i*3600000),states=[];for(const c of countries){const pr=priority[c.id]||{},m=X.simulatedMarket(c,at,{loggedIn:false,isMain:!!pr.isMain,isActive:!!pr.isActive});if(!m.enabled)continue;const run=running.get(c.id);run.stock*=1+m.pct/100;if(run.fx)run.fx*=1+C.num(m.fxPct,0)/100;states.push({c,m:{...m,stock:run.stock,fx:run.fx}})}const average=states.length?states.reduce((a,x)=>a+x.m.pct,0)/states.length:0;for(const x of states)rows.push({country_id:x.c.id,captured_hour:at.toISOString(),market_date:x.m.date,market_month:x.m.month,market_hour:x.m.hour,change_pct:x.m.pct,fx_value:x.m.fx,stock_value:x.m.stock,world_average_pct:average,themes:{version:"hourly-v17.3",regime:{id:x.m.regime?.id,eventAt:x.m.regime?.eventAt,nextEventAt:x.m.regime?.nextEventAt,strong:x.m.regime?.strong,weak:x.m.regime?.weak}}})}
 const inserted=await backfillMarketHistory(rows);try{localStorage.setItem("mfdco_market_auto_backfill_v17_3",key)}catch(_){ }return {inserted,hours,skipped:false};
}

async function marketPriorityMap(){
 if(!ready()){const p=localPrefs(),m={};if(p.mainCountryId)m[p.mainCountryId]={isMain:true,isActive:p.activeCountryId===p.mainCountryId};if(p.activeCountryId)m[p.activeCountryId]={...(m[p.activeCountryId]||{}),isActive:true,isMain:p.mainCountryId===p.activeCountryId};return m}
 try{const {data,error}=await window.supabaseClient.rpc("mfdco_public_country_market_priorities");if(error)throw error;return Object.fromEntries((data||[]).map(x=>[x.country_id,{isMain:!!x.is_main,isActive:!!x.is_active}]))}catch(e){console.warn("MARKET PRIORITY",e);return {}}
}

window.MFDCOCountryCloud={ready,waitForClient,withTimeout,sessionIdentity,user,mfdcoAccount,countryAccess,requireCountryAccess,ownerProfile,coreFromCountry,recordsFromCountry,merge,saveCountry,loadCountry,listCountries,role,uploadMedia,resolveMedia,notifications,markNotification,relations,proposals,createProposal,respondProposal,versions,marketSnapshots,editableCountryChoices,myCountryAccess,accountStorageUsage,countryStorageUsage,publicWorksForAdoption,usageRequests,createUsageRequest,respondUsageRequest,getCountryPreferences,setCountryPreferences,recordMarketSnapshot,marketHistory,backfillMarketHistory,backfillDeterministicMarket,marketPriorityMap};
})();
