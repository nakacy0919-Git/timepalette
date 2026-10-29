"""Build the 197-country geography curriculum from pinned public geographic extracts.
Requires shapely + scipy. Source files are independently downloaded, never fabricated.
python scripts/build-geography197.py --source-dir /path/to/source
"""
import argparse,collections,datetime,hashlib,json,math,pathlib,zipfile
import numpy as np
from scipy.spatial import cKDTree
from shapely import make_valid,union_all,STRtree
from shapely.geometry import shape,mapping,Point
from shapely.geometry.polygon import orient
parser=argparse.ArgumentParser();parser.add_argument('--source-dir',required=True);args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];src=pathlib.Path(args.source_dir)
meta={}
for p in sorted((root/'src/data').glob('countries_*.json')):meta.update(json.loads(p.read_text()))
assert len(meta)==197
raw=json.loads((src/'countries.geojson').read_text())['features']
ne_cities=json.loads((src/'cities.geojson').read_text())['features']
ci={r.split('\t')[0].lower():r.split('\t')for r in (src/'countryInfo.txt').read_text().splitlines()if r.strip()and not r.startswith('#')}
rows=[r.split('\t')for r in zipfile.ZipFile(src/'cities15000.zip').read('cities15000.txt').decode().splitlines()]
local_rows={}
for p in src.glob('??.zip'):
 try:local_rows[p.stem.lower()]=[r.split('\t')for r in zipfile.ZipFile(p).read(p.stem+'.txt').decode().splitlines()]
 except KeyError:pass
countries_by_iso={}
for f in raw:
 code=f['properties']['ISO_A2_EH'].lower()
 if code not in countries_by_iso or shape(f['geometry']).area>shape(countries_by_iso[code]['geometry']).area:countries_by_iso[code]=f
by_sov={countries_by_iso[c]['properties']['SOV_A3']:c for c in meta}
# Dependencies have an explicit owner in the dataset. Freely associated states
# outside the app's 197-country registry are not reclassified as NZ territory.
def owner(f):
 iso=f['properties']['ISO_A2_EH'].lower()
 if iso in meta:return iso
 if iso in ['ck','nu']:return None
 return by_sov.get(f['properties']['SOV_A3'])
shapes=[make_valid(shape(f['geometry']))for f in raw]
owned={c:union_all([s for f,s in zip(raw,shapes)if owner(f)==c])for c in meta}
# Keep geographic regions outside the 197 curriculum (e.g. Kosovo) on context maps.
all_geometries={**owned}
for f,s in zip(raw,shapes):
 iso=f['properties']['ISO_A2_EH'].lower()
 if owner(f) is None and iso not in ['-99','aq']:all_geometries.setdefault(iso,s)
labels={c:{'iso':c,'name':meta[c]['nameEn'],'nameJa':meta[c]['nameJa'],'atlasName':countries_by_iso[c]['properties']['NAME'],'center':[countries_by_iso[c]['properties']['LABEL_X'],countries_by_iso[c]['properties']['LABEL_Y']]}for c in meta}
for f in raw:
 iso=f['properties']['ISO_A2_EH'].lower();p=f['properties']
 if iso in all_geometries and iso not in labels:labels[iso]={'iso':iso,'name':p['ADMIN'],'nameJa':p.get('NAME_JA')or p['NAME'],'atlasName':p['NAME'],'center':[p['LABEL_X'],p['LABEL_Y']]}
# The coastline graph is built from shared line segments, not bounding boxes.
adjacency={c:[]for c in all_geometries};border_points={}
keys=list(all_geometries)
for i,a in enumerate(keys):
 for b in keys[i+1:]:
  ga,gb=all_geometries[a],all_geometries[b]
  if not ga.bounds[0]<=gb.bounds[2] or not gb.bounds[0]<=ga.bounds[2]:continue
  if not ga.intersects(gb):continue
  shared=ga.boundary.intersection(gb.boundary)
  if shared.length<=1e-7:continue
  adjacency[a].append(b);adjacency[b].append(a)
  lines=list(shared.geoms)if hasattr(shared,'geoms')else[shared]
  lines=[g for g in lines if g.geom_type in ['LineString','LinearRing']]
  if lines:
   line=max(lines,key=lambda g:g.length);point=line.interpolate(.5,normalized=True)
   border_points[tuple(sorted([a,b]))]=[round(point.x,6),round(point.y,6)]
