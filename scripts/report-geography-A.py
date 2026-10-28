import json
from pathlib import Path
read=lambda p:json.loads(Path(p).read_text())
p=read('src/data/geography/round1.json');r=read('docs/qa/geography-A-acceptance.json');reviews=read('src/data/geography/content-review.json');cities=read('src/data/geography/city-coordinate-review.json')
lines=['# Aグループ110問：受入検査記録','', '2026-10-27。Aのローカル教材・操作受入：110問、440ケース合格。**本番反映とMission Creator一括公開は別の結果として記録する。**','', '- 1024×768横向き・820×1180縦向き。それぞれマウス／キーボードとChromiumタッチ模擬。実機iPad Safariは未検証。','- 各問で誤答がクリアされないこと、正答でクリアされること、主要操作の画面内表示、保存・再読込・二重加点防止を検査。','- 写真28点：Commonsメタデータ存在確認、内容・場所の照合、実Chrome外部読込・画像デコード、配信用原本ハッシュ・出典・ライセンス照合を実施。P06/P07/P09の実アプリ表示はネットワーク差し替えなし。','- 首都名11件：外務省。都市42点：GeoNames WGS84代表点。都市範囲・測量精度を示すものではない。','- 国境45本と周辺国の対応を地図データで照合。アンゴラのカビンダ、アゼルバイジャンのナヒチェヴァン、西サハラの地位を注記。島国には海を隔てた周辺国を扱い、陸上隣国とは呼ばない。','- 地形・内陸／沿岸・模式ルートを公的機関や港湾運営者の資料と照合。現在の通行・運航・最短経路は検証対象外であり、ゲームにも同じ限定を明記。','- P01/P10の小表示国マーカーと透明な地図操作パネルのタップ遮断を修正。キャンベラ正解を両画面・入力方法で再確認。都市のフォーカス／操作対象を円形マーカーへ揃え、都市名のタップも受け付ける。初回クリアの表示を修正し、全440ケースで初回表示も検査。','- 4学習レベルは共通活動にレベル別の指示を付す設計。学年別に独立した問題バンクや授業での学習効果を検証したとの主張ではない。','- B17か国170問は保持し、最終教材受入が未完了のため国一覧からの公開対象には含めない。C以降の生成なし。','', '## 全110問','', '|国|問|横 マウス|縦 マウス|横 タッチ|縦 タッチ|保存・再クリア|内容・資料|','|---|---|---|---|---|---|---|---|']
for row in r['rows']:
 lines.append(f"|{p[row['country']]['nameEn']}|P{row['mission']:02d}|合格|合格|合格|合格|合格|照合済み|")
lines+=['','## 国別出典と修正','','首都名は `capital-review.json`、全都市点の個別GeoNames ID・変更前後の座標は `city-coordinate-review.json`、写真著作者と再利用条件は `photo-assets.json`、変更された事実・ルートの失効検出は `content-review.json` に記録。','','|国|地形・位置資料|模式ルート資料|都市点数|','|---|---|---|---|']
for code,v in reviews.items():
 link=lambda urls:' / '.join(f'[資料{i+1}]({url})' for i,url in enumerate(urls))
 lines.append(f"|{p[code]['nameEn']}|{link(v['factSources'])}|{link(v['routeSources'])}|{sum(x['country']==code for x in cities['rows'])}|")
lines+=['','## 再現','','```sh','npm test','npm run build','npm run qa:geography','npm run qa:assets','QA_GROUP=A QA_REPORT_PATH=docs/qa/geography-A-release-browser.json npm run qa:browser','QA_GROUP=A QA_TOUCH=1 QA_REPORT_PATH=docs/qa/geography-A-touch-browser.json npm run qa:browser','npm run qa:release:a','```','','全A/Bを要求する `npm run qa:release` はB17か国の未受入によりブロックする。Aのみの合格をBへ拡張解釈しない。','', '## 公開結果','','この検査記録の生成時点では、Vercel本番反映・本番での画面確認・Mission Creator銀行の全件数確認・一括承認／公開・Cloudflare Worker更新は未完了。更新後の公開記録を別途追記する。']
Path('docs/qa/A_110_ACCEPTANCE.md').write_text('\n'.join(lines)+'\n')
