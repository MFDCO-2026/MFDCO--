# MFDCO パスワード再設定機能 — 導入手順

このZIPは、2026-09-17に保存されていた `join.html` を基に作成した追加差分です。運用中のファイルに後から変更がある場合、`join.html` の丸ごと上書きではなく、下記のリンクとCSS読み込みだけを統合してください。

## 1. 公開ディレクトリに配置

```text
MFDCOサイトのルート/
  join.html                      ← リンクとCSS読み込みを追加した版
  forgot-password.html           ← 新規
  reset-password.html            ← 新規
  css/password-recovery.css      ← 新規
  js/password-recovery.js        ← 新規
```

**既存の `js/supabase-config.js`、`js/join.js`、`css/join.css`、`js/header.js`、`js/main.js` は変更しません。**

手動で `join.html` へ取り込む場合、`</form>`（ログイン用フォーム）の直後に以下を追加：

```html
<p class="mfdco-forgot-link-row">
  <a href="forgot-password.html" class="mfdco-forgot-link">パスワードを忘れた場合</a>
</p>
```

また、`<head>` に追加：

```html
<link rel="stylesheet" href="css/password-recovery.css">
```

## 2. Supabase Auth の設定

Supabase Dashboard → Authentication → URL Configuration

- Site URL: `https://mfdco.net` （MFDCOの実運用ドメインがこのURLの場合）
- Redirect URLs: `https://mfdco.net/reset-password.html` を**完全一致**で追加
- www ありで運用する場合は対応するURLも追加。`www` と非 `www` は別URL
- `https://mfdco.net/forgot-password.html` は一般公開の入力画面なので、Redirect URLs登録は不要

Supabase Dashboard → Authentication → Email Templates → Reset Password

- 既定のリンク `{{ .ConfirmationURL }}` をそのまま使用する場合、テンプレート改変は不要です。
- カスタムテンプレートに変更済みなら、検証URLや `redirect_to` を破壊していないか確認してください。
- ブランディングする場合、件名を `MFDCO | パスワード再設定` とし、本文リンクは `<a href="{{ .ConfirmationURL }}">パスワードを再設定する</a>` を使えます。`{{ .ConfirmationURL }}` の中身はSupabaseの正式な認証URLです。
- `js/supabase-config.js` のAuth初期化はメールリンクを処理するため `detectSessionInUrl: true`（デフォルト）である必要があります。

## 3. メール送信

- メールパスワード方式で登録したユーザー向けに動作します（Google/GitHubのみのユーザーは別途対応が必要な場合があります）。
- Supabaseの標準メール送信は試用向けで制限があります。本番は Dashboard → Authentication → SMTP Settings からカスタム SMTP を設定することを推奨します。
- Supabaseの送信回数制限、トークン有効期限、Bot保護設定も確認してください。

## 4. 動作確認

1. サイトを公開した後、`https://mfdco.net/join.html` から「パスワードを忘れた場合」をクリック。
2. テスト用の登録メールアドレスを入力して送信。
3. 受信メールのリンクから `https://mfdco.net/reset-password.html` に戻ることを確認。
4. 新しいパスワードを2回入力して更新。
5. `join.html` に戻り、新しいパスワードでログイン可能なことを確認。
6. 未登録メールアドレスでも画面に登録有無が表示されないことを確認。
7. 無効な認証リンクで再設定入力フォームが開かないことを確認。

## 5. 注意

- **このZIPにSupabase接続キーは同梱していません。** 公開側は既存の `js/supabase-config.js` で初期化される `window.supabaseClient` を使います。
- ブラウザに secret/service_role key を置かないでください。
- Authのメール送信・URL・公開サイトの設定は現時点で変更していません。利用者側でダッシュボード設定と配置を行ってください。
- 既存サイトのヘッダー等に再設定画面への自動遷移やログイン必須ガードを入れている場合は、`reset-password.html` を**未ログインでも閲覧可能**な例外にしてください。ただし新パスワード登録は有効な回復セッション取得後に限ります。
- パスワード変更後は `signOut()` でセッション終了を試みます。短期間は既存のアクセストークンが有効なこともあるため、重要な機能はサーバー側の認証状態・権限確認を維持してください。
