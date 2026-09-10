"use strict";

const TICKS_PER_SECOND = 20;
const GRID_SIZE = 11;
const CENTER = 5;
const DEFAULT_FUSE = 80;

const PHYSICS_MODELS = {
  "java-1.7.10": {
    label: "Java Edition 1.7.10",
    warhead: { gravity: 0.04, drag: 0.98, fuseTicks: DEFAULT_FUSE },
    charge: {
      tnt: { baseImpulse: 0.105, radius: 8, countExponent: 0.86 },
      "tnt-minecart": { baseImpulse: 0.132, radius: 8, countExponent: 0.90 }
    }
  }
};

const gridState = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
let lastResult = null;
let currentView = "top";
let lastDesignCandidates = [];

const $ = (id) => document.getElementById(id);
const num = (id) => Number($(id).value);
const chk = (id) => $(id).checked;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = (v, d = 2) => Number.isFinite(v) ? v.toLocaleString("ja-JP", { minimumFractionDigits: d, maximumFractionDigits: d }) : "---";
const sec = (tick) => tick / TICKS_PER_SECOND;
const len3 = (x, y, z) => Math.sqrt(x*x + y*y + z*z);
const len2 = (x, z) => Math.sqrt(x*x + z*z);

function angleToVector(deg){ const r=deg*Math.PI/180; return {x:Math.sin(r), z:-Math.cos(r)}; }
function vectorToBearing(x,z){ let a=Math.atan2(x,-z)*180/Math.PI; if(a<0)a+=360; return a; }
function bearingName(a){ const n=["北","北北東","北東","東北東","東","東南東","南東","南南東","南","南南西","南西","西南西","西","西北西","北西","北北西"]; return n[Math.round(a/22.5)%16]; }

function createGrid(){
  const g=$("charge-grid"); g.innerHTML="";
  g.appendChild(labelCell(""));
  for(let x=-5;x<=5;x++) g.appendChild(labelCell(x>0?`+${x}`:`${x}`));
  for(let r=0;r<GRID_SIZE;r++){
    const z=r-CENTER; g.appendChild(labelCell(z>0?`+${z}`:`${z}`));
    for(let c=0;c<GRID_SIZE;c++){
      if(r===CENTER&&c===CENTER){ const d=document.createElement("div"); d.className="warhead-cell"; d.textContent="弾頭"; g.appendChild(d); continue; }
      const w=document.createElement("div"); w.className="charge-cell";
      const i=document.createElement("input"); i.type="number"; i.min="0"; i.max="999"; i.step="1"; i.value=String(gridState[r][c]); i.dataset.r=r; i.dataset.c=c;
      i.addEventListener("input",()=>{ gridState[r][c]=Math.max(0,Math.floor(Number(i.value)||0)); updateTotal(); });
      w.appendChild(i); g.appendChild(w);
    }
  }
  updateTotal();
}
function labelCell(t){ const d=document.createElement("div"); d.className="grid-label"; d.textContent=t; return d; }
function refreshGridInputs(){ document.querySelectorAll(".charge-cell input").forEach(i=>{ i.value=String(gridState[Number(i.dataset.r)][Number(i.dataset.c)]); }); updateTotal(); }
function clearGrid(){ for(let r=0;r<GRID_SIZE;r++)for(let c=0;c<GRID_SIZE;c++)gridState[r][c]=0; refreshGridInputs(); }
function updateTotal(){ $("primary-total").textContent = `${gridState.flat().reduce((a,b)=>a+b,0)} 個`; }
function eastPreset(){ clearGrid(); [[5,3,8],[4,3,5],[6,3,5],[5,2,4],[4,2,3],[6,2,3]].forEach(([r,c,n])=>gridState[r][c]=n); refreshGridInputs(); }

