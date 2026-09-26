const countryModules =
  import.meta.glob(
    '../data/countries_*.json',
    {
      eager: true,
    }
  );

const missionModules =
  import.meta.glob(
    '../data/missions_*.json',
    {
      eager: true,
    }
  );

const REQUIRED_MISSION_COUNT = 40;

const REQUIRED_DOMAINS = [
  'place',
  'time',
  'language',
  'lifeCulture',
  'japanConnection',
  'thinkConnect',
];

const ATLAS_NAME_OVERRIDES = {
  bs: 'Bahamas',
  bo: 'Bolivia',
  bn: 'Brunei',
  cv: 'Cape Verde',
  ci: 'Ivory Coast',
  cg: 'Republic of the Congo',
  cd: 'Democratic Republic of the Congo',
  cz: 'Czechia',
  kr: 'South Korea',
  kp: 'North Korea',
  la: 'Laos',
  md: 'Moldova',
  mk: 'North Macedonia',
  ps: 'Palestine',
  ru: 'Russia',
  sz: 'Eswatini',
  sy: 'Syria',
  tz: 'Tanzania',
  tl: 'East Timor',
  tr: 'Turkey',
  tw: 'Taiwan',
  us: 'United States of America',
  va: 'Vatican',
  vn: 'Vietnam',
};

function unwrapModule(module) {
  return (
    module?.default ??
    module ??
    {}
  );
}

function getFileLetterFromPath(
  path
) {
  const match =
    path.match(
      /countries_([a-z])\.json$/i
    );

  return (
    match?.[1]?.toLowerCase() ??
    ''
  );
}

function makeFlagEmoji(iso) {
  const upper =
    String(iso)
      .toUpperCase();

  if (
    !/^[A-Z]{2}$/.test(
      upper
    )
  ) {
    return '🌍';
  }

  return upper
    .split('')
    .map((letter) =>
      String.fromCodePoint(
        127397 +
          letter.charCodeAt(0)
      )
    )
    .join('');
}

function inferRegion(
  timeZone
) {
  const prefix =
    String(
      timeZone || ''
    ).split('/')[0];

  const labels = {
    Asia: 'Asia',
    Europe: 'Europe',
    Africa: 'Africa',
    America: 'Americas',
    Australia: 'Oceania',
    Pacific: 'Oceania',
    Atlantic: 'Atlantic',
    Indian: 'Indian Ocean',
  };

  return (
    labels[prefix] ??
    'World'
  );
}

function getLanguages(
  country
) {
  if (
    !Array.isArray(
      country?.languages
    )
  ) {
    return [];
  }

  return country.languages;
}

function hasRequiredDomains(
  missionData
) {
  const domains =
    missionData
      ?.design
      ?.domains;

  if (
    !Array.isArray(domains)
  ) {
    return false;
  }

  const domainIds =
    new Set(
      domains.map(
        (domain) =>
          domain.id
      )
    );

  return REQUIRED_DOMAINS.every(
    (domainId) =>
      domainIds.has(
        domainId
      )
  );
}

export function isCompleteMissionPackage(
  missionData
) {
  if (!missionData) {
    return false;
  }

  if (
    missionData.totalMissions !==
    REQUIRED_MISSION_COUNT
  ) {
    return false;
  }

  if (
    !Array.isArray(
      missionData.missions
    ) ||
    missionData.missions.length !==
      REQUIRED_MISSION_COUNT
  ) {
    return false;
  }

  if (
    !hasRequiredDomains(
      missionData
    )
  ) {
    return false;
  }

  const missionIds =
    missionData.missions.map(
      (mission) =>
        mission.id
    );

  if (
    new Set(missionIds).size !==
    missionIds.length
  ) {
    return false;
  }

  const validMissions =
    missionData.missions.every(
      (mission) =>
        Boolean(
          mission?.id &&
          mission?.domain &&
          mission?.type &&
          mission?.title &&
          mission?.prompt &&
          Number.isFinite(
            Number(
              mission?.points
            )
          )
        )
    );

  if (!validMissions) {
    return false;
  }

  const totalPoints =
    missionData.missions.reduce(
      (
        total,
        mission
      ) =>
        total +
        Number(
          mission.points || 0
        ),
      0
    );

  if (
    Number(
      missionData.maxWorldPoints
    ) !== totalPoints
  ) {
    return false;
  }

  return true;
}

export function getWorldLearningCountries() {
  const countries = [];

  Object.entries(
    countryModules
  ).forEach(
    ([
      path,
      module,
    ]) => {
      const fileLetter =
        getFileLetterFromPath(
          path
        );

      if (!fileLetter) {
        return;
      }

      const countryData =
        unwrapModule(module);

      const missionPath =
        `../data/missions_${fileLetter}.json`;

      const missionGroup =
        unwrapModule(
          missionModules[
            missionPath
          ]
        );

      Object.entries(
        countryData
      ).forEach(
        ([
          iso,
          country,
        ]) => {
          const normalizedIso =
            iso.toLowerCase();

          const missionData =
            missionGroup?.[
              normalizedIso
            ] ?? null;

          const live =
            isCompleteMissionPackage(
              missionData
            );

          const languages =
            getLanguages(country);

          countries.push({
            iso:
              normalizedIso,

            fileLetter,

            nameJa:
              country?.nameJa ??
              normalizedIso.toUpperCase(),

            nameEn:
              country?.nameEn ??
              normalizedIso.toUpperCase(),

            capitalJa:
              country?.capitalJa ??
              '',

            capitalEn:
              country?.capitalEn ??
              '',

            subtitleJa:
              country?.subtitle ??
              '',

            subtitleEn:
              country?.subtitleEn ??
              '',

            region:
              country?.region ??
              inferRegion(
                country?.timeZone
              ),

            timeZone:
              country?.timeZone ??
              '',

            flagUrl:
              country?.flagUrl ??
              '',

            flagEmoji:
              makeFlagEmoji(
                normalizedIso
              ),

            languages,

            mainLanguagesJa:
              languages
                .map(
                  (language) =>
                    language?.nameJa
                )
                .filter(Boolean),

            mainLanguagesEn:
              languages
                .map(
                  (language) =>
                    language?.nameEn
                )
                .filter(Boolean),

            weatherSummaryJa:
              country
                ?.weather
                ?.summary ??
              '',

            japanConnection:
              country
                ?.japanConnection ??
              null,

            atlasName:
              ATLAS_NAME_OVERRIDES[
                normalizedIso
              ] ??
              country?.nameEn ??
              '',

            missionData,

            status:
              live
                ? 'live'
                : 'future',

            totalMissions:
              missionData
                ?.missions
                ?.length ??
              0,

            maxWorldPoints:
              Number(
                missionData
                  ?.maxWorldPoints ??
                  0
              ),
          });
        }
      );
    }
  );

  return countries.sort(
    (
      countryA,
      countryB
    ) =>
      countryA.nameEn.localeCompare(
        countryB.nameEn
      )
  );
}

export function getLiveWorldLearningCountries() {
  return getWorldLearningCountries()
    .filter(
      (country) =>
        country.status ===
        'live'
    );
}

export function getWorldLearningCountry(
  iso
) {
  if (!iso) {
    return null;
  }

  return (
    getWorldLearningCountries()
      .find(
        (country) =>
          country.iso ===
          iso.toLowerCase()
      ) ??
    null
  );
}

export {
  REQUIRED_MISSION_COUNT,
  REQUIRED_DOMAINS,
};