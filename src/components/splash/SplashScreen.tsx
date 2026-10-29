import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';

export interface SplashScreenProps {
  /** Callback fired when the splash screen completes its animation / dismisses */
  onFinish?: () => void;
  /** Duration in milliseconds before auto-dismissing (default: 950ms) */
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
  duration = 950,
  autoDismiss = true,
  showProgress = true,
  className = '',
}) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const onFinishRef = useRef(onFinish);
  const dismissedRef = useRef(false);

  // Keep latest callback without restarting RAF timer when parent re-renders during boot
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    let rafId = 0;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const startTime = performance.now();

    const tick = (now: number) => {
      if (dismissedRef.current) return;
      const elapsed = now - startTime;
      const ratio = Math.min(Math.max(elapsed / duration, 0), 1);

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${ratio})`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.textContent = `${Math.round(ratio * 100)}%`;
      }

      if (ratio >= 1) {
        if (autoDismiss && !dismissedRef.current) {
          dismissedRef.current = true;
          setIsDismissing(true);
          finishTimer = setTimeout(() => {
            onFinishRef.current?.();
          }, 220);
        }
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [duration, autoDismiss]);

  const handleSkip = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setIsDismissing(true);
    setTimeout(() => {
      onFinishRef.current?.();
    }, 160);
  };

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          key="az-oververse-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleSkip}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden bg-[#0a0d14] text-white ${className}`}
          role="dialog"
          aria-label="AZ OVERVERSE Splash Screen"
        >
          {/* Dark theme background radial glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_46%,#141c2e_0%,#0a0d14_65%,#05070a_100%)]" />

          {/* Main Logo Container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center text-center px-4"
          >
            <div className="relative mb-5">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-amber-500/25 via-rose-500/15 to-cyan-500/25 blur-2xl pointer-events-none" />

              <div className="relative w-44 h-44 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-full overflow-hidden bg-black shadow-2xl shadow-black">
                <img
                  src={APP_LOGO_SRC}
                  alt="AZ OVERVERSE Master Logo"
                  className="w-full h-full object-contain rounded-full select-none pointer-events-none"
                  loading="eager"
                  decoding="sync"
                  {...{ fetchpriority: 'high' }}
                />
              </div>
            </div>

            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] text-slate-300 mt-1">
              PRODUCED BY MLUNGISENI MBHELE
            </p>

            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full mt-3 opacity-80" />
          </motion.div>

          {/* GPU-Composited Progress Bar (Zero React state re-renders per frame) */}
          {showProgress && (
            <div className="absolute bottom-12 z-10 flex flex-col items-center gap-2.5 w-64 max-w-[80vw]">
              <div className="w-full h-1.5 rounded-full bg-slate-900/90 border border-slate-800/80 overflow-hidden p-[1px]">
                <div
                  ref={progressBarRef}
                  className="h-full w-full origin-left rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 will-change-transform"
                  style={{ transform: 'scaleX(0)' }}
                />
              </div>

              <div className="flex items-center justify-between w-full px-1 text-[10px] font-mono tabular-nums text-slate-500">
                <span className="tracking-wider">READY</span>
                <span ref={progressTextRef}>0%</span>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 z-10 text-[10px] tracking-widest text-slate-500 uppercase font-medium">
            Tap anywhere to skip
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
