import React, { useState, useEffect } from 'react';
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
}

/**
 * Resilient Manga Cover component.
 * When coverUrl is empty, null, or fails to load, shows /placeholder.png
 * or falls back to an aesthetic gradient container with the manga title.
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
}) => {
  const [imgError, setImgError] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const rawSrc = coverUrl !== undefined ? coverUrl : src;

  // Reset state if source changes
  useEffect(() => {
    setImgError(false);
    setUsedFallback(false);
  }, [rawSrc]);

  const displayTitle = title || alt || 'AZ OVERVERSE';
  const cleanSrc = rawSrc && typeof rawSrc === 'string' && rawSrc.trim() !== '' && rawSrc !== 'null' && rawSrc !== 'undefined'
    ? rawSrc.trim()
    : null;

  // If no source at all, start directly with /placeholder.png
  const initialSource = cleanSrc || '/placeholder.png';
  const [currentSrc, setCurrentSrc] = useState<string>(initialSource);

  useEffect(() => {
    setCurrentSrc(cleanSrc || '/placeholder.png');
  }, [cleanSrc]);

  // If image completely failed to load even with placeholder and gradient is requested:
  if (imgError && showGradientFallback) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-slate-800 text-white select-none overflow-hidden ${containerClassName} ${className}`}
        title={displayTitle}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-2 shadow-sm shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <span className="font-['Bebas_Neue',sans-serif] text-sm sm:text-base tracking-wide text-white line-clamp-2 leading-tight drop-shadow px-1">
          {displayTitle}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/90 mt-1">
          AZ OVERVERSE
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt || displayTitle}
      className={className}
      referrerPolicy={referrerPolicy}
      loading={loading}
      decoding={decoding}
      onError={(e) => {
        // If initial URL failed, try local /placeholder.png first
        if (!usedFallback && currentSrc !== '/placeholder.png') {
          setUsedFallback(true);
          setCurrentSrc('/placeholder.png');
        } else {
          // If even /placeholder.png failed or errored, switch to gradient title fallback
          setImgError(true);
        }
      }}
    />
  );
};

export const MangaCoverImage = React.memo(MangaCoverImageComponent);
export default MangaCoverImage;
