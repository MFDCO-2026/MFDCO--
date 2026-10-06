# MFDCO Country Operations v6 deployment

## 1. Backup first
Supabase SQL Editorで本番DBへ適用する前にバックアップを取得してください。
このコードは既存の `auth.users`, `public.profiles`, `public.works`, `window.supabaseClient` を利用します。

## 2A. Fresh install
Supabase SQL Editorで次を1回実行します。

`supabase/01_country_module_v6.sql`

## 2B. Existing v5 install
既にv5のCountry Operations SQLを適用済みなら、次だけを実行します。

`supabase/05_country_v6_features.sql`

## 2C. Earlier v4 install
1. `supabase/03_country_v5_integrations.sql`
2. `supabase/05_country_v6_features.sql`

## 3. Diagnostics
適用後、`supabase/06_v6_diagnostics.sql` を実行し、必要なテーブル・RPC・RLSが存在することを確認します。

## 4. Frontend
MFDCOサイトの同じ階層へHTMLを配置し、`css/country.css` と `js/country-*.js` を配置します。
既存サイトの `js/supabase-config.js` が `window.supabaseClient` を生成する構成を維持してください。

配布物内の `js/supabase-config.js` はURL/anon keyを含みません。本番の既存ファイルで置き換えるか、既存ファイルをそのまま残してください。

## 5. Header
v6同梱の `header.html` / `js/header.js` では「国家運営」を有効化済みです。
既存ヘッダーとの差分だけ取り込む場合は、国家運営のリンクを `countries.html` にしてください。

## 6. Storage
SQLはPrivate bucket `country-media` とRLSを作成します。フロントは署名URLを発行して閲覧します。
ファイルパスは `{country_id}/{user_id}/...` を使用します。

## 7. Work integration
`integration/work-country-adoptions.js` を作品ページへ追加すると、国家として正式採用している国を表示できます。
`country-arsenal.html` では approved Workを検索し、軍種・部隊・制式名称と紐付けます。

## 8. Map bridge
`country-map.html` は `MFDCO_MAP_DATA` version 1 JSONを入出力します。
戦闘シミュレーター側では `country`, `points[]`, `lat/lon`, `x/y`, `type`, `summary` を読めば接続できます。

## 9. Recommended deployment order
1. DB backup
2. SQL v6
3. diagnostics
4. `css/country.css`
5. `js/country-core.js`, `country-cloud.js`, `country-v6.js`
6. 各ページ用JS
7. HTML
8. Header link
9. Work adoption integration
10. ログイン/ログアウト/匿名閲覧の3パターンでRLSテスト

## Important
SQLはこのチャット側から本番Supabaseへ実行していません。まずステージングまたはバックアップ後の本番環境で実行してください。
