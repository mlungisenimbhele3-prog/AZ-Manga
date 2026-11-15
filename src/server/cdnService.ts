import crypto from 'crypto';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthenticatedRequest, requireJwtAuth } from './authRoutes.ts';

function stripWrappingBrackets(raw?: string): string {
  return String(raw || '')
    .trim()
    .replace(/^\[(.*)\]$/, '$1')
    .trim();
}

function isValidHttpUrl(raw: string): boolean {
  if (!/^https?:\/\/[^/\s]+/i.test(raw)) return false;
  if (raw.includes('cdn.your-domain.com') || raw.includes('your-bucket-id')) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function readDotEnvOverrides(): Record<string, string> {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      return dotenv.parse(fs.readFileSync(envPath, 'utf8'));
    }
  } catch {
    // ignore
  }
  return {};
}

export function getR2Config() {
  const dotEnv = readDotEnvOverrides();

  const bucket =
    stripWrappingBrackets(process.env.R2_BUCKET || process.env.CDN_BUCKET || dotEnv.R2_BUCKET) ||
    'overse-manga-pages';

  const envPublicUrl = stripWrappingBrackets(process.env.CDN_PUBLIC_URL).replace(/\/$/, '');
  const dotEnvPublicUrl = stripWrappingBrackets(dotEnv.CDN_PUBLIC_URL).replace(/\/$/, '');
  const publicUrl = isValidHttpUrl(envPublicUrl)
    ? envPublicUrl
    : isValidHttpUrl(dotEnvPublicUrl)
    ? dotEnvPublicUrl
    : '';

  const envEndpoint = stripWrappingBrackets(
    process.env.S3_ENDPOINT || process.env.CDN_ENDPOINT
  ).replace(/\/$/, '');
  const dotEnvEndpoint = stripWrappingBrackets(dotEnv.S3_ENDPOINT || dotEnv.CDN_ENDPOINT).replace(
    /\/$/,
    ''
  );
  const endpoint = isValidHttpUrl(envEndpoint)
    ? envEndpoint
    : isValidHttpUrl(dotEnvEndpoint)
    ? dotEnvEndpoint
    : '';

  const accessKeyId = stripWrappingBrackets(
    process.env.R2_ACCESS_KEY_ID || process.env.CDN_ACCESS_KEY_ID || dotEnv.R2_ACCESS_KEY_ID
  );
  const secretAccessKey = stripWrappingBrackets(
    process.env.R2_SECRET_ACCESS_KEY || process.env.CDN_UPLOAD_KEY || dotEnv.R2_SECRET_ACCESS_KEY
  );
  const region =
    stripWrappingBrackets(process.env.R2_REGION || dotEnv.R2_REGION) || 'auto';

  const hasR2 = Boolean(
    endpoint &&
      accessKeyId &&
      secretAccessKey &&
      !endpoint.includes('example') &&
      !endpoint.includes('your-account-id') &&
      !accessKeyId.includes('replace-with') &&
      !secretAccessKey.includes('replace-with')
  );

  return {
    bucket,
    publicUrl,
    endpoint,
    accessKeyId,
    secretAccessKey,
    region,
    hasR2,
  };
}

export const CDN_BUCKET = getR2Config().bucket;
export const MAX_CDN_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const CDN_CACHE_CONTROL = 'public, max-age=31536000';

let cachedS3Client: { key: string; client: S3Client } | null = null;

export function getR2S3Client(): S3Client | null {
  const cfg = getR2Config();
  if (!cfg.hasR2) return null;

  const cacheKey = `${cfg.endpoint}|${cfg.accessKeyId}|${cfg.secretAccessKey}|${cfg.region}`;
  if (cachedS3Client && cachedS3Client.key === cacheKey) {
    return cachedS3Client.client;
  }

  const client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });

  cachedS3Client = { key: cacheKey, client };
  return client;
}

function sanitizeSegment(raw: string, fallback = 'item'): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return cleaned || fallback;
}

