export const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 1200 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像を読み込めませんでした。JPEG/PNGを選んでください。'));
    };
    img.src = url;
  });
}

export async function optimizeImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('JPEG・PNG・WebPの画像を選んでください。');
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error('元画像は15MB以下にしてください。');
  }
  const img = await loadImage(file);
  let scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  for (let trial = 0; trial < 5; trial += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('このブラウザでは画像変換ができません。');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const quality = Math.max(.61, .84 - trial * .055);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    // Some browsers silently return PNG; never upload a mislabeled image.
    if (!blob || blob.type !== 'image/webp') {
      throw new Error('WebP変換に対応した最新のChrome / Edgeで開いてください。');
    }
    if (blob.size <= MAX_OUTPUT_BYTES) {
      return { blob, previewUrl: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
    }
    scale *= .79;
  }
  throw new Error('画像を十分に圧縮できません。別の画像を選んでください。');
}

export async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let start = 0; start < bytes.length; start += 8192) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
  }
  return btoa(binary);
}
