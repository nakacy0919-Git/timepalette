const STORAGE_KEY = 'timepalette_world_learning_v1';

const createEmptyProgress = () => ({
  version: 1,
  countries: {},
});

const canUseStorage = () =>
  typeof window !== 'undefined' &&
  typeof window.localStorage !== 'undefined';

export const getWorldProgress = () => {
  if (!canUseStorage()) {
    return createEmptyProgress();
  }

  try {
    const raw = window.localStorage.getItem(
      STORAGE_KEY
    );

    if (!raw) {
      return createEmptyProgress();
    }

    const parsed = JSON.parse(raw);

    return {
      version: parsed?.version || 1,
      countries: parsed?.countries || {},
    };
  } catch (error) {
    console.warn(
      'World Learning progress could not be loaded:',
      error
    );

    return createEmptyProgress();
  }
};

const saveWorldProgress = (progress) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    );
  } catch (error) {
    console.warn(
      'World Learning progress could not be saved:',
      error
    );
  }
};

export const getCountryProgress = (
  countryCode
) => {
  const progress =
    getWorldProgress();

  return (
    progress.countries?.[
      countryCode
    ] || {
      completedMissionIds: [],
      firstMissionAt: null,
      updatedAt: null,
    }
  );
};

export const completeWorldMission = (
  countryCode,
  missionId
) => {
  const progress =
    getWorldProgress();

  const currentCountry =
    progress.countries?.[
      countryCode
    ] || {
      completedMissionIds: [],
      firstMissionAt: null,
      updatedAt: null,
    };

  const alreadyCompleted =
    currentCountry.completedMissionIds.includes(
      missionId
    );

  if (alreadyCompleted) {
    return {
      isNewCompletion: false,
      countryProgress:
        currentCountry,
    };
  }

  const now =
    new Date().toISOString();

  const nextCountryProgress = {
    ...currentCountry,

    completedMissionIds: [
      ...currentCountry.completedMissionIds,
      missionId,
    ],

    firstMissionAt:
      currentCountry.firstMissionAt ||
      now,

    updatedAt: now,
  };

  const nextProgress = {
    ...progress,

    countries: {
      ...progress.countries,

      [countryCode]:
        nextCountryProgress,
    },
  };

  saveWorldProgress(
    nextProgress
  );

  return {
    isNewCompletion: true,
    countryProgress:
      nextCountryProgress,
  };
};

export const resetCountryWorldProgress = (
  countryCode
) => {
  const progress =
    getWorldProgress();

  const nextCountries = {
    ...progress.countries,
  };

  delete nextCountries[
    countryCode
  ];

  saveWorldProgress({
    ...progress,
    countries: nextCountries,
  });
};