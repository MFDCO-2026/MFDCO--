# MFDCO Country v20.2

## MFDCOアカウント共同編集
- 国家所有者と共同編集者をSupabase Auth + `public.profiles` のMFDCOアカウントへ紐付け。
- 共同編集検索のRPC/JS引数不一致を修正。
- 検索結果の `user_id` 参照ミスを修正。
- owner/admin/editor/viewer の権限境界をサーバーRPCで固定。
- owner: admin/editor/viewer管理可。
- admin: editor/viewerのみ管理可。
- editor: 内容編集可、メンバー管理不可。
- viewer: 閲覧のみ。
- メンバー直接書込み権限を削除し、招待/権限変更/削除/退出をRPC化。
- 共同編集国をダッシュボードへ表示。

## 容量
- 既定 1アカウント500MiB / 1国家250MiB / 1ファイル25MiB。
- country-mediaだけでなくcountry-assetsと非公開バックアップもアカウント利用量へ統合。
- 共同編集者のアップロードは本人のアカウント枠 + 国家枠の両方を消費。
- `country_account_limits` で将来の個別上限変更に対応。
- 管理画面/ダッシュボードに使用量表示を追加。

## 軽量化
- v20 document 512KiB、entity/link 128KiBのJSON payloadガードを追加。
- 大容量ファイルはStorage/IndexedDBへ分離する方針をDB側でも保証。
