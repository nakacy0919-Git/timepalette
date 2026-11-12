export function reflectionReady(answer, confirmed, evidenceReady = true) {
  const length = typeof answer === 'string' ? Array.from(answer.trim()).length : 0;
  return evidenceReady && confirmed === true && length >= 10 && length <= 3000;
}
