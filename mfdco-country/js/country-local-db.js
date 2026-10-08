"use strict";
(function(){
const DB_NAME="mfdco-country-user-v20";
const DB_VERSION=2;
let dbPromise=null;

function open(){
 if(!("indexedDB" in window))return Promise.reject(new Error("IndexedDB is unavailable"));
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains("drafts"))db.createObjectStore("drafts",{keyPath:"key"});
   if(!db.objectStoreNames.contains("ui"))db.createObjectStore("ui",{keyPath:"key"});
   if(!db.objectStoreNames.contains("cache"))db.createObjectStore("cache",{keyPath:"key"});
   if(!db.objectStoreNames.contains("queue"))db.createObjectStore("queue",{keyPath:"id"});
   if(!db.objectStoreNames.contains("snapshots"))db.createObjectStore("snapshots",{keyPath:"key"});
   if(!db.objectStoreNames.contains("files"))db.createObjectStore("files",{keyPath:"key"});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||new Error("IndexedDB open failed"));
 });
 return dbPromise;
}

async function tx(store,mode,work){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const t=db.transaction(store,mode);
  const s=t.objectStore(store);
  let result;
  try{result=work(s)}catch(e){reject(e);return}
  t.oncomplete=()=>resolve(result);
  t.onerror=()=>reject(t.error||new Error("IndexedDB transaction failed"));
  t.onabort=()=>reject(t.error||new Error("IndexedDB transaction aborted"));
 });
}
function request(req){
 return new Promise((resolve,reject)=>{
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function get(store,key){
 const db=await open();
 const t=db.transaction(store,"readonly");
 return request(t.objectStore(store).get(key));
}
async function put(store,value){await tx(store,"readwrite",s=>s.put(value));return value}
async function del(store,key){await tx(store,"readwrite",s=>s.delete(key))}
async function all(store){
 const db=await open();
 const t=db.transaction(store,"readonly");
 return request(t.objectStore(store).getAll());
}
const draftKey=(countryId,scope="country")=>`${countryId}:${scope}`;

async function saveCountryDraft(countryId,scope,payload){
 if(!countryId)return;
 const row={key:draftKey(countryId,scope),countryId,scope,payload,savedAt:new Date().toISOString()};
 await put("drafts",row);
 return row;
}
async function getCountryDraft(countryId,scope="country"){return get("drafts",draftKey(countryId,scope))}
async function clearCountryDraft(countryId,scope="country"){return del("drafts",draftKey(countryId,scope))}
async function listCountryDrafts(countryId){
 return (await all("drafts")).filter(x=>!countryId||x.countryId===countryId);
}
async function setUI(key,value){return put("ui",{key,value,updatedAt:new Date().toISOString()})}
async function getUI(key,fallback=null){return (await get("ui",key))?.value??fallback}
async function setCache(key,value,ttlMs=0){
 return put("cache",{key,value,expiresAt:ttlMs?Date.now()+ttlMs:0,updatedAt:new Date().toISOString()})
}
async function getCache(key,fallback=null){
 const row=await get("cache",key);
 if(!row)return fallback;
 if(row.expiresAt&&row.expiresAt<Date.now()){await del("cache",key);return fallback}
 return row.value;
}
async function removeCache(key){return del("cache",key)}
async function queueChange(action){
 const id=action?.id||`q_${Date.now()}_${crypto?.randomUUID?.()||Math.random().toString(36).slice(2)}`;
 const row={id,createdAt:new Date().toISOString(),attempts:0,...action};
 await put("queue",row);return row;
}
async function queued(){return (await all("queue")).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)))}
async function removeQueued(id){return del("queue",id)}
async function saveSnapshot(countryId,label,payload){
 const key=`${countryId}:${Date.now()}:${label||"snapshot"}`;
 return put("snapshots",{key,countryId,label:label||"",payload,createdAt:new Date().toISOString()});
}
async function listSnapshots(countryId){
 return (await all("snapshots")).filter(x=>!countryId||x.countryId===countryId).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}
async function saveFile(file,slot="file",countryId=""){
 if(!file)return "";
 const id=globalThis.crypto?.randomUUID?.()||`f_${Date.now()}_${Math.random().toString(36).slice(2)}`;
 const key=`idbfile:${id}`;
 await put("files",{key,countryId,blob:file,name:file.name||"file",type:file.type||"application/octet-stream",size:file.size||0,slot,createdAt:new Date().toISOString()});
 return key;
}
async function getFile(key){return get("files",key)}
async function removeFile(key){return del("files",key)}
async function fileUrl(key){
 const row=await getFile(key);
 return row?.blob?URL.createObjectURL(row.blob):"";
}
async function estimate(){
 const storage=await navigator.storage?.estimate?.().catch(()=>null);
 const counts={};
 for(const s of ["drafts","ui","cache","queue","snapshots","files"]){
  try{counts[s]=(await all(s)).length}catch{counts[s]=0}
 }
 return {usage:storage?.usage||0,quota:storage?.quota||0,counts};
}
async function migrateLegacy(){
 const marker="mfdco-country-v20-indexeddb-migrated";
 try{
  if(localStorage.getItem(marker)==="1")return {migrated:0,skipped:true};
  let rows=[];
  for(const key of ["mfdco.countries.v11","mfdco.countries.v10","mfdco.countries.v9","mfdco.countries.v8"]){
   try{
    const x=JSON.parse(localStorage.getItem(key)||"[]");
    if(Array.isArray(x)&&x.length){rows=x;break}
   }catch{}
  }
  let n=0;
  for(const c of rows){
   if(!c?.id)continue;
   await setCache(`country:${c.id}`,c,0);
   n++;
  }
  localStorage.setItem(marker,"1");
  return {migrated:n,skipped:false};
 }catch(e){
  console.warn("IndexedDB migration skipped",e);
  return {migrated:0,skipped:true,error:String(e)};
 }
}
async function clearCountry(countryId){
 for(const row of await listCountryDrafts(countryId))await del("drafts",row.key);
 for(const row of await listSnapshots(countryId))await del("snapshots",row.key);
 await removeCache(`country:${countryId}`);
 for(const row of await all("files"))if(row.countryId===countryId)await del("files",row.key);
}

const api={open,get,put,del,all,saveCountryDraft,getCountryDraft,clearCountryDraft,listCountryDrafts,setUI,getUI,setCache,getCache,removeCache,queueChange,queued,removeQueued,saveSnapshot,listSnapshots,saveFile,getFile,removeFile,fileUrl,estimate,migrateLegacy,clearCountry};
window.MFDCOCountryLocalDB=api;
open().then(()=>migrateLegacy()).catch(e=>console.warn("MFDCO LocalDB unavailable",e));
})();
