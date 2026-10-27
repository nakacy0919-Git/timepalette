import json, argparse
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--source-dir',default='/tmp');args=parser.parse_args();source_dir=Path(args.source_dir)
# New geography packages; never import missions_*.json.
rows='''af|AF|PK IR TM UZ TJ CN|Pakistan|Karachi|Arabian Sea|ヒンドゥークシュ山脈を含む山地が広がる|山地と谷|afghanistan
al|AL|ME XK MK GR|Albania|Durres|Adriatic Sea|山地とアドリア海・イオニア海沿岸を持つ|丘と建物|albania
dz|DZ|TN LY NE ML MR EH MA|Algeria|Algiers|Mediterranean Sea|北は地中海に面し、内陸にはサハラ砂漠が広がる|岩の地形|algeria
ad|AD|FR ES|Spain|Barcelona|Mediterranean Sea|ピレネー山脈にある、海に面しない国|山地の谷|andorra
ao|AO|CD CG ZM NA|Angola|Luanda|Atlantic Ocean|大西洋沿岸と内陸の高原を持つ|水の流れ|angola
ag|AG|KN DM|Antigua and Barbuda|Saint John's|Caribbean Sea|アンティグア島とバーブーダ島などからなる|沿岸の建物|antigua
ar|AR|CL BO PY BR UY|Argentina|Buenos Aires|Atlantic Ocean|西にアンデス山脈、東に大西洋がある|氷と山|argentine
am|AM|GE AZ IR TR|Georgia|Poti|Black Sea|南コーカサスの山地に位置する内陸国|建物と山地|armenia
au|AU|ID PG NZ|Australia|Sydney|Pacific Ocean|インド洋と太平洋の間にあり、広い乾燥地域も持つ|岩の地形|australia
at|AT|DE CZ SK HU SI IT CH LI|Slovenia|Koper|Adriatic Sea|アルプス山脈とドナウ川に関わる内陸国|山と湖|austria
az|AZ|RU GE AM IR TR|Georgia|Poti|Black Sea|カスピ海に面するが、外洋への海岸を持たない|岩の地形|azerbaijan
bs|BS|US CU HT|The Bahamas|Nassau|Atlantic Ocean|大西洋に多数の島と浅い海が広がる|海と砂浜|bahamas
bh|BH|SA QA IR|Bahrain|Khalifa Bin Salman|Persian Gulf|ペルシャ湾に浮かぶ島国|石造りの建物|bahrain
bd|BD|IN MM|Bangladesh|Chattogram|Bay of Bengal|大河川が運ぶ土砂でできたデルタが広がる|樹木と水|bangladesh
bb|BB|LC VC GD|Barbados|Bridgetown|Atlantic Ocean|小アンティル諸島の東側、大西洋に位置する島国|建物の並び|barbados
by|BY|LV LT PL RU UA|Lithuania|Klaipeda|Baltic Sea|海に面せず、平野や森林・湖が広がる|樹木|belarus
be|BE|FR LU DE NL|Belgium|Antwerp|North Sea|北海に面し、河川と港が内陸を海につなぐ|建物の並び|belgium
bz|BZ|MX GT|Belize|Belize City|Caribbean Sea|カリブ海に面し、沖合にサンゴ礁がある|青い海|belize
bj|BJ|TG BF NE NG|Benin|Cotonou|Gulf of Guinea|南はギニア湾に面し、南北に長い国土を持つ|建物|benin
bt|BT|CN IN|India|Kolkata|Bay of Bengal|ヒマラヤ山脈の南側に位置する内陸国|山と建物|bhutan
bo|BO|PE BR PY AR CL|Chile|Arica|Pacific Ocean|西のアンデス高地と東の低地を持つ内陸国|白い地表|bolivia
ba|BA|HR RS ME|Bosnia and Herzegovina|Neum|Adriatic Sea|山地が多く、ネウムに短いアドリア海岸を持つ|橋と川|bosnia
bw|BW|NA ZM ZW ZA|South Africa|Durban|Indian Ocean|カラハリの乾燥地域とオカバンゴの湿地を持つ内陸国|水と草地|botswana
br|BR|UY AR PY BO PE CO VE GY SR GF|Brazil|Santos|Atlantic Ocean|アマゾン川流域と大西洋沿岸を持つ|水の流れ|brazil
bn|BN|MY|Brunei|Muara|South China Sea|ボルネオ島北部にあり、国土は二つの部分に分かれる|建物と水|brunei
bg|BG|RO RS MK GR TR|Bulgaria|Varna|Black Sea|黒海に面し、北側をドナウ川が流れる|建物|bulgaria
bf|BF|ML NE BJ TG GH CI|Ghana|Tema|Gulf of Guinea|西アフリカに位置する、海に面しない国|石造りの遺構|burkinafaso
bi|BI|RW CD TZ|Tanzania|Dar es Salaam|Indian Ocean|タンガニーカ湖に面する内陸国|水の流れ|brundi'''
landlocked={'af','ad','am','at','az','by','bt','bo','bw','bf','bi'}
islands={'ag','au','bs','bh','bb'}
meta={}
for letter in ['a','b']:meta.update(json.load(open('src/data/countries_'+letter+'.json')))
cf=json.load(open(source_dir/'timepalette-countries.geojson'))['features']
cityfs=json.load(open(source_dir/'timepalette-cities.geojson'))['features']
byiso={}
for f in cf:byiso.setdefault(f['properties']['ISO_A2_EH'],f['properties'])
# Geometry names match world-atlas 50m; the numeric ISO identity is the join key.
atlas=json.load(open('node_modules/world-atlas/countries-50m.json'))
ids={}
for g in atlas['objects']['countries']['geometries']:ids.setdefault(g.get('id'),g['properties']['name'])
extras={
'ad':[('Encamp',1.5836,42.5363),('Sant Julia de Loria',1.4913,42.4637)],
'ag':[('All Saints',-61.7944,17.0667),('Codrington',-61.8204,17.6364)],
'bh':[('Muharraq',50.6119,26.2572),('Riffa',50.555,26.13)],
'bn':[('Kuala Belait',114.192,4.5833),('Tutong',114.65,4.8)],
'bb':[('Speightstown',-59.6412,13.2507),('Oistins',-59.5429,13.0707)],
}
def simple(iso):
 if iso=='GF':return dict(iso='gf',atlasId='250',atlasName='France',name='France (French Guiana)',center=[-53,4])
 p=byiso[iso];n=str(p['ISO_N3']).zfill(3)
 return dict(iso=iso.lower(),atlasId=n,atlasName=ids.get(n,p['NAME']),name=p['ADMIN'],center=[p['LABEL_X'],p['LABEL_Y']])
