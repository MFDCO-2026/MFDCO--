# MFDCO Country v20.6

## Fixed
- 正式採用装備の作品リンクを相対URLからMFDCO本体の絶対URLへ変更。
  - 旧: `work.html?id=...`
  - 新: `https://mfdco.net/work.html?id=...`
- Work IDは `encodeURIComponent()` で安全にURL化。

## Packaging
Country配布物からMFDCO本体の次のようなファイルを除外しました。
- `work.html`
- `works.html`
- `js/work.js`
- `js/works.js`
- `header.html`
- `footer.html`
- `mypage.html`
- `members.html`
- `search.html`

これにより、Countryを配置してもMFDCO本体の作品ページやアカウント系ファイルを上書きしません。

## DB
この修正にSQL変更はありません。
DBはv23.5を継続使用します。
