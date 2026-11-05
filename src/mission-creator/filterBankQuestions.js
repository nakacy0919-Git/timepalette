export function filterBankQuestions(
  questions,
  { filter = 'all', search = '', selectedCountry = '', selectedDomain = '' } = {}
) {
  const query = String(search).toLowerCase();

  return questions.filter(q =>
    (filter === 'all'
      ? q.status !== 'deleted'
      : q.status === filter) &&
    (!selectedCountry || q.countryIso === selectedCountry) &&
    (!selectedDomain || q.domain === selectedDomain) &&
    [q.prompt, q.countryName, q.authorName, q.domain]
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}
