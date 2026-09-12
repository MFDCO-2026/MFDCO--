/* MFDCO Tools v3.8 advanced math */
(function(global){
"use strict";
const VERSION="3.8",EPS=1e-12;
class Complex{
  constructor(re=0,im=0){this.re=Number(re);this.im=Number(im);this.__mfdcoComplex=true}
  toString(){return formatComplex(this)}
  valueOf(){return Math.abs(this.im)<EPS?this.re:NaN}
}
function isComplex(z){return !!(z&&z.__mfdcoComplex)}
function C(z){return isComplex(z)?z:new Complex(Number(z),0)}
function complex(re=0,im=0){return new Complex(re,im)}
function cadd(a,b){a=C(a);b=C(b);return new Complex(a.re+b.re,a.im+b.im)}
function csub(a,b){a=C(a);b=C(b);return new Complex(a.re-b.re,a.im-b.im)}
function cmul(a,b){a=C(a);b=C(b);return new Complex(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re)}
function cdiv(a,b){a=C(a);b=C(b);const d=b.re*b.re+b.im*b.im;if(d<EPS)throw new Error("複素数の0除算です");return new Complex((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d)}
function cabs(a){a=C(a);return Math.hypot(a.re,a.im)}
function carg(a){a=C(a);return Math.atan2(a.im,a.re)}
function cconj(a){a=C(a);return new Complex(a.re,-a.im)}
function cexp(a){a=C(a);const e=Math.exp(a.re);return new Complex(e*Math.cos(a.im),e*Math.sin(a.im))}
function clog(a){a=C(a);return new Complex(Math.log(cabs(a)),carg(a))}
function cpow(a,b){return cexp(cmul(C(b),clog(C(a))))}
function csqrt(a){a=C(a);const r=cabs(a);return new Complex(Math.sqrt((r+a.re)/2),(a.im<0?-1:1)*Math.sqrt(Math.max(0,(r-a.re)/2)))}
function csin(a){a=C(a);return new Complex(Math.sin(a.re)*Math.cosh(a.im),Math.cos(a.re)*Math.sinh(a.im))}
function ccos(a){a=C(a);return new Complex(Math.cos(a.re)*Math.cosh(a.im),-Math.sin(a.re)*Math.sinh(a.im))}
function ctan(a){return cdiv(csin(a),ccos(a))}
function real(z){return C(z).re}
function imag(z){return C(z).im}
function formatComplex(z){
  z=C(z);const re=Math.abs(z.re)<EPS?0:z.re,im=Math.abs(z.im)<EPS?0:z.im;
  if(im===0)return String(Number(re.toPrecision(12)));
  if(re===0)return `${im===1?"":im===-1?"-":Number(im.toPrecision(12))}i`;
  const a=Math.abs(im),is=a===1?"i":`${Number(a.toPrecision(12))}i`;
  return `${Number(re.toPrecision(12))}${im>=0?"+":"-"}${is}`;
}
function quadraticRoots(a,b,c){
  a=Number(a);b=Number(b);c=Number(c);
  if(Math.abs(a)<EPS)return Math.abs(b)<EPS?[]:[-c/b];
  const d=b*b-4*a*c;
  if(d>=0){const s=Math.sqrt(d);return [(-b+s)/(2*a),(-b-s)/(2*a)]}
  const s=Math.sqrt(-d);return [complex(-b/(2*a),s/(2*a)),complex(-b/(2*a),-s/(2*a))];
}
function polyEvalDesc(cs,z){let y=complex(0,0);for(const c of cs)y=cadd(cmul(y,z),c);return y}
function polyRoots(coeffs,maxIter=250,tol=1e-11){
  coeffs=coeffs.map(Number);while(coeffs.length&&Math.abs(coeffs[0])<EPS)coeffs.shift();
  const n=coeffs.length-1;if(n<=0)return[];if(n===1)return[-coeffs[1]/coeffs[0]];if(n===2)return quadraticRoots(...coeffs);
  const lead=coeffs[0];coeffs=coeffs.map(x=>x/lead);
  const R=1+Math.max(...coeffs.slice(1).map(Math.abs));
  const roots=Array.from({length:n},(_,k)=>complex(R*Math.cos(2*Math.PI*k/n+.37),R*Math.sin(2*Math.PI*k/n+.37)));
  for(let it=0;it<maxIter;it++){
    let md=0;
    for(let i=0;i<n;i++){
      let den=complex(1,0);for(let j=0;j<n;j++)if(i!==j)den=cmul(den,csub(roots[i],roots[j]));
      const d=cdiv(polyEvalDesc(coeffs,roots[i]),den);roots[i]=csub(roots[i],d);md=Math.max(md,cabs(d));
    }
    if(md<tol)break;
  }
  return roots.map(z=>Math.abs(z.im)<1e-9?z.re:z);
}
function exactQuadratic(a,b,c,v="x"){
  const d=b*b-4*a*c;
  if(d<0)return `${v} = (${-b} ± i*sqrt(${Math.abs(d)})) / ${2*a}`;
  const s=Math.sqrt(d);
  if(Number.isInteger(s))return `${v} = ${(-b+s)/(2*a)}, ${(-b-s)/(2*a)}`;
  return `${v} = (${-b} ± sqrt(${d})) / ${2*a}`;
}
function solveExact(equation,v="x"){
  const ps=String(equation).split("="),expr=ps.length===2?`(${ps[0]})-(${ps[1]})`:ps[0];
  const p=global.MFDCOSymbolic.parsePolynomial(expr,v);
  if(p.length===1)return Math.abs(p[0])<EPS?"恒等式":"解なし";
  if(p.length===2)return `${v} = ${-p[0]/p[1]}`;
  if(p.length===3)return exactQuadratic(p[2],p[1],p[0],v);
  const rs=polyRoots(p.slice().reverse());
  return rs.map((r,i)=>`${v}${i+1} = ${isComplex(r)?formatComplex(r):Number(r.toPrecision(12))}`).join(", ");
}
function safeLinearEval(expr,variables,values){
  const js=String(expr).replace(/\^/g,"**");
  if(!/^[0-9A-Za-z_+\-*/%().,\s*]+$/.test(js))throw new Error("solveSystem: 使用できない文字があります");
  return Function(...variables,`"use strict";return(${js});`)(...values);
}
function solveSystem(equations,variables){
  if(!Array.isArray(equations)||!Array.isArray(variables)||equations.length!==variables.length)throw new Error("solveSystem: 方程式数と変数数を一致させてください");
  const n=variables.length,A=[],b=[];
  equations.forEach(eq=>{
    const ps=String(eq).split("="),expr=`(${ps[0]})-(${ps[1]??0})`,zero=Array(n).fill(0),c=safeLinearEval(expr,variables,zero),row=[];
    for(let j=0;j<n;j++){const e=zero.slice();e[j]=1;row.push(safeLinearEval(expr,variables,e)-c)}
    A.push(row);b.push(-c);
  });
  const M=A.map((r,i)=>r.concat(b[i]));
  for(let i=0;i<n;i++){
    let p=i;for(let r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[p][i]))p=r;
    if(Math.abs(M[p][i])<EPS)throw new Error("solveSystem: 一意解がありません");
    [M[p],M[i]]=[M[i],M[p]];const q=M[i][i];for(let c=i;c<=n;c++)M[i][c]/=q;
    for(let r=0;r<n;r++)if(r!==i){const k=M[r][i];for(let c=i;c<=n;c++)M[r][c]-=k*M[i][c]}
  }
  return Object.fromEntries(variables.map((v,i)=>[v,M[i][n]]));
}
function substitute(expr,v,repl){const esc=String(v).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return String(expr).replace(new RegExp(`\\b${esc}\\b`,"g"),`(${repl})`)}

function tok(s){
  s=String(s).replace(/\*\*/g,"^");const o=[];let i=0;
  while(i<s.length){
    if(/\s/.test(s[i])){i++;continue}
    if("+-*/^(),".includes(s[i])){o.push({t:"op",v:s[i++]});continue}
    const nm=s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
    if(nm){o.push({t:"num",v:Number(nm[0])});i+=nm[0].length;continue}
    const id=s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if(id){o.push({t:"id",v:id[0]});i+=id[0].length;continue}
    throw new Error(`derivative: 使用できない文字 ${s[i]}`);
  }return o;
}
function parseAst(s){
  const ts=tok(s);let p=0,pk=()=>ts[p],tk=()=>ts[p++];
  function pri(){const t=tk();if(!t)throw new Error("derivative: 式が途中です");if(t.t==="num")return{t:"n",v:t.v};
    if(t.t==="id"){if(pk()?.v==="("){tk();const a=ex();if(tk()?.v!==")")throw new Error("derivative: ) が必要");return{t:"f",n:t.v,a}}return{t:"v",n:t.v}}
    if(t.v==="("){const a=ex();if(tk()?.v!==")")throw new Error("derivative: ) が必要");return a}throw new Error("derivative: 解析失敗")}
  function un(){if(pk()?.v==="+"||pk()?.v==="-"){const o=tk().v,a=un();return o==="-"?{t:"neg",a}:a}return pri()}
  function pw(){let a=un();if(pk()?.v==="^"){tk();a={t:"op",o:"^",a,b:pw()}}return a}
  function tm(){let a=pw();while(pk()?.v==="*"||pk()?.v==="/"){const o=tk().v;a={t:"op",o,a,b:pw()}}return a}
  function ex(){let a=tm();while(pk()?.v==="+"||pk()?.v==="-"){const o=tk().v;a={t:"op",o,a,b:tm()}}return a}
  const a=ex();if(p!==ts.length)throw new Error("derivative: 後半を解析できません");return a;
}
const N=v=>({t:"n",v}),O=(o,a,b)=>({t:"op",o,a,b}),F=(n,a)=>({t:"f",n,a});
function dAst(a,v){
  if(a.t==="n")return N(0);if(a.t==="v")return N(a.n===v?1:0);if(a.t==="neg")return{t:"neg",a:dAst(a.a,v)};
  if(a.t==="op"){const da=dAst(a.a,v),db=dAst(a.b,v);
    if(a.o==="+")return O("+",da,db);if(a.o==="-")return O("-",da,db);if(a.o==="*")return O("+",O("*",da,a.b),O("*",a.a,db));
    if(a.o==="/")return O("/",O("-",O("*",da,a.b),O("*",a.a,db)),O("^",a.b,N(2)));
    if(a.o==="^"){if(a.b.t==="n")return O("*",O("*",N(a.b.v),O("^",a.a,N(a.b.v-1))),da);
      return O("*",O("^",a.a,a.b),O("+",O("*",db,F("ln",a.a)),O("*",a.b,O("/",da,a.a))))}}
  if(a.t==="f"){const da=dAst(a.a,v),outer=a.n==="sin"?F("cos",a.a):a.n==="cos"?{t:"neg",a:F("sin",a.a)}:
    a.n==="tan"?O("/",N(1),O("^",F("cos",a.a),N(2))):a.n==="exp"?F("exp",a.a):
    a.n==="ln"||a.n==="log"?O("/",N(1),a.a):a.n==="sqrt"?O("/",N(1),O("*",N(2),F("sqrt",a.a))):null;
    if(!outer)throw new Error(`derivative: 未対応関数 ${a.n}`);return O("*",outer,da)}
  throw new Error("derivative: 未対応式");
}
function simp(a){
  if(!a||a.t==="n"||a.t==="v")return a;if(a.t==="f"){a.a=simp(a.a);return a}if(a.t==="neg"){a.a=simp(a.a);if(a.a.t==="n")return N(-a.a.v);return a}
  a.a=simp(a.a);a.b=simp(a.b);
  if(a.a.t==="n"&&a.b.t==="n"){const x=a.a.v,y=a.b.v;return N(a.o==="+"?x+y:a.o==="-"?x-y:a.o==="*"?x*y:a.o==="/"?x/y:x**y)}
  if(a.o==="+"&&a.a.t==="n"&&a.a.v===0)return a.b;if(a.o==="+"&&a.b.t==="n"&&a.b.v===0)return a.a;if(a.o==="-"&&a.b.t==="n"&&a.b.v===0)return a.a;
  if(a.o==="*"&&((a.a.t==="n"&&a.a.v===0)||(a.b.t==="n"&&a.b.v===0)))return N(0);if(a.o==="*"&&a.a.t==="n"&&a.a.v===1)return a.b;if(a.o==="*"&&a.b.t==="n"&&a.b.v===1)return a.a;
  if(a.o==="/"&&a.b.t==="n"&&a.b.v===1)return a.a;if(a.o==="^"&&a.b.t==="n"&&a.b.v===1)return a.a;if(a.o==="^"&&a.b.t==="n"&&a.b.v===0)return N(1);return a}
function astStr(a,parent=0){
  if(a.t==="n")return String(Number(a.v.toPrecision?a.v.toPrecision(12):a.v));if(a.t==="v")return a.n;if(a.t==="neg")return`-${astStr(a.a,4)}`;if(a.t==="f")return`${a.n}(${astStr(a.a)})`;
  const pr={"+":1,"-":1,"*":2,"/":2,"^":3}[a.o],s=`${astStr(a.a,pr)}${a.o}${astStr(a.b,pr+(a.o==="^"?-1:0))}`;return pr<parent?`(${s})`:s}
function derivative(expr,v="x"){try{return global.MFDCOSymbolic.polyDerivative(expr,v)}catch(_){}return astStr(simp(dAst(parseAst(expr),v)))}
function partial(expr,v="x"){return derivative(expr,v)}
function limit(expr,v,to){
  to=Number(to);function f(x){let js=String(expr).replace(/\^/g,"**").replace(/\bsin\b/g,"Math.sin").replace(/\bcos\b/g,"Math.cos").replace(/\btan\b/g,"Math.tan").replace(/\bexp\b/g,"Math.exp").replace(/\bln\b/g,"Math.log").replace(/\blog\b/g,"Math.log").replace(/\bsqrt\b/g,"Math.sqrt").replace(new RegExp(`\\b${v}\\b`,"g"),`(${x})`);return Function(`"use strict";return(${js})`)()}
  let last=NaN;for(const h of[1e-2,1e-3,1e-4,1e-5,1e-6]){const a=f(to-h),b=f(to+h);if(Number.isFinite(a)&&Number.isFinite(b))last=(a+b)/2}if(!Number.isFinite(last))throw new Error("limit: 評価できません");return last}

function mean(a){return a.reduce((s,x)=>s+Number(x),0)/a.length}
function median(a){a=[...a].map(Number).sort((x,y)=>x-y);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2}
function mode(a){const m=new Map();for(const x of a)m.set(x,(m.get(x)||0)+1);let mx=0,o=[];for(const[k,n]of m){if(n>mx){mx=n;o=[k]}else if(n===mx)o.push(k)}return o}
function variance(a,sample=false){const mu=mean(a);return a.reduce((s,x)=>s+(x-mu)**2,0)/(a.length-(sample?1:0))}
function stddev(a,sample=false){return Math.sqrt(variance(a,sample))}
function percentile(a,p){a=[...a].map(Number).sort((x,y)=>x-y);const k=(a.length-1)*p/100,l=Math.floor(k),h=Math.ceil(k);return l===h?a[l]:a[l]+(k-l)*(a[h]-a[l])}
function covariance(a,b,sample=false){if(a.length!==b.length)throw new Error("配列長不一致");const ma=mean(a),mb=mean(b);return a.reduce((s,x,i)=>s+(x-ma)*(b[i]-mb),0)/(a.length-(sample?1:0))}
function correlation(a,b){return covariance(a,b)/(stddev(a)*stddev(b))}
function linearRegression(x,y){const slope=covariance(x,y)/variance(x),intercept=mean(y)-slope*mean(x),r=correlation(x,y);return{intercept,slope,r,r2:r*r}}
function quadraticRegression(x,y){const n=x.length,sx=x.reduce((s,v)=>s+v,0),sx2=x.reduce((s,v)=>s+v*v,0),sx3=x.reduce((s,v)=>s+v**3,0),sx4=x.reduce((s,v)=>s+v**4,0),sy=y.reduce((s,v)=>s+v,0),sxy=x.reduce((s,v,i)=>s+v*y[i],0),sx2y=x.reduce((s,v,i)=>s+v*v*y[i],0);const q=global.MFDCOFunctions.createScope({}).solveLinear([[n,sx,sx2],[sx,sx2,sx3],[sx2,sx3,sx4]],[sy,sxy,sx2y]);return{a:q[0],b:q[1],c:q[2]}}
function erf(x){const s=x<0?-1:1;x=Math.abs(x);const t=1/(1+.3275911*x),y=1-(((((1.061405429*t-1.453152027)*t+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x));return s*y}
function normalPDF(x,mu=0,s=1){return Math.exp(-.5*((x-mu)/s)**2)/(s*Math.sqrt(2*Math.PI))}
function normalCDF(x,mu=0,s=1){return .5*(1+erf((x-mu)/(s*Math.sqrt(2))))}
function fact(n){let r=1;for(let i=2;i<=n;i++)r*=i;return r}function ncr(n,r){return fact(n)/(fact(r)*fact(n-r))}
function binomialPMF(k,n,p){return ncr(n,k)*p**k*(1-p)**(n-k)}function poissonPMF(k,l){return Math.exp(-l)*l**k/fact(k)}
function projectileRange(v,a,g=9.80665){return v*v*Math.sin(2*a)/g}function projectileTime(v,a,g=9.80665){return 2*v*Math.sin(a)/g}
function centripetalForce(m,v,r){return m*v*v/r}function angularVelocity(v,r){return v/r}function angularMomentum(I,w){return I*w}function impulse(F,dt){return F*dt}
function frictionForce(mu,N){return mu*N}function springForce(k,x){return-k*x}function springEnergy(k,x){return.5*k*x*x}
function escapeVelocity(G,M,r){return Math.sqrt(2*G*M/r)}function orbitalVelocity(G,M,r){return Math.sqrt(G*M/r)}
function capacitorEnergy(C,V){return.5*C*V*V}function inductorEnergy(L,I){return.5*L*I*I}function rcTimeConstant(R,C){return R*C}function rlTimeConstant(R,L){return L/R}
function reactanceL(L,f){return 2*Math.PI*f*L}function reactanceC(C,f){return-1/(2*Math.PI*f*C)}
function impedanceRLC(R,L,C,f){return complex(R,reactanceL(L,f)+reactanceC(C,f))}function resonantFrequency(L,C){return 1/(2*Math.PI*Math.sqrt(L*C))}
global.MFDCOAdvanced={version:VERSION,Complex,isComplex,complex,real,imag,cadd,csub,cmul,cdiv,cabs,carg,cconj,cexp,clog,cpow,csqrt,csin,ccos,ctan,formatComplex,
quadraticRoots,polyRoots,exactQuadratic,solveExact,solveSystem,substitute,derivative,partial,limit,mean,median,mode,variance,stddev,percentile,covariance,correlation,
linearRegression,quadraticRegression,normalPDF,normalCDF,binomialPMF,poissonPMF,projectileRange,projectileTime,centripetalForce,angularVelocity,angularMomentum,impulse,
frictionForce,springForce,springEnergy,escapeVelocity,orbitalVelocity,capacitorEnergy,inductorEnergy,rcTimeConstant,rlTimeConstant,reactanceL,reactanceC,impedanceRLC,resonantFrequency};
})(typeof window!=="undefined"?window:globalThis);
