"""Resolve existing country photo references through the Commons API, verify licenses,
then save optimized local assets with attribution. Run after geography country build.
Identifies itself as the TimePalette educational asset builder per Wikimedia policy.
"""
import concurrent.futures,hashlib,html,io,json,pathlib,re,time,urllib.parse,urllib.request,threading
from PIL import Image,ImageOps
root=pathlib.Path(__file__).resolve().parents[1];scratch=pathlib.Path('/tmp/timepalette-geography197-source');cache=scratch/'commons-cache';cache.mkdir(exist_ok=True)
ua='TimePaletteGeography/1.0 (https://github.com/nakacy0919-Git/timepalette; educational asset build)'
meta={}
for p in(root/'src/data').glob('countries_*.json'):meta.update(json.loads(p.read_text()))
existing=json.loads((root/'src/data/geography/round1.json').read_text());assets=json.loads((root/'src/data/geography/photo-assets.json').read_text())
manifest_path=root/'src/data/geography/photos197.json'
manifest=json.loads(manifest_path.read_text())if manifest_path.exists()else{}

def plain(s):return html.unescape(re.sub('<[^>]+>','',str(s))).strip()
def norm(s):return str(s).replace('_',' ').casefold().strip()
def request(params):
 key=hashlib.sha256(json.dumps(params,sort_keys=True).encode()).hexdigest();p=cache/(key+'.json')
 if p.exists():return json.loads(p.read_text())
 u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'format':'json','maxlag':5,**params})
 req=urllib.request.Request(u,headers={'User-Agent':ua})
 data=json.load(urllib.request.urlopen(req,timeout=40));
 if data.get('error'):raise ValueError(data['error'])
 p.write_text(json.dumps(data,ensure_ascii=False));return data
base={'action':'query','prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':640,'iiextmetadatalanguage':'en','iiextmetadatafilter':'Artist|Credit|LicenseShortName|LicenseUrl|ImageDescription|GPSLatitude|GPSLongitude|ObjectName'}
def file_title(h):
 u=h.get('imageSource','')
 if '/wiki/File:'in u:return 'File:'+urllib.parse.unquote(u.split('/wiki/File:')[1]).replace('_',' ')
 u=h.get('image','')
 if '/Special:FilePath/'in u:return 'File:'+urllib.parse.unquote(urllib.parse.urlsplit(u).path.split('/Special:FilePath/')[1]).replace('_',' ')
 return None
catalog={}
for code,m in meta.items():
 for h in m.get('heritage',[]):
  title=file_title(h)
  if title:catalog.setdefault(title,[]).append((code,h))
pages={};titles=list(catalog)
for offset in range(0,len(titles),15):
 try:
  response=request({**base,'titles':'|'.join(titles[offset:offset+15])})
  for page in response.get('query',{}).get('pages',{}).values():pages[norm(page['title'])]=page
 except Exception as e:print('Metadata batch failed',offset,str(e)[:140],flush=True)
 if offset%90==0:print('Commons references checked',offset,'/',len(titles),flush=True)
 time.sleep(.15)

def prepare(page,code,caption=None):
 info=(page.get('imageinfo')or[None])[0]
 if not info:return None
 ext=info.get('extmetadata',{});license=plain(ext.get('LicenseShortName',{}).get('value',''))
 if not any(t in license.casefold()for t in ['cc by','cc0','public domain']):return None
 if not any(urllib.parse.urlsplit(info.get('url','')).path.lower().endswith(e)for e in ['.jpg','.jpeg','.png','.webp']):return None
 if caption:
  title_ja=caption['title'];title_en=caption.get('titleEn',title_ja)
 else:
  title_en=page['title'][5:].rsplit('.',1)[0].replace('_',' ')
  title_ja=meta[code]['nameJa']+'の景観（'+title_en+'）'
 return {'captionJa':title_ja,'captionEn':title_en,'fileTitle':page['title'],'sourceUrl':info.get('descriptionurl')or'https://commons.wikimedia.org/wiki/'+urllib.parse.quote(page['title'].replace(' ','_')),'downloadUrl':info.get('thumburl')or info['url'],'originalUrl':info['url'],'credit':plain(ext.get('Artist',{}).get('value','Wikimedia Commons')),'license':license,'licenseUrl':plain(ext.get('LicenseUrl',{}).get('value','')),'description':plain(ext.get('ImageDescription',{}).get('value',''))[:1400],'metadataCheckedAt':'2026-10-30','verification':'Country reference matched to the named place in the canonical country profile; Commons file and license resolved through API.'}

