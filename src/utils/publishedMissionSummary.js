// Summary only: public questions must still be fetched afresh before play.
const prefix='timepalette-published-summary-v1:';
export function savePublishedSummary(country,missions){
  try{localStorage.setItem(prefix+country,JSON.stringify(missions.map(m=>({id:m.id,domain:m.domain,points:10}))));}catch{/* Browsing remains available without storage. */}
}
export function getPublishedSummary(country){
  try{
    const rows=JSON.parse(localStorage.getItem(prefix+country)||'[]');
    return Array.isArray(rows)?rows.filter(m=>typeof m.id==='string'&&m.id.startsWith(country+'-mc-')&&['language','lifeCulture','japanConnection','thinkConnect'].includes(m.domain)).map(m=>({id:m.id,domain:m.domain,points:10})):[];
  }catch{return [];}
}
