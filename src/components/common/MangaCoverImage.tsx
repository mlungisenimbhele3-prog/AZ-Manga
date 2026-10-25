import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

export interface MangaCoverImageProps {
  src?: string | null;
  coverUrl?: string | null;
  alt: string;
  title?: string;
  className?: string;
  containerClassName?: string;
  showGradientFallback?: boolean;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'auto' | 'sync';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Resilient, zero-effect-cascade Manga Cover component.
 * Avoids redundant useEffect re-renders when props change by keying failure state to the source URL.
 */
const MangaCoverImageComponent: React.FC<MangaCoverImageProps> = ({
  src,
  coverUrl,
  alt,
  title,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  showGradientFallback = true,
  referrerPolicy = 'no-referrer',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
}) => {
  const rawSrc = coverUrl !== undefined ? coverUrl : src;
  const displayTitle = title || alt || 'AZ OVERVERSE';

  const cleanSrc =
    rawSrc &&
    typeof rawSrc === 'string' &&
    rawSrc.trim() !== '' &&
    rawSrc !== 'null' &&
    rawSrc !== 'undefined'
      ? rawSrc.trim()
      : null;

  const sourceKey = cleanSrc || '__empty__';

  // Stage 0: try cleanSrc, Stage 1: try /placeholder.png, Stage 2: styled CSS fallback
  const [failureStage, setFailureStage] = useState<{ key: string; stage: 0 | 1 | 2 }>({
    key: sourceKey,
    stage: cleanSrc ? 0 : 1,
  });

  const activeStage = failureStage.key === sourceKey ? failureStage.stage : cleanSrc ? 0 : 1;

  if (activeStage === 2 && showGradientFallback) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-slate-800 text-white select-none overflow-hidden ${containerClassName} ${className}`}
        title={displayTitle}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-2 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <span className="font-['Bebas_Neue',sans-serif] text-sm sm:text-base tracking-wide text-white line-clamp-2 leading-tight px-1">
          {displayTitle}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/90 mt-1">
          AZ OVERVERSE
        </span>
      </div>
    );
  }

  const effectiveSrc = activeStage === 0 && cleanSrc ? cleanSrc : '/placeholder.png';

  return (
    <img
      src={effectiveSrc}
      alt={alt || displayTitle}
      className={className}
      referrerPolicy={referrerPolicy}
      loading={loading}
      decoding={decoding}
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
      onError={() => {
        if (activeStage === 0 && effectiveSrc !== '/placeholder.png') {
          setFailureStage({ key: sourceKey, stage: 1 });
        } else {
          setFailureStage({ key: sourceKey, stage: 2 });
        }
      }}
    />
  );
};

export const MangaCoverImage = React.memo(MangaCoverImageComponent);
export default MangaCoverImage;
