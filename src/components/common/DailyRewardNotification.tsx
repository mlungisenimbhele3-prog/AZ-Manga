import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Sparkles,
  Trophy,
  Coins,
  X,
  ChevronRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { DailyGoalReward } from '../../utils/readingStreak';

interface DailyRewardNotificationProps {
  onOpenProfileModal?: () => void;
}

export const DailyRewardNotification: React.FC<DailyRewardNotificationProps> = ({
  onOpenProfileModal,
}) => {
  const [activeReward, setActiveReward] = useState<DailyGoalReward | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleRewardEvent = (e: any) => {
      if (e.detail) {
        const reward: DailyGoalReward = e.detail;
        setActiveReward(reward);
        setIsVisible(true);
        setProgressPct(100);

        // Haptic feedback on supported mobile devices
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([40, 50, 40]);
          } catch (err) {
            // Ignore haptic failure
          }
        }

        // Clear previous timers
        if (timerRef.current) clearTimeout(timerRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

        const totalDurationMs = 6000;
        const intervalMs = 50;
        let elapsed = 0;

        progressIntervalRef.current = setInterval(() => {
          elapsed += intervalMs;
          const remaining = Math.max(0, 100 - (elapsed / totalDurationMs) * 100);
          setProgressPct(remaining);
          if (elapsed >= totalDurationMs) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          }
        }, intervalMs);

        timerRef.current = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setActiveReward(null), 300);
        }, totalDurationMs);
      }
    };

    window.addEventListener('ka_pulse_daily_goal_reward', handleRewardEvent);
    return () => {
      window.removeEventListener('ka_pulse_daily_goal_reward', handleRewardEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setTimeout(() => setActiveReward(null), 300);
  };

  if (!activeReward) return null;

  return (
    <aside
      aria-label="Daily reading goal reward"
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 transform transition-all duration-300 ease-out select-none ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-8 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/80 bg-gradient-to-br from-amber-950/95 via-slate-950/95 to-amber-900/90 p-4 text-white shadow-2xl backdrop-blur-xl ring-1 ring-amber-400/30">
        {/* Radiant top-right corner glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          {/* Animated Coin & Flame Badge */}
          <div className="relative flex-shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/30">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                <span className="text-xl animate-bounce">{activeReward.badge}</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black shadow ring-2 ring-slate-950">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                DAILY GOAL REWARD
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                🔥 {activeReward.streakDays}d Streak
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-black text-white mt-1 leading-tight tracking-tight">
              {activeReward.rewardTitle}
            </h4>

            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              {activeReward.rewardSubtitle}
            </p>

            {/* Coins & XP Pill Reward Chips */}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black font-mono">
                <Coins className="w-3 h-3 text-amber-400" />
                +{activeReward.bonusCoins} Coins
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black font-mono">
                <Zap className="w-3 h-3 text-purple-400" />
                +{activeReward.bonusXp} XP
              </span>
            </div>

            {/* Milestone Unlock Callout if applicable */}
            {activeReward.isMilestoneBonus && activeReward.milestoneTitle && (
              <div className="mt-2 flex items-center gap-1.5 p-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-[10px] text-amber-200 font-bold">
                <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                <span className="truncate">Unlocked Milestone: {activeReward.milestoneTitle}!</span>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Dismiss reward notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/10 text-xs">
          <button
            onClick={() => {
              handleDismiss();
              onOpenProfileModal?.();
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
          >
            <span>View Streak Milestones</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDismiss}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-95 text-black font-black text-[11px] shadow transition"
          >
            Claimed!
          </button>
        </div>

        {/* Auto-dismiss progress countdown line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-75 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
