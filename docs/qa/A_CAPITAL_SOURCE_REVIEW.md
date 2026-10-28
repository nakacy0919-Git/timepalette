# Aグループ 首都名の外部資料照合

確認日：2026-10-27 JST。Aグループの11首都名を外務省「基礎データ」の「一般事情／3 首都」と照合した。対象の日本語名と、対応するゲーム内の英語名・capitalIdを確認。座標・都市範囲・隣国・地形・物流ルート・教育内容の最終承認は別途必要。

|国|ゲーム内の首都|日本語名|外務省資料の更新日|参照資料|
|---|---|---|---|---|
|Afghanistan|Kabul|カブール|2021-05-14|[外務省](https://www.mofa.go.jp/mofaj/area/afghanistan/data.html)|
|Albania|Tirana|ティラナ|2026-06-10|[外務省](https://www.mofa.go.jp/mofaj/area/albania/data.html)|
|Algeria|Algiers|アルジェ|2025-09-16|[外務省](https://www.mofa.go.jp/mofaj/area/algeria/data.html)|
|Andorra|Andorra la Vella|アンドラ・ラ・ベリャ|2026-05-12|[外務省](https://www.mofa.go.jp/mofaj/area/andorra/data.html)|
|Angola|Luanda|ルアンダ|2026-06-03|[外務省](https://www.mofa.go.jp/mofaj/area/angola/data.html)|
|Antigua and Barbuda|St. John's|セントジョンズ|2025-05-27|[外務省](https://www.mofa.go.jp/mofaj/area/antigua/data.html)|
|Argentina|Buenos Aires|ブエノスアイレス|2026-04-23|[外務省](https://www.mofa.go.jp/mofaj/area/argentine/data.html)|
|Armenia|Yerevan|エレバン|2026-05-26|[外務省](https://www.mofa.go.jp/mofaj/area/armenia/data.html)|
|Australia|Canberra|キャンベラ|2026-08-19|[外務省](https://www.mofa.go.jp/mofaj/area/australia/data.html)|
|Austria|Vienna|ウィーン|2026-04-01|[外務省](https://www.mofa.go.jp/mofaj/area/austria/data.html)|
|Azerbaijan|Baku|バクー|2026-05-14|[外務省](https://www.mofa.go.jp/mofaj/area/azerbaijan/data.html)|

## 照合の制約

- アフガニスタン資料は2021年更新。首都名のみ使用し、現在の政体・国旗・通行条件を確認済みとはしない。
- アルバニア資料の記載は「ティラナ県」。都市名の対応を確認し、県人口や行政範囲を都市の値として使わない。
- アンティグア・バーブーダの外務省参照URLを実在する `/area/antigua/data.html` に修正。生成スクリプトも同じ修正を行い、再生成による差し戻りを防止。
- `capital-review.json` の照合値と実際の正解都市が一致しなければ地理QAを失敗させる。キャンベラの正解IDがシドニーへ変わった場合も検出する。
- 首都名の照合済み表示を、首都座標の合格や国全体の完成判定に利用しない。28か国すべての `releaseReady` は引き続き false。

ブラウザ・保存・画像検査の結果は [全問QA一覧](ROUND1_QA_MATRIX.md) 参照。
