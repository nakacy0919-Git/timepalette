# TimePalette Mission Factory — Phase 3A (ZIP 1〜5問一括下書き登録)

## 重要事項

- この実装は、既存の Mission Creator ブラウザ認証と `saveQuestion` / `uploadImage` API を**再利用**します。
- **Cloudflare WorkerやD1のマイグレーションは不要**です。
- ZIP読み込みは下書き保存のみで、管理者承認・公開は行いません。
- 作業ツリーとHEADが想定と異なる場合は変更せず停止します。
- Nodeモジュールとして `jszip@3.10.1` を導入するため `package.json` と `package-lock.json` が変わります。
- 元の問題・メディア・教師アカウントを一括編集・削除しません。
- ZIPの再取り込みは既存問題との国・カテゴリー・問題文の完全一致を検出してスキップします。画像アップロード失敗時は下書きIDを表示し、問題一覧で修正できます。
- UIは新メニュー「AI 5問一括登録」として追加されます。Vercel本番デプロイは行いません。

## ZIPのルート構造

```
lesson-5.zip
├── questions.json
└── images/
    ├── question-01.png
    ├── question-02.png
    ├── question-03.png
    ├── question-04.png
    └── question-05.png
```

`sample/questions-template.json` を参考に、ZIP直下に `questions.json`、各画像を `images/` に配置してください。画像は一問につき独立した1枚で、コラージュにしないでください。

主な入力フィールド：`countryIso`（ISO2）、`domain`（6カテゴリー）、`type`（`text4` / `photoText4` / `photo4`）、`prompt`、`answer`、`choices`（誤答3つ）、`notes`（解説）、`sources`（0〜2 URL）、`learning.levels`（複数選択）、`learning.challenge`（英語版）、`images`（スロット→画像の相対パス）。

`photoText4` は画像1枚と文字4択、`photo4` は画像4枚で、answerは`写真スロット 1`などの文字列を指定します。`text4`には画像は設定しません。

Challengeを含める場合は `challenge.promptEn`、テキスト4択では `challenge.answerEn` と `challenge.choicesEn`3件が必要です。

## 別ChatGPTチャット / Work向けの指示文（コピー用）

> TimePalette用に指定国・指定カテゴリーの教育ミッションを5問作ってください。各問は写真1枚とテキスト4択（正答1つ＋紛らわしい誤答3つ）。写真は問題ごとに1枚ずつ別ファイルとして作成し、コラージュにしないでください。問題文に答えとなるキーワードを入れないでください。まず信頼できる出典で文化・言語・学校生活等の事実を確認し、各問に短い解説と出典URLを付けてください。問題・正答・誤答・解説・対象学習レベルを `timepalette-mission-factory/v1` 形式の `questions.json` にまとめ、画像を `images/question-01.png` から `images/question-05.png` として保存し、5枚の画像とJSONを一つのZIPにして返してください。ZIP構造は下記のサンプルの通り。画像と正答の整合性を最後に確認してください。管理者承認・公開はしないでください。

ChatGPTに `sample/questions-template.json` を添付してください。元の画像の著作権や文化的正確さは教師が公開前に確認してください。

## ブラウザでの確認

1. 新しい開発ブランチをGitHubに保存し、Vercelの新しい**検証用URL**へデプロイ（既存のカスタムドメイン切り替えはしない）。
2. 検証用 `/mission-creator.html` にログイン。
3. サイドバー「AI 5問一括登録」を開き、画像＋JSONのZIPを選択。
4. 取り込み前の5問プレビュー、重複確認、下書き登録を実行。
5. 問題一覧で登録内容と画像を確認し、必要に応じて手動承認・公開。

**注意:** 検証用フロントエンドも本番D1/R2に接続しているため、初回は作業用のテスト問題のみで確認してください。既存レコードは削除しません。
