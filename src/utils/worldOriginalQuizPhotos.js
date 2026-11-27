import geographyPhotos from '../data/geography/photos197.json' with {type:'json'};
import photoAudit from '../data/world-games/originalQuizPhotoAudit.json' with {type:'json'};

// No country-based substitutions. A reviewed mapping is bound to the exact
// bilingual question text and source file, not an ISO code or mutable array slot.
const validLicense=p=>!!p&&(/^(?:CC0(?: 1\.0)?|Public domain|CC BY(?:-SA)? \d\.\d(?: [a-z]+)?)$/i.test(p.license||''))&&(/^https?:\/\/creativecommons\.org\//i.test(p.licenseUrl||'')||/^Public domain$/i.test(p.license||''));
const validAsset=p=>!!p&&/^\/geography\/photos(?:197)?\/[a-z]{2}(?:-\d+)?\.(?:jpg|jpeg|png|webp)$/.test(p.deliveryUrl||'')&&/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/i.test(p.sourceUrl||'')&&!!p.credit&&!!p.captionJa&&!!p.captionEn&&!!p.sha256&&validLicense(p);
// Prefer a directly inspected Wikimedia file when its filename matches the source.
function checkedDelivery(p){
 try{
  const u=new URL(p.verifiedImageUrl);
  const source=new URL(p.sourceUrl);
  const name=decodeURIComponent(source.pathname.split('/wiki/File:')[1]||'').replaceAll(' ','_');
  const parts=u.pathname.split('/').map(decodeURIComponent);
  if(u.protocol==='https:'&&['upload.wikimedia.org','thumb.wikimedia.org'].includes(u.hostname)&&parts.includes(name)&&p.visualReview==='actual-image-viewed')return u.href;
 }catch{}
 return p.url;
}
function localPhoto(p,kind){
 if(!validAsset(p))return null;
 return {url:p.deliveryUrl,localAsset:true,sourceUrl:p.sourceUrl,title:p.fileTitle||p.captionEn,author:p.credit,license:p.license,licenseUrl:p.licenseUrl||p.sourceUrl,altJa:p.captionJa,altEn:p.captionEn,stage:'review',kind,changes:'Previously optimized local copy; display uncropped',verifiedOn:p.metadataCheckedAt||'2026-10-30'};
}
export function withOriginalQuizPhoto(q){
 if(!q||!/^tp-(?:original-|editorial-)/.test(q.id||''))return q;
 const {image:old,previewImage:oldPreview,fallbackImage:oldFallback,...base}=q;
 const audit=photoAudit.entries[q.id];
 if(!audit||q.country!==audit.country||q.prompt!==audit.prompt||q.translations?.en?.prompt!==audit.enPrompt)return base;
 let image=null;
 if(audit.sourceType==='local'){
  const p=(geographyPhotos[q.country]||[]).find(p=>p.sourceUrl===audit.sourceUrl&&p.sha256===audit.sha256&&p.deliveryUrl===audit.deliveryUrl);
  image=localPhoto(p,audit.kind);
 }else if(audit.sourceType==='external'){
  const p=audit.photo;
  if(p?.sourceUrl===audit.sourceUrl&&p.author&&p.altJa&&p.altEn&&p.url?.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/')&&validLicense(p))image={...p,url:checkedDelivery(p),licenseUrl:p.licenseUrl||p.sourceUrl,kind:audit.kind,stage:'review'};
 }
 if(!image)return base;
 return {...base,image:{...image,stage:'review',auditStatus:'topic-metadata-reviewed',auditDate:photoAudit.reviewedOn,auditReason:audit.reason}};
}
export function quizPhotoForPhase(q,review){
 if(/^tp-(?:original-|editorial-)/.test(q?.id||''))return review&&q.image?.auditStatus==='topic-metadata-reviewed'?q.image:null;
 return review?q?.image:(q?.previewImage||(q?.image?.stage==='question'?q.image:null));
}
export function originalPhotoCoverage(questions){
 const out={total:0,withImage:0,subject:0,place:0,context:0,missing:0,diagram:0};
 for(const q of questions){out.total++;if(q.dataVisual)out.diagram++;if(!q.image||q.image.auditStatus!=='topic-metadata-reviewed'){out.missing++;continue;}out.withImage++;out[q.image.kind==='subject'?'subject':'place']++;}
 return out;
}
