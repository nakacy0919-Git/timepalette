import rows from '../data/world-games/originalQuizImageQuestions.json' with {type:'json'};
import audit from '../data/world-games/originalQuizPhotoAudit.json' with {type:'json'};
import {withOriginalQuizPhoto} from './worldOriginalQuizPhotos.js';
import {validQuestion} from './worldGameEngine.js';
import {hasEnglishQuestion} from './worldGameLanguage.js';
import {hasCompleteReadings} from './schoolQuestionBank.js';
// Reuse only a pinned, previously visually reviewed asset; no country or filename inference.
export function buildOriginalImageQuestions(countries){
 const codes=new Set(countries.map(c=>c.iso));
 return rows.flatMap(r=>{
  if(!codes.has(r.country))return [];
  const source=audit.entries[r.parentId];
  if(!source||source.country!==r.country||source.sourceUrl!==r.sourceUrl||source.photo?.visualReview!=='actual-image-viewed')return [];
  const parent=withOriginalQuizPhoto({id:r.parentId,country:r.country,prompt:source.prompt,translations:{en:{prompt:source.enPrompt}}});
  if(!parent.image||parent.image.sourceUrl!==r.sourceUrl)return [];
  const q={...r,origin:'TimePalette original image quiz',subcategory:'photo_observation',photoQuestion:true,reviewStatus:'draft',gradeReview:'provisional',originalDraft:true,practiceDraft:true,gameEligible:false,requiresReading:false,sources:[r.sourceUrl],image:{...parent.image,stage:'question',observationJa:r.observationJa,observationEn:r.observationEn}};
  return validQuestion(q)&&hasEnglishQuestion(q)&&(q.gradeBand!=='elementary'||hasCompleteReadings(q))?[q]:[];
 });
}
