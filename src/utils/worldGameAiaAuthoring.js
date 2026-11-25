import {hasEnglishQuestion} from './worldGameLanguage.js';

export const AIA_DOMAIN_TARGETS=Object.freeze({place:5,time:2,language:4,lifeCulture:15,japanConnection:7,thinkConnect:7});
export const AIA_SUBCATEGORIES=Object.freeze({
 place:['location','capital','flag','nature','wildlife','heritage','population'],
 time:['timeZone','dateLine','season','dailySchedule','transport','schoolSchedule'],
 language:['officialLanguage','script','greeting','dailyExpression','proverb','loanword'],
 lifeCulture:['food','clothing','housing','school','festivalReligion','artsSports'],
 japanConnection:['diplomacy','friendshipCity','trade','cooperation','migration','culturalExchange'],
 thinkConnect:['environment','peace','rights','economy','multicultural','welfare']
});
export function isAiaQuestion(q){
 return typeof q?.id==='string'&&q.id.startsWith('aia-')||typeof q?.origin==='string'&&q.origin.includes('AIA');
}
export function isOfficialAiaPdf(url){
 try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='www2.aia.pref.aichi.jp'&&!u.username&&!u.password&&u.pathname.startsWith('/koryu/j/kyouzai/')&&u.pathname.toLowerCase().endsWith('.pdf');}catch{return false;}
}
const text=v=>typeof v==='string'&&v.trim().length>0;
const validDate=v=>typeof v==='string'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
// Structural validation is not a substitute for factual, linguistic or rights review.
export function aiaQuestionIssues(q,{publish=false}={}){
 const issues=[];
 if(!q||typeof q!=='object')return ['record_required'];
 if(!isAiaQuestion(q))issues.push('aia_identity');
 if(!/^[a-z]{2}$/.test(q.country||''))issues.push('country');
 if(!Object.hasOwn(AIA_DOMAIN_TARGETS,q.domain))issues.push('domain');
 if(!text(q.prompt)||!text(q.explanation)||!Array.isArray(q.choices)||q.choices.length!==4||!q.choices.every(text)||new Set(q.choices).size!==4||!Number.isInteger(q.correctIndex)||q.correctIndex<0||q.correctIndex>3)issues.push('japanese_content');
 if(!hasEnglishQuestion(q))issues.push('english_content');
 if(!Array.isArray(q.sources)||!q.sources.length)issues.push('sources');
 if(!validDate(q.verifiedOn))issues.push('verified_date');
 if(q.dataYear!==undefined&&(!Number.isInteger(q.dataYear)||q.dataYear<1800||q.dataYear>Number(String(q.verifiedOn).slice(0,4))))issues.push('data_year');
 if(publish){
  if(!q.sources?.some?.(isOfficialAiaPdf)||!Array.isArray(q.sourcePages)||!q.sourcePages.length||!q.sourcePages.every(n=>Number.isInteger(n)&&n>0))issues.push('pdf_page_reference');
  if(q.translationReviewStatus!=='approved')issues.push('translation_review');
  if(q.reviewStatus!=='approved'||q.rightsConfirmed!==true||q.gameEligible!==true||q.requiresReading!==false)issues.push('publication_review');
  if(!text(q.subcategory)||!text(q.translations?.en?.subcategory))issues.push('bilingual_subcategory');
 }
 return issues;
}
export function buildAiaProductionPlan(scope){
 const countryCodes=[...new Set(scope.map(s=>String(s).toLowerCase()))].filter(s=>/^[a-z]{2}$/.test(s)&&!['fj','sa'].includes(s));
 const perCountry=Object.values(AIA_DOMAIN_TARGETS).reduce((a,b)=>a+b,0);
 return {schemaVersion:1,languages:['ja','en'],status:'planning_only',targetQuestions:countryCodes.length*perCountry,perCountry,countries:countryCodes.map(country=>({country,targets:{...AIA_DOMAIN_TARGETS},approved:0,stage:'pending_source_review'}))};
}