function readSettings(){
  const model=PHYSICS_MODELS[$("physics-version").value];
  return {
    model, mode:$("simulation-mode").value,
    launch:{x:num("launch-x"),y:num("launch-y"),z:num("launch-z")},
    warhead:{igniteTick:Math.max(0,Math.round(num("warhead-ignite-tick"))),releaseTick:Math.max(0,Math.round(num("warhead-release-tick")))},
    primary:{type:$("primary-charge-type").value,tick:Math.max(0,Math.round(num("primary-tick"))),yOffset:num("primary-y-offset"),efficiency:Math.max(0,num("primary-efficiency")),exposure:clamp(num("primary-exposure"),0,1)},
    safeRadius:Math.max(.1,num("safe-radius")), dispenserError:Math.max(0,num("dispenser-error")),
    secondary:readStage("secondary"), tertiary:readStage("tertiary"),
    target:{enabled:chk("target-enabled"),x:num("target-x"),z:num("target-z")}
  };
}
function readStage(prefix){ return { enabled:chk(`${prefix}-enabled`),type:$(`${prefix}-type`).value,count:Math.max(0,Math.floor(num(`${prefix}-count`))),tick:Math.max(0,Math.round(num(`${prefix}-tick`))),directionMode:$(`${prefix}-direction-mode`).value,angle:num(`${prefix}-angle`),distance:Math.max(.1,num(`${prefix}-distance`)),yImpulse:num(`${prefix}-y-impulse`),efficiency:Math.max(0,num(`${prefix}-efficiency`)) }; }

function getTargetBearing(s){ if(!s.target.enabled)return null; return vectorToBearing(s.target.x-s.launch.x,s.target.z-s.launch.z); }

function primaryImpulse(s){
  const p=s.model.charge[s.primary.type]; let x=0,y=0,z=0;
  for(let r=0;r<GRID_SIZE;r++)for(let c=0;c<GRID_SIZE;c++){
    const count=gridState[r][c]; if(count<=0||(r===CENTER&&c===CENTER))continue;
    const cx=c-CENTER, cz=r-CENTER, cy=s.primary.yOffset;
    const dx=-cx, dy=-cy, dz=-cz; const dist=len3(dx,dy,dz); if(dist<=0||dist>=p.radius)continue;
    const df=clamp(1-dist/p.radius,0,1); const cf=Math.pow(count,p.countExponent);
    const impulse=p.baseImpulse*df*cf*s.primary.efficiency*s.primary.exposure;
    x+=dx/dist*impulse; y+=dy/dist*impulse; z+=dz/dist*impulse;
  }
  return {x,y,z};
}

function stageImpulse(stage,s){
  if(!stage.enabled||stage.count<=0)return {x:0,y:0,z:0};
  const p=s.model.charge[stage.type]; const targetBearing=getTargetBearing(s); const angle=(stage.directionMode==="auto"&&targetBearing!==null)?targetBearing:stage.angle;
  const d=angleToVector(angle); const df=clamp(1-stage.distance/p.radius,0,1); const cf=Math.pow(stage.count,p.countExponent); const efficiency=0.76*stage.efficiency;
  const impulse=p.baseImpulse*df*cf*efficiency;
  return {x:d.x*impulse,y:stage.yImpulse,z:d.z*impulse};
}

function snap(tick,name,pos,motion,after=false){ return {tick,seconds:sec(tick),name,x:pos.x,y:pos.y,z:pos.z,speed:len3(motion.x,motion.y,motion.z),after}; }

