"""100 authored questions, actual JICA photos, no automatic wording permutations."""
import json,hashlib,urllib.request,concurrent.futures,collections
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from PIL import Image
root=Path(__file__).parent
out=Path('/workspace/shared/jica-bulk100b');(out/'images').mkdir(parents=True,exist_ok=True)
countryNames={'bt':'ブータン','bo':'ボリビア','bw':'ボツワナ','la':'ラオス','vn':'ベトナム'}
assets={}
for pack,c in [('bhutan-jica-photo-20261113','bt'),('bolivia-jica-photo-20261114','bo'),('botswana-jica-photo-20261114','bw')]:
 data=json.loads((root.parent/pack/'photo-sources.json').read_text());data=data if isinstance(data,list) else list(data.values())
 for i,a in enumerate(data,1):
  a=dict(a);a['key']=f'{c}_{i:02d}';a['country']=c;a['date']=a.get('date',a.get('articleDisplayDate',''))
  if not a['article'].startswith('https'):a['article']='https://world-diary.jica.go.jp/'+('JICA_Bolivia/' if c=='bo' else 'JICA_Botswana/')+a['article']
  assets[a['key']]=a
for a in json.loads((root/'new-photo-sources.json').read_text()):assets[a['key']]=a
rows=[]
for c in countryNames:
 lines=(root/(c+'.tsv')).read_text().splitlines();assert len(lines)==20
 for line in lines:
  fields=line.split('|');assert len(fields)==8,(c,len(fields),fields)
  photo,domain,prompt,answer,w1,w2,w3,explanation=fields
  assert photo in assets,photo
  rows.append(dict(country=c,photo=photo,domain=domain,prompt=prompt,answer=answer,choices=[w1,w2,w3],explanation=explanation))
assert len(rows)==100
used={r['photo']:assets[r['photo']] for r in rows}
def download(pair):
 key,a=pair;ext=a['url'].split('.')[-1].lower();p=out/'images'/(key+'.'+ext)
 if not p.exists():
  # Reuse a download only when its explicit source URL matches.
  p.write_bytes(urllib.request.urlopen(a['url'],timeout=45).read())
 with Image.open(p) as im:im.verify()
 a={**a,'file':'images/'+p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'rightsReview':'pending-before-publication'}
 return key,a
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:used=dict(ex.map(download,used.items()))
questions=[]
for ordinal,r in enumerate(rows,1):
 a=used[r['photo']];c=r['country'];prompt='【'+countryNames[c]+'】'+r['prompt']+'\n\n一つ選び、写真の手がかりと、記事で確かめる情報を分けて話しましょう。'
 notes='【解説】'+r['explanation']+'\n【資料の読み方】写真で見える特徴と、記事の背景説明や自分の推測を分けます。応用・計算の問いは、実際の調査結果や現地の利用案内ではありません。\n【対話】選択した理由、別の見方、追加で知りたいことを話しましょう。\n【出典・写真】JICA海外協力隊の世界日記／'+a.get('credit','')+'／「'+a['title']+'」／記事表示日：'+a['date']+'\n'+a['article']+'\n【原画像】'+a['url']+'\n【範囲】記事の場所・時点の一例です。国全体や全住民の習慣と断定しません。\n【制作】記事掲載の実写１枚＋文章４択。写真の再利用はありますが、過去セットの問題はこの100問に数えていません。\n【公開状態】登録準備用。写真利用条件の最終確認は未了です。\n資料確認：2026年11月14日。'
 questions.append(dict(countryIso=c,domain=r['domain'],type='photoText4',prompt=prompt,answer=r['answer'],choices=r['choices'],notes=notes,sources=[a['article'],a['url']],images={'1':a['file']},learning={'levels':['elementary','juniorHigh','highSchoolStandard']}))
# The all-questions master is an editorial deliverable, not a five-item import manifest.
master={'version':'timepalette-mission-factory/v1','questions':questions}
(root/'questions_all.json').write_text(json.dumps(master,ensure_ascii=False,indent=2)+'\n')
(root/'photo-sources.json').write_text(json.dumps(used,ensure_ascii=False,indent=2)+'\n')
(out/'import').mkdir(exist_ok=True)
for offset in range(0,100,5):
 batch={'version':master['version'],'questions':questions[offset:offset+5]};name=f'JICA100B_{offset//5+1:02d}'
 (out/'import'/(name+'.json')).write_text(json.dumps(batch,ensure_ascii=False,indent=2))
 with ZipFile(out/'import'/(name+'.zip'),'w',ZIP_DEFLATED) as z:
  z.writestr('questions.json',json.dumps(batch,ensure_ascii=False,indent=2))
  for name in dict.fromkeys(q['images']['1'] for q in batch['questions']):z.write(out/name,name)
# One full data archive, with shared photos stored once.
archive=Path('/workspace/scratch/3be306330b24/TimePalette_JICA_100_Photo_Drafts_B.zip')
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
 z.writestr('questions_all.json',json.dumps(master,ensure_ascii=False,indent=2))
 z.writestr('photo-sources.json',json.dumps(used,ensure_ascii=False,indent=2))
 for a in used.values():z.write(out/a['file'],a['file'])
 for p in sorted((out/'import').glob('*.zip')):z.write(p,'Creator_import/'+p.name)
 z.writestr('README_重要.txt','JICA世界日記 写真１枚＋４択 第２セット・新規100問（５か国×20問）\n\nquestions_all.json が100問の一括マスターです。images/の実写44枚を共用します。\n現行Creatorは１回５問までのため、そのまま取り込める形式もCreator_import/に自動同梱しました。マスター100問をそのままアップロードすることはできません。\n\n作成・検証・保存済み。Creatorへの登録、承認、公開は未実施です。写真の公開利用条件は別途最終確認が必要です。\n過去の問題は100問に数えていません。写真は再利用があります。\n')
report={'newQuestions':100,'countries':dict(collections.Counter(q['countryIso'] for q in questions)),'domains':dict(collections.Counter(q['domain'] for q in questions)),'distinctActualPhotos':len(used),'importCompatibilityBatches':20,'registered':0,'published':0,'status':'prepared-awaiting-Creator-import','archiveBytes':archive.stat().st_size}
(root/'readiness.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False));print(archive)
