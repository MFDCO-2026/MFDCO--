# MFDCO Country Operations v11 deployment

## 1. バックアップ
Supabase DBと現在のWebファイルをバックアップしてください。

## 2. SQL
### v10まで導入済み
`MFDCO_country_v11_incremental.sql` をSQL Editorで実行します。

### まだ国家運営SQLを導入していない
`MFDCO_country_supabase_v11.sql` を使用します。

実行後、`supabase/13_v11_diagnostics.sql` で確認してください。

## 3. Webファイル
v11一式を既存MFDCOサイトと同じ階層へ配置します。
既存の `js/supabase-config.js` は上書きせず、そのまま利用してください。

v11では特に次を更新します。
- `css/country.css`
- `js/country-core.js`
- `js/country-cloud.js`
- `js/country-v11.js`
- `js/country-edit-v11.js`
- `js/country-view-v11.js`
- `js/countries-v11.js`
- `country-edit.html`
- `country.html`
- `countries.html`

## 4. 日次市場
市場シミュレーションは外部相場APIではありません。
日付＋世界テーマ＋国家/企業データから決定論的に計算するMFDCO内部シミュレーションです。
OFF時は入力した基準為替・株価指数のままです。

Supabase環境では `mfdco_public_market_snapshots()` が公開国家の市場計算用スナップショットを返します。

## 5. 空欄自動補完
補完は既存値を上書きしません。補完後はユーザーが通常の入力として編集可能です。
本番公開前に自動補完値を確認してください。

## 6. 地図ツール
地図ツールは未導入のため従来どおり `MFDCO_MAP_DATA v1` のJSON連携を維持します。固定の未実装URLは追加しません。

## 7. 推奨確認
1. ログアウト匿名公開閲覧
2. ログイン所有者の保存
3. editor権限の保存
4. 国家5件制限
5. 大量レコード保存
6. Private Storage画像
7. 市場ON/OFF
8. 空欄自動補完後の保存
9. 外交・正式採用Workリンク
10. モバイルで14カテゴリ目次
