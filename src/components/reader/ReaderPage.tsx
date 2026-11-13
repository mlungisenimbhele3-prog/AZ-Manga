import React from 'react';
import { Manga } from '../../types';
import { MangaPlusUpdatesHome } from '../manga/MangaPlusUpdatesHome';
import { UserTasteProfile } from '../../services/recommendationEngine';

export interface ReaderPageProps {
  mangaList: Manga[];
  filteredManga: Manga[];
  featuredManga: Manga | null;
  favoriteIds: string[];
  onToggleFavorite: (mangaId: string) => void;
  onStartReading: (manga: Manga, chapterId: string) => void;
  onSelectDetailManga: (manga: Manga) => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  onClearSearch: () => void;
  isVipUser: boolean;
  ads: any[];
  onOpenSubscriptionModal: () => void;
  onOpenCreatorDashboard: () => void;
  onOpenPublishModal: () => void;
  onNavigateToAwards: () => void;
  onOpenAiReport?: (manga: Manga) => void;
  onRunAiScanCatalog?: () => void;
  isScanningAi?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNavigateToWallet?: () => void;
  onNavigateToStudio?: () => void;
  onNavigateToChats?: () => void;
  onNavigateToCanvas?: () => void;
  onNavigateToFollowing?: () => void;
  activeTab?: string;
  onOpenTasteProfileModal?: () => void;
  userTasteProfile?: UserTasteProfile;
  isAdmin?: boolean;
}

const ReaderPageComponent: React.FC<ReaderPageProps> = (props) => {
  return (
    <div id="reader-hub-page" className="w-full bg-[#0A0A0A] animate-fadeIn">
      {/* HOME SCREEN = MANGA PLUS STYLE UPDATES SCREEN */}
      <MangaPlusUpdatesHome
        mangaList={props.mangaList}
        onSelectDetailManga={props.onSelectDetailManga}
        onStartReading={props.onStartReading}
        onOpenSubscriptionModal={props.onOpenSubscriptionModal}
        isVipUser={props.isVipUser}
      />
    </div>
  );
};

export const ReaderPage = React.memo(ReaderPageComponent);