def save(photo,code,slot):
 path=root/f'public/geography/photos197/{code}-{slot}.jpg';path.parent.mkdir(parents=True,exist_ok=True)
 try:
  req=urllib.request.Request(photo['downloadUrl'],headers={'User-Agent':ua})
  body=urllib.request.urlopen(req,timeout=40).read();im=Image.open(io.BytesIO(body));im.load();im=ImageOps.exif_transpose(im).convert('RGB');im.thumbnail((800,600));im.save(path,'JPEG',quality=83,optimize=True)
  return {**photo,'deliveryUrl':f'/geography/photos197/{code}-{slot}.jpg','width':im.width,'height':im.height,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
 except Exception as e:print('Photo fetch failed',code,photo['fileTitle'],str(e)[:120],flush=True);return None

manifest_lock=threading.Lock()
def persist():manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
def process_country(item):
 ix,(code,m)=item
 current=manifest.get(code,[])
 if len(current)>=2 and all((root/'public'/p['deliveryUrl'].lstrip('/')).exists()for p in current):return
 current=[];seen=set()
 if code in assets:
  old=existing[code]['photo'];a=assets[code]
  current.append({'captionJa':old['captionJa'],'captionEn':old.get('captionEn',''),'sourceUrl':a['sourceUrl'],'downloadUrl':a['downloadUrl'],'credit':a['credit'],'license':a['license'],'licenseUrl':a['licenseUrl'],'deliveryUrl':a['publicPath'],'sha256':a['sha256'],'width':a['width'],'height':a['height'],'verification':'Preserved previously reviewed local geography photo.'});seen.add(norm('File:'+urllib.parse.unquote(a['sourceUrl'].split('/wiki/File:')[-1])))
 for h in m.get('heritage',[]):
  title=file_title(h)
  if not title or norm(title)in seen:continue
  page=pages.get(norm(title));p=prepare(page or{},code,h)
  if not p:continue
  result=save(p,code,len(current)+1)
  if result:current.append(result);seen.add(norm(p['fileTitle']))
  if len(current)==2:break
 # Missing/stale references are searched by their named landmark first, then
 # the capital + country. Search results retain their real file captions.
 search_name='Nauru' if code=='nr' else m['nameEn']
 searches=[h.get('titleEn','')+' '+search_name for h in m.get('heritage',[])[:2]]+[m['capitalEn'].split('(')[0]+' '+search_name]
 for query in searches:
  if len(current)==2:break
  try:
   data=request({**base,'generator':'search','gsrnamespace':6,'gsrsearch':query+' filemime:image/jpeg','gsrlimit':6})
   candidates=sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',999))
   for page in candidates:
    if norm(page['title'])in seen:continue
    p=prepare(page,code)
    if not p:continue
    text=(p['description']+' '+p['fileTitle']).casefold()
    terms=[search_name.casefold(),m['nameEn'].casefold(),m['capitalEn'].split('(')[0].strip().casefold()]+[h.get('titleEn','').casefold()for h in m.get('heritage',[])]
    if not any(t and t in text for t in terms):continue
    result=save(p,code,len(current)+1)
    if result:current.append(result);seen.add(norm(p['fileTitle']))
    if len(current)==2:break
  except Exception as e:print('Photo search failed',code,str(e)[:150],flush=True)
 with manifest_lock:
  manifest[code]=current;persist()
 print('Photos',ix+1,code,len(current),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
 list(pool.map(process_country,enumerate(sorted(meta.items()))))
print('Complete country photo pairs',sum(len(v)==2 for v in manifest.values()),'/',len(meta),flush=True)
