import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Layers3,
  Map as MapIcon,
  Minus,
  PlayCircle,
  Plus,
  RotateCcw,
  Volume2,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

import worldAtlas
  from 'world-atlas/countries-110m.json';

import {
  getLearningSource,
  getLearningSources,
} from '../../utils/learningSourceRegistry';


/* =========================================================
   MISSION STANDARD v6
   UNIVERSAL MATERIAL RESOLUTION
========================================================= */

const DEFAULT_PLACEMENT =
  'beforeChallenge';


const normalizePlacement = (
  material
) =>
  material
    ?.display
    ?.placement ??
  DEFAULT_PLACEMENT;


export function getMissionMaterials(
  mission
) {
  const learningLevelId =
    mission
      ?.learningLevelId;

  const levelMaterials =
    learningLevelId
      ? mission
          ?.materialsByLevel
          ?.[learningLevelId]
      : null;

  if (
    Array.isArray(
      levelMaterials
    ) &&
    levelMaterials.length > 0
  ) {
    return levelMaterials;
  }

  return Array.isArray(
    mission?.materials
  )
    ? mission.materials
    : [];
}


const getMaterialsForPlacement = (
  mission,
  placement
) => {
  const materials =
    getMissionMaterials(
      mission
    );

  return materials.filter(
    (material) => {
      const materialPlacement =
        normalizePlacement(
          material
        );

      if (
        placement ===
          'beforeChallenge' &&
        materialPlacement ===
          'insideChallenge'
      ) {
        return true;
      }

      return (
        materialPlacement ===
        placement
      );
    }
  );
};


/* =========================================================
   SOURCE HELPERS
========================================================= */

const isDataUrl = (
  value = ''
) =>
  String(value)
    .startsWith(
      'data:'
    );


const getOriginalSourceUrl = (
  source
) => {
  if (!source) {
    return '';
  }

  if (
    source.sourceUrl
  ) {
    return source.sourceUrl;
  }

  if (
    source.url &&
    !isDataUrl(
      source.url
    )
  ) {
    return source.url;
  }

  return '';
};


const getViewerUrl = (
  source
) =>
  source?.url ??
  source?.sourceUrl ??
  '';