function simulate(s){
  const explosionTick=s.warhead.igniteTick+s.model.warhead.fuseTicks;
  const pos={...s.launch}; const motion={x:0,y:0,z:0}; const history=[]; const events=[];
  let maxSpeed=0,maxHorizontal=0,maxY=pos.y,maxSpeedTick=0,primarySpeed=null,secondarySpeed=null,tertiarySpeed=null;
  events.push(snap(s.warhead.igniteTick,"弾頭点火",pos,motion));
  for(let tick=0;tick<=explosionTick;tick++){
    if(tick===s.warhead.releaseTick)events.push(snap(tick,"弾頭排出",pos,motion));
    if(tick===s.primary.tick){ events.push(snap(tick,"一次装薬爆発",pos,motion)); const q=primaryImpulse(s); motion.x+=q.x;motion.y+=q.y;motion.z+=q.z; primarySpeed=len3(motion.x,motion.y,motion.z); events.push(snap(tick,"一次装薬直後",pos,motion,true)); }
    if(s.secondary.enabled&&tick===s.secondary.tick){ events.push(snap(tick,"二次装薬 / 拡散開始",pos,motion)); const q=stageImpulse(s.secondary,s); motion.x+=q.x;motion.y+=q.y;motion.z+=q.z; secondarySpeed=len3(motion.x,motion.y,motion.z); events.push(snap(tick,"二次装薬直後",pos,motion,true)); }
    if(s.tertiary.enabled&&tick===s.tertiary.tick){ events.push(snap(tick,"三次装薬 / 拡散開始",pos,motion)); const q=stageImpulse(s.tertiary,s); motion.x+=q.x;motion.y+=q.y;motion.z+=q.z; tertiarySpeed=len3(motion.x,motion.y,motion.z); events.push(snap(tick,"三次装薬直後",pos,motion,true)); }
    const nowSpeed=len3(motion.x,motion.y,motion.z); if(nowSpeed>maxSpeed){maxSpeed=nowSpeed;maxSpeedTick=tick} maxHorizontal=Math.max(maxHorizontal,len2(motion.x,motion.z)); maxY=Math.max(maxY,pos.y);
    history.push({tick,x:pos.x,y:pos.y,z:pos.z,motionX:motion.x,motionY:motion.y,motionZ:motion.z});
    if(tick===explosionTick){events.push(snap(tick,"弾頭起爆",pos,motion));break;}
    if(tick<s.warhead.releaseTick)continue;
    motion.y-=s.model.warhead.gravity; pos.x+=motion.x;pos.y+=motion.y;pos.z+=motion.z; motion.x*=s.model.warhead.drag;motion.y*=s.model.warhead.drag;motion.z*=s.model.warhead.drag;
  }
  const final=history[history.length-1]; const dx=final.x-s.launch.x,dz=final.z-s.launch.z; const distance=len2(dx,dz); const bearing=distance>1e-9?vectorToBearing(dx,dz):0;
  return {settings:s,explosionTick,history,events,final,horizontalDistance:distance,bearing,maxSpeed,maxHorizontal,maxY,maxSpeedTick,finalSpeed:len3(final.motionX,final.motionY,final.motionZ),primarySpeed,secondarySpeed,tertiarySpeed};
}

function evaluateSafety(r){
  const s=r.settings,reasons=[];let level="good";
  if(s.primary.tick<s.warhead.releaseTick){level="danger";reasons.push("一次装薬が弾頭排出前に起爆します。");}
  if(s.warhead.releaseTick>=r.explosionTick){level="danger";reasons.push("弾頭が排出前に起爆時刻へ到達します。");}
  const gap=s.primary.tick-s.warhead.releaseTick; if(level!=="danger"&&gap<=1){level="warning";reasons.push("弾頭排出と一次装薬の間隔が1tick以下です。");}
  for(const [name,stage] of [["二次",s.secondary],["三次",s.tertiary]]) if(stage.enabled){ if(stage.tick>=r.explosionTick){level=level==="danger"?level:"warning";reasons.push(`${name}装薬が弾頭起爆時刻以降です。`);} if(stage.distance<s.safeRadius){level=level==="danger"?level:"warning";reasons.push(`${name}装薬の想定距離が安全半径より小さいです。`);} }
  if(!reasons.length)reasons.push("設定されたタイミング上では明確な自爆条件は検出されませんでした。");
  return {level,reasons};
}

function confidence(r){ let score=90;const s=r.settings;if(s.primary.type==="tnt-minecart")score-=10;if(s.secondary.enabled)score-=12;if(s.tertiary.enabled)score-=16;score-=Math.min(15,s.dispenserError*20);score=clamp(Math.round(score),25,95);return {score,label:score>=80?"HIGH":score>=60?"MEDIUM":"LOW"}; }

function showResult(r){
  lastResult=r; const finalEvent=r.events.find(e=>e.name==="弾頭起爆");
  $("result-final-coordinate").textContent=`X ${fmt(finalEvent.x,2)} / Y ${fmt(finalEvent.y,2)} / Z ${fmt(finalEvent.z,2)}`;
  $("result-distance").textContent=fmt(r.horizontalDistance,2); $("result-bearing").textContent=`${fmt(r.bearing,2)}° / ${bearingName(r.bearing)}`;
  $("result-primary-speed").textContent=r.primarySpeed===null?"---":fmt(r.primarySpeed,3); $("result-secondary-speed").textContent=r.secondarySpeed===null?"---":fmt(r.secondarySpeed,3); $("result-tertiary-speed").textContent=r.tertiarySpeed===null?"---":fmt(r.tertiarySpeed,3);
  $("result-max-speed").textContent=fmt(r.maxSpeed,3); $("result-max-horizontal").textContent=fmt(r.maxHorizontal,3); $("result-final-speed").textContent=fmt(r.finalSpeed,3); $("result-max-y").textContent=fmt(r.maxY,2); $("result-max-speed-tick").textContent=String(r.maxSpeedTick);
  const c=confidence(r);$("result-confidence").textContent=`${c.label} ${c.score}%`;
  const saf=evaluateSafety(r),st=$("safety-status");st.className=`status ${saf.level}`;st.textContent=saf.level==="good"?"SAFE":saf.level==="warning"?"WARNING":"SELF-DETONATION";$("safety-title").textContent=saf.level==="good"?"自爆条件なし":saf.level==="warning"?"要確認":"自爆可能性あり";$("safety-description").textContent=saf.reasons.join(" ");
  showTarget(r);showTimeline(r);drawTrajectory(r);
}

