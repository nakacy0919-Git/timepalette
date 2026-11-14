"""Build draft-only, one actual JICA article photo + four text choices per item."""
import json,hashlib,urllib.request
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
root=Path(__file__).parent
out=Path('/workspace/shared/jica-photo-20261113');(out/'images').mkdir(parents=True,exist_ok=True)
base='https://world-diary.jica.go.jp/suzukiikunori/'
# Each prompt is independent of the order in which missions are presented.
rows=[
('lifeCulture','IMG_3397.JPG','life/post_19.php','ブータンの食事は？','2022-11-25',
'ブータンで隊員が食べた昼食です。皿の白い粒と、おかずの置き方を見てください。この写真で、主食として盛られているものはどれでしょう？',
'ご飯',['パン','いもをつぶしたもの','麺'],
'皿の右側に白い米粒のまとまりが見えます。記事でも、ご飯に数品のおかずを添える食事が紹介されています。',
'米粒や盛り付けは写真から観察できます。味や、全ての家庭での食べ方までは、この一枚では分かりません。'),
('lifeCulture','IMG_6051.JPG','life/post_19.php','ブータンの食事は？','2022-11-25',
'ブータンの屋外で、赤い細長い食材が広げられています。重ねずに並べた様子を手がかりに、何をしている場面か選びましょう。',
'唐辛子を乾燥させている',['唐辛子を油で揚げている','唐辛子を水で洗っている','唐辛子を鍋で煮ている'],
'日が当たる場所に唐辛子を広げています。記事の写真説明も、乾燥中の唐辛子であることを確かめています。',
'広げ方と屋外の様子は手がかりです。乾燥に必要な日数や辛さは、写真だけでは決められません。'),
('lifeCulture','IMG_6796.JPG','life/post_65.php','ブータンのティータイム','2023-09-22',
'ブータンのお茶の時間です。かごの小さな粒と、カップの中を見比べてください。この記事で「ザオ」と呼ばれる食べ物は、どのように楽しむものとして紹介されているでしょう？',
'お茶に入れて楽しむ',['お茶の葉を包んで取り出す','茶器を磨くために使う','火をおこす燃料にする'],
'かごの粒と似たものがカップにも入っています。隊員は、米を揚げたあられのようなザオを、お茶に入れる習慣を紹介しています。',
'粒がカップに入っていることは見えます。原料や呼び名は記事で確かめる情報です。'),
('lifeCulture','IMG_6355.JPG','life/post_64.php','ブータンでの食事','2023-09-15',
'ブータンで隊員が食べた「チョウメン」です。麺の形や、野菜との混ざり方を手がかりに、日本の料理ならどれに近いものとして紹介されているか選びましょう。',
'焼きそば',['汁の多いラーメン','巻きずし','茶わん蒸し'],
'皿に麺と具が混ざって盛られています。記事ではチョウメンを焼きそばにたとえつつ、日本のものとは味が違うと説明しています。',
'麺の形や汁の見え方は手がかりです。味まで日本の焼きそばと同じだと決め付けないようにしましょう。'),
('lifeCulture','IMG_5678.JPG','life/post_121.php','ブータンのお蕎麦','2024-02-04',
'ブータンで隊員が見つけた、袋入りの細長い食材です。これは「プタ」に使う乾燥麺として紹介されています。記事によると、日本のそばと共通する原料はどれでしょう？',
'ソバ',['とうもろこし','大豆','じゃがいも'],
'袋の中に細長い乾燥麺が見えます。記事はソバの麺を紹介し、プタはゆでた麺を薬味やバター・油と混ぜる料理だと説明しています。',
'麺の形は見えますが、原料を形だけで断定することはできません。袋の表示や記事で確かめます。'),
('lifeCulture','IMG_0826.JPG','life/post_65.php','ブータンのティータイム','2023-09-22',
'ブータンのお茶の写真です。右側の器に入った、ピンク色に見える飲み物に注目しましょう。記事で「スジャ」と呼んでいるのは、どの種類のお茶でしょう？',
'バター茶',['日本の緑茶','レモン入りの紅茶','麦茶'],
'記事の写真説明は、この飲み物をスジャと紹介しています。本文ではスジャをバター茶と説明しています。',
'写真で確かめられるのは色や器です。材料や味は色だけで当てず、記事の情報と結び付けましょう。'),
('thinkConnect','IMG_2654.JPG','culture/post_29.php','ルンタ','2023-03-24',
'ブータンの「ルンタ」を写した写真です。小さな旗が連なっています。運動会の万国旗と形が似ていることに気づきました。文化を比べるときの説明として、最も適切なのはどれでしょう？',
'形の共通点を示し、それぞれの意味や使う場面を調べる',
['形が似ているので、どちらも同じ競技の道具だと決める','色が多いので、どちらも国旗だと決める','旗が連なるので、使う目的も全て同じだと決める'],
'隊員はルンタを経文旗として紹介しています。形を比べることは出発点になりますが、宗教的な意味や使う場面も確かめて比較します。',
'旗の色や連なりは写真で観察できます。込められた意味は、形だけでは決まりません。'),
('thinkConnect','IMG_8530.JPG','cat2357/post_77.php','吊り橋','2023-12-08',
'ブータンのプナカで隊員が訪れた吊り橋です。通路や両側の様子を見てください。写真からの観察と、追加調査が必要なことを正しく分けた説明はどれでしょう？',
'細い通路は見えるが、渡れる人数の上限は案内などで確かめる',
['通路が細いので、毎日一人しか渡れないと分かる','旗があるので、橋は車両専用だと分かる','山が見えるので、橋の正確な長さも分かる'],
'細い通路と両側の構造、旗などが写っています。記事はプナカの吊り橋を紹介しますが、写真だけで利用上限や正確な長さを決めることはできません。',
'見える特徴から疑問を作り、利用条件は現地の案内などで確認する、という情報の読み方の問題です。'),
('thinkConnect','db39b71ecbb93e31d9a2461ef2ba27d64bad3965.JPG','life/post_19.php','ブータンの食事は？','2022-11-25',
'ブータンのティンプーで隊員が撮った田園風景です。緑の区画と周りの山に注目しましょう。この一枚から言える範囲を守った説明はどれでしょう？',
'この場所では、山に囲まれた土地に田が広がっている',
['ブータン全土が、この写真と同じ平らな田である','どの家庭も、自分の田だけで米を育てている','この写真だけで、国全体の米の収穫量が分かる'],
'記事の写真説明はティンプー市内の田園風景としています。山と田の配置は見えますが、一つの場所を全国の土地利用に当てはめることはできません。',
'観察した地域と、結論を述べる範囲を揃えましょう。全国の状況には別の資料が必要です。'),
('thinkConnect','IMG_4273.JPG','cat2357/post_104.php','チュゴ','2024-03-08',
'ブータンの店先に、白くて四角い品物がつるされています。「お餅に似ている」と感じました。写真から考えた予想を確かめる方法として、最も適切なのはどれでしょう？',
'見た目の予想と事実を分け、品物の名前や材料を記事で確かめる',
['白くて四角いので、材料は必ず米だと決める','日本のお餅に似ているので、味も同じだと決める','店先につるしてあるので、食べ物ではないと決める'],
'この記事で紹介された品物はチュゴという乾燥チーズです。隊員も最初は餅のように見えたと記しています。似た形でも材料は異なることがあります。',
'白い色や四角い形、つるされた様子は観察できます。材料や硬さは、それだけでは断定できません。'),
]
questions=[];assets=[]
for i,(domain,image,article,title,date,prompt,answer,choices,explanation,observation) in enumerate(rows,1):
 path=out/'images'/image
 if not path.exists():path.write_bytes(urllib.request.urlopen(base+image,timeout=35).read())
 imagePath='images/'+image
 credit=f'JICA海外協力隊の世界日記／鈴木育則「{title}」／{date}'
 notes=f'【解説】{explanation}\n【観察と推測】{observation}\n【話してみよう】写真のどこを手がかりに選びましたか。別の見方や追加で知りたいことも話しましょう。\n【出典・写真】{credit}\n{base+article}\n【原画像】{base+image}\n【範囲】隊員が記録した場所・時点の一例です。国全体・全住民の習慣と断定しません。\n【制作】写真１枚＋文章４択。写真は記事掲載の実写で、AI生成・再構成ではありません。\n【公開状態】下書きのみ。公開時の写真利用条件の最終確認は未了です。出典記載を利用許諾取得とみなしません。\n資料確認：2026年11月13日。'
 questions.append(dict(countryIso='bt',domain=domain,type='photoText4',prompt=prompt+'\n\n一つ選び、写真のどこを手がかりにしたか話してみましょう。',answer=answer,choices=choices,notes=notes,sources=[base+article,base+image],images={'1':imagePath},learning={'levels':['elementary','juniorHigh','highSchoolStandard']}))
 assets.append(dict(number=i,image=imagePath,url=base+image,article=base+article,title=title,date=date,credit=credit,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size,rightsReview='pending-before-publication'))
manifest={'version':'timepalette-mission-factory/v1','questions':questions}
(root/'questions_all.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(root/'photo-sources.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
for offset in (0,5):
 batch={'version':manifest['version'],'questions':questions[offset:offset+5]}
 name=f'Bhutan_JICA_Photo_{offset//5+1:02d}'
 (out/(name+'.json')).write_text(json.dumps(batch,ensure_ascii=False,indent=2))
 with ZipFile(out/(name+'.zip'),'w',ZIP_DEFLATED) as z:
  z.writestr('questions.json',json.dumps(batch,ensure_ascii=False,indent=2))
  for q in batch['questions']:z.write(out/q['images']['1'],q['images']['1'])
print('10 photoText4 questions; two ZIP batches; 10 distinct original photos')