exceptions=[('bw','zm',[25.26,-17.79],'https://www.jica.go.jp/english/information/seminar/2024/20250304.html'),('ca','dk',[-66.45,80.82],'https://www.canada.ca/en/global-affairs/news/2022/06/boundary-dispute.html')]
for a,b,point,url in exceptions:
 for u,v in [(a,b),(b,a)]:
  if v not in adjacency[u]:adjacency[u].append(v)
 border_points[tuple(sorted([a,b]))]=point
landlocked=set('af ad am at az by bt bo bw bf bi cf td cz et hu kz kg la ls li lu mw ml md mn np ne mk py rw sm rs sk ss sz ch tj tm ug uz va zm zw'.split())
assert len(landlocked)==44,len(landlocked)
# Notes are statements about roles, never an arbitrary replacement of the capital.
notes={
 'gq':'2026年1月にシウダ・デ・ラ・パスへの遷都が宣言されました。マラボには引き続き首都機能が残ります。',
 'za':'行政の首都プレトリアを探します。立法の中心はケープタウン、司法の中心はブルームフォンテーンです。',
 'lk':'首都スリ・ジャヤワルダナプラ・コッテを扱います。コロンボとは区別します。',
 'bo':'憲法上の首都はスクレ。政府所在地ラパスとは区別します。',
 'nl':'首都はアムステルダム。政府・議会の所在地ハーグとは区別します。',
 'ch':'ベルンは連邦政府所在地（連邦都市）です。',
 'nr':'正式な首都は定められていないため、政府機関があるヤレン地区を探します。',
 'pw':'マルキョク州のンゲルルムッドを探します。旧首都コロールとは区別します。',
 'ps':'パレスチナが首都と主張する東エルサレムを扱います。行政の中心ラマッラとは区別します。国際的な地位には争いがあります。',
 'il':'イスラエルが首都とするエルサレムを扱います。国際的な地位には争いがあります。',
 'eh':'西サハラの地位には争いがあり、確定した首都を問う問題にはしません。主要都市アイウンを探します。',
 'id':'この教材では現時点の首都ジャカルタを扱います。ヌサンタラへの首都移転計画とは区別します。',
 'ye':'憲法上の首都サヌアを扱います。臨時の政府所在地アデンとは区別します。',
 'my':'首都はクアラルンプール。行政の中心プトラジャヤとは区別します。',
 'bj':'首都はポルトノボ。コトヌーとは区別します。',
 'bi':'政治上の首都はギテガ。ブジュンブラとは区別します。'}
capital_ja={'gq':'シウダ・デ・ラ・パス','za':'プレトリア','lk':'スリ・ジャヤワルダナプラ・コッテ','bo':'スクレ','nl':'アムステルダム','ch':'ベルン','nr':'ヤレン地区','pw':'ンゲルルムッド','ps':'東エルサレム','il':'エルサレム','eh':'アイウン','id':'ジャカルタ','ye':'サヌア','my':'クアラルンプール','bj':'ポルトノボ','bi':'ギテガ'}
override_ids={'lk':'1238992','ps':'7303419','il':'281184'}
all_rows={r[0]:r for r in rows}
for rr in local_rows.values():all_rows.update({r[0]:r for r in rr})
profiles={}
def gn_city(r,c,capital=False):return {'id':c+'-gn-'+r[0],'name':r[1],'coordinates':[float(r[5]),float(r[4])],'featureCode':r[7],'source':'https://www.geonames.org/'+r[0]+'/','isCapital':capital}
for code,m in sorted(meta.items()):
 rr=[r for r in rows if r[8].lower()==code];full=local_rows.get(code,[])
 if code in override_ids:caprow=all_rows[override_ids[code]]
 elif code=='eh':caprow=next(r for r in full if r[0]=='2462881')
 else:
  candidates=[r for r in rr+full if r[7]=='PPLC']
  if not candidates:raise ValueError('No independently identified capital '+code)
  caprow=candidates[0]
 capital=gn_city(caprow,code,True);capital['labelJa']=capital_ja.get(code,m['capitalJa'])
 cities=[capital];seen={capital['name'].casefold()};coords=[capital['coordinates']]
 # Prefer real cities. Tiny city-states use named districts/landmarks, explicitly labelled.
 candidates=sorted([r for r in rr+full if r[6]=='P' and not r[7].endswith(('Q','W'))],key=lambda r:(-int(r[14]or 0),r[7]!='PPLA',r[1]))
 candidates+=sorted([r for r in full if r[6]=='S'and r[7]in ['MUS','SQR','CH','BLDG','PAL','GOVS','PRK','TOWR']],key=lambda r:(r[7]not in ['MUS','SQR','CH'],r[1]))
 for r in candidates:
  point=[float(r[5]),float(r[4])]
  if r[1].casefold()in seen or any(math.dist(point,p)<.0008 for p in coords):continue
  if not owned[code].buffer(.015).covers(Point(point)):continue
  cities.append(gn_city(r,code));seen.add(r[1].casefold());coords.append(point)
  if len(cities)==4:break
 if len(cities)<4:
  for f in sorted([f for f in ne_cities if f['properties']['iso_a2'].lower()==code],key=lambda f:-f['properties']['pop_max']):
   n=f['properties']['name'];point=f['geometry']['coordinates']
   if n.casefold()in seen or any(math.dist(point,p)<.02 for p in coords):continue
   cities.append({'id':code+'-ne-'+str(f['properties']['ne_id']),'name':n,'coordinates':point,'source':'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/','featureCode':'place'});seen.add(n.casefold());coords.append(point)
   if len(cities)==4:break
 if len(cities)<4:raise ValueError('Not four real locations '+code+': '+str([c['name']for c in cities]))
 nb=[]
 for n in sorted(adjacency[code]):
  if n not in labels:continue
  nb.append({**labels[n],'borderPoint':border_points.get(tuple(sorted([code,n])))})
 props=countries_by_iso[code]['properties']
 profiles[code]={**labels[code],'countryCode':code,'nameEn':m['nameEn'],'group':next(p.stem[-1].upper()for p in(root/'src/data').glob('countries_*.json')if code in json.loads(p.read_text())),'continent':props['CONTINENT'],'cities':cities,'capitalId':capital['id'],'capitalNameJa':capital['labelJa'],'capitalRoleJa':'主要都市'if code=='eh'else'政府所在地'if code in ['nr','ch']else'行政の首都'if code=='za'else'主張される首都'if code in ['ps','il']else'首都','capitalNote':notes.get(code,''),'neighbors':nb,'neighborKind':'land-border'if nb else'sea-region','landlocked':code in landlocked,'sourceCountryId':props['NE_ID']}