function showTarget(r){ const b=$("target-result-box"); if(!r.settings.target.enabled){b.hidden=true;return;} b.hidden=false; const dx=r.final.x-r.settings.target.x,dz=r.final.z-r.settings.target.z; $("target-error-distance").textContent=`${fmt(len2(dx,dz),2)} blocks`;$("target-error-x").textContent=fmt(dx,2);$("target-error-z").textContent=fmt(dz,2); }
function showTimeline(r){ const body=$("timeline-body");body.innerHTML="";[...r.events].sort((a,b)=>a.tick-b.tick||Number(a.after)-Number(b.after)).forEach(e=>{const tr=document.createElement("tr");tr.innerHTML=`<td>${e.tick}</td><td>${fmt(e.seconds,2)}</td><td>${e.name}</td><td>${fmt(e.x,2)}</td><td>${fmt(e.y,2)}</td><td>${fmt(e.z,2)}</td><td>${fmt(e.speed,3)}</td>`;body.appendChild(tr);}); }

function updateTargetReadout(){ const s=readSettings(); if(!s.target.enabled){$("target-distance-readout").textContent="---";$("target-bearing-readout").textContent="---";return;} const dx=s.target.x-s.launch.x,dz=s.target.z-s.launch.z,b=vectorToBearing(dx,dz);$("target-distance-readout").textContent=`${fmt(len2(dx,dz),2)} blocks`;$("target-bearing-readout").textContent=`${fmt(b,2)}° / ${bearingName(b)}`; }

function makeDirectionalLayout(bearing,total){
  const layout=Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(0)); const launchDir=angleToVector(bearing); const cells=[];
  for(let r=0;r<GRID_SIZE;r++)for(let c=0;c<GRID_SIZE;c++)if(!(r===CENTER&&c===CENTER)){
    const cx=c-CENTER,cz=r-CENTER; const dist=Math.sqrt(cx*cx+cz*cz); if(dist===0)continue; const pushX=-cx/dist,pushZ=-cz/dist; const align=pushX*launchDir.x+pushZ*launchDir.z; if(align>0.45)cells.push({r,c,score:align*2-dist*0.18,dist});
  }
  cells.sort((a,b)=>b.score-a.score); let remain=total,idx=0; while(remain>0&&cells.length){const cell=cells[idx%Math.min(cells.length,18)];layout[cell.r][cell.c]++;remain--;idx++;}
  return layout;
}
function applyLayout(layout){ for(let r=0;r<GRID_SIZE;r++)for(let c=0;c<GRID_SIZE;c++)gridState[r][c]=layout[r][c];refreshGridInputs(); }
function cloneLayout(layout){ return layout.map(r=>r.slice()); }

