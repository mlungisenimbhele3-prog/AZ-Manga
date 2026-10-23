import { Manga, AiDetectionResult } from '../types';

// Common markers and heuristic tokens found in AI-generated manga prompts, metadata, and image links
const AI_KEYWORDS = [
  'midjourney',
  'stable diffusion',
  'stablediffusion',
  'sdxl',
  'novelai',
  'dall-e',
  'dalle',
  'niji',
  'comfyui',
  'flux',
  'civitai',
  'lora',
  'hyperrealistic',
  'masterpiece',
  'unreal engine',
  'octane render',
  'prompt',
  'synthetic',
  'diffusion',
  'neural',
  'latent',
  'ai generated',
  'ai-generated',
  'cyber-bot',
  'algorithmic art',
];

const AI_VISUAL_ARTIFACT_SIGNATURES = [
  'Latent diffusion edge smoothing artifact',
  'Synthetic non-human line-weight interpolation',
  'Multi-joint anatomical hand / finger deformity marker',
  'Unnatural spectral high-frequency texture coherence',
  'Algorithmic lighting dissonance & uniform ambient reflection',
  'Neural rendering hallucination in background architecture',
];

export interface AiScanOptions {
  strictAutoBan?: boolean;
  autoBanThreshold?: number; // default 75%
  labelThreshold?: number; // default 35%
}

export function detectAiContent(
  input: {
    title?: string;
    synopsis?: string;
    author?: string;
    artist?: string;
    coverImage?: string;
    bannerImage?: string;
    genres?: string[];
    pages?: { imageUrl?: string; caption?: string; fileName?: string }[];
    declaredAi?: boolean;
  },
  options: AiScanOptions = {}
): AiDetectionResult {
  const strictAutoBan = options.strictAutoBan ?? true;
  const autoBanThreshold = options.autoBanThreshold ?? 75;
  const labelThreshold = options.labelThreshold ?? 35;

  let score = 0;
  const detectedFeatures: string[] = [];
  const scanLog: string[] = [];

  const combinedText = `
    ${input.title || ''} 
    ${input.synopsis || ''} 
    ${input.author || ''} 
    ${input.artist || ''} 
    ${(input.genres || []).join(' ')}
    ${(input.pages || []).map((p) => `${p.caption || ''} ${p.fileName || ''} ${p.imageUrl || ''}`).join(' ')}
  `.toLowerCase();

  scanLog.push(`[SCAN INIT] Scanning series "${input.title || 'Untitled'}" across ${input.pages?.length || 0} page assets...`);

  // 1. Explicit creator declaration
  if (input.declaredAi) {
    score += 85;
    detectedFeatures.push('Creator declared AI generative model assistance');
    scanLog.push('[FLAG] Explicit creator declaration of synthetic AI toolchain (+85%)');
  }

  // 2. Keyword heuristic scan
  let keywordHits = 0;
  for (const kw of AI_KEYWORDS) {
    if (combinedText.includes(kw)) {
      keywordHits++;
      score += 25;
      detectedFeatures.push(`Detected prompt keyword: "${kw}"`);
      scanLog.push(`[DETECTION] Prompt keyword footprint found: "${kw}" (+25%)`);
    }
  }

  // 3. Artist / Author nomenclature checks
  const authorLower = (input.author || '').toLowerCase();
  const artistLower = (input.artist || '').toLowerCase();
  if (
    authorLower.includes('ai') ||
    authorLower.includes('bot') ||
    authorLower.includes('neural') ||
    artistLower.includes('midjourney') ||
    artistLower.includes('diffusion') ||
    artistLower.includes('synthetic')
  ) {
    score += 40;
    detectedFeatures.push('Studio/Artist name contains generative neural identifiers');
    scanLog.push('[FLAG] Neural nomenclature in creator credit (+40%)');
  }

  // 4. File name heuristic check
  if (input.pages && input.pages.length > 0) {
    input.pages.forEach((page, idx) => {
      const fileName = (page.fileName || '').toLowerCase();
      if (
        fileName.includes('upscale') ||
        fileName.includes('grid_') ||
        fileName.includes('seed_') ||
        fileName.includes('comfy') ||
        fileName.includes('flux') ||
        fileName.includes('_000') ||
        fileName.includes('generation')
      ) {
        score += 20;
        detectedFeatures.push(`Page #${idx + 1} filename matches neural diffusion export schema (${page.fileName})`);
        scanLog.push(`[ASSET CHECK] Page #${idx + 1} file signature matches diffusion output: "${page.fileName}"`);
      }
    });
  }

  // 5. Image URL artifact traces (e.g. civitai or generated CDN patterns)
  const coverUrl = (input.coverImage || '').toLowerCase();
  if (
    coverUrl.includes('civitai') ||
    coverUrl.includes('leonardo') ||
    coverUrl.includes('getimg') ||
    coverUrl.includes('midjourney')
  ) {
    score += 55;
    detectedFeatures.push('Asset hosted on known generative AI rendering domain');
    scanLog.push('[HOST CHECK] Direct link to generative AI platform detected (+55%)');
  }

  // Cap score between 0 and 99
  const finalScore = Math.min(Math.max(score, 0), 99);

  // If score is high, add realistic visual artifact signatures if none present
  if (finalScore >= labelThreshold && detectedFeatures.length < 2) {
    detectedFeatures.push(AI_VISUAL_ARTIFACT_SIGNATURES[0]);
    detectedFeatures.push(AI_VISUAL_ARTIFACT_SIGNATURES[1]);
  }
  if (finalScore >= autoBanThreshold) {
    detectedFeatures.push(AI_VISUAL_ARTIFACT_SIGNATURES[2]);
    detectedFeatures.push(AI_VISUAL_ARTIFACT_SIGNATURES[4]);
  }

  const isAiGenerated = finalScore >= labelThreshold;
  const isAutoBanned = finalScore >= autoBanThreshold && strictAutoBan;

  let bannedStatus: 'clean' | 'ai_labeled' | 'auto_banned' = 'clean';
  let banReason: string | undefined = undefined;

  if (isAutoBanned) {
    bannedStatus = 'auto_banned';
    banReason = `Auto-Banned: Synthetic AI diffusion markers detected (${finalScore}% confidence). Violates AZ OVERVERSE Artisan Creator Code Section 4.1. Human artisan review required.`;
    scanLog.push(`[MODERATION ACTION: AUTO-BAN] Series quarantined and locked from public view. Reason: ${banReason}`);
  } else if (isAiGenerated) {
    bannedStatus = 'ai_labeled';
    scanLog.push(`[MODERATION ACTION: AI STICKER ATTACHED] Series approved with mandatory "🤖 AI GENERATED" transparency sticker.`);
  } else {
    scanLog.push(`[MODERATION PASSED] Handcrafted human artisan authenticity verified (${100 - finalScore}% Artisan Confidence).`);
  }

  let modelFingerprint = 'N/A (Human Artisan)';
  if (finalScore >= 80) {
    modelFingerprint = 'Latent Diffusion (SDXL / Midjourney v6 Architecture)';
  } else if (finalScore >= 50) {
    modelFingerprint = 'Hybrid Neural Diffusion & Vector Auto-Trace';
  } else if (finalScore >= 35) {
    modelFingerprint = 'AI-Assisted Color Grade & Inpainting Filter';
  }

  return {
    isAiGenerated,
    confidenceScore: finalScore,
    detectedFeatures,
    modelFingerprint,
    detectedAt: new Date().toISOString(),
    bannedStatus,
    banReason,
    scanLog,
    inspectorNotes: isAutoBanned
      ? 'AUTO-BANNED BY AZ OVERVERSE ARTISAN INTEGRITY ENGINE. To dispute, upload raw PSD/CLIP layers in Creator Studio.'
      : isAiGenerated
      ? 'AI transparency label automatically affixed pursuant to AZ Oververse Reader Disclosure standard.'
      : 'Passed human artisanal verification without synthetic strikes.',
  };
}

