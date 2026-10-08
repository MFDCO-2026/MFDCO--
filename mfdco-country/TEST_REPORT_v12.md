# TEST REPORT v12

- JavaScript: 全45ファイル `node --check` 通過。
- HTML: 34ページ。ローカルCSS/JS参照は既存サイト資産 `assets/logo.png` を除き欠落なし。
- HTTP: `country.html`, `country-arsenal.html`, `country-rights.html`, `country-media.html`, `country-edit.html`, `countries.html` がローカルHTTP 200。
- 正式採用: branch_names / unit_names の複数選択保存に対応し、legacy branch_name / unit_nameも先頭値を維持。
- 表: 原則nowrap＋横スクロール。短い状態値の不自然な折返しを防止。
- GDP: 公開ページの概要/経済/右情報欄をcompact notationへ変更。
- 右情報欄: 国章を削除し、主要情報のみ。
- 素材配布: 専用private bucket `country-assets`、allow/deny/approvalのRLS/RPCを追加。
- メール: Edge Functionソース生成済み。実送信はSupabase Function deployとResend secret設定後に本番確認が必要。

未実施: 本番SupabaseへのSQL適用、Edge Function実deploy、実メール送信。