out={}
for line in rows.splitlines():
 code,iso,nb,transit,port,sea,fact,observation,slug=line.split('|');m=meta[code];p=simple(iso)
 a=[f for f in cityfs if f['properties']['iso_a2']==iso]
 a.sort(key=lambda f:(-f['properties']['adm0cap'],-f['properties']['pop_max']))
 if code=='bo':a.sort(key=lambda f:(f['properties']['name']!='Sucre',-f['properties']['pop_max']))
 if code=='bi':a.sort(key=lambda f:(f['properties']['name']!='Gitega',-f['properties']['pop_max']))
 if code=='bj':a.sort(key=lambda f:(f['properties']['name']!='Porto-Novo',-f['properties']['pop_max']))
 cities=[dict(id=code+'-city-'+str(i),name=f['properties']['name'],coordinates=f['geometry']['coordinates'],source='natural-earth-10m-places') for i,f in enumerate(a[:4])]
 for name,x,y in extras.get(code,[]):cities.append(dict(id=code+'-town-'+str(len(cities)),name=name,coordinates=[x,y],source='editorial-coordinate-pending-verification'))
 cities=cities[:4]
 # The capital identity is a stable ID, never a language-specific string comparison.

 if code=='bi':cities[0].update(coordinates=[29.93218,-3.42733],source='https://ungegn.un.org/dashboard/cities/details?id=3419')
 cities[0]['name']=m['capitalEn'];cities[0]['labelJa']=m['capitalJa'];cities[0]['isCapital']=True
 photo=m['heritage'][0]
 out[code]={**p,'countryCode':code,'nameEn':m['nameEn'],'nameJa':m['nameJa'],'group':'A' if code in json.load(open('src/data/countries_a.json')) else 'B','continent':byiso[iso]['CONTINENT'],
 'cities':cities,'capitalId':cities[0]['id'],'capitalNote':'Sucre is the constitutional capital; La Paz is the seat of government.' if code=='bo' else 'Porto-Novo is the capital; Cotonou hosts many government offices.' if code=='bj' else '',
 'neighbors':[simple(n) for n in nb.split()], 'neighborKind':'sea-region' if code in islands else 'land-border',
 'neighborNote':{'ao':'カビンダ州はコンゴ共和国・コンゴ民主共和国とも接します。','az':'トルコとは飛び地ナヒチェヴァンで接します。','dz':'西サハラは地位が争われている地域です。','br':'フランス領ギアナはフランスの海外県です。','ba':'ネウムに短い海岸があり、内陸国ではありません。'}.get(code,''),
 'landlocked':code in landlocked,'factJa':fact,'observationJa':observation,
 'route':{'via':transit,'port':port,'sea':sea,'domestic':code not in landlocked,'noteJa':'地理上の接続を学ぶ模式ルートです。現在の国境通行・運航・貿易条件を示すものではありません。'},
 'photo':{'url':photo['image'],'sourceUrl':photo['imageSource'],'credit':photo['imageCredit'],'license':photo['imageLicense'],'licenseUrl':photo['imageLicenseUrl'],'captionJa':photo['title'],'captionEn':photo['titleEn'],'descriptionJa':photo['description'],'contentVerified':False},
 'sources':[{'id':'natural-earth-50m','url':'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/','use':'country identity, cartographic label position and continent'}, {'id':'natural-earth-10m-places','url':'https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places_simple.geojson','use':'city point coordinates; approximate cartographic points, not administrative extents'}, {'id':'mofa','url':'https://www.mofa.go.jp/mofaj/area/'+slug+'/data.html','use':'country reference; review pending'}],
 'qa':{'releaseReady':False,'geographyReview':'pending','photoReview':'pending','routeReview':'pending'}}
reviews=json.load(open('src/data/geography/photo-review.json'))
for code,review in reviews.items():
 out[code]['photo'].update(review['photo']);out[code]['qa']['photoReview']='visually-reviewed';out[code].update({k:v for k,v in review.items() if k!='photo'})
Path('src/data/geography').mkdir(exist_ok=True)
Path('src/data/geography/round1.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('Created new packages:',len(out),'countries; independent from missions_*.json')
