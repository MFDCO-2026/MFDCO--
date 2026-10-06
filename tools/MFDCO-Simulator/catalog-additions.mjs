// CATALOG-1.2: editable fictional production assets; no dedicated special abilities.
export const ADDED_TYPES=[
 ['signal_team','通信班','land',5,100,0,0,'support','名','hq'],
 ['medical_team','衛生班','land',5,100,0,0,'support','名','engineer'],
 ['logistics_team','補給作業班','land',4,140,0,0,'support','名','engineer'],
 ['engineer_truck','工兵作業車','land',30,220,0,0,'support','両','engineer'],
 ['mobile_workshop','整備作業車','land',30,200,0,0,'support','両','apc'],
 ['water_truck','給水車','land',35,160,0,0,'support','両','apc'],
 ['heavy_transport','重輸送車','land',25,260,0,0,'support','両','apc'],
 ['aa_gun','牽引対空砲','land',12,140,8,2,'fire','門','antiair'],
 ['rescue_boat','救難艇','sea',30,350,0,0,'support','隻','transport_ship'],
 ['survey_ship','測量艦','sea',25,700,0,0,'support','隻','transport_ship'],
 ['container_ship','コンテナ輸送船','sea',24,1500,0,0,'support','隻','transport_ship'],
 ['coastal_transport','沿岸輸送艇','sea',22,450,0,0,'support','隻','landing_craft'],
 ['utility_helicopter','多用途ヘリ','air',220,140,0,0,'support','機','helicopter'],
 ['cargo_helicopter','大型輸送ヘリ','air',200,260,0,0,'support','機','helicopter'],
 ['light_transport','軽輸送機','air',280,130,0,0,'support','機','transport_aircraft'],
 ['maritime_recon','洋上偵察機','air',400,150,0,0,'support','機','aircraft']
].map(([id,name,domain,speed,hp,attack,range,category,quantity,symbol])=>({id,name,domain,speed,hp,attack,range,category,quantity,symbol,targetDomains:id==='aa_gun'?['air']:[]}));
export const ADDED_TYPE_BY_ID=Object.fromEntries(ADDED_TYPES.map(t=>[t.id,t]));
export const ADDED_FACILITIES={rescue_station:'救難拠点',repair_depot:'整備補給所',vehicle_park:'車両集積場',ammunition_workshop:'弾薬整備所',desalination:'海水淡水化施設',pumping_station:'揚水施設',power_control:'電力管理所',freight_terminal:'貨物ターミナル',ferry_terminal:'連絡船ターミナル',control_tower:'管制塔',weather_station:'気象観測所',radio_relay:'無線中継所',radar_bunker:'レーダー掩体',fuel_pier:'給油岸壁',field_surgery:'野外手術所',emergency_shelter:'応急避難施設'};
export const ADDED_GLYPHS={rescue_station:'救難',repair_depot:'整備',vehicle_park:'車両',ammunition_workshop:'弾整',desalination:'淡水',pumping_station:'揚水',power_control:'電管',freight_terminal:'貨物',ferry_terminal:'連絡',control_tower:'管制',weather_station:'気象',radio_relay:'中継',radar_bunker:'探掩',fuel_pier:'給油',emergency_shelter:'応避'};
