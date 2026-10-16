# MFDCO Country v21.1

- 設定専用画面 `country-settings.html` を追加。
- 通知・利用条件既定値・所有国家の公開管理を集約。
- Headerへ通知ベル・未読件数・通知プレビュー・設定リンクを追加。
- 編集画面へ大きな「国家を公開」導線を追加。
- 公開は `country-publish.html` で利用条件を確認してから実行。
- 所有国家の一括公開/一括非公開、既定利用条件一括適用を追加。
- 新規国家にはアカウントの既定利用条件を自動適用。
- Web Push購読・配信キュー・Service Worker・Edge Function雛形を追加。
- 登録メール通知はSupabase Authのメールをサーバー側だけで取得。
- DB v26.0でaccount settings / push subscription / delivery queue / publish RPCを統合。
