/* MFDCO Tools v2.2 shared calendar/era engine */
(function(global){
"use strict";

const ERA_CATALOG=[{"name":"大化","startYear":645,"startMonth":1},{"name":"白雉","startYear":650,"startMonth":3},{"name":"白鳳","startYear":672,"startMonth":1},{"name":"朱鳥","startYear":686,"startMonth":8},{"name":"大宝","startYear":701,"startMonth":4},{"name":"慶雲","startYear":704,"startMonth":5},{"name":"和銅","startYear":708,"startMonth":1},{"name":"霊亀","startYear":715,"startMonth":9},{"name":"養老","startYear":717,"startMonth":12},{"name":"神亀","startYear":724,"startMonth":2},{"name":"天平","startYear":729,"startMonth":8},{"name":"天平感宝","startYear":749,"startMonth":5},{"name":"天平勝宝","startYear":749,"startMonth":7},{"name":"天平宝字","startYear":757,"startMonth":9},{"name":"天平神護","startYear":765,"startMonth":1},{"name":"神護景雲","startYear":767,"startMonth":9},{"name":"宝亀","startYear":770,"startMonth":10},{"name":"天応","startYear":781,"startMonth":1},{"name":"延暦","startYear":782,"startMonth":9},{"name":"大同","startYear":806,"startMonth":6},{"name":"弘仁","startYear":810,"startMonth":10},{"name":"天長","startYear":824,"startMonth":1},{"name":"承和","startYear":834,"startMonth":1},{"name":"嘉祥","startYear":848,"startMonth":7},{"name":"仁寿","startYear":851,"startMonth":5},{"name":"斉衡","startYear":854,"startMonth":12},{"name":"天安","startYear":857,"startMonth":3},{"name":"貞観","startYear":859,"startMonth":5},{"name":"元慶","startYear":877,"startMonth":5},{"name":"仁和","startYear":885,"startMonth":3},{"name":"寛平","startYear":889,"startMonth":5},{"name":"昌泰","startYear":898,"startMonth":5},{"name":"延喜","startYear":901,"startMonth":8},{"name":"延長","startYear":923,"startMonth":5},{"name":"承平","startYear":931,"startMonth":5},{"name":"天慶","startYear":938,"startMonth":6},{"name":"天暦","startYear":947,"startMonth":5},{"name":"天徳","startYear":957,"startMonth":11},{"name":"応和","startYear":961,"startMonth":3},{"name":"康保","startYear":964,"startMonth":7},{"name":"安和","startYear":968,"startMonth":9},{"name":"天禄","startYear":970,"startMonth":4},{"name":"天延","startYear":974,"startMonth":1},{"name":"貞元","startYear":976,"startMonth":8},{"name":"天元","startYear":978,"startMonth":12},{"name":"永観","startYear":983,"startMonth":5},{"name":"寛和","startYear":985,"startMonth":5},{"name":"永延","startYear":987,"startMonth":4},{"name":"永祚","startYear":989,"startMonth":8},{"name":"正暦","startYear":990,"startMonth":11},{"name":"長徳","startYear":995,"startMonth":3},{"name":"長保","startYear":999,"startMonth":2},{"name":"寛弘","startYear":1004,"startMonth":8},{"name":"長和","startYear":1013,"startMonth":1},{"name":"寛仁","startYear":1017,"startMonth":5},{"name":"治安","startYear":1021,"startMonth":2},{"name":"万寿","startYear":1024,"startMonth":8},{"name":"長元","startYear":1028,"startMonth":8},{"name":"長暦","startYear":1037,"startMonth":5},{"name":"長久","startYear":1040,"startMonth":12},{"name":"寛徳","startYear":1044,"startMonth":12},{"name":"永承","startYear":1046,"startMonth":5},{"name":"天喜","startYear":1053,"startMonth":2},{"name":"康平","startYear":1058,"startMonth":9},{"name":"治暦","startYear":1065,"startMonth":8},{"name":"延久","startYear":1069,"startMonth":5},{"name":"承保","startYear":1074,"startMonth":9},{"name":"承暦","startYear":1077,"startMonth":12},{"name":"永保","startYear":1081,"startMonth":3},{"name":"応徳","startYear":1084,"startMonth":2},{"name":"寛治","startYear":1087,"startMonth":4},{"name":"嘉保","startYear":1095,"startMonth":1},{"name":"永長","startYear":1097,"startMonth":1},{"name":"承徳","startYear":1097,"startMonth":12},{"name":"康和","startYear":1099,"startMonth":9},{"name":"長治","startYear":1104,"startMonth":3},{"name":"嘉承","startYear":1106,"startMonth":5},{"name":"天仁","startYear":1108,"startMonth":8},{"name":"天永","startYear":1110,"startMonth":8},{"name":"永久","startYear":1113,"startMonth":8},{"name":"元永","startYear":1118,"startMonth":4},{"name":"保安","startYear":1120,"startMonth":5},{"name":"天治","startYear":1124,"startMonth":4},{"name":"大治","startYear":1126,"startMonth":2},{"name":"天承","startYear":1131,"startMonth":2},{"name":"長承","startYear":1132,"startMonth":9},{"name":"保延","startYear":1135,"startMonth":5},{"name":"永治","startYear":1141,"startMonth":8},{"name":"康治","startYear":1142,"startMonth":5},{"name":"天養","startYear":1144,"startMonth":3},{"name":"久安","startYear":1145,"startMonth":8},{"name":"仁平","startYear":1151,"startMonth":2},{"name":"久寿","startYear":1154,"startMonth":11},{"name":"保元","startYear":1156,"startMonth":5},{"name":"平治","startYear":1159,"startMonth":5},{"name":"永暦","startYear":1160,"startMonth":2},{"name":"応保","startYear":1161,"startMonth":9},{"name":"長寛","startYear":1163,"startMonth":4},{"name":"永万","startYear":1165,"startMonth":6},{"name":"仁安","startYear":1166,"startMonth":9},{"name":"嘉応","startYear":1169,"startMonth":4},{"name":"承安","startYear":1171,"startMonth":5},{"name":"安元","startYear":1175,"startMonth":8},{"name":"治承","startYear":1177,"startMonth":8},{"name":"養和","startYear":1181,"startMonth":8},{"name":"寿永","startYear":1182,"startMonth":6},{"name":"元暦","startYear":1184,"startMonth":5},{"name":"文治","startYear":1185,"startMonth":9},{"name":"建久","startYear":1190,"startMonth":5},{"name":"正治","startYear":1199,"startMonth":5},{"name":"建仁","startYear":1201,"startMonth":3},{"name":"元久","startYear":1204,"startMonth":3},{"name":"建永","startYear":1206,"startMonth":5},{"name":"承元","startYear":1207,"startMonth":11},{"name":"建暦","startYear":1211,"startMonth":4},{"name":"建保","startYear":1213,"startMonth":12},{"name":"承久","startYear":1219,"startMonth":5},{"name":"貞応","startYear":1222,"startMonth":5},{"name":"元仁","startYear":1224,"startMonth":12},{"name":"嘉禄","startYear":1225,"startMonth":5},{"name":"安貞","startYear":1228,"startMonth":1},{"name":"寛喜","startYear":1229,"startMonth":3},{"name":"貞永","startYear":1232,"startMonth":4},{"name":"天福","startYear":1233,"startMonth":5},{"name":"文暦","startYear":1234,"startMonth":11},{"name":"嘉禎","startYear":1235,"startMonth":10},{"name":"暦仁","startYear":1238,"startMonth":12},{"name":"延応","startYear":1239,"startMonth":2},{"name":"仁治","startYear":1240,"startMonth":8},{"name":"寛元","startYear":1243,"startMonth":3},{"name":"宝治","startYear":1247,"startMonth":3},{"name":"建長","startYear":1249,"startMonth":4},{"name":"康元","startYear":1256,"startMonth":10},{"name":"正嘉","startYear":1257,"startMonth":4},{"name":"正元","startYear":1259,"startMonth":4},{"name":"文応","startYear":1260,"startMonth":5},{"name":"弘長","startYear":1261,"startMonth":3},{"name":"文永","startYear":1264,"startMonth":3},{"name":"建治","startYear":1275,"startMonth":5},{"name":"弘安","startYear":1278,"startMonth":3},{"name":"正応","startYear":1288,"startMonth":5},{"name":"永仁","startYear":1293,"startMonth":8},{"name":"正安","startYear":1299,"startMonth":5},{"name":"乾元","startYear":1302,"startMonth":12},{"name":"嘉元","startYear":1303,"startMonth":8},{"name":"徳治","startYear":1307,"startMonth":1},{"name":"延慶","startYear":1308,"startMonth":11},{"name":"応長","startYear":1311,"startMonth":5},{"name":"正和","startYear":1312,"startMonth":4},{"name":"文保","startYear":1317,"startMonth":2},{"name":"元応","startYear":1319,"startMonth":5},{"name":"元亨","startYear":1321,"startMonth":3},{"name":"正中","startYear":1325,"startMonth":1},{"name":"嘉暦","startYear":1326,"startMonth":5},{"name":"元徳","startYear":1329,"startMonth":9},{"name":"元弘","startYear":1331,"startMonth":9},{"name":"建武","startYear":1334,"startMonth":2},{"name":"延元","startYear":1336,"startMonth":3},{"name":"興国","startYear":1340,"startMonth":5},{"name":"正平","startYear":1347,"startMonth":1},{"name":"建徳","startYear":1370,"startMonth":8},{"name":"文中","startYear":1372,"startMonth":4},{"name":"天授","startYear":1375,"startMonth":6},{"name":"康暦","startYear":1379,"startMonth":4},{"name":"弘和","startYear":1381,"startMonth":3},{"name":"元中","startYear":1384,"startMonth":5},{"name":"嘉慶","startYear":1387,"startMonth":9},{"name":"康応","startYear":1389,"startMonth":3},{"name":"明徳","startYear":1390,"startMonth":4},{"name":"応永","startYear":1394,"startMonth":7},{"name":"正長","startYear":1428,"startMonth":5},{"name":"永享","startYear":1429,"startMonth":9},{"name":"嘉吉","startYear":1441,"startMonth":3},{"name":"文安","startYear":1444,"startMonth":2},{"name":"宝徳","startYear":1449,"startMonth":8},{"name":"享徳","startYear":1452,"startMonth":8},{"name":"康正","startYear":1455,"startMonth":8},{"name":"長禄","startYear":1457,"startMonth":10},{"name":"寛正","startYear":1461,"startMonth":1},{"name":"文正","startYear":1466,"startMonth":3},{"name":"応仁","startYear":1467,"startMonth":3},{"name":"文明","startYear":1469,"startMonth":5},{"name":"長享","startYear":1487,"startMonth":8},{"name":"延徳","startYear":1489,"startMonth":9},{"name":"明応","startYear":1492,"startMonth":8},{"name":"文亀","startYear":1501,"startMonth":3},{"name":"永正","startYear":1504,"startMonth":3},{"name":"大永","startYear":1521,"startMonth":9},{"name":"享禄","startYear":1528,"startMonth":9},{"name":"天文","startYear":1532,"startMonth":8},{"name":"弘治","startYear":1555,"startMonth":11},{"name":"永禄","startYear":1558,"startMonth":3},{"name":"元亀","startYear":1570,"startMonth":5},{"name":"天正","startYear":1573,"startMonth":8},{"name":"文禄","startYear":1592,"startMonth":12},{"name":"慶長","startYear":1596,"startMonth":11},{"name":"元和","startYear":1615,"startMonth":7},{"name":"寛永","startYear":1624,"startMonth":3},{"name":"正保","startYear":1645,"startMonth":1},{"name":"慶安","startYear":1648,"startMonth":2},{"name":"承応","startYear":1652,"startMonth":10},{"name":"明暦","startYear":1655,"startMonth":4},{"name":"万治","startYear":1658,"startMonth":8},{"name":"寛文","startYear":1661,"startMonth":5},{"name":"延宝","startYear":1673,"startMonth":10},{"name":"天和","startYear":1681,"startMonth":10},{"name":"貞享","startYear":1684,"startMonth":3},{"name":"元禄","startYear":1688,"startMonth":10},{"name":"宝永","startYear":1704,"startMonth":3},{"name":"正徳","startYear":1711,"startMonth":5},{"name":"享保","startYear":1716,"startMonth":7},{"name":"元文","startYear":1736,"startMonth":5},{"name":"寛保","startYear":1741,"startMonth":3},{"name":"延享","startYear":1744,"startMonth":3},{"name":"寛延","startYear":1748,"startMonth":7},{"name":"宝暦","startYear":1751,"startMonth":11},{"name":"明和","startYear":1764,"startMonth":6},{"name":"安永","startYear":1772,"startMonth":12},{"name":"天明","startYear":1781,"startMonth":4},{"name":"寛政","startYear":1789,"startMonth":2},{"name":"享和","startYear":1801,"startMonth":2},{"name":"文化","startYear":1804,"startMonth":2},{"name":"文政","startYear":1818,"startMonth":5},{"name":"天保","startYear":1830,"startMonth":12},{"name":"弘化","startYear":1844,"startMonth":12},{"name":"嘉永","startYear":1848,"startMonth":3},{"name":"安政","startYear":1854,"startMonth":12},{"name":"万延","startYear":1860,"startMonth":4},{"name":"文久","startYear":1861,"startMonth":3},{"name":"元治","startYear":1864,"startMonth":3},{"name":"慶応","startYear":1865,"startMonth":4},{"name":"明治","startYear":1868,"startMonth":9},{"name":"大正","startYear":1912,"startMonth":8},{"name":"昭和","startYear":1927,"startMonth":1},{"name":"平成","startYear":1989,"startMonth":1},{"name":"令和","startYear":2019,"startMonth":5}];

function validDateUTC(y,m,d){
  const dt=new Date(Date.UTC(y,m-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;
}
function weekdayJa(y,m,d){
  const dt=new Date(Date.UTC(y,m-1,d));
  return new Intl.DateTimeFormat("ja-JP",{weekday:"long",timeZone:"UTC"}).format(dt);
}
function dayOfYear(y,m,d){
  const a=Date.UTC(y,0,1),b=Date.UTC(y,m-1,d);
  return Math.floor((b-a)/86400000)+1;
}
function isoWeek(y,m,d){
  const date=new Date(Date.UTC(y,m-1,d));
  const day=date.getUTCDay()||7;
  date.setUTCDate(date.getUTCDate()+4-day);
  const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const week=Math.ceil((((date-yearStart)/86400000)+1)/7);
  return {year:date.getUTCFullYear(),week};
}
function gregorianToJDN(y,m,d){
  const a=Math.floor((14-m)/12);
  const y2=y+4800-a;
  const m2=m+12*a-3;
  return d+Math.floor((153*m2+2)/5)+365*y2+Math.floor(y2/4)-Math.floor(y2/100)+Math.floor(y2/400)-32045;
}
function jdnToGregorian(jdn){
  let a=jdn+32044;
  let b=Math.floor((4*a+3)/146097);
  let c=a-Math.floor(146097*b/4);
  let d=Math.floor((4*c+3)/1461);
  let e=c-Math.floor(1461*d/4);
  let m=Math.floor((5*e+2)/153);
  const day=e-Math.floor((153*m+2)/5)+1;
  const month=m+3-12*Math.floor(m/10);
  const year=100*b+d-4800+Math.floor(m/10);
  return {year,month,day};
}
function jdnToJulian(jdn){
  const c=jdn+32082;
  const dd=Math.floor((4*c+3)/1461);
  const e=c-Math.floor(1461*dd/4);
  const mm=Math.floor((5*e+2)/153);
  const day=e-Math.floor((153*mm+2)/5)+1;
  const month=mm+3-12*Math.floor(mm/10);
  const year=dd-4800+Math.floor(mm/10);
  return {year,month,day};
}
function formatDate(y,m,d){
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function formatIntlCalendar(y,m,d,calendar,locale="ja-JP"){
  try{
    const dt=new Date(Date.UTC(y,m-1,d));
    return new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}`,{
      year:"numeric",month:"long",day:"numeric",timeZone:"UTC"
    }).format(dt);
  }catch(_){
    return "未対応";
  }
}
function japaneseEraForDate(y,m,d){
  try{
    const dt=new Date(Date.UTC(y,m-1,d));
    return new Intl.DateTimeFormat("ja-JP-u-ca-japanese",{
      era:"long",year:"numeric",month:"long",day:"numeric",timeZone:"UTC"
    }).format(dt);
  }catch(_){
    return "未対応";
  }
}
function findEra(name){
  return ERA_CATALOG.find(e=>e.name===name)||null;
}
function eraApproxToGregorian(name,eraYear,m,d){
  const era=findEra(name);
  if(!era)throw new Error("元号が見つかりません");
  const y=era.startYear+Number(eraYear)-1;
  if(!validDateUTC(y,m,d))throw new Error("日付が不正です");
  return {year:y,month:m,day:d,approximate:true,era};
}
function gregorianToKoki(y){return y+660}
function kokiToGregorian(koki){return Number(koki)-660}

function summarizeGregorian(y,m,d){
  y=Number(y);m=Number(m);d=Number(d);
  if(!validDateUTC(y,m,d))throw new Error("日付が不正です");
  const jdn=gregorianToJDN(y,m,d);
  const jul=jdnToJulian(jdn);
  const iso=isoWeek(y,m,d);
  return {
    gregorian:formatDate(y,m,d),
    weekday:weekdayJa(y,m,d),
    koki:gregorianToKoki(y),
    japaneseEra:japaneseEraForDate(y,m,d),
    isoWeek:`${iso.year}-W${String(iso.week).padStart(2,"0")}`,
    dayOfYear:dayOfYear(y,m,d),
    jdn,
    mjd:jdn-2400001,
    julian:`${jul.year}-${String(jul.month).padStart(2,"0")}-${String(jul.day).padStart(2,"0")}`,
    buddhist:formatIntlCalendar(y,m,d,"buddhist"),
    roc:formatIntlCalendar(y,m,d,"roc"),
    islamicCivil:formatIntlCalendar(y,m,d,"islamic-civil"),
    hebrew:formatIntlCalendar(y,m,d,"hebrew"),
    persian:formatIntlCalendar(y,m,d,"persian"),
    indian:formatIntlCalendar(y,m,d,"indian"),
    chinese:formatIntlCalendar(y,m,d,"chinese")
  };
}

global.MFDCOCalendar={
  version:"2.2",
  eras:ERA_CATALOG,
  validDateUTC,weekdayJa,dayOfYear,isoWeek,
  gregorianToJDN,jdnToGregorian,jdnToJulian,
  formatDate,formatIntlCalendar,japaneseEraForDate,
  findEra,eraApproxToGregorian,gregorianToKoki,kokiToGregorian,
  summarizeGregorian
};
})(typeof window!=="undefined"?window:globalThis);
