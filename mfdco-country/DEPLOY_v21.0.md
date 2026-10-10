# Deploy v21.0

## Web
`MFDCO_country_full_v21.0_COMPLETE.zip` のCountryファイルを上書きしてください。
MFDCO本体の work.html / works.html / account関連ファイルは含みません。

## DB
0から構築する場合は `MFDCO_country_supabase_FRESH_COMPLETE_v25.0.sql` を全文実行してください。
既存DBにも再適用可能な IF NOT EXISTS / DROP→CREATE / schema guard を含みます。

## 配置後
1. Ctrl+F5
2. country-dashboard.html を開く
3. Header右側のMFDCOアカウントを確認
4. Dashboardの経済・ニュース・国際機関・国家運営リンクを確認
5. `MFDCO_country_v25_DIAGNOSTICS.sql` を実行し不足オブジェクトがないことを確認
