// Keep Unicode letters for future Arabic, Cyrillic, and Asian-script support.
// For CJK, score segmentation needs a separate future update.
export function normalizeSpeechText(value=''){
 return String(value??'')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/\p{M}/gu,'')
  .replace(/ß/g,'ss')
  .replace(/œ/g,'oe')
  .replace(/æ/g,'ae')
  .replace(/ł/g,'l')
  .replace(/[’‘]/g,"'")
  .replace(/[^\p{L}\p{N}'\s]/gu,' ')
  .replace(/\s+/g,' ')
  .trim();
}
