/* MFDCO Tools v2.6 language syntax registry */
(function(global){
"use strict";
const constructs=[
{id:"print",label:"print",category:"出力",kind:"statement",syntax:"print(value)",insert:'print("text", value)',description:"値や文字列を実行ログへ出力します。",example:'print("速度", v)',test:{code:'print("ok", 5)',expectLog:"ok : 5"}},
{id:"plot",label:"plot",category:"グラフ",kind:"statement",syntax:"plot(x, expr1, ..., xmin, xmax)",insert:"plot(x, sin(x), -180, 180)",description:"式をサンプリングして結果ページへグラフを出力します。",example:"plot(x, sin(x), cos(x), -180, 180)",test:{code:"plot(x, x^2, -2, 2)",expectPlots:1}},
{id:"if",label:"if",category:"制御構文",kind:"block",syntax:"if condition:",insert:"if x > 0:\n  print(x)",description:"条件が真のときブロックを実行します。",example:"if x > 0:\n  print(x)",test:{code:"x=1\nif x > 0:\n  print(1)",expectLog:"1"}},
{id:"else",label:"else",category:"制御構文",kind:"block",syntax:"else:",insert:"if x > 0:\n  print(x)\nelse:\n  print(0)",description:"直前の if が偽のとき実行します。",example:"if x > 0:\n  print(x)\nelse:\n  print(0)",test:{code:"x=-1\nif x > 0:\n  print(1)\nelse:\n  print(0)",expectLog:"0"}},
{id:"for",label:"for",category:"制御構文",kind:"block",syntax:"for i = start to end:",insert:"for i = 1 to 10:\n  print(i)",description:"開始値から終了値まで整数カウンタで繰り返します。",example:"for i = 1 to 3:\n  print(i)",test:{code:"s=0\nfor i = 1 to 3:\n  s=s+i\nprint(s)",expectLog:"6"}},
{id:"while",label:"while",category:"制御構文",kind:"block",syntax:"while condition:",insert:"while x < 10:\n  x = x + 1",description:"条件が真の間、ガード上限まで繰り返します。",example:"x=0\nwhile x < 3:\n  x=x+1\nprint(x)",test:{code:"x=0\nwhile x < 3:\n  x=x+1\nprint(x)",expectLog:"3"}},
{id:"and",label:"and",category:"論理演算",kind:"operator",syntax:"a and b",insert:" and ",description:"論理積です。",example:"x > 0 and y > 0",test:{expression:"1 < 2 and 2 < 3",expected:true}},
{id:"or",label:"or",category:"論理演算",kind:"operator",syntax:"a or b",insert:" or ",description:"論理和です。",example:"x == 0 or y == 0",test:{expression:"1 > 2 or 2 < 3",expected:true}},
{id:"not",label:"not",category:"論理演算",kind:"operator",syntax:"not a",insert:"not ",description:"論理否定です。",example:"not x == 0",test:{expression:"not 1 == 2",expected:true}},
{id:"eq",label:"==",category:"比較演算",kind:"operator",syntax:"a == b",insert:" == ",description:"等しいか比較します。",example:"x == 10",test:{expression:"2 == 2",expected:true}},
{id:"ne",label:"!=",category:"比較演算",kind:"operator",syntax:"a != b",insert:" != ",description:"等しくないか比較します。",example:"x != 0",test:{expression:"2 != 3",expected:true}},
{id:"lt",label:"<",category:"比較演算",kind:"operator",syntax:"a < b",insert:" < ",description:"小さいか比較します。",example:"x < 10",test:{expression:"2 < 3",expected:true}},
{id:"gt",label:">",category:"比較演算",kind:"operator",syntax:"a > b",insert:" > ",description:"大きいか比較します。",example:"x > 10",test:{expression:"3 > 2",expected:true}},
{id:"le",label:"<=",category:"比較演算",kind:"operator",syntax:"a <= b",insert:" <= ",description:"以下か比較します。",example:"x <= 10",test:{expression:"2 <= 2",expected:true}},
{id:"ge",label:">=",category:"比較演算",kind:"operator",syntax:"a >= b",insert:" >= ",description:"以上か比較します。",example:"x >= 10",test:{expression:"2 >= 2",expected:true}}
,
  {
    id:"elif",label:"elif",category:"制御構文",kind:"block",
    syntax:"elif condition:",
    insert:"elif x < 0:\n  print(\"negative\")",
    description:"直前の if / elif が成立しなかった場合に追加条件を判定します。",
    example:"if x > 0:\n  print(\"positive\")\nelif x < 0:\n  print(\"negative\")\nelse:\n  print(\"zero\")",
    test:{code:"x=-1\nif x>0:\n  print(\"p\")\nelif x<0:\n  print(\"n\")\nelse:\n  print(\"z\")",expectLog:"n"}
  },
  {
    id:"break",label:"break",category:"制御構文",kind:"statement",
    syntax:"break",insert:"break",
    description:"最も内側のループを終了します。",
    example:"for i = 1 to 10:\n  if i == 4:\n    break\n  print(i)",
    test:{code:"for i = 1 to 5:\n  if i == 3:\n    break\n  print(i)",expectLog:"1"}
  },
  {
    id:"continue",label:"continue",category:"制御構文",kind:"statement",
    syntax:"continue",insert:"continue",
    description:"現在の反復を終了し、次の反復へ進みます。",
    example:"for i = 1 to 5:\n  if i == 3:\n    continue\n  print(i)",
    test:{code:"for i = 1 to 3:\n  if i == 2:\n    continue\n  print(i)",expectLog:"1"}
  },
  {
    id:"def",label:"def",category:"関数",kind:"block",
    syntax:"def name(arg1, arg2):",
    insert:"def add(a, b):\n  return a + b",
    description:"ユーザー定義関数を作成します。",
    example:"def square(x):\n  return x^2\nprint(square(5))",
    test:{code:"def square(x):\n  return x^2\nprint(square(5))",expectLog:"25"}
  },
  {
    id:"return",label:"return",category:"関数",kind:"statement",
    syntax:"return expression",insert:"return value",
    description:"ユーザー定義関数から値を返します。",
    example:"def add(a,b):\n  return a+b",
    test:{code:"def add(a,b):\n  return a+b\nprint(add(2,3))",expectLog:"5"}
  }];
function get(id){return constructs.find(x=>x.id===id)||null}
function byCategory(category){return constructs.filter(x=>x.category===category)}
function categories(){return [...new Set(constructs.map(x=>x.category))]}
function missingTests(){return constructs.filter(x=>!x.test)}
function coverage(){return constructs.length?constructs.filter(x=>x.test).length/constructs.length:1}
global.MFDCOLanguage={version:"3.4",constructs,get,byCategory,categories,missingTests,coverage};
})(typeof window!=="undefined"?window:globalThis);