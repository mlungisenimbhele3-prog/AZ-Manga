import React from 'react';
import { Manga } from '../../types';
import { ResponsiveLayout } from '../layout/ResponsiveLayout';
import { DesktopHome } from '../layout/DesktopHome';
import { MobileHome } from '../layout/MobileHome';
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
  activeTab?: string;
  onOpenTasteProfileModal?: () => void;
  userTasteProfile?: UserTasteProfile;
  isAdmin?: boolean;
}

const NOOP = () => {};

const ReaderPageComponent: React.FC<ReaderPageProps> = (props) => {
  return (
    <div id="reader-hub-page" className="w-full animate-fadeIn">
      {/* ResponsiveLayout delegates between MobileHome and DesktopHome at 800px */}
      <ResponsiveLayout
        mobileView={
          <MobileHome
            mangaList={props.mangaList}
            filteredManga={props.filteredManga}
            featuredManga={props.featuredManga}
            favoriteIds={props.favoriteIds}
            onToggleFavorite={props.onToggleFavorite}
            onStartReading={props.onStartReading}
            onSelectDetailManga={props.onSelectDetailManga}
            selectedFilter={props.selectedFilter}
            onSelectFilter={props.onSelectFilter}
            searchQuery={props.searchQuery || ''}
            onSearchChange={props.onSearchChange || NOOP}
            onClearSearch={props.onClearSearch}
            isVipUser={props.isVipUser}
            ads={props.ads}
            onOpenSubscriptionModal={props.onOpenSubscriptionModal}
            onOpenCreatorDashboard={props.onOpenCreatorDashboard}
            onOpenPublishModal={props.onOpenPublishModal}
            onNavigateToAwards={props.onNavigateToAwards}
            onOpenAiReport={props.onOpenAiReport}
            onOpenTasteProfileModal={props.onOpenTasteProfileModal}
            userTasteProfile={props.userTasteProfile}
            onNavigateToCanvas={props.onNavigateToCanvas}
          />
        }
        desktopView={
          <DesktopHome
            mangaList={props.mangaList}
            filteredManga={props.filteredManga}
            featuredManga={props.featuredManga}
            favoriteIds={props.favoriteIds}
            onToggleFavorite={props.onToggleFavorite}
            onStartReading={props.onStartReading}
            onSelectDetailManga={props.onSelectDetailManga}
            selectedFilter={props.selectedFilter}
            onSelectFilter={props.onSelectFilter}
            searchQuery={props.searchQuery || ''}
            onSearchChange={props.onSearchChange || NOOP}
            onClearSearch={props.onClearSearch}
            isVipUser={props.isVipUser}
            ads={props.ads}
            onOpenSubscriptionModal={props.onOpenSubscriptionModal}
            onOpenCreatorDashboard={props.onOpenCreatorDashboard}
            onOpenPublishModal={props.onOpenPublishModal}
            onNavigateToAwards={props.onNavigateToAwards}
            onNavigateToWallet={props.onNavigateToWallet || NOOP}
            onNavigateToStudio={props.onNavigateToStudio || NOOP}
            onNavigateToChats={props.onNavigateToChats || NOOP}
            onNavigateToCanvas={props.onNavigateToCanvas}
            onOpenAiReport={props.onOpenAiReport}
            onRunAiScanCatalog={props.onRunAiScanCatalog}
            isScanningAi={props.isScanningAi}
            activeTab={props.activeTab}
            onOpenTasteProfileModal={props.onOpenTasteProfileModal}
            userTasteProfile={props.userTasteProfile}
            isAdmin={props.isAdmin}
          />
        }
      />
    </div>
  );
};

export const ReaderPage = React.memo(ReaderPageComponent);