const getYouTubeId = (
  source
) => {
  if (
    source?.youtubeId
  ) {
    return source.youtubeId;
  }

  const url =
    getOriginalSourceUrl(
      source
    );

  const match =
    String(url).match(
      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([^&?#/]+)/i
    );

  return (
    match?.[1] ??
    ''
  );
};


const getMaterialLabel = (
  type
) => {
  switch (type) {
    case 'image':
      return 'IMAGE';

    case 'video':
    case 'youtube':
      return 'VIDEO';

    case 'map':
      return 'MAP';

    case 'pdf':
      return 'PDF';

    case 'webpage':
      return 'WEB SOURCE';

    case 'document':
      return 'DOCUMENT';

    case 'audio':
      return 'AUDIO';

    case 'chart':
      return 'CHART';

    case 'gallery':
      return 'GALLERY';

    case 'text':
      return 'READING';

    case 'interactive':
      return 'INTERACTIVE';

    default:
      return 'MATERIAL';
  }
};


const MaterialTypeIcon = ({
  type,
}) => {
  const props = {
    size: 18,
    strokeWidth: 2.4,
  };

  switch (type) {
    case 'image':
      return (
        <ImageIcon
          {...props}
        />
      );

    case 'video':
    case 'youtube':
      return (
        <PlayCircle
          {...props}
        />
      );

    case 'map':
      return (
        <MapIcon
          {...props}
        />
      );

    case 'pdf':
    case 'document':
      return (
        <FileText
          {...props}
        />
      );

    case 'audio':
      return (
        <Volume2
          {...props}
        />
      );

    case 'chart':
      return (
        <BarChart3
          {...props}
        />
      );

    case 'gallery':
      return (
        <Layers3
          {...props}
        />
      );

    default:
      return (
        <BookOpen
          {...props}
        />
      );
  }
};


/* =========================================================
   SOURCE CARD
========================================================= */

function SourceLinkCard({
  source,
  material,
  label,
}) {
  const externalUrl =
    getOriginalSourceUrl(
      source
    );

  const previewUrl =
    getViewerUrl(
      source
    );

  const title =
    source?.titleJa ??
    source?.title ??
    material?.title ??
    'Learning Material';

  const organization =
    source?.organization ??
    '';

  const excerpt =
    source?.excerpt ??
    source?.note ??
    source?.use ??
    '';

  return (
    <div
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200
        bg-gradient-to-br
        from-slate-50
        to-white
      "
    >
      {(
        previewUrl &&
        isDataUrl(
          previewUrl
        )
      ) && (
        <iframe
          title={title}
          src={previewUrl}
          className="
            h-[280px]
            w-full
            border-0
            md:h-[340px]
          "
        />
      )}

      <div
        className="
          p-5
          md:p-6
        "
      >
        <p
          className="
            text-[10px]
            font-black
            tracking-[0.16em]
            text-slate-400
          "
        >
          {label ?? 'OFFICIAL SOURCE'}
        </p>

        <p
          className="
            mt-2
            text-lg
            font-black
            leading-7
            text-slate-800
          "
        >
          {title}
        </p>

        {organization && (
          <p
            className="
              mt-1
              text-sm
              font-bold
              text-slate-500
            "
          >
            {organization}
          </p>
        )}

        {(
          excerpt &&
          !isDataUrl(
            previewUrl
          )
        ) && (
          <p
            className="
              mt-3
              whitespace-pre-line
              text-sm
              font-bold
              leading-6
              text-slate-600
            "
          >
            {excerpt}
          </p>
        )}

        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              mt-4
              inline-flex
              items-center
              gap-2
              rounded-full
              bg-slate-950
              px-4
              py-2.5
              text-xs
              font-black
              text-white
              transition
              hover:bg-blue-700
            "
          >
            公式教材を開く

            <ExternalLink
              size={14}
            />
          </a>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   IMAGE
========================================================= */

function ImageMaterial({
  source,
  material,
}) {
  const imageUrl =
    (
      source?.assetType ===
        'image' &&
      source?.url &&
      !isDataUrl(
        source.url
      )
    )
      ? source.url
      : getOriginalSourceUrl(
          source
        );

  if (!imageUrl) {
    return (
      <SourceLinkCard
        source={source}
        material={material}
        label="IMAGE SOURCE"
      />
    );
  }

  return (
    <figure
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200
        bg-white
      "
    >
      <img
        src={imageUrl}
        alt={
          source?.alt ??
          material?.alt ??
          source?.title ??
          'Mission material'
        }
        className={`
          w-full

          ${
            (
              material
                ?.display
                ?.fit ??
              'cover'
            ) === 'contain'
              ? 'object-contain'
              : 'object-cover'
          }
        `}
        style={{
          aspectRatio:
            (
              material
                ?.display
                ?.aspectRatio ??
              '16/9'
            ).replace(
              ':',
              '/'
            ),
        }}
        loading="lazy"
      />

      {(
        source?.credit ||
        source?.license
      ) && (
        <figcaption
          className="
            border-t
            border-slate-100
            px-4
            py-3
            text-xs
            font-bold
            text-slate-400
          "
        >
          {source.credit}

          {(
            source.credit &&
            source.license
          ) && ' / '}

          {source.license}
        </figcaption>
      )}
    </figure>
  );
}


/* =========================================================
   VIDEO
========================================================= */

function VideoMaterial({
  source,
  material,
}) {
  const youtubeId =
    getYouTubeId(
      source
    );

  if (youtubeId) {
    return (
      <div
        className="
          aspect-video
          overflow-hidden
          rounded-[22px]
          border
          border-slate-200
          bg-black
          shadow-sm
        "
      >
        <iframe
          title={
            source?.title ??
            material?.title ??
            'Mission video'
          }
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&playsinline=1`}
          className="
            h-full
            w-full
          "
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  const videoUrl =
    getOriginalSourceUrl(
      source
    );

  if (videoUrl) {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        className="
          aspect-video
          w-full
          rounded-[22px]
          border
          border-slate-200
          bg-black
        "
      >
        <source
          src={videoUrl}
        />
      </video>
    );
  }

  return (
    <SourceLinkCard
      source={source}
      material={material}
      label="VIDEO SOURCE"
    />
  );
}


/* =========================================================
   PDF
========================================================= */

function PdfMaterial({
  source,
  material,
}) {
  const pdfUrl =
    getOriginalSourceUrl(
      source
    );

  if (!pdfUrl) {
    return (
      <SourceLinkCard
        source={source}
        material={material}
        label="PDF SOURCE"
      />
    );
  }

  const pageHint =
    Number(
      material
        ?.display
        ?.pageHint ??
      0
    );

  const hash =
    pageHint > 0
      ? `#page=${pageHint}&view=FitH`
      : '#view=FitH';

  return (
    <div
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200
        bg-white
      "
    >
      <iframe
        title={
          source?.title ??
          material?.title ??
          'Mission PDF'
        }
        src={`${pdfUrl}${hash}`}
        className="
          h-[58vh]
          min-h-[460px]
          w-full
          border-0
        "
      />

      <div
        className="
          border-t
          border-slate-100
          p-3
          text-right
        "
      >
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex
            items-center
            gap-1.5
            text-xs
            font-black
            text-blue-600
            hover:text-blue-800
          "
        >
          PDFを別画面で開く

          <ExternalLink
            size={13}
          />
        </a>
      </div>
    </div>
  );
}


/* =========================================================
   AUDIO
========================================================= */

function AudioMaterial({
  source,
  material,
}) {
  const audioUrl =
    getOriginalSourceUrl(
      source
    );

  if (!audioUrl) {
    return (
      <SourceLinkCard
        source={source}
        material={material}
        label="AUDIO SOURCE"
      />
    );
  }

  return (
    <div
      className="
        rounded-[22px]
        border
        border-violet-100
        bg-violet-50
        p-5
      "
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            bg-violet-600
            text-white
          "
        >
          <Volume2
            size={21}
          />
        </div>

        <div>
          <p
            className="
              font-black
              text-slate-800
            "
          >
            {
              source?.title ??
              material?.title ??
              'Audio'
            }
          </p>

          <p
            className="
              text-xs
              font-bold
              text-slate-500
            "
          >
            音声を聞いて確認しよう
          </p>
        </div>
      </div>

      <audio
        controls
        preload="metadata"
        src={audioUrl}
        className="
          mt-4
          w-full
        "
      />
    </div>
  );
}


/* =========================================================
   GALLERY
========================================================= */

function GalleryMaterial({
  source,
  material,
}) {
  const directSources =
    getLearningSources(
      Array.isArray(
        material?.sourceIds
      )
        ? material.sourceIds
        : []
    );

  const resourceImages =
    Array.isArray(
      source?.resources
    )
      ? source.resources
          .filter(
            (resource) =>
              (
                resource
                  ?.assetType ??
                resource
                  ?.type
              ) === 'image' &&
              resource?.url
          )
          .map(
            (
              resource,
              index
            ) => ({
              id:
                resource.id ??
                `resource-image-${index}`,

              url:
                resource.url,

              alt:
                resource.alt ??
                resource.title ??
                `Image ${index + 1}`,

              title:
                resource.title ??
                '',

              credit:
                resource.credit ??
                source?.organization ??
                '',
            })
          )
      : [];

  const directImages =
    directSources
      .filter(
        (item) =>
          item?.assetType ===
            'image' &&
          (
            item.url ||
            item.sourceUrl
          )
      )
      .map(
        (item) => ({
          id:
            item.id,

          url:
            getOriginalSourceUrl(
              item
            ) ||
            item.url,

          alt:
            item.alt ??
            item.title ??
            'Gallery image',

          title:
            item.title ??
            '',

          credit:
            item.credit ??
            item.organization ??
            '',
        })
      );

  const images = [
    ...directImages,
    ...resourceImages,
  ];

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  if (
    images.length === 0
  ) {
    return (
      <SourceLinkCard
        source={source}
        material={material}
        label="PHOTO GALLERY"
      />
    );
  }

  const safeIndex =
    Math.min(
      activeIndex,
      images.length - 1
    );

  const active =
    images[safeIndex];

  return (
    <div>
      <figure
        className="
          overflow-hidden
          rounded-[22px]
          border
          border-slate-200
          bg-white
        "
      >
        <img
          src={active.url}
          alt={active.alt}
          className="
            aspect-video
            w-full
            object-cover
          "
          loading="lazy"
        />

        {(
          active.title ||
          active.credit
        ) && (
          <figcaption
            className="
              border-t
              border-slate-100
              px-4
              py-3
            "
          >
            {active.title && (
              <p
                className="
                  text-sm
                  font-black
                  text-slate-700
                "
              >
                {active.title}
              </p>
            )}

            {active.credit && (
              <p
                className="
                  mt-1
                  text-xs
                  font-bold
                  text-slate-400
                "
              >
                {active.credit}
              </p>
            )}
          </figcaption>
        )}
      </figure>

      {images.length > 1 && (
        <div
          className="
            mt-3
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <button
            type="button"
            onClick={() =>
              setActiveIndex(
                (
                  safeIndex -
                  1 +
                  images.length
                ) %
                images.length
              )
            }
            className="
              rounded-full
              border
              border-slate-200
              bg-white
              p-2
              text-slate-600
              hover:bg-slate-50
            "
            aria-label="Previous image"
          >
            <ChevronLeft
              size={18}
            />
          </button>

          <div
            className="
              flex
              flex-1
              justify-center
              gap-2
            "
          >
            {images.map(
              (
                image,
                index
              ) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      index
                    )
                  }
                  className={`
                    h-2.5
                    rounded-full
                    transition-all

                    ${
                      index ===
                      safeIndex
                        ? 'w-8 bg-blue-600'
                        : 'w-2.5 bg-slate-200'
                    }
                  `}
                  aria-label={`Image ${index + 1}`}
                />
              )
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveIndex(
                (
                  safeIndex +
                  1
                ) %
                  images.length
              )
            }
            className="
              rounded-full
              border
              border-slate-200
              bg-white
              p-2
              text-slate-600
              hover:bg-slate-50
            "
            aria-label="Next image"
          >
            <ChevronRight
              size={18}
            />
          </button>
        </div>
      )}
    </div>
  );
}


/* =========================================================
   MAP
========================================================= */

const normalizeCountryName = (
  value = ''
) =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]+/g,
      ' '
    )
    .trim();


const ATLAS_NAME_ALIASES = {
  'united states': [
    'united states of america',
  ],

  czechia: [
    'czech republic',
  ],

  russia: [
    'russian federation',
  ],

  'south korea': [
    'republic of korea',
    'korea south',
  ],

  'north korea': [
    'democratic people s republic of korea',
    'korea north',
  ],

  'democratic republic of the congo': [
    'dem rep congo',
    'democratic republic of congo',
    'congo kinshasa',
  ],

  'republic of the congo': [
    'congo',
    'congo brazzaville',
  ],

  'ivory coast': [
    'cote d ivoire',
  ],

  eswatini: [
    'swaziland',
  ],

  tanzania: [
    'united republic of tanzania',
  ],

  vietnam: [
    'viet nam',
  ],

  laos: [
    'lao pdr',
    'lao people s democratic republic',
  ],

  iran: [
    'islamic republic of iran',
  ],

  syria: [
    'syrian arab republic',
  ],

  moldova: [
    'republic of moldova',
  ],

  venezuela: [
    'bolivarian republic of venezuela',
  ],

  bolivia: [
    'plurinational state of bolivia',
  ],

  brunei: [
    'brunei darussalam',
  ],
};


const getCountryNameFromIso = (
  countryIso,
  language = 'en'
) => {
  const region =
    String(
      countryIso ??
      ''
    ).toUpperCase();

  if (
    !/^[A-Z]{2}$/.test(
      region
    )
  ) {
    return '';
  }

  try {
    return new Intl.DisplayNames(
      [language],
      {
        type: 'region',
      }
    ).of(
      region
    ) ?? '';
  } catch {
    return '';
  }
};


const isTargetGeography = (
  geographyName,
  targetName
) => {
  const normalizedGeo =
    normalizeCountryName(
      geographyName
    );

  const normalizedTarget =
    normalizeCountryName(
      targetName
    );

  if (
    normalizedGeo ===
    normalizedTarget
  ) {
    return true;
  }

  const aliases =
    ATLAS_NAME_ALIASES[
      normalizedTarget
    ] ?? [];

  return aliases.some(
    (alias) =>
      normalizedGeo ===
      normalizeCountryName(
        alias
      )
  );
};


function MapMaterial({
  material,
  mission,
}) {
  const config =
    material?.config ??
    {};

  const uiLanguage =
    config.uiLanguage ===
      'ja'
      ? 'ja'
      : 'en';

  const targetName =
    mission
      ?.challenge
      ?.targetAtlasName ??
    mission
      ?.challenge
      ?.targetName ??
    getCountryNameFromIso(
      config.countryIso,
      'en'
    );

  const cities =
    Array.isArray(
      mission
        ?.challenge
        ?.cities
    )
      ? mission.challenge.cities
      : [];

  const initialCenter =
    Array.isArray(
      mission
        ?.challenge
        ?.mapConfig
        ?.center
    )
      ? mission
          .challenge
          .mapConfig
          .center
      : [
          0,
          5,
        ];

  const initialZoom =
    config.mode ===
      'country-location'
      ? 1
      : config.mode ===
          'cities'
        ? 4
        : 1.6;

  const [
    zoom,
    setZoom,
  ] = useState(
    initialZoom
  );

  return (
    <div
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200
        bg-sky-50
      "
    >
      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-2
          border-b
          border-sky-100
          bg-white
          px-4
          py-3
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <MapIcon
            size={17}
            className="
              text-blue-600
            "
          />

          <p
            className="
              text-sm
              font-black
              text-slate-700
            "
          >
            {
              uiLanguage ===
                'ja'
                ? 'インタラクティブ地図'
                : 'Interactive Map'
            }
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-1
          "
        >
          <button
            type="button"
            onClick={() =>
              setZoom(
                (value) =>
                  Math.max(
                    1,
                    value - 0.5
                  )
              )
            }
            className="
              rounded-lg
              border
              border-slate-200
              bg-white
              p-2
              text-slate-600
            "
            aria-label="Zoom out"
          >
            <Minus
              size={15}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom(
                initialZoom
              )
            }
            className="
              rounded-lg
              border
              border-slate-200
              bg-white
              p-2
              text-slate-600
            "
            aria-label="Reset map"
          >
            <RotateCcw
              size={15}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom(
                (value) =>
                  Math.min(
                    8,
                    value + 0.5
                  )
              )
            }
            className="
              rounded-lg
              border
              border-slate-200
              bg-white
              p-2
              text-slate-600
            "
            aria-label="Zoom in"
          >
            <Plus
              size={15}
            />
          </button>
        </div>
      </div>

      <div
        className="
          aspect-video
          w-full
        "
      >
        <ComposableMap
          projectionConfig={{
            scale: 145,
          }}
          className="
            h-full
            w-full
          "
        >
          <ZoomableGroup
            center={initialCenter}
            zoom={zoom}
            minZoom={1}
            maxZoom={8}
          >
            <Geographies
              geography={
                worldAtlas
              }
            >
              {({
                geographies,
              }) =>
                geographies.map(
                  (
                    geography
                  ) => {
                    const name =
                      geography
                        ?.properties
                        ?.name ??
                      '';

                    const target =
                      isTargetGeography(
                        name,
                        targetName
                      );

                    return (
                      <Geography
                        key={
                          geography.rsmKey
                        }
                        geography={
                          geography
                        }
                        fill={
                          target
                            ? '#2563eb'
                            : '#e2e8f0'
                        }
                        stroke="#ffffff"
                        strokeWidth={
                          target
                            ? 0.9
                            : 0.45
                        }
                        style={{
                          default: {
                            outline:
                              'none',
                          },

                          hover: {
                            fill:
                              target
                                ? '#1d4ed8'
                                : '#cbd5e1',

                            outline:
                              'none',
                          },

                          pressed: {
                            outline:
                              'none',
                          },
                        }}
                      />
                    );
                  }
                )
              }
            </Geographies>

            {(
              config.mode ===
                'cities'
            ) &&
              cities.map(
                (
                  city
                ) => {
                  if (
                    !Array.isArray(
                      city
                        ?.coordinates
                    ) ||
                    city
                      .coordinates
                      .length !== 2
                  ) {
                    return null;
                  }

                  return (
                    <Marker
                      key={
                        city.name
                      }
                      coordinates={
                        city.coordinates
                      }
                    >
                      <circle
                        r={2.8}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth={1}
                      />

                      <text
                        textAnchor="middle"
                        y={-7}
                        style={{
                          fontSize: 7,
                          fontWeight: 800,
                          fill:
                            '#0f172a',
                          paintOrder:
                            'stroke',
                          stroke:
                            '#ffffff',
                          strokeWidth: 2,
                        }}
                      >
                        {
                          uiLanguage ===
                            'ja'
                            ? (
                                city.labelJa ??
                                city.name
                              )
                            : city.name
                        }
                      </text>
                    </Marker>
                  );
                }
              )}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div
        className="
          border-t
          border-sky-100
          bg-white
          px-4
          py-3
        "
      >
        <p
          className="
            text-xs
            font-bold
            leading-5
            text-slate-500
          "
        >
          {
            uiLanguage ===
              'ja'
              ? 'ドラッグして移動、＋／−で拡大縮小できます。青色が学習対象の国です。'
              : 'Drag to move and use + / − to zoom. The target country is highlighted in blue.'
          }
        </p>
      </div>
    </div>
  );
}


