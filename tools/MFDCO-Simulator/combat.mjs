import {deliveryStep} from './deliveries.mjs';
import {initialWeaponStates,weaponStep} from './weapons.mjs';
import {consumeWeaponSupply,validateLogistics,logisticsStep,supplySpeed,supplyFire,powerBalance,isCivilian} from './logistics.mjs';
import {missileCandidate} from './beta-model.mjs';
import {coverBonus,mineHits,facilitySupportRate} from './facilities.mjs';
import {effectiveAttack} from './strength.mjs';
import {flightStep} from './missile.mjs';
import {radarForUnit} from './radar.mjs';
import {copy,clamp,compile,stateAt,distance,terrainAt,TERRAIN,fresh,unit,canTarget} from './engine.mjs';
export const ACTIONS={move:'移動',wait:'待機',fire:'射撃',defend:'防衛',assault:'突撃',free:'自由',follow:'追従',merge:'合流'};
export const PERSONALITIES={balanced:'標準',cautious:'慎重',aggressive:'積極的',support:'支援重視'};
export const COMBAT_DEFAULTS={action:'move',defense:0,retreatPercent:50,repairRate:1,personality:'balanced',leash:5,target:'',hq:''};
const round=n=>Math.round(n*1e6)/1e6;
const compare=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;
const enemy=(a,b)=>a.team!=='neutral'&&b.team!=='neutral'&&a.team!==b.team;
export function setupUnit(u){return {...COMBAT_DEFAULTS,...u};}
export function combatSample(kind='land'){
 const p=fresh(true);p.title=kind==='sea'?'艦隊演習・損害と応急修理':'交戦演習・支援と撤退';p.combatEnabled=true;p.duration=30;p.widthKm=10;p.heightKm=6;p.terrain.fill(kind==='sea'?'water':'plain');p.labels=[];p.nextId=10;
 if(kind==='balance'){
  p.title='戦闘調整演習・前進応射と密集表示';p.duration=20;p.widthKm=8;p.heightKm=5;p.units=[unit('u1','infantry',200,500),unit('u2','marines',200,500),unit('u3','apc',200,500),unit('u4','infantry',650,500,'red')];p.units.forEach(u=>Object.assign(u,{hp:1000,personnel:u.type==='apc'?4:1000,attack:20,range:3,retreatPercent:0}));p.units[0].points=[{x:550,y:500,wait:0}];p.units[1].action='assault';p.units[1].target='u4';p.units[2].action='assault';p.units[2].target='u4';p.units[3].action='defend';
 }else if(kind==='domains'){
  p.title='攻撃対象演習・対空と対地';p.duration=4;p.units=[unit('u1','antiair',300,400),unit('u2','antitank',300,650),unit('u3','helicopter',480,400,'red'),unit('u4','armor',480,650,'red'),unit('u5','fighter',150,200)];p.units.forEach(u=>Object.assign(u,{action:['u3','u4'].includes(u.id)?'wait':'defend',hp:5000,retreatPercent:0,range:4,attack:3}));
 }else if(kind==='missile'){
  p.title='ミサイル演習・3発の同時飛翔';p.widthKm=100;p.heightKm=60;p.duration=5;p.terrain.fill('plain');p.units=[unit('u1','missile',100,500),unit('u2','armor',900,500,'red')];Object.assign(p.units[0],{target:'u2',speed:1200,salvo:3,attack:100});Object.assign(p.units[1],{name:'標的車両',action:'wait',hp:1000,defense:100,retreatPercent:0});
 }else if(kind==='mobile'){
  p.title='移動レーダー演習・車両と早期警戒機';p.widthKm=80;p.heightKm=50;p.combatEnabled=false;p.duration=20;p.units=[unit('u1','radar_vehicle',150,650),unit('u2','awacs',200,250),unit('u3','aircraft',700,350,'red')];p.units[0].points=[{x:600,y:650,wait:0}];p.units[1].points=[{x:750,y:250,wait:2},{x:200,y:250,wait:0}];p.units[2].points=[{x:250,y:500,wait:0}];p.radars=[];p.radars.push(radarForUnit(p,p.units[0]));p.radars.push(radarForUnit(p,p.units[1]));
 }else if(kind==='waypoints'){
  p.title='予定経路演習・中継地点で待機して防衛';p.duration=20;p.units=[unit('u1','mechanized',100,700)];Object.assign(p.units[0],{name:'経由地演習隊',action:'wait',speed:30,orders:[{at:2,action:'move',target:'',x:400,y:700,points:[{x:400,y:700,wait:2},{x:400,y:300,wait:1},{x:700,y:300,wait:0}],afterAction:'defend',afterWait:0}]});
 }else if(kind==='completion'){
  p.title='移動完了後・防衛への切り替え';p.duration=12;p.units=[unit('u1','armor',100,500),unit('u2','infantry',600,500,'red')];Object.assign(p.units[0],{name:'前進防衛隊',speed:30,points:[{x:400,y:500,wait:0}],afterAction:'defend',afterWait:1,attack:2,range:3,hp:1000});Object.assign(p.units[1],{name:'待機目標隊',action:'wait',hp:3000,retreatPercent:0});
 }else if(kind==='radar'){
  p.title='複数レーダー演習・東西の探知範囲';p.combatEnabled=false;p.duration=40;p.widthKm=40;p.heightKm=25;p.radars=[{id:'r1',name:'西部局',x:250,y:500,radiusKm:9,speed:30,phase:0,enabled:true},{id:'r2',name:'東部局',x:750,y:500,radiusKm:9,speed:-45,phase:90,enabled:true}];p.units=[unit('u1','mechanized',100,400),unit('u2','mortar',300,550),unit('u3','helicopter',100,200,'red')];p.units[0].points=[{x:900,y:400,wait:0}];p.units[2].points=[{x:900,y:800,wait:2},{x:100,y:200,wait:2},{x:900,y:800,wait:0}];
 }else if(kind==='orders'){
  p.title='予定命令演習・待機から移動と防衛';p.duration=15;p.units=[unit('u1','armor',150,500)];Object.assign(p.units[0],{name:'時刻表演習隊',action:'wait',speed:30,orders:[{at:2,action:'move',target:'',x:450,y:500},{at:9,action:'defend',target:'',x:450,y:500},{at:12,action:'move',target:'',x:150,y:500}]});
 }else if(kind==='merge'){
  p.title='合流演習・戦力の統合';p.duration=12;p.units=[unit('u1','infantry',300,500),unit('u2','infantry',550,500)].map(setupUnit);Object.assign(p.units[0],{name:'第1分隊',hp:400,personnel:40,action:'merge',target:'u2',speed:24});Object.assign(p.units[1],{name:'第2分隊',hp:600,personnel:60,action:'wait'});
 }else if(kind==='sea'){
  p.units=[unit('u1','destroyer',300,500),unit('u2','cruiser',530,500,'red')].map(setupUnit);
  Object.assign(p.units[0],{name:'青艦隊 はやしお',hp:1000,attack:8,range:4,defense:20,retreatPercent:50,repairRate:4,action:'defend'});
  Object.assign(p.units[1],{name:'赤艦隊 あかつき',hp:1600,attack:4,range:4,defense:30,repairRate:2,action:'defend'});
 }else{
  p.units=[unit('u1','infantry',380,490),unit('u2','infantry',460,510,'red'),unit('u3','armor',180,620),unit('u4','hq',90,470),unit('u5','hq',840,490,'red')].map(setupUnit);
  Object.assign(p.units[0],{name:'第1歩兵大隊',hp:1000,attack:4,range:1.1,defense:20,action:'defend',speed:24,hq:'u4'});
  Object.assign(p.units[1],{name:'第2歩兵大隊',hp:1600,attack:9,range:1.1,defense:10,action:'defend',speed:12,hq:'u5'});
  Object.assign(p.units[2],{name:'支援戦車隊',hp:1500,attack:7,range:1.3,defense:60,action:'free',personality:'support',leash:5,speed:18,start:2});
  Object.assign(p.units[3],{name:'青陣営司令部',action:'wait',hp:3000});Object.assign(p.units[4],{name:'赤陣営司令部',action:'wait',hp:3000});
 }
 return p;
}
export class BattleSimulation{
 constructor(project){this.p=validateLogistics(copy(project));this.p.mounts??=[];this.facilityStocks={};this.transfers={};this.units=this.p.units.map(u=>setupUnit({...u,action:this.p.combatEnabled?(isCivilian(u)&&!['move','wait','follow'].includes(u.action)?'wait':u.action):'move'})).sort(compare);this.byId=new Map(this.units.map(u=>[u.id,u]));this.routes=new Map(this.units.map(u=>[u.id,compile(this.p,u)]));this.sec=0;this.events=[];this.frames=new Map();this.states=this.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,maxHp:u.hp,attack:u.attack,personnel:u.personnel??100,mergedInto:'',status:u.start>0?'開始待ち':'待機',reason:'命令開始前',target:'',retreat:false,repair:false,evacuated:false,routeClock:u.start*this.p.secondsPerFrame,routeDone:false,...(this.p.mounts.some(m=>m.hostId===u.id)?{weaponStates:initialWeaponStates(this.p,u.id)}:{}),...(this.p.logisticsEnabled?{fuel:u.initialFuel,ammo:u.initialAmmo,food:u.initialFood}:{})}));this.frames.set(0,this.snapshot());}
 applyDepartures(){for(const u of this.units){if(!u.launchFrom||this.sec<Math.ceil(u.start*this.p.secondsPerFrame))continue;const s=this.states.find(s=>s.id===u.id);if(s.launchResolved)continue;s.launchResolved=true;const reservation=this.p.hangars?.flatMap(h=>h.sorties).find(r=>r.unitId===u.id),source=reservation?.reuseFrom?this.states.find(v=>v.id===reservation.reuseFrom):null;if(reservation?.reuseFrom&&(!source?.recovered||source.recoveredCount<u.personnel)){s.hp=0;s.personnel=0;s.spent=true;s.status='発艦中止';s.reason='回収機数が不足して再出撃できません';this.emit(this.sec,s,s.reason,'発艦');continue;}if(source)s.hp=round(u.hp*source.hp/source.maxHp);const host=this.states.find(s=>s.id===u.launchFrom),owner=this.byId.get(u.launchFrom);if(!host||host.hp<=0||host.spent||host.mergedInto||this.sec<owner.start*this.p.secondsPerFrame){s.hp=0;s.personnel=0;s.spent=true;s.status='発艦中止';s.reason='母体が活動できないため発艦中止';this.emit(this.sec,s,s.reason,'発艦');continue;}s.x=host.x;s.y=host.y;s.routeClock=this.sec;this.routes.set(u.id,compile(this.p,{...u,x:s.x,y:s.y}));this.emit(this.sec,s,owner.name+'から'+u.personnel+'機が発艦','発艦');}}
 applyOrders(){

  for(let i=0;i<this.units.length;i++){
   const u=this.units[i],s=this.states[i],o=(u.orders||[]).find(o=>o.at*this.p.secondsPerFrame===this.sec);if(!o)continue;
   if(s.hp<=0||s.mergedInto||s.recovered){this.emit(this.sec,s,'予定命令を省略：壊滅・合流済み','命令');continue;}
   u.action=o.action;u.target=o.target;u.speed=o.speed??this.p.units.find(v=>v.id===u.id).speed;u.afterAction=o.afterAction??'none';u.afterWait=o.afterWait??0;s.afterAt=null;
   // Each scheduled route starts at the actual current position. Keep original unit origin for retreat.
   const routeUnit={...u,x:s.x,y:s.y,start:o.at,points:o.action==='move'?copy(o.points??[{x:o.x,y:o.y,wait:0}]):[]};
   u.points=routeUnit.points;this.routes.set(u.id,compile(this.p,routeUnit));s.routeClock=this.sec;s.routeDone=false;s.target='';
   this.emit(this.sec,s,`予定命令：${ACTIONS[o.action]}${s.retreat||s.repair?'（撤退・修理を優先）':''}`,'命令');
  }
 }
 applyCompletion(){

  for(let i=0;i<this.units.length;i++){const u=this.units[i],s=this.states[i];if(s.afterAt==null||this.sec<s.afterAt)continue;s.afterAt=null;if(s.hp<=0||s.mergedInto||s.recovered)continue;
   u.action=u.afterAction;u.target='';u.points=[];this.emit(this.sec,s,`移動完了後：${ACTIONS[u.action]}を開始${s.retreat||s.repair?'（撤退・修理を優先）':''}`,'命令');
  }
 }
 domain(u){return this.p.defaults.find(t=>t.id===u.type)?.domain||'land';}
 emit(time,s,label,kind='状態'){if(this.events.length<20000)this.events.push({time,recordedAt:this.sec+1,unit:s.id,label,kind});}
 step(){
  this.p.simSeconds=this.sec;if(this.p.powerEnabled){this.p._powerBalance=powerBalance(this.p,this.sec);this.p._powerSeconds=this.sec;}this.applyDepartures();this.applyOrders();this.applyCompletion();
  const time=this.sec,old=this.states,next=old.map(s=>({...s,...(s.weaponStates?{weaponStates:copy(s.weaponStates)}:{})})),index=new Map(old.map((s,i)=>[s.id,i])),damage=new Array(old.length).fill(0),incoming=old.map(()=>[]),merges=[];
  const live=s=>s.hp>0;const active=s=>live(s)&&!s.recovered&&time>=this.byId.get(s.id).start*this.p.secondsPerFrame;
  const nearest=(arr,s)=>arr.sort((a,b)=>distance(this.p,s,a)-distance(this.p,s,b)||compare(a,b))[0];
  for(let i=0;i<old.length;i++){
   const s=old[i],n=next[i],u=this.units[i],domain=this.domain(u);n.target='';
   if(s.recovered){n.target='';continue;}if(s.spent){n.target='';continue;}
   if(s.mergedInto){n.status='合流済み';continue;}
   if(!live(s)){n.status=domain==='sea'?'撃沈':'壊滅';n.reason='HPが0になりました';continue;}
   if(!active(s)){n.status='開始待ち';n.reason='開始時刻まで待機';continue;}
   if(time===Math.ceil(u.start*this.p.secondsPerFrame))this.emit(time,s,ACTIONS[u.action]+'を開始','開始');
   if(u.launchFrom&&u.returnAt!=null&&time>=u.returnAt*this.p.secondsPerFrame){const host=old.find(v=>v.id===u.launchFrom&&active(v)&&!v.mergedInto&&!v.spent);if(!host){n.status='帰投先喪失';n.reason='母体を失ったため現在位置で待機';continue;}n.target=host.id;n.status='帰投';n.reason='母体の現在位置へ帰投中';Object.assign(n,this.move(s,host,u,.02));if(distance(this.p,n,host)<=.05)n.pendingRecovery=true;continue;}
   if(this.p.combatEnabled&&u.type==='missile'&&u.missileFlight){
    const target=old.find(v=>v.id===(s.flightTarget||u.target)&&active(v)&&enemy(u,this.byId.get(v.id))&&canTarget(this.p,u,this.byId.get(v.id)))||(!s.launched&&!u.target?missileCandidate(this.p,u,s,old.filter(active)):null);
    if(!s.launched&&!['assault','fire'].includes(u.action)){n.status='発射待機';n.reason='攻撃命令で発射';continue;}
    if(!target){if(s.launched){n.spent=true;n.status='失探消滅';n.reason='目標が不在になりました';this.emit(time+1,n,n.reason,'飛翔');}else{n.status='発射待機';n.reason='前方に攻撃可能な敵がいません';}continue;}
    n.launched=true;n.flightTarget=target.id;n.target=target.id;
    if(!s.launched)this.emit(time,s,`${u.salvo||1}発を同時発射`,'発射');
    const flight=flightStep(this.p,s,target,u.speed);n.x=flight.x;n.y=flight.y;n.status='飛翔';n.reason='ロックした目標の現在位置へ追尾';
    if(flight.arrived){damage[index.get(target.id)]+=round(u.attack*(u.salvo||1)*(this.p.damageScale??.05)*100/(100+this.byId.get(target.id).defense+coverBonus(this.p,this.byId.get(target.id),target)));n.spent=true;n.status='着弾済み';n.reason=`${u.salvo||1}発が到達`;this.emit(time+1,n,n.reason,'着弾');}continue;
   }
   let enemies=old.filter(v=>this.p.combatEnabled&&active(v)&&enemy(u,this.byId.get(v.id))&&canTarget(this.p,u,this.byId.get(v.id)));
   const allies=old.filter(v=>active(v)&&v.id!==s.id&&u.team===this.byId.get(v.id).team);
   const ratio=s.hp/s.maxHp*100;
   if(domain==='sea'&&u.retreatPercent>0&&ratio<=u.retreatPercent&&!n.repair){n.repair=true;this.emit(time,s,'損害閾値に到達・応急修理を開始','修理');}
   if(domain==='land'&&u.type!=='hq'&&u.retreatPercent>0&&ratio<=u.retreatPercent&&!n.retreat){n.retreat=true;this.emit(time,s,'損害閾値に到達・撤退を開始','撤退');}
   if(n.repair){n.status='修理';n.reason='被弾していない秒だけHP75%まで応急修理';continue;}
   if(n.retreat){
    let hq=allies.find(v=>v.id===u.hq&&this.byId.get(v.id).type==='hq')||nearest(allies.filter(v=>this.byId.get(v.id).type==='hq'),s);let dest=hq||{x:u.x,y:u.y};
    if(s.evacuated||distance(this.p,s,dest)<.05){n.evacuated=true;n.status='退避完了';n.reason=hq?'司令部に到着（戦力統合は未実装）':'開始地点に退避';if(!s.evacuated)this.emit(time,s,n.reason,'退避');continue;}
    let moved=this.move(s,dest,u);Object.assign(n,moved);n.status=moved.blocked?'退路閉塞':'撤退';n.reason=moved.blocked?'通行不可の地形で停止・射程内に応戦':hq?'味方司令部へ退避':'司令部なし・開始地点へ退避';if(!moved.blocked)continue;
   }
   if(u.action==='merge'){
    let dest=allies.find(v=>v.id===u.target&&this.byId.get(v.id).type===u.type);if(!dest){n.status='合流待機';n.reason='合流先が不在・対象を指定してください';continue;}
    if(distance(this.p,s,dest)<=.05){merges.push([i,index.get(dest.id)]);n.status='合流準備';n.reason='同じ兵科へ戦力を統合';}
    else{let moved=this.move(s,dest,u);Object.assign(n,moved);n.status=moved.blocked?'通行不可':'合流へ移動';n.reason=moved.blocked?'合流経路が地形で閉塞':'指定した味方部隊へ移動';}continue;
   }
   let candidate=null,explicit=enemies.find(v=>v.id===u.target),inRange=enemies.filter(v=>distance(this.p,s,v)<=u.range);
   if(['fire','defend'].includes(u.action)||n.retreat){candidate=explicit&&distance(this.p,s,explicit)<=u.range?explicit:(!u.target||u.action==='defend'||n.retreat)?nearest(inRange,s):null;n.status=n.retreat?'退路閉塞':u.action==='defend'?'防衛':'射撃待機';n.reason=candidate?'射程内の目標を選択':'射程内に攻撃可能な目標なし';}
   else if(u.action==='assault'){candidate=explicit||(!u.target?nearest(enemies,s):null);n.status='突撃';n.reason=candidate?'目標への接近を優先':'指定目標が不在・待機';}
   else if(u.action==='free'){
    let radius=u.leash*(u.personality==='cautious'?.65:u.personality==='aggressive'?1.4:1);let available=enemies.filter(v=>distance(this.p,u,v)<=radius);
    let threatened=allies.filter(v=>v.retreat||v.hp/v.maxHp<.6);
    let threats=available.filter(e=>threatened.some(a=>distance(this.p,e,a)<=this.byId.get(e.id).range&&canTarget(this.p,this.byId.get(e.id),this.byId.get(a.id))));
    let chosen=u.personality==='support'&&threats.length?threats:available;
    let previous=chosen.find(v=>v.id===s.target);candidate=previous&&time%5!==0?previous:nearest(chosen,s);
    n.status='自由';n.reason=candidate?(u.personality==='support'&&threats.length?'損害を受けた味方・撤退部隊を掩護':'行動半径内の敵へ対応'):'敵なし・経路または開始地点へ復帰';
   }
   else if(u.action==='follow'){
    let leader=allies.find(v=>v.id===u.target);if(leader){if(distance(this.p,s,leader)>.15)Object.assign(n,this.move(s,leader,u));candidate=enemies.find(v=>v.id===leader.target&&distance(this.p,s,v)<=u.range)||nearest(inRange,s);n.status='追従';n.reason='味方部隊に追従・射程内で支援';}else{n.status='待機';n.reason='追従先が不在・停止';}
   }
   else if(u.action==='move'&&this.p.returnFire!==false){candidate=nearest(inRange.filter(v=>(s.attackers||[]).includes(v.id)),s);}
   else if(u.action==='wait'){n.status='待機';n.reason='待機命令・自発攻撃なし';}
   if((u.action==='move'||u.action==='free'&&!candidate)&&!n.retreat){
    if(u.action==='free'&&!u.points.length){if(distance(this.p,s,u)>.01)Object.assign(n,this.move(s,u,u));n.status=distance(this.p,s,u)>.01?'復帰':'待機';}
    else {let c=this.routes.get(u.id);if(u.action==='move'){let target=stateAt(u,c,s.routeClock+supplySpeed(this.p,u,s));n.routeClock=s.routeClock+supplySpeed(this.p,u,s);n.x=target.x;n.y=target.y;n.status=target.status;n.reason=s.afterAt!=null?'完了後の行動まで待機':'設定された経路を移動';if(s.afterAt!=null)n.status='完了後待機';}
    else{let target=stateAt(u,c,s.routeClock+supplySpeed(this.p,u,s)),gap=distance(this.p,s,target),limit=u.speed/3600*1.5;if(gap>limit){Object.assign(n,this.move(s,target,u));n.status='復帰';n.reason='中断した経路に復帰';}else{n.x=target.x;n.y=target.y;n.routeClock=s.routeClock+supplySpeed(this.p,u,s);n.status=target.status;n.reason='設定された経路を移動';}}
    if(n.status==='完了'&&!s.routeDone){n.routeDone=true;this.emit(time+1,n,'移動経路を完了','完了');if(u.action==='move'&&u.afterAction&&u.afterAction!=='none'){n.afterAt=time+1+(u.afterWait||0)*60;this.emit(time+1,n,`${u.afterWait||0}分待機後に${ACTIONS[u.afterAction]}へ切替予定`,'命令');}}}
   }
   if(candidate){
    n.target=candidate.id;let d=distance(this.p,s,candidate);
    if(d>u.range&&['free','assault'].includes(u.action)){let moved=this.move(s,candidate,u,Math.max(.02,u.range*.9));Object.assign(n,moved);if(moved.blocked){n.status='通行不可';n.reason='接近経路が地形で閉塞';}}
    if(d<=u.range&&s.attack>0&&!(this.p.weaponControlEnabled&&this.p.mounts.some(m=>m.hostId===u.id))){let targetUnit=this.byId.get(candidate.id),j=index.get(candidate.id);const amount=round(effectiveAttack(this.p,s)*supplyFire(this.p,u,s)*(this.p.damageScale??.05)*100/(100+targetUnit.defense+coverBonus(this.p,targetUnit,candidate)));damage[j]+=amount;if(amount>0&&this.p.logisticsEnabled)n.fired=true;if(amount>0)incoming[j].push(s.id);n.status=n.retreat?'退路閉塞・応戦':u.action==='move'?'移動・応射':'交戦';if(u.action==='move')n.reason='経路移動を継続しながら直前の攻撃部隊へ応射';if(s.target!==candidate.id||!['交戦','移動・応射'].includes(s.status))this.emit(time,s,`${targetUnit.name}への射撃開始`,'交戦');}
   }
  }
  deliveryStep(this.p,this.facilityStocks,this.transfers,time);
  weaponStep(this.p,this.units,old,next,damage,time,canTarget,distance,(t,s,l,k)=>this.emit(t,s,l,k),(m,u,s,count)=>consumeWeaponSupply(this.p,this.facilityStocks,m.supplyId,u,s,count,time));
  for(let i=0;i<next.length;i++){
   let n=next[i],s=old[i],u=this.units[i];if(this.p.combatEnabled&&s.hp>0&&time>=u.start*this.p.secondsPerFrame){const hits=mineHits(this.p,u,s,n,s.mineHits||[]);n.mineHits=[...(s.mineHits||[]),...hits.map(f=>f.id)];for(const f of hits){damage[i]+=round(f.damage*(this.p.damageScale??.05));this.emit(time+1,n,'地雷原に進入・損害発生','設備');}}n.attackers=incoming[i].length?incoming[i]:(s.retaliateUntil>time?s.attackers||[]:[]);n.retaliateUntil=incoming[i].length?time+5:s.retaliateUntil||0;n.hp=n.spent?0:round(Math.max(0,s.hp-damage[i]));n.personnel=s.hp>0?round(s.personnel*n.hp/s.hp):0;
   if(n.repair&&n.hp>0&&damage[i]===0){n.hp=round(Math.max(n.hp,Math.min(s.maxHp*.75,n.hp+u.repairRate)));if(n.hp>=s.maxHp*.75){n.repair=false;n.status='修理完了';n.reason='HP75%まで回復・次の秒から命令再開';this.emit(time+1,n,'応急修理を完了','修理');}}
   if(!s.recovered&&!n.spent&&n.hp>0&&damage[i]===0&&time>=u.start*this.p.secondsPerFrame){const support=facilitySupportRate(this.p,u,n);if(support>0&&n.hp<n.maxHp){n.hp=round(Math.min(n.maxHp,n.hp+support));if(!s.receivingSupport)this.emit(time+1,n,'施設による回復を開始','回復');n.receivingSupport=true;n.reason=(n.reason||'')+' / 施設で回復';}else n.receivingSupport=false;}else n.receivingSupport=false;
   if(n.hp===0&&s.hp>0&&!n.spent){n.status=this.domain(u)==='sea'?'撃沈':'壊滅';n.reason='HPが0になりました';n.target='';this.emit(time+1,n,n.status,'損失');}
   if(damage[i]>0&&s.hp===s.maxHp)this.emit(time+1,n,'被弾・損害発生','損害');
   if(n.status==='通行不可'&&s.status!=='通行不可')this.emit(time+1,n,n.reason,'停止');
   if(!(u.type==='missile'&&u.missileFlight)){n.x=round(n.x);n.y=round(n.y);}delete n.blocked;
  }
  for(const [from,to] of merges){let a=next[from],b=next[to];if(a.hp<=0||b.hp<=0||a.mergedInto||b.mergedInto)continue;b.hp=round(b.hp+a.hp);b.maxHp=round(b.maxHp+a.maxHp);b.personnel=round(b.personnel+a.personnel);b.attack=round(b.attack+a.attack);a.hp=0;a.maxHp=0;a.personnel=0;a.attack=0;a.mergedInto=b.id;a.target='';a.status='合流済み';a.reason=this.byId.get(b.id).name+'に戦力を統合';this.emit(time+1,a,a.reason,'合流');}
  for(const n of next){if(!n.pendingRecovery)continue;delete n.pendingRecovery;const u=this.byId.get(n.id),host=next.find(h=>h.id===u.launchFrom);if(n.hp>0&&host?.hp>0&&!host.spent&&!host.mergedInto&&distance(this.p,n,host)<=.05){n.recovered=true;n.recoveredCount=Math.min(u.personnel,Math.ceil(n.personnel));n.recoveredAt=time+1;n.status='回収済み';n.reason=n.recoveredCount+'機を母体に回収';n.target='';this.emit(time+1,n,n.reason,'回収');}}
  logisticsStep(this.p,this.units,old,next,this.facilityStocks,time);if(this.p.logisticsEnabled)for(let i=0;i<next.length;i++){const n=next[i],u=this.units[i];if(n.hp>0&&!n.spent&&!n.recovered&&!n.mergedInto&&time>=u.start*this.p.secondsPerFrame&&u.type!=='missile'){if(n.fuel===0&&u.fuelPerKm>0)n.status='燃料切れ';else if(n.ammo===0&&u.ammoPerMinute>0)n.status='弾薬切れ';n.reason=(n.reason||'').split(' / 兵站')[0]+' / 兵站 燃料'+Math.floor(n.fuel)+'%・弾薬'+Math.floor(n.ammo)+'%・食料'+Math.floor(n.food)+'%';}}
  this.states=next;this.sec++;if(this.sec%this.p.secondsPerFrame===0)this.frames.set(this.sec/this.p.secondsPerFrame,this.snapshot());
 }
 move(s,dest,u,stop=0){let d=distance(this.p,s,dest);if(d<=stop)return{x:s.x,y:s.y,blocked:false};const domain=this.domain(u),terrain=terrainAt(this.p,s.x,s.y),factor=this.p.terrainEffects&&domain==='land'?TERRAIN[terrain].factor:1;let ratio=Math.min(1,Math.max(0,d-stop)/d,u.speed*factor*supplySpeed(this.p,u,s)/3600/d),x=s.x+(dest.x-s.x)*ratio,y=s.y+(dest.y-s.y)*ratio;
  if(this.p.terrainEffects){let steps=Math.max(1,Math.ceil(Math.max(Math.abs(x-s.x)*(this.p.terrainCols||30)/1000,Math.abs(y-s.y)*(this.p.terrainRows||20)/1000)*2));for(let k=0;k<=steps;k++){let t=terrainAt(this.p,s.x+(x-s.x)*k/steps,s.y+(y-s.y)*k/steps);if(domain==='land'&&t==='water'||domain==='sea'&&t!=='water')return{x:s.x,y:s.y,blocked:true};}}
  return{x:clamp(x,0,1000),y:clamp(y,0,1000),blocked:false};
 }
 snapshot(){return this.states.map(s=>{const u=this.byId.get(s.id);if(u.launchFrom&&!s.launchResolved&&this.sec>=u.start*this.p.secondsPerFrame){const h=this.states.find(h=>h.id===u.launchFrom),reservation=this.p.hangars?.flatMap(h=>h.sorties).find(r=>r.unitId===u.id),source=reservation?.reuseFrom?this.states.find(v=>v.id===reservation.reuseFrom):null,reuseOk=!reservation?.reuseFrom||source?.recovered&&source.recoveredCount>=u.personnel;return reuseOk&&h&&h.hp>0&&!h.spent&&!h.mergedInto?{...s,hp:source?round(u.hp*source.hp/source.maxHp):s.hp,x:h.x,y:h.y,status:'発艦準備'}:{...s,hp:0,personnel:0,spent:true,status:'発艦中止',reason:'母体が活動できないため発艦中止'};}return {...s};});}
 seek(frame){let f=clamp(Math.round(frame),0,this.p.duration);while(this.sec<f*this.p.secondsPerFrame)this.step();return copy(this.frames.get(f));}
 eventsAt(frame){if(frame===0)return [];return this.events.filter(e=>(e.recordedAt??e.time)<=frame*this.p.secondsPerFrame);}
}
