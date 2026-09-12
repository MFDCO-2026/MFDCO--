/* MFDCO Tools v2.1 shared unit registry + conversion engine */
(function(global){
"use strict";
const PREFIXES=[
  ["","なし",1],["Y","Y",1e24],["Z","Z",1e21],["E","E",1e18],["P","P",1e15],["T","T",1e12],
  ["G","G",1e9],["M","M",1e6],["k","k",1e3],["h","h",1e2],["da","da",1e1],
  ["d","d",1e-1],["c","c",1e-2],["m","m",1e-3],["µ","µ",1e-6],["n","n",1e-9],["p","p",1e-12],["f","f",1e-15]
];
const CATEGORY_NAMES={
  length:"長さ",area:"面積",volume:"体積",time:"時間",mass:"質量",speed:"速度",
  acceleration:"加速度",force:"力",torque:"トルク",pressure:"圧力",energy:"エネルギー",power:"仕事率",
  frequency:"周波数",charge:"電荷",voltage:"電圧",current:"電流",resistance:"抵抗",
  capacitance:"静電容量",inductance:"インダクタンス",conductance:"コンダクタンス",
  magneticFlux:"磁束",magneticFluxDensity:"磁束密度",temperature:"温度",temperatureDelta:"温度差",
  amount:"物質量",luminous:"光度",luminousFlux:"光束",illuminance:"照度",angle:"角度",data:"情報量",
  density:"密度",dynamicViscosity:"粘度",kinematicViscosity:"動粘度",
  radioactivity:"放射能",absorbedDose:"吸収線量",equivalentDose:"等価線量",
  minecraftLength:"Minecraft距離",minecraftTime:"Minecraft時間"
};
const BUILTIN_UNITS=[
  {
    "id": "m",
    "name": "メートル",
    "symbol": "m",
    "cat": "length",
    "factor": 1,
    "prefix": true,
    "note": "SI基本単位",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "angstrom",
    "name": "オングストローム",
    "symbol": "Å",
    "cat": "length",
    "factor": 1e-10,
    "test": {
      "value": 1,
      "to": "m",
      "expected": 1e-10,
      "tolerance": 1e-09
    }
  },
  {
    "id": "inch",
    "name": "インチ",
    "symbol": "in",
    "cat": "length",
    "factor": 0.0254,
    "note": "正確値",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 0.0254,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ft",
    "name": "フィート",
    "symbol": "ft",
    "cat": "length",
    "factor": 0.3048,
    "note": "正確値",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 0.3048,
      "tolerance": 1e-09
    }
  },
  {
    "id": "yd",
    "name": "ヤード",
    "symbol": "yd",
    "cat": "length",
    "factor": 0.9144,
    "note": "正確値",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 0.9144,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mile",
    "name": "マイル",
    "symbol": "mi",
    "cat": "length",
    "factor": 1609.344,
    "note": "正確値",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 1609.344,
      "tolerance": 1e-09
    }
  },
  {
    "id": "fathom",
    "name": "ファゾム",
    "symbol": "fathom",
    "cat": "length",
    "factor": 1.8288,
    "test": {
      "value": 1,
      "to": "m",
      "expected": 1.8288,
      "tolerance": 1e-09
    }
  },
  {
    "id": "chain",
    "name": "チェーン",
    "symbol": "ch",
    "cat": "length",
    "factor": 20.1168,
    "test": {
      "value": 1,
      "to": "m",
      "expected": 20.1168,
      "tolerance": 1e-09
    }
  },
  {
    "id": "furlong",
    "name": "ハロン",
    "symbol": "fur",
    "cat": "length",
    "factor": 201.168,
    "test": {
      "value": 1,
      "to": "m",
      "expected": 201.168,
      "tolerance": 1e-09
    }
  },
  {
    "id": "nmi",
    "name": "海里",
    "symbol": "nmi",
    "cat": "length",
    "factor": 1852,
    "note": "国際海里",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 1852.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "au",
    "name": "天文単位",
    "symbol": "au",
    "cat": "length",
    "factor": 149597870700,
    "note": "IAU定義",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 149597870700.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ly",
    "name": "光年",
    "symbol": "ly",
    "cat": "length",
    "factor": 9460730472580800,
    "note": "1 Julian yearの光路長",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 9460730472580800.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "pc",
    "name": "パーセク",
    "symbol": "pc",
    "cat": "length",
    "factor": 30856775814913670,
    "test": {
      "value": 1,
      "to": "m",
      "expected": 3.085677581491367e+16,
      "tolerance": 1e-09
    }
  },
  {
    "id": "sun",
    "name": "寸",
    "symbol": "寸",
    "cat": "length",
    "factor": 0.030303030303030304,
    "note": "尺貫法（参考）",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 0.030303030303030304,
      "tolerance": 1e-09
    }
  },
  {
    "id": "shaku",
    "name": "尺",
    "symbol": "尺",
    "cat": "length",
    "factor": 0.30303030303030304,
    "note": "尺貫法（参考）",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 0.30303030303030304,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ken",
    "name": "間",
    "symbol": "間",
    "cat": "length",
    "factor": 1.8181818181818181,
    "note": "6尺",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 1.8181818181818181,
      "tolerance": 1e-09
    }
  },
  {
    "id": "jo",
    "name": "丈",
    "symbol": "丈",
    "cat": "length",
    "factor": 3.0303030303030303,
    "note": "10尺",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 3.0303030303030303,
      "tolerance": 1e-09
    }
  },
  {
    "id": "cho_len",
    "name": "町",
    "symbol": "町",
    "cat": "length",
    "factor": 109.0909090909091,
    "note": "60間",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 109.0909090909091,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ri",
    "name": "里",
    "symbol": "里",
    "cat": "length",
    "factor": 3927.2727272727275,
    "note": "36町",
    "test": {
      "value": 1,
      "to": "m",
      "expected": 3927.2727272727275,
      "tolerance": 1e-09
    }
  },
  {
    "id": "m2",
    "name": "平方メートル",
    "symbol": "m²",
    "cat": "area",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ha",
    "name": "ヘクタール",
    "symbol": "ha",
    "cat": "area",
    "factor": 10000,
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 10000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "acre",
    "name": "エーカー",
    "symbol": "acre",
    "cat": "area",
    "factor": 4046.8564224,
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 4046.8564224,
      "tolerance": 1e-09
    }
  },
  {
    "id": "sqft",
    "name": "平方フィート",
    "symbol": "ft²",
    "cat": "area",
    "factor": 0.09290304,
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 0.09290304,
      "tolerance": 1e-09
    }
  },
  {
    "id": "sqin",
    "name": "平方インチ",
    "symbol": "in²",
    "cat": "area",
    "factor": 0.00064516,
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 0.00064516,
      "tolerance": 1e-09
    }
  },
  {
    "id": "sqyd",
    "name": "平方ヤード",
    "symbol": "yd²",
    "cat": "area",
    "factor": 0.83612736,
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 0.83612736,
      "tolerance": 1e-09
    }
  },
  {
    "id": "tsubo",
    "name": "坪（歩）",
    "symbol": "坪",
    "cat": "area",
    "factor": 3.3057851239669422,
    "note": "尺貫法（参考）",
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 3.3057851239669422,
      "tolerance": 1e-09
    }
  },
  {
    "id": "se",
    "name": "畝",
    "symbol": "畝",
    "cat": "area",
    "factor": 99.17355371900827,
    "note": "30坪",
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 99.17355371900827,
      "tolerance": 1e-09
    }
  },
  {
    "id": "tan_area",
    "name": "反",
    "symbol": "反",
    "cat": "area",
    "factor": 991.7355371900826,
    "note": "300坪",
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 991.7355371900826,
      "tolerance": 1e-09
    }
  },
  {
    "id": "chobu",
    "name": "町歩",
    "symbol": "町歩",
    "cat": "area",
    "factor": 9917.355371900827,
    "note": "3000坪",
    "test": {
      "value": 1,
      "to": "m2",
      "expected": 9917.355371900827,
      "tolerance": 1e-09
    }
  },
  {
    "id": "m3",
    "name": "立方メートル",
    "symbol": "m³",
    "cat": "volume",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "L",
    "name": "リットル",
    "symbol": "L",
    "cat": "volume",
    "factor": 0.001,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.001,
      "tolerance": 1e-09
    }
  },
  {
    "id": "usgal",
    "name": "米ガロン",
    "symbol": "US gal",
    "cat": "volume",
    "factor": 0.003785411784,
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.003785411784,
      "tolerance": 1e-09
    }
  },
  {
    "id": "impgal",
    "name": "英ガロン",
    "symbol": "Imp gal",
    "cat": "volume",
    "factor": 0.00454609,
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.00454609,
      "tolerance": 1e-09
    }
  },
  {
    "id": "usqt",
    "name": "米クォート",
    "symbol": "US qt",
    "cat": "volume",
    "factor": 0.000946352946,
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.000946352946,
      "tolerance": 1e-09
    }
  },
  {
    "id": "uspt",
    "name": "米パイント",
    "symbol": "US pt",
    "cat": "volume",
    "factor": 0.000473176473,
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.000473176473,
      "tolerance": 1e-09
    }
  },
  {
    "id": "usfloz",
    "name": "米液量オンス",
    "symbol": "US fl oz",
    "cat": "volume",
    "factor": 2.95735295625e-05,
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 2.95735295625e-05,
      "tolerance": 1e-09
    }
  },
  {
    "id": "bbl",
    "name": "石油バレル",
    "symbol": "bbl",
    "cat": "volume",
    "factor": 0.158987294928,
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.158987294928,
      "tolerance": 1e-09
    }
  },
  {
    "id": "go",
    "name": "合",
    "symbol": "合",
    "cat": "volume",
    "factor": 0.00018039,
    "note": "尺貫法（参考）",
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.00018039,
      "tolerance": 1e-09
    }
  },
  {
    "id": "sho",
    "name": "升",
    "symbol": "升",
    "cat": "volume",
    "factor": 0.0018039,
    "note": "10合",
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.0018039,
      "tolerance": 1e-09
    }
  },
  {
    "id": "to",
    "name": "斗",
    "symbol": "斗",
    "cat": "volume",
    "factor": 0.018039,
    "note": "10升",
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.018039,
      "tolerance": 1e-09
    }
  },
  {
    "id": "koku",
    "name": "石",
    "symbol": "石",
    "cat": "volume",
    "factor": 0.18039,
    "note": "10斗",
    "test": {
      "value": 1,
      "to": "m3",
      "expected": 0.18039,
      "tolerance": 1e-09
    }
  },
  {
    "id": "s",
    "name": "秒",
    "symbol": "s",
    "cat": "time",
    "factor": 1,
    "prefix": true,
    "note": "SI基本単位",
    "test": {
      "value": 1,
      "to": "s",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "min",
    "name": "分",
    "symbol": "min",
    "cat": "time",
    "factor": 60,
    "test": {
      "value": 1,
      "to": "s",
      "expected": 60.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "h_time",
    "name": "時",
    "symbol": "h",
    "cat": "time",
    "factor": 3600,
    "test": {
      "value": 1,
      "to": "s",
      "expected": 3600.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "day",
    "name": "日",
    "symbol": "d",
    "cat": "time",
    "factor": 86400,
    "test": {
      "value": 1,
      "to": "s",
      "expected": 86400.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "week",
    "name": "週",
    "symbol": "wk",
    "cat": "time",
    "factor": 604800,
    "test": {
      "value": 1,
      "to": "s",
      "expected": 604800.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "fortnight",
    "name": "フォートナイト",
    "symbol": "fortnight",
    "cat": "time",
    "factor": 1209600,
    "test": {
      "value": 1,
      "to": "s",
      "expected": 1209600.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "julianYear",
    "name": "ユリウス年",
    "symbol": "a",
    "cat": "time",
    "factor": 31557600,
    "note": "365.25日",
    "test": {
      "value": 1,
      "to": "s",
      "expected": 31557600.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "kg",
    "name": "キログラム",
    "symbol": "kg",
    "cat": "mass",
    "factor": 1,
    "note": "SI基本単位",
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "g",
    "name": "グラム",
    "symbol": "g",
    "cat": "mass",
    "factor": 0.001,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 0.001,
      "tolerance": 1e-09
    }
  },
  {
    "id": "tonne",
    "name": "トン",
    "symbol": "t",
    "cat": "mass",
    "factor": 1000,
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 1000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "lb",
    "name": "ポンド",
    "symbol": "lb",
    "cat": "mass",
    "factor": 0.45359237,
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 0.45359237,
      "tolerance": 1e-09
    }
  },
  {
    "id": "oz",
    "name": "オンス",
    "symbol": "oz",
    "cat": "mass",
    "factor": 0.028349523125,
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 0.028349523125,
      "tolerance": 1e-09
    }
  },
  {
    "id": "stone",
    "name": "ストーン",
    "symbol": "st",
    "cat": "mass",
    "factor": 6.35029318,
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 6.35029318,
      "tolerance": 1e-09
    }
  },
  {
    "id": "grain",
    "name": "グレーン",
    "symbol": "gr",
    "cat": "mass",
    "factor": 6.479891e-05,
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 6.479891e-05,
      "tolerance": 1e-09
    }
  },
  {
    "id": "carat",
    "name": "カラット",
    "symbol": "ct",
    "cat": "mass",
    "factor": 0.0002,
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 0.0002,
      "tolerance": 1e-09
    }
  },
  {
    "id": "momme",
    "name": "匁",
    "symbol": "匁",
    "cat": "mass",
    "factor": 0.00375,
    "note": "尺貫法（参考）",
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 0.00375,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ryo_mass",
    "name": "両",
    "symbol": "両",
    "cat": "mass",
    "factor": 0.0375,
    "note": "10匁として換算",
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 0.0375,
      "tolerance": 1e-09
    }
  },
  {
    "id": "kin",
    "name": "斤",
    "symbol": "斤",
    "cat": "mass",
    "factor": 0.6,
    "note": "160匁",
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 0.6,
      "tolerance": 1e-09
    }
  },
  {
    "id": "kan",
    "name": "貫",
    "symbol": "貫",
    "cat": "mass",
    "factor": 3.75,
    "note": "1000匁",
    "test": {
      "value": 1,
      "to": "kg",
      "expected": 3.75,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mps",
    "name": "メートル毎秒",
    "symbol": "m/s",
    "cat": "speed",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "mps",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "kmh",
    "name": "キロメートル毎時",
    "symbol": "km/h",
    "cat": "speed",
    "factor": 0.2777777777777778,
    "test": {
      "value": 1,
      "to": "mps",
      "expected": 0.2777777777777778,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mph",
    "name": "マイル毎時",
    "symbol": "mph",
    "cat": "speed",
    "factor": 0.44704,
    "test": {
      "value": 1,
      "to": "mps",
      "expected": 0.44704,
      "tolerance": 1e-09
    }
  },
  {
    "id": "knot",
    "name": "ノット",
    "symbol": "kn",
    "cat": "speed",
    "factor": 0.5144444444444445,
    "test": {
      "value": 1,
      "to": "mps",
      "expected": 0.5144444444444445,
      "tolerance": 1e-09
    }
  },
  {
    "id": "c",
    "name": "光速",
    "symbol": "c",
    "cat": "speed",
    "factor": 299792458,
    "note": "真空中",
    "test": {
      "value": 1,
      "to": "mps",
      "expected": 299792458.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mps2",
    "name": "メートル毎秒毎秒",
    "symbol": "m/s²",
    "cat": "acceleration",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "mps2",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "gal",
    "name": "ガル",
    "symbol": "Gal",
    "cat": "acceleration",
    "factor": 0.01,
    "test": {
      "value": 1,
      "to": "mps2",
      "expected": 0.01,
      "tolerance": 1e-09
    }
  },
  {
    "id": "g0",
    "name": "標準重力加速度",
    "symbol": "g₀",
    "cat": "acceleration",
    "factor": 9.80665,
    "test": {
      "value": 1,
      "to": "mps2",
      "expected": 9.80665,
      "tolerance": 1e-09
    }
  },
  {
    "id": "N",
    "name": "ニュートン",
    "symbol": "N",
    "cat": "force",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "N",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "dyn",
    "name": "ダイン",
    "symbol": "dyn",
    "cat": "force",
    "factor": 1e-05,
    "test": {
      "value": 1,
      "to": "N",
      "expected": 1e-05,
      "tolerance": 1e-09
    }
  },
  {
    "id": "kgf",
    "name": "重量キログラム",
    "symbol": "kgf",
    "cat": "force",
    "factor": 9.80665,
    "test": {
      "value": 1,
      "to": "N",
      "expected": 9.80665,
      "tolerance": 1e-09
    }
  },
  {
    "id": "lbf",
    "name": "重量ポンド",
    "symbol": "lbf",
    "cat": "force",
    "factor": 4.4482216152605,
    "test": {
      "value": 1,
      "to": "N",
      "expected": 4.4482216152605,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Nm",
    "name": "ニュートンメートル",
    "symbol": "N·m",
    "cat": "torque",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "Nm",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "kgfm",
    "name": "重量キログラムメートル",
    "symbol": "kgf·m",
    "cat": "torque",
    "factor": 9.80665,
    "test": {
      "value": 1,
      "to": "Nm",
      "expected": 9.80665,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ftlbf_t",
    "name": "フィート重量ポンド",
    "symbol": "ft·lbf",
    "cat": "torque",
    "factor": 1.3558179483314003,
    "test": {
      "value": 1,
      "to": "Nm",
      "expected": 1.3558179483314003,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Pa",
    "name": "パスカル",
    "symbol": "Pa",
    "cat": "pressure",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "Pa",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "bar",
    "name": "バール",
    "symbol": "bar",
    "cat": "pressure",
    "factor": 100000,
    "test": {
      "value": 1,
      "to": "Pa",
      "expected": 100000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "atm",
    "name": "標準大気圧",
    "symbol": "atm",
    "cat": "pressure",
    "factor": 101325,
    "test": {
      "value": 1,
      "to": "Pa",
      "expected": 101325.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "torr",
    "name": "トル",
    "symbol": "Torr",
    "cat": "pressure",
    "factor": 133.32236842105263,
    "test": {
      "value": 1,
      "to": "Pa",
      "expected": 133.32236842105263,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mmHg",
    "name": "水銀柱ミリメートル",
    "symbol": "mmHg",
    "cat": "pressure",
    "factor": 133.322387415,
    "test": {
      "value": 1,
      "to": "Pa",
      "expected": 133.322387415,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mmH2O",
    "name": "水柱ミリメートル",
    "symbol": "mmH₂O",
    "cat": "pressure",
    "factor": 9.80665,
    "test": {
      "value": 1,
      "to": "Pa",
      "expected": 9.80665,
      "tolerance": 1e-09
    }
  },
  {
    "id": "psi",
    "name": "psi",
    "symbol": "psi",
    "cat": "pressure",
    "factor": 6894.757293168,
    "test": {
      "value": 1,
      "to": "Pa",
      "expected": 6894.757293168,
      "tolerance": 1e-09
    }
  },
  {
    "id": "J",
    "name": "ジュール",
    "symbol": "J",
    "cat": "energy",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Wh",
    "name": "ワット時",
    "symbol": "Wh",
    "cat": "energy",
    "factor": 3600,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 3600.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "cal",
    "name": "カロリー",
    "symbol": "cal",
    "cat": "energy",
    "factor": 4.184,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 4.184,
      "tolerance": 1e-09
    }
  },
  {
    "id": "eV",
    "name": "電子ボルト",
    "symbol": "eV",
    "cat": "energy",
    "factor": 1.602176634e-19,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 1.602176634e-19,
      "tolerance": 1e-09
    }
  },
  {
    "id": "erg",
    "name": "エルグ",
    "symbol": "erg",
    "cat": "energy",
    "factor": 1e-07,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 1e-07,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ftlbf_e",
    "name": "フィート重量ポンド",
    "symbol": "ft·lbf",
    "cat": "energy",
    "factor": 1.3558179483314003,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 1.3558179483314003,
      "tolerance": 1e-09
    }
  },
  {
    "id": "BTU",
    "name": "BTU (IT)",
    "symbol": "BTU",
    "cat": "energy",
    "factor": 1055.05585262,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 1055.05585262,
      "tolerance": 1e-09
    }
  },
  {
    "id": "therm",
    "name": "サーム",
    "symbol": "therm",
    "cat": "energy",
    "factor": 105505585.262,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 105505585.262,
      "tolerance": 1e-09
    }
  },
  {
    "id": "toe",
    "name": "石油換算トン",
    "symbol": "toe",
    "cat": "energy",
    "factor": 41868000000,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 41868000000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "kgTNT",
    "name": "TNT換算キログラム",
    "symbol": "kg TNT",
    "cat": "energy",
    "factor": 4184000,
    "note": "1 kg TNT = 4.184 MJ",
    "test": {
      "value": 1,
      "to": "J",
      "expected": 4184000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "tonTNT",
    "name": "TNT換算トン",
    "symbol": "t TNT",
    "cat": "energy",
    "factor": 4184000000,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 4184000000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ktTNT",
    "name": "TNT換算キロトン",
    "symbol": "kt TNT",
    "cat": "energy",
    "factor": 4184000000000,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 4184000000000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "MtTNT",
    "name": "TNT換算メガトン",
    "symbol": "Mt TNT",
    "cat": "energy",
    "factor": 4184000000000000,
    "test": {
      "value": 1,
      "to": "J",
      "expected": 4184000000000000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "W",
    "name": "ワット",
    "symbol": "W",
    "cat": "power",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "W",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "hp",
    "name": "英馬力",
    "symbol": "hp",
    "cat": "power",
    "factor": 745.6998715822702,
    "test": {
      "value": 1,
      "to": "W",
      "expected": 745.6998715822702,
      "tolerance": 1e-09
    }
  },
  {
    "id": "PS",
    "name": "仏馬力",
    "symbol": "PS",
    "cat": "power",
    "factor": 735.49875,
    "test": {
      "value": 1,
      "to": "W",
      "expected": 735.49875,
      "tolerance": 1e-09
    }
  },
  {
    "id": "BTUh",
    "name": "BTU毎時",
    "symbol": "BTU/h",
    "cat": "power",
    "factor": 0.2930710701722222,
    "test": {
      "value": 1,
      "to": "W",
      "expected": 0.2930710701722222,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Hz",
    "name": "ヘルツ",
    "symbol": "Hz",
    "cat": "frequency",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "Hz",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "C",
    "name": "クーロン",
    "symbol": "C",
    "cat": "charge",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "C",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "A",
    "name": "アンペア",
    "symbol": "A",
    "cat": "current",
    "factor": 1,
    "prefix": true,
    "note": "SI基本単位",
    "test": {
      "value": 1,
      "to": "A",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "V",
    "name": "ボルト",
    "symbol": "V",
    "cat": "voltage",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "V",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "ohm",
    "name": "オーム",
    "symbol": "Ω",
    "cat": "resistance",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "ohm",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "S",
    "name": "ジーメンス",
    "symbol": "S",
    "cat": "conductance",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "S",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "F",
    "name": "ファラド",
    "symbol": "F",
    "cat": "capacitance",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "F",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "H",
    "name": "ヘンリー",
    "symbol": "H",
    "cat": "inductance",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "H",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Wb",
    "name": "ウェーバ",
    "symbol": "Wb",
    "cat": "magneticFlux",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "Wb",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Tmag",
    "name": "テスラ",
    "symbol": "T",
    "cat": "magneticFluxDensity",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "Tmag",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "K",
    "name": "ケルビン",
    "symbol": "K",
    "cat": "temperature",
    "factor": 1,
    "tempScale": "K",
    "test": {
      "value": 1,
      "to": "K",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "degC",
    "name": "セルシウス度",
    "symbol": "°C",
    "cat": "temperature",
    "factor": 1,
    "tempScale": "C",
    "test": {
      "value": 1,
      "to": "K",
      "expected": 274.15,
      "tolerance": 1e-09
    }
  },
  {
    "id": "degF",
    "name": "華氏度",
    "symbol": "°F",
    "cat": "temperature",
    "factor": 1,
    "tempScale": "F",
    "test": {
      "value": 1,
      "to": "K",
      "expected": 255.92777777777775,
      "tolerance": 1e-09
    }
  },
  {
    "id": "degR",
    "name": "ランキン度",
    "symbol": "°R",
    "cat": "temperature",
    "factor": 1,
    "tempScale": "R",
    "test": {
      "value": 1,
      "to": "K",
      "expected": 0.5555555555555556,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Kdelta",
    "name": "ケルビン温度差",
    "symbol": "K",
    "cat": "temperatureDelta",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "Kdelta",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Cdelta",
    "name": "摂氏温度差",
    "symbol": "°C",
    "cat": "temperatureDelta",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "Kdelta",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Fdelta",
    "name": "華氏温度差",
    "symbol": "°F",
    "cat": "temperatureDelta",
    "factor": 0.5555555555555556,
    "test": {
      "value": 1,
      "to": "Kdelta",
      "expected": 0.5555555555555556,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mol",
    "name": "モル",
    "symbol": "mol",
    "cat": "amount",
    "factor": 1,
    "prefix": true,
    "note": "SI基本単位",
    "test": {
      "value": 1,
      "to": "mol",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "cd",
    "name": "カンデラ",
    "symbol": "cd",
    "cat": "luminous",
    "factor": 1,
    "prefix": true,
    "note": "SI基本単位",
    "test": {
      "value": 1,
      "to": "cd",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "lm",
    "name": "ルーメン",
    "symbol": "lm",
    "cat": "luminousFlux",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "lm",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "lx",
    "name": "ルクス",
    "symbol": "lx",
    "cat": "illuminance",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "lx",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "rad",
    "name": "ラジアン",
    "symbol": "rad",
    "cat": "angle",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "rad",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "deg",
    "name": "度",
    "symbol": "°",
    "cat": "angle",
    "factor": 0.017453292519943295,
    "test": {
      "value": 1,
      "to": "rad",
      "expected": 0.017453292519943295,
      "tolerance": 1e-09
    }
  },
  {
    "id": "gon",
    "name": "グラード",
    "symbol": "gon",
    "cat": "angle",
    "factor": 0.015707963267948967,
    "test": {
      "value": 1,
      "to": "rad",
      "expected": 0.015707963267948967,
      "tolerance": 1e-09
    }
  },
  {
    "id": "arcmin",
    "name": "角分",
    "symbol": "′",
    "cat": "angle",
    "factor": 0.0002908882086657216,
    "test": {
      "value": 1,
      "to": "rad",
      "expected": 0.0002908882086657216,
      "tolerance": 1e-09
    }
  },
  {
    "id": "arcsec",
    "name": "角秒",
    "symbol": "″",
    "cat": "angle",
    "factor": 4.84813681109536e-06,
    "test": {
      "value": 1,
      "to": "rad",
      "expected": 4.84813681109536e-06,
      "tolerance": 1e-09
    }
  },
  {
    "id": "turn",
    "name": "回転",
    "symbol": "turn",
    "cat": "angle",
    "factor": 6.283185307179586,
    "test": {
      "value": 1,
      "to": "rad",
      "expected": 6.283185307179586,
      "tolerance": 1e-09
    }
  },
  {
    "id": "bit",
    "name": "ビット",
    "symbol": "bit",
    "cat": "data",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "bit",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "byte",
    "name": "バイト",
    "symbol": "B",
    "cat": "data",
    "factor": 8,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "bit",
      "expected": 8.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "KiB",
    "name": "キビバイト",
    "symbol": "KiB",
    "cat": "data",
    "factor": 8192,
    "test": {
      "value": 1,
      "to": "bit",
      "expected": 8192.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "MiB",
    "name": "メビバイト",
    "symbol": "MiB",
    "cat": "data",
    "factor": 8388608,
    "test": {
      "value": 1,
      "to": "bit",
      "expected": 8388608.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "GiB",
    "name": "ギビバイト",
    "symbol": "GiB",
    "cat": "data",
    "factor": 8589934592,
    "test": {
      "value": 1,
      "to": "bit",
      "expected": 8589934592.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "kgm3",
    "name": "kg毎立方メートル",
    "symbol": "kg/m³",
    "cat": "density",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "kgm3",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "gcm3",
    "name": "g毎立方センチメートル",
    "symbol": "g/cm³",
    "cat": "density",
    "factor": 1000,
    "test": {
      "value": 1,
      "to": "kgm3",
      "expected": 1000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "lbft3",
    "name": "lb毎立方フィート",
    "symbol": "lb/ft³",
    "cat": "density",
    "factor": 16.01846337396,
    "test": {
      "value": 1,
      "to": "kgm3",
      "expected": 16.01846337396,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Pas",
    "name": "パスカル秒",
    "symbol": "Pa·s",
    "cat": "dynamicViscosity",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "Pas",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "P",
    "name": "ポアズ",
    "symbol": "P",
    "cat": "dynamicViscosity",
    "factor": 0.1,
    "test": {
      "value": 1,
      "to": "Pas",
      "expected": 0.1,
      "tolerance": 1e-09
    }
  },
  {
    "id": "cP",
    "name": "センチポアズ",
    "symbol": "cP",
    "cat": "dynamicViscosity",
    "factor": 0.001,
    "test": {
      "value": 1,
      "to": "Pas",
      "expected": 0.001,
      "tolerance": 1e-09
    }
  },
  {
    "id": "m2s",
    "name": "平方メートル毎秒",
    "symbol": "m²/s",
    "cat": "kinematicViscosity",
    "factor": 1,
    "test": {
      "value": 1,
      "to": "m2s",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "St",
    "name": "ストークス",
    "symbol": "St",
    "cat": "kinematicViscosity",
    "factor": 0.0001,
    "test": {
      "value": 1,
      "to": "m2s",
      "expected": 0.0001,
      "tolerance": 1e-09
    }
  },
  {
    "id": "cSt",
    "name": "センチストークス",
    "symbol": "cSt",
    "cat": "kinematicViscosity",
    "factor": 1e-06,
    "test": {
      "value": 1,
      "to": "m2s",
      "expected": 1e-06,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Bq",
    "name": "ベクレル",
    "symbol": "Bq",
    "cat": "radioactivity",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "Bq",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Ci",
    "name": "キュリー",
    "symbol": "Ci",
    "cat": "radioactivity",
    "factor": 37000000000,
    "test": {
      "value": 1,
      "to": "Bq",
      "expected": 37000000000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Gy",
    "name": "グレイ",
    "symbol": "Gy",
    "cat": "absorbedDose",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "Gy",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "radDose",
    "name": "ラド",
    "symbol": "rad",
    "cat": "absorbedDose",
    "factor": 0.01,
    "test": {
      "value": 1,
      "to": "Gy",
      "expected": 0.01,
      "tolerance": 1e-09
    }
  },
  {
    "id": "Sv",
    "name": "シーベルト",
    "symbol": "Sv",
    "cat": "equivalentDose",
    "factor": 1,
    "prefix": true,
    "test": {
      "value": 1,
      "to": "Sv",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "rem",
    "name": "レム",
    "symbol": "rem",
    "cat": "equivalentDose",
    "factor": 0.01,
    "test": {
      "value": 1,
      "to": "Sv",
      "expected": 0.01,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mcBlock",
    "name": "Minecraft block",
    "symbol": "block",
    "cat": "minecraftLength",
    "factor": 1,
    "note": "MFDCO基準: 1 block = 1 m",
    "test": {
      "value": 1,
      "to": "mcBlock",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mcChunk",
    "name": "Minecraft chunk",
    "symbol": "chunk",
    "cat": "minecraftLength",
    "factor": 16,
    "note": "1方向=16 blocks",
    "test": {
      "value": 1,
      "to": "mcBlock",
      "expected": 16.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mcRegion",
    "name": "Minecraft region",
    "symbol": "region",
    "cat": "minecraftLength",
    "factor": 512,
    "note": "1方向=32 chunks",
    "test": {
      "value": 1,
      "to": "mcBlock",
      "expected": 512.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mcTick",
    "name": "Minecraft tick",
    "symbol": "tick",
    "cat": "minecraftTime",
    "factor": 0.05,
    "note": "20 tick = 1 s",
    "test": {
      "value": 1,
      "to": "mcTick",
      "expected": 1.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "redstoneTick",
    "name": "Redstone tick",
    "symbol": "rt",
    "cat": "minecraftTime",
    "factor": 0.1,
    "note": "2 game ticks",
    "test": {
      "value": 1,
      "to": "mcTick",
      "expected": 2.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mcDay",
    "name": "Minecraft day",
    "symbol": "MC day",
    "cat": "minecraftTime",
    "factor": 1200,
    "note": "24000 tick = 20 min",
    "test": {
      "value": 1,
      "to": "mcTick",
      "expected": 24000.0,
      "tolerance": 1e-09
    }
  },
  {
    "id": "mcHour",
    "name": "Minecraft hour",
    "symbol": "MC h",
    "cat": "minecraftTime",
    "factor": 50,
    "note": "1 MC day / 24",
    "test": {
      "value": 1,
      "to": "mcTick",
      "expected": 1000.0,
      "tolerance": 1e-09
    }
  }
];

function prefixFactor(symbol){
  return PREFIXES.find(x=>x[0]===symbol)?.[2]??1;
}
function categoryName(cat){return CATEGORY_NAMES[cat]||cat}
function getBuiltIn(id){return BUILTIN_UNITS.find(u=>u.id===id)||null}
function unitDisplay(u){return `${u.name} (${u.symbol})`}

function toKelvin(v,u){
  if(u.tempScale==="K")return v;
  if(u.tempScale==="C")return v+273.15;
  if(u.tempScale==="F")return (v-32)*5/9+273.15;
  if(u.tempScale==="R")return v*5/9;
  return v;
}
function fromKelvin(k,u){
  if(u.tempScale==="K")return k;
  if(u.tempScale==="C")return k-273.15;
  if(u.tempScale==="F")return (k-273.15)*9/5+32;
  if(u.tempScale==="R")return k*9/5;
  return k;
}
function convertValue(value,from,to,fromPrefix="",toPrefix=""){
  if(!from||!to)throw new Error("単位が指定されていません");
  if(from.cat!==to.cat)throw new Error("異なる種類の単位は変換できません");
  value=Number(value);
  if(!Number.isFinite(value))throw new Error("値が数値ではありません");
  if(from.cat==="temperature"){
    return fromKelvin(toKelvin(value,from),to);
  }
  const af=from.prefix?prefixFactor(fromPrefix):1;
  const bf=to.prefix?prefixFactor(toPrefix):1;
  return value*af*from.factor/(bf*to.factor);
}
function factorText(u){
  if(u.cat==="temperature"){
    if(u.tempScale==="K")return "K基準";
    if(u.tempScale==="C")return "K = °C + 273.15";
    if(u.tempScale==="F")return "K = (°F − 32)×5/9 + 273.15";
    if(u.tempScale==="R")return "K = °R×5/9";
  }
  const base=BUILTIN_UNITS.find(x=>x.cat===u.cat&&Math.abs(x.factor-1)<1e-30);
  return `1 ${u.symbol} = ${Number(u.factor.toPrecision(10))} ${base?.symbol||"基準単位"}`;
}
function compatibleUnits(unit,custom=[]){
  if(!unit)return[];
  return [...BUILTIN_UNITS,...custom].filter(u=>u.cat===unit.cat);
}

global.MFDCOUnits={
  version:"3.6",PREFIXES,CATEGORY_NAMES,BUILTIN_UNITS,
  prefixFactor,categoryName,getBuiltIn,unitDisplay,
  convertValue,factorText,compatibleUnits,
  missingTests:()=>BUILTIN_UNITS.filter(u=>!u.test),
  testCoverage:()=>BUILTIN_UNITS.length?BUILTIN_UNITS.filter(u=>u.test).length/BUILTIN_UNITS.length:1
};
})(typeof window!=="undefined"?window:globalThis);
