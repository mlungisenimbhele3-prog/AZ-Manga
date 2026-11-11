import React, { useMemo } from 'react';
import { BookOpen, Trophy, Sparkles, MessageSquare, Wallet, Layers, Users } from 'lucide-react';

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
  isAdmin = false,
  isVisible = true,
}) => {
  const tabs = useMemo(
    () => [
      {
        id: 'readers',
        label: 'Reader',
        icon: BookOpen,
        activeClass: 'text-amber-400 bg-amber-500/15 font-bold',
        inactiveClass: 'text-slate-400 hover:text-slate-200',
      },
      {
        id: 'following',
        label: 'Following',
        icon: Users,
        activeClass: 'text-amber-400 bg-amber-500/15 font-bold',
        inactiveClass: 'text-slate-400 hover:text-slate-200',
      },
      {
        id: 'backdrop',
        label: 'Backdrop',
        icon: Layers,
        activeClass: 'text-cyan-400 bg-cyan-500/15 font-bold',
        inactiveClass: 'text-slate-400 hover:text-slate-200',
      },
      {
        id: 'awards',
        label: 'Awards',
        icon: Trophy,
        activeClass: 'text-amber-300 bg-amber-500/20 font-black shadow-sm',
        inactiveClass: 'text-amber-400/80 hover:text-amber-300',
      },
      {
        id: 'creators',
        label: 'Studio',
        icon: Sparkles,
        activeClass: 'text-emerald-400 bg-emerald-500/15 font-bold',
        inactiveClass: 'text-slate-400 hover:text-slate-200',
      },
      {
        id: 'chats',
        label: 'Chats',
        icon: MessageSquare,
        activeClass: 'text-blue-400 bg-blue-500/15 font-bold',
        inactiveClass: 'text-slate-400 hover:text-slate-200',
      },
      ...(isAdmin
        ? [
            {
              id: 'wallet',
              label: 'Wallet',
              icon: Wallet,
              activeClass: 'text-purple-400 bg-purple-500/15 font-bold',
              inactiveClass: 'text-slate-400 hover:text-slate-200',
            },
          ]
        : []),
    ],
    [isAdmin]
  );

  return (
    <nav
      id="bottom-nav-bar"
      aria-label="Bottom Navigation"
      className={`fixed left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 shadow-2xl transform-gpu transition-all duration-300 ease-in-out ${
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
            activeTab === tab.id || (tab.id === 'backdrop' && activeTab === 'canvas');
          return (
            <button
              key={`bottom-tab-${tab.id}-${index}`}
              id={`bottom-nav-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition duration-150 active:scale-95 whitespace-nowrap shrink-0 ${
                isActive ? tab.activeClass : tab.inactiveClass
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const BottomNav = React.memo(BottomNavComponent);


