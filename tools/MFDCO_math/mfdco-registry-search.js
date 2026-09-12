/* MFDCO Tools v2.9 shared registry search */
(function(global){
"use strict";

function normalize(value){
  return String(value??"")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g," ")
    .trim();
}
function tokens(query){
  return normalize(query).split(" ").filter(Boolean);
}
function textOf(parts){
  return normalize(Array.isArray(parts)?parts.join(" "):parts);
}
function matchesText(query,parts){
  const qs=tokens(query);
  if(!qs.length)return true;
  const hay=textOf(parts);
  return qs.every(q=>hay.includes(q));
}
function entries(){
  const out=[];
  for(const f of global.MFDCOFunctions?.functions||[]){
    out.push({
      kind:"function",id:f.name,label:f.name,category:f.category,
      search:[f.name,f.category,f.syntax,f.description,f.args,f.returns,f.example,(f.candidateGroups||[]).join(" ")].join(" "),
      source:f
    });
  }
  for(const c of global.MFDCOFunctions?.constants||[]){
    out.push({
      kind:"constant",id:c.name,label:c.name,category:c.category||"定数",
      search:[c.name,c.label,c.display,c.category].join(" "),source:c
    });
  }
  for(const t of global.MFDCOTemplates?.definitions||[]){
    out.push({
      kind:"template",id:t.key,label:t.label,category:t.category,
      search:[t.key,t.label,t.category,t.level].join(" "),source:t
    });
  }
  for(const u of global.MFDCOUnits?.BUILTIN_UNITS||[]){
    out.push({
      kind:"unit",id:u.id,label:u.name,category:u.cat,
      search:[u.id,u.name,u.symbol,u.cat,global.MFDCOUnits?.categoryName?.(u.cat)||""].join(" "),source:u
    });
  }
  for(const l of global.MFDCOLanguage?.constructs||[]){
    out.push({
      kind:"language",id:l.id,label:l.label,category:l.category,
      search:[l.id,l.label,l.category,l.syntax,l.description,l.example].join(" "),source:l
    });
  }
  return out;
}
function search(query,options={}){
  const kinds=options.kinds?new Set(options.kinds):null;
  const category=options.category?normalize(options.category):"";
  const limit=Number.isFinite(options.limit)?Math.max(0,options.limit):Infinity;
  const result=[];
  for(const e of entries()){
    if(kinds&&!kinds.has(e.kind))continue;
    if(category&&!normalize(e.category).includes(category))continue;
    if(!matchesText(query,[e.search,e.label,e.id,e.category]))continue;
    result.push(e);
    if(result.length>=limit)break;
  }
  return result;
}
function filterElements(root,query,selector="button,[data-search]"){
  if(typeof root==="string")root=document.querySelector(root);
  if(!root)return 0;
  let visible=0;
  root.querySelectorAll(selector).forEach(el=>{
    const ok=matchesText(query,[el.dataset.search,el.title,el.textContent]);
    el.hidden=!ok;
    if(ok)visible++;
  });
  return visible;
}

global.MFDCORegistrySearch={
  version:"2.9",normalize,tokens,matchesText,entries,search,filterElements
};
})(typeof window!=="undefined"?window:globalThis);
