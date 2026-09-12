/* MFDCO Tools v2.0 shared expression + code engine */
(function(global){
"use strict";
if(!global.MFDCOFunctions)throw new Error("mfdco-functions.js must be loaded before mfdco-engine.js");

function formatNumber(n){
  if(global.MFDCOAdvanced?.isComplex?.(n))return global.MFDCOAdvanced.formatComplex(n);
  if(global.MFDCOQuantities?.isQuantity?.(n))return global.MFDCOQuantities.format(n);
  if(n&&typeof n==="object"&&typeof n.text==="string"&&"unit" in n)return n.text;
  if(Array.isArray(n))return JSON.stringify(n);
  if(typeof n!=="number"||!Number.isFinite(n))return String(n);
  if(Math.abs(n)>=1e12||(Math.abs(n)>0&&Math.abs(n)<1e-9))return n.toExponential(10);
  return String(Number(n.toPrecision(12)));
}
function tokenizeExpression(source){
  const s=String(source);let out="",quote=null,buf="";
  const flush=()=>{if(!buf)return;out+=buf.replace(/π/g,"pi").replace(/ANS\s*\(\s*(\d+)\s*\)/gi,"ansValue($1)").replace(/\^/g,"**").replace(/(\d+(?:\.\d+)?|\)|pi|e)%/g,"($1/100)").replace(/\bmod\b/g,"%").replace(/(\d+|\)|pi|e)!/g,"factorial($1)");buf=""};
  for(let i=0;i<s.length;i++){const ch=s[i];if(quote){out+=ch;if(ch===quote&&s[i-1]!=="\\")quote=null}else if(ch==="'"||ch==='"'){flush();quote=ch;out+=ch}else buf+=ch}
  flush();return out;
}
function makeAnsResolver(ansHistory){
  return index=>{
    const n=Number(index);
    if(!Number.isInteger(n)||n<1)throw new Error("ANS番号は1以上の整数です");
    const item=(ansHistory||[])[n-1];
    if(!item)throw new Error(`ANS(${n}) は保存されていません`);
    const value=Number(item.value);
    if(!Number.isFinite(value))throw new Error(`ANS(${n}) が数値ではありません`);
    return value;
  };
}
function evaluate(source,options={}){
  const vars=options.vars||{};
  const angleMode=options.angleMode==="RAD"?"RAD":"DEG";
  const ansHistory=options.ansHistory||[];
  const functions=options.functions||{};
  const evaluateNested=(expression,nestedVars)=>evaluate(expression,{vars:nestedVars,angleMode,ansHistory,functions});
  const scope=global.MFDCOFunctions.createScope({
    vars,angleMode,ansResolver:makeAnsResolver(ansHistory),evaluate:evaluateNested
  });
  Object.assign(scope,functions);
  if(global.MFDCOQuantities?.shouldUse?.(source,vars)){
    return global.MFDCOQuantities.evaluate(source,{
      vars,scope,ansResolver:makeAnsResolver(ansHistory),angleMode
    });
  }
  const s=tokenizeExpression(source);
  const safe=s.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'""');
  if(!/^[0-9A-Za-z_+\-*/%().,\s*"ぁ-んァ-ン一-龠ーµΩπ\[\]]+$/.test(safe))
    throw new Error("使用できない文字が含まれています");
  const names=Object.keys(scope),values=Object.values(scope);
  let value;
  try{
    value=new Function(...names,`"use strict";return(${s});`)(...values);
  }catch(e){
    throw new Error(e && e.message ? e.message : "式を評価できません");
  }
  if(typeof value==="number"&&Number.isNaN(value))throw new Error("数値として計算できません");
  if(global.MFDCOAdvanced?.isComplex?.(value))return value;
  if(global.MFDCOQuantities?.isQuantity?.(value))return value;
  if(value&&typeof value==="object"&&typeof value.text==="string"&&"unit" in value)return value;
  if(typeof value==="string")return value;
  if(typeof value!=="number"&&!Array.isArray(value)&&!(value&&typeof value==="object"))throw new Error("計算可能な値ではありません");
  return value;
}
function splitArgs(s){
  const args=[];let cur="",depth=0,quote=null;
  for(let i=0;i<s.length;i++){
    const ch=s[i];
    if(quote){
      cur+=ch;if(ch===quote&&s[i-1]!=="\\")quote=null;
    }else if(ch==="'"||ch==='"'){
      quote=ch;cur+=ch;
    }else if(ch==="("||ch==="["){depth++;cur+=ch}
    else if(ch===")"||ch==="]"){depth--;cur+=ch}
    else if(ch===","&&depth===0){args.push(cur.trim());cur=""}
    else cur+=ch;
  }
  if(cur.trim())args.push(cur.trim());
  return args;
}
function stripComments(line){
  let quote=null;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(quote){
      if(ch===quote&&line[i-1]!=="\\")quote=null;
    }else if(ch==="'"||ch==='"')quote=ch;
    else if(ch==="#")return line.slice(0,i);
  }
  return line;
}
function compareExpression(expr,ctx){
  expr=expr.trim();
  const orParts=expr.split(/\s+or\s+/i);
  if(orParts.length>1)return orParts.some(p=>compareExpression(p,ctx));
  const andParts=expr.split(/\s+and\s+/i);
  if(andParts.length>1)return andParts.every(p=>compareExpression(p,ctx));
  if(/^not\s+/i.test(expr))return !compareExpression(expr.replace(/^not\s+/i,""),ctx);
  for(const op of ["<=",">=","==","!=","<",">"]){
    const p=expr.indexOf(op);
    if(p>0){
      const a=evaluate(expr.slice(0,p),ctx),b=evaluate(expr.slice(p+op.length),ctx);
      if(global.MFDCOQuantities?.isQuantity?.(a)||global.MFDCOQuantities?.isQuantity?.(b))
        return global.MFDCOQuantities.compare(a,b,op);
      if(op==="==")return a===b;
      if(op==="!=")return a!==b;
      if(op==="<=")return a<=b;
      if(op===">=")return a>=b;
      if(op==="<")return a<b;
      return a>b;
    }
  }
  return !!evaluate(expr,ctx);
}
function samplePlotData(variable,expressions,xmin,xmax,options={}){
  const vars=options.vars||{};
  const angleMode=options.angleMode||"DEG";
  const ansHistory=options.ansHistory||[];
  const functions=options.functions||{};
  const count=Number.isFinite(options.count)?Math.max(32,Math.trunc(options.count)):520;
  const series=expressions.slice(0,8).map((expr,index)=>({
    expr:String(expr),label:String(expr),index,points:[]
  }));
  for(let i=0;i<=count;i++){
    const x=xmin+(xmax-xmin)*(i/count);
    for(const s of series){
      let y=null;
      try{
        const v=evaluate(s.expr,{vars:{...vars,[variable]:x},angleMode,ansHistory,functions});
        y=Number(v);
        if(!Number.isFinite(y))y=null;
      }catch(_){y=null}
      s.points.push([x,y]);
    }
  }
  for(const s of series){
    s.expression=s.expr;
    const values=s.points.map(p=>p[1]).filter(Number.isFinite);
    const mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
    const variance=values.length?values.reduce((a,b)=>a+(b-mean)*(b-mean),0)/values.length:null;
    s.stats={
      min:values.length?Math.min(...values):null,
      max:values.length?Math.max(...values):null,
      mean,
      stddev:variance===null?null:Math.sqrt(variance),
      count:values.length
    };
  }
  return {
    variable:String(variable),
    expressions:series.map(s=>s.expr),
    xmin:Number(xmin),xmax:Number(xmax),
    sampleCount:count,resampleable:true,
    angleMode,varsSnapshot:{...vars},series
  };
}

