# MFDCO Country v20.3

- MFDCO本体のSupabase Auth + `profiles` をCountryの唯一のアカウント基準に統一。
- ログアウト中は国家作成ボタンを非表示。
- `country-templates` はMFDCOアカウントなしでは国家を作成できない。
- 新規国家はテンプレート選択時にSupabaseへ作成して所有者を確定。
- 公開国家ページの編集/管理ボタンを権限保持者だけに表示。
- Countryヘッダーの「編集・管理」も owner/admin/editor のみ表示。
- editorは編集系、owner/adminは管理まで表示。
- URL直打ちでも主要編集画面が権限確認して停止。
- `role()` のローカルownerフォールバックを廃止。
- ログアウト中/別アカウント時のローカルキャッシュによる編集誤認を廃止。
- 国家ページに国家所有者のMFDCOアカウント情報を表示。
- 所有者プロフィールへのリンクは `https://mfdco.net/mypage.html?id=...`。
- DB側も国家作成とrole判定をMFDCOプロフィール必須に強化。

容量制限はv20.2のMFDCOアカウント500MiB / 国家250MiB / 1ファイル25MiBを継続します。
