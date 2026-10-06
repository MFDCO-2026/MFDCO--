import {requiresSimulation} from './planning.mjs';
import {BattleSimulation} from './combat.mjs';
import {compile,stateAt} from './engine.mjs';
import {packReplay} from './replay.mjs';
let sim;
self.onmessage=e=>{const {type,project,frame,id,view,end}=e.data;try{
 if(type==='init'){sim=new BattleSimulation(project);return;}
 if(type==='export'||type==='video'){const last=type==='video'?Math.min(project.duration,Math.max(0,end)):project.duration;
  if(project.units.length>80||project.duration>10000)throw new Error('リプレイ保存は80部隊・10000frame以内です。');
  let run=requiresSimulation(project)?new BattleSimulation(project):null,paths=new Map(project.units.map(u=>[u.id,compile(project,u)])),snapshots=[];
  for(let f=0;f<=last;f++){snapshots.push(run?run.seek(f):project.units.map(u=>({id:u.id,...stateAt(u,paths.get(u.id),f*(project.secondsPerFrame??60)),hp:u.hp,maxHp:u.hp,personnel:u.personnel,attack:u.attack,reason:'経路移動'})));if(f%30===0)self.postMessage({type:'progress',id,frame:f,target:last});}
  let events=run?run.eventsAt(last):project.units.flatMap(u=>paths.get(u.id).events).filter(e=>e.time<=last*(project.secondsPerFrame??60)).sort((a,b)=>a.time-b.time||a.unit.localeCompare(b.unit));
  self.postMessage({type:'exported',id,replay:packReplay(project,snapshots,events,view)});return;
 }
 if(type==='seek'){if(!sim)throw new Error('計算の初期化が必要です');const end=Math.min(frame,sim.p.duration);while(sim.sec<end*sim.p.secondsPerFrame){sim.step();if(sim.sec%1800===0)self.postMessage({type:'progress',id,frame:sim.sec/sim.p.secondsPerFrame,target:end});}self.postMessage({type:'result',id,frame:end,states:sim.seek(end),events:sim.eventsAt(end)});}
}catch(error){self.postMessage({type:'error',id,message:error.message});}};
