# MFDCO Country v21.2

## 404修正
v21.1完全版ZIPは外側に `mfdco-country-v21.1/` フォルダがありました。
v21.2完全版は **ZIP直下がCountry本体** です。

既存のCountryフォルダを開き、その中へZIPの内容をそのまま上書きしてください。

最低限、次のファイルが同じ階層にあることを確認してください。

- `country-dashboard.html`
- `country-settings.html`
- `country-publish.html`
- `country-notifications.html`
- `country-edit.html`
- `js/`
- `css/`

たとえば `country-dashboard.html` が `/country/` にあるなら、
`country-settings.html` も必ず `/country/` に置きます。

## 通知ベル v21.2
- ベルを開いた時点で未読をすべて既読化
- 未読バッジは即座に消える
- 画面の別の場所をクリックすると閉じる
- 別のHeaderメニューを開くと閉じる
- Escapeキーでも閉じる
- 通常のHeaderドロップダウンも同じ外側クリック挙動へ統一
