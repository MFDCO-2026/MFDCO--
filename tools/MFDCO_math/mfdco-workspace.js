/* MFDCO Tools v3.2.2 shared code/result workspace */
(function(global){
"use strict";

const VERSION="3.3";
const EVENT_NAME="mfdco-workspace-change";
const STATUS_EVENT="mfdco-workspace-status";
const PORTABLE_PREFIX="MFDCO_WORKSPACE::";
const CHANNEL_NAME="MFDCO_TOOLS_WORKSPACE_V1";
const TAB_ID=`tab:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,10)}`;

const DEFAULT_CODE=`# MFDCO Code
# 関数電卓とコード画面で同じコードを共有します。
# Ctrl + Enter で実行

a = 3
b = 4
c = sqrt(a^2 + b^2)

print("斜辺", c)
result = c`;

let seq=0;
let channel=null;
let channelReady=false;
const subscribers=new Set();

let state={
  dirty:false,lastSavedAt:null,lastChangeAt:null,lastSource:null,
  autosave:false
};
let live={
  code:undefined,results:undefined,variables:undefined,
  codeRevision:0,resultRevision:0,variableRevision:0,lastPeerAt:null
};
let history={undo:[],redo:[],limit:100,applying:false};

function nowRevision(){
  seq=(seq+1)%1000000;
  return Date.now()*1000000+seq;
}
function safeParse(s,fallback=null){try{return JSON.parse(s)}catch(_){return fallback}}
function normalizeResults(value){
  if(!value||typeof value!=="object")return null;
  return {
    savedAt:value.savedAt||new Date().toISOString(),
    logs:Array.isArray(value.logs)?value.logs.map(String):[],
    plots:Array.isArray(value.plots)?value.plots:[]
  };
}
function readPortable(){
  try{
    const n=String(global.name||"");
    if(!n.startsWith(PORTABLE_PREFIX))return null;
    const p=safeParse(n.slice(PORTABLE_PREFIX.length),null);
    return p&&typeof p==="object"?p:null;
  }catch(_){return null}
}
function writePortable(patch={}){
  try{
    const old=readPortable()||{
      version:VERSION,code:undefined,results:undefined,variables:undefined,
      codeRevision:0,resultRevision:0,variableRevision:0,status:{...state}
    };
    const next={...old,...patch,version:VERSION};
    if(patch.status===undefined)next.status={...state};
    global.name=PORTABLE_PREFIX+JSON.stringify(next);
    return next;
  }catch(_){return null}
}
function hydrate(){
  const p=readPortable();
  if(!p)return;
  if(typeof p.code==="string"){live.code=p.code;live.codeRevision=Number(p.codeRevision)||0}
  if(Object.prototype.hasOwnProperty.call(p,"results")){
    live.results=normalizeResults(p.results);
    live.resultRevision=Number(p.resultRevision)||0;
  }
  if(Array.isArray(p.variables)){
    live.variables=p.variables;
    live.variableRevision=Number(p.variableRevision)||0;
  }
  if(p.status&&typeof p.status==="object"){
    state={
      dirty:!!p.status.dirty,
      lastSavedAt:p.status.lastSavedAt||null,
      lastChangeAt:p.status.lastChangeAt||null,
      lastSource:p.status.lastSource||null,
      autosave:!!p.status.autosave
    };
  }
}
hydrate();

function notify(type,value,source){
  try{global.dispatchEvent?.(new CustomEvent(EVENT_NAME,{detail:{type,value,source}}))}catch(_){}
  for(const fn of subscribers){try{fn({type,value,source})}catch(_){}}
}
function emitStatus(){
  writePortable({status:{...state}});
  try{global.dispatchEvent?.(new CustomEvent(STATUS_EVENT,{detail:{...state}}))}catch(_){}
}
function markDirty(source="workspace"){
  state={...state,dirty:true,lastChangeAt:new Date().toISOString(),lastSource:source};
  emitStatus();
}
function markSaved(){
  state={...state,dirty:false,lastSavedAt:new Date().toISOString()};
  emitStatus();
}
function setAutosave(enabled){
  state={...state,autosave:!!enabled};
  emitStatus();
  return state.autosave;
}
function getAutosave(){return !!state.autosave}
function getStatus(){return {...state}}

function broadcast(message){
  if(!channelReady||!channel)return false;
  try{channel.postMessage({...message,from:TAB_ID,workspaceVersion:VERSION});return true}
  catch(_){return false}
}
function mirrorCode(code,revision=0){
  live.code=String(code??"");
  live.codeRevision=Math.max(Number(revision)||0,live.codeRevision||0);
  global.MFDCOStorage?.setCode?.(live.code);
  writePortable({code:live.code,codeRevision:live.codeRevision});
}
function mirrorResults(results,revision=0){
  live.results=normalizeResults(results);
  live.resultRevision=Math.max(Number(revision)||0,live.resultRevision||0);
  if(live.results)global.MFDCOStorage?.setLastResults?.(live.results);
  else global.MFDCOStorage?.clearLastResults?.();
  writePortable({results:live.results,resultRevision:live.resultRevision});
}
function normalizeVariables(rows){
  if(!Array.isArray(rows))return [];
  return rows.map(r=>({
    name:String(r?.name??""),
    value:String(r?.value??""),
    prefix:String(r?.prefix??""),
    unit:String(r?.unit??"")
  }));
}
function mirrorVariables(rows,revision=0){
  live.variables=normalizeVariables(rows);
  live.variableRevision=Math.max(Number(revision)||0,live.variableRevision||0);
  global.MFDCOStorage?.setVariables?.(live.variables);
  writePortable({variables:live.variables,variableRevision:live.variableRevision});
}
function getVariables(){
  if(Array.isArray(live.variables))return normalizeVariables(live.variables);
  const p=readPortable();
  if(p&&Array.isArray(p.variables)){
    mirrorVariables(p.variables,Number(p.variableRevision)||0);
    return normalizeVariables(live.variables);
  }
  const local=global.MFDCOStorage?.getVariables?.();
  if(Array.isArray(local)){
    mirrorVariables(local,0);
    return normalizeVariables(local);
  }
  return [];
}
function setVariables(rows,source="workspace"){
  const value=normalizeVariables(rows);
  const revision=nowRevision();
  mirrorVariables(value,revision);
  markDirty(source);
  broadcast({type:"variables-update",variables:value,revision});
  notify("variables",value,source);
  return value;
}

function shouldAcceptSnapshot(code,revision){
  const incoming=String(code??"");
  const rev=Number(revision)||0;
  if(rev>live.codeRevision)return true;
  if(rev<live.codeRevision)return false;
  const current=typeof live.code==="string"?live.code:"";
  if(!current&&incoming)return true;
  if(current&&!incoming)return false;
  return incoming.length>current.length;
}
function handleChannelMessage(e){
  const msg=e?.data;
  if(!msg||msg.from===TAB_ID)return;
  live.lastPeerAt=Date.now();

  if(msg.type==="request-state"){
    broadcast({
      type:"state",to:msg.from,
      code:typeof live.code==="string"?live.code:getCode(DEFAULT_CODE),
      codeRevision:live.codeRevision,
      results:live.results===undefined?getResults():live.results,
      resultRevision:live.resultRevision,
      variables:Array.isArray(live.variables)?live.variables:getVariables(),
      variableRevision:live.variableRevision,
      status:getStatus()
    });
    return;
  }
  if(msg.to&&msg.to!==TAB_ID)return;

  if(msg.type==="state"){
    if(typeof msg.code==="string"&&shouldAcceptSnapshot(msg.code,msg.codeRevision)){
      mirrorCode(msg.code,msg.codeRevision);
      notify("code",live.code,"peer-state");
    }
    const rr=Number(msg.resultRevision)||0;
    if(Object.prototype.hasOwnProperty.call(msg,"results") &&
       (rr>live.resultRevision || (live.results===undefined&&msg.results!==undefined))){
      mirrorResults(msg.results,rr);
      notify("results",live.results,"peer-state");
    }
    const vr=Number(msg.variableRevision)||0;
    if(Array.isArray(msg.variables) &&
       (vr>live.variableRevision || live.variables===undefined)){
      mirrorVariables(msg.variables,vr);
      notify("variables",live.variables,"peer-state");
    }
    return;
  }

  if(msg.type==="code-update"&&typeof msg.code==="string"){
    const rev=Number(msg.revision)||0;
    if(rev>=live.codeRevision){
      mirrorCode(msg.code,rev);
      notify("code",live.code,"peer-update");
    }
    return;
  }

  if(msg.type==="results-update"){
    const rev=Number(msg.revision)||0;
    if(rev>=live.resultRevision){
      mirrorResults(msg.results,rev);
      notify("results",live.results,"peer-update");
    }
    return;
  }
  if(msg.type==="variables-update"&&Array.isArray(msg.variables)){
    const rev=Number(msg.revision)||0;
    if(rev>=live.variableRevision){
      mirrorVariables(msg.variables,rev);
      notify("variables",live.variables,"peer-update");
    }
  }
}
function openChannel(){
  if(channelReady)return true;
  if(typeof global.BroadcastChannel!=="function")return false;
  try{
    channel=new global.BroadcastChannel(CHANNEL_NAME);
    channel.onmessage=handleChannelMessage;
    channelReady=true;
    return true;
  }catch(_){channel=null;channelReady=false;return false}
}
openChannel();
function requestPeerState(){
  if(!openChannel())return false;
  return broadcast({type:"request-state"});
}

function hasCode(){
  if(typeof live.code==="string")return true;
  const p=readPortable();
  if(p&&typeof p.code==="string")return true;
  return !!global.MFDCOStorage?.hasCode?.();
}
function getCode(fallback=DEFAULT_CODE){
  if(typeof live.code==="string")return live.code;
  const p=readPortable();
  if(p&&typeof p.code==="string"){
    mirrorCode(p.code,Number(p.codeRevision)||0);
    return live.code;
  }
  if(global.MFDCOStorage?.hasCode?.()){
    mirrorCode(global.MFDCOStorage.getCode(),0);
    return live.code;
  }
  return fallback;
}
function initializeCode(defaultCode=DEFAULT_CODE){
  let code;
  if(hasCode())code=getCode(defaultCode);
  else{
    code=String(defaultCode??DEFAULT_CODE);
    mirrorCode(code,0);
  }
  requestPeerState();
  return code;
}

function pushHistory(previous){
  if(history.applying)return;
  const text=String(previous??"");
  if(history.undo.length&&history.undo[history.undo.length-1]===text)return;
  history.undo.push(text);
  if(history.undo.length>history.limit)history.undo.shift();
  history.redo.length=0;
}
function canUndo(){return history.undo.length>0}
function canRedo(){return history.redo.length>0}
function undoCode(source="undo"){
  if(!canUndo())return getCode(DEFAULT_CODE);
  const current=getCode(DEFAULT_CODE);
  const previous=history.undo.pop();
  history.redo.push(current);
  history.applying=true;
  try{
    const revision=nowRevision();
    mirrorCode(previous,revision);
    markDirty(source);
    broadcast({type:"code-update",code:previous,revision});
    notify("code",previous,source);
  }finally{history.applying=false}
  return previous;
}
function redoCode(source="redo"){
  if(!canRedo())return getCode(DEFAULT_CODE);
  const current=getCode(DEFAULT_CODE);
  const next=history.redo.pop();
  history.undo.push(current);
  history.applying=true;
  try{
    const revision=nowRevision();
    mirrorCode(next,revision);
    markDirty(source);
    broadcast({type:"code-update",code:next,revision});
    notify("code",next,source);
  }finally{history.applying=false}
  return next;
}
function clearHistory(){
  history.undo.length=0;
  history.redo.length=0;
}

function setCode(value,source="workspace"){
  const code=String(value??"");
  const previous=typeof live.code==="string"?live.code:getCode(DEFAULT_CODE);
  if(code===previous)return code;
  pushHistory(previous);
  const revision=nowRevision();
  mirrorCode(code,revision);
  markDirty(source);
  broadcast({type:"code-update",code,revision});
  notify("code",code,source);
  return code;
}
function getResults(){
  if(live.results!==undefined)return live.results;
  const p=readPortable();
  if(p&&Object.prototype.hasOwnProperty.call(p,"results")){
    mirrorResults(p.results,Number(p.resultRevision)||0);
    return live.results;
  }
  const local=normalizeResults(global.MFDCOStorage?.getLastResults?.());
  if(local)mirrorResults(local,0);
  return local;
}
function setResults(value,source="workspace"){
  const payload=normalizeResults(value)||{savedAt:new Date().toISOString(),logs:[],plots:[]};
  const revision=nowRevision();
  mirrorResults(payload,revision);
  markDirty(source);
  broadcast({type:"results-update",results:payload,revision});
  notify("results",payload,source);
  return payload;
}
function clearResults(source="workspace"){
  const revision=nowRevision();
  mirrorResults(null,revision);
  markDirty(source);
  broadcast({type:"results-update",results:null,revision});
  notify("results",null,source);
  return true;
}
function resultText(payload,emptyText="実行結果がここに表示されます。"){
  const p=normalizeResults(payload);
  if(!p||!p.logs.length)return emptyText;
  return p.logs.join("\n");
}
function syncFromPortable(){
  const p=readPortable();
  if(!p)return {code:null,results:null};
  if(typeof p.code==="string"&&shouldAcceptSnapshot(p.code,p.codeRevision))mirrorCode(p.code,p.codeRevision);
  if(Object.prototype.hasOwnProperty.call(p,"results")){
    const rr=Number(p.resultRevision)||0;
    if(rr>=live.resultRevision)mirrorResults(p.results,rr);
  }
  if(Array.isArray(p.variables)){
    const vr=Number(p.variableRevision)||0;
    if(vr>=live.variableRevision)mirrorVariables(p.variables,vr);
  }
  return {
    code:typeof live.code==="string"?live.code:null,
    results:live.results===undefined?null:live.results,
    variables:Array.isArray(live.variables)?normalizeVariables(live.variables):[]
  };
}
function subscribe(handler){
  if(typeof handler!=="function")return ()=>{};
  subscribers.add(handler);

  const storage=e=>{
    if(e.key===global.MFDCOStorage.KEYS.code){
      const code=e.newValue??"";
      if(code===live.code)return;
      const revision=nowRevision();
      mirrorCode(code,revision);
      broadcast({type:"code-update",code,revision});
      handler({type:"code",value:code,source:"storage"});
    }else if(e.key===global.MFDCOStorage.KEYS.lastResults){
      let value=null;
      try{value=e.newValue?JSON.parse(e.newValue):null}catch(_){}
      const normalized=normalizeResults(value);
      if(JSON.stringify(normalized)===JSON.stringify(live.results))return;
      const revision=nowRevision();
      mirrorResults(normalized,revision);
      broadcast({type:"results-update",results:live.results,revision});
      handler({type:"results",value:live.results,source:"storage"});
    }else if(e.key===global.MFDCOStorage.KEYS.variables){
      let rows=[];
      try{rows=e.newValue?JSON.parse(e.newValue):[]}catch(_){}
      rows=normalizeVariables(rows);
      if(JSON.stringify(rows)===JSON.stringify(live.variables))return;
      const revision=nowRevision();
      mirrorVariables(rows,revision);
      broadcast({type:"variables-update",variables:rows,revision});
      handler({type:"variables",value:rows,source:"storage"});
    }
  };
  global.addEventListener?.("storage",storage);
  setTimeout(requestPeerState,0);

  return ()=>{
    subscribers.delete(handler);
    global.removeEventListener?.("storage",storage);
  };
}
function subscribeStatus(handler){
  if(typeof handler!=="function")return ()=>{};
  const fn=e=>handler(e.detail||getStatus());
  global.addEventListener?.(STATUS_EVENT,fn);
  return ()=>global.removeEventListener?.(STATUS_EVENT,fn);
}
function createClient(label="page"){
  const source=`${label}:${TAB_ID}`;
  syncFromPortable();
  openChannel();
  return {
    source,TAB_ID,DEFAULT_CODE,
    hasCode,getCode,initializeCode,getResults,getVariables,resultText,getStatus,
    setCode:value=>setCode(value,source),
    undo:()=>undoCode(source),
    redo:()=>redoCode(source),
    canUndo,canRedo,clearHistory,
    setResults:value=>setResults(value,source),
    setVariables:value=>setVariables(value,source),
    clearResults:()=>clearResults(source),
    markSaved,setAutosave,getAutosave,requestPeerState,syncFromPortable,
    subscribe(handler){
      return subscribe(evt=>{if(evt.source!==source)handler(evt)});
    },
    subscribeStatus
  };
}

global.MFDCOWorkspace={
  version:VERSION,
  EVENT_NAME,STATUS_EVENT,PORTABLE_PREFIX,CHANNEL_NAME,TAB_ID,DEFAULT_CODE,
  readPortable,writePortable,syncFromPortable,requestPeerState,
  normalizeResults,normalizeVariables,hasCode,getCode,initializeCode,setCode,
  canUndo,canRedo,undoCode,redoCode,clearHistory,
  getResults,setResults,getVariables,setVariables,clearResults,resultText,
  markDirty,markSaved,setAutosave,getAutosave,getStatus,subscribe,subscribeStatus,createClient
};
})(typeof window!=="undefined"?window:globalThis);
