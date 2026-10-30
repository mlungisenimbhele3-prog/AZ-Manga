import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { getStarRatingLabel } from '../../services/ratingService';

export interface RatingAverageDisplayProps {
  rating?: number;
  ratingCount?: number;
  size?: 'xs' | 'sm' | 'md';
  showCount?: boolean;
  unratedLabel?: string;
  className?: string;
}

/**
 * Unboxed typographic average rating indicator with tabular numerals.
 */
export const RatingAverageDisplay: React.FC<RatingAverageDisplayProps> = ({
  rating = 0,
  ratingCount = 0,
  size = 'sm',
  showCount = true,
  unratedLabel = '0.0',
  className = '',
}) => {
  const hasRatings = ratingCount > 0 || rating > 0;
  const displayValue = hasRatings ? rating.toFixed(1) : unratedLabel;

  const iconClass =
    size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const textClass =
    size === 'xs' ? 'text-[10px]' : size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono tabular-nums ${textClass} ${className}`}
      title={
        ratingCount > 0
          ? `Average rating ${rating.toFixed(2)} out of 5 (${ratingCount} ${
              ratingCount === 1 ? 'rating' : 'ratings'
            })`
          : 'No reader ratings yet'
      }
    >
      <Star
        className={`${iconClass} shrink-0 ${
          hasRatings ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
        }`}
      />
      <span className={hasRatings ? 'font-bold text-amber-400' : 'font-semibold text-slate-400'}>
        {displayValue}
      </span>
      {showCount && ratingCount > 0 && (
        <span className="text-slate-400 font-normal">({ratingCount})</span>
      )}
    </span>
  );
};

export interface StarRatingInputProps {
  value: number | null;
  averageRating?: number;
  ratingCount?: number;
  onRate: (score: 1 | 2 | 3 | 4 | 5) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  showAverageSummary?: boolean;
  showStatusLabel?: boolean;
  disabled?: boolean;
  idPrefix?: string;
  className?: string;
}

const STAR_VALUES: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

/**
 * Interactive 1–5 star rating control for Manga Series, Volumes, and Chapters.
 */
export const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  averageRating = 0,
  ratingCount = 0,
  onRate,
  size = 'md',
  label,
  showAverageSummary = true,
  showStatusLabel = false,
  disabled = false,
  idPrefix = 'star-rater',
  className = '',
}) => {
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [justRatedScore, setJustRatedScore] = useState<number | null>(null);

  const activeScore = hoverScore ?? value ?? 0;

  const starSizeClass =
    size === 'xs'
      ? 'w-3.5 h-3.5'
      : size === 'sm'
      ? 'w-4 h-4'
      : size === 'lg'
      ? 'w-6 h-6'
      : 'w-5 h-5';

  const buttonSizeClass =
    size === 'xs'
      ? 'min-h-[28px] min-w-[26px] p-1'
      : size === 'sm'
      ? 'min-h-[32px] min-w-[30px] p-1'
      : size === 'lg'
      ? 'min-h-[42px] min-w-[42px] p-1.5'
      : 'min-h-[36px] min-w-[36px] p-1.5';

  const handleSelectStar = (e: React.MouseEvent, star: 1 | 2 | 3 | 4 | 5) => {
    e.stopPropagation();
    if (disabled) return;
    setJustRatedScore(star);
    onRate(star);
    window.setTimeout(() => {
      setJustRatedScore((prev) => (prev === star ? null : prev));
    }, 1800);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={() => setHoverScore(null)}
      className={`inline-flex flex-wrap items-center gap-2 ${className}`}
    >
      {label && (
        <span className="text-xs font-semibold text-slate-300">{label}</span>
      )}

      <div
        role="radiogroup"
        aria-label={label || 'Rate from 1 to 5 stars'}
        className="inline-flex items-center gap-0.5"
      >
        {STAR_VALUES.map((star) => {
          const isFilled = star <= activeScore;
          const isCommunityHint =
            hoverScore === null && value === null && averageRating >= star - 0.25;

          return (
            <button
              key={`${idPrefix}-star-${star}`}
              id={`${idPrefix}-btn-${star}`}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`Rate ${star} out of 5 stars`}
              disabled={disabled}
              onMouseEnter={() => setHoverScore(star)}
              onFocus={() => setHoverScore(star)}
              onBlur={() => setHoverScore(null)}
              onClick={(e) => handleSelectStar(e, star)}
              className={`${buttonSizeClass} inline-flex items-center justify-center rounded-lg transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:scale-110 active:scale-95 hover:bg-amber-500/10'
              }`}
              title={getStarRatingLabel(star)}
            >
              <Star
                className={`${starSizeClass} transition-colors duration-150 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isCommunityHint
                    ? 'fill-amber-400/25 text-amber-400/60'
                    : 'text-slate-500 hover:text-amber-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showAverageSummary && (
        <div className="inline-flex items-center gap-1.5 text-xs font-mono tabular-nums">
          <span
            className={
              ratingCount > 0 || averageRating > 0
                ? 'font-bold text-amber-300'
                : 'font-medium text-slate-400'
            }
          >
            {ratingCount > 0 || averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-[11px] font-sans text-slate-400">
            {ratingCount > 0
              ? `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`
              : 'Unrated'}
          </span>
        </div>
      )}

      {showStatusLabel && (
        <span className="text-[11px] font-medium text-slate-300 tabular-nums">
          {justRatedScore !== null ? (
            <span className="text-emerald-400 font-semibold">
              Saved {justRatedScore}/5 ★
            </span>
          ) : hoverScore !== null ? (
            <span className="text-amber-300">{getStarRatingLabel(hoverScore)}</span>
          ) : value !== null ? (
            <span className="text-amber-400/90">Your rating: {value}/5</span>
          ) : (
            <span className="text-slate-400">Rate 1–5 stars</span>
          )}
        </span>
      )}
    </div>
  );
};
