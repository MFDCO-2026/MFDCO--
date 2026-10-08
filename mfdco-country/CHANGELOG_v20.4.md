# MFDCO Country v20.4

- Country側の空 `js/supabase-config.js` を廃止。
- 全Countryページが `https://mfdco.net/js/supabase-config.js` を直接使用。
- MFDCOホームでログインしたSupabaseセッションを同じmfdco.net originで共有。
- Countryヘッダー右側にログイン中のMFDCO活動名/アイコンを表示。
- 未ログイン時はヘッダーに「ログイン」を表示。
- 国家作成ボタンを常時表示し、ログイン状態を明示。
- ログイン済みMFDCOアカウントなら国家作成へ、未ログインならMFDCOログインへ。
- `mfdcoAccount()` は本体Supabase clientの初期化を最大5秒待つ。
- SQLをゼロから実行できる一括完全版v22として再梱包。
