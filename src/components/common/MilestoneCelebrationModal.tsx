import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Flame, Sparkles, X, Share2, CheckCircle2, Zap } from 'lucide-react';

export interface MilestoneCelebrationData {
  days: number; // 7, 30, or 100
  title: string;
  subtitle: string;
  badge: string;
  coinsReward: number;
  xpReward: number;
  perks: string[];
}

interface MilestoneCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: MilestoneCelebrationData | null;
  onShare?: () => void;
}

export const MILESTONE_CONFIGS: Record<number, MilestoneCelebrationData> = {
  7: {
    days: 7,
    title: 'WEEKLY BLAZE UNLOCKED! 🔥',
    subtitle: '7 Consecutive Days of Reading Complete',
    badge: '✨',
    coinsReward: 150,
    xpReward: 350,
    perks: [
      'Silver Reader Crown Badge',
      '+1 Streak Shield Freeze protection',
      'Exclusive Weekly Shonen Discussion flair',
    ],
  },
  30: {
    days: 30,
    title: 'MONTHLY TITAN ASCENSION! 👑',
    subtitle: '30 Consecutive Days of Relentless Reading',
    badge: '👑',
    coinsReward: 500,
    xpReward: 1200,
    perks: [
      'Monthly Sovereign Crown on Profile',
      'VIP Patron Reader Status for 30 Days',
      'Unlocks 3 Early Access Chapter Keys',
      'Eligible for Manga of the Year Community Jury',
    ],
  },
  100: {
    days: 100,
    title: 'CENTURION LEGENDARY TRIUMPH! 🏆',
    subtitle: '100 Consecutive Days of Pure Pan-African Manga Dedication',
    badge: '🏆',
    coinsReward: 2500,
    xpReward: 5000,
    perks: [
      'Permanent Hall of Fame Golden Plaque',
      'Golden Trophy Avatar Border & Flair',
      'Lifetime 10% Manga Coin Purchase Bonus',
      'Direct Creator Tipping Boost (2x Value)',
      'VIP Guest Ticket to MOTY Annual Gala',
    ],
  },
};

export const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  isOpen,
  onClose,
  milestone,
  onShare,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !milestone) return null;

  const isCenturion = milestone.days >= 100;
  const isTitan = milestone.days >= 30;

  return (
    <AnimatePresence>
      <div
        id="milestone-celebration-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Milestone Celebration"
      >
        {/* Dynamic dark backdrop with golden / prismatic radiance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Floating Confetti & Star Sparkles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
          {[...Array(24)].map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              initial={{
                opacity: 0,
                y: -20,
                x: `${(i * 4) % 100}vw`,
                scale: Math.random() * 0.7 + 0.5,
              }}
              animate={{
                opacity: [0, 1, 0.8, 0],
                y: ['0vh', '105vh'],
                rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
              }}
              transition={{
                duration: 3 + (i % 4) * 0.8,
                repeat: Infinity,
                delay: (i * 0.18) % 2.5,
                ease: 'linear',
              }}
              className="absolute text-xl"
            >
              {i % 4 === 0 ? '✨' : i % 4 === 1 ? '🎉' : i % 4 === 2 ? '⭐' : '🔥'}
            </motion.div>
          ))}
        </div>

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className={`relative z-20 w-full max-w-lg rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl border ${
            isCenturion
              ? 'border-yellow-400/80 bg-gradient-to-b from-amber-950 via-slate-950 to-black shadow-amber-500/30'
              : isTitan
              ? 'border-purple-500/80 bg-gradient-to-b from-purple-950 via-slate-950 to-black shadow-purple-500/30'
              : 'border-amber-500/80 bg-gradient-to-b from-orange-950 via-slate-950 to-black shadow-amber-500/30'
          }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Glowing Badge Crown */}
          <div className="relative mx-auto mb-4 flex h-28 w-28 items-center justify-center">
            {/* Pulsing ring aura */}
            <div
              className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
                isCenturion ? 'bg-amber-400' : isTitan ? 'bg-purple-400' : 'bg-orange-400'
              }`}
            />
            <div
              className={`relative flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl border-2 text-5xl ${
                isCenturion
                  ? 'border-yellow-300 bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-yellow-500/50'
                  : isTitan
                  ? 'border-purple-300 bg-gradient-to-tr from-purple-600 to-pink-500 shadow-purple-500/50'
                  : 'border-orange-300 bg-gradient-to-tr from-amber-500 to-orange-500 shadow-orange-500/50'
              }`}
            >
              <span>{milestone.badge}</span>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-1.5 mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{milestone.days}-DAY READING GOAL REACHED</span>
            </span>
            <h2 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wider text-white">
              {milestone.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">{milestone.subtitle}</p>
          </div>

          {/* Reward Badges Box */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Bonus Coins</span>
              <span className="text-2xl font-black text-amber-400 font-mono">+{milestone.coinsReward}</span>
              <span className="text-[10px] text-slate-400">Pulse Coins</span>
            </div>
            <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-3.5 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Reader XP</span>
              <span className="text-2xl font-black text-cyan-300 font-mono">+{milestone.xpReward}</span>
              <span className="text-[10px] text-slate-400">Experience Pts</span>
            </div>
          </div>

          {/* Perks list */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-left space-y-2 mb-6">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Perks Unlocked:
            </span>
            {milestone.perks.map((perk, idx) => (
              <div key={`perk-${idx}`} className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                onShare?.();
                onClose();
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Claim & Share Celebration</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Continue Reading
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
