# Deploy v20.7

既存環境:
1. `MFDCO_country_v23.6_dashboard_owner_HOTFIX.sql` を全文実行。
2. v20.7 Web差分を上書き。
3. Ctrl+F5。
4. `country-dashboard.html` を再確認。

DBを0から構築:
- `MFDCO_country_supabase_FRESH_COMPLETE_v23.6.sql`

修正後、所有国家は `countries.owner_id = 現在のMFDCOアカウントID` で必ず表示されます。
