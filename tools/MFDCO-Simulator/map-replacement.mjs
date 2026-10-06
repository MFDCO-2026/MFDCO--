// A replaced map must not leave live links to facilities that no longer exist.
export function reconcileMapReferences(p){const ids=new Set(p.facilities.map(f=>f.id));let disconnected=0;for(const m of p.mounts||[])if(m.supplyId&&!ids.has(m.supplyId)){m.supplyId='';m.reserve=0;disconnected++;}p.deliveries=(p.deliveries||[]).filter(d=>ids.has(d.from)&&ids.has(d.to));return disconnected;}
