/* MFDCO Tools v3.1 shared storage + project serialization */
(function(global){
"use strict";

const KEYS={
  code:"mfdco:code",
  lastResults:"mfdco:lastResults",
  customUnits:"mfdco:customUnits",
  ansHistory:"mfdco:ansHistory",
  variables:"mfdco:variables",
  angleMode:"mfdco:angleMode",
  currentProject:"mfdco:currentProject",
  projectLibrary:"mfdco:projectLibrary",
  backupLibrary:"mfdco:backupLibrary"
};
const PROJECT_KEYS=[
  KEYS.code,KEYS.lastResults,KEYS.customUnits,
  KEYS.ansHistory,KEYS.variables,KEYS.angleMode
];

function createLocalStorageAdapter(storage){
  const target=storage||global.localStorage;
  return {
    type:"localStorage",
    getItem(key){
      const v=target?.getItem?.(key);
      return v===undefined?null:v;
    },
    setItem(key,value){target?.setItem?.(key,String(value))},
    removeItem(key){target?.removeItem?.(key)},
    clear(){target?.clear?.()},
    keys(){
      const list=[];
      if(!target)return list;
      for(let i=0;i<target.length;i++){
        const k=target.key(i);
        if(k!==null)list.push(k);
      }
      return list;
    }
  };
}

function createMemoryAdapter(seed={}){
  const map=new Map();
  for(const [k,v] of Object.entries(seed||{})){
    if(v!==undefined&&v!==null)map.set(String(k),String(v));
  }
  return {
    type:"memory",
    getItem(key){return map.has(String(key))?map.get(String(key)):null},
    setItem(key,value){map.set(String(key),String(value))},
    removeItem(key){map.delete(String(key))},
    clear(){map.clear()},
    keys(){return [...map.keys()]},
    dump(){return Object.fromEntries(map.entries())}
  };
}

let adapter;
try{
  adapter=createLocalStorageAdapter(global.localStorage);
  const probe="__mfdco_probe__";
  adapter.setItem(probe,"1");
  adapter.removeItem(probe);
}catch(_){
  adapter=createMemoryAdapter();
}

function validateAdapter(a){
  if(!a||typeof a!=="object")throw new Error("ストレージアダプタが不正です");
  for(const name of ["getItem","setItem","removeItem"]){
    if(typeof a[name]!=="function")throw new Error(`ストレージアダプタに ${name}() がありません`);
  }
  return true;
}
function setAdapter(next){validateAdapter(next);adapter=next;return adapter}
function getAdapter(){return adapter}
function withAdapter(temp,fn){
  validateAdapter(temp);
  const prev=adapter;
  adapter=temp;
  try{return fn(temp)}
  finally{adapter=prev}
}

function rawGet(key,fallback=null){
  try{
    const v=adapter.getItem(key);
    return v===null||v===undefined?fallback:v;
  }catch(_){return fallback}
}
function rawSet(key,value){
  try{adapter.setItem(key,String(value));return true}
  catch(_){return false}
}
function mustSet(key,value){
  if(!rawSet(key,value))throw new Error(`保存に失敗しました: ${key}`);
  return true;
}
function remove(key){
  try{adapter.removeItem(key);return true}
  catch(_){return false}
}
function mustRemove(key){
  if(!remove(key))throw new Error(`削除に失敗しました: ${key}`);
  return true;
}
function getJSON(key,fallback){
  try{
    const v=adapter.getItem(key);
    return v===null||v===undefined?fallback:JSON.parse(v);
  }catch(_){return fallback}
}
function setJSON(key,value){
  try{return rawSet(key,JSON.stringify(value))}
  catch(_){return false}
}

function getCode(){return rawGet(KEYS.code,"")}
function hasCode(){return rawGet(KEYS.code,null)!==null}
function setCode(v){return rawSet(KEYS.code,v||"")}

function getAnsHistory(){
  const v=getJSON(KEYS.ansHistory,[]);
  return Array.isArray(v)?v:[];
}
function setAnsHistory(v){return setJSON(KEYS.ansHistory,Array.isArray(v)?v:[])}

function getVariables(){
  const v=getJSON(KEYS.variables,[]);
  return Array.isArray(v)?v:[];
}
function setVariables(v){return setJSON(KEYS.variables,Array.isArray(v)?v:[])}

function getAngleMode(){return rawGet(KEYS.angleMode,"DEG")==="RAD"?"RAD":"DEG"}
function setAngleMode(v){return rawSet(KEYS.angleMode,v==="RAD"?"RAD":"DEG")}

function getLastResults(){return getJSON(KEYS.lastResults,null)}
function setLastResults(v){return setJSON(KEYS.lastResults,v)}
function clearLastResults(){return remove(KEYS.lastResults)}

function getCustomUnits(){
  const v=getJSON(KEYS.customUnits,[]);
  return Array.isArray(v)?v:[];
}
function setCustomUnits(v){return setJSON(KEYS.customUnits,Array.isArray(v)?v:[])}

function collectProject(name){
  const data={};
  for(const k of PROJECT_KEYS){
    const v=rawGet(k,null);
    if(v!==null)data[k]=v;
  }
  return {
    format:"MFDCO_PROJECT",
    version:2,
    appVersion:"3.2",
    name:name||"MFDCO Project",
    savedAt:new Date().toISOString(),
    data
  };
}

function migrateProject(project){
  if(global.MFDCOProjectSchema)return global.MFDCOProjectSchema.migrate(project);
  if(!project||project.format!=="MFDCO_PROJECT"||!project.data)
    throw new Error("MFDCOプロジェクトファイルではありません");
  return {...project,version:2,appVersion:"3.2"};
}

function snapshotProjectState(){
  const data={};
  for(const k of [...PROJECT_KEYS,KEYS.currentProject]){
    data[k]=rawGet(k,null);
  }
  return data;
}
function restoreProjectState(snapshot){
  for(const k of [...PROJECT_KEYS,KEYS.currentProject]){
    const v=snapshot?.[k];
    if(v===null||v===undefined)mustRemove(k);
    else mustSet(k,v);
  }
  return true;
}

function applyProject(project){
  const p=migrateProject(project);
  for(const k of PROJECT_KEYS)mustRemove(k);
  for(const [k,v] of Object.entries(p.data)){
    if(PROJECT_KEYS.includes(k)&&typeof v==="string")mustSet(k,v);
  }
  mustSet(KEYS.currentProject,JSON.stringify({
    name:p.name||"MFDCO Project",
    savedAt:p.savedAt||new Date().toISOString()
  }));
  return p;
}

function applyProjectTransactional(project){
  // Validate/migrate before touching current state.
  const p=migrateProject(project);
  const before=snapshotProjectState();
  try{
    return applyProject(p);
  }catch(err){
    try{restoreProjectState(before)}
    catch(rollbackError){
      const e=new Error(`${err.message}\nさらにロールバックにも失敗しました: ${rollbackError.message}`);
      e.cause=err;
      throw e;
    }
    throw err;
  }
}

function getCurrentMeta(){return getJSON(KEYS.currentProject,null)}
function setCurrentMeta(v){return setJSON(KEYS.currentProject,v)}

function normalizeLibraryRecord(entry){
  if(!entry||typeof entry!=="object")return null;
  if(entry.project&&entry.project.format==="MFDCO_PROJECT"){
    return {
      name:String(entry.name||entry.project.name||"MFDCO Project"),
      savedAt:entry.savedAt||entry.project.savedAt||new Date(0).toISOString(),
      project:entry.project
    };
  }
  if(entry.format==="MFDCO_PROJECT"){
    return {
      name:String(entry.name||"MFDCO Project"),
      savedAt:entry.savedAt||new Date(0).toISOString(),
      project:entry
    };
  }
  return null;
}

function getProjectLibrary(){
  const v=getJSON(KEYS.projectLibrary,[]);
  if(!Array.isArray(v))return [];
  return v.map(normalizeLibraryRecord).filter(Boolean);
}
function setProjectLibrary(v){
  const clean=(Array.isArray(v)?v:[]).map(normalizeLibraryRecord).filter(Boolean);
  return setJSON(KEYS.projectLibrary,clean);
}

function saveProjectToLibrary(name){
  const project=collectProject(name);
  const record={name:project.name,savedAt:project.savedAt,project};
  const lib=getProjectLibrary().filter(x=>x.name!==record.name);
  lib.unshift(record);
  if(!setProjectLibrary(lib.slice(0,20)))throw new Error("プロジェクト一覧の保存に失敗しました");
  if(!setCurrentMeta({name:project.name,savedAt:project.savedAt}))throw new Error("現在プロジェクト情報の保存に失敗しました");
  return record;
}

function deleteProjectFromLibrary(name){
  const lib=getProjectLibrary();
  const next=lib.filter(x=>x.name!==name);
  if(next.length===lib.length)return false;
  if(!setProjectLibrary(next))throw new Error("プロジェクトの削除に失敗しました");
  return true;
}

function loadProjectFromLibrary(name){
  const record=getProjectLibrary().find(x=>x.name===name);
  if(!record)throw new Error("保存済みプロジェクトが見つかりません");
  return applyProjectTransactional(record.project);
}


function getBackupLibrary(){
  const v=getJSON(KEYS.backupLibrary,[]);
  return Array.isArray(v)?v:[];
}
function setBackupLibrary(v){
  return setJSON(KEYS.backupLibrary,Array.isArray(v)?v.slice(0,10):[]);
}
function createBackup(reason="manual"){
  const project=collectProject(getCurrentMeta()?.name||"MFDCO Project");
  const rec={
    reason:String(reason||"manual"),
    createdAt:new Date().toISOString(),
    project
  };
  const list=getBackupLibrary();
  list.unshift(rec);
  if(!setBackupLibrary(list))throw new Error("バックアップの保存に失敗しました");
  return rec;
}
function restoreLatestBackup(){
  const rec=getBackupLibrary()[0];
  if(!rec?.project)throw new Error("バックアップがありません");
  return applyProjectTransactional(rec.project);
}

function clearProjectData(){
  for(const k of PROJECT_KEYS)mustRemove(k);
  mustRemove(KEYS.currentProject);
  return true;
}

global.MFDCOStorage={
  version:"3.3",
  KEYS,PROJECT_KEYS,
  createLocalStorageAdapter,createMemoryAdapter,
  validateAdapter,setAdapter,getAdapter,withAdapter,
  rawGet,rawSet,mustSet,remove,mustRemove,getJSON,setJSON,
  getCode,hasCode,setCode,
  getAnsHistory,setAnsHistory,
  getVariables,setVariables,
  getAngleMode,setAngleMode,
  getLastResults,setLastResults,clearLastResults,
  getCustomUnits,setCustomUnits,
  collectProject,migrateProject,
  snapshotProjectState,restoreProjectState,
  applyProject,applyProjectTransactional,
  getCurrentMeta,setCurrentMeta,
  normalizeLibraryRecord,getProjectLibrary,setProjectLibrary,
  saveProjectToLibrary,deleteProjectFromLibrary,loadProjectFromLibrary,
  getBackupLibrary,setBackupLibrary,createBackup,restoreLatestBackup,
  clearProjectData
};
})(typeof window!=="undefined"?window:globalThis);
