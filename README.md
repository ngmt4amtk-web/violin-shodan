# 弦しるべ

バイオリン初心者が、譜面と指の形を見ながら練習する静的Webアプリ。旧ひと弓とは独立したアプリです。教材24メニューを引き継ぎ、説明・練習選択・演奏の画面を分けました。

## 起動と編集

`python3 -m http.server 8773 --bind 127.0.0.1 --directory dist`

編集する正本は `dist/`。`app.mjs` は画面と状態、`style.css` は配置、`score.mjs` は五線組版、`content.mjs` と `repertoire.mjs` は教材、`engine.mjs` は端末内の音処理です。新しい本番依存はありません。

`node build-portable.mjs` で単一HTML版を `portable/弦しるべ.html` に作ります。マイクはHTTPSでの利用を推奨。ファイル版を含め、ブラウザにより権限や音声APIの対応は異なります。

## 検証

`node verify.mjs` と `node extension-check.mjs` は教材、音程、譜面、音処理を検査します。`validation/check-ui.mjs` はローカルの既存Playwright環境でChrome・WebKitを検証します。結果は `validation/ui-results.json`。

`node validation/check-natural-layout.mjs` は練習選択の譜面と操作を検証します。音符の縦横比・表示の欠け・五線の横幅・見出しの整列を、ChromeとWebKit、320〜1280px幅、24メニューと4本の弦で確認します。

演奏画面は通常文字サイズで320×568から検証。全体の楽譜はその下に続きます。文字拡大では縦に伸びます。iPhone実機・実バイオリンの演奏判定は未検証です。

## 原本と設計

`DESIGN.md` に比較案・採用理由・一次資料・状態設計を残しています。指の間隔の図はAstra Drawで作り、`design/finger-patterns.astradraw` が編集可能な原本です。指の実寸や手の姿勢を示す図ではありません。楽譜は従来のBravura輪郭を使用し、ライセンスは `dist/Bravura-OFL.txt`。

練習記録・録音・外部への音声送信・アナリティクスはありません。設定のみ別のlocalStorageキー `genshirube-v1` へ保存します。
