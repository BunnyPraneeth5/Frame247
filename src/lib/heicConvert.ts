export function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

/**
 * Converts an iPhone HEIC/HEIF file to a browser-readable JPEG, client-side.
 *
 * heic2any bundles a large decoder (~1.2MB), so it's imported on demand — only
 * users who actually pick a HEIC pay for it, and initial load stays lean.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const jpegBlob = Array.isArray(result) ? result[0] : result;
  return new File([jpegBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
}
