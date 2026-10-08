"use strict";
(function(){
const C=window.MFDCOCountry,Cloud=window.MFDCOCountryCloud;
const CLIMATES=["熱帯雨林気候","熱帯モンスーン気候","サバナ気候","砂漠気候","ステップ気候","温暖湿潤気候","西岸海洋性気候","地中海性気候","亜寒帯湿潤気候","亜寒帯冬季少雨気候","ツンドラ気候","氷雪気候","高山気候"];
const PRODUCTS=["石油","天然ガス","石炭","鉄鉱石","銅","ボーキサイト","レアメタル","金","小麦","米","とうもろこし","大豆","畜産物","水産物","木材","自動車","航空機","船舶","電子機器","半導体","工作機械","医薬品","化学製品","繊維","伝統工芸品","観光","金融サービス","ソフトウェア"];
const EQUIPMENT_TYPES=["戦車","装甲車","自走砲","火砲","防空システム","小火器","ミサイル","戦闘機","攻撃機","爆撃機","輸送機","早期警戒機","無人航空機","ヘリコプター","空母","戦艦","巡洋艦","駆逐艦","フリゲート","コルベット","潜水艦","揚陸艦","補給艦","哨戒艦","宇宙機","人工衛星","サイバー装備","核兵器","その他"];
const BRANCH_TYPES=["陸軍","海軍","空軍","海兵隊","宇宙軍","防空軍","戦略軍","サイバー軍","沿岸警備隊","憲兵","国家親衛隊","特殊作戦軍","その他"];
const POST_TYPES=["ニュース","設定更新","公告","外交","軍事","経済","文化","災害","選挙","法律","その他"];
const WIKI_TYPES=["都市・首都","人物","企業","法律・制度","戦争・紛争","兵器・装備","組織・省庁","行政区","条約","歴史事件","文化","インフラ","産業","その他"];
const SYSTEM_TYPES=["国籍","教育","医療","税制","年金・福祉","交通","通信","電力","水道","食料","金融","中央銀行","科学技術","警察","司法","防災","移民","選挙","徴兵・動員","産業政策","環境政策","その他"];
function option(list,val=""){return list.map(x=>`<option ${x===val?"selected":""}>${C.esc(x)}</option>`).join("")}
function countryLink(page,c,id){return `${page}?id=${encodeURIComponent(c?.id||id||C.currentId())}`}
async function image(key){return Cloud?.resolveMedia?await Cloud.resolveMedia(key):C.mediaUrl(key)}
async function load(){return Cloud?.loadCountry?await Cloud.loadCountry(C.currentId()):C.get()}
async function save(c){return Cloud?.saveCountry?await Cloud.saveCountry(c):C.save(c)}
function toast(msg,type="ok"){let n=document.createElement("div");n.className=`alert ${type}`;n.style="position:fixed;right:18px;bottom:18px;z-index:9999;max-width:420px;box-shadow:var(--shadow)";n.textContent=msg;document.body.appendChild(n);setTimeout(()=>n.remove(),3500)}
function simpleTable(rows,cols){if(!rows.length)return `<div class="empty">データはまだありません。</div>`;return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${C.esc(c[0])}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${c[2]?c[2](r[c[1]],r):C.esc(r[c[1]]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`}
window.MFDCOCountryV6={CLIMATES,PRODUCTS,EQUIPMENT_TYPES,BRANCH_TYPES,POST_TYPES,WIKI_TYPES,SYSTEM_TYPES,option,countryLink,image,load,save,toast,simpleTable};
})();
