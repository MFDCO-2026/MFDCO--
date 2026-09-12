/* MFDCO Tools v3.7 symbolic algebra + series engine */
(function(global){
"use strict";

const VERSION="3.7";
const EPS=1e-12;

function gcdInt(a,b){
  a=Math.abs(Math.trunc(Number(a)));b=Math.abs(Math.trunc(Number(b)));
  while(b){const t=a%b;a=b;b=t}
  return a;
}

function primeFactors(n){
  n=Math.trunc(Number(n));
  if(!Number.isFinite(n)||Math.abs(n)<2)return Math.abs(n)===1?[n]:[];
  const out=[];
  if(n<0){out.push(-1);n=-n}
  while(n%2===0){out.push(2);n/=2}
  for(let p=3;p*p<=n;p+=2){
    while(n%p===0){out.push(p);n/=p}
  }
  if(n>1)out.push(n);
  return out;
}

function factorInteger(n){
  n=Math.trunc(Number(n));
  if(!Number.isFinite(n))throw new Error("factorInteger: 整数を指定してください");
  if(n===0)return "0";
  if(n===1)return "1";
  if(n===-1)return "-1";
  const fs=primeFactors(n),parts=[];
  let i=0;
  while(i<fs.length){
    const p=fs[i];
    if(p===-1){parts.push("-1");i++;continue}
    let j=i+1;
    while(j<fs.length&&fs[j]===p)j++;
    const c=j-i;
    parts.push(c===1?String(p):`${p}^${c}`);
    i=j;
  }
  return parts.join(" * ");
}

function simplifyFraction(a,b){
  a=Math.trunc(Number(a));b=Math.trunc(Number(b));
  if(!Number.isFinite(a)||!Number.isFinite(b)||b===0)throw new Error("simplifyFraction: 有効な整数 a,b が必要です");
  const g=gcdInt(a,b)||1;
  a/=g;b/=g;
  if(b<0){a=-a;b=-b}
  return [a,b];
}

function trimPoly(p){
  const a=p.slice();
  while(a.length>1&&Math.abs(a[a.length-1])<EPS)a.pop();
  for(let i=0;i<a.length;i++)if(Math.abs(a[i])<EPS)a[i]=0;
  return a.length?a:[0];
}
function pAdd(a,b){
  const n=Math.max(a.length,b.length),o=Array(n).fill(0);
  for(let i=0;i<n;i++)o[i]=(a[i]||0)+(b[i]||0);
  return trimPoly(o);
}
function pSub(a,b){
  const n=Math.max(a.length,b.length),o=Array(n).fill(0);
  for(let i=0;i<n;i++)o[i]=(a[i]||0)-(b[i]||0);
  return trimPoly(o);
}
function pMul(a,b){
  const o=Array(a.length+b.length-1).fill(0);
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)o[i+j]+=a[i]*b[j];
  return trimPoly(o);
}
function pScale(a,k){return trimPoly(a.map(x=>x*k))}
function pPow(a,n){
  n=Number(n);
  if(!Number.isInteger(n)||n<0||n>50)throw new Error("多項式の指数は 0～50 の整数にしてください");
  let out=[1],base=a.slice();
  while(n){
    if(n&1)out=pMul(out,base);
    n>>=1;
    if(n)base=pMul(base,base);
  }
  return trimPoly(out);
}

function tokenizePoly(source){
  const s=String(source).replace(/\*\*/g,"^").replace(/π/g,"pi");
  const out=[];let i=0;
  while(i<s.length){
    const ch=s[i];
    if(/\s/.test(ch)){i++;continue}
    if("+-*/^(),".includes(ch)){
      out.push({t:ch==="("?"lp":ch===")"?"rp":ch===","?"comma":"op",v:ch});i++;continue;
    }
    if(/[0-9.]/.test(ch)){
      const m=s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
      if(!m)throw new Error("数値を解析できません");
      out.push({t:"num",v:Number(m[0])});i+=m[0].length;continue;
    }
    if(/[A-Za-z_]/.test(ch)){
      const m=s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      out.push({t:"id",v:m[0]});i+=m[0].length;continue;
    }
    throw new Error(`多項式で使用できない文字です: ${ch}`);
  }
  return out;
}

function parsePolynomial(source,variable="x"){
  if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(variable))throw new Error("変数名が不正です");
  const ts=tokenizePoly(source);let pos=0;
  const peek=()=>ts[pos],take=()=>ts[pos++];

  function primary(){
    const t=take();
    if(!t)throw new Error("式が途中で終了しています");
    if(t.t==="num")return [t.v];
    if(t.t==="id"){
      if(t.v===variable)return [0,1];
      if(t.v==="pi")return [Math.PI];
      if(t.v==="e")return [Math.E];
      throw new Error(`多項式に未対応の識別子です: ${t.v}`);
    }
    if(t.t==="lp"){
      const v=expr();
      if(!peek()||take().t!=="rp")throw new Error("')' が必要です");
      return v;
    }
    throw new Error("多項式を解析できません");
  }
  function unary(){
    if(peek()?.t==="op"&&(peek().v==="+"||peek().v==="-")){
      const op=take().v,v=unary();
      return op==="-"?pScale(v,-1):v;
    }
    return primary();
  }
  function power(){
    let left=unary();
    if(peek()?.t==="op"&&peek().v==="^"){
      take();
      let sign=1;
      if(peek()?.t==="op"&&(peek().v==="+"||peek().v==="-"))sign=take().v==="-"?-1:1;
      const n=take();
      if(!n||n.t!=="num")throw new Error("指数は整数で指定してください");
      left=pPow(left,sign*n.v);
    }
    return left;
  }
  function term(){
    let left=power();
    while(peek()?.t==="op"&&(peek().v==="*"||peek().v==="/")){
      const op=take().v,right=power();
      if(op==="*")left=pMul(left,right);
      else{
        if(right.length!==1||Math.abs(right[0])<EPS)throw new Error("多項式の除算は定数による除算のみ対応しています");
        left=pScale(left,1/right[0]);
      }
    }
    return left;
  }
  function expr(){
    let left=term();
    while(peek()?.t==="op"&&(peek().v==="+"||peek().v==="-")){
      const op=take().v,right=term();
      left=op==="+"?pAdd(left,right):pSub(left,right);
    }
    return left;
  }
  const p=trimPoly(expr());
  if(pos!==ts.length)throw new Error("多項式の後半を解析できません");
  return p;
}

