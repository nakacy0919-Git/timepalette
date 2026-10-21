// Only teacher-published missions are scoped by this metadata.
export const LEARNING_LEVEL_IDS = Object.freeze(['elementary','juniorHigh','highSchoolStandard','highSchoolAdvanced']);
export const DEFAULT_CREATOR_LEVELS = Object.freeze(['elementary','juniorHigh','highSchoolStandard']);

export function forCreatorLearningLevel(mission, level) {
  if (!mission || !mission.creatorQuestionId) return mission;
  const meta = mission.learning && typeof mission.learning==='object' ? mission.learning : {};
  const levels = Array.isArray(meta.levels) ? meta.levels : DEFAULT_CREATOR_LEVELS;
  if (!levels.includes(level)) return null;
  if (level !== 'highSchoolAdvanced') return mission;
  const en = meta.challenge && typeof meta.challenge==='object' ? meta.challenge : {};
  const prompt = String(en.promptEn || '').trim();
  if (!prompt) return null;
  const localized = {...mission,
    title:prompt.split(/[\n.!?]/)[0].slice(0,50), prompt,
    explanation:String(en.explanationEn || '').trim()};
  if (mission.type === 'single-choice' &&
      Array.isArray(mission.challenge?.choices) &&
      mission.challenge.choices.every(choice => typeof choice === 'string')) {
    const englishChoices = [en.answerEn, ...(Array.isArray(en.choicesEn) ? en.choicesEn : [])]
      .map(value => String(value || '').trim());
    if (englishChoices.length !== 4 || englishChoices.some(value => !value) ||
        new Set(englishChoices).size !== 4) return null;
    localized.challenge = {...mission.challenge, choices:englishChoices, correctIndex:0};
  }
  return localized;
}
