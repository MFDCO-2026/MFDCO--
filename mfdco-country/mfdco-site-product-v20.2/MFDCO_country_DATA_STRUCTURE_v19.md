# MFDCO Country データ構造 v19

## 国家本体
`countries` は検索・一覧に必要な列と `core_data jsonb` を保持します。国家IDは引き続き text です。

## 可変リスト (`country_records`)
大量に増えるものは `record_type + payload` で保存します。

### 歴史
- `history_major_period`: 時代大分類
- `history_minor_period`: 時代小分類 (`majorId` で親を参照)
- `regnal_era`: 元号 (`minorId` で親を参照)
- `timeline`: 歴史イベント (`majorPeriodId`, `minorPeriodId`, `regnalEraId`)

### 交通
- `highway`: 高速道路路線
- `railway`: 鉄道路線
- `port`: 港湾
- `airport`: 空港

### 市場・企業
- `company`: 企業、銘柄、基準株価、財務情報
- `market_dependency`: 世界市場への依存 / 生産
- `country_market_history`: 1国家×1時間の市場履歴

## 世界経済 v17.3
市場計算の時間軸は1時間のみです。`market_date` / `market_month` は履歴検索用メタデータとして残しますが、値動きの発生源には使用しません。

市場履歴の `themes.version = "hourly-v17.3"` で新モデルを識別します。

## 正式採用
`country_work_adoptions` が `works.id` を参照します。
検索一覧は `mfdco_public_works_for_adoption()` から承認済み作品だけを取得します。

## 設定データ
`advanced.finance` に以下を追加します。
- `averageHourlyMovePct`: 平均1時間変動幅
- `maxHourlyMovePct`: 最大1時間変動幅
- `stockAverageName`: 企業株価平均の表示名称

旧 `averageDailyMovePct` / `maxDailyMovePct` は互換移行用に残しますが、v17.3市場計算では直接使いません。