function rationalApprox(x,maxDen=100000,tol=1e-10){
  if(!Number.isFinite(x))return null;
  const sign=x<0?-1:1;
  x=Math.abs(x);
  if(Math.abs(x-Math.round(x))<tol)return [sign*Math.round(x),1];
  let h1=1,h0=0,k1=0,k0=1,b=x;
  for(let i=0;i<30;i++){
    const a=Math.floor(b),h=a*h1+h0,k=a*k1+k0;
    if(k>maxDen)break;
    if(Math.abs(x-h/k)<tol)return [sign*h,k];
    h0=h1;h1=h;k0=k1;k1=k;
    const frac=b-a;if(frac<EPS)break;
    b=1/frac;
  }
  if(k1&&Math.abs(x-h1/k1)<1e-8)return [sign*h1,k1];
  return null;
}
function fmtNumber(x){
  if(Math.abs(x)<EPS)return "0";
  const r=rationalApprox(x);
  if(r){
    if(r[1]===1)return String(r[0]);
    return `${r[0]}/${r[1]}`;
  }
  return String(Number(x.toPrecision(12)));
}
function formatPolynomial(poly,variable="x",constant=""){
  const p=trimPoly(poly),terms=[];
  for(let n=p.length-1;n>=0;n--){
    const c=p[n];
    if(Math.abs(c)<EPS)continue;
    const abs=Math.abs(c);
    let body;
    if(n===0)body=fmtNumber(abs);
    else{
      const coeff=Math.abs(abs-1)<EPS?"":`${fmtNumber(abs)}*`;
      body=coeff+variable+(n===1?"":`^${n}`);
    }
    if(!terms.length)terms.push((c<0?"-":"")+body);
    else terms.push((c<0?" - ":" + ")+body);
  }
  const result=terms.join("")||"0";
  return constant?`${result} + ${constant}`:result;
}