export function getAppOrigin(req: Request): string {
  const configured = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (configured && !configured.includes('localhost:3000')) {
    return configured.replace(/\/$/, '');
  }
  const host = req.get('host') || 'localhost:3000';
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol =
    (typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol) ||
    'http';
  let origin = `${protocol}://${host}`;
  if (
    origin.startsWith('http://') &&
    !origin.includes('localhost') &&
    !origin.includes('127.0.0.1')
  ) {
    origin = origin.replace(/^http:\/\//, 'https://');
  }
  return origin.replace(/\/$/, '');
}

function getSigningSecret(): string {
  const cfg = getR2Config();
  return (
    cfg.secretAccessKey ||
    process.env.JWT_SECRET ||
    'oververse-cdn-dev-signing-key-2026'
  ).trim();
}

function hmacHex(key: Buffer | string, data: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

function buildObjectKey(input: {
  kind: 'cover' | 'chapter-page';
  mangaId: string;
  chapterId?: string;
  pageNumber?: number;
}): string {
  const cleanMangaId = sanitizeSegment(input.mangaId, `manga-${Date.now()}`);
  if (input.kind === 'cover') {
    return `manga/${cleanMangaId}/cover.webp`;
  }
  const cleanChapterId = sanitizeSegment(input.chapterId || 'ch-1', 'ch-1');
  const pageNum = Math.max(1, Math.min(999, Math.floor(Number(input.pageNumber) || 1)));
  return `manga/${cleanMangaId}/chapter/${cleanChapterId}/page-${pageNum}.webp`;
}

/**
 * Builds the public CDN URL served with Cache-Control: public, max-age=31536000.
 * Cloudflare R2 public URLs (e.g. https://pub-...r2.dev) map directly to the bucket root:
 *   https://pub-...r2.dev/manga/{manga_id}/cover.webp
 *   https://pub-...r2.dev/manga/{manga_id}/chapter/{chapter_id}/page-{number}.webp
 */
function buildPublicCdnUrl(req: Request, objectKey: string): string {
  const cfg = getR2Config();
  if (cfg.publicUrl && !cfg.publicUrl.includes('cdn.your-domain.com')) {
    return `${cfg.publicUrl}/${objectKey}`;
  }
  return `${getAppOrigin(req)}/${cfg.bucket}/${objectKey}`;
}

async function createR2PresignedPutUrl(objectKey: string, expiresSeconds = 600): Promise<string> {
  const s3 = getR2S3Client();
  const cfg = getR2Config();
  if (!s3) {
    throw new Error('R2 S3 client is not configured.');
  }

  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: objectKey,
    ContentType: 'image/webp',
    CacheControl: CDN_CACHE_CONTROL,
  });

  return getSignedUrl(s3, command, { expiresIn: expiresSeconds });
}

function createSignedRouteUrl(
  req: Request,
  routePrefix: '/api/cdn/upload' | '/api/cdn/r2-upload',
  objectKey: string,
  expiresSeconds = 600
): string {
  const expires = Math.floor(Date.now() / 1000) + expiresSeconds;
  const sig = hmacHex(getSigningSecret(), `${objectKey}:${expires}`);
  return `${getAppOrigin(req)}${routePrefix}/${objectKey}?expires=${expires}&sig=${sig}`;
}

export function verifyLocalSignedUpload(
  objectKey: string,
  expiresRaw: unknown,
  sigRaw: unknown
): boolean {
  const expires = Number(expiresRaw);
  const sig = String(sigRaw || '');
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) {
    return false;
  }
  const expected = hmacHex(getSigningSecret(), `${objectKey}:${expires}`);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function getCdnBucketStorageRoot(): string {
  return path.join(process.cwd(), 'public', 'cdn', getR2Config().bucket);
}

/**
 * Direct S3-compatible R2 upload helper used by both `/api/cdn/r2-upload` and backend verification.
 */
export async function uploadWebpBufferToR2(
  objectKey: string,
  buffer: Buffer
): Promise<{ bucket: string; objectKey: string; etag?: string }> {
  const s3 = getR2S3Client();
  const cfg = getR2Config();
  if (!s3) {
    throw new Error('R2 credentials are missing.');
  }
  if (buffer.length === 0) {
    throw new Error('Empty image payload.');
  }
  if (buffer.length > MAX_CDN_IMAGE_BYTES) {
    throw new Error('Image too big, compress and try again.');
  }

  const res = await s3.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: 'image/webp',
      CacheControl: CDN_CACHE_CONTROL,
    })
  );

  return {
    bucket: cfg.bucket,
    objectKey,
    etag: res.ETag,
  };
}

export async function listR2Objects(prefix: string) {
  const s3 = getR2S3Client();
  const cfg = getR2Config();
  if (!s3) return [];
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: cfg.bucket,
      Prefix: prefix,
    })
  );
  return res.Contents || [];
}

export async function headR2Object(objectKey: string) {
  const s3 = getR2S3Client();
  const cfg = getR2Config();
  if (!s3) return null;
  return s3.send(
    new HeadObjectCommand({
      Bucket: cfg.bucket,
      Key: objectKey,
    })
  );
}

export async function deleteR2Object(objectKey: string) {
  const s3 = getR2S3Client();
  const cfg = getR2Config();
  if (!s3) return;
  await s3.send(
    new DeleteObjectCommand({
      Bucket: cfg.bucket,
      Key: objectKey,
    })
  );
}

/**
 * Signed S3-compatible server-side relay PUT to Cloudflare R2 (`PutObjectCommand`).
 * Fallback when browser R2 CORS blocks direct browser PUT to *.r2.cloudflarestorage.com.
 * Mounted BEFORE express.json() so raw WebP binary buffers stay intact (never touches Neon).
 */
