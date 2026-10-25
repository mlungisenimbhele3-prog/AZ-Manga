import React, { useCallback, useMemo } from 'react';
import { motion, Variants, useReducedMotion } from 'motion/react';
import { Manga } from '../../types';
import { MangaCard } from './MangaCard';

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
  const shouldReduceMotion = useReducedMotion();

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
        transition: shouldReduceMotion
          ? { duration: 0 }
          : {
              staggerChildren: 0.032,
              delayChildren: 0.01,
            },
      },
    }),
    [shouldReduceMotion]
  );

  const itemVariants: Variants = useMemo(
    () => ({
      hidden: shouldReduceMotion
        ? { opacity: 1, y: 0, scale: 1 }
        : { opacity: 0, y: 14, scale: 0.97 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: shouldReduceMotion
          ? { duration: 0 }
          : {
              duration: 0.24,
              ease: [0.16, 1, 0.3, 1],
            },
      },
    }),
    [shouldReduceMotion]
  );

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
