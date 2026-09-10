'use strict';

const WEATHER_PRESETS = {
  clear: { label: '快晴', rain: 0, visibility: 10, wind: 2 },
  cloudy: { label: '曇り', rain: 1, visibility: 8, wind: 3 },
  lightRain: { label: '小雨', rain: 4, visibility: 7, wind: 4 },
  heavyRain: { label: '大雨', rain: 8, visibility: 4, wind: 6 },
  fog: { label: '霧', rain: 1, visibility: 2, wind: 1 },
  snow: { label: '雪', rain: 5, visibility: 4, wind: 5 },
  storm: { label: '暴風', rain: 9, visibility: 3, wind: 10 },
  custom: { label: 'カスタム', rain: 0, visibility: 10, wind: 0 }
};

const ATTACK_TEMPLATES = {
  slowUav: { label: 'MFDCO 低速UAV', type: 'uav', count: 18, distanceKm: 24, speed: 95, launchStart: 0, launchInterval: 0.7, altitude: 180, bearing: 0, guidance: 'optical', jamRes: 6, chaffRes: 8, weatherRes: 5, stealth: 2, durability: 1 },
  fastUav: { label: 'MFDCO 高速UAV', type: 'uav', count: 12, distanceKm: 35, speed: 170, launchStart: 0, launchInterval: 0.45, altitude: 350, bearing: 45, guidance: 'combined', jamRes: 6, chaffRes: 6, weatherRes: 6, stealth: 3, durability: 1 },
  cruise: { label: 'MFDCO 巡航型', type: 'missile', count: 16, distanceKm: 50, speed: 250, launchStart: 0, launchInterval: 0.25, altitude: 80, bearing: 90, guidance: 'combined', jamRes: 6, chaffRes: 5, weatherRes: 6, stealth: 3, durability: 1 },
  fastMissile: { label: 'MFDCO 高速型', type: 'missile', count: 8, distanceKm: 70, speed: 520, launchStart: 0, launchInterval: 0.5, altitude: 1500, bearing: 120, guidance: 'inertial', jamRes: 8, chaffRes: 8, weatherRes: 8, stealth: 4, durability: 1 },
  highAltitude: { label: 'MFDCO 高高度型', type: 'missile', count: 6, distanceKm: 90, speed: 420, launchStart: 5, launchInterval: 1, altitude: 9000, bearing: 180, guidance: 'radar', jamRes: 5, chaffRes: 4, weatherRes: 8, stealth: 2, durability: 1 }
};

const GUIDANCE_MODELS = {
  inertial: { label: '慣性', jamming: 0.08, chaff: 0.02, weather: 0.05, visibility: 0.02 },
  radio: { label: '電波', jamming: 0.55, chaff: 0.08, weather: 0.06, visibility: 0.02 },
  radar: { label: 'レーダー', jamming: 0.38, chaff: 0.35, weather: 0.12, visibility: 0.03 },
  infrared: { label: '赤外線', jamming: 0.06, chaff: 0.02, weather: 0.28, visibility: 0.12 },
  optical: { label: '光学', jamming: 0.02, chaff: 0.01, weather: 0.28, visibility: 0.48 },
  combined: { label: '複合', jamming: 0.20, chaff: 0.16, weather: 0.12, visibility: 0.08 }
};

const DEFENSE_TYPE_MODELS = {
  missile: { label: 'MISSILE', weather: 0.08, visibility: 0.04, jamming: 0.28, chaff: 0.20 },
  artillery: { label: 'ARTILLERY', weather: 0.13, visibility: 0.16, jamming: 0.04, chaff: 0.02 },
  railgun: { label: 'RAILGUN', weather: 0.10, visibility: 0.12, jamming: 0.05, chaff: 0.02 },
  machinegun: { label: 'MACHINE GUN', weather: 0.17, visibility: 0.20, jamming: 0.02, chaff: 0.01 },
  laser: { label: 'LASER', weather: 0.48, visibility: 0.44, jamming: 0.02, chaff: 0.01 }
};

const DEFENSE_DEFAULTS = {
  missile: { name: '長距離防空A', units: 2, priority: 1, detectionKm: 70, maxRangeKm: 38, minRangeKm: 2, baseP: 72, trackTime: 2, reactionTime: 1.4, firstWave: 4, secondWave: 2, launchInterval: 0.6, simultaneous: 4, ammo: 12, reload: 35, minAlt: 10, maxAlt: 22000, arc: 360, centerBearing: 0, projectileSpeed: 900, magazine: 12, burstDuration: 0, energy: 0, energyUse: 0, cooling: 0 },
  artillery: { name: '防空火砲B', units: 2, priority: 3, detectionKm: 20, maxRangeKm: 8, minRangeKm: 0.3, baseP: 48, trackTime: 1.3, reactionTime: 0.8, firstWave: 8, secondWave: 6, launchInterval: 0.18, simultaneous: 3, ammo: 120, reload: 12, minAlt: 0, maxAlt: 6000, arc: 360, centerBearing: 0, projectileSpeed: 650, magazine: 40, burstDuration: 1.2, energy: 0, energyUse: 0, cooling: 0 },
  railgun: { name: 'レールガンC', units: 1, priority: 2, detectionKm: 35, maxRangeKm: 15, minRangeKm: 0.8, baseP: 60, trackTime: 1.5, reactionTime: 1.0, firstWave: 3, secondWave: 2, launchInterval: 1.2, simultaneous: 2, ammo: 18, reload: 8, minAlt: 0, maxAlt: 10000, arc: 240, centerBearing: 0, projectileSpeed: 1400, magazine: 6, burstDuration: 0, energy: 0, energyUse: 0, cooling: 2 },
  machinegun: { name: 'CIWS D', units: 2, priority: 4, detectionKm: 8, maxRangeKm: 3, minRangeKm: 0.1, baseP: 42, trackTime: 0.7, reactionTime: 0.3, firstWave: 12, secondWave: 10, launchInterval: 0.08, simultaneous: 3, ammo: 600, reload: 15, minAlt: 0, maxAlt: 3000, arc: 360, centerBearing: 0, projectileSpeed: 850, magazine: 120, burstDuration: 0.9, energy: 0, energyUse: 0, cooling: 0 },
  laser: { name: 'レーザーE', units: 1, priority: 5, detectionKm: 10, maxRangeKm: 4, minRangeKm: 0.05, baseP: 70, trackTime: 0.5, reactionTime: 0.2, firstWave: 4, secondWave: 4, launchInterval: 1.0, simultaneous: 2, ammo: 9999, reload: 0, minAlt: 0, maxAlt: 5000, arc: 360, centerBearing: 0, projectileSpeed: 999999, magazine: 9999, burstDuration: 0, energy: 100, energyUse: 14, cooling: 2.2 }
};

