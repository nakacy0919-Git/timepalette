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
