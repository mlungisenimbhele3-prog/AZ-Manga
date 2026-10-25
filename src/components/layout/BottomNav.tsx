import React from 'react';
import { BookOpen, Trophy, Sparkles, MessageSquare, Wallet, Layers } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  isCreator: boolean;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  isCreator,
  isAdmin = false,
}) => {
  const tabs = [
    {
      id: 'readers',
      label: 'Reader',
      icon: BookOpen,
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
  ];

  return (
    <nav aria-label="Bottom Navigation" className="fixed bottom-[50px] left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 shadow-2xl min-[801px]:hidden transform-gpu">
      <div className="mx-auto max-w-md flex items-center justify-around">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'backdrop' && activeTab === 'canvas');
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