let attackGroups = [];
let defenseSystems = [];
let lastResult = null;
let comparePlans = { A: null, B: null };
let currentTimelineFilter = 'ALL';

const $ = (id) => document.getElementById(id);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const num = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;
const sec = (v) => `T+${Math.max(0, v).toFixed(2)}s`;
const escapeHtml = (s) => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function hashString(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function makeRng(runIndex){if($('seed-mode').value==='fixed') return mulberry32(hashString(`${$('seed-value').value}|${runIndex}`));return Math.random;}
function uid(prefix){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}

function init(){
  initWeather();
  loadCustomTemplates();
  addAttackGroup('cruise');
  addDefenseSystem('missile');
  addDefenseSystem('machinegun');
  wireEvents();
  renderLocalPresets();
  validateConfiguration();
}

function initWeather(){
  $('weather-preset').innerHTML = Object.entries(WEATHER_PRESETS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
  $('weather-preset').value='clear';
  applyWeatherPreset();
}

function applyWeatherPreset(){
  const p = WEATHER_PRESETS[$('weather-preset').value] || WEATHER_PRESETS.custom;
  $('rain-level').value=p.rain; $('visibility-level').value=p.visibility; $('wind-level').value=p.wind;
}

function getAllAttackTemplates(){
  const custom = JSON.parse(localStorage.getItem('mfdco-airdefense-attack-templates')||'{}');
  return {...ATTACK_TEMPLATES, ...custom};
}

function addAttackGroup(templateKey='cruise'){
  const t = getAllAttackTemplates()[templateKey] || ATTACK_TEMPLATES.cruise;
  attackGroups.push({id:uid('atk'), templateKey, name:t.label, ...structuredClone(t)});
  renderAttackGroups();
}

function addDefenseSystem(type='missile'){
  const d = DEFENSE_DEFAULTS[type] || DEFENSE_DEFAULTS.missile;
  defenseSystems.push({id:uid('def'), type, ...structuredClone(d)});
  renderDefenseSystems();
}

function renderAttackGroups(){
  const templates = getAllAttackTemplates();
  $('attack-groups').innerHTML = attackGroups.map((g,i)=>`<article class="entity-card" data-attack-id="${g.id}">
    <div class="entity-head"><h3>ATTACK GROUP ${String(i+1).padStart(2,'0')}</h3><div class="entity-actions"><button class="mini-btn" data-action="dup-attack">複製</button><button class="mini-btn danger" data-action="remove-attack">削除</button></div></div>
    <div class="form-grid cols-4">
      <label class="field"><span>TYPE</span><select data-k="type"><option value="missile" ${g.type==='missile'?'selected':''}>MISSILE</option><option value="uav" ${g.type==='uav'?'selected':''}>UAV</option></select></label>
      <label class="field"><span>TEMPLATE</span><select data-k="templateKey">${Object.entries(templates).map(([k,t])=>`<option value="${k}" ${g.templateKey===k?'selected':''}>${escapeHtml(t.label)}</option>`).join('')}</select></label>
      <label class="field span-2"><span>名称</span><input data-k="name" value="${escapeHtml(g.name)}"></label>
      <label class="field"><span>数量</span><input data-k="count" type="number" min="1" max="500" value="${g.count}"></label>
      <label class="field"><span>目標までの距離 km</span><input data-k="distanceKm" type="number" min="0.1" step="0.1" value="${g.distanceKm}"></label>
      <label class="field"><span>速度 m/s</span><input data-k="speed" type="number" min="1" step="1" value="${g.speed}"></label>
      <label class="field"><span>発射開始 sec</span><input data-k="launchStart" type="number" min="0" step="0.1" value="${g.launchStart}"></label>
      <label class="field"><span>発射間隔 sec</span><input data-k="launchInterval" type="number" min="0" step="0.01" value="${g.launchInterval}"></label>
      <label class="field"><span>高度 m</span><input data-k="altitude" type="number" min="0" step="1" value="${g.altitude}"></label>
      <label class="field"><span>侵入方位 °</span><input data-k="bearing" type="number" min="0" max="359.9" step="0.1" value="${g.bearing}"></label>
      <label class="field"><span>誘導方式</span><select data-k="guidance">${Object.entries(GUIDANCE_MODELS).map(([k,v])=>`<option value="${k}" ${g.guidance===k?'selected':''}>${v.label}</option>`).join('')}</select></label>
      <label class="field"><span>妨害耐性 0–10</span><input data-k="jamRes" type="number" min="0" max="10" value="${g.jamRes}"></label>
      <label class="field"><span>チャフ耐性 0–10</span><input data-k="chaffRes" type="number" min="0" max="10" value="${g.chaffRes}"></label>
      <label class="field"><span>天候耐性 0–10</span><input data-k="weatherRes" type="number" min="0" max="10" value="${g.weatherRes}"></label>
      <label class="field"><span>ステルス 0–10</span><input data-k="stealth" type="number" min="0" max="10" value="${g.stealth}"></label>
      <label class="field"><span>耐久</span><input data-k="durability" type="number" min="0.1" max="10" step="0.1" value="${g.durability}"></label>
    </div></article>`).join('');
  refreshTemplateSource(); validateConfiguration();
}

function renderDefenseSystems(){
  $('defense-systems').innerHTML = defenseSystems.map((d,i)=>`<article class="entity-card" data-defense-id="${d.id}">
    <div class="entity-head"><h3>DEFENSE SYSTEM ${String(i+1).padStart(2,'0')}</h3><div class="entity-actions"><button class="mini-btn" data-action="dup-defense">複製</button><button class="mini-btn danger" data-action="remove-defense">削除</button></div></div>
    <div class="form-grid cols-4">
      <label class="field span-2"><span>名称</span><input data-k="name" value="${escapeHtml(d.name)}"></label>
      <label class="field"><span>TYPE</span><select data-k="type">${Object.entries(DEFENSE_TYPE_MODELS).map(([k,v])=>`<option value="${k}" ${d.type===k?'selected':''}>${v.label}</option>`).join('')}</select></label>
      <label class="field"><span>基数</span><input data-k="units" type="number" min="1" max="100" value="${d.units}"></label>
      <label class="field"><span>優先度</span><input data-k="priority" type="number" min="1" max="99" value="${d.priority}"></label>
      <label class="field"><span>探知距離 km</span><input data-k="detectionKm" type="number" min="0.1" step="0.1" value="${d.detectionKm}"></label>
      <label class="field"><span>最大交戦射程 km</span><input data-k="maxRangeKm" type="number" min="0.01" step="0.1" value="${d.maxRangeKm}"></label>
      <label class="field"><span>最低交戦射程 km</span><input data-k="minRangeKm" type="number" min="0" step="0.1" value="${d.minRangeKm}"></label>
      <label class="field"><span>基本迎撃率 %</span><input data-k="baseP" type="number" min="0" max="100" step="0.1" value="${d.baseP}"></label>
      <label class="field"><span>TRACK確立時間 sec</span><input data-k="trackTime" type="number" min="0" step="0.1" value="${d.trackTime}"></label>
      <label class="field"><span>反応時間 sec</span><input data-k="reactionTime" type="number" min="0" step="0.1" value="${d.reactionTime}"></label>
      <label class="field"><span>第一波最大 / 基</span><input data-k="firstWave" type="number" min="0" max="999" value="${d.firstWave}"></label>
      <label class="field"><span>第二波最大 / 基</span><input data-k="secondWave" type="number" min="0" max="999" value="${d.secondWave}"></label>
      <label class="field"><span>発射間隔 sec</span><input data-k="launchInterval" type="number" min="0" step="0.01" value="${d.launchInterval}"></label>
      <label class="field"><span>同時交戦上限 / 基</span><input data-k="simultaneous" type="number" min="1" max="999" value="${d.simultaneous}"></label>
      <label class="field"><span>搭載上限 / 基</span><input data-k="ammo" type="number" min="0" max="99999" value="${d.ammo}"></label>
      <label class="field"><span>再装填 sec</span><input data-k="reload" type="number" min="0" step="0.1" value="${d.reload}"></label>
      <label class="field"><span>最低高度 m</span><input data-k="minAlt" type="number" min="0" value="${d.minAlt}"></label>
      <label class="field"><span>最高高度 m</span><input data-k="maxAlt" type="number" min="0" value="${d.maxAlt}"></label>
      <label class="field"><span>射界 °</span><input data-k="arc" type="number" min="1" max="360" value="${d.arc}"></label>
      <label class="field"><span>射界中心方位 °</span><input data-k="centerBearing" type="number" min="0" max="359.9" step="0.1" value="${d.centerBearing}"></label>
    </div>
    <details class="details-box"><summary>TYPE固有設定</summary><div class="form-grid cols-4" style="margin-top:12px">
      <label class="field"><span>迎撃体/弾速 m/s</span><input data-k="projectileSpeed" type="number" min="1" value="${d.projectileSpeed}"></label>
      <label class="field"><span>マガジン容量</span><input data-k="magazine" type="number" min="1" value="${d.magazine}"></label>
      <label class="field"><span>バースト時間 sec</span><input data-k="burstDuration" type="number" min="0" step="0.1" value="${d.burstDuration}"></label>
      <label class="field"><span>冷却時間 sec</span><input data-k="cooling" type="number" min="0" step="0.1" value="${d.cooling}"></label>
      <label class="field"><span>レーザーEnergy</span><input data-k="energy" type="number" min="0" max="10000" value="${d.energy}"></label>
      <label class="field"><span>1回消費</span><input data-k="energyUse" type="number" min="0" max="1000" value="${d.energyUse}"></label>
    </div></details>
  </article>`).join('');
  validateConfiguration();
}

function wireEvents(){
  $('weather-preset').addEventListener('change',()=>{applyWeatherPreset();validateConfiguration();});
  ['rain-level','visibility-level','wind-level','jamming-level','chaff-level','eccm-level','readiness','engagement-mode','simulation-count','seed-mode','seed-value'].forEach(id=>$(id).addEventListener('input',validateConfiguration));
  $('add-attack-group').addEventListener('click',()=>addAttackGroup());
  $('add-defense-system').addEventListener('click',()=>addDefenseSystem());
  $('attack-groups').addEventListener('input',handleAttackInput);
  $('attack-groups').addEventListener('change',handleAttackInput);
  $('attack-groups').addEventListener('click',handleAttackClick);
  $('defense-systems').addEventListener('input',handleDefenseInput);
  $('defense-systems').addEventListener('change',handleDefenseInput);
  $('defense-systems').addEventListener('click',handleDefenseClick);
  $('simulate-button').addEventListener('click',runMonteCarlo);
  $('timeline-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;currentTimelineFilter=b.dataset.filter;renderTimeline(lastResult);});
  $('save-plan-a').addEventListener('click',()=>saveCompare('A'));
  $('save-plan-b').addEventListener('click',()=>saveCompare('B'));
  $('clear-compare').addEventListener('click',()=>{comparePlans={A:null,B:null};renderCompare();});
  $('save-custom-template').addEventListener('click',saveCustomTemplate);
  $('export-json').addEventListener('click',exportScenario);
  $('import-json').addEventListener('change',importScenario);
  $('reset-all').addEventListener('click',resetAll);
  $('save-local').addEventListener('click',saveLocalPreset);
  $('local-presets').addEventListener('click',handleLocalPresetClick);
}

function handleAttackInput(e){
  const card=e.target.closest('[data-attack-id]'); if(!card)return; const g=attackGroups.find(x=>x.id===card.dataset.attackId); if(!g)return;
  const k=e.target.dataset.k; if(!k)return;
  if(k==='templateKey' && e.type==='change'){
    const t=getAllAttackTemplates()[e.target.value]; if(t){Object.assign(g,structuredClone(t),{id:g.id,templateKey:e.target.value,name:t.label});renderAttackGroups();return;}
  }
  g[k]=e.target.type==='number'?num(e.target.value):e.target.value; validateConfiguration();
}
function handleAttackClick(e){const card=e.target.closest('[data-attack-id]');if(!card)return;const idx=attackGroups.findIndex(x=>x.id===card.dataset.attackId);if(idx<0)return;const a=e.target.dataset.action;if(a==='remove-attack'){attackGroups.splice(idx,1);renderAttackGroups();}if(a==='dup-attack'){const c=structuredClone(attackGroups[idx]);c.id=uid('atk');c.name+= ' コピー';attackGroups.splice(idx+1,0,c);renderAttackGroups();}}
function handleDefenseInput(e){const card=e.target.closest('[data-defense-id]');if(!card)return;const d=defenseSystems.find(x=>x.id===card.dataset.defenseId);if(!d)return;const k=e.target.dataset.k;if(!k)return;if(k==='type'&&e.type==='change'){const fresh=structuredClone(DEFENSE_DEFAULTS[e.target.value]);Object.assign(d,fresh,{id:d.id,type:e.target.value,priority:d.priority,name:fresh.name});renderDefenseSystems();return;}d[k]=e.target.type==='number'?num(e.target.value):e.target.value;validateConfiguration();}
function handleDefenseClick(e){const card=e.target.closest('[data-defense-id]');if(!card)return;const idx=defenseSystems.findIndex(x=>x.id===card.dataset.defenseId);if(idx<0)return;const a=e.target.dataset.action;if(a==='remove-defense'){defenseSystems.splice(idx,1);renderDefenseSystems();}if(a==='dup-defense'){const c=structuredClone(defenseSystems[idx]);c.id=uid('def');c.name+=' コピー';defenseSystems.splice(idx+1,0,c);renderDefenseSystems();}}

function buildScenario(){return {name:$('scenario-name').value.trim()||'MFDCO Scenario',simulationCount:num($('simulation-count').value,10000),timeStep:num($('time-step').value,.05),seedMode:$('seed-mode').value,seedValue:$('seed-value').value,readiness:$('readiness').value,engagementMode:$('engagement-mode').value,environment:{weather:$('weather-preset').value,rain:num($('rain-level').value),visibility:num($('visibility-level').value),wind:num($('wind-level').value),jamming:num($('jamming-level').value),chaff:num($('chaff-level').value),eccm:num($('eccm-level').value)},attackGroups:structuredClone(attackGroups),defenseSystems:structuredClone(defenseSystems)};}

function validateConfiguration(){
  const s=buildScenario();const msgs=[];let fatal=false;
  if(!s.attackGroups.length){msgs.push(['error','攻撃グループがありません。']);fatal=true;}
  if(!s.defenseSystems.length) msgs.push(['warn','防空装備がありません。無迎撃結果のみになります。']);
  for(const g of s.attackGroups){if(g.count<=0||g.speed<=0||g.distanceKm<=0){msgs.push(['error',`${g.name}: 数量・速度・距離は0より大きくしてください。`]);fatal=true;}if(g.altitude<0){msgs.push(['error',`${g.name}: 高度が不正です。`]);fatal=true;}}
  for(const d of s.defenseSystems){if(d.minRangeKm>d.maxRangeKm){msgs.push(['error',`${d.name}: 最低射程が最大射程を上回っています。`]);fatal=true;}if(d.minAlt>d.maxAlt){msgs.push(['error',`${d.name}: 最低高度が最高高度を上回っています。`]);fatal=true;}if(d.baseP<0||d.baseP>100){msgs.push(['error',`${d.name}: 迎撃率は0〜100%です。`]);fatal=true;}if(d.type==='laser'&&d.energyUse>d.energy&&d.energy>0) msgs.push(['warn',`${d.name}: 1回のEnergy消費量が総Energyを上回っています。`]);}
  if(!msgs.length) msgs.push(['ok','設定に致命的な問題はありません。']);
  $('config-messages').innerHTML=msgs.map(([c,t])=>`<div class="message ${c}">${escapeHtml(t)}</div>`).join(''); $('simulate-button').disabled=fatal; return !fatal;
}

function readinessFactor(mode){return mode==='combat'?0.72:mode==='alert'?0.88:1.15;}
function angleDelta(a,b){let d=Math.abs((a-b)%360);return d>180?360-d:d;}
function inArc(bearing,center,arc){return arc>=359.9||angleDelta(bearing,center)<=arc/2;}

function effectiveProbability(def, atk, env){
  const dm=DEFENSE_TYPE_MODELS[def.type];const gm=GUIDANCE_MODELS[atk.guidance]||GUIDANCE_MODELS.combined;
  let p=def.baseP/100;
  const weatherSeverity=(env.rain+(10-env.visibility)+env.wind*.35)/23.5;
  const attackWeatherProtection=clamp(atk.weatherRes/10,0,1);
  const jamPressure=clamp((env.jamming-env.eccm*.6)/10,0,1)*(1-clamp(atk.jamRes/10,0,1)*.35);
  const chaffPressure=clamp(env.chaff/10,0,1)*(1-clamp(atk.chaffRes/10,0,1)*.45);
  const stealthPenalty=(atk.stealth/10)*.18;
  const weatherPenalty=weatherSeverity*dm.weather*(1-attackWeatherProtection*.45);
  const visibilityPenalty=((10-env.visibility)/10)*dm.visibility;
  const jamPenalty=jamPressure*dm.jamming*(.65+gm.jamming*.35);
  const chaffPenalty=chaffPressure*dm.chaff*(.65+gm.chaff*.35);
  const durabilityPenalty=Math.max(0,atk.durability-1)*.045;
  p -= weatherPenalty+visibilityPenalty+jamPenalty+chaffPenalty+stealthPenalty+durabilityPenalty;
  return {p:clamp(p,.02,.97),parts:{base:def.baseP/100,weather:-weatherPenalty,visibility:-visibilityPenalty,jamming:-jamPenalty,chaff:-chaffPenalty,stealth:-stealthPenalty,durability:-durabilityPenalty}};
}

function detectionRange(def,atk,env){
  const weather=(env.rain+(10-env.visibility))/20;const stealth=atk.stealth/10;const jam=clamp((env.jamming-env.eccm*.55)/10,0,1);
  const factor=clamp(1-weather*.22-stealth*.28-jam*.22,.35,1);
  return def.detectionKm*factor;
}

function createAttackers(s){
  const arr=[];for(const g of s.attackGroups){for(let i=0;i<g.count;i++){const launch=g.launchStart+i*g.launchInterval;arr.push({id:`${g.id}:${i}`,groupId:g.id,groupName:g.name,index:i,launchTime:launch,distanceKm:g.distanceKm,speed:g.speed,altitude:g.altitude,bearing:g.bearing,guidance:g.guidance,jamRes:g.jamRes,chaffRes:g.chaffRes,weatherRes:g.weatherRes,stealth:g.stealth,durability:g.durability,impactTime:launch+(g.distanceKm*1000/g.speed),alive:true,destroyedBy:null});}}return arr;
}

function simulateSingleRun(s,rng,captureTimeline=false){
  const attackers=createAttackers(s);const defs=[...s.defenseSystems].sort((a,b)=>a.priority-b.priority);const env=s.environment;const timeline=[];const defStats={};const groupStats={};
  for(const d of defs) defStats[d.id]={engagements:0,shots:0,kills:0,ammoUsed:0,saturationEvents:0,energyWaits:0,weatherLoss:0,name:d.name,type:d.type};
  for(const g of s.attackGroups) groupStats[g.id]={launched:g.count,killed:0,impacts:0,impactTimes:[],name:g.name};
  if(captureTimeline){for(const g of s.attackGroups) timeline.push({time:g.launchStart,type:'ATTACK',text:`${g.name} 発射開始 (${g.count})`});}

  const defState={};
  for(const d of defs) defState[d.id]={ammo:d.ammo*d.units,energy:d.type==='laser'?d.energy*d.units:Infinity,nextReady:0,reloads:0};

  for(const def of defs){
    const state=defState[def.id];
    const candidates=attackers.filter(a=>a.alive&&a.altitude>=def.minAlt&&a.altitude<=def.maxAlt&&inArc(a.bearing,def.centerBearing,def.arc));
    if(!candidates.length) continue;
    candidates.sort((a,b)=>a.impactTime-b.impactTime);
    const detRCache=new Map();
    const slots=Math.max(1,def.simultaneous*def.units);
    const capWave1=Math.max(0,def.firstWave*def.units); const capWave2=Math.max(0,def.secondWave*def.units);

    for(let base=0;base<candidates.length;base+=slots){
      const batch=candidates.slice(base,base+slots).filter(a=>a.alive); if(!batch.length)continue;
      if(batch.length===slots&&candidates.length>slots) defStats[def.id].saturationEvents++;
      for(const atk of batch){
        if(!atk.alive)continue;
        const g=s.attackGroups.find(x=>x.id===atk.groupId);
        const detR=detRCache.has(g.id)?detRCache.get(g.id):detectionRange(def,g,env);detRCache.set(g.id,detR);
        const maxEngageR=Math.min(def.maxRangeKm,detR);
        if(maxEngageR<=def.minRangeKm)continue;
        const enterTime=atk.launchTime+Math.max(0,(atk.distanceKm-maxEngageR)*1000/atk.speed);
        const readiness=readinessFactor(s.readiness);const lockTime=enterTime+(def.trackTime+def.reactionTime)*readiness;
        if(lockTime>=atk.impactTime)continue;
        if(captureTimeline) timeline.push({time:enterTime,type:'SENSOR',text:`${def.name}: ${g.name} 探知`},{time:lockTime,type:'TRACK',text:`${def.name}: TRACK確立`});

        let engaged=false; let killed=false;
        const waves=[{label:'WAVE 1',max:capWave1},{label:'WAVE 2',max:capWave2}];
        for(let wi=0;wi<waves.length&&!killed;wi++){
          const wave=waves[wi];if(wave.max<=0)continue;
          let available=wave.max;
          if(def.type==='laser') available=Math.min(available,Math.floor(state.energy/Math.max(def.energyUse,1)));
          else available=Math.min(available,state.ammo);
          available=Math.min(available, Math.max(1,Math.ceil(atk.durability)));
          if(available<=0){if(def.type==='laser')defStats[def.id].energyWaits++;continue;}
          const waveStart=Math.max(lockTime + wi*(def.launchInterval+Math.max(.15,def.reactionTime*.25)),state.nextReady);
          const distanceAtWave=Math.max(0,atk.distanceKm-((waveStart-atk.launchTime)*atk.speed/1000));
          if(distanceAtWave<def.minRangeKm||distanceAtWave>def.maxRangeKm||waveStart>=atk.impactTime)continue;
          const tof=def.projectileSpeed>100000?0.02:(distanceAtWave*1000/Math.max(def.projectileSpeed,1));
          const resolveTime=waveStart+tof;
          if(resolveTime>=atk.impactTime)continue;
          engaged=true;defStats[def.id].engagements++;
          if(captureTimeline)timeline.push({time:waveStart,type:'DEFENSE',text:`${def.name}: ${wave.label} / ${available} 発`});
          const ep=effectiveProbability(def,g,env);defStats[def.id].weatherLoss+=Math.abs(ep.parts.weather)+Math.abs(ep.parts.visibility);
          let waveKill=false;
          for(let shot=0;shot<available;shot++){
            defStats[def.id].shots++;defStats[def.id].ammoUsed++;
            if(def.type==='laser')state.energy=Math.max(0,state.energy-def.energyUse);else state.ammo=Math.max(0,state.ammo-1);
            if(rng()<ep.p){waveKill=true;break;}
          }
          state.nextReady=waveStart+Math.max(def.launchInterval,def.type==='laser'?def.cooling:0);
          if(waveKill){atk.alive=false;atk.destroyedBy=def.id;defStats[def.id].kills++;groupStats[atk.groupId].killed++;killed=true;if(captureTimeline)timeline.push({time:resolveTime,type:'INTERCEPT',text:`${def.name}: ${g.name} を迎撃`});}
          else if(captureTimeline)timeline.push({time:resolveTime,type:'INTERCEPT',text:`${def.name}: ${wave.label} 撃ち漏らし`});
          if(def.type!=='laser'&&state.ammo<=0&&def.reload>0){state.nextReady=Math.max(state.nextReady,waveStart+def.reload);state.ammo=def.ammo*def.units;state.reloads++;}
          if(def.type==='laser'&&state.energy<def.energyUse){state.nextReady=Math.max(state.nextReady,waveStart+def.cooling);state.energy=def.energy*def.units;}
        }
        if(s.engagementMode==='handoff' && engaged && !atk.alive) continue;
      }
    }
  }

  const impacts=attackers.filter(a=>a.alive);
  for(const a of impacts){groupStats[a.groupId].impacts++;groupStats[a.groupId].impactTimes.push(a.impactTime);if(captureTimeline)timeline.push({time:a.impactTime,type:'IMPACT',text:`${a.groupName} #${a.index+1} 目標到達`});}
  timeline.sort((a,b)=>a.time-b.time);
  return {impactCount:impacts.length, attackers, timeline, defStats, groupStats, firstImpact:impacts.length?Math.min(...impacts.map(a=>a.impactTime)):null, maxImpactTime:attackers.length?Math.max(...attackers.map(a=>a.impactTime)):0};
}

async function runMonteCarlo(){
  if(!validateConfiguration())return; const s=buildScenario(); const runs=s.simulationCount;
  $('simulate-button').disabled=true;$('progress-wrap').hidden=false;const distribution=new Map();const defAgg={};const groupAgg={};let sumImpact=0;let allStopped=0;let representative=null;const remainingAccumulator=[];let maxTime=0;
  for(const d of s.defenseSystems)defAgg[d.id]={name:d.name,type:d.type,engagements:0,shots:0,kills:0,ammoUsed:0,saturationEvents:0,energyWaits:0,weatherLoss:0};
  for(const g of s.attackGroups)groupAgg[g.id]={name:g.name,launched:g.count,killed:0,impacts:0,impactTimeSum:0,impactTimeCount:0};
  const bucketStep=1;
  for(let i=0;i<runs;i++){
    const r=simulateSingleRun(s,makeRng(i),i===0);if(i===0) representative=r;sumImpact+=r.impactCount;if(r.impactCount===0)allStopped++;distribution.set(r.impactCount,(distribution.get(r.impactCount)||0)+1);maxTime=Math.max(maxTime,r.maxImpactTime);
    for(const [id,st] of Object.entries(r.defStats)){const a=defAgg[id];Object.keys(st).forEach(k=>{if(typeof st[k]==='number')a[k]+=st[k];});}
    for(const [id,st] of Object.entries(r.groupStats)){const a=groupAgg[id];a.killed+=st.killed;a.impacts+=st.impacts;a.impactTimeSum+=st.impactTimes.reduce((x,y)=>x+y,0);a.impactTimeCount+=st.impactTimes.length;}
    const maxBucket=Math.ceil(r.maxImpactTime/bucketStep);for(let b=0;b<=maxBucket;b++){const t=b*bucketStep;let alive=0;for(const a of r.attackers){if(a.launchTime<=t&&a.impactTime>=t&&(a.alive||(!a.alive&&a.destroyedBy))){if(a.alive)alive++;}}remainingAccumulator[b]=(remainingAccumulator[b]||0)+alive;}
    if(i%Math.max(1,Math.floor(runs/40))===0){$('progress-bar').style.width=`${(i/runs)*100}%`;$('progress-text').textContent=`計算中... ${i.toLocaleString()} / ${runs.toLocaleString()}`;await new Promise(res=>setTimeout(res,0));}
  }
  $('progress-bar').style.width='100%';$('progress-text').textContent='完了';
  const impactValues=[];for(const [k,c] of distribution.entries())for(let i=0;i<c;i++)impactValues.push(k);impactValues.sort((a,b)=>a-b);
  const mean=sumImpact/runs;const totalAttack=s.attackGroups.reduce((a,g)=>a+g.count,0);const result={scenario:s,runs,distribution,meanImpact:mean,expectedIntercept:totalAttack-mean,allStopped:allStopped/runs,median:quantile(impactValues,.5),p10:quantile(impactValues,.1),p90:quantile(impactValues,.9),onePlus:1-(distribution.get(0)||0)/runs,fivePlus:probAtLeast(distribution,runs,5),tenPlus:probAtLeast(distribution,runs,10),representative,defAgg,groupAgg,remaining:remainingAccumulator.map((v,i)=>({time:i*bucketStep,alive:v/runs})),totalAttack};
  lastResult=result;renderAllResults(result);setTimeout(()=>{$('progress-wrap').hidden=true;$('simulate-button').disabled=false;},500);
}

function quantile(arr,q){if(!arr.length)return 0;const pos=(arr.length-1)*q,base=Math.floor(pos),rest=pos-base;return arr[base+1]!==undefined?arr[base]+rest*(arr[base+1]-arr[base]):arr[base];}
function probAtLeast(dist,runs,n){let c=0;for(const [k,v] of dist.entries())if(k>=n)c+=v;return c/runs;}

function renderAllResults(r){document.querySelectorAll('.results-section').forEach(el=>el.hidden=false);renderSummary(r);renderImpact(r);renderRemaining(r);renderTimeline(r);renderDefenseResults(r);renderAttackResults(r);renderAnalysis(r);renderAssessment(r);renderCompare();window.scrollTo({top:$('results-section').offsetTop-70,behavior:'smooth'});}

function renderSummary(r){const noDefenseFirst=Math.min(...r.scenario.attackGroups.map(g=>g.launchStart+g.distanceKm*1000/g.speed));const defenseRate=1-r.meanImpact/Math.max(r.totalAttack,1);const cards=[['攻撃総数',r.totalAttack.toFixed(0),'objects'],['無迎撃時 最初の到達',`${noDefenseFirst.toFixed(2)} s`,'最速グループ基準'],['期待迎撃数',r.expectedIntercept.toFixed(2),pct(defenseRate)],['期待到達数',r.meanImpact.toFixed(2),`P50 ${r.median.toFixed(0)} / P90 ${r.p90.toFixed(0)}`],['全弾阻止確率',pct(r.allStopped),'0発到達'],['1発以上到達',pct(r.onePlus),''],['5発以上到達',pct(r.fivePlus),''],['10発以上到達',pct(r.tenPlus),'']];$('summary-cards').innerHTML=cards.map(c=>`<div class="summary-card"><div class="label">${c[0]}</div><div class="value">${c[1]}</div><div class="sub">${c[2]}</div></div>`).join('');}

function drawAxes(ctx,w,h,pad,xLabel,yLabel){ctx.clearRect(0,0,w,h);ctx.strokeStyle='#cad3d1';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.stroke();ctx.fillStyle='#51605e';ctx.font='12px sans-serif';ctx.fillText(xLabel,w/2,h-12);ctx.save();ctx.translate(14,h/2);ctx.rotate(-Math.PI/2);ctx.fillText(yLabel,0,0);ctx.restore();}
function renderImpact(r){const body=$('impact-table-body');const keys=[...r.distribution.keys()].sort((a,b)=>a-b);body.innerHTML=keys.map(k=>`<tr><td>${k}</td><td>${pct(r.distribution.get(k)/r.runs,2)}</td><td>${r.distribution.get(k).toLocaleString()}</td></tr>`).join('');const c=$('impact-chart'),ctx=c.getContext('2d'),w=c.width,h=c.height,p=52;drawAxes(ctx,w,h,p,'目標到達数','確率');const max=Math.max(...keys.map(k=>r.distribution.get(k)/r.runs),.01);const bw=(w-p*2)/Math.max(keys.length,1);keys.forEach((k,i)=>{const v=r.distribution.get(k)/r.runs;const bh=(h-p*2)*(v/max);ctx.fillStyle='#164b4b';ctx.fillRect(p+i*bw+4,h-p-bh,Math.max(2,bw-8),bh);ctx.fillStyle='#4f5b59';ctx.font='11px sans-serif';if(keys.length<30)ctx.fillText(String(k),p+i*bw+bw*.4,h-p+16);});}
function renderRemaining(r){const c=$('remaining-chart'),ctx=c.getContext('2d'),w=c.width,h=c.height,p=52;drawAxes(ctx,w,h,p,'時間 (sec)','平均残存数');const data=r.remaining;const maxT=Math.max(...data.map(d=>d.time),1);const maxY=Math.max(r.totalAttack,...data.map(d=>d.alive),1);ctx.strokeStyle='#164b4b';ctx.lineWidth=3;ctx.beginPath();data.forEach((d,i)=>{const x=p+(d.time/maxT)*(w-p*2);const y=h-p-(d.alive/maxY)*(h-p*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}

function renderTimeline(r){const filters=['ALL','ATTACK','SENSOR','TRACK','DEFENSE','INTERCEPT','IMPACT','WARNING'];$('timeline-filters').innerHTML=filters.map(f=>`<button class="button filter-btn ${currentTimelineFilter===f?'active':''}" data-filter="${f}">${f}</button>`).join('');const rows=(r.representative?.timeline||[]).filter(x=>currentTimelineFilter==='ALL'||x.type===currentTimelineFilter);$('timeline-body').innerHTML=rows.slice(0,500).map(x=>`<tr><td>${sec(x.time)}</td><td>${x.type}</td><td>${escapeHtml(x.text)}</td></tr>`).join('')||'<tr><td colspan="3">該当イベントなし</td></tr>';}

function renderDefenseResults(r){$('defense-results').innerHTML=r.scenario.defenseSystems.map(d=>{const a=r.defAgg[d.id];const shots=a.shots/r.runs,kills=a.kills/r.runs,eng=a.engagements/r.runs,sat=a.saturationEvents/r.runs;const eff=shots>0?kills/shots:0;return `<article class="result-card"><h3>${escapeHtml(d.name)}</h3><span class="badge ${sat>1?'warn':'ok'}">${DEFENSE_TYPE_MODELS[d.type].label}</span><div class="metric-list"><div class="metric-row"><span>平均交戦</span><strong>${eng.toFixed(2)}</strong></div><div class="metric-row"><span>平均発射/照射</span><strong>${shots.toFixed(2)}</strong></div><div class="metric-row"><span>期待迎撃</span><strong>${kills.toFixed(2)}</strong></div><div class="metric-row"><span>1発あたり戦果</span><strong>${pct(eff)}</strong></div><div class="metric-row"><span>平均飽和イベント</span><strong>${sat.toFixed(2)}</strong></div><div class="metric-row"><span>平均弾薬/Energy消費</span><strong>${(a.ammoUsed/r.runs).toFixed(2)}</strong></div></div></article>`;}).join('');}
function renderAttackResults(r){$('attack-results').innerHTML=r.scenario.attackGroups.map(g=>{const a=r.groupAgg[g.id];const impacts=a.impacts/r.runs,kills=a.killed/r.runs,rate=impacts/g.count,avgT=a.impactTimeCount?a.impactTimeSum/a.impactTimeCount:0;return `<article class="result-card"><h3>${escapeHtml(g.name)}</h3><span class="badge">${g.type.toUpperCase()}</span><div class="metric-list"><div class="metric-row"><span>発射</span><strong>${g.count}</strong></div><div class="metric-row"><span>期待迎撃</span><strong>${kills.toFixed(2)}</strong></div><div class="metric-row"><span>期待到達</span><strong>${impacts.toFixed(2)}</strong></div><div class="metric-row"><span>到達率</span><strong>${pct(rate)}</strong></div><div class="metric-row"><span>平均到達時間</span><strong>${avgT?avgT.toFixed(2)+' s':'-'}</strong></div></div></article>`;}).join('');}

function renderAnalysis(r){const env=r.scenario.environment;const weather=WEATHER_PRESETS[env.weather]?.label||'カスタム';const saturationScore=r.scenario.defenseSystems.reduce((s,d)=>s+(r.defAgg[d.id].saturationEvents/r.runs),0);const satLabel=saturationScore>8?'CRITICAL':saturationScore>3?'HIGH':saturationScore>1?'MEDIUM':'LOW';const cards=[`<div class="analysis-card"><h3>ENVIRONMENT</h3><div class="metric-list"><div class="metric-row"><span>天候</span><strong>${weather}</strong></div><div class="metric-row"><span>雨量</span><strong>${env.rain}/10</strong></div><div class="metric-row"><span>視界</span><strong>${env.visibility}/10</strong></div><div class="metric-row"><span>風</span><strong>${env.wind}/10</strong></div></div></div>`,`<div class="analysis-card"><h3>ELECTRONIC WARFARE</h3><div class="metric-list"><div class="metric-row"><span>電波妨害</span><strong>${env.jamming}/10</strong></div><div class="metric-row"><span>チャフ</span><strong>${env.chaff}/10</strong></div><div class="metric-row"><span>ECCM</span><strong>${env.eccm}/10</strong></div></div></div>`,`<div class="analysis-card"><h3>SATURATION</h3><span class="badge ${satLabel==='LOW'?'ok':satLabel==='MEDIUM'?'warn':'danger'}">${satLabel}</span><p class="small-note">同時交戦上限に達した頻度をMFDCOモデルで集計しています。</p></div>`,`<div class="analysis-card"><h3>MODEL NOTE</h3><p class="small-note">探知・追尾・天候・妨害・チャフ・ECCMの補正は架空係数です。実在装備の性能値ではありません。</p></div>`];$('analysis-content').innerHTML=cards.join('');}

function renderAssessment(r){const defenseRate=1-r.meanImpact/Math.max(r.totalAttack,1);const grade=defenseRate>=.97?'S':defenseRate>=.92?'A':defenseRate>=.82?'B':defenseRate>=.68?'C':defenseRate>=.5?'D':'E';const saturation=r.scenario.defenseSystems.some(d=>r.defAgg[d.id].saturationEvents/r.runs>2);let text=`${r.totalAttack}体の攻撃に対し、平均${r.expectedIntercept.toFixed(2)}体を迎撃し、平均${r.meanImpact.toFixed(2)}体が目標へ到達する結果です。全弾阻止確率は${pct(r.allStopped)}です。`;if(saturation)text+=' 一部の防空層では同時交戦能力による飽和が確認されました。';else text+=' 大きな飽和は限定的でした。';$('assessment-content').innerHTML=`<div class="assessment-box"><div class="grade-box"><div><div>DEFENSE</div><div class="grade">${grade}</div><div>${pct(defenseRate)}</div></div></div><div class="assessment-text"><h3>${escapeHtml(r.scenario.name)}</h3><p>${escapeHtml(text)}</p><div class="metric-list"><div class="metric-row"><span>P10 到達数</span><strong>${r.p10.toFixed(1)}</strong></div><div class="metric-row"><span>P50 到達数</span><strong>${r.median.toFixed(1)}</strong></div><div class="metric-row"><span>P90 到達数</span><strong>${r.p90.toFixed(1)}</strong></div></div></div></div>`;}

function saveCompare(slot){if(!lastResult)return alert('先にシミュレーションしてください。');comparePlans[slot]={name:lastResult.scenario.name,meanImpact:lastResult.meanImpact,allStopped:lastResult.allStopped,defenseRate:1-lastResult.meanImpact/Math.max(lastResult.totalAttack,1),onePlus:lastResult.onePlus,totalAttack:lastResult.totalAttack};renderCompare();}
function renderCompare(){const a=comparePlans.A,b=comparePlans.B;if(!a&&!b){$('compare-output').className='compare-output empty-state';$('compare-output').textContent='PLAN A / PLAN Bを保存すると比較できます。';return;}$('compare-output').className='compare-output';$('compare-output').innerHTML=`<table class="compare-table"><thead><tr><th>指標</th><th>PLAN A</th><th>PLAN B</th></tr></thead><tbody><tr><td>名称</td><td>${a?escapeHtml(a.name):'-'}</td><td>${b?escapeHtml(b.name):'-'}</td></tr><tr><td>期待到達</td><td>${a?a.meanImpact.toFixed(2):'-'}</td><td>${b?b.meanImpact.toFixed(2):'-'}</td></tr><tr><td>全弾阻止</td><td>${a?pct(a.allStopped):'-'}</td><td>${b?pct(b.allStopped):'-'}</td></tr><tr><td>防衛成功率</td><td>${a?pct(a.defenseRate):'-'}</td><td>${b?pct(b.defenseRate):'-'}</td></tr><tr><td>1発以上到達</td><td>${a?pct(a.onePlus):'-'}</td><td>${b?pct(b.onePlus):'-'}</td></tr></tbody></table>`;}

function refreshTemplateSource(){$('template-source').innerHTML=attackGroups.map((g,i)=>`<option value="${g.id}">GROUP ${i+1}: ${escapeHtml(g.name)}</option>`).join('');}
function saveCustomTemplate(){const id=$('template-source').value,g=attackGroups.find(x=>x.id===id),name=$('custom-template-name').value.trim();if(!g||!name)return alert('対象グループとテンプレート名を指定してください。');const store=JSON.parse(localStorage.getItem('mfdco-airdefense-attack-templates')||'{}');const key=`custom_${Date.now()}`;const copy=structuredClone(g);delete copy.id;copy.label=name;copy.templateKey=key;store[key]=copy;localStorage.setItem('mfdco-airdefense-attack-templates',JSON.stringify(store));$('custom-template-name').value='';renderAttackGroups();alert('テンプレートを保存しました。');}
function loadCustomTemplates(){}

function exportScenario(){const blob=new Blob([JSON.stringify(buildScenario(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mfdco-airdefense-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function importScenario(e){const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const s=JSON.parse(reader.result);applyScenario(s);}catch{alert('JSONを読み込めませんでした。');}};reader.readAsText(file);e.target.value='';}
function applyScenario(s){if(!s)return;$('scenario-name').value=s.name||'Imported Scenario';if(s.simulationCount)$('simulation-count').value=String(s.simulationCount);if(s.timeStep)$('time-step').value=String(s.timeStep);$('seed-mode').value=s.seedMode||'random';$('seed-value').value=s.seedValue||'MFDCO-001';$('readiness').value=s.readiness||'alert';$('engagement-mode').value=s.engagementMode||'handoff';if(s.environment){$('weather-preset').value=s.environment.weather||'custom';$('rain-level').value=s.environment.rain??0;$('visibility-level').value=s.environment.visibility??10;$('wind-level').value=s.environment.wind??0;$('jamming-level').value=s.environment.jamming??0;$('chaff-level').value=s.environment.chaff??0;$('eccm-level').value=s.environment.eccm??0;}attackGroups=(s.attackGroups||[]).map(g=>({...g,id:g.id||uid('atk')}));defenseSystems=(s.defenseSystems||[]).map(d=>({...d,id:d.id||uid('def')}));renderAttackGroups();renderDefenseSystems();validateConfiguration();}
function resetAll(){if(!confirm('全設定を初期化しますか？'))return;attackGroups=[];defenseSystems=[];$('scenario-name').value='艦隊防空テスト 01';$('weather-preset').value='clear';applyWeatherPreset();$('jamming-level').value=4;$('chaff-level').value=3;$('eccm-level').value=5;addAttackGroup('cruise');addDefenseSystem('missile');addDefenseSystem('machinegun');document.querySelectorAll('.results-section').forEach(el=>el.hidden=true);lastResult=null;}
function getLocalStore(){return JSON.parse(localStorage.getItem('mfdco-airdefense-scenarios')||'{}');}
function saveLocalPreset(){const name=$('local-preset-name').value.trim();if(!name)return alert('保存名を入力してください。');const store=getLocalStore();store[name]=buildScenario();localStorage.setItem('mfdco-airdefense-scenarios',JSON.stringify(store));$('local-preset-name').value='';renderLocalPresets();}
function renderLocalPresets(){const store=getLocalStore();const names=Object.keys(store);$('local-presets').innerHTML=names.length?names.map(n=>`<div class="preset-row"><strong>${escapeHtml(n)}</strong><div><button class="mini-btn" data-load-preset="${escapeHtml(n)}">読込</button> <button class="mini-btn danger" data-delete-preset="${escapeHtml(n)}">削除</button></div></div>`).join(''):'<div class="empty-state">保存済みシナリオはありません。</div>';}
function handleLocalPresetClick(e){const load=e.target.dataset.loadPreset,del=e.target.dataset.deletePreset;const store=getLocalStore();if(load&&store[load])applyScenario(store[load]);if(del&&store[del]){delete store[del];localStorage.setItem('mfdco-airdefense-scenarios',JSON.stringify(store));renderLocalPresets();}}

window.addEventListener('DOMContentLoaded',init);
