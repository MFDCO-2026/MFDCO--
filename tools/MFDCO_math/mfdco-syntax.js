/* MFDCO Tools v2.7 registry-driven syntax highlighter */
(function(global){
"use strict";

function esc(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function rxEscape(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}

function vocabulary(){
  const functions=(global.MFDCOFunctions?.publicNames?.()||[]).sort((a,b)=>b.length-a.length);
  const constants=(global.MFDCOFunctions?.constants||[]).map(x=>x.name).sort((a,b)=>b.length-a.length);
  const language=(global.MFDCOLanguage?.constructs||[]);
  const keywords=language.filter(x=>x.kind==="block"||x.kind==="statement").map(x=>x.label);
  const operators=language.filter(x=>x.kind==="operator").map(x=>x.label);
  return {functions,constants,keywords:[...new Set(keywords)],operators:[...new Set(operators)]};
}

function highlight(code){
  code=String(code??"");
  const v=vocabulary();
  const funcSet=new Set(v.functions);
  const constSet=new Set(v.constants);
  const keywordSet=new Set(v.keywords);
  const wordOps=new Set(v.operators.filter(x=>/^[A-Za-z_]+$/.test(x)));

  // Tokenize without destroying string/comment content.
  let out="",i=0;
  while(i<code.length){
    const ch=code[i];

    // comment
    if(ch==="#"){
      let j=i;
      while(j<code.length&&code[j]!=="\n")j++;
      out+=`<span class="syn-comment">${esc(code.slice(i,j))}</span>`;
      i=j;continue;
    }

    // strings
    if(ch==='"'||ch==="'"){
      const q=ch;let j=i+1,escape=false;
      while(j<code.length){
        const c=code[j];
        if(escape){escape=false;j++;continue}
        if(c==="\\"){escape=true;j++;continue}
        if(c===q){j++;break}
        j++;
      }
      out+=`<span class="syn-string">${esc(code.slice(i,j))}</span>`;
      i=j;continue;
    }

    // number
    const nm=code.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if(nm){
      out+=`<span class="syn-number">${esc(nm[0])}</span>`;
      i+=nm[0].length;continue;
    }

    // identifiers / word operators
    const wm=code.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if(wm){
      const w=wm[0];let cls="";
      if(funcSet.has(w))cls="syn-function";
      else if(constSet.has(w))cls="syn-constant";
      else if(keywordSet.has(w))cls="syn-keyword";
      else if(wordOps.has(w))cls="syn-operator";
      out+=cls?`<span class="${cls}">${esc(w)}</span>`:esc(w);
      i+=w.length;continue;
    }

    // symbolic operators
    const op=v.operators.find(x=>!wordOps.has(x)&&code.startsWith(x,i));
    if(op){
      out+=`<span class="syn-operator">${esc(op)}</span>`;
      i+=op.length;continue;
    }

    out+=esc(ch);i++;
  }
  return out;
}

function apply(target,code,errorLine=null){
  if(typeof target==="string")target=document.getElementById(target);
  if(!target)return;
  const lines=String(code??"").split("\n");
  target.innerHTML=lines.map((line,idx)=>{
    const body=highlight(line)||" ";
    return errorLine===idx+1?`<span class="syn-error-line">${body}</span>`:body;
  }).join("\n");
}

function css(){
  return `
.syn-comment{color:#7d8987}
.syn-string{color:#8bd49c}
.syn-number{color:#e9d47b}
.syn-function{color:#c7a0ef}
.syn-constant{color:#72d7d0}
.syn-keyword{color:#75aaff}
.syn-operator{color:#ffae62}
.syn-error-line{display:inline-block;width:100%;background:rgba(255,80,80,.22)}
`;
}

global.MFDCOSyntax={version:"2.7",vocabulary,highlight,apply,css};
})(typeof window!=="undefined"?window:globalThis);
