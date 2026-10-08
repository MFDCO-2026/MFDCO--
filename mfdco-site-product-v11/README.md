# MFDCO Country Operations v11

MFDCO本体へ接続する国家設定・国家運営システムです。

## 主な入口
- `countries.html` — 国家一覧＋本日の世界市場テーマ
- `country.html?id=...` — 公開国家資料
- `country-edit.html?id=...` — 14カテゴリ統合編集
- `country-dashboard.html` — 運営ダッシュボード
- `country-feed.html` — 国家ニュース
- `country-exchange.html` — 外交・条約
- `country-arsenal.html` — 正式採用装備
- `country-strength.html` — 国家力・整合性
- `country-stats.html` — 図表
- `country-wiki.html` — Wiki記事

## v11の中心機能
詳細は `CHANGELOG_v11.md` を参照してください。日次経済シミュレーション、空欄自動補完、国際指標・財政・教育・福祉・治安・資源・環境・交通・文化財等を追加しています。

## データ保存
ローカルプレビュー時はlocalStorage、本番では既存の `window.supabaseClient` を使用します。
大量レコードは `country_records` へ分離します。

## Supabase
- 新規/既存v10から統合して入れる: `MFDCO_country_supabase_v11.sql`
- 既にv10導入済み: `MFDCO_country_v11_incremental.sql`
- 確認: `supabase/13_v11_diagnostics.sql`

## 注意
`js/supabase-config.js` は本番サイトの既存設定を使用してください。URL/anon keyを配布物へ固定していません。
`assets/logo.png` 等のMFDCO本体共通資産は既存ホームページ側のものを利用します。
