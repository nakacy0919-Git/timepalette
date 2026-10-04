import { useEffect, useState } from 'react';

const cache = new Map();

async function resolveCommonsImage(file, width) {
  const key = `${file}:${width}`;
  if (cache.has(key)) return cache.get(key);

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(width),
    titles: file,
  });

  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Commons request failed: ${response.status}`);
  }

  const data = await response.json();
  const page = Object.values(data?.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];

  if (!info?.thumburl && !info?.url) {
    throw new Error(`Commons image not found: ${file}`);
  }

  const metadata = info.extmetadata ?? {};
  const result = {
    src: info.thumburl ?? info.url,
    original: info.url,
    descriptionUrl: info.descriptionurl,
    license: metadata.LicenseShortName?.value ?? '',
  };

  cache.set(key, result);
  return result;
}

export default function CommonsImage({
  file,
  width = 1200,
  alt = '',
  className = '',
  showCredit = false,
}) {
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    resolveCommonsImage(file, width)
      .then((resolved) => {
        if (!active) return;
        setImage(resolved);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [file, width]);

  if (status === 'loading') {
    return (
      <div className={`flex min-h-[220px] items-center justify-center bg-slate-100 ${className}`}>
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
          <p className="mt-3 text-xs font-black text-slate-400">IMAGE LOADING...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`flex min-h-[220px] items-center justify-center bg-slate-100 ${className}`}>
        <div className="max-w-sm px-6 text-center">
          <div className="text-4xl">🖼️</div>
          <p className="mt-3 font-black text-slate-600">画像を読み込めませんでした</p>
          <p className="mt-1 break-all text-xs font-bold text-slate-400">{file}</p>
        </div>
      </div>
    );
  }

  return (
    <figure className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={image.src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      {showCredit && (
        <figcaption className="absolute bottom-2 right-2 max-w-[85%] rounded-full bg-slate-950/75 px-3 py-1 text-[9px] font-bold text-white/90 backdrop-blur">
          Wikimedia Commons{image.license ? ` · ${image.license}` : ''}
        </figcaption>
      )}
    </figure>
  );
}
