# Deploy v17.3

1. サイトファイルをv17.3へ上書き。
2. 既に complete v18 を適用済みなら `MFDCO_country_v17_3_incremental.sql` をSupabase SQL Editorで実行。
3. DBを最初から整理して適用する場合は `MFDCO_country_supabase_COMPLETE_v19.sql` を使用。
4. 配置後、Chromeで一度 Ctrl+F5 を推奨。

## SQLが必要な理由
正式採用の作品一覧検索RPCと、世界経済の旧履歴行を新しい1時間モデルで上書き補完するRPC更新を含みます。

歴史階層・高速道路・鉄道は既存の `country_records` を利用するため、新テーブル追加はありません。
