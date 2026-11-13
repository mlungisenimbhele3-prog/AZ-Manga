import React, { useMemo } from 'react';
import { BookOpen, Trophy, Layers, User, Users } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  isCreator: boolean;
  isAdmin?: boolean;
  isVisible?: boolean;
}

const BottomNavComponent: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  isVisible = true,
}) => {
  // 5 primary tabs: Reader, Awards, Backdrop, Account, Follow
  const tabs = useMemo(
    () => [
      {
        id: 'readers',
        label: 'Reader',
        icon: BookOpen,
      },
      {
        id: 'awards',
        label: 'Awards',
        icon: Trophy,
      },
      {
        id: 'backdrop',
        label: 'Backdrop',
        icon: Layers,
      },
      {
        id: 'creators',
        label: 'Account',
        icon: User,
      },
      {
        id: 'following',
        label: 'Follow',
        icon: Users,
      },
    ],
    []
  );

  return (
    <nav
      id="bottom-nav-bar"
      aria-label="Bottom Navigation"
      className={`fixed left-0 right-0 z-50 bg-[#0A0A0A] border-t border-zinc-800/80 px-2 py-1 shadow-2xl transform-gpu transition-all duration-300 ease-in-out ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-[calc(100%+80px)] opacity-0 pointer-events-none'
      }`}
      style={{
        bottom: 'calc(50px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="mx-auto max-w-md sm:max-w-lg md:max-w-xl flex items-center justify-around">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'readers' && (activeTab === 'reader' || activeTab === 'updates')) ||
            (tab.id === 'awards' && activeTab === 'hot') ||
            (tab.id === 'backdrop' && (activeTab === 'canvas' || activeTab === 'browse')) ||
            (tab.id === 'creators' && activeTab === 'account') ||
            (tab.id === 'following' && (activeTab === 'shelf' || activeTab === 'follow'));
          return (
            <button
              key={`bottom-tab-${tab.id}-${index}`}
              id={`bottom-nav-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[44px] min-w-[52px] flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition duration-150 active:scale-95 whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-300 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const BottomNav = React.memo(BottomNavComponent);


