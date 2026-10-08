# MFDCO 国家運営 v7 テストレポート

実施日: 2026-10-05

## 自動チェック

- JavaScript: `node --check` を `js/*.js` と `integration/*.js` の全ファイルへ実行し、構文エラーなし。
- HTML参照: 各HTMLから参照するローカルCSS/JSについて存在確認し、欠落なし。
- HTTP配信: ローカルHTTPサーバから主要ページを取得し、すべて HTTP 200。
  - countries.html
  - country.html
  - country-edit.html
  - country-feed.html
  - country-post-edit.html
  - country-rights.html
  - country-regions.html
  - country-geography.html
  - country-strength.html
- 共通ヘッダーの index.html / works.html / members.html 等はMFDCO本体側のページで、この単体パッケージには含めていない。

## v7重点確認

- 総人口・年齢人口・行政区人口・都市人口の表示を万人単位へ統一（保存値は人）。
- 日本サンプルに令和7年度食料自給率サンプル（カロリー37%、生産額66%、摂取熱量45%）を設定。
- 食料・エネルギー安全保障、任意追加指標を国家設定へ追加。
- ニュース投稿: タイトル、リード、本文、詳細、関連URL、プレビュー画像、公開/下書き。
- 国家利用条件: 登場可否、報告/申請、クレジット、商用利用、設定改変、敗戦・破壊、国旗/国歌利用。
- 要申請国家への利用申請、管理者承認/拒否をSQL/RPC/RLSで実装。
- 行政区詳細: 人口、面積、特産、産業、文化、遺跡・史跡、気候、緯度経度、画像。
- 標準時: 基準都市、緯度経度、経度からUTC/GMT差を自動算出、標準時子午線を自動算出、手動上書き。
- 都市: 行政区、人口、緯度経度、概要を登録。
- Supabaseスキーマバージョンを7へ更新。

## SQLについて

SQLは静的確認済みだが、この環境からユーザーの本番Supabaseへ実行していないため、実DBでのPostgreSQL実行/RLS動作確認は未実施。新規導入は `supabase/01_country_module_v7.sql`、v6からは `supabase/07_country_v7_features.sql`、導入後は `supabase/08_v7_diagnostics.sql` を使用する。

## 添付資料について

今回のユーザーメッセージで言及された国家設定資料は、会話ファイル一覧およびLibrary上で今回の添付として特定できなかったため、資料固有の値の転記は未実施。代わりに、食料自給率・エネルギー・任意指標・行政区詳細・都市/標準時など、資料から不足項目を取り込める受け皿をv7へ追加済み。
