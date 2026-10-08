# Deploy v20.3

## 既存v20.2環境
1. `MFDCO_country_v20_3_auth_incremental.sql` をSupabase SQL Editorで実行。
2. v20.3 Webファイルへ上書き。
3. Ctrl+F5。

## DBを最初から整理する場合
`MFDCO_country_supabase_COMPLETE_v21.2.sql` を使用。

## 確認
- MFDCOログアウト → 国家作成ボタンなし。
- MFDCOログアウト → 公開国家に編集/管理ボタンなし。
- 別MFDCOアカウント → 他人の国家に編集/管理ボタンなし。
- owner/admin/editor → 権限に応じた編集メニューが表示。
- 国家ページ → 所有者MFDCOアカウントが表示。
