/* MFDCO Tools v2.1 shared UI helpers */
(function(global){
"use strict";
function button(label,action,options={}){
  const b=document.createElement("button");
  b.textContent=label;
  if(options.className)b.className=options.className;
  if(options.title)b.title=options.title;
  if(options.dataset)for(const [k,v] of Object.entries(options.dataset))b.dataset[k]=v;
  b.addEventListener("click",action);
  return b;
}
function renderButtons(host,items,make){
  if(typeof host==="string")host=document.getElementById(host);
  if(!host)return;
  host.innerHTML="";
  items.forEach((item,i)=>host.appendChild(make(item,i)));
}
function chip(host,label,action,title=""){
  if(typeof host==="string")host=document.getElementById(host);
  const b=button(label,action,{className:"chip",title});
  host?.appendChild(b);return b;
}
function escapeHTML(value){
  return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
global.MFDCOUI={version:"2.4",button,renderButtons,chip,escapeHTML};
})(typeof window!=="undefined"?window:globalThis);
