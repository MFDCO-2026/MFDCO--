import {isCivilian} from './logistics.mjs';
export const EXTRA_TYPES=[
 ['refugees', '難民', 'land', 3, 100, 0, 0, 'civilian'],
 ['evacuees', '避難民', 'land', 3, 100, 0, 0, 'civilian'],
 ['civilians', '民間人', 'land', 4, 100, 0, 0, 'civilian'],
 ['aid_workers', '救援要員', 'land', 5, 120, 0, 0, 'civilian'],
 ['civilian_bus', '避難バス', 'land', 35, 180, 0, 0, 'civilian'],
 ['relief_truck', '救援物資車', 'land', 35, 150, 0, 0, 'civilian'],
 ['fuel_truck', '燃料輸送車', 'land', 35, 160, 0, 0, 'support'],
 ['ammo_truck', '弾薬輸送車', 'land', 35, 160, 0, 0, 'support'],
 ['field_kitchen', '野戦炊事車', 'land', 25, 120, 0, 0, 'support'],
 ['power_vehicle', '電源車', 'land', 30, 150, 0, 0, 'support'],
 ['assault_infantry', '突撃歩兵', 'land', 5, 180, 7, 1, 'infantry'],
 ['motorized_infantry', '自動車化歩兵', 'land', 35, 220, 6, 1, 'infantry'],
 ['machinegun_team', '機関銃班', 'land', 4, 100, 8, 1.2, 'infantry'],
 ['combat_engineer', '戦闘工兵', 'land', 6, 180, 5, 0.8, 'infantry'],
 ['armored_car', '装甲偵察車', 'land', 65, 180, 5, 1.5, 'vehicle'],
 ['ifv', '歩兵戦闘車', 'land', 45, 320, 12, 2, 'vehicle'],
 ['command_vehicle', '指揮通信車', 'land', 40, 200, 0, 0, 'support'],
 ['ambulance', '野戦救急車', 'land', 45, 100, 0, 0, 'support'],
 ['towed_howitzer', '牽引榴弾砲', 'land', 15, 120, 20, 12, 'fire'],
 ['railway_gun', '列車砲', 'land', 20, 500, 45, 30, 'fire'],
 ['searchlight_team', '探照灯隊', 'land', 10, 100, 0, 0, 'support'],
 ['bridge_vehicle', '架橋車', 'land', 25, 300, 0, 0, 'support'],
 ['light_cruiser', '軽巡洋艦', 'sea', 55, 1000, 30, 20, 'combat'],
 ['heavy_cruiser', '重巡洋艦', 'sea', 50, 1800, 50, 30, 'combat'],
 ['battlecruiser', '巡洋戦艦', 'sea', 50, 2500, 75, 35, 'combat'],
 ['escort_carrier', '護衛空母', 'sea', 30, 1600, 5, 5, 'support'],
 ['minelayer', '敷設艦', 'sea', 28, 650, 3, 3, 'support'],
 ['fleet_tug', '航洋曳船', 'sea', 22, 500, 0, 0, 'support'],
 ['cargo_ship', '貨物船', 'sea', 24, 1000, 0, 0, 'support'],
 ['oil_tanker', '油槽船', 'sea', 24, 1200, 0, 0, 'support'],
 ['naval_patrol', '哨戒機', 'air', 500, 180, 12, 5, 'combat'],
 ['heavy_bomber', '重爆撃機', 'air', 450, 320, 35, 5, 'combat'],
 ['jet_trainer', '練習機', 'air', 600, 100, 3, 2, 'support'],
 ['rescue_helicopter', '救難ヘリ', 'air', 230, 160, 0, 0, 'support'],
 ['militia','民兵','land',4,90,2,.4,'infantry'],['mountain_infantry','山岳歩兵','land',5,150,5,1,'infantry'],['motorcycle_recon','自動二輪偵察','land',60,70,2,.5,'vehicle'],['tank_destroyer','駆逐戦車','land',35,420,22,3,'vehicle'],['amphibious_armor','水陸両用装甲車','land',30,250,7,1.5,'vehicle'],['recovery_vehicle','装甲回収車','land',30,300,0,0,'support'],['coastal_artillery','沿岸砲','land',1,350,25,15,'fire'],['heavy_mortar','重迫撃砲','land',4,140,16,6,'fire'],
 ['torpedo_boat','魚雷艇','sea',65,180,12,5,'combat'],['escort_destroyer','護衛駆逐艦','sea',45,550,20,12,'combat'],['landing_ship','戦車揚陸艦','sea',22,1300,4,2,'support'],['repair_ship','工作艦','sea',24,1000,0,0,'support'],['seaplane_tender','水上機母艦','sea',28,1400,5,3,'support'],
 ['seaplane','水上偵察機','air',300,100,3,2,'support'],['dive_bomber','急降下爆撃機','air',420,150,24,3,'combat'],['torpedo_bomber','雷撃機','air',380,160,28,3,'combat'],['glider','輸送グライダー','air',160,100,0,0,'support'],['observation_aircraft','観測機','air',200,70,0,0,'support'],

 ['light_armor','軽戦車','land',55,350,12,2,'vehicle'],['heavy_armor','重戦車','land',25,900,25,3,'vehicle'],['scout_infantry','偵察歩兵','land',7,100,3,1,'infantry'],['airborne','空挺歩兵','land',6,180,6,1,'infantry'],['sniper','狙撃班','land',5,60,4,1.5,'infantry'],['supply_truck','補給車','land',40,120,0,0,'support'],['medical_vehicle','救護車','land',35,100,0,0,'support'],['rocket_artillery','多連装ロケット','land',30,200,30,20,'fire'],['sam_vehicle','対空ミサイル車','land',35,180,15,12,'fire'],
 ['corvette','コルベット','sea',50,700,12,8,'combat'],['patrol_boat','哨戒艇','sea',65,200,5,3,'combat'],['submarine','潜水艦','sea',35,600,20,15,'combat'],['amphibious_ship','強襲揚陸艦','sea',35,2200,12,8,'support'],['supply_ship','補給艦','sea',30,1200,0,0,'support'],['hospital_ship','病院船','sea',28,900,0,0,'support'],['minesweeper','掃海艇','sea',28,450,3,2,'support'],
 ['attack_aircraft','攻撃機','air',750,180,18,5,'combat'],['interceptor','迎撃機','air',1400,130,20,10,'combat'],['ew_aircraft','電子戦機','air',700,150,0,0,'support'],['tanker_aircraft','空中給油機','air',650,230,0,0,'support'],['recon_drone','偵察ドローン','air',120,40,0,0,'support'],['transport_helicopter','輸送ヘリ','air',230,160,0,0,'support']
].map(([id,name,domain,speed,hp,attack,range,category])=>({id,name,domain,speed,hp,attack,range,category,targetDomains:['sam_vehicle','interceptor'].includes(id)?['air']:['heavy_bomber','naval_patrol','towed_howitzer','railway_gun'].includes(id)?['land','sea']:['assault_infantry','motorized_infantry','machinegun_team','combat_engineer','armored_car','ifv'].includes(id)?['land']:['land','sea','air']}));
export function validateBeta(p){p.mapAspect??=p.widthKm/p.heightKm;p.manualHeight??=true;p.gridKm??=niceGrid(p.widthKm);p.symbolMode??='nato';p.symbolOverrides??={};p.missileDisplayMode??='group';p.vls??=[];
 if(!Number.isFinite(p.mapAspect)||p.mapAspect<.1||p.mapAspect>10||typeof p.manualHeight!=='boolean'||!Number.isFinite(p.gridKm)||p.gridKm<.01||p.gridKm>1000||!['nato','custom'].includes(p.symbolMode)||!['group','individual'].includes(p.missileDisplayMode))throw new Error('地図・記号の設定が不正です。');
 if(!p.symbolOverrides||typeof p.symbolOverrides!=='object'||Array.isArray(p.symbolOverrides)||Object.keys(p.symbolOverrides).length>200)throw new Error('記号設定が不正です。');
 if(Object.values(p.symbolOverrides).reduce((n,v)=>n+(typeof v==='string'?v.length:0),0)>8000000)throw new Error('記号画像の合計は8MBまでです。');for(const [id,image] of Object.entries(p.symbolOverrides))if(!p.defaults.some(t=>t.id===id)||typeof image!=='string'||image.length>1000000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image))throw new Error('記号画像はPNG・JPEG・WebPで指定してください。');
 if(!Array.isArray(p.vls)||p.vls.length>80)throw new Error('VLS設定が不正です。');const seen=new Set();for(const rack of p.vls){if(!p.units.some(u=>u.id===rack.unitId)||seen.has(rack.unitId)||!Array.isArray(rack.cells)||rack.cells.length>256||rack.cells.some(c=>!c||!['empty','loaded','launched'].includes(c.status)||typeof c.missileId!=='string'||c.missileId&&!p.units.some(u=>u.id===c.missileId)))throw new Error('VLSセルの設定が不正です。');seen.add(rack.unitId);}return p;
}
export function niceGrid(width){const rough=width/10,base=10**Math.floor(Math.log10(rough));return [1,2,5,10].map(n=>n*base).find(n=>n>=rough)||base*10;}
export function missileCandidate(p,u,s,states){const forward=u.heading??90,rad=forward*Math.PI/180;return states.filter(v=>{const t=p.units.find(x=>x.id===v.id);if(!t||isCivilian(t)||isCivilian(u)||t.id===u.id||t.team===u.team||t.team==='neutral'||u.team==='neutral'||v.hp<=0||v.spent||v.recovered||v.mergedInto||!(u.targetDomains||[]).includes(p.defaults.find(d=>d.id===t.type)?.domain))return false;const dx=(v.x-s.x)*p.widthKm/1000,dy=(v.y-s.y)*p.heightKm/1000;return dx*Math.sin(rad)-dy*Math.cos(rad)>=-1e-9;}).sort((a,b)=>Math.hypot((a.x-s.x)*p.widthKm,(a.y-s.y)*p.heightKm)-Math.hypot((b.x-s.x)*p.widthKm,(b.y-s.y)*p.heightKm)||(a.id<b.id?-1:1))[0];}
export function supportEstimate(p,u,s,t,ts){if(!u||!s||!t||!ts)return null;const km=Math.hypot((ts.x-s.x)*p.widthKm/1000,(ts.y-s.y)*p.heightKm/1000),damage=u.attack*(u.salvo||1)*p.damageScale*100/(100+t.defense);return{km,seconds:km/Math.max(.1,u.speed)*3600,damage,remaining:Math.max(0,ts.hp-damage),message:damage>=ts.hp?'設定上のHPを下回る見込み':'設定上のHPは残る見込み'};}
