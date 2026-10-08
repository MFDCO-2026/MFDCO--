# MFDCO Country v20.0 Foundation

v17.3 を基準に、今後の大規模機能追加へ向けた保存構造と国家運営画面を追加。

## 保存構造
- IndexedDB `mfdco-country-user-v20`
  - drafts: 未保存草案
  - ui: UI状態
  - cache: 一時キャッシュ
  - queue: オフライン同期待ち
  - snapshots: 端末スナップショット
- Supabase `country-user-data` private Storage
  - `<user_id>/<country_id>/archives/...`
  - ユーザー本人のみアクセス可能
- 新DBテーブル
  - country_documents
  - country_entities
  - country_links
  - country_metrics
  - country_visibility_rules
  - country_change_log
  - country_market_events

## 国家運営・計画
`country-operations.html` を追加。
現在の第1段階で以下を編集可能:
- 国家予算
- 人口動態
- 食料・電力・資源需給
- 法律・政策履歴
- 行政区
- 政権・内閣
- 議会・選挙
- 省庁・国家機関
- 司法・裁判所
- 国籍・在留制度
- 貿易相手・関税
- 企業・市場連携
- 国家事業・国家目標
- 研究・技術
- 災害・危機
- 治安・社会安定
- 大使館・外交官
- 条約義務・期限
- 外交関係の実効効果
- 装備在庫
- 軍事編成
- 公式/草案/アーカイブ
- 公開範囲
- 自動計算値
- 差分履歴

## MFDCOホーム接続
Countryヘッダー左端を `MFDCO` → `index.html` に変更し、
`国家運営` を別リンクとして配置。

## 互換性
既存 country/core_data と country_records は削除しない。
v20機能から軽量テーブルへ移行し、旧画面を壊さない段階移行とする。
