# Deploy v20.2

## v20.1から更新
1. Webファイルをv20.2へ上書き。
2. Supabase SQL Editorで `MFDCO_country_v20_2_collaboration_incremental.sql` を全文実行。
3. `country-dashboard.html` と `country-manage.html` をCtrl+F5で一度再読込。

## 新規/DBを統合する場合
`MFDCO_country_supabase_COMPLETE_v21.sql` を使用。
追加SQLを別途実行する必要はありません。

## 動作確認
- 国家管理 -> MFDCO活動名で別アカウントを検索。
- editorで招待。
- 相手のダッシュボードで招待を受理。
- 相手の「共同編集中の国家」に国家が表示。
- editorは編集可能、メンバー管理不可。
- 管理画面で国家容量と自分のMFDCOアカウント容量が別々に表示。
