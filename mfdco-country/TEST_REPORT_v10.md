# v10 static test report

実施済み:
- `js/*.js` 全40ファイルを `node --check`
- `integration/*.js` 構文チェック
- ルート33 HTMLのローカルCSS/JS参照チェック
- `assets/logo.png` は既存MFDCO本体側資産として除外し、それ以外の参照欠落なし
- 大永都帝國テンプレートをv10スキーマでJSON再生成

未実施:
- 本番SupabaseへのSQL適用
- 本番Auth/RLSでのE2Eテスト
- Chromiumによる自動スクリーンショット試験はこの実行環境でheadless Chromiumが終了しなかったため未完了

推奨手動確認:
1. country-edit.html で Wikipedia風情報 / 税制 / 社会指標 / 月別気候値を保存
2. country.html で現地時刻・税制・社会問題・雨温図を確認
3. country-arsenal.html で兵器分類ごとの表示を確認
4. Supabase v9導入済み環境なら `supabase/11_country_v10_features.sql` を適用
