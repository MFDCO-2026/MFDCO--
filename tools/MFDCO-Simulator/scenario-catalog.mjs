import {ADDED_TYPES,ADDED_FACILITIES} from './catalog-additions.mjs';
import {newMount} from './weapons.mjs';
import {fresh,unit,validate} from './engine.mjs';
import {quickMap} from './map-catalog.mjs';
import {standardShipNames} from './experiments.mjs';
export const SCENARIOS={
 support_assets:{name:'支援部隊・設備見本',category:'land',detail:'通信・衛生・整備・輸送 / 配置と移動の見本',map:'logistics_base'},
 port_assets:{name:'港湾支援・設備見本',category:'sea',detail:'救難艇・測量艦・輸送船 / 自動救難・測量処理なし',map:'coastal_industry'},
 river_watch:{name:'河畔都市・橋梁警戒',category:'land',detail:'三つの橋・守備隊と接近部隊 / 架空演習',map:'river_town'},
 mountain_column:{name:'山岳集落・縦隊通過',category:'land',detail:'峠道・車両縦隊・監視隊 / 架空演習',map:'mountain_village'},
 snow_resupply:{name:'雪原基地・補給演習',category:'land',detail:'有限燃料在庫・移動縦隊 / 雪は環境設定',map:'snow_supply'},
 evacuation_transfer:{name:'避難拠点・搬送演習',category:'land',detail:'中立の避難バス・救援要員 / 非戦闘',map:'evacuation_hub'},
 armored_exercise:{name:'平原・装甲部隊演習',category:'land',detail:'戦車と歩兵戦闘車・塹壕 / 架空演習',map:'training_ground'},
 fleet_screen:{name:'大規模艦隊・護衛隊形',category:'sea',detail:'主力艦と護衛艦・計40隻 / 架空演習',map:null},
 air_transport:{name:'航空輸送・護衛飛行',category:'air',detail:'輸送機と護衛機・迎撃隊 / 架空演習',map:'airbase_plain'},
 reload_drill:{name:'武器管制・有限弾薬演習',category:'sea',detail:'指定VLSセル・時間付き再装填・状態変更',map:null},
 weapon_console:{name:'武装管制・全系統試験',category:'sea',detail:'主砲・VLS・発射筒・魚雷管・CIWS・レーザー / 架空演出',map:null},
 evacuation:{name:'避難誘導・救援配給',category:'land',detail:'非戦闘部隊・避難所・有限食料在庫',map:'rural_village'},
 logistics_demo:{name:'補給拠点と移動縦隊',category:'land',detail:'燃料・弾薬・食料の消費と補給',map:'logistics_base'},
 blackout:{name:'停電と補給復旧',category:'land',detail:'F30停電・F90復旧 / 電力不足の確認',map:'hospital_campus'},
 convoy:{name:'船団護衛',category:'sea',detail:'輸送船6隻と護衛艦 / 接近する水上部隊',map:null},
 gunline:{name:'戦列艦隊砲戦',category:'sea',detail:'戦艦・巡洋艦・駆逐艦の24隻',map:null},
 patrol:{name:'海峡哨戒',category:'sea',detail:'哨戒艇・コルベット・巡洋艦',map:null},
 urban_defense:{name:'市街地防衛',category:'land',detail:'住宅街・機関銃班・歩兵戦闘車',map:'urban_blocks'},
 fortress:{name:'要塞正面戦',category:'land',detail:'外郭塹壕・砲兵支援・歩兵接近',map:'fortress_plain'},
 rail_defense:{name:'鉄道拠点防衛',category:'land',detail:'操車場に接近する装甲部隊',map:'rail_hub'},
 supply_column:{name:'補給縦隊の護衛',category:'land',detail:'車両12隊・共通経路・移動応射',map:'rural_village'},
 air_intercept:{name:'航空迎撃演習',category:'air',detail:'重爆撃機と護衛・迎撃機の接近',map:'airbase_plain'},
 coastal_raid:{name:'沿岸航空基地防衛',category:'air',detail:'対空陣地と航空部隊 / 地対空の対象設定',map:'coastal_airport'},
 relief:{name:'救護拠点の防衛',category:'land',detail:'野戦病院の支援範囲と守備隊',map:'hospital_campus'}
};
export function catalogScenario(id){const spec=SCENARIOS[id];if(!spec)throw Error('戦闘テンプレートがありません。');let p=fresh(true);if(spec.map)quickMap(p,spec.map,128,'scenario-'+id);else {p.terrain.fill('water');p.elevation.fill(-500);p.labels=[];p.facilities=[];}p.title=spec.name+' / 架空演習';p.widthKm=spec.category==='land'?8:80;p.heightKm=p.widthKm*.625;p.mapAspect=1.6;p.gridKm=p.widthKm/10;p.secondsPerFrame=6;p.duration=300;p.combatEnabled=true;p.damageScale=.02;p.radars=[];p.unitScale=.55;p.facilityIconScale=.5;let seq=0;
 const add=(type,x,y,team,opts={})=>{const u=Object.assign(unit('sc-'+(++seq),type,x,y,team,p.defaults),{action:'defend',retreatPercent:25,...opts});u.name=p.defaults.find(t=>t.id===type).name+' '+String(seq).padStart(2,'0');p.units.push(u);return u;};
 const move=(type,x,y,team,toX,toY,opts={})=>add(type,x,y,team,{action:'move',points:[{x:toX,y:toY,wait:0}],afterAction:'defend',...opts});
 if(id==='convoy'){for(let i=0;i<6;i++)move(i%2?'oil_tanker':'cargo_ship',180+i%2*70,240+Math.floor(i/2)*150,'blue',650+i%2*70,240+Math.floor(i/2)*150,{speed:24});for(let i=0;i<4;i++)move('escort_destroyer',120+i%2*210,140+Math.floor(i/2)*620,'blue',600+i%2*180,140+Math.floor(i/2)*620,{speed:24,range:15});for(let i=0;i<4;i++)move('light_cruiser',850,200+i*190,'red',650,200+i*190,{speed:30,range:15});}
 if(id==='gunline')for(const team of ['blue','red'])for(let i=0;i<12;i++)move(['battleship','heavy_cruiser','light_cruiser','destroyer'][i%4],team==='blue'?250:750,90+i*73,team,team==='blue'?450:550,90+i*73,{speed:35,range:30});
 if(id==='patrol')for(const team of ['blue','red'])for(let i=0;i<6;i++)move(['patrol_boat','corvette','light_cruiser'][i%3],team==='blue'?200:800,150+i*130,team,team==='blue'?480:520,150+i*130,{speed:40,range:18});
 if(['urban_defense','fortress','rail_defense'].includes(id)){for(let i=0;i<6;i++){move(i%2?'ifv':'assault_infantry',150,150+i*130,'blue',600,150+i*130,{range:1.2,speed:12,personnel:i%2?4:120,hp:500});add(i%2?'machinegun_team':'infantry',650,150+i*130,'red',{range:1.5,hp:600});}add('towed_howitzer',850,500,'red',{action:'fire',range:5,attack:8});}
 if(id==='supply_column'){for(let i=0;i<12;i++)move(i%3?'supply_truck':'armored_car',100+i*45,350,'blue',400+i*45,650,{speed:18});for(let i=0;i<3;i++)add('infantry',550+i*100,800,'red',{range:1.2,attack:3});}
 if(id==='air_intercept'){for(let i=0;i<4;i++){move('heavy_bomber',180,200+i*180,'blue',850,200+i*180,{speed:450,targetDomains:['land','sea']});move('fighter',250,220+i*180,'blue',850,220+i*180,{speed:450,targetDomains:['air']});move('interceptor',800,200+i*180,'red',200,200+i*180,{speed:600,targetDomains:['air']});}}
 if(id==='coastal_raid'){for(let i=0;i<4;i++){add('sam_vehicle',760,200+i*180,'blue',{targetDomains:['air'],range:16,attack:5});move('attack_aircraft',100,200+i*180,'red',700,200+i*180,{speed:450,targetDomains:['land'],range:8,attack:8});}}
 if(id==='relief'){for(const f of p.facilities){f.team='blue';if(f.type==='hospital'){f.supportRate=.1;f.radiusKm=.8;}}for(let i=0;i<5;i++){add('infantry',600,180+i*150,'blue',{range:1.5,hp:600});move('motorized_infantry',850,180+i*150,'red',630,180+i*150,{speed:8,range:1.5,hp:600});}add('ambulance',420,450,'blue',{action:'wait'});}

 if(['evacuation','logistics_demo','blackout'].includes(id)){p.logisticsEnabled=true;p.powerEnabled=true;p.combatEnabled=false;
 const site=(type,x,y,extra={})=>p.facilities.push({id:'supply-'+p.facilities.length,type,name:type==='generator'?'演習電源':'演習配給拠点',team:id==='evacuation'?'neutral':'blue',points:[{x,y}],radiusKm:2,defense:0,damage:0,...extra});
 site('generator',400,500,{powerOutput:100,events:id==='blackout'?[{at:30,delta:-1000},{at:90,delta:1000}]:[]});
 site('distribution_center',500,500,{powerDemand:100,stockFuel:80,stockAmmo:80,stockFood:120,supplyRate:8});
 for(let i=0;i<8;i++){const type=id==='evacuation'?(i%3===0?'civilian_bus':'refugees'):(i%2?'fuel_truck':'supply_truck');move(type,300,280+i*60,id==='evacuation'?'neutral':'blue',650,280+i*60,{speed:id==='evacuation'?6:10,initialFuel:8,initialAmmo:20,initialFood:10,fuelPerKm:type==='refugees'?0:2,ammoPerMinute:0,foodPerMinute:.2,personnel:type==='refugees'?100:1});}
 if(id==='logistics_demo'){const from=p.facilities.find(f=>f.id.startsWith('supply-')&&f.type==='distribution_center');site('supply_depot',700,500,{name:'配送先',stockFuel:0,stockAmmo:0,stockFood:0,supplyRate:4});p.deliveries.push({id:'demo-delivery',from:from.id,to:p.facilities.at(-1).id,resource:'food',amount:50,depart:5,arrive:25});}
 if(id==='evacuation')site('refugee_camp',680,500,{name:'避難先'});
 }

 if(id==='weapon_console'){p.weaponControlEnabled=true;p.damageScale=.05;for(let i=0;i<8;i++)add('destroyer',i<4?400:600,200+(i%4)*180,i<4?'blue':'red',{action:'wait',attack:0,hp:3000});const host=p.units[0],target=p.units[4];['gun_twin','vls_square','launcher_canister','torpedo_triple','ciws_gatling','laser_turret'].forEach((variant,i)=>{const m=newMount(host.id,variant,'demo-mount-'+i);m.range=30;m.events=[{at:10+i*10,action:'fire',target:target.id,count:1}];p.mounts.push(m);});}


 if(['support_assets','port_assets'].includes(id)){
  p.combatEnabled=false;const sea=id==='port_assets',types=ADDED_TYPES.filter(t=>sea?t.domain==='sea':t.domain!=='sea');
  for(let i=0;i<(sea?8:types.length);i++){const t=types[i%types.length],x=sea?100+i%2*80:120+i%4*180,y=sea?180+Math.floor(i/2)*180:200+Math.floor(i/4)*230;move(t.id,x,y,'blue',sea?x+100:x+80,y,{speed:sea?12:t.domain==='air'?120:5,attack:0});}
  p.facilities=[];Object.entries(ADDED_FACILITIES).slice(sea?8:0,sea?16:8).forEach(([type,name],i)=>p.facilities.push({id:'asset-'+i,type,name,team:'blue',points:[{x:sea?520+i%2*230:150+i%4*210,y:sea?150+Math.floor(i/2)*190:120+Math.floor(i/4)*650}],radiusKm:.1,defense:0,damage:0}));
 }
 if(id==='river_watch')for(const y of [250,500,750]){move('mechanized',150,y,'blue',400,y,{speed:8,range:1.5});add('infantry',630,y,'red',{range:1.5});add('machinegun_team',700,y+50,'red',{range:1.5});}
 if(id==='mountain_column'){for(let i=0;i<10;i++)move(i%3?'supply_truck':'armored_car',80+i*35,500,'blue',650+i*28,500,{speed:10,attack:0});for(const x of [450,600,750])add('mountain_infantry',x,590,'blue',{action:'wait'});p.combatEnabled=false;}
 if(id==='armored_exercise')for(let i=0;i<6;i++){move(i%2?'ifv':'armor',180,150+i*140,'blue',540,150+i*140,{speed:10,range:1.4});add(i%2?'infantry':'antitank',650,150+i*140,'red',{range:1.5});}
 if(id==='fleet_screen')for(const team of ['blue','red'])for(let i=0;i<20;i++)move(['battleship','heavy_cruiser','destroyer','escort_destroyer','frigate'][i%5],(team==='blue'?150:850)+(i%2?30:-30),70+Math.floor(i/2)*90,team,team==='blue'?420:580,70+Math.floor(i/2)*90,{speed:28,range:24});
 if(id==='air_transport')for(let i=0;i<5;i++){move('transport_aircraft',120,140+i*160,'blue',880,140+i*160,{speed:350,attack:0});move('fighter',220,170+i*160,'blue',850,170+i*160,{speed:350,targetDomains:['air'],range:8});move('interceptor',850,140+i*160,'red',220,140+i*160,{speed:400,targetDomains:['air'],range:8});}
 if(['snow_resupply','evacuation_transfer'].includes(id)){
  p.combatEnabled=false;p.logisticsEnabled=true;const team=id==='snow_resupply'?'blue':'neutral';
  for(const f of p.facilities){f.team=team;if(['fuel_depot','distribution_center'].includes(f.type)){f.stockFuel=200;f.stockFood=200;f.stockAmmo=0;f.supplyRate=5;f.radiusKm=2;}}
  for(let i=0;i<8;i++)move(id==='snow_resupply'?'fuel_truck':'civilian_bus',100,260+i*65,team,720,260+i*65,{speed:10,attack:0,initialFuel:15,fuelPerKm:1});
  if(team==='neutral')for(let i=0;i<3;i++)add('aid_workers',300+i*150,650,team,{action:'wait',attack:0});
 }
 if(id==='reload_drill'){
  p.weaponControlEnabled=true;const host=add('destroyer',400,500,'blue',{action:'wait',attack:0,hp:10000}),target=add('destroyer',600,500,'red',{action:'wait',attack:0,hp:10000});
  const m=newMount(host.id,'vls_square','drill-vls');Object.assign(m,{range:30,damage:4,reserve:8,fireSeconds:12,reloadSeconds:30,events:[{at:10,action:'fire',target:target.id,count:4,cellIndices:[0,1,2,3]},{at:20,action:'reload',target:'',count:4,cellIndices:[0,1,2,3]},{at:30,action:'fire',target:target.id,count:4,cellIndices:[0,1,2,3]},{at:40,action:'safe',target:'',count:1},{at:50,action:'ready',target:'',count:1}]});p.mounts.push(m);
  const gun=newMount(host.id,'gun_quad','drill-gun');Object.assign(gun,{range:30,stock:12,reserve:12,damage:2,fireSeconds:6,reloadSeconds:18,events:[{at:15,action:'fire',target:target.id,count:4},{at:25,action:'reload',target:'',count:4}]});p.mounts.push(gun);
 }
 for(const team of ['blue','red']){const members=p.units.filter(u=>u.team===team).map(u=>u.id);if(members.length)p.groups.push({id:'sc-'+team,name:team==='blue'?'青・演習群':'赤・演習群',members});}
 p.communications=[{id:'sc-start',at:0,unitId:'',channel:'command',text:spec.name+'を開始。設定された経路・交戦条件で進行。'},{id:'sc-report',at:150,unitId:'',channel:'report',text:'演習経過15分。部隊状況画面で残存数を確認。'}];p.nextId=seq+1;return validate(standardShipNames(p));
}
