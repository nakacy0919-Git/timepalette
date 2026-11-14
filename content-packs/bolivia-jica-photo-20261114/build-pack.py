"""Original draft-only questions; actual single JICA photographs, never AI reconstruction."""
import json,hashlib,urllib.request
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
root=Path(__file__).parent
out=Path('/workspace/shared/bolivia-jica-20261114');(out/'images').mkdir(parents=True,exist_ok=True)
assets=json.loads((root/'source-assets.json').read_text())
meta={
'cat4017/239_5.php':('日本人の口にも合う！？ボリビアで食べた絶品料理5選','新垣佳','2026-10-03'),
'cat3964/38.php':('現地での活動と暮らし','岩元萌佳','2025-07-01'),
'life/234_1.php':('青空市場の八百屋さん','竹下','2026-09-12'),
'cat4030/51_tamales.php':('想像以上に大変だったタマレス（Tamales）作り！','杉浦里佳','2025-08-11'),
'life/225.php':('日本とは色々違う！ボリビアのお祝い文化','長谷川祐','2026-08-29')}
rows=[
('lifeCulture',1,'ボリビアで隊員が朝食に食べた「ブニュエロ」の写真です。手に持った、こんがりした生地に注目してください。記事では、日本のどんな食べ物に近いものとして紹介されているでしょう？','揚げパン',['おにぎり','ゆで卵','冷ややっこ'],'記事はブニュエロを揚げパンとして紹介し、蜜やシロップを添えて食べると説明しています。','生地の形や焼き色のように見える色は観察できます。揚げた調理法や味は記事で確かめる情報です。'),
('lifeCulture',7,'ボリビアで隊員が料理作りを教わったときの一枚です。黄色い料理の外側を包むものに注目してください。記事で紹介された「ウミンタ」は何に包まれているでしょう？','トウモロコシの葉',['アルミホイル','パンの生地','海苔'],'記事では、つぶしたトウモロコシなどを葉で包んで焼いたウミンタを紹介しています。','葉の筋や折り返しは手がかりです。葉の種類と中身は本文と照らして確かめます。'),
('lifeCulture',13,'ボリビアで隊員たちが作った「タマレス」です。緑色の包みをとめているものを見てください。中身が出ないように、どのように仕上げたと紹介されているでしょう？','葉で包んでひもでくくり、鍋で蒸した',['パンにはさんでトースターで焼いた','缶に詰めて凍らせた','紙袋に入れてそのまま食べた'],'記事は、葉で包んだ後にひもでくくり、鍋で蒸した工程を説明しています。','写真には葉の包みとひもが見えます。鍋で蒸す工程は本文で確かめる背景情報です。'),
('lifeCulture',20,'隊員がボリビアのお祝い料理として紹介した写真です。金網の上と、その下の火に注目しましょう。何をしている場面でしょう？','金網の上で肉などを焼いている',['鍋の中でスープを煮ている','水の中で野菜を洗っている','生地を冷凍庫で冷やしている'],'記事は、お祝いの料理の一例としてバーベキューを紹介しています。大きな肉を焼いて切り分ける食べ方も説明しています。','金網、食材、下の火が手がかりです。どのお祝いでも同じ料理だと決め付けないようにしましょう。'),
('lifeCulture',12,'ボリビアの市場で野菜を売る店主の写真です。右上の丸い目盛りと、下につり下がる皿に注目してください。この道具で主に調べているのは何でしょう？','商品の重さ',['商品の温度','店内の湿度','一日の営業時間'],'写真では、店主がつり下げ式のはかりを扱っています。記事は市場の仕事や取引で使う重さの単位も紹介しています。','皿に商品を載せて目盛りを読む形が手がかりです。価格や、はかりの正確さまでは写真だけでは分かりません。'),
('lifeCulture',16,'ボリビアの施設のお祝いで撮られた一枚です。並んでいる大人たちの服に注目してください。お祝いに向けた準備として、記事の説明と写真の両方に合うものはどれでしょう？','そろいのTシャツを用意している',['全員が同じ仮面を着けている','全員が同じ大きな帽子をかぶっている','全員が楽器を持って並んでいる'],'隊員は、活動先のお祝いで先生たちがそろいのTシャツを作る様子を紹介しています。','服の色や柄の共通点は見えます。写真の一人ひとりの役職や気持ちは、見た目だけでは決められません。'),
('japanConnection',6,'ボリビアで日本の協力隊員が取り組んだ、ごみの分別を学ぶ活動の一場面です。隊員は教室用のごみ箱を同僚と作り、まず先生方に説明しました。記事によると、その順番にした理由は何でしょう？','子どもの質問に、先生方だけでも答えられるようにするため',['子どもには活動を知らせないため','先生方だけがごみ箱を使うため','教室での分別をやめるため'],'隊員は、先生が子どもの質問に答えられるよう、先生への説明を先に行ったと記しています。現地の同僚と教材や仕組みを作る協力の事例です。','教室で説明を聞く場面は見えます。説明の順番や理由は写真だけでは分からず、本文で確かめます。'),
('thinkConnect',5,'ボリビアの環境教育活動の記事にある写真です。大きな青い容器と、それに手を加える様子が写っています。ごみ箱を作る活動の目的を考えるために、次に確かめたいことはどれでしょう？','完成後に、どこで何を分別するために使うのか',['青い色は、自分の好みの色かどうかだけ','写真の撮影者の服の値段だけ','同じ形の容器が日本に一個もないかどうか'],'記事では教室用のごみ箱を作り、設置と分別説明を行う活動が紹介されています。物の見た目に加え、使う場所や目的を調べる問いです。','容器や作業は見えます。容器が新品か再利用品か、材質や安全性などは見た目だけでは確定できません。'),
('thinkConnect',4,'ボリビアの環境教育隊員の記事に掲載された、複数の人が一緒に写る写真です。国際協力について調べる際、写真だけで決め付けずに確かめる必要があるのはどれでしょう？','それぞれが活動で担った役割や、互いに学んだこと',['複数の人が同じ画面に写っていること','帽子をかぶっている人がいること','人々が近い位置に並んでいること'],'記事は隊員と現地の同僚が協力する活動を紹介しています。誰がどんな役割を担い、何を学んだかは、記事や本人の話で確かめる背景情報です。','人数や配置と、役割や経験を区別して読み取りましょう。外見から国籍や能力を決め付けないことも大切です。'),
('thinkConnect',1,'ボリビアの食べ物紹介記事にある写真です。「おいしそう」と感じた人もいるでしょう。この一枚からの観察と、個人の感じ方を分けた説明はどれでしょう？','料理の形は見えるが、味の好みは人によって異なる',['写真で笑顔なら、全ての人が必ず同じ味を好きだ','揚げパンに似ていれば、日本のものと材料も味も全く同じだ','一つの料理を見れば、その国の全ての料理の味が分かる'],'隊員は食べた感想を紹介しています。それは一人の経験であり、全ての人の好みを示すものではありません。','料理の形や色は観察、味の評価は経験や感じ方です。相手に好きな食べ物を尋ねる交流につなげられます。')]
questions=[];used={}
for domain,n,prompt,answer,choices,expl,obs in rows:
 asset=assets[n-1];title,author,date=meta[asset['article']];article='https://world-diary.jica.go.jp/JICA_Bolivia/'+asset['article'];fname='photo_'+asset['file'];p=out/'images'/fname
 if not p.exists():p.write_bytes((out/'images'/asset['file']).read_bytes() if (out/'images'/asset['file']).exists() else urllib.request.urlopen(asset['url'],timeout=35).read())
 notes=f'【解説】{expl}\n【観察と推測】{obs}\n【話してみよう】選んだ理由と、写真のどこを見たかを話しましょう。追加で知りたいことも考えましょう。\n【出典・写真】JICA海外協力隊の世界日記／{author}「{title}」／{date}\n{article}\n【原画像】{asset["url"]}\n【範囲】記事の場所・時点の一例です。国全体や全住民の習慣と断定しません。\n【制作】記事掲載の実写１枚＋文章４択。AI生成・再構成ではありません。\n【公開状態】下書き用。公開に向けた写真利用条件の最終確認は未了です。\n資料確認：2026年11月14日。'
 questions.append(dict(countryIso='bo',domain=domain,type='photoText4',prompt=prompt+'\n\n一つ選び、写真のどこを手がかりにしたか話してみましょう。',answer=answer,choices=choices,notes=notes,sources=[article,asset['url']],images={'1':'images/'+fname},learning={'levels':['elementary','juniorHigh','highSchoolStandard']}))
 used[fname]={**asset,'credit':author,'title':title,'date':date,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'rightsReview':'pending-before-publication'}
manifest={'version':'timepalette-mission-factory/v1','questions':questions}
(root/'questions_all.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(root/'photo-sources.json').write_text(json.dumps(used,ensure_ascii=False,indent=2)+'\n')
for offset in (0,5):
 batch={'version':manifest['version'],'questions':questions[offset:offset+5]};name=f'Bolivia_JICA_Photo_{offset//5+1:02d}'
 (out/(name+'.json')).write_text(json.dumps(batch,ensure_ascii=False,indent=2))
 with ZipFile(out/(name+'.zip'),'w',ZIP_DEFLATED) as z:
  z.writestr('questions.json',json.dumps(batch,ensure_ascii=False,indent=2))
  for photo in dict.fromkeys(q['images']['1'] for q in batch['questions']):z.write(out/photo,photo)
print('10 questions; 9 distinct single photos (photo 1 deliberately revisited for critical reading); draft-only')
