# MFDCO Country Operations v6

MFDCOの国家設定・国家運営・外交・軍事・資料Wikiを統合したフロントエンド＋Supabaseモジュールです。

## Main pages
- `countries.html` — 公開国家一覧 / 検索 / 作成導線
- `country-dashboard.html` — 所有国、通知、共同編集招待
- `country-templates.html` — 新規国家テンプレート
- `country.html` — Wiki風の国家公開資料
- `country-edit.html` — 国家設定の統合編集
- `country-stats.html` — 国家資料・図表
- `country-wiki.html` / `country-article.html` — Wikiサブページ
- `country-post-edit.html` / `country-post.html` / `country-feed.html` — 国家ニュース
- `country-strength.html` — 国家力・整合性分析
- `country-exchange.html` — 同盟・条約・貿易等
- `country-organizations.html` — 国際機関
- `country-systems.html` — 教育・医療・税制等の国家基盤
- `country-map.html` — 地図ツール連携データ
- `country-arsenal.html` — MFDCO Work正式採用装備
- `country-manage.html` — 権限・履歴・容量・バックアップ・削除
- `country-compare.html` — 最大4国家比較

## Local / Cloud dual mode
`window.supabaseClient` が存在しない場合は localStorage を利用するため、ローカルサーバだけでもUIを確認できます。
本番MFDCOでは既存の `js/supabase-config.js` を使用してください。この配布物の同名ファイルは認証情報を含まない安全なフォールバックです。

## Limits (default proposal)
- 1アカウント: 所有国家5件
- 1国家メディア: 250 MiB
- 1アップローダー: 500 MiB
- 1ファイル: 25 MiB
- 変更履歴: 30世代
- 可変レコード: 1国家5000件

## National power
国家力は100点満点ではなく上限なしです。
- 70+: 中堅国級
- 100+: 先進国の目安
- 125+: 主要先進国級
- 150+: 超大国の目安
- 180+: 超大国級

これはMFDCO内の設定比較用の目安です。年代・技術体系・世界観に応じて相対的に扱います。
