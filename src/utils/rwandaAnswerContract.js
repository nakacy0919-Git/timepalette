// Interaction rules shared by the Rwanda reference and country adventures.
export const RWANDA_ANSWER_CONTRACT = Object.freeze({
  locatorStages: ['continent', 'region', 'country'],
  lifePhotoCount: 2,
  lifeSelectionCount: 2,
  routeRequiresDeparture: true,
  finalFactCount: 5,
  finalSelectionCount: 3,
});
export function toggleBoundedSelection(current, id, limit) {
  if (current.includes(id)) return current.filter(value => value !== id);
  return current.length < limit ? [...current, id] : current;
}
export function selectedAnswersCorrect(selected, choices, count) {
  const correct = new Set(choices.filter(item => item.correct).map(item => item.id));
  return selected.length === count && new Set(selected).size === count && selected.every(id => correct.has(id));
}
export function routeAnswersCorrect(country, port, route) {
  return !!route.countryChoices.find(item => item.id === country)?.correct &&
    !!route.portChoices.find(item => item.id === port)?.correct;
}
export function shuffleChoices(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