function expandPoly(expression,variable="x"){
  return formatPolynomial(parsePolynomial(expression,variable),variable);
}
function collectPoly(expression,variable="x"){return expandPoly(expression,variable)}
function simplifyPoly(expression,variable="x"){return expandPoly(expression,variable)}
function polyDegree(expression,variable="x"){return parsePolynomial(expression,variable).length-1}
function polyCoefficients(expression,variable="x"){return parsePolynomial(expression,variable).slice().reverse()}
function polyDerivative(expression,variable="x"){
  const p=parsePolynomial(expression,variable);
  if(p.length<=1)return "0";
  const d=Array(p.length-1).fill(0);
  for(let i=1;i<p.length;i++)d[i-1]=i*p[i];
  return formatPolynomial(d,variable);
}
function polyIntegral(expression,variable="x"){
  const p=parsePolynomial(expression,variable),q=Array(p.length+1).fill(0);
  for(let i=0;i<p.length;i++)q[i+1]=p[i]/(i+1);
  return formatPolynomial(q,variable,"C");
}
function evalPoly(p,x){
  let y=0;
  for(let i=p.length-1;i>=0;i--)y=y*x+p[i];
  return y;
}
function syntheticDivide(p,root){
  const desc=p.slice().reverse(),q=[desc[0]];
  for(let i=1;i<desc.length-1;i++)q.push(desc[i]+q[q.length-1]*root);
  const rem=desc[desc.length-1]+q[q.length-1]*root;
  return {quot:q.reverse(),rem};
}
function divisors(n){
  n=Math.abs(Math.trunc(n));
  if(n===0)return [0];
  const a=[];
  for(let i=1;i*i<=n;i++)if(n%i===0){a.push(i);if(i*i!==n)a.push(n/i)}
  return a.sort((x,y)=>x-y);
}
function factorPoly(expression,variable="x"){
  let p=parsePolynomial(expression,variable);
  if(p.length<=1)return formatPolynomial(p,variable);
  const original=trimPoly(p);
  let scalar=1;
  // pull leading scalar if coefficients are close to integers and common gcd exists
  if(original.every(x=>Math.abs(x-Math.round(x))<1e-10)){
    const ints=original.map(x=>Math.round(x));
    let g=0;for(const x of ints)g=gcdInt(g,x);
    if(g>1){scalar=g;p=pScale(p,1/g)}
    if(p[p.length-1]<0){scalar*=-1;p=pScale(p,-1)}
  }
  let zeroCount=0;
  while(p.length>1&&Math.abs(p[0])<EPS){zeroCount++;p=p.slice(1)}
  const roots=[];
  let guard=0;
  while(p.length>2&&guard++<20){
    const lead=p[p.length-1],constant=p[0];
    let candidates=[];
    if(Math.abs(lead-Math.round(lead))<1e-9&&Math.abs(constant-Math.round(constant))<1e-9){
      const ps=divisors(Math.round(constant)),qs=divisors(Math.round(lead));
      for(const a of ps)for(const b of qs)if(b)candidates.push(a/b,-a/b);
    }else{
      for(let x=-20;x<=20;x++)candidates.push(x);
    }
    candidates=[...new Set(candidates.map(x=>Number(x.toPrecision(12))))];
    let found=null;
    for(const c of candidates)if(Math.abs(evalPoly(p,c))<1e-8){found=c;break}
    if(found===null)break;
    roots.push(found);
    p=trimPoly(syntheticDivide(p,found).quot);
  }

  const parts=[];
  if(Math.abs(scalar-1)>EPS)parts.push(fmtNumber(scalar));
  for(let i=0;i<zeroCount;i++)parts.push(variable);

  const grouped=[];
  roots.sort((a,b)=>a-b);
  for(let i=0;i<roots.length;){
    let j=i+1;while(j<roots.length&&Math.abs(roots[j]-roots[i])<1e-9)j++;
    const r=roots[i],inside=r===0?variable:
      r>0?`(${variable} - ${fmtNumber(r)})`:`(${variable} + ${fmtNumber(-r)})`;
    grouped.push(j-i===1?inside:`${inside}^${j-i}`);
    i=j;
  }
  parts.push(...grouped);

  p=trimPoly(p);
  if(p.length>1){
    if(p.length===2){
      const r=-p[0]/p[1];
      const lead=p[1];
      if(Math.abs(lead-1)>EPS)parts.push(fmtNumber(lead));
      parts.push(r>=0?`(${variable} - ${fmtNumber(r)})`:`(${variable} + ${fmtNumber(-r)})`);
    }else if(!(p.length===1&&Math.abs(p[0]-1)<EPS)){
      parts.push(`(${formatPolynomial(p,variable)})`);
    }
  }else if(Math.abs(p[0]-1)>EPS)parts.push(fmtNumber(p[0]));
  return parts.filter(Boolean).join("*")||formatPolynomial(original,variable);
}

