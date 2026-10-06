import {detachProduction} from './production.mjs';
export function bulkDelete(p,{units=false,team='all',labels=false,symbols=false,facilities=false,images=false,radars=false,communications=false}={}){
 const gone=new Set(units?p.units.filter(u=>team==='all'||u.team===team).map(u=>u.id):[]);
 // Cascades include aircraft launched by a deleted host and subsequent re-sorties.
 let changed=true;while(changed){changed=false;for(const u of p.units)if(gone.has(u.launchFrom)&&!gone.has(u.id)){gone.add(u.id);changed=true;}for(const h of p.hangars)for(const r of h.sorties)if(gone.has(r.reuseFrom)&&!gone.has(r.unitId)){gone.add(r.unitId);changed=true;}}
 p.mounts=(p.mounts||[]).filter(m=>!gone.has(m.hostId));p.mounts.forEach(m=>m.events=m.events.filter(e=>!gone.has(e.target)));
 detachProduction(p,[...gone]);p.units=p.units.filter(u=>!gone.has(u.id));for(const u of p.units){if(gone.has(u.target))u.target='';if(gone.has(u.hq))u.hq='';u.orders=u.orders.filter(o=>!gone.has(o.target));}
 p.hangars=p.hangars.filter(h=>!gone.has(h.hostId));p.hangars.forEach(h=>h.sorties=h.sorties.filter(r=>!gone.has(r.unitId)));p.vls=p.vls.filter(r=>!gone.has(r.unitId));for(const r of p.vls)for(const c of r.cells)if(gone.has(c.missileId)){c.status='empty';c.missileId='';}
 p.groups.forEach(g=>g.members=g.members.filter(id=>!gone.has(id)));p.groups=p.groups.filter(g=>g.members.length);p.radars=radars?[]:p.radars.filter(r=>!gone.has(r.unitId));p.communications=communications?[]:p.communications.map(m=>({...m,unitId:gone.has(m.unitId)?'':m.unitId}));
 if(labels)p.labels=[];if(symbols)p.mapSymbols=[];if(facilities){for(const m of p.mounts)if(m.supplyId){m.supplyId='';m.reserve=0;}p.facilities=[];p.deliveries=[];}if(images)p.mapImages=[];return gone.size;
}
