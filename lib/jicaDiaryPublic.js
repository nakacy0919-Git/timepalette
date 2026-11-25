import {getJicaWorldDiaryUrls} from '../src/utils/jicaWorldDiary.js';

// Preserve the text-based multiple-choice question and its answers while
// suppressing copied World Diary photographs in the public catalog.
// This does not imply JICA has approved the quiz for general publication.
export function sanitizeWorldDiaryCatalog(questions) {
  return (Array.isArray(questions) ? questions : []).map(q => {
    const urls=getJicaWorldDiaryUrls(q);
    if(!urls.length) return q;
    return {
      ...q,
      media:[],
      r2MediaBase:undefined,
      sourceUrls:urls,
    };
  });
}
