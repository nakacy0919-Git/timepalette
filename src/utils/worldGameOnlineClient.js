// Transport for the optional online battle pilot. The API URL may be public,
// but the creation key and room credentials must only be supplied at runtime.
export function createBattleClient(endpoint,fetcher=globalThis.fetch){
 const url=new URL(endpoint);
 if(url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))throw Error('Invalid battle API URL');
 const base=url.href.replace(/\/$/,'');
 const path=(code,op)=>{
  if(!/^[0-9A-F]{8}$/.test(code))throw Error('Invalid room code');
  return '/rooms/'+code+'/'+op;
 };
 async function request(route,{token,createKey,body,signal}={}){
  const headers={};
  if(token){if(!/^[0-9a-f]{48}$/.test(token))throw Error('Invalid room credential');headers.Authorization='Bearer '+token;}
  if(createKey)headers['X-Battle-Create-Key']=createKey;
  if(body!==undefined)headers['Content-Type']='application/json';
  const res=await fetcher(base+route,{method:'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal,cache:'no-store',credentials:'omit',redirect:'error'});
  const data=await res.json();
  if(!res.ok){const error=new Error(data.error||'battle_request_failed');error.status=res.status;throw error;}
  return data;
 }
 return {
  create:(config,key,signal)=>request('/rooms',{createKey:key,body:config,signal}),
  join:(code,token,signal)=>request(path(code,'join'),{token,signal}),
  view:(code,token,signal)=>request(path(code,'view'),{token,signal}),
  action:(code,token,action,signal)=>request(path(code,'action'),{token,body:action,signal}),
  close:(code,token,signal)=>request(path(code,'close'),{token,signal})
 };
}
// Client views are monotonic; ignore delayed polls from older revisions.
export function acceptBattleView(current,next){
 if(!next||!Number.isInteger(next.revision))return current;
 return current&&current.revision>next.revision?current:next;
}
