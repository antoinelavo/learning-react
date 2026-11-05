// Browser-only. Shrinks a photo before upload so the request stays under
// Vercel's 4.5MB function body limit (larger bodies get a 413 before the
// upload route runs). Profile photos are shown at most 128px wide.
const MAX_SIDE = 1024;
const QUALITY = 0.85;

export async function resizeImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // JPEG has no alpha; paint transparent PNG/GIF areas white, not black.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', QUALITY)
  );
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
