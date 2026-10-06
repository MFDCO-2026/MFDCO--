import {FACILITY_TYPES} from './facilities.mjs';
import {decodeJapanTemplate} from './japan-template.mjs';
import {configureMapSize,generateMap,seedRandom} from './map-model.mjs';
export const RESOLUTIONS={32:'32 / 最軽量',64:'64 / 軽量',128:'128 / 基本',256:'256 / 精細',512:'512 / 上級',1024:'1024 / 広域精細',2048:'2048 / 最大'};
export const BATTLEFIELDS={midway:'ミッドウェー',maginot:'マジノ線周辺',berlin:'ベルリン',leningrad:'レニングラード周辺',moscow:'モスクワ',kyiv:'キエフ（キーウ）',nile:'ナイル川下流域',taiwan:'台湾周辺',port_arthur:'旅順要塞周辺',sekigahara:'関ケ原',lugou_bridge:'盧溝橋周辺',ardennes:'アルデンヌ',kursk:'クルスク',verdun:'ヴェルダン',waterloo:'ワーテルロー',el_alamein:'エル・アラメイン',okinawa:'沖縄本島',tsushima:'対馬海峡',singapore:'シンガポール周辺',malta:'マルタ島',gibraltar:'ジブラルタル海峡',bataan:'バターン・マニラ湾',guam:'グアム',dardanelles:'ダーダネルス海峡',pearl_harbor:'真珠湾',normandy:'ノルマンディー',stalingrad:'スターリングラード',iwo_jima:'硫黄島',solomons:'ソロモン諸島'};
export const QUICK_MAPS={river_town:'河畔都市と三つの橋',canal_port:'運河港と倉庫街',snow_supply:'雪原の補給基地',lake_district:'湖畔と集落',mountain_village:'山岳集落と峠道',training_ground:'平原の演習場',coastal_industry:'沿岸工業地帯',evacuation_hub:'避難拠点と医療区画',naval_harbor:'軍港と湾口',industrial_belt:'工業団地',rail_hub:'鉄道操車場',fortress_plain:'要塞と平原',rural_village:'農村と耕作地',logistics_base:'補給基地',hospital_campus:'医療施設区画',coastal_airport:'沿岸航空基地',small_islands:'小さな諸島',trench_front:'塹壕対峙',urban_blocks:'市街戦区画',river_crossing:'河川と橋',coastal_village:'海岸の集落',airbase_plain:'飛行場と平原',mountain_pass:'山間の峠',desert_outpost:'砂漠の拠点'};
export async function loadBattlefield(id){if(!Object.hasOwn(BATTLEFIELDS,id))throw Error('テンプレートがありません。');const rs=await Promise.all(['json','terrain.bin','elevation.bin'].map(ext=>fetch(`./data/battlefields/${id}.${ext}`)));if(rs.some(r=>!r.ok))throw Error('地図の読み込みに失敗しました。');const [m,t,e]=await Promise.all([rs[0].json(),rs[1].arrayBuffer(),rs[2].arrayBuffer()]);const data=decodeJapanTemplate(m,t,e);data.mapSeed=id+'-v1';data.unitScale=.55;data.mapSymbolScale=data.facilityIconScale=.6;data.contourInterval=id==='solomons'?250:50;data.environment.latitude=(m.bounds.north+m.bounds.south)/2;data.environment.longitude=(m.bounds.east+m.bounds.west)/2;return data;}
export function quickMap(p,id,cols=128,seed='MFDCO'){if(!Object.hasOwn(QUICK_MAPS,id))throw Error('簡易テンプレートがありません。');const random=seedRandom(seed),city=id==='urban_blocks',width=city?4:40,height=city?3:25;configureMapSize(p,cols,width,height);p.facilities=[];p.deliveries=[];p.mapSymbols=[];p.labels=[];p.mapImages=[];p.background=null;p.backgroundBounds=null;p.mapAtlas=[];p.mapSource=null;generateMap(p,({river_town:'farmland',canal_port:'farmland',snow_supply:'snowfield',lake_district:'farmland',mountain_village:'highlands',training_ground:'farmland',coastal_industry:'coast',evacuation_hub:'farmland',naval_harbor:'coast',industrial_belt:'urban',rail_hub:'farmland',fortress_plain:'farmland',rural_village:'farmland',logistics_base:'farmland',hospital_campus:'urban',coastal_airport:'coast',small_islands:'archipelago',trench_front:'farmland',urban_blocks:'urban',river_crossing:'river',coastal_village:'coast',airbase_plain:'farmland',mountain_pass:'highlands',desert_outpost:'desert'})[id],seed);p.facilities=[];p.facilityIconScale=p.mapSymbolScale=city?.45:.65;
 const add=(type,points,name,team='neutral',extra={})=>p.facilities.push({id:'quick-'+p.facilities.length,type,points,name,team,radiusKm:.05,defense:['trench','bunker'].includes(type)?80:0,damage:0,...extra});
 if(id==='trench_front'){for(const [x,team] of [[350,'blue'],[650,'red']]){const points=Array.from({length:12},(_,i)=>({x:x+(i%2?25:-25),y:100+i*70}));add('trench',points,team==='blue'?'青・前線塹壕':'赤・前線塹壕',team);for(let y=200;y<850;y+=250)add('bunker',[{x:x+(team==='blue'?-60:60),y}], '支援陣地',team);}}
 if(city){for(let y=100;y<880;y+=120)for(let x=100;x<900;x+=120){const type=x===460&&y===340?'hospital':['house','apartment','shop'][Math.floor(random()*3)];add(type,[{x,y},{x:x+65,y:y+65}],type==='hospital'?'病院':'街区建物','neutral',{footprint:'rectangle',buildingHeight:type==='apartment'?18:6});}for(let x=70;x<950;x+=120)add('road',[{x,y:40},{x,y:960}],'街路');for(let y=70;y<950;y+=120)add('road',[{x:40,y},{x:960,y}],'街路');}
 if(id==='river_crossing'){add('road',[{x:80,y:500},{x:900,y:500}],'横断道路');add('bridge',[{x:420,y:475},{x:620,y:525}],'橋梁','neutral',{footprint:'rectangle'});}
 if(id==='coastal_village'){for(let y=300;y<800;y+=120)add('house',[{x:620,y},{x:655,y:y+45}],'沿岸の家','neutral',{footprint:'rectangle'});add('port',[{x:500,y:600}],'小港');}
 if(id==='airbase_plain'){add('runway',[{x:300,y:300},{x:750,y:360}],'滑走路','neutral',{footprint:'rectangle'});add('hangar',[{x:350,y:410},{x:450,y:500}],'格納庫','neutral',{footprint:'rectangle'});add('airfield',[{x:500,y:380}],'飛行場');}
 if(id==='mountain_pass')for(let y=0;y<p.terrainRows;y++)for(let x=0;x<p.terrainCols;x++)if(Math.abs(x/p.terrainCols-.5-.12*Math.sin(y/p.terrainRows*5))<.065){p.terrain[y*p.terrainCols+x]='plain';p.elevation[y*p.terrainCols+x]=200;}else{}
 if(id==='desert_outpost'){add('fort',[{x:450,y:420},{x:550,y:580}],'前哨拠点','neutral',{footprint:'rectangle'});add('warehouse',[{x:590,y:450},{x:650,y:550}],'物資倉庫','neutral',{footprint:'rectangle'});}

 const box=(type,x,y,w=70,h=60)=>add(type,[{x,y},{x:x+w,y:y+h}],null,'neutral',{footprint:'rectangle',buildingHeight:8});
 if(id==='naval_harbor'){box('drydock',600,350,140,70);box('shipyard',760,350);box('ammunition_depot',760,500);box('fuel_tank',650,550);add('port',[{x:510,y:430}],'湾岸埠頭');add('road',[{x:620,y:150},{x:900,y:150},{x:900,y:800}],'港湾道路');}
 if(id==='industrial_belt'){for(let y=150;y<850;y+=180)for(let x=150;x<850;x+=180)box(['factory','warehouse','refinery','substation'][(x+y)/180%4|0],x,y,110,100);add('railway',[{x:60,y:50},{x:60,y:950}],'貨物線');add('road',[{x:50,y:900},{x:950,y:900}],'幹線');}
 if(id==='rail_hub'){for(let x=350;x<=650;x+=60)add('railway',[{x:500,y:0},{x,y:250},{x,y:750},{x:500,y:1000}],'留置線');box('station',200,400);box('depot',700,500);box('warehouse',200,600);}
 if(id==='fortress_plain'){box('fort',650,350,150,300);for(const y of [200,500,800])add('bunker',[{x:550,y}],'外郭陣地');add('trench',[{x:500,y:100},{x:480,y:350},{x:520,y:650},{x:500,y:900}],'前面塹壕');}
 if(id==='rural_village'){for(let i=0;i<12;i++)box('house',220+(i%4)*150,220+Math.floor(i/4)*170,50,45);box('school',700,750);box('grain_store',160,750);add('road',[{x:50,y:150},{x:900,y:850}],'集落道');}
 if(id==='logistics_base'){for(let i=0;i<12;i++)box(['warehouse','ammunition_depot','workshop','barracks'][i%4],150+(i%4)*190,200+Math.floor(i/4)*200,110,120);box('command_post',420,820);}
 if(id==='hospital_campus'){box('hospital',350,250,250,300);box('helipad',650,300,130,130);box('warehouse',200,650);box('shelter',400,650);box('waterworks',600,650);add('road',[{x:100,y:600},{x:900,y:600}],'救護搬送路');}
 if(id==='coastal_airport'){box('runway',650,150,45,700);for(let y=250;y<750;y+=150)box('hangar',760,y);add('airfield',[{x:710,y:500}],'沿岸航空基地');add('radar_station',[{x:850,y:150}],'捜索サイト');}

 // CATALOG-1.1: fictional, seeded layouts. Coordinates use the existing map grid.
 const line=(type,points,name)=>add(type,points,name);
 const label=(name,x,y)=>p.labels.push({id:'quick-label-'+p.labels.length,name,x,y});
 const cells=fn=>{for(let y=0;y<p.terrainRows;y++)for(let x=0;x<p.terrainCols;x++)fn((x+.5)/p.terrainCols,(y+.5)/p.terrainRows,y*p.terrainCols+x);};
 if(id==='river_town'){
  cells((x,y,i)=>{if(Math.abs(x-.5)<.065){p.terrain[i]='water';p.elevation[i]=-8;}else{p.terrain[i]='urban';p.elevation[i]=15;}});
  for(const x of [150,270,650,770])for(const y of [140,350,560,770])box(y===350&&x===650?'civil_hospital':'apartment',x,y,65,70);
  for(const y of [250,500,750]){line('road',[{x:30,y},{x:970,y}],'東西幹線');line('road_bridge',[{x:430,y},{x:570,y}],'河川橋');}
  for(const x of [380,620])line('road',[{x,y:30},{x,y:970}],'河岸通り');label('西岸街区',220,80);label('東岸街区',750,80);
 }
 if(id==='canal_port'){
  cells((x,y,i)=>{const water=y>.72||Math.abs(x-.5)<.075;p.terrain[i]=water?'water':'plain';p.elevation[i]=water?-15:8;});
  for(const x of [180,700])for(const y of [150,330,510])box('warehouse',x,y,110,90);
  for(const x of [400,600])line('pier',[{x,y:180},{x,y:700}],'運河岸壁');
  line('road_bridge',[{x:380,y:100},{x:620,y:100}],'運河橋');line('road',[{x:50,y:100},{x:950,y:100}],'港湾幹線');box('customs',750,40,100,45);label('運河港',500,850);
 }
 if(id==='snow_supply'){
  p.environment={...p.environment,climate:'cold',weather:'snow',temperature:-12,snowDepth:30};
  for(let i=0;i<8;i++)box(['warehouse','fuel_depot','workshop','barracks'][i%4],160+i%4*190,220+Math.floor(i/4)*330,100,100);
  line('road',[{x:40,y:460},{x:960,y:460}],'雪原幹線');box('generator',440,700);box('clinic',580,700);label('北方補給地区',500,100);
 }
 if(id==='lake_district'){
  cells((x,y,i)=>{if(((x-.5)/.23)**2+((y-.5)/.32)**2<1){p.terrain[i]='water';p.elevation[i]=-25;}});
  for(const x of [120,800])for(let y=220;y<850;y+=150)box('house',x,y,45,45);
  line('road',[{x:100,y:120},{x:880,y:120},{x:920,y:850}],'湖畔道路');add('port',[{x:280,y:500}],'湖畔桟橋');label('中央湖',500,500);
 }
 if(id==='mountain_village'){
  cells((x,y,i)=>{if(Math.abs(y-.5)<.09){p.terrain[i]='plain';p.elevation[i]=180;}});
  line('road',[{x:20,y:500},{x:980,y:500}],'峠道');for(let i=0;i<10;i++)box('house',200+i%5*130,350+Math.floor(i/5)*240,45,45);
  box('clinic',800,580,55,55);add('observation_post',[{x:500,y:220}],'尾根監視所');label('山岳集落',500,720);
 }
 if(id==='training_ground'){
  p.terrain.fill('plain');p.elevation.fill(20);
  for(let y=220;y<=780;y+=280)line('trench',[{x:620,y:y-70},{x:640,y},{x:620,y:y+70}],'演習塹壕');
  for(let y=200;y<900;y+=220)add('objective',[{x:800,y}],'演習目標');box('command_post',100,120);box('workshop',100,740);line('road',[{x:220,y:30},{x:220,y:970}],'演習場道路');label('平原演習区',450,100);
 }
 if(id==='coastal_industry'){
  cells((x,y,i)=>{p.terrain[i]=x<.38?'water':'plain';p.elevation[i]=x<.38?-35:12;});
  for(let y=180;y<850;y+=180){box('factory',560,y,100,100);box('warehouse',760,y,100,100);}
  line('pier',[{x:380,y:180},{x:380,y:850}],'工業港岸壁');line('railway',[{x:700,y:30},{x:700,y:970}],'工業貨物線');box('substation',850,50,70,60);label('沿岸工業区',650,950);
 }
 if(id==='evacuation_hub'){
  p.terrain.fill('plain');p.elevation.fill(12);
  for(let i=0;i<6;i++)box('shelter',180+i%3*230,200+Math.floor(i/3)*200,130,120);
  box('civil_hospital',180,700,150,100);box('distribution_center',420,700,130,100);box('water_point',650,700,80,80);box('bus_terminal',780,350,120,200);
  line('road',[{x:40,y:620},{x:940,y:620},{x:940,y:50}],'搬送道路');label('避難受入地区',450,100);
 }
 for(const f of p.facilities)if(!f.name)f.name=FACILITY_TYPES[f.type];
 p.mapSeed=seed;return p;
}
