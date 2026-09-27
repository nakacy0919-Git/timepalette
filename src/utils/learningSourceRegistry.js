const sourceModules =
  import.meta.glob(
    '../data/sources/*.json',
    {
      eager: true,
    }
  );


const isObject = (
  value
) =>
  Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );


const escapeHtml = (
  value = ''
) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');


const getYoutubeId = (
  url = ''
) => {
  const value =
    String(url).trim();

  if (!value) {
    return '';
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&?#/]+)/i,
    /(?:youtube\.com\/embed\/)([^&?#/]+)/i,
    /(?:youtu\.be\/)([^&?#/]+)/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      value.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return '';
};


const makeExcerpt = (
  source
) => {
  if (source?.excerpt) {
    return source.excerpt;
  }

  if (
    Array.isArray(
      source?.supports
    ) &&
    source.supports.length > 0
  ) {
    return source.supports
      .map(
        (item) =>
          `• ${item}`
      )
      .join('\n');
  }

  return (
    source?.note ??
    source?.use ??
    ''
  );
};


const makeSourceCardUrl = (
  source
) => {
  const title =
    escapeHtml(
      source?.titleJa ??
      source?.title ??
      'Official Source'
    );

  const organization =
    escapeHtml(
      source?.organization ??
      'Official Source'
    );

  const externalUrl =
    String(
      source?.url ??
      ''
    );

  const supports =
    Array.isArray(
      source?.supports
    )
      ? source.supports
      : [];

  const note =
    source?.note ??
    source?.use ??
    '';

  const evidenceHtml =
    supports.length > 0
      ? `<ul>${supports
          .map(
            (item) =>
              `<li>${escapeHtml(item)}</li>`
          )
          .join('')}</ul>`
      : note
        ? `<p>${escapeHtml(note)}</p>`
        : '<p>Open the official source to examine the original material.</p>';

  const linkHtml =
    externalUrl
      ? `<a href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer">Open official source ↗</a>`
      : '';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#f8fafc;color:#0f172a;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  main{max-width:920px;margin:0 auto;padding:28px}
  .card{background:white;border:1px solid #e2e8f0;border-radius:24px;padding:26px;box-shadow:0 8px 30px rgba(15,23,42,.06)}
  .eyebrow{font-size:11px;font-weight:900;letter-spacing:.14em;color:#64748b;text-transform:uppercase}
  h1{font-size:clamp(22px,4vw,34px);line-height:1.2;margin:10px 0 8px}
  .org{font-weight:800;color:#475569;margin:0 0 22px}
  .evidence{border-radius:18px;background:#f1f5f9;padding:18px 20px;font-size:16px;line-height:1.7}
  ul{margin:0;padding-left:22px} li+li{margin-top:10px}
  a{display:inline-flex;margin-top:20px;padding:12px 18px;border-radius:999px;background:#0f172a;color:white;text-decoration:none;font-weight:900}
  .note{margin-top:18px;font-size:12px;line-height:1.6;color:#64748b}
</style>
</head>
<body>
<main>
  <section class="card">
    <div class="eyebrow">TimePalette · Source Preview</div>
    <h1>${title}</h1>
    <p class="org">${organization}</p>
    <div class="evidence">${evidenceHtml}</div>
    ${linkHtml}
    <p class="note">This preview is generated from the Source Catalog. Use the official-source link for the original page.</p>
  </section>
</main>
</body>
</html>`;

  return (
    `data:text/html;charset=utf-8,${encodeURIComponent(
      html
    )}`
  );
};


const normalizeSource = (
  sourceId,
  rawSource,
  inherited = {}
) => {
  const source =
    isObject(rawSource)
      ? {
          ...inherited,
          ...rawSource,
        }
      : {
          ...inherited,
        };

  const declaredType =
    source.assetType ??
    source.type ??
    '';

  if (
    declaredType === 'youtube'
  ) {
    return {
      ...source,
      id:
        sourceId,
      assetType:
        'youtube',
      youtubeId:
        source.youtubeId ||
        getYoutubeId(
          source.url
        ),
      sourceUrl:
        source.url ??
        '',
    };
  }

  if (
    declaredType === 'pdf'
  ) {
    return {
      ...source,
      id:
        sourceId,
      assetType:
        'pdf',
      sourceUrl:
        source.url ??
        '',
    };
  }

  if (
    declaredType === 'image'
  ) {
    return {
      ...source,
      id:
        sourceId,
      assetType:
        'image',
      sourceUrl:
        source.url ??
        '',
    };
  }

  if (
    declaredType === 'excerpt'
  ) {
    return {
      ...source,
      id:
        sourceId,
      assetType:
        'excerpt',
      excerpt:
        makeExcerpt(
          source
        ),
      sourceUrl:
        source.url ??
        '',
    };
  }

  /*
   * Web pages and reference entries often block third-party iframes.
   * Render a local Source Preview card in the existing PDF/iframe viewer,
   * with an explicit link to the original official source.
   */
  return {
    ...source,
    id:
      sourceId,
    assetType:
      'pdf',
    sourceUrl:
      source.url ??
      '',
    originalType:
      declaredType ||
      'webpage',
    excerpt:
      makeExcerpt(
        source
      ),
    url:
      makeSourceCardUrl(
        source
      ),
  };
};


const looksLikeSource = (
  value
) =>
  isObject(value) &&
  Boolean(
    value.title &&
    (
      value.url ||
      value.type ||
      value.assetType ||
      value.youtubeId ||
      value.excerpt ||
      Array.isArray(value.resources)
    )
  );


const collectSourceEntries = (
  data
) => {
  if (!isObject(data)) {
    return [];
  }

  const entries = [];

  const addSource = (
    sourceId,
    source
  ) => {
    if (
      !sourceId ||
      !isObject(source)
    ) {
      return;
    }

    entries.push([
      sourceId,
      source,
      {},
    ]);

    /*
     * Media collections may expose individually addressable resources.
     * This lets missions choose a Japanese or English video explicitly.
     */
    if (
      Array.isArray(
        source.resources
      )
    ) {
      source.resources.forEach(
        (resource) => {
          if (
            !resource?.id
          ) {
            return;
          }

          entries.push([
            resource.id,
            resource,
            {
              organization:
                resource.organization ??
                source.organization,
              sourceTier:
                source.sourceTier,
              verifiedAt:
                source.verifiedAt,
              parentSourceId:
                sourceId,
              parentTitle:
                source.title,
            },
          ]);
        }
      );
    }
  };

  Object.entries(
    data
  ).forEach(
    ([
      key,
      value,
    ]) => {
      if (
        isObject(value?.sources)
      ) {
        Object.entries(
          value.sources
        ).forEach(
          ([
            sourceId,
            source,
          ]) =>
            addSource(
              sourceId,
              source
            )
        );

        return;
      }

      if (
        looksLikeSource(
          value
        )
      ) {
        addSource(
          key,
          value
        );
      }
    }
  );

  if (
    isObject(
      data.sources
    )
  ) {
    Object.entries(
      data.sources
    ).forEach(
      ([
        sourceId,
        source,
      ]) =>
        addSource(
          sourceId,
          source
        )
    );
  }

  return entries;
};


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

      collectSourceEntries(
        data
      ).forEach(
        ([
          sourceId,
          source,
          inherited,
        ]) => {
          index[
            sourceId
          ] =
            normalizeSource(
              sourceId,
              source,
              inherited
            );
        }
      );

      return index;
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