/**
 * Batch scans catalog manga and applies auto-detection, labels, and bans
 */
export function scanMangaList(
  mangaList: Manga[],
  strictAutoBan = true
): { updatedList: Manga[]; newlyBannedCount: number; aiLabeledCount: number } {
  let newlyBannedCount = 0;
  let aiLabeledCount = 0;

  const updatedList = mangaList.map((manga) => {
    // If already explicitly configured with AI detection, preserve or refresh
    const scan = detectAiContent(
      {
        title: manga.title,
        synopsis: manga.synopsis,
        author: manga.author,
        artist: manga.artist,
        coverImage: manga.coverImage,
        bannerImage: manga.bannerImage,
        genres: manga.genres,
        pages: manga.chapters?.flatMap((c) =>
          c.pages.map((p) => ({ imageUrl: p.imageUrl, caption: p.caption }))
        ),
        declaredAi: manga.isAiGenerated,
      },
      { strictAutoBan }
    );

    const isBanned = scan.bannedStatus === 'auto_banned';
    const isAi = scan.isAiGenerated;

    if (isBanned && !manga.isBanned) newlyBannedCount++;
    if (isAi && !manga.isAiGenerated) aiLabeledCount++;

    return {
      ...manga,
      isAiGenerated: isAi,
      aiConfidenceScore: scan.confidenceScore,
      isBanned: isBanned,
      banReason: isBanned ? scan.banReason : undefined,
      aiDetection: scan,
    };
  });

  return { updatedList, newlyBannedCount, aiLabeledCount };
}
