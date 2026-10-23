import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KAAfricaLogo } from '../common/KAAfricaLogo';

export interface SplashScreenProps {
  /** Callback fired when the splash screen completes its animation / dismisses */
  onFinish?: () => void;
  /** Duration in milliseconds before auto-dismissing (default: 1800ms) */
  duration?: number;
  /** Whether to automatically dismiss after the duration */
  autoDismiss?: boolean;
  /** Whether to show a progress loading indicator */
  showProgress?: boolean;
  /** Custom classes */
  className?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 1800,
  autoDismiss = true,
  showProgress = true,
  className = '',
}) => {
  const [progress, setProgress] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        if (autoDismiss) {
          setIsDismissing(true);
          setTimeout(() => {
            onFinish?.();
          }, 350);
        }
      }
    }, 25);

    return () => clearInterval(interval);
  }, [duration, autoDismiss, onFinish]);

  const handleSkip = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onFinish?.();
    }, 200);
  };

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          key="az-oververse-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          onClick={handleSkip}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden bg-[#0a0d14] text-white ${className}`}
          role="dialog"
          aria-label="AZ OVERVERSE Splash Screen"
        >
          {/* Dark theme background radial glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_46%,#141c2e_0%,#0a0d14_65%,#05070a_100%)]" />

          {/* Ambient subtle rainbow spark glow */}
          <div className="absolute w-96 h-96 -translate-y-8 rounded-full bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-indigo-500/10 blur-3xl pointer-events-none animate-pulse" />

          {/* Main Logo Container */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center text-center px-4"
          >
            {/* Master Logo with Circular Rainbow Border */}
            <div className="relative mb-5 group">
              {/* Outer Ambient Glow */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-amber-500/30 via-rose-500/20 to-cyan-500/30 blur-2xl pointer-events-none animate-pulse" />

              {/* Master Logo Image */}
              <div className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-64 md:h-64 rounded-full overflow-hidden shadow-2xl shadow-black ring-2 ring-white/10 transform transition-transform duration-300 hover:scale-102">
                <img
                  src="/master-logo.png"
                  alt="AZ OVERVERSE Master Logo"
                  className="w-full h-full object-contain rounded-full select-none pointer-events-none"
                  loading="eager"
                />
              </div>
            </div>

            {/* Subtitle: PRODUCED BY MLUNGISENI MBHELE */}
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] text-slate-300 drop-shadow-sm mt-1">
              PRODUCED BY MLUNGISENI MBHELE
            </p>

            {/* Subtle rainbow / gold accent divider line */}
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full mt-3 opacity-80" />
          </motion.div>

          {/* Progress / Loading Bar Indicator */}
          {showProgress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="absolute bottom-12 z-10 flex flex-col items-center gap-2.5 w-64 max-w-[80vw]"
            >
              <div className="w-full h-1.5 rounded-full bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-inner p-[1px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-sm transition-all duration-75 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between w-full px-1 text-[10px] font-mono text-slate-500">
                <span className="tracking-wider">INITIALIZING</span>
                <span>{progress}%</span>
              </div>
            </motion.div>
          )}

          {/* Touch / Click to Skip Hint */}
          <div className="absolute bottom-4 z-10 text-[9px] tracking-widest text-slate-600 uppercase font-medium">
            Tap anywhere to skip
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
