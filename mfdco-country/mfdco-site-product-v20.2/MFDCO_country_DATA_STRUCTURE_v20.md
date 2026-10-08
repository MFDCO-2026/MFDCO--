# MFDCO Country v20 データ構造

## 方針
### DBへ置く
共有・検索・関係・正式データ。
### IndexedDBへ置く
草案・開閉状態・一時キャッシュ・オフライン変更。
### private Storageへ置く
長期バックアップ・JSONアーカイブ等。
### 計算して再現できる値
基本的にDBへ重複保存しない。検索に必要な現在値だけ country_metrics にキャッシュ。

## 既存互換層
- countries
- country_records
- country_versions
- 既存外交/国際機関/市場/メディアテーブル

v20.0では削除しない。

## v20新規
### country_documents
1国家1分野のJSON。
例:
- budget
- demography
- supply
- simulation_settings

### country_entities
増減・階層化する共通エンティティ。
共通列:
- id
- country_id
- parent_id
- entity_type
- name
- status
- visibility
- valid_from / valid_to
- sort_order
- payload

現在の entity_type:
- law_history
- region
- cabinet
- election
- ministry
- court
- citizenship_rule
- trade_partner
- company_profile
- national_project
- national_goal
- technology
- crisis
- social_stability
- embassy
- treaty_obligation
- diplomacy_effect
- military_inventory
- military_unit

### country_links
国家間/エンティティ間のグラフ関係。

### country_metrics
検索・ランキング用の現在計算値のみ。

### country_visibility_rules
標準公開範囲と異なるフィールドだけ保存。

### country_change_log
完全スナップショットではなく変更イベント/差分。

### country_market_events
世界経済で永続保存すべき強材料のみ。
細かい1時間価格は決定論的に再現する方向。

## 公開状態
status:
- official
- draft
- archived

visibility:
- public
- members
- collaborators
- owner

draft は公開範囲が public でも一般公開しないRLS。

## ローカル
IndexedDB: mfdco-country-user-v20
- drafts
- ui
- cache
- queue
- snapshots

## Storage
bucket: country-user-data
path:
`<auth.uid>/<country_id>/archives/<timestamp>_<name>.json`

RLSで先頭フォルダが auth.uid と一致する本人のみアクセス。
