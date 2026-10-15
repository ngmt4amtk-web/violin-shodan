# 公開

新アプリ（バイオリン初段）: https://ngmt4amtk-web.github.io/violin-shodan/

リポジトリ: https://github.com/ngmt4amtk-web/violin-shodan （ngmt4amtk-web/violin-shodan）

旧アプリ（弦しるべ）: https://ngmt4amtk-web.github.io/genshirube/ （変更なし）

GitHub Pagesは `gh-pages` の `/` を配信。公開するのは `.nojekyll` を含む `dist` の内容だけ。

更新は必要なチェックと `node build-portable.mjs` の後、ローカルmainへコミットし、`git subtree push --prefix dist origin gh-pages`。GitHubのビルド成功を確認してから `node validation/check-deployment.mjs` で公開ファイルのハッシュ、画面、オフライン再生を検証する。

初回は呼び出し側で新リポジトリを作成し、`origin` を `https://github.com/ngmt4amtk-web/violin-shodan.git` に設定してから上の手順で公開する。旧リポジトリにはpushしない。リポジトリ作成・コミット・公開・公開後検証は呼び出し側で行う。
