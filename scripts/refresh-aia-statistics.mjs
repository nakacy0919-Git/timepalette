// Manual editorial refresh. Never publishes questions or modifies the reviewed catalog.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const seedPath=new URL('../docs/aia-refresh/verified-statistics-seed.json',import.meta.url);
export function parseRows(payload,indicator,scope,{maxYear=new Date().getUTCFullYear()}={}){
 if(!Array.isArray(payload)||!Array.isArray(payload[1]))throw Error('Invalid World Bank payload');
 const result={};
 for(const r of payload[1]){
  const iso=r.country?.id,year=Number(r.date);
  if(!scope.includes(iso)||r.indicator?.id!==indicator||r.value===null||typeof r.value!=='number'||!Number.isFinite(r.value)||!Number.isInteger(year)||year<1900||year>maxYear)continue;
  if(!result[iso]||year>result[iso].year)result[iso]={value:r.value,year};
 }
 return result;
}
export async function refresh({seed,fetcher=fetch,checkedOn=new Date().toISOString().slice(0,10)}){
 const countries=structuredClone(seed.countries),errors=[],coverage={};
 for(const [indicator,unit] of Object.entries(seed.indicators)){
  try{
   const url=new URL('https://api.worldbank.org/v2/country/all/indicator/'+indicator);
   url.search=new URLSearchParams({format:'json',mrnev:'1',per_page:'500',source:'2'}).toString();
   const response=await fetcher(url,{signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const body=await response.json();
   if(Number(body?.[0]?.pages)>1)throw Error('Unexpected pagination; refusing incomplete snapshot');
   const values=parseRows(body,indicator,seed.scope,{maxYear:Number(checkedOn.slice(0,4))});
   if(!Object.keys(values).length)throw Error('No usable observations returned');
   coverage[indicator]=Object.keys(values).length;
   for(const [iso,row] of Object.entries(values)){
    countries[iso]??={};
    const old=countries[iso][indicator];
    if(old&&old.year>row.year)continue;
    countries[iso][indicator]={...row,unit,source:url.toString(),indicatorUrl:'https://data.worldbank.org/indicator/'+indicator+'?locations='+iso,verifiedOn:checkedOn,precision:'api_observation'};
   }
  }catch(e){errors.push({indicator,error:String(e.message||e)});}
 }
 const missing=seed.scope.flatMap(iso=>Object.keys(seed.indicators).filter(id=>!countries[iso]?.[id]).map(indicator=>({iso,indicator})));
 return {...seed,checkedOn,status:errors.length||missing.length?'partial_candidate':'candidate_complete',countries,coverage,missing,errors,note:'Candidate statistics only. Review definition, source year, original PDF correspondence and publication rights before use.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const seed=JSON.parse(await readFile(seedPath,'utf8'));
 const output=await refresh({seed});
 await mkdir(new URL('../docs/aia-refresh/',import.meta.url),{recursive:true});
 await writeFile(new URL('../docs/aia-refresh/latest-candidate.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify({countries:Object.keys(output.countries).length,coverage:output.coverage,missing:output.missing.length,errors:output.errors},null,2));
 if(output.errors.length)process.exitCode=1;
}
