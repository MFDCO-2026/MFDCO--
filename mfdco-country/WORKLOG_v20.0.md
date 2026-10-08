# WORKLOG v20.0

実装済み:
1. v17.3 全体版から v20 foundation を作成。
2. IndexedDB user area を追加。
3. Country editor の未保存草案を IndexedDB へ自動保存・復元。
4. Cloud load/save と IndexedDB cache を接続。
5. offline / 未ログイン時の変更 queue の基盤を追加。
6. user-private Storage bucket `country-user-data` のSQLを追加。
7. 汎用 document/entity/link/metric/visibility/change-log DBを追加。
8. `country-operations.html` を追加し、選択された主要機能の初期編集UIを実装。
9. 自動計算: 財政収支、債務/GDP、人口純増減、食料/電力自給率、貿易収支等。
10. 企業エンティティを世界経済の企業株価へ公開公式データとして橋渡し。
11. Country topbar から MFDCOホームへ戻れるリンクを追加。
12. 国家管理にユーザー領域・非公開クラウド保管・同期キューUIを追加。

次段階:
- 既存 core_data の重複項目を v20 documents/entities へ段階移行。
- v20公開データを国家ページへ統合。
- 外交効果を世界経済/貿易計算へ反映。
- 国家プロジェクト/技術/軍備を地図・戦闘シミュレーターへ接続。
