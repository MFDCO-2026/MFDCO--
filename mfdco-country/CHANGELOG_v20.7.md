# MFDCO Country v20.7

- 国家ダッシュボードの所有国家判定を修正。
- `countries.owner_id` を所有権の唯一の正規情報として使用。
- `country_members` のownerミラーが欠けても、JS側が所有国家を直接取得して表示。
- `mfdco_my_country_access()` も所有国家を `countries.owner_id` から返すよう修正。
- 既存国家についてowner行を `country_members` に自動バックフィル。
- 新規国家は `countries_seed_owner` triggerでownerミラーを自動作成。
