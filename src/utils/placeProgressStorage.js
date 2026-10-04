const STORAGE_PREFIX = 'timepalette-place-progress-v1';


function normalizeCountryCode(
  countryCode
) {
  return String(
    countryCode || ''
  )
    .trim()
    .toLowerCase();
}


function makeStorageKey(
  countryCode
) {
  return `${STORAGE_PREFIX}:${normalizeCountryCode(countryCode)}`;
}


function emptyProgress(
  countryCode
) {
  return {
    countryCode:
      normalizeCountryCode(
        countryCode
      ),

    completedMissionIds: [],

    updatedAt:
      null,
  };
}


export function getPlaceProgress(
  countryCode
) {
  const fallback =
    emptyProgress(
      countryCode
    );


  if (
    typeof window ===
      'undefined' ||
    !window.localStorage
  ) {
    return fallback;
  }


  try {
    const raw =
      window.localStorage.getItem(
        makeStorageKey(
          countryCode
        )
      );


    if (!raw) {
      return fallback;
    }


    const parsed =
      JSON.parse(
        raw
      );


    const completedMissionIds =
      Array.isArray(
        parsed?.completedMissionIds
      )
        ? [
            ...new Set(
              parsed.completedMissionIds
                .map(
                  (id) =>
                    String(
                      id || ''
                    )
                )
                .filter(
                  Boolean
                )
            ),
          ]
        : [];


    return {
      countryCode:
        normalizeCountryCode(
          countryCode
        ),

      completedMissionIds,

      updatedAt:
        parsed?.updatedAt ??
        null,
    };
  } catch {
    return fallback;
  }
}


export function completePlaceMission(
  countryCode,
  missionId
) {
  const id =
    String(
      missionId || ''
    )
      .trim();


  const current =
    getPlaceProgress(
      countryCode
    );


  if (!id) {
    return {
      isNewCompletion:
        false,

      progress:
        current,
    };
  }


  const alreadyCompleted =
    current.completedMissionIds.includes(
      id
    );


  if (
    alreadyCompleted
  ) {
    return {
      isNewCompletion:
        false,

      progress:
        current,
    };
  }


  const progress = {
    ...current,

    completedMissionIds: [
      ...current.completedMissionIds,
      id,
    ],

    updatedAt:
      new Date().toISOString(),
  };


  if (
    typeof window !==
      'undefined' &&
    window.localStorage
  ) {
    try {
      window.localStorage.setItem(
        makeStorageKey(
          countryCode
        ),
        JSON.stringify(
          progress
        )
      );
    } catch {
      // Storage failure should not stop the current session.
    }
  }


  return {
    isNewCompletion:
      true,

    progress,
  };
}


export function resetPlaceProgress(
  countryCode
) {
  if (
    typeof window !==
      'undefined' &&
    window.localStorage
  ) {
    try {
      window.localStorage.removeItem(
        makeStorageKey(
          countryCode
        )
      );
    } catch {
      // Ignore storage failures.
    }
  }


  return emptyProgress(
    countryCode
  );
}