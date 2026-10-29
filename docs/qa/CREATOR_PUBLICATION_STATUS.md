# Mission Creator 本番公開・取り込み記録

2026-10-27。公開状態の読取検査。管理者による新規公開操作を実施した記録ではない。

- 本番公開API：197か国×6カテゴリー＝1182スコープ、公開156問、形式変換可能156問。エラー0。最初の502応答2スコープは個別に再確認して成功。
- 82か国・111の国／カテゴリー組合せに公開問題が存在。現在の銀行全体の件数・下書き数・承認待ち数は管理者ログイン未完了のため未検証。約400問すべてを公開したとは報告しない。
- 中国 place 1問、ロシア time 1問が既存の4カテゴリー専用読込から漏れていたため、6カテゴリーすべてを取り込むよう修正。地理・時差の専用アドベンチャーと、Creatorの公開問題を同じカテゴリー内で並べて表示する。
- language/lifeCulture/japanConnection/thinkConnect は引き続きCreator専用。旧埋め込みミッションへ戻る経路を持たない。
- 公開問題は登録済み countryIso/domain に従って配信し、UUIDを進捗IDに使用。学習レベルとChallengeの英語要件を維持。
- 6カテゴリー×12問＝72問の模擬公開APIによるブラウザ表示・地理ゲーム起動を検証。これは本番156問すべてを個別にプレイしたという意味ではない。
- Cloudflare Workerの10問上限制限撤廃はソース・統合テストで検証済みだが、Worker自体は未デプロイ。管理者認証とCloudflareデプロイ経路が必要。現在公開済みの最大スコープは4問。

|カテゴリー|公開APIで確認した問題数|
|---|---:|
|place|1|
|time|1|
|language|2|
|lifeCulture|112|
|japanConnection|38|
|thinkConnect|2|

## 再検査

```sh
QA_PUBLIC_BASE_URL=https://timepalette.pic-speak-story.com node scripts/qa-creator-public.mjs
# エラーがあるスコープだけ、公開GETを再確認する場合
QA_PUBLIC_BASE_URL=https://timepalette.pic-speak-story.com node scripts/qa-creator-public.mjs --retry-errors
```