function autoDesign(){
  const base=readSettings(); if(!base.target.enabled){alert("目標座標を有効にしてください。");return;} const maxCharge=clamp(Math.floor(num("design-max-charge")),1,999); const bearing=getTargetBearing(base); const type=$("design-charge-type").value; const original=gridState.map(r=>r.slice()); const candidates=[]; const step=base.mode==="fast"?4:base.mode==="accurate"?1:2;
  for(let n=1;n<=maxCharge;n+=step){ const layout=makeDirectionalLayout(bearing,n);applyLayout(layout); const s=readSettings();s.primary.type=type;s.secondary.enabled=false;s.tertiary.enabled=false; const r=simulate(s); const error=len2(r.final.x-s.target.x,r.final.z-s.target.z); candidates.push({count:n,error,result:r,layout:cloneLayout(layout),type}); }
  applyLayout(original); candidates.sort((a,b)=>a.error-b.error||a.count-b.count); const best=candidates[0]; const low=[...candidates].sort((a,b)=>a.count-b.count||a.error-b.error).find(c=>c.error<=Math.max(best.error*2,8))||best; const stable=[...candidates].sort((a,b)=>Math.abs(a.count-(best.count+8))-Math.abs(b.count-(best.count+8))||a.error-b.error)[0]||best;
  lastDesignCandidates=[best,low,stable]; renderDesignResults(lastDesignCandidates);
}
function renderDesignResults(list){ const box=$("design-results");box.innerHTML="";const names=["RECOMMENDED","LOW CHARGE","STABLE OPTION"];list.forEach((c,i)=>{const card=document.createElement("div");card.className="design-card";card.innerHTML=`<h3>${String(i+1).padStart(2,"0")} ${names[i]}</h3><dl><div><dt>装薬タイプ</dt><dd>${c.type==="tnt"?"TNT":"TNT付きトロッコ"}</dd></div><div><dt>装薬数</dt><dd>${c.count}</dd></div><div><dt>予測距離</dt><dd>${fmt(c.result.horizontalDistance,2)}</dd></div><div><dt>目標誤差</dt><dd>${fmt(c.error,2)} blocks</dd></div><div><dt>方位</dt><dd>${fmt(c.result.bearing,2)}°</dd></div></dl><button class="small-button" type="button">この配置を適用</button>`;card.querySelector("button").addEventListener("click",()=>{$("primary-charge-type").value=c.type;applyLayout(c.layout);runSimulation();});box.appendChild(card);}); }

function runSimulation(){ try{const s=readSettings();showResult(simulate(s));}catch(e){console.error(e);$("safety-status").className="status danger";$("safety-status").textContent="ERROR";$("safety-description").textContent=e.message||"入力値を確認してください。";} }