/* Truncated power series coefficients c[n] for (x-a)^n */
function sConst(v,n){const a=Array(n+1).fill(0);a[0]=Number(v);return a}
function sAdd(a,b,n){return Array.from({length:n+1},(_,i)=>(a[i]||0)+(b[i]||0))}
function sSub(a,b,n){return Array.from({length:n+1},(_,i)=>(a[i]||0)-(b[i]||0))}
function sScale(a,k,n){return Array.from({length:n+1},(_,i)=>(a[i]||0)*k)}
function sMul(a,b,n){
  const o=Array(n+1).fill(0);
  for(let i=0;i<=n;i++)for(let j=0;j<=n-i;j++)o[i+j]+=(a[i]||0)*(b[j]||0);
  return o;
}
function sInv(a,n){
  if(Math.abs(a[0])<EPS)throw new Error("級数展開点で 0 除算になります");
  const o=Array(n+1).fill(0);o[0]=1/a[0];
  for(let m=1;m<=n;m++){
    let s=0;for(let k=1;k<=m;k++)s+=(a[k]||0)*o[m-k];
    o[m]=-s/a[0];
  }
  return o;
}
function sDiv(a,b,n){return sMul(a,sInv(b,n),n)}
function sExp(a,n){
  const y=Array(n+1).fill(0);y[0]=Math.exp(a[0]||0);
  for(let m=1;m<=n;m++){
    let s=0;for(let k=1;k<=m;k++)s+=k*(a[k]||0)*y[m-k];
    y[m]=s/m;
  }
  return y;
}
function sLog(a,n){
  if(a[0]<=0)throw new Error("log/ln の実数テイラー展開には展開点で正の値が必要です");
  const ap=Array(n).fill(0);
  for(let i=0;i<n;i++)ap[i]=(i+1)*(a[i+1]||0);
  const q=sDiv(ap,a,n-1);
  const y=Array(n+1).fill(0);y[0]=Math.log(a[0]);
  for(let m=1;m<=n;m++)y[m]=(q[m-1]||0)/m;
  return y;
}
function sSinCos(a,n){
  const s=Array(n+1).fill(0),c=Array(n+1).fill(0);
  s[0]=Math.sin(a[0]||0);c[0]=Math.cos(a[0]||0);
  for(let m=1;m<=n;m++){
    let ss=0,cc=0;
    for(let k=1;k<=m;k++){
      const ak=k*(a[k]||0);
      ss+=ak*c[m-k];
      cc-=ak*s[m-k];
    }
    s[m]=ss/m;c[m]=cc/m;
  }
  return [s,c];
}
function sSinhCosh(a,n){
  const s=Array(n+1).fill(0),c=Array(n+1).fill(0);
  s[0]=Math.sinh(a[0]||0);c[0]=Math.cosh(a[0]||0);
  for(let m=1;m<=n;m++){
    let ss=0,cc=0;
    for(let k=1;k<=m;k++){
      const ak=k*(a[k]||0);
      ss+=ak*c[m-k];
      cc+=ak*s[m-k];
    }
    s[m]=ss/m;c[m]=cc/m;
  }
  return [s,c];
}
function sPow(a,b,n){
  const bNonConst=b.slice(1).some(x=>Math.abs(x)>EPS);
  if(!bNonConst&&Number.isInteger(b[0])&&b[0]>=0&&b[0]<=50){
    let out=sConst(1,n),base=a.slice(),e=b[0];
    while(e){if(e&1)out=sMul(out,base,n);e>>=1;if(e)base=sMul(base,base,n)}
    return out;
  }
  return sExp(sMul(b,sLog(a,n),n),n);
}

function tokenizeSeries(source){
  const s=String(source).replace(/\*\*/g,"^").replace(/π/g,"pi");
  const out=[];let i=0;
  while(i<s.length){
    const ch=s[i];
    if(/\s/.test(ch)){i++;continue}
    if("+-*/^(),".includes(ch)){out.push({t:ch==="("?"lp":ch===")"?"rp":ch===","?"comma":"op",v:ch});i++;continue}
    if(/[0-9.]/.test(ch)){
      const m=s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
      if(!m)throw new Error("数値を解析できません");
      out.push({t:"num",v:Number(m[0])});i+=m[0].length;continue;
    }
    if(/[A-Za-z_]/.test(ch)){
      const m=s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      out.push({t:"id",v:m[0]});i+=m[0].length;continue;
    }
    throw new Error(`級数式で使用できない文字です: ${ch}`);
  }
  return out;
}

