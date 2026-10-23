import React from 'react';
import { SubscriptionTier } from '../../types';
import { Sparkles, Shield, Heart, Zap, Crown } from 'lucide-react';

interface PlanBadgeProps {
  tier: SubscriptionTier;
  billingCycle?: 'monthly' | 'yearly';
  onClickUpgrade?: () => void;
  onQuickToggleTier?: (tier: SubscriptionTier, cycle?: 'monthly' | 'yearly') => void;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({
  tier,
  billingCycle,
  onClickUpgrade,
  onQuickToggleTier,
}) => {
  return (
    <div className="flex items-center gap-1.5">
      {tier === 'free' ? (
        <button
          id="navbar-plan-badge-free"
          onClick={onClickUpgrade}
          className="group flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
          <span>Free (With Ads)</span>
          <span className="hidden sm:inline text-[10px] text-black bg-amber-400 font-bold px-1.5 py-0.2 rounded-full">
            Upgrade
          </span>
        </button>
      ) : tier === 'vip' ? (
        <button
          id="navbar-plan-badge-vip"
          onClick={onClickUpgrade}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-sm transition ${
            billingCycle === 'yearly'
              ? 'border-amber-400/80 bg-gradient-to-r from-purple-950 via-amber-950/40 to-purple-950 text-amber-200 ring-1 ring-amber-400/40'
              : 'border-purple-500/60 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 text-purple-200'
          }`}
          title={billingCycle === 'yearly' ? 'AZ OVERVERSE VIP Annual Pass (Active for 1 Year)' : 'AZ OVERVERSE VIP Monthly Pass'}
        >
          <Sparkles className={`w-3.5 h-3.5 ${billingCycle === 'yearly' ? 'text-yellow-400 fill-yellow-400 animate-pulse' : 'text-amber-400'}`} />
          <span>{billingCycle === 'yearly' ? 'VIP Annual' : 'VIP Member'}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-black ${
            billingCycle === 'yearly'
              ? 'text-black bg-gradient-to-r from-amber-400 to-yellow-300'
              : 'text-amber-300 bg-purple-950/80'
          }`}>
            {billingCycle === 'yearly' ? '1 YEAR PASS' : 'AD-FREE'}
          </span>
        </button>
      ) : tier === 'early_access' ? (
        <button
          id="navbar-plan-badge-early-access"
          onClick={onClickUpgrade}
          className="flex items-center gap-1.5 rounded-full border border-cyan-400/80 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 px-3 py-1 text-xs font-bold text-cyan-200 shadow-sm"
          title="Pro Early Access Member (7-14 Days Fast-Pass + Ad-Free)"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
          <span>Pro Fast-Pass</span>
          <span className="text-[10px] text-cyan-950 bg-cyan-300 px-1.5 py-0.5 rounded-md font-mono font-black">
            EARLY ACCESS
          </span>
        </button>
      ) : (
        <button
          id="navbar-plan-badge-patron"
          onClick={onClickUpgrade}
          className="flex items-center gap-1.5 rounded-full border border-rose-500/80 bg-gradient-to-r from-rose-950 via-purple-950 to-amber-950 px-3 py-1 text-xs font-bold text-amber-200 shadow-sm ring-1 ring-amber-400/30"
          title="Patron Pass Active (Exclusive Bonus Content + All Chapters + 70% Creator Revenue Share)"
        >
          <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span>Patron Creator</span>
          <span className="text-[10px] text-black bg-gradient-to-r from-amber-400 to-rose-400 px-1.5 py-0.5 rounded-md font-mono font-black">
            ALL-ACCESS
          </span>
        </button>
      )}

      {/* Quick Tier Tester Selector for reviewer convenience */}
      {onQuickToggleTier && (
        <div className="hidden xl:flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700 text-[10px]">
          <button
            id="quick-tier-free"
            onClick={() => onQuickToggleTier('free')}
            title="Switch to Free Reader (With ads)"
            className={`px-1.5 py-0.5 rounded font-medium transition ${
              tier === 'free'
                ? 'bg-amber-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Free
          </button>
          <button
            id="quick-tier-vip"
            onClick={() => onQuickToggleTier('vip', 'monthly')}
            title="Switch to VIP Ad-Free"
            className={`px-1.5 py-0.5 rounded font-medium transition ${
              tier === 'vip'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            VIP Ad-Free
          </button>
          <button
            id="quick-tier-early-access"
            onClick={() => onQuickToggleTier('early_access', 'monthly')}
            title="Switch to Pro Early Access"
            className={`px-1.5 py-0.5 rounded font-medium transition ${
              tier === 'early_access'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pro Early Access
          </button>
          <button
            id="quick-tier-patron"
            onClick={() => onQuickToggleTier('patron', 'yearly')}
            title="Switch to Patron (Exclusive Bonus Content)"
            className={`px-1.5 py-0.5 rounded font-medium transition ${
              tier === 'patron'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-black font-black'
                : 'text-rose-400 hover:text-white'
            }`}
          >
            Patron Gold
          </button>
        </div>
      )}
    </div>
  );
};
