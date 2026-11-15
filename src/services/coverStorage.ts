import { uploadCompressedImageToCdn } from './cdnUpload';

/**
 * Compresses cover to WebP (<= 500KB) and uploads directly to CDN bucket `overse-manga-pages`.
 * Returns CDN URL only — never uploads raw images to Neon or Supabase.
 */
export async function uploadCoverFile(
  file: File,
  mangaId = `manga-${Date.now()}`
): Promise<string> {
  const result = await uploadCompressedImageToCdn({
    file,
    kind: 'cover',
    mangaId,
  });
  return result.cdnUrl;
}

/**
 * Resolves a manga cover URL with safe fallback to /placeholder.png
 */
export function resolveMangaCoverUrl(coverUrl?: string | null): string {
  if (
    !coverUrl ||
    typeof coverUrl !== 'string' ||
    coverUrl.trim() === '' ||
    coverUrl === 'null' ||
    coverUrl === 'undefined'
  ) {
    return '/placeholder.png';
  }
  return coverUrl.trim();
}