print('Capitals and four actual places:',len(profiles),flush=True)
# Shoreline nearest-neighbor calculations use 3-D unit-sphere coordinates,
# keeping the antimeridian and polar islands correct (not planar longitude).
def rings(g):
 if g.geom_type=='Polygon':yield list(g.exterior.coords)
 elif hasattr(g,'geoms'):
  for part in g.geoms:yield from rings(part)
def sample(g):
 result=[]
 for ring in rings(g):
  for a,b in zip(ring,ring[1:]):
   dx=(b[0]-a[0]+180)%360-180;dy=b[1]-a[1]
   steps=max(1,math.ceil(max(abs(dx)*math.cos(math.radians((a[1]+b[1])/2)),abs(dy))/.01))
   for i in range(steps):result.append([((a[0]+dx*i/steps+180)%360)-180,a[1]+dy*i/steps])
 return np.asarray(result,dtype=float)
def xyz(points):
 lon,lat=np.radians(points[:,0]),np.radians(points[:,1]);return np.column_stack((np.cos(lat)*np.cos(lon),np.cos(lat)*np.sin(lon),np.sin(lat)))
def direction(a,b):
 x1,y1,x2,y2=map(math.radians,[a[0],a[1],b[0],b[1]]);dl=x2-x1
 angle=(math.degrees(math.atan2(math.sin(dl)*math.cos(y2),math.cos(y1)*math.sin(y2)-math.sin(y1)*math.cos(y2)*math.cos(dl)))+360)%360
 return ['北','北東','東','南東','南','南西','西','北西'][int((angle+22.5)//45)%8]
shore={c:sample(owned[c])for c in profiles};trees={c:cKDTree(xyz(points))for c,points in shore.items()}
nearest_cache_path=src/'nearest-cache-v2.json'
nearest_cache=json.loads(nearest_cache_path.read_text())if nearest_cache_path.exists()else{}
for i,(code,p)in enumerate(profiles.items()):
 if p['neighbors']:continue
 if code in nearest_cache:
  p['nearest']=nearest_cache[code];continue
 points=shore[code];coords3d=xyz(points);nearest=[]
 for other in profiles:
  if other==code:continue
  distances,indices=trees[other].query(coords3d,workers=1);ix=int(np.argmin(distances));jx=int(indices[ix]);chord=float(distances[ix]);km=2*6371.0088*math.asin(min(1,chord/2));nearest.append((km,other,points[ix].tolist(),shore[other][jx].tolist()))
 nearest.sort();km,other,a,b=nearest[0]
 # Identify which territory contains the nearest coast, for meaningful context.
 territory=min([(s.distance(Point(b)),f['properties'])for f,s in zip(raw,shapes)if owner(f)==other],key=lambda x:x[0])[1]
 extra=territory.get('NAME_JA')or territory['NAME']
 suffix='（'+extra+'）'if territory['ISO_A2_EH'].lower()!=other or territory['ADMIN']!=countries_by_iso[other]['properties']['ADMIN'] else''
 if other=='fr':
  if 48<b[0]<58 and -25<b[1]<-15:suffix='（レユニオン）'
  elif -65<b[0]<-60 and 15.5<b[1]<17:suffix='（グアドループ）'
  elif -65<b[0]<-60 and 14<b[1]<=15.5:suffix='（マルティニーク）'
  elif -55<b[0]<-51 and 2<b[1]<6:suffix='（フランス領ギアナ）'
 p['nearest']={'countryIso':other,'countryNameJa':profiles[other]['nameJa']+suffix,'distanceKm':round(km,1),'from':a,'to':b,'direction':direction(a,b),'candidates':[{'iso':n,'distanceKm':round(d,1)}for d,n,_,_ in nearest[:4]],'definitionJa':'対象197か国の中で、小島・海外領土を含む国土の海岸間を比較。Natural Earthの地図上での概算です。領有権や国境線について特定の立場を示すものではありません。'}
 nearest_cache[code]=p['nearest'];nearest_cache_path.write_text(json.dumps(nearest_cache,ensure_ascii=False))
 if i%10==0:print('Nearest coast computed:',code,other,round(km),flush=True)
# Assign ports to the nearest geographic country polygon, then reject inland
# ports by distance from the separate ocean-coastline dataset.
coast=json.loads((src/'coastline.geojson').read_text())['features'];coast_shapes=[shape(f['geometry'])for f in coast];coast_tree=STRtree(coast_shapes);country_tree=STRtree(shapes)
ports=collections.defaultdict(list)
for f in json.loads((src/'ports.geojson').read_text())['features']:
 point=shape(f['geometry']);ix=int(country_tree.nearest(point));owner_code=owner(raw[ix])
 if owner_code not in profiles or owner_code in landlocked:continue
 if shapes[ix].distance(point)>.15:continue
 if coast_shapes[int(coast_tree.nearest(point))].distance(point)>.12:continue
 if 44<point.x<56 and 35<point.y<48:continue # Caspian ports do not connect to an ocean.
 ports[owner_code].append({'name':f['properties']['name'],'coordinates':[point.x,point.y],'sourceId':f['properties']['ne_id']})
# Supplement sparse Natural Earth coverage with the NGA World Port Index,
# distributed by the US Department of Energy's NETL public feature service.
wpi=json.loads((src/'world-port-index.geojson').read_text())['features']
missing_ports={c for c in profiles if c not in landlocked and not ports.get(c)}
for f in wpi:
 if not f.get('geometry'):continue
 point=shape(f['geometry']);props=f['properties'];locode=str(props.get('unlocode')or'').strip();code=locode[:2].lower()
 if code not in profiles:
  ix=int(country_tree.nearest(point));code=owner(raw[ix])
 if code not in missing_ports:continue
 water=str(props.get('dodwaterbody')or'')
 if any(t in water.casefold()for t in ['caspian','aral','lake']):continue
 if not props.get('main_port_name'):continue
 ports[code].append({'name':props['main_port_name'],'coordinates':[point.x,point.y],'sourceId':'NGA-WPI-'+str(props['wpinumber']),'sourceUrl':'https://arcgis.netl.doe.gov/server/rest/services/Hosted/CCS_EJ_SJ_Data/FeatureServer/17','waterbody':water})
print('Coastal countries without a source port:',[c for c in profiles if c not in landlocked and not ports[c]],flush=True)
for code,p in profiles.items():
 possible=[];queue=collections.deque([(code,[code])]);seen={code}
 while queue:
  current,path=queue.popleft()
  if ports.get(current):
   for port in ports[current]:
    # Prefer short country chains; straight-line distance only breaks ties.
    dist=float(np.linalg.norm(xyz(np.asarray([p['cities'][0]['coordinates']]))[0]-xyz(np.asarray([port['coordinates']]))[0]));possible.append((len(path),dist,path,port))
   continue
  for nxt in adjacency.get(current,[]):
   if nxt in profiles and nxt not in seen:seen.add(nxt);queue.append((nxt,path+[nxt]))
 if not possible:raise ValueError('No sourced coastal port/route '+code)
 _,_,path,port=min(possible,key=lambda row:(row[0],row[1]))
 # A short coastline need not have a listed cargo port (e.g. Bosnia).
 # In that case a sourced neighboring-country port is a valid schematic route.
 p['route']={'countryPath':path,'countries':[{'iso':c,'nameJa':profiles[c]['nameJa'],'nameEn':profiles[c]['nameEn']}for c in path],'port':port['name'],'portCoordinates':port['coordinates'],'portSourceId':port['sourceId'],'portSourceUrl':port.get('sourceUrl','https://www.naturalearthdata.com/downloads/10m-cultural-vectors/ports/'),'waterbody':port.get('waterbody',''),'domestic':path==[code],'noteJa':'国と港の地理上のつながりを学ぶ模式ルートです。実際の道路・通関・運航状況や、推奨する輸送経路を示すものではありません。'}
 p['factJa']=f"{p['nameJa']}は、海に面していない内陸国です。"if p['landlocked']else f"{p['nameJa']}には海に面した国土があります。"
 p['sources']=[{'name':'NGA World Port Index / US DOE NETL','url':p['route']['portSourceUrl']},{'name':'Natural Earth 1:10m countries, places, ports and coastline','url':'https://www.naturalearthdata.com/'},{'name':'GeoNames (CC BY 4.0) city/place coordinates','url':'https://www.geonames.org/'}]
 if code in ['gq','lk','pw','id','za','nr','ps','il']:p['sources'].append({'name':'外務省・在外公館の首都情報','url':{'gq':'https://www.mofa.go.jp/mofaj/area/eq_guinea/data.html','lk':'https://www.mofa.go.jp/mofaj/area/srilanka/data.html','pw':'https://www.palau.emb-japan.go.jp/itpr_ja/about_Palau.html','id':'https://www.mofa.go.jp/mofaj/area/indonesia/data.html','za':'https://www.mofa.go.jp/mofaj/area/s_africa/data.html','nr':'https://www.mofa.go.jp/mofaj/area/nauru/data.html','ps':'https://www.mofa.go.jp/mofaj/area/palestine/data.html','il':'https://www.mofa.go.jp/mofaj/area/israel/data.html'}[code]})
 for a,b,point,url in exceptions:
  if code in [a,b]:p['sources'].append({'name':'短い国境・新しい国境の補足資料','url':url})
 p['neighborNote']='小島・海外領土の国境も含む地図上の位置関係です。国境・領土の扱いはNatural Earthの区分に基づきます。'
# Orient outer rings clockwise for d3-geo, retaining microstates and atolls.
def oriented(g):
 if g.geom_type=='Polygon':return orient(g,sign=-1)
 return type(g)([oriented(part)for part in g.geoms if part.geom_type in ['Polygon','MultiPolygon']])
def simplified_parts(g):
 if g.geom_type=='Polygon':return g.simplify(min(.008,math.sqrt(g.area)/100),preserve_topology=True)
 return type(g)([simplified_parts(part)for part in g.geoms if part.geom_type in ['Polygon','MultiPolygon']])
def rounded_geometry(value):
 if isinstance(value,dict):return {k:rounded_geometry(v)for k,v in value.items()}
 if isinstance(value,(tuple,list)):return [rounded_geometry(v)for v in value]
 if isinstance(value,float):return round(value,5)
 return value
features=[]
for code,g in all_geometries.items():
 simplified=oriented(simplified_parts(g));features.append({'type':'Feature','id':code,'properties':{'iso':code,'name':labels[code]['name'],'nameJa':labels[code]['nameJa'],'continent':profiles.get(code,{}).get('continent')},'geometry':rounded_geometry(mapping(simplified))})
outdir=root/'src/data/geography';outdir.mkdir(exist_ok=True)
(outdir/'countries197.json').write_text(json.dumps(profiles,ensure_ascii=False,separators=(',',':'))+'\n')
(outdir/'world197.json').write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':'))+'\n')
manifest=[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'retrievedAt':'2026-10-30'}for p in src.iterdir()if p.suffix in ['.geojson','.zip','.txt']]
(outdir/'sources197.json').write_text(json.dumps({'sources':manifest,'sourceUrls':{'countries':'https://github.com/nvkelso/natural-earth-vector/tree/master/geojson','places':'https://download.geonames.org/export/dump/','capitalReference':'https://www.mofa.go.jp/mofaj/area/','naturalEarthLicense':'Public domain','geoNamesLicense':'CC BY 4.0'},'nearestMethod':'Coastline vertices densified to <=0.01 degree, 3-D unit-sphere nearest-neighbor search; approximate distance; no centroid proxy.','capitalRoleNotes':notes},ensure_ascii=False,indent=2)+'\n')
print('Generated',len(profiles),'countries,',len(features),'map polygons; all capital identities, four actual points and routes resolved',flush=True)
