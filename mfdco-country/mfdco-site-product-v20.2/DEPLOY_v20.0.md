# Deploy v20.0 Foundation

## 1. ファイル
v20.0 全体版で国家モジュールを上書き。

## 2. Supabase
既に COMPLETE v19 を適用済み:
- `MFDCO_country_v20_foundation_incremental.sql` を1回実行。

新規/整理して適用:
- `MFDCO_country_supabase_COMPLETE_v20.sql` を使用。

## 3. 確認
- Countryヘッダーの MFDCO から index.html に戻れる。
- ダッシュボード/編集画面から「国家運営・計画」を開ける。
- 予算/人口/需給を保存できる。
- 行政区等のエンティティを追加・保存できる。
- 国家管理画面で IndexedDB 使用状況が表示される。
- ログイン中は「非公開クラウド保管」が利用できる。

## 注意
v20.0 は非破壊移行の第1段階。
既存 core_data / country_records はこの版では削除しません。
