// Display-only radar. Angles are clockwise from north; time is simulation minutes.
export const defaultRadars=p=>[{id:'r1',name:'中央レーダー',x:500,y:500,radiusKm:Math.min(p.widthKm,p.heightKm)*.48,speed:30,phase:0,enabled:true}];
export function validateRadars(radars,units=[]){
 const num=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
 if(!Array.isArray(radars)||radars.length>16)throw new Error('レーダーは16基までです。');
 const ids=new Set();for(const r of radars){if(!r||typeof r.id!=='string'||!r.id||r.id.length>40||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>60||!num(r.x,0,1000)||!num(r.y,0,1000)||!num(r.radiusKm,.01,2000)||!num(r.speed,-3600,3600)||!num(r.phase,0,359.999999)||typeof r.enabled!=='boolean')throw new Error('レーダーの名前・座標・半径・回転設定が不正です。');if(r.unitId!==undefined&&(typeof r.unitId!=='string'||r.unitId&&!units.some(u=>u.id===r.unitId)))throw new Error('レーダーの追従先が存在しません。');if(r.detectMode!==undefined&&!['all','air','surface'].includes(r.detectMode))throw new Error('レーダー探知区分が不正です。');if(r.team!==undefined&&!['blue','red','neutral'].includes(r.team)||r.detectTarget!==undefined&&!['enemy','all','blue','red','neutral'].includes(r.detectTarget))throw new Error('レーダーの所属・探知対象が不正です。');ids.add(r.id);}
 return radars;
}
export const wrapAngle=a=>((a%360)+360)%360;
export const sweepAngle=(r,frame,secondsPerFrame=60)=>wrapAngle(r.phase+r.speed*frame*secondsPerFrame/60);
export function detectionOpacity(p,radars,frame,pos,hide,trail){
 if(!hide)return 1;let opacity=0;
 for(const r of radars){if(!r.enabled)continue;const dx=(pos.x-r.x)*p.widthKm/1000,dy=(pos.y-r.y)*p.heightKm/1000;
  if(Math.hypot(dx,dy)>r.radiusKm+1e-9)continue;
  if(Math.hypot(dx,dy)<1e-9)return 1;
  const bearing=wrapAngle(Math.atan2(dx,-dy)*180/Math.PI),angle=sweepAngle(r,frame,p.secondsPerFrame??60),speed=Math.abs(r.speed)*(p.secondsPerFrame??60)/60;
  const angularGap=wrapAngle((angle-bearing)*(r.speed<0?-1:1));
  // A small finite beam remains visible when rotation is stopped.
  if(speed===0){if(Math.min(angularGap,360-angularGap)<=1.5)opacity=1;continue;}
  const age=angularGap/speed;
  if(age<=frame+1e-9&&age<trail)opacity=Math.max(opacity,Math.max(.15,1-age/trail));
 }
 return opacity;
}

// Resolve from the requested frame only: no previous draw or wall clock dependency.
export function resolveRadars(project,states,frame){
 const map=new Map(states.map(s=>[s.id,s]));
 return (project.radars||defaultRadars(project)).map(r=>{
  if(!r.unitId)return {...r,enabled:r.enabled&&((r.team||'blue')!=='neutral'||(r.detectTarget||'enemy')!=='enemy')};
  const u=project.units.find(u=>u.id===r.unitId),s=map.get(r.unitId);
  return {...r,x:s?.x??u?.x??r.x,y:s?.y??u?.y??r.y,enabled:!!(r.enabled&&u&&s&&s.hp>0&&!s.recovered&&!s.mergedInto&&frame*60>=u.start*60&&(u.team!=='neutral'||(r.detectTarget||'enemy')!=='enemy'))};
 });
}
export function radarForUnit(project,u){let n=1;while(project.radars.some(r=>r.id==='r'+n))n++;return{id:'r'+n,name:(u.name+' レーダー').slice(0,60),unitId:u.id,x:u.x,y:u.y,radiusKm:u.type==='awacs'?50:10,speed:30,phase:0,enabled:u.team!=='neutral',detectTarget:'enemy'};}

export function radarTargetTeams(project,r){const owner=r.unitId?project.units.find(u=>u.id===r.unitId)?.team:(r.team||'blue'),target=r.detectTarget||'enemy';if(target==='all')return ['blue','red','neutral'];if(target!=='enemy')return [target];return owner==='blue'?['red']:owner==='red'?['blue']:[];}
export function radarVisibility(project,radars,frame,u,state,hide,trail,states=[]){
 if(!(project.radarTeams||['blue','red','neutral']).includes(u.team))return 0;
 if(!hide)return 1;
 if(u.alwaysVisible)return 1;
 const policy=project.radarPolicy?.[u.team]??(u.team==='red'?'scan':'always');
 if(policy==='hidden')return 0;if(policy==='always')return 1;
 if(contactVisible(project,u,state,states,frame))return 1;
 const domain=project.defaults.find(t=>t.id===u.type)?.domain;
 const scanners=radars.filter(r=>radarTargetTeams(project,r).includes(u.team)&&(!r.detectMode||r.detectMode==='all'||(r.detectMode==='air'?domain==='air':domain!=='air')));
 return detectionOpacity(project,scanners,frame,state,true,trail);
}

export function contactVisible(p,u,state,states,frame){const by=new Map(p.units.map(v=>[v.id,v])),active=s=>s.hp>0&&!s.spent&&!s.recovered&&!s.mergedInto&&frame>=(by.get(s.id)?.start??Infinity);if(!active({...state,id:u.id}))return false;for(const s of states){if(!active(s))continue;const observer=by.get(s.id);if(s.target&&(s.status?.includes('交戦')||s.status?.includes('応射'))&&(s.id===u.id||s.target===u.id))return true;if(observer.team===(p.observerTeam||'blue')&&u.team!==observer.team&&u.team!=='neutral'&&Math.hypot((s.x-state.x)*p.widthKm/1000,(s.y-state.y)*p.heightKm/1000)<=(observer.detectionRange??observer.range))return true;}return false;}
