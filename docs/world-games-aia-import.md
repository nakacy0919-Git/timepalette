# AIA / World Games 教材取り込み規約

公式教材一覧: https://www2.aia.pref.aichi.jp/koryu/j/kyouzai/index.html

- AIA「わたしたちの地球と未来」は非営利教育利用・二次使用条件の確認が必要。PDFや写真の複製、原文の切り抜き、既存問題の転載はしない。
- 公式PDFの内容・ページ番号を確認し、独立して回答できる独自問題を作成。古い統計や制度は現行の公的出典で再確認する。
- JICA世界日記、記事・写真・動画などの外部資料の読解が必須の問題は、World Gamesの問題プールから除外する。
- 既存の国別学習機能・Mission Creatorのデータとは分離して管理し、公開前に権利と内容を確認する。
- ゲームへの追加は src/data/world-games/approvedQuestions.json の questions 配列に、以下の項目を備えた問題を登録する。権利確認・内容確認の両方が実際に完了するまでは draft として別の非公開資料で管理する。
- 収録数や出題可能数は実際の承認済みデータから計算する。架空の数値を出さない。

```json
{
  "id": "aia-xx-culture-001",
  "country": "xx",
  "domain": "lifeCulture",
  "prompt": "独自の問題文",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correctIndex": 0,
  "subcategory": "食文化",
  "translations": {
    "en": {
      "prompt": "Original English question",
      "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
      "explanation": "Original English explanation",
      "subcategory": "Food culture"
    }
  },
  "translationReviewStatus": "draft",
  "explanation": "独自の解説",
  "sources": ["https://www2.aia.pref.aichi.jp/koryu/j/kyouzai/実際のPDF.pdf"],
  "sourcePages": [12],
  "verifiedOn": "YYYY-MM-DD",
  "origin": "AIA",
  "gameEligible": false,
  "rightsConfirmed": false,
  "reviewStatus": "draft",
  "requiresReading": false
}
```

この例はスキーマ説明用の架空レコードであり、教材として出題しない。
World Gamesでは、レビュー承認・権利確認・明示的な独立型出題許可が揃った4択だけを採用する。AIA由来の問題には公式PDFと参照ページ、確認日も必須。

## 日英同時作問（必須）
- 118冊・1か国平均40問、合計4,720問は制作目標。日本語と英語を別々の問題数として数えない。
- 目安：地理5、時間2、言語4、生活文化15、日本とのつながり7、比較・思考・交流7。原資料に適切な内容がなければ、他のカテゴリーへの配分変更または追加の公的出典による補足を検討する。無理に40問を埋めない。
- 日英の問題文・選択肢・解説・小カテゴリーを一組にする。選択肢の意味と順番、正解番号、対象年、数値、単位は一致させる。
- 小学校高学年以上にも理解しやすい平易な英語を標準とし、固有名詞・専門用語は必要に応じて短く補足する。
- `node scripts/qa-aia-bilingual.mjs --plan <output.json>` で国別目標を出力。
- `node scripts/qa-aia-bilingual.mjs <draft.json>` で構造と公開保留理由を確認。
- `node scripts/qa-aia-bilingual.mjs <catalog.json> --publish` で公開前の必須条件をチェック。翻訳レビューも明示的な承認が必要で、未翻訳のAIA問題は日本語モードにも投入しない。
- 自動検査は文章の意味・翻訳の正確さ・出典や許諾の実在を証明しない。人による内容と権利確認を省略しない。既存45問は補足問題案であり、原PDFのページ照合と承認の完了前に公開しない。
