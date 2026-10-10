"use strict";
(function(){
 if(location.protocol==="https:"&&location.hostname==="www.mfdco.net"){location.replace("https://mfdco.net"+location.pathname+location.search+location.hash);return}
 const EVENT="mfdco-country-auth";
 let state={ready:false,user:null,profile:null,error:null};
 let initPromise=null;
 let listenerInstalled=false;
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 async function waitClient(timeout=8000){
  const start=Date.now();
  while(!window.supabaseClient && Date.now()-start<timeout)await sleep(40);
  return window.supabaseClient||null;
 }
 async function loadProfile(user){
  if(!user||!window.supabaseClient)return null;
  try{
   const {data,error}=await window.supabaseClient.from("profiles")
    .select("id,activity_name,icon_url,status,permanent_member,admin")
    .eq("id",user.id).maybeSingle();
   if(error){console.warn("COUNTRY SESSION PROFILE",error);return null}
   return data||null;
  }catch(e){console.warn("COUNTRY SESSION PROFILE",e);return null}
 }
 function emit(){
  try{window.dispatchEvent(new CustomEvent(EVENT,{detail:{...state}}))}catch{}
 }
 async function refresh(){
  const sb=await waitClient();
  if(!sb){state={ready:true,user:null,profile:null,error:"Supabase client unavailable"};emit();return state}
  try{
   const {data,error}=await sb.auth.getSession();
   if(error)throw error;
   const user=data?.session?.user||null;
   const profile=user?await loadProfile(user):null;
   state={ready:true,user,profile,error:null};
   emit();
   return state;
  }catch(e){
   state={ready:true,user:null,profile:null,error:e?.message||String(e)};
   emit();
   return state;
  }
 }
 function installListener(){
  if(listenerInstalled||!window.supabaseClient)return;
  listenerInstalled=true;
  window.supabaseClient.auth.onAuthStateChange(()=>setTimeout(refresh,0));
 }
 async function init(){
  if(initPromise)return initPromise;
  initPromise=(async()=>{await waitClient();await refresh();installListener();return state})();
  return initPromise;
 }
 async function getState(force=false){if(force||!state.ready)await init();return {...state}}
 window.MFDCOCountrySession={EVENT,init,refresh,getState};
 init();
})();
