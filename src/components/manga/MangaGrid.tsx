import React, { useCallback, useMemo } from 'react';
import { motion, Variants, useReducedMotion } from 'motion/react';
import { Manga } from '../../types';
import { MangaCard } from './MangaCard';
import { isLowEndOrReducedMotion } from '../../utils/devicePerformance';

interface MangaGridProps {
  mangaList: Manga[];
  favoriteIds: string[];
  onToggleFavorite: (mangaId: string) => void;
  onSelect: (manga: Manga) => void;
  columns?: 2 | 3 | 4;
  filterKey?: string;
  className?: string;
  onOpenAiReport?: (manga: Manga) => void;
}

const MangaGridComponent: React.FC<MangaGridProps> = ({
  mangaList,
  favoriteIds,
  onToggleFavorite,
  onSelect,
  columns,
  filterKey,
  className,
  onOpenAiReport,
}) => {
  const osReducedMotion = useReducedMotion();
  const skipMotionOverhead = Boolean(osReducedMotion) || isLowEndOrReducedMotion();

  // O(1) favorite lookup instead of O(N) Array.includes on every card
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const resolvedGridClass =
    className ||
    (columns === 2
      ? 'grid grid-cols-2 gap-3'
      : columns === 3
      ? 'grid grid-cols-2 md:grid-cols-3 gap-4'
      : columns === 4
      ? 'grid grid-cols-4 gap-4'
      : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4');

  const animationTriggerKey = useMemo(
    () => `${filterKey ?? 'grid'}::${mangaList.map((m) => m.id).join('|')}`,
    [filterKey, mangaList]
  );

  // Stable callbacks so React.memo(MangaCard) skips unchanged cards on favorite toggle
  const handleCardToggleFavorite = useCallback(
    (_e: React.MouseEvent, id: string) => {
      onToggleFavorite(id);
    },
    [onToggleFavorite]
  );

  const handleCardOpenAiReport = useCallback(
    (_e: React.MouseEvent, m: Manga) => {
      onOpenAiReport?.(m);
    },
    [onOpenAiReport]
  );

  const containerVariants: Variants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.025,
          delayChildren: 0.005,
        },
      },
    }),
    []
  );

  const itemVariants: Variants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 10, scale: 0.985 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.2,
          ease: [0.16, 1, 0.3, 1],
        },
      },
    }),
    []
  );

  // Fast-path for lower-end devices & reduced motion: zero JS animation wrapper overhead
  if (skipMotionOverhead) {
    return (
      <div className={resolvedGridClass}>
        {mangaList.map((manga, idx) => (
          <div key={`grid-manga-${manga.id}-${idx}`} className="flex flex-col h-full">
            <MangaCard
              manga={manga}
              isFavorite={favoriteSet.has(manga.id)}
              onToggleFavorite={handleCardToggleFavorite}
              onSelect={onSelect}
              onOpenAiReport={handleCardOpenAiReport}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      key={animationTriggerKey}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={resolvedGridClass}
    >
      {mangaList.map((manga, idx) => (
        <motion.div
          key={`grid-manga-${manga.id}-${idx}`}
          variants={itemVariants}
          className="flex flex-col h-full"
        >
          <MangaCard
            manga={manga}
            isFavorite={favoriteSet.has(manga.id)}
            onToggleFavorite={handleCardToggleFavorite}
            onSelect={onSelect}
            onOpenAiReport={handleCardOpenAiReport}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export const MangaGrid = React.memo(MangaGridComponent);
