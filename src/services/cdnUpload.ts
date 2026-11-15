import { compressImageToWebP, MAX_SOURCE_IMAGE_BYTES } from '../utils/imageCompression';
import { getInMemoryAccessToken } from './oververseAuth';

export interface CdnUploadParams {
  file: File;
  kind: 'cover' | 'chapter-page';
  mangaId: string;
  chapterId?: string;
  pageNumber?: number;
  onProgress?: (stage: 'compressing' | 'signing' | 'uploading' | 'done') => void;
}

export interface CdnUploadResult {
  cdnUrl: string;
  objectKey: string;
  bucket: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

const CDN_CACHE_CONTROL = 'public, max-age=31536000';

/**
 * Compresses image to WebP (max width 1200px, <= 500KB) in browser,
 * requests a short-lived S3 presigned PUT URL for Cloudflare R2,
 * and uploads directly (or via signed S3 R2 relay if R2 CORS blocks browser preflight).
 * Never sends image files or base64 payloads to Neon DB.
 */
export async function uploadCompressedImageToCdn(
  params: CdnUploadParams
): Promise<CdnUploadResult> {
  const { file, kind, mangaId, chapterId, pageNumber, onProgress } = params;

  if (!file) {
    throw new Error('No image file selected.');
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('Image too big, compress and try again.');
  }

  onProgress?.('compressing');
  const compressed = await compressImageToWebP(file);

  onProgress?.('signing');
  const accessToken = getInMemoryAccessToken();
  const signRes = await fetch('/api/cdn/sign-upload', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      kind,
      mangaId,
      chapterId,
      pageNumber,
      fileSize: compressed.compressedSize,
      contentType: compressed.contentType,
    }),
  });

  const signData = await signRes.json().catch(() => ({}));
  if (!signRes.ok || !signData?.signedUrl || !signData?.cdnUrl) {
    throw new Error(signData?.error || 'Could not sign CDN upload URL.');
  }

  onProgress?.('uploading');
  let uploaded = false;

  try {
    const putRes = await fetch(signData.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': signData.cacheControl || CDN_CACHE_CONTROL,
      },
      body: compressed.blob,
    });
    if (putRes.ok) {
      uploaded = true;
    } else if (!signData.r2RelayUrl) {
      const errPayload = await putRes.json().catch(() => ({}));
      throw new Error(errPayload?.error || 'Failed to upload WebP image to CDN.');
    }
  } catch (err: any) {
    if (!signData.r2RelayUrl) {
      throw err instanceof Error ? err : new Error('Failed to upload WebP image to CDN.');
    }
  }

  // Fallback to signed S3 R2 server relay if browser R2 CORS blocks direct PUT
  if (!uploaded && signData.r2RelayUrl) {
    const relayRes = await fetch(signData.r2RelayUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/webp',
      },
      body: compressed.blob,
    });
    if (!relayRes.ok) {
      const errPayload = await relayRes.json().catch(() => ({}));
      throw new Error(errPayload?.error || 'Failed to upload WebP image to R2 CDN.');
    }
  }

  onProgress?.('done');

  return {
    cdnUrl: signData.cdnUrl,
    objectKey: signData.objectKey,
    bucket: signData.bucket || 'overse-manga-pages',
    originalSize: compressed.originalSize,
    compressedSize: compressed.compressedSize,
    width: compressed.width,
    height: compressed.height,
  };
}
