import json
from pathlib import Path
p=json.load(open('src/data/geography/round1.json'));r=json.load(open('docs/qa/geography-browser.json'));rows=r['rows'];images=json.load(open('docs/qa/geography-images.json'));capitals=json.load(open('src/data/geography/capital-review.json'))
lines=['# 第1ラウンド QA結果一覧','', '2026-10-26 JST。**操作検査合格 ≠ 教材内容の全項目合格。本番リリース判定：保留。**','',
'## 検査集計','',f'- 対象：A 11か国110問、B 17か国170問、計280問。',f'- ブラウザ正誤操作：{sum(x["interaction"]=="PASS" for x in rows)} / {len(rows)} 件。1024×768と820×1180。',f'- 画面内の主要要素：{sum(x["layout"]=="PASS" for x in rows)} / {len(rows)} 件。',f'- 保存・再読込：{sum(x.get("progressSaved",False) for x in rows)} / {len(rows)} 件。',f'- 再クリア重複防止：{sum(x.get("replayDoesNotDuplicate",False) for x in rows)} / {len(rows)} 件。',f'- 画像：Commons 28点存在確認、実画像と場所説明を目視照合。ブラウザ表示検査はローカルQA応答で実画像を表示。', '- 外部URLのブラウザ読込：環境のTLS証明書エラーで未合格。証明書検証を無効化していない。', '- 地理・物流ルート・誤答の教材内容：28か国とも最終レビュー未完了。', '- ルワンダ旧版10問、時差、実機iPad Safari、本番約400問の実公開：この集計の対象外。','',
'## 国別一覧','', '追記：2026-10-27、A11か国の首都名を外務省資料と照合。都市座標・P04/P10全体の教材内容の合格を意味しない。出典と確認範囲は [首都名照合記録](A_CAPITAL_SOURCE_REVIEW.md) を参照。','', '|グループ|国|P01〜P10操作・表示|写真内容|首都名|教材内容の最終照合|', '|---|---|---|---|---|---|']
for code,c in p.items():
 a=[x for x in rows if x['country']==code];s='20/20 合格' if len(a)==20 and all(x['interaction']=='PASS' and x['layout']=='PASS' for x in a) else '要確認'
 lines.append(f"|{c['group']}|{c['nameEn']}（{code}）|{s}|目視照合済み|{'外務省照合済み' if code in capitals else '未照合'}|未完了|")
lines+=['','2026-10-27追加修正・部分再検査：[都市点・国境・港の記録](A_GEOGRAPHIC_CORRECTIONS.md)。下記560件は前回の全問記録を保持し、追加修正後の再検査範囲は別レポートで明示する。','','## 全280問の検査結果','','写真欄の「実画像表示」は取得したCommons実画像のローカル表示を意味し、外部URLのTLS読込合格ではない。','','|国|問|横向き 正誤／表示|縦向き 正誤／表示|保存・再クリア|写真|地理・教育内容|','|---|---|---|---|---|---|---|']
for code,c in p.items():
 for n in range(1,11):
  a=[x for x in rows if x['country']==code and x['mission']==n];states=[]
  for v in ['1024x768','820x1180']:
   x=next((x for x in a if x['viewport']==v),{});states.append(('合格' if x.get('interaction')=='PASS' else '未合格')+'／'+('合格' if x.get('layout')=='PASS' else '未合格'))
  saved=len(a)==2 and all(x.get('progressSaved') and x.get('replayDoesNotDuplicate') for x in a)
  photo='実画像表示' if n in [6,7,9] and all(x.get('images')=='LOCAL_COMMONS_RENDER_PASS' for x in a) else '対象外' if n not in [6,7,9] else '未検証'
  lines.append(f"|{code}|P{n:02d}|{states[0]}|{states[1]}|{'合格' if saved else '未合格'}|{photo}|最終照合待ち|")
lines+=['','## 国別資料','','各国の共通地図・都市データはNatural Earth。下記は参照用資料を含む。未閲覧の参照候補URLの正しさも最終照合対象。','','|国|写真出典|国別資料候補|','|---|---|---|']
for code,c in p.items():lines.append(f"|{code}|[Commons]({c['photo']['sourceUrl']})|[外務省]({c['sources'][2]['url']})|")
lines+=['','ギテガ座標：[UNGEGN / IGEBU](https://ungegn.un.org/dashboard/cities/details?id=3419)。ベナンの首都と実質機能：[外務省](https://www.mofa.go.jp/mofaj/area/benin/data.html)。ブルンジの首都：[外務省](https://www.mofa.go.jp/mofaj/area/brundi/data.html)。','', '修正内容・再現コマンド・公開前条件は [実装記録](../TIMEPALETTE_ROUND1_IMPLEMENTATION.md) を参照。']
Path('docs/qa/ROUND1_QA_MATRIX.md').write_text('\n'.join(lines)+'\n')
print({'rows':len(rows),'failures':sum(x['interaction']!='PASS' or x['layout']!='PASS' for x in rows),'replays':sum(bool(x.get('replayDoesNotDuplicate')) for x in rows)})
