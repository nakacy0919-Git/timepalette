import { getJicaWorldDiaryUrls } from '../src/utils/jicaWorldDiary.js';

const SAFE_PROMPT = 'JICA世界日記を読んで、自分の感想を書こう';

// Public read APIs should never expose the old question, choices, explanation
// or photo metadata for published items sourced from JICA World Diary.
export function sanitizeWorldDiaryCatalog(questions) {
  return (Array.isArray(questions) ? questions : []).map((q) => {
    const diaryUrls = getJicaWorldDiaryUrls({
      sourceUrls: q?.sources,
      explanation: q?.explanation || q?.notes,
    });
    if (!diaryUrls.length) return q;
    return {
      id: q.id,
      countryIso: q.countryIso,
      domain: q.domain,
      type: 'diaryReflection',
      prompt: SAFE_PROMPT,
      answer: '',
      choices: [],
      explanation: '',
      sources: diaryUrls,
      media: [],
      video: null,
      learning: {
        levels: Array.isArray(q.learning?.levels)
          ? q.learning.levels : ['elementary', 'juniorHigh', 'highSchoolStandard'],
      },
      creator: q.creator || null,
    };
  });
}
