import React from 'react';
import { Manga } from '../../types';
import { MangaCard } from './MangaCard';

interface MangaGridProps {
  mangaList: Manga[];
  favoriteIds: string[];
  onToggleFavorite: (mangaId: string) => void;
  onSelect: (manga: Manga) => void;
  columns?: number;
  onOpenAiReport?: (manga: Manga) => void;
}

export const MangaGrid: React.FC<MangaGridProps> = ({
  mangaList,
  favoriteIds,
  onToggleFavorite,
  onSelect,
  onOpenAiReport,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {mangaList.map((manga, idx) => (
        <MangaCard
          key={`grid-manga-${manga.id}-${idx}`}
          manga={manga}
          isFavorite={favoriteIds.includes(manga.id)}
          onToggleFavorite={(_e, id) => onToggleFavorite(id)}
          onSelect={onSelect}
          onOpenAiReport={(_e, m) => onOpenAiReport?.(m)}
        />
      ))}
    </div>
  );
};