function taylorCoefficients(expression,variable="x",center=0,order=6,vars={}){
  order=Math.trunc(Number(order));center=Number(center);
  if(!Number.isFinite(center)||order<0||order>24)throw new Error("taylor: order は 0～24 にしてください");
  const ts=tokenizeSeries(expression);let pos=0;
  const peek=()=>ts[pos],take=()=>ts[pos++];
  const n=order;

  function primary(){
    const t=take();
    if(!t)throw new Error("式が途中で終了しています");
    if(t.t==="num")return sConst(t.v,n);
    if(t.t==="id"){
      const name=t.v;
      if(peek()?.t==="lp"){
        take();const args=[];
        if(peek()?.t!=="rp"){
          while(true){args.push(expr());if(peek()?.t==="comma"){take();continue}break}
        }
        if(!peek()||take().t!=="rp")throw new Error("')' が必要です");
        const a=args[0]||sConst(0,n);
        if(name==="exp")return sExp(a,n);
        if(name==="ln"||name==="log")return sLog(a,n);
        if(name==="sqrt")return sPow(a,sConst(0.5,n),n);
        if(name==="sin")return sSinCos(a,n)[0];
        if(name==="cos")return sSinCos(a,n)[1];
        if(name==="tan"){const [s,c]=sSinCos(a,n);return sDiv(s,c,n)}
        if(name==="sinh")return sSinhCosh(a,n)[0];
        if(name==="cosh")return sSinhCosh(a,n)[1];
        if(name==="tanh"){const [s,c]=sSinhCosh(a,n);return sDiv(s,c,n)}
        if(name==="pow")return sPow(args[0],args[1],n);
        throw new Error(`taylor: 未対応関数です: ${name}`);
      }
      if(name===variable){const x=sConst(center,n);if(n>=1)x[1]=1;return x}
      if(name==="pi")return sConst(Math.PI,n);
      if(name==="e")return sConst(Math.E,n);
      if(Object.prototype.hasOwnProperty.call(vars,name)&&Number.isFinite(Number(vars[name])))return sConst(Number(vars[name]),n);
      throw new Error(`taylor: 未定義識別子です: ${name}`);
    }
    if(t.t==="lp"){
      const v=expr();
      if(!peek()||take().t!=="rp")throw new Error("')' が必要です");
      return v;
    }
    throw new Error("級数式を解析できません");
  }
  function unary(){
    if(peek()?.t==="op"&&(peek().v==="+"||peek().v==="-")){
      const op=take().v,v=unary();return op==="-"?sScale(v,-1,n):v;
    }
    return primary();
  }
  function power(){
    let a=unary();
    if(peek()?.t==="op"&&peek().v==="^"){take();a=sPow(a,power(),n)}
    return a;
  }
  function term(){
    let a=power();
    while(peek()?.t==="op"&&(peek().v==="*"||peek().v==="/")){
      const op=take().v,b=power();a=op==="*"?sMul(a,b,n):sDiv(a,b,n);
    }
    return a;
  }
  function expr(){
    let a=term();
    while(peek()?.t==="op"&&(peek().v==="+"||peek().v==="-")){
      const op=take().v,b=term();a=op==="+"?sAdd(a,b,n):sSub(a,b,n);
    }
    return a;
  }
  const c=expr();
  if(pos!==ts.length)throw new Error("級数式の後半を解析できません");
  return c.map(x=>Math.abs(x)<1e-13?0:x);
}

function formatSeries(coeffs,variable="x",center=0){
  const terms=[];
  const base=Math.abs(center)<EPS?variable:`(${variable} - ${fmtNumber(center)})`;
  for(let n=0;n<coeffs.length;n++){
    const c=coeffs[n];
    if(Math.abs(c)<1e-12)continue;
    const abs=Math.abs(c),cf=fmtNumber(abs);
    let body;
    if(n===0)body=cf;
    else{
      const coeff=Math.abs(abs-1)<1e-12?"":`${cf}*`;
      body=coeff+base+(n===1?"":`^${n}`);
    }
    if(!terms.length)terms.push((c<0?"-":"")+body);
    else terms.push((c<0?" - ":" + ")+body);
  }
  return terms.join("")||"0";
}
function taylor(expression,variable="x",center=0,order=6){
  return formatSeries(taylorCoefficients(expression,variable,center,order),variable,center);
}
function maclaurin(expression,variable="x",order=6){
  return taylor(expression,variable,0,order);
}

global.MFDCOSymbolic={
  version:VERSION,
  primeFactors,factorInteger,simplifyFraction,
  parsePolynomial,expandPoly,collectPoly,simplifyPoly,factorPoly,
  polyDegree,polyCoefficients,polyDerivative,polyIntegral,
  taylorCoefficients,taylor,maclaurin,
  formatPolynomial,formatSeries
};
})(typeof window!=="undefined"?window:globalThis);
