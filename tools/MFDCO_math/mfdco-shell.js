/* MFDCO_math v3.1 shared page shell */
(function(global){
"use strict";
const MFDCO_TOOLS_LIST_URL="https://mfdco.net/tools.html";

const NAV = [
  ["files.html","ファイル","files"],
  ["calculator.html","関数電卓","calculator"],
  ["code.html","コード","code"],
  ["results.html","結果","results"],
  ["unit-converter.html","単位変換器","unit-converter"],
  ["features.html","機能一覧","features"]
];

function currentPage(){
  return (location.pathname.split("/").pop()||"index.html").replace(".html","");
}
function ensureToast(){
  let el=document.getElementById("fileToast");
  if(!el){
    el=document.createElement("div");
    el.id="fileToast";el.className="file-toast";
    document.body.appendChild(el);
  }
  return el;
}
function toast(msg){
  const el=ensureToast();
  el.textContent=msg;el.classList.add("show");
  clearTimeout(global.__mfdcoToast);
  global.__mfdcoToast=setTimeout(()=>el.classList.remove("show"),2200);
}
function downloadText(filename,text,type="text/plain;charset=utf-8"){
  const blob=new Blob([text],{type});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function saveCurrent(){
  const name=MFDCOStorage.getCurrentMeta()?.name||"MFDCO Project";
  const record=MFDCOStorage.saveProjectToLibrary(name);
  MFDCOWorkspace?.markSaved?.();updateProjectChip();toast(`保存しました: ${record.name}`);
}
function saveAs(){
  const old=MFDCOStorage.getCurrentMeta()?.name||"";
  const name=prompt("プロジェクト名を入力してください",old||"MFDCO Project");
  if(!name)return;
  const record=MFDCOStorage.saveProjectToLibrary(name.trim());
  MFDCOWorkspace?.markSaved?.();updateProjectChip();toast(`名前を付けて保存しました: ${record.name}`);
}
function exportProject(){
  const meta=MFDCOStorage.getCurrentMeta();
  const project=MFDCOStorage.collectProject(meta?.name||"MFDCO Project");
  const safe=(project.name||"MFDCO_Project").replace(/[\\/:*?"<>|]+/g,"_");
  downloadText(safe+".mfdco.json",JSON.stringify(project,null,2),"application/json");
  toast("プロジェクトをエクスポートしました");
}
function exportCode(){
  downloadText("MFDCO_code.txt",MFDCOStorage.getCode()||"");
  toast("コードをエクスポートしました");
}
function importProject(file){
  try{MFDCOProjectSchema.assertImportSize(file.size)}catch(e){alert(e.message);return}
  try{MFDCOStorage.createBackup("before-import")}catch(_){}
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const project=JSON.parse(reader.result);
      const p=MFDCOStorage.applyProjectTransactional(project);
      MFDCOWorkspace?.markSaved?.();toast(`読み込みました: ${p.name||file.name}`);
      setTimeout(()=>location.reload(),450);
    }catch(e){
      alert("読み込みに失敗しました。\n現在の作業内容は復元されています。\n"+e.message);
    }
  };
  reader.readAsText(file,"utf-8");
}
function newProject(){
  if(!confirm("現在の作業内容を消去して新規プロジェクトを作成しますか？"))return;
  try{MFDCOStorage.createBackup("before-new")}catch(_){}
  MFDCOStorage.clearProjectData();
  MFDCOWorkspace?.markSaved?.();toast("新規プロジェクトを作成しました");
  setTimeout(()=>location.reload(),350);
}

function headerHTML(){
  const cur=currentPage();
  const nav=NAV.map(([href,label,key])=>{
    if(key==="files"){
      return `<span class="file-menu-wrap">
        <button class="file-menu-trigger ${cur==="files"?"active":""}" id="fileMenuTrigger">ファイル</button>
        <div class="file-menu" id="fileMenu">
          <div class="menu-title">プロジェクト</div>
          <button data-act="save">保存</button>
          <button data-act="saveAs">名前を付けて保存</button>
          <button data-act="openManager">保存済みプロジェクト</button>
          <hr>
          <div class="menu-title">入出力</div>
          <button data-act="export">プロジェクトをエクスポート</button>
          <button data-act="import">プロジェクトを読み込み</button>
          <button data-act="exportCode">コードをTXTでエクスポート</button>
          <hr>
          <button data-act="autosave">自動保存 ON/OFF</button>
          <button data-act="restoreBackup">直前バックアップを復元</button>
          <button data-act="diagnostics">システム診断</button>
          <button class="danger" data-act="new">新規</button>
          <input id="fileProjectInput" type="file" accept=".json,.mfdco.json,application/json" hidden>
        </div>
      </span>`;
    }
    return `<a href="${href}" class="${cur===key?"active":""}">${label}</a>`;
  }).join("");
  return `<header class="site-header">
    <div class="site-brand">
      <div class="site-logo">M</div>
      <div><div class="site-title">MFDCO_math</div><div class="small">Scientific / Utility Tools</div></div>
    </div>
    <div class="site-header-right">
      <a class="mfdco-tools-list-link" href="${MFDCO_TOOLS_LIST_URL}" title="MFDCOホームページのツール一覧へ戻る">MFDCOのツール一覧を見る</a>
      <div class="project-chip" id="projectChip" title="現在のプロジェクト">MFDCO Project</div>
      <div class="workspace-status" id="workspaceStatus" title="関数電卓とコード画面はコード・結果をリアルタイム共有します">
        <span class="workspace-status-dot"></span>
        <span class="workspace-status-text">共有中</span>
      </div>
      <nav class="site-nav">${nav}</nav>
    </div>
  </header>`;
}

function updateProjectChip(){
  const el=document.getElementById("projectChip");
  if(!el)return;
  el.textContent=MFDCOStorage.getCurrentMeta()?.name||"MFDCO Project";
}
let autosaveTimer=null;
function scheduleAutosave(){
  clearTimeout(autosaveTimer);
  if(!global.MFDCOWorkspace?.getAutosave?.())return;
  autosaveTimer=setTimeout(()=>{
    try{
      saveCurrent();
      updateProjectChip();
    }catch(_){}
  },1200);
}
function updateWorkspaceStatus(){
  const el=document.getElementById("workspaceStatus");
  if(!el||!global.MFDCOWorkspace)return;
  const st=MFDCOWorkspace.getStatus();
  el.classList.toggle("dirty",!!st.dirty);
  el.classList.toggle("saved",!st.dirty);
  const text=el.querySelector(".workspace-status-text");
  if(text)text.textContent=st.dirty
    ? (st.autosave?"未保存変更あり・自動保存待ち":"未保存変更あり")
    : (st.autosave?"リアルタイム共有中・自動保存":"リアルタイム共有中・保存済み");
}
function mountHeader(){
  let old=document.querySelector("header.site-header");
  if(old){
    const holder=document.createElement("div");
    holder.innerHTML=headerHTML();
    old.replaceWith(holder.firstElementChild);
  }else{
    document.body.insertAdjacentHTML("afterbegin",headerHTML());
  }

  updateProjectChip();
  updateWorkspaceStatus();
  global.MFDCOWorkspace?.subscribeStatus?.(st=>{
    updateWorkspaceStatus();
    if(st?.dirty)scheduleAutosave();
  });
  global.addEventListener?.("beforeunload",e=>{
    const st=global.MFDCOWorkspace?.getStatus?.();
    if(st?.dirty&&!st?.autosave){
      e.preventDefault();
      e.returnValue="";
    }
  });

  const wrap=document.querySelector(".file-menu-wrap");
  const trigger=document.getElementById("fileMenuTrigger");
  const menu=document.getElementById("fileMenu");
  const input=document.getElementById("fileProjectInput");
  if(!wrap||!trigger||!menu||!input)return;

  // Move the dropdown out of the header layout.
  // It is positioned against the trigger with position:fixed.
  document.body.appendChild(menu);
  document.body.appendChild(input);

  function closeFileMenu(){
    menu.classList.remove("open");
    trigger.classList.remove("open");
  }
  function positionFileMenu(){
    const r=trigger.getBoundingClientRect();
    const w=Math.min(260,Math.max(220,menu.offsetWidth||240));
    const left=Math.min(
      Math.max(8,r.left),
      Math.max(8,global.innerWidth-w-8)
    );
    menu.style.left=`${left}px`;
    menu.style.top=`${Math.min(global.innerHeight-12,r.bottom+6)}px`;
    menu.style.width=`${w}px`;
  }

  trigger.onclick=e=>{
    e.stopPropagation();
    const willOpen=!menu.classList.contains("open");
    if(willOpen){
      menu.classList.add("open");
      trigger.classList.add("open");
      positionFileMenu();
    }else closeFileMenu();
  };
  document.addEventListener("click",e=>{
    if(!trigger.contains(e.target)&&!menu.contains(e.target))closeFileMenu();
  });
  global.addEventListener?.("resize",()=>{if(menu.classList.contains("open"))positionFileMenu()});
  global.addEventListener?.("scroll",()=>{if(menu.classList.contains("open"))positionFileMenu()},{passive:true});

  menu.onclick=e=>{
    const b=e.target.closest("button[data-act]");
    if(!b)return;
    const act=b.dataset.act;
    closeFileMenu();
    try{
      if(act==="save")saveCurrent();
      else if(act==="saveAs")saveAs();
      else if(act==="export")exportProject();
      else if(act==="import")input.click();
      else if(act==="exportCode")exportCode();
      else if(act==="autosave"){
        const next=!MFDCOWorkspace.getAutosave();
        MFDCOWorkspace.setAutosave(next);
        toast(next?"自動保存を有効にしました":"自動保存を無効にしました");
      }
      else if(act==="restoreBackup"){
        if(confirm("直前バックアップを復元しますか？")){
          MFDCOStorage.restoreLatestBackup();
          MFDCOWorkspace.markSaved();
          location.reload();
        }
      }
      else if(act==="diagnostics")location.href="diagnostics.html";
      else if(act==="new")newProject();
      else if(act==="openManager")location.href="files.html";
    }catch(err){alert(err.message)}
  };
  input.onchange=()=>{
    const f=input.files?.[0];
    if(f)importProject(f);
    input.value="";
  };
}
function init(){mountHeader()}

global.MFDCOShell={
  version:"3.3",NAV,init,mountHeader,toast,
  saveCurrent,saveAs,exportProject,importProject,newProject
};
})(typeof window!=="undefined"?window:globalThis);
