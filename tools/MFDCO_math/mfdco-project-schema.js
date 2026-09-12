/* MFDCO Tools v3.2 project schema */
(function(global){
"use strict";

const CURRENT_FORMAT_VERSION=2;
const MAX_IMPORT_BYTES=2*1024*1024; // 2 MiB

const ALLOWED_KEYS=[
  "mfdco:code",
  "mfdco:lastResults",
  "mfdco:customUnits",
  "mfdco:ansHistory",
  "mfdco:variables",
  "mfdco:angleMode"
];

const JSON_KEYS=[
  "mfdco:lastResults",
  "mfdco:customUnits",
  "mfdco:ansHistory",
  "mfdco:variables"
];

function isFiniteNumber(v){return typeof v==="number"&&Number.isFinite(v)}
function pushIssue(list,path,message){list.push({path,message})}

function validateVariables(value,errors){
  if(!Array.isArray(value)){pushIssue(errors,"data.mfdco:variables","配列ではありません");return}
  value.forEach((v,i)=>{
    if(!v||typeof v!=="object"){pushIssue(errors,`variables[${i}]`,"オブジェクトではありません");return}
    if(typeof v.name!=="string")pushIssue(errors,`variables[${i}].name`,"文字列ではありません");
    if(!(typeof v.value==="string"||isFiniteNumber(v.value)))pushIssue(errors,`variables[${i}].value`,"数値または数値文字列ではありません");
    if(v.prefix!==undefined&&typeof v.prefix!=="string")pushIssue(errors,`variables[${i}].prefix`,"文字列ではありません");
    if(v.unit!==undefined&&typeof v.unit!=="string")pushIssue(errors,`variables[${i}].unit`,"文字列ではありません");
  });
}

function validateCustomUnits(value,errors){
  if(!Array.isArray(value)){pushIssue(errors,"data.mfdco:customUnits","配列ではありません");return}
  value.forEach((u,i)=>{
    if(!u||typeof u!=="object"){pushIssue(errors,`customUnits[${i}]`,"オブジェクトではありません");return}
    for(const k of ["id","name","symbol","cat"]){
      if(typeof u[k]!=="string"||!u[k].trim())pushIssue(errors,`customUnits[${i}].${k}`,"空でない文字列が必要です");
    }
    if(!isFiniteNumber(Number(u.factor))||Number(u.factor)<=0)pushIssue(errors,`customUnits[${i}].factor`,"正の有限数が必要です");
    if(u.prefix!==undefined&&typeof u.prefix!=="boolean")pushIssue(errors,`customUnits[${i}].prefix`,"真偽値ではありません");
  });
}

function validateAns(value,errors){
  if(!Array.isArray(value)){pushIssue(errors,"data.mfdco:ansHistory","配列ではありません");return}
  value.forEach((a,i)=>{
    if(!a||typeof a!=="object"){pushIssue(errors,`ansHistory[${i}]`,"オブジェクトではありません");return}
    if(!isFiniteNumber(Number(a.value)))pushIssue(errors,`ansHistory[${i}].value`,"有限数ではありません");
    if(a.expression!==undefined&&typeof a.expression!=="string")pushIssue(errors,`ansHistory[${i}].expression`,"文字列ではありません");
  });
}

function validateResults(value,errors){
  if(value===null)return;
  if(!value||typeof value!=="object"){pushIssue(errors,"data.mfdco:lastResults","オブジェクトではありません");return}
  if(value.logs!==undefined&&!Array.isArray(value.logs))pushIssue(errors,"lastResults.logs","配列ではありません");
  if(Array.isArray(value.logs)){
    value.logs.forEach((x,i)=>{if(typeof x!=="string")pushIssue(errors,`lastResults.logs[${i}]`,"文字列ではありません")});
  }
  if(value.plots!==undefined&&!Array.isArray(value.plots))pushIssue(errors,"lastResults.plots","配列ではありません");
  if(Array.isArray(value.plots)){
    value.plots.forEach((p,i)=>{
      if(!p||typeof p!=="object"){pushIssue(errors,`lastResults.plots[${i}]`,"オブジェクトではありません");return}
      if(p.variable!==undefined&&typeof p.variable!=="string")pushIssue(errors,`lastResults.plots[${i}].variable`,"文字列ではありません");
      if(p.expressions!==undefined&&(!Array.isArray(p.expressions)||!p.expressions.every(x=>typeof x==="string")))
        pushIssue(errors,`lastResults.plots[${i}].expressions`,"文字列配列ではありません");
      if(p.resampleable!==undefined&&typeof p.resampleable!=="boolean")
        pushIssue(errors,`lastResults.plots[${i}].resampleable`,"真偽値ではありません");
      if(p.varsSnapshot!==undefined&&(typeof p.varsSnapshot!=="object"||Array.isArray(p.varsSnapshot)))
        pushIssue(errors,`lastResults.plots[${i}].varsSnapshot`,"オブジェクトではありません");
      if(p.series!==undefined&&!Array.isArray(p.series))pushIssue(errors,`lastResults.plots[${i}].series`,"配列ではありません");
      if(Array.isArray(p.series)){
        p.series.forEach((s,si)=>{
          if(!s||typeof s!=="object"){pushIssue(errors,`lastResults.plots[${i}].series[${si}]`,"オブジェクトではありません");return}
          if(s.expr!==undefined&&typeof s.expr!=="string")pushIssue(errors,`lastResults.plots[${i}].series[${si}].expr`,"文字列ではありません");
          if(s.label!==undefined&&typeof s.label!=="string")pushIssue(errors,`lastResults.plots[${i}].series[${si}].label`,"文字列ではありません");
          if(s.points!==undefined&&!Array.isArray(s.points))pushIssue(errors,`lastResults.plots[${i}].series[${si}].points`,"配列ではありません");
          if(Array.isArray(s.points)){
            s.points.forEach((pt,pi)=>{
              const ok=Array.isArray(pt)&&pt.length>=2&&
                Number.isFinite(Number(pt[0]))&&(pt[1]===null||Number.isFinite(Number(pt[1])));
              if(!ok)pushIssue(errors,`lastResults.plots[${i}].series[${si}].points[${pi}]`,"[x,y] 形式ではありません");
            });
          }
        });
      }
      if(p.xmin!==undefined&&!isFiniteNumber(Number(p.xmin)))pushIssue(errors,`lastResults.plots[${i}].xmin`,"有限数ではありません");
      if(p.xmax!==undefined&&!isFiniteNumber(Number(p.xmax)))pushIssue(errors,`lastResults.plots[${i}].xmax`,"有限数ではありません");
      if(p.xmin!==undefined&&p.xmax!==undefined&&Number(p.xmin)>=Number(p.xmax))
        pushIssue(errors,`lastResults.plots[${i}]`,"xmin は xmax より小さくする必要があります");
    });
  }
}

function validate(project){
  const errors=[],warnings=[];
  if(!project||typeof project!=="object"){
    pushIssue(errors,"project","オブジェクトではありません");
    return {ok:false,errors,warnings};
  }
  if(project.format!=="MFDCO_PROJECT")pushIssue(errors,"format","MFDCO_PROJECT ではありません");
  if(!Number.isInteger(project.version))pushIssue(errors,"version","整数ではありません");
  if(!project.name||typeof project.name!=="string")warnings.push({path:"name",message:"プロジェクト名がありません"});
  if(!project.data||typeof project.data!=="object"||Array.isArray(project.data)){
    pushIssue(errors,"data","オブジェクトではありません");
    return {ok:false,errors,warnings};
  }

  for(const [k,v] of Object.entries(project.data)){
    if(!ALLOWED_KEYS.includes(k)){warnings.push({path:`data.${k}`,message:"未対応キーです"});continue}
    if(typeof v!=="string"){pushIssue(errors,`data.${k}`,"保存値は文字列である必要があります");continue}
    if(k==="mfdco:angleMode"&&!["DEG","RAD"].includes(v))pushIssue(errors,`data.${k}`,"DEG または RAD が必要です");
    if(JSON_KEYS.includes(k)){
      try{
        const parsed=JSON.parse(v);
        if(k==="mfdco:variables")validateVariables(parsed,errors);
        if(k==="mfdco:customUnits")validateCustomUnits(parsed,errors);
        if(k==="mfdco:ansHistory")validateAns(parsed,errors);
        if(k==="mfdco:lastResults")validateResults(parsed,errors);
      }catch(_){
        pushIssue(errors,`data.${k}`,"JSONとして解析できません");
      }
    }
  }
  return {ok:errors.length===0,errors,warnings};
}

function migrate(project){
  if(!project||typeof project!=="object")throw new Error("プロジェクト形式が不正です");
  let p=JSON.parse(JSON.stringify(project));
  if(p.format!=="MFDCO_PROJECT")throw new Error("MFDCOプロジェクトファイルではありません");

  if(p.version===1){
    p.version=2;
  }
  if(p.version!==2)throw new Error(`未対応のプロジェクト形式バージョンです: ${p.version}`);

  const clean={};
  for(const k of ALLOWED_KEYS){
    if(typeof p.data?.[k]==="string")clean[k]=p.data[k];
  }
  p.data=clean;
  p.name=typeof p.name==="string"&&p.name.trim()?p.name.trim():"MFDCO Project";
  p.savedAt=p.savedAt||new Date().toISOString();
  p.appVersion="3.2";

  const result=validate(p);
  if(!result.ok){
    throw new Error("プロジェクト内容が不正です:\n"+result.errors.map(x=>`${x.path}: ${x.message}`).join("\n"));
  }
  return p;
}

function assertImportSize(size){
  if(!Number.isFinite(size)||size<0)throw new Error("ファイルサイズを確認できません");
  if(size>MAX_IMPORT_BYTES)throw new Error(`プロジェクトファイルが大きすぎます。上限は ${Math.round(MAX_IMPORT_BYTES/1024/1024)} MiB です`);
  return true;
}

global.MFDCOProjectSchema={
  version:"3.5",
  CURRENT_FORMAT_VERSION,
  MAX_IMPORT_BYTES,
  ALLOWED_KEYS,
  JSON_KEYS,
  validate,
  migrate,
  assertImportSize
};
})(typeof window!=="undefined"?window:globalThis);
