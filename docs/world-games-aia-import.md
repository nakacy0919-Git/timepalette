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
