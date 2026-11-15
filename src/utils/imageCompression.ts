export const MAX_SOURCE_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_OUTPUT_IMAGE_BYTES = 500 * 1024; // 500 KB target after WebP compression
export const MAX_IMAGE_WIDTH = 1200;

export interface CompressedWebPResult {
  blob: Blob;
  contentType: 'image/webp';
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

function loadFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode image file.'));
    };
    img.src = objectUrl;
  });
}

function canvasToWebPBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
  });
}

/**
 * Validates size <= 5MB and compresses image to WebP (max width 1200px, target <= 500KB)
 * in the browser before uploading directly to CDN.
 */
export async function compressImageToWebP(file: File): Promise<CompressedWebPResult> {
  if (!file) {
    throw new Error('No image file selected.');
  }

  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('Image too big, compress and try again.');
  }

  const img = await loadFileAsImage(file);
  const naturalWidth = img.naturalWidth || img.width || MAX_IMAGE_WIDTH;
  const naturalHeight = img.naturalHeight || img.height || MAX_IMAGE_WIDTH;

  const widthSteps = [
    Math.min(naturalWidth, MAX_IMAGE_WIDTH),
    Math.min(naturalWidth, 960),
    Math.min(naturalWidth, 800),
    Math.min(naturalWidth, 640),
  ];
  const qualitySteps = [0.85, 0.76, 0.68, 0.58, 0.48, 0.38, 0.3];

  let bestBlob: Blob | null = null;
  let bestWidth = widthSteps[0];
  let bestHeight = Math.max(1, Math.round((naturalHeight / naturalWidth) * bestWidth));

  for (const targetWidth of widthSteps) {
    const targetHeight = Math.max(1, Math.round((naturalHeight / naturalWidth) * targetWidth));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is unavailable.');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    for (const q of qualitySteps) {
      const blob = await canvasToWebPBlob(canvas, q);
      if (!blob) continue;
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
        bestWidth = targetWidth;
        bestHeight = targetHeight;
      }
      if (blob.size <= MAX_OUTPUT_IMAGE_BYTES) {
        return {
          blob,
          contentType: 'image/webp',
          width: targetWidth,
          height: targetHeight,
          originalSize: file.size,
          compressedSize: blob.size,
        };
      }
    }
  }

  if (!bestBlob) {
    throw new Error('Failed to compress image to WebP.');
  }

  if (bestBlob.size > MAX_OUTPUT_IMAGE_BYTES) {
    throw new Error('Image too big, compress and try again.');
  }

  return {
    blob: bestBlob,
    contentType: 'image/webp',
    width: bestWidth,
    height: bestHeight,
    originalSize: file.size,
    compressedSize: bestBlob.size,
  };
}