function runCode(source,options={}){
  const vars={...(options.vars||{})};
  const logs=[],plots=[],functions={};
  const ctx={angleMode:options.angleMode==="RAD"?"RAD":"DEG",ansHistory:options.ansHistory||[],vars,functions};
  const lines=String(source||"").split(/\r?\n/);
  const maxWhile=Number.isFinite(options.maxWhile)?options.maxWhile:10000;

  const indentOf=raw=>(raw.match(/^\s*/)?.[0]||"").replace(/\t/g,"  ").length;
  const clean=raw=>stripComments(raw).trim();
  const evalExpr=(expr,scope=vars)=>evaluate(expr,{...ctx,vars:scope,functions});
  const truth=(expr,scope=vars)=>compareExpression(expr,{...ctx,vars:scope,functions});

  function signal(type,value){return {__signal:type,value}}
  function blockEnd(start,childIndent){
    let j=start;
    while(j<lines.length){
      if(!lines[j].trim()){j++;continue}
      if(indentOf(lines[j])<childIndent)break;
      j++;
    }
    return j;
  }
  function simple(line,scope){
    if(line==="break")return signal("break");
    if(line==="continue")return signal("continue");
    if(line==="return")return signal("return");
    if(line.startsWith("return "))return signal("return",evalExpr(line.slice(7),scope));

    const plotm=line.match(/^plot\s*\((.*)\)\s*$/);
    if(plotm){
      const args=splitArgs(plotm[1]);
      if(args.length<4)throw new Error("plot(x, y式..., xmin, xmax) の形式で指定してください");
      const variable=args[0].trim();
      const xmin=evalExpr(args[args.length-2],scope),xmax=evalExpr(args[args.length-1],scope);
      const expressions=args.slice(1,-2).map(x=>x.trim()).filter(Boolean);
      plots.push(samplePlotData(variable,expressions,xmin,xmax,{...ctx,vars:scope,functions}));
      logs.push("結果タブにグラフをプロットしました");
      return null;
    }
    const pm=line.match(/^print\s*\((.*)\)\s*$/);
    if(pm){
      const vals=splitArgs(pm[1]).map(a=>{
        const q=a.match(/^["'](.*)["']$/);
        return q?q[1]:formatNumber(evalExpr(a,scope));
      });
      logs.push(vals.join(" : "));
      return null;
    }
    const am=line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if(am){
      const v=evalExpr(am[2],scope);
      scope[am[1]]=v;
      if(scope===vars&&am[1]==="result")logs.push(`result = ${formatNumber(v)}`);
      return null;
    }
    const v=evalExpr(line,scope);
    logs.push(formatNumber(v));
    return null;
  }

  function execRange(start,end,baseIndent,scope,loopDepth=0,functionDepth=0){
    let i=start,last=null;
    while(i<end){
      const raw=lines[i];
      if(!raw.trim()){i++;continue}
      const indent=indentOf(raw);
      if(indent<baseIndent)break;
      if(indent>baseIndent)throw Object.assign(new Error("予期しないインデント"),{codeLine:i+1});
      const line=clean(raw);
      if(!line){i++;continue}

      const def=line.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*?)\)\s*:\s*$/);
      if(def){
        const childIndent=baseIndent+2,childStart=i+1,childEnd=blockEnd(childStart,childIndent);
        const params=def[2].trim()?splitArgs(def[2]).map(x=>x.trim()):[];
        functions[def[1]]=(...args)=>{
          const local={...vars};
          params.forEach((name,idx)=>local[name]=args[idx]);
          const r=execRange(childStart,childEnd,childIndent,local,0,functionDepth+1);
          return r.signal?.__signal==="return"?r.signal.value:undefined;
        };
        i=childEnd;continue;
      }

      const ifm=line.match(/^if\s+(.+)\s*:\s*$/);
      if(ifm){
        let cursor=i,chosen=false;
        while(cursor<end){
          const head=clean(lines[cursor]);
          let cond=null,isElse=false,m=head.match(/^if\s+(.+)\s*:\s*$/);
          if(cursor!==i)m=head.match(/^elif\s+(.+)\s*:\s*$/);
          if(m)cond=m[1];
          else if(/^else\s*:\s*$/.test(head))isElse=true;
          else break;

          const childIndent=baseIndent+2,childStart=cursor+1,childEnd=blockEnd(childStart,childIndent);
          if(!chosen&&(isElse||truth(cond,scope))){
            chosen=true;
            const r=execRange(childStart,childEnd,childIndent,scope,loopDepth,functionDepth);
            if(r.signal)return r;
          }
          cursor=childEnd;
          if(cursor>=end||indentOf(lines[cursor])!==baseIndent)break;
          const next=clean(lines[cursor]);
          if(!/^elif\b/.test(next)&&!/^else\s*:/.test(next))break;
        }
        i=cursor;continue;
      }

      const fm=line.match(/^for\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s+to\s+(.+?)\s*:\s*$/);
      if(fm){
        const childIndent=baseIndent+2,childStart=i+1,childEnd=blockEnd(childStart,childIndent);
        const a=Math.trunc(Number(evalExpr(fm[2],scope))),b=Math.trunc(Number(evalExpr(fm[3],scope)));
        const step=a<=b?1:-1;
        for(let n=a;step>0?n<=b:n>=b;n+=step){
          scope[fm[1]]=n;
          const r=execRange(childStart,childEnd,childIndent,scope,loopDepth+1,functionDepth);
          if(r.signal){
            if(r.signal.__signal==="break")break;
            if(r.signal.__signal==="continue")continue;
            return r;
          }
        }
        i=childEnd;continue;
      }

      const wm=line.match(/^while\s+(.+?)\s*:\s*$/);
      if(wm){
        const childIndent=baseIndent+2,childStart=i+1,childEnd=blockEnd(childStart,childIndent);
        let guard=0;
        while(truth(wm[1],scope)){
          if(++guard>maxWhile)throw Object.assign(new Error("while の反復回数が上限を超えました"),{codeLine:i+1});
          const r=execRange(childStart,childEnd,childIndent,scope,loopDepth+1,functionDepth);
          if(r.signal){
            if(r.signal.__signal==="break")break;
            if(r.signal.__signal==="continue")continue;
            return r;
          }
        }
        i=childEnd;continue;
      }

      try{
        const sig=simple(line,scope);
        if(sig){
          if((sig.__signal==="break"||sig.__signal==="continue")&&loopDepth<=0)
            throw new Error(`${sig.__signal} はループ内でのみ使用できます`);
          if(sig.__signal==="return"&&functionDepth<=0)
            throw new Error("return は関数内でのみ使用できます");
          return {index:i+1,last,signal:sig};
        }
      }catch(err){
        err.codeLine=err.codeLine||i+1;
        throw err;
      }
      i++;
    }
    return {index:i,last};
  }

  try{
    const result=execRange(0,lines.length,0,vars,0,0);
    if(!logs.length)logs.push("実行完了");
    return {vars,logs,plots,last:result.last,functions};
  }catch(e){
    e.logs=[...logs];e.plots=[...plots];e.vars={...vars};
    throw e;
  }
}

global.MFDCOEngine={
  version:"3.8.2",formatNumber,tokenizeExpression,evaluate,splitArgs,stripComments,
  compareExpression,samplePlotData,runCode
};
})(typeof window!=="undefined"?window:globalThis);
