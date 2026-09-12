/* MFDCO Tools v2.3 shared results/graph renderer */
(function(global){
"use strict";

const COLORS=["#62d6ff","#ff758f","#ffd166","#8be28b","#c4a7e7","#ff9f5a","#76e0c2","#f58fd7"];

function fmt(v){
  if(v===null||v===undefined||!Number.isFinite(v))return "—";
  const a=Math.abs(v);
  if(a!==0&&(a>=1e6||a<1e-4))return v.toExponential(4);
  return String(Number(v.toPrecision(7)));
}
function nice(v){
  if(!Number.isFinite(v))return "";
  const a=Math.abs(v);
  if(a!==0&&(a>=1e5||a<1e-3))return v.toExponential(2);
  return String(Number(v.toPrecision(5)));
}
function escapeHTML(s){
  if(global.MFDCOUI?.escapeHTML)return global.MFDCOUI.escapeHTML(s??"");
  return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function graphClass(n){
  if(n<=1)return"count-1";
  if(n===2)return"count-2";
  if(n<=4)return"count-4";
  return"count-many";
}
function visibleYValues(plot,xmin,xmax){
  const out=[];
  for(const s of plot.series||[]){
    for(const p of s.points||[]){
      if(p?.[1]!==null&&Number.isFinite(p?.[1])&&p[0]>=xmin&&p[0]<=xmax)out.push(p[1]);
    }
  }
  return out;
}
function yRange(plot,xmin,xmax){
  const finite=visibleYValues(plot,xmin,xmax);
  let ymin=finite.length?Math.min(...finite):-1;
  let ymax=finite.length?Math.max(...finite):1;
  if(finite.length>20){
    const sorted=[...finite].sort((a,b)=>a-b);
    const q=r=>sorted[Math.floor((sorted.length-1)*r)];
    const q02=q(.02),q98=q(.98);
    if(q98>q02&&ymax-ymin>(q98-q02)*8){
      ymin=q02-(q98-q02)*.12;
      ymax=q98+(q98-q02)*.12;
    }
  }
  if(ymin===ymax){ymin-=1;ymax+=1}
  const pad=(ymax-ymin)*.08;
  return {ymin:ymin-pad,ymax:ymax+pad,count:finite.length};
}
function drawGraph(canvas,plot,options={}){
  if(!canvas||!plot)return;
  const wrap=canvas.parentElement||canvas;
  const width=Math.max(320,Math.floor(options.width||wrap.clientWidth||600));
  const height=Math.max(180,Math.floor(options.height||wrap.clientHeight||260));
  const dpr=global.devicePixelRatio||1;
  canvas.width=width*dpr;canvas.height=height*dpr;
  const ctx=canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const left=52,right=16,top=34,bottom=34;
  const W=width-left-right,H=height-top-bottom;
  let xmin=Number(plot.xmin),xmax=Number(plot.xmax);
  if(!Number.isFinite(xmin)||!Number.isFinite(xmax)||xmin===xmax){xmin=-1;xmax=1}
  if(xmin>xmax)[xmin,xmax]=[xmax,xmin];
  const {ymin,ymax}=yRange(plot,xmin,xmax);

  const X=x=>left+(x-xmin)/(xmax-xmin)*W;
  const Y=y=>top+H-(y-ymin)/(ymax-ymin)*H;

  ctx.fillStyle=options.background||"#101817";
  ctx.fillRect(0,0,width,height);
  ctx.font="10px Consolas";ctx.fillStyle="#82918f";

  if(plot.grid!==false){
    ctx.strokeStyle="#263634";ctx.lineWidth=1;
    for(let i=0;i<=8;i++){
      const px=left+W*i/8;ctx.beginPath();ctx.moveTo(px,top);ctx.lineTo(px,top+H);ctx.stroke();
    }
    for(let i=0;i<=5;i++){
      const py=top+H*i/5;ctx.beginPath();ctx.moveTo(left,py);ctx.lineTo(left+W,py);ctx.stroke();
    }
  }

  for(let i=0;i<=8;i++){
    const x=xmin+(xmax-xmin)*i/8,px=X(x),txt=nice(x);
    ctx.fillText(txt,px-ctx.measureText(txt).width/2,height-17);
  }
  for(let i=0;i<=5;i++){
    const y=ymax-(ymax-ymin)*i/5,py=top+H*i/5;
    ctx.fillText(nice(y),4,py+3);
  }

  ctx.strokeStyle="#687875";ctx.lineWidth=1.1;
  if(xmin<=0&&xmax>=0){const px=X(0);ctx.beginPath();ctx.moveTo(px,top);ctx.lineTo(px,top+H);ctx.stroke()}
  if(ymin<=0&&ymax>=0){const py=Y(0);ctx.beginPath();ctx.moveTo(left,py);ctx.lineTo(left+W,py);ctx.stroke()}

  ctx.save();ctx.beginPath();ctx.rect(left,top,W,H);ctx.clip();
  (plot.series||[]).forEach((s,si)=>{
    ctx.strokeStyle=COLORS[si%COLORS.length];ctx.lineWidth=1.8;ctx.beginPath();
    let pen=false,prev=null;
    for(const [x,y] of s.points||[]){
      if(y===null||!Number.isFinite(y)||x<xmin||x>xmax){pen=false;prev=null;continue}
      const px=X(x),py=Y(y);
      if(prev!==null&&Math.abs(py-prev)>H*.85)pen=false;
      if(!pen){ctx.moveTo(px,py);pen=true}else ctx.lineTo(px,py);
      prev=py;
    }
    ctx.stroke();
  });
  ctx.restore();

  ctx.fillStyle="#dfe8e6";ctx.font="11px Segoe UI";
  ctx.fillText(plot.title||"グラフ",left,15);

  let lx=left,ly=27;
  ctx.font="9px Consolas";
  (plot.series||[]).forEach((s,si)=>{
    const expression=String(s.expression||s.expr||s.label||"y");
    const label=expression.length>18?expression.slice(0,17)+"…":expression;
    ctx.strokeStyle=COLORS[si%COLORS.length];ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+11,ly);ctx.stroke();
    ctx.fillStyle="#c9d5d3";ctx.fillText(label,lx+15,ly+3);
    lx+=28+ctx.measureText(label).width;
  });

  ctx.fillStyle="#aab7b5";ctx.font="10px Segoe UI";
  ctx.fillText(plot.xLabel||plot.variable||"x",left+W/2,height-4);
  ctx.save();ctx.translate(11,top+H/2);ctx.rotate(-Math.PI/2);
  const yl=plot.yLabel||"y";ctx.fillText(yl,-ctx.measureText(yl).width/2,0);ctx.restore();
  ctx.strokeStyle="#4d5f5c";ctx.strokeRect(left,top,W,H);
}
function statsHTML(plots){
  if(!plots?.length)return '<div class="empty">数値特性はありません。</div>';
  let html="";
  plots.forEach((plot,pi)=>{
    html+=`<div class="stats-title">${escapeHTML(plot.title||`グラフ ${pi+1}`)}</div>`;
    html+='<table class="stats-table"><thead><tr><th>系列</th><th>min</th><th>max</th><th>平均</th><th>標準偏差</th><th>点数</th></tr></thead><tbody>';
    (plot.series||[]).forEach(s=>{
      let st=s.stats;
      if(!st){
        const values=(s.points||[]).map(p=>p?.[1]).filter(Number.isFinite);
        const mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
        const variance=values.length?values.reduce((a,b)=>a+(b-mean)*(b-mean),0)/values.length:null;
        st={
          min:values.length?Math.min(...values):null,
          max:values.length?Math.max(...values):null,
          mean,
          stddev:variance===null?null:Math.sqrt(variance),
          count:values.length
        };
      }
      const expression=String(s.expression||s.expr||s.label||"y");
      html+=`<tr><td title="${escapeHTML(expression)}">${escapeHTML(expression)}</td>`+
        `<td>${fmt(st.min)}</td><td>${fmt(st.max)}</td><td>${fmt(st.mean)}</td>`+
        `<td>${fmt(st.stddev)}</td><td>${st.count??"—"}</td></tr>`;
    });
    html+="</tbody></table>";
  });
  return html;
}
function exportCanvas(canvas,filename="MFDCO_graph.png"){
  if(!canvas)throw new Error("出力するグラフがありません");
  const a=document.createElement("a");
  a.download=filename;a.href=canvas.toDataURL("image/png");a.click();
}
function createGraphCard(plot,index,onEdit,onExport){
  const card=document.createElement("div");card.className="graph-card";
  card.innerHTML=`<div class="graph-head">
    <strong>${escapeHTML(plot.title||`グラフ ${index+1}`)}</strong>
    <div class="graph-actions">
      <button data-select="${index}">編集</button><button data-export="${index}">PNG</button>
    </div></div><div class="graph-canvas-wrap"><canvas class="graph-canvas"></canvas></div>`;
  card.querySelector("[data-select]").onclick=()=>onEdit?.(index);
  card.querySelector("[data-export]").onclick=()=>onExport?.(index);
  return card;
}
function renderGraphGrid(host,plots,{onEdit,onExport}={}){
  host.innerHTML="";
  host.className="graph-grid "+graphClass(plots?.length||0);
  if(!plots?.length){
    host.innerHTML='<div class="empty">プロットされたグラフはありません。</div>';return[];
  }
  const cards=[];
  plots.forEach((plot,index)=>{
    const card=createGraphCard(plot,index,onEdit,onExport);
    host.appendChild(card);cards.push(card);
    requestAnimationFrame(()=>drawGraph(card.querySelector("canvas"),plot));
  });
  return cards;
}



function canResample(plot){
  return !!(plot&&typeof plot.variable==="string"&&Array.isArray(plot.expressions)&&plot.expressions.length&&
    Number.isFinite(Number(plot.xmin))&&Number.isFinite(Number(plot.xmax)));
}
function resamplePlot(plot,xmin=plot.xmin,xmax=plot.xmax,count=plot.sampleCount||520){
  if(!canResample(plot)||!global.MFDCOEngine?.samplePlotData)return plot;
  const fresh=global.MFDCOEngine.samplePlotData(
    plot.variable,plot.expressions,Number(xmin),Number(xmax),
    {vars:plot.varsSnapshot||{},angleMode:plot.angleMode||"DEG",ansHistory:[],count}
  );
  return {...plot,...fresh,title:plot.title,xLabel:plot.xLabel,yLabel:plot.yLabel,grid:plot.grid};
}
function seriesPoints(plot,index=0){
  return plot?.series?.[index]?.points?.filter(
    p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(Number(p[0]))&&(p[1]===null||Number.isFinite(Number(p[1])))
  )||[];
}
function findRoots(plot,index=0){
  const pts=seriesPoints(plot,index),roots=[];
  for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i];
    if(a[1]===null||b[1]===null)continue;
    if(a[1]===0)roots.push(a[0]);
    else if(b[1]===0)roots.push(b[0]);
    else if(a[1]*b[1]<0)roots.push(a[0]+(0-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }
  roots.sort((a,b)=>a-b);
  return roots.filter((x,i,a)=>i===0||Math.abs(x-a[i-1])>1e-8);
}
function findExtrema(plot,index=0){
  const pts=seriesPoints(plot,index),min=[],max=[];
  for(let i=1;i<pts.length-1;i++){
    const a=pts[i-1],b=pts[i],c=pts[i+1];
    if(a[1]===null||b[1]===null||c[1]===null)continue;
    if(b[1]<a[1]&&b[1]<c[1])min.push({x:b[0],y:b[1]});
    if(b[1]>a[1]&&b[1]>c[1])max.push({x:b[0],y:b[1]});
  }
  return {min,max};
}
function findIntersections(plot,aIndex=0,bIndex=1){
  const A=seriesPoints(plot,aIndex),B=seriesPoints(plot,bIndex);
  const n=Math.min(A.length,B.length),out=[];
  for(let i=1;i<n;i++){
    if(A[i-1][1]===null||A[i][1]===null||B[i-1][1]===null||B[i][1]===null)continue;
    const d1=A[i-1][1]-B[i-1][1],d2=A[i][1]-B[i][1];
    if(d1===0){out.push({x:A[i-1][0],y:A[i-1][1]});continue}
    if(d1*d2<0){
      const x=A[i-1][0]+(0-d1)*(A[i][0]-A[i-1][0])/(d2-d1);
      const y=A[i-1][1]+(x-A[i-1][0])*(A[i][1]-A[i-1][1])/(A[i][0]-A[i-1][0]);
      out.push({x,y});
    }
  }
  return out;
}
function tangentAt(plot,x,index=0){
  const pts=seriesPoints(plot,index).filter(p=>p[1]!==null);
  if(pts.length<3)return null;
  let k=0;
  for(let i=1;i<pts.length;i++)if(Math.abs(pts[i][0]-x)<Math.abs(pts[k][0]-x))k=i;
  const i0=Math.max(0,k-1),i1=Math.min(pts.length-1,k+1);
  if(i0===i1)return null;
  const slope=(pts[i1][1]-pts[i0][1])/(pts[i1][0]-pts[i0][0]);
  return {x:pts[k][0],y:pts[k][1],slope,intercept:pts[k][1]-slope*pts[k][0]};
}
function areaUnderCurve(plot,xmin=plot.xmin,xmax=plot.xmax,index=0,absolute=false){
  const pts=seriesPoints(plot,index).filter(p=>p[1]!==null&&p[0]>=xmin&&p[0]<=xmax);
  let area=0;
  for(let i=1;i<pts.length;i++){
    const dx=pts[i][0]-pts[i-1][0];
    const y0=absolute?Math.abs(pts[i-1][1]):pts[i-1][1];
    const y1=absolute?Math.abs(pts[i][1]):pts[i][1];
    area+=dx*(y0+y1)/2;
  }
  return area;
}
function plotToCSV(plot){
  const labels=plot.series.map((s,i)=>s.label||s.expr||`series${i+1}`);
  const rows=[["x",...labels]];
  const count=Math.max(0,...plot.series.map(s=>s.points?.length||0));
  for(let i=0;i<count;i++){
    const x=plot.series[0]?.points?.[i]?.[0] ?? "";
    rows.push([x,...plot.series.map(s=>s.points?.[i]?.[1] ?? "")]);
  }
  return rows.map(row=>row.map(v=>{
    const s=String(v??"");
    return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
  }).join(",")).join("\n");
}
function exportCSV(plot,filename="MFDCO_graph.csv"){
  const blob=new Blob([plotToCSV(plot)],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function plotToSVG(plot,width=900,height=520){
  const pad=54,innerW=width-pad*2,innerH=height-pad*2;
  const ys=[];
  plot.series.forEach(s=>(s.points||[]).forEach(([,y])=>{if(Number.isFinite(y))ys.push(y)}));
  const xmin=Number(plot.xmin),xmax=Number(plot.xmax);
  let ymin=Math.min(...ys),ymax=Math.max(...ys);
  if(!Number.isFinite(ymin)||!Number.isFinite(ymax)||ymin===ymax){ymin=-1;ymax=1}
  const sx=x=>pad+(x-xmin)/(xmax-xmin)*innerW;
  const sy=y=>height-pad-(y-ymin)/(ymax-ymin)*innerH;
  const palette=["#4fc3f7","#ef6c9f","#f4d35e","#70c48f","#b39ddb","#ffb366","#62d6c7","#e879f9"];
  const paths=plot.series.map((s,si)=>{
    let d="",open=false;
    for(const [x,y] of s.points||[]){
      if(!Number.isFinite(y)){open=false;continue}
      d+=(open?"L":"M")+sx(x).toFixed(2)+" "+sy(y).toFixed(2)+" ";
      open=true;
    }
    return `<path d="${d.trim()}" fill="none" stroke="${palette[si%palette.length]}" stroke-width="2"/>`;
  }).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#0f1817"/>
  <line x1="${pad}" y1="${height-pad}" x2="${width-pad}" y2="${height-pad}" stroke="#60716e"/>
  <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height-pad}" stroke="#60716e"/>
  <text x="${width/2}" y="28" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="18">${escapeHTML(plot.title||"MFDCO Graph")}</text>
  ${paths}
</svg>`;
}
function exportSVG(plot,filename="MFDCO_graph.svg"){
  const blob=new Blob([plotToSVG(plot)],{type:"image/svg+xml;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function createResultsController(options={}){
  const ids={
    logBox:"logBox",graphGrid:"graphGrid",statsArea:"statsArea",graphSelect:"graphSelect",
    graphCount:"graphCount",titleInput:"titleInput",xLabelInput:"xLabelInput",
    yLabelInput:"yLabelInput",xMinInput:"xMinInput",xMaxInput:"xMaxInput",
    gridInput:"gridInput",applyBtn:"applyBtn",exportSelectedBtn:"exportSelectedBtn",
    clearAllBtn:"clearAllBtn",...options.ids
  };
  const el=id=>document.getElementById(ids[id]);
  let payload={logs:[],plots:[]};
  let selectedIndex=0;

  function load(){
    payload=global.MFDCOWorkspace?.getResults?.()||global.MFDCOStorage?.getLastResults?.()||{logs:[],plots:[]};
    if(!payload||!Array.isArray(payload.plots))payload={logs:[],plots:[]};
    if(!Array.isArray(payload.logs))payload.logs=[];
    return payload;
  }
  function save(){if(global.MFDCOWorkspace?.setResults)global.MFDCOWorkspace.setResults(payload,"results");else global.MFDCOStorage?.setLastResults?.(payload)}
  function buildSelect(){
    const select=el("graphSelect");if(!select)return;
    select.innerHTML="";
    payload.plots.forEach((p,i)=>select.add(new Option(`${i+1}: ${p.title||"グラフ"}`,i)));
    if(selectedIndex>=payload.plots.length)selectedIndex=0;
    select.value=String(selectedIndex);
  }
  function syncEditor(){
    buildSelect();
    const p=payload.plots[selectedIndex];
    if(!p)return;
    if(el("titleInput"))el("titleInput").value=p.title||"";
    if(el("xLabelInput"))el("xLabelInput").value=p.xLabel||p.variable||"x";
    if(el("yLabelInput"))el("yLabelInput").value=p.yLabel||"y";
    if(el("xMinInput"))el("xMinInput").value=p.xmin;
    if(el("xMaxInput"))el("xMaxInput").value=p.xmax;
    if(el("gridInput"))el("gridInput").checked=p.grid!==false;
    global.dispatchEvent?.(new CustomEvent("mfdco-results-selection",{detail:{index:selectedIndex,plot:p}}));
  }
  function exportGraph(index){
    const grid=el("graphGrid");if(!grid)return;
    const card=[...grid.querySelectorAll(".graph-card")][index];
    const canvas=card?.querySelector("canvas");
    if(canvas)exportCanvas(canvas,`MFDCO_graph_${index+1}.png`);
  }
  function renderGraphs(){
    if(el("graphCount"))el("graphCount").textContent=payload.plots.length?`${payload.plots.length}件`:"";
    if(!el("graphGrid"))return;
    renderGraphGrid(el("graphGrid"),payload.plots,{
      onEdit:index=>{selectedIndex=index;syncEditor()},
      onExport:index=>exportGraph(index)
    });
  }
  function renderStats(){if(el("statsArea"))el("statsArea").innerHTML=statsHTML(payload.plots)}
  function renderAll(){
    if(el("logBox"))el("logBox").textContent=payload.logs.length?payload.logs.join("\n"):"まだ実行結果がありません。";
    renderGraphs();renderStats();syncEditor();
  }
  function applyEditor(){
    const p=payload.plots[selectedIndex];if(!p)return false;
    const xmin=Number(el("xMinInput")?.value),xmax=Number(el("xMaxInput")?.value);
    if(!Number.isFinite(xmin)||!Number.isFinite(xmax)||xmin>=xmax){
      alert("X軸範囲が不正です");return false;
    }
    p.title=el("titleInput")?.value.trim()||p.title;
    p.xLabel=el("xLabelInput")?.value.trim()||"x";
    p.yLabel=el("yLabelInput")?.value.trim()||"y";
    p.grid=el("gridInput")?.checked!==false;
    if(canResample(p)){
      const fresh=resamplePlot(p,xmin,xmax,p.sampleCount||520);
      Object.keys(p).forEach(k=>delete p[k]);
      Object.assign(p,fresh);
    }else{
      p.xmin=xmin;p.xmax=xmax;
    }
    save();renderAll();return true;
  }
  function clearAll(){
    if(global.MFDCOWorkspace?.clearResults)global.MFDCOWorkspace.clearResults("results");else global.MFDCOStorage?.clearLastResults?.();
    payload={logs:[],plots:[]};selectedIndex=0;renderAll();
  }
  function bind(){
    if(el("graphSelect"))el("graphSelect").onchange=()=>{selectedIndex=Number(el("graphSelect").value);syncEditor()};
    if(el("applyBtn"))el("applyBtn").onclick=applyEditor;
    if(el("exportSelectedBtn"))el("exportSelectedBtn").onclick=()=>exportGraph(selectedIndex);
    if(el("clearAllBtn"))el("clearAllBtn").onclick=clearAll;
    global.addEventListener?.("resize",()=>{
      clearTimeout(global.__mfdcoResultsResize);
      global.__mfdcoResultsResize=setTimeout(renderGraphs,120);
    });
  }
  function init(){load();bind();renderAll();return api}
  const api={init,load,save,renderAll,renderGraphs,renderStats,syncEditor,applyEditor,clearAll,exportGraph,
    get payload(){return payload},get selectedIndex(){return selectedIndex},set selectedIndex(v){selectedIndex=Number(v)||0}};
  return api;
}

global.MFDCOResults={
  version:"3.8.2",COLORS,fmt,nice,escapeHTML,graphClass,yRange,
  drawGraph,statsHTML,exportCanvas,createGraphCard,renderGraphGrid,
  canResample,resamplePlot,findRoots,findExtrema,findIntersections,tangentAt,areaUnderCurve,
  plotToCSV,exportCSV,plotToSVG,exportSVG,createResultsController
};
})(typeof window!=="undefined"?window:globalThis);
