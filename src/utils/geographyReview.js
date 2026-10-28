// Evidence applies only to the reviewed field, not to the entire mission.
export function auditCapitalReview(country, review) {
  if (!review) return {status:'pending', issues:[]};
  const city=country.cities.find(c=>c.id===country.capitalId);
  const issues=[];
  if (!city || city.name!==review.nameEn || city.labelJa!==review.nameJa)
    issues.push('capital identity changed since source review');
  if (!/^https:\/\/www\.mofa\.go\.jp\/mofaj\/area\/[a-z-]+\/data\.html$/.test(review.sourceUrl||''))
    issues.push('capital review source missing or invalid');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.checkedAt||''))
    issues.push('capital review date missing');
  return {status:issues.length?'stale':'verified', issues};
}

export function auditGeographicCorrections(country, corrections){
  const issues=[];
  for(const [id,review] of Object.entries(corrections?.cities||{})){
    const city=country.cities.find(c=>c.id===id);
    if(!city||city.source!==review.source||JSON.stringify(city.coordinates)!==JSON.stringify(review.coordinates))
      issues.push('reviewed city point changed: '+id);
  }
  for(const [key,value] of Object.entries(corrections?.route||{}))
    if(country.route[key]!==value)issues.push('reviewed route correction changed: '+key);
  return {reviewedCityPoints:Object.keys(corrections?.cities||{}).length,issues};
}

export function auditContentReview(country, review){
  if(!review)return {status:'pending',issues:[]};
  const issues=[];
  if(country.factJa!==review.factJa)issues.push('reviewed terrain fact changed');
  if(JSON.stringify(country.route)!==JSON.stringify(review.route))issues.push('reviewed schematic route changed');
  for(const key of ['factSources','routeSources'])
    if(!review[key]?.length||review[key].some(url=>!/^https:\/\//.test(url)))issues.push('missing content sources: '+key);
  if(review.pedagogy?.status!=='reviewed')issues.push('pedagogy review pending');
  return {status:issues.length?'stale':'verified',issues};
}
