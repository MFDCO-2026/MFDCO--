# Deploy v17.2

## 1. Web files
`mfdco-site-product-v17.2/` の内容で現在の国家モジュールを上書きしてください。
主要変更ファイル:
- country-edit.html / js/country-edit-v17.js
- country-history.html / js/country-history.js
- country-organizations.html / js/country-organizations.js
- country-market.html / js/country-market.js
- country-exchange.html / js/country-exchange.js
- country-dashboard.html / js/country-dashboard.js
- js/country-cloud.js
- css/country.css

対象ページには `?v=17.2` を付けて旧キャッシュとの混在を防いでいます。

## 2. Supabase
既存DBを更新する場合は SQL Editor で:
`MFDCO_country_v17_2_incremental.sql`
を1回実行してください。

新規構築用の統合版:
`MFDCO_country_supabase_v17.2.sql`

## 3. 確認
1. 国家編集 > 財政・金融 > 税制を開き、＋追加後も税制が開いたままか。
2. 国家編集 > 歴史・軍事・外交 > 年表専用編集を開き、イベント一覧が編集できるか。
3. 国際機関で創設国を含め脱退できるか。最後の1国で削除確認が出るか。
4. 未ログインで世界経済を開き、168時間チャートが出るか。
5. ログイン後に世界経済/ダッシュボードを開き、保存済み履歴が補完されるか。
6. 外交提案でアクティブ国家が初期表示され、別の管理国家へ変更できるか。
