// Transparent string matching for optional practice only: not a pronunciation score.
export function normalizeVoiceText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function compareCreatorVoice(transcript, voice) {
  const heard = normalizeVoiceText(transcript);
  const target = String(voice?.target || '').trim();
  const alternatives = Array.isArray(voice?.alternatives) ? voice.alternatives : [];
  const acceptable = [target, ...alternatives]
    .map(normalizeVoiceText)
    .filter(Boolean);
  return {
    heard,
    matched: Boolean(heard) && acceptable.includes(heard),
    // It is a transcript match, NOT an acoustic or pronunciation rating.
    expectedCount: acceptable.length,
  };
}

export function validVoiceLocale(value) {
  return /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/i.test(String(value || '').trim());
}