function drawTrajectory(r){ const cv=$("trajectory-canvas"),ctx=cv.getContext("2d"),w=cv.width,h=cv.height;ctx.clearRect(0,0,w,h);ctx.fillStyle="#f5f7f7";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#d9dddd";ctx.lineWidth=1;for(let x=0;x<w;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  if(currentView==="top")drawTop(r,ctx,w,h); else drawSide(r,ctx,w,h);
}
function fitProject(points,w,h,margin=50){let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;points.forEach(p=>{minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y)});const sx=(w-2*margin)/Math.max(1,maxX-minX),sy=(h-2*margin)/Math.max(1,maxY-minY),scale=Math.min(sx,sy);return p=>({x:margin+(p.x-minX)*scale,y:h-margin-(p.y-minY)*scale});}
function drawTop(r,ctx,w,h){const pts=r.history.map(v=>({x:v.x,y:-v.z}));if(r.settings.target.enabled)pts.push({x:r.settings.target.x,y:-r.settings.target.z});const project=fitProject(pts,w,h);ctx.strokeStyle="#164b4b";ctx.lineWidth=3;ctx.beginPath();r.history.forEach((v,i)=>{const p=project({x:v.x,y:-v.z});i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});ctx.stroke();mark(ctx,project({x:r.history[0].x,y:-r.history[0].z}),"●");const f=r.events.find(e=>e.name==="弾頭起爆");mark(ctx,project({x:f.x,y:-f.z}),"★");if(r.settings.target.enabled){ctx.fillStyle="#8c3636";ctx.font="bold 20px sans-serif";const t=project({x:r.settings.target.x,y:-r.settings.target.z});ctx.fillText("×",t.x-6,t.y+7)}ctx.fillStyle="#164b4b";ctx.font="bold 14px sans-serif";ctx.fillText("N / -Z",14,22)}
function drawSide(r,ctx,w,h){let dist=0,prev=r.history[0],pts=[{x:0,y:prev.y}];for(let i=1;i<r.history.length;i++){const v=r.history[i];dist+=len2(v.x-prev.x,v.z-prev.z);pts.push({x:dist,y:v.y});prev=v;}const project=fitProject(pts,w,h);ctx.strokeStyle="#164b4b";ctx.lineWidth=3;ctx.beginPath();pts.forEach((p,i)=>{const q=project(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.stroke();mark(ctx,project(pts[0]),"●");mark(ctx,project(pts[pts.length-1]),"★");ctx.fillStyle="#164b4b";ctx.font="bold 14px sans-serif";ctx.fillText("Distance / Y",14,22)}
function mark(ctx,p,s){ctx.fillStyle="#111";ctx.font="bold 17px sans-serif";ctx.fillText(s,p.x-6,p.y+5)}

function calibrate(){ if(!lastResult){alert("先にシミュレーションしてください。");return;} const measured=num("measured-distance");if(!(measured>0)){alert("実測水平飛距離を入力してください。");return;}const current=Math.max(.0001,num("primary-efficiency"));const predicted=Math.max(.0001,lastResult.horizontalDistance);const suggested=current*(measured/predicted);$("calibrated-efficiency-readout").textContent=fmt(suggested,3); }

function exportSettings(){ const s=readSettings(); const data={version:1,physics:$("physics-version").value,simulationMode:s.mode,launch:s.launch,warhead:s.warhead,primary:{...s.primary,cells:gridState.map(r=>r.slice())},secondary:s.secondary,tertiary:s.tertiary,target:s.target,safeRadius:s.safeRadius,dispenserError:s.dispenserError}; const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mfdco-tnt-cannon-settings.json";a.click();URL.revokeObjectURL(a.href); }
function importSettings(file){ const reader=new FileReader();reader.onload=()=>{try{const d=JSON.parse(reader.result);$("physics-version").value=d.physics||"java-1.7.10";$("simulation-mode").value=d.simulationMode||"balanced"; setNum("launch-x",d.launch?.x);setNum("launch-y",d.launch?.y);setNum("launch-z",d.launch?.z);setNum("warhead-ignite-tick",d.warhead?.igniteTick);setNum("warhead-release-tick",d.warhead?.releaseTick); if(d.primary){$("primary-charge-type").value=d.primary.type||"tnt";setNum("primary-tick",d.primary.tick);setNum("primary-y-offset",d.primary.yOffset);setNum("primary-efficiency",d.primary.efficiency);setNum("primary-exposure",d.primary.exposure);if(Array.isArray(d.primary.cells))for(let r=0;r<GRID_SIZE;r++)for(let c=0;c<GRID_SIZE;c++)gridState[r][c]=Math.max(0,Math.floor(Number(d.primary.cells?.[r]?.[c])||0));} loadStage("secondary",d.secondary);loadStage("tertiary",d.tertiary); if(d.target){$("target-enabled").checked=!!d.target.enabled;setNum("target-x",d.target.x);setNum("target-z",d.target.z);}setNum("safe-radius",d.safeRadius);setNum("dispenser-error",d.dispenserError);refreshGridInputs();updateTargetReadout();runSimulation();}catch(e){alert("設定ファイルを読み込めませんでした。");console.error(e)}};reader.readAsText(file); }
function setNum(id,v){if(v!==undefined&&v!==null&&Number.isFinite(Number(v)))$(id).value=String(v)}
function loadStage(prefix,d){if(!d)return; $(`${prefix}-enabled`).checked=!!d.enabled;if(d.type)$(`${prefix}-type`).value=d.type;setNum(`${prefix}-count`,d.count);setNum(`${prefix}-tick`,d.tick);if(d.directionMode)$(`${prefix}-direction-mode`).value=d.directionMode;setNum(`${prefix}-angle`,d.angle);setNum(`${prefix}-distance`,d.distance);setNum(`${prefix}-y-impulse`,d.yImpulse);setNum(`${prefix}-efficiency`,d.efficiency)}
function resetAll(){ location.reload(); }

function initialize(){
  createGrid(); eastPreset(); updateTargetReadout(); runSimulation();
  $("primary-clear").addEventListener("click",clearGrid); $("primary-east-preset").addEventListener("click",eastPreset); $("calculate-button").addEventListener("click",runSimulation); $("auto-design-button").addEventListener("click",autoDesign); $("calibrate-button").addEventListener("click",calibrate); $("export-button").addEventListener("click",exportSettings); $("reset-button").addEventListener("click",resetAll); $("import-input").addEventListener("change",e=>{if(e.target.files[0])importSettings(e.target.files[0]);});
  ["launch-x","launch-z","target-x","target-z","target-enabled"].forEach(id=>$(id).addEventListener("input",updateTargetReadout));
  document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-view]").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentView=b.dataset.view;if(lastResult)drawTrajectory(lastResult)}));
  $("primary-efficiency").addEventListener("input",()=>{$("current-efficiency-readout").textContent=fmt(num("primary-efficiency"),3)});
  console.log("MFDCO TNT Cannon Simulator loaded.");
}
initialize();