export async function handleR2RelayBinaryPut(req: Request, res: Response) {
  try {
    const rawParam = String((req.params as any)?.[0] || '').replace(/^\/+/, '');
    const normalizedKey = path.posix.normalize(rawParam);
    if (
      !normalizedKey ||
      normalizedKey.startsWith('..') ||
      normalizedKey.includes('..') ||
      !normalizedKey.endsWith('.webp')
    ) {
      return res.status(400).json({ error: 'Invalid CDN object key.' });
    }

    const { expires, sig } = req.query;
    if (!verifyLocalSignedUpload(normalizedKey, expires, sig)) {
      return res.status(403).json({ error: 'Invalid or expired signed CDN upload URL.' });
    }

    const bodyBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(req.body || '');

    if (bodyBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty image payload.' });
    }

    if (bodyBuffer.length > MAX_CDN_IMAGE_BYTES) {
      return res.status(413).json({ error: 'Image too big, compress and try again.' });
    }

    const cfg = getR2Config();
    if (!cfg.hasR2) {
      return res.status(503).json({ error: 'Cloudflare R2 credentials are not configured.' });
    }

    const result = await uploadWebpBufferToR2(normalizedKey, bodyBuffer);
    const cdnUrl = buildPublicCdnUrl(req, normalizedKey);

    return res.status(200).json({
      success: true,
      provider: 'cloudflare-r2',
      bucket: result.bucket,
      objectKey: normalizedKey,
      cdnUrl,
      bytes: bodyBuffer.length,
      cacheControl: CDN_CACHE_CONTROL,
    });
  } catch (error: any) {
    console.error('[R2 Relay PUT Error]:', error);
    return res.status(500).json({ error: error?.message || 'Failed to upload image to R2 CDN.' });
  }
}

/**
 * Handles binary PUT directly to the local signed CDN fallback directory (dev when R2 unconfigured).
 */
export async function handleLocalCdnBinaryPut(req: Request, res: Response) {
  try {
    const rawParam = String((req.params as any)?.[0] || '').replace(/^\/+/, '');
    const normalizedKey = path.posix.normalize(rawParam);
    if (
      !normalizedKey ||
      normalizedKey.startsWith('..') ||
      normalizedKey.includes('..') ||
      !normalizedKey.endsWith('.webp')
    ) {
      return res.status(400).json({ error: 'Invalid CDN object key.' });
    }

    const { expires, sig } = req.query;
    if (!verifyLocalSignedUpload(normalizedKey, expires, sig)) {
      return res.status(403).json({ error: 'Invalid or expired signed CDN upload URL.' });
    }

    const bodyBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(req.body || '');

    if (bodyBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty image payload.' });
    }

    if (bodyBuffer.length > MAX_CDN_IMAGE_BYTES) {
      return res.status(413).json({ error: 'Image too big, compress and try again.' });
    }

    const bucketRoot = getCdnBucketStorageRoot();
    const targetPath = path.resolve(bucketRoot, normalizedKey);
    if (!targetPath.startsWith(path.resolve(bucketRoot))) {
      return res.status(400).json({ error: 'Invalid storage destination.' });
    }

    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, bodyBuffer);

    const cdnUrl = buildPublicCdnUrl(req, normalizedKey);
    return res.status(200).json({
      success: true,
      bucket: getR2Config().bucket,
      objectKey: normalizedKey,
      cdnUrl,
      bytes: bodyBuffer.length,
    });
  } catch (error: any) {
    console.error('[CDN PUT Error]:', error);
    return res.status(500).json({ error: error?.message || 'Failed to upload image to CDN.' });
  }
}

export const cdnRouter = express.Router();

/**
 * POST /api/cdn/sign-upload
 * Issues an S3-compatible presigned PUT URL (Cloudflare R2 with Cache-Control: public, max-age=31536000)
 * plus a signed R2 relay URL and final CDN_PUBLIC_URL.
 */
cdnRouter.post(
  '/sign-upload',
  requireJwtAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const { kind, mangaId, chapterId, pageNumber, fileSize } = req.body || {};

    if (Number(fileSize) > MAX_CDN_IMAGE_BYTES) {
      return res.status(413).json({ error: 'Image too big, compress and try again.' });
    }

    const normalizedKind: 'cover' | 'chapter-page' =
      kind === 'cover' ? 'cover' : 'chapter-page';
    const cleanMangaId =
      typeof mangaId === 'string' && mangaId.trim() ? mangaId : `manga-${Date.now()}`;

    const objectKey = buildObjectKey({
      kind: normalizedKind,
      mangaId: cleanMangaId,
      chapterId: typeof chapterId === 'string' ? chapterId : undefined,
      pageNumber: Number(pageNumber) || 1,
    });

    const cfg = getR2Config();
    const signedUrl = cfg.hasR2
      ? await createR2PresignedPutUrl(objectKey, 600)
      : createSignedRouteUrl(req, '/api/cdn/upload', objectKey, 600);
    const r2RelayUrl = cfg.hasR2
      ? createSignedRouteUrl(req, '/api/cdn/r2-upload', objectKey, 600)
      : undefined;
    const cdnUrl = buildPublicCdnUrl(req, objectKey);

    return res.status(200).json({
      success: true,
      provider: cfg.hasR2 ? 'cloudflare-r2' : 'local-cdn-bucket',
      bucket: cfg.bucket,
      region: cfg.region,
      objectKey,
      signedUrl,
      ...(r2RelayUrl ? { r2RelayUrl } : {}),
      cdnUrl,
      contentType: 'image/webp',
      cacheControl: CDN_CACHE_CONTROL,
      expiresIn: 600,
    });
  }
);
