/* MFDCO Tools v3.6 quantity + dimensional analysis engine */
(function(global){
"use strict";
if(!global.MFDCOUnits)throw new Error("mfdco-units.js must be loaded before mfdco-quantities.js");

const VERSION="3.7";
const DIM_KEYS=["L","M","T","I","Th","N","J"];

const CATEGORY_DIMS={
  length:{L:1},area:{L:2},volume:{L:3},time:{T:1},mass:{M:1},
  speed:{L:1,T:-1},acceleration:{L:1,T:-2},force:{M:1,L:1,T:-2},
  torque:{M:1,L:2,T:-2},pressure:{M:1,L:-1,T:-2},energy:{M:1,L:2,T:-2},
  power:{M:1,L:2,T:-3},frequency:{T:-1},charge:{I:1,T:1},
  voltage:{M:1,L:2,T:-3,I:-1},current:{I:1},
  resistance:{M:1,L:2,T:-3,I:-2},capacitance:{M:-1,L:-2,T:4,I:2},
  inductance:{M:1,L:2,T:-2,I:-2},conductance:{M:-1,L:-2,T:3,I:2},
  magneticFlux:{M:1,L:2,T:-2,I:-1},magneticFluxDensity:{M:1,T:-2,I:-1},
  temperature:{Th:1},temperatureDelta:{Th:1},amount:{N:1},luminous:{J:1},
  luminousFlux:{J:1},illuminance:{J:1,L:-2},angle:{},data:{},
  density:{M:1,L:-3},dynamicViscosity:{M:1,L:-1,T:-1},
  kinematicViscosity:{L:2,T:-1},radioactivity:{T:-1},
  absorbedDose:{L:2,T:-2},equivalentDose:{L:2,T:-2},
  minecraftLength:{L:1},minecraftTime:{T:1}
};

const CANONICAL=[
  [{}, ""],[{L:1},"m"],[{L:2},"m^2"],[{L:3},"m^3"],[{T:1},"s"],[{M:1},"kg"],
  [{I:1},"A"],[{Th:1},"K"],[{N:1},"mol"],[{J:1},"cd"],
  [{L:1,T:-1},"m/s"],[{L:1,T:-2},"m/s^2"],[{M:1,L:1,T:-2},"N"],
  [{M:1,L:2,T:-2},"J"],[{M:1,L:-1,T:-2},"Pa"],[{M:1,L:2,T:-3},"W"],
  [{T:-1},"Hz"],[{I:1,T:1},"C"],[{M:1,L:2,T:-3,I:-1},"V"],
  [{M:1,L:2,T:-3,I:-2},"ohm"],[{M:-1,L:-2,T:4,I:2},"F"],
  [{M:1,L:2,T:-2,I:-2},"H"],[{M:-1,L:-2,T:3,I:2},"S"],
  [{M:1,L:2,T:-2,I:-1},"Wb"],[{M:1,T:-2,I:-1},"T"],
  [{M:1,L:-3},"kg/m^3"],[{M:1,L:-1,T:-1},"Pa*s"],[{L:2,T:-1},"m^2/s"],
  [{L:2,T:-2},"m^2/s^2"]
];

function cleanDims(dims={}){
  const out={};
  for(const k of DIM_KEYS){
    const v=Number(dims[k]||0);
    if(Math.abs(v)>1e-12)out[k]=v;
  }
  return out;
}
function dimsKey(dims={}){
  const d=cleanDims(dims);
  return DIM_KEYS.map(k=>`${k}:${Number(d[k]||0).toPrecision(12)}`).join("|");
}
function sameDims(a,b){return dimsKey(a)===dimsKey(b)}
function combineDims(a,b,sign=1){
  const out={...cleanDims(a)};
  for(const k of DIM_KEYS)out[k]=(out[k]||0)+sign*(b?.[k]||0);
  return cleanDims(out);
}
function powDims(a,p){
  const out={};
  for(const k of DIM_KEYS)out[k]=(a?.[k]||0)*p;
  return cleanDims(out);
}
function isDimensionless(d){return Object.keys(cleanDims(d)).length===0}
function canonicalUnit(dims){
  const key=dimsKey(dims);
  for(const [d,u] of CANONICAL)if(dimsKey(d)===key)return u;
  const d=cleanDims(dims),num=[],den=[];
  const base={L:"m",M:"kg",T:"s",I:"A",Th:"K",N:"mol",J:"cd"};
  for(const k of DIM_KEYS){
    const p=d[k]||0;
    if(!p)continue;
    const target=p>0?num:den,n=Math.abs(p);
    target.push(n===1?base[k]:`${base[k]}^${Number(n.toPrecision(8))}`);
  }
  const n=num.length?num.join("*"):"1";
  return den.length?`${n}/${den.join("*")}`:(n==="1"?"":n);
}

function unitAliases(){
  const map=new Map();
  for(const u of global.MFDCOUnits.BUILTIN_UNITS){
    map.set(String(u.id),u);
    if(u.symbol&&/^[A-Za-zµΩ][A-Za-z0-9_µΩ]*$/.test(u.symbol))map.set(u.symbol,u);
  }
  map.set("ohm",global.MFDCOUnits.getBuiltIn("ohm"));
  return map;
}
const UNIT_ALIASES=unitAliases();
const PREFIXES=[...global.MFDCOUnits.PREFIXES].filter(x=>x[0]).sort((a,b)=>b[0].length-a[0].length);

function resolveUnitToken(token){
  if(UNIT_ALIASES.has(token)){
    const unit=UNIT_ALIASES.get(token);
    if(unit)return {unit,prefix:"",prefixFactor:1,token};
  }
  for(const [prefix,,factor] of PREFIXES){
    if(!token.startsWith(prefix)||token.length<=prefix.length)continue;
    const base=token.slice(prefix.length),unit=UNIT_ALIASES.get(base);
    if(unit?.prefix)return {unit,prefix,prefixFactor:factor,token};
  }
  return null;
}
function isKnownUnitToken(token){return !!resolveUnitToken(token)}

function unitDescriptor(token){
  const r=resolveUnitToken(token);
  if(!r)throw new Error(`不明な単位です: ${token}`);
  const dims=CATEGORY_DIMS[r.unit.cat];
  if(dims===undefined)throw new Error(`次元定義のない単位です: ${token}`);
  return {
    factor:Number(r.unit.factor)*r.prefixFactor,dims:cleanDims(dims),display:token,
    unit:r.unit,prefix:r.prefix,absoluteTemperature:r.unit.cat==="temperature"
  };
}
function mulUnit(a,b){return {factor:a.factor*b.factor,dims:combineDims(a.dims,b.dims,1),display:`${a.display}*${b.display}`,absoluteTemperature:false}}
function divUnit(a,b){return {factor:a.factor/b.factor,dims:combineDims(a.dims,b.dims,-1),display:`${a.display}/${b.display}`,absoluteTemperature:false}}
function powUnit(a,p){return {factor:Math.pow(a.factor,p),dims:powDims(a.dims,p),display:p===1?a.display:`${a.display}^${p}`,absoluteTemperature:false}}

function parseUnitExpression(text){
  const tokens=String(text).trim().match(/[A-Za-z_µΩ][A-Za-z0-9_µΩ]*|[-+]?\d+(?:\.\d+)?|[*/^]/g)||[];
  if(!tokens.length)throw new Error("単位が指定されていません");
  let i=0;
  function factor(){
    const name=tokens[i++];
    if(!name||!/^[A-Za-z_µΩ]/.test(name))throw new Error("単位式が不正です");
    let u=unitDescriptor(name);
    if(tokens[i]==="^"){
      i++;const p=Number(tokens[i++]);
      if(!Number.isFinite(p))throw new Error("単位の指数が不正です");
      u=powUnit(u,p);
    }
    return u;
  }
  let out=factor();
  while(i<tokens.length){
    const op=tokens[i++];
    if(op!=="*"&&op!=="/")throw new Error("単位式が不正です");
    const rhs=factor();
    out=op==="*"?mulUnit(out,rhs):divUnit(out,rhs);
  }
  out.display=String(text).trim();
  return out;
}

class Quantity{
  constructor(siValue,dims={},displayUnit="",meta={}){
    this.siValue=Number(siValue);
    if(!Number.isFinite(this.siValue))throw new Error("単位付き数値が有限数ではありません");
    this.dims=cleanDims(dims);
    this.displayUnit=displayUnit||canonicalUnit(this.dims);
    this.absoluteTemperature=!!meta.absoluteTemperature;
    this.__mfdcoQuantity=true;
  }
  valueOf(){return this.siValue}
  toString(){return format(this)}
  toJSON(){return {value:this.siValue,dims:this.dims,unit:this.displayUnit,__quantity:true}}
}
function isQuantity(v){return !!(v&&v.__mfdcoQuantity===true&&v.dims)}
function asQuantity(v){return isQuantity(v)?v:new Quantity(Number(v),{},"")}

function fromUnit(value,unitIdOrText,prefix=""){
  const raw=Number(value);
  if(!Number.isFinite(raw))throw new Error("値が数値ではありません");
  const exact=global.MFDCOUnits.getBuiltIn(unitIdOrText);
  if(exact){
    const dims=CATEGORY_DIMS[exact.cat]||{};
    if(exact.cat==="temperature"){
      const kelvin=global.MFDCOUnits.convertValue(raw,exact,global.MFDCOUnits.getBuiltIn("K"),prefix,"");
      return new Quantity(kelvin,dims,exact.id,{absoluteTemperature:true});
    }
    const pf=exact.prefix?global.MFDCOUnits.prefixFactor(prefix):1;
    return new Quantity(raw*Number(exact.factor)*pf,dims,(prefix||"")+(exact.symbol||exact.id));
  }
  const u=parseUnitExpression((prefix||"")+unitIdOrText);
  return new Quantity(raw*u.factor,u.dims,u.display,{absoluteTemperature:u.absoluteTemperature});
}
function quantity(value,unitText){return fromUnit(value,unitText)}

function formatScalar(n){
  if(Math.abs(n)>=1e12||(Math.abs(n)>0&&Math.abs(n)<1e-9))return n.toExponential(10);
  return String(Number(n.toPrecision(12)));
}
function convertTo(q,targetText){
  q=asQuantity(q);
  const exact=global.MFDCOUnits.getBuiltIn(targetText);
  if(exact?.cat==="temperature"){
    if(!sameDims(q.dims,CATEGORY_DIMS.temperature))throw new Error("温度ではない値を温度単位へ変換できません");
    const value=global.MFDCOUnits.convertValue(q.siValue,global.MFDCOUnits.getBuiltIn("K"),exact,"","");
    return {value,unit:exact.symbol||exact.id,text:`${formatScalar(value)} ${exact.symbol||exact.id}`};
  }
  const target=parseUnitExpression(targetText);
  if(!sameDims(q.dims,target.dims))throw new Error(`次元が一致しません: ${canonicalUnit(q.dims)||"無次元"} → ${targetText}`);
  const value=q.siValue/target.factor;
  return {value,unit:targetText,text:`${formatScalar(value)}${targetText?" "+targetText:""}`};
}
function format(q){
  if(!isQuantity(q))return formatScalar(Number(q));
  const unit=q.displayUnit||canonicalUnit(q.dims);
  if(!unit)return formatScalar(q.siValue);
  try{return convertTo(q,unit).text}
  catch(_){return `${formatScalar(q.siValue)} ${canonicalUnit(q.dims)}`.trim()}
}
function assertTemperature(a,b=null,op="演算"){
  if(a?.absoluteTemperature||b?.absoluteTemperature)throw new Error(`絶対温度は ${op} できません。温度差を使用してください`);
}
function add(a,b){
  a=asQuantity(a);b=asQuantity(b);assertTemperature(a,b,"加算");
  if(!sameDims(a.dims,b.dims))throw new Error(`次元が一致しないため加算できません: ${canonicalUnit(a.dims)||"無次元"} と ${canonicalUnit(b.dims)||"無次元"}`);
  return new Quantity(a.siValue+b.siValue,a.dims,a.displayUnit||b.displayUnit);
}
function sub(a,b){
  a=asQuantity(a);b=asQuantity(b);assertTemperature(a,b,"減算");
  if(!sameDims(a.dims,b.dims))throw new Error(`次元が一致しないため減算できません: ${canonicalUnit(a.dims)||"無次元"} と ${canonicalUnit(b.dims)||"無次元"}`);
  return new Quantity(a.siValue-b.siValue,a.dims,a.displayUnit||b.displayUnit);
}
function mul(a,b){
  a=asQuantity(a);b=asQuantity(b);assertTemperature(a,b,"乗算");
  const d=combineDims(a.dims,b.dims,1);
  return new Quantity(a.siValue*b.siValue,d,canonicalUnit(d));
}
function div(a,b){
  a=asQuantity(a);b=asQuantity(b);assertTemperature(a,b,"除算");
  if(b.siValue===0)throw new Error("0で除算できません");
  const d=combineDims(a.dims,b.dims,-1);
  return new Quantity(a.siValue/b.siValue,d,canonicalUnit(d));
}
function pow(a,b){
  a=asQuantity(a);b=asQuantity(b);
  if(!isDimensionless(b.dims))throw new Error("指数は無次元である必要があります");
  assertTemperature(a,null,"べき乗");
  const d=powDims(a.dims,b.siValue);
  return new Quantity(Math.pow(a.siValue,b.siValue),d,canonicalUnit(d));
}
function neg(a){a=asQuantity(a);return new Quantity(-a.siValue,a.dims,a.displayUnit,{absoluteTemperature:a.absoluteTemperature})}
function compare(a,b,op){
  a=asQuantity(a);b=asQuantity(b);
  if(!sameDims(a.dims,b.dims))throw new Error("異なる次元同士は比較できません");
  return op==="=="?a.siValue===b.siValue:op==="!="?a.siValue!==b.siValue:
    op==="<"?a.siValue<b.siValue:op===">"?a.siValue>b.siValue:
    op==="<="?a.siValue<=b.siValue:a.siValue>=b.siValue;
}

function tokenize(source){
  const s=String(source),out=[];let i=0;
  while(i<s.length){
    const ch=s[i];
    if(/\s/.test(ch)){i++;continue}
    if(s.startsWith("->",i)){out.push({t:"arrow",v:"->"});i+=2;continue}
    if(s.startsWith("**",i)){out.push({t:"op",v:"^"});i+=2;continue}
    if("+-*/^(),".includes(ch)){out.push({t:ch==="("? "lp":ch===")"?"rp":ch===","?"comma":"op",v:ch});i++;continue}
    if(/[0-9.]/.test(ch)){
      const m=s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
      if(!m)throw new Error(`数値を解析できません: ${s.slice(i)}`);
      out.push({t:"num",v:Number(m[0])});i+=m[0].length;continue;
    }
    if(/[A-Za-z_µΩπ]/.test(ch)){
      const m=s.slice(i).match(/^[A-Za-z_µΩπ][A-Za-z0-9_µΩ]*/);
      out.push({t:"id",v:m[0]});i+=m[0].length;continue;
    }
    throw new Error(`単位付き式で使用できない文字です: ${ch}`);
  }
  return out;
}

function shouldUse(source,vars={}){
  const s=String(source);
  if(s.includes("->"))return true;

  // Only route to the quantity parser when a quantity variable is actually referenced.
  for(const [name,value] of Object.entries(vars)){
    if(!isQuantity(value))continue;
    const safe=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    if(new RegExp(`\\b${safe}\\b`).test(s))return true;
  }

  // Direct quantity literal requires whitespace between number and unit.
  const re=/(?:^|[+\-*/(,])\s*((?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s+([A-Za-z_µΩ][A-Za-z0-9_µΩ]*)/g;
  let m;
  while((m=re.exec(s))){
    if(isKnownUnitToken(m[2]))return true;
  }
  return false;
}

function evaluate(source,options={}){
  const vars=options.vars||{},scope=options.scope||{},ansResolver=options.ansResolver||(()=>{throw new Error("ANSは使用できません")});
  let text=String(source).trim();

  let arrow=-1,depth=0;
  for(let i=0;i<text.length-1;i++){
    if(text[i]==="(")depth++;
    if(text[i]===")")depth--;
    if(depth===0&&text.slice(i,i+2)==="->"){arrow=i;break}
  }
  if(arrow>=0){
    const left=text.slice(0,arrow).trim(),target=text.slice(arrow+2).trim();
    return convertTo(asQuantity(evaluate(left,options)),target);
  }

  text=text.replace(/π/g,"pi").replace(/ANS\s*\(\s*(\d+)\s*\)/gi,(_,n)=>`ans_${n}`);
  const tokens=tokenize(text);let pos=0;
  const peek=()=>tokens[pos],take=()=>tokens[pos++];

  function parseUnitFactor(name){
    let u=unitDescriptor(name);
    if(peek()?.t==="op"&&peek().v==="^"){
      take();let sign=1;
      if(peek()?.t==="op"&&(peek().v==="+"||peek().v==="-"))sign=take().v==="-"?-1:1;
      const n=take();if(!n||n.t!=="num")throw new Error("単位指数が不正です");
      u=powUnit(u,sign*n.v);
    }
    return u;
  }

  function primary(){
    const tok=take();
    if(!tok)throw new Error("式が途中で終了しています");
    if(tok.t==="num"){
      if(peek()?.t==="id"&&isKnownUnitToken(peek().v)){
        const first=take().v;
        let u=parseUnitFactor(first);
        while(peek()?.t==="op"&&(peek().v==="*"||peek().v==="/") &&
              tokens[pos+1]?.t==="id"&&isKnownUnitToken(tokens[pos+1].v)){
          const op=take().v,rhs=parseUnitFactor(take().v);
          u=op==="*"?mulUnit(u,rhs):divUnit(u,rhs);
        }
        if(u.absoluteTemperature)return fromUnit(tok.v,first);
        return new Quantity(tok.v*u.factor,u.dims,u.display);
      }
      return tok.v;
    }
    if(tok.t==="id"){
      const name=tok.v;
      if(peek()?.t==="lp"){
        take();const args=[];
        if(peek()?.t!=="rp"){
          while(true){
            args.push(expr());
            if(peek()?.t==="comma"){take();continue}
            break;
          }
        }
        if(!peek()||take().t!=="rp")throw new Error("')' が必要です");
        if(name==="sqrt")return pow(args[0],0.5);
        if(name==="abs"){
          const a=asQuantity(args[0]);
          return new Quantity(Math.abs(a.siValue),a.dims,a.displayUnit,{absoluteTemperature:a.absoluteTemperature});
        }
        if(name==="pow")return pow(args[0],args[1]);
        const fn=scope[name];
        if(typeof fn!=="function")throw new Error(`${name} is not defined`);
        if(fn._mfdcoQuantityAware)return fn(...args);
        return fn(...args.map(a=>isQuantity(a)?a.siValue:a));
      }
      if(name.startsWith("ans_"))return ansResolver(Number(name.slice(4)));
      if(Object.prototype.hasOwnProperty.call(vars,name))return vars[name];
      if(Object.prototype.hasOwnProperty.call(scope,name)&&typeof scope[name]!=="function")return scope[name];
      throw new Error(`${name} is not defined`);
    }
    if(tok.t==="lp"){
      const v=expr();
      if(!peek()||take().t!=="rp")throw new Error("')' が必要です");
      return v;
    }
    throw new Error("式を解析できません");
  }
  function unary(){
    if(peek()?.t==="op"&&(peek().v==="+"||peek().v==="-")){
      const op=take().v,v=unary();return op==="-"?neg(v):v;
    }
    return primary();
  }
  function power(){
    let left=unary();
    if(peek()?.t==="op"&&peek().v==="^"){take();left=pow(left,power())}
    return left;
  }
  function term(){
    let left=power();
    while(peek()?.t==="op"&&(peek().v==="*"||peek().v==="/")){
      const op=take().v,right=power();left=op==="*"?mul(left,right):div(left,right);
    }
    return left;
  }
  function expr(){
    let left=term();
    while(peek()?.t==="op"&&(peek().v==="+"||peek().v==="-")){
      const op=take().v,right=term();left=op==="+"?add(left,right):sub(left,right);
    }
    return left;
  }
  const result=expr();
  if(pos!==tokens.length)throw new Error(`式の後半を解析できません: ${tokens.slice(pos).map(x=>x.v).join(" ")}`);
  return isQuantity(result)&&isDimensionless(result.dims)?result.siValue:result;
}

global.MFDCOQuantities={
  version:VERSION,CATEGORY_DIMS,Quantity,isQuantity,
  cleanDims,dimsKey,sameDims,isDimensionless,canonicalUnit,
  resolveUnitToken,isKnownUnitToken,parseUnitExpression,
  quantity,fromUnit,convertTo,format,formatScalar,
  add,sub,mul,div,pow,neg,compare,shouldUse,evaluate
};
})(typeof window!=="undefined"?window:globalThis);
