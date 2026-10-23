import { supabase, isSupabaseLiveConfigured } from './supabase';

/**
 * Uploads a manga cover file to Supabase Storage or the public server folder
 * and returns a guaranteed real https:// URL (never a local file:// or blob: path).
 */
export async function uploadCoverFile(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const cleanExt = fileExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'png';
  const uniqueName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

  // 1. Try Supabase Storage first if live credentials exist
  if (isSupabaseLiveConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from('manga-covers')
        .upload(uniqueName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || `image/${cleanExt}`,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('manga-covers')
          .getPublicUrl(uniqueName);

        if (publicData?.publicUrl && publicData.publicUrl.startsWith('http')) {
          let url = publicData.publicUrl;
          if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
            url = url.replace(/^http:\/\//, 'https://');
          }
          return url;
        }
      }
    } catch (supabaseErr) {
      console.warn('[CoverStorage] Supabase storage upload failed, falling back to server public folder:', supabaseErr);
    }
  }

  // 2. Upload to backend /api/upload-cover to persist in public/covers
  try {
    const base64Data = await fileToBase64(file);
    const response = await fetch('/api/upload-cover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: uniqueName,
        contentType: file.type || `image/${cleanExt}`,
        fileData: base64Data,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.url && typeof result.url === 'string' && result.url.startsWith('http')) {
        let url = result.url;
        if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
          url = url.replace(/^http:\/\//, 'https://');
        }
        return url;
      }
    }
  } catch (serverErr) {
    console.warn('[CoverStorage] Server /api/upload-cover endpoint failed:', serverErr);
  }

  // 3. Fallback: Return absolute URL using current host origin or default placeholder
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  let httpsOrigin = origin.startsWith('http') ? origin : `https://${origin}`;
  if (httpsOrigin.startsWith('http://') && !httpsOrigin.includes('localhost') && !httpsOrigin.includes('127.0.0.1')) {
    httpsOrigin = httpsOrigin.replace(/^http:\/\//, 'https://');
  }
  return `${httpsOrigin}/placeholder.png`;
}

/**
 * Helper to convert a File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Resolves a manga cover URL with safe fallback to /placeholder.png
 */
export function resolveMangaCoverUrl(coverUrl?: string | null): string {
  if (!coverUrl || typeof coverUrl !== 'string' || coverUrl.trim() === '' || coverUrl === 'null' || coverUrl === 'undefined') {
    return '/placeholder.png';
  }
  return coverUrl.trim();
}
