# MFDCO Country Operations v9 — ホームページ統合

## 接続対象
- `index.html`: 国家運営紹介 + 最新公開国家3件
- `header.html / js/header.js`: 国家運営・国家ニュース・国家比較・サイト検索を正式導線化
- `mypage.html`: ユーザーが運営する公開国家一覧とダッシュボード導線
- `members.html`: 加盟メンバーの国家運営件数バッジ
- `works.html`: 作品カードに国家正式採用数（DOMにwork idがある場合）
- `work.html`: 正式採用国一覧
- `search.html`: 国家・提供作品・加盟メンバーの横断検索
- `country-map.html`: 地図ツール未導入フォールバック。現在はJSON連携＋`tools.html`への導線。

## 地図ツールURL
`js/country-site-config.js` の `mapToolUrl` は現在空です。導入時のみ、既存ツール構造に合わせて例 `tools/MFDCO_xxx/index.html` を設定してください。空の場合は壊れたURLを表示せず `tools.html` へ戻します。

## 導入
1. v8未導入: `MFDCO_country_supabase_v9.sql`
2. v8導入済み: `supabase/10_country_v9_site_integration.sql` のみ
3. 既存本体の `js/supabase-config.js` を使用
4. `css/site-country-integration.css`, `js/country-site-config.js`, `js/site-country-integration.js` を配置
5. ヘッダー差分を反映

## 概念の区別
`members.html` の「加盟国」はMFDCO加盟メンバー/プロフィールです。`countries.html` は一人最大5件作成できる架空国家で、別概念として維持します。
