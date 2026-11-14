"""Ten original questions: one actual JICA photograph + four text choices each."""
import json,hashlib,urllib.request
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
root=Path(__file__).parent;out=Path('/workspace/shared/botswana-jica-20261114');(out/'images').mkdir(parents=True,exist_ok=True)
assets=json.loads((root/'source-assets.json').read_text())
meta={
'life/post_30.php':('ボツワナの乗り物や公共交通機関について','平石守','2025-06-17'),
'culture/post_1.php':('ボツワナのイチオシグルメ','井上日南子','2024-07-22'),
'life/content_5.php':('暮らしのそばにある伝統舟ータマラカネ川のモコロ','谷村','2026-07-10'),
'life/post_34.php':('ボツワナで活躍する日本車','加地','2025-08-07'),
'culture/dijo.php':('いつものボツワナランチ、Dijo','藤井','2025-02-17')}
rows=[
('lifeCulture',2,'ボツワナの隊員が紹介した「ドンキーカート」です。手前の動物と、その後ろの台車を見てください。この乗り物は、主に何の力で進むでしょう？','ロバが台車を引く力',['自転車のペダルをこぐ力','舟の帆が受ける風の力','電車の線路から受ける電力'],'動物と台車がつながった様子が手がかりです。記事はロバが引く台車を、農作物の運搬や地域の移動に使う例として紹介しています。','つながり方や車輪は観察できます。写真に写った人の目的地や、全住民の利用頻度は分かりません。'),
('lifeCulture',5,'ボツワナの公共交通を紹介した写真です。複数の窓があるワゴン型の車に注目してください。記事で「コンビ」と呼ばれる車は、どのような使い方でしょう？','複数の人が乗り合わせて移動する',['荷物だけを載せ、人は乗らない','線路の上だけを走る','水の上だけを進む'],'記事はコンビを乗り合いの移動手段として紹介しています。窓や車体の形は観察の手がかりになります。','外観だけでは定員・運賃・現在の路線は確定できません。記事の当時の説明と現在の利用条件は区別します。'),
('lifeCulture',14,'ボツワナの伝統料理「セスワ」を作る写真です。鍋の上にある木製の道具を見てください。煮込んだ肉に、次にどのような作業をしているでしょう？','木製の道具でたたき、細かくほぐす',['木製の道具で薄い皮をのばす','肉を糸に通して外につるす','肉をすべて冷凍用の袋に詰める'],'隊員は、肉を煮込んだ後に木製の大きなスプーンでたたき、繊維状にほぐす工程を紹介しています。','手の位置と道具、鍋が手がかりです。肉の柔らかさや調理時間は写真だけでは測れません。'),
('lifeCulture',17,'ボツワナのタマラカネ川で使われる小舟「モコロ」です。舟に立つ人の手元を見てください。記事によると、長い棒を使ってどのように進むでしょう？','川底を棒で押して進む',['棒に大きな帆を張って進む','棒を岸のレールにはめて進む','棒でエンジンのスイッチを押して進む'],'記事は、船頭が後ろに立ち、長い棒で川底を押して進む方法を説明しています。','人の姿勢や長い棒は見えます。舟の材質、料金、利用できる場所は見た目だけで断定できません。'),
('lifeCulture',33,'ボツワナで隊員が訪れた持ち帰りランチの店です。並んだ鍋や容器に注目してください。記事の店では、どのように料理を選ぶでしょう？','主食・主菜・副菜を指定し、容器に入れてもらう',['全ての料理を必ず一種類ずつ買う','飲み物だけを買い、食事は選べない','自宅で作った料理を店に渡して帰る'],'隊員が訪ねた店では、好みの主食・主菜・副菜を指定して詰めてもらうと紹介されています。','複数の料理や容器は手がかりです。全ての店で同じメニューや方法だと一般化しないようにしましょう。'),
('japanConnection',28,'ボツワナの道路で隊員が撮った車です。前の車のボディーに日本語の文字が残っています。記事が説明する日本とのつながりはどれでしょう？','日本で使われた中古車が、現地で再び使われている',['この道路が日本国内にある','ボツワナの全ての運転手が日本人である','日本語がボツワナ唯一の公用語である'],'記事は、日本の社名などを残した中古車がボツワナで使われる事例を紹介しています。物の移動を通じたつながりです。','日本語の表記は見えますが、今の所有者の国籍や言語は分かりません。この車の詳しい移動経路は別の記録が必要です。'),
('japanConnection',29,'ボツワナに渡った日本向けのカーナビの写真です。記事にある言語や地図の困りごとを踏まえ、製品を海外でも使いやすくするための工夫はどれでしょう？','現地の言語を選べて、使う地域の地図に対応する',['読めない文字を残し、日本の地図だけを拡大する','表示内容を変えず、音量だけを大きくする','必要な案内も含め、画面の文字を全て消す'],'記事の困りごとから、別の地域で使う人の言語や地図に対応する設計を考える応用問題です。この写真の機種に、その機能が既にあるという意味ではありません。','画面の表記は観察できます。その機種の全機能や設定方法を写真だけで判断する問題ではありません。'),
('thinkConnect',35,'ボツワナで隊員が注文したランチの一例です。この一枚を見て国の食文化を紹介するなら、どの説明が適切でしょう？','この店で隊員が選んだ組合せとして紹介し、ほかの例も調べる',['全住民が毎日必ず同じ組合せを食べると書く','写真だけで全住民の栄養状態を決める','料理の見た目だけで自分の国より優れているか決める'],'記事は隊員が選んだ一食を紹介し、店や日によって選択肢が異なるとも説明しています。一例と国全体を分けて読みます。','容器に盛られた料理は見えます。全国の食習慣や個人の健康状態は、この一枚だけでは判断できません。'),
('thinkConnect',23,'ボツワナの川辺で、水が木の周りまで広がっている写真です。雨季・乾季による水位の変化を調べるなら、次に集めたい資料はどれでしょう？','同じ場所の別の季節の写真と、撮影日・水位の記録',['この写真だけを拡大して全国の年間雨量を決める','木の本数だけ数えて毎年同じ水位と決める','別の国の海の写真を説明なしで代わりに使う'],'記事は季節やその年の雨による川の様子の違いに触れています。変化を調べるには、場所と時点をそろえた比較が必要です。','木の周りの水は観察できます。一枚の写真だけで一年の変化や気候を確定できません。'),
('thinkConnect',19,'ボツワナで隊員が乗ったモコロからの風景です。水草の間に細長い舟が進んでいます。水辺の暮らしと移動の関係を知るための問いはどれでしょう？','誰が、どこへ、どのような目的でこの舟を使うのか',['写真の色が自分の好きな色かだけ','舟の名前の文字数が国名と同じかだけ','写真に写る全ての人が同じ職業か、見た目で決められるか'],'隊員は観光体験だけでなく、地元の人が川の対岸へ渡る利用も紹介しています。道具の形から使い手と目的へ問いを広げます。','舟の形や水辺の様子は見えます。利用者全体の職業や目的は観察だけでは分からず、記事や利用者の話で確かめます。')]
questions=[];used={}
for domain,n,prompt,answer,choices,expl,obs in rows:
 asset=assets[n-1];title,author,date=meta[asset['article']];article='https://world-diary.jica.go.jp/JICA_Botswana/'+asset['article'];fname='photo_'+asset['file'];p=out/'images'/fname
 if not p.exists():p.write_bytes((out/'images'/asset['file']).read_bytes() if (out/'images'/asset['file']).exists() else urllib.request.urlopen(asset['url'],timeout=35).read())
 notes=f'【解説】{expl}\n【観察と推測】{obs}\n【話してみよう】写真のどこを見て選びましたか。追加で確かめたいことも話しましょう。\n【出典・写真】JICA海外協力隊の世界日記／{author}「{title}」／記事表示日：{date}\n{article}\n【原画像】{asset["url"]}\n【範囲】隊員が記録した場所・時点の一例です。国全体・全住民の習慣と断定しません。\n【制作】記事掲載の実写１枚＋文章４択。AI生成・再構成ではありません。\n【公開状態】下書き用。公開時の写真利用条件の最終確認は未了です。\n資料確認：2026年11月14日。'
 questions.append(dict(countryIso='bw',domain=domain,type='photoText4',prompt=prompt+'\n\n一つ選び、写真のどこを手がかりにしたか話してみましょう。',answer=answer,choices=choices,notes=notes,sources=[article,asset['url']],images={'1':'images/'+fname},learning={'levels':['elementary','juniorHigh','highSchoolStandard']}))
 used[fname]={**asset,'credit':author,'title':title,'articleDisplayDate':date,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'rightsReview':'pending-before-publication'}
manifest={'version':'timepalette-mission-factory/v1','questions':questions}
(root/'questions_all.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(root/'photo-sources.json').write_text(json.dumps(used,ensure_ascii=False,indent=2)+'\n')
for offset in (0,5):
 batch={'version':manifest['version'],'questions':questions[offset:offset+5]};name=f'Botswana_JICA_Photo_{offset//5+1:02d}'
 (out/(name+'.json')).write_text(json.dumps(batch,ensure_ascii=False,indent=2))
 with ZipFile(out/(name+'.zip'),'w',ZIP_DEFLATED) as z:
  z.writestr('questions.json',json.dumps(batch,ensure_ascii=False,indent=2))
  for q in batch['questions']:z.write(out/q['images']['1'],q['images']['1'])
print('10 original photoText4 questions; 10 distinct actual photos; two import ZIPs; not registered or published')
