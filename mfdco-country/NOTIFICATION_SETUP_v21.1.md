# MFDCO 外部通知セットアップ v21.1

Web/DBだけでサイト内通知ベルと通知設定は動作します。
スマホ・PCのWeb Pushと登録メールへの実送信には以下を1回設定します。

1. VAPIDキーを生成し、公開鍵を `js/country-site-config.js` の `pushPublicKey` へ設定。
2. Supabase Secrets:
   - MFDCO_VAPID_PUBLIC_KEY
   - MFDCO_VAPID_PRIVATE_KEY
   - MFDCO_VAPID_SUBJECT (例 mailto:admin@mfdco.net)
   - RESEND_API_KEY
   - MFDCO_FROM_EMAIL
   - MFDCO_SITE_URL=https://mfdco.net
3. `supabase functions deploy mfdco-notification-dispatch`
4. Supabase Cron等からこのFunctionを1～5分間隔で呼び出す。

注意: SERVICE_ROLE_KEYやVAPID秘密鍵、ResendキーをWeb JavaScriptへ入れないでください。
