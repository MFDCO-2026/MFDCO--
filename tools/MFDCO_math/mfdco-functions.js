/* MFDCO Tools v2.0
 * Single source of truth for constants, public math/engineering functions,
 * candidate metadata, and Wiki reference data.
 */
(function(global){
"use strict";

const CONSTANT_DEFINITIONS = [
  {
    "name": "pi",
    "label": "円周率 π",
    "value": "Math.PI",
    "display": "3.1415926535…",
    "category": "数学"
  },
  {
    "name": "e",
    "label": "ネイピア数 e",
    "value": "Math.E",
    "display": "2.7182818284…",
    "category": "数学"
  },
  {
    "name": "phi",
    "label": "黄金比 φ",
    "value": "(1+Math.sqrt(5))/2",
    "display": "約1.6180339887",
    "category": "数学"
  },
  {
    "name": "g0",
    "label": "標準重力加速度",
    "value": "9.80665",
    "display": "9.80665 m/s²",
    "category": "物理"
  },
  {
    "name": "c0",
    "label": "真空中の光速度",
    "value": "299792458",
    "display": "299792458 m/s",
    "category": "物理"
  },
  {
    "name": "G",
    "label": "万有引力定数",
    "value": "6.67430e-11",
    "display": "6.67430×10⁻¹¹",
    "category": "物理"
  },
  {
    "name": "h",
    "label": "Planck定数",
    "value": "6.62607015e-34",
    "display": "6.62607015×10⁻³⁴ J·s",
    "category": "物理"
  },
  {
    "name": "hbar",
    "label": "換算Planck定数",
    "value": "1.054571817e-34",
    "display": "約1.05457×10⁻³⁴ J·s",
    "category": "物理"
  },
  {
    "name": "kB",
    "label": "Boltzmann定数",
    "value": "1.380649e-23",
    "display": "1.380649×10⁻²³ J/K",
    "category": "物理"
  },
  {
    "name": "NA",
    "label": "Avogadro定数",
    "value": "6.02214076e23",
    "display": "6.02214076×10²³ mol⁻¹",
    "category": "物理"
  },
  {
    "name": "Rgas",
    "label": "モル気体定数",
    "value": "8.31446261815324",
    "display": "8.314462618… J/(mol·K)",
    "category": "物理"
  },
  {
    "name": "qe",
    "label": "電気素量",
    "value": "1.602176634e-19",
    "display": "1.602176634×10⁻¹⁹ C",
    "category": "物理"
  },
  {
    "name": "me",
    "label": "電子質量",
    "value": "9.1093837139e-31",
    "display": "9.1093837139×10⁻³¹ kg",
    "category": "物理"
  },
  {
    "name": "mp",
    "label": "陽子質量",
    "value": "1.67262192595e-27",
    "display": "1.67262192595×10⁻²⁷ kg",
    "category": "物理"
  },
  {
    "name": "eps0",
    "label": "真空の誘電率",
    "value": "8.8541878128e-12",
    "display": "約8.85419×10⁻¹² F/m",
    "category": "物理"
  },
  {
    "name": "mu0",
    "label": "真空の透磁率",
    "value": "1.25663706212e-6",
    "display": "約1.25664×10⁻⁶ H/m",
    "category": "物理"
  },
  {
    "name": "sigmaSB",
    "label": "Stefan–Boltzmann定数",
    "value": "5.670374419e-8",
    "display": "約5.67037×10⁻⁸",
    "category": "物理"
  },
  {
    "name": "atm",
    "label": "標準大気圧",
    "value": "101325",
    "display": "101325 Pa",
    "category": "工学"
  },
  {
    "name": "rho_water",
    "label": "水の密度（基準）",
    "value": "1000",
    "display": "1000 kg/m³",
    "category": "工学"
  },
  {
    "name": "MC_TICK",
    "label": "Minecraft tick基準",
    "value": "20",
    "display": "20 tick/s",
    "category": "Minecraft"
  },
  {
    "name": "MCg",
    "label": "MFDCO用予約定数",
    "value": "0",
    "display": "現在値 0",
    "category": "Minecraft"
  }
];
const FUNCTION_DEFINITIONS = [
  {
    "name": "sqrt",
    "category": "基本数学",
    "syntax": "sqrt(x)",
    "description": "平方根",
    "args": "x ≥ 0",
    "returns": "数値",
    "example": "sqrt(25)  →  5",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "sqrt()",
    "test": {
      "expression": "sqrt(25)",
      "expected": 5,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "cbrt",
    "category": "基本数学",
    "syntax": "cbrt(x)",
    "description": "立方根",
    "args": "x",
    "returns": "数値",
    "example": "cbrt(27)  →  3",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "cbrt()",
    "test": {
      "expression": "cbrt(27)",
      "expected": 3,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "abs",
    "category": "基本数学",
    "syntax": "abs(x)",
    "description": "絶対値",
    "args": "x",
    "returns": "数値",
    "example": "abs(-8)  →  8",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "abs()",
    "test": {
      "expression": "abs(-8)",
      "expected": 8,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "floor",
    "category": "基本数学",
    "syntax": "floor(x)",
    "description": "小数点以下を切り下げ",
    "args": "x",
    "returns": "整数",
    "example": "floor(3.9)  →  3",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "floor()",
    "test": {
      "expression": "floor(3.9)",
      "expected": 3,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "ceil",
    "category": "基本数学",
    "syntax": "ceil(x)",
    "description": "小数点以下を切り上げ",
    "args": "x",
    "returns": "整数",
    "example": "ceil(3.1)  →  4",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "ceil()",
    "test": {
      "expression": "ceil(3.1)",
      "expected": 4,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "round",
    "category": "基本数学",
    "syntax": "round(x)",
    "description": "最も近い整数へ丸める",
    "args": "x",
    "returns": "整数",
    "example": "round(3.6)  →  4",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "round()",
    "test": {
      "expression": "round(3.6)",
      "expected": 4,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "trunc",
    "category": "基本数学",
    "syntax": "trunc(x)",
    "description": "小数部分を切り捨てる",
    "args": "x",
    "returns": "整数",
    "example": "trunc(-3.8)  →  -3",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "trunc()",
    "test": {
      "expression": "trunc(-3.8)",
      "expected": -3,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "min",
    "category": "基本数学",
    "syntax": "min(a,b,...)",
    "description": "最小値",
    "args": "複数の数値",
    "returns": "数値",
    "example": "min(8,3,5)  →  3",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "min()",
    "test": {
      "expression": "min(8,3,5)",
      "expected": 3,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "max",
    "category": "基本数学",
    "syntax": "max(a,b,...)",
    "description": "最大値",
    "args": "複数の数値",
    "returns": "数値",
    "example": "max(8,3,5)  →  8",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "max()",
    "test": {
      "expression": "max(8,3,5)",
      "expected": 8,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "hypot",
    "category": "基本数学",
    "syntax": "hypot(a,b,...)",
    "description": "平方和の平方根",
    "args": "複数の数値",
    "returns": "数値",
    "example": "hypot(3,4)  →  5",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "hypot()",
    "test": {
      "expression": "hypot(3,4)",
      "expected": 5,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "sign",
    "category": "基本数学",
    "syntax": "sign(x)",
    "description": "符号を -1 / 0 / 1 で返す",
    "args": "x",
    "returns": "-1 / 0 / 1",
    "example": "sign(-12)  →  -1",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "sign()",
    "test": {
      "expression": "sign(-12)",
      "expected": -1,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "clamp",
    "category": "基本数学",
    "syntax": "clamp(x,min,max)",
    "description": "値を指定範囲内に制限",
    "args": "値, 下限, 上限",
    "returns": "数値",
    "example": "clamp(15,0,10)  →  10",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "clamp()",
    "test": {
      "expression": "clamp(15,0,10)",
      "expected": 10,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "factorial",
    "category": "基本数学",
    "syntax": "factorial(n)",
    "description": "階乗 n!",
    "args": "0以上の整数",
    "returns": "数値",
    "example": "factorial(5)  →  120",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "factorial()",
    "test": {
      "expression": "factorial(5)",
      "expected": 120,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "nCr",
    "category": "基本数学",
    "syntax": "nCr(n,r)",
    "description": "組合せ",
    "args": "n, r",
    "returns": "数値",
    "example": "nCr(5,2)  →  10",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "nCr()",
    "test": {
      "expression": "nCr(5,2)",
      "expected": 10,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "nPr",
    "category": "基本数学",
    "syntax": "nPr(n,r)",
    "description": "順列",
    "args": "n, r",
    "returns": "数値",
    "example": "nPr(5,2)  →  20",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "nPr()",
    "test": {
      "expression": "nPr(5,2)",
      "expected": 20,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "gcd",
    "category": "基本数学",
    "syntax": "gcd(a,b)",
    "description": "最大公約数",
    "args": "整数a, 整数b",
    "returns": "整数",
    "example": "gcd(24,18)  →  6",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "gcd()",
    "test": {
      "expression": "gcd(24,18)",
      "expected": 6,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "lcm",
    "category": "基本数学",
    "syntax": "lcm(a,b)",
    "description": "最小公倍数",
    "args": "整数a, 整数b",
    "returns": "整数",
    "example": "lcm(6,8)  →  24",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "lcm()",
    "test": {
      "expression": "lcm(6,8)",
      "expected": 24,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "isfinite",
    "category": "基本数学",
    "syntax": "isfinite(x)",
    "description": "有限数かを判定",
    "args": "x",
    "returns": "真偽値",
    "example": "isfinite(10)",
    "level": "上級",
    "candidateGroups": [
      "論理・判定"
    ],
    "insert": "isfinite()",
    "test": {
      "expression": "isfinite(10)",
      "expected": true,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "boolean"
    }
  },
  {
    "name": "isnan",
    "category": "基本数学",
    "syntax": "isnan(x)",
    "description": "NaNかを判定",
    "args": "x",
    "returns": "真偽値",
    "example": "isnan(x)",
    "level": "上級",
    "candidateGroups": [
      "論理・判定"
    ],
    "insert": "isnan()",
    "test": {
      "expression": "isnan(NaN)",
      "expected": true,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "boolean"
    }
  },
  {
    "name": "sin",
    "category": "三角・双曲線",
    "syntax": "sin(x)",
    "description": "正弦",
    "args": "角度 x",
    "returns": "数値",
    "example": "sin(30)  →  0.5（DEG時）",
    "level": "初級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "sin()",
    "test": {
      "expression": "sin(30)",
      "expected": 0.5,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "cos",
    "category": "三角・双曲線",
    "syntax": "cos(x)",
    "description": "余弦",
    "args": "角度 x",
    "returns": "数値",
    "example": "cos(60)  →  0.5（DEG時）",
    "level": "初級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "cos()",
    "test": {
      "expression": "cos(60)",
      "expected": 0.5,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "tan",
    "category": "三角・双曲線",
    "syntax": "tan(x)",
    "description": "正接",
    "args": "角度 x",
    "returns": "数値",
    "example": "tan(45)  →  1（DEG時）",
    "level": "初級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "tan()",
    "test": {
      "expression": "tan(45)",
      "expected": 1,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "asin",
    "category": "三角・双曲線",
    "syntax": "asin(x)",
    "description": "逆正弦",
    "args": "-1～1",
    "returns": "角度",
    "example": "asin(0.5)  →  30（DEG時）",
    "level": "中級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "asin()",
    "test": {
      "expression": "asin(0.5)",
      "expected": 30,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "acos",
    "category": "三角・双曲線",
    "syntax": "acos(x)",
    "description": "逆余弦",
    "args": "-1～1",
    "returns": "角度",
    "example": "acos(0.5)  →  60（DEG時）",
    "level": "中級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "acos()",
    "test": {
      "expression": "acos(0.5)",
      "expected": 60,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "atan",
    "category": "三角・双曲線",
    "syntax": "atan(x)",
    "description": "逆正接",
    "args": "x",
    "returns": "角度",
    "example": "atan(1)  →  45（DEG時）",
    "level": "中級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "atan()",
    "test": {
      "expression": "atan(1)",
      "expected": 45,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "sinh",
    "category": "三角・双曲線",
    "syntax": "sinh(x)",
    "description": "双曲線正弦",
    "args": "x",
    "returns": "数値",
    "example": "sinh(1)",
    "level": "中級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "sinh()",
    "test": {
      "expression": "sinh(1)",
      "expected": 1.1752011936438014,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "cosh",
    "category": "三角・双曲線",
    "syntax": "cosh(x)",
    "description": "双曲線余弦",
    "args": "x",
    "returns": "数値",
    "example": "cosh(1)",
    "level": "中級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "cosh()",
    "test": {
      "expression": "cosh(1)",
      "expected": 1.5430806348152437,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "tanh",
    "category": "三角・双曲線",
    "syntax": "tanh(x)",
    "description": "双曲線正接",
    "args": "x",
    "returns": "数値",
    "example": "tanh(1)",
    "level": "中級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "tanh()",
    "test": {
      "expression": "tanh(1)",
      "expected": 0.7615941559557649,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "asinh",
    "category": "三角・双曲線",
    "syntax": "asinh(x)",
    "description": "逆双曲線正弦",
    "args": "x",
    "returns": "数値",
    "example": "asinh(1)",
    "level": "上級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "asinh()",
    "test": {
      "expression": "asinh(1)",
      "expected": 0.881373587019543,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "acosh",
    "category": "三角・双曲線",
    "syntax": "acosh(x)",
    "description": "逆双曲線余弦",
    "args": "x ≥ 1",
    "returns": "数値",
    "example": "acosh(2)",
    "level": "上級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "acosh()",
    "test": {
      "expression": "acosh(2)",
      "expected": 1.3169578969248166,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "atanh",
    "category": "三角・双曲線",
    "syntax": "atanh(x)",
    "description": "逆双曲線正接",
    "args": "-1 < x < 1",
    "returns": "数値",
    "example": "atanh(0.5)",
    "level": "上級",
    "candidateGroups": [
      "三角関数",
      "数学関数"
    ],
    "insert": "atanh()",
    "test": {
      "expression": "atanh(0.5)",
      "expected": 0.5493061443340548,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "ln",
    "category": "指数・対数",
    "syntax": "ln(x) / log(x)",
    "description": "自然対数",
    "args": "x > 0",
    "returns": "数値",
    "example": "ln(e)  →  1",
    "level": "初級",
    "candidateGroups": [
      "対数・指数",
      "数学関数"
    ],
    "insert": "ln()",
    "test": {
      "expression": "ln(e)",
      "expected": 1,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "log10",
    "category": "指数・対数",
    "syntax": "log10(x)",
    "description": "常用対数",
    "args": "x > 0",
    "returns": "数値",
    "example": "log10(1000)  →  3",
    "level": "初級",
    "candidateGroups": [
      "対数・指数",
      "数学関数"
    ],
    "insert": "log10()",
    "test": {
      "expression": "log10(1000)",
      "expected": 3,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "log2",
    "category": "指数・対数",
    "syntax": "log2(x)",
    "description": "底2の対数",
    "args": "x > 0",
    "returns": "数値",
    "example": "log2(8)  →  3",
    "level": "中級",
    "candidateGroups": [
      "対数・指数",
      "数学関数"
    ],
    "insert": "log2()",
    "test": {
      "expression": "log2(8)",
      "expected": 3,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "exp",
    "category": "指数・対数",
    "syntax": "exp(x)",
    "description": "e の x 乗",
    "args": "x",
    "returns": "数値",
    "example": "exp(1)  →  e",
    "level": "初級",
    "candidateGroups": [
      "対数・指数",
      "数学関数"
    ],
    "insert": "exp()",
    "test": {
      "expression": "exp(1)",
      "expected": 2.718281828459045,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "pow",
    "category": "指数・対数",
    "syntax": "pow(a,b)",
    "description": "a の b 乗",
    "args": "a, b",
    "returns": "数値",
    "example": "pow(2,10)  →  1024",
    "level": "初級",
    "candidateGroups": [
      "対数・指数",
      "数学関数"
    ],
    "insert": "pow()",
    "test": {
      "expression": "pow(2,10)",
      "expected": 1024,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "diff",
    "category": "微積分・数値解析",
    "syntax": "diff(\"式\",\"変数\",x)",
    "description": "数値微分（1階）",
    "args": "式文字列, 変数名, 評価点",
    "returns": "数値",
    "example": "diff(\"x^2\",\"x\",3)  →  約6",
    "level": "中級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "diff(\"x^2\", \"x\", 1)",
    "test": {
      "expression": "diff(\"x^2\",\"x\",3)",
      "expected": 6,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "diff2",
    "category": "微積分・数値解析",
    "syntax": "diff2(\"式\",\"変数\",x)",
    "description": "数値微分（2階）",
    "args": "式文字列, 変数名, 評価点",
    "returns": "数値",
    "example": "diff2(\"x^3\",\"x\",2)  →  約12",
    "level": "上級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "diff2(\"x^3\", \"x\", 1)",
    "test": {
      "expression": "diff2(\"x^3\",\"x\",2)",
      "expected": 12,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "integral",
    "category": "微積分・数値解析",
    "syntax": "integral(\"式\",\"変数\",a,b)",
    "description": "定積分（Simpson法）",
    "args": "式, 変数, 下限, 上限",
    "returns": "数値",
    "example": "integral(\"sin(x)\",\"x\",0,pi)",
    "level": "中級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "integral(\"sin(x)\", \"x\", 0, pi)",
    "test": {
      "expression": "integral(\"x\",\"x\",0,1)",
      "expected": 0.5,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "solve",
    "category": "微積分・数値解析",
    "syntax": "solve(\"式\",\"変数\",a,b)",
    "description": "区間内の根を数値的に求める",
    "args": "式, 変数, 左端, 右端",
    "returns": "数値",
    "example": "solve(\"x^2-2\",\"x\",0,2)",
    "level": "上級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "solve(\"x^2 - 2\", \"x\", 0, 2)",
    "test": {
      "expression": "solve(\"x^2-2\",\"x\",0,2)",
      "expected": 1.4142135623730951,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "sum",
    "category": "微積分・数値解析",
    "syntax": "sum(\"式\",\"変数\",a,b)",
    "description": "総和",
    "args": "式, 変数, 開始, 終了",
    "returns": "数値",
    "example": "sum(\"i^2\",\"i\",1,10)  →  385",
    "level": "中級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "sum(\"i^2\", \"i\", 1, 10)",
    "test": {
      "expression": "sum(\"i^2\",\"i\",1,10)",
      "expected": 385,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "product",
    "category": "微積分・数値解析",
    "syntax": "product(\"式\",\"変数\",a,b)",
    "description": "総積",
    "args": "式, 変数, 開始, 終了",
    "returns": "数値",
    "example": "product(\"i\",\"i\",1,5)  →  120",
    "level": "中級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "product(\"i\", \"i\", 1, 5)",
    "test": {
      "expression": "product(\"i\",\"i\",1,5)",
      "expected": 120,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "kineticEnergy",
    "category": "力学",
    "syntax": "kineticEnergy(m,v)",
    "description": "運動エネルギー ½mv²",
    "args": "質量m, 速度v",
    "returns": "J",
    "example": "kineticEnergy(2,10)  →  100",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "力学"
    ],
    "insert": "kineticEnergy()",
    "test": {
      "expression": "kineticEnergy(2,10)",
      "expected": 100,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "momentum",
    "category": "力学",
    "syntax": "momentum(m,v)",
    "description": "運動量 mv",
    "args": "質量m, 速度v",
    "returns": "kg·m/s",
    "example": "momentum(2,10)  →  20",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "力学"
    ],
    "insert": "momentum()",
    "test": {
      "expression": "momentum(2,10)",
      "expected": 20,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "force",
    "category": "力学",
    "syntax": "force(m,a)",
    "description": "力 F=ma",
    "args": "質量m, 加速度a",
    "returns": "N",
    "example": "force(5,9.8)",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "力学"
    ],
    "insert": "force()",
    "test": {
      "expression": "force(5,2)",
      "expected": 10,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "torque",
    "category": "力学",
    "syntax": "torque(F,r)",
    "description": "トルク τ=Fr",
    "args": "力F, 腕長r",
    "returns": "N·m",
    "example": "torque(100,0.5)",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "力学"
    ],
    "insert": "torque()",
    "test": {
      "expression": "torque(100,0.5)",
      "expected": 50,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "work",
    "category": "力学",
    "syntax": "work(F,s)",
    "description": "仕事 W=Fs",
    "args": "力F, 距離s",
    "returns": "J",
    "example": "work(20,4)",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "力学"
    ],
    "insert": "work()",
    "test": {
      "expression": "work(20,4)",
      "expected": 80,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "power",
    "category": "力学",
    "syntax": "power(W,t)",
    "description": "仕事率 P=W/t",
    "args": "仕事W, 時間t",
    "returns": "W",
    "example": "power(1000,5)",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "力学"
    ],
    "insert": "power()",
    "test": {
      "expression": "power(1000,5)",
      "expected": 200,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "efficiency",
    "category": "力学",
    "syntax": "efficiency(out,input)",
    "description": "効率 out/input",
    "args": "出力, 入力",
    "returns": "比率",
    "example": "efficiency(80,100)  →  0.8",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "力学"
    ],
    "insert": "efficiency()",
    "test": {
      "expression": "efficiency(80,100)",
      "expected": 0.8,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "hydrostaticP",
    "category": "流体",
    "syntax": "hydrostaticP(rho,g,h)",
    "description": "静水圧 ρgh",
    "args": "密度ρ, 重力g, 深さh",
    "returns": "Pa",
    "example": "hydrostaticP(1000,g0,10)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "流体"
    ],
    "insert": "hydrostaticP()",
    "test": {
      "expression": "hydrostaticP(1000,10,0,g0)",
      "expected": 98066.5,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "dynamicPressure",
    "category": "流体",
    "syntax": "dynamicPressure(rho,v)",
    "description": "動圧 ½ρv²",
    "args": "密度ρ, 速度v",
    "returns": "Pa",
    "example": "dynamicPressure(1.225,100)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "流体"
    ],
    "insert": "dynamicPressure()",
    "test": {
      "expression": "dynamicPressure(1.2,10)",
      "expected": 60,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "reynolds",
    "category": "流体",
    "syntax": "reynolds(rho,v,L,mu)",
    "description": "レイノルズ数",
    "args": "密度, 速度, 代表長さ, 粘度",
    "returns": "無次元",
    "example": "reynolds(1.225,10,1,1.81e-5)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "流体"
    ],
    "insert": "reynolds()",
    "test": {
      "expression": "reynolds(1,2,3,0.5)",
      "expected": 12,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "mach",
    "category": "流体",
    "syntax": "mach(v,a)",
    "description": "マッハ数 v/a",
    "args": "速度v, 音速a",
    "returns": "無次元",
    "example": "mach(340,340)  →  1",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "流体"
    ],
    "insert": "mach()",
    "test": {
      "expression": "mach(340,340)",
      "expected": 1,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "continuityV2",
    "category": "流体",
    "syntax": "continuityV2(A1,v1,A2)",
    "description": "連続の式から v₂",
    "args": "A₁, v₁, A₂",
    "returns": "速度",
    "example": "continuityV2(2,3,1)  →  6",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "流体"
    ],
    "insert": "continuityV2()",
    "test": {
      "expression": "continuityV2(2,3,1)",
      "expected": 6,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "bernoulliHead",
    "category": "流体",
    "syntax": "bernoulliHead(p,rho,v,z,g)",
    "description": "ベルヌーイの全水頭",
    "args": "圧力, 密度, 速度, 高さ, 重力",
    "returns": "m",
    "example": "bernoulliHead(p,rho,v,z)",
    "level": "上級",
    "candidateGroups": [
      "工学関数",
      "流体"
    ],
    "insert": "bernoulliHead()",
    "test": {
      "expression": "bernoulliHead(9810,1000,0,0)",
      "expected": 1.0003416049313476,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "bernoulliP2",
    "category": "流体",
    "syntax": "bernoulliP2(p1,rho,v1,z1,v2,z2,g)",
    "description": "ベルヌーイ式から P₂",
    "args": "P₁,ρ,v₁,z₁,v₂,z₂[,g]",
    "returns": "Pa",
    "example": "bernoulliP2(...)",
    "level": "上級",
    "candidateGroups": [
      "工学関数",
      "流体"
    ],
    "insert": "bernoulliP2()",
    "test": {
      "expression": "bernoulliP2(100000,1,10,0,0,0)",
      "expected": 100050,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "dragForce",
    "category": "流体",
    "syntax": "dragForce(rho,v,Cd,A)",
    "description": "抗力 ½ρv²CdA",
    "args": "密度, 速度, 抗力係数, 面積",
    "returns": "N",
    "example": "dragForce(1.225,50,0.3,2)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "流体"
    ],
    "insert": "dragForce()",
    "test": {
      "expression": "dragForce(1,10,1,2)",
      "expected": 100,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "liftForce",
    "category": "流体",
    "syntax": "liftForce(rho,v,Cl,A)",
    "description": "揚力 ½ρv²ClA",
    "args": "密度, 速度, 揚力係数, 面積",
    "returns": "N",
    "example": "liftForce(1.225,50,1.0,2)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "流体"
    ],
    "insert": "liftForce()",
    "test": {
      "expression": "liftForce(1,10,1,2)",
      "expected": 100,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "idealGasP",
    "category": "熱・気体",
    "syntax": "idealGasP(n,T,V,R)",
    "description": "理想気体の圧力 P=nRT/V",
    "args": "物質量, 温度, 体積[,R]",
    "returns": "Pa",
    "example": "idealGasP(1,300,0.024)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "熱・気体"
    ],
    "insert": "idealGasP()",
    "test": {
      "expression": "idealGasP(1,300,1)",
      "expected": 2494.338785445972,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "idealGasV",
    "category": "熱・気体",
    "syntax": "idealGasV(n,T,P,R)",
    "description": "理想気体の体積 V=nRT/P",
    "args": "物質量, 温度, 圧力[,R]",
    "returns": "m³",
    "example": "idealGasV(1,300,101325)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "熱・気体"
    ],
    "insert": "idealGasV()",
    "test": {
      "expression": "idealGasV(1,300,100000)",
      "expected": 0.02494338785445972,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "ohmV",
    "category": "電気",
    "syntax": "ohmV(I,R)",
    "description": "オームの法則 V=IR",
    "args": "電流, 抵抗",
    "returns": "V",
    "example": "ohmV(2,5)  →  10",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "電気"
    ],
    "insert": "ohmV()",
    "test": {
      "expression": "ohmV(2,5)",
      "expected": 10,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "ohmI",
    "category": "電気",
    "syntax": "ohmI(V,R)",
    "description": "オームの法則 I=V/R",
    "args": "電圧, 抵抗",
    "returns": "A",
    "example": "ohmI(12,6)  →  2",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "電気"
    ],
    "insert": "ohmI()",
    "test": {
      "expression": "ohmI(12,6)",
      "expected": 2,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "ohmR",
    "category": "電気",
    "syntax": "ohmR(V,I)",
    "description": "オームの法則 R=V/I",
    "args": "電圧, 電流",
    "returns": "Ω",
    "example": "ohmR(12,2)  →  6",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "電気"
    ],
    "insert": "ohmR()",
    "test": {
      "expression": "ohmR(12,2)",
      "expected": 6,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "electricPower",
    "category": "電気",
    "syntax": "electricPower(V,I)",
    "description": "電力 P=VI",
    "args": "電圧, 電流",
    "returns": "W",
    "example": "electricPower(12,2)  →  24",
    "level": "初級",
    "candidateGroups": [
      "工学関数",
      "電気"
    ],
    "insert": "electricPower()",
    "test": {
      "expression": "electricPower(12,2)",
      "expected": 24,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "stress",
    "category": "材料",
    "syntax": "stress(F,A)",
    "description": "応力 σ=F/A",
    "args": "力, 面積",
    "returns": "Pa",
    "example": "stress(10000,0.002)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "材料"
    ],
    "insert": "stress()",
    "test": {
      "expression": "stress(100,2)",
      "expected": 50,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "strain",
    "category": "材料",
    "syntax": "strain(dL,L)",
    "description": "ひずみ ε=ΔL/L",
    "args": "伸び, 元長さ",
    "returns": "無次元",
    "example": "strain(0.001,1)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "材料"
    ],
    "insert": "strain()",
    "test": {
      "expression": "strain(1,1000)",
      "expected": 0.001,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "hookeStress",
    "category": "材料",
    "syntax": "hookeStress(E,eps)",
    "description": "フック則 σ=Eε",
    "args": "ヤング率, ひずみ",
    "returns": "Pa",
    "example": "hookeStress(200e9,0.001)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "材料"
    ],
    "insert": "hookeStress()",
    "test": {
      "expression": "hookeStress(200,0.01)",
      "expected": 2,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "eulerBuckling",
    "category": "材料",
    "syntax": "eulerBuckling(E,I,K,L)",
    "description": "Euler座屈荷重",
    "args": "E,断面二次M,I,係数K,長さL",
    "returns": "N",
    "example": "eulerBuckling(E,I,K,L)",
    "level": "上級",
    "candidateGroups": [
      "工学関数",
      "材料"
    ],
    "insert": "eulerBuckling()",
    "test": {
      "expression": "eulerBuckling(1,1,1,1)",
      "expected": 9.869604401089358,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "heatConduction",
    "category": "熱",
    "syntax": "heatConduction(k,A,dT,L)",
    "description": "定常熱伝導 Q̇=kAΔT/L",
    "args": "熱伝導率, 面積, 温度差, 厚さ",
    "returns": "W",
    "example": "heatConduction(50,0.1,30,0.01)",
    "level": "中級",
    "candidateGroups": [
      "工学関数",
      "熱"
    ],
    "insert": "heatConduction()",
    "test": {
      "expression": "heatConduction(50,0.1,30,0.01)",
      "expected": 15000,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "log",
    "category": "指数・対数",
    "syntax": "log(x)",
    "description": "自然対数（ln の別名）",
    "args": "x > 0",
    "returns": "数値",
    "example": "log(e)  →  1",
    "level": "初級",
    "candidateGroups": [
      "対数・指数",
      "数学関数"
    ],
    "insert": "log()",
    "test": {
      "expression": "log(e)",
      "expected": 1,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "rad",
    "category": "角度変換",
    "syntax": "rad(x)",
    "description": "度をラジアンへ変換",
    "args": "角度 x（度）",
    "returns": "rad",
    "example": "rad(180)  →  pi",
    "level": "中級",
    "candidateGroups": [
      "数学関数",
      "その他"
    ],
    "insert": "rad()",
    "test": {
      "expression": "rad(180)",
      "expected": 3.141592653589793,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "deg",
    "category": "角度変換",
    "syntax": "deg(x)",
    "description": "ラジアンを度へ変換",
    "args": "角度 x（rad）",
    "returns": "度",
    "example": "deg(pi)  →  180",
    "level": "中級",
    "candidateGroups": [
      "数学関数",
      "その他"
    ],
    "insert": "deg()",
    "test": {
      "expression": "deg(pi)",
      "expected": 180,
      "tolerance": 1e-06,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  }
,
  {
    "name": "vec",
    "category": "ベクトル・行列",
    "syntax": "vec(x, y, ...)",
    "description": "ベクトルを作成",
    "args": "数値",
    "returns": "ベクトル",
    "example": "vec(1,2,3) → [1,2,3]",
    "level": "中級",
    "candidateGroups": [
      "ベクトル・行列"
    ],
    "insert": "vec(1, 2, 3)",
    "test": {
      "expression": "vec(1,2,3)",
      "expected": [
        1,
        2,
        3
      ],
      "expectedType": "array",
      "angleMode": "DEG"
    }
  },
  {
    "name": "dot",
    "category": "ベクトル・行列",
    "syntax": "dot(a,b)",
    "description": "内積",
    "args": "同じ長さのベクトル",
    "returns": "数値",
    "example": "dot(vec(1,2),vec(3,4)) → 11",
    "level": "中級",
    "candidateGroups": [
      "ベクトル・行列"
    ],
    "insert": "dot(vec(1,2), vec(3,4))",
    "test": {
      "expression": "dot(vec(1,2),vec(3,4))",
      "expected": 11,
      "tolerance": 1e-09,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "cross",
    "category": "ベクトル・行列",
    "syntax": "cross(a,b)",
    "description": "3次元外積",
    "args": "3次元ベクトル",
    "returns": "ベクトル",
    "example": "cross(vec(1,0,0),vec(0,1,0))",
    "level": "中級",
    "candidateGroups": [
      "ベクトル・行列"
    ],
    "insert": "cross(vec(1,0,0), vec(0,1,0))",
    "test": {
      "expression": "cross(vec(1,0,0),vec(0,1,0))",
      "expected": [
        0,
        0,
        1
      ],
      "expectedType": "array",
      "angleMode": "DEG"
    }
  },
  {
    "name": "norm",
    "category": "ベクトル・行列",
    "syntax": "norm(v)",
    "description": "ベクトルの大きさ",
    "args": "ベクトル",
    "returns": "数値",
    "example": "norm(vec(3,4)) → 5",
    "level": "中級",
    "candidateGroups": [
      "ベクトル・行列"
    ],
    "insert": "norm(vec(3,4))",
    "test": {
      "expression": "norm(vec(3,4))",
      "expected": 5,
      "tolerance": 1e-09,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "normalize",
    "category": "ベクトル・行列",
    "syntax": "normalize(v)",
    "description": "ベクトルを正規化",
    "args": "ベクトル",
    "returns": "ベクトル",
    "example": "normalize(vec(3,4))",
    "level": "中級",
    "candidateGroups": [
      "ベクトル・行列"
    ],
    "insert": "normalize(vec(3,4))",
    "test": {
      "expression": "normalize(vec(3,4))",
      "expected": [
        0.6,
        0.8
      ],
      "expectedType": "array",
      "angleMode": "DEG",
      "tolerance": 1e-09
    }
  },
  {
    "name": "transpose",
    "category": "ベクトル・行列",
    "syntax": "transpose(A)",
    "description": "転置行列",
    "args": "行列",
    "returns": "行列",
    "example": "transpose([[1,2],[3,4]])",
    "level": "中級",
    "candidateGroups": [
      "ベクトル・行列"
    ],
    "insert": "transpose([[1,2],[3,4]])",
    "test": {
      "expression": "transpose([[1,2],[3,4]])",
      "expected": [
        [
          1,
          3
        ],
        [
          2,
          4
        ]
      ],
      "expectedType": "array",
      "angleMode": "DEG"
    }
  },
  {
    "name": "det",
    "category": "ベクトル・行列",
    "syntax": "det(A)",
    "description": "行列式",
    "args": "正方行列",
    "returns": "数値",
    "example": "det([[1,2],[3,4]]) → -2",
    "level": "中級",
    "candidateGroups": [
      "ベクトル・行列"
    ],
    "insert": "det([[1,2],[3,4]])",
    "test": {
      "expression": "det([[1,2],[3,4]])",
      "expected": -2,
      "tolerance": 1e-09,
      "angleMode": "DEG",
      "expectedType": "number"
    }
  },
  {
    "name": "matmul",
    "category": "ベクトル・行列",
    "syntax": "matmul(A,B)",
    "description": "行列積",
    "args": "行列, 行列",
    "returns": "行列",
    "example": "matmul([[1,2]],[[3],[4]])",
    "level": "中級",
    "candidateGroups": [
      "ベクトル・行列"
    ],
    "insert": "matmul([[1,2]], [[3],[4]])",
    "test": {
      "expression": "matmul([[1,2]],[[3],[4]])",
      "expected": [
        [
          11
        ]
      ],
      "expectedType": "array",
      "angleMode": "DEG"
    }
  },
  {
    "name": "solveLinear",
    "category": "ベクトル・行列",
    "syntax": "solveLinear(A,b)",
    "description": "連立一次方程式 Ax=b を解く",
    "args": "正方行列, ベクトル",
    "returns": "ベクトル",
    "example": "solveLinear([[2,1],[1,-1]],[5,1])",
    "level": "上級",
    "candidateGroups": [
      "ベクトル・行列"
    ],
    "insert": "solveLinear([[2,1],[1,-1]], [5,1])",
    "test": {
      "expression": "solveLinear([[2,1],[1,-1]],[5,1])",
      "expected": [
        2,
        1
      ],
      "expectedType": "array",
      "angleMode": "DEG",
      "tolerance": 1e-09
    }
  },
  {
    "name": "primeFactors",
    "category": "整数・式整理",
    "syntax": "primeFactors(n)",
    "description": "整数を素因数の配列へ分解",
    "args": "整数 n",
    "returns": "配列",
    "example": "primeFactors(360) → [2,2,2,3,3,5]",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "primeFactors(360)",
    "test": {
      "expression": "primeFactors(360)",
      "expected": [
        2,
        2,
        2,
        3,
        3,
        5
      ],
      "expectedType": "array",
      "angleMode": "DEG"
    }
  },
  {
    "name": "factorInteger",
    "category": "整数・式整理",
    "syntax": "factorInteger(n)",
    "description": "整数の素因数分解を式で返す",
    "args": "整数 n",
    "returns": "文字列",
    "example": "factorInteger(360) → 2^3 * 3^2 * 5",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "factorInteger(360)",
    "test": {
      "expression": "factorInteger(360)",
      "expected": "2^3 * 3^2 * 5",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "simplifyFraction",
    "category": "整数・式整理",
    "syntax": "simplifyFraction(a,b)",
    "description": "整数比 a/b を既約化",
    "args": "整数 a,b",
    "returns": "[分子,分母]",
    "example": "simplifyFraction(84,126) → [2,3]",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "simplifyFraction(84,126)",
    "test": {
      "expression": "simplifyFraction(84,126)",
      "expected": [
        2,
        3
      ],
      "expectedType": "array",
      "angleMode": "DEG"
    }
  },
  {
    "name": "expandPoly",
    "category": "代数・式変形",
    "syntax": "expandPoly(expression, variable)",
    "description": "1変数多項式を展開して降べき順に整理",
    "args": "式文字列, 変数名",
    "returns": "文字列",
    "example": "expandPoly(\"(x+1)^3\",\"x\")",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "expandPoly(\"(x+1)^3\", \"x\")",
    "test": {
      "expression": "expandPoly(\"(x+1)^3\",\"x\")",
      "expected": "x^3 + 3*x^2 + 3*x + 1",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "collectPoly",
    "category": "代数・式変形",
    "syntax": "collectPoly(expression, variable)",
    "description": "同類項をまとめて多項式を整理",
    "args": "式文字列, 変数名",
    "returns": "文字列",
    "example": "collectPoly(\"x+x^2+2*x-3\",\"x\")",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "collectPoly(\"x + x^2 + 2*x - 3\", \"x\")",
    "test": {
      "expression": "collectPoly(\"x+x^2+2*x-3\",\"x\")",
      "expected": "x^2 + 3*x - 3",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "simplifyPoly",
    "category": "代数・式変形",
    "syntax": "simplifyPoly(expression, variable)",
    "description": "多項式を標準形へ簡約",
    "args": "式文字列, 変数名",
    "returns": "文字列",
    "example": "simplifyPoly(\"2*x-x+3-1\",\"x\")",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "simplifyPoly(\"2*x - x + 3 - 1\", \"x\")",
    "test": {
      "expression": "simplifyPoly(\"2*x-x+3-1\",\"x\")",
      "expected": "x + 2",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "factorPoly",
    "category": "代数・式変形",
    "syntax": "factorPoly(expression, variable)",
    "description": "有理根を中心に多項式を因数分解",
    "args": "式文字列, 変数名",
    "returns": "文字列",
    "example": "factorPoly(\"x^2-1\",\"x\")",
    "level": "上級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "factorPoly(\"x^2 - 1\", \"x\")",
    "test": {
      "expression": "factorPoly(\"x^2-1\",\"x\")",
      "expected": "(x + 1)*(x - 1)",
      "expectedType": "stringSet",
      "accepted": [
        "(x + 1)*(x - 1)",
        "(x - 1)*(x + 1)"
      ],
      "angleMode": "DEG"
    }
  },
  {
    "name": "polyDegree",
    "category": "代数・式変形",
    "syntax": "polyDegree(expression, variable)",
    "description": "多項式の次数",
    "args": "式文字列, 変数名",
    "returns": "整数",
    "example": "polyDegree(\"3*x^4+x\",\"x\") → 4",
    "level": "初級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "polyDegree(\"3*x^4 + x\", \"x\")",
    "test": {
      "expression": "polyDegree(\"3*x^4+x\",\"x\")",
      "expected": 4,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "polyCoefficients",
    "category": "代数・式変形",
    "syntax": "polyCoefficients(expression, variable)",
    "description": "降べき順の係数配列を返す",
    "args": "式文字列, 変数名",
    "returns": "配列",
    "example": "polyCoefficients(\"2*x^2+3*x+4\",\"x\")",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "polyCoefficients(\"2*x^2 + 3*x + 4\", \"x\")",
    "test": {
      "expression": "polyCoefficients(\"2*x^2+3*x+4\",\"x\")",
      "expected": [
        2,
        3,
        4
      ],
      "expectedType": "array",
      "angleMode": "DEG"
    }
  },
  {
    "name": "polyDerivative",
    "category": "代数・式変形",
    "syntax": "polyDerivative(expression, variable)",
    "description": "多項式を記号微分",
    "args": "式文字列, 変数名",
    "returns": "文字列",
    "example": "polyDerivative(\"x^3+2*x\",\"x\")",
    "level": "中級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "polyDerivative(\"x^3 + 2*x\", \"x\")",
    "test": {
      "expression": "polyDerivative(\"x^3+2*x\",\"x\")",
      "expected": "3*x^2 + 2",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "polyIntegral",
    "category": "代数・式変形",
    "syntax": "polyIntegral(expression, variable)",
    "description": "多項式を記号積分し + C を付ける",
    "args": "式文字列, 変数名",
    "returns": "文字列",
    "example": "polyIntegral(\"3*x^2+2\",\"x\")",
    "level": "中級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "polyIntegral(\"3*x^2 + 2\", \"x\")",
    "test": {
      "expression": "polyIntegral(\"3*x^2+2\",\"x\")",
      "expected": "x^3 + 2*x + C",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "taylorCoefficients",
    "category": "級数展開",
    "syntax": "taylorCoefficients(expression, variable, center, order)",
    "description": "テイラー展開係数を配列で返す",
    "args": "式文字列, 変数名, 展開点, 次数",
    "returns": "配列",
    "example": "taylorCoefficients(\"exp(x)\",\"x\",0,4)",
    "level": "上級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "taylorCoefficients(\"exp(x)\", \"x\", 0, 6)",
    "test": {
      "expression": "taylorCoefficients(\"exp(x)\",\"x\",0,4)",
      "expected": [
        1,
        1,
        0.5,
        0.16666666666666666,
        0.041666666666666664
      ],
      "expectedType": "array",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "taylor",
    "category": "級数展開",
    "syntax": "taylor(expression, variable, center, order)",
    "description": "テイラー多項式を文字列で返す",
    "args": "式文字列, 変数名, 展開点, 次数",
    "returns": "文字列",
    "example": "taylor(\"exp(x)\",\"x\",0,4)",
    "level": "上級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "taylor(\"exp(x)\", \"x\", 0, 6)",
    "test": {
      "expression": "taylor(\"exp(x)\",\"x\",0,4)",
      "expected": "1 + x + 1/2*x^2 + 1/6*x^3 + 1/24*x^4",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "maclaurin",
    "category": "級数展開",
    "syntax": "maclaurin(expression, variable, order)",
    "description": "0まわりのマクローリン多項式",
    "args": "式文字列, 変数名, 次数",
    "returns": "文字列",
    "example": "maclaurin(\"sin(x)\",\"x\",7)",
    "level": "上級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "maclaurin(\"sin(x)\", \"x\", 7)",
    "test": {
      "expression": "maclaurin(\"sin(x)\",\"x\",7)",
      "expected": "x - 1/6*x^3 + 1/120*x^5 - 1/5040*x^7",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "complex",
    "category": "複素数",
    "syntax": "complex(re,im)",
    "description": "複素数作成",
    "args": "re,im",
    "returns": "複素数",
    "example": "complex(2,3)",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "complex(2,3)",
    "test": {
      "expression": "real(complex(2,3))",
      "expected": 2,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "real",
    "category": "複素数",
    "syntax": "real(z)",
    "description": "実部",
    "args": "z",
    "returns": "数値",
    "example": "real(complex(2,3))",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "real(complex(2,3))",
    "test": {
      "expression": "real(complex(2,3))",
      "expected": 2,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "imag",
    "category": "複素数",
    "syntax": "imag(z)",
    "description": "虚部",
    "args": "z",
    "returns": "数値",
    "example": "imag(complex(2,3))",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "imag(complex(2,3))",
    "test": {
      "expression": "imag(complex(2,3))",
      "expected": 3,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "complexAbs",
    "category": "複素数",
    "syntax": "complexAbs(z)",
    "description": "絶対値",
    "args": "z",
    "returns": "数値",
    "example": "complexAbs(complex(3,4))",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "complexAbs(complex(3,4))",
    "test": {
      "expression": "complexAbs(complex(3,4))",
      "expected": 5,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "arg",
    "category": "複素数",
    "syntax": "arg(z)",
    "description": "偏角(rad)",
    "args": "z",
    "returns": "数値",
    "example": "arg(complex(1,1))",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "arg(complex(1,1))",
    "test": {
      "expression": "arg(complex(1,1))",
      "expected": 0.7853981633974483,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "conj",
    "category": "複素数",
    "syntax": "conj(z)",
    "description": "共役",
    "args": "z",
    "returns": "複素数",
    "example": "conj(complex(2,3))",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "conj(complex(2,3))",
    "test": {
      "expression": "imag(conj(complex(2,3)))",
      "expected": -3,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "complexSqrt",
    "category": "複素数",
    "syntax": "complexSqrt(z)",
    "description": "複素平方根",
    "args": "z",
    "returns": "複素数",
    "example": "complexSqrt(complex(-1,0))",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "complexSqrt(complex(-1,0))",
    "test": {
      "expression": "imag(complexSqrt(complex(-1,0)))",
      "expected": 1,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "polyRoots",
    "category": "方程式",
    "syntax": "polyRoots(coefficients)",
    "description": "多項式の全根",
    "args": "係数配列",
    "returns": "配列",
    "example": "polyRoots([1,0,1])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "polyRoots([1,0,1])",
    "test": {
      "expression": "polyRoots([1,-3,2])",
      "expected": [
        2,
        1
      ],
      "expectedType": "arrayUnordered",
      "angleMode": "DEG"
    }
  },
  {
    "name": "solveExact",
    "category": "方程式",
    "syntax": "solveExact(equation,variable)",
    "description": "厳密解/根一覧",
    "args": "方程式,変数",
    "returns": "文字列",
    "example": "solveExact(\"x^2-5*x+6=0\",\"x\")",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "solveExact(\"x^2-5*x+6=0\",\"x\")",
    "test": {
      "expression": "solveExact(\"x^2-5*x+6=0\",\"x\")",
      "expectedContains": [
        "2",
        "3"
      ],
      "expectedType": "stringContains",
      "angleMode": "DEG"
    }
  },
  {
    "name": "solveSystem",
    "category": "方程式",
    "syntax": "solveSystem(equations,variables)",
    "description": "一次連立方程式",
    "args": "方程式配列,変数配列",
    "returns": "オブジェクト",
    "example": "solveSystem([\"2*x+y=5\",\"x-y=1\"],[\"x\",\"y\"])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "solveSystem([\"2*x+y=5\",\"x-y=1\"],[\"x\",\"y\"])",
    "test": {
      "expression": "solveSystem([\"2*x+y=5\",\"x-y=1\"],[\"x\",\"y\"]).x",
      "expected": 2,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "substitute",
    "category": "記号式",
    "syntax": "substitute(expr,var,repl)",
    "description": "置換",
    "args": "式,変数,置換",
    "returns": "文字列",
    "example": "substitute(\"x^2+x\",\"x\",\"a+b\")",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "substitute(\"x^2+x\",\"x\",\"a+b\")",
    "test": {
      "expression": "substitute(\"x^2+x\",\"x\",\"a+b\")",
      "expected": "(a+b)^2+(a+b)",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "derivative",
    "category": "記号式",
    "syntax": "derivative(expr,var)",
    "description": "一般記号微分",
    "args": "式,変数",
    "returns": "文字列",
    "example": "derivative(\"sin(x)*exp(x)\",\"x\")",
    "level": "中級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "derivative(\"sin(x)*exp(x)\",\"x\")",
    "test": {
      "expression": "derivative(\"x^3+2*x\",\"x\")",
      "expected": "3*x^2 + 2",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "partial",
    "category": "記号式",
    "syntax": "partial(expr,var)",
    "description": "偏微分",
    "args": "式,変数",
    "returns": "文字列",
    "example": "partial(\"x^2+y^2\",\"x\")",
    "level": "中級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "partial(\"x^3+2*x\",\"x\")",
    "test": {
      "expression": "partial(\"x^3+2*x\",\"x\")",
      "expected": "3*x^2 + 2",
      "expectedType": "string",
      "angleMode": "DEG"
    }
  },
  {
    "name": "limit",
    "category": "微積分・数値解析",
    "syntax": "limit(expr,var,to)",
    "description": "数値極限",
    "args": "式,変数,点",
    "returns": "数値",
    "example": "limit(\"sin(x)/x\",\"x\",0)",
    "level": "中級",
    "candidateGroups": [
      "微積分・数値解析"
    ],
    "insert": "limit(\"sin(x)/x\",\"x\",0)",
    "test": {
      "expression": "limit(\"sin(x)/x\",\"x\",0)",
      "expected": 1,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "mean",
    "category": "統計・確率",
    "syntax": "mean(...)",
    "description": "平均",
    "args": "配列/数値",
    "returns": "数値",
    "example": "mean([1,2,3,4])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "mean([1,2,3,4])",
    "test": {
      "expression": "mean([1,2,3,4])",
      "expected": 2.5,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "median",
    "category": "統計・確率",
    "syntax": "median(...)",
    "description": "中央値",
    "args": "配列/数値",
    "returns": "数値",
    "example": "median([1,2,9,10])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "median([1,2,9,10])",
    "test": {
      "expression": "median([1,2,9,10])",
      "expected": 5.5,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "variance",
    "category": "統計・確率",
    "syntax": "variance(...)",
    "description": "分散",
    "args": "配列/数値",
    "returns": "数値",
    "example": "variance([1,2,3])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "variance([1,2,3])",
    "test": {
      "expression": "variance([1,2,3])",
      "expected": 0.6666666666666666,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "stddev",
    "category": "統計・確率",
    "syntax": "stddev(...)",
    "description": "標準偏差",
    "args": "配列/数値",
    "returns": "数値",
    "example": "stddev([1,2,3])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "stddev([1,2,3])",
    "test": {
      "expression": "stddev([1,2,3])",
      "expected": 0.816496580927726,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "percentile",
    "category": "統計・確率",
    "syntax": "percentile(...)",
    "description": "パーセンタイル",
    "args": "配列/数値",
    "returns": "数値",
    "example": "percentile([0,10,20,30,40],50)",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "percentile([0,10,20,30,40],50)",
    "test": {
      "expression": "percentile([0,10,20,30,40],50)",
      "expected": 20,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "covariance",
    "category": "統計・確率",
    "syntax": "covariance(...)",
    "description": "共分散",
    "args": "配列/数値",
    "returns": "数値",
    "example": "covariance([1,2,3],[2,4,6])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "covariance([1,2,3],[2,4,6])",
    "test": {
      "expression": "covariance([1,2,3],[2,4,6])",
      "expected": 1.3333333333333333,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "correlation",
    "category": "統計・確率",
    "syntax": "correlation(...)",
    "description": "相関",
    "args": "配列/数値",
    "returns": "数値",
    "example": "correlation([1,2,3],[2,4,6])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "correlation([1,2,3],[2,4,6])",
    "test": {
      "expression": "correlation([1,2,3],[2,4,6])",
      "expected": 1,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "normalPDF",
    "category": "統計・確率",
    "syntax": "normalPDF(...)",
    "description": "正規PDF",
    "args": "配列/数値",
    "returns": "数値",
    "example": "normalPDF(0,0,1)",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "normalPDF(0,0,1)",
    "test": {
      "expression": "normalPDF(0,0,1)",
      "expected": 0.3989422804014327,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "normalCDF",
    "category": "統計・確率",
    "syntax": "normalCDF(...)",
    "description": "正規CDF",
    "args": "配列/数値",
    "returns": "数値",
    "example": "normalCDF(0,0,1)",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "normalCDF(0,0,1)",
    "test": {
      "expression": "normalCDF(0,0,1)",
      "expected": 0.5,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "binomialPMF",
    "category": "統計・確率",
    "syntax": "binomialPMF(...)",
    "description": "二項PMF",
    "args": "配列/数値",
    "returns": "数値",
    "example": "binomialPMF(2,4,.5)",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "binomialPMF(2,4,.5)",
    "test": {
      "expression": "binomialPMF(2,4,.5)",
      "expected": 0.375,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "poissonPMF",
    "category": "統計・確率",
    "syntax": "poissonPMF(...)",
    "description": "Poisson PMF",
    "args": "配列/数値",
    "returns": "数値",
    "example": "poissonPMF(2,3)",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "poissonPMF(2,3)",
    "test": {
      "expression": "poissonPMF(2,3)",
      "expected": 0.22404180765538775,
      "expectedType": "number",
      "tolerance": 1e-06,
      "angleMode": "DEG"
    }
  },
  {
    "name": "mode",
    "category": "統計・確率",
    "syntax": "mode(array)",
    "description": "最頻値",
    "args": "配列",
    "returns": "配列",
    "example": "mode([1,2,2,3])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "mode([1,2,2,3])",
    "test": {
      "expression": "mode([1,2,2,3])",
      "expected": [
        2
      ],
      "expectedType": "array",
      "angleMode": "DEG"
    }
  },
  {
    "name": "projectileRange",
    "category": "力学",
    "syntax": "projectileRange(v,a,g)",
    "description": "投射距離",
    "args": "v,a,g",
    "returns": "距離",
    "example": "projectileRange(10,pi/4,9.80665)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "projectileRange(10,pi/4,9.80665)",
    "test": {
      "expression": "projectileRange(10,pi/4,9.80665)",
      "expected": 10.197162129779283,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "projectileTime",
    "category": "力学",
    "syntax": "projectileTime(v,a,g)",
    "description": "飛翔時間",
    "args": "v,a,g",
    "returns": "時間",
    "example": "projectileTime(10,pi/4,9.80665)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "projectileTime(10,pi/4,9.80665)",
    "test": {
      "expression": "projectileTime(10,pi/4,9.80665)",
      "expected": 1.4420964981651176,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "centripetalForce",
    "category": "力学",
    "syntax": "centripetalForce(m,v,r)",
    "description": "向心力",
    "args": "m,v,r",
    "returns": "力",
    "example": "centripetalForce(2,3,4)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "centripetalForce(2,3,4)",
    "test": {
      "expression": "centripetalForce(2,3,4)",
      "expected": 4.5,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "angularVelocity",
    "category": "力学",
    "syntax": "angularVelocity(v,r)",
    "description": "角速度",
    "args": "v,r",
    "returns": "角速度",
    "example": "angularVelocity(10,2)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "angularVelocity(10,2)",
    "test": {
      "expression": "angularVelocity(10,2)",
      "expected": 5,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "angularMomentum",
    "category": "力学",
    "syntax": "angularMomentum(I,w)",
    "description": "角運動量",
    "args": "I,w",
    "returns": "角運動量",
    "example": "angularMomentum(2,3)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "angularMomentum(2,3)",
    "test": {
      "expression": "angularMomentum(2,3)",
      "expected": 6,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "impulse",
    "category": "力学",
    "syntax": "impulse(F,dt)",
    "description": "力積",
    "args": "F,dt",
    "returns": "力積",
    "example": "impulse(10,2)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "impulse(10,2)",
    "test": {
      "expression": "impulse(10,2)",
      "expected": 20,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "frictionForce",
    "category": "力学",
    "syntax": "frictionForce(mu,N)",
    "description": "摩擦力",
    "args": "mu,N",
    "returns": "力",
    "example": "frictionForce(.3,100)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "frictionForce(.3,100)",
    "test": {
      "expression": "frictionForce(.3,100)",
      "expected": 30,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "springForce",
    "category": "力学",
    "syntax": "springForce(k,x)",
    "description": "ばね力",
    "args": "k,x",
    "returns": "力",
    "example": "springForce(100,.1)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "springForce(100,.1)",
    "test": {
      "expression": "springForce(100,.1)",
      "expected": -10,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "springEnergy",
    "category": "力学",
    "syntax": "springEnergy(k,x)",
    "description": "ばねエネルギー",
    "args": "k,x",
    "returns": "J",
    "example": "springEnergy(100,.1)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "springEnergy(100,.1)",
    "test": {
      "expression": "springEnergy(100,.1)",
      "expected": 0.5,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "escapeVelocity",
    "category": "天体力学",
    "syntax": "escapeVelocity(G,M,r)",
    "description": "脱出速度",
    "args": "G,M,r",
    "returns": "速度",
    "example": "escapeVelocity(G,5.972e24,6.371e6)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "escapeVelocity(G,5.972e24,6.371e6)",
    "test": {
      "expression": "escapeVelocity(G,5.972e24,6.371e6)",
      "expected": 11185.97789184991,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "orbitalVelocity",
    "category": "天体力学",
    "syntax": "orbitalVelocity(G,M,r)",
    "description": "軌道速度",
    "args": "G,M,r",
    "returns": "速度",
    "example": "orbitalVelocity(G,5.972e24,6.371e6)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "orbitalVelocity(G,5.972e24,6.371e6)",
    "test": {
      "expression": "orbitalVelocity(G,5.972e24,6.371e6)",
      "expected": 7909.680821529872,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "capacitorEnergy",
    "category": "電気",
    "syntax": "capacitorEnergy(C,V)",
    "description": "コンデンサエネルギー",
    "args": "C,V",
    "returns": "J",
    "example": "capacitorEnergy(.01,10)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "capacitorEnergy(.01,10)",
    "test": {
      "expression": "capacitorEnergy(.01,10)",
      "expected": 0.5,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "inductorEnergy",
    "category": "電気",
    "syntax": "inductorEnergy(L,I)",
    "description": "インダクタエネルギー",
    "args": "L,I",
    "returns": "J",
    "example": "inductorEnergy(2,3)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "inductorEnergy(2,3)",
    "test": {
      "expression": "inductorEnergy(2,3)",
      "expected": 9,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "rcTimeConstant",
    "category": "電気",
    "syntax": "rcTimeConstant(R,C)",
    "description": "RC時定数",
    "args": "R,C",
    "returns": "s",
    "example": "rcTimeConstant(1000,1e-6)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "rcTimeConstant(1000,1e-6)",
    "test": {
      "expression": "rcTimeConstant(1000,1e-6)",
      "expected": 0.001,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "rlTimeConstant",
    "category": "電気",
    "syntax": "rlTimeConstant(R,L)",
    "description": "RL時定数",
    "args": "R,L",
    "returns": "s",
    "example": "rlTimeConstant(100,.2)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "rlTimeConstant(100,.2)",
    "test": {
      "expression": "rlTimeConstant(100,.2)",
      "expected": 0.002,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "reactanceL",
    "category": "交流",
    "syntax": "reactanceL(L,f)",
    "description": "誘導リアクタンス",
    "args": "L,f",
    "returns": "Ω",
    "example": "reactanceL(.1,50)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "reactanceL(.1,50)",
    "test": {
      "expression": "reactanceL(.1,50)",
      "expected": 31.41592653589793,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "reactanceC",
    "category": "交流",
    "syntax": "reactanceC(C,f)",
    "description": "容量リアクタンス",
    "args": "C,f",
    "returns": "Ω",
    "example": "reactanceC(100e-6,50)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "reactanceC(100e-6,50)",
    "test": {
      "expression": "reactanceC(100e-6,50)",
      "expected": -31.830988618379067,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "resonantFrequency",
    "category": "交流",
    "syntax": "resonantFrequency(L,C)",
    "description": "共振周波数",
    "args": "L,C",
    "returns": "Hz",
    "example": "resonantFrequency(.1,100e-6)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "resonantFrequency(.1,100e-6)",
    "test": {
      "expression": "resonantFrequency(.1,100e-6)",
      "expected": 50.329212104487034,
      "expectedType": "number",
      "tolerance": 1e-05,
      "angleMode": "DEG"
    }
  },
  {
    "name": "linearRegression",
    "category": "統計・確率",
    "syntax": "linearRegression(x,y)",
    "description": "線形回帰",
    "args": "x,y",
    "returns": "オブジェクト",
    "example": "linearRegression([1,2,3],[2,4,6])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "linearRegression([1,2,3],[2,4,6])",
    "test": {
      "expression": "linearRegression([1,2,3],[2,4,6]).slope",
      "expected": 2,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "quadraticRegression",
    "category": "統計・確率",
    "syntax": "quadraticRegression(x,y)",
    "description": "二次回帰",
    "args": "x,y",
    "returns": "オブジェクト",
    "example": "quadraticRegression([0,1,2],[1,4,9])",
    "level": "中級",
    "candidateGroups": [
      "数学関数"
    ],
    "insert": "quadraticRegression([0,1,2],[1,4,9])",
    "test": {
      "expression": "quadraticRegression([0,1,2],[1,4,9]).c",
      "expected": 1,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  },
  {
    "name": "impedanceRLC",
    "category": "交流",
    "syntax": "impedanceRLC(R,L,C,f)",
    "description": "複素インピーダンス",
    "args": "R,L,C,f",
    "returns": "複素数",
    "example": "impedanceRLC(10,.1,100e-6,50)",
    "level": "中級",
    "candidateGroups": [
      "工学関数"
    ],
    "insert": "impedanceRLC(10,.1,100e-6,50)",
    "test": {
      "expression": "real(impedanceRLC(10,.1,100e-6,50))",
      "expected": 10,
      "expectedType": "number",
      "tolerance": 1e-09,
      "angleMode": "DEG"
    }
  }];

const CONSTANTS = Object.fromEntries(CONSTANT_DEFINITIONS.map(d=>[d.name, Function(`"use strict";return (${d.value})`)()]));

function factorial(n){
  if(n<0 || !Number.isInteger(n)) throw new Error("factorial は0以上の整数のみ");
  let r=1; for(let i=2;i<=n;i++)r*=i; return r;
}
function gcd(a,b){
  a=Math.abs(Math.trunc(a)); b=Math.abs(Math.trunc(b));
  while(b){const t=b;b=a%b;a=t} return a;
}
function lcm(a,b){
  a=Math.trunc(a);b=Math.trunc(b);
  return (a===0||b===0)?0:Math.abs(a*b)/gcd(a,b);
}
function nCr(n,r){
  n=Math.trunc(n);r=Math.trunc(r);
  if(n<0||r<0||r>n)throw new Error("nCr: 0 <= r <= n が必要です");
  r=Math.min(r,n-r);let v=1;for(let i=1;i<=r;i++)v=v*(n-r+i)/i;return v;
}
function nPr(n,r){
  n=Math.trunc(n);r=Math.trunc(r);
  if(n<0||r<0||r>n)throw new Error("nPr: 0 <= r <= n が必要です");
  let v=1;for(let i=0;i<r;i++)v*=n-i;return v;
}


function vec(...xs){return xs.map(Number)}
function dot(a,b){
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)throw new Error("dot: 同じ長さのベクトルが必要です");
  return a.reduce((s,x,i)=>s+Number(x)*Number(b[i]),0);
}
function cross(a,b){
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==3||b.length!==3)throw new Error("cross: 3次元ベクトルが必要です");
  return [
    Number(a[1])*Number(b[2])-Number(a[2])*Number(b[1]),
    Number(a[2])*Number(b[0])-Number(a[0])*Number(b[2]),
    Number(a[0])*Number(b[1])-Number(a[1])*Number(b[0])
  ];
}
function norm(v){
  if(!Array.isArray(v))throw new Error("norm: ベクトルが必要です");
  return Math.sqrt(v.reduce((s,x)=>s+Number(x)*Number(x),0));
}
function normalize(v){
  const n=norm(v);
  if(n===0)throw new Error("normalize: ゼロベクトルは正規化できません");
  return v.map(x=>Number(x)/n);
}
function transpose(A){
  if(!Array.isArray(A)||!A.length||!A.every(Array.isArray))throw new Error("transpose: 行列が必要です");
  const cols=A[0].length;
  if(!A.every(r=>r.length===cols))throw new Error("transpose: 行列の列数が一致していません");
  return Array.from({length:cols},(_,j)=>A.map(r=>Number(r[j])));
}
function det(A){
  if(!Array.isArray(A)||!A.length||!A.every(r=>Array.isArray(r)&&r.length===A.length))
    throw new Error("det: 正方行列が必要です");
  const n=A.length,M=A.map(r=>r.map(Number));let d=1;
  for(let i=0;i<n;i++){
    let p=i;
    for(let r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[p][i]))p=r;
    if(Math.abs(M[p][i])<1e-15)return 0;
    if(p!==i){[M[p],M[i]]=[M[i],M[p]];d*=-1}
    const pivot=M[i][i];d*=pivot;
    for(let r=i+1;r<n;r++){
      const q=M[r][i]/pivot;
      for(let c=i+1;c<n;c++)M[r][c]-=q*M[i][c];
    }
  }
  return d;
}
function matmul(A,B){
  if(!Array.isArray(A)||!Array.isArray(B)||!A.length||!B.length||!A.every(Array.isArray)||!B.every(Array.isArray))
    throw new Error("matmul: 2つの行列が必要です");
  const ar=A.length,ac=A[0].length,br=B.length,bc=B[0].length;
  if(ac!==br)throw new Error("matmul: 行列サイズが適合しません");
  return Array.from({length:ar},(_,i)=>Array.from({length:bc},(_,j)=>{
    let s=0;for(let k=0;k<ac;k++)s+=Number(A[i][k])*Number(B[k][j]);return s;
  }));
}
function solveLinear(A,b){
  if(!Array.isArray(A)||!Array.isArray(b)||A.length!==b.length||!A.length||
     !A.every(r=>Array.isArray(r)&&r.length===A.length))
    throw new Error("solveLinear: n×n 行列 A と長さ n のベクトル b が必要です");
  const n=A.length,M=A.map((r,i)=>r.map(Number).concat(Number(b[i])));
  for(let i=0;i<n;i++){
    let p=i;
    for(let r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[p][i]))p=r;
    if(Math.abs(M[p][i])<1e-15)throw new Error("solveLinear: 特異行列です");
    [M[p],M[i]]=[M[i],M[p]];
    const pivot=M[i][i];
    for(let c=i;c<=n;c++)M[i][c]/=pivot;
    for(let r=0;r<n;r++){
      if(r===i)continue;
      const q=M[r][i];
      for(let c=i;c<=n;c++)M[r][c]-=q*M[i][c];
    }
  }
  return M.map(r=>r[n]);
}


function qAware(fn){fn._mfdcoQuantityAware=true;return fn}
function qAny(args){return !!global.MFDCOQuantities&&args.some(x=>global.MFDCOQuantities.isQuantity(x))}
function qUnit(v,unit){return global.MFDCOQuantities.fromUnit(v,unit)}
function qMul(...args){return args.reduce((a,b)=>global.MFDCOQuantities.mul(a,b))}
function qDiv(a,b){return global.MFDCOQuantities.div(a,b)}
function qAdd(a,b){return global.MFDCOQuantities.add(a,b)}
function qSub(a,b){return global.MFDCOQuantities.sub(a,b)}

function createScope(context={}){
  const angleMode=context.angleMode==="RAD"?"RAD":"DEG";
  const vars=context.vars||{};
  const ansResolver=typeof context.ansResolver==="function"?context.ansResolver:()=>{throw new Error("ANS履歴がありません")};
  const evaluate=typeof context.evaluate==="function"?context.evaluate:null;
  const degMode=angleMode==="DEG";
  const toRad=x=>degMode?x*Math.PI/180:x;
  const fromRad=x=>degMode?x*180/Math.PI:x;

  function evaluateAt(expression,variable,value){
    if(!evaluate)throw new Error("数値解析エンジンが接続されていません");
    if(typeof expression!=="string"||typeof variable!=="string")throw new Error("式と変数名は文字列で指定してください");
    if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(variable))throw new Error("変数名が不正です");
    return evaluate(expression,{...vars,[variable]:value});
  }
  function diff(expression,variable,x,h=1e-5){
    h=Math.abs(Number(h));if(!h)throw new Error("diff: h は0以外");
    return (evaluateAt(expression,variable,x+h)-evaluateAt(expression,variable,x-h))/(2*h);
  }
  function diff2(expression,variable,x,h=1e-4){
    h=Math.abs(Number(h));if(!h)throw new Error("diff2: h は0以外");
    return (evaluateAt(expression,variable,x+h)-2*evaluateAt(expression,variable,x)+evaluateAt(expression,variable,x-h))/(h*h);
  }
  function integral(expression,variable,a,b,n=1000){
    n=Math.max(2,Math.min(100000,Math.trunc(n)));if(n%2)n++;
    const step=(b-a)/n;
    let s=evaluateAt(expression,variable,a)+evaluateAt(expression,variable,b);
    for(let i=1;i<n;i++)s+=(i%2?4:2)*evaluateAt(expression,variable,a+i*step);
    return s*step/3;
  }
  function solve(expression,variable,a,b,tol=1e-10){
    let fa=evaluateAt(expression,variable,a),fb=evaluateAt(expression,variable,b);
    if(fa===0)return a;if(fb===0)return b;
    if(fa*fb>0)throw new Error("solve: 区間の両端で符号が異なる必要があります");
    for(let i=0;i<250;i++){
      const c=(a+b)/2,fc=evaluateAt(expression,variable,c);
      if(Math.abs(fc)<tol||Math.abs(b-a)<tol)return c;
      if(fa*fc<=0){b=c;fb=fc}else{a=c;fa=fc}
    }
    return (a+b)/2;
  }
  function sum(expression,variable,a,b,step=1){
    if(step===0)throw new Error("sum: step は0不可");
    let s=0,g=0;
    for(let x=a;step>0?x<=b:x>=b;x+=step){
      s+=evaluateAt(expression,variable,x);
      if(++g>1e6)throw new Error("sum: 回数上限");
    }
    return s;
  }
  function product(expression,variable,a,b,step=1){
    if(step===0)throw new Error("product: step は0不可");
    let p=1,g=0;
    for(let x=a;step>0?x<=b:x>=b;x+=step){
      p*=evaluateAt(expression,variable,x);
      if(++g>1e6)throw new Error("product: 回数上限");
    }
    return p;
  }


  const engineering={
    kineticEnergy:qAware((m,v)=>qAny([m,v])?qMul(0.5,m,v,v):0.5*m*v*v),
    momentum:qAware((m,v)=>qAny([m,v])?qMul(m,v):m*v),
    force:qAware((m,a)=>qAny([m,a])?qMul(m,a):m*a),
    torque:qAware((F,r)=>qAny([F,r])?qMul(F,r):F*r),
    work:qAware((F,d)=>qAny([F,d])?qMul(F,d):F*d),
    power:qAware((W,t)=>qAny([W,t])?qDiv(W,t):W/t),
    efficiency:qAware((out,input)=>qAny([out,input])?qDiv(out,input):out/input),
    hydrostaticP:qAware((rho,depth,p0=0,g=9.80665)=>{
      if(!qAny([rho,depth,p0,g]))return p0+rho*g*depth;
      const gg=global.MFDCOQuantities.isQuantity(g)?g:qUnit(g,"m/s^2");
      const base=global.MFDCOQuantities.isQuantity(p0)?p0:qUnit(p0,"Pa");
      return qAdd(base,qMul(rho,gg,depth));
    }),
    dynamicPressure:qAware((rho,v)=>qAny([rho,v])?qMul(0.5,rho,v,v):0.5*rho*v*v),
    reynolds:qAware((rho,v,L,mu)=>qAny([rho,v,L,mu])?qDiv(qMul(rho,v,L),mu):rho*v*L/mu),
    mach:qAware((v,a)=>qAny([v,a])?qDiv(v,a):v/a),
    continuityV2:qAware((A1,v1,A2)=>qAny([A1,v1,A2])?qDiv(qMul(A1,v1),A2):A1*v1/A2),
    bernoulliHead:qAware((p,rho,v,z,g=9.80665)=>{
      if(!qAny([p,rho,v,z,g]))return p/(rho*g)+v*v/(2*g)+z;
      const gg=global.MFDCOQuantities.isQuantity(g)?g:qUnit(g,"m/s^2");
      return qAdd(qAdd(qDiv(p,qMul(rho,gg)),qDiv(qMul(v,v),qMul(2,gg))),z);
    }),
    bernoulliP2:qAware((p1,rho,v1,z1,v2,z2,g=9.80665)=>{
      if(!qAny([p1,rho,v1,z1,v2,z2,g]))return p1+0.5*rho*(v1*v1-v2*v2)+rho*g*(z1-z2);
      const gg=global.MFDCOQuantities.isQuantity(g)?g:qUnit(g,"m/s^2");
      return qAdd(qAdd(p1,qMul(0.5,rho,qSub(qMul(v1,v1),qMul(v2,v2)))),qMul(rho,gg,qSub(z1,z2)));
    }),
    dragForce:qAware((rho,v,Cd,A)=>qAny([rho,v,Cd,A])?qMul(0.5,rho,v,v,Cd,A):0.5*rho*v*v*Cd*A),
    liftForce:qAware((rho,v,Cl,A)=>qAny([rho,v,Cl,A])?qMul(0.5,rho,v,v,Cl,A):0.5*rho*v*v*Cl*A),
    idealGasP:qAware((n,T,V,R=CONSTANTS.Rgas)=>{
      if(!qAny([n,T,V,R]))return n*R*T/V;
      const RR=global.MFDCOQuantities.isQuantity(R)?R:qUnit(R,"J/mol/K");
      return qDiv(qMul(n,RR,T),V);
    }),
    idealGasV:qAware((n,T,P,R=CONSTANTS.Rgas)=>{
      if(!qAny([n,T,P,R]))return n*R*T/P;
      const RR=global.MFDCOQuantities.isQuantity(R)?R:qUnit(R,"J/mol/K");
      return qDiv(qMul(n,RR,T),P);
    }),
    ohmV:qAware((I,R)=>qAny([I,R])?qMul(I,R):I*R),
    ohmI:qAware((V,R)=>qAny([V,R])?qDiv(V,R):V/R),
    ohmR:qAware((V,I)=>qAny([V,I])?qDiv(V,I):V/I),
    electricPower:qAware((V,I)=>qAny([V,I])?qMul(V,I):V*I),
    stress:qAware((F,A)=>qAny([F,A])?qDiv(F,A):F/A),
    strain:qAware((dL,L)=>qAny([dL,L])?qDiv(dL,L):dL/L),
    hookeStress:qAware((E,eps)=>qAny([E,eps])?qMul(E,eps):E*eps),
    eulerBuckling:qAware((E,I,K,L)=>{
      if(!qAny([E,I,K,L]))return Math.PI*Math.PI*E*I/((K*L)*(K*L));
      return qDiv(qMul(Math.PI*Math.PI,E,I),qMul(K,L,K,L));
    }),
    heatConduction:qAware((k,A,dT,L)=>qAny([k,A,dT,L])?qDiv(qMul(k,A,dT),L):k*A*dT/L)
  };

  const symbolic={
    primeFactors:(n)=>global.MFDCOSymbolic.primeFactors(n),
    factorInteger:(n)=>global.MFDCOSymbolic.factorInteger(n),
    simplifyFraction:(a,b)=>global.MFDCOSymbolic.simplifyFraction(a,b),
    expandPoly:(expr,v="x")=>global.MFDCOSymbolic.expandPoly(expr,v),
    collectPoly:(expr,v="x")=>global.MFDCOSymbolic.collectPoly(expr,v),
    simplifyPoly:(expr,v="x")=>global.MFDCOSymbolic.simplifyPoly(expr,v),
    factorPoly:(expr,v="x")=>global.MFDCOSymbolic.factorPoly(expr,v),
    polyDegree:(expr,v="x")=>global.MFDCOSymbolic.polyDegree(expr,v),
    polyCoefficients:(expr,v="x")=>global.MFDCOSymbolic.polyCoefficients(expr,v),
    polyDerivative:(expr,v="x")=>global.MFDCOSymbolic.polyDerivative(expr,v),
    polyIntegral:(expr,v="x")=>global.MFDCOSymbolic.polyIntegral(expr,v),
    taylorCoefficients:(expr,v="x",center=0,order=6)=>global.MFDCOSymbolic.taylorCoefficients(expr,v,center,order,vars),
    taylor:(expr,v="x",center=0,order=6)=>global.MFDCOSymbolic.taylor(expr,v,center,order),
    maclaurin:(expr,v="x",order=6)=>global.MFDCOSymbolic.maclaurin(expr,v,order)
  };


  const A=global.MFDCOAdvanced||{};
  const extraEngineering={
    projectileRange:qAware((v,a,g=9.80665)=>qAny([v,g])?qDiv(qMul(v,v,Math.sin(2*Number(a))),global.MFDCOQuantities.isQuantity(g)?g:qUnit(g,"m/s^2")):A.projectileRange(v,a,g)),
    projectileTime:qAware((v,a,g=9.80665)=>qAny([v,g])?qDiv(qMul(2,v,Math.sin(Number(a))),global.MFDCOQuantities.isQuantity(g)?g:qUnit(g,"m/s^2")):A.projectileTime(v,a,g)),
    centripetalForce:qAware((m,v,r)=>qAny([m,v,r])?qDiv(qMul(m,v,v),r):A.centripetalForce(m,v,r)),
    angularVelocity:qAware((v,r)=>qAny([v,r])?qDiv(v,r):A.angularVelocity(v,r)),
    angularMomentum:qAware((I,w)=>qAny([I,w])?qMul(I,w):A.angularMomentum(I,w)),
    impulse:qAware((F,dt)=>qAny([F,dt])?qMul(F,dt):A.impulse(F,dt)),
    frictionForce:qAware((mu,N)=>qAny([mu,N])?qMul(mu,N):A.frictionForce(mu,N)),
    springForce:qAware((k,x)=>qAny([k,x])?qMul(-1,k,x):A.springForce(k,x)),
    springEnergy:qAware((k,x)=>qAny([k,x])?qMul(.5,k,x,x):A.springEnergy(k,x)),
    escapeVelocity:qAware((G,M,r)=>qAny([M,r])?global.MFDCOQuantities.pow(qDiv(qMul(2,global.MFDCOQuantities.isQuantity(G)?G:qUnit(G,"m^3/kg/s^2"),M),r),.5):A.escapeVelocity(G,M,r)),
    orbitalVelocity:qAware((G,M,r)=>qAny([M,r])?global.MFDCOQuantities.pow(qDiv(qMul(global.MFDCOQuantities.isQuantity(G)?G:qUnit(G,"m^3/kg/s^2"),M),r),.5):A.orbitalVelocity(G,M,r)),
    capacitorEnergy:qAware((C,V)=>qAny([C,V])?qMul(.5,C,V,V):A.capacitorEnergy(C,V)),
    inductorEnergy:qAware((L,I)=>qAny([L,I])?qMul(.5,L,I,I):A.inductorEnergy(L,I)),
    rcTimeConstant:qAware((R,C)=>qAny([R,C])?qMul(R,C):A.rcTimeConstant(R,C)),
    rlTimeConstant:qAware((R,L)=>qAny([R,L])?qDiv(L,R):A.rlTimeConstant(R,L)),
    reactanceL:qAware((L,f)=>qAny([L,f])?qMul(2*Math.PI,f,L):A.reactanceL(L,f)),
    reactanceC:qAware((C,f)=>qAny([C,f])?qDiv(-1,qMul(2*Math.PI,f,C)):A.reactanceC(C,f)),
    resonantFrequency:qAware((L,C)=>qAny([L,C])?qDiv(1,qMul(2*Math.PI,global.MFDCOQuantities.pow(qMul(L,C),.5))):A.resonantFrequency(L,C))
  };
  const advancedFns={
    complex:A.complex,real:A.real,imag:A.imag,complexAbs:A.cabs,arg:A.carg,conj:A.cconj,complexSqrt:A.csqrt,
    polyRoots:A.polyRoots,solveExact:A.solveExact,solveSystem:A.solveSystem,substitute:A.substitute,derivative:A.derivative,partial:A.partial,limit:A.limit,
    mean:A.mean,median:A.median,mode:A.mode,variance:A.variance,stddev:A.stddev,percentile:A.percentile,covariance:A.covariance,correlation:A.correlation,
    linearRegression:A.linearRegression,quadraticRegression:A.quadraticRegression,normalPDF:A.normalPDF,normalCDF:A.normalCDF,binomialPMF:A.binomialPMF,poissonPMF:A.poissonPMF,
    impedanceRLC:A.impedanceRLC,...extraEngineering
  };

  return {
    ...CONSTANTS,
    ansValue:ansResolver,
    sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,floor:Math.floor,ceil:Math.ceil,round:Math.round,trunc:Math.trunc,
    min:Math.min,max:Math.max,hypot:Math.hypot,sign:Math.sign,clamp:(x,a,b)=>Math.min(Math.max(x,a),b),
    ln:Math.log,log:Math.log,log10:Math.log10,log2:Math.log2,exp:Math.exp,pow:Math.pow,
    sin:x=>Math.sin(toRad(x)),cos:x=>Math.cos(toRad(x)),tan:x=>Math.tan(toRad(x)),
    asin:x=>fromRad(Math.asin(x)),acos:x=>fromRad(Math.acos(x)),atan:x=>fromRad(Math.atan(x)),
    sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,asinh:Math.asinh,acosh:Math.acosh,atanh:Math.atanh,
    rad:x=>x*Math.PI/180,deg:x=>x*180/Math.PI,
    factorial,nCr,nPr,gcd,lcm,isfinite:Number.isFinite,isnan:Number.isNaN,
    diff,diff2,integral,solve,sum,product,
    ...engineering,
    ...symbolic,
    ...advancedFns,
    vec,dot,cross,norm,normalize,transpose,det,matmul,solveLinear,
    ...vars
  };
}

function byCategory(category){
  return FUNCTION_DEFINITIONS.filter(x=>x.category===category);
}
function byNames(names){
  const set=new Set(names);
  return FUNCTION_DEFINITIONS.filter(x=>set.has(x.name));
}
function get(name){
  return FUNCTION_DEFINITIONS.find(x=>x.name===name)||null;
}

global.MFDCOFunctions={
  version:"3.8",
constants:CONSTANT_DEFINITIONS,
  functions:FUNCTION_DEFINITIONS,
  constantValues:CONSTANTS,
  createScope,byCategory,byNames,get,
  byCandidateGroup:(group)=>FUNCTION_DEFINITIONS.filter(x=>(x.candidateGroups||[]).includes(group)),
  missingTests:()=>FUNCTION_DEFINITIONS.filter(x=>!x.test),
  missingCandidateGroups:()=>FUNCTION_DEFINITIONS.filter(x=>!(x.candidateGroups||[]).length),
  publicNames:()=>FUNCTION_DEFINITIONS.map(x=>x.name)
};
})(typeof window!=="undefined"?window:globalThis);