/* =========================================================
   CHART / TEXT / INTERACTIVE
========================================================= */

function ChartMaterial({
  source,
  material,
}) {
  const data =
    Array.isArray(
      material?.data
    )
      ? material.data
      : Array.isArray(
          source?.data
        )
        ? source.data
        : [];

  if (
    data.length === 0
  ) {
    return (
      <SourceLinkCard
        source={source}
        material={material}
        label="CHART SOURCE"
      />
    );
  }

  const maxValue =
    Math.max(
      1,

      ...data.map(
        (item) =>
          Number(
            item?.value ??
            0
          )
      )
    );

  return (
    <div
      className="
        space-y-3
        rounded-[22px]
        border
        border-slate-200
        bg-white
        p-5
      "
    >
      {data.map(
        (
          item,
          index
        ) => {
          const value =
            Number(
              item?.value ??
              0
            );

          const width =
            `${Math.max(
              2,
              (
                value /
                maxValue
              ) *
                100
            )}%`;

          return (
            <div
              key={
                item?.id ??
                `${item?.label}-${index}`
              }
            >
              <div
                className="
                  mb-1
                  flex
                  justify-between
                  gap-3
                  text-xs
                  font-black
                  text-slate-600
                "
              >
                <span>
                  {item?.label}
                </span>

                <span>
                  {value}
                  {item?.unit ?? ''}
                </span>
              </div>

              <div
                className="
                  h-3
                  overflow-hidden
                  rounded-full
                  bg-slate-100
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-blue-600
                  "
                  style={{
                    width,
                  }}
                />
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}


function TextMaterial({
  source,
  material,
}) {
  const text =
    material?.text ??
    source?.excerpt ??
    source?.note ??
    '';

  if (!text) {
    return (
      <SourceLinkCard
        source={source}
        material={material}
        label="READING"
      />
    );
  }

  return (
    <div
      className="
        rounded-[22px]
        border
        border-slate-200
        bg-white
        p-5
        md:p-6
      "
    >
      <p
        className="
          whitespace-pre-line
          text-base
          font-bold
          leading-8
          text-slate-700
        "
      >
        {text}
      </p>
    </div>
  );
}


function InteractiveMaterial({
  source,
  material,
}) {
  const externalUrl =
    getOriginalSourceUrl(
      source
    );

  return (
    <div
      className="
        rounded-[22px]
        border
        border-dashed
        border-blue-200
        bg-blue-50
        p-5
        text-center
      "
    >
      <div
        className="
          mx-auto
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-2xl
          bg-blue-600
          text-white
        "
      >
        <Layers3
          size={23}
        />
      </div>

      <p
        className="
          mt-3
          font-black
          text-blue-900
        "
      >
        {
          material?.title ??
          source?.title ??
          'Interactive Material'
        }
      </p>

      {material?.instruction && (
        <p
          className="
            mt-2
            text-sm
            font-bold
            leading-6
            text-blue-700
          "
        >
          {material.instruction}
        </p>
      )}

      {externalUrl && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            mt-4
            inline-flex
            items-center
            gap-2
            rounded-full
            bg-blue-700
            px-4
            py-2.5
            text-xs
            font-black
            text-white
          "
        >
          開く

          <ExternalLink
            size={14}
          />
        </a>
      )}
    </div>
  );
}


/* =========================================================
   MATERIAL BODY ROUTER
========================================================= */

function MaterialBody({
  material,
  mission,
}) {
  const source =
    material?.sourceId
      ? getLearningSource(
          material.sourceId
        )
      : null;

  const type =
    material?.type ??
    source?.originalType ??
    source?.assetType ??
    'webpage';

  if (
    material?.sourceId &&
    !source
  ) {
    return (
      <div
        className="
          rounded-[22px]
          border
          border-orange-200
          bg-orange-50
          p-5
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <AlertTriangle
            size={22}
            className="
              mt-0.5
              shrink-0
              text-orange-500
            "
          />

          <div>
            <p
              className="
                font-black
                text-orange-800
              "
            >
              教材を読み込めませんでした
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-orange-700
              "
            >
              sourceId:
              {' '}
              {material.sourceId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  switch (type) {
    case 'image':
      return (
        <ImageMaterial
          source={source}
          material={material}
        />
      );

    case 'video':
    case 'youtube':
      return (
        <VideoMaterial
          source={source}
          material={material}
        />
      );

    case 'map':
      return (
        <MapMaterial
          material={material}
          mission={mission}
        />
      );

    case 'pdf':
      return (
        <PdfMaterial
          source={source}
          material={material}
        />
      );

    case 'document':
      if (
        (
          source
            ?.originalType ??
          source
            ?.assetType
        ) === 'pdf'
      ) {
        return (
          <PdfMaterial
            source={source}
            material={material}
          />
        );
      }

      return (
        <SourceLinkCard
          source={source}
          material={material}
          label="DOCUMENT"
        />
      );

    case 'webpage':
      return (
        <SourceLinkCard
          source={source}
          material={material}
          label="WEB SOURCE"
        />
      );

    case 'audio':
      return (
        <AudioMaterial
          source={source}
          material={material}
        />
      );

    case 'chart':
      return (
        <ChartMaterial
          source={source}
          material={material}
        />
      );

    case 'gallery':
      return (
        <GalleryMaterial
          source={source}
          material={material}
        />
      );

    case 'text':
    case 'excerpt':
      return (
        <TextMaterial
          source={source}
          material={material}
        />
      );

    case 'interactive':
      return (
        <InteractiveMaterial
          source={source}
          material={material}
        />
      );

    default:
      return (
        <SourceLinkCard
          source={source}
          material={material}
        />
      );
  }
}


/* =========================================================
   MATERIAL CARD
========================================================= */

function MaterialCard({
  material,
  mission,
}) {
  const type =
    material?.type ??
    'material';

  const required =
    material?.required ===
    true;

  return (
    <section
      className="
        overflow-hidden
        rounded-[26px]
        border
        border-slate-200
        bg-white
        shadow-[0_8px_24px_rgba(15,23,42,0.05)]
      "
    >
      <div
        className="
          flex
          flex-wrap
          items-start
          justify-between
          gap-3
          border-b
          border-slate-100
          bg-slate-50/80
          px-4
          py-3
          md:px-5
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-blue-600
              text-white
            "
          >
            <MaterialTypeIcon
              type={type}
            />
          </div>

          <div>
            <p
              className="
                text-[9px]
                font-black
                tracking-[0.16em]
                text-slate-400
              "
            >
              {
                getMaterialLabel(
                  type
                )
              }
            </p>

            <p
              className="
                mt-0.5
                text-xs
                font-black
                text-slate-600
              "
            >
              {
                material?.role ??
                'learning material'
              }
            </p>
          </div>
        </div>

        {required && (
          <span
            className="
              rounded-full
              bg-blue-100
              px-3
              py-1
              text-[10px]
              font-black
              text-blue-700
            "
          >
            必須教材
          </span>
        )}
      </div>

      {material?.instruction && (
        <div
          className="
            border-b
            border-slate-100
            px-4
            py-4
            md:px-5
          "
        >
          <p
            className="
              text-sm
              font-black
              leading-6
              text-slate-700
              md:text-base
            "
          >
            {material.instruction}
          </p>
        </div>
      )}

      <div
        className="
          p-4
          md:p-5
        "
      >
        <MaterialBody
          material={material}
          mission={mission}
        />
      </div>
    </section>
  );
}


/* =========================================================
   PUBLIC COMPONENT
========================================================= */

export default function MissionMaterialRenderer({
  mission,
  placement =
    DEFAULT_PLACEMENT,
  className = '',
}) {
  const materials =
    useMemo(
      () =>
        getMaterialsForPlacement(
          mission,
          placement
        ),
      [
        mission,
        placement,
      ]
    );

  if (
    materials.length === 0
  ) {
    return null;
  }

  return (
    <div
      className={`
        space-y-4
        ${className}
      `}
    >
      {materials.map(
        (
          material,
          index
        ) => (
          <MaterialCard
            key={
              material?.id ??
              `${
                mission?.id ??
                'mission'
              }-material-${index}`
            }
            material={material}
            mission={mission}
          />
        )
      )}
    </div>
  );
}