/* MFDCO Tools v2.1 shared code/formula templates */
(function(global){
"use strict";
const map={
    quadratic:`# 二次方程式 / 解の公式
a = 1
b = -3
c = 2
D = b^2 - 4*a*c
x1 = (-b + sqrt(D)) / (2*a)
x2 = (-b - sqrt(D)) / (2*a)
print("判別式 D", D)
print("x1", x1)
print("x2", x2)`,
    projectile:`# 放物線運動
v0 = 50
theta = 45
g = 9.80665
vx = v0 * cos(theta)
vy = v0 * sin(theta)
flightTime = (2 * vy) / g
maxHeight = (vy^2) / (2*g)
range = vx * flightTime
print("飛行時間", flightTime)
print("最高高度", maxHeight)
print("飛距離", range)`,
    freefall:`# 自由落下
g = 9.80665
t = 5
distance = 0.5 * g * t^2
velocity = g * t
print("落下距離", distance)
print("速度", velocity)`,
    energy:`# 力学
m = 1000
v = 20
Ek = kineticEnergy(m, v)
p = momentum(m, v)
print("運動エネルギー", Ek)
print("運動量", p)`,
    calculus:`# 数値微積分
d1 = diff("x^3 + sin(x)", "x", 2)
d2 = diff2("x^3", "x", 2)
area = integral("sin(x)", "x", 0, pi)
root = solve("x^2 - 2", "x", 0, 2)
print("1階微分", d1)
print("2階微分", d2)
print("定積分", area)
print("解", root)`,
    bernoulli:`# Bernoulli の定理
p1 = 101325
rho = 1000
v1 = 2
z1 = 10
v2 = 4
z2 = 8
p2 = bernoulliP2(p1, rho, v1, z1, v2, z2)
H1 = bernoulliHead(p1, rho, v1, z1)
H2 = bernoulliHead(p2, rho, v2, z2)
print("p2", p2)
print("H1", H1)
print("H2", H2)`,
    reynolds:`# Reynolds 数
rho = 1.225
v = 15
L = 1
mu = 0.0000181
Re = reynolds(rho, v, L, mu)
print("Re", Re)
if Re < 2300:
  print("層流")
else:
  print("遷移域または乱流")`,
    continuity:`# 連続の式
A1 = 0.1
v1 = 2
A2 = 0.05
v2 = continuityV2(A1, v1, A2)
print("v2", v2)`,
    drag:`# 動圧・抗力
rho = 1.225
v = 30
Cd = 0.32
A = 2.2
q = dynamicPressure(rho, v)
Fd = dragForce(rho, v, Cd, A)
print("動圧", q)
print("抗力", Fd)`,
    idealgas:`# 理想気体
n = 1
T = 300
V = 0.024
P = idealGasP(n, T, V)
print("P", P)`,
    ohm:`# オーム則・電力
I = 2
R = 5
V = ohmV(I, R)
P = electricPower(V, I)
print("V", V)
print("P", P)`,
    strength:`# 材料力学
F = 10000
A = 0.002
dL = 0.001
L = 2
E = 200000000000
I2 = 0.000001
K = 1
sigma = stress(F, A)
epsilon = strain(dL, L)
sigmaHooke = hookeStress(E, epsilon)
Pcr = eulerBuckling(E, I2, K, L)
print("応力", sigma)
print("ひずみ", epsilon)
print("Euler座屈荷重", Pcr)`,
    heat:`# 熱伝導
k = 50
A = 0.1
dT = 40
L = 0.02
Qdot = heatConduction(k, A, dT, L)
print("熱流率", Qdot)`,
    statistics:`# 総和・総積・組合せ
S = sum("i^2", "i", 1, 10)
P = product("i", "i", 1, 5)
C = nCr(10, 3)
print("Σi^2", S)
print("5!", P)
print("10C3", C)`,
    plot:`# 二次関数のプロット例
plot(x, x^2, -5, 5)`,
    constants:`# 主要定数
print("c", c0)
print("G", G)
print("h", h)
print("kB", kB)
print("NA", NA)
print("R", Rgas)`
  ,
    "symbolic_lab":"# 記号計算ラボ\nprint(\"展開\", expandPoly(\"(x+1)^4\", \"x\"))\nprint(\"因数分解\", factorPoly(\"x^3-6*x^2+11*x-6\", \"x\"))\nprint(\"微分\", derivative(\"sin(x)*exp(x)\", \"x\"))\nprint(\"積分\", polyIntegral(\"6*x^2-4\", \"x\"))\nprint(\"Maclaurin\", maclaurin(\"sin(x)\", \"x\", 9))\nprint(\"Taylor\", taylor(\"ln(x)\", \"x\", 1, 6))",
    "complex_lab":"# 複素数・多項式根\nz = complex(3,4)\nprint(\"abs\", complexAbs(z))\nprint(\"arg\", arg(z))\nprint(\"conj\", conj(z))\nprint(\"sqrt(-1)\", complexSqrt(complex(-1,0)))\nroots = polyRoots([1,0,0,1])\nprint(\"roots\", roots)\nprint(solveExact(\"x^2+x+1=0\", \"x\"))",
    "series_compare":"# 級数展開まとめ\nprint(maclaurin(\"sin(x)\", \"x\", 9))\nprint(maclaurin(\"exp(x)\", \"x\", 8))\nprint(taylor(\"ln(x)\", \"x\", 1, 6))\nfor n = 2 to 10:\n  print(\"order\", n, maclaurin(\"sin(x)\", \"x\", n))\nplot(x, sin(x), -180, 180)",
    "projectile_sweep":"# 投射角スイープ\nv0 = 50\ng = 9.80665\nfor angle = 10 to 80:\n  R = projectileRange(v0, rad(angle), g)\n  if angle == 45:\n    print(\"45deg\", R)\nplot(a, projectileRange(v0, rad(a), g), 1, 89)",
    "orbit_escape":"# 軌道速度と脱出速度\nM = 5.972e24\nR = 6.371e6\nfor h = 0 to 10:\n  r = R + h*100000\n  print(h*100, orbitalVelocity(G,M,r), escapeVelocity(G,M,r))\nplot(h, orbitalVelocity(G,M,R+h), escapeVelocity(G,M,R+h), 0, 2000000)",
    "rc_response":"# RC回路応答\nR = 10000\nC = 0.0001\nV0 = 5\ntau = rcTimeConstant(R,C)\nprint(\"tau\", tau)\nplot(t, V0*(1-exp(-t/tau)), 0, 5*tau)",
    "rlc_frequency":"# RLC周波数解析\nR = 10\nL = 0.1\nC = 0.00001\nf0 = resonantFrequency(L,C)\nprint(\"f0\", f0)\nfor f = 10 to 100:\n  if f == 50:\n    print(\"XL\", reactanceL(L,f), \"XC\", reactanceC(C,f))\nplot(f, reactanceL(L,f), -reactanceC(C,f), 1, 1000)",
    "statistics_report":"# 統計レポート\ndata = [12,13,15,15,16,20,22,30]\nprint(\"mean\", mean(data))\nprint(\"median\", median(data))\nprint(\"mode\", mode(data))\nprint(\"stddev\", stddev(data))\nprint(\"P25\", percentile(data,25))\nprint(\"P75\", percentile(data,75))\nx = [1,2,3,4,5]\ny = [2.2,4.1,6.2,7.9,10.1]\nprint(\"r\", correlation(x,y))\nprint(\"reg\", linearRegression(x,y))",
    "normal_distribution":"# 正規分布\nmu = 0\nsigma = 1\nprint(\"P<=1\", normalCDF(1,mu,sigma))\nprint(\"P[-1,1]\", normalCDF(1,mu,sigma)-normalCDF(-1,mu,sigma))\nplot(x, normalPDF(x,mu,sigma), -4, 4)",
    "binomial_table":"# 二項分布表\nn = 20\np = 0.3\nsumP = 0\nfor k = 0 to 20:\n  pk = binomialPMF(k,n,p)\n  sumP = sumP + pk\n  print(k, pk)\nprint(\"sum\", sumP)",
    "poisson_table":"# ポアソン分布表\nlambda = 4\nsumP = 0\nfor k = 0 to 15:\n  pk = poissonPMF(k,lambda)\n  sumP = sumP + pk\n  print(k, pk)\nprint(\"partial\", sumP)",
    "engineering_sweep":"# 工学パラメータ掃引\nrho = 1.225\nCd = 0.32\nA = 2.2\nm = 1500\nfor v = 0 to 60:\n  if v == 30:\n    print(\"q\", dynamicPressure(rho,v))\n    print(\"drag\", dragForce(rho,v,Cd,A))\n    print(\"KE\", kineticEnergy(m,v))\nplot(v, dynamicPressure(rho,v), dragForce(rho,v,Cd,A), 0, 60)",
    "buckling_sweep":"# 座屈荷重スイープ\nE = 200000000000\nI2 = 0.000001\nK = 1\nfor L = 1 to 10:\n  Pcr = eulerBuckling(E,I2,K,L)\n  print(L,Pcr)\nplot(L, eulerBuckling(E,I2,K,L), 1, 10)",
    "fluid_sweep":"# 流体パラメータ掃引\nrho = 1.225\nmu = 0.0000181\nL = 1\nCd = 0.5\nA = 0.2\nfor v = 1 to 50:\n  if v == 10:\n    print(\"Re\", reynolds(rho,v,L,mu))\n    print(\"Fd\", dragForce(rho,v,Cd,A))\nplot(v, reynolds(rho,v,L,mu), 1, 50)",
    "multi_graph_demo":"# 複数グラフ総合デモ\nplot(x, sin(x), cos(x), tan(x), -180, 180)\nplot(x, x^2, x^3/10, -10, 10)\nplot(x, exp(x), exp(-x), -3, 3)\nprint(\"結果タブで確認\")",
    "numerical_methods":"# 数値解析まとめ\nprint(\"diff\", diff(\"x^3\", \"x\", 2))\nprint(\"diff2\", diff2(\"x^3\", \"x\", 2))\nprint(\"integral\", integral(\"x^2\", \"x\", 0, 3))\nprint(\"solve\", solve(\"x^2-2\", \"x\", 0, 2))\nprint(\"limit\", limit(\"sin(x)/x\", \"x\", 0))\nprint(\"series\", maclaurin(\"exp(x)\", \"x\", 8))",
    "control_flow_full":"# 制御構文フルデモ\ndef square(x):\n  return x^2\n\nsum = 0\nfor i = 1 to 20:\n  if i == 5:\n    continue\n  elif i > 12:\n    break\n  else:\n    sum = sum + square(i)\nprint(\"sum\", sum)\n\nn = 0\nwhile n < 5:\n  print(\"while\", n)\n  n = n + 1"
  };

const definitions=[
  {
    "key": "quadratic",
    "label": "解の公式",
    "category": "数学・解析",
    "level": "初級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "calculus",
    "label": "微積分・求根",
    "category": "数学・解析",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "statistics",
    "label": "総和・総積・組合せ",
    "category": "数学・解析",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "plot",
    "label": "グラフ",
    "category": "数学・解析",
    "level": "初級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "projectile",
    "label": "放物線運動",
    "category": "力学",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "freefall",
    "label": "自由落下",
    "category": "力学",
    "level": "初級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "energy",
    "label": "運動量・エネルギー",
    "category": "力学",
    "level": "初級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "bernoulli",
    "label": "Bernoulliの定理",
    "category": "流体工学",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "reynolds",
    "label": "Reynolds数",
    "category": "流体工学",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "continuity",
    "label": "連続の式",
    "category": "流体工学",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "drag",
    "label": "動圧・抗力",
    "category": "流体工学",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "idealgas",
    "label": "理想気体",
    "category": "熱・気体・電気",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "ohm",
    "label": "オーム則・電力",
    "category": "熱・気体・電気",
    "level": "初級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "heat",
    "label": "熱伝導",
    "category": "熱・気体・電気",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "strength",
    "label": "応力・ひずみ・Euler座屈",
    "category": "材料・構造",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "constants",
    "label": "主要物理定数",
    "category": "定数",
    "level": "初級",
    "test": {
      "type": "syntax",
      "required": true
    }
  }
,
  {
    "key": "symbolic_lab",
    "label": "記号計算ラボ",
    "category": "代数・記号計算",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "complex_lab",
    "label": "複素数・多項式根",
    "category": "代数・記号計算",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "series_compare",
    "label": "級数展開まとめ",
    "category": "数学・解析",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "projectile_sweep",
    "label": "投射角スイープ",
    "category": "力学",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "orbit_escape",
    "label": "軌道・脱出速度",
    "category": "力学",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "rc_response",
    "label": "RC回路応答",
    "category": "熱・気体・電気",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "rlc_frequency",
    "label": "RLC周波数解析",
    "category": "熱・気体・電気",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "statistics_report",
    "label": "統計レポート",
    "category": "統計・確率",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "normal_distribution",
    "label": "正規分布",
    "category": "統計・確率",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "binomial_table",
    "label": "二項分布表",
    "category": "統計・確率",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "poisson_table",
    "label": "ポアソン分布表",
    "category": "統計・確率",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "engineering_sweep",
    "label": "工学パラメータ掃引",
    "category": "工学総合",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "buckling_sweep",
    "label": "座屈荷重スイープ",
    "category": "材料・構造",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "fluid_sweep",
    "label": "流体パラメータ掃引",
    "category": "流体工学",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "multi_graph_demo",
    "label": "複数グラフ総合デモ",
    "category": "数学・解析",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "numerical_methods",
    "label": "数値解析まとめ",
    "category": "数学・解析",
    "level": "中級",
    "test": {
      "type": "syntax",
      "required": true
    }
  },
  {
    "key": "control_flow_full",
    "label": "制御構文フルデモ",
    "category": "コード言語",
    "level": "上級",
    "test": {
      "type": "syntax",
      "required": true
    }
  }];
function get(key){return map[key]??null}
function byCategory(category){return definitions.filter(x=>x.category===category)}
global.MFDCOTemplates={
  version:"3.8.2",map,definitions,get,byCategory,
  missingTests:()=>definitions.filter(x=>!x.test),
  testCoverage:()=>definitions.length?definitions.filter(x=>x.test).length/definitions.length:1
};
})(typeof window!=="undefined"?window:globalThis);
