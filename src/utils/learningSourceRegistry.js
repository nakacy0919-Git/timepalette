const sourceModules =
  import.meta.glob(
    '../data/sources/*.json',
    {
      eager: true,
    }
  );


const SOURCE_INDEX =
  Object.values(
    sourceModules
  ).reduce(
    (
      index,
      module
    ) => {
      const data =
        module?.default ??
        module ??
        {};

      return {
        ...index,
        ...data,
      };
    },
    {}
  );


export function getLearningSource(
  sourceId
) {
  if (!sourceId) {
    return null;
  }

  return (
    SOURCE_INDEX[
      sourceId
    ] ??
    null
  );
}


export function getLearningSources(
  sourceIds = []
) {
  if (
    !Array.isArray(
      sourceIds
    )
  ) {
    return [];
  }

  return sourceIds
    .map(
      (sourceId) =>
        getLearningSource(
          sourceId
        )
    )
    .filter(Boolean);
}