// Pure client-side helpers. GAS independently validates every write.
export const PUBLIC_DOMAINS = [
  ['place','場所・地理'],
  ['time','時間・時差'],
  ['language','ことば・交流'],
  ['lifeCulture','生活・文化'],
  ['japanConnection','日本とのつながり'],
  ['thinkConnect','比較・思考・交流'],
];

export function reconcilePublishedOrder(savedIds,publishedQuestions){
  const publishedIds=(Array.isArray(publishedQuestions)?publishedQuestions:[])
    .filter(q=>q?.status==='published').map(q=>q.id);
  const allowed=new Set(publishedIds);
  const seen=new Set();
  const order=[];
  for(const id of Array.isArray(savedIds)?savedIds:[]){
    if(allowed.has(id)&&!seen.has(id)){order.push(id);seen.add(id);}
  }
  for(const id of publishedIds){if(!seen.has(id)){order.push(id);seen.add(id);}}
  return order;
}

export function movePublishedOrder(order,id,delta){
  const copy=[...order];
  const at=copy.indexOf(id),to=at+delta;
  if(at<0||![-1,1].includes(delta)||to<0||to>=copy.length)return copy;
  [copy[at],copy[to]]=[copy[to],copy[at]];
  return copy;
}

export function identicalOrder(a,b){
  return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((id,i)=>id===b[i]);
}
