# MFDCO Country データ構造 v21

## MFDCOアカウントとの関係
- `auth.users.id` がログインID。
- `public.profiles.id` が同じUUIDを持つ場合を Country で利用できるMFDCOアカウントとして扱う。
- 国家所有者・共同編集者はいずれもMFDCOアカウントに紐づく。
- メールアドレスはCountry共同編集画面へ公開しない。活動名とUUIDのみ利用。

## 国家と共同編集
- `countries.owner_id` : 唯一の所有者。所有者変更は直接不可。
- `country_members` : 所有者を含むアクセス表。
  - `owner` : 全権限、国家削除、admin管理。
  - `admin` : 国家管理、editor/viewer管理。adminの追加・変更・削除は不可。
  - `editor` : 国家内容の編集と自分の容量を使ったアップロード。
  - `viewer` : 非公開国家を含む閲覧のみ。
- `country_member_invitations` : MFDCOアカウントへの招待。
- メンバーの直接INSERT/UPDATE/DELETEはクライアントから禁止し、RPCだけで変更する。

## アカウント容量
既定値:
- 所有可能国家: 5国家 / MFDCOアカウント
- Country関連ストレージ: 500 MiB / MFDCOアカウント
- 共有ストレージ: 250 MiB / 国家
- 1ファイル: 25 MiB

アカウント容量に含むもの:
- `country_media` に本人がアップロードしたデータ
- `country_assets` に本人がアップロードした配布素材
- `country-user-data` の本人専用バックアップ

共同編集時:
- ファイルは国家の250 MiB枠を消費する。
- 同時に、アップロードした共同編集者本人の500 MiB枠を消費する。
- 所有者の個人容量へ自動的に付け替えない。

将来プラン変更用に `country_account_limits` を追加。通常ユーザーは直接変更できず、行がない場合は上記既定値を使う。

## 軽量データ制限
- 旧 `countries.core_data`: 既存の1 MiB制限を維持。
- 旧 `country_records`: 合計5 MiB制限を維持。
- `country_documents.payload`: 512 KiB / document
- `country_entities.payload`: 128 KiB / entity
- `country_links.payload`: 128 KiB / link
- 大きな画像・音声・ファイルはJSONへ入れずStorageまたはIndexedDBへ置く。

## ローカル領域
IndexedDBは端末固有の一時領域:
- 下書き
- UI状態
- キャッシュ
- 同期待ち
- 未アップロードのローカルファイル

正式共有データはSupabaseへ保存する。共同編集者間でIndexedDBは共有されない。

## 主なRPC
- `mfdco_my_country_access()` : 所有・共同編集国家一覧
- `mfdco_search_country_member_profiles(text,integer)` : MFDCOアカウント検索
- `mfdco_invite_country_member(...)`
- `mfdco_update_country_member(...)`
- `mfdco_remove_country_member(...)`
- `mfdco_leave_country(text)`
- `mfdco_account_storage_usage()`
- `mfdco_country_storage_usage(text)`
- `mfdco_check_country_media_quota(...)`
- `mfdco_check_account_storage_quota(bigint)`
