"use strict";
(function(){
 if(location.protocol==="https:"&&location.hostname==="www.mfdco.net"){
  location.replace("https://mfdco.net"+location.pathname+location.search+location.hash);
  return;
 }

 const EVENT="mfdco-country-auth";
 const CLIENT_WAIT_MS=2500;
 const AUTH_WAIT_MS=3000;
 const PROFILE_WAIT_MS=3000;

 let state={ready:false,user:null,profile:null,error:null};
 let initPromise=null;
 let listenerInstalled=false;

 const sleep=ms=>new Promise(r=>setTimeout(r,ms));

 function withTimeout(promise,ms,label){
  let timer;
  const timeout=new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(new Error(label||"timeout")),ms);
  });
  return Promise.race([Promise.resolve(promise),timeout]).finally(()=>clearTimeout(timer));
 }

 async function waitClient(timeout=CLIENT_WAIT_MS){
  const start=Date.now();
  while(!window.supabaseClient && Date.now()-start<timeout)await sleep(40);
  return window.supabaseClient||null;
 }

 async function loadProfile(user){
  if(!user||!window.supabaseClient)return null;
  try{
   const q=window.supabaseClient
    .from("profiles")
    .select("id,activity_name,icon_url,status,permanent_member,admin")
    .eq("id",user.id)
    .maybeSingle();

   const {data,error}=await withTimeout(q,PROFILE_WAIT_MS,"profile lookup timeout");
   if(error){
    console.warn("COUNTRY SESSION PROFILE",error);
    return null;
   }
   return data||null;
  }catch(e){
   console.warn("COUNTRY SESSION PROFILE",e);
   return null;
  }
 }

 function emit(){
  try{
   window.dispatchEvent(new CustomEvent(EVENT,{detail:{...state}}));
  }catch{}
 }

 async function applySession(session,error=null){
  const user=session?.user||null;
  const profile=user?await loadProfile(user):null;
  state={
   ready:true,
   user,
   profile,
   error:error?String(error?.message||error):null
  };
  emit();
  return state;
 }

 async function refresh(){
  const sb=await waitClient();

  if(!sb){
   state={
    ready:true,
    user:null,
    profile:null,
    error:"Supabase client unavailable"
   };
   emit();
   return state;
  }

  installListener(sb);

  try{
   const {data,error}=await withTimeout(
    sb.auth.getSession(),
    AUTH_WAIT_MS,
    "login session lookup timeout"
   );
   if(error)throw error;
   return await applySession(data?.session||null,null);
  }catch(e){
   // Never keep the UI in "checking" forever.
   state={
    ready:true,
    user:null,
    profile:null,
    error:e?.message||String(e)
   };
   emit();
   console.warn("COUNTRY SESSION",e);
   return state;
  }
 }

 function installListener(sb=window.supabaseClient){
  if(listenerInstalled||!sb?.auth)return;
  listenerInstalled=true;

  sb.auth.onAuthStateChange((event,session)=>{
   // Supabase recommends doing further async work outside the auth callback.
   setTimeout(()=>{
    applySession(session,null).catch(e=>{
     console.warn("COUNTRY AUTH EVENT",event,e);
    });
   },0);
  });
 }

 async function init(){
  if(initPromise)return initPromise;

  initPromise=(async()=>{
   try{
    const sb=await waitClient();
    if(sb)installListener(sb);
    await refresh();
   }catch(e){
    state={
     ready:true,
     user:null,
     profile:null,
     error:e?.message||String(e)
    };
    emit();
   }
   return state;
  })();

  return initPromise;
 }

 async function getState(force=false){
  if(force){
   // v20.7 incorrectly returned the old initPromise here.
   await refresh();
  }else if(!state.ready){
   await init();
  }
  return {...state};
 }

 window.MFDCOCountrySession={
  EVENT,
  init,
  refresh,
  getState,
  get state(){return {...state}}
 };

 // Start in background. Page rendering must not depend on this promise.
 init();

 // If the first read timed out because the browser was restoring an auth lock,
 // retry later without blocking any page UI.
 setTimeout(()=>{
  if(state.error)refresh().catch(()=>{});
 },5000);
})();
