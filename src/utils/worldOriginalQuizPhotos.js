import geographyPhotos from '../data/geography/photos197.json' with {type:'json'};
import topicPhotos from '../data/world-games/originalQuizTopicPhotos.json' with {type:'json'};

// Existing local assets were previously checked in photo-review197.json.
// A location photo is not evidence of a food, custom, or answer.
const primarySlots={"ae":0,"ao":1,"au":0,"ba":0,"bd":0,"bh":0,"bn":0,"bo":1,"bw":0,"bz":0,"cd":0,"cf":0,"dj":0,"dm":0,"dz":0,"ga":0,"gq":0,"gw":0,"hr":0,"jo":0,"la":0,"lc":0,"lr":1,"lu":1,"ly":0,"me":0,"mw":1,"na":0,"no":0,"pe":0,"ph":0,"pk":0,"qa":0,"sc":0,"sd":0,"ss":0,"td":0,"tg":0,"tm":0,"tn":1,"tz":0,"va":1,"ve":0,"ye":0};
const editorialSlots={"tp-editorial-v1-pa-oceans":["pa",0],"tp-editorial-v1-pe-inca":["pe",0],"tp-editorial-v2-au-reef-heat":["au",0]};
const norm=s=>{try{return decodeURIComponent(String(s||'')).replace(/_/g,' ').toLowerCase();}catch{return String(s||'');}};
const validAsset=p=>!!p&&/^\/geography\/photos(?:197)?\/[a-z]{2}(?:-\d+)?\.(?:jpg|jpeg|png|webp)$/.test(p.deliveryUrl||'')&&/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/i.test(p.sourceUrl||'')&&!!p.credit&&!!p.captionJa&&!!p.captionEn&&!!p.sha256&&(/^(?:CC0(?: 1\.0)?|Public domain|CC BY(?:-SA)? \d\.\d(?: [a-z]+)?)$/i.test(p.license||''))&&(/^https?:\/\/creativecommons\.org\//i.test(p.licenseUrl||'')||/^Public domain$/i.test(p.license||''));
function localPhoto(p,kind='context'){
 if(!validAsset(p))return null;
 return {url:p.deliveryUrl,localAsset:true,sourceUrl:p.sourceUrl,title:p.fileTitle||p.captionEn,author:p.credit,license:p.license,licenseUrl:p.licenseUrl||p.sourceUrl,altJa:p.captionJa,altEn:p.captionEn,stage:'review',kind,changes:'Previously optimized local copy; display uncropped',verifiedOn:p.metadataCheckedAt||'2026-10-30',reviewBasis:'Existing reviewed geography photo catalog; not independently reverified for this quiz.'};
}
export function withOriginalQuizPhoto(q){
 if(!q||!/^tp-(?:original-|editorial-)/.test(q.id||''))return q;
 const assets=geographyPhotos[q.country]||[];
 const context=localPhoto(assets.find(validAsset),'context');
 const explicit=topicPhotos[q.id];
 const slot=Number.isInteger(q.photoSlot)?[q.country,q.photoSlot]:q.id==='tp-original-hand-v1-'+q.country+'-primary'?[q.country,primarySlots[q.country]]:editorialSlots[q.id];
 const localSubject=slot&&Number.isInteger(slot[1])?localPhoto(geographyPhotos[slot[0]]?.[slot[1]],'subject'):null;
 // Only promote an atlas photo if it is the exact same Commons file AND matching caption.
 const candidate=q.imageCandidate;
 const matched=candidate&&assets.find(p=>norm(p.sourceUrl)===norm(candidate.sourceUrl)&&norm(p.captionEn)===norm(candidate.altEn));
 const topic=q.image?{...q.image,kind:q.image.kind||'subject'}:explicit||localSubject||(matched?localPhoto(matched,'subject'):null);
 const image=topic||context;
 if(!image)return q;
 const fallbackImage=context&&context.url!==image.url?context:null;
 // Only unrelated context may appear before an answer; geography and reasoning images
 // default to post-answer review to avoid revealing the solution.
 const previewImage=topic?.stage==='question'?topic:(!topic&&q.domain==='lifeCulture'?{...image,stage:'question'}:null);
 return {...q,image,previewImage,fallbackImage};
}
export function quizPhotoForPhase(q,review){
 return review?q?.image:(q?.previewImage||(q?.image?.stage==='question'?q.image:null));
}
export function originalPhotoCoverage(questions){
 const out={total:0,withImage:0,subject:0,context:0,missing:0};
 for(const q of questions){out.total++;if(!q.image){out.missing++;continue;}out.withImage++;out[q.image.kind==='context'?'context':'subject']++;}
 return out;
}
