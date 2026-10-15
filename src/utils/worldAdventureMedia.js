const MEDIA_MODE =
  String(
    import.meta.env
      .VITE_WORLD_ADVENTURE_MEDIA_MODE ??
      'external'
  )
    .trim()
    .toLowerCase();


const MANAGED_BASE_URL =
  String(
    import.meta.env
      .VITE_WORLD_ADVENTURE_MEDIA_BASE_URL ??
      ''
  )
    .trim()
    .replace(
      /\/+$/,
      ''
    );


function cleanLeadingSlash(
  value
) {
  return String(
    value ??
    ''
  ).replace(
    /^\/+/,
    ''
  );
}


function slugify(
  value
) {
  return String(
    value ??
    ''
  )
    .normalize(
      'NFKD'
    )
    .replace(
      /\.[^.]+$/,
      ''
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );
}


export function buildWorldAdventureMediaPath({
  domain,
  countryCode,
  missionId,
  fileName,
  extension = 'webp',
}) {
  const safeDomain =
    slugify(
      domain
    ) ||
    'general';

  const safeCountry =
    slugify(
      countryCode
    ) ||
    'xx';

  const safeMission =
    slugify(
      missionId
    ) ||
    'mission';

  const safeFile =
    slugify(
      fileName
    ) ||
    'media';

  const safeExtension =
    String(
      extension
    )
      .replace(
        /^\./,
        ''
      )
      .toLowerCase();

  return [
    safeDomain,
    safeCountry,
    safeMission,
    `${safeFile}.${safeExtension}`,
  ].join(
    '/'
  );
}


export function getWorldAdventureMediaMode() {
  if (
    MEDIA_MODE ===
      'managed' &&
    MANAGED_BASE_URL
  ) {
    return 'managed';
  }

  return 'external';
}


export function resolveWorldAdventureMedia(
  media
) {
  if (!media) {
    return null;
  }


  if (
    typeof media ===
    'string'
  ) {
    return {
      url:
        media,

      externalUrl:
        media,

      provider:
        'external',
    };
  }


  const storagePath =
    cleanLeadingSlash(
      media.storagePath
    );

  const externalUrl =
    media.externalUrl ??
    media.url ??
    null;

  const canUseManaged =
    MEDIA_MODE ===
      'managed' &&
    Boolean(
      MANAGED_BASE_URL
    ) &&
    Boolean(
      storagePath
    );


  const url =
    canUseManaged
      ? `${MANAGED_BASE_URL}/${storagePath}`
      : externalUrl;


  return {
    ...media,

    url,

    externalUrl,

    storagePath:
      storagePath ||
      null,

    provider:
      canUseManaged
        ? 'managed'
        : 'external',

    source:
      media.source ??
      media.sourceUrl ??
      null,

    sourceUrl:
      media.sourceUrl ??
      media.source ??
      null,
  };
}


export function resolveWorldAdventureMediaList(
  mediaList
) {
  if (
    !Array.isArray(
      mediaList
    )
  ) {
    return [];
  }

  return mediaList
    .map(
      resolveWorldAdventureMedia
    )
    .filter(
      Boolean
    );
}


export function getWorldAdventureMediaCredits(
  mediaList
) {
  return resolveWorldAdventureMediaList(
    mediaList
  )
    .map(
      (
        media
      ) => ({
        credit:
          media.credit ??
          '',

        license:
          media.license ??
          '',

        source:
          media.source ??
          media.sourceUrl ??
          '',

        originalFileName:
          media.originalFileName ??
          media.fileName ??
          '',

        provider:
          media.provider,
      })
    )
    .filter(
      (
        media
      ) =>
        media.credit ||
        media.source
    );
}


export function preloadWorldAdventureMedia(
  mediaList,
  {
    limit = 4,
  } = {}
) {
  if (
    typeof window ===
      'undefined' ||
    typeof Image ===
      'undefined'
  ) {
    return () => {};
  }


  const items =
    resolveWorldAdventureMediaList(
      mediaList
    )
      .filter(
        (
          media
        ) =>
          Boolean(
            media.url
          )
      )
      .slice(
        0,
        Math.max(
          0,
          limit
        )
      );


  const images =
    items.map(
      (
        media
      ) => {
        const image =
          new Image();

        image.decoding =
          'async';

        image.src =
          media.url;

        return image;
      }
    );


  return () => {
    images.forEach(
      (
        image
      ) => {
        image.src =
          '';
      }
    );
  };
}


export const WORLD_ADVENTURE_MEDIA_CONFIG = {
  mode:
    getWorldAdventureMediaMode(),

  managedBaseUrl:
    MANAGED_BASE_URL ||
    null,
};