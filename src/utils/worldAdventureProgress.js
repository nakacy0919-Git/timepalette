const STORAGE_KEY = 'timepalette_world_adventure_v1';

const createEmptyProgress = () => ({
  version: 1,
  countries: {},
});

const canUseStorage = () =>
  typeof window !== 'undefined' &&
  typeof window.localStorage !== 'undefined';

export const getWorldAdventureProgress = () => {
  if (!canUseStorage()) return createEmptyProgress();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();

    const parsed = JSON.parse(raw);
    return {
      version: parsed?.version || 1,
      countries: parsed?.countries || {},
    };
  } catch (error) {
    console.warn('World Adventure progress could not be loaded:', error);
    return createEmptyProgress();
  }
};

const saveProgress = (progress) => {
  if (!canUseStorage()) return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch (error) {
    console.warn('World Adventure progress could not be saved:', error);
    return false;
  }
};

export const getWorldAdventureDomainProgress = (countryCode, domainId) => {
  const normalizedCountry = String(countryCode || '').trim().toLowerCase();
  const normalizedDomain = String(domainId || '').trim();
  const progress = getWorldAdventureProgress();
  const domain = progress.countries?.[normalizedCountry]?.domains?.[normalizedDomain];
  const missions = domain?.missions || {};

  return {
    countryCode: normalizedCountry,
    domainId: normalizedDomain,
    missions,
    completedMissionIds: Object.entries(missions)
      .filter(([, record]) => record?.completed === true)
      .map(([missionId]) => missionId),
    firstClearPoints: Object.values(missions).reduce(
      (total, record) => total + Number(record?.points || 0),
      0,
    ),
    updatedAt: domain?.updatedAt ?? null,
  };
};

export const completeWorldAdventureMission = ({
  countryCode,
  domainId,
  missionId,
  points = 0,
}) => {
  const normalizedCountry = String(countryCode || '').trim().toLowerCase();
  const normalizedDomain = String(domainId || '').trim();
  const normalizedMission = String(missionId || '').trim();

  if (!normalizedCountry || !normalizedDomain || !normalizedMission) {
    return {
      isNewCompletion: false,
      progress: getWorldAdventureDomainProgress(countryCode, domainId),
    };
  }

  const current = getWorldAdventureProgress();
  const currentCountry = current.countries?.[normalizedCountry] || {};
  const currentDomains = currentCountry.domains || {};
  const currentDomain = currentDomains[normalizedDomain] || {};
  const currentMissions = currentDomain.missions || {};

  if (currentMissions[normalizedMission]?.completed) {
    return {
      isNewCompletion: false,
      progress: getWorldAdventureDomainProgress(normalizedCountry, normalizedDomain),
    };
  }

  const now = new Date().toISOString();
  const next = {
    ...current,
    countries: {
      ...current.countries,
      [normalizedCountry]: {
        ...currentCountry,
        domains: {
          ...currentDomains,
          [normalizedDomain]: {
            ...currentDomain,
            updatedAt: now,
            missions: {
              ...currentMissions,
              [normalizedMission]: {
                completed: true,
                firstClearAt: now,
                points: Number(points) || 0,
              },
            },
          },
        },
      },
    },
  };

  saveProgress(next);

  return {
    isNewCompletion: true,
    progress: getWorldAdventureDomainProgress(normalizedCountry, normalizedDomain),
  };
};
