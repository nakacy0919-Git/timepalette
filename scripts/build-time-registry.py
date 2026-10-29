"""Build capital/city timezone snapshot from canonical countries and compiled IANA tzdata.
Usage: python scripts/build-time-registry.py /path/to/zic/output
Compile official tzdata2026f with zic first. No network access is performed here.
"""
import datetime as dt, glob, hashlib, json, pathlib, sys
from zoneinfo import ZoneInfo
root=pathlib.Path(__file__).resolve().parents[1]
countries={}
for path in sorted((root/'src/data').glob('countries_*.json')):
    countries.update(json.loads(path.read_text()))
assert len(countries)==197
# Select an unambiguous actual city where the country metadata lists multiple seats.
city_overrides={
 'eh':('アイウン','Laayoune'), 'id':('ジャカルタ','Jakarta'),
 'il':('エルサレム','Jerusalem'), 'lk':('コロンボ','Colombo'),
 'nl':('アムステルダム','Amsterdam'), 'nr':('ヤレン地区','Yaren District'),
 'ps':('ラマッラ','Ramallah'), 'sz':('ムババーネ','Mbabane'),
 'ye':('アデン','Aden'), 'za':('プレトリア','Pretoria'),
 'bo':('スクレ','Sucre'), 'ch':('ベルン','Bern')}
registry={}
for iso,c in sorted(countries.items()):
    ja,en=city_overrides.get(iso,(c['capitalJa'],c['capitalEn']))
    registry[iso]={'nameJa':c['nameJa'],'nameEn':c['nameEn'],'cityJa':ja,'cityEn':en,'zone':c['timeZone']}
zones={c['zone'] for c in registry.values()}|{'America/Los_Angeles','Pacific/Auckland','Australia/Sydney','UTC'}
start=int(dt.datetime(2025,1,1,tzinfo=dt.timezone.utc).timestamp())
end=int(dt.datetime(2037,1,1,tzinfo=dt.timezone.utc).timestamp())
transitions={}
for name in sorted(zones):
    with open(pathlib.Path(sys.argv[1])/name,'rb') as f: zone=ZoneInfo.from_file(f,key=name)
    def offset(t): return int(dt.datetime.fromtimestamp(t,dt.timezone.utc).astimezone(zone).utcoffset().total_seconds()/60)
    previous=offset(start); rows=[[start,previous]]; t=start
    while t<end:
        nxt=min(t+21600,end); current=offset(nxt)
        if current!=previous:
            lo,hi=t,nxt
            while hi-lo>1:
                mid=(lo+hi)//2
                if offset(mid)==previous:lo=mid
                else:hi=mid
            rows.append([hi,current]);previous=current
        t=nxt
    transitions[name]=rows
out={'version':'2026f','source':'https://data.iana.org/time-zones/releases/tzdata2026f.tar.gz','validFrom':start,'validUntil':end,'countries':registry,'zones':transitions}
(root/'src/data/world-adventure/time/time197.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
print(f'{len(registry)} countries, {len(transitions)} zones, {sum(map(len,transitions.values()))} offset records')
