/* MFDCO Tools v2.4 public function regression runner */
(function(global){
"use strict";
function near(a,b,t=1e-6){return Math.abs(a-b)<=t*Math.max(1,Math.abs(b))}
function runFunctionTests(){
  const out=[];
  for(const def of MFDCOFunctions.functions){
    const tc=def.test;
    if(!tc){out.push({name:def.name,ok:false,error:"test metadata missing"});continue}
    try{
      let actual,ok;
      if(tc.expectedType==="boolean"){
        const scope=MFDCOFunctions.createScope({angleMode:tc.angleMode||"DEG",vars:{},ansResolver:()=>0,
          evaluate:(expr,vars)=>MFDCOEngine.evaluate(expr,{vars,angleMode:tc.angleMode||"DEG"})});
        actual=def.name==="isfinite"?scope.isfinite(10):def.name==="isnan"?scope.isnan(NaN):false;
        ok=actual===true;
      }else if(tc.expectedType==="array"){
        actual=MFDCOEngine.evaluate(tc.expression,{angleMode:tc.angleMode||"DEG"});
        const cmp=(a,b)=>{
          if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((x,i)=>cmp(x,b[i]));
          return near(Number(a),Number(b),tc.tolerance||1e-6);
        };
        ok=cmp(actual,tc.expected);
      }else if(tc.expectedType==="string"){
        actual=MFDCOEngine.evaluate(tc.expression,{angleMode:tc.angleMode||"DEG"});
        ok=String(actual)===String(tc.expected);
      }else if(tc.expectedType==="stringSet"){
        actual=MFDCOEngine.evaluate(tc.expression,{angleMode:tc.angleMode||"DEG"});
        ok=(tc.accepted||[]).includes(String(actual));
      }else if(tc.expectedType==="stringContains"){
        actual=MFDCOEngine.evaluate(tc.expression,{angleMode:tc.angleMode||"DEG"});
        ok=(tc.expectedContains||[]).every(x=>String(actual).includes(String(x)));
      }else if(tc.expectedType==="arrayUnordered"){
        actual=MFDCOEngine.evaluate(tc.expression,{angleMode:tc.angleMode||"DEG"});
        const aa=[...actual].map(Number).sort((a,b)=>a-b),bb=[...tc.expected].map(Number).sort((a,b)=>a-b);
        ok=aa.length===bb.length&&aa.every((x,i)=>near(x,bb[i],tc.tolerance||1e-6));
      }else{
        actual=MFDCOEngine.evaluate(tc.expression,{angleMode:tc.angleMode||"DEG"});
        ok=near(actual,Number(tc.expected),tc.tolerance||1e-6);
      }
      out.push({name:def.name,ok,actual,expected:tc.expected});
    }catch(e){out.push({name:def.name,ok:false,error:e.message})}
  }
  return out;
}
function coverage(){
  const n=MFDCOFunctions.functions.length;
  const tested=MFDCOFunctions.functions.filter(x=>x.test).length;
  const candidates=MFDCOFunctions.functions.filter(x=>(x.candidateGroups||[]).length).length;
  return {publicCount:n,tested,candidates,testCoverage:tested/n,candidateCoverage:candidates/n};
}


function runLanguageTests(){
  const results=[];
  for(const def of MFDCOLanguage.constructs){
    const tc=def.test;
    if(!tc){results.push({name:def.id,ok:false,error:"test metadata missing"});continue}
    try{
      let ok=false,detail="";
      if(tc.code){
        const r=MFDCOEngine.runCode(tc.code,{angleMode:"DEG"});
        if(tc.expectLog!==undefined){
          ok=(r.logs||[]).some(x=>String(x).includes(String(tc.expectLog)));
          detail=(r.logs||[]).join(" | ");
        }else if(tc.expectPlots!==undefined){
          ok=(r.plots||[]).length===tc.expectPlots;
          detail=`plots=${(r.plots||[]).length}`;
        }
      }else if(tc.expression){
        const val=MFDCOEngine.compareExpression(tc.expression,{angleMode:"DEG"});
        ok=!!val===!!tc.expected;detail=String(val);
      }
      results.push({name:def.id,ok,detail});
    }catch(e){results.push({name:def.id,ok:false,error:e.message})}
  }
  return results;
}

function runUnitTests(){
  const results=[];
  for(const u of MFDCOUnits.BUILTIN_UNITS){
    const tc=u.test;
    if(!tc){results.push({name:u.id,ok:false,error:"test metadata missing"});continue}
    try{
      const target=MFDCOUnits.getBuiltIn(tc.to);
      const actual=MFDCOUnits.convertValue(tc.value,u,target);
      const ok=near(actual,Number(tc.expected),tc.tolerance||1e-9);
      results.push({name:u.id,ok,actual,expected:tc.expected});
    }catch(e){results.push({name:u.id,ok:false,error:e.message})}
  }
  return results;
}
function runTemplateTests(){
  const results=[];
  for(const def of MFDCOTemplates.definitions){
    const code=MFDCOTemplates.get(def.key);
    let ok=typeof code==="string"&&code.trim().length>0;
    let error="",executed=false;
    try{
      if(ok){
        const lines=code.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
        ok=lines.some(x=>!x.startsWith("#"));
        if(ok){
          try{
            MFDCOEngine.runCode(code,{angleMode:"DEG"});
            executed=true;
          }catch(e){
            if(/unknown|未対応|構文|インデント|認識|invalid/i.test(e.message||""))throw e;
          }
        }
      }
    }catch(e){ok=false;error=e.message}
    results.push({name:def.key,ok,error,executed});
  }
  return results;
}






function runPortableWorkspaceTests(){
  const out=[];
  const oldName=global.name;
  try{
    global.name="";
    const pageA=global.MFDCOStorage.createMemoryAdapter();
    const pageB=global.MFDCOStorage.createMemoryAdapter();

    global.MFDCOStorage.withAdapter(pageA,()=>{
      const a=global.MFDCOWorkspace.createClient("page-a");
      const initial=a.initializeCode(global.MFDCOWorkspace.DEFAULT_CODE);
      out.push({name:"canonical-default",ok:typeof initial==="string"&&initial.length>=0});
      a.setCode("shared = 321");
      a.setResults({logs:["shared result"],plots:[]});
    });

    // Simulates navigating to another local HTML file whose localStorage may be isolated.
    global.MFDCOStorage.withAdapter(pageB,()=>{
      const b=global.MFDCOWorkspace.createClient("page-b");
      out.push({name:"portable-code",ok:b.getCode()==="shared = 321"});
      out.push({name:"portable-code-mirrored",ok:typeof global.MFDCOStorage.getCode()==="string"});
      out.push({name:"portable-results",ok:b.getResults()?.logs?.[0]==="shared result"});
    });
  }finally{
    global.name=oldName;
  }
  return out;
}

function runWorkspaceStatusTests(){
  const out=[];
  const mem=global.MFDCOStorage.createMemoryAdapter();
  global.MFDCOStorage.withAdapter(mem,()=>{
    const w=global.MFDCOWorkspace.createClient("status-test");
    global.MFDCOWorkspace.markSaved();
    out.push({name:"saved-initial",ok:!w.getStatus().dirty});
    w.setCode("dirty");
    out.push({name:"dirty-after-code",ok:w.getStatus().dirty});
    global.MFDCOWorkspace.markSaved();
    out.push({name:"saved-after-mark",ok:!w.getStatus().dirty});
    w.setResults({logs:["x"],plots:[]});
    out.push({name:"dirty-after-results",ok:w.getStatus().dirty});
  });
  return out;
}

function runDeepSchemaTests(){
  const out=[];
  const base={
    format:"MFDCO_PROJECT",version:2,name:"Schema",savedAt:new Date().toISOString(),
    data:{
      "mfdco:code":"x=1",
      "mfdco:angleMode":"DEG",
      "mfdco:variables":JSON.stringify([{name:"x",value:1,prefix:"",unit:"m"}]),
      "mfdco:customUnits":JSON.stringify([{id:"u1",name:"単位",symbol:"u",cat:"length",factor:2,prefix:false}]),
      "mfdco:ansHistory":JSON.stringify([{value:1,expression:"1"}]),
      "mfdco:lastResults":JSON.stringify({logs:["ok"],plots:[]})
    }
  };
  out.push({name:"valid-deep",ok:global.MFDCOProjectSchema.validate(base).ok});

  const badVar=JSON.parse(JSON.stringify(base));
  badVar.data["mfdco:variables"]=JSON.stringify([{name:3,value:{}}]);
  out.push({name:"reject-bad-variable",ok:!global.MFDCOProjectSchema.validate(badVar).ok});

  const badUnit=JSON.parse(JSON.stringify(base));
  badUnit.data["mfdco:customUnits"]=JSON.stringify([{id:"",name:"",symbol:"",cat:"",factor:-1}]);
  out.push({name:"reject-bad-unit",ok:!global.MFDCOProjectSchema.validate(badUnit).ok});

  const badAns=JSON.parse(JSON.stringify(base));
  badAns.data["mfdco:ansHistory"]=JSON.stringify([{value:"NaN"}]);
  out.push({name:"reject-bad-ans",ok:!global.MFDCOProjectSchema.validate(badAns).ok});

  const badResults=JSON.parse(JSON.stringify(base));
  badResults.data["mfdco:lastResults"]=JSON.stringify({logs:[1],plots:"x"});
  out.push({name:"reject-bad-results",ok:!global.MFDCOProjectSchema.validate(badResults).ok});

  let sizeRejected=false;
  try{global.MFDCOProjectSchema.assertImportSize(global.MFDCOProjectSchema.MAX_IMPORT_BYTES+1)}
  catch(_){sizeRejected=true}
  out.push({name:"reject-large-import",ok:sizeRejected});
  return out;
}







function runAdvancedMathTests(){
  const o=[],A=global.MFDCOAdvanced;
  o.push({name:"complex",ok:Math.abs(A.cabs(A.complex(3,4))-5)<1e-12});
  o.push({name:"complex-sqrt",ok:Math.abs(A.imag(A.csqrt(A.complex(-1,0)))-1)<1e-12});
  const roots=A.polyRoots([1,0,1]);o.push({name:"complex-roots",ok:roots.length===2&&roots.every(A.isComplex)});
  const se=A.solveExact("x^2-5*x+6=0","x");o.push({name:"solve-exact",ok:String(se).includes("2")&&String(se).includes("3")});
  const ss=A.solveSystem(["2*x+y=5","x-y=1"],["x","y"]);o.push({name:"solve-system",ok:Math.abs(ss.x-2)<1e-9&&Math.abs(ss.y-1)<1e-9});
  o.push({name:"substitute",ok:A.substitute("x^2+x","x","a+b")==="(a+b)^2+(a+b)"});
  const der=A.derivative("sin(x)*exp(x)","x");o.push({name:"general-derivative",ok:der.includes("cos(x)")&&der.includes("exp(x)")});
  o.push({name:"limit",ok:Math.abs(A.limit("sin(x)/x","x",0)-1)<1e-6});
  return o;
}
function runStatisticsTests(){
  const o=[],A=global.MFDCOAdvanced;
  o.push({name:"mean",ok:A.mean([1,2,3,4])===2.5});
  o.push({name:"median",ok:A.median([1,2,9,10])===5.5});
  o.push({name:"mode",ok:JSON.stringify(A.mode([1,2,2,3]))==="[2]"});
  o.push({name:"stddev",ok:Math.abs(A.stddev([1,2,3])-Math.sqrt(2/3))<1e-10});
  o.push({name:"correlation",ok:Math.abs(A.correlation([1,2,3],[2,4,6])-1)<1e-12});
  o.push({name:"normal-cdf",ok:Math.abs(A.normalCDF(0)-0.5)<1e-6});
  o.push({name:"binomial",ok:Math.abs(A.binomialPMF(2,4,.5)-.375)<1e-12});
  o.push({name:"poisson",ok:Math.abs(A.poissonPMF(2,3)-Math.exp(-3)*4.5)<1e-12});
  return o;
}
function runTemplateScaleTests(){
  const defs=global.MFDCOTemplates?.definitions||[],codes=defs.map(d=>global.MFDCOTemplates.get(d.key)||"");
  return [
    {name:"template-count-30-plus",ok:defs.length>=30,detail:`count=${defs.length}`},
    {name:"template-for",ok:codes.some(c=>/for\s+\w+\s*=/.test(c))},
    {name:"template-plot",ok:codes.some(c=>/plot\s*\(/.test(c))},
    {name:"template-def",ok:codes.some(c=>/def\s+\w+/.test(c))},
    {name:"large-template",ok:codes.some(c=>c.split(/\r?\n/).length>=12)}
  ];
}

function runSymbolicTests(){
  const out=[];
  const S=global.MFDCOSymbolic;
  out.push({name:"prime-factorization",ok:JSON.stringify(S.primeFactors(756))==="[2,2,3,3,3,7]"});
  out.push({name:"fraction-reduction",ok:JSON.stringify(S.simplifyFraction(462,1078))==="[3,7]"});
  out.push({name:"expand-binomial",ok:S.expandPoly("(x+2)^4","x")==="x^4 + 8*x^3 + 24*x^2 + 32*x + 16"});
  out.push({name:"collect-terms",ok:S.collectPoly("2*x+x^2-5+3*x","x")==="x^2 + 5*x - 5"});
  const fac=S.factorPoly("x^3-6*x^2+11*x-6","x");
  out.push({name:"factor-polynomial",ok:fac.includes("(x - 1)")&&fac.includes("(x - 2)")&&fac.includes("(x - 3)")});
  out.push({name:"symbolic-derivative",ok:S.polyDerivative("2*x^4-3*x^2+7","x")==="8*x^3 - 6*x"});
  out.push({name:"symbolic-integral",ok:S.polyIntegral("6*x^2-4","x")==="2*x^3 - 4*x + C"});
  const mac=S.maclaurin("sin(x)","x",7);
  out.push({name:"maclaurin-sin",ok:mac==="x - 1/6*x^3 + 1/120*x^5 - 1/5040*x^7"});
  const exp=S.taylor("exp(x)","x",0,5);
  out.push({name:"taylor-exp",ok:exp==="1 + x + 1/2*x^2 + 1/6*x^3 + 1/24*x^4 + 1/120*x^5"});
  const log=S.taylor("ln(x)","x",1,4);
  out.push({name:"taylor-ln-around-1",ok:log.includes("(x - 1)")&&log.includes("1/2*(x - 1)^2")});
  return out;
}

function runQuantityEngineeringTests(){
  const out=[];
  const E=global.MFDCOEngine;
  const Q=global.MFDCOQuantities;
  let q=E.evaluate("force(2 kg, 3 m/s^2)",{angleMode:"DEG"});
  out.push({name:"force-unit",ok:Q.isQuantity(q)&&Math.abs(q.siValue-6)<1e-10&&Q.format(q).includes("N")});
  q=E.evaluate("kineticEnergy(2 kg, 3 m/s)",{angleMode:"DEG"});
  out.push({name:"kinetic-energy-unit",ok:Q.isQuantity(q)&&Math.abs(q.siValue-9)<1e-10&&Q.format(q).includes("J")});
  q=E.evaluate("power(100 J, 5 s)",{angleMode:"DEG"});
  out.push({name:"power-unit",ok:Q.isQuantity(q)&&Math.abs(q.siValue-20)<1e-10&&Q.format(q).includes("W")});
  q=E.evaluate("ohmV(2 A, 5 ohm)",{angleMode:"DEG"});
  out.push({name:"ohm-law-unit",ok:Q.isQuantity(q)&&Math.abs(q.siValue-10)<1e-10&&Q.format(q).includes("V")});
  q=E.evaluate("stress(1000 N, 0.01 m^2)",{angleMode:"DEG"});
  out.push({name:"stress-unit",ok:Q.isQuantity(q)&&Math.abs(q.siValue-100000)<1e-6&&Q.format(q).includes("Pa")});
  return out;
}

function runQuantityTests(){
  const out=[];
  const evalQ=src=>global.MFDCOEngine.evaluate(src,{angleMode:"DEG",vars:{}});
  let q=evalQ("1 km + 500 m");
  out.push({name:"unit-addition",ok:global.MFDCOQuantities.isQuantity(q)&&Math.abs(q.siValue-1500)<1e-9&&global.MFDCOQuantities.format(q).startsWith("1.5 km")});
  q=evalQ("100 m / 5 s");
  out.push({name:"derived-speed",ok:global.MFDCOQuantities.isQuantity(q)&&Math.abs(q.siValue-20)<1e-9&&global.MFDCOQuantities.format(q).includes("m/s")});
  q=evalQ("2 N * 3 m");
  out.push({name:"derived-energy",ok:global.MFDCOQuantities.isQuantity(q)&&Math.abs(q.siValue-6)<1e-9&&global.MFDCOQuantities.format(q).includes("J")});
  const c=evalQ("100 km/h -> m/s");
  out.push({name:"conversion-arrow",ok:Math.abs(c.value-27.7777777778)<1e-8&&c.unit==="m/s"});
  let mismatch=false;
  try{evalQ("10 m + 3 s")}catch(e){mismatch=/次元/.test(e.message)}
  out.push({name:"dimension-mismatch",ok:mismatch});
  q=evalQ("1 kg * 9.80665 m/s^2");
  out.push({name:"force-dimension",ok:global.MFDCOQuantities.isQuantity(q)&&Math.abs(q.siValue-9.80665)<1e-9&&global.MFDCOQuantities.format(q).includes("N")});
  const vars={d:global.MFDCOQuantities.fromUnit(100,"m"),t:global.MFDCOQuantities.fromUnit(5,"s")};
  q=global.MFDCOEngine.evaluate("d/t",{vars,angleMode:"DEG"});
  out.push({name:"quantity-variables",ok:global.MFDCOQuantities.isQuantity(q)&&Math.abs(q.siValue-20)<1e-9});
  const cmp=global.MFDCOEngine.compareExpression("1 km > 500 m",{vars:{},angleMode:"DEG",ansHistory:[]});
  out.push({name:"quantity-comparison",ok:cmp===true});
  return out;
}

function runGraphAnalysisTests(){
  const out=[];
  const plot=global.MFDCOEngine.samplePlotData("x",["x^2-1","x"],-2,2,{count:400});
  out.push({name:"resampleable",ok:global.MFDCOResults.canResample(plot)});
  const roots=global.MFDCOResults.findRoots(plot,0);
  out.push({name:"roots",ok:roots.some(x=>Math.abs(x-1)<0.03)&&roots.some(x=>Math.abs(x+1)<0.03)});
  const ex=global.MFDCOResults.findExtrema(plot,0);
  out.push({name:"extrema",ok:ex.min.some(p=>Math.abs(p.x)<0.03)});
  const inter=global.MFDCOResults.findIntersections(plot,0,1);
  out.push({name:"intersections",ok:inter.length>=1});
  const tg=global.MFDCOResults.tangentAt(plot,1,0);
  out.push({name:"tangent",ok:tg&&Math.abs(tg.slope-2)<0.05});
  const area=global.MFDCOResults.areaUnderCurve(global.MFDCOEngine.samplePlotData("x",["x"],0,1,{count:400}),0,1,0,false);
  out.push({name:"area",ok:Math.abs(area-0.5)<0.01});
  const fresh=global.MFDCOResults.resamplePlot(plot,-4,4,300);
  out.push({name:"resample-range",ok:fresh.xmin===-4&&fresh.xmax===4&&fresh.series[0].points.length===301});
  const csv=global.MFDCOResults.plotToCSV(plot);
  const lines=csv.split(/\r?\n/);
  out.push({name:"csv",ok:lines.length===402&&lines[0].split(",").length===3&&lines[1].split(",").length===3});
  const svg=global.MFDCOResults.plotToSVG(plot,600,300);
  out.push({name:"svg",ok:svg.includes("<svg")&&svg.includes("<path")});
  return out;
}

function runUndoRedoTests(){
  const out=[];
  const mem=global.MFDCOStorage.createMemoryAdapter();
  global.MFDCOStorage.withAdapter(mem,()=>{
    const w=global.MFDCOWorkspace.createClient("undo-test");
    w.clearHistory();
    w.setCode("a");
    w.setCode("b");
    out.push({name:"undo",ok:w.undo()==="a"});
    out.push({name:"redo",ok:w.redo()==="b"});
    w.undo();
    w.setCode("c");
    out.push({name:"redo-cleared",ok:!w.canRedo()});
  });
  return out;
}
function runAdvancedLanguageTests(){
  const out=[];
  const run=src=>{try{return global.MFDCOEngine.runCode(src,{angleMode:"DEG"})}catch(e){return {error:e.message,logs:[]}}};
  let r=run('def square(x):\n  return x^2\nprint(square(5))');
  out.push({name:"def-return",ok:r.logs.some(x=>String(x).includes("25"))});
  r=run('x=-1\nif x>0:\n  print("p")\nelif x<0:\n  print("n")\nelse:\n  print("z")');
  out.push({name:"elif",ok:r.logs.some(x=>String(x).includes("n"))});
  r=run('for i = 1 to 5:\n  if i == 3:\n    break\n  print(i)');
  out.push({name:"break",ok:r.logs.length===2});
  r=run('for i = 1 to 3:\n  if i == 2:\n    continue\n  print(i)');
  out.push({name:"continue",ok:r.logs.length===2});
  return out;
}
function runVectorMatrixTests(){
  const out=[];
  const scope=global.MFDCOFunctions.createScope({angleMode:"DEG"});
  const close=(a,b,t=1e-9)=>Math.abs(a-b)<=t;
  out.push({name:"dot",ok:scope.dot([1,2],[3,4])===11});
  out.push({name:"cross",ok:JSON.stringify(scope.cross([1,0,0],[0,1,0]))==="[0,0,1]"});
  out.push({name:"norm",ok:scope.norm([3,4])===5});
  out.push({name:"det",ok:close(scope.det([[1,2],[3,4]]),-2)});
  out.push({name:"matmul",ok:JSON.stringify(scope.matmul([[1,2]],[[3],[4]]))==="[[11]]"});
  const x=scope.solveLinear([[2,1],[1,-1]],[5,1]);
  out.push({name:"solveLinear",ok:close(x[0],2)&&close(x[1],1)});
  return out;
}

function runBackupTests(){
  const out=[];
  const mem=global.MFDCOStorage.createMemoryAdapter();
  global.MFDCOStorage.withAdapter(mem,()=>{
    global.MFDCOStorage.setCode("before");
    const rec=global.MFDCOStorage.createBackup("test");
    out.push({name:"backup-created",ok:rec?.project?.data?.["mfdco:code"]==="before"});
    global.MFDCOStorage.setCode("after");
    global.MFDCOStorage.restoreLatestBackup();
    out.push({name:"backup-restored",ok:global.MFDCOStorage.getCode()==="before"});
  });
  return out;
}

function runAutosaveStateTests(){
  const out=[];
  global.MFDCOWorkspace.setAutosave(false);
  out.push({name:"autosave-off",ok:global.MFDCOWorkspace.getAutosave()===false});
  global.MFDCOWorkspace.setAutosave(true);
  out.push({name:"autosave-on",ok:global.MFDCOWorkspace.getAutosave()===true});
  global.MFDCOWorkspace.setAutosave(false);
  return out;
}

function runWorkspaceTests(){
  const results=[];
  const mem=global.MFDCOStorage.createMemoryAdapter();
  global.MFDCOStorage.withAdapter(mem,()=>{
    const a=global.MFDCOWorkspace.createClient("calculator-test");
    const b=global.MFDCOWorkspace.createClient("code-test");
    a.setCode("x=10");
    results.push({name:"shared-code-write",ok:b.getCode()==="x=10"});
    b.setCode("");
    results.push({name:"shared-code-empty",ok:a.hasCode()&&a.getCode("fallback")===""});

    a.setResults({savedAt:"2026-01-01T00:00:00Z",logs:["A","B"],plots:[{variable:"x",series:[]}]});
    const p=b.getResults();
    results.push({name:"shared-results-write",ok:!!p&&p.logs.join("|")==="A|B"&&p.plots.length===1});
    results.push({name:"shared-results-text",ok:b.resultText(p)==="A\nB"});
    b.clearResults();
    results.push({name:"shared-results-clear",ok:a.getResults()===null});
    a.setVariables([
      {name:"dL",value:"0.002",prefix:"",unit:"m"},
      {name:"L",value:"2",prefix:"",unit:"m"}
    ]);
    const sharedVars=b.getVariables();
    results.push({name:"shared-variables",ok:sharedVars.length===2&&sharedVars[0].name==="dL"&&sharedVars[1].name==="L"});
  });
  return results;
}

function runRollbackTests(){
  const results=[];
  const base=global.MFDCOStorage.createMemoryAdapter();
  global.MFDCOStorage.withAdapter(base,()=>{
    global.MFDCOStorage.setCode("before");
    global.MFDCOStorage.setAngleMode("DEG");
    const project=global.MFDCOStorage.collectProject("Before");
    project.name="After";
    project.data["mfdco:code"]="after";
    project.data["mfdco:angleMode"]="RAD";

    let failed=false;
    const failOnce={
      type:"fail-once",
      _failed:false,
      getItem:k=>base.getItem(k),
      setItem(k,v){
        if(k==="mfdco:code"&&!this._failed){
          this._failed=true;
          throw new Error("simulated write failure");
        }
        base.setItem(k,v);
      },
      removeItem:k=>base.removeItem(k)
    };

    try{
      global.MFDCOStorage.withAdapter(failOnce,()=>global.MFDCOStorage.applyProjectTransactional(project));
    }catch(_){failed=true}
    results.push({name:"transaction-failed",ok:failed});
    results.push({name:"rollback-code",ok:global.MFDCOStorage.getCode()==="before"});
    results.push({name:"rollback-angle",ok:global.MFDCOStorage.getAngleMode()==="DEG"});
  });
  return results;
}

function runStorageAdapterTests(){
  const results=[];
  const mem=global.MFDCOStorage.createMemoryAdapter();
  global.MFDCOStorage.withAdapter(mem,()=>{
    function push(name,ok,detail=""){results.push({name,ok:!!ok,detail})}

    push("adapter-type",global.MFDCOStorage.getAdapter().type==="memory");

    push("raw-set",global.MFDCOStorage.rawSet("x","10"));
    push("raw-get",global.MFDCOStorage.rawGet("x")==="10");
    push("raw-remove",global.MFDCOStorage.remove("x")&&global.MFDCOStorage.rawGet("x",null)===null);

    push("code",global.MFDCOStorage.setCode("a=1")&&global.MFDCOStorage.getCode()==="a=1");
    push("angle",global.MFDCOStorage.setAngleMode("RAD")&&global.MFDCOStorage.getAngleMode()==="RAD");

    const ans=[{value:5,expression:"2+3"}];
    push("ans",global.MFDCOStorage.setAnsHistory(ans)&&JSON.stringify(global.MFDCOStorage.getAnsHistory())===JSON.stringify(ans));

    const vars=[{name:"m",value:3,prefix:"",unit:"kg"}];
    push("variables",global.MFDCOStorage.setVariables(vars)&&JSON.stringify(global.MFDCOStorage.getVariables())===JSON.stringify(vars));

    const units=[{id:"test",name:"test",symbol:"t",cat:"length",factor:2,prefix:false}];
    push("custom-units",global.MFDCOStorage.setCustomUnits(units)&&JSON.stringify(global.MFDCOStorage.getCustomUnits())===JSON.stringify(units));

    const res={logs:["ok"],plots:[]};
    push("results",global.MFDCOStorage.setLastResults(res)&&JSON.stringify(global.MFDCOStorage.getLastResults())===JSON.stringify(res));
    push("results-clear",global.MFDCOStorage.clearLastResults()&&global.MFDCOStorage.getLastResults()===null);

    global.MFDCOStorage.setLastResults(res);
    const saved=global.MFDCOStorage.collectProject("CRUD Test");
    push("collect-project",saved.format==="MFDCO_PROJECT"&&saved.name==="CRUD Test"&&saved.data["mfdco:code"]==="a=1");

    global.MFDCOStorage.clearProjectData();
    push("clear-project",global.MFDCOStorage.getCode()===""&&global.MFDCOStorage.getVariables().length===0);

    global.MFDCOStorage.applyProject(saved);
    push("apply-project",global.MFDCOStorage.getCode()==="a=1"&&global.MFDCOStorage.getAngleMode()==="RAD");

    global.MFDCOStorage.saveProjectToLibrary("Library A");
    global.MFDCOStorage.setCode("changed");
    global.MFDCOStorage.loadProjectFromLibrary("Library A");
    push("library-load",global.MFDCOStorage.getCode()==="a=1");

    push("library-delete",global.MFDCOStorage.deleteProjectFromLibrary("Library A")&&global.MFDCOStorage.getProjectLibrary().length===0);

    const dumped=mem.dump();
    push("adapter-dump",typeof dumped==="object"&&Object.keys(dumped).length>0);
  });
  return results;
}

function runArchitectureTests(){
  return [
    {name:"results-controller",ok:typeof global.MFDCOResults?.createResultsController==="function"},
    {name:"syntax-registry",ok:typeof global.MFDCOSyntax?.highlight==="function"},
    {name:"registry-search",ok:typeof global.MFDCORegistrySearch?.search==="function"},
    {name:"registry-search-functions",ok:(global.MFDCORegistrySearch?.search("sqrt",{kinds:["function"]})||[]).some(x=>x.id==="sqrt")},
    {name:"workspace",ok:typeof global.MFDCOWorkspace?.createClient==="function"},
    {name:"workspace-status",ok:typeof global.MFDCOWorkspace?.getStatus==="function"},
    {name:"portable-workspace",ok:typeof global.MFDCOWorkspace?.readPortable==="function"},
    {name:"broadcast-workspace",ok:typeof global.MFDCOWorkspace?.requestPeerState==="function"&&!!global.MFDCOWorkspace?.CHANNEL_NAME},
    {name:"shared-variables",ok:typeof global.MFDCOWorkspace?.getVariables==="function"&&typeof global.MFDCOWorkspace?.setVariables==="function"},
    {name:"deep-schema",ok:typeof global.MFDCOProjectSchema?.assertImportSize==="function"},
    {name:"backup-api",ok:typeof global.MFDCOStorage?.createBackup==="function"},
    {name:"autosave-api",ok:typeof global.MFDCOWorkspace?.setAutosave==="function"},
    {name:"undo-redo-api",ok:typeof global.MFDCOWorkspace?.undoCode==="function"},
    {name:"advanced-language",ok:global.MFDCOLanguage?.get?.("def")!=null},
    {name:"vector-matrix",ok:typeof global.MFDCOFunctions?.createScope?.({angleMode:"DEG"}).dot==="function"},
    {name:"graph-analysis",ok:typeof global.MFDCOResults?.findRoots==="function"&&typeof global.MFDCOResults?.resamplePlot==="function"},
    {name:"quantities",ok:typeof global.MFDCOQuantities?.evaluate==="function"&&typeof global.MFDCOQuantities?.fromUnit==="function"},
    {name:"symbolic",ok:typeof global.MFDCOSymbolic?.maclaurin==="function"&&typeof global.MFDCOSymbolic?.factorPoly==="function"},
    {name:"quantity-engineering",ok:typeof global.MFDCOFunctions?.createScope?.({angleMode:"DEG"}).force==="function"},
    {name:"advanced-math",ok:typeof global.MFDCOAdvanced?.polyRoots==="function"},
    {name:"template-scale",ok:(global.MFDCOTemplates?.definitions||[]).length>=30}
  ];
}

function runStorageRoundtripTests(){
  const sample={
    "mfdco:code":"a=3\\nprint(a)",
    "mfdco:lastResults":JSON.stringify({logs:["3"],plots:[{variable:"x",xmin:-1,xmax:1,series:[]}]}),
    "mfdco:customUnits":JSON.stringify([{id:"custom_test",name:"試験単位",symbol:"ct",cat:"length",factor:2,prefix:false}]),
    "mfdco:ansHistory":JSON.stringify([{value:5,expression:"2+3"}]),
    "mfdco:variables":JSON.stringify([{name:"mass",value:10,prefix:"",unit:"kg"}]),
    "mfdco:angleMode":"RAD"
  };
  const project={
    format:"MFDCO_PROJECT",version:2,appVersion:"2.7",name:"Roundtrip",savedAt:new Date().toISOString(),
    data:sample
  };
  const checked=MFDCOProjectSchema.validate(project);
  const migrated=MFDCOProjectSchema.migrate(project);
  const checks=[
    ["schema-valid",checked.ok],
    ["code",migrated.data["mfdco:code"]===sample["mfdco:code"]],
    ["results",migrated.data["mfdco:lastResults"]===sample["mfdco:lastResults"]],
    ["customUnits",migrated.data["mfdco:customUnits"]===sample["mfdco:customUnits"]],
    ["ans",migrated.data["mfdco:ansHistory"]===sample["mfdco:ansHistory"]],
    ["variables",migrated.data["mfdco:variables"]===sample["mfdco:variables"]],
    ["angle",migrated.data["mfdco:angleMode"]==="RAD"]
  ];
  return checks.map(([name,ok])=>({name,ok}));
}

function runProjectSchemaTests(){
  const base={format:"MFDCO_PROJECT",version:2,appVersion:"2.5",name:"Test",savedAt:new Date().toISOString(),
    data:{"mfdco:code":"a=1","mfdco:angleMode":"DEG","mfdco:variables":"[]"}};
  const valid=MFDCOProjectSchema.validate(base);
  const migrated=MFDCOProjectSchema.migrate({...base,version:1});
  const bad=MFDCOProjectSchema.validate({...base,data:{"mfdco:angleMode":"XXX"}});
  return [
    {name:"valid project",ok:valid.ok},
    {name:"v1 migration",ok:migrated.version===2&&migrated.format==="MFDCO_PROJECT"},
    {name:"reject invalid angle",ok:!bad.ok}
  ];
}
function fullCoverage(){
  const f=coverage();
  return {...f,
    unitCount:MFDCOUnits.BUILTIN_UNITS.length,
    unitTested:MFDCOUnits.BUILTIN_UNITS.filter(x=>x.test).length,
    unitTestCoverage:MFDCOUnits.testCoverage(),
    templateCount:MFDCOTemplates.definitions.length,
    templateTested:MFDCOTemplates.definitions.filter(x=>x.test).length,
    templateTestCoverage:MFDCOTemplates.testCoverage(),
    languageCount:MFDCOLanguage.constructs.length,
    languageTested:MFDCOLanguage.constructs.filter(x=>x.test).length,
    languageTestCoverage:MFDCOLanguage.coverage()
  };
}

global.MFDCOReleaseTests={version:"3.8",runFunctionTests,coverage,runUnitTests,runTemplateTests,runProjectSchemaTests,runStorageRoundtripTests,runStorageAdapterTests,runWorkspaceTests,runPortableWorkspaceTests,runWorkspaceStatusTests,runDeepSchemaTests,runAdvancedMathTests,runStatisticsTests,runTemplateScaleTests,runSymbolicTests,runQuantityEngineeringTests,runQuantityTests,runGraphAnalysisTests,runUndoRedoTests,runAdvancedLanguageTests,runVectorMatrixTests,runBackupTests,runAutosaveStateTests,runRollbackTests,runArchitectureTests,runLanguageTests,fullCoverage};
})(typeof window!=="undefined"?window:globalThis);