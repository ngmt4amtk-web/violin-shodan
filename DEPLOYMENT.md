# 公開

新アプリ: https://ngmt4amtk-web.github.io/genshirube/

リポジトリ: https://github.com/ngmt4amtk-web/genshirube

旧アプリ: https://ngmt4amtk-web.github.io/hitoyumi/ （変更なし）

GitHub Pagesは `gh-pages` の `/` を配信。公開するのは `dist` の内容だけ。

更新は必要なチェックと `node build-portable.mjs` の後、ローカルmainへコミットし、`git subtree push --prefix dist origin gh-pages`。GitHubのビルド成功を確認してから `node validation/check-deployment.mjs` で公開ファイルのハッシュ、画面、オフライン再生を検証する。

初回公開コミット: ca3a3f901fd1af123f18f120fc6688bc7cb67116。
